import { 
  Home, 
  BookOpen, 
  Layers, 
  HelpCircle, 
  MessageSquare, 
  Folder, 
  Settings, 
  Menu, 
  X,
  GraduationCap
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  hasActiveSession: boolean;
  theme: 'light' | 'dark';
}

export default function Navbar({ currentView, onViewChange, hasActiveSession, theme }: NavbarProps) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home, requireSession: false },
    { id: 'summary', label: 'Summary', icon: BookOpen, requireSession: true },
    { id: 'flashcards', label: 'Flashcards', icon: Layers, requireSession: true },
    { id: 'quiz', label: 'Quiz', icon: HelpCircle, requireSession: true },
    { id: 'tutor', label: 'AI Tutor', icon: MessageSquare, requireSession: true },
    { id: 'saved', label: 'Saved Notes', icon: Folder, requireSession: false },
    { id: 'settings', label: 'Settings', icon: Settings, requireSession: false },
  ];

  return (
    <>
      {/* Sidebar for Desktop */}
      <aside className={`hidden md:flex flex-col w-64 border-r ${
        theme === 'dark' 
          ? 'bg-neutral-900 border-neutral-800 text-neutral-200' 
          : 'bg-white border-neutral-200 text-neutral-800'
      } h-screen sticky top-0 shrink-0 select-none z-20`}>
        {/* App Logo & Title */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 dark:shadow-none">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-500 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
              Note2Card
            </h1>
            <p className="text-xs text-neutral-400 font-medium">Study Smart with AI</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const disabled = item.requireSession && !hasActiveSession;
            const active = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => !disabled && onViewChange(item.id)}
                disabled={disabled}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'
                    : disabled
                    ? 'opacity-40 cursor-not-allowed text-neutral-400 dark:text-neutral-500'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                }`}
                title={disabled ? 'Upload materials first to unlock' : undefined}
                id={`nav-${item.id}`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-400'}`} />
                <span>{item.label}</span>
                {item.requireSession && disabled && (
                  <span className="ml-auto text-[10px] uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400">
                    Locked
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 text-center">
          <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">Note2Card v1.0.0</p>
        </div>
      </aside>

      {/* Bottom Bar Navigation for Mobile */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 border-t ${
        theme === 'dark' 
          ? 'bg-neutral-900 border-neutral-800 text-neutral-200' 
          : 'bg-white border-neutral-200 text-neutral-800'
      } py-2 px-3 flex justify-around items-center select-none z-40`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const disabled = item.requireSession && !hasActiveSession;
          const active = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => !disabled && onViewChange(item.id)}
              disabled={disabled}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-all duration-200 ${
                active
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : disabled
                  ? 'opacity-30 cursor-not-allowed text-neutral-400'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}
              id={`nav-mob-${item.id}`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-400'}`} />
              <span className="truncate max-w-[56px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
