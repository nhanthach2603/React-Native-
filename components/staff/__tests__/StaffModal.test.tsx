import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { StaffModal } from '../StaffModal';
import { useAuth } from '../../../context/AuthContext';
import { StaffUser } from '../../../services/StaffService';

// Mock necessary modules
jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../CustomPicker', () => ({
  CustomPicker: ({ selectedValue, onValueChange, items, placeholder, enabled, iconName }: any) => (
    <mock-CustomPicker
      selectedValue={selectedValue}
      onValueChange={onValueChange}
      items={items}
      placeholder={placeholder}
      enabled={enabled}
      iconName={iconName}
    />
  ),
}));

// Mock Alert for validation messages
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
  };
});

describe('StaffModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();
  const mockOnResetPassword = jest.fn();
  const mockManagers: StaffUser[] = [
    { uid: 'm1', displayName: 'Manager One', email: 'm1@example.com', role: 'truongphong', monthlyHours: 0, monthlySalary: 0 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      currentUser: { uid: 'admin1', role: 'quanlynhansu' },
    });
  });

  it('renders correctly when not visible', () => {
    const { queryByTestId } = render(
      <StaffModal
        isVisible={false}
        onClose={mockOnClose}
        onSave={mockOnSave}
        staffToEdit={null}
        managers={mockManagers}
        onResetPassword={mockOnResetPassword}
      />
    );
    expect(queryByTestId('staff-modal')).toBeNull(); // Assuming Modal is not rendered when isVisible is false
  });

  it('renders correctly when visible for new staff', () => {
    const { getByText, getByPlaceholderText } = render(
      <StaffModal
        isVisible={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        staffToEdit={null}
        managers={mockManagers}
        onResetPassword={mockOnResetPassword}
      />
    );
    expect(getByText('Thêm Nhân viên mới')).toBeTruthy();
    expect(getByPlaceholderText('Email (dùng để đăng nhập)')).toBeTruthy();
    expect(getByPlaceholderText('Tên hiển thị')).toBeTruthy();
    expect(getByPlaceholderText('Số điện thoại')).toBeTruthy();
    expect(getByPlaceholderText('Địa chỉ')).toBeTruthy();
    expect(getByText('Chọn ngày sinh')).toBeTruthy();
    expect(getByPlaceholderText('Nhập mức lương theo giờ')).toBeTruthy();
    expect(getByText('Chọn vai trò:')).toBeTruthy();
    expect(getByText('Chọn phòng ban (Người quản lý):')).toBeTruthy();
  });

  it('renders correctly when visible for editing existing staff', () => {
    const staff: StaffUser = {
      uid: 's1',
      email: 'staff1@example.com',
      displayName: 'Staff One',
      role: 'nhanvienkd',
      monthlyHours: 160,
      monthlySalary: 8000000,
      phoneNumber: '123456789',
      dateOfBirth: '1990-01-01',
      hourlyRate: 50000,
      address: '123 Main St',
      createdAt: '2023-01-01T00:00:00.000Z',
    };
    const { getByText, getByDisplayValue } = render(
      <StaffModal
        isVisible={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        staffToEdit={staff}
        managers={mockManagers}
        onResetPassword={mockOnResetPassword}
      />
    );
    expect(getByText('Sửa thông tin Nhân viên')).toBeTruthy();
    expect(getByDisplayValue('staff1@example.com')).toBeTruthy();
    expect(getByDisplayValue('Staff One')).toBeTruthy();
    expect(getByDisplayValue('123456789')).toBeTruthy();
    expect(getByDisplayValue('123 Main St')).toBeTruthy();
    expect(getByDisplayValue('50000')).toBeTruthy();
    expect(getByText('Ngày tạo: 01/01/2023')).toBeTruthy();
  });

  it('calls onClose when Cancel button is pressed', () => {
    const { getByText } = render(
      <StaffModal
        isVisible={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        staffToEdit={null}
        managers={mockManagers}
        onResetPassword={mockOnResetPassword}
      />
    );
    fireEvent.press(getByText('Hủy'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('shows alert if display name is empty on save', async () => {
    const { getByText } = render(
      <StaffModal
        isVisible={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        staffToEdit={null}
        managers={mockManagers}
        onResetPassword={mockOnResetPassword}
      />
    );
    fireEvent.press(getByText('Lưu'));
    await waitFor(() => {
      expect(require('react-native').Alert.alert).toHaveBeenCalledWith('Lỗi', 'Vui lòng điền Tên hiển thị.');
    });
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('calls onSave with correct data for new staff', async () => {
    const { getByPlaceholderText, getByText, UNSAFE_getByType } = render(
      <StaffModal
        isVisible={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        staffToEdit={null}
        managers={mockManagers}
        onResetPassword={mockOnResetPassword}
      />
    );

    fireEvent.changeText(getByPlaceholderText('Email (dùng để đăng nhập)'), 'newstaff@example.com');
    fireEvent.changeText(getByPlaceholderText('Tên hiển thị'), 'New Staff');
    fireEvent.changeText(getByPlaceholderText('Số điện thoại'), '987654321');
    fireEvent.changeText(getByPlaceholderText('Địa chỉ'), '456 New Road');
    fireEvent.changeText(getByPlaceholderText('Nhập mức lương theo giờ'), '60000');

    // Simulate CustomPicker changes for role and manager
    fireEvent(UNSAFE_getByType('mock-CustomPicker')[0], 'onValueChange', 'nhanvienkho'); // Role
    fireEvent(UNSAFE_getByType('mock-CustomPicker')[1], 'onValueChange', 'm1'); // Manager

    fireEvent.press(getByText('Lưu'));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'newstaff@example.com',
          displayName: 'New Staff',
          phoneNumber: '987654321',
          hourlyRate: 60000,
          address: '456 New Road',
          role: 'nhanvienkho',
          managerId: 'm1',
        })
      );
    });
  });

  it('calls onSave with correct data for existing staff', async () => {
    const staff: StaffUser = {
      uid: 's1',
      email: 'staff1@example.com',
      displayName: 'Staff One',
      role: 'nhanvienkd',
      monthlyHours: 160,
      monthlySalary: 8000000,
      phoneNumber: '123456789',
      dateOfBirth: '1990-01-01',
      hourlyRate: 50000,
      address: '123 Main St',
      createdAt: '2023-01-01T00:00:00.000Z',
    };
    const { getByDisplayValue, getByText, UNSAFE_getByType } = render(
      <StaffModal
        isVisible={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        staffToEdit={staff}
        managers={mockManagers}
        onResetPassword={mockOnResetPassword}
      />
    );

    fireEvent.changeText(getByDisplayValue('Staff One'), 'Updated Staff One');
    fireEvent.changeText(getByDisplayValue('123 Main St'), '789 New Address');
    fireEvent.changeText(getByDisplayValue('50000'), '55000');

    // Simulate CustomPicker changes for role and manager
    fireEvent(UNSAFE_getByType('mock-CustomPicker')[0], 'onValueChange', 'thukho'); // Role
    fireEvent(UNSAFE_getByType('mock-CustomPicker')[1], 'onValueChange', 'm1'); // Manager

    fireEvent.press(getByText('Lưu'));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: 's1',
          displayName: 'Updated Staff One',
          phoneNumber: '123456789', // Should remain unchanged if not edited
          hourlyRate: 55000,
          address: '789 New Address',
          role: 'thukho',
          managerId: 'm1',
        })
      );
    });
  });

  it('calls onResetPassword when Reset Mật khẩu button is pressed', () => {
    const staff: StaffUser = {
      uid: 's1',
      email: 'staff1@example.com',
      displayName: 'Staff One',
      role: 'nhanvienkd',
      monthlyHours: 160,
      monthlySalary: 8000000,
      phoneNumber: '123456789',
      dateOfBirth: '1990-01-01',
      hourlyRate: 50000,
      address: '123 Main St',
      createdAt: '2023-01-01T00:00:00.000Z',
    };
    const { getByText } = render(
      <StaffModal
        isVisible={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        staffToEdit={staff}
        managers={mockManagers}
        onResetPassword={mockOnResetPassword}
      />
    );
    fireEvent.press(getByText('Reset Mật khẩu'));
    expect(mockOnResetPassword).toHaveBeenCalledTimes(1);
    expect(mockOnResetPassword).toHaveBeenCalledWith('staff1@example.com');
  });

  it('disables sensitive fields for non-quanlynhansu users', () => {
    (useAuth as jest.Mock).mockReturnValue({
      currentUser: { uid: 'user1', role: 'nhanvienkd' },
    });
    const { queryByPlaceholderText, queryByText } = render(
      <StaffModal
        isVisible={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        staffToEdit={null}
        managers={mockManagers}
        onResetPassword={mockOnResetPassword}
      />
    );

    expect(queryByPlaceholderText('Nhập mức lương theo giờ')).toBeNull(); // Should not be rendered
    expect(queryByText('Chọn vai trò:')).toBeTruthy(); // Label should be there
    expect(queryByText('Chọn phòng ban (Người quản lý):')).toBeTruthy(); // Label should be there
    
    // Check if CustomPicker for role is disabled
    const rolePicker = queryByText('-- Chọn vai trò --')?.parent?.parent;
    expect(rolePicker).toHaveProperty('props.enabled', false);

    // Check if CustomPicker for manager is disabled
    const managerPicker = queryByText('Không có (Cấp cao nhất)')?.parent?.parent;
    expect(managerPicker).toHaveProperty('props.enabled', false);
  });
});
