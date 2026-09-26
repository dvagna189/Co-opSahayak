import { LanguageCode } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants/languages';

// Web Speech API interface definitions for TypeScript
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export class VoiceAssistantManager {
  private recognition: any | null = null;
  private isListening: boolean = false;
  private currentLanguage: LanguageCode = 'en';
  private currentAudio: HTMLAudioElement | null = null;
  private cachedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.cachedVoices = window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.cachedVoices = window.speechSynthesis.getVoices();
      };
    }
  }

  public isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public setLanguage(langCode: LanguageCode): void {
    this.currentLanguage = langCode;
    if (this.recognition) {
      const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
      this.recognition.lang = langInfo ? langInfo.speechCode : 'en-IN';
    }
  }

  public startListening(
    callbacks: {
      onResult: (transcript: string, isFinal: boolean) => void;
      onError: (error: string) => void;
      onEnd: () => void;
      onStart?: () => void;
    },
    langCode: LanguageCode = this.currentLanguage
  ): boolean {
    if (!this.recognition) {
      callbacks.onError('Speech recognition is not supported in this browser environment. You can type your question.');
      return false;
    }

    this.stopSpeaking();

    if (this.isListening) {
      try {
        this.recognition.stop();
      } catch (_) {}
    }

    this.setLanguage(langCode);

    this.recognition.onstart = () => {
      this.isListening = true;
      callbacks.onStart?.();
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const fullAccumulated = (finalTranscript + ' ' + interimTranscript).replace(/\s+/g, ' ').trim();
      const hasFinal = !!finalTranscript.trim();
      if (fullAccumulated) {
        callbacks.onResult(fullAccumulated, !interimTranscript.trim() && hasFinal);
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.isListening = false;
      console.warn('Speech recognition error:', event.error);
      callbacks.onError(event.error === 'not-allowed' ? 'Microphone permission was denied. Please allow microphone access.' : `Voice recognition: ${event.error}`);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      callbacks.onEnd();
    };

    try {
      this.recognition.start();
      return true;
    } catch (err: any) {
      console.warn('Error starting speech recognition:', err);
      callbacks.onError('Could not start microphone.');
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (_) {}
      this.isListening = false;
    }
  }

  public findVoiceForLanguage(langCode: LanguageCode): SpeechSynthesisVoice | null {
    if (this.cachedVoices.length === 0 && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.cachedVoices = window.speechSynthesis.getVoices();
    }
    const voices = this.cachedVoices;
    if (!voices || voices.length === 0) return null;

    const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    const speechCode = langInfo ? langInfo.speechCode.toLowerCase().replace('_', '-') : 'en-in';
    const langCodeLower = langCode.toLowerCase();

    // 1. Exact match by speech code (e.g. 'te-in', 'hi-in', 'ta-in')
    let voice = voices.find(v => v.lang.toLowerCase().replace('_', '-') === speechCode);
    if (voice) return voice;

    // 2. Starts with language code (e.g. 'te-', 'hi-', 'mr-', 'ta-')
    voice = voices.find(v => {
      const vLang = v.lang.toLowerCase().replace('_', '-');
      return vLang.startsWith(langCodeLower + '-') || vLang === langCodeLower;
    });
    if (voice) return voice;

    // 3. Name contains language name (e.g. 'Telugu', 'Hindi', 'Tamil', 'Marathi')
    if (langInfo) {
      voice = voices.find(v => 
        v.name.toLowerCase().includes(langInfo.name.toLowerCase()) || 
        v.name.includes(langInfo.nativeName)
      );
      if (voice) return voice;
    }

    return null;
  }

  public async speak(
    text: string,
    langCode: LanguageCode,
    options: {
      audioBase64?: string;
      audioMimeType?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): Promise<void> {
    this.stopSpeaking();

    // Clean markdown and formatting from text for crisp vocal speech
    const cleanText = text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/\[Source \d+\]/g, '')
      .replace(/#+\s/g, '')
      .replace(/[•\-\_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      options.onEnd?.();
      return;
    }

    // 1. If pre-generated high-fidelity audio is provided, play IMMEDIATELY (0ms delay)
    if (options.audioBase64) {
      try {
        const mime = options.audioMimeType || 'audio/mpeg';
        const audioUrl = `data:${mime};base64,${options.audioBase64}`;
        const audio = new Audio(audioUrl);
        this.currentAudio = audio;

        audio.onplay = () => {
          options.onStart?.();
        };

        audio.onended = () => {
          this.currentAudio = null;
          options.onEnd?.();
        };

        audio.onerror = (e) => {
          console.warn('Pre-generated audio playback error, falling back:', e);
          this.currentAudio = null;
          this.fallbackSpeak(cleanText, langCode, options);
        };

        await audio.play();
        return;
      } catch (audioErr) {
        console.warn('Pre-generated audio play failed, falling back:', audioErr);
      }
    }

    await this.fallbackSpeak(cleanText, langCode, options);
  }

  private async fallbackSpeak(
    cleanText: string,
    langCode: LanguageCode,
    options: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ): Promise<void> {
    // 2. Fetch server-side TTS (Gemini TTS / High-Clarity Native Multi-lingual stream)
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, language: langCode }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.success && data.audioBase64) {
          const audioUrl = `data:${data.mimeType || 'audio/mpeg'};base64,${data.audioBase64}`;
          const audio = new Audio(audioUrl);
          this.currentAudio = audio;

          audio.onplay = () => {
            options.onStart?.();
          };

          audio.onended = () => {
            this.currentAudio = null;
            options.onEnd?.();
          };

          audio.onerror = (e) => {
            console.warn('Audio playback error, falling back to local speech synthesis:', e);
            this.currentAudio = null;
            this.speakWithSpeechSynthesis(cleanText, langCode, options);
          };

          await audio.play();
          return;
        }
      }
    } catch (apiErr) {
      console.warn('TTS API unavailable, falling back to browser speech synthesis:', apiErr);
    }

    // 3. Fallback to browser SpeechSynthesis (only if native voice exists or English)
    this.speakWithSpeechSynthesis(cleanText, langCode, options);
  }

  private isSynthesisSpeaking: boolean = false;

  private speakWithSpeechSynthesis(
    cleanText: string,
    langCode: LanguageCode,
    options: { onStart?: () => void; onEnd?: () => void; onError?: (err: any) => void } = {},
    voiceOverride?: SpeechSynthesisVoice | null
  ): void {
    if (!('speechSynthesis' in window)) {
      options.onError?.('Speech synthesis not available in this browser.');
      return;
    }

    this.stopSpeaking();

    // Check for native voice
    const voice = voiceOverride || this.findVoiceForLanguage(langCode);

    // If language is not English and no native regional voice is found, do NOT speak with English voice!
    if (langCode !== 'en' && !voice) {
      console.warn(`No native voice found in browser for ${langCode}, skipping corrupted English fallback.`);
      options.onEnd?.();
      return;
    }

    const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    const speechCode = langInfo ? langInfo.speechCode : 'en-IN';

    // Break cleanText into natural sentence chunks so SpeechSynthesis never times out or drops subsequent sentences
    const rawChunks = cleanText.match(/[^.!?।\n]+[.!?।\n]*/g) || [cleanText];
    const sentences = rawChunks.map(s => s.trim()).filter(Boolean);
    if (sentences.length === 0) {
      options.onEnd?.();
      return;
    }

    this.isSynthesisSpeaking = true;
    let currentIndex = 0;
    let hasStarted = false;

    const speakChunk = () => {
      if (!this.isSynthesisSpeaking) return;
      if (currentIndex >= sentences.length) {
        this.isSynthesisSpeaking = false;
        options.onEnd?.();
        return;
      }

      const chunk = sentences[currentIndex++];
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = voice ? voice.lang : speechCode;
      utterance.rate = 0.95; // Crisp, natural articulation
      utterance.pitch = 1.0;
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => {
        if (!hasStarted) {
          hasStarted = true;
          options.onStart?.();
        }
      };

      utterance.onend = () => {
        if (this.isSynthesisSpeaking) {
          speakChunk();
        }
      };

      utterance.onerror = (e) => {
        console.warn('Speech chunk error:', e);
        if (this.isSynthesisSpeaking) {
          speakChunk();
        }
      };

      window.speechSynthesis.speak(utterance);
    };

    speakChunk();
  }

  public stopSpeaking(): void {
    this.isSynthesisSpeaking = false;
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (_) {}
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const voiceManager = new VoiceAssistantManager();
