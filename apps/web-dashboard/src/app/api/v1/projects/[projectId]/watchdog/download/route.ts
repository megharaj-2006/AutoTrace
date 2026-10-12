import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const { projectId } = params;

  // Search candidate paths for the packaged archive
  const candidatePaths = [
    path.join(process.cwd(), 'public', 'downloads', 'autotrace-watchdog-1.2.0-linux-amd64.tar.gz'),
    path.join(process.cwd(), '..', '..', 'services', 'telemetry-watchdog', 'dist', 'autotrace-watchdog-1.2.0-linux-amd64.tar.gz'),
    path.join(process.cwd(), '..', '..', 'services', 'telemetry-watchdog', 'dist', 'autotrace-watchdog-latest.tar.gz'),
  ];

  let archiveBuffer: Buffer | null = null;
  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      try {
        archiveBuffer = fs.readFileSync(candidate);
        break;
      } catch {
        continue;
      }
    }
  }

  if (!archiveBuffer) {
    // If packaging hasn't run yet, generate a fallback response or 404
    return NextResponse.json(
      {
        error: 'WATCHDOG_ARCHIVE_NOT_FOUND',
        message: 'The watchdog agent archive is currently being built. Please run scripts/package-watchdog.sh.',
        projectId
      },
      { status: 404 }
    );
  }

  const filename = `autotrace-watchdog-1.2.0-linux-amd64.tar.gz`;

  return new NextResponse(new Uint8Array(archiveBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/gzip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': archiveBuffer.length.toString(),
      'X-AutoTrace-Project': projectId,
      'X-AutoTrace-Agent-Version': '1.2.0',
    },
  });
}
