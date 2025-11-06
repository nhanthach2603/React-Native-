// components/sales/ConfirmationModal.tsx

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, styles } from '../../styles/homeStyle';

interface ConfirmationModalProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onConfirm: () => void;
  isSuccessModal?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isVisible, onClose, title, message, onConfirm, isSuccessModal = false }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.salesStyles.modalOverlay}>
        <View style={styles.salesStyles.modalView}>
          <Ionicons
            name={isSuccessModal ? "checkmark-circle-outline" : "alert-circle-outline"}
            size={50}
            color={isSuccessModal ? "#10B981" : "#FFD700"}
          />
          <Text style={styles.salesStyles.modalTitle}>{title}</Text>
          <Text style={{ textAlign: 'center', marginBottom: 20 }}>{message}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', width: '100%' }}>
            {isSuccessModal ? (
              <TouchableOpacity style={[styles.staffStyles.modalButton, styles.staffStyles.modalButtonPrimary, { flex: 0.5 }]} onPress={onClose}><Text style={styles.staffStyles.modalButtonText}>Đóng</Text></TouchableOpacity>
            ) : (
              // [SỬA LỖI] Bọc các nút trong một View thay vì Fragment để tránh lỗi text node
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', flex: 1 }}>
                <TouchableOpacity style={[styles.staffStyles.modalButton, styles.staffStyles.modalButtonSecondary]} onPress={onClose}><Text style={styles.staffStyles.modalButtonText}>Hủy</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.staffStyles.modalButton, { backgroundColor: COLORS.error }]} onPress={onConfirm}><Text style={styles.staffStyles.modalButtonText}>Xác nhận</Text></TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};
