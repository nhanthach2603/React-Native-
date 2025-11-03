// styles/OrderEditModalStyles.ts

import { StyleSheet } from 'react-native';
import { COLORS } from './homeStyle';

export const OrderEditModalStyles = StyleSheet.create({
  // --- Styles cho nút thêm sản phẩm ---
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  addItemButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  // --- Styles cho ô nhập số lượng ---
  qtyInput: {
    width: 50,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text_primary,
    marginHorizontal: 5,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },

  // --- Styles cho phần tổng kết đơn hàng ---
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  summaryText: {
    fontSize: 16,
    color: COLORS.text_secondary,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  // --- Styles cho Modal chọn sản phẩm ---
  productPickerItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  // --- Styles cho Modal chọn biến thể ---
  variantPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  variantInfoText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text_primary,
  },
  variantStockText: {
    fontSize: 13,
    color: COLORS.text_secondary,
    fontStyle: 'italic',
  },
  variantAddButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  variantAddButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});