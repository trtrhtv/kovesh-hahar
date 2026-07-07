import type { Metadata } from "next";
import { Heebo, Roboto_Mono } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  weight: ["400", "500", "700", "900"],
});

const mono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "סיפור דרך | קהילת הרכיבה לרוכבי שטח",
  description:
    "פלטפורמה חינמית לשיתוף סיפורי רכיבה - אינדורו, סינגלים והארד אינדורו. מסלולים אמיתיים, מהרוכבים, בשבילכם.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${mono.variable}`}>
      <body className="font-heebo antialiased">{children}</body>
    </html>
  );
}
