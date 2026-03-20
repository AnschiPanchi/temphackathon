import express from 'express';
// Using protect depending on if it exists, but for now just raw routes
// import { protect } from '../middleware/auth.js';
import JobMatch from '../models/JobMatch.js';
import Notification from '../models/Notification.js';
import { fetchAndMatchJobs } from '../scripts/jobSync.js';

const router = express.Router();

// GET /api/jobs/recommended/:userId
router.get('/recommended/:userId', async (req, res) => {
    try {
        const jobs = await JobMatch.find({ userId: req.params.userId })
                                   .sort({ similarityScore: -1 })
                                   .limit(20);
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
