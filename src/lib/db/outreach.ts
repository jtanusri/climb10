import { getDb } from '../db';
import type { OutreachDraft } from './types';

export async function getDraftsByOrg(orgId: number): Promise<OutreachDraft[]> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM outreach_drafts WHERE organization_id = ? ORDER BY created_at DESC', args: [orgId] });
  return result.rows as unknown as OutreachDraft[];
}

export async function getDraftById(id: number): Promise<OutreachDraft | null> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM outreach_drafts WHERE id = ?', args: [id] });
  return (result.rows[0] as unknown as OutreachDraft) ?? null;
}

export async function createDraft(data: {
  organization_id: number;
  contact_id?: number;
  subject_line?: string;
  body: string;
}): Promise<OutreachDraft> {
  const db = getDb();
  const result = await db.execute({
    sql: 'INSERT INTO outreach_drafts (organization_id, contact_id, subject_line, body) VALUES (?, ?, ?, ?)',
    args: [data.organization_id, data.contact_id ?? null, data.subject_line ?? '', data.body],
  });
  const row = await db.execute({ sql: 'SELECT * FROM outreach_drafts WHERE id = ?', args: [result.lastInsertRowid!] });
  return row.rows[0] as unknown as OutreachDraft;
}

export async function updateDraft(id: number, data: Partial<OutreachDraft>): Promise<OutreachDraft | null> {
  const db = getDb();
  const draft = await getDraftById(id);
  if (!draft) return null;

  await db.execute({
    sql: `UPDATE outreach_drafts SET
      subject_line = ?, body = ?, status = ?,
      sent_at = ?, updated_at = datetime('now')
    WHERE id = ?`,
    args: [
      data.subject_line ?? draft.subject_line,
      data.body ?? draft.body,
      data.status ?? draft.status,
      data.sent_at ?? draft.sent_at,
      id,
    ],
  });

  return getDraftById(id);
}

export async function markDraftSent(id: number): Promise<OutreachDraft | null> {
  return updateDraft(id, {
    status: 'sent',
    sent_at: new Date().toISOString(),
  });
}
