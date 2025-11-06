import { UserRole } from '../context/AuthContext';

export const getRoleDisplayName = (userRole: UserRole | null) => {
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
    case 'tongquanly':
      return 'Tổng Quản lý';
    case null:
    case 'unassigned':
    default:
      return 'Chưa được gán';
  }
};
