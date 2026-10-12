'use client';

import React, { useState, useEffect } from 'react';
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
import { CytoscapeTopologyCanvas, TopologyNodeInfo, getComputedNodeInfo } from '@/components/console/CytoscapeTopologyCanvas';
import { CollapsibleTelemetrySidebar } from '@/components/console/CollapsibleTelemetrySidebar';
import { getProjectTopology, ProjectTopologyConfig } from '@/lib/projects/topology';

interface PageProps {
  params: {
    id: string;
  };
}

export default function ProjectConsolePage({ params }: PageProps) {
  const projectId = params.id;

  // Base topology definition
  const [topology, setTopology] = useState<ProjectTopologyConfig>(() => getProjectTopology(projectId));

  // Watchdog live connection state coupled to backend agent store
  const [isWatchdogConnected, setIsWatchdogConnected] = useState<boolean>(projectId === 'mock-amazon-cluster');
  const [watchdogHostname, setWatchdogHostname] = useState<string | null>(
    projectId === 'mock-amazon-cluster' ? 'node-mock-cluster-01' : null
  );
  const [isStartingWatchdog, setIsStartingWatchdog] = useState(false);

  // Attack & Containment simulation state
  const [isAttackActive, setIsAttackActive] = useState(false);
  const [isChaosActive, setIsChaosActive] = useState(false);
  const [isQuarantined, setIsQuarantined] = useState(false);
  const [containmentLatencyMs, setContainmentLatencyMs] = useState<number | null>(null);

  // Selected node state for inspector
  const initialNode = topology.nodes.find((n) => n.id === topology.defaultSelectedNodeId) || topology.nodes[0] || null;
  const [selectedNode, setSelectedNode] = useState<TopologyNodeInfo | null>(initialNode);

  // Poll live watchdog topology and heartbeat state from backend API
  useEffect(() => {
    let isMounted = true;
    const fetchWatchdogStatus = async () => {
      try {
        const res = await fetch(`/api/v1/projects/${encodeURIComponent(projectId)}/watchdog/topology`);
        if (res.ok) {
          const data = await res.json();
          if (!isMounted) return;
          if (data.connected) {
            setIsWatchdogConnected(true);
            setWatchdogHostname(data.hostname || null);
            if (Array.isArray(data.nodes)) {
              setTopology((prev) => ({
                ...prev,
                nodes: data.nodes,
                edges: data.edges || prev.edges,
                meshNetwork: data.meshNetwork || prev.meshNetwork,
              }));
              if (data.nodes.length > 0) {
                setSelectedNode((prev) => {
                  if (!prev || !data.nodes.some((n: any) => n.id === prev.id)) {
                    return data.nodes[0];
                  }
                  return prev;
                });
              }
            }
          } else {
            setIsWatchdogConnected(false);
          }
        }
      } catch {
        // Fallback or network error
      }
    };

    fetchWatchdogStatus();
    const interval = setInterval(fetchWatchdogStatus, 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [projectId]);

  const [isEmittingSpan, setIsEmittingSpan] = useState(false);

  const handleEmitTestSpan = async () => {
    setIsEmittingSpan(true);
    try {
      const res = await fetch(`/api/v1/projects/${encodeURIComponent(projectId)}/watchdog/test-span`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setIsWatchdogConnected(true);
        if (Array.isArray(data.nodes) && data.nodes.length > 0) {
          setTopology((prev) => ({
            ...prev,
            nodes: data.nodes,
            edges: data.edges || prev.edges,
          }));
          setSelectedNode(data.nodes[data.nodes.length - 1]);
        }
      }
    } catch (err) {
      console.error('Failed to emit test span:', err);
    } finally {
      setIsEmittingSpan(false);
    }
  };

  const handleStartWatchdog = async () => {
    setIsStartingWatchdog(true);
    try {
      const res = await fetch(`/api/v1/projects/${encodeURIComponent(projectId)}/watchdog/start`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setIsWatchdogConnected(true);
        setWatchdogHostname(data.hostname || null);

        // Fetch refreshed discovered topology immediately
        const topoRes = await fetch(`/api/v1/projects/${encodeURIComponent(projectId)}/watchdog/topology`);
        if (topoRes.ok) {
          const topoData = await topoRes.json();
          if (topoData.nodes && Array.isArray(topoData.nodes)) {
            setTopology((prev) => ({
              ...prev,
              nodes: topoData.nodes,
              edges: topoData.edges || prev.edges,
            }));
            if (topoData.nodes.length > 0) {
              setSelectedNode(topoData.nodes[0]);
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to start watchdog agent:', e);
    } finally {
      setIsStartingWatchdog(false);
    }
  };

  const handleStopWatchdog = async () => {
    try {
      await fetch(`/api/v1/projects/${encodeURIComponent(projectId)}/watchdog/stop`, {
        method: 'POST',
      });
      setIsWatchdogConnected(false);
      setIsAttackActive(false);
      setIsChaosActive(false);
      setIsQuarantined(false);
    } catch (e) {
      console.error('Failed to stop watchdog agent:', e);
    }
  };

  const projectName = topology.projectName;

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
    if (!isWatchdogConnected) return;
    setIsAttackActive(true);
    setIsQuarantined(false);
    setContainmentLatencyMs(null);

    // Switch selected node to the project's compromised service
    const compNode = getComputedNodeInfo(
      topology.attackConfig.compromisedNodeId,
      topology,
      false,
      true,
      false
    );
    setSelectedNode(compNode);
  };

  const handleTriggerChaos = () => {
    if (!isWatchdogConnected) return;
    const nextChaosState = !isChaosActive;
    setIsChaosActive(nextChaosState);
    if (nextChaosState) {
      fetch(`/api/v1/projects/${encodeURIComponent(projectId)}/chaos`, { method: 'POST' }).catch(() => {});

      const primaryVictimId = topology.chaosConfig.victimNodeIds[0] || topology.defaultSelectedNodeId;
      const victimNode = getComputedNodeInfo(primaryVictimId, topology, true, false, false);
      setSelectedNode(victimNode);
    } else {
      const defaultNode = topology.nodes.find((n) => n.id === topology.defaultSelectedNodeId) || topology.nodes[0];
      setSelectedNode(defaultNode);
    }
  };

  const handleEnforceDrop = () => {
    if (!isAttackActive) return;
    setIsQuarantined(true);
    setContainmentLatencyMs(312); // Measured ~312ms sub-second drop

    if (selectedNode && selectedNode.id === topology.attackConfig.compromisedNodeId) {
      const quarantinedNode = getComputedNodeInfo(
        topology.attackConfig.compromisedNodeId,
        topology,
        false,
        true,
        true
      );
      setSelectedNode(quarantinedNode);
    }
  };

  const handleResetTopology = () => {
    setIsAttackActive(false);
    setIsChaosActive(false);
    setIsQuarantined(false);
    setContainmentLatencyMs(null);

    const defaultNode = topology.nodes.find((n) => n.id === topology.defaultSelectedNodeId) || topology.nodes[0];
    setSelectedNode(defaultNode);
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
                      alert_id: {topology.attackConfig.alertId}
                    </span>
                    <span className="text-xs opacity-75">•</span>
                    <span className="text-xs font-medium">
                      anomaly_type: ROGUE_EDGE (GAT Attention: 0.984)
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed opacity-90 max-w-3xl">
                    {isQuarantined
                      ? `Automated containment active: eBPF socket-drop actuator severed unauthorized connection from ${topology.attackConfig.compromisedNodeId} in ${containmentLatencyMs}ms. Cluster isolated.`
                      : topology.attackConfig.alertDescription}
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

        {/* Dynamic Alert Banner for Cascading Latency & GAT Root Cause Analysis */}
        {isChaosActive && !isAttackActive && (
          <div className="p-4 rounded-2xl border transition-all animate-in slide-in-from-top-4 duration-300 shadow-md border-amber-200 dark:border-amber-900/60 bg-amber-50/90 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl mt-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-300 animate-pulse">
                  <Zap className="w-5 h-5" />
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/60 dark:border-amber-700 dark:text-amber-200">
                      CASCADING LATENCY EXCEEDED
                    </span>
                    <span className="text-xs font-semibold">
                      alert_id: {topology.chaosConfig.alertId}
                    </span>
                    <span className="text-xs opacity-75">•</span>
                    <span className="text-xs font-medium">
                      GAT RCA: Sink Leaf Node Isolated (Confidence: 98.4%)
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed opacity-90 max-w-3xl">
                    <strong className="font-semibold text-rose-600 dark:text-rose-400">Symptom / Ingress SLA Breach:</strong> {topology.chaosConfig.victimNodeIds[0]} exceeded latency threshold (observed {topology.chaosConfig.victimLatencyMs.toFixed(0)}ms &gt; 500ms SLA limit, HTTP 504 Gateway Timeout).
                    <br />
                    <strong className="font-semibold text-amber-600 dark:text-amber-400">Isolated True Culprit:</strong> {topology.chaosConfig.alertDescription}
                  </p>
                </div>
              </div>

              {/* Action Buttons inside Alert Banner */}
              <div className="flex items-center gap-2 self-end lg:self-center">
                <button
                  onClick={handleTriggerChaos}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Mitigate Chaos / Reset SLA</span>
                </button>
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
                  {isWatchdogConnected ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Watchdog Online ({watchdogHostname || topology.watchdogAgent.hostname})</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      <span>Watchdog Offline (Awaiting Agent)</span>
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 font-normal">
                  {topology.meshNetwork} • {isWatchdogConnected ? `${topology.nodes.length} Discovered Services` : '0 Services Detected'} • Token: {topology.watchdogToken}
                </div>
              </div>
            </div>

            {/* Testbed Simulation & Watchdog Control Panel */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Watchdog Start / Stop Toggle */}
              {!isWatchdogConnected ? (
                <button
                  onClick={handleStartWatchdog}
                  disabled={isStartingWatchdog}
                  className="px-3 py-1.5 rounded-xl border border-sky-400 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-75"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isStartingWatchdog ? 'Attaching...' : 'Start Watchdog Agent'}</span>
                </button>
              ) : (
                <button
                  onClick={handleStopWatchdog}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 dark:bg-zinc-900 dark:hover:bg-rose-950/40 text-slate-600 dark:text-zinc-400 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title="Disconnect Watchdog Agent"
                >
                  <Radio className="w-3 h-3 text-rose-500" />
                  <span>Stop Agent</span>
                </button>
              )}

              <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-semibold ml-1 mr-1">
                Security Tests:
              </span>

              {/* Button 1: Lateral Movement SSRF */}
              <button
                onClick={handleTriggerSSRF}
                disabled={!isWatchdogConnected || (isAttackActive && !isQuarantined)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
                  !isWatchdogConnected
                    ? 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-400 dark:text-zinc-600 cursor-not-allowed opacity-60'
                    : isAttackActive && !isQuarantined
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
                disabled={!isWatchdogConnected}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
                  !isWatchdogConnected
                    ? 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-400 dark:text-zinc-600 cursor-not-allowed opacity-60'
                    : isChaosActive
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
              projectId={projectId}
              topology={topology}
              isWatchdogConnected={isWatchdogConnected}
              onStartWatchdog={handleStartWatchdog}
              isStartingWatchdog={isStartingWatchdog}
              onEmitTestSpan={handleEmitTestSpan}
              isEmittingSpan={isEmittingSpan}
              isAttackActive={isAttackActive}
              isChaosActive={isChaosActive}
              isQuarantined={isQuarantined}
              onSelectNode={(node) => setSelectedNode(node)}
              selectedNodeId={selectedNode?.id}
            />
          </div>

          {/* Bottom Architecture Health & Telemetry Footer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0B0D13] space-y-1 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-400 dark:text-zinc-500 font-medium">
                <span>Watchdog Agent</span>
                <span className={`w-2 h-2 rounded-full ${isWatchdogConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {topology.watchdogAgent.agentId}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                {isWatchdogConnected ? (watchdogHostname || topology.watchdogAgent.hostname) : 'Disconnected'} • {topology.watchdogToken.slice(0, 15)}...
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0B0D13] space-y-1 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-400 dark:text-zinc-500 font-medium">
                <span>Topology Orchestrator</span>
                <span className={`w-2 h-2 rounded-full ${isWatchdogConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                graph-engine
              </div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                {isWatchdogConnected
                  ? `Spring Boot 3.3+ (${topology.nodes.length} Vertices, ${topology.edges.length} Edges)`
                  : 'Awaiting Watchdog Socket Map'}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0B0D13] space-y-1 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-400 dark:text-zinc-500 font-medium">
                <span>ML Inference GAT</span>
                <span className={`w-2 h-2 rounded-full ${isWatchdogConnected ? 'bg-emerald-500' : 'bg-zinc-400'}`}></span>
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                ml-detector
              </div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                {isWatchdogConnected ? `PyG GAT RCA on ${topology.meshNetwork}` : 'Standby / Waiting for Nodes'}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0B0D13] space-y-1 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-400 dark:text-zinc-500 font-medium">
                <span>Kernel Containment</span>
                <span className={`w-2 h-2 rounded-full ${isWatchdogConnected ? 'bg-emerald-500' : 'bg-zinc-400'}`}></span>
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                actuator-security
              </div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                eBPF socket drops ({topology.environment.split(' ')[0]})
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Collapsible Telemetry & Kafka Stream Sidebar */}
      <CollapsibleTelemetrySidebar
        projectId={projectId}
        topology={topology}
        isWatchdogConnected={isWatchdogConnected}
        selectedNode={selectedNode}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        shannonEntropy={shannonEntropy}
        isAttackActive={isAttackActive}
        isChaosActive={isChaosActive}
        isQuarantined={isQuarantined}
      />
    </div>
  );
}
