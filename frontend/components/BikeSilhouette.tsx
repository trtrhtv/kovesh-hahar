/**
 * סילואטת אופנוע אנדורו בקפיצה - איור קו מקורי (לא תמונה/צילום), כדי
 * להימנע לגמרי משאלת רישיון. מיועד לשימוש ברקע בשקיפות אולטרה-נמוכה.
 */
export default function BikeSilhouette({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 300" className={className} aria-hidden="true" fill="currentColor">
      <path d="M470 210c0 22-18 40-40 40s-40-18-40-40 18-40 40-40 40 18 40 40Z" />
      <path d="M130 210c0 22-18 40-40 40s-40-18-40-40 18-40 40-40 40 18 40 40Z" />
      <path d="M90 210l60-90 70 10 30-55 90 5-40 70 60 20 60 40" stroke="currentColor" strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M250 130l50 80h100" stroke="currentColor" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M380 70c40-30 90-20 110 10s0 70-30 90" stroke="currentColor" strokeWidth="12" fill="none" strokeLinecap="round" />
      <ellipse cx="330" cy="55" rx="26" ry="20" />
      <path d="M150 120l60-20 20 30" stroke="currentColor" strokeWidth="10" fill="none" strokeLinecap="round" />
      {/* התזת עפר מאחורי הגלגל */}
      <g opacity="0.7">
        <circle cx="520" cy="230" r="6" />
        <circle cx="545" cy="215" r="4" />
        <circle cx="560" cy="245" r="5" />
        <circle cx="500" cy="255" r="4" />
      </g>
    </svg>
  );
}
