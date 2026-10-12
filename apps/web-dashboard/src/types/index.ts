export interface NavItem {
  label: string;
  href: string;
  badge?: string;
}

export interface SearchItem {
  id: string;
  title: string;
  category: 'Marketing' | 'Architecture' | 'Docs' | 'Auth';
  href: string;
  description: string;
}

export interface PricingTier {
  id: string;
  name: string;
  category: 'individual' | 'organization';
  priceMonthly: number;
  watchdogLimit: number | 'unlimited';
  description: string;
  features: string[];
  cta: string;
  isPopular?: boolean;
}

export interface BentoCardData {
  id: string;
  title: string;
  tagline: string;
  metric: string;
  description: string;
  category: string;
}

export interface ClusterNodeInfo {
  id: string;
  name: string;
  role: string;
  port: number;
  status: 'HEALTHY' | 'ANOMALOUS' | 'QUARANTINED' | 'DEGRADED';
  p99LatencyMs: number;
  reqPerSec: number;
  cpuUsage: number;
  memoryUsage: number;
}
