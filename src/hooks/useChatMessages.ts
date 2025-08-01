import React from 'react';

export interface ChatMessage {
    id: string;
    type: 'user' | 'ai';
    text: string;
    timestamp: number;
}

export const useChatMessages = () => {
    const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([]);
    const chatMessagesEndRef = React.useRef<HTMLDivElement>(null);

    // Chat'e mesaj ekleme fonksiyonları (duplicate kontrolü ile)
    const addChatMessage = React.useCallback((type: 'user' | 'ai', text: string) => {
        // Duplicate mesaj kontrolü
        setChatMessages(prev => {
            // Son 3 mesajda aynı text var mı kontrol et
            const recentMessages = prev.slice(-3);
            const isDuplicate = recentMessages.some(msg =>
                msg.type === type &&
                msg.text === text &&
                (Date.now() - msg.timestamp) < 5000 // 5 saniye içinde aynı mesaj varsa duplicate
            );

            if (isDuplicate) {
                return prev; // Aynı array'i döndür, değişiklik yok
            }

            const message = {
                id: `${Date.now()}-${Math.random()}`,
                type,
                text,
                timestamp: Date.now()
            };

            return [...prev, message];
        });
    }, []);

    // Chat mesajları güncellendiğinde auto-scroll
    React.useEffect(() => {
        if (chatMessagesEndRef.current) {
            chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages]);

    return {
        chatMessages,
        setChatMessages,
        addChatMessage,
        chatMessagesEndRef
    };
}; 