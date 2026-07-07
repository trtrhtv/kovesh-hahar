"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TOKEN_KEY = "roadstory_token";

export type CurrentUser = {
  id: string;
  display_name: string;
  avatar_url?: string;
  home_region?: string;
  phone_number?: string;
  notifications_enabled?: boolean;
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
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async (t: string) => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${t}` },
      credentials: "include",
    });
    if (res.ok) {
      setUser(await res.json());
    } else {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      setToken(stored);
      fetchMe(stored).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchMe]);

  async function login(email: string, password: string) {
    const form = new URLSearchParams();
    form.set("username", email);
    form.set("password", password);
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
      credentials: "include", // מקבלים את ה-httpOnly cookie מהשרת
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "ההתחברות נכשלה");
    }
    const data = await res.json();
    // עדיין שומרים גם ב-localStorage לתאימות לאחור עם קריאות API קיימות שמצרפות
    // Authorization header ידנית - השרת תומך בשתי השיטות במקביל (ראה auth.py).
    localStorage.setItem(TOKEN_KEY, data.access_token);
    setToken(data.access_token);
    await fetchMe(data.access_token);
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
    localStorage.setItem(TOKEN_KEY, data.access_token);
    setToken(data.access_token);
    await fetchMe(data.access_token);
  }

  async function logout() {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
    } catch {
      // גם אם קריאת הרשת נכשלת, עדיין מנקים את המצב המקומי למטה
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  async function refreshUser() {
    if (token) await fetchMe(token);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth חייב לרוץ בתוך AuthProvider");
  return ctx;
}
