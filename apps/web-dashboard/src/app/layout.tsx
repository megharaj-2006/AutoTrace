import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { Navbar } from '@/components/navigation/Navbar';
import { Footer } from '@/components/navigation/Footer';
import { InteractiveDotMatrix } from '@/components/canvas/InteractiveDotMatrix';
import { AuthCallbackListener } from '@/components/auth/AuthCallbackListener';

export const metadata: Metadata = {
  title: 'AutoTrace-Sec — Causal Microservice Anomaly Detection & Kernel Containment',
  description:
    'Distributed microservice security monitoring, GAT root-cause analysis, live dependency graph construction, and automated eBPF runtime containment.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/logo-light.svg', media: '(prefers-color-scheme: light)' },
      { url: '/logo-dark.svg', media: '(prefers-color-scheme: dark)' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.svg',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-hidden max-w-full">
      <body className="min-h-screen flex flex-col bg-white dark:bg-[#090A0F] text-slate-900 dark:text-zinc-100 antialiased selection:bg-sky-500/20 selection:text-sky-600 dark:selection:text-sky-300 relative overflow-x-hidden max-w-full w-full">
        <ThemeProvider>
          {/* Subtle Google Studio / Antigravity Ambient Background Lights */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-sky-400/10 via-sky-500/5 to-transparent dark:from-sky-500/10 dark:via-sky-400/5 dark:to-transparent rounded-full blur-3xl animate-studio-ambient" />
            <div className="absolute top-1/3 -left-40 w-[450px] h-[350px] bg-emerald-500/5 dark:bg-emerald-400/5 rounded-full blur-3xl animate-studio-ambient [animation-delay:4s]" />
          </div>

          {/* Mouse-reactive dynamic dot matrix canvas (light & dark mode) */}
          <InteractiveDotMatrix />

          {/* OAuth callback code & hash listener */}
          <Suspense fallback={null}>
            <AuthCallbackListener />
          </Suspense>

          <div className="relative z-10 flex flex-col min-h-screen w-full max-w-full overflow-x-hidden">
            <Navbar />
            <main className="flex-1 w-full max-w-full overflow-x-hidden">
              {children}
            </main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
