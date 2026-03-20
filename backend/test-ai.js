import { generateEmbedding } from './utils/aiMatcher.js';
import dotenv from 'dotenv';
dotenv.config();

console.log('Generating test embedding...');
generateEmbedding('test code').then(embedding => {
    console.log(`Generated embedding of length ${embedding.length}`);
    process.exit(0);
}).catch(err => {
    console.error('Embedding generation failed:', err);
    process.exit(1);
});
