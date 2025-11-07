import React, { useEffect, useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StaffUser } from '../../services/StaffService';

interface StaffModalProps {
  isVisible: boolean;
  onClose: () => void;
  staffToEdit?: StaffUser | null;
  onSave: (data: Partial<StaffUser>) => void | Promise<void>;
  managers: StaffUser[];
  onResetPassword?: (email: string) => void | Promise<void>;
}

const StaffModal: React.FC<StaffModalProps> = ({
  isVisible,
  onClose,
  staffToEdit,
  onSave,
  managers,
  onResetPassword,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [managerId, setManagerId] = useState<string | null>(null);

  useEffect(() => {
    if (staffToEdit) {
      setDisplayName(staffToEdit.displayName || '');
      setEmail(staffToEdit.email || '');
      setRole(staffToEdit.role || '');
      setManagerId(staffToEdit.managerId || null);
    } else {
      setDisplayName('');
      setEmail('');
      setRole('');
      setManagerId(null);
    }
  }, [staffToEdit]);

  const handleSave = () => {
    if (!displayName) {
      alert('Tên nhân viên không được để trống');
      return;
    }
    onSave({
      uid: staffToEdit?.uid || '',
      displayName,
      email,
      role: role as StaffUser['role'],
      managerId,
    });
  };

  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={styles.modalTitle}>
              {staffToEdit ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên'}
            </Text>

            {/* --- Tên nhân viên --- */}
            <Text style={styles.label}>Tên</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Nhập tên nhân viên"
            />

            {/* --- Email --- */}
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Nhập email"
              keyboardType="email-address"
            />

            {/* --- Vai trò --- */}
            <Text style={styles.label}>Vai trò</Text>
            <TextInput
              style={styles.input}
              value={role}
              onChangeText={setRole}
              placeholder="nhanvienkho, truongphong,..."
            />

            {/* --- Chọn quản lý --- */}
            <Text style={styles.label}>Quản lý trực tiếp</Text>
            <FlatList
              data={managers}
              keyExtractor={(item) => item.uid}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.managerItem,
                    managerId === item.uid && styles.managerItemSelected,
                  ]}
                  onPress={() => setManagerId(item.uid)}
                >
                  <Text
                    style={
                      managerId === item.uid
                        ? styles.managerTextSelected
                        : styles.managerText
                    }
                  >
                    {item.displayName}
                  </Text>
                </TouchableOpacity>
              )}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 10 }}
            />

            {/* --- Buttons --- */}
            <View style={styles.buttonRow}>
              {staffToEdit && onResetPassword && (
                <TouchableOpacity
                  style={[styles.button, styles.resetButton]}
                  onPress={() => onResetPassword(email)}
                >
                  <Text style={styles.buttonText}>Reset Password</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.buttonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.buttonText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default StaffModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  managerItem: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  managerItemSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  managerText: {
    color: '#374151',
    fontSize: 14,
  },
  managerTextSelected: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    minWidth: 80,
    alignItems: 'center',
    marginBottom: 5,
  },
  cancelButton: {
    backgroundColor: '#6B7280',
  },
  saveButton: {
    backgroundColor: '#10B981',
  },
  resetButton: {
    backgroundColor: '#F59E0B',
    marginRight: 'auto',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
