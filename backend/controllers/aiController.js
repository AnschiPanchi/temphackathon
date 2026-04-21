import Attempt from '../models/Attempt.js';
import User from '../models/User.js';
import JobMatch from '../models/JobMatch.js';
import ProjectRecommendation from '../models/ProjectRecommendation.js';
import PracticeTask from '../models/PracticeTask.js';
import { checkAchievements } from '../utils/achievementEngine.js';
import { getAiClient, getAiModel, parseJSONResponse } from '../services/aiService.js';

// --- Fallback Templates ---
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

// --- Controller Methods ---

export const generateQuestion = async (req, res) => {
    try {
        const ai = getAiClient();
        if (!ai) return res.status(503).json({ error: "AI API key not configured on server." });
        
        const { mode, topics = [], difficulty, solvedQuestions = [] } = req.body;
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: "User not found" });
        
        let targetTopics = topics;
        if (mode === 'ai-recommended') {
            const jobMatches = await JobMatch.find({ userId: req.userId }).select('missingSkills');
            const missingSkills = [...new Set(jobMatches.flatMap(m => m.missingSkills || []))];
            targetTopics = missingSkills.length > 0 ? missingSkills : ['General Problem Solving'];
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

        const model = getAiModel();
        let response;
        try {
            response = await ai.chat.completions.create({
                model: model,
                messages: [{ role: "system", content: prompt }],
                response_format: { type: "json_object" }
            });
        } catch (jsonError) {
            response = await ai.chat.completions.create({
                model: model,
                messages: [{ role: "system", content: prompt }]
            });
        }

        res.json(parseJSONResponse(response.choices[0].message.content));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const reviewSubmission = async (req, res) => {
    try {
        const ai = getAiClient();
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
  "score": 85, 
  "feedback": "Overall impression...",
  "strengths": ["...", "..."],
  "areasForImprovement": ["...", "..."],
  "timeComplexity": "O(N) - explain why",
  "spaceComplexity": "O(1) - explain why"
}`;

        const model = getAiModel();
        let response;
        try {
            response = await ai.chat.completions.create({
                model: model,
                messages: [{ role: "system", content: prompt }],
                response_format: { type: "json_object" }
            });
        } catch (jsonError) {
            response = await ai.chat.completions.create({
                model: model,
                messages: [{ role: "system", content: prompt }]
            });
        }

        let reviewData = parseJSONResponse(response.choices[0].message.content);

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

        const interviewCount = await Attempt.countDocuments({ userId: req.userId });
        const earned = await checkAchievements(user, { interviewsCount: interviewCount });

        res.json({ ...reviewData, earnedAchievements: earned });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getHint = async (req, res) => {
    try {
        const ai = getAiClient();
        if (!ai) return res.status(503).json({ error: 'AI API key not configured' });
        const { question, hintsAlreadyGiven = [] } = req.body;

        const previousHints = hintsAlreadyGiven.length > 0
            ? `Previous hints already given:\n${hintsAlreadyGiven.map((h, i) => `${i + 1}. ${h}`).join('\n')}\n\nGive a DIFFERENT, more specific hint.`
            : '';

        const prompt = `You are a Socratic coding mentor helping someone solve a DSA problem WITHOUT giving away the answer.
Problem: ${question.title}
Description: ${question.description}
${previousHints}
ONE short useful hint (2-3 sentences max). Respond in JSON: { "hint": "..." }`;

        const response = await ai.chat.completions.create({
            model: getAiModel(),
            messages: [{ role: "system", content: prompt }],
            response_format: { type: "json_object" }
        });
        res.json(parseJSONResponse(response.choices[0].message.content));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const chatMentor = async (req, res) => {
    try {
        const ai = getAiClient();
        if (!ai) return res.status(503).json({ error: 'AI API key not configured' });
        const { question, message, history = [] } = req.body;
        const systemPrompt = `You are a supportive AI coding mentor helping a student during a mock interview.
Problem: ${question?.title || 'Unknown'}
Rules: Guide thinking, explain concepts, be encouraging.`;

        const messages = [{ role: "system", content: systemPrompt }, ...history, { role: "user", content: message }];
        const response = await ai.chat.completions.create({ model: getAiModel(), messages });
        res.json({ reply: response.choices[0].message.content.trim() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const recommendTopic = async (req, res) => {
    try {
        const ai = getAiClient();
        if (!ai) return res.status(503).json({ error: "AI API key missing" });
        const { skills, targetJob } = req.body;
        const prompt = `Recommend one DSA topic for a candidate with skills: ${skills.join(', ')} and target job: ${targetJob}. Respond in JSON: { "topic": "...", "reason": "..." }`;
        const response = await ai.chat.completions.create({
            model: getAiModel(),
            messages: [{ role: "system", content: prompt }],
            response_format: { type: "json_object" }
        });
        res.json(parseJSONResponse(response.choices[0].message.content));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const analyzeSkillGap = async (req, res) => {
    try {
        const ai = getAiClient();
        const { targetJob, skills } = req.body;
        const prompt = `Analyze what technical skills are missing to land ${targetJob}. Target Job: ${targetJob}, Current: ${skills.join(', ')}. Respond in JSON: { "verdict": "...", "missingSkills": [{ "skill": "...", "reason": "..." }] }`;
        const response = await ai.chat.completions.create({
            model: getAiModel(),
            messages: [{ role: "system", content: prompt }],
            response_format: { type: "json_object" }
        });
        res.json(parseJSONResponse(response.choices[0].message.content));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const generateStudyGuide = async (req, res) => {
    try {
        const ai = getAiClient();
        const { topic } = req.body;
        const prompt = `Create study guide for ${topic}. Include cheatSheet, interviewQuestions, and microChallenge. Respond in JSON.`;
        const response = await ai.chat.completions.create({
            model: getAiModel(),
            messages: [{ role: "system", content: prompt }],
            response_format: { type: "json_object" }
        });
        res.json(parseJSONResponse(response.choices[0].message.content));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getMentorAdvice = async (req, res) => {
    try {
        const ai = getAiClient();
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ error: "User not found" });
        const jobMatches = await JobMatch.find({ userId: req.params.userId }).select('missingSkills jobTitle company');
        const missingSkills = [...new Set(jobMatches.flatMap(m => m.missingSkills || []))];
        
        if (!ai) return res.json(buildMentorFallback(user, missingSkills));

        const prompt = `Generate premium career guidance for ${user.username} targeting ${user.targetJob}. Skills: ${user.skills?.join(', ')}. Missing: ${missingSkills.join(', ')}. Respond in JSON.`;
        const response = await ai.chat.completions.create({
            model: getAiModel(),
            messages: [{ role: "system", content: prompt }],
            response_format: { type: "json_object" }
        });
        res.json(parseJSONResponse(response.choices[0].message.content));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getMentorProAdvice = async (req, res) => {
    try {
        const ai = getAiClient();
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ error: "User not found" });
        const jobMatches = await JobMatch.find({ userId: req.params.userId }).select('missingSkills jobTitle');
        const missingSkills = [...new Set(jobMatches.flatMap(m => m.missingSkills || []))];

        if (!ai) return res.json(buildMentorProFallback(user, missingSkills));

        const prompt = `Generate elite Career Mentor PRO plan for ${user.username}. Target: ${user.targetJob}. Missing: ${missingSkills.join(', ')}. Respond in JSON.`;
        const response = await ai.chat.completions.create({
            model: getAiModel(),
            messages: [{ role: "system", content: prompt }],
            response_format: { type: "json_object" }
        });
        res.json(parseJSONResponse(response.choices[0].message.content));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const recommendProjects = async (req, res) => {
    try {
        const ai = getAiClient();
        const user = await User.findById(req.params.userId);
        const jobMatches = await JobMatch.find({ userId: req.params.userId }).select('missingSkills');
        const missingSkills = [...new Set(jobMatches.flatMap(m => m.missingSkills || []))];

        const prompt = `Generate 3 project ideas for ${user.targetJob} using ${user.skills.join(', ')} and missing: ${missingSkills.join(', ')}. Respond in JSON.`;
        const response = await ai.chat.completions.create({
            model: getAiModel(),
            messages: [{ role: "system", content: prompt }],
            response_format: { type: "json_object" }
        });
        const data = parseJSONResponse(response.choices[0].message.content);
        await ProjectRecommendation.deleteMany({ userId: user._id });
        const saved = await Promise.all(data.projects.map(p => ProjectRecommendation.create({ userId: user._id, ...p })));
        res.json(saved);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const generatePracticeTask = async (req, res) => {
    try {
        const ai = getAiClient();
        const { skill, targetJob } = req.body;
        const prompt = `Generate one practical challenge for skill: ${skill} targeting job: ${targetJob}. Respond in JSON.`;
        const response = await ai.chat.completions.create({
            model: getAiModel(),
            messages: [{ role: "system", content: prompt }],
            response_format: { type: "json_object" }
        });
        const data = parseJSONResponse(response.choices[0].message.content);
        const newTask = await PracticeTask.create({ userId: req.userId, skill, ...data });
        res.json(newTask);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
