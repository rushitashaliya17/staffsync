import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { NotificationItem, UserRole } from '../../types.js';
import { Bell, LogOut, Check, ChevronDown, User, ShieldCheck, Briefcase, Award } from 'lucide-react';

interface NavbarProps {
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
  availableTabs?: { id: string; label: string }[];
  title?: string;
}

export function Navbar({ currentTab, onSelectTab, availableTabs, title }: NavbarProps) {
  const { user, employee, logout, switchRole } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch {
      // quiet fail
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const roleBadgeColor = {
    HR: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
    Manager: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    Employee: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
  }[user?.role || 'Employee'];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0d1424]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand wordmark & portal tag */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-600/30 text-sm">
              SS
            </div>
            <span className="font-bold text-lg tracking-tight text-white">StaffSync</span>
          </div>

          <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded font-medium bg-slate-800 text-slate-400 border border-slate-700/60">
            {user?.role === 'HR' ? 'HR Portal' : user?.role === 'Manager' ? 'Manager Portal' : 'Employee Portal'}
          </span>
        </div>

        {/* Center: Tabs if provided */}
        {availableTabs && onSelectTab && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800">
            {availableTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                  currentTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        )}

        {/* Right side controls: Role Switcher, Notifications, User info, Logout */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Quick Demo Role Switcher Dropdown */}
          <div className="relative" ref={roleRef}>
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Switch demo role perspective"
            >
              <span className={`px-1.5 py-0.2 rounded text-[11px] ${roleBadgeColor}`}>
                {user?.role}
              </span>
              <span className="hidden sm:inline text-slate-400">Switch</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg bg-slate-900 border border-slate-800 shadow-2xl py-1.5 z-50 text-xs">
                <div className="px-3 py-1.5 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
                  Switch Demo Account
                </div>
                <button
                  onClick={() => { switchRole('HR'); setIsRoleDropdownOpen(false); }}
                  className="w-full text-left px-3 py-2 flex items-center justify-between text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div className="font-medium">HR Administrator</div>
                      <div className="text-[10px] text-slate-400">Eleanor Vance (hr@staffsync.com)</div>
                    </div>
                  </div>
                  {user?.role === 'HR' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </button>
                <button
                  onClick={() => { switchRole('Manager'); setIsRoleDropdownOpen(false); }}
                  className="w-full text-left px-3 py-2 flex items-center justify-between text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="font-medium">Engineering Manager</div>
                      <div className="text-[10px] text-slate-400">Marcus Sterling</div>
                    </div>
                  </div>
                  {user?.role === 'Manager' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </button>
                <button
                  onClick={() => { switchRole('Employee'); setIsRoleDropdownOpen(false); }}
                  className="w-full text-left px-3 py-2 flex items-center justify-between text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-medium">Staff Engineer</div>
                      <div className="text-[10px] text-slate-400">Pravanshu Samadhiya</div>
                    </div>
                  </div>
                  {user?.role === 'Employee' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </button>
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-slate-900" />
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-300 font-bold border border-blue-500/40">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n._id}
                        onClick={() => !n.isRead && handleMarkRead(n._id)}
                        className={`p-3.5 text-xs transition-colors cursor-pointer hover:bg-slate-800/40 ${
                          n.isRead ? 'opacity-70 bg-transparent' : 'bg-blue-950/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-slate-200">{n.title}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-400 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Name & Profile Badge */}
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-xs font-semibold text-white leading-tight">
              {user?.name}
            </span>
            <span className="text-[10px] text-slate-400 leading-tight">
              {employee?.designation || user?.department || user?.email}
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600/90 hover:bg-rose-600 shadow-sm transition-colors"
            title="Log out of StaffSync"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
