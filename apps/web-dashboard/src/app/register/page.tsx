'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  User, 
  Users, 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  CheckCircle2, 
  Building2, 
  Terminal,
  Upload,
  Github,
  Linkedin,
  Globe,
  MapPin,
  Sparkles,
  Camera
} from 'lucide-react';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { AutoTraceLogo } from '@/components/navigation/AutoTraceLogo';
import { setActiveUserProfile, DIGITAL_AVATAR_PRESETS, PHOTO_PRESETS } from '@/lib/userProfile';

function safeFormatError(err: string | null): string {
  if (!err) return '';
  if (err === 'auth_failed') {
    return 'Authentication failed or was cancelled. Please try registering again.';
  }
  try {
    return decodeURIComponent(err);
  } catch {
    return err;
  }
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') === 'organization' ? 'organization' : 'individual';
  const authError = searchParams.get('error');

  const [accountType, setAccountType] = useState<'individual' | 'organization'>(initialType);
  const [individualForm, setIndividualForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    headline: '',
    bio: '',
    company: '',
    location: '',
    skills: 'Kubernetes, Go, Kafka, eBPF',
    githubUsername: '',
    linkedinUrl: '',
    websiteUrl: '',
    avatarUrl: DIGITAL_AVATAR_PRESETS[0].url,
    photoUrl: PHOTO_PRESETS[0].url,
    activeDisplayMode: 'avatar' as 'photo' | 'avatar',
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

    const skillsArray = individualForm.skills
      ? individualForm.skills.split(',').map((s) => s.trim()).filter(Boolean)
      : ['Kubernetes', 'Go', 'Kafka', 'eBPF'];

    setActiveUserProfile({
      name: individualForm.name,
      username: individualForm.username,
      email: individualForm.email,
      photoUrl: individualForm.photoUrl || null,
      avatarUrl: individualForm.avatarUrl || null,
      activeDisplayMode: individualForm.activeDisplayMode,
      headline: individualForm.headline || 'Cloud & Security Telemetry Engineer',
      bio: individualForm.bio || 'Distributed systems engineer focused on autonomous security telemetry and observability.',
      company: individualForm.company || '',
      location: individualForm.location || '',
      skills: skillsArray,
      githubUsername: individualForm.githubUsername || '',
      linkedinUrl: individualForm.linkedinUrl || '',
      websiteUrl: individualForm.websiteUrl || '',
      role: 'individual',
    });

    setTimeout(() => {
      router.push('/app/projects');
    }, 1200);
  };

  const handleOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    setActiveUserProfile({
      name: orgForm.adminName,
      username: orgForm.adminEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, ''),
      email: orgForm.adminEmail,
      headline: `SPOC Admin & Platform Lead at ${orgForm.companyName}`,
      bio: `Enterprise Organization Administrator managing microservice telemetry, watchdog node distribution, and security containment policies for ${orgForm.companyName}.`,
      company: orgForm.companyName,
      location: '',
      skills: ['Kubernetes', 'eBPF', 'Telemetry Governance', 'Docker', 'SecOps'],
      role: 'admin',
    });

    setTimeout(() => {
      router.push('/app/admin');
    }, 1200);
  };

  return (
    <div className="flex flex-col w-full py-12 lg:py-20 min-h-[calc(100vh-4rem)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 w-full">
        
        {/* Title & Account Segmentation Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center justify-center mb-4 group">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-900 dark:text-white group-hover:scale-105 transition-transform shadow-sm">
              <AutoTraceLogo className="w-6 h-6" />
            </div>
          </Link>
          <br />
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
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0B0D13]/85 backdrop-blur-2xl p-6 sm:p-10 shadow-lg dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_16px_40px_rgba(0,0,0,0.4)]">
            
            {authError && (
              <div className="mb-6 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                <span>
                  {authError === 'auth_failed'
                    ? 'Authentication failed or was cancelled. Please try registering again.'
                    : `Authentication error: ${safeFormatError(authError)}`}
                </span>
              </div>
            )}

            {/* INDIVIDUAL REGISTRATION FLOW */}
            {accountType === 'individual' && (
              <div>
                {/* Social Login Options */}
                <div className="mb-6">
                  <div className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-3 text-center">
                    Quick Sign Up with Identity Provider
                  </div>
                  <SocialAuthButtons nextUrl="/dashboard" />
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

                  {/* Profile & Identity Details (GitHub & LinkedIn fields) */}
                  <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                        <span>Public Profile & Identifiers (Optional)</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Can be edited anytime</span>
                    </div>

                    {/* Avatar Preset Selection */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                        Choose Digital Mascot Avatar or Portrait Photo
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        {DIGITAL_AVATAR_PRESETS.slice(0, 6).map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setIndividualForm({ 
                              ...individualForm, 
                              avatarUrl: preset.url,
                              activeDisplayMode: 'avatar'
                            })}
                            className={`flex items-center gap-1.5 p-1 pr-2.5 rounded-lg border transition-all ${
                              individualForm.avatarUrl === preset.url
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 shadow-xs ring-1 ring-emerald-500'
                                : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                            }`}
                          >
                            <div className="w-6 h-6 rounded-md overflow-hidden relative bg-slate-900 shrink-0">
                              <Image
                                src={preset.url}
                                alt={preset.label}
                                fill
                                sizes="24px"
                                unoptimized
                                className="object-cover"
                              />
                            </div>
                            <span className="text-[11px] font-medium text-slate-700 dark:text-zinc-300">
                              {preset.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                        Headline / Role
                      </label>
                      <input
                        type="text"
                        value={individualForm.headline}
                        onChange={(e) => setIndividualForm({ ...individualForm, headline: e.target.value })}
                        placeholder="Distributed Systems & Telemetry Engineer"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                        Engineering Bio & Focus
                      </label>
                      <textarea
                        rows={2}
                        value={individualForm.bio}
                        onChange={(e) => setIndividualForm({ ...individualForm, bio: e.target.value })}
                        placeholder="Building cloud infrastructure with eBPF telemetry, Kafka streaming, and PyTorch RCA..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                          Company / Organization
                        </label>
                        <input
                          type="text"
                          value={individualForm.company}
                          onChange={(e) => setIndividualForm({ ...individualForm, company: e.target.value })}
                          placeholder="Acme Cloud Networks"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                          Location
                        </label>
                        <input
                          type="text"
                          value={individualForm.location}
                          onChange={(e) => setIndividualForm({ ...individualForm, location: e.target.value })}
                          placeholder="San Francisco, CA"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                          GitHub Username
                        </label>
                        <input
                          type="text"
                          value={individualForm.githubUsername}
                          onChange={(e) => setIndividualForm({ ...individualForm, githubUsername: e.target.value })}
                          placeholder="octocat"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                          LinkedIn Profile URL
                        </label>
                        <input
                          type="text"
                          value={individualForm.linkedinUrl}
                          onChange={(e) => setIndividualForm({ ...individualForm, linkedinUrl: e.target.value })}
                          placeholder="https://linkedin.com/in/username"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                        Technical Skills (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={individualForm.skills}
                        onChange={(e) => setIndividualForm({ ...individualForm, skills: e.target.value })}
                        placeholder="Kubernetes, Go, Kafka, eBPF, Next.js"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-zinc-950 font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
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
