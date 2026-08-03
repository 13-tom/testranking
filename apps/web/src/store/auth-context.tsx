"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { LoginRequest, PublicStudentProfile, PublicUser, RegisterRequest } from "@board-ranking/shared";
import { fetchMe, login as loginRequest, register as registerRequest } from "@/lib/api";
import { clearToken, getToken, setToken as persistToken } from "@/lib/auth-storage";

type AuthResult = { success: boolean; message: string };

type Session = {
  token: string;
  user: PublicUser;
  studentProfile: PublicStudentProfile | null;
};

type AuthContextValue = {
  token: string | null;
  user: PublicUser | null;
  studentProfile: PublicStudentProfile | null;
  isLoading: boolean;
  login: (input: LoginRequest) => Promise<AuthResult>;
  register: (input: RegisterRequest) => Promise<AuthResult>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [studentProfile, setStudentProfile] = useState<PublicStudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getToken();
    if (!stored) {
      setIsLoading(false);
      return;
    }
    fetchMe(stored)
      .then((res) => {
        if (res.success && res.data.studentProfile) {
          setToken(stored);
          setUser(res.data.user);
          setStudentProfile(res.data.studentProfile);
        } else {
          clearToken();
        }
      })
      .catch(() => clearToken())
      .finally(() => setIsLoading(false));
  }, []);

  const applySession = (data: Session) => {
    persistToken(data.token);
    setToken(data.token);
    setUser(data.user);
    setStudentProfile(data.studentProfile);
  };

  const login = useCallback(async (input: LoginRequest): Promise<AuthResult> => {
    const res = await loginRequest(input);
    if (res.success) {
      applySession(res.data);
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message };
  }, []);

  const register = useCallback(async (input: RegisterRequest): Promise<AuthResult> => {
    const res = await registerRequest(input);
    if (res.success) {
      applySession(res.data);
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message };
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setToken(null);
    setUser(null);
    setStudentProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, studentProfile, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
