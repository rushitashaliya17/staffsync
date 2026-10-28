import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import {
  EmployeeModel,
  AttendanceModel,
  LeaveModel,
  TrainingModel,
  TrainingEnrollmentModel,
  DepartmentModel
} from '../models/index.js';

export const reportController = {
  async getEmployeeReport(req: AuthRequest, res: Response) {
    try {
      const employees = EmployeeModel.find();
      const departments = DepartmentModel.find();

      const byDepartment: Record<string, number> = {};
      const byEmploymentType: Record<string, number> = {};
      const byStatus: Record<string, number> = {};

      for (const e of employees) {
        const dept = e.departmentName || 'Unassigned';
        byDepartment[dept] = (byDepartment[dept] || 0) + 1;
        byEmploymentType[e.employmentType] = (byEmploymentType[e.employmentType] || 0) + 1;
        byStatus[e.employmentStatus] = (byStatus[e.employmentStatus] || 0) + 1;
      }

      return res.status(200).json({
        success: true,
        total: employees.length,
        byDepartment,
        byEmploymentType,
        byStatus,
        data: employees.map(e => ({
          employeeCode: e.employeeCode,
          name: `${e.firstName} ${e.lastName}`,
          email: e.workEmail,
          department: e.departmentName,
          designation: e.designation,
          dateOfJoining: e.dateOfJoining,
          status: e.employmentStatus,
          manager: e.managerName || 'None'
        }))
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getAttendanceReport(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate, department } = req.query;
      let attendances = AttendanceModel.find();

      if (startDate && endDate) {
        attendances = attendances.filter(a => a.date >= String(startDate) && a.date <= String(endDate));
      }

      const statusBreakdown = {
        Present: attendances.filter(a => a.status === 'Present').length,
        Late: attendances.filter(a => a.status === 'Late').length,
        HalfDay: attendances.filter(a => a.status === 'Half Day').length,
        OnLeave: attendances.filter(a => a.status === 'On Leave').length
      };

      const totalMinutes = attendances.reduce((acc, a) => acc + (a.totalWorkedMinutes || 0), 0);

      return res.status(200).json({
        success: true,
        count: attendances.length,
        totalHours: (totalMinutes / 60).toFixed(1),
        statusBreakdown,
        records: attendances
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getLeaveReport(req: AuthRequest, res: Response) {
    try {
      const leaves = LeaveModel.find();

      const byType: Record<string, number> = {};
      const byStatus: Record<string, number> = {};
      let totalApprovedDays = 0;

      for (const l of leaves) {
        byType[l.leaveType] = (byType[l.leaveType] || 0) + l.totalDays;
        byStatus[l.status] = (byStatus[l.status] || 0) + 1;
        if (l.status === 'Approved') {
          totalApprovedDays += l.totalDays;
        }
      }

      return res.status(200).json({
        success: true,
        totalRequests: leaves.length,
        totalApprovedDays,
        byType,
        byStatus,
        records: leaves
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getTrainingReport(req: AuthRequest, res: Response) {
    try {
      const trainings = TrainingModel.find();
      const enrollments = TrainingEnrollmentModel.find();

      const completedCount = enrollments.filter(e => e.completionStatus === 'Completed').length;
      const inProgressCount = enrollments.filter(e => e.completionStatus === 'In Progress').length;
      const notStartedCount = enrollments.filter(e => e.completionStatus === 'Not Started').length;

      const programs = trainings.map(t => {
        const tEnr = enrollments.filter(e => e.trainingId === t._id);
        const tCompleted = tEnr.filter(e => e.completionStatus === 'Completed').length;
        return {
          title: t.title,
          trainer: t.trainerName,
          date: t.startDate,
          capacity: t.capacity,
          enrolled: tEnr.length,
          completed: tCompleted,
          completionRate: tEnr.length > 0 ? Math.round((tCompleted / tEnr.length) * 100) : 0
        };
      });

      return res.status(200).json({
        success: true,
        totalPrograms: trainings.length,
        totalEnrollments: enrollments.length,
        completedCount,
        inProgressCount,
        notStartedCount,
        completionRate: enrollments.length > 0 ? Math.round((completedCount / enrollments.length) * 100) : 0,
        programs
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};
