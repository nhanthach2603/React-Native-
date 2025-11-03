// d:\React-Native-\styles\homeScreen.styles.ts

import { StyleSheet } from 'react-native';
import { COLORS } from './_colors';

export const homeStyles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F4F7F9',
  },
  container: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text_primary,
  },
  logoutButton: {
    padding: 5,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg_card,
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  roleInfo: {
    marginLeft: 15,
  },
  roleLabel: {
    fontSize: 14,
    color: COLORS.text_secondary,
  },
  roleText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text_primary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text_primary,
    marginBottom: 15,
  },
  statContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statCard: {
    backgroundColor: COLORS.bg_card,
    padding: 15,
    borderRadius: 10,
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    minHeight: 120,
    marginBottom: 15,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text_primary,
    marginTop: 5,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.text_secondary,
    textAlign: 'center',
    marginTop: 5,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg_card,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  notificationText: {
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.text_primary,
  },
  productResultCard: { // Style mới cho thẻ kết quả sản phẩm
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg_card,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productResultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  productResultSku: {
    fontSize: 13,
    color: COLORS.text_secondary,
    marginTop: 2,
  },
  infoText: {
    fontSize: 16,
    color: COLORS.text_secondary,
    textAlign: 'center',
    paddingHorizontal: 10,
    lineHeight: 24,
  },
  loadingContainer: {
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: COLORS.bg_main,
  },
  loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: COLORS.text_secondary,
  },
  errorContainer: {
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: '#FEE2E2',
      padding: 20,
  },
  errorText: {
      marginTop: 10,
      fontSize: 18,
      fontWeight: 'bold',
      color: COLORS.error,
      textAlign: 'center',
  },
  tabBar: { 
      height: 60, 
      paddingBottom: 5, 
      paddingTop: 5 
  },
  tabBarLabel: {
      fontSize: 11,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg_card, //
    paddingHorizontal: 15,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 50,
  },
  searchInputActive: { // Style khi đang nhập tìm kiếm
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    borderRadius: 12, // Bo tròn hơn nữa
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.text_primary,
  },
  modalPicker: {
    width: '100%',
    height: 50, // Đảm bảo chiều cao phù hợp
    color: COLORS.text_primary,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    alignSelf: 'flex-start', // Căn chỉnh theo ý muốn
    marginTop: 10,
  },
});
