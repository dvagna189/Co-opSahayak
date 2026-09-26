import React from 'react';
import { X, BookOpen, Shield, CheckCircle2, ExternalLink } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SourceCitationModal: React.FC = () => {
  const { selectedSource, setSelectedSource, t } = useApp();

  if (!selectedSource) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs transition-all">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                {t.sourcesLabel}
              </h3>
              <p className="text-xs text-slate-500">
                Grounding Document Reference
              </p>
            </div>
          </div>
          <button
            id="btn-close-source-modal"
            onClick={() => setSelectedSource(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-block mb-1">
                {selectedSource.docType}
              </span>
              <h4 className="text-base font-bold text-slate-900 leading-snug">
                {selectedSource.docTitle}
              </h4>
              <p className="text-xs font-semibold text-slate-600 mt-1">
                {selectedSource.section}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 block font-medium">Chapter / Part:</span>
              <span className="font-semibold text-slate-700">{selectedSource.chapter || 'General'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Authoritative Source:</span>
              <span className="font-semibold text-slate-700">{selectedSource.source}</span>
            </div>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-700 block mb-1">
              Statutory Text / Bylaw Provision:
            </span>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono leading-relaxed whitespace-pre-wrap selection:bg-emerald-500">
              {selectedSource.excerpt}
            </div>
          </div>

          <div className="text-xs text-slate-500 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              This text was retrieved directly from the indexed cooperative knowledge repository to ground the AI's explanation.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            id="btn-source-modal-close"
            onClick={() => setSelectedSource(null)}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-all"
          >
            {t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
