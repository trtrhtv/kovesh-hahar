import type { Metadata } from "next";
import { Heebo, Roboto_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import Footer from "@/components/Footer";
import ThemeSwitcher from "@/components/ThemeSwitcher";
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
    <html lang="he" dir="rtl" data-theme="oled" className={`${heebo.variable} ${mono.variable}`}>
      <body className="font-heebo antialiased min-h-screen flex flex-col">
        <div className="livery-stripe h-[3px] w-full shrink-0" />
        <ThemeProvider>
          <AuthProvider>
            <div className="flex-1">{children}</div>
            <Footer />
            <ThemeSwitcher />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
