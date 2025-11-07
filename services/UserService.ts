// services/UserService.ts
import { ID } from "appwrite";
import { account } from "../config/appwrite";

export interface CreateUserPayload {
  email: string;
  password: string;
  displayName: string;
  phoneNumber: string;
  dateOfBirth: string;
}

export class UserService {
  /**
   * 🧑‍💻 Tạo tài khoản người dùng mới (client-side)
   */
  async createUser(payload: CreateUserPayload): Promise<void> {
    const { email, password, displayName, phoneNumber, dateOfBirth } = payload;

    try {
      // 1️⃣ Tạo người dùng mới
      await account.create(ID.unique(), email, password, displayName);

      // 2️⃣ Đăng nhập để tạo session
      await account.createEmailPasswordSession(email, password);

      // 3️⃣ Cập nhật thông tin bổ sung (prefs)
      const formattedPhone = phoneNumber.startsWith("0")
        ? `+84${phoneNumber.substring(1)}`
        : phoneNumber;

      await account.updatePrefs({
        phoneNumber: formattedPhone,
        dateOfBirth: dateOfBirth,
      });

      console.log("✅ Tạo tài khoản thành công cho:", email);
    } catch (error: any) {
      console.error("🔥 Lỗi khi tạo người dùng:", error);
      throw new Error(error.message || "Không thể tạo người dùng.");
    }
  }

  /**
   * 🔐 Đăng nhập bằng email và mật khẩu
   */
  async login(email: string, password: string): Promise<void> {
    try {
      await account.createEmailPasswordSession(email, password);
      console.log("✅ Đăng nhập thành công:", email);
    } catch (error: any) {
      console.error("🔥 Lỗi khi đăng nhập:", error);
      throw new Error(error.message || "Sai email hoặc mật khẩu.");
    }
  }

  /**
   * 🔒 Đăng xuất người dùng hiện tại
   */
  async logout(): Promise<void> {
    try {
      await account.deleteSession("current");
      console.log("✅ Đăng xuất thành công");
    } catch (error: any) {
      console.error("🔥 Lỗi khi đăng xuất:", error);
      throw new Error(error.message || "Không thể đăng xuất.");
    }
  }

  /**
   * 🧾 Cập nhật thông tin người dùng hiện tại
   */
  async updateUserPrefs(data: Record<string, any>): Promise<void> {
    try {
      console.log("Dữ liệu gửi đi để cập nhật prefs:", data); // Log the data
      console.log("Dữ liệu gửi đi để cập nhật prefs:", data); // Log the data
      await account.updatePrefs(data);
      console.log("✅ Cập nhật thông tin cá nhân thành công");
    } catch (error: any) {
      console.error("🔥 Lỗi khi cập nhật prefs:", {
        name: error.name,
        code: error.code,
        type: error.type,
        response: error.response,
        message: error.message,
      });
      throw new Error(error.message || "Không thể cập nhật thông tin cá nhân.");
    }
  }

  /**
   * 👤 Lấy thông tin người dùng hiện tại
   */
  async getCurrentUser() {
    try {
      const user = await account.get();
      return user;
    } catch (error: any) {
      console.error("🔥 Lỗi khi lấy thông tin người dùng:", error);
      return null;
    }
  }
}
