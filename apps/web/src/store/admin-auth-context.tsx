"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { AuthResponseData, PublicUser } from "@board-ranking/shared";
import { clearAdminSession, getAdminSession, setAdminSession } from "@/lib/admin-auth-storage";

type AdminAuthContextValue = {
  token: string | null;
  user: PublicUser | null;
  isLoading: boolean;
  setSession: (data: AuthResponseData) => void;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

type Session = { token: string; user: PublicUser };

// BR-047: there is no admin-audience "whoami" endpoint, so unlike the
// student AuthProvider (which re-validates its token against /auth/me on
// mount), this session is restored directly from localStorage and trusted
// until an API call 401s — matching BR-046's "no refresh-token rotation"
// simplicity already accepted for admin auth. The restore still happens in
// useEffect (not a useState initializer) so the client's first render
// matches the server-rendered (session-less) markup and avoids a
// hydration mismatch.
export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setLocalSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setLocalSession(getAdminSession());
    setIsLoading(false);
  }, []);

  const setSession = useCallback((data: AuthResponseData) => {
    setAdminSession({ token: data.token, user: data.user });
    setLocalSession({ token: data.token, user: data.user });
  }, []);

  const logout = useCallback(() => {
    clearAdminSession();
    setLocalSession(null);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{ token: session?.token ?? null, user: session?.user ?? null, isLoading, setSession, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return ctx;
}
