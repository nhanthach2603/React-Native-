// d:/React-Native-/components/home/HRManagerView.tsx

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { UserRole } from '../../context/AuthContext';
import { StaffService, StaffUser } from '../../services/StaffService';
import { COLORS } from '../../styles/_colors';
import { staffStyles } from '../../styles/staffScreen.styles';

export const HRManagerView = () => {
  const [staffOnShift, setStaffOnShift] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const staffService = new StaffService();
    const fetchStaffOnShift = async () => {
      try {
        const result = await staffService.getAllStaffWithSchedule();
        setStaffOnShift(result || []);
      } catch (error: any) {
        console.error("Lỗi khi lấy danh sách nhân viên làm việc:", error?.message || error);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffOnShift();
  }, []);

  const getDepartmentFromRole = (role?: UserRole) => {
    if (!role) return 'N/A';
    if (role === 'nhanvienkho' || role === 'thukho') return 'Kho';
    if (role === 'nhanvienkd' || role === 'truongphong') return 'Kinh doanh';
    if (role === 'quanlynhansu' || role === 'tongquanly') return 'Văn phòng';
    return 'N/A';
  };

  if (loading) {
    return <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />;
  }

  if (!staffOnShift.length) {
    return (
      <View style={localStyles.notificationCard}>
        <Ionicons name="checkmark-circle-outline" size={24} color={COLORS.primary} />
        <Text style={localStyles.notificationText}>Không có nhân viên nào làm việc hôm nay.</Text>
      </View>
    );
  }

  return (
    <View>
      {staffOnShift.map((staff) => {
        const uid = staff.uid ?? 'unknown';
        const displayName = staff.displayName ?? 'Chưa đặt tên';
        const role = staff.role;
        const today = new Date().toISOString().split('T')[0];
        const shiftInfo = staff.schedule?.[today] ?? null;

        return (
          <View key={uid} style={staffStyles.baseCard}>
            <Text style={staffStyles.staffName}>{displayName}</Text>
            <Text style={staffStyles.staffRole}>
              MSNV: {uid.slice(0, 8).toUpperCase()} | Phòng: {getDepartmentFromRole(role)}
            </Text>

            {shiftInfo && shiftInfo.shift && (
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
