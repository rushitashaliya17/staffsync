import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../components/common/Toast.js';
import { Lock, Mail, ArrowLeft, Shield, Briefcase, UserCheck } from 'lucide-react';

interface LoginPageProps {
  onNavigateRegister: () => void;
  onNavigateHome: () => void;
}

export function LoginPage({ onNavigateRegister, onNavigateHome }: LoginPageProps) {
  const { login } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toastError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toastSuccess('Signed in successfully.');
    } catch (err: any) {
      toastError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col justify-center items-center p-4">
      {/* Back to Home Link */}
      <button
        onClick={onNavigateHome}
        className="mb-6 flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Portal Overview</span>
      </button>

      {/* Login Card */}
      <div className="w-full max-w-md bg-[#0f172a] rounded-2xl border border-slate-800 shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/30 text-lg mx-auto mb-3">
            SS
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">HRM Portal Login</h2>
          <p className="text-xs text-slate-400 mt-1">Sign in with your corporate StaffSync credentials</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#162032] border border-slate-700/80 rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#162032] border border-slate-700/80 rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <button
            onClick={onNavigateRegister}
            className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer ml-1"
          >
            Register
          </button>
        </div>

        {/* Quick Demo Pre-fill helpers */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center mb-3">
            Quick Fill Demo Accounts
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('hr@staffsync.com', 'admin123')}
              className="p-2 rounded-lg bg-[#162032] hover:bg-slate-800 border border-slate-700/60 text-center transition-colors cursor-pointer group"
            >
              <Shield className="w-4 h-4 text-indigo-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <div className="text-[11px] font-medium text-slate-200">HR Admin</div>
              <div className="text-[9px] text-slate-400">admin123</div>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('manager.tech@staffsync.com', 'manager123')}
              className="p-2 rounded-lg bg-[#162032] hover:bg-slate-800 border border-slate-700/60 text-center transition-colors cursor-pointer group"
            >
              <Briefcase className="w-4 h-4 text-amber-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <div className="text-[11px] font-medium text-slate-200">Manager</div>
              <div className="text-[9px] text-slate-400">manager123</div>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('pravanshu@gmail.com', 'employee123')}
              className="p-2 rounded-lg bg-[#162032] hover:bg-slate-800 border border-slate-700/60 text-center transition-colors cursor-pointer group"
            >
              <UserCheck className="w-4 h-4 text-emerald-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <div className="text-[11px] font-medium text-slate-200">Employee</div>
              <div className="text-[9px] text-slate-400">employee123</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
