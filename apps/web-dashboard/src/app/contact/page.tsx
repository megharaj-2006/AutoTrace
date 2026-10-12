'use client';

import React, { useState } from 'react';
import { 
  Mail, 
  ShieldCheck, 
  MessageSquare, 
  Building, 
  Terminal, 
  CheckCircle2, 
  Lock,
  ArrowRight
} from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    nodeCount: '10-50',
    interest: 'Enterprise Fleet Defense',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="flex flex-col w-full py-12 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 border border-slate-200 text-slate-700 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] mb-4 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Communications Desk</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900 dark:text-white leading-tight">
            Schedule an enterprise architecture briefing or contact research.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-zinc-400 leading-relaxed">
            Our engineering team is ready to assist with custom eBPF collector deployments, multi-team access configurations, or security evaluations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left 7 Columns: Contact Form */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0B0D13] p-8 sm:p-10 shadow-sm">
              {submitted ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    Transmission Acknowledged
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
                    Your inquiry has been routed to our technical platform engineers. We typically respond within 4 business hours.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-6 text-xs text-sky-600 dark:text-sky-400 underline font-medium"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Alex Vance"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2">
                        Work Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="alex@acme-corp.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2">
                        Organization / Company
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Acme Financial Cloud"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2">
                        Monitored Microservice Nodes
                      </label>
                      <select
                        value={formData.nodeCount}
                        onChange={(e) => setFormData({ ...formData, nodeCount: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="1-5">1 - 5 Nodes (Developer Sandbox)</option>
                        <option value="5-25">5 - 25 Nodes (Standard Team Mesh)</option>
                        <option value="25-100">25 - 100 Nodes (Production Fleet)</option>
                        <option value="100+">100+ Nodes (High-Scale Global)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2">
                      Primary Area of Interest
                    </label>
                    <select
                      value={formData.interest}
                      onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="Enterprise Fleet Defense">Enterprise Fleet Defense &amp; Org Admin</option>
                      <option value="eBPF Interceptor Integration">eBPF Interceptor Integration</option>
                      <option value="PyG GAT Model Research">PyTorch Geometric GAT Model Research</option>
                      <option value="Academic Collaboration">Academic &amp; Benchmark Collaboration</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2">
                      Project Notes / Technical Requirements
                    </label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about your topology, Kafka volume, and security posture..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-zinc-950 font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>Transmit Briefing Request</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right 5 Columns: Security Disclosure Desk & Direct Contacts */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Direct Channels Box */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0B0D13]">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Building className="w-4 h-4 text-sky-500" />
                Direct Contact Channels
              </h3>
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <span className="text-slate-400 dark:text-zinc-500 block">Technical Architecture</span>
                  <span className="text-slate-800 dark:text-zinc-200 font-medium">engineering@autotrace-sec.io</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-zinc-500 block">Enterprise Licensing &amp; Admin</span>
                  <span className="text-slate-800 dark:text-zinc-200 font-medium">enterprise@autotrace-sec.io</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-zinc-500 block">Platform Mesh Gateway</span>
                  <span className="text-slate-800 dark:text-zinc-200 font-medium">autotrace-mesh (Ports 9092, 8080, 8000, 8081)</span>
                </div>
              </div>
            </div>

            {/* Responsible Disclosure Box */}
            <div id="disclosure" className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" />
                Responsible Vulnerability Disclosure
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed mb-4">
                We take kernel and actuator boundary security seriously. If you have discovered an issue in our eBPF interceptor, proxy filters, or GAT scoring logic, submit an encrypted report directly to our security officer.
              </p>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black font-mono text-[11px] text-slate-500 dark:text-zinc-400 space-y-1">
                <div>PGP KEY ID: 0x4A81E99F20B6D</div>
                <div>FINGERPRINT: D491 8A20 98F1 CE40 B892 001A 4A81 E99F 20B6 D880</div>
                <div className="text-emerald-500 pt-1 font-semibold">security@autotrace-sec.io</div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
