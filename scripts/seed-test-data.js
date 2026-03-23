const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'climb10.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('Seeding test data...\n');

// Create tables if they don't exist (mirrors migrations.ts)
db.exec(`
  CREATE TABLE IF NOT EXISTS brief (
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
  );
  CREATE TABLE IF NOT EXISTS organizations (
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
    lat REAL,
    lng REAL,
    discovery_run_id INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (discovery_run_id) REFERENCES discovery_runs(id)
  );
  CREATE TABLE IF NOT EXISTS contacts (
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
  );
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL,
    type TEXT NOT NULL DEFAULT 'general',
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS outreach_drafts (
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
  );
  CREATE TABLE IF NOT EXISTS discovery_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brief_id INTEGER,
    query TEXT DEFAULT '',
    prompt_used TEXT DEFAULT '',
    raw_response TEXT DEFAULT '',
    results_json TEXT DEFAULT '[]',
    result_count INTEGER DEFAULT 0,
    orgs_added_to_pipeline INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (brief_id) REFERENCES brief(id)
  );
  CREATE TABLE IF NOT EXISTS stage_transitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL,
    from_stage TEXT,
    to_stage TEXT NOT NULL,
    note TEXT DEFAULT '',
    transitioned_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS follow_up_reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL,
    due_date TEXT NOT NULL,
    note TEXT DEFAULT '',
    is_complete INTEGER DEFAULT 0,
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
  );
`);
console.log('Schema created');

// 1. Create the Brief
db.prepare(`DELETE FROM brief WHERE id = 1`).run();
db.prepare(`
  INSERT INTO brief (id, geography, radius_miles, placement_start, placement_duration_weeks,
    focus_areas, leadership_problems, non_negotiables, advisor_bio_summary, win_win_win_criteria)
  VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  'Halifax, Nova Scotia, Canada',
  15,
  '2026-06-01', '6-8',
  JSON.stringify(['Ocean health', 'Ocean economy', 'Ocean technology', 'Ocean infrastructure', 'Blue economy']),
  JSON.stringify(['Stuck partnerships', 'Alignment issues', 'Truth-telling gaps', 'Decision-making bottlenecks', 'Cross-sector complexity', 'Founder-to-CEO transitions', 'Scaling culture during hypergrowth']),
  JSON.stringify(['No single-species operations (salmon-only, lobster-only, etc.)', 'No freshwater organizations', 'Must have genuine ocean/marine focus']),
  'Nearly 20 years helping tech executives create happier teams, aligned outcomes, and stronger ROI. Now transitioning to ocean conservation / blue economy leadership advisory. Specializes in: stuck partnerships, alignment issues, truth-telling gaps, strategic knots. Works best 1:1 with senior leaders or with top teams on defined missions.',
  'Value for the organization, positive ocean outcomes, community benefits'
);
console.log('Brief created');

// 2. Create test organizations at various pipeline stages
const orgs = [
  {
    name: 'Clearwater Seafoods',
    location: 'Halifax, Nova Scotia',
    website: 'https://clearwater.ca',
    estimated_size: '250',
    estimated_budget: '$500M',
    mission_focus: 'Premium multi-species ocean harvest company with vertically integrated operations across lobster, scallops, clams, shrimp, and crab. Joint ownership with Mi\'kmaq coalition. One of North America\'s largest ocean product companies.',
    why_fit: 'The Mi\'kmaq-Clearwater partnership is a groundbreaking Indigenous-corporate joint venture. Multi-species ocean operations at massive scale, navigating shared governance across very different organizational cultures — exactly the "stuck partnership" Leslie solves.',
    stage: 'meeting_scheduled',
    keyword_category: 'sector',
    signal_strength: 'high',
    leadership_signal_tier: 'confirmed',
    leadership_signal_evidence: 'The 2021 Mi\'kmaq coalition acquisition created a joint governance structure between Indigenous and corporate leadership. Public reporting indicates ongoing cultural integration and decision-making alignment challenges.',
    lat: 44.6488,
    lng: -63.5752,
  },
  {
    name: 'Dartmouth Ocean Technologies (DOT)',
    location: 'Dartmouth, Nova Scotia',
    website: 'https://dartmouthocean.com',
    estimated_size: '45',
    estimated_budget: '$25M',
    mission_focus: 'Ocean technology company developing underwater sensing, ocean monitoring platforms, and ocean data systems for commercial and defense clients worldwide.',
    why_fit: 'DOT is scaling from a niche sensor company into a full ocean data platform. Rapid growth, international expansion, and the pivot from hardware to SaaS creates leadership alignment challenges ideal for Leslie\'s advisory.',
    stage: 'outreach_sent',
    keyword_category: 'sci',
    signal_strength: 'high',
    leadership_signal_tier: 'inferred',
    leadership_signal_evidence: 'Organizational profile strongly implies a business model transition (hardware to SaaS) and rapid scaling — both patterns that typically create founder-to-CEO transition challenges and team alignment issues.',
    lat: 44.6712,
    lng: -63.5722,
  },
  {
    name: 'Maerospace (COVE Member)',
    location: 'Halifax, Nova Scotia',
    website: 'https://maerospace.com',
    estimated_size: '35',
    estimated_budget: '$20M',
    mission_focus: 'Commercial ocean intelligence company using satellite, drone, and AI to provide ocean monitoring, maritime domain awareness, and environmental surveillance across entire ocean basins.',
    why_fit: 'Ocean-wide platform company serving the full marine sector. Growing fast through defense and commercial contracts. Transitioning from founder-led to scaled operations — a classic inflection point where external advisory is most valuable.',
    stage: 'identified',
    keyword_category: 'sci',
    signal_strength: 'strong',
    leadership_signal_tier: 'inferred',
    leadership_signal_evidence: 'Fast-growing ocean intelligence startup transitioning from founder-led to scaled operations. Recent defense contract wins suggest increasing organizational complexity.',
    lat: 44.6476,
    lng: -63.5728,
  },
  {
    name: 'Kraken Robotics',
    location: 'Dartmouth, Nova Scotia',
    website: 'https://krakenrobotics.com',
    estimated_size: '300',
    estimated_budget: '$80M',
    mission_focus: 'Publicly traded ocean technology company providing underwater robotics (AUVs/ROVs), sonar systems, ocean batteries, and subsea sensors for defense, commercial, and environmental applications.',
    why_fit: 'Kraken is in hypergrowth — revenue tripled in 2 years, rapid hiring, multiple acquisitions. A public company navigating the transition from startup culture to institutional operations. Cross-sector complexity (defense + commercial + environmental) creates alignment challenges.',
    stage: 'outreach_pending',
    keyword_category: 'sci',
    signal_strength: 'high',
    leadership_signal_tier: 'confirmed',
    leadership_signal_evidence: 'Publicly reported: revenue tripled from $25M to $80M+ in 2 years. Multiple acquisitions (PanGeo Subsea, 13th Group). TSX-V listed (PNG). Board expansion and executive hiring indicate scaling culture challenges.',
    lat: 44.6654,
    lng: -63.5668,
  },
  {
    name: 'Nova Scotia Fisheries & Ocean Infrastructure Corp',
    location: 'Halifax, Nova Scotia',
    website: 'https://nsfoi.ca',
    estimated_size: '120',
    estimated_budget: '$45M',
    mission_focus: 'Crown corporation operating at intersection of government mandate and commercial fisheries. Port systems, ocean monitoring networks, and marine facility construction across Atlantic Canada.',
    why_fit: 'Building ocean infrastructure at scale requires navigating government contracts, private partnerships, and community stakeholders simultaneously. Classic cross-sector complexity with multiple stuck partnerships that need alignment.',
    stage: 'conversation_started',
    keyword_category: 'infra',
    signal_strength: 'strong',
    leadership_signal_tier: 'inferred',
    leadership_signal_evidence: 'Crown corporation with dual accountability to government mandate and commercial operations. This structure typically produces political-operational tension and truth-telling gaps.',
    lat: 44.6488,
    lng: -63.5752,
  },
  {
    name: 'Oceana Canada',
    location: 'Halifax, Nova Scotia',
    website: 'https://oceana.ca',
    estimated_size: '45',
    estimated_budget: '$25M',
    mission_focus: 'Ocean advocacy and policy organization focused on restoring Canadian oceans through science-based campaigns. Part of global Oceana network protecting the world\'s oceans.',
    why_fit: 'Large ocean-focused organization with $25M+ budget. Navigating complex multi-stakeholder campaigns across federal/provincial government, fishing industry, and Indigenous communities. Cross-sector alignment challenges are exactly where Leslie adds value.',
    stage: 'identified',
    keyword_category: 'gov',
    signal_strength: 'strong',
    leadership_signal_tier: 'unknown',
    leadership_signal_evidence: 'Insufficient public data to assess leadership challenges. Recommend direct outreach to verify organizational context before pursuing.',
    lat: 44.6488,
    lng: -63.5852,
  },
];

const insertOrg = db.prepare(`
  INSERT INTO organizations (name, location, website, estimated_size, estimated_budget,
    mission_focus, why_fit, stage, keyword_category, signal_strength,
    leadership_signal_tier, leadership_signal_evidence, lat, lng)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertTransition = db.prepare(`
  INSERT INTO stage_transitions (organization_id, from_stage, to_stage, transitioned_at)
  VALUES (?, ?, ?, datetime('now', ?))
`);

const orgIds = {};
for (const org of orgs) {
  const result = insertOrg.run(
    org.name, org.location, org.website, org.estimated_size,
    org.estimated_budget, org.mission_focus, org.why_fit, org.stage,
    org.keyword_category, org.signal_strength,
    org.leadership_signal_tier, org.leadership_signal_evidence,
    org.lat, org.lng
  );
  orgIds[org.name] = Number(result.lastInsertRowid);
  insertTransition.run(Number(result.lastInsertRowid), null, 'identified', '-10 days');
  if (org.stage !== 'identified') {
    insertTransition.run(Number(result.lastInsertRowid), 'identified', org.stage, '-3 days');
  }
  console.log(`  Org: ${org.name} [${org.stage}] — ${org.leadership_signal_tier} signal`);
}

// 3. Add contacts (PodTechs format)
const insertContact = db.prepare(`
  INSERT INTO contacts (organization_id, contact_name, contact_email, contact_position,
    contact_linkedin, contact_bio, review_status, host_producer_notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const contacts = [
  { org: 'Clearwater Seafoods', contact_name: 'Ian Smith', contact_position: 'CEO', contact_email: 'ismith@clearwater.ca', contact_linkedin: 'https://linkedin.com/in/iansmith-clearwater', contact_bio: 'Leads Clearwater through its historic Mi\'kmaq partnership transition. Previously in senior roles at major seafood companies.', review_status: 'Lead for Business', host_producer_notes: 'Strong fit — $500M budget, cross-cultural governance challenge is core Leslie territory. Meeting scheduled.' },
  { org: 'Clearwater Seafoods', contact_name: 'Chief Terry Paul', contact_position: 'Membertou First Nation Chief & Co-owner', contact_email: '', contact_linkedin: '', contact_bio: 'Chief of Membertou First Nation, led the Mi\'kmaq coalition that acquired majority stake in Clearwater.', review_status: 'Lead for Review', host_producer_notes: 'Key stakeholder in the partnership governance. Should be part of any advisory conversation.' },
  { org: 'Dartmouth Ocean Technologies (DOT)', contact_name: 'James Chicken', contact_position: 'CEO & Co-Founder', contact_email: 'jchicken@dartmouthocean.com', contact_linkedin: 'https://linkedin.com/in/jameschicken', contact_bio: 'Founded DOT to commercialize underwater sensing technology. Now leading the hardware-to-SaaS pivot.', review_status: 'Lead for Business', host_producer_notes: 'Active COVE member, open to advisory conversations. Hardware-to-SaaS pivot is textbook Leslie territory.' },
  { org: 'Maerospace (COVE Member)', contact_name: 'John Makris', contact_position: 'CEO', contact_email: 'jmakris@maerospace.com', contact_linkedin: 'https://linkedin.com/in/johnmakris', contact_bio: 'Founder-CEO of Maerospace, building ocean intelligence platform from satellite and AI.', review_status: 'Lead for Review', host_producer_notes: 'Founder-led scaling — right stage for advisory but needs outreach to assess leadership openness.' },
  { org: 'Kraken Robotics', contact_name: 'Karl Kenny', contact_position: 'President & CEO', contact_email: 'kkenny@krakenrobotics.com', contact_linkedin: 'https://linkedin.com/in/karlkenny', contact_bio: 'Founded Kraken Robotics, led it through IPO and rapid growth to 300+ employees and $80M+ revenue.', review_status: 'Lead for Business', host_producer_notes: 'Mutual connection via COVE. Hypergrowth public company — scaling culture and acquisition integration are immediate needs.' },
  { org: 'Kraken Robotics', contact_name: 'Sean Foy', contact_position: 'CFO', contact_email: 'sfoy@krakenrobotics.com', contact_linkedin: '', contact_bio: 'CFO responsible for financial strategy during Kraken\'s rapid growth phase.', review_status: 'Lead for Review', host_producer_notes: 'Secondary contact — Karl Kenny is the primary.' },
  { org: 'Nova Scotia Fisheries & Ocean Infrastructure Corp', contact_name: 'Sarah Mitchell', contact_position: 'VP Operations', contact_email: 'smitchell@nsfoi.ca', contact_linkedin: '', contact_bio: 'Leads operations across port infrastructure and marine facility construction projects.', review_status: 'Lead for Review', host_producer_notes: 'Crown corp — VP Operations is good initial contact. May need to reach CEO for advisory conversation.' },
];

const contactIds = {};
for (const c of contacts) {
  const result = insertContact.run(orgIds[c.org], c.contact_name, c.contact_email, c.contact_position, c.contact_linkedin, c.contact_bio, c.review_status, c.host_producer_notes);
  contactIds[`${c.org}_${c.contact_name}`] = Number(result.lastInsertRowid);
}
console.log(`\n${contacts.length} contacts added`);

// 4. Add notes
const insertNote = db.prepare(`
  INSERT INTO notes (organization_id, type, content, created_at)
  VALUES (?, ?, ?, datetime('now', ?))
`);

const notes = [
  { org: 'Clearwater Seafoods', type: 'qualification', content: 'The Clearwater-Mi\'kmaq partnership is genuinely groundbreaking. $1B acquisition in 2021. Multi-species ocean operations (lobster, scallops, clams, shrimp, crab) at $500M+ revenue. Both parties navigating shared governance across very different organizational cultures — exactly the "stuck partnership" Leslie solves.', offset: '-8 days' },
  { org: 'Clearwater Seafoods', type: 'general', content: 'Initial conversation with Ian Smith was promising. He acknowledged that the partnership governance model is "still being figured out" and that external perspective could be valuable. Wants to discuss with the board before committing.', offset: '-2 days' },
  { org: 'Clearwater Seafoods', type: 'call_note', content: 'Meeting scheduled for June 2nd with Ian Smith and Chief Terry Paul. Focus: exploring how external leadership advisory could help navigate the Indigenous-corporate governance challenges.', offset: '-1 days' },
  { org: 'Dartmouth Ocean Technologies (DOT)', type: 'qualification', content: 'DOT is pivoting from pure hardware (ocean sensors) to a full ocean data platform (SaaS). Revenue growing but team scaling is creating founder-to-CEO transition challenges. $25M annual revenue, 45 people.', offset: '-6 days' },
  { org: 'Kraken Robotics', type: 'qualification', content: 'Publicly traded (TSX: PNG). Revenue tripled from $25M to $80M+ in 2 years. Multiple acquisitions (PanGeo Subsea, 13th Group). Hypergrowth creating integration challenges across defense, commercial, and environmental business lines. Ocean-wide platform company.', offset: '-5 days' },
  { org: 'Kraken Robotics', type: 'general', content: 'Karl Kenny (CEO) is a mutual connection through COVE. Known to be receptive to external advisory, especially around scaling culture and integrating acquisitions. The defense-to-commercial balance is a strategic alignment challenge.', offset: '-3 days' },
  { org: 'Maerospace (COVE Member)', type: 'qualification', content: 'Ocean intelligence company using satellite/drone/AI for ocean-wide monitoring. Growing fast through defense and commercial contracts. Founder-led, transitioning to scaled operations. COVE member, connected to Halifax ocean ecosystem.', offset: '-4 days' },
  { org: 'Nova Scotia Fisheries & Ocean Infrastructure Corp', type: 'qualification', content: 'Crown corporation — ports, monitoring networks, marine construction. $45M revenue, 120 people. Navigating government contracts + private partnerships + community stakeholders simultaneously. Classic cross-sector complexity.', offset: '-3 days' },
  { org: 'Oceana Canada', type: 'qualification', content: 'Part of global Oceana network. $25M+ budget. Runs complex ocean policy campaigns requiring coordination across government, industry, and Indigenous stakeholders. Potential leadership advisory need around campaign alignment and stakeholder management.', offset: '-5 days' },
];

for (const n of notes) {
  insertNote.run(orgIds[n.org], n.type, n.content, n.offset);
}
console.log(`${notes.length} notes added`);

// 5. Add outreach draft for DOT
const dotContactId = contactIds['Dartmouth Ocean Technologies (DOT)_James Chicken'];
db.prepare(`
  INSERT INTO outreach_drafts (organization_id, contact_id, subject_line, body, status, sent_at, created_at)
  VALUES (?, ?, ?, ?, 'sent', datetime('now', '-4 days'), datetime('now', '-4 days'))
`).run(
  orgIds['Dartmouth Ocean Technologies (DOT)'],
  dotContactId,
  'A colleague I\'d love to introduce — leadership advisory for ocean tech scaling',
  `Hi James,

I hope this finds you well. I've been following DOT's evolution from ocean sensors into a full ocean data platform — it's exactly the kind of bold pivot that reshapes an industry.

I'm reaching out because I'd love to introduce you to my colleague Leslie, who I think could be a genuinely valuable resource for DOT at this stage of your growth.

Leslie has spent nearly twenty years helping tech executives navigate the founder-to-CEO transition, create aligned teams, and scale operations without losing the culture that made the company special. She's now bringing that same discipline to the blue economy, and she's looking for one ocean company to work with intensively this summer.

What she's offering is a condensed senior advisory engagement — 6 to 8 weeks, the equivalent of a year-long coaching engagement compressed into the summer. She specializes in exactly the kind of hardware-to-SaaS pivot and team scaling challenges DOT is navigating right now.

Would you be open to a 30-minute call to explore whether there's a fit?

Warm regards,
Karl`
);
console.log('1 outreach draft added (DOT - sent)');

// 6. Add follow-up reminders
db.prepare(`
  INSERT INTO follow_up_reminders (organization_id, due_date, note)
  VALUES (?, date('now', '+3 days'), ?)
`).run(orgIds['Dartmouth Ocean Technologies (DOT)'], 'No response after 2 weeks — send follow-up or try alternate contact through COVE');

db.prepare(`
  INSERT INTO follow_up_reminders (organization_id, due_date, note)
  VALUES (?, date('now'), ?)
`).run(orgIds['Clearwater Seafoods'], 'Prepare briefing note for meeting with Ian Smith & Chief Terry Paul on June 2nd');

console.log('2 reminders added');

// 7. Create a discovery run record
db.prepare(`
  INSERT INTO discovery_runs (brief_id, query, results_json, result_count, created_at)
  VALUES (?, ?, ?, ?, datetime('now', '-10 days'))
`).run(
  1,
  'ocean technology ocean infrastructure blue economy organizations Halifax Nova Scotia',
  JSON.stringify(orgs.slice(0, 5).map(o => ({
    name: o.name, location: o.location, website: o.website,
    estimated_size: o.estimated_size, estimated_budget: o.estimated_budget,
    mission_focus: o.mission_focus, why_fit: o.why_fit,
    keyword_category: o.keyword_category, signal_strength: o.signal_strength,
    leadership_signal_tier: o.leadership_signal_tier,
  }))),
  5
);
console.log('1 discovery run record added');

console.log('\n--- Test data seeded successfully! ---');
console.log(`\nSummary:`);
console.log(`  1 Brief (Leslie's criteria — all org types, no budget hard filter)`);
console.log(`  ${orgs.length} Organizations across pipeline stages (with signal tiers + keyword categories)`);
console.log(`  ${contacts.length} Contacts (PodTechs format with review status)`);
console.log(`  ${notes.length} Notes`);
console.log(`  1 Outreach draft (sent)`);
console.log(`  2 Follow-up reminders`);
console.log(`  1 Discovery run history`);

db.close();
