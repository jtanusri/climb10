import { getGeminiModelWithSearch } from './client';
import { buildBriefingPrompt } from './prompts';
import type { Brief, Organization, Note } from '../db/types';

export async function generateBriefingNotes(
  brief: Brief,
  org: Organization,
  notes: Note[]
): Promise<string> {
  const model = getGeminiModelWithSearch();
  const prompt = buildBriefingPrompt(brief, org, notes);

  const result = await model.generateContent(prompt);
  return result.response.text();
}
