import React, { useState } from 'react';
import {
  FileText,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  BookOpen,
  Calendar,
  Building,
  User,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { defaultRagEngine } from '../services/ragService';
import { generateGrievanceLetterApi } from '../services/api';
import { SourceReference } from '../types';

export const GrievanceFlow: React.FC = () => {
  const {
    grievanceData,
    setGrievanceData,
    setGeneratedLetter,
    setActiveTab,
    setSelectedSource,
    profile,
    t,
  } = useApp();

  // Current wizard step (1 to 5)
  // Step 1: Complainant & Society Identity
  // Step 2: Issue Category & Detailed Description
  // Step 3: Timeline & People Involved
  // Step 4: Desired Relief / Resolution
  // Step 5: Statutory Bylaw Retrieval & Review before generation
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [retrievedSources, setRetrievedSources] = useState<SourceReference[]>([]);

  // When reaching Step 5 (Review & Bylaw retrieval), run RAG search
  const handleProceedToStep5 = () => {
    const query = `${grievanceData.issueCategory} ${grievanceData.issueDescription}`;
    const results = defaultRagEngine.search(query, {
      route: 'GRIEVANCE',
      limit: 3,
    });
    const sources = defaultRagEngine.toSourceReferences(results);
    setRetrievedSources(sources);
    setGrievanceData(prev => ({ ...prev, retrievedBylaws: sources, status: 'review' }));
    setCurrentStep(5);
  };

  const handleGenerateLetter = async () => {
    setIsGenerating(true);
    try {
      const res = await generateGrievanceLetterApi(grievanceData);
      if (res.success && res.letter) {
        setGeneratedLetter(res.letter);
        setGrievanceData(prev => ({ ...prev, status: 'generated' }));
        setActiveTab('letter-view');
      }
    } catch (err) {
      console.warn('Backend generation error, using client fallback:', err);
      // Client fallback generator
      const fallbackQuery = `${grievanceData.issueCategory} ${grievanceData.issueDescription}`;
      const searchRes = defaultRagEngine.search(fallbackQuery, { route: 'GRIEVANCE', limit: 2 });
      const citations = searchRes.map(r => `${r.chunk.docTitle} - ${r.chunk.section}`);

      const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      setGeneratedLetter({
        id: `letter-${Date.now()}`,
        generatedDate: dateStr,
        recipientTitle: 'The Secretary / President & Managing Committee (Copy to: District Deputy Registrar)',
        societyName: grievanceData.societyName || 'Primary Cooperative Society',
        memberName: grievanceData.memberName || profile.name,
        subject: `Formal Grievance Petition Regarding ${grievanceData.issueCategory} Issue under Cooperative Bylaws`,
        salutation: 'Respected Office Bearers,',
        bodyParagraphs: [
          `I am writing to formally place on record a grievance regarding ${grievanceData.issueCategory.toLowerCase()} in our cooperative society.`,
          `Particulars of the issue: ${grievanceData.issueDescription}. This occurred around ${grievanceData.dateOrPeriod || 'the recent period'}. ${grievanceData.peopleOrRoleInvolved ? `Parties involved: ${grievanceData.peopleOrRoleInvolved}.` : ''}`,
          `Such actions contravene established cooperative principles and member rights under the applicable bylaws.`,
        ],
        bylawReferences: citations.length > 0 ? citations : [
          'Model Primary Cooperative Society Bylaws - Section 11: Member Rights & Democratic Governance',
          'Cooperative Grievance Redressal Rules - Rule 3: Mandatory Written Acknowledgement & 30-day Resolution',
        ],
        requestedActionList: [
          grievanceData.desiredResolution || 'Immediate rectification of the grievance and restoration of lawful rights.',
          'Provide a stamped and dated acknowledgement receipt with a unique Tracking Number.',
          'Convey written findings of the committee within 30 days as statutorily required.',
        ],
        closing: 'Thanking you,',
        rawText: '',
      });
      setGrievanceData(prev => ({ ...prev, status: 'generated' }));
      setActiveTab('letter-view');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Showcase Feature
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Legal Redressal Wizard
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            File a Formal Cooperative Grievance
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Collects essential facts, retrieves applicable bylaws, and generates an official submittable letter with PDF/TXT download.
          </p>
        </div>

        {grievanceData.status === 'generated' && (
          <button
            onClick={() => setActiveTab('letter-view')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>View Generated Letter</span>
          </button>
        )}
      </div>

      {/* Stepper Indicator */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
          <span>Step {currentStep} of 5</span>
          <span className="text-slate-800">
            {currentStep === 1 && 'Member & Society Details'}
            {currentStep === 2 && 'Issue Category & Description'}
            {currentStep === 3 && 'Timeline & Involved Roles'}
            {currentStep === 4 && 'Desired Relief / Resolution'}
            {currentStep === 5 && 'Statutory Bylaw Grounding & Review'}
          </span>
        </div>
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div
            className="bg-amber-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Forms */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        {/* STEP 1 */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-amber-600" />
              <span>Step 1: Member & Society Identification</span>
            </h3>
            <p className="text-xs text-slate-500">
              Identify the complainant and the cooperative society. This information is placed on the formal letterhead.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Complainant Full Name *
                </label>
                <input
                  id="input-grievance-name"
                  type="text"
                  required
                  value={grievanceData.memberName}
                  onChange={(e) => setGrievanceData({ ...grievanceData, memberName: e.target.value })}
                  placeholder="e.g. Ravi"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Member ID / Passbook Number (Optional)
                </label>
                <input
                  id="input-grievance-memid"
                  type="text"
                  value={grievanceData.memberIdOrNumber || ''}
                  onChange={(e) => setGrievanceData({ ...grievanceData, memberIdOrNumber: e.target.value })}
                  placeholder="e.g. MEM-8842"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cooperative Society Name *
                </label>
                <input
                  id="input-grievance-society"
                  type="text"
                  required
                  value={grievanceData.societyName}
                  onChange={(e) => setGrievanceData({ ...grievanceData, societyName: e.target.value })}
                  placeholder="e.g. Demo Dairy Cooperative Society"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Society Address / Village / District
                </label>
                <input
                  id="input-grievance-address"
                  type="text"
                  value={grievanceData.societyAddressOrPlace || ''}
                  onChange={(e) => setGrievanceData({ ...grievanceData, societyAddressOrPlace: e.target.value })}
                  placeholder="e.g. Warangal District, Telangana"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              <span>Step 2: Grievance Category & Factual Description</span>
            </h3>
            <p className="text-xs text-slate-500">
              Select the primary category and state clearly what happened.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Issue Category *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  'Election',
                  'Membership',
                  'Financial / Accounts',
                  'Management / Misgovernance',
                  'Dividend / Dues',
                  'Other',
                ].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setGrievanceData({ ...grievanceData, issueCategory: cat as any })}
                    className={`p-3 text-xs font-bold rounded-xl border transition-all text-left ${
                      grievanceData.issueCategory === cat
                        ? 'bg-amber-50 border-amber-600 text-amber-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Detailed Factual Description *
              </label>
              <textarea
                id="input-grievance-desc"
                rows={4}
                required
                value={grievanceData.issueDescription}
                onChange={(e) => setGrievanceData({ ...grievanceData, issueDescription: e.target.value })}
                placeholder="Explain what occurred in simple words (e.g., My name was omitted from provisional voter list despite meeting the 500L milk supply threshold; or committee refused to accept my nomination paper)..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              <span>Step 3: Timeline & Involved Persons / Roles</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Date or Approximate Time Period *
              </label>
              <input
                id="input-grievance-period"
                type="text"
                value={grievanceData.dateOrPeriod}
                onChange={(e) => setGrievanceData({ ...grievanceData, dateOrPeriod: e.target.value })}
                placeholder="e.g. 15th September 2026 or past 2 weeks"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                People or Roles Involved (Optional)
              </label>
              <input
                id="input-grievance-people"
                type="text"
                value={grievanceData.peopleOrRoleInvolved || ''}
                onChange={(e) => setGrievanceData({ ...grievanceData, peopleOrRoleInvolved: e.target.value })}
                placeholder="e.g. Secretary, Returning Officer, Managing Committee President"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Supporting Proof / Documents Available (Optional)
              </label>
              <input
                id="input-grievance-proof"
                type="text"
                value={grievanceData.relevantDocsDetails || ''}
                onChange={(e) => setGrievanceData({ ...grievanceData, relevantDocsDetails: e.target.value })}
                placeholder="e.g. Milk delivery passbook receipts, membership share certificate copy"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-600" />
              <span>Step 4: Desired Relief & Prayer</span>
            </h3>
            <p className="text-xs text-slate-500">
              Specify the concrete action you are demanding from the managing committee or the Registrar.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Desired Resolution / Specific Relief *
              </label>
              <textarea
                id="input-grievance-resolution"
                rows={3}
                required
                value={grievanceData.desiredResolution}
                onChange={(e) => setGrievanceData({ ...grievanceData, desiredResolution: e.target.value })}
                placeholder="e.g. Immediate restoration of my name in final voter list before polling date and disciplinary inquiry into omission..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Additional Notes / Instructions (Optional)
              </label>
              <input
                id="input-grievance-notes"
                type="text"
                value={grievanceData.additionalNotes || ''}
                onChange={(e) => setGrievanceData({ ...grievanceData, additionalNotes: e.target.value })}
                placeholder="e.g. Request urgent hearing within 7 days due to impending election"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW & STATUTORY BYLAW RETRIEVAL */}
        {currentStep === 5 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Step 5: Review Grievance & Retrieved Statutory Bylaws</span>
              </h3>
              <button
                onClick={() => setCurrentStep(1)}
                className="text-xs text-amber-700 hover:text-amber-800 font-bold underline"
              >
                Edit Details
              </button>
            </div>

            {/* Summary Card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block font-medium">Complainant:</span>
                  <span className="font-bold text-slate-900">{grievanceData.memberName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Society:</span>
                  <span className="font-bold text-slate-900">{grievanceData.societyName}</span>
                </div>
              </div>

              <div className="border-t border-slate-200/60 pt-2">
                <span className="text-slate-400 block font-medium">Issue Category:</span>
                <span className="font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded inline-block mt-0.5">
                  {grievanceData.issueCategory}
                </span>
              </div>

              <div className="border-t border-slate-200/60 pt-2">
                <span className="text-slate-400 block font-medium">Factual Narrative:</span>
                <p className="text-slate-800 font-medium leading-relaxed mt-0.5">
                  {grievanceData.issueDescription}
                </p>
              </div>

              <div className="border-t border-slate-200/60 pt-2">
                <span className="text-slate-400 block font-medium">Relief Demanded:</span>
                <p className="text-emerald-800 font-semibold leading-relaxed mt-0.5">
                  {grievanceData.desiredResolution}
                </p>
              </div>
            </div>

            {/* Retrieved Bylaws Context */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  Relevant Cooperative Bylaws Retrieved via RAG ({retrievedSources.length}):
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Grounding Citations
                </span>
              </div>

              <div className="space-y-2">
                {retrievedSources.map((src, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-emerald-950 font-bold">{src.docTitle}</strong>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
                          {src.section}
                        </span>
                      </div>
                      <p className="text-emerald-900 mt-1 line-clamp-2 leading-relaxed">
                        {src.excerpt}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedSource(src)}
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-bold underline shrink-0"
                    >
                      Inspect
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
          <button
            id="btn-grievance-back"
            type="button"
            disabled={currentStep === 1 || isGenerating}
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.backBtn}</span>
          </button>

          {currentStep < 4 && (
            <button
              id="btn-grievance-next"
              type="button"
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <span>{t.continueBtn}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {currentStep === 4 && (
            <button
              id="btn-grievance-step5"
              type="button"
              onClick={handleProceedToStep5}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <span>Review & Retrieve Bylaws</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {currentStep === 5 && (
            <button
              id="btn-grievance-generate-now"
              type="button"
              disabled={isGenerating}
              onClick={handleGenerateLetter}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-900/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? 'Generating Official Letter...' : 'Generate Grievance Letter'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
