import { OCR_PROMPT, BUDDY_PROMPT, CONVERSATION_PROMPT, CONVERSATION_OZETLEYİCİ } from '../constants/prompts';
import { extractJsonFromCodeBlock } from '../utils/helpers';
import type { QuestionsJson, BuddyResponse, ConversationHistory, ConversationResponse } from '../types';
import { ragService, type RAGContext } from './ragService';

export class AIService {
    private static apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    static async runGeminiOCR(sessionImage: string, ragContext?: RAGContext): Promise<QuestionsJson | null> {
        if (!this.apiKey) {
            console.error("Gemini API anahtarı bulunamadı!");
            return null;
        }

        try {
            const base64Data = sessionImage.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

            // RAG context varsa prompt'u zenginleştir
            let enhancedPrompt = OCR_PROMPT;
            if (ragContext) {
                enhancedPrompt = await ragService.enhancePromptWithRAG(OCR_PROMPT, ragContext);
            }

            const body = JSON.stringify({
                contents: [
                    {
                        role: "user", parts: [
                            { text: enhancedPrompt },
                            { inline_data: { mime_type: "image/png", data: base64Data } }
                        ]
                    }
                ]
            });

            const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + this.apiKey, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body
            });

            const data = await response.json();
            const result = data?.candidates?.[0]?.content?.parts?.[0]?.text || data;
            
            let parsed: QuestionsJson | null;
            try {
                const clean = typeof result === "string" ? extractJsonFromCodeBlock(result) : result;
                parsed = typeof clean === "string" ? JSON.parse(clean) : clean;
            } catch {
                parsed = null;
            }

            return parsed;
        } catch (err) {
            console.error("Gemini OCR API hatası:", err);
            return null;
        }
    }

    static async runBuddyPrompt(
        questionsJson: QuestionsJson,
        conversationCount: number,
        pastConversations: string[],
        ragContext?: RAGContext
    ): Promise<BuddyResponse | null> {
        if (!this.apiKey) {
            console.error("Gemini API anahtarı bulunamadı!");
            return null;
        }

        try {
            const requestData = {
                conversation_count: conversationCount,
                questions: questionsJson.questions,
                past_conversations: pastConversations
            };

            // RAG context varsa prompt'u zenginleştir
            let enhancedPrompt = BUDDY_PROMPT;
            if (ragContext) {
                enhancedPrompt = await ragService.enhancePromptWithRAG(BUDDY_PROMPT, ragContext);
            }

            const body = JSON.stringify({
                contents: [
                    {
                        role: "user", parts: [
                            { text: enhancedPrompt },
                            { text: JSON.stringify(requestData) }
                        ]
                    }
                ]
            });

            const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + this.apiKey, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body
            });

            const data = await response.json();
            const result = data?.candidates?.[0]?.content?.parts?.[0]?.text || data;
            
            let parsed: BuddyResponse | null;
            try {
                const clean = typeof result === "string" ? extractJsonFromCodeBlock(result) : result;
                parsed = typeof clean === "string" ? JSON.parse(clean) : clean;
            } catch {
                parsed = null;
            }

            return parsed;
        } catch (err) {
            console.error("Gemini Buddy API hatası:", err);
            return null;
        }
    }

    static async processAudioResponse(
        audioBlob: Blob,
        conversationHistory: ConversationHistory,
        questionsJson: QuestionsJson | null,
        ragContext?: RAGContext
    ): Promise<{ userText: string; aiResponse: ConversationResponse | null }> {
        if (!this.apiKey) {
            console.error("Gemini API anahtarı bulunamadı!");
            return { userText: "API anahtarı bulunamadı", aiResponse: null };
        }

        try {
            // Ses dosyasını Base64'e çevir
            const arrayBuffer = await audioBlob.arrayBuffer();
            const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

            // Önce sesi metne çevir
            const transcriptionBody = JSON.stringify({
                contents: [
                    {
                        role: "user", parts: [
                            { text: "Bu ses kaydını Türkçe metne çevir. Sadece metni döndür, başka hiçbir şey ekleme." },
                            { inline_data: { mime_type: "audio/wav", data: base64Audio } }
                        ]
                    }
                ]
            });

            const transcriptionResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + this.apiKey, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: transcriptionBody
            });

            const transcriptionData = await transcriptionResponse.json();
            const userText = transcriptionData?.candidates?.[0]?.content?.parts?.[0]?.text || "Ses anlaşılamadı";

            // Konuşma geçmişini güncelle
            const newHistory = [...conversationHistory];
            if (newHistory.length > 0) {
                newHistory[newHistory.length - 1].USER = userText;
            }

            // AI yanıtını al
            let enhancedPrompt = CONVERSATION_PROMPT;

            if (ragContext) {
                enhancedPrompt = await ragService.enhancePromptWithRAG(CONVERSATION_PROMPT, ragContext, userText);
            } else if (questionsJson && questionsJson.questions) {
                enhancedPrompt += `\n\nDERS MATERYALİ SORULARI:\n`;
                questionsJson.questions.forEach((q) => {
                    enhancedPrompt += `Soru ${q.question_number}: ${q.question_text}\n`;
                });
            }

            enhancedPrompt += "\n\nCONVERSATION HISTORY:\n" + newHistory.map(entry =>
                `AI: "${entry.AI}"\nUSER: "${entry.USER}"`
            ).join('\n\n') + "\n\nYOUR TASK: Based on the last USER message, generate your next response in the required JSON format. Use the course material questions as context when discussing topics.";

            const conversationBody = JSON.stringify({
                contents: [
                    {
                        role: "user", parts: [
                            { text: enhancedPrompt }
                        ]
                    }
                ]
            });

            const conversationResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + this.apiKey, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: conversationBody
            });

            const conversationData = await conversationResponse.json();
            const result = conversationData?.candidates?.[0]?.content?.parts?.[0]?.text || "Anlayamadım, tekrar söyler misin?";

            let parsed: ConversationResponse | null;
            try {
                const clean = typeof result === "string" ? extractJsonFromCodeBlock(result) : result;
                parsed = typeof clean === "string" ? JSON.parse(clean) : clean;
            } catch {
                parsed = null;
            }

            return { userText, aiResponse: parsed };
        } catch (error) {
            console.error('Ses işleme hatası:', error);
            return { userText: "Ses işleme hatası", aiResponse: null };
        }
    }

    static async processUserQuestionAudio(
        audioBlob: Blob,
        conversationHistory: ConversationHistory,
        questionsJson: QuestionsJson | null,
        ragContext?: RAGContext
    ): Promise<{ userText: string; aiResponse: ConversationResponse | null }> {
        if (!this.apiKey) {
            console.error("Gemini API anahtarı bulunamadı!");
            return { userText: "API anahtarı bulunamadı", aiResponse: null };
        }

        try {
            const arrayBuffer = await audioBlob.arrayBuffer();
            const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

            // Önce sesi metne çevir
            const transcriptionBody = JSON.stringify({
                contents: [
                    {
                        role: "user", parts: [
                            { text: "Bu ses kaydını Türkçe metne çevir. Sadece metni döndür, başka hiçbir şey ekleme." },
                            { inline_data: { mime_type: "audio/wav", data: base64Audio } }
                        ]
                    }
                ]
            });

            const transcriptionResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + this.apiKey, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: transcriptionBody
            });

            const transcriptionData = await transcriptionResponse.json();
            const userText = transcriptionData?.candidates?.[0]?.content?.parts?.[0]?.text || "Ses anlaşılamadı";

            // AI yanıtını al
            let enhancedPrompt = CONVERSATION_PROMPT;

            if (ragContext) {
                enhancedPrompt = await ragService.enhancePromptWithRAG(CONVERSATION_PROMPT, ragContext, userText);
            } else if (questionsJson && questionsJson.questions) {
                enhancedPrompt += `\n\nDERS MATERYALİ SORULARI:\n`;
                questionsJson.questions.forEach((q) => {
                    enhancedPrompt += `Soru ${q.question_number}: ${q.question_text}\n`;
                });
            }

            enhancedPrompt += "\n\nCONVERSATION HISTORY:\n" + conversationHistory.map(entry =>
                `AI: "${entry.AI}"\nUSER: "${entry.USER}"`
            ).join('\n\n') + "\n\nYOUR TASK: Based on the last USER message, generate your next response in the required JSON format. Use the course material questions as context when discussing topics.";

            const conversationBody = JSON.stringify({
                contents: [
                    {
                        role: "user", parts: [
                            { text: enhancedPrompt }
                        ]
                    }
                ]
            });

            const conversationResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + this.apiKey, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: conversationBody
            });

            const conversationData = await conversationResponse.json();
            const result = conversationData?.candidates?.[0]?.content?.parts?.[0]?.text || "Yanıt alınamadı.";

            let parsed: ConversationResponse | null;
            try {
                const clean = extractJsonFromCodeBlock(result);
                parsed = typeof clean === "string" ? JSON.parse(clean) : clean;
            } catch {
                parsed = null;
            }

            return { userText, aiResponse: parsed };
        } catch (err) {
            console.error("Kullanıcı sorusu işlenirken hata:", err);
            return { userText: "İşlem hatası", aiResponse: null };
        }
    }

    static async summarizeConversation(history: ConversationHistory): Promise<string> {
        if (!this.apiKey) return "";

        try {
            const conversationText = history.map(entry =>
                `AI: "${entry.AI}"\nUSER: "${entry.USER}"`
            ).join('\n\n');

            const body = JSON.stringify({
                contents: [
                    {
                        role: "user", parts: [
                            { text: CONVERSATION_OZETLEYİCİ + "\n\n" + conversationText }
                        ]
                    }
                ]
            });

            const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + this.apiKey, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body
            });

            const data = await response.json();
            return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        } catch (error) {
            console.error('Konuşma özetleme hatası:', error);
            return "";
        }
    }
} 