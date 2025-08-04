import React, { useState } from "react";
import type { ChangeEvent } from "react";
import "./Lobby.css";
import { ragService, type RAGContext } from "../services/ragService";
import { useAuth } from "../contexts/AuthContext";
import { Profile } from "./Profile";

// Tüm metinler için Poppins fontunu uygula
// Ekstra className'ler ile spacing ve modern efektler için alan açıyorum

type LobbyProps = {
  handleSessionStart: (imageBase64: string, studyDuration: number, breakDuration: number, ragContext?: RAGContext, selectedCharacter?: number) => void;
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
  
  // **YENİ**: Karakter seçim sistemi
  const [selectedCharacter, setSelectedCharacter] = useState(0); // Default: ilk karakter (buddy)
  
  // Karakter listesi
  const characters = [
    { id: 0, name: "AI Buddy", image: "/assets/character_smiling.png", color: "#7c3aed" },
    { id: 1, name: "Office 1", image: "/characters/office2.png", color: "#3b82f6" },
    { id: 2, name: "Office 2", image: "/characters/office3.png", color: "#10b981" },
    { id: 3, name: "Office 3", image: "/characters/office4.png", color: "#f59e0b" }
  ];
  
  const { user } = useAuth();

  // **YENİ**: Klavye navigasyonu
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        setSelectedCharacter(prev => prev === 0 ? characters.length - 1 : prev - 1);
      } else if (event.key === 'ArrowRight') {
        setSelectedCharacter(prev => prev === characters.length - 1 ? 0 : prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [characters.length]);

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
        handleSessionStart(imageData, studyDuration, breakDuration, context, selectedCharacter);
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

      {/* **YENİ**: Karakter seçim sistemi - Carousel tarzında */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '0px',
        marginTop: '10px',
        gap: '15px',
        flexDirection: 'row',
        minHeight: '250px'
      }}>
        {/* Sol Ok Butonu */}
        <button
          onClick={() => setSelectedCharacter(prev => prev === 0 ? characters.length - 1 : prev - 1)}
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.2)',
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            fontSize: '18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2), 0 0 20px rgba(124, 58, 237, 0.3)',
            fontWeight: 'bold',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.background = 'rgba(0,0,0,0.5)';
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.3), 0 0 30px rgba(124, 58, 237, 0.5)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.background = 'rgba(0,0,0,0.3)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2), 0 0 20px rgba(124, 58, 237, 0.3)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
          }}
          title="Önceki karakter (←)"
        >
          ◀
        </button>

        {/* Karakter Carousel */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '400px',
          height: '250px',
          overflow: 'hidden',
          perspective: '1000px',
          transformStyle: 'preserve-3d'
        }}>
          {characters.map((char, index) => {
            // Seçili karakterin pozisyonunu hesapla
            const isSelected = index === selectedCharacter;
            
            // Boyut hesaplaması (silindir döndürme için)
            const size = 140; // Sabit boyut, scale ile kontrol ediliyor

            // Karakter pozisyonunu hesapla (silindir etrafında)
            const totalCharacters = characters.length;
            const position = index - selectedCharacter;
            
            // Silindir döndürme mantığı - 3D rotasyon efekti
            const radius = 180; // Silindir yarıçapı (daha büyük)
            const angleStep = (2 * Math.PI) / totalCharacters; // Her karakter arası açı
            const currentAngle = position * angleStep; // Mevcut karakterin açısı
            
            // 3D pozisyon hesaplama (silindir etrafında)
            const translateX = radius * Math.sin(currentAngle);
            const translateZ = radius * Math.cos(currentAngle) - radius; // Z ekseni derinlik için
            
            // Silindir döndürme animasyonu için transform hesaplaması
            let cylinderTransform = '';
            let cylinderOpacity = 1;
            
            if (isSelected) {
              // Seçili karakter - daha büyük, tam opacity, en önde
              cylinderTransform = 'scale(1.2) translateZ(50px)';
              cylinderOpacity = 1;
            } else if (Math.abs(position) === 1) {
              // Yanındaki karakterler - orta boyut, yarı opacity, arkada
              cylinderTransform = 'scale(0.7) translateZ(-50px)';
              cylinderOpacity = 0.5;
            } else {
              // Diğer karakterler - küçük boyut, düşük opacity, en arkada
              cylinderTransform = 'scale(0.5) translateZ(-100px)';
              cylinderOpacity = 0.2;
            }
            
            return (
              <div
                key={char.id}
                style={{
                  position: 'absolute',
                  display: translateX === undefined ? 'none' : 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  opacity: cylinderOpacity,
                  transform: `translateX(${translateX}px) translateZ(${translateZ}px) ${cylinderTransform}`,
                  cursor: 'pointer',
                  zIndex: isSelected ? 5 : 1,
                  left: '50%',
                  marginLeft: isSelected ? '-84px' : '-50px', // Seçili karakter için daha büyük margin (1.2x scale için)
                  animation: isSelected ? 'float 3.5s ease-in-out infinite' : 'none'
                }}
                onClick={() => setSelectedCharacter(index)}
              >
                <img
                  src={char.image}
                  alt={char.name}
                  className={isSelected ? "lobby-avatar lobby-avatar-glow" : ""}
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: isSelected 
                      ? `3px solid ${char.color}44` 
                      : '2px solid rgba(255,255,255,0.1)',
                    boxShadow: isSelected 
                      ? `0 0 30px ${char.color}44, 0 8px 32px rgba(0,0,0,0.3)` 
                      : '0 2px 12px rgba(0,0,0,0.1)',
                    transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    filter: isSelected ? 'none' : 'grayscale(0.3)'
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div style={{
                  fontSize: isSelected ? '14px' : '11px',
                  color: char.color,
                  fontWeight: isSelected ? 700 : 500,
                  textAlign: 'center',
                  background: isSelected 
                    ? `${char.color}22` 
                    : 'rgba(255,255,255,0.05)',
                  padding: isSelected ? '6px 16px' : '4px 12px',
                  borderRadius: '12px',
                  backdropFilter: 'blur(8px)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                  transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  border: isSelected 
                    ? `1px solid ${char.color}44` 
                    : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: isSelected 
                    ? `0 2px 8px ${char.color}22` 
                    : 'none'
                }}>
                  {char.name}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sağ Ok Butonu */}
        <button
          onClick={() => setSelectedCharacter(prev => prev === characters.length - 1 ? 0 : prev + 1)}
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.2)',
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            fontSize: '18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2), 0 0 20px rgba(124, 58, 237, 0.3)',
            fontWeight: 'bold',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.background = 'rgba(0,0,0,0.5)';
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.3), 0 0 30px rgba(124, 58, 237, 0.5)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.background = 'rgba(0,0,0,0.3)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2), 0 0 20px rgba(124, 58, 237, 0.3)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
          }}
          title="Sonraki karakter (→)"
        >
          ▶
        </button>
      </div>
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
        background: 'rgba(167, 139, 250, 0.05)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid rgba(167, 139, 250, 0.1)',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {/* Ders Süresi */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <label style={{
              color: '#a78bfa',
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: 'Poppins, Arial, Helvetica, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              🕰️ Ders Süresi (dakika)
            </label>
            <input
              type="number"
              min="5"
              max="180"
              value={studyDuration}
              onChange={(e) => setStudyDuration(parseInt(e.target.value) || 25)}
              style={{
                width: '120px',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(167, 139, 250, 0.3)',
                textAlign: 'center',
                fontSize: '18px',
                fontWeight: '600',
                outline: 'none',
                transition: 'all 0.3s ease',
                background: '#23234a',
                color: '#fff',
                fontFamily: 'Poppins, Arial, Helvetica, sans-serif',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#7c3aed';
                e.target.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(167, 139, 250, 0.3)';
                e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
              }}
            />
          </div>
          
          {/* Mola Süresi */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <label style={{
              color: '#a78bfa',
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: 'Poppins, Arial, Helvetica, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
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
                width: '120px',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(167, 139, 250, 0.3)',
                textAlign: 'center',
                fontSize: '18px',
                fontWeight: '600',
                outline: 'none',
                transition: 'all 0.3s ease',
                background: '#23234a',
                color: '#fff',
                fontFamily: 'Poppins, Arial, Helvetica, sans-serif',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#10b981';
                e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(167, 139, 250, 0.3)';
                e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Materyal Yükleme Alanı */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '20px',
        gap: '16px'
      }}>
        {/* Başlık */}
        <h2 style={{
          color: '#fff',
          fontSize: '1.5rem',
          fontWeight: '700',
          margin: '0',
          textAlign: 'center',
          fontFamily: 'Poppins, Arial, Helvetica, sans-serif'
        }}>
          Ders Materyali Yükle
        </h2>
        
        {/* Alt başlık */}
        <p style={{
          color: '#a78bfa',
          fontSize: '0.9rem',
          margin: '0',
          textAlign: 'center',
          fontFamily: 'Poppins, Arial, Helvetica, sans-serif'
        }}>
          Görsel veya PDF dosyası ekle
        </p>
        
        {/* Dosya Yükleme Alanı */}
        <label 
          className="lobby-upload-label"
          style={{
            width: '100%',
            maxWidth: '400px',
            cursor: 'pointer'
          }}
        >
          <input
            type="file"
            accept="image/*,.pdf"
            style={{ display: "none" }}
            onChange={handleFileChange}
            multiple
          />
          <div style={{
            border: '2px dashed #a78bfa',
            borderRadius: '12px',
            padding: '16px 20px',
            background: 'rgba(167, 139, 250, 0.05)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            minHeight: '60px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#7c3aed';
            e.currentTarget.style.background = 'rgba(167, 139, 250, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#a78bfa';
            e.currentTarget.style.background = 'rgba(167, 139, 250, 0.05)';
          }}
          >
            {/* Klasör İkonu */}
            <div style={{
              fontSize: '2rem',
              color: '#a78bfa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              📁
            </div>
            
            {/* Yazılar */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              {/* Ana Talimat */}
              <div style={{
                color: '#fff',
                fontSize: '1rem',
                fontWeight: '600',
                fontFamily: 'Poppins, Arial, Helvetica, sans-serif'
              }}>
                {isProcessing ? "İşleniyor..." : "Dosya Seç veya Sürükle"}
              </div>
              
              {/* Dosya Türü Bilgisi */}
              <div style={{
                color: '#a78bfa',
                fontSize: '0.8rem',
                fontFamily: 'Poppins, Arial, Helvetica, sans-serif'
              }}>
                PDF (max 5MB) veya Görsel dosyaları
              </div>
            </div>
          </div>
        </label>
        
        {/* Dosya Önizlemeleri */}
        {materialFiles.length > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginTop: '16px',
            maxWidth: '400px',
            width: '100%'
          }}>
            {materialFiles.map((file) => (
              <div 
                key={file.id}
                style={{
                  position: 'relative',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  background: '#23234a',
                  border: '1px solid rgba(167, 139, 250, 0.2)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  gap: '12px',
                  minHeight: '60px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                  e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                  e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.2)';
                }}
              >
                {/* Dosya İkonu */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: file.type === 'pdf' ? '#ef4444' : '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <span style={{
                    fontSize: '20px',
                    color: '#fff'
                  }}>
                    {file.type === 'pdf' ? '📄' : '🖼️'}
                  </span>
                </div>
                
                {/* Dosya Bilgileri */}
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  minWidth: 0
                }}>
                  {/* Dosya Adı */}
                  <div style={{
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '600',
                    fontFamily: 'Poppins, Arial, Helvetica, sans-serif',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {file.name}
                  </div>
                  
                  {/* Dosya Türü ve Boyut */}
                  <div style={{
                    color: '#a78bfa',
                    fontSize: '12px',
                    fontFamily: 'Poppins, Arial, Helvetica, sans-serif',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      background: file.type === 'pdf' ? '#ef4444' : '#10b981',
                      color: '#fff',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '600'
                    }}>
                      {file.type === 'pdf' ? `PDF (${file.data.split('|').length} sayfa)` : 'IMG'}
                    </span>
                    <span>
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                </div>
                
                {/* Kaldır Butonu */}
                <button
                  type="button"
                  onClick={() => handleRemoveFile(file.id)}
                  aria-label="Dosyayı Kaldır"
                  style={{
                    background: 'rgba(239, 68, 68, 0.9)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    fontFamily: 'Poppins, Arial, Helvetica, sans-serif',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ef4444';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
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