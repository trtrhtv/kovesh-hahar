// hostname: "**" הופך את מנפיק התמונות של Next ל-proxy פתוח (SSRF/ניצול רוחב-פס):
// /_next/image?url=https://anything מושך כל URL דרך השרת. מתירים רק את המקורות
// האמיתיים: R2 (**.r2.dev), הדומיין של ה-backend (משם מוגשות תמונות במצב אחסון מקומי),
// וכל דומיין מדיה מותאם דרך NEXT_PUBLIC_MEDIA_HOSTNAME (למשל custom domain של R2).
const remotePatterns = [{ protocol: "https", hostname: "**.r2.dev" }];

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
if (apiUrl) {
  try {
    const host = new URL(apiUrl).hostname;
    if (host && host !== "localhost") remotePatterns.push({ protocol: "https", hostname: host });
  } catch {
    // URL לא תקין - מתעלמים, לא מפילים את הבנייה
  }
}

const mediaHostname = process.env.NEXT_PUBLIC_MEDIA_HOSTNAME;
if (mediaHostname) remotePatterns.push({ protocol: "https", hostname: mediaHostname });

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns,
  },
};

const { withSentryConfig } = require("@sentry/nextjs");

// בלי SENTRY_AUTH_TOKEN/SENTRY_ORG/SENTRY_PROJECT מוגדרים, זה רק מדלג על
// העלאת source maps (לא נכשל) - מעקב השגיאות עצמו עדיין פעיל בלעדיהם.
module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  webpack: {
    removeDebugLogging: true,
    automaticVercelMonitors: false,
  },
  widenClientFileUpload: false,
});
