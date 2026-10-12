'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, ShieldAlert, Cpu, Activity, Terminal, ArrowUpRight, Github } from 'lucide-react';
import { AutoTraceLogo } from '@/components/navigation/AutoTraceLogo';

export function Footer() {
  const pathname = usePathname();

  // Do not display marketing footer in authenticated console or workspace (/app/*)
  if (pathname?.startsWith('/app')) {
    return null;
  }

  return (
    <footer className="w-full border-t border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#07080B]/90 backdrop-blur-xl text-slate-600 dark:text-zinc-400 transition-colors">
      {/* Real-time telemetry ticker strip */}
      <div className="border-b border-slate-200/80 dark:border-white/[0.06] bg-white/40 dark:bg-zinc-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs font-mono min-w-0 max-w-full">
          <div className="flex items-center gap-4 flex-wrap min-w-0 max-w-full">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 break-words">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span className="font-semibold text-slate-800 dark:text-zinc-200 shrink-0">CLUSTER MESH:</span>
              <span className="truncate sm:overflow-visible">autotrace-mesh (9092, 8080, 8000, 8081)</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-slate-500 dark:text-zinc-500">
              <Activity className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span>GAT RCA LATENCY:</span>
              <span className="text-slate-800 dark:text-zinc-200 font-medium">8.4ms</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-slate-500 dark:text-zinc-500">
              <Cpu className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>eBPF KERNEL ACTUATOR:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">ARMED &amp; ZERO-DROP</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-500 dark:text-zinc-500 shrink-0">
            <span>SPEC v1.4-CANONICAL</span>
            <span className="text-slate-300 dark:text-zinc-700">|</span>
            <span className="text-slate-700 dark:text-zinc-300">IEEE DRAFT COMPLIANT</span>
          </div>
        </div>
      </div>

      {/* Main Footer Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Brand & Mission Statement Column */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4 group">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-900 dark:text-white group-hover:scale-105 transition-transform shadow-sm">
                <AutoTraceLogo className="w-4 h-4" />
              </div>
              <span className="font-semibold text-lg tracking-tight text-slate-900 dark:text-white">
                AutoTrace<span className="text-slate-500 dark:text-zinc-400 font-normal">Sec</span>
              </span>
            </Link>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mb-6 max-w-sm">
              Causal microservice anomaly detection and sub-second kernel-level rogue socket containment.
              Built on Graph Attention Networks (GAT), live topology stream reconstruction, and zero-instrumentation eBPF telemetry.
            </p>

            {/* Compliance & Certifications Badges */}
            <div className="flex flex-wrap gap-2 text-[11px] font-mono">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-200/60 dark:bg-zinc-800/80 border border-slate-300/80 dark:border-white/[0.08] text-slate-700 dark:text-zinc-300">
                <Shield className="w-3 h-3 text-emerald-500" />
                SOC-2 Type II Ready
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-200/60 dark:bg-zinc-800/80 border border-slate-300/80 dark:border-white/[0.08] text-slate-700 dark:text-zinc-300">
                <Terminal className="w-3 h-3 text-sky-500" />
                Zero-Trust Mesh
              </span>
            </div>
          </div>

          {/* Product Links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-zinc-200 font-mono">
              Product
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/how-it-works" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Pricing &amp; Watchdogs
                </Link>
              </li>
              <li>
                <Link href="/how-it-works#architecture" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Graph Engine Architecture
                </Link>
              </li>
              <li>
                <Link href="/how-it-works#gat-rca" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  GAT Root-Cause Analysis
                </Link>
              </li>
              <li>
                <Link href="/pricing#calculator" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Capacity Estimator
                </Link>
              </li>
            </ul>
          </div>

          {/* Architecture & Tech Links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-zinc-200 font-mono">
              Engine &amp; Specs
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="hover:text-slate-900 dark:hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  Event Contract JSON
                  <ArrowUpRight className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <Link href="/how-it-works#collector" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Telemetry Interceptor
                </Link>
              </li>
              <li>
                <Link href="/how-it-works#actuator" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  eBPF / iptables Actuator
                </Link>
              </li>
              <li>
                <Link href="/how-it-works#simulation" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Testbed Cluster (5000-5003)
                </Link>
              </li>
              <li>
                <Link href="/about#ieee" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  IEEE Paper Abstract
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Access */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-zinc-200 font-mono">
              Access &amp; Contact
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/login?tab=individual" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Individual Console
                </Link>
              </li>
              <li>
                <Link href="/login?tab=team" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Org Team Member Login
                </Link>
              </li>
              <li>
                <Link href="/login?tab=admin" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Org Administrator Portal
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Request Security Briefing
                </Link>
              </li>
              <li>
                <Link href="/contact#disclosure" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Responsible Disclosure
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Credits & Legal Row */}
        <div className="mt-12 pt-8 border-t border-slate-200/80 dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-zinc-500 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6">
            <span>&copy; {new Date().getFullYear()} AutoTrace-Sec Project. All rights reserved.</span>
            <Link href="/about" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              About
            </Link>
            <Link href="/contact" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Contact
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] text-slate-400 dark:text-zinc-600">
              Zero-Trust Graph Observability
            </span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              aria-label="GitHub Repository"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
