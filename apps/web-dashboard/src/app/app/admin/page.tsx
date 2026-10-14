'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Download, 
  Users, 
  Terminal, 
  Copy, 
  Check, 
  Plus, 
  Server, 
  Key, 
  Lock, 
  X,
  ExternalLink,
  Cpu
} from 'lucide-react';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';

interface TeamAssignment {
  id: string;
  teamName: string;
  projectId: string;
  memberIdPrefix: string;
  assignedNodes: number;
  status: 'ACTIVE' | 'INVITED';
}

const INITIAL_TEAMS: TeamAssignment[] = [
  {
    id: 'team-1',
    teamName: 'checkout-sre',
    projectId: 'mock-amazon-cluster',
    memberIdPrefix: 'usr-checkout-*',
    assignedNodes: 4,
    status: 'ACTIVE',
  },
  {
    id: 'team-2',
    teamName: 'payment-vault-security',
    projectId: 'mock-amazon-cluster',
    memberIdPrefix: 'usr-vault-*',
    assignedNodes: 2,
    status: 'ACTIVE',
  },
  {
    id: 'team-3',
    teamName: 'platform-infra',
    projectId: 'mock-amazon-cluster',
    memberIdPrefix: 'usr-infra-*',
    assignedNodes: 4,
    status: 'ACTIVE',
  },
];

export default function OrgAdminFleetPage() {
  const [teams, setTeams] = useState<TeamAssignment[]>(INITIAL_TEAMS);
  const [selectedProjectForCollector, setSelectedProjectForCollector] = useState('mock-amazon-cluster');
  const [availableProjects, setAvailableProjects] = useState<string[]>(['mock-amazon-cluster']);
  const [copiedScript, setCopiedScript] = useState(false);
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/v1/projects')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.projects) && data.projects.length > 0) {
          setAvailableProjects(data.projects.map((p: any) => p.id));
        }
      })
      .catch(() => {});
  }, []);

  // Policy toggles
  const [autonomousDrop, setAutonomousDrop] = useState(true);
  const [spiffeRevocation, setSpiffeRevocation] = useState(true);

  // New team state
  const [newTeam, setNewTeam] = useState({
    teamName: '',
    projectId: 'mock-amazon-cluster',
    memberIdPrefix: '',
  });

  const collectorScript = `# AutoTrace-Sec Telemetry Watchdog v1.2.0 (< 15 MB Standalone Agent)
# Option A: 1-Line Zero-Dependency Host Installation:
curl -sSL https://get.autotrace.io/watchdog.sh | sudo bash -s -- \\
  --token="atk_live_acme_849201f8" \\
  --gateway="http://localhost:8085"`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(collectorScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleProvisionTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeam.teamName) return;

    const provisioned: TeamAssignment = {
      id: `team-${teams.length + 1}`,
      teamName: newTeam.teamName,
      projectId: newTeam.projectId,
      memberIdPrefix: newTeam.memberIdPrefix || `usr-${newTeam.teamName}-*`,
      assignedNodes: 4,
      status: 'ACTIVE',
    };

    setTeams([...teams, provisioned]);
    setIsProvisionModalOpen(false);
    setNewTeam({ teamName: '', projectId: 'mock-amazon-cluster', memberIdPrefix: '' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-[#07080B] text-slate-900 dark:text-zinc-100 transition-colors">
      
      {/* Console Top Navigation */}
      <ConsoleHeader currentProjectName="Org Fleet Admin Portal" role="admin" />

      {/* Main Admin Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* SPOC Admin Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 border border-slate-200 text-slate-700 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>Single Point of Contact (SPOC) Authority</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Organization Fleet Administrator Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1 font-normal">
              Manage enterprise collector distribution bundles, issue team project credentials, and configure automated kernel drop policies.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0B0D13] text-xs font-medium text-slate-700 dark:text-zinc-300 shadow-sm">
              License: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Enterprise Fleet (14/25 Nodes)</span>
            </span>
          </div>
        </div>

        {/* SECTION 1: Telemetry Collector Distribution Desk */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0B0D13]/85 backdrop-blur-xl p-5 sm:p-6 lg:p-8 shadow-sm dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] mb-8 min-w-0 max-w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/[0.06] mb-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Download className="w-4 h-4 text-sky-500" />
                <span>Telemetry Watchdog Distribution Hub (&lt; 15 MB Agent)</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                As the organization administrator, deploy the zero-dependency Watchdog host daemon to monitored nodes via 1-line curl installer or direct binary archive.
              </p>
            </div>

            {/* Project Picker for Collector */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Target Project:</span>
              <select
                value={selectedProjectForCollector}
                onChange={(e) => setSelectedProjectForCollector(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
              >
                {availableProjects.map((pId) => (
                  <option key={pId} value={pId}>
                    {pId}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Option A: Copyable Terminal Package Box */}
          <div className="mb-4">
            <div className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2 flex items-center justify-between">
              <span>Option A: Instant 1-Line Curl Installation</span>
              <span className="text-[11px] text-emerald-500 font-medium">Zero Runtime Dependencies</span>
            </div>
            <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-black/80 backdrop-blur-md p-4 text-slate-800 dark:text-slate-300 relative text-xs min-w-0 max-w-full overflow-x-auto">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200 dark:border-zinc-800 text-[11px] text-slate-500 dark:text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>BASH HOST INSTALLER SCRIPT</span>
                </div>
                <button
                  onClick={handleCopyScript}
                  className="flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Copied' : 'Copy Command'}</span>
                </button>
              </div>
              <pre className="text-sky-600 dark:text-sky-400 leading-relaxed overflow-x-auto whitespace-pre font-mono font-normal text-[11px] sm:text-xs">
                {collectorScript}
              </pre>
            </div>
          </div>

          {/* Option B: Direct Download Binary */}
          <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                Option B: Direct Standalone Agent Download
              </div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                Supported: Linux x86_64 / ARM64, Kernel 5.4+ (eBPF &amp; Socket Interceptor)
              </div>
            </div>

            <a
              href={`/api/v1/projects/${selectedProjectForCollector}/watchdog/download`}
              download
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors shadow-sm w-full sm:w-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Watchdog Agent (.tar.gz) - 12.4 MB</span>
            </a>
          </div>
        </div>

        {/* SECTION 2: Multi-Team Project Access & Credentials */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0B0D13]/85 backdrop-blur-xl p-5 sm:p-6 lg:p-8 shadow-sm dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] mb-8 min-w-0 max-w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800 mb-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Users className="w-4 h-4 text-emerald-500" />
                <span>Authorized Organization Teams &amp; Projects</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Teams authenticate using Project ID, Member ID, and Team Name to access their isolated console.
              </p>
            </div>

            <button
              onClick={() => setIsProvisionModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-semibold text-xs transition-colors shadow-sm shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Provision Team Access</span>
            </button>
          </div>

          {/* Teams Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 font-medium">
                  <th className="pb-3 font-medium">Team Name</th>
                  <th className="pb-3 font-medium">Assigned Project ID</th>
                  <th className="pb-3 font-medium">Member ID Pattern</th>
                  <th className="pb-3 font-medium">Monitored Nodes</th>
                  <th className="pb-3 font-medium">Access Status</th>
                  <th className="pb-3 font-medium text-right">Direct Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {teams.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors">
                    <td className="py-3.5 font-semibold text-slate-900 dark:text-white">
                      {t.teamName}
                    </td>
                    <td className="py-3.5 text-slate-700 dark:text-zinc-300">
                      {t.projectId}
                    </td>
                    <td className="py-3.5 text-slate-500 dark:text-zinc-400">
                      {t.memberIdPrefix}
                    </td>
                    <td className="py-3.5 text-slate-700 dark:text-zinc-300">
                      {t.assignedNodes} Nodes
                    </td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <Link
                        href={`/app/projects/${t.projectId}`}
                        className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline font-medium"
                      >
                        <span>Open Console</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 3: Global Automated Containment Actuator Policies */}
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0B0D13] p-6 lg:p-8 shadow-sm">
          <div className="pb-4 border-b border-slate-100 dark:border-zinc-800 mb-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <Lock className="w-4 h-4 text-amber-500" />
              <span>Fleet-Wide Security Containment Policies (Actuator :8081)</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Configure how the actuator daemon responds across all organizational microservice topologies.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">
                  Autonomous eBPF Socket-Drop Enforcement (&lt; 350ms)
                </div>
                <div className="text-slate-500 dark:text-zinc-400 mt-0.5">
                  Automatically drops rogue socket corridors via iptables &amp; BPF maps upon verified GAT anomaly (&gt; 0.75).
                </div>
              </div>
              <button
                onClick={() => setAutonomousDrop(!autonomousDrop)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  autonomousDrop ? 'bg-sky-500' : 'bg-slate-300 dark:bg-zinc-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    autonomousDrop ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">
                  SPIFFE/SPIRE mTLS Revocation on SSRF Breaches
                </div>
                <div className="text-slate-500 dark:text-zinc-400 mt-0.5">
                  Revokes x509-SVID identity certificates from patient-zero compromised microservice pods.
                </div>
              </div>
              <button
                onClick={() => setSpiffeRevocation(!spiffeRevocation)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  spiffeRevocation ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    spiffeRevocation ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Modal: Provision Team Access */}
        {isProvisionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-100">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0B0D13] p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-4">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Provision Team Access
                  </h3>
                </div>
                <button
                  onClick={() => setIsProvisionModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleProvisionTeam} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTeam.teamName}
                    onChange={(e) => setNewTeam({ ...newTeam, teamName: e.target.value })}
                    placeholder="e.g. reviews-core-sre"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                    Assigned Project ID
                  </label>
                  <select
                    value={newTeam.projectId}
                    onChange={(e) => setNewTeam({ ...newTeam, projectId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  >
                    {availableProjects.map((pId) => (
                      <option key={pId} value={pId}>
                        {pId}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                    Member ID Pattern Prefix
                  </label>
                  <input
                    type="text"
                    value={newTeam.memberIdPrefix}
                    onChange={(e) => setNewTeam({ ...newTeam, memberIdPrefix: e.target.value })}
                    placeholder="usr-reviews-*"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsProvisionModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm"
                  >
                    Issue Team Credentials
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
