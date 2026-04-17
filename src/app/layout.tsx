import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import SiteAnalyticsTracker from '@/components/SiteAnalyticsTracker';

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_TITLE || 'Claw123 - OpenClaw 导航',
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || '发现和探索各种 Claw 项目',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">
        <Suspense fallback={null}>
          <SiteAnalyticsTracker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
