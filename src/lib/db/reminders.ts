import { getDb } from '../db';
import type { FollowUpReminder } from './types';

export async function getActiveReminders(): Promise<FollowUpReminder[]> {
  const db = getDb();
  const result = await db.execute(`
    SELECT r.*, o.name as org_name
    FROM follow_up_reminders r
    JOIN organizations o ON o.id = r.organization_id
    WHERE r.is_complete = 0 AND r.due_date <= date('now')
    ORDER BY r.due_date ASC
  `);
  return result.rows as unknown as FollowUpReminder[];
}

export async function getAllReminders(): Promise<FollowUpReminder[]> {
  const db = getDb();
  const result = await db.execute(`
    SELECT r.*, o.name as org_name
    FROM follow_up_reminders r
    JOIN organizations o ON o.id = r.organization_id
    WHERE r.is_complete = 0
    ORDER BY r.due_date ASC
  `);
  return result.rows as unknown as FollowUpReminder[];
}

export async function createReminder(data: { organization_id: number; due_date: string; note: string }): Promise<FollowUpReminder> {
  const db = getDb();
  const result = await db.execute({
    sql: 'INSERT INTO follow_up_reminders (organization_id, due_date, note) VALUES (?, ?, ?)',
    args: [data.organization_id, data.due_date, data.note],
  });
  const row = await db.execute({
    sql: `SELECT r.*, o.name as org_name
    FROM follow_up_reminders r
    JOIN organizations o ON o.id = r.organization_id
    WHERE r.id = ?`,
    args: [result.lastInsertRowid!],
  });
  return row.rows[0] as unknown as FollowUpReminder;
}

export async function completeReminder(id: number): Promise<boolean> {
  const db = getDb();
  const result = await db.execute({
    sql: "UPDATE follow_up_reminders SET is_complete = 1, completed_at = datetime('now') WHERE id = ?",
    args: [id],
  });
  return result.rowsAffected > 0;
}
