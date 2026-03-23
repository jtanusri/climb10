import { getGeminiModel } from './client';
import { buildOutreachPrompt } from './prompts';
import type { Brief, Organization } from '../db/types';

export async function generateOutreachDraft(
  brief: Brief,
  org: Organization,
  contact: { contact_name: string; contact_position: string; contact_bio?: string }
): Promise<string> {
  const model = getGeminiModel();
  const prompt = buildOutreachPrompt(brief, org, contact);

  const result = await model.generateContent(prompt);
  return result.response.text();
}
