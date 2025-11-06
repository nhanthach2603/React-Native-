// context/AuthContext.tsx
import { Models } from 'appwrite';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { account } from '../config/appwrite';

export type UserRole = 'tongquanly' | 'quanlynhansu' | 'truongphong' | 'thukho' | 'nhanvienkd' | 'nhanvienkho' | 'unassigned' | null;

export interface AppwriteUser extends Models.User<Models.Preferences> {
  displayName: string;
  uid: string;
  // Các thuộc tính custom sẽ được lưu trong `prefs`
  // Chúng ta sẽ tạo một interface ảo để dễ truy cập
  role: UserRole;
  managerId: string | null;
  // Thêm các trường khác nếu cần
}

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  currentUser: AppwriteUser | null; // User với thông tin đầy đủ từ prefs
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  currentUser: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [currentUser, setCurrentUser] = useState<AppwriteUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const loggedInUser = await account.get();
        setUser(loggedInUser);
        // Appwrite lưu trữ thông tin custom trong `prefs`
        const userWithDetails: AppwriteUser = {
          ...loggedInUser,
          role: loggedInUser.prefs.role || 'unassigned',
          managerId: loggedInUser.prefs.managerId || null,
          displayName: loggedInUser.name,
          uid: loggedInUser.$id
        };
        setCurrentUser(userWithDetails);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        setUser(null);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const login = async (email: string, pass: string) => {
    await account.createEmailPasswordSession(email, pass);
    const loggedInUser = await account.get();
    setUser(loggedInUser);
    const userWithDetails: AppwriteUser = {
      ...loggedInUser,
      role: loggedInUser.prefs.role || 'unassigned',
      managerId: loggedInUser.prefs.managerId || null,
      displayName: loggedInUser.name,
      uid: loggedInUser.$id
    };
    setCurrentUser(userWithDetails);
  };

  const logout = async () => {
    await account.deleteSession('current');
    setUser(null);
    setCurrentUser(null);
  };

  const value = {
    user,
    currentUser,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};