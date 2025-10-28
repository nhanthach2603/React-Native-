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
  
  const loaded = true; 
  const error = null;

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && !loading) {
      SplashScreen.hideAsync();
    }
  }, [loaded, loading]);

  if (!loaded || loading) {
    return (
      <View style={styles.homeStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }
  
  // KHÔNG CÓ LOGIC CHUYỂN HƯỚNG TẠI ĐÂY NỮA

  return (
    <Stack>
      {/* Route gốc sẽ được xử lý bởi app/index.tsx */}
      <Stack.Screen name="index" options={{ headerShown: false }} /> 
      
      {/* Các nhóm màn hình chính */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/index" options={{ headerShown: false }} /> 
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