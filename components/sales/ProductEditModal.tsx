// components/sales/ProductEditModal.tsx

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'; // Giữ lại React
import { useAuth } from '../../context/AuthContext';
import { Category, Product, ProductVariant } from '../../services/ProductService';
import { COLORS, styles } from '../../styles/homeStyle';
import { CustomPicker } from '../CustomPicker';

interface ProductEditModalProps {
  isVisible: boolean;
  onClose: () => void;
  productToEdit: Product | null;
  onSave: (data: Product | Omit<Product, 'id'>) => Promise<void>;
  categories: Category[];
  onShowMessage: (title: string, message: string) => void;
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({ isVisible, onClose, productToEdit, onSave, categories, onShowMessage }) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [unit, setUnit] = useState('');
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState('');
  const [variants, setVariants] = useState<ProductVariant[]>([{ color: '', size: '', quantity: 0 }]);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const isTopLevelManagement = currentUser?.role === 'tongquanly' || currentUser?.role === 'quanlynhansu';
  const isFullManager = currentUser?.role === 'truongphong' || isTopLevelManagement;
  const isWarehouseKeeper = currentUser?.role === 'thukho';
  const isEditing = !!productToEdit;

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setSku(productToEdit.sku);
      setUnit(productToEdit.unit);
      setPrice(productToEdit.price);
      setCategory(productToEdit.category || '');
      setVariants(productToEdit.variants.length > 0 ? productToEdit.variants : [{ color: '', size: '', quantity: 0 }]);
    } else {
      setName(''); setSku(''); setUnit(''); setPrice(0); setCategory('');
      setVariants([{ color: '', size: '', quantity: 0 }]);
    }
  }, [productToEdit]);

  const handleSave = async () => {
    if (!isFullManager && !isWarehouseKeeper) {
      onShowMessage('Lỗi', 'Bạn không có quyền thực hiện thao tác này.');
      return;
    }
    if (!name || !sku || !unit || price <= 0 || !category) {
      onShowMessage('Lỗi', 'Vui lòng điền đủ thông tin và chọn Danh mục.');
      return;
    }
    setLoading(true);
    // [SỬA LỖI] Lọc ra các variant hợp lệ (phải có cả size và số lượng)
    const validVariants = variants.filter(v => v.size && v.size.trim() !== '' && v.quantity > 0);
    if (validVariants.length === 0) {
      onShowMessage('Lỗi', 'Sản phẩm phải có ít nhất một biến thể hợp lệ (có Size và Số lượng > 0).');
      setLoading(false);
      return;
    }

    let finalVariants = validVariants;
    // Nếu là Thủ kho đang chỉnh sửa, chỉ cập nhật số lượng, không xóa các biến thể khác.
    // [SỬA] Logic cho Thủ kho: chỉ cập nhật số lượng của các biến thể gốc.
    // Bỏ qua bất kỳ biến thể mới nào có thể đã được thêm vào state `variants`.
    if (isEditing && isWarehouseKeeper && productToEdit) {
      finalVariants = productToEdit.variants.map(originalVariant => {
        // Tìm biến thể tương ứng trong state `variants` hiện tại để lấy số lượng mới.
        const updatedVariantInState = variants.find(v => v.size === originalVariant.size && v.color === originalVariant.color);
        // Nếu tìm thấy, cập nhật số lượng. Nếu không, giữ nguyên số lượng gốc.
        return updatedVariantInState ? { ...originalVariant, quantity: updatedVariantInState.quantity } : originalVariant;
      });
    }

    const totalQuantity = finalVariants.reduce((sum, v) => sum + v.quantity, 0);
    const productData = { name, sku, unit, price, category, variants: finalVariants, totalQuantity };

    try {
      if (isEditing) {
        await onSave({ ...productData, id: productToEdit!.id });
      } else {
        await onSave(productData);
      }
      onClose();
      onShowMessage('Thành công', `Đã ${isEditing ? 'cập nhật' : 'thêm'} sản phẩm.`);
    } catch (e: any) {
      onShowMessage('Lỗi', e.message || 'Không thể lưu sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  // --- Variant Management Functions ---
  const handleVariantChange = (index: number, field: keyof ProductVariant, value: string | number) => {
    const newVariants = [...variants];
    const variant = newVariants[index];
    if (field === 'quantity') {
        variant[field] = Number(value) || 0;
    } else {
        variant[field] = value as string;
    }
    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants([...variants, { color: '', size: '', quantity: 0 }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      const newVariants = variants.filter((_, i) => i !== index);
      setVariants(newVariants);
    } else {
      onShowMessage('Thông báo', 'Sản phẩm phải có ít nhất một biến thể.');
    }
  };

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={styles.salesStyles.modalOverlay}>
        <View style={[styles.salesStyles.modalView, { height: '90%', width: '95%' }]}>
          {/* [SỬA] Bỏ alignItems: 'center' và thêm width: '100%' cho các phần tử con để chúng chiếm hết chiều ngang */}
          <ScrollView style={{ width: '100%' }} contentContainerStyle={{paddingBottom: 50}}>
          <Text style={[styles.salesStyles.modalTitle, { width: '100%' }]}>{isEditing ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}</Text>
          {/* Vô hiệu hóa các trường nếu là Thủ kho */}
          <View style={[styles.staffStyles.modalInputGroup, isWarehouseKeeper && styles.staffStyles.readOnlyField, {width: '100%'}]}><Ionicons name="cube-outline" size={20} color={COLORS.text_secondary} style={styles.staffStyles.modalInputIcon} /><TextInput style={styles.salesStyles.modalInput} placeholder="Tên sản phẩm" value={name} onChangeText={setName} editable={!isWarehouseKeeper} /></View>
          <View style={[styles.staffStyles.modalInputGroup, isWarehouseKeeper && styles.staffStyles.readOnlyField, {width: '100%'}]}><Ionicons name="barcode-outline" size={20} color={COLORS.text_secondary} style={styles.staffStyles.modalInputIcon} /><TextInput style={styles.salesStyles.modalInput} placeholder="Mã SKU" value={sku} onChangeText={setSku} editable={!isWarehouseKeeper} /></View>
          <View style={[styles.staffStyles.modalInputGroup, isWarehouseKeeper && styles.staffStyles.readOnlyField, {width: '100%'}]}><Ionicons name="options-outline" size={20} color={COLORS.text_secondary} style={styles.staffStyles.modalInputIcon} /><TextInput style={styles.salesStyles.modalInput} placeholder="Đơn vị (cái, hộp)" value={unit} onChangeText={setUnit} editable={!isWarehouseKeeper} /></View>
          <View style={[styles.staffStyles.modalInputGroup, isWarehouseKeeper && styles.staffStyles.readOnlyField, {width: '100%'}]}><Ionicons name="cash-outline" size={20} color={COLORS.text_secondary} style={styles.staffStyles.modalInputIcon} /><TextInput style={styles.salesStyles.modalInput} placeholder="Giá bán" value={price.toString()} onChangeText={(text) => setPrice(parseInt(text) || 0)} keyboardType="numeric" editable={!isWarehouseKeeper} /></View>

          <Text style={[styles.homeStyles.sectionTitle, { marginTop: 20, marginBottom: 10, width: '100%' }]}>Các biến thể sản phẩm</Text>
          
          {variants.map((variant, index) => (
            <View key={index} style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, marginBottom: 15, width: '100%' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontWeight: 'bold', color: COLORS.text_primary }}>Biến thể #{index + 1}</Text>
                {!isWarehouseKeeper && <TouchableOpacity onPress={() => removeVariant(index)}>
                  <Ionicons name="trash-outline" size={22} color={COLORS.error} />
                </TouchableOpacity>}
              </View>
              <TextInput style={[styles.salesStyles.modalInput, isWarehouseKeeper && {backgroundColor: '#F3F4F6'}]} placeholder="Màu sắc (ví dụ: Đỏ, Xanh) - Bỏ trống nếu không có" value={variant.color} onChangeText={(text) => handleVariantChange(index, 'color', text)} editable={!isWarehouseKeeper} />
              <TextInput style={[styles.salesStyles.modalInput, isWarehouseKeeper && {backgroundColor: '#F3F4F6'}]} placeholder="Size (ví dụ: M, L, 50ml) - Bắt buộc" value={variant.size} onChangeText={(text) => handleVariantChange(index, 'size', text)} editable={!isWarehouseKeeper} />
              <TextInput style={styles.salesStyles.modalInput} placeholder="Số lượng tồn kho" value={variant.quantity.toString()} onChangeText={(text) => handleVariantChange(index, 'quantity', text)} keyboardType="numeric" />
            </View>
          ))}

          {!isWarehouseKeeper && <TouchableOpacity onPress={addVariant} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, backgroundColor: '#E0F2F1', borderRadius: 8, marginBottom: 20, width: '100%' }}>
            <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
            <Text style={{ color: COLORS.primary, marginLeft: 8, fontWeight: 'bold' }}>Thêm biến thể</Text>
          </TouchableOpacity>}

          <View style={{width: '100%'}}>
            <CustomPicker
              iconName="grid-outline"
              placeholder="-- Chọn danh mục --"
              items={categories.map(c => ({ label: c.name, value: c.id! }))}
              selectedValue={category}
              onValueChange={setCategory}
              enabled={!isWarehouseKeeper}
            />
          </View>

          <View style={styles.salesStyles.modalButtons}>
            <TouchableOpacity style={[styles.staffStyles.modalButton, styles.staffStyles.modalButtonSecondary]} onPress={onClose}>
              <Text style={styles.staffStyles.modalButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.staffStyles.modalButton, styles.staffStyles.modalButtonPrimary]} onPress={handleSave} disabled={loading}>
              <Text style={styles.staffStyles.modalButtonText}>{loading ? "Đang lưu..." : "Lưu"}</Text>
            </TouchableOpacity>
          </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
