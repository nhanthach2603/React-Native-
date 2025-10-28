// app/(tabs)/chat/room.tsx (ChatRoomScreen)

import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Linking, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';
import { ChatService, IMessage } from '../../../services/ChatService';
import { styles } from '../../../styles/homeStyle';

interface Message extends IMessage {
  file?: string;
}

export default function ChatRoomScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { roomId, roomName } = params;
  
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingAttachment, setIsSendingAttachment] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    
    const unsubscribe = ChatService.subscribeToChatMessages(roomId as string, (fetchedMessages) => {
      // [SỬA LỖI] Tạo một bản sao của mảng trước khi đảo ngược để tránh lỗi "read-only property"
      // bằng cách sử dụng spread operator `[...]`.
      const nativeMessages: Message[] = [...fetchedMessages].map(msg => ({
        _id: msg._id,
        text: msg.text,
        createdAt: msg.createdAt as Date,
        user: { _id: msg.user._id as string, name: msg.user.name as string },
        image: msg.image,
        file: (msg as any).file,
      })).reverse();
      
      setMessages(nativeMessages);
    });

    return () => unsubscribe();
  }, [roomId]);


  const handleSend = () => {
    if (newMessage.trim().length === 0 || !user) return;

    const msg: IMessage = {
      _id: Date.now().toString(),
      text: newMessage.trim(),
      createdAt: new Date(),
      user: {
        _id: user.uid,
        name: user.email?.split('@')[0] || 'User',
      },
    };

    ChatService.sendMessage(roomId as string, [msg])
      .then(() => setNewMessage(''))
      .catch((e) => Alert.alert('Lỗi gửi tin', 'Không thể gửi tin nhắn.'));
  };

  const sendAttachment = async (uri: string, type: 'image' | 'file', name?: string) => {
    if (!user || !roomId) return;
    setIsSendingAttachment(true);

    try {
        const downloadURL = await ChatService.uploadFile(uri, type);
        
        const textMessage = type === 'image' ? (name || "Đã gửi một hình ảnh.") : `[FILE] ${name || "Đã gửi một tài liệu."}`;
        
        const msg: IMessage = {
            _id: Date.now().toString(),
            text: textMessage,
            createdAt: new Date(),
            user: { _id: user.uid, name: user.email?.split('@')[0] || 'User' },
            image: type === 'image' ? downloadURL : undefined,
            file: type === 'file' ? downloadURL : undefined,
        };

        await ChatService.sendMessage(roomId as string, [msg]);
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


  const renderMessageContent = (item: Message) => {
    const isMyMessage = item.user._id === user?.uid;
    const textColor = isMyMessage ? '#fff' : '#1F2937';

    if (item.image) {
        return (
            <TouchableOpacity onPress={() => Linking.openURL(item.image!)}>
                <Image source={{ uri: item.image }} style={{ width: 200, height: 150, borderRadius: 10 }} />
                <Text style={[styles.chatStyles.messageText, {color: textColor, marginTop: 5}]}>
                  {item.text.includes("Hình ảnh") ? "" : item.text}
                </Text>
            </TouchableOpacity>
        );
    }
    if (item.file) {
        return (
             <TouchableOpacity onPress={() => Linking.openURL(item.file!)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="document-text" size={24} color={isMyMessage ? '#fff' : '#10B981'} />
                <Text style={[styles.chatStyles.messageText, { color: textColor, marginLeft: 10, maxWidth: 200 }]}>
                    {item.text.replace('[FILE]', '').trim()}
                </Text>
             </TouchableOpacity>
        );
    }
    return <Text style={[styles.chatStyles.messageText, {color: textColor}]}>{item.text}</Text>;
  }

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.user._id === user?.uid;
    return (
      <View style={[
        styles.chatStyles.messageContainer,
        isMyMessage ? styles.chatStyles.myMessageContainer : styles.chatStyles.theirMessageContainer
      ]}>
        <View style={[
          styles.chatStyles.messageBubble,
          isMyMessage ? styles.chatStyles.myMessageBubble : styles.chatStyles.theirMessageBubble
        ]}>
          <Text style={[styles.chatStyles.messageUser, {color: isMyMessage ? '#E5E7EB' : '#6B7280'}]}>{item.user.name}</Text>
          {renderMessageContent(item)}
          <Text style={[styles.chatStyles.messageTime, {color: isMyMessage ? '#E5E7EB' : '#9CA3AF'}]}>
            {item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
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
        keyExtractor={(item) => item._id}
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
    </KeyboardAvoidingView>
  );
}