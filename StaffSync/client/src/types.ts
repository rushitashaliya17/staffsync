export type UserRole = 'HR' | 'Manager' | 'Employee';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  employeeId?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface Employee {
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
}

export interface Department {
  _id: string;
  name: string;
  description: string;
  departmentHead?: string;
  employeeCount?: number;
  isActive: boolean;
}

export interface Attendance {
  _id: string;
  employeeId: string;
  employeeName?: string;
  employeeEmail?: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  totalWorkedMinutes: number;
  status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'On Leave';
  notes?: string;
  recordedBy?: string;
}

export interface Leave {
  _id: string;
  employeeId: string;
  employeeName?: string;
  employeeEmail?: string;
  leaveType: 'Annual' | 'Sick' | 'Casual' | 'Maternity' | 'Unpaid';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  currentApprover?: string;
  approvedBy?: string;
  approverComments?: string;
  createdAt: string;
}

export interface LeaveBalance {
  _id: string;
  employeeId: string;
  leaveType: string;
  leaveYear: number;
  allocatedDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
}

export interface LeavePolicy {
  _id: string;
  name: string;
  leaveType: string;
  annualAllowance: number;
  workingDayRules: string;
  applicableEmploymentTypes: string[];
}

export interface Announcement {
  _id: string;
  title: string;
  content: string;
  message?: string;
  category: 'General' | 'Company Update' | 'Policy' | 'Event' | 'Urgent';
  authorId: string;
  authorName?: string;
  targetAudience: 'All' | 'Employees' | 'Managers';
  publishAt: string;
  isPublished: boolean;
  createdAt: string;
}

export interface Training {
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
  capacity: number;
  enrollmentDeadline: string;
  status: 'Upcoming' | 'In Progress' | 'Completed' | 'Cancelled';
  createdBy: string;
  createdByName?: string;
  enrolledCount?: number;
  isUserEnrolled?: boolean;
  createdAt: string;
}

export interface TrainingEnrollment {
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
}

export interface NotificationItem {
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

export interface AuditLog {
  _id: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: string;
  timestamp: string;
}
