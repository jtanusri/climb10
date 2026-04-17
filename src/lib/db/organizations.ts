import { getDb } from '../db';
import type { Organization, PipelineStage } from './types';

export async function getAllOrgs(): Promise<Organization[]> {
  const db = getDb();
  const result = await db.execute('SELECT * FROM organizations ORDER BY updated_at DESC');
  return result.rows as unknown as Organization[];
}

export async function getOrgsByStage(stage: PipelineStage): Promise<Organization[]> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM organizations WHERE stage = ? ORDER BY updated_at DESC', args: [stage] });
  return result.rows as unknown as Organization[];
}

export async function getOrgById(id: number): Promise<Organization | null> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM organizations WHERE id = ?', args: [id] });
  return (result.rows[0] as unknown as Organization) ?? null;
}

export async function createOrg(data: Partial<Organization>): Promise<Organization> {
  const db = getDb();
  const result = await db.execute({
    sql: `INSERT INTO organizations (name, location, website, estimated_size, estimated_budget,
      mission_focus, why_fit, stage, keyword_category, signal_strength,
      leadership_signal_tier, leadership_signal_evidence,
      address, city, state, zip, country,
      lat, lng, discovery_run_id, source, org_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      data.name ?? '', data.location ?? '', data.website ?? '',
      data.estimated_size ?? '', data.estimated_budget ?? '',
      data.mission_focus ?? '', data.why_fit ?? '',
      data.stage ?? 'identified', data.keyword_category ?? '',
      data.signal_strength ?? '', data.leadership_signal_tier ?? 'unknown',
      data.leadership_signal_evidence ?? '',
      data.address ?? '', data.city ?? '', data.state ?? '',
      data.zip ?? '', data.country ?? '',
      data.lat ?? null, data.lng ?? null, data.discovery_run_id ?? null,
      data.source ?? 'ai_discovery', data.org_type ?? 'unknown',
    ],
  });

  await db.execute({
    sql: 'INSERT INTO stage_transitions (organization_id, from_stage, to_stage) VALUES (?, NULL, ?)',
    args: [result.lastInsertRowid!, data.stage ?? 'identified'],
  });

  return (await getOrgById(Number(result.lastInsertRowid)))!;
}

export async function updateOrg(id: number, data: Partial<Organization>): Promise<Organization | null> {
  const db = getDb();
  const org = await getOrgById(id);
  if (!org) return null;

  await db.execute({
    sql: `UPDATE organizations SET
      name = ?, location = ?, website = ?, estimated_size = ?,
      estimated_budget = ?, mission_focus = ?, why_fit = ?,
      keyword_category = ?, signal_strength = ?,
      leadership_signal_tier = ?, leadership_signal_evidence = ?,
      address = ?, city = ?, state = ?, zip = ?, country = ?,
      org_type = ?,
      lat = ?, lng = ?, updated_at = datetime('now')
    WHERE id = ?`,
    args: [
      data.name ?? org.name, data.location ?? org.location,
      data.website ?? org.website, data.estimated_size ?? org.estimated_size,
      data.estimated_budget ?? org.estimated_budget,
      data.mission_focus ?? org.mission_focus, data.why_fit ?? org.why_fit,
      data.keyword_category ?? org.keyword_category,
      data.signal_strength ?? org.signal_strength,
      data.leadership_signal_tier ?? org.leadership_signal_tier,
      data.leadership_signal_evidence ?? org.leadership_signal_evidence,
      data.address ?? org.address, data.city ?? org.city,
      data.state ?? org.state, data.zip ?? org.zip,
      data.country ?? org.country,
      data.org_type ?? org.org_type ?? 'unknown',
      data.lat ?? org.lat, data.lng ?? org.lng, id,
    ],
  });

  return getOrgById(id);
}

export async function updateOrgStage(id: number, newStage: PipelineStage, note?: string): Promise<Organization | null> {
  const db = getDb();
  const org = await getOrgById(id);
  if (!org) return null;

  await db.execute({ sql: "UPDATE organizations SET stage = ?, updated_at = datetime('now') WHERE id = ?", args: [newStage, id] });
  await db.execute({
    sql: 'INSERT INTO stage_transitions (organization_id, from_stage, to_stage, note) VALUES (?, ?, ?, ?)',
    args: [id, org.stage, newStage, note ?? ''],
  });

  if (newStage === 'outreach_sent') {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    await db.execute({
      sql: 'INSERT INTO follow_up_reminders (organization_id, due_date, note) VALUES (?, ?, ?)',
      args: [id, dueDate.toISOString().split('T')[0], '14-day follow-up after outreach sent'],
    });
  }

  return getOrgById(id);
}

export async function updateOrgCoordinates(id: number, lat: number, lng: number): Promise<Organization | null> {
  const db = getDb();
  await db.execute({ sql: "UPDATE organizations SET lat = ?, lng = ?, updated_at = datetime('now') WHERE id = ?", args: [lat, lng, id] });
  return getOrgById(id);
}

export async function deleteOrg(id: number): Promise<boolean> {
  const db = getDb();
  const result = await db.execute({ sql: 'DELETE FROM organizations WHERE id = ?', args: [id] });
  return result.rowsAffected > 0;
}
