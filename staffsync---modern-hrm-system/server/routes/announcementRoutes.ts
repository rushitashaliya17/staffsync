import { Router } from 'express';
import { announcementController } from '../controllers/announcementController.js';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', announcementController.getAnnouncements);
router.post('/', roleMiddleware('HR', 'Manager'), announcementController.createAnnouncement);
router.patch('/:id', roleMiddleware('HR', 'Manager'), announcementController.updateAnnouncement);
router.delete('/:id', roleMiddleware('HR', 'Manager'), announcementController.deleteAnnouncement);

export default router;
