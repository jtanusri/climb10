import { getDb } from '../db';
import type { Contact } from './types';

export function getContactsByOrg(orgId: number): Contact[] {
  const db = getDb();
  return db.prepare('SELECT * FROM contacts WHERE organization_id = ? ORDER BY created_at DESC').all(orgId) as Contact[];
}

export function getContactById(id: number): Contact | null {
  const db = getDb();
  return db.prepare('SELECT * FROM contacts WHERE id = ?').get(id) as Contact | undefined ?? null;
}

export function createContact(data: Partial<Contact> & { organization_id: number; contact_name: string }): Contact {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO contacts (organization_id, contact_name, contact_email, contact_position,
      contact_linkedin, contact_bio, review_status, host_producer_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.organization_id,
    data.contact_name,
    data.contact_email ?? '',
    data.contact_position ?? '',
    data.contact_linkedin ?? '',
    data.contact_bio ?? '',
    data.review_status ?? 'Pending Review',
    data.host_producer_notes ?? '',
  );
  return db.prepare('SELECT * FROM contacts WHERE id = ?').get(result.lastInsertRowid) as Contact;
}

export function updateContact(id: number, data: Partial<Contact>): Contact | null {
  const db = getDb();
  const contact = getContactById(id);
  if (!contact) return null;

  db.prepare(`
    UPDATE contacts SET
      contact_name = ?, contact_email = ?, contact_position = ?,
      contact_linkedin = ?, contact_bio = ?,
      review_status = ?, host_producer_notes = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    data.contact_name ?? contact.contact_name,
    data.contact_email ?? contact.contact_email,
    data.contact_position ?? contact.contact_position,
    data.contact_linkedin ?? contact.contact_linkedin,
    data.contact_bio ?? contact.contact_bio,
    data.review_status ?? contact.review_status,
    data.host_producer_notes ?? contact.host_producer_notes,
    id,
  );
  return db.prepare('SELECT * FROM contacts WHERE id = ?').get(id) as Contact;
}

export function deleteContact(id: number): boolean {
  const db = getDb();
  return db.prepare('DELETE FROM contacts WHERE id = ?').run(id).changes > 0;
}
