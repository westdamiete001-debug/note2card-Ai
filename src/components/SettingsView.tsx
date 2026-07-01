import React, { useState, useRef } from 'react';
import { 
  Settings, 
  Moon, 
  Sun, 
  Trash2, 
  Download, 
  Upload, 
  ShieldCheck, 
  FileText, 
  Info, 
  Mail,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { StudySession } from '../types';

interface SettingsViewProps {
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  sessions: StudySession[];
  onImportSessions: (sessions: StudySession[]) => void;
  onClearAllData: () => void;
}

export default function SettingsView({ 
  theme, 
  onThemeChange, 
  sessions, 
  onImportSessions, 
  onClearAllData 
}: SettingsViewProps) {
  
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [openSection, setOpenSection] = useState<'none' | 'about' | 'privacy' | 'terms' | 'contact'>('none');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (section: 'about' | 'privacy' | 'terms' | 'contact') => {
    setOpenSection(openSection === section ? 'none' : section);
  };

  const handleExportAll = () => {
    const backupData = {
      app: 'Note2Card',
      exportedAt: new Date().toISOString(),
      sessions: sessions
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `note2card_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(false);
    
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        if (json.app !== 'Note2Card' || !Array.isArray(json.sessions)) {
          throw new Error('This JSON file does not appear to be a valid Note2Card backup.');
        }

        onImportSessions(json.sessions);
        setImportSuccess(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err: any) {
        setImportError(err.message || 'Failed to parse JSON file.');
      }
    };
    reader.onerror = () => setImportError('Failed to read the backup file.');
    reader.readAsText(file);
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 md:px-6 mb-16 space-y-8">
      
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">
          Control Panel
        </span>
        <h2 className={`text-2xl md:text-3xl font-extrabold ${
          theme === 'dark' ? 'text-white' : 'text-neutral-900'
        } tracking-tight mt-1`}>
          Application Settings
        </h2>
      </div>

      {importSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-emerald-500 text-emerald-800 dark:text-emerald-400 rounded-r-xl flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs font-semibold">Study sessions imported successfully!</span>
        </div>
      )}

      {importError && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 text-red-800 dark:text-red-400 rounded-r-xl flex items-center gap-2.5 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="text-xs font-semibold">{importError}</span>
        </div>
      )}

      {/* Grid segments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Preference Settings Panel */}
        <div className={`p-6 rounded-2xl border ${
          theme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
        } space-y-4`}>
          <h3 className={`text-sm font-bold flex items-center gap-2 ${
            theme === 'dark' ? 'text-white' : 'text-neutral-900'
          }`}>
            <Sun className="w-4.5 h-4.5 text-indigo-500" />
            <span>Preferences</span>
          </h3>
          <p className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">Visual Interface Mode</p>
          
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => onThemeChange('light')}
              className={`py-3 px-4 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                theme === 'light'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-600 font-black'
                  : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:bg-neutral-100/40 dark:hover:bg-neutral-800/40'
              }`}
              id="btn-set-light-mode"
            >
              <Sun className="w-4 h-4" />
              <span>Light Mode</span>
            </button>

            <button
              onClick={() => onThemeChange('dark')}
              className={`py-3 px-4 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'border-indigo-500 bg-indigo-950/40 text-indigo-400 font-black'
                  : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:bg-neutral-100/40 dark:hover:bg-neutral-800/40'
              }`}
              id="btn-set-dark-mode"
            >
              <Moon className="w-4 h-4" />
              <span>Dark Mode</span>
            </button>
          </div>
        </div>

        {/* Data Maintenance Panel */}
        <div className={`p-6 rounded-2xl border ${
          theme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
        } space-y-4`}>
          <h3 className={`text-sm font-bold flex items-center gap-2 ${
            theme === 'dark' ? 'text-white' : 'text-neutral-900'
          }`}>
            <Trash2 className="w-4.5 h-4.5 text-indigo-500" />
            <span>Local Database Backups</span>
          </h3>
          <p className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">Maintenance Controls</p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleExportAll}
              disabled={sessions.length === 0}
              className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                sessions.length === 0
                  ? 'opacity-30 cursor-not-allowed text-neutral-400 border-neutral-200 dark:border-neutral-800'
                  : theme === 'dark'
                  ? 'bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700'
                  : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 shadow-xs'
              }`}
              id="btn-backup-export"
            >
              <Download className="w-4 h-4" />
              <span>Backup</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700'
                  : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 shadow-xs'
              }`}
              id="btn-backup-import"
            >
              <Upload className="w-4 h-4" />
              <span>Restore</span>
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportAll}
            accept=".json"
            className="hidden"
          />
        </div>

      </div>

      {/* Dangerous Wipe Section */}
      <div className={`p-6 rounded-2xl border ${
        theme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
      } space-y-4`}>
        <h3 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>Destructive Settings</span>
        </h3>
        
        <p className={`text-xs font-medium leading-relaxed ${
          theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'
        }`}>
          Wipe all locally stored summaries, notes, flashcards, quizzes, and chat histories permanently. This action is irreversible and clears your device cache database.
        </p>

        {!showClearConfirm ? (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-all cursor-pointer"
            id="btn-show-wipe"
          >
            Clear All Stored Data
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border border-red-200 dark:border-red-950/40 bg-red-500/5 animate-fadeIn">
            <span className="text-xs font-bold text-red-500">Are you absolutely sure? This will delete all saved study sessions.</span>
            <div className="flex items-center gap-2 shrink-0 ml-auto w-full sm:w-auto">
              <button
                onClick={() => setShowClearConfirm(false)}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold border ${
                  theme === 'dark'
                    ? 'border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
                id="btn-cancel-wipe"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearAllData();
                  setShowClearConfirm(false);
                }}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all"
                id="btn-confirm-wipe"
              >
                Wipe Database
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Disclosures Legal Accordion Area */}
      <div className="space-y-4 border-t border-neutral-200 dark:border-neutral-800 pt-6">
        
        <h3 className={`text-sm font-extrabold ${theme === 'dark' ? 'text-white' : 'text-neutral-800'} mb-2`}>
          Information & Compliance
        </h3>

        {/* 1. About section */}
        <div className={`rounded-xl border ${
          theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'
        } overflow-hidden`}>
          <button
            onClick={() => toggleSection('about')}
            className={`w-full px-5 py-4 flex items-center justify-between font-bold text-xs select-none cursor-pointer text-left ${
              theme === 'dark' ? 'text-white bg-neutral-900 hover:bg-neutral-850' : 'text-neutral-800 bg-neutral-50 hover:bg-neutral-100'
            }`}
            id="btn-info-about"
          >
            <div className="flex items-center gap-2.5">
              <Info className="w-4.5 h-4.5 text-indigo-500" />
              <span>About Note2Card</span>
            </div>
            {openSection === 'about' ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
          </button>
          
          {openSection === 'about' && (
            <div className={`p-5 text-xs font-medium leading-relaxed border-t border-neutral-100 dark:border-neutral-800/60 ${
              theme === 'dark' ? 'bg-neutral-950 text-neutral-400' : 'bg-white text-neutral-600'
            }`}>
              <p className="mb-3">
                <strong>Note2Card</strong> is an advanced, AI-powered study dashboard designed specifically for modern students. It bridges the gap between massive lecture slides, PDF textbooks, or raw notes and active learning materials.
              </p>
              <p>
                By extracting textual contents directly inside the browser, Note2Card securely synthesizes core document summaries, builds interactive practice quiz sessions, designs comprehensive flashcards with progressive completion trackers, and hosts a dedicated AI Study Companion responding purely to the provided materials. Everything is persisted locally on the user's device.
              </p>
            </div>
          )}
        </div>

        {/* 2. Privacy Policy */}
        <div className={`rounded-xl border ${
          theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'
        } overflow-hidden`}>
          <button
            onClick={() => toggleSection('privacy')}
            className={`w-full px-5 py-4 flex items-center justify-between font-bold text-xs select-none cursor-pointer text-left ${
              theme === 'dark' ? 'text-white bg-neutral-900 hover:bg-neutral-850' : 'text-neutral-800 bg-neutral-50 hover:bg-neutral-100'
            }`}
            id="btn-info-privacy"
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-500" />
              <span>Privacy Policy</span>
            </div>
            {openSection === 'privacy' ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
          </button>
          
          {openSection === 'privacy' && (
            <div className={`p-5 text-xs font-medium leading-relaxed border-t border-neutral-100 dark:border-neutral-800/60 space-y-3 ${
              theme === 'dark' ? 'bg-neutral-950 text-neutral-400' : 'bg-white text-neutral-600'
            }`}>
              <p>Please read our strict Privacy Policy. Note2Card protects your user data:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>No account creation or login required</strong>: Use all services instantly without registration.</li>
                <li><strong>No collection or sale of personal details</strong>: We never request or store user identities, names, or contact files except when contacting us via email.</li>
                <li><strong>Strict local device caching</strong>: Uploaded PDFs, notes, summaries, flashcards, quizzes, chat history, and study progress are stored safely on your current device using standard browser Local Storage.</li>
                <li><strong>Zero persistent cloud database records</strong>: Your original notes and files are processed transiently online for the sole purpose of enabling generative AI structures and are never cataloged or kept on remote databases.</li>
                <li><strong>No trackers or tracking systems</strong>: We use zero cookies, analytics pixels, trackers, or marketing metrics.</li>
                <li><strong>Manual wipe capabilities</strong>: Users are in full control of their data and can purge all local databases at any time using the dangerous maintenance button above.</li>
                <li>The Privacy Policy may be updated periodically.</li>
              </ul>
            </div>
          )}
        </div>

        {/* 3. Terms and Conditions */}
        <div className={`rounded-xl border ${
          theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'
        } overflow-hidden`}>
          <button
            onClick={() => toggleSection('terms')}
            className={`w-full px-5 py-4 flex items-center justify-between font-bold text-xs select-none cursor-pointer text-left ${
              theme === 'dark' ? 'text-white bg-neutral-900 hover:bg-neutral-850' : 'text-neutral-800 bg-neutral-50 hover:bg-neutral-100'
            }`}
            id="btn-info-terms"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4.5 h-4.5 text-indigo-500" />
              <span>Terms and Conditions</span>
            </div>
            {openSection === 'terms' ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
          </button>
          
          {openSection === 'terms' && (
            <div className={`p-5 text-xs font-medium leading-relaxed border-t border-neutral-100 dark:border-neutral-800/60 space-y-3 ${
              theme === 'dark' ? 'bg-neutral-950 text-neutral-400' : 'bg-white text-neutral-600'
            }`}>
              <p>By studying on Note2Card, you agree to the following conditions:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>File ownership and responsibility</strong>: Users assume full copyright and regulatory responsibility for any PDF files or notes they process or paste.</li>
                <li><strong>Educational aid only</strong>: Summaries, flashcards, and quizzes generated via generative models serve solely as tutoring materials and may contain inaccuracies. Please verify key historical data or scientific formulas against original references.</li>
                <li><strong>Prohibition of illegal uploads</strong>: Illegal materials or copyright-infringing publications must not be uploaded.</li>
                <li><strong>No liability clauses</strong>: The developers are not liable for academic outcomes, grades, or choices made based on generated responses. The platform is supplied "as is" without representations.</li>
                <li>Continued use of the application indicates acceptance of these terms.</li>
              </ul>
            </div>
          )}
        </div>

        {/* 4. Contact Details */}
        <div className={`rounded-xl border ${
          theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'
        } overflow-hidden`}>
          <button
            onClick={() => toggleSection('contact')}
            className={`w-full px-5 py-4 flex items-center justify-between font-bold text-xs select-none cursor-pointer text-left ${
              theme === 'dark' ? 'text-white bg-neutral-900 hover:bg-neutral-850' : 'text-neutral-800 bg-neutral-50 hover:bg-neutral-100'
            }`}
            id="btn-info-contact"
          >
            <div className="flex items-center gap-2.5">
              <Mail className="w-4.5 h-4.5 text-violet-500" />
              <span>Support & Contact</span>
            </div>
            {openSection === 'contact' ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
          </button>
          
          {openSection === 'contact' && (
            <div className={`p-5 text-xs font-medium leading-relaxed border-t border-neutral-100 dark:border-neutral-800/60 space-y-2.5 ${
              theme === 'dark' ? 'bg-neutral-950 text-neutral-400' : 'bg-white text-neutral-600'
            }`}>
              <p>For questions, feature feedback, report of bugs, or partnership opportunities, reach out directly via our dedicated email:</p>
              <p className="flex items-center gap-1.5 pt-1">
                <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
                <a href="mailto:wizardclipper12@gmail.com" className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold text-xs select-text">
                  wizardclipper12@gmail.com
                </a>
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
