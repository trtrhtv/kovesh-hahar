"use client";

import { useState } from "react";

export default function PasswordInput({
  value,
  onChange,
  placeholder = "סיסמה",
  minLength,
  required,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minLength?: number;
  required?: boolean;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        minLength={minLength}
        required={required}
        className={`w-full border border-edge bg-surface px-3 py-2.5 pl-16 focus:border-moto outline-none ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-textDim hover:text-moto"
        tabIndex={-1}
      >
        {visible ? "הסתר" : "הצג"}
      </button>
    </div>
  );
}
