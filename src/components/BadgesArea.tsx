import React, { useState, useEffect } from 'react';

interface BadgeDefinition {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface BadgesAreaProps {
  earnedBadges: number;
}

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { id: 1, name: "Odak Yolcusu", description: "İlk pomodoro seansını tamamladın!", icon: "🌟", color: "#10b981" },
  { id: 2, name: "Pomodoro Kaşifi", description: "İkinci seans tamamlandı, yolculuk başladı!", icon: "🔍", color: "#3b82f6" },
  { id: 3, name: "Acemi Bilgin", description: "Üçüncü seans ile bilgiye doğru ilerliyorsun!", icon: "📚", color: "#8b5cf6" },
  { id: 4, name: "Odaklanma Savaşçısı", description: "Dördüncü seans, dikkatini kontrol ediyorsun!", icon: "⚔️", color: "#ef4444" },
  { id: 5, name: "Kıdemli Araştırmacı", description: "Beşinci seans ile araştırma becerilerin gelişiyor!", icon: "🔬", color: "#f59e0b" },
  { id: 6, name: "Zinciri Kırma", description: "Altıncı seans, engelleris aşıyorsun!", icon: "⛓️", color: "#64748b" },
  { id: 7, name: "Akademinin Yıldızı", description: "Yedinci seans, artık bir yıldızsın!", icon: "⭐", color: "#fbbf24" },
  { id: 8, name: "İş Bitirici", description: "Sekizinci seans, hedeflerine ulaşıyorsun!", icon: "✅", color: "#22c55e" },
  { id: 9, name: "Demir İrade", description: "Dokuzuncu seans, iraден güçlü!", icon: "💪", color: "#6366f1" },
  { id: 10, name: "Pomodoro Gurusu", description: "Onuncu seans! Artık gerçek bir gurusun!", icon: "🧘", color: "#a855f7" }
];

export const BadgesArea: React.FC<BadgesAreaProps> = ({ earnedBadges }) => {
  const [animatingBadge, setAnimatingBadge] = useState<number | null>(null);

  // Yeni rozet kazanıldığında animasyon
  useEffect(() => {
    if (earnedBadges > 0) {
      setAnimatingBadge(earnedBadges);
      const timer = setTimeout(() => {
        setAnimatingBadge(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [earnedBadges]);

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      padding: '16px',
      height: '100%',
      fontFamily: 'Poppins, Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '12px',
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
          <span>🏆</span>
          Rozetlerim
        </h3>
        
        {/* Progress */}
        <div style={{
          fontSize: '12px',
          color: '#a78bfa',
          fontWeight: 600,
          background: 'rgba(124, 58, 237, 0.2)',
          padding: '4px 12px',
          borderRadius: '12px'
        }}>
          {earnedBadges}/10 Rozet
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        width: '100%',
        height: '8px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '8px'
      }}>
        <div style={{
          width: `${(earnedBadges / 10) * 100}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%)',
          borderRadius: '4px',
          transition: 'width 0.5s ease',
          boxShadow: earnedBadges > 0 ? '0 0 12px rgba(124, 58, 237, 0.5)' : 'none'
        }} />
      </div>

      {/* Badges Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '12px',
        overflowY: 'auto',
        flex: 1
      }}>
        {BADGE_DEFINITIONS.map((badge) => {
          const isEarned = earnedBadges >= badge.id;
          const isAnimating = animatingBadge === badge.id;
          
          return (
            <div
              key={badge.id}
              style={{
                background: isEarned 
                  ? `linear-gradient(135deg, ${badge.color}22 0%, ${badge.color}11 100%)`
                  : 'rgba(255,255,255,0.05)',
                border: isEarned 
                  ? `1px solid ${badge.color}44`
                  : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '16px',
                transition: 'all 0.3s ease',
                transform: isAnimating ? 'scale(1.05)' : 'scale(1)',
                boxShadow: isAnimating 
                  ? `0 0 20px ${badge.color}66`
                  : isEarned 
                    ? `0 2px 8px ${badge.color}22`
                    : '0 2px 8px rgba(0,0,0,0.1)',
                opacity: isEarned ? 1 : 0.4,
                animation: isAnimating ? 'badgeEarn 2s ease' : 'none'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '8px'
              }}>
                <div style={{
                  fontSize: '24px',
                  filter: isEarned ? 'none' : 'grayscale(1)',
                  transform: isAnimating ? 'scale(1.2)' : 'scale(1)',
                  transition: 'transform 0.3s ease'
                }}>
                  {badge.icon}
                </div>
                
                <div style={{ flex: 1 }}>
                  <h4 style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: 600,
                    color: isEarned ? '#fff' : '#666',
                    marginBottom: '2px'
                  }}>
                    {badge.name}
                  </h4>
                  
                  <div style={{
                    fontSize: '11px',
                    color: isEarned ? '#a78bfa' : '#555',
                    fontWeight: 500
                  }}>
                    #{badge.id} Rozet
                  </div>
                </div>

                {isEarned && (
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: badge.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: '#fff',
                    fontWeight: 'bold'
                  }}>
                    ✓
                  </div>
                )}
              </div>
              
              <p style={{
                margin: 0,
                fontSize: '12px',
                lineHeight: 1.4,
                color: isEarned ? '#e5e7eb' : '#666'
              }}>
                {badge.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Footer Stats */}
      <div style={{
        paddingTop: '12px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        fontSize: '11px',
        color: '#a78bfa',
        textAlign: 'center'
      }}>
        {earnedBadges === 0 && "İlk pomodoro seansını tamamlayarak ilk rozetini kazan!"}
        {earnedBadges > 0 && earnedBadges < 10 && `${10 - earnedBadges} rozet daha kaldı!`}
        {earnedBadges === 10 && "🎉 Tüm rozetleri topladın! Pomodoro Gurusu oldun!"}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes badgeEarn {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); box-shadow: 0 0 30px currentColor; }
          100% { transform: scale(1.05); }
        }
        
        /* Custom scrollbar */
        div::-webkit-scrollbar {
          width: 6px;
        }
        
        div::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.2);
          border-radius: 3px;
        }
        
        div::-webkit-scrollbar-thumb {
          background: rgba(124, 58, 237, 0.5);
          border-radius: 3px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background: rgba(124, 58, 237, 0.7);
        }
      `}</style>
    </div>
  );
}; 