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
  Lock,
  Printer,
  Cpu,
  Wifi,
  Scan,
  Activity,
  Fingerprint,
  Radio,
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  ErpRole,
  AttendanceStatus,
  StudentDailyAttendanceItem,
  StaffDailyAttendanceItem,
  AttendanceDashboardSummary,
  MonthlyAttendanceGridData,
  LowAttendanceReportItem,
  AttendanceSettings,
  TeacherAssignmentRecord,
  BiometricPunchLogItem,
  BiometricTerminalItem
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
  fetchTeacherAssignments,
  fetchBiometricLogs,
  syncBiometricTerminal,
  recordBiometricPunch
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
  currentStaffId = 'stf-05',
  onShowToast
}) => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'student_daily' | 'staff_daily' | 'biometric_logs' | 'monthly_grid' | 'reports' | 'settings'
  >('dashboard');

  // Today ISO in IST
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
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffDeptFilter, setStaffDeptFilter] = useState('ALL');
  const [staffStatusFilter, setStaffStatusFilter] = useState('ALL');

  // 4. Biometric Logs State
  const [biometricDate, setBiometricDate] = useState(todayIso);
  const [biometricRoleFilter, setBiometricRoleFilter] = useState<'all' | 'staff' | 'student'>('all');
  const [biometricSearch, setBiometricSearch] = useState('');
  const [biometricLogs, setBiometricLogs] = useState<BiometricPunchLogItem[]>([]);
  const [biometricTerminals, setBiometricTerminals] = useState<BiometricTerminalItem[]>([]);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricSyncing, setBiometricSyncing] = useState(false);

  // 5. Monthly Grid State
  const [monthlyGrade, setMonthlyGrade] = useState('Class 10');
  const [monthlySection, setMonthlySection] = useState('A');
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().getMonth() + 1);
  const [monthlyYear, setMonthlyYear] = useState(2026);
  const [monthlyGrid, setMonthlyGrid] = useState<MonthlyAttendanceGridData | null>(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  // 6. Reports State
  const [reportType, setReportType] = useState<'low_attendance' | 'daily'>('low_attendance');
  const [lowAttendanceList, setLowAttendanceList] = useState<LowAttendanceReportItem[]>([]);
  const [dailyReportList, setDailyReportList] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Print Preview Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printType, setPrintType] = useState<'student' | 'staff' | 'biometric'>('student');

  // Teacher assignments resolution
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

  // 4. Fetch Biometric Logs
  const loadBiometricLogs = useCallback(async () => {
    setBiometricLoading(true);
    try {
      const res = await fetchBiometricLogs({
        date: biometricDate,
        role: biometricRoleFilter,
        search: biometricSearch
      });
      if (res.data && res.data.success) {
        setBiometricLogs((res.data as any).logs || []);
        setBiometricTerminals((res.data as any).terminals || []);
      }
    } catch (err: any) {
      onShowToast('error', 'Biometric Logs Load Failed', err.message || 'Could not retrieve biometric records');
    } finally {
      setBiometricLoading(false);
    }
  }, [biometricDate, biometricRoleFilter, biometricSearch, onShowToast]);

  useEffect(() => {
    if (activeTab === 'biometric_logs') {
      loadBiometricLogs();
    }
  }, [activeTab, loadBiometricLogs]);

  // 5. Fetch Monthly Grid
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

  // 6. Fetch Reports
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

  // Student Actions
  const handleMarkAllStudent = (status: AttendanceStatus) => {
    setRegStudents(prev => prev.map(s => ({ ...s, status })));
    onShowToast('info', `Marked All Students as ${status.toUpperCase()} ⚡`, `All ${regStudents.length} rows updated in local buffer`);
  };

  const handleSetStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setRegStudents(prev => prev.map(s => s.studentId === studentId ? { ...s, status } : s));
  };

  const handleSetStudentRemarks = (studentId: string, remarks: string) => {
    setRegStudents(prev => prev.map(s => s.studentId === studentId ? { ...s, remarks } : s));
  };

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
          `Saved ${res.data.totalCount} records for ${regGrade}-${regSection} (${regDate}). Synced with backend database.`
        );
        setRegIsAlreadyMarked(true);
        setRegMarkedBy(isTeacher ? 'Anita Sharma' : 'Principal / Admin');
      }
    } catch (err: any) {
      onShowToast('error', 'Save Failed ❌', err.message || 'Could not save student attendance');
    } finally {
      setRegSaving(false);
    }
  };

  // Staff Daily Register Actions (with CL, EL, Medical, OnDuty, Other Leave)
  const handleMarkAllStaff = (status: AttendanceStatus) => {
    setStaffRecords(prev => prev.map(s => ({ ...s, status })));
    onShowToast('info', `Marked All Staff as ${status.toUpperCase()} ⚡`, `Updated ${staffRecords.length} staff records`);
  };

  const handleSetStaffStatus = (staffId: string, status: AttendanceStatus) => {
    setStaffRecords(prev => prev.map(s => s.staffId === staffId ? { ...s, status } : s));
  };

  const handleSetStaffRemarks = (staffId: string, remarks: string) => {
    setStaffRecords(prev => prev.map(s => s.staffId === staffId ? { ...s, remarks } : s));
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
        onShowToast(
          'success',
          'Staff Attendance Saved ✅',
          `Logged daily records for ${res.data.count} staff members (including CL, EL, Medical, and On Duty)`
        );
        setStaffIsAlreadyMarked(true);
      }
    } catch (err: any) {
      onShowToast('error', 'Staff Save Failed ❌', err.message || 'Could not save staff register');
    } finally {
      setStaffSaving(false);
    }
  };

  // Biometric Terminal Sync Action
  const handleSyncBiometric = async () => {
    setBiometricSyncing(true);
    try {
      const res = await syncBiometricTerminal({ date: biometricDate });
      if (res.data && res.data.success) {
        onShowToast('success', 'Biometric Terminals Synced ⚡', res.data.message);
        loadBiometricLogs();
        if (activeTab === 'staff_daily') loadStaffRegister();
        if (activeTab === 'student_daily') loadStudentRegister();
      }
    } catch (err: any) {
      onShowToast('error', 'Biometric Sync Failed', err.message || 'Could not synchronize terminal punches');
    } finally {
      setBiometricSyncing(false);
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

  // Format Date for Display: DD/MM/YYYY
  const formatDisplayDate = (isoDate: string): string => {
    if (!isoDate) return '';
    const p = isoDate.split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : isoDate;
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

    const total = regStudents.length;
    const rate = total > 0 ? Number(((present + late) / total * 100).toFixed(1)) : 100;
    return { total, present, absent, late, halfDay, leave, rate };
  }, [regStudents]);

  // Calculated Counters for Staff Daily (with CL, EL, Medical, OnDuty, Other Leave)
  const staffCounters = useMemo(() => {
    let present = 0;
    let cl = 0;
    let el = 0;
    let medical = 0;
    let onduty = 0;
    let otherLeave = 0;
    let absent = 0;
    let late = 0;

    staffRecords.forEach(s => {
      const st = (s.status || '').toLowerCase();
      if (st === 'present') present++;
      else if (st === 'cl' || st === 'casual_leave') cl++;
      else if (st === 'el' || st === 'earned_leave') el++;
      else if (st === 'medical' || st === 'medical_leave') medical++;
      else if (st === 'onduty' || st === 'on_duty') onduty++;
      else if (st === 'other_leave' || st === 'other' || st === 'half_day') otherLeave++;
      else if (st === 'absent') absent++;
      else if (st === 'late') late++;
      else if (st === 'on_leave' || st === 'leave') cl++;
      else present++;
    });

    const total = staffRecords.length;
    const totalOnLeave = cl + el + medical + otherLeave;
    const effectivePresent = present + late + onduty;
    const rate = total > 0 ? Number((effectivePresent / total * 100).toFixed(1)) : 100;

    return {
      total,
      present,
      cl,
      el,
      medical,
      onduty,
      otherLeave,
      absent,
      late,
      totalOnLeave,
      rate
    };
  }, [staffRecords]);

  // Filtered Staff Records
  const filteredStaffRecords = useMemo(() => {
    return staffRecords.filter(stf => {
      if (staffDeptFilter !== 'ALL' && stf.department !== staffDeptFilter && stf.staffType !== staffDeptFilter) {
        return false;
      }
      if (staffStatusFilter !== 'ALL') {
        const st = (stf.status || '').toLowerCase();
        if (staffStatusFilter === 'present' && st !== 'present' && st !== 'late') return false;
        if (staffStatusFilter === 'cl' && st !== 'cl' && st !== 'casual_leave') return false;
        if (staffStatusFilter === 'el' && st !== 'el' && st !== 'earned_leave') return false;
        if (staffStatusFilter === 'medical' && st !== 'medical' && st !== 'medical_leave') return false;
        if (staffStatusFilter === 'onduty' && st !== 'onduty' && st !== 'on_duty') return false;
        if (staffStatusFilter === 'other_leave' && st !== 'other_leave' && st !== 'other') return false;
        if (staffStatusFilter === 'absent' && st !== 'absent') return false;
      }
      if (staffSearchQuery.trim()) {
        const q = staffSearchQuery.toLowerCase();
        return (
          stf.name.toLowerCase().includes(q) ||
          stf.empId.toLowerCase().includes(q) ||
          stf.designation.toLowerCase().includes(q) ||
          stf.department.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [staffRecords, staffDeptFilter, staffStatusFilter, staffSearchQuery]);

  // Export Staff Attendance to Excel (.xlsx)
  const handleExportStaffExcel = () => {
    const data = staffRecords.map((stf, index) => ({
      'S.No': index + 1,
      'Emp ID': stf.empId,
      'Faculty / Staff Name': stf.name,
      'Designation': stf.designation,
      'Department': stf.department,
      'Date': staffDate,
      'Attendance Status': stf.status ? stf.status.toUpperCase() : 'PRESENT',
      'Remarks / Leave Reason': stf.remarks || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Staff Attendance');
    XLSX.writeFile(wb, `Staff_Attendance_Register_${staffDate}.xlsx`);
    onShowToast('success', 'Excel Export Ready 📥', `Exported ${staffRecords.length} staff attendance records to .xlsx`);
  };

  // Export Student Attendance to Excel (.xlsx)
  const handleExportStudentExcel = () => {
    const data = regStudents.map((std, index) => ({
      'S.No': index + 1,
      'Roll No': std.rollNo,
      'Admission No': std.admissionNo,
      'Student Name': std.studentName,
      'Class': regGrade,
      'Section': regSection,
      'Date': regDate,
      'Status': std.status.toUpperCase(),
      'Remarks': std.remarks || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${regGrade}_${regSection}`);
    XLSX.writeFile(wb, `Student_Attendance_${regGrade}_${regSection}_${regDate}.xlsx`);
    onShowToast('success', 'Excel Export Ready 📥', `Exported ${regStudents.length} student records for ${regGrade}-${regSection}`);
  };

  // Export Biometric Logs to Excel (.xlsx)
  const handleExportBiometricExcel = () => {
    const data = biometricLogs.map((log, index) => ({
      'S.No': index + 1,
      'Punch ID': log.punchId,
      'Timestamp (IST)': log.timeStr,
      'User Type': log.role.toUpperCase(),
      'ID Code': log.empId || log.rollNo || log.userId,
      'Full Name': log.name,
      'Designation / Class': log.designationOrGrade,
      'Department / Section': log.departmentOrSection,
      'Verification Mode': log.verificationMode,
      'Terminal Name': log.terminalName,
      'Location': log.location,
      'Sync Status': log.syncStatus
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Biometric Logs');
    XLSX.writeFile(wb, `Biometric_Punch_Logs_${biometricDate}.xlsx`);
    onShowToast('success', 'Biometric Excel Exported 📥', `Downloaded ${biometricLogs.length} punch records`);
  };

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen p-3 sm:p-6 text-slate-900 font-sans">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & ATTENDANCE SUB-NAV (WHITE HIGH-CONTRAST ERP STANDARD)    */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-sm">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
                  Attendance Register & Biometric Logs
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                  Session {activeSession}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300 font-bold flex items-center gap-1">
                  <Wifi className="w-3 h-3 text-emerald-600 animate-pulse" />
                  <span>4 Biometric Terminals Live</span>
                </span>
                {isTeacher && (
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3 text-indigo-600" />
                    <span>Teacher Role Restricted</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Live multi-tenant roll calls, biometric hardware logs, teacher class attendance, and staff leave registers (CL / EL / Medical / On Duty).
              </p>
            </div>
          </div>

          {/* Quick Date Display & Terminal Sync */}
          <div className="flex items-center gap-2 self-start lg:self-center">
            <button
              onClick={handleSyncBiometric}
              disabled={biometricSyncing}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Pull latest biometric punches from hardware terminals into ERP register"
            >
              <Cpu className={`w-4 h-4 ${biometricSyncing ? 'animate-spin' : ''}`} />
              <span>{biometricSyncing ? 'Syncing...' : 'Sync Biometrics'}</span>
            </button>

            <button
              onClick={() => {
                if (activeTab === 'dashboard') loadDashboard();
                else if (activeTab === 'student_daily') loadStudentRegister();
                else if (activeTab === 'staff_daily') loadStaffRegister();
                else if (activeTab === 'biometric_logs') loadBiometricLogs();
                else if (activeTab === 'monthly_grid') loadMonthlyGrid();
                else if (activeTab === 'reports') loadReports();
              }}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all cursor-pointer"
              title="Refresh Current View"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-Nav Tab Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              activeTab === 'dashboard'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Daily Register Pulse</span>
          </button>

          <button
            onClick={() => setActiveTab('student_daily')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              activeTab === 'student_daily'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Student Daily Register</span>
          </button>

          <button
            onClick={() => setActiveTab('staff_daily')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              activeTab === 'staff_daily'
                ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Briefcase className="w-4 h-4 text-purple-600" />
            <span>Staff Attendance & Leaves (CL/EL/ML/OD)</span>
          </button>

          <button
            onClick={() => setActiveTab('biometric_logs')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              activeTab === 'biometric_logs'
                ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Fingerprint className="w-4 h-4 text-blue-600" />
            <span>Biometric Hardware Logs</span>
          </button>

          <button
            onClick={() => setActiveTab('monthly_grid')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              activeTab === 'monthly_grid'
                ? 'bg-indigo-700 text-white border-indigo-700 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>31-Day Student Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              activeTab === 'reports'
                ? 'bg-amber-700 text-white border-amber-700 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Reports & Low Attendance (&lt;75%)</span>
          </button>

          {activeRole === 'admin' && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                activeTab === 'settings'
                  ? 'bg-slate-800 text-cyan-300 border-slate-800'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Sliders className="w-4 h-4 text-slate-600" />
              <span>Settings</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TAB: ATTENDANCE DASHBOARD / DAILY REGISTER PULSE                        */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Top Date Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-700 font-bold text-xs">Date:</span>
              <input
                type="date"
                value={dashboardDate}
                onChange={(e) => setDashboardDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-950 font-bold text-xs outline-none"
              />
              <button
                onClick={() => setDashboardDate(todayIso)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer border border-slate-300"
              >
                Today
              </button>
              <span className="text-slate-600 text-xs font-bold ml-1">
                ({formatDisplayDate(dashboardDate)})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Real-time attendance pulse across campus</span>
            </div>
          </div>

          {/* Stat Cards: Student & Staff Pulse */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Student Pulse Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-950 text-base">Student Attendance Pulse</h2>
                    <p className="text-xs text-slate-500">Live roster verified from database</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-700">
                    {dashboardData?.students?.attendancePercent || 0}%
                  </span>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Present Rate</div>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 pt-2 border-t border-slate-100 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 font-bold">Total</div>
                  <div className="text-base font-black text-slate-950">{dashboardData?.students?.total || 0}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-xs text-emerald-700 font-bold">Present</div>
                  <div className="text-base font-black text-emerald-800">{dashboardData?.students?.present || 0}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                  <div className="text-xs text-rose-700 font-bold">Absent</div>
                  <div className="text-base font-black text-rose-800">{dashboardData?.students?.absent || 0}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="text-xs text-amber-700 font-bold">Late</div>
                  <div className="text-base font-black text-amber-800">{dashboardData?.students?.late || 0}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
                  <div className="text-xs text-purple-700 font-bold">Leave</div>
                  <div className="text-base font-black text-purple-800">{dashboardData?.students?.leave || 0}</div>
                </div>
              </div>
            </div>

            {/* Staff Attendance & Leaves Pulse Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-950 text-base">Staff & Faculty Register</h2>
                    <p className="text-xs text-slate-500">CL, EL, Medical, On Duty & Biometrics</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-purple-700">
                    {dashboardData?.staff?.attendancePercent || 0}%
                  </span>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Staff Duty Rate</div>
                </div>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 pt-2 border-t border-slate-100 text-center">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-bold">Total</div>
                  <div className="text-sm font-black text-slate-950">{dashboardData?.staff?.total || 0}</div>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-[10px] text-emerald-700 font-bold">Present</div>
                  <div className="text-sm font-black text-emerald-800">{dashboardData?.staff?.present || 0}</div>
                </div>
                <div className="p-2 rounded-xl bg-sky-50 border border-sky-200">
                  <div className="text-[10px] text-sky-700 font-bold">CL</div>
                  <div className="text-sm font-black text-sky-800">{dashboardData?.staff?.cl || 0}</div>
                </div>
                <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200">
                  <div className="text-[10px] text-indigo-700 font-bold">EL</div>
                  <div className="text-sm font-black text-indigo-800">{dashboardData?.staff?.el || 0}</div>
                </div>
                <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
                  <div className="text-[10px] text-rose-700 font-bold">Medical</div>
                  <div className="text-sm font-black text-rose-800">{dashboardData?.staff?.medical || 0}</div>
                </div>
                <div className="p-2 rounded-xl bg-violet-50 border border-violet-200">
                  <div className="text-[10px] text-violet-700 font-bold">On Duty</div>
                  <div className="text-sm font-black text-violet-800">{dashboardData?.staff?.onduty || 0}</div>
                </div>
                <div className="p-2 rounded-xl bg-red-50 border border-red-200">
                  <div className="text-[10px] text-red-700 font-bold">Absent</div>
                  <div className="text-sm font-black text-red-800">{dashboardData?.staff?.absent || 0}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Class-wise Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-950 text-base">Class-by-Class Attendance Matrix</h3>
                <p className="text-xs text-slate-500">Live breakdown across grades and sections</p>
              </div>
              <button
                onClick={() => setActiveTab('student_daily')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 cursor-pointer"
              >
                Open Roll Call Console →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-100 text-slate-900 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Class & Section</th>
                    <th className="py-3 px-4 text-center">Enrolled</th>
                    <th className="py-3 px-4 text-center text-emerald-700">Present</th>
                    <th className="py-3 px-4 text-center text-rose-700">Absent</th>
                    <th className="py-3 px-4 text-center text-amber-700">Late</th>
                    <th className="py-3 px-4 text-center text-purple-700">Leave</th>
                    <th className="py-3 px-4 text-center">Attendance %</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dashboardLoading ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                        <span>Fetching class registers...</span>
                      </td>
                    </tr>
                  ) : !dashboardData?.classStats || dashboardData.classStats.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-500 font-bold">
                        No student classes active for this date.
                      </td>
                    </tr>
                  ) : (
                    dashboardData.classStats.map((c) => (
                      <tr key={`${c.grade}-${c.section}`} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-black text-slate-950">
                          {c.grade} - Section {c.section}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">{c.total}</td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-700">{c.present}</td>
                        <td className="py-3 px-4 text-center font-bold text-rose-700">{c.absent}</td>
                        <td className="py-3 px-4 text-center font-bold text-amber-700">{c.late}</td>
                        <td className="py-3 px-4 text-center font-bold text-purple-700">{c.leave}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full font-black text-xs ${
                              c.attendancePercent >= 90
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : c.attendancePercent >= 75
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-rose-100 text-rose-900 border border-rose-300'
                            }`}
                          >
                            {c.attendancePercent}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setRegGrade(c.grade);
                              setRegSection(c.section);
                              setRegDate(dashboardDate);
                              setActiveTab('student_daily');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs border border-slate-300 cursor-pointer"
                          >
                            Roll Call
                          </button>
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

      {/* ========================================================================= */}
      {/* 3. TAB: STUDENT DAILY ATTENDANCE REGISTER                                 */}
      {/* ========================================================================= */}
      {activeTab === 'student_daily' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
          {/* Top Control Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleStudentDateShift(-1)}
                className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <input
                type="date"
                value={regDate}
                onChange={(e) => setRegDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold text-xs outline-none"
              />

              <button
                onClick={() => setRegDate(todayIso)}
                className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-emerald-900 font-bold text-xs cursor-pointer"
              >
                Today
              </button>

              <button
                onClick={() => handleStudentDateShift(1)}
                className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 cursor-pointer"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Class & Section Selector */}
              <div className="flex items-center gap-2 ml-2">
                <span className="text-slate-700 font-bold text-xs">Class:</span>
                <select
                  value={regGrade}
                  onChange={(e) => setRegGrade(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold text-xs outline-none"
                >
                  {CLASSES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>

                <select
                  value={regSection}
                  onChange={(e) => setRegSection(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold text-xs outline-none"
                >
                  {SECTIONS.map((s) => (
                    <option key={s} value={s}>Sec {s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleMarkAllStudent('present')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                title="Set entire roster to Present in 1 click"
              >
                <Check className="w-4 h-4 text-emerald-700" />
                <span>Mark All Present</span>
              </button>

              <button
                onClick={handleExportStudentExcel}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                title="Download Excel spreadsheet"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={handleSaveStudentAttendance}
                disabled={regSaving || regStudents.length === 0}
                className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
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

          {/* Already Marked Banner */}
          {regIsAlreadyMarked ? (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Attendance already submitted for <strong>{regGrade}-{regSection}</strong> on{' '}
                  <strong>{formatDisplayDate(regDate)}</strong> (Marked by: {regMarkedBy || 'Faculty'}).
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">
                You can adjust any student and click 'Save Register' to update audit trail.
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Attendance not yet submitted for <strong>{regGrade}-{regSection}</strong> on{' '}
                  <strong>{formatDisplayDate(regDate)}</strong>. Defaulting rows to 'Present'.
                </span>
              </div>
              <span className="text-[11px] text-amber-700 font-medium">
                Review roster, adjust absentees, and click 'Save Register'.
              </span>
            </div>
          )}

          {/* Counters Pill Bar */}
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold">
            <span className="text-slate-700">
              Roster: <strong className="text-slate-950 font-black">{studentCounters.total}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-800">
              Present: <strong className="font-black">{studentCounters.present}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-rose-800">
              Absent: <strong className="font-black">{studentCounters.absent}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-amber-800">
              Late: <strong className="font-black">{studentCounters.late}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-blue-800">
              Half Day: <strong className="font-black">{studentCounters.halfDay}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-purple-800">
              Leave: <strong className="font-black">{studentCounters.leave}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-950">
              Attendance: <strong className="font-black text-emerald-700">{studentCounters.rate}%</strong>
            </span>
          </div>

          {/* Student Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-100 text-slate-900 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Roll No</th>
                  <th className="py-3 px-4">Admission No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Status Selector (P / A / L / H / LV)</th>
                  <th className="py-3 px-4">Remarks / Excuse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {regLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                      <span>Loading class roster...</span>
                    </td>
                  </tr>
                ) : regStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <Users className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                      <div className="text-slate-900 font-black text-sm">No Students Found</div>
                      <div className="text-xs text-slate-500">
                        Check class and section selection for session {activeSession}.
                      </div>
                    </td>
                  </tr>
                ) : (
                  regStudents.map((std) => (
                    <tr
                      key={std.studentId}
                      className={`hover:bg-slate-50 transition-colors ${
                        std.status === 'absent' ? 'bg-rose-50/50' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className="font-black text-slate-950 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {std.rollNo || '—'}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-700">
                        {std.admissionNo}
                      </td>

                      <td className="py-3 px-4 font-black text-slate-950">
                        {std.studentName}
                      </td>

                      {/* 5 Fast Status Buttons */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-300">
                          <button
                            type="button"
                            onClick={() => handleSetStudentStatus(std.studentId, 'present')}
                            className={`px-2.5 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${
                              std.status === 'present'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-slate-700 hover:text-slate-950'
                            }`}
                            title="Present"
                          >
                            P
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetStudentStatus(std.studentId, 'absent')}
                            className={`px-2.5 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${
                              std.status === 'absent'
                                ? 'bg-rose-600 text-white shadow-sm'
                                : 'text-slate-700 hover:text-slate-950'
                            }`}
                            title="Absent"
                          >
                            A
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetStudentStatus(std.studentId, 'late')}
                            className={`px-2.5 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${
                              std.status === 'late'
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'text-slate-700 hover:text-slate-950'
                            }`}
                            title="Late Arrival"
                          >
                            L
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetStudentStatus(std.studentId, 'half_day')}
                            className={`px-2 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${
                              std.status === 'half_day'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-700 hover:text-slate-950'
                            }`}
                            title="Half Day"
                          >
                            H
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetStudentStatus(std.studentId, 'leave')}
                            className={`px-2 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${
                              std.status === 'leave'
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'text-slate-700 hover:text-slate-950'
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
                          placeholder="Optional remarks / reason..."
                          value={std.remarks || ''}
                          onChange={(e) => handleSetStudentRemarks(std.studentId, e.target.value)}
                          className="w-full max-w-[260px] px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-950 text-xs font-medium focus:border-emerald-600 outline-none"
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
            <div className="text-xs text-slate-600 font-bold">
              Total {regStudents.length} students loaded for {regGrade}-{regSection}
            </div>

            <button
              onClick={handleSaveStudentAttendance}
              disabled={regSaving || regStudents.length === 0}
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Commit Student Register</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB: STAFF ATTENDANCE & LEAVES (CL / EL / MEDICAL / ON DUTY)            */}
      {/* ========================================================================= */}
      {activeTab === 'staff_daily' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
          {/* Top Control Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleStaffDateShift(-1)}
                className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <input
                type="date"
                value={staffDate}
                onChange={(e) => setStaffDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold text-xs outline-none"
              />

              <button
                onClick={() => setStaffDate(todayIso)}
                className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 border border-purple-300 text-purple-900 font-bold text-xs cursor-pointer"
              >
                Today
              </button>

              <button
                onClick={() => handleStaffDateShift(1)}
                className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 cursor-pointer"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <span className="text-slate-600 text-xs font-bold ml-1">
                ({formatDisplayDate(staffDate)})
              </span>
            </div>

            {/* Department Filter & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search faculty / staff..."
                  value={staffSearchQuery}
                  onChange={(e) => setStaffSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold text-xs outline-none w-48 sm:w-56"
                />
              </div>

              <select
                value={staffDeptFilter}
                onChange={(e) => setStaffDeptFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold text-xs outline-none"
              >
                <option value="ALL">All Departments</option>
                <option value="Teaching">Teaching Faculty</option>
                <option value="Administration">Administration</option>
                <option value="Science Department">Science</option>
                <option value="Mathematics Department">Mathematics</option>
                <option value="Humanities">Humanities</option>
                <option value="Support">Support Staff</option>
              </select>

              <select
                value={staffStatusFilter}
                onChange={(e) => setStaffStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold text-xs outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="present">Present Only</option>
                <option value="cl">CL (Casual Leave)</option>
                <option value="el">EL (Earned Leave)</option>
                <option value="medical">Medical Leave</option>
                <option value="onduty">On Duty (OD)</option>
                <option value="other_leave">Other Leave</option>
                <option value="absent">Absent</option>
              </select>

              <button
                onClick={() => handleMarkAllStaff('present')}
                className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-900 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                title="Mark all staff as present"
              >
                <Check className="w-4 h-4 text-purple-700" />
                <span>Mark All Present</span>
              </button>

              <button
                onClick={handleExportStaffExcel}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                title="Export staff attendance to Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-purple-700" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={handleSaveStaffAttendance}
                disabled={staffSaving}
                className="px-4 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
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

          {/* Granular Leave & Attendance Counters Pill Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center font-bold text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase block">Total Enrolled</span>
              <span className="text-base font-black text-slate-950">{staffCounters.total}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
              <span className="text-[10px] text-emerald-700 uppercase block">Present</span>
              <span className="text-base font-black">{staffCounters.present}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900">
              <span className="text-[10px] text-sky-700 uppercase block">CL (Casual)</span>
              <span className="text-base font-black">{staffCounters.cl}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900">
              <span className="text-[10px] text-indigo-700 uppercase block">EL (Earned)</span>
              <span className="text-base font-black">{staffCounters.el}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
              <span className="text-[10px] text-rose-700 uppercase block">Medical Leave</span>
              <span className="text-base font-black">{staffCounters.medical}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-violet-50 border border-violet-200 text-violet-900">
              <span className="text-[10px] text-violet-700 uppercase block">On Duty (OD)</span>
              <span className="text-base font-black">{staffCounters.onduty}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-800">
              <span className="text-[10px] text-slate-600 uppercase block">Other Leave</span>
              <span className="text-base font-black">{staffCounters.otherLeave}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-900">
              <span className="text-[10px] text-red-700 uppercase block">Absent (LOP)</span>
              <span className="text-base font-black">{staffCounters.absent}</span>
            </div>
          </div>

          {/* Staff Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-100 text-slate-900 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Faculty / Staff Name</th>
                  <th className="py-3 px-4">Designation & Department</th>
                  <th className="py-3 px-4">Attendance & Leave Status (CL / EL / ML / OD / Other)</th>
                  <th className="py-3 px-4">Leave Reason / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
                      <span>Loading staff directory & attendance registers...</span>
                    </td>
                  </tr>
                ) : filteredStaffRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 font-bold">
                      No staff records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredStaffRecords.map((stf) => {
                    const st = (stf.status || '').toLowerCase();
                    return (
                      <tr key={stf.staffId} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-black text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                            {stf.empId}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-black text-slate-950 text-sm">{stf.name}</div>
                          <div className="text-[10px] text-purple-800 font-bold">{stf.staffType}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{stf.designation}</div>
                          <div className="text-[11px] text-slate-500">{stf.department}</div>
                        </td>

                        {/* Granular Status Selectors: Present, CL, EL, Medical, On Duty, Other, Absent, Late */}
                        <td className="py-3 px-4">
                          <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-300">
                            <button
                              type="button"
                              onClick={() => handleSetStaffStatus(stf.staffId, 'present')}
                              className={`px-2.5 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${
                                st === 'present'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'text-slate-700 hover:text-slate-950'
                              }`}
                              title="Present in Campus"
                            >
                              Present
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSetStaffStatus(stf.staffId, 'cl')}
                              className={`px-2 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${
                                st === 'cl' || st === 'casual_leave'
                                  ? 'bg-sky-600 text-white shadow-sm'
                                  : 'text-slate-700 hover:text-slate-950'
                              }`}
                              title="Casual Leave (CL)"
                            >
                              CL
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSetStaffStatus(stf.staffId, 'el')}
                              className={`px-2 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${
                                st === 'el' || st === 'earned_leave'
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'text-slate-700 hover:text-slate-950'
                              }`}
                              title="Earned Leave (EL)"
                            >
                              EL
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSetStaffStatus(stf.staffId, 'medical')}
                              className={`px-2 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${
                                st === 'medical' || st === 'medical_leave'
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'text-slate-700 hover:text-slate-950'
                              }`}
                              title="Medical Leave (ML)"
                            >
                              Medical
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSetStaffStatus(stf.staffId, 'onduty')}
                              className={`px-2 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${
                                st === 'onduty' || st === 'on_duty'
                                  ? 'bg-violet-700 text-white shadow-sm'
                                  : 'text-slate-700 hover:text-slate-950'
                              }`}
                              title="On Official Duty / Board Deputation (OD)"
                            >
                              On Duty
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSetStaffStatus(stf.staffId, 'other_leave')}
                              className={`px-2 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${
                                st === 'other_leave' || st === 'other' || st === 'half_day'
                                  ? 'bg-slate-700 text-white shadow-sm'
                                  : 'text-slate-700 hover:text-slate-950'
                              }`}
                              title="Other Approved Leave"
                            >
                              Other
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSetStaffStatus(stf.staffId, 'absent')}
                              className={`px-2 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${
                                st === 'absent'
                                  ? 'bg-red-600 text-white shadow-sm'
                                  : 'text-slate-700 hover:text-slate-950'
                              }`}
                              title="Absent / Uninformed Leave"
                            >
                              Absent
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSetStaffStatus(stf.staffId, 'late')}
                              className={`px-2 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${
                                st === 'late'
                                  ? 'bg-amber-600 text-white shadow-sm'
                                  : 'text-slate-700 hover:text-slate-950'
                              }`}
                              title="Late Arrival"
                            >
                              Late
                            </button>
                          </div>
                        </td>

                        {/* Remarks Input */}
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder="Leave reason / duties..."
                            value={stf.remarks || ''}
                            onChange={(e) => handleSetStaffRemarks(stf.staffId, e.target.value)}
                            className="w-full max-w-[240px] px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-950 text-xs font-medium focus:border-purple-600 outline-none"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Save Bar */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-600 font-bold">
              Showing {filteredStaffRecords.length} of {staffRecords.length} staff records for {formatDisplayDate(staffDate)}
            </div>

            <button
              onClick={handleSaveStaffAttendance}
              disabled={staffSaving}
              className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Commit Staff Attendance Register</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB: BIOMETRIC HARDWARE LOGS & REAL-TIME TERMINAL SYNC                 */}
      {/* ========================================================================= */}
      {activeTab === 'biometric_logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
          {/* Hardware Terminals Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {biometricTerminals.map((term) => (
              <div key={term.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                    <span className="font-black text-slate-950 text-xs">{term.name}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                    {term.status}
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-slate-600 font-medium">
                  <div>Type: <strong>{term.type}</strong></div>
                  <div>Location: <strong>{term.location}</strong></div>
                  <div>IP Address: <strong>{term.ip}</strong></div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-bold">Today's Punches:</span>
                  <span className="font-black text-slate-950">{term.punchesToday}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-700 font-bold text-xs">Punch Date:</span>
              <input
                type="date"
                value={biometricDate}
                onChange={(e) => setBiometricDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold text-xs outline-none"
              />

              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-slate-700 font-bold text-xs">Role:</span>
                <select
                  value={biometricRoleFilter}
                  onChange={(e) => setBiometricRoleFilter(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold text-xs outline-none"
                >
                  <option value="all">All (Staff & Students)</option>
                  <option value="staff">Staff Only</option>
                  <option value="student">Students Only</option>
                </select>
              </div>

              <div className="relative ml-2">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search punches by name or ID..."
                  value={biometricSearch}
                  onChange={(e) => setBiometricSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold text-xs outline-none w-48 sm:w-60"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportBiometricExcel}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                title="Download Biometric Log spreadsheet"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Export Punches</span>
              </button>

              <button
                onClick={handleSyncBiometric}
                disabled={biometricSyncing}
                className="px-4 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Cpu className={`w-4 h-4 ${biometricSyncing ? 'animate-spin' : ''}`} />
                <span>{biometricSyncing ? 'Syncing...' : 'Sync to ERP Register'}</span>
              </button>
            </div>
          </div>

          {/* Biometric Punches Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-100 text-slate-900 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Punch ID & IST Time</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">ID / Department / Class</th>
                  <th className="py-3 px-4">Verification Mode</th>
                  <th className="py-3 px-4">Terminal & Location</th>
                  <th className="py-3 px-4 text-center">Sync Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {biometricLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                      <span>Loading real-time biometric logs...</span>
                    </td>
                  </tr>
                ) : biometricLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-bold">
                      No biometric punches logged for {formatDisplayDate(biometricDate)}.
                    </td>
                  </tr>
                ) : (
                  biometricLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-black text-slate-950 text-xs">{log.timeStr}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{log.punchId}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            log.role === 'staff'
                              ? 'bg-purple-100 text-purple-900 border border-purple-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}
                        >
                          {log.role}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-black text-slate-950 text-sm">
                        {log.name}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900">{log.empId || log.rollNo}</div>
                        <div className="text-[11px] text-slate-500">{log.designationOrGrade} • {log.departmentOrSection}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs">
                          {log.verificationMode === 'FACE_RECOGNITION' && <Scan className="w-3.5 h-3.5 text-blue-600" />}
                          {log.verificationMode === 'FINGERPRINT' && <Fingerprint className="w-3.5 h-3.5 text-emerald-600" />}
                          {log.verificationMode === 'RFID_CARD' && <Radio className="w-3.5 h-3.5 text-purple-600" />}
                          <span>{log.verificationMode.replace('_', ' ')}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{log.terminalName}</div>
                        <div className="text-[11px] text-slate-500">{log.location}</div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[10px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          <span>{log.syncStatus}</span>
                        </span>
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
      {/* 6. TAB: 31-DAY STUDENT ATTENDANCE MATRIX GRID                             */}
      {/* ========================================================================= */}
      {activeTab === 'monthly_grid' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-slate-700 font-bold text-xs">Class:</span>
                <select
                  value={monthlyGrade}
                  onChange={(e) => setMonthlyGrade(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold text-xs outline-none"
                >
                  {CLASSES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>

                <select
                  value={monthlySection}
                  onChange={(e) => setMonthlySection(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold text-xs outline-none"
                >
                  {SECTIONS.map((s) => <option key={s} value={s}>Sec {s}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-700 font-bold text-xs">Month:</span>
                <select
                  value={monthlyMonth}
                  onChange={(e) => setMonthlyMonth(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold text-xs outline-none"
                >
                  {MONTHS.map((m) => <option key={m.val} value={m.val}>{m.name}</option>)}
                </select>

                <select
                  value={monthlyYear}
                  onChange={(e) => setMonthlyYear(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold text-xs outline-none"
                >
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1 text-emerald-800"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />P: Present</span>
              <span className="flex items-center gap-1 text-rose-800"><span className="w-2.5 h-2.5 rounded-full bg-rose-600" />A: Absent</span>
              <span className="flex items-center gap-1 text-amber-800"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />L: Late</span>
              <span className="flex items-center gap-1 text-blue-800"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" />H: Half Day</span>
              <span className="flex items-center gap-1 text-purple-800"><span className="w-2.5 h-2.5 rounded-full bg-purple-600" />LV: Leave</span>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            {monthlyLoading || !monthlyGrid ? (
              <div className="py-12 text-center text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                <span>Computing monthly register matrix...</span>
              </div>
            ) : monthlyGrid.students.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-bold">
                No student records found for {monthlyGrade} - Sec {monthlySection}.
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-800 border-collapse">
                <thead className="bg-slate-100 text-slate-900 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 sticky left-0 bg-slate-100 z-10 border-r border-slate-200 min-w-[170px]">
                      Student Name
                    </th>
                    {Array.from({ length: monthlyGrid.daysInMonth }, (_, i) => i + 1).map((day) => (
                      <th key={day} className="py-3 px-1 text-center min-w-[26px]">
                        {day}
                      </th>
                    ))}
                    <th className="py-3 px-3 text-center border-l border-slate-200 text-emerald-800 font-black">P</th>
                    <th className="py-3 px-3 text-center text-rose-800 font-black">A</th>
                    <th className="py-3 px-3 text-center text-purple-800 font-black">LV</th>
                    <th className="py-3 px-3 text-center text-indigo-800 font-black">Rate %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {monthlyGrid.students.map((std) => (
                    <tr key={std.studentId} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-black text-slate-950 sticky left-0 bg-white border-r border-slate-200 truncate max-w-[170px]">
                        {std.name}
                      </td>

                      {Array.from({ length: monthlyGrid.daysInMonth }, (_, i) => i + 1).map((day) => {
                        const status = std.records[day];
                        let cellContent = '-';
                        let cellClass = 'text-slate-400';

                        if (status === 'present') {
                          cellContent = 'P';
                          cellClass = 'text-emerald-800 font-black bg-emerald-50 rounded';
                        } else if (status === 'absent') {
                          cellContent = 'A';
                          cellClass = 'text-rose-800 font-black bg-rose-50 rounded';
                        } else if (status === 'late') {
                          cellContent = 'L';
                          cellClass = 'text-amber-800 font-black bg-amber-50 rounded';
                        } else if (status === 'half_day') {
                          cellContent = 'H';
                          cellClass = 'text-blue-800 font-black bg-blue-50 rounded';
                        } else if (status === 'leave') {
                          cellContent = 'LV';
                          cellClass = 'text-purple-800 font-black bg-purple-50 rounded';
                        }

                        return (
                          <td key={day} className={`py-1.5 px-0.5 text-center ${cellClass}`}>
                            {cellContent}
                          </td>
                        );
                      })}

                      <td className="py-2 px-3 text-center border-l border-slate-200 font-black text-emerald-800">
                        {std.presentDays}
                      </td>
                      <td className="py-2 px-3 text-center font-black text-rose-800">
                        {std.absentDays}
                      </td>
                      <td className="py-2 px-3 text-center font-black text-purple-800">
                        {std.leaveDays}
                      </td>
                      <td className="py-2 px-3 text-center font-black text-indigo-800">
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
      {/* 7. TAB: REPORTS & LOW ATTENDANCE ALERTING (<75% CBSE CRITERIA)            */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReportType('low_attendance')}
                className={`px-3.5 py-1.5 rounded-xl font-bold cursor-pointer border ${
                  reportType === 'low_attendance'
                    ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Low Attendance Alert (&lt;{settings.lowAttendanceThreshold}%)
              </button>

              <button
                onClick={() => setReportType('daily')}
                className={`px-3.5 py-1.5 rounded-xl font-bold cursor-pointer border ${
                  reportType === 'daily'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Daily School-Wide Summary
              </button>
            </div>

            <span className="text-xs text-slate-600 font-bold">
              CBSE Statutory Threshold: {settings.lowAttendanceThreshold}%
            </span>
          </div>

          {reportType === 'low_attendance' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-rose-950 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Students with Attendance Below {settings.lowAttendanceThreshold}%</span>
                  </h3>
                  <p className="text-xs text-rose-800 mt-0.5 font-medium">
                    Identified for academic intervention, parent WhatsApp/SMS notifications, and board exam compliance.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 font-black text-sm">
                  {lowAttendanceList.length} At Risk
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-800">
                  <thead className="bg-slate-100 text-slate-900 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Class & Sec</th>
                      <th className="py-3 px-4 text-center">Working Days</th>
                      <th className="py-3 px-4 text-center text-emerald-800 font-bold">Present</th>
                      <th className="py-3 px-4 text-center text-rose-800 font-bold">Absent</th>
                      <th className="py-3 px-4 text-rose-900 font-black">Attendance %</th>
                      <th className="py-3 px-4">Parent Contact</th>
                      <th className="py-3 px-4 text-right">Intervention</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportsLoading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-rose-600 mb-2" />
                          <span>Scanning institutional attendance records...</span>
                        </td>
                      </tr>
                    ) : lowAttendanceList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-emerald-800 font-black">
                          🎉 Excellent! All students are currently above {settings.lowAttendanceThreshold}% attendance.
                        </td>
                      </tr>
                    ) : (
                      lowAttendanceList.map((std) => (
                        <tr key={std.studentId} className="hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <div className="font-black text-slate-950">{std.studentName}</div>
                            <div className="text-[10px] text-slate-500 font-bold">{std.admissionNo}</div>
                          </td>

                          <td className="py-3 px-4 font-bold text-slate-900">
                            {std.grade} ({std.section})
                          </td>

                          <td className="py-3 px-4 text-center font-bold text-slate-700">
                            {std.totalWorkingDays}
                          </td>

                          <td className="py-3 px-4 text-center text-emerald-800 font-black">
                            {std.presentDays}
                          </td>

                          <td className="py-3 px-4 text-center text-rose-800 font-black">
                            {std.absentDays}
                          </td>

                          <td className="py-3 px-4 font-black text-rose-800 text-sm">
                            {std.attendancePercent}%
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 font-bold text-slate-900">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span>{std.parentPhone || '—'}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">{std.parentName}</div>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                onShowToast(
                                  'success',
                                  'Parent Alert Dispatched 📲',
                                  `Notice sent to ${std.parentName} (${std.parentPhone}): ${std.studentName} has ${std.attendancePercent}% attendance.`
                                );
                              }}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-900 font-black text-xs flex items-center gap-1.5 ml-auto cursor-pointer"
                            >
                              <Send className="w-3 h-3 text-rose-700" />
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

          {reportType === 'daily' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-800">
                  <thead className="bg-slate-100 text-slate-900 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-center">Total Registered</th>
                      <th className="py-3 px-4 text-center text-emerald-800">Present</th>
                      <th className="py-3 px-4 text-center text-rose-800">Absent</th>
                      <th className="py-3 px-4 text-center text-amber-800">Late</th>
                      <th className="py-3 px-4 text-center text-purple-800">Leave</th>
                      <th className="py-3 px-4 text-right">Rate %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dailyReportList.map((d, idx) => {
                      const rate = d.total > 0 ? Math.round(((d.present + d.late) / d.total) * 100) : 100;
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-black text-slate-950">{formatDisplayDate(d.date)}</td>
                          <td className="py-3 px-4 text-center font-bold text-slate-800">{d.total}</td>
                          <td className="py-3 px-4 text-center text-emerald-800 font-bold">{d.present}</td>
                          <td className="py-3 px-4 text-center text-rose-800 font-bold">{d.absent}</td>
                          <td className="py-3 px-4 text-center text-amber-800 font-bold">{d.late}</td>
                          <td className="py-3 px-4 text-center text-purple-800 font-bold">{d.leave}</td>
                          <td className="py-3 px-4 text-right font-black text-slate-950">{rate}%</td>
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
      {/* 8. TAB: SETTINGS & PARAMETERS (ADMIN ONLY)                                */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && activeRole === 'admin' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 text-xs">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-slate-700" />
              <span>Attendance Configuration & Statutory Thresholds</span>
            </h3>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">
              Parameters for CBSE compliance alerts, calendar rules, and default roll-call statuses.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-5 max-w-xl">
            <div className="space-y-1.5">
              <label className="block text-slate-900 font-bold">
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
                  className="w-32 px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-950 font-black outline-none"
                />
                <span className="text-slate-500 text-xs font-medium">
                  (CBSE standard minimum is 75%)
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-900 font-bold">
                Calendar Restrictions:
              </label>
              <label className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 cursor-pointer hover:border-slate-300">
                <input
                  type="checkbox"
                  checked={settings.allowFutureDates}
                  onChange={(e) => setSettings({ ...settings, allowFutureDates: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-0"
                />
                <div>
                  <div className="text-slate-950 font-black">Allow Future Date Attendance Marking</div>
                  <div className="text-slate-500 text-xs">
                    Recommended OFF. Prevents accidental roll-call submission for tomorrow or beyond.
                  </div>
                </div>
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-900 font-bold">
                Default Roll-Call State:
              </label>
              <select
                value={settings.defaultStatus}
                onChange={(e) => setSettings({ ...settings, defaultStatus: e.target.value as AttendanceStatus })}
                className="w-52 px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-950 font-bold outline-none"
              >
                <option value="present">Present (Standard)</option>
                <option value="absent">Absent</option>
              </select>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black transition-all shadow-sm cursor-pointer"
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
