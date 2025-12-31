
import { GoogleGenAI, Type } from "@google/genai";

// Safe access to API KEY for browser environment
const getApiKey = () => {
  try {
    return (window as any).process?.env?.API_KEY || (typeof process !== 'undefined' ? process.env.API_KEY : '');
  } catch {
    return '';
  }
};

const apiKey = getApiKey();

export const generateReportComment = async (studentName: string, grades: Record<string, number>): Promise<string> => {
  if (!apiKey) return "API Key tidak terdeteksi. Silakan konfigurasi API Key Anda.";
  
  const ai = new GoogleGenAI({ apiKey });
  const gradesContext = Object.entries(grades)
    .map(([subject, score]) => `${subject}: ${score}`)
    .join(', ');

  const prompt = `Tuliskan komentar raport akademik yang profesional, menyemangati, dan detail dalam Bahasa Indonesia untuk siswa bernama ${studentName}. 
  Konteks nilai saat ini: ${gradesContext}. 
  Sebutkan kekuatan dan area yang perlu ditingkatkan. Maksimal 100 kata.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || "Gagal menghasilkan komentar saat ini.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Terjadi kesalahan sistem saat menghubungi AI.";
  }
};

export const generateQuestions = async (materialText: string, subject: string, count: number = 5): Promise<any[]> => {
  if (!apiKey) throw new Error("API Key tidak ditemukan.");

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Generate ${count} multiple choice questions in Indonesian about ${subject} based on the following material: ${materialText}. 
  Return as a JSON array of objects with "text", "options" (array of 4 strings), and "correctAnswer" (integer 0-3).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
