import React from 'react';
import { Users, CalendarCheck, ShieldCheck, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react';

interface LandingPageProps {
  onNavigateLogin: () => void;
  onNavigateRegister: () => void;
  onQuickDemo: (role: 'HR' | 'Manager' | 'Employee') => void;
}

export function LandingPage({ onNavigateLogin, onNavigateRegister, onQuickDemo }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-[#0d1424]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-600/30 text-sm">
              SS
            </div>
            <span className="font-bold text-lg tracking-tight text-white">StaffSync HRM</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateLogin}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              Login / Register
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 lg:py-24 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/50 text-blue-400 text-xs font-medium mb-8">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
          <span>Full-Stack Enterprise MERN HRM System</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl text-balance">
          Empower Your Workforce with <span className="text-blue-500">StaffSync</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          A smart Human Resource Management platform designed to simplify attendance tracking,
          leave management, employee records, and communication across teams.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onNavigateLogin}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/30 transition-all cursor-pointer"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onNavigateRegister}
            className="px-6 py-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all cursor-pointer"
          >
            Create Free Account
          </button>
        </div>

        {/* 1-Click Persona Previews */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
          <span>Or explore live demo as:</span>
          <button
            onClick={() => onQuickDemo('HR')}
            className="px-2.5 py-1 rounded bg-indigo-950/70 border border-indigo-700/60 text-indigo-300 hover:bg-indigo-900 transition-colors font-medium cursor-pointer"
          >
            HR Admin
          </button>
          <button
            onClick={() => onQuickDemo('Manager')}
            className="px-2.5 py-1 rounded bg-amber-950/70 border border-amber-700/60 text-amber-300 hover:bg-amber-900 transition-colors font-medium cursor-pointer"
          >
            Manager
          </button>
          <button
            onClick={() => onQuickDemo('Employee')}
            className="px-2.5 py-1 rounded bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 hover:bg-emerald-900 transition-colors font-medium cursor-pointer"
          >
            Employee
          </button>
        </div>

        {/* Feature Cards Grid matching Screenshot 9 */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full text-left">
          <div className="p-6 rounded-xl bg-[#0f172a]/90 border border-slate-800/80 hover:border-blue-600/40 transition-all shadow-lg group">
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Employee Management</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Manage employee records, roles, profiles, and organization hierarchies efficiently with full search and CSV reporting.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#0f172a]/90 border border-slate-800/80 hover:border-emerald-600/40 transition-all shadow-lg group">
            <div className="w-10 h-10 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Attendance & Leave</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Track real-time check-in/out attendance and handle automated multi-tiered leave approvals with atomic balance deduction.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#0f172a]/90 border border-slate-800/80 hover:border-amber-600/40 transition-all shadow-lg group">
            <div className="w-10 h-10 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">HR & Manager Tools</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Broadcast company-wide announcements, review assigned team performance, and audit sensitive administrative changes.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#0f172a]/90 border border-slate-800/80 hover:border-indigo-600/40 transition-all shadow-lg group">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Employee Growth</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Organize professional development workshops, monitor employee enrollment progress, and track skill certifications.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        © 2026 StaffSync HRM Portal — Empowering Teams, Simplifying Workflows.
      </footer>
    </div>
  );
}
