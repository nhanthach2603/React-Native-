// app/pending.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '../context/AuthContext';

export default function PendingScreen() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    // Sau khi đăng xuất, quay về màn hình đăng nhập
    router.replace('/(auth)');
  };

  return (
    <View style={styles.container}>
      <Ionicons name="time-outline" size={80} color="#F59E0B" />
      <Text style={styles.title}>Tài khoản đang chờ duyệt</Text>
      <Text style={styles.message}>
        Tài khoản của bạn đã được tạo thành công nhưng cần được quản trị viên cấp quyền truy cập.
      </Text>
      <Text style={styles.message}>
        Vui lòng liên hệ bộ phận nhân sự để hoàn tất quá trình.
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFBEB',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#B45309', marginTop: 20, textAlign: 'center' },
  message: { fontSize: 16, color: '#D97706', textAlign: 'center', marginTop: 10 },
  button: {
    marginTop: 30,
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
