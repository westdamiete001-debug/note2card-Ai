import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import SummaryView from './components/SummaryView';
import FlashcardsView from './components/FlashcardsView';
import QuizView from './components/QuizView';
import TutorView from './components/TutorView';
import SavedNotesView from './components/SavedNotesView';
import SettingsView from './components/SettingsView';
import { StudySession, AppSettings } from './types';
import { Menu, X, BookOpen, GraduationCap } from 'lucide-react';

export default function App() {
  // State variables
  const [currentView, setCurrentView] = useState<string>('home');
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [activeSession, setActiveSession] = useState<StudySession | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load initial settings and sessions from localStorage
  useEffect(() => {
    try {
      // 1. Load Sessions
      const storedSessions = localStorage.getItem('note2card_sessions');
      if (storedSessions) {
        const parsed = JSON.parse(storedSessions);
        if (Array.isArray(parsed)) {
          setSessions(parsed);
          
          // 2. Load Last Opened Session if exists
          const lastSessionId = localStorage.getItem('note2card_last_active_id');
          if (lastSessionId) {
            const found = parsed.find((s) => s.id === lastSessionId);
            if (found) {
              setActiveSession(found);
            }
          }
        }
      }

      // 3. Load Theme Preference
      const storedTheme = localStorage.getItem('note2card_theme') as 'light' | 'dark';
      if (storedTheme) {
        setTheme(storedTheme);
      } else {
        // Default to dark if system prefers or default light
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(systemPrefersDark ? 'dark' : 'light');
      }
    } catch (err) {
      console.error('Failed to restore offline study session settings:', err);
    }
  }, []);

  // Save Sessions to LocalStorage on updates
  const saveSessionsToLocal = (updatedSessions: StudySession[]) => {
    try {
      setSessions(updatedSessions);
      localStorage.setItem('note2card_sessions', JSON.stringify(updatedSessions));
    } catch (err) {
      console.error('Failed to persist study session list locally:', err);
    }
  };

  // Sync active session and persist last active ID
  const handleSetActiveSession = (session: StudySession | null) => {
    setActiveSession(session);
    if (session) {
      localStorage.setItem('note2card_last_active_id', session.id);
    } else {
      localStorage.removeItem('note2card_last_active_id');
    }
  };

  const handleSessionCreated = (newSession: StudySession) => {
    const updated = [newSession, ...sessions];
    saveSessionsToLocal(updated);
    handleSetActiveSession(newSession);
    setCurrentView('summary');
  };

  const handleUpdateSession = (updatedSession: StudySession) => {
    handleSetActiveSession(updatedSession);
    const updatedList = sessions.map((s) => (s.id === updatedSession.id ? updatedSession : s));
    saveSessionsToLocal(updatedList);
  };

  const handleDeleteSession = (sessionId: string) => {
    const updated = sessions.filter((s) => s.id !== sessionId);
    saveSessionsToLocal(updated);
    
    if (activeSession?.id === sessionId) {
      handleSetActiveSession(null);
      if (currentView !== 'settings') {
        setCurrentView('home');
      }
    }
  };

  const handleLoadSession = (session: StudySession) => {
    handleSetActiveSession(session);
    setCurrentView('summary');
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('note2card_theme', newTheme);
  };

  const handleImportSessions = (imported: StudySession[]) => {
    const merged = [...imported, ...sessions];
    // De-duplicate by ID
    const uniqueMap = new Map<string, StudySession>();
    merged.forEach((s) => uniqueMap.set(s.id, s));
    const unique = Array.from(uniqueMap.values());
    
    saveSessionsToLocal(unique);
    if (unique.length > 0) {
      handleSetActiveSession(unique[0]);
    }
    setCurrentView('saved');
  };

  const handleClearAllData = () => {
    localStorage.removeItem('note2card_sessions');
    localStorage.removeItem('note2card_last_active_id');
    setSessions([]);
    handleSetActiveSession(null);
    setCurrentView('home');
  };

  return (
    <div className={`min-h-screen ${
      theme === 'dark' ? 'bg-neutral-950 text-neutral-100 dark' : 'bg-neutral-50/50 text-neutral-800'
    }`}>
      
      {/* Container wrapper for Navigation & Views */}
      <div className="flex flex-col md:flex-row min-h-screen">
        
        {/* Navigation Sidebar (Desktop) / Bottom bar (Mobile) */}
        <Navbar 
          currentView={currentView} 
          onViewChange={(view) => {
            setCurrentView(view);
            setMobileMenuOpen(false);
          }} 
          hasActiveSession={!!activeSession}
          theme={theme}
        />

        {/* Mobile Header Bar */}
        <header className={`md:hidden flex items-center justify-between p-4 border-b shrink-0 sticky top-0 z-30 ${
          theme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
        }`}>
          <div className="flex items-center gap-2">
            <div className="w-8.5 h-8.5 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-indigo-600 to-violet-500 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
              Note2Card
            </span>
          </div>

          {activeSession && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold border border-indigo-100/10 truncate max-w-[140px]">
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{activeSession.title}</span>
            </div>
          )}
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden min-h-0 md:min-h-screen relative pb-16 md:pb-0">
          
          {/* Active study context indicator (Desktop topbar) */}
          <div className={`hidden md:flex items-center justify-end px-6 py-3 border-b border-neutral-200/50 dark:border-neutral-900 sticky top-0 z-10 shrink-0 ${
            theme === 'dark' ? 'bg-neutral-950/80 backdrop-blur-md' : 'bg-neutral-50/80 backdrop-blur-md'
          }`}>
            {activeSession ? (
              <div className="flex items-center gap-2.5 px-4 py-2 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold shadow-xs">
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>Active Study: <strong>{activeSession.title}</strong></span>
              </div>
            ) : (
              <div className="text-xs font-semibold text-neutral-400">
                No active document. Paste notes or upload PDF.
              </div>
            )}
          </div>

          {/* Conditional View Router */}
          <div className="w-full relative animate-fadeIn">
            {currentView === 'home' && (
              <HomeView 
                onSessionCreated={handleSessionCreated} 
                recentSessions={sessions}
                onLoadSession={handleLoadSession}
                onDeleteSession={handleDeleteSession}
                theme={theme}
              />
            )}

            {currentView === 'summary' && activeSession && (
              <SummaryView 
                session={activeSession} 
                theme={theme}
              />
            )}

            {currentView === 'flashcards' && activeSession && (
              <FlashcardsView 
                session={activeSession} 
                onUpdateSession={handleUpdateSession}
                theme={theme}
              />
            )}

            {currentView === 'quiz' && activeSession && (
              <QuizView 
                session={activeSession} 
                theme={theme}
              />
            )}

            {currentView === 'tutor' && activeSession && (
              <TutorView 
                session={activeSession} 
                onUpdateSession={handleUpdateSession}
                theme={theme}
              />
            )}

            {currentView === 'saved' && (
              <SavedNotesView 
                sessions={sessions}
                onLoadSession={handleLoadSession}
                onDeleteSession={handleDeleteSession}
                theme={theme}
              />
            )}

            {currentView === 'settings' && (
              <SettingsView 
                theme={theme}
                onThemeChange={handleThemeChange}
                sessions={sessions}
                onImportSessions={handleImportSessions}
                onClearAllData={handleClearAllData}
              />
            )}
          </div>

        </main>

      </div>

    </div>
  );
}
