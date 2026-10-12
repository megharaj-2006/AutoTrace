import { ProjectTopologyConfig, MOCK_AMAZON_TOPOLOGY } from '@/lib/projects/topology';

export interface ProjectRegistryItem {
  id: string;
  name: string;
  environment: string;
  nodesCount: number;
  ports: string;
  throughputEventsPerSec: number;
  status: 'ACTIVE' | 'DEGRADED' | 'STANDBY';
  baselineStatus: string;
  lastAnomaly: string;
  watchdogToken: string;
  createdAt: number;
}

const DEFAULT_PROJECTS: ProjectRegistryItem[] = [
  {
    id: 'mock-amazon-cluster',
    name: 'Mock Amazon Cluster (Testbed)',
    environment: 'Docker Compose (autotrace-mesh)',
    nodesCount: 4,
    ports: '5000, 5001, 5002, 5003',
    throughputEventsPerSec: 1420,
    status: 'ACTIVE',
    baselineStatus: 'A_base Active Invariants',
    lastAnomaly: 'None (100% In-Policy)',
    watchdogToken: 'at_live_demo_9841',
    createdAt: 1710000000000,
  },
];

declare global {
  // eslint-disable-next-line no-var
  var __autotrace_project_store: Record<string, ProjectRegistryItem> | undefined;
}

if (!globalThis.__autotrace_project_store) {
  const initial: Record<string, ProjectRegistryItem> = {};
  DEFAULT_PROJECTS.forEach((p) => {
    initial[p.id] = p;
  });
  globalThis.__autotrace_project_store = initial;
}

const projectStore = globalThis.__autotrace_project_store!;

export function getAllProjects(): ProjectRegistryItem[] {
  return Object.values(projectStore).sort((a, b) => b.createdAt - a.createdAt);
}

export function getProjectById(projectId: string): ProjectRegistryItem | null {
  return projectStore[projectId] || null;
}

export function createProject(data: {
  name: string;
  environment?: string;
  ports?: string;
}): ProjectRegistryItem {
  const sanitizedId = data.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-');

  // Prevent collision with existing project IDs
  let finalId = sanitizedId || 'custom-cluster';
  let counter = 1;
  while (projectStore[finalId]) {
    finalId = `${sanitizedId}-${counter}`;
    counter++;
  }

  // Generate unique watchdog token for this project
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const watchdogToken = `atk_live_${finalId.replace(/-/g, '_')}_${randNum}`;

  const newProject: ProjectRegistryItem = {
    id: finalId,
    name: data.name.trim(),
    environment: data.environment || 'Docker Compose (autotrace-mesh)',
    nodesCount: 0, // Starts at 0 until watchdog reports microservices!
    ports: data.ports || '8080, 8081',
    throughputEventsPerSec: 0,
    status: 'STANDBY',
    baselineStatus: 'Awaiting Watchdog Telemetry',
    lastAnomaly: 'None',
    watchdogToken,
    createdAt: Date.now(),
  };

  projectStore[finalId] = newProject;
  return newProject;
}

export function deleteProject(projectId: string): boolean {
  if (projectId === 'mock-amazon-cluster') return false; // Prevent deleting core testbed
  if (projectStore[projectId]) {
    delete projectStore[projectId];
    return true;
  }
  return false;
}
