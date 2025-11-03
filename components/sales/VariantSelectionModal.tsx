// components/sales/VariantSelectionModal.tsx

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Product, ProductVariant } from '../../services/ProductService';
import { COLORS, styles } from '../../styles/homeStyle';
import { OrderEditModalStyles } from '../../styles/OrderEditModalStyles';

interface VariantSelectionModalProps {
  product: Product;
  onClose: () => void;
  onSelectVariant: (product: Product, variant: ProductVariant, quantity: number) => void;
}

// [CẢI TIẾN] Component con để quản lý state của từng biến thể một cách độc lập
const VariantItem: React.FC<{
  variant: ProductVariant;
  onAdd: (variant: ProductVariant, quantity: number) => void;
}> = ({ variant, onAdd }) => {
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = useCallback((newQuantity: number) => {
    if (newQuantity > variant.quantity) {
      Alert.alert('Cảnh báo', `Số lượng tồn kho không đủ. Chỉ còn ${variant.quantity} sản phẩm.`);
      setQuantity(variant.quantity);
    } else if (newQuantity < 1) {
      setQuantity(1);
    } else {
      setQuantity(newQuantity);
    }
  }, [variant.quantity]);

  const handlePressAdd = () => {
    if (quantity <= 0) {
      Alert.alert('Lỗi', 'Số lượng phải lớn hơn 0.');
      return;
    }
    onAdd(variant, quantity);
  };

  return (
    <View style={OrderEditModalStyles.variantPickerItem}>
      <View style={{ flex: 1 }}>
        <Text style={OrderEditModalStyles.variantInfoText} numberOfLines={1}>
          {`${variant.color ? `${variant.color} - ` : ''}${variant.size} (Tồn: ${variant.quantity})`}
        </Text>
      </View>
      <View style={styles.salesStyles.quantityControl}>
        <TouchableOpacity onPress={() => handleQuantityChange(quantity - 1)}>
          <Ionicons name="remove-circle-outline" size={28} color={COLORS.text_secondary} />
        </TouchableOpacity>
        <TextInput
          value={quantity.toString()}
          onChangeText={text => handleQuantityChange(parseInt(text) || 1)}
          keyboardType="numeric"
          style={OrderEditModalStyles.qtyInput}
        />
        <TouchableOpacity onPress={() => handleQuantityChange(quantity + 1)}>
          <Ionicons name="add-circle-outline" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={OrderEditModalStyles.variantAddButton} onPress={handlePressAdd}>
        <Text style={OrderEditModalStyles.variantAddButtonText}>Thêm</Text>
      </TouchableOpacity>
    </View>
  );
};

export const VariantSelectionModal: React.FC<VariantSelectionModalProps> = ({ product, onClose, onSelectVariant }) => {
  const handleAdd = (variant: ProductVariant, quantity: number) => {
    onSelectVariant(product, variant, quantity);
  };

  return (
    <Modal visible={true} transparent={true} onRequestClose={onClose} animationType="fade">
      <View style={styles.salesStyles.modalOverlay}>
        <View style={styles.salesStyles.modalView}>
          {/* Header đồng bộ */}
          <View style={styles.salesStyles.categoryModalHeader}>
            <Text style={[styles.salesStyles.modalTitle, { marginBottom: 0 }]}>Chọn biến thể cho {product.name}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle-outline" size={30} color={COLORS.text_secondary} />
            </TouchableOpacity>
          </View>

          {/* Danh sách biến thể */}
          <FlatList
            data={product.variants.filter(v => v.quantity > 0)}
            keyExtractor={(v, i) => `${v.size}-${v.color}-${i}`}
            ListEmptyComponent={<Text style={styles.salesStyles.emptyText}>Sản phẩm này đã hết hàng hoặc chưa có biến thể.</Text>}
            renderItem={({ item: variant }) => <VariantItem variant={variant} onAdd={handleAdd} />}
            style={{ width: '100%', marginTop: 10 }}
          />
        </View>
      </View>
    </Modal>
  );
};
