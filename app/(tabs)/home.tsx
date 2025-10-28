// app/(tabs)/home.tsx

import { StaffUser } from '@/services/StaffService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth, UserRole } from '../../context/AuthContext';
import { Product, ProductService } from '../../services/ProductService'; // Import Product Service
import { styles } from '../../styles/homeStyle';

// --- HELPER FUNCTIONS ---

const getRoleDisplayName = (userRole: UserRole) => { // Chấp nhận UserRole
  switch (userRole) {
    case 'thukho': return 'Thủ kho';
    case 'truongphong': return 'Trưởng phòng KD/QA';
    case 'nhanvienkho': return 'Nhân viên Kho';
    case 'nhanvienkd': return 'Nhân viên Kinh doanh';
    default: return 'Chưa được gán';
    case null: // Xử lý trường hợp role là null
      return 'Chưa được gán';
  }
};

interface StatCardProps {
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  number: number | string;
  label: string;
  onPress?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ iconName, iconColor, number, label, onPress }) => (
  <TouchableOpacity style={styles.homeStyles.statCard} onPress={onPress}>
    <Ionicons name={iconName} size={30} color={iconColor} />
    <Text style={styles.homeStyles.statNumber}>{number}</Text>
    <Text style={styles.homeStyles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

const renderRoleSpecificStats = (currentUser: StaffUser | null) => {
  const role = currentUser?.role;
  // Logic mới: Xác định là Tổng quản lý bằng cách kiểm tra managerId là null
  if (currentUser?.managerId === null || currentUser?.role === 'quanlynhansu') {
    // Trả về giao diện cho Tổng quản lý
    return <ManagerStats />;
  }
  // ... (Logic renderRoleSpecificStats giữ nguyên)
  switch (role) {
    case 'thukho':
      return (
        <View style={styles.homeStyles.statContainer}>
          <StatCard
            iconName="time-outline"
            iconColor="#F59E0B"
            number={7} 
            label="Đơn chờ xử lý"
            onPress={() => router.navigate('/(tabs)/warehouse')}
          />
          <StatCard
            iconName="cube-outline"
            iconColor="#3B82F6"
            number={3} 
            label="Sản phẩm dưới định mức"
            onPress={() => router.navigate('/(tabs)/sales')}
          />
        </View>
      );
    case 'truongphong':
      return (
        <View style={styles.homeStyles.statContainer}>
          <StatCard
            iconName="wallet-outline"
            iconColor="#10B981"
            number="15.5M" 
            label="Tổng doanh thu (Tháng)"
            onPress={() => Alert.alert('Chức năng', 'Đến màn hình Báo cáo')}
          />
          <StatCard
            iconName="people-outline"
            iconColor="#EF4444"
            number={15} 
            label="Số lượng nhân viên"
            onPress={() => router.navigate('/(tabs)/staff')}
          />
        </View>
      );
    case 'nhanvienkho':
      return (
        <View style={styles.homeStyles.statContainer}>
          <StatCard
            iconName="document-text-outline"
            iconColor="#0E7490"
            number={2} 
            label="Đơn được giao hôm nay"
            onPress={() => router.navigate('/(tabs)/warehouse')}
          />
          <StatCard
            iconName="archive-outline"
            iconColor="#374151"
            number={45}
            label="Đơn hàng đã soạn xong (Tháng)"
            onPress={() => router.navigate('/(tabs)/warehouse')}
          />
        </View>
      );
    case 'nhanvienkd':
      return (
        <View style={styles.homeStyles.statContainer}>
          <StatCard
            iconName="list-outline"
            iconColor="#374151"
            number={15} 
            label="Bill đã soạn"
            onPress={() => router.navigate('/(tabs)/sales')}
          />
          <StatCard
            iconName="checkmark-circle-outline"
            iconColor="#10B981"
            number={850} 
            label="Tổng số lượng tồn kho"
            onPress={() => router.navigate('/(tabs)/sales')}
          />
        </View>
      );
    default:
      return (
        <View style={styles.homeStyles.statContainer}>
          <Text style={styles.homeStyles.infoText}>Bạn chưa được gán vai trò làm việc. Vui lòng liên hệ quản lý.</Text>
        </View>
      );
  }
};

// Component riêng cho thống kê của Quản lý/Tổng Quản lý
const ManagerStats = () => (
  <View style={styles.homeStyles.statContainer}>
    <StatCard
      iconName="calendar-outline"
      iconColor="#F59E0B"
      number="Xem"
      label="Xếp lịch làm"
      onPress={() => router.navigate('/(tabs)/staff')}
    />
    <StatCard
      iconName="time-outline"
      iconColor="#3B82F6"
      number="Tính công"
      label="Giờ làm tháng này"
      onPress={() => router.navigate('/(tabs)/staff')}
    />
  </View>
);

// --- Màn hình Chính ---
export default function HomeScreen() {
  const { user, currentUser, logout } = useAuth(); // Chỉ gọi useAuth một lần
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchText, setSearchText] = useState('');
  const [productLoading, setProductLoading] = useState(true);

  const displayName = user?.email?.split('@')[0] || 'Khách';
  
  const roleDisplay = (currentUser?.managerId === null || currentUser?.role === 'quanlynhansu')
    ? 'Tổng Quản lý'
    : (currentUser?.role === 'truongphong' || currentUser?.role === 'thukho')
      ? 'Quản lý'
      : getRoleDisplayName(currentUser?.role ?? null);

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
        <Text style={[styles.homeStyles.notificationText, {fontWeight: 'bold', color: item.quantity <= 5 ? '#EF4444' : '#10B981'}]}>
          Tồn: {item.quantity} {item.unit}
        </Text>
      </View>
    </View>
  );

  return (
    <ScrollView 
        style={styles.homeStyles.scrollContainer}
        contentContainerStyle={{paddingTop: 40, paddingBottom: 40}}
        keyboardShouldPersistTaps="handled" // Giúp bàn phím không làm mất sự kiện bấm
    >
      <View style={styles.homeStyles.container}>
        
        {/* Header và Vai trò */}
        <View style={styles.homeStyles.header}>
          <Text style={styles.homeStyles.greeting}>Xin chào, {displayName}!</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.homeStyles.logoutButton}>
            <Ionicons name="log-out-outline" size={28} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push('/profile')}>
          <View style={styles.homeStyles.roleCard}>
            <Ionicons name="person-circle-outline" size={60} color="#3B82F6" />
            <View style={styles.homeStyles.roleInfo}>
                <Text style={styles.homeStyles.roleLabel}>Vai trò hiện tại:</Text>
                <Text style={styles.homeStyles.roleText}>{roleDisplay}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <Text style={styles.homeStyles.sectionTitle}>Thông tin Tổng quan</Text>
        {renderRoleSpecificStats(currentUser)}
        
        <Text style={[styles.homeStyles.sectionTitle, {marginTop: 30}]}>Thông báo & Tồn kho</Text>

        {/* Thẻ thông báo */}
        <View style={styles.homeStyles.notificationCard}>
            <Ionicons name="notifications-outline" size={24} color="#F59E0B" />
            <Text style={styles.homeStyles.notificationText}>Hệ thống: Vui lòng kiểm tra tồn kho hàng tuần.</Text>
        </View>

        {/* Thanh tìm kiếm */}
        <View style={styles.homeStyles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            placeholder="Tìm kiếm sản phẩm theo tên hoặc SKU..."
            placeholderTextColor="#9CA3AF"
            value={searchText}
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
      </View>
    </ScrollView>
  );
}