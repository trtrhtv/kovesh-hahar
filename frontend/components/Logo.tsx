export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M2 19L9 6L13 13L16 8L22 19H2Z" fill="#FF6600" />
        <path
          d="M2 19L9 6L13 13L16 8L22 19"
          stroke="#12161A"
          strokeWidth="1"
          strokeLinejoin="round"
          fill="none"
          opacity="0.2"
        />
        <path d="M5.5 19L9 12.5L11 15.5" stroke="#12161A" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <span className="font-black text-lg tracking-tight text-white">כובש ההר</span>
    </span>
  );
}
