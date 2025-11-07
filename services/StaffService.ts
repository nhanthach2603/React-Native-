// services/StaffService.tsx
import { Account, Databases, Functions, Query } from "appwrite";
import { account, config, databases, functions } from "../config/appwrite";
import { ChatService } from "./ChatService";

/* NOTE: re-export UserRole nếu dùng nơi khác */
export type UserRole = "tongquanly" | "quanlynhansu" | "truongphong" | "thukho" | "nhanvien" | "unassigned";

export interface StaffUser {
  uid: string;
  email?: string;
  displayName?: string;
  role?: UserRole;
  monthlyHours?: number;
  monthlySalary?: number;
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
  static getStaffByRole(arg0: string) {
    throw new Error('Method not implemented.');
  }
  static getStaffList(uid: any, role: string, managerId: string | null) {
    throw new Error('Method not implemented.');
  }
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
      // Thay bằng URL thực tế xử lý reset password trong app / web của bạn
      await this.account.createRecovery(email, "https://yourapp.example/reset-password");
    } catch (error: any) {
      console.error("Error in StaffService.resetPassword:", error);
      throw new Error("Không thể gửi email đặt lại mật khẩu do lỗi không xác định.");
    }
  }

  private mapDocToStaff(doc: any): StaffUser {
    return {
      uid: doc.$id,
      email: doc.email,
      displayName: doc.displayName ?? doc.name ?? "",
      role: doc.role,
      monthlyHours: doc.monthlyHours ?? 0,
      monthlySalary: doc.monthlySalary ?? 0,
      managerId: doc.managerId ?? null,
      createdAt: doc.$createdAt,
      schedule: doc.schedule ?? {},
      phoneNumber: doc.phoneNumber,
      dateOfBirth: doc.dateOfBirth,
      avatarUrl: doc.avatarUrl,
      hourlyRate: doc.hourlyRate ?? 0,
      address: doc.address,
    };
  }

  /**
   * Trả về danh sách nhân viên có schedule.
   * Nếu attribute để sắp xếp (displayName) không hợp lệ => fallback orderDesc('$createdAt')
   */
  async getAllStaffWithSchedule(): Promise<StaffUser[]> {
    try {
      // Thử order theo displayName; nếu server trả lỗi attribute not found, catch bên dưới và thử theo createdAt
      try {
        const response = await this.databases.listDocuments(this.databaseId, this.userCollectionId, [
          Query.notEqual("role", "unassigned"),
          Query.orderAsc("displayName"),
        ]);
        return (response.documents || []).map((d: any) => this.mapDocToStaff(d));
      } catch (err: any) {
        const msg = (err && err.message) || "";
        if (msg.toLowerCase().includes("attribute not found") || msg.toLowerCase().includes("invalid query")) {
          // fallback
          const response = await this.databases.listDocuments(this.databaseId, this.userCollectionId, [
            Query.notEqual("role", "unassigned"),
            Query.orderDesc("$createdAt"),
          ]);
          return (response.documents || []).map((d: any) => this.mapDocToStaff(d));
        }
        throw err;
      }
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
    if (!currentUserUid || !currentUserRole) return [];

    const isTopLevelManagement = currentUserRole === "tongquanly" || currentUserRole === "quanlynhansu";

    if (isTopLevelManagement) {
      const response = await this.databases.listDocuments(this.databaseId, this.userCollectionId);
      return (response.documents || [])
        .map((d: any) => this.mapDocToStaff(d))
        .filter((u) => u.uid !== currentUserUid);
    } else if (currentUserRole === "truongphong" || currentUserRole === "thukho") {
      const staffQuery = this.databases.listDocuments(this.databaseId, this.userCollectionId, [
        Query.equal("managerId", currentUserUid),
      ]);
      const unassignedQuery = this.databases.listDocuments(this.databaseId, this.userCollectionId, [
        Query.equal("role", "unassigned"),
      ]);

      const [staffResponse, unassignedResponse] = await Promise.all([staffQuery, unassignedQuery]);
      const staffList = (staffResponse.documents || []).map((d: any) => this.mapDocToStaff(d));
      const unassignedList = (unassignedResponse.documents || []).map((d: any) => this.mapDocToStaff(d));
      return [...staffList, ...unassignedList];
    }

    return [];
  }

  async getManagers(): Promise<StaffUser[]> {
    // Nếu SDK không hỗ trợ equal với mảng, dùng Query.or
    try {
      // Prefer OR form to be safe
      const response = await this.databases.listDocuments(this.databaseId, this.userCollectionId, [
        Query.or([Query.equal("role", "truongphong"), Query.equal("role", "thukho")]),
      ]);
      return (response.documents || []).map((d: any) => this.mapDocToStaff(d));
    } catch (err) {
      // fallback đơn giản: lấy tất cả, filter phía client
      console.warn("Warning getManagers fallback:", err);
      const response = await this.databases.listDocuments(this.databaseId, this.userCollectionId);
      return (response.documents || [])
        .map((d: any) => this.mapDocToStaff(d))
        .filter((s) => s.role === "truongphong" || s.role === "thukho");
    }
  }

  async getStaffByRole(role: UserRole): Promise<StaffUser[]> {
    const response = await this.databases.listDocuments(this.databaseId, this.userCollectionId, [Query.equal("role", role)]);
    return (response.documents || []).map((d: any) => this.mapDocToStaff(d));
  }

  async updateStaff(uid: string, data: Partial<StaffUser>) {
    let currentUserData: StaffUser | null = null;
    try {
      const userDoc = await this.databases.getDocument(this.databaseId, this.userCollectionId, uid);
      currentUserData = this.mapDocToStaff(userDoc);
    } catch (error) {
      console.warn(`User with uid ${uid} not found for update. Proceeding to create if needed.`, error);
    }

    // xử lý chuyển manager => cập nhật chat phòng ban
    if (currentUserData && data.managerId !== undefined && data.managerId !== currentUserData.managerId) {
      const oldManagerId = currentUserData.managerId || null;
      const newManagerId = data.managerId || null;
      try {
        await ChatService.updateUserDepartmentChat(uid, oldManagerId, newManagerId);
      } catch (err) {
        console.error("Warning: ChatService.updateUserDepartmentChat failed:", err);
      }
    }

    // tạo phòng chat nếu được gán vai trò quản lý
    if (data.role && (data.role === "truongphong" || data.role === "thukho")) {
      if (!currentUserData || !(currentUserData.role === "truongphong" || currentUserData.role === "thukho")) {
        const managerName = (data.displayName || currentUserData?.displayName || "Quản lý");
        try {
          await ChatService.createDepartmentChat(uid, managerName);
        } catch (err) {
          console.error("Warning: ChatService.createDepartmentChat failed:", err);
        }
      }
    }

    // Cập nhật document (Appwrite updateDocument sẽ fail nếu document không tồn tại)
    try {
      await this.databases.updateDocument(this.databaseId, this.userCollectionId, uid, data as any);
    } catch (err) {
      // Nếu document không tồn tại, bạn có thể createDocument nếu muốn:
      // await this.databases.createDocument(this.databaseId, this.userCollectionId, uid, data as any);
      console.error("Error updating staff:", err);
      throw err;
    }
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
      const userData = this.mapDocToStaff(userDoc);
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
      throw new Error("User not found or error updating check-in data.");
    }
  }

  async assignSchedule(uid: string, date: string, shift: string, note: string) {
    try {
      const userDoc = await this.databases.getDocument(this.databaseId, this.userCollectionId, uid);
      const userData = this.mapDocToStaff(userDoc);
      const currentSchedule = { ...(userData.schedule || {}) };
      currentSchedule[date] = { shift, note };
      await this.databases.updateDocument(this.databaseId, this.userCollectionId, uid, { schedule: currentSchedule });
    } catch (error) {
      console.error("Error assigning schedule:", error);
      throw new Error("User not found or error updating schedule.");
    }
  }

  async assignBulkSchedule(uid: string, dates: string[], shift: string, note: string) {
    try {
      const userDoc = await this.databases.getDocument(this.databaseId, this.userCollectionId, uid);
      const userData = this.mapDocToStaff(userDoc);
      const currentSchedule = { ...(userData.schedule || {}) };
      dates.forEach((date) => {
        currentSchedule[date] = { shift, note };
      });
      await this.databases.updateDocument(this.databaseId, this.userCollectionId, uid, { schedule: currentSchedule });
    } catch (error) {
      console.error("Error assigning bulk schedule:", error);
      throw new Error("User not found or error updating bulk schedule.");
    }
  }
}

//export { UserRole };
