// app/pending.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { styles } from '../styles/homeStyle';

export default function PendingScreen() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    // Sau khi đăng xuất, quay về màn hình đăng nhập
    router.replace('/(auth)');
  };

  return (
    <View style={styles.authStyles.pendingContainer}>
      <Ionicons name="time-outline" size={80} color="#F59E0B" />
      <Text style={styles.authStyles.pendingTitle}>Tài khoản đang chờ duyệt</Text>
      <Text style={styles.authStyles.pendingMessage}>
        Tài khoản của bạn đã được tạo thành công nhưng cần được quản trị viên cấp quyền truy cập.
      </Text>
      <Text style={styles.authStyles.pendingMessage}>
        Vui lòng liên hệ bộ phận nhân sự để hoàn tất quá trình.
      </Text>
      <TouchableOpacity style={styles.authStyles.pendingButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="white" />
        <Text style={styles.authStyles.pendingButtonText}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
}
