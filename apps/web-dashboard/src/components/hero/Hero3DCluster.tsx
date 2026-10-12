'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AlertCircle, Play, CheckCircle } from 'lucide-react';

interface NodeData {
  id: string;
  name: string;
  role: string;
  port: number;
  position: [number, number, number];
  color: number;
}

const NODES: NodeData[] = [
  { id: 'gateway', name: 'gateway-service', role: 'API Reverse Proxy', port: 5000, position: [-3, 0.5, 0], color: 0x0284c7 },
  { id: 'order', name: 'order-service', role: 'Business Logic Core', port: 5001, position: [-0.5, 1.8, 0.5], color: 0x0ea5e9 },
  { id: 'reviews', name: 'reviews-service', role: 'Vulnerable Public Ingress', port: 5003, position: [0.8, -1.8, -0.5], color: 0xf59e0b },
  { id: 'vault', name: 'payment-vault', role: 'PCI Isolated Data Store', port: 5002, position: [3, 0.2, 0.2], color: 0x10b981 },
];

export function Hero3DCluster() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAttackSimulated, setIsAttackSimulated] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(NODES[0]);
  const [metrics, setMetrics] = useState({
    p99: 1.2,
    entropy: 0.18,
    status: 'OPTIMAL',
    actuatorReady: true,
  });

  useEffect(() => {
    if (isAttackSimulated) {
      setMetrics({
        p99: 148.5,
        entropy: 0.94,
        status: 'ROGUE_EDGE_DETECTED',
        actuatorReady: true,
      });
    } else {
      setMetrics({
        p99: 1.2,
        entropy: 0.18,
        status: 'OPTIMAL',
        actuatorReady: true,
      });
    }
  }, [isAttackSimulated]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;
    const camera = new THREE.PerspectiveCamera(
      45,
      width / height,
      0.1,
      1000
    );
    camera.position.set(0, 0, 8.5);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2));
      container.appendChild(renderer.domElement);
    } catch (err) {
      console.warn('[Hero3DCluster] WebGL initialization skipped:', err);
      return;
    }

    // Ambient & Point Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x38bdf8, 2, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Group for nodes & edges
    const graphGroup = new THREE.Group();
    scene.add(graphGroup);

    // Store node meshes for raycasting
    const nodeMeshes: THREE.Mesh[] = [];

    // Create Nodes (Glass spheres with inner core)
    NODES.forEach((node) => {
      // Outer sphere
      const outerGeo = new THREE.SphereGeometry(0.42, 32, 32);
      const outerMat = new THREE.MeshStandardMaterial({
        color: node.color,
        roughness: 0.2,
        metalness: 0.1,
        transparent: true,
        opacity: 0.85,
        wireframe: false,
      });
      const mesh = new THREE.Mesh(outerGeo, outerMat);
      mesh.position.set(...node.position);
      mesh.userData = node;

      // Glow wireframe ring
      const ringGeo = new THREE.RingGeometry(0.5, 0.55, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: node.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      mesh.add(ringMesh);

      // Core glow point
      const coreGeo = new THREE.SphereGeometry(0.18, 16, 16);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      mesh.add(coreMesh);

      graphGroup.add(mesh);
      nodeMeshes.push(mesh);
    });

    // Create Edges (Normal Topology)
    const validEdges = [
      { from: [-3, 0.5, 0], to: [-0.5, 1.8, 0.5], color: 0x38bdf8 },
      { from: [-0.5, 1.8, 0.5], to: [0.8, -1.8, -0.5], color: 0x38bdf8 },
      { from: [-0.5, 1.8, 0.5], to: [3, 0.2, 0.2], color: 0x10b981 },
    ];

    validEdges.forEach((edge) => {
      const p1 = new THREE.Vector3(...(edge.from as [number, number, number]));
      const p2 = new THREE.Vector3(...(edge.to as [number, number, number]));
      const points = [p1, p2];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: edge.color,
        transparent: true,
        opacity: 0.45,
      });
      const line = new THREE.Line(geometry, material);
      graphGroup.add(line);
    });

    // Attack Rogue Edge: reviews (0.8, -1.8, -0.5) -> vault (3, 0.2, 0.2)
    const attackP1 = new THREE.Vector3(0.8, -1.8, -0.5);
    const attackP2 = new THREE.Vector3(3, 0.2, 0.2);
    const attackGeo = new THREE.BufferGeometry().setFromPoints([attackP1, attackP2]);
    const attackMat = new THREE.LineDashedMaterial({
      color: 0xef4444,
      dashSize: 0.2,
      gapSize: 0.1,
      transparent: true,
      opacity: 0.9,
    });
    const attackLine = new THREE.Line(attackGeo, attackMat);
    attackLine.computeLineDistances();
    attackLine.visible = false;
    graphGroup.add(attackLine);

    // Particle Stream for Data Flow
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      particlePositions[i] = (Math.random() - 0.5) * 8;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.04,
      transparent: true,
      opacity: 0.6,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    graphGroup.add(particleSystem);

    // Raycaster for node interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes);
      if (intersects.length > 0) {
        const clickedData = intersects[0].object.userData as NodeData;
        setSelectedNode(clickedData);
      }
    };

    container.addEventListener('mousemove', handlePointerMove);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Gentle orbital oscillation
      graphGroup.rotation.y = Math.sin(elapsed * 0.2) * 0.25;
      graphGroup.rotation.x = Math.cos(elapsed * 0.15) * 0.1;

      // Pulse attack line if enabled
      if (attackLine.visible) {
        attackMat.opacity = 0.5 + Math.sin(elapsed * 6) * 0.5;
      }

      // Drift particles
      const positions = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += Math.sin(elapsed + i) * 0.002;
      }
      particleGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || 300;
      const h = container.clientHeight || 300;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handlePointerMove);
      cancelAnimationFrame(animationFrameId);
      if (renderer) {
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        renderer.dispose();
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[540px] sm:h-[480px] lg:h-[560px] rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white/40 dark:bg-[#0B0D13]/80 overflow-hidden backdrop-blur-xl shadow-2xl flex flex-col justify-between max-w-full">
      
      {/* Top Console Status Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 tracking-tight">
              Live Topology Graph
            </span>
          </div>
          <span className="hidden sm:inline-block text-slate-300 dark:text-zinc-700">|</span>
          <span className="hidden sm:inline-block text-xs text-slate-500 dark:text-zinc-400">
            eBPF / Kafka Ingress 9092
          </span>
        </div>

        {/* Attack Simulator Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAttackSimulated((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              isAttackSimulated
                ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/60 dark:border-rose-900 dark:text-rose-300 shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-700 dark:bg-zinc-800/90 dark:hover:bg-zinc-700 dark:border-zinc-700 dark:text-zinc-200'
            }`}
          >
            {isAttackSimulated ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                <span>Rogue SSRF Active</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>Simulate Lateral Attack</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 cursor-crosshair z-0" />

      {/* Live Causal HUD Cards Overlay - Unified Typography */}
      <div className="relative z-10 p-3 sm:p-6 pointer-events-none flex flex-col sm:flex-row justify-between items-stretch sm:items-end gap-2.5 sm:gap-4 max-w-full">
        
        {/* Selected Node Telemetry HUD */}
        {selectedNode && (
          <div className="pointer-events-auto w-full sm:w-72 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white/95 dark:bg-zinc-950/85 p-3.5 sm:p-4 shadow-xl backdrop-blur-2xl transition-all dark:shadow-[0_12px_36px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800/80 text-xs">
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0"></span>
                <span className="truncate">{selectedNode.name}</span>
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 shrink-0 ml-1">
                Port {selectedNode.port}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 dark:text-zinc-500 block text-[10px]">Role</span>
                <span className="text-slate-800 dark:text-zinc-200 font-medium truncate block">
                  {selectedNode.role}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-zinc-500 block text-[10px]">Baseline Ingress</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Verified A_base
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Global RCA Telemetry Badge */}
        <div className="pointer-events-auto w-full sm:w-80 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white/95 dark:bg-zinc-950/85 p-3.5 sm:p-4 shadow-xl backdrop-blur-2xl dark:shadow-[0_12px_36px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800/80 text-xs">
            <span className="text-slate-700 dark:text-zinc-300 font-medium flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="truncate">GAT RCA Inference</span>
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${
              isAttackSimulated
                ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/60 dark:border-rose-900 dark:text-rose-300'
                : 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300'
            }`}>
              {metrics.status}
            </span>
          </div>

          <div className="mt-2.5 space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-[11px] sm:text-xs">
              <span className="text-slate-500 dark:text-zinc-400">Anomaly Probability:</span>
              <span className={`font-semibold ${isAttackSimulated ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-zinc-200'}`}>
                {isAttackSimulated ? '98.4%' : '0.12%'}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] sm:text-xs">
              <span className="text-slate-500 dark:text-zinc-400">Shannon Graph Entropy:</span>
              <span className="text-slate-800 dark:text-zinc-200 font-medium">{metrics.entropy} nats</span>
            </div>
            <div className="flex justify-between items-center text-[11px] sm:text-xs">
              <span className="text-slate-500 dark:text-zinc-400">Actuator Action:</span>
              <span className="text-sky-600 dark:text-sky-400 font-medium">
                {isAttackSimulated ? 'eBPF Socket Dropped' : 'Standby / Passive Log'}
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
