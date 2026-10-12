'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function PricingCalculator() {
  const [nodeCount, setNodeCount] = useState<number>(4);

  // Dynamic calculations based on node count
  const eventsPerSec = nodeCount * 350;
  const memoryMB = nodeCount * 64;
  const recommendedTier = 
    nodeCount <= 2 
      ? { name: 'Individual Community', price: 0, cta: 'Start Free Sandbox', href: '/register' }
      : nodeCount <= 10 
      ? { name: 'Engineering Team', price: 99, cta: 'Deploy Team Cluster', href: '/register?tier=team' }
      : { name: 'Enterprise Fleet', price: 299, cta: 'Contact Enterprise Sales', href: '/contact?tier=enterprise' };

  return (
    <section id="calculator" className="py-20 lg:py-28 border-t border-slate-200/80 dark:border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 border border-slate-200 text-slate-700 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] mb-4 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Capacity &amp; Pricing Estimator</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Scale seamlessly from single services to enterprise fleets.
          </h2>
          <p className="mt-4 text-slate-600 dark:text-zinc-400 text-sm font-normal">
            Drag the slider to calculate your cluster&apos;s real-time telemetry throughput, GAT inference requirements, and recommended plan.
          </p>
        </div>

        {/* Calculator Widget Box */}
        <div className="max-w-4xl mx-auto rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0B0D13]/85 backdrop-blur-2xl p-5 sm:p-8 md:p-12 shadow-xl dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_16px_40px_rgba(0,0,0,0.4)] min-w-0 max-w-full">
          
          {/* Slider Control */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <label htmlFor="node-range" className="text-sm font-semibold text-slate-900 dark:text-white">
                Active Microservice Nodes (Watchdogs)
              </label>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {nodeCount} {nodeCount === 1 ? 'Node' : 'Nodes'}
              </div>
            </div>

            <input
              id="node-range"
              type="range"
              min="1"
              max="30"
              value={nodeCount}
              onChange={(e) => setNodeCount(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-white"
            />

            <div className="flex justify-between text-[11px] sm:text-xs text-slate-400 dark:text-zinc-500 mt-2 font-medium flex-wrap gap-1">
              <span>1 Node (Solo)</span>
              <span>10 Nodes (Standard Mesh)</span>
              <span>30+ Nodes (High-Scale Fleet)</span>
            </div>
          </div>

          {/* Metric Estimates Grid - Unified Typography */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-xs">
            
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/70 dark:bg-zinc-950/60 backdrop-blur-md">
              <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1 font-medium">
                Telemetry Throughput
              </div>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                ~{eventsPerSec.toLocaleString()} <span className="text-xs font-normal text-slate-500">events/s</span>
              </div>
              <div className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">Direct to Redpanda:9092</div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/70 dark:bg-zinc-950/60 backdrop-blur-md">
              <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1 font-medium">
                Graph Memory Footprint
              </div>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                ~{memoryMB} <span className="text-xs font-normal text-slate-500">MB RAM</span>
              </div>
              <div className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">In-memory Graph Engine</div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/70 dark:bg-zinc-950/60 backdrop-blur-md">
              <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1 font-medium">
                GAT RCA SLA
              </div>
              <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                &lt; 9.2 <span className="text-xs font-normal text-slate-500">ms</span>
              </div>
              <div className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">Sub-second containment</div>
            </div>

          </div>

          {/* Recommended Plan Result Banner */}
          <div className="p-5 sm:p-6 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/60 dark:bg-zinc-900/40 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-zinc-400 tracking-wider uppercase mb-1">
                Recommended Tier
              </div>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                {recommendedTier.name}
                <span className="text-lg font-normal text-slate-500 dark:text-zinc-400">
                  {recommendedTier.price === 0 ? 'Free' : `$${recommendedTier.price}/mo`}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-normal">
                Includes full eBPF telemetry collector binaries, Graph Engine WS broadcaster, and GAT RCA models.
              </p>
            </div>

            <Link
              href={recommendedTier.href}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 transition-all shrink-0 shadow-sm w-full sm:w-auto"
            >
              <span>{recommendedTier.cta}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}
