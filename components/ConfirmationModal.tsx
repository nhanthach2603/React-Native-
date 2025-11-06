// components/ConfirmationModal.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, styles } from '../styles/homeStyle';

interface ConfirmationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmButtonText?: string;
  confirmButtonColor?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = 'Xác nhận',
  confirmButtonColor = COLORS.error,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.salesStyles.modalOverlay}>
        <View style={styles.salesStyles.modalView}>
          <Ionicons name="alert-circle-outline" size={48} color={confirmButtonColor} style={{ marginBottom: 15 }} />
          <Text style={[styles.salesStyles.modalTitle, { fontSize: 20 }]}>{title}</Text>
          <Text style={styles.salesStyles.confirmationMessage}>{message}</Text>
          <View style={styles.salesStyles.modalButtons}>
            <TouchableOpacity
              style={[styles.staffStyles.modalButton, styles.staffStyles.modalButtonSecondary]}
              onPress={onClose}
            >
              <Text style={styles.staffStyles.modalButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.staffStyles.modalButton, { backgroundColor: confirmButtonColor }]}
              onPress={onConfirm}
            >
              <Text style={styles.staffStyles.modalButtonText}>{confirmButtonText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
