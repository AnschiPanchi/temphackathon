import { pipeline, dot } from '@xenova/transformers';

// Singleton for Pipeline
let extractor;

const getExtractor = async () => {
    if (!extractor) {
        // Load the all-MiniLM-L6-v2 model directly in Node.js
        extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return extractor;
};

// Generate Embeddings
export const generateEmbedding = async (text) => {
    const ext = await getExtractor();
    const output = await ext(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
};

// Cosine Similarity between two normalized vectors is just their dot product
export const computeCosineSimilarity = (vecA, vecB) => {
    let dotProduct = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
    }
    return dotProduct;
};

// Bonus: Missing Skills calculation
export const getMissingSkills = (userSkills, jobDescription) => {
    const commonTechSkills = ['node.js', 'react', 'mongodb', 'docker', 'aws', 'python', 'java', 'sql', 'express', 'git', 'javascript', 'typescript', 'vue', 'angular', 'c++', 'c#', 'php', 'ruby'];
    const jobDescLower = jobDescription.toLowerCase();
    
    // Find skills mentioned in Job Description
    const jobRequires = commonTechSkills.filter(skill => jobDescLower.includes(skill));
    
    // Normalize user skills for comparison
    const normalizedUserSkills = userSkills.map(s => s.toLowerCase());
    
    // Calculate missing
    const missing = jobRequires.filter(skill => !normalizedUserSkills.includes(skill));
    return missing;
};
