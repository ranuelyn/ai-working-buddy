import React, { useState, useEffect, useRef } from 'react';

export const NotesArea: React.FC = () => {
  const [notes, setNotes] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<number | undefined>(undefined);

  // LocalStorage'dan notları yükle
  useEffect(() => {
    const savedNotes = localStorage.getItem('ai-buddy-notes');
    const savedTime = localStorage.getItem('ai-buddy-notes-timestamp');
    
    if (savedNotes) {
      setNotes(savedNotes);
    }
    
    if (savedTime) {
      setLastSaved(new Date(parseInt(savedTime)));
    }
  }, []);

  // Notları localStorage'a kaydet (debounced)
  const saveNotes = (noteText: string) => {
    setIsSaving(true);
    
    // Önceki timeout'u temizle
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // 1 saniye sonra kaydet
    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem('ai-buddy-notes', noteText);
      localStorage.setItem('ai-buddy-notes-timestamp', Date.now().toString());
      setLastSaved(new Date());
      setIsSaving(false);
      console.log('📝 Notlar kaydedildi');
    }, 1000);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    saveNotes(newNotes);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [notes]);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Karakter sayısı
  const characterCount = notes.length;
  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '16px',
      height: '100%',
      fontFamily: 'Poppins, Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '8px',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: 600,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>📝</span>
          Notlarım
        </h3>
        
        {/* Save status */}
        <div style={{
          fontSize: '11px',
          color: isSaving ? '#fbbf24' : '#10b981',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {isSaving ? (
            <>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#fbbf24',
                animation: 'pulse 1s infinite'
              }} />
              Kaydediliyor...
            </>
          ) : lastSaved ? (
            <>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981'
              }} />
              Kaydedildi
            </>
          ) : null}
        </div>
      </div>

      {/* Notes textarea */}
      <textarea
        ref={textareaRef}
        value={notes}
        onChange={handleNotesChange}
        placeholder="Buraya notlarınızı yazabilirsiniz...

• Önemli konuları not edin
• Çalışma planınızı yazın  
• Sorular ve cevaplar
• Hatırlatmalar

Yazdığınız her şey otomatik olarak kaydedilir."
        style={{
          flex: 1,
          minHeight: '200px',
          maxHeight: '400px',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'rgba(0,0,0,0.3)',
          color: '#fff',
          fontSize: '14px',
          lineHeight: 1.6,
          fontFamily: 'Poppins, Arial, sans-serif',
          resize: 'none',
          outline: 'none',
          transition: 'border-color 0.2s ease',
          overflowY: 'auto'
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#7c3aed';
          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(124, 58, 237, 0.2)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />

      {/* Footer stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '8px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        fontSize: '11px',
        color: '#a78bfa'
      }}>
        <div>
          {wordCount} kelime • {characterCount} karakter
        </div>
        
        {lastSaved && (
          <div>
            Son güncelleme: {lastSaved.toLocaleTimeString('tr-TR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        )}
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        /* Custom scrollbar for textarea */
        textarea::-webkit-scrollbar {
          width: 6px;
        }
        
        textarea::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.3);
          border-radius: 3px;
        }
        
        textarea::-webkit-scrollbar-thumb {
          background: rgba(124, 58, 237, 0.5);
          border-radius: 3px;
        }
        
        textarea::-webkit-scrollbar-thumb:hover {
          background: rgba(124, 58, 237, 0.7);
        }
      `}</style>
    </div>
  );
}; 