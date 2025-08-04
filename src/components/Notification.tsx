import React, { useEffect, useState } from 'react';

interface NotificationProps {
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
  onClose: () => void;
  top?: number;
}

export const Notification: React.FC<NotificationProps> = ({
  message,
  type,
  duration = 4000,
  onClose,
  top = 20
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animasyon için kısa bir gecikme
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Otomatik kapanma
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Animasyon bittikten sonra kapat
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderColor: '#10b981',
          icon: '🏆'
        };
      case 'info':
        return {
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          borderColor: '#3b82f6',
          icon: 'ℹ️'
        };
      case 'warning':
        return {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          borderColor: '#f59e0b',
          icon: '⚠️'
        };
      case 'error':
        return {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          borderColor: '#ef4444',
          icon: '❌'
        };
      default:
        return {
          background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
          borderColor: '#6b7280',
          icon: '📢'
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <div
      style={{
        position: 'fixed',
        top: `${top}px`,
        right: '20px',
        zIndex: 9999,
        background: typeStyles.background,
        border: `2px solid ${typeStyles.borderColor}44`,
        borderRadius: '16px',
        padding: '16px 20px',
        color: '#fff',
        fontFamily: 'Poppins, Arial, sans-serif',
        fontSize: '14px',
        fontWeight: 600,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(8px)',
        minWidth: '300px',
        maxWidth: '400px',
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer'
      }}
      onClick={() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }}
    >
      <div style={{
        fontSize: '20px',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
      }}>
        {typeStyles.icon}
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '16px',
          fontWeight: 700,
          marginBottom: '2px',
          textShadow: '0 1px 2px rgba(0,0,0,0.3)'
        }}>
          {type === 'success' ? 'Rozet Kazanıldı!' : 'Bildirim'}
        </div>
        <div style={{
          fontSize: '13px',
          opacity: 0.9,
          lineHeight: 1.4,
          textShadow: '0 1px 2px rgba(0,0,0,0.2)'
        }}>
          {message}
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
        }}
      >
        ×
      </button>
    </div>
  );
}; 