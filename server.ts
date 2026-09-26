import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { ALL_KNOWLEDGE_CHUNKS, DEMO_KNOWLEDGE_DOCUMENTS } from './src/data/demoKnowledgeBase';
import { defaultRagEngine } from './src/services/ragService';
import { QueryRoute, LanguageCode, UserProfile, GrievanceFormData, GrievanceLetter } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// In-memory persistent stores for sessions & workflows
const userProfilesStore: Record<string, UserProfile> = {};
const workflowStatesStore: Record<string, any> = {};

// Lazy Gemini client initialization with telemetry User-Agent
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// ----------------------------------------------------
// 1. QUERY CLASSIFIER / ROUTER LOGIC & RELEVANCE
// ----------------------------------------------------

const NOT_RELEVANT_MESSAGES: Record<LanguageCode, string> = {
  en: "This question is not relevant to cooperative societies and legal assistance. Co-opSahayak specializes strictly in cooperative society bylaws, member rights, elections, governance, audits, and grievance redressal. Please ask a question related to your cooperative society.",
  te: "ఈ ప్రశ్న సహకార సంఘాలు మరియు చట్టపరమైన సహాయానికి సంబంధించినది కాదు. కో-ఆప్ సహాయక్ ప్రత్యేకంగా సహకార సంఘాల ఉపనియమాలు, సభ్యుల హక్కులు, ఎన్నికలు, ఆడిట్ మరియు ఫిర్యాదుల పరిష్కారానికి మాత్రమే సహాయపడుతుంది. దయచేసి మీ సహకార సంఘానికి సంబంధించిన ప్రశ్నను అడగండి.",
  hi: "यह प्रश्न सहकारी समितियों और कानूनी सहायता से संबंधित नहीं है। को-ऑप सहायक (Co-opSahayak) विशेष रूप से सहकारी समिति के उपनियमों, सदस्य अधिकारों, चुनावों, ऑडिट और शिकायत निवारण में सहायता के लिए समर्पित है। कृपया अपनी सहकारी समिति से संबंधित प्रश्न पूछें।",
  kn: "ಈ ಪ್ರಶ್ನೆಯು ಸಹಕಾರ ಸಂಘಗಳು ಮತ್ತು ಕಾನೂನು ನೆರವಿಗೆ ಸಂಬಂಧಿಸಿದ್ದಲ್ಲ. ಕೋ-ಆಪ್ ಸಹಾಯಕವು ಕೇವಲ ಸಹಕಾರ ಸಂಘಗಳ ಉಪನಿಯಮಗಳು, ಸದಸ್ಯರ ಹಕ್ಕುಗಳು, ಚುನಾವಣೆಗಳು, ಲೆಕ್ಕಪರಿಶೋಧನೆ ಮತ್ತು ಕುಂದುಕೊರತೆ ನಿವಾರಣೆಗೆ ಮಾತ್ರ ಮೀಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಸಹಕಾರ ಸಂಘಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ಪ್ರಶ್ನೆಯನ್ನು ಕೇಳಿ.",
  ta: "இந்தக் கேள்வி கூட்டுறவு சங்கங்கள் மற்றும் சட்ட உதவிக்கு பொருத்தமானது அல்ல. கோ-ஆப் சகாயக் பிரத்தியேகமாக கூட்டுறவு சங்க துணை விதிகள், உறுப்பினர் உரிமைகள், தேர்தல்கள், தணிக்கை மற்றும் குறைதீர்ப்புக்கு மட்டுமே உதவுகிறது. தயவுசெய்து உங்கள் கூட்டுறவு சங்கம் தொடர்பான கேள்வியைக் கேட்கவும்.",
  mr: "हा प्रश्न सहकारी संस्था आणि कायदेशीर मदतीशी संबंधित नाही. को-ऑप सहाय्यक केवळ सहकारी संस्थांचे उपनियम, सदस्य हक्क, निवडणुका, लेखापरीक्षण आणि तक्रार निवारणासाठी समर्पित आहे. कृपया आपल्या सहकारी संस्थेशी संबंधित प्रश्न विचारा.",
  bn: "এই প্রশ্নটি সমবায় সমিতি এবং আইনি সহায়তার সাথে সম্পর্কিত নয়। কো-অপ সহায়ক শুধুমাত্র সমবায় সমিতির উপ-আইন, সদস্য অধিকার, নির্বাচন, নিরীক্ষা এবং অভিযোগ প্রতিকারের জন্য নিবেদিত। দয়া করে আপনার সমবায় সমিতি সম্পর্কিত প্রশ্ন জিজ্ঞাসা করুন।",
  gu: "આ પ્રશ્ન સહકારી મંડળીઓ અને કાનૂની સહાયતા સાથે સંબંધિત નથી. કો-ઓપ સહાયક ફક્ત સહકારી મંડળીના ઉપનિયમો, સભ્ય અધિકારો, ચૂંટણીઓ, ઓડિટ અને ફરિયાદ નિવારણ માટે સહાય કરે છે. કૃપા કરીને તમારી સહકારી મંડળી સંબંધિત પ્રશ્ન પૂછો.",
  ml: "ഈ ചോദ്യം സഹകരണ സംഘങ്ങളുമായും നിയമ സഹായങ്ങളുമായും ബന്ധപ്പെട്ടതല്ല. സഹകരണ സംഘങ്ങളുടെ ഉപനിയമങ്ങൾ, അംഗങ്ങളുടെ അവകാശങ്ങൾ, തിരഞ്ഞെടുപ്പുകൾ, ഓഡിറ്റ്, പരാതി പരിഹാരം എന്നിവയ്ക്ക് മാത്രമായി കോ-ഓപ് സഹായക് സമർപ്പിച്ചിരിക്കുന്നു. ദയവായി നിങ്ങളുടെ സഹകരണ സംഘവുമായി ബന്ധപ്പെട്ട ചോദ്യം ചോദിക്കുക.",
  pa: "ਇਹ ਸਵਾਲ ਸਹਿਕਾਰੀ ਸਭਾਵਾਂ ਅਤੇ ਕਾਨੂੰਨੀ ਸਹਾਇਤਾ ਨਾਲ ਸੰਬੰਧਿਤ ਨਹੀਂ ਹੈ। ਕੋ-ਆਪ ਸਹਾਇਕ ਖਾਸ ਤੌਰ 'ਤੇ ਸਹਿਕਾਰੀ ਸਭਾਵਾਂ ਦੇ ਉਪ-ਨਿਯਮਾਂ, ਮੈਂਬਰ ਅਧਿਕਾਰਾਂ, ਚੋਣਾਂ, ਆਡਿਟ ਅਤੇ ਸ਼ਿਕਾਇਤ ਨਿਵਾਰਣ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਸਹਿਕਾਰੀ ਸਭਾ ਨਾਲ ਸੰਬੰਧਿਤ ਸਵਾਲ ਪੁੱਛੋ।",
  or: "ଏହି ପ୍ରଶ୍ନଟି ସମବାୟ ସମିତି ଏବଂ ଆଇନଗତ ସହାୟତା ସହିତ ପ୍ରାସଙ୍ଗିକ ନୁହେଁ। କୋ-ଅପ୍ ସହାୟକ କେବଳ ସମବାୟ ସମିତିର ଉପ-ନିୟମ, ସଦସ୍ୟ ଅଧିକାର, ନିର୍ବାଚନ, ଅଡିଟ୍ ଏବଂ ଅଭିଯୋଗ ନିବାରଣ ପାଇଁ ଉଦ୍ଦିଷ୍ଟ। ଦୟାକରି ଆପଣଙ୍କ ସମବାୟ ସମିତି ସମ୍ବନ୍ଧୀୟ ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ।",
  as: "এই প্ৰশ্নটো সমবায় সমিতি আৰু আইনী সাহায্যৰ সৈতে প্ৰাসংগিক নহয়। কো-অ'প সহায়ক বিশেষভাৱে সমবায় সমিতিৰ উপ-নিয়ম, সদস্যৰ অধিকাৰ, নিৰ্বাচন, অডিট আৰু অভিযোগ নিষ্পত্তিৰ বাবে সহায় কৰে। অনুগ্ৰহ কৰি আপোনাৰ সমবায় সমিতি সম্পৰ্কীয় প্ৰশ্ন সোধক।",
};

const DOC_INFO_NOT_FOUND_MESSAGES: Record<LanguageCode, (docName: string) => string> = {
  en: (docName) => `This information is not present in the uploaded document "${docName}". Please verify if the requested details are covered under another clause or document.`,
  te: (docName) => `మీరు అడిగిన సమాచారం మీరు అప్‌లోడ్ చేసిన "${docName}" పత్రంలో అందుబాటులో లేదు. దయచేసి సంబంధిత వివరాలు ఉన్న ఇతర పత్రాన్ని పరిశీలించండి.`,
  hi: (docName) => `यह जानकारी आपके द्वारा अपलोड किए गए दस्तावेज़ "${docName}" में उपलब्ध नहीं है। कृपया जाँचें कि क्या किसी अन्य दस्तावेज़ या उपनियम में यह विवरण मौजूद है।`,
  ta: (docName) => `இந்தத் தகவல் நீங்கள் பதிவேற்றிய "${docName}" ஆவணத்தில் இல்லை. தயவுசெய்து வேறு ஆவணத்தில் இந்த விவரங்கள் உள்ளதா என சரிபார்க்கவும்.`,
  kn: (docName) => `ಈ ಮಾಹಿತಿಯು ನೀವು ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ "${docName}" ದಾಖಲೆಯಲ್ಲಿ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಬೇರೆ ದಾಖಲೆಯಲ್ಲಿ ಈ ವಿವರಗಳಿವೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ.`,
  mr: (docName) => `ही माहिती आपण अपलोड केलेल्या "${docName}" दस्तऐवजात उपलब्ध नाही. कृपया इतर दस्तऐवजात किंवा उपनियमात हे तपशील आहेत का ते तपासा.`,
  bn: (docName) => `এই তথ্যটি আপনার আপলোড করা "${docName}" নথিতে নেই। অনুগ্রহ করে অন্য কোনো নথি বা উপ-আইনে এই বিবরণ রয়েছে কিনা তা পরীক্ষা করুন।`,
  gu: (docName) => `આ માહિતી તમે અપલોડ કરેલા "${docName}" દસ્તાવેજમાં ઉપલબ્ધ નથી. કૃપા કરીને તપાસો કે અન્ય દસ્તાવેજમાં આ વિગતો છે કે નહીં.`,
  ml: (docName) => `ഈ വിവരം നിങ്ങൾ അപ്‌ലോഡ് ചെയ്ത "${docName}" രേഖയിൽ ലഭ്യമല്ല. മറ്റ് രേഖകളിൽ ഈ വിവരങ്ങൾ ഉണ്ടോ എന്ന് പരിശോധിക്കുക.`,
  pa: (docName) => `ਇਹ ਜਾਣਕਾਰੀ ਤੁਹਾਡੇ ਵੱਲੋਂ ਅਪਲੋਡ ਕੀਤੇ ਦਸਤਾਵੇਜ਼ "${docName}" ਵਿੱਚ ਮੌਜੂਦ ਨਹੀਂ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਜਾਂਚ ਕਰੋ ਕਿ ਕੀ ਕਿਸੇ ਹੋਰ ਦਸਤਾਵੇਜ਼ ਵਿੱਚ ਇਹ ਵੇਰਵੇ ਹਨ।`,
  or: (docName) => `ଏହି ସୂଚନା ଆପଣ ଅପଲୋଡ୍ କରିଥିବା "${docName}" ଦସ୍ତାବିଜରେ ଉପଲବ୍ଧ ନାହିଁ। ଦୟାକରି ଯାଞ୍ଚ କରନ୍ତୁ ଯେ ଅନ୍ୟ କୌଣସି ଦସ୍ତାବିଜରେ ଏହି ବିବରଣୀ ଅଛି କି ନାହିଁ।`,
  as: (docName) => `এই তথ্য আপুনি আপলোড কৰা "${docName}" নথিপত্ৰত উপলব্ধ নহয়। অনুগ্ৰহ কৰি পৰীক্ষা কৰক যে আন কোনো নথিত এই বিৱৰণ আছে নেকি।`,
};

const SUGGESTED_COOP_FOLLOWUPS: Record<LanguageCode, string[]> = {
  en: [
    'Can I vote in my cooperative election?',
    'What are my rights to inspect society audit records?',
    'How do I file a grievance against the managing committee?',
  ],
  te: [
    'నా సహకార సంఘ ఎన్నికలలో నేను ఓటు వేయవచ్చా?',
    'సొసైటీ ఆడిట్ రికార్డులను పరిశీలించే హక్కు నాకు ఉందా?',
    'మేనేజింగ్ కమిటీపై ఫిర్యాదు ఎలా దాఖలు చేయాలి?',
  ],
  hi: [
    'क्या मैं समिति के चुनाव में वोट दे सकता हूँ?',
    'क्या मुझे समिति के ऑडिट रिकॉर्ड देखने का अधिकार है?',
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
};

function classifyQueryLocal(query: string): { route: QueryRoute; confidence: number; reasoning: string } {
  const q = query.trim().toLowerCase();

  // 1. Explicit Out-of-Scope triggers (zero-hallucination check)
  const OUT_OF_SCOPE_PATTERNS = [
    // Weather & Climate
    /\b(weather|rain|temperature|forecast|monsoon|climate|snow|storm)\b/i,
    /हवामान|मौसम|వాతావరణం|வானிலை|ಹವಾಮಾನ|আবহাওয়া|હવામાન|കാലാവസ്ഥ|ਮੌਸਮ/i,
    // Sports, Cricket & Entertainment
    /\b(cricket|football|fifa|ipl|world cup|virat|dhoni|sachin|messi|ronaldo|tennis|badminton|olympics|sports|stadium)\b/i,
    /क्रिकेट|खेल|సినిమా|పాట|திரைப்படம்|ಚಲನಚಿತ್ರ|গান|ગુજરાતી ગીત|ക്രിക്കറ്റ്|ਕ੍ਰਿਕਟ/i,
    /\b(movie|cinema|actor|actress|bollywood|hollywood|tollywood|netflix|youtube|instagram|song|music|dance|video)\b/i,
    // Cooking, Food & Recipes
    /\b(recipe|cook|cooking|bake|cake|biryani|paneer|curry|food|restaurant|chef|snack|tea|coffee)\b/i,
    /खाना|रेसिपी|వంట|రෙසిపీ|ரெசிபி|ಪಾಕವಿಧಾನ|রান্না|રેસીપી|ഭക്ഷണം/i,
    // Tech, Coding & IT
    /\b(python|javascript|typescript|c\+\+|java|html|css|react|node|developer|coding|programming|algorithm|sql query|git|bug)\b/i,
    // Math & Science Trivia
    /\b(calculus|algebra|physics|astronomy|black hole|mars|jupiter|dinosaur|capital of|distance to)\b/i,
    // Medical & Clinical
    /\b(medicine|headache|fever|cough|cancer|treatment|doctor symptom|tablet dose|syrup|hospital emergency)\b/i,
    /दवा|मందు|மருந்து|ಔಷಧ|ঔষধ|દવા/i,
    // Jokes, Chitchat & Cryptos
    /\b(joke|jokes|funny story|shayari|poem|bitcoin|crypto|ethereum|stock buy|share trading)\b/i,
    /चुटकुला|జోక్|కథ|ತಮಾಷೆ|কৌতুক|ਰਮਜ਼/i,
  ];

  for (const pattern of OUT_OF_SCOPE_PATTERNS) {
    if (pattern.test(q)) {
      return {
        route: 'OUT_OF_SCOPE',
        confidence: 0.98,
        reasoning: 'The query is unrelated to cooperative societies, bylaws, elections, or member rights.',
      };
    }
  }

  // 2. Cooperative society domain indicators (English + regional scripts)
  const COOP_PATTERNS = [
    /coop|co-op|cooperative|society|chs|rwa|pacs|fpo|dairy|milk|sugar|housing society|apartment|flat owner|credit society/i,
    /సహకార|సొసైటీ|సంఘం|सहकारी|समिति|संस्था|கூட்டுறவு|சங்கம்|ಸಹಕಾರ|ಸಂಘ|সমবায়|સહકારી|സഹകരണ|ਸਹਿਕਾਰੀ|ସମବାୟ/i,
    /member|membership|share|shares|allotment|expulsion|nominee|defaulter|active member/i,
    /సభ్య|सदस्य|உறுப்பினர்|ಸದಸ್ಯ|সদস্য|સભ્ય|അംഗം|ਮੈਂਬਰ|ସଦସ୍ୟ/i,
    /bylaw|by-law|rule|rules|act|section|sub-rule|clause|amendment/i,
    /ఉపనియమ|నిబంధన|उपनियम|कायदा|துணை விதி|ಉಪನಿಯಮ|উপ-আইন|ਨਿਯਮ/i,
    /vote|voting|election|voter|ballot|quorum|agm|sgm|general body|managing committee|board of director/i,
    /ఓటు|ఎన్నిక|मतदान|चुनाव|வாக்கு|தேர்தல்|ಮತ|ಚುನಾವಣೆ|ভোট|নির্বাচন|મત|ચૂંટણી/i,
    /president|secretary|treasurer|chairman|returning officer|registrar|arcs|ddr|cooperative court/i,
    /కార్యదర్శి|అధ్యక్ష|सचिव|अध्यक्ष|செயலாளர்|தலைவர்|ಕಾರ್ಯದರ್ಶಿ|অধ্যক্ষ|സെക്രട്ടറി|ਪ੍ਰਧਾਨ/i,
    /audit|accounts|balance sheet|maintenance|sinking fund|transfer fee|charges|due|bill|kcc|passbook/i,
    /ఆడిట్|ఖాతా|लेखापरीक्षण|ऑडिट|हिशोब|தணிக்கை|ಲೆಕ್ಕಪರಿಶೋಧನೆ|হিসাব|ઓડિટ|ਆਡਿਟ/i,
    /grievance|complaint|dispute|arbitration|petition|ombudsman|harass|fraud|illegal/i,
    /ఫిర్యాదు|వివాదం|शिकायत|विवाद|புகார்|ದೂರು|অভিযোগ|ફરિયાଦ|പരാതി|ਸ਼ਿਕਾਇਤ|ଅଭିଯୋଗ/i,
  ];

  let hasCoopMatch = false;
  for (const pattern of COOP_PATTERNS) {
    if (pattern.test(q)) {
      hasCoopMatch = true;
      break;
    }
  }

  // Grievance queries
  if (
    q.includes('grievance') || q.includes('complaint') || q.includes('complain') ||
    q.includes('file a complaint') || q.includes('letter') || q.includes('petition') ||
    q.includes('ఫిర్యాదు') || q.includes('शिकायत') || q.includes('ದೂರು') || q.includes('புகார்') ||
    q.includes('corrupt') || q.includes('fraud') || q.includes('not paying') || q.includes('harass')
  ) {
    return {
      route: 'GRIEVANCE',
      confidence: 0.92,
      reasoning: 'The query requests grievance redressal, formal complaint preparation, or dispute resolution.',
    };
  }

  // Guided task requests
  if (
    q.includes('step-by-step') || q.includes('guide me') || q.includes('guided task') ||
    q.includes('workflow') || q.includes('procedure step') || q.includes('how to form') ||
    q.includes('registration steps') || q.includes('దశలవారీగా') || q.includes('चरण-दर-चरण')
  ) {
    return {
      route: 'GUIDED_TASK',
      confidence: 0.9,
      reasoning: 'The user is seeking an interactive step-by-step guided procedural workflow.',
    };
  }

  // Legal rights questions
  if (
    q.includes('right') || q.includes('inspect') || q.includes('audit report') ||
    q.includes('records') || q.includes('ombudsman') || q.includes('books of accounts') ||
    q.includes('హక్కు') || q.includes('अधिकार') || q.includes('हक्क') || q.includes('उரிமை') ||
    q.includes('disqualif') || q.includes('expel') || q.includes('suspension') || q.includes('section')
  ) {
    return {
      route: 'LEGAL_RIGHTS',
      confidence: 0.88,
      reasoning: 'The query pertains to statutory member rights, audit access, or legal protections under cooperative acts.',
    };
  }

  // Governance & Procedure questions (Elections, Voting, Meetings, Quorum)
  if (
    q.includes('vote') || q.includes('voting') || q.includes('election') || 
    q.includes('quorum') || q.includes('agm') || q.includes('general body') ||
    q.includes('managing committee') || q.includes('active member') || q.includes('bylaw') ||
    q.includes('ఓటు') || q.includes('ఎన్నిక') || q.includes('वोट') || q.includes('चुनाव') ||
    q.includes('मतदान') || q.includes('தேர்தல்') || q.includes('ಚುನಾವಣೆ')
  ) {
    return {
      route: 'GOVERNANCE_PROCEDURE',
      confidence: 0.9,
      reasoning: 'The query asks about internal governance rules, election rules, quorum, or voting eligibility in bylaws.',
    };
  }

  // If there are no cooperative keywords and query is multi-word general query:
  if (!hasCoopMatch) {
    const searchCheck = defaultRagEngine.search(query, { limit: 1 });
    if (searchCheck.length === 0 || searchCheck[0].score < 10) {
      return {
        route: 'OUT_OF_SCOPE',
        confidence: 0.95,
        reasoning: 'The query does not contain cooperative keywords and has no verified match in the cooperative knowledge base.',
      };
    }
  }

  return {
    route: 'GENERAL_COOPERATIVE_INFORMATION',
    confidence: 0.75,
    reasoning: 'General inquiry concerning cooperative principles, definitions, or society background.',
  };
}

// ----------------------------------------------------
// 2. TOOL IMPLEMENTATIONS
// ----------------------------------------------------
const toolsRegistry = {
  classifyQuery: async (args: { query: string }) => {
    return classifyQueryLocal(args.query);
  },

  retrieveKnowledge: async (args: { query: string; route?: QueryRoute; limit?: number }) => {
    const results = defaultRagEngine.search(args.query, {
      route: args.route,
      limit: args.limit || 3,
    });
    return {
      count: results.length,
      results: results.map(r => ({
        docTitle: r.chunk.docTitle,
        docType: r.chunk.docType,
        source: r.chunk.source,
        section: r.chunk.section,
        chapter: r.chunk.chapterOrPart,
        pageNumber: r.chunk.pageNumber,
        isDemoData: r.chunk.isDemoData,
        excerpt: r.snippet,
        score: r.score,
        fullContent: r.chunk.content,
      })),
      contextText: defaultRagEngine.formatGroundingContext(results),
    };
  },

  searchBylaws: async (args: { sectionKeyword: string }) => {
    const results = defaultRagEngine.search(args.sectionKeyword, { limit: 4 });
    return {
      matches: results.map(r => ({
        section: r.chunk.section,
        bylaw: r.chunk.content,
        source: r.chunk.source,
      })),
    };
  },

  getProcedure: async (args: { procedureType: 'election' | 'grievance' | 'registration' | 'voting_rights' | 'membership' }) => {
    const keyMap = {
      election: 'State Cooperative Societies Election Rules',
      grievance: 'Cooperative Grievance Redressal & Member Dispute Rules',
      registration: 'Cooperative Society Formation & Registration Manual',
      voting_rights: 'One Member One Vote Principle',
      membership: 'Admission & Eligibility of Members',
    };
    const results = defaultRagEngine.search(keyMap[args.procedureType] || args.procedureType, { limit: 2 });
    return {
      procedureType: args.procedureType,
      stepsSummary: results.map(r => r.chunk.content),
    };
  },

  generateGrievanceLetter: async (args: { formData: GrievanceFormData }) => {
    const query = `${args.formData.issueCategory} ${args.formData.issueDescription}`;
    const searchRes = defaultRagEngine.search(query, { route: 'GRIEVANCE', limit: 2 });
    const citedRules = searchRes.map(r => `${r.chunk.docTitle}, ${r.chunk.section}: ${r.chunk.content.substring(0, 140)}...`);

    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const letter: GrievanceLetter = {
      id: `letter-${Date.now()}`,
      generatedDate: dateStr,
      recipientTitle: 'The President / Secretary & Managing Committee (Copy to: District Deputy Registrar)',
      societyName: args.formData.societyName || 'Primary Cooperative Society',
      memberName: args.formData.memberName || 'Aggrieved Member',
      subject: `Formal Grievance Regarding ${args.formData.issueCategory} Issue under Statutory Cooperative Bylaws`,
      salutation: 'Respected Office Bearers,',
      bodyParagraphs: [
        `I am a bona fide member of ${args.formData.societyName || 'the Society'}. I am formally submitting this petition regarding an ongoing dispute concerning ${args.formData.issueCategory.toLowerCase()}.`,
        `Facts of the matter: During the period of ${args.formData.dateOrPeriod || 'the current cooperative year'}, the following grievance occurred: ${args.formData.issueDescription}. This action directly infringes upon my statutory membership entitlements and fair governance principles.`,
        args.formData.peopleOrRoleInvolved ? `Parties involved or responsible: ${args.formData.peopleOrRoleInvolved}.` : '',
        `Under the applicable cooperative bylaws, the society is obligated to maintain transparent operations and provide an official acknowledgement receipt within 24 hours of receiving this grievance.`,
      ].filter(Boolean),
      bylawReferences: citedRules.length > 0 ? citedRules : [
        'Model Primary Cooperative Society Bylaws - Section 11: Member Rights & Non-discrimination',
        'Cooperative Grievance Redressal Rules - Rule 3: Mandatory Internal Grievance Cell and 30-day Resolution Window',
        'Cooperative Grievance Redressal Rules - Rule 14: Prohibition of Retaliatory Suspension or Penalty',
      ],
      requestedActionList: [
        args.formData.desiredResolution || 'Immediate rectification of the grievance and restoration of lawful rights.',
        'Issue a stamped and dated acknowledgement receipt with a Grievance Tracking Number.',
        'Table this matter before the next immediate meeting of the Managing Committee and convey the written decision within 30 days.',
      ],
      closing: 'Thanking you in anticipation of a prompt and lawful resolution.',
      rawText: '',
    };
    return letter;
  },

  getUserProfile: async (args: { userId: string }) => {
    return userProfilesStore[args.userId] || null;
  },

  updateUserProfile: async (args: { userId: string; profile: UserProfile }) => {
    userProfilesStore[args.userId] = args.profile;
    return { success: true, profile: args.profile };
  },

  saveWorkflowState: async (args: { taskId: string; state: any }) => {
    workflowStatesStore[args.taskId] = args.state;
    return { success: true, savedAt: new Date().toISOString() };
  },

  getWorkflowState: async (args: { taskId: string }) => {
    return workflowStatesStore[args.taskId] || null;
  },
};

// ----------------------------------------------------
// 3. API ENDPOINTS
// ----------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    appName: 'Co-opSahayak',
    version: '1.0.0',
  });
});

app.post('/api/route-query', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      res.status(400).json({ error: 'Query string required' });
      return;
    }
    const classification = classifyQueryLocal(query);
    res.json(classification);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rag/search', async (req, res) => {
  try {
    const { query, route, limit } = req.body;
    const searchResults = defaultRagEngine.search(query, {
      route: route as QueryRoute,
      limit: limit || 3,
    });
    res.json({
      query,
      results: searchResults,
      sources: defaultRagEngine.toSourceReferences(searchResults),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tools/execute', async (req, res) => {
  try {
    const { toolName, args } = req.body;
    const toolFn = (toolsRegistry as any)[toolName];
    if (!toolFn) {
      res.status(404).json({ error: `Tool ${toolName} not found` });
      return;
    }
    const result = await toolFn(args || {});
    res.json({ success: true, toolName, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/grievance/generate-letter', async (req, res) => {
  try {
    const { formData } = req.body;
    if (!formData) {
      res.status(400).json({ error: 'formData is required' });
      return;
    }
    const letter = await toolsRegistry.generateGrievanceLetter({ formData });
    res.json({ success: true, letter });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/documents/parse-file', async (req, res) => {
  try {
    const { fileName, fileDataBase64, mimeType } = req.body;
    if (!fileDataBase64) {
      res.status(400).json({ error: 'fileDataBase64 is required' });
      return;
    }

    const buffer = Buffer.from(fileDataBase64, 'base64');
    let extractedText = '';

    const lowerName = (fileName || '').toLowerCase();
    const isDocx = lowerName.endsWith('.docx') || lowerName.endsWith('.doc') || mimeType?.includes('word') || mimeType?.includes('officedocument');
    const isPdf = lowerName.endsWith('.pdf') || mimeType?.includes('pdf');
    const isImage = mimeType?.startsWith('image/') || /\.(png|jpe?g|webp|bmp)$/i.test(lowerName);

    if (isDocx) {
      try {
        const mammothModule = await import('mammoth');
        const mammoth = (mammothModule as any).default || mammothModule;
        const result = await mammoth.extractRawText({ buffer });
        extractedText = (result.value || '').trim();
      } catch (docxErr: any) {
        console.warn('Mammoth docx parse failed:', docxErr.message);
      }
    } else if (isPdf) {
      try {
        const pdfParseModule = await import('pdf-parse');
        if ((pdfParseModule as any).PDFParse) {
          const parser = new (pdfParseModule as any).PDFParse({ data: buffer });
          const textResult = await parser.getText();
          extractedText = (textResult?.text || '').trim();
        } else if (typeof (pdfParseModule as any).default === 'function') {
          const data = await (pdfParseModule as any).default(buffer);
          extractedText = (data?.text || '').trim();
        } else if (typeof pdfParseModule === 'function') {
          const data = await (pdfParseModule as any)(buffer);
          extractedText = (data?.text || '').trim();
        }
      } catch (pdfErr: any) {
        console.warn('pdf-parse failed:', pdfErr.message);
      }

      // If pdf-parse failed or returned minimal text, try raw PDF stream text extraction
      if (!extractedText || extractedText.length < 30) {
        try {
          const rawStr = buffer.toString('latin1');
          const tjMatches = rawStr.match(/\(([^)\r\n]{2,})\)\s*Tj/g) || [];
          const tjBlockMatches = rawStr.match(/\[([^\]]{2,})\]\s*TJ/gi) || [];
          const allMatches = [...tjMatches, ...tjBlockMatches];
          if (allMatches.length > 3) {
            const reconstructed = allMatches
              .map(m => m.replace(/^[\[\(]/, '').replace(/[\)\]]\s*T[jJ]$/i, ''))
              .join(' ')
              .replace(/\\([()\\])/g, '$1')
              .trim();
            if (reconstructed.length > 40) {
              extractedText = reconstructed;
            }
          }
        } catch (_) {}
      }
    }

    // If PDF text was empty (e.g. scanned image PDF) or if it's an image, or mammoth/pdf-parse was incomplete, invoke Gemini
    if ((!extractedText || extractedText.length < 50) && getGeminiClient()) {
      try {
        const gemini = getGeminiClient()!;
        const effectiveMime = isPdf ? 'application/pdf' : isImage ? (mimeType || 'image/png') : 'application/pdf';
        const modelResponse = await gemini.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: effectiveMime,
                    data: fileDataBase64,
                  },
                },
                {
                  text: 'Please extract all text content from this cooperative document verbatim. Keep all clauses, sections, dates, agenda items, member names, bylaws, and financial figures intact without skipping anything.',
                },
              ],
            },
          ],
        });
        if (modelResponse.text) {
          extractedText = modelResponse.text.trim();
        }
      } catch (geminiOcrErr: any) {
        console.warn('Gemini OCR document extraction failed:', geminiOcrErr.message);
      }
    }

    // Plain text fallback if it wasn't docx or pdf
    if (!extractedText || extractedText.length === 0) {
      const rawUtf8 = buffer.toString('utf-8');
      // If it looks like text (not binary zip headers)
      if (!rawUtf8.startsWith('PK') && !rawUtf8.includes('word/document.xml')) {
        const nonPrintableCount = (rawUtf8.match(/[\x00-\x08\x0E-\x1F\x7F\uFFFD]/g) || []).length;
        if (nonPrintableCount < rawUtf8.length * 0.05) {
          extractedText = rawUtf8.trim();
        }
      }
    }

    if (!extractedText || extractedText.trim().length === 0) {
      const typeLabel = isImage ? 'Image / Photo' : isPdf ? 'Scanned PDF' : 'Document';
      extractedText = `[Uploaded Society ${typeLabel}: ${fileName || 'Society Document'}]\nThis uploaded file appears to be a scanned image or photo without selectable digital text. Members can ask questions about typical cooperative bylaws, or paste excerpt text in the 'Paste Notice Text' tab for clause-level analysis.`;
    }

    res.json({
      success: true,
      text: extractedText,
      fileName,
    });
  } catch (err: any) {
    console.error('Document parse error:', err);
    res.status(500).json({ error: err.message || 'Failed to parse document' });
  }
});

// ----------------------------------------------------
// 4. MULTI-STEP AGENT ORCHESTRATION CHAT ENDPOINT
// ----------------------------------------------------

const langNameMap: Record<LanguageCode, { name: string; script: string }> = {
  en: { name: 'English', script: 'Latin' },
  te: { name: 'Telugu', script: 'తెలుగు లిపి' },
  hi: { name: 'Hindi', script: 'देवनागरी लिपि' },
  kn: { name: 'Kannada', script: 'ಕನ್ನಡ ಲಿಪಿ' },
  ta: { name: 'Tamil', script: 'தமிழ் எழுத்துமுறை' },
  ml: { name: 'Malayalam', script: 'മലയാള ലിപി' },
  mr: { name: 'Marathi', script: 'देवनागरी (मराठी) लिपी' },
  bn: { name: 'Bengali', script: 'বাংলা লিপি' },
  gu: { name: 'Gujarati', script: 'ગુજરાતી લિપિ' },
  pa: { name: 'Punjabi', script: 'ਗੁਰਮੁਖੀ ਲਿਪੀ' },
  or: { name: 'Odia', script: 'ଓଡ଼ିଆ ଲିପି' },
  as: { name: 'Assamese', script: 'অসমীয়া লিপি' },
};

// Pure Node.js WAV container encoder for raw PCM audio (24,000 Hz, 16-bit mono)
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitDepth = 16): Buffer {
  const header = Buffer.alloc(44);
  const dataLength = pcmBuffer.length;
  const byteRate = sampleRate * numChannels * (bitDepth / 8);
  const blockAlign = numChannels * (bitDepth / 8);

  // RIFF identifier
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// In-memory cache for common speech audio (e.g. not-relevant messages)
const speechAudioCache: Map<string, { audioBase64: string; mimeType: string }> = new Map();

const TTS_LANG_MAP: Record<LanguageCode, string> = {
  en: 'en-IN',
  te: 'te',
  hi: 'hi',
  kn: 'kn',
  ta: 'ta',
  mr: 'mr',
  bn: 'bn',
  gu: 'gu',
  ml: 'ml',
  pa: 'pa',
  or: 'hi',
  as: 'bn',
};

// High-Fidelity Regional Speech Synthesizer in exact selected language
async function synthesizeSpeechAudio(
  text: string,
  language: LanguageCode
): Promise<{ audioBase64: string; mimeType: string } | null> {
  const cleanVoiceText = text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[Source \d+\]/g, '')
    .replace(/#+\s/g, '')
    .replace(/[•\-\_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanVoiceText) return null;

  const cacheKey = `${language}:${cleanVoiceText.substring(0, 100)}`;
  if (speechAudioCache.has(cacheKey)) {
    return speechAudioCache.get(cacheKey)!;
  }

  const langInfo = langNameMap[language] || langNameMap.en;
  const targetLangName = langInfo.name;

  // 1. High-clarity native regional language voice stream (ultra-fast ~200ms, zero quota limit)
  try {
    const ttsLangCode = TTS_LANG_MAP[language] || 'en';
    const rawSentences = cleanVoiceText.match(/[^.!?।\n]+[.!?।\n]*/g) || [cleanVoiceText];

    // Chunk into spoken segments of <= 180 chars for seamless streaming
    const chunksToSpeak: string[] = [];
    for (const raw of rawSentences) {
      const s = raw.trim();
      if (!s) continue;
      if (s.length <= 180) {
        chunksToSpeak.push(s);
      } else {
        const words = s.split(/\s+/);
        let curr = '';
        for (const w of words) {
          if ((curr + ' ' + w).length <= 180) {
            curr = curr ? curr + ' ' + w : w;
          } else {
            if (curr) chunksToSpeak.push(curr);
            curr = w;
          }
        }
        if (curr) chunksToSpeak.push(curr);
      }
    }

    // Synthesize all chunks to cover complete answer in selected language
    const activeChunks = chunksToSpeak.slice(0, 10);
    const fetchPromises = activeChunks.map(async (chunk) => {
      const cleanChunk = chunk.trim();
      if (!cleanChunk) return null;
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodeURIComponent(cleanChunk)}&tl=${ttsLangCode}`;
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          },
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
          const arrayBuf = await res.arrayBuffer();
          return Buffer.from(arrayBuf);
        }
      } catch {
        return null;
      }
      return null;
    });

    const fetchedBuffers = await Promise.all(fetchPromises);
    const validBuffers: Buffer[] = [];
    for (const b of fetchedBuffers) {
      if (b) {
        validBuffers.push(b);
      }
    }

    if (validBuffers.length > 0) {
      const combined = Buffer.concat(validBuffers);
      const result = {
        audioBase64: combined.toString('base64'),
        mimeType: 'audio/mpeg',
      };
      speechAudioCache.set(cacheKey, result);
      return result;
    }
  } catch (streamErr: any) {
    console.warn('Native regional speech stream error:', streamErr.message);
  }

  // 2. Secondary fallback: Gemini TTS if available
  const gemini = getGeminiClient();
  if (gemini) {
    try {
      const ttsResponse = await gemini.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanVoiceText.substring(0, 1000),
                speechMetadata: {
                  style: `Clear, warm, and natural cooperative helpdesk speaker speaking fluently in ${targetLangName}`,
                },
              } as any,
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const parts = ttsResponse.candidates?.[0]?.content?.parts || [];
      const audioPart = parts.find((p: any) => p.inlineData && p.inlineData.data);
      const rawAudio = audioPart?.inlineData?.data;
      if (rawAudio) {
        const pcmBuf = Buffer.from(rawAudio, 'base64');
        const wavBuf = pcmToWav(pcmBuf, 24000, 1, 16);
        const result = {
          audioBase64: wavBuf.toString('base64'),
          mimeType: 'audio/wav',
        };
        speechAudioCache.set(cacheKey, result);
        return result;
      }
    } catch (geminiTtsErr: any) {
      console.warn('Gemini TTS secondary fallback skipped:', geminiTtsErr.message);
    }
  }

  return null;
}

app.post('/api/chat', async (req, res) => {
  try {
    const { query, history, profile, language, isVoice, documentContext } = req.body;
    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    const requestedLang: LanguageCode = language || (isVoice ? profile?.voiceLanguage : profile?.responseLanguage) || 'en';
    const userName = profile?.name || 'Member';
    const societyName = profile?.societyName || 'Cooperative Society';

    // Step 1: Query Classification & Domain Relevance Validation
    let classification = classifyQueryLocal(query);
    const toolsUsed: string[] = ['classifyQuery'];

    // If an uploaded document is attached, queries about dates, numbers, agenda, or clauses are in-scope
    const hasDocContext = !!(documentContext && (documentContext.textSnippet || documentContext.rawText || documentContext.fullText || documentContext.chunks?.length));
    if (hasDocContext) {
      classification = {
        route: 'DOCUMENT_QA',
        confidence: 0.98,
        reasoning: `Query is targeted directly against uploaded document: ${documentContext.name || 'Member Document'}`,
      };
      toolsUsed.push('searchUploadedDocument');
    }

    const langInfo = langNameMap[requestedLang] || langNameMap.en;
    const targetLangName = langInfo.name;
    const targetScript = langInfo.script;

    // Helper to generate audio for voice mode with adequate timeout for complete spoken audio
    const generateVoiceAudioIfRequested = async (textToSpeak: string) => {
      if (!isVoice) return null;
      const timeoutPromise = new Promise<{ audioBase64: string; mimeType: string } | null>((resolve) =>
        setTimeout(() => resolve(null), 4500)
      );
      try {
        return await Promise.race([synthesizeSpeechAudio(textToSpeak, requestedLang), timeoutPromise]);
      } catch {
        return null;
      }
    };

    // If out of scope: ZERO HALLUCINATIONS! Explicitly state that it is not relevant in the selected language.
    if (classification.route === 'OUT_OF_SCOPE' && !hasDocContext) {
      const notRelevantMsg = NOT_RELEVANT_MESSAGES[requestedLang] || NOT_RELEVANT_MESSAGES.en;
      const followups = SUGGESTED_COOP_FOLLOWUPS[requestedLang] || SUGGESTED_COOP_FOLLOWUPS.en;
      const audioResult = await generateVoiceAudioIfRequested(notRelevantMsg);

      res.json({
        response: notRelevantMsg,
        audioBase64: audioResult?.audioBase64,
        audioMimeType: audioResult?.mimeType || 'audio/mpeg',
        route: 'OUT_OF_SCOPE',
        sources: [],
        toolsUsed,
        suggestedFollowups: followups,
        reasoning: 'The query is not relevant to cooperative societies or legal helpdesk matters. Declined to hallucinate answers for unrelated domains.',
      });
      return;
    }

    // Step 2: RAG Retrieval Tool
    toolsUsed.push('retrieveKnowledge');
    const searchResults = defaultRagEngine.search(query, {
      route: classification.route,
      limit: 3,
    });
    let sources = defaultRagEngine.toSourceReferences(searchResults);
    let groundingContext = defaultRagEngine.formatGroundingContext(searchResults);

    // If document context is provided, set uploaded document as EXCLUSIVE grounding source
    if (hasDocContext) {
      const docName = documentContext.name || 'Uploaded Society Document';
      const fullDocText = (documentContext.fullText || documentContext.rawText || documentContext.textSnippet || '').trim();
      
      const docSource = {
        docTitle: docName,
        docType: 'Uploaded Document',
        source: 'Member Upload',
        section: 'Uploaded Document Content',
        isDemoData: false,
        excerpt: fullDocText.substring(0, 300) + '...',
      };
      // When querying an uploaded document, it is the sole and primary source
      sources = [docSource];

      groundingContext = `[MANDATORY EXCLUSIVE KNOWLEDGE SOURCE: UPLOADED DOCUMENT]
Document Title: "${docName}"
Document Content:
"""
${fullDocText.substring(0, 80000)}
"""`;
    }

    // Step 3: Check if Gemini Client is available for generation
    const gemini = getGeminiClient();
    let finalAnswer = '';

    if (gemini) {
      const docInstruction = hasDocContext
        ? `
5. STRICT UPLOADED DOCUMENT GOVERNANCE (MANDATORY & NON-NEGOTIABLE):
   - The user has uploaded and is querying the document: "${documentContext.name || 'Uploaded Document'}".
   - You MUST answer SOLELY and STRICTLY from the contents of this uploaded document provided in the Grounded Cooperative Sources above.
   - ABSOLUTE COVERAGE REQUIREMENT:
     * Carefully examine whether the user's requested fact, rule, date, amount, person, agenda, or topic is stated in this uploaded document.
     * IF THE INFORMATION IS NOT PRESENT IN THIS UPLOADED DOCUMENT:
       You MUST explicitly state that this information is NOT present in the uploaded document "${documentContext.name || 'Uploaded Document'}".
       You MUST NOT hallucinate, guess, or pull information from external laws, general knowledge, or other documents.
       State this clearly and politely in ${targetLangName} (using native ${targetScript}).
       For example, say:
       "${targetLangName === 'Telugu' ? `మీరు అడిగిన సమాచారం మీరు అప్‌లోడ్ చేసిన '${documentContext.name || 'పత్రం'}' పత్రంలో అందుబాటులో లేదు.` : targetLangName === 'Hindi' ? `यह जानकारी आपके द्वारा अपलोड किए गए दस्तावेज़ '${documentContext.name || 'दस्तावेज़'}' में उपलब्ध नहीं है।` : `This information is not present in the uploaded document '${documentContext.name || 'Uploaded Document'}'.`}"
       You may also briefly state what details ARE covered in the document instead.
     * IF THE INFORMATION IS PRESENT IN THIS UPLOADED DOCUMENT:
       Provide a direct, complete, and accurate answer quoting or citing the specific clauses, figures, dates, rules, or details directly from the document.`
        : '';

      const systemPrompt = `You are "Co-opSahayak", an authoritative, respectful, and crystal-clear AI Cooperative & Legal Helpdesk for Indian cooperative societies (housing societies, PACS, dairy/farming cooperatives).

CRITICAL NON-NEGOTIABLE PRINCIPLES:
1. STRICT 100% LANGUAGE PURITY:
   - The user has explicitly selected the language: "${targetLangName}" (Native Script: ${targetScript}, Language Code: "${requestedLang}").
   - You MUST formulate your entire response EXCLUSIVELY in ${targetLangName} (using native ${targetScript}).
   - CRITICAL REQUIREMENT: Absolutely DO NOT use English unless the selected language is explicitly English!
   - Every single sentence, greeting, legal explanation, bylaw citation, and guidance step MUST be written 100% in ${targetLangName}.
   - Absolutely NO English sentences, NO English section headers, NO mixed language phrasing.

2. STRICT ZERO-HALLUCINATION & RELEVANCE POLICY:
   - You ONLY assist with Indian cooperative society matters (housing societies, PACS, agricultural/dairy cooperatives, bylaws, member rights, elections, meetings, managing committee rules, audit, maintenance dues, and grievances).
   - If the user's question is NOT RELEVANT to cooperative societies or legal assistance, politely state so strictly in ${targetLangName} (${targetScript}).
${docInstruction}

3. GROUNDED REASONING:
   - Ground your response strictly in the provided Grounded Cooperative Sources below. 
   - Translate and express the operative legal rules accurately and fluently in ${targetLangName}.
   - Never hallucinate sections, penalties, or rules.

4. USER PROFILE CONTEXT:
   - The user is "${userName}", role: "${profile?.role || 'Member'}", society: "${societyName}".

GROUNDED COOPERATIVE SOURCES:
${groundingContext}
`;

      const isVoiceMode = !!isVoice;
      const voiceInstruction = isVoiceMode
        ? `
5. VOICE ASSISTANT INSTRUCTION (SPOKEN AUDIO IN ${targetLangName.toUpperCase()}):
   - Voice assistant mode is ACTIVE.
   - You MUST formulate the complete response exclusively in ${targetLangName} (${targetScript}).
   - Provide a complete, thorough, authoritative, and helpful answer. Explain all relevant member rights, legal rules, eligibility conditions, timelines, and next steps thoroughly.
   - Formulate your answer in smooth, natural, spoken conversational phrasing in ${targetLangName}.
   - DO NOT use markdown bold asterisks (**), bullet points (-), number signs (###), or markdown tables so that the speech synthesizer reads the text naturally and with crystal clarity.`
        : '';

      const userPrompt = `User question: "${query}"
Query Category: ${classification.route}
TARGET LANGUAGE: ${targetLangName} (Must be written 100% in ${targetScript}).
REMINDER: The entire response MUST be in ${targetLangName}. Absolutely NO English unless the target language is English!`;

      const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest'];
      for (const modelName of modelsToTry) {
        try {
          const modelResponse = await gemini.models.generateContent({
            model: modelName,
            contents: userPrompt,
            config: {
              systemInstruction: systemPrompt + voiceInstruction,
              temperature: 0.2, // low temperature for high grounding accuracy
              maxOutputTokens: 1000,
            },
          });

          if (modelResponse.text && modelResponse.text.trim()) {
            finalAnswer = modelResponse.text.trim();
            break;
          }
        } catch (geminiError: any) {
          console.warn(`Model ${modelName} failed, trying next:`, geminiError.message);
        }
      }
    }

    // Helper for pure native localized summary when Gemini is offline
    function getLocalizedBylawSummary(chunk: any, lang: LanguageCode): string {
      if (lang === 'en') return chunk.content;
      const id = chunk.id;
      if (id === 'bylaw-sec-11') {
        switch (lang) {
          case 'te': return 'ప్రతి క్రియాశీల సభ్యునికి సహకార సంఘం వ్యవహారాలలో కచ్చితంగా ఒక ఓటు హక్కు ఉంటుంది. ప్రాక్సీ ద్వారా ఓటు వేయడం పూర్తిగా నిషిద్ధం. సంఘానికి చెల్లించాల్సిన బకాయిలలో తొంభై రోజులకు మించి డిఫాల్ట్ కాకుండా ఉండాలి, మరియు ఎన్నికల తేదీకి కనీసం ముప్పై రోజుల ముందు సభ్యత్వం కలిగి ఉండాలి.';
          case 'hi': return 'प्रत्येक सक्रिय सदस्य को समिति के कार्यों में ठीक एक वोट देने का अधिकार है। प्राथमिक समितियों में प्रॉक्सी द्वारा मतदान पूर्णतः निषिद्ध है। चुनाव तिथि से कम से कम तीस दिन पूर्व सदस्यता होनी चाहिए और बकाया नब्बे दिनों से अधिक डिफ़ॉल्ट नहीं होना चाहिए।';
          case 'ta': return 'ஒவ்வொரு செயல்படும் உறுப்பினருக்கும் சங்கத்தில் ஒரு வாக்கு உரிமை உண்டு. பதிலாள் மூலம் வாக்களிப்பது முற்றிலும் தடைசெய்யப்பட்டுள்ளது. தேர்தல் தேதிக்கு 30 நாட்களுக்கு முன் உறுப்பினராகியிருக்க வேண்டும் மற்றும் 90 நாட்களுக்கு மேல் கடன் நிலுவை இருக்கக்கூடாது.';
          case 'kn': return 'ಪ್ರತಿಯೊಬ್ಬ ಸಕ್ರಿಯ ಸದಸ್ಯನಿಗೆ ಸಂಘದಲ್ಲಿ ಒಂದು ಮತದಾನದ ಹಕ್ಕಿದೆ. ಪ್ರಾಕ್ಸಿ ಮತದಾನವನ್ನು ಕಟ್ಟುನಿಟ್ಟಾಗಿ ನಿಷೇಧಿಸಲಾಗಿದೆ. ಚುನಾವಣಾ ದಿನಾಂಕಕ್ಕೆ ಕನಿಷ್ಠ 30 ದಿನಗಳ ಮೊದಲು ಸದಸ್ಯತ್ವ ಪಡೆದಿರಬೇಕು.';
          case 'mr': return 'प्रत्येक सक्रिय सभासदाला संस्थेच्या कामकाजात एक मत देण्याचा अधिकार आहे. प्रॉक्सी मतदान पूर्णपणे प्रतिबंधित आहे. निवडणुकीच्या तारखेच्या किमान ३० दिवस आधी सभासदत्व असावे आणि कर्ज थकीत ९० दिवसांपेक्षा जास्त नसावे.';
          case 'bn': return 'প্রত্যেক সক্রিয় সদস্যের সমবায়ে একটি ভোট দেওয়ার অধিকার রয়েছে। প্রক্সি ভোট সম্পূর্ণ নিষিদ্ধ। নির্বাচনের ৩০ দিন আগে সদস্যপদ থাকতে হবে এবং ৯০ দিনের বেশি বকেয়া থাকা চলবে না।';
          case 'gu': return 'દરેક સક્રિય સભ્યને મંડળીમાં એક મત આપવાનો અધિકાર છે. પ્રોક્સી મતદાન સખત પ્રતિબંધિત છે. ચૂંટણી તારીખના ઓછામાં ઓછા ૩૦ દિવસ પહેલા સભ્યપદ હોવું જોઈએ.';
          case 'ml': return 'ഓരോ സജീവ അംഗത്തിനും കൃത്യമായി ഒരു വോട്ട് അവകാശമുണ്ട്. പ്രോക്സി വോട്ടിംഗ് കർശനമായി നിരോധിച്ചിരിക്കുന്നു. തിരഞ്ഞെടുപ്പ് തീയതിക്ക് 30 ദിവസം മുമ്പ് അംഗത്വം നേടിയിരിക്കണം.';
          case 'pa': return 'ਹਰੇਕ ਸਰਗਰਮ ਮੈਂਬਰ ਕੋਲ ਇੱਕ ਵੋਟ ਦਾ ਅਧਿਕਾਰ ਹੈ। ਪ੍ਰੌਕਸੀ ਵੋਟਿੰਗ ਪੂਰੀ ਤਰ੍ਹਾਂ ਮਨ੍ਹਾ ਹੈ। ਚੋਣ ਦੀ ਮਿਤੀ ਤੋਂ ਘੱਟੋ-ਘੱਟ 30 ਦਿਨ ਪਹਿਲਾਂ ਮੈਂਬਰਸ਼ਿਪ ਹੋਣੀ ਚਾਹੀਦੀ ਹੈ।';
          case 'or': return 'ପ୍ରତ୍ୟେକ ସକ୍ରିୟ ସଦସ୍ୟଙ୍କର ଗୋଟିଏ ଭୋଟ୍ ଦେବାର ଅଧିକାର ଅଛି। ପ୍ରକ୍ସି ଭୋଟିଂ ସମ୍ପୂର୍ଣ୍ଣ ନିଷେଧ। ନିର୍ବାଚନ ତାରିଖର ୩୦ ଦିନ ପୂର୍ବରୁ ସଦସ୍ୟତା ରହିବା ଆବଶ୍ୟକ।';
          case 'as': return 'প্ৰতিগৰাকী সক্ৰিয় সদস্যৰ এটা ভোট দিয়াৰ অধিকাৰ আছে। প্ৰক্সি ভোটদান সম্পূৰ্ণ নিষিদ্ধ। নিৰ্বাচনৰ ৩০ দিন আগতে সদস্যপদ লাভ কৰিব লাগিব।';
        }
      }
      if (id === 'mscs-sec-38' || id === 'mscs-sec-63') {
        switch (lang) {
          case 'te': return 'చట్టబద్ధమైన నిబంధనల ప్రకారం ప్రతి సభ్యునికి సంఘం లెక్కలు, ఆడిట్ నివేదికలు, సర్వసభ్య సమావేశ తీర్మానాలు మరియు సభ్యుల రిజిస్టరును ఉచితంగా పరిశీలించే పూర్తి హక్కు ఉంది. దరఖాస్తు చేసిన 15 రోజుల్లోగా సంఘం ధృవీకరించిన ప్రతులను అందించాలి.';
          case 'hi': return 'कानूनी प्रावधानों के अनुसार प्रत्येक सदस्य को समिति के खातों, ऑडिट रिपोर्ट, आम सभा की कार्यवाही और सदस्य रजिस्टर का निःशुल्क निरीक्षण करने का पूर्ण अधिकार है। पंद्रह दिनों के भीतर प्रमाणित प्रतियां उपलब्ध करानी होंगी।';
          case 'ta': return 'சட்ட விதிகளின்படி ஒவ்வொரு உறுப்பினருக்கும் சங்கத்தின் கணக்குகள், தணிக்கை அறிக்கைகள் மற்றும் உறுப்பினர் பதிவேட்டை இலவசமாக ஆய்வு செய்ய முழு உரிமை உண்டு. 15 நாட்களுக்குள் சான்றளிக்கப்பட்ட நகல்கள் வழங்கப்பட வேண்டும்.';
          case 'kn': return 'ಕಾನೂನುಬದ್ಧ ನಿಯಮಗಳ ಪ್ರಕಾರ ಪ್ರತಿಯೊಬ್ಬ ಸದಸ್ಯನಿಗೆ ಸಂಘದ ಲೆಕ್ಕಪತ್ರಗಳು, ಲೆಕ್ಕಪರಿಶೋಧನಾ ವರದಿಗಳು ಮತ್ತು ಸದಸ್ಯರ ನೋಂದಣಿಯನ್ನು ಉಚಿತವಾಗಿ ಪರಿಶೀಲಿಸುವ ಸಂಪೂರ್ಣ ಹಕ್ಕಿದೆ.';
          case 'mr': return 'कायदेशीर तरतुदींनुसार प्रत्येक सभासदाला संस्थेचे हिशोब, लेखापरीक्षण अहवाल आणि सभासद नोंदवही विनामूल्य तपासण्याचा पूर्ण अधिकार आहे. १५ दिवसांच्या आत प्रमाणित प्रती देणे बंधनकारक आहे.';
          case 'bn': return 'আইন অনুসারে প্রত্যেক সদস্যের সমিতির হিসাব, অডিট রিপোর্ট এবং সদস্য রেজিস্টার বিনামূল্যে পরিদর্শন করার পূর্ণ অধিকার রয়েছে। ১৫ দিনের মধ্যে অনুলিপি সরবরাহ করতে হবে।';
          case 'gu': return 'કાયદાકીય જોગવાઈ મુજબ દરેક સભ્યને મંડળીના હિસાબો, ઓડિટ અહેવાલો અને સભ્ય રજિસ્ટર નિઃશુલ્ક તપાસવાનો સંપૂર્ણ અધિકાર છે. ૧૫ દિવસમાં પ્રમાણિત નકલ આપવી પડશે.';
          case 'ml': return 'നിയമപരമായ വ്യവസ്ഥകൾ അനുസരിച്ച് സംഘത്തിന്റെ കണക്കുകൾ, ഓഡിറ്റ് റിപ്പോർട്ടുകൾ, അംഗങ്ങളുടെ രജിസ്റ്റർ എന്നിവ സൗജന്യമായി പരിശോധിക്കാൻ ഓരോ അംഗത്തിനും പൂർണ്ണ അവകാശമുണ്ട്.';
          case 'pa': return 'ਕਾਨੂੰਨੀ ਨਿਯਮਾਂ ਅਨੁਸਾਰ ਹਰੇਕ ਮੈਂਬਰ ਨੂੰ ਸਭਾ ਦੇ ਖਾਤੇ, ਆਡਿਟ ਰਿਪੋਰਟਾਂ ਅਤੇ ਮੈਂਬਰ ਰਜਿਸਟਰ ਮੁਫ਼ਤ ਵਿੱਚ ਦੇਖਣ ਦਾ ਪੂਰਾ ਅਧਿਕਾਰ ਹੈ।';
          case 'or': return 'ଆଇନ ଅନୁଯାୟୀ ପ୍ରତ୍ୟେକ ସଦସ୍ୟଙ୍କର ସମିତିର ହିସାବ, ଅଡିଟ୍ ରିପୋର୍ଟ ମାଗଣାରେ ଯାଞ୍ଚ କରିବାର ଅଧିକାର ଅଛି।';
          case 'as': return 'আইন অনুসৰি প্ৰতিজন সদস্যৰ সমিতিৰ হিচাপ আৰু অডিট ৰিপৰ্ট বিনামূলীয়াকৈ পৰিদৰ্শন কৰাৰ অধিকাৰ আছে।';
        }
      }
      if (id === 'grievance-sec-3' || id === 'grievance-sec-8' || id === 'grievance-sec-14') {
        switch (lang) {
          case 'te': return 'సహకార నిబంధనల ప్రకారం మీరు కార్యదర్శి లేదా అధ్యక్షుడికి లిఖితపూర్వకంగా ఫిర్యాదు చేయవచ్చు. సంఘం తక్షణమే ట్రాకింగ్ సంఖ్యతో రసీదు ఇవ్వాలి మరియు 30 రోజుల్లోగా పరిష్కరించాలి. పరిష్కారం కాకపోతే సహాయ రిజిస్ట్రార్ (ARCS) కు అప్పీల్ చేసుకోవచ్చు.';
          case 'hi': return 'सहकारी नियमों के अनुसार आप सचिव या अध्यक्ष को लिखित शिकायत दे सकते हैं। समिति को पावती रसीद देनी होगी और 30 दिनों में समाधान करना होगा। समाधान न होने पर सहायक निबंधक (ARCS) को अपील की जा सकती है।';
          case 'ta': return 'கூட்டுறவு விதிகளின்படி நீங்கள் செயலாளர் அல்லது தலைவரிடம் எழுத்துப்பூர்வமாக புகார் அளிக்கலாம். 30 நாட்களுக்குள் தீர்வு காணப்பட வேண்டும். இல்லையெனில் துணைப் பதிவாளரிடம் மேல்முறையீடு செய்யலாம்.';
          case 'kn': return 'ಸಹಕಾರಿ ನಿಯಮಗಳ ಪ್ರಕಾರ ನೀವು ಕಾರ್ಯದರ್ಶಿ ಅಥವಾ ಅಧ್ಯಕ್ಷರಿಗೆ ಲಿಖಿತ ದೂರು ನೀಡಬಹುದು. 30 ದಿನಗಳಲ್ಲಿ ಪರಿಹಾರ ನೀಡಬೇಕು. ಇಲ್ಲದಿದ್ದರೆ ಸಹಾಯಕ ರಿಜಿಸ್ಟ್ರಾರ್‌ಗೆ ಮೇಲ್ಮನವಿ ಸಲ್ಲಿಸಬಹುದು.';
          case 'mr': return 'सहकारी नियमांनुसार आपण सचिव किंवा अध्यक्षांकडे लेखी तक्रार करू शकता. संस्थेने ३० दिवसांत निवारण केले पाहिजे. अन्यथा सहाय्यक निबंधकांकडे अपील करता येते.';
          case 'bn': return 'সমবায় নিয়ম অনুসারে আপনি সচিব বা সভাপতির কাছে লিখিত অভিযোগ দায়ের করতে পারেন। ৩০ দিনের মধ্যে সমাধান করতে হবে। ব্যর্থ হলে সহকারী নিবন্ধকের কাছে আপিল করা যেতে পারে।';
          case 'gu': return 'સહકારી નિયમો મુજબ તમે મંત્રી અથવા પ્રમુખને લેખિત ફરિયાદ કરી શકો છો. મંડળીએ ૩૦ દિવસમાં નિરાકરણ કરવું પડશે. નહિતર મદદનીશ રજિસ્ટ્રાર સમક્ષ અપીલ કરી શકાય છે.';
          case 'ml': return 'സഹകരണ നിയമങ്ങൾ അനുസരിച്ച് സെക്രട്ടറി അല്ലെങ്കിൽ പ്രസിഡന്റിന് രേഖാമൂലം പരാതി നൽകാം. 30 ദിവസത്തിനകം പരിഹാരം കാണണം. ഇല്ലെങ്കിൽ അസിസ്റ്റന്റ് രജിസ്ട്രാർക്ക് അപ്പീൽ നൽകാം.';
          case 'pa': return 'ਸਹਿਕਾਰੀ ਨਿਯਮਾਂ ਅਨੁਸਾਰ ਤੁਸੀਂ ਸਕੱਤਰ ਜਾਂ ਪ੍ਰਧਾਨ ਨੂੰ ਲਿਖਤੀ ਸ਼ਿਕਾਇਤ ਦਰਜ ਕਰਵਾ ਸਕਦੇ ਹੋ। 30 ਦਿਨਾਂ ਵਿੱਚ ਨਿਪਟਾਰਾ ਹੋਣਾ ਲਾਜ਼ਮੀ ਹੈ।';
          case 'or': return 'ସମବାୟ ନିୟମ ଅନୁଯାୟୀ ଆପଣ ସମ୍ପାଦକ କିମ୍ବା ସଭାପତିଙ୍କୁ ଲିଖିତ ଅଭିଯୋଗ ଦେଇପାରିବେ। ୩୦ ଦିନ ମଧ୍ୟରେ ସମାଧାନ ହେବା ଉଚିତ।';
          case 'as': return 'সমবায় নিয়ম অনুসৰি আপুনি সম্পাদক বা সভাপতিৰ ওচৰত লিখিত অভিযোগ দাখিল কৰিব পাৰে। ৩০ দিনৰ ভিতৰত সমাধান হ’ব লাগিব।';
        }
      }
      switch (lang) {
        case 'te': return `సహకార చట్టబద్ధమైన నిబంధనల ప్రకారం: సభ్యులు తమ హక్కులను వినియోగించుకోవచ్చు మరియు అధికారిక పత్రాలను పొందవచ్చు.`;
        case 'hi': return `सहकारी वैधानिक नियमों के अनुसार: सदस्य अपने अधिकारों का उपयोग कर सकते हैं और आधिकारिक दस्तावेज प्राप्त कर सकते हैं।`;
        case 'ta': return `கூட்டுறவு விதிகளின்படி: உறுப்பினர்கள் தங்கள் உரிமைகளைப் பயன்படுத்தலாம் மற்றும் அதிகாரப்பூர்வ ஆவணங்களைப் பெறலாம்.`;
        case 'kn': return `ಸಹಕಾರಿ ನಿಯಮಗಳ ಪ್ರಕಾರ: ಸದಸ್ಯರು ತಮ್ಮ ಹಕ್ಕುಗಳನ್ನು ಚಲಾಯಿಸಬಹುದು ಮತ್ತು ಅಧಿಕೃತ ದಾಖಲೆಗಳನ್ನು ಪಡೆಯಬಹುದು.`;
        case 'mr': return `सहकारी नियमांनुसार: सभासद आपले हक्क वापरू शकतात आणि अधिकृत कागदपत्रे मिळवू शकतात.`;
        case 'bn': return `সমবায় নিয়ম অনুসারে: সদস্যরা তাদের অধিকার প্রয়োগ করতে পারেন এবং সরকারি নথি পেতে পারেন।`;
        case 'gu': return `સહકારી નિયમો મુજબ: સભ્યો પોતાના હકોનો ઉપયોગ કરી શકે છે અને સત્તાવાર દસ્તાવેજો મેળવી શકે છે.`;
        case 'ml': return `സഹകരണ നിയമങ്ങൾ പ്രകാരം: അംഗങ്ങൾക്ക് അവകാശങ്ങൾ വിനിയോഗിക്കാം കൂടാതെ ഔദ്യോഗിക രേഖകൾ നേടാം.`;
        case 'pa': return `ਸਹਿਕਾਰੀ ਨਿਯਮਾਂ ਅਨੁਸਾਰ: ਮੈਂਬਰ ਆਪਣੇ ਹੱਕਾਂ ਦੀ ਵਰਤੋਂ ਕਰ ਸਕਦੇ ਹਨ ਅਤੇ ਸਰਕਾਰੀ ਦਸਤਾਵੇਜ਼ ਪ੍ਰਾਪਤ ਕਰ ਸਕਦੇ ਹਨ।`;
        case 'or': return `ସମବାୟ ନିୟମ ଅନୁଯାୟୀ: ସଦସ୍ୟମାନେ ନିଜର ଅଧିକାର ପ୍ରୟୋଗ କରିପାରିବେ।`;
        case 'as': return `সমবায় নিয়ম অনুসৰি: সদস্যসকলে নিজৰ অধিকাৰ প্ৰয়োগ কৰিব পাৰে।`;
        default: return chunk.content;
      }
    }

    // Fallback deterministic synthesis if Gemini API key is unset or offline
    if (!finalAnswer) {
      if (hasDocContext) {
        const docName = documentContext.name || 'Uploaded Document';
        const fullDocText = (documentContext.fullText || documentContext.rawText || documentContext.textSnippet || '').trim();
        const STOP_WORDS = new Set([
          'what', 'where', 'when', 'which', 'who', 'whom', 'whose', 'why', 'how',
          'the', 'is', 'are', 'was', 'were', 'am', 'be', 'been', 'being',
          'have', 'has', 'had', 'do', 'does', 'did', 'done',
          'a', 'an', 'and', 'or', 'but', 'if', 'because', 'as', 'until', 'while',
          'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through',
          'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under',
          'again', 'further', 'then', 'once', 'here', 'there', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
          'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now',
          'please', 'tell', 'give', 'know', 'want', 'need', 'me', 'my', 'your', 'their', 'our',
        ]);
        const cleanedWords = query
          .toLowerCase()
          .replace(/[^\w\s\u0900-\u097F\u0C00-\u0C7F]/g, ' ')
          .split(/\s+/)
          .filter((w: string) => w.length > 2 && !STOP_WORDS.has(w));

        const lowerDoc = fullDocText.toLowerCase();
        const matches = cleanedWords.filter((t: string) => lowerDoc.includes(t));
        const hasContentMatch = cleanedWords.length > 0 && (
          (cleanedWords.length === 1 && matches.length === 1) ||
          (cleanedWords.length > 1 && matches.length >= 2) ||
          (matches.length / cleanedWords.length >= 0.5)
        );

        if (hasContentMatch) {
          const paragraphs = fullDocText.split(/\n\s*\n/).filter((p: string) => p.trim().length > 15);
          const scoredParas = paragraphs.map((p: string) => {
            const pLower = p.toLowerCase();
            const hits = cleanedWords.filter((t: string) => pLower.includes(t)).length;
            return { p, hits };
          }).sort((a: any, b: any) => b.hits - a.hits);

          const best = scoredParas[0]?.p || fullDocText.substring(0, 500);
          switch (requestedLang) {
            case 'te':
              finalAnswer = `మీరు అప్‌లోడ్ చేసిన "${docName}" పత్రం ప్రకారం:\n\n${best}`;
              break;
            case 'hi':
              finalAnswer = `आपके द्वारा अपलोड किए गए दस्तावेज़ "${docName}" के अनुसार:\n\n${best}`;
              break;
            case 'ta':
              finalAnswer = `நீங்கள் பதிவேற்றிய "${docName}" ஆவணத்தின்படி:\n\n${best}`;
              break;
            case 'kn':
              finalAnswer = `ನೀವು ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ "${docName}" ದಾಖಲೆಯ ಪ್ರಕಾರ:\n\n${best}`;
              break;
            case 'mr':
              finalAnswer = `आपण अपलोड केलेल्या "${docName}" दस्तऐवजानुसार:\n\n${best}`;
              break;
            default:
              finalAnswer = `According to your uploaded document "${docName}":\n\n${best}`;
              break;
          }
        } else {
          const notFoundFn = DOC_INFO_NOT_FOUND_MESSAGES[requestedLang] || DOC_INFO_NOT_FOUND_MESSAGES.en;
          finalAnswer = notFoundFn(docName);
        }
      } else if (searchResults.length === 0) {
        finalAnswer = NOT_RELEVANT_MESSAGES[requestedLang] || NOT_RELEVANT_MESSAGES.en;
      } else {
        const top = searchResults[0].chunk;
        const localizedContent = getLocalizedBylawSummary(top, requestedLang);

        switch (requestedLang) {
          case 'te':
            finalAnswer = `లభ్యమైన సహకార నిబంధనల ప్రకారం:\n\n${localizedContent}\n\nముఖ్య సూచన: చట్టబద్ధమైన ఉపనిబంధనల ప్రకారం మీరు మీ హక్కులను వినియోగించుకోవచ్చు. అవసరమైతే మా 'ఫిర్యాదు దాఖలు' విభాగం ద్వారా అధికారిక పత్రాన్ని తయారు చేసుకోవచ్చు.`;
            break;
          case 'hi':
            finalAnswer = `सत्यापित सहकारी उपनियमों के अनुसार:\n\n${localizedContent}\n\nआवश्यक कदम: आप इन नियमों के तहत अपने अधिकारों का उपयोग कर सकते हैं। आवश्यकता पड़ने पर आप 'शिकायत दर्ज करें' सुविधा से आधिकारिक पत्र तैयार कर सकते हैं।`;
            break;
          case 'mr':
            finalAnswer = `प्रमाणित सहकारी उपनियमांनुसार:\n\n${localizedContent}\n\nपुढील कृती: या नियमांनुसार आपण आपले हक्क वापरू शकता. आवश्यकता असल्यास 'तक्रार नोंदवा' विभागातून अधिकृत पत्र तयार करू शकता.`;
            break;
          case 'ta':
            finalAnswer = `சரிபார்க்கப்பட்ட கூட்டுறவு விதிகளின்படி:\n\n${localizedContent}\n\nஅடுத்த கட்ட நடவடிக்கை: இந்த விதிகளின்படி உங்கள் உரிமைகளைப் பயன்படுத்தலாம். தேவைப்பட்டால் 'புகார் பதிவு செய்ய' பகுதியிலிருந்து கடிதத்தை உருவாக்கலாம்.`;
            break;
          case 'kn':
            finalAnswer = `ಪರಿಶೀಲಿಸಿದ ಸಹಕಾರಿ ಉಪನಿಯಮಗಳ ಪ್ರಕಾರ:\n\n${localizedContent}\n\nಮುಂದಿನ ಹಂತ: ಈ ನಿಯಮಗಳ ಅಡಿಯಲ್ಲಿ ನೀವು ನಿಮ್ಮ ಹಕ್ಕುಗಳನ್ನು ಚಲಾಯಿಸಬಹುದು. ಅಗತ್ಯವಿದ್ದಲ್ಲಿ ಅಧಿಕೃತ ದೂರು ಪತ್ರವನ್ನು ರಚಿಸಬಹುದು.`;
            break;
          case 'bn':
            finalAnswer = `যাচাইকৃত সমবায় উপ-আইন অনুসারে:\n\n${localizedContent}\n\nপরবর্তী পদক্ষেপ: এই নিয়ম অনুসারে আপনি আপনার অধিকার প্রয়োগ করতে পারেন। প্রয়োজনে অভিযোগ পত্র প্রস্তুত করতে পারেন।`;
            break;
          case 'gu':
            finalAnswer = `પ્રમાણિત સહકારી ઉપનિયમો મુજબ:\n\n${localizedContent}\n\nઆગળનું પગલું: આ નિયમો અનુસાર તમે તમારા હકોનો ઉપયોગ કરી શકો છો. જરૂર પડ્યે ફરિયાદ પત્ર તૈયાર કરી શકો છો.`;
            break;
          case 'ml':
            finalAnswer = `സാക്ഷ്യപ്പെടുത്തിയ സഹകരണ ഉപനിയമങ്ങൾ പ്രകാരം:\n\n${localizedContent}\n\nഅടുത്ത നടപടി: ഈ നിയമങ്ങൾ അനുസരിച്ച് നിങ്ങൾക്ക് നിങ്ങളുടെ അവകാശങ്ങൾ വിനിയോഗിക്കാം. ആവശ്യമെങ്കിൽ പരാതി കത്ത് തയ്യാറാക്കാം.`;
            break;
          case 'pa':
            finalAnswer = `ਪ੍ਰਮਾਣਿਤ ਸਹਿਕਾਰੀ ਉਪ-ਨਿਯਮਾਂ ਅਨੁਸਾਰ:\n\n${localizedContent}\n\nਅਗਲਾ ਕਦਮ: ਇਹਨਾਂ ਨਿਯਮਾਂ ਤਹਿਤ ਤੁਸੀਂ ਆਪਣੇ ਅਧਿਕਾਰਾਂ ਦੀ ਵਰਤੋਂ ਕਰ ਸਕਦੇ ਹੋ। ਲੋੜ ਪੈਣ 'ਤੇ ਸ਼ਿਕਾਇਤ ਪੱਤਰ ਤਿਆਰ ਕਰ ਸਕਦੇ ਹੋ।`;
            break;
          case 'or':
            finalAnswer = `ପ୍ରମାଣିତ ସମବାୟ ଉପ-ନିୟମ ଅନୁଯାୟୀ:\n\n${localizedContent}\n\nପରବର୍ତ୍ତୀ ପଦକ୍ଷେପ: ଏହି ନିୟମ ଅନୁଯାୟୀ ଆପଣ ନିଜର ଅଧିକାର ପ୍ରୟୋଗ କରିପାରିବେ। ଆବଶ୍ୟକ ହେଲେ ଅଭିଯୋଗ ପତ୍ର ପ୍ରସ୍ତୁତ କରିପାରିବେ।`;
            break;
          case 'as':
            finalAnswer = `প্ৰমাণিত সমবায় উপ-নিয়ম অনুসৰি:\n\n${localizedContent}\n\nপৰৱৰ্তী পদক্ষেপ: এই নিয়ম অনুসৰি আপুনি আপোনাৰ অধিকাৰ প্ৰয়োগ কৰিব পাৰে। প্ৰয়োজন হ'লে অভিযোগ পত্ৰ প্ৰস্তুত কৰিব পাৰে।`;
            break;
          default:
            finalAnswer = `Based on the verified cooperative documents (${top.docTitle} - ${top.section}):\n\n${localizedContent}\n\nProcedural Guidance: Under these bylaws, members can inspect relevant records or submit formal representations to the Secretary or Returning Officer. You can also generate an official letter using our 'File a Grievance' workflow.`;
            break;
        }
      }
    }

    const followups = SUGGESTED_COOP_FOLLOWUPS[requestedLang] || SUGGESTED_COOP_FOLLOWUPS.en;
    const audioResult = await generateVoiceAudioIfRequested(finalAnswer);

    res.json({
      response: finalAnswer,
      audioBase64: audioResult?.audioBase64,
      audioMimeType: audioResult?.mimeType || 'audio/mpeg',
      route: classification.route,
      sources,
      toolsUsed,
      suggestedFollowups: followups,
      reasoning: classification.reasoning,
    });
  } catch (err: any) {
    console.error('Chat endpoint error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ----------------------------------------------------
// 5. TEXT-TO-SPEECH (TTS) ENDPOINT
// High-fidelity speech in Indian regional languages
// ----------------------------------------------------
app.post('/api/tts', async (req, res) => {
  try {
    const { text, language } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text string is required for TTS' });
      return;
    }

    const requestedLang: LanguageCode = (language as LanguageCode) || 'en';
    const audioResult = await synthesizeSpeechAudio(text, requestedLang);

    if (audioResult && audioResult.audioBase64) {
      res.json({
        success: true,
        audioBase64: audioResult.audioBase64,
        mimeType: audioResult.mimeType,
      });
      return;
    }

    res.json({
      success: false,
      fallbackToBrowser: true,
      message: 'TTS generation could not produce audio',
    });
  } catch (err: any) {
    console.warn('TTS endpoint error:', err.message);
    res.status(500).json({ success: false, fallbackToBrowser: true, error: err.message });
  }
});

// ----------------------------------------------------
// 5. VITE INTEGRATION & SERVER BOOT
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Co-opSahayak Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
