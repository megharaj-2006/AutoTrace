import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { Navbar } from '@/components/navigation/Navbar';
import { Footer } from '@/components/navigation/Footer';
import { InteractiveDotMatrix } from '@/components/canvas/InteractiveDotMatrix';

export const metadata: Metadata = {
  title: 'AutoTrace-Sec — Causal Microservice Anomaly Detection & Kernel Containment',
  description:
    'Distributed microservice security monitoring, GAT root-cause analysis, live dependency graph construction, and automated eBPF runtime containment.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-white dark:bg-[#090A0F] text-slate-900 dark:text-zinc-100 antialiased selection:bg-sky-500/20 selection:text-sky-600 dark:selection:text-sky-300 relative">
        <ThemeProvider>
          {/* Mouse-reactive dynamic dot matrix canvas (light & dark mode) */}
          <InteractiveDotMatrix />
          <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
