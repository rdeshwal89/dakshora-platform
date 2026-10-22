import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Calendar,
  RefreshCw,
  Plus,
  ArrowRight,
  TrendingUp,
  Activity,
  Shield,
  Layers,
  ChevronRight,
  Sparkles,
  Phone,
  Search,
  BookOpen,
  Award,
  Bell,
  Sliders,
  Check,
  Building,
  UserCheck,
  UserX
} from 'lucide-react';
import {
  ErpRole,
  ErpModule,
  LiveErpDashboardData,
  DashboardTeacherClassSummary,
  DashboardLowAttendanceStudent
} from '../types';
import { fetchLiveErpDashboard } from '../services/api';

interface LiveDashboardHubProps {
  activeRole: ErpRole;
  activeSession: string;
  organizationId?: string;
  currentStaffId?: string;
  onNavigateModule: (module: ErpModule, extraState?: any) => void;
  onShowToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

export const LiveDashboardHub: React.FC<LiveDashboardHubProps> = ({
  activeRole,
  activeSession,
  organizationId: propOrgId,
  currentStaffId,
  onNavigateModule,
  onShowToast
}) => {
  const organizationId = propOrgId || (() => {
    try {
      const uStr = typeof window !== 'undefined' ? localStorage.getItem('dakshora_superadmin_user') : null;
      if (uStr) {
        const u = JSON.parse(uStr);
        return u?.organizationId || u?.organization_id || '';
      }
    } catch {}
    return '';
  })();
  // State
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [trendRange, setTrendRange] = useState<7 | 30>(7);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<LiveErpDashboardData | null>(null);
  const [principalSection, setPrincipalSection] = useState<'cockpit' | 'academics' | 'workload' | 'at_risk' | 'ai_insights'>('cockpit');
  const [showWidgetConfig, setShowWidgetConfig] = useState<boolean>(false);
  const [widgetSettings, setWidgetSettings] = useState({
    aiBriefing: true,
    kpis: true,
    attendanceTrend: true,
    distribution: true,
    lowAttendance: true,
    auditStream: true,
    quickActions: true
  });

  // Load Dashboard Data from Aggregate API
  const loadDashboard = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await fetchLiveErpDashboard({
        date: selectedDate,
        session: activeSession,
        range: trendRange,
        organization_id: organizationId,
        role: activeRole,
        staffId: currentStaffId
      });

      if (res.data && res.data.success) {
        setDashboardData(res.data as unknown as LiveErpDashboardData);
      } else {
        const rawErr = res.data?.error || res.data?.message || 'Failed to load dashboard data';
        const errMsg = typeof rawErr === 'string'
          ? rawErr
          : typeof rawErr === 'object' && rawErr !== null
          ? ((rawErr as any).message || JSON.stringify(rawErr))
          : String(rawErr);
        setError(errMsg);
      }
    } catch (err: any) {
      const errMsg = typeof err === 'string'
        ? err
        : err?.message
        ? err.message
        : typeof err === 'object'
        ? JSON.stringify(err)
        : 'Unable to connect to ERP API gateway';
      setError(errMsg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate, activeSession, trendRange, organizationId, activeRole, currentStaffId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Relative time helper
  const formatTimeAgo = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  // Render Skeletons
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Top bar skeleton */}
        <div className="h-32 rounded-3xl bg-white/90 border border-slate-200 p-6" />
        {/* KPI Cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-36 rounded-3xl bg-white/90 border border-slate-200 p-5 space-y-3">
              <div className="h-4 w-28 bg-slate-200 rounded-lg" />
              <div className="h-8 w-20 bg-slate-200 rounded-lg" />
              <div className="h-3 w-full bg-slate-200 rounded-lg" />
            </div>
          ))}
        </div>
        {/* Main Grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-80 rounded-3xl bg-white/90 border border-slate-200" />
          <div className="lg:col-span-4 h-80 rounded-3xl bg-white/90 border border-slate-200" />
        </div>
      </div>
    );
  }

  // Render Error
  const isDataValid = Boolean(
    dashboardData &&
    dashboardData.school &&
    dashboardData.students &&
    dashboardData.attendance
  );

  if (error || !dashboardData || !isDataValid) {
    return (
      <div className="glass-panel p-8 rounded-3xl border border-rose-500/30 text-center space-y-4 max-w-lg mx-auto my-12">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            {typeof error === 'string'
              ? error
              : typeof error === 'object' && error !== null
              ? (error as any).message || JSON.stringify(error)
              : (!dashboardData ? 'No data received from API gateway' : 'Incomplete metrics payload received from server')}
          </p>
        </div>
        <button
          onClick={() => loadDashboard()}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-mono inline-flex items-center gap-2 transition-all shadow-lg shadow-cyan-600/20"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  const savedBrand = typeof window !== 'undefined' ? (() => {
    try {
      const b = localStorage.getItem('dakshora_school_brand');
      return b ? JSON.parse(b) : null;
    } catch { return null; }
  })() : null;

  const school = dashboardData?.school || {
    name: savedBrand?.schoolName || 'School Dashboard',
    campus: savedBrand?.address || 'Main Campus',
    affiliationNo: savedBrand?.affiliationNo || '',
    academicSession: activeSession || '2026-27'
  };

  const students = dashboardData?.students || {
    total: 0,
    active: 0,
    newAdmissions: 0,
    byGender: { male: 0, female: 0, other: 0 }
  };

  const staff = dashboardData?.staff || {
    total: 0,
    active: 0,
    teachers: 0,
    nonTeaching: 0
  };

  const attendance = dashboardData?.attendance || {
    students: { totalEligible: 0, present: 0, absent: 0, late: 0, halfDay: 0, leave: 0, attendancePercent: 0, isMarked: false },
    staff: { totalEligible: 0, present: 0, absent: 0, late: 0, onLeave: 0, attendancePercent: 0, isMarked: false }
  };

  const studentDistribution = dashboardData?.studentDistribution || [];
  const attendanceTrend = dashboardData?.attendanceTrend || [];
  const lowAttendanceStudents = dashboardData?.lowAttendanceStudents || [];
  const recentActivities = dashboardData?.recentActivities || [];
  const teacherClassSummaries = dashboardData?.teacherClassSummaries || [];
  const absentStaffToday = dashboardData?.absentStaffToday || [];

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  // Strict Role Guard: LiveDashboardHub is strictly for Administration and Teaching Staff
  // Under NO circumstances should parents or students access aggregate school metrics or administrative action launchpads
  if (activeRole === 'parent' || activeRole === 'student') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP COMMAND & CONTEXT BANNER */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-3xl bg-white/95 border border-slate-200/90 shadow-xl shadow-slate-200/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 uppercase tracking-wider font-mono">
              {school.academicSession} Session
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 font-mono">
              {school.campus}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Affiliation: #{school.affiliationNo}
            </span>
          </div>

          <h2 className="text-xl font-extrabold text-slate-900 mt-1.5 flex items-center gap-2">
            <span>
              {activeRole === 'admin' && 'Principal & Management Command Cockpit 👋'}
              {activeRole === 'teacher' && 'Faculty Classroom Workspace 👋'}
              {activeRole === 'reception' && 'Front Desk & Reception Concierge 👋'}
              {activeRole === 'account' && 'Bursar & Accounts Overview Desk 👋'}
            </span>
          </h2>

          <p className="text-xs text-slate-500 font-mono mt-0.5">
            {school.name} • Live operational pulse across enrolled students, active faculty & daily registers.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-mono">
            <Calendar className="w-3.5 h-3.5 text-purple-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-800 focus:outline-none text-xs font-mono font-medium"
            />
          </div>

          {!isToday && (
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-mono font-bold transition-all"
            >
              Today
            </button>
          )}

          <button
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all disabled:opacity-50"
            title="Refresh Live Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-purple-600' : ''}`} />
          </button>

          {activeRole === 'admin' && (
            <button
              onClick={() => onNavigateModule('students', { showAddStudent: true })}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition-all hover:scale-105"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Enroll Student</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1B. PRINCIPAL COMMAND CENTER NAVIGATION & WIDGET CONFIGURATION */}
      {/* ========================================================================= */}
      {activeRole === 'admin' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 bg-white/95 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex flex-wrap items-center gap-1">
              <button
                onClick={() => setPrincipalSection('cockpit')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                  principalSection === 'cockpit'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Executive Cockpit</span>
              </button>
              <button
                onClick={() => setPrincipalSection('academics')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                  principalSection === 'academics'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-pink-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Academic & Curriculum</span>
              </button>
              <button
                onClick={() => setPrincipalSection('workload')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                  principalSection === 'workload'
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Faculty & Workload</span>
              </button>
              <button
                onClick={() => setPrincipalSection('at_risk')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                  principalSection === 'at_risk'
                    ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>At-Risk & Interventions</span>
              </button>
              <button
                onClick={() => setPrincipalSection('ai_insights')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                  principalSection === 'ai_insights'
                    ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 text-white shadow-md shadow-purple-500/20'
                    : 'text-purple-700 hover:text-purple-900 hover:bg-purple-50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>DAKSHORA AI Briefing</span>
              </button>
            </div>

            <button
              onClick={() => setShowWidgetConfig(!showWidgetConfig)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono flex items-center gap-1.5 border border-slate-200 transition-all"
              title="Configure Dashboard Widgets"
            >
              <Sliders className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden sm:inline">Customize Cockpit</span>
            </button>
          </div>

          {/* Widget Customizer Dropdown */}
          {showWidgetConfig && (
            <div className="p-4 bg-white/95 rounded-2xl border border-slate-200 shadow-xl grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 animate-in fade-in duration-150 text-xs font-mono">
              {[
                { key: 'aiBriefing', label: 'AI Briefing' },
                { key: 'kpis', label: 'Key KPIs' },
                { key: 'attendanceTrend', label: 'Att. Trend' },
                { key: 'distribution', label: 'Grade Dist.' },
                { key: 'lowAttendance', label: 'Low Att. Alerts' },
                { key: 'auditStream', label: 'Activity Audit' },
                { key: 'quickActions', label: 'Quick Actions' }
              ].map((w) => {
                const isEnabled = (widgetSettings as any)[w.key];
                return (
                  <button
                    key={w.key}
                    onClick={() => setWidgetSettings((prev) => ({ ...prev, [w.key]: !isEnabled }))}
                    className={`p-2 rounded-xl border flex items-center justify-between transition-all ${
                      isEnabled
                        ? 'bg-purple-50 border-purple-300 text-purple-800 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <span>{w.label}</span>
                    <span className={`w-3.5 h-3.5 rounded-md flex items-center justify-center text-[10px] ${
                      isEnabled ? 'bg-purple-600 text-white font-bold' : 'bg-slate-200'
                    }`}>
                      {isEnabled ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* AI Executive Briefing Card */}
          {widgetSettings.aiBriefing && dashboardData.aiInsights && dashboardData.aiInsights.length > 0 && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-50 via-white to-pink-50 border border-purple-200/80 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>DAKSHORA AI Executive Briefing</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 font-mono">
                        Live Telemetry
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Real-time operational summary computed from actual student and faculty registers.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-500 hidden sm:inline font-bold">
                  Session {school.academicSession}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {dashboardData.aiInsights.map((ins) => (
                  <div
                    key={ins.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      ins.type === 'positive'
                        ? 'bg-emerald-50/90 border-emerald-200 text-slate-800'
                        : ins.type === 'warning'
                        ? 'bg-rose-50/90 border-rose-200 text-slate-800'
                        : 'bg-purple-50/90 border-purple-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
                      <span className={ins.type === 'positive' ? 'text-emerald-700' : ins.type === 'warning' ? 'text-rose-700' : 'text-purple-700'}>
                        {ins.category}
                      </span>
                      {ins.metric && (
                        <span className="px-1.5 py-0.5 rounded bg-white text-slate-800 border border-slate-200 font-mono font-bold shadow-xs">
                          {ins.metric}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">{ins.headline}</h4>
                    <p className="text-[11px] text-slate-600 font-mono mt-1 leading-relaxed">
                      {ins.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 2. PRIMARY REAL-DATA KPI CARDS (4 EXECUTIVE LUXURY INTERACTIVE CARDS) */}
      {/* ========================================================================= */}
      {widgetSettings.kpis && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Students - Vibrant Electric Indigo / Cyan */}
        <div
          onClick={() => onNavigateModule('students')}
          className="bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/60 p-5 rounded-3xl border border-indigo-200/80 hover:border-indigo-400 shadow-md hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 space-y-3 relative overflow-hidden group cursor-pointer active:scale-[0.98]"
        >
          {/* Ambient Glow Orb */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-400/20 via-blue-400/10 to-transparent rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
          
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-mono text-indigo-900 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              {activeRole === 'teacher' ? 'Assigned Students' : 'Enrolled Students'}
            </span>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 ring-4 ring-indigo-50 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="relative z-10 flex items-baseline justify-between">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight group-hover:text-indigo-600 transition-colors">
              {students.total}
            </div>
            <span className="text-[11px] font-mono font-bold bg-indigo-100 text-indigo-800 border border-indigo-200/80 px-2.5 py-0.5 rounded-full shadow-xs">
              {students.active} Active
            </span>
          </div>

          <div className="relative z-10 flex items-center justify-between text-[11px] font-mono pt-2.5 border-t border-indigo-100/90 text-slate-600">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span>
              <strong>{students.byGender.male}</strong> Boys • <span className="w-1.5 h-1.5 rounded-full bg-pink-500 inline-block"></span><strong>{students.byGender.female}</strong> Girls
            </span>
            <span className="text-indigo-600 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform text-[10px]">
              Directory →
            </span>
          </div>
        </div>

        {/* Card 2: Total Staff - Vibrant Fuchsia / Royal Violet */}
        <div
          onClick={() => onNavigateModule('staff')}
          className="bg-gradient-to-br from-purple-50/90 via-white to-fuchsia-50/60 p-5 rounded-3xl border border-purple-200/80 hover:border-purple-400 shadow-md hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 space-y-3 relative overflow-hidden group cursor-pointer active:scale-[0.98]"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-400/20 via-fuchsia-400/10 to-transparent rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
          
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-mono text-purple-900 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
              Faculty & Staff
            </span>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 ring-4 ring-purple-50 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>

          <div className="relative z-10 flex items-baseline justify-between">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight group-hover:text-purple-600 transition-colors">
              {staff.total}
            </div>
            <span className="text-[11px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200/80 px-2.5 py-0.5 rounded-full shadow-xs">
              {staff.teachers} Teachers
            </span>
          </div>

          <div className="relative z-10 flex items-center justify-between text-[11px] font-mono pt-2.5 border-t border-purple-100/90 text-slate-600">
            <span>{staff.nonTeaching} Support Staff</span>
            <span className="text-purple-600 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform text-[10px]">
              Faculty Hub →
            </span>
          </div>
        </div>

        {/* Card 3: Today's Student Attendance - Emerald Glow */}
        <div
          onClick={() => onNavigateModule('attendance')}
          className="bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/60 p-5 rounded-3xl border border-emerald-200/80 hover:border-emerald-400 shadow-md hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 space-y-3 relative overflow-hidden group cursor-pointer active:scale-[0.98]"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-400/20 via-teal-400/10 to-transparent rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
          
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-mono text-emerald-900 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Student Attendance
            </span>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-green-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 ring-4 ring-emerald-50 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="relative z-10 flex items-baseline justify-between">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight group-hover:text-emerald-600 transition-colors">
              {attendance.students.isMarked ? `${attendance.students.attendancePercent}%` : 'Pending'}
            </div>
            {attendance.students.isMarked ? (
              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span> Live & Saved
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full shadow-xs">
                Roll Call Due
              </span>
            )}
          </div>

          {/* Dynamic Progress Bar */}
          <div className="relative z-10 w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-emerald-100">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                attendance.students.attendancePercent >= 85
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500'
                  : attendance.students.attendancePercent >= 75
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                  : 'bg-gradient-to-r from-rose-500 to-red-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, attendance.students.attendancePercent))}%` }}
            />
          </div>

          <div className="relative z-10 flex items-center justify-between text-[11px] font-mono pt-1 text-slate-600">
            <span className="text-emerald-700 font-bold">{attendance.students.present} Present</span>
            <span className="text-rose-600 font-bold">{attendance.students.absent} Absent</span>
            <span className="text-amber-600 font-bold">{attendance.students.late} Late</span>
            <span className="text-emerald-600 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform text-[10px]">
              Roll Call →
            </span>
          </div>
        </div>

        {/* Card 4: Today's Staff Attendance - Amber Coral */}
        <div
          onClick={() => onNavigateModule('staff')}
          className="bg-gradient-to-br from-amber-50/90 via-white to-orange-50/60 p-5 rounded-3xl border border-amber-200/80 hover:border-amber-400 shadow-md hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-300 space-y-3 relative overflow-hidden group cursor-pointer active:scale-[0.98]"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-400/20 via-orange-400/10 to-transparent rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
          
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-mono text-amber-900 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Staff Attendance
            </span>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-600 to-yellow-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 ring-4 ring-amber-50 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="relative z-10 flex items-baseline justify-between">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight group-hover:text-amber-600 transition-colors">
              {attendance.staff.isMarked ? `${attendance.staff.attendancePercent}%` : 'Active'}
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full shadow-xs">
              {attendance.staff.present}/{attendance.staff.totalEligible} On Duty
            </span>
          </div>

          <div className="relative z-10 w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-amber-100">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(0, attendance.staff.attendancePercent))}%` }}
            />
          </div>

          <div className="relative z-10 flex items-center justify-between text-[11px] font-mono pt-1 text-slate-600">
            <span className="text-amber-800 font-bold">{attendance.staff.present} Present</span>
            <span className="text-slate-500 font-medium">{attendance.staff.onLeave || 0} On Leave</span>
            <span className="text-amber-700 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform text-[10px]">
              Workload →
            </span>
          </div>
        </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* 2B. PRINCIPAL DEDICATED SECTIONS (Academics, Workload, At-Risk, AI Insights) */}
      {/* ========================================================================= */}
      {activeRole === 'admin' && principalSection === 'academics' && (
        <div className="bg-white/95 p-6 rounded-3xl border border-slate-200/90 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                <span>Academic & Curriculum Architecture</span>
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Session {school.academicSession} • Comprehensive grade structure, section allotments & subject catalog.
              </p>
            </div>
            <button
              onClick={() => onNavigateModule('academics')}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold transition-all flex items-center gap-1.5 self-start shadow-md shadow-purple-600/20"
            >
              <span>Manage Academics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80">
              <span className="text-xs text-slate-500 font-mono">Enrolled Grades:</span>
              <div className="text-2xl font-bold text-purple-700 font-mono mt-1">
                {studentDistribution.length} Active Grades
              </div>
              <p className="text-[11px] text-slate-500 font-mono mt-1">Class 9 through Class 12</p>
            </div>
            <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80">
              <span className="text-xs text-slate-500 font-mono">Active Sections:</span>
              <div className="text-2xl font-bold text-indigo-700 font-mono mt-1">
                {studentDistribution.reduce((acc, d) => acc + Object.keys(d.sectionBreakdown || {}).length, 0)} Sections
              </div>
              <p className="text-[11px] text-slate-500 font-mono mt-1">Section A, B with designated rooms</p>
            </div>
            <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80">
              <span className="text-xs text-slate-500 font-mono">Curriculum Subjects:</span>
              <div className="text-2xl font-bold text-emerald-700 font-mono mt-1">
                18 Subjects
              </div>
              <p className="text-[11px] text-slate-500 font-mono mt-1">Core, Languages & Skill electives</p>
            </div>
            <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80">
              <span className="text-xs text-slate-500 font-mono">Grading Standard:</span>
              <div className="text-2xl font-bold text-amber-700 font-mono mt-1">
                CBSE 9-Point
              </div>
              <p className="text-[11px] text-slate-500 font-mono mt-1">A1 (91-100) to E (Below 33)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {studentDistribution.map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="font-bold text-slate-900 text-sm">{item.grade}</span>
                  <span className="text-purple-700 font-bold">{item.totalStudents} Enrolled</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {Object.entries(item.sectionBreakdown || {}).map(([sec, count]) => (
                    <span key={sec} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-700 shadow-xs">
                      Section {sec}: <strong className="text-purple-700">{count} students</strong>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeRole === 'admin' && principalSection === 'workload' && (
        <div className="bg-white/95 p-6 rounded-3xl border border-slate-200/90 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                <span>Faculty Workload & Staffing Intelligence</span>
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Real-time tracking of staff attendance, duty rosters, and institutional responsibilities.
              </p>
            </div>
            <button
              onClick={() => onNavigateModule('staff')}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold transition-all flex items-center gap-1.5 self-start shadow-md shadow-indigo-600/20"
            >
              <span>Faculty Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80">
              <span className="text-xs text-slate-500 font-mono">Total Staff Personnel:</span>
              <div className="text-2xl font-bold text-slate-900 font-mono mt-1">{staff.total} Members</div>
              <p className="text-[11px] text-indigo-600 font-mono mt-1">{staff.teachers} Teaching • {staff.nonTeaching} Support</p>
            </div>
            <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80">
              <span className="text-xs text-slate-500 font-mono">Present on Duty Today:</span>
              <div className="text-2xl font-bold text-emerald-700 font-mono mt-1">{attendance.staff.present} Present</div>
              <p className="text-[11px] text-emerald-600 font-mono mt-1">{attendance.staff.attendancePercent}% Coverage</p>
            </div>
            <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80">
              <span className="text-xs text-slate-500 font-mono">Staff on Leave / Absent:</span>
              <div className="text-2xl font-bold text-amber-700 font-mono mt-1">{absentStaffToday.length} Personnel</div>
              <p className="text-[11px] text-amber-600 font-mono mt-1">{absentStaffToday.length > 0 ? 'Substitutions Needed' : 'Zero Vacancies Today'}</p>
            </div>
          </div>

          {absentStaffToday.length > 0 ? (
            <div className="space-y-3">
              <span className="text-xs font-mono text-amber-700 font-bold uppercase tracking-wider block">
                Leave & Substitution Management:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {absentStaffToday.map((st) => (
                  <div key={st.staffId} className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">{st.name}</span>
                      <span className="text-[11px] text-slate-500 font-mono">{st.designation} • {st.department}</span>
                      <span className="text-[10px] text-amber-700 font-mono block mt-0.5">{st.remarks}</span>
                    </div>
                    <button
                      onClick={() => onNavigateModule('timetable')}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 text-[11px] font-mono font-bold transition-all"
                    >
                      Assign Sub
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center border border-dashed border-emerald-200 bg-emerald-50/50 rounded-2xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-xs text-emerald-800 font-mono font-bold">Full Staff Coverage</p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">All designated teachers are on campus and conducting scheduled periods.</p>
            </div>
          )}
        </div>
      )}

      {activeRole === 'admin' && principalSection === 'at_risk' && (
        <div className="bg-white/95 p-6 rounded-3xl border border-slate-200/90 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>At-Risk Student Intervention & Retention Cockpit</span>
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Students flagged under the CBSE 75% attendance cutoff requiring immediate guardian communication.
              </p>
            </div>
            <button
              onClick={() => onNavigateModule('attendance')}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold transition-all flex items-center gap-1.5 self-start shadow-md shadow-rose-600/20"
            >
              <span>Attendance Register</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {lowAttendanceStudents.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-emerald-200 bg-emerald-50/50 rounded-2xl space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <p className="text-sm text-emerald-800 font-mono font-bold">Zero Attendance Warnings</p>
              <p className="text-xs text-slate-500 font-mono">Every enrolled student has maintained an attendance rate above the 75% requirement.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowAttendanceStudents.map((std) => (
                <div key={std.studentId} className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{std.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-100 text-rose-800 border border-rose-200 font-bold">
                        {std.attendancePercent}% Attendance
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 font-mono flex flex-wrap items-center gap-2">
                      <span>{std.grade} ({std.section})</span>
                      <span>•</span>
                      <span>Roll #{std.rollNo}</span>
                      <span>•</span>
                      <span className="text-rose-600 font-bold">{std.absentDays} Days Absent</span>
                      <span>•</span>
                      <span>Parent: {std.parentName} ({std.parentPhone})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => onShowToast('success', 'Alert Dispatched', `SMS reminder sent to ${std.parentName}`)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:brightness-110 text-white text-xs font-mono font-bold transition-all shadow-md shadow-rose-600/20"
                    >
                      Send Parent Alert
                    </button>
                    <button
                      onClick={() => onNavigateModule('students')}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-mono transition-all"
                    >
                      Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeRole === 'admin' && principalSection === 'ai_insights' && (
        <div className="bg-white/95 p-6 rounded-3xl border border-slate-200/90 shadow-md space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-purple-500/25">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">DAKSHORA AI Executive Diagnostic Center</h3>
                <p className="text-xs text-slate-500 font-mono">
                  Autonomous operational intelligence generated from live database entities.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-100 text-purple-700 border border-purple-200">
              Live Analysis
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboardData.aiInsights && dashboardData.aiInsights.map((ins) => (
              <div
                key={ins.id}
                className={`p-5 rounded-2xl border space-y-2 ${
                  ins.type === 'positive'
                    ? 'bg-emerald-50/80 border-emerald-200'
                    : ins.type === 'warning'
                    ? 'bg-rose-50/80 border-rose-200'
                    : 'bg-purple-50/80 border-purple-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider">
                  <span className={ins.type === 'positive' ? 'text-emerald-700' : ins.type === 'warning' ? 'text-rose-700' : 'text-purple-700'}>
                    {ins.category}
                  </span>
                  {ins.metric && (
                    <span className="px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200 font-mono font-bold shadow-xs">
                      {ins.metric}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-900">{ins.headline}</h4>
                <p className="text-xs text-slate-600 font-mono leading-relaxed">{ins.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ROLE-SPECIFIC WORKSPACE ADAPTATION */}
      {/* ========================================================================= */}

      {/* Teacher Cockpit View */}
      {activeRole === 'teacher' && teacherClassSummaries && teacherClassSummaries.length > 0 && (
        <div className="bg-white/95 p-6 rounded-3xl border border-slate-200/90 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-600" />
                <span>Your Assigned Classrooms & Roll Calls</span>
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Classes assigned to your profile in the current session.
              </p>
            </div>
            <span className="text-xs font-mono text-purple-700 px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 font-bold">
              {teacherClassSummaries.length} Allocated Sections
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teacherClassSummaries.map((cls, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200 hover:border-purple-400 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">
                      {cls.grade} — Section {cls.section}
                    </span>
                    <span className="text-xs text-purple-700 font-mono block font-semibold">{cls.subject}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      cls.todayMarked
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {cls.todayMarked ? 'Marked' : 'Pending'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-200">
                  <span className="text-slate-500">{cls.studentCount} Students</span>
                  <span className="text-emerald-700 font-bold">
                    {cls.todayMarked ? `${cls.todayAttendancePercent}% Present` : 'Roll call needed'}
                  </span>
                </div>

                <button
                  onClick={() => onNavigateModule('attendance')}
                  className="w-full py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-purple-700 text-xs font-bold font-mono flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{cls.todayMarked ? 'View Register' : 'Mark Roll Call'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reception Front-Desk Priority Hub */}
      {activeRole === 'reception' && (
        <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-bold text-slate-900">Reception Desk Priority Hub</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 font-mono">
              Front Desk Shift: Active
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 bg-white rounded-xl border border-amber-200/80">
              <span className="text-slate-500">Total Enrolled Students:</span>
              <div className="text-lg font-bold text-purple-700 mt-1">{students.total} Active Records</div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-amber-200/80">
              <span className="text-slate-500">Today's Present Students:</span>
              <div className="text-lg font-bold text-emerald-700 mt-1">
                {attendance.students.present} in Campus
              </div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-amber-200/80">
              <span className="text-slate-500">School Infoline / Helpline:</span>
              <div className="text-lg font-bold text-slate-900 mt-1">+91 11 2789 0000</div>
            </div>
          </div>
        </div>
      )}

      {/* Accountant Overview Desk */}
      {activeRole === 'account' && (
        <div className="p-5 rounded-2xl bg-emerald-50/90 border border-emerald-200 shadow-xs space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Bursar & Payroll Staff Strength Status</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
              Session {activeSession}
            </span>
          </div>
          <p className="text-slate-600 text-[11px]">
            Faculty payroll records active for {staff.total} personnel ({staff.teachers} educators, {staff.nonTeaching} support staff). Fee ledger collections module will unlock once transactions are reconciled.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MAIN DASHBOARD GRID: ATTENDANCE TREND & STUDENT DISTRIBUTION */}
      {/* ========================================================================= */}
      {(activeRole !== 'admin' || principalSection === 'cockpit') && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance Trend Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white/95 p-6 rounded-3xl border border-slate-200/90 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span>Attendance Trend & Historical Pulse</span>
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Calculated from actual daily student register entries.
              </p>
            </div>

            {/* Range Toggle */}
            <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 font-mono text-xs self-start">
              <button
                onClick={() => setTrendRange(7)}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  trendRange === 7 ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setTrendRange(30)}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  trendRange === 30 ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                30 Days
              </button>
            </div>
          </div>

          {attendanceTrend.length < 2 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 bg-slate-50/50 rounded-2xl space-y-2">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500 font-mono">
                Attendance trend will appear after more attendance data is available.
              </p>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {/* Bar Chart Representation */}
              <div className="grid grid-flow-col auto-cols-fr gap-2 items-end h-44 p-3 bg-slate-50/90 rounded-2xl border border-slate-200">
                {attendanceTrend.map((day, idx) => {
                  const pct = day.attendancePercent;
                  const barHeight = Math.max(12, Math.min(100, pct));
                  const isCurrentSelected = day.date === selectedDate;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedDate(day.date);
                        onNavigateModule('attendance');
                        onShowToast('info', `Opened Register for ${day.dayName}, ${day.date}`, `Jumped to daily attendance sheet`);
                      }}
                      className="flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer hover:scale-105 transition-transform"
                      title={`Click to view register for ${day.date} (${pct}% attendance)`}
                    >
                      <span className="text-[10px] font-mono text-purple-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        {pct}%
                      </span>
                      <div className="w-full max-w-[28px] h-full flex items-end">
                        <div
                          style={{ height: `${barHeight}%` }}
                          className={`w-full rounded-t-lg transition-all duration-300 ${
                            isCurrentSelected
                              ? 'bg-gradient-to-t from-purple-600 via-indigo-600 to-cyan-500 shadow-md shadow-purple-500/30'
                              : pct >= 90
                              ? 'bg-gradient-to-t from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400'
                              : pct >= 75
                              ? 'bg-gradient-to-t from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400'
                              : 'bg-gradient-to-t from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400'
                          }`}
                        />
                      </div>
                      <span
                        className={`text-[10px] font-mono uppercase ${
                          isCurrentSelected ? 'text-purple-700 font-bold' : 'text-slate-500'
                        }`}
                      >
                        {day.dayName}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Chart Legend */}
              <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500 px-1">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> ≥ 90%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 75% - 89%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> &lt; 75%
                  </span>
                </div>
                <span className="text-slate-500">
                  Showing {attendanceTrend.length} recorded school days
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Student Class Distribution (5 cols) */}
        <div className="lg:col-span-5 bg-white/95 p-6 rounded-3xl border border-slate-200/90 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-purple-600" />
                <span>Class-wise Student Distribution</span>
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Active strength per enrolled grade.
              </p>
            </div>
            <button
              onClick={() => onNavigateModule('students')}
              className="text-xs text-purple-600 hover:underline font-mono font-semibold"
            >
              Directory →
            </button>
          </div>

          {studentDistribution.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 bg-slate-50/50 rounded-2xl">
              <Users className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-mono">No students enrolled yet.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {studentDistribution.map((item, idx) => {
                const maxInGrade = Math.max(...studentDistribution.map((d) => d.totalStudents), 1);
                const barWidth = Math.round((item.totalStudents / maxInGrade) * 100);
                return (
                  <div key={idx} className="p-3 bg-slate-50/90 rounded-xl border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-slate-900">{item.grade}</span>
                      <span className="text-purple-700 font-bold">{item.totalStudents} Students</span>
                    </div>

                    {/* Proportional Bar */}
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>

                    {/* Section Breakdown Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {Object.entries(item.sectionBreakdown || {}).map(([sec, count]) => (
                        <span
                          key={sec}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-white text-slate-600 border border-slate-200 shadow-2xs"
                        >
                          Sec {sec}: <strong className="text-purple-700">{count}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. LOW ATTENDANCE ALERTS & RECENT ACTIVITIES GRID */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Low Attendance Section (7 cols) */}
        <div className="lg:col-span-7 bg-white/95 p-6 rounded-3xl border border-slate-200/90 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Low Attendance Alerts</h3>
                <span className="text-[11px] text-slate-500 font-mono">Threshold &lt; 75% Cutoff</span>
              </div>
            </div>

            <button
              onClick={() => onNavigateModule('attendance')}
              className="text-xs text-purple-600 hover:underline font-mono font-semibold"
            >
              All Reports →
            </button>
          </div>

          {lowAttendanceStudents.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-emerald-200 bg-emerald-50/50 rounded-2xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-xs text-emerald-800 font-mono font-bold">
                All students are currently above the attendance threshold.
              </p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                No attendance policy warnings triggered for this session.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowAttendanceStudents.map((std) => (
                <div
                  key={std.studentId}
                  className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{std.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-100 text-rose-800 border border-rose-200 font-bold">
                        {std.attendancePercent}% Attendance
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 font-mono flex items-center gap-3">
                      <span>{std.grade} ({std.section})</span>
                      <span>•</span>
                      <span>Roll #{std.rollNo}</span>
                      <span>•</span>
                      <span className="text-rose-600 font-semibold">{std.absentDays} Days Absent</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => onNavigateModule('students')}
                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-mono font-bold transition-all shadow-xs"
                    >
                      View Student
                    </button>
                    <button
                      onClick={() => onNavigateModule('attendance')}
                      className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-mono font-bold transition-all shadow-md shadow-purple-600/20"
                    >
                      View Attendance
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Absent Staff Today Quick List if any */}
          {absentStaffToday && absentStaffToday.length > 0 && (
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <span className="text-[11px] font-mono text-amber-700 font-bold uppercase tracking-wider block">
                Faculty / Staff On Leave Today ({absentStaffToday.length}):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {absentStaffToday.map((st) => (
                  <div
                    key={st.staffId}
                    className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-200 flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{st.name}</span>
                      <span className="text-[10px] text-slate-500">{st.designation} • {st.department}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      {st.status === 'on_leave' ? 'On Leave' : 'Absent'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Real System Recent Activities (5 cols) */}
        <div className="lg:col-span-5 bg-white/95 p-6 rounded-3xl border border-slate-200/90 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Real System Recent Activity</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Live Audit Stream</span>
          </div>

          {recentActivities.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 bg-slate-50/50 rounded-2xl">
              <Activity className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-mono">No recent activities available.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {recentActivities.map((act) => {
                const badgeColorClass =
                  act.badgeColor === 'emerald'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : act.badgeColor === 'purple'
                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                    : act.badgeColor === 'amber'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : act.badgeColor === 'indigo'
                    ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                    : 'bg-blue-100 text-blue-800 border-blue-200';

                return (
                  <div
                    key={act.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className={`px-2 py-0.5 rounded font-bold border ${badgeColorClass}`}>
                        {act.title}
                      </span>
                      <span className="text-slate-500">{formatTimeAgo(act.timestamp)}</span>
                    </div>
                    <p className="text-xs text-slate-700 font-mono">{act.description}</p>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Actor: <span className="text-slate-700 font-medium">{act.userEmail}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. OPERATIONAL QUICK ACTIONS LAUNCHPAD (COLORFUL & INTERACTIVE) */}
      {/* ========================================================================= */}
      <div className="bg-white/95 p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-lg shadow-slate-200/40 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 animate-pulse"></span>
            <span className="text-xs font-mono text-slate-900 font-bold uppercase tracking-wider">
              Operational Quick Actions Launchpad
            </span>
          </div>
          <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-full font-bold">
            1-Tap Shortcuts
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
          <button
            onClick={() => onNavigateModule('students', { showAddStudent: true })}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/80 via-white to-sky-50/50 hover:from-blue-100 hover:to-sky-100 border border-blue-200/80 hover:border-blue-400 text-left text-slate-800 transition-all flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shadow-sm hover:shadow-xl hover:shadow-blue-500/15 font-bold hover:-translate-y-1 active:scale-95 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30 group-hover:scale-110 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-slate-900 font-bold">+ Enroll</span>
              <span className="text-[10px] text-blue-600 font-normal">Student</span>
            </div>
          </button>

          <button
            onClick={() => onNavigateModule('staff', { showAddStaff: true })}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50/80 via-white to-fuchsia-50/50 hover:from-purple-100 hover:to-fuchsia-100 border border-purple-200/80 hover:border-purple-400 text-left text-slate-800 transition-all flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shadow-sm hover:shadow-xl hover:shadow-purple-500/15 font-bold hover:-translate-y-1 active:scale-95 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-fuchsia-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-500/30 group-hover:scale-110 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-slate-900 font-bold">+ Faculty</span>
              <span className="text-[10px] text-purple-600 font-normal">New Staff</span>
            </div>
          </button>

          <button
            onClick={() => onNavigateModule('attendance')}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200/80 hover:border-emerald-400 text-left text-slate-800 transition-all flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shadow-sm hover:shadow-xl hover:shadow-emerald-500/15 font-bold hover:-translate-y-1 active:scale-95 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30 group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-slate-900 font-bold">Roll Call</span>
              <span className="text-[10px] text-emerald-600 font-normal">Attendance</span>
            </div>
          </button>

          <button
            onClick={() => onNavigateModule('students')}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/50 hover:from-indigo-100 hover:to-blue-100 border border-indigo-200/80 hover:border-indigo-400 text-left text-slate-800 transition-all flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shadow-sm hover:shadow-xl hover:shadow-indigo-500/15 font-bold hover:-translate-y-1 active:scale-95 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/30 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-slate-900 font-bold">Directory</span>
              <span className="text-[10px] text-indigo-600 font-normal">Students</span>
            </div>
          </button>

          <button
            onClick={() => onNavigateModule('staff')}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-violet-50/80 via-white to-purple-50/50 hover:from-violet-100 hover:to-purple-100 border border-violet-200/80 hover:border-violet-400 text-left text-slate-800 transition-all flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shadow-sm hover:shadow-xl hover:shadow-violet-500/15 font-bold hover:-translate-y-1 active:scale-95 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-violet-500/30 group-hover:scale-110 transition-transform">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-slate-900 font-bold">Roster</span>
              <span className="text-[10px] text-violet-600 font-normal">Faculty</span>
            </div>
          </button>

          <button
            onClick={() => onNavigateModule('attendance')}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 hover:from-amber-100 hover:to-orange-100 border border-amber-200/80 hover:border-amber-400 text-left text-slate-800 transition-all flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shadow-sm hover:shadow-xl hover:shadow-amber-500/15 font-bold hover:-translate-y-1 active:scale-95 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-slate-900 font-bold">Analytics</span>
              <span className="text-[10px] text-amber-600 font-normal">Att. Pulse</span>
            </div>
          </button>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
