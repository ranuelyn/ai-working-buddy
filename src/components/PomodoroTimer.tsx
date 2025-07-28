import React, { useEffect, useState } from 'react';
import FlipClockCountdown from '@leenguyen/react-flip-clock-countdown';
import '@leenguyen/react-flip-clock-countdown/dist/index.css';

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
  // Kalan süreyi saniye cinsinden tut
  const [timeLeft, setTimeLeft] = useState(
    (isBreakTime ? breakDuration : studyDuration) * 60
  );
  const [isPaused, setIsPaused] = useState(false);

  // Mod değişince süreyi güncelle
  useEffect(() => {
    setTimeLeft((isBreakTime ? breakDuration : studyDuration) * 60);
  }, [isBreakTime, studyDuration, breakDuration]);

  // Timer logic
  useEffect(() => {
    if (!isActive || isPaused) return;
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Süre bitti
          if (isBreakTime) {
            onStudyStart();
            onModeChange(false);
            return studyDuration * 60;
          } else {
            onBreakStart();
            onModeChange(true);
            return breakDuration * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, isPaused, isBreakTime, studyDuration, breakDuration, onModeChange, onBreakStart, onStudyStart, timeLeft]);

  if (!isActive) return null;

  // FlipClockCountdown için hedef zamanı hesapla
  const targetTime = Date.now() + timeLeft * 1000;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1200,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(8px)',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minWidth: '120px',
      fontFamily: 'Poppins, Arial, sans-serif',
      color: '#fff',
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      <div style={{
        fontSize: '10px',
        fontWeight: 500,
        opacity: 0.7,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: 8
      }}>
        {isBreakTime ? 'Mola' : 'Ders'}
      </div>
      {/* Timer Display */}
      {isPaused ? (
        // Duraklatılmış durum - Sabit zaman göster
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontFamily: 'monospace',
          fontSize: '28px',
          fontWeight: 600,
          lineHeight: 1,
          marginBottom: 8
        }}>
          <div style={{
            width: '32px',
            height: '40px',
            background: '#000',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '24px',
            fontWeight: 600,
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
          }}>
            {Math.floor(timeLeft / 60).toString().padStart(2, '0')}
          </div>
          <div style={{
            fontSize: '20px',
            opacity: 0.7,
            margin: '0 2px'
          }}>
            :
          </div>
          <div style={{
            width: '32px',
            height: '40px',
            background: '#000',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '24px',
            fontWeight: 600,
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
          }}>
            {(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        </div>
      ) : (
        // Çalışan durum - FlipClockCountdown
        <FlipClockCountdown
          to={targetTime}
          renderMap={[false, false, true, true]} // Sadece dakika:saniye
          labels={['', '', '', '']}
          showLabels={false}
          showSeparators={true}
          digitBlockStyle={{
            background: '#000',
            color: '#fff',
            fontSize: '32px',
            borderRadius: '6px',
            minWidth: '32px',
            minHeight: '40px',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
          }}
          dividerStyle={{ color: '#fff', height: 1 }}
          separatorStyle={{ color: '#fff', size: '6px' }}
          duration={0.5}
          style={{ marginBottom: 8 }}
          className="pomodoro-flip-clock"
        />
      )}
      <button
        onClick={() => setIsPaused(!isPaused)}
        style={{
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff',
          fontSize: '10px',
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: '4px',
          transition: 'all 0.2s ease',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: 8
        }}
      >
        {isPaused ? 'Devam' : 'Duraklat'}
      </button>
      <div style={{
        fontSize: '8px',
        opacity: 0.5,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {isBreakTime ? `${breakDuration} dk` : `${studyDuration} dk`}
      </div>
    </div>
  );
}; 