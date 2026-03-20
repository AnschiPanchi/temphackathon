import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

async function test() {
    try {
        const response = await ai.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'system', content: 'test' }],
        });
        console.log('PRIMARY OK:', response.choices[0].message.content);
    } catch (err) {
        console.error('PRIMARY FAILED:', err.status, err.message);
    }

    try {
        const response = await ai.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [{ role: 'system', content: 'test' }],
        });
        console.log('FALLBACK OK:', response.choices[0].message.content);
    } catch (err) {
        console.error('FALLBACK FAILED:', err.status, err.message);
    }
}

test();
