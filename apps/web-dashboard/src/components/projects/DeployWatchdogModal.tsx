'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Terminal, 
  Download, 
  Check, 
  Copy, 
  ShieldCheck, 
  Zap, 
  Cpu, 
  ArrowRight,
  Radio,
  CheckCircle2,
  Clock
} from 'lucide-react';

import { getProjectTopology } from '@/lib/projects/topology';

interface DeployWatchdogModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  onLaunchConsole?: (projectId: string) => void;
}

export function DeployWatchdogModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  onLaunchConsole,
}: DeployWatchdogModalProps) {
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [agentVersion, setAgentVersion] = useState('v1.2.0');
  const [lastPingTime, setLastPingTime] = useState<string | null>(null);
  const [isSimulatingPing, setIsSimulatingPing] = useState(false);

  const topo = getProjectTopology(projectId);
  const token = topo.watchdogToken;

  const gatewayUrl = 'http://localhost:8085';
  const curlCommand = `curl -sSL https://get.autotrace.io/watchdog.sh | sudo bash -s -- --token=${token} --gateway=${gatewayUrl}`;

  // Poll heartbeat status
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const checkHeartbeat = async () => {
      try {
        const res = await fetch(`/api/v1/projects/${projectId}/watchdog/heartbeat`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.connected) {
            setIsConnected(true);
            setAgentVersion(data.version || 'v1.2.0');
            setLastPingTime(new Date(data.lastHeartbeat || Date.now()).toLocaleTimeString());
          }
        }
      } catch {
        // Fallback or ignore network error
      }
    };

    checkHeartbeat();
    const interval = setInterval(checkHeartbeat, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, projectId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatePing = async () => {
    setIsSimulatingPing(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/watchdog/start`, {
        method: 'POST',
      });
      if (res.ok) {
        setIsConnected(true);
        setLastPingTime(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulatingPing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0B0D13] p-6 sm:p-8 text-slate-900 dark:text-zinc-100 shadow-2xl relative">
        
        {/* Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-zinc-800/80 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800/60 flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-inner">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                  Deploy Telemetry Watchdog (&lt; 15 MB)
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-mono font-medium">
                  v1.2.0
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Target Project: <span className="text-sky-600 dark:text-sky-400 font-medium">{projectName}</span> ({projectId})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Real-time Connection Status Pulse Banner */}
        <div className={`mb-6 p-3.5 rounded-xl border transition-all duration-300 flex items-center justify-between text-xs ${
          isConnected 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800/70 dark:text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
            : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-300'
        }`}>
          <div className="flex items-center gap-2.5">
            {isConnected ? (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            ) : (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
            )}

            <span className="font-mono font-medium">
              {isConnected 
                ? `✔ Agent Connected (${agentVersion})` 
                : '● Waiting for first heartbeat from agent...'}
            </span>

            {isConnected && lastPingTime && (
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 ml-2 hidden sm:inline">
                Last ping at {lastPingTime}
              </span>
            )}
          </div>

          {!isConnected && (
            <button
              onClick={handleSimulatePing}
              disabled={isSimulatingPing}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 font-medium transition-colors"
            >
              {isSimulatingPing ? 'Pinging...' : 'Simulate Ping'}
            </button>
          )}
        </div>

        {/* Deployment Options Cards */}
        <div className="space-y-4">
          
          {/* OPTION A: Instant 1-Line Install */}
          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/80 p-4 relative group">
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-200 dark:border-zinc-800/80 text-xs">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span className="font-semibold text-slate-800 dark:text-zinc-200">
                  Option A: Instant 1-Line Install
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-50 border border-sky-200 text-sky-700 dark:bg-sky-950 dark:border-sky-800 dark:text-sky-300">
                  Zero Code Modification
                </span>
              </div>

              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 dark:border-transparent dark:bg-zinc-800/90 dark:hover:bg-zinc-700 dark:text-zinc-300 dark:hover:text-white text-[11px] font-medium transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied!' : 'Copy Snippet'}</span>
              </button>
            </div>

            <pre className="text-sky-700 dark:text-sky-400 font-mono text-[11px] sm:text-xs leading-relaxed overflow-x-auto whitespace-pre p-2.5 bg-white dark:bg-[#06080D] rounded-lg border border-slate-200 dark:border-zinc-900 select-all">
              {curlCommand}
            </pre>
            <p className="text-[11px] text-slate-500 dark:text-zinc-500 mt-2 font-normal">
              Attaches kernel eBPF probes out-of-band and establishes live telemetry ingestion to AutoTrace.
            </p>
          </div>

          {/* OPTION B: Direct Download Binary */}
          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/80 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-zinc-200 mb-1">
                  <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Option B: Direct Download Binary</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300">
                    &lt; 15 MB
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal">
                  Supported: <span className="text-slate-800 dark:text-zinc-300 font-mono">Linux x86_64 / ARM64, Kernel 5.4+</span>
                </div>
              </div>

              <a
                href={`/api/v1/projects/${projectId}/watchdog/download`}
                download
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors shadow-sm shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>⬇ Download Watchdog Agent (.tar.gz) - 12.4 MB</span>
              </a>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-zinc-800/80 flex items-center justify-between text-xs">
          <div className="text-[11px] text-slate-500 dark:text-zinc-500 hidden sm:block">
            Decoupled Ingestion Architecture • Strict 9-Field Schema Verified
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/70 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-colors"
            >
              Done
            </button>

            {onLaunchConsole && (
              <button
                onClick={() => {
                  onClose();
                  onLaunchConsole(projectId);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs transition-all shadow-sm"
              >
                <span>Launch Real-Time Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
