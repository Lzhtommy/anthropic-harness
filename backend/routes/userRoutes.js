import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authUser, getUserProfile } from '../controllers/userController.js';

const router = express.Router();

router.post('/login', authUser);
router.get('/profile', protect, getUserProfile);

export default router;
