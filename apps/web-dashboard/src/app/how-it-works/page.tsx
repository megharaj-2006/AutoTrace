'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Download, 
  Cpu, 
  ShieldCheck, 
  Zap, 
  Layers, 
  Terminal, 
  Network, 
  CheckCircle2, 
  ArrowRight,
  GitBranch,
  Lock,
  Radio
} from 'lucide-react';

export default function HowItWorksPage() {
  const steps = [
    {
      num: '01',
      title: 'STAGE 01: Deploy the Lightweight Telemetry Watchdog (< 15 MB)',
      summary: 'Zero code modification, instant 1-line curl install or single binary download. Intercepts socket traffic via eBPF kernel hooks out-of-band.',
      description: 'The AutoTrace-Sec Telemetry Watchdog runs as a lightweight, zero-dependency host daemon (< 15 MB). It attaches out-of-band eBPF probes to socket lifecycle events (or loopback socket interceptors), computes Shannon entropy on request bodies in real time, formats events into the strict 9-field JSON contract, and forwards them asynchronously without adding microservice latency.',
      code: `# Instant 1-line installation via curl
curl -sSL https://get.autotrace.io/watchdog.sh | sudo bash -s -- \\
  --token=at_live_demo_9841 \\
  --gateway=http://localhost:8085`,
      badge: 'Lightweight Agent (< 15 MB)',
    },
    {
      num: '02',
      title: 'Graph Engine Reconstructs Live Topology & Invariants',
      summary: 'Kafka streams ingestion translates flat packet traces into an in-memory directed dependency graph.',
      description: 'The Graph Engine consumes telemetry from Redpanda (port 9092), constructing nodes and edges in real time. It calculates graph density, Shannon entropy, and queries the ML Detector (/score-edge) to evaluate every transaction against the learned baseline adjacency matrix (A_base).',
      code: `// Directed graph edge verification
public boolean evaluateEdge(String src, String dest) {
    if (!baselineAdjacencyMatrix.hasEdge(src, dest)) {
        ScoreResponse score = mlClient.scoreEdge(src, dest);
        if (score.anomalyProbability() > 0.75) {
            alertDispatcher.publish(new AlertPayload(src, dest, score));
            return false;
        }
    }
    return true;
}`,
      badge: 'In-Memory Graph & Kafka Bus',
    },
    {
      num: '03',
      title: 'GAT Root-Cause Analysis & Automated Sub-Second Containment',
      summary: 'ML identifies patient zero and the Actuator enforces kernel packet drops in under 350ms.',
      description: 'When anomalous entropy or rogue edges occur, PyTorch Geometric Graph Attention Networks calculate attention weights (α_ij) to distinguish initial compromise from downstream cascade. The Actuator daemon automatically drops rogue packets via iptables and eBPF maps without terminating healthy pods.',
      code: `# Actuator autonomous packet isolation
iptables -I FORWARD -s reviews-service -d payment-vault -j DROP
bpf_map_update_elem(quarantine_corridor_map, &rogue_key, &DROP_RULE, BPF_ANY)
# Cluster services continue running at 100% availability`,
      badge: 'Sub-Second Kernel Containment',
    },
  ];

  const benefits = [
    {
      title: 'Zero Code Modification',
      desc: 'No SDK imports, no wrapper frameworks, and no sidecar proxy proxy latency penalties. Runs transparently at the OS kernel level.',
      icon: Terminal,
    },
    {
      title: 'Causal RCA vs. Siloed Metric Thresholds',
      desc: 'Instead of drowning engineers in 500 simultaneous CPU alerts, Graph Attention Networks isolate the exact initial breach node.',
      icon: Cpu,
    },
    {
      title: 'Sub-Second Reaction Speed (< 350ms)',
      desc: 'Halts unauthorized lateral SSRF probes before exfiltration payloads can execute, reducing Mean Time to Contain (MTTC) by 99%.',
      icon: Zap,
    },
    {
      title: 'Surgical Quarantine with Zero Blast Radius',
      desc: 'Terminates only the unauthorized communication vector between the attacker and target. Legitimate microservice traffic remains 100% online.',
      icon: ShieldCheck,
    },
    {
      title: 'Strict Contract-First Architecture',
      desc: 'Every stage adheres to shared versioned JSON schemas (telemetry-event.json and alert-payload.json) preventing pipeline drift.',
      icon: GitBranch,
    },
    {
      title: 'Full SOC-2 & Zero-Trust Compliance',
      desc: 'Provides cryptographically verifiable audit trails of all discovered rogue links, actuation commands, and topology evolutions.',
      icon: Lock,
    },
  ];

  return (
    <div className="flex flex-col w-full py-12 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 border border-slate-200 text-slate-700 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] mb-4 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Technical Implementation Guide</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900 dark:text-white leading-tight">
            How AutoTrace-Sec Works: From eBPF Socket Interception to Automated Containment.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-zinc-400 leading-relaxed font-normal">
            A comprehensive engineering walkthrough of the three-stage lifecycle and the transformative operational benefits of causal graph observability.
          </p>
        </div>

        {/* 3-Step Lifecycle Detailed Walkthrough */}
        <div className="space-y-12 mb-24">
          {steps.map((s) => (
            <div
              key={s.num}
              className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0B0D13]/85 backdrop-blur-xl p-5 sm:p-8 lg:p-10 shadow-sm dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_12px_36px_rgba(0,0,0,0.36)] scroll-reveal"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 min-w-0 max-w-full">
                
                {/* Text Description */}
                <div className="w-full lg:w-1/2 min-w-0">
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-white/[0.08]">
                      STAGE {s.num}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">
                      {s.badge}
                    </span>
                  </div>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3">
                    {s.title}
                  </h2>
                  <p className="text-sm font-medium text-slate-700 dark:text-zinc-300 mb-3">
                    {s.summary}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed mb-6">
                    {s.description}
                  </p>
                </div>

                {/* Code Terminal Box */}
                <div className="w-full lg:w-1/2 min-w-0 max-w-full rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-black/80 backdrop-blur-md p-4 text-xs font-mono text-slate-800 dark:text-slate-300 overflow-x-auto shadow-inner">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200 dark:border-zinc-800 text-[11px] text-slate-500 dark:text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                      <span>TERMINAL / RUNTIME CODE</span>
                    </div>
                    <span>BASH &amp; JAVA 21</span>
                  </div>
                  <pre className="text-sky-600 dark:text-sky-400 font-mono leading-relaxed whitespace-pre text-[11px] sm:text-xs overflow-x-auto min-w-0 max-w-full">
                    {s.code}
                  </pre>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="mb-24">
          <div className="max-w-3xl mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 border border-slate-200 text-slate-700 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] mb-4 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Key Engineering Advantages</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Why leading infrastructure teams choose causal microservice defense.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0B0D13]/85 backdrop-blur-xl p-6 hover:border-slate-300 dark:hover:border-white/[0.16] transition-all duration-300 shadow-sm dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] group scroll-reveal"
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    {b.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                    {b.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Call to Action */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#0B0D13]/85 backdrop-blur-2xl text-slate-900 dark:text-white p-6 sm:p-12 text-center shadow-lg dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_16px_40px_rgba(0,0,0,0.4)]">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-slate-900 dark:text-white">
            Ready to test AutoTrace-Sec on your architecture?
          </h2>
          <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-xl mx-auto mb-8">
            Deploy in minutes with our standalone Docker Compose evaluation sandbox. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white dark:text-zinc-950 font-semibold text-xs transition-colors shadow-sm text-center"
            >
              Start Dedicated Evaluation
            </Link>
            <Link
              href="/pricing"
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white font-semibold text-xs transition-colors shadow-xs text-center"
            >
              View Tier Pricing
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
