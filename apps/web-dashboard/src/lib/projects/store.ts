import fs from 'fs';
import path from 'path';
import { createClient } from '@/lib/supabase/server';

export interface ProjectRegistryItem {
  id: string;
  userId?: string;
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

// Exactly ONE default project for all profiles: The core Mock Amazon Testbed
export const DEFAULT_PROJECTS: ProjectRegistryItem[] = [
  {
    id: 'mock-amazon-cluster',
    userId: 'system',
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

const DISK_CACHE_FILE = path.join('/tmp', 'autotrace_projects.json');

function loadDiskCache(): Record<string, ProjectRegistryItem> {
  const store: Record<string, ProjectRegistryItem> = {};
  DEFAULT_PROJECTS.forEach((p) => {
    store[p.id] = { ...p };
  });

  try {
    if (fs.existsSync(DISK_CACHE_FILE)) {
      const raw = fs.readFileSync(DISK_CACHE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        Object.entries(parsed).forEach(([key, val]) => {
          // Filter out legacy hardcoded projects
          if (key === 'fintech-payment-pipeline' || key === 'edge-iot-telemetry-gateway') {
            return;
          }
          store[key] = val as ProjectRegistryItem;
        });
      }
    }
  } catch {
    // Disk cache read fallback
  }

  return store;
}

function saveDiskCache(store: Record<string, ProjectRegistryItem>) {
  try {
    fs.writeFileSync(DISK_CACHE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch {
    // Disk write fallback
  }
}

if (!globalThis.__autotrace_project_store) {
  globalThis.__autotrace_project_store = loadDiskCache();
}

const projectStore = globalThis.__autotrace_project_store!;

/**
 * Fetch projects belonging to a user (plus the default testbed).
 * Tries Supabase PostgreSQL first; falls back seamlessly to server persistent store.
 */
export async function getAllProjects(userId?: string): Promise<ProjectRegistryItem[]> {
  // 1. Try Supabase projects table
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('projects').select('*');
    if (!error && Array.isArray(data) && data.length > 0) {
      data.forEach((row: any) => {
        // Strip any legacy stale records
        if (row.id === 'fintech-payment-pipeline' || row.id === 'edge-iot-telemetry-gateway') {
          return;
        }
        const item: ProjectRegistryItem = {
          id: row.id,
          userId: row.user_id || undefined,
          name: row.name,
          environment: row.environment,
          nodesCount: row.nodes_count ?? 0,
          ports: row.ports,
          throughputEventsPerSec: row.throughput_events_per_sec ?? 0,
          status: row.status,
          baselineStatus: row.baseline_status,
          lastAnomaly: row.last_anomaly,
          watchdogToken: row.watchdog_token,
          createdAt: Number(row.created_at) || Date.now(),
        };
        projectStore[item.id] = item;
      });
      saveDiskCache(projectStore);
    }
  } catch {
    // Supabase query fallback
  }

  // Filter projects: Core testbed is accessible to all; custom projects are scoped to user
  const all = Object.values(projectStore).filter((p) => {
    if (p.id === 'mock-amazon-cluster') return true;
    if (p.id === 'fintech-payment-pipeline' || p.id === 'edge-iot-telemetry-gateway') return false;
    if (!userId) return true; // If no user filter, return all (e.g. admin or internal)
    return p.userId === userId || p.userId === 'default-user' || !p.userId;
  });

  return all.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Synchronous accessor for in-memory / disk cache projects.
 */
export function getAllProjectsSync(userId?: string): ProjectRegistryItem[] {
  const all = Object.values(projectStore).filter((p) => {
    if (p.id === 'mock-amazon-cluster') return true;
    if (p.id === 'fintech-payment-pipeline' || p.id === 'edge-iot-telemetry-gateway') return false;
    if (!userId) return true;
    return p.userId === userId || p.userId === 'default-user' || !p.userId;
  });
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getProjectById(projectId: string): Promise<ProjectRegistryItem | null> {
  if (projectStore[projectId]) {
    return projectStore[projectId];
  }

  // Try Supabase fallback
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('projects').select('*').eq('id', projectId).single();
    if (!error && data) {
      const item: ProjectRegistryItem = {
        id: data.id,
        userId: data.user_id || undefined,
        name: data.name,
        environment: data.environment,
        nodesCount: data.nodes_count ?? 0,
        ports: data.ports,
        throughputEventsPerSec: data.throughput_events_per_sec ?? 0,
        status: data.status,
        baselineStatus: data.baseline_status,
        lastAnomaly: data.last_anomaly,
        watchdogToken: data.watchdog_token,
        createdAt: Number(data.created_at) || Date.now(),
      };
      projectStore[item.id] = item;
      saveDiskCache(projectStore);
      return item;
    }
  } catch {}

  return null;
}

export async function createProject(data: {
  name: string;
  environment?: string;
  ports?: string;
  userId?: string;
}): Promise<ProjectRegistryItem> {
  const sanitizedId = data.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-');

  let finalId = sanitizedId || 'custom-cluster';
  let counter = 1;
  while (projectStore[finalId]) {
    finalId = `${sanitizedId}-${counter}`;
    counter++;
  }

  const randNum = Math.floor(1000 + Math.random() * 9000);
  const watchdogToken = `atk_live_${finalId.replace(/-/g, '_')}_${randNum}`;

  const newProject: ProjectRegistryItem = {
    id: finalId,
    userId: data.userId || 'default-user',
    name: data.name.trim(),
    environment: data.environment || 'Docker Compose (autotrace-mesh)',
    nodesCount: 0,
    ports: data.ports || '5000, 5001, 5002, 5003',
    throughputEventsPerSec: 0,
    status: 'STANDBY',
    baselineStatus: 'Awaiting Watchdog Connection',
    lastAnomaly: 'None',
    watchdogToken,
    createdAt: Date.now(),
  };

  // 1. Save to in-memory & disk cache
  projectStore[finalId] = newProject;
  saveDiskCache(projectStore);

  // 2. Persist to Supabase if table exists
  try {
    const supabase = await createClient();
    await supabase.from('projects').insert({
      id: newProject.id,
      user_id: newProject.userId,
      name: newProject.name,
      environment: newProject.environment,
      nodes_count: newProject.nodesCount,
      ports: newProject.ports,
      throughput_events_per_sec: newProject.throughputEventsPerSec,
      status: newProject.status,
      baseline_status: newProject.baselineStatus,
      last_anomaly: newProject.lastAnomaly,
      watchdog_token: newProject.watchdogToken,
      created_at: newProject.createdAt,
    });
  } catch {
    // Supabase insert fallback
  }

  return newProject;
}

export async function deleteProject(projectId: string): Promise<boolean> {
  if (projectId === 'mock-amazon-cluster') return false; // Core testbed cannot be deleted
  if (projectStore[projectId]) {
    delete projectStore[projectId];
    saveDiskCache(projectStore);

    // Also delete from Supabase if table exists
    try {
      const supabase = await createClient();
      await supabase.from('projects').delete().eq('id', projectId);
    } catch {}

    return true;
  }
  return false;
}

export function recordProjectWatchdogConnection(
  projectId: string,
  nodesCount: number,
  throughput: number
) {
  if (projectStore[projectId]) {
    projectStore[projectId].nodesCount = nodesCount;
    projectStore[projectId].status = 'ACTIVE';
    projectStore[projectId].baselineStatus = 'A_base Active Invariants';
    projectStore[projectId].throughputEventsPerSec = throughput;
    saveDiskCache(projectStore);
  }
}
