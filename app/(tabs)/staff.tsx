// app/(tabs)/staff.tsx
import { Ionicons } from '@expo/vector-icons';
import { doc, DocumentData, getDoc } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react'; // Giữ lại React
import {
  ActivityIndicator,
  Alert,
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
import { COLORS, styles } from '../../styles/homeStyle';

import { CustomPicker } from '../../components/CustomPicker'; // Import từ file mới
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
    case 'quanlynhansu':
      return 'Quản lý Nhân sự';
    case null:
    case 'unassigned':
    default:
      return 'Chưa được gán';
  }
};

const ROLES = [
  { label: 'Quản lý Nhân sự', value: 'quanlynhansu' },
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
  managers: StaffUser[];
}

const StaffModal: React.FC<StaffModalProps> = ({ isVisible, onClose, staffToEdit, onSave, managers }) => {
  const { currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('unassigned');
  const [managerId, setManagerId] = useState<string | null>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [hourlyRate, setHourlyRate] = useState(0);
  const [isCalendarVisible, setCalendarVisible] = useState(false);
  const canEditSensitiveFields = currentUser?.role === 'quanlynhansu';

  useEffect(() => {
    if (staffToEdit) {
      setEmail(staffToEdit.email || '');
      setDisplayName(staffToEdit.displayName || '');
      setPhoneNumber(staffToEdit.phoneNumber || '');
      setDateOfBirth(staffToEdit.dateOfBirth || '');
      setRole(staffToEdit.role as UserRole || 'unassigned');
      setHourlyRate(staffToEdit.hourlyRate || 0);
      setManagerId(staffToEdit.managerId || null);
    } else {
      setEmail('');
      setDisplayName('');
      setRole('unassigned');
      setManagerId('new');
      setHourlyRate(0);
    }
  }, [staffToEdit, isVisible]);

  const formatDate = (isoString: string | undefined) => {
    if (!isoString) return 'Chưa có';
    try {
      return new Date(isoString).toLocaleDateString('vi-VN');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return isoString;
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền Tên hiển thị.');
      return;
    }
    const data: Partial<StaffUser> = {
      ...staffToEdit,
      displayName,
      phoneNumber,
      dateOfBirth,
      hourlyRate,
    };
    if (canEditSensitiveFields) {
      data.role = role;
      if (managerId === '') {
        data.managerId = null;
      } else {
        data.managerId = managerId;
      }
    }
    onSave(data);
    onClose();
  };

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <ScrollView contentContainerStyle={styles.salesStyles.modalOverlay}>
        <View style={styles.salesStyles.modalView}>
          <Text style={styles.salesStyles.modalTitle}>Sửa thông tin Nhân viên</Text>
          <View style={[styles.staffStyles.modalInputGroup, { backgroundColor: '#E5E7EB' }]}>
            <Ionicons name="mail-outline" size={20} color={COLORS.text_secondary} style={styles.staffStyles.modalInputIcon} />
            <TextInput style={styles.salesStyles.modalInput} value={email} editable={false} />
          </View>
          <View style={styles.staffStyles.modalInputGroup}>
            <Ionicons name="person-outline" size={20} color={COLORS.text_secondary} style={styles.staffStyles.modalInputIcon} />
            <TextInput style={styles.salesStyles.modalInput} placeholder="Tên hiển thị" value={displayName} onChangeText={setDisplayName} />
          </View>
          <View style={styles.staffStyles.modalInputGroup}>
            <Ionicons name="call-outline" size={20} color={COLORS.text_secondary} style={styles.staffStyles.modalInputIcon} />
            <TextInput style={styles.salesStyles.modalInput} placeholder="Số điện thoại" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
          </View>
          <View style={styles.staffStyles.modalInputGroup}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.text_secondary} style={styles.staffStyles.modalInputIcon} />
            <TouchableOpacity style={styles.staffStyles.pickerTouchable} onPress={() => setCalendarVisible(true)}>
              <Text style={dateOfBirth ? styles.staffStyles.pickerValue : styles.staffStyles.pickerPlaceholder}>
                {dateOfBirth ? new Date(dateOfBirth).toLocaleDateString('vi-VN') : 'Chọn ngày sinh'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.staffStyles.modalInputGroup, styles.staffStyles.readOnlyField]}>
            <Ionicons name="person-add-outline" size={20} color={COLORS.text_secondary} style={styles.staffStyles.modalInputIcon} />
            <Text style={styles.staffStyles.readOnlyText}>Ngày tạo: {formatDate(staffToEdit?.createdAt)}</Text>
          </View>
          <Modal animationType="fade" transparent={true} visible={isCalendarVisible} onRequestClose={() => setCalendarVisible(false)}>
            <TouchableOpacity style={styles.salesStyles.modalOverlay} onPress={() => setCalendarVisible(false)}>
              <View style={styles.salesStyles.modalView}>
                <Calendar onDayPress={(day) => { setDateOfBirth(day.dateString); setCalendarVisible(false); }} markedDates={{ [dateOfBirth]: { selected: true, selectedColor: COLORS.primary } }} />
              </View>
            </TouchableOpacity>
          </Modal>
          {canEditSensitiveFields && (
            <>
              <Text style={styles.staffStyles.modalLabel}>Lương theo giờ (VND/giờ):</Text>
              <View style={styles.staffStyles.modalInputGroup}>
                <Ionicons name="cash-outline" size={20} color={COLORS.text_secondary} style={styles.staffStyles.modalInputIcon} />
                <TextInput style={styles.salesStyles.modalInput} placeholder="Nhập mức lương theo giờ" value={hourlyRate.toString()} onChangeText={(text) => setHourlyRate(Number(text.replace(/[^0-9]/g, '')) || 0)} keyboardType="numeric" />
              </View>
            </>
          )}
          <Text style={styles.staffStyles.modalLabel}>Chọn vai trò:</Text>
          <CustomPicker iconName="briefcase-outline" placeholder="-- Chọn vai trò --" items={ROLES} selectedValue={role} onValueChange={(value: any) => setRole(value as UserRole)} enabled={canEditSensitiveFields} />
          {!canEditSensitiveFields && (<Text style={[styles.staffStyles.infoText, { fontSize: 12, marginTop: -10, marginBottom: 10 }]}> (Chỉ Quản lý Nhân sự được phép sửa vai trò)</Text>)}
          <Text style={styles.staffStyles.modalLabel}>Chọn phòng ban (Người quản lý):</Text>
          <CustomPicker iconName="business-outline" placeholder="Không có (Cấp cao nhất)" items={[{ label: 'Không có (Cấp cao nhất)', value: '' }, { label: 'Quản lý chung', value: 'quanly' }, ...managers.map(m => ({ label: `${m.displayName} (${getRoleDisplayName(m.role)})`, value: m.uid }))]} selectedValue={managerId} onValueChange={setManagerId} enabled={canEditSensitiveFields} />
          {!canEditSensitiveFields && (<Text style={[styles.staffStyles.infoText, { fontSize: 12, marginTop: -10, marginBottom: 10 }]}> (Chỉ Quản lý Nhân sự được phép phân công phòng ban)</Text>)}
          <View style={styles.salesStyles.modalButtons}>
            <TouchableOpacity style={[styles.staffStyles.modalButton, styles.staffStyles.modalButtonSecondary]} onPress={onClose}><Text style={styles.staffStyles.modalButtonText}>Hủy</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.staffStyles.modalButton, styles.staffStyles.modalButtonPrimary]} onPress={handleSave}><Text style={styles.staffStyles.modalButtonText}>Lưu</Text></TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
};

interface AssignScheduleModalProps {
  isVisible: boolean;
  onClose: () => void;
  staffToAssign: StaffUser | null;
  onAssign: (data: { uid: string; dates: string[]; shift: string; note: string }) => Promise<void>;
}

const AssignScheduleModal: React.FC<AssignScheduleModalProps> = ({ isVisible, onClose, staffToAssign, onAssign }) => {
  const [selectedDates, setSelectedDates] = useState<{ [key: string]: any }>({});
  const [existingMarkedDates, setExistingMarkedDates] = useState<{ [key: string]: any }>({});
  const [shift, setShift] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (staffToAssign) {
      const SHIFT_COLORS = { 'Nghỉ': '#F59E0B', 'Giờ hành chính': '#3B82F6', 'Ca sáng': '#EF4444', 'Ca chiều': '#10B981', 'Ca tối': '#8B5CF6' };
      const marked: { [key: string]: any } = {};
      if (staffToAssign.schedule) {
        for (const date in staffToAssign.schedule) {
          const scheduleItem = staffToAssign.schedule[date];
          const color = SHIFT_COLORS[scheduleItem.shift as keyof typeof SHIFT_COLORS] || COLORS.text_secondary;
          marked[date] = { marked: true, dotColor: color };
        }
      }
      setExistingMarkedDates(marked);
      setSelectedDates({});
      setShift('');
      setNote('');
      setCurrentMonth(new Date().toISOString().slice(0, 10));
    }
  }, [staffToAssign, isVisible]);

  const onDayPress = (day: CalendarDay) => {
    const dateString = day.dateString;
    const newSelectedDates = { ...selectedDates };
    if (newSelectedDates[dateString]) {
      delete newSelectedDates[dateString];
    } else {
      newSelectedDates[dateString] = { selected: true, selectedColor: COLORS.primary, selectedTextColor: 'white' };
    }
    const selectedKeys = Object.keys(newSelectedDates);
    if (selectedKeys.length === 1) {
      const singleDate = selectedKeys[0];
      const existingSchedule = staffToAssign?.schedule?.[singleDate];
      setShift(existingSchedule?.shift || '');
      setNote(existingSchedule?.note || '');
    } else {
      setShift('');
      setNote('');
    }
    setSelectedDates(newSelectedDates);
  };

  const selectWeekdays = (startDate: Date, endDate: Date) => {
    const newDates: { [key: string]: any } = {};
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const dateString = currentDate.toISOString().slice(0, 10);
        newDates[dateString] = { selected: true, selectedColor: COLORS.primary, selectedTextColor: 'white' };
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    setSelectedDates(newDates);
  };

  const handleSelectCurrentWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const startOfWeek = new Date(today.setDate(diff));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 4);
    selectWeekdays(startOfWeek, endOfWeek);
  };

  const handleSelectCurrentMonth = () => {
    const date = new Date(currentMonth);
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    selectWeekdays(firstDay, lastDay);
  };

  const handleAssign = async () => {
    const datesToAssign = Object.keys(selectedDates);
    if (!staffToAssign || datesToAssign.length === 0 || !shift) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất một ngày và ca làm việc.');
      return;
    }
    setLoading(true);
    try {
      await onAssign({ uid: staffToAssign.uid, dates: datesToAssign, shift, note });
      setSelectedDates({});
      setShift('');
      setNote('');
    } catch (e: any) {
      Alert.alert('Lỗi', e.message || 'Không thể phân công lịch làm việc.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={styles.salesStyles.modalOverlay}>
        <View style={[styles.salesStyles.modalView, { flex: 1, width: '95%', maxHeight: '90%' }]}>
          <Text style={[styles.salesStyles.modalTitle, { flexShrink: 1 }]}>Phân công cho {staffToAssign?.displayName}</Text>
          <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ paddingBottom: 20 }}>
            <Calendar onDayPress={onDayPress} markedDates={{ ...existingMarkedDates, ...selectedDates }} current={currentMonth} onMonthChange={(month) => setCurrentMonth(month.dateString)} style={{ width: '100%', marginBottom: 20 }} theme={{ arrowColor: COLORS.primary, todayTextColor: COLORS.primary }} minDate={new Date().toISOString().slice(0, 10)} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 20 }}>
              <TouchableOpacity style={styles.staffStyles.quickSelectButton} onPress={handleSelectCurrentWeek}><Text style={styles.staffStyles.quickSelectButtonText}>Chọn Tuần Này</Text></TouchableOpacity>
              <TouchableOpacity style={styles.staffStyles.quickSelectButton} onPress={handleSelectCurrentMonth}><Text style={styles.staffStyles.quickSelectButtonText}>Chọn Tháng Này</Text></TouchableOpacity>
            </View>
            <Text style={styles.staffStyles.modalLabel}>Chọn ca làm việc:</Text>
            <CustomPicker iconName="time-outline" placeholder="-- Chọn ca làm việc --" items={[{ label: 'Giờ hành chính (8h-17h)', value: 'Giờ hành chính' }, { label: 'Ca sáng (8h-12h)', value: 'Ca sáng' }, { label: 'Ca chiều (13h-17h)', value: 'Ca chiều' }, { label: 'Ca tối (18h-22h)', value: 'Ca tối' }, { label: 'Nghỉ', value: 'Nghỉ' }]} selectedValue={shift} onValueChange={setShift} enabled={true} />
            <TextInput style={styles.salesStyles.modalInput} placeholder='Ghi chú (nếu có)' value={note} onChangeText={setNote} />
          </ScrollView>
          <View style={[styles.salesStyles.modalButtons, { flexShrink: 1 }]}>
            <TouchableOpacity style={[styles.staffStyles.modalButton, styles.staffStyles.modalButtonSecondary]} onPress={onClose}><Text style={styles.staffStyles.modalButtonText}>Đóng</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.staffStyles.modalButton, styles.staffStyles.modalButtonPrimary]} onPress={handleAssign} disabled={loading}><Text style={styles.staffStyles.modalButtonText}>{loading ? 'Đang lưu...' : 'Phân công'}</Text></TouchableOpacity>
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
  const [isModalVisible, setModalVisible] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<StaffUser | null>(null);
  const [isAssignModalVisible, setAssignModalVisible] = useState(false);
  const [managers, setManagers] = useState<StaffUser[]>([]);
  const [staffToAssign, setStaffToAssign] = useState<StaffUser | null>(null);
  const role = currentUser?.role;

  const isIndividualView = role === 'nhanvienkho' || role === 'nhanvienkd';
  const isManagerView = role === 'quanlynhansu' || role === 'truongphong' || role === 'thukho';

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
        }
      } else {
        const staffList = await StaffService.getStaffList(user.uid, currentUser?.role || 'unassigned', currentUser?.managerId);
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
  }, [user, role, currentUser]);

  useEffect(() => {
    fetchStaffData();
  }, [fetchStaffData]);

  useEffect(() => {
    if (isAssignModalVisible && staffToAssign && Array.isArray(data)) {
      const updatedStaff = (data as StaffUser[]).find(user => user.uid === staffToAssign.uid);
      if (updatedStaff) {
        setStaffToAssign(updatedStaff);
      }
    }
  }, [data, isAssignModalVisible, staffToAssign]);

  const handleEditUser = (staff: StaffUser) => {
    const isTopLevel = currentUser?.role === 'quanlynhansu';
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
    try {
      const { uid, ...updateData } = data;
      if (staffToEdit) {
        await StaffService.updateStaff(staffToEdit.uid, updateData);
        Alert.alert('Thành công', 'Đã cập nhật thông tin nhân viên.');
      }
      fetchStaffData();
    } catch (e: any) {
      Alert.alert('Lỗi', `Không thể lưu: ${e.message}`);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    Alert.alert('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa nhân viên này không?', [{ text: 'Hủy' }, { text: 'Xóa', onPress: async () => {
      try {
        await StaffService.deleteStaff(uid);
        fetchStaffData();
        Alert.alert('Thành công', 'Nhân viên đã bị xóa.');
      } catch (e: any) {
        Alert.alert('Lỗi', `Không thể xóa: ${e.message}`);
      }
    }}]);
  };

  const handleAssignScheduleSave = async (data: { uid: string; dates: string[]; shift: string; note: string; }) => {
    try {
      await StaffService.assignBulkSchedule(data.uid, data.dates, data.shift, data.note);
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
      <View style={[styles.staffStyles.loadingContainer, styles.staffStyles.container]}>
        <ActivityIndicator size='large' color='#10B981' />
      </View>
    );
  }

  const renderStaffItem = ({ item }: { item: StaffUser }) => {
    const isTopLevelManager = currentUser?.role === 'quanlynhansu';
    const isMidLevelManager = currentUser?.role === 'truongphong' || currentUser?.role === 'thukho';    
    // Điều kiện để có thể chỉnh sửa
    const canEdit = isTopLevelManager || (isMidLevelManager && (item.managerId === currentUser?.uid || item.role === 'unassigned'));    
    // Điều kiện để có thể xóa
    const canDelete = isTopLevelManager; 

    return (
      <View style={styles.staffStyles.baseCard}>
        <View style={styles.staffStyles.cardHeader}>
          <View style={styles.staffStyles.staffAvatar}><Text style={styles.staffStyles.staffAvatarText}>{item.displayName?.charAt(0).toUpperCase() || '?'}</Text></View>
          <View style={styles.staffStyles.staffInfo}>
            <Text style={styles.staffStyles.staffName}>{item.displayName}</Text>
            <Text style={styles.staffStyles.staffRole}>{getRoleDisplayName(item.role)}</Text>
          </View>
        </View>
        {isTopLevelManager && (
          <View style={styles.staffStyles.staffDetails}>
            <Text style={styles.staffStyles.staffHours}><Ionicons name="time-outline" size={14} color={styles.staffStyles.staffHours.color} />{' '}Giờ công: <Text style={styles.staffStyles.boldText}>{item.monthlyHours || 0} giờ</Text></Text>
            <Text style={styles.staffStyles.staffHours}><Ionicons name="cash-outline" size={14} color={styles.staffStyles.staffHours.color} />{' '}Lương ước tính: <Text style={styles.staffStyles.boldText}>{((item.monthlyHours || 0) * (item.hourlyRate || 0)).toLocaleString('vi-VN')} VND</Text></Text>
          </View>
        )}
        {(isTopLevelManager || isMidLevelManager) && (
          <View style={styles.staffStyles.actionButtons}>
            <TouchableOpacity onPress={() => handleAssignSchedule(item)} style={styles.staffStyles.buttonIcon}><View><Ionicons name='calendar' size={24} color={COLORS.secondary} /></View></TouchableOpacity>
            {canEdit && (<TouchableOpacity onPress={() => handleEditUser(item)} style={styles.staffStyles.buttonIcon}><View><Ionicons name='create' size={24} color={COLORS.accent} /></View></TouchableOpacity>)}
            {canDelete && (<TouchableOpacity onPress={() => handleDeleteUser(item.uid)} style={styles.staffStyles.buttonIcon}><View><Ionicons name='trash' size={24} color={COLORS.error} /></View></TouchableOpacity>)}
          </View>
        )}
      </View>
    );
  };

  const IndividualScheduleView = () => {
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
    const [currentWeekStart, setCurrentWeekStart] = useState(() => { // Khởi tạo tuần hiện tại
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Đặt về thứ 2 đầu tuần
      const startOfWeek = new Date(today.setDate(diff));
      startOfWeek.setHours(0, 0, 0, 0); // Đảm bảo là đầu ngày
      return startOfWeek;
    });
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date()); // State mới để theo dõi tháng đang xem

    const getWeekDays = (date: Date) => {
      const startOfWeek = new Date(date);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);
        return d;
      });
    };

    const weekDays = getWeekDays(currentWeekStart);
    const selectedDayString = selectedDate.toISOString().slice(0, 10);
    const selectedDaySchedule = data.schedule?.[selectedDayString];

    const SHIFT_COLORS = { 'Nghỉ': '#F59E0B', 'Giờ hành chính': '#3B82F6', 'Ca sáng': '#EF4444', 'Ca chiều': '#10B981', 'Ca tối': '#8B5CF6' };
    const markedDates = Object.entries(data.schedule || {}).reduce((acc: any, [date, details]) => {
      const shift = (details as { shift: string }).shift;
      acc[date] = { marked: true, dotColor: SHIFT_COLORS[shift as keyof typeof SHIFT_COLORS] || COLORS.text_secondary };
      return acc;
    }, {});
    markedDates[selectedDayString] = { ...markedDates[selectedDayString], selected: true, selectedColor: COLORS.primary };

    const handlePreviousWeek = () => {
      const newWeekStart = new Date(currentWeekStart);
      newWeekStart.setDate(newWeekStart.getDate() - 7);
      setCurrentWeekStart(newWeekStart);
      setSelectedDate(newWeekStart); // Chọn ngày đầu tuần mới
    };

    const handleNextWeek = () => {
      const newWeekStart = new Date(currentWeekStart);
      newWeekStart.setDate(newWeekStart.getDate() + 7);
      setCurrentWeekStart(newWeekStart);
      setSelectedDate(newWeekStart); // Chọn ngày đầu tuần mới
    };

    const handleGoToToday = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setCurrentWeekStart(today);
      setSelectedDate(today);
    };

    const handleDateSelect = (day: CalendarDay) => {
      const newSelectedDate = new Date(day.dateString);
      const dayOfWeek = newSelectedDate.getDay();
      const diff = newSelectedDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const newWeekStart = new Date(newSelectedDate.setDate(diff));
      newWeekStart.setHours(0, 0, 0, 0);
      setCurrentWeekStart(newWeekStart);
      setSelectedDate(new Date(day.dateString)); // Cập nhật ngày được chọn
      setDatePickerVisible(false);
    }

    const scheduleArray = Object.entries(data.schedule || {})
      .map(([date, details]) => ({ date, ...(details as { shift: string; note: string }) }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sửa: Sắp xếp từ mới nhất đến cũ nhất

    // Lọc danh sách ca làm theo tháng đang được hiển thị
    const filteredMonthSchedule = scheduleArray.filter(item => {
      const itemDate = new Date(item.date);
      return (
        itemDate.getFullYear() === currentMonth.getFullYear() && itemDate.getMonth() === currentMonth.getMonth()
      );
    });

    const todayString = new Date().toISOString().slice(0, 10);
    const todaySchedule = data.schedule[todayString];
    const canCheckInToday = todaySchedule && todaySchedule.shift !== 'Nghỉ';

    return (
      <ScrollView style={styles.staffStyles.scrollContainer} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <Text style={styles.staffStyles.headerTitle}>Thông tin Cá nhân</Text>
        <View style={styles.staffStyles.summaryCard}>
          <View style={styles.staffStyles.summaryRow}><Ionicons name='cash-outline' size={24} color={COLORS.primary} /><Text style={styles.staffStyles.summaryText}>Lương dự kiến (Tháng): <Text style={styles.staffStyles.boldText}>{data.monthlySalary ? data.monthlySalary.toLocaleString('vi-VN') : '0'} VND</Text></Text></View>
          <View style={styles.staffStyles.summaryRow}><Ionicons name='time-outline' size={24} color={COLORS.secondary} /><Text style={styles.staffStyles.summaryText}>Giờ công (Tháng): <Text style={styles.staffStyles.boldText}>{data.monthlyHours || 0}</Text> giờ</Text></View>
          <TouchableOpacity onPress={handleCheckIn} style={[styles.staffStyles.checkInButton, !canCheckInToday && { backgroundColor: COLORS.text_placeholder }]} disabled={!canCheckInToday}><Text style={styles.staffStyles.checkInButtonText}>{canCheckInToday ? 'Chấm Công Hôm Nay' : 'Không có ca làm'}</Text></TouchableOpacity>
        </View>
        <Text style={styles.staffStyles.headerTitle}>Lịch làm việc của tôi</Text>
        <View style={styles.staffStyles.viewModeContainer}>
          <TouchableOpacity onPress={() => setViewMode('week')} style={[styles.staffStyles.viewModeButton, viewMode === 'week' && styles.staffStyles.viewModeButtonActive]}><Text style={[styles.staffStyles.viewModeText, viewMode === 'week' && styles.staffStyles.viewModeTextActive]}>Xem theo Tuần</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setViewMode('month')} style={[styles.staffStyles.viewModeButton, viewMode === 'month' && styles.staffStyles.viewModeButtonActive]}><Text style={[styles.staffStyles.viewModeText, viewMode === 'month' && styles.staffStyles.viewModeTextActive]}>Xem theo Tháng</Text></TouchableOpacity>
        </View>
        {viewMode === 'week' && (
          // [SỬA] Gom toàn bộ phần xem tuần vào một thẻ lớn
          <View style={styles.staffStyles.scheduleWeekViewCard}>
            <View style={styles.staffStyles.dayNavigationContainer}>
                <TouchableOpacity onPress={handlePreviousWeek} style={styles.staffStyles.dayNavigationButton}>
                  <Ionicons name="chevron-back-outline" size={24} color={COLORS.text_primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setDatePickerVisible(true)}>
                  <Text style={styles.staffStyles.dayNavigationText}>{currentWeekStart.toLocaleDateString('vi-VN')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleNextWeek} style={styles.staffStyles.dayNavigationButton}>
                  <Ionicons name="chevron-forward-outline" size={24} color={COLORS.text_primary} />
                </TouchableOpacity>
            </View>
            <View style={styles.staffStyles.todayButtonContainer}>
              <TouchableOpacity onPress={handleGoToToday} style={styles.staffStyles.todayButton}>
                  <Text style={styles.staffStyles.todayButtonText}>Về Hôm Nay</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.staffStyles.weekContainer}>
              {weekDays.map((day, index) => {
                const dayString = day.toISOString().slice(0, 10);
                const isSelected = dayString === selectedDayString;
                const schedule = data.schedule?.[dayString];
                const isToday = dayString === todayString;
                return (
                  <TouchableOpacity key={index} style={[styles.staffStyles.weekDayBox, isSelected && styles.staffStyles.weekDayBoxSelected, isToday && styles.staffStyles.weekDayBoxToday]} onPress={() => setSelectedDate(day)}>
                    <Text style={[styles.staffStyles.weekDayText, isSelected && styles.staffStyles.weekDayTextSelected]}>{['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][day.getDay()]}</Text>
                    <Text style={[styles.staffStyles.weekDateText, isSelected && styles.staffStyles.weekDateTextSelected]}>{day.getDate()}</Text>
                    {isToday && !isSelected && <View style={styles.staffStyles.todayIndicator} />}
                    {schedule && <View style={[styles.staffStyles.scheduleDot, { backgroundColor: SHIFT_COLORS[schedule.shift as keyof typeof SHIFT_COLORS] || COLORS.text_secondary }]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.staffStyles.scheduleDetailsCard}>
              <Text style={styles.staffStyles.scheduleTitle}>
                <Ionicons name="information-circle-outline" size={20} color={COLORS.text_primary} style={{ marginRight: 8 }} />
                Chi tiết ngày: {selectedDate.toLocaleDateString('vi-VN')}
              </Text>
              {selectedDaySchedule ? (
                <View>
                  <View style={styles.staffStyles.scheduleDetailRow}>
                    <Ionicons name="time-outline" size={20} color={COLORS.secondary} />
                    <Text style={styles.staffStyles.detailText}>Ca làm việc: <Text style={styles.staffStyles.boldText}>{selectedDaySchedule.shift}</Text></Text>
                  </View>
                  <View style={styles.staffStyles.scheduleDetailRow}>
                    <Ionicons name="document-text-outline" size={20} color={COLORS.accent} />
                    <Text style={styles.staffStyles.detailText}>Ghi chú: <Text style={styles.staffStyles.boldText}>{selectedDaySchedule.note || 'Không có'}</Text></Text>
                  </View>
                </View>
              ) : (<Text style={styles.staffStyles.noScheduleText}>Không có lịch làm việc cho ngày này.</Text>)}
            </View>
          </View>
        )}
        {viewMode === 'month' && (
          <>
            <Calendar
              onDayPress={(day) => setSelectedDate(new Date(day.dateString))}
              markedDates={markedDates}
              style={styles.staffStyles.calendar}
              minDate={new Date().toISOString().slice(0, 10)}
              onMonthChange={(month) => setCurrentMonth(new Date(month.dateString))} // Cập nhật tháng đang xem
            />
            <Text style={[styles.staffStyles.scheduleTitle, { marginTop: 10 }]}>Ca làm trong tháng {currentMonth.getMonth() + 1}/{currentMonth.getFullYear()}</Text>
            {filteredMonthSchedule.length > 0 ? filteredMonthSchedule.map(item => (
              <View key={item.date} style={[styles.staffStyles.scheduleDetailsCard, { marginBottom: 10, padding: 15 }]}>
                <Text style={[styles.staffStyles.scheduleTitle, { fontSize: 16, marginBottom: 5 }]}>Ngày: {new Date(item.date).toLocaleDateString('vi-VN')}</Text>
                <Text style={styles.staffStyles.detailText}>Ca: <Text style={styles.staffStyles.boldText}>{item.shift}</Text></Text>
                {item.note && <Text style={styles.staffStyles.detailText}>Ghi chú: <Text style={styles.staffStyles.boldText}>{item.note}</Text></Text>}
              </View>
            )) : (<Text style={styles.staffStyles.noScheduleText}>Bạn chưa có lịch làm việc nào.</Text>)}
          </>
        )}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isDatePickerVisible}
          onRequestClose={() => setDatePickerVisible(false)}
        >
          <TouchableOpacity style={styles.salesStyles.modalOverlay} onPress={() => setDatePickerVisible(false)}>
            <View style={[styles.salesStyles.modalView, { width: '95%' }]}>
              <Calendar
                onDayPress={handleDateSelect}
                markedDates={{ [selectedDayString]: { selected: true, selectedColor: COLORS.primary } }}
              />
            </View>
          </TouchableOpacity>
        </Modal>
        {/* Legend */}
        <View style={styles.staffStyles.legendContainer}>
          {Object.entries(SHIFT_COLORS).map(([shiftName, color]) => (
            <View key={shiftName} style={styles.staffStyles.legendItem}>
              <View style={[styles.staffStyles.colorDot, { backgroundColor: color }]} />
              <Text style={styles.staffStyles.legendText}>{shiftName}</Text>
            </View>
          ))}
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>
    );
  };

  if (isIndividualView && data) {
    return (
      <View style={[styles.staffStyles.container, { paddingTop: insets.top + 20 }]}>
        <IndividualScheduleView />
      </View>
    );
  }

  if (isManagerView && data) {
    const isTopLevelManager = currentUser?.role === 'quanlynhansu';
    return (
      <View style={[styles.staffStyles.container, { paddingTop: insets.top + 20, paddingHorizontal: 0 }]}>
        <View style={[styles.salesStyles.header, { marginBottom: 10 }]}>
          <Text style={styles.staffStyles.headerTitle}>{isTopLevelManager ? 'Quản lý Nhân sự' : 'Nhân viên'}</Text>
          <View style={{ width: 30 }} />
        </View>
        {isTopLevelManager && (
          <View style={styles.staffStyles.summaryCard}>
            <View style={styles.staffStyles.summaryRow}>
              <Ionicons name="business-outline" size={24} color={COLORS.primary} />
              <Text style={styles.staffStyles.summaryText}>Tổng Giờ Công: <Text style={styles.staffStyles.boldText}>{(data as StaffUser[]).reduce((sum, u) => sum + u.monthlyHours, 0)}</Text> giờ</Text>
            </View>
            <View style={styles.staffStyles.summaryRow}>
              <Ionicons name="wallet-outline" size={24} color={COLORS.accent} />
              <Text style={styles.staffStyles.summaryText}>Tổng Lương (Tháng): <Text style={styles.staffStyles.boldText}>{(data as StaffUser[]).reduce((sum, u) => sum + (u.monthlySalary || 0), 0).toLocaleString('vi-VN')}</Text> VND</Text>
            </View>
          </View>
        )}
        <FlatList data={data} keyExtractor={(item) => item.uid} renderItem={renderStaffItem} style={styles.staffStyles.list} contentContainerStyle={{ paddingBottom: 20 }} />
        <StaffModal isVisible={isModalVisible} onClose={() => setModalVisible(false)} staffToEdit={staffToEdit} onSave={handleSaveUser} managers={managers} />
        <AssignScheduleModal isVisible={isAssignModalVisible} onClose={() => setAssignModalVisible(false)} staffToAssign={staffToAssign} onAssign={handleAssignScheduleSave} />
      </View>
    );
  }

  return (
    <View style={[styles.staffStyles.container, { paddingTop: insets.top + 20, justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={styles.staffStyles.headerTitle}>Thông tin Cá nhân</Text>
      <View style={styles.staffStyles.infoCard}>
        <Text style={styles.staffStyles.infoText}>Bạn không có quyền truy cập chức năng này.</Text>
      </View>
    </View>
  );
}
