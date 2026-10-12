import { NextRequest, NextResponse } from 'next/server';
import { getAllProjects, createProject } from '@/lib/projects/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const projects = getAllProjects();
  return NextResponse.json({
    projects,
    count: projects.length,
  });
}

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
  }

  const created = createProject({
    name: body.name.trim(),
    environment: body.environment,
    ports: body.ports,
  });

  return NextResponse.json({
    project: created,
    message: `Project ${created.name} registered. Watchdog token ${created.watchdogToken} provisioned.`,
  }, { status: 201 });
}
