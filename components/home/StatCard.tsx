// d:/React-Native-/components/home/StatCard.tsx

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { styles } from '../../styles/homeStyle';

export interface StatCardProps {
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  number: number | string;
  label: string;
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ iconName, iconColor, number, label, onPress }) => (
  <TouchableOpacity style={styles.homeStyles.statCard} onPress={onPress}>
    <Ionicons name={iconName} size={30} color={iconColor} />
    <Text style={styles.homeStyles.statNumber}>{number}</Text>
    <Text style={styles.homeStyles.statLabel}>{label}</Text>
  </TouchableOpacity>
);