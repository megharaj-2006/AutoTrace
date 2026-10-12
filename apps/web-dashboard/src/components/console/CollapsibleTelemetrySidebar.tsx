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
  Pause,
  Zap 
} from 'lucide-react';
import { TopologyNodeInfo } from './CytoscapeTopologyCanvas';
import { ProjectTopologyConfig, getProjectTopology } from '@/lib/projects/topology';

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
  projectId?: string;
  topology?: ProjectTopologyConfig;
  isWatchdogConnected?: boolean;
  selectedNode: TopologyNodeInfo | null;
  isOpen: boolean;
  onToggle: () => void;
  shannonEntropy: number;
  isAttackActive: boolean;
  isChaosActive?: boolean;
  isQuarantined: boolean;
}

export function CollapsibleTelemetrySidebar({
  projectId = 'mock-amazon-cluster',
  topology: propTopology,
  isWatchdogConnected = true,
  selectedNode,
  isOpen,
  onToggle,
  shannonEntropy,
  isAttackActive,
  isChaosActive = false,
  isQuarantined,
}: CollapsibleTelemetrySidebarProps) {
  const activeTopology = propTopology || getProjectTopology(projectId);
  const [activeTab, setActiveTab] = useState<'inspector' | 'stream' | 'entropy'>('inspector');
  const [telemetryEvents, setTelemetryEvents] = useState<TelemetryEventRecord[]>([]);
  const [isStreamPaused, setIsStreamPaused] = useState(false);
  const [copiedTraceId, setCopiedTraceId] = useState<string | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Fallback default node if none selected
  const currentNode: TopologyNodeInfo = selectedNode || activeTopology.nodes[0] || {
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

  // Determine current node dynamic status during attack or chaos
  const isCurrentNodeCompromised = isAttackActive && currentNode.id === activeTopology.attackConfig.compromisedNodeId;
  const isCurrentNodeQuarantined = isCurrentNodeCompromised && isQuarantined;
  const isCurrentNodeCulprit = isChaosActive && currentNode.id === activeTopology.chaosConfig.culpritNodeId;
  const isCurrentNodeVictim = isChaosActive && activeTopology.chaosConfig.victimNodeIds.includes(currentNode.id);

  // Dynamic inbound and outbound authorized edges for the active node
  const inboundEdges = activeTopology.edges.filter((e) => e.target === currentNode.id);
  const outboundEdges = activeTopology.edges.filter((e) => e.source === currentNode.id);

  // Generate simulated real-time Kafka telemetry events
  useEffect(() => {
    if (!isWatchdogConnected || isStreamPaused || activeTopology.nodes.length === 0) return;

    const endpoints = activeTopology.endpoints.length > 0
      ? activeTopology.endpoints
      : ['/api/v1/query', '/health', '/api/v1/data', '/api/v1/metrics'];
    const methods: Array<'GET' | 'POST'> = ['GET', 'POST'];

    const interval = setInterval(() => {
      setTelemetryEvents((prev) => {
        const now = Date.now();
        const isRogue = isAttackActive && Math.random() > 0.45;
        const isChaos = isChaosActive && Math.random() > 0.35;

        let newEvent: TelemetryEventRecord;

        if (isChaos) {
          const primaryVictim = activeTopology.nodes.find((n) => activeTopology.chaosConfig.victimNodeIds.includes(n.id)) || activeTopology.nodes[0];
          const culpritNode = activeTopology.nodes.find((n) => n.id === activeTopology.chaosConfig.culpritNodeId) || activeTopology.nodes[activeTopology.nodes.length - 1];
          const isVictimEvent = Math.random() > 0.4;
          newEvent = isVictimEvent
            ? {
                trace_id: `trc-lat-${Math.random().toString(36).substring(2, 9)}`,
                source_service: primaryVictim.name,
                target_service: culpritNode.name,
                endpoint: activeTopology.chaosConfig.symptomEndpoint,
                method: 'POST',
                status_code: 504,
                latency_ms: Number((Math.random() * 200 + activeTopology.chaosConfig.victimLatencyMs).toFixed(1)),
                payload_entropy: 0.44,
                timestamp: now,
                is_anomalous: true,
              }
            : {
                trace_id: `trc-lat-${Math.random().toString(36).substring(2, 9)}`,
                source_service: primaryVictim.name,
                target_service: culpritNode.name,
                endpoint: '/internal/bottleneck/wait',
                method: 'POST',
                status_code: 504,
                latency_ms: Number((Math.random() * 150 + activeTopology.chaosConfig.culpritLatencyMs).toFixed(1)),
                payload_entropy: 0.41,
                timestamp: now,
                is_anomalous: true,
              };
        } else if (isRogue) {
          const compNode = activeTopology.nodes.find((n) => n.id === activeTopology.attackConfig.compromisedNodeId) || activeTopology.nodes[0];
          const targetNode = activeTopology.nodes.find((n) => n.id === activeTopology.attackConfig.targetNodeId) || activeTopology.nodes[activeTopology.nodes.length - 1];
          newEvent = {
            trace_id: `trc-${Math.random().toString(36).substring(2, 9)}`,
            source_service: compNode.name,
            target_service: targetNode.name,
            endpoint: activeTopology.attackConfig.rogueEndpoint,
            method: 'POST',
            status_code: isQuarantined ? 403 : 200,
            latency_ms: isQuarantined ? 0.3 : 18.4,
            payload_entropy: 0.94,
            timestamp: now,
            is_anomalous: true,
          };
        } else {
          const availableNodes = activeTopology.nodes;
          const srcNode = availableNodes[Math.floor(Math.random() * availableNodes.length)];
          let dstNode = availableNodes[Math.floor(Math.random() * availableNodes.length)];
          if (dstNode.id === srcNode.id && availableNodes.length > 1) {
            dstNode = availableNodes.find((n) => n.id !== srcNode.id) || availableNodes[0];
          }
          newEvent = {
            trace_id: `trc-${Math.random().toString(36).substring(2, 9)}`,
            source_service: srcNode.name,
            target_service: dstNode.name,
            endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
            method: methods[Math.floor(Math.random() * methods.length)],
            status_code: 200,
            latency_ms: Number((Math.random() * 2.5 + srcNode.p99LatencyMs).toFixed(1)),
            payload_entropy: Number((Math.random() * 0.08 + 0.14).toFixed(2)),
            timestamp: now,
            is_anomalous: false,
          };
        }

        // Keep last 40 events
        return [newEvent, ...prev.slice(0, 39)];
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isStreamPaused, isAttackActive, isChaosActive, isQuarantined, activeTopology, isWatchdogConnected]);

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
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 block truncate max-w-[240px]">
                {isWatchdogConnected
                  ? `${activeTopology.meshNetwork}:9092 • Watchdog ${activeTopology.watchdogAgent.hostname}`
                  : `${activeTopology.meshNetwork} • Watchdog Offline`}
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
              {(!isWatchdogConnected || activeTopology.nodes.length === 0) ? (
                <div className="p-6 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-center space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-slate-900 dark:text-white">Watchdog Agent Offline</h3>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
                      No microservices detected yet. Start the watchdog agent on your host to discover active sockets and inspect telemetry.
                    </p>
                  </div>
                </div>
              ) : (
                <>
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
                        : isCurrentNodeCulprit
                        ? 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-300 animate-pulse'
                        : isCurrentNodeVictim
                        ? 'bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950/40 dark:border-rose-700 dark:text-rose-300'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                    }`}
                  >
                    {isCurrentNodeQuarantined
                      ? 'QUARANTINED (eBPF)'
                      : isCurrentNodeCompromised
                      ? 'ANOMALOUS (PATIENT ZERO)'
                      : isCurrentNodeCulprit
                      ? 'ROOT CAUSE CULPRIT (SINK)'
                      : isCurrentNodeVictim
                      ? 'CASCADING VICTIM (SLA EXCEEDED)'
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
                      Outbound socket established from {currentNode.name}:{currentNode.port} to {activeTopology.attackConfig.targetNodeId}. This transition does not exist in baseline matrix A_base (GAT RCA Link Attention: 0.984).
                    </p>
                  </div>
                )}

                {/* Chaos RCA Root Cause Alert Pill */}
                {isCurrentNodeCulprit && (
                  <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span>GAT RCA Isolated Root Cause (Culprit)</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
                      Identified as the root causal sink node (Root Cause Score: 0.984). Internal compute bottleneck (~{activeTopology.chaosConfig.culpritLatencyMs.toFixed(0)}ms) induced cascading timeouts upstream across {activeTopology.chaosConfig.victimNodeIds.join(', ')}.
                    </p>
                  </div>
                )}

                {/* Chaos Cascading Victim Alert Pill */}
                {isCurrentNodeVictim && (
                  <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-500/10 text-rose-800 dark:text-rose-300 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-rose-500" />
                      <span>Cascading SLA Limit Breach (Victim)</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-rose-700 dark:text-rose-400">
                      Observed latency ({activeTopology.chaosConfig.victimLatencyMs.toFixed(0)}ms) exceeds 500ms SLA threshold. Classified as a cascading victim caused by downstream bottleneck at {activeTopology.chaosConfig.culpritNodeId}.
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
                        {currentNode.cpuUsage}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          currentNode.cpuUsage > 75
                            ? 'bg-rose-500'
                            : currentNode.cpuUsage > 50
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, currentNode.cpuUsage)}%` }}
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
                        className="h-full bg-sky-500 rounded-full"
                        style={{ width: `${Math.min(100, (currentNode.memoryUsage / 200) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-lg border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80">
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">
                      p99 Socket Latency
                    </span>
                    <span className={`text-base font-bold ${
                      currentNode.p99LatencyMs > 500
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-900 dark:text-white'
                    }`}>
                      {currentNode.p99LatencyMs} ms
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80">
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">
                      Live Ingress
                    </span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      {currentNode.reqPerSec} req/s
                    </span>
                  </div>
                </div>

              </div>

              {/* Topology Adjacency Connections Box */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0B0D13] space-y-3">
                <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-500" />
                  <span>A_base Invariant Adjacency Map</span>
                </span>

                <div className="space-y-2 text-xs">
                  {/* Dynamic Inbound Connections */}
                  {inboundEdges.map((edge) => {
                    const src = activeTopology.nodes.find((n) => n.id === edge.source);
                    return (
                      <div
                        key={edge.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800"
                      >
                        <span className="flex items-center gap-1 text-slate-700 dark:text-zinc-300">
                          <ArrowDownLeft className="w-3 h-3 text-sky-500" />
                          Inbound from {src ? `${src.name}:${src.port}` : edge.source}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          Authorized ({edge.protocol || 'TCP'} {edge.latencyMs ? `${edge.latencyMs}ms` : ''})
                        </span>
                      </div>
                    );
                  })}

                  {/* Dynamic Outbound Connections */}
                  {outboundEdges.map((edge) => {
                    const dst = activeTopology.nodes.find((n) => n.id === edge.target);
                    return (
                      <div
                        key={edge.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800"
                      >
                        <span className="flex items-center gap-1 text-slate-700 dark:text-zinc-300">
                          <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                          Outbound to {dst ? `${dst.name}:${dst.port}` : edge.target}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          Authorized ({edge.protocol || 'TCP'} {edge.latencyMs ? `${edge.latencyMs}ms` : ''})
                        </span>
                      </div>
                    );
                  })}

                  {/* Rogue Edge indicator if active node is compromised */}
                  {isCurrentNodeCompromised && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60">
                      <span className="flex items-center gap-1 text-rose-700 dark:text-rose-300 font-semibold">
                        <ArrowUpRight className="w-3 h-3 text-rose-500" />
                        Outbound to {activeTopology.attackConfig.targetNodeId}
                      </span>
                      <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                        {isQuarantined ? 'DROPPED (eBPF)' : activeTopology.attackConfig.rogueEdgeLabel}
                      </span>
                    </div>
                  )}

                  {inboundEdges.length === 0 && outboundEdges.length === 0 && !isCurrentNodeCompromised && (
                    <div className="text-[11px] text-slate-400 dark:text-zinc-500 p-2 text-center">
                      Autonomous Service (No active cross-service socket links)
                    </div>
                  )}
                </div>
              </div>

              {/* Host & Kernel Details */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 text-xs space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block">
                  Watchdog Agent & Kernel Environment
                </span>
                <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                  <span>Network Namespace</span>
                  <span className="text-slate-800 dark:text-zinc-200 font-medium">{activeTopology.meshNetwork}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                  <span>Watchdog Host</span>
                  <span className="text-slate-800 dark:text-zinc-200 font-medium">{activeTopology.watchdogAgent.hostname}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                  <span>Collector Daemon Hook</span>
                  <span className="text-slate-800 dark:text-zinc-200 font-medium truncate max-w-[200px]">{activeTopology.watchdogAgent.agentId}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                  <span>Watchdog Token</span>
                  <span className="text-slate-800 dark:text-zinc-200 font-mono text-[10px]">{activeTopology.watchdogToken.slice(0, 18)}...</span>
                </div>
              </div>
            </>
          )}

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

              {/* GAT RCA Diagnostic Live Box during Chaos */}
              {isChaosActive && (
                <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/90 dark:bg-amber-950/40 text-xs space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between font-semibold text-amber-900 dark:text-amber-200">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                      <span>GAT RCA Live Traversal</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/60 font-mono font-semibold">
                      Confidence: 98.4%
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-800 dark:text-amber-300 space-y-1 font-mono">
                    <div className="flex items-center gap-1">
                      <span className="text-amber-500">▶</span>
                      <span>Symptom / Ingress: <strong className="text-rose-600 dark:text-rose-400">{activeTopology.chaosConfig.victimNodeIds[0]}</strong> ({activeTopology.chaosConfig.victimLatencyMs.toFixed(0)}ms &gt; 500ms SLA, HTTP 504)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-amber-500">▶</span>
                      <span>Isolated Culprit: <strong className="text-amber-600 dark:text-amber-400">{activeTopology.chaosConfig.culpritNodeId}</strong> (Leaf Sink Bottleneck)</span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-400 pt-0.5">
                      Causal DAG: {activeTopology.chaosConfig.victimNodeIds.join(' → ')} → {activeTopology.chaosConfig.culpritNodeId}
                    </div>
                  </div>
                </div>
              )}

              {/* Event Records List */}
              <div ref={logContainerRef} className="space-y-2">
                {telemetryEvents.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 dark:text-zinc-500 space-y-2">
                    <Radio className="w-5 h-5 mx-auto text-amber-500 animate-pulse" />
                    <div>
                      {isWatchdogConnected
                        ? `Waiting for telemetry frames on ${activeTopology.meshNetwork}:9092 (Watchdog ${activeTopology.watchdogAgent.hostname})...`
                        : `Watchdog agent is offline. Start the agent to capture live socket traffic for ${activeTopology.projectName}.`}
                    </div>
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
                      Rogue transition detected: {activeTopology.attackConfig.compromisedNodeId} is attempting to invoke {activeTopology.attackConfig.targetNodeId} directly. Stochastic dispersion exceeds learned baseline boundaries.
                    </div>
                  ) : (
                    <div>
                      <span className="font-semibold block mb-0.5">Deterministic Baseline Invariant</span>
                      Cluster traffic strictly conforms to learned adjacency matrix A_base on {activeTopology.meshNetwork}. Graph entropy is stable at nominal baseline levels.
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
          <span className="font-semibold text-slate-800 dark:text-zinc-200">{activeTopology.watchdogAgent.agentId}</span>
        </div>

      </aside>
    </>
  );
}
