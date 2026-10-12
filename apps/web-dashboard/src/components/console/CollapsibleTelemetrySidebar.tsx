'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Activity, 
  Cpu, 
  HardDrive, 
  Clock, 
  Server, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Radio, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  Layers, 
  Gauge, 
  Copy, 
  Check, 
  Trash2, 
  Play, 
  Pause 
} from 'lucide-react';
import { TopologyNodeInfo } from './CytoscapeTopologyCanvas';

export interface TelemetryEventRecord {
  trace_id: string;
  source_service: string;
  target_service: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  status_code: number;
  latency_ms: number;
  payload_entropy: number;
  timestamp: number;
  is_anomalous?: boolean;
}

interface CollapsibleTelemetrySidebarProps {
  selectedNode: TopologyNodeInfo | null;
  isOpen: boolean;
  onToggle: () => void;
  shannonEntropy: number;
  isAttackActive: boolean;
  isQuarantined: boolean;
}

export function CollapsibleTelemetrySidebar({
  selectedNode,
  isOpen,
  onToggle,
  shannonEntropy,
  isAttackActive,
  isQuarantined,
}: CollapsibleTelemetrySidebarProps) {
  const [activeTab, setActiveTab] = useState<'inspector' | 'stream' | 'entropy'>('inspector');
  const [telemetryEvents, setTelemetryEvents] = useState<TelemetryEventRecord[]>([]);
  const [isStreamPaused, setIsStreamPaused] = useState(false);
  const [copiedTraceId, setCopiedTraceId] = useState<string | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Fallback default node if none selected
  const currentNode: TopologyNodeInfo = selectedNode || {
    id: 'gateway',
    name: 'gateway-service',
    role: 'API Reverse Proxy',
    port: 5000,
    status: 'HEALTHY',
    p99LatencyMs: 1.1,
    reqPerSec: 1420,
    cpuUsage: 12.4,
    memoryUsage: 48,
  };

  // Determine current node dynamic status during attack
  const isCurrentNodeCompromised = currentNode.id === 'reviews' && isAttackActive;
  const isCurrentNodeQuarantined = isCurrentNodeCompromised && isQuarantined;

  // Generate simulated real-time Kafka telemetry events
  useEffect(() => {
    if (isStreamPaused) return;

    const endpoints = ['/api/v1/orders', '/health', '/api/v1/cart', '/api/v1/products', '/vault/token'];
    const methods: Array<'GET' | 'POST'> = ['GET', 'POST'];

    const interval = setInterval(() => {
      setTelemetryEvents((prev) => {
        const now = Date.now();
        const isRogue = isAttackActive && Math.random() > 0.45;

        const newEvent: TelemetryEventRecord = isRogue
          ? {
              trace_id: `trc-${Math.random().toString(36).substring(2, 9)}`,
              source_service: 'reviews-service',
              target_service: 'payment-vault',
              endpoint: '/internal/pci/cardholders',
              method: 'POST',
              status_code: isQuarantined ? 403 : 200,
              latency_ms: isQuarantined ? 0.3 : 18.4,
              payload_entropy: 0.94,
              timestamp: now,
              is_anomalous: true,
            }
          : {
              trace_id: `trc-${Math.random().toString(36).substring(2, 9)}`,
              source_service: Math.random() > 0.5 ? 'gateway-service' : 'order-service',
              target_service: Math.random() > 0.5 ? 'order-service' : 'reviews-service',
              endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
              method: methods[Math.floor(Math.random() * methods.length)],
              status_code: 200,
              latency_ms: Number((Math.random() * 2.5 + 0.8).toFixed(1)),
              payload_entropy: Number((Math.random() * 0.08 + 0.14).toFixed(2)),
              timestamp: now,
              is_anomalous: false,
            };

        // Keep last 40 events
        return [newEvent, ...prev.slice(0, 39)];
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isStreamPaused, isAttackActive, isQuarantined]);

  const handleCopyTrace = (traceId: string) => {
    navigator.clipboard.writeText(traceId);
    setCopiedTraceId(traceId);
    setTimeout(() => setCopiedTraceId(null), 1500);
  };

  return (
    <>
      {/* Floating expand button when sidebar is collapsed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed right-4 bottom-6 z-30 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 text-xs font-semibold shadow-lg hover:border-slate-300 dark:hover:border-zinc-700 transition-all hover:scale-105"
          title="Open Telemetry Sidebar"
        >
          <Activity className="w-4 h-4 text-sky-500 animate-pulse" />
          <span>Telemetry Inspector</span>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-16 right-0 bottom-0 z-30 bg-white/95 dark:bg-[#0B0D13]/95 backdrop-blur-xl border-l border-slate-200 dark:border-zinc-800 flex flex-col transition-all duration-300 shadow-xl ${
          isOpen ? 'w-full sm:w-[380px] lg:w-[420px]' : 'w-0 translate-x-full overflow-hidden'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Telemetry & Ingestion
              </h2>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">
                autotrace-mesh:9092 • Redpanda
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-850 transition-colors"
              title="Collapse Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center px-4 pt-3 pb-2 border-b border-slate-100 dark:border-zinc-800/80 gap-1 bg-slate-50/60 dark:bg-zinc-950/40">
          <button
            onClick={() => setActiveTab('inspector')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'inspector'
                ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-zinc-800'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Server className="w-3 h-3" />
            <span>Inspector</span>
          </button>

          <button
            onClick={() => setActiveTab('stream')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'stream'
                ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-zinc-800'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Radio className="w-3 h-3" />
            <span>Live Kafka Stream</span>
          </button>

          <button
            onClick={() => setActiveTab('entropy')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'entropy'
                ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-zinc-800'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Gauge className="w-3 h-3" />
            <span>Entropy H(G)</span>
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* TAB 1: NODE INSPECTOR */}
          {activeTab === 'inspector' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Selected Node Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/60 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {currentNode.name}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-zinc-500">
                        :{currentNode.port}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-zinc-400 block mt-0.5">
                      {currentNode.role}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      isCurrentNodeQuarantined
                        ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
                        : isCurrentNodeCompromised
                        ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 animate-pulse'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                    }`}
                  >
                    {isCurrentNodeQuarantined
                      ? 'QUARANTINED (eBPF)'
                      : isCurrentNodeCompromised
                      ? 'ANOMALOUS (PATIENT ZERO)'
                      : 'HEALTHY'}
                  </span>
                </div>

                {/* Compromise Alert Pill inside inspector */}
                {isCurrentNodeCompromised && (
                  <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Rogue Edge Invariant Violation</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-rose-600 dark:text-rose-400">
                      Outbound socket established to payment-vault:5002. This transition does not exist in baseline matrix A_base (GAT RCA Link Attention: 0.984).
                    </p>
                  </div>
                )}

                {/* Sockets & Hardware Gauges */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-2.5 rounded-lg border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 mb-1">
                      <span className="flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-sky-500" />
                        CPU Load
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-zinc-200">
                        {isCurrentNodeCompromised ? '74.2%' : `${currentNode.cpuUsage}%`}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCurrentNodeCompromised ? 'bg-rose-500' : 'bg-sky-500'
                        }`}
                        style={{
                          width: `${isCurrentNodeCompromised ? 74.2 : currentNode.cpuUsage}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 mb-1">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3 text-sky-500" />
                        Memory
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-zinc-200">
                        {currentNode.memoryUsage} MB
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-500 rounded-full transition-all duration-300"
                        style={{ width: `${(currentNode.memoryUsage / 256) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80">
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 mb-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-sky-500" />
                      p99 Latency
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {isCurrentNodeCompromised ? '28.4 ms' : `${currentNode.p99LatencyMs} ms`}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80">
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 mb-0.5 flex items-center gap-1">
                      <Activity className="w-3 h-3 text-sky-500" />
                      Throughput
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      ~{currentNode.reqPerSec} evt/s
                    </div>
                  </div>
                </div>
              </div>

              {/* Verified Adjacency Invariants (A_base) */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Adjacency Invariants (A_base)</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                    PyG GAT Graph
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {currentNode.id === 'gateway' && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800">
                      <span className="flex items-center gap-1 text-slate-700 dark:text-zinc-300">
                        <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                        Outbound to order-service:5001
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Authorized (1.2ms)
                      </span>
                    </div>
                  )}

                  {currentNode.id === 'order' && (
                    <>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800">
                        <span className="flex items-center gap-1 text-slate-700 dark:text-zinc-300">
                          <ArrowDownLeft className="w-3 h-3 text-sky-500" />
                          Inbound from gateway-service:5000
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          Authorized (1.2ms)
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800">
                        <span className="flex items-center gap-1 text-slate-700 dark:text-zinc-300">
                          <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                          Outbound to reviews-service:5003
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          Authorized (2.4ms)
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800">
                        <span className="flex items-center gap-1 text-slate-700 dark:text-zinc-300">
                          <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                          Outbound to payment-vault:5002
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          Authorized (mTLS 3.1ms)
                        </span>
                      </div>
                    </>
                  )}

                  {currentNode.id === 'reviews' && (
                    <>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800">
                        <span className="flex items-center gap-1 text-slate-700 dark:text-zinc-300">
                          <ArrowDownLeft className="w-3 h-3 text-sky-500" />
                          Inbound from order-service:5001
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          Authorized (2.4ms)
                        </span>
                      </div>

                      {/* Rogue Lateral Movement Edge */}
                      {isAttackActive && (
                        <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60">
                          <span className="flex items-center gap-1 text-rose-700 dark:text-rose-300 font-semibold">
                            <ArrowUpRight className="w-3 h-3 text-rose-500" />
                            Outbound to payment-vault:5002
                          </span>
                          <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                            {isQuarantined ? 'DROPPED (eBPF)' : 'ROGUE SSRF (0.984)'}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {currentNode.id === 'vault' && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800">
                      <span className="flex items-center gap-1 text-slate-700 dark:text-zinc-300">
                        <ArrowDownLeft className="w-3 h-3 text-sky-500" />
                        Inbound from order-service:5001
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Authorized (mTLS)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Host & Kernel Details */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 text-xs space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block">
                  Container Environment
                </span>
                <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                  <span>Network Namespace</span>
                  <span className="text-slate-800 dark:text-zinc-200 font-medium">autotrace-mesh</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                  <span>Collector Daemon Hook</span>
                  <span className="text-slate-800 dark:text-zinc-200 font-medium">eBPF TC egress/ingress</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                  <span>Identity Revocation</span>
                  <span className="text-slate-800 dark:text-zinc-200 font-medium">SPIFFE/SPIRE SVID Valid</span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: LIVE KAFKA EVENT STREAM */}
          {activeTab === 'stream' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              
              {/* Stream Toolbar */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                    Topic: telemetry-events
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsStreamPaused(!isStreamPaused)}
                    className="p-1 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white text-xs flex items-center gap-1 px-2"
                  >
                    {isStreamPaused ? (
                      <>
                        <Play className="w-3 h-3 text-emerald-500" />
                        <span>Resume</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-3 h-3 text-amber-500" />
                        <span>Pause</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setTelemetryEvents([])}
                    className="p-1 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-rose-500 text-xs px-2"
                    title="Clear Log"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Event Records List */}
              <div ref={logContainerRef} className="space-y-2">
                {telemetryEvents.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                    Waiting for telemetry ingestion on autotrace-mesh:9092...
                  </div>
                ) : (
                  telemetryEvents.map((evt) => (
                    <div
                      key={evt.trace_id}
                      className={`p-2.5 rounded-xl border text-xs transition-all ${
                        evt.is_anomalous
                          ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30'
                          : 'border-slate-200 dark:border-zinc-850 bg-white dark:bg-zinc-950/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                              evt.is_anomalous
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
                            }`}
                          >
                            {evt.method}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white text-[11px]">
                            {evt.endpoint}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-semibold ${
                            evt.status_code === 200
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {evt.status_code}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 mb-1.5">
                        <span>
                          {evt.source_service} → {evt.target_service}
                        </span>
                        <span>{evt.latency_ms}ms</span>
                      </div>

                      {/* Footer: trace_id and shannon entropy */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-zinc-850/80 text-[10px] text-slate-400 dark:text-zinc-500">
                        <button
                          onClick={() => handleCopyTrace(evt.trace_id)}
                          className="flex items-center gap-1 hover:text-slate-800 dark:hover:text-zinc-300"
                        >
                          <span>{evt.trace_id}</span>
                          {copiedTraceId === evt.trace_id ? (
                            <Check className="w-2.5 h-2.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-2.5 h-2.5" />
                          )}
                        </button>
                        <span>H: {evt.payload_entropy}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* TAB 3: SHANNON GRAPH ENTROPY (H(G)) */}
          {activeTab === 'entropy' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Mathematical Shannon Formula Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    Graph Transition Entropy
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-300">
                    A_base Grounding
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-center font-medium text-xs text-slate-800 dark:text-zinc-200">
                  H(G) = - ∑ p_ij · log(p_ij)
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-zinc-400">
                  Measures structural dispersion across the microservice topology graph. Deterministic service calls yield low entropy; lateral movement anomalies dramatically spike entropy.
                </p>
              </div>

              {/* Entropy Gauge Meter */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    Live Cluster Entropy Readout
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      shannonEntropy > 0.65
                        ? 'text-rose-600 dark:text-rose-400'
                        : shannonEntropy > 0.35
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {shannonEntropy.toFixed(2)} nats
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-slate-200/80 dark:border-zinc-800/80">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      shannonEntropy > 0.65
                        ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                        : shannonEntropy > 0.35
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (shannonEntropy / 1.0) * 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                  <span>0.00 (Deterministic)</span>
                  <span>0.50 (Threshold)</span>
                  <span>1.00 (Max Dispersion)</span>
                </div>

                {/* State description */}
                <div
                  className={`p-3 rounded-xl border text-xs leading-relaxed ${
                    shannonEntropy > 0.65
                      ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200'
                      : 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200'
                  }`}
                >
                  {shannonEntropy > 0.65 ? (
                    <div>
                      <span className="font-semibold block mb-0.5">High Topological Uncertainty</span>
                      Rogue transition detected: reviews-service is attempting to invoke payment-vault directly. Stochastic dispersion exceeds learned baseline boundaries.
                    </div>
                  ) : (
                    <div>
                      <span className="font-semibold block mb-0.5">Deterministic Baseline Invariant</span>
                      Cluster traffic strictly conforms to learned adjacency matrix A_base. Graph entropy is stable at nominal baseline levels.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
          <span>Collector: eBPF Socket Filter</span>
          <span className="font-semibold text-slate-800 dark:text-zinc-200">v1.4.0-mesh</span>
        </div>

      </aside>
    </>
  );
}
