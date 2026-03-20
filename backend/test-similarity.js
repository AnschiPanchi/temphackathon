import axios from 'axios';
import { generateEmbedding, computeCosineSimilarity } from './utils/aiMatcher.js';

async function testMatch() {
    console.log('Fetching one job...');
    const searchRes = await axios.get('https://remotive.com/api/remote-jobs?category=software-dev&limit=1');
    const job = searchRes.data.jobs[0];
    const jobText = `Job Title: ${job.title}. Category: ${job.category}. Description: ${job.description.replace(/<[^>]+>/g, '').substring(0, 500)}`;
    
    console.log('Generating job embedding...');
    const jobEmb = await generateEmbedding(jobText);

    console.log('Generating profile embedding for "Software Engineer"...');
    const profileEmb = await generateEmbedding('Target Role: Software Engineer. Skills: React, Node.js, JavaScript.');

    const similarity = computeCosineSimilarity(jobEmb, profileEmb);
    console.log(`Similarity: ${similarity}`);
}

testMatch().catch(console.error);
