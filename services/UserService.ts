import { ID } from 'appwrite';
import { account } from '../config/appwrite';

export interface CreateUserPayload {
  email: string;
  password: string;
  displayName: string;
  phoneNumber: string;
  dateOfBirth: string;
}

export const UserService = {
  async createUser(payload: CreateUserPayload): Promise<void> {
    const { email, password, displayName, phoneNumber, dateOfBirth } = payload;
    
    // Bước 1: Tạo người dùng với các thông tin cơ bản.
    await account.create(ID.unique(), email, password, displayName);
    
    // Bước 2: Đăng nhập để tạo session, cần thiết cho việc cập nhật prefs.
    await account.createEmailPasswordSession(email, password);
    
    // Bước 3: Cập nhật thông tin bổ sung (preferences) cho người dùng.
    const formattedPhoneNumber = `+84${phoneNumber.substring(1)}`;
    await account.updatePrefs({
      phone: formattedPhoneNumber,
      dateOfBirth: dateOfBirth,
    });
  },

  async deleteUserByUid(uid: string): Promise<void> {
    try {
      await account.deleteUser(uid);
    } catch (error: any) {
      console.error("Error deleting user:", error);
      throw new Error(error.message || "Không thể xóa người dùng.");
    }
  }
};
