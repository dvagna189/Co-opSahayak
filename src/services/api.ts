import { LanguageCode, QueryRoute, UserProfile, GrievanceFormData, GrievanceLetter, Message } from '../types';

export interface ChatApiResponse {
  response: string;
  route: QueryRoute;
  sources: any[];
  toolsUsed: string[];
  suggestedFollowups: string[];
  reasoning?: string;
  audioBase64?: string;
  audioMimeType?: string;
  error?: string;
}

export async function checkServerHealth(): Promise<{ status: string; geminiConfigured: boolean }> {
  try {
    const res = await fetch('/api/health');
    return await res.json();
  } catch (e) {
    return { status: 'offline', geminiConfigured: false };
  }
}

export async function sendChatMessage(params: {
  query: string;
  history: Message[];
  profile: UserProfile;
  language: LanguageCode;
  documentContext?: {
    id?: string;
    name?: string;
    textSnippet?: string;
    rawText?: string;
    fullText?: string;
    chunks?: any[];
  };
  isVoice?: boolean;
}): Promise<ChatApiResponse> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Server returned ${res.status}`);
  }

  return await res.json();
}

export async function routeQuery(query: string): Promise<{ route: QueryRoute; confidence: number; reasoning: string }> {
  const res = await fetch('/api/route-query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  return await res.json();
}

export async function generateGrievanceLetterApi(formData: GrievanceFormData): Promise<{ success: boolean; letter: GrievanceLetter }> {
  const res = await fetch('/api/grievance/generate-letter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ formData }),
  });
  if (!res.ok) {
    throw new Error('Failed to generate letter');
  }
  return await res.json();
}

export async function executeTool(toolName: string, args: any = {}): Promise<any> {
  const res = await fetch('/api/tools/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toolName, args }),
  });
  return await res.json();
}
