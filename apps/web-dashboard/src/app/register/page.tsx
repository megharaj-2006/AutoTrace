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
  CheckCircle2, 
  Github, 
  Building2, 
  Terminal,
  Upload,
  Globe
} from 'lucide-react';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') === 'organization' ? 'organization' : 'individual';

  const [accountType, setAccountType] = useState<'individual' | 'organization'>(initialType);
  const [individualForm, setIndividualForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    about: '',
    avatarUrl: '',
  });

  const [orgForm, setOrgForm] = useState({
    companyName: '',
    orgDomain: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    initialTeamName: 'core-platform',
    primaryClusterEnvironment: 'Docker Compose / Kubernetes',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleIndividualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      // In local demo mode, take directly to the individual workspace
      router.push('/app/projects');
    }, 1500);
  };

  const handleOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      // In local demo mode, take directly to the org admin portal
      router.push('/app/admin');
    }, 1500);
  };

  return (
    <div className="flex flex-col w-full py-12 lg:py-20 min-h-[calc(100vh-4rem)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 w-full">
        
        {/* Title & Account Segmentation Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 border border-slate-200 text-slate-700 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] mb-4 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Secure Onboarding</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Create your AutoTrace-Sec Account
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
            Select your account classification to configure your workspace credentials.
          </p>

          {/* Account Type Selector Pill */}
          <div className="mt-8 inline-grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 w-full max-w-md mx-auto">
            <button
              type="button"
              onClick={() => setAccountType('individual')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
                accountType === 'individual'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User className="w-4 h-4 text-sky-500" />
              <span>Individual Developer</span>
            </button>
            <button
              type="button"
              onClick={() => setAccountType('organization')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
                accountType === 'organization'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4 text-emerald-500" />
              <span>Organization / Enterprise</span>
            </button>
          </div>
        </div>

        {submitted ? (
          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0B0D13] p-10 text-center shadow-lg">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Account Initialized Successfully
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6 font-mono">
              Redirecting you to your {accountType === 'individual' ? 'workspace' : 'organization admin portal'}...
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0B0D13] p-8 sm:p-10 shadow-lg">
            
            {/* INDIVIDUAL REGISTRATION FLOW */}
            {accountType === 'individual' && (
              <div>
                {/* Social Login Options */}
                <div className="mb-6">
                  <div className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-3 text-center">
                    Quick Sign Up with Identity Provider
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => router.push('/app/projects')}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-medium transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5 text-sky-500" />
                      <span>Google</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push('/app/projects')}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-medium transition-colors"
                    >
                      <Github className="w-3.5 h-3.5 text-slate-900 dark:text-white" />
                      <span>GitHub</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push('/app/projects')}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-medium transition-colors"
                    >
                      <Terminal className="w-3.5 h-3.5 text-blue-500" />
                      <span>LinkedIn</span>
                    </button>
                  </div>
                </div>

                <div className="relative my-6 flex items-center justify-center">
                  <div className="border-t border-slate-200 dark:border-zinc-800 w-full"></div>
                  <span className="absolute bg-white dark:bg-[#0B0D13] px-3 text-[11px] text-slate-400 font-mono">
                    OR REGISTER VIA DIRECT CREDENTIALS
                  </span>
                </div>

                {/* Individual Form */}
                <form onSubmit={handleIndividualSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={individualForm.name}
                        onChange={(e) => setIndividualForm({ ...individualForm, name: e.target.value })}
                        placeholder="John Developer"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                        Username *
                      </label>
                      <input
                        type="text"
                        required
                        value={individualForm.username}
                        onChange={(e) => setIndividualForm({ ...individualForm, username: e.target.value })}
                        placeholder="johndev"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={individualForm.email}
                      onChange={(e) => setIndividualForm({ ...individualForm, email: e.target.value })}
                      placeholder="john@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                        Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={individualForm.password}
                        onChange={(e) => setIndividualForm({ ...individualForm, password: e.target.value })}
                        placeholder="••••••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={individualForm.confirmPassword}
                        onChange={(e) => setIndividualForm({ ...individualForm, confirmPassword: e.target.value })}
                        placeholder="••••••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                      About / Primary Tech Stack
                    </label>
                    <input
                      type="text"
                      value={individualForm.about}
                      onChange={(e) => setIndividualForm({ ...individualForm, about: e.target.value })}
                      placeholder="Distributed Systems Engineer working with Go, Python, and Kafka"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-zinc-950 font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>Create Individual Developer Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* ORGANIZATION ADMIN REGISTRATION FLOW */}
            {accountType === 'organization' && (
              <div>
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 mb-6 text-xs text-slate-600 dark:text-zinc-400">
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Single Point of Contact (SPOC) Admin Account
                  </div>
                  As the Organization Administrator, you act as the single point of contact between your enterprise and AutoTrace-Sec. You will generate and download telemetry collector packages to distribute securely to your development teams.
                </div>

                <form onSubmit={handleOrgSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                        Company / Organization Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={orgForm.companyName}
                        onChange={(e) => setOrgForm({ ...orgForm, companyName: e.target.value })}
                        placeholder="Acme Financial Cloud Inc."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                        Corporate Domain *
                      </label>
                      <input
                        type="text"
                        required
                        value={orgForm.orgDomain}
                        onChange={(e) => setOrgForm({ ...orgForm, orgDomain: e.target.value })}
                        placeholder="acme-corp.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                        Admin Full Name (SPOC) *
                      </label>
                      <input
                        type="text"
                        required
                        value={orgForm.adminName}
                        onChange={(e) => setOrgForm({ ...orgForm, adminName: e.target.value })}
                        placeholder="Sarah Connor"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                        Admin Work Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={orgForm.adminEmail}
                        onChange={(e) => setOrgForm({ ...orgForm, adminEmail: e.target.value })}
                        placeholder="sarah.admin@acme-corp.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                        Admin Master Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={orgForm.adminPassword}
                        onChange={(e) => setOrgForm({ ...orgForm, adminPassword: e.target.value })}
                        placeholder="••••••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                        Default Initial Team Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={orgForm.initialTeamName}
                        onChange={(e) => setOrgForm({ ...orgForm, initialTeamName: e.target.value })}
                        placeholder="platform-sre"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                      Cluster Orchestration Target
                    </label>
                    <select
                      value={orgForm.primaryClusterEnvironment}
                      onChange={(e) => setOrgForm({ ...orgForm, primaryClusterEnvironment: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="Docker Compose Mesh">Docker Compose Mesh (autotrace-mesh network)</option>
                      <option value="Kubernetes DaemonSet">Kubernetes DaemonSet (eBPF hostPID)</option>
                      <option value="AWS ECS / EKS">AWS EKS / Fargate Envoy Proxy</option>
                      <option value="Bare-Metal Linux">Bare-Metal Linux (systemd)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>Register Organization &amp; Setup Admin Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* Switch to login link */}
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-zinc-800/80 text-center text-xs text-slate-500 dark:text-zinc-400">
              Already possess credentials?{' '}
              <Link href="/login" className="text-sky-600 dark:text-sky-400 hover:underline font-medium">
                Sign in to console
              </Link>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh] text-xs font-mono text-slate-400">
          Loading registration desk...
        </div>
      }
    >
      <RegisterContent />
    </React.Suspense>
  );
}
