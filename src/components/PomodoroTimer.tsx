import React, { useState, useEffect, useRef } from 'react';

interface PomodoroTimerProps {
  studyDuration: number; // Dakika
  breakDuration: number; // Dakika
  isBreakTime: boolean;
  onModeChange: (isBreakTime: boolean) => void;
  onBreakStart: () => void;
  onStudyStart: () => void;
  isActive: boolean;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  studyDuration,
  breakDuration,
  isBreakTime,
  onModeChange,
  onBreakStart,
  onStudyStart,
  isActive
}) => {
  const [timeLeft, setTimeLeft] = useState(() => {
    return isBreakTime ? breakDuration * 60 : studyDuration * 60;
  });
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<number | undefined>(undefined);

  // Moda göre süreyi güncelle
  useEffect(() => {
    setTimeLeft(isBreakTime ? breakDuration * 60 : studyDuration * 60);
  }, [isBreakTime, studyDuration, breakDuration]);

  // Timer logic
  useEffect(() => {
    if (!isActive || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Süre bitti
          if (isBreakTime) {
            // Mola bitti, ders başlasın
            console.log("⏰ Mola bitti, ders başlıyor!");
            onStudyStart();
            onModeChange(false);
            return studyDuration * 60;
          } else {
            // Ders bitti, mola başlasın
            console.log("⏰ Ders bitti, mola başlıyor!");
            onBreakStart();
            onModeChange(true);
            return breakDuration * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, isBreakTime, studyDuration, breakDuration, onModeChange, onBreakStart, onStudyStart]);

  // Zamanı format etme
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Progress yüzdesi
  const totalDuration = isBreakTime ? breakDuration * 60 : studyDuration * 60;
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;

  if (!isActive) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1200,
      background: isBreakTime 
        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%)'
        : 'linear-gradient(135deg, rgba(124, 58, 237, 0.95) 0%, rgba(99, 102, 241, 0.95) 100%)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      padding: '16px 20px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      minWidth: '140px',
      fontFamily: 'Poppins, Arial, sans-serif',
      color: '#fff',
      border: '1px solid rgba(255,255,255,0.2)'
    }}>
      {/* Mode başlığı */}
      <div style={{
        fontSize: '12px',
        fontWeight: 600,
        opacity: 0.9,
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        {isBreakTime ? '☕ Mola Vakti' : '🕒 Ders Saati'}
      </div>

      {/* Süre gösterimi */}
      <div style={{
        fontSize: '24px',
        fontWeight: 700,
        fontFamily: 'monospace',
        textShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        {formatTime(timeLeft)}
      </div>

      {/* Progress bar */}
      <div style={{
        width: '100%',
        height: '4px',
        background: 'rgba(255,255,255,0.3)',
        borderRadius: '2px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: '#fff',
          borderRadius: '2px',
          transition: 'width 0.3s ease',
          boxShadow: '0 0 8px rgba(255,255,255,0.5)'
        }} />
      </div>

      {/* Pause/Resume butonu */}
      <button
        onClick={() => setIsPaused(!isPaused)}
        style={{
          background: 'rgba(255,255,255,0.15)',
          border: 'none',
          color: '#fff',
          fontSize: '12px',
          cursor: 'pointer',
          padding: '6px 12px',
          borderRadius: '8px',
          transition: 'all 0.2s ease',
          fontWeight: 500
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {isPaused ? '▶️ Devam' : '⏸️ Duraklat'}
      </button>

      {/* Dakika bilgisi */}
      <div style={{
        fontSize: '10px',
        opacity: 0.7,
        textAlign: 'center'
      }}>
        {isBreakTime 
          ? `${breakDuration} dk mola`
          : `${studyDuration} dk ders`
        }
      </div>
    </div>
  );
}; 