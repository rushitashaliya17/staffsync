import bcrypt from 'bcryptjs';
import { db } from '../config/db.js';
import {
  UserModel,
  EmployeeModel,
  DepartmentModel,
  AttendanceModel,
  LeaveModel,
  LeavePolicyModel,
  LeaveBalanceModel,
  AnnouncementModel,
  TrainingModel,
  TrainingEnrollmentModel,
  NotificationModel,
  AuditLogModel
} from '../models/index.js';

export async function runSeed(force = false) {
  db.init();

  const existingUsers = UserModel.find();
  if (existingUsers.length > 0 && !force) {
    console.log('[Seed] Database already seeded. Skipping.');
    return;
  }

  console.log('[Seed] Seeding StaffSync HRM database...');
  db.reset();

  // 1. Departments
  const deptEng = DepartmentModel.create({
    name: 'Engineering',
    description: 'Software development, cloud architecture, and product infrastructure',
    isActive: true
  });

  const deptHR = DepartmentModel.create({
    name: 'Human Resources',
    description: 'Talent acquisition, employee engagement, and organizational policy',
    isActive: true
  });

  const deptProduct = DepartmentModel.create({
    name: 'Product & Design',
    description: 'Product management, user research, and UI/UX design',
    isActive: true
  });

  const deptMarketing = DepartmentModel.create({
    name: 'Marketing & Sales',
    description: 'Brand strategy, corporate outreach, and client solutions',
    isActive: true
  });

  const deptFinance = DepartmentModel.create({
    name: 'Finance & Operations',
    description: 'Corporate payroll, accounting, and compliance operations',
    isActive: true
  });

  // 2. Default Passwords
  const hrHash = await bcrypt.hash('admin123', 10);
  const managerHash = await bcrypt.hash('manager123', 10);
  const empHash = await bcrypt.hash('employee123', 10);

  // 3. HR Administrator
  const hrUser = await UserModel.create({
    name: 'Eleanor Vance',
    email: 'hr@staffsync.com',
    passwordHash: hrHash,
    role: 'HR',
    department: 'Human Resources',
    isActive: true
  });

  const hrEmp = EmployeeModel.create({
    employeeCode: 'EMP-001',
    userId: hrUser._id,
    firstName: 'Eleanor',
    lastName: 'Vance',
    workEmail: 'hr@staffsync.com',
    phone: '+1 (555) 234-5678',
    departmentId: deptHR._id,
    departmentName: 'Human Resources',
    designation: 'VP of Human Resources',
    dateOfJoining: '2022-01-15',
    employmentType: 'Full-time',
    employmentStatus: 'Active',
    salary: 115000,
    address: '742 Evergreen Terrace, Springfield',
    emergencyContact: 'Robert Vance (+1 555-888-9999)'
  });
  UserModel.findByIdAndUpdate(hrUser._id, { employeeId: hrEmp._id });

  // 4. Managers
  const mgrTechUser = await UserModel.create({
    name: 'Marcus Sterling',
    email: 'manager.tech@staffsync.com',
    passwordHash: managerHash,
    role: 'Manager',
    department: 'Engineering',
    isActive: true
  });

  const mgrTechEmp = EmployeeModel.create({
    employeeCode: 'EMP-002',
    userId: mgrTechUser._id,
    firstName: 'Marcus',
    lastName: 'Sterling',
    workEmail: 'manager.tech@staffsync.com',
    phone: '+1 (555) 345-6789',
    departmentId: deptEng._id,
    departmentName: 'Engineering',
    designation: 'Engineering Director',
    dateOfJoining: '2022-03-01',
    employmentType: 'Full-time',
    employmentStatus: 'Active',
    salary: 135000,
    address: '10880 Wilshire Blvd, Los Angeles',
    emergencyContact: 'Sarah Sterling (+1 555-333-2222)'
  });
  UserModel.findByIdAndUpdate(mgrTechUser._id, { employeeId: mgrTechEmp._id });

  const mgrOpsUser = await UserModel.create({
    name: 'Clara Oswald',
    email: 'manager.hr@staffsync.com',
    passwordHash: managerHash,
    role: 'Manager',
    department: 'Human Resources',
    isActive: true
  });

  const mgrOpsEmp = EmployeeModel.create({
    employeeCode: 'EMP-003',
    userId: mgrOpsUser._id,
    firstName: 'Clara',
    lastName: 'Oswald',
    workEmail: 'manager.hr@staffsync.com',
    phone: '+1 (555) 456-7890',
    departmentId: deptHR._id,
    departmentName: 'Human Resources',
    designation: 'HR Operations Manager',
    dateOfJoining: '2022-06-10',
    employmentType: 'Full-time',
    employmentStatus: 'Active',
    salary: 98000,
    address: '42 Baker St, London',
    emergencyContact: 'Amy Pond (+1 555-444-1111)'
  });
  UserModel.findByIdAndUpdate(mgrOpsUser._id, { employeeId: mgrOpsEmp._id });

  // 5. 10 Employees
  const employeeData = [
    { first: 'Pravanshu', last: 'Samadhiya', email: 'pravanshu@gmail.com', dept: deptEng, roleTitle: 'Senior Full Stack Engineer', mgr: mgrTechEmp, salary: 92000 },
    { first: 'Sophia', last: 'Chen', email: 'employee1@staffsync.com', dept: deptEng, roleTitle: 'Frontend Engineer', mgr: mgrTechEmp, salary: 85000 },
    { first: 'Liam', last: 'O\'Connor', email: 'employee2@staffsync.com', dept: deptEng, roleTitle: 'Backend Specialist', mgr: mgrTechEmp, salary: 88000 },
    { first: 'Aria', last: 'Patel', email: 'employee3@staffsync.com', dept: deptProduct, roleTitle: 'UI/UX Designer', mgr: mgrTechEmp, salary: 78000 },
    { first: 'David', last: 'Kim', email: 'employee4@staffsync.com', dept: deptEng, roleTitle: 'DevOps Engineer', mgr: mgrTechEmp, salary: 95000 },
    { first: 'Emma', last: 'Watson', email: 'employee5@staffsync.com', dept: deptHR, roleTitle: 'HR Specialist', mgr: mgrOpsEmp, salary: 65000 },
    { first: 'James', last: 'Wilson', email: 'employee6@staffsync.com', dept: deptMarketing, roleTitle: 'Growth Marketer', mgr: mgrOpsEmp, salary: 72000 },
    { first: 'Mia', last: 'Garcia', email: 'employee7@staffsync.com', dept: deptFinance, roleTitle: 'Financial Analyst', mgr: mgrOpsEmp, salary: 80000 },
    { first: 'Ethan', last: 'Brooks', email: 'employee8@staffsync.com', dept: deptEng, roleTitle: 'QA Automation Lead', mgr: mgrTechEmp, salary: 82000 },
    { first: 'Olivia', last: 'Taylor', email: 'employee9@staffsync.com', dept: deptProduct, roleTitle: 'Product Associate', mgr: mgrTechEmp, salary: 70000 },
    { first: 'Noah', last: 'Jenkins', email: 'employee10@staffsync.com', dept: deptMarketing, roleTitle: 'Content Strategist', mgr: mgrOpsEmp, salary: 62000 }
  ];

  const createdEmployees: any[] = [];

  let codeCounter = 4;
  for (const emp of employeeData) {
    const code = `EMP-0${codeCounter < 10 ? '0' + codeCounter : codeCounter}`;
    codeCounter++;

    const u = await UserModel.create({
      name: `${emp.first} ${emp.last}`,
      email: emp.email,
      passwordHash: empHash,
      role: 'Employee',
      department: emp.dept.name,
      isActive: true
    });

    const e = EmployeeModel.create({
      employeeCode: code,
      userId: u._id,
      firstName: emp.first,
      lastName: emp.last,
      workEmail: emp.email,
      phone: `+1 (555) ${Math.floor(100 + Math.random() * 899)}-${Math.floor(1000 + Math.random() * 8999)}`,
      departmentId: emp.dept._id,
      departmentName: emp.dept.name,
      designation: emp.roleTitle,
      managerId: emp.mgr._id,
      managerName: `${emp.mgr.firstName} ${emp.mgr.lastName}`,
      dateOfJoining: '2023-04-12',
      employmentType: 'Full-time',
      employmentStatus: 'Active',
      salary: emp.salary,
      address: '100 Silicon Way, San Jose, CA',
      emergencyContact: `Family Contact (+1 555-900-${Math.floor(1000 + Math.random() * 8999)})`
    });

    UserModel.findByIdAndUpdate(u._id, { employeeId: e._id });
    createdEmployees.push({ user: u, employee: e });
  }

  // 6. Leave Policies
  LeavePolicyModel.create({
    name: 'Annual Paid Time Off',
    leaveType: 'Annual',
    annualAllowance: 18,
    workingDayRules: 'Excludes Saturdays and Sundays',
    applicableEmploymentTypes: ['Full-time', 'Part-time']
  });

  LeavePolicyModel.create({
    name: 'Medical & Sick Leave',
    leaveType: 'Sick',
    annualAllowance: 12,
    workingDayRules: 'Medical certificate requested after 3 consecutive days',
    applicableEmploymentTypes: ['Full-time', 'Part-time', 'Contract']
  });

  LeavePolicyModel.create({
    name: 'Casual & Personal Leave',
    leaveType: 'Casual',
    annualAllowance: 8,
    workingDayRules: 'Up to 3 days per instance',
    applicableEmploymentTypes: ['Full-time']
  });

  // 7. Leave Balances for all employees
  const currentYear = new Date().getFullYear();
  for (const item of createdEmployees) {
    LeaveBalanceModel.create({
      employeeId: item.employee._id,
      leaveType: 'Annual',
      leaveYear: currentYear,
      allocatedDays: 18,
      usedDays: 3,
      pendingDays: 2,
      remainingDays: 13
    });

    LeaveBalanceModel.create({
      employeeId: item.employee._id,
      leaveType: 'Sick',
      leaveYear: currentYear,
      allocatedDays: 12,
      usedDays: 1,
      pendingDays: 0,
      remainingDays: 11
    });

    LeaveBalanceModel.create({
      employeeId: item.employee._id,
      leaveType: 'Casual',
      leaveYear: currentYear,
      allocatedDays: 8,
      usedDays: 0,
      pendingDays: 0,
      remainingDays: 8
    });
  }

  // 8. Sample Attendance Records for multiple dates
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const twoDaysAgoStr = new Date(Date.now() - 172800000).toISOString().split('T')[0];

  // Today attendance for some employees
  for (let i = 0; i < createdEmployees.length; i++) {
    const item = createdEmployees[i];
    // Yesterday
    AttendanceModel.create({
      employeeId: item.employee._id,
      employeeName: `${item.employee.firstName} ${item.employee.lastName}`,
      employeeEmail: item.employee.workEmail,
      date: yesterdayStr,
      checkIn: '09:05:14 AM',
      checkOut: '05:32:41 PM',
      totalWorkedMinutes: 507,
      status: 'Present',
      notes: 'Full shift completed'
    });

    // 2 days ago
    AttendanceModel.create({
      employeeId: item.employee._id,
      employeeName: `${item.employee.firstName} ${item.employee.lastName}`,
      employeeEmail: item.employee.workEmail,
      date: twoDaysAgoStr,
      checkIn: i % 3 === 0 ? '09:48:10 AM' : '09:12:05 AM',
      checkOut: '05:15:30 PM',
      totalWorkedMinutes: i % 3 === 0 ? 447 : 483,
      status: i % 3 === 0 ? 'Late' : 'Present',
      notes: i % 3 === 0 ? 'Commute delay reported' : 'Standard hours'
    });
  }

  // Today: Pravanshu (first employee) has checkIn
  AttendanceModel.create({
    employeeId: createdEmployees[0].employee._id,
    employeeName: `${createdEmployees[0].employee.firstName} ${createdEmployees[0].employee.lastName}`,
    employeeEmail: createdEmployees[0].employee.workEmail,
    date: todayStr,
    checkIn: '09:15:22 AM',
    checkOut: undefined,
    totalWorkedMinutes: 0,
    status: 'Present',
    notes: 'Checked in via web portal'
  });

  // Second employee has completed shift today
  AttendanceModel.create({
    employeeId: createdEmployees[1].employee._id,
    employeeName: `${createdEmployees[1].employee.firstName} ${createdEmployees[1].employee.lastName}`,
    employeeEmail: createdEmployees[1].employee.workEmail,
    date: todayStr,
    checkIn: '08:58:11 AM',
    checkOut: '05:04:30 PM',
    totalWorkedMinutes: 486,
    status: 'Present'
  });

  // 9. Leave Requests (as seen in screenshots)
  LeaveModel.create({
    employeeId: createdEmployees[0].employee._id,
    employeeName: `${createdEmployees[0].employee.firstName} ${createdEmployees[0].employee.lastName}`,
    employeeEmail: createdEmployees[0].employee.workEmail,
    leaveType: 'Annual',
    startDate: '2026-11-05',
    endDate: '2026-11-06',
    totalDays: 2,
    reason: 'I have to go for Office Technical Conference & Meeting',
    status: 'Approved',
    approvedBy: 'HR',
    approverComments: 'Approved. Enjoy the conference sessions!',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  });

  LeaveModel.create({
    employeeId: createdEmployees[0].employee._id,
    employeeName: `${createdEmployees[0].employee.firstName} ${createdEmployees[0].employee.lastName}`,
    employeeEmail: createdEmployees[0].employee.workEmail,
    leaveType: 'Casual',
    startDate: '2026-11-10',
    endDate: '2026-11-12',
    totalDays: 3,
    reason: 'Family function at hometown',
    status: 'Rejected',
    approvedBy: 'HR',
    approverComments: 'Team has milestone deliverable on Nov 11. Please reschedule.',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  });

  LeaveModel.create({
    employeeId: createdEmployees[1].employee._id,
    employeeName: `${createdEmployees[1].employee.firstName} ${createdEmployees[1].employee.lastName}`,
    employeeEmail: createdEmployees[1].employee.workEmail,
    leaveType: 'Sick',
    startDate: '2026-11-15',
    endDate: '2026-11-16',
    totalDays: 2,
    reason: 'Doctor prescribed recovery rest',
    status: 'Pending',
    currentApprover: mgrTechEmp._id,
    createdAt: new Date().toISOString()
  });

  LeaveModel.create({
    employeeId: createdEmployees[2].employee._id,
    employeeName: `${createdEmployees[2].employee.firstName} ${createdEmployees[2].employee.lastName}`,
    employeeEmail: createdEmployees[2].employee.workEmail,
    leaveType: 'Annual',
    startDate: '2026-11-20',
    endDate: '2026-11-25',
    totalDays: 4,
    reason: 'Annual family holiday break',
    status: 'Pending',
    currentApprover: mgrTechEmp._id,
    createdAt: new Date().toISOString()
  });

  // 10. Announcements
  AnnouncementModel.create({
    title: 'Q4 All-Hands Townhall & Innovation Showcase',
    content: 'Join our company-wide quarterly review this Friday at 3:00 PM EST. Leadership will share our milestones, product roadmap, and employee recognition honors.',
    category: 'Company Update',
    authorId: hrUser._id,
    authorName: 'Eleanor Vance (VP of HR)',
    targetAudience: 'All',
    publishAt: new Date().toISOString(),
    isPublished: true
  });

  AnnouncementModel.create({
    title: 'Updated Flexible Work & Remote Stipend Policy',
    content: 'We have updated our remote working benefits and wellness allowance guidelines. Please review the updated handbook in your employee portal.',
    category: 'Policy',
    authorId: hrUser._id,
    authorName: 'Eleanor Vance (VP of HR)',
    targetAudience: 'Employees',
    publishAt: new Date().toISOString(),
    isPublished: true
  });

  AnnouncementModel.create({
    title: 'Manager Leadership Sync: Performance Review Cycle',
    content: 'All team leads and directors are requested to attend the Q4 Performance Calibration briefing scheduled for next Tuesday at 10:00 AM.',
    category: 'General',
    authorId: hrUser._id,
    authorName: 'Eleanor Vance (VP of HR)',
    targetAudience: 'Managers',
    publishAt: new Date().toISOString(),
    isPublished: true
  });

  // 11. Training & Development (matching screenshot examples like MongoDB CRUD, etc.)
  const training1 = TrainingModel.create({
    title: 'MongoDB CRUD & Performance Indexing',
    description: 'This Training Session is based on MongoDB CRUD operations, schema design patterns, aggregation pipelines, and high-throughput query optimization.',
    trainerName: 'Adnan Saif',
    instructor: 'Adnan Saif (Principal Architect)',
    date: '2026-11-05',
    startDate: '2026-11-05',
    endDate: '2026-11-07',
    deliveryMode: 'Online',
    locationOrLink: 'https://meet.google.com/staffsync-eng-train',
    targetAudience: 'Engineering & Data Teams',
    capacity: 35,
    enrollmentDeadline: '2026-11-03',
    status: 'Upcoming',
    createdBy: mgrTechUser._id,
    createdByName: 'Marcus Sterling (Engineering Director)'
  });

  const training2 = TrainingModel.create({
    title: 'Modern React 19 & Next-Gen State Management',
    description: 'Deep dive into concurrent React features, server actions, optimistic state updates, and clean modular component design.',
    trainerName: 'Maya Patel',
    instructor: 'Maya Patel',
    date: '2026-11-12',
    startDate: '2026-11-12',
    endDate: '2026-11-14',
    deliveryMode: 'Online',
    locationOrLink: 'https://meet.google.com/staffsync-react-deep',
    targetAudience: 'Frontend Developers',
    capacity: 25,
    enrollmentDeadline: '2026-11-10',
    status: 'Upcoming',
    createdBy: mgrTechUser._id,
    createdByName: 'Marcus Sterling'
  });

  const training3 = TrainingModel.create({
    title: 'Effective Workplace Communication & Empathy',
    description: 'Interactive workshop on constructive cross-functional feedback, conflict resolution, and collaborative problem solving.',
    trainerName: 'David H. Brooks',
    instructor: 'David H. Brooks',
    date: '2026-11-18',
    startDate: '2026-11-18',
    endDate: '2026-11-19',
    deliveryMode: 'Hybrid',
    locationOrLink: 'Conference Room 4B & Zoom Room',
    targetAudience: 'All Staff',
    capacity: 40,
    enrollmentDeadline: '2026-11-15',
    status: 'Upcoming',
    createdBy: hrUser._id,
    createdByName: 'Eleanor Vance'
  });

  // Training Enrollments
  TrainingEnrollmentModel.create({
    trainingId: training1._id,
    employeeId: createdEmployees[0].employee._id,
    employeeName: `${createdEmployees[0].employee.firstName} ${createdEmployees[0].employee.lastName}`,
    employeeEmail: createdEmployees[0].employee.workEmail,
    enrollmentStatus: 'Enrolled',
    completionStatus: 'In Progress',
    progressPercentage: 45
  });

  TrainingEnrollmentModel.create({
    trainingId: training1._id,
    employeeId: createdEmployees[1].employee._id,
    employeeName: `${createdEmployees[1].employee.firstName} ${createdEmployees[1].employee.lastName}`,
    employeeEmail: createdEmployees[1].employee.workEmail,
    enrollmentStatus: 'Enrolled',
    completionStatus: 'Not Started',
    progressPercentage: 0
  });

  // 12. Notifications
  NotificationModel.create({
    recipientId: createdEmployees[0].user._id,
    title: 'Leave Request Approved',
    message: 'Your leave application for 05 Nov 2026 - 06 Nov 2026 has been approved by HR.',
    notificationType: 'Leave',
    relatedEntityType: 'Leave',
    isRead: false
  });

  NotificationModel.create({
    recipientId: createdEmployees[0].user._id,
    title: 'New Training Available',
    message: 'You have been recommended for the MongoDB CRUD & Performance Indexing session.',
    notificationType: 'Training',
    relatedEntityType: 'Training',
    isRead: false
  });

  NotificationModel.create({
    recipientId: mgrTechUser._id,
    title: 'Pending Leave Request',
    message: 'Sophia Chen submitted a leave request for 15 Nov - 16 Nov awaiting your review.',
    notificationType: 'Leave',
    relatedEntityType: 'Leave',
    isRead: false
  });

  NotificationModel.create({
    recipientId: hrUser._id,
    title: 'New Employee Profile Created',
    message: 'Pravanshu Samadhiya was successfully registered into the Engineering department.',
    notificationType: 'System',
    isRead: true
  });

  // 13. Audit Logs
  AuditLogModel.create({
    actorId: hrUser._id,
    actorName: 'Eleanor Vance (HR)',
    action: 'CREATE_EMPLOYEE',
    entityType: 'Employee',
    entityId: createdEmployees[0].employee._id,
    details: 'Initial employee account provisioning for Pravanshu Samadhiya'
  });

  AuditLogModel.create({
    actorId: hrUser._id,
    actorName: 'Eleanor Vance (HR)',
    action: 'APPROVE_LEAVE',
    entityType: 'Leave',
    entityId: 'LVE-001',
    details: 'Approved 2 days annual leave for technical meeting'
  });

  console.log('[Seed] Database successfully populated with realistic organization records!');
}
