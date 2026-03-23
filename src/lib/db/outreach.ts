import { getDb } from '../db';
import type { OutreachDraft } from './types';

export function getDraftsByOrg(orgId: number): OutreachDraft[] {
  const db = getDb();
  return db.prepare('SELECT * FROM outreach_drafts WHERE organization_id = ? ORDER BY created_at DESC').all(orgId) as OutreachDraft[];
}

export function getDraftById(id: number): OutreachDraft | null {
  const db = getDb();
  return db.prepare('SELECT * FROM outreach_drafts WHERE id = ?').get(id) as OutreachDraft | undefined ?? null;
}

export function createDraft(data: {
  organization_id: number;
  contact_id?: number;
  subject_line?: string;
  body: string;
}): OutreachDraft {
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO outreach_drafts (organization_id, contact_id, subject_line, body) VALUES (?, ?, ?, ?)'
  ).run(data.organization_id, data.contact_id ?? null, data.subject_line ?? '', data.body);
  return db.prepare('SELECT * FROM outreach_drafts WHERE id = ?').get(result.lastInsertRowid) as OutreachDraft;
}

export function updateDraft(id: number, data: Partial<OutreachDraft>): OutreachDraft | null {
  const db = getDb();
  const draft = getDraftById(id);
  if (!draft) return null;

  db.prepare(`
    UPDATE outreach_drafts SET
      subject_line = ?, body = ?, status = ?,
      sent_at = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    data.subject_line ?? draft.subject_line,
    data.body ?? draft.body,
    data.status ?? draft.status,
    data.sent_at ?? draft.sent_at,
    id,
  );

  return getDraftById(id);
}

export function markDraftSent(id: number): OutreachDraft | null {
  return updateDraft(id, {
    status: 'sent',
    sent_at: new Date().toISOString(),
  });
}
