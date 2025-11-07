// app/(tabs)/staff.tsx
import { Ionicons } from '@expo/vector-icons';
import { Query } from 'appwrite';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- COMPONENTS ---
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { QuickNav } from '../../components/QuickNav';
import { AssignScheduleModal } from '../../components/staff/AssignScheduleModal';
import { IndividualScheduleView } from '../../components/staff/IndividualScheduleView'; // Fix: Corrected import path
import { StaffListItem } from '../../components/staff/StaffListItem';
import StaffModal from '../../components/staff/StaffModal';
import { StaffUser } from '../../services/StaffService';

// --- CONFIG & CONTEXT ---
import { account, config, databases, functions } from '../../config/appwrite';
import { useAuth } from '../../context/AuthContext';
import { COLORS, styles } from '../../styles/homeStyle';

export default function StaffScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const [isModalVisible, setModalVisible] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<StaffUser | null>(null);

  const [isAssignModalVisible, setAssignModalVisible] = useState(false);
  const [staffToAssign, setStaffToAssign] = useState<StaffUser | null>(null);

  const [managers, setManagers] = useState<StaffUser[]>([]);
  const [managerViewMode, setManagerViewMode] = useState<'staff' | 'schedule'>('staff');

  const [isDeleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffUser | null>(null);

  const role = currentUser?.role;
  const isIndividualView = role === 'nhanvienkho' || role === 'nhanvienkd';
  const isManagerView = ['tongquanly', 'quanlynhansu', 'truongphong', 'thukho'].includes(role || '');

  // ===============================
  // Fetch Staff & Managers
  // ===============================
  const fetchStaffAndManagers = useCallback(async () => {
    if (!user || !isManagerView) return;
    setLoading(true);
    try {
      const queries: string[] = [];
      if (['truongphong', 'thukho'].includes(role || '')) {
        queries.push(Query.equal('managerId', user.$id));
      }

      const staffListResult = await databases.listDocuments(config.databaseId, config.userCollectionId, queries);
      const staffList = staffListResult.documents.map(doc => ({
        ...doc,
        uid: doc.$id,
        displayName: doc.name,
      })) as StaffUser[];
      setData(staffList);

      const managerRoles = ['truongphong', 'thukho', 'quanlynhansu', 'tongquanly'];
      const managersResult = await databases.listDocuments(config.databaseId, config.userCollectionId, [Query.equal('role', managerRoles)]);
      setManagers(managersResult.documents.map(doc => ({
        ...doc,
        uid: doc.$id,
        displayName: doc.name,
      })) as StaffUser[]);
    } catch (e) {
      console.error('Lỗi khi tải danh sách nhân viên:', e);
      Alert.alert('Lỗi', 'Không thể tải danh sách nhân viên.');
    } finally {
      setLoading(false);
    }
  }, [user, role, isManagerView]);

  // ===============================
  // Fetch Individual Data
  // ===============================
  const fetchIndividualData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userDoc = await databases.getDocument(config.databaseId, config.userCollectionId, user.$id);
      const scheduleData = {
        monthlyHours: userDoc.monthlyHours || 0,
        monthlySalary: userDoc.monthlySalary || 0,
        schedule: userDoc.schedule ? JSON.parse(userDoc.schedule) : {},
      };
      setData(scheduleData);
    } catch (e) {
      console.error('Lỗi khi tải dữ liệu cá nhân:', e);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu cá nhân.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isIndividualView) fetchIndividualData();
    else if (isManagerView) {
      if (managerViewMode === 'staff') fetchStaffAndManagers();
      else fetchIndividualData();
    }
  }, [isIndividualView, isManagerView, managerViewMode, fetchStaffAndManagers, fetchIndividualData]);

  // ===============================
  // Actions: Reset, Edit, Assign, Delete
  // ===============================
  const handleResetPassword = useCallback(async (email: string) => {
    try {
      await account.createRecovery(email, `${process.env.EXPO_PUBLIC_APP_URL}/reset-password`);
      Alert.alert('Thành công', `Email đặt lại mật khẩu đã được gửi đến ${email}.`);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Lỗi', `Không thể gửi email: ${e.message}`);
    }
  }, []);

  const handleEditUser = (staff: StaffUser) => {
    const isTopLevelManager = ['quanlynhansu', 'tongquanly'].includes(role || '');
    const isMidLevelManager = ['truongphong', 'thukho'].includes(role || '');
    const canEdit = isTopLevelManager || (isMidLevelManager && (staff.managerId === currentUser?.uid || staff.role === 'unassigned'));

    if (canEdit) {
      setStaffToEdit(staff);
      setModalVisible(true);
    } else {
      Alert.alert('Không có quyền', 'Bạn không có quyền sửa thông tin của nhân viên này.');
    }
  };

  const handleAssignSchedule = (staff: StaffUser) => {
    if (!['quanlynhansu', 'tongquanly'].includes(role || '')) {
      Alert.alert('Không có quyền', 'Chỉ Quản lý nhân sự mới có thể xếp lịch.');
      return;
    }
    setStaffToAssign(staff);
    setAssignModalVisible(true);
  };

  const handleSaveUser = async (data: Partial<StaffUser>) => {
    try {
      if (!staffToEdit) return;
      const { uid, displayName, ...restData } = data;
      const updateData = { ...restData, name: displayName };
      await databases.updateDocument(config.databaseId, config.userCollectionId, staffToEdit.uid, updateData);
      setModalVisible(false);
      fetchStaffAndManagers();
    } catch (e: any) {
      Alert.alert('Lỗi', `Không thể lưu: ${e.message}`);
    }
  };

  const handleDeleteUser = (staff: StaffUser) => {
    if (!['quanlynhansu', 'tongquanly'].includes(role || '')) {
      Alert.alert('Không có quyền', 'Chỉ Quản lý nhân sự mới có thể xóa nhân viên.');
      return;
    }
    setStaffToDelete(staff);
    setDeleteConfirmVisible(true);
  };

  const confirmDeleteUser = async () => {
    if (!staffToDelete) return;
    try {
      const result = await functions.createExecution('deleteUser', JSON.stringify({ userId: staffToDelete.uid }));
      if (result.status !== 'completed' || result.responseStatusCode !== 200) {
        const msg = result.responseBody ? JSON.parse(result.responseBody).message : 'Lỗi không xác định';
        throw new Error(msg);
      }
      Alert.alert('Thành công', 'Nhân viên đã được xóa.');
      setDeleteConfirmVisible(false);
      setStaffToDelete(null);
      fetchStaffAndManagers();
    } catch (e: any) {
      setDeleteConfirmVisible(false);
      Alert.alert('Lỗi', `Không thể xóa: ${e.message}`);
    }
  };

  const handleAssignScheduleSave = async (data: { uid: string; dates: string[]; shift: string; note: string; }) => {
    try {
      const result = await functions.createExecution('assignSchedule', JSON.stringify(data));
      if (result.status !== 'completed' || result.responseStatusCode !== 200) {
        throw new Error(JSON.parse(result.responseBody).message || 'Lỗi từ server');
      }
      fetchIndividualData();
    } catch (e: any) {
      Alert.alert('Lỗi', `Không thể phân công: ${e.message}`);
    }
  };

  const handleCheckIn = async () => {
    if (!user) return;
    try {
      const result: any = await functions.createExecution('checkIn', JSON.stringify({ userId: user.$id }));
      if (result.status !== 'completed' || result.responseStatusCode !== 200) {
        throw new Error(JSON.parse(result.responseBody).message || 'Lỗi từ server');
      }
      Alert.alert('Thành công', 'Đã chấm công!');
      fetchIndividualData();
    } catch (e: any) {
      Alert.alert('Lỗi', `Chấm công thất bại: ${e.message}`);
    }
  };

  // ===============================
  // Render
  // ===============================
  if (loading) {
    return (
      <View style={[styles.staffStyles.loadingContainer, styles.staffStyles.container]}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (isIndividualView && data) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 100 }}>
          <IndividualScheduleView data={data} handleCheckIn={handleCheckIn} />
        </ScrollView>
        <QuickNav />
      </View>
    );
  }

  if (isManagerView && data) {
    const isTopLevelManager = ['tongquanly', 'quanlynhansu'].includes(role || '');
    return (
      <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        <View style={[styles.staffStyles.container, { flex: 1, paddingTop: insets.top + 20 }]}>
          <View style={styles.staffStyles.viewModeContainer}>
            <TouchableOpacity
              onPress={() => setManagerViewMode('staff')}
              style={[styles.staffStyles.viewModeButton, managerViewMode === 'staff' && styles.staffStyles.viewModeButtonActive]}
            >
              <Text style={[styles.staffStyles.viewModeText, managerViewMode === 'staff' && styles.staffStyles.viewModeTextActive]}>
                Quản lý Nhân viên
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setManagerViewMode('schedule')}
              style={[styles.staffStyles.viewModeButton, managerViewMode === 'schedule' && styles.staffStyles.viewModeButtonActive]}
            >
              <Text style={[styles.staffStyles.viewModeText, managerViewMode === 'schedule' && styles.staffStyles.viewModeTextActive]}>
                Lịch làm của tôi
              </Text>
            </TouchableOpacity>
          </View>

          {managerViewMode === 'staff' ? (
            <>
              <View style={[styles.salesStyles.header, { marginBottom: 10 }]}>
                <Text style={styles.staffStyles.headerTitle}>{isTopLevelManager ? 'Quản lý Nhân sự' : 'Nhân viên'}</Text>
              </View>
              {isTopLevelManager && Array.isArray(data) && (
                <View style={styles.staffStyles.summaryCard}>
                  <View style={styles.staffStyles.summaryRow}>
                    <Ionicons name="business-outline" size={24} color={COLORS.primary} />
                    <Text style={styles.staffStyles.summaryText}>
                      Tổng Giờ Công: <Text style={styles.staffStyles.boldText}>{(data as StaffUser[]).reduce((sum, u) => sum + (u.monthlyHours || 0), 0)}</Text> giờ
                    </Text>
                  </View>
                  <View style={styles.staffStyles.summaryRow}>
                    <Ionicons name="wallet-outline" size={24} color={COLORS.accent} />
                    <Text style={styles.staffStyles.summaryText}>
                      Tổng Lương (Tháng): <Text style={styles.staffStyles.boldText}>{(data as StaffUser[]).reduce((sum, u) => sum + (u.monthlySalary || 0), 0).toLocaleString('vi-VN')}</Text> VND
                    </Text>
                  </View>
                </View>
              )}
              <FlatList
                data={data as StaffUser[]}
                keyExtractor={(item) => item.uid}
                renderItem={({ item }) =>
                  currentUser ? (
                    <StaffListItem
                      item={item}
                      currentUser={currentUser as StaffUser}
                      onAssignSchedule={() => handleAssignSchedule(item)}
                      onEditUser={() => handleEditUser(item)}
                      onDeleteUser={() => handleDeleteUser(item)}
                    />
                  ) : null
                }
                style={styles.staffStyles.list}
                contentContainerStyle={{ paddingBottom: 120 }}
              />
            </>
          ) : (
            <IndividualScheduleView data={data} handleCheckIn={handleCheckIn} />
          )}

          <StaffModal
            isVisible={isModalVisible}
            onClose={() => setModalVisible(false)}
            staffToEdit={staffToEdit}
            onSave={handleSaveUser}
            managers={managers}
            onResetPassword={handleResetPassword}
          />
          <AssignScheduleModal
            isVisible={isAssignModalVisible}
            onClose={() => setAssignModalVisible(false)}
            staffToAssign={staffToAssign}
            onAssign={handleAssignScheduleSave}
          />
          {staffToDelete && (
            <ConfirmationModal
              isVisible={isDeleteConfirmVisible}
              onClose={() => setDeleteConfirmVisible(false)}
              onConfirm={confirmDeleteUser}
              title="Xác nhận xóa"
              message={`Bạn có chắc chắn muốn xóa vĩnh viễn nhân viên "${staffToDelete.displayName}" không? Hành động này không thể hoàn tác.`}
              confirmButtonText="Xóa"
            />
          )}
        </View>
        <QuickNav />
      </View>
    );
  }

  return (
    <View style={[styles.staffStyles.container, { flex: 1, paddingTop: insets.top + 20, justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={styles.staffStyles.infoText}>Không có dữ liệu để hiển thị.</Text>
      <QuickNav />
    </View>
  );
}
