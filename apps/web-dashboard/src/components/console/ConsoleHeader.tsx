'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  ChevronDown, 
  Search, 
  SlidersHorizontal, 
  Sun, 
  Moon, 
  User, 
  Users, 
  ShieldCheck, 
  LogOut, 
  Layers, 
  Plus, 
  ArrowLeft
} from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';
import { CommandPalette } from '@/components/search/CommandPalette';

interface ConsoleHeaderProps {
  currentProjectName?: string;
  projectId?: string;
  role?: 'individual' | 'team' | 'admin';
}

export function ConsoleHeader({ currentProjectName, projectId, role = 'individual' }: ConsoleHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme, dotMatrixEnabled, toggleDotMatrix } = useTheme();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const settingsRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
      }
      if (projectRef.current && !projectRef.current.contains(e.target as Node)) {
        setIsProjectMenuOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-[#090A0F]/90 backdrop-blur-md transition-colors">
        <div className="max-w-full mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          
          {/* Left: Brand mark + Breadcrumb / Project Switcher */}
          <div className="flex items-center gap-4 shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-900 dark:text-white shadow-sm">
                <svg className="w-3.5 h-3.5 text-slate-800 dark:text-zinc-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <circle cx="19" cy="6" r="2" />
                  <circle cx="5" cy="18" r="2" />
                  <circle cx="19" cy="18" r="2" />
                  <path d="M12 9V6" />
                  <path d="M10 14l-3.5 3" />
                  <path d="M14 14l3.5 3" />
                  <path d="M14 10l3.5-3" />
                </svg>
              </div>
              <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-white hidden sm:inline">
                AutoTrace<span className="text-slate-500 dark:text-zinc-400 font-normal">Sec</span>
              </span>
            </Link>

            <span className="text-slate-300 dark:text-zinc-700">/</span>

            {/* Project / Workspace Dropdown */}
            <div className="relative" ref={projectRef}>
              <button
                onClick={() => setIsProjectMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs font-medium text-slate-800 dark:text-zinc-200 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors shadow-sm"
              >
                <Layers className="w-3.5 h-3.5 text-sky-500" />
                <span className="truncate max-w-[140px] sm:max-w-[200px]">
                  {currentProjectName || 'All Workspaces'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isProjectMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Project selector dropdown */}
              {isProjectMenuOpen && (
                <div className="absolute left-0 mt-2 w-64 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#11131a] shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                  <div className="px-3 py-1.5 font-medium text-[11px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    Available Projects
                  </div>
                  <Link
                    href="/app/projects/mock-amazon-cluster"
                    onClick={() => setIsProjectMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">mock-amazon-cluster</div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400">4 Watchdog Nodes (5000-5003)</div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </Link>

                  <Link
                    href="/app/projects/fintech-payment-pipeline"
                    onClick={() => setIsProjectMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">fintech-payment-pipeline</div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400">8 Watchdog Nodes</div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </Link>

                  <div className="my-1 border-t border-slate-100 dark:border-zinc-800"></div>

                  <Link
                    href="/app/projects"
                    onClick={() => setIsProjectMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sky-600 dark:text-sky-400 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Manage all projects</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Live Operational Mesh Pill */}
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 border border-slate-200 text-slate-700 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              autotrace-mesh :9092
            </span>
          </div>

          {/* Right: Quick Search, Settings Popover, Role Navigation & Profile */}
          <div className="flex items-center gap-2.5">
            
            {/* Quick Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/80 text-xs text-slate-500 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors shadow-sm"
              title="Search console metrics and services (Cmd+K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
              <span className="hidden sm:inline">Search console...</span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400">
                ⌘K
              </kbd>
            </button>

            {/* Navigation links across console levels */}
            <div className="hidden lg:flex items-center gap-1 border-l border-slate-200 dark:border-zinc-800 pl-2.5">
              <Link
                href="/app/projects"
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  pathname === '/app/projects'
                    ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Workspaces
              </Link>
              <Link
                href="/app/admin"
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  pathname === '/app/admin'
                    ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Org Fleet Admin
              </Link>
            </div>

            {/* Display & Preferences Popover */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setIsSettingsOpen((prev) => !prev)}
                className={`p-2 rounded-lg border transition-all ${
                  isSettingsOpen
                    ? 'border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
                title="Display & Preferences Settings"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>

              {isSettingsOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#11131a] shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                  <div className="font-semibold text-slate-900 dark:text-white pb-2 mb-2 border-b border-slate-100 dark:border-zinc-800">
                    Console Display Preferences
                  </div>

                  {/* Theme Mode */}
                  <div className="mb-3">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 block mb-1.5">
                      Theme Mode
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

                  {/* Dot Grid Switch */}
                  <div className="mb-2 pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-800 dark:text-zinc-200">
                        Interactive Dot Matrix
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                        Cursor physics background
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
                </div>
              )}
            </div>

            {/* User Profile Menu */}
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-zinc-800"
              >
                <div className="w-7 h-7 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-xs font-semibold text-sky-600 dark:text-sky-400">
                  {role === 'admin' ? 'AD' : 'DEV'}
                </div>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#11131a] shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {role === 'admin' ? 'Organization Admin' : 'Developer Sandbox'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                      {role === 'admin' ? 'admin@acme-corp.com' : 'dev@autotrace-sec.internal'}
                    </div>
                  </div>

                  <Link
                    href="/app/projects"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>My Workspaces</span>
                  </Link>

                  <Link
                    href="/app/admin"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    <span>Org Fleet Portal</span>
                  </Link>

                  <div className="my-1 border-t border-slate-100 dark:border-zinc-800"></div>

                  <Link
                    href="/"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out to Landing</span>
                  </Link>
                </div>
              )}
            </div>

          </div>

        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
