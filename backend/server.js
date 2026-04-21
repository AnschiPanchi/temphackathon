import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import aiRoutes from './routes/ai.js';
import performanceRoutes from './routes/performance.js';
import settingsRoutes from './routes/settings.js';
import leaderboardRoutes from './routes/leaderboard.js';
import executeRoutes from './routes/execute.js';
import onboardingRoutes from './routes/onboarding.js';
import quizRoutes from './routes/quiz.js';
import achievementRoutes from './routes/achievements.js';
import jobRoutes from './routes/jobRoutes.js';
import questsRoutes from './routes/quests.js';
import cron from 'node-cron';
import { fetchAndMatchJobs } from './scripts/jobSync.js';

import { createServer } from 'http';
import { Server } from 'socket.io';
import duelSocket from './sockets/duelSocket.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/auth', settingsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/execute', executeRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/quests', questsRoutes);

// Run every 2 minutes for testing
cron.schedule('*/15 * * * *', () => {
    console.log('Running scheduled AI Job Matching (Testing - Every 2 mins)...');
    fetchAndMatchJobs();
});

// Initialize Socket.io Duel Logic
duelSocket(io);

// Wait for MongoDB to connect BEFORE accepting requests
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to connect to MongoDB, server not started:', err.message);
    process.exit(1);
});
