// app/(tabs)/warehouse.tsx

import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomPicker } from '../../components/CustomPicker';
import { useAuth } from '../../context/AuthContext';
import { Order, OrderService, OrderStatus } from '../../services/OrderService';
import { StaffService, StaffUser } from '../../services/StaffService';
import { COLORS, styles } from '../../styles/homeStyle';

const getActionText = (status: OrderStatus): string => {
  switch (status) {
    case 'Assigned': return 'Soạn hàng';
    case 'Processing': return 'Tiếp tục soạn';
    default: return '';
  }
};

export default function WarehouseScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [warehouseStaff, setWarehouseStaff] = useState<StaffUser[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [isAssignModalVisible, setAssignModalVisible] = useState(false);
  const [orderToAssign, setOrderToAssign] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const role = currentUser?.role; // Lấy role từ currentUser

  useEffect(() => {
    let unsubscribe: () => void;
    if (role === 'thukho') {
      // Thủ kho chỉ thấy đơn hàng được giao cho mình
      unsubscribe = OrderService.subscribeToWarehouseOrders(user!.uid, (ordersData) => {
        setOrders(ordersData);
        setLoading(false);
      });
      // Lấy danh sách nhân viên kho để phân công
      StaffService.getStaffList(user!.uid, role, currentUser?.managerId).then(staffList => {
        const whStaff = staffList.filter(s => s.role === 'nhanvienkho');
        setWarehouseStaff(whStaff);
      });
    } else if (role === 'nhanvienkho' && user?.uid) {
      unsubscribe = OrderService.subscribeToAssignedOrders(user.uid, (ordersData) => {
        setOrders(ordersData);
        setLoading(false);
      });
    } else {
      // Trưởng phòng cũng có thể vào xem
      if (role === 'truongphong') {
        // [SỬA LỖI] Kích hoạt lại việc lấy tất cả đơn hàng trong kho cho Trưởng phòng
        unsubscribe = OrderService.subscribeToAllWarehouseOrders(setOrders);
      }
      setLoading(false);
      setOrders([]);
    }
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [role, user, currentUser]);

  const handleUpdateStatus = async (order: Order) => {
    // [SỬA LỖI] Dọn dẹp logic, đảm bảo điều hướng đến màn hình soạn hàng
    if (order.status === 'Assigned') {
      // Chuyển trạng thái sang 'Processing' trước khi vào màn hình soạn
      await OrderService.updateOrder(order.id, { status: 'Processing' });
      // Điều hướng đến màn hình soạn hàng
      router.push({ pathname: '/picking', params: { order: JSON.stringify(order) } });
    } else if (order.status === 'Processing') {
      // Nếu đang soạn dở, vẫn cho phép vào lại màn hình soạn
      router.push({ pathname: '/picking', params: { order: JSON.stringify(order) } });
    }
  };

  const openAssignModal = (order: Order) => {
    setOrderToAssign(order);
    setAssignModalVisible(true);
  };

  const handleAssignOrder = async () => {
    if (!orderToAssign || !selectedStaffId) {
      Alert.alert('Lỗi', 'Vui lòng chọn nhân viên để phân công.');
      return;
    }
    const staffMember = warehouseStaff.find(s => s.uid === selectedStaffId);
    if (!staffMember) return;

    try {
      await OrderService.assignOrder(orderToAssign.id, staffMember.uid, staffMember.displayName);
      Alert.alert('Thành công', `Đã phân công đơn hàng cho ${staffMember.displayName}.`);
      setAssignModalVisible(false);
      setOrderToAssign(null);
      setSelectedStaffId(null);
    } catch (e: any) {
      Alert.alert('Lỗi', e.message || 'Không thể phân công.');
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.staffStyles.baseCard}>
      <View style={styles.warehouseStyles.orderHeader}>
        <Text style={styles.warehouseStyles.orderId}>ĐH: {item.id.slice(-6).toUpperCase()}</Text>
        <Text style={[styles.warehouseStyles.statusText, { color: getStatusColor(item.status) }]}>
          {item.status}
        </Text>
      </View>
      <Text style={styles.warehouseStyles.orderInfo}>Người tạo: {item.creatorName}</Text>
      {item.customerName && <Text style={styles.warehouseStyles.orderInfo}>Khách hàng: {item.customerName}</Text>}
      {item.assignedToName && <Text style={styles.warehouseStyles.orderInfo}>NV soạn: {item.assignedToName}</Text>}
      <Text style={styles.warehouseStyles.orderInfo}>
        Ngày tạo: {item.createdAt?.toDate().toLocaleDateString('vi-VN')}
      </Text>
      <Text style={styles.warehouseStyles.itemsTitle}>Sản phẩm:</Text>
      <FlatList
        data={item.items}
        keyExtractor={(product, index) => index.toString()}
        renderItem={({ item: productItem }) => (
          <Text style={styles.warehouseStyles.itemDetail}>- {productItem.productName} ({productItem.qty})</Text>
        )}
      />
      {/* Nút cho Thủ kho */}
      {role === 'thukho' && item.status === 'Confirmed' && (
        <View style={styles.warehouseStyles.actionButtons}>
          <TouchableOpacity onPress={() => openAssignModal(item)} style={styles.warehouseStyles.actionButton}>
            <Text style={styles.warehouseStyles.actionButtonText}>Phân công</Text>
          </TouchableOpacity>
        </View>
      )}
      {/* Nút cho Nhân viên kho */}
      {role === 'nhanvienkho' && (item.status === 'Assigned' || item.status === 'Processing') && (
        <View style={styles.warehouseStyles.actionButtons}>
          <TouchableOpacity onPress={() => handleUpdateStatus(item)} style={[styles.warehouseStyles.actionButton, { backgroundColor: COLORS.secondary }]}>
            <Text style={styles.warehouseStyles.actionButtonText}>{getActionText(item.status)}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'Confirmed': return '#F59E0B';
      case 'Assigned': return '#3B82F6';
      case 'Processing': return '#8B5CF6';
      case 'PendingRevision': return '#EF4444';
      case 'Completed': return '#0E7490';
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
      <Text style={styles.warehouseStyles.headerTitle}>Quản lý Kho</Text>
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
      {/* Modal Phân công */}
      <Modal visible={isAssignModalVisible} transparent={true} animationType="slide" onRequestClose={() => setAssignModalVisible(false)}>
        <View style={styles.salesStyles.modalOverlay}>
          <View style={styles.salesStyles.modalView}>
            <Text style={styles.salesStyles.modalTitle}>Phân công đơn hàng</Text>
            <Text style={{ marginBottom: 20 }}>Đơn hàng: {orderToAssign?.id.slice(-6).toUpperCase()}</Text>
            <CustomPicker
              iconName="person-outline"
              placeholder="-- Chọn nhân viên kho --"
              items={warehouseStaff.map(s => ({ label: s.displayName, value: s.uid }))}
              selectedValue={selectedStaffId}
              onValueChange={setSelectedStaffId}
              enabled={true}
            />
            <View style={styles.salesStyles.modalButtons}>
              <TouchableOpacity style={[styles.staffStyles.modalButton, styles.staffStyles.modalButtonSecondary]} onPress={() => setAssignModalVisible(false)}><Text style={styles.staffStyles.modalButtonText}>Hủy</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.staffStyles.modalButton, styles.staffStyles.modalButtonPrimary]} onPress={handleAssignOrder}><Text style={styles.staffStyles.modalButtonText}>Xác nhận</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
