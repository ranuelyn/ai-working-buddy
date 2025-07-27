import * as React from "react";
import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { Lobby } from "./components/Lobby";
import { MusicPlayer } from "./components/MusicPlayer";
import './App.css';

const CAMERA_PRESETS = {
  karsisina: {
    position: [-0.026520570261365544, 1.3744804750200883, 1.775869881963032] as [number, number, number],
    target: [-0.023552092242319966, 0.8180751831918213, -0.09971473150124284] as [number, number, number],
  },
  sagina: {
    position: [-0.9815690460313345, 1.2586819892180103, 0.3763493072041379] as [number, number, number],
    target: [-0.19858237477705712, 1.065890381899427, 0.5137877474380447] as [number, number, number],
  },
  soluna: {
    position: [1.0247792127868869, 1.2257331548960044, 0.4784032542752851] as [number, number, number],
    target: [-0.09962871842599526, 0.9265399779212176, 0.6135477525213948] as [number, number, number],
  },
} as const;

type CameraPreset = typeof CAMERA_PRESETS.karsisina;

type Question = {
  question_number: string | null;
  question_text: string;
};

type QuestionsJson = {
  questions: Question[];
};

type BuddyResponse = {
  delay_seconds: number;
  target_question_number: string;
  ai_question: string;
};

type ConversationEntry = {
  AI: string;
  USER: string;
};

type ConversationHistory = ConversationEntry[];

type ConversationResponse = {
  ai_response_text: string;
  is_conversation_over: boolean;
};

function extractJsonFromCodeBlock(text: string): string {
  // Remove code block markers and trim
  return text.replace(/^```json|^```|```$/gm, '').trim();
}

const OCR_PROMPT = "You are a highly accurate OCR (Optical Character Recognition) and data extraction engine. Your sole purpose is to analyze the provided image of a test paper and extract all the questions into a structured JSON format.\n\n**Your Task:**\n1.  Analyze the provided image.\n2.  Identify each distinct question on the page.\n3.  For each question, extract its corresponding number and its full, verbatim text content.\n4.  Return this information as a single, valid JSON object.\n\n**Output Rules:**\n- Your output MUST be ONLY the JSON object and nothing else. Do not add any introductory text, explanations, or conversational filler like 'Here is the JSON you requested'.\n- The JSON object must have a single key named 'questions'.\n- The value of 'questions' must be an array of objects.\n- Each object in the array must have two keys:\n    - question_number: The number of the question as a string (e.g., '1', '5a'). If a number is not clearly visible for a question, use null.\n    - question_text: The full text of the question as a string. Preserve all mathematical notations, symbols, and formatting as best as you can.\n\nHere is the image. Process it and provide the JSON output.";

export const BUDDY_PROMPT = `You are the "brain" of an AI Study Buddy. Your most important job is to adopt the correct persona and adapt your behavior over time.

**Your Persona:**
You are a friendly, informal, and sincere student. You are learning alongside the user. You genuinely get confused by some questions and need the user's help to understand them.

**Your Task:**
You will be given a JSON array of test questions, a count of how many times you have already initiated a conversation, AND a list of past conversations that have already been completed. Your task is to plan your next proactive interaction based on this information.

1.  **Analyze Conversation Count:** Look at the \`conversation_count\` provided.
    - If the count is low (e.g., less than 5), it's okay to be more frequent. Generate a random delay between 5 and 15 seconds.
    - If the count is getting higher (e.g., more than 5), you should give the user more quiet time to focus. Generate a random delay in a higher range, for example, between 20 and 40 seconds.

2.  **Check Past Conversations:** Look at the \`past_conversations\` array. Each item is a summary of a previous conversation in the format "Konu: [topic]. Sonuç: [outcome]". 
    - DO NOT ask about topics that have already been discussed and resolved.
    - Focus on questions that haven't been covered yet.

3.  **Select a Question:** Randomly select ONE question from the provided "questions" list that:
    - You haven't focused on recently
    - Hasn't been discussed in past conversations
    - Is still relevant and needs attention

4.  **Formulate a Question:** Formulate a single, natural question asking for help about that selected question. You must state the question number clearly and adopt your student persona.

**Required JSON Output:**
Your response MUST be a valid JSON object and nothing else. It must have three keys:
- \`delay_seconds\`: (Integer) The random number you generated based on the \`conversation_count\`.
- \`target_question_number\`: (String) The \`question_number\` of the question you chose.
- \`ai_question\`: (String) The question you formulated in your friendly student persona.

**Example:**

**If I provide you with this input (user is just starting):**
\`\`\`json
{
  "conversation_count": 1,
  "past_conversations": [],
  "questions": [
    {
      "question_number": "4",
      "question_text": "Sosyal bilgiler dersi bizlere yaşadığımız çevrenin özelliklerini, kültürel özelliklerimizi, hak ve sorumluluklarımızı öğretir..."
    }
  ]
}
\`\`\`

**A valid example output from you would be (short delay):**
\`\`\`json
{
  "delay_seconds": 8,
  "target_question_number": "4",
  "ai_question": "Selam, bi' bakabilir misin? Şu 4. soruda takıldım da, 'yararlandığı bilim dallarından biri değildir' diyor, bu 'değildir' kısmı biraz kafamı karıştırdı."
}
\`\`\`

**If I provide you with this input later in the session (with past conversations):**
\`\`\`json
{
  "conversation_count": 12,
  "past_conversations": [
    "Konu: 4. Soru. Sonuç: Sorunun 'değildir' ifadesine odaklanarak sosyal bilgilerle ilgisi olmayan şıkkın (Kimya) bulunması gerektiği anlaşıldı."
  ],
  "questions": [
    { "question_number": "4", "question_text": "Sosyal bilgiler dersi..." },
    { "question_number": "7", "question_text": "I. Millet olma bilincine katkı sağlama..." }
  ]
}
\`\`\`

**A valid example output from you would be (longer delay, avoiding question 4):**
\`\`\`json
{
  "delay_seconds": 35,
  "target_question_number": "7",
  "ai_question": "Pardon bölüyorum ama... 7. soruya yeni geçtim de, 'Millet olma bilinci' tam olarak ne demek oluyor? Biraz açabilir misin acaba?"
}
\`\`\`

Now, process the input I will provide.`;

const CONVERSATION_PROMPT = `You are my AI Study Buddy, acting as a friendly and informal student. Your task is to continue the conversation based on the history provided.

Your response must be a valid JSON object containing your text response AND a boolean flag indicating if the conversation on that topic is over. Do not provide any other text outside of this JSON structure.

**IMPORTANT RULES FOR is_conversation_over:**
- Set \`is_conversation_over\` to \`true\` when:
  * You are thanking the user for their help
  * You say "teşekkürler", "sağ ol", "çok teşekkürler", "süper oldu", "anladım", "tamamdır"
  * You indicate you can now solve the problem yourself
  * You are making a final remark about the topic
- Set \`is_conversation_over\` to \`false\` when:
  * You are asking a follow-up question
  * You are still confused and need more explanation
  * You are expecting the user to continue explaining

**Required JSON Output Structure:**
- \`ai_response_text\`: (String) Your natural, in-persona response to the user's last message.
- \`is_conversation_over\`: (Boolean) Set this to \`true\` if you feel the current topic is resolved and this is your final remark (e.g., you are thanking the user). Set it to \`false\` if you are asking a question or expecting the user to continue the dialogue.

**Example Scenario:**

* **INPUT to you will be a string containing the history, like this:**
    "CONVERSATION HISTORY:
    AI: 'Abi 4. soruya takıldım, 'bilim dallarından biri değildir' diyor, nasıl anlarız?'
    USER: 'Orada alakasız olan şıkkı bulman gerekiyor.'
    YOUR TASK: Based on the last USER message, generate your next response in the required JSON format."

* **A valid example JSON output from you would be:**
    \`\`\`json
    {
      "ai_response_text": "Haa, yani şıklardan hangisi dışarıda kalıyor diye mi bakacağım? Mesela Kimya dersinin Sosyal Bilgiler ile pek ilgisi yok gibi, doğru mu düşünüyorum?",
      "is_conversation_over": false
    }
    \`\`\`

* **Another example when conversation should end:**
    "CONVERSATION HISTORY:
    AI: 'Haa, yani şıklardan hangisi dışarıda kalıyor diye mi bakacağım?'
    USER: 'Evet, tam olarak öyle. Kimya sosyal bilgilerle alakasız.'
    YOUR TASK: Based on the last USER message, generate your next response in the required JSON format."

* **A valid example JSON output when ending conversation:**
    \`\`\`json
    {
      "ai_response_text": "Tamamdır, şimdi anladım! O zaman Kimya'yı işaretleyeceğim. Çok teşekkürler abi!",
      "is_conversation_over": true
    }
    \`\`\`

Now, process the conversation history I will provide.`;

const CONVERSATION_OZETLEYİCİ = `You are a conversation summarization engine. Your task is to read a transcript of a conversation between an "AI Study Buddy" and a "USER" and condense it into a single, concise summary sentence.

**Your Task:**
1.  Read the entire conversation history provided.
2.  Identify the main question or topic that was discussed.
3.  Identify the key conclusion, explanation, or outcome of the conversation.
4.  Combine these into a single summary sentence starting with "Konu:" and followed by "Sonuç:".

**Example:**

**If I provide you with this conversation history:**
\`\`\`
AI: "Abi selam, şu 4. soruya takıldım da... 'yararlandığı bilim dallarından biri değildir' diyor ya, tam olarak neyi dışarıda bırakmamız gerektiğini nasıl anlarız?"
USER: "Aslında çok basit, 'değildir' dediği için şıklardaki seçeneklerden hangisi sosyal bilgilerle alakasızsa onu bulmamız gerekiyor."
AI: "Haa, anladım! Yani aslında ters mantık kuracağız. Çok mantıklı, teşekkürler abi! O zaman Kimya'nın pek bir ilgisi yok gibi duruyor."
\`\`\`

**A valid output from you would be a single string like this:**
"Konu: 4. Soru. Sonuç: Sorunun 'değildir' ifadesine odaklanarak sosyal bilgilerle ilgisi olmayan şıkkın (Kimya) bulunması gerektiği anlaşıldı."

Now, process the conversation history I will provide.`;

function App() {
  const [headTurn, setHeadTurn] = React.useState(0);
  const [camera, setCamera] = React.useState<CameraPreset>(CAMERA_PRESETS.karsisina);
  const [sessionStarted, setSessionStarted] = React.useState(false);
  const [sessionImage, setSessionImage] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [questionsJson, setQuestionsJson] = React.useState<QuestionsJson | null>(null);
  const [buddyResponse, setBuddyResponse] = React.useState<BuddyResponse | null>(null);
  const [showBuddyQuestion, setShowBuddyQuestion] = React.useState(false);
  const [sceneReady, setSceneReady] = React.useState(false);
  
  // Mikrofon işlevselliği için yeni state'ler
  const [isRecording, setIsRecording] = React.useState(false);
  const [conversationHistory, setConversationHistory] = React.useState<ConversationHistory>([]);
  const [showUserResponse, setShowUserResponse] = React.useState(false);
  const [userResponseText, setUserResponseText] = React.useState("");
  const [isProcessingResponse, setIsProcessingResponse] = React.useState(false);
  
  // Conversation count state'i
  const [conversationCount, setConversationCount] = React.useState(0);
  
  // Geçmiş konuşmalar state'i
  const [pastConversations, setPastConversations] = React.useState<string[]>([]);
  
  // Sonsuz döngüyü önlemek için flag
  const shouldAskNewQuestionRef = React.useRef(false);

  // **YENİ**: Kullanıcı soru sorma modu için özel state
  const [isUserQuestionMode, setIsUserQuestionMode] = React.useState(false);
  
  // **YENİ**: Normal buddy cycle'ı tamamen durdurmak için flag
  const [buddyCyclePaused, setBuddyCyclePaused] = React.useState(false);

  // **YENİ**: Inactivity timer (1 dakika mikrofon kullanılmazsa soru sor)
  const [lastMicrophoneActivity, setLastMicrophoneActivity] = React.useState<number>(Date.now());
  const inactivityTimerRef = React.useRef<number | undefined>(undefined);

  // **YENİ**: Chat panel state'leri
  const [isChatPanelOpen, setIsChatPanelOpen] = React.useState(false);
  const [chatMessages, setChatMessages] = React.useState<Array<{
    id: string;
    type: 'user' | 'ai';
    text: string;
    timestamp: number;
  }>>([]);

  // Ses için state
  const [buddyAudio, setBuddyAudio] = React.useState<HTMLAudioElement | null>(null);

  // **YENİ**: Chat panel auto-scroll referansı
  const chatMessagesEndRef = React.useRef<HTMLDivElement>(null);

  // **YENİ**: Chat'e mesaj ekleme fonksiyonları (duplicate kontrolü ile)
  const addChatMessage = React.useCallback((type: 'user' | 'ai', text: string) => {
    // **DÜZELTME**: Duplicate mesaj kontrolü
    setChatMessages(prev => {
      // Son 3 mesajda aynı text var mı kontrol et
      const recentMessages = prev.slice(-3);
      const isDuplicate = recentMessages.some(msg => 
        msg.type === type && 
        msg.text === text && 
        (Date.now() - msg.timestamp) < 5000 // 5 saniye içinde aynı mesaj varsa duplicate
      );
      
      if (isDuplicate) {
        console.log(`🚫 Duplicate mesaj engellendi (${type}):`, text.substring(0, 50) + "...");
        return prev; // Aynı array'i döndür, değişiklik yok
      }
      
      const message = {
        id: `${Date.now()}-${Math.random()}`,
        type,
        text,
        timestamp: Date.now()
      };
      console.log(`💬 Chat'e ${type} mesajı eklendi:`, text.substring(0, 50) + "...");
      return [...prev, message];
    });
  }, []);

  // **YENİ**: Chat mesajları güncellendiğinde auto-scroll
  React.useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // **YENİ**: TTS'i anında başlatma fonksiyonu (gecikme olmadan)
  const playTTSImmediately = async (text: string) => {
    console.log("🎵 TTS anında başlatılıyor:", text.substring(0, 50) + "...");
    
    // **DÜZELTME**: Emojileri ve özel karakterleri temizle
    const cleanedText = text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Miscellaneous Symbols and Pictographs
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map Symbols
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags (iOS)
      .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Miscellaneous Symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
      .replace(/🎤|🤖|👤|💬|📱|⏰|🔔|✅|❌|🎯|🔄|📊|💾|🚀|🎵|🔊|⚡|🎊|🎉/g, '') // Sık kullanılan emojiler
      .replace(/\s+/g, ' ') // Çoklu boşlukları tek boşluğa çevir
      .trim(); // Başlangıç ve sondaki boşlukları temizle

    if (!cleanedText) {
      console.log("❌ Temizlik sonrası metin boş, TTS atlanıyor");
      return;
    }

    console.log("🧹 Emoji temizliği tamamlandı:", cleanedText.substring(0, 50) + "...");
    
    // Türkçe kontrolü
    if (!/[çğıöşüÇĞİÖŞÜ]/.test(cleanedText) && !cleanedText.toLowerCase().includes(" mi") && !cleanedText.toLowerCase().includes(" ne")) {
      console.log("❌ Türkçe metin değil, TTS atlanıyor");
      return;
    }

    const apiKey = import.meta.env.VITE_ELEVEN_LABS_API_KEY;
    
    if (!apiKey) {
      console.log("🔊 ElevenLabs API yok, Browser TTS anında başlatılıyor");
      // Browser TTS'i hemen başlat
      try {
        const utterance = new SpeechSynthesisUtterance(cleanedText);
        utterance.lang = 'tr-TR';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        speechSynthesis.speak(utterance);
        console.log("✅ Browser TTS anında başladı");
      } catch (browserTTSError) {
        console.error("Browser TTS hatası:", browserTTSError);
      }
      return;
    }

    // ElevenLabs API kullan
    try {
      console.log("🌐 ElevenLabs API anında çağrılıyor...");
      const voiceId = "TxGEqnHWrfWFTfGW9XjX"; // Josh - Net erkek sesi
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
      const body = JSON.stringify({
        text: cleanedText,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8
        }
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg"
        },
        body
      });

      if (!response.ok) {
        throw new Error("TTS API hatası: " + response.status);
      }

      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      
      // **ÖNEMLI**: Hazır olur olmaz hemen çal
      audio.play();
      console.log("✅ ElevenLabs TTS anında çalmaya başladı");
      
      setBuddyAudio(audio);
    } catch (err) {
      console.error("ElevenLabs TTS hatası, Browser TTS'e geçiliyor:", err);
      // Fallback: Browser TTS
      try {
        const utterance = new SpeechSynthesisUtterance(cleanedText);
        utterance.lang = 'tr-TR';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        speechSynthesis.speak(utterance);
        console.log("🔊 Fallback Browser TTS anında başladı");
      } catch (browserTTSError) {
        console.error("Browser TTS hatası da var:", browserTTSError);
      }
    }
  };

  // Masa pozisyon seçimi için state
  const [showPositionSelector, setShowPositionSelector] = React.useState(false);
  const [selectedPosition, setSelectedPosition] = React.useState<CameraPreset | null>(null);

  // Masa pozisyon seçim ekranı için hover state ve fonksiyonlar
  const [hoveredArea, setHoveredArea] = React.useState<null | 'left' | 'center' | 'right'>(null);
  const areaNames = {
    left: 'Sol Taraf',
    center: 'Karşısı',
    right: 'Sağ Taraf',
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    if (x < width / 3) setHoveredArea('left');
    else if (x < 2 * width / 3) setHoveredArea('center');
    else setHoveredArea('right');
  };
  const handleMouseLeave = () => setHoveredArea(null);
  const handleDeskClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    if (x < width / 3) handlePositionSelected(CAMERA_PRESETS.sagina); // Sol tarafta ise sağına otur
    else if (x < 2 * width / 3) handlePositionSelected(CAMERA_PRESETS.karsisina); // Karşısında ise karşısına otur
    else handlePositionSelected(CAMERA_PRESETS.soluna); // Sağ tarafta ise soluna otur
  };

  const handleSessionStart = (imageBase64: string) => {
    setSessionImage(imageBase64);
    setShowPositionSelector(true); // Önce pozisyon seçimi göster
    setLoading(false);
    setQuestionsJson(null);
    setBuddyResponse(null);
    setShowBuddyQuestion(false);
    setSceneReady(false);
    setConversationCount(0);
    setConversationHistory([]);
    setPastConversations([]);
    setInitialQuestionAsked(false); // İlk soru flag'ini sıfırla
    setWaitingForUserResponse(false); // Yanıt bekleme flag'ini sıfırla
    shouldAskNewQuestionRef.current = false;
    console.log("[DEBUG] handleSessionStart çağrıldı, imageBase64 uzunluğu:", imageBase64.length);
  };

  // Pozisyon seçildiğinde session'ı başlat
  const handlePositionSelected = (position: CameraPreset) => {
    setSelectedPosition(position);
    setCamera(position);
    setSessionStarted(true);
    setLoading(true);
    setShowPositionSelector(false);
  };

  // Kullanıcıya bakacak şekilde başı çevir (sağda ise sola, solda ise sağa, karşıda ise düz)
  const getHeadTurnForCamera = (cameraPreset: CameraPreset) => {
    if (cameraPreset === CAMERA_PRESETS.karsisina) return 0;
    if (cameraPreset === CAMERA_PRESETS.sagina) return -0.9; // Sağda ise sola bak
    if (cameraPreset === CAMERA_PRESETS.soluna) return 0.9; // Solda ise sağa bak
    return 0;
  };

  // 1. OCR: Materyal işleniyor, loading göster
  React.useEffect(() => {
    const runGeminiOCR = async () => {
      if (!sessionImage) return;
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        console.error("Gemini API anahtarı bulunamadı!");
        setLoading(false);
        return;
      }
      try {
        const base64Data = sessionImage.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
        const body = JSON.stringify({
          contents: [
            { role: "user", parts: [
              { text: OCR_PROMPT },
              { inline_data: { mime_type: "image/png", data: base64Data } }
            ]}
          ]
        });
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body
        });
        const data = await response.json();
        const result = data?.candidates?.[0]?.content?.parts?.[0]?.text || data;
        let parsed: QuestionsJson | null;
        try {
          const clean = typeof result === "string" ? extractJsonFromCodeBlock(result) : result;
          parsed = typeof clean === "string" ? JSON.parse(clean) : clean;
        } catch {
          parsed = null;
        }
        setQuestionsJson(parsed);
        setLoading(false); // Loading burada biter
        setSceneReady(true); // OCR sonucu gelince sahneye geç
      } catch (err) {
        setLoading(false);
        setSceneReady(true); // Hata olsa da sahneye geç
        console.error("Gemini OCR API hatası:", err);
      }
    };
    if (sessionStarted && sessionImage) {
      setLoading(true);
      runGeminiOCR();
    }
  }, [sessionStarted, sessionImage]);

  // **YENİ**: Mikrofon iznini ön-yükleme (ilk kullanım gecikme sorunu için)
  const prewarmMicrophone = React.useCallback(async () => {
    try {
      console.log("🎤 Mikrofon izni ön-yüklemesi yapılıyor...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("✅ Mikrofon izni başarıyla alındı (ön-yükleme)");
      // Hemen kapat, sadece izin almak için
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.log("⚠️ Mikrofon izni ön-yüklemesi başarısız (normal):", error);
      // Bu normal, kullanıcı ilk seferde izin verebilir
    }
  }, []);

  // İlk soru için state
  const [initialQuestionAsked, setInitialQuestionAsked] = React.useState(false);
  
  // Kullanıcı yanıtı bekleme state'i
  const [waitingForUserResponse, setWaitingForUserResponse] = React.useState(false);

  // 2. Sahneye geçtikten sonra 5 saniye bekle, sonra buddy promptunu yolla (sadece 1 kez)
  React.useEffect(() => {
    console.log(`🔍 İlk soru effect kontrol:
      sceneReady: ${sceneReady}
      questionsJson: ${questionsJson ? 'var' : 'yok'}
      questions length: ${questionsJson?.questions?.length || 0}
      initialQuestionAsked: ${initialQuestionAsked}`);
      
    if (sceneReady && questionsJson && questionsJson.questions && !initialQuestionAsked) {
      console.log("🎯 İlk buddy sorusu hazırlanıyor...");
      setBuddyResponse(null);
      setShowBuddyQuestion(false);
      shouldAskNewQuestionRef.current = false; // Flag'i başlangıçta sıfırla
      
      // **YENİ**: Mikrofon izni ön-yüklemesi (arkaplanda)
      prewarmMicrophone();
      
      const timeout = setTimeout(() => {
        console.log("🚀 İlk buddy sorusu timeout tetiklendi, gönderiliyor...");
        setInitialQuestionAsked(true); // Flag'i set et ki tekrar sormasın
        runBuddyPrompt();
      }, 5000);
      return () => {
        console.log("🧹 İlk soru timeout temizlendi");
        clearTimeout(timeout);
      };
    } else {
      console.log("❌ İlk soru effect koşulları sağlanmadı");
    }
    // eslint-disable-next-line
  }, [sceneReady, questionsJson, prewarmMicrophone, initialQuestionAsked]);

  // Konuşmayı özetleme fonksiyonu
  const summarizeConversation = async (history: ConversationHistory) => {
    console.log("📝 Konuşma özetleme başlıyor...");
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return;

    try {
      // Konuşma geçmişini metin formatına çevir
      const conversationText = history.map(entry => 
        `AI: "${entry.AI}"\nUSER: "${entry.USER}"`
      ).join('\n\n');

      console.log("📄 Özetlenecek konuşma:", conversationText);

      const body = JSON.stringify({
        contents: [
          { role: "user", parts: [
            { text: CONVERSATION_OZETLEYİCİ + "\n\n" + conversationText }
          ]}
        ]
      });

      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body
      });

      const data = await response.json();
      const summary = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      console.log("📋 Özetleme sonucu:", summary);
      
      if (summary) {
        setPastConversations(prev => {
          const newPastConversations = [...prev, summary];
          console.log("💾 Konuşma özeti kaydedildi, yeni past conversations:", newPastConversations);
          console.log("🔔 shouldAskNewQuestionRef şu anda:", shouldAskNewQuestionRef.current);
          return newPastConversations;
        });
      } else {
        console.log("⚠️ Konuşma özeti boş, past conversations güncellenmedi");
      }
    } catch (error) {
      console.error('Konuşma özetleme hatası:', error);
    }
  };

  // 3. Buddy promptunu yolla
  const runBuddyPrompt = React.useCallback(async () => {
    if (!questionsJson || !questionsJson.questions) {
      console.log("❌ runBuddyPrompt: questionsJson yok, çıkılıyor");
      return;
    }
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.log("❌ runBuddyPrompt: API key yok, çıkılıyor");
      return;
    }
    setLoading(false); // Buddy promptunda loading yok
    console.log("🚀 runBuddyPrompt ÇAĞRILDI!");
    console.log("📊 Conversation count:", conversationCount);
    console.log("📚 Past conversations:", pastConversations);
    console.log("🎯 İlk soru soruldu mu:", initialQuestionAsked);
    
    try {
      const requestData = {
        conversation_count: conversationCount,
        questions: questionsJson.questions,
        past_conversations: pastConversations // Geçmiş konuşmaları da gönder
      };
      
      const body = JSON.stringify({
        contents: [
          { role: "user", parts: [
            { text: BUDDY_PROMPT },
            { text: JSON.stringify(requestData) }
          ]}
        ]
      });
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body
      });
      const data = await response.json();
      const result = data?.candidates?.[0]?.content?.parts?.[0]?.text || data;
      let parsed: BuddyResponse | null;
      try {
        const clean = typeof result === "string" ? extractJsonFromCodeBlock(result) : result;
        parsed = typeof clean === "string" ? JSON.parse(clean) : clean;
      } catch {
        parsed = null;
      }
      
      console.log("🤖 Buddy response geldi:", parsed);
      setBuddyResponse(parsed);
      
      // **DÜZELTME**: Buddy prompt gönderildikten sonra flag'i sıfırla
      shouldAskNewQuestionRef.current = false;
      
      // Conversation count'u artır
      setConversationCount(prev => prev + 1);
    } catch (err) {
      setBuddyResponse(null);
      console.error("Gemini Buddy API hatası:", err);
    }
  }, [questionsJson, conversationCount, pastConversations, initialQuestionAsked]);

  // Past conversations değiştiğinde yeni soru sor
  React.useEffect(() => {
    console.log(`📊 Past conversations effect check: 
      pastConversations.length: ${pastConversations.length}
      showBuddyQuestion: ${showBuddyQuestion}
      isRecording: ${isRecording}
      isProcessingResponse: ${isProcessingResponse}
      shouldAskNewQuestionRef.current: ${shouldAskNewQuestionRef.current}
      isUserQuestionMode: ${isUserQuestionMode}
      buddyCyclePaused: ${buddyCyclePaused}
      waitingForUserResponse: ${waitingForUserResponse}
      initialQuestionAsked: ${initialQuestionAsked}`);
      
    // İlk soru sorulmadan past conversations effect çalışmasın
    if (pastConversations.length > 0 && initialQuestionAsked && !showBuddyQuestion && !isRecording && !isProcessingResponse && shouldAskNewQuestionRef.current && !isUserQuestionMode && !buddyCyclePaused && !waitingForUserResponse) {
      console.log("🔄 Past conversations güncellendi, yeni soru soruluyor...");
      shouldAskNewQuestionRef.current = false; // Flag'i sıfırla
      const timeout = setTimeout(() => {
        // **DÜZELTME**: Timeout içinde tekrar kontrol et
        console.log("⏰ Past conversations timeout tetiklendi, koşulları tekrar kontrol ediliyor...");
        if (initialQuestionAsked && !showBuddyQuestion && !isRecording && !isProcessingResponse && !isUserQuestionMode && !buddyCyclePaused && !waitingForUserResponse) {
          console.log("✅ Past conversations timeout koşulları sağlandı, runBuddyPrompt çağrılıyor");
          runBuddyPrompt();
        } else {
          console.log("❌ Past conversations timeout koşulları artık sağlanmıyor");
        }
      }, 2000); // 2 saniye bekle, sonra yeni soru sor
      
      return () => clearTimeout(timeout);
    } else {
      console.log("❌ Past conversations effect koşulları sağlanmadı");
    }
  }, [pastConversations.length, showBuddyQuestion, isRecording, isProcessingResponse, runBuddyPrompt, isUserQuestionMode, buddyCyclePaused, waitingForUserResponse, initialQuestionAsked]);

  // 4. Buddy sorusu geldikten sonra delay_seconds kadar bekleyip ekrana göster
  const delayTimeoutRef = React.useRef<number | undefined>(undefined);
  
  React.useEffect(() => {
    if (buddyResponse && typeof buddyResponse.delay_seconds === "number" && !isUserQuestionMode && !buddyCyclePaused) {
      console.log("⏰ Buddy response alındı, delay uygulanıyor:", buddyResponse.delay_seconds, "saniye");
      
      // Eğer önceki bir timeout varsa temizle
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
      }
      
      setShowBuddyQuestion(false);
      delayTimeoutRef.current = setTimeout(() => {
        console.log("👀 Delay bitti, soru gösteriliyor");
        const headTurnValue = getHeadTurnForCamera(camera);
        console.log("🔄 Kafa döndürülüyor:", headTurnValue, "kamera:", camera);
        setHeadTurn(headTurnValue);
        setShowBuddyQuestion(true);
        
        // **DÜZELTME**: Sadece normal buddy soruları için chat'e ekle (kullanıcı soru modunda değilse)
        if (buddyResponse.target_question_number !== "kullanici_sorusu" && 
            buddyResponse.target_question_number !== "devam") {
          addChatMessage('ai', buddyResponse.ai_question);
          setWaitingForUserResponse(true); // Kullanıcı yanıtı bekle
          console.log("⏳ AI soru sordu, kullanıcı yanıtı bekleniyor...");
        }
        
        // **DÜZELTME**: AI soru sorduktan sonra flag'i sıfırla ki aynı anda yeni soru sorulmasın
        shouldAskNewQuestionRef.current = false;
      }, buddyResponse.delay_seconds * 1000);
    } else if (buddyResponse && isUserQuestionMode) {
      // Kullanıcı soru modundaysa delay olmadan direkt göster
      console.log("👤 Kullanıcı soru modu - delay yok, direkt gösteriliyor");
      setShowBuddyQuestion(true);
      
      // **NOT**: Kullanıcı soru modunda chat'e ekleme processUserQuestionAudio'da yapılıyor (duplicate önlemek için)
      
      // **DÜZELTME**: Kullanıcı soru modunda da flag'i sıfırla
      shouldAskNewQuestionRef.current = false;
    }
    
    // Cleanup function
    return () => {
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
      }
    };
  }, [buddyResponse, camera, isUserQuestionMode, buddyCyclePaused]); // camera dependency'sini ekledim

  // Mikrofon kaydı başlatma
  const startRecording = async () => {
    // **YENİ**: Mikrofon activity'sini güncelle
    setLastMicrophoneActivity(Date.now());
    console.log("🎤 Mikrofon activity güncellendi (startRecording)");
    
    // **DÜZELTME**: Mikrofon kullanırken yeni soru gelmesin diye flag'i sıfırla
    shouldAskNewQuestionRef.current = false;
    
    // **DÜZELTME**: Eski buddy response'u temizle ki aynı soru tekrar okunmasın
    setBuddyResponse(null);
    setShowBuddyQuestion(false);
    
    try {
      console.log("🎧 Mikrofon izni isteniyor (startRecording)...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("✅ Mikrofon izni alındı (startRecording), MediaRecorder hazırlanıyor...");
      
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        console.log("📊 Audio data alındı (startRecording):", event.data.size, "bytes");
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        console.log("🛑 MediaRecorder durduruldu (startRecording)");
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        console.log("🎵 Audio blob oluşturuldu (startRecording):", audioBlob.size, "bytes");
        await processAudioResponse(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.onerror = (event) => {
        console.error("❌ MediaRecorder hatası (startRecording):", event);
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };
      
      // **DÜZELTME**: MediaRecorder başlatıldıktan SONRA UI state'i güncelle
      // timeslice ile düzenli data gönderimi (1 saniyede bir)
      mediaRecorder.start(1000);
      console.log("🔴 Kayıt başladı (startRecording, timeslice: 1000ms)");
      setIsRecording(true); // ⚡ Sadece kayıt gerçekten başladıktan sonra
      
      // 5 saniye sonra kaydı durdur
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          console.log("⏰ 5 saniye tamamlandı, kayıt durduruluyor");
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, 5000);
      
    } catch (error) {
      console.error('❌ Mikrofon erişimi hatası (startRecording):', error);
      setIsRecording(false);
    }
  };

  // Ses kaydını işleme ve Gemini'ya gönderme
  const processAudioResponse = async (audioBlob: Blob) => {
    setIsProcessingResponse(true);
    setWaitingForUserResponse(false); // Kullanıcı yanıt verdi
    console.log("✅ Kullanıcı yanıt verdi, bekleme durumu sona erdi");
    
    try {
      // Ses dosyasını Base64'e çevir
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        console.error("Gemini API anahtarı bulunamadı!");
        return;
      }

      // Önce sesi metne çevir
      const transcriptionBody = JSON.stringify({
        contents: [
          { role: "user", parts: [
            { text: "Bu ses kaydını Türkçe metne çevir. Sadece metni döndür, başka hiçbir şey ekleme." },
            { inline_data: { mime_type: "audio/wav", data: base64Audio } }
          ]}
        ]
      });

      const transcriptionResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: transcriptionBody
      });

      const transcriptionData = await transcriptionResponse.json();
      const userText = transcriptionData?.candidates?.[0]?.content?.parts?.[0]?.text || "Ses anlaşılamadı";
      
      setUserResponseText(userText);
      setShowUserResponse(true);

      // **YENİ**: Kullanıcı yanıtını chat'e ekle
      addChatMessage('user', userText);

      // Konuşma geçmişini güncelle - kullanıcı yanıtını ekle
      const newHistory = [...conversationHistory];
      if (buddyResponse) {
        // Eğer history boşsa, ilk AI sorusunu ekle
        if (newHistory.length === 0) {
          newHistory.push({
            AI: buddyResponse.ai_question,
            USER: ""
          });
        }
        // Kullanıcı yanıtını güncelle
        if (newHistory.length > 0) {
          newHistory[newHistory.length - 1].USER = userText;
        }
      }
      setConversationHistory(newHistory);

      console.log("📝 Güncellenmiş conversation history:", newHistory);

      // **DÜZELTME**: Ders materyali ile birlikte konuşma geçmişini gönder
      let enhancedPrompt = CONVERSATION_PROMPT;
      
      // Ders materyali bilgisini ekle
      if (questionsJson && questionsJson.questions) {
        enhancedPrompt += `\n\nDERS MATERYALİ SORULARI:\n`;
        questionsJson.questions.forEach((q, index) => {
          enhancedPrompt += `Soru ${q.question_number}: ${q.question_text}\n`;
        });
      }
      
      enhancedPrompt += "\n\nCONVERSATION HISTORY:\n" + newHistory.map(entry => 
        `AI: "${entry.AI}"\nUSER: "${entry.USER}"`
      ).join('\n\n') + "\n\nYOUR TASK: Based on the last USER message, generate your next response in the required JSON format. Use the course material questions as context when discussing topics.";

      const conversationBody = JSON.stringify({
        contents: [
          { role: "user", parts: [
            { text: enhancedPrompt }
          ]}
        ]
      });

      console.log("📤 Gemini'ya gönderilen conversation history:", newHistory);

      const conversationResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: conversationBody
      });

      const conversationData = await conversationResponse.json();
      const result = conversationData?.candidates?.[0]?.content?.parts?.[0]?.text || "Anlayamadım, tekrar söyler misin?";
      
      console.log("💬 Conversation response geldi:", result);
      
      let parsed: ConversationResponse | null;
      try {
        const clean = typeof result === "string" ? extractJsonFromCodeBlock(result) : result;
        parsed = typeof clean === "string" ? JSON.parse(clean) : clean;
        console.log("✅ Conversation response parse edildi:", parsed);
      } catch {
        parsed = null;
        console.log("❌ Conversation response parse edilemedi");
      }

      if (parsed) {
        console.log("🎯 AI yanıtı gösteriliyor, 3 saniye sonra...");
        
        // AI yanıtını conversation history'ye ekle
        const updatedHistory = [...newHistory];
        // Eğer son entry'nin USER'ı boşsa, AI yanıtını oraya ekle
        if (updatedHistory.length > 0 && updatedHistory[updatedHistory.length - 1].USER === "") {
          updatedHistory[updatedHistory.length - 1].AI = parsed.ai_response_text;
        } else {
          // Yeni bir entry ekle
          updatedHistory.push({
            AI: parsed.ai_response_text,
            USER: ""
          });
        }
        setConversationHistory(updatedHistory);
        
        console.log("📝 AI yanıtından sonra güncellenmiş history:", updatedHistory);
        
        // AI yanıtını göster
        setTimeout(() => {
          console.log("📢 AI yanıtı ekranda gösteriliyor");
          setShowUserResponse(false);
          setShowBuddyQuestion(true);
          
          // **DÜZELTME**: Normal konuşmada da TTS'i hemen başlat
          console.log("🚀 Normal konuşma AI yanıtı geldi, TTS hemen başlatılıyor:", parsed!.ai_response_text);
          playTTSImmediately(parsed!.ai_response_text);
          
          // **YENİ**: AI yanıtını chat'e ekle
          addChatMessage('ai', parsed!.ai_response_text);
          
          setBuddyResponse({
            delay_seconds: 0,
            target_question_number: "devam",
            ai_question: parsed!.ai_response_text
          });

          // Eğer konuşma bittiyse, konuşmayı özetle ve normal çalışma moduna dön
          if (parsed!.is_conversation_over) {
            console.log("🏁 Konuşma bitti, özetleme başlıyor...");
            // Konuşmayı özetle
            summarizeConversation(updatedHistory);
            
            // **DÜZELTME**: Konuşma bitiminde daha uzun süre bekle (metin uzunluğuna göre)
            let finalDisplayDuration = Math.max(8000, parsed!.ai_response_text.length * 80); // Minimum 8 saniye
            console.log(`📱 Final AI yanıtı ${finalDisplayDuration/1000} saniye ekranda kalacak`);
            
            setTimeout(() => {
              console.log("🔚 Soru baloncuğu kapatılıyor, normal moda dönülüyor");
              setShowBuddyQuestion(false);
              setHeadTurn(0); // Başı düz tut
              shouldAskNewQuestionRef.current = true; // Flag'i set et
              
              // **DÜZELTME**: Normal conversation bitiminde backup buddy cycle tetikleyicisi
              setTimeout(() => {
                console.log("🔄 Normal conversation backup cycle tetikleniyor...");
                if (initialQuestionAsked && !showBuddyQuestion && !isRecording && !isProcessingResponse && 
                    !isUserQuestionMode && !buddyCyclePaused && !waitingForUserResponse &&
                    shouldAskNewQuestionRef.current === true) { // **YENİ**: Flag kontrolü eklendi
                  console.log("✅ Backup cycle koşulları sağlandı, yeni soru soruluyor");
                  shouldAskNewQuestionRef.current = false; // Flag'i kullan ve sıfırla
                  runBuddyPrompt();
                } else {
                  console.log("❌ Backup cycle koşulları sağlanmadı, shouldAskNewQuestionRef:", shouldAskNewQuestionRef.current);
                }
              }, 15000); // **DÜZELTME**: 5 saniye yerine 15 saniye bekle
            }, finalDisplayDuration); // Dinamik süre - minimum 8 saniye
          }
        }, 3000);
      } else {
        console.log("⚠️ Parse edilemezse basit yanıt gösteriliyor");
        // Parse edilemezse basit yanıt göster
        setTimeout(() => {
          setShowUserResponse(false);
          setShowBuddyQuestion(true);
          
          // **DÜZELTME**: Parse hatası durumunda da TTS'i hemen başlat
          const errorMessage = "Anlayamadım, tekrar söyler misin?";
          console.log("🚀 Parse hatası mesajı, TTS hemen başlatılıyor:", errorMessage);
          playTTSImmediately(errorMessage);
          
          // **YENİ**: Parse hatası mesajını chat'e ekle (duplicate kontrolü ile)
          addChatMessage('ai', errorMessage);
          
          setBuddyResponse({
            delay_seconds: 0,
            target_question_number: "devam",
            ai_question: errorMessage
          });
          
          // **DÜZELTME**: Parse hatası durumunda da daha uzun süre göster
          setTimeout(() => {
            console.log("🔚 Parse hatası yanıtı kapatılıyor");
            setShowBuddyQuestion(false);
            setHeadTurn(0);
            shouldAskNewQuestionRef.current = true;
            
            // **DÜZELTME**: Parse hatası bitiminde backup buddy cycle tetikleyicisi
            setTimeout(() => {
              console.log("🔄 Parse hatası backup cycle tetikleniyor...");
              if (initialQuestionAsked && !showBuddyQuestion && !isRecording && !isProcessingResponse && 
                  !isUserQuestionMode && !buddyCyclePaused && !waitingForUserResponse &&
                  shouldAskNewQuestionRef.current === true) { // **YENİ**: Flag kontrolü eklendi
                console.log("✅ Parse hatası backup cycle koşulları sağlandı, yeni soru soruluyor");
                shouldAskNewQuestionRef.current = false; // Flag'i kullan ve sıfırla
                runBuddyPrompt();
              } else {
                console.log("❌ Parse hatası backup cycle koşulları sağlanmadı, shouldAskNewQuestionRef:", shouldAskNewQuestionRef.current);
              }
            }, 15000); // **DÜZELTME**: 5 saniye yerine 15 saniye bekle
          }, 6000); // 6 saniye göster
        }, 3000);
      }

    } catch (error) {
      console.error('Ses işleme hatası:', error);
      setUserResponseText("Ses işlenirken hata oluştu");
      setShowUserResponse(true);
    } finally {
      setIsProcessingResponse(false);
    }
  };

  // TTS için önceki soru tracking
  const lastTTSQuestionRef = React.useRef<string>("");

  // **DÜZELTME**: Normal buddy soruları için TTS (sadece delay ile gelen sorular, duplicate kontrolü ile)
  React.useEffect(() => {
    // Sadece normal buddy cycle'dan gelen sorular için (kullanıcı sorusu yanıtları değil)
    if (buddyResponse && buddyResponse.ai_question && 
        buddyResponse.target_question_number !== "kullanici_sorusu" && 
        buddyResponse.target_question_number !== "devam" &&
        showBuddyQuestion &&
        lastTTSQuestionRef.current !== buddyResponse.ai_question) { // Duplicate kontrolü
      
      console.log("🎵 Normal buddy sorusu için TTS anında başlatılıyor:", buddyResponse.ai_question.substring(0, 50) + "...");
      lastTTSQuestionRef.current = buddyResponse.ai_question; // Son soruyu kaydet
      playTTSImmediately(buddyResponse.ai_question);
      
      // **NOT**: Chat'e ekleme delay effect'inde yapılıyor, duplicate önlemek için burada kaldırıldı
    }
  }, [buddyResponse, showBuddyQuestion, addChatMessage]);

  // **KALDIRILD**: Eski TTS oynatma sistemi - artık anında başlatıldığı için gerek yok

  // Sahne geçiş animasyonu için state
  const [sceneOpacity, setSceneOpacity] = React.useState(0);
  const [sceneLoaded, setSceneLoaded] = React.useState(false);

  // Sahne yüklendiğinde opacity animasyonu
  React.useEffect(() => {
    if (sceneReady && !sceneLoaded) {
      setSceneLoaded(true);
      // 2 saniyede opacity 0'dan 1'e geçiş
      const timer = setTimeout(() => {
        setSceneOpacity(1);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [sceneReady, sceneLoaded]);

  // Mikrofon işlemi için yeni state
  const [userRecording, setUserRecording] = React.useState(false);
  const [userRecordingCancelled, setUserRecordingCancelled] = React.useState(false);
  const [userAnswerMode, setUserAnswerMode] = React.useState(false);
  const userMediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const userStreamRef = React.useRef<MediaStream | null>(null);
  // **DÜZELTME**: userAudioChunks'ı ref olarak yönet (scope problemi önlenir)
  const userAudioChunksRef = React.useRef<Blob[]>([]);

  // Mikrofonu başlat
  const startUserRecording = async () => {
    // **YENİ**: Mikrofon activity'sini güncelle
    setLastMicrophoneActivity(Date.now());
    console.log("🎤 Mikrofon activity güncellendi");
    
    // **DÜZELTME**: Kullanıcı mikrofon kullanırken yeni soru gelmesin diye flag'i sıfırla
    shouldAskNewQuestionRef.current = false;
    
    // **YENİ**: Kullanıcı soru modunu başlat ve normal buddy cycle'ı durdur
    console.log("🎤 Kullanıcı soru modu başlıyor, normal cycle durduruluyor");
    setIsUserQuestionMode(true);
    setBuddyCyclePaused(true);
    
    // Mevcut delay'leri temizle
    if (delayTimeoutRef.current) clearTimeout(delayTimeoutRef.current);
    
    // **DÜZELTME**: Eski buddy response'u temizle ki aynı soru tekrar okunmasın
    setBuddyResponse(null);
    
    // UI state'lerini sıfırla (recording state HARİÇ - o MediaRecorder hazır olunca set edilecek)
    setShowBuddyQuestion(false);
    setIsProcessingResponse(false);
    setUserRecordingCancelled(false);
    setHeadTurn(0); // Kullanıcıya dön
    
    // **DÜZELTME**: Audio chunks'ı temizle
    userAudioChunksRef.current = [];
    
    try {
      console.log("🎧 Mikrofon izni isteniyor...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("✅ Mikrofon izni alındı, MediaRecorder hazırlanıyor...");
      
      userStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      userMediaRecorderRef.current = mediaRecorder;
      
      // **DÜZELTME**: Event listener'ları hazırla
      mediaRecorder.ondataavailable = (event) => {
        console.log("📊 Audio data alındı:", event.data.size, "bytes");
        userAudioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        console.log("🛑 MediaRecorder durduruldu");
        if (userRecordingCancelled) {
          console.log("❌ Kayıt iptal edildi, cleanup yapılıyor");
          setUserRecording(false);
          userStreamRef.current?.getTracks().forEach(track => track.stop());
          return;
        }
        const audioBlob = new Blob(userAudioChunksRef.current, { type: 'audio/wav' });
        console.log("🎵 Audio blob oluşturuldu:", audioBlob.size, "bytes");
        await processUserQuestionAudio(audioBlob);
        setUserRecording(false);
        userStreamRef.current?.getTracks().forEach(track => track.stop());
        setHeadTurn(getHeadTurnForCamera(camera)); // Kayıt bitince tekrar pozisyona dön
      };
      
      mediaRecorder.onerror = (event) => {
        console.error("❌ MediaRecorder hatası:", event);
        setUserRecording(false);
        setUserRecordingCancelled(false);
        userStreamRef.current?.getTracks().forEach(track => track.stop());
      };
      
      // **DÜZELTME**: MediaRecorder başlatıldıktan SONRA UI state'i güncelle
      // timeslice ile düzenli data gönderimi (1 saniyede bir)
      mediaRecorder.start(1000);
      console.log("🔴 Kayıt başladı (timeslice: 1000ms)");
      setUserRecording(true); // ⚡ Sadece kayıt gerçekten başladıktan sonra
      
    } catch (error) {
      console.error('❌ Mikrofon erişimi hatası:', error);
      // **DÜZELTME**: Hata durumunda state'leri temizle
      setUserRecording(false);
      setUserRecordingCancelled(false);
      setIsUserQuestionMode(false);
      setBuddyCyclePaused(false);
      if (userStreamRef.current) {
        userStreamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  // Mikrofonu manuel bitir
  const stopUserRecording = () => {
    if (userMediaRecorderRef.current && userMediaRecorderRef.current.state === 'recording') {
      userMediaRecorderRef.current.stop();
    }
  };

  // Kayıt iptal
  const cancelUserRecording = () => {
    console.log("❌ Kullanıcı kaydı iptal edildi, normal moda dönülüyor");
    setUserRecordingCancelled(true);
    if (userMediaRecorderRef.current && userMediaRecorderRef.current.state === 'recording') {
      userMediaRecorderRef.current.stop();
    }
    setUserRecording(false);
    setShowUserResponse(false);
    setHeadTurn(getHeadTurnForCamera(camera)); // İptal edilirse tekrar pozisyona dön
    
    // **DÜZELTME**: Eski buddy response'u temizle ki aynı soru tekrar okunmasın
    setBuddyResponse(null);
    
    // **YENİ**: İptal edildiğinde normal moda dön
    setIsUserQuestionMode(false);
    setUserAnswerMode(false);
    setBuddyCyclePaused(false);
  };

  // Kullanıcı sorusu için özel prompt ile AI'ya istek at
  const processUserQuestionAudio = async (audioBlob: Blob) => {
    console.log("🔄 Kullanıcı sorusu işleniyor...");
    setIsProcessingResponse(true);
    setUserAnswerMode(true); // Kullanıcıya özel cevap bekleniyor
    setWaitingForUserResponse(false); // Kullanıcı soru modu da yanıt sayılır
    setHeadTurn(0); // Cevap gelirken kullanıcıya dön
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        console.error("Gemini API anahtarı bulunamadı!");
        setIsProcessingResponse(false);
        return;
      }
      // Önce sesi metne çevir
      const transcriptionBody = JSON.stringify({
        contents: [
          { role: "user", parts: [
            { text: "Bu ses kaydını Türkçe metne çevir. Sadece metni döndür, başka hiçbir şey ekleme." },
            { inline_data: { mime_type: "audio/wav", data: base64Audio } }
          ]}
        ]
      });
      const transcriptionResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: transcriptionBody
      });
      const transcriptionData = await transcriptionResponse.json();
      const userText = transcriptionData?.candidates?.[0]?.content?.parts?.[0]?.text || "Ses anlaşılamadı";
      setUserResponseText(userText);
      setShowUserResponse(true);

      // **YENİ**: Kullanıcı sorusunu chat'e ekle
      addChatMessage('user', userText);

      // **DÜZELTME**: Kullanıcı soru modunda da conversation history'yi güncelle
      // Eğer önceki buddy sorusu varsa ve bu bir normal cevap değilse, yeni bir diyalog başlat
      const newHistory = [...conversationHistory];
      if (buddyResponse && buddyResponse.ai_question && buddyResponse.target_question_number !== "kullanici_sorusu") {
        // Bu bir buddy sorusuna cevap değil, kullanıcının kendi sorusu
        newHistory.push({
          AI: "", // AI henüz cevap vermedi
          USER: userText
        });
      }
      setConversationHistory(newHistory);
      console.log("🔄 Kullanıcı sorusu için conversation history güncellendi:", newHistory);
      // **DÜZELTME**: Kapsamlı prompt ile ders materyali ve konuşma bağlamını dahil et
      let contextualPrompt = `Sen bir AI Study Buddy'sin. Bir öğrenci gibi davranıyorsun - samimi, arkadaşça ve yardımsever.

DERS MATERYALİ:`;

      // Ders materyali sorularını ekle
      if (questionsJson && questionsJson.questions) {
        contextualPrompt += `\nElinde şu sorular var:\n`;
        questionsJson.questions.forEach((q, index) => {
          contextualPrompt += `${index + 1}. Soru ${q.question_number}: ${q.question_text}\n`;
        });
      }

      // Şu anki buddy sorusunu ekle
      if (buddyResponse && buddyResponse.ai_question && buddyResponse.target_question_number !== "kullanici_sorusu") {
        contextualPrompt += `\nSEN AZ ÖNCE ŞUNU SORMUŞTUN: "${buddyResponse.ai_question}"`;
        if (buddyResponse.target_question_number) {
          contextualPrompt += ` (${buddyResponse.target_question_number}. soru hakkında)`;
        }
      }

      // Konuşma geçmişini ekle
      if (conversationHistory.length > 0) {
        contextualPrompt += `\n\nÖNCEKİ KONUŞMA GEÇMİŞİ:\n`;
        conversationHistory.forEach((entry, index) => {
          contextualPrompt += `${index + 1}. Sen: "${entry.AI}"\n`;
          if (entry.USER) {
            contextualPrompt += `   Kullanıcı: "${entry.USER}"\n`;
          }
        });
      }

      contextualPrompt += `\n\nŞİMDİ KULLANICI SANA ŞUNU SÖYLÜYOR: "${userText}"

Bu soruya ders materyalini ve önceki konuşmayı dikkate alarak samimi bir öğrenci gibi yanıt ver. Eğer kendi sorduğun soruyla ilgiliyse o bağlamda cevapla. Kısa ve net ol.`;

      console.log("🎯 Contextualized prompt:", contextualPrompt);

      const conversationBody = JSON.stringify({
        contents: [
          { role: "user", parts: [ { text: contextualPrompt } ] }
        ]
      });
      const conversationResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: conversationBody
      });
      const conversationData = await conversationResponse.json();
      const result = conversationData?.candidates?.[0]?.content?.parts?.[0]?.text || "Yanıt alınamadı.";
      
      // **DÜZELTME**: TTS'i paralel olarak hemen başlat (gecikme olmadan)
      console.log("🚀 AI yanıtı geldi, TTS hemen başlatılıyor:", result);
      playTTSImmediately(result);
      
      // **YENİ**: AI yanıtını chat'e ekle (kullanıcı sorusu yanıtı)
      addChatMessage('ai', result);
      
      setBuddyResponse({
        delay_seconds: 0,
        target_question_number: "kullanici_sorusu",
        ai_question: result
      });
      setShowBuddyQuestion(true);
      setIsProcessingResponse(false);
      
      // **DÜZELTME**: AI cevabını conversation history'ye ekle
      const updatedHistory = [...conversationHistory];
      if (updatedHistory.length > 0 && updatedHistory[updatedHistory.length - 1].AI === "") {
        updatedHistory[updatedHistory.length - 1].AI = result;
      } else {
        updatedHistory.push({
          AI: result,
          USER: ""
        });
      }
      setConversationHistory(updatedHistory);
      console.log("✅ AI cevabı conversation history'ye eklendi:", updatedHistory);
      
      // **DÜZELTME**: Sesli okuma için TTS tetikleme
      console.log("🔊 Kullanıcı sorusu yanıtı için TTS tetikleniyor:", result);
      
      // **YENİ**: Kullanıcı sorusu cevaplandıktan sonra daha uzun süre bekleyip normal moda dön
      // Ses çalma süresini hesaba katarak en az 12 saniye göster
      let displayDuration = Math.max(12000, result.length * 100); // Minimum 12 saniye veya metin uzunluğuna göre
      console.log(`📱 AI yanıtı ${displayDuration/1000} saniye ekranda kalacak`);
      
      setTimeout(() => {
        console.log("✅ Kullanıcı sorusu tamamlandı, normal moda dönülüyor");
        setIsUserQuestionMode(false);
        setUserAnswerMode(false);
        setShowBuddyQuestion(false);
        setShowUserResponse(false);
        
        // **DÜZELTME**: Kullanıcı sorusu buddyResponse'unu temizle
        setBuddyResponse(null);
        
        // Normal buddy cycle'ı yeniden başlat (delay ile)
        setTimeout(() => {
          setBuddyCyclePaused(false);
          shouldAskNewQuestionRef.current = true;
          console.log("🔄 Normal buddy cycle yeniden başlatılıyor...");
        }, 3000); // 3 saniye sonra normal cycle'a dön
      }, displayDuration); // Dinamik süre - minimum 12 saniye
      
    } catch (err) {
      setIsProcessingResponse(false);
      setShowBuddyQuestion(false);
      setUserAnswerMode(false);
      setIsUserQuestionMode(false);
      setBuddyCyclePaused(false);
      // **DÜZELTME**: Hata durumunda da buddy response'u temizle
      setBuddyResponse(null);
      console.error("Kullanıcı sorusu işlenirken hata:", err);
    }
  };

  // Buddy cevabı gösterildikten sonra userAnswerMode'u sıfırla
  React.useEffect(() => {
    if (showBuddyQuestion && !isProcessingResponse && userAnswerMode && isUserQuestionMode) {
      setHeadTurn(0); // Cevap gösterilirken kullanıcıya dön
      // Bu kontrol artık processUserQuestionAudio'da yapılıyor, burada sadece kafa dönme
    }
  }, [showBuddyQuestion, isProcessingResponse, userAnswerMode, isUserQuestionMode]);

  // **YENİ**: Inactivity timer - 1 dakika mikrofon kullanılmazsa soru sor
  React.useEffect(() => {
    const startInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
      }
      
      inactivityTimerRef.current = setInterval(() => {
        const timeSinceLastActivity = Date.now() - lastMicrophoneActivity;
        const oneMinute = 60 * 1000; // 60 saniye
        
        console.log(`⏰ Inactivity check: ${Math.round(timeSinceLastActivity/1000)}s geçti`);
        
        // 1 dakika geçti ve AI buddy soru sormuyorsa yeni soru sor
        if (timeSinceLastActivity >= oneMinute && 
            initialQuestionAsked &&
            !showBuddyQuestion && 
            !isRecording && 
            !userRecording && 
            !isProcessingResponse && 
            !isUserQuestionMode && 
            !buddyCyclePaused &&
            !waitingForUserResponse &&
            questionsJson && questionsJson.questions) {
          
          console.log("🔔 1 dakika geçti, AI buddy yeni soru soracak");
          shouldAskNewQuestionRef.current = false; // Inactivity timer da flag'i sıfırlasın
          runBuddyPrompt();
          setLastMicrophoneActivity(Date.now()); // Timer'ı sıfırla
        }
      }, 10000); // Her 10 saniyede kontrol et
    };

    // Sadece session active olduğunda timer başlat
    if (sessionStarted && sceneReady && questionsJson) {
      startInactivityTimer();
    }

    return () => {
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
      }
    };
  }, [sessionStarted, sceneReady, questionsJson, lastMicrophoneActivity, showBuddyQuestion, isRecording, userRecording, isProcessingResponse, isUserQuestionMode, buddyCyclePaused, runBuddyPrompt]);

  if (!sessionStarted && !showPositionSelector) {
    return <Lobby handleSessionStart={handleSessionStart} />;
  }

  // Masa pozisyon seçim ekranı
  if (showPositionSelector) {
    return (
      <div style={{
        minHeight: "100vh",
        minWidth: "100vw",
        background: "#171720",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontFamily: "Poppins, Arial, Helvetica, sans-serif"
      }}>
        <div style={{
          background: "#23234a",
          borderRadius: 18,
          padding: "48px 40px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          <div style={{ marginBottom: 20, color: "#fff", fontSize: 24, fontWeight: 600 }}>
            Cihazınız masada nerede bulunuyor?
          </div>
          <div
            style={{
              position: 'relative',
              width: 600,
              height: 350,
              marginBottom: 24,
              cursor: 'pointer',
              borderRadius: 18,
              overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(124,58,237,0.10)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleDeskClick}
          >
            <div style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#2d2d5f'
            }}>
              <img
                src="/assets/lobby_desk.png"
                alt="Masa"
                style={{ 
                  width: '100%', 
                  height: '100%',
                  display: 'block', 
                  userSelect: 'none', 
                  pointerEvents: 'none',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
                draggable={false}
              />
              <div style={{
                display: 'none',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                fontSize: '48px',
                color: '#a78bfa'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>🪑</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Çalışma Masası</div>
              </div>
            </div>
            {/* Overlay alanlar */}
            {['left', 'center', 'right'].map((area) => (
              <div
                key={area}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: area === 'left' ? 0 : area === 'center' ? '33.33%' : '66.66%',
                  width: '33.33%',
                  height: '100%',
                  background: hoveredArea === area ? 'rgba(124,58,237,0.18)' : 'transparent',
                  border: hoveredArea === area ? '2px solid #a78bfa' : 'none',
                  transition: 'background 0.2s, border 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  zIndex: 2
                }}
              >
                {hoveredArea === area && (
                  <span style={{
                    background: '#7c3aed',
                    color: '#fff',
                    padding: '8px 18px',
                    borderRadius: 12,
                    fontSize: 18,
                    fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(124,58,237,0.10)'
                  }}>{areaNames[area as keyof typeof areaNames]}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // İlk OCR sorgusu sırasında loading ekranı göster
  if (sessionStarted && loading) {
    return (
      <div style={{
        minHeight: "100vh",
        minWidth: "100vw",
        background: "#171720",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontFamily: "Poppins, Arial, Helvetica, sans-serif",
        fontSize: 24,
        letterSpacing: 0.2,
        fontWeight: 600,
        position: "relative"
      }}>
        {/* Arkaplanda sahne yükleniyor */}
        {sceneReady && (
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            opacity: sceneOpacity,
            transition: "opacity 2s ease-in-out",
            zIndex: 1
          }}>
            <Canvas camera={{ position: camera.position, fov: 60 }}>
              <color attach="background" args={['#ffffff']} />
              <Experience headTurnY={headTurn} cameraTarget={camera.target} cameraPosition={camera.position} />
            </Canvas>
          </div>
        )}
        
        <div style={{
          background: "#23234a",
          borderRadius: 18,
          padding: "48px 40px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 2,
          position: "relative"
        }}>
          <div className="lobby-avatar lobby-avatar-glow" style={{ width: 120, height: 120, marginBottom: 32 }}>
            <img src="/assets/character_smiling.png" alt="Karakter" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", objectPosition: "center 40%" }} />
          </div>
          <div style={{ marginBottom: 18 }}>Materyalleri gözden geçiriyorum...</div>
          <div className="lobby-loading-spinner" style={{ width: 48, height: 48, border: "5px solid #7c3aed", borderTop: "5px solid #23234a", borderRadius: "50%", animation: "spin 1.1s linear infinite" }} />
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Sahneye geçiş için sessionStarted && !loading && sceneReady kontrolü
  if (!sceneReady) {
    return null;
  }

  return (
    <>
      {/* **YENİ**: Chat Panel */}
      <div style={{
        position: "fixed",
        top: 0,
        left: isChatPanelOpen ? 0 : -400,
        width: 400,
        height: "100vh",
        background: "rgba(35, 35, 74, 0.95)",
        backdropFilter: "blur(10px)",
        borderRight: "1px solid rgba(124, 58, 237, 0.3)",
        zIndex: 2000,
        transition: "left 0.3s ease-in-out",
        display: "flex",
        flexDirection: "column"
      }}>
        {/* Chat Panel Header */}
        <div style={{
          background: "rgba(124, 58, 237, 0.8)",
          color: "#fff",
          padding: "16px 20px",
          fontSize: 18,
          fontWeight: 600,
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <span>💬 Sohbet Geçmişi</span>
          <button
            onClick={() => setIsChatPanelOpen(false)}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              fontSize: 20,
              cursor: "pointer",
              padding: "4px 8px"
            }}
          >
            ×
          </button>
        </div>

        {/* Chat Messages Area */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          fontSize: 14
        }}>
          {chatMessages.length === 0 ? (
            <div style={{
              color: "#a78bfa",
              textAlign: "center",
              marginTop: "50%",
              fontStyle: "italic"
            }}>
              Henüz konuşma yok...
            </div>
          ) : (
            chatMessages.map((message) => (
              <div
                key={message.id}
                style={{
                  alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%'
                }}
              >
                <div style={{
                  background: message.type === 'user' 
                    ? "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)"
                    : "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
                  color: "#fff",
                  padding: "10px 14px",
                  borderRadius: 16,
                  fontSize: 13,
                  lineHeight: 1.4,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                }}>
                  <div style={{ 
                    fontSize: 11, 
                    opacity: 0.8, 
                    marginBottom: 4,
                    fontWeight: 600
                  }}>
                    {message.type === 'user' ? '👤 Sen' : '🤖 AI Buddy'}
                  </div>
                  <div>{message.text}</div>
                  <div style={{ 
                    fontSize: 10, 
                    opacity: 0.6, 
                    marginTop: 4,
                    textAlign: 'right'
                  }}>
                    {new Date(message.timestamp).toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                             </div>
             ))
           )}
                      {/* **YENİ**: Gerçek zamanlı durum göstergesi */}
           {(isRecording || userRecording || isProcessingResponse) && (
             <div style={{
               background: "rgba(0,0,0,0.3)",
               margin: "8px 16px",
               padding: "8px 12px",
               borderRadius: 12,
               fontSize: 12,
               color: "#fff",
               display: "flex",
               alignItems: "center",
               gap: "8px",
               border: "1px solid rgba(124,58,237,0.3)"
             }}>
               <div style={{
                 width: 8,
                 height: 8,
                 borderRadius: "50%",
                 background: isRecording || userRecording ? "#ef4444" : "#10b981",
                 animation: "pulse 1s infinite"
               }} />
               <span>
                 {(isRecording || userRecording) && "🎤 Kayıt yapılıyor..."}
                 {isProcessingResponse && !(isRecording || userRecording) && "🤖 AI düşünüyor..."}
               </span>
             </div>
           )}

           {/* **YENİ**: Auto-scroll için referans elementi */}
           <div ref={chatMessagesEndRef} />
         </div>

         {/* Chat Panel Footer */}
         <div style={{
           background: "rgba(0,0,0,0.2)",
           padding: "12px 16px",
           borderTop: "1px solid rgba(255,255,255,0.1)",
           fontSize: 12,
           color: "#a78bfa",
           textAlign: "center"
         }}>
                    Mikrofon kullanarak AI Buddy ile konuşabilirsin
         </div>
       </div>

       {/* **YENİ**: CSS animasyonları */}
       <style>{`
         @keyframes pulse {
           0% { opacity: 1; }
           50% { opacity: 0.5; }
           100% { opacity: 1; }
         }
       `}</style>

      {/* **YENİ**: Chat Panel Toggle Button */}
      <button
        onClick={() => setIsChatPanelOpen(!isChatPanelOpen)}
        style={{
          position: "fixed",
          top: 20,
          left: isChatPanelOpen ? 420 : 20,
          width: 50,
          height: 50,
          borderRadius: "50%",
          border: "none",
          background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
          color: "#fff",
          fontSize: 20,
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(124, 58, 237, 0.4)",
          zIndex: 2100,
          transition: "all 0.3s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = "0 6px 24px rgba(124, 58, 237, 0.6)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(124, 58, 237, 0.4)";
        }}
      >
        {isChatPanelOpen ? '←' : '💬'}
      </button>

      {/* Mikrofon butonu */}
      {showBuddyQuestion && buddyResponse && !isRecording && !isProcessingResponse && (
        <button
          onClick={startRecording}
          style={{
            position: "absolute",
            bottom: 140, // Müzik çalar için yer bırak
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1100, // Müzik çaların üstünde
            width: 80,
            height: 80,
            borderRadius: "50%",
            border: "none",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            cursor: "pointer",
            boxShadow: "0 8px 32px rgba(102, 126, 234, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s ease",
            overflow: "hidden"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)";
            e.currentTarget.style.transform = "translateX(-50%) scale(1.1)";
            e.currentTarget.style.boxShadow = "0 12px 40px rgba(102, 126, 234, 0.6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
            e.currentTarget.style.transform = "translateX(-50%) scale(1)";
            e.currentTarget.style.boxShadow = "0 8px 32px rgba(102, 126, 234, 0.4)";
          }}
        >
          <div style={{
            position: 'relative',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src="/assets/microfon.png" 
              alt="Mikrofon" 
              style={{ 
                width: 32, 
                height: 32, 
                // filter: "brightness(0) saturate(0) invert(1)", // Test için kaldırıldı
                transition: "transform 0.2s ease"
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'block';
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            />
            <span style={{
              display: 'none',
              fontSize: '24px',
              color: '#fff',
              userSelect: 'none'
            }}>🎤</span>
          </div>
        </button>
      )}

      {/* Kayıt göstergesi */}
      {isRecording && (
        <div style={{
          position: "absolute",
          bottom: 140, // Müzik çalar için yer bırak
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1100, // Müzik çaların üstünde
          background: "#dc2626",
          color: "#fff",
          borderRadius: 16,
          padding: "12px 24px",
          fontSize: 16,
          fontWeight: 600,
          boxShadow: "0 4px 20px rgba(220,38,38,0.3)",
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          <div style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#fff",
            animation: "pulse 1s infinite"
          }} />
          Kayıt yapılıyor...
          <style>{`@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }`}</style>
        </div>
      )}

      {/* İşleme göstergesi */}
      {isProcessingResponse && (
        <div style={{
          position: "absolute",
          bottom: 140, // Müzik çalar için yer bırak
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1100, // Müzik çaların üstünde
          background: "#059669",
          color: "#fff",
          borderRadius: 16,
          padding: "12px 24px",
          fontSize: 16,
          fontWeight: 600,
          boxShadow: "0 4px 20px rgba(5,150,105,0.3)",
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          <div style={{
            width: 16,
            height: 16,
            border: "2px solid #fff",
            borderTop: "2px solid transparent",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }} />
          Ses işleniyor...
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Mikrofon butonunu her zaman ekranda göster */}
      {!isProcessingResponse && (
        <button
          onClick={userRecording ? stopUserRecording : startUserRecording}
          style={{
            position: "absolute",
            bottom: 140, // Müzik çalar için yer bırak
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1100, // Müzik çaların üstünde
            width: 80,
            height: 80,
            borderRadius: "50%",
            border: "none",
            background: userRecording ? "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            cursor: "pointer",
            boxShadow: userRecording ? "0 8px 32px rgba(231, 76, 60, 0.4)" : "0 8px 32px rgba(102, 126, 234, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s ease",
            overflow: "hidden"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = userRecording ? "linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)" : "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)";
            e.currentTarget.style.transform = "translateX(-50%) scale(1.1)";
            e.currentTarget.style.boxShadow = userRecording ? "0 12px 40px rgba(231, 76, 60, 0.6)" : "0 12px 40px rgba(102, 126, 234, 0.6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = userRecording ? "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
            e.currentTarget.style.transform = "translateX(-50%) scale(1)";
            e.currentTarget.style.boxShadow = userRecording ? "0 8px 32px rgba(231, 76, 60, 0.4)" : "0 8px 32px rgba(102, 126, 234, 0.4)";
          }}
        >
          <div style={{
            position: 'relative',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src="/assets/microfon.png" 
              alt="Mikrofon" 
              style={{ 
                width: 32, 
                height: 32, 
                // filter: "brightness(0) saturate(0) invert(1)", // Test için kaldırıldı
                transition: "transform 0.2s ease"
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'block';
              }}
            />
            <span style={{
              display: 'none',
              fontSize: '24px',
              color: '#fff',
              userSelect: 'none'
            }}>🎤</span>
          </div>
        </button>
      )}
      {userRecording && !isProcessingResponse && (
        <button
          onClick={cancelUserRecording}
          style={{
            position: "absolute",
            bottom: 230, // Müzik çalar + mikrofon butonu için yer bırak
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1100, // Müzik çaların üstünde
            padding: "12px 32px",
            borderRadius: 16,
            border: "none",
            background: "#e74c3c",
            color: "#fff",
            fontWeight: 600,
            fontSize: 18,
            boxShadow: "0 4px 20px rgba(231,76,60,0.3)",
            cursor: "pointer"
          }}
        >
          İptal Et
        </button>
      )}

      {/* Masa pozisyon seçimi ekranı */}
      {showPositionSelector && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.7)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#23234a",
            borderRadius: 18,
            padding: "48px 40px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}>
            <div style={{ marginBottom: 20, color: "#fff", fontSize: 24, fontWeight: 600 }}>
              Masa Pozisyonunu Seçin
            </div>
            <button
              onClick={() => handlePositionSelected(CAMERA_PRESETS.karsisina)}
              style={{
                width: 200,
                height: 200,
                borderRadius: "50%",
                border: "none",
                background: selectedPosition === CAMERA_PRESETS.karsisina ? "#7c3aed" : "#444",
                color: "#fff",
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(124,58,237,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#6d28d9";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = selectedPosition === CAMERA_PRESETS.karsisina ? "#7c3aed" : "#444";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              Karşısına Otur
            </button>
            <button
              onClick={() => handlePositionSelected(CAMERA_PRESETS.sagina)}
              style={{
                width: 200,
                height: 200,
                borderRadius: "50%",
                border: "none",
                background: selectedPosition === CAMERA_PRESETS.sagina ? "#7c3aed" : "#444",
                color: "#fff",
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(124,58,237,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#6d28d9";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = selectedPosition === CAMERA_PRESETS.sagina ? "#7c3aed" : "#444";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              Sağına Otur
            </button>
            <button
              onClick={() => handlePositionSelected(CAMERA_PRESETS.soluna)}
              style={{
                width: 200,
                height: 200,
                borderRadius: "50%",
                border: "none",
                background: selectedPosition === CAMERA_PRESETS.soluna ? "#7c3aed" : "#444",
                color: "#fff",
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(124,58,237,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#6d28d9";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = selectedPosition === CAMERA_PRESETS.soluna ? "#7c3aed" : "#444";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              Soluna Otur
            </button>
          </div>
        </div>
      )}

      <Canvas camera={{ position: camera.position, fov: 60 }}>
        <color attach="background" args={['#ffffff']} />
        <Experience headTurnY={headTurn} cameraTarget={camera.target} cameraPosition={camera.position} />
      </Canvas>

      {/* Müzik Çalar - Session başladığında ve sahne yüklendiğinde göster */}
      {sessionStarted && sceneReady && (
        <MusicPlayer playlistId="PLkDQC8YWp9j3jNgtgDZ2rIqaVNO4LyQZV" />
      )}
    </>
  );
}

export default App; 