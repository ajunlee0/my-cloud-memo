import type { NextConfig } from "next";
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  /* 여기에 기존 설정(이미지 도메인 등)이 있었다면 추가하세요 */
};

export default withPWA(nextConfig);