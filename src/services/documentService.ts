import { UploadedDocument, DocumentCategory, KnowledgeChunk, SearchResult, SourceReference } from '../types';
import { SAMPLE_UPLOADED_DOCUMENTS } from '../data/sampleUploadedDocs';
import mammoth from 'mammoth';

const STORAGE_KEY = 'coopsahayak_uploaded_documents';

/**
 * Checks if a string contains raw binary bytes, ZIP headers, or replacement characters
 */
export function isBinaryGarble(text: string): boolean {
  if (!text) return false;
  // ZIP / DOCX magic bytes or internal XML signatures from reading a binary archive as text
  if (
    text.startsWith('PK\x03\x04') ||
    text.startsWith('PK') ||
    text.includes('_rels/.rels') ||
    text.includes('word/document.xml') ||
    text.includes('[Content_Types].xml')
  ) {
    return true;
  }
  // PDF header
  if (text.startsWith('%PDF-')) {
    return true;
  }
  // Unicode replacement characters from reading binary files as UTF-8
  const replacementMatches = text.match(/\uFFFD/g) || [];
  if (replacementMatches.length > 5 && (replacementMatches.length / text.length) > 0.015) {
    return true;
  }
  // Control/null characters ratio
  const controlChars = text.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g) || [];
  if (controlChars.length > 10 && (controlChars.length / text.length) > 0.02) {
    return true;
  }
  return false;
}

/**
 * Extracts plain, clean text from any file (.docx, .pdf, images, .txt, .md, .csv)
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name;
  const lowerName = fileName.toLowerCase();
  const isDocx = lowerName.endsWith('.docx') || lowerName.endsWith('.doc') || file.type.includes('word') || file.type.includes('officedocument');
  const isPdf = lowerName.endsWith('.pdf') || file.type.includes('pdf');
  const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp)$/i.test(lowerName);

  // 1. If DOCX: client-side mammoth extraction for instant clean paragraphs
  if (isDocx) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = (result.value || '').trim();
      if (text.length > 20) {
        return text;
      }
    } catch (clientDocxErr) {
      console.warn('Client-side mammoth parsing failed, falling back to server:', clientDocxErr);
    }
  }

  // 2. If PDF, Image, or DOCX fallback: use server-side extraction
  if (isPdf || isImage || isDocx) {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        const b64 = res.includes(',') ? res.split(',')[1] : res;
        resolve(b64);
      };
      reader.onerror = (e) => reject(new Error('Failed to read file as data URL: ' + e));
      reader.readAsDataURL(file);
    });

    const res = await fetch('/api/documents/parse-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileDataBase64: base64,
        mimeType: file.type || (isPdf ? 'application/pdf' : isImage ? 'image/png' : 'application/octet-stream'),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.text && data.text.trim().length > 0) {
        return data.text.trim();
      }
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server could not extract text from ${file.name}`);
    }
  }

  // 3. Plain text files (.txt, .md, .json, .csv, .rtf)
  const rawText = await file.text();
  if (isBinaryGarble(rawText)) {
    throw new Error(`The file "${file.name}" appears to be a binary or unsupported format. Please upload a Word document (.docx), PDF, or plain text file, or use the "Paste Notice Text" tab.`);
  }
  return rawText;
}

export class DocumentService {
  private documents: UploadedDocument[] = [];

  constructor() {
    this.loadDocuments();
  }

  private loadDocuments(): void {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Sanitize: Automatically purge any corrupted or binary-garbled documents
          const cleanDocs = parsed.filter(d => {
            if (!d || !d.rawText) return false;
            if (isBinaryGarble(d.rawText)) return false;
            // Also check chunks
            if (Array.isArray(d.chunks)) {
              const hasGarbleChunk = d.chunks.some((c: KnowledgeChunk) => isBinaryGarble(c.content));
              if (hasGarbleChunk) return false;
            }
            return true;
          });

          if (cleanDocs.length > 0) {
            this.documents = cleanDocs;
            this.saveDocuments();
            return;
          }
        }
      } catch (e) {
        console.error('Failed to parse saved documents:', e);
      }
    }
    // Initialize with authentic sample documents
    this.documents = [...SAMPLE_UPLOADED_DOCUMENTS];
    this.saveDocuments();
  }

  private saveDocuments(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.documents));
    } catch (e) {
      console.warn('Storage limit reached or failed to save documents:', e);
    }
  }

  public getDocuments(): UploadedDocument[] {
    return this.documents;
  }

  public getDocumentById(id: string): UploadedDocument | undefined {
    return this.documents.find(d => d.id === id);
  }

  public addDocument(doc: UploadedDocument): void {
    // Avoid duplicates
    this.documents = [doc, ...this.documents.filter(d => d.id !== doc.id)];
    this.saveDocuments();
  }

  public removeDocument(id: string): void {
    this.documents = this.documents.filter(d => d.id !== id);
    this.saveDocuments();
  }

  public resetToSamples(): void {
    this.documents = [...SAMPLE_UPLOADED_DOCUMENTS];
    this.saveDocuments();
  }

  /**
   * Automatically parses uploaded text content into a structured UploadedDocument
   */
  public parseAndIndexDocument(params: {
    name: string;
    rawText: string;
    category?: DocumentCategory;
    fileType?: string;
    fileSizeBytes?: number;
  }): UploadedDocument {
    if (isBinaryGarble(params.rawText)) {
      throw new Error(`The file contains raw binary data and could not be indexed. Please upload a Word document (.docx), PDF, or plain text file, or paste the text directly.`);
    }

    const id = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();
    const uploadedAt = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + now.toLocaleDateString([], { month: 'short', day: 'numeric' });
    
    const sizeStr = params.fileSizeBytes 
      ? `${(params.fileSizeBytes / 1024).toFixed(1)} KB` 
      : `${(new Blob([params.rawText]).size / 1024).toFixed(1)} KB`;

    // Guess category if not explicitly provided
    let category: DocumentCategory = params.category || 'Other';
    if (!params.category) {
      const lower = params.rawText.toLowerCase() + ' ' + params.name.toLowerCase();
      if (lower.includes('agm') || lower.includes('annual general') || lower.includes('meeting notice') || lower.includes('agenda')) {
        category = 'AGM / Meeting Notice';
      } else if (lower.includes('bylaw') || lower.includes('by-law') || lower.includes('constitution')) {
        category = 'Society Bylaws';
      } else if (lower.includes('maintenance') || lower.includes('bill') || lower.includes('invoice') || lower.includes('sinking fund')) {
        category = 'Maintenance Bill / Accounts';
      } else if (lower.includes('election') || lower.includes('voter') || lower.includes('ballot') || lower.includes('nomination')) {
        category = 'Election Notice';
      } else if (lower.includes('share') || lower.includes('passbook') || lower.includes('kcc') || lower.includes('allotment')) {
        category = 'Share Certificate / Passbook';
      } else if (lower.includes('grievance') || lower.includes('complaint') || lower.includes('dispute') || lower.includes('petition')) {
        category = 'Grievance / Dispute';
      }
    }

    // Split text into paragraphs or logical sections
    const rawParagraphs = params.rawText
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 20);

    const chunks: KnowledgeChunk[] = [];
    const keyFindings: string[] = [];

    // Extract dates, amounts (₹ or Rs), quorum, and percentages
    const lines = params.rawText.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (
        (line.includes('₹') || /rs\.?\s*\d+/i.test(line) || /date|time|venue|quorum|penalty|interest|due|disqualif|fee|charge/i.test(line)) &&
        line.length > 20 &&
        line.length < 200 &&
        keyFindings.length < 6
      ) {
        if (!keyFindings.includes(line)) {
          keyFindings.push(line);
        }
      }
    }

    if (keyFindings.length === 0) {
      keyFindings.push(`Document loaded: ${params.name}`);
      keyFindings.push(`Total content length: ${params.rawText.length} characters.`);
    }

    // Create chunks
    if (rawParagraphs.length === 0) {
      chunks.push({
        id: `${id}-chunk-1`,
        docId: id,
        docTitle: params.name,
        docType: category,
        source: `Uploaded: ${params.name}`,
        chapterOrPart: 'General Section',
        section: 'Document Content',
        pageNumber: 1,
        jurisdiction: 'Uploaded Member Document',
        content: params.rawText.substring(0, 1200),
        keywords: this.extractKeywords(params.rawText),
        isDemoData: false,
      });
    } else {
      rawParagraphs.forEach((para, idx) => {
        // Extract section header from first line if short
        const firstLine = para.split('\n')[0].replace(/[:\-#*]/g, '').trim();
        const sectionTitle = firstLine.length < 50 ? firstLine : `Section ${idx + 1}`;
        chunks.push({
          id: `${id}-chunk-${idx + 1}`,
          docId: id,
          docTitle: params.name,
          docType: category,
          source: `Uploaded: ${params.name}`,
          chapterOrPart: `Part ${Math.floor(idx / 3) + 1}`,
          section: sectionTitle,
          pageNumber: Math.floor(idx / 2) + 1,
          jurisdiction: 'Uploaded Member Document',
          content: para,
          keywords: this.extractKeywords(para),
          isDemoData: false,
        });
      });
    }

    // Executive summary formulation
    const summary = this.generateSummary(params.name, category, params.rawText, keyFindings);

    // Suggested questions
    const suggestedQuestions = this.generateSuggestedQuestions(params.rawText, category);

    const doc: UploadedDocument = {
      id,
      name: params.name,
      fileType: params.fileType || 'txt',
      category,
      uploadedAt,
      fileSize: sizeStr,
      rawText: params.rawText,
      summary,
      keyFindings,
      suggestedQuestions,
      chunks,
      isSample: false,
    };

    this.addDocument(doc);
    return doc;
  }

  private extractKeywords(text: string): string[] {
    const common = ['the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'were', 'been', 'which', 'shall', 'under'];
    const words = text
      .toLowerCase()
      .replace(/[^\w\s\u0900-\u097F\u0C00-\u0C7F]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !common.includes(w));
    return Array.from(new Set(words)).slice(0, 12);
  }

  private generateSummary(title: string, category: DocumentCategory, text: string, highlights: string[]): string {
    const firstFew = text.substring(0, 300).replace(/\s+/g, ' ').trim();
    if (highlights.length > 0) {
      return `Uploaded ${category} document "${title}". Key elements include: ${highlights.slice(0, 3).join('; ')}.`;
    }
    return `Uploaded ${category} document "${title}". Content overview: ${firstFew}...`;
  }

  private generateSuggestedQuestions(text: string, category: DocumentCategory): string[] {
    const lower = text.toLowerCase();
    const questions: string[] = [];

    if (category === 'AGM / Meeting Notice' || lower.includes('agm') || lower.includes('meeting')) {
      questions.push('What is the date, time, and venue of the meeting?');
      questions.push('What is the quorum requirement stated in this notice?');
      questions.push('What are the main agenda items to be discussed?');
      questions.push('Are there any voting restrictions or dues conditions?');
    } else if (category === 'Maintenance Bill / Accounts' || lower.includes('maintenance') || lower.includes('bill')) {
      questions.push('What is the total amount due and the payment deadline?');
      questions.push('What is the breakdown of the charges listed?');
      questions.push('Is there any penalty or interest for late payment?');
      questions.push('How can I challenge or inspect the audit breakdown?');
    } else if (category === 'Share Certificate / Passbook' || lower.includes('share') || lower.includes('loan')) {
      questions.push('What are my registered shareholdings and account details?');
      questions.push('What is the applicable loan limit and interest rate?');
      questions.push('What is the dispute resolution timeframe mentioned?');
    } else if (category === 'Society Bylaws' || lower.includes('bylaw')) {
      questions.push('What are the member voting rights defined in this bylaw?');
      questions.push('What are the rules regarding managing committee decisions?');
      questions.push('What are the member inspection and audit access rights?');
    } else {
      questions.push('Summarize the key provisions of this document.');
      questions.push('What obligations or actions are required from members?');
      questions.push('Are there any deadlines, dates, or financial amounts specified?');
    }

    return questions.slice(0, 4);
  }

  /**
   * Search specifically within uploaded documents
   */
  public searchUploadedDocs(query: string, docId?: string | null): SearchResult[] {
    const targetDocs = docId && docId !== 'all' 
      ? this.documents.filter(d => d.id === docId)
      : this.documents;

    const allChunks = targetDocs.flatMap(d => d.chunks);
    if (allChunks.length === 0) return [];

    const queryTokens = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (queryTokens.length === 0) return [];

    const scored = allChunks.map(chunk => {
      let score = 0;
      const lowerContent = chunk.content.toLowerCase();
      const lowerTitle = chunk.docTitle.toLowerCase();
      const lowerSection = chunk.section.toLowerCase();

      queryTokens.forEach(t => {
        if (lowerContent.includes(t)) score += 1.5;
        if (lowerTitle.includes(t)) score += 2.0;
        if (lowerSection.includes(t)) score += 2.0;
        if (chunk.keywords.some(k => k.toLowerCase().includes(t))) score += 1.2;
      });

      return {
        chunk,
        score: Math.min(score / (queryTokens.length * 2 + 1), 0.99),
        snippet: chunk.content.substring(0, 240) + '...',
      };
    });

    return scored
      .filter(s => s.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }

  public toSourceReferences(results: SearchResult[]): SourceReference[] {
    return results.map(r => ({
      docTitle: r.chunk.docTitle,
      docType: r.chunk.docType,
      source: r.chunk.source,
      section: r.chunk.section,
      chapter: r.chunk.chapterOrPart,
      pageNumber: r.chunk.pageNumber,
      isDemoData: false,
      excerpt: r.snippet,
    }));
  }
}

export const documentService = new DocumentService();
