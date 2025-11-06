// d:/React-Native-/components/home/ManagerStats.tsx

import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { styles } from '../../styles/homeStyle';
import { StatCard } from './StatCard';

export const ManagerStats = () => (
  <View style={styles.homeStyles.statContainer}>
    <StatCard
      iconName="calendar-outline"
      iconColor="#F59E0B"
      number="Xem"
      label="Xếp lịch làm"
      onPress={() => router.navigate('/screens/staff')}
    />
    <StatCard
      iconName="time-outline"
      iconColor="#3B82F6"
      number="Tính công"
      label="Giờ làm tháng này"
      onPress={() => router.navigate('/screens/staff')}
    />
  </View>
);