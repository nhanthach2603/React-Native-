// services/StaffService.tsx
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where
} from 'firebase/firestore';

import { db } from '../config/firebase'; // Đảm bảo app được export từ firebase.ts
import { UserRole } from '../context/AuthContext';
export interface StaffUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  monthlyHours: number;
  monthlySalary: number;
  managerId?: string | null; // Sửa ở đây: Đồng bộ kiểu dữ liệu thành string
  createdAt?: string;
  schedule?: { [date: string]: { shift: string; note: string } };
  phoneNumber?: string;
  dateOfBirth?: string;
  avatarUrl?: string;
  hourlyRate?: number;
}

const usersCollectionRef = collection(db, 'user');

export class StaffService {
  // Sửa đổi trong StaffService.ts: Thêm managerId của người dùng hiện tại để xác định quyền
  static async getStaffList(
    currentUserUid: string,
    currentUserRole: UserRole,
    currentUserManagerId: string | null | undefined
  ): Promise<StaffUser[]> {
    if (!currentUserUid || !currentUserRole) {
      return [];
    }

    // [SỬA LỖI] Xác định Tổng quản lý một cách chính xác bằng cách kiểm tra managerId === null.
    // Điều này tránh nhầm lẫn vai trò 'unassigned' với Tổng quản lý.
    const isTopLevelManager = currentUserManagerId === null || currentUserRole === 'quanlynhansu';

    if (isTopLevelManager) {
      // [SỬA LỖI] Tổng quản lý sẽ thấy TẤT CẢ người dùng trong hệ thống.
      const allUsersQuery = query(usersCollectionRef);
      const snapshot = await getDocs(allUsersQuery);
      // Lọc bỏ chính người quản lý ra khỏi danh sách
      return snapshot.docs
        .map(doc => ({ uid: doc.id, ...doc.data() } as StaffUser))
        .filter(user => user.uid !== currentUserUid);
    }
    
    if (currentUserRole === 'truongphong' || currentUserRole === 'thukho') {
      // TRƯỜNG HỢP 2: QUẢN LÝ CẤP TRUNG (truongphong, thukho)
      // [SỬA LỖI] Lấy nhân viên có managerId là UID của quản lý này, VÀ những người dùng chưa được phân công.
      const staffQuery = query(usersCollectionRef, where('managerId', '==', currentUserUid));
      const unassignedQuery = query(usersCollectionRef, where('role', '==', 'unassigned'));
  
      const [staffSnapshot, unassignedSnapshot] = await Promise.all([getDocs(staffQuery), getDocs(unassignedQuery)]);
  
      const staffList = staffSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as StaffUser));
      const unassignedList = unassignedSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as StaffUser));
      
      // Gộp 2 danh sách lại
      return [...staffList, ...unassignedList];
    }

    return []; // [SỬA LỖI] Luôn trả về một mảng rỗng nếu không có điều kiện nào khớp.
  }

  /**
   * Lấy danh sách tất cả người dùng có vai trò là quản lý (Trưởng phòng, Thủ kho)
   */
  static async getManagers(): Promise<StaffUser[]> { 
    // Lấy tất cả những người có vai trò có thể quản lý để hiển thị trong Picker
    const q = query(usersCollectionRef, where('role', 'in', ['truongphong', 'thukho']));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as StaffUser[];
  }

  
  static async updateStaff(uid: string, data: Partial<StaffUser>) {
    await updateDoc(doc(db, 'user', uid), data);
  }

  static async deleteStaff(uid: string) {
    // [THAY ĐỔI] Xóa trực tiếp document người dùng từ Firestore.
    // LƯU Ý: Hành động này KHÔNG xóa tài khoản khỏi Firebase Authentication.
    // Người dùng vẫn có thể đăng nhập nhưng sẽ không có quyền truy cập.
    const userDocRef = doc(db, 'user', uid);
    await deleteDoc(userDocRef);
  }

  /**
   * Cập nhật giờ công và lương tự động khi nhân viên chấm công.
   * @param uid UID của nhân viên
   * @param hoursToAdd Số giờ công muốn thêm (ví dụ: 8 giờ cho một ca)
   * @param hourlyRate Lương mỗi giờ
   */
  static async checkIn(uid: string) {
    const userDocRef = doc(db, 'user', uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data() as StaffUser;
      const monthlyHours = userData.monthlyHours || 0;
      const monthlySalary = userData.monthlySalary || 0;
      const userHourlyRate = userData.hourlyRate || 0; // Lấy mức lương theo giờ của user, mặc định là 0

      // Giả sử mỗi ca làm 8 tiếng và mức lương cơ bản là 50.000 VND/giờ
      const hoursToAdd = 8;

      await updateDoc(userDocRef, {
        monthlyHours: monthlyHours + hoursToAdd,
        monthlySalary: monthlySalary + hoursToAdd * userHourlyRate,
      });
    } else {
      throw new Error('User not found');
    }
  }

  /**
   * Phân công lịch làm việc cho một nhân viên cụ thể.
   * @param uid UID của nhân viên cần phân công
   * @param date Ngày phân công (định dạng 'YYYY-MM-DD')
   * @param shift Ca làm việc (ví dụ: 'Ca sáng', 'Ca chiều')
   * @param note Ghi chú cho ca làm
   */
  static async assignSchedule(
    uid: string,
    date: string,
    shift: string,
    note: string
  ) {
    const userDocRef = doc(db, 'user', uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const currentSchedule = userDoc.data().schedule || {};
      const newSchedule = {
        ...currentSchedule,
        [date]: { shift, note },
      };
      await updateDoc(userDocRef, { schedule: newSchedule });
    } else {
      throw new Error('User not found');
    }
  }

  /**
   * Phân công lịch làm việc hàng loạt cho nhiều ngày.
   * @param uid UID của nhân viên
   * @param dates Mảng các ngày cần phân công (định dạng 'YYYY-MM-DD')
   * @param shift Ca làm việc
   * @param note Ghi chú
   */
  static async assignBulkSchedule(
    uid: string,
    dates: string[],
    shift: string,
    note: string
  ) {
    const userDocRef = doc(db, 'user', uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const currentSchedule = userDoc.data().schedule || {};
      dates.forEach(date => {
        currentSchedule[date] = { shift, note };
      });
      await updateDoc(userDocRef, { schedule: currentSchedule });
    } else {
      throw new Error('User not found');
    }
  }
}