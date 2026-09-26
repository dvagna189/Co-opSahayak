import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  BookOpen,
  Send,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { voiceManager } from '../../services/voiceService';
import { sendChatMessage } from '../../services/api';
import { SUPPORTED_LANGUAGES } from '../../constants/languages';
import { LanguageCode } from '../../types';

export const VoiceAssistantModal: React.FC = () => {
  const {
    isVoiceModalOpen,
    closeVoiceModal,
    profile,
    updateProfile,
    messages,
    addMessage,
    activeDocument,
    uploadedDocuments,
    activeDocumentId,
    setActiveDocumentId,
    setSelectedSource,
    t,
  } = useApp();

  type VoicePhase = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

  const [phase, setPhase] = useState<VoicePhase>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [interimText, setInterimText] = useState<string>('');
  const [agentAnswer, setAgentAnswer] = useState<string>('');
  const [voiceSources, setVoiceSources] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [sampleQuestions, setSampleQuestions] = useState<string[]>([]);

  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestSpeechTextRef = useRef<string>('');

  const voiceLang: LanguageCode = profile.voiceLanguage || profile.responseLanguage || 'en';

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  // Configure sample questions based on voice language for all 12 languages
  useEffect(() => {
    const lang = voiceLang;
    const questionsByLang: Record<LanguageCode, string[]> = {
      te: [
        'నా సహకార సంఘ ఎన్నికలలో నేను ఓటు వేయవచ్చా?',
        'సొసైటీ ఆడిట్ రికార్డులను చూసే హక్కు నాకు ఉందా?',
        'మేనేజింగ్ కమిటీపై ఫిర్యాదు ఎలా చేయాలి?',
      ],
      hi: [
        'क्या मैं समिति के चुनाव में वोट दे सकता हूँ?',
        'सहकारी समिति में सदस्य के अधिकार क्या हैं?',
        'प्रबंध समिति के खिलाफ शिकायत कैसे दर्ज करें?',
      ],
      kn: [
        'ನನ್ನ ಸಹಕಾರ ಸಂಘದ ಚುನಾವಣೆಯಲ್ಲಿ ನಾನು ಮತ ಚಲಾಯಿಸಬಹುದೇ?',
        'ಸೊಸೈಟಿ ಲೆಕ್ಕಪರಿಶೋಧನಾ ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸುವ ಹಕ್ಕು ನನಗಿದೆಯೇ?',
        'ಆಡಳಿತ ಮಂಡಳಿ ವಿರುದ್ಧ ದೂರು ದಾಖಲಿಸುವುದು ಹೇಗೆ?',
      ],
      ta: [
        'கூட்டுறவு சங்கத் தேர்தலில் நான் வாக்களிக்க முடியுமா?',
        'சங்கத்தின் தணிக்கை அறிக்கைகளை ஆய்வு செய்யும் உரிமை எனக்கு உண்டா?',
        'நிர்வாகக் குழுவிற்கு எதிராகப் புகார் அளிப்பது எப்படி?',
      ],
      mr: [
        'मी माझ्या सहकारी संस्थेच्या निवडणुकीत मतदान करू शकतो का?',
        'संस्थेचे लेखापरीक्षण अहवाल तपासण्याचा मला अधिकार आहे का?',
        'व्यवस्थापकीय समितीविरुद्ध तक्रार कशी नोंदवावी?',
      ],
      bn: [
        'আমি কি আমার সমবায় নির্বাচনে ভোট দিতে পারি?',
        'সমিতির অডিট রেকর্ড দেখার অধিকার কি আমার আছে?',
        'ব্যবস্থাপনা কমিটির বিরুদ্ধে কিভাবে অভিযোগ করবেন?',
      ],
      gu: [
        'શું હું મારી સહકારી મંડળીની ચૂંટણીમાં મત આપી શકું?',
        'શું મને મંડળીના ઓડિટ રેકોર્ડ જોવાનો અધિકાર છે?',
        'મેનેજિંગ કમિટી સામે ફરિયાદ કેવી રીતે કરવી?',
      ],
      ml: [
        'സഹകരണ സംഘം തിരഞ്ഞെടുപ്പിൽ എനിക്ക് വോട്ട് ചെയ്യാമോ?',
        'സൊസൈറ്റി ഓഡിറ്റ് രേഖകൾ പരിശോധിക്കാൻ എനിക്ക് അവകാശമുണ്ടോ?',
        'മാനേജിംഗ് കമ്മിറ്റിക്കെതിരെ പരാതി നൽകുന്നത് എങ്ങനെ?',
      ],
      pa: [
        'ਕੀ ਮੈਂ ਆਪਣੀ ਸਹਿਕਾਰੀ ਸਭਾ ਦੀਆਂ ਚੋਣਾਂ ਵਿੱਚ ਵੋਟ ਪਾ ਸਕਦਾ ਹਾਂ?',
        'ਕੀ ਮੈਨੂੰ ਸੁਸਾਇਟੀ ਦੇ ਆਡਿਟ ਰਿਕਾਰਡ ਦੇਖਣ ਦਾ ਅਧਿਕਾਰ ਹੈ?',
        'ਪ੍ਰਬੰਧਕੀ ਕਮੇਟੀ ਵਿਰੁੱਧ ਸ਼ਿਕਾਇਤ ਕਿਵੇਂ ਦਰਜ ਕਰੀਏ?',
      ],
      or: [
        'ମୁଁ କଣ ମୋ ସମବାୟ ସମିତି ନିର୍ବାଚନରେ ଭୋଟ୍ ଦେଇପାରିବି?',
        'ସମିତିର ଅଡିଟ୍ ରେକର୍ଡ ଦେଖିବା ପାଇଁ ମୋର ଅଧିକାର ଅଛି କି?',
        'ପରିଚାଳନା କମିଟି ବିରୁଦ୍ଧରେ କିପରି ଅଭିଯୋଗ କରିବେ?',
      ],
      as: [
        'মই সমবায় সমিতিৰ নিৰ্বাচনত ভোট দিব পাৰিমনে?',
        'সমিতিৰ অডিট ৰেকৰ্ড চোৱাৰ অধিকাৰ মোৰ আছেনে?',
        'পৰিচালনা সমিতিৰ বিৰুদ্ধে কেনেকৈ অভিযোগ কৰিব?',
      ],
      en: [
        'Can I vote in my cooperative election?',
        'What are my rights to inspect society audit reports?',
        'How do I file a grievance against the managing committee?',
      ],
    };

    setSampleQuestions(questionsByLang[lang] || questionsByLang.en);
  }, [voiceLang]);

  // Clean up speech on close
  useEffect(() => {
    if (!isVoiceModalOpen) {
      clearSilenceTimer();
      latestSpeechTextRef.current = '';
      voiceManager.stopListening();
      voiceManager.stopSpeaking();
      setPhase('idle');
      setTranscript('');
      setInterimText('');
      setAgentAnswer('');
      setErrorMessage('');
    }
  }, [isVoiceModalOpen]);

  if (!isVoiceModalOpen) return null;

  const handleStartListening = () => {
    clearSilenceTimer();
    latestSpeechTextRef.current = '';
    setErrorMessage('');
    setTranscript('');
    setInterimText('');
    setAgentAnswer('');
    voiceManager.stopSpeaking();

    const success = voiceManager.startListening(
      {
        onStart: () => {
          setPhase('listening');
        },
        onResult: (text: string, isFinal: boolean) => {
          latestSpeechTextRef.current = text;
          setTranscript(text);
          setInterimText('');

          // Clear any pending silence timer
          clearSilenceTimer();

          // Intelligent natural silence detection:
          // Wait 2500ms after user finishes speaking at least 2 words before auto-submitting.
          // This ensures members can speak complete, multi-part cooperative questions
          // and pause naturally without being prematurely cut off.
          if (text.trim().split(/\s+/).length >= 2) {
            silenceTimerRef.current = setTimeout(() => {
              const currentText = latestSpeechTextRef.current.trim();
              if (currentText && (phase === 'listening' || latestSpeechTextRef.current)) {
                voiceManager.stopListening();
                processVoiceQuery(currentText);
              }
            }, 2500);
          }
        },
        onError: (err: string) => {
          clearSilenceTimer();
          setPhase('error');
          setErrorMessage(err);
        },
        onEnd: () => {
          clearSilenceTimer();
          if (phase === 'listening' && !latestSpeechTextRef.current.trim()) {
            setPhase('idle');
          }
        },
      },
      voiceLang
    );

    if (!success) {
      setPhase('error');
    }
  };

  const handleStopListening = () => {
    clearSilenceTimer();
    voiceManager.stopListening();
    const query = (latestSpeechTextRef.current || transcript || interimText).trim();
    if (query) {
      processVoiceQuery(query);
    } else {
      setPhase('idle');
    }
  };

  const processVoiceQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    clearSilenceTimer();
    voiceManager.stopListening();
    setPhase('processing');
    setTranscript(queryText);
    setInterimText('');

    // Also persist to conversation history so context is never lost
    addMessage({
      id: `msg-voice-user-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: voiceLang,
    });

    try {
      const result = await sendChatMessage({
        query: queryText,
        history: messages,
        profile,
        language: voiceLang,
        isVoice: true,
        documentContext: activeDocument
          ? {
              id: activeDocument.id,
              name: activeDocument.name,
              rawText: activeDocument.rawText,
              fullText: activeDocument.rawText,
              textSnippet: activeDocument.rawText,
              chunks: activeDocument.chunks,
            }
          : undefined,
      });

      setAgentAnswer(result.response);
      setVoiceSources(result.sources || []);

      // Record assistant answer in conversation memory
      addMessage({
        id: `msg-voice-assistant-${Date.now()}`,
        sender: 'assistant',
        text: result.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        route: result.route,
        sources: result.sources,
        toolsUsed: result.toolsUsed,
        language: voiceLang,
      });

      // Speak response IMMEDIATELY in the user's selected voice language with clarity
      if (!isMuted) {
        setPhase('speaking');
        voiceManager.speak(result.response, voiceLang, {
          audioBase64: result.audioBase64,
          audioMimeType: result.audioMimeType,
          onStart: () => {
            setPhase('speaking');
          },
          onEnd: () => {
            setPhase('idle');
          },
          onError: () => {
            setPhase('idle');
          },
        });
      } else {
        setPhase('idle');
      }
    } catch (err: any) {
      setPhase('error');
      setErrorMessage(err.message || 'Failed to process voice query');
    }
  };

  const handleMuteToggle = () => {
    if (!isMuted) {
      voiceManager.stopSpeaking();
      setIsMuted(true);
      if (phase === 'speaking') {
        setPhase('idle');
      }
    } else {
      setIsMuted(false);
      if (agentAnswer) {
        setPhase('speaking');
        voiceManager.speak(agentAnswer, voiceLang, {
          onStart: () => setPhase('speaking'),
          onEnd: () => setPhase('idle'),
          onError: () => setPhase('idle'),
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Back/Close preserving state */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            id="btn-voice-back-close"
            onClick={closeVoiceModal}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.backBtn} / {t.closeBtn}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Voice Language:</span>
            <select
              id="select-voice-modal-language"
              value={voiceLang}
              onChange={(e) => {
                const newLang = e.target.value as LanguageCode;
                updateProfile({ voiceLanguage: newLang });
                voiceManager.setLanguage(newLang);
              }}
              className="text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName} ({l.name})
                </option>
              ))}
            </select>
          </div>

          <button
            id="btn-voice-header-close"
            onClick={closeVoiceModal}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Context Selector Ribbon */}
        {uploadedDocuments.length > 0 && (
          <div className="px-6 py-2 bg-emerald-50/70 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-950 font-medium truncate">
              <span className="shrink-0 font-bold flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                <span>Target Doc:</span>
              </span>
              <select
                id="select-voice-doc-context"
                value={activeDocumentId || 'all'}
                onChange={(e) => setActiveDocumentId(e.target.value === 'all' ? null : e.target.value)}
                className="bg-white border border-emerald-300 text-emerald-950 rounded-lg px-2 py-0.5 text-xs font-semibold focus:outline-none cursor-pointer truncate max-w-[260px]"
              >
                <option value="all">Statutory Acts & Model Bylaws (General)</option>
                {uploadedDocuments.map((d) => (
                  <option key={d.id} value={d.id}>
                    📄 {d.name}
                  </option>
                ))}
              </select>
            </div>
            {activeDocument && (
              <span className="text-[11px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full font-semibold shrink-0">
                Grounded strictly in this doc
              </span>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col items-center justify-center text-center">
          {/* Main Visualizer / Status Indicator */}
          <div className="relative my-4 flex items-center justify-center">
            {phase === 'listening' && (
              <>
                <div className="absolute w-44 h-44 rounded-full bg-emerald-400/25 animate-ping" />
                <div className="absolute w-36 h-36 rounded-full bg-emerald-500/35 animate-pulse" />
                <div className="absolute w-28 h-28 rounded-full bg-emerald-600/30" />
              </>
            )}
            {phase === 'speaking' && (
              <>
                <div className="absolute w-36 h-36 rounded-full bg-teal-400/20 animate-pulse" />
                <div className="absolute w-28 h-28 rounded-full bg-emerald-400/20 animate-ping" />
              </>
            )}
            {phase === 'processing' && (
              <div className="absolute w-32 h-32 rounded-full bg-emerald-500/15 animate-spin border-2 border-dashed border-emerald-500" />
            )}

            <button
              id="btn-voice-mic-main"
              onClick={
                phase === 'listening'
                  ? handleStopListening
                  : phase === 'speaking'
                  ? () => {
                      voiceManager.stopSpeaking();
                      setPhase('idle');
                    }
                  : handleStartListening
              }
              className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center text-white shadow-xl transition-all transform active:scale-95 ${
                phase === 'listening'
                  ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/60 ring-8 ring-emerald-300/80 animate-pulse'
                  : phase === 'speaking'
                  ? 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/40 ring-4 ring-emerald-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/40 ring-4 ring-emerald-100 hover:ring-emerald-200'
              }`}
              title={phase === 'speaking' ? 'Click to stop speaking' : phase === 'listening' ? 'Click to stop listening' : 'Click to speak'}
            >
              {phase === 'listening' ? (
                <MicOff className="w-10 h-10 animate-bounce text-white" />
              ) : phase === 'speaking' ? (
                <Volume2 className="w-10 h-10 animate-pulse text-white" />
              ) : (
                <Mic className="w-10 h-10 text-white" />
              )}
            </button>
          </div>

          {/* Phase Status Banner */}
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-center gap-2">
              {phase === 'listening' && (
                <span className="text-emerald-600 animate-pulse flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  {t.voiceListening} (Speak clearly)
                </span>
              )}
              {phase === 'processing' && (
                <span className="text-emerald-700 font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
                  {t.voiceProcessing || 'Generating complete answer...'}
                </span>
              )}
              {phase === 'speaking' && (
                <span className="text-teal-700 font-bold flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-teal-600 animate-pulse" />
                  {t.voiceSpeaking}
                </span>
              )}
              {phase === 'idle' && <span className="text-slate-700">{t.voiceIdle}</span>}
              {phase === 'error' && <span className="text-amber-700">Voice Error</span>}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Speaking as: <span className="font-semibold text-slate-700">{profile.name}</span> ({profile.role}) • {profile.societyName || 'Cooperative'}
            </p>
          </div>

          {/* Spoken Transcript display */}
          {(transcript || interimText) && (
            <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-4 text-left">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  You Spoke ({voiceLang.toUpperCase()}):
                </span>
                {phase === 'listening' && (
                  <button
                    id="btn-voice-instant-ask"
                    onClick={handleStopListening}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-all active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Ask Question Now</span>
                  </button>
                )}
              </div>
              <p className="text-sm font-medium text-slate-800">
                {transcript} <span className="text-emerald-600 font-normal italic">{interimText}</span>
              </p>
            </div>
          )}

          {/* Assistant Voice Response */}
          {agentAnswer && (
            <div className="w-full bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200 mb-4 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Co-opSahayak Answer:
                </span>
                <button
                  id="btn-voice-mute-toggle"
                  onClick={handleMuteToggle}
                  className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-100"
                  title={isMuted ? 'Unmute voice' : 'Mute voice'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {agentAnswer}
              </p>

              {/* Sources link */}
              {voiceSources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-emerald-200 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-emerald-900 font-semibold flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-emerald-700" /> Sources Cited:
                  </span>
                  {voiceSources.map((src, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedSource(src)}
                      className="text-xs bg-white text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-lg hover:bg-emerald-100 transition-all font-medium"
                    >
                      {src.section || src.docTitle}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="w-full bg-red-50 text-red-700 rounded-xl p-3 border border-red-200 mb-4 text-xs text-left flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <div>
                <p className="font-semibold">{errorMessage}</p>
                <p className="mt-0.5 text-red-600">Please verify microphone permissions or try typing your question.</p>
              </div>
            </div>
          )}

          {/* Quick Voice Prompt Suggestions */}
          {phase === 'idle' && !agentAnswer && (
            <div className="w-full mt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-left">
                Or tap to ask one of these questions aloud:
              </span>
              <div className="space-y-2 text-left">
                {sampleQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => processVoiceQuery(q)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 text-xs font-medium text-slate-700 text-left transition-all flex items-center justify-between group"
                  >
                    <span>{q}</span>
                    <Send className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with state preservation message */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Your workflow state and form progress remain safe.</span>
          <button
            id="btn-voice-footer-done"
            onClick={closeVoiceModal}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium transition-all"
          >
            {t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
