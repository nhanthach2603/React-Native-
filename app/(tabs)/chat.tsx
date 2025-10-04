// app/(tabs)/chat.tsx (ChatListScreen)

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { ChatRoom, ChatService } from '../../services/ChatService';
import { router } from 'expo-router';
import { styles } from '../../styles/homeStyle';
import { db } from '../../config/firebase';
import { collection, getDocs } from 'firebase/firestore';


// --- MÀN HÌNH DANH SÁCH CHAT ---

export default function ChatListScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [allUsers, setAllUsers] = useState<{ [uid: string]: string }>({}); // Map UID to DisplayName
  const [loading, setLoading] = useState(true);
  const [isSearchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Lấy danh sách tất cả người dùng (cho Chat 1-1)
  const fetchAllUsers = async () => {
    try {
        const usersSnapshot = await getDocs(collection(db, 'user'));
        const userMap: { [uid: string]: string } = {};
        usersSnapshot.docs.forEach(doc => {
            if (doc.id !== user?.uid) { // Loại bỏ user hiện tại
                userMap[doc.id] = doc.data().displayName || doc.data().email.split('@')[0];
            }
        });
        setAllUsers(userMap);
    } catch (e) {
        console.error("Lỗi khi lấy danh sách user:", e);
    }
  };

  // 2. Lấy danh sách phòng chat của tôi
  const fetchChatRooms = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    await fetchAllUsers(); // Lấy user trước
    const rooms = await ChatService.getUserChatRooms(user.uid);
    setChatRooms(rooms);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchChatRooms();
  }, [fetchChatRooms]);


  // 3. Xử lý khi nhấn vào Chat Item
  const handlePressChat = (roomId: string, roomName: string) => {
    // Chuyển hướng đến màn hình chat chi tiết
    router.push({
      pathname: '/(tabs)/chat/room',
      params: { 
        roomId: roomId, 
        roomName: roomName 
      },
    });
  };

  // 4. Xử lý tìm kiếm và tạo Chat 1-1
  const handleUserSearchSelect = async (selectedUserId: string, selectedUserName: string) => {
    if (!user?.uid || selectedUserId === user.uid) return;
    
    setSearchVisible(false); // Đóng thanh tìm kiếm
    setSearchQuery('');

    // Tìm hoặc tạo phòng chat riêng tư
    const chatId = await ChatService.findOrCreatePrivateChat(
        user.uid, 
        selectedUserId, 
        user.email || 'Tôi', 
        selectedUserName
    );

    // Chuyển hướng đến phòng chat mới
    router.push({
      pathname: '/(tabs)/chat/room',
      params: { 
        roomId: chatId, 
        roomName: selectedUserName 
      },
    });

    // Sau khi tạo xong, refresh list phòng chat
    fetchChatRooms();
  };


  // 5. Render Chat Item
  const renderItem = ({ item }: { item: ChatRoom }) => {
    let roomName = item.name;
    const isGroup = item.type === 'group';

    if (!isGroup) {
        const otherUserId = item.participants.find(id => id !== user?.uid);
        roomName = otherUserId ? allUsers[otherUserId] || 'Chat Riêng' : 'Chat Riêng';
    }

    return (
      <TouchableOpacity 
        style={styles.chatStyles.chatItem} 
        onPress={() => handlePressChat(item.id, roomName)}
      >
        <View style={[styles.chatStyles.avatarContainer]}>
          <View style={[styles.chatStyles.avatar, {backgroundColor: isGroup ? '#F59E0B' : '#3B82F6'}]}>
             <Ionicons name={isGroup ? "people" : "person"} size={24} color="#FFFFFF" />
          </View>
        </View>
        <View style={styles.chatStyles.chatInfo}>
          <Text style={styles.chatStyles.chatName}>{roomName}</Text>
          <Text style={styles.chatStyles.lastMessage} numberOfLines={1}>Nhấp vào để xem tin nhắn...</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    );
  };
  
  const filteredUsers = Object.entries(allUsers)
    .filter(([uid, name]) => name.toLowerCase().includes(searchQuery.toLowerCase()))
    .map(([uid, name]) => ({ uid, name }));


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
              keyExtractor={item => item.uid}
              renderItem={({ item }) => (
                  <TouchableOpacity 
                      style={[styles.chatStyles.chatItem, {paddingVertical: 12, backgroundColor: '#E0F2F1'}]}
                      onPress={() => handleUserSearchSelect(item.uid, item.name)}
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