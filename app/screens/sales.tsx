import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomPicker } from '../../components/CustomPicker';
import { QuickNav } from '../../components/QuickNav';
import { CategoryManagerModal } from '../../components/sales/CategoryManagerModal';
import { ConfirmationModal } from '../../components/sales/ConfirmationModal';
import { OrderEditModal } from '../../components/sales/OrderEditModal';
import { ProductEditModal } from '../../components/sales/ProductEditModal';
import { useAuth } from '../../context/AuthContext';
import { Category, CategoryService } from '../../services/CategoryService';
import { OrderService } from '../../services/OrderService';
import { Product, ProductService } from '../../services/ProductService';
import { StaffService, StaffUser } from '../../services/StaffService';
import { Order, OrderStatus } from '../../services/types';
import { COLORS, styles } from '../../styles/homeStyle';

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

  const [isAssignToWHManagerModalVisible, setAssignToWHManagerModalVisible] = useState(false);
  const [orderToAssignToWHManager, setOrderToAssignToWHManager] = useState<Order | null>(null);
  const [warehouseManagers, setWarehouseManagers] = useState<StaffUser[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // States for general confirmation modal
  const [isConfirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [confirmationTitle, setConfirmationTitle] = useState('');
  const [confirmationAction, setConfirmationAction] = useState<(() => void) | null>(null);
  const [isSuccessModal, setIsSuccessModal] = useState(false);

  // Thống nhất logic xác định quyền quản lý dựa trên vai trò 'role'
  const isTopLevelManagement = currentUser?.role === 'tongquanly' || currentUser?.role === 'quanlynhansu';
  const canManage = currentUser?.role === 'truongphong' || currentUser?.role === 'thukho' || isTopLevelManagement;
  const canCreateOrder = currentUser?.role === 'truongphong' || currentUser?.role === 'nhanvienkd' || isTopLevelManagement;
  // Khởi tạo viewMode dựa trên quyền tạo đơn hàng
  const [viewMode, setViewMode] = useState<'products' | 'orders'>(canCreateOrder ? 'orders' : 'products');

  useEffect(() => {
    const subscriptions: (() => void)[] = [];
    let isMounted = true;

    const initializeSubscriptions = async () => {
      setLoading(true);

      // Subscribe to products
      const unsubscribeProducts = ProductService.subscribeToProducts((productsData) => {
        if (isMounted) {
          setProducts(productsData);
          setLoading(false); // Set loading to false after the first data fetch
        }
      });
      subscriptions.push(unsubscribeProducts);

      // Subscribe to categories
      const unsubscribeCategories = CategoryService.subscribeToCategories((categoriesData) => {
        if (isMounted) setCategories(categoriesData);
      });
      subscriptions.push(unsubscribeCategories);

      // Setup order subscription based on user role
      if (user?.$id && currentUser?.role) {
        let unsubscribeOrder: (() => void) | undefined;
        
        // **KHỐI CODE ĐÃ SỬA LỖI**
        if (currentUser.role === 'tongquanly') {
          unsubscribeOrder = OrderService.subscribeToAllOrders(setOrders);
        } else if (currentUser.role === 'truongphong') {
          
          const managerIdToUse = currentUser.managerId || ''; 
          
          const staff = (await StaffService.getStaffList(user.$id!, currentUser.role, managerIdToUse)) || [];
          const staffUids = staff.filter((s: { role: string; }) => s.role === 'nhanvienkd').map((s: { uid: any; }) => s.uid);
          let whManagers: StaffUser[] = [];
          try {
            whManagers = (await StaffService.getStaffByRole('thukho')) as StaffUser[];
          } catch (error) {
            console.error("Error fetching warehouse managers:", error);
            whManagers = []; // Ensure it's an empty array on error
            // Optionally, show a message to the user
            // handleShowMessage('Lỗi', 'Không thể tải danh sách thủ kho.');
          }
          if (isMounted) setWarehouseManagers(whManagers);
          
          // Sử dụng user.$id!
          unsubscribeOrder = OrderService.subscribeToManagerOrders(user.$id!, staffUids, setOrders);
          
        } else if (currentUser.role === 'nhanvienkd') {
          unsubscribeOrder = OrderService.subscribeToSalespersonOrders(user.$id!, setOrders);
        } else if (currentUser.role === 'thukho') {
          unsubscribeOrder = OrderService.subscribeToWarehouseManagerOrders(user.$id!, setOrders);
        }
        // **KẾT THÚC KHỐI SỬA LỖI**

        if (unsubscribeOrder) {
          subscriptions.push(unsubscribeOrder);
        } else {
          console.warn("Order subscription was not initialized for current user role or ID.");
        }
      }
    };

    initializeSubscriptions();

    return () => {
      isMounted = false;
      console.log("Cleaning up sales subscriptions...");
      subscriptions.forEach(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, [currentUser, user?.$id]); // Thêm currentUser vào dependency array

  // Kiểm tra quyền truy cập (giữ nguyên)
  const allowedRoles: (string | null | undefined)[] = ['tongquanly', 'truongphong', 'nhanvienkd', 'thukho'];
  if (!allowedRoles.includes(currentUser?.role)) {
    // Trả về một View trống hoặc một màn hình thông báo không có quyền truy cập.
    return <View />;
  }

  // Sửa lỗi: Hàm getStatusColor bị sai cú pháp (giữ nguyên, đã đúng)
  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = { Draft: '#6B7280', Confirmed: '#F59E0B', Assigned: '#3B82F6', Processing: '#8B5CF6', Completed: '#0E7490', Shipped: '#10B981', Canceled: '#EF4444', PendingRevision: '#D97706' };
    return colors[status] || '#6B7280';
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategoryId ? p.category === selectedCategoryId : true;
    const matchesSearch = searchText ? (
      (p.name ?? '').toLowerCase().includes(searchText.toLowerCase()) ||
      (p.sku ?? '').toLowerCase().includes(searchText.toLowerCase())
    )
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

  const handleSaveProduct = async (productData: Product | Omit<Product, '$id'>) => {
    if (!currentUser?.uid) {
      handleShowMessage('Lỗi', 'Không thể lưu sản phẩm. Thông tin người dùng không có sẵn.');
      return;
    }

    const dataToSave = { ...productData, lastUpdatedBy: currentUser.uid };

    if ('$id' in dataToSave && dataToSave.$id) {
      // For update, ensure we only pass updatable fields and omit $id and stock
      const { $id, stock, ...rest } = dataToSave;
      await ProductService.updateProduct($id, rest);
    } else {
      // For add, ensure we omit $id and stock
      await ProductService.addProduct(dataToSave);
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
        ProductService.deleteProduct(id) // id ở đây là $id
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
    // Cho phép 'truongphong' và 'tongquanly' xóa đơn hàng
    if (!['truongphong', 'tongquanly'].includes(currentUser?.role || '')) {
      handleShowMessage('Không có quyền', 'Bạn không có quyền xóa đơn hàng.');
      return;
    }
    handleShowMessage('Xác nhận xóa', `Bạn có chắc muốn xóa đơn hàng ${order.id.slice(-6).toUpperCase()}?`, async () => {
      await OrderService.deleteOrder(order);
      handleShowMessage('Thành công', 'Đã xóa đơn hàng.');
    });
  };

  const handleOpenAssignToWHManagerModal = (order: Order) => {
    setOrderToAssignToWHManager(order);
    setAssignToWHManagerModalVisible(true);
  };

  const handleAssignToWarehouseManager = async (warehouseManagerId: string) => {
    if (!orderToAssignToWHManager || !warehouseManagerId) {
      handleShowMessage('Lỗi', 'Vui lòng chọn thủ kho.');
      return;
    }
    const whManager = warehouseManagers.find(s => s.uid === warehouseManagerId);
    if (!whManager) return;

    await OrderService.assignToWarehouseManager(orderToAssignToWHManager.id, whManager.uid, whManager.displayName || 'Unknown Manager');
    handleShowMessage('Thành công', `Đã giao đơn hàng cho thủ kho ${whManager.displayName}.`);
    setAssignToWHManagerModalVisible(false);
    setOrderToAssignToWHManager(null);
  };


  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.salesStyles.productItem}>
      <View style={styles.salesStyles.productInfo}>
        <Text style={styles.salesStyles.productName}>{item.name}</Text>
        <Text style={styles.salesStyles.productDetails}>Mã SKU: {item.sku} | Danh mục: {categories.find(c => c.$id === item.category)?.name || 'N/A'}</Text>
        {/* Hiển thị chi tiết các biến thể */}
        <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
          {item.variants && item.variants.length > 0 ? (
            item.variants.map((variant, index) => (
              <Text key={index} style={[styles.salesStyles.productDetails, { color: '#374151' }]}>{`- ${variant.color ? `Màu: ${variant.color}, ` : ''}Size: ${variant.size} | Tồn: ${variant.quantity}`}</Text>
            ))
          ) : (
            <Text style={[styles.salesStyles.productDetails, { fontStyle: 'italic' }]}>Chưa có biến thể nào.</Text>
          )}
        </View>
        <Text style={styles.salesStyles.productDetails}>Giá: {(item.price ?? 0).toLocaleString('vi-VN')} VND</Text>
      </View>
      <View style={styles.salesStyles.quantityControl}>
        <Text style={styles.salesStyles.quantityText}>{item.stock} {item.unit}</Text>
        {canManage && (
          <View style={{ marginLeft: 15, flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => handleOpenModal(item)} style={{ padding: 5, marginRight: 5 }}>
              <Ionicons name="create-outline" size={26} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteProduct(item.$id!, item.name!)} style={{ padding: 5 }}>
              <Ionicons name="trash-outline" size={26} color="#EF4444" />
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
      <Text style={styles.warehouseStyles.orderInfo}>Ngày tạo: {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</Text>
      {/* Hiển thị ghi chú nếu đơn hàng bị báo cáo */}
      {item.status === 'PendingRevision' && item.revisionNote && (
        <Text style={[styles.warehouseStyles.orderInfo, { color: COLORS.error, fontStyle: 'italic' }]}>Lý do từ kho: {item.revisionNote}</Text>
      )}
      <Text style={styles.warehouseStyles.orderInfo}>Tổng tiền: {item.totalAmount.toLocaleString('vi-VN')} VND</Text>
      <View style={styles.warehouseStyles.actionButtons}>
        {/* Nút giao cho Thủ kho */}
        {currentUser?.role === 'truongphong' && item.status === 'Confirmed' && !item.warehouseManagerId && (
          <TouchableOpacity onPress={() => handleOpenAssignToWHManagerModal(item)} style={[styles.warehouseStyles.actionButton, { backgroundColor: COLORS.secondary, marginRight: 10 }]}>
            <Text style={styles.warehouseStyles.actionButtonText}>Giao cho Kho</Text>
          </TouchableOpacity>
        )}
        {/* Cho phép sửa đơn hàng khi ở trạng thái PendingRevision, Draft, Confirmed */}
        {(item.status === 'Draft' || item.status === 'Confirmed' || item.status === 'PendingRevision') && (
          <TouchableOpacity onPress={() => handleOpenOrderModal(item)} style={[styles.warehouseStyles.actionButton, { backgroundColor: COLORS.accent, marginRight: 10 }]}>
            <Text style={styles.warehouseStyles.actionButtonText}>Sửa</Text>
          </TouchableOpacity>
        )}
        {/* Cho phép 'truongphong' và 'tongquanly' xóa */}
        {['truongphong', 'tongquanly'].includes(currentUser?.role || '') && (
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
                {currentUser?.role !== 'thukho' && canManage && (
                  // Thay đổi nút thêm sản phẩm từ icon thành nút có chữ rõ ràng hơn
                  <TouchableOpacity onPress={() => handleOpenModal(null)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}>
                    <Ionicons name="add" size={20} color={COLORS.white} />
                    <Text style={{ color: COLORS.white, fontWeight: 'bold', marginLeft: 5, fontSize: 14 }}>Thêm mới</Text>
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
              <ScrollView horizontal contentContainerStyle={{ flexDirection: 'row' }} showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  onPress={() => setSelectedCategoryId(null)}
                  style={{ padding: 8, backgroundColor: selectedCategoryId === null ? '#10B981' : '#E5E7EB', borderRadius: 8, marginRight: 8 }}
                >
                  <Text style={{ color: selectedCategoryId === null ? '#FFFFFF' : '#1F2937' }}>Tất cả</Text>
                </TouchableOpacity>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat.$id}
                    onPress={() => setSelectedCategoryId(cat.$id!)}
                    style={{ padding: 8, backgroundColor: selectedCategoryId === cat.$id ? '#10B981' : '#E5E7EB', borderRadius: 8, marginRight: 8 }}
                  >
                    <Text style={{ color: selectedCategoryId === cat.$id ? '#FFFFFF' : '#1F2937' }}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.$id!}
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
                <TouchableOpacity onPress={() => handleOpenOrderModal(null)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}>
                  <Ionicons name="add" size={20} color={COLORS.white} />
                  <Text style={{ color: COLORS.white, fontWeight: 'bold', marginLeft: 5, fontSize: 14 }}>Tạo đơn</Text>
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
      {/* Modal phân công cho Thủ kho */}
      <Modal visible={isAssignToWHManagerModalVisible} transparent={true} animationType="slide" onRequestClose={() => setAssignToWHManagerModalVisible(false)}>
        <View style={styles.salesStyles.modalOverlay}>
          <View style={styles.salesStyles.modalView}>
            <Text style={styles.salesStyles.modalTitle}>Giao việc cho Thủ kho</Text>
            <Text style={{ marginBottom: 20 }}>Đơn hàng: {orderToAssignToWHManager?.id.slice(-6).toUpperCase()}</Text>
            <CustomPicker
              iconName="person-outline"
              placeholder="-- Chọn thủ kho --"
              items={warehouseManagers.map(s => ({ label: s.displayName || 'Unknown Manager', value: s.uid }))}
              selectedValue={null} // Để trống ban đầu
              onValueChange={(value: string) => {
                if (value) handleAssignToWarehouseManager(value);
              }}
              enabled={true}
            />
            <View style={[styles.salesStyles.modalButtons, {marginTop: 20}]}>
              <TouchableOpacity style={[styles.staffStyles.modalButton, styles.staffStyles.modalButtonSecondary, {flex: 1}]} onPress={() => setAssignToWHManagerModalVisible(false)}><Text style={styles.staffStyles.modalButtonText}>Đóng</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Thanh điều hướng nhanh */}
      <QuickNav />
    </>
  );
}