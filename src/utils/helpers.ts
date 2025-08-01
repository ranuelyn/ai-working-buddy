export function extractJsonFromCodeBlock(text: string): string {
    // Remove code block markers and trim
    return text.replace(/^```json|^```|```$/gm, '').trim();
} 