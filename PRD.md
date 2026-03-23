# Climb10 — Product Requirements Document (PRD)

**Version:** 1.0
**Date:** March 20, 2026
**Status:** Final (reflects current build state)

---

## 1. Product Overview

**Climb10** is an agentic advisory placement platform that helps Leslie, a senior leadership advisor transitioning from tech to the ocean/blue economy sector, systematically discover, qualify, and engage ocean-focused organizations for a 6-8 week Entrepreneurship in Residence placement in Halifax, Nova Scotia (June-August 2026).

The platform uses Google Gemini AI with built-in web search grounding to find real organizations, generate personalized outreach, and prepare pre-meeting briefings — replacing weeks of manual research with an intelligent, structured pipeline.

---

## 2. User Profile

**Primary User:** Leslie
- Nearly 20 years advising tech executives on leadership, partnerships, and strategic alignment
- Pivoting into ocean conservation / blue economy leadership advisory
- Specializes in: stuck partnerships, alignment issues, truth-telling gaps, decision-making bottlenecks, founder-to-CEO transitions, scaling culture during hypergrowth
- Looking for one intensive 6-8 week placement (equivalent of a year-long engagement compressed into summer 2026)
- Based in Halifax, Nova Scotia for the residency period

---

## 3. Core Workflow (6 Phases)

### Phase 1: Brief
Define placement criteria that drive all AI-powered discovery and outreach.

**Brief Fields:**
| Field | Default / Example |
|---|---|
| Geography | Halifax, Nova Scotia, Canada |
| Organization Size | 30-300 people |
| Annual Budget/Funding | $10M-$200M |
| Organization Type | All types (for-profit, non-profit, NGO, research, public-private) |
| Timing | June 1 - August 15, 2026 |
| Focus Areas | Ocean health, Ocean economy, Ocean technology, Ocean infrastructure, Blue economy |
| Leadership Problems | Stuck partnerships, Alignment issues, Truth-telling gaps, Decision-making bottlenecks, Cross-sector complexity, Founder-to-CEO transitions, Scaling culture during hypergrowth |
| Non-Negotiables | Minimum $10M annual ocean-related budget/funding/revenue; Ocean-focused only (not single marine species, not freshwater); Within 15 miles of Halifax; Genuine leadership commitment from the top |

**Single-record model:** The brief is a single row (id=1) that gets upserted on save.

---

### Phase 2: Discovery
AI-powered search for real ocean-focused organizations matching the brief.

**How It Works:**
1. User enters optional custom search query (or uses default brief-based search)
2. User sets geography radius (default 15 miles, quick buttons for 15/25/50 mi)
3. System calls Google Gemini 2.0 Flash with `google_search_retrieval` tool
4. AI returns 10-15 real organizations as structured JSON
5. System applies hard budget filter ($10M minimum) post-response
6. Results display as cards with organization + lead contact details
7. User clicks "Add to Pipeline" to move into qualification

**Discovery Criteria (Priority Order):**

| # | Criteria | Type |
|---|---|---|
| 1 | Minimum $10M annual ocean-related budget/funding/revenue | HARD FILTER (enforced in prompt AND post-response code) |
| 2 | All organization types welcome | Inclusive (for-profit, non-profit, NGO, research, public-private, B-corp, cooperative, Crown corporation) |
| 3 | Real, verifiable organizations only | Verification |
| 4 | Ocean technology, infrastructure, health, economy, or blue economy focus | Sector |
| 5 | Win-win-win outcomes (corporation + nature + communities) | Values |
| 6 | Leadership challenge signals (growth, partnerships, complexity, transitions) | Fit |

**Ocean Focus Filter:**
- INCLUDE: Ocean technology, ocean monitoring, ocean infrastructure, ocean conservation, blue economy, marine research, oceanographic institutions
- EXCLUDE: Single marine species (salmon-only, lobster, tuna, whale, sea turtle), freshwater organizations (lake, river), narrow "sea" branding without ocean mission

**Halifax Ocean Ecosystem Reference:**
The discovery prompt includes a curated reference of ~50+ known Nova Scotia ocean sector organizations (sourced from Halifax Partnership) organized by sector to help the AI cross-reference during search:

- **Ocean Technology & Science:** Kraken Robotics, Kongsberg Maritime Canada, GeoSpectrum Technologies, Innovasea, JASCO Applied Sciences, AML Oceanographic, Ultra Electronics Maritime Systems, General Dynamics Canada, Lockheed Martin Canada, metOcean Telematics, Fugro GeoSurveys, MacDonald Dettwiler & Associates (MDA), DSM Nutritional Products, Acadian Seaplants
- **Ocean Infrastructure & Energy:** Irving Shipbuilding, SBM Offshore, Babcock Canada, FORCE (Tidal Energy), ExxonMobil Canada, Shell Canada, SNC-Lavalin
- **Defence & Security (ocean-focused):** General Dynamics, Lockheed Martin, Ultra Electronics, CarteNav Solutions, Deep Vision Inc.
- **Transportation & Logistics:** Port of Halifax, Halterm Container Terminal, Atlantic Towing, Secunda Canada LP, Horizon Maritime, Oceanex
- **Fisheries & Aquaculture (broad ocean only):** High Liner Foods, Clearwater Seafoods
- **Education & Research:** Bedford Institute of Oceanography, Dalhousie University, DRDC Atlantic, National Research Council, COVE
- **Industry Networks:** OTCNS, Ocean Tracking Network, COINAtlantic, COVE

**Discovery Result Structure (per organization):**

```
ORGANIZATION FIELDS:
- name                  (exact real org name)
- location              (city, province or full address)
- website               (URL)
- estimated_size        (number of people)
- estimated_budget      (e.g. "$50M")
- mission_focus         (1-2 sentences)
- why_fit               (2-3 sentences tied to Leslie's brief)

LEAD CONTACT FIELDS:
- contact_name          (senior leader: CEO, ED, VP, Director)
- contact_email         (professional email)
- contact_position      (title)
- contact_linkedin      (URL, if findable)
- contact_bio           (1-2 sentences)
- review_status         ("Lead for Business" | "Lead for Review" | "Pending Review" | "Do NOT Contact")
- host_producer_notes   (brief assessment: fit quality, budget notes, concerns)
```

**Budget Parsing Logic:**
The system parses various budget formats into millions for filtering:
- "$50M" -> 50
- "$1.2B" -> 1200
- "$500K" -> 0.5
- "$20,000,000" -> 20

---

### Phase 3: Pipeline / Qualification (Kanban Board)
Drag-and-drop Kanban board to manage organizations through the placement funnel.

**Pipeline Stages:**

| Stage | Color | Description |
|---|---|---|
| Identified | Blue | Newly discovered, needs qualification |
| Outreach Pending | Amber | Qualified, ready for outreach drafting |
| Outreach Sent | Purple | Outreach email sent, waiting for response |
| Conversation Started | Teal | Reply received, dialogue underway |
| Meeting Scheduled | Indigo | Formal meeting booked |
| Residency Placed | Green | Placement confirmed |
| Not a Fit | Grey | Disqualified at any stage |

**Automated Behaviors:**
- Moving to "Outreach Sent" auto-creates a 14-day follow-up reminder
- All stage transitions are logged with timestamps for audit trail

**Organization Detail Page** (`/pipeline/[id]`):
Tabbed view with: Overview, Contacts, Notes, Outreach, Timeline

---

### Phase 4: Outreach Studio
AI-generated personalized outreach emails.

**Email Structure:**
1. **Opening:** Genuine acknowledgment of the organization's specific work
2. **Introduction:** Leslie introduced through the problem she solves (not as a job seeker)
3. **Value Proposition:** Condensed senior advisory engagement (6-8 weeks = 1 year equivalent), potentially donated or minimal cost
4. **The Ask:** Single clear ask — 30-minute exploratory conversation

**Tone:** Written in the connector's voice (warm, professional), not Leslie's voice. 250-350 words max. No salesy language.

**Context Inputs:**
- Mutual connections
- "Why now" timing rationale
- Additional context/notes

---

### Phase 5: Pre-Meeting Briefing
AI-generated briefing notes using fresh web search.

**Briefing Sections:**
1. Organization Background (overview + recent developments)
2. Leadership Signal (why they need advisory)
3. Key People (2-3 senior leaders Leslie may meet)
4. Recommended Meeting Ask (specific framing, not a pitch)
5. Talking Points (3-4 specific references to their work)
6. Watch For (red flags or things to monitor)

---

### Phase 6: Dashboard
Central overview of pipeline status and upcoming actions.

**Dashboard Components:**
- Quick Action cards (Brief, Discovery, Pipeline)
- Active follow-up reminders
- Pipeline Overview (visual bar chart of org counts by stage)
- Recent Activity feed (latest 8 stage transitions)

---

## 4. Data Model

### Database: SQLite (via better-sqlite3)

**Tables:**

| Table | Purpose | Key Fields |
|---|---|---|
| `brief` | Single advisory brief (id=1) | geography, org_size_min/max, budget_min/max, org_type, timing, focus_areas (JSON), leadership_problems (JSON), non_negotiables (JSON) |
| `organizations` | Pipeline entities | name, location, website, estimated_size, estimated_budget, mission_focus, why_fit, stage, confidence_rating, discovery_run_id |
| `contacts` | People per org | organization_id, name, title, email, linkedin_url, is_mutual_connection, notes |
| `notes` | Activity log per org | organization_id, type (qualification/outreach/meeting/general/follow_up), content |
| `outreach_drafts` | Email drafts | organization_id, draft_content, context, status (draft/finalized/sent) |
| `discovery_runs` | Search history | query, results_json, org_count |
| `stage_transitions` | Audit trail | organization_id, from_stage, to_stage, transitioned_at |
| `follow_up_reminders` | Action items | organization_id, reminder_date, reason, is_dismissed |

---

## 5. API Routes

| Method | Route | Purpose |
|---|---|---|
| GET/POST | `/api/brief` | Get or upsert the advisory brief |
| POST | `/api/discover` | Run AI-powered organization discovery |
| GET/POST | `/api/organizations` | List all orgs or create new org (with auto-contact + auto-note creation from lead fields) |
| PUT | `/api/organizations/[id]/stage` | Change pipeline stage (with transition logging + auto-reminders) |
| POST | `/api/organizations/[id]/outreach` | Generate AI outreach draft |
| POST | `/api/organizations/[id]/briefing` | Generate AI pre-meeting briefing |
| GET/POST/DELETE | `/api/organizations/[id]/contacts` | CRUD contacts for an org |
| GET/POST | `/api/organizations/[id]/notes` | CRUD notes for an org |

**Auto-Pipeline Integration (POST `/api/organizations`):**
When an org is added from Discovery with lead contact fields:
1. Organization record created
2. Contact auto-created from `contact_name`, `contact_email`, `contact_position`, `contact_linkedin`, `contact_bio`
3. Qualification note auto-created from `review_status` + `host_producer_notes`
4. Initial stage transition logged

---

## 6. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 + shadcn/ui components |
| Database | SQLite via better-sqlite3 |
| AI | Google Gemini 2.0 Flash (free tier) with Google Search grounding |
| AI SDK | `@google/generative-ai` |
| Drag & Drop | `@hello-pangea/dnd` for Kanban board |
| Icons | Lucide React |
| Validation | Zod |
| Font | Mulish (weights 300-800) |

**Brand Colors:**
- Primary: Deep plum (#4A0E4E)
- Accent: Ocean blues
- Neutral: Silver/grey

---

## 7. Environment Variables

| Variable | Purpose |
|---|---|
| `GOOGLE_GEMINI_API_KEY` | Gemini API key (free tier) |

---

## 8. Key Design Decisions

1. **All Organization Types:** The platform does NOT filter by for-profit/non-profit status. Any organization type is welcome as long as it meets the $10M ocean budget threshold.

2. **$10M Hard Budget Filter:** Enforced at two levels — in the AI prompt instructions AND in post-response code filtering. This ensures no organization below threshold enters the pipeline.

3. **Ocean-Only Focus:** Excludes single marine species orgs (salmon farms, lobster harvesters, sea turtle rescue), freshwater organizations, and narrow "sea" branding. The organization must work broadly across the ocean ecosystem.

4. **No Freshwater:** River conservation, lake research, and freshwater fisheries are explicitly excluded.

5. **Lead Contact Format:** Discovery results include PodTechs-style lead review fields (contact name, email, position, LinkedIn, bio, review status, host/producer notes) to streamline pipeline ingestion.

6. **Local-First Architecture:** SQLite database stored locally (`climb10.db`) for offline-capable, self-contained deployment. No external database dependencies.

7. **Single Brief Model:** One brief record drives all discovery and outreach. Simplifies the UX — Leslie has one set of criteria for her Halifax placement search.

8. **Halifax Ecosystem Reference:** The discovery prompt embeds a curated list of ~50+ known Nova Scotia ocean sector companies to help Gemini find real, relevant organizations.

---

## 9. Test Data (Seed Script)

The seed script (`scripts/seed-test-data.js`) creates schema and populates the database with representative test data:

| Organization | Budget | Stage | Key Signal |
|---|---|---|---|
| Clearwater Seafoods | $500M | meeting_scheduled | Mi'kmaq-corporate joint venture governance |
| Dartmouth Ocean Technologies (DOT) | $25M | outreach_sent | Hardware-to-SaaS pivot, founder-to-CEO transition |
| Maerospace (COVE Member) | $20M | identified | Ocean intelligence, founder-led scaling |
| Kraken Robotics | $80M | outreach_pending | Publicly traded, hypergrowth, multiple acquisitions |
| NS Fisheries & Ocean Infrastructure Corp | $45M | conversation_started | Cross-sector complexity (govt + private + community) |
| Oceana Canada | $25M | identified | Multi-stakeholder ocean policy campaigns |

Includes 7 contacts, 10 notes, 1 outreach draft (DOT), 2 follow-up reminders, and 1 discovery run history record.

---

## 10. Running the Application

```bash
# Prerequisites
Node.js v20 (v25 causes native module issues)
Google Gemini API key

# Setup
npm install
echo "GOOGLE_GEMINI_API_KEY=your-key" > .env.local

# Seed test data
node scripts/seed-test-data.js

# Run development server
npm run dev
```

**Node Version Note:** Node v25 causes `NODE_MODULE_VERSION` mismatch (141 vs 115) with better-sqlite3. Use Node v20:
```bash
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
npm rebuild better-sqlite3
rm -rf .next
```
