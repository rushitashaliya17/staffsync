import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import trainingRoutes from './routes/trainingRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import { errorMiddleware } from './middleware/authMiddleware.js';

export function createApp() {
  const app = express();

  app.use(cors({
    origin: true,
    credentials: true
  }));
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/api/v1/health', (req, res) => {
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'StaffSync HRM Backend API',
      version: '1.0.0'
    });
  });

  // API v1 Routing
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/employees', employeeRoutes);
  app.use('/api/v1/departments', departmentRoutes);
  app.use('/api/v1/attendance', attendanceRoutes);
  app.use('/api/v1/leaves', leaveRoutes);
  app.use('/api/v1/announcements', announcementRoutes);
  app.use('/api/v1/trainings', trainingRoutes);
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/v1/dashboard', dashboardRoutes);
  app.use('/api/v1/reports', reportRoutes);
  app.use('/api/v1/audit-logs', auditRoutes);

  // Centralized Error Handling
  app.use(errorMiddleware);

  return app;
}
