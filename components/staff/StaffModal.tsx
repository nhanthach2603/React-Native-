/* eslint-disable @typescript-eslint/no-unused-vars */
// components/staff/StaffModal.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useAuth, UserRole } from '../../context/AuthContext';
import { ChatService } from '../../services/ChatService'; // [THÊM] Import ChatService
import { StaffUser } from '../../services/StaffService';
import { COLORS, styles } from '../../styles/homeStyle';
import { CustomPicker } from '../CustomPicker';

const getRoleDisplayName = (userRole: UserRole) => {
  switch (userRole) {
    case 'thukho': return 'Thủ kho';
    case 'truongphong': return 'Trưởng phòng KD/QA';
    case 'nhanvienkho': return 'Nhân viên Kho';
    case 'nhanvienkd': return 'Nhân viên Kinh doanh';
    case 'quanlynhansu': return 'Quản lý Nhân sự';
    case null:
    case 'unassigned':
    default: return 'Chưa được gán';
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
  onResetPassword: (email: string) => void;
}

export const StaffModal: React.FC<StaffModalProps> = ({ isVisible, onClose, staffToEdit, onSave, managers, onResetPassword }) => {
  const { currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('unassigned');
  const [managerId, setManagerId] = useState<string | null>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [hourlyRate, setHourlyRate] = useState(0);
  const [address, setAddress] = useState('');
  const [isCalendarVisible, setCalendarVisible] = useState(false);
  // [SỬA] Cho phép cả 'tongquanly' chỉnh sửa các trường quan trọng
  const canEditSensitiveFields = ['quanlynhansu', 'tongquanly'].includes(currentUser?.role || '');

  useEffect(() => {
    if (staffToEdit) {
      setEmail(staffToEdit.email || '');
      setDisplayName(staffToEdit.displayName || '');
      setPhoneNumber(staffToEdit.phoneNumber || '');
      setDateOfBirth(staffToEdit.dateOfBirth || '');
      setRole(staffToEdit.role as UserRole || 'unassigned');
      setHourlyRate(staffToEdit.hourlyRate || 0);
      setAddress(staffToEdit.address || '');
      setManagerId(staffToEdit.managerId || null);
    } else {
      setEmail('');
      setDisplayName('');
      setPhoneNumber('');
      setDateOfBirth('');
      setRole('unassigned');
      setManagerId(null);
      setHourlyRate(0);
      setAddress('');
    }
  }, [staffToEdit, isVisible]);

  const formatDate = (isoString: string | undefined) => {
    if (!isoString) return 'Chưa có';
    try {
      return new Date(isoString).toLocaleDateString('vi-VN');
     
    } catch (e) {
      return isoString;
    }
  };

  const handleSave = async () => { // Đã là async, rất tốt
    if (!displayName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền Tên hiển thị.');
      return;
    }
    try {
      const data: Partial<StaffUser> = {
        ...staffToEdit,
        displayName,
        phoneNumber,
        dateOfBirth,
        hourlyRate,
        address,
      };
  
      if (!staffToEdit) {
        data.email = email; // Chỉ thêm email khi tạo mới
      }
  
      if (canEditSensitiveFields) {
        data.role = role;
        // [SỬA LỖI] Đảm bảo managerId là null nếu không có lựa chọn
        data.managerId = managerId || null;
      }
      
      // [SỬA LỖI] Thêm await và xử lý lỗi.
      // Chờ cho việc lưu thông tin người dùng hoàn tất.
      await onSave(data);
  
      // Chỉ thực hiện các tác vụ phụ (cập nhật chat) KHI VÀ CHỈ KHI onSave đã thành công.
      if (staffToEdit && canEditSensitiveFields) {
        const oldManagerId = staffToEdit.managerId;
        const newManagerId = data.managerId;
        const newRole = data.role;
        const oldRole = staffToEdit.role;
        const isPromotedToManager = ['truongphong', 'thukho'].includes(newRole || '') && !['truongphong', 'thukho'].includes(oldRole || '');
  
        if (isPromotedToManager) {
          await ChatService.createDepartmentChat(staffToEdit.uid, data.displayName || staffToEdit.displayName || 'Quản lý mới');
        }
  
        if (oldManagerId !== newManagerId) {
          await ChatService.updateUserDepartmentChat(staffToEdit.uid, oldManagerId, newManagerId);
        }
      }
    } catch (error) {
      // Lỗi từ onSave hoặc ChatService sẽ được bắt ở đây.
      // onSave đã hiển thị Alert, nên ở đây chỉ cần log lỗi.
      console.error("Lỗi trong quá trình lưu và cập nhật chat:", error);
    }
  };

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={styles.salesStyles.modalOverlay}>
        <View style={styles.salesStyles.modalView}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <Text style={styles.salesStyles.modalTitle}>{staffToEdit ? 'Sửa thông tin Nhân viên' : 'Thêm Nhân viên mới'}</Text>
            {/* [SỬA] Cho phép nhập email khi tạo mới */}
            <View style={[styles.staffStyles.modalInputGroup, !staffToEdit ? {} : { backgroundColor: '#E5E7EB' }]}>
              <Ionicons name="mail-outline" size={20} color={COLORS.text_secondary} style={styles.staffStyles.modalInputIcon} />
              <TextInput 
                style={styles.salesStyles.modalInput} 
                value={email} 
                onChangeText={setEmail}
                placeholder="Email (dùng để đăng nhập)"
                editable={!staffToEdit} 
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.staffStyles.modalInputGroup}><Ionicons name="person-outline" size={20} color={COLORS.text_secondary} style={styles.staffStyles.modalInputIcon} /><TextInput style={styles.salesStyles.modalInput} placeholder="Tên hiển thị" value={displayName} onChangeText={setDisplayName} /></View>
            <View style={styles.staffStyles.modalInputGroup}><Ionicons name="call-outline" size={20} color={COLORS.text_secondary} style={styles.staffStyles.modalInputIcon} /><TextInput style={styles.salesStyles.modalInput} placeholder="Số điện thoại" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" /></View>
            <View style={styles.staffStyles.modalInputGroup}><Ionicons name="location-outline" size={20} color={COLORS.text_secondary} style={styles.staffStyles.modalInputIcon} /><TextInput style={styles.salesStyles.modalInput} placeholder="Địa chỉ" value={address} onChangeText={setAddress} /></View>
            <View style={styles.staffStyles.modalInputGroup}><Ionicons name="calendar-outline" size={20} color={COLORS.text_secondary} style={styles.staffStyles.modalInputIcon} /><TouchableOpacity style={styles.staffStyles.pickerTouchable} onPress={() => setCalendarVisible(true)}><Text style={dateOfBirth ? styles.staffStyles.pickerValue : styles.staffStyles.pickerPlaceholder}>{dateOfBirth ? new Date(dateOfBirth).toLocaleDateString('vi-VN') : 'Chọn ngày sinh'}</Text></TouchableOpacity></View>
            <View style={[styles.staffStyles.modalInputGroup, styles.staffStyles.readOnlyField]}><Ionicons name="person-add-outline" size={20} color={COLORS.text_secondary} style={styles.staffStyles.modalInputIcon} /><Text style={styles.staffStyles.readOnlyText}>Ngày tạo: {formatDate(staffToEdit?.createdAt)}</Text></View>
            {canEditSensitiveFields && (<><Text style={styles.staffStyles.modalLabel}>Lương theo giờ (VND/giờ):</Text><View style={styles.staffStyles.modalInputGroup}><Ionicons name="cash-outline" size={20} color={COLORS.text_secondary} style={styles.staffStyles.modalInputIcon} /><TextInput style={styles.salesStyles.modalInput} placeholder="Nhập mức lương theo giờ" value={hourlyRate.toString()} onChangeText={(text) => setHourlyRate(Number(text.replace(/[^0-9]/g, '')) || 0)} keyboardType="numeric" /></View></>)}
            {/* [THÊM] Nút Reset Mật khẩu */}
            {staffToEdit && canEditSensitiveFields && (
              <TouchableOpacity
                style={[styles.staffStyles.editButton, { marginTop: 15, backgroundColor: '#F59E0B' }]}
                onPress={() => onResetPassword(staffToEdit.email)}
              >
                <Ionicons name="key-outline" size={20} color="#FFFFFF" />
                <Text style={styles.staffStyles.editButtonText}>Reset Mật khẩu</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.staffStyles.modalLabel}>Chọn vai trò:</Text>
            <CustomPicker iconName="briefcase-outline" placeholder="-- Chọn vai trò --" items={ROLES} selectedValue={role} onValueChange={(value: any) => setRole(value as UserRole)} enabled={canEditSensitiveFields} />
            {!canEditSensitiveFields && (<Text style={[styles.staffStyles.infoText, { fontSize: 12, marginTop: -10, marginBottom: 10 }]}> (Chỉ Quản lý Nhân sự được phép sửa vai trò)</Text>)}
            <Text style={styles.staffStyles.modalLabel}>Chọn phòng ban (Người quản lý):</Text>
            {/* [SỬA LỖI] Loại bỏ lựa chọn "Quản lý chung" với giá trị 'quanly' không hợp lệ */}
            <CustomPicker 
              iconName="business-outline" 
              placeholder="Không có (Cấp cao nhất)" 
              items={[{ label: 'Không có (Cấp cao nhất)', value: '' }, ...managers.map(m => ({ label: `${m.displayName} (${getRoleDisplayName(m.role)})`, value: m.uid }))]} 
              selectedValue={managerId} onValueChange={setManagerId} enabled={canEditSensitiveFields} />
            {!canEditSensitiveFields && (<Text style={[styles.staffStyles.infoText, { fontSize: 12, marginTop: -10, marginBottom: 10 }]}> (Chỉ Quản lý Nhân sự được phép phân công phòng ban)</Text>)}
            
            <View style={[styles.salesStyles.modalButtons, { marginTop: 15 }]}>
              <TouchableOpacity style={[styles.staffStyles.modalButton, styles.staffStyles.modalButtonSecondary]} onPress={onClose}><Text style={styles.staffStyles.modalButtonText}>Hủy</Text></TouchableOpacity><TouchableOpacity style={[styles.staffStyles.modalButton, styles.staffStyles.modalButtonPrimary]} onPress={handleSave}><Text style={styles.staffStyles.modalButtonText}>Lưu</Text></TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
      <Modal animationType="fade" transparent={true} visible={isCalendarVisible} onRequestClose={() => setCalendarVisible(false)}><TouchableOpacity style={styles.salesStyles.modalOverlay} onPress={() => setCalendarVisible(false)}><View style={styles.salesStyles.modalView}><Calendar onDayPress={(day) => { setDateOfBirth(day.dateString); setCalendarVisible(false); }} markedDates={{ [dateOfBirth]: { selected: true, selectedColor: COLORS.primary } }} /></View></TouchableOpacity></Modal>
    </Modal>
  );
};