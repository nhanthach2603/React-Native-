// components/staff/AssignScheduleModal.tsx
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { StaffUser } from '../../services/StaffService';
import { COLORS, styles } from '../../styles/homeStyle';
import { CustomPicker } from '../CustomPicker';

interface CalendarDay {
  dateString: string;
  day: number;
  month: number;
  year: number;
}

interface AssignScheduleModalProps {
  isVisible: boolean;
  onClose: () => void;
  staffToAssign: StaffUser | null;
  onAssign: (data: { uid: string; dates: string[]; shift: string; note: string }) => Promise<void>;
}

export const AssignScheduleModal: React.FC<AssignScheduleModalProps> = ({ isVisible, onClose, staffToAssign, onAssign }) => {
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
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 20 }}><TouchableOpacity style={styles.staffStyles.quickSelectButton} onPress={handleSelectCurrentWeek}><Text style={styles.staffStyles.quickSelectButtonText}>Chọn Tuần Này</Text></TouchableOpacity><TouchableOpacity style={styles.staffStyles.quickSelectButton} onPress={handleSelectCurrentMonth}><Text style={styles.staffStyles.quickSelectButtonText}>Chọn Tháng Này</Text></TouchableOpacity></View>
            <Text style={styles.staffStyles.modalLabel}>Chọn ca làm việc:</Text>
            <CustomPicker iconName="time-outline" placeholder="-- Chọn ca làm việc --" items={[{ label: 'Giờ hành chính (8h-17h)', value: 'Giờ hành chính' }, { label: 'Ca sáng (8h-12h)', value: 'Ca sáng' }, { label: 'Ca chiều (13h-17h)', value: 'Ca chiều' }, { label: 'Ca tối (18h-22h)', value: 'Ca tối' }, { label: 'Nghỉ', value: 'Nghỉ' }]} selectedValue={shift} onValueChange={setShift} enabled={true} />
            <TextInput style={styles.salesStyles.modalInput} placeholder='Ghi chú (nếu có)' value={note} onChangeText={setNote} />
          </ScrollView>
          <View style={[styles.salesStyles.modalButtons, { flexShrink: 1 }]}><TouchableOpacity style={[styles.staffStyles.modalButton, styles.staffStyles.modalButtonSecondary]} onPress={onClose}><Text style={styles.staffStyles.modalButtonText}>Đóng</Text></TouchableOpacity><TouchableOpacity style={[styles.staffStyles.modalButton, styles.staffStyles.modalButtonPrimary]} onPress={handleAssign} disabled={loading}><Text style={styles.staffStyles.modalButtonText}>{loading ? 'Đang lưu...' : 'Phân công'}</Text></TouchableOpacity></View>
        </View>
      </View>
    </Modal>
  );
};