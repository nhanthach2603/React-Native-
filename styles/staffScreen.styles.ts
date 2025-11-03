// d:\React-Native-\styles\staffScreen.styles.ts

import { StyleSheet } from 'react-native';
import { COLORS } from './_colors';

export const staffStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg_main,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  }, // [SỬA] Bỏ paddingHorizontal ở đây, sẽ áp dụng trong contentContainerStyle
  headerTitle: { // Cải thiện tiêu đề
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text_primary,
    marginBottom: 20,
  },
  summaryText: { // Đổi tên để dùng chung
    fontSize: 16, // [SỬA] Đổi màu để nhất quán hơn
    color: COLORS.text_secondary,
    marginLeft: 10,
  },
  boldText: {
    fontWeight: 'bold',
    color: COLORS.text_primary,
  },
  calendar: {
    marginBottom: 20,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowColor: COLORS.black,
    shadowRadius: 4,
    elevation: 2,
  },
  // [THÊM] Thẻ lớn bao bọc toàn bộ khu vực xem lịch tuần
  scheduleWeekViewCard: {
    backgroundColor: COLORS.bg_card,
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleDetailsCard: {
    // [SỬA] Bỏ nền và shadow riêng, vì đã nằm trong thẻ lớn
    backgroundColor: 'transparent',
    padding: 0, // Bỏ padding cũ
    paddingTop: 15, // Thêm padding top để tạo khoảng cách
    marginTop: 15, // Thêm margin top
    borderTopWidth: 1, // Thêm đường kẻ phân cách
    borderTopColor: COLORS.border, // [SỬA] Đảm bảo màu viền nhất quán
    borderRadius: 12,
    // Bỏ các thuộc tính shadow và elevation
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    width: '100%', // Đảm bảo chiếm hết chiều rộng thẻ cha
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15, // [SỬA] Tăng khoảng cách
    color: COLORS.text_primary,
    flexDirection: 'row', // [THÊM] Để chứa icon
    alignItems: 'center', // [THÊM]
  },
  // [THÊM] Style cho các dòng chi tiết trong thẻ lịch làm
  scheduleDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Dùng flex-start để icon và text căn lề trên
    paddingVertical: 10, // [SỬA] Tăng padding cho thoáng hơn
  },
  detailText: {
    fontSize: 16,
    color: COLORS.text_secondary,
    marginLeft: 10, // Thêm khoảng cách với icon
    lineHeight: 24, // Tăng chiều cao dòng cho dễ đọc
    flex: 1,
  },
  noScheduleText: {
    fontSize: 16,
    color: COLORS.text_placeholder,
    textAlign: 'center', // [SỬA] Căn giữa cho đẹp hơn
  },
  infoText: {
    fontSize: 16,
    color: COLORS.text_secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  list: {
    flex: 1,
  },
  staffItem: {
    backgroundColor: COLORS.bg_card,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  // [ĐỒNG BỘ] Style cơ bản cho các thẻ thông tin
  baseCard: {
    backgroundColor: COLORS.bg_card,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  // [ĐỒNG BỘ] Style cho header của thẻ
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  staffItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staffAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary_light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  staffAvatarText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  staffRole: {
    fontSize: 14,
    color: COLORS.text_secondary,
    marginTop: 5,
  },
  staffDetails: {
    marginTop: 10,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.border,
  },
  staffHours: {
    fontSize: 14,
    color: COLORS.text_secondary,
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 15,
    paddingTop: 15,
  },
  buttonIcon: {
    marginLeft: 15,
  },
  modalLabel: {
    fontWeight: '600',
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    alignSelf: 'flex-start', // Căn chỉnh theo ý muốn
    marginTop: 10,
  },
  checkInButton: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignSelf: 'center', // Canh giữa nút
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  summaryCard: { // Style mới cho thẻ tóm tắt
    backgroundColor: COLORS.bg_card,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkInButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoIcon: {
    marginRight: 15,
  },
  infoLabel: {
    fontSize: 16,
    color: COLORS.text_primary,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.text_secondary,
    marginLeft: 8,
    flex: 1, // Giúp text tự động xuống dòng nếu quá dài
    textAlign: 'right', // Căn phải cho đẹp
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    marginTop: 30,
    paddingVertical: 15,
    borderRadius: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  editButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalInputGroup: { // Style mới cho input trong modal
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg_main,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    width: '100%',
    height: 50,
  },
  modalInputIcon: {
    marginRight: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  modalButtonSecondary: {
    backgroundColor: COLORS.text_secondary,
  },
  modalButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickerWrapper: { // Style mới để bọc Picker
    flex: 1,
  },
  pickerStyle: { // Style mới cho chính Picker
    color: COLORS.text_primary,
  },
  // --- Custom Picker Styles ---
  pickerTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  pickerValue: {
    fontSize: 16,
    color: COLORS.text_primary,
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: COLORS.text_placeholder,
  },
  pickerModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pickerModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
    paddingTop: 10,
  },
  pickerItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pickerItemText: {
    fontSize: 18,
    color: COLORS.text_primary,
  },
  pickerCloseButton: {
    alignSelf: 'center',
    padding: 15,
  },
  // --- Styles for Profile Screen Avatar ---
  profileAvatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  profileAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary_light,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
  },
  profileAvatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  profileAvatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  cameraIconOverlay: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: COLORS.accent,
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  quickSelectButton: {
    backgroundColor: COLORS.primary_light,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  quickSelectButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  // --- New Styles for Week Navigation ---
  dayNavigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%', // [SỬA] Đảm bảo chiếm hết chiều rộng
  },
  // --- New Styles for Individual Schedule View ---
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.border,
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
    justifyContent: 'space-around',
    marginHorizontal: 20, // Thêm margin để căn chỉnh với các phần khác
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text_secondary,
  },
  viewModeTextActive: {
    color: COLORS.primary,
  },
  dayNavigationButton: {
    // [SỬA] Làm nút nổi bật hơn
    padding: 8,
    backgroundColor: COLORS.bg_main,
    borderRadius: 20,
  },
  dayNavigationText: {
    fontSize: 18,
    fontWeight: '600', // [SỬA] Giảm độ đậm cho tinh tế
    color: COLORS.text_primary, // [SỬA] Đảm bảo màu chữ nhất quán
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20, // [SỬA] Tăng khoảng cách với thanh điều hướng
    // [SỬA] Bỏ paddingHorizontal để weekContainer chiếm hết chiều rộng
  },
  weekDayBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8, // [SỬA] Giảm bo góc
    backgroundColor: '#FFFFFF', // [SỬA] Đổi màu nền cho rõ ràng hơn
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: COLORS.border, // [THÊM] Thêm viền nhẹ
  },
  weekDayBoxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary, // [THÊM] Đổi màu viền khi được chọn
    shadowColor: COLORS.primary, // [THÊM] Thêm hiệu ứng đổ bóng
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  weekDayText: { fontSize: 12, color: COLORS.text_secondary, fontWeight: '500' },
  weekDateText: { fontSize: 18, color: COLORS.text_primary, fontWeight: '700', marginTop: 4 },
  // [THÊM] Style cho chữ khi ngày được chọn
  weekDayTextSelected: { color: COLORS.white },
  weekDateTextSelected: { color: COLORS.white },
  weekDayBoxToday: {
    borderColor: COLORS.accent, // [THÊM] Viền màu cam cho ngày hôm nay
  },
  // [THÊM] Style cho ngày hôm nay
  todayIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
    marginTop: 4,
  },
  scheduleDot: {
    width: 8, height: 8, borderRadius: 4, 
    position: 'absolute', top: 6, right: 6, // [SỬA] Căn chỉnh lại vị trí chấm
  },
  legendContainer: {
    flexDirection: 'row', // Thay đổi thành row để hiển thị ngang
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 0, // [SỬA] Bỏ margin top vì đã có khoảng cách từ thẻ tuần
    padding: 15,
    backgroundColor: COLORS.bg_card, // [THÊM] Đưa vào thẻ để đồng bộ
    borderRadius: 12, // [SỬA] Đồng bộ bo góc
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginBottom: 10,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    fontSize: 14,
    color: COLORS.text_secondary,
  },
  // [THÊM] Container cho nút "Hôm nay"
  todayButtonContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  // [THÊM] Style cho nút "Hôm nay"
  todayButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 15, // [SỬA] Tăng padding
    paddingVertical: 8, // [SỬA] Tăng padding
    borderRadius: 20,
    elevation: 2,
    shadowOpacity: 0.2,
  },
  todayButtonText: {
    color: COLORS.white, fontWeight: 'bold', fontSize: 14, // [SỬA] Tăng cỡ chữ
  },
  readOnlyField: {
    backgroundColor: '#E5E7EB', // Màu nền xám cho trường chỉ đọc
  },
  readOnlyText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text_secondary,
    paddingVertical: 5, // Căn chỉnh chiều dọc cho text
    marginLeft: -10, // Bù lại khoảng cách của icon
    paddingLeft: 10,
  },
});
