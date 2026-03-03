import type { NextConfig } from "next";

// @ts-ignore: next-pwa 타입 무시
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  // 에러 메시지 팁대로 루트에 빈 turbopack 설정을 추가합니다.
  // @ts-ignore: NextConfig 타입에 아직 반영되지 않았을 수 있으므로 무시 처리
  turbopack: {},
  
  // Webpack 기반 플러그인(next-pwa) 사용을 명시
  webpack: (config) => {
    return config;
  },
};

export default withPWA(nextConfig);