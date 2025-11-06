// components/staff/IndividualScheduleView.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { COLORS, styles } from '../../styles/homeStyle';

interface CalendarDay {
  dateString: string;
  day: number;
  month: number;
  year: number;
}

interface IndividualScheduleViewProps {
  data: any;
  handleCheckIn: () => void;
}

export const IndividualScheduleView: React.FC<IndividualScheduleViewProps> = ({ data, handleCheckIn }) => {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(today.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  if (!data || !data.schedule) return <ActivityIndicator color={COLORS.primary} />;

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
    setSelectedDate(newWeekStart);
  };

  const handleNextWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + 7);
    setCurrentWeekStart(newWeekStart);
    setSelectedDate(newWeekStart);
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
    setSelectedDate(new Date(day.dateString));
    setDatePickerVisible(false);
  }

  const scheduleArray = Object.entries(data.schedule || {}).map(([date, details]) => ({ date, ...(details as { shift: string; note: string }) })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const filteredMonthSchedule = scheduleArray.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate.getFullYear() === currentMonth.getFullYear() && itemDate.getMonth() === currentMonth.getMonth();
  });

  const todayString = new Date().toISOString().slice(0, 10);
  const todaySchedule = data.schedule[todayString];
  const canCheckInToday = todaySchedule && todaySchedule.shift !== 'Nghỉ';

  return (
    <ScrollView style={styles.staffStyles.scrollContainer} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
      <Text style={styles.staffStyles.headerTitle}>Thông tin Cá nhân</Text>
      <View style={styles.staffStyles.summaryCard}><View style={styles.staffStyles.summaryRow}><Ionicons name='cash-outline' size={24} color={COLORS.primary} /><Text style={styles.staffStyles.summaryText}>Lương dự kiến (Tháng): <Text style={styles.staffStyles.boldText}>{data.monthlySalary ? data.monthlySalary.toLocaleString('vi-VN') : '0'} VND</Text></Text></View><View style={styles.staffStyles.summaryRow}><Ionicons name='time-outline' size={24} color={COLORS.secondary} /><Text style={styles.staffStyles.summaryText}>Giờ công (Tháng): <Text style={styles.staffStyles.boldText}>{data.monthlyHours || 0}</Text> giờ</Text></View><TouchableOpacity onPress={handleCheckIn} style={[styles.staffStyles.checkInButton, !canCheckInToday && { backgroundColor: COLORS.text_placeholder }]} disabled={!canCheckInToday}><Text style={styles.staffStyles.checkInButtonText}>{canCheckInToday ? 'Chấm Công Hôm Nay' : 'Không có ca làm'}</Text></TouchableOpacity></View>
      <Text style={styles.staffStyles.headerTitle}>Lịch làm việc của tôi</Text>
      <View style={styles.staffStyles.viewModeContainer}><TouchableOpacity onPress={() => setViewMode('week')} style={[styles.staffStyles.viewModeButton, viewMode === 'week' && styles.staffStyles.viewModeButtonActive]}><Text style={[styles.staffStyles.viewModeText, viewMode === 'week' && styles.staffStyles.viewModeTextActive]}>Xem theo Tuần</Text></TouchableOpacity><TouchableOpacity onPress={() => setViewMode('month')} style={[styles.staffStyles.viewModeButton, viewMode === 'month' && styles.staffStyles.viewModeButtonActive]}><Text style={[styles.staffStyles.viewModeText, viewMode === 'month' && styles.staffStyles.viewModeTextActive]}>Xem theo Tháng</Text></TouchableOpacity></View>
      {viewMode === 'week' && (<View style={styles.staffStyles.scheduleWeekViewCard}><View style={styles.staffStyles.dayNavigationContainer}><TouchableOpacity onPress={handlePreviousWeek} style={styles.staffStyles.dayNavigationButton}><Ionicons name="chevron-back-outline" size={24} color={COLORS.text_primary} /></TouchableOpacity><TouchableOpacity onPress={() => setDatePickerVisible(true)}><Text style={styles.staffStyles.dayNavigationText}>{currentWeekStart.toLocaleDateString('vi-VN')}</Text></TouchableOpacity><TouchableOpacity onPress={handleNextWeek} style={styles.staffStyles.dayNavigationButton}><Ionicons name="chevron-forward-outline" size={24} color={COLORS.text_primary} /></TouchableOpacity></View><View style={styles.staffStyles.todayButtonContainer}><TouchableOpacity onPress={handleGoToToday} style={styles.staffStyles.todayButton}><Text style={styles.staffStyles.todayButtonText}>Về Hôm Nay</Text></TouchableOpacity></View><View style={styles.staffStyles.weekContainer}>{weekDays.map((day, index) => { const dayString = day.toISOString().slice(0, 10); const isSelected = dayString === selectedDayString; const schedule = data.schedule?.[dayString]; const isToday = dayString === todayString; return (<TouchableOpacity key={index} style={[styles.staffStyles.weekDayBox, isSelected && styles.staffStyles.weekDayBoxSelected, isToday && styles.staffStyles.weekDayBoxToday]} onPress={() => setSelectedDate(day)}><Text style={[styles.staffStyles.weekDayText, isSelected && styles.staffStyles.weekDayTextSelected]}>{['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][day.getDay()]}</Text><Text style={[styles.staffStyles.weekDateText, isSelected && styles.staffStyles.weekDateTextSelected]}>{day.getDate()}</Text>{isToday && !isSelected && <View style={styles.staffStyles.todayIndicator} />}{schedule && <View style={[styles.staffStyles.scheduleDot, { backgroundColor: SHIFT_COLORS[schedule.shift as keyof typeof SHIFT_COLORS] || COLORS.text_secondary }]} />}</TouchableOpacity>); })}</View><View style={styles.staffStyles.scheduleDetailsCard}><Text style={styles.staffStyles.scheduleTitle}><Ionicons name="information-circle-outline" size={20} color={COLORS.text_primary} style={{ marginRight: 8 }} />Chi tiết ngày: {selectedDate.toLocaleDateString('vi-VN')}</Text>{selectedDaySchedule ? (<View><View style={styles.staffStyles.scheduleDetailRow}><Ionicons name="time-outline" size={20} color={COLORS.secondary} /><Text style={styles.staffStyles.detailText}>Ca làm việc: <Text style={styles.staffStyles.boldText}>{selectedDaySchedule.shift}</Text></Text></View><View style={styles.staffStyles.scheduleDetailRow}><Ionicons name="document-text-outline" size={20} color={COLORS.accent} /><Text style={styles.staffStyles.detailText}>Ghi chú: <Text style={styles.staffStyles.boldText}>{selectedDaySchedule.note || 'Không có'}</Text></Text></View></View>) : (<Text style={styles.staffStyles.noScheduleText}>Không có lịch làm việc cho ngày này.</Text>)}</View></View>)}
      {viewMode === 'month' && (<><Calendar onDayPress={(day) => setSelectedDate(new Date(day.dateString))} markedDates={markedDates} style={styles.staffStyles.calendar} minDate={new Date().toISOString().slice(0, 10)} onMonthChange={(month) => setCurrentMonth(new Date(month.dateString))} /><Text style={[styles.staffStyles.scheduleTitle, { marginTop: 10 }]}>Ca làm trong tháng {currentMonth.getMonth() + 1}/{currentMonth.getFullYear()}</Text>{filteredMonthSchedule.length > 0 ? filteredMonthSchedule.map(item => (<View key={item.date} style={[styles.staffStyles.scheduleDetailsCard, { marginBottom: 10, padding: 15 }]}><Text style={[styles.staffStyles.scheduleTitle, { fontSize: 16, marginBottom: 5 }]}>Ngày: {new Date(item.date).toLocaleDateString('vi-VN')}</Text><Text style={styles.staffStyles.detailText}>Ca: <Text style={styles.staffStyles.boldText}>{item.shift}</Text></Text>{item.note && <Text style={styles.staffStyles.detailText}>Ghi chú: <Text style={styles.staffStyles.boldText}>{item.note}</Text></Text>}</View>)) : (<Text style={styles.staffStyles.noScheduleText}>Bạn chưa có lịch làm việc nào.</Text>)}</>)}
      <Modal animationType="fade" transparent={true} visible={isDatePickerVisible} onRequestClose={() => setDatePickerVisible(false)}><TouchableOpacity style={styles.salesStyles.modalOverlay} onPress={() => setDatePickerVisible(false)}><View style={[styles.salesStyles.modalView, { width: '95%' }]}><Calendar onDayPress={handleDateSelect} markedDates={{ [selectedDayString]: { selected: true, selectedColor: COLORS.primary } }} /></View></TouchableOpacity></Modal>
      <View style={styles.staffStyles.legendContainer}>{Object.entries(SHIFT_COLORS).map(([shiftName, color]) => (<View key={shiftName} style={styles.staffStyles.legendItem}><View style={[styles.staffStyles.colorDot, { backgroundColor: color }]} /><Text style={styles.staffStyles.legendText}>{shiftName}</Text></View>))}</View>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
};