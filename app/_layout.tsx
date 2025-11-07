// app/_layout.tsx

import { SplashScreen, Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, LogBox, View } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { styles } from '../styles/homeStyle';

LogBox.ignoreLogs([
  'Your code tried to access the native implementation of '
]);

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(auth)');
      }
      SplashScreen.hideAsync();
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <View style={styles.homeStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="screens" />
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