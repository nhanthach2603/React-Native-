// components/staff/StaffListItem.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { StaffUser, UserRole } from '../../services/StaffService';
import { COLORS, styles } from '../../styles/homeStyle';

const getRoleDisplayName = (userRole?: UserRole | null) => {
  console.log("DEBUG: userRole in getRoleDisplayName:", userRole);
  switch (userRole) {
    case 'thukho': return 'Thủ kho';
    case 'truongphong': return 'Trưởng phòng KD/QA';
    case 'nhanvienkho': return 'Nhân viên Kho';
    case 'nhanvienkd': return 'Nhân viên Kinh doanh';
    case 'quanlynhansu': return 'Quản lý Nhân sự';
    case 'tongquanly': return 'Tổng quản lý';
    case null:
    case undefined:
    case 'unassigned':
    default: return 'Chưa được gán';
  }
};

interface StaffListItemProps {
  item: StaffUser;
  currentUser: StaffUser;
  onAssignSchedule: (item: StaffUser) => void;
  onEditUser: (item: StaffUser) => void;
  onDeleteUser: (item: StaffUser) => void;
}

export const StaffListItem: React.FC<StaffListItemProps> = ({
  item,
  currentUser,
  onAssignSchedule,
  onEditUser,
  onDeleteUser
}) => {
  const role = item.role ?? 'unassigned';
  const displayName = item.displayName ?? 'Chưa đặt tên';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const uid = item.uid ?? 'unknown';

  const isTopLevelManager = ['quanlynhansu', 'tongquanly'].includes(currentUser?.role || '');
  const isMidLevelManager = ['truongphong', 'thukho'].includes(currentUser?.role || '');
  const canEdit = isTopLevelManager || (isMidLevelManager && (item.managerId === currentUser?.uid || role === 'unassigned'));

  return (
    <View style={styles.staffStyles.baseCard}>
      <View style={styles.staffStyles.cardHeader}>
        <View style={styles.staffStyles.staffAvatar}>
          <Text style={styles.staffStyles.staffAvatarText}>{displayName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.staffStyles.staffInfo}>
          <Text style={styles.staffStyles.staffName}>{displayName}</Text>
          <Text style={styles.staffStyles.staffRole}>{getRoleDisplayName(role)}</Text>
        </View>
      </View>

      {isTopLevelManager && (
        <View style={styles.staffStyles.staffDetails}>
          <Text style={styles.staffStyles.staffHours}>
            <Ionicons name="time-outline" size={14} color={styles.staffStyles.staffHours.color} /> Giờ công: <Text style={styles.staffStyles.boldText}>{item.monthlyHours || 0} giờ</Text>
          </Text>
          <Text style={styles.staffStyles.staffHours}>
            <Ionicons name="cash-outline" size={14} color={styles.staffStyles.staffHours.color} /> Lương ước tính: <Text style={styles.staffStyles.boldText}>{((item.monthlyHours || 0) * (item.hourlyRate || 0)).toLocaleString('vi-VN')} VND</Text>
          </Text>
        </View>
      )}

      {(isTopLevelManager || isMidLevelManager) && (
        <View style={styles.staffStyles.actionButtons}>
          <TouchableOpacity onPress={() => onAssignSchedule(item)} style={styles.staffStyles.buttonIcon}>
            <Ionicons name="calendar" size={26} color={COLORS.secondary} />
          </TouchableOpacity>
          {canEdit && (
            <TouchableOpacity onPress={() => onEditUser(item)} style={styles.staffStyles.buttonIcon}>
              <Ionicons name="create" size={26} color={COLORS.accent} />
            </TouchableOpacity>
          )}
          {isTopLevelManager && (
            <TouchableOpacity onPress={() => onDeleteUser(item)} style={styles.staffStyles.buttonIcon}>
              <Ionicons name="trash" size={26} color={COLORS.error} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};
