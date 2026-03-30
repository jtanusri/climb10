import { getDb } from '../db';
import type { Note } from './types';

export async function getNotesByOrg(orgId: number): Promise<Note[]> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM notes WHERE organization_id = ? ORDER BY created_at DESC', args: [orgId] });
  return result.rows as unknown as Note[];
}

export async function getNotesByType(orgId: number, type: string): Promise<Note[]> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM notes WHERE organization_id = ? AND type = ? ORDER BY created_at DESC', args: [orgId, type] });
  return result.rows as unknown as Note[];
}

export async function createNote(data: { organization_id: number; type: string; content: string }): Promise<Note> {
  const db = getDb();
  const result = await db.execute({
    sql: 'INSERT INTO notes (organization_id, type, content) VALUES (?, ?, ?)',
    args: [data.organization_id, data.type, data.content],
  });
  const row = await db.execute({ sql: 'SELECT * FROM notes WHERE id = ?', args: [result.lastInsertRowid!] });
  return row.rows[0] as unknown as Note;
}

export async function deleteNote(id: number): Promise<boolean> {
  const db = getDb();
  const result = await db.execute({ sql: 'DELETE FROM notes WHERE id = ?', args: [id] });
  return result.rowsAffected > 0;
}
