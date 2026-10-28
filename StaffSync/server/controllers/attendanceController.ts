import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { AttendanceModel, EmployeeModel, AuditLogModel } from '../models/index.js';

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

function parseTimeToMinutes(timeStr: string): number {
  try {
    const parts = timeStr.trim().split(' ');
    const isPM = parts[1] && parts[1].toUpperCase() === 'PM';
    const [h, m] = parts[0].split(':').map(Number);
    let hours = h % 12;
    if (isPM) hours += 12;
    return hours * 60 + (m || 0);
  } catch {
    return 0;
  }
}

export const attendanceController = {
  async checkIn(req: AuthRequest, res: Response) {
    try {
      const employee = req.employee || EmployeeModel.findOne({ userId: req.user?._id || '' });
      if (!employee) {
        return res.status(400).json({ success: false, message: 'No employee record linked to your user account.' });
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const existing = AttendanceModel.findOne({ employeeId: employee._id, date: todayStr });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: `You have already checked in today at ${existing.checkIn}. Duplicate check-ins are not permitted.`
        });
      }

      const now = new Date();
      const checkInTime = formatTime(now);

      // Status rule: if after 9:30 AM, mark Late, else Present
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const isLate = (hours > 9 || (hours === 9 && minutes > 30));
      const status = isLate ? 'Late' : 'Present';

      const record = AttendanceModel.create({
        employeeId: employee._id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        employeeEmail: employee.workEmail,
        date: todayStr,
        checkIn: checkInTime,
        checkOut: undefined,
        totalWorkedMinutes: 0,
        status,
        notes: isLate ? 'Late arrival recorded' : 'On-time check in',
        recordedBy: 'Self'
      });

      return res.status(201).json({
        success: true,
        message: `Successfully checked in at ${checkInTime} (${status})`,
        attendance: record
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async checkOut(req: AuthRequest, res: Response) {
    try {
      const employee = req.employee || EmployeeModel.findOne({ userId: req.user?._id || '' });
      if (!employee) {
        return res.status(400).json({ success: false, message: 'No employee record linked.' });
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const existing = AttendanceModel.findOne({ employeeId: employee._id, date: todayStr });

      if (!existing) {
        return res.status(400).json({
          success: false,
          message: 'Cannot check out without a valid check-in today.'
        });
      }

      if (existing.checkOut) {
        return res.status(400).json({
          success: false,
          message: `You have already checked out today at ${existing.checkOut}.`
        });
      }

      const now = new Date();
      const checkOutTime = formatTime(now);

      // Calculate total worked duration
      const inMins = parseTimeToMinutes(existing.checkIn);
      const outMins = parseTimeToMinutes(checkOutTime);
      let workedMins = Math.max(0, outMins - inMins);

      // If duration is less than 4 hours (240 mins), consider Half Day
      let status = existing.status;
      if (workedMins < 240 && workedMins > 0) {
        status = 'Half Day';
      }

      const updated = AttendanceModel.findByIdAndUpdate(existing._id, {
        checkOut: checkOutTime,
        totalWorkedMinutes: workedMins,
        status
      });

      const hoursDisplay = (workedMins / 60).toFixed(1);

      return res.status(200).json({
        success: true,
        message: `Checked out at ${checkOutTime}. Total worked: ${hoursDisplay} hrs.`,
        attendance: updated
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getMyAttendance(req: AuthRequest, res: Response) {
    try {
      const employee = req.employee || EmployeeModel.findOne({ userId: req.user?._id || '' });
      if (!employee) {
        return res.status(200).json({ success: true, records: [], summary: {} });
      }

      const { month, year } = req.query;
      let records = AttendanceModel.find({ employeeId: employee._id });

      if (month && year) {
        const prefix = `${year}-${String(month).padStart(2, '0')}`;
        records = records.filter(r => r.date.startsWith(prefix));
      }

      // Sort newest first
      records.sort((a, b) => b.date.localeCompare(a.date));

      const todayStr = new Date().toISOString().split('T')[0];
      const todayRecord = records.find(r => r.date === todayStr);

      const presentCount = records.filter(r => r.status === 'Present').length;
      const lateCount = records.filter(r => r.status === 'Late').length;
      const halfDayCount = records.filter(r => r.status === 'Half Day').length;
      const totalMinutes = records.reduce((sum, r) => sum + (r.totalWorkedMinutes || 0), 0);

      return res.status(200).json({
        success: true,
        today: todayRecord || null,
        records,
        summary: {
          totalDays: records.length,
          presentCount,
          lateCount,
          halfDayCount,
          totalWorkedHours: (totalMinutes / 60).toFixed(1)
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getAllAttendance(req: AuthRequest, res: Response) {
    try {
      const { date, employeeId, department, status } = req.query;
      let records = AttendanceModel.find();

      // Manager filtering
      if (req.user?.role === 'Manager') {
        const myEmp = req.employee || EmployeeModel.findOne({ userId: req.user._id });
        if (myEmp) {
          const teamMemberIds = EmployeeModel.find({ managerId: myEmp._id }).map(e => e._id);
          records = records.filter(r => teamMemberIds.includes(r.employeeId));
        }
      }

      if (date) {
        records = records.filter(r => r.date === date);
      }

      if (employeeId) {
        records = records.filter(r => r.employeeId === employeeId);
      }

      if (status) {
        records = records.filter(r => r.status.toLowerCase() === String(status).toLowerCase());
      }

      if (department) {
        const deptEmployees = EmployeeModel.find().filter(e => e.departmentName === department || e.departmentId === department).map(e => e._id);
        records = records.filter(r => deptEmployees.includes(r.employeeId));
      }

      records.sort((a, b) => b.date.localeCompare(a.date));

      return res.status(200).json({
        success: true,
        count: records.length,
        records
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async correctAttendance(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { checkIn, checkOut, status, notes } = req.body;

      const record = AttendanceModel.findById(id);
      if (!record) {
        return res.status(404).json({ success: false, message: 'Attendance record not found' });
      }

      const updates: any = {};
      if (checkIn) updates.checkIn = checkIn;
      if (checkOut !== undefined) updates.checkOut = checkOut;
      if (status) updates.status = status;
      if (notes) updates.notes = notes;

      if (updates.checkIn && updates.checkOut) {
        const inMins = parseTimeToMinutes(updates.checkIn);
        const outMins = parseTimeToMinutes(updates.checkOut);
        updates.totalWorkedMinutes = Math.max(0, outMins - inMins);
      }

      updates.recordedBy = `HR Correction (${req.user?.name || 'Admin'})`;

      const updated = AttendanceModel.findByIdAndUpdate(id, updates);

      AuditLogModel.create({
        actorId: req.user?._id || 'SYSTEM',
        actorName: req.user?.name || 'HR Admin',
        action: 'CORRECT_ATTENDANCE',
        entityType: 'Attendance',
        entityId: id,
        details: `Corrected attendance for ${record.employeeName} on ${record.date}: status=${status || record.status}`
      });

      return res.status(200).json({ success: true, message: 'Attendance record adjusted successfully', attendance: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getAttendanceSummary(req: AuthRequest, res: Response) {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const allEmployees = EmployeeModel.find({ employmentStatus: 'Active' });
      const todayRecords = AttendanceModel.find({ date: todayStr });

      const present = todayRecords.filter(r => r.status === 'Present').length;
      const late = todayRecords.filter(r => r.status === 'Late').length;
      const halfDay = todayRecords.filter(r => r.status === 'Half Day').length;
      const totalCheckedIn = todayRecords.length;
      const absentEstimate = Math.max(0, allEmployees.length - totalCheckedIn);

      return res.status(200).json({
        success: true,
        summary: {
          date: todayStr,
          totalEmployees: allEmployees.length,
          present,
          late,
          halfDay,
          totalCheckedIn,
          absentEstimate
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};
