import React from 'react';
import { UploadCloud, Mic, Globe, Menu } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SUPPORTED_LANGUAGES } from '../../constants/languages';
import { LanguageCode } from '../../types';

export const Header: React.FC<{ onMobileMenuToggle?: () => void }> = ({ onMobileMenuToggle }) => {
  const { profile, updateProfile, openDocUploadModal, openVoiceModal, uploadedDocuments, t } = useApp();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as LanguageCode;
    updateProfile({
      interfaceLanguage: newLang,
      responseLanguage: profile.useSameLanguage ? newLang : profile.responseLanguage,
    });
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between z-10 sticky top-0">
      {/* Left title & mobile toggle */}
      <div className="flex items-center gap-3">
        <button
          id="btn-mobile-menu"
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <span className="text-base font-bold text-slate-900 tracking-tight">
            {t.appName}
          </span>
          <p className="text-xs text-slate-500 hidden sm:block">
            {t.appSubtitle}
          </p>
        </div>
      </div>

      {/* Right controls: Language, Voice Assistant & Document Upload */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Language selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
          <Globe className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <select
            id="select-header-language"
            value={profile.interfaceLanguage}
            onChange={handleLanguageChange}
            className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer pr-1"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName} ({lang.name})
              </option>
            ))}
          </select>
        </div>

        {/* Multilingual Voice Assistant Button */}
        <button
          id="btn-header-voice"
          onClick={() => openVoiceModal()}
          className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95"
          title="Multilingual Voice Assistant"
        >
          <Mic className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">Voice Sahayak</span>
        </button>

        {/* Dedicated Document Upload & Q&A launch button */}
        <button
          id="btn-header-doc-upload"
          onClick={() => openDocUploadModal()}
          className="flex items-center gap-1.5 sm:gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95"
          title="Upload or Ask from Society Documents"
        >
          <UploadCloud className="w-4 h-4 text-emerald-100" />
          <span className="hidden sm:inline">Upload Docs</span>
          <span className="bg-emerald-800/80 text-emerald-100 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
            {uploadedDocuments.length}
          </span>
        </button>
      </div>
    </header>
  );
};
