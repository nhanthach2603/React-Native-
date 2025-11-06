// app/_layout.tsx

import { SplashScreen, Stack } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, LogBox, View } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { styles } from '../styles/homeStyle';

LogBox.ignoreLogs([
  'Your code tried to access the native implementation of '
]);

function RootLayoutNav() {
  const { loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  if (loading) {
    return (
      <View style={styles.homeStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }
  
  // KHÔNG CÓ LOGIC CHUYỂN HƯỚNG TẠI ĐÂY NỮA

  return (
    <Stack
      // Thêm screenOptions để ẩn header cho tất cả các màn hình trong Stack này theo mặc định
      screenOptions={{ headerShown: false }}
    >
      {/* Route gốc sẽ được xử lý bởi app/index.tsx */}
      <Stack.Screen name="index" /> 
      
      {/* Khai báo các nhóm route của bạn */}
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="screens" />
      {/* Khai báo các màn hình đơn lẻ ở thư mục gốc app/ */}
      <Stack.Screen name="picking" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}