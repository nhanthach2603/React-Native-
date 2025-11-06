// d:/React-Native-/components/home/HRManagerView.tsx

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { UserRole } from '../../context/AuthContext';
import { FunctionService } from '../../services/ChatService'; // [SỬA] Import FunctionService
import { StaffUser } from '../../services/StaffService'; // Giữ lại StaffUser type
import { COLORS } from '../../styles/_colors';
import { staffStyles } from '../../styles/staffScreen.styles';

export const HRManagerView = () => {
  const [staffOnShift, setStaffOnShift] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaffOnShift = async () => {
      try {
        // [SỬA] Gọi Cloud Function thay vì đọc trực tiếp từ Firestore
        const result = await FunctionService.getStaffOnShift();
        setStaffOnShift(result.data as StaffUser[]);
      } catch (error: any) {
        console.error("Lỗi khi lấy danh sách nhân viên làm việc:", error.message);
        // Hiển thị lỗi cho người dùng nếu cần
        // Alert.alert("Lỗi", "Không thể tải danh sách nhân viên làm việc.");
      } finally {
        setLoading(false);
      }
    };

    fetchStaffOnShift();
  }, []);

  const getDepartmentFromRole = (role: UserRole) => {
    if (role === 'nhanvienkho' || role === 'thukho') return 'Kho';
    if (role === 'nhanvienkd' || role === 'truongphong') return 'Kinh doanh';
    if (role === 'quanlynhansu' || role === 'tongquanly') return 'Văn phòng';
    return 'N/A';
  };

  if (loading) {
    return <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />;
  }

  if (staffOnShift.length === 0) {
    return (
      <View style={localStyles.notificationCard}>
        <Ionicons name="checkmark-circle-outline" size={24} color={COLORS.primary} />
        <Text style={localStyles.notificationText}>Không có nhân viên nào làm việc hôm nay.</Text>
      </View>
    );
  }

  return (
  <View>
    {staffOnShift.map(staff => {
      const today = new Date().toISOString().split('T')[0];
      // [SỬA LỖI] Sử dụng optional chaining để tránh lỗi khi schedule không tồn tại.
      const shiftInfo = staff.schedule?.[today];

      return (
        <View key={staff.uid} style={staffStyles.baseCard}>
          <Text style={staffStyles.staffName}>{staff.displayName}</Text>
          <Text style={staffStyles.staffRole}>
            MSNV: {staff.uid.slice(0, 8).toUpperCase()} | Phòng: {getDepartmentFromRole(staff.role)}
          </Text>

          {/* [SỬA LỖI] Chỉ render thẻ ca làm việc nếu shiftInfo tồn tại */}
          {shiftInfo && (
            <View
              style={[
                staffStyles.shiftTag,
                { backgroundColor: shiftInfo.shift === 'Sáng' ? '#E0F2FE' : '#FEF3C7' },
              ]}
            >
              <Text
                style={[
                  staffStyles.shiftTagText,
                  { color: shiftInfo.shift === 'Sáng' ? '#0369A1' : '#92400E' },
                ]}
              >
                Ca: {shiftInfo.shift}
              </Text>
            </View>
          )}
        </View>
      );
    })}
  </View>
);

};

// [THÊM] Style cục bộ cho component này
const localStyles = StyleSheet.create({
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg_card,
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  notificationText: {
    marginLeft: 10,
    fontSize: 15,
    color: COLORS.text_secondary,
  },
});