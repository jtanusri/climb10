import { NextResponse } from 'next/server';
import { ensureMigrations } from '@/lib/db';
import { updateOrgStage } from '@/lib/db/organizations';
import type { PipelineStage } from '@/lib/db/types';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureMigrations();
  const { id } = await params;
  const { stage } = await request.json() as { stage: PipelineStage };
  const org = await updateOrgStage(Number(id), stage);
  if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(org);
}
