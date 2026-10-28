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
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Calendar,
  UserCheck,
  UserX,
  FileText,
  Mail,
  Phone,
  Search,
  Filter,
  Check,
  X
} from 'lucide-react';

export function ManagerDashboard() {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'leaves' | 'training' | 'attendance' | 'team'>('leaves');
  const [loading, setLoading] = useState(false);

  // Dashboard Overview Data
  const [teamCount, setTeamCount] = useState(0);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [attendanceToday, setAttendanceToday] = useState<any>({ present: 0, late: 0, absent: 0 });
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [allTeamLeaves, setAllTeamLeaves] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [teamAttendanceRecords, setTeamAttendanceRecords] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Leave Action Modal / State
  const [actionLeaveModal, setActionLeaveModal] = useState<{ id: string; type: 'approve' | 'reject'; employeeName: string } | null>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // Training Form State
  const [trainingTitle, setTrainingTitle] = useState('');
  const [trainingDate, setTrainingDate] = useState('');
  const [trainingDescription, setTrainingDescription] = useState('');
  const [trainerName, setTrainerName] = useState(user?.name || '');
  const [trainingCategory, setTrainingCategory] = useState('Technical');
  const [trainingCapacity, setTrainingCapacity] = useState('20');
  const [creatingTraining, setCreatingTraining] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashRes, leavesRes, teamRes, trainRes, attRes] = await Promise.all([
        api.getManagerDashboard(),
        api.getAllLeaves(),
        api.getEmployees({ teamOnly: true }),
        api.getTrainings(),
        api.getAllAttendance({ date: selectedDate })
      ]);

      if (dashRes.success) {
        setTeamCount(dashRes.teamCount || 0);
        if (dashRes.attendanceToday) setAttendanceToday(dashRes.attendanceToday);
        setPendingLeaves(dashRes.pendingLeaves || []);
      }

      if (leavesRes.success) {
        setAllTeamLeaves(leavesRes.leaves || []);
      }

      if (teamRes.success) {
        setTeamMembers(teamRes.employees || []);
      }

      if (trainRes.success) {
        setTrainings(trainRes.trainings || []);
      }

      if (attRes.success) {
        setTeamAttendanceRecords(attRes.records || []);
      }
    } catch (err: any) {
      console.error('Error fetching manager dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  // Refetch attendance when selected date changes
  useEffect(() => {
    const fetchDateAttendance = async () => {
      try {
        const res = await api.getAllAttendance({ date: selectedDate });
        if (res.success) {
          setTeamAttendanceRecords(res.records || []);
        }
      } catch (err: any) {
        console.error('Failed to fetch attendance for date:', err);
      }
    };
    fetchDateAttendance();
  }, [selectedDate]);

  // Leave Approval / Rejection Handlers
  const handleConfirmLeaveAction = async () => {
    if (!actionLeaveModal) return;
    setProcessingAction(true);
    try {
      if (actionLeaveModal.type === 'approve') {
        const res = await api.approveLeave(actionLeaveModal.id, approvalComment);
        toastSuccess(res.message || 'Leave approved successfully');
      } else {
        const res = await api.rejectLeave(actionLeaveModal.id, approvalComment);
        toastSuccess(res.message || 'Leave rejected');
      }
      setActionLeaveModal(null);
      setApprovalComment('');
      fetchDashboardData();
    } catch (err: any) {
      toastError(err.message || 'Failed to update leave status');
    } finally {
      setProcessingAction(false);
    }
  };

  // Training Creation Handler
  const handleCreateTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainingTitle || !trainingDate || !trainingDescription || !trainerName) {
      toastError('Please fill in all required training fields.');
      return;
    }
    setCreatingTraining(true);
    try {
      const res = await api.createTraining({
        title: trainingTitle,
        description: trainingDescription,
        trainerName,
        startDate: trainingDate,
        endDate: trainingDate,
        category: trainingCategory,
        maxParticipants: parseInt(trainingCapacity, 10) || 25
      });
      toastSuccess(res.message || 'Training program created');
      setTrainingTitle('');
      setTrainingDate('');
      setTrainingDescription('');
      fetchDashboardData();
    } catch (err: any) {
      toastError(err.message || 'Failed to create training');
    } finally {
      setCreatingTraining(false);
    }
  };

  const handleDeleteTraining = async (id: string) => {
    if (!confirm('Are you sure you want to delete this training session?')) return;
    try {
      const res = await api.deleteTraining(id);
      toastSuccess(res.message || 'Training deleted');
      fetchDashboardData();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete training');
    }
  };

  const tabs = [
    { id: 'leaves', label: 'Leave Applications' },
    { id: 'training', label: 'Training System' },
    { id: 'attendance', label: 'Team Attendance' },
    { id: 'team', label: 'Team Members' }
  ];

  // Filtered Team Members
  const filteredTeam = teamMembers.filter(m =>
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.position?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      <Navbar
        currentTab={activeTab}
        onSelectTab={t => setActiveTab(t as any)}
        availableTabs={tabs}
        title="Manager Portal"
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Header / Welcome Banner */}
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase font-bold tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                  Team Operations
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Welcome Back, {user?.name || 'Manager'}!
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Monitor your team's real-time attendance, review time-off requests, and assign skill training modules.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { setActiveTab('training'); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                New Training
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
            <div className="bg-[#162032] p-4 rounded-lg border border-slate-700/60">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">Assigned Team</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white">{teamCount || teamMembers.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">Direct reports</div>
            </div>

            <div className="bg-[#162032] p-4 rounded-lg border border-slate-700/60">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">Present Today</span>
                <UserCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400">{attendanceToday.present || 0}</div>
              <div className="text-[11px] text-slate-400 mt-1">
                {attendanceToday.late ? `${attendanceToday.late} late check-in` : 'All on time'}
              </div>
            </div>

            <div className="bg-[#162032] p-4 rounded-lg border border-slate-700/60">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">Pending Leaves</span>
                <CalendarCheck className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400">{pendingLeaves.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">Requires your review</div>
            </div>

            <div className="bg-[#162032] p-4 rounded-lg border border-slate-700/60">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">Trainings Active</span>
                <GraduationCap className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-2xl font-bold text-violet-400">{trainings.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">Upskilling programs</div>
            </div>
          </div>
        </div>

        {/* Mobile Tab Selectors */}
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

        {/* TAB 1: LEAVE APPLICATIONS */}
        {activeTab === 'leaves' && (
          <div className="space-y-6">
            {/* Pending Requests Section */}
            <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    Pending Leave Requests
                    {pendingLeaves.length > 0 && (
                      <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 rounded-full border border-amber-500/30">
                        {pendingLeaves.length} new
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Review and authorize leave applications submitted by your direct reports.
                  </p>
                </div>
              </div>

              {pendingLeaves.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-400">All caught up!</p>
                  <p className="text-xs text-slate-500 mt-1">No pending leave requests from your team.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingLeaves.map(leave => (
                    <div
                      key={leave._id}
                      className="bg-[#162032] rounded-lg border border-slate-700/60 p-5 flex flex-col justify-between hover:border-slate-600 transition-all shadow-md"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <h3 className="text-sm font-bold text-white">
                              {leave.employee?.name || leave.employeeName || 'Team Employee'}
                            </h3>
                            <span className="text-xs text-slate-400">
                              {leave.employee?.position || leave.employee?.department || 'Member'}
                            </span>
                          </div>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {leave.leaveType}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-300 mb-4 bg-slate-900/40 p-3 rounded border border-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-blue-400" /> Duration:
                            </span>
                            <span className="font-medium text-white">
                              {leave.startDate} to {leave.endDate} ({leave.totalDays} {leave.totalDays === 1 ? 'day' : 'days'})
                            </span>
                          </div>
                          <div className="pt-2 border-t border-slate-800/80">
                            <span className="text-slate-400 block mb-1">Reason:</span>
                            <p className="text-slate-200 italic">"{leave.reason}"</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-3 border-t border-slate-700/50">
                        <button
                          onClick={() => setActionLeaveModal({ id: leave._id, type: 'approve', employeeName: leave.employee?.name || 'Employee' })}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => setActionLeaveModal({ id: leave._id, type: 'reject', employeeName: leave.employee?.name || 'Employee' })}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Complete Team Leave History Table */}
            <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <h3 className="text-base font-bold text-white tracking-tight">Team Leave History</h3>
                <span className="text-xs text-slate-400">{allTeamLeaves.length} total records</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#162032] text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4">Days</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Reviewed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {allTeamLeaves.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          No leave records found.
                        </td>
                      </tr>
                    ) : (
                      allTeamLeaves.map(rec => (
                        <tr key={rec._id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-medium text-white">
                            {rec.employee?.name || rec.employeeName || 'Employee'}
                          </td>
                          <td className="py-3 px-4">{rec.leaveType}</td>
                          <td className="py-3 px-4 font-mono text-[11px]">
                            {rec.startDate} → {rec.endDate}
                          </td>
                          <td className="py-3 px-4 font-semibold">{rec.totalDays}</td>
                          <td className="py-3 px-4 max-w-[200px] truncate" title={rec.reason}>
                            {rec.reason}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                rec.status === 'Approved'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : rec.status === 'Rejected'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {rec.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-[11px]">
                            {rec.reviewedByName || (rec.status === 'Pending' ? '—' : 'System')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TRAINING SYSTEM */}
        {activeTab === 'training' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Training Form */}
            <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 shadow-xl h-fit">
              <div className="pb-4 border-b border-slate-800 mb-4">
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-400" />
                  Create Training Session
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Schedule skill training modules or workshops for team development.
                </p>
              </div>

              <form onSubmit={handleCreateTraining} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={trainingTitle}
                    onChange={e => setTrainingTitle(e.target.value)}
                    placeholder="e.g. Advanced TypeScript & Clean Code"
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
                    value={trainingDate}
                    onChange={e => setTrainingDate(e.target.value)}
                    className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Trainer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={trainerName}
                    onChange={e => setTrainerName(e.target.value)}
                    placeholder="e.g. Alex Henderson (Senior Architect)"
                    className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Category
                    </label>
                    <select
                      value={trainingCategory}
                      onChange={e => setTrainingCategory(e.target.value)}
                      className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Technical">Technical</option>
                      <option value="Leadership">Leadership</option>
                      <option value="Compliance">Compliance</option>
                      <option value="Productivity">Productivity</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Max Participants
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={trainingCapacity}
                      onChange={e => setTrainingCapacity(e.target.value)}
                      className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={trainingDescription}
                    onChange={e => setTrainingDescription(e.target.value)}
                    placeholder="Key objectives, agenda, prerequisites..."
                    className="w-full bg-[#162032] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creatingTraining}
                  className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {creatingTraining ? (
                    'Publishing...'
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Session
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Training List */}
            <div className="lg:col-span-2 bg-[#0f172a] rounded-xl border border-slate-800 p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <h3 className="text-base font-bold text-white tracking-tight">Active Training Programs</h3>
                <span className="text-xs text-slate-400">{trainings.length} sessions available</span>
              </div>

              {trainings.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs">
                  No training sessions created yet. Fill out the form to publish the first one.
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
                                {t.category || 'Workshop'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              Trainer: <span className="text-slate-200 font-medium">{t.trainerName}</span>
                            </p>
                          </div>

                          <button
                            onClick={() => handleDeleteTraining(t._id)}
                            title="Delete training session"
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed mb-4 bg-slate-900/30 p-3 rounded border border-slate-800/80">
                          {t.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-700/40 text-xs text-slate-400">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1 font-mono text-[11px] text-slate-300">
                            <Calendar className="w-3.5 h-3.5 text-blue-400" />
                            {t.startDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-emerald-400" />
                            {t.enrolledCount || 0} / {t.maxParticipants || '∞'} enrolled
                          </span>
                        </div>
                        <span className="text-[10px] uppercase font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {t.status || 'Active'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TEAM ATTENDANCE */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-6">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-400" />
                    Team Attendance Logs
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live clock-in timestamps, working durations, and attendance status by date.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs text-slate-400 font-medium">Date:</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="bg-[#162032] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Status pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-[#162032] p-3 rounded-lg border border-slate-700/60">
                  <div className="text-[11px] text-slate-400">Total Logged</div>
                  <div className="text-xl font-bold text-white mt-1">{teamAttendanceRecords.length}</div>
                </div>
                <div className="bg-[#162032] p-3 rounded-lg border border-slate-700/60">
                  <div className="text-[11px] text-slate-400">Present</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">
                    {teamAttendanceRecords.filter(r => r.status === 'Present').length}
                  </div>
                </div>
                <div className="bg-[#162032] p-3 rounded-lg border border-slate-700/60">
                  <div className="text-[11px] text-slate-400">Late</div>
                  <div className="text-xl font-bold text-amber-400 mt-1">
                    {teamAttendanceRecords.filter(r => r.status === 'Late').length}
                  </div>
                </div>
                <div className="bg-[#162032] p-3 rounded-lg border border-slate-700/60">
                  <div className="text-[11px] text-slate-400">Half Day</div>
                  <div className="text-xl font-bold text-violet-400 mt-1">
                    {teamAttendanceRecords.filter(r => r.status === 'Half Day').length}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#162032] text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Check-In</th>
                      <th className="py-3 px-4">Check-Out</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {teamAttendanceRecords.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          No attendance records found for {selectedDate}.
                        </td>
                      </tr>
                    ) : (
                      teamAttendanceRecords.map(rec => (
                        <tr key={rec._id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-medium text-white">
                            {rec.employee?.name || rec.employeeName || 'Team Member'}
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            {rec.employee?.department || rec.department || 'Engineering'}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]">{rec.date}</td>
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
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TEAM MEMBERS */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-6">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    Team Member Roster
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    View contact records, employee IDs, and roles of all members in your department.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search member, ID, title..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-[#162032] border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTeam.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                    No matching team members found.
                  </div>
                ) : (
                  filteredTeam.map(emp => (
                    <div
                      key={emp._id}
                      className="bg-[#162032] rounded-lg border border-slate-700/60 p-5 hover:border-slate-600 transition-all shadow-md flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold flex items-center justify-center text-sm shrink-0">
                              {emp.name?.slice(0, 2).toUpperCase() || 'EM'}
                            </div>
                            <div>
                              <h3 className="font-bold text-sm text-white">{emp.name}</h3>
                              <span className="text-xs text-slate-400">{emp.position || 'Specialist'}</span>
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              emp.status === 'Active'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-700 text-slate-400'
                            }`}
                          >
                            {emp.status || 'Active'}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs text-slate-300 bg-slate-900/40 p-3 rounded border border-slate-800 mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Employee ID:</span>
                            <span className="font-mono text-blue-300 font-semibold">{emp.employeeId}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Department:</span>
                            <span className="font-medium text-white">{emp.department || 'Technology'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Email:</span>
                            <span className="truncate max-w-[160px] text-slate-300" title={emp.email}>
                              {emp.email}
                            </span>
                          </div>
                          {emp.phone && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Phone:</span>
                              <span className="text-slate-300">{emp.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Joined: {emp.joiningDate || '2024'}</span>
                        <span className="text-blue-400 font-medium">Direct Report</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Leave Action Modal (Approve / Reject with comment) */}
      {actionLeaveModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0f172a] rounded-xl border border-slate-700 w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white capitalize">
                {actionLeaveModal.type} Leave Application
              </h3>
              <button
                onClick={() => setActionLeaveModal(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              You are about to <strong className={actionLeaveModal.type === 'approve' ? 'text-emerald-400' : 'text-rose-400'}>{actionLeaveModal.type}</strong> the time-off request for <strong className="text-white">{actionLeaveModal.employeeName}</strong>.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Feedback / Decision Comments (Optional):
              </label>
              <textarea
                rows={3}
                value={approvalComment}
                onChange={e => setApprovalComment(e.target.value)}
                placeholder={actionLeaveModal.type === 'approve' ? 'e.g. Approved. Please hand over pending tasks before leaving.' : 'e.g. Unfortunately cannot approve due to project deadline conflict.'}
                className="w-full bg-[#162032] border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActionLeaveModal(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingAction}
                onClick={handleConfirmLeaveAction}
                className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-60 ${
                  actionLeaveModal.type === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/30'
                }`}
              >
                {processingAction ? 'Processing...' : `Confirm ${actionLeaveModal.type === 'approve' ? 'Approval' : 'Rejection'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
