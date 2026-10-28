import { Router } from 'express';
import { employeeController } from '../controllers/employeeController.js';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

// All authenticated users can view employee directory (with role-appropriate filters)
router.get('/', employeeController.getAllEmployees);
router.get('/:id', employeeController.getEmployeeById);

// HR Only can create, toggle status, and delete
router.post('/', roleMiddleware('HR'), employeeController.createEmployee);
router.patch('/:id/status', roleMiddleware('HR'), employeeController.toggleEmployeeStatus);
router.delete('/:id', roleMiddleware('HR'), employeeController.deleteEmployee);

// HR or self can update
router.patch('/:id', employeeController.updateEmployee);

export default router;
