"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";

export interface UserSession {
  uid: string;
  email: string;
  role: string;
  organizationId: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Helper to fetch current session user info from Next.js server cookie
  const fetchSessionUser = async (): Promise<UserSession | null> => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        return data.user || null;
      }
    } catch (e) {
      console.error("Failed to fetch session user:", e);
    }
    return null;
  };

  const refreshUser = async () => {
    const sessionUser = await fetchSessionUser();
    setUser(sessionUser);
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      // 1. Kiểm tra cookie từ Server trước
      const sessionUser = await fetchSessionUser();
      if (sessionUser && isMounted) {
        setUser(sessionUser);
        setLoading(false);
        return; // Có phiên cookie hợp lệ thì dừng lại, không gọi API sync nữa
      }

      // 2. Nếu Server không có cookie, mới lắng nghe trạng thái Firebase
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!isMounted) return;

        if (!firebaseUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        try {
          // Chỉ sync khi thực sự cần thiết (Client có user nhưng Server chưa có cookie)
          const token = await firebaseUser.getIdToken(false); // Đổi thành false để dùng token hợp lệ hiện tại
          const res = await fetch("/api/auth/sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ idToken: token })
          });

          if (res.ok) {
            const data = await res.json();
            if (isMounted) setUser(data.user);
          } else {
            // Nếu API Server trả về lỗi (token hết hạn), dọn dẹp sạch phiên
            if (isMounted) setUser(null);
          }
        } catch (err) {
          console.error("Auth sync failed inside listener:", err);
          if (isMounted) setUser(null);
        } finally {
          if (isMounted) setLoading(false);
        }
      });

      return unsubscribe;
    };

    let unsubFunction: (() => void) | undefined;
    initAuth().then(unsub => {
      if (unsub) unsubFunction = unsub;
    });

    return () => {
      isMounted = false;
      if (unsubFunction) unsubFunction();
    };
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken(true);

      const res = await fetch("/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ idToken }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);

        // Redirect based on role
        const currentUser = data.user as UserSession;
        if (currentUser.role === "super-admin") {
          router.push("/super-admin/dashboard");
        } else if (currentUser.role === "admin") {
          router.push("/admin/dashboard");
        } else {
          if (!currentUser.organizationId) {
            router.push("/join");
          } else {
            router.push("/dashboard");
          }
        }
      } else {
        throw new Error("Failed to synchronize authentication with PostgreSQL database");
      }
    } catch (error) {
      console.error("Sign in with Google error:", error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Log out error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
