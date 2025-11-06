import { Account } from 'appwrite';
import { client } from '../config/appwrite';

export const UserService = {
  async deleteUserByUid(uid: string): Promise<void> {
    try {
      const account = new Account(client);
      await account.deleteUser(uid);
    } catch (error: any) {
      console.error("Error deleting user:", error);
      throw new Error(error.message || "Không thể xóa người dùng.");
    }
  }
};