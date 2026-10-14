'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  ChevronDown, 
  Search, 
  SlidersHorizontal, 
  Sun, 
  Moon, 
  User, 
  ShieldCheck, 
  LogOut, 
  Layers, 
  Plus, 
  ArrowLeft,
  ArrowRight,
  Edit3,
  Settings
} from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';
import { CommandPalette } from '@/components/search/CommandPalette';
import { AutoTraceLogo } from '@/components/navigation/AutoTraceLogo';
import { getActiveUserProfile, clearActiveUserProfile, UserProfile, DEFAULT_PROFILE } from '@/lib/userProfile';
import { signOut } from '@/lib/auth';

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
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  const [projectList, setProjectList] = useState<Array<{ id: string; name: string; nodesCount?: number }>>([
    { id: 'mock-amazon-cluster', name: 'Mock Amazon Cluster (Testbed)', nodesCount: 4 },
  ]);

  const settingsRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Load active user profile and user's dedicated project list
  useEffect(() => {
    let isMounted = true;

    getActiveUserProfile().then((profile) => {
      if (!isMounted) return;
      setUserProfile(profile);

      // Scoped project fetch for this profile
      const userKey = profile.id || profile.email;
      const endpoint = userKey ? `/api/v1/projects?userId=${encodeURIComponent(userKey)}` : '/api/v1/projects';

      fetch(endpoint)
        .then((res) => res.json())
        .then((data) => {
          if (isMounted && Array.isArray(data.projects) && data.projects.length > 0) {
            setProjectList(data.projects);
          }
        })
        .catch(() => {
          try {
            const storageKey = `autotrace_projects_${userKey}`;
            const stored = localStorage.getItem(storageKey);
            if (stored && isMounted) {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setProjectList(parsed);
              }
            }
          } catch {}
        });
    });

    const handleProfileUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<UserProfile | null>;
      if (customEvt.detail && isMounted) {
        setUserProfile(customEvt.detail);
      }
    };
    window.addEventListener('autotrace_profile_updated', handleProfileUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('autotrace_profile_updated', handleProfileUpdate);
    };
  }, []);

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

  const handleSignOut = async () => {
    setIsUserMenuOpen(false);
    try {
      await signOut();
    } catch (err) {
      console.warn('[SignOut] Error signing out from auth provider:', err);
    }
    clearActiveUserProfile();
    router.push('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-[#090A0F]/90 backdrop-blur-2xl transition-colors">
        <div className="max-w-full mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2 sm:gap-4 min-w-0">
          
          {/* Left: Brand mark + Breadcrumb / Project Switcher */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0 min-w-0">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-900 dark:text-white shadow-sm">
                <AutoTraceLogo className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-white hidden sm:inline">
                AutoTrace<span className="text-slate-500 dark:text-zinc-400 font-normal">Sec</span>
              </span>
            </Link>

            <span className="text-slate-300 dark:text-zinc-700">/</span>

            {/* Project / Workspace Dropdown */}
            <div className="relative min-w-0" ref={projectRef}>
              <button
                onClick={() => setIsProjectMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900/80 text-xs font-medium text-slate-800 dark:text-zinc-200 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors shadow-sm"
              >
                <Layers className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span className="truncate max-w-[100px] sm:max-w-[200px]">
                  {currentProjectName || 'All Workspaces'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isProjectMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isProjectMenuOpen && (
                <div className="absolute left-0 mt-2 w-72 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#11131a] shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {userProfile.name}&apos;s Projects
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                      {userProfile.email}
                    </div>
                  </div>

                  <div className="py-1 max-h-56 overflow-y-auto space-y-0.5">
                    {projectList.map((p) => {
                      const isActive = p.id === projectId;
                      return (
                        <Link
                          key={p.id}
                          href={`/app/projects/${encodeURIComponent(p.id)}`}
                          onClick={() => setIsProjectMenuOpen(false)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-medium'
                              : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/80'
                          }`}
                        >
                          <div className="truncate mr-2">
                            <div>{p.name}</div>
                            <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                              {p.id === 'mock-amazon-cluster'
                                ? '4 nodes • Testbed Cluster'
                                : `${p.nodesCount || 0} nodes • Custom Mesh`}
                            </div>
                          </div>
                          <span className={`w-2 h-2 rounded-full shrink-0 ${p.id === 'mock-amazon-cluster' || (p.nodesCount && p.nodesCount > 0) ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        </Link>
                      );
                    })}
                  </div>

                  <div className="border-t border-slate-100 dark:border-zinc-800 pt-1 mt-1">
                    <Link
                      href="/app/projects"
                      onClick={() => setIsProjectMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Manage All Workspaces</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Breadcrumb back navigation if in a specific project */}
            {projectId && (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                <span className="text-slate-300 dark:text-zinc-700">/</span>
                <span className="font-mono text-[11px] text-slate-600 dark:text-zinc-300">
                  {projectId}
                </span>
              </div>
            )}
          </div>

          {/* Center: Command Palette Trigger */}
          <div className="flex-1 max-w-md mx-2 sm:mx-4 hidden sm:block">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900/60 text-xs text-slate-400 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-all shadow-xs"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5" />
                <span className="truncate">Search telemetry spans, pods, CVEs...</span>
              </div>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-mono text-[10px] text-slate-500 dark:text-zinc-400 shadow-2xs">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right: Quick actions, Theme, Settings, User Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Mobile Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="sm:hidden p-2 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Open Command Palette"
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            {/* Navigation Switcher: Projects vs Admin */}
            <div className="hidden lg:flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
              <Link
                href="/app/projects"
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  pathname === '/app/projects' || pathname.startsWith('/app/projects/')
                    ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
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

            {/* Dedicated User Profile Menu */}
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-zinc-800 group focus:outline-none"
                aria-label="User Profile Menu"
                title="View & Manage User Profile"
              >
                {(() => {
                  const displayImg = userProfile.activeDisplayMode === 'photo'
                    ? (userProfile.photoUrl || userProfile.avatarUrl)
                    : (userProfile.avatarUrl || userProfile.photoUrl);
                  return displayImg ? (
                    <div className="w-7 h-7 rounded-full overflow-hidden relative border border-sky-500/40 shadow-xs group-hover:ring-2 group-hover:ring-sky-500/50 transition-all bg-slate-900">
                      <Image
                        src={displayImg}
                        alt={userProfile.name}
                        fill
                        sizes="28px"
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-xs font-semibold text-sky-600 dark:text-sky-400 group-hover:scale-105 transition-transform">
                      {userProfile.initials}
                    </div>
                  );
                })()}
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#11131a] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                  {/* Clickable Header card to /app/profile */}
                  <Link
                    href="/app/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="block p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800/80 hover:border-sky-500/50 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-all mb-1 group"
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      {(() => {
                        const cardImg = userProfile.activeDisplayMode === 'photo'
                          ? (userProfile.photoUrl || userProfile.avatarUrl)
                          : (userProfile.avatarUrl || userProfile.photoUrl);
                        return cardImg ? (
                          <div className="w-9 h-9 rounded-xl overflow-hidden relative border border-sky-500/40 shadow-xs bg-slate-900 shrink-0">
                            <Image
                              src={cardImg}
                              alt={userProfile.name}
                              fill
                              sizes="36px"
                              unoptimized
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-xs font-bold text-sky-600 dark:text-sky-400 shrink-0">
                            {userProfile.initials}
                          </div>
                        );
                      })()}
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-sky-500 transition-colors">
                          {userProfile.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono truncate">
                          @{userProfile.username || 'developer'}
                        </div>
                      </div>
                    </div>
                    {userProfile.role === 'team' && userProfile.teamRole && (
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          🔒 Team: {userProfile.teamRole}
                        </span>
                      </div>
                    )}
                    {userProfile.headline && (
                      <div className="text-[11px] text-slate-600 dark:text-zinc-300 line-clamp-1 mb-2 font-normal">
                        {userProfile.headline}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 dark:border-zinc-800/60 text-[10px] text-sky-600 dark:text-sky-400 font-semibold">
                      <span>View Full Profile</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>

                  <div className="space-y-0.5 pt-1">
                    <Link
                      href="/app/profile?tab=overview"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-zinc-200 transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-sky-500" />
                      <span>Profile & Socials</span>
                    </Link>

                    <Link
                      href="/app/profile?tab=edit"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-zinc-200 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Edit Profile</span>
                    </Link>

                    <Link
                      href="/app/profile?tab=settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-zinc-200 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Account & Dashboard Settings</span>
                    </Link>

                    <Link
                      href="/app/projects"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-zinc-200 transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>My Dedicated Workspaces</span>
                    </Link>

                    <Link
                      href="/app/admin"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-zinc-200 transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                      <span>Org Fleet Portal</span>
                    </Link>
                  </div>

                  <div className="my-1 border-t border-slate-100 dark:border-zinc-800"></div>

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
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
