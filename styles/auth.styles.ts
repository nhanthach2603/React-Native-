// d:\React-Native-\styles\auth.styles.ts

import { StyleSheet } from 'react-native';
import { COLORS } from './_colors';

export const authStyles = StyleSheet.create({
  // Styles for Register Screen
  registerContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: COLORS.bg_main,
  },
  formContainer: {
    backgroundColor: COLORS.bg_card,
    padding: 25,
    borderRadius: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 30,
    color: COLORS.text_primary,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    height: 55,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  icon: {
    paddingHorizontal: 10,
    marginRight: 5,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: COLORS.text_primary,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    height: 55,
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: COLORS.primary_light,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  loginText: {
    fontSize: 14,
    color: COLORS.text_secondary,
  },
  loginLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: 'bold',
  },

  // Styles for Pending Screen
  pendingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: COLORS.bg_main,
  },
  pendingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text_primary,
    marginTop: 20,
    textAlign: 'center',
  },
  pendingMessage: {
    fontSize: 16,
    color: COLORS.text_secondary,
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 24,
  },
  pendingButton: {
    marginTop: 30,
    backgroundColor: COLORS.error,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
   errorText: {
    color: '#EF4444', // Màu đỏ để báo lỗi
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 14,
    fontWeight: '500',
  }
});