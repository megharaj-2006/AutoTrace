'use client';

import React from 'react';

export function BentoGrid() {
  return (
    <section className="py-20 lg:py-28 border-t border-slate-200/80 dark:border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          {/* Refined Theme-Neutral Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 border border-slate-200 text-slate-700 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] mb-4 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Engineering Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Designed for sub-millisecond causal defense across distributed topologies.
          </h2>
          <p className="mt-4 text-slate-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed font-normal">
            Legacy APMs inspect metrics in silos. AutoTrace-Sec reconstructs the full directional call graph in memory, continuously testing live transactions against learned baseline invariants (A_base).
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-full">
          
          {/* Card 1: eBPF Interception (Large span) */}
          <div className="md:col-span-2 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white/80 dark:bg-[#0B0D13]/80 p-6 sm:p-8 flex flex-col justify-between hover:border-slate-300 dark:hover:border-sky-500/30 transition-all shadow-sm hover:shadow-xl dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl group">
            <div>
              {/* Minimal Precision Vector Icon */}
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-200 mb-6 shadow-sm">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                  <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                  <line x1="6" y1="6" x2="6.01" y2="6"></line>
                  <line x1="6" y1="18" x2="6.01" y2="18"></line>
                </svg>
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 tracking-wider uppercase mb-2">
                Kernel-Level Observability
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight mb-3">
                Zero-Instrumentation eBPF Telemetry Ingestion
              </h3>
              <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mb-6 font-normal">
                Hooks directly into socket layer system calls (<code className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 font-medium">sys_enter_connect</code>, <code className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 font-medium">tcp_sendmsg</code>). Extracts canonical 9-field telemetry records without code alterations, runtime agent bloat, or sidecar latency degradation.
              </p>
            </div>

            {/* High-Grade Architectural Vector Schematic */}
            <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-zinc-950/70 p-4 sm:p-5 backdrop-blur-md">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-zinc-800 text-xs">
                <span className="font-medium text-slate-600 dark:text-zinc-400">Kernel Ring Buffer Flow</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Overhead &lt; 0.18%</span>
              </div>
              
              {/* Clean Vector Architecture Graphic - Responsive 1 to 3 cols */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-center text-xs">
                <div className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-xs">
                  <div className="font-semibold text-slate-900 dark:text-white">Socket Layer</div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">kprobe / sockops</div>
                </div>
                <div className="p-3 rounded-lg border border-sky-500/30 bg-sky-50/50 dark:bg-sky-500/10 shadow-xs">
                  <div className="font-semibold text-sky-700 dark:text-sky-300">BPF Ringbuf</div>
                  <div className="text-[11px] text-sky-600 dark:text-sky-400 mt-1">Lossless Queue</div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-xs">
                  <div className="font-semibold text-slate-900 dark:text-white">Kafka Stream</div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">Topic 9092</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: GAT Attention Mechanism */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white/80 dark:bg-[#0B0D13]/80 p-6 sm:p-8 flex flex-col justify-between hover:border-slate-300 dark:hover:border-sky-500/30 transition-all shadow-sm hover:shadow-xl dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <div>
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-200 mb-6 shadow-sm">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 tracking-wider uppercase mb-2">
                Graph Neural Networks
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight mb-3">
                GAT Root-Cause Pinpointing
              </h3>
              <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mb-6 font-normal">
                Computes attention coefficients across directional execution paths to isolate patient zero in multi-hop cascaded faults.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-zinc-950/70 p-4 backdrop-blur-md">
              <div className="text-xs font-medium text-slate-500 dark:text-zinc-400 mb-2">Attention Edge Formulation</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-200 py-1 overflow-x-auto select-all">
                α_ij = softmax( LeakyReLU( aᵀ · [ Wh_i ∥ Wh_j ] ) )
              </div>
              <div className="mt-2 text-xs text-sky-600 dark:text-sky-400 font-medium">
                Inference Latency: 8.4ms (FastAPI:8000)
              </div>
            </div>
          </div>

          {/* Card 3: Shannon Entropy Rogue Edge Gate */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white/80 dark:bg-[#0B0D13]/80 p-6 sm:p-8 flex flex-col justify-between hover:border-slate-300 dark:hover:border-sky-500/30 transition-all shadow-sm hover:shadow-xl dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <div>
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-200 mb-6 shadow-sm">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 tracking-wider uppercase mb-2">
                Topological Entropy
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight mb-3">
                Shannon Entropy Gate
              </h3>
              <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mb-6 font-normal">
                Continuous measurement of graph degree entropy identifies rogue links and lateral movement before data exfiltration occurs.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-zinc-950/70 p-4 backdrop-blur-md">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="font-medium text-slate-500 dark:text-zinc-400">Degree Entropy</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">H(G) = 0.94 nats</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 w-[78%]"></div>
              </div>
              <div className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
                Trigger Threshold: 0.72 nats (Armed)
              </div>
            </div>
          </div>

          {/* Card 4: Sub-Second Actuation */}
          <div className="md:col-span-2 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white/80 dark:bg-[#0B0D13]/80 p-6 sm:p-8 flex flex-col justify-between hover:border-slate-300 dark:hover:border-sky-500/30 transition-all shadow-sm hover:shadow-xl dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <div>
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-200 mb-6 shadow-sm">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 tracking-wider uppercase mb-2">
                Automated Containment
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight mb-3">
                Sub-Second Kernel Drop Actuation
              </h3>
              <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mb-6 font-normal">
                Upon verified rogue edge detection from the ML detector, the Actuator daemon enforces immediate socket-drop filters via Linux <code className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 font-medium">iptables</code>, eBPF XDP programs, and SPIFFE/SPIRE certificate revocation—terminating the attack corridor in under 350ms without stopping neighboring microservices.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-zinc-950/70 backdrop-blur-md">
                <span className="text-[11px] text-slate-400 dark:text-zinc-500 block mb-1 font-medium">Detection-to-Drop</span>
                <span className="text-base font-semibold text-emerald-600 dark:text-emerald-400">&lt; 350 ms</span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-zinc-950/70 backdrop-blur-md">
                <span className="text-[11px] text-slate-400 dark:text-zinc-500 block mb-1 font-medium">Collateral Impact</span>
                <span className="text-base font-semibold text-slate-900 dark:text-white">0.0% Non-Affected</span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-zinc-950/70 backdrop-blur-md">
                <span className="text-[11px] text-slate-400 dark:text-zinc-500 block mb-1 font-medium">Enforcement Hook</span>
                <span className="text-base font-semibold text-sky-600 dark:text-sky-400">BPF Socket Drop</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
