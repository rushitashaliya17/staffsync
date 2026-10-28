import { Router } from 'express';
import { AuditLogModel } from '../models/index.js';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', roleMiddleware('HR'), (req: AuthRequest, res) => {
  const logs = AuditLogModel.find(100);
  res.status(200).json({ success: true, count: logs.length, logs });
});

export default router;
