// services/StaffService.tsx
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';

import {
  createUserWithEmailAndPassword,
  getAuth
} from 'firebase/auth'; // Import từ firebase/auth
import { db } from '../config/firebase';
export interface StaffUser {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  monthlyHours: number;
  monthlySalary: number;
  managerId?: number | null;
  createdAt?: string;
  schedule?: { [date: string]: { shift: string; note: string } };
}

const usersCollectionRef = collection(db, 'user');

export class StaffService {
 // Sửa đổi trong StaffService.tsx

static async getStaffList(userRole: string | null, managerId: string | null): Promise<StaffUser[]> {
  let staff: StaffUser[] = [];
  
  if (userRole === 'quanlynansu') {
    const q = query(usersCollectionRef); 
    const snapshot = await getDocs(q);
    staff = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as StaffUser[];
  } else if (userRole === 'truongphong' || userRole === 'thukho') {
    const q = query(usersCollectionRef, where('managerId', '==', managerId));
    const snapshot = await getDocs(q);
    staff = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as StaffUser[];
  }
  // Trường hợp không có vai trò nào khớp, staff sẽ là mảng rỗng đã được khởi tạo
  
  return staff;
}
  static async addStaff(
    email: string,
    password: string,
    displayName: string,
    role: string,
    managerId: number | null
  ): Promise<StaffUser> {
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const uid = userCredential.user.uid;

    const newStaff: StaffUser = {
      uid,
      email,
      displayName,
      role,
      managerId,
      monthlyHours: 0,
      monthlySalary: 0,
      schedule: {},
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'user', uid), newStaff);
    return newStaff;
  }

  static async updateStaff(uid: string, data: Partial<StaffUser>) {
    await updateDoc(doc(db, 'user', uid), data);
  }

  static async deleteStaff(uid: string) {
    try {
      await deleteDoc(doc(db, 'user', uid));
    } catch (e: any) {
      console.error('LỖI KHI XÓA NHÂN VIÊN:', e);
      throw new Error(`Không thể xóa nhân viên. Lỗi Rules: ${e.code || 'UNKNOWN'}`);
    }
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

      // Giả sử mỗi ca làm 8 tiếng và mức lương cơ bản là 50.000 VND/giờ
      const hoursToAdd = 8;
      const hourlyRate = 50000;

      await updateDoc(userDocRef, {
        monthlyHours: monthlyHours + hoursToAdd,
        monthlySalary: monthlySalary + hoursToAdd * hourlyRate,
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
}