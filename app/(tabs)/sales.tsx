import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react'; // Giữ lại React
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryManagerModal } from '../../components/sales/CategoryManagerModal'; // Đã sửa lỗi
import { ConfirmationModal } from '../../components/sales/ConfirmationModal'; // Đã sửa lỗi
import { OrderEditModal } from '../../components/sales/OrderEditModal'; // Đã sửa lỗi
import { ProductEditModal } from '../../components/sales/ProductEditModal';
import { useAuth } from '../../context/AuthContext';
import { Order, OrderService, OrderStatus } from '../../services/OrderService';
import { Category, Product, ProductService } from '../../services/ProductService';
import { StaffService, StaffUser } from '../../services/StaffService';
import { COLORS, styles } from '../../styles/homeStyle';

// --- COMPONENTS ---


// --- MÀN HÌNH SALES CHÍNH ---
export default function SalesScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser, user } = useAuth(); // Lấy currentUser từ useAuth
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isOrderModalVisible, setOrderModalVisible] = useState(false);
  const [isCategoryManagerVisible, setCategoryManagerVisible] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  
  const [searchText, setSearchText] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // States for general confirmation modal
  const [isConfirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [confirmationTitle, setConfirmationTitle] = useState('');
  const [confirmationAction, setConfirmationAction] = useState<(() => void) | null>(null);
  const [isSuccessModal, setIsSuccessModal] = useState(false);

  // Logic mới: Tổng quản lý (managerId=null) cũng có quyền quản lý
  const isTopLevelManager = currentUser?.managerId === null || currentUser?.role === 'quanlynhansu'; // Đã sửa ở lần trước
  const canManage = currentUser?.role === 'truongphong' || currentUser?.role === 'thukho' || isTopLevelManager;
  const canCreateOrder = currentUser?.role === 'truongphong' || currentUser?.role === 'nhanvienkd' || isTopLevelManager;
  // Khởi tạo viewMode dựa trên quyền tạo đơn hàng
  const [viewMode, setViewMode] = useState<'products' | 'orders'>(canCreateOrder ? 'orders' : 'products'); // Sửa lỗi: Xóa khai báo trùng lặp ở trên

  useEffect(() => {
    const unsubscribeProducts = ProductService.subscribeToProducts((productsData) => {
      setProducts(productsData);
      setLoading(false);
    });
    const unsubscribeCategories = ProductService.subscribeToCategories((categoriesData) => {
      setCategories(categoriesData);
    });

    let unsubscribeOrders: () => void;
    if (currentUser?.role === 'truongphong' && user?.uid) {
      StaffService.getStaffList(user.uid, currentUser.role, currentUser.managerId).then(staff => {
        setStaffList(staff);
        const staffUids = staff.filter(s => s.role === 'nhanvienkd').map(s => s.uid);
        unsubscribeOrders = OrderService.subscribeToManagerOrders(user.uid, staffUids, setOrders);
      });
    } else if (currentUser?.role === 'nhanvienkd' && user?.uid) {
      unsubscribeOrders = OrderService.subscribeToSalespersonOrders(user.uid, setOrders);
    }

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
      if (unsubscribeOrders) unsubscribeOrders();
    };
  }, [currentUser, user]); // Thêm currentUser vào dependency array

  // Sửa lỗi: Hàm getStatusColor bị sai cú pháp
  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = { Draft: '#6B7280', Confirmed: '#F59E0B', Assigned: '#3B82F6', Processing: '#8B5CF6', Completed: '#0E7490', Shipped: '#10B981', Canceled: '#EF4444' };
    return colors[status] || '#6B7280';
  };

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

  const handleSaveOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>, orderId?: string) => {
    if (orderId) {
      await OrderService.updateOrder(orderId, orderData);
      handleShowMessage('Thành công', 'Đã cập nhật đơn hàng.');
    } else {
      await OrderService.addOrder(orderData);
      handleShowMessage('Thành công', 'Đã tạo đơn hàng mới.');
    }
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

  const handleOpenOrderModal = (order: Order | null) => {
    setOrderToEdit(order);
    setOrderModalVisible(true);
  };

  const handleDeleteOrder = (order: Order) => {
    if (currentUser?.role !== 'truongphong') {
      handleShowMessage('Lỗi', 'Bạn không có quyền xóa đơn hàng.');
      return;
    }
    handleShowMessage('Xác nhận xóa', `Bạn có chắc muốn xóa đơn hàng ${order.id.slice(-6).toUpperCase()}?`, async () => {
      await OrderService.deleteOrder(order);
      handleShowMessage('Thành công', 'Đã xóa đơn hàng.');
    });
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

  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.staffStyles.baseCard}>
      <View style={styles.warehouseStyles.orderHeader}>
        <Text style={styles.warehouseStyles.orderId}>ĐH: {item.id.slice(-6).toUpperCase()}</Text>
        <Text style={[styles.warehouseStyles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
      </View>
      <Text style={styles.warehouseStyles.orderInfo}>Người tạo: {item.creatorName}</Text>
      <Text style={styles.warehouseStyles.orderInfo}>Ngày tạo: {item.createdAt?.toDate().toLocaleDateString('vi-VN')}</Text>
      <Text style={styles.warehouseStyles.orderInfo}>Tổng tiền: {item.totalAmount.toLocaleString('vi-VN')} VND</Text>
      <View style={styles.warehouseStyles.actionButtons}>
        {(item.status === 'Draft' || item.status === 'Confirmed') && (
          <TouchableOpacity onPress={() => handleOpenOrderModal(item)} style={[styles.warehouseStyles.actionButton, { backgroundColor: COLORS.accent, marginRight: 10 }]}>
            <Text style={styles.warehouseStyles.actionButtonText}>Sửa</Text>
          </TouchableOpacity>
        )}
        {currentUser?.role === 'truongphong' && (
          <TouchableOpacity onPress={() => handleDeleteOrder(item)} style={[styles.warehouseStyles.actionButton, { backgroundColor: COLORS.error }]}>
            <Text style={styles.warehouseStyles.actionButtonText}>Xóa</Text>
          </TouchableOpacity>
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
    <> {/* Sử dụng React.Fragment để bọc nhiều phần tử */}
      <View style={[styles.salesStyles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.staffStyles.viewModeContainer}>
          <TouchableOpacity onPress={() => setViewMode('products')} style={[styles.staffStyles.viewModeButton, viewMode === 'products' && styles.staffStyles.viewModeButtonActive]}><Text style={[styles.staffStyles.viewModeText, viewMode === 'products' && styles.staffStyles.viewModeTextActive]}>Sản Phẩm</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setViewMode('orders')} style={[styles.staffStyles.viewModeButton, viewMode === 'orders' && styles.staffStyles.viewModeButtonActive]}><Text style={[styles.staffStyles.viewModeText, viewMode === 'orders' && styles.staffStyles.viewModeTextActive]}>Đơn Hàng</Text></TouchableOpacity>
        </View>

        {viewMode === 'products' && (
          <>
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
          </>
        )}

        {viewMode === 'orders' && (
          <>
            <View style={styles.salesStyles.header}>
              <Text style={styles.salesStyles.headerTitle}>Quản lý Đơn hàng</Text>
              {canCreateOrder && (
                <TouchableOpacity onPress={() => handleOpenOrderModal(null)} style={styles.salesStyles.addButton}>
                  <Ionicons name="add-circle-outline" size={30} color="#10B981" />
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={orders}
              keyExtractor={item => item.id}
              renderItem={renderOrderItem}
              ListEmptyComponent={<Text style={styles.salesStyles.emptyText}>Chưa có đơn hàng nào.</Text>}
            />
          </>
        )}
      </View>
      <ProductEditModal
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
        productToEdit={productToEdit}
        onSave={handleSaveProduct}
        categories={categories}
        onShowMessage={handleShowMessage}
      />
      <OrderEditModal
        isVisible={isOrderModalVisible}
        onClose={() => setOrderModalVisible(false)}
        orderToEdit={orderToEdit}
        allProducts={products}
        onSave={handleSaveOrder}
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
    </>
  );
}