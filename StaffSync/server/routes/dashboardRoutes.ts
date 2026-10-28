import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController.js';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/employee', dashboardController.getEmployeeDashboard);
router.get('/manager', roleMiddleware('Manager', 'HR'), dashboardController.getManagerDashboard);
router.get('/hr', roleMiddleware('HR'), dashboardController.getHRDashboard);

export default router;
