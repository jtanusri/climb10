import { getDb } from '../db';
import type { Organization, PipelineStage } from './types';

export function getAllOrgs(): Organization[] {
  const db = getDb();
  return db.prepare('SELECT * FROM organizations ORDER BY updated_at DESC').all() as Organization[];
}

export function getOrgsByStage(stage: PipelineStage): Organization[] {
  const db = getDb();
  return db.prepare('SELECT * FROM organizations WHERE stage = ? ORDER BY updated_at DESC').all(stage) as Organization[];
}

export function getOrgById(id: number): Organization | null {
  const db = getDb();
  return db.prepare('SELECT * FROM organizations WHERE id = ?').get(id) as Organization | undefined ?? null;
}

export function createOrg(data: Partial<Organization>): Organization {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO organizations (name, location, website, estimated_size, estimated_budget,
      mission_focus, why_fit, stage, keyword_category, signal_strength,
      leadership_signal_tier, leadership_signal_evidence, lat, lng, discovery_run_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.name ?? '',
    data.location ?? '',
    data.website ?? '',
    data.estimated_size ?? '',
    data.estimated_budget ?? '',
    data.mission_focus ?? '',
    data.why_fit ?? '',
    data.stage ?? 'identified',
    data.keyword_category ?? '',
    data.signal_strength ?? '',
    data.leadership_signal_tier ?? 'unknown',
    data.leadership_signal_evidence ?? '',
    data.lat ?? null,
    data.lng ?? null,
    data.discovery_run_id ?? null,
  );

  // Log initial stage transition
  db.prepare('INSERT INTO stage_transitions (organization_id, from_stage, to_stage) VALUES (?, NULL, ?)')
    .run(result.lastInsertRowid, data.stage ?? 'identified');

  return getOrgById(Number(result.lastInsertRowid))!;
}

export function updateOrg(id: number, data: Partial<Organization>): Organization | null {
  const db = getDb();
  const org = getOrgById(id);
  if (!org) return null;

  const stmt = db.prepare(`
    UPDATE organizations SET
      name = ?, location = ?, website = ?, estimated_size = ?,
      estimated_budget = ?, mission_focus = ?, why_fit = ?,
      keyword_category = ?, signal_strength = ?,
      leadership_signal_tier = ?, leadership_signal_evidence = ?,
      lat = ?, lng = ?, updated_at = datetime('now')
    WHERE id = ?
  `);
  stmt.run(
    data.name ?? org.name,
    data.location ?? org.location,
    data.website ?? org.website,
    data.estimated_size ?? org.estimated_size,
    data.estimated_budget ?? org.estimated_budget,
    data.mission_focus ?? org.mission_focus,
    data.why_fit ?? org.why_fit,
    data.keyword_category ?? org.keyword_category,
    data.signal_strength ?? org.signal_strength,
    data.leadership_signal_tier ?? org.leadership_signal_tier,
    data.leadership_signal_evidence ?? org.leadership_signal_evidence,
    data.lat ?? org.lat,
    data.lng ?? org.lng,
    id,
  );

  return getOrgById(id);
}

export function updateOrgStage(id: number, newStage: PipelineStage, note?: string): Organization | null {
  const db = getDb();
  const org = getOrgById(id);
  if (!org) return null;

  db.prepare('UPDATE organizations SET stage = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(newStage, id);

  db.prepare('INSERT INTO stage_transitions (organization_id, from_stage, to_stage, note) VALUES (?, ?, ?, ?)')
    .run(id, org.stage, newStage, note ?? '');

  // Auto-create follow-up reminder when outreach is sent
  if (newStage === 'outreach_sent') {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    db.prepare('INSERT INTO follow_up_reminders (organization_id, due_date, note) VALUES (?, ?, ?)')
      .run(id, dueDate.toISOString().split('T')[0], '14-day follow-up after outreach sent');
  }

  return getOrgById(id);
}

export function updateOrgCoordinates(id: number, lat: number, lng: number): Organization | null {
  const db = getDb();
  db.prepare('UPDATE organizations SET lat = ?, lng = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(lat, lng, id);
  return getOrgById(id);
}

export function deleteOrg(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM organizations WHERE id = ?').run(id);
  return result.changes > 0;
}
