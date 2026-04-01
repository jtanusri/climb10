import { GoogleGenerativeAI } from '@google/generative-ai';

function getGenAI(): GoogleGenerativeAI {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GOOGLE_GEMINI_API_KEY environment variable is not set. ' +
      'Add it to your Netlify environment variables or .env.local file.'
    );
  }
  return new GoogleGenerativeAI(apiKey);
}

export function getGeminiModel() {
  return getGenAI().getGenerativeModel({
    model: 'gemini-2.5-flash',
  });
}

export function getGeminiModelWithSearch() {
  return getGenAI().getGenerativeModel({
    model: 'gemini-2.5-flash',
    tools: [{ googleSearch: {} } as never],
  });
}

export default getGenAI;
