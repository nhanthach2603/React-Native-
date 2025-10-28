// app/(tabs)/staff.tsx
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { doc, DocumentData, getDoc } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../config/firebase';
import { useAuth, UserRole } from '../../context/AuthContext';
import { StaffService, StaffUser } from '../../services/StaffService';
import { styles } from '../../styles/homeStyle';
interface CalendarDay {
  dateString: string;
  day: number;
  month: number;
  year: number;
}

const getRoleDisplayName = (userRole: UserRole) => {
  switch (userRole) {
    case 'thukho':
      return 'Thủ kho';
    case 'truongphong':
      return 'Trưởng phòng KD/QA';
    case 'nhanvienkho':
      return 'Nhân viên Kho';
    case 'nhanvienkd':
      return 'Nhân viên Kinh doanh';
    case 'quanlynhansu': // Thêm role này
      return 'Quản lý Nhân sự';
    case null:
    case 'unassigned':
    default:
      return 'Chưa được gán';
  }
};

const ROLES = [
  { label: 'Quản lý Nhân sự', value: 'quanlynhansu' }, // Thêm role này
  { label: 'Thủ kho', value: 'thukho' },
  { label: 'Trưởng phòng KD/QA', value: 'truongphong' },
  { label: 'Nhân viên Kho', value: 'nhanvienkho' },
  { label: 'Nhân viên Kinh doanh', value: 'nhanvienkd' },
];

interface StaffModalProps {
  isVisible: boolean;
  onClose: () => void;
  staffToEdit: StaffUser | null;
  onSave: (data: Partial<StaffUser>) => void;
  managers: StaffUser[]; // Thêm prop để nhận danh sách quản lý
}

const StaffModal: React.FC<StaffModalProps> = ({ isVisible, onClose, staffToEdit, onSave, managers }) => {
  const { currentUser } = useAuth(); // [SỬA ĐỔI] Lấy currentUser từ AuthContext
  
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('unassigned');
  const [managerId, setManagerId] = useState<string>('');

  // [SỬA ĐỔI] Biến để kiểm tra quyền sửa role/managerId
  const canEditSensitiveFields = currentUser?.role === 'quanlynhansu'; 

  useEffect(() => {
    if (staffToEdit) {
      setEmail(staffToEdit.email);
      setDisplayName(staffToEdit.displayName);
      setRole(staffToEdit.role as UserRole || 'unassigned');
      const initialManagerId = staffToEdit.managerId;
      setManagerId(initialManagerId && initialManagerId !== 'new' ? initialManagerId : '');

    } else {
      setEmail('');
      setDisplayName('');
      setRole('unassigned');
      setManagerId('new');
    }
  }, [staffToEdit]);

   const handleSave = async () => {
    if (!email || !displayName) { // Bỏ kiểm tra !role vì nó có thể là 'unassigned'
      Alert.alert('Lỗi', 'Vui lòng điền đủ Tên hiển thị.');
      return;
    }

    // [SỬA LỖI] Bắt đầu với dữ liệu hiện có của người dùng để tránh xóa các trường không có trong form.
    const data: Partial<StaffUser> = {
      ...staffToEdit,
      displayName,
    };

    // CHỈ thêm/cập nhật role và managerId vào payload nếu người dùng có quyền (quanlynhansu)
    if (canEditSensitiveFields) {
      data.role = role;
      // Nếu managerId là chuỗi rỗng (Picker "Không có"), lưu giá trị null vào Firestore.
      data.managerId = managerId === '' ? null : managerId;
    }
    onSave(data);
    onClose();
  };

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={styles.salesStyles.modalOverlay}>
        <View style={styles.salesStyles.modalView}>
          <Text style={styles.salesStyles.modalTitle}>{staffToEdit ? 'Sửa Nhân viên' : 'Thêm Nhân viên'}</Text>
          <TextInput 
              style={styles.salesStyles.modalInput} 
              placeholder="Email" 
              value={email} 
              onChangeText={setEmail} 
              editable={false} // Email không được sửa
          />
          <TextInput 
              style={styles.salesStyles.modalInput} 
              placeholder="Tên hiển thị" 
              value={displayName} 
              onChangeText={setDisplayName} 
          />

          <Text style={styles.staffStyles.modalLabel}>Chọn vai trò:</Text>
          <View style={styles.salesStyles.pickerContainer}>
            <Picker
              selectedValue={role}
              onValueChange={(itemValue) => setRole(itemValue as UserRole)}
              style={styles.salesStyles.modalPicker}
              enabled={canEditSensitiveFields} // [SỬA ĐỔI] Vô hiệu hóa nếu không phải quanlynhansu
            >
              <Picker.Item label="Chọn vai trò" value="" />
              {ROLES.map(r => <Picker.Item key={r.value} label={r.label} value={r.value} />)}
            </Picker>
          </View>
          
          {!canEditSensitiveFields && ( // [SỬA ĐỔI] Thông báo cho người dùng
              <Text style={styles.staffStyles.infoText}>
                  (Chỉ Quản lý Nhân sự được phép sửa vai trò)
              </Text>
          )}

          <Text style={styles.staffStyles.modalLabel}>Chọn phòng ban (Người quản lý):</Text>
          <View style={styles.salesStyles.pickerContainer}>
            <Picker
              selectedValue={managerId}
              onValueChange={(itemValue) => setManagerId(itemValue)}
              style={styles.salesStyles.modalPicker}
              enabled={canEditSensitiveFields} // [SỬA ĐỔI] Vô hiệu hóa nếu không phải quanlynhansu
            >
              <Picker.Item label="Không có (Cấp cao nhất)" value="" />
              {managers.map(m => (
                <Picker.Item key={m.uid} label={`${m.displayName} (${getRoleDisplayName(m.role)})`} value={m.uid} />
              ))}
            </Picker>
          </View>
          
          {!canEditSensitiveFields && ( // [SỬA ĐỔI] Thông báo cho người dùng
              <Text style={styles.staffStyles.infoText}>
                  (Chỉ Quản lý Nhân sự được phép phân công phòng ban)
              </Text>
          )}

          <View style={styles.salesStyles.modalButtons}>
            <Button title="Hủy" onPress={onClose} color="red" />
            <Button title="Lưu" onPress={handleSave} color="green" />
          </View>
        </View>
      </View>
    </Modal>
  );
};

interface AssignScheduleModalProps {
  isVisible: boolean;
  onClose: () => void;
  staffToAssign: StaffUser | null;
  onAssign: (data: { uid: string; date: string; shift: string; note: string }) => Promise<void>;
}

const AssignScheduleModal: React.FC<AssignScheduleModalProps> = ({
  isVisible,
  onClose,
  staffToAssign,
  onAssign,
}) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [shift, setShift] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (staffToAssign) {
      setSelectedDate(new Date().toISOString().slice(0, 10)); // Default to today
      setShift('');
      setNote('');
    }
  }, [staffToAssign]);

  const handleAssign = async () => {
    if (!staffToAssign || !selectedDate || !shift) {
      Alert.alert('Lỗi', 'Vui lòng chọn ngày và ca làm việc.');
      return;
    }
    setLoading(true);
    try {
      await onAssign({
        uid: staffToAssign.uid,
        date: selectedDate,
        shift,
        note,
      });
      onClose();
    } catch (e: any) {
      Alert.alert('Lỗi', e.message || 'Không thể phân công lịch làm việc.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal animationType='slide' transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={styles.salesStyles.modalOverlay}>
        <View style={styles.salesStyles.modalView}>
          <Text style={styles.salesStyles.modalTitle}>
            Phân công lịch làm việc cho {staffToAssign?.displayName}
          </Text>
          <Calendar
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={{
              [selectedDate]: {
                selected: true,
                marked: true,
                selectedColor: '#10B981',
              },
            }}
            style={{ width: '100%', marginBottom: 20 }}
          />
          <Text style={styles.staffStyles.modalLabel}>Chọn ca làm việc:</Text>
          <View style={styles.salesStyles.pickerContainer}>
            <Picker
              selectedValue={shift}
              onValueChange={(itemValue) => setShift(itemValue)}
              style={styles.salesStyles.modalPicker}>
              <Picker.Item label='Chọn ca' value='' />
              <Picker.Item label='Ca sáng (8h-12h)' value='Ca sáng' />
              <Picker.Item label='Ca chiều (13h-17h)' value='Ca chiều' />
              <Picker.Item label='Ca tối (18h-22h)' value='Ca tối' />
              <Picker.Item label='Nghỉ' value='Nghỉ' />
            </Picker>
          </View>
          <TextInput
            style={styles.salesStyles.modalInput}
            placeholder='Ghi chú (nếu có)'
            value={note}
            onChangeText={setNote}
            multiline
          />
          <View style={styles.salesStyles.modalButtons}>
            <Button title='Hủy' onPress={onClose} color='red' />
            <Button title={loading ? 'Đang lưu...' : 'Phân công'} onPress={handleAssign} color='green' disabled={loading} />
          </View>
        </View>
      </View>
    </Modal>
  );
};
export default function StaffScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  const [isModalVisible, setModalVisible] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<StaffUser | null>(null);

  const [isAssignModalVisible, setAssignModalVisible] = useState(false);
  const [managers, setManagers] = useState<StaffUser[]>([]); 
  const [staffToAssign, setStaffToAssign] = useState<StaffUser | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  
  const role = currentUser?.role;

  const fetchStaffData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      if (role === 'nhanvienkho' || role === 'nhanvienkd') {
        const userDocRef = doc(db, 'user', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data() as DocumentData;
          setData({
            monthlyHours: userData.monthlyHours || 0,
            monthlySalary: userData.monthlySalary || 0,
            schedule: userData.schedule || {},
          });
          setSelectedDay({
            dateString: today,
          } as CalendarDay);
        }
      } else { 
        const staffList = await StaffService.getStaffList(
          user.uid,
          currentUser?.role || 'unassigned',
          currentUser?.managerId
        );
        setData(staffList);

        const managerUsers = await StaffService.getManagers();
        setManagers(managerUsers);
      }
    } catch (e) {
      console.error('Lỗi khi tải dữ liệu nhân sự:', e);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  }, [user, role, today, currentUser]);

  useEffect(() => {
    fetchStaffData();
  }, [fetchStaffData]);

  const handleEditUser = (staff: StaffUser) => {
    // [SỬA ĐỔI] Kiểm tra lại quyền trước khi mở Modal (để tránh lỗi nếu logic hiển thị nút sai)
    const isTopLevel = currentUser?.managerId === null || currentUser?.role === 'quanlynhansu';
    const isMidLevel = currentUser?.role === 'truongphong' || currentUser?.role === 'thukho';
    const isAllowedToEdit = isTopLevel || (isMidLevel && (staff.managerId === currentUser?.uid || staff.role === 'unassigned'));

    if (isAllowedToEdit) {
      setStaffToEdit(staff);
      setModalVisible(true);
    } else {
      Alert.alert('Lỗi', 'Bạn không có quyền sửa thông tin nhân viên này.');
    }
  };

  const handleAssignSchedule = (staff: StaffUser) => {
    setStaffToAssign(staff);
    setAssignModalVisible(true);
  };

  const handleSaveUser = async (data: Partial<StaffUser>) => {
    // [SỬA LỖI] Chỉ gửi những trường có trong `data` (được tạo trong StaffModal)
    try {
      // [SỬA LỖI] Loại bỏ trường 'uid' khỏi payload cập nhật để tránh lỗi PERMISSION_DENIED.
      // Firestore không cho phép cập nhật ID của document.
      const { uid, ...updateData } = data;

      if (staffToEdit) {
        await StaffService.updateStaff(staffToEdit.uid, updateData);
        Alert.alert('Thành công', 'Đã cập nhật thông tin nhân viên.');
      } else {
        console.log("Chức năng thêm mới không còn được hỗ trợ từ màn hình này.");
      }
      fetchStaffData();
    } catch (e: any) {
      Alert.alert('Lỗi', `Không thể lưu: ${e.message}`);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    Alert.alert('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa nhân viên này không?', [
      { text: 'Hủy' },
      {
        text: 'Xóa',
        onPress: async () => {
          try {
            await StaffService.deleteStaff(uid);
            fetchStaffData();
            Alert.alert('Thành công', 'Nhân viên đã bị xóa.');
          } catch (e: any) {
            Alert.alert('Lỗi', `Không thể xóa: ${e.message}`);
          }
        },
      },
    ]);
  };

  const handleAssignScheduleSave = async (data: {
    uid: string;
    date: string;
    shift: string;
    note: string;
  }) => {
    try {
      await StaffService.assignSchedule(data.uid, data.date, data.shift, data.note);
      Alert.alert('Thành công', 'Đã phân công lịch làm việc.');
      fetchStaffData();
    } catch (e: any) {
      Alert.alert('Lỗi', `Không thể phân công: ${e.message}`);
    }
  };

  const handleCheckIn = async () => {
    if (!user) return;
    try {
      await StaffService.checkIn(user.uid);
      Alert.alert('Thành công', 'Đã chấm công! Giờ công và lương đã được cập nhật.');
      fetchStaffData();
    } catch (e: any) {
      Alert.alert('Lỗi', `Chấm công thất bại: ${e.message}`);
    }
  };

  if (loading) {
    return (
      <View
        style={[styles.staffStyles.loadingContainer, styles.staffStyles.container]}>
        <ActivityIndicator size='large' color='#10B981' />
      </View>
    );
  }

  // [SỬA ĐỔI] Logic hiển thị nút Sửa đã được thay đổi.
  const renderStaffItem = ({ item }: { item: StaffUser }) => {
      const isTopLevelManager = currentUser?.managerId === null || currentUser?.role === 'quanlynhansu';

      // [THAY ĐỔI] Chỉ Tổng quản lý mới có quyền sửa và xóa người khác.
      return (
          <View style={styles.staffStyles.staffItem}>
            <View style={styles.staffStyles.staffInfo}>
              <Text style={styles.staffStyles.staffName}>
                {item.displayName} ({item.email})
              </Text>
              <Text style={styles.staffStyles.staffRole}>
                Vai trò: {getRoleDisplayName(item.role)}
              </Text>
              
              {/* Chỉ Total Manager mới thấy thông tin lương/giờ công */}
              {isTopLevelManager && (
                <View style={{ marginTop: 5 }}>
                  <Text style={styles.staffStyles.staffHours}>
                    Giờ công:{' '}
                    <Text style={styles.staffStyles.boldText}>
                      {item.monthlyHours ? item.monthlyHours : 0} giờ
                    </Text>
                  </Text>
                  <Text style={styles.staffStyles.staffHours}>
                    Lương (Dự kiến):{' '}
                    <Text style={styles.staffStyles.boldText}>
                      {item.monthlySalary
                        ? item.monthlySalary.toLocaleString('vi-VN')
                        : '0'}{' '}
                      VND
                    </Text>
                  </Text>
                </View>
              )}
            </View>
            
            {/* Action Buttons: Chỉ hiển thị nếu là Quản lý */}
            {isTopLevelManager && (
              <View style={styles.staffStyles.actionButtons}>
                {/* Nút Phân công Lịch làm việc: Hiển thị cho cả 2 cấp quản lý */}
                <TouchableOpacity onPress={() => handleAssignSchedule(item)}>
                  <Ionicons
                    name='calendar-outline'
                    size={24}
                    color='#3B82F6'
                    style={styles.staffStyles.buttonIcon}
                  />
                </TouchableOpacity>
                
                {/* Nút SỬA (Edit): Chỉ Total Manager mới có quyền */}
                <TouchableOpacity onPress={() => handleEditUser(item)}>
                  <Ionicons
                    name='create-outline'
                    size={24}
                    color='#3B82F6'
                    style={styles.staffStyles.buttonIcon}
                  />
                </TouchableOpacity>
                
                {/* Nút XÓA (Delete): Chỉ Total Manager mới có quyền */}
                {isTopLevelManager && (
                  <TouchableOpacity onPress={() => handleDeleteUser(item.uid)}>
                    <Ionicons
                      name='trash-outline'
                      size={24}
                      color='#EF4444'
                      style={styles.staffStyles.buttonIcon}
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
      );
  };
  // ... (Phần còn lại của component StaffScreen giữ nguyên) ...
  
  const isIndividualView = role === 'nhanvienkho' || role === 'nhanvienkd';
  const isManagerView = !isIndividualView;

  if (isIndividualView && data) {
    const selectedDaySchedule = selectedDay
      ? data.schedule[selectedDay.dateString]
      : null;
    const markedDates = Object.keys(data.schedule || {}).reduce(
      (acc: any, date) => {
        acc[date] = { marked: true, dotColor: '#3B82F6' };
        return acc;
      },
      {}
    );
    if (selectedDay) {
      markedDates[selectedDay.dateString] = {
        ...markedDates[selectedDay.dateString],
        selected: true,
        selectedColor: '#10B981',
      };
    }

    return (
      <View
        style={[styles.staffStyles.container, { paddingTop: insets.top + 20 }]}>
        <ScrollView style={styles.staffStyles.scrollContainer}>
          <Text style={styles.staffStyles.headerTitle}>Thông tin Cá nhân</Text>
          <View style={styles.staffStyles.workHoursCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Ionicons name='cash-outline' size={24} color='#10B981' />
              <Text style={styles.staffStyles.workHoursText}>
                Lương dự kiến (Tháng):{' '}
                <Text style={styles.staffStyles.boldText}>
                  {data.monthlySalary
                    ? data.monthlySalary.toLocaleString('vi-VN')
                    : '0'}{' '}
                  VND
                </Text>
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name='time-outline' size={24} color='#3B82F6' />
              <Text style={styles.staffStyles.workHoursText}>
                Giờ công (Tháng):{' '}
                <Text style={styles.staffStyles.boldText}>
                  {data.monthlyHours || 0}
                </Text>{' '}
                giờ
              </Text>
            </View>
            <TouchableOpacity onPress={handleCheckIn} style={styles.staffStyles.checkInButton}>
              <Text style={styles.staffStyles.checkInButtonText}>Chấm Công</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.staffStyles.scheduleTitle, { paddingLeft: 0 }]}>
            Lịch làm việc của tôi
          </Text>
          <Calendar
            onDayPress={(day) => setSelectedDay(day as CalendarDay)}
            markedDates={markedDates}
            style={styles.staffStyles.calendar}
          />
          <View style={styles.staffStyles.scheduleDetailsCard}>
            <Text style={styles.staffStyles.scheduleTitle}>
              Chi tiết lịch trình: {selectedDay?.dateString || today}
            </Text>
            {selectedDaySchedule ? (
              <View>
                <Text style={styles.staffStyles.detailText}>
                  Ca làm việc:{' '}
                  <Text style={styles.staffStyles.boldText}>
                    {selectedDaySchedule.shift}
                  </Text>
                </Text>
                <Text style={styles.staffStyles.detailText}>
                  Ghi chú:{' '}
                  <Text style={styles.staffStyles.boldText}>
                    {selectedDaySchedule.note}
                  </Text>
                </Text>
              </View>
            ) : (
              <Text style={styles.staffStyles.noScheduleText}>
                Không có lịch làm việc cho ngày này.
              </Text>
            )}
          </View>
          <View style={{ height: 30 }} />
        </ScrollView>
      </View>
    );
  }

  if (isManagerView && data) {
    const isTopLevelManager = currentUser?.managerId === null || currentUser?.role === 'quanlynhansu';
    return (
      <View
        style={[styles.staffStyles.container, { paddingTop: insets.top + 20 }]}>
        <View style={[styles.salesStyles.header, { marginBottom: 10 }]}>
          <Text style={styles.staffStyles.headerTitle}>
            {isTopLevelManager
              ? 'Quản lý Chuyên sâu'
              : 'Nhân viên dưới quyền'}
          </Text>
          {isTopLevelManager && (
            <Ionicons name='add-circle-outline' size={30} color='#10B981' />
          )}
        </View>

        {isTopLevelManager && (
          <View style={styles.staffStyles.workHoursCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.staffStyles.staffName}>
                Tổng Giờ Công Hệ Thống
              </Text>
              <Text style={styles.staffStyles.staffHours}>
                Tổng cộng:{' '}
                <Text style={styles.staffStyles.boldText}>
                  {(data as StaffUser[]).reduce((sum, u) => sum + u.monthlyHours, 0)}
                </Text>{' '}
                giờ
              </Text>
            </View>
          </View>
        )}

        <FlatList
          data={data}
          keyExtractor={(item) => item.uid}
          renderItem={renderStaffItem}
          style={styles.staffStyles.list}
          contentContainerStyle={{ paddingBottom: 20 }}
        />

        <StaffModal
          isVisible={isModalVisible}
          onClose={() => setModalVisible(false)}
          staffToEdit={staffToEdit}
          onSave={handleSaveUser}
          managers={managers} 
        />
        <AssignScheduleModal
          isVisible={isAssignModalVisible}
          onClose={() => setAssignModalVisible(false)}
          staffToAssign={staffToAssign}
          onAssign={handleAssignScheduleSave}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.staffStyles.container,
        { paddingTop: insets.top + 20, justifyContent: 'center', alignItems: 'center' },
      ]}>
      <Text style={styles.staffStyles.headerTitle}>Thông tin Cá nhân</Text>
      <View style={styles.staffStyles.infoCard}>
        <Text style={styles.staffStyles.infoText}>
          Bạn không có quyền truy cập chức năng này.
        </Text>
      </View>
    </View>
  );
}