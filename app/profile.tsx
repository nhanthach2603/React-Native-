// app/profile.tsx

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Button,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, UserRole } from '../context/AuthContext';
import { StaffService } from '../services/StaffService';
import { styles } from '../styles/homeStyle';

const getRoleDisplayName = (userRole: UserRole) => {
  switch (userRole) {
    case 'thukho':
      return 'Thủ kho';
    case 'truongphong':
      return 'Trưởng phòng KD/QA';
    case 'nhanvienkho':
      return 'Nhân viên Kho';
    case 'nhanvienkd':
      return 'Nhân viên Kinh doanh';
    case 'quanlynhansu':
      return 'Quản lý Nhân sự';
    case null:
    case 'unassigned':
    default:
      return 'Chưa được gán';
  }
};

interface EditProfileModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (newName: string) => Promise<void>;
  currentName: string;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isVisible,
  onClose,
  onSave,
  currentName,
}) => {
  const [displayName, setDisplayName] = useState(currentName);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDisplayName(currentName);
  }, [currentName]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Lỗi', 'Tên hiển thị không được để trống.');
      return;
    }
    setLoading(true);
    await onSave(displayName);
    setLoading(false);
    onClose();
  };

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={styles.salesStyles.modalOverlay}>
        <View style={styles.salesStyles.modalView}>
          <Text style={styles.salesStyles.modalTitle}>Chỉnh sửa thông tin</Text>
          <TextInput
            style={styles.salesStyles.modalInput}
            placeholder="Tên hiển thị mới"
            value={displayName}
            onChangeText={setDisplayName}
          />
          <View style={styles.salesStyles.modalButtons}>
            <Button title="Hủy" onPress={onClose} color="red" />
            <Button title={loading ? 'Đang lưu...' : 'Lưu'} onPress={handleSave} color="green" disabled={loading} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser, loading, refreshCurrentUser } = useAuth();
  const [isModalVisible, setModalVisible] = useState(false);

  const handleSaveProfile = async (newName: string) => {
    if (!currentUser?.uid) return;
    try {
      await StaffService.updateStaff(currentUser.uid, { displayName: newName });
      await refreshCurrentUser(); // Cập nhật lại thông tin user trong context
      Alert.alert('Thành công', 'Đã cập nhật tên hiển thị.');
    } catch (e: any) {
      Alert.alert('Lỗi', `Không thể cập nhật: ${e.message}`);
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
    <View style={[styles.staffStyles.container, { paddingTop: insets.top + 20 }]}>
      <View style={styles.salesStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 5 }}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.staffStyles.headerTitle}>Thông tin cá nhân</Text>
        <View style={{ width: 38 }} />
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
      </View>

      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.staffStyles.editButton}>
        <Ionicons name="create-outline" size={22} color="#FFFFFF" />
        <Text style={styles.staffStyles.editButtonText}>Chỉnh sửa tên hiển thị</Text>
      </TouchableOpacity>

      <EditProfileModal
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
        currentName={currentUser.displayName || ''}
        onSave={handleSaveProfile}
      />
    </View>
  );
}

