import { Router } from 'express';
import {
  getReports,
  getReportById,
  createReport,
  updateReport,
  adoptReport,
  toggleUpvote,
  deleteReport,
} from '../controllers/reportsController.js';
import { addComment, deleteComment } from '../controllers/commentsController.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.get('/', optionalAuth, getReports);
router.get('/:id', optionalAuth, getReportById);

// Create report with image upload
router.post('/', requireAuth, upload.array('images', 5), createReport);

// Update, adopt, upvote, delete
router.put('/:id', requireAuth, updateReport);
router.post('/:id/adopt', requireAuth, adoptReport);
router.post('/:id/upvote', requireAuth, toggleUpvote);
router.delete('/:id', requireAuth, deleteReport);

// Comments
router.post('/:id/comments', requireAuth, addComment);
router.delete('/:id/comments/:commentId', requireAuth, deleteComment);

export default router;
