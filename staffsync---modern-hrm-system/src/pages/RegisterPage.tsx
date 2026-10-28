import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../components/common/Toast.js';
import { Lock, Mail, User, ArrowLeft, Building2 } from 'lucide-react';

interface RegisterPageProps {
  onNavigateLogin: () => void;
  onNavigateHome: () => void;
}

export function RegisterPage({ onNavigateLogin, onNavigateHome }: RegisterPageProps) {
  const { register } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Employee' | 'Manager' | 'HR'>('Employee');
  const [department, setDepartment] = useState('Engineering');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toastError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      await register({ name, email, password, role, department });
      toastSuccess('Account created successfully! Welcome to StaffSync.');
    } catch (err: any) {
      toastError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col justify-center items-center p-4">
      <button
        onClick={onNavigateHome}
        className="mb-6 flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Portal Overview</span>
      </button>

      <div className="w-full max-w-md bg-[#0f172a] rounded-2xl border border-slate-800 shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/30 text-lg mx-auto mb-3">
            SS
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">HRM Portal Register</h2>
          <p className="text-xs text-slate-400 mt-1">Create an employee, manager, or HR administrator account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                placeholder="Enter your name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-[#162032] border border-slate-700/80 rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="Enter your work email"
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
                placeholder="Enter your password (min 6 chars)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#162032] border border-slate-700/80 rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as any)}
                className="w-full bg-[#162032] border border-slate-700/80 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="Employee">Employee</option>
                <option value="Manager">Manager</option>
                <option value="HR">HR Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Department</label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full bg-[#162032] border border-slate-700/80 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="Engineering">Engineering</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Product & Design">Product & Design</option>
                <option value="Marketing & Sales">Marketing & Sales</option>
                <option value="Finance & Operations">Finance</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <button
            onClick={onNavigateLogin}
            className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer ml-1"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
