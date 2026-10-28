/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ToastProvider } from './components/common/Toast.js';
import { LandingPage } from './pages/LandingPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { EmployeeDashboard } from './pages/EmployeeDashboard.js';
import { ManagerDashboard } from './pages/ManagerDashboard.js';
import { HRDashboard } from './pages/HRDashboard.js';

function MainRouter() {
  const { user, loading, switchRole } = useAuth();
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register'>('landing');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs font-mono tracking-wider">INITIALIZING STAFFSYNC...</span>
      </div>
    );
  }

  // If user is authenticated, route directly to their role dashboard
  if (user) {
    if (user.role === 'HR') {
      return <HRDashboard />;
    }
    if (user.role === 'Manager') {
      return <ManagerDashboard />;
    }
    return <EmployeeDashboard />;
  }

  // Non-authenticated views
  if (authView === 'login') {
    return (
      <LoginPage
        onNavigateRegister={() => setAuthView('register')}
        onNavigateHome={() => setAuthView('landing')}
      />
    );
  }

  if (authView === 'register') {
    return (
      <RegisterPage
        onNavigateLogin={() => setAuthView('login')}
        onNavigateHome={() => setAuthView('landing')}
      />
    );
  }

  return (
    <LandingPage
      onNavigateLogin={() => setAuthView('login')}
      onNavigateRegister={() => setAuthView('register')}
      onQuickDemo={async (role) => {
        await switchRole(role);
      }}
    />
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainRouter />
      </AuthProvider>
    </ToastProvider>
  );
}
