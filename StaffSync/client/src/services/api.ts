const API_BASE = '/api/v1';

function getToken(): string | null {
  return localStorage.getItem('staffsync_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'omit'
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `API error: ${response.statusText}`);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ success: boolean; token: string; user: any; employee: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  register: (userData: { name: string; email: string; password: string; role?: string; department?: string }) =>
    request<{ success: boolean; token: string; user: any; employee: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

  logout: () =>
    request<{ success: boolean; message: string }>('/auth/logout', { method: 'POST' }),

  getMe: () =>
    request<{ success: boolean; user: any; employee: any }>('/auth/me'),

  forgotPassword: (email: string) =>
    request<{ success: boolean; message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

  resetPassword: (payload: { email: string; newPassword: string }) =>
    request<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Employees
  getEmployees: (params?: { search?: string; department?: string; status?: string; teamOnly?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.department) query.append('department', params.department);
    if (params?.status) query.append('status', params.status);
    if (params?.teamOnly) query.append('teamOnly', 'true');
    const qs = query.toString();
    return request<{ success: boolean; employees: any[]; total: number }>(`/employees${qs ? `?${qs}` : ''}`);
  },

  getEmployee: (id: string) =>
    request<{ success: boolean; employee: any; user: any; leaveBalances: any[] }>(`/employees/${id}`),

  createEmployee: (employeeData: any) =>
    request<{ success: boolean; message: string; employee: any }>('/employees', {
      method: 'POST',
      body: JSON.stringify(employeeData)
    }),

  updateEmployee: (id: string, updates: any) =>
    request<{ success: boolean; message: string; employee: any }>(`/employees/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),

  toggleEmployeeStatus: (id: string, status?: string) =>
    request<{ success: boolean; message: string; employee: any }>(`/employees/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  deleteEmployee: (id: string) =>
    request<{ success: boolean; message: string }>(`/employees/${id}`, {
      method: 'DELETE'
    }),

  // Departments
  getDepartments: () =>
    request<{ success: boolean; departments: any[] }>('/departments'),

  createDepartment: (data: { name: string; description?: string; departmentHead?: string }) =>
    request<{ success: boolean; department: any }>('/departments', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Attendance
  checkIn: () =>
    request<{ success: boolean; message: string; attendance: any }>('/attendance/check-in', {
      method: 'POST'
    }),

  checkOut: () =>
    request<{ success: boolean; message: string; attendance: any }>('/attendance/check-out', {
      method: 'POST'
    }),

  getMyAttendance: (params?: { month?: number; year?: number }) => {
    const query = new URLSearchParams();
    if (params?.month) query.append('month', String(params.month));
    if (params?.year) query.append('year', String(params.year));
    const qs = query.toString();
    return request<{ success: boolean; today: any; records: any[]; summary: any }>(`/attendance/me${qs ? `?${qs}` : ''}`);
  },

  getAllAttendance: (params?: { date?: string; employeeId?: string; department?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.date) query.append('date', params.date);
    if (params?.employeeId) query.append('employeeId', params.employeeId);
    if (params?.department) query.append('department', params.department);
    if (params?.status) query.append('status', params.status);
    const qs = query.toString();
    return request<{ success: boolean; count: number; records: any[] }>(`/attendance${qs ? `?${qs}` : ''}`);
  },

  correctAttendance: (id: string, correction: { checkIn?: string; checkOut?: string; status?: string; notes?: string }) =>
    request<{ success: boolean; message: string; attendance: any }>(`/attendance/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(correction)
    }),

  getAttendanceSummary: () =>
    request<{ success: boolean; summary: any }>('/attendance/summary'),

  // Leaves
  applyLeave: (payload: { startDate: string; endDate: string; leaveType: string; reason: string }) =>
    request<{ success: boolean; message: string; leave: any }>('/leaves', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getMyLeaves: () =>
    request<{ success: boolean; count: number; leaves: any[] }>('/leaves/me'),

  getAllLeaves: (params?: { status?: string; employeeId?: string; department?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.employeeId) query.append('employeeId', params.employeeId);
    if (params?.department) query.append('department', params.department);
    const qs = query.toString();
    return request<{ success: boolean; count: number; leaves: any[] }>(`/leaves${qs ? `?${qs}` : ''}`);
  },

  approveLeave: (id: string, comments?: string) =>
    request<{ success: boolean; message: string; leave: any }>(`/leaves/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comments })
    }),

  rejectLeave: (id: string, comments?: string) =>
    request<{ success: boolean; message: string; leave: any }>(`/leaves/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comments })
    }),

  cancelLeave: (id: string) =>
    request<{ success: boolean; message: string; leave: any }>(`/leaves/${id}/cancel`, {
      method: 'POST'
    }),

  getMyBalances: () =>
    request<{ success: boolean; balances: any[] }>('/leaves/balances/me'),

  getLeavePolicies: () =>
    request<{ success: boolean; policies: any[] }>('/leaves/policies'),

  // Announcements
  getAnnouncements: () =>
    request<{ success: boolean; count: number; announcements: any[] }>('/announcements'),

  createAnnouncement: (payload: { title: string; content?: string; message?: string; category?: string; targetAudience?: string }) =>
    request<{ success: boolean; message: string; announcement: any }>('/announcements', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  deleteAnnouncement: (id: string) =>
    request<{ success: boolean; message: string }>(`/announcements/${id}`, {
      method: 'DELETE'
    }),

  // Trainings
  getTrainings: () =>
    request<{ success: boolean; count: number; trainings: any[] }>('/trainings'),

  getTraining: (id: string) =>
    request<{ success: boolean; training: any; enrollments: any[] }>(`/trainings/${id}`),

  createTraining: (payload: any) =>
    request<{ success: boolean; message: string; training: any }>('/trainings', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  deleteTraining: (id: string) =>
    request<{ success: boolean; message: string }>(`/trainings/${id}`, {
      method: 'DELETE'
    }),

  enrollTraining: (id: string) =>
    request<{ success: boolean; message: string; enrollment: any }>(`/trainings/${id}/enroll`, {
      method: 'POST'
    }),

  // Notifications
  getNotifications: () =>
    request<{ success: boolean; unreadCount: number; notifications: any[] }>('/notifications'),

  markNotificationRead: (id: string) =>
    request<{ success: boolean; notification: any }>(`/notifications/${id}/read`, {
      method: 'PATCH'
    }),

  markAllNotificationsRead: () =>
    request<{ success: boolean; message: string }>('/notifications/read-all', {
      method: 'PATCH'
    }),

  // Dashboards
  getEmployeeDashboard: () =>
    request<{ success: boolean; employee: any; todayAttendance: any; balances: any[]; recentLeaves: any[]; upcomingTrainings: any[]; announcements: any[]; unreadNotifications: number }>('/dashboard/employee'),

  getManagerDashboard: () =>
    request<{ success: boolean; teamCount: number; teamEmployees: any[]; attendanceToday: any; pendingLeaves: any[]; upcomingLeaves: any[]; trainings: any[]; trendData: any[] }>('/dashboard/manager'),

  getHRDashboard: () =>
    request<{ success: boolean; stats: any; departmentDistribution: any[]; attendanceTrend: any[]; pendingLeaves: any[]; recentAuditLogs: any[] }>('/dashboard/hr'),

  // Reports
  getEmployeeReport: () =>
    request<{ success: boolean; total: number; byDepartment: any; byEmploymentType: any; byStatus: any; data: any[] }>('/reports/employees'),

  getAttendanceReport: (params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    const qs = query.toString();
    return request<{ success: boolean; count: number; totalHours: string; statusBreakdown: any; records: any[] }>(`/reports/attendance${qs ? `?${qs}` : ''}`);
  },

  getLeaveReport: () =>
    request<{ success: boolean; totalRequests: number; totalApprovedDays: number; byType: any; byStatus: any; records: any[] }>('/reports/leaves'),

  getTrainingReport: () =>
    request<{ success: boolean; totalPrograms: number; totalEnrollments: number; completedCount: number; inProgressCount: number; completionRate: number; programs: any[] }>('/reports/trainings'),

  // Audit Logs
  getAuditLogs: () =>
    request<{ success: boolean; count: number; logs: any[] }>('/audit-logs')
};
