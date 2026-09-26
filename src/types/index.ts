export type UserRole = 'Member' | 'Farmer' | 'Founder' | 'Office Bearer' | 'Other';

export type QueryRoute = 
  | 'GOVERNANCE_PROCEDURE'
  | 'LEGAL_RIGHTS'
  | 'GRIEVANCE'
  | 'GENERAL_COOPERATIVE_INFORMATION'
  | 'GUIDED_TASK'
  | 'DOCUMENT_QA'
  | 'OUT_OF_SCOPE';

export type DocumentCategory =
  | 'Society Bylaws'
  | 'AGM / Meeting Notice'
  | 'Maintenance Bill / Accounts'
  | 'Election Notice'
  | 'Share Certificate / Passbook'
  | 'Grievance / Dispute'
  | 'Other';

export interface UploadedDocument {
  id: string;
  name: string;
  fileType: string;
  category: DocumentCategory;
  uploadedAt: string;
  fileSize: string;
  rawText: string;
  summary: string;
  keyFindings: string[];
  suggestedQuestions: string[];
  chunks: KnowledgeChunk[];
  isSample?: boolean;
}

export type LanguageCode = 
  | 'en' // English
  | 'hi' // Hindi (हिन्दी)
  | 'te' // Telugu (తెలుగు)
  | 'kn' // Kannada (ಕನ್ನಡ)
  | 'ta' // Tamil (தமிழ்)
  | 'ml' // Malayalam (മലയാളം)
  | 'mr' // Marathi (मराठी)
  | 'bn' // Bengali (বাংলা)
  | 'gu' // Gujarati (ગુજરાતી)
  | 'pa' // Punjabi (ਪੰਜਾਬੀ)
  | 'or' // Odia (ଓଡ଼ିଆ)
  | 'as'; // Assamese (অসমীয়া)

export interface UserProfile {
  name: string;
  role: UserRole;
  state: string;
  societyName?: string;
  interfaceLanguage: LanguageCode;
  responseLanguage: LanguageCode;
  voiceLanguage: LanguageCode;
  useSameLanguage: boolean;
  primaryGoal?: string;
  onboarded: boolean;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  docType: 'Bylaw' | 'Act' | 'Election Rules' | 'Grievance Rules' | 'Manual';
  source: string;
  jurisdiction: string;
  versionDate: string;
  isDemoData: boolean;
  description: string;
  chunks: KnowledgeChunk[];
}

export interface KnowledgeChunk {
  id: string;
  docId: string;
  docTitle: string;
  docType: string;
  source: string;
  chapterOrPart: string;
  section: string;
  pageNumber?: number;
  jurisdiction: string;
  content: string;
  keywords: string[];
  isDemoData: boolean;
}

export interface SearchResult {
  chunk: KnowledgeChunk;
  score: number;
  snippet: string;
}

export interface SourceReference {
  docTitle: string;
  docType: string;
  source: string;
  section: string;
  chapter?: string;
  pageNumber?: number;
  isDemoData: boolean;
  excerpt: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  route?: QueryRoute;
  sources?: SourceReference[];
  toolsUsed?: string[];
  suggestedFollowups?: string[];
  isThinking?: boolean;
  statusMessage?: string;
  language?: LanguageCode;
  documentId?: string;
  documentName?: string;
}

export interface GrievanceFormData {
  id?: string;
  memberName: string;
  memberIdOrNumber?: string;
  societyName: string;
  societyAddressOrPlace?: string;
  issueCategory: 'Election' | 'Membership' | 'Financial / Accounts' | 'Management / Misgovernance' | 'Dividend / Dues' | 'Other';
  issueDescription: string;
  dateOrPeriod: string;
  peopleOrRoleInvolved?: string;
  relevantDocsDetails?: string;
  desiredResolution: string;
  additionalNotes?: string;
  retrievedBylaws?: SourceReference[];
  status: 'draft' | 'review' | 'generated';
}

export interface GrievanceLetter {
  id: string;
  generatedDate: string;
  recipientTitle: string;
  societyName: string;
  memberName: string;
  subject: string;
  salutation: string;
  bodyParagraphs: string[];
  bylawReferences: string[];
  requestedActionList: string[];
  closing: string;
  rawText: string;
}

export interface GuidedStep {
  id: number;
  title: string;
  description: string;
  field: string;
  fieldType: 'text' | 'textarea' | 'select' | 'radio' | 'date';
  options?: { label: string; value: string; hint?: string }[];
  placeholder?: string;
  required?: boolean;
  whyNeeded?: string;
}

export interface GuidedWorkflow {
  id: string;
  title: string;
  description: string;
  category: string;
  steps: GuidedStep[];
}
