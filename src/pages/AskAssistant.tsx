import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  UploadCloud,
  Mic,
  FileText,
  Trash2,
  Sparkles,
  BookOpen,
  HelpCircle,
  RotateCcw,
  ArrowRight,
  Shield,
  CheckCircle2,
  AlertCircle,
  Compass,
  FileCheck,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sendChatMessage } from '../services/api';
import { Message, QueryRoute } from '../types';

export const AskAssistant: React.FC = () => {
  const {
    messages,
    addMessage,
    clearMessages,
    isChatLoading,
    setIsChatLoading,
    chatStatus,
    setChatStatus,
    profile,
    openDocUploadModal,
    openVoiceModal,
    uploadedDocuments,
    activeDocumentId,
    setActiveDocumentId,
    activeDocument,
    setSelectedSource,
    t,
  } = useApp();

  const [inputQuery, setInputQuery] = useState('');
  const [activeRoute, setActiveRoute] = useState<QueryRoute | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isChatLoading, chatStatus]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isChatLoading) return;

    setInputQuery('');

    // Append user message
    const userMsg: Message = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: profile.responseLanguage,
      documentId: activeDocument?.id,
      documentName: activeDocument?.name,
    };
    addMessage(userMsg);

    setIsChatLoading(true);
    setChatStatus(
      activeDocument
        ? `Grounding query in "${activeDocument.name}"...`
        : 'Classifying query and routing...'
    );

    // Progress updates
    const timer1 = setTimeout(() => {
      setChatStatus(
        activeDocument
          ? 'Extracting relevant clauses & figures from document...'
          : 'Searching verified cooperative bylaws & acts...'
      );
    }, 600);
    const timer2 = setTimeout(() => {
      setChatStatus(`Formulating grounded response in ${profile.responseLanguage.toUpperCase()}...`);
    }, 1200);

    try {
      const result = await sendChatMessage({
        query: textToSend,
        history: messages,
        profile,
        language: profile.responseLanguage,
        documentContext: activeDocument
          ? {
              id: activeDocument.id,
              name: activeDocument.name,
              rawText: activeDocument.rawText,
              fullText: activeDocument.rawText,
              textSnippet: activeDocument.rawText,
              chunks: activeDocument.chunks,
            }
          : undefined,
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      setActiveRoute(result.route);

      const botMsg: Message = {
        id: `msg-bot-${Date.now()}`,
        sender: 'assistant',
        text: result.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        route: result.route,
        sources: result.sources,
        toolsUsed: result.toolsUsed,
        suggestedFollowups:
          result.suggestedFollowups || (activeDocument ? activeDocument.suggestedQuestions.slice(0, 3) : undefined),
        language: profile.responseLanguage,
        documentId: activeDocument?.id,
        documentName: activeDocument?.name,
      };

      addMessage(botMsg);
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      const errorMsg: Message = {
        id: `msg-err-${Date.now()}`,
        sender: 'assistant',
        text: `Error connecting to helpdesk engine: ${err.message || 'Unknown network error'}. Please retry.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      addMessage(errorMsg);
    } finally {
      setIsChatLoading(false);
      setChatStatus('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto bg-white border-x border-slate-200">
      {/* Sub-header Bar with Document Switcher */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-slate-200 bg-slate-50/90 flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Document Context Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>Target Context:</span>
          </span>

          <select
            id="select-chat-doc-context"
            value={activeDocumentId || 'all'}
            onChange={(e) => setActiveDocumentId(e.target.value === 'all' ? null : e.target.value)}
            className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer max-w-[260px] truncate"
          >
            <option value="all">Statutory Acts & Model Bylaws (General)</option>
            {uploadedDocuments.map((doc) => (
              <option key={doc.id} value={doc.id}>
                📄 {doc.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => openDocUploadModal()}
            className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1"
            title="Upload or inspect society documents"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Manage Docs ({uploadedDocuments.length})</span>
          </button>

          {activeDocument && (
            <span className="text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-medium hidden md:inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Answers strictly from this doc</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono uppercase text-[11px]">
            {profile.responseLanguage}
          </span>
          <button
            id="btn-clear-chat"
            onClick={clearMessages}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-all"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.clearChatBtn}</span>
          </button>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isUser
                    ? 'bg-slate-800 text-white'
                    : 'bg-emerald-600 text-white shadow-sm'
                }`}
              >
                {isUser ? profile.name.charAt(0) || 'U' : <Sparkles className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3 leading-relaxed text-sm ${
                  isUser
                    ? 'bg-emerald-700 text-white rounded-tr-none'
                    : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none'
                }`}
              >
                {/* Agent Classification Header / Document Grounding tag */}
                {!isUser && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      {msg.documentName ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md text-[11px]">
                          <FileCheck className="w-3 h-3 text-teal-600" />
                          Document: {msg.documentName}
                        </span>
                      ) : (
                        msg.route && (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md text-[11px]">
                            <Compass className="w-3 h-3 text-emerald-600" />
                            Routed: {msg.route}
                          </span>
                        )
                      )}

                      {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                        <span className="text-[11px] font-mono text-slate-500">
                          {msg.toolsUsed.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* User query document tag if applicable */}
                {isUser && msg.documentName && (
                  <div className="text-[11px] text-emerald-200 flex items-center gap-1 pb-1 border-b border-emerald-600/60">
                    <FileText className="w-3 h-3" />
                    <span>Against: {msg.documentName}</span>
                  </div>
                )}

                {/* Message Text */}
                <div className="whitespace-pre-wrap leading-relaxed font-normal">
                  {msg.text}
                </div>

                {/* Grounding Sources Badge & Links */}
                {!isUser && msg.sources && msg.sources.length > 0 && (
                  <div className="pt-3 border-t border-slate-200/80">
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 mb-2">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                      {t.sourcesLabel} ({msg.sources.length}):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((src, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedSource(src)}
                          className="text-left text-xs bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-400 p-2 rounded-xl transition-all shadow-2xs"
                        >
                          <span className="font-bold text-slate-900 block truncate max-w-[220px]">
                            {src.section || src.docTitle}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate max-w-[220px]">
                            {src.docTitle}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested followups */}
                {!isUser && msg.suggestedFollowups && msg.suggestedFollowups.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-2">
                    {msg.suggestedFollowups.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(q)}
                        className="text-xs font-medium text-emerald-800 bg-white hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1"
                      >
                        <span>{q}</span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="text-[10px] text-right opacity-60">
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading / Multi-step Orchestration State */}
        {isChatLoading && (
          <div className="flex gap-3 max-w-2xl mr-auto">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{chatStatus || 'Processing your request...'}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Checking bylaws, verifying document clauses, and grounding with verified knowledge.
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Active Document Context Pill Banner above input */}
      {activeDocument ? (
        <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>
              Querying Document: <strong>{activeDocument.name}</strong> ({activeDocument.category})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openDocUploadModal(activeDocument.id)}
              className="text-emerald-700 hover:underline font-bold text-[11px]"
            >
              View Document Details
            </button>
            <button
              onClick={() => setActiveDocumentId(null)}
              className="p-1 rounded-md text-emerald-700 hover:bg-emerald-200/60"
              title="Clear document context to query general bylaws"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      {/* Suggested Quick Questions for Active Document */}
      {activeDocument && activeDocument.suggestedQuestions.length > 0 && (
        <div className="px-4 py-1.5 bg-slate-50 border-t border-slate-200 flex items-center gap-2 overflow-x-auto text-xs whitespace-nowrap">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Suggested:
          </span>
          {activeDocument.suggestedQuestions.map((sq, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(sq)}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 rounded-lg text-[11px] transition-all shrink-0"
            >
              {sq}
            </button>
          ))}
        </div>
      )}

      {/* Disclaimer strip */}
      <div className="px-4 py-1 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-500 truncate">
        {t.disclaimerText}
      </div>

      {/* Input Box Area */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        <div className="flex items-end gap-2 bg-slate-50 border border-slate-300 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
          <textarea
            id="input-chat-query"
            rows={2}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              activeDocument
                ? `Ask anything about "${activeDocument.name}"...`
                : t.typePlaceholder
            }
            className="flex-1 bg-transparent resize-none px-3 py-1.5 text-sm text-slate-900 focus:outline-none placeholder:text-slate-400"
          />

          {/* Document Upload / Attach Button */}
          <button
            id="btn-chat-upload-doc"
            type="button"
            onClick={() => openDocUploadModal()}
            className="p-2.5 rounded-xl text-slate-600 hover:text-emerald-700 hover:bg-slate-200/70 transition-all relative"
            title="Upload or Attach Document to Query"
          >
            <UploadCloud className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-emerald-600 text-white rounded-full text-[9px] w-4 h-4 flex items-center justify-center font-bold">
              {uploadedDocuments.length}
            </span>
          </button>

          {/* Voice Input Mic Button */}
          <button
            id="btn-chat-voice"
            type="button"
            onClick={() => openVoiceModal()}
            className="p-2.5 rounded-xl text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-all"
            title="Multilingual Voice Assistant"
          >
            <Mic className="w-5 h-5" />
          </button>

          <button
            id="btn-chat-send"
            type="button"
            disabled={!inputQuery.trim() || isChatLoading}
            onClick={() => handleSend()}
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold transition-all shadow-sm flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
