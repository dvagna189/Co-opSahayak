import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  X,
  Search,
  CheckCircle2,
  Trash2,
  ArrowRight,
  Sparkles,
  BookOpen,
  Calendar,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Layers,
  Send,
  RotateCcw,
  Check,
  FilePlus,
  Eye,
  FileCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { documentService, extractTextFromFile, isBinaryGarble } from '../../services/documentService';
import { DocumentCategory, UploadedDocument } from '../../types';
import { sendChatMessage } from '../../services/api';

export const DocumentUploadModal: React.FC = () => {
  const {
    isDocUploadModalOpen,
    closeDocUploadModal,
    uploadedDocuments,
    activeDocumentId,
    setActiveDocumentId,
    uploadDocument,
    removeDocument,
    setActiveTab,
    addMessage,
    profile,
    t,
  } = useApp();

  const [activeView, setActiveView] = useState<'browse' | 'upload' | 'paste'>('browse');
  const [selectedDocId, setSelectedDocId] = useState<string>(activeDocumentId || uploadedDocuments[0]?.id || '');

  // Form state for uploading/pasting
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<DocumentCategory>('AGM / Meeting Notice');
  const [pastedText, setPastedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Inline Document Q&A state
  const [queryInput, setQueryInput] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [inlineAnswer, setInlineAnswer] = useState<{
    query: string;
    response: string;
    sources: any[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isDocUploadModalOpen) return null;

  const currentDoc = uploadedDocuments.find(d => d.id === (selectedDocId || activeDocumentId)) || uploadedDocuments[0];

  const handleSelectDoc = (id: string) => {
    setSelectedDocId(id);
    setActiveDocumentId(id);
    setInlineAnswer(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const processSelectedFile = async (file: File) => {
    setUploadError('');
    setIsProcessing(true);

    const fileName = file.name;
    const fileExt = fileName.split('.').pop()?.toLowerCase() || 'txt';

    try {
      const textContent = await extractTextFromFile(file);
      if (!textContent || !textContent.trim()) {
        setUploadError('The selected file appears to be empty or contains no readable text.');
        setIsProcessing(false);
        return;
      }

      if (isBinaryGarble(textContent)) {
        const cleaned = textContent
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFD]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        setPastedText(cleaned.length > 30 ? cleaned : '');
        setDocTitle(fileName.replace(/\.[^/.]+$/, ''));
        setActiveView('paste');
        setUploadError(`Notice: "${fileName}" contains complex binary formatting. We have imported its readable text into this editor so you can review and save.`);
        setIsProcessing(false);
        return;
      }

      const newDoc = documentService.parseAndIndexDocument({
        name: fileName,
        rawText: textContent,
        category: docCategory,
        fileType: fileExt,
        fileSizeBytes: file.size,
      });

      uploadDocument(newDoc);
      setSelectedDocId(newDoc.id);
      setActiveDocumentId(newDoc.id);
      setUploadSuccessMessage(`Successfully extracted and indexed "${fileName}" (${newDoc.chunks.length} clauses)!`);
      setIsProcessing(false);
      setActiveView('browse');

      setTimeout(() => {
        setUploadSuccessMessage('');
      }, 5000);
    } catch (err: any) {
      setUploadError(`Failed to process document: ${err.message || 'Unknown error'}`);
      setIsProcessing(false);
    }
  };

  const handlePastedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim()) {
      setUploadError('Please paste or type document text.');
      return;
    }

    setIsProcessing(true);
    setUploadError('');

    try {
      const title = docTitle.trim() || `Society Document (${docCategory})`;
      const newDoc = documentService.parseAndIndexDocument({
        name: title,
        rawText: pastedText,
        category: docCategory,
        fileType: 'txt',
        fileSizeBytes: new Blob([pastedText]).size,
      });

      uploadDocument(newDoc);
      setSelectedDocId(newDoc.id);
      setActiveDocumentId(newDoc.id);
      setUploadSuccessMessage(`Successfully created and indexed "${title}"!`);
      setPastedText('');
      setDocTitle('');
      setIsProcessing(false);
      setActiveView('browse');

      setTimeout(() => {
        setUploadSuccessMessage('');
      }, 4000);
    } catch (err: any) {
      setUploadError(`Error processing pasted document: ${err.message}`);
      setIsProcessing(false);
    }
  };

  const handleAskQuestion = async (questionText?: string) => {
    const q = (questionText || queryInput).trim();
    if (!q || !currentDoc || isAnswering) return;

    setQueryInput('');
    setIsAnswering(true);

    try {
      // Create targeted document context
      const docContext = `
DOCUMENT NAME: ${currentDoc.name}
CATEGORY: ${currentDoc.category}
KEY FINDINGS:
${currentDoc.keyFindings.map(k => `- ${k}`).join('\n')}

DOCUMENT CONTENT EXCERPTS:
${currentDoc.rawText.substring(0, 3000)}
`;

      const response = await sendChatMessage({
        query: `${q} (Answer specifically using the uploaded document: "${currentDoc.name}")`,
        history: [],
        profile,
        language: profile.responseLanguage || 'en',
        documentContext: {
          id: currentDoc.id,
          name: currentDoc.name,
          rawText: currentDoc.rawText,
          fullText: currentDoc.rawText,
          textSnippet: currentDoc.rawText,
          chunks: currentDoc.chunks,
        },
      });

      setInlineAnswer({
        query: q,
        response: response.response,
        sources: response.sources || currentDoc.chunks.slice(0, 2).map(c => ({
          docTitle: currentDoc.name,
          docType: currentDoc.category,
          section: c.section,
          excerpt: c.content,
        })),
      });
    } catch (err: any) {
      // Resilient deterministic client-side search fallback
      const searchRes = documentService.searchUploadedDocs(q, currentDoc.id);
      if (searchRes.length === 0) {
        const notFoundText = profile.responseLanguage === 'te'
          ? `మీరు అడిగిన సమాచారం మీరు అప్‌లోడ్ చేసిన "${currentDoc.name}" పత్రంలో అందుబాటులో లేదు.`
          : profile.responseLanguage === 'hi'
          ? `यह जानकारी आपके द्वारा अपलोड किए गए दस्तावेज़ "${currentDoc.name}" में उपलब्ध नहीं है।`
          : `This information is not present in the uploaded document "${currentDoc.name}".`;
        
        setInlineAnswer({
          query: q,
          response: notFoundText,
          sources: [
            {
              docTitle: currentDoc.name,
              docType: currentDoc.category,
              section: 'Document Verification',
              excerpt: 'Information not found in document content.',
            },
          ],
        });
      } else {
        const topChunk = searchRes[0]?.chunk || currentDoc.chunks[0];
        setInlineAnswer({
          query: q,
          response: profile.responseLanguage === 'te'
            ? `మీరు అప్‌లోడ్ చేసిన "${currentDoc.name}" పత్రం ప్రకారం:\n\n${topChunk?.content || currentDoc.summary}`
            : profile.responseLanguage === 'hi'
            ? `आपके द्वारा अपलोड किए गए दस्तावेज़ "${currentDoc.name}" के अनुसार:\n\n${topChunk?.content || currentDoc.summary}`
            : `According to "${currentDoc.name}":\n\n${topChunk?.content || currentDoc.summary}`,
          sources: [
            {
              docTitle: currentDoc.name,
              docType: currentDoc.category,
              section: topChunk?.section || 'Document Content',
              excerpt: topChunk?.content?.substring(0, 200) || '',
            },
          ],
        });
      }
    } finally {
      setIsAnswering(false);
    }
  };

  const handleContinueInChat = () => {
    if (!currentDoc) return;
    setActiveDocumentId(currentDoc.id);
    closeDocUploadModal();
    setActiveTab('ask');

    if (inlineAnswer) {
      addMessage({
        id: `msg-doc-user-${Date.now()}`,
        sender: 'user',
        text: inlineAnswer.query,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        documentId: currentDoc.id,
        documentName: currentDoc.name,
      });

      addMessage({
        id: `msg-doc-bot-${Date.now() + 1}`,
        sender: 'assistant',
        text: inlineAnswer.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        route: 'DOCUMENT_QA',
        sources: inlineAnswer.sources,
        documentId: currentDoc.id,
        documentName: currentDoc.name,
        suggestedFollowups: currentDoc.suggestedQuestions.slice(0, 3),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md transition-all">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Member Document Q&A & Uploads</span>
                <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                  {uploadedDocuments.length} Indexed
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Ask questions grounded directly in your uploaded bylaws, notices, bills, or passbooks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex bg-slate-200 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveView('browse')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeView === 'browse'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Documents ({uploadedDocuments.length})
              </button>
              <button
                onClick={() => setActiveView('upload')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeView === 'upload'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upload File
              </button>
              <button
                onClick={() => setActiveView('paste')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeView === 'paste'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paste Notice Text
              </button>
            </div>

            <button
              id="btn-close-doc-modal"
              onClick={closeDocUploadModal}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success / Error Alerts */}
        {uploadSuccessMessage && (
          <div className="bg-emerald-50 text-emerald-800 border-b border-emerald-200 px-6 py-2 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{uploadSuccessMessage}</span>
          </div>
        )}
        {uploadError && (
          <div className="bg-red-50 text-red-700 border-b border-red-200 px-6 py-2 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Mobile View Switcher */}
        <div className="flex sm:hidden border-b border-slate-200 bg-slate-100 p-1.5 text-xs font-semibold">
          <button
            onClick={() => setActiveView('browse')}
            className={`flex-1 py-1.5 text-center rounded-lg ${
              activeView === 'browse' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            My Docs ({uploadedDocuments.length})
          </button>
          <button
            onClick={() => setActiveView('upload')}
            className={`flex-1 py-1.5 text-center rounded-lg ${
              activeView === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Upload
          </button>
          <button
            onClick={() => setActiveView('paste')}
            className={`flex-1 py-1.5 text-center rounded-lg ${
              activeView === 'paste' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Paste Text
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {activeView === 'browse' ? (
            <>
              {/* Document List Sidebar */}
              <div className="w-full md:w-80 border-r border-slate-200 bg-slate-50/70 p-4 overflow-y-auto shrink-0 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Available Documents
                  </span>
                  <button
                    onClick={() => setActiveView('upload')}
                    className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <FilePlus className="w-3.5 h-3.5" />
                    <span>Upload New</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {uploadedDocuments.map((doc) => {
                    const isSelected = doc.id === currentDoc?.id;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => handleSelectDoc(doc.id)}
                        className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-white border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                            : 'bg-white hover:bg-slate-100/80 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5 mb-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 truncate">
                            {doc.category}
                          </span>
                          {doc.isSample ? (
                            <span className="text-[9px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded">
                              SAMPLE
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeDocument(doc.id);
                              }}
                              className="text-slate-400 hover:text-red-500 p-0.5"
                              title="Delete document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight">
                          {doc.name}
                        </h4>

                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                          <span>{doc.fileSize}</span>
                          <span>{doc.chunks.length} Clauses</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Document Details & Q&A Panel */}
              {currentDoc ? (
                <div className="flex-1 p-5 overflow-y-auto space-y-5">
                  {/* Selected Document Header */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {currentDoc.category}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {currentDoc.fileSize} • Uploaded: {currentDoc.uploadedAt}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {currentDoc.name}
                      </h3>
                    </div>

                    <button
                      onClick={handleContinueInChat}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0"
                    >
                      <span>Ask in Full Chat</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Key Highlights / Findings */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Extracted Key Findings & Data</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentDoc.keyFindings.map((finding, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-800 flex items-start gap-2 shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{finding}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ask Question Box against this document */}
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-emerald-700" />
                        <span>Ask a Question from This Document</span>
                      </span>
                      <span className="text-[11px] text-emerald-700 font-medium">
                        Language: {profile.responseLanguage.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={queryInput}
                        onChange={(e) => setQueryInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAskQuestion();
                        }}
                        placeholder={`Ask anything about "${currentDoc.name}"...`}
                        className="flex-1 bg-white border border-emerald-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        onClick={() => handleAskQuestion()}
                        disabled={!queryInput.trim() || isAnswering}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                      >
                        {isAnswering ? (
                          <Sparkles className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>Ask</span>
                      </button>
                    </div>

                    {/* Suggested Questions */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                        Quick Questions for This Document:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {currentDoc.suggestedQuestions.map((sq, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleAskQuestion(sq)}
                            className="text-xs bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-lg transition-all text-left font-medium"
                          >
                            {sq}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Inline Answer Output */}
                    {inlineAnswer && (
                      <div className="mt-3 pt-3 border-t border-emerald-200/80 bg-white rounded-xl p-4 border shadow-2xs space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span>Q: "{inlineAnswer.query}"</span>
                          <button
                            onClick={handleContinueInChat}
                            className="text-emerald-700 hover:underline flex items-center gap-1 text-[11px]"
                          >
                            <span>Open in Chat</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {inlineAnswer.response}
                        </p>
                        {inlineAnswer.sources.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                            <BookOpen className="w-3 h-3 text-emerald-600" />
                            <span>Cited:</span>
                            {inlineAnswer.sources.map((s, idx) => (
                              <span
                                key={idx}
                                className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[10px]"
                              >
                                {s.section || s.docTitle}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Document Raw Excerpts / Provisions */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                        <span>Indexed Document Clauses ({currentDoc.chunks.length})</span>
                      </h4>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {currentDoc.chunks.map((chunk) => (
                        <div
                          key={chunk.id}
                          className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-800">
                              {chunk.section}
                            </span>
                            <span className="text-slate-400 font-mono">
                              Page {chunk.pageNumber}
                            </span>
                          </div>
                          <p className="text-slate-600 leading-relaxed font-mono whitespace-pre-wrap text-[11px]">
                            {chunk.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <FileText className="w-12 h-12 mb-3 stroke-1 text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">No document selected</p>
                  <p className="text-xs text-slate-400 mt-1">Select a document from the left or upload a new one.</p>
                </div>
              )}
            </>
          ) : activeView === 'upload' ? (
            /* Upload File View */
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              <div className="max-w-2xl mx-auto space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Upload Society Document or Notice
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Upload bylaws, AGM notice, maintenance invoice, election notification, or passbook.
                    Accepted formats: .txt, .pdf, .docx, .md, .csv, .json.
                  </p>
                </div>

                {/* Category selector */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Document Category:
                  </label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value as DocumentCategory)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="AGM / Meeting Notice">AGM / Meeting Notice</option>
                    <option value="Society Bylaws">Society Bylaws</option>
                    <option value="Maintenance Bill / Accounts">Maintenance Bill / Accounts</option>
                    <option value="Election Notice">Election Notice</option>
                    <option value="Share Certificate / Passbook">Share Certificate / Passbook</option>
                    <option value="Grievance / Dispute">Grievance / Dispute</option>
                    <option value="Other">Other Cooperative Document</option>
                  </select>
                </div>

                {/* Drag and drop zone */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/30 rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.pdf,.docx,.doc,.md,.json,.csv,.rtf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Click to choose file or drag & drop here
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Supports Text files, PDF, Word documents, Markdown, CSV
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-xs"
                  >
                    Browse Files
                  </button>
                </div>

                {/* Preloaded Sample Document Quick-Loaders */}
                <div className="pt-3 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Or select a preloaded sample document to test:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDocId('doc-sample-agm-notice');
                        setActiveDocumentId('doc-sample-agm-notice');
                        setActiveView('browse');
                      }}
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-left transition-all text-xs"
                    >
                      <span className="font-bold text-slate-800 block truncate">
                        Adarsh CHS AGM Notice & Levy
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        Includes Quorum, ₹18.5k levy, 18% default interest
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDocId('doc-sample-pacs-ledger');
                        setActiveDocumentId('doc-sample-pacs-ledger');
                        setActiveView('browse');
                      }}
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-left transition-all text-xs"
                    >
                      <span className="font-bold text-slate-800 block truncate">
                        Sri Lakshmi PACS Member Passbook
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        KCC crop loan, 4% interest, fertilizer quota
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Paste Text View */
            <div className="flex-1 p-6 overflow-y-auto">
              <form onSubmit={handlePastedSubmit} className="max-w-2xl mx-auto space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Paste Notice, Circular, or WhatsApp Message
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Have a printed society notice or circular from your secretary? Paste the text below to analyze and ask questions.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Document Title / Subject:
                    </label>
                    <input
                      type="text"
                      required
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      placeholder="e.g. Society Notice regarding Lift Maintenance"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Document Category:
                    </label>
                    <select
                      value={docCategory}
                      onChange={(e) => setDocCategory(e.target.value as DocumentCategory)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    >
                      <option value="AGM / Meeting Notice">AGM / Meeting Notice</option>
                      <option value="Society Bylaws">Society Bylaws</option>
                      <option value="Maintenance Bill / Accounts">Maintenance Bill / Accounts</option>
                      <option value="Election Notice">Election Notice</option>
                      <option value="Share Certificate / Passbook">Share Certificate / Passbook</option>
                      <option value="Grievance / Dispute">Grievance / Dispute</option>
                      <option value="Other">Other Cooperative Document</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Document Text Content:
                  </label>
                  <textarea
                    rows={8}
                    required
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Paste the circular text, resolution clauses, agenda points, or rules here..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-400">
                    Text will be indexed into clauses for instant AI grounding.
                  </span>
                  <button
                    type="submit"
                    disabled={isProcessing || !pastedText.trim()}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    {isProcessing ? (
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Index & Start Asking</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Your uploaded documents are securely processed and grounded in your session.</span>
          <button
            id="btn-doc-modal-done"
            onClick={closeDocUploadModal}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium transition-all"
          >
            {t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
