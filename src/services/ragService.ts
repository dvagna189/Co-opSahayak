import { ALL_KNOWLEDGE_CHUNKS, DEMO_KNOWLEDGE_DOCUMENTS } from '../data/demoKnowledgeBase';
import { KnowledgeChunk, SearchResult, SourceReference, QueryRoute } from '../types';

// Simple lightweight vector & BM25-style lexical RAG engine that runs cleanly in client & server
export class RagEngine {
  private chunks: KnowledgeChunk[];

  constructor(chunks: KnowledgeChunk[] = ALL_KNOWLEDGE_CHUNKS) {
    this.chunks = chunks;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s\u0900-\u097F\u0C00-\u0C7F\u0B80-\u0BFF\u0C80-\u0CFF]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);
  }

  public search(query: string, options: { limit?: number; route?: QueryRoute; minScore?: number } = {}): SearchResult[] {
    const limit = options.limit ?? 3;
    const minScore = options.minScore ?? 0.15;
    const queryTokens = this.tokenize(query);

    if (queryTokens.length === 0) {
      return [];
    }

    const scoredResults: SearchResult[] = this.chunks.map(chunk => {
      let score = 0;
      const contentTokens = this.tokenize(chunk.content);
      const titleTokens = this.tokenize(chunk.docTitle + ' ' + chunk.section + ' ' + chunk.chapterOrPart);
      const keywordTokens = chunk.keywords.map(k => k.toLowerCase());

      // Term frequency in content
      queryTokens.forEach(token => {
        // Exact keyword match
        if (keywordTokens.some(k => k.includes(token))) {
          score += 1.5;
        }
        // Title / section match
        if (titleTokens.includes(token)) {
          score += 1.2;
        }
        // Content occurrences
        const matches = contentTokens.filter(t => t.includes(token)).length;
        if (matches > 0) {
          score += Math.min(matches * 0.4, 1.6);
        }
      });

      // Semantic route boost
      if (options.route) {
        if (options.route === 'GOVERNANCE_PROCEDURE' && chunk.docType === 'Bylaw') score += 0.5;
        if (options.route === 'LEGAL_RIGHTS' && (chunk.docType === 'Act' || chunk.section.toLowerCase().includes('right'))) score += 0.6;
        if (options.route === 'GRIEVANCE' && chunk.docType === 'Grievance Rules') score += 0.8;
      }

      // Keyword associations for typical Indian cooperative terms in Telugu, Hindi, English
      const lowerQ = query.toLowerCase();
      if ((lowerQ.includes('vote') || lowerQ.includes('ఓటు') || lowerQ.includes('वोट') || lowerQ.includes('election') || lowerQ.includes('ఎన్నిక') || lowerQ.includes('चुनाव')) && 
          (chunk.id.includes('elect') || chunk.id.includes('bylaw-sec-11'))) {
        score += 2.0;
      }

      if ((lowerQ.includes('grievance') || lowerQ.includes('complaint') || lowerQ.includes('ఫిర్యాదు') || lowerQ.includes('शिकायत')) && 
          chunk.id.includes('grievance')) {
        score += 2.0;
      }

      if ((lowerQ.includes('register') || lowerQ.includes('registration') || lowerQ.includes('నమోదు') || lowerQ.includes('पंजीकरण')) && 
          chunk.id.includes('reg-')) {
        score += 2.0;
      }

      if ((lowerQ.includes('audit') || lowerQ.includes('accounts') || lowerQ.includes('ఖాతా') || lowerQ.includes('లెక్క') || lowerQ.includes('ऑडिट') || lowerQ.includes('inspect') || lowerQ.includes('rights') || lowerQ.includes('హక్కు')) && 
          chunk.id.includes('mscs-sec-38')) {
        score += 1.8;
      }

      // Normalize score between 0 and 1.0 roughly
      const normalizedScore = Math.min(score / (queryTokens.length * 1.8 + 1), 0.98);

      // Extract snippet around matched keywords
      let snippet = chunk.content.substring(0, 220) + '...';
      const firstTokenIndex = queryTokens.reduce((foundIdx, tok) => {
        if (foundIdx !== -1) return foundIdx;
        const idx = chunk.content.toLowerCase().indexOf(tok);
        return idx !== -1 ? idx : -1;
      }, -1);

      if (firstTokenIndex > 40) {
        const start = Math.max(0, firstTokenIndex - 30);
        snippet = '...' + chunk.content.substring(start, start + 200) + '...';
      }

      return {
        chunk,
        score: parseFloat(normalizedScore.toFixed(3)),
        snippet,
      };
    });

    return scoredResults
      .filter(r => r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  public toSourceReferences(results: SearchResult[]): SourceReference[] {
    return results.map(r => ({
      docTitle: r.chunk.docTitle,
      docType: r.chunk.docType,
      source: r.chunk.source,
      section: r.chunk.section,
      chapter: r.chunk.chapterOrPart,
      pageNumber: r.chunk.pageNumber,
      isDemoData: r.chunk.isDemoData,
      excerpt: r.snippet,
    }));
  }

  public formatGroundingContext(results: SearchResult[]): string {
    if (results.length === 0) {
      return 'No verified cooperative documents matched the query. Explicitly notify the user that this could not be verified from the available cooperative bylaws or acts.';
    }

    return results
      .map((r, idx) => {
        return `[Source ${idx + 1}]
Document: ${r.chunk.docTitle} (${r.chunk.docType})
Section: ${r.chunk.section}
Chapter: ${r.chunk.chapterOrPart}
Authority: ${r.chunk.source}
Content:
${r.chunk.content}
`;
      })
      .join('\n---\n');
  }

  public getAllDocuments() {
    return DEMO_KNOWLEDGE_DOCUMENTS;
  }

  public getChunkById(id: string): KnowledgeChunk | undefined {
    return this.chunks.find(c => c.id === id);
  }
}

export const defaultRagEngine = new RagEngine();
