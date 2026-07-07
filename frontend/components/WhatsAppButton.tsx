import { formatPhoneForWhatsapp } from "@/lib/phone";

/**
 * מוצג רק אם התורם השאיר מספר טלפון בהרשמה - אין מספר מזויף, אין ניחוש.
 */
export default function WhatsAppButton({
  phoneNumber,
  routeName,
}: {
  phoneNumber?: string | null;
  routeName: string;
}) {
  if (!phoneNumber) return null;

  const formatted = formatPhoneForWhatsapp(phoneNumber);
  const message = `היי, ראיתי את סיפור הדרך שלך באתר "כובש ההר" לגבי מסלול ${routeName}, רציתי לשאול כמה שאלות על השטח...`;
  const url = `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-press w-full flex items-center justify-center gap-2 border border-edge px-6 py-4 min-h-[52px] text-base font-black hover:border-[#25D366] hover:text-[#25D366] hover:shadow-[0_0_20px_rgba(37,211,102,0.35)] transition-colors"
    >
      💬 צור קשר עם התורם ב-WhatsApp
    </a>
  );
}
