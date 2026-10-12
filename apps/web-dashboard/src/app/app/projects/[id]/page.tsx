'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Play, 
  RotateCcw, 
  Flame, 
  Lock, 
  ExternalLink, 
  Activity, 
  Radio, 
  Cpu, 
  Server, 
  CheckCircle2, 
  ArrowRight,
  Info,
  Zap,
  Sliders,
  Maximize2
} from 'lucide-react';
import { ConsoleHeader } from '@/components/console/ConsoleHeader';
import { CytoscapeTopologyCanvas, TopologyNodeInfo } from '@/components/console/CytoscapeTopologyCanvas';
import { CollapsibleTelemetrySidebar } from '@/components/console/CollapsibleTelemetrySidebar';

interface PageProps {
  params: {
    id: string;
  };
}

export default function ProjectConsolePage({ params }: PageProps) {
  const projectId = params.id;

  // Project metadata
  const projectName = 
    projectId === 'mock-amazon-cluster'
      ? 'Mock Amazon Cluster (Testbed)'
      : projectId === 'fintech-payment-pipeline'
      ? 'FinTech Checkout & Vault Mesh'
      : projectId === 'edge-iot-telemetry-gateway'
      ? 'Edge Ingress Collector Mesh'
      : projectId.replace(/-/g, ' ').toUpperCase();

  // Attack & Containment simulation state
  const [isAttackActive, setIsAttackActive] = useState(false);
  const [isChaosActive, setIsChaosActive] = useState(false);
  const [isQuarantined, setIsQuarantined] = useState(false);
  const [containmentLatencyMs, setContainmentLatencyMs] = useState<number | null>(null);

  // Selected node state for inspector
  const [selectedNode, setSelectedNode] = useState<TopologyNodeInfo | null>({
    id: 'gateway',
    name: 'gateway-service',
    role: 'API Reverse Proxy',
    port: 5000,
    status: 'HEALTHY',
    p99LatencyMs: 1.1,
    reqPerSec: 1420,
    cpuUsage: 12.4,
    memoryUsage: 48,
  });

  // Telemetry sidebar open/close state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Computed Shannon Entropy value
  // Baseline is 0.18 nats; spikes to 0.94 nats under rogue edge attack; drops to 0.21 nats when quarantined
  const shannonEntropy = isAttackActive
    ? isQuarantined
      ? 0.21
      : 0.94
    : isChaosActive
    ? 0.42
    : 0.18;

  // Attack Triggers
  const handleTriggerSSRF = () => {
    setIsAttackActive(true);
    setIsQuarantined(false);
    setContainmentLatencyMs(null);

    // Switch selected node to the compromised reviews service
    setSelectedNode({
      id: 'reviews',
      name: 'reviews-service',
      role: 'Vulnerable Public Ingress',
      port: 5003,
      status: 'ANOMALOUS',
      p99LatencyMs: 28.4,
      reqPerSec: 540,
      cpuUsage: 74.2,
      memoryUsage: 88,
    });
  };

  const handleTriggerChaos = () => {
    setIsChaosActive(!isChaosActive);
  };

  const handleEnforceDrop = () => {
    if (!isAttackActive) return;
    setIsQuarantined(true);
    setContainmentLatencyMs(312); // Measured ~312ms sub-second drop

    if (selectedNode && selectedNode.id === 'reviews') {
      setSelectedNode({
        ...selectedNode,
        status: 'QUARANTINED',
        cpuUsage: 22.1,
        p99LatencyMs: 3.2,
      });
    }
  };

  const handleResetTopology = () => {
    setIsAttackActive(false);
    setIsChaosActive(false);
    setIsQuarantined(false);
    setContainmentLatencyMs(null);

    setSelectedNode({
      id: 'gateway',
      name: 'gateway-service',
      role: 'API Reverse Proxy',
      port: 5000,
      status: 'HEALTHY',
      p99LatencyMs: 1.1,
      reqPerSec: 1420,
      cpuUsage: 12.4,
      memoryUsage: 48,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090E] text-slate-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Console Top Navigation Bar */}
      <ConsoleHeader
        currentProjectName={projectName}
        projectId={projectId}
        role="individual"
      />

      {/* Main Console Workspace Body */}
      <main className="flex-1 p-4 lg:p-6 space-y-4 max-w-[1920px] mx-auto w-full">
        
        {/* Dynamic Threat Alert Banner (Adheres to alert-payload.json) */}
        {isAttackActive && (
          <div
            className={`p-4 rounded-2xl border transition-all animate-in slide-in-from-top-4 duration-300 shadow-md ${
              isQuarantined
                ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/90 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                : 'border-rose-200 dark:border-rose-900/60 bg-rose-50/90 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-xl mt-0.5 ${
                    isQuarantined
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                      : 'bg-rose-500/20 text-rose-700 dark:text-rose-300 animate-pulse'
                  }`}
                >
                  {isQuarantined ? (
                    <ShieldCheck className="w-5 h-5" />
                  ) : (
                    <ShieldAlert className="w-5 h-5" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        isQuarantined
                          ? 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/60 dark:border-amber-700 dark:text-amber-200'
                          : 'bg-rose-100 border-rose-300 text-rose-800 dark:bg-rose-900/60 dark:border-rose-700 dark:text-rose-200'
                      }`}
                    >
                      {isQuarantined ? 'CONTAINED' : 'CRITICAL THREAT'}
                    </span>
                    <span className="text-xs font-semibold">
                      alert_id: alt-7b91d24c-e832-491a
                    </span>
                    <span className="text-xs opacity-75">•</span>
                    <span className="text-xs font-medium">
                      anomaly_type: ROGUE_EDGE (GAT Attention: 0.984)
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed opacity-90 max-w-3xl">
                    {isQuarantined
                      ? `Automated containment active: eBPF socket-drop actuator severed unauthorized connection reviews-service:5003 → payment-vault:5002 in ${containmentLatencyMs}ms. Cluster isolated.`
                      : 'Patient Zero: reviews-service:5003 initiated direct unauthorized lateral connection to payment-vault:5002. Violates baseline adjacency matrix A_base.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons inside Alert Banner */}
              <div className="flex items-center gap-2 self-end lg:self-center">
                {!isQuarantined ? (
                  <button
                    onClick={handleEnforceDrop}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Enforce eBPF Drop Now</span>
                  </button>
                ) : (
                  <button
                    onClick={handleResetTopology}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Baseline State</span>
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Console Main Layout: Cytoscape Topology Canvas + Testbed Action Bar */}
        <div className="grid grid-cols-1 gap-4">
          
          {/* Top Bar: Cluster Status & Simulation Controls */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0B0D13] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-semibold text-slate-900 dark:text-white">
                    {projectName}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
                    Live Invariants
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 font-normal">
                  autotrace-mesh • 4 Services • Redpanda/Kafka :9092
                </div>
              </div>
            </div>

            {/* Attack & Testbed Simulation Control Panel */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-semibold mr-1">
                Testbed Injection:
              </span>

              {/* Button 1: Lateral Movement SSRF */}
              <button
                onClick={handleTriggerSSRF}
                disabled={isAttackActive && !isQuarantined}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
                  isAttackActive && !isQuarantined
                    ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300 cursor-not-allowed opacity-80'
                    : 'border-slate-200 dark:border-zinc-800 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                <span>Inject SSRF Probe</span>
              </button>

              {/* Button 2: Chaos Latency / CPU Spike */}
              <button
                onClick={handleTriggerChaos}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
                  isChaosActive
                    ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                    : 'border-slate-200 dark:border-zinc-800 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>{isChaosActive ? 'Stop Chaos' : 'Chaos Latency'}</span>
              </button>

              {/* Button 3: Sub-Second eBPF Drop Actuator */}
              <button
                onClick={handleEnforceDrop}
                disabled={!isAttackActive || isQuarantined}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
                  isQuarantined
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : isAttackActive
                    ? 'border-rose-500 bg-rose-600 text-white hover:bg-rose-700 animate-pulse'
                    : 'border-slate-200 dark:border-zinc-800 bg-slate-50 text-slate-400 dark:bg-zinc-900 dark:text-zinc-600 cursor-not-allowed'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isQuarantined ? 'Quarantine Active' : 'eBPF Drop (<350ms)'}</span>
              </button>

              {/* Button 4: Reset Topology */}
              <button
                onClick={handleResetTopology}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 transition-colors shadow-xs"
                title="Reset Simulation to Baseline A_base"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Cytoscape Interactive Topology Canvas Container */}
          <div className="relative w-full h-[580px] lg:h-[640px]">
            <CytoscapeTopologyCanvas
              isAttackActive={isAttackActive}
              isQuarantined={isQuarantined}
              onSelectNode={(node) => setSelectedNode(node)}
              selectedNodeId={selectedNode?.id}
            />
          </div>

          {/* Bottom Architecture Health & Telemetry Footer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0B0D13] space-y-1 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-400 dark:text-zinc-500 font-medium">
                <span>Collector Hook</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                telemetry-collector
              </div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                Go 1.22+ eBPF TC filter (port 9092)
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0B0D13] space-y-1 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-400 dark:text-zinc-500 font-medium">
                <span>Topology Orchestrator</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                graph-engine
              </div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                Spring Boot 3.3+ (port 8080)
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0B0D13] space-y-1 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-400 dark:text-zinc-500 font-medium">
                <span>ML Inference GAT</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                ml-detector
              </div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                PyG GAT RCA (/score-edge :8000)
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0B0D13] space-y-1 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-400 dark:text-zinc-500 font-medium">
                <span>Kernel Containment</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                actuator-security
              </div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                iptables / eBPF socket drops (:8081)
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Collapsible Telemetry & Kafka Stream Sidebar */}
      <CollapsibleTelemetrySidebar
        selectedNode={selectedNode}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        shannonEntropy={shannonEntropy}
        isAttackActive={isAttackActive}
        isQuarantined={isQuarantined}
      />

    </div>
  );
}
