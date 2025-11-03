// components/sales/CategoryManagerModal.tsx

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Category, ProductService } from '../../services/ProductService';
import { styles } from '../../styles/homeStyle';

interface CategoryManagerModalProps {
  isVisible: boolean;
  onClose: () => void;
  categories: Category[];
  onShowMessage: (title: string, message: string, onConfirm?: () => void) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ isVisible, onClose, categories, onShowMessage }) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const { currentUser } = useAuth();
  const role = currentUser?.role;
  const isTopLevelManager = currentUser?.managerId === null;
  const canManage = role === 'truongphong' || role === 'thukho' || isTopLevelManager;

  const handleAddCategory = async () => {
    if (!canManage) {
      onShowMessage('Lỗi', 'Bạn không có quyền thêm danh mục.');
      return;
    }
    if (newCategoryName.trim() === '') return;
    try {
      await ProductService.addCategory(newCategoryName.trim());
      setNewCategoryName('');
      onShowMessage('Thành công', 'Category đã được thêm.');
    } catch (e: any) {
      onShowMessage('Lỗi', e.message);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!canManage) {
      onShowMessage('Lỗi', 'Bạn không có quyền xóa danh mục.');
      return;
    }
    onShowMessage(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa Category "${name}" không?`,
      () => {
        ProductService.deleteCategory(id)
          .then(() => onShowMessage('Thành công', 'Category đã bị xóa.'))
          .catch((e) => onShowMessage('Lỗi Xóa', e.message));
      }
    );
  };

  return (
    <Modal animationType="fade" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={styles.salesStyles.modalOverlay}>
        <View style={styles.salesStyles.categoryModalView}>
          <View style={styles.salesStyles.categoryModalHeader}><Text style={styles.salesStyles.modalTitle}>Quản lý Danh mục</Text><TouchableOpacity onPress={onClose}><Ionicons name="close" size={28} color="#6B7280" /></TouchableOpacity></View>
          {canManage && (<View style={styles.salesStyles.categoryInputGroup}><TextInput style={styles.salesStyles.categoryInput} placeholder="Tên danh mục mới" value={newCategoryName} onChangeText={setNewCategoryName} /><TouchableOpacity onPress={handleAddCategory} style={styles.salesStyles.categoryAddButton}><Ionicons name="add-circle" size={40} color="#10B981" /></TouchableOpacity></View>)}
          <Text style={styles.salesStyles.categoryListTitle}>Danh sách hiện có:</Text>
          <ScrollView style={styles.salesStyles.categoryListContainer}>
            {categories.length > 0 ? (categories.map(cat => (<View key={cat.id} style={styles.salesStyles.categoryItem}><Text style={styles.salesStyles.categoryName}>{cat.name}</Text>{canManage && (<TouchableOpacity onPress={() => handleDeleteCategory(cat.id!, cat.name)} style={styles.salesStyles.categoryDeleteButton}><Ionicons name="trash-outline" size={24} color="#EF4444" /></TouchableOpacity>)}</View>))) : (<Text style={styles.salesStyles.emptyText}>Không có danh mục nào.</Text>)}
          </ScrollView>
          <TouchableOpacity onPress={onClose} style={[styles.staffStyles.modalButton, styles.staffStyles.modalButtonSecondary, { width: '100%', marginTop: 20 }]}><Text style={styles.staffStyles.modalButtonText}>Đóng</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
