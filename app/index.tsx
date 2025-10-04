// app/index.tsx

import { router } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { styles } from '../styles/homeStyle';

export default function RootIndex() {
  const { user, role, loading } = useAuth();
  
  const isAuthenticated = !!user && !!role && role !== 'unassigned' && role !== 'error';

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        // Chuyển hướng người dùng đã xác thực đến màn hình chính
        router.replace('/(tabs)/home');
      } else {
        // Chuyển hướng người dùng chưa đăng nhập đến màn hình Auth
        router.replace('../(auth)/index');
      }
    }
  }, [loading, isAuthenticated]);

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