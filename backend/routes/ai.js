import express from 'express';
import OpenAI from 'openai';
import Attempt from '../models/Attempt.js';
import User from '../models/User.js';
import JobMatch from '../models/JobMatch.js';
import ProjectRecommendation from '../models/ProjectRecommendation.js';
import PracticeTask from '../models/PracticeTask.js';
import verifyToken from '../middleware/auth.js';
import { checkAchievements } from '../utils/achievementEngine.js';

const router = express.Router();

// Helper to get AI instance safely when the route is called
// It checks for Groq first, then OpenAI fallback.
const getAi = () => {
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

const getModel = () => {
    // We default to llama 3.3 for Groq and gpt-4o-mini for OpenAI to ensure speed and low cost
    return process.env.GROQ_API_KEY ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';
};

// Helper to safely parse JSON from AI response, stripping markdown formatting if present
const parseJSONResponse = (text) => {
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

const buildMentorFallback = (user, missingSkills = [], recommendedJobsContext = '') => {
    const nextSkills = missingSkills.length > 0
        ? missingSkills.slice(0, 4).map(skill => `${skill}: Focus on this to align with current job requirements.`)
        : [
            'Data Structures & Algorithms: Strengthen interview fundamentals and speed.',
            'System Design Basics: Improve architecture discussions in interviews.',
            'Project Communication: Explain trade-offs and impact clearly.'
        ];

    return {
        nextSkills,
        projectIdeas: [
            `Build an end-to-end portfolio project for ${user?.targetJob || 'Software Engineer'} with authentication, dashboards, and deployment.`,
            'Create a measurable case study: define a problem, build a solution, and share before/after impact metrics.'
        ],
        portfolioTips: [
            'Rewrite top 3 resume bullets using impact metrics (latency, users, conversions, or uptime).',
            'Pin 2 polished repositories with clear README, architecture diagram, and demo screenshots.'
        ],
        linkedinPostIdeas: [
            'Post a weekly build log with one technical challenge, one lesson, and one metric.',
            `Share insights from job trends you observed${recommendedJobsContext ? `: ${recommendedJobsContext}` : ''}.`
        ],
        careerAdvice: `You are making solid progress toward ${user?.targetJob || 'your target role'}. Keep your focus on consistent project execution, improving interview storytelling, and closing the highest-impact skill gaps one by one.`
    };
};

const buildMentorProFallback = (user, missingSkills = []) => ({
    careerAdvice: `Your profile has strong momentum for ${user?.targetJob || 'your target role'}. Prioritize shipping visible projects and strengthening missing skills through deliberate weekly practice.`,
    roadmap: [
        'Step 1: Pick one core missing skill and complete a focused 7-day learning sprint.',
        'Step 2: Build and deploy one portfolio project that proves this skill in production.',
        'Step 3: Practice interview explanations: architecture, trade-offs, and measurable impact.',
        'Step 4: Apply to matching roles and iterate based on interview feedback weekly.'
    ],
    projectRecommendations: [
        `Build a job-ready capstone for ${user?.targetJob || 'Software Engineer'} using ${missingSkills.slice(0, 2).join(' + ') || 'modern backend + frontend tooling'}.`
    ],
    linkedinSuggestions: [
        'Publish a post: what you built this week, one technical obstacle, and how you solved it.',
        'Share a concise architecture breakdown of your project with lessons learned.'
    ],
    nextSkills: missingSkills.length > 0 ? missingSkills.slice(0, 5) : ['System Design', 'APIs', 'Testing']
});

router.post('/generate-question', verifyToken, async (req, res) => {
    try {
        console.log('[DEBUG] /generate-question called with mode:', req.body.mode);
        
        const ai = getAi();
        if (!ai) {
            console.error('[ERROR] AI client not initialized. Check GROQ_API_KEY or OPENAI_API_KEY');
            return res.status(503).json({ error: "AI API key not configured on server." });
        }
        
        const { mode, topics = [], difficulty, solvedQuestions = [] } = req.body;
        console.log('[DEBUG] Parameters:', { mode, topics, difficulty, solvedQuestionsCount: solvedQuestions.length });

        const user = await User.findById(req.userId);
        if (!user) {
            console.error('[ERROR] User not found:', req.userId);
            return res.status(404).json({ error: "User not found" });
        }
        
        let targetTopics = topics;
        if (mode === 'ai-recommended') {
            const jobMatches = await JobMatch.find({ userId: req.userId }).select('missingSkills');
            const missingSkills = [...new Set(jobMatches.flatMap(m => m.missingSkills || []))];
            targetTopics = missingSkills.length > 0 ? missingSkills : ['General Problem Solving'];
            console.log('[DEBUG] AI-recommended topics:', targetTopics);
        }

        const avoidanceRule = solvedQuestions.length > 0
            ? `\nCRITICAL: DO NOT GENERATE ANY OF THE FOLLOWING QUESTIONS THAT THE CANDIDATE HAS ALREADY SOLVED:\n${solvedQuestions.map(q => `- ${q}`).join('\n')}\n`
            : '';

        const prompt = `You are an expert technical interviewer.
        
User Profile:
Target Role: ${user?.targetJob || 'Software Engineer'}
Selected Practice Topics: ${targetTopics.join(', ') || 'General Problem Solving'}

Task:
Generate a practice technical question related to these topics.
If multiple topics are selected, combine them logically or focus on the most important one.
Dynamically determine the domain (e.g., Web Development, Backend API, React, Blockchain, DSA, Databases, System Design). Do NOT default to DSA unless the selected topics specifically require algorithmic logic.

Difficulty: ${difficulty || 'Medium'}
${avoidanceRule}

CRITICAL INSTRUCTIONS FOR TEST CASES:
1. "testCases" MUST contain 3-5 valid test cases.
2. Each test case MUST have "input" and "expectedOutput".
3. "input" should be the exact arguments to pass to the solve function (e.g., "[1, 2, 3]" for an array, "5" for a number, "\\"abc\\"" for a string).
4. "starterCode" MUST use a class named "Solution" with a method named "solve" for Java and C++.
5. Java "solve" should be public. C++ "solve" should be public.

Provide the response in the following JSON format ONLY:
{
  "title": "Question Title",
  "description": "Clear problem description...",
  "examples": [
    { "input": "...", "output": "...", "explanation": "..." }
  ],
  "constraints": ["constraint 1", "constraint 2"],
  "testCases": [
    { "input": "[1, 2, 3]", "expectedOutput": "6" },
    { "input": "[0, 0, 0]", "expectedOutput": "0" }
  ],
  "starterCode": {
    "javascript": "function solve(arr) {\\n  // your code here\\n}",
    "python": "def solve(arr):\\n    # your code here\\n    pass",
    "java": "public class Solution {\\n    public int solve(int[] arr) {\\n        // your code here\\n        return 0;\\n    }\\n}",
    "cpp": "class Solution {\\npublic:\\n    int solve(vector<int>& arr) {\\n        // your code here\\n        return 0;\\n    }\\n};"
  }
}`;

        const model = getModel();
        console.log('[DEBUG] Using AI model:', model);
        
        let response;
        try {
            // Try with strict JSON format first (preferred)
            response = await ai.chat.completions.create({
                model: model,
                messages: [{ role: "system", content: prompt }],
                response_format: { type: "json_object" }
            });
        } catch (jsonError) {
            console.warn('[WARN] JSON format not supported, retrying without strict format:', jsonError.message);
            // Fallback: try without strict JSON format
            response = await ai.chat.completions.create({
                model: model,
                messages: [{ role: "system", content: prompt }]
            });
        }

        console.log('[DEBUG] API response received, parsing...');
        let questionData = parseJSONResponse(response.choices[0].message.content);
        console.log('[DEBUG] Question generated successfully:', questionData.title);
        res.json(questionData);
    } catch (error) {
        console.error('[ERROR] Exception in /generate-question:', error.message);
        console.error('[ERROR] Full error details:', error);
        res.status(500).json({ 
            error: "Failed to generate question: " + error.message,
            details: error.response?.data || error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.post('/review', verifyToken, async (req, res) => {
    try {
        const ai = getAi();
        if (!ai) return res.status(503).json({ error: "AI API key not configured on server" });
        const { question, language, code, approach } = req.body;

        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const prompt = `You are a supportive but rigorous technical interviewer. 
Review the following user submission for a DSA problem.

Problem: 
${JSON.stringify(question)}

Language Use: ${language || 'Unknown'}

User's Code:
${code || 'No code provided.'}

User's Approach/Explanation:
${approach || 'No explanation provided.'}

Provide your feedback in the following JSON format ONLY:
{
  "score": 85, // out of 100
  "feedback": "Overall impression...",
  "strengths": ["...", "..."],
  "areasForImprovement": ["...", "..."],
  "timeComplexity": "O(N) - explain why",
  "spaceComplexity": "O(1) - explain why"
}`;

        let response;
        try {
            response = await ai.chat.completions.create({
                model: getModel(),
                messages: [{ role: "system", content: prompt }],
                response_format: { type: "json_object" }
            });
        } catch (jsonError) {
            console.warn('[WARN] JSON format not supported in /review, retrying without strict format:', jsonError.message);
            response = await ai.chat.completions.create({
                model: getModel(),
                messages: [{ role: "system", content: prompt }]
            });
        }

        let reviewData = parseJSONResponse(response.choices[0].message.content);

        // Persistent persistence: Save the interview attempt
        const attempt = new Attempt({
            userId: req.userId,
            topic: question.topic || "General",
            difficulty: question.difficulty || "Medium",
            question: question.title,
            code: code,
            score: reviewData.score,
            feedbackSummary: reviewData.feedback,
            strengths: reviewData.strengths,
            areasForImprovement: reviewData.areasForImprovement
        });
        await attempt.save();

        // Check achievements: Specifically count total interviews
        const interviewCount = await Attempt.countDocuments({ userId: req.userId });
        const earned = await checkAchievements(user, { interviewsCount: interviewCount });

        res.json({ ...reviewData, earnedAchievements: earned });
    } catch (error) {
        console.error("[ERROR] Error reviewing submission:", error.message);
        console.error("[ERROR] Full error details:", error);
        res.status(500).json({ 
            error: "Failed to review submission: " + error.message,
            details: error.response?.data || error.message
        });
    }
});


router.post('/hint', async (req, res) => {
    try {
        const ai = getAi();
        if (!ai) return res.status(503).json({ error: 'AI API key not configured' });
        const { question, hintsAlreadyGiven = [] } = req.body;

        const previousHints = hintsAlreadyGiven.length > 0
            ? `Previous hints already given:\n${hintsAlreadyGiven.map((h, i) => `${i + 1}. ${h}`).join('\n')}\n\nGive a DIFFERENT, more specific hint.`
            : '';

        const prompt = `You are a Socratic coding mentor helping someone solve a DSA problem WITHOUT giving away the answer.

Problem: ${question.title}
Description: ${question.description}

${previousHints}

Give ONE short but useful hint (2-3 sentences max). 
- Guide their THINKING (e.g. "Consider what data structure allows O(1) lookups")
- Do NOT write any code
- Do NOT reveal the algorithm or solution directly
- Be encouraging

Respond in JSON: { "hint": "your hint here" }`;

        let response;
        try {
            response = await ai.chat.completions.create({
                model: getModel(),
                messages: [{ role: "system", content: prompt }],
                response_format: { type: "json_object" }
            });
        } catch (jsonError) {
            console.warn('[WARN] JSON format not supported in /hint, retrying without strict format:', jsonError.message);
            response = await ai.chat.completions.create({
                model: getModel(),
                messages: [{ role: "system", content: prompt }]
            });
        }

        let hintData = parseJSONResponse(response.choices[0].message.content);
        res.json({ hint: hintData.hint });
    } catch (error) {
        console.error('[ERROR] Error generating hint:', error.message);
        res.status(500).json({ error: 'Failed to generate hint: ' + error.message });
    }
});


router.post('/chat', async (req, res) => {
    try {
        const ai = getAi();
        if (!ai) return res.status(503).json({ error: 'AI API key not configured' });
        const { question, message, history = [] } = req.body;

        const systemPrompt = `You are a supportive AI coding mentor helping a student during a mock interview.
The student is solving this problem:
Title: ${question?.title || 'Unknown'}
Description: ${question?.description || ''}

Rules:
- Guide their thinking WITHOUT giving away the full solution or writing code for them
- You CAN explain concepts, time/space complexity, and point them in the right direction
- Be encouraging, concise (2-4 sentences), and conversational
- If asked directly for the answer, redirect them to think about it themselves`;

        const messages = [
            { role: "system", content: systemPrompt },
            ...history.map(h => ({
                role: h.role === 'user' ? 'user' : 'assistant',
                content: h.content
            })),
            { role: "user", content: message }
        ];

        const response = await ai.chat.completions.create({
            model: getModel(),
            messages,
        });

        res.json({ reply: response.choices[0].message.content.trim() });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to get AI response' });
    }
});

router.post('/recommend-topic', verifyToken, async (req, res) => {
    try {
        const ai = getAi();
        if (!ai) return res.status(503).json({ error: "AI API key not configured on server" });
        const { skills, targetJob } = req.body;
        const userId = req.userId;

        // Fetch user attempts to find weak topics
        let weakTopicsContext = "";
        try {
            if (userId) {
                const attempts = await Attempt.find({ userId: userId });
                if (attempts.length > 0) {
                    const topicMap = {};
                    attempts.forEach(a => {
                        if (!a.topic) return;
                        if (!topicMap[a.topic]) topicMap[a.topic] = { total: 0, count: 0 };
                        topicMap[a.topic].total += a.score;
                        topicMap[a.topic].count++;
                    });
                    
                    const topicBreakdown = Object.entries(topicMap)
                        .map(([topic, { total, count }]) => ({ topic, avg: Math.round(total / count) }))
                        .sort((a, b) => a.avg - b.avg); // Sort ascending (weakest first)
                    
                    const weakTopics = topicBreakdown.filter(t => t.avg < 70).slice(0, 3).map(t => `${t.topic} (Avg Score: ${t.avg})`);
                    if (weakTopics.length > 0) {
                        weakTopicsContext = `\nCRITICAL CONTEXT: The candidate has historically struggled with these topics in past interviews: ${weakTopics.join(', ')}. Factor this into your recommendation.`;
                    } else {
                        weakTopicsContext = `\nThe candidate has no drastically weak topics on record, so focus on their tech stack or target job.`;
                    }
                }
            }
        } catch(e) { console.error("Could not fetch attempts for weak topic analysis", e); }

        const skillsContext = (skills && skills.length > 0) 
            ? `The candidate has the following skills/tech stack: ${skills.join(', ')}.`
            : `The candidate has not provided specific technical skills yet.`;
            
        const jobContext = targetJob
            ? `\nThe candidate's ultimate career goal is: "${targetJob}".`
            : "";

        const prompt = `You are an expert technical interviewer and career coach.
${skillsContext}${jobContext}${weakTopicsContext}

Based on this complete profile (skills, weak mock interview topics, and target job), recommend ONE highly relevant Data Structures and Algorithms (DSA) topic for them to practice next to improve their interview readiness.

Provide the response in the following JSON format ONLY, without any markdown formatting or extra text:
{
  "topic": "The exact name of the topic (e.g., 'Graphs', 'Dynamic Programming', 'Sliding Window', 'Trees')",
  "reason": "A motivational, personalized 1-2 sentence explanation of why this topic is perfect for them based on their specific weak areas, target job, or skillset."
}`;

        const response = await ai.chat.completions.create({
            model: getModel(),
            messages: [{ role: "system", content: prompt }],
            response_format: { type: "json_object" }
        });

        let data = parseJSONResponse(response.choices[0].message.content);
        res.json(data);
    } catch (error) {
        console.error("Error generating topic recommendation:", error);
        res.status(500).json({ error: "Failed to generate recommendation: " + error.message });
    }
});

router.post('/job-skills', verifyToken, async (req, res) => {
    try {
        const ai = getAi();
        if (!ai) return res.status(503).json({ error: "AI API key not configured on server" });
        const { skills, targetJob } = req.body;

        if (!targetJob) return res.status(400).json({ error: "Target job is required to generate a learning path." });

        const skillsContext = (skills && skills.length > 0) 
            ? `Current skills: ${skills.join(', ')}.`
            : `Current skills: None provided.`;

        const prompt = `You are an expert technical career counselor.
Target Job: ${targetJob}
${skillsContext}

Analyze what crucial technical skills or technologies the candidate is missing to successfully land their Target Job.
Identify the top 3-5 concrete technical skills they need to learn. 

Provide the response in the following JSON format ONLY, without any markdown formatting or extra text:
{
  "verdict": "A 1-2 sentence summary of their current standing towards this job and an encouraging word.",
  "missingSkills": [
    {
      "skill": "Name of the technology/skill",
      "reason": "A concise, 1-sentence explanation of why this is required for the target job."
    }
  ]
}`;

        const response = await ai.chat.completions.create({
            model: getModel(),
            messages: [{ role: "system", content: prompt }],
            response_format: { type: "json_object" }
        });

        let data = parseJSONResponse(response.choices[0].message.content);
        res.json(data);
    } catch (error) {
        console.error("Error generating skill gap:", error);
        res.status(500).json({ error: "Failed to generate skill gap analysis: " + error.message });
    }
});

router.post('/study-guide', async (req, res) => {
    try {
        const ai = getAi();
        if (!ai) return res.status(503).json({ error: "AI API key not configured on server" });
        const { topic } = req.body;

        const prompt = `You are an expert technical coach. Create a comprehensive, concise study guide for the topic: "${topic}".
        Include:
        1. A "cheatSheet" (3-5 key concepts with brief explanations).
        2. "interviewQuestions" (3 common conceptual questions and short answers).
        3. A "microChallenge" (A 5-10 line code snippet with a logical BUG that the user must find/fix. Provide "snippet", "hint", and "solution").

        Provide the response in the following JSON format ONLY:
        {
          "topic": "${topic}",
          "cheatSheet": [
            { "concept": "...", "explanation": "..." }
          ],
          "interviewQuestions": [
            { "question": "...", "answer": "..." }
          ],
          "microChallenge": {
            "snippet": "...",
            "hint": "...",
            "solution": "..."
          }
        }`;

        const response = await ai.chat.completions.create({
            model: getModel(),
            messages: [{ role: "system", content: prompt }],
            response_format: { type: "json_object" }
        });

        let data = parseJSONResponse(response.choices[0].message.content);
        res.json(data);
    } catch (error) {
        console.error("Error generating study guide:", error);
        res.status(500).json({ error: "Failed to generate study guide: " + error.message });
    }
});

router.get('/mentor/:userId', verifyToken, async (req, res) => {
    try {
        const ai = getAi();
        
        // 1. Fetch User Data
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        // 2. Fetch Job Match Data to find missing skills
        const jobMatches = await JobMatch.find({ userId: req.params.userId }).select('missingSkills jobTitle company');
        
        let allMissingSkills = [];
        let recommendedJobsContext = "";
        
        if (jobMatches.length > 0) {
            jobMatches.forEach(match => {
                if (match.missingSkills) allMissingSkills.push(...match.missingSkills);
            });
            // Grab a few recent job matches to add context
            recommendedJobsContext = jobMatches.slice(0, 3).map(j => `${j.jobTitle} at ${j.company}`).join(', ');
        }
        
        // Remove duplicate missing skills
        const uniqueMissingSkills = [...new Set(allMissingSkills)];

        // 3. Construct Context for Prompt
        const profileContext = `
            Target Role: ${user.targetJob || 'Unknown'}
            Current Skills: ${user.skills?.join(', ') || 'None provided'}
            Weak Topics (from mock interviews): ${user.weakTopics?.join(', ') || 'None recorded'}
            Identified Missing Skills from Job Matches: ${uniqueMissingSkills.join(', ') || 'None currently'}
            Recently Recommended Jobs: ${recommendedJobsContext || 'None yet'}
        `;

        // 4. Construct Prompt
        const prompt = `You are a world-class Premium Career AI Mentor. 
Your task is to provide personalized, actionable career guidance based on the user's data.

User Profile Data:
${profileContext}

Provide the response in the following JSON format ONLY, without any markdown formatting or extra text:
{
  "nextSkills": [
    "Skill 1: [Reason why they should learn it]",
    "Skill 2: [Reason]"
  ],
  "projectIdeas": [
    "1-2 sentence description of a portfolio project using their current and missing skills."
  ],
  "portfolioTips": [
    "Actionable tip to improve their resume/portfolio."
  ],
  "linkedinPostIdeas": [
    "Idea for a LinkedIn post to show authority and growth."
  ],
  "careerAdvice": "A highly motivational, specific paragraph summarizing their readiness and immediate next steps."
}`;

        if (!ai) {
            return res.json(buildMentorFallback(user, uniqueMissingSkills, recommendedJobsContext));
        }

        try {
            const response = await ai.chat.completions.create({
                model: getModel(),
                messages: [{ role: "system", content: prompt }],
                response_format: { type: "json_object" }
            });

            const content = response?.choices?.[0]?.message?.content || '';
            let mentorAdvice = parseJSONResponse(content);
            return res.json(mentorAdvice);
        } catch (aiError) {
            console.error("AI provider error in /mentor, using fallback:", aiError.message);
            return res.json(buildMentorFallback(user, uniqueMissingSkills, recommendedJobsContext));
        }

    } catch (error) {
        console.error("Error generating AI Mentor advice:", error);
        res.status(500).json({ error: "Failed to generate AI Mentor advice: " + error.message });
    }
});

router.get('/mentor-pro/:userId', verifyToken, async (req, res) => {
    try {
        const ai = getAi();
        
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const jobMatches = await JobMatch.find({ userId: req.params.userId }).select('missingSkills jobTitle');
        const missingSkills = [...new Set(jobMatches.flatMap(m => m.missingSkills || []))];

        const profileContext = `
            Target Role: ${user.targetJob || 'Unknown'}
            Current Skills: ${user.skills?.join(', ') || 'None provided'}
            Identified Missing Skills from Job Matches: ${missingSkills.join(', ') || 'None currently'}
        `;

        const prompt = `You are an elite Career Mentor PRO. You must generate a highly actionable career plan based on this user profile:
${profileContext}

CRITICAL: Return ONLY this fully structured JSON format. NEVER wrap in markdown blocks like \`\`\`json. Return pure JSON string:
{
  "careerAdvice": "A single, highly encouraging and motivational paragraph describing their career standing and what they should focus on.",
  "roadmap": [
    "Step 1: [Detailed action for their next phase]",
    "Step 2: [Next logical step]"
  ],
  "projectRecommendations": [
    "Short description of a strong portfolio project involving their missing skills"
  ],
  "linkedinSuggestions": [
    "A practical idea for a LinkedIn post demonstrating authority and continuous learning."
  ],
  "nextSkills": [
    "Skill 1", "Skill 2"
  ]
}`;

        if (!ai) {
            return res.json(buildMentorProFallback(user, missingSkills));
        }

        try {
            const response = await ai.chat.completions.create({
                model: getModel(),
                messages: [{ role: "system", content: prompt }],
                response_format: { type: "json_object" }
            });

            const content = response?.choices?.[0]?.message?.content || '';
            let data = parseJSONResponse(content);
            return res.json(data);
        } catch (aiError) {
            console.error("AI provider error in /mentor-pro, using fallback:", aiError.message);
            return res.json(buildMentorProFallback(user, missingSkills));
        }

    } catch (error) {
        console.error("Error generating AI Mentor Pro advice:", error);
        res.status(500).json({ error: "Failed to load AI Mentor Pro: " + error.message });
    }
});

router.get('/projects/recommend/:userId', verifyToken, async (req, res) => {
    try {
        const ai = getAi();
        if (!ai) return res.status(503).json({ error: "AI API key not configured on server" });
        const user = await User.findById(req.params.userId);
        
        // Fetch JobMatches to find missing skills
        const jobMatches = await JobMatch.find({ userId: req.params.userId }).select('missingSkills');
        const missingSkills = [...new Set(jobMatches.flatMap(m => m.missingSkills || []))];

        const prompt = `You are a Senior Career Mentor.
        User Target Role: ${user?.targetJob || 'Software Engineer'}
        Current Skills: ${user?.skills?.join(', ') || 'General basics'}
        Missing Skills (Requires Practice): ${missingSkills.join(', ') || 'Advanced frameworks'}
        
        Generate exactly 3 project ideas that specifically incorporate their "Missing Skills" while leveraging their "Current Skills".
        
        Provide the response in the following JSON format ONLY:
        {
            "projects": [
                {
                    "title": "Short catchy project name (e.g. Real-time Crypto Tracker)",
                    "description": "2-3 sentences explaining what this is and how it helps them learn the missing skill.",
                    "targetSkills": ["Skill 1", "Skill 2"],
                    "difficulty": "Medium",
                    "category": "Web Development"
                }
            ]
        }`;

        const response = await ai.chat.completions.create({
            model: getModel(),
            messages: [{ role: "system", content: prompt }],
            response_format: { type: "json_object" }
        });

        const data = parseJSONResponse(response.choices[0].message.content);
        
        await ProjectRecommendation.deleteMany({ userId: user._id }); // wipe old
        const savedProjects = await Promise.all(
            (data.projects || []).map(p => ProjectRecommendation.create({ userId: user._id, ...p }))
        );

        res.json(savedProjects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/practice/generate-task', verifyToken, async (req, res) => {
    try {
        const ai = getAi();
        if (!ai) return res.status(503).json({ error: "AI API key not configured on server" });
        const { skill, targetJob } = req.body;

        const prompt = `You are a Technical Assessment Generator.
        The candidate is training for: "${targetJob || 'Software Engineer'}".
        Their currently lacking skill is: "${skill}".

        Determine the domain of this skill (DSA, Web Development, Blockchain, Databases, APIs, DevOps, or System Design).
        Generate exactly ONE practical challenge for this specific skill.
        DO NOT default to DSA unless the skill is a DSA concept. 

        Provide the response in the following JSON format ONLY:
        {
            "category": "[The domain you assigned]",
            "problemTitle": "Catchy short title",
            "problemDescription": "Detailed scenario explaining the problem they need to solve using ${skill}. Include any constraints or specific instructions.",
            "difficulty": "Medium"
        }`;

        const response = await ai.chat.completions.create({
            model: getModel(),
            messages: [{ role: "system", content: prompt }],
            response_format: { type: "json_object" }
        });

        const data = parseJSONResponse(response.choices[0].message.content);

        const newTask = await PracticeTask.create({
            userId: req.userId,
            skill: skill,
            category: data.category,
            problemTitle: data.problemTitle,
            problemDescription: data.problemDescription,
            difficulty: data.difficulty
        });

        res.json(newTask);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
