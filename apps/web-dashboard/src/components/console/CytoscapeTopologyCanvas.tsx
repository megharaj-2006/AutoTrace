'use client';

import React, { useEffect, useRef, useState } from 'react';
import cytoscape, { Core } from 'cytoscape';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  Radio, 
  Terminal, 
  Play, 
  Copy, 
  Check, 
  Cpu, 
  Activity,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';
import { ProjectTopologyConfig, getProjectTopology } from '@/lib/projects/topology';

export interface TopologyNodeInfo {
  id: string;
  name: string;
  role: string;
  port: number;
  status: 'HEALTHY' | 'ANOMALOUS' | 'QUARANTINED' | 'DEGRADED';
  p99LatencyMs: number;
  reqPerSec: number;
  cpuUsage: number;
  memoryUsage: number;
  isRootCause?: boolean;
  isVictim?: boolean;
}

interface CytoscapeTopologyCanvasProps {
  projectId?: string;
  topology?: ProjectTopologyConfig;
  isWatchdogConnected?: boolean;
  onStartWatchdog?: () => void;
  isStartingWatchdog?: boolean;
  onEmitTestSpan?: () => void;
  isEmittingSpan?: boolean;
  isAttackActive: boolean;
  isChaosActive?: boolean;
  isQuarantined: boolean;
  onSelectNode: (node: TopologyNodeInfo) => void;
  selectedNodeId?: string;
}

export function getComputedNodeInfo(
  id: string,
  topology: ProjectTopologyConfig,
  isChaosActive?: boolean,
  isAttackActive?: boolean,
  isQuarantined?: boolean
): TopologyNodeInfo {
  const baseNode = topology.nodes.find((n) => n.id === id) || topology.nodes[0];
  if (!baseNode) {
    return {
      id,
      name: id,
      role: 'Microservice',
      port: 8080,
      status: 'HEALTHY',
      p99LatencyMs: 1.0,
      reqPerSec: 500,
      cpuUsage: 15,
      memoryUsage: 50,
    };
  }

  if (isChaosActive) {
    if (id === topology.chaosConfig.culpritNodeId) {
      return {
        ...baseNode,
        role: `${baseNode.role} (Root Cause Culprit)`,
        status: 'ANOMALOUS',
        p99LatencyMs: topology.chaosConfig.culpritLatencyMs,
        reqPerSec: Math.floor(baseNode.reqPerSec * 0.4),
        cpuUsage: 97.4,
        memoryUsage: Math.min(96, baseNode.memoryUsage + 25),
        isRootCause: true,
      };
    }
    if (topology.chaosConfig.victimNodeIds.includes(id)) {
      return {
        ...baseNode,
        role: `${baseNode.role} (Cascading Victim)`,
        status: 'DEGRADED',
        p99LatencyMs: topology.chaosConfig.victimLatencyMs,
        reqPerSec: Math.floor(baseNode.reqPerSec * 0.5),
        cpuUsage: 45.2,
        isVictim: true,
      };
    }
  }

  if (isAttackActive && id === topology.attackConfig.compromisedNodeId) {
    return {
      ...baseNode,
      status: isQuarantined ? 'QUARANTINED' : 'ANOMALOUS',
      p99LatencyMs: isQuarantined ? 3.2 : 28.4,
      reqPerSec: isQuarantined ? Math.floor(baseNode.reqPerSec * 0.2) : Math.floor(baseNode.reqPerSec * 1.5),
      cpuUsage: isQuarantined ? 22.1 : 74.2,
      memoryUsage: Math.min(95, baseNode.memoryUsage + 30),
    };
  }

  return baseNode;
}

export function CytoscapeTopologyCanvas({
  projectId = 'mock-amazon-cluster',
  topology: propTopology,
  isWatchdogConnected = true,
  onStartWatchdog,
  isStartingWatchdog = false,
  onEmitTestSpan,
  isEmittingSpan = false,
  isAttackActive,
  isChaosActive = false,
  isQuarantined,
  onSelectNode,
  selectedNodeId,
}: CytoscapeTopologyCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const activeTopology = propTopology || getProjectTopology(projectId);
  const topologyRef = useRef(activeTopology);
  topologyRef.current = activeTopology;

  const onSelectNodeRef = useRef(onSelectNode);
  onSelectNodeRef.current = onSelectNode;
  const isChaosActiveRef = useRef(isChaosActive);
  isChaosActiveRef.current = isChaosActive;
  const isAttackActiveRef = useRef(isAttackActive);
  isAttackActiveRef.current = isAttackActive;
  const isQuarantinedRef = useRef(isQuarantined);
  isQuarantinedRef.current = isQuarantined;

  const { theme } = useTheme();

  const curlCommand = `curl -sSL https://get.autotrace.io/watchdog.sh | sudo bash -s -- --token=${activeTopology.watchdogToken}`;

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Do not mount graph elements if watchdog is disconnected or has no discovered nodes
    if (!isWatchdogConnected || activeTopology.nodes.length === 0) {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
      return;
    }

    const isDark = theme === 'dark';
    const topo = topologyRef.current;

    // Build Cytoscape elements from active project topology
    const elements: cytoscape.ElementDefinition[] = [
      ...topo.nodes.map((node) => ({
        data: {
          id: node.id,
          label: `${node.name}\n:${node.port}`,
          role: node.role,
          port: node.port,
        },
        position: node.position || { x: 200, y: 200 },
      })),
      ...topo.edges.map((edge) => ({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
        },
      })),
    ];

    // Initialize Cytoscape
    const cy = cytoscape({
      container: containerRef.current,
      elements,
      boxSelectionEnabled: false,
      autounselectify: false,
      layout: {
        name: 'preset',
      },
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'wrap',
            'font-family': 'Inter, sans-serif',
            'font-size': '11px',
            'font-weight': 600,
            color: isDark ? '#ffffff' : '#0f172a',
            'background-color': isDark ? '#171a24' : '#ffffff',
            'border-width': 2,
            'border-color': isDark ? '#38bdf8' : '#0284c7',
            width: 90,
            height: 90,
            shape: 'round-rectangle',
            'corner-radius': '14px',
            'transition-property': 'background-color, border-color, width, height',
            'transition-duration': 0.2,
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#0ea5e9',
            'border-width': 3,
            'background-color': isDark ? '#242838' : '#f0f9ff',
          },
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': isDark ? 'rgba(56, 189, 248, 0.45)' : 'rgba(2, 132, 199, 0.45)',
            'target-arrow-color': isDark ? 'rgba(56, 189, 248, 0.85)' : 'rgba(2, 132, 199, 0.85)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            label: 'data(label)',
            'font-family': 'Inter, sans-serif',
            'font-size': '9px',
            'font-weight': 500,
            color: isDark ? '#94a3b8' : '#64748b',
            'text-background-opacity': 0.85,
            'text-background-color': isDark ? '#090a0f' : '#ffffff',
            'text-background-padding': '2px',
          },
        },
        {
          selector: '.rogue-edge',
          style: {
            width: 3,
            'line-color': '#f43f5e',
            'target-arrow-color': '#f43f5e',
            'target-arrow-shape': 'triangle',
            'line-style': 'dashed',
            color: '#f43f5e',
            'font-weight': 600,
            'font-size': '10px',
          },
        },
        {
          selector: '.quarantined-edge',
          style: {
            width: 3,
            'line-color': '#d97706',
            'target-arrow-color': '#d97706',
            'line-style': 'dotted',
            color: '#d97706',
            'font-weight': 600,
            'font-size': '10px',
          },
        },
        {
          selector: '.compromised-node',
          style: {
            'border-color': '#f43f5e',
            'background-color': isDark ? '#4c0519' : '#fff1f2',
            color: isDark ? '#fecdd3' : '#9f1239',
          },
        },
        {
          selector: '.culprit-node',
          style: {
            'border-color': '#f59e0b',
            'border-width': 3,
            'background-color': isDark ? '#451a03' : '#fffbeb',
            color: isDark ? '#fde68a' : '#b45309',
          },
        },
        {
          selector: '.victim-node',
          style: {
            'border-color': '#ef4444',
            'border-width': 2,
            'background-color': isDark ? '#450a0a' : '#fef2f2',
            color: isDark ? '#fca5a5' : '#991b1b',
          },
        },
        {
          selector: '.chaos-victim-edge',
          style: {
            width: 3,
            'line-color': '#ef4444',
            'target-arrow-color': '#ef4444',
            'line-style': 'dashed',
            color: '#ef4444',
            'font-weight': 600,
            'font-size': '10px',
          },
        },
        {
          selector: '.chaos-culprit-edge',
          style: {
            width: 3,
            'line-color': '#f59e0b',
            'target-arrow-color': '#f59e0b',
            'line-style': 'dashed',
            color: '#f59e0b',
            'font-weight': 600,
            'font-size': '10px',
          },
        },
      ],
    });

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const nodeData = getComputedNodeInfo(
        node.id(),
        topologyRef.current,
        isChaosActiveRef.current,
        isAttackActiveRef.current,
        isQuarantinedRef.current
      );
      onSelectNodeRef.current(nodeData);
    });

    cyRef.current = cy;
    cy.fit(undefined, 40);

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [theme, activeTopology.projectId, isWatchdogConnected, activeTopology.nodes.length]);

  // Update Rogue Edge / Compromised Node state
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !isWatchdogConnected) return;

    const topo = topologyRef.current;
    const compNodeId = topo.attackConfig.compromisedNodeId;
    const targetNodeId = topo.attackConfig.targetNodeId;
    const rogueEdgeId = `e-rogue-${topo.projectId}`;
    const existingRogue = cy.$(`#${rogueEdgeId}`);

    if (isAttackActive) {
      if (existingRogue.empty()) {
        cy.add({
          group: 'edges',
          data: {
            id: rogueEdgeId,
            source: compNodeId,
            target: targetNodeId,
            label: isQuarantined ? 'DROPPED (eBPF ACTUATOR)' : topo.attackConfig.rogueEdgeLabel,
          },
          classes: isQuarantined ? 'quarantined-edge' : 'rogue-edge',
        });
      } else {
        existingRogue.data('label', isQuarantined ? 'DROPPED (eBPF ACTUATOR)' : topo.attackConfig.rogueEdgeLabel);
        existingRogue.removeClass('rogue-edge quarantined-edge');
        existingRogue.addClass(isQuarantined ? 'quarantined-edge' : 'rogue-edge');
      }

      cy.$(`#${compNodeId}`).addClass('compromised-node');
    } else {
      if (!existingRogue.empty()) {
        cy.remove(existingRogue);
      }
      cy.$(`#${compNodeId}`).removeClass('compromised-node');
    }
  }, [isAttackActive, isQuarantined, activeTopology.projectId, isWatchdogConnected]);

  // Update Cascading Latency & GAT RCA state
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !isWatchdogConnected) return;

    const topo = topologyRef.current;
    const culpritNode = cy.$(`#${topo.chaosConfig.culpritNodeId}`);
    const culpritBase = topo.nodes.find((n) => n.id === topo.chaosConfig.culpritNodeId);

    if (isChaosActive) {
      if (!culpritNode.empty() && culpritBase) {
        culpritNode.addClass('culprit-node');
        culpritNode.data('label', `${culpritBase.name}:${culpritBase.port}\n[ROOT CAUSE CULPRIT]`);
      }

      topo.chaosConfig.victimNodeIds.forEach((victimId) => {
        const victimNode = cy.$(`#${victimId}`);
        const victimBase = topo.nodes.find((n) => n.id === victimId);
        if (!victimNode.empty() && victimBase) {
          victimNode.addClass('victim-node');
          victimNode.data('label', `${victimBase.name}:${victimBase.port}\n[VICTIM: SLA EXCEEDED]`);
        }
      });

      cy.edges().forEach((edge) => {
        const src = edge.source().id();
        const tgt = edge.target().id();
        if (topo.chaosConfig.victimNodeIds.includes(src)) {
          edge.addClass('chaos-victim-edge');
          edge.data('label', '504 TIMEOUT (> SLA)');
        }
        if (tgt === topo.chaosConfig.culpritNodeId) {
          edge.addClass('chaos-culprit-edge');
          edge.data('label', `BOTTLENECK (${topo.chaosConfig.culpritLatencyMs.toFixed(0)}ms)`);
        }
      });
    } else {
      if (!culpritNode.empty() && culpritBase) {
        culpritNode.removeClass('culprit-node');
        culpritNode.data('label', `${culpritBase.name}\n:${culpritBase.port}`);
      }

      topo.chaosConfig.victimNodeIds.forEach((victimId) => {
        const victimNode = cy.$(`#${victimId}`);
        const victimBase = topo.nodes.find((n) => n.id === victimId);
        if (!victimNode.empty() && victimBase) {
          victimNode.removeClass('victim-node');
          victimNode.data('label', `${victimBase.name}\n:${victimBase.port}`);
        }
      });

      topo.edges.forEach((baseEdge) => {
        const cyEdge = cy.$(`#${baseEdge.id}`);
        if (!cyEdge.empty()) {
          cyEdge.removeClass('chaos-victim-edge chaos-culprit-edge');
          cyEdge.data('label', baseEdge.label);
        }
      });
    }
  }, [isChaosActive, activeTopology.projectId, isWatchdogConnected]);

  // Highlight selected node
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !selectedNodeId || !isWatchdogConnected) return;

    cy.$('node').unselect();
    cy.$(`#${selectedNodeId}`).select();
  }, [selectedNodeId, isWatchdogConnected]);

  return (
    <div className="relative w-full h-full min-h-[460px] lg:min-h-[580px] rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/70 dark:bg-[#0B0D13]/90 overflow-hidden shadow-sm flex flex-col justify-between">
      
      {/* Cytoscape Container for Live Graph */}
      <div ref={containerRef} className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing" />

      {/* AWAITING WATCHDOG DEPLOYMENT OVERLAY */}
      {(!isWatchdogConnected || activeTopology.nodes.length === 0) && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-slate-50/90 dark:bg-[#07090E]/95 backdrop-blur-md">
          <div className="max-w-xl w-full p-6 sm:p-8 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-white dark:bg-[#0B0D13] shadow-xl text-center space-y-4">
            
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto">
              <Radio className={`w-6 h-6 ${isWatchdogConnected ? 'text-emerald-500' : 'text-amber-500'} animate-pulse`} />
            </div>

            <div className="space-y-1.5">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                isWatchdogConnected
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isWatchdogConnected ? 'bg-emerald-500' : 'bg-amber-500'} animate-ping`}></span>
                <span>{isWatchdogConnected ? 'WATCHDOG LISTENING • AWAITING MICROSERVICE SPANS' : 'AWAITING WATCHDOG CONNECTION'}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isWatchdogConnected ? 'Watchdog Agent Attached • 0 Spans Captured' : 'No Telemetry Watchdog Connected Yet'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed max-w-md mx-auto">
                {isWatchdogConnected
                  ? `Watchdog listener is active for token ${activeTopology.watchdogToken}. No network calls have occurred in this project yet. AutoTrace strictly renders microservices discovered from real socket spans.`
                  : `AutoTrace constructs the live dependency graph dynamically from kernel sockets. Start the watchdog agent for project ${activeTopology.projectName} to stream live telemetry.`}
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              {!isWatchdogConnected && onStartWatchdog && (
                <button
                  onClick={onStartWatchdog}
                  disabled={isStartingWatchdog}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-75"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isStartingWatchdog ? 'Attaching Watchdog...' : 'Attach Watchdog Agent'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              {onEmitTestSpan && (
                <button
                  onClick={onEmitTestSpan}
                  disabled={isEmittingSpan}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-75"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>{isEmittingSpan ? 'Emitting Span...' : 'Emit Test Microservice Span'}</span>
                </button>
              )}
            </div>

            {/* Terminal Copy Snippet */}
            <div className="pt-2 text-left space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>{isWatchdogConnected ? 'CLI Test Ingestion (Send Real Span)' : 'Manual Host Installation (Linux eBPF / Docker)'}</span>
                </span>
                <span className="font-mono text-[10px] text-slate-400">{activeTopology.watchdogToken}</span>
              </div>

              <div className="relative group rounded-xl bg-slate-900 border border-slate-800 p-3 font-mono text-[11px] text-zinc-300 overflow-x-auto flex items-center justify-between">
                <code className="text-emerald-400 select-all pr-4 truncate">
                  {isWatchdogConnected
                    ? `autotrace-watchdog emit --gateway=http://localhost:8085 --source=api-gw --target=order-service --method=POST --latency=2.1`
                    : curlCommand}
                </code>
                <button
                  onClick={handleCopyCmd}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs shrink-0 transition-colors"
                  title="Copy command"
                >
                  {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Floating Controls Overlay (Top Right) */}
      {isWatchdogConnected && activeTopology.nodes.length > 0 && (
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 sm:p-4 pointer-events-none">
          
          {/* Status Legend Pill */}
          <div className="pointer-events-auto flex flex-wrap items-center gap-2 sm:gap-3 px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md shadow-sm text-[11px] sm:text-xs font-medium">
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              A_base Baseline
            </span>
            <span className="text-slate-300 dark:text-zinc-700">|</span>
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              RCA Culprit
            </span>
            <span className="text-slate-300 dark:text-zinc-700">|</span>
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              SLA Victim / Rogue
            </span>
          </div>

          {/* View Controls Toolbar */}
          <div className="pointer-events-auto flex items-center gap-1 p-1 rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md shadow-sm self-end sm:self-auto">
            <button
              onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 1.2)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 0.8)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => cyRef.current?.fit(undefined, 40)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
              title="Fit to Canvas"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => cyRef.current?.reset()}
              className="p-1.5 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      )}

      {/* Floating Instructions Tip (Bottom Left) */}
      {isWatchdogConnected && activeTopology.nodes.length > 0 && (
        <div className="relative z-10 p-3 sm:p-4 pointer-events-none">
          <div className="pointer-events-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md text-[11px] text-slate-500 dark:text-zinc-400 font-medium max-w-[calc(100vw-48px)]">
            <span className="truncate">Click any node to inspect live socket telemetry ({activeTopology.nodes.length} services discovered)</span>
          </div>
        </div>
      )}

    </div>
  );
}
