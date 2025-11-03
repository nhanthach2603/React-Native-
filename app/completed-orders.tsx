// app/completed-orders.tsx

import { Ionicons } from '@expo/vector-icons';
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
import { OrderDetailModal } from '../components/warehouse/OrderDetailModal';
import { Order, OrderService } from '../services/OrderService';
import { COLORS, styles } from '../styles/homeStyle';

interface GroupedOrders {
  title: string;
  data: Order[];
}

export default function CompletedOrdersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { staffUid, staffName } = params;
  const insets = useSafeAreaInsets();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (typeof staffUid === 'string') {
      OrderService.getCompletedOrdersForStaffByMonth(staffUid)
        .then(completedOrders => {
          setOrders(completedOrders);
        })
        .finally(() => setLoading(false));
    }
  }, [staffUid]);

  const groupedOrders = useMemo(() => {
    const groups: { [key: string]: Order[] } = {};
    orders.forEach(order => {
      const date = order.updatedAt.toDate().toLocaleDateString('vi-VN');
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
        Tổng tiền: {item.totalAmount.toLocaleString('vi-VN')} VND
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
