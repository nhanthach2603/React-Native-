// app/profile.tsx

import { COLORS, styles } from '@/styles/homeStyle';
import { Ionicons } from '@expo/vector-icons';
import { ID } from 'appwrite';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { account, databases, storage, config } from '../config/appwrite';
import { useAuth } from '../context/AuthContext';
import { getRoleDisplayName } from '../utils/roles';

interface EditProfileModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (data: { displayName: string; phoneNumber: string; dateOfBirth: string }) => Promise<void>;
  currentUser: {
    displayName: string;
    phoneNumber: string;
    dateOfBirth: string;
  };
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isVisible,
  onClose,
  onSave,
  currentUser,
}) => {
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phoneNumber);
  const [dateOfBirth, setDateOfBirth] = useState(currentUser.dateOfBirth);
  const [loading, setLoading] = useState(false);
  const [isCalendarVisible, setCalendarVisible] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setDisplayName(currentUser.displayName);
      setPhoneNumber(currentUser.phoneNumber);
      setDateOfBirth(currentUser.dateOfBirth);
    }
  }, [currentUser, isVisible]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Lỗi', 'Tên hiển thị không được để trống.');
      return;
    }
    setLoading(true);
    await onSave({ displayName, phoneNumber, dateOfBirth });
    setLoading(false);
    onClose();
  };

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={styles.salesStyles.modalOverlay}>
        <View style={[styles.salesStyles.modalView, { padding: 25 }]}>
          <Text style={[styles.salesStyles.modalTitle, { marginBottom: 25 }]}>Chỉnh sửa Tên</Text>

          {/* Input group được làm đẹp */}
          <View style={styles.staffStyles.modalInputGroup}>
            <Ionicons name="person-outline" size={20} color={COLORS.text_secondary} style={styles.staffStyles.modalInputIcon} />
            <TextInput
              style={styles.salesStyles.modalInput}
              placeholder="Tên hiển thị mới"
              value={displayName}
              onChangeText={setDisplayName}
            />
          </View>

          <View style={styles.staffStyles.modalInputGroup}>
            <Ionicons name="call-outline" size={20} color={COLORS.text_secondary} style={styles.staffStyles.modalInputIcon} />
            <TextInput
              style={styles.salesStyles.modalInput}
              placeholder="Số điện thoại"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.staffStyles.modalInputGroup}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.text_secondary} style={styles.staffStyles.modalInputIcon} />
            <TouchableOpacity style={styles.staffStyles.pickerTouchable} onPress={() => setCalendarVisible(true)}>
              <Text style={dateOfBirth ? styles.staffStyles.pickerValue : styles.staffStyles.pickerPlaceholder}>
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
                    setDateOfBirth(day.dateString);
                    setCalendarVisible(false);
                  }}
                  markedDates={{ [dateOfBirth]: { selected: true, selectedColor: COLORS.primary } }}
                  // Cho phép chọn ngày trong quá khứ
                  maxDate={new Date().toISOString().split('T')[0]}
                />
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Các nút bấm được làm đẹp */}
          <View style={[styles.salesStyles.modalButtons, { marginTop: 10 }]}>
            <TouchableOpacity style={[styles.staffStyles.modalButton, styles.staffStyles.modalButtonSecondary]} onPress={onClose}>
              <Text style={styles.staffStyles.modalButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.staffStyles.modalButton, styles.staffStyles.modalButtonPrimary]} onPress={handleSave} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.staffStyles.modalButtonText}>Lưu</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

interface ChangePasswordModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (currentPassword: string, newPassword: string) => Promise<void>;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isVisible,
  onClose,
  onSave,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset state khi modal được mở hoặc đóng
  useEffect(() => {
    if (!isVisible) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setLoading(false);
    }
  }, [isVisible]);

  const handleSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ các trường.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới và xác nhận mật khẩu không khớp.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Mật khẩu yếu', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    setLoading(true);
    try {
      await onSave(currentPassword, newPassword);
      onClose(); // Đóng modal nếu thành công
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Lỗi đã được xử lý ở hàm cha, chỉ cần dừng loading
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={styles.salesStyles.modalOverlay}>
        <View style={[styles.salesStyles.modalView, { padding: 25 }]}>
          <Text style={[styles.salesStyles.modalTitle, { marginBottom: 25 }]}>Đổi mật khẩu</Text>

          <View style={styles.staffStyles.modalInputGroup}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.text_secondary} style={styles.staffStyles.modalInputIcon} />
            <TextInput style={styles.salesStyles.modalInput} placeholder="Mật khẩu hiện tại" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
          </View>

          <View style={styles.staffStyles.modalInputGroup}>
            <Ionicons name="key-outline" size={20} color={COLORS.text_secondary} style={styles.staffStyles.modalInputIcon} />
            <TextInput style={styles.salesStyles.modalInput} placeholder="Mật khẩu mới" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
          </View>

          <View style={styles.staffStyles.modalInputGroup}>
            <Ionicons name="key-outline" size={20} color={COLORS.text_secondary} style={styles.staffStyles.modalInputIcon} />
            <TextInput style={styles.salesStyles.modalInput} placeholder="Xác nhận mật khẩu mới" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
          </View>

          <View style={[styles.salesStyles.modalButtons, { marginTop: 10 }]}>
            <TouchableOpacity style={[styles.staffStyles.modalButton, styles.staffStyles.modalButtonSecondary]} onPress={onClose}>
              <Text style={styles.staffStyles.modalButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.staffStyles.modalButton, styles.staffStyles.modalButtonPrimary]} onPress={handleSave} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.staffStyles.modalButtonText}>Lưu</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser, user, loading, refreshCurrentUser, logout } = useAuth(); // Lấy thêm `user` và `logout` từ context
  const [isModalVisible, setModalVisible] = useState(false);
  const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);

  // [SỬA LỖI] Xử lý việc quay lại một cách an toàn.
  // Nếu có thể quay lại, thực hiện router.back().
  // Nếu không, chuyển hướng đến màn hình chính để tránh lỗi.
  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)'); // Chuyển hướng về màn hình đăng nhập sau khi logout
    } catch (e) {
      console.error("Lỗi khi đăng xuất:", e);
      Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại.");
    }
  };
  const handleSaveProfile = async (data: { displayName: string; phoneNumber: string; dateOfBirth: string }) => {
    if (!currentUser?.$id) return;
    try {
      const dbId = config.databaseId;
      const usersCollectionId = config.userCollectionId;

      console.log("dbId:", dbId);
      console.log("usersCollectionId:", usersCollectionId);

      await databases.updateDocument(dbId, usersCollectionId, currentUser.$id, {
        name: data.displayName, // Appwrite dùng 'name'
        phoneNumber: data.phoneNumber,
        dateOfBirth: data.dateOfBirth,
      });

      // Cập nhật tên trong Appwrite Auth
      if (currentUser.name !== data.displayName) {
        await account.updateName(data.displayName);
      }

      await refreshCurrentUser(); // Cập nhật lại thông tin user trong context
      Alert.alert('Thành công', 'Đã cập nhật thông tin cá nhân.');
    } catch (e: any) {
      console.error("Lỗi khi cập nhật profile:", {
        name: e.name,
        code: e.code,
        type: e.type,
        response: e.response,
        message: e.message,
      });
      Alert.alert('Lỗi', `Không thể cập nhật: ${e.message}`);
    }
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng để đổi mật khẩu.');
      return;
    }

    try {
      // Appwrite xử lý xác thực lại và cập nhật trong một lệnh gọi
      await account.updatePassword(newPassword, currentPassword);

      Alert.alert('Thành công', 'Đã đổi mật khẩu thành công.');
    } catch (error: any) {
      console.error("Lỗi đổi mật khẩu:", JSON.stringify(error, null, 2));
      if (error.code === 401) { // Lỗi 401 thường là sai mật khẩu
        Alert.alert('Lỗi', 'Mật khẩu hiện tại không đúng. Vui lòng thử lại.');
      } else {
        Alert.alert('Lỗi', `Không thể đổi mật khẩu: ${error.message}`);
      }
      throw error; // Ném lỗi để modal biết và không tự đóng
    }
  };

  const formatDate = (isoString: string | undefined) => {
    if (!isoString) return 'Chưa có'; // Xử lý trường hợp null, undefined, hoặc chuỗi rỗng
    try {
      const date = new Date(isoString);
      // Kiểm tra xem date có hợp lệ không
      if (isNaN(date.getTime())) return 'Ngày không hợp lệ';
      return date.toLocaleDateString('vi-VN');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return 'Ngày không hợp lệ'; // Trả về thông báo lỗi chung
    }
  };

  const handlePickAvatar = async () => {
    // Yêu cầu quyền truy cập thư viện ảnh
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Cần cấp quyền", "Bạn cần cấp quyền truy cập thư viện ảnh để thay đổi avatar.");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (pickerResult.canceled) {
      return;
    }

    const imageUri = pickerResult.assets[0].uri;

    // Upload ảnh lên Firebase Storage
    if (currentUser?.$id && imageUri) {
      const bucketId = process.env.EXPO_PUBLIC_APPWRITE_BUCKET_FILES!;
      const dbId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
      const usersCollectionId = process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_USERS!;

      const response = await fetch(imageUri);
      const blob = await response.blob();
      const file = new File([blob], `avatar_${currentUser.$id}.jpg`, { type: 'image/jpeg' });

      // Tải lên Appwrite Storage
      const uploadedFile = await storage.createFile(bucketId, ID.unique(), file);

      // Lấy URL xem trước công khai
      const avatarUrl = storage.getFilePreview(bucketId, uploadedFile.$id);

      // Cập nhật URL vào document người dùng
      await databases.updateDocument(dbId, usersCollectionId, currentUser.$id, { avatarUrl: avatarUrl.href });

      await refreshCurrentUser();
      Alert.alert("Thành công", "Đã cập nhật ảnh đại diện.");
    }
  };
  if (loading || !currentUser) {
    return (
      <View style={[styles.staffStyles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <View style={[styles.staffStyles.container, { paddingTop: insets.top, paddingHorizontal: 0 }]}>
      {/* [SỬA LỖI] Ẩn thanh tiêu đề mặc định của Stack Navigator */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header tùy chỉnh */}
      <View style={[styles.salesStyles.header, { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 }]}>
        <TouchableOpacity onPress={handleGoBack} style={{ padding: 5 }}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        {/* Đảm bảo không có text node nào bị lạc trực tiếp bên trong View */}
        <Text style={[styles.staffStyles.headerTitle, { marginBottom: 0 }]}>Thông tin cá nhân</Text>
        <TouchableOpacity onPress={handleLogout} style={{ padding: 5 }}>
          <Ionicons name="log-out-outline" size={28} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {/* Avatar */}
        <View style={styles.staffStyles.profileAvatarContainer}>
          <TouchableOpacity onPress={handlePickAvatar}>
            {currentUser.avatarUrl ? (
              <Image source={{ uri: currentUser.avatarUrl }} style={styles.staffStyles.profileAvatarImage} />
            ) : (
              <View style={styles.staffStyles.profileAvatar}>
                <Text style={styles.staffStyles.profileAvatarText}>
                  {currentUser.displayName?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <View style={styles.staffStyles.cameraIconOverlay}>
              <Ionicons name="camera" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.staffStyles.infoCard}>
          <View style={styles.staffStyles.infoRow}>
            <Ionicons name="mail-outline" size={24} color="#6B7280" style={styles.staffStyles.infoIcon} />
            <Text style={styles.staffStyles.infoLabel}>Email:</Text>
            <Text style={styles.staffStyles.infoValue}>{currentUser.email}</Text>
          </View>
          <View style={styles.staffStyles.infoRow}>
            <Ionicons name="person-outline" size={24} color="#6B7280" style={styles.staffStyles.infoIcon} />
            <Text style={styles.staffStyles.infoLabel}>Tên hiển thị:</Text>
            <Text style={styles.staffStyles.infoValue}>{currentUser.displayName}</Text>
          </View>
          <View style={styles.staffStyles.infoRow}>
            <Ionicons name="briefcase-outline" size={24} color="#6B7280" style={styles.staffStyles.infoIcon} />
            <Text style={styles.staffStyles.infoLabel}>Vai trò:</Text>
            <Text style={styles.staffStyles.infoValue}>{getRoleDisplayName(currentUser.role)}</Text>
          </View>
          <View style={styles.staffStyles.infoRow}>
            <Ionicons name="call-outline" size={24} color="#6B7280" style={styles.staffStyles.infoIcon} />
            <Text style={styles.staffStyles.infoLabel}>SĐT:</Text>
            <Text style={styles.staffStyles.infoValue}>{currentUser.phoneNumber || 'Chưa cập nhật'}</Text>
          </View>
          <View style={styles.staffStyles.infoRow}>
            <Ionicons name="calendar-outline" size={24} color="#6B7280" style={styles.staffStyles.infoIcon} />
            <Text style={styles.staffStyles.infoLabel}>Ngày sinh:</Text>
            <Text style={styles.staffStyles.infoValue}>{formatDate(currentUser.dateOfBirth) || 'Chưa cập nhật'}</Text>
          </View>
          <View style={styles.staffStyles.infoRow}>
            <Ionicons name="person-add-outline" size={24} color="#6B7280" style={styles.staffStyles.infoIcon} />
            <Text style={styles.staffStyles.infoLabel}>Ngày tạo:</Text>
            <Text style={styles.staffStyles.infoValue}>{formatDate(currentUser.$createdAt)}</Text>
          </View>
        </View>

        <View style={{ marginTop: 30 }}>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.staffStyles.editButton}>
            <Ionicons name="create-outline" size={22} color="#FFFFFF" />
            <Text style={styles.staffStyles.editButtonText}>Chỉnh sửa thông tin</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setPasswordModalVisible(true)} style={[styles.staffStyles.editButton, { marginTop: 15, backgroundColor: COLORS.secondary }]}>
            <Ionicons name="lock-closed-outline" size={22} color="#FFFFFF" />
            <Text style={styles.staffStyles.editButtonText}>Đổi mật khẩu</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {isModalVisible && (
        <EditProfileModal
          isVisible={isModalVisible}
          onClose={() => setModalVisible(false)}
          currentUser={{
            displayName: currentUser.displayName || '',
            phoneNumber: currentUser.phoneNumber || '',
            dateOfBirth: currentUser.dateOfBirth || '',
          }}
          onSave={handleSaveProfile}
        />
      )}

      {isPasswordModalVisible && (
        <ChangePasswordModal
          isVisible={isPasswordModalVisible}
          onClose={() => setPasswordModalVisible(false)}
          onSave={handleChangePassword}
        />
      )}
    </View>
  );
}
