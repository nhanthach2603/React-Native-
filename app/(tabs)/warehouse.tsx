// app/(tabs)/warehouse.tsx

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Order, OrderService } from '../../services/OrderService';

import { styles } from '../../styles/homeStyle';

export default function WarehouseScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const role = currentUser?.role; // Lấy role từ currentUser

  useEffect(() => {
    let unsubscribe: () => void;
    if (role === 'thukho') {
      unsubscribe = OrderService.subscribeToPendingOrders((ordersData) => {
        setOrders(ordersData);
        setLoading(false);
      });    } else if (role === 'nhanvienkho' && user?.uid) {
      unsubscribe = OrderService.subscribeToAssignedOrders(user.uid, (ordersData) => {
        setOrders(ordersData);
        setLoading(false);
      });
    } else {
      setLoading(false);
      setOrders([]);
    }
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [role, user]);

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await OrderService.updateOrder(orderId, { status: newStatus });
      Alert.alert('Thành công', `Trạng thái đơn hàng đã được cập nhật thành "${newStatus}".`);
    } catch (e: any) {
      Alert.alert('Lỗi', e.message || 'Không thể cập nhật trạng thái đơn hàng.');
    }
  };


  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.warehouseStyles.orderItem}>
      <View style={styles.warehouseStyles.orderHeader}>
        <Text style={styles.warehouseStyles.orderId}>Mã đơn: {item.id.slice(0, 8)}</Text>
        <Text style={[styles.warehouseStyles.statusText, { color: getStatusColor(item.status) }]}>
          {item.status}
        </Text>
      </View>
      <Text style={styles.warehouseStyles.orderInfo}>Soạn bởi: {item.staffId}</Text>
      <Text style={styles.warehouseStyles.orderInfo}>
        Ngày tạo: {new Date(item.createdAt).toLocaleDateString()}
      </Text>
      <Text style={styles.warehouseStyles.itemsTitle}>Sản phẩm:</Text>
      <FlatList
        data={item.items}
        keyExtractor={(product, index) => index.toString()}
        renderItem={({ item: productItem }) => (
          <Text style={styles.warehouseStyles.itemDetail}>- {productItem.name} ({productItem.qty})</Text>
        )}
      />
      {role === 'thukho' && item.status === 'Pending' && (
        <View style={styles.warehouseStyles.actionButtons}>
          <TouchableOpacity onPress={() => updateOrderStatus(item.id, 'Shipped')} style={styles.warehouseStyles.actionButton}>
            <Text style={styles.warehouseStyles.actionButtonText}>Xuất hàng</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'Pending': return '#F59E0B';
      case 'Shipped': return '#10B981';
      case 'Canceled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <View style={[styles.warehouseStyles.container, styles.warehouseStyles.loadingContainer]}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <View style={[styles.warehouseStyles.container, { paddingTop: insets.top + 20 }]}>
      <Text style={styles.warehouseStyles.headerTitle}>Đơn hàng đang chờ</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        style={styles.warehouseStyles.orderList}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={() => (
          <Text style={styles.warehouseStyles.emptyText}>Không có đơn hàng nào.</Text>
        )}
      />
    </View>
  );
}
