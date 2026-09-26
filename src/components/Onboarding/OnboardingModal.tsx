import React, { useState } from 'react';
import { Sparkles, Check, ArrowRight, ShieldCheck, Scale } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SUPPORTED_LANGUAGES } from '../../constants/languages';
import { LanguageCode, UserRole } from '../../types';

export const OnboardingModal: React.FC = () => {
  const { profile, updateProfile, t } = useApp();
  const [isOpen, setIsOpen] = useState<boolean>(() => !profile.onboarded);

  const [formData, setFormData] = useState({
    name: profile.name || '',
    role: profile.role || 'Member',
    state: profile.state || 'Telangana',
    societyName: profile.societyName || '',
    language: profile.interfaceLanguage || 'te',
    goal: profile.primaryGoal || 'understanding rights and election rules',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: formData.name.trim() || 'Co-op Member',
      role: formData.role as UserRole,
      state: formData.state.trim() || 'General',
      societyName: formData.societyName.trim() || 'Primary Cooperative Society',
      interfaceLanguage: formData.language as LanguageCode,
      responseLanguage: formData.language as LanguageCode,
      voiceLanguage: formData.language as LanguageCode,
      useSameLanguage: true,
      primaryGoal: formData.goal,
      onboarded: true,
    });
    setIsOpen(false);
  };

  const handleUseDemo = () => {
    updateProfile({
      name: 'Ravi',
      role: 'Member',
      state: 'Telangana',
      societyName: 'Demo Dairy Cooperative Society',
      interfaceLanguage: 'te',
      responseLanguage: 'te',
      voiceLanguage: 'te',
      useSameLanguage: true,
      primaryGoal: 'understanding rights and election rules',
      onboarded: true,
    });
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 p-6 text-white text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md mx-auto flex items-center justify-center mb-3">
            <Scale className="w-7 h-7 text-emerald-200" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Welcome to Co-opSahayak
          </h2>
          <p className="text-xs text-emerald-100 mt-1 max-w-sm mx-auto">
            Your multilingual AI assistant for cooperative governance, procedures, member rights, and grievances.
          </p>
        </div>

        {/* Minimal Safe Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>We never ask for passwords, Aadhaar, or bank details. Non-confidential info only.</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Name / First Name:
              </label>
              <input
                id="input-onboarding-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Ravi"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Language:
              </label>
              <select
                id="select-onboarding-lang"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value as LanguageCode })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeName} ({l.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Role:
              </label>
              <select
                id="select-onboarding-role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Member">Member</option>
                <option value="Farmer">Farmer / Producer</option>
                <option value="Founder">Founder / Organizer</option>
                <option value="Office Bearer">Office Bearer / Director</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                State / Region:
              </label>
              <input
                id="input-onboarding-state"
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="e.g. Telangana, Maharashtra"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cooperative Society Name (Optional):
            </label>
            <input
              id="input-onboarding-society"
              type="text"
              value={formData.societyName}
              onChange={(e) => setFormData({ ...formData, societyName: e.target.value })}
              placeholder="e.g. Sri Laxmi Milk Producers Co-op Society"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              What is your primary goal today?
            </label>
            <select
              id="select-onboarding-goal"
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="understanding rights and election rules">Understanding my voting rights & election rules</option>
              <option value="filing a formal grievance">Filing a formal grievance against society committee</option>
              <option value="learning registration steps">Learning how to form and register a new cooperative</option>
              <option value="general governance procedures">General governance rules & AGM procedures</option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              id="btn-onboarding-demo-profile"
              type="button"
              onClick={handleUseDemo}
              className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-2 font-medium"
            >
              Quick Demo: Load Ravi (Telugu Profile)
            </button>

            <button
              id="btn-onboarding-submit"
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/20 flex items-center gap-1.5 transition-all"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
