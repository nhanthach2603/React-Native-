// components/warehouse/OrderDetailModal.tsx

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Order } from '../../services/OrderService';
import { COLORS, styles } from '../../styles/homeStyle';

interface OrderDetailModalProps {
  order: Order;
  isVisible: boolean;
  onClose: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isVisible,
  onClose,
}) => {
  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.salesStyles.modalOverlay}>
        <View style={[styles.salesStyles.modalView, { width: '95%', maxHeight: '80%' }]}>
          <View style={styles.salesStyles.categoryModalHeader}>
            <Text style={[styles.salesStyles.modalTitle, { marginBottom: 0 }]}>
              Chi tiết đơn hàng
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle-outline" size={30} color={COLORS.text_secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ width: '100%', marginTop: 20 }}>
            <Text style={styles.warehouseStyles.orderId}>ĐH: {order.id.slice(-6).toUpperCase()}</Text>
            <Text style={styles.warehouseStyles.orderInfo}>Khách hàng: {order.customerName || 'N/A'}</Text>
            <Text style={styles.warehouseStyles.orderInfo}>Người tạo: {order.creatorName}</Text>
            <Text style={styles.warehouseStyles.orderInfo}>Ngày tạo: {order.createdAt.toLocaleDateString('vi-VN')}</Text>
            <Text style={styles.warehouseStyles.orderInfo}>Tổng tiền: {order.totalAmount.toLocaleString('vi-VN')} VND</Text>
            
            <Text style={[styles.warehouseStyles.itemsTitle, { marginTop: 15 }]}>Sản phẩm:</Text>
            {order.items.map((item: { productName: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; selectedVariant: { color: any; size: any; }; qty: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; }, index: React.Key | null | undefined) => (
              <Text key={index} style={styles.warehouseStyles.itemDetail}>
                - {item.productName} ({`${item.selectedVariant.color ? `${item.selectedVariant.color} - ` : ''}${item.selectedVariant.size}`}) x {item.qty}
              </Text>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
