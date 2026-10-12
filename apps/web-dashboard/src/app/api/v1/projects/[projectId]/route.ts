import { NextRequest, NextResponse } from 'next/server';
import { getProjectById, deleteProject } from '@/lib/projects/store';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const { projectId } = params;
  const project = getProjectById(projectId);

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const { projectId } = params;
  const deleted = deleteProject(projectId);

  if (!deleted) {
    return NextResponse.json(
      { error: 'Cannot delete project or project not found' },
      { status: 400 }
    );
  }

  return NextResponse.json({ status: 'DELETED', projectId });
}
