'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function ArchitectureBlueprint() {
  const steps = [
    {
      step: '01',
      title: 'eBPF Interceptor',
      owner: 'Member 1',
      port: 'Kernel Socket',
      description: 'Zero-overhead socket tracing on connect() and tcp_sendmsg() without changing service code.',
      tech: 'Go / C eBPF',
    },
    {
      step: '02',
      title: 'Kafka Stream',
      owner: 'Member 1',
      port: 'Port 9092',
      description: 'Lossless asynchronous telemetry event streaming governed by telemetry-event.json.',
      tech: 'Redpanda Broker',
    },
    {
      step: '03',
      title: 'Graph Engine',
      owner: 'Member 2',
      port: 'Port 8080',
      description: 'Maintains live in-memory microservice graph topology and orchestrates ML edge scoring.',
      tech: 'Java 21 / Spring Boot',
    },
    {
      step: '04',
      title: 'ML Detector (GAT)',
      owner: 'Member 3',
      port: 'Port 8000',
      description: 'Scores rogue link predictions against A_base and isolates primary root-cause patient zero.',
      tech: 'PyG / FastAPI',
    },
    {
      step: '05',
      title: 'Security Actuator',
      owner: 'Member 4',
      port: 'Port 8081',
      description: 'Enforces sub-second rogue socket drops via iptables and eBPF filters without killing pods.',
      tech: 'Python / iptables',
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-slate-50/50 dark:bg-[#07080B]/50 border-t border-slate-200/80 dark:border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 border border-slate-200 text-slate-700 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] mb-4 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Pipeline Architecture Blueprint</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Contract-first, event-driven distributed pipeline.
          </h2>
          <p className="mt-4 text-slate-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed font-normal">
            All services communicate over the frozen <code className="text-xs px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 font-medium">autotrace-mesh</code> network using strict JSON Schema event contracts.
          </p>
        </div>

        {/* Blueprint Pipeline Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {steps.map((item) => (
            <div
              key={item.step}
              className="relative rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/70 dark:bg-[#0B0D13]/90 p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/80 mb-4">
                  <span className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
                    STAGE {item.step}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-medium">
                    {item.port}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mb-4 font-normal">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 dark:text-zinc-500">{item.owner}</span>
                <span className="text-slate-700 dark:text-zinc-300 font-medium">{item.tech}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Contract Single Source of Truth Banner */}
        <div className="mt-8 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-[#0B0D13]/90 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-slate-700 dark:text-zinc-300">
              Contract Enforced: <code className="text-sky-600 dark:text-sky-400 font-medium">shared/schemas/telemetry-event.json</code> &amp; <code className="text-sky-600 dark:text-sky-400 font-medium">alert-payload.json</code>
            </span>
          </div>

          <Link
            href="/how-it-works#architecture"
            className="text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1 transition-colors font-medium"
          >
            <span>Read Architecture Specification</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </section>
  );
}
