'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Terminal } from 'lucide-react';
import { Hero3DCluster } from '@/components/hero/Hero3DCluster';
import { BentoGrid } from '@/components/home/BentoGrid';
import { ConsoleSandboxPreview } from '@/components/home/ConsoleSandboxPreview';
import { ArchitectureBlueprint } from '@/components/home/ArchitectureBlueprint';
import { PricingCalculator } from '@/components/home/PricingCalculator';

export default function HomePage() {
  return (
    <div className="flex flex-col w-full max-w-full overflow-x-hidden">
      
      {/* Hero Section */}
      <section className="relative pt-8 pb-16 sm:pt-14 sm:pb-24 lg:pt-20 lg:pb-28 overflow-hidden max-w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 max-w-full">
          
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-10 sm:mb-16 animate-subtle-entrance">
            
            {/* Precision Release Badge - Google Studio Inspired */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 border border-slate-200 text-slate-700 dark:bg-zinc-950/80 dark:border-white/[0.08] dark:text-zinc-300 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_2px_8px_rgba(0,0,0,0.3)] mb-6 transition-all hover:scale-[1.02]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="tracking-tight">AutoTrace-Sec v1.4 Live Mesh Engine</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-semibold tracking-tight text-slate-900 dark:text-white leading-[1.1] max-w-full">
              Causal Graph Defense for Distributed Systems.
            </h1>

            {/* Sub-headline */}
            <p className="mt-5 sm:mt-6 text-sm sm:text-lg lg:text-xl text-slate-600 dark:text-zinc-400 max-w-2xl font-normal leading-relaxed px-2">
              Continuous live dependency graph reconstruction from eBPF telemetry, rogue lateral edge link prediction with Graph Attention Networks, and sub-second kernel socket containment.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 font-medium text-sm w-full sm:w-auto px-4 sm:px-0">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 text-center"
              >
                <span>Deploy Free Sandbox Node</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all text-center"
              >
                <Terminal className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                <span>Architecture Specification</span>
              </Link>
            </div>

            {/* Micro Stats Row - Responsive 2x2 to 4-col */}
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-xs text-slate-500 dark:text-zinc-400 pt-8 border-t border-slate-200/60 dark:border-zinc-800/60 w-full max-w-2xl px-2">
              <div className="text-center sm:text-left">
                <span className="text-slate-900 dark:text-white font-semibold block text-xl sm:text-2xl tracking-tight">&lt; 350ms</span>
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 font-medium">Detection-to-Drop</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="text-slate-900 dark:text-white font-semibold block text-xl sm:text-2xl tracking-tight">0.0%</span>
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 font-medium">Code Modification</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="text-slate-900 dark:text-white font-semibold block text-xl sm:text-2xl tracking-tight">8.4ms</span>
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 font-medium">GAT Inference SLA</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="text-slate-900 dark:text-white font-semibold block text-xl sm:text-2xl tracking-tight">9092</span>
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 font-medium">Redpanda Kafka Bus</span>
              </div>
            </div>

          </div>

          {/* Interactive WebGL 3D Spatial Topology Node Cluster */}
          <div className="w-full max-w-5xl mx-auto scroll-reveal">
            <Hero3DCluster />
          </div>

        </div>
      </section>

      {/* Bento Grid Architecture Section */}
      <div className="scroll-reveal">
        <BentoGrid />
      </div>

      {/* Interactive Sandbox Experience */}
      <div className="scroll-reveal">
        <ConsoleSandboxPreview />
      </div>

      {/* Architecture Blueprint Dataflow */}
      <div className="scroll-reveal">
        <ArchitectureBlueprint />
      </div>

      {/* Interactive Watchdog Pricing Estimator */}
      <div className="scroll-reveal">
        <PricingCalculator />
      </div>

      {/* Bottom CTA Banner */}
      <section className="py-16 sm:py-20 bg-slate-50 dark:bg-[#07080B] text-slate-900 dark:text-white border-t border-slate-200 dark:border-white/[0.08] scroll-reveal">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700/80 mb-6 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Zero Privilege Leakage</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight mb-4 text-slate-900 dark:text-white">
            Isolate rogue lateral attacks before exfiltration occurs.
          </h2>
          <p className="text-slate-600 dark:text-zinc-400 text-xs sm:text-base max-w-2xl mx-auto mb-8 leading-relaxed font-normal px-2">
            Connect your microservices in less than two minutes using our 1-line Telemetry Watchdog curl installer (&lt; 15 MB) and automated eBPF socket interceptor.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-zinc-950 font-semibold text-sm transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Get Started as Individual</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/register?type=organization"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-200 dark:border-white/[0.12] bg-white hover:bg-slate-100 text-slate-900 dark:bg-zinc-850/80 dark:hover:bg-zinc-800 dark:text-white font-semibold text-sm transition-all shadow-xs"
            >
              <span>Register Organization Cluster</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
