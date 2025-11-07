import { ID, Permission, Query, Role } from 'appwrite';
import { config, databases, realtime, storage } from '../config/appwrite';

// --- INTERFACES ---
export interface ChatRoom {
  id: string;
  name: string;
  type: 'private' | 'group' | 'department';
  participants: string[];
  managerId?: string;
}

export interface IMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: Date;
  imageUrl?: string;
  fileUrl?: string;
}

// Subscription Type-safe
interface AppwriteSubscription {
  unsubscribe: () => void;
}

// --- SERVICE LOGIC ---
export const ChatService = {
  // ===========================
  // QUẢN LÝ PHÒNG CHAT
  // ===========================

  async findOrCreatePrivateChat(userId1: string, userId2: string): Promise<string> {
    const sortedIds = [userId1, userId2].sort();
    const privateRoomId = `private_${sortedIds[0]}_${sortedIds[1]}`;

    try {
      await databases.getDocument(config.databaseId, config.roomCollectionId, privateRoomId);
      return privateRoomId;
    } catch (_) {
      const roomData = {
        name: `Private Chat`,
        type: 'private',
        participants: sortedIds,
      };
      const permissions = [
        Permission.read(Role.user(userId1)),
        Permission.write(Role.user(userId1)),
        Permission.read(Role.user(userId2)),
        Permission.write(Role.user(userId2)),
      ];
      await databases.createDocument(
        config.databaseId,
        config.roomCollectionId,
        privateRoomId,
        roomData,
        permissions
      );
      return privateRoomId;
    }
  },

  async createDepartmentChat(managerId: string, managerName: string): Promise<string> {
    const departmentRoomId = `department_${managerId}`;
    try {
      const roomData = {
        name: `Phòng ban của ${managerName}`,
        type: 'department',
        participants: [managerId],
        managerId,
      };
      const permissions = [
        Permission.read(Role.user(managerId)),
        Permission.write(Role.user(managerId)),
        Permission.update(Role.user(managerId)),
        Permission.delete(Role.user(managerId)),
      ];
      await databases.createDocument(
        config.databaseId,
        config.roomCollectionId,
        departmentRoomId,
        roomData,
        permissions
      );
      return departmentRoomId;
    } catch (error: any) {
      if (error.code === 409) return departmentRoomId;
      console.error('Lỗi khi tạo phòng ban:', error);
      throw error;
    }
  },

  async addUserToDepartmentChat(userId: string, managerId: string) {
    const departmentRoomId = `department_${managerId}`;
    try {
      const room = await databases.getDocument(config.databaseId, config.roomCollectionId, departmentRoomId);
      const participants = room.participants as string[];
      if (!participants.includes(userId)) {
        const newParticipants = [...participants, userId];
        const permissions = (room.$permissions as string[]).concat(Permission.read(Role.user(userId)));
        await databases.updateDocument(
          config.databaseId,
          config.roomCollectionId,
          departmentRoomId,
          { participants: newParticipants },
          permissions
        );
      }
    } catch (error) {
      console.error(`Không tìm thấy phòng ban cho quản lý ${managerId} để thêm ${userId}`, error);
    }
  },

  async removeUserFromDepartmentChat(userId: string, managerId: string) {
    const departmentRoomId = `department_${managerId}`;
    try {
      const room = await databases.getDocument(config.databaseId, config.roomCollectionId, departmentRoomId);
      const participants = (room.participants as string[]).filter(p => p !== userId);
      const permissions = (room.$permissions as string[]).filter(
        p => p !== Permission.read(Role.user(userId))
      );
      await databases.updateDocument(
        config.databaseId,
        config.roomCollectionId,
        departmentRoomId,
        { participants },
        permissions
      );
    } catch (error) {
      console.error(`Lỗi khi xóa ${userId} khỏi phòng ban của ${managerId}`, error);
    }
  },

  async updateUserDepartmentChat(userId: string, oldManagerId: string | null, newManagerId: string | null) {
    if (oldManagerId) await this.removeUserFromDepartmentChat(userId, oldManagerId);
    if (newManagerId) await this.addUserToDepartmentChat(userId, newManagerId);
  },

  async getUserChatRooms(userId: string): Promise<ChatRoom[]> {
    const userRoomsResponse = await databases.listDocuments(
      config.databaseId,
      config.roomCollectionId,
      [Query.contains('participants', userId)]
    );

    // Phòng chung
    try {
      const generalRoom = await databases.getDocument(config.databaseId, config.roomCollectionId, 'general');
      if (!userRoomsResponse.documents.find(d => d.$id === 'general')) {
        userRoomsResponse.documents.push(generalRoom);
      }
    } catch {
      console.log('Phòng chat chung chưa được tạo.');
    }

    return userRoomsResponse.documents.map(doc => ({
      id: doc.$id,
      name: doc.name,
      type: doc.type,
      participants: doc.participants,
      managerId: doc.managerId,
    }));
  },

  // ===========================
  // QUẢN LÝ TIN NHẮN
  // ===========================

  async sendMessage(message: Omit<IMessage, 'id' | 'createdAt'>): Promise<void> {
    const messageData = {
      roomId: message.roomId,
      senderId: message.senderId,
      senderName: message.senderName,
      text: message.text,
      imageUrl: message.imageUrl,
      fileUrl: message.fileUrl,
    };

    const room = await databases.getDocument(config.databaseId, config.roomCollectionId, message.roomId);
    const permissions = (room.participants as string[]).map(pId => Permission.read(Role.user(pId)));
    if (message.roomId === 'general') permissions.push(Permission.read(Role.any()));

    await databases.createDocument(
      config.databaseId,
      config.messageCollectionId,
      ID.unique(),
      messageData,
      permissions
    );
  },

  onMessagesUpdate(roomId: string, callback: (messages: IMessage[]) => void): () => void {
    const fetchAndCallback = async () => {
      const response = await databases.listDocuments(
        config.databaseId,
        config.messageCollectionId,
        [Query.equal('roomId', roomId), Query.orderDesc('$createdAt'), Query.limit(50)]
      );
      const newMessages = response.documents.map(doc => ({
        id: doc.$id,
        roomId: doc.roomId,
        senderId: doc.senderId,
        senderName: doc.senderName,
        text: doc.text,
        createdAt: new Date(doc.$createdAt),
        imageUrl: doc.imageUrl,
        fileUrl: doc.fileUrl,
      }));
      callback(newMessages);
    };

    fetchAndCallback();

    const channel = `databases.${config.databaseId}.collections.${config.messageCollectionId}.documents`;
    const subscription = realtime.subscribe(channel, response => {
      if (response.events.includes('databases.*.collections.*.documents.*.create')) {
        const newMessage = response.payload as any;
        if (newMessage.roomId === roomId) fetchAndCallback();
      }
    }) as unknown as AppwriteSubscription;

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') subscription.unsubscribe();
    };
  },

  async uploadFile(uri: string, name: string): Promise<string> {
    const response = await fetch(uri);
    const blob = await response.blob();
    const file = new File([blob], name, { type: blob.type });

    const result = await storage.createFile(config.chatFilesBucketId, ID.unique(), file);
    return storage.getFileView(config.chatFilesBucketId, result.$id).toString();
  },
};
