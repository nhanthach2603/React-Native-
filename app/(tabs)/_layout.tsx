// app/(tabs)/_layout.tsx

import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router'; // Import Tabs and Redirect from expo-router
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuth, UserRole } from '../../context/AuthContext';
import { styles } from '../../styles/homeStyle';

interface TabConfig {
  name: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  roles: UserRole[];
}

const tabConfigs: TabConfig[] = [
  {
    name: 'home',
    title: 'Tổng quan',
    icon: 'home-outline',
    roles: ['thukho', 'truongphong', 'nhanvienkho', 'nhanvienkd'],
  },
  {
    name: 'warehouse',
    title: 'Kho hàng',
    icon: 'cube-outline',
    roles: ['thukho', 'nhanvienkho', 'truongphong'], // Trưởng phòng có thể xem kho
  },
  {
    name: 'sales',
    title: 'Sản phẩm/Đơn hàng',
    icon: 'cart-outline',
    roles: ['truongphong', 'nhanvienkd', 'thukho'], // Giữ nguyên
  },
  {
    name: 'staff',
    title: 'Nhân sự/Lịch làm',
    icon: 'people-outline',
    roles: ['truongphong', 'thukho', 'nhanvienkho', 'nhanvienkd'],
  },
  {
    name: 'chat',
    title: 'Giao tiếp',
    icon: 'chatbubbles-outline',
    roles: ['thukho', 'truongphong', 'nhanvienkho', 'nhanvienkd'],
  },
];

const getInitialRoute = (role: UserRole): string => {
  switch (role) {
    case 'thukho':
    case 'nhanvienkho':
      return 'warehouse'; 
    case 'truongphong':
    case 'nhanvienkd':
      return 'sales';
    default:
      return 'home'; 
  }
};

export default function TabLayout() {
  const { currentUser, loading } = useAuth(); // Lấy currentUser từ useAuth
  const role = currentUser?.role; // Lấy role từ currentUser

  // Sửa lại logic: Chỉ hiển thị loading khi dữ liệu user chưa được tải xong.
  if (loading) {
    return (
      <View style={styles.homeStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.homeStyles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  // Nếu không loading mà vẫn không có currentUser, có thể là lỗi, hiển thị thông báo.
  if (!currentUser) {
    return (
      <View style={styles.homeStyles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={50} color="#EF4444" />
        <Text style={styles.homeStyles.errorText}>Không thể tải thông tin người dùng. Vui lòng thử lại.</Text>
      </View>
    );
  }

  // [SỬA LỖI] Nếu không có currentUser hoặc vai trò là 'unassigned',
  // chuyển hướng ngay lập tức và không thực thi logic bên dưới.
  if (!currentUser || currentUser.role === 'unassigned') {
    // Chuyển người dùng đến màn hình chờ duyệt
    return <Redirect href="/pending" />;
  }

  // Logic mới: Tổng quản lý (managerId=null) thấy tất cả các tab.
  // Thêm điều kiện kiểm tra vai trò 'quanlynhansu' cũ để đảm bảo tương thích ngược.
  const isTopLevelManager = currentUser?.managerId === null || currentUser?.role === 'quanlynhansu';
  const allowedTabs = isTopLevelManager 
    ? tabConfigs 
    : tabConfigs.filter(config => config.roles.includes(role || 'unassigned'));
  let initialRouteName = getInitialRoute(role || 'unassigned'); // Truyền role (có thể null)

  const isInitialRouteAllowed = allowedTabs.some(tab => tab.name === initialRouteName);
  // Nếu route ban đầu không được phép, chuyển về 'home'
  if (!isInitialRouteAllowed) {
    initialRouteName = 'home';
  }
  
  if (allowedTabs.length === 0) {
     return (
        // Hiển thị lỗi nếu không có tab nào được phép
        <View style={styles.homeStyles.errorContainer}>
            <Ionicons name="warning-outline" size={50} color="#EF4444" />
            <Text style={styles.homeStyles.errorText}>Lỗi: Vai trò {role || 'chưa xác định'} không có quyền truy cập tab nào.</Text>
        </View>
     );
  }

  return (
    <Tabs 
        initialRouteName={initialRouteName} 
        screenOptions={{ 
            headerShown: false, 
            tabBarStyle: styles.homeStyles.tabBar,
            tabBarActiveTintColor: '#10B981',
        }}
    >
      {allowedTabs.map(config => (
        <Tabs.Screen
          key={config.name}
          name={config.name}
          options={{
            title: config.title,
            tabBarIcon: ({ color }) => <Ionicons name={config.icon} color={color} size={24} />,
            tabBarLabelStyle: styles.homeStyles.tabBarLabel,
          }}
        />
      ))}
      
      {/* Ẩn màn hình chi tiết Chat Room khỏi thanh Tab Bar */}
      <Tabs.Screen
        name="chat/room"
        options={{
          headerShown: false,
          href: null,
        }}
      />

    </Tabs>
  );
}