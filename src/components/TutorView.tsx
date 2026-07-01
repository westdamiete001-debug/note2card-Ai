import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Trash2, 
  Copy, 
  Check, 
  Sparkles,
  Bot,
  User,
  HelpCircle
} from 'lucide-react';
import { ChatMessage, StudySession } from '../types';

interface TutorViewProps {
  session: StudySession;
  onUpdateSession: (updatedSession: StudySession) => void;
  theme: 'light' | 'dark';
}

export default function TutorView({ session, onUpdateSession, theme }: TutorViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Synchronize component messages with session history
  useEffect(() => {
    if (session.chatHistory) {
      if (session.chatHistory.length === 0) {
        // Seed first welcoming message
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          sender: 'assistant',
          text: `Hi there! I'm your dedicated Note2Card study companion. Ask me any question about the study materials for **${session.materials.title}**, and I will explain concepts, clarify formulas, or test your comprehension.

*Note: My answers are strictly limited to the information contained within your uploaded document or notes.*`,
          timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        };
        setMessages([welcomeMessage]);
      } else {
        setMessages(session.chatHistory);
      }
    }
  }, [session]);

  // Auto-scroll chat window to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const triggerUpdateSession = (newMessages: ChatMessage[]) => {
    setMessages(newMessages);
    const updatedSession = {
      ...session,
      chatHistory: newMessages
    };
    onUpdateSession(updatedSession);
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query) return;

    if (!textToSend) {
      setInputValue('');
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [...messages, userMessage];
    triggerUpdateSession(updatedHistory);
    setIsTyping(true);

    try {
      // Exclude greeting message from historical context sent to API
      const contextHistory = updatedHistory
        .filter((msg) => msg.id !== 'welcome')
        .map((msg) => ({
          sender: msg.sender,
          text: msg.text
        }));

      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: session.rawText,
          chatHistory: contextHistory,
          question: query
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Tutor service failed');
      }

      const replyData = await response.json();

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        sender: 'assistant',
        text: replyData.text,
        timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      };

      triggerUpdateSession([...updatedHistory, assistantMessage]);
    } catch (err: any) {
      console.error(err);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        sender: 'assistant',
        text: `Error: ${err?.message || 'Could not connect to the AI Tutor service. Please check your network connection.'}`,
        timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      };
      triggerUpdateSession([...updatedHistory, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopy = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleClear = () => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      sender: 'assistant',
      text: `Chat cleared. Ask me any question about **${session.materials.title}**, and I'll extract answers directly from the notes for you!`,
      timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    };
    triggerUpdateSession([welcomeMessage]);
  };

  // Custom study suggestions
  const suggestions = [
    `Summarize the key core concepts of this material`,
    `What are the most likely exam topics discussed here?`,
    `Can you write a short practice question testing these definitions?`
  ];

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 md:px-6 mb-16 flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-80px)]">
      
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4 mb-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100/10">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-800'}`}>
              AI Study Companion
            </h2>
            <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
              Answers derived strictly from {session.title}
            </p>
          </div>
        </div>

        <button
          onClick={handleClear}
          disabled={messages.length <= 1}
          className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
            messages.length <= 1
              ? 'opacity-30 cursor-not-allowed text-neutral-400 border-neutral-200 dark:border-neutral-800'
              : 'text-neutral-500 hover:text-red-500 border-neutral-200 dark:border-neutral-800 hover:bg-red-50 dark:hover:bg-red-950/30'
          }`}
          title="Clear Conversation"
          id="btn-clear-tutor"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Clear Chat</span>
        </button>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 select-text">
        {messages.map((msg) => {
          const isTutor = msg.sender === 'assistant';
          const isCopied = copiedId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex gap-3.5 max-w-[85%] ${
                isTutor ? 'mr-auto' : 'ml-auto flex-row-reverse'
              }`}
            >
              {/* Avatar circle */}
              <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0 border ${
                isTutor 
                  ? 'bg-indigo-50 border-indigo-100/10 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' 
                  : 'bg-neutral-100 border-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
              }`}>
                {isTutor ? <Bot className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
              </div>

              {/* Message Bubble container */}
              <div className="space-y-1">
                <div className={`p-4 rounded-2xl relative border group ${
                  isTutor
                    ? theme === 'dark'
                      ? 'bg-neutral-900 border-neutral-800 text-neutral-200'
                      : 'bg-white border-neutral-200 text-neutral-800 shadow-xs'
                    : 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                }`}>
                  
                  {/* Markdown or plain text block formatting */}
                  <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap select-text">
                    {msg.text}
                  </p>

                  {/* Message utilities (Copy) - visible on hover */}
                  {isTutor && msg.id !== 'welcome' && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="absolute bottom-2.5 right-2.5 p-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-600 md:opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Copy Tutor Response"
                      id={`btn-copy-msg-${msg.id}`}
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
                
                {/* Message Timestamp */}
                <p className={`text-[9px] text-neutral-400 font-bold px-1 ${
                  !isTutor ? 'text-right' : 'text-left'
                }`}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          );
        })}

        {/* Typing indicator bubble */}
        {isTyping && (
          <div className="flex gap-3.5 mr-auto max-w-[80%]">
            <div className="w-8.5 h-8.5 rounded-xl bg-indigo-50 border border-indigo-100/10 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Bot className="w-4.5 h-4.5" />
            </div>
            <div className={`p-4 rounded-2xl border ${
              theme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-xs'
            }`}>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested prompts Pills */}
      {messages.length <= 2 && !isTyping && (
        <div className="mb-3 shrink-0">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 px-1">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
            <span>Suggested study queries</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(sug)}
                className={`text-left px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 shadow-xs'
                }`}
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input panel */}
      <div className="shrink-0 pt-1">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isTyping}
            placeholder={`Ask about notes for "${session.title}"...`}
            className={`flex-1 px-4 py-3.5 rounded-2xl border text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
              theme === 'dark'
                ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500'
                : 'bg-white border-neutral-200 text-neutral-800 placeholder-neutral-400 shadow-xs'
            }`}
          />
          <button
            type="submit"
            disabled={isTyping || !inputValue.trim()}
            className={`p-3.5 rounded-2xl text-white shadow-md flex items-center justify-center transition-all cursor-pointer ${
              isTyping || !inputValue.trim()
                ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 shadow-none cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02]'
            }`}
            id="btn-send-tutor"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>

    </div>
  );
}
