import { NextResponse } from 'next/server';
import { getOrgById } from '@/lib/db/organizations';
import { getBrief } from '@/lib/db/brief';
import { getNotesByOrg } from '@/lib/db/notes';
import { createNote } from '@/lib/db/notes';
import { generateBriefingNotes } from '@/lib/ai/briefing';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const org = getOrgById(Number(id));
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

    const brief = getBrief();
    if (!brief) return NextResponse.json({ error: 'Brief not found' }, { status: 400 });

    const notes = getNotesByOrg(Number(id));
    const briefingContent = await generateBriefingNotes(brief, org, notes);

    const note = createNote({
      organization_id: Number(id),
      type: 'briefing',
      content: briefingContent,
    });

    return NextResponse.json({ content: briefingContent, note });
  } catch (error) {
    console.error('Briefing generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate briefing' },
      { status: 500 }
    );
  }
}
