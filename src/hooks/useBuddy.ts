import React from 'react';
import { AIService } from '../services/aiService';
import type { QuestionsJson, ConversationHistory } from '../types';

export const useBuddy = (
    questionsJson: QuestionsJson | null,
    conversationCount: number,
    pastConversations: string[],
    ragContext: any,
    setBuddyResponse: (response: any) => void,
    setConversationCount: (count: number | ((prev: number) => number)) => void,
    shouldAskNewQuestionRef: React.MutableRefObject<boolean>,
    lastShownQuestionRef: React.MutableRefObject<string>
) => {
    // Buddy promptunu yolla
    const runBuddyPrompt = React.useCallback(async () => {
        if (!questionsJson || !questionsJson.questions) {
            return;
        }

        try {
            const parsed = await AIService.runBuddyPrompt(questionsJson, conversationCount, pastConversations, ragContext || undefined);

            // Duplicate kontrolü - aynı soru tekrar set edilmesin
            if (parsed && parsed.ai_question && lastShownQuestionRef.current === parsed.ai_question) {
                return; // Duplicate ise set etme
            }

            setBuddyResponse(parsed);

            // Buddy prompt gönderildikten sonra flag'i sıfırla
            shouldAskNewQuestionRef.current = false;

            // Conversation count'u artır
            setConversationCount(prev => prev + 1);
        } catch (err) {
            setBuddyResponse(null);
            console.error("Gemini Buddy API hatası:", err);
        }
    }, [questionsJson, conversationCount, pastConversations, ragContext, setBuddyResponse, setConversationCount, shouldAskNewQuestionRef, lastShownQuestionRef]);

    return {
        runBuddyPrompt
    };
}; 