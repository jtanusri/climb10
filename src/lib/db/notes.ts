import { getDb } from '../db';
import type { Note } from './types';

export function getNotesByOrg(orgId: number): Note[] {
  const db = getDb();
  return db.prepare('SELECT * FROM notes WHERE organization_id = ? ORDER BY created_at DESC').all(orgId) as Note[];
}

export function getNotesByType(orgId: number, type: string): Note[] {
  const db = getDb();
  return db.prepare('SELECT * FROM notes WHERE organization_id = ? AND type = ? ORDER BY created_at DESC').all(orgId, type) as Note[];
}

export function createNote(data: { organization_id: number; type: string; content: string }): Note {
  const db = getDb();
  const result = db.prepare('INSERT INTO notes (organization_id, type, content) VALUES (?, ?, ?)')
    .run(data.organization_id, data.type, data.content);
  return db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid) as Note;
}

export function deleteNote(id: number): boolean {
  const db = getDb();
  return db.prepare('DELETE FROM notes WHERE id = ?').run(id).changes > 0;
}
