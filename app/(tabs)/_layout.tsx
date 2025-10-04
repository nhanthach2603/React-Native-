// app/(tabs)/_layout.tsx

import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, UserRole } from '../../context/AuthContext';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
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
    roles: ['thukho', 'truongphong', 'nhanvienkho', 'nhanvienkd', 'quanlynansu'],
  },
  {
    name: 'warehouse',
    title: 'Kho hàng',
    icon: 'cube-outline',
    roles: ['thukho', 'nhanvienkho'],
  },
  {
    name: 'sales',
    title: 'Sản phẩm/Đơn hàng',
    icon: 'cart-outline',
    roles: ['truongphong', 'nhanvienkd', 'thukho'],
  },
  {
    name: 'staff',
    title: 'Nhân sự/Lịch làm',
    icon: 'people-outline',
    roles: ['truongphong', 'thukho', 'nhanvienkho', 'nhanvienkd', 'quanlynansu'],
  },
  {
    name: 'chat',
    title: 'Giao tiếp',
    icon: 'chatbubbles-outline',
    roles: ['thukho', 'truongphong', 'nhanvienkho', 'nhanvienkd', 'quanlynansu'],
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
    case 'quanlynansu':
      return 'staff';
    default:
      return 'home'; 
  }
};

export default function TabLayout() {
  const { role, loading } = useAuth();

  if (loading || !role) {
    return (
      <View style={styles.homeStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.homeStyles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  const allowedTabs = tabConfigs.filter(config => config.roles.includes(role));
  
  let initialRouteName = getInitialRoute(role);

  const isInitialRouteAllowed = allowedTabs.some(tab => tab.name === initialRouteName);
  if (!isInitialRouteAllowed) {
    initialRouteName = 'home';
  }
  
  if (allowedTabs.length === 0) {
     return (
        <View style={styles.homeStyles.errorContainer}>
            <Ionicons name="warning-outline" size={50} color="#EF4444" />
            <Text style={styles.homeStyles.errorText}>Lỗi: Vai trò {role} không có quyền truy cập tab nào.</Text>
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