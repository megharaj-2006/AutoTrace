'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  User, 
  Users, 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  Key, 
  Terminal, 
  Building2 
} from 'lucide-react';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { AutoTraceLogo } from '@/components/navigation/AutoTraceLogo';

type LoginTab = 'individual' | 'team' | 'admin';

function safeFormatError(err: string | null): string {
  if (!err) return '';
  if (err === 'auth_failed') {
    return 'Authentication failed or was cancelled. Please try signing in again.';
  }
  try {
    return decodeURIComponent(err);
  } catch {
    return err;
  }
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as LoginTab) || 'individual';
  const authError = searchParams.get('error');

  const [activeTab, setActiveTab] = useState<LoginTab>(
    ['individual', 'team', 'admin'].includes(initialTab) ? initialTab : 'individual'
  );

  // Individual Form
  const [indEmail, setIndEmail] = useState('');
  const [indPassword, setIndPassword] = useState('');

  // Org Team Member Form
  const [projectId, setProjectId] = useState('mock-amazon-cluster');
  const [memberId, setMemberId] = useState('');
  const [teamName, setTeamName] = useState('checkout-sre');
  const [teamPassword, setTeamPassword] = useState('');

  // Org Admin Form
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminToken, setAdminToken] = useState('');

  const [loading, setLoading] = useState(false);

  const handleIndividualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push('/app/projects');
    }, 800);
  };

  const handleTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push(`/app/projects/${encodeURIComponent(projectId || 'mock-amazon-cluster')}`);
    }, 800);
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push('/app/admin');
    }, 800);
  };

  return (
    <div className="flex flex-col w-full py-12 lg:py-20 min-h-[calc(100vh-4rem)]">
      <div className="max-w-md mx-auto px-4 sm:px-6 w-full">
        
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center mb-4 group">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-900 dark:text-white group-hover:scale-105 transition-transform shadow-sm">
              <AutoTraceLogo className="w-6 h-6" />
            </div>
          </Link>
          <br />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 border border-slate-200 text-slate-700 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] mb-4 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Secure Access Desk</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Sign In to AutoTrace-Sec
          </h1>
          <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
            Select your authorization tier to access your designated workspace.
          </p>

          {/* 3-Tab Tier Selector */}
          <div className="mt-6 grid grid-cols-3 p-1 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs">
            <button
              onClick={() => setActiveTab('individual')}
              className={`py-2 rounded-lg font-medium transition-all ${
                activeTab === 'individual'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Individual
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`py-2 rounded-lg font-medium transition-all ${
                activeTab === 'team'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Org Team
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`py-2 rounded-lg font-medium transition-all ${
                activeTab === 'admin'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Org Admin
            </button>
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0B0D13]/85 backdrop-blur-2xl p-6 sm:p-8 shadow-xl dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_16px_40px_rgba(0,0,0,0.4)]">
          
          {authError && (
            <div className="mb-6 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
              <span>
                {authError === 'auth_failed'
                  ? 'Authentication failed or was cancelled. Please try signing in again.'
                  : `Authentication error: ${safeFormatError(authError)}`}
              </span>
            </div>
          )}

          {/* TAB 1: INDIVIDUAL LOGIN */}
          {activeTab === 'individual' && (
            <div>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-zinc-800/80 text-xs font-semibold text-slate-900 dark:text-white">
                <User className="w-4 h-4 text-sky-500" />
                <span>Individual Developer Workspace</span>
              </div>

              {/* Social Authentication Buttons */}
              <div className="mb-5">
                <SocialAuthButtons nextUrl="/dashboard" />
              </div>

              <div className="relative my-4 flex items-center justify-center">
                <div className="border-t border-slate-200 dark:border-zinc-800 w-full"></div>
                <span className="absolute bg-white dark:bg-[#0B0D13] px-2 text-[10px] text-slate-400 font-mono">
                  OR USE EMAIL
                </span>
              </div>

              <form onSubmit={handleIndividualSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Username or Email
                  </label>
                  <input
                    type="text"
                    required
                    value={indEmail}
                    onChange={(e) => setIndEmail(e.target.value)}
                    placeholder="dev@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={indPassword}
                    onChange={(e) => setIndPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-zinc-950 font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>{loading ? 'Authenticating...' : 'Enter Developer Workspace'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: ORG TEAM MEMBER LOGIN */}
          {activeTab === 'team' && (
            <div>
              <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-100 dark:border-zinc-800/80 text-xs font-semibold text-slate-900 dark:text-white">
                <Users className="w-4 h-4 text-emerald-500" />
                <span>Multi-Team Direct Project Entry</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-4 leading-relaxed">
                Connect directly to your team’s assigned project console. Credentials issued by your Organization Administrator.
              </p>

              <form onSubmit={handleTeamSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Project ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="mock-amazon-cluster"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Team Member ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                    placeholder="usr-checkout-04"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Assigned Team Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="checkout-sre"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Project Access Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={teamPassword}
                    onChange={(e) => setTeamPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>{loading ? 'Verifying Project...' : 'Launch Project Console'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: ORG ADMIN LOGIN */}
          {activeTab === 'admin' && (
            <div>
              <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-100 dark:border-zinc-800/80 text-xs font-semibold text-slate-900 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>Organization Administrator Portal</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-4 leading-relaxed">
                Single Point of Contact authority. Download telemetry collector binaries, issue team licenses, and manage global cluster fleets.
              </p>

              <form onSubmit={handleAdminSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Admin Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@acme-corp.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Master Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    MFA / Security Hardware Token
                  </label>
                  <input
                    type="text"
                    value={adminToken}
                    onChange={(e) => setAdminToken(e.target.value)}
                    placeholder="6-digit TOTP (e.g. 849201)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>{loading ? 'Authenticating Fleet...' : 'Access Admin Fleet Portal'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* Bottom Switch to Register */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-zinc-800/80 text-center text-xs text-slate-500 dark:text-zinc-400">
            Need to initialize an account?{' '}
            <Link href="/register" className="text-sky-600 dark:text-sky-400 hover:underline font-medium">
              Start registration
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh] text-xs font-mono text-slate-400">
        Loading authentication desk...
      </div>
    }>
      <LoginContent />
    </React.Suspense>
  );
}
