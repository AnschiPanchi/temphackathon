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
import duelRoutes from './routes/duel.js';
import cron from 'node-cron';
import { fetchAndMatchJobs } from './scripts/jobSync.js';

import { createServer } from 'http';
import { Server } from 'socket.io';
import duelSocket from './sockets/duelSocket.js';

const app = express();
const isVercel = Boolean(process.env.VERCEL);
const server = !isVercel ? createServer(app) : null;
let dbConnectPromise = null;

const ensureDbConnected = async () => {
    if (!dbConnectPromise) {
        dbConnectPromise = connectDB();
    }
    return dbConnectPromise;
};

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
    : [
        'https://temphackathon.vercel.app',
        'https://algoprepp.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000'
    ];

const corsOptions = {
    origin: (origin, callback) => {
        // Allow non-browser clients (no origin) and explicitly whitelisted browser origins.
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
};

let io = null;
if (!isVercel) {
    io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ['GET', 'POST']
        }
    });
}

const PORT = process.env.PORT || 5000;

app.use(cors({
    ...corsOptions
}));
app.options(/.*/, cors(corsOptions));
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running' });
});

app.use(async (req, res, next) => {
    try {
        await ensureDbConnected();
        next();
    } catch (err) {
        next(err);
    }
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
app.use('/api/duel', duelRoutes);

if (!isVercel) {
    // Keep cron + sockets only for persistent server environments.
    cron.schedule('*/15 * * * *', () => {
        console.log('Running scheduled AI Job Matching (Testing - Every 2 mins)...');
        fetchAndMatchJobs();
    });

    duelSocket(io);

    // Wait for MongoDB to connect BEFORE accepting requests in local/server mode.
    ensureDbConnected().then(() => {
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }).catch(err => {
        console.error('Failed to connect to MongoDB, server not started:', err.message);
        process.exit(1);
    });
}

app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

export default app;
