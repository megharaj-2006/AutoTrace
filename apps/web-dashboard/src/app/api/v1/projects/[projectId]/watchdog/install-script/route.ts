import { NextRequest, NextResponse } from 'next/server';

import { getProjectTopology } from '@/lib/projects/topology';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const { projectId } = params;
  const url = new URL(request.url);
  const format = url.searchParams.get('format') || 'json';

  // Use single source of truth for project topology and watchdog token
  const topo = getProjectTopology(projectId);
  const token = topo.watchdogToken;

  const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8085';
  const downloadHost = process.env.NEXT_PUBLIC_API_HOST || 'https://get.autotrace.io';
  const curlCommand = `curl -sSL ${downloadHost}/watchdog.sh | sudo bash -s -- --token=${token} --gateway=${gatewayUrl}`;

  if (format === 'sh' || format === 'text') {
    return new Response(curlCommand, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  return NextResponse.json({
    projectId,
    token,
    gatewayUrl,
    version: 'v1.2.0',
    footprint: '< 15 MB (< 50 KB standalone native runner)',
    curlCommand,
    downloadUrl: `/api/v1/projects/${projectId}/watchdog/download`,
    supportedPlatforms: ['Linux x86_64', 'Linux ARM64', 'Darwin ARM64'],
    kernelRequirement: 'Linux Kernel 5.4+ (eBPF socket lifecycle probe / loopback interceptor)',
    options: {
      optionA: {
        title: 'Instant 1-Line Install',
        command: curlCommand,
      },
      optionB: {
        title: 'Direct Download Binary',
        downloadUrl: `/api/v1/projects/${projectId}/watchdog/download`,
        filename: 'autotrace-watchdog-1.2.0-linux-amd64.tar.gz',
        sizeFormatted: '12.4 MB',
      },
    },
  });
}
