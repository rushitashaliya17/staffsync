import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import {
  TrainingModel,
  TrainingEnrollmentModel,
  EmployeeModel,
  NotificationModel,
  AuditLogModel
} from '../models/index.js';

export const trainingController = {
  async getAllTrainings(req: AuthRequest, res: Response) {
    try {
      const trainings = TrainingModel.find();
      const enrollments = TrainingEnrollmentModel.find();

      const enriched = trainings.map(t => {
        const tEnrollments = enrollments.filter(e => e.trainingId === t._id);
        const myEnrollment = req.employee ? tEnrollments.find(e => e.employeeId === req.employee?._id) : null;
        return {
          ...t,
          enrolledCount: tEnrollments.length,
          isUserEnrolled: !!myEnrollment,
          userEnrollment: myEnrollment || null
        };
      });

      enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return res.status(200).json({ success: true, count: enriched.length, trainings: enriched });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getTrainingById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const training = TrainingModel.findById(id);
      if (!training) {
        return res.status(404).json({ success: false, message: 'Training program not found' });
      }

      const enrollments = TrainingEnrollmentModel.find({ trainingId: id });
      return res.status(200).json({ success: true, training, enrollments });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async createTraining(req: AuthRequest, res: Response) {
    try {
      const {
        title,
        description,
        trainerName,
        instructor,
        date,
        startDate,
        endDate,
        deliveryMode = 'Online',
        locationOrLink,
        targetAudience = 'All Teams',
        capacity = 30,
        assignedTo
      } = req.body;

      if (!title || !description) {
        return res.status(400).json({ success: false, message: 'Title and description are required.' });
      }

      const trainer = trainerName || instructor || req.user?.name || 'Staff Instructor';
      const sDate = startDate || date || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0];
      const eDate = endDate || sDate;

      const training = TrainingModel.create({
        title,
        description,
        trainerName: trainer,
        instructor: trainer,
        date: sDate,
        startDate: sDate,
        endDate: eDate,
        deliveryMode,
        locationOrLink: locationOrLink || 'Google Meet / Conference Room',
        targetAudience,
        capacity: Number(capacity) || 30,
        enrollmentDeadline: sDate,
        status: 'Upcoming',
        createdBy: req.user?._id || '',
        createdByName: req.user?.name || 'Administrator',
        assignedTo: assignedTo ? (Array.isArray(assignedTo) ? assignedTo : [assignedTo]) : undefined
      });

      AuditLogModel.create({
        actorId: req.user?._id || 'SYSTEM',
        actorName: req.user?.name || 'Trainer',
        action: 'CREATE_TRAINING',
        entityType: 'Training',
        entityId: training._id,
        details: `Created training module: ${title}`
      });

      return res.status(201).json({ success: true, message: 'Training session created successfully', training });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateTraining(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const training = TrainingModel.findById(id);
      if (!training) {
        return res.status(404).json({ success: false, message: 'Training program not found' });
      }

      const updated = TrainingModel.findByIdAndUpdate(id, req.body);
      return res.status(200).json({ success: true, message: 'Training updated', training: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteTraining(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const training = TrainingModel.findById(id);
      if (!training) {
        return res.status(404).json({ success: false, message: 'Training program not found' });
      }

      TrainingModel.findByIdAndDelete(id);
      return res.status(200).json({ success: true, message: 'Training program deleted.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async enrollTraining(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const training = TrainingModel.findById(id);
      if (!training) {
        return res.status(404).json({ success: false, message: 'Training program not found' });
      }

      const employee = req.employee || EmployeeModel.findOne({ userId: req.user?._id || '' });
      if (!employee) {
        return res.status(400).json({ success: false, message: 'No employee record associated with your user.' });
      }

      const existingEnrollment = TrainingEnrollmentModel.findOne({
        trainingId: id,
        employeeId: employee._id
      });

      if (existingEnrollment) {
        return res.status(400).json({ success: false, message: 'You are already enrolled in this training program.' });
      }

      const currentEnrollments = TrainingEnrollmentModel.find({ trainingId: id });
      if (currentEnrollments.length >= training.capacity) {
        return res.status(400).json({ success: false, message: 'This training session has reached full capacity.' });
      }

      const enrollment = TrainingEnrollmentModel.create({
        trainingId: id,
        employeeId: employee._id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        employeeEmail: employee.workEmail,
        enrollmentStatus: 'Enrolled',
        completionStatus: 'In Progress',
        progressPercentage: 10
      });

      NotificationModel.create({
        recipientId: req.user?._id || '',
        title: 'Training Enrollment Confirmed',
        message: `You are enrolled in "${training.title}". Schedule: ${training.startDate}.`,
        notificationType: 'Training',
        relatedEntityType: 'Training',
        relatedEntityId: training._id,
        isRead: false
      });

      return res.status(201).json({
        success: true,
        message: 'Successfully enrolled in training program.',
        enrollment
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getTrainingEnrollments(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const enrollments = TrainingEnrollmentModel.find({ trainingId: id });
      return res.status(200).json({ success: true, count: enrollments.length, enrollments });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateEnrollmentProgress(req: AuthRequest, res: Response) {
    try {
      const { enrollmentId } = req.params;
      const { progressPercentage, completionStatus } = req.body;

      const enrollment = TrainingEnrollmentModel.findById(enrollmentId);
      if (!enrollment) {
        return res.status(404).json({ success: false, message: 'Enrollment record not found' });
      }

      const updates: any = {};
      if (progressPercentage !== undefined) updates.progressPercentage = Number(progressPercentage);
      if (completionStatus) {
        updates.completionStatus = completionStatus;
        if (completionStatus === 'Completed') {
          updates.completionDate = new Date().toISOString().split('T')[0];
          updates.progressPercentage = 100;
        }
      }

      const updated = TrainingEnrollmentModel.findByIdAndUpdate(enrollmentId, updates);
      return res.status(200).json({ success: true, message: 'Progress updated', enrollment: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};
