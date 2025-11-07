// context/AuthContext.tsx
import { Models } from 'appwrite';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { account } from '../config/appwrite';

export type UserRole = 'tongquanly' | 'quanlynhansu' | 'truongphong' | 'thukho' | 'nhanvienkd' | 'nhanvienkho' | 'unassigned' | null;

export interface AppwriteUser extends Models.User<Models.Preferences> {
  avatarUrl: any;
  displayName: string;
  uid: string;
  role: UserRole;
  managerId: string | null;
  phoneNumber: string | null;
  dateOfBirth: string | null;
}

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  currentUser: AppwriteUser | null; 
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  currentUser: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  refreshCurrentUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [currentUser, setCurrentUser] = useState<AppwriteUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshCurrentUser = async () => {
    try {
      const loggedInUser = await account.get();
      console.log("loggedInUser:", loggedInUser);
      console.log("loggedInUser.prefs:", loggedInUser.prefs);
      setUser(loggedInUser);
      const userWithDetails: AppwriteUser = {
        ...loggedInUser,
        role: loggedInUser.prefs.role || 'unassigned',
        managerId: loggedInUser.prefs.managerId || null,
        displayName: loggedInUser.name,
        uid: loggedInUser.$id,
        phoneNumber: loggedInUser.prefs.phoneNumber || null,
        dateOfBirth: loggedInUser.prefs.dateOfBirth || null,
        avatarUrl: loggedInUser.prefs.avatarUrl || undefined, // Assign avatarUrl from prefs
      };
      console.log("userWithDetails:", userWithDetails);
      setCurrentUser(userWithDetails);
    } catch (e) {
      console.error("Failed to refresh current user:", e);
      setUser(null);
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      await refreshCurrentUser();
      setLoading(false);
    };
    checkUser();
  }, []);

  const login = async (email: string, pass: string) => {
    await account.createEmailPasswordSession(email, pass);
    await refreshCurrentUser();
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
    refreshCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};