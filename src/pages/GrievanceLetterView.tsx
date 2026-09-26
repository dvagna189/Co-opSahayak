import React, { useState } from 'react';
import {
  Download,
  FileText,
  Printer,
  Edit3,
  RotateCcw,
  Check,
  ArrowLeft,
  Share2,
  BookOpen,
  Building,
  Calendar,
  User,
  Shield,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { downloadGrievancePdf, downloadGrievanceTxt } from '../services/pdfGenerator';
import { GrievanceLetter } from '../types';

export const GrievanceLetterView: React.FC = () => {
  const { generatedLetter, setGeneratedLetter, grievanceData, setGrievanceData, setActiveTab, profile, t } = useApp();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editableLetter, setEditableLetter] = useState<GrievanceLetter | null>(generatedLetter);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleStartNewGrievance = () => {
    setGrievanceData({
      memberName: profile.name || 'Member',
      memberIdOrNumber: '',
      societyName: profile.societyName || 'Primary Cooperative Society',
      societyAddressOrPlace: profile.state || '',
      issueCategory: 'Membership',
      issueDescription: '',
      dateOrPeriod: '',
      peopleOrRoleInvolved: '',
      desiredResolution: '',
      additionalNotes: '',
      status: 'draft',
    });
    setGeneratedLetter(null);
    setActiveTab('grievance');
  };

  if (!generatedLetter) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
        <FileText className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">No Grievance Letter Generated Yet</h3>
        <p className="text-xs text-slate-500">
          Please complete the guided grievance workflow to generate an official letter grounded in cooperative bylaws.
        </p>
        <button
          onClick={() => setActiveTab('grievance')}
          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all"
        >
          Start Grievance Wizard
        </button>
      </div>
    );
  }

  const current = isEditing ? editableLetter || generatedLetter : generatedLetter;

  const handleSaveEdits = () => {
    if (editableLetter) {
      setGeneratedLetter(editableLetter);
    }
    setIsEditing(false);
  };

  const handleDownloadPdf = () => {
    downloadGrievancePdf(current);
    setDownloadSuccess('PDF downloaded successfully');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleDownloadTxt = () => {
    downloadGrievanceTxt(current);
    setDownloadSuccess('TXT downloaded successfully');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            id="btn-letter-back"
            onClick={() => setActiveTab('grievance')}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all"
            title="Back to Grievance Wizard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Formal Grievance Petition Preview
            </h2>
            <p className="text-xs text-slate-500">
              Ready for submission to the Cooperative Managing Committee & Registrar.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-letter-new-petition"
            onClick={handleStartNewGrievance}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Start a new grievance"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Petition</span>
          </button>

          {!isEditing ? (
            <button
              id="btn-letter-edit"
              onClick={() => {
                setEditableLetter(generatedLetter);
                setIsEditing(true);
              }}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Letter</span>
            </button>
          ) : (
            <button
              id="btn-letter-save"
              onClick={handleSaveEdits}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          )}

          <button
            id="btn-letter-download-txt"
            onClick={handleDownloadTxt}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download TXT</span>
          </button>

          <button
            id="btn-letter-download-pdf"
            onClick={handleDownloadPdf}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Success alert badge */}
      {downloadSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Official Paper Document Container */}
      <div className="bg-white border border-slate-300 rounded-2xl p-6 sm:p-10 shadow-lg font-serif text-slate-900 space-y-6 max-w-3xl mx-auto">
        {/* Header Block */}
        <div className="border-b-2 border-slate-900 pb-4 text-center">
          <span className="text-[11px] font-sans uppercase font-bold tracking-widest text-slate-500 block mb-1">
            FORMAL PETITION UNDER COOPERATIVE SOCIETIES ACT & BYLAWS
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
            PETITION FOR GRIEVANCE REDRESSAL
          </h1>
          <p className="text-xs font-sans text-slate-600 mt-1">
            Subject to Statutory Grievance Redressal Mandates (30-Day Response Requirement)
          </p>
        </div>

        {/* Date and Place */}
        <div className="flex justify-between items-center text-xs font-sans text-slate-700">
          <div>
            <strong>Place: </strong>
            <span>{grievanceData.societyAddressOrPlace || 'Warangal / Telangana'}</span>
          </div>
          <div>
            <strong>Date: </strong>
            <span>{current.generatedDate}</span>
          </div>
        </div>

        {/* Recipient */}
        <div className="text-xs font-sans text-slate-800 space-y-0.5">
          <p className="font-bold">TO:</p>
          {isEditing ? (
            <input
              type="text"
              value={editableLetter?.recipientTitle || ''}
              onChange={(e) => setEditableLetter(prev => prev ? { ...prev, recipientTitle: e.target.value } : null)}
              className="w-full p-1.5 text-xs font-sans border border-slate-300 rounded"
            />
          ) : (
            <p className="font-medium">{current.recipientTitle}</p>
          )}
          <p className="font-bold text-slate-900">{current.societyName}</p>
          <p className="text-slate-600">{grievanceData.societyAddressOrPlace || 'Cooperative Head Office'}</p>
        </div>

        {/* Complainant From */}
        <div className="text-xs font-sans text-slate-800 space-y-0.5 pt-1">
          <p className="font-bold">FROM:</p>
          <p className="font-semibold text-slate-950">
            {current.memberName} {grievanceData.memberIdOrNumber ? `(Member ID: ${grievanceData.memberIdOrNumber})` : ''}
          </p>
          <p className="text-slate-600">{profile.role} • {profile.societyName}</p>
        </div>

        {/* Subject */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs font-sans">
          <strong className="text-slate-900">SUBJECT: </strong>
          {isEditing ? (
            <textarea
              rows={2}
              value={editableLetter?.subject || ''}
              onChange={(e) => setEditableLetter(prev => prev ? { ...prev, subject: e.target.value } : null)}
              className="w-full mt-1 p-1 text-xs border border-slate-300 rounded font-sans"
            />
          ) : (
            <span className="font-semibold text-slate-900">{current.subject}</span>
          )}
        </div>

        {/* Salutation */}
        <p className="text-xs font-sans font-bold text-slate-800">
          {current.salutation}
        </p>

        {/* Body Paragraphs */}
        <div className="space-y-3 text-xs font-sans leading-relaxed text-slate-800">
          {current.bodyParagraphs.map((p, idx) => (
            <p key={idx} className="text-justify">
              {p}
            </p>
          ))}
        </div>

        {/* Statutory Grounds / Citations */}
        {current.bylawReferences.length > 0 && (
          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 text-xs font-sans">
            <strong className="text-emerald-950 font-bold block mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              STATUTORY BYLAW PROVISIONS & RULES CITED:
            </strong>
            <ul className="list-disc pl-5 space-y-1 text-emerald-900">
              {current.bylawReferences.map((ref, idx) => (
                <li key={idx} className="font-medium">
                  {ref}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Specific Relief / Prayer */}
        <div className="space-y-2 text-xs font-sans">
          <strong className="text-slate-900 block font-bold">
            PRAYER / SPECIFIC RELIEF SOUGHT:
          </strong>
          <p className="text-slate-700">
            In light of the aforesaid facts and cited provisions, the complainant humbly prays that the Managing Committee / Competent Authority may be pleased to:
          </p>
          <ol className="list-decimal pl-5 space-y-1 text-slate-900 font-medium">
            {current.requestedActionList.map((act, idx) => (
              <li key={idx}>{act}</li>
            ))}
          </ol>
        </div>

        {/* Acknowledgement Mandate Note */}
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] font-sans text-amber-900 leading-normal">
          <strong>Statutory Compliance Notice: </strong>
          Under Rule 3 of Cooperative Grievance Redressal Rules, the recipient office is required to issue a dated acknowledgement receipt with a unique Tracking Number and table this matter at the next committee meeting.
        </div>

        {/* Signature */}
        <div className="pt-8 flex justify-between items-end text-xs font-sans">
          <div>
            <p className="text-slate-400 text-[10px]">Copies submitted to:</p>
            <p className="text-slate-600 text-[11px]">1. Office File of Complainant</p>
            <p className="text-slate-600 text-[11px]">2. Assistant Registrar of Cooperative Societies (for information)</p>
          </div>

          <div className="text-right">
            <p className="font-medium text-slate-700 mb-8">{current.closing}</p>
            <p className="font-bold text-slate-950">{current.memberName}</p>
            <p className="text-[10px] text-slate-500">(Complainant Signature / Fingerprint)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
