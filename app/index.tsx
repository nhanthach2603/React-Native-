// app/index.tsx

import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { styles } from '../styles/homeStyle';

export default function RootIndex() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      // Sửa logic: Chỉ cần kiểm tra xem người dùng đã đăng nhập hay chưa (user object có tồn tại không).
      // Việc chuyển hướng dựa trên vai trò sẽ được xử lý bên trong (tabs).
      if (user) {
        // Nếu đã đăng nhập, chuyển đến khu vực chính của ứng dụng.
        router.replace('/(tabs)/home');
      } else {
        // Chuyển hướng người dùng chưa đăng nhập đến màn hình Auth
        router.replace('/(auth)');
      }
    }
  }, [loading, user]); // Thay đổi dependency thành `user`

  // Hiển thị loading trong khi chờ Auth Context xác định trạng thái
  if (loading) {
    return (
      <View style={styles.homeStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  // Fallback an toàn (không bao giờ nên xảy ra nếu logic trên hoạt động)
  return null; 
}