'use client';

import React, { useState } from 'react';
import { Activity, Terminal } from 'lucide-react';

type SandboxMode = 'normal' | 'rogue' | 'contained';

export function ConsoleSandboxPreview() {
  const [mode, setMode] = useState<SandboxMode>('normal');

  return (
    <section className="py-20 lg:py-28 bg-slate-50/50 dark:bg-[#07080B]/50 border-t border-slate-200/80 dark:border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            {/* Theme-Neutral Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 border border-slate-200 text-slate-700 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] mb-4 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Interactive Reconstruction Sandbox</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Experience zero-downtime threat containment in action.
            </h2>
          </div>
          <p className="text-slate-600 dark:text-zinc-400 text-sm max-w-md font-normal leading-relaxed">
            Test how the Graph Engine and Actuator respond to unauthorized lateral requests between internal services.
          </p>
        </div>

        {/* Sandbox Console Container */}
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0B0D13] shadow-xl overflow-hidden text-xs">
          
          {/* Console Header & Scenario Selector */}
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/80 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-zinc-700 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-zinc-700 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-zinc-700 inline-block"></span>
              <span className="ml-2 font-medium text-slate-800 dark:text-zinc-200">
                autotrace-sec://telemetry-mesh-preview
              </span>
            </div>

            {/* Mode Selector Buttons */}
            <div className="flex items-center gap-1.5 bg-slate-200/60 dark:bg-zinc-900 p-1 rounded-lg border border-slate-300/80 dark:border-zinc-800">
              <button
                onClick={() => setMode('normal')}
                className={`px-3 py-1.5 rounded-md text-xs transition-all ${
                  mode === 'normal'
                    ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-medium'
                }`}
              >
                1. Baseline Flow
              </button>
              <button
                onClick={() => setMode('rogue')}
                className={`px-3 py-1.5 rounded-md text-xs transition-all ${
                  mode === 'rogue'
                    ? 'bg-rose-600 text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-rose-600 font-medium'
                }`}
              >
                2. Inject Rogue SSRF
              </button>
              <button
                onClick={() => setMode('contained')}
                className={`px-3 py-1.5 rounded-md text-xs transition-all ${
                  mode === 'contained'
                    ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-emerald-600 font-medium'
                }`}
              >
                3. Actuator Quarantined
              </button>
            </div>
          </div>

          {/* Sandbox Main Body: Grid with Graph View + Live Telemetry Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px]">
            
            {/* Left 7 Columns: Visual Cluster State */}
            <div className="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-zinc-800 flex flex-col justify-between bg-slate-50/40 dark:bg-zinc-950/30">
              
              {/* Status Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Live Mesh Topology State
                  </span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                  mode === 'normal'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                    : mode === 'rogue'
                    ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                    : 'bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-300'
                }`}>
                  {mode === 'normal' && '100% In-Policy'}
                  {mode === 'rogue' && 'Anomaly Score: 0.984'}
                  {mode === 'contained' && 'Threat Neutralized'}
                </span>
              </div>

              {/* Topology Node Diagram Cards */}
              <div className="my-8 grid grid-cols-2 gap-4">
                
                {/* Node 1: Gateway */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-sm">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>gateway-service</span>
                    <span className="text-emerald-500 font-semibold">5000</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                    HTTP Reverse Proxy
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500 dark:text-zinc-400">
                    p99: 1.1ms · Egress: order-service
                  </div>
                </div>

                {/* Node 2: Order Service */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-sm">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>order-service</span>
                    <span className="text-emerald-500 font-semibold">5001</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                    Checkout Orchestrator
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500 dark:text-zinc-400">
                    p99: 2.4ms · Calls: vault, reviews
                  </div>
                </div>

                {/* Node 3: Reviews Service */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  mode === 'rogue'
                    ? 'border-rose-500 bg-rose-500/5 shadow-md shadow-rose-500/10'
                    : mode === 'contained'
                    ? 'border-amber-500 bg-amber-500/5'
                    : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90'
                }`}>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>reviews-service</span>
                    <span className="font-semibold text-amber-500">5003</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                    Vulnerable Endpoint
                  </div>
                  <div className="mt-2 text-[11px]">
                    {mode === 'normal' && <span className="text-emerald-600 dark:text-emerald-400">Baseline Ingress Only</span>}
                    {mode === 'rogue' && <span className="text-rose-600 dark:text-rose-400 font-semibold">EXPLOIT: SSRF Rogue Outbound</span>}
                    {mode === 'contained' && <span className="text-amber-600 dark:text-amber-400 font-semibold">Egress Blocked by eBPF</span>}
                  </div>
                </div>

                {/* Node 4: Payment Vault */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  mode === 'rogue'
                    ? 'border-rose-500/80 bg-rose-500/5'
                    : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90'
                }`}>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>payment-vault</span>
                    <span className="text-emerald-500 font-semibold">5002</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                    PCI Credit Vault
                  </div>
                  <div className="mt-2 text-[11px]">
                    {mode === 'normal' && <span className="text-slate-500">Authorized: order-service only</span>}
                    {mode === 'rogue' && <span className="text-rose-600 dark:text-rose-400 font-semibold">Target of Rogue Probe</span>}
                    {mode === 'contained' && <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Secured: Rogue Packet Dropped</span>}
                  </div>
                </div>

              </div>

              {/* Metric Readout Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                <span>In-Memory Graph: 4 Nodes, {mode === 'normal' ? '3' : '4'} Edges</span>
                <span>Baseline Divergence: {mode === 'normal' ? '0.00' : mode === 'rogue' ? '98.42' : '0.00'}%</span>
              </div>
            </div>

            {/* Right 5 Columns: Stream Terminal Logs */}
            <div className="lg:col-span-5 p-6 bg-slate-900 text-slate-300 dark:bg-[#07080B] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-xs text-zinc-400 mb-4">
                  <span className="flex items-center gap-2 text-zinc-200 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Kafka 9092 &amp; ML Event Stream
                  </span>
                  <span className="text-emerald-400 text-[11px]">Streaming Live</span>
                </div>

                <div className="space-y-2 text-xs leading-relaxed">
                  {mode === 'normal' && (
                    <>
                      <div className="text-zinc-400">[15:32:01.002] INFO collector: GET /products/101 &lt;200 OK, 1.2ms&gt;</div>
                      <div className="text-zinc-400">[15:32:01.008] INFO graph-engine: edge (gateway -&gt; order) verified against A_base</div>
                      <div className="text-zinc-400">[15:32:01.012] INFO collector: order called payment-vault:5002 &lt;200 OK, 3.4ms&gt;</div>
                      <div className="text-emerald-400">[15:32:01.020] OK gat-rca: anomaly score 0.04 (threshold 0.75) - PASS</div>
                    </>
                  )}

                  {mode === 'rogue' && (
                    <>
                      <div className="text-zinc-300">[15:32:05.101] ALERT proxy: X-Exploit-Origin: SSRF_LATERAL_PROBE detected</div>
                      <div className="text-rose-400 font-semibold">[15:32:05.104] WARN graph-engine: Rogue edge detected: reviews-service -&gt; payment-vault</div>
                      <div className="text-rose-400">[15:32:05.112] ALERT ml-detector /score-edge: anomaly_probability=0.9841</div>
                      <div className="text-amber-400">[15:32:05.114] DISPATCH: alert payload sent to actuator:8081</div>
                      <div className="text-zinc-300">[15:32:05.116] GAT RCA: Root-cause patient zero identified as &apos;reviews-service&apos;</div>
                    </>
                  )}

                  {mode === 'contained' && (
                    <>
                      <div className="text-emerald-400">[15:32:05.442] ACTUATOR: Received rogue edge containment command</div>
                      <div className="text-sky-300 font-medium">[15:32:05.445] EXEC: iptables -I FORWARD -s reviews-service -d payment-vault -j DROP</div>
                      <div className="text-sky-300">[15:32:05.448] EXEC: bpf_map_update_elem(socket_quarantine_map, 5003-&gt;5002)</div>
                      <div className="text-emerald-400 font-semibold">[15:32:05.450] CONTAINED: Attack blocked in 348ms. Legitimate cluster unaffected.</div>
                    </>
                  )}
                </div>
              </div>

              {/* Execution Summary Badge */}
              <div className="mt-6 pt-4 border-t border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Contract: telemetry-event.json</span>
                <span className="text-sky-400 font-medium">Reaction: &lt; 350ms</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
