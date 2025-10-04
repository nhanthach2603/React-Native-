import {
    collection,
    createUserWithEmailAndPassword,
    deleteDoc,
    doc,
    getAuth,
    getDocs,
    query,
    setDoc,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface StaffUser {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  monthlyHours: number;
  monthlySalary: number;
  managerId?: string;
  createdAt?: string;
}

const usersCollectionRef = collection(db, 'user');

export class StaffService {
  static async getStaffList(role: string, managerId: string | null): Promise<StaffUser[]> {
    let q = query(usersCollectionRef);

    if (role === 'truongphong' || role === 'thukho') {
      q = query(usersCollectionRef, where('managerId', '==', managerId));
    } else if (role === 'quanlynansu') {
      q = query(usersCollectionRef); 
    } else {
      return []; 
    }
    
    const snapshot = await getDocs(q);
    const staff = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    } as StaffUser));
    
    return staff;
  }

  static async addStaff(email: string, password: string, displayName: string, role: string, managerId: string | null): Promise<StaffUser> {
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    const newStaff: StaffUser = {
      uid,
      email,
      displayName,
      role,
      managerId,
      monthlyHours: 0,
      monthlySalary: 0,
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
        console.error("LỖI KHI XÓA NHÂN VIÊN:", e);
        throw new Error(`Không thể xóa nhân viên. Lỗi Rules: ${e.code || 'UNKNOWN'}`);
    }
  }
}