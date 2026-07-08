"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type CurrentUser = {
  id: string;
  display_name: string;
  avatar_url?: string;
  home_region?: string;
  phone_number?: string;
  notifications_enabled?: boolean;
  email_verified?: boolean;
  bikes?: { id: string; model_name: string; vehicle_type?: string }[];
};

type AuthContextType = {
  user: CurrentUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string,
    acceptedDisclaimer: boolean,
    phoneNumber?: string,
    username?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // token נשאר כאן רק בזיכרון (לא ב-localStorage) - נועד להצגה/תאימות עם
  // רכיבים קיימים שעדיין מצפים לערך truthy כדי לדעת "האם מחובר", אבל האימות
  // האמיתי מול השרת קורה כולו דרך ה-httpOnly cookie (credentials: "include").
  // בלי localStorage, אין שום עותק של הטוקן שקוד JavaScript יכול לגנוב.
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const res = await fetch(`${API_BASE}/auth/me`, { credentials: "include" });
    if (res.ok) {
      setUser(await res.json());
      // token עצמו לא נחשף לנו יותר (הוא ב-httpOnly cookie, בכוונה) - אבל כמה
      // רכיבים קיימים עדיין בודקים "if (token)" כדי לדעת אם המשתמש מחובר.
      // שם placeholder לא-ריק שומר על ההתנהגות הזו בלי לחשוף שום דבר אמיתי.
      setToken((prev) => prev || "authenticated");
    } else {
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // בעליית הדף אין לנו טוקן בזיכרון (זה טרי בכל טעינה) - אבל אם יש עוגיית
    // התחברות תקינה מפעם קודמת, fetchMe יזהה את זה דרך credentials:"include"
    fetchMe().finally(() => setLoading(false));
  }, [fetchMe]);

  async function login(email: string, password: string) {
    const form = new URLSearchParams();
    form.set("username", email);
    form.set("password", password);
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
      credentials: "include", // מקבלים את ה-httpOnly cookie מהשרת - זה מה שבאמת מבצע את ההתחברות
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "ההתחברות נכשלה");
    }
    const data = await res.json();
    setToken(data.access_token);
    await fetchMe();
  }

  async function register(
    email: string,
    password: string,
    displayName: string,
    acceptedDisclaimer: boolean,
    phoneNumber?: string,
    username?: string
  ) {
    if (!acceptedDisclaimer) {
      throw new Error("יש לאשר את הצהרת האחריות כדי להירשם");
    }
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        display_name: displayName,
        accepted_disclaimer: acceptedDisclaimer,
        phone_number: phoneNumber || undefined,
        username: username || undefined,
      }),
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "ההרשמה נכשלה");
    }
    const data = await res.json();
    setToken(data.access_token);
    await fetchMe();
  }

  async function logout() {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
    } catch {
      // גם אם קריאת הרשת נכשלת, עדיין מנקים את המצב המקומי למטה
    }
    setToken(null);
    setUser(null);
  }

  async function refreshUser() {
    await fetchMe();
  }

  async function loginWithGoogle(idToken: string) {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_token: idToken }),
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "התחברות עם גוגל נכשלה");
    }
    const data = await res.json();
    setToken(data.access_token);
    await fetchMe();
  }

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, refreshUser, loginWithGoogle }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth חייב לרוץ בתוך AuthProvider");
  return ctx;
}
