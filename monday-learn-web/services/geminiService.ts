import { GoogleGenAI, type Chat } from '@google/genai';

let chatSession: Chat | null = null;

export const getChatSession = () => {
  if (chatSession) return chatSession;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      temperature: 0.6,
      maxOutputTokens: 512,
    },
  });

  return chatSession;
};
