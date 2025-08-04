import React from 'react';

export const usePomodoro = (
    playTTSImmediately: (text: string) => Promise<void>,
    setBuddyCyclePaused: (paused: boolean) => void,
    setShowBuddyQuestion: (show: boolean) => void,
    setEarnedBadges?: (badges: number | ((prev: number) => number)) => void,
    addNotification?: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void
) => {
    // Pomodoro state'leri
    const [studyDuration, setStudyDuration] = React.useState(25); // Dakika
    const [breakDuration, setBreakDuration] = React.useState(5); // Dakika
    const [isBreakTime, setIsBreakTime] = React.useState(false);
    const [pomodoroActive, setPomodoroActive] = React.useState(false);

    // Pomodoro TTS flag'i (duplicate önlemek için)
    const [isPlayingPomodoroTTS, setIsPlayingPomodoroTTS] = React.useState(false);

    // **YENİ**: Seans sayısını takip et
    const [completedSessions, setCompletedSessions] = React.useState(0);

    // **YENİ**: Rozet verme fonksiyonu
    const awardBadge = React.useCallback(() => {
        if (setEarnedBadges) {
            setEarnedBadges(prev => {
                const newBadgeCount = Math.min(prev + 1, 11); // Maksimum 11 rozet
                console.log(`🏆 Yeni rozet kazanıldı! Toplam: ${newBadgeCount}/11`);
                return newBadgeCount;
            });
        }
    }, [setEarnedBadges]);

    // Pomodoro callback fonksiyonları
    const handleBreakStart = React.useCallback(() => {
        setIsPlayingPomodoroTTS(true); // Normal TTS'i blokla
        setBuddyCyclePaused(true); // AI buddy'yi sustur
        setShowBuddyQuestion(false); // Varsa soruyu gizle

        // **YENİ**: Çalışma seansı tamamlandı, rozet ver
        if (!isBreakTime) { // Çalışma seansından mola seansına geçiyorsak
            setCompletedSessions(prev => {
                const newCount = prev + 1;
                console.log(`📊 Pomodoro seansı tamamlandı! Toplam: ${newCount}`);
                
                // **DÜZELTME**: İlk rozet (ders rozeti) zaten verildi, 2. rozetten başla
                // Pomodoro seansları için rozet verme (2. rozetten 11. rozete kadar)
                if (setEarnedBadges) {
                    setEarnedBadges(prev => {
                        // İlk rozet zaten verildi, bu yüzden pomodoro seansları için +1 yap
                        const newBadgeCount = Math.min(prev + 1, 11);
                        console.log(`🏆 Pomodoro rozeti kazanıldı! Toplam: ${newBadgeCount}/11`);
                        
                        // **YENİ**: Bildirim göster
                        if (addNotification) {
                            const badgeNames = [
                                "Odak Yolcusu", "Pomodoro Kaşifi", "Acemi Bilgin", 
                                "Odaklanma Savaşçısı", "Kıdemli Araştırmacı", "Zinciri Kırma",
                                "Akademinin Yıldızı", "İş Bitirici", "Demir İrade", "Pomodoro Gurusu"
                            ];
                            const badgeIndex = newBadgeCount - 2; // İlk rozet ders rozeti, 2. rozetten başla
                            if (badgeIndex >= 0 && badgeIndex < badgeNames.length) {
                                addNotification(`${badgeNames[badgeIndex]} rozetini kazandın!`, 'success');
                            }
                        }
                        
                        return newBadgeCount;
                    });
                }
                
                return newCount;
            });
        }

        // Pomodoro TTS'i çal
        playTTSImmediately("Mola vakti! Güzel bir çalışma oldu, şimdi biraz dinlen.").then(() => {
            // TTS bittiğinde flag'i temizle
            setTimeout(() => {
                setIsPlayingPomodoroTTS(false);
            }, 500); // 500ms buffer
        }).catch(() => {
            setIsPlayingPomodoroTTS(false);
        });
    }, [playTTSImmediately, isBreakTime, awardBadge]);

    const handleStudyStart = React.useCallback(() => {
        setIsPlayingPomodoroTTS(true); // Normal TTS'i blokla
        setBuddyCyclePaused(false); // AI buddy'yi tekrar aktifleştir

        // Pomodoro TTS'i çal
        playTTSImmediately("Çalışma vakti! Odaklan ve verimli bir çalışma yap.").then(() => {
            // TTS bittiğinde flag'i temizle
            setTimeout(() => {
                setIsPlayingPomodoroTTS(false);
            }, 500); // 500ms buffer
        }).catch(() => {
            setIsPlayingPomodoroTTS(false);
        });
    }, [playTTSImmediately]);

    const handlePomodoroModeChange = React.useCallback((newIsBreakTime: boolean) => {
        setIsBreakTime(newIsBreakTime);
    }, []);

    return {
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
        completedSessions // **YENİ**: Tamamlanan seans sayısını döndür
    };
}; 