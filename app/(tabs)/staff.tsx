import { Ionicons } from '@expo/vector-icons';
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
import { useAuth } from '../../context/AuthContext';
import { StaffService, StaffUser } from '../../services/StaffService';
import { styles } from '../../styles/homeStyle';

interface CalendarDay {
  dateString: string;
  day: number;
  month: number;
  year: number;
}

interface UserSchedule {
  monthlyHours: number;
  monthlySalary: number;
  schedule: { [date: string]: { shift: string; note: string } };
}

const getRoleDisplayName = (userRole: string) => {
  switch (userRole) {
    case 'thukho': return 'Thủ kho';
    case 'truongphong': return 'Trưởng phòng KD/QA';
    case 'nhanvienkho': return 'Nhân viên Kho';
    case 'nhanvienkd': return 'Nhân viên Kinh doanh';
    case 'quanlynansu': return 'Quản lý Nhân sự';
    default: return 'Chưa được gán';
  }
};

interface StaffModalProps {
    isVisible: boolean;
    onClose: () => void;
    staffToEdit: StaffUser | null;
    onSave: (data: StaffUser) => void;
}

const StaffModal: React.FC<StaffModalProps> = ({ isVisible, onClose, staffToEdit, onSave }) => {
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [role, setRole] = useState('');
    
    useEffect(() => {
        if (staffToEdit) {
            setEmail(staffToEdit.email);
            setDisplayName(staffToEdit.displayName);
            setRole(staffToEdit.role);
        } else {
            setEmail(''); setDisplayName(''); setRole('');
        }
    }, [staffToEdit]);
    
    const handleSave = async () => {
        if (!email || !displayName || !role) {
            Alert.alert('Lỗi', 'Vui lòng điền đủ thông tin.');
            return;
        }
        
        const data = { email, displayName, role, ...staffToEdit };
        onSave(data as StaffUser);
        onClose();
    };
    
    return (
        <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
            <View style={styles.salesStyles.modalOverlay}>
                <View style={styles.salesStyles.modalView}>
                    <Text style={styles.salesStyles.modalTitle}>{staffToEdit ? 'Sửa Nhân viên' : 'Thêm Nhân viên'}</Text>
                    <TextInput style={styles.salesStyles.modalInput} placeholder="Email" value={email} onChangeText={setEmail} editable={!staffToEdit} />
                    <TextInput style={styles.salesStyles.modalInput} placeholder="Tên hiển thị" value={displayName} onChangeText={setDisplayName} />
                    <TextInput style={styles.salesStyles.modalInput} placeholder="Vai trò" value={role} onChangeText={setRole} />
                    <View style={styles.salesStyles.modalButtons}>
                        <Button title="Hủy" onPress={onClose} color="red" />
                        <Button title="Lưu" onPress={handleSave} color="green" />
                    </View>
                </View>
            </View>
        </Modal>
    );
};


export default function StaffScreen() {
  const insets = useSafeAreaInsets();
  const { role, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  
  const [isModalVisible, setModalVisible] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<StaffUser | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  
  const fetchStaffData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    
    try {
      setLoading(true);
      
      let users: StaffUser[] = [];

      if (role === 'nhanvienkho' || role === 'nhanvienkd') {
        const userDocRef = doc(db, 'user', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data() as DocumentData;
          setData({
            monthlyHours: userData.monthlyHours || 160, 
            monthlySalary: userData.monthlySalary || 8000000, 
            schedule: userData.schedule || {},
          });
          setSelectedDay({ 
            dateString: today, 
            day: new Date().getDate(), 
            month: new Date().getMonth() + 1, 
            year: new Date().getFullYear() 
          } as CalendarDay);
        }
      } else if (role === 'quanlynansu' || role === 'truongphong' || role === 'thukho') {
        const staffList = await StaffService.getStaffList(role!, user.uid);
        setData(staffList.filter(u => u.uid !== user.uid));
      }
    } catch (e) {
      console.error('Lỗi khi tải dữ liệu nhân sự:', e);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  }, [role, user]);

  useEffect(() => {
    fetchStaffData();
  }, [fetchStaffData]);

  const handleEditUser = (staff: StaffUser) => {
      setStaffToEdit(staff);
      setModalVisible(true);
  };

  const handleAddUser = () => {
    setStaffToEdit(null);
    setModalVisible(true);
  };
  
  const handleSaveUser = async (data: StaffUser) => {
    try {
        if (staffToEdit) {
          await StaffService.updateStaff(staffToEdit.uid, data);
          Alert.alert('Thành công', 'Đã cập nhật thông tin nhân viên.');
        } else {
          await StaffService.addStaff(data.email, '123456', data.displayName, data.role, data.managerId);
          Alert.alert('Thành công', 'Đã thêm nhân viên mới (Mật khẩu mặc định: 123456).');
        }
        fetchStaffData();
    } catch (e: any) {
        Alert.alert('Lỗi', `Không thể lưu: ${e.message}`);
    }
  };
  
  const handleDeleteUser = async (uid: string) => {
    Alert.alert('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa nhân viên này không?', [
      { text: 'Hủy' },
      { text: 'Xóa', onPress: async () => {
        try {
            await StaffService.deleteStaff(uid);
            fetchStaffData();
            Alert.alert('Thành công', 'Nhân viên đã bị xóa.');
        } catch (e: any) {
            Alert.alert('Lỗi', `Không thể xóa: ${e.message}`);
        }
      }}
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.staffStyles.loadingContainer, styles.staffStyles.container]}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  const renderStaffItem = ({ item }: { item: StaffUser }) => (
    <View style={styles.staffStyles.staffItem}>
      <View style={styles.staffStyles.staffInfo}>
        <Text style={styles.staffStyles.staffName}>{item.displayName} ({item.email})</Text>
        <Text style={styles.staffStyles.staffRole}>Vai trò: {getRoleDisplayName(item.role)}</Text>
        {role === 'quanlynansu' && (
            <View style={{marginTop: 5}}>
                <Text style={styles.staffStyles.staffHours}>
                    Giờ công: <Text style={styles.staffStyles.boldText}>{item.monthlyHours} giờ</Text>
                </Text>
                <Text style={styles.staffStyles.staffHours}>
                    Lương (Dự kiến): <Text style={styles.staffStyles.boldText}>{item.monthlySalary.toLocaleString('vi-VN')} VND</Text>
                </Text>
            </View>
        )}
      </View>
      {role === 'quanlynansu' && (
        <View style={styles.staffStyles.actionButtons}>
          <TouchableOpacity onPress={() => handleEditUser(item)}>
            <Ionicons name="create-outline" size={24} color="#3B82F6" style={styles.staffStyles.buttonIcon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteUser(item.uid)}>
            <Ionicons name="trash-outline" size={24} color="#EF4444" style={styles.staffStyles.buttonIcon} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
  
  const isIndividualView = role === 'nhanvienkho' || role === 'nhanvienkd';
  const isManagerView = role === 'quanlynansu' || role === 'truongphong' || role === 'thukho';


  if (isIndividualView && data) {
    const selectedDaySchedule = selectedDay ? data.schedule[selectedDay.dateString] : null;
    const markedDates = Object.keys(data.schedule || {}).reduce((acc: any, date) => {
        acc[date] = { marked: true, dotColor: '#3B82F6' };
        return acc;
    }, {});
    if (selectedDay) {
        markedDates[selectedDay.dateString] = {
            ...markedDates[selectedDay.dateString],
            selected: true,
            selectedColor: '#10B981',
        };
    }
    
    return (
      <View style={[styles.staffStyles.container, { paddingTop: insets.top + 20 }]}>
        <ScrollView style={styles.staffStyles.scrollContainer}>
          <Text style={styles.staffStyles.headerTitle}>Thông tin Cá nhân</Text>
          <View style={styles.staffStyles.workHoursCard}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 10}}>
                <Ionicons name="cash-outline" size={24} color="#10B981" />
                <Text style={styles.staffStyles.workHoursText}>
                    Lương dự kiến (Tháng): <Text style={styles.staffStyles.boldText}>
                        {data.monthlySalary ? data.monthlySalary.toLocaleString('vi-VN') : '0'} VND
                    </Text>
                </Text>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Ionicons name="time-outline" size={24} color="#3B82F6" />
                <Text style={styles.staffStyles.workHoursText}>
                    Giờ công (Tháng): <Text style={styles.staffStyles.boldText}>{data.monthlyHours || 0}</Text> giờ
                </Text>
            </View>
          </View>
          <Text style={[styles.staffStyles.scheduleTitle, {paddingLeft: 0}]}>Lịch làm việc của tôi</Text>
          <Calendar
            onDayPress={(day) => setSelectedDay(day as CalendarDay)}
            markedDates={markedDates}
            style={styles.staffStyles.calendar}
          />
          <View style={styles.staffStyles.scheduleDetailsCard}>
            <Text style={styles.staffStyles.scheduleTitle}>Chi tiết lịch trình: {selectedDay?.dateString || today}</Text>
            {selectedDaySchedule ? (
              <View>
                <Text style={styles.staffStyles.detailText}>Ca làm việc: <Text style={styles.staffStyles.boldText}>{selectedDaySchedule.shift}</Text></Text>
                <Text style={styles.staffStyles.detailText}>Ghi chú: <Text style={styles.staffStyles.boldText}>{selectedDaySchedule.note}</Text></Text>
              </View>
            ) : (
              <Text style={styles.staffStyles.noScheduleText}>Không có lịch làm việc cho ngày này.</Text>
            )}
          </View>
          <View style={{height: 30}} />
        </ScrollView>
      </View>
    );
  }

  
  if (isManagerView && data) {
      return (
      <View style={[styles.staffStyles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.salesStyles.header}>
            <Text style={styles.staffStyles.headerTitle}>{role === 'quanlynansu' ? 'Quản lý Chuyên sâu' : 'Nhân viên dưới quyền'}</Text>
            {role === 'quanlynansu' && (
                <TouchableOpacity onPress={handleAddUser} style={styles.salesStyles.addButton}>
                    <Ionicons name="add-circle-outline" size={30} color="#10B981" />
                </TouchableOpacity>
            )}
        </View>
        
        {role === 'quanlynansu' && (
             <View style={styles.staffStyles.workHoursCard}>
                <View style={{flex: 1}}>
                    <Text style={styles.staffStyles.staffName}>Tổng Giờ Công Hệ Thống</Text>
                    <Text style={styles.staffStyles.staffHours}>
                        Tổng cộng: <Text style={styles.staffStyles.boldText}>{(data as StaffUser[]).reduce((sum, u) => sum + u.monthlyHours, 0)}</Text> giờ
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
        />
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