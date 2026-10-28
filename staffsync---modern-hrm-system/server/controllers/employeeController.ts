import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/authMiddleware.js';
import {
  EmployeeModel,
  UserModel,
  DepartmentModel,
  LeaveBalanceModel,
  AuditLogModel
} from '../models/index.js';

export const employeeController = {
  async getAllEmployees(req: AuthRequest, res: Response) {
    try {
      const { search, department, status, managerId, page = 1, limit = 50 } = req.query;

      let employees = EmployeeModel.find();

      // Manager-level restriction: if user is Manager and requesting directory for their team
      if (req.user?.role === 'Manager' && req.query.teamOnly === 'true') {
        const myEmp = req.employee || EmployeeModel.findOne({ userId: req.user._id });
        if (myEmp) {
          employees = employees.filter(e => e.managerId === myEmp._id);
        }
      }

      if (search) {
        const q = String(search).toLowerCase();
        employees = employees.filter(e =>
          e.firstName.toLowerCase().includes(q) ||
          e.lastName.toLowerCase().includes(q) ||
          e.workEmail.toLowerCase().includes(q) ||
          e.employeeCode.toLowerCase().includes(q) ||
          e.designation.toLowerCase().includes(q)
        );
      }

      if (department) {
        employees = employees.filter(e => e.departmentName === department || e.departmentId === department);
      }

      if (status) {
        employees = employees.filter(e => e.employmentStatus === status);
      }

      if (managerId) {
        employees = employees.filter(e => e.managerId === managerId);
      }

      const total = employees.length;
      const startIndex = (Number(page) - 1) * Number(limit);
      const paginated = employees.slice(startIndex, startIndex + Number(limit));

      return res.status(200).json({
        success: true,
        count: paginated.length,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)) || 1,
        employees: paginated
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getEmployeeById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const employee = EmployeeModel.findById(id);
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      // Check permissions: Employee can only view themselves; Manager can view their team or public profile
      if (req.user?.role === 'Employee') {
        const myEmp = req.employee || EmployeeModel.findOne({ userId: req.user._id });
        if (myEmp?._id !== id) {
          return res.status(403).json({ success: false, message: 'Unauthorized to view details of other employees.' });
        }
      }

      const user = UserModel.findById(employee.userId);
      const balances = LeaveBalanceModel.find({ employeeId: employee._id });

      return res.status(200).json({
        success: true,
        employee,
        user: user ? { _id: user._id, email: user.email, role: user.role, isActive: user.isActive } : null,
        leaveBalances: balances
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async createEmployee(req: AuthRequest, res: Response) {
    try {
      const {
        name,
        firstName,
        lastName,
        email,
        workEmail,
        department,
        position,
        designation,
        salary,
        joinDate,
        dateOfJoining,
        phone,
        address,
        managerId,
        employmentType = 'Full-time',
        role = 'Employee'
      } = req.body;

      const empEmail = (workEmail || email || '').toLowerCase();
      if (!empEmail) {
        return res.status(400).json({ success: false, message: 'Work email is required.' });
      }

      const existingUser = UserModel.findOne({ email: empEmail });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'User with this email already exists.' });
      }

      const fName = firstName || (name ? name.split(' ')[0] : 'Employee');
      const lName = lastName || (name ? name.split(' ').slice(1).join(' ') : 'Member');
      const fullName = name || `${fName} ${lName}`;

      const deptName = department || 'Engineering';
      const desig = position || designation || 'Software Engineer';
      const joining = joinDate || dateOfJoining || new Date().toISOString().split('T')[0];

      // Generate code
      const count = EmployeeModel.find().length + 1;
      const employeeCode = `EMP-${count < 10 ? '00' + count : (count < 100 ? '0' + count : count)}`;

      // Default password hash for new employee
      const passwordHash = await bcrypt.hash('employee123', 10);

      const user = await UserModel.create({
        name: fullName,
        email: empEmail,
        passwordHash,
        role: ['HR', 'Manager', 'Employee'].includes(role) ? role : 'Employee',
        department: deptName,
        isActive: true
      });

      let mgrName = undefined;
      if (managerId) {
        const mgr = EmployeeModel.findById(managerId);
        if (mgr) mgrName = `${mgr.firstName} ${mgr.lastName}`;
      }

      const employee = EmployeeModel.create({
        employeeCode,
        userId: user._id,
        firstName: fName,
        lastName: lName,
        workEmail: empEmail,
        phone: phone || '+1 (555) 000-0000',
        departmentName: deptName,
        designation: desig,
        managerId,
        managerName: mgrName,
        dateOfJoining: joining,
        employmentType,
        employmentStatus: 'Active',
        salary: salary ? Number(salary) : undefined,
        address
      });

      UserModel.findByIdAndUpdate(user._id, { employeeId: employee._id });

      // Initialize leave balances for current year
      const year = new Date().getFullYear();
      LeaveBalanceModel.create({
        employeeId: employee._id,
        leaveType: 'Annual',
        leaveYear: year,
        allocatedDays: 18,
        usedDays: 0,
        pendingDays: 0,
        remainingDays: 18
      });
      LeaveBalanceModel.create({
        employeeId: employee._id,
        leaveType: 'Sick',
        leaveYear: year,
        allocatedDays: 12,
        usedDays: 0,
        pendingDays: 0,
        remainingDays: 12
      });
      LeaveBalanceModel.create({
        employeeId: employee._id,
        leaveType: 'Casual',
        leaveYear: year,
        allocatedDays: 8,
        usedDays: 0,
        pendingDays: 0,
        remainingDays: 8
      });

      AuditLogModel.create({
        actorId: req.user?._id || 'SYSTEM',
        actorName: req.user?.name || 'Administrator',
        action: 'CREATE_EMPLOYEE',
        entityType: 'Employee',
        entityId: employee._id,
        details: `Created employee profile for ${fullName} (${employeeCode})`
      });

      return res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        employee
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateEmployee(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const existing = EmployeeModel.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      // Check if employee is updating permitted personal fields vs HR updating all
      const isHR = req.user?.role === 'HR';
      const myEmp = req.employee || EmployeeModel.findOne({ userId: req.user?._id || '' });
      const isSelf = myEmp?._id === id;

      if (!isHR && !isSelf) {
        return res.status(403).json({ success: false, message: 'Unauthorized to update this employee.' });
      }

      const updates: any = {};
      if (isHR) {
        if (req.body.firstName) updates.firstName = req.body.firstName;
        if (req.body.lastName) updates.lastName = req.body.lastName;
        if (req.body.workEmail) updates.workEmail = req.body.workEmail.toLowerCase();
        if (req.body.departmentName) updates.departmentName = req.body.departmentName;
        if (req.body.designation || req.body.position) updates.designation = req.body.designation || req.body.position;
        if (req.body.salary !== undefined) updates.salary = Number(req.body.salary);
        if (req.body.dateOfJoining) updates.dateOfJoining = req.body.dateOfJoining;
        if (req.body.employmentType) updates.employmentType = req.body.employmentType;
        if (req.body.employmentStatus) updates.employmentStatus = req.body.employmentStatus;
        if (req.body.managerId !== undefined) {
          updates.managerId = req.body.managerId;
          const mgr = EmployeeModel.findById(req.body.managerId);
          updates.managerName = mgr ? `${mgr.firstName} ${mgr.lastName}` : undefined;
        }
      }

      // Both HR and Self can update phone, address, emergencyContact
      if (req.body.phone) updates.phone = req.body.phone;
      if (req.body.address) updates.address = req.body.address;
      if (req.body.emergencyContact) updates.emergencyContact = req.body.emergencyContact;

      const updated = EmployeeModel.findByIdAndUpdate(id, updates);

      // Also update linked user's name/email if modified
      if (existing.userId && (updates.firstName || updates.lastName || updates.workEmail)) {
        const uUpdates: any = {};
        if (updates.firstName || updates.lastName) {
          const fn = updates.firstName || existing.firstName;
          const ln = updates.lastName || existing.lastName;
          uUpdates.name = `${fn} ${ln}`;
        }
        if (updates.workEmail) {
          uUpdates.email = updates.workEmail;
        }
        UserModel.findByIdAndUpdate(existing.userId, uUpdates);
      }

      AuditLogModel.create({
        actorId: req.user?._id || 'SYSTEM',
        actorName: req.user?.name || 'Administrator',
        action: 'UPDATE_EMPLOYEE',
        entityType: 'Employee',
        entityId: id,
        details: `Updated fields for ${existing.firstName} ${existing.lastName}`
      });

      return res.status(200).json({ success: true, message: 'Employee updated successfully', employee: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async toggleEmployeeStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body; // 'Active' or 'Inactive'
      const employee = EmployeeModel.findById(id);
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      const newStatus = status || (employee.employmentStatus === 'Active' ? 'Inactive' : 'Active');
      const updated = EmployeeModel.findByIdAndUpdate(id, { employmentStatus: newStatus });

      if (employee.userId) {
        UserModel.findByIdAndUpdate(employee.userId, { isActive: newStatus === 'Active' });
      }

      AuditLogModel.create({
        actorId: req.user?._id || 'SYSTEM',
        actorName: req.user?.name || 'Administrator',
        action: 'TOGGLE_EMPLOYEE_STATUS',
        entityType: 'Employee',
        entityId: id,
        details: `Status set to ${newStatus}`
      });

      return res.status(200).json({ success: true, message: `Employee status changed to ${newStatus}`, employee: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteEmployee(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const employee = EmployeeModel.findById(id);
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      EmployeeModel.findByIdAndDelete(id);
      if (employee.userId) {
        UserModel.findByIdAndDelete(employee.userId);
      }

      AuditLogModel.create({
        actorId: req.user?._id || 'SYSTEM',
        actorName: req.user?.name || 'Administrator',
        action: 'DELETE_EMPLOYEE',
        entityType: 'Employee',
        entityId: id,
        details: `Deleted employee record for ${employee.firstName} ${employee.lastName}`
      });

      return res.status(200).json({ success: true, message: 'Employee record deleted.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};
