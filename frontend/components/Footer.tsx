import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-char/15 mt-auto">
      <div className="max-w-5xl mx-auto px-5 py-6 flex flex-col gap-3">
        <p className="text-xs text-char/50 leading-relaxed">
          כובש ההר אינו אחראי על תוכן המסלולים, תנאי השטח, או חוקיות המעבר בהם. הרכיבה
          היא על אחריות הרוכב בלבד. יש לבדוק שטחי אש פעילים, אישורי מעבר בשמורות טבע,
          ותנאי שטח עדכניים מול הגורמים הרלוונטיים לפני היציאה לשטח.
        </p>
        <Link href="/contact" className="text-xs font-bold text-oxide hover:underline w-fit">
          צור קשר
        </Link>
      </div>
    </footer>
  );
}
