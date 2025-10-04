// services/ChatService.ts

import {
  collection,
  query,
  onSnapshot,
  addDoc,
  orderBy,
  limit,
  serverTimestamp,
  QuerySnapshot,
  DocumentData,
  Timestamp,
  doc,
  getDoc,
  where,
  getDocs,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, app, storage } from '../config/firebase'; // Đã thêm storage

export interface ChatRoom {
  id: string;
  name: string;
  type: 'group' | 'private';
  participants: string[]; 
}

export interface UserChatInfo {
  _id: string;
  name: string;
}

export interface IMessage {
  _id: string;
  text: string;
  createdAt: Date;
  user: { _id: string; name: string };
  image?: string;
  file?: string;
  video?: string;
}

export class ChatService {
  // --- HÀM MỚI: TẢI TỆP TIN LÊN FIREBASE STORAGE ---
  static async uploadFile(uri: string, type: 'image' | 'file'): Promise<string> {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Tạo đường dẫn file: chats/files/{timestamp}-{filename}
    const filename = `${Date.now()}-${uri.substring(uri.lastIndexOf('/') + 1)}`;
    const storageRef = ref(storage, `chats/${type}s/${filename}`);

    const snapshot = await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  }
  // ----------------------------------------------------

  static async getUserChatRooms(userId: string): Promise<ChatRoom[]> {
    if (!userId) return [];
    try {
      const userDocRef = doc(db, 'user', userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const q = query(collection(db, 'chats'), where('participants', 'array-contains', userId));
        const chatRoomsSnapshot = await getDocs(q);
        
        const chatRooms: ChatRoom[] = chatRoomsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ChatRoom));
        
        return chatRooms;
      }
      return [];
    } catch (e) {
      console.error('Lỗi khi lấy danh sách phòng chat:', e);
      return [];
    }
  }

  static subscribeToChatMessages(chatId: string, onMessagesLoadedCallback: (messages: IMessage[]) => void) {
    if (!chatId) return () => {};

    const messagesCollection = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesCollection, orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot: QuerySnapshot<DocumentData>) => {
        const messages: IMessage[] = querySnapshot.docs.map(doc => {
          const data = doc.data() as any;
          return {
            _id: doc.id,
            text: data.text,
            createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
            user: { _id: data.user.id, name: data.user.name },
            image: data.image,
            file: data.file,
            video: data.video,
          } as IMessage;
        });
        onMessagesLoadedCallback(messages);
      },
      (error) => {
        console.error('Lỗi khi lắng nghe tin nhắn:', error);
      }
    );
    return unsubscribe;
  }

  static async sendMessage(chatId: string, messages: IMessage[]) {
    if (!chatId || messages.length === 0) return;

    const message = messages[0];
    const messageDoc = {
      text: message.text || null,
      createdAt: serverTimestamp(),
      user: { id: message.user._id, name: message.user.name },
      image: message.image || null,
      file: (message as any).file || null,
      video: message.video || null,
    };

    try {
      const messagesCollection = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesCollection, messageDoc);
    } catch (e) {
      throw new Error('Không thể gửi tin nhắn.');
    }
  }

  static async findOrCreatePrivateChat(currentUserId: string, otherUserId: string, currentUserEmail: string, otherUserEmail: string): Promise<string> {
    const chatsCollection = collection(db, 'chats');

    const q = query(
      chatsCollection,
      where('type', '==', 'private'),
      where('participants', 'array-contains-any', [currentUserId, otherUserId])
    );
    const chatsSnapshot = await getDocs(q);

    let chatId = '';

    chatsSnapshot.forEach(doc => {
      const chat = doc.data();
      if (chat.participants.length === 2 && chat.participants.includes(currentUserId) && chat.participants.includes(otherUserId)) {
        chatId = doc.id;
      }
    });

    if (chatId) {
      return chatId;
    } else {
      const newChatDoc = await addDoc(chatsCollection, {
        type: 'private',
        participants: [currentUserId, otherUserId],
        name: `${currentUserEmail.split('@')[0]} - ${otherUserEmail.split('@')[0]}`,
        createdAt: serverTimestamp(),
      });
      return newChatDoc.id;
    }
  }
}