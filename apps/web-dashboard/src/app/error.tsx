'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home, ShieldAlert } from 'lucide-react';

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Application Error Intercepted by Global Error Boundary]:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#0B0D13]/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl text-center">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
          Application Recovery Mode
        </h2>

        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
          An unexpected client exception occurred. Your active session and telemetry state have been preserved.
        </p>

        {error?.message && (
          <div className="my-4 p-3 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-left font-mono text-[11px] text-slate-700 dark:text-zinc-300 overflow-x-auto break-words max-h-28">
            {error.message}
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-slate-900 text-xs font-semibold transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Component</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium transition-all"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Overview</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
