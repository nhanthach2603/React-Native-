// app/(auth)/register.tsx
import { router } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { auth, db } from '../../config/firebase';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
    <View style={styles.container}>
      <Text style={styles.title}>Tạo tài khoản mới</Text>
      <TextInput
        style={styles.input}
        placeholder="Họ và Tên"
        value={displayName}
        onChangeText={setDisplayName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Số điện thoại"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Ngày sinh (YYYY-MM-DD)"
        value={dateOfBirth}
        onChangeText={setDateOfBirth}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Xác nhận mật khẩu"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      {loading ? (
        <ActivityIndicator size="large" color="#10B981" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Đăng ký</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.linkText}>Quay lại Đăng nhập</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#F9FAFB' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 30, color: '#1F2937' },
  input: {
    height: 50,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: 'white',
  },
  button: { backgroundColor: '#10B981', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  linkText: { color: '#3B82F6', textAlign: 'center', marginTop: 20 },
});
