import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  History, 
  BookOpen, 
  Trash2, 
  AlertCircle,
  Clock,
  ArrowRight,
  GraduationCap
} from 'lucide-react';
import { StudySession } from '../types';

// Helper to dynamically load PDF.js from a CDN and extract text
async function extractTextFromPDF(file: File, onProgress: (progress: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const scriptId = 'pdfjs-lib-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const startParsing = async () => {
      try {
        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

        const fileReader = new FileReader();
        fileReader.onload = async (e) => {
          try {
            const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);
            const loadingTask = pdfjsLib.getDocument({ data: typedarray });
            
            const pdf = await loadingTask.promise;
            const numPages = pdf.numPages;
            let fullText = '';

            for (let i = 1; i <= numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map((item: any) => item.str).join(' ');
              fullText += pageText + '\n';
              onProgress(Math.round((i / numPages) * 100));
            }

            if (fullText.trim().length === 0) {
              reject(new Error('We found no text in this PDF file. It might be scanned without OCR or image-only. Please try pasting notes instead.'));
            } else {
              resolve(fullText);
            }
          } catch (err) {
            reject(new Error('Failed to read PDF file. It might be password-protected or corrupted.'));
          }
        };
        fileReader.onerror = () => reject(new Error('Error reading PDF file.'));
        fileReader.readAsArrayBuffer(file);
      } catch (err) {
        reject(err);
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
      script.onload = startParsing;
      script.onerror = () => reject(new Error('Could not load PDF engine. Check your internet connection.'));
      document.head.appendChild(script);
    } else if (!(window as any).pdfjsLib) {
      const interval = setInterval(() => {
        if ((window as any).pdfjsLib) {
          clearInterval(interval);
          startParsing();
        }
      }, 100);
    } else {
      startParsing();
    }
  });
}

interface HomeViewProps {
  onSessionCreated: (session: StudySession) => void;
  recentSessions: StudySession[];
  onLoadSession: (session: StudySession) => void;
  onDeleteSession: (sessionId: string) => void;
  theme: 'light' | 'dark';
}

export default function HomeView({ onSessionCreated, recentSessions, onLoadSession, onDeleteSession, theme }: HomeViewProps) {
  const [pastedText, setPastedText] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<number | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Unsupported file format. Please upload a PDF document.');
      return;
    }
    
    setPdfFileName(file.name);
    setPdfProgress(1);
    setError(null);
    
    if (!customTitle) {
      // Set title draft without extension
      setCustomTitle(file.name.replace(/\.pdf$/i, ''));
    }

    try {
      const extractedText = await extractTextFromPDF(file, (progress) => {
        setPdfProgress(progress);
      });
      setPastedText(extractedText);
      setPdfProgress(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during text extraction.');
      setPdfProgress(null);
      setPdfFileName(null);
    }
  };

  const handleGenerate = async () => {
    if (!pastedText.trim()) {
      setError('Please provide study notes or upload a PDF first.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerationStep('Analyzing study text...');

    // Progress simulations for better UI feeling
    const progressTimer = setTimeout(() => {
      setGenerationStep('Synthesizing core summaries...');
    }, 4000);

    const progressTimer2 = setTimeout(() => {
      setGenerationStep('Assembling active flashcards and exam tips...');
    }, 9000);

    const progressTimer3 = setTimeout(() => {
      setGenerationStep('Drafting multiple choice and analytical quiz questions...');
    }, 14000);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: pastedText,
          title: customTitle.trim() || 'Untitled Study Session'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server returned an error');
      }

      const generatedData = await response.json();

      // Formulate unique IDs for the generated flashcards and quiz questions
      const formattedFlashcards = (generatedData.flashcards || []).map((card: any, idx: number) => ({
        id: `card-${Date.now()}-${idx}`,
        question: card.question || 'No question provided',
        answer: card.answer || 'No answer provided',
        isKnown: false,
        needsReview: false
      }));

      const formattedQuiz = (generatedData.quiz || []).map((q: any, idx: number) => ({
        id: `q-${Date.now()}-${idx}`,
        question: q.question || 'No question provided',
        type: q.type || 'multiple-choice',
        options: q.options || undefined,
        correctAnswer: q.correctAnswer || '',
        explanation: q.explanation || 'No explanation available.'
      }));

      const newSession: StudySession = {
        id: `session-${Date.now()}`,
        title: generatedData.title || customTitle || 'Study Session',
        createdAt: new Date().toLocaleDateString(undefined, { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        sourceType: pdfFileName ? 'pdf' : 'text',
        fileName: pdfFileName || undefined,
        rawText: pastedText,
        materials: {
          title: generatedData.title || customTitle || 'Study Session',
          summary: generatedData.summary || 'Summary not available.',
          keyPoints: generatedData.keyPoints || [],
          importantConcepts: generatedData.importantConcepts || [],
          definitions: generatedData.definitions || [],
          chapterOutline: generatedData.chapterOutline || [],
          studyNotes: generatedData.studyNotes || [],
          examTips: generatedData.examTips || [],
          memoryTricks: generatedData.memoryTricks || [],
          frequentlyTested: generatedData.frequentlyTested || [],
          flashcards: formattedFlashcards,
          quiz: formattedQuiz
        },
        chatHistory: []
      };

      onSessionCreated(newSession);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to generate study materials. Check your internet connection or try a shorter document.');
    } finally {
      clearTimeout(progressTimer);
      clearTimeout(progressTimer2);
      clearTimeout(progressTimer3);
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 md:px-6">
      
      {/* Hero Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-4 shadow-sm border border-indigo-100/10">
          <GraduationCap className="w-10 h-10" />
        </div>
        <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${
          theme === 'dark' ? 'text-white' : 'text-neutral-900'
        } mb-3`}>
          Transform your notes into study materials
        </h2>
        <p className="text-base text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto font-medium leading-relaxed">
          Upload any PDF or paste raw lecture notes to immediately generate a comprehensive study dashboard of summaries, flashcards, quizzes, and a dedicated AI tutor.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 rounded-r-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Action Needed</h4>
            <p className="text-xs mt-0.5 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Main Form Fields */}
      <div className={`rounded-2xl border ${
        theme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
      } p-6 md:p-8 shadow-sm space-y-6 mb-10`}>
        
        {/* Title Input */}
        <div>
          <label className={`block text-xs font-bold tracking-wider uppercase ${
            theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'
          } mb-2`}>
            Subject or Topic Title (Optional)
          </label>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="e.g. Molecular Biology Lecture 3, History Final Review"
            className={`w-full px-4 py-3 rounded-xl text-sm font-medium border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
              theme === 'dark' 
                ? 'bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500' 
                : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
            }`}
          />
        </div>

        {/* Upload File Zone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left Column: Drag/Drop PDF */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[220px] ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/20'
                : theme === 'dark'
                ? 'border-neutral-800 bg-neutral-800/20 hover:border-neutral-700'
                : 'border-neutral-300 bg-neutral-50 hover:border-neutral-400'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="application/pdf"
              className="hidden"
            />
            {pdfProgress !== null ? (
              <div className="w-full max-w-[180px] space-y-3">
                <div className="relative w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400 animate-pulse">
                  <FileText className="w-6 h-6 animate-bounce" />
                </div>
                <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  Parsing PDF pages... {pdfProgress}%
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${pdfProgress}%` }}
                  ></div>
                </div>
              </div>
            ) : pdfFileName ? (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-100 dark:border-emerald-900/10">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">PDF Uploaded</p>
                <p className={`text-xs font-medium max-w-[160px] truncate mx-auto ${
                  theme === 'dark' ? 'text-neutral-300' : 'text-neutral-600'
                }`}>{pdfFileName}</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPdfFileName(null);
                    setPastedText('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-[11px] text-red-500 hover:underline font-semibold"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-100/10">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-800'}`}>
                    Drag & drop PDF here
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-1">or click to browse your files</p>
                </div>
                <span className="inline-block px-3 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-semibold text-neutral-500 dark:text-neutral-400 shadow-xs">
                  Select PDF
                </span>
              </div>
            )}
          </div>

          {/* Right Column: Text Area Note */}
          <div className="flex flex-col">
            <label className={`block text-xs font-bold tracking-wider uppercase ${
              theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'
            } mb-2`}>
              Or Paste Lecture Notes / Articles
            </label>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste text directly, or let PDF extraction populate this area automatically. Edit text as needed to optimize generated materials..."
              className={`w-full flex-1 min-h-[220px] max-h-[300px] p-4 rounded-2xl text-xs font-medium border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all leading-relaxed resize-none ${
                theme === 'dark' 
                  ? 'bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500' 
                  : 'bg-neutral-50 border-neutral-200 text-neutral-800 placeholder-neutral-400'
              }`}
            />
          </div>

        </div>

        {/* Generate Materials Button */}
        <div className="pt-2">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || (!pastedText.trim() && !pdfFileName)}
            className={`w-full py-4 px-6 rounded-2xl text-sm font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isGenerating || (!pastedText.trim() && !pdfFileName)
                ? 'bg-neutral-300 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed shadow-none'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 dark:shadow-none hover:scale-[1.01]'
            }`}
            id="btn-generate-study"
          >
            {isGenerating ? (
              <div className="flex items-center gap-3">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>{generationStep}</span>
              </div>
            ) : (
              <>
                <BookOpen className="w-5 h-5" />
                <span>Generate Study Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>

      {/* Recent Sessions List */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-neutral-400" />
          <h3 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-800'}`}>
            Recent Study Sessions
          </h3>
          <span className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded-full font-bold">
            {recentSessions.length}
          </span>
        </div>

        {recentSessions.length === 0 ? (
          <div className={`border border-dashed rounded-2xl p-8 text-center ${
            theme === 'dark' ? 'border-neutral-800 text-neutral-500' : 'border-neutral-200 text-neutral-400'
          }`}>
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold">No recent study sessions found.</p>
            <p className="text-[10px] opacity-80 mt-1">Uploaded files and summaries are saved on this device automatically.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className={`p-4 rounded-xl border transition-all flex items-start justify-between group ${
                  theme === 'dark' 
                    ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' 
                    : 'bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-xs'
                }`}
              >
                <div 
                  onClick={() => onLoadSession(session)} 
                  className="flex-1 cursor-pointer pr-3"
                  id={`recent-session-${session.id}`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold ${
                      session.sourceType === 'pdf'
                        ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                        : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400'
                    }`}>
                      {session.sourceType}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-medium">
                      {session.createdAt}
                    </span>
                  </div>
                  <h4 className={`text-sm font-bold truncate ${
                    theme === 'dark' ? 'text-white group-hover:text-indigo-400' : 'text-neutral-900 group-hover:text-indigo-600'
                  }`}>
                    {session.title}
                  </h4>
                  <p className="text-[11px] text-neutral-400 mt-1 truncate font-medium">
                    {session.materials.summary.slice(0, 90)}...
                  </p>
                </div>
                
                <button
                  onClick={() => onDeleteSession(session.id)}
                  className="text-neutral-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  title="Delete Study Material"
                  id={`btn-del-session-${session.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
