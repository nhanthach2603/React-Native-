import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Button,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Category, Product, ProductService } from '../../services/ProductService';
import { styles } from '../../styles/homeStyle';

// --- COMPONENTS ---

// Component Modal Thêm/Sửa Sản phẩm
interface ProductEditModalProps {
    isVisible: boolean;
    onClose: () => void;
    productToEdit: Product | null;
    onSave: (data: Product | Omit<Product, 'id'>) => Promise<void>;
    categories: Category[];
    onShowMessage: (title: string, message: string) => void;
}

const ProductEditModal: React.FC<ProductEditModalProps> = ({ isVisible, onClose, productToEdit, onSave, categories, onShowMessage }) => {
    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [quantity, setQuantity] = useState(0);
    const [unit, setUnit] = useState('');
    const [price, setPrice] = useState(0);
    const [category, setCategory] = useState('');
    const [loading, setLoading] = useState(false);
    const [isCategoryPickerOpen, setCategoryPickerOpen] = useState(false);
    const { role } = useAuth();
    const canManage = role === 'truongphong' || role === 'thukho' || role === 'quanlynansu';

    const isEditing = !!productToEdit;

    useEffect(() => {
        if (productToEdit) {
            setName(productToEdit.name);
            setSku(productToEdit.sku);
            setQuantity(productToEdit.quantity);
            setUnit(productToEdit.unit);
            setPrice(productToEdit.price);
            setCategory(productToEdit.category || '');
        } else {
            setName(''); setSku(''); setQuantity(0); setUnit(''); setPrice(0); setCategory('');
        }
    }, [productToEdit]);

    const handleSave = async () => {
        if (!canManage) {
            onShowMessage('Lỗi', 'Bạn không có quyền thực hiện thao tác này.');
            return;
        }
        if (!name || !sku || !unit || price <= 0 || !category) {
            onShowMessage('Lỗi', 'Vui lòng điền đủ thông tin và chọn Danh mục.');
            return;
        }
        setLoading(true);
        const productData = { name, sku, quantity, unit, price, category };

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

    const currentCategoryName = categories.find(c => c.id === category)?.name || 'Chọn Danh mục';

    return (
        <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
            <View style={styles.salesStyles.modalOverlay}>
                <View style={styles.salesStyles.modalView}>
                    <Text style={styles.salesStyles.modalTitle}>{isEditing ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}</Text>
                    <TextInput style={styles.salesStyles.modalInput} placeholder="Tên sản phẩm" placeholderTextColor="#9CA3AF" value={name} onChangeText={setName} />
                    <TextInput style={styles.salesStyles.modalInput} placeholder="Mã SKU (A4-DA-500)" placeholderTextColor="#9CA3AF" value={sku} onChangeText={setSku} />
                    <TextInput
                        style={styles.salesStyles.modalInput}
                        placeholder="Số lượng tồn kho (Ví dụ: 100)"
                        placeholderTextColor="#9CA3AF"
                        value={quantity.toString()}
                        onChangeText={(text) => setQuantity(parseInt(text) || 0)}
                        keyboardType="numeric"
                    />
                    <TouchableOpacity
                        style={[styles.salesStyles.modalInput, { justifyContent: 'center', flexDirection: 'row', justifyContent: 'space-between' }]}
                        onPress={() => setCategoryPickerOpen(true)}
                    >
                        <Text style={{ color: category ? '#1F2937' : '#9CA3AF' }}>
                            {currentCategoryName}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#6B7280" />
                    </TouchableOpacity>
                    <TextInput style={styles.salesStyles.modalInput} placeholder="Đơn vị (cái, hộp)" placeholderTextColor="#9CA3AF" value={unit} onChangeText={setUnit} />
                    <TextInput style={styles.salesStyles.modalInput} placeholder="Giá bán (Ví dụ: 55000)" placeholderTextColor="#9CA3AF" value={price.toString()} onChangeText={(text) => setPrice(parseInt(text) || 0)} keyboardType="numeric" />
                    <View style={styles.salesStyles.modalButtons}>
                        <Button title="Hủy" onPress={onClose} color="#EF4444" />
                        <Button title={loading ? "Đang xử lý..." : isEditing ? 'Lưu Thay Đổi' : 'Thêm Sản Phẩm'} onPress={handleSave} disabled={loading} color="#10B981" />
                    </View>
                    <Modal visible={isCategoryPickerOpen} animationType="slide" transparent={true}>
                        <View style={styles.salesStyles.modalOverlay}>
                            <View style={[styles.salesStyles.modalView, { height: 350 }]}>
                                <Text style={styles.salesStyles.modalTitle}>Chọn Danh mục</Text>
                                <FlatList
                                    data={categories}
                                    keyExtractor={(item) => item.id!}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            onPress={() => {
                                                setCategory(item.id!);
                                                setCategoryPickerOpen(false);
                                            }}
                                            style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#EEE' }}
                                        >
                                            <Text>{item.name}</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                                <Button title="Đóng" onPress={() => setCategoryPickerOpen(false)} />
                            </View>
                        </View>
                    </Modal>
                </View>
            </View>
        </Modal>
    );
};

// Component Modal Quản lý Category
const CategoryManagerModal: React.FC<{ isVisible: boolean; onClose: () => void; categories: Category[]; onShowMessage: (title: string, message: string) => void; }> = ({ isVisible, onClose, categories, onShowMessage }) => {
    const [newCategoryName, setNewCategoryName] = useState('');
    const { role } = useAuth();
    const canManage = role === 'truongphong' || role === 'thukho' || role === 'quanlynansu';

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
                <View style={modalLocalStyles.categoryModalView}>
                    {/* Header */}
                    <View style={modalLocalStyles.modalHeader}>
                        <Text style={modalLocalStyles.modalTitle}>Quản lý Danh mục</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={28} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Input Thêm mới */}
                    {canManage && (
                        <View style={modalLocalStyles.inputGroup}>
                            <TextInput style={modalLocalStyles.categoryInput} placeholder="Tên danh mục mới" value={newCategoryName} onChangeText={setNewCategoryName} />
                            <TouchableOpacity onPress={handleAddCategory} style={modalLocalStyles.addButton}>
                                <Ionicons name="add-circle" size={40} color="#10B981" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Danh sách */}
                    <Text style={modalLocalStyles.listTitle}>Danh sách hiện có:</Text>
                    <ScrollView style={modalLocalStyles.listContainer}>
                        {categories.length > 0 ? (
                            categories.map(cat => (
                                <View key={cat.id} style={modalLocalStyles.categoryItem}>
                                    <Text style={modalLocalStyles.categoryName}>{cat.name}</Text>
                                    {canManage && (
                                        <TouchableOpacity onPress={() => handleDeleteCategory(cat.id!, cat.name)} style={modalLocalStyles.deleteButton}>
                                            <Ionicons name="trash-outline" size={24} color="#EF4444" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))
                        ) : (
                            <Text style={modalLocalStyles.emptyListText}>Không có danh mục nào.</Text>
                        )}
                    </ScrollView>

                    {/* Nút Đóng */}
                    <TouchableOpacity onPress={onClose} style={modalLocalStyles.closeButton}>
                        <Text style={modalLocalStyles.closeButtonText}>Đóng</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// Component Modal xác nhận chung (thay thế cho Alert)
interface ConfirmationModalProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onConfirm: () => void;
  isSuccessModal?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isVisible, onClose, title, message, onConfirm, isSuccessModal = false }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.salesStyles.modalOverlay}>
        <View style={styles.salesStyles.modalView}>
          <Ionicons
            name={isSuccessModal ? "checkmark-circle-outline" : "alert-circle-outline"}
            size={50}
            color={isSuccessModal ? "#10B981" : "#FFD700"}
          />
          <Text style={styles.salesStyles.modalTitle}>{title}</Text>
          <Text style={{ textAlign: 'center', marginBottom: 20 }}>{message}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', width: '100%' }}>
            {isSuccessModal ? (
              <Button title="Đóng" onPress={onClose} color="#10B981" />
            ) : (
              <>
                <Button title="Hủy" onPress={onClose} color="#6B7280" />
                <View style={{ width: 10 }} />
                <Button title="Xác nhận" onPress={onConfirm} color="#EF4444" />
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};


// --- MÀN HÌNH SALES CHÍNH ---
export default function SalesScreen() {
  const insets = useSafeAreaInsets();
  const { role } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isCategoryManagerVisible, setCategoryManagerVisible] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  
  const [searchText, setSearchText] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // States for general confirmation modal
  const [isConfirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [confirmationTitle, setConfirmationTitle] = useState('');
  const [confirmationAction, setConfirmationAction] = useState<(() => void) | null>(null);
  const [isSuccessModal, setIsSuccessModal] = useState(false);

  const canManage = role === 'truongphong' || role === 'thukho' || role === 'quanlynansu';

  useEffect(() => {
    const unsubscribeProducts = ProductService.subscribeToProducts((productsData) => {
      setProducts(productsData);
      setLoading(false);
    });
    const unsubscribeCategories = ProductService.subscribeToCategories((categoriesData) => {
      setCategories(categoriesData);
    });
    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
    };
  }, [role]);

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategoryId ? p.category === selectedCategoryId : true;
    const matchesSearch = searchText ?
      p.name.toLowerCase().includes(searchText.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchText.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  const handleShowMessage = (title: string, message: string, onConfirm?: () => void) => {
    setConfirmationTitle(title);
    setConfirmationMessage(message);
    setIsSuccessModal(!onConfirm); 
    setConfirmationAction(() => onConfirm || null);
    setConfirmationModalVisible(true);
  };

  const handleSaveProduct = async (productData: Product | Omit<Product, 'id'>) => {
    if ('id' in productData) {
      await ProductService.updateProduct(productData.id!, productData);
    } else {
      await ProductService.addProduct(productData);
    }
    setProductToEdit(null);
    setModalVisible(false);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (!canManage) {
      handleShowMessage("Không có quyền", "Bạn không có quyền xóa sản phẩm này.");
      return;
    }
    handleShowMessage(
      "Xác nhận xóa",
      `Bạn có chắc chắn muốn xóa sản phẩm "${name}" khỏi kho không?`,
      () => {
        ProductService.deleteProduct(id)
          .then(() => handleShowMessage("Thành công", "Sản phẩm đã bị xóa."))
          .catch((e) => handleShowMessage("Lỗi", e.message));
      }
    );
  };

  const handleOpenModal = (product: Product | null) => {
    setProductToEdit(product);
    setModalVisible(true);
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.salesStyles.productItem}>
      <View style={styles.salesStyles.productInfo}>
        <Text style={styles.salesStyles.productName}>{item.name}</Text>
        <Text style={styles.salesStyles.productDetails}>Mã SKU: {item.sku} | Danh mục: {categories.find(c => c.id === item.category)?.name || 'N/A'}</Text>
        <Text style={styles.salesStyles.productDetails}>Giá: {item.price.toLocaleString('vi-VN')} VND</Text>
      </View>
      <View style={styles.salesStyles.quantityControl}>
        <Text style={styles.salesStyles.quantityText}>{item.quantity} {item.unit}</Text>
        {canManage && (
          <View style={{ marginLeft: 15, flexDirection: 'row' }}>
            <TouchableOpacity onPress={() => handleOpenModal(item)} style={{ marginRight: 10 }}>
              <Ionicons name="create-outline" size={24} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteProduct(item.id!, item.name)}>
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.salesStyles.container, styles.salesStyles.loadingContainer]}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <View style={[styles.salesStyles.container, { paddingTop: insets.top + 20 }]}>
      <View style={styles.salesStyles.header}>
        <Text style={styles.salesStyles.headerTitle}>Quản lý Sản phẩm</Text>
        <View style={{ flexDirection: 'row' }}>
          {canManage && (
            <TouchableOpacity onPress={() => setCategoryManagerVisible(true)} style={{ marginRight: 15 }}>
              <Ionicons name="folder-open-outline" size={30} color="#F59E0B" />
            </TouchableOpacity>
          )}
          {canManage && (
            <TouchableOpacity onPress={() => handleOpenModal(null)} style={styles.salesStyles.addButton}>
              <Ionicons name="add-circle-outline" size={30} color="#10B981" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={{ marginBottom: 10 }}>
        <TextInput
          style={{ height: 45, backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 15, fontSize: 16, borderWidth: 1, borderColor: '#DDD' }}
          placeholder="Tìm kiếm theo tên sản phẩm hoặc SKU..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 15, alignItems: 'center' }}>
        <Text style={{ fontWeight: '600', marginRight: 10 }}>Danh mục:</Text>
        <ScrollView horizontal style={{ flexDirection: 'row' }} showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            onPress={() => setSelectedCategoryId(null)}
            style={{ padding: 8, backgroundColor: selectedCategoryId === null ? '#10B981' : '#E5E7EB', borderRadius: 8, marginRight: 8 }}
          >
            <Text style={{ color: selectedCategoryId === null ? '#FFFFFF' : '#1F2937' }}>Tất cả</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategoryId(cat.id!)}
              style={{ padding: 8, backgroundColor: selectedCategoryId === cat.id ? '#10B981' : '#E5E7EB', borderRadius: 8, marginRight: 8 }}
            >
              <Text style={{ color: selectedCategoryId === cat.id ? '#FFFFFF' : '#1F2937' }}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id!}
        renderItem={renderProductItem}
        style={styles.salesStyles.productList}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={() => (
          <Text style={styles.salesStyles.emptyText}>Không tìm thấy sản phẩm nào.</Text>
        )}
      />
      <ProductEditModal
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
        productToEdit={productToEdit}
        onSave={handleSaveProduct}
        categories={categories}
        onShowMessage={handleShowMessage}
      />
      <CategoryManagerModal
        isVisible={isCategoryManagerVisible}
        onClose={() => setCategoryManagerVisible(false)}
        categories={categories}
        onShowMessage={handleShowMessage}
      />
      <ConfirmationModal
        isVisible={isConfirmationModalVisible}
        onClose={() => setConfirmationModalVisible(false)}
        title={confirmationTitle}
        message={confirmationMessage}
        onConfirm={() => {
          if (confirmationAction) confirmationAction();
          setConfirmationModalVisible(false);
        }}
        isSuccessModal={isSuccessModal}
      />
    </View>
  );
}

const modalLocalStyles = StyleSheet.create({
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  categoryInput: {
    flex: 1,
    height: 45,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginRight: 10,
  },
  addButton: {
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'left',
    width: '100%',
  },
  listContainer: {
    maxHeight: 200,
    width: '100%',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 5,
  },
  emptyListText: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 20,
    fontStyle: 'italic',
  },
  closeButton: {
    marginTop: 30,
    backgroundColor: '#6B7280',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  categoryModalView: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});