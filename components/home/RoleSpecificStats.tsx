// d:/React-Native-/components/home/RoleSpecificStats.tsx

import { router } from 'expo-router';
import React from 'react';
import { Alert, Text, View } from 'react-native';
import { styles } from '../../styles/homeStyle';
import { HRManagerView } from './HRManagerView';
import { ManagerStats } from './ManagerStats';
import { NhanVienKhoStats } from './NhanVienKhoStats';
import { StatCard } from './StatCard';

export const RoleSpecificStats = ({ currentUser }: { currentUser: any | null }) => {
  const role = currentUser?.role;
  const isManagementRole = role === 'tongquanly';

  if (isManagementRole) {
    return <ManagerStats />;
  }

  switch (role) {
    case 'thukho':
      return (
        <View style={styles.homeStyles.statContainer}>
          <StatCard
            iconName="time-outline"
            iconColor="#F59E0B"
            number={7}
            label="Đơn chờ xử lý"
            onPress={() => router.navigate('/screens/warehouse')}
          />
          <StatCard
            iconName="cube-outline"
            iconColor="#3B82F6"
            number={3}
            label="Sản phẩm dưới định mức"
            onPress={() => router.navigate('/screens/sales')}
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
            onPress={() => router.navigate('/screens/sales')}
          />
        </View>
      );
    case 'nhanvienkho':
      return <NhanVienKhoStats currentUser={currentUser} />;
    case 'nhanvienkd':
      return (
        <View style={styles.homeStyles.statContainer}>
          <StatCard
            iconName="list-outline"
            iconColor="#374151"
            number={15}
            label="Bill đã soạn"
            onPress={() => router.navigate('/screens/sales')}
          />
          <StatCard
            iconName="checkmark-circle-outline"
            iconColor="#10B981"
            number={850}
            label="Tổng số lượng tồn kho"
            onPress={() => router.navigate('/screens/sales')}
          />
        </View>
      );
    case 'quanlynhansu':
      return <HRManagerView />;
    default:
      return (
        <View style={styles.homeStyles.statContainer}>
          <Text style={styles.homeStyles.infoText}>Bạn chưa được gán vai trò làm việc. Vui lòng liên hệ quản lý.</Text>
        </View>
      );
  }
};