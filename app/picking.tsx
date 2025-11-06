// app/picking.tsx
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QuickNav } from '../components/QuickNav';
import { Order, OrderItem, OrderService } from '../services/OrderService';
import { COLORS, styles } from '../styles/homeStyle';

export default function PickingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const order: Order = JSON.parse(params.order as string);
  const insets = useSafeAreaInsets();

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [isReportModalVisible, setReportModalVisible] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');

  const handleCheckItem = (item: OrderItem) => {
    const itemId = `${item.productId}-${item.selectedVariant.color}-${item.selectedVariant.size}`;
    setCheckedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const allItemsChecked = order.items.length > 0 && order.items.every(item => {
    const itemId = `${item.productId}-${item.selectedVariant.color}-${item.selectedVariant.size}`;
    return !!checkedItems[itemId];
  });

  const handleCompletePicking = async () => {
    if (!allItemsChecked) {
      Alert.alert("Chưa hoàn tất", "Bạn cần xác nhận đã soạn tất cả sản phẩm.");
      return;
    }
    setLoading(true);
    try {
      await OrderService.completeOrderAndUpdateStock(order);
      Alert.alert('Thành công', 'Đã hoàn thành soạn hàng và cập nhật tồn kho.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('Lỗi', e.message || 'Không thể hoàn thành đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  const handleReportIssue = async () => {
    if (!revisionNote.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập lý do báo cáo.");
      return;
    }
    setLoading(true);
    try {
      await OrderService.updateOrder(order.id, {
        status: 'PendingRevision',
        revisionNote: revisionNote.trim(),
      });
      Alert.alert('Thành công', 'Đã gửi báo cáo về cho người tạo đơn.', [
        { text: 'OK', onPress: () => {
            setReportModalVisible(false);
            router.back();
        }}
      ]);
    } catch (e: any) {
      Alert.alert('Lỗi', e.message || 'Không thể gửi báo cáo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.salesStyles.container, { paddingTop: insets.top }]}>
      {/* Thêm dòng này để ẩn header mặc định */}
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.salesStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ position: 'absolute', left: 20, top: 20, zIndex: 1 }}>
          <Ionicons name="arrow-back" size={28} color={COLORS.text_primary} />
        </TouchableOpacity>
        <Text style={[styles.salesStyles.headerTitle, {width: '100%', textAlign: 'center'}]}>Soạn Đơn Hàng</Text>
      </View>

      <ScrollView style={{ paddingHorizontal: 20 }} contentContainerStyle={{ paddingBottom: 150 /* Thêm khoảng trống cho footer */ }}>
        <Text style={styles.warehouseStyles.orderId}>ĐH: {order.id.slice(-6).toUpperCase()}</Text>
        <Text style={styles.warehouseStyles.orderInfo}>Khách hàng: {order.customerName || 'N/A'}</Text>
        <Text style={[styles.homeStyles.sectionTitle, { marginTop: 20 }]}>Danh sách sản phẩm cần soạn</Text>

        {order.items.map((item, index) => {
          const itemId = `${item.productId}-${item.selectedVariant.color}-${item.selectedVariant.size}`;
          return (
            <View key={index} style={styles.pickingStyles.itemContainer}>
              <BouncyCheckbox
                size={28}
                fillColor={COLORS.primary}
                unFillColor="#FFFFFF"
                iconStyle={{ borderColor: COLORS.primary }}
                innerIconStyle={{ borderWidth: 2 }}
                isChecked={!!checkedItems[itemId]}
                onPress={() => handleCheckItem(item)}
              />
              <View style={styles.pickingStyles.itemInfo}>
                <Text style={styles.pickingStyles.itemName}>{item.productName}</Text>
                <Text style={styles.pickingStyles.itemVariant}>
                  {`${item.selectedVariant.color ? `${item.selectedVariant.color} - ` : ''}${item.selectedVariant.size}`}
                </Text>
              </View>
              <Text style={styles.pickingStyles.itemQuantity}>SL: {item.qty}</Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Modal Báo cáo */}
      <Modal visible={isReportModalVisible} transparent={true} animationType="slide">
        <View style={styles.salesStyles.modalOverlay}>
          <View style={styles.salesStyles.modalView}>
            <Text style={styles.salesStyles.modalTitle}>Báo cáo vấn đề</Text>
            <Text style={{ marginBottom: 15, color: COLORS.text_secondary, textAlign: 'center' }}>
              Nhập lý do tại sao không thể hoàn thành đơn hàng (ví dụ: thiếu hàng, hàng lỗi...).
            </Text>
            <TextInput
              style={styles.pickingStyles.reportInput}
              placeholder="Nhập lý do..."
              multiline
              value={revisionNote}
              onChangeText={setRevisionNote}
            />
            <View style={styles.salesStyles.modalButtons}>
              <TouchableOpacity
                style={[styles.staffStyles.modalButton, styles.staffStyles.modalButtonSecondary]}
                onPress={() => setReportModalVisible(false)}
              >
                <Text style={styles.staffStyles.modalButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.staffStyles.modalButton, styles.staffStyles.modalButtonPrimary]}
                onPress={handleReportIssue}
                disabled={loading}
              >
                <Text style={styles.staffStyles.modalButtonText}>{loading ? 'Đang gửi...' : 'Gửi Báo Cáo'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Thanh điều hướng nhanh */}
      <QuickNav />
    </View>
  );
}
