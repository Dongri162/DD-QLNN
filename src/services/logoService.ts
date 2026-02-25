import { GoogleGenAI } from "@google/genai";

export async function generateAppLogo() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: 'A modern, professional logo for a school management application named "SmartSchool". The logo should feature a stylized graduation cap integrated with a digital circuit or a shield, symbolizing education and security. Use a color palette of deep blue, emerald green, and white. Clean, minimalist design, high quality, vector style.',
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
}
