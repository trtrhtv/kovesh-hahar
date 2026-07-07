import type { Metadata } from "next";
import { Heebo, Roboto_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import Footer from "@/components/Footer";
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
  title: "כובש ההר | קהילת הרכיבה לרוכבי שטח",
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
      <body className="font-heebo antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <div className="flex-1">{children}</div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
