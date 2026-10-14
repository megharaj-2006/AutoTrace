-- ==============================================================================
-- AutoTrace-Sec: Dedicated User Projects and Workspace Persistence Schema
-- Target: Supabase PostgreSQL Database
-- Dashboard URL: https://supabase.com/dashboard/project/bngrgfsnwubycfgrbhdv/sql
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'default-user',
    name TEXT NOT NULL,
    environment TEXT DEFAULT 'Docker Compose (autotrace-mesh)',
    nodes_count INTEGER DEFAULT 0,
    ports TEXT DEFAULT '5000, 5001, 5002, 5003',
    throughput_events_per_sec INTEGER DEFAULT 0,
    status TEXT DEFAULT 'STANDBY',
    baseline_status TEXT DEFAULT 'Awaiting Watchdog Connection',
    last_anomaly TEXT DEFAULT 'None',
    watchdog_token TEXT NOT NULL,
    created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);

INSERT INTO public.projects (
    id, user_id, name, environment, nodes_count, ports, throughput_events_per_sec, status, baseline_status, last_anomaly, watchdog_token, created_at
) VALUES (
    'mock-amazon-cluster', 'system', 'Mock Amazon Cluster (Testbed)', 'Docker Compose (autotrace-mesh)', 4, '5000, 5001, 5002, 5003', 1420, 'ACTIVE', 'A_base Active Invariants', 'None (100% In-Policy)', 'at_live_demo_9841', 1710000000000
) ON CONFLICT (id) DO UPDATE SET
    nodes_count = 4,
    status = 'ACTIVE',
    baseline_status = 'A_base Active Invariants';

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to projects" ON public.projects;
CREATE POLICY "Allow public read access to projects"
ON public.projects FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow insert access to projects" ON public.projects;
CREATE POLICY "Allow insert access to projects"
ON public.projects FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update access to projects" ON public.projects;
CREATE POLICY "Allow update access to projects"
ON public.projects FOR UPDATE
USING (true);

DROP POLICY IF EXISTS "Allow delete access to projects" ON public.projects;
CREATE POLICY "Allow delete access to projects"
ON public.projects FOR DELETE
USING (id <> 'mock-amazon-cluster');
