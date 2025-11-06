// app/_index.tsx

import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { styles } from '../styles/homeStyle';

export default function Index() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (user) {
      router.replace('/screens'); // Chuyển hướng đến trang home nếu đã đăng nhập
    } else {
      router.replace('/(auth)'); // Chuyển hướng đến trang đăng nhập nếu chưa đăng nhập
    }
  }, [user, loading]);

  return (
    <View style={styles.homeStyles.loadingContainer}>
      <ActivityIndicator size="large" color="#10B981" />
      <Text style={styles.homeStyles.loadingText}>Đang tải...</Text>
    </View>
  );
}