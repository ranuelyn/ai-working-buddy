export class TTSService {
    private static apiKey = import.meta.env.VITE_ELEVEN_LABS_API_KEY;

    static async playTTSImmediately(text: string): Promise<void> {
        // Emojileri ve özel karakterleri temizle
        const cleanedText = text
            .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
            .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Miscellaneous Symbols and Pictographs
            .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map Symbols
            .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags (iOS)
            .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Miscellaneous Symbols
            .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
            .replace(/🎤|🤖|👤|💬|📱|⏰|🔔|✅|❌|🎯|🔄|📊|💾|🚀|🎵|🔊|⚡|🎊|🎉/g, '') // Sık kullanılan emojiler
            .replace(/\s+/g, ' ') // Çoklu boşlukları tek boşluğa çevir
            .trim(); // Başlangıç ve sondaki boşlukları temizle

        if (!cleanedText) {
            return Promise.resolve();
        }

        // Türkçe kontrolü
        if (!/[çğıöşüÇĞİÖŞÜ]/.test(cleanedText) && !cleanedText.toLowerCase().includes(" mi") && !cleanedText.toLowerCase().includes(" ne")) {
            return Promise.resolve();
        }

        if (!this.apiKey) {
            // Browser TTS'i hemen başlat
            return new Promise<void>((resolve) => {
                try {
                    const utterance = new SpeechSynthesisUtterance(cleanedText);
                    utterance.lang = 'tr-TR';
                    utterance.rate = 0.9;
                    utterance.pitch = 1;
                    utterance.onend = () => resolve();
                    utterance.onerror = () => resolve();
                    speechSynthesis.speak(utterance);
                } catch (browserTTSError) {
                    console.error("Browser TTS hatası:", browserTTSError);
                    resolve();
                }
            });
        }

        // ElevenLabs API kullan
        try {
            const voiceId = "TxGEqnHWrfWFTfGW9XjX"; // Josh - Net erkek sesi
            const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
            const body = JSON.stringify({
                text: cleanedText,
                model_id: "eleven_multilingual_v2",
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.8
                }
            });

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "xi-api-key": this.apiKey,
                    "Content-Type": "application/json",
                    "Accept": "audio/mpeg"
                },
                body
            });

            if (!response.ok) {
                throw new Error("TTS API hatası: " + response.status);
            }

            const arrayBuffer = await response.arrayBuffer();
            const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);

            // Promise ile audio bitimini bekle
            return new Promise<void>((resolve) => {
                audio.onended = () => resolve();
                audio.onerror = () => resolve();
                audio.play();
            });
        } catch (err) {
            console.error("ElevenLabs TTS hatası, Browser TTS'e geçiliyor:", err);
            // Fallback: Browser TTS
            return new Promise<void>((resolve) => {
                try {
                    const utterance = new SpeechSynthesisUtterance(cleanedText);
                    utterance.lang = 'tr-TR';
                    utterance.rate = 0.9;
                    utterance.pitch = 1;
                    utterance.onend = () => resolve();
                    utterance.onerror = () => resolve();
                    speechSynthesis.speak(utterance);
                } catch (browserTTSError) {
                    console.error("Browser TTS hatası da var:", browserTTSError);
                    resolve();
                }
            });
        }
    }
} 