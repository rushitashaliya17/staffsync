import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel, EmployeeModel, AuditLogModel, DepartmentModel } from '../models/index.js';
import { AuthRequest, JWT_SECRET } from '../middleware/authMiddleware.js';

export const authController = {
  async login(req: AuthRequest, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide both email and password' });
      }

      const user = UserModel.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account is deactivated. Contact HR.' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      // Update last login
      UserModel.findByIdAndUpdate(user._id, { lastLoginAt: new Date().toISOString() });

      const employee = user.employeeId ? EmployeeModel.findById(user.employeeId) : EmployeeModel.findOne({ userId: user._id });

      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          employeeId: user.employeeId
        },
        employee
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async register(req: AuthRequest, res: Response) {
    try {
      const { name, email, password, role = 'Employee', department } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email and password are required' });
      }

      const existingUser = UserModel.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists' });
      }

      // Determine allowed role: default is Employee unless specified
      const finalRole = ['HR', 'Manager', 'Employee'].includes(role) ? role : 'Employee';

      const newUser = await UserModel.create({
        name,
        email: email.toLowerCase(),
        password,
        role: finalRole,
        department: department || 'Engineering',
        isActive: true
      });

      // Auto-create linked employee record
      const count = EmployeeModel.find().length + 1;
      const employeeCode = `EMP-${count < 10 ? '00' + count : (count < 100 ? '0' + count : count)}`;
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || 'User';

      const defaultDept = DepartmentModel.find()[0];

      const newEmp = EmployeeModel.create({
        employeeCode,
        userId: newUser._id,
        firstName,
        lastName,
        workEmail: email.toLowerCase(),
        phone: '+1 (555) 000-0000',
        departmentId: defaultDept ? defaultDept._id : undefined,
        departmentName: department || (defaultDept ? defaultDept.name : 'Engineering'),
        designation: finalRole === 'Manager' ? 'Team Lead' : (finalRole === 'HR' ? 'HR Specialist' : 'Software Engineer'),
        dateOfJoining: new Date().toISOString().split('T')[0],
        employmentType: 'Full-time',
        employmentStatus: 'Active'
      });

      UserModel.findByIdAndUpdate(newUser._id, { employeeId: newEmp._id });

      const token = jwt.sign(
        { id: newUser._id, email: newUser.email, role: newUser.role, name: newUser.name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      AuditLogModel.create({
        actorId: newUser._id,
        actorName: newUser.name,
        action: 'USER_REGISTERED',
        entityType: 'User',
        entityId: newUser._id,
        details: `Registered as ${finalRole}`
      });

      return res.status(201).json({
        success: true,
        message: 'Account registered successfully',
        token,
        user: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          department: newUser.department,
          employeeId: newEmp._id
        },
        employee: newEmp
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async logout(req: AuthRequest, res: Response) {
    res.clearCookie('token');
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  },

  async getMe(req: AuthRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const employee = req.user.employeeId
      ? EmployeeModel.findById(req.user.employeeId)
      : EmployeeModel.findOne({ userId: req.user._id });

    return res.status(200).json({
      success: true,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        department: req.user.department,
        employeeId: req.user.employeeId,
        isActive: req.user.isActive,
        createdAt: req.user.createdAt
      },
      employee
    });
  },

  async forgotPassword(req: AuthRequest, res: Response) {
    const { email } = req.body;
    const user = UserModel.findOne({ email: (email || '').toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email address' });
    }
    return res.status(200).json({
      success: true,
      message: 'Password reset instructions have been generated. (Demo token: RESET-' + Math.random().toString(36).substring(2, 8).toUpperCase() + ')'
    });
  },

  async resetPassword(req: AuthRequest, res: Response) {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email and new password are required' });
    }
    const user = UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    UserModel.findByIdAndUpdate(user._id, { passwordHash });
    return res.status(200).json({ success: true, message: 'Password has been updated successfully. You can now login.' });
  }
};
