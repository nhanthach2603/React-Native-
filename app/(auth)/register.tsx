// app/(auth)/register.tsx
import { Ionicons } from '@expo/vector-icons';
import { Link, router, Stack } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'; // Đảm bảo ScrollView được import từ 'react-native'
import { Calendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserService } from '../../services/UserService';
import { COLORS, styles } from '../../styles/homeStyle';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCalendarVisible, setCalendarVisible] = useState(false);
  const [isPasswordVisible, setPasswordVisible] = useState(false); // State để ẩn/hiện mật khẩu
  const [error, setError] = useState(''); // Thêm state để lưu lỗi
  const insets = useSafeAreaInsets();

  const handleRegister = async () => {
    setError(''); // Reset lỗi mỗi khi bấm nút
    if (!email || !password || !displayName || !confirmPassword || !phoneNumber || !dateOfBirth) {
      setError('Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu và xác nhận mật khẩu không khớp.');
      return;
    }
    // Bắt lỗi định dạng ngày sinh
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateOfBirth)) {
      setError('Định dạng ngày sinh không hợp lệ. Vui lòng chọn lại từ lịch.');
      return;
    }
    // [SỬA] Sửa lại regex để xác thực đúng định dạng số điện thoại Việt Nam (10 số)
    const phoneRegex = /^(0(3|5|7|8|9))\d{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
        setError('Số điện thoại không hợp lệ. Vui lòng nhập đúng 10 số.');
        return;
    }

    setLoading(true);
    try {
      await UserService.createUser({
        email,
        password,
        displayName,
        phoneNumber,
        dateOfBirth,
      });

      // Đăng ký thành công, chuyển người dùng đến màn hình chờ duyệt.
      router.replace('/pending');
    } catch (error: any) {
      console.error('Lỗi đăng ký:', error);
      if (error.code === 409) { // User with the same email already exists
        setError('Email này đã được sử dụng.');
      } else {
        setError(error.message || 'Đã có lỗi xảy ra trong quá trình đăng ký.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: COLORS.bg_main }} 
      contentContainerStyle={[styles.authStyles.registerContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      keyboardShouldPersistTaps="handled"
    >
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
            <TouchableOpacity style={{flex: 1, justifyContent: 'center', height: '100%'}} onPress={() => setCalendarVisible(true)}>
                <Text style={[styles.authStyles.input, { color: dateOfBirth ? '#1F2937' : '#9CA3AF', paddingTop: 18 }]}>
                {dateOfBirth ? new Date(dateOfBirth).toLocaleDateString('vi-VN') : 'Chọn ngày sinh'}
                </Text>
            </TouchableOpacity>
            </View>
            <Modal
            animationType="fade"
            transparent={true}
            visible={isCalendarVisible}
            onRequestClose={() => setCalendarVisible(false)}
            >
            <TouchableOpacity style={styles.salesStyles.modalOverlay} onPress={() => setCalendarVisible(false)}>
                <View style={styles.salesStyles.modalView}>
                <Calendar
                    onDayPress={(day) => {
                    setDateOfBirth(day.dateString); // day.dateString có định dạng 'YYYY-MM-DD'
                    setCalendarVisible(false);
                    }}
                    markedDates={{ [dateOfBirth]: { selected: true, selectedColor: COLORS.primary } }}
                    maxDate={new Date().toISOString().split('T')[0]} // Chỉ cho phép chọn ngày trong quá khứ
                />
                </View>
            </TouchableOpacity>
            </Modal>
            <View style={styles.authStyles.inputGroup}>
            <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.authStyles.icon} />
            <TextInput
                style={styles.authStyles.input}
                placeholder="Mật khẩu"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
            />
            <TouchableOpacity onPress={() => setPasswordVisible(!isPasswordVisible)} style={{ padding: 10 }}>
                <Ionicons name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} size={22} color="#6B7280" />
            </TouchableOpacity>
            </View>
            <View style={styles.authStyles.inputGroup}>
            <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.authStyles.icon} />
            <TextInput
                style={styles.authStyles.input}
                placeholder="Xác nhận mật khẩu"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!isPasswordVisible}
            />
            <TouchableOpacity onPress={() => setPasswordVisible(!isPasswordVisible)} style={{ padding: 10 }}>
                <Ionicons name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} size={22} color="#6B7280" />
            </TouchableOpacity>
            </View>

            {error ? <Text style={styles.authStyles.errorText}>{error}</Text> : null}

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
    </ScrollView>
  );
}
