import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  buildExcludes: [/middleware-manifest\.json$/],
  importScripts: ["/custom-sw.js"],
});

const nextConfig: NextConfig = {
  devIndicators: false,
};

export default withPWA(nextConfig);
