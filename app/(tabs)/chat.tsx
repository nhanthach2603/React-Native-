// app/(tabs)/chat.tsx (ChatListScreen)

import { Ionicons } from '@expo/vector-icons';
import { Query } from 'appwrite';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { config, databases, functions } from '../../config/appwrite';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../styles/homeStyle';


// --- MÀN HÌNH DANH SÁCH CHAT ---

export interface ChatRoom {
  id: string; // $id
  name: string;
  type: 'group' | 'department' | 'private';
  participants: string[];
}

// Định nghĩa kiểu dữ liệu cho Document phòng chat để tiện sử dụng
// Appwrite Document bao gồm các trường tùy chỉnh và metadata ($id, $createdAt,...)

export default function ChatListScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 2. Lấy danh sách phòng chat của tôi
  const fetchChatRooms = useCallback(async () => {
		if (!user?.$id) {
			setLoading(false);
			return;
		}
    setLoading(true);
    try {
      // Sử dụng Query.contains để tìm kiếm ID user trong mảng participants
      const response = await databases.listDocuments(config.databaseId, config.roomCollectionId, [
        Query.contains('participants', user.$id)
      ]);
        
      // [ĐÃ SỬA LỖI]: Ánh xạ rõ ràng các trường từ Appwrite Document sang ChatRoom
      const rooms: ChatRoom[] = response.documents.map(doc => {
         return {
             id: doc.$id,
             name: doc.name,
             type: doc.type,
             participants: doc.participants,
         };
      });
      
      setChatRooms(rooms);
    } catch (error) {
      console.error("Lỗi khi tải phòng chat:", error);
    }
    setLoading(false);
  }, [user?.$id]); // Thêm dependencies

  useEffect(() => {
    fetchChatRooms();
  }, [fetchChatRooms]);

  // Lấy danh sách tất cả người dùng để tìm kiếm
  const [allUsers, setAllUsers] = useState<{ id: string, name: string }[]>([]);
  useEffect(() => {
    const fetchUsers = async () => {
        try {
          // Lấy trường name và $id
          const response = await databases.listDocuments(config.databaseId, config.userCollectionId, [
            Query.select(['name', '$id']), // Tối ưu hóa truy vấn
            Query.limit(100)
          ]);
          setAllUsers(response.documents.map(u => ({ id: u.$id, name: (u as unknown as {name: string}).name })));
        } catch (e) {
          console.error("Lỗi khi tải danh sách người dùng:", e);
        }
    };
    fetchUsers(); // Thêm dependencies
  }, []);

  // 3. Xử lý khi nhấn vào Chat Item
  const handlePressChat = (roomId: string, roomName: string) => {
    // Chuyển hướng đến màn hình chat chi tiết
    router.push({
      pathname: '/screens/chat/room',
      params: { 
        roomId: roomId, 
        roomName: roomName 
      },
    });
  };

  // 4. Xử lý tìm kiếm và tạo Chat 1-1
  const handleUserSearchSelect = async (selectedUserId: string, selectedUserName: string) => {
    if (!user?.$id || selectedUserId === user.$id) return;
    
    setSearchVisible(false); // Đóng thanh tìm kiếm
    setSearchQuery('');

    // Tìm hoặc tạo phòng chat riêng tư bằng Appwrite Function
    try {
      const execution = await functions.createExecution('findOrCreatePrivateChat', JSON.stringify({
        userId1: user.$id,
        userId2: selectedUserId
      }));

      // Kiểm tra execution response
      // [SỬA] Sử dụng responseStatusCode và responseBody
      if (execution.status !== 'completed' || execution.responseStatusCode !== 200) {
        throw new Error(JSON.parse(execution.responseBody).message || "Lỗi khi tạo phòng chat từ Function.");
      }
      

    } catch (error) {
      console.error("Lỗi khi gọi Appwrite Function:", error);
      // Hiển thị thông báo lỗi cho người dùng nếu cần
    }
  };


  // 5. Render Chat Item
  const renderItem = ({ item }: { item: ChatRoom }) => {
    let roomName = item.name;
    const isGroup = item.type === 'group' || item.type === 'department';
    let icon: keyof typeof Ionicons.glyphMap = "chatbubble";

    if (item.id === 'general') { // Giả sử phòng chat chung có ID là 'general'
        icon = "globe-outline";
    } else if (item.type === 'department') {
        icon = "business";
    } else if (isGroup) {
        icon = "people";
    } else {
        icon = "person";
        // Đối với chat 1-1, tìm tên người còn lại
        const otherUserId = item.participants.find(id => id !== user?.$id);
        const otherUser = allUsers.find(u => u.id === otherUserId);
        roomName = otherUser?.name || 'Chat Riêng';
    }

    return (
      <TouchableOpacity 
        style={styles.chatStyles.chatItem} 
        onPress={() => handlePressChat(item.id, roomName)}
      >
        <View style={[styles.chatStyles.avatarContainer]}>
          <View style={[styles.chatStyles.avatar, {backgroundColor: isGroup ? '#F59E0B' : '#3B82F6'}]}>
             <Ionicons name={icon} size={24} color="#FFFFFF" />
          </View>
        </View>
        <View style={styles.chatStyles.chatInfo}>
          <Text style={styles.chatStyles.chatName}>{roomName}</Text>
          {/* Logic hiển thị tin nhắn cuối cùng sẽ cần được thêm vào nếu bạn lưu nó trong document phòng chat */}
          <Text style={styles.chatStyles.lastMessage} numberOfLines={1}>Nhấp vào để xem tin nhắn...</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    );
  };
  
  const filteredUsers = allUsers
    .filter(u => u.id !== user?.$id && u.name.toLowerCase().includes(searchQuery.toLowerCase()));


  if (loading) {
    return (
      <View style={[styles.chatStyles.loadingContainer, { paddingTop: insets.top + 20 }]}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={{marginTop: 10, color: '#6B7280'}}>Đang tải danh sách phòng chat...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.chatStyles.listContainer, { paddingTop: insets.top }]}>
      
      {/* Header */}
      <View style={styles.chatStyles.header}>
        <Text style={styles.chatStyles.headerTitle}>Giao tiếp nội bộ</Text>
        <TouchableOpacity onPress={() => setSearchVisible(!isSearchVisible)}>
            <Ionicons name={isSearchVisible ? "close-circle-outline" : "search"} size={28} color="#3B82F6" />
        </TouchableOpacity>
      </View>
      
      {/* Thanh tìm kiếm */}
      {isSearchVisible && (
        <View style={{padding: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB'}}>
            <TextInput
                style={{height: 45, backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 15, fontSize: 16}}
                placeholder="Tìm kiếm người dùng để chat riêng..."
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
        </View>
      )}

      {/* Kết quả tìm kiếm (Chat 1-1) */}
      {isSearchVisible && searchQuery.length > 0 && (
          <FlatList
              data={filteredUsers}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                  <TouchableOpacity 
                      style={[styles.chatStyles.chatItem, {paddingVertical: 12, backgroundColor: '#E0F2F1'}]}
                      onPress={() => handleUserSearchSelect(item.id, item.name)}
                  >
                      <Ionicons name="person-add-outline" size={24} color="#0E7490" style={{marginRight: 15}} />
                      <Text style={styles.chatStyles.chatName}>Chat riêng với {item.name}</Text>
                  </TouchableOpacity>
              )}
              style={{maxHeight: 150, borderBottomWidth: 1, borderBottomColor: '#E5E7EB'}}
          />
      )}

      {/* Danh sách phòng chat */}
      <FlatList
        data={chatRooms}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={() => (
          <Text style={{textAlign: 'center', marginTop: 50, color: '#9CA3AF'}}>
            Bạn chưa tham gia phòng chat nào.
          </Text>
        )}
      />
    </View>
  );
}