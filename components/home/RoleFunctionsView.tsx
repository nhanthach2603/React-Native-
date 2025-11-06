// components/home/RoleFunctionsView.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppwriteUser, UserRole } from '../../context/AuthContext';
import { COLORS } from '../../styles/_colors';

interface TabConfig {
  name: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  roles: UserRole[];
}

// Lấy cấu hình các tab từ _layout để biết vai trò nào có chức năng gì
const tabConfigs: TabConfig[] = [
  { name: 'warehouse', title: 'Kho hàng', icon: 'cube-outline', roles: ['truongphong', 'thukho', 'nhanvienkho', 'tongquanly'] },
  { name: 'sales', title: 'Bán hàng', icon: 'cart-outline', roles: ['truongphong', 'nhanvienkd', 'thukho', 'tongquanly'] },
  { name: 'staff', title: 'Nhân sự', icon: 'people-outline', roles: ['truongphong', 'thukho', 'nhanvienkho', 'nhanvienkd', 'quanlynhansu', 'tongquanly'] },
  { name: 'chat', title: 'Giao tiếp', icon: 'chatbubbles-outline', roles: ['thukho', 'truongphong', 'nhanvienkho', 'nhanvienkd', 'quanlynhansu', 'tongquanly'] },
];

interface RoleFunctionsViewProps {
  currentUser: AppwriteUser | null;
}

export const RoleFunctionsView: React.FC<RoleFunctionsViewProps> = ({ currentUser }) => {
  if (!currentUser?.role) {
    return null;
  }

  // Lọc ra các chức năng mà người dùng này có quyền truy cập (trừ tab 'home')
  const allowedFunctions = tabConfigs.filter(config => config.roles.includes(currentUser.role!));

  if (allowedFunctions.length === 0) {
    return <Text style={styles.noFunctionsText}>Bạn không có chức năng nào khác.</Text>;
  }

  return (
    <View style={styles.container}>
      {allowedFunctions.map((func) => (
        <TouchableOpacity 
          key={func.name} 
          style={styles.button} 
          // Sửa: Điều hướng đến các màn hình tương ứng trong thư mục /screens
          onPress={() => router.push(`/screens/${func.name}` as any)}
        >
          <Ionicons name={func.icon} size={28} color={COLORS.primary} />
          <Text style={styles.buttonText}>{func.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    backgroundColor: COLORS.bg_card,
    width: '48%', // Để 2 nút trên một hàng
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  buttonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  noFunctionsText: {
    textAlign: 'center',
    color: COLORS.text_secondary,
    marginTop: 15,
  },
});