/**
 * Import Leslie's spreadsheet into Turso DB.
 *
 * Usage:
 *   npx tsx scripts/import-spreadsheet.ts path/to/spreadsheet.xlsx
 *
 * Reads three sheets:
 *   - PRIMARY OCEAN ORGANIZATIONS → keyword_category auto-assigned
 *   - DONORS WITH OCEAN INTEREST → keyword_category = 'donor'
 *   - Impact Investors in Ocean → keyword_category = 'investor'
 *
 * Requires TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env.local or environment.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import * as XLSX from 'xlsx';
import { createClient } from '@libsql/client';

// Load .env.local if present
const envPath = resolve(__dirname, '..', '.env.local');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// --- Category classifier ---

function classifyCategory(text: string): string {
  const lower = (text || '').toLowerCase();

  // Order matters — more specific checks first
  if (/aquaculture|seafood|algae|seaweed|mariculture|blue food|fisheries|fish farming/.test(lower)) return 'food';
  if (/conservation|marine protected|endangered|wildlife|habitat|restoration|stewardship|coral reef/.test(lower)) return 'cons';
  if (/technology|robotics|auv|rov|sonar|acoustic|sensor|data|ai|mapping|imaging/.test(lower)) return 'sci';
  if (/port|shipping|infrastructure|shipbuilding|naval|offshore|engineering|cable|pipeline/.test(lower)) return 'infra';
  if (/policy|governance|regulation|management|government|federal|noaa|epa|ministry|commission/.test(lower)) return 'gov';
  if (/economy|finance|commerce|investment|fund|venture|accelerator/.test(lower)) return 'econ';
  return 'sector'; // default
}

// --- Fetch existing orgs for dedup ---

async function getExistingOrgNames(): Promise<Set<string>> {
  const result = await db.execute('SELECT name FROM organizations');
  return new Set(result.rows.map(r => (r.name as string).toLowerCase().trim()));
}

// --- Parse helpers ---

function clean(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

// --- Sheet parsers ---

interface OrgImport {
  name: string;
  focus: string;
  description: string;
  programAvenue: string;
  website: string;
  location: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  contactEmail: string;
  leader1: string;
  personalEmail1: string;
  leader2: string;
  personalEmail2: string;
  leader3: string;
  personalEmail3: string;
  whySpecial: string;
  whyFit: string;
  notes: string;
  keyword_category: string;
  source: string;
}

function parsePrimaryOrgs(wb: XLSX.WorkBook): OrgImport[] {
  const sheet = wb.Sheets['PRIMARY OCEAN ORGANIZATIONS'];
  if (!sheet) { console.log('Sheet "PRIMARY OCEAN ORGANIZATIONS" not found'); return []; }

  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' });
  const orgs: OrgImport[] = [];

  // Data starts at row 4 (index 3) — rows 0-3 are headers
  // Columns: 0=Org, 1=Focus, 2=Description, 3=ProgramAvenue, 4=Website,
  //   5=Location, 6=Address, 7=City, 8=State, 9=Zip, 10=Country,
  //   11=ContactEmail, 12=Leader1, 13=PersonalEmail1, 14=Leader2,
  //   15=PersonalEmail2, 16=Leader3, 17=PersonalEmail3,
  //   18=WhySpecial, 19=WhyFit, 20=Notes
  for (let i = 4; i < rows.length; i++) {
    const r = rows[i];
    const name = clean(r[0]);
    if (!name || name === 'Organization') continue;

    const focus = clean(r[1]);
    const description = clean(r[2]);
    const missionText = [focus, description].filter(Boolean).join('. ');

    orgs.push({
      name,
      focus,
      description,
      programAvenue: clean(r[3]),
      website: clean(r[4]),
      location: clean(r[5]),
      address: clean(r[6]),
      city: clean(r[7]),
      state: clean(r[8]),
      zip: clean(r[9]),
      country: clean(r[10]),
      contactEmail: clean(r[11]),
      leader1: clean(r[12]),
      personalEmail1: clean(r[13]),
      leader2: clean(r[14]),
      personalEmail2: clean(r[15]),
      leader3: clean(r[16]),
      personalEmail3: clean(r[17]),
      whySpecial: clean(r[18]),
      whyFit: clean(r[19]),
      notes: clean(r[20]),
      keyword_category: classifyCategory(missionText + ' ' + name),
      source: 'spreadsheet_import',
    });
  }
  return orgs;
}

function parseDonors(wb: XLSX.WorkBook): OrgImport[] {
  const sheet = wb.Sheets['DONORS WITH OCEAN INTEREST'];
  if (!sheet) { console.log('Sheet "DONORS WITH OCEAN INTEREST" not found'); return []; }

  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' });
  const orgs: OrgImport[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const name = clean(r[0]);
    if (!name) continue;

    orgs.push({
      name,
      focus: clean(r[1]),
      description: clean(r[2]),
      programAvenue: clean(r[3]),
      website: clean(r[4]),
      location: clean(r[5]),
      address: '', city: '', state: '', zip: '', country: '',
      contactEmail: clean(r[6]),
      leader1: clean(r[7]),
      personalEmail1: clean(r[8]),
      leader2: clean(r[9]),
      personalEmail2: clean(r[10]),
      leader3: clean(r[11]),
      personalEmail3: clean(r[12]),
      whySpecial: clean(r[13]),
      whyFit: clean(r[14]),
      notes: clean(r[15]),
      keyword_category: 'donor',
      source: 'spreadsheet_import',
    });
  }
  return orgs;
}

function parseInvestors(wb: XLSX.WorkBook): OrgImport[] {
  const sheet = wb.Sheets['Impact Investors in Ocean'];
  if (!sheet) { console.log('Sheet "Impact Investors in Ocean" not found'); return []; }

  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' });
  const orgs: OrgImport[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const name = clean(r[0]);
    if (!name || name === 'Halifax') continue; // Skip section headers

    orgs.push({
      name,
      focus: '',
      description: '',
      programAvenue: '',
      website: clean(r[1]),
      location: '',
      address: '', city: '', state: '', zip: '', country: '',
      contactEmail: '',
      leader1: clean(r[2]),
      personalEmail1: '',
      leader2: '',
      personalEmail2: '',
      leader3: '',
      personalEmail3: '',
      whySpecial: '',
      whyFit: '',
      notes: clean(r[3]),
      keyword_category: 'investor',
      source: 'spreadsheet_import',
    });
  }
  return orgs;
}

// --- Insert logic ---

async function insertOrg(org: OrgImport, existingNames: Set<string>): Promise<'inserted' | 'skipped' | 'error'> {
  const nameLower = org.name.toLowerCase().trim();

  // Dedup check
  for (const existing of existingNames) {
    if (existing === nameLower || existing.includes(nameLower) || nameLower.includes(existing)) {
      return 'skipped';
    }
  }

  try {
    const missionFocus = [org.focus, org.description].filter(Boolean).join('. ');
    const whyFit = [org.whySpecial, org.whyFit].filter(Boolean).join('. ');

    // Build location from address parts if not already set
    const location = org.location || [org.city, org.state, org.country].filter(Boolean).join(', ');

    const result = await db.execute({
      sql: `INSERT INTO organizations (name, location, website, estimated_size, estimated_budget,
        mission_focus, why_fit, stage, keyword_category, signal_strength,
        leadership_signal_tier, leadership_signal_evidence,
        address, city, state, zip, country,
        lat, lng, discovery_run_id, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        org.name, location, org.website,
        '', '', // estimated_size, estimated_budget
        missionFocus, whyFit,
        'identified', org.keyword_category,
        '', 'unknown', '', // signal_strength, leadership_signal_tier, evidence
        org.address, org.city, org.state, org.zip, org.country,
        null, null, null, // lat, lng, discovery_run_id
        org.source,
      ],
    });

    const orgId = result.lastInsertRowid!;
    existingNames.add(nameLower);

    // Insert stage transition
    await db.execute({
      sql: 'INSERT INTO stage_transitions (organization_id, from_stage, to_stage) VALUES (?, NULL, ?)',
      args: [orgId, 'identified'],
    });

    // Insert contacts (leader 1, 2, 3)
    const leaders = [
      { name: org.leader1, email: org.personalEmail1 || org.contactEmail },
      { name: org.leader2, email: org.personalEmail2 },
      { name: org.leader3, email: org.personalEmail3 },
    ];
    for (const leader of leaders) {
      if (!leader.name) continue;
      await db.execute({
        sql: `INSERT INTO contacts (organization_id, contact_name, contact_email, contact_position, review_status)
          VALUES (?, ?, ?, ?, ?)`,
        args: [orgId, leader.name, leader.email, '', 'Pending Review'],
      });
    }

    // Insert notes if any
    if (org.notes) {
      await db.execute({
        sql: 'INSERT INTO notes (organization_id, type, content) VALUES (?, ?, ?)',
        args: [orgId, 'general', org.notes],
      });
    }
    if (org.programAvenue) {
      await db.execute({
        sql: 'INSERT INTO notes (organization_id, type, content) VALUES (?, ?, ?)',
        args: [orgId, 'general', `Program Avenue: ${org.programAvenue}`],
      });
    }

    return 'inserted';
  } catch (err) {
    console.error(`  Error inserting "${org.name}":`, (err as Error).message);
    return 'error';
  }
}

// --- Main ---

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: npx tsx scripts/import-spreadsheet.ts <path-to-spreadsheet.xlsx>');
    process.exit(1);
  }

  const absPath = resolve(filePath);
  if (!existsSync(absPath)) {
    console.error(`File not found: ${absPath}`);
    process.exit(1);
  }

  console.log(`Reading: ${absPath}`);
  const wb = XLSX.readFile(absPath);

  // Ensure columns exist
  for (const col of ['source', 'address', 'city', 'state', 'zip', 'country']) {
    try {
      const def = col === 'source' ? "'ai_discovery'" : "''";
      await db.execute(`ALTER TABLE organizations ADD COLUMN ${col} TEXT DEFAULT ${def}`);
      console.log(`Added ${col} column`);
    } catch { /* already exists */ }
  }

  const existingNames = await getExistingOrgNames();
  console.log(`Existing orgs in DB: ${existingNames.size}`);

  // Parse all sheets
  const primaryOrgs = parsePrimaryOrgs(wb);
  const donors = parseDonors(wb);
  const investors = parseInvestors(wb);

  console.log(`\nParsed from spreadsheet:`);
  console.log(`  Primary Ocean Orgs: ${primaryOrgs.length}`);
  console.log(`  Donors: ${donors.length}`);
  console.log(`  Investors: ${investors.length}`);

  const allOrgs = [...primaryOrgs, ...donors, ...investors];
  let inserted = 0, skipped = 0, errors = 0;

  console.log(`\nImporting ${allOrgs.length} organizations...`);

  for (const org of allOrgs) {
    const result = await insertOrg(org, existingNames);
    if (result === 'inserted') {
      inserted++;
      console.log(`  + ${org.name} [${org.keyword_category}]`);
    } else if (result === 'skipped') {
      skipped++;
      console.log(`  ~ ${org.name} (duplicate, skipped)`);
    } else {
      errors++;
    }
  }

  console.log(`\n=== Import Complete ===`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped (duplicates): ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Total in DB: ${existingNames.size}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
