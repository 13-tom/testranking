import type { PublicUser } from "@board-ranking/shared";

const SESSION_KEY = "board-ranking-admin-session";

type AdminSession = {
  token: string;
  user: PublicUser;
};

export function getAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

export function setAdminSession(session: AdminSession): void {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearAdminSession(): void {
  window.localStorage.removeItem(SESSION_KEY);
}
