"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";

declare global {
  interface Window {
    google?: any;
  }
}

export default function GoogleSignInButton({
  disabled = false,
  onError,
}: {
  disabled?: boolean;
  onError?: (message: string) => void;
}) {
  const { loginWithGoogle } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;
    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);
  }, [clientId]);

  useEffect(() => {
    if (!scriptLoaded || !clientId || !buttonRef.current || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response: { credential: string }) => {
        try {
          await loginWithGoogle(response.credential);
          window.location.reload();
        } catch (err: any) {
          onError?.(err.message || "התחברות עם גוגל נכשלה");
        }
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      width: 320,
      locale: "he",
    });
  }, [scriptLoaded, clientId, loginWithGoogle, onError]);

  if (!clientId) return null; // התחברות עם גוגל לא מוגדרת - פשוט לא מציגים כלום

  return (
    <div
      className={disabled ? "opacity-40 pointer-events-none" : ""}
      title={disabled ? "יש לאשר קודם את הצהרת האחריות" : undefined}
    >
      <div ref={buttonRef} />
    </div>
  );
}
