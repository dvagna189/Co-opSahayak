import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Globe,
  Mic,
  Cpu,
  Check,
  Sparkles,
  Shield,
  Volume2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SUPPORTED_LANGUAGES } from '../constants/languages';
import { LanguageCode } from '../types';

export const Settings: React.FC = () => {
  const { profile, updateProfile, serverStatus, t } = useApp();
  const [saveToast, setSaveToast] = useState(false);

  const handleToggleSameLanguage = (val: boolean) => {
    updateProfile({
      useSameLanguage: val,
      responseLanguage: val ? profile.interfaceLanguage : profile.responseLanguage,
      voiceLanguage: val ? profile.interfaceLanguage : profile.voiceLanguage,
    });
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const handleInterfaceLangChange = (lang: LanguageCode) => {
    updateProfile({
      interfaceLanguage: lang,
      responseLanguage: profile.useSameLanguage ? lang : profile.responseLanguage,
      voiceLanguage: profile.useSameLanguage ? lang : profile.voiceLanguage,
    });
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const quickPresets: { label: string; code: LanguageCode }[] = [
    { label: 'తెలుగు (Telugu)', code: 'te' },
    { label: 'हिन्दी (Hindi)', code: 'hi' },
    { label: 'English', code: 'en' },
    { label: 'मराठी (Marathi)', code: 'mr' },
    { label: 'தமிழ் (Tamil)', code: 'ta' },
    { label: 'ಕನ್ನಡ (Kannada)', code: 'kn' },
  ];

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-slate-700" />
          <span>{t.navSettings} & Multilingual Controls</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure translation preferences, speech synthesis accents, and view AI runtime status.
        </p>
      </div>

      {saveToast && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Language settings updated</span>
        </div>
      )}

      {/* Quick Language Switcher Presets */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Globe className="w-4 h-4 text-emerald-600" />
          Quick Language Switcher
        </span>
        <div className="flex flex-wrap gap-2">
          {quickPresets.map((preset) => (
            <button
              key={preset.code}
              onClick={() => handleInterfaceLangChange(preset.code)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                profile.interfaceLanguage === preset.code
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Detailed Multilingual Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Synchronize All Languages
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Automatically use the same language for interface UI, AI chat answers, and voice playback.
            </p>
          </div>
          <input
            type="checkbox"
            checked={profile.useSameLanguage}
            onChange={(e) => handleToggleSameLanguage(e.target.checked)}
            className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
          />
        </div>

        {/* Interface Language */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Interface Language (Buttons, Labels, Menus):
          </label>
          <select
            value={profile.interfaceLanguage}
            onChange={(e) => handleInterfaceLangChange(e.target.value as LanguageCode)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.nativeName} ({l.name})
              </option>
            ))}
          </select>
        </div>

        {!profile.useSameLanguage && (
          <>
            {/* Response Language */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                AI Response Language (Chat & Letters):
              </label>
              <select
                value={profile.responseLanguage}
                onChange={(e) => updateProfile({ responseLanguage: e.target.value as LanguageCode })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeName} ({l.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Voice Language */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Speech Input & Voice Playback Accent:
              </label>
              <select
                value={profile.voiceLanguage}
                onChange={(e) => updateProfile({ voiceLanguage: e.target.value as LanguageCode })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeName} ({l.name})
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {/* AI & Server Runtime Diagnostics */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-slate-600" />
          <span>System & Engine Diagnostics</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-slate-400 block font-medium">Backend Gateway:</span>
            <span className="font-bold text-emerald-700 mt-0.5 block">
              {serverStatus.online ? 'Online (Port 3000)' : 'Offline'}
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-slate-400 block font-medium">Primary AI Model:</span>
            <span className="font-bold text-slate-800 mt-0.5 block">
              {serverStatus.geminiConfigured ? 'Gemini Flash' : 'Deterministic RAG Mode'}
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-slate-400 block font-medium">RAG Verification:</span>
            <span className="font-bold text-blue-700 mt-0.5 block">
              Statutory Grounding Active
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          Co-opSahayak operates on a full-stack Express + React architecture with zero browser exposure of sensitive keys, adhering strictly to civic accessibility and grounded RAG verification principles.
        </p>
      </div>
    </div>
  );
};
