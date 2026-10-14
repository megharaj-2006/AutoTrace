import { NextRequest, NextResponse } from 'next/server';
import { getAllProjects, createProject } from '@/lib/projects/store';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || request.headers.get('x-user-id') || undefined;

  const projects = await getAllProjects(userId);
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

  const userId = body.userId || request.headers.get('x-user-id') || undefined;

  const created = await createProject({
    name: body.name.trim(),
    environment: body.environment,
    ports: body.ports,
    userId,
  });

  return NextResponse.json(
    {
      project: created,
      message: `Project ${created.name} registered. Watchdog token ${created.watchdogToken} provisioned.`,
    },
    { status: 201 }
  );
}
