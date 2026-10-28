import { Router } from 'express';
import { attendanceController } from '../controllers/attendanceController.js';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

// Employee check in and check out
router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);
router.get('/me', attendanceController.getMyAttendance);

// HR & Managers
router.get('/', roleMiddleware('HR', 'Manager'), attendanceController.getAllAttendance);
router.get('/summary', roleMiddleware('HR', 'Manager'), attendanceController.getAttendanceSummary);

// HR only attendance correction
router.patch('/:id', roleMiddleware('HR'), attendanceController.correctAttendance);

export default router;
