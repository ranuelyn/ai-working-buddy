import React from 'react';

export const useMicrophone = () => {
    // Mikrofon iznini ön-yükleme (ilk kullanım gecikme sorunu için)
    const prewarmMicrophone = React.useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Hemen kapat, sadece izin almak için
            stream.getTracks().forEach(track => track.stop());
        } catch {
            // Bu normal, kullanıcı ilk seferde izin verebilir
        }
    }, []);

    return {
        prewarmMicrophone
    };
}; 