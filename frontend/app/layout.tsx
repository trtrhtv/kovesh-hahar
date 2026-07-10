import type { Metadata } from "next";
import { Heebo, Roboto_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import Footer from "@/components/Footer";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import SiteHeader from "@/components/SiteHeader";
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
    "הפלטפורמה החברתית לרוכבי שטח בישראל - סיפורי דרך, אירועי רכיבה, ועדכוני שטח בזמן אמת. מהרוכבים, בשבילכם.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "כובש ההר",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport = {
  themeColor: "#0D0F12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
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
            <SiteHeader />
            <div className="flex-1">{children}</div>
            <Footer />
            <ThemeSwitcher />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
