import React from 'react';

interface AutoTraceLogoProps {
  className?: string;
}

export function AutoTraceLogo({ className = 'w-5 h-5' }: AutoTraceLogoProps) {
  return (
    <svg
      viewBox="0 0 1024 1024"
      fill="currentColor"
      className={`${className} text-slate-900 dark:text-white transition-colors shrink-0`}
      aria-label="AutoTrace-Sec Logo"
      role="img"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 512,92 L 924,899 L 713,899 L 644,751 L 553,751 L 553,700 L 673,700 L 673,635 L 351,635 L 351,700 L 471,700 L 471,751 L 380,751 L 311,899 L 100,899 Z M 512,317 L 595,587 L 429,587 Z"
      />
    </svg>
  );
}
