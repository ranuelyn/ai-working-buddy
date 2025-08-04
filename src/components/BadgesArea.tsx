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
  { id: 1, name: "İlk Ders", description: "İlk ders materyalini yükledin ve çalışmaya başladın!", icon: "📖", color: "#10b981" },
  { id: 2, name: "Odak Yolcusu", description: "İlk pomodoro seansını tamamladın!", icon: "🌟", color: "#3b82f6" },
  { id: 3, name: "Pomodoro Kaşifi", description: "İkinci seans tamamlandı, yolculuk başladı!", icon: "🔍", color: "#8b5cf6" },
  { id: 4, name: "Acemi Bilgin", description: "Üçüncü seans ile bilgiye doğru ilerliyorsun!", icon: "📚", color: "#ef4444" },
  { id: 5, name: "Odaklanma Savaşçısı", description: "Dördüncü seans, dikkatini kontrol ediyorsun!", icon: "⚔️", color: "#f59e0b" },
  { id: 6, name: "Kıdemli Araştırmacı", description: "Beşinci seans ile araştırma becerilerin gelişiyor!", icon: "🔬", color: "#64748b" },
  { id: 7, name: "Zinciri Kırma", description: "Altıncı seans, engelleris aşıyorsun!", icon: "⛓️", color: "#fbbf24" },
  { id: 8, name: "Akademinin Yıldızı", description: "Yedinci seans, artık bir yıldızsın!", icon: "⭐", color: "#22c55e" },
  { id: 9, name: "İş Bitirici", description: "Sekizinci seans, hedeflerine ulaşıyorsun!", icon: "✅", color: "#6366f1" },
  { id: 10, name: "Demir İrade", description: "Dokuzuncu seans, iraden güçlü!", icon: "💪", color: "#a855f7" },
  { id: 11, name: "Pomodoro Gurusu", description: "Onuncu seans! Artık gerçek bir gurusun!", icon: "🧘", color: "#ec4899" }
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
      maxHeight: '100%', // **YENİ**: Maksimum yükseklik sınırı
      overflow: 'hidden', // **YENİ**: Taşmayı engelle
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
          gap: '8px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
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
          borderRadius: '12px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        }}>
          {earnedBadges}/11 Rozet
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
          width: `${(earnedBadges / 11) * 100}%`,
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
        flex: 1,
        maxHeight: 'calc(100% - 120px)', // **YENİ**: Header ve footer için yer bırak
        minHeight: 0 // **YENİ**: Flex item'ın shrink olmasını sağla
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
                  : 'rgba(255,255,255,0.08)',
                border: isEarned 
                  ? `1px solid ${badge.color}44`
                  : '1px solid rgba(255,255,255,0.15)',
                borderRadius: '12px',
                padding: '16px',
                transition: 'all 0.3s ease',
                transform: isAnimating ? 'scale(1.05)' : 'scale(1)',
                boxShadow: isAnimating 
                  ? `0 0 20px ${badge.color}66`
                  : isEarned 
                    ? `0 2px 8px ${badge.color}22`
                    : '0 2px 8px rgba(0,0,0,0.15)',
                opacity: isEarned ? 1 : 0.7,
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
                  filter: isEarned ? 'none' : 'grayscale(0.3)',
                  opacity: isEarned ? 1 : 0.8,
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
                    color: isEarned ? '#fff' : '#ccc',
                    marginBottom: '2px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                  }}>
                    {badge.name}
                  </h4>
                  
                  <div style={{
                    fontSize: '11px',
                    color: isEarned ? '#a78bfa' : '#999',
                    fontWeight: 500,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                  }}>
                    #{badge.id} Rozet
                  </div>
                </div>

                {isEarned ? (
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
                ) : (
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: '#999',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    🔒
                  </div>
                )}
              </div>
              
              <p style={{
                margin: 0,
                fontSize: '12px',
                lineHeight: 1.4,
                color: isEarned ? '#e5e7eb' : '#bbb',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
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
        textAlign: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      }}>
        {earnedBadges === 0 && "İlk ders materyalini yükleyerek ilk rozetini kazan!"}
        {earnedBadges > 0 && earnedBadges < 11 && `${11 - earnedBadges} rozet daha kaldı!`}
        {earnedBadges === 11 && "🎉 Tüm rozetleri topladın! Pomodoro Gurusu oldun!"}
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