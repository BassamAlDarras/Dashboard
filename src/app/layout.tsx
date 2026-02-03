import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { DashboardProvider } from '@/context/DashboardContext';
import { InspectionProvider } from '@/context/InspectionContext';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Operations Dashboard | Enterprise Management System',
  description: 'Enterprise-level permits and inspections management dashboard with multi-level drill-down analytics',
  keywords: ['permits', 'inspections', 'dashboard', 'analytics', 'management', 'enterprise'],
  authors: [{ name: 'Enterprise Systems' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 min-h-screen`}>
        <DashboardProvider>
          <InspectionProvider>
            {children}
          </InspectionProvider>
        </DashboardProvider>
      </body>
    </html>
  );
}
