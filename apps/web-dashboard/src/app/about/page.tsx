'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  Cpu, 
  Terminal, 
  Network, 
  Lock, 
  FileText, 
  ArrowRight,
  GitBranch,
  BookOpen
} from 'lucide-react';

export default function AboutPage() {
  const engineeringRoles = [
    {
      role: 'Distributed Systems & Platform',
      member: 'Member 1',
      tech: 'Go 1.22+ / Python / Docker / Redpanda',
      focus: 'High-throughput eBPF socket interception, Redpanda/Kafka 9092 event buses, Docker Compose mesh orchestration, and multi-service testbed simulation.',
    },
    {
      role: 'Graph Engine & Backend Architecture',
      member: 'Member 2',
      tech: 'Java 21 / Spring Boot 3.3+ / Maven',
      focus: 'Real-time in-memory topological dependency graph building, Kafka ingestion, WebSocket telemetry broadcasting to Cytoscape, and ML actuation dispatching.',
    },
    {
      role: 'AI / Graph Machine Learning',
      member: 'Member 3',
      tech: 'Python 3.11 / PyTorch Geometric / FastAPI',
      focus: 'Graph Attention Networks (GAT) for root-cause patient-zero attribution (/rca) and Baseline Adjacency Matrix (A_base) rogue edge link prediction (/score-edge).',
    },
    {
      role: 'Cybersecurity & Autonomous Actuation',
      member: 'Member 4',
      tech: 'Python 3.11 / eBPF / iptables / SPIFFE-SPIRE',
      focus: 'Sub-second kernel socket-drop filters, automated containment daemon, lateral movement attack vectors (SSRF, rogue curl), and chaos fault injection.',
    },
  ];

  return (
    <div className="flex flex-col w-full py-12 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 border border-slate-200 text-slate-700 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] mb-4 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>The AutoTrace-Sec Philosophy</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900 dark:text-white leading-tight">
            Building causal defense for the distributed cloud era.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-zinc-400 leading-relaxed">
            Modern microservice architectures fail causally, not in isolation. AutoTrace-Sec was founded on the conviction that security monitoring must be grounded in live graph topology and sub-second kernel-level reaction.
          </p>
        </div>

        {/* Mission & Problem Statement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <div className="p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0B0D13]/85 backdrop-blur-xl shadow-sm dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] scroll-reveal">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
              The Alert Fatigue Problem
            </h2>
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mb-4">
              When a rogue actor executes an SSRF exploit or moves laterally across microservices, legacy APMs generate hundreds of downstream alerts: CPU spikes in service B, database connection timeouts in service C, and 504 Gateway errors in service A.
            </p>
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              Human incident response teams take an average of 28 minutes to manually correlate these logs, by which time data exfiltration is complete.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl border border-sky-500/30 bg-sky-50/20 dark:bg-sky-500/5 backdrop-blur-xl shadow-sm dark:shadow-[inset_0_1px_0_0_rgba(56,189,248,0.1)] scroll-reveal">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
              The Causal Graph Solution
            </h2>
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mb-4">
              AutoTrace-Sec treats the cluster as a live directed mathematical graph G = (V, E). Every transaction creates or traverses an edge (u, v).
            </p>
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              By continuously evaluating topological edge invariants against the learned baseline matrix A_base and running Graph Attention Network (GAT) inference, AutoTrace-Sec pinpoints the root cause in milliseconds and drops the attacker socket before the pod can be exploited further.
            </p>
          </div>
        </div>

        {/* 4-Member Engineering Ownership Matrix */}
        <div className="mb-20">
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Engineering Architecture Ownership
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
              The AutoTrace-Sec system is divided into modular, contract-first ownership domains:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {engineeringRoles.map((eng) => (
              <div
                key={eng.role}
                className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0B0D13]/85 backdrop-blur-xl shadow-sm dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-slate-300 dark:hover:border-white/[0.16] transition-all duration-300 scroll-reveal"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06] mb-3 font-mono text-xs flex-wrap gap-1">
                  <span className="font-bold text-sky-600 dark:text-sky-400">{eng.member}</span>
                  <span className="text-slate-400 dark:text-zinc-500">{eng.tech}</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                  {eng.role}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                  {eng.focus}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* IEEE Research Publication Reference */}
        <div id="ieee" className="p-6 sm:p-10 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-zinc-950/80 backdrop-blur-xl font-mono text-xs dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] scroll-reveal">
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-semibold mb-3">
            <FileText className="w-4 h-4" />
            <span>RESEARCH SPECIFICATION &amp; IEEE DRAFT</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 font-sans">
            &ldquo;Autonomous Causal Telemetry and Sub-Second Kernel Containment via Graph Neural Networks in Distributed Microservices&rdquo;
          </h3>
          <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed mb-6">
            Presents empirical evaluation across an injected e-commerce microservice cluster with SSRF lateral movement, rogue RPC link creation, and stress testing. Demonstrates &gt;97.8% root-cause accuracy and &lt;350ms median containment latency without service disruption.
          </p>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px]">
            <span className="px-2.5 py-1 rounded bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
              Benchmark Dataset: Mock Amazon Cluster (5000-5003)
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
              Reproducible via infra/docker-compose.testbed.yml
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
