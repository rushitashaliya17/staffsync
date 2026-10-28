import { Router } from 'express';
import { trainingController } from '../controllers/trainingController.js';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', trainingController.getAllTrainings);
router.get('/:id', trainingController.getTrainingById);
router.post('/:id/enroll', trainingController.enrollTraining);

// HR and Managers can create, update, delete trainings and track enrollments
router.post('/', roleMiddleware('HR', 'Manager'), trainingController.createTraining);
router.patch('/:id', roleMiddleware('HR', 'Manager'), trainingController.updateTraining);
router.delete('/:id', roleMiddleware('HR', 'Manager'), trainingController.deleteTraining);
router.get('/:id/enrollments', roleMiddleware('HR', 'Manager'), trainingController.getTrainingEnrollments);
router.patch('/enrollments/:enrollmentId', roleMiddleware('HR', 'Manager'), trainingController.updateEnrollmentProgress);

export default router;
