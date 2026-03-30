import { getDb } from '../db';
import type { Contact } from './types';

export async function getContactsByOrg(orgId: number): Promise<Contact[]> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM contacts WHERE organization_id = ? ORDER BY created_at DESC', args: [orgId] });
  return result.rows as unknown as Contact[];
}

export async function getContactById(id: number): Promise<Contact | null> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM contacts WHERE id = ?', args: [id] });
  return (result.rows[0] as unknown as Contact) ?? null;
}

export async function createContact(data: Partial<Contact> & { organization_id: number; contact_name: string }): Promise<Contact> {
  const db = getDb();
  const result = await db.execute({
    sql: `INSERT INTO contacts (organization_id, contact_name, contact_email, contact_position,
      contact_linkedin, contact_bio, review_status, host_producer_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      data.organization_id, data.contact_name,
      data.contact_email ?? '', data.contact_position ?? '',
      data.contact_linkedin ?? '', data.contact_bio ?? '',
      data.review_status ?? 'Pending Review', data.host_producer_notes ?? '',
    ],
  });
  const row = await db.execute({ sql: 'SELECT * FROM contacts WHERE id = ?', args: [result.lastInsertRowid!] });
  return row.rows[0] as unknown as Contact;
}

export async function updateContact(id: number, data: Partial<Contact>): Promise<Contact | null> {
  const db = getDb();
  const contact = await getContactById(id);
  if (!contact) return null;

  await db.execute({
    sql: `UPDATE contacts SET
      contact_name = ?, contact_email = ?, contact_position = ?,
      contact_linkedin = ?, contact_bio = ?,
      review_status = ?, host_producer_notes = ?,
      updated_at = datetime('now')
    WHERE id = ?`,
    args: [
      data.contact_name ?? contact.contact_name,
      data.contact_email ?? contact.contact_email,
      data.contact_position ?? contact.contact_position,
      data.contact_linkedin ?? contact.contact_linkedin,
      data.contact_bio ?? contact.contact_bio,
      data.review_status ?? contact.review_status,
      data.host_producer_notes ?? contact.host_producer_notes,
      id,
    ],
  });
  const row = await db.execute({ sql: 'SELECT * FROM contacts WHERE id = ?', args: [id] });
  return row.rows[0] as unknown as Contact;
}

export async function deleteContact(id: number): Promise<boolean> {
  const db = getDb();
  const result = await db.execute({ sql: 'DELETE FROM contacts WHERE id = ?', args: [id] });
  return result.rowsAffected > 0;
}
