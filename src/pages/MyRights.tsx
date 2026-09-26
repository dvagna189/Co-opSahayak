import React, { useState } from 'react';
import {
  ShieldCheck,
  Vote,
  Users,
  Eye,
  FileWarning,
  Award,
  BookOpen,
  ArrowRight,
  Search,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface RightItem {
  id: string;
  category: string;
  title: string;
  summary: string;
  statutoryDetail: string;
  bylawSection: string;
  docTitle: string;
  isDemoData: boolean;
  actionPrompt: string;
}

const RIGHTS_DATA: RightItem[] = [
  {
    id: 'r-voting',
    category: 'Voting Rights',
    title: 'One Member, One Vote (No Proxy)',
    summary: 'Every active member holds exactly one equal vote, irrespective of share capital ownership.',
    statutoryDetail: 'Under Section 11 of Model Bylaws, cooperative democracy enforces strict equality: one member gets one vote. Voting by proxy is prohibited in primary societies to protect members from elite capture. Disqualification occurs only upon loan defaults exceeding 90 days or lack of minimum active patronage.',
    bylawSection: 'Section 11: One Member One Vote Principle',
    docTitle: 'Model Primary Cooperative Society Bylaws (Standard Tier-1)',
    isDemoData: true,
    actionPrompt: 'Check if you meet active patronage criteria for upcoming elections.',
  },
  {
    id: 'r-records-audit',
    category: 'Information & Accounts',
    title: 'Right to Inspect Accounts, Audit Reports & Register',
    summary: 'Members can inspect the member register, balance sheets, audit reports, and AGM minutes during business hours without fee.',
    statutoryDetail: 'Under Section 38 of the Multi-State Cooperative Societies Act, members have the statutory right to inspect society books, financial balance sheets, and audit observations free of charge. Certified copies must be delivered within 15 days upon standard copying fee not exceeding ₹5/page.',
    bylawSection: 'Section 38: Right to Inspect Books and Records',
    docTitle: 'Multi-State Cooperative Societies Act (Key Member Rights & Audits)',
    isDemoData: false,
    actionPrompt: 'Request inspection of the annual audit report if you suspect discrepancies.',
  },
  {
    id: 'r-electoral-objection',
    category: 'Elections & Governance',
    title: 'Statutory Right to Object to Voter Roll Omissions',
    summary: 'Members have a guaranteed 10-day window to challenge omitted names or wrongful inclusions on the provisional voter list.',
    statutoryDetail: 'Rule 7 of State Cooperative Election Rules requires publication of the provisional list 60 days before election. Any omitted member can lodge an objection before the Returning Officer, who must decide all claims within 7 days thereafter.',
    bylawSection: 'Rule 7: Electoral Roll Publication & Objections',
    docTitle: 'State Cooperative Societies Election Rules & Procedures',
    isDemoData: true,
    actionPrompt: 'Inspect the notice board 60 days prior to election to confirm your enrollment.',
  },
  {
    id: 'r-grievance-ack',
    category: 'Grievance & Justice',
    title: 'Right to Written Acknowledgement & 30-Day Decision',
    summary: 'Every complaint submitted must receive a dated, stamped acknowledgement receipt and a formal response within 30 days.',
    statutoryDetail: 'Rule 3 of Cooperative Grievance Rules establishes that primary societies must maintain an official Grievance Register and issue a unique Tracking Number. The Managing Committee must table the grievance at its next meeting and provide a written response within 30 days.',
    bylawSection: 'Rule 3: Internal Grievance Cell & Acknowledgement Mandate',
    docTitle: 'Cooperative Grievance Redressal & Member Dispute Rules',
    isDemoData: true,
    actionPrompt: 'Always demand a stamped acknowledgement receipt when submitting petitions.',
  },
  {
    id: 'r-no-retaliation',
    category: 'Protection & Responsibilities',
    title: 'Protection from Retaliatory Expulsion or Suspension',
    summary: 'Societies cannot suspend membership or withhold milk/crop payments because a member lodged a grievance.',
    statutoryDetail: 'Rule 14 explicitly protects whistleblower members: expulsion requires a 3/4th supermajority resolution of the General Body and prior written approval of the Registrar of Cooperative Societies. Arbitrary executive suspensions are null and void.',
    bylawSection: 'Rule 14: Prohibition of Retaliatory Expulsion',
    docTitle: 'Cooperative Grievance Redressal & Member Dispute Rules',
    isDemoData: true,
    actionPrompt: 'If facing retaliatory suspension, file an urgent appeal with the Assistant Registrar.',
  },
  {
    id: 'r-ombudsman-appeal',
    category: 'Grievance & Justice',
    title: 'Statutory Escalation to the Cooperative Ombudsman',
    summary: 'Unresolved disputes regarding membership, dividends, or election irregularities can be appealed to the Ombudsman.',
    statutoryDetail: 'Section 45 of the MSCS Act 2023 Amendment creates an independent Ombudsman to adjudicate complaints within 60 days. Complainants may submit physical or online petitions with supporting receipts.',
    bylawSection: 'Section 45: Cooperative Ombudsman for Member Grievances',
    docTitle: 'Multi-State Cooperative Societies Act (Key Member Rights & Audits)',
    isDemoData: false,
    actionPrompt: 'Escalate to the Ombudsman if the internal committee ignores your grievance.',
  },
];

export const MyRights: React.FC = () => {
  const { setSelectedSource, setActiveTab, t } = useApp();
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Voting Rights', 'Information & Accounts', 'Elections & Governance', 'Grievance & Justice', 'Protection & Responsibilities'];

  const filteredRights = RIGHTS_DATA.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.bylawSection.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple-600" />
            <span>{t.rightsCardTitle} & Responsibilities</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Grounded in Model Cooperative Bylaws, Election Regulations, and the Multi-State Cooperative Societies Act.
          </p>
        </div>

        <button
          id="btn-rights-ask-question"
          onClick={() => setActiveTab('ask')}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 shrink-0 transition-all"
        >
          <span>Ask Legal Question</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            id="input-search-rights"
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search rights by keyword (e.g. audit, vote, objection, expulsion)..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Rights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRights.map((item) => (
          <div
            key={item.id}
            id={`right-card-${item.id}`}
            className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                  {item.category}
                </span>

                {item.isDemoData ? (
                  <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                    DEMO MODEL
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-medium">
                    STATUTORY ACT
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                {item.title}
              </h3>

              <p className="text-xs font-semibold text-slate-700 mb-2">
                {item.summary}
              </p>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-600 leading-relaxed mb-3">
                {item.statutoryDetail}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() =>
                  setSelectedSource({
                    docTitle: item.docTitle,
                    docType: item.isDemoData ? 'Bylaw' : 'Act',
                    source: 'Grounded Statutory Document Repository',
                    section: item.bylawSection,
                    isDemoData: item.isDemoData,
                    excerpt: item.statutoryDetail,
                  })
                }
                className="text-xs text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>View Citation</span>
              </button>

              <button
                onClick={() => setActiveTab('ask')}
                className="text-xs text-slate-500 hover:text-purple-700 font-medium flex items-center gap-1"
              >
                <span>Ask AI</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
