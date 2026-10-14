import { createClient } from '@/lib/supabase/client';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  username: string;
  photoUrl?: string | null;           // Real photo / picture
  avatarUrl?: string | null;          // Stylized digital 2D/3D mascot avatar
  activeDisplayMode: 'photo' | 'avatar'; // Instagram style photo + avatar toggle
  bannerUrl?: string | null;
  initials: string;
  headline: string;
  bio: string;
  pronouns?: string;
  company?: string;
  location?: string;
  role: 'individual' | 'team' | 'admin';
  teamRole?: string;                  // Organizational Team Member role tag (uneditable by member)
  teamName?: string;                  // Team / unit name within organization
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

export const PHOTO_PRESETS = [
  { id: 'sarah', label: 'Cloud Architect', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80' },
  { id: 'david', label: 'Security Lead', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80' },
  { id: 'elena', label: 'Kernel Engineer', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80' },
  { id: 'marcus', label: 'DevOps SRE', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80' },
  { id: 'priya', label: 'AI/ML Researcher', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80' },
  { id: 'liam', label: 'Systems Engineer', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80' },
];

export const DIGITAL_AVATAR_PRESETS = [
  { id: 'cyber', label: 'Cyber Guardian', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberGuardian&backgroundColor=0284c7' },
  { id: 'kernel', label: 'Kernel Sentinel', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=KernelSentinel&backgroundColor=6366f1' },
  { id: 'neural', label: 'Neural Operator', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=NeuralOperator&backgroundColor=10b981' },
  { id: 'watchdog', label: 'Watchdog SRE', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=SREWatchdog&backgroundColor=f59e0b' },
  { id: 'hacker', label: 'Matrix Hacker', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=MatrixHacker&backgroundColor=b6e3f4' },
  { id: 'secops', label: 'SecOps Agent', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=SecOpsAgent&backgroundColor=c0aede' },
  { id: 'cloud-avatar', label: 'Cloud Persona', url: 'https://api.dicebear.com/7.x/personas/svg?seed=CloudPersona&backgroundColor=ffd5dc' },
  { id: 'mesh', label: 'Mesh Pilot', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=MeshPilot&backgroundColor=d1d4f9' },
];

export const BANNER_PRESETS = [
  { id: 'cyber-mesh', label: 'Mesh Gradient', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80' },
  { id: 'deep-matrix', label: 'Matrix Grid', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=80' },
  { id: 'dark-obsidian', label: 'Dark Obsidian', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80' },
  { id: 'neon-circuit', label: 'Neon Circuit', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80' },
];

// Backwards compatibility alias
export const AVATAR_PRESETS = DIGITAL_AVATAR_PRESETS;

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
  photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberGuardian&backgroundColor=0284c7',
  activeDisplayMode: 'avatar',
  bannerUrl: null,
  initials: 'DP',
  headline: 'Distributed Systems & Security Telemetry Engineer',
  bio: 'Building self-healing cloud microservice topologies with eBPF telemetry interception, Graph Attention Network RCA, and automated threat containment.',
  pronouns: 'they/them',
  company: 'Cloud Scale Networks',
  location: 'San Francisco, CA',
  role: 'individual',
  teamRole: 'eBPF Kernel Architect',
  teamName: 'platform-core',
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
      const photoUrl = metadata.photo_url || metadata.picture || metadata.avatar_url || null;
      const avatarUrl = metadata.digital_avatar_url || metadata.avatar_url || DEFAULT_PROFILE.avatarUrl;
      const initials = generateInitials(name, user.email);

      // Check if we have merged local modifications
      let storedProfile: Partial<UserProfile> = {};
      try {
        const raw = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
        if (raw) storedProfile = JSON.parse(raw);
      } catch {}

      const activePhoto = storedProfile.photoUrl !== undefined ? storedProfile.photoUrl : photoUrl;
      const activeAvatar = storedProfile.avatarUrl !== undefined ? storedProfile.avatarUrl : avatarUrl;

      const profile: UserProfile = {
        ...DEFAULT_PROFILE,
        ...storedProfile,
        id: user.id || `usr_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email: user.email,
        name: storedProfile.name || name,
        username: storedProfile.username || username,
        photoUrl: activePhoto,
        avatarUrl: activeAvatar,
        activeDisplayMode: storedProfile.activeDisplayMode || (activePhoto ? 'photo' : 'avatar'),
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
  const username = profileUpdates.username || current.username;
  const email = profileUpdates.email || current.email;
  const initials = generateInitials(name, email);

  // Team Role Protection:
  // - If individual: No teamRole
  // - If team member: cannot modify teamRole (only admin or team leader can)
  // - If admin: can edit teamRole
  let teamRole: string | undefined = current.teamRole;
  if (current.role === 'admin') {
    teamRole = profileUpdates.teamRole !== undefined ? profileUpdates.teamRole : current.teamRole;
  } else if (current.role === 'team') {
    teamRole = current.teamRole || 'Platform SRE Lead';
  } else {
    teamRole = undefined;
  }

  const updated: UserProfile = {
    ...current,
    ...profileUpdates,
    name,
    username,
    email,
    initials,
    teamRole,
    workspaceTitle: profileUpdates.workspaceTitle || `${name}'s Workspace`,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(updated));
      // Dispatch event for instant UI sync across header and workspace
      window.dispatchEvent(new CustomEvent('autotrace_profile_updated', { detail: updated }));
    } catch {}
  }

  // Try updating Supabase user metadata if session is active
  try {
    const supabase = createClient();
    await supabase.auth.updateUser({
      data: {
        full_name: updated.name,
        user_name: updated.username,
        photo_url: updated.photoUrl,
        avatar_url: updated.avatarUrl,
        active_display_mode: updated.activeDisplayMode,
        headline: updated.headline,
        bio: updated.bio,
        company: updated.company,
        location: updated.location,
        pronouns: updated.pronouns,
        github_username: updated.githubUsername,
        linkedin_url: updated.linkedinUrl,
        website_url: updated.websiteUrl,
        twitter_handle: updated.twitterHandle,
        skills: updated.skills,
        banner_url: updated.bannerUrl,
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
      window.dispatchEvent(new CustomEvent('autotrace_profile_updated', { detail: fullProfile }));
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
      window.dispatchEvent(new CustomEvent('autotrace_profile_updated', { detail: null }));
    } catch {}
  }
}
