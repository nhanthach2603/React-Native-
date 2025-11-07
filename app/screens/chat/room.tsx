// app/(tabs)/chat/room.tsx (ChatRoomScreen)

import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker'; // Sửa lỗi: Giữ lại import này
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Linking, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Sửa lỗi: Giữ lại import này
import { QuickNav } from '../../../components/QuickNav';
import { useAuth } from '../../../context/AuthContext';
import { ChatService, IMessage } from '../../../services/ChatService'; // Sửa: Import đúng IMessage
import { styles } from '../../../styles/homeStyle';

export default function ChatRoomScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { roomId, roomName } = params;

  const { user, currentUser } = useAuth(); // Lấy thêm currentUser để có displayName
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingAttachment, setIsSendingAttachment] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    
    // Hàm onMessagesUpdate của Appwrite sẽ trả về tin nhắn đã sắp xếp
    const unsubscribe = ChatService.onMessagesUpdate(roomId as string, (fetchedMessages) => {
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, [roomId]);


  const handleSend = async () => {
    if (newMessage.trim().length === 0 || !user || !roomId) return;

    const messageToSend: Omit<IMessage, 'id' | 'createdAt'> = {
      roomId: roomId as string,
      senderId: user.$id,
      senderName: currentUser?.name || 'Người dùng',
      text: newMessage.trim(),
    };

    setNewMessage(''); // Xóa text input ngay lập tức để cải thiện trải nghiệm người dùng
    try {
      await ChatService.sendMessage(messageToSend);
    } catch (e) {
      Alert.alert('Lỗi gửi tin', 'Không thể gửi tin nhắn.');
      console.error('Failed to send message:', e);
      setNewMessage(messageToSend.text); // Khôi phục lại tin nhắn nếu gửi lỗi
    }
  };

  const sendAttachment = async (uri: string, type: 'image' | 'file', name?: string) => {
    if (!user || !roomId) return;
    setIsSendingAttachment(true);
    try {
        const downloadURL = await ChatService.uploadFile(uri, type);

        const messageToSend: Omit<IMessage, 'id' | 'createdAt'> = {
            roomId: roomId as string,
            senderId: user.$id,
            senderName: currentUser?.name || 'Người dùng',
            text: name || (type === 'image' ? 'Đã gửi một hình ảnh' : 'Đã gửi một tệp tin'),
            imageUrl: type === 'image' ? downloadURL : undefined,
            fileUrl: type === 'file' ? downloadURL : undefined,
        };
        await ChatService.sendMessage(messageToSend);
    } catch (e) {
        Alert.alert('Lỗi tải lên', 'Không thể tải tệp tin lên server.');
        console.error(e);
    } finally {
        setIsSendingAttachment(false);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      await sendAttachment(result.assets[0].uri, 'image', 'Hình ảnh');
    }
  };

  const pickDocument = async () => {
    let result = await DocumentPicker.getDocumentAsync({});

    if (result.canceled === false && result.assets && result.assets.length > 0) {
        await sendAttachment(result.assets[0].uri, 'file', result.assets[0].name);
    }
  };


  const renderMessageContent = (item: IMessage) => {
    const isMyMessage = item.senderId === user?.$id;
    const textColor = isMyMessage ? '#fff' : '#1F2937';

    if (item.imageUrl) {
        return (
            <TouchableOpacity onPress={() => Linking.openURL(item.imageUrl!)}>
                <Image source={{ uri: item.imageUrl }} style={{ width: 200, height: 150, borderRadius: 10 }} />
                <Text style={[styles.chatStyles.messageText, {color: textColor, marginTop: 5}]}>
                  {item.text}
                </Text>
            </TouchableOpacity>
        );
    }
    if (item.fileUrl) {
        return (
             <TouchableOpacity onPress={() => Linking.openURL(item.fileUrl!)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="document-text" size={24} color={isMyMessage ? '#fff' : '#10B981'} />
                <Text style={[styles.chatStyles.messageText, { color: textColor, marginLeft: 10, maxWidth: 200 }]}>
                    {item.text}
                </Text>
             </TouchableOpacity>
        );
    }
    return <Text style={[styles.chatStyles.messageText, {color: textColor}]}>{item.text}</Text>;
  }
  
  const renderMessage = ({ item }: { item: IMessage }) => {
    const isMyMessage = item.senderId === user?.$id;
    const senderName = item.senderName || 'Người dùng'; // Tên người gửi đã có trong tin nhắn
    const messageTime = item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    
    return (
      <View style={[
        styles.chatStyles.messageContainer,
        isMyMessage ? styles.chatStyles.myMessageContainer : styles.chatStyles.theirMessageContainer
      ]}>
        <View style={[styles.chatStyles.messageBubble, isMyMessage ? styles.chatStyles.myMessageBubble : styles.chatStyles.theirMessageBubble]}>
          {!isMyMessage && <Text style={[styles.chatStyles.messageUser, {color: '#6B7280'}]}>{senderName}</Text>}
          {renderMessageContent(item)}
          <Text style={[styles.chatStyles.messageTime, {color: isMyMessage ? '#E5E7EB' : '#9CA3AF'}]}>{messageTime}</Text>
        </View>
      </View>
    );
  };
  
  return (
    <KeyboardAvoidingView 
      style={[styles.chatStyles.roomContainer, { paddingTop: insets.top }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Thêm dòng này để ẩn header mặc định */}
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.chatStyles.roomHeader}>
        <Text style={styles.chatStyles.roomTitle}>{roomName}</Text>
        <View style={{flex: 1, alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'flex-end'}}>
             <TouchableOpacity style={{marginRight: 10}} onPress={() => Alert.alert("Call Video", "Chức năng Video Call sẽ được tích hợp")}>
                <Ionicons name="videocam-outline" size={30} color="#EF4444" />
            </TouchableOpacity>
             <TouchableOpacity onPress={() => Alert.alert("Call Audio", "Chức năng Audio Call sẽ được tích hợp")}>
                <Ionicons name="call-outline" size={30} color="#3B82F6" />
            </TouchableOpacity>
        </View>
      </View>
      
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id!}
        renderItem={renderMessage}
        inverted
        style={styles.chatStyles.messageList}
        contentContainerStyle={{paddingBottom: 20}}
      />
      
      <View style={styles.chatStyles.inputContainer}>
        <TouchableOpacity 
            style={styles.chatStyles.attachmentButton} 
            onPress={() => Alert.alert("Gửi tệp tin", "Chọn loại tệp tin bạn muốn gửi", [
                {text: "Hình ảnh", onPress: pickImage},
                {text: "Tài liệu (File)", onPress: pickDocument},
                {text: "Hủy", style: 'cancel'}
            ])}
            disabled={isSendingAttachment}
        >
          {isSendingAttachment ? (
              <ActivityIndicator size="small" color="#3B82F6" />
          ) : (
              <Ionicons name="attach" size={24} color="#6B7280" />
          )}
        </TouchableOpacity>
        
        <TextInput
          style={styles.chatStyles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder={isSendingAttachment ? "Đang tải tệp tin..." : "Nhập tin nhắn..."}
          multiline
          editable={!isSendingAttachment}
        />
        <TouchableOpacity style={styles.chatStyles.sendButton} onPress={handleSend} disabled={isSendingAttachment || newMessage.length === 0}>
          <Ionicons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Thanh điều hướng nhanh */}
      <QuickNav />
    </KeyboardAvoidingView>
  );
}