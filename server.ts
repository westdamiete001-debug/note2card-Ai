import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Safe path resolution for ESM and CommonJS bundlers
let myFilename = '';
let myDirname = '';
try {
  myFilename = __filename;
  myDirname = __dirname;
} catch {
  myFilename = fileURLToPath(import.meta.url);
  myDirname = path.dirname(myFilename);
}

// Lazy initializer for the Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required. Please add it to your environment secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // 1. API route to generate study material (Summary, Flashcards, Quiz)
  app.post('/api/generate', async (req, res) => {
    try {
      const { text, title } = req.body;
      if (!text || typeof text !== 'string' || text.trim() === '') {
        res.status(400).json({ error: 'Source text is required' });
        return;
      }

      const ai = getGeminiClient();

      const prompt = `Analyze the following study materials (notes or extracted PDF text) and generate a comprehensive study packet in JSON format.
You must return a single valid JSON object following this exact structure and using the provided fields:

- title: A descriptive document title based on the notes (use "${title || ''}" if appropriate).
- summary: A concise yet comprehensive executive summary of the content (multiple paragraphs allowed).
- keyPoints: An array of the top 8-10 key takeaways or main points.
- importantConcepts: Array of objects with {"concept": string, "explanation": string} describing the primary concepts.
- definitions: Array of objects with {"term": string, "definition": string} for important terms.
- chapterOutline: Array of objects with {"chapter": string, "details": string} detailing a logical chapter outline or structured breakdown.
- studyNotes: Array of strings providing detailed study notes on critical topics.
- examTips: Array of strings providing strategic advice for exams.
- memoryTricks: Array of strings with mnemonic devices, analogies, or tricks to remember key terms.
- frequentlyTested: Array of strings listing topics that are highly likely to appear on a test or quiz.
- flashcards: Array of 10 objects with {"question": string, "answer": string} covering important definitions, facts, and concepts.
- quiz: Array of 10 objects with {"question": string, "type": "multiple-choice" | "true-false" | "fill-blank", "options": string[], "correctAnswer": string, "explanation": string}.
  - For "multiple-choice", options must contain exactly 4 choices, one of which must be the correctAnswer.
  - For "true-false", options should be exactly ["True", "False"], and the correctAnswer must be either "True" or "False".
  - For "fill-blank", the question should contain a blank space like "_______" and options should be null or empty, and the correctAnswer must be the short phrase or word that fills the blank.

Ensure all answers are based purely on the provided text.

STUDY MATERIALS:
${text.slice(0, 100000)}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              keyPoints: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              importantConcepts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    concept: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                  },
                  required: ['concept', 'explanation']
                }
              },
              definitions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    term: { type: Type.STRING },
                    definition: { type: Type.STRING }
                  },
                  required: ['term', 'definition']
                }
              },
              chapterOutline: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    chapter: { type: Type.STRING },
                    details: { type: Type.STRING }
                  },
                  required: ['chapter', 'details']
                }
              },
              studyNotes: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              examTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              memoryTricks: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              frequentlyTested: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              flashcards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    answer: { type: Type.STRING }
                  },
                  required: ['question', 'answer']
                }
              },
              quiz: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    type: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    correctAnswer: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                  },
                  required: ['question', 'type', 'correctAnswer', 'explanation']
                }
              }
            },
            required: [
              'title', 'summary', 'keyPoints', 'importantConcepts', 'definitions',
              'chapterOutline', 'studyNotes', 'examTips', 'memoryTricks', 'frequentlyTested',
              'flashcards', 'quiz'
            ]
          }
        }
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error('No text generated by Gemini');
      }

      const data = JSON.parse(resultText);
      res.json(data);
    } catch (error: any) {
      console.error('Error generating study materials:', error);
      res.status(500).json({ error: error?.message || 'Failed to generate study materials' });
    }
  });

  // 2. API route for AI Study Assistant (Tutor Q&A)
  app.post('/api/tutor', async (req, res) => {
    try {
      const { text, chatHistory, question } = req.body;
      if (!text || !question) {
        res.status(400).json({ error: 'Text and question are required' });
        return;
      }

      const ai = getGeminiClient();

      const promptContext = `You are a strict, expert AI Tutor for the application Note2Card. Your role is to help the student understand and study the uploaded notes or document.

IMPORTANT CONSTRAINTS:
1. You must answer the student's questions using ONLY the provided study material reference text. Do NOT use any external knowledge base.
2. If the user asks about anything not covered or mentioned in the provided text, or asks you to perform a task unrelated to this text, you MUST politely reply that your knowledge is restricted to the uploaded study materials and you cannot answer external queries.
3. Keep your answer professional, informative, encouraging, and clear. Use Markdown formatting (bold, bullet points, numbered lists) where appropriate to make it highly readable.

STUDY MATERIAL REFERENCE:
${text.slice(0, 100000)}
=========================

CHAT HISTORY:
${chatHistory?.map((msg: any) => `${msg.sender === 'user' ? 'Student' : 'Tutor'}: ${msg.text}`).join('\n') || 'None'}

Student's New Question: ${question}
Tutor:`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: promptContext,
      });

      const reply = response.text;
      res.json({ text: reply || "I'm sorry, I couldn't generate a response." });
    } catch (error: any) {
      console.error('Error in tutor response:', error);
      res.status(500).json({ error: error?.message || 'Failed to get tutor answer' });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
