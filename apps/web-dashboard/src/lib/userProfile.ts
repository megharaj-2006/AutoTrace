import { createClient } from '@/lib/supabase/client';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  initials: string;
  role: 'individual' | 'team' | 'admin';
  workspaceTitle: string;
}

const STORAGE_KEY_CURRENT_USER = 'autotrace_current_user_profile';

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

/**
 * Retrieves the currently active user profile.
 * Prioritizes Supabase session, then falls back to locally saved active session.
 */
export async function getActiveUserProfile(): Promise<UserProfile> {
  if (typeof window === 'undefined') {
    return {
      id: 'default-profile',
      email: 'engineer@autotrace-sec.internal',
      name: 'Engineering Profile',
      avatarUrl: null,
      initials: 'EP',
      role: 'individual',
      workspaceTitle: 'Dedicated Workspace',
    };
  }

  // 1. Try Supabase Auth session
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.email) {
      const metadata = user.user_metadata || {};
      const name = metadata.full_name || metadata.name || metadata.user_name || emailToDisplayName(user.email);
      const avatarUrl = metadata.avatar_url || metadata.picture || null;
      const initials = generateInitials(name, user.email);

      const profile: UserProfile = {
        id: user.id || `usr_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email: user.email,
        name,
        avatarUrl,
        initials,
        role: 'individual',
        workspaceTitle: `${name}'s Workspace`,
      };

      // Sync to local storage
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
      const parsed: UserProfile = JSON.parse(stored);
      if (parsed && parsed.email) {
        return parsed;
      }
    }
  } catch {}

  // 3. Default fallback for guests
  return {
    id: 'default-individual',
    email: 'developer@autotrace-sec.internal',
    name: 'Developer Profile',
    avatarUrl: null,
    initials: 'DP',
    role: 'individual',
    workspaceTitle: 'Personal Workspace',
  };
}

/**
 * Explicitly saves an active profile (e.g. during manual login).
 */
export function setActiveUserProfile(profile: Partial<UserProfile> & { email: string }): UserProfile {
  const name = profile.name || emailToDisplayName(profile.email);
  const initials = generateInitials(name, profile.email);
  const fullProfile: UserProfile = {
    id: profile.id || `usr_${profile.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
    email: profile.email,
    name,
    avatarUrl: profile.avatarUrl || null,
    initials,
    role: profile.role || 'individual',
    workspaceTitle: profile.workspaceTitle || `${name}'s Workspace`,
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
