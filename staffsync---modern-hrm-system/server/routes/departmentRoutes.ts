import { Router } from 'express';
import { departmentController } from '../controllers/departmentController.js';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', departmentController.getAllDepartments);
router.post('/', roleMiddleware('HR'), departmentController.createDepartment);
router.patch('/:id', roleMiddleware('HR'), departmentController.updateDepartment);
router.delete('/:id', roleMiddleware('HR'), departmentController.deleteDepartment);

export default router;
