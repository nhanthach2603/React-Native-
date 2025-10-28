// app/(auth)/index.tsx

import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router'; // Import Link và router
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const { login, loading } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const handleLogin = async () => {
    setError('');
    setIsLoggingIn(true);
    
    if (!email || !password) {
        setError('Vui lòng nhập đầy đủ Email và Mật khẩu.');
        setIsLoggingIn(false);
        return;
    }

    try {
      await login(email, password);
      
      // QUAN TRỌNG: Điều hướng thẳng về root index để kích hoạt logic phân quyền
      // Router sẽ nhận ra người dùng đã đăng nhập và chuyển hướng đến màn hình chính xác
      // Không cần replace ở đây nữa, AuthProvider sẽ xử lý
    } catch (e: any) {
      let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';
      
      switch (e.code) {
        case 'auth/invalid-email':
          errorMessage = 'Email không hợp lệ.';
          break;
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          errorMessage = 'Email hoặc mật khẩu không đúng.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.';
          break;
        default:
          errorMessage = 'Lỗi hệ thống: ' + e.message;
          break;
      }
      setError(errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const currentLoading = isLoggingIn || loading;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.logoContainer}>
        <Ionicons name="cube-sharp" size={64} color="#10B981" />
        <Text style={styles.title}>WMS - Quản Lý Kho</Text>
      </View>
      
      <View style={styles.formContainer}>
        <Text style={styles.subtitle}>Chào mừng trở lại</Text>

        <View style={styles.inputGroup}>
            <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.icon}/>
            <TextInput
                style={styles.input}
                placeholder="Email làm việc"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!currentLoading}
            />
        </View>

        <View style={styles.inputGroup}>
            <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.icon}/>
            <TextInput
                style={styles.input}
                placeholder="Mật khẩu"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!currentLoading}
            />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity 
          style={[styles.button, currentLoading && styles.buttonDisabled]} 
          onPress={handleLogin} 
          disabled={currentLoading}
        >
          {currentLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Đăng nhập</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>Chưa có tài khoản? </Text>
        <Link href="/register" asChild>
          <TouchableOpacity>
            <Text style={styles.registerLink}>Đăng ký ngay</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center', // Căn giữa nội dung
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 10,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    padding: 25,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    height: 55, // Tăng chiều cao
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  icon: {
    paddingHorizontal: 10,
    marginRight: 5,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#1F2937',
  },
  button: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12, // Đồng bộ bo góc
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 55, // Đồng bộ chiều cao
  },
  buttonDisabled: {
    backgroundColor: '#A7F3D0',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 14,
    fontWeight: '500',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  registerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  registerLink: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: 'bold',
  },
});