import express from 'express';
import {
  createEnquiry,
  getEnquiries,
  getEnquiry,
  updateEnquiry,
  deleteEnquiry,
  getEnquiryStats
} from '../controllers/enquiryController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

// Routes accessible by gym-owner and trainers
router
  .route('/')
  .get(restrictTo('gym-owner', 'trainer'), getEnquiries)
  .post(restrictTo('gym-owner', 'trainer'), createEnquiry);

router.get('/stats', restrictTo('gym-owner', 'trainer'), getEnquiryStats);

router
  .route('/:id')
  .get(restrictTo('gym-owner', 'trainer'), getEnquiry)
  .patch(restrictTo('gym-owner', 'trainer'), updateEnquiry)
  .delete(restrictTo('gym-owner', 'trainer'), deleteEnquiry);

export default router;