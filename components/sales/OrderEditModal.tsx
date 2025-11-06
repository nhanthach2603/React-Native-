// components/sales/OrderEditModal.tsx

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Order, OrderItem } from '../../services/OrderService';
import { Product, ProductVariant } from '../../services/ProductService';
import { COLORS, styles } from '../../styles/homeStyle';
import { OrderEditModalStyles } from '../../styles/OrderEditModalStyles'; // Import styles mới
import { VariantSelectionModal } from './VariantSelectionModal'; // Import component mới

// [TỐI ƯU HÓA] Tách item ra component riêng và bọc trong React.memo
const OrderItemRow = React.memo(({
  item,
  onUpdateQty,
  onRemove,
}: {
  item: OrderItem;
  onUpdateQty: (productId: string, variant: ProductVariant, qty: number) => void;
  onRemove: (productId: string, variant: ProductVariant) => void;
}) => {
  return (
    <View style={styles.salesStyles.productItem}>
      <View style={styles.salesStyles.productInfo}>
        <Text style={styles.salesStyles.productName}>{item.productName}</Text>
        <Text style={styles.salesStyles.productDetails}>
          {item.selectedVariant.color ? `${item.selectedVariant.color} - ` : ''}{item.selectedVariant.size}
        </Text>
        <Text style={styles.salesStyles.productDetails}>Giá: {item.price.toLocaleString('vi-VN')} VND</Text>
      </View>
      <View style={styles.salesStyles.quantityControl}>
        <TouchableOpacity onPress={() => onUpdateQty(item.productId, item.selectedVariant, item.qty - 1)} style={{ padding: 4 }}>
          <Ionicons name="remove-circle-outline" size={30} color={COLORS.text_secondary} />
        </TouchableOpacity>
        <TextInput
          value={item.qty.toString()}
          onChangeText={text => onUpdateQty(item.productId, item.selectedVariant, parseInt(text) || 0)}
          keyboardType="numeric"
          style={OrderEditModalStyles.qtyInput}
        />
        <TouchableOpacity onPress={() => onUpdateQty(item.productId, item.selectedVariant, item.qty + 1)} style={{ padding: 4 }}><Ionicons name="add-circle-outline" size={30} color={COLORS.primary} /></TouchableOpacity>
        <TouchableOpacity onPress={() => onRemove(item.productId, item.selectedVariant)} style={{ marginLeft: 12, padding: 4 }}><Ionicons name="trash-outline" size={28} color={COLORS.error} /></TouchableOpacity>
      </View>
    </View>
  );
});

// [SỬA LỖI] Thêm displayName cho component được memo-hóa để tuân thủ quy tắc của React và tránh lỗi.
OrderItemRow.displayName = 'OrderItemRow';

interface OrderEditModalProps {
  isVisible: boolean;
  onClose: () => void;
  orderToEdit: Order | null;
  allProducts: Product[];
  onSave: (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>, orderId?: string) => Promise<void>;
  onShowMessage: (title: string, message: string) => void;
}

export const OrderEditModal: React.FC<OrderEditModalProps> = ({ isVisible, onClose, orderToEdit, allProducts, onSave, onShowMessage }) => {
  const { currentUser } = useAuth();
  const [items, setItems] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [isProductPickerVisible, setProductPickerVisible] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productForVariantSelection, setProductForVariantSelection] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (orderToEdit) {
      setItems(orderToEdit.items);
      setCustomerName(orderToEdit.customerName || '');
      setCustomerPhone(orderToEdit.customerPhone || '');
      setCustomerAddress(orderToEdit.customerAddress || '');
    } else {
      setItems([]);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
    }
  }, [orderToEdit, isVisible]);
  
  const handleAddItem = (product: Product, variant: ProductVariant, quantity: number) => {
    const existingItem = items.find(i => i.productId === product.id && i.selectedVariant.size === variant.size && i.selectedVariant.color === variant.color);

    if (existingItem) {
      // Tăng số lượng nếu sản phẩm đã tồn tại
      handleUpdateQty(existingItem.productId, existingItem.selectedVariant, existingItem.qty + quantity);
    } else {
      // Thêm sản phẩm mới
      const newItem: OrderItem = {
        productId: product.id!,
        productName: product.name,
        sku: product.sku,
        price: product.price,
        qty: quantity,
        selectedVariant: variant,
      };
      setItems([...items, newItem]);
    }
    setProductForVariantSelection(null); // Đóng modal chọn biến thể
    setProductPickerVisible(false); // Đóng modal chọn sản phẩm
  };

  const availableProducts = allProducts.filter(p => {
    // const isInOrder = items.some(item => item.productId === p.id); // Có thể cho phép thêm nhiều biến thể của cùng 1 sản phẩm
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
    return p.totalQuantity > 0 && matchesSearch;
  });

  const handleUpdateQty = useCallback((productId: string, variant: ProductVariant, qty: number) => {
    const handleRemoveItem = (productIdToRemove: string, variantToRemove: ProductVariant) => {
      setItems(currentItems => currentItems.filter(i => !(i.productId === productIdToRemove && i.selectedVariant.size === variantToRemove.size && i.selectedVariant.color === variantToRemove.color)));
    };

    const variantInStock = allProducts.find(p => p.id === productId)?.variants.find(v => v.size === variant.size && v.color === variant.color);
    const stock = variantInStock?.quantity || 0;

    if (qty > stock) {
      onShowMessage('Cảnh báo', `Số lượng tồn kho của biến thể này không đủ (Tồn: ${stock}).`);
      return;
    }
    if (qty <= 0) {
      handleRemoveItem(productId, variant);
    } else {
      setItems(items.map(i => (i.productId === productId && i.selectedVariant.size === variant.size && i.selectedVariant.color === variant.color ? { ...i, qty } : i)));
    }
  }, [allProducts, items, onShowMessage]);

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleSave = async () => {
    if (items.length === 0) {
      onShowMessage('Lỗi', 'Đơn hàng phải có ít nhất một sản phẩm.');
      return;
    }
    setLoading(true);
    const orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
      items,
      totalAmount,
      status: 'Confirmed',
      createdBy: currentUser!.uid,
      creatorName: currentUser!.displayName,
      managerId: currentUser!.managerId,
      customerName,
      customerPhone,
      customerAddress,
    };

    try {
      await onSave(orderData, orderToEdit?.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={isVisible} onRequestClose={onClose} animationType="slide">
      <View style={[styles.salesStyles.container, { paddingTop: 50 }]}>
        {/* [SỬA LỖI] Đặt tiêu đề và nút đóng vào đúng trong View header */}
        <View style={styles.salesStyles.header}>
          <Text style={styles.salesStyles.headerTitle}>{orderToEdit ? 'Sửa Đơn Hàng' : 'Tạo Đơn Hàng'}</Text>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={30} color={COLORS.text_primary} /></TouchableOpacity>
        </View>
        
        {/* Bọc FlatList trong một View với flex: 1 để nó chiếm không gian còn lại */}
        <View style={{ flex: 1 }}>
          <FlatList
            data={items}
            keyExtractor={(item, index) => `${item.productId}-${item.selectedVariant.size}-${item.selectedVariant.color}-${index}`}
            ListHeaderComponent={
              <>
                <Text style={styles.homeStyles.sectionTitle}>Thông tin khách hàng</Text>
                <View style={styles.staffStyles.modalInputGroup}><Ionicons name="person-outline" size={20} color={COLORS.text_secondary} style={styles.staffStyles.modalInputIcon} /><TextInput style={styles.salesStyles.modalInput} placeholder="Tên khách hàng" value={customerName} onChangeText={setCustomerName} /></View>
                <View style={styles.staffStyles.modalInputGroup}><Ionicons name="call-outline" size={20} color={COLORS.text_secondary} style={styles.staffStyles.modalInputIcon} /><TextInput style={styles.salesStyles.modalInput} placeholder="SĐT khách hàng" value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" /></View>
                <View style={styles.staffStyles.modalInputGroup}><Ionicons name="location-outline" size={20} color={COLORS.text_secondary} style={styles.staffStyles.modalInputIcon} /><TextInput style={styles.salesStyles.modalInput} placeholder="Địa chỉ khách hàng" value={customerAddress} onChangeText={setCustomerAddress} /></View>
                
                <Text style={[styles.homeStyles.sectionTitle, { marginTop: 10 }]}>Sản phẩm trong đơn</Text>
                <TouchableOpacity style={OrderEditModalStyles.addItemButton} onPress={() => setProductPickerVisible(true)}><Ionicons name="add" size={20} color={COLORS.white} /><Text style={OrderEditModalStyles.addItemButtonText}>Thêm sản phẩm</Text></TouchableOpacity>
              </>
            }
            renderItem={({ item }) => ( // [TỐI ƯU HÓA] Sử dụng component con đã được memoize
              <OrderItemRow
                item={item}
                onUpdateQty={handleUpdateQty}
                onRemove={(productId, variant) => handleUpdateQty(productId, variant, 0)} // Gọi update với qty=0 để xóa
              />
            )}
            ListEmptyComponent={<Text style={styles.salesStyles.emptyText}>Chưa có sản phẩm nào trong đơn.</Text>}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>

        {/* Modal Chọn Sản Phẩm */}
        <Modal visible={isProductPickerVisible} transparent={true} onRequestClose={() => setProductPickerVisible(false)}>
          <View style={styles.salesStyles.modalOverlay}>
            {/* [SỬA LỖI] Bỏ maxHeight và cho modal chiếm nhiều không gian hơn */}
            <View style={[styles.salesStyles.modalView, { height: '90%', width: '95%' }]}>
              {/* [THAY ĐỔI] Sử dụng style header đồng bộ */}
              <View style={styles.salesStyles.categoryModalHeader}>
                <Text style={[styles.salesStyles.modalTitle, { marginBottom: 0 }]}>Thêm Sản Phẩm</Text>
                <TouchableOpacity onPress={() => setProductPickerVisible(false)}><Ionicons name="close-circle-outline" size={30} color={COLORS.text_secondary} /></TouchableOpacity>
              </View>
              <View style={styles.staffStyles.modalInputGroup}>
                <Ionicons name="search-outline" size={20} color={COLORS.text_secondary} style={styles.staffStyles.modalInputIcon} />
                <TextInput
                  style={styles.salesStyles.modalInput}
                  placeholder="Tìm theo tên sản phẩm..."
                  value={productSearch}
                  onChangeText={setProductSearch}
                />
              </View>
              {/* [SỬA LỖI] Thêm flex: 1 để FlatList lấp đầy không gian */}
              <FlatList
                data={availableProducts}
                keyExtractor={p => p.id!}
                renderItem={({ item }) => (
                <TouchableOpacity style={OrderEditModalStyles.productPickerItem} onPress={() => setProductForVariantSelection(item)}>
                  <View>
                    <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
                      {item.name} ({item.sku})
                    </Text>
                    <Text style={{ color: '#6B7280', marginTop: 4 }}>Giá: {item.price.toLocaleString('vi-VN')} VND | Tồn kho: {item.totalQuantity} {item.unit}</Text>
                  </View>
                </TouchableOpacity>
              )}
                style={{ width: '100%', flex: 1 }} // Thêm flex: 1
                ListEmptyComponent={<Text style={styles.salesStyles.emptyText}>Không tìm thấy sản phẩm.</Text>}
              />
            </View>
          </View>
        </Modal>

        {/* Modal Chọn Biến Thể */}
        {productForVariantSelection && (
          <VariantSelectionModal
            product={productForVariantSelection}
            onClose={() => setProductForVariantSelection(null)}
            onSelectVariant={handleAddItem}
          />
        )}

        {/* Phần chân trang chứa nút Lưu - Luôn hiển thị ở dưới cùng */}
        <View style={OrderEditModalStyles.summaryContainer}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={OrderEditModalStyles.summaryText}>Tổng tiền: <Text style={OrderEditModalStyles.totalAmount}>{totalAmount.toLocaleString('vi-VN')} VND</Text></Text>
          </View>
          <TouchableOpacity style={[styles.staffStyles.modalButton, styles.staffStyles.modalButtonPrimary, { minWidth: 150 }]} onPress={handleSave} disabled={loading}><Text style={styles.staffStyles.modalButtonText}>{loading ? 'Đang lưu...' : 'Lưu Đơn Hàng'}</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
