import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Check,
  RotateCcw,
  Sparkles,
  Building,
  MapPin,
  Globe,
  Award,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SUPPORTED_LANGUAGES } from '../constants/languages';
import { LanguageCode, UserRole } from '../types';

export const Profile: React.FC = () => {
  const { profile, updateProfile, t } = useApp();
  const [formData, setFormData] = useState({ ...profile });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    const defaultData = {
      name: 'Ravi',
      role: 'Member' as UserRole,
      state: 'Telangana',
      societyName: 'Demo Dairy Cooperative Society',
      interfaceLanguage: 'te' as LanguageCode,
      responseLanguage: 'te' as LanguageCode,
      voiceLanguage: 'te' as LanguageCode,
      useSameLanguage: true,
      primaryGoal: 'understanding rights and election rules',
      onboarded: true,
    };
    setFormData(defaultData);
    updateProfile(defaultData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <User className="w-6 h-6 text-emerald-600" />
            <span>Member Profile & Identity</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your personal and cooperative session information.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Non-Confidential Only</span>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Profile preferences saved successfully</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Your Name / Title *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Role in Cooperative *
            </label>
            <select
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Cooperative / Society Name
            </label>
            <input
              type="text"
              value={formData.societyName || ''}
              onChange={(e) => setFormData({ ...formData, societyName: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              State / Region
            </label>
            <input
              type="text"
              value={formData.state || ''}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Current Primary Goal
          </label>
          <input
            type="text"
            value={formData.primaryGoal || ''}
            onChange={(e) => setFormData({ ...formData, primaryGoal: e.target.value })}
            placeholder="e.g. Preparing for upcoming election, checking audit reports..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Demo Profile (Ravi - Telugu)</span>
          </button>

          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
};
