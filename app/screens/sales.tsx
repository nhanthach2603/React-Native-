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

export default function SaleScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser, user } = useAuth();

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

  const [isConfirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [confirmationTitle, setConfirmationTitle] = useState('');
  const [confirmationAction, setConfirmationAction] = useState<(() => void) | null>(null);
  const [isSuccessModal, setIsSuccessModal] = useState(false);

  const isTopLevelManagement = currentUser?.role === 'tongquanly' || currentUser?.role === 'quanlynhansu';
  const canManage = currentUser?.role === 'truongphong' || currentUser?.role === 'thukho' || isTopLevelManagement;
  const canCreateOrder = currentUser?.role === 'truongphong' || currentUser?.role === 'nhanvienkd' || isTopLevelManagement;

  const [viewMode, setViewMode] = useState<'products' | 'orders'>(canCreateOrder ? 'orders' : 'products');

  useEffect(() => {
    let isMounted = true;
    const subscriptions: (() => void)[] = [];

    const initialize = async () => {
      setLoading(true);

      // Subscribe products
      subscriptions.push(
        ProductService.subscribeToProducts((data) => {
          if (isMounted) {
            setProducts(data);
            setLoading(false);
          }
        })
      );

      // Subscribe categories
      subscriptions.push(
        CategoryService.subscribeToCategories((data) => {
          if (isMounted) setCategories(data);
        })
      );

      if (!user?.$id || !currentUser?.role) return;

      try {
        if (currentUser.role === 'tongquanly') {
          subscriptions.push(OrderService.subscribeToAllOrders(setOrders));
        } else if (currentUser.role === 'truongphong') {
          const managerIdToUse = currentUser.managerId || '';

          // staffList async
          const staffList: StaffUser[] = await StaffService.getStaffList(user.$id, currentUser.role, managerIdToUse);
          const staffUids = staffList.filter(s => s.role === 'nhanvienkd').map(s => s.uid);

          // warehouse managers async
          const whManagersList: StaffUser[] = await StaffService.getStaffByRole('thukho');
          if (isMounted) setWarehouseManagers(whManagersList);

          subscriptions.push(OrderService.subscribeToManagerOrders(user.$id, staffUids, setOrders));
        } else if (currentUser.role === 'nhanvienkd') {
          subscriptions.push(OrderService.subscribeToSalespersonOrders(user.$id, setOrders));
        }
      } catch (err) {
        console.error('Error loading staff/warehouse managers', err);
      }
    };

    initialize();

    return () => {
      isMounted = false;
      subscriptions.forEach((unsub) => unsub && unsub());
    };
  }, [currentUser, user?.$id]);

  const allowedRoles: (string | null | undefined)[] = ['tongquanly', 'truongphong', 'nhanvienkd', 'thukho'];
  if (!allowedRoles.includes(currentUser?.role)) return <View />;

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      Draft: '#6B7280',
      Confirmed: '#F59E0B',
      Assigned: '#3B82F6',
      Processing: '#8B5CF6',
      Completed: '#0E7490',
      Shipped: '#10B981',
      Canceled: '#EF4444',
      PendingRevision: '#D97706'
    };
    return colors[status] || '#6B7280';
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategoryId ? p.category === selectedCategoryId : true;
    const matchesSearch = searchText ? (
      (p.name ?? '').toLowerCase().includes(searchText.toLowerCase()) ||
      (p.sku ?? '').toLowerCase().includes(searchText.toLowerCase())
    ) : true;
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
      handleShowMessage('Lỗi', 'Thông tin người dùng không có sẵn.');
      return;
    }

    const dataToSave = { ...productData, lastUpdatedBy: currentUser.uid };

    if ('$id' in dataToSave && dataToSave.$id) {
      const { $id, stock, ...rest } = dataToSave;
      await ProductService.updateProduct($id, rest);
    } else {
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
    if (!canManage) return handleShowMessage("Không có quyền", "Bạn không có quyền xóa sản phẩm này.");
    handleShowMessage("Xác nhận xóa", `Bạn có chắc chắn muốn xóa sản phẩm "${name}"?`, () => {
      ProductService.deleteProduct(id)
        .then(() => handleShowMessage("Thành công", "Sản phẩm đã bị xóa."))
        .catch(e => handleShowMessage("Lỗi", e.message));
    });
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
    if (!orderToAssignToWHManager || !warehouseManagerId) return handleShowMessage('Lỗi', 'Vui lòng chọn thủ kho.');

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
        <Text style={styles.salesStyles.productDetails}>
          Mã SKU: {item.sku} | Danh mục: {categories.find(c => c.$id === item.category)?.name || 'N/A'}
        </Text>
        <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
          {item.variants && item.variants.length > 0 ? (
            item.variants.map((variant, idx) => (
              <Text key={idx} style={[styles.salesStyles.productDetails, { color: '#374151' }]}>
                {`- ${variant.color ? `Màu: ${variant.color}, ` : ''}Size: ${variant.size} | Tồn: ${variant.quantity}`}
              </Text>
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
      {item.status === 'PendingRevision' && item.revisionNote && (
        <Text style={[styles.warehouseStyles.orderInfo, { color: COLORS.error, fontStyle: 'italic' }]}>Lý do từ kho: {item.revisionNote}</Text>
      )}
      <Text style={styles.warehouseStyles.orderInfo}>Tổng tiền: {item.totalAmount.toLocaleString('vi-VN')} VND</Text>
      <View style={styles.warehouseStyles.actionButtons}>
        {currentUser?.role === 'truongphong' && item.status === 'Confirmed' && !item.warehouseManagerId && (
          <TouchableOpacity onPress={() => handleOpenAssignToWHManagerModal(item)} style={[styles.warehouseStyles.actionButton, { backgroundColor: COLORS.secondary, marginRight: 10 }]}>
            <Text style={styles.warehouseStyles.actionButtonText}>Giao cho Kho</Text>
          </TouchableOpacity>
        )}
        {(item.status === 'Draft' || item.status === 'Confirmed' || item.status === 'PendingRevision') && (
          <TouchableOpacity onPress={() => handleOpenOrderModal(item)} style={[styles.warehouseStyles.actionButton, { backgroundColor: COLORS.accent, marginRight: 10 }]}>
            <Text style={styles.warehouseStyles.actionButtonText}>Sửa</Text>
          </TouchableOpacity>
        )}
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
    <>
      <View style={[styles.salesStyles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.staffStyles.viewModeContainer}>
          <TouchableOpacity onPress={() => setViewMode('products')} style={[styles.staffStyles.viewModeButton, viewMode === 'products' && styles.staffStyles.viewModeButtonActive]}>
            <Text style={[styles.staffStyles.viewModeText, viewMode === 'products' && styles.staffStyles.viewModeTextActive]}>Sản Phẩm</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setViewMode('orders')} style={[styles.staffStyles.viewModeButton, viewMode === 'orders' && styles.staffStyles.viewModeButtonActive]}>
            <Text style={[styles.staffStyles.viewModeText, viewMode === 'orders' && styles.staffStyles.viewModeTextActive]}>Đơn Hàng</Text>
          </TouchableOpacity>
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
                  <TouchableOpacity onPress={() => handleOpenModal(null)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}>
                    <Ionicons name="add" size={20} color={COLORS.white} />
                    <Text style={{ color: COLORS.white, fontWeight: 'bold', marginLeft: 5, fontSize: 14 }}>Thêm mới</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <TextInput
              style={{ height: 45, backgroundColor: '#FFF', borderRadius: 10, paddingHorizontal: 15, fontSize: 16, borderWidth: 1, borderColor: '#DDD', marginBottom: 10 }}
              placeholder="Tìm kiếm theo tên sản phẩm hoặc SKU..."
              value={searchText}
              onChangeText={setSearchText}
            />

            <ScrollView horizontal contentContainerStyle={{ flexDirection: 'row', marginBottom: 15 }}>
              <TouchableOpacity onPress={() => setSelectedCategoryId(null)} style={{ padding: 8, backgroundColor: selectedCategoryId === null ? '#10B981' : '#E5E7EB', borderRadius: 8, marginRight: 8 }}>
                <Text style={{ color: selectedCategoryId === null ? '#FFF' : '#1F2937' }}>Tất cả</Text>
              </TouchableOpacity>
              {categories.map(cat => (
                <TouchableOpacity key={cat.$id} onPress={() => setSelectedCategoryId(cat.$id!)} style={{ padding: 8, backgroundColor: selectedCategoryId === cat.$id ? '#10B981' : '#E5E7EB', borderRadius: 8, marginRight: 8 }}>
                  <Text style={{ color: selectedCategoryId === cat.$id ? '#FFF' : '#1F2937' }}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <FlatList
              data={filteredProducts}
              keyExtractor={item => item.$id!}
              renderItem={renderProductItem}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}

        {viewMode === 'orders' && (
          <FlatList
            data={orders}
            keyExtractor={item => item.id}
            renderItem={renderOrderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}
      </View>

      {/* Product Modal */}
      <ProductEditModal
        isVisible={isModalVisible}
        product={productToEdit}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveProduct}
      />

      {/* Order Modal */}
      <OrderEditModal
        isVisible={isOrderModalVisible}
        order={orderToEdit}
        warehouseManagers={warehouseManagers}
        onClose={() => setOrderModalVisible(false)}
        onSave={handleSaveOrder}
      />

      {/* Warehouse Assignment Modal */}
      <Modal
        visible={isAssignToWHManagerModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAssignToWHManagerModalVisible(false)}
      >
        <View style={styles.salesStyles.modalOverlay}>
          <View style={styles.salesStyles.modalView}>
            <Text style={styles.salesStyles.modalTitle}>Chọn thủ kho để giao đơn hàng</Text>
            <CustomPicker
              placeholder="Chọn thủ kho"
              data={warehouseManagers.map(m => ({ label: m.displayName || 'Không tên', value: m.uid }))}
              onChange={handleAssignToWarehouseManager}
            />
            <TouchableOpacity onPress={() => setAssignToWHManagerModalVisible(false)} style={[styles.salesStyles.modalButtons, { backgroundColor: '#EF4444' }]}>
              <Text style={styles.salesStyles.modalButtons}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Confirmation / Success Modal */}
      <ConfirmationModal
        isVisible={isConfirmationModalVisible}
        title={confirmationTitle}
        message={confirmationMessage}
        onConfirm={() => {
          if (confirmationAction) confirmationAction();
          setConfirmationModalVisible(false);
        }}
        onCancel={() => setConfirmationModalVisible(false)}
        successMode={isSuccessModal}
      />

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isVisible={isCategoryManagerVisible}
        categories={categories}
        onClose={() => setCategoryManagerVisible(false)} onShowMessage={function (title: string, message: string, onConfirm?: () => void): void {
          throw new Error('Function not implemented.');
        } }      />

      <QuickNav />
    </>
  );
}
