import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import {
  UserModel,
  EmployeeModel,
  DepartmentModel,
  AttendanceModel,
  LeaveModel,
  LeaveBalanceModel,
  AnnouncementModel,
  TrainingModel,
  TrainingEnrollmentModel,
  NotificationModel,
  AuditLogModel
} from '../models/index.js';

export const dashboardController = {
  async getEmployeeDashboard(req: AuthRequest, res: Response) {
    try {
      const employee = req.employee || EmployeeModel.findOne({ userId: req.user?._id || '' });
      if (!employee) {
        return res.status(200).json({
          success: true,
          attendance: null,
          balances: [],
          recentLeaves: [],
          upcomingTrainings: [],
          announcements: []
        });
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const todayAttendance = AttendanceModel.findOne({ employeeId: employee._id, date: todayStr });

      const currentYear = new Date().getFullYear();
      let balances = LeaveBalanceModel.find({ employeeId: employee._id, leaveYear: currentYear });
      if (balances.length === 0) {
        balances = [
          LeaveBalanceModel.create({
            employeeId: employee._id,
            leaveType: 'Annual',
            leaveYear: currentYear,
            allocatedDays: 18,
            usedDays: 0,
            pendingDays: 0,
            remainingDays: 18
          }),
          LeaveBalanceModel.create({
            employeeId: employee._id,
            leaveType: 'Sick',
            leaveYear: currentYear,
            allocatedDays: 12,
            usedDays: 0,
            pendingDays: 0,
            remainingDays: 12
          })
        ];
      }

      const myLeaves = LeaveModel.find({ employeeId: employee._id });
      myLeaves.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const announcements = AnnouncementModel.find({ isPublished: true })
        .filter(a => a.targetAudience === 'All' || a.targetAudience === 'Employees')
        .slice(0, 5);

      const enrollments = TrainingEnrollmentModel.find({ employeeId: employee._id });
      const enrolledTrainingIds = enrollments.map(e => e.trainingId);
      const allTrainings = TrainingModel.find();
      const upcomingTrainings = allTrainings.filter(t => enrolledTrainingIds.includes(t._id) || t.status === 'Upcoming').slice(0, 4);

      const unreadNotifications = NotificationModel.find({ recipientId: req.user?._id || '', isRead: false }).length;

      return res.status(200).json({
        success: true,
        employee,
        todayAttendance,
        balances,
        recentLeaves: myLeaves.slice(0, 5),
        upcomingTrainings,
        announcements,
        unreadNotifications
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getManagerDashboard(req: AuthRequest, res: Response) {
    try {
      const myEmp = req.employee || EmployeeModel.findOne({ userId: req.user?._id || '' });
      const teamEmployees = myEmp ? EmployeeModel.find({ managerId: myEmp._id }) : [];
      const teamIds = teamEmployees.map(e => e._id);

      const todayStr = new Date().toISOString().split('T')[0];
      const todayAttendances = AttendanceModel.find({ date: todayStr }).filter(a => teamIds.includes(a.employeeId));

      const presentCount = todayAttendances.filter(a => a.status === 'Present').length;
      const lateCount = todayAttendances.filter(a => a.status === 'Late').length;
      const halfDayCount = todayAttendances.filter(a => a.status === 'Half Day').length;

      // Pending leave approvals
      const teamLeaves = LeaveModel.find().filter(l => teamIds.includes(l.employeeId));
      const pendingLeaves = teamLeaves.filter(l => l.status === 'Pending');
      const approvedUpcomingLeaves = teamLeaves.filter(l => l.status === 'Approved' && l.startDate >= todayStr);

      // Trainings managed or created
      const trainings = TrainingModel.find({ createdBy: req.user?._id || '' });

      // Trend data (last 7 days attendance for team)
      const trendData: any[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
        const dayRecords = AttendanceModel.find({ date: d }).filter(a => teamIds.includes(a.employeeId));
        const dayPresent = dayRecords.filter(a => a.status === 'Present' || a.status === 'Late').length;
        trendData.push({
          date: d.slice(5),
          present: dayPresent,
          total: teamEmployees.length || 1
        });
      }

      return res.status(200).json({
        success: true,
        teamCount: teamEmployees.length,
        teamEmployees,
        attendanceToday: {
          present: presentCount,
          late: lateCount,
          halfDay: halfDayCount,
          totalCheckedIn: todayAttendances.length,
          absent: Math.max(0, teamEmployees.length - todayAttendances.length)
        },
        pendingLeaves,
        upcomingLeaves: approvedUpcomingLeaves,
        trainings,
        trendData
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getHRDashboard(req: AuthRequest, res: Response) {
    try {
      const allEmployees = EmployeeModel.find();
      const activeEmployees = allEmployees.filter(e => e.employmentStatus === 'Active');
      const allUsers = UserModel.find({ isActive: true });
      const managers = allUsers.filter(u => u.role === 'Manager');
      const departments = DepartmentModel.find();

      const todayStr = new Date().toISOString().split('T')[0];
      const todayAttendances = AttendanceModel.find({ date: todayStr });
      const presentCount = todayAttendances.filter(a => a.status === 'Present').length;
      const lateCount = todayAttendances.filter(a => a.status === 'Late').length;
      const halfDayCount = todayAttendances.filter(a => a.status === 'Half Day').length;

      const allLeaves = LeaveModel.find();
      const pendingLeaves = allLeaves.filter(l => l.status === 'Pending');
      const approvedLeaves = allLeaves.filter(l => l.status === 'Approved');

      // Department breakdown for charts
      const departmentDistribution = departments.map(d => {
        const count = allEmployees.filter(e => e.departmentName === d.name || e.departmentId === d._id).length;
        return {
          name: d.name,
          headcount: count
        };
      });

      // Weekly attendance trend
      const attendanceTrend: any[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
        const dayRecords = AttendanceModel.find({ date: d });
        attendanceTrend.push({
          date: d.slice(5),
          present: dayRecords.filter(a => a.status === 'Present').length,
          late: dayRecords.filter(a => a.status === 'Late').length,
          total: activeEmployees.length
        });
      }

      // Recent admin logs
      const recentLogs = AuditLogModel.find(10);

      // Training stats
      const trainings = TrainingModel.find();
      const enrollments = TrainingEnrollmentModel.find();

      return res.status(200).json({
        success: true,
        stats: {
          totalEmployees: allEmployees.length,
          activeEmployees: activeEmployees.length,
          activeManagers: managers.length,
          totalDepartments: departments.length,
          todayPresent: presentCount,
          todayLate: lateCount,
          todayHalfDay: halfDayCount,
          todayCheckedIn: todayAttendances.length,
          pendingLeavesCount: pendingLeaves.length,
          approvedLeavesCount: approvedLeaves.length,
          activeTrainingsCount: trainings.filter(t => t.status === 'Upcoming' || t.status === 'In Progress').length,
          totalEnrollmentsCount: enrollments.length
        },
        departmentDistribution,
        attendanceTrend,
        pendingLeaves: pendingLeaves.slice(0, 6),
        recentAuditLogs: recentLogs
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};
