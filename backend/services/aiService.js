import OpenAI from 'openai';

/**
 * AI Service for managing LLM interactions.
 * Centrally handles client initialization (Groq/OpenAI) and utility functions.
 */

export const getAiClient = () => {
    if (process.env.GROQ_API_KEY) {
        return new OpenAI({
            apiKey: process.env.GROQ_API_KEY,
            baseURL: "https://api.groq.com/openai/v1",
        });
    } else if (process.env.OPENAI_API_KEY) {
        return new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return null;
};

export const getAiModel = () => {
    return process.env.GROQ_API_KEY ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';
};

export const parseJSONResponse = (text) => {
    try {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        try {
            return JSON.parse(cleaned);
        } catch {
            const firstBrace = cleaned.indexOf('{');
            const lastBrace = cleaned.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                const jsonSlice = cleaned.slice(firstBrace, lastBrace + 1);
                return JSON.parse(jsonSlice);
            }
            throw new Error('No valid JSON object found in model response.');
        }
    } catch (e) {
        throw new Error(`Failed to parse AI response as JSON: ${e.message}`);
    }
};
