
import { GoogleGenAI, Type } from "@google/genai";

// Use 'gemini-3-flash-preview' for basic text generation tasks like report comments.
export const generateReportComment = async (studentName: string, grades: Record<string, number>): Promise<string> => {
  /* Create a new GoogleGenAI instance right before making an API call to ensure it uses the most up-to-date API key. */
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
    return `Terjadi kesalahan sistem: ${error instanceof Error ? error.message : 'Unknown Error'}`;
  }
};

// Use 'gemini-3-pro-preview' for complex text reasoning tasks like generating quiz questions from material.
export const generateQuestions = async (materialText: string, subject: string, count: number = 5, imageData?: { data: string, mimeType: string }): Promise<any[]> => {
  /* Create a new GoogleGenAI instance right before making an API call to ensure it uses the most up-to-date API key. */
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let parts: any[] = [];
  
  if (imageData) {
    parts.push({
      inlineData: {
        data: imageData.data,
        mimeType: imageData.mimeType
      }
    });
  }

  const prompt = `Hasilkan ${count} soal pilihan ganda dalam Bahasa Indonesia tentang ${subject} ${materialText ? `berdasarkan materi berikut: ${materialText}` : 'berdasarkan gambar yang diberikan'}. 
  Kembalikan sebagai JSON array objek dengan properti: "text", "options" (array 4 string), dan "correctAnswer" (integer 0-3).`;

  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts },
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
