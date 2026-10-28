import { Router } from 'express';
import { notificationController } from '../controllers/notificationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', notificationController.getMyNotifications);
router.patch('/:id/read', notificationController.markRead);
router.patch('/read-all', notificationController.markAllRead);

export default router;
