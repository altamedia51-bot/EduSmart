
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateReportComment = async (studentName: string, grades: Record<string, number>): Promise<string> => {
  const gradesContext = Object.entries(grades)
    .map(([subject, score]) => `${subject}: ${score}`)
    .join(', ');

  const prompt = `Write a professional, encouraging, and detailed academic report card comment for a student named ${studentName}. 
  Current performance context: ${gradesContext}. 
  Mention strengths and areas for improvement. Keep it within 100 words.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });

    return response.text || "Report comment could not be generated at this time.";
  } catch (error) {
    console.error("AI Error:", error);
    return "The system encountered an error while generating the report comment.";
  }
};

export const generateQuestions = async (materialText: string, subject: string, count: number = 5): Promise<any[]> => {
  const prompt = `Generate ${count} multiple choice questions about ${subject} based on the following material: ${materialText}. 
  Each question should have 4 options and 1 correct answer (0-indexed).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              options: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswer: { type: Type.INTEGER }
            },
            required: ["text", "options", "correctAnswer"]
          }
        }
      }
    });

    const json = JSON.parse(response.text || "[]");
    return json.map((q: any) => ({
      ...q,
      id: Math.random().toString(36).substr(2, 9)
    }));
  } catch (error) {
    console.error("AI Question Generation Error:", error);
    throw error;
  }
};
