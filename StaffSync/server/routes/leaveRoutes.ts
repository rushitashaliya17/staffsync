import { Router } from 'express';
import { leaveController } from '../controllers/leaveController.js';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

// Employee leave operations
router.post('/', leaveController.applyLeave);
router.get('/me', leaveController.getMyLeaves);
router.post('/:id/cancel', leaveController.cancelLeave);
router.get('/balances/me', leaveController.getMyBalances);

// Policies
router.get('/policies', leaveController.getLeavePolicies);
router.post('/policies', roleMiddleware('HR'), leaveController.createLeavePolicy);

// HR and Managers
router.get('/', roleMiddleware('HR', 'Manager'), leaveController.getAllLeaves);
router.post('/:id/approve', roleMiddleware('HR', 'Manager'), leaveController.approveLeave);
router.post('/:id/reject', roleMiddleware('HR', 'Manager'), leaveController.rejectLeave);

export default router;
