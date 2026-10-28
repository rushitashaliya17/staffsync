import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { DepartmentModel, EmployeeModel, AuditLogModel } from '../models/index.js';

export const departmentController = {
  async getAllDepartments(req: AuthRequest, res: Response) {
    try {
      const departments = DepartmentModel.find();
      const employees = EmployeeModel.find();

      // Enrich with headcount
      const enriched = departments.map(d => {
        const count = employees.filter(e => e.departmentName === d.name || e.departmentId === d._id).length;
        return {
          ...d,
          employeeCount: count
        };
      });

      return res.status(200).json({ success: true, departments: enriched });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async createDepartment(req: AuthRequest, res: Response) {
    try {
      const { name, description, departmentHead } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, message: 'Department name is required' });
      }

      const dept = DepartmentModel.create({
        name,
        description: description || '',
        departmentHead,
        isActive: true
      });

      AuditLogModel.create({
        actorId: req.user?._id || 'SYSTEM',
        actorName: req.user?.name || 'Administrator',
        action: 'CREATE_DEPARTMENT',
        entityType: 'Department',
        entityId: dept._id,
        details: `Created department ${name}`
      });

      return res.status(201).json({ success: true, message: 'Department created', department: dept });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateDepartment(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const dept = DepartmentModel.findById(id);
      if (!dept) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }

      const updated = DepartmentModel.findByIdAndUpdate(id, req.body);
      return res.status(200).json({ success: true, message: 'Department updated', department: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteDepartment(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const dept = DepartmentModel.findById(id);
      if (!dept) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }

      // Check if employees are assigned
      const assigned = EmployeeModel.find().filter(e => e.departmentName === dept.name || e.departmentId === id);
      if (assigned.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete department with ${assigned.length} assigned employees. Reassign them first.`
        });
      }

      DepartmentModel.findByIdAndDelete(id);
      return res.status(200).json({ success: true, message: 'Department deleted' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};
