export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  isKnown?: boolean;
  needsReview?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank';
  options?: string[]; // Defined only for multiple-choice
  correctAnswer: string;
  explanation: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface StudyMaterial {
  title: string;
  summary: string;
  keyPoints: string[];
  importantConcepts: { concept: string; explanation: string }[];
  definitions: { term: string; definition: string }[];
  chapterOutline: { chapter: string; details: string }[];
  studyNotes: string[];
  examTips: string[];
  memoryTricks: string[];
  frequentlyTested: string[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface StudySession {
  id: string;
  title: string;
  createdAt: string;
  sourceType: 'pdf' | 'text';
  fileName?: string;
  rawText: string;
  materials: StudyMaterial;
  chatHistory: ChatMessage[];
}

export interface AppSettings {
  theme: 'light' | 'dark';
}
