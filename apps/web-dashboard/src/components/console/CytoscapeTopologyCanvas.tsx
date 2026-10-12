'use client';

import React, { useEffect, useRef, useState } from 'react';
import cytoscape, { Core } from 'cytoscape';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';

export interface TopologyNodeInfo {
  id: string;
  name: string;
  role: string;
  port: number;
  status: 'HEALTHY' | 'ANOMALOUS' | 'QUARANTINED';
  p99LatencyMs: number;
  reqPerSec: number;
  cpuUsage: number;
  memoryUsage: number;
}

interface CytoscapeTopologyCanvasProps {
  isAttackActive: boolean;
  isQuarantined: boolean;
  onSelectNode: (node: TopologyNodeInfo) => void;
  selectedNodeId?: string;
}

const NODES_DATA: TopologyNodeInfo[] = [
  {
    id: 'gateway',
    name: 'gateway-service',
    role: 'API Reverse Proxy',
    port: 5000,
    status: 'HEALTHY',
    p99LatencyMs: 1.1,
    reqPerSec: 1420,
    cpuUsage: 12.4,
    memoryUsage: 48,
  },
  {
    id: 'order',
    name: 'order-service',
    role: 'Business Logic Core',
    port: 5001,
    status: 'HEALTHY',
    p99LatencyMs: 2.8,
    reqPerSec: 1100,
    cpuUsage: 28.1,
    memoryUsage: 94,
  },
  {
    id: 'reviews',
    name: 'reviews-service',
    role: 'Vulnerable Public Ingress',
    port: 5003,
    status: 'HEALTHY',
    p99LatencyMs: 4.2,
    reqPerSec: 450,
    cpuUsage: 35.8,
    memoryUsage: 62,
  },
  {
    id: 'vault',
    name: 'payment-vault',
    role: 'PCI Isolated Data Store',
    port: 5002,
    status: 'HEALTHY',
    p99LatencyMs: 1.9,
    reqPerSec: 320,
    cpuUsage: 14.2,
    memoryUsage: 56,
  },
];

export function CytoscapeTopologyCanvas({
  isAttackActive,
  isQuarantined,
  onSelectNode,
  selectedNodeId,
}: CytoscapeTopologyCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const onSelectNodeRef = useRef(onSelectNode);
  onSelectNodeRef.current = onSelectNode;
  const { theme } = useTheme();

  useEffect(() => {
    if (!containerRef.current) return;

    const isDark = theme === 'dark';

    // Base Cytoscape elements
    const elements: cytoscape.ElementDefinition[] = [
      // Nodes
      {
        data: {
          id: 'gateway',
          label: 'gateway-service\n:5000',
          role: 'API Reverse Proxy',
          port: 5000,
        },
        position: { x: 120, y: 220 },
      },
      {
        data: {
          id: 'order',
          label: 'order-service\n:5001',
          role: 'Business Logic',
          port: 5001,
        },
        position: { x: 380, y: 140 },
      },
      {
        data: {
          id: 'reviews',
          label: 'reviews-service\n:5003',
          role: 'Vulnerable Ingress',
          port: 5003,
        },
        position: { x: 380, y: 320 },
      },
      {
        data: {
          id: 'vault',
          label: 'payment-vault\n:5002',
          role: 'PCI Isolated Store',
          port: 5002,
        },
        position: { x: 640, y: 220 },
      },

      // Authorized baseline edges (A_base)
      {
        data: {
          id: 'e-gateway-order',
          source: 'gateway',
          target: 'order',
          label: 'HTTP/REST 1.2ms',
        },
      },
      {
        data: {
          id: 'e-order-reviews',
          source: 'order',
          target: 'reviews',
          label: 'HTTP/REST 2.4ms',
        },
      },
      {
        data: {
          id: 'e-order-vault',
          source: 'order',
          target: 'vault',
          label: 'mTLS/gRPC 3.1ms',
        },
      },
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
      ],
    });

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const nodeData = NODES_DATA.find((n) => n.id === node.id());
      if (nodeData) {
        onSelectNodeRef.current(nodeData);
      }
    });

    cyRef.current = cy;
    cy.fit(undefined, 40);

    return () => {
      cy.destroy();
    };
  }, [theme]);

  // Update Rogue Edge / Compromised Node state
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const existingRogue = cy.$('#e-rogue-ssrf');

    if (isAttackActive) {
      if (existingRogue.empty()) {
        cy.add({
          group: 'edges',
          data: {
            id: 'e-rogue-ssrf',
            source: 'reviews',
            target: 'vault',
            label: isQuarantined ? 'DROPPED (eBPF ACTUATOR)' : 'ROGUE SSRF (0.984)',
          },
          classes: isQuarantined ? 'quarantined-edge' : 'rogue-edge',
        });
      } else {
        existingRogue.data('label', isQuarantined ? 'DROPPED (eBPF ACTUATOR)' : 'ROGUE SSRF (0.984)');
        existingRogue.removeClass('rogue-edge quarantined-edge');
        existingRogue.addClass(isQuarantined ? 'quarantined-edge' : 'rogue-edge');
      }

      cy.$('#reviews').addClass('compromised-node');
    } else {
      if (!existingRogue.empty()) {
        cy.remove(existingRogue);
      }
      cy.$('#reviews').removeClass('compromised-node');
    }
  }, [isAttackActive, isQuarantined]);

  // Highlight selected node
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !selectedNodeId) return;

    cy.$('node').unselect();
    cy.$(`#${selectedNodeId}`).select();
  }, [selectedNodeId]);

  return (
    <div className="relative w-full h-full min-h-[460px] lg:min-h-[580px] rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/70 dark:bg-[#0B0D13]/90 overflow-hidden shadow-sm flex flex-col justify-between">
      
      {/* Cytoscape Container */}
      <div ref={containerRef} className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing" />

      {/* Floating Controls Overlay (Top Right) */}
      <div className="relative z-10 flex items-center justify-between p-4 pointer-events-none">
        
        {/* Status Legend Pill */}
        <div className="pointer-events-auto flex items-center gap-3 px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md shadow-sm text-xs font-medium">
          <span className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            A_base Verified
          </span>
          <span className="text-slate-300 dark:text-zinc-700">|</span>
          <span className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Rogue Anomaly
          </span>
          <span className="text-slate-300 dark:text-zinc-700">|</span>
          <span className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            eBPF Drop
          </span>
        </div>

        {/* View Controls Toolbar */}
        <div className="pointer-events-auto flex items-center gap-1 p-1 rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md shadow-sm">
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

      {/* Floating Instructions Tip (Bottom Left) */}
      <div className="relative z-10 p-4 pointer-events-none">
        <div className="pointer-events-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
          <span>Click any microservice node to inspect live socket telemetry</span>
        </div>
      </div>

    </div>
  );
}
