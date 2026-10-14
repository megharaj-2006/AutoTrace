'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Sun, 
  Moon, 
  Search, 
  ChevronDown, 
  User, 
  Users, 
  ShieldCheck, 
  ArrowRight, 
  Menu, 
  X,
  SlidersHorizontal,
  Check,
  Radio
} from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';
import { CommandPalette } from '@/components/search/CommandPalette';
import { AutoTraceLogo } from '@/components/navigation/AutoTraceLogo';

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme, dotMatrixEnabled, toggleDotMatrix } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoginMenuOpen, setIsLoginMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const settingsRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Cmd+K
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // Do not display marketing navbar in authenticated console or workspace (/app/*)
  if (pathname?.startsWith('/app')) {
    return null;
  }

  const navLinks = [
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#090A0F]/85 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Precision Architectural Geometric Brand Mark */}
          <div className="flex items-center gap-3 sm:gap-6 shrink-0 min-w-0">
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-900 dark:text-white group-hover:border-slate-300 dark:group-hover:border-zinc-700 transition-colors shadow-sm">
                <AutoTraceLogo className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base tracking-tight text-slate-900 dark:text-white">
                  AutoTrace<span className="text-slate-500 dark:text-zinc-400 font-normal">Sec</span>
                </span>
                {/* Refined Status Tag - Hidden on narrow mobile, keeping green pulse dot */}
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 border border-slate-200 text-slate-700 dark:bg-zinc-950/80 dark:border-zinc-800 dark:text-zinc-300 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                  Operational
                </span>
                <span className="sm:hidden w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" title="System Operational" />
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-200 dark:border-zinc-800">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-slate-900 dark:text-white bg-slate-100/90 dark:bg-zinc-800/80 shadow-xs'
                        : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Search Trigger, Settings Popover & Action CTAs */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Quick Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 p-2 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/80 text-xs text-slate-500 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700 hover:text-slate-700 dark:hover:text-zinc-200 transition-all shadow-sm"
              title="Search documentation and platform (Cmd+K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400">
                ⌘K
              </kbd>
            </button>

            {/* Option 3: Clean Preferences & Display Popover Trigger */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setIsSettingsOpen((prev) => !prev)}
                className={`p-2 rounded-lg border transition-all ${
                  isSettingsOpen
                    ? 'border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
                aria-label="Display and cluster settings"
                title="Preferences & Display Settings"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              {/* Floating Popover Card with Enhanced Glassmorphism */}
              {isSettingsOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 dark:border-white/[0.12] bg-white/95 dark:bg-[#11131a]/95 backdrop-blur-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 dark:shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white pb-2 mb-2 border-b border-slate-100 dark:border-zinc-800">
                    Preferences &amp; Display
                  </div>

                  {/* Theme Mode Segmented Buttons */}
                  <div className="mb-3">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 block mb-1.5">
                      Interface Theme
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                      <button
                        onClick={() => setTheme('light')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                          theme === 'light'
                            ? 'bg-white text-slate-900 shadow-sm font-semibold'
                            : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                        }`}
                      >
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        <span>Light</span>
                      </button>
                      <button
                        onClick={() => setTheme('dark')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                          theme === 'dark'
                            ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                            : 'text-slate-600 dark:text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <Moon className="w-3.5 h-3.5 text-sky-400" />
                        <span>Dark</span>
                      </button>
                    </div>
                  </div>

                  {/* Interactive Dot Matrix Canvas Switch */}
                  <div className="mb-3 pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-slate-800 dark:text-zinc-200">
                        Dot Matrix Grid
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                        Interactive cursor physics
                      </div>
                    </div>
                    <button
                      onClick={toggleDotMatrix}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        dotMatrixEnabled ? 'bg-sky-500' : 'bg-slate-300 dark:bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          dotMatrixEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Cluster Mesh Quick Status */}
                  <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      autotrace-mesh
                    </span>
                    <span className="font-medium text-slate-700 dark:text-zinc-300">v1.4 Spec</span>
                  </div>
                </div>
              )}
            </div>

            {/* Sign In Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsLoginMenuOpen((prev) => !prev)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Sign In
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isLoginMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Login Dropdown Menu */}
              {isLoginMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#11131a] shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onMouseLeave={() => setIsLoginMenuOpen(false)}
                >
                  <Link
                    href="/login?tab=individual"
                    onClick={() => setIsLoginMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors"
                  >
                    <User className="w-4 h-4 text-sky-500" />
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">Personal Workspace</div>
                      <div className="text-[10px] text-slate-500 dark:text-zinc-400">Dedicated profile & clusters</div>
                    </div>
                  </Link>

                  <Link
                    href="/login?tab=team"
                    onClick={() => setIsLoginMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors"
                  >
                    <Users className="w-4 h-4 text-emerald-500" />
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">Org Team Member</div>
                      <div className="text-[10px] text-slate-500 dark:text-zinc-400">Project ID & Team login</div>
                    </div>
                  </Link>

                  <div className="my-1 border-t border-slate-100 dark:border-zinc-800/80"></div>

                  <Link
                    href="/login?tab=admin"
                    onClick={() => setIsLoginMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">Org Admin Portal</div>
                      <div className="text-[10px] text-slate-500 dark:text-zinc-400">Fleet & license management</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Register Primary CTA (Desktop/Tablet) */}
            <Link
              href="/register"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 transition-all shadow-sm shrink-0 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Start Evaluation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="p-2 md:hidden rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer with Glassmorphism */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#090A0F]/95 backdrop-blur-2xl px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-zinc-800/80 flex flex-col gap-2">
              <Link
                href="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-white dark:text-zinc-950 bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-white rounded-xl shadow-sm transition-all"
              >
                <span>Start Free Evaluation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-center py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 bg-slate-50 dark:bg-zinc-900/90 rounded-xl border border-slate-200 dark:border-zinc-800 transition-colors"
              >
                Sign In to Console
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Global Command Palette */}
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
