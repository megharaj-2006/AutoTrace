import { createClient } from '@/lib/supabase/client';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  initials: string;
  headline: string;
  bio: string;
  pronouns?: string;
  company?: string;
  location?: string;
  role: 'individual' | 'team' | 'admin';
  jobTitle?: string;
  department?: string;
  workspaceTitle: string;
  skills: string[];
  githubUsername?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  twitterHandle?: string;
  // Platform & Website Settings
  theme: 'system' | 'dark' | 'light';
  dotMatrixEnabled: boolean;
  telemetryDensity: 'compact' | 'comfortable';
  autonomousContainment: boolean;
  emailAlerts: boolean;
  soundEffects: boolean;
  // Activity Metrics
  memberSince: string;
  clustersMonitored: number;
  watchdogNodesOnline: number;
  anomaliesQuarantined: number;
}

const STORAGE_KEY_CURRENT_USER = 'autotrace_current_user_profile';

export const AVATAR_PRESETS = [
  { id: 'cloud', label: 'Cloud SRE', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
  { id: 'security', label: 'Security Lead', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { id: 'kernel', label: 'eBPF Architect', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80' },
  { id: 'devops', label: 'DevOps Engineer', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
  { id: 'ai', label: 'ML Researcher', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80' },
];

function generateInitials(name: string, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }
  if (email && email.includes('@')) {
    const prefix = email.split('@')[0];
    return prefix.substring(0, 2).toUpperCase();
  }
  return 'ME';
}

function emailToDisplayName(email: string): string {
  if (!email || !email.includes('@')) return 'Engineer';
  const prefix = email.split('@')[0];
  return prefix
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function emailToUsername(email: string): string {
  if (!email || !email.includes('@')) return 'engineer';
  return email.split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '');
}

export const DEFAULT_PROFILE: UserProfile = {
  id: 'usr_default',
  email: 'developer@autotrace-sec.internal',
  name: 'Developer Profile',
  username: 'autotrace_dev',
  avatarUrl: null,
  bannerUrl: null,
  initials: 'DP',
  headline: 'Distributed Systems & Security Telemetry Engineer',
  bio: 'Building self-healing cloud microservice topologies with eBPF telemetry interception, Graph Attention Network RCA, and automated threat containment.',
  pronouns: 'they/them',
  company: 'Cloud Scale Networks',
  location: 'San Francisco, CA',
  role: 'individual',
  jobTitle: 'Staff Telemetry Architect',
  department: 'Platform Reliability & SecOps',
  workspaceTitle: 'Dedicated Workspace',
  skills: ['Kubernetes', 'eBPF', 'Kafka / Redpanda', 'Next.js', 'Go', 'Python', 'iptables', 'GAT / PyG'],
  githubUsername: 'autotrace-dev',
  linkedinUrl: 'https://linkedin.com/in/autotrace-security',
  websiteUrl: 'https://autotrace.io',
  twitterHandle: '@autotrace_sec',
  theme: 'dark',
  dotMatrixEnabled: true,
  telemetryDensity: 'comfortable',
  autonomousContainment: true,
  emailAlerts: true,
  soundEffects: false,
  memberSince: 'March 2026',
  clustersMonitored: 1,
  watchdogNodesOnline: 4,
  anomaliesQuarantined: 12,
};

/**
 * Retrieves the currently active user profile with full GitHub/LinkedIn fields.
 */
export async function getActiveUserProfile(): Promise<UserProfile> {
  if (typeof window === 'undefined') {
    return DEFAULT_PROFILE;
  }

  // 1. Try Supabase Auth session
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.email) {
      const metadata = user.user_metadata || {};
      const name = metadata.full_name || metadata.name || metadata.user_name || emailToDisplayName(user.email);
      const username = metadata.user_name || metadata.preferred_username || emailToUsername(user.email);
      const avatarUrl = metadata.avatar_url || metadata.picture || null;
      const initials = generateInitials(name, user.email);

      // Check if we have merged local modifications
      let storedProfile: Partial<UserProfile> = {};
      try {
        const raw = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
        if (raw) storedProfile = JSON.parse(raw);
      } catch {}

      const profile: UserProfile = {
        ...DEFAULT_PROFILE,
        ...storedProfile,
        id: user.id || `usr_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email: user.email,
        name: storedProfile.name || name,
        username: storedProfile.username || username,
        avatarUrl: storedProfile.avatarUrl !== undefined ? storedProfile.avatarUrl : avatarUrl,
        initials: generateInitials(storedProfile.name || name, user.email),
        workspaceTitle: storedProfile.workspaceTitle || `${storedProfile.name || name}'s Workspace`,
        githubUsername: storedProfile.githubUsername || (metadata.user_name ? metadata.user_name : undefined),
      };

      try {
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(profile));
      } catch {}

      return profile;
    }
  } catch {
    // Supabase auth fallback
  }

  // 2. Try localStorage active profile
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && (parsed.email || parsed.name)) {
        return {
          ...DEFAULT_PROFILE,
          ...parsed,
          initials: generateInitials(parsed.name || '', parsed.email || ''),
        };
      }
    }
  } catch {}

  // 3. Fallback
  return DEFAULT_PROFILE;
}

/**
 * Explicitly saves an active profile and syncs to Supabase user metadata if authenticated.
 */
export async function saveActiveUserProfile(profileUpdates: Partial<UserProfile>): Promise<UserProfile> {
  const current = await getActiveUserProfile();
  const name = profileUpdates.name || current.name;
  const email = profileUpdates.email || current.email;
  const initials = generateInitials(name, email);

  const updated: UserProfile = {
    ...current,
    ...profileUpdates,
    name,
    email,
    initials,
    workspaceTitle: profileUpdates.workspaceTitle || `${name}'s Workspace`,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(updated));
    } catch {}
  }

  // Try updating Supabase user metadata if session is active
  try {
    const supabase = createClient();
    await supabase.auth.updateUser({
      data: {
        full_name: updated.name,
        user_name: updated.username,
        avatar_url: updated.avatarUrl,
        headline: updated.headline,
        bio: updated.bio,
        company: updated.company,
        location: updated.location,
      },
    });
  } catch {
    // Supabase update fallback
  }

  return updated;
}

/**
 * Synchronous profile setter for forms / quick mutations.
 */
export function setActiveUserProfile(profileUpdates: Partial<UserProfile> & { email: string }): UserProfile {
  const name = profileUpdates.name || emailToDisplayName(profileUpdates.email);
  const username = profileUpdates.username || emailToUsername(profileUpdates.email);
  const initials = generateInitials(name, profileUpdates.email);

  const fullProfile: UserProfile = {
    ...DEFAULT_PROFILE,
    ...profileUpdates,
    id: profileUpdates.id || `usr_${profileUpdates.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
    name,
    username,
    initials,
    workspaceTitle: profileUpdates.workspaceTitle || `${name}'s Workspace`,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(fullProfile));
    } catch {}
  }

  return fullProfile;
}

/**
 * Clears the active profile from local storage.
 */
export function clearActiveUserProfile(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    } catch {}
  }
}
