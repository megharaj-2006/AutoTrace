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
    <div className="flex flex-col w-full">
      
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-12 sm:mb-16">
            
            {/* Precision Release Badge - Neutral Theme Adapted */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 border border-slate-200 text-slate-700 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] mb-6 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>AutoTrace-Sec v1.4 Live Mesh Engine</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-slate-900 dark:text-white leading-[1.08]">
              Causal Graph Defense for Distributed Systems.
            </h1>

            {/* Sub-headline */}
            <p className="mt-6 text-base sm:text-xl text-slate-600 dark:text-zinc-400 max-w-2xl font-normal leading-relaxed">
              Continuous live dependency graph reconstruction from eBPF telemetry, rogue lateral edge link prediction with Graph Attention Networks, and sub-second kernel socket containment.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 font-medium text-sm">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                <span>Deploy Free Sandbox Node</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
              >
                <Terminal className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                <span>Architecture Specification</span>
              </Link>
            </div>

            {/* Micro Stats Row - Unified Primary Typography */}
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs text-slate-500 dark:text-zinc-400 pt-8 border-t border-slate-200/60 dark:border-zinc-800/60 w-full max-w-2xl">
              <div>
                <span className="text-slate-900 dark:text-white font-semibold block text-2xl tracking-tight">&lt; 350ms</span>
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Detection-to-Drop</span>
              </div>
              <div>
                <span className="text-slate-900 dark:text-white font-semibold block text-2xl tracking-tight">0.0%</span>
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Code Modification</span>
              </div>
              <div>
                <span className="text-slate-900 dark:text-white font-semibold block text-2xl tracking-tight">8.4ms</span>
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">GAT Inference SLA</span>
              </div>
              <div>
                <span className="text-slate-900 dark:text-white font-semibold block text-2xl tracking-tight">9092</span>
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Redpanda Kafka Bus</span>
              </div>
            </div>

          </div>

          {/* Interactive WebGL 3D Spatial Topology Node Cluster */}
          <div className="w-full max-w-5xl mx-auto">
            <Hero3DCluster />
          </div>

        </div>
      </section>

      {/* Bento Grid Architecture Section */}
      <BentoGrid />

      {/* Interactive Sandbox Experience */}
      <ConsoleSandboxPreview />

      {/* Architecture Blueprint Dataflow */}
      <ArchitectureBlueprint />

      {/* Interactive Watchdog Pricing Estimator */}
      <PricingCalculator />

      {/* Bottom CTA Banner */}
      <section className="py-20 bg-slate-900 text-white dark:bg-[#07080B] border-t border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-zinc-800/80 text-zinc-300 border border-zinc-700/80 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Zero Privilege Leakage</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
            Isolate rogue lateral attacks before exfiltration occurs.
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
            Connect your Docker Compose or Kubernetes cluster in less than five minutes using our pre-built eBPF collector and Kafka producer configs.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-zinc-950 font-semibold text-sm transition-all"
            >
              <span>Get Started as Individual</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/register?type=organization"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-white font-semibold text-sm transition-all"
            >
              <span>Register Organization Cluster</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
