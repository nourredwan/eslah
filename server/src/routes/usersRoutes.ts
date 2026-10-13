import { Router } from 'express';
import { getVolunteers, getUserById, deleteUser } from '../controllers/usersController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/volunteers', getVolunteers);
router.get('/:id', getUserById);
router.delete('/:id', requireAuth, deleteUser);

export default router;
