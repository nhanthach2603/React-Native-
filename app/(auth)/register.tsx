// app/(auth)/register.tsx
import { Ionicons } from '@expo/vector-icons';
import { Link, router, Stack } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { auth, db } from '../../config/firebase';
import { styles } from '../../styles/homeStyle';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const handleRegister = async () => {
    if (!email || !password || !displayName || !confirmPassword || !phoneNumber || !dateOfBirth) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu và xác nhận mật khẩu không khớp.');
      return;
    }
    setLoading(true);
    try {
      // Bước 1: Tạo người dùng trong Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Bước 2: Cập nhật displayName cho hồ sơ Authentication
      await updateProfile(user, { displayName });

      // Bước 3: Tạo hồ sơ người dùng trong Firestore
      const newUserProfile = {
        email: user.email,
        displayName: displayName, // Sử dụng tên người dùng đã nhập
        phoneNumber: phoneNumber,
        dateOfBirth: dateOfBirth,
        role: 'unassigned',
        managerId: 'new',
        monthlyHours: 0,
        monthlySalary: 0,
        schedule: {},
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'user', user.uid), newUserProfile);

      // Đăng ký thành công, tự động chuyển đến màn hình chính
      // AuthProvider sẽ xử lý việc đăng nhập và chuyển hướng
      router.replace('/(tabs)/home');

    } catch (error: any) {
      console.error('Lỗi đăng ký:', error);
      Alert.alert('Đăng ký thất bại', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.authStyles.registerContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Ẩn thanh tiêu đề mặc định của navigator */}
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.authStyles.formContainer}>
        <Text style={styles.authStyles.title}>Tạo tài khoản mới</Text>
        <View style={styles.authStyles.inputGroup}>
          <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.authStyles.icon} />
          <TextInput
            style={styles.authStyles.input}
            placeholder="Họ và Tên"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
          />
        </View>
        <View style={styles.authStyles.inputGroup}>
          <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.authStyles.icon} />
          <TextInput
            style={styles.authStyles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
        <View style={styles.authStyles.inputGroup}>
          <Ionicons name="call-outline" size={20} color="#6B7280" style={styles.authStyles.icon} />
          <TextInput
            style={styles.authStyles.input}
            placeholder="Số điện thoại"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
        </View>
        <View style={styles.authStyles.inputGroup}>
          <Ionicons name="calendar-outline" size={20} color="#6B7280" style={styles.authStyles.icon} />
          <TextInput
            style={styles.authStyles.input}
            placeholder="Ngày sinh (YYYY-MM-DD)"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
          />
        </View>
        <View style={styles.authStyles.inputGroup}>
          <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.authStyles.icon} />
          <TextInput
            style={styles.authStyles.input}
            placeholder="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
        <View style={styles.authStyles.inputGroup}>
          <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.authStyles.icon} />
          <TextInput
            style={styles.authStyles.input}
            placeholder="Xác nhận mật khẩu"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>
        <TouchableOpacity style={[styles.authStyles.button, loading && styles.authStyles.buttonDisabled]} onPress={handleRegister} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.authStyles.buttonText}>Đăng ký</Text>
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.authStyles.loginContainer}>
        <Text style={styles.authStyles.loginText}>Đã có tài khoản? </Text>
        <Link href="/(auth)" asChild>
          <TouchableOpacity>
            <Text style={styles.authStyles.loginLink}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}
