// d:\React-Native-\styles\warehouseScreen.styles.ts

import { StyleSheet } from 'react-native';
import { COLORS } from './_colors';

export const warehouseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text_primary,
    marginBottom: 20,
  },
  orderList: {
    flex: 1,
  },
  orderItem: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
  },
  orderInfo: {
    fontSize: 14,
    color: COLORS.text_secondary,
    marginBottom: 5,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text_primary,
    marginBottom: 5,
  },
  itemDetail: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'flex-end',
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  actionButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: COLORS.text_placeholder,
  }
});
