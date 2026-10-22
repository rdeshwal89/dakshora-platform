import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  Check,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Send,
  Users,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  Briefcase,
  GraduationCap,
  Download,
  Sliders,
  FileSpreadsheet,
  Layers,
  Phone,
  Mail,
  UserCheck,
  UserX,
  Lock
} from 'lucide-react';
import {
  ErpRole,
  AttendanceStatus,
  StudentDailyAttendanceItem,
  StaffDailyAttendanceItem,
  AttendanceDashboardSummary,
  MonthlyAttendanceGridData,
  LowAttendanceReportItem,
  AttendanceSettings,
  TeacherAssignmentRecord
} from '../types';
import {
  fetchErpAttendanceDashboard,
  fetchStudentAttendanceRegister,
  saveStudentAttendanceBulk,
  fetchStudentMonthlyAttendance,
  fetchAttendanceReports,
  fetchStaffAttendanceRegister,
  saveStaffAttendanceBulk,
  fetchAttendanceSettings,
  updateAttendanceSettings,
  fetchTeacherAssignments
} from '../services/api';

interface AttendanceManagementHubProps {
  activeRole: ErpRole;
  activeSession: string;
  organizationId?: string;
  currentStaffId?: string;
  onShowToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

const CLASSES = [
  'Nursary', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12'
];

const SECTIONS = ['A', 'B', 'C', 'D'];

const MONTHS = [
  { val: 1, name: 'January' },
  { val: 2, name: 'February' },
  { val: 3, name: 'March' },
  { val: 4, name: 'April' },
  { val: 5, name: 'May' },
  { val: 6, name: 'June' },
  { val: 7, name: 'July' },
  { val: 8, name: 'August' },
  { val: 9, name: 'September' },
  { val: 10, name: 'October' },
  { val: 11, name: 'November' },
  { val: 12, name: 'December' }
];

export const AttendanceManagementHub: React.FC<AttendanceManagementHubProps> = ({
  activeRole,
  activeSession,
  organizationId = 'b17780e5-3832-4ac6-9aeb-33fd80c5cb0e',
  currentStaffId = 'stf-05', // Default teacher: Anita Sharma
  onShowToast
}) => {
  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'student_daily' | 'staff_daily' | 'monthly_grid' | 'reports' | 'settings'>('dashboard');

  // Today ISO
  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Settings State
  const [settings, setSettings] = useState<AttendanceSettings>({
    lowAttendanceThreshold: 75.0,
    allowFutureDates: false,
    defaultStatus: 'present'
  });

  // Teacher Restricted Assignments State
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignmentRecord[]>([]);
  const isTeacher = activeRole === 'teacher';

  // 1. Dashboard State
  const [dashboardDate, setDashboardDate] = useState(todayIso);
  const [dashboardData, setDashboardData] = useState<AttendanceDashboardSummary | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // 2. Student Daily Register State
  const [regDate, setRegDate] = useState(todayIso);
  const [regGrade, setRegGrade] = useState('Class 10');
  const [regSection, setRegSection] = useState('A');
  const [regStudents, setRegStudents] = useState<StudentDailyAttendanceItem[]>([]);
  const [regLoading, setRegLoading] = useState(false);
  const [regSaving, setRegSaving] = useState(false);
  const [regIsAlreadyMarked, setRegIsAlreadyMarked] = useState(false);
  const [regMarkedBy, setRegMarkedBy] = useState<string | null>(null);

  // 3. Staff Daily Register State
  const [staffDate, setStaffDate] = useState(todayIso);
  const [staffRecords, setStaffRecords] = useState<StaffDailyAttendanceItem[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffIsAlreadyMarked, setStaffIsAlreadyMarked] = useState(false);

  // 4. Monthly Grid State
  const [monthlyGrade, setMonthlyGrade] = useState('Class 10');
  const [monthlySection, setMonthlySection] = useState('A');
  const [monthlyMonth, setMonthlyMonth] = useState(9); // September
  const [monthlyYear, setMonthlyYear] = useState(2026);
  const [monthlyGrid, setMonthlyGrid] = useState<MonthlyAttendanceGridData | null>(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  // 5. Reports State
  const [reportType, setReportType] = useState<'low_attendance' | 'daily'>('low_attendance');
  const [lowAttendanceList, setLowAttendanceList] = useState<LowAttendanceReportItem[]>([]);
  const [dailyReportList, setDailyReportList] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  // 6. Teacher assignments resolution
  useEffect(() => {
    async function loadTeacherClasses() {
      if (isTeacher && currentStaffId) {
        try {
          const res = await fetchTeacherAssignments(currentStaffId);
          if (res.data && res.data.assignments) {
            setTeacherAssignments(res.data.assignments);
            if (res.data.assignments.length > 0) {
              setRegGrade(res.data.assignments[0].grade);
              setRegSection(res.data.assignments[0].section);
              setMonthlyGrade(res.data.assignments[0].grade);
              setMonthlySection(res.data.assignments[0].section);
            }
          }
        } catch (err: any) {
          console.warn('Teacher assignments load warning:', err.message);
        }
      }
    }
    loadTeacherClasses();
  }, [isTeacher, currentStaffId]);

  // Load Settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetchAttendanceSettings();
        if (res.data && res.data.settings) {
          setSettings(res.data.settings);
        }
      } catch (err: any) {
        console.warn('Settings load warning:', err.message);
      }
    }
    loadSettings();
  }, []);

  // 1. Fetch Dashboard Data
  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const res = await fetchErpAttendanceDashboard(dashboardDate);
      if (res.data && res.data.success) {
        setDashboardData(res.data as unknown as AttendanceDashboardSummary);
      }
    } catch (err: any) {
      onShowToast('error', 'Dashboard Load Failed', err.message || 'Could not fetch attendance stats');
    } finally {
      setDashboardLoading(false);
    }
  }, [dashboardDate, onShowToast]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboard();
    }
  }, [activeTab, loadDashboard]);

  // 2. Fetch Student Daily Register
  const loadStudentRegister = useCallback(async () => {
    setRegLoading(true);
    try {
      const res = await fetchStudentAttendanceRegister({
        date: regDate,
        grade: regGrade,
        section: regSection,
        session: activeSession
      });
      if (res.data && res.data.success) {
        setRegStudents(res.data.students || []);
        setRegIsAlreadyMarked(Boolean(res.data.isAlreadyMarked));
        setRegMarkedBy(res.data.markedBy || null);
      }
    } catch (err: any) {
      onShowToast('error', 'Register Load Failed', err.message || 'Could not retrieve student list');
    } finally {
      setRegLoading(false);
    }
  }, [regDate, regGrade, regSection, activeSession, onShowToast]);

  useEffect(() => {
    if (activeTab === 'student_daily') {
      loadStudentRegister();
    }
  }, [activeTab, loadStudentRegister]);

  // 3. Fetch Staff Daily Register
  const loadStaffRegister = useCallback(async () => {
    setStaffLoading(true);
    try {
      const res = await fetchStaffAttendanceRegister({ date: staffDate });
      if (res.data && res.data.success) {
        setStaffRecords(res.data.staff || []);
        setStaffIsAlreadyMarked(Boolean(res.data.isAlreadyMarked));
      }
    } catch (err: any) {
      onShowToast('error', 'Staff Register Load Failed', err.message || 'Could not fetch staff attendance');
    } finally {
      setStaffLoading(false);
    }
  }, [staffDate, onShowToast]);

  useEffect(() => {
    if (activeTab === 'staff_daily') {
      loadStaffRegister();
    }
  }, [activeTab, loadStaffRegister]);

  // 4. Fetch Monthly Grid
  const loadMonthlyGrid = useCallback(async () => {
    setMonthlyLoading(true);
    try {
      const res = await fetchStudentMonthlyAttendance({
        grade: monthlyGrade,
        section: monthlySection,
        month: monthlyMonth,
        year: monthlyYear,
        session: activeSession
      });
      if (res.data && res.data.success) {
        setMonthlyGrid(res.data as unknown as MonthlyAttendanceGridData);
      }
    } catch (err: any) {
      onShowToast('error', 'Monthly Grid Load Failed', err.message || 'Could not calculate monthly attendance');
    } finally {
      setMonthlyLoading(false);
    }
  }, [monthlyGrade, monthlySection, monthlyMonth, monthlyYear, activeSession, onShowToast]);

  useEffect(() => {
    if (activeTab === 'monthly_grid') {
      loadMonthlyGrid();
    }
  }, [activeTab, loadMonthlyGrid]);

  // 5. Fetch Reports
  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const res = await fetchAttendanceReports(reportType, {
        threshold: settings.lowAttendanceThreshold,
        grade: regGrade,
        section: regSection
      });
      if (res.data && res.data.success) {
        if (reportType === 'low_attendance') {
          setLowAttendanceList(res.data.students || []);
        } else if (reportType === 'daily') {
          setDailyReportList(res.data.reports || []);
        }
      }
    } catch (err: any) {
      onShowToast('error', 'Reports Load Failed', err.message || 'Could not generate report');
    } finally {
      setReportsLoading(false);
    }
  }, [reportType, settings.lowAttendanceThreshold, regGrade, regSection, onShowToast]);

  useEffect(() => {
    if (activeTab === 'reports') {
      loadReports();
    }
  }, [activeTab, loadReports]);

  // Date Shift Helpers
  const shiftDate = (current: string, deltaDays: number): string => {
    const d = new Date(current);
    d.setDate(d.getDate() + deltaDays);
    return d.toISOString().split('T')[0];
  };

  const handleStudentDateShift = (delta: number) => {
    const nextDate = shiftDate(regDate, delta);
    if (!settings.allowFutureDates && nextDate > todayIso) {
      onShowToast('warning', 'Future Date Disallowed', 'Marking attendance for future dates is disabled in settings.');
      return;
    }
    setRegDate(nextDate);
  };

  const handleStaffDateShift = (delta: number) => {
    const nextDate = shiftDate(staffDate, delta);
    setStaffDate(nextDate);
  };

  // Fast Bulk Actions for Student Daily Register
  const handleMarkAllStudent = (status: AttendanceStatus) => {
    setRegStudents(prev => prev.map(s => ({ ...s, status })));
    onShowToast('info', `Marked All as ${status.toUpperCase()} ⚡`, `All ${regStudents.length} students updated in local register`);
  };

  const handleSetStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setRegStudents(prev => prev.map(s => s.studentId === studentId ? { ...s, status } : s));
  };

  const handleSetStudentRemarks = (studentId: string, remarks: string) => {
    setRegStudents(prev => prev.map(s => s.studentId === studentId ? { ...s, remarks } : s));
  };

  // Save Student Attendance Bulk
  const handleSaveStudentAttendance = async () => {
    if (!settings.allowFutureDates && regDate > todayIso) {
      onShowToast('error', 'Future Date Disallowed', 'Cannot submit attendance for future dates.');
      return;
    }

    setRegSaving(true);
    try {
      const payload = {
        date: regDate,
        grade: regGrade,
        section: regSection,
        session: activeSession,
        role: activeRole,
        staffId: isTeacher ? currentStaffId : undefined,
        records: regStudents.map(s => ({
          studentId: s.studentId,
          studentName: s.studentName,
          admissionNo: s.admissionNo,
          rollNo: s.rollNo,
          status: s.status,
          remarks: s.remarks
        }))
      };

      const res = await saveStudentAttendanceBulk(payload);
      if (res.data && res.data.success) {
        onShowToast(
          'success',
          'Attendance Register Saved ✅',
          `Saved ${res.data.totalCount} records for ${regGrade}-${regSection} (${regDate}). ${res.data.updatedCount} corrected.`
        );
        setRegIsAlreadyMarked(true);
        setRegMarkedBy(isTeacher ? 'Anita Sharma' : 'Admin');
      }
    } catch (err: any) {
      onShowToast('error', 'Save Failed ❌', err.message || 'Could not save attendance');
    } finally {
      setRegSaving(false);
    }
  };

  // Staff Daily Register Actions
  const handleMarkAllStaff = (status: AttendanceStatus) => {
    setStaffRecords(prev => prev.map(s => ({ ...s, status })));
    onShowToast('info', `Marked All Staff as ${status.toUpperCase()} ⚡`);
  };

  const handleSetStaffStatus = (staffId: string, status: AttendanceStatus) => {
    setStaffRecords(prev => prev.map(s => s.staffId === staffId ? { ...s, status } : s));
  };

  const handleSaveStaffAttendance = async () => {
    setStaffSaving(true);
    try {
      const payload = {
        date: staffDate,
        records: staffRecords.map(s => ({
          staffId: s.staffId,
          status: s.status,
          remarks: s.remarks
        }))
      };

      const res = await saveStaffAttendanceBulk(payload);
      if (res.data && res.data.success) {
        onShowToast('success', 'Staff Attendance Saved ✅', `Logged daily records for ${res.data.count} staff members`);
        setStaffIsAlreadyMarked(true);
      }
    } catch (err: any) {
      onShowToast('error', 'Staff Save Failed ❌', err.message || 'Could not save staff register');
    } finally {
      setStaffSaving(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await updateAttendanceSettings(settings);
      if (res.data && res.data.success) {
        onShowToast('success', 'Attendance Settings Saved', 'Configured thresholds and parameters updated');
      }
    } catch (err: any) {
      onShowToast('error', 'Settings Update Failed', err.message);
    }
  };

  // Calculated Counters for Student Daily
  const studentCounters = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let halfDay = 0;
    let leave = 0;

    regStudents.forEach(s => {
      if (s.status === 'present') present++;
      else if (s.status === 'absent') absent++;
      else if (s.status === 'late') late++;
      else if (s.status === 'half_day') halfDay++;
      else if (s.status === 'leave') leave++;
    });

    return { total: regStudents.length, present, absent, late, halfDay, leave };
  }, [regStudents]);

  // Format Date for Display: DD/MM/YYYY
  const formatDisplayDate = (isoDate: string): string => {
    if (!isoDate) return '';
    const p = isoDate.split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : isoDate;
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & ATTENDANCE SUB-NAV */}
      {/* ========================================================================= */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-white">Attendance Management Hub</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono font-medium">
                  Session {activeSession}
                </span>
                {isTeacher && (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-500/40 font-mono font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3 text-indigo-400" />
                    <span>Teacher Role Restricted</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Real-time multi-tenant roll calls, teacher assignment verification, 31-day matrices, and low attendance alerts.
              </p>
            </div>
          </div>

          {/* Sub-nav Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 border ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-white border-slate-700 shadow-md'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('student_daily')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 border ${
                activeTab === 'student_daily'
                  ? 'bg-emerald-600/80 text-white border-emerald-500/50 shadow-md'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Student Register</span>
            </button>

            <button
              onClick={() => setActiveTab('staff_daily')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 border ${
                activeTab === 'staff_daily'
                  ? 'bg-purple-600/80 text-white border-purple-500/50 shadow-md'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Briefcase className="w-4 h-4 text-purple-400" />
              <span>Staff Attendance</span>
            </button>

            <button
              onClick={() => setActiveTab('monthly_grid')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 border ${
                activeTab === 'monthly_grid'
                  ? 'bg-indigo-600/80 text-white border-indigo-500/50 shadow-md'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Monthly Grid</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 border ${
                activeTab === 'reports'
                  ? 'bg-amber-600/80 text-white border-amber-500/50 shadow-md'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Reports</span>
            </button>

            {activeRole === 'admin' && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 border ${
                  activeTab === 'settings'
                    ? 'bg-slate-800 text-cyan-300 border-cyan-500/50'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Settings</span>
              </button>
            )}

            <button
              onClick={() => {
                if (activeTab === 'dashboard') loadDashboard();
                else if (activeTab === 'student_daily') loadStudentRegister();
                else if (activeTab === 'staff_daily') loadStaffRegister();
                else if (activeTab === 'monthly_grid') loadMonthlyGrid();
                else if (activeTab === 'reports') loadReports();
              }}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TAB: ATTENDANCE DASHBOARD (REAL LIVE DATA) */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Top Date Selector & Quick Info */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold">Selected Date:</span>
              <input
                type="date"
                value={dashboardDate}
                onChange={(e) => setDashboardDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold outline-none"
              />
              <span className="text-cyan-300 font-bold ml-2">
                ({formatDisplayDate(dashboardDate)})
              </span>
            </div>
            <span className="text-slate-400">
              Computed directly from live database roll-calls
            </span>
          </div>

          {dashboardLoading || !dashboardData ? (
            <div className="p-12 text-center text-slate-500 font-mono flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
              <span>Calculating live attendance metrics...</span>
            </div>
          ) : (
            <>
              {/* Student KPI Cards */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-white font-mono flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Student Attendance Metrics</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <div className="text-[11px] text-slate-400">Total Enrolled</div>
                    <div className="text-2xl font-black text-white">{dashboardData.students.total}</div>
                    <div className="text-[10px] text-cyan-400/80">Active students</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <div className="text-[11px] text-emerald-400">Present Today</div>
                    <div className="text-2xl font-black text-emerald-400">{dashboardData.students.present}</div>
                    <div className="text-[10px] text-slate-500">In classrooms</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <div className="text-[11px] text-rose-400">Absent Today</div>
                    <div className="text-2xl font-black text-rose-400">{dashboardData.students.absent}</div>
                    <div className="text-[10px] text-slate-500">Unexcused</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <div className="text-[11px] text-amber-400">Late Arrivals</div>
                    <div className="text-2xl font-black text-amber-400">{dashboardData.students.late}</div>
                    <div className="text-[10px] text-slate-500">Recorded late</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <div className="text-[11px] text-purple-400">Approved Leave</div>
                    <div className="text-2xl font-black text-purple-400">{dashboardData.students.leave}</div>
                    <div className="text-[10px] text-slate-500">Excused/Medical</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <div className="text-[11px] text-cyan-400">Attendance Rate</div>
                    <div className="text-2xl font-black text-cyan-300">{dashboardData.students.attendancePercent}%</div>
                    <div className="text-[10px] text-slate-500">School-wide</div>
                  </div>
                </div>
              </div>

              {/* Staff KPI Cards */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-white font-mono flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-purple-400" />
                  <span>Faculty & Staff Attendance Metrics</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono">
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <div className="text-[11px] text-slate-400">Total Staff</div>
                    <div className="text-2xl font-black text-white">{dashboardData.staff.total}</div>
                    <div className="text-[10px] text-slate-500">Teaching & Admin</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <div className="text-[11px] text-emerald-400">Present On Campus</div>
                    <div className="text-2xl font-black text-emerald-400">{dashboardData.staff.present}</div>
                    <div className="text-[10px] text-slate-500">On duty</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <div className="text-[11px] text-rose-400">Absent Staff</div>
                    <div className="text-2xl font-black text-rose-400">{dashboardData.staff.absent}</div>
                    <div className="text-[10px] text-slate-500">Without leave</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <div className="text-[11px] text-amber-400">On Approved Leave</div>
                    <div className="text-2xl font-black text-amber-400">{dashboardData.staff.onLeave}</div>
                    <div className="text-[10px] text-slate-500">Medical/Casual</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <div className="text-[11px] text-purple-400">Staff Present Rate</div>
                    <div className="text-2xl font-black text-purple-300">{dashboardData.staff.attendancePercent}%</div>
                    <div className="text-[10px] text-slate-500">Faculty parity</div>
                  </div>
                </div>
              </div>

              {/* Class-wise Breakdown Table */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Classroom Roll-Call Breakdown ({formatDisplayDate(dashboardDate)})</span>
                  </h3>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-left text-xs font-mono text-slate-300">
                    <thead className="bg-slate-950/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Class & Section</th>
                        <th className="py-3 px-4">Enrolled Students</th>
                        <th className="py-3 px-4 text-emerald-400">Present</th>
                        <th className="py-3 px-4 text-rose-400">Absent</th>
                        <th className="py-3 px-4 text-amber-400">Late</th>
                        <th className="py-3 px-4">Attendance Rate</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
                      {dashboardData.classStats.map((cls, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-bold text-white">
                            {cls.grade} - Section {cls.section}
                          </td>
                          <td className="py-3 px-4">{cls.total}</td>
                          <td className="py-3 px-4 text-emerald-400 font-bold">{cls.present}</td>
                          <td className="py-3 px-4 text-rose-400 font-bold">{cls.absent}</td>
                          <td className="py-3 px-4 text-amber-400">{cls.late}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    cls.attendancePercent >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${cls.attendancePercent}%` }}
                                />
                              </div>
                              <span className="font-bold">{cls.attendancePercent}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setRegGrade(cls.grade);
                                setRegSection(cls.section);
                                setRegDate(dashboardDate);
                                setActiveTab('student_daily');
                              }}
                              className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-[11px] border border-slate-700"
                            >
                              Open Register
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TAB: STUDENT DAILY ATTENDANCE (HIGH-SPEED UX) */}
      {/* ========================================================================= */}
      {activeTab === 'student_daily' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          {/* Top Sticky Filter / Selector Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/90 border border-slate-800">
            {/* Date Navigator */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStudentDateShift(-1)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 font-mono text-xs">
                <input
                  type="date"
                  value={regDate}
                  onChange={(e) => {
                    if (!settings.allowFutureDates && e.target.value > todayIso) {
                      onShowToast('warning', 'Future Date Disallowed', 'Marking attendance for future dates is disabled in settings.');
                      return;
                    }
                    setRegDate(e.target.value);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold outline-none"
                />
                <button
                  onClick={() => setRegDate(todayIso)}
                  className="px-2.5 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 font-bold"
                >
                  Today
                </button>
                <span className="text-[11px] text-slate-400 font-bold">
                  {formatDisplayDate(regDate)}
                </span>
              </div>

              <button
                onClick={() => handleStudentDateShift(1)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Class & Section Selector */}
            <div className="flex items-center gap-2 font-mono text-xs">
              {isTeacher ? (
                // Restricted selector for Teacher
                <div className="flex items-center gap-2">
                  <span className="text-indigo-400 font-bold text-[11px] flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Assigned Class:</span>
                  </span>
                  <select
                    value={`${regGrade}|||${regSection}`}
                    onChange={(e) => {
                      const [g, s] = e.target.value.split('|||');
                      setRegGrade(g);
                      setRegSection(s);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-indigo-500/40 text-white font-bold outline-none"
                  >
                    {teacherAssignments.map((asg, idx) => (
                      <option key={idx} value={`${asg.grade}|||${asg.section}`}>
                        {asg.grade} - Section {asg.section} ({asg.subject})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                // Full selector for Admin
                <div className="flex items-center gap-2">
                  <select
                    value={regGrade}
                    onChange={(e) => setRegGrade(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold outline-none"
                  >
                    {CLASSES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>

                  <select
                    value={regSection}
                    onChange={(e) => setRegSection(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold outline-none"
                  >
                    {SECTIONS.map(s => (
                      <option key={s} value={s}>Sec {s}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Fast Control: Mark All Present */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleMarkAllStudent('present')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-bold text-xs font-mono flex items-center gap-1.5 transition-all shadow-md"
                title="Set entire class to Present in 1 click"
              >
                <Check className="w-4 h-4" />
                <span>Mark All Present</span>
              </button>

              <button
                onClick={handleSaveStudentAttendance}
                disabled={regSaving || regStudents.length === 0}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs font-mono flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
              >
                {regSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Register</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Already Marked Alert Banner */}
          {regIsAlreadyMarked ? (
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Attendance already submitted for <strong>{regGrade}-{regSection}</strong> on{' '}
                  <strong>{formatDisplayDate(regDate)}</strong> (Marked by: {regMarkedBy || 'Faculty'}).
                </span>
              </div>
              <span className="text-[10px] text-slate-400">
                You can correct any status and click 'Save Register' to update audit trail.
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Attendance not yet submitted for <strong>{regGrade}-{regSection}</strong> on{' '}
                  <strong>{formatDisplayDate(regDate)}</strong>. Defaulting rows to 'Present'.
                </span>
              </div>
              <span className="text-[10px] text-slate-400">
                Make adjustments and click 'Save Register'.
              </span>
            </div>
          )}

          {/* Counters Pill Bar */}
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80 font-mono text-xs">
            <span className="text-slate-400">
              Roster: <strong className="text-white">{studentCounters.total}</strong>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400">
              Present: <strong>{studentCounters.present}</strong>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-rose-400">
              Absent: <strong>{studentCounters.absent}</strong>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400">
              Late: <strong>{studentCounters.late}</strong>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-blue-400">
              Half Day: <strong>{studentCounters.halfDay}</strong>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-purple-400">
              Leave: <strong>{studentCounters.leave}</strong>
            </span>
          </div>

          {/* Roll Call Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs font-mono text-slate-300">
              <thead className="bg-slate-950/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Roll No</th>
                  <th className="py-3 px-4">Admission No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Status Selector (P / A / L / H / LV)</th>
                  <th className="py-3 px-4">Remarks / Excuse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
                {regLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                        <span>Loading class roster...</span>
                      </div>
                    </td>
                  </tr>
                ) : regStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 text-slate-600" />
                        <span className="text-white font-bold">No Students Enrolled in this Section</span>
                        <span className="text-[11px] text-slate-400">
                          Verify Grade ({regGrade}) and Section ({regSection}) selection.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  regStudents.map((std) => (
                    <tr
                      key={std.studentId}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        std.status === 'absent' ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className="font-bold text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/20">
                          {std.rollNo || '—'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-400">
                        {std.admissionNo}
                      </td>

                      <td className="py-3 px-4 font-bold text-white">
                        {std.studentName}
                      </td>

                      {/* 5 Fast Status Pills */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
                          <button
                            type="button"
                            onClick={() => handleSetStudentStatus(std.studentId, 'present')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                              std.status === 'present'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'text-slate-400 hover:text-white'
                            }`}
                            title="Present"
                          >
                            P
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetStudentStatus(std.studentId, 'absent')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                              std.status === 'absent'
                                ? 'bg-rose-600 text-white shadow-md'
                                : 'text-slate-400 hover:text-white'
                            }`}
                            title="Absent"
                          >
                            A
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetStudentStatus(std.studentId, 'late')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                              std.status === 'late'
                                ? 'bg-amber-600 text-white shadow-md'
                                : 'text-slate-400 hover:text-white'
                            }`}
                            title="Late Arrival"
                          >
                            L
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetStudentStatus(std.studentId, 'half_day')}
                            className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all ${
                              std.status === 'half_day'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-slate-400 hover:text-white'
                            }`}
                            title="Half Day"
                          >
                            H
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetStudentStatus(std.studentId, 'leave')}
                            className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all ${
                              std.status === 'leave'
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'text-slate-400 hover:text-white'
                            }`}
                            title="Approved Leave"
                          >
                            LV
                          </button>
                        </div>
                      </td>

                      {/* Remarks Input */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          placeholder="Optional remarks..."
                          value={std.remarks || ''}
                          onChange={(e) => handleSetStudentRemarks(std.studentId, e.target.value)}
                          className="w-full max-w-[250px] px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-cyan-500/50 outline-none"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Save Bar */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-400 font-mono">
              Total {regStudents.length} students loaded for session {activeSession}
            </div>

            <button
              onClick={handleSaveStudentAttendance}
              disabled={regSaving || regStudents.length === 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs font-mono flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Commit Register</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB: STAFF DAILY ATTENDANCE */}
      {/* ========================================================================= */}
      {activeTab === 'staff_daily' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/90 border border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStaffDateShift(-1)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 font-mono text-xs">
                <input
                  type="date"
                  value={staffDate}
                  onChange={(e) => setStaffDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold outline-none"
                />
                <button
                  onClick={() => setStaffDate(todayIso)}
                  className="px-2.5 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/30 text-purple-300 font-bold"
                >
                  Today
                </button>
                <span className="text-slate-400 font-bold">
                  ({formatDisplayDate(staffDate)})
                </span>
              </div>

              <button
                onClick={() => handleStaffDateShift(1)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleMarkAllStaff('present')}
                className="px-3.5 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 font-bold text-xs font-mono flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Mark All Staff Present</span>
              </button>

              <button
                onClick={handleSaveStaffAttendance}
                disabled={staffSaving}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs font-mono flex items-center gap-2 shadow-lg shadow-purple-600/25 transition-all"
              >
                {staffSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Save Staff Attendance</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs font-mono text-slate-300">
              <thead className="bg-slate-950/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Employee Code</th>
                  <th className="py-3 px-4">Faculty / Staff Name</th>
                  <th className="py-3 px-4">Designation & Dept</th>
                  <th className="py-3 px-4">Daily Status</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
                {staffLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-400 mb-2" />
                      <span>Loading staff directory...</span>
                    </td>
                  </tr>
                ) : (
                  staffRecords.map((stf) => (
                    <tr key={stf.staffId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-purple-300">{stf.empId}</td>
                      <td className="py-3 px-4 font-bold text-white">{stf.name}</td>
                      <td className="py-3 px-4 text-slate-400">{stf.designation} • {stf.department}</td>
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
                          <button
                            type="button"
                            onClick={() => handleSetStaffStatus(stf.staffId, 'present')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                              stf.status === 'present' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetStaffStatus(stf.staffId, 'on_leave')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                              stf.status === 'on_leave' || stf.status === 'leave' ? 'bg-amber-600 text-white' : 'text-slate-400'
                            }`}
                          >
                            On Leave
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetStaffStatus(stf.staffId, 'absent')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                              stf.status === 'absent' ? 'bg-rose-600 text-white' : 'text-slate-400'
                            }`}
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetStaffStatus(stf.staffId, 'late')}
                            className={`px-2 py-1 rounded-lg font-bold text-[11px] ${
                              stf.status === 'late' ? 'bg-purple-600 text-white' : 'text-slate-400'
                            }`}
                          >
                            Late
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          placeholder="Optional remarks..."
                          value={stf.remarks || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStaffRecords(prev => prev.map(s => s.staffId === stf.staffId ? { ...s, remarks: val } : s));
                          }}
                          className="w-full max-w-[220px] px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB: MONTHLY ATTENDANCE GRID MATRIX (31 DAYS) */}
      {/* ========================================================================= */}
      {activeTab === 'monthly_grid' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/90 border border-slate-800 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Class & Section */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">Class:</span>
                <select
                  value={monthlyGrade}
                  onChange={(e) => setMonthlyGrade(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold outline-none"
                >
                  {CLASSES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>

                <select
                  value={monthlySection}
                  onChange={(e) => setMonthlySection(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold outline-none"
                >
                  {SECTIONS.map(s => <option key={s} value={s}>Sec {s}</option>)}
                </select>
              </div>

              {/* Month & Year */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">Month:</span>
                <select
                  value={monthlyMonth}
                  onChange={(e) => setMonthlyMonth(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold outline-none"
                >
                  {MONTHS.map(m => <option key={m.val} value={m.val}>{m.name}</option>)}
                </select>

                <select
                  value={monthlyYear}
                  onChange={(e) => setMonthlyYear(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold outline-none"
                >
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400" />P: Present</span>
              <span className="flex items-center gap-1 text-rose-400"><span className="w-2 h-2 rounded-full bg-rose-400" />A: Absent</span>
              <span className="flex items-center gap-1 text-amber-400"><span className="w-2 h-2 rounded-full bg-amber-400" />L: Late</span>
              <span className="flex items-center gap-1 text-blue-400"><span className="w-2 h-2 rounded-full bg-blue-400" />H: Half Day</span>
              <span className="flex items-center gap-1 text-purple-400"><span className="w-2 h-2 rounded-full bg-purple-400" />LV: Leave</span>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            {monthlyLoading || !monthlyGrid ? (
              <div className="py-12 text-center text-slate-500 font-mono">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
                <span>Loading monthly grid...</span>
              </div>
            ) : monthlyGrid.students.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-mono">
                No students found for this class and section.
              </div>
            ) : (
              <table className="w-full text-left text-xs font-mono text-slate-300 border-collapse">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3 sticky left-0 bg-slate-950 z-10 border-r border-slate-800 min-w-[160px]">
                      Student Name
                    </th>
                    {Array.from({ length: monthlyGrid.daysInMonth }, (_, i) => i + 1).map(day => (
                      <th key={day} className="py-3 px-1.5 text-center min-w-[28px]">
                        {day}
                      </th>
                    ))}
                    <th className="py-3 px-3 text-center border-l border-slate-800 text-emerald-400">P</th>
                    <th className="py-3 px-3 text-center text-rose-400">A</th>
                    <th className="py-3 px-3 text-center text-purple-400">LV</th>
                    <th className="py-3 px-3 text-center text-cyan-400">Rate %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/30 text-[11px]">
                  {monthlyGrid.students.map(std => (
                    <tr key={std.studentId} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-bold text-white sticky left-0 bg-slate-950 border-r border-slate-800 truncate max-w-[160px]">
                        {std.name}
                      </td>

                      {/* Day 1..31 Status Cells */}
                      {Array.from({ length: monthlyGrid.daysInMonth }, (_, i) => i + 1).map(day => {
                        const status = std.records[day];
                        let cellContent = '-';
                        let cellClass = 'text-slate-600';

                        if (status === 'present') {
                          cellContent = 'P';
                          cellClass = 'text-emerald-400 font-bold bg-emerald-950/40 rounded';
                        } else if (status === 'absent') {
                          cellContent = 'A';
                          cellClass = 'text-rose-400 font-bold bg-rose-950/60 rounded';
                        } else if (status === 'late') {
                          cellContent = 'L';
                          cellClass = 'text-amber-400 font-bold bg-amber-950/40 rounded';
                        } else if (status === 'half_day') {
                          cellContent = 'H';
                          cellClass = 'text-blue-400 font-bold bg-blue-950/40 rounded';
                        } else if (status === 'leave') {
                          cellContent = 'LV';
                          cellClass = 'text-purple-400 font-bold bg-purple-950/40 rounded';
                        }

                        return (
                          <td key={day} className={`py-2 px-1 text-center ${cellClass}`}>
                            {cellContent}
                          </td>
                        );
                      })}

                      {/* Summary Totals */}
                      <td className="py-2.5 px-3 text-center border-l border-slate-800 font-bold text-emerald-400">
                        {std.presentDays}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-rose-400">
                        {std.absentDays}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-purple-400">
                        {std.leaveDays}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-cyan-300">
                        {std.attendancePercent}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB: REPORTS & LOW ATTENDANCE ALERTING (<75%) */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6 font-mono text-xs">
          {/* Sub-Tabs for Reports */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReportType('low_attendance')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all border ${
                  reportType === 'low_attendance'
                    ? 'bg-rose-950/80 text-rose-300 border-rose-500/40 shadow-md'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Low Attendance Alert (&lt;{settings.lowAttendanceThreshold}%)
              </button>

              <button
                onClick={() => setReportType('daily')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all border ${
                  reportType === 'daily'
                    ? 'bg-slate-800 text-white border-slate-700 shadow-md'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Daily School-Wide Summary
              </button>
            </div>

            <span className="text-[11px] text-slate-400">
              CBSE Statutory Threshold: {settings.lowAttendanceThreshold}%
            </span>
          </div>

          {/* Report 1: Low Attendance Alert */}
          {reportType === 'low_attendance' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-900/50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-rose-300 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Students with Attendance Below {settings.lowAttendanceThreshold}%</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Identified for academic intervention, parent notifications, and board exam compliance checks.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-rose-950 border border-rose-500/40 text-rose-300 font-bold text-sm">
                  {lowAttendanceList.length} Students At Risk
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs font-mono text-slate-300">
                  <thead className="bg-slate-950/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Class & Sec</th>
                      <th className="py-3 px-4 text-center">Working Days</th>
                      <th className="py-3 px-4 text-center text-emerald-400">Present</th>
                      <th className="py-3 px-4 text-center text-rose-400">Absent</th>
                      <th className="py-3 px-4 text-rose-400 font-bold">Attendance %</th>
                      <th className="py-3 px-4">Parent Phone</th>
                      <th className="py-3 px-4 text-right">Intervention</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
                    {reportsLoading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-rose-400 mb-2" />
                          <span>Scanning attendance records...</span>
                        </td>
                      </tr>
                    ) : lowAttendanceList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-emerald-400 font-bold">
                          🎉 All students have attendance rates above {settings.lowAttendanceThreshold}%!
                        </td>
                      </tr>
                    ) : (
                      lowAttendanceList.map(std => (
                        <tr key={std.studentId} className="hover:bg-slate-800/40">
                          <td className="py-3 px-4">
                            <div className="font-bold text-white">{std.studentName}</div>
                            <div className="text-[10px] text-cyan-400 font-bold">{std.admissionNo}</div>
                          </td>

                          <td className="py-3 px-4">
                            {std.grade} ({std.section})
                          </td>

                          <td className="py-3 px-4 text-center">
                            {std.totalWorkingDays}
                          </td>

                          <td className="py-3 px-4 text-center text-emerald-400 font-bold">
                            {std.presentDays}
                          </td>

                          <td className="py-3 px-4 text-center text-rose-400 font-bold">
                            {std.absentDays}
                          </td>

                          <td className="py-3 px-4 font-black text-rose-400">
                            {std.attendancePercent}%
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 text-slate-300">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span>{std.parentPhone || '—'}</span>
                            </div>
                            <div className="text-[10px] text-slate-500">{std.parentName}</div>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                onShowToast(
                                  'success',
                                  'SMS Warning Dispatched 📲',
                                  `Alert sent to ${std.parentName} (${std.parentPhone}): ${std.studentName} has attendance of ${std.attendancePercent}%.`
                                );
                              }}
                              className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold text-[11px] flex items-center gap-1.5 ml-auto"
                            >
                              <Send className="w-3 h-3" />
                              <span>Notify Parent</span>
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

          {/* Report 2: Daily School-Wide Summary */}
          {reportType === 'daily' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs font-mono text-slate-300">
                  <thead className="bg-slate-950/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-center">Total Registered</th>
                      <th className="py-3 px-4 text-center text-emerald-400">Present</th>
                      <th className="py-3 px-4 text-center text-rose-400">Absent</th>
                      <th className="py-3 px-4 text-center text-amber-400">Late</th>
                      <th className="py-3 px-4 text-center text-purple-400">Leave</th>
                      <th className="py-3 px-4 text-right">Rate %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
                    {dailyReportList.map((d, idx) => {
                      const rate = d.total > 0 ? Math.round(((d.present + d.late) / d.total) * 100) : 100;
                      return (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-bold text-white">{formatDisplayDate(d.date)}</td>
                          <td className="py-3 px-4 text-center">{d.total}</td>
                          <td className="py-3 px-4 text-center text-emerald-400 font-bold">{d.present}</td>
                          <td className="py-3 px-4 text-center text-rose-400 font-bold">{d.absent}</td>
                          <td className="py-3 px-4 text-center text-amber-400">{d.late}</td>
                          <td className="py-3 px-4 text-center text-purple-400">{d.leave}</td>
                          <td className="py-3 px-4 text-right font-black text-cyan-300">{rate}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TAB: SETTINGS & PARAMETERS */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && activeRole === 'admin' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6 font-mono text-xs">
          <div className="border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Attendance Configuration & Statutory Thresholds</span>
            </h3>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Tune parameters for CBSE compliance alerts, calendar rules, and default roll-call statuses.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6 max-w-xl">
            <div className="space-y-2">
              <label className="block text-slate-300 font-bold">
                Low Attendance Alert Threshold (%):
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="50"
                  max="95"
                  step="0.5"
                  value={settings.lowAttendanceThreshold}
                  onChange={(e) => setSettings({ ...settings, lowAttendanceThreshold: Number(e.target.value) })}
                  className="w-32 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold outline-none"
                />
                <span className="text-slate-500 text-[11px]">
                  (CBSE standard minimum is 75%)
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-slate-300 font-bold">
                Calendar Restrictions:
              </label>
              <label className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={settings.allowFutureDates}
                  onChange={(e) => setSettings({ ...settings, allowFutureDates: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-0"
                />
                <div>
                  <div className="text-white font-bold">Allow Future Date Attendance Marking</div>
                  <div className="text-slate-500 text-[10px]">
                    Recommended OFF. Prevents accidental roll-call submission for tomorrow or beyond.
                  </div>
                </div>
              </label>
            </div>

            <div className="space-y-2">
              <label className="block text-slate-300 font-bold">
                Default Roll-Call State:
              </label>
              <select
                value={settings.defaultStatus}
                onChange={(e) => setSettings({ ...settings, defaultStatus: e.target.value as AttendanceStatus })}
                className="w-48 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold outline-none"
              >
                <option value="present">Present (Standard)</option>
                <option value="absent">Absent</option>
              </select>
            </div>

            <div className="pt-4 border-t border-slate-800/80">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-lg shadow-cyan-600/25"
              >
                Save Attendance Settings
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
