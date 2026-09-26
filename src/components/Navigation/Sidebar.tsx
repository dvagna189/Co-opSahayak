import React from 'react';
import {
  Home,
  MessageSquare,
  ListTodo,
  ShieldCheck,
  FileText,
  BookOpen,
  UploadCloud,
  Mic,
  User,
  Settings,
  Scale,
  Sparkles,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    t,
    profile,
    openDocUploadModal,
    openVoiceModal,
    uploadedDocuments,
    grievanceData,
    generatedLetter,
  } = useApp();

  const isGrievanceCompleted = grievanceData.status === 'generated' || !!generatedLetter;

  const navItems = [
    { id: 'home', label: t.navHome, icon: Home },
    { id: 'ask', label: t.navAsk, icon: MessageSquare },
    { id: 'guided', label: t.navGuided, icon: ListTodo },
    { id: 'rights', label: t.navRights, icon: ShieldCheck },
    {
      id: 'grievance',
      label: t.navGrievance,
      icon: FileText,
      badge: isGrievanceCompleted ? 'Ready' : undefined,
    },
    { id: 'knowledge', label: t.navKnowledge, icon: BookOpen },
    { id: 'profile', label: t.navProfile, icon: User },
    { id: 'settings', label: t.navSettings, icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30 shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-lg leading-tight tracking-tight text-white truncate">
              Co-opSahayak
            </h1>
            <p className="text-xs text-slate-400 truncate">
              {profile.societyName || 'Cooperative Helpdesk'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Tools: Document Q&A & Voice Assistant */}
      <div className="p-3 mx-3 mt-4 rounded-xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-700/40 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Interaction Tools</span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            id="btn-sidebar-upload-doc"
            onClick={() => openDocUploadModal()}
            className="py-2 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium text-xs flex flex-col items-center justify-center gap-1 transition-all shadow-sm"
            title="Upload or Ask from Society Documents"
          >
            <UploadCloud className="w-4 h-4 text-emerald-100" />
            <span className="text-[11px] leading-tight">Upload Docs</span>
          </button>

          <button
            id="btn-sidebar-voice-assistant"
            onClick={() => openVoiceModal()}
            className="py-2 px-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-medium text-xs flex flex-col items-center justify-center gap-1 transition-all shadow-sm border border-emerald-600/50"
            title="Multilingual Voice Assistant"
          >
            <Mic className="w-4 h-4 text-emerald-100" />
            <span className="text-[11px] leading-tight">Voice Sahayak</span>
          </button>
        </div>
      </div>

      {/* Main Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="flex-1 text-left truncate">{item.label}</span>
              {item.badge && (
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Session Profile Snapshot */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0">
            {profile.name.charAt(0) || 'M'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{profile.name}</p>
            <p className="text-[11px] text-slate-400 truncate">
              {profile.role} • {profile.state}
            </p>
          </div>
          <button
            id="btn-sidebar-settings-quick"
            onClick={() => setActiveTab('profile')}
            className="text-slate-400 hover:text-slate-200 p-1"
            title="View Profile"
          >
            <User className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
