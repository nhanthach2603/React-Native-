// d:\React-Native-\services\ChatService.ts
import { ID, Permission, Query, Role } from 'appwrite';
import { config, databases, realtime, storage } from '../config/appwrite';

// --- INTERFACES ---
export interface ChatRoom {
  id: string;
  name: string;
  type: 'private' | 'group' | 'department';
  participants: string[]; // Mảng các user ID
  managerId?: string; // Dùng cho phòng ban
}

export interface IMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string; // Thêm tên người gửi để hiển thị
  text: string;
  createdAt: Date;
  imageUrl?: string;
  fileUrl?: string;
}

// --- SERVICE LOGIC ---
export const ChatService = {
  // --- QUẢN LÝ PHÒNG CHAT ---

  /**
   * Tìm hoặc tạo phòng chat 1-1 giữa hai người dùng.
   */
  async findOrCreatePrivateChat(userId1: string, userId2: string): Promise<string> {
    const sortedIds = [userId1, userId2].sort();
    const privateRoomId = `private_${sortedIds[0]}_${sortedIds[1]}`;

    try {
      // Thử lấy phòng chat nếu đã tồn tại
      await databases.getDocument(config.databaseId, config.roomCollectionId, privateRoomId);
      return privateRoomId;
    } catch (error) {
      // Nếu không tồn tại (lỗi 404), tạo phòng mới
      const roomData = {
        name: `Private Chat`,
        type: 'private',
        participants: sortedIds,
      };
      // Quyền: chỉ 2 người tham gia mới được đọc/ghi
      const permissions = [
        Permission.read(Role.user(userId1)),
        Permission.write(Role.user(userId1)),
        Permission.read(Role.user(userId2)),
        Permission.write(Role.user(userId2)),
      ];
      await databases.createDocument(config.databaseId, config.roomCollectionId, privateRoomId, roomData, permissions);
      return privateRoomId;
    }
  },

  /**
   * Tạo phòng chat cho phòng ban khi một người được thăng chức quản lý.
   */
  async createDepartmentChat(managerId: string, managerName: string): Promise<string> {
    const departmentRoomId = `department_${managerId}`;
    try {
        const roomData = {
            name: `Phòng ban của ${managerName}`,
            type: 'department',
            participants: [managerId], // Ban đầu chỉ có quản lý
            managerId: managerId,
        };
        const permissions = [
            Permission.read(Role.user(managerId)),
            Permission.write(Role.user(managerId)),
            Permission.update(Role.user(managerId)),
            Permission.delete(Role.user(managerId)),
        ];
        await databases.createDocument(config.databaseId, config.roomCollectionId, departmentRoomId, roomData, permissions);
        return departmentRoomId;
    } catch (error) {
        if ((error as any).code === 409) { // Conflict
            return departmentRoomId;
        }
        console.error("Lỗi khi tạo phòng ban:", error);
        throw error;
    }
  },

  /**
   * Thêm một nhân viên vào phòng chat của phòng ban.
   */
  async addUserToDepartmentChat(userId: string, managerId: string) {
    const departmentRoomId = `department_${managerId}`;
    try {
        const room = await databases.getDocument(config.databaseId, config.roomCollectionId, departmentRoomId);
        const participants = room.participants as string[];
        if (!participants.includes(userId)) {
            const newParticipants = [...participants, userId];
            const permissions = room.$permissions.concat([Permission.read(Role.user(userId))]);
            await databases.updateDocument(config.databaseId, config.roomCollectionId, departmentRoomId, { participants: newParticipants }, permissions);
        }
    } catch (error) {
        console.error(`Không tìm thấy phòng ban cho quản lý ${managerId} để thêm ${userId}`, error);
    }
  },
  
  /**
   * Xóa một nhân viên khỏi phòng chat của phòng ban.
   */
  async removeUserFromDepartmentChat(userId: string, managerId: string) {
    const departmentRoomId = `department_${managerId}`;
    try {
        const room = await databases.getDocument(config.databaseId, config.roomCollectionId, departmentRoomId);
        const participants = (room.participants as string[]).filter(p => p !== userId);
        const permissions = (room.$permissions as string[]).filter(p => p !== Permission.read(Role.user(userId)));
        await databases.updateDocument(config.databaseId, config.roomCollectionId, departmentRoomId, { participants }, permissions);
    } catch (error) {
        console.error(`Lỗi khi xóa ${userId} khỏi phòng ban của ${managerId}`, error);
    }
  },

  /**
   * Cập nhật phòng ban cho nhân viên khi họ chuyển người quản lý.
   */
  async updateUserDepartmentChat(userId: string, oldManagerId: string | null, newManagerId: string | null) {
    if (oldManagerId) {
      await this.removeUserFromDepartmentChat(userId, oldManagerId);
    }
    if (newManagerId) {
      await this.addUserToDepartmentChat(userId, newManagerId);
    }
  },

  /**
   * Lấy danh sách các phòng chat mà người dùng tham gia.
   * Bao gồm cả phòng chung (general)
   */
  async getUserChatRooms(userId: string): Promise<ChatRoom[]> {
    // Lấy các phòng user là thành viên
    const userRoomsResponse = await databases.listDocuments(
      config.databaseId,
      config.roomCollectionId,
      [Query.contains('participants', userId)]
    );
    
    // Lấy phòng chung (general)
    try {
        const generalRoom = await databases.getDocument(config.databaseId, config.roomCollectionId, 'general');
        // Đảm bảo không bị trùng lặp nếu user cũng có trong participants của phòng general
        if (!userRoomsResponse.documents.find(d => d.$id === 'general')) {
            userRoomsResponse.documents.push(generalRoom);
        }
    } catch(e) {
        console.log("Phòng chat chung chưa được tạo.");
    }

    return userRoomsResponse.documents.map(doc => ({
      id: doc.$id,
      name: doc.name,
      type: doc.type,
      participants: doc.participants,
      managerId: doc.managerId,
    }));
  },

  // --- QUẢN LÝ TIN NHẮN ---

  /**
   * Gửi tin nhắn mới.
   */
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
    // Nếu là phòng chung, cho phép mọi user đọc
    if (message.roomId === 'general') {
        permissions.push(Permission.read(Role.any()));
    }

    await databases.createDocument(config.databaseId, config.messageCollectionId, ID.unique(), messageData, permissions);
  },

  /**
   * Lắng nghe tin nhắn mới trong một phòng chat (Realtime).
   */
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
    const unsubscribe = realtime.subscribe(channel, response => {
      if (response.events.includes('databases.*.collections.*.documents.*.create')) {
        const newMessage = response.payload as any;
        if (newMessage.roomId === roomId) {
            fetchAndCallback(); // Fetch lại để có danh sách mới nhất
        }
      }
    });

    return unsubscribe;
  },
  
  /**
   * Tải file lên Storage.
   */
  async uploadFile(uri: string, name: string): Promise<string> {
    const response = await fetch(uri);
    const blob = await response.blob();
    const file = new File([blob], name, { type: blob.type });

    const result = await storage.createFile(config.chatFilesBucketId, ID.unique(), file);
    
    const url = storage.getFileView(config.chatFilesBucketId, result.$id);
    return url.href;
  },
};