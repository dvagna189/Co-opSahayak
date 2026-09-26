import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  CheckCircle2,
  Shield,
  Layers,
  FileText,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DEMO_KNOWLEDGE_DOCS, ALL_DEMO_CHUNKS } from '../data/demoKnowledgeBase';
import { KnowledgeChunk } from '../types';

export const KnowledgeSources: React.FC = () => {
  const { setSelectedSource, t } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string>('all');

  const filteredChunks = ALL_DEMO_CHUNKS.filter((chunk) => {
    const matchesDoc = selectedDocId === 'all' || chunk.docId === selectedDocId;
    const matchesQuery =
      chunk.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chunk.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chunk.docTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDoc && matchesQuery;
  });

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-slate-700" />
            <span>{t.knowledgeCardTitle}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Explore the indexed statutory acts and model bylaws used to ground every AI response and letter.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{ALL_DEMO_CHUNKS.length} Provisions Indexed</span>
        </div>
      </div>

      {/* Document Library Cards */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Authoritative Knowledge Base Documents ({DEMO_KNOWLEDGE_DOCS.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEMO_KNOWLEDGE_DOCS.map((doc) => (
            <div
              key={doc.id}
              onClick={() => setSelectedDocId(selectedDocId === doc.id ? 'all' : doc.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                selectedDocId === doc.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-white border-slate-200 hover:border-slate-400 text-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      selectedDocId === doc.id
                        ? 'bg-slate-800 text-slate-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {doc.docType}
                  </span>
                  {doc.isDemoData ? (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        selectedDocId === doc.id
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      DEMO BYLAWS
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        selectedDocId === doc.id
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      CENTRAL ACT
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold leading-snug mb-1">
                  {doc.title}
                </h4>
                <p
                  className={`text-xs line-clamp-2 leading-relaxed ${
                    selectedDocId === doc.id ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {doc.description}
                </p>
              </div>

              <div
                className={`mt-4 pt-3 border-t text-[11px] font-medium flex items-center justify-between ${
                  selectedDocId === doc.id ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-500'
                }`}
              >
                <span>{doc.chunks.length} Provisions</span>
                <span className="font-bold underline">
                  {selectedDocId === doc.id ? 'Show All' : 'Filter by Document'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Provision Chunks Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              id="input-search-provisions"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keywords, section number, or terms (e.g. voter, 90 days, quorum)..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          {selectedDocId !== 'all' && (
            <button
              onClick={() => setSelectedDocId('all')}
              className="text-xs text-slate-500 hover:text-slate-800 bg-slate-100 px-3 py-2 rounded-xl font-medium"
            >
              Clear Document Filter
            </button>
          )}
        </div>

        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Indexed Provisions ({filteredChunks.length})
          </span>

          {filteredChunks.map((chunk) => (
            <div
              key={chunk.id}
              className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {chunk.section}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    {chunk.docTitle}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap line-clamp-3">
                  {chunk.content}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                  <span>Source: {chunk.source}</span>
                  {chunk.chapterOrPart && <span>• Chapter: {chunk.chapterOrPart}</span>}
                </div>
              </div>

              <button
                onClick={() =>
                  setSelectedSource({
                    docTitle: chunk.docTitle,
                    docType: chunk.docType,
                    source: chunk.source,
                    section: chunk.section,
                    chapter: chunk.chapterOrPart,
                    isDemoData: chunk.isDemoData,
                    excerpt: chunk.content,
                  })
                }
                className="px-3 py-1.5 bg-white hover:bg-slate-900 hover:text-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold shrink-0 transition-all shadow-2xs"
              >
                Inspect Full Text
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
