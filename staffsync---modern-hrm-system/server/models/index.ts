import { db, generateId } from '../config/db.js';
import bcrypt from 'bcryptjs';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'HR' | 'Manager' | 'Employee';
  employeeId?: string;
  department?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IEmployee {
  _id: string;
  employeeCode: string;
  userId: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  phone: string;
  profileImage?: string;
  departmentId?: string;
  departmentName?: string;
  designation: string;
  managerId?: string;
  managerName?: string;
  dateOfJoining: string;
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Intern';
  employmentStatus: 'Active' | 'Inactive' | 'On Leave' | 'Terminated';
  salary?: number;
  address?: string;
  emergencyContact?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IDepartment {
  _id: string;
  name: string;
  description: string;
  departmentHead?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IAttendance {
  _id: string;
  employeeId: string;
  employeeName?: string;
  employeeEmail?: string;
  date: string; // YYYY-MM-DD
  checkIn: string; // ISO string or time e.g. 09:15:00
  checkOut?: string;
  totalWorkedMinutes: number;
  status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'On Leave';
  notes?: string;
  recordedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ILeave {
  _id: string;
  employeeId: string;
  employeeName?: string;
  employeeEmail?: string;
  leaveType: 'Annual' | 'Sick' | 'Casual' | 'Maternity' | 'Unpaid';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  currentApprover?: string;
  approvedBy?: string;
  approverComments?: string;
  approvalHistory?: Array<{
    action: string;
    actorId: string;
    actorName: string;
    timestamp: string;
    comments?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ILeavePolicy {
  _id: string;
  name: string;
  leaveType: string;
  annualAllowance: number;
  workingDayRules: string;
  applicableEmploymentTypes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ILeaveBalance {
  _id: string;
  employeeId: string;
  leaveType: string;
  leaveYear: number;
  allocatedDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
  updatedAt: string;
}

export interface IAnnouncement {
  _id: string;
  title: string;
  content: string;
  message?: string; // alias from screenshots
  category: 'General' | 'Company Update' | 'Policy' | 'Event' | 'Urgent';
  authorId: string;
  authorName?: string;
  targetAudience: 'All' | 'Employees' | 'Managers';
  departmentId?: string;
  publishAt: string;
  expiresAt?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ITraining {
  _id: string;
  title: string;
  description: string;
  instructor?: string;
  trainerName: string;
  date?: string;
  startDate: string;
  endDate: string;
  deliveryMode: 'Online' | 'In-Person' | 'Hybrid';
  locationOrLink: string;
  targetAudience: string;
  assignedTo?: string[]; // user IDs or 'All'
  capacity: number;
  enrollmentDeadline: string;
  status: 'Upcoming' | 'In Progress' | 'Completed' | 'Cancelled';
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ITrainingEnrollment {
  _id: string;
  trainingId: string;
  employeeId: string;
  employeeName?: string;
  employeeEmail?: string;
  enrollmentStatus: 'Enrolled' | 'Waitlisted' | 'Cancelled';
  completionStatus: 'Not Started' | 'In Progress' | 'Completed';
  progressPercentage: number;
  completionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface INotification {
  _id: string;
  recipientId: string;
  title: string;
  message: string;
  notificationType: 'Leave' | 'Announcement' | 'Training' | 'Attendance' | 'System';
  relatedEntityType?: string;
  relatedEntityId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface IAuditLog {
  _id: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: string;
  timestamp: string;
}

// Model helper functions with validation and indexing
export const UserModel = {
  find(filter?: Partial<IUser>) {
    let items = db.get('users');
    if (filter) {
      items = items.filter(u => Object.entries(filter).every(([k, v]) => (u as any)[k] === v));
    }
    return items;
  },
  findOne(filter: Partial<IUser>) {
    const items = this.find(filter);
    return items[0] || null;
  },
  findById(id: string) {
    return this.findOne({ _id: id });
  },
  async create(data: Omit<IUser, '_id' | 'createdAt' | 'updatedAt' | 'passwordHash'> & { passwordHash?: string; password?: string }) {
    const existing = this.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      throw new Error(`User with email ${data.email} already exists`);
    }

    const passwordHash = data.passwordHash || (data.password ? await bcrypt.hash(data.password, 10) : '');
    const now = new Date().toISOString();
    const newUser: IUser = {
      _id: generateId(),
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      role: data.role || 'Employee',
      employeeId: data.employeeId,
      department: data.department,
      isActive: data.isActive !== undefined ? data.isActive : true,
      lastLoginAt: data.lastLoginAt,
      createdAt: now,
      updatedAt: now
    };

    const users = db.get('users');
    users.push(newUser);
    db.set('users', users);
    return newUser;
  },
  findByIdAndUpdate(id: string, updates: Partial<IUser>) {
    const users = db.get('users');
    const idx = users.findIndex(u => u._id === id);
    if (idx === -1) return null;
    const updated = { ...users[idx], ...updates, updatedAt: new Date().toISOString() };
    users[idx] = updated;
    db.set('users', users);
    return updated;
  },
  findByIdAndDelete(id: string) {
    const users = db.get('users');
    const filtered = users.filter(u => u._id !== id);
    db.set('users', filtered);
    return true;
  }
};

export const EmployeeModel = {
  find(filter?: any) {
    let items = db.get('employees');
    if (filter) {
      items = items.filter(e => {
        for (const [k, v] of Object.entries(filter)) {
          if ((e as any)[k] !== v) return false;
        }
        return true;
      });
    }
    return items;
  },
  findOne(filter: any) {
    const items = this.find(filter);
    return items[0] || null;
  },
  findById(id: string) {
    return this.findOne({ _id: id });
  },
  create(data: Omit<IEmployee, '_id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    const newEmp: IEmployee = {
      _id: generateId(),
      ...data,
      workEmail: data.workEmail.toLowerCase(),
      createdAt: now,
      updatedAt: now
    };
    const employees = db.get('employees');
    employees.push(newEmp);
    db.set('employees', employees);
    return newEmp;
  },
  findByIdAndUpdate(id: string, updates: Partial<IEmployee>) {
    const employees = db.get('employees');
    const idx = employees.findIndex(e => e._id === id);
    if (idx === -1) return null;
    const updated = { ...employees[idx], ...updates, updatedAt: new Date().toISOString() };
    employees[idx] = updated;
    db.set('employees', employees);
    return updated;
  },
  findByIdAndDelete(id: string) {
    const employees = db.get('employees');
    db.set('employees', employees.filter(e => e._id !== id));
    return true;
  }
};

export const DepartmentModel = {
  find(filter?: Partial<IDepartment>) {
    let items = db.get('departments');
    if (filter) {
      items = items.filter(d => Object.entries(filter).every(([k, v]) => (d as any)[k] === v));
    }
    return items;
  },
  findById(id: string) {
    return db.get('departments').find(d => d._id === id) || null;
  },
  create(data: Omit<IDepartment, '_id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    const dept: IDepartment = {
      _id: generateId(),
      ...data,
      createdAt: now,
      updatedAt: now
    };
    const items = db.get('departments');
    items.push(dept);
    db.set('departments', items);
    return dept;
  },
  findByIdAndUpdate(id: string, updates: Partial<IDepartment>) {
    const items = db.get('departments');
    const idx = items.findIndex(d => d._id === id);
    if (idx === -1) return null;
    const updated = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    items[idx] = updated;
    db.set('departments', items);
    return updated;
  },
  findByIdAndDelete(id: string) {
    const items = db.get('departments');
    db.set('departments', items.filter(d => d._id !== id));
    return true;
  }
};

export const AttendanceModel = {
  find(filter?: any) {
    let items = db.get('attendances');
    if (filter) {
      items = items.filter(a => {
        for (const [k, v] of Object.entries(filter)) {
          if ((a as any)[k] !== v) return false;
        }
        return true;
      });
    }
    return items;
  },
  findOne(filter: any) {
    const items = this.find(filter);
    return items[0] || null;
  },
  findById(id: string) {
    return this.findOne({ _id: id });
  },
  create(data: Omit<IAttendance, '_id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    const item: IAttendance = {
      _id: generateId(),
      ...data,
      createdAt: now,
      updatedAt: now
    };
    const items = db.get('attendances');
    items.push(item);
    db.set('attendances', items);
    return item;
  },
  findByIdAndUpdate(id: string, updates: Partial<IAttendance>) {
    const items = db.get('attendances');
    const idx = items.findIndex(a => a._id === id);
    if (idx === -1) return null;
    const updated = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    items[idx] = updated;
    db.set('attendances', items);
    return updated;
  }
};

export const LeaveModel = {
  find(filter?: any) {
    let items = db.get('leaves');
    if (filter) {
      items = items.filter(l => {
        for (const [k, v] of Object.entries(filter)) {
          if ((l as any)[k] !== v) return false;
        }
        return true;
      });
    }
    return items;
  },
  findOne(filter: any) {
    const items = this.find(filter);
    return items[0] || null;
  },
  findById(id: string) {
    return this.findOne({ _id: id });
  },
  create(data: Omit<ILeave, '_id' | 'createdAt' | 'updatedAt'> & { createdAt?: string }) {
    const now = data.createdAt || new Date().toISOString();
    const item: ILeave = {
      _id: generateId(),
      ...data,
      createdAt: now,
      updatedAt: now
    };
    const items = db.get('leaves');
    items.push(item);
    db.set('leaves', items);
    return item;
  },
  findByIdAndUpdate(id: string, updates: Partial<ILeave>) {
    const items = db.get('leaves');
    const idx = items.findIndex(l => l._id === id);
    if (idx === -1) return null;
    const updated = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    items[idx] = updated;
    db.set('leaves', items);
    return updated;
  }
};

export const LeavePolicyModel = {
  find() {
    return db.get('leavePolicies');
  },
  create(data: Omit<ILeavePolicy, '_id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    const item: ILeavePolicy = {
      _id: generateId(),
      ...data,
      createdAt: now,
      updatedAt: now
    };
    const items = db.get('leavePolicies');
    items.push(item);
    db.set('leavePolicies', items);
    return item;
  },
  findByIdAndUpdate(id: string, updates: Partial<ILeavePolicy>) {
    const items = db.get('leavePolicies');
    const idx = items.findIndex(p => p._id === id);
    if (idx === -1) return null;
    const updated = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    items[idx] = updated;
    db.set('leavePolicies', items);
    return updated;
  }
};

export const LeaveBalanceModel = {
  find(filter?: any) {
    let items = db.get('leaveBalances');
    if (filter) {
      items = items.filter(b => {
        for (const [k, v] of Object.entries(filter)) {
          if ((b as any)[k] !== v) return false;
        }
        return true;
      });
    }
    return items;
  },
  findOne(filter: any) {
    const items = this.find(filter);
    return items[0] || null;
  },
  create(data: Omit<ILeaveBalance, '_id' | 'updatedAt'>) {
    const item: ILeaveBalance = {
      _id: generateId(),
      ...data,
      updatedAt: new Date().toISOString()
    };
    const items = db.get('leaveBalances');
    items.push(item);
    db.set('leaveBalances', items);
    return item;
  },
  update(id: string, updates: Partial<ILeaveBalance>) {
    const items = db.get('leaveBalances');
    const idx = items.findIndex(b => b._id === id);
    if (idx === -1) return null;
    const updated = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    items[idx] = updated;
    db.set('leaveBalances', items);
    return updated;
  }
};

export const AnnouncementModel = {
  find(filter?: any) {
    let items = db.get('announcements');
    if (filter) {
      items = items.filter(a => {
        for (const [k, v] of Object.entries(filter)) {
          if ((a as any)[k] !== v) return false;
        }
        return true;
      });
    }
    return items;
  },
  findById(id: string) {
    return db.get('announcements').find(a => a._id === id) || null;
  },
  create(data: Omit<IAnnouncement, '_id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    const item: IAnnouncement = {
      _id: generateId(),
      ...data,
      createdAt: now,
      updatedAt: now
    };
    const items = db.get('announcements');
    items.push(item);
    db.set('announcements', items);
    return item;
  },
  findByIdAndUpdate(id: string, updates: Partial<IAnnouncement>) {
    const items = db.get('announcements');
    const idx = items.findIndex(a => a._id === id);
    if (idx === -1) return null;
    const updated = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    items[idx] = updated;
    db.set('announcements', items);
    return updated;
  },
  findByIdAndDelete(id: string) {
    const items = db.get('announcements');
    db.set('announcements', items.filter(a => a._id !== id));
    return true;
  }
};

export const TrainingModel = {
  find(filter?: any) {
    let items = db.get('trainings');
    if (filter) {
      items = items.filter(t => {
        for (const [k, v] of Object.entries(filter)) {
          if ((t as any)[k] !== v) return false;
        }
        return true;
      });
    }
    return items;
  },
  findById(id: string) {
    return db.get('trainings').find(t => t._id === id) || null;
  },
  create(data: Omit<ITraining, '_id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    const item: ITraining = {
      _id: generateId(),
      ...data,
      createdAt: now,
      updatedAt: now
    };
    const items = db.get('trainings');
    items.push(item);
    db.set('trainings', items);
    return item;
  },
  findByIdAndUpdate(id: string, updates: Partial<ITraining>) {
    const items = db.get('trainings');
    const idx = items.findIndex(t => t._id === id);
    if (idx === -1) return null;
    const updated = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    items[idx] = updated;
    db.set('trainings', items);
    return updated;
  },
  findByIdAndDelete(id: string) {
    const items = db.get('trainings');
    db.set('trainings', items.filter(t => t._id !== id));
    return true;
  }
};

export const TrainingEnrollmentModel = {
  find(filter?: any) {
    let items = db.get('trainingEnrollments');
    if (filter) {
      items = items.filter(e => {
        for (const [k, v] of Object.entries(filter)) {
          if ((e as any)[k] !== v) return false;
        }
        return true;
      });
    }
    return items;
  },
  findOne(filter: any) {
    const items = this.find(filter);
    return items[0] || null;
  },
  findById(id: string) {
    return this.findOne({ _id: id });
  },
  create(data: Omit<ITrainingEnrollment, '_id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    const item: ITrainingEnrollment = {
      _id: generateId(),
      ...data,
      createdAt: now,
      updatedAt: now
    };
    const items = db.get('trainingEnrollments');
    items.push(item);
    db.set('trainingEnrollments', items);
    return item;
  },
  findByIdAndUpdate(id: string, updates: Partial<ITrainingEnrollment>) {
    const items = db.get('trainingEnrollments');
    const idx = items.findIndex(e => e._id === id);
    if (idx === -1) return null;
    const updated = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    items[idx] = updated;
    db.set('trainingEnrollments', items);
    return updated;
  }
};

export const NotificationModel = {
  find(filter?: any) {
    let items = db.get('notifications');
    if (filter) {
      items = items.filter(n => {
        for (const [k, v] of Object.entries(filter)) {
          if ((n as any)[k] !== v) return false;
        }
        return true;
      });
    }
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  create(data: Omit<INotification, '_id' | 'createdAt'>) {
    const item: INotification = {
      _id: generateId(),
      ...data,
      createdAt: new Date().toISOString()
    };
    const items = db.get('notifications');
    items.push(item);
    db.set('notifications', items);
    return item;
  },
  findByIdAndUpdate(id: string, updates: Partial<INotification>) {
    const items = db.get('notifications');
    const idx = items.findIndex(n => n._id === id);
    if (idx === -1) return null;
    const updated = { ...items[idx], ...updates };
    items[idx] = updated;
    db.set('notifications', items);
    return updated;
  },
  markAllRead(recipientId: string) {
    const items = db.get('notifications');
    let count = 0;
    const updated = items.map(n => {
      if (n.recipientId === recipientId && !n.isRead) {
        count++;
        return { ...n, isRead: true };
      }
      return n;
    });
    db.set('notifications', updated);
    return count;
  }
};

export const AuditLogModel = {
  find(limit = 100) {
    const items = db.get('auditLogs');
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
  },
  create(data: Omit<IAuditLog, '_id' | 'timestamp'>) {
    const item: IAuditLog = {
      _id: generateId(),
      ...data,
      timestamp: new Date().toISOString()
    };
    const items = db.get('auditLogs');
    items.push(item);
    db.set('auditLogs', items);
    return item;
  }
};
