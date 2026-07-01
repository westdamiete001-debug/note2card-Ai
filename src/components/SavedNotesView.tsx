import React, { useState } from 'react';
import { 
  FolderOpen, 
  Search, 
  Trash2, 
  Calendar, 
  BookOpen, 
  Layers, 
  HelpCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { StudySession } from '../types';

interface SavedNotesViewProps {
  sessions: StudySession[];
  onLoadSession: (session: StudySession) => void;
  onDeleteSession: (sessionId: string) => void;
  theme: 'light' | 'dark';
}

export default function SavedNotesView({ sessions, onLoadSession, onDeleteSession, theme }: SavedNotesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = sessions.filter((session) => {
    const titleMatch = session.title.toLowerCase().includes(searchQuery.toLowerCase());
    const textMatch = session.rawText.toLowerCase().includes(searchQuery.toLowerCase());
    const summaryMatch = session.materials.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || textMatch || summaryMatch;
  });

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 md:px-6 mb-16">
      
      {/* Header */}
      <div className="mb-8">
        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">
          Local Storage Library
        </span>
        <h2 className={`text-2xl md:text-3xl font-extrabold ${
          theme === 'dark' ? 'text-white' : 'text-neutral-900'
        } tracking-tight mt-1`}>
          Your Saved Study Notes
        </h2>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5 font-semibold">
          Select and reopen notes, flashcard decks, and practice tests. All documents remain stored strictly on your current device.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="w-4.5 h-4.5 absolute left-3.5 top-3.5 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search saved documents by title, notes text, or summaries..."
          className={`w-full pl-11 pr-4 py-3.5 rounded-2xl text-xs font-semibold border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
            theme === 'dark'
              ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500'
              : 'bg-white border-neutral-200 text-neutral-800 placeholder-neutral-400 shadow-xs'
          }`}
        />
      </div>

      {/* Sessions Grid */}
      {filteredSessions.length === 0 ? (
        <div className={`p-12 text-center rounded-2xl border border-dashed ${
          theme === 'dark' ? 'border-neutral-800 text-neutral-500' : 'border-neutral-200 text-neutral-400'
        }`}>
          <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <h4 className="text-sm font-bold">No saved study materials found</h4>
          <p className="text-xs opacity-80 mt-1 max-w-sm mx-auto leading-relaxed">
            {searchQuery 
              ? 'No documents match your active search terms. Try searching with different keywords.'
              : 'Upload a PDF or paste lecture notes on the Home screen to build and save your first study material.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between group ${
                theme === 'dark' 
                  ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' 
                  : 'bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-sm'
              }`}
            >
              <div>
                {/* Meta details */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${
                    session.sourceType === 'pdf'
                      ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                      : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400'
                  }`}>
                    {session.sourceType}
                  </span>
                  
                  <span className="text-[10px] text-neutral-400 font-semibold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{session.createdAt}</span>
                  </span>
                </div>

                {/* Title */}
                <h3 className={`text-base font-bold tracking-tight leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors ${
                  theme === 'dark' ? 'text-white' : 'text-neutral-900'
                }`}>
                  {session.title}
                </h3>

                {/* Sneak peek */}
                <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium mt-1.5 line-clamp-2 leading-relaxed">
                  {session.materials.summary}
                </p>

                {/* Metrics */}
                <div className="flex items-center gap-4 mt-4 py-2 border-y border-neutral-100 dark:border-neutral-800/60">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-400">
                    <BookOpen className="w-4 h-4 text-neutral-300" />
                    <span>Summary</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-400">
                    <Layers className="w-4 h-4 text-neutral-300" />
                    <span>{session.materials.flashcards.length} Cards</span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-400">
                    <HelpCircle className="w-4 h-4 text-neutral-300" />
                    <span>{session.materials.quiz.length} Questions</span>
                  </div>
                </div>
              </div>

              {/* Footer action buttons */}
              <div className="flex items-center justify-between gap-3 pt-4 mt-2">
                <button
                  onClick={() => onDeleteSession(session.id)}
                  className="px-3.5 py-2.5 rounded-xl border border-neutral-100 hover:border-red-500/30 dark:border-neutral-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-neutral-400 hover:text-red-500 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  id={`btn-del-lib-${session.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>

                <button
                  onClick={() => onLoadSession(session)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.01] text-white text-xs font-bold transition-all flex items-center gap-1 shadow-sm shadow-indigo-100 dark:shadow-none cursor-pointer"
                  id={`btn-open-lib-${session.id}`}
                >
                  <span>Study Notes</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
