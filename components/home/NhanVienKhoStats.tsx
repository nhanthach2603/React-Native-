// d:/React-Native-/components/home/NhanVienKhoStats.tsx

import { Query } from 'appwrite';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { databases } from '../../config/appwrite';
import { styles } from '../../styles/homeStyle';
import { StatCard } from './StatCard';

export const NhanVienKhoStats = ({ currentUser }: { currentUser: any | null }) => {
  const [completedOrdersCount, setCompletedOrdersCount] = useState(0);
  const [assignedTodayCount, setAssignedTodayCount] = useState(0);
  
  const dbId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
  const ordersCollectionId = process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_ORDERS!;

  useEffect(() => {
    if (currentUser?.$id) {
      const fetchStats = async () => {
        try {
          // Đếm đơn hàng đã soạn xong (trong tháng)
          const completedResponse = await databases.listDocuments(dbId, ordersCollectionId, [
            Query.equal('assignedTo', currentUser.$id),
            Query.equal('status', ['Completed', 'Shipped']),
            Query.limit(100) // Giới hạn để tránh quá tải, có thể điều chỉnh
          ]);
          setCompletedOrdersCount(completedResponse.total);

          // Đếm đơn hàng được giao hôm nay
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Bắt đầu ngày
          const assignedResponse = await databases.listDocuments(dbId, ordersCollectionId, [
            Query.equal('assignedTo', currentUser.$id),
            Query.greaterThanEqual('$createdAt', today.toISOString()), // Lọc theo ngày tạo
          ]);
          setAssignedTodayCount(assignedResponse.total);
        } catch (error) {
          console.error("Lỗi khi tải thống kê nhân viên kho:", error);
        }
      };
      fetchStats();
    }
  }, [currentUser.$id, dbId, ordersCollectionId]);

  return (
    <View style={styles.homeStyles.statContainer}>
      <StatCard
        iconName="document-text-outline"
        iconColor="#0E7490"
        number={assignedTodayCount}
        label="Đơn được giao hôm nay"
        onPress={() => router.navigate('/screens/warehouse')}
      />
      <StatCard
        iconName="archive-outline"
        iconColor="#374151"
        number={completedOrdersCount}
        label="Đơn hàng đã soạn xong (Tháng)"
        onPress={() => router.push({ pathname: '/completed-orders', params: { staffUid: currentUser.$id } })}
      />
    </View>
  );
};