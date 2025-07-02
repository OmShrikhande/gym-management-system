import express from 'express';
import { protect } from '../controllers/authController.js';
import { joinGym } from '../controllers/memberController.js';

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

// Member routes
router.post('/join-gym', joinGym);

export default router;