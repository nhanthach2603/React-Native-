// context/AuthContext.tsx

import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { db, auth as defaultAuth } from '../config/firebase';
import { StaffUser } from '../services/StaffService'; // Import StaffUser

// --- ĐỊNH NGHĨA TYPES ---

export type UserRole = 'quanlynhansu' | 'thukho' | 'truongphong' | 'nhanvienkho' | 'nhanvienkd' | 'unassigned' | 'error' | null;

interface AuthContextValue {
  user: FirebaseUser | null;
  currentUser: StaffUser | null; // Thay thế role bằng currentUser
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>; // Thêm hàm refresh
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// --- LOGIC AUTH PROVIDER ---

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  // SỬ DỤNG INSTANCE AUTH MẶC ĐỊNH
  const authInstance = defaultAuth; 

  const fetchUserProfile = useCallback(async (firebaseUser: FirebaseUser) => {
    const userDocRef = doc(db, 'user', firebaseUser.uid); // Sửa lại thành 'user' (số ít) cho đúng với Firestore
    console.log('--- DEBUG: Fetching role for UID:', firebaseUser.uid);

    try {
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        // SỬA LỖI: Gộp ID của document (chính là UID) vào dữ liệu người dùng.
        // userDoc.data() không tự động bao gồm ID.
        const userData = { uid: firebaseUser.uid, ...userDoc.data() } as StaffUser; // Gộp uid vào đây
        setCurrentUser(userData);
        console.log('--- DEBUG: User profile found:', userData.role);
      } else {
        // Document user không tồn tại -> Gán vai trò chưa xác định
        setCurrentUser({ role: 'unassigned' } as StaffUser); // Tạo user tạm
        console.warn('--- WARN: Role document missing in Firestore. UID:', firebaseUser.uid);
      }
    } catch (error) {
      // BẮT LỖI MẠNG HOẶC LỖI RULES BỊ CHẶN
      console.error("--- FATAL ERROR: Failed to fetch user role (Check Firestore Rules)", error); 
      setCurrentUser({ role: 'error' } as StaffUser); // Tạo user tạm
    }
    
    // RẤT QUAN TRỌNG: Đảm bảo setLoading(false) LUÔN được gọi
    setLoading(false); 
    console.log('--- DEBUG: Loading set to false. Auth flow complete.');
  }, []);

  // Lắng nghe trạng thái Auth
  useEffect(() => {
    const authToUse = authInstance; 

    const unsubscribe = onAuthStateChanged(authToUse, (firebaseUser) => {
      setUser(firebaseUser);
      setCurrentUser(null); // Reset user profile
      if (firebaseUser) {
        fetchUserProfile(firebaseUser);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [authInstance, fetchUserProfile]);

  // Hàm Login và Logout
  const login = useCallback(async (email: string, password: string) => {
    if (!authInstance) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(authInstance, email, password);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, [authInstance]);

  const logout = useCallback(async () => {
    if (!authInstance) return;
    await signOut(authInstance);
    setUser(null);
    setCurrentUser(null);
  }, [authInstance]);

  // Hàm để refresh dữ liệu người dùng theo yêu cầu
  const refreshCurrentUser = useCallback(async () => {
    if (user) {
      console.log('--- DEBUG: Refreshing current user profile...');
      setLoading(true); // Hiển thị loading trong khi refresh
      await fetchUserProfile(user);
    }
  }, [user, fetchUserProfile]);


  const value = { user, currentUser, loading, login, logout, refreshCurrentUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Tiện ích để lấy role một cách an toàn
export const useRole = () => {
    const { currentUser } = useAuth();
    return currentUser?.role ?? null;
};