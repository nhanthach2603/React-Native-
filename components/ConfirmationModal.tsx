import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ConfirmationModalProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onConfirm: () => void;
  isSuccessModal?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isVisible, onClose, title, message, onConfirm, isSuccessModal = false }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={modalStyles.centeredView}>
        <View style={modalStyles.modalView}>
          <Ionicons
            name={isSuccessModal ? "checkmark-circle-outline" : "alert-circle-outline"}
            size={50}
            color={isSuccessModal ? "#10B981" : "#FFD700"}
          />
          <Text style={modalStyles.modalTitle}>{title}</Text>
          <Text style={modalStyles.modalText}>{message}</Text>
          <View style={modalStyles.buttonContainer}>
            {isSuccessModal ? (
              <TouchableOpacity onPress={onClose} style={[modalStyles.button, modalStyles.buttonClose]}>
                <Text style={modalStyles.textStyle}>Đóng</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity onPress={onClose} style={[modalStyles.button, modalStyles.buttonCancel]}>
                  <Text style={modalStyles.textStyle}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onConfirm} style={[modalStyles.button, modalStyles.buttonDelete]}>
                  <Text style={modalStyles.textStyle}>Xác nhận</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  button: {
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    flex: 1,
    marginHorizontal: 5,
  },
  buttonCancel: {
    backgroundColor: '#6c757d',
  },
  buttonDelete: {
    backgroundColor: '#dc3545',
  },
  buttonClose: {
    backgroundColor: '#10B981',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ConfirmationModal;