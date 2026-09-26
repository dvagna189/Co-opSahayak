import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Message, GrievanceFormData, GrievanceLetter, SourceReference, LanguageCode, UploadedDocument } from '../types';
import { TRANSLATIONS, UITranslation } from '../constants/languages';
import { checkServerHealth } from '../services/api';
import { documentService } from '../services/documentService';

interface AppContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  // Document uploading & Q&A
  uploadedDocuments: UploadedDocument[];
  activeDocumentId: string | null;
  setActiveDocumentId: (id: string | null) => void;
  activeDocument: UploadedDocument | null;
  isDocUploadModalOpen: boolean;
  openDocUploadModal: (docId?: string) => void;
  closeDocUploadModal: () => void;
  uploadDocument: (doc: UploadedDocument) => void;
  removeDocument: (id: string) => void;
  // Legacy aliases to preserve stability
  isVoiceModalOpen: boolean;
  openVoiceModal: () => void;
  closeVoiceModal: () => void;
  messages: Message[];
  addMessage: (msg: Message) => void;
  updateLastMessage: (updates: Partial<Message>) => void;
  clearMessages: () => void;
  isChatLoading: boolean;
  setIsChatLoading: (val: boolean) => void;
  chatStatus: string;
  setChatStatus: (status: string) => void;
  grievanceData: GrievanceFormData;
  setGrievanceData: React.Dispatch<React.SetStateAction<GrievanceFormData>>;
  generatedLetter: GrievanceLetter | null;
  setGeneratedLetter: (letter: GrievanceLetter | null) => void;
  activeWorkflowId: string | null;
  activeWorkflowStep: number;
  setActiveWorkflowId: (id: string | null) => void;
  setActiveWorkflowStep: (step: number) => void;
  selectedSource: SourceReference | null;
  setSelectedSource: (src: SourceReference | null) => void;
  t: UITranslation;
  serverStatus: { online: boolean; geminiConfigured: boolean };
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'Ravi',
  role: 'Member',
  state: 'Telangana',
  societyName: 'Demo Dairy Cooperative Society',
  interfaceLanguage: 'te', // Default to Telugu showcase or English
  responseLanguage: 'te',
  voiceLanguage: 'te',
  useSameLanguage: true,
  primaryGoal: 'understanding rights and election rules',
  onboarded: true,
};

const DEFAULT_GRIEVANCE: GrievanceFormData = {
  memberName: 'Ravi',
  memberIdOrNumber: 'MEM-8842',
  societyName: 'Demo Dairy Cooperative Society',
  societyAddressOrPlace: 'Warangal District, Telangana',
  issueCategory: 'Election',
  issueDescription: 'My name was omitted from the provisional voter list published on the society notice board even though I have supplied over 600 liters of milk this year and hold active membership status.',
  dateOrPeriod: 'Last 15 days (During publication of provisional voter list)',
  peopleOrRoleInvolved: 'Society Secretary & Returning Officer',
  desiredResolution: 'Immediate restoration of my name in the final electoral roll and permission to exercise my voting rights in the upcoming committee election.',
  additionalNotes: 'Milk passbook and society payment receipts available as proof of active member status.',
  status: 'draft',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved profile or fallback
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('coopsahayak_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return DEFAULT_PROFILE;
  });

  const [activeTab, setActiveTab] = useState<string>('home');
  const [previousTabBeforeModal, setPreviousTabBeforeModal] = useState<string>('home');

  // Document Upload & Q&A state
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>(() => {
    return documentService.getDocuments();
  });
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(() => {
    const docs = documentService.getDocuments();
    return docs[0]?.id || null;
  });
  const [isDocUploadModalOpen, setIsDocUploadModalOpen] = useState<boolean>(false);

  const activeDocument = uploadedDocuments.find(d => d.id === activeDocumentId) || null;

  const openDocUploadModal = (docId?: string) => {
    setPreviousTabBeforeModal(activeTab);
    if (docId) {
      setActiveDocumentId(docId);
    }
    setIsDocUploadModalOpen(true);
  };

  const closeDocUploadModal = () => {
    setIsDocUploadModalOpen(false);
    setActiveTab(previousTabBeforeModal);
  };

  const uploadDocument = (doc: UploadedDocument) => {
    documentService.addDocument(doc);
    setUploadedDocuments(documentService.getDocuments());
    setActiveDocumentId(doc.id);
  };

  const removeDocument = (id: string) => {
    documentService.removeDocument(id);
    const updated = documentService.getDocuments();
    setUploadedDocuments(updated);
    if (activeDocumentId === id) {
      setActiveDocumentId(updated[0]?.id || null);
    }
  };

  // Voice Assistant modal state (independent)
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [previousTabBeforeVoice, setPreviousTabBeforeVoice] = useState<string>('home');

  const openVoiceModal = () => {
    setPreviousTabBeforeVoice(activeTab);
    setIsVoiceModalOpen(true);
  };

  const closeVoiceModal = () => {
    setIsVoiceModalOpen(false);
    setActiveTab(previousTabBeforeVoice);
  };

  // Messages with welcome message matching user's language
  const [messages, setMessages] = useState<Message[]>(() => {
    return [
      {
        id: 'msg-welcome',
        sender: 'assistant',
        text: profile.interfaceLanguage === 'te'
          ? `నమస్కారం ${profile.name}! కో-ఆప్ సహాయక్ (Co-opSahayak) కు స్వాగతం. మీ సహకార సంఘం నియమావళి, ఎన్నికల నిబంధనలు, సభ్యుల హక్కులు లేదా ఫిర్యాదు దాఖలు చేయడంలో నేను మీకు ఎలా సహాయపడగలను?`
          : `Namaste ${profile.name}! Welcome to Co-opSahayak. How can I assist you today with cooperative bylaws, voting rights, elections, or filing a grievance?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedFollowups: profile.interfaceLanguage === 'te'
          ? [
              'నా సహకార సంఘ ఎన్నికలలో నేను ఓటు వేయవచ్చా?',
              'సహకార సంఘ సభ్యుడిగా నా హక్కులు ఏమిటి?',
              'మేనేజింగ్ కమిటీపై ఫిర్యాదు ఎలా దాఖలు చేయాలి?',
            ]
          : [
              'Can I vote in my cooperative election?',
              'What are my rights as a member?',
              'How do I file a grievance?',
            ],
      },
    ];
  });

  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [chatStatus, setChatStatus] = useState<string>('');

  // Workflow states
  const [grievanceData, setGrievanceData] = useState<GrievanceFormData>(DEFAULT_GRIEVANCE);
  const [generatedLetter, setGeneratedLetter] = useState<GrievanceLetter | null>(null);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<number>(1);
  const [selectedSource, setSelectedSource] = useState<SourceReference | null>(null);

  const [serverStatus, setServerStatus] = useState<{ online: boolean; geminiConfigured: boolean }>({
    online: true,
    geminiConfigured: false,
  });

  // Check health on mount
  useEffect(() => {
    checkServerHealth().then(res => {
      setServerStatus({
        online: res.status === 'ok',
        geminiConfigured: res.geminiConfigured,
      });
    });
  }, []);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => {
      let next = { ...prev, ...updates };
      if (updates.useSameLanguage && updates.interfaceLanguage) {
        next.responseLanguage = updates.interfaceLanguage;
        next.voiceLanguage = updates.interfaceLanguage;
      }
      localStorage.setItem('coopsahayak_profile', JSON.stringify(next));
      return next;
    });
  };

  const addMessage = (msg: Message) => {
    setMessages(prev => [...prev, msg]);
  };

  const updateLastMessage = (updates: Partial<Message>) => {
    setMessages(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const updated = { ...last, ...updates };
      return [...prev.slice(0, prev.length - 1), updated];
    });
  };

  const clearMessages = () => {
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: profile.interfaceLanguage === 'te'
          ? `చాట్ రీసెట్ చేయబడింది. మీరు మీ సహకార సంఘం గురించి ఏదైనా కొత్త ప్రశ్నను అడగవచ్చు.`
          : `Conversation cleared. Feel free to ask any question regarding cooperative rules, bylaws, or member procedures.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedFollowups: [
          profile.interfaceLanguage === 'te' ? 'నా ఓటు హక్కులను ఎలా తనిఖీ చేయాలి?' : 'How to check my voting rights?',
          profile.interfaceLanguage === 'te' ? 'సహకార సంఘం నమోదు ప్రక్రియ ఏమిటి?' : 'What are the steps to register a cooperative?',
        ],
      },
    ]);
  };

  const t = TRANSLATIONS[profile.interfaceLanguage] || TRANSLATIONS.en;

  return (
    <AppContext.Provider
      value={{
        profile,
        updateProfile,
        activeTab,
        setActiveTab,
        // Document uploading & Q&A
        uploadedDocuments,
        activeDocumentId,
        setActiveDocumentId,
        activeDocument,
        isDocUploadModalOpen,
        openDocUploadModal,
        closeDocUploadModal,
        uploadDocument,
        removeDocument,
        // Legacy aliases
        isVoiceModalOpen,
        openVoiceModal,
        closeVoiceModal,
        messages,
        addMessage,
        updateLastMessage,
        clearMessages,
        isChatLoading,
        setIsChatLoading,
        chatStatus,
        setChatStatus,
        grievanceData,
        setGrievanceData,
        generatedLetter,
        setGeneratedLetter,
        activeWorkflowId,
        activeWorkflowStep,
        setActiveWorkflowId,
        setActiveWorkflowStep,
        selectedSource,
        setSelectedSource,
        t,
        serverStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
