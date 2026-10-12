import { NextRequest, NextResponse } from 'next/server';
import { stopWatchdogRunner } from '@/lib/watchdog/store';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const { projectId } = params;
  const state = stopWatchdogRunner(projectId);

  return NextResponse.json({
    status: 'STOPPED',
    connected: false,
    projectId,
    message: `Watchdog daemon detached for project ${projectId}. Sockets closed.`,
  });
}
