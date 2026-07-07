/**
 * wa.me דורש מספר בפורמט בינלאומי, ספרות בלבד, בלי + או 0 מוביל.
 * הופך "050-1234567" / "0501234567" ל-"972501234567".
 */
export function formatPhoneForWhatsapp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("972")) return digits;
  if (digits.startsWith("0")) return "972" + digits.slice(1);
  return digits;
}
