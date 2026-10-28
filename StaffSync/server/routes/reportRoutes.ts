import { Router } from 'express';
import { reportController } from '../controllers/reportController.js';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

// Reports available to HR and Managers
router.get('/employees', roleMiddleware('HR', 'Manager'), reportController.getEmployeeReport);
router.get('/attendance', roleMiddleware('HR', 'Manager'), reportController.getAttendanceReport);
router.get('/leaves', roleMiddleware('HR', 'Manager'), reportController.getLeaveReport);
router.get('/trainings', roleMiddleware('HR', 'Manager'), reportController.getTrainingReport);

export default router;
