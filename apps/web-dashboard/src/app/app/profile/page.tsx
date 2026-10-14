'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  MapPin, 
  Building2, 
  Globe, 
  Github, 
  Linkedin, 
  Twitter, 
  ShieldCheck, 
  Edit3, 
  SlidersHorizontal, 
  CheckCircle2, 
  Sparkles, 
  Terminal, 
  Layers, 
  Copy, 
  ExternalLink, 
  Save, 
  Sun, 
  Moon, 
  Key, 
  Check,
  RefreshCw,
  Camera,
  ArrowRight,
  Lock,
  Bot,
  Image as ImageIcon,
  X,
  Repeat
} from 'lucide-react';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { useTheme } from '@/components/theme/ThemeProvider';
import { 
  getActiveUserProfile, 
  saveActiveUserProfile, 
  UserProfile, 
  DEFAULT_PROFILE, 
  PHOTO_PRESETS,
  DIGITAL_AVATAR_PRESETS,
  BANNER_PRESETS
} from '@/lib/userProfile';

function ProfilePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromQuery = searchParams.get('tab');

  const { theme, setTheme, dotMatrixEnabled, toggleDotMatrix } = useTheme();

  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'settings'>('overview');
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [formData, setFormData] = useState<UserProfile>(DEFAULT_PROFILE);
  const [skillsInput, setSkillsInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [apiToken, setApiToken] = useState('at_sec_live_98a7f43b6c1e92d0');
  
  // Instagram style flip display (photo vs avatar)
  const [activeDisplay, setActiveDisplay] = useState<'photo' | 'avatar'>('avatar');

  // Handle URL tab changes & direct edit triggers
  useEffect(() => {
    if (tabFromQuery === 'edit') {
      setActiveTab('edit');
      setIsEditModalOpen(true);
    } else if (tabFromQuery === 'settings') {
      setActiveTab('settings');
    } else {
      setActiveTab('overview');
    }
  }, [tabFromQuery]);

  // Load and listen for profile updates
  useEffect(() => {
    let isMounted = true;

    const loadProfile = (p: UserProfile) => {
      if (!isMounted) return;
      setProfile(p);
      setFormData(p);
      setSkillsInput(p.skills ? p.skills.join(', ') : '');
      setActiveDisplay(p.activeDisplayMode || (p.photoUrl ? 'photo' : 'avatar'));

      const hash = (p.id || p.email)
        .split('')
        .reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
        .toString(16)
        .replace('-', 'f');
      setApiToken(`at_sec_live_${hash.padEnd(16, 'a').slice(0, 16)}`);
    };

    getActiveUserProfile().then(loadProfile);

    const handleProfileUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<UserProfile | null>;
      if (customEvt.detail) {
        loadProfile(customEvt.detail);
      }
    };

    window.addEventListener('autotrace_profile_updated', handleProfileUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('autotrace_profile_updated', handleProfileUpdate);
    };
  }, []);

  const handleOpenEdit = () => {
    setFormData(profile);
    setSkillsInput(profile.skills ? profile.skills.join(', ') : '');
    setIsEditModalOpen(true);
    setActiveTab('edit');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const skillsArray = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updated = await saveActiveUserProfile({
      ...formData,
      skills: skillsArray,
      activeDisplayMode: activeDisplay,
    });

    setProfile(updated);
    setFormData(updated);
    setIsSaving(false);
    setSaveSuccess(true);
    setIsEditModalOpen(false);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const toggleDisplayMode = async () => {
    const nextMode = activeDisplay === 'photo' ? 'avatar' : 'photo';
    setActiveDisplay(nextMode);
    setFormData((prev) => ({ ...prev, activeDisplayMode: nextMode }));
    const updated = await saveActiveUserProfile({ activeDisplayMode: nextMode });
    setProfile(updated);
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(apiToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleRegenerateToken = () => {
    const randomHex = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    setApiToken(`at_sec_live_${randomHex}`);
  };

  // Determine current active display image
  const primaryDisplayImage =
    activeDisplay === 'photo'
      ? profile.photoUrl || profile.avatarUrl
      : profile.avatarUrl || profile.photoUrl;

  const secondaryDisplayImage =
    activeDisplay === 'photo' ? profile.avatarUrl : profile.photoUrl;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-[#07080B] text-slate-900 dark:text-zinc-100 transition-colors">
      <ConsoleHeader currentProjectName="User Profile" role={profile.role} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        
        {/* GLOBAL SAVE SUCCESS NOTIFICATION */}
        {saveSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between shadow-sm animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                <strong>Profile updated successfully!</strong> Changes have synced across your session, workspace, and account identity.
              </span>
            </div>
            <button
              onClick={() => setSaveSuccess(false)}
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* PROFILE HERO HEADER (GITHUB + LINKEDIN STYLE COVER & INSTAGRAM-STYLE PHOTO + AVATAR) */}
        <div className="relative rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0B0D13]/85 backdrop-blur-2xl overflow-hidden shadow-sm dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_16px_40px_rgba(0,0,0,0.4)] mb-8">
          
          {/* Cover Art Banner */}
          <div 
            className="h-32 sm:h-48 w-full relative bg-cover bg-center transition-all duration-300"
            style={{
              backgroundImage: profile.bannerUrl
                ? `url(${profile.bannerUrl})`
                : 'linear-gradient(to right, #0284c7, #4f46e5, #0f172a)'
            }}
          >
            <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
            
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/50 backdrop-blur-md text-white border border-white/10 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active Telemetry Profile</span>
              </span>
            </div>
          </div>

          {/* Profile Identity Bar */}
          <div className="px-5 sm:px-8 pb-6 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
              
              {/* Instagram-style Photo + Avatar Container */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
                
                {/* Photo & Digital Avatar Interactive Stack */}
                <div className="relative group shrink-0">
                  {primaryDisplayImage ? (
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-4 border-white dark:border-[#0B0D13] shadow-xl ring-1 ring-black/10 bg-slate-900">
                      <Image
                        src={primaryDisplayImage}
                        alt={profile.name}
                        fill
                        sizes="128px"
                        unoptimized
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 border-4 border-white dark:border-[#0B0D13] shadow-xl flex items-center justify-center text-3xl font-bold text-white">
                      {profile.initials}
                    </div>
                  )}

                  {/* Instagram-style Floating Secondary Avatar Badge */}
                  {secondaryDisplayImage && (
                    <button
                      type="button"
                      onClick={toggleDisplayMode}
                      className="absolute -top-2 -left-2 w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-white dark:border-[#0B0D13] shadow-lg overflow-hidden bg-white dark:bg-zinc-800 hover:scale-110 transition-transform cursor-pointer"
                      title={`Switch view to ${activeDisplay === 'photo' ? 'Digital Avatar' : 'Profile Photo'}`}
                    >
                      <Image
                        src={secondaryDisplayImage}
                        alt="Companion Avatar"
                        fill
                        sizes="40px"
                        unoptimized
                        className="object-cover"
                      />
                    </button>
                  )}

                  {/* Flip / Switch View Button */}
                  <button
                    type="button"
                    onClick={toggleDisplayMode}
                    className="absolute -bottom-2 -left-2 px-2 py-0.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-white border border-white/20 text-[10px] font-medium flex items-center gap-1 shadow-md backdrop-blur-md transition-all"
                    title="Toggle between Profile Photo and Digital Avatar"
                  >
                    <Repeat className="w-2.5 h-2.5" />
                    <span>{activeDisplay === 'photo' ? 'Show Avatar' : 'Show Photo'}</span>
                  </button>

                  {/* Edit Photo & Avatar Trigger */}
                  <button
                    onClick={handleOpenEdit}
                    className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-lg text-slate-700 dark:text-zinc-200 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
                    title="Edit Profile, Photo & Avatar"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Identity Text & Badges */}
                <div className="min-w-0 pb-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                      {profile.name}
                    </h1>
                    {profile.pronouns && (
                      <span className="text-xs text-slate-500 dark:text-zinc-400 font-normal">
                        ({profile.pronouns})
                      </span>
                    )}

                    {/* Account Type Classification Badge */}
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                      {profile.role === 'admin' 
                        ? 'Org Admin (SPOC)' 
                        : profile.role === 'team' 
                        ? 'Team Member' 
                        : 'Individual Developer'}
                    </span>

                    {/* Organizational Team Role Tag: STRICT RULE - Only for team members! */}
                    {profile.role === 'team' && profile.teamRole && (
                      <span 
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-xs"
                        title="Assigned by Organization Admin. Uneditable by team member."
                      >
                        <Lock className="w-3 h-3 text-indigo-500" />
                        <span>Team Role: {profile.teamRole}</span>
                      </span>
                    )}
                  </div>

                  <div className="text-xs sm:text-sm font-mono text-slate-500 dark:text-zinc-400 mb-2 flex items-center justify-center sm:justify-start gap-2">
                    <span>@{profile.username}</span>
                    <button
                      onClick={handleOpenEdit}
                      className="text-[11px] text-sky-500 hover:underline flex items-center gap-0.5"
                    >
                      <Edit3 className="w-2.5 h-2.5" />
                      <span>Edit Handle</span>
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-200 max-w-xl">
                    {profile.headline}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0">
                <button
                  type="button"
                  onClick={handleOpenEdit}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-zinc-950 transition-all shadow-sm cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>

                <Link
                  href="/app/projects"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 transition-all shadow-xs"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Workspaces</span>
                </Link>
              </div>

            </div>

            {/* Quick Metadata Row (GitHub & LinkedIn Style) */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-3 border-t border-slate-200/70 dark:border-zinc-800/70 text-xs text-slate-600 dark:text-zinc-400">
              {profile.company && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{profile.company}</span>
                </div>
              )}
              {profile.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{profile.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono">{profile.email}</span>
              </div>
              {profile.githubUsername && (
                <a
                  href={`https://github.com/${profile.githubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
                >
                  <Github className="w-3.5 h-3.5 text-slate-700 dark:text-zinc-300 shrink-0" />
                  <span>github.com/{profile.githubUsername}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              )}
              {profile.linkedinUrl && (
                <a
                  href={profile.linkedinUrl.startsWith('http') ? profile.linkedinUrl : `https://${profile.linkedinUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 hover:underline transition-colors"
                >
                  <Linkedin className="w-3.5 h-3.5 shrink-0" />
                  <span>LinkedIn Profile</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {profile.websiteUrl && (
                <a
                  href={profile.websiteUrl.startsWith('http') ? profile.websiteUrl : `https://${profile.websiteUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{profile.websiteUrl.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              )}
            </div>

          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex items-center gap-1 px-5 sm:px-8 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'overview'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Overview & Portfolio</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('edit');
                setFormData(profile);
                setSkillsInput(profile.skills ? profile.skills.join(', ') : '');
              }}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'edit'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile Details</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'settings'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Website & Platform Settings</span>
            </button>
          </div>

        </div>

        {/* TAB 1: OVERVIEW & PORTFOLIO */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Bio, Skills & Verified Activity */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* About & Bio Card */}
              <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0B0D13]/85 backdrop-blur-2xl shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-500" />
                    <span>Engineering Profile & Bio</span>
                  </h2>
                  <button
                    onClick={handleOpenEdit}
                    className="text-xs text-sky-500 hover:underline flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit Bio</span>
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                  {profile.bio || 'No engineering biography provided yet. Click "Edit Profile" to add your bio.'}
                </p>
              </div>

              {/* Verified Skills & Tech Stack Chips */}
              <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0B0D13]/85 backdrop-blur-2xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-500" />
                    <span>Skills, Architecture & Frameworks</span>
                  </h2>
                  <button
                    onClick={handleOpenEdit}
                    className="text-xs text-sky-500 hover:underline flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit Skills</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {profile.skills && profile.skills.length > 0 ? (
                    profile.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-zinc-800/80 text-slate-800 dark:text-zinc-200 border border-slate-200/80 dark:border-zinc-700/80 shadow-xs"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">No skills listed.</span>
                  )}
                </div>
              </div>

              {/* Organizational Role & Team Details (ONLY FOR TEAM MEMBERS) */}
              {profile.role === 'team' && (
                <div className="p-6 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 backdrop-blur-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Organizational Team Membership</span>
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700">
                      Managed by Org Admin
                    </span>
                  </div>
                  <p className="text-xs text-indigo-900/80 dark:text-indigo-300/80 mb-3 leading-relaxed">
                    You are an enrolled team member of an enterprise organization. Your team assignment and authorization permissions are administered centrally.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-zinc-800">
                      <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">Assigned Team Role</span>
                      <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-slate-400" />
                        {profile.teamRole || 'Platform SRE Lead'}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-zinc-800">
                      <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">Assigned Fleet Team</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {profile.teamName || 'core-platform'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Dedicated Fleet Cluster Status */}
              <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0B0D13]/85 backdrop-blur-2xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    <span>Coupled Microservice Clusters</span>
                  </h2>
                  <Link
                    href="/app/projects"
                    className="text-xs text-sky-500 hover:underline flex items-center gap-1"
                  >
                    <span>View All Workspaces</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-xs text-slate-900 dark:text-white">
                        Mock Amazon Cluster (Testbed)
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        In-Policy Baseline
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      4 Service Nodes (Gateway, Orders, Vault, Reviews) transmitting live eBPF telemetry over autotrace-mesh.
                    </p>
                  </div>
                  <Link
                    href="/app/projects/mock-amazon-cluster"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-zinc-950 transition-colors shrink-0"
                  >
                    Open Console
                  </Link>
                </div>
              </div>

            </div>

            {/* Right 1 Col: Platform Statistics & Identity Verification */}
            <div className="space-y-6">
              
              {/* Telemetry Activity Metrics */}
              <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0B0D13]/85 backdrop-blur-2xl shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-500" />
                  <span>Telemetry Activity</span>
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-zinc-800">
                    <span className="text-xs text-slate-600 dark:text-zinc-400">Clusters Monitored</span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {profile.clustersMonitored} Cluster
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-zinc-800">
                    <span className="text-xs text-slate-600 dark:text-zinc-400">Watchdog Nodes Online</span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {profile.watchdogNodesOnline} Nodes
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-zinc-800">
                    <span className="text-xs text-slate-600 dark:text-zinc-400">Threat Invariants Handled</span>
                    <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                      {profile.anomaliesQuarantined} Quarantined
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-slate-600 dark:text-zinc-400">Member Since</span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {profile.memberSince}
                    </span>
                  </div>
                </div>
              </div>

              {/* Connected Accounts Card */}
              <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0B0D13]/85 backdrop-blur-2xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-400" />
                    <span>Connected Identifiers</span>
                  </h2>
                  <button
                    onClick={handleOpenEdit}
                    className="text-xs text-sky-500 hover:underline flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-2.5">
                      <Github className="w-4 h-4 text-slate-900 dark:text-white" />
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">GitHub</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {profile.githubUsername ? `@${profile.githubUsername}` : 'Not linked'}
                        </div>
                      </div>
                    </div>
                    {profile.githubUsername ? (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Linked
                      </span>
                    ) : (
                      <button
                        onClick={handleOpenEdit}
                        className="text-[10px] font-medium text-sky-500 hover:underline"
                      >
                        Connect
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-2.5">
                      <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">LinkedIn</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {profile.linkedinUrl ? 'Profile Connected' : 'Not linked'}
                        </div>
                      </div>
                    </div>
                    {profile.linkedinUrl ? (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Linked
                      </span>
                    ) : (
                      <button
                        onClick={handleOpenEdit}
                        className="text-[10px] font-medium text-sky-500 hover:underline"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: EDIT PROFILE FORM */}
        {activeTab === 'edit' && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            
            {/* Real Profile Photo & Digital Mascot Avatar Studio (Instagram Style) */}
            <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0B0D13]/85 backdrop-blur-2xl shadow-sm space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-sky-500" />
                  <span>Profile Photo &amp; Digital Avatar Studio</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Configure both a real portrait photo and a stylized digital mascot avatar (like Instagram). Choose which one displays as your primary badge.
                </p>
              </div>

              {/* Display Mode Selection Pill */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    Primary Display Badge
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Switch which image represents you on headers, workspaces, and telemetry topologies.
                  </div>
                </div>
                <div className="inline-flex p-1 rounded-xl bg-slate-200/70 dark:bg-zinc-800 border border-slate-300/80 dark:border-zinc-700">
                  <button
                    type="button"
                    onClick={() => setActiveDisplay('photo')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeDisplay === 'photo'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-sky-500" />
                    <span>Real Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveDisplay('avatar')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeDisplay === 'avatar'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Digital Avatar</span>
                  </button>
                </div>
              </div>

              {/* SECTION A: DIGITAL MASCOT AVATARS */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Choose Pre-Configured Digital Mascot Avatar</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  {DIGITAL_AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, avatarUrl: preset.url });
                      }}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                        formData.avatarUrl === preset.url
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-xs ring-1 ring-emerald-500'
                          : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg overflow-hidden relative shrink-0 bg-slate-900 border border-slate-200 dark:border-zinc-800">
                        <Image
                          src={preset.url}
                          alt={preset.label}
                          fill
                          sizes="32px"
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-700 dark:text-zinc-200 truncate">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  value={formData.avatarUrl || ''}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                  placeholder="Or custom Digital Avatar SVG URL (e.g. https://api.dicebear.com/...)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              {/* SECTION B: REAL PROFILE PHOTOS */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-sky-500" />
                  <span>Choose Pre-Configured Real Engineer Portrait</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                  {PHOTO_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, photoUrl: preset.url });
                      }}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                        formData.photoUrl === preset.url
                          ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/40 shadow-xs ring-1 ring-sky-500'
                          : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg overflow-hidden relative shrink-0 border border-slate-200 dark:border-zinc-800">
                        <Image
                          src={preset.url}
                          alt={preset.label}
                          fill
                          sizes="32px"
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-700 dark:text-zinc-200 truncate">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  value={formData.photoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                  placeholder="Or custom Real Profile Photo URL (e.g. https://images.unsplash.com/...)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              {/* SECTION C: BANNER COVER ART */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Choose Cover Banner Art</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  {BANNER_PRESETS.map((banner) => (
                    <button
                      key={banner.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, bannerUrl: banner.url })}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        formData.bannerUrl === banner.url
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-xs ring-1 ring-indigo-500'
                          : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
                      }`}
                    >
                      <div className="w-full h-10 rounded-lg overflow-hidden relative mb-1.5 border border-slate-200 dark:border-zinc-800">
                        <Image
                          src={banner.url}
                          alt={banner.label}
                          fill
                          sizes="100px"
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      <span className="text-[11px] font-medium text-slate-700 dark:text-zinc-300">
                        {banner.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Core Identification Fields (Editable: Name, Username, Pronouns, Headline, Bio) */}
            <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0B0D13]/85 backdrop-blur-2xl shadow-sm space-y-4">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-sky-500" />
                <span>Personal &amp; Professional Identity</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Username / Handle *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 font-mono">
                      @
                    </span>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '') })}
                      placeholder="johndoe"
                      className="w-full pl-7 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Pronouns
                  </label>
                  <input
                    type="text"
                    value={formData.pronouns || ''}
                    onChange={(e) => setFormData({ ...formData, pronouns: e.target.value })}
                    placeholder="they/them, he/him, she/her"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Headline / Professional Role *
                </label>
                <input
                  type="text"
                  required
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  placeholder="Distributed Systems & Security Telemetry Engineer"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Engineering Bio &amp; Experience Summary
                </label>
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Describe your engineering focus, experience with microservices, security monitoring, or distributed tracing..."
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
                    value={formData.company || ''}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
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
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="San Francisco, CA"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* STRICT RULE IMPLEMENTATION: Organizational Team Member Role Field */}
              {profile.role === 'team' && (
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Organizational Team Role (Uneditable Tag)</span>
                    </label>
                    <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400">
                      Read-Only for Team Members
                    </span>
                  </div>
                  <input
                    type="text"
                    disabled
                    value={formData.teamRole || 'Platform SRE Lead'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-950 text-xs text-slate-500 dark:text-zinc-500 cursor-not-allowed font-semibold"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1.5">
                    🔒 This role tag represents your official standing in the organization. It can only be modified by the Organization Administrator or Team Leader.
                  </p>
                </div>
              )}

              {/* If Admin: Admin can edit their administrative team role */}
              {profile.role === 'admin' && (
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Organization Lead / SPOC Role</span>
                    </label>
                    <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400">
                      Editable by Org Admin
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.teamRole || 'SPOC Admin & Platform Director'}
                    onChange={(e) => setFormData({ ...formData, teamRole: e.target.value })}
                    placeholder="Enterprise Platform Director"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Technical Skills &amp; Domains (comma separated)
                </label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="Kubernetes, eBPF, Kafka, Go, Next.js, Python, GAT"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Separate each skill with a comma to generate interactive badges.
                </span>
              </div>
            </div>

            {/* Social & Professional Links */}
            <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0B0D13]/85 backdrop-blur-2xl shadow-sm space-y-4">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-500" />
                <span>Social Profiles &amp; Accounts</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    GitHub Username
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 font-mono">
                      github.com/
                    </span>
                    <input
                      type="text"
                      value={formData.githubUsername || ''}
                      onChange={(e) => setFormData({ ...formData, githubUsername: e.target.value })}
                      placeholder="octocat"
                      className="w-full pl-24 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="text"
                    value={formData.linkedinUrl || ''}
                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Personal / Engineering Website
                  </label>
                  <input
                    type="url"
                    value={formData.websiteUrl || ''}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    placeholder="https://mywebsite.dev"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Twitter / X Handle
                  </label>
                  <input
                    type="text"
                    value={formData.twitterHandle || ''}
                    onChange={(e) => setFormData({ ...formData, twitterHandle: e.target.value })}
                    placeholder="@handle"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-semibold text-xs transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Profile Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

        {/* TAB 3: WEBSITE & PLATFORM SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            
            {/* Display & Visual Preferences */}
            <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0B0D13]/85 backdrop-blur-2xl shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-sky-500" />
                <span>Console Display &amp; Aesthetics</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6">
                Customize your visual environment, dark mode glassmorphism, and background interactions.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2">
                    Interface Theme Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
                        theme === 'light'
                          ? 'bg-white text-slate-900 shadow-sm font-semibold'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                      }`}
                    >
                      <Sun className="w-4 h-4 text-amber-500" />
                      <span>Light Mode</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
                        theme === 'dark'
                          ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Moon className="w-4 h-4 text-sky-400" />
                      <span>Dark Mode</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col justify-center">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
                    <div>
                      <div className="font-semibold text-xs text-slate-900 dark:text-white">
                        Interactive Dot Matrix
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                        Cursor physics background grid
                      </div>
                    </div>
                    <button
                      type="button"
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
              </div>
            </div>

            {/* Autonomous Security & Threat Policies */}
            <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0B0D13]/85 backdrop-blur-2xl shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Autonomous Threat Containment Policy</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">
                Define how detected rogue edges and anomalies trigger actuator-security socket drops.
              </p>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 cursor-pointer hover:border-sky-500/50 transition-colors">
                  <input
                    type="radio"
                    name="containment_policy"
                    defaultChecked
                    className="mt-1 text-sky-500 focus:ring-sky-500"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      Full Autonomous Enforcement (Default)
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                      When the Graph Engine and ML Detector flag a Rogue Edge link anomaly, immediately dispatch socket-drop rules to the Security Actuator without manual confirmation.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 cursor-pointer hover:border-sky-500/50 transition-colors">
                  <input
                    type="radio"
                    name="containment_policy"
                    className="mt-1 text-sky-500 focus:ring-sky-500"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      Advisory &amp; Manual Approval
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Emit high-severity alert banners to the console and web dashboard. Containment scripts require one-click operator confirmation before iptables or eBPF drops are applied.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Watchdog Agent API Credentials */}
            <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0B0D13]/85 backdrop-blur-2xl shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500" />
                <span>Watchdog Telemetry Agent Token</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">
                Use this profile-scoped token in your <code className="text-sky-500 font-mono">telemetry-collector</code> environment to transmit live metrics to your dedicated workspaces.
              </p>

              <div className="flex items-center gap-2">
                <div className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-950 text-xs font-mono text-slate-900 dark:text-zinc-200 truncate select-all">
                  {apiToken}
                </div>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-200 transition-colors shadow-xs"
                >
                  {copiedToken ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleRegenerateToken}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 transition-colors shadow-xs"
                  title="Regenerate Token"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* INSTANT EDIT PROFILE MODAL: Guarantees clicking "Edit Profile" immediately opens the editor anywhere */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0B0D13] p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Edit Profile &amp; Identifiers
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Update your photo, digital avatar, handle, pronouns, and bio.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Avatar & Photo Previews */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 space-y-3">
                <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                  Digital Avatar &amp; Portrait Selection
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  {DIGITAL_AVATAR_PRESETS.slice(0, 4).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatarUrl: preset.url })}
                      className={`p-1.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                        formData.avatarUrl === preset.url
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50'
                          : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg overflow-hidden relative bg-slate-900">
                        <Image src={preset.url} alt={preset.label} fill sizes="32px" unoptimized className="object-cover" />
                      </div>
                      <span className="text-[10px] font-medium truncate w-full text-center text-slate-700 dark:text-zinc-300">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Username / Handle *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '') })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Pronouns
                  </label>
                  <input
                    type="text"
                    value={formData.pronouns || ''}
                    onChange={(e) => setFormData({ ...formData, pronouns: e.target.value })}
                    placeholder="they/them"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Headline
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Organizational Team Member Role (Uneditable tag in modal) */}
              {profile.role === 'team' && (
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-amber-500" />
                      <span>Organizational Team Role</span>
                    </span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono">
                      Uneditable by Member
                    </span>
                  </div>
                  <input
                    type="text"
                    disabled
                    value={formData.teamRole || 'Platform SRE Lead'}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-950 text-xs text-slate-500 cursor-not-allowed font-medium"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Bio
                </label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={formData.company || ''}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-semibold text-xs shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function UserProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#07080B]">
        <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-sky-500" />
          <span>Loading User Profile...</span>
        </div>
      </div>
    }>
      <ProfilePageInner />
    </Suspense>
  );
}
