"use client";

import { useAuth } from "@/lib/auth";

export default function ProfileOwnerActions({ profileUserId }: { profileUserId: string }) {
  const { user, logout } = useAuth();

  if (!user || user.id !== profileUserId) return null;

  return (
    <button onClick={logout} className="text-xs text-textDim hover:text-moto underline">
      התנתק
    </button>
  );
}
