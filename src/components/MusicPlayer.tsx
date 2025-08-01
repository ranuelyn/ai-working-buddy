import React, { useState, useRef, useEffect } from 'react';

interface MusicPlayerProps {
  playlistId: string;
  onMinimizeChange?: (isMinimized: boolean) => void; // **YENİ**: Minimize durumu callback'i
}

interface YouTubePlayer {
  destroy: () => void;
  getVideoData: () => { title: string };
  pauseVideo: () => void;
  playVideo: () => void;
  setVolume: (volume: number) => void;
  nextVideo: () => void;
  previousVideo: () => void;
}

declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, config: unknown) => YouTubePlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ playlistId, onMinimizeChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(30); // Başlangıç ses seviyesi %30
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentTitle, setCurrentTitle] = useState("Çalışma Müzikleri");
  const playerRef = useRef<YouTubePlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // **YENİ**: Minimize durumu değiştiğinde parent'a bildir
  useEffect(() => {
    onMinimizeChange?.(isMinimized);
  }, [isMinimized, onMinimizeChange]);

  // YouTube iframe API'sini yükle
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initializePlayer();
      };
    } else {
      initializePlayer();
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  const initializePlayer = () => {
    if (playerRef.current) return;

    playerRef.current = new window.YT.Player('youtube-player', {
      height: '0',
      width: '0',
      playerVars: {
        listType: 'playlist',
        list: playlistId,
        autoplay: 1, // Otomatik başlat
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        showinfo: 0,
      },
      events: {
        onReady: (event: { target: YouTubePlayer }) => {
          console.log('YouTube Player Ready');
          event.target.setVolume(volume);
          // Player hazır olduğunda otomatik başlat
          setTimeout(() => {
            event.target.playVideo();
          }, 1000);
        },
        onStateChange: (event: { data: number }) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
            updateCurrentTitle();
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false);
          }
        },
      },
    });
  };

  const updateCurrentTitle = () => {
    if (playerRef.current && playerRef.current.getVideoData) {
      try {
        const videoData = playerRef.current.getVideoData();
        if (videoData && videoData.title) {
          setCurrentTitle(videoData.title);
        }
      } catch {
        console.log('Video bilgisi alınamadı');
      }
    }
  };

  const togglePlay = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume);
    }
  };

  const nextTrack = () => {
    if (playerRef.current) {
      playerRef.current.nextVideo();
    }
  };

  const prevTrack = () => {
    if (playerRef.current) {
      playerRef.current.previousVideo();
    }
  };

  return (
    <>
      {/* Gizli YouTube player */}
      <div id="youtube-player" style={{ display: 'none' }}></div>
      
      {/* Müzik çalar kontrolü */}
      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: isMinimized ? '60px' : '100px',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          zIndex: 1000,
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          fontFamily: 'Poppins, Arial, sans-serif',
        }}
      >
        {/* Sol taraf - Şarkı bilgisi */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flex: 1,
          minWidth: 0,
        }}>
                     <div style={{
             width: isMinimized ? '40px' : '60px',
             height: isMinimized ? '40px' : '60px',
             borderRadius: '8px',
             background: '#000',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             fontSize: isMinimized ? '16px' : '24px',
             transition: 'all 0.3s ease',
             border: '1px solid rgba(255,255,255,0.1)'
           }}>
             <svg width={isMinimized ? "20" : "28"} height={isMinimized ? "20" : "28"} viewBox="0 0 24 24" fill="white">
               <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5" fill="none"/>
               <path d="M9 9l6 3-6 3z" fill="white"/>
               <circle cx="8" cy="17" r="1" fill="white"/>
               <circle cx="16" cy="17" r="1" fill="white"/>
               <path d="M8 17h8" stroke="white" strokeWidth="1" strokeLinecap="round"/>
             </svg>
           </div>
          
          {!isMinimized && (
            <div style={{ color: '#fff', overflow: 'hidden' }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '4px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '300px',
              }}>
                {currentTitle}
              </div>
              <div style={{
                fontSize: '12px',
                opacity: 0.5,
                color: '#fff',
              }}>
                Çalışma Playlist'i
              </div>
            </div>
          )}
        </div>

        {/* Orta - Oynatma kontrolleri */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMinimized ? '12px' : '20px',
          flex: 1,
          justifyContent: 'center',
        }}>
                     {!isMinimized && (
             <button
               onClick={prevTrack}
               style={{
                 background: 'transparent',
                 border: 'none',
                 color: '#fff',
                 fontSize: '20px',
                 cursor: 'pointer',
                 padding: '8px',
                 borderRadius: '50%',
                 transition: 'all 0.2s ease',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
               }}
               onMouseEnter={(e) => {
                 e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.background = 'transparent';
               }}
             >
               <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                 <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
               </svg>
             </button>
           )}

                     <button
             onClick={togglePlay}
             style={{
               background: 'rgba(255,255,255,0.1)',
               border: '1px solid rgba(255,255,255,0.2)',
               color: '#fff',
               fontSize: isMinimized ? '20px' : '24px',
               cursor: 'pointer',
               padding: isMinimized ? '8px' : '12px',
               borderRadius: '50%',
               transition: 'all 0.2s ease',
               boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               width: isMinimized ? '40px' : '50px',
               height: isMinimized ? '40px' : '50px',
             }}
             onMouseEnter={(e) => {
               e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
               e.currentTarget.style.transform = 'scale(1.05)';
             }}
             onMouseLeave={(e) => {
               e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
               e.currentTarget.style.transform = 'scale(1)';
             }}
           >
             {isPlaying ? (
               // Sound wave simgesi - müzik çalarken
               <svg width={isMinimized ? "20" : "24"} height={isMinimized ? "20" : "24"} viewBox="0 0 24 24" fill="white">
                 <circle cx="12" cy="12" r="8" fill="white"/>
                 <path d="M12 8c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4z" fill="black"/>
                 <path d="M13.5 10.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5" fill="white"/>
                 {/* Sound waves */}
                 <path d="M2 10v4M4 9v6M6 8v8M18 8v8M20 9v6M22 10v4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
               </svg>
             ) : (
               // Play button - müzik durduğunda
               <svg width={isMinimized ? "16" : "20"} height={isMinimized ? "16" : "20"} viewBox="0 0 24 24" fill="white">
                 <path d="M8 5v14l11-7z"/>
               </svg>
             )}
           </button>

                     {!isMinimized && (
             <button
               onClick={nextTrack}
               style={{
                 background: 'transparent',
                 border: 'none',
                 color: '#fff',
                 fontSize: '20px',
                 cursor: 'pointer',
                 padding: '8px',
                 borderRadius: '50%',
                 transition: 'all 0.2s ease',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
               }}
               onMouseEnter={(e) => {
                 e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.background = 'transparent';
               }}
             >
               <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                 <path d="M6 18l8.5-6L6 6v12zm10-12v12h2V6h-2z"/>
               </svg>
             </button>
           )}
        </div>

        {/* Sağ taraf - Ses kontrolleri */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flex: 1,
          justifyContent: 'flex-end',
        }}>
                     {!isMinimized && (
             <>
               {/* Volume adjuster simgesi */}
               <svg width="16" height="16" viewBox="0 0 24 24" fill="white" style={{ marginRight: '4px' }}>
                 <rect x="2" y="2" width="20" height="20" rx="4" stroke="white" strokeWidth="1.5" fill="none"/>
                 <line x1="6" y1="6" x2="6" y2="18" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                 <line x1="10" y1="10" x2="10" y2="18" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                 <line x1="14" y1="8" x2="14" y2="18" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                 <line x1="18" y1="6" x2="18" y2="18" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                 <rect x="5" y="12" width="2" height="4" fill="white" rx="1"/>
                 <rect x="9" y="14" width="2" height="2" fill="white" rx="1"/>
                 <rect x="13" y="10" width="2" height="6" fill="white" rx="1"/>
                 <rect x="17" y="8" width="2" height="8" fill="white" rx="1"/>
               </svg>
               <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                style={{
                  width: '100px',
                  height: '4px',
                  borderRadius: '2px',
                  background: 'rgba(255,255,255,0.3)',
                  outline: 'none',
                  appearance: 'none',
                }}
              />
              <span style={{ 
                color: '#a78bfa', 
                fontSize: '12px', 
                minWidth: '35px',
                textAlign: 'right'
              }}>
                {volume}%
              </span>
            </>
          )}

                     <button
             onClick={() => setIsMinimized(!isMinimized)}
             style={{
               background: 'transparent',
               border: 'none',
               color: '#a78bfa',
               fontSize: '16px',
               cursor: 'pointer',
               padding: '8px',
               transition: 'all 0.2s ease',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
             }}
             onMouseEnter={(e) => {
               e.currentTarget.style.color = '#fff';
             }}
             onMouseLeave={(e) => {
               e.currentTarget.style.color = '#a78bfa';
             }}
           >
             <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
               {isMinimized ? (
                 <path d="M7 14l5-5 5 5z"/>
               ) : (
                 <path d="M7 10l5 5 5-5z"/>
               )}
             </svg>
           </button>
        </div>
      </div>

      {/* Slider stilleri */}
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #7c3aed;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(124, 58, 237, 0.3);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #7c3aed;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(124, 58, 237, 0.3);
        }
        
        input[type="range"]::-webkit-slider-track {
          background: rgba(255,255,255,0.3);
          height: 4px;
          border-radius: 2px;
        }
        
        input[type="range"]::-moz-range-track {
          background: rgba(255,255,255,0.3);
          height: 4px;
          border-radius: 2px;
          border: none;
        }
      `}</style>
    </>
  );
}; 