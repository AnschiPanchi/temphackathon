import express from 'express';
import verifyToken from '../middleware/auth.js';
import * as aiController from '../controllers/aiController.js';

const router = express.Router();

router.post('/generate-question', verifyToken, aiController.generateQuestion);
router.post('/review', verifyToken, aiController.reviewSubmission);
router.post('/hint', aiController.getHint);
router.post('/chat', aiController.chatMentor);
router.post('/recommend-topic', verifyToken, aiController.recommendTopic);
router.post('/job-skills', verifyToken, aiController.analyzeSkillGap);
router.post('/study-guide', aiController.generateStudyGuide);
router.get('/mentor/:userId', verifyToken, aiController.getMentorAdvice);
router.get('/mentor-pro/:userId', verifyToken, aiController.getMentorProAdvice);
router.get('/projects/recommend/:userId', verifyToken, aiController.recommendProjects);
router.post('/practice/generate-task', verifyToken, aiController.generatePracticeTask);

export default router;
