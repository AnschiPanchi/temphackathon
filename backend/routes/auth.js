import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import verifyToken from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, getMe);

// Placeholder for forgot-password
router.post('/forgot-password', (req, res) => {
    res.status(501).json({ error: 'Reset password is temporarily disabled.' });
});

export default router;
