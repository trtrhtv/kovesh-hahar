/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
      {
        protocol: "https",
        // עדכן לדומיין הציבורי האמיתי שתחבר ל-bucket ב-R2
        hostname: "**",
      },
    ],
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
