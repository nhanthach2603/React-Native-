// d:\React-Native-\styles\salesScreen.styles.ts

import { StyleSheet } from 'react-native';
import { COLORS } from './_colors';

export const salesStyles = StyleSheet.create({
  container: {
    flex: 1, //
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text_primary,
  },
  addButton: {
    padding: 5,
  },
  productList: {
    flex: 1,
  },
  productItem: {
    backgroundColor: COLORS.bg_card,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  productDetails: {
    fontSize: 14,
    color: COLORS.text_secondary,
    marginTop: 5,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text_primary,
    marginRight: 10,
  },
  quantityButtons: {
    flexDirection: 'row',
  },
  quantityButton: {
    padding: 5,
    marginLeft: 5,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: COLORS.text_placeholder,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: COLORS.text_primary,
  },
  confirmationMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: COLORS.text_secondary,
  },
  modalInput: {
    width: '100%',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  pickerContainer: {
    borderWidth: 1, //
    borderColor: COLORS.border,
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden', // Đảm bảo Picker không tràn ra ngoài
    backgroundColor: COLORS.bg_main,
    height: 50, // Chiều cao cố định cho Picker
    justifyContent: 'center',
  },
  modalPicker: {
    height: 50, // Đảm bảo chiều cao phù hợp
    color: COLORS.text_primary,
  },
  // Styles for Category Manager Modal
  categoryModalView: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  categoryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  categoryInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  categoryInput: {
    flex: 1,
    height: 45,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginRight: 10,
  },
  categoryAddButton: {
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'left',
    width: '100%',
  },
  categoryListContainer: {
    maxHeight: 200,
    width: '100%',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  categoryDeleteButton: { padding: 5 },
});
