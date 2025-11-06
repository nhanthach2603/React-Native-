// app/completed-orders.tsx

import { Ionicons } from '@expo/vector-icons';
import { Query } from 'appwrite';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    SectionList,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OrderDetailModal } from '../components/warehouse/OrderDetailModal'; // Giả sử component này không phụ thuộc Firebase
import { databases } from '../config/appwrite';
import { COLORS, styles } from '../styles/homeStyle';
import { Order } from './screens/warehouse'; // Tái sử dụng kiểu Order từ warehouse.tsx

interface GroupedOrders {
  title: string;
  data: Order[];
}

export default function CompletedOrdersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { staffUid } = params;
  const insets = useSafeAreaInsets();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const dbId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
  const ordersCollectionId = process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_ORDERS!;

  useEffect(() => {
    if (typeof staffUid === 'string') {
      const fetchCompletedOrders = async () => {
        setLoading(true);
        try {
          // Lấy các đơn hàng đã hoàn thành trong tháng này do nhân viên này soạn
          const response = await databases.listDocuments(dbId, ordersCollectionId, [
            Query.equal('assignedTo', staffUid),
            Query.equal('status', ['Completed', 'Shipped']), // Các trạng thái đã hoàn thành
            // Bạn có thể thêm Query.greaterThan('$updatedAt', startOfMonth) nếu cần lọc chính xác theo tháng
          ]);
          const completedOrders = response.documents.map(doc => ({ ...doc, id: doc.$id, items: JSON.parse(doc.items) })) as Order[];
          setOrders(completedOrders);
        } catch (error) {
          console.error("Lỗi khi tải đơn hàng đã hoàn thành:", error);
          Alert.alert("Lỗi", "Không thể tải dữ liệu.");
        } finally {
          setLoading(false);
        }
      };
      fetchCompletedOrders();
    }
  }, [staffUid]);

  const groupedOrders = useMemo(() => {
    const groups: { [key: string]: Order[] } = {};
    orders.forEach(order => {
      const date = new Date(order.$updatedAt).toLocaleDateString('vi-VN'); // Sửa: Dùng $updatedAt và new Date()
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(order);
    });

    return Object.keys(groups).map(date => ({
      title: date,
      data: groups[date],
    }));
  }, [orders]);

  const renderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.staffStyles.baseCard}
      onPress={() => setSelectedOrder(item)}
    >
      <View style={styles.warehouseStyles.orderHeader}>
        <Text style={styles.warehouseStyles.orderId}>
          ĐH: {item.id.slice(-6).toUpperCase()}
        </Text>
        <Text
          style={[
            styles.warehouseStyles.statusText,
            { color: COLORS.primary },
          ]}
        >
          {item.status}
        </Text>
      </View>
      <Text style={styles.warehouseStyles.orderInfo}>
        Khách hàng: {item.customerName || 'N/A'}
      </Text>
      <Text style={styles.warehouseStyles.orderInfo}>
        Tổng tiền: {(item.totalAmount || 0).toLocaleString('vi-VN')} VND
      </Text>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({
    section: { title },
  }: {
    section: GroupedOrders;
  }) => (
    <Text style={styles.homeStyles.sectionTitle}>{title}</Text>
  );

  if (loading) {
    return (
      <View style={styles.staffStyles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.salesStyles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.salesStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 5 }}>
          <Ionicons name="arrow-back" size={28} color={COLORS.text_primary} />
        </TouchableOpacity>
        <Text style={[styles.salesStyles.headerTitle, { flex: 1, textAlign: 'center' }]}>
          Đơn đã soạn
        </Text>
        <View style={{ width: 30 }} />
      </View>

      <SectionList
        sections={groupedOrders}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text style={styles.salesStyles.emptyText}>
            Chưa có đơn hàng nào được hoàn thành trong tháng này.
          </Text>
        }
      />

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          isVisible={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </View>
  );
}
