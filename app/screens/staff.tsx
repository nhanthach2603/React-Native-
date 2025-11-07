// app/(tabs)/staff.tsx
import { Ionicons } from '@expo/vector-icons';
import { Query } from 'appwrite';
import React, { useCallback, useEffect, useState } from 'react'; // Giữ lại React
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native'; // Sửa: Import từ react-native
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConfirmationModal } from '../../components/ConfirmationModal'; // 1. Import modal mới
import { QuickNav } from '../../components/QuickNav';
import { AssignScheduleModal } from '../../components/staff/AssignScheduleModal';
import { IndividualScheduleView } from '../../components/staff/IndividualScheduleView';
import { StaffListItem } from '../../components/staff/StaffListItem';
import { StaffModal, StaffUser } from '../../components/staff/StaffModal'; // Sửa: Import StaffUser từ đây
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
  const [managers, setManagers] = useState<StaffUser[]>([]);
  const [staffToAssign, setStaffToAssign] = useState<StaffUser | null>(null);
  const role = currentUser?.role;
  // 2. Thêm state cho modal xác nhận xóa
  const [isDeleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffUser | null>(null);

  const [managerViewMode, setManagerViewMode] = useState<'staff' | 'schedule'>('staff');

  const isIndividualView = role === 'nhanvienkho' || role === 'nhanvienkd';
  const isManagerView = currentUser?.role === 'tongquanly' || currentUser?.role === 'quanlynhansu' || currentUser?.role === 'truongphong' || currentUser?.role === 'thukho';

  // [SỬA LỖI] Tái cấu trúc lại toàn bộ logic fetch dữ liệu
  const fetchStaffAndManagers = useCallback(async () => {
    if (!user || !isManagerView) return;
    setLoading(true);
    try {
      let queries: string[] = [];
      if (currentUser?.role === 'truongphong' || currentUser?.role === 'thukho') {
        queries.push(Query.equal('managerId', user.$id));
      }
      
      const staffListResult = await databases.listDocuments(config.databaseId, config.userCollectionId, queries);
      const staffList = staffListResult.documents.map(doc => ({ ...doc, uid: doc.$id, displayName: doc.name })) as StaffUser[];
      setData(staffList);

      const managerRoles = ['truongphong', 'thukho', 'quanlynhansu', 'tongquanly'];
      const managersResult = await databases.listDocuments(config.databaseId, config.userCollectionId, [Query.equal('role', managerRoles)]);
      setManagers(managersResult.documents.map(doc => ({ ...doc, uid: doc.$id, displayName: doc.name })) as StaffUser[]);
    } catch (e) {
      console.error('Lỗi khi tải danh sách nhân viên:', e);
      Alert.alert('Lỗi', 'Không thể tải danh sách nhân viên.');
    } finally {
      setLoading(false);
    }
  }, [user, currentUser, isManagerView]);

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
    if (isIndividualView) {
      fetchIndividualData();
    } else if (isManagerView) {
      if (managerViewMode === 'staff') {
        fetchStaffAndManagers();
      } else {
        fetchIndividualData();
      }
    }
  }, [isIndividualView, isManagerView, managerViewMode, fetchIndividualData, fetchStaffAndManagers]);

  useEffect(() => {
    if (isAssignModalVisible && staffToAssign && Array.isArray(data)) {
      const updatedStaff = (data as StaffUser[]).find(user => user.uid === staffToAssign.uid);
      if (updatedStaff) {
        setStaffToAssign(updatedStaff);
      }
    }
  }, [data, isAssignModalVisible, staffToAssign]);

  const handleResetPassword = useCallback(async (email: string) => {
    try {
      await account.createRecovery(email, `${process.env.EXPO_PUBLIC_APP_URL}/reset-password`);
      Alert.alert('Thành công', `Đã gửi email đặt lại mật khẩu đến ${email}. Vui lòng kiểm tra hộp thư của bạn.`);
    } catch (e: any) {
      console.error("Lỗi khi đặt lại mật khẩu:", e);
      Alert.alert('Lỗi', `Không thể gửi email: ${e.message}`);
    }
  }, []);

  const handleEditUser = (staff: StaffUser) => {
    // [SỬA] Đồng bộ logic kiểm tra quyền với StaffListItem.tsx
    const isTopLevelManager = ['quanlynhansu', 'tongquanly'].includes(currentUser?.role || '');
    const isMidLevelManager = currentUser?.role === 'truongphong' || currentUser?.role === 'thukho';
    const canEdit = isTopLevelManager || 
                    (isMidLevelManager && (staff.managerId === currentUser?.uid || staff.role === 'unassigned'));
                   
    if (canEdit) {
      setStaffToEdit(staff);
      setModalVisible(true);
    } else {
      Alert.alert('Không có quyền', 'Bạn không có quyền sửa thông tin của nhân viên này.');
    }
  };

  const handleAssignSchedule = (staff: StaffUser) => {
    // [SỬA] Chỉ 'quanlynhansu' và 'tongquanly' mới có quyền xếp lịch
    const canAssign = ['quanlynhansu', 'tongquanly'].includes(currentUser?.role || '');
    if (canAssign) {
      setStaffToAssign(staff);
      setAssignModalVisible(true);
    } else {
      Alert.alert('Không có quyền', 'Chỉ Quản lý nhân sự mới có thể xếp lịch làm việc.');
    }
  };

  const handleSaveUser = async (data: Partial<StaffUser>) => {
    try {
      const { uid, displayName, ...restData } = data;
      const updateData = { ...restData, name: displayName }; // Ánh xạ displayName sang name
      if (staffToEdit) {
        // Cập nhật người dùng hiện có
        await databases.updateDocument(config.databaseId, config.userCollectionId, staffToEdit.uid, updateData);
        // Alert.alert('Thành công', 'Đã cập nhật thông tin nhân viên.'); // Alert đã có trong onSave
        setModalVisible(false); // Chỉ đóng modal khi lưu thành công
        fetchStaffAndManagers(); // Tải lại danh sách nhân viên
      } else {
        // Logic để tạo người dùng mới (hiện không dùng nhưng để đảm bảo hàm hoàn chỉnh)
        // Nếu bạn muốn thêm lại chức năng này, bạn cần có Cloud Function 'createUser'
        Alert.alert('Lỗi Logic', 'Không tìm thấy nhân viên để cập nhật.');
      }
    } catch (e: any) {
      Alert.alert('Lỗi', `Không thể lưu: ${e.message || 'Đã có lỗi xảy ra.'}`);
    }
  };

  // 2. Sửa lại hàm handleDeleteUser để gọi Cloud Function
  const handleDeleteUser = async (staff: StaffUser) => {
    // [SỬA] Chỉ 'quanlynhansu' và 'tongquanly' mới có quyền xóa
    if (!['quanlynhansu', 'tongquanly'].includes(currentUser?.role || '')) {
      Alert.alert('Không có quyền', 'Chỉ Quản lý nhân sự mới có thể xóa nhân viên.');
      return;
    }
    // 3. Mở modal xác nhận thay vì dùng Alert
    setStaffToDelete(staff);
    setDeleteConfirmVisible(true);
  };

  // 4. Hàm thực hiện xóa sau khi người dùng xác nhận trên modal
  const confirmDeleteUser = async () => {
    if (!staffToDelete) return;

    try {
      // Gọi Appwrite Function để xóa người dùng (an toàn hơn)
      const result = await functions.createExecution('deleteUser', JSON.stringify({ userId: staffToDelete.uid }));
       // [SỬA] Sử dụng responseStatusCode và responseBody cho nhất quán và chính xác
       if (result.status !== 'completed' || result.responseStatusCode !== 200) {
        const errorMsg = result.responseBody ? JSON.parse(result.responseBody).message : 'Lỗi không xác định từ server function.';
        throw new Error(errorMsg);
      }
      Alert.alert('Thành công', 'Nhân viên đã được xóa.');
      setDeleteConfirmVisible(false); // Đóng modal xác nhận
      setStaffToDelete(null);
      fetchStaffAndManagers(); // Tải lại dữ liệu
    } catch (e: any) {
      setDeleteConfirmVisible(false);
      Alert.alert('Lỗi', `Không thể xóa: ${e.message || 'Vui lòng kiểm tra logs.'}`);
    }
  };
  const handleAssignScheduleSave = async (data: { uid: string; dates: string[]; shift: string; note: string; }) => {
    try {
      // Logic này phức tạp và nên được xử lý bởi một Appwrite Function
      const result = await functions.createExecution('assignSchedule', JSON.stringify(data));
       // [SỬA] Sử dụng responseStatusCode và responseBody
       if (result.status !== 'completed' || result.responseStatusCode !== 200) {
        throw new Error(JSON.parse(result.responseBody).message || 'Lỗi từ server function.');
      }
      fetchIndividualData(); // Tải lại lịch cá nhân
    } catch (e: any) {
      Alert.alert('Lỗi', `Không thể phân công: ${e.message}`);
    }
  };

  const handleCheckIn = async () => {
    if (!user) return;
    try {
      // Logic này nên được xử lý bởi một Appwrite Function để đảm bảo tính toàn vẹn
      const result: any = await functions.createExecution('checkIn', JSON.stringify({ userId: user.$id }));
       // [SỬA] Sử dụng responseStatusCode và responseBody
       if (result.status !== 'completed' || result.responseStatusCode !== 200) {
        throw new Error(JSON.parse(result.responseBody).message || 'Lỗi từ server function.');
      }
      Alert.alert('Thành công', 'Đã chấm công! Giờ công và lương đã được cập nhật.');
      fetchIndividualData(); // Tải lại dữ liệu cá nhân
    } catch (e: any) {
      Alert.alert('Lỗi', `Chấm công thất bại: ${e.message}`);
    }
  };

  if (loading) {
    return (
      <View style={[styles.staffStyles.loadingContainer, styles.staffStyles.container]}>
        <ActivityIndicator size='large' color='#10B981' />
      </View>
    );
  }
  if (isIndividualView && data) {
    return (
      // Thêm View bao bọc để chứa QuickNav
      <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 100 }}>
          <IndividualScheduleView data={data} handleCheckIn={handleCheckIn} />
        </ScrollView>
        <QuickNav />
      </View>
    );
  }

  if (isManagerView && data) {
    const isTopLevelManager = currentUser?.role === 'tongquanly' || currentUser?.role === 'quanlynhansu';
    // [SỬA LỖI] Thêm 'return' để render JSX
    return (
      <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        <View style={[styles.staffStyles.container, { flex: 1, paddingTop: insets.top + 20, paddingHorizontal: 0, paddingBottom: 0 }]}>
          {/* [THÊM] Thêm nút chuyển đổi view cho quản lý */}
          <View style={styles.staffStyles.viewModeContainer}>
            <TouchableOpacity onPress={() => setManagerViewMode('staff')} style={[styles.staffStyles.viewModeButton, managerViewMode === 'staff' && styles.staffStyles.viewModeButtonActive]}><Text style={[styles.staffStyles.viewModeText, managerViewMode === 'staff' && styles.staffStyles.viewModeTextActive]}>Quản lý Nhân viên</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setManagerViewMode('schedule')} style={[styles.staffStyles.viewModeButton, managerViewMode === 'schedule' && styles.staffStyles.viewModeButtonActive]}><Text style={[styles.staffStyles.viewModeText, managerViewMode === 'schedule' && styles.staffStyles.viewModeTextActive]}>Lịch làm của tôi</Text></TouchableOpacity>
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
                    <Text style={styles.staffStyles.summaryText}>Tổng Giờ Công: <Text style={styles.staffStyles.boldText}>{(data as StaffUser[]).reduce((sum, u) => sum + (u.monthlyHours || 0), 0)}</Text> giờ</Text>
                  </View>
                  <View style={styles.staffStyles.summaryRow}>
                    <Ionicons name="wallet-outline" size={24} color={COLORS.accent} />
                    <Text style={styles.staffStyles.summaryText}>Tổng Lương (Tháng): <Text style={styles.staffStyles.boldText}>{(data as StaffUser[]).reduce((sum, u) => sum + (u.monthlySalary || 0), 0).toLocaleString('vi-VN')}</Text> VND</Text>
                  </View>
                </View>
              )}
              <FlatList
                data={data as StaffUser[]}
                keyExtractor={(item) => item.uid}
                renderItem={({ item }) =>
                  currentUser ? ( // [SỬA LỖI] Thêm kiểm tra để đảm bảo currentUser tồn tại
                    <StaffListItem item={item} currentUser={currentUser} onAssignSchedule={() => handleAssignSchedule(item)} onEditUser={() => handleEditUser(item)} onDeleteUser={() => handleDeleteUser(item)} />
                  ) : null // Không render gì nếu currentUser không tồn tại
                }
                style={styles.staffStyles.list}
                contentContainerStyle={{ paddingBottom: 120 }}
              />
            </>
          ) : ( // Khi quản lý xem lịch làm của chính họ
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
          <AssignScheduleModal isVisible={isAssignModalVisible} onClose={() => setAssignModalVisible(false)} staffToAssign={staffToAssign} onAssign={handleAssignScheduleSave} />
          {/* 5. Thêm ConfirmationModal vào cây component */}
          {staffToDelete && (
            <ConfirmationModal
              isVisible={isDeleteConfirmVisible}
              onClose={() => setDeleteConfirmVisible(false)}
              onConfirm={confirmDeleteUser}
              title="Xác nhận xóa"
              message={`Bạn có chắc chắn muốn xóa vĩnh viễn nhân viên "${staffToDelete?.displayName}" không? Hành động này không thể hoàn tác.`}
              confirmButtonText="Xóa"
            />
          )}
        </View>
        <QuickNav />
      </View>
    );
  }
  // Fallback view nếu không có quyền hoặc dữ liệu
  return <View style={[styles.staffStyles.container, { flex: 1, paddingTop: insets.top + 20, justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={styles.staffStyles.infoText}>Không có dữ liệu để hiển thị.</Text>
      {/* Vẫn hiển thị QuickNav để người dùng có thể thoát ra */}
      <QuickNav />
    </View>;
}
