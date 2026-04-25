import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function ChatbotModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "bot"; content: string }[]>([]);
  const [chatError, setChatError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const CHAT_API_URL = "https://andrewvelox-gucc-rag-agent.hf.space/rag/queries/ask/";

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatLoading]);

  // Auto-resize textarea based on content (Height increased from 128px to 200px)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px"; // Reset to min-height
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = scrollHeight > 200 ? "200px" : `${scrollHeight}px`;
    }
  }, [chatInput]);

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput.trim();
    setChatInput(""); 
    setChatLoading(true);
    setChatError(null);
    setChatHistory((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      const res = await fetch(CHAT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMessage }),
      });
      if (!res.ok) throw new Error("Failed to get response");
      const data = await res.json();
      setChatHistory((prev) => [...prev, { role: "bot", content: data.answer || "(No response)" }]);
    } catch (err: any) {
      setChatError("System error: Connection to agent severed.");
    } finally {
      setChatLoading(false);
    }
  };

  const clearChatHistory = () => {
    setChatHistory([]);
    setChatError(null);
    setChatInput("");
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[12000] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center transition-all sm:p-4" 
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* HEIGHT UPDATE: Changed sm:h-auto sm:max-h-[85dvh] to sm:h-[95dvh] sm:max-h-[900px] 
        This makes the modal much taller on desktop devices.
      */}
      <section className="relative flex w-full flex-col h-[100dvh] sm:h-[95dvh] sm:max-h-[900px] sm:max-w-lg sm:rounded-2xl border-t sm:border border-cyan-500/30 bg-slate-950/95 shadow-[0_0_40px_-10px_rgba(6,182,212,0.25)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <header className="flex items-center justify-between border-b border-cyan-500/20 bg-slate-900/80 px-5 py-4 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-500"></span>
            </div>
            <h3 className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-sm font-bold uppercase tracking-[0.15em] text-transparent">
              AI Agent Interface
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-full bg-slate-800/50 p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-cyan-400"
            aria-label="Close modal"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-gradient-to-b from-slate-950 to-slate-900 scroll-smooth custom-scrollbar">
          {chatHistory.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-4 opacity-60">
              <div className="rounded-full bg-cyan-500/10 p-4 border border-cyan-500/20">
                <svg className="h-8 w-8 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="text-xs font-medium tracking-widest text-cyan-400 uppercase">System Ready</div>
            </div>
          ) : (
            chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`relative px-4 py-3 max-w-[85%] text-sm leading-relaxed shadow-md ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-2xl rounded-tr-sm"
                    : "bg-slate-800 text-slate-200 rounded-2xl rounded-tl-sm border border-slate-700/50"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
          
          {chatLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-slate-700/50 bg-slate-800 px-4 py-4 shadow-md">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-500" style={{ animationDelay: "0ms" }}></span>
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-500" style={{ animationDelay: "150ms" }}></span>
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-500" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          )}
          
          {chatError && (
            <div className="flex justify-center">
              <div className="text-xs font-medium tracking-wide text-red-400 bg-red-950/40 px-4 py-2 rounded-lg border border-red-500/30">
                {chatError}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <form
          className="flex items-end gap-3 border-t border-cyan-500/20 bg-slate-900/90 p-4 pb-safe-4 backdrop-blur-md"
          onSubmit={e => { e.preventDefault(); sendChatMessage(); }}
        >
          <button
            type="button"
            title="Clear chat history"
            onClick={clearChatHistory}
            className="mb-0.5 rounded-xl p-2.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-700"
            disabled={chatLoading || chatHistory.length === 0}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          
          <textarea
            ref={textareaRef}
            className="flex-1 resize-none rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-cyan-500/50 focus:bg-slate-900 focus:ring-1 focus:ring-cyan-500/30 overflow-y-auto custom-scrollbar"
            placeholder="Initialize query..."
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            disabled={chatLoading}
            // HEIGHT UPDATE: Changed maxHeight to 200px
            style={{ minHeight: '44px', maxHeight: '200px' }}
            onKeyDown={e => { 
              if (e.key === "Enter" && !e.shiftKey) { 
                e.preventDefault(); 
                sendChatMessage(); 
              } 
            }}
          />
          
          <button
            type="submit"
            className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 hover:shadow-cyan-500/40 disabled:pointer-events-none disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            disabled={chatLoading || !chatInput.trim()}
          >
            {chatLoading ? (
               <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
            ) : (
              <svg className="h-5 w-5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
      </section>
    </div>,
    document.body
  );
}