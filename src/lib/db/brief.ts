import { getDb } from '../db';
import type { Brief } from './types';

export function getBrief(): Brief | null {
  const db = getDb();
  return db.prepare('SELECT * FROM brief WHERE id = 1').get() as Brief | undefined ?? null;
}

export function upsertBrief(data: Partial<Brief>): Brief {
  const db = getDb();
  const existing = getBrief();

  if (existing) {
    const stmt = db.prepare(`
      UPDATE brief SET
        geography = ?, radius_miles = ?,
        budget_display_note = ?, headcount_display_note = ?,
        budget_preferred_min = ?, headcount_preferred_min = ?,
        placement_start = ?, placement_duration_weeks = ?,
        focus_areas = ?, leadership_problems = ?,
        non_negotiables = ?, advisor_bio_summary = ?,
        win_win_win_criteria = ?, updated_at = datetime('now')
      WHERE id = 1
    `);
    stmt.run(
      data.geography ?? existing.geography,
      data.radius_miles ?? existing.radius_miles,
      data.budget_display_note ?? existing.budget_display_note,
      data.headcount_display_note ?? existing.headcount_display_note,
      data.budget_preferred_min ?? existing.budget_preferred_min,
      data.headcount_preferred_min ?? existing.headcount_preferred_min,
      data.placement_start ?? existing.placement_start,
      data.placement_duration_weeks ?? existing.placement_duration_weeks,
      data.focus_areas ?? existing.focus_areas,
      data.leadership_problems ?? existing.leadership_problems,
      data.non_negotiables ?? existing.non_negotiables,
      data.advisor_bio_summary ?? existing.advisor_bio_summary,
      data.win_win_win_criteria ?? existing.win_win_win_criteria,
    );
  } else {
    const stmt = db.prepare(`
      INSERT INTO brief (id, geography, radius_miles, budget_display_note, headcount_display_note,
        budget_preferred_min, headcount_preferred_min, placement_start, placement_duration_weeks,
        focus_areas, leadership_problems, non_negotiables, advisor_bio_summary, win_win_win_criteria)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      data.geography ?? 'Halifax, Nova Scotia',
      data.radius_miles ?? 15,
      data.budget_display_note ?? null,
      data.headcount_display_note ?? null,
      data.budget_preferred_min ?? null,
      data.headcount_preferred_min ?? null,
      data.placement_start ?? '2026-06-01',
      data.placement_duration_weeks ?? '6-8',
      data.focus_areas ?? '["Ocean health", "Ocean economy", "Ocean technology", "Ocean infrastructure", "Blue economy"]',
      data.leadership_problems ?? '["Stuck partnerships", "Alignment issues", "Truth-telling gaps", "Decision-making bottlenecks", "Founder-to-CEO transitions", "Scaling culture during hypergrowth"]',
      data.non_negotiables ?? '["No single-species operations", "No freshwater organizations"]',
      data.advisor_bio_summary ?? 'Nearly 20 years helping tech executives create happier teams, aligned outcomes, and stronger ROI. Now transitioning to ocean conservation / blue economy leadership advisory. Specializes in: stuck partnerships, alignment issues, truth-telling gaps, strategic knots. Works best 1:1 with senior leaders or with top teams on defined missions.',
      data.win_win_win_criteria ?? 'Value for the organization, positive ocean outcomes, community benefits',
    );
  }

  return getBrief()!;
}
