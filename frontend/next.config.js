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

module.exports = nextConfig;
