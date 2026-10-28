import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import {
  LeaveModel,
  LeaveBalanceModel,
  LeavePolicyModel,
  EmployeeModel,
  UserModel,
  NotificationModel,
  AuditLogModel
} from '../models/index.js';

function calculateWorkingDays(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return 0;
  }

  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const dayOfWeek = cur.getDay(); // 0 is Sunday, 6 is Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count || 1; // Minimum 1 day if within same day
}

export const leaveController = {
  async applyLeave(req: AuthRequest, res: Response) {
    try {
      const employee = req.employee || EmployeeModel.findOne({ userId: req.user?._id || '' });
      if (!employee) {
        return res.status(400).json({ success: false, message: 'No linked employee record found.' });
      }

      const { startDate, endDate, leaveType = 'Annual', reason } = req.body;

      if (!startDate || !endDate || !reason) {
        return res.status(400).json({ success: false, message: 'Please provide start date, end date, and reason.' });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        return res.status(400).json({ success: false, message: 'End date cannot be prior to start date.' });
      }

      const totalDays = calculateWorkingDays(startDate, endDate);

      // Check overlapping active requests
      const existingLeaves = LeaveModel.find({ employeeId: employee._id });
      const overlapping = existingLeaves.some(l => {
        if (l.status === 'Rejected' || l.status === 'Cancelled') return false;
        const lStart = new Date(l.startDate);
        const lEnd = new Date(l.endDate);
        return (start <= lEnd && end >= lStart);
      });

      if (overlapping) {
        return res.status(400).json({
          success: false,
          message: 'You already have an active or pending leave request covering these dates.'
        });
      }

      // Check leave balance
      const currentYear = new Date().getFullYear();
      let balance = LeaveBalanceModel.findOne({
        employeeId: employee._id,
        leaveType,
        leaveYear: currentYear
      });

      if (!balance) {
        // Create default balance if missing
        balance = LeaveBalanceModel.create({
          employeeId: employee._id,
          leaveType,
          leaveYear: currentYear,
          allocatedDays: 18,
          usedDays: 0,
          pendingDays: 0,
          remainingDays: 18
        });
      }

      if (balance.remainingDays - balance.pendingDays < totalDays) {
        return res.status(400).json({
          success: false,
          message: `Insufficient leave balance. You have ${balance.remainingDays - balance.pendingDays} days available for ${leaveType} leave, but requested ${totalDays} days.`
        });
      }

      // Update pending days in balance
      LeaveBalanceModel.update(balance._id, {
        pendingDays: balance.pendingDays + totalDays
      });

      const leave = LeaveModel.create({
        employeeId: employee._id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        employeeEmail: employee.workEmail,
        leaveType,
        startDate,
        endDate,
        totalDays,
        reason,
        status: 'Pending',
        currentApprover: employee.managerId
      });

      // Notify manager if assigned
      if (employee.managerId) {
        const mgrEmp = EmployeeModel.findById(employee.managerId);
        if (mgrEmp?.userId) {
          NotificationModel.create({
            recipientId: mgrEmp.userId,
            title: 'New Leave Request Submitted',
            message: `${employee.firstName} ${employee.lastName} requested ${totalDays} days of ${leaveType} leave (${startDate} to ${endDate}).`,
            notificationType: 'Leave',
            relatedEntityType: 'Leave',
            relatedEntityId: leave._id,
            isRead: false
          });
        }
      }

      return res.status(201).json({
        success: true,
        message: 'Leave application submitted successfully.',
        leave
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getMyLeaves(req: AuthRequest, res: Response) {
    try {
      const employee = req.employee || EmployeeModel.findOne({ userId: req.user?._id || '' });
      if (!employee) {
        return res.status(200).json({ success: true, leaves: [] });
      }

      const leaves = LeaveModel.find({ employeeId: employee._id });
      leaves.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return res.status(200).json({ success: true, count: leaves.length, leaves });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getAllLeaves(req: AuthRequest, res: Response) {
    try {
      const { status, employeeId, department } = req.query;
      let leaves = LeaveModel.find();

      // If user is Manager, restrict to their assigned team members
      if (req.user?.role === 'Manager') {
        const myEmp = req.employee || EmployeeModel.findOne({ userId: req.user._id });
        if (myEmp) {
          const teamIds = EmployeeModel.find({ managerId: myEmp._id }).map(e => e._id);
          // Managers see team members' leaves + their own
          leaves = leaves.filter(l => teamIds.includes(l.employeeId) || l.employeeId === myEmp._id);
        }
      }

      if (status) {
        leaves = leaves.filter(l => l.status.toLowerCase() === String(status).toLowerCase());
      }

      if (employeeId) {
        leaves = leaves.filter(l => l.employeeId === employeeId);
      }

      if (department) {
        const deptEmpIds = EmployeeModel.find().filter(e => e.departmentName === department || e.departmentId === department).map(e => e._id);
        leaves = leaves.filter(l => deptEmpIds.includes(l.employeeId));
      }

      leaves.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return res.status(200).json({ success: true, count: leaves.length, leaves });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async approveLeave(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { comments } = req.body;

      const leave = LeaveModel.findById(id);
      if (!leave) {
        return res.status(404).json({ success: false, message: 'Leave request not found.' });
      }

      if (leave.status === 'Approved') {
        return res.status(400).json({ success: false, message: 'Leave request has already been approved.' });
      }

      // Permission check: HR can approve any, Manager can only approve team members
      if (req.user?.role === 'Manager') {
        const myEmp = req.employee || EmployeeModel.findOne({ userId: req.user._id });
        const applicant = EmployeeModel.findById(leave.employeeId);
        if (applicant?.managerId !== myEmp?._id) {
          return res.status(403).json({ success: false, message: 'Unauthorized: You can only approve leave requests for your assigned team members.' });
        }
      }

      // Balance deduction
      const currentYear = new Date(leave.startDate).getFullYear() || new Date().getFullYear();
      const balance = LeaveBalanceModel.findOne({
        employeeId: leave.employeeId,
        leaveType: leave.leaveType,
        leaveYear: currentYear
      });

      if (balance) {
        const newUsed = balance.usedDays + leave.totalDays;
        const newPending = Math.max(0, balance.pendingDays - leave.totalDays);
        const newRemaining = Math.max(0, balance.allocatedDays - newUsed);

        LeaveBalanceModel.update(balance._id, {
          usedDays: newUsed,
          pendingDays: newPending,
          remainingDays: newRemaining
        });
      }

      const approverRoleName = req.user?.role === 'HR' ? 'HR' : 'Manager';
      const updated = LeaveModel.findByIdAndUpdate(id, {
        status: 'Approved',
        approvedBy: approverRoleName,
        approverComments: comments || 'Approved',
        approvalHistory: [
          ...(leave.approvalHistory || []),
          {
            action: 'Approved',
            actorId: req.user?._id || '',
            actorName: req.user?.name || 'Approver',
            timestamp: new Date().toISOString(),
            comments: comments || 'Approved'
          }
        ]
      });

      // Send notification to employee
      const applicant = EmployeeModel.findById(leave.employeeId);
      if (applicant?.userId) {
        NotificationModel.create({
          recipientId: applicant.userId,
          title: 'Leave Application Approved',
          message: `Your leave request for ${leave.startDate} to ${leave.endDate} (${leave.totalDays} days) has been approved by ${req.user?.name}.`,
          notificationType: 'Leave',
          relatedEntityType: 'Leave',
          relatedEntityId: leave._id,
          isRead: false
        });
      }

      AuditLogModel.create({
        actorId: req.user?._id || 'SYSTEM',
        actorName: req.user?.name || 'Approver',
        action: 'APPROVE_LEAVE',
        entityType: 'Leave',
        entityId: id,
        details: `Approved ${leave.totalDays} days leave for ${leave.employeeName}`
      });

      return res.status(200).json({ success: true, message: 'Leave request approved successfully.', leave: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async rejectLeave(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { comments } = req.body;

      const leave = LeaveModel.findById(id);
      if (!leave) {
        return res.status(404).json({ success: false, message: 'Leave request not found.' });
      }

      if (leave.status === 'Rejected') {
        return res.status(400).json({ success: false, message: 'Leave request has already been rejected.' });
      }

      if (req.user?.role === 'Manager') {
        const myEmp = req.employee || EmployeeModel.findOne({ userId: req.user._id });
        const applicant = EmployeeModel.findById(leave.employeeId);
        if (applicant?.managerId !== myEmp?._id) {
          return res.status(403).json({ success: false, message: 'Unauthorized: You can only review leave requests for your assigned team.' });
        }
      }

      // If it was Pending, restore pendingDays
      if (leave.status === 'Pending') {
        const currentYear = new Date(leave.startDate).getFullYear() || new Date().getFullYear();
        const balance = LeaveBalanceModel.findOne({
          employeeId: leave.employeeId,
          leaveType: leave.leaveType,
          leaveYear: currentYear
        });
        if (balance) {
          LeaveBalanceModel.update(balance._id, {
            pendingDays: Math.max(0, balance.pendingDays - leave.totalDays)
          });
        }
      }

      const approverRoleName = req.user?.role === 'HR' ? 'HR' : 'Manager';
      const updated = LeaveModel.findByIdAndUpdate(id, {
        status: 'Rejected',
        approvedBy: approverRoleName,
        approverComments: comments || 'Request declined based on department schedule',
        approvalHistory: [
          ...(leave.approvalHistory || []),
          {
            action: 'Rejected',
            actorId: req.user?._id || '',
            actorName: req.user?.name || 'Reviewer',
            timestamp: new Date().toISOString(),
            comments: comments || 'Rejected'
          }
        ]
      });

      const applicant = EmployeeModel.findById(leave.employeeId);
      if (applicant?.userId) {
        NotificationModel.create({
          recipientId: applicant.userId,
          title: 'Leave Application Rejected',
          message: `Your leave request for ${leave.startDate} to ${leave.endDate} was rejected. Note: ${comments || 'Contact your manager.'}`,
          notificationType: 'Leave',
          relatedEntityType: 'Leave',
          relatedEntityId: leave._id,
          isRead: false
        });
      }

      AuditLogModel.create({
        actorId: req.user?._id || 'SYSTEM',
        actorName: req.user?.name || 'Reviewer',
        action: 'REJECT_LEAVE',
        entityType: 'Leave',
        entityId: id,
        details: `Rejected leave request for ${leave.employeeName}: ${comments || 'No comment'}`
      });

      return res.status(200).json({ success: true, message: 'Leave request rejected.', leave: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async cancelLeave(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const leave = LeaveModel.findById(id);
      if (!leave) {
        return res.status(404).json({ success: false, message: 'Leave request not found.' });
      }

      const employee = req.employee || EmployeeModel.findOne({ userId: req.user?._id || '' });
      if (req.user?.role === 'Employee' && leave.employeeId !== employee?._id) {
        return res.status(403).json({ success: false, message: 'Unauthorized: You can only cancel your own leave requests.' });
      }

      if (leave.status === 'Cancelled') {
        return res.status(400).json({ success: false, message: 'Leave is already cancelled.' });
      }

      const currentYear = new Date(leave.startDate).getFullYear() || new Date().getFullYear();
      const balance = LeaveBalanceModel.findOne({
        employeeId: leave.employeeId,
        leaveType: leave.leaveType,
        leaveYear: currentYear
      });

      if (balance) {
        if (leave.status === 'Pending') {
          LeaveBalanceModel.update(balance._id, {
            pendingDays: Math.max(0, balance.pendingDays - leave.totalDays)
          });
        } else if (leave.status === 'Approved') {
          const newUsed = Math.max(0, balance.usedDays - leave.totalDays);
          LeaveBalanceModel.update(balance._id, {
            usedDays: newUsed,
            remainingDays: balance.allocatedDays - newUsed
          });
        }
      }

      const updated = LeaveModel.findByIdAndUpdate(id, {
        status: 'Cancelled'
      });

      return res.status(200).json({ success: true, message: 'Leave request cancelled successfully.', leave: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getMyBalances(req: AuthRequest, res: Response) {
    try {
      const employee = req.employee || EmployeeModel.findOne({ userId: req.user?._id || '' });
      if (!employee) {
        return res.status(200).json({ success: true, balances: [] });
      }

      const year = Number(req.query.year) || new Date().getFullYear();
      let balances = LeaveBalanceModel.find({ employeeId: employee._id, leaveYear: year });

      if (balances.length === 0) {
        // Generate defaults if empty
        balances = [
          LeaveBalanceModel.create({
            employeeId: employee._id,
            leaveType: 'Annual',
            leaveYear: year,
            allocatedDays: 18,
            usedDays: 0,
            pendingDays: 0,
            remainingDays: 18
          }),
          LeaveBalanceModel.create({
            employeeId: employee._id,
            leaveType: 'Sick',
            leaveYear: year,
            allocatedDays: 12,
            usedDays: 0,
            pendingDays: 0,
            remainingDays: 12
          }),
          LeaveBalanceModel.create({
            employeeId: employee._id,
            leaveType: 'Casual',
            leaveYear: year,
            allocatedDays: 8,
            usedDays: 0,
            pendingDays: 0,
            remainingDays: 8
          })
        ];
      }

      return res.status(200).json({ success: true, balances });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getLeavePolicies(req: AuthRequest, res: Response) {
    try {
      const policies = LeavePolicyModel.find();
      return res.status(200).json({ success: true, policies });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async createLeavePolicy(req: AuthRequest, res: Response) {
    try {
      const { name, leaveType, annualAllowance, workingDayRules, applicableEmploymentTypes } = req.body;
      const policy = LeavePolicyModel.create({
        name,
        leaveType,
        annualAllowance: Number(annualAllowance) || 12,
        workingDayRules: workingDayRules || 'Standard working days',
        applicableEmploymentTypes: applicableEmploymentTypes || ['Full-time']
      });
      return res.status(201).json({ success: true, message: 'Leave policy created', policy });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};
