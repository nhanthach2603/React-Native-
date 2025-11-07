import { Account, Databases, Functions, Query } from "appwrite";
import { account, config, databases, functions } from "../config/appwrite";
import { UserRole } from "../context/AuthContext";
import { ChatService } from "./ChatService";

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
  static getStaffByRole(arg0: string): StaffUser[] | PromiseLike<StaffUser[]> {
    throw new Error('Method not implemented.');
  }
  static getStaffList($id: string, role: string, managerIdToUse: string): StaffUser[] | PromiseLike<StaffUser[]> {
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

  async resetPassword(email: string): Promise<void> {
    try {
      await this.account.createRecovery(email, "https://yourapp.example/reset-password");
    } catch (error: any) {
      console.error("Error in StaffService.resetPassword:", error);
      throw new Error("Không thể gửi email đặt lại mật khẩu.");
    }
  }

  async getAllStaffWithSchedule(): Promise<StaffUser[]> {
    try {
      try {
        const response = await this.databases.listDocuments(this.databaseId, this.userCollectionId, [
          Query.notEqual("role", "unassigned"),
          Query.orderAsc("displayName"),
        ]);
        return (response.documents || []).map((d: any) => this.mapDocToStaff(d));
      } catch (err: any) {
        if (
          err?.message?.toLowerCase().includes("attribute not found") ||
          err?.message?.toLowerCase().includes("invalid query")
        ) {
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

    const isTopLevelManagement = ["tongquanly", "quanlynhansu"].includes(currentUserRole);

    if (isTopLevelManagement) {
      const response = await this.databases.listDocuments(this.databaseId, this.userCollectionId);
      return (response.documents || [])
        .map((d: any) => this.mapDocToStaff(d))
        .filter((u) => u.uid !== currentUserUid);
    } else if (["truongphong", "thukho"].includes(currentUserRole)) {
      const [staffResponse, unassignedResponse] = await Promise.all([
        this.databases.listDocuments(this.databaseId, this.userCollectionId, [
          Query.equal("managerId", currentUserUid),
        ]),
        this.databases.listDocuments(this.databaseId, this.userCollectionId, [
          Query.equal("role", "unassigned"),
        ]),
      ]);

      const staffList = (staffResponse.documents || []).map((d: any) => this.mapDocToStaff(d));
      const unassignedList = (unassignedResponse.documents || []).map((d: any) => this.mapDocToStaff(d));

      return [...staffList, ...unassignedList];
    }

    return [];
  }

  async getManagers(): Promise<StaffUser[]> {
    try {
      const response = await this.databases.listDocuments(this.databaseId, this.userCollectionId, [
        Query.or([Query.equal("role", "truongphong"), Query.equal("role", "thukho")]),
      ]);
      return (response.documents || []).map((d: any) => this.mapDocToStaff(d));
    } catch (err) {
      console.warn("Warning getManagers fallback:", err);
      const response = await this.databases.listDocuments(this.databaseId, this.userCollectionId);
      return (response.documents || [])
        .map((d: any) => this.mapDocToStaff(d))
        .filter((s) => s.role === "truongphong" || s.role === "thukho");
    }
  }

  async getStaffByRole(role?: UserRole): Promise<StaffUser[]> {
    if (!role || role === "unassigned") return [];

    const response = await this.databases.listDocuments(this.databaseId, this.userCollectionId, [
      Query.equal("role", role),
    ]);
    return (response.documents || []).map((d: any) => this.mapDocToStaff(d));
  }

  async updateStaff(uid: string, data: Partial<StaffUser>) {
    let currentUserData: StaffUser | null = null;

    try {
      const userDoc = await this.databases.getDocument(this.databaseId, this.userCollectionId, uid);
      currentUserData = this.mapDocToStaff(userDoc);
    } catch (error) {
      console.warn(`User ${uid} not found. Proceeding to create if needed.`, error);
    }

    if (currentUserData && data.managerId !== undefined && data.managerId !== currentUserData.managerId) {
      try {
        await ChatService.updateUserDepartmentChat(uid, currentUserData.managerId ?? null, data.managerId ?? null);
      } catch (err) {
        console.error("ChatService.updateUserDepartmentChat failed:", err);
      }
    }

    if (data.role && ["truongphong", "thukho"].includes(data.role)) {
      if (!currentUserData || !["truongphong", "thukho"].includes(currentUserData.role || "")) {
        try {
          const managerName = data.displayName || currentUserData?.displayName || "Quản lý";
          await ChatService.createDepartmentChat(uid, managerName);
        } catch (err) {
          console.error("ChatService.createDepartmentChat failed:", err);
        }
      }
    }

    try {
      await this.databases.updateDocument(this.databaseId, this.userCollectionId, uid, data as any);
    } catch (err) {
      console.error("Error updating staff:", err);
      throw err;
    }
  }

  async deleteStaff(uid: string): Promise<void> {
    try {
      await this.databases.deleteDocument(this.databaseId, this.userCollectionId, uid);
    } catch (error: any) {
      console.error("Error deleting staff:", error);
      throw new Error(error.message || "Không thể xóa người dùng.");
    }
  }

  async checkIn(uid: string) {
    try {
      const userDoc = await this.databases.getDocument(this.databaseId, this.userCollectionId, uid);
      const userData = this.mapDocToStaff(userDoc);
      const hoursToAdd = 8;
      await this.databases.updateDocument(this.databaseId, this.userCollectionId, uid, {
        monthlyHours: (userData.monthlyHours || 0) + hoursToAdd,
        monthlySalary: (userData.monthlySalary || 0) + hoursToAdd * (userData.hourlyRate || 0),
      });
    } catch (error) {
      console.error("Error checking in staff:", error);
      throw new Error("Không thể cập nhật giờ công.");
    }
  }

  async assignSchedule(uid: string, date: string, shift: string, note: string) {
    try {
      const userDoc = await this.databases.getDocument(this.databaseId, this.userCollectionId, uid);
      const userData = this.mapDocToStaff(userDoc);
      const schedule = { ...(userData.schedule || {}) };
      schedule[date] = { shift, note };
      await this.databases.updateDocument(this.databaseId, this.userCollectionId, uid, { schedule });
    } catch (error) {
      console.error("Error assigning schedule:", error);
      throw new Error("Không thể cập nhật lịch làm việc.");
    }
  }

  async assignBulkSchedule(uid: string, dates: string[], shift: string, note: string) {
    try {
      const userDoc = await this.databases.getDocument(this.databaseId, this.userCollectionId, uid);
      const userData = this.mapDocToStaff(userDoc);
      const schedule = { ...(userData.schedule || {}) };
      dates.forEach((date) => (schedule[date] = { shift, note }));
      await this.databases.updateDocument(this.databaseId, this.userCollectionId, uid, { schedule });
    } catch (error) {
      console.error("Error assigning bulk schedule:", error);
      throw new Error("Không thể cập nhật lịch hàng loạt.");
    }
  }
}
export { UserRole };

