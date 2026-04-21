import express from 'express';
// Using protect depending on if it exists, but for now just raw routes
// import { protect } from '../middleware/auth.js';
import JobMatch from '../models/JobMatch.js';
import Notification from '../models/Notification.js';
import { fetchAndMatchJobs } from '../scripts/jobSync.js';
import User from '../models/User.js';

const router = express.Router();

// GET /api/jobs/recommended/:userId
router.get('/recommended/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('targetJob');
        const targetField = String(req.query.targetField || user?.targetJob || '').trim().toLowerCase();

        let jobs = await JobMatch.find({ userId: req.params.userId })
            .sort({ similarityScore: -1, createdAt: -1 });

        if (targetField) {
            const targetTokens = targetField.split(/\s+/).filter(t => t.length > 2);
            jobs = jobs.filter(job => {
                const hay = `${job.jobTitle || ''} ${job.description || ''}`.toLowerCase();
                return targetTokens.some(token => hay.includes(token));
            });
        }

        res.json(jobs);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch jobs" });
    }
});

// GET /api/jobs/notifications/:userId
router.get('/notifications/:userId', async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.params.userId })
                                                .sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
});

// PUT /api/jobs/notifications/:id/read
router.put('/notifications/:id/read', async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { read: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to update notification" });
    }
});

// POST /api/jobs/test-sync
router.post('/test-sync', async (req, res) => {
    try {
        const { userId } = req.body;
        await fetchAndMatchJobs(userId);
        
        // Count matches for this user specifically
        const matchesCount = await JobMatch.countDocuments({ userId });
        res.json({ success: true, message: `Sync complete. Scanned Remotive and matched ${matchesCount} jobs for your profile!`, count: matchesCount });
    } catch (error) {
         console.error("Job sync route error:", error);
         res.status(500).json({ error: "Sync failed" });
    }
});



export default router;
