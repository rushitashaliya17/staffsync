import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../components/common/Toast.js';
import { api } from '../services/api.js';
import { Navbar } from '../components/layout/Navbar.js';
import {
  Users,
  Clock,
  CalendarCheck,
  GraduationCap,
  Bell,
  BarChart3,
  ShieldAlert,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Download,
  Building,
  Mail,
  UserCheck,
  UserX,
  FileSpreadsheet,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export function HRDashboard() {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'employees' | 'leaves' | 'attendance' | 'announcements' | 'trainings' | 'reports' | 'audit'>('employees');
  const [loading, setLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState<any>({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingLeavesCount: 0,
    attendanceRate: 0,
    todayPresent: 0,
    activeTrainingsCount: 0,
    departmentsCount: 0
  });

  // Data Collections
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Search & Filter States
  const [searchEmp, setSearchEmp] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('');

  // Add Employee Form State
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPassword, setEmpPassword] = useState('Password123!');
  const [empRole, setEmpRole] = useState('Employee');
  const [empDept, setEmpDept] = useState('Engineering');
  const [empPosition, setEmpPosition] = useState('');
  const [empSalary, setEmpSalary] = useState('');
  const [empJoiningDate, setEmpJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [empPhone, setEmpPhone] = useState('');
  const [empAddress, setEmpAddress] = useState('');
  const [empManagerId, setEmpManagerId] = useState('');
  const [savingEmployee, setSavingEmployee] = useState(false);

  // Edit Employee State
  const [editingEmp, setEditingEmp] = useState<any | null>(null);

  // Attendance Correction Modal State
  const [correctingAttendance, setCorrectingAttendance] = useState<any | null>(null);
  const [correctCheckIn, setCorrectCheckIn] = useState('');
  const [correctCheckOut, setCorrectCheckOut] = useState('');
  const [correctStatus, setCorrectStatus] = useState('Present');
  const [correctNotes, setCorrectNotes] = useState('');
  const [savingCorrection, setSavingCorrection] = useState(false);

  // Leave Action Modal State
  const [actionLeaveModal, setActionLeaveModal] = useState<{ id: string; type: 'approve' | 'reject'; empName: string } | null>(null);
  const [leaveComment, setLeaveComment] = useState('');
  const [processingLeave, setProcessingLeave] = useState(false);

  // Announcement Form State
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annCategory, setAnnCategory] = useState('General');
  const [annAudience, setAnnAudience] = useState('All');
  const [creatingAnn, setCreatingAnn] = useState(false);

  // Training Form State
  const [trnTitle, setTrnTitle] = useState('');
  const [trnDate, setTrnDate] = useState('');
  const [trnDesc, setTrnDesc] = useState('');
  const [trnTrainer, setTrnTrainer] = useState('HR Specialist');
  const [trnCategory, setTrnCategory] = useState('Professional');
  const [creatingTrn, setCreatingTrn] = useState(false);

  // Fetch HR Overview
  const fetchOverview = async () => {
    setLoading(true);
    try {
      const [dashRes, empRes, deptRes, leavesRes, attRes, annRes, trnRes, logsRes] = await Promise.all([
        api.getHRDashboard(),
        api.getEmployees(),
        api.getDepartments(),
        api.getAllLeaves(),
        api.getAllAttendance({ date: selectedDate }),
        api.getAnnouncements(),
        api.getTrainings(),
        api.getAuditLogs()
      ]);

      if (dashRes.success) {
        setStats(dashRes.stats || {});
      }
      if (empRes.success) {
        setEmployees(empRes.employees || []);
        // extract managers for manager dropdown
        const mgrs = empRes.employees.filter((e: any) => e.department && (e.position?.toLowerCase().includes('manager') || e.position?.toLowerCase().includes('lead')));
        setManagers(mgrs);
      }
      if (deptRes.success) {
        setDepartments(deptRes.departments || []);
      }
      if (leavesRes.success) {
        setLeaves(leavesRes.leaves || []);
      }
      if (attRes.success) {
        setAttendanceRecords(attRes.records || []);
      }
      if (annRes.success) {
        setAnnouncements(annRes.announcements || []);
      }
      if (trnRes.success) {
        setTrainings(trnRes.trainings || []);
      }
      if (logsRes.success) {
        setAuditLogs(logsRes.logs || []);
      }
    } catch (err: any) {
      console.error('Failed to load HR dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [user]);

  // Refetch attendance when selected date changes
  useEffect(() => {
    const fetchDateAtt = async () => {
      try {
        const res = await api.getAllAttendance({ date: selectedDate });
        if (res.success) {
          setAttendanceRecords(res.records || []);
        }
      } catch (err: any) {
        console.error(err);
      }
    };
    fetchDateAtt();
  }, [selectedDate]);

  // Add / Create Employee
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName || !empEmail || !empPosition) {
      toastError('Please fill in required fields (Name, Email, Position).');
      return;
    }
    setSavingEmployee(true);
    try {
      const res = await api.createEmployee({
        name: empName,
        email: empEmail,
        password: empPassword,
        role: empRole,
        department: empDept,
        position: empPosition,
        salary: empSalary ? parseFloat(empSalary) : 55000,
        joiningDate: empJoiningDate,
        phone: empPhone,
        address: empAddress,
        managerId: empManagerId || undefined
      });
      toastSuccess(res.message || 'Employee created successfully');
      setShowAddEmpModal(false);
      // Reset form
      setEmpName('');
      setEmpEmail('');
      setEmpPosition('');
      setEmpSalary('');
      setEmpPhone('');
      setEmpAddress('');
      fetchOverview();
    } catch (err: any) {
      toastError(err.message || 'Failed to create employee');
    } finally {
      setSavingEmployee(false);
    }
  };

  // Update Employee
  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;
    try {
      const res = await api.updateEmployee(editingEmp._id, {
        name: editingEmp.name,
        department: editingEmp.department,
        position: editingEmp.position,
        salary: editingEmp.salary,
        phone: editingEmp.phone,
        address: editingEmp.address,
        status: editingEmp.status
      });
      toastSuccess(res.message || 'Employee updated');
      setEditingEmp(null);
      fetchOverview();
    } catch (err: any) {
      toastError(err.message || 'Failed to update employee');
    }
  };

  // Toggle Employee Status
  const handleToggleStatus = async (emp: any) => {
    const newStatus = emp.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await api.toggleEmployeeStatus(emp._id, newStatus);
      toastSuccess(res.message);
      fetchOverview();
    } catch (err: any) {
      toastError(err.message || 'Failed to update status');
    }
  };

  // Delete Employee
  const handleDeleteEmployee = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate and remove employee ${name}?`)) return;
    try {
      const res = await api.deleteEmployee(id);
      toastSuccess(res.message);
      fetchOverview();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete employee');
    }
  };

  // Correct Attendance
  const handleSaveCorrection = async () => {
    if (!correctingAttendance) return;
    setSavingCorrection(true);
    try {
      const res = await api.correctAttendance(correctingAttendance._id, {
        checkIn: correctCheckIn,
        checkOut: correctCheckOut,
        status: correctStatus,
        notes: correctNotes
      });
      toastSuccess(res.message || 'Attendance corrected');
      setCorrectingAttendance(null);
      fetchOverview();
    } catch (err: any) {
      toastError(err.message || 'Failed to correct attendance');
    } finally {
      setSavingCorrection(false);
    }
  };

  // Leave Actions
  const handleConfirmLeave = async () => {
    if (!actionLeaveModal) return;
    setProcessingLeave(true);
    try {
      if (actionLeaveModal.type === 'approve') {
        const res = await api.approveLeave(actionLeaveModal.id, leaveComment);
        toastSuccess(res.message);
      } else {
        const res = await api.rejectLeave(actionLeaveModal.id, leaveComment);
        toastSuccess(res.message);
      }
      setActionLeaveModal(null);
      setLeaveComment('');
      fetchOverview();
    } catch (err: any) {
      toastError(err.message || 'Failed to process leave request');
    } finally {
      setProcessingLeave(false);
    }
  };

  // Announcement Creation
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annMessage) {
      toastError('Title and message are required.');
      return;
    }
    setCreatingAnn(true);
    try {
      const res = await api.createAnnouncement({
        title: annTitle,
        content: annMessage,
        category: annCategory,
        targetAudience: annAudience
      });
      toastSuccess(res.message || 'Announcement published');
      setAnnTitle('');
      setAnnMessage('');
      fetchOverview();
    } catch (err: any) {
      toastError(err.message || 'Failed to publish announcement');
    } finally {
      setCreatingAnn(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      const res = await api.deleteAnnouncement(id);
      toastSuccess(res.message);
      fetchOverview();
    } catch (err: any) {
      toastError(err.message);
    }
  };

  // Training Creation
  const handleCreateTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trnTitle || !trnDate || !trnDesc) {
      toastError('Please fill in title, date, and description.');
      return;
    }
    setCreatingTrn(true);
    try {
      const res = await api.createTraining({
        title: trnTitle,
        startDate: trnDate,
        endDate: trnDate,
        description: trnDesc,
        trainerName: trnTrainer,
        category: trnCategory,
        maxParticipants: 50
      });
      toastSuccess(res.message);
      setTrnTitle('');
      setTrnDate('');
      setTrnDesc('');
      fetchOverview();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setCreatingTrn(false);
    }
  };

  const handleDeleteTraining = async (id: string) => {
    if (!confirm('Delete this training module?')) return;
    try {
      const res = await api.deleteTraining(id);
      toastSuccess(res.message);
      fetchOverview();
    } catch (err: any) {
      toastError(err.message);
    }
  };

  // Client-Side CSV Exporters
  const exportEmployeesCSV = () => {
    const headers = ['Employee ID', 'Name', 'Email', 'Role', 'Department', 'Position', 'Salary', 'Joining Date', 'Status'];
    const rows = employees.map(e => [
      e.employeeId,
      `"${e.name}"`,
      e.email,
      e.role || 'Employee',
      e.department,
      `"${e.position}"`,
      e.salary || 0,
      e.joiningDate,
      e.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StaffSync_Employees_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastSuccess('Employee roster exported to CSV');
  };

  const exportAttendanceCSV = () => {
    const headers = ['Date', 'Employee ID', 'Name', 'Department', 'Check-In', 'Check-Out', 'Duration (Hours)', 'Status'];
    const rows = attendanceRecords.map(r => [
      r.date,
      r.employee?.employeeId || r.employeeId || '',
      `"${r.employee?.name || r.employeeName || ''}"`,
      r.employee?.department || r.department || '',
      r.checkInTime || '',
      r.checkOutTime || '',
      r.durationHours || 0,
      r.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StaffSync_Attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastSuccess('Attendance records exported to CSV');
  };

  const exportLeavesCSV = () => {
    const headers = ['Employee', 'Type', 'Start Date', 'End Date', 'Days', 'Reason', 'Status', 'Applied On'];
    const rows = leaves.map(l => [
      `"${l.employee?.name || l.employeeName || ''}"`,
      l.leaveType,
      l.startDate,
      l.endDate,
      l.totalDays,
      `"${l.reason.replace(/"/g, '""')}"`,
      l.status,
      l.appliedAt?.split('T')[0] || ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StaffSync_Leaves_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastSuccess('Leave records exported to CSV');
  };

  // Filtered lists
  const filteredEmployees = employees.filter(e => {
    const matchesSearch =
      e.name?.toLowerCase().includes(searchEmp.toLowerCase()) ||
      e.email?.toLowerCase().includes(searchEmp.toLowerCase()) ||
      e.employeeId?.toLowerCase().includes(searchEmp.toLowerCase()) ||
      e.position?.toLowerCase().includes(searchEmp.toLowerCase());
    const matchesDept = !selectedDept || e.department === selectedDept;
    const matchesStatus = !selectedStatus || e.status === selectedStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const filteredLeaves = leaves.filter(l => {
    if (!leaveStatusFilter) return true;
    return l.status === leaveStatusFilter;
  });

  // Chart Data preparation
  const deptDistributionData = departments.map(d => ({
    name: d.name,
    count: employees.filter(e => e.department === d.name).length
  }));

  const leaveStatusData = [
    { name: 'Approved', value: leaves.filter(l => l.status === 'Approved').length, color: '#10b981' },
    { name: 'Pending', value: leaves.filter(l => l.status === 'Pending').length, color: '#f59e0b' },
    { name: 'Rejected', value: leaves.filter(l => l.status === 'Rejected').length, color: '#ef4444' }
  ];

  const attendanceWeeklyData = [
    { day: 'Mon', present: 12, late: 1, absent: 0 },
    { day: 'Tue', present: 13, late: 0, absent: 0 },
    { day: 'Wed', present: 11, late: 2, absent: 0 },
    { day: 'Thu', present: 12, late: 1, absent: 0 },
    { day: 'Fri', present: stats.todayPresent || 12, late: 1, absent: 0 }
  ];

  const tabs = [
    { id: 'employees', label: 'Employee Management' },
    { id: 'leaves', label: 'Leave Applications' },
    { id: 'attendance', label: 'Attendance Records' },
    { id: 'announcements', label: 'Announcements' },
    { id: 'trainings', label: 'Training System' },
    { id: 'reports', label: 'Reports & Analytics' },
    { id: 'audit', label: 'Audit Logs' }
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      <Navbar
        currentTab={activeTab}
        onSelectTab={t => setActiveTab(t as any)}
        availableTabs={tabs}
        title="HR Administration"
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top HR Overview Banner */}
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase font-bold tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                  HR Administrator Console
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Organization Operations Overview
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Centralized workforce administration, employee lifecycle, policy compliance, and analytics.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowAddEmpModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Employee
              </button>
              <button
                onClick={exportEmployeesCSV}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#162032] hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-6 pt-6 border-t border-slate-800/80">
            <div className="bg-[#162032] p-4 rounded-lg border border-slate-700/60">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">Total Staff</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.totalEmployees || employees.length}</div>
              <div className="text-[11px] text-emerald-400 mt-1">
                {stats.activeEmployees || employees.filter(e => e.status === 'Active').length} active
              </div>
            </div>

            <div className="bg-[#162032] p-4 rounded-lg border border-slate-700/60">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">Present Today</span>
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400">{stats.todayPresent || attendanceRecords.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">
                {stats.attendanceRate || 92}% check-in rate
              </div>
            </div>

            <div className="bg-[#162032] p-4 rounded-lg border border-slate-700/60">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">Pending Leaves</span>
                <CalendarCheck className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400">{stats.pendingLeavesCount || leaves.filter(l => l.status === 'Pending').length}</div>
              <div className="text-[11px] text-slate-400 mt-1">Awaiting decision</div>
            </div>

            <div className="bg-[#162032] p-4 rounded-lg border border-slate-700/60">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">Departments</span>
                <Building className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-2xl font-bold text-violet-400">{departments.length || 5}</div>
              <div className="text-[11px] text-slate-400 mt-1">Operational units</div>
            </div>

            <div className="bg-[#162032] p-4 rounded-lg border border-slate-700/60">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">Active Programs</span>
                <GraduationCap className="w-4 h-4 text-pink-400" />
              </div>
              <div className="text-2xl font-bold text-pink-400">{trainings.length || 3}</div>
              <div className="text-[11px] text-slate-400 mt-1">Training sessions</div>
            </div>
          </div>
        </div>

        {/* Mobile Tab Selector */}
        <div className="md:hidden flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 text-xs font-semibold rounded-md whitespace-nowrap flex-1 ${
                activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: EMPLOYEE MANAGEMENT */}
        {activeTab === 'employees' && (
          <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Staff Directory & Management
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage employee records, organizational roles, department assignments, and system status.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search staff, ID, role..."
                    value={searchEmp}
                    onChange={e => setSearchEmp(e.target.value)}
                    className="bg-[#162032] border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48 sm:w-56"
                  />
                </div>

                <select
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  className="bg-[#162032] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="">All Departments</option>
                  {departments.map(d => (
                    <option key={d._id} value={d.name}>{d.name}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="bg-[#162032] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#162032] text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Role / Department</th>
                    <th className="py-3 px-4">Position</th>
                    <th className="py-3 px-4">Salary</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No employees found matching current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map(emp => (
                      <tr key={emp._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                              {emp.name?.slice(0, 2).toUpperCase() || 'EM'}
                            </div>
                            <div>
                              <div className="font-semibold text-white">{emp.name}</div>
                              <div className="text-[11px] text-slate-400">{emp.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-blue-300 font-semibold">
                          {emp.employeeId}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-200">{emp.department}</div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                            {emp.role || 'Employee'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{emp.position}</td>
                        <td className="py-3 px-4 font-mono text-emerald-400">
                          ${emp.salary ? Number(emp.salary).toLocaleString() : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleStatus(emp)}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase cursor-pointer transition-colors ${
                              emp.status === 'Active'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                            }`}
                            title="Click to toggle status"
                          >
                            {emp.status}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingEmp({ ...emp })}
                              className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors cursor-pointer"
                              title="Edit Employee"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(emp._id, emp.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                              title="Delete Employee"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: LEAVE APPLICATIONS */}
        {activeTab === 'leaves' && (
          <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-blue-400" />
                  Organization-Wide Leave Requests
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Review time-off requests across all departments with atomic balance adjustment and policy auditing.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={leaveStatusFilter}
                  onChange={e => setLeaveStatusFilter(e.target.value)}
                  className="bg-[#162032] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending Decision</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                <button
                  onClick={exportLeavesCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#162032] hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#162032] text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4">Days</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredLeaves.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No leave applications found.
                      </td>
                    </tr>
                  ) : (
                    filteredLeaves.map(leave => (
                      <tr key={leave._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-white">
                          <div>{leave.employee?.name || leave.employeeName || 'Staff Member'}</div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            {leave.employee?.department || 'Department'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-200">{leave.leaveType}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {leave.startDate} → {leave.endDate}
                        </td>
                        <td className="py-3 px-4 font-semibold text-white">{leave.totalDays}</td>
                        <td className="py-3 px-4 max-w-[220px] truncate" title={leave.reason}>
                          {leave.reason}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              leave.status === 'Approved'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : leave.status === 'Rejected'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {leave.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {leave.status === 'Pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setActionLeaveModal({ id: leave._id, type: 'approve', empName: leave.employee?.name || 'Staff' })}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold shadow-xs transition-colors cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setActionLeaveModal({ id: leave._id, type: 'reject', empName: leave.employee?.name || 'Staff' })}
                                className="px-2.5 py-1 rounded bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">
                              Reviewed by {leave.reviewedByName || 'System'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ATTENDANCE RECORDS */}
        {activeTab === 'attendance' && (
          <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  Organization Attendance Logs
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verify clock-in and clock-out logs. HR administrators can make authorized manual corrections with audit tracking.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="bg-[#162032] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />

                <button
                  onClick={exportAttendanceCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#162032] text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Check-In</th>
                    <th className="py-3 px-4">Check-Out</th>
                    <th className="py-3 px-4">Total Hours</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Correction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {attendanceRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No attendance records logged for {selectedDate}.
                      </td>
                    </tr>
                  ) : (
                    attendanceRecords.map(rec => (
                      <tr key={rec._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-white">
                          {rec.employee?.name || rec.employeeName || 'Staff Member'}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {rec.employee?.department || rec.department || 'General'}
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-400">{rec.checkInTime || '—'}</td>
                        <td className="py-3 px-4 font-mono text-blue-400">{rec.checkOutTime || '—'}</td>
                        <td className="py-3 px-4 font-semibold text-slate-200">
                          {rec.durationHours ? `${rec.durationHours} hrs` : 'In progress'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              rec.status === 'Present'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : rec.status === 'Late'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : rec.status === 'Half Day'
                                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setCorrectingAttendance(rec);
                              setCorrectCheckIn(rec.checkInTime || '09:00 AM');
                              setCorrectCheckOut(rec.checkOutTime || '05:00 PM');
                              setCorrectStatus(rec.status || 'Present');
                              setCorrectNotes(rec.correctionNotes || '');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#162032] hover:bg-blue-600 hover:text-white text-slate-300 text-[11px] font-medium border border-slate-700 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            Correct
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Announcement Form */}
            <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 shadow-xl h-fit">
              <div className="pb-4 border-b border-slate-800 mb-4">
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-400" />
                  Post Announcement
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Broadcast notices, policy updates, and corporate events to the team.
                </p>
              </div>

              <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={annTitle}
                    onChange={e => setAnnTitle(e.target.value)}
                    placeholder="e.g. Annual Company Offsite 2026"
                    className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Category
                    </label>
                    <select
                      value={annCategory}
                      onChange={e => setAnnCategory(e.target.value)}
                      className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="General">General</option>
                      <option value="Policy">Policy</option>
                      <option value="Holiday">Holiday</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Target Audience
                    </label>
                    <select
                      value={annAudience}
                      onChange={e => setAnnAudience(e.target.value)}
                      className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="All">All Staff</option>
                      <option value="Employees">Employees Only</option>
                      <option value="Managers">Managers Only</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Announcement Message *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={annMessage}
                    onChange={e => setAnnMessage(e.target.value)}
                    placeholder="Provide full details, important deadlines, instructions..."
                    className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creatingAnn}
                  className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {creatingAnn ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </form>
            </div>

            {/* List */}
            <div className="lg:col-span-2 bg-[#0f172a] rounded-xl border border-slate-800 p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <h3 className="text-base font-bold text-white tracking-tight">Active Broadcasts</h3>
                <span className="text-xs text-slate-400">{announcements.length} published</span>
              </div>

              {announcements.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs">
                  No announcements currently published.
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map(ann => (
                    <div
                      key={ann._id}
                      className="p-5 rounded-lg bg-[#162032] border border-slate-700/60 hover:border-slate-600 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white">{ann.title}</h4>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 font-medium border border-blue-700/40">
                                {ann.category}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                                To: {ann.targetAudience}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteAnnouncement(ann._id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                            title="Delete announcement"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed mb-4 bg-slate-900/30 p-3 rounded border border-slate-800/80">
                          {ann.content || ann.message}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-700/40 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Published by {ann.authorName || 'HR Team'}</span>
                        <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: TRAINING SYSTEM */}
        {activeTab === 'trainings' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Training Form */}
            <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 shadow-xl h-fit">
              <div className="pb-4 border-b border-slate-800 mb-4">
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-400" />
                  Schedule Training
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Add professional programs, technical bootcamps, and mandatory compliance modules.
                </p>
              </div>

              <form onSubmit={handleCreateTraining} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Program Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={trnTitle}
                    onChange={e => setTrnTitle(e.target.value)}
                    placeholder="e.g. Information Security & Compliance"
                    className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={trnDate}
                    onChange={e => setTrnDate(e.target.value)}
                    className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Trainer
                    </label>
                    <input
                      type="text"
                      value={trnTrainer}
                      onChange={e => setTrnTrainer(e.target.value)}
                      className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Category
                    </label>
                    <select
                      value={trnCategory}
                      onChange={e => setTrnCategory(e.target.value)}
                      className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Professional">Professional</option>
                      <option value="Compliance">Compliance</option>
                      <option value="Technical">Technical</option>
                      <option value="Leadership">Leadership</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Curriculum Summary *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={trnDesc}
                    onChange={e => setTrnDesc(e.target.value)}
                    placeholder="Outline key learning outcomes..."
                    className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creatingTrn}
                  className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {creatingTrn ? 'Saving...' : 'Publish Program'}
                </button>
              </form>
            </div>

            {/* List */}
            <div className="lg:col-span-2 bg-[#0f172a] rounded-xl border border-slate-800 p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <h3 className="text-base font-bold text-white tracking-tight">Organization Programs</h3>
                <span className="text-xs text-slate-400">{trainings.length} programs</span>
              </div>

              {trainings.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs">
                  No training sessions active.
                </div>
              ) : (
                <div className="space-y-4">
                  {trainings.map(t => (
                    <div
                      key={t._id}
                      className="p-5 rounded-lg bg-[#162032] border border-slate-700/60 hover:border-slate-600 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white">{t.title}</h4>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 font-medium border border-blue-700/40">
                                {t.category}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Instructor: {t.trainerName}</p>
                          </div>

                          <button
                            onClick={() => handleDeleteTraining(t._id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                            title="Delete session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed mb-4 bg-slate-900/30 p-3 rounded border border-slate-800/80">
                          {t.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-700/40 flex items-center justify-between text-xs text-slate-400">
                        <span className="font-mono text-[11px] text-slate-300">Date: {t.startDate}</span>
                        <span>{t.enrolledCount || 0} / {t.maxParticipants || 50} Enrolled</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: REPORTS & ANALYTICS */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-6">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                    Human Capital Analytics & Insights
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time metrics on headcount distribution, weekly attendance trends, and time-off request resolution.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={exportEmployeesCSV}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#162032] hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Employees CSV
                  </button>
                  <button
                    onClick={exportAttendanceCSV}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#162032] hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Attendance CSV
                  </button>
                  <button
                    onClick={exportLeavesCSV}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#162032] hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Leaves CSV
                  </button>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1: Department Distribution */}
                <div className="bg-[#162032] p-5 rounded-lg border border-slate-700/60">
                  <h3 className="text-sm font-bold text-white mb-4">Department Headcount Distribution</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={deptDistributionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                          itemStyle={{ color: '#60a5fa' }}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Employees" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Weekly Attendance Flow */}
                <div className="bg-[#162032] p-5 rounded-lg border border-slate-700/60">
                  <h3 className="text-sm font-bold text-white mb-4">Weekly Attendance Check-Ins</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={attendanceWeeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                        />
                        <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} name="Present" dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} name="Late" dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 3: Leave Distribution */}
                <div className="bg-[#162032] p-5 rounded-lg border border-slate-700/60 lg:col-span-2">
                  <h3 className="text-sm font-bold text-white mb-2">Leave Request Resolution Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    {leaveStatusData.map(item => (
                      <div key={item.name} className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="text-xs text-slate-400">{item.name} Requests</div>
                          <div className="text-2xl font-bold text-white mt-1">{item.value}</div>
                        </div>
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                          style={{ backgroundColor: `${item.color}20`, color: item.color }}
                        >
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 shadow-xl space-y-6">
            <div className="pb-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-blue-400" />
                Administrative Compliance & Audit Trail
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Immutable records of employee onboarding, status toggles, attendance corrections, and leave authorizations.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#162032] text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Performed By</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No administrative audit logs registered yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map(log => (
                      <tr key={log._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-blue-500/10 text-blue-300 border border-blue-500/20">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-white">{log.performedByName}</td>
                        <td className="py-3 px-4 text-slate-400">{log.targetEntity}</td>
                        <td className="py-3 px-4 text-slate-300 max-w-[280px] truncate" title={JSON.stringify(log.details)}>
                          {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: ADD EMPLOYEE */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0f172a] rounded-xl border border-slate-700 w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                Add New Employee
              </h3>
              <button onClick={() => setShowAddEmpModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={empName}
                    onChange={e => setEmpName(e.target.value)}
                    placeholder="e.g. Maya Lin"
                    className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    value={empEmail}
                    onChange={e => setEmpEmail(e.target.value)}
                    placeholder="e.g. maya@staffsync.com"
                    className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Temporary Password *</label>
                  <input
                    type="text"
                    required
                    value={empPassword}
                    onChange={e => setEmpPassword(e.target.value)}
                    className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">System Role</label>
                  <select
                    value={empRole}
                    onChange={e => setEmpRole(e.target.value)}
                    className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                    <option value="HR">HR Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Department *</label>
                  <select
                    value={empDept}
                    onChange={e => setEmpDept(e.target.value)}
                    className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {departments.map(d => (
                      <option key={d._id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Position / Title *</label>
                  <input
                    type="text"
                    required
                    value={empPosition}
                    onChange={e => setEmpPosition(e.target.value)}
                    placeholder="e.g. Cloud Engineer"
                    className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Annual Salary ($)</label>
                  <input
                    type="number"
                    value={empSalary}
                    onChange={e => setEmpSalary(e.target.value)}
                    placeholder="e.g. 75000"
                    className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={empJoiningDate}
                    onChange={e => setEmpJoiningDate(e.target.value)}
                    className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={empPhone}
                    onChange={e => setEmpPhone(e.target.value)}
                    placeholder="+1 555-0199"
                    className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Assign Manager</label>
                  <select
                    value={empManagerId}
                    onChange={e => setEmpManagerId(e.target.value)}
                    className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">No Manager / Self-directed</option>
                    {managers.map(m => (
                      <option key={m._id} value={m._id}>{m.name} ({m.position})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Office / Residential Address</label>
                <input
                  type="text"
                  value={empAddress}
                  onChange={e => setEmpAddress(e.target.value)}
                  placeholder="Street, City, State"
                  className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEmployee}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors cursor-pointer shadow-md shadow-blue-600/30 disabled:opacity-60"
                >
                  {savingEmployee ? 'Saving...' : 'Create Employee Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT EMPLOYEE */}
      {editingEmp && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0f172a] rounded-xl border border-slate-700 w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-400" />
                Edit Employee: {editingEmp.name}
              </h3>
              <button onClick={() => setEditingEmp(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateEmployee} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingEmp.name}
                  onChange={e => setEditingEmp({ ...editingEmp, name: e.target.value })}
                  className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
                  <select
                    value={editingEmp.department}
                    onChange={e => setEditingEmp({ ...editingEmp, department: e.target.value })}
                    className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {departments.map(d => (
                      <option key={d._id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
                  <select
                    value={editingEmp.status}
                    onChange={e => setEditingEmp({ ...editingEmp, status: e.target.value })}
                    className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Position / Designation</label>
                <input
                  type="text"
                  value={editingEmp.position}
                  onChange={e => setEditingEmp({ ...editingEmp, position: e.target.value })}
                  className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Salary ($)</label>
                  <input
                    type="number"
                    value={editingEmp.salary || ''}
                    onChange={e => setEditingEmp({ ...editingEmp, salary: e.target.value })}
                    className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editingEmp.phone || ''}
                    onChange={e => setEditingEmp({ ...editingEmp, phone: e.target.value })}
                    className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Address</label>
                <input
                  type="text"
                  value={editingEmp.address || ''}
                  onChange={e => setEditingEmp({ ...editingEmp, address: e.target.value })}
                  className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingEmp(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ATTENDANCE CORRECTION */}
      {correctingAttendance && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0f172a] rounded-xl border border-slate-700 w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                Correct Attendance Record
              </h3>
              <button onClick={() => setCorrectingAttendance(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Adjusting record for <strong className="text-white">{correctingAttendance.employee?.name || correctingAttendance.employeeName}</strong> on <span className="font-mono text-blue-400">{correctingAttendance.date}</span>.
            </p>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Check-In Time</label>
                  <input
                    type="text"
                    value={correctCheckIn}
                    onChange={e => setCorrectCheckIn(e.target.value)}
                    placeholder="09:00 AM"
                    className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Check-Out Time</label>
                  <input
                    type="text"
                    value={correctCheckOut}
                    onChange={e => setCorrectCheckOut(e.target.value)}
                    placeholder="05:30 PM"
                    className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
                <select
                  value={correctStatus}
                  onChange={e => setCorrectStatus(e.target.value)}
                  className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Audit Reason / Correction Notes</label>
                <textarea
                  rows={2}
                  value={correctNotes}
                  onChange={e => setCorrectNotes(e.target.value)}
                  placeholder="e.g. Employee forgot biometric badge, verified by manager"
                  className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCorrectingAttendance(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingCorrection}
                onClick={handleSaveCorrection}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-md shadow-blue-600/30 cursor-pointer disabled:opacity-60"
              >
                {savingCorrection ? 'Saving...' : 'Apply Correction'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LEAVE ACTION */}
      {actionLeaveModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0f172a] rounded-xl border border-slate-700 w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white capitalize">
                {actionLeaveModal.type} Leave Application
              </h3>
              <button onClick={() => setActionLeaveModal(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Authorize decision for <strong className="text-white">{actionLeaveModal.empName}</strong>.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Decision Notes:
              </label>
              <textarea
                rows={3}
                value={leaveComment}
                onChange={e => setLeaveComment(e.target.value)}
                placeholder="Optional explanation notes..."
                className="w-full bg-[#162032] border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActionLeaveModal(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingLeave}
                onClick={handleConfirmLeave}
                className={`px-4 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer disabled:opacity-60 ${
                  actionLeaveModal.type === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/30'
                }`}
              >
                {processingLeave ? 'Processing...' : `Confirm ${actionLeaveModal.type === 'approve' ? 'Approval' : 'Rejection'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
