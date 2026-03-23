import { NextResponse } from 'next/server';
import { getDraftsByOrg, createDraft } from '@/lib/db/outreach';
import { getOrgById } from '@/lib/db/organizations';
import { getContactsByOrg } from '@/lib/db/contacts';
import { getBrief } from '@/lib/db/brief';
import { generateOutreachDraft } from '@/lib/ai/outreach';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const drafts = getDraftsByOrg(Number(id));
  return NextResponse.json(drafts);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const org = getOrgById(Number(id));
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

    const brief = getBrief();
    if (!brief) return NextResponse.json({ error: 'Brief not found' }, { status: 400 });

    const contacts = getContactsByOrg(Number(id));
    const body = await request.json();

    // Use the first contact or provided contact info
    const primaryContact = contacts[0];
    const contactInfo = {
      contact_name: body.contact_name || primaryContact?.contact_name || 'Executive Director',
      contact_position: body.contact_position || primaryContact?.contact_position || '',
      contact_bio: primaryContact?.contact_bio || '',
    };

    const draftContent = await generateOutreachDraft(brief, org, contactInfo);

    // Parse subject line if present
    let subjectLine = '';
    let bodyText = draftContent;
    if (draftContent.startsWith('Subject:')) {
      const lines = draftContent.split('\n');
      subjectLine = lines[0].replace('Subject:', '').trim();
      bodyText = lines.slice(1).join('\n').trim();
    }

    const draft = createDraft({
      organization_id: Number(id),
      contact_id: primaryContact?.id ?? undefined,
      subject_line: subjectLine,
      body: bodyText,
    });

    return NextResponse.json(draft);
  } catch (error) {
    console.error('Outreach generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate outreach draft' },
      { status: 500 }
    );
  }
}
