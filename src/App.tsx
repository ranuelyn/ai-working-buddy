// React ve temel kütüphaneler
import * as React from "react";
import { Canvas } from "@react-three/fiber";
import { Html } from '@react-three/drei';
// Stil dosyaları
import './App.css';
// Bileşenler
import { Experience } from "./components/Experience";
import { Lobby } from "./components/Lobby";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import { MusicPlayer } from "./components/MusicPlayer";
import { PomodoroTimer } from "./components/PomodoroTimer";
import { Profile } from "./components/Profile";
import { StudyMaterial } from "./components/StudyMaterial";
import { ChatPanel } from './components/ChatPanel';
import { Notification } from './components/Notification';
// Context'ler
import { AuthProvider, useAuth } from "./contexts/AuthContext";
// Sabitler ve tipler
import { CAMERA_PRESETS, type CameraPreset } from './constants/cameraPresets';
import type { QuestionsJson, BuddyResponse, ConversationHistory } from './types';
import type { RAGContext } from "./services/ragService";
// Servisler
import { AIService } from './services/aiService';
import { TTSService } from './services/ttsService';
// Hook'lar
import { useChatMessages } from './hooks/useChatMessages';
import { usePomodoro } from './hooks/usePomodoro';
import { useMicrophone } from './hooks/useMicrophone';
import { useBuddy } from './hooks/useBuddy';
import { useMusicPlayer } from './hooks/useMusicPlayer';
function AuthenticatedApp() {
  const [headTurn, setHeadTurn] = React.useState(0);
  const [camera, setCamera] = React.useState<CameraPreset>(CAMERA_PRESETS.karsisina);
  const [sessionStarted, setSessionStarted] = React.useState(false);
  const [sessionImage, setSessionImage] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [questionsJson, setQuestionsJson] = React.useState<QuestionsJson | null>(null);
  const [ragContext, setRagContext] = React.useState<RAGContext | null>(null);
  const [buddyResponse, setBuddyResponse] = React.useState<BuddyResponse | null>(null);
  const [showBuddyQuestion, setShowBuddyQuestion] = React.useState(false);
  const [sceneReady, setSceneReady] = React.useState(false);
  // Mikrofon işlevselliği için yeni state'ler
  const [isRecording, setIsRecording] = React.useState(false);
  const [conversationHistory, setConversationHistory] = React.useState<ConversationHistory>([]);
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
  const inactivityTimerRef = React.useRef<NodeJS.Timeout | undefined>(undefined);
  // **YENİ**: Chat panel state'leri
  const [isChatPanelOpen, setIsChatPanelOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'chat' | 'notes' | 'badges'>('chat');
  // Chat mesajları hook'u
  const { chatMessages, setChatMessages, addChatMessage, chatMessagesEndRef } = useChatMessages();
  // **YENİ**: Rozet sistemi state'leri
  const [earnedBadges, setEarnedBadges] = React.useState(0);
  // **YENİ**: Profile modal state'i
  const [showProfile, setShowProfile] = React.useState(false);
  
  // **YENİ**: Bildirim sistemi state'leri
  const [notifications, setNotifications] = React.useState<Array<{
    id: string;
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
  }>>([]);
  // LocalStorage'dan rozet sayısını yükle
  React.useEffect(() => {
    const savedBadges = localStorage.getItem('ai-buddy-badges');
    if (savedBadges) {
      setEarnedBadges(parseInt(savedBadges));
    }
  }, []);
  // Rozet sayısını localStorage'a kaydet
  React.useEffect(() => {
    localStorage.setItem('ai-buddy-badges', earnedBadges.toString());
  }, [earnedBadges]);
  // TTS fonksiyonu
  const playTTSImmediately = async (text: string): Promise<void> => {
    return TTSService.playTTSImmediately(text);
  };
  
  // **YENİ**: Bildirim ekleme fonksiyonu
  const addNotification = React.useCallback((message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
  }, []);
  
  // **YENİ**: Bildirim kaldırma fonksiyonu
  const removeNotification = React.useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);
  // TTS için önceki soru tracking
  const lastTTSQuestionRef = React.useRef<string>("");
  // **YENİ**: Duplicate soru kontrolü için
  const lastShownQuestionRef = React.useRef<string>("");
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
  // Pomodoro hook'u
  const {
    studyDuration,
    setStudyDuration,
    breakDuration,
    setBreakDuration,
    isBreakTime,
    setIsBreakTime,
    pomodoroActive,
    setPomodoroActive,
    isPlayingPomodoroTTS,
    setIsPlayingPomodoroTTS,
    handleBreakStart,
    handleStudyStart,
    handlePomodoroModeChange,
    completedSessions
  } = usePomodoro(playTTSImmediately, setBuddyCyclePaused, setShowBuddyQuestion, setEarnedBadges, addNotification);
  // **YENİ**: İlk materyal için state
  const [firstMaterial, setFirstMaterial] = React.useState<string | null>(null);
  
  // **YENİ**: Seçilen karakter state'i
  const [selectedCharacter, setSelectedCharacter] = React.useState(0);
  
  // **YENİ**: Karakter listesi
  const characters = [
    { id: 0, name: "AI Buddy", image: "/assets/character_smiling.png", color: "#7c3aed" },
    { id: 1, name: "Office 1", image: "/characters/office2.png", color: "#3b82f6" },
    { id: 2, name: "Office 2", image: "/characters/office3.png", color: "#10b981" },
    { id: 3, name: "Office 3", image: "/characters/office4.png", color: "#f59e0b" }
  ];
  const handleSessionStart = (imageBase64: string, studyMinutes: number, breakMinutes: number, ragContextData?: RAGContext, selectedCharacter?: number) => {
    console.log("🔄 Yeni session başlatılıyor...");
    
    setSessionImage(imageBase64);
    setStudyDuration(studyMinutes);
    setBreakDuration(breakMinutes);
    setPomodoroActive(true);
    setIsBreakTime(false);
    setIsPlayingPomodoroTTS(false); // Pomodoro TTS flag'ini sıfırla
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
    
    // **YENİ**: Duplicate kontrol ref'lerini temizle
    lastTTSQuestionRef.current = "";
    lastShownQuestionRef.current = "";
    
    // **YENİ**: Karakter seçimini sıfırla (default: AI Buddy)
    setSelectedCharacter(0);
    
    // **YENİ**: İlk materyali kaydet
    setFirstMaterial(imageBase64);
    setRagContext(ragContextData || null);
    
    // **YENİ**: Seçilen karakteri kaydet
    if (selectedCharacter !== undefined) {
      setSelectedCharacter(selectedCharacter);
      console.log(`🎭 Seçilen karakter: ${characters[selectedCharacter]?.name || 'AI Buddy'}`);
    }
    
    // **YENİ**: Mikrofon activity'sini sıfırla
    setLastMicrophoneActivity(Date.now());
    
    // **YENİ**: İlk ders rozetini ver (eğer henüz verilmemişse)
    setEarnedBadges(prev => {
      if (prev === 0) {
        console.log("🏆 İlk ders rozeti kazanıldı!");
        addNotification("İlk ders materyalini yükledin! İlk rozetini kazandın!", 'success');
        return 1;
      }
      return prev;
    });
    
    if (ragContextData) {
      // RAG context data işleniyor
    }
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
    if (cameraPreset === CAMERA_PRESETS.sagina) return -1.1; // Sağda ise sola bak
    if (cameraPreset === CAMERA_PRESETS.soluna) return 1.1; // Solda ise sağa bak
    return 0;
  };
  // **YENİ**: Kafa çevirme durumunu takip etmek için state
  const [headTurnState, setHeadTurnState] = React.useState<'idle' | 'engaged'>('idle');
  // **YENİ**: Başlangıçta buddy bilgisayara baksın
  React.useEffect(() => {
    if (sessionStarted && sceneReady) {
      console.log("🔄 Session başladı - kafa idle durumuna geçiyor");
      setHeadTurnState('idle');
    }
  }, [sessionStarted, sceneReady]);
  // 1. OCR: Materyal işleniyor, loading göster
  React.useEffect(() => {
    const runGeminiOCR = async () => {
      if (!sessionImage) return;
      try {
        const parsed = await AIService.runGeminiOCR(sessionImage, ragContext || undefined);
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
  }, [sessionStarted, sessionImage, ragContext]);
  // Mikrofon hook'u
  const { prewarmMicrophone } = useMicrophone();
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
      initialQuestionAsked: ${initialQuestionAsked}
      conversationCount: ${conversationCount}`);
    
    // **DÜZELTME**: Daha güvenli ilk soru kontrolü
    if (sceneReady && 
        questionsJson && 
        questionsJson.questions && 
        questionsJson.questions.length > 0 && // **YENİ**: En az bir soru olmalı
        !initialQuestionAsked && 
        conversationCount === 0) { // **YENİ**: Henüz hiç soru sorulmamış olmalı
      
      setBuddyResponse(null);
      setShowBuddyQuestion(false);
      shouldAskNewQuestionRef.current = false; // Flag'i başlangıçta sıfırla
      // **YENİ**: Mikrofon izni ön-yüklemesi (arkaplanda)
      prewarmMicrophone();
      
      const timeout = setTimeout(() => {
        console.log("🔄 İlk soru soruluyor...");
        setInitialQuestionAsked(true); // Flag'i set et ki tekrar sormasın
        runBuddyPrompt();
      }, 5000);
      
      return () => {
        clearTimeout(timeout);
      };
    }
    // eslint-disable-next-line
  }, [sceneReady, questionsJson, prewarmMicrophone, initialQuestionAsked, conversationCount]);
  // Konuşmayı özetleme fonksiyonu
  const summarizeConversation = async (history: ConversationHistory) => {
    try {
      const summary = await AIService.summarizeConversation(history);
      if (summary) {
        setPastConversations(prev => {
          const newPastConversations = [...prev, summary];
          return newPastConversations;
        });
      }
    } catch (error) {
      console.error('Konuşma özetleme hatası:', error);
    }
  };
  // Buddy hook'u
  const { runBuddyPrompt } = useBuddy(
    questionsJson,
    conversationCount,
    pastConversations,
    ragContext,
    setBuddyResponse,
    setConversationCount,
    shouldAskNewQuestionRef,
    lastShownQuestionRef
  );
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
    
    // **DÜZELTME**: İlk soru henüz tamamlanmamışsa yeni soru sorma
    // En az bir konuşma tamamlanmış olmalı ve ilk soru sorulmuş olmalı
    if (pastConversations.length > 0 && 
        initialQuestionAsked && 
        !showBuddyQuestion && 
        !isRecording && 
        !isProcessingResponse && 
        shouldAskNewQuestionRef.current && 
        !isUserQuestionMode && 
        !buddyCyclePaused && 
        !waitingForUserResponse &&
        conversationHistory.length > 0) { // **YENİ**: En az bir konuşma geçmişi olmalı
      
      shouldAskNewQuestionRef.current = false; // Flag'i sıfırla
      const timeout = setTimeout(() => {
        // **DÜZELTME**: Timeout içinde tekrar kontrol et
        if (initialQuestionAsked && 
            !showBuddyQuestion && 
            !isRecording && 
            !isProcessingResponse && 
            !isUserQuestionMode && 
            !buddyCyclePaused && 
            !waitingForUserResponse &&
            conversationHistory.length > 0) { // **YENİ**: Konuşma geçmişi kontrolü
          runBuddyPrompt();
        }
      }, 3000); // **YENİ**: 2 saniye yerine 3 saniye bekle
      return () => clearTimeout(timeout);
    }
  }, [pastConversations.length, showBuddyQuestion, isRecording, isProcessingResponse, runBuddyPrompt, isUserQuestionMode, buddyCyclePaused, waitingForUserResponse, initialQuestionAsked, conversationHistory.length]);
  // 4. Buddy sorusu geldikten sonra delay_seconds kadar bekleyip ekrana göster
  const delayTimeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);
  
  React.useEffect(() => {
    if (buddyResponse && typeof buddyResponse.delay_seconds === "number" && !isUserQuestionMode && !buddyCyclePaused) {
      // Eğer önceki bir timeout varsa temizle
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
      }
      setShowBuddyQuestion(false);
      delayTimeoutRef.current = setTimeout(() => {
        console.log("🔄 Buddy soru soruyor - kafa engaged durumuna geçiyor");
        setHeadTurn(0); // Kullanıcıya dön
        setHeadTurnState('engaged'); // Kullanıcıya bak
        setShowBuddyQuestion(true);
        // **DÜZELTME**: Sadece normal buddy soruları için chat'e ekle (kullanıcı soru modunda değilse)
        if (buddyResponse.target_question_number !== "kullanici_sorusu" &&
          buddyResponse.target_question_number !== "devam") {
          addChatMessage('ai', buddyResponse.ai_question);
          setWaitingForUserResponse(true); // Kullanıcı yanıtı bekle
        }
        // **DÜZELTME**: AI soru sorduktan sonra flag'i sıfırla ki aynı anda yeni soru sorulmasın
        shouldAskNewQuestionRef.current = false;
      }, buddyResponse.delay_seconds * 1000);
    } else if (buddyResponse && isUserQuestionMode) {
      // Kullanıcı soru modundaysa delay olmadan direkt göster
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
    // **DÜZELTME**: Mikrofon kullanırken yeni soru gelmesin diye flag'i sıfırla
    shouldAskNewQuestionRef.current = false;
    // **DÜZELTME**: Eski buddy response'u temizle ki aynı soru tekrar okunmasın
    setBuddyResponse(null);
    setShowBuddyQuestion(false);
    // **YENİ**: Kafa çevirme durumunu güncelle - kullanıcıyı dinlemeye başla
    setHeadTurnState('engaged');
    setHeadTurn(0); // Kullanıcıya dön
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
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
      setIsRecording(true); // ⚡ Sadece kayıt gerçekten başladıktan sonra
      // 5 saniye sonra kaydı durdur
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
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
    // **YENİ**: Kafa çevirme durumunu güncelle - yanıt vermeye başla
    console.log("🔄 Kullanıcı yanıt veriyor - kafa engaged durumuna geçiyor");
    setHeadTurnState('engaged');
    setHeadTurn(getHeadTurnForCamera(camera)); // Kullanıcının pozisyonuna göre dön
    try {
      const { userText, aiResponse } = await AIService.processAudioResponse(audioBlob, conversationHistory, questionsJson, ragContext || undefined);
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
      if (aiResponse) {
        // AI yanıtını conversation history'ye ekle
        const updatedHistory = [...newHistory];
        // Eğer son entry'nin USER'ı boşsa, AI yanıtını oraya ekle
        if (updatedHistory.length > 0 && updatedHistory[updatedHistory.length - 1].USER === "") {
          updatedHistory[updatedHistory.length - 1].AI = aiResponse.ai_response_text;
        } else {
          // Yeni bir entry ekle
          updatedHistory.push({
            AI: aiResponse.ai_response_text,
            USER: ""
          });
        }
        setConversationHistory(updatedHistory);
        // AI yanıtını göster
        setTimeout(() => {
          setShowBuddyQuestion(true);
          // **DÜZELTME**: Normal konuşmada da TTS'i hemen başlat (pomodoro TTS yoksa)
          if (!isPlayingPomodoroTTS) {
            playTTSImmediately(aiResponse.ai_response_text);
          }
          // **YENİ**: AI yanıtını chat'e ekle
          addChatMessage('ai', aiResponse.ai_response_text);
          setBuddyResponse({
            delay_seconds: 0,
            target_question_number: "devam",
            ai_question: aiResponse.ai_response_text
          });
          // Eğer konuşma bittiyse, konuşmayı özetle ve normal çalışma moduna dön
          if (aiResponse.is_conversation_over) {
            // Konuşmayı özetle
            summarizeConversation(updatedHistory);
            // **DÜZELTME**: Konuşma bitiminde daha uzun süre bekle (metin uzunluğuna göre)
            const finalDisplayDuration = Math.max(8000, aiResponse.ai_response_text.length * 80); // Minimum 8 saniye
            setTimeout(() => {
              setShowBuddyQuestion(false);
              // **YENİ**: Konuşma bittiğinde idle durumuna dön
              console.log("🔄 Konuşma bitti - kafa idle durumuna geçiyor");
              setHeadTurnState('idle');
              setHeadTurn(0); // Bilgisayara dön
              shouldAskNewQuestionRef.current = true; // Flag'i set et
              // **DÜZELTME**: Normal conversation bitiminde backup buddy cycle tetikleyicisi
              setTimeout(() => {
                if (initialQuestionAsked && !showBuddyQuestion && !isRecording && !isProcessingResponse &&
                  !isUserQuestionMode && !buddyCyclePaused && !waitingForUserResponse &&
                  shouldAskNewQuestionRef.current === true) { // **YENİ**: Flag kontrolü eklendi
                  shouldAskNewQuestionRef.current = false; // Flag'i kullan ve sıfırla
                  runBuddyPrompt();
                }
              }, 15000); // **DÜZELTME**: 5 saniye yerine 15 saniye bekle
            }, finalDisplayDuration); // Dinamik süre - minimum 8 saniye
          } else {
            // **YENİ**: Konuşma devam ediyor, kullanıcıya bakmaya devam et
            // Konuşma devam ediyorsa timeout yok, kullanıcıya bakmaya devam eder
          }
        }, 3000);
      } else {
        // Parse edilemezse basit yanıt göster
        setTimeout(() => {
          setShowBuddyQuestion(true);
          // **DÜZELTME**: Parse hatası durumunda da TTS'i hemen başlat (pomodoro TTS yoksa)
          const errorMessage = "Anlayamadım, tekrar söyler misin?";
          if (!isPlayingPomodoroTTS) {
            playTTSImmediately(errorMessage);
          }
          // **YENİ**: Parse hatası mesajını chat'e ekle (duplicate kontrolü ile)
          addChatMessage('ai', errorMessage);
          setBuddyResponse({
            delay_seconds: 0,
            target_question_number: "devam",
            ai_question: errorMessage
          });
          // **DÜZELTME**: Parse hatası durumunda da daha uzun süre göster
          setTimeout(() => {
            setShowBuddyQuestion(false);
            // **YENİ**: Parse hatası bitiminde idle durumuna dön
            setHeadTurnState('idle');
            setHeadTurn(0); // Bilgisayara dön
            shouldAskNewQuestionRef.current = true;
            // **DÜZELTME**: Parse hatası bitiminde backup buddy cycle tetikleyicisi
            setTimeout(() => {
              if (initialQuestionAsked && !showBuddyQuestion && !isRecording && !isProcessingResponse &&
                !isUserQuestionMode && !buddyCyclePaused && !waitingForUserResponse &&
                shouldAskNewQuestionRef.current === true) { // **YENİ**: Flag kontrolü eklendi
                shouldAskNewQuestionRef.current = false; // Flag'i kullan ve sıfırla
                runBuddyPrompt();
              }
            }, 15000); // **DÜZELTME**: 5 saniye yerine 15 saniye bekle
          }, 6000); // 6 saniye göster
        }, 3000);
      }
    } catch (error) {
      console.error('Ses işleme hatası:', error);
    } finally {
      setIsProcessingResponse(false);
    }
  };
  // **DÜZELTME**: Normal buddy soruları için TTS (sadece delay ile gelen sorular, duplicate kontrolü ile)
  React.useEffect(() => {
    // Sadece normal buddy cycle'dan gelen sorular için (kullanıcı sorusu yanıtları değil)
    if (buddyResponse && buddyResponse.ai_question &&
      buddyResponse.target_question_number !== "kullanici_sorusu" &&
      buddyResponse.target_question_number !== "devam" &&
      showBuddyQuestion &&
      lastTTSQuestionRef.current !== buddyResponse.ai_question && // Duplicate kontrolü
      lastShownQuestionRef.current !== buddyResponse.ai_question && // **YENİ**: Gösterilen soru kontrolü
      !isPlayingPomodoroTTS) { // Pomodoro TTS çalarken normal TTS'i blokla
      lastTTSQuestionRef.current = buddyResponse.ai_question; // Son soruyu kaydet
      lastShownQuestionRef.current = buddyResponse.ai_question; // **YENİ**: Gösterilen soruyu kaydet
      playTTSImmediately(buddyResponse.ai_question);
      // **NOT**: Chat'e ekleme delay effect'inde yapılıyor, duplicate önlemek için burada kaldırıldı
    } else if (isPlayingPomodoroTTS) {
      // Pomodoro TTS çalıyor, başka işlem yapma
    } else if (buddyResponse && buddyResponse.ai_question && lastShownQuestionRef.current === buddyResponse.ai_question) {
      // **YENİ**: Duplicate soru tespit edildiğinde buddyResponse'u temizle
      setBuddyResponse(null);
      setShowBuddyQuestion(false);
    }
  }, [buddyResponse, showBuddyQuestion, addChatMessage, isPlayingPomodoroTTS]);
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
  const userMediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const userStreamRef = React.useRef<MediaStream | null>(null);
  // **DÜZELTME**: userAudioChunks'ı ref olarak yönet (scope problemi önlenir)
  const userAudioChunksRef = React.useRef<Blob[]>([]);
  // **YENİ**: İptal durumunu ref ile takip et (state güncelleme gecikmesi sorunu için)
  const userRecordingCancelledRef = React.useRef(false);
  // Mikrofonu başlat
  const startUserRecording = async () => {
    // **YENİ**: Mikrofon activity'sini güncelle
    setLastMicrophoneActivity(Date.now());
    // **DÜZELTME**: Kullanıcı mikrofon kullanırken yeni soru gelmesin diye flag'i sıfırla
    shouldAskNewQuestionRef.current = false;
    // **YENİ**: Kullanıcı soru modunu başlat ve normal buddy cycle'ı durdur
    setIsUserQuestionMode(true);
    setBuddyCyclePaused(true);
    // Mevcut delay'leri temizle
    if (delayTimeoutRef.current) clearTimeout(delayTimeoutRef.current);
    // **DÜZELTME**: Eski buddy response'u temizle ki aynı soru tekrar okunmasın
    setBuddyResponse(null);
    // UI state'lerini sıfırla (recording state HARİÇ - o MediaRecorder hazır olunca set edilecek)
    setShowBuddyQuestion(false);
    setIsProcessingResponse(false);
    userRecordingCancelledRef.current = false; // Ref'i sıfırla
    // **YENİ**: Kafa çevirme durumunu güncelle - kullanıcıyı dinlemeye başla
    console.log("🔄 Kullanıcı mikrofon başlattı - kafa engaged durumuna geçiyor");
    setHeadTurnState('engaged');
    setHeadTurn(getHeadTurnForCamera(camera)); // Kullanıcının pozisyonuna göre dön
    // **DÜZELTME**: Audio chunks'ı temizle
    userAudioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      userStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      userMediaRecorderRef.current = mediaRecorder;
      // **DÜZELTME**: Event listener'ları hazırla
      mediaRecorder.ondataavailable = (event) => {
        userAudioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = async () => {
        if (userRecordingCancelledRef.current) {
          setUserRecording(false);
          userRecordingCancelledRef.current = false; // Ref'i temizle
          userStreamRef.current?.getTracks().forEach(track => track.stop());
          return;
        }
        const audioBlob = new Blob(userAudioChunksRef.current, { type: 'audio/wav' });
        await processUserQuestionAudio(audioBlob);
        setUserRecording(false);
        userStreamRef.current?.getTracks().forEach(track => track.stop());
        // setHeadTurn(getHeadTurnForCamera(camera)); // KALDIRILDI: Buddy kullanıcıya bakmaya devam etmeli
      };
      mediaRecorder.onerror = (event) => {
        console.error("❌ MediaRecorder hatası:", event);
        setUserRecording(false);
        userRecordingCancelledRef.current = false;
        userStreamRef.current?.getTracks().forEach(track => track.stop());
      };
      // **DÜZELTME**: MediaRecorder başlatıldıktan SONRA UI state'i güncelle
      // timeslice ile düzenli data gönderimi (1 saniyede bir)
      mediaRecorder.start(1000);
      setUserRecording(true); // ⚡ Sadece kayıt gerçekten başladıktan sonra
    } catch (error) {
      console.error('❌ Mikrofon erişimi hatası:', error);
      // **DÜZELTME**: Hata durumunda state'leri temizle
      setUserRecording(false);
      userRecordingCancelledRef.current = false;
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
    userRecordingCancelledRef.current = true; // Ref'i güncelle
    // MediaRecorder'ı durdur
    if (userMediaRecorderRef.current && userMediaRecorderRef.current.state === 'recording') {
      userMediaRecorderRef.current.stop();
    }
    // Stream'i hemen durdur
    if (userStreamRef.current) {
      userStreamRef.current.getTracks().forEach(track => track.stop());
    }
    // UI state'lerini temizle
    setUserRecording(false);
    // **YENİ**: İptal edildiğinde idle durumuna dön
    console.log("🔄 Kullanıcı mikrofon iptal etti - kafa idle durumuna geçiyor");
    setHeadTurnState('idle');
    setHeadTurn(0); // Bilgisayara dön
    // **DÜZELTME**: Eski buddy response'u temizle ki aynı soru tekrar okunmasın
    setBuddyResponse(null);
    // **YENİ**: İptal edildiğinde normal moda dön
    setIsUserQuestionMode(false);
    setBuddyCyclePaused(false);
    // Audio chunks'ı temizle
    userAudioChunksRef.current = [];
  };
  // Kullanıcı sorusu için özel prompt ile AI'ya istek at
  const processUserQuestionAudio = async (audioBlob: Blob) => {
    // İptal edilmişse hiçbir işlem yapma
    if (userRecordingCancelledRef.current) {
      setIsProcessingResponse(false);
      return;
    }
    setIsProcessingResponse(true);
    setWaitingForUserResponse(false); // Kullanıcı soru modu da yanıt sayılır
    // **YENİ**: Kafa çevirme durumunu güncelle - yanıt vermeye başla
    console.log("🔄 Kullanıcı sorusu işleniyor - kafa engaged durumuna geçiyor");
    setHeadTurnState('engaged');
    setHeadTurn(getHeadTurnForCamera(camera)); // Kullanıcının pozisyonuna göre dön
    try {
      const { userText, aiResponse } = await AIService.processUserQuestionAudio(audioBlob, conversationHistory, questionsJson, ragContext || undefined);
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
      if (aiResponse) {
        // **DÜZELTME**: TTS'i paralel olarak hemen başlat (gecikme olmadan, pomodoro TTS yoksa)
        if (!isPlayingPomodoroTTS) {
          playTTSImmediately(aiResponse.ai_response_text);
        }
        // **YENİ**: AI yanıtını chat'e ekle (kullanıcı sorusu yanıtı)
        addChatMessage('ai', aiResponse.ai_response_text);
        setBuddyResponse({
          delay_seconds: 0,
          target_question_number: "kullanici_sorusu",
          ai_question: aiResponse.ai_response_text
        });
        setShowBuddyQuestion(true);
        setIsProcessingResponse(false);
        // **DÜZELTME**: AI cevabını conversation history'ye ekle
        const updatedHistory = [...conversationHistory];
        if (updatedHistory.length > 0 && updatedHistory[updatedHistory.length - 1].AI === "") {
          updatedHistory[updatedHistory.length - 1].AI = aiResponse.ai_response_text;
        } else {
          updatedHistory.push({
            AI: aiResponse.ai_response_text,
            USER: ""
          });
        }
        setConversationHistory(updatedHistory);
        // **YENİ**: Konuşma bittiğinde buddy'yi bilgisayara döndür
        if (aiResponse.is_conversation_over) {
          console.log("🔄 Kullanıcı sorusu konuşması bitti - kafa idle durumuna geçiyor");
          setTimeout(() => {
            setHeadTurnState('idle');
            setHeadTurn(0); // Bilgisayara dön
          }, 3000); // 3 saniye sonra bilgisayara dön
        }
        // **YENİ**: Kullanıcı sorusu cevaplandıktan sonra normal buddy cycle'ı yeniden başlat
        setTimeout(() => {
          setBuddyCyclePaused(false);
          shouldAskNewQuestionRef.current = true;
        }, 3000); // 3 saniye sonra normal cycle'a dön
      }
    } catch (err) {
      setIsProcessingResponse(false);
      setShowBuddyQuestion(false);
      setIsUserQuestionMode(false);
      setBuddyCyclePaused(false);
      // **YENİ**: Hata durumunda idle durumuna dön
      setHeadTurnState('idle');
      setHeadTurn(0); // Bilgisayara dön
      // **DÜZELTME**: Hata durumunda da buddy response'u temizle
      setBuddyResponse(null);
      console.error("Kullanıcı sorusu işlenirken hata:", err);
    }
  };
  // **YENİ**: Kafa çevirme durumunu takip eden effect
  React.useEffect(() => {
    console.log("🔄 Head turn state değişti:", headTurnState);
    if (headTurnState === 'idle') {
      console.log("🔄 Idle durumu - kafa bilgisayara döndürülüyor, animasyon başlatılıyor");
      setHeadTurn(0); // Bilgisayara bak
    } else if (headTurnState === 'engaged') {
      console.log("🔄 Engaged durumu - kafa kullanıcıya döndürülüyor, animasyon duraklatılıyor");
      // Kullanıcının pozisyonuna göre kafa döndür
      const userHeadTurn = getHeadTurnForCamera(camera);
      console.log("🔄 Kullanıcı pozisyonu:", camera, "Kafa açısı:", userHeadTurn);
      setHeadTurn(userHeadTurn);
    }
  }, [headTurnState, camera]);
  // **YENİ**: Inactivity timer - 1 dakika mikrofon kullanılmazsa soru sor
  React.useEffect(() => {
    const startInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = setInterval(() => {
        const timeSinceLastActivity = Date.now() - lastMicrophoneActivity;
        const oneMinute = 60 * 1000; // 60 saniye
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
  // **YENİ**: Music player minimize durumu
  const [isMusicPlayerMinimized, setIsMusicPlayerMinimized] = React.useState(false);
  // Music Player hook'u
  const { handleMusicPlayerMinimizeChange } = useMusicPlayer(setIsMusicPlayerMinimized);
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
              width: '90%', /* Genişliği %90 yap */
              maxWidth: '800px', /* Maksimum genişlik belirle */
              height: 'auto', /* Yüksekliği otomatik yap */
              aspectRatio: '16/9', /* En boy oranını koru */
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
                  objectFit: 'contain' /* 'cover' yerine 'contain' kullan */
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
      <ChatPanel
        isChatPanelOpen={isChatPanelOpen}
        setIsChatPanelOpen={setIsChatPanelOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        chatMessages={chatMessages}
        chatMessagesEndRef={chatMessagesEndRef}
        isRecording={isRecording}
        userRecording={userRecording}
        isProcessingResponse={isProcessingResponse}
        isMusicPlayerMinimized={isMusicPlayerMinimized}
        earnedBadges={earnedBadges}
        setShowProfile={setShowProfile}
      />
      {/* Mikrofon butonu */}
      {showBuddyQuestion && buddyResponse && !isRecording && !isProcessingResponse && (
        <button
          onClick={startRecording}
          style={{
            position: "absolute",
            bottom: isMusicPlayerMinimized ? 60 : 140, // **YENİ**: Music player minimize durumuna göre pozisyon
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1100, // Müzik çaların üstünde
            width: 80,
            height: 80,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)",
            cursor: "pointer",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s ease",
            overflow: "hidden"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.8)";
            e.currentTarget.style.transform = "translateX(-50%) scale(1.1)";
            e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.6)";
            e.currentTarget.style.transform = "translateX(-50%) scale(1)";
            e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)";
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
          bottom: isMusicPlayerMinimized ? 60 : 140, // **YENİ**: Music player minimize durumuna göre pozisyon
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1100, // Müzik çaların üstünde
          background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(8px)",
          color: "#fff",
          borderRadius: 16,
          padding: "12px 24px",
          fontSize: 16,
          fontWeight: 600,
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.2)",
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
            bottom: isMusicPlayerMinimized ? 60 : 140, // **YENİ**: Music player minimize durumuna göre pozisyon
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1100, // Müzik çaların üstünde
            width: 80,
            height: 80,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)",
            cursor: "pointer",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s ease",
            overflow: "hidden"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.8)";
            e.currentTarget.style.transform = "translateX(-50%) scale(1.1)";
            e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.6)";
            e.currentTarget.style.transform = "translateX(-50%) scale(1)";
            e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)";
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
            bottom: isMusicPlayerMinimized ? 150 : 230, // **YENİ**: Music player minimize durumuna göre pozisyon
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1100, // Müzik çaların üstünde
            padding: "12px 32px",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)",
            color: "#fff",
            fontWeight: 600,
            fontSize: 18,
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
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
        {/* **YENİ**: Çalışma Materyali - Bilgisayar ekranında göster */}
        {sessionStarted && sceneReady && firstMaterial && (
          <StudyMaterial
            materialData={firstMaterial}
            position={[4.1, -0.4, 3.7]} // Buddy'nin önünde, biraz yukarıda
            rotation={[0.1, 0, 0]} // Düz bakış
            distanceFactor={1.9} // **YENİ**: Distance factor - materyalin boyutunu ayarla
          />
        )}
        {/* Pomodoro Timer'ı 3D sahnede, pencerenin solundaki duvara yakın bir pozisyona yerleştiriyoruz */}
        {sessionStarted && sceneReady && (
          <Html
            position={[4, 2.8, 2.3]}
            rotation={[0, -Math.PI / 2, 0]}
            transform
            distanceFactor={2.4}
            style={{ pointerEvents: 'auto' }}
          >
            <PomodoroTimer
              studyDuration={studyDuration}
              breakDuration={breakDuration}
              isBreakTime={isBreakTime}
              onModeChange={handlePomodoroModeChange}
              onBreakStart={handleBreakStart}
              onStudyStart={handleStudyStart}
              isActive={pomodoroActive}
            />
          </Html>
        )}
      </Canvas>
      {/* Müzik Çalar - Session başladığında ve sahne yüklendiğinde göster */}
      {sessionStarted && sceneReady && (
        <MusicPlayer
          playlistId="PLkDQC8YWp9j3jNgtgDZ2rIqaVNO4LyQZV"
          onMinimizeChange={handleMusicPlayerMinimizeChange}
        />
      )}
      {/* Profile Modal */}
      {showProfile && (
        <Profile onClose={() => setShowProfile(false)} />
      )}
      
      {/* **TEST**: Rozet test butonu (sadece development için) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 1300,
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        }}>
          <button
            onClick={() => {
              setEarnedBadges(prev => Math.min(prev + 1, 11));
              addNotification("Test rozeti kazanıldı!", 'success');
            }}
            style={{
              padding: "8px 16px",
              background: "#7c3aed",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600
            }}
          >
            Test Rozet (+1)
          </button>
          
          <button
            onClick={() => addNotification("Bu bir test bildirimidir!", 'info')}
            style={{
              padding: "8px 16px",
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600
            }}
          >
            Test Bildirim
          </button>
        </div>
      )}
      
      {/* **YENİ**: Bildirimler */}
      {notifications.map((notification, index) => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => removeNotification(notification.id)}
          top={20 + index * 100}
        />
      ))}
    </>
  );
}
// Authentication Pages Component
const AuthPages: React.FC = () => {
  const [isLogin, setIsLogin] = React.useState(true)
  const handleSwitchToRegister = () => setIsLogin(false)
  const handleSwitchToLogin = () => setIsLogin(true)
  const handleRegisterSuccess = () => setIsLogin(true)
  if (isLogin) {
    return <Login onSwitchToRegister={handleSwitchToRegister} />
  } else {
    return (
      <Register
        onSwitchToLogin={handleSwitchToLogin}
        onRegisterSuccess={handleRegisterSuccess}
      />
    )
  }
}
// Loading Component
const LoadingScreen: React.FC = () => (
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
    fontWeight: 600
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
      <div className="lobby-avatar lobby-avatar-glow" style={{ width: 120, height: 120, marginBottom: 32 }}>
        <img src="/assets/character_smiling.png" alt="AI Buddy" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", objectPosition: "center 40%" }} />
      </div>
      <div style={{ marginBottom: 18 }}>AI Buddy Yükleniyor...</div>
      <div className="lobby-loading-spinner" style={{ width: 48, height: 48, border: "5px solid #7c3aed", borderTop: "5px solid #23234a", borderRadius: "50%", animation: "spin 1.1s linear infinite" }} />
    </div>
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
)
// Main App Component with Authentication
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
// App Content with Auth Logic
const AppContent: React.FC = () => {
  const { user, loading } = useAuth()
  if (loading) {
    return <LoadingScreen />
  }
  if (!user) {
    return <AuthPages />
  }
  return <AuthenticatedApp />
}
export default App; 