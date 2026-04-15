import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_TITLE || 'Claw123 - OpenClaw 导航',
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || '发现和探索各种 Claw 项目',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
