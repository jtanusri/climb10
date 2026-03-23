import { getDb } from '../db';
import type { FollowUpReminder } from './types';

export function getActiveReminders(): FollowUpReminder[] {
  const db = getDb();
  return db.prepare(`
    SELECT r.*, o.name as org_name
    FROM follow_up_reminders r
    JOIN organizations o ON o.id = r.organization_id
    WHERE r.is_complete = 0 AND r.due_date <= date('now')
    ORDER BY r.due_date ASC
  `).all() as FollowUpReminder[];
}

export function getAllReminders(): FollowUpReminder[] {
  const db = getDb();
  return db.prepare(`
    SELECT r.*, o.name as org_name
    FROM follow_up_reminders r
    JOIN organizations o ON o.id = r.organization_id
    WHERE r.is_complete = 0
    ORDER BY r.due_date ASC
  `).all() as FollowUpReminder[];
}

export function createReminder(data: { organization_id: number; due_date: string; note: string }): FollowUpReminder {
  const db = getDb();
  const result = db.prepare('INSERT INTO follow_up_reminders (organization_id, due_date, note) VALUES (?, ?, ?)')
    .run(data.organization_id, data.due_date, data.note);
  return db.prepare(`
    SELECT r.*, o.name as org_name
    FROM follow_up_reminders r
    JOIN organizations o ON o.id = r.organization_id
    WHERE r.id = ?
  `).get(result.lastInsertRowid) as FollowUpReminder;
}

export function completeReminder(id: number): boolean {
  const db = getDb();
  return db.prepare('UPDATE follow_up_reminders SET is_complete = 1, completed_at = datetime(\'now\') WHERE id = ?')
    .run(id).changes > 0;
}
