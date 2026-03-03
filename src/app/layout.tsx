import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// PWA 및 모바일 최적화 메타데이터
export const metadata: Metadata = {
  title: "My Cloud Memo",
  description: "언제 어디서나 동기화되는 나만의 클라우드 메모장",
  manifest: "/manifest.json", // PWA 핵심 파일 연결
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cloud Memo",
  },
};

// 화면 비율 고정 (모바일에서 입력 시 화면이 제멋대로 커지는 것 방지)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FBFBFA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}