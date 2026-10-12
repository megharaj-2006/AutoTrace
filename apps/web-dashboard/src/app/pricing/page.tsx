'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Check, 
  HelpCircle, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Users, 
  User, 
  Layers, 
  Sliders
} from 'lucide-react';
import { PricingCalculator } from '@/components/home/PricingCalculator';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const individualPlans = [
    {
      name: 'Developer Community',
      price: 0,
      description: 'Ideal for local debugging, security research, and open-source microservice experiments.',
      features: [
        'Up to 3 Watchdog Nodes',
        'Local Docker Compose mesh support',
        'In-Memory Graph Engine (8080)',
        'Canonical telemetry-event.json support',
        'Basic link prediction scoring',
        'Community Discord & GitHub support',
      ],
      cta: 'Deploy Local Sandbox',
      href: '/register?tier=community',
      popular: false,
    },
    {
      name: 'Individual Pro',
      price: billingCycle === 'monthly' ? 29 : 24,
      description: 'For solo backend engineers and security researchers securing microservice projects in production.',
      features: [
        'Up to 10 Watchdog Nodes',
        'Persistent Redpanda/Kafka telemetry streams',
        'Full PyG GAT Root-Cause Analysis (/rca)',
        'Sub-second rogue link alert webhooks',
        'Historical graph topology replay (7 days)',
        'Priority email developer support',
      ],
      cta: 'Start Pro Trial',
      href: '/register?tier=pro',
      popular: true,
    },
  ];

  const orgPlans = [
    {
      name: 'Organization Team',
      price: billingCycle === 'monthly' ? 99 : 84,
      description: 'For growing engineering organizations running multi-service production topologies with shared teams.',
      features: [
        'Up to 25 Watchdog Nodes',
        'Multi-Team Login (Project ID + Team Name)',
        'Automated eBPF Socket-Drop Actuator',
        'Custom A_base baseline training triggers',
        'WebSocket live topology broadcast to dashboard',
        'Historical graph topology replay (30 days)',
        'Standard SLA & Team Slack channel',
      ],
      cta: 'Create Org Team',
      href: '/register?tier=team',
      popular: false,
    },
    {
      name: 'Enterprise Fleet',
      price: billingCycle === 'monthly' ? 299 : 249,
      description: 'For enterprise platforms requiring high-throughput zero-trust defense and centralized admin control.',
      features: [
        'Unlimited Watchdog Nodes',
        'Dedicated Org Admin Portal & Collector token issuance',
        'Kernel-level eBPF & iptables automated containment',
        'SPIFFE/SPIRE mTLS certificate revocation hooks',
        'Custom PyTorch Geometric model fine-tuning',
        '99.99% Uptime SLA & 24/7 dedicated security desk',
        'SSO (Okta, Google Workspace, Azure AD)',
      ],
      cta: 'Contact Enterprise Sales',
      href: '/contact?tier=enterprise',
      popular: true,
    },
  ];

  const faqs = [
    {
      q: 'What is a "Watchdog Node"?',
      a: 'A Watchdog Node corresponds to a single monitored microservice process or container (e.g., gateway-service:5000 or payment-vault:5002) emitting telemetry events to the Redpanda Kafka bus.',
    },
    {
      q: 'Do I need to compile custom kernel modules for eBPF?',
      a: 'No. AutoTrace-Sec uses standard BPF CO-RE (Compile Once – Run Everywhere) programs targeting Linux kernels 5.8+ and standard iptables packet filtering without recompiling or loading unverified out-of-tree kernel modules.',
    },
    {
      q: 'How does Organization Team login differ from Individual login?',
      a: 'Individuals log in with an email and password to access their personal sandbox. Organization team members log in using a Project ID, User ID, and Team Name, granting them isolated visibility into that specific project’s live topology.',
    },
    {
      q: 'What does the Org Admin do?',
      a: 'The Org Admin serves as the central administrative authority between your company and AutoTrace-Sec. The admin generates telemetry collector binary bundles, issues fleet tokens, and assigns projects to specific teams.',
    },
  ];

  return (
    <div className="flex flex-col w-full py-12 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 border border-slate-200 text-slate-700 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] mb-4 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Transparent Pricing &amp; Capacity</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Predictable pricing for developers and enterprise fleets.
          </h1>
          <p className="mt-4 text-base text-slate-600 dark:text-zinc-400">
            Choose between simple individual developer sandboxes or multi-team enterprise governance.
          </p>

          {/* Billing Switch */}
          <div className="mt-8 inline-flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-3 p-1.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/80 dark:border-white/[0.08] max-w-full">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 sm:py-1.5 rounded-lg text-xs font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 sm:py-1.5 rounded-lg text-xs font-medium transition-all ${
                billingCycle === 'annual'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Annual Billing <span className="text-emerald-500 font-semibold">(Save 20%)</span>
            </button>
          </div>
        </div>

        {/* Section 1: Individual Developer Plans */}
        <div className="mb-20">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-zinc-200 mb-6 font-mono">
            <User className="w-4 h-4 text-sky-500" />
            <span>Individual Plans</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
            {individualPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 backdrop-blur-2xl ${
                  plan.popular
                    ? 'border-sky-500/50 bg-sky-50/20 dark:bg-sky-500/5 shadow-lg dark:shadow-[inset_0_1px_0_0_rgba(56,189,248,0.15),0_12px_36px_rgba(0,0,0,0.4)]'
                    : 'border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0B0D13]/85 shadow-sm dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_8px_32px_rgba(0,0,0,0.3)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                      {plan.name}
                    </h3>
                    {plan.popular && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                        POPULAR
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6">
                    {plan.description}
                  </p>
                  <div className="mb-6 font-mono">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">
                      ${plan.price}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-zinc-400"> / month</span>
                  </div>

                  <ul className="space-y-3 text-xs text-slate-700 dark:text-zinc-300 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={plan.href}
                  className={`w-full py-2.5 rounded-xl text-xs font-semibold text-center transition-all ${
                    plan.popular
                      ? 'bg-sky-500 hover:bg-sky-400 text-zinc-950 shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Organization Plans */}
        <div className="mb-20">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-zinc-200 mb-6 font-mono">
            <Users className="w-4 h-4 text-emerald-500" />
            <span>Organization &amp; Enterprise Plans</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
            {orgPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 backdrop-blur-2xl ${
                  plan.popular
                    ? 'border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-500/5 shadow-lg dark:shadow-[inset_0_1px_0_0_rgba(16,185,129,0.15),0_12px_36px_rgba(0,0,0,0.4)]'
                    : 'border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0B0D13]/85 shadow-sm dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_8px_32px_rgba(0,0,0,0.3)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                      {plan.name}
                    </h3>
                    {plan.popular && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        ENTERPRISE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6">
                    {plan.description}
                  </p>
                  <div className="mb-6 font-mono">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">
                      ${plan.price}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-zinc-400"> / month</span>
                  </div>

                  <ul className="space-y-3 text-xs text-slate-700 dark:text-zinc-300 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={plan.href}
                  className={`w-full py-2.5 rounded-xl text-xs font-semibold text-center transition-all ${
                    plan.popular
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Embedded Capacity Calculator */}
        <PricingCalculator />

        {/* FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0B0D13]/85 backdrop-blur-xl shadow-sm dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-slate-300 dark:hover:border-white/[0.16] transition-all duration-300 scroll-reveal"
              >
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                  <span>{faq.q}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed pl-6">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
