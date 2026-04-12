import type { Client } from '@libsql/client';

export async function runMigrations(db: Client) {
  await db.batch([
    `CREATE TABLE IF NOT EXISTS brief (
      id INTEGER PRIMARY KEY DEFAULT 1,
      geography TEXT DEFAULT 'Halifax, Nova Scotia',
      radius_miles INTEGER DEFAULT 15,
      budget_display_note TEXT,
      headcount_display_note TEXT,
      budget_preferred_min REAL,
      headcount_preferred_min INTEGER,
      placement_start TEXT DEFAULT '2026-06-01',
      placement_duration_weeks TEXT DEFAULT '6-8',
      focus_areas TEXT DEFAULT '[]',
      leadership_problems TEXT DEFAULT '[]',
      non_negotiables TEXT DEFAULT '[]',
      advisor_bio_summary TEXT DEFAULT '',
      win_win_win_criteria TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS discovery_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brief_id INTEGER,
      query TEXT DEFAULT '',
      prompt_used TEXT DEFAULT '',
      raw_response TEXT DEFAULT '',
      results_json TEXT DEFAULT '[]',
      result_count INTEGER DEFAULT 0,
      orgs_added_to_pipeline INTEGER DEFAULT 0,
      status TEXT DEFAULT 'complete',
      error TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (brief_id) REFERENCES brief(id)
    )`,
    `CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT DEFAULT '',
      website TEXT DEFAULT '',
      estimated_size TEXT DEFAULT '',
      estimated_budget TEXT DEFAULT '',
      mission_focus TEXT DEFAULT '',
      why_fit TEXT DEFAULT '',
      stage TEXT DEFAULT 'identified',
      keyword_category TEXT DEFAULT '',
      signal_strength TEXT DEFAULT '',
      leadership_signal_tier TEXT DEFAULT 'unknown',
      leadership_signal_evidence TEXT DEFAULT '',
      address TEXT DEFAULT '',
      city TEXT DEFAULT '',
      state TEXT DEFAULT '',
      zip TEXT DEFAULT '',
      country TEXT DEFAULT '',
      lat REAL,
      lng REAL,
      discovery_run_id INTEGER,
      source TEXT DEFAULT 'ai_discovery',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (discovery_run_id) REFERENCES discovery_runs(id)
    )`,
    `CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id INTEGER NOT NULL,
      contact_name TEXT NOT NULL,
      contact_email TEXT DEFAULT '',
      contact_position TEXT DEFAULT '',
      contact_linkedin TEXT DEFAULT '',
      contact_bio TEXT DEFAULT '',
      review_status TEXT DEFAULT 'Pending Review',
      host_producer_notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'general',
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS outreach_drafts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id INTEGER NOT NULL,
      contact_id INTEGER,
      subject_line TEXT DEFAULT '',
      body TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      sent_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id) REFERENCES contacts(id)
    )`,
    `CREATE TABLE IF NOT EXISTS stage_transitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id INTEGER NOT NULL,
      from_stage TEXT,
      to_stage TEXT NOT NULL,
      note TEXT DEFAULT '',
      transitioned_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS follow_up_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id INTEGER NOT NULL,
      due_date TEXT NOT NULL,
      note TEXT DEFAULT '',
      is_complete INTEGER DEFAULT 0,
      completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    )`,
  ], 'write');

  // Add status column to existing discovery_runs tables (idempotent)
  try {
    await db.execute(`ALTER TABLE discovery_runs ADD COLUMN status TEXT DEFAULT 'complete'`);
  } catch {
    // Column already exists — ignore
  }
  try {
    await db.execute(`ALTER TABLE discovery_runs ADD COLUMN error TEXT DEFAULT ''`);
  } catch {
    // Column already exists — ignore
  }
  // Add source column to organizations (idempotent)
  try {
    await db.execute(`ALTER TABLE organizations ADD COLUMN source TEXT DEFAULT 'ai_discovery'`);
  } catch { /* already exists */ }
  // Add address fields to organizations (idempotent)
  for (const col of ['address', 'city', 'state', 'zip', 'country']) {
    try {
      await db.execute(`ALTER TABLE organizations ADD COLUMN ${col} TEXT DEFAULT ''`);
    } catch { /* already exists */ }
  }
}
