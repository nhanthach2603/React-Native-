// app/index.tsx

import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { styles } from '../styles/homeStyle';

export default function RootIndex() {
  // Lấy thêm currentUser để kiểm tra vai trò
  const { user, currentUser, loading } = useAuth();

  useEffect(() => {
    // Chỉ thực hiện điều hướng khi quá trình loading ban đầu đã hoàn tất
    if (loading) {
      return; // Nếu đang loading, không làm gì cả
    }

    if (user) {
      // Người dùng đã đăng nhập, kiểm tra vai trò để điều hướng.
      if (currentUser?.role === 'unassigned') {
        // Nếu chưa có vai trò, chuyển đến màn hình chờ duyệt
        router.replace('/pending');
      } else {
        // Nếu có vai trò hợp lệ, chuyển đến layout tab chính
        // Điều hướng đến layout group (tabs), Expo Router sẽ tự động hiển thị màn hình đầu tiên.
        router.replace('/screens'); // Sửa: Điều hướng đến group 'screens', tab 'home' sẽ tự động hiển thị
      }
    } else {
      // Người dùng chưa đăng nhập, chuyển đến màn hình xác thực.
      // Lệnh này chỉ nên chạy một lần khi ứng dụng khởi động và phát hiện chưa có ai đăng nhập,
      // hoặc khi người dùng đăng xuất. Nó sẽ không chạy lại sau mỗi lần đăng nhập thất bại
      // và do đó không làm mất state `error` của màn hình Login.
      router.replace('/(auth)');
    }
  }, [user, currentUser, loading]);

  // Hiển thị loading trong khi chờ Auth Context xác định trạng thái
  if (loading) {
    return (
      <View style={styles.homeStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.homeStyles.loadingText}>Đang xác thực...</Text>
      </View>
    );
  }

  // Fallback an toàn (không bao giờ nên xảy ra nếu logic trên hoạt động)
  return null; 
}