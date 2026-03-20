import dotenv from 'dotenv';
dotenv.config();

console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('GROQ_API_KEY exists:', !!process.env.GROQ_API_KEY);
console.log('LENGTH GEMINI:', process.env.GEMINI_API_KEY?.length);
console.log('LENGTH GROQ:', process.env.GROQ_API_KEY?.length);
