// context/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { auth as defaultAuth, db } from '../config/firebase'; 

// --- ĐỊNH NGHĨA TYPES ---

export type UserRole = 'thukho' | 'truongphong' | 'nhanvienkho' | 'nhanvienkd' | 'quanlynansu' | 'unassigned' | 'error' | null;

interface AuthContextValue {
  user: FirebaseUser | null;
  role: UserRole;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// --- LOGIC AUTH PROVIDER ---

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  
  // SỬ DỤNG INSTANCE AUTH MẶC ĐỊNH
  const authInstance = defaultAuth; 

  const fetchUserRole = useCallback(async (firebaseUser: FirebaseUser) => {
    const userDocRef = doc(db, 'user', firebaseUser.uid); 
    console.log('--- DEBUG: Fetching role for UID:', firebaseUser.uid);

    try {
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        const userRole = data?.role && typeof data.role === 'string' 
            ? data.role as UserRole 
            : 'unassigned';
        setRole(userRole);
        console.log('--- DEBUG: Role found:', userRole);
      } else {
        // Document user không tồn tại -> Gán vai trò chưa xác định
        setRole('unassigned');
        console.warn('--- WARN: Role document missing in Firestore. UID:', firebaseUser.uid);
      }
    } catch (error) {
      // BẮT LỖI MẠNG HOẶC LỖI RULES BỊ CHẶN
      console.error("--- FATAL ERROR: Failed to fetch user role (Check Firestore Rules)", error); 
      setRole('error'); 
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
      if (firebaseUser) {
        fetchUserRole(firebaseUser);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [authInstance, fetchUserRole]);

  // Hàm Login và Logout
  const login = useCallback(async (email: string, password: string) => {
    if (!authInstance) return;
    setLoading(true);
    setRole(null);
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
    setRole(null);
  }, [authInstance]);

  const value = { user, role, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};