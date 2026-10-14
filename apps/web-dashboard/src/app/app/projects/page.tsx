'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Layers, 
  Activity, 
  ArrowRight, 
  Server, 
  ShieldCheck, 
  Cpu, 
  Filter, 
  Search, 
  CheckCircle2, 
  X, 
  Radio, 
  ExternalLink,
  Trash2,
  Edit3,
  Building2,
  MapPin,
  Github,
  Linkedin,
  SlidersHorizontal
} from 'lucide-react';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { DeployWatchdogModal } from '@/components/projects/DeployWatchdogModal';
import { getActiveUserProfile, UserProfile } from '@/lib/userProfile';

interface ProjectItem {
  id: string;
  name: string;
  environment: string;
  nodesCount: number;
  ports: string;
  throughputEventsPerSec: number;
  status: 'ACTIVE' | 'DEGRADED' | 'STANDBY';
  baselineStatus: string;
  lastAnomaly: string;
}

// Exactly ONE default project across all new profiles: The core Mock Amazon Testbed
const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: 'mock-amazon-cluster',
    name: 'Mock Amazon Cluster (Testbed)',
    environment: 'Docker Compose (autotrace-mesh)',
    nodesCount: 4,
    ports: '5000, 5001, 5002, 5003',
    throughputEventsPerSec: 1420,
    status: 'ACTIVE',
    baselineStatus: 'A_base Active Invariants',
    lastAnomaly: 'None (100% In-Policy)',
  },
];

export default function IndividualProjectsWorkspacePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectItem[]>(INITIAL_PROJECTS);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deployModalProject, setDeployModalProject] = useState<{ id: string; name: string } | null>(null);

  // New project modal form state
  const [newProject, setNewProject] = useState({
    name: '',
    environment: 'Docker Compose (autotrace-mesh)',
    nodesCount: 0,
    ports: '5000, 5001, 5002, 5003',
  });

  // Load dedicated user profile and user-scoped projects
  useEffect(() => {
    let isMounted = true;

    const initWorkspace = async () => {
      const profile = await getActiveUserProfile();
      if (!isMounted) return;
      setUserProfile(profile);

      const userKey = profile.id || profile.email;
      const storageKey = `autotrace_projects_${userKey}`;

      // Clean up legacy stale un-scoped cache if present
      try {
        const legacyStale = localStorage.getItem('autotrace_custom_projects');
        if (legacyStale) {
          localStorage.removeItem('autotrace_custom_projects');
        }
      } catch {}

      // 1. Immediately hydrate from dedicated user-scoped localStorage
      let activeProjects: ProjectItem[] = INITIAL_PROJECTS;
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Strip out any legacy unwanted dummy projects
            const filtered = parsed.filter(
              (p: ProjectItem) =>
                p.id !== 'fintech-payment-pipeline' && p.id !== 'edge-iot-telemetry-gateway'
            );
            // Ensure mock-amazon-cluster always exists as the foundational testbed
            if (!filtered.some((p) => p.id === 'mock-amazon-cluster')) {
              filtered.unshift(INITIAL_PROJECTS[0]);
            }
            activeProjects = filtered;
            if (isMounted) {
              setProjects(activeProjects);
            }
          }
        }
      } catch {}

      // 2. Sync with backend API
      try {
        const endpoint = userKey
          ? `/api/v1/projects?userId=${encodeURIComponent(userKey)}`
          : '/api/v1/projects';
        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.projects) && data.projects.length > 0) {
            const cleanServerProjects: ProjectItem[] = data.projects.filter(
              (p: any) =>
                p.id !== 'fintech-payment-pipeline' && p.id !== 'edge-iot-telemetry-gateway'
            );

            // Merge server projects with cached projects to preserve user creations
            const mergedMap = new Map<string, ProjectItem>();
            INITIAL_PROJECTS.forEach((p) => mergedMap.set(p.id, p));
            activeProjects.forEach((p) => mergedMap.set(p.id, p));
            cleanServerProjects.forEach((p) => mergedMap.set(p.id, p));

            const merged = Array.from(mergedMap.values());
            setProjects(merged);
            try {
              localStorage.setItem(storageKey, JSON.stringify(merged));
            } catch {}
          }
        }
      } catch {
        // Network fallback
      }
    };

    initWorkspace();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name) return;

    const userKey = userProfile?.id || userProfile?.email || 'default-user';
    const storageKey = `autotrace_projects_${userKey}`;

    let created: ProjectItem = {
      id: newProject.name.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-'),
      name: newProject.name.trim(),
      environment: newProject.environment,
      nodesCount: 0,
      ports: newProject.ports,
      throughputEventsPerSec: 0,
      status: 'STANDBY',
      baselineStatus: 'Awaiting Watchdog Connection',
      lastAnomaly: 'None',
    };

    try {
      const res = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProject.name,
          environment: newProject.environment,
          ports: newProject.ports,
          userId: userKey,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.project) {
          created = data.project;
        }
      }
    } catch (err) {
      console.error('[CreateProject] Failed saving to server API:', err);
    }

    const updated = [created, ...projects.filter((p) => p.id !== created.id)];
    setProjects(updated);

    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}

    setIsCreateModalOpen(false);
    setDeployModalProject({ id: created.id, name: created.name });
    setNewProject({
      name: '',
      environment: 'Docker Compose (autotrace-mesh)',
      nodesCount: 0,
      ports: '5000, 5001, 5002, 5003',
    });
  };

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (projectId === 'mock-amazon-cluster') return;

    if (!confirm('Are you sure you want to delete this microservice workspace?')) {
      return;
    }

    try {
      await fetch(`/api/v1/projects/${encodeURIComponent(projectId)}`, {
        method: 'DELETE',
      });
    } catch {}

    const updated = projects.filter((p) => p.id !== projectId);
    setProjects(updated);

    const userKey = userProfile?.id || userProfile?.email || 'default-user';
    const storageKey = `autotrace_projects_${userKey}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-[#07080B] text-slate-900 dark:text-zinc-100 transition-colors">
      
      {/* Console Top Navigation Bar */}
      <ConsoleHeader currentProjectName="My Workspaces" role="individual" />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* User Profile Summary Banner */}
        {userProfile && (
          <div className="mb-8 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0B0D13]/85 backdrop-blur-2xl shadow-sm dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <Link
              href="/app/profile"
              className="flex items-center gap-3.5 group cursor-pointer min-w-0"
              title="Click to open full profile"
            >
              <div className="relative shrink-0">
                {userProfile.avatarUrl ? (
                  <Image
                    src={userProfile.avatarUrl}
                    alt={userProfile.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-xl object-cover border border-sky-500/40 shadow-xs group-hover:ring-2 group-hover:ring-sky-500 transition-all"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 border border-white/10 shadow-xs flex items-center justify-center text-sm font-bold text-white group-hover:scale-105 transition-transform">
                    {userProfile.initials}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0B0D13]" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <span className="font-semibold text-sm text-slate-900 dark:text-white truncate group-hover:text-sky-500 transition-colors">
                    {userProfile.name}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    @{userProfile.username || 'developer'}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                    {userProfile.role === 'admin' ? 'Org Admin' : 'Developer'}
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-zinc-400 line-clamp-1">
                  {userProfile.headline || 'Distributed Systems & Security Telemetry Engineer'}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-500 dark:text-zinc-500">
                  {userProfile.company && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {userProfile.company}
                    </span>
                  )}
                  {userProfile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {userProfile.location}
                    </span>
                  )}
                  {userProfile.githubUsername && (
                    <span className="flex items-center gap-1 text-slate-700 dark:text-zinc-300">
                      <Github className="w-3 h-3" />
                      {userProfile.githubUsername}
                    </span>
                  )}
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-zinc-800">
              <Link
                href="/app/profile"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-200 transition-colors shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-sky-500" />
                <span>View & Edit Profile</span>
              </Link>
              <Link
                href="/app/profile?tab=settings"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 transition-colors shadow-xs"
                title="Profile & Dashboard Settings"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Workspace Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 border border-slate-200 text-slate-700 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{userProfile?.name ? `${userProfile.name}'s Dedicated Workspace` : 'Dedicated Workspace'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {userProfile?.name ? `${userProfile.name}'s Microservice Fleet` : 'Microservice Workspaces'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1 font-normal">
              Dedicated cluster environments, watchdog nodes, and telemetry topologies for {userProfile?.email || 'your account'}.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-semibold text-xs transition-all shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Project</span>
          </button>
        </div>

        {/* Global Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0B0D13]/85 backdrop-blur-xl shadow-sm dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium block mb-1">
              Active Monitored Projects
            </span>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {projects.length} <span className="text-xs font-normal text-slate-400">Clusters</span>
            </div>
            <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              All instances transmitting
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0B0D13]/85 backdrop-blur-xl shadow-sm dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium block mb-1">
              Watchdog Nodes Online
            </span>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {projects.reduce((acc, curr) => acc + curr.nodesCount, 0)}{' '}
              <span className="text-xs font-normal text-slate-400">/ 25 Cap</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
              eBPF Socket Hooks Verified
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0B0D13]/85 backdrop-blur-xl shadow-sm dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium block mb-1">
              Aggregated Stream Ingress
            </span>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {projects.reduce((acc, curr) => acc + curr.throughputEventsPerSec, 0).toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-400">events/s</span>
            </div>
            <div className="mt-1 text-[11px] text-sky-600 dark:text-sky-400">
              Redpanda 9092 Partitioned
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by project name or ID..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="text-xs text-slate-500 dark:text-zinc-400 self-end sm:self-center font-medium">
            Showing {filteredProjects.length} of {projects.length} projects
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0B0D13]/85 backdrop-blur-xl p-5 sm:p-6 flex flex-col justify-between hover:border-slate-300 dark:hover:border-white/[0.16] transition-all duration-300 shadow-sm dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_8px_32px_rgba(0,0,0,0.36)] group"
            >
              <div>
                {/* Project Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                      <Server className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
                        {project.name}
                      </h3>
                      <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono truncate block">
                        {project.id}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      project.status === 'ACTIVE'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300'
                    }`}>
                      {project.status}
                    </span>

                    {project.id !== 'mock-amazon-cluster' && (
                      <button
                        onClick={(e) => handleDeleteProject(project.id, e)}
                        title="Delete project workspace"
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-500 dark:text-zinc-400 mb-4 font-normal">
                  {project.environment}
                </div>

                {/* Micro Metric Highlights */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl border border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-zinc-950/80 text-xs mb-6">
                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-zinc-500 block">Nodes</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {project.nodesCount} Services
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-zinc-500 block">Telemetry</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      ~{project.throughputEventsPerSec} evt/s
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Card Buttons */}
              <div className="flex items-center">
                <Link
                  href={`/app/projects/${project.id}`}
                  className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800/80 text-slate-900 dark:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm group"
                >
                  <span>Launch Console</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Modal: Create New Project */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-100">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0B0D13]/95 backdrop-blur-2xl p-5 sm:p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-4">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-sky-500" />
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Create New Project
                  </h3>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                    Project Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="e.g. Orders Microservice Cluster"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                    Orchestration Environment
                  </label>
                  <select
                    value={newProject.environment}
                    onChange={(e) => setNewProject({ ...newProject, environment: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Docker Compose (autotrace-mesh)">Docker Compose (autotrace-mesh network)</option>
                    <option value="Kubernetes Cluster (Production)">Kubernetes DaemonSet</option>
                    <option value="Bare-Metal Linux (systemd)">Bare-Metal Linux (systemd eBPF)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                      Initial Nodes Count
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={newProject.nodesCount}
                      onChange={(e) => setNewProject({ ...newProject, nodesCount: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                      Port Allocations
                    </label>
                    <input
                      type="text"
                      value={newProject.ports}
                      onChange={(e) => setNewProject({ ...newProject, ports: e.target.value })}
                      placeholder="5000, 5001, 5002"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-semibold text-xs shadow-sm"
                  >
                    Create Workspace
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Deploy Watchdog Hub */}
        {deployModalProject && (
          <DeployWatchdogModal
            isOpen={!!deployModalProject}
            onClose={() => setDeployModalProject(null)}
            projectId={deployModalProject.id}
            projectName={deployModalProject.name}
            onLaunchConsole={(id) => router.push(`/app/projects/${id}`)}
          />
        )}

      </main>

    </div>
  );
}
