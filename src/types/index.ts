export type Question = {
    question_number: string | null;
    question_text: string;
};

export type QuestionsJson = {
    questions: Question[];
};

export type BuddyResponse = {
    delay_seconds: number;
    target_question_number: string;
    ai_question: string;
};

export type ConversationEntry = {
    AI: string;
    USER: string;
};

export type ConversationHistory = ConversationEntry[];

export type ConversationResponse = {
    ai_response_text: string;
    is_conversation_over: boolean;
}; 