import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export function getGeminiModel() {
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
  });
}

export function getGeminiModelWithSearch() {
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    tools: [{ googleSearch: {} } as never],
  });
}

export default genAI;
