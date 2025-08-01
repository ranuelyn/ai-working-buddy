import React from 'react';

export const useMusicPlayer = (setIsMusicPlayerMinimized: (minimized: boolean) => void) => {
    // Music player minimize durumu değiştiğinde chat panel yüksekliğini güncelle
    const handleMusicPlayerMinimizeChange = React.useCallback((isMinimized: boolean) => {
        setIsMusicPlayerMinimized(isMinimized);
    }, []);

    return {
        handleMusicPlayerMinimizeChange
    };
}; 