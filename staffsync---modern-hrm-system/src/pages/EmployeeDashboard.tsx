import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../components/common/Toast.js';
import { api } from '../services/api.js';
import { Navbar } from '../components/layout/Navbar.js';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  BookOpen,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  Shield,
  Award
} from 'lucide-react';

export function EmployeeDashboard() {
  const { user, employee, refreshMe } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'announcements' | 'leaves' | 'attendance' | 'profile'>('announcements');
  const [loading, setLoading] = useState(false);

  // Data states
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [attendanceToday, setAttendanceToday] = useState<any>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<any>({});

  // Leave Form State
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveType, setLeaveType] = useState('Annual');
  const [leaveReason, setLeaveReason] = useState('');
  const [submittingLeave, setSubmittingLeave] = useState(false);

  // Profile Form State
  const [phone, setPhone] = useState(employee?.phone || '');
  const [address, setAddress] = useState(employee?.address || '');
  const [emergencyContact, setEmergencyContact] = useState(employee?.emergencyContact || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashRes, leavesRes, balancesRes, attRes, trainRes, annRes] = await Promise.all([
        api.getEmployeeDashboard(),
        api.getMyLeaves(),
        api.getMyBalances(),
        api.getMyAttendance(),
        api.getTrainings(),
        api.getAnnouncements()
      ]);

      if (dashRes.success) {
        setAttendanceToday(dashRes.todayAttendance);
      }
      if (leavesRes.success) {
        setLeaves(leavesRes.leaves || []);
      }
      if (balancesRes.success) {
        setBalances(balancesRes.balances || []);
      }
      if (attRes.success) {
        setAttendanceHistory(attRes.records || []);
        setAttendanceSummary(attRes.summary || {});
        if (attRes.today) setAttendanceToday(attRes.today);
      }
      if (trainRes.success) {
        setTrainings(trainRes.trainings || []);
      }
      if (annRes.success) {
        setAnnouncements(annRes.announcements || []);
      }
    } catch (err: any) {
      console.error('Error fetching employee dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  useEffect(() => {
    if (employee) {
      setPhone(employee.phone || '');
      setAddress(employee.address || '');
      setEmergencyContact(employee.emergencyContact || '');
    }
  }, [employee]);

  // Attendance Handlers
  const handleCheckIn = async () => {
    try {
      const res = await api.checkIn();
      toastSuccess(res.message);
      setAttendanceToday(res.attendance);
      fetchDashboardData();
    } catch (err: any) {
      toastError(err.message || 'Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    try {
      const res = await api.checkOut();
      toastSuccess(res.message);
      setAttendanceToday(res.attendance);
      fetchDashboardData();
    } catch (err: any) {
      toastError(err.message || 'Failed to check out');
    }
  };

  // Leave Handlers
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStartDate || !leaveEndDate || !leaveReason) {
      toastError('Please provide start date, end date, and reason.');
      return;
    }
    setSubmittingLeave(true);
    try {
      const res = await api.applyLeave({
        startDate: leaveStartDate,
        endDate: leaveEndDate,
        leaveType,
        reason: leaveReason
      });
      toastSuccess(res.message);
      setLeaveStartDate('');
      setLeaveEndDate('');
      setLeaveReason('');
      fetchDashboardData();
    } catch (err: any) {
      toastError(err.message || 'Failed to submit leave request');
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleCancelLeave = async (id: string) => {
    try {
      const res = await api.cancelLeave(id);
      toastSuccess(res.message);
      fetchDashboardData();
    } catch (err: any) {
      toastError(err.message || 'Failed to cancel leave');
    }
  };

  // Training Enrollment
  const handleEnrollTraining = async (trainingId: string) => {
    try {
      const res = await api.enrollTraining(trainingId);
      toastSuccess(res.message);
      fetchDashboardData();
    } catch (err: any) {
      toastError(err.message || 'Failed to enroll');
    }
  };

  // Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee?._id) return;
    setUpdatingProfile(true);
    try {
      const res = await api.updateEmployee(employee._id, {
        phone,
        address,
        emergencyContact
      });
      toastSuccess(res.message);
      refreshMe();
    } catch (err: any) {
      toastError(err.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const tabs = [
    { id: 'announcements', label: 'Announcements' },
    { id: 'leaves', label: 'Leaves' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'profile', label: 'Profile' }
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      <Navbar
        currentTab={activeTab}
        onSelectTab={t => setActiveTab(t as any)}
        availableTabs={tabs}
        title="Employee Portal"
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Mobile Tab Selector */}
        <div className="md:hidden flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800 mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 text-xs font-semibold rounded-md flex-1 whitespace-nowrap ${
                activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: ANNOUNCEMENTS & TRAININGS */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Announcements Section */}
              <div className="lg:col-span-2 bg-[#0f172a] rounded-xl border border-slate-800 p-6 shadow-xl">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                  <h2 className="text-base font-bold text-white tracking-tight">Announcements</h2>
                  <span className="text-xs text-slate-400">{announcements.length} updates</span>
                </div>

                {announcements.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    No announcements available right now.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {announcements.map(a => (
                      <div
                        key={a._id}
                        className="p-4 rounded-lg bg-[#162032] border border-slate-700/60 hover:border-blue-500/40 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-sm text-white">{a.title}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 font-medium border border-blue-700/50 shrink-0">
                            {a.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed mb-3">
                          {a.content || a.message}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>By {a.authorName || 'HR Team'}</span>
                          <span>{new Date(a.createdAt || a.publishAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Trainings Section */}
              <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 shadow-xl">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                  <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    <span>Trainings</span>
                  </h2>
                  <span className="text-xs text-slate-400">{trainings.length} programs</span>
                </div>

                {trainings.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    No active training modules available.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {trainings.map(t => (
                      <div
                        key={t._id}
                        className="p-4 rounded-lg bg-[#162032] border border-slate-700/60 hover:border-slate-600 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-xs text-white">{t.title}</h4>
                          {t.isUserEnrolled && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 font-medium border border-emerald-700/50">
                              Enrolled
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3 mb-3">
                          {t.description}
                        </p>

                        <div className="text-[11px] space-y-1 text-slate-400 mb-3 border-t border-slate-800/80 pt-2">
                          <div className="flex justify-between">
                            <span>Trainer:</span>
                            <span className="text-slate-200 font-medium">{t.trainerName || t.instructor || 'TBD'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Date:</span>
                            <span className="text-slate-200">{t.startDate || t.date || 'Upcoming'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Mode:</span>
                            <span className="text-slate-200">{t.deliveryMode || 'Online'}</span>
                          </div>
                        </div>

                        {!t.isUserEnrolled ? (
                          <button
                            onClick={() => handleEnrollTraining(t._id)}
                            className="w-full py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors cursor-pointer"
                          >
                            Enroll in Program
                          </button>
                        ) : (
                          <div className="text-center py-1 rounded bg-slate-800 text-[11px] text-emerald-400 font-medium">
                            ✓ Enrolled (Progress: {t.userEnrollment?.progressPercentage || 0}%)
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LEAVES */}
        {activeTab === 'leaves' && (
          <div className="space-y-6">
            {/* Balances cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {balances.map(b => (
                <div key={b._id} className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 shadow-md">
                  <div className="text-xs text-slate-400 font-medium mb-1">{b.leaveType} Leave</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-white tabular-nums">{b.remainingDays}</span>
                    <span className="text-xs text-slate-500">/ {b.allocatedDays} days remaining</span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400 flex justify-between">
                    <span>Used: {b.usedDays}d</span>
                    <span>Pending: {b.pendingDays}d</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Apply for Leave Form matching Screenshot 4 */}
            <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 shadow-xl">
              <h2 className="text-sm font-bold text-white mb-4 tracking-tight">Apply for Leave</h2>
              <form onSubmit={handleApplyLeave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Start Date</label>
                    <input
                      type="date"
                      required
                      value={leaveStartDate}
                      onChange={e => setLeaveStartDate(e.target.value)}
                      className="w-full bg-[#162032] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">End Date</label>
                    <input
                      type="date"
                      required
                      value={leaveEndDate}
                      onChange={e => setLeaveEndDate(e.target.value)}
                      className="w-full bg-[#162032] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Leave Type</label>
                    <select
                      value={leaveType}
                      onChange={e => setLeaveType(e.target.value)}
                      className="w-full bg-[#162032] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="Annual">Annual Leave</option>
                      <option value="Sick">Medical / Sick</option>
                      <option value="Casual">Casual / Personal</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Reason</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide details or reason for leave request..."
                    value={leaveReason}
                    onChange={e => setLeaveReason(e.target.value)}
                    className="w-full bg-[#162032] border border-slate-700/80 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingLeave}
                  className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submittingLeave ? 'Submitting request...' : 'Apply Leave'}
                </button>
              </form>
            </div>

            {/* My Leaves List matching Screenshot 4 */}
            <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 shadow-xl">
              <h2 className="text-sm font-bold text-white mb-4 tracking-tight">My Leaves</h2>
              {leaves.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No leave requests submitted yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {leaves.map(l => (
                    <div
                      key={l._id}
                      className="p-4 rounded-lg bg-[#162032] border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-xs text-white">
                            {l.startDate} → {l.endDate}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            ({l.totalDays} {l.totalDays === 1 ? 'day' : 'days'} · {l.leaveType})
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">{l.reason}</p>
                        {l.approverComments && (
                          <p className="text-[11px] text-slate-400 mt-1 italic">
                            Reviewer note: "{l.approverComments}" ({l.approvedBy || 'Manager/HR'})
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`px-3 py-1 rounded text-xs font-semibold ${
                            l.status === 'Approved'
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/60'
                              : l.status === 'Rejected'
                              ? 'bg-rose-950/80 text-rose-400 border border-rose-700/60'
                              : l.status === 'Cancelled'
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-amber-950/80 text-amber-400 border border-amber-700/60'
                          }`}
                        >
                          {l.status}
                        </span>

                        {l.status === 'Pending' && (
                          <button
                            onClick={() => handleCancelLeave(l._id)}
                            className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ATTENDANCE */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {/* Status and Action banner matching Screenshot 4 */}
            <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-base font-bold text-white tracking-tight">Today's Attendance</h2>
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                      attendanceToday?.checkIn && !attendanceToday?.checkOut
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/60'
                        : attendanceToday?.checkOut
                        ? 'bg-blue-950 text-blue-400 border border-blue-700/60'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {attendanceToday?.checkIn && !attendanceToday?.checkOut
                      ? 'Checked In'
                      : attendanceToday?.checkOut
                      ? 'Shift Completed'
                      : 'Checked Out'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                {attendanceToday && (
                  <div className="mt-2 text-xs text-slate-300">
                    In: <span className="font-semibold text-white">{attendanceToday.checkIn}</span>
                    {attendanceToday.checkOut && (
                      <> · Out: <span className="font-semibold text-white">{attendanceToday.checkOut}</span></>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {!attendanceToday?.checkIn ? (
                  <button
                    onClick={handleCheckIn}
                    className="flex-1 sm:flex-initial px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    Check In Now
                  </button>
                ) : !attendanceToday?.checkOut ? (
                  <button
                    onClick={handleCheckOut}
                    className="flex-1 sm:flex-initial px-6 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
                  >
                    Check Out Now
                  </button>
                ) : (
                  <div className="text-xs text-slate-400 bg-slate-800 px-4 py-2 rounded-lg">
                    ✓ Done for today
                  </div>
                )}
              </div>
            </div>

            {/* Attendance History matching Screenshot 4 */}
            <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <h3 className="text-sm font-bold text-white tracking-tight">Attendance History</h3>
                <div className="text-xs text-slate-400">
                  Total worked: <span className="text-white font-bold">{attendanceSummary.totalWorkedHours || 0} hrs</span>
                </div>
              </div>

              {attendanceHistory.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No attendance records logged yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {attendanceHistory.map(rec => (
                    <div
                      key={rec._id}
                      className="p-3.5 rounded-lg bg-[#162032] border border-slate-700/60 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="font-semibold text-xs text-white mb-0.5">{rec.date}</div>
                        <div className="text-[11px] text-slate-400">
                          In: {rec.checkIn} {rec.checkOut ? `| Out: ${rec.checkOut}` : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {rec.totalWorkedMinutes > 0 && (
                          <span className="text-xs text-slate-400 tabular-nums">
                            {(rec.totalWorkedMinutes / 60).toFixed(1)} hrs
                          </span>
                        )}
                        <span
                          className={`px-3 py-0.5 rounded text-xs font-semibold ${
                            rec.status === 'Present'
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/60'
                              : rec.status === 'Late'
                              ? 'bg-amber-950/80 text-amber-400 border border-amber-700/60'
                              : 'bg-blue-950/80 text-blue-400 border border-blue-700/60'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PROFILE */}
        {activeTab === 'profile' && (
          <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-8 shadow-xl max-w-3xl mx-auto">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-800 mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-2xl font-bold text-blue-400">
                {user?.name?.charAt(0) || 'E'}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{user?.name}</h2>
                <p className="text-xs text-slate-400">{employee?.designation || 'Staff Member'} · {user?.department || 'Engineering'}</p>
                <div className="mt-1 inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800/60">
                  <Shield className="w-3 h-3" />
                  <span>Role: {user?.role}</span>
                </div>
              </div>
            </div>

            {/* Readonly Core Credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="p-3.5 rounded-lg bg-[#162032] border border-slate-700/60">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Employee ID</div>
                <div className="text-xs font-bold text-white font-mono">{employee?.employeeCode || 'EMP-001'}</div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#162032] border border-slate-700/60">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Work Email</div>
                <div className="text-xs font-medium text-white">{employee?.workEmail || user?.email}</div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#162032] border border-slate-700/60">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Manager</div>
                <div className="text-xs font-medium text-white">{employee?.managerName || 'Direct Executive'}</div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#162032] border border-slate-700/60">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Date of Joining</div>
                <div className="text-xs font-medium text-white">{employee?.dateOfJoining || '2023-01-01'}</div>
              </div>
            </div>

            {/* Editable Profile Fields */}
            <form onSubmit={handleUpdateProfile} className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Personal & Contact Info</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-[#162032] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Emergency Contact</label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={e => setEmergencyContact(e.target.value)}
                    className="w-full bg-[#162032] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full bg-[#162032] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={updatingProfile}
                className="py-2.5 px-6 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {updatingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
