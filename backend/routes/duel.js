import express from 'express';
import verifyToken from '../middleware/auth.js';
import DuelRoom from '../models/DuelRoom.js';
import User from '../models/User.js';
import { judgeDuel } from '../utils/judgeAgent.js';
import { checkAchievements } from '../utils/achievementEngine.js';

const router = express.Router();

const defaultProblem = {
    title: 'Two Sum',
    difficulty: 'Easy',
    desc: 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nExample: nums = [2,7,11,15], target = 9 -> Output: [0,1]',
    tags: ['Array', 'Hash Table']
};

const serializeRoom = (room) => ({
    roomId: room.roomId,
    players: room.players.map(p => ({ id: String(p.userId), username: p.username })),
    status: room.status,
    language: room.language,
    problem: room.problem,
    submissions: room.submissions.map(s => ({ username: s.username, submittedAt: s.submittedAt })),
    result: room.result || null
});

router.post('/join', verifyToken, async (req, res) => {
    try {
        const roomId = String(req.body?.roomId || '').trim().toUpperCase();
        if (!roomId) return res.status(400).json({ error: 'roomId is required' });

        const user = await User.findById(req.userId).select('username');
        if (!user) return res.status(404).json({ error: 'User not found' });

        let room = await DuelRoom.findOne({ roomId });

        if (!room) {
            room = await DuelRoom.create({
                roomId,
                players: [{ userId: req.userId, username: user.username }],
                status: 'waiting',
                language: 'javascript',
                problem: defaultProblem,
                submissions: []
            });
            return res.json(serializeRoom(room));
        }

        const alreadyInRoom = room.players.some(p => String(p.userId) === String(req.userId));

        if (!alreadyInRoom) {
            if (room.players.length >= 2) {
                return res.status(409).json({ error: 'Room is full' });
            }
            room.players.push({ userId: req.userId, username: user.username });
        }

        if (room.players.length === 2 && room.status === 'waiting') {
            room.status = 'duel';
        }

        await room.save();
        res.json(serializeRoom(room));
    } catch (err) {
        console.error('[DUEL] join error:', err);
        res.status(500).json({ error: 'Failed to join room' });
    }
});

router.get('/state/:roomId', verifyToken, async (req, res) => {
    try {
        const room = await DuelRoom.findOne({ roomId: String(req.params.roomId).toUpperCase() });
        if (!room) return res.status(404).json({ error: 'Room not found' });
        res.json(serializeRoom(room));
    } catch (err) {
        console.error('[DUEL] state error:', err);
        res.status(500).json({ error: 'Failed to fetch room state' });
    }
});

router.post('/language', verifyToken, async (req, res) => {
    try {
        const roomId = String(req.body?.roomId || '').trim().toUpperCase();
        const language = String(req.body?.language || 'javascript').trim().toLowerCase();
        const room = await DuelRoom.findOne({ roomId });
        if (!room) return res.status(404).json({ error: 'Room not found' });

        room.language = language;
        await room.save();
        res.json(serializeRoom(room));
    } catch (err) {
        console.error('[DUEL] language error:', err);
        res.status(500).json({ error: 'Failed to update language' });
    }
});

router.post('/submit', verifyToken, async (req, res) => {
    try {
        const roomId = String(req.body?.roomId || '').trim().toUpperCase();
        const code = String(req.body?.code || '');
        const language = String(req.body?.language || 'javascript').trim().toLowerCase();

        if (!roomId || !code.trim()) {
            return res.status(400).json({ error: 'roomId and code are required' });
        }

        const user = await User.findById(req.userId).select('username duelWins');
        if (!user) return res.status(404).json({ error: 'User not found' });

        const room = await DuelRoom.findOne({ roomId });
        if (!room) return res.status(404).json({ error: 'Room not found' });
        if (room.status === 'finished') return res.json(serializeRoom(room));

        const inRoom = room.players.some(p => String(p.userId) === String(req.userId));
        if (!inRoom) return res.status(403).json({ error: 'You are not in this room' });

        room.language = language;

        const existingIdx = room.submissions.findIndex(s => s.username === user.username);
        if (existingIdx >= 0) {
            room.submissions[existingIdx] = { username: user.username, code, language, submittedAt: new Date() };
        } else {
            room.submissions.push({ username: user.username, code, language, submittedAt: new Date() });
        }

        const playerUsernames = room.players.map(p => p.username);
        const allSubmitted = playerUsernames.every(name => room.submissions.some(s => s.username === name));

        if (allSubmitted && room.players.length === 2 && room.status !== 'finished') {
            room.status = 'judging';
            await room.save();

            const p1 = room.players[0].username;
            const p2 = room.players[1].username;
            const code1 = room.submissions.find(s => s.username === p1)?.code || '';
            const code2 = room.submissions.find(s => s.username === p2)?.code || '';

            const result = await judgeDuel(room.problem, code1, code2, p1, p2, room.language || 'javascript');
            room.result = result;
            room.status = 'finished';

            if (result?.winner && result.winner !== 'Draw' && result.winner !== 'Draw (System Failure)') {
                try {
                    const winner = await User.findOne({ username: result.winner });
                    if (winner) {
                        winner.duelWins = (winner.duelWins || 0) + 1;
                        await checkAchievements(winner);
                        await winner.save();
                    }
                } catch (e) {
                    console.error('[DUEL] winner update failed:', e.message);
                }
            }
        } else if (room.status === 'waiting' && room.players.length === 2) {
            room.status = 'duel';
        }

        await room.save();
        res.json(serializeRoom(room));
    } catch (err) {
        console.error('[DUEL] submit error:', err);
        res.status(500).json({ error: 'Failed to submit duel code' });
    }
});

export default router;
