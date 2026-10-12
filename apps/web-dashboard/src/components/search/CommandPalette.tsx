'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, X, Terminal, Shield, Network, FileText, UserPlus, LogIn } from 'lucide-react';
import { SearchItem } from '@/types';

const SEARCH_DATABASE: SearchItem[] = [
  { id: '1', title: 'Home Overview', category: 'Marketing', href: '/', description: 'Keynote hero, technical bento grid, and interactive topology sandbox' },
  { id: '2', title: 'How It Works & Benefits', category: 'Marketing', href: '/how-it-works', description: 'Dual-component architecture, 3-step lifecycle, and zero-instrumentation benefits' },
  { id: '3', title: 'Pricing & Watchdog Plans', category: 'Marketing', href: '/pricing', description: 'Individual ($10/mo), Team ($20/mo), and Enterprise Mesh ($30/mo) calculator' },
  { id: '4', title: 'About Us & Engineering Mission', category: 'Marketing', href: '/about', description: 'Autonomous zero-trust lateral defense and causal graph observability' },
  { id: '5', title: 'Contact Enterprise Sales & Incident Desk', category: 'Marketing', href: '/contact', description: 'Book architecture demos or report zero-day threat disclosures' },
  { id: '6', title: 'eBPF Watchdog Kernel Interception', category: 'Architecture', href: '/how-it-works#ebpf', description: 'Out-of-band kernel socket interception and zero-overhead latency analysis' },
  { id: '7', title: 'Graph Attention Network (GAT) RCA', category: 'Architecture', href: '/how-it-works#gat', description: 'Real-time root cause analysis and A_base rogue edge link prediction' },
  { id: '8', title: 'Event Contract Specification (telemetry.events)', category: 'Docs', href: '/how-it-works#contract', description: 'Canonical 9-field schema reference and Kafka broker topics' },
  { id: '9', title: 'Register as Individual Developer', category: 'Auth', href: '/register?type=individual', description: 'Hobbyist and single-engineer sandbox onboarding' },
  { id: '10', title: 'Register as Organization Admin', category: 'Auth', href: '/register?type=organization', description: 'Multi-seat team deployment with Watchdog binary generation' },
  { id: '11', title: 'Sign In to Workspace Console', category: 'Auth', href: '/login', description: 'Access Individual, Team, or Admin management portals' },
];

export function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: boolean | (() => void) }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = SEARCH_DATABASE.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        if (typeof onClose === 'function') onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          router.push(filtered[selectedIndex].href);
          if (typeof onClose === 'function') onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, router, onClose]);

  if (!isOpen) return null;

  const getIcon = (category: string) => {
    switch (category) {
      case 'Marketing': return <Network className="w-4 h-4 text-sky-500" />;
      case 'Architecture': return <Shield className="w-4 h-4 text-emerald-500" />;
      case 'Docs': return <FileText className="w-4 h-4 text-amber-500" />;
      case 'Auth': return <LogIn className="w-4 h-4 text-rose-500" />;
      default: return <Terminal className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl overflow-hidden rounded-xl bg-white dark:bg-[#11131a] border border-slate-200 dark:border-zinc-800 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-zinc-800">
          <Search className="w-5 h-5 text-slate-400 dark:text-zinc-500 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search AutoTrace pages, architecture specs, or quick commands... (Esc to close)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-sm md:text-base text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-transparent">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-zinc-400">
              No matching architectural modules or pages found for &quot;{query}&quot;.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    router.push(item.href);
                    if (typeof onClose === 'function') onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-zinc-800/90 text-sky-900 dark:text-sky-300'
                      : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-1.5 rounded-md bg-slate-100 dark:bg-zinc-900 shrink-0">
                      {getIcon(item.category)}
                    </div>
                    <div className="truncate">
                      <div className="font-medium text-slate-900 dark:text-zinc-100 truncate">{item.title}</div>
                      <div className="text-xs text-slate-500 dark:text-zinc-400 truncate">{item.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400">
                      {item.category}
                    </span>
                    <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'translate-x-0.5 opacity-100' : 'opacity-0'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200 dark:border-zinc-800/80 bg-slate-50/80 dark:bg-zinc-950/60 text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-[10px]">↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-[10px]">↵</kbd> Select</span>
          </div>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-[10px]">ESC</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
