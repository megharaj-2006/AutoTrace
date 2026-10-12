'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  ExternalLink
} from 'lucide-react';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { DeployWatchdogModal } from '@/components/projects/DeployWatchdogModal';

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
  {
    id: 'fintech-payment-pipeline',
    name: 'FinTech Checkout & Vault Mesh',
    environment: 'Kubernetes Cluster (Production)',
    nodesCount: 8,
    ports: '8443, 9000, 9080',
    throughputEventsPerSec: 2850,
    status: 'ACTIVE',
    baselineStatus: 'A_base Active Invariants',
    lastAnomaly: 'None',
  },
  {
    id: 'edge-iot-telemetry-gateway',
    name: 'Edge Ingress Collector Mesh',
    environment: 'Bare-Metal Linux (systemd)',
    nodesCount: 2,
    ports: '8080, 8088',
    throughputEventsPerSec: 180,
    status: 'STANDBY',
    baselineStatus: 'Learning Invariants',
    lastAnomaly: 'None',
  },
];

export default function IndividualProjectsWorkspacePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectItem[]>(INITIAL_PROJECTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deployModalProject, setDeployModalProject] = useState<{ id: string; name: string } | null>(null);

  // New project modal form state
  const [newProject, setNewProject] = useState({
    name: '',
    environment: 'Docker Compose (autotrace-mesh)',
    nodesCount: 4,
    ports: '5000, 5001, 5002, 5003',
  });

  // Load projects from server API and localStorage with bidirectional sync
  useEffect(() => {
    let isMounted = true;
    const loadProjects = async () => {
      try {
        const res = await fetch('/api/v1/projects');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.projects) && data.projects.length > 0) {
            setProjects(data.projects);
            try {
              localStorage.setItem('autotrace_custom_projects', JSON.stringify(data.projects));
            } catch {}
            return;
          }
        }
      } catch {
        // Network fallback
      }

      // LocalStorage fallback
      try {
        const stored = localStorage.getItem('autotrace_custom_projects');
        if (stored && isMounted) {
          const parsed: ProjectItem[] = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProjects(parsed);
          }
        }
      } catch {}
    };

    loadProjects();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name) return;

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
      localStorage.setItem('autotrace_custom_projects', JSON.stringify(updated));
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

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-[#07080B] text-slate-900 dark:text-zinc-100 transition-colors">
      
      {/* Console Top Navigation Bar */}
      <ConsoleHeader currentProjectName="All Workspaces" role="individual" />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* Workspace Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 border border-slate-200 text-slate-700 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Developer Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Microservice Workspaces
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1 font-normal">
              Manage your monitored microservice clusters, eBPF telemetry pipelines, and GAT root-cause environments.
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
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
                      <Server className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                        {project.name}
                      </h3>
                      <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                        {project.id}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    project.status === 'ACTIVE'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                      : 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300'
                  }`}>
                    {project.status}
                  </span>
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
                      Watchdog Nodes Count
                    </label>
                    <input
                      type="number"
                      min="1"
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
