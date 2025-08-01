import React, { useState } from "react";
import type { ChangeEvent } from "react";
import "./Lobby.css";
import { ragService, type RAGContext } from "../services/ragService";
import { useAuth } from "../contexts/AuthContext";
import { Profile } from "./Profile";

// Tüm metinler için Poppins fontunu uygula
// Ekstra className'ler ile spacing ve modern efektler için alan açıyorum

type LobbyProps = {
  handleSessionStart: (imageBase64: string, studyDuration: number, breakDuration: number, ragContext?: RAGContext) => void;
};

type FileData = {
  id: string;
  name: string;
  type: 'image' | 'pdf';
  data: string;
  size: number;
  file: File;
};

export const Lobby: React.FC<LobbyProps> = ({ handleSessionStart }) => {
  const [topic, setTopic] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [materialFiles, setMaterialFiles] = useState<FileData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [ragContext, setRagContext] = useState<RAGContext | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  
  // Pomodoro ayarları
  const [studyDuration, setStudyDuration] = useState(25); // Dakika
  const [breakDuration, setBreakDuration] = useState(5); // Dakika
  
  const { user } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTopic(e.target.value);
  };

  const handleClick = async () => {
    if (materialFiles.length > 0) {
      setIsProcessing(true);
      try {
        // RAG context'i oluştur
        const filesForRAG = materialFiles.map(file => ({
          file: file.file,
          data: file.data,
          type: file.type
        }));
        
        const context = await ragService.createRAGContext(filesForRAG);
        setRagContext(context);
        
        // İlk dosyayı kullan (görsel veya PDF)
        const firstFile = materialFiles[0];
        // PDF ise ilk sayfayı, görsel ise direkt kullan
        const imageData = firstFile.type === 'pdf' ? firstFile.data.split('|')[0] : firstFile.data;
        handleSessionStart(imageData, studyDuration, breakDuration, context);
      } catch (error) {
        console.error('Dosya işleme hatası:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // PDF'i görsel sayfalarına çevirme fonksiyonu
  const convertPdfToImages = async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          // PDF.js kullanarak PDF'i yükle
          // @ts-expect-error PDF.js global olarak tanımlı
          const pdfjsLib = window.pdfjsLib;
          if (!pdfjsLib) {
            throw new Error('PDF.js kütüphanesi yüklenemedi');
          }
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          
          const images: string[] = [];
          
          // Her sayfayı görsel olarak render et
          for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 50); pageNum++) { // Maksimum 50 sayfa
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.5 });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            const renderContext = {
              canvasContext: context!,
              viewport: viewport
            };
            
            await page.render(renderContext).promise;
            images.push(canvas.toDataURL('image/png'));
          }
          
          resolve(images);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsProcessing(true);
    
    try {
      const fileArr = Array.from(files);
      
      for (const file of fileArr) {
        // Dosya boyutu kontrolü (5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} dosyası 5MB'dan büyük. Lütfen daha küçük bir dosya seçin.`);
          continue;
        }

        const fileId = `${Date.now()}-${Math.random()}`;
        
        if (file.type.startsWith('image/')) {
          // Görsel dosyası
          const reader = new FileReader();
          reader.onload = (ev) => {
                         const fileData: FileData = {
               id: fileId,
               name: file.name,
               type: 'image',
               data: ev.target?.result as string,
               size: file.size,
               file: file
             };
            setMaterialFiles(prev => [...prev, fileData]);
          };
          reader.readAsDataURL(file);
        } else if (file.type === 'application/pdf') {
          // PDF dosyası
          try {
            const images = await convertPdfToImages(file);
            // PDF'in ilk sayfasını kullan
                         // PDF'in tüm sayfalarını kullan
             const fileData: FileData = {
               id: fileId,
               name: file.name,
               type: 'pdf',
               data: images.join('|'), // Tüm sayfaları | ile ayırarak sakla
               size: file.size,
               file: file
             };
            setMaterialFiles(prev => [...prev, fileData]);
          } catch (error) {
            console.error('PDF işleme hatası:', error);
            alert(`${file.name} PDF dosyası işlenirken hata oluştu.`);
          }
        } else {
          alert(`${file.name} desteklenmeyen dosya türü. Sadece görsel ve PDF dosyaları kabul edilir.`);
        }
      }
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setMaterialFiles(prev => prev.filter(file => file.id !== fileId));
  };

  return (
    <div className="lobby-container poppins-font" style={{
      height: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden',
      position: 'relative'
    }}>
      {/* Profile Button */}
      {user && (
        <button
          onClick={() => setShowProfile(true)}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            border: '2px solid rgba(124, 58, 237, 0.3)',
            background: 'rgba(124, 58, 237, 0.1)',
            backdropFilter: 'blur(8px)',
            color: '#7c3aed',
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            zIndex: 1000
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(124, 58, 237, 0.2)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(124, 58, 237, 0.1)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Profil"
        >
          👤
        </button>
      )}

      <img
        src="/assets/character_smiling.png"
        alt="Karakter"
        className="lobby-avatar lobby-avatar-glow"
      />
      <h1 className="lobby-title lobby-title-spacing">Bugün Neye Çalışıyoruz?</h1>
      <div className="lobby-input-floating-container">
        <input
          className="lobby-input lobby-input-spacing"
          type="text"
          id="study-topic-input"
          value={topic}
          onChange={handleInputChange}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          autoComplete="off"
        />
        <label
          htmlFor="study-topic-input"
          className={
            "lobby-input-label" +
            ((inputFocused || topic) ? " lobby-input-label--active" : "")
          }
        >
          Örn: Biyoloji - Hücreler
        </label>
      </div>
      
      {/* Pomodoro Ayarları */}
      <div style={{
        display: 'flex',
        gap: '20px',
        marginTop: '20px',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}>
          <label style={{
            color: '#7c3aed',
            fontSize: '14px',
            fontWeight: 600
          }}>
            🕒 Ders Süresi (dakika)
          </label>
          <input
            type="number"
            min="5"
            max="180"
            value={studyDuration}
            onChange={(e) => setStudyDuration(parseInt(e.target.value) || 25)}
            style={{
              width: '80px',
              padding: '8px 12px',
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              textAlign: 'center',
              fontSize: '16px',
              fontWeight: 600,
              outline: 'none',
              transition: 'border-color 0.2s ease',
              background: '#fff'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#7c3aed';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
            }}
          />
        </div>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}>
          <label style={{
            color: '#10b981',
            fontSize: '14px',
            fontWeight: 600
          }}>
            ☕ Mola Süresi (dakika)
          </label>
          <input
            type="number"
            min="1"
            max="60"
            value={breakDuration}
            onChange={(e) => setBreakDuration(parseInt(e.target.value) || 5)}
            style={{
              width: '80px',
              padding: '8px 12px',
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              textAlign: 'center',
              fontSize: '16px',
              fontWeight: 600,
              outline: 'none',
              transition: 'border-color 0.2s ease',
              background: '#fff'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#10b981';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
            }}
          />
        </div>
      </div>
      
      <div className="lobby-upload-container">
        <label className="lobby-upload-label">
          <input
            type="file"
            accept="image/*,.pdf"
            style={{ display: "none" }}
            onChange={handleFileChange}
            multiple
          />
          <span className="lobby-upload-btn">
            {isProcessing ? "İşleniyor..." : "Ders Materyali Yükle (Görsel/PDF)"}
          </span>
        </label>
        
        {/* Dosya boyutu bilgisi */}
        <div style={{
          color: '#a78bfa',
          fontSize: '12px',
          textAlign: 'center',
          marginTop: '8px'
        }}>
          📄 PDF dosyaları maksimum 5MB, görseller sınırsız
        </div>
        
        {/* RAG sistemi bilgisi */}
        <div style={{
          color: '#10b981',
          fontSize: '11px',
          textAlign: 'center',
          marginTop: '4px',
          background: 'rgba(16, 185, 129, 0.1)',
          padding: '4px 8px',
          borderRadius: '8px',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          🤖 RAG Sistemi Aktif - PDF'lerin tüm sayfaları işleniyor
        </div>
        
        {materialFiles.length > 0 && (
          <div className="lobby-upload-preview-multi">
            {materialFiles.map((file) => (
              <div className="lobby-upload-preview" key={file.id}>
                <img src={file.data} alt={file.name} />
                                 <div style={{
                   position: 'absolute',
                   bottom: '4px',
                   left: '4px',
                   background: file.type === 'pdf' ? '#ef4444' : '#10b981',
                   color: '#fff',
                   fontSize: '10px',
                   padding: '2px 6px',
                   borderRadius: '8px',
                   fontWeight: 600
                 }}>
                   {file.type === 'pdf' ? `PDF (${file.data.split('|').length} sayfa)` : 'IMG'}
                 </div>
                <button
                  className="lobby-upload-remove"
                  type="button"
                  onClick={() => handleRemoveFile(file.id)}
                  aria-label="Dosyayı Kaldır"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <button
        className="lobby-button lobby-button-glow"
        disabled={!topic.trim() || materialFiles.length === 0 || isProcessing}
        onClick={handleClick}
        type="button"
      >
        {isProcessing ? "İşleniyor..." : "Haydi Başlayalım!"}
      </button>

      {/* Profile Modal */}
      {showProfile && (
        <Profile onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
}; 