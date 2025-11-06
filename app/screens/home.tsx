// app/(tabs)/home.tsx (Đã di chuyển)

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react'; // Thêm ScrollView
import { ActivityIndicator, FlatList, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'; // Thêm ScrollView
import { HRManagerView } from '../../components/home/HRManagerView';
import { RoleFunctionsView } from '../../components/home/RoleFunctionsView';
import { QuickNav } from '../../components/QuickNav';
import { useAuth } from '../../context/AuthContext';
import { Product, ProductService } from '../../services/ProductService'; // Import Product Service
import { styles } from '../../styles/homeStyle';
import { getRoleDisplayName } from '../../utils/roles';

// --- Màn hình Chính ---
export default function HomeScreen() {
  const { currentUser, logout, loading: authLoading } = useAuth(); // Lấy cả trạng thái loading
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchText, setSearchText] = useState('');
  const [productLoading, setProductLoading] = useState(true);

  // [THÊM] Xác định vai trò quản lý để hiển thị danh sách nhân viên
  const isManager = ['tongquanly', 'quanlynhansu', 'truongphong', 'thukho'].includes(currentUser?.role || '');
  
  // [SỬA] Thống nhất logic hiển thị vai trò dựa trên trường `role`
  const getRoleDisplay = () => {
    if (currentUser?.role === 'tongquanly') return 'Tổng Quản lý';
    if (currentUser?.role === 'quanlynhansu') return 'Quản lý Nhân sự'; // Giữ nguyên để rõ ràng
    return getRoleDisplayName(currentUser?.role ?? null);
  };

  // Lắng nghe dữ liệu sản phẩm real-time
  useEffect(() => {
    const unsubscribe = ProductService.subscribeToProducts((productsData) => {
      setAllProducts(productsData);
      setProductLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)');
    } catch (e) {
      console.error("Lỗi đăng xuất:", e);
    }
  };

  // Nếu đang trong quá trình xác thực hoặc chuẩn bị chuyển hướng, hiển thị màn hình chờ
  // để tránh màn hình home bị nháy lên một cách không cần thiết.
  // [SỬA] Chỉ cần kiểm tra authLoading vì logic chuyển hướng đã được gỡ bỏ.
  // Màn hình này giờ chỉ dành cho các vai trò được phép.
  if (authLoading) {
    return <View style={styles.homeStyles.scrollContainer}><ActivityIndicator style={{marginTop: 100}} size="large" color="#10B981" /></View>;
  }

  // Hàm lọc sản phẩm
  const filteredProducts = allProducts.filter(p => 
    p.name.toLowerCase().includes(searchText.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.homeStyles.notificationCard}>
      <Ionicons name="pricetag-outline" size={20} color="#0E7490" />
      <View style={{marginLeft: 10, flex: 1, flexDirection: 'row', justifyContent: 'space-between'}}>
        <Text style={styles.homeStyles.notificationText}>{item.name} ({item.sku})</Text>
        <Text style={[styles.homeStyles.notificationText, {fontWeight: 'bold', color: item.totalQuantity <= 5 ? '#EF4444' : '#10B981'}]}>
          Tồn: {item.totalQuantity} {item.unit}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <ScrollView
          style={styles.homeStyles.scrollContainer}
          contentContainerStyle={{paddingTop: 40, paddingBottom: 100}} // Tăng paddingBottom
          keyboardShouldPersistTaps="handled" // Giúp bàn phím không làm mất sự kiện bấm
      >
        <View style={styles.homeStyles.container}>
          
          {/* Header và Vai trò */}
          <View style={styles.homeStyles.header}>
            <Text style={styles.homeStyles.greeting}>Xin chào, {currentUser?.displayName || 'bạn'}!</Text>
            <TouchableOpacity onPress={handleLogout} style={styles.homeStyles.logoutButton}>
              <Ionicons name="log-out-outline" size={28} color="#EF4444" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push('/profile')}>
            <View style={styles.homeStyles.roleCard}>
              <Ionicons name="person-circle-outline" size={60} color="#3B82F6" />
              <View style={styles.homeStyles.roleInfo}>
                  <Text style={styles.homeStyles.roleLabel}>Vai trò hiện tại:</Text>
                  <Text style={styles.homeStyles.roleText}>{getRoleDisplay()}</Text>
              </View>
            </View>
          </TouchableOpacity>

          <Text style={styles.homeStyles.sectionTitle}>Chức năng chính</Text>
          <RoleFunctionsView currentUser={currentUser} />
          
          <Text style={[styles.homeStyles.sectionTitle, {marginTop: 30}]}>Thông báo & Tồn kho</Text>

          {/* Thẻ thông báo */}
          <View style={styles.homeStyles.notificationCard}>
              <Ionicons name="notifications-outline" size={24} color="#F59E0B" />
              <Text style={styles.homeStyles.notificationText}>Hệ thống: Vui lòng kiểm tra tồn kho hàng tuần.</Text>
          </View>

          {/* [SỬA] Hiển thị có điều kiện: Quản lý thấy nhân viên, nhân viên thấy sản phẩm */}
          {/* Chỉ Quản lý nhân sự và Tổng quản lý mới thấy danh sách nhân viên làm việc */}
          {currentUser?.role === 'quanlynhansu' || currentUser?.role === 'tongquanly' ? (
            <>
              <Text style={[styles.homeStyles.sectionTitle, {marginTop: 20, fontSize: 18}]}>
                Nhân viên làm việc hôm nay
              </Text>
              <HRManagerView />
            </>
          ) : (
            <>
              {/* Thanh tìm kiếm */}
              <View style={styles.homeStyles.searchContainer}>
                <Ionicons name="search" size={20} color="#6B7280" />
                <TextInput
                  placeholder="Tìm kiếm sản phẩm theo tên hoặc SKU..."
                  placeholderTextColor="#9CA3AF"
                  value={searchText}
                  style={styles.homeStyles.searchInput}
                  onChangeText={setSearchText}
                />
              </View>

              {/* Danh sách sản phẩm tồn kho */}
              <Text style={[styles.homeStyles.sectionTitle, {marginTop: 20, fontSize: 18}]}>
                  Kết quả ({filteredProducts.length}/{allProducts.length})
              </Text>

              {productLoading ? (
                   <ActivityIndicator size="small" color="#10B981" style={{marginTop: 20}}/>
              ) : (
                  <FlatList
                      data={filteredProducts.slice(0, 5)} // Chỉ hiển thị tối đa 5 kết quả đầu tiên trên Home Screen
                      keyExtractor={item => item.id!}
                      renderItem={renderProductItem}
                      scrollEnabled={false} // Tắt cuộn của FlatList để nó cuộn cùng ScrollView cha
                      ListEmptyComponent={() => (
                          <Text style={styles.homeStyles.infoText}>Không tìm thấy sản phẩm nào.</Text>
                      )}
                  />
              )}
            </>
          )}
        </View>
      </ScrollView>
      <QuickNav />
    </View>
  );
}