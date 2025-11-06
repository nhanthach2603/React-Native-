// services/StaffService.tsx
import { Account, Databases, Functions, Query } from 'appwrite';
import { account, config, databases, functions } from '../config/appwrite';
import { UserRole } from '../context/AuthContext';
import { ChatService } from './ChatService';

export interface StaffUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  monthlyHours: number;
  monthlySalary: number;
  managerId?: string | null;
  createdAt?: string;
  schedule?: { [date: string]: { shift: string; note: string } };
  phoneNumber?: string;
  dateOfBirth?: string;
  avatarUrl?: string;
  hourlyRate?: number;
  address?: string;
}

export class StaffService {
  private databases: Databases;
  private account: Account;
  private functions: Functions;
  private databaseId: string;
  private userCollectionId: string;

  constructor() {
    this.databases = databases;
    this.account = account;
    this.functions = functions;
    this.databaseId = config.databaseId;
    this.userCollectionId = config.userCollectionId;
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await this.account.createRecovery(email, 'YOUR_RESET_PASSWORD_URL'); // Replace with your actual reset password URL
    } catch (error: any) {
      console.error("Error in StaffService.resetPassword:", error);
      throw new Error("Không thể gửi email đặt lại mật khẩu do lỗi không xác định.");
    }
  }

  async getAllStaffWithSchedule(): Promise<StaffUser[]> {
    try {
      const response = await this.databases.listDocuments(
        this.databaseId,
        this.userCollectionId,
        [
          Query.notEqual('role', 'unassigned'),
          Query.orderAsc('displayName') // Assuming a display name for ordering
        ]
      );
      if (response.documents.length === 0) {
        return [];
      }
      return response.documents.map(doc => ({ uid: doc.$id, ...doc as unknown as StaffUser }));
    } catch (error) {
      console.error("Error getting all staff with schedule: ", error);
      throw new Error("Không thể tải danh sách nhân viên.");
    }
  }

  async getStaffList(
    currentUserUid: string,
    currentUserRole: UserRole,
    currentUserManagerId: string | null | undefined
  ): Promise<StaffUser[]> {
    if (!currentUserUid || !currentUserRole) {
      return [];
    }

    const isTopLevelManagement = currentUserRole === 'tongquanly' || currentUserRole === 'quanlynhansu';

    if (isTopLevelManagement) {
      const response = await this.databases.listDocuments(
        this.databaseId,
        this.userCollectionId
      );
      return response.documents
        .map(doc => ({ uid: doc.$id, ...doc as unknown as StaffUser }))
        .filter(user => user.uid !== currentUserUid);
    } else if (currentUserRole === 'truongphong' || currentUserRole === 'thukho') {
      const staffQuery = this.databases.listDocuments(
        this.databaseId,
        this.userCollectionId,
        [Query.equal('managerId', currentUserUid)]
      );
      const unassignedQuery = this.databases.listDocuments(
        this.databaseId,
        this.userCollectionId,
        [Query.equal('role', 'unassigned')] // Assuming 'unassigned' is a valid role for unassigned staff
      );
  
      const [staffResponse, unassignedResponse] = await Promise.all([staffQuery, unassignedQuery]);
  
      const staffList = staffResponse.documents.map(doc => ({ uid: doc.$id, ...doc as unknown as StaffUser }));
      const unassignedList = unassignedResponse.documents.map(doc => ({ uid: doc.$id, ...doc as unknown as StaffUser }));
      
      return [...staffList, ...unassignedList];
    }

    return [];
  }

  async getManagers(): Promise<StaffUser[]> { 
    const response = await this.databases.listDocuments(
      this.databaseId,
      this.userCollectionId,
      [Query.equal('role', ['truongphong', 'thukho'])]
    );
    return response.documents.map(doc => ({ uid: doc.$id, ...doc as unknown as StaffUser }));
  }

  async getStaffByRole(role: UserRole): Promise<StaffUser[]> {
    const response = await this.databases.listDocuments(
      this.databaseId,
      this.userCollectionId,
      [Query.equal('role', role)]
    );
    return response.documents.map(doc => ({ uid: doc.$id, ...doc as unknown as StaffUser }));
  }

  async updateStaff(uid: string, data: Partial<StaffUser>) {
    let currentUserData: StaffUser | null = null;
    try {
      const userDoc = await this.databases.getDocument(this.databaseId, this.userCollectionId, uid);
      currentUserData = { uid: userDoc.$id, ...userDoc as unknown as StaffUser };
    } catch (error) {
      console.warn(`User with uid ${uid} not found for update. Creating new user.`);
      // If document not found, currentUserData remains null, and we proceed to create if needed.
    }

    // Logic để xử lý thay đổi managerId và cập nhật phòng chat phòng ban
    if (currentUserData && data.managerId !== undefined && data.managerId !== currentUserData.managerId) {
      const oldManagerId = currentUserData.managerId || null;
      const newManagerId = data.managerId || null;
      await ChatService.updateUserDepartmentChat(uid, oldManagerId, newManagerId);
    }

    // Logic để tạo phòng chat phòng ban nếu người dùng được gán vai trò quản lý
    if (data.role && (data.role === 'truongphong' || data.role === 'thukho')) {
      // Chỉ tạo nếu chưa có phòng ban hoặc vai trò mới được gán
      if (!currentUserData || !(currentUserData.role === 'truongphong' || currentUserData.role === 'thukho')) {
        const managerName = data.displayName || currentUserData?.displayName;
        await ChatService.findOrCreateDepartmentChat(uid, managerName);
      }
    }

    await this.databases.updateDocument(this.databaseId, this.userCollectionId, uid, data);
  }

  async deleteStaff(uid: string): Promise<void> {
    try {
      await this.databases.deleteDocument(this.databaseId, this.userCollectionId, uid);
    } catch (error: any) {
      console.error("Error deleting staff document:", error);
      throw new Error(error.message || "Không thể xóa người dùng.");
    }
  }

  async checkIn(uid: string) {
    try {
      const userDoc = await this.databases.getDocument(this.databaseId, this.userCollectionId, uid);
      const userData = { uid: userDoc.$id, ...userDoc as unknown as StaffUser };
      const monthlyHours = userData.monthlyHours || 0;
      const monthlySalary = userData.monthlySalary || 0;
      const userHourlyRate = userData.hourlyRate || 0;

      const hoursToAdd = 8;

      await this.databases.updateDocument(this.databaseId, this.userCollectionId, uid, {
        monthlyHours: monthlyHours + hoursToAdd,
        monthlySalary: monthlySalary + hoursToAdd * userHourlyRate,
      });
    } catch (error) {
      console.error("Error checking in staff:", error);
      throw new Error('User not found or error updating check-in data.');
    }
  }

  async assignSchedule(
    uid: string,
    date: string,
    shift: string,
    note: string
  ) {
    try {
      const userDoc = await this.databases.getDocument(this.databaseId, this.userCollectionId, uid);
      const userData = { uid: userDoc.$id, ...userDoc as unknown as StaffUser };
      const currentSchedule = userData.schedule || {};
      const newSchedule = {
        ...currentSchedule,
        [date]: { shift, note },
      };
      await this.databases.updateDocument(this.databaseId, this.userCollectionId, uid, { schedule: newSchedule });
    } catch (error) {
      console.error("Error assigning schedule:", error);
      throw new Error('User not found or error updating schedule.');
    }
  }

  async assignBulkSchedule(
    uid: string,
    dates: string[],
    shift: string,
    note: string
  ) {
    try {
      const userDoc = await this.databases.getDocument(this.databaseId, this.userCollectionId, uid);
      const userData = { uid: userDoc.$id, ...userDoc as unknown as StaffUser };
      const currentSchedule = userData.schedule || {};
      dates.forEach(date => {
        currentSchedule[date] = { shift, note };
      });
      await this.databases.updateDocument(this.databaseId, this.userCollectionId, uid, { schedule: currentSchedule });
    } catch (error) {
      console.error("Error assigning bulk schedule:", error);
      throw new Error('User not found or error updating bulk schedule.');
    }
  }
}

export {
  UserRole
};

