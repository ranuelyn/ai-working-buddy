import React from 'react';

export const usePomodoro = (
    playTTSImmediately: (text: string) => Promise<void>,
    setBuddyCyclePaused: (paused: boolean) => void,
    setShowBuddyQuestion: (show: boolean) => void
) => {
    // Pomodoro state'leri
    const [studyDuration, setStudyDuration] = React.useState(25); // Dakika
    const [breakDuration, setBreakDuration] = React.useState(5); // Dakika
    const [isBreakTime, setIsBreakTime] = React.useState(false);
    const [pomodoroActive, setPomodoroActive] = React.useState(false);

    // Pomodoro TTS flag'i (duplicate önlemek için)
    const [isPlayingPomodoroTTS, setIsPlayingPomodoroTTS] = React.useState(false);

    // Pomodoro callback fonksiyonları
    const handleBreakStart = React.useCallback(() => {
        setIsPlayingPomodoroTTS(true); // Normal TTS'i blokla
        setBuddyCyclePaused(true); // AI buddy'yi sustur
        setShowBuddyQuestion(false); // Varsa soruyu gizle

        // Pomodoro TTS'i çal
        playTTSImmediately("Mola vakti! Güzel bir çalışma oldu, şimdi biraz dinlen.").then(() => {
            // TTS bittiğinde flag'i temizle
            setTimeout(() => {
                setIsPlayingPomodoroTTS(false);
            }, 500); // 500ms buffer
        }).catch(() => {
            setIsPlayingPomodoroTTS(false);
        });
    }, [playTTSImmediately]);

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
        handlePomodoroModeChange
    };
}; 