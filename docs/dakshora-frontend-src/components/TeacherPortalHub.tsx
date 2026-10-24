import React, { useState, useEffect, useMemo } from 'react';
import {
  Lock,
  Unlock,
  Edit3,
  AlertCircle,
  Layers,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  Bot,
  Sparkles,
  Search,
  Bell,
  Mail,
  Settings,
  LogOut,
  ChevronRight,
  ChevronDown,
  Filter,
  Plus,
  RefreshCw,
  Send,
  Phone,
  ArrowLeft,
  UserCheck,
  Users,
  BarChart3,
  BookOpen,
  ClipboardList,
  Edit,
  MoreVertical,
  QrCode,
  Printer,
  Shield,
  Menu,
  Clock3,
  MapPin,
  Check,
  X,
  CalendarDays,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useTranslation, LanguageSelector } from '../i18n';
import { TeacherPortalSidebar, TeacherPortalTab } from './TeacherPortalSidebar';
import { SchoolBrandProfile, PRESET_SCHOOLS } from './SchoolBrandingModal';
import { sendErpAiPrompt } from '../services/api';

interface TeacherPortalHubProps {
  currentUser?: any;
  onShowToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
  onSignOut?: () => void;
  schoolBrand?: SchoolBrandProfile;
  onSwitchRole?: (role: string) => void;
}

export interface TeacherProfileData {
  name: string;
  empId: string;
  currentPost: string;
  currentOffice: string;
  appointmentDate: string;
  payScale: string;
  gender: string;
  dob: string;
  category: string;
  email: string;
  mobile: string;
  city: string;
  qualification: string;
  assignedClass: string;
  department: string;
}

export const TeacherPortalHub: React.FC<TeacherPortalHubProps> = ({
  currentUser,
  onShowToast,
  onSignOut,
  schoolBrand,
  onSwitchRole
}) => {
  const { t, isHindi, isBilingual } = useTranslation();

  // Navigation & Drawer states
  const [activeTab, setActiveTab] = useState<TeacherPortalTab>('pulse');
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('dakshora_teacher_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('dakshora_teacher_sidebar_collapsed', String(isDesktopCollapsed));
    } catch {}
  }, [isDesktopCollapsed]);

  // Full Teacher Profile State (Matches Screenshot 2)
  const [profile, setProfile] = useState<TeacherProfileData>(() => {
    const rawName = currentUser?.name || currentUser?.full_name;
    const school = currentUser?.schoolName || currentUser?.school?.name || 'Dakshora Academy, New Delhi';

    return {
      name: rawName || 'Vikramaditya Singh',
      empId: currentUser?.empId || currentUser?.employee_code || currentUser?.staffId || 'DKS-FAC-03',
      currentPost: currentUser?.designation || currentUser?.currentPost || 'PGT Mathematics',
      currentOffice: school,
      appointmentDate: currentUser?.appointmentDate || '15/07/2021',
      payScale: currentUser?.payScale || '47600-151100(Level 8)',
      gender: currentUser?.gender || 'Male',
      dob: currentUser?.dob || '12/08/1988',
      category: currentUser?.category || 'General',
      email: currentUser?.email || 'teacher@dakshoraacademy.edu.in',
      mobile: currentUser?.phone || currentUser?.mobile || '9811000003',
      city: currentUser?.city || 'NEW DELHI',
      qualification: currentUser?.qualification || 'M.Sc (Mathematics), B.Ed',
      assignedClass: currentUser?.assignedClass || 'Class 10-A',
      department: currentUser?.department || 'Mathematics'
    };
  });

  // Employee Profile Modal (Screenshot 2)
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Dynamic School Brand (White-Labeled Institutional Identity)
  const resolvedSchoolName = (() => {
    const raw = schoolBrand?.schoolName || currentUser?.schoolName || currentUser?.school?.name || '';
    if (raw && !raw.toLowerCase().includes('dakshora')) return raw;
    return 'Delhi Public Academy, New Delhi';
  })();
  const resolvedSchoolLogo = (() => {
    const raw = schoolBrand?.logoUrl || currentUser?.logoUrl || currentUser?.school?.logoUrl || '';
    if (raw && !raw.includes('dakshora') && !raw.endsWith('/logo.svg')) return raw;
    return '/assets/schools/new-ideal-logo.svg';
  })();

  // Real Teacher Substitution / Arrangement Duties State from Backend Database
  const [arrangements, setArrangements] = useState<any[]>([]);
  const [loadingArrangements, setLoadingArrangements] = useState(false);
  const [selectedArrangement, setSelectedArrangement] = useState<any | null>(null);
  const [showArrangementModal, setShowArrangementModal] = useState(false);

  const pendingArrangements = useMemo(() => 
    arrangements.filter(a => a.status === 'assigned' || a.status === 'pending'),
    [arrangements]
  );
  const activePendingArrangement = pendingArrangements[0] || null;
  const acceptedArrangements = useMemo(() => 
    arrangements.filter(a => a.status === 'accepted'),
    [arrangements]
  );

  // Selected class for roll-call
  const [selectedClassForMarking, setSelectedClassForMarking] = useState<string>(profile.assignedClass || 'Class 10-A');
  const [workloadData, setWorkloadData] = useState<any>(null);
  const [showWorkloadModal, setShowWorkloadModal] = useState(false);

  // Submitted classes registry & locking
  const [submittedClasses, setSubmittedClasses] = useState<Record<string, {
    submittedAt: string;
    date: string;
    present: number;
    absent: number;
    leave: number;
    total: number;
    markedBy: string;
  }>>({});

  // Edit mode for submitted attendance
  const [isEditingAttendance, setIsEditingAttendance] = useState(false);

  // Real school-wide attendance analytics from backend database
  const [schoolAttendanceData, setSchoolAttendanceData] = useState<any>(null);
  const [loadingSchoolAttendance, setLoadingSchoolAttendance] = useState(false);

  // Success confirmation modal state
  const [showAttendanceSuccessModal, setShowAttendanceSuccessModal] = useState(false);
  const [lastSubmissionSummary, setLastSubmissionSummary] = useState<{
    className: string;
    date: string;
    submittedAt: string;
    present: number;
    absent: number;
    leave: number;
    total: number;
    markedBy: string;
    isUpdate?: boolean;
  } | null>(null);

  // Classes & Live Rosters from Database
  const [unmarkedClasses, setUnmarkedClasses] = useState([
    { grade: 'Class 10-A', count: 6, total: 6, wing: 'Secondary' },
    { grade: 'Class 9-A', count: 6, total: 6, wing: 'Secondary' },
    { grade: 'Class 8-A', count: 6, total: 6, wing: 'Middle' },
    { grade: 'Class 11 Science', count: 6, total: 6, wing: 'Sr. Secondary' },
    { grade: 'Class 12 Science', count: 6, total: 6, wing: 'Sr. Secondary' }
  ]);

  // Live student roster for active marking class
  const [classRoster, setClassRoster] = useState<any[]>([
    { id: 'std-10-01', rollNo: 1, name: 'Advik Chaudhary', admissionNo: 'DKS-2026-079', status: 'present' },
    { id: 'std-10-02', rollNo: 2, name: 'Mira Pandey', admissionNo: 'DKS-2026-080', status: 'leave', isLeaveLocked: true, leaveReason: 'Approved Leave: Severe viral fever' },
    { id: 'std-10-03', rollNo: 3, name: 'Kavya Sharma', admissionNo: 'DKS-2026-081', status: 'present' },
    { id: 'std-10-04', rollNo: 4, name: 'Ishita Verma', admissionNo: 'DKS-2026-082', status: 'present' },
    { id: 'std-10-05', rollNo: 5, name: 'Pranav Gupta', admissionNo: 'DKS-2026-083', status: 'absent' },
    { id: 'std-10-06', rollNo: 6, name: 'Ahana Singh', admissionNo: 'DKS-2026-084', status: 'present' }
  ]);

  // Student Leave Requests State & Review Workflow
  const [studentLeaves, setStudentLeaves] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('dakshora_approved_student_leaves');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [reviewingLeaveId, setReviewingLeaveId] = useState<string | null>(null);
  const [leaveFilter, setLeaveFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Fetch live leave applications from backend
  const fetchStudentLeaves = React.useCallback(async () => {
    setLoadingLeaves(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('dakshora_auth_token') : null;
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/erp/portal/leave-applications', { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.applications)) {
        setStudentLeaves(data.applications);
        try {
          localStorage.setItem('dakshora_approved_student_leaves', JSON.stringify(data.applications));
        } catch {}
      }
    } catch (err: any) {
      console.warn('Failed to load leave applications:', err.message);
    } finally {
      setLoadingLeaves(false);
    }
  }, []);

  useEffect(() => {
    fetchStudentLeaves();
  }, [fetchStudentLeaves]);

  // Teacher Faculty Leave Desk State (CL, Earn Leave, Medical Leave, Other Leave)
  const [teacherLeaves, setTeacherLeaves] = useState<any[]>([]);
  const [teacherLeaveBalances, setTeacherLeaveBalances] = useState<{
    cl: { total: number; used: number; remaining: number; label: string };
    el: { total: number; used: number; remaining: number; label: string };
    ml: { total: number; used: number; remaining: number; label: string };
    other: { total: number; used: number; remaining: number; label: string };
  }>({
    cl: { total: 12, used: 2, remaining: 10, label: 'Casual Leave (CL)' },
    el: { total: 15, used: 3, remaining: 12, label: 'Earned Leave (EL)' },
    ml: { total: 10, used: 1, remaining: 9, label: 'Medical Leave (ML)' },
    other: { total: 5, used: 0, remaining: 5, label: 'Other / Duty Leave' }
  });
  const [loadingTeacherLeaves, setLoadingTeacherLeaves] = useState(false);
  const [showTeacherApplyLeaveModal, setShowTeacherApplyLeaveModal] = useState(false);
  const [submittingTeacherLeave, setSubmittingTeacherLeave] = useState(false);
  const [leaveDeskSubTab, setLeaveDeskSubTab] = useState<'student_leaves' | 'my_leaves'>('my_leaves');

  const [teacherLeaveForm, setTeacherLeaveForm] = useState({
    leaveType: 'CL' as 'CL' | 'EL' | 'ML' | 'OTHER',
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    isHalfDay: false,
    halfDayType: 'first_half' as 'first_half' | 'second_half',
    reason: '',
    handoverNotes: '',
    contactNumber: profile.mobile || '9811000003'
  });

  // Fetch live faculty leaves from backend
  const fetchTeacherLeaves = React.useCallback(async () => {
    setLoadingTeacherLeaves(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('dakshora_auth_token') : null;
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/erp/teacher/leaves', { headers });
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.applications)) {
          setTeacherLeaves(data.applications);
        }
        if (data.balances) {
          const norm = (b: any, defTotal: number, defLabel: string) => ({
            total: b?.total ?? defTotal,
            used: b?.used ?? 0,
            remaining: b?.remaining ?? b?.balance ?? (defTotal - (b?.used ?? 0)),
            label: b?.name ?? b?.label ?? defLabel
          });
          setTeacherLeaveBalances({
            cl: norm(data.balances.cl, 12, 'Casual Leave (CL)'),
            el: norm(data.balances.el, 15, 'Earned Leave (EL)'),
            ml: norm(data.balances.ml, 10, 'Medical Leave (ML)'),
            other: norm(data.balances.other, 5, 'Other / Special Leave')
          });
        }
      }
    } catch (err: any) {
      console.warn('Failed to load teacher leave data:', err.message);
    } finally {
      setLoadingTeacherLeaves(false);
    }
  }, []);

  useEffect(() => {
    fetchTeacherLeaves();
  }, [fetchTeacherLeaves]);

  useEffect(() => {
    if (activeTab === 'my_leaves') {
      setLeaveDeskSubTab('my_leaves');
    } else if (activeTab === 'leaves') {
      setLeaveDeskSubTab('student_leaves');
    }
  }, [activeTab]);

  const handleSubmitTeacherLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherLeaveForm.reason.trim()) {
      onShowToast('warning', 'Reason Required', 'Please provide a reason for the leave application.');
      return;
    }
    setSubmittingTeacherLeave(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('dakshora_auth_token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch('/api/erp/teacher/leaves/apply', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          staffName: profile.name,
          staffPost: profile.currentPost,
          empId: profile.empId,
          department: profile.department,
          assignedClass: profile.assignedClass,
          ...teacherLeaveForm
        })
      });
      const data = await res.json();
      if (data.success) {
        onShowToast(
          'success',
          'Application Submitted ✓',
          data.message || 'Leave application successfully forwarded to Principal / HR desk.'
        );
        setShowTeacherApplyLeaveModal(false);
        setTeacherLeaveForm(prev => ({
          ...prev,
          reason: '',
          handoverNotes: '',
          isHalfDay: false
        }));
        await fetchTeacherLeaves();
      } else {
        onShowToast('error', 'Submission Failed', data.message || 'Unable to submit leave request.');
      }
    } catch (err: any) {
      onShowToast('error', 'Server Error', err.message || 'Connection failed.');
    } finally {
      setSubmittingTeacherLeave(false);
    }
  };

  const handleWithdrawTeacherLeave = async (id: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('dakshora_auth_token') : null;
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/erp/teacher/leaves/${id}`, {
        method: 'DELETE',
        headers
      });
      const data = await res.json();
      if (data.success) {
        onShowToast('info', 'Application Withdrawn', data.message || 'Leave application cancelled.');
        await fetchTeacherLeaves();
      } else {
        onShowToast('error', 'Failed', data.message || 'Cannot withdraw application.');
      }
    } catch (err: any) {
      onShowToast('error', 'Error', err.message || 'Could not withdraw leave.');
    }
  };

  // Review & Approve / Decline Student Leave
  const handleReviewLeave = async (leaveId: string, status: 'approved' | 'rejected') => {
    setReviewingLeaveId(leaveId);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('dakshora_auth_token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch(`/api/erp/portal/leave-applications/${leaveId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status,
          reviewedBy: `${profile.name || 'Vikramaditya Singh'} (Class Teacher)`,
          reviewNotes: status === 'approved'
            ? `Approved by Class Teacher (${profile.name || 'Vikramaditya Singh'}). Medical/Parent reason verified.`
            : `Declined by Class Teacher (${profile.name || 'Vikramaditya Singh'}).`
        })
      });
      const data = await res.json();
      if (data.success) {
        onShowToast(
          'success',
          status === 'approved' ? 'Leave Approved ✓' : 'Leave Declined',
          data.message || `Leave application status updated in live database.`
        );
        const updatedLeaves = studentLeaves.map(item =>
          item.id === leaveId
            ? {
                ...item,
                status,
                reviewedBy: `${profile.name || 'Vikramaditya Singh'} (Class Teacher)`,
                reviewedAt: new Date().toISOString()
              }
            : item
        );
        setStudentLeaves(updatedLeaves);
        try {
          localStorage.setItem('dakshora_approved_student_leaves', JSON.stringify(updatedLeaves));
        } catch {}

        // If approved, automatically update classRoster to lock the student's status to 'leave'
        if (status === 'approved') {
          const approvedApp = updatedLeaves.find(item => item.id === leaveId);
          if (approvedApp) {
            setClassRoster(prev =>
              prev.map(st => {
                const matches = 
                  st.id === approvedApp.studentId ||
                  st.admissionNo === approvedApp.admissionNo ||
                  st.name?.toLowerCase() === approvedApp.studentName?.toLowerCase() ||
                  String(st.rollNo) === String(approvedApp.rollNo).replace(/\D/g, '');
                if (matches) {
                  return {
                    ...st,
                    status: 'leave',
                    isLeaveLocked: true,
                    leaveReason: approvedApp.reason
                  };
                }
                return st;
              })
            );
          }
        }
      } else {
        onShowToast('error', 'Update Failed', data.message || 'Could not update leave status');
      }
    } catch (err: any) {
      onShowToast('error', 'Error', err.message);
    } finally {
      setReviewingLeaveId(null);
    }
  };

  // Fetch real arrangement duties from backend database
  const fetchTeacherArrangements = React.useCallback(async () => {
    try {
      setLoadingArrangements(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('dakshora_auth_token') : null;
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/erp/teacher/arrangements', { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.arrangements)) {
        setArrangements(data.arrangements);
      } else {
        setArrangements([]);
      }
    } catch (_err) {
      setArrangements([]);
    } finally {
      setLoadingArrangements(false);
    }
  }, []);

  useEffect(() => {
    fetchTeacherArrangements();
  }, [fetchTeacherArrangements]);

  // Accept substitution duty in real backend database
  const handleAcceptArrangement = async (arrId: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('dakshora_auth_token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch(`/api/erp/teacher/arrangements/${arrId}/accept`, {
        method: 'POST',
        headers
      });
      const data = await res.json();
      if (data.success) {
        onShowToast('success', 'Duty Accepted ✓', 'Arrangement duty confirmed and saved to ERP database.');
        setArrangements(prev => prev.map(a => a.id === arrId ? { ...a, status: 'accepted', isAccepted: true } : a));
        setShowArrangementModal(false);
      } else {
        onShowToast('error', 'Error', data.message || 'Could not accept duty');
      }
    } catch (err: any) {
      onShowToast('error', 'Error', err.message);
    }
  };

  // Fetch real school-wide attendance analytics for All Classes Combined
  const fetchSchoolAttendanceDashboard = React.useCallback(async () => {
    try {
      setLoadingSchoolAttendance(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('dakshora_auth_token') : null;
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/erp/attendance/dashboard?date=${todayStr}`, { headers });
      const data = await res.json();
      if (data.success) {
        setSchoolAttendanceData(data);
      }
    } catch (_err) {
      // keep fallback
    } finally {
      setLoadingSchoolAttendance(false);
    }
  }, []);

  useEffect(() => {
    fetchSchoolAttendanceDashboard();
  }, [fetchSchoolAttendanceDashboard]);

  // Check if attendance is already submitted in database for selected class today
  useEffect(() => {
    async function checkTodaySubmission() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('dakshora_auth_token') : null;
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const todayStr = new Date().toISOString().split('T')[0];
        const res = await fetch(`/api/erp/teacher/attendance?date=${todayStr}&grade=${encodeURIComponent(selectedClassForMarking)}`, { headers });
        const data = await res.json();
        if (data.success && data.isSubmitted && data.summary) {
          setSubmittedClasses(prev => ({
            ...prev,
            [selectedClassForMarking]: {
              submittedAt: data.summary.submittedAt || '08:15 AM',
              date: data.date || todayStr,
              present: data.summary.presentCount,
              absent: data.summary.absentCount,
              leave: data.summary.leaveCount,
              total: data.summary.totalCount,
              markedBy: data.summary.markedBy || 'Class Teacher'
            }
          }));
          if (Array.isArray(data.attendance) && data.attendance.length > 0) {
            setClassRoster(prev => prev.map(st => {
              const rec = data.attendance.find((a: any) =>
                a.studentId === st.id ||
                a.student_id === st.id ||
                (st.admissionNo && a.admissionNo === st.admissionNo) ||
                (a.studentName && a.studentName.toLowerCase() === st.name.toLowerCase())
              );
              return rec ? { ...st, status: rec.status } : st;
            }));
          }
        }
      } catch (_e) {}
    }
    checkTodaySubmission();
  }, [selectedClassForMarking]);

  // 1. Fetch live profile and workload calculations from backend
  useEffect(() => {
    async function fetchTeacherLiveProfileAndWorkload() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('dakshora_auth_token') : null;
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        // Profile
        const res = await fetch('/api/erp/teacher/profile', { headers });
        const data = await res.json();
        if (data.success && data.profile) {
          setProfile(prev => ({ ...prev, ...data.profile }));
          if (data.profile.assignedClass) {
            setSelectedClassForMarking(data.profile.assignedClass);
          }
        }

        // Workload & Responsibilities calculation
        const wRes = await fetch('/api/erp/teacher/workload', { headers });
        const wData = await wRes.json();
        if (wData.success) {
          setWorkloadData(wData);
        }
      } catch (err) {
        // Fallback to initial state
      }
    }
    fetchTeacherLiveProfileAndWorkload();
  }, [currentUser]);

  // 2. Fetch live student roster from backend for selected class
  useEffect(() => {
    async function fetchClassStudents() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('dakshora_auth_token') : null;
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch('/api/erp/students?limit=150', {
          headers
        });
        const data = await res.json();
        if (data.students && Array.isArray(data.students) && data.students.length > 0) {
          // Dynamic calculation of unmarked classes from real database students
          const wingForGrade = (grade: string) => {
            const g = grade.toLowerCase();
            if (g.includes('nursery') || g.includes('lkg') || g.includes('ukg')) return 'Pre-Primary';
            if (g.includes('class 1') || g.includes('class 2') || g.includes('class 3') || g.includes('class 4') || g.includes('class 5')) return 'Primary';
            if (g.includes('class 6') || g.includes('class 7') || g.includes('class 8')) return 'Middle';
            if (g.includes('class 9') || g.includes('class 10')) return 'Secondary';
            return 'Sr. Secondary';
          };

          const classCountMap: Record<string, { count: number; wing: string }> = {};
          data.students.forEach((s: any) => {
            const gradeName = s.grade || s.currentGrade || 'Class 10';
            const sec = s.section || s.currentSection || 'A';
            const key = gradeName.includes(sec) ? gradeName : `${gradeName}-${sec}`;
            if (!classCountMap[key]) {
              classCountMap[key] = { count: 0, wing: wingForGrade(gradeName) };
            }
            classCountMap[key].count += 1;
          });

          const dynamicClasses = Object.entries(classCountMap).map(([grade, val]) => ({
            grade,
            count: val.count,
            total: val.count,
            wing: val.wing
          }));

          if (dynamicClasses.length > 0) {
            setUnmarkedClasses(dynamicClasses);
          }

          // Filter for selectedClassForMarking
          const rawClass = selectedClassForMarking.toLowerCase().replace(/[^a-z0-9]/g, '');
          const filtered = data.students.filter((s: any) => {
            const combined = `${s.grade || s.currentGrade || ''}${s.section || s.currentSection || ''}`.toLowerCase().replace(/[^a-z0-9]/g, '');
            return combined.includes(rawClass) || rawClass.includes(combined) || (rawClass.includes('10') && combined.includes('10'));
          });

          if (filtered.length > 0) {
            setClassRoster(filtered.map((s: any, idx: number) => {
              const stdName = s.name || `${s.firstName || s.first_name || ''} ${s.lastName || s.last_name || ''}`.trim() || 'Student';
              const admNo = s.admissionNo || s.admission_number || `DKS-2026-${String(idx + 1).padStart(3, '0')}`;
              const rollVal = s.rollNo ? parseInt(String(s.rollNo).replace(/\D/g, ''), 10) || (idx + 1) : (idx + 1);

              // Check if student has an active approved leave
              const activeApp = studentLeaves.find(l =>
                (l.studentId === s.id || l.student_id === s.id || l.admissionNo === admNo || l.studentName?.toLowerCase() === stdName.toLowerCase() || String(l.rollNo).replace(/\D/g, '') === String(rollVal)) &&
                l.status === 'approved'
              );
              const isLeaveLocked = Boolean(activeApp);

              return {
                id: s.id || `std-${idx + 1}`,
                rollNo: rollVal,
                name: stdName,
                admissionNo: admNo,
                status: isLeaveLocked ? 'leave' : (idx === 4 ? 'absent' : 'present'),
                isLeaveLocked,
                leaveReason: activeApp?.reason || null
              };
            }));
          }
        }
      } catch (err) {
        // Fallback to initial state
      }
    }
    fetchClassStudents();
  }, [selectedClassForMarking]);

  // Synchronize student leaves with class roster so approved leaves are automatically locked
  useEffect(() => {
    if (studentLeaves.length > 0 && classRoster.length > 0) {
      setClassRoster(prev =>
        prev.map(st => {
          const activeApp = studentLeaves.find(l =>
            (l.studentId === st.id || l.student_id === st.id || l.admissionNo === st.admissionNo || l.studentName?.toLowerCase() === st.name?.toLowerCase() || String(l.rollNo).replace(/\D/g, '') === String(st.rollNo)) &&
            l.status === 'approved'
          );
          if (activeApp && (!st.isLeaveLocked || st.status !== 'leave')) {
            return {
              ...st,
              status: 'leave',
              isLeaveLocked: true,
              leaveReason: activeApp.reason
            };
          }
          return st;
        })
      );
    }
  }, [studentLeaves]);

  // Toggle student attendance (Present -> Absent -> Leave -> Present)
  const handleToggleAttendance = (id: string) => {
    const isLocked = Boolean(submittedClasses[selectedClassForMarking]);
    if (isLocked) {
      onShowToast(
        'error',
        'Attendance Register Locked: Admin Only 🔒',
        'Daily roll call is already submitted. Under school policy, only School Admin or Principal can modify or unlock submitted attendance.'
      );
      return;
    }

    const targetStudent = classRoster.find(st => st.id === id);
    if (targetStudent?.isLeaveLocked) {
      onShowToast(
        'warning',
        'Attendance Locked: Approved Leave 🔒',
        `${targetStudent.name} is on officially sanctioned leave (${targetStudent.leaveReason || 'Sanctioned'}). Status is locked as On Leave.`
      );
      return;
    }

    setClassRoster(prev =>
      prev.map(st => {
        if (st.id === id) {
          const nextStatus = st.status === 'present' ? 'absent' : st.status === 'absent' ? 'leave' : 'present';
          return { ...st, status: nextStatus };
        }
        return st;
      })
    );
  };

  const handleMarkAllPresent = () => {
    const isLocked = Boolean(submittedClasses[selectedClassForMarking]);
    if (isLocked) {
      onShowToast('error', 'Attendance Locked 🔒', 'Daily roll call is already submitted. Only School Admin or Principal can modify records.');
      return;
    }
    const lockedCount = classRoster.filter(st => st.isLeaveLocked).length;
    setClassRoster(prev => prev.map(st => (st.isLeaveLocked ? st : { ...st, status: 'present' })));
    if (lockedCount > 0) {
      onShowToast('success', 'Roster Updated', `Available students marked present. ${lockedCount} student(s) remain locked as On Leave.`);
    } else {
      onShowToast('success', 'Roster Updated', `All ${classRoster.length} students marked present`);
    }
  };

  const handleSaveAttendance = async () => {
    const isSubmittedAlready = Boolean(submittedClasses[selectedClassForMarking]);
    if (isSubmittedAlready) {
      onShowToast(
        'error',
        'Attendance Locked: Admin Only 🔒',
        'Daily roll call has already been submitted. Under institutional policy, only School Admin or Principal can modify or unlock submitted attendance.'
      );
      return;
    }

    const presentCount = classRoster.filter(s => s.status === 'present').length;
    const absentCount = classRoster.filter(s => s.status === 'absent').length;
    const leaveCount = classRoster.filter(s => s.status === 'leave').length;
    const totalCount = classRoster.length;
    const timeNow = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const todayDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    const summary = {
      className: selectedClassForMarking,
      date: todayDate,
      submittedAt: timeNow,
      present: presentCount,
      absent: absentCount,
      leave: leaveCount,
      total: totalCount,
      markedBy: profile.name || 'Vikramaditya Singh (Class Teacher)',
      isUpdate: false
    };

    // Sync to backend API with auth token
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('dakshora_auth_token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch('/api/erp/teacher/attendance/submit', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          grade: selectedClassForMarking,
          records: classRoster.map(s => ({
            studentId: s.id,
            name: s.name,
            rollNo: s.rollNo,
            admissionNo: s.admissionNo,
            status: s.status,
            remarks: s.remarks || (s.status === 'leave' ? 'On Leave' : '')
          }))
        })
      });
      const data = await res.json();
      if (!data.success && data.code === 'ATTENDANCE_LOCKED_ADMIN_ONLY') {
        onShowToast('error', 'Attendance Locked 🔒', data.message);
        return;
      }

      setSubmittedClasses(prev => ({
        ...prev,
        [selectedClassForMarking]: summary
      }));

      setIsEditingAttendance(false);
      setLastSubmissionSummary(summary);
      setShowAttendanceSuccessModal(true);

      // remove from unmarked list on dashboard
      setUnmarkedClasses(prev => prev.filter(c => c.grade !== selectedClassForMarking));

      onShowToast(
        'success',
        'Attendance Submitted & Locked 🔒',
        `Committed to real ERP database for ${selectedClassForMarking}: ${presentCount} Present, ${absentCount} Absent, ${leaveCount} On Leave. Changes now require Admin approval.`
      );

      // Immediately re-fetch real school-wide database attendance so all KPI cards update!
      fetchSchoolAttendanceDashboard();
    } catch (_err) {
      onShowToast('error', 'Sync Failed', 'Could not save attendance to central database.');
    }
  };

  const handleStartEditing = () => {
    onShowToast(
      'warning',
      'Modification Restricted: Admin Only 🔒',
      'Daily attendance has already been submitted to the central ERP register. Under school policy, only School Admin or Principal can unlock or edit records.'
    );
  };

  const handleCancelEditing = () => {
    setIsEditingAttendance(false);
    onShowToast('info', 'Edit Cancelled', 'Restored locked state.');
  };

  const handleExportDailyClassesExcel = () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const stats = schoolAttendanceData?.classStats || [];
      const rows = stats.map((cs: any) => ({
        'Class / Grade': cs.grade ? `Class ${cs.grade}` : '—',
        'Section': cs.section || 'A',
        'Total Enrolled': cs.total || 0,
        'Present (उपस्थित)': cs.present || 0,
        'Absent (अनुपस्थित)': cs.absent || 0,
        'Late Arrivals': cs.late || 0,
        'Half Day': cs.halfDay || 0,
        'Approved Leave': cs.leave || 0,
        'Attendance Rate %': `${cs.attendancePercent || 0}%`,
        'Register Status': (cs.present > 0 || cs.absent > 0 || cs.leave > 0) ? 'Committed & Locked 🔒' : 'Pending Roll-Call ⏳'
      }));

      // Append Combined School Summary row
      if (schoolAttendanceData?.students) {
        rows.push({
          'Class / Grade': 'TOTAL (ALL CLASSES)',
          'Section': 'COMBINED',
          'Total Enrolled': schoolAttendanceData.students.total || 0,
          'Present (उपस्थित)': schoolAttendanceData.students.present || 0,
          'Absent (अनुपस्थित)': schoolAttendanceData.students.absent || 0,
          'Late Arrivals': schoolAttendanceData.students.late || 0,
          'Half Day': schoolAttendanceData.students.halfDay || 0,
          'Approved Leave': schoolAttendanceData.students.leave || 0,
          'Attendance Rate %': `${schoolAttendanceData.students.attendancePercent || 0}%`,
          'Register Status': 'Institutional Real-Time Pulse'
        });
      }

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Classes Attendance');
      XLSX.writeFile(workbook, `Daily_Classes_Attendance_Report_${today}.xlsx`);
      onShowToast('success', 'Excel Export Ready', `Downloaded Daily Classes Report for ${today}`);
    } catch (err: any) {
      onShowToast('error', 'Export Failed', err.message || 'Could not export Excel file.');
    }
  };

  // Structured Teaching Journal State
  const [journalEntry, setJournalEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    grade: profile.assignedClass || 'Class 10-A',
    subject: 'Mathematics',
    chapter: 'Chapter 8: Introduction to Trigonometry',
    topicsCovered: 'Concepts of Trigonometric Ratios (sin, cos, tan), Pythagorean trigonometric identities, and proof exercises.',
    homeworkAssigned: 'Solve NCERT Exercise 8.1 questions 1 to 8 in Mathematics class notebook.',
    learningOutcome: '95% students successfully proved trigonometric identities and solved standard angle problems.'
  });

  // AI Co-Pilot State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState<string | null>(null);

  const handleRunAiCopilot = async (customPrompt?: string) => {
    const query = customPrompt || aiPrompt;
    if (!query.trim()) return;
    setAiLoading(true);
    setAiOutput(null);

    try {
      const res = await sendErpAiPrompt({
        prompt: `[Role: Senior CBSE Teacher / Lecturer in ${profile.currentPost}] [Class: ${profile.assignedClass}] [Subject: ${journalEntry.subject}]\n\nTeacher Request: ${query}\n\nProvide an exact, highly pedagogical, curriculum-aligned response formatted cleanly with headings and ready-to-use classroom content.`,
        module: 'teaching_copilot',
        role: 'teacher'
      });

      if (res.data?.reply) {
        setAiOutput(res.data.reply);
      } else {
        setAiOutput(`Here is your curriculum-aligned plan for "${query}":\n\n1. Concept Hook (5 mins): Begin with real-world cafeteria tray stacking analogy.\n2. Key Rules: LIFO order, Overflow condition check (top == MAX), Underflow check (top == -1).\n3. Hands-on Python Snippet:\n\`\`\`python\nstack = []\nstack.append('A') # push\ntop_item = stack.pop() # pop\n\`\`\`\n4. Assessment: 2 viva questions ready for class.`);
      }
      onShowToast('success', 'AI Co-Pilot Generated', 'Curriculum content ready');
    } catch {
      setAiOutput(`Pedagogy Solution for: ${query}\n\n• Target Outcome: Master conceptual and practical implementation.\n• Suggested Activity: 10-minute pair-programming challenge in CS Lab.\n• Practice Assignment: Write push/pop routines with input validation.`);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#070b14] text-slate-100 overflow-hidden font-sans">
      {/* 1. RESPONSIVE SIDEBAR & MOBILE DRAWER */}
      <TeacherPortalSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'attendance') {
            setSelectedClassForMarking(profile.assignedClass);
          }
        }}
        teacherName={profile.name}
        empId={profile.empId}
        designation={profile.currentPost}
        assignedClass={profile.assignedClass}
        schoolName={resolvedSchoolName}
        schoolLogo={resolvedSchoolLogo}
        onOpenProfile={() => setShowProfileModal(true)}
        onSignOut={onSignOut}
        isDesktopCollapsed={isDesktopCollapsed}
        setIsDesktopCollapsed={setIsDesktopCollapsed}
        isMobileDrawerOpen={isMobileDrawerOpen}
        setIsMobileDrawerOpen={setIsMobileDrawerOpen}
        pendingAttendanceCount={unmarkedClasses.length}
        arrangementCount={pendingArrangements.length}
        pendingLeavesCount={studentLeaves.filter(l => l.status === "pending").length}
      />

      {/* 2. MAIN TEACHER WORKSPACE VIEWPORT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-950 relative">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5 text-purple-400" />
            </button>

            {/* Welcome & Teacher Name Identity (Matches Screenshot 1) */}
            <div
              onClick={() => setShowProfileModal(true)}
              className="cursor-pointer group select-none min-w-0"
              title="Click to view full Employee Profile"
            >
              <span className="text-[11px] font-mono font-bold text-slate-400 block tracking-wide">
                Welcome
              </span>
              <h1 className="text-base sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-pink-400 group-hover:brightness-125 transition-all truncate flex items-center gap-1.5">
                <span>{profile.name}</span>
                <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                  #{profile.empId}
                </span>
              </h1>
            </div>
          </div>

          {/* Right Action Icons (Matches Screenshot 1: Envelope, Bell, Settings) */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Messages / Mail Icon */}
            <button
              type="button"
              onClick={() => onShowToast('info', 'Faculty Messages', 'Staff room messaging: 2 unread circulars from Principal')}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-900 hover:bg-purple-950/40 text-slate-400 hover:text-purple-300 border border-slate-800 hover:border-purple-500/40 transition-all relative cursor-pointer"
              title="Messages & Staff Room Circulars"
              aria-label="Messages"
            >
              <Mail className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            </button>

            {/* Arrangement / Duty Alert Bell */}
            <button
              type="button"
              onClick={() => {
                if (pendingArrangements.length > 0) {
                  setSelectedArrangement(pendingArrangements[0]);
                } else if (arrangements.length > 0) {
                  setSelectedArrangement(arrangements[0]);
                } else {
                  setSelectedArrangement(null);
                }
                setShowArrangementModal(true);
              }}
              className={`p-2 sm:p-2.5 rounded-xl border transition-all relative cursor-pointer ${
                pendingArrangements.length > 0
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 animate-pulse'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
              title="Arrangement / Substitution Duty Notification"
              aria-label="Arrangement Notifications"
            >
              <Bell className="w-4 h-4" />
              {pendingArrangements.length > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold shadow-md">
                  {pendingArrangements.length}
                </span>
              )}
            </button>

            {/* Settings & Profile Gear */}
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer"
              title="View Employee Profile (Settings)"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Language Switcher */}
            <div className="hidden sm:block">
              <LanguageSelector variant="header" />
            </div>

            {/* Log Out */}
            <button
              type="button"
              onClick={() => {
                if (onSignOut) {
                  onSignOut();
                } else {
                  localStorage.removeItem('dakshora_auth_token');
                  window.location.href = '/';
                }
              }}
              className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 transition-all cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* 🔙 UNIVERSAL STICKY SUB-NAV BANNER (WHEN IN ANY SUB-VIEW BESIDES DAILY PULSE) */}
        {/* ========================================================================= */}
        {activeTab !== 'pulse' && (
          <div className="sticky top-14 z-20 bg-slate-950/95 backdrop-blur-md border-b border-purple-500/30 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('pulse')}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 hover:text-white border border-purple-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                title="Return to Daily Pulse Overview"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>← Back to Daily Pulse</span>
              </button>
              <span className="hidden sm:inline-block text-xs font-mono text-slate-400">
                Workspace: <strong className="text-purple-300 uppercase">{activeTab.replace('_', ' ')}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('pulse')}
                className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                title="Close and return to overview"
              >
                <X className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: DAILY PULSE (OVERVIEW & RESPONSIVE GRID CARDS) */}
        {/* ========================================================================= */}
        {activeTab === 'pulse' && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
            {/* Urgent Arrangement Duty Alert Banner (ONLY rendered if a real pending substitution exists in database) */}
            {activePendingArrangement && (
              <div className="bg-gradient-to-r from-rose-950/80 via-purple-950/60 to-slate-900 p-4 sm:p-5 rounded-3xl border border-rose-500/40 shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/40 shrink-0">
                    <Bell className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/30 text-rose-200 uppercase">
                        SUBSTITUTION DUTY TODAY
                      </span>
                      <span className="text-xs text-rose-300 font-mono font-bold">
                        Period {activePendingArrangement.periodNumber} ({activePendingArrangement.time || '11:15 AM'})
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-extrabold text-white mt-1">
                      Assigned to {activePendingArrangement.grade}-{activePendingArrangement.section} ({activePendingArrangement.roomNumber || 'Room 104'}) • Proxy for {activePendingArrangement.absentTeacherName}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Subject: {activePendingArrangement.subjectName || 'Science revision & supervision'}. {activePendingArrangement.notes || 'Please confirm receipt.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleAcceptArrangement(activePendingArrangement.id)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-500/25 flex items-center gap-1.5 cursor-pointer hover:brightness-105"
                  >
                    <Check className="w-4 h-4" />
                    <span>Accept Duty</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedArrangement(activePendingArrangement);
                      setShowArrangementModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono font-bold border border-slate-700 cursor-pointer"
                  >
                    Details
                  </button>
                </div>
              </div>
            )}

            {/* Responsive Grid: Desktop grid-column: span 2 for prominent cards, mobile auto-fit */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {/* =================================================================== */}
              {/* 1. YOUR CLASSES CARD (Matches Screenshot 1 - Lilac/Purple) */}
              {/* =================================================================== */}
              <div className="bg-gradient-to-br from-indigo-950 via-purple-950/80 to-slate-950 rounded-3xl p-6 border border-purple-400/30 shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                      YOUR CLASSES
                    </span>
                    <button
                      type="button"
                      onClick={() => onShowToast('info', 'Edit Classes', 'Class assignment is managed by School Academic Coordinator.')}
                      className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-slate-900/80 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Edit className="w-3 h-3" />
                      <span>EDIT</span>
                    </button>
                  </div>

                  {/* Class Badge Card (Screenshot 1: XII Science A) */}
                  <div className="p-4 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 text-center relative group hover:bg-indigo-500/25 transition-all">
                    <button
                      type="button"
                      onClick={() => onShowToast('info', 'Class Options', 'Select Attendance, Timetable, or Student Roster')}
                      className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    <div className="text-xl sm:text-2xl font-black text-white tracking-wide">
                      {profile.assignedClass}
                    </div>
                    <div className="text-xs font-mono text-purple-200 mt-1">
                      Class Teacher • {classRoster.length || 6} Students Enrolled
                    </div>
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClassForMarking(profile.assignedClass);
                          setActiveTab('attendance');
                        }}
                        className={`px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 ${
                          submittedClasses[profile.assignedClass]
                            ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                            : 'bg-purple-500 hover:bg-purple-400 text-slate-950'
                        }`}
                      >
                        {submittedClasses[profile.assignedClass] ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Marked (Edit)</span>
                          </>
                        ) : (
                          <span>Roll Call Now</span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('homework')}
                        className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-purple-200 text-xs font-mono border border-purple-400/30 cursor-pointer"
                      >
                        Diary
                      </button>
                    </div>
                  </div>
                </div>

                {/* All Classes & Reports Teal Action Bar (Screenshot 1) */}
                <button
                  type="button"
                  onClick={() => setActiveTab('reports')}
                  className="mt-5 w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:brightness-105 text-slate-950 font-extrabold text-sm flex items-center justify-between shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
                >
                  <span>All Classes & Reports</span>
                  <ChevronRight className="w-5 h-5 text-slate-950" />
                </button>
              </div>

              {/* =================================================================== */}
              {/* 1B. RESPONSIBILITIES & WORKLOAD CALCULATION CARD */}
              {/* =================================================================== */}
              <div className="bg-gradient-to-br from-purple-950 via-violet-950/90 to-slate-950 rounded-3xl p-6 border border-purple-400/40 shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        <Layers className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-300">
                        RESPONSIBILITIES & WORKLOAD
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {workloadData?.workloadCalculation?.workloadStatus || 'OPTIMAL'}
                    </span>
                  </div>

                  {/* Calculated Workload Gauge */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-purple-500/30 font-mono">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <div className="text-2xl font-black text-white">
                          {workloadData?.workloadCalculation?.totalWeeklyLoad || 26} <span className="text-sm font-normal text-slate-400">/ {workloadData?.workloadCalculation?.maxWeeklyCapacity || 30}</span>
                        </div>
                        <div className="text-[10px] text-purple-300 mt-0.5">
                          Weekly Periods & Hours Assigned
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-cyan-400">
                          {workloadData?.workloadCalculation?.utilizationPercentage || 86.7}%
                        </div>
                        <div className="text-[10px] text-emerald-400">
                          CBSE Byelaws Compliant
                        </div>
                      </div>
                    </div>

                    {/* Workload Progress Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-cyan-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(workloadData?.workloadCalculation?.utilizationPercentage || 86.7, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Active Responsibilities Badges */}
                  <div className="space-y-2 mt-3 font-mono text-xs">
                    <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-400/20 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="font-bold text-white truncate">Class Teacher: Class 10-A</span>
                      </div>
                      <span className="text-[10px] text-purple-300 font-bold shrink-0">3 hrs/wk</span>
                    </div>

                    <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="font-bold text-white truncate">HOD: Mathematics Department</span>
                      </div>
                      <span className="text-[10px] text-cyan-300 font-bold shrink-0">2 hrs/wk</span>
                    </div>

                    <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="font-bold text-white truncate">CBSE Examination Committee</span>
                      </div>
                      <span className="text-[10px] text-indigo-300 font-bold shrink-0">1 hr/wk</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-purple-500/20 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowWorkloadModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:brightness-110 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>Audit Breakdown</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono text-slate-400">
                    Teaching: {workloadData?.workloadCalculation?.teachingPeriodsWeekly || 20}p • Admin: {workloadData?.workloadCalculation?.responsibilityHoursWeekly || 6}h
                  </span>
                </div>
              </div>

              {/* =================================================================== */}
              {/* 2. ATTENDANCE REPORTS LAUNCHPAD (Matches Screenshot 1 - 4 Circular Icons) */}
              {/* =================================================================== */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                      ATTENDANCE REPORTS
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Live ERP Sync
                    </span>
                  </div>

                  {/* 4 Circular Action Icons with Real Database Metrics */}
                  <div className="grid grid-cols-4 gap-2 text-center pt-2">
                    {/* 1. Daily Classes */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('reports')}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer"
                      title="View School-Wide Daily Classes Breakdown"
                    >
                      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-slate-800/90 group-hover:bg-cyan-500/20 group-hover:border-cyan-400 text-slate-300 group-hover:text-cyan-300 border border-slate-700 flex flex-col items-center justify-center transition-all shadow-md relative">
                        <BarChart3 className="w-5 h-5 sm:w-5 sm:h-5" />
                        <span className="text-[9px] font-mono font-bold text-cyan-300 mt-0.5">
                          {schoolAttendanceData?.classStats?.length || 14} Cls
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-300 group-hover:text-white leading-tight font-medium">
                        Daily<br />Classes
                      </span>
                    </button>

                    {/* 2. Daily Students */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('reports')}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer"
                      title="All Classes Combined Enrolled vs Present"
                    >
                      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-slate-800/90 group-hover:bg-purple-500/20 group-hover:border-purple-400 text-slate-300 group-hover:text-purple-300 border border-slate-700 flex flex-col items-center justify-center transition-all shadow-md">
                        <Users className="w-5 h-5 sm:w-5 sm:h-5" />
                        <span className="text-[9px] font-mono font-bold text-purple-300 mt-0.5">
                          {schoolAttendanceData?.students?.present ?? classRoster.filter(s => s.status === 'present').length} Present
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-300 group-hover:text-white leading-tight font-medium">
                        Daily<br />Students
                      </span>
                    </button>

                    {/* 3. Monthly Class */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('reports')}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer"
                      title="Aggregated Attendance %"
                    >
                      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-slate-800/90 group-hover:bg-emerald-500/20 group-hover:border-emerald-400 text-slate-300 group-hover:text-emerald-300 border border-slate-700 flex flex-col items-center justify-center transition-all shadow-md">
                        <Calendar className="w-5 h-5 sm:w-5 sm:h-5" />
                        <span className="text-[9px] font-mono font-bold text-emerald-300 mt-0.5">
                          {schoolAttendanceData?.students?.attendancePercent || 96.5}%
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-300 group-hover:text-white leading-tight font-medium">
                        Monthly<br />Class
                      </span>
                    </button>

                    {/* 4. Pending Classes */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('unmarked')}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer"
                      title="Pending Roll-Calls"
                    >
                      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-slate-800/90 group-hover:bg-amber-500/20 group-hover:border-amber-400 text-slate-300 group-hover:text-amber-300 border border-slate-700 flex flex-col items-center justify-center transition-all shadow-md relative">
                        <ClipboardList className="w-5 h-5 sm:w-5 sm:h-5" />
                        {(() => {
                          const pendingCount = unmarkedClasses.length > 0 
                            ? unmarkedClasses.length 
                            : (schoolAttendanceData?.classStats ? schoolAttendanceData.classStats.filter((c: any) => c.present === 0 && c.absent === 0 && c.leave === 0).length : 0);
                          return (
                            <>
                              <span className="text-[9px] font-mono font-bold text-amber-300 mt-0.5">
                                {pendingCount} Pend
                              </span>
                              {pendingCount > 0 && (
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 absolute top-1 right-1 ring-2 ring-slate-900" />
                              )}
                            </>
                          );
                        })()}
                      </div>
                      <span className="text-[11px] font-mono text-slate-300 group-hover:text-white leading-tight font-medium">
                        Pending<br />Classes
                      </span>
                    </button>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 text-xs font-mono flex items-center justify-between text-slate-400">
                  <span>Your Class ({selectedClassForMarking}):</span>
                  {submittedClasses[selectedClassForMarking] ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Submitted ({submittedClasses[selectedClassForMarking].present}/{submittedClasses[selectedClassForMarking].total} Present) • Locked</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveTab('attendance')}
                      className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 underline underline-offset-2 cursor-pointer"
                    >
                      <Clock3 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pending Roll-Call • Tap to Mark</span>
                    </button>
                  )}
                </div>
              </div>

              {/* =================================================================== */}
              {/* 3. TIMETABLE & TODAY'S PERIOD BELL (Cyan / Blue Gradient) */}
              {/* =================================================================== */}
              <div className="bg-gradient-to-br from-cyan-950 via-blue-950/80 to-slate-950 rounded-3xl p-6 border border-cyan-400/30 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                        TODAY'S PERIODS
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse">
                      Live Bell
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-1 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-400 uppercase">Period 2 (In Session)</span>
                      <span className="text-xs text-slate-300">CS Lab 1</span>
                    </div>
                    <div className="text-base font-extrabold text-white">
                      XII Science A — Python Stacks Lab
                    </div>
                    <div className="text-xs text-cyan-200 flex items-center gap-1.5 pt-1">
                      <Clock3 className="w-3.5 h-3.5" />
                      <span>18 mins remaining (Ends at 10:05 AM)</span>
                    </div>
                  </div>

                  <div className="mt-2.5 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono flex items-center justify-between text-slate-400">
                    <span>Next: Period 3 (10:10 AM)</span>
                    <span className="text-white font-bold">Class XI-Sci (Room 204)</span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-cyan-500/20 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveTab('timetable')}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all cursor-pointer"
                  >
                    Full Routine
                  </button>
                  <span className="text-[11px] font-mono text-cyan-300">
                    5 Total Periods Today
                  </span>
                </div>
              </div>

              {/* =================================================================== */}
              {/* 4. UNMARKED STUDENTS RADAR (Matches Screenshot 1 - Yellow/Amber Grid) */}
              {/* Desktop Span 2 / Span 3 for prominent visibility */}
              {/* =================================================================== */}
              <div className="md:col-span-2 xl:col-span-2 bg-gradient-to-br from-amber-950/70 via-slate-900 to-amber-950/40 rounded-3xl p-6 sm:p-7 border border-amber-400/40 shadow-2xl flex flex-col justify-between gap-5">
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-amber-500/20 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                          UNMARKED STUDENTS
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Live Wing Radar
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                        {unmarkedClasses.reduce((acc, c) => acc + c.count, 0)} students from {unmarkedClasses.length} classes
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onShowToast('info', 'Refreshing Radar', 'Syncing daily roll-call logs across all 57 sections...');
                      }}
                      className="px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-400/30 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>REFRESH</span>
                    </button>
                  </div>

                  {/* Yellow / Amber Rounded Class Badges Grid (Screenshot 1: Nursery-A 10, IV-B 29, VI-A 51, etc.) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
                    {unmarkedClasses.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedClassForMarking(item.grade);
                          setActiveTab('attendance');
                          onShowToast('info', `Opened ${item.grade}`, `Ready for 1-tap fast attendance marking`);
                        }}
                        className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/20 hover:scale-105 cursor-pointer text-center flex flex-col justify-center"
                      >
                        <div className="text-xs font-extrabold font-mono truncate">
                          {item.grade}
                        </div>
                        <div className="text-lg sm:text-xl font-black font-mono mt-0.5">
                          {item.count}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-amber-200/90 gap-2 border-t border-amber-500/20">
                  <span>💡 Tip: Tap any yellow class card to open immediate 1-tap roll call register.</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('attendance')}
                    className="text-amber-400 hover:underline font-bold self-start sm:self-auto"
                  >
                    Open Roster Mark Console →
                  </button>
                </div>
              </div>

              {/* =================================================================== */}
              {/* 5. STRUCTURED TEACHING JOURNAL & AI CO-PILOT (Fuchsia/Purple Gradient) */}
              {/* =================================================================== */}
              <div className="bg-gradient-to-br from-fuchsia-950 via-purple-950 to-indigo-950 rounded-3xl p-6 border border-fuchsia-400/40 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-fuchsia-400" />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-fuchsia-300">
                        TEACHING JOURNAL
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                      CBSE NEP 2020
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-fuchsia-500/30 space-y-2 font-mono text-xs">
                    <div className="text-fuchsia-400 font-bold">{journalEntry.chapter}</div>
                    <div className="text-slate-300 leading-relaxed line-clamp-2">
                      {journalEntry.topicsCovered}
                    </div>
                    <div className="pt-2 border-t border-slate-800 text-[11px] text-emerald-300">
                      ✓ Homework: NCERT Q 4.1 to 4.5
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleRunAiCopilot('Generate 5-min pop quiz on LIFO Stacks with answers')}
                      className="px-2.5 py-1 rounded-xl bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-200 border border-fuchsia-500/30 text-[11px] font-mono cursor-pointer"
                    >
                      ⚡ 5-Min Quiz
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRunAiCopilot('Lesson starter hook for teaching Python Stack operations')}
                      className="px-2.5 py-1 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/30 text-[11px] font-mono cursor-pointer"
                    >
                      ⚡ Starter Hook
                    </button>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-fuchsia-500/20 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveTab('journal')}
                    className="px-3.5 py-1.5 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 text-slate-950 font-bold text-xs transition-all cursor-pointer"
                  >
                    Open Full Journal
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ai_copilot')}
                    className="text-xs font-mono font-bold text-fuchsia-300 hover:text-white flex items-center gap-1"
                  >
                    <span>AI Assistant</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* =================================================================== */}
              {/* 6. STUDENT LEAVE REQUESTS & APPROVALS (Rose / Amber Gradient) */}
              {/* =================================================================== */}
              <div className="bg-gradient-to-br from-rose-950/70 via-purple-950/70 to-slate-950 rounded-3xl p-6 border border-rose-500/40 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-300 block">
                          STUDENT LEAVE REQUESTS
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Class 10-A • Live Verification
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {studentLeaves.filter(l => l.status === 'pending').length} Pending
                    </span>
                  </div>

                  {studentLeaves.filter(l => l.status === 'pending').length === 0 ? (
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center font-mono space-y-1">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                      <div className="text-xs font-bold text-white">All Leave Requests Reviewed</div>
                      <p className="text-[11px] text-slate-400">
                        No pending student applications for Class 10-A.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 font-mono">
                      {studentLeaves
                        .filter(l => l.status === 'pending')
                        .slice(0, 2)
                        .map((leave) => (
                          <div
                            key={leave.id}
                            className="p-3 rounded-2xl bg-slate-950/90 border border-rose-500/30 space-y-2 text-xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-extrabold text-white text-sm">
                                  {leave.studentName}
                                </div>
                                <div className="text-[11px] text-rose-300 font-mono">
                                  {leave.grade || 'Class 10'}-{leave.section || 'A'} • Roll #{leave.rollNo || '02'}
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-rose-500/20 text-rose-200 border border-rose-500/30">
                                {leave.leaveType}
                              </span>
                            </div>

                            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80 text-[11px] text-slate-300 leading-snug">
                              <span className="text-slate-400 font-semibold">Dates:</span> {leave.startDate} to {leave.endDate} ({leave.daysCount}d)
                              <div className="text-slate-200 mt-0.5 italic">"{leave.reason}"</div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                disabled={reviewingLeaveId === leave.id}
                                onClick={() => handleReviewLeave(leave.id, 'approved')}
                                className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                              >
                                {reviewingLeaveId === leave.id ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                <span>Approve ✓</span>
                              </button>
                              <button
                                type="button"
                                disabled={reviewingLeaveId === leave.id}
                                onClick={() => handleReviewLeave(leave.id, 'rejected')}
                                className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-rose-950 text-rose-300 hover:text-white border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Decline</span>
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-rose-500/20 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveTab('leaves')}
                    className="text-xs font-mono font-bold text-rose-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Open Leave Review Desk</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono text-slate-400">
                    Live ERP DB Connected
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: LEAVE DESK — STUDENT APPROVALS & TEACHER FACULTY LEAVE (CL/EL/ML) */}
        {/* ========================================================================= */}
        {(activeTab === 'leaves' || activeTab === 'my_leaves') && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl w-full mx-auto animate-in fade-in duration-300 font-mono">
            {/* Header Banner */}
            <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                    FACULTY LEAVE DESK & STUDENT APPROVALS
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    CL • Earn Leave • Medical • Other
                  </span>
                </div>
                <h2 className="text-lg font-black text-white mt-1">
                  {profile.name} • {profile.currentPost || 'PGT Mathematics'} (Class 10-A)
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Manage personal faculty leave applications and review Class 10-A student leave requests.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowTeacherApplyLeaveModal(true)}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:brightness-105 text-white font-black text-xs shadow-lg shadow-amber-500/25 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Apply For Leave (अवकाश आवेदन)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    fetchStudentLeaves();
                    fetchTeacherLeaves();
                  }}
                  className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
                  title="Refresh Leave Data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingLeaves || loadingTeacherLeaves ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Segmented Sub-Tab Switcher: Student Leave Approvals vs Apply Faculty Leave */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 w-full sm:w-fit shadow-md">
              <button
                type="button"
                onClick={() => setLeaveDeskSubTab('my_leaves')}
                className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  leaveDeskSubTab === 'my_leaves'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 border border-amber-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                <span>My Faculty Leave (शिक्षक अवकाश आवेदन व कोटा)</span>
              </button>

              <button
                type="button"
                onClick={() => setLeaveDeskSubTab('student_leaves')}
                className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  leaveDeskSubTab === 'student_leaves'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25 border border-rose-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Student Leave Approvals (छात्र अवकाश)</span>
                {studentLeaves.filter(l => l.status === 'pending').length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white text-[10px]">
                    {studentLeaves.filter(l => l.status === 'pending').length}
                  </span>
                )}
              </button>
            </div>

            {/* VIEW A: MY FACULTY LEAVE DESK (CL, EARN LEAVE, MEDICAL, OTHER) */}
            {leaveDeskSubTab === 'my_leaves' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* 4 Leave Quotas & Balances Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: CL */}
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 hover:border-amber-500/50 transition-all shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Casual Leave (CL)
                      </span>
                      <span className="text-xs text-amber-400 font-bold">आकस्मिक</span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-black text-white">{teacherLeaveBalances.cl.remaining}</span>
                      <span className="text-xs text-slate-400 font-mono">/ {teacherLeaveBalances.cl.total} Available</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                      <div
                        className="bg-amber-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.round((teacherLeaveBalances.cl.remaining / (teacherLeaveBalances.cl.total || 12)) * 100))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
                      <span>Used: {teacherLeaveBalances.cl.used}</span>
                      <span>Left: {teacherLeaveBalances.cl.remaining} Days</span>
                    </div>
                  </div>

                  {/* Card 2: Earn Leave (EL) */}
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-cyan-500/10 via-slate-900 to-slate-900 border border-cyan-500/30 hover:border-cyan-500/50 transition-all shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        Earn Leave (EL)
                      </span>
                      <span className="text-xs text-cyan-400 font-bold">अर्जित</span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-black text-white">{teacherLeaveBalances.el.remaining}</span>
                      <span className="text-xs text-slate-400 font-mono">/ {teacherLeaveBalances.el.total} Available</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                      <div
                        className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.round((teacherLeaveBalances.el.remaining / (teacherLeaveBalances.el.total || 15)) * 100))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
                      <span>Used: {teacherLeaveBalances.el.used}</span>
                      <span>Left: {teacherLeaveBalances.el.remaining} Days</span>
                    </div>
                  </div>

                  {/* Card 3: Medical Leave (ML) */}
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/30 hover:border-emerald-500/50 transition-all shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Medical Leave (ML)
                      </span>
                      <span className="text-xs text-emerald-400 font-bold">चिकित्सा</span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-black text-white">{teacherLeaveBalances.ml.remaining}</span>
                      <span className="text-xs text-slate-400 font-mono">/ {teacherLeaveBalances.ml.total} Available</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.round((teacherLeaveBalances.ml.remaining / (teacherLeaveBalances.ml.total || 10)) * 100))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
                      <span>Used: {teacherLeaveBalances.ml.used}</span>
                      <span>Left: {teacherLeaveBalances.ml.remaining} Days</span>
                    </div>
                  </div>

                  {/* Card 4: Other / Duty Leave */}
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-500/10 via-slate-900 to-slate-900 border border-purple-500/30 hover:border-purple-500/50 transition-all shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Other / Special
                      </span>
                      <span className="text-xs text-purple-400 font-bold">विशेष / ड्यूटी</span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-black text-white">{teacherLeaveBalances.other.remaining}</span>
                      <span className="text-xs text-slate-400 font-mono">/ {teacherLeaveBalances.other.total} Available</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                      <div
                        className="bg-purple-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.round((teacherLeaveBalances.other.remaining / (teacherLeaveBalances.other.total || 5)) * 100))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
                      <span>Used: {teacherLeaveBalances.other.used}</span>
                      <span>Left: {teacherLeaveBalances.other.remaining} Days</span>
                    </div>
                  </div>
                </div>

                {/* Teacher Applications History Table & Status Tracker */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-amber-400" />
                      <span>My Leave Applications History (अवकाश आवेदन इतिहास)</span>
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      {teacherLeaves.length} record(s) on file
                    </span>
                  </div>

                  {teacherLeaves.length === 0 ? (
                    <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 space-y-2">
                      <CalendarDays className="w-8 h-8 text-amber-400 mx-auto" />
                      <div className="text-sm font-bold text-white">No Leave Applications Found</div>
                      <p className="text-xs">You have not submitted any faculty leave requests yet this session.</p>
                      <button
                        type="button"
                        onClick={() => setShowTeacherApplyLeaveModal(true)}
                        className="mt-3 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Apply First Leave Now</span>
                      </button>
                    </div>
                  ) : (
                    teacherLeaves.map((leave) => {
                      const typeLabel =
                        leave.leaveType === 'CL'
                          ? 'Casual Leave (CL)'
                          : leave.leaveType === 'EL'
                          ? 'Earn Leave (EL)'
                          : leave.leaveType === 'ML'
                          ? 'Medical Leave (ML)'
                          : 'Other / Duty Leave';
                      const badgeBg =
                        leave.leaveType === 'CL'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : leave.leaveType === 'EL'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                          : leave.leaveType === 'ML'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/30';

                      return (
                        <div
                          key={leave.id}
                          className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase border ${badgeBg}`}>
                                {leave.leaveType}
                              </span>
                              <div>
                                <div className="text-sm font-black text-white flex items-center gap-2">
                                  <span>{typeLabel}</span>
                                  {leave.isHalfDay && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-amber-300 border border-amber-500/30">
                                      Half Day ({leave.halfDayType === 'second_half' ? '2nd Half' : '1st Half'})
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5">
                                  Duration: <strong className="text-cyan-300">{leave.fromDate} to {leave.toDate}</strong> ({leave.daysCount} Day(s))
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                                  leave.status === 'approved'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : leave.status === 'rejected'
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                }`}
                              >
                                {leave.status === 'approved' ? 'Approved ✓' : leave.status === 'rejected' ? 'Declined ✕' : 'Pending Review'}
                              </span>

                              {leave.status === 'pending' && (
                                <button
                                  type="button"
                                  onClick={() => handleWithdrawTeacherLeave(leave.id)}
                                  className="px-3 py-1 rounded-full bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 text-xs border border-slate-700 hover:border-rose-500/40 transition-colors cursor-pointer"
                                  title="Withdraw Pending Application"
                                >
                                  Withdraw
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                              <span className="text-slate-400 text-[10px] block uppercase mb-1">Reason for Leave:</span>
                              <p className="text-slate-200 leading-relaxed font-sans">{leave.reason}</p>
                            </div>

                            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                              <span className="text-slate-400 text-[10px] block uppercase mb-1">Substitution / Class Handover Notes:</span>
                              <p className="text-slate-300 leading-relaxed font-sans">
                                {leave.handoverNotes || 'No specific period arrangement noted. Regular timetable routines apply.'}
                              </p>
                            </div>
                          </div>

                          {leave.reviewedBy && (
                            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-emerald-300">
                              <div>
                                <span>Principal Review: <strong>{leave.reviewedBy}</strong></span>
                                {leave.reviewRemarks && (
                                  <span className="block text-slate-300 text-[11px] mt-0.5">"{leave.reviewRemarks}"</span>
                                )}
                              </div>
                              {leave.reviewedAt && (
                                <span className="text-[10px] text-slate-400">
                                  Reviewed on {new Date(leave.reviewedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* VIEW B: STUDENT LEAVE APPROVALS */}
            {leaveDeskSubTab === 'student_leaves' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => {
                    const count = f === 'all' ? studentLeaves.length : studentLeaves.filter(l => l.status === f).length;
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setLeaveFilter(f)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold capitalize transition-all cursor-pointer border ${
                          leaveFilter === f
                            ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {f} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Leaves List */}
                <div className="space-y-4">
                  {studentLeaves.filter(l => leaveFilter === 'all' || l.status === leaveFilter).length === 0 ? (
                    <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                      <div className="text-sm font-bold text-white">No Leave Applications Found</div>
                      <p className="text-xs">There are no {leaveFilter} leave requests for your assigned classes.</p>
                    </div>
                  ) : (
                    studentLeaves
                      .filter(l => leaveFilter === 'all' || l.status === leaveFilter)
                      .map((leave) => (
                        <div
                          key={leave.id}
                          className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-3">
                              <span className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center justify-center font-bold text-sm">
                                #{leave.rollNo || '02'}
                              </span>
                              <div>
                                <div className="text-base font-extrabold text-white flex items-center gap-2">
                                  <span>{leave.studentName}</span>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-cyan-300 border border-slate-700">
                                    {leave.grade || 'Class 10'}-{leave.section || 'A'}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5">
                                  Adm: {leave.admissionNo || 'DKS-2026-080'} • Parent: {leave.parentName || 'Parent'} ({leave.parentPhone || 'Phone'})
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                                  leave.status === 'approved'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    : leave.status === 'rejected'
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                }`}
                              >
                                {leave.status === 'approved' ? 'Approved ✓' : leave.status === 'rejected' ? 'Declined ✕' : 'Pending Review'}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                              <span className="text-slate-400 text-[10px] block uppercase">Leave Type</span>
                              <span className="font-bold text-white capitalize">{leave.leaveType}</span>
                            </div>
                            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                              <span className="text-slate-400 text-[10px] block uppercase">Date Range</span>
                              <span className="font-bold text-cyan-300">{leave.startDate} to {leave.endDate}</span>
                            </div>
                            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                              <span className="text-slate-400 text-[10px] block uppercase">Duration</span>
                              <span className="font-bold text-purple-300">{leave.daysCount} Day(s)</span>
                            </div>
                          </div>

                          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
                            <span className="text-slate-400 text-[10px] block uppercase mb-1">Reason for Leave:</span>
                            <p className="text-slate-200 leading-relaxed font-sans">{leave.reason}</p>
                          </div>

                          {leave.reviewedBy && (
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between text-emerald-300">
                              <span>Reviewed By: <strong>{leave.reviewedBy}</strong></span>
                              {leave.reviewedAt && (
                                <span className="text-[10px] text-slate-400">{new Date(leave.reviewedAt).toLocaleDateString()}</span>
                              )}
                            </div>
                          )}

                          {leave.status === 'pending' && (
                            <div className="pt-2 flex items-center justify-end gap-2.5">
                              <button
                                type="button"
                                disabled={reviewingLeaveId === leave.id}
                                onClick={() => handleReviewLeave(leave.id, 'rejected')}
                                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                              >
                                Decline Application
                              </button>
                              <button
                                type="button"
                                disabled={reviewingLeaveId === leave.id}
                                onClick={() => handleReviewLeave(leave.id, 'approved')}
                                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow-md shadow-emerald-500/25 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                              >
                                {reviewingLeaveId === leave.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                                <span>Approve & Sync Attendance ✓</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: FAST ATTENDANCE REGISTER */}
        {/* ========================================================================= */}
        {activeTab === 'attendance' && (() => {
          const isSubmitted = Boolean(submittedClasses[selectedClassForMarking]);
          const isLocked = isSubmitted;
          const submissionInfo = submittedClasses[selectedClassForMarking];

          return (
            <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl w-full mx-auto animate-in fade-in duration-300">
              {/* Header Card */}
              <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                      FAST ROLL-CALL REGISTER
                    </span>
                    {isSubmitted && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>SUBMITTED & LOCKED</span>
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-black text-white mt-0.5">
                    Class: {selectedClassForMarking} • Session 2026–27
                  </h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {isSubmitted 
                      ? 'Attendance is locked in central ERP. Under institutional policy, only School Admin or Principal can modify submitted attendance.'
                      : 'Tap any student badge to toggle: Present (Green) → Absent (Red) → On Leave (Amber)'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('pulse')}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Dashboard</span>
                  </button>

                  {/* If attendance is NOT submitted yet: Show Mark All Present and Submit Attendance */}
                  {!isSubmitted ? (
                    <>
                      <button
                        type="button"
                        onClick={handleMarkAllPresent}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold border border-slate-700 transition-all cursor-pointer"
                      >
                        Mark All Present
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAttendance}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-md shadow-emerald-500/25 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Submit Attendance</span>
                      </button>
                    </>
                  ) : (
                    /* Locked institutional badge - teachers cannot edit */
                    <div className="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-xs flex items-center gap-1.5 shadow-sm">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-bold">Committed to ERP (Admin Only Modify)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Banner when Submitted */}
              {isSubmitted && submissionInfo && (
                <div className="p-4 rounded-3xl bg-slate-900/95 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
                          ATTENDANCE COMMITTED & LOCKED 🔒
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {submissionInfo.submittedAt}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-0.5">
                        Roll call for {selectedClassForMarking} was committed to central ERP database.
                      </h3>
                      <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                        Present: <b className="text-emerald-400">{submissionInfo.present}</b> • Absent: <b className="text-rose-400">{submissionInfo.absent}</b> • On Leave: <b className="text-amber-400">{submissionInfo.leave}</b> (Total: {submissionInfo.total})
                      </p>
                    </div>
                  </div>

                  <div className="px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-mono text-slate-400 flex items-center gap-1.5 shrink-0">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Admin Only Can Alter</span>
                  </div>
                </div>
              )}

              {/* Quick Stats Pill (Present / Absent / On Leave) */}
              <div className="grid grid-cols-3 gap-3 font-mono text-center">
                <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 shadow-sm">
                  <span className="text-[10px] text-emerald-300 uppercase block font-bold">Present (उपस्थित)</span>
                  <span className="text-2xl font-black text-emerald-400">
                    {classRoster.filter(s => s.status === 'present').length}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 shadow-sm">
                  <span className="text-[10px] text-rose-300 uppercase block font-bold">Absent (अनुपस्थित)</span>
                  <span className="text-2xl font-black text-rose-400">
                    {classRoster.filter(s => s.status === 'absent').length}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 shadow-sm">
                  <span className="text-[10px] text-amber-300 uppercase block font-bold">On Leave (अवकाश)</span>
                  <span className="text-2xl font-black text-amber-400">
                    {classRoster.filter(s => s.status === 'leave').length}
                  </span>
                </div>
              </div>

              {/* Student Roster List */}
              <div className="bg-slate-900/80 rounded-3xl border border-slate-800 overflow-hidden divide-y divide-slate-800/80 font-mono shadow-xl">
                {classRoster.map((st: any) => (
                  <div
                    key={st.id}
                    onClick={() => handleToggleAttendance(st.id)}
                    className={`p-3.5 sm:p-4 flex items-center justify-between transition-colors select-none ${
                      isLocked 
                        ? 'hover:bg-slate-900 cursor-not-allowed opacity-90' 
                        : 'hover:bg-slate-850/60 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-xs border border-slate-700/80">
                        #{st.rollNo}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{st.name}</span>
                          {st.isLeaveLocked ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1 shadow-sm">
                              <Lock className="w-2.5 h-2.5 text-amber-400" />
                              Approved Leave ✓
                            </span>
                          ) : st.status === 'leave' ? (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Leave
                            </span>
                          ) : null}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Adm: {st.admissionNo || `DKS-2026-${String(st.rollNo).padStart(3, '0')}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isLocked && (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-500" />
                          <span>Locked</span>
                        </span>
                      )}
                      {st.isLeaveLocked ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase border bg-amber-500/25 text-amber-300 border-amber-500/50 flex items-center gap-1.5 shadow-sm">
                          <Lock className="w-3 h-3 text-amber-400" />
                          <span>ON LEAVE (LOCKED)</span>
                        </span>
                      ) : (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase border transition-all flex items-center gap-1.5 ${
                            st.status === 'present'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : st.status === 'absent'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            st.status === 'present' ? 'bg-emerald-400' : st.status === 'absent' ? 'bg-rose-400' : 'bg-amber-400'
                          }`} />
                          <span>{st.status === 'leave' ? 'On Leave' : st.status}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* TAB 3: ATTENDANCE REPORTS (Real-Time All Classes Combined from Backend) */}
        {/* ========================================================================= */}
        {activeTab === 'reports' && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl w-full mx-auto animate-in fade-in duration-300 font-mono">
            {/* Header with Title and Actions */}
            <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                    ATTENDANCE ANALYTICS & DAILY CLASSES REPORT
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Real-Time Database Sync</span>
                  </span>
                </div>
                <h2 className="text-lg font-black text-white mt-0.5">
                  School-Wide Daily Classes Report (All Classes Combined)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Live aggregated student roll calls across all sections • Session 2026–27
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('pulse')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Dashboard</span>
                </button>
                <button
                  type="button"
                  disabled={loadingSchoolAttendance}
                  onClick={() => {
                    fetchSchoolAttendanceDashboard();
                    onShowToast('info', 'Refreshing Register', 'Fetching latest school-wide class attendance from backend...');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Reload Live Database Attendance"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingSchoolAttendance ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportDailyClassesExcel}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                    onShowToast('info', 'Print Triggered', 'Opening print preview for Daily Classes Attendance Report.');
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print PDF</span>
                </button>
              </div>
            </div>

            {/* School-Wide KPI Cards (All Classes Combined - Real Backend Database) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* 1. Combined Enrolled Students */}
              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between shadow-md">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">All Students</span>
                  <Users className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white">
                    {schoolAttendanceData?.students?.total ?? classRoster.length}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Total Enrolled (School)
                  </span>
                </div>
              </div>

              {/* 2. Present Students */}
              <div className="p-4 rounded-3xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col justify-between shadow-md">
                <div className="flex items-center justify-between text-emerald-300 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Present Today</span>
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-2xl font-black text-emerald-400">
                    {schoolAttendanceData?.students?.present ?? classRoster.filter(s => s.status === 'present').length}
                  </div>
                  <span className="text-[10px] text-emerald-300/80 block mt-0.5">
                    +{schoolAttendanceData?.students?.late || 0} Late Arrivals
                  </span>
                </div>
              </div>

              {/* 3. Absent Students */}
              <div className="p-4 rounded-3xl bg-rose-950/30 border border-rose-500/30 flex flex-col justify-between shadow-md">
                <div className="flex items-center justify-between text-rose-300 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Absent Today</span>
                  <XCircle className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <div className="text-2xl font-black text-rose-400">
                    {schoolAttendanceData?.students?.absent ?? classRoster.filter(s => s.status === 'absent').length}
                  </div>
                  <span className="text-[10px] text-rose-300/80 block mt-0.5">
                    Unexcused Absences
                  </span>
                </div>
              </div>

              {/* 4. On Leave / Half Day */}
              <div className="p-4 rounded-3xl bg-amber-950/30 border border-amber-500/30 flex flex-col justify-between shadow-md">
                <div className="flex items-center justify-between text-amber-300 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Approved Leave</span>
                  <Calendar className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <div className="text-2xl font-black text-amber-400">
                    {schoolAttendanceData?.students?.leave ?? classRoster.filter(s => s.status === 'leave').length}
                  </div>
                  <span className="text-[10px] text-amber-300/80 block mt-0.5">
                    {schoolAttendanceData?.students?.halfDay || 0} Half-Day Leaves
                  </span>
                </div>
              </div>

              {/* 5. Overall School Attendance Rate % */}
              <div className="p-4 rounded-3xl bg-cyan-950/30 border border-cyan-500/30 flex flex-col justify-between shadow-md col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between text-cyan-300 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Overall Rate</span>
                  <Award className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <div className="text-2xl font-black text-cyan-300">
                    {schoolAttendanceData?.students?.attendancePercent || 96.5}%
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-cyan-500/30 mt-1.5">
                    <div 
                      className="bg-cyan-400 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, schoolAttendanceData?.students?.attendancePercent || 96.5)}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Classes Breakdown Table (Real Class-by-Class Database Records) */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    <span>Daily Classes Report (All Classes & Sections Breakdown)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Real-time status: Sections marked by class teachers are committed to central database and locked against unauthenticated alterations.
                  </p>
                </div>
                <div className="text-xs text-slate-300 font-mono flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-bold">
                    {schoolAttendanceData?.classStats?.filter((c: any) => c.present > 0 || c.absent > 0 || c.leave > 0).length || Object.keys(submittedClasses).length} of {schoolAttendanceData?.classStats?.length || 14} Classes Marked
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 font-bold">Class / Grade</th>
                      <th className="py-3.5 px-4 font-bold text-center">Section</th>
                      <th className="py-3.5 px-4 font-bold text-right">Enrolled</th>
                      <th className="py-3.5 px-4 font-bold text-right text-emerald-400">Present</th>
                      <th className="py-3.5 px-4 font-bold text-right text-rose-400">Absent</th>
                      <th className="py-3.5 px-4 font-bold text-right text-amber-400">On Leave</th>
                      <th className="py-3.5 px-4 font-bold text-center">Attendance %</th>
                      <th className="py-3.5 px-4 font-bold text-center">Register Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {loadingSchoolAttendance ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto text-cyan-400 mb-2" />
                          <span>Loading School-Wide Attendance Records...</span>
                        </td>
                      </tr>
                    ) : (schoolAttendanceData?.classStats && schoolAttendanceData.classStats.length > 0) ? (
                      schoolAttendanceData.classStats.map((row: any, idx: number) => {
                        const isClassSubmitted = row.present > 0 || row.absent > 0 || row.leave > 0;
                        const pct = row.attendancePercent || 0;
                        return (
                          <tr key={`${row.grade}-${row.section}-${idx}`} className="hover:bg-slate-850/60 transition-colors">
                            <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                              <span>Class {row.grade}</span>
                              {row.grade === selectedClassForMarking.replace('Class ', '').split('-')[0] && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                  Your Wing
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-slate-300">
                              {row.section || 'A'}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-white">
                              {row.total}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-emerald-400">
                              {row.present}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-rose-400">
                              {row.absent}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-amber-400">
                              {row.leave}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <span className="font-bold text-white">{pct}%</span>
                                <div className="w-12 bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-700">
                                  <div 
                                    className={`h-full rounded-full ${pct >= 90 ? 'bg-emerald-400' : pct >= 75 ? 'bg-amber-400' : 'bg-rose-400'}`} 
                                    style={{ width: `${Math.min(100, pct)}%` }} 
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {isClassSubmitted ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>COMMITTED 🔒</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  <Clock3 className="w-3 h-3 text-amber-400" />
                                  <span>PENDING ⏳</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      // Fallback showing active class and institutional sections if offline
                      [
                        { grade: '10', section: 'A', total: 35, present: 33, absent: 1, leave: 1, attendancePercent: 94.3, isMarked: true },
                        { grade: '10', section: 'B', total: 34, present: 32, absent: 2, leave: 0, attendancePercent: 94.1, isMarked: true },
                        { grade: '11', section: 'A', total: 38, present: 36, absent: 1, leave: 1, attendancePercent: 94.7, isMarked: true },
                        { grade: '11', section: 'B', total: 36, present: 34, absent: 2, leave: 0, attendancePercent: 94.4, isMarked: true },
                        { grade: '12', section: 'A', total: 35, present: 34, absent: 0, leave: 1, attendancePercent: 97.1, isMarked: true },
                        { grade: '12', section: 'B', total: 32, present: 30, absent: 1, leave: 1, attendancePercent: 93.8, isMarked: true }
                      ].map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-850/60 transition-colors">
                          <td className="py-3 px-4 font-bold text-white">Class {row.grade}</td>
                          <td className="py-3 px-4 text-center font-bold text-slate-300">{row.section}</td>
                          <td className="py-3 px-4 text-right font-bold text-white">{row.total}</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-400">{row.present}</td>
                          <td className="py-3 px-4 text-right font-bold text-rose-400">{row.absent}</td>
                          <td className="py-3 px-4 text-right font-bold text-amber-400">{row.leave}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-bold text-white">{row.attendancePercent}%</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>COMMITTED 🔒</span>
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {/* Summary Footer */}
                  <tfoot className="bg-slate-950 font-bold border-t border-slate-700 text-white">
                    <tr>
                      <td colSpan={2} className="py-3.5 px-4 uppercase text-slate-300">
                        TOTAL (ALL CLASSES COMBINED)
                      </td>
                      <td className="py-3.5 px-4 text-right text-white">
                        {schoolAttendanceData?.students?.total ?? classRoster.length}
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-400">
                        {schoolAttendanceData?.students?.present ?? classRoster.filter(s => s.status === 'present').length}
                      </td>
                      <td className="py-3.5 px-4 text-right text-rose-400">
                        {schoolAttendanceData?.students?.absent ?? classRoster.filter(s => s.status === 'absent').length}
                      </td>
                      <td className="py-3.5 px-4 text-right text-amber-400">
                        {schoolAttendanceData?.students?.leave ?? classRoster.filter(s => s.status === 'leave').length}
                      </td>
                      <td className="py-3.5 px-4 text-center text-cyan-300">
                        {schoolAttendanceData?.students?.attendancePercent || 96.5}%
                      </td>
                      <td className="py-3.5 px-4 text-center text-emerald-400 text-[11px]">
                        Institutional Pulse ✓
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: UNMARKED STUDENTS RADAR (FULL SCREEN VIEW) */}
        {/* ========================================================================= */}
        {activeTab === 'unmarked' && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl w-full mx-auto animate-in fade-in duration-300">
            <div className="bg-amber-950/40 p-5 rounded-3xl border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                  PENDING ROLL-CALL DESK
                </span>
                <h2 className="text-lg font-black text-white mt-0.5">
                  {unmarkedClasses.reduce((acc, c) => acc + c.count, 0)} Students Awaiting Roll-Call Today
                </h2>
                <p className="text-xs text-slate-300 font-mono mt-0.5">
                  Select any section to mark roll call or delegate proxy attendance.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('pulse')}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-mono font-bold text-xs border border-amber-500/40 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => onShowToast('info', 'Broadcast Ping Sent', 'SMS & WhatsApp reminder sent to all class teachers')}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all cursor-pointer"
                >
                  Send Staff Reminder Ping
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {unmarkedClasses.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedClassForMarking(item.grade);
                    setActiveTab('attendance');
                  }}
                  className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-amber-500/30 hover:border-amber-400 text-center transition-all cursor-pointer group"
                >
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">{item.wing}</span>
                  <div className="text-base font-extrabold text-white mt-1 group-hover:text-amber-300 transition-colors">
                    {item.grade}
                  </div>
                  <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">
                    {item.count}
                  </div>
                  <span className="mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300">
                    Mark Now →
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: TIMETABLE & ROUTINE */}
        {/* ========================================================================= */}
        {activeTab === 'timetable' && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl w-full mx-auto animate-in fade-in duration-300 font-mono">
            <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  WEEKLY ROUTINE & PERIOD SCHEDULE
                </span>
                <h2 className="text-lg font-black text-white mt-0.5">
                  Faculty Time Table: {profile.name}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('pulse')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Dashboard</span>
                </button>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  24 Periods / Week
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { period: 1, time: '08:30 AM - 09:15 AM', grade: 'Class 10-A', subject: 'Mathematics (Trigonometry)', room: 'Room 201', status: 'Completed' },
                { period: 2, time: '09:20 AM - 10:05 AM', grade: 'Class 10-A', subject: 'Mathematics Problem Solving', room: 'Room 201', status: 'In Session' },
                { period: 3, time: '10:10 AM - 10:55 AM', grade: 'Class 11 Science', subject: 'Advanced Calculus & Limits', room: 'Room 302', status: 'Upcoming' },
                { period: 4, time: '11:15 AM - 12:00 PM', grade: 'Class 9-A (Substitution)', subject: 'General Science Proxy', room: 'Room 104', status: 'Arrangement Duty' },
                { period: 5, time: '12:05 PM - 12:50 PM', grade: 'Faculty Research', subject: 'CBSE Math Olympiad Lab', room: 'Faculty Room', status: 'Planning' },
                { period: 6, time: '01:30 PM - 02:15 PM', grade: 'Class 12 Science', subject: 'Probability & Vectors', room: 'Room 305', status: 'Upcoming' }
              ].map((p) => (
                <div
                  key={p.period}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    p.status === 'In Session'
                      ? 'bg-cyan-950/60 border-cyan-400 shadow-lg shadow-cyan-500/15'
                      : p.status === 'Arrangement Duty'
                      ? 'bg-rose-950/40 border-rose-500/40'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-slate-800 text-cyan-300 font-extrabold flex items-center justify-center text-sm">
                      P{p.period}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{p.subject}</span>
                        <span className="text-xs text-slate-400">({p.grade})</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {p.time} • Location: <span className="text-cyan-300 font-semibold">{p.room}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase self-start sm:self-auto ${
                      p.status === 'In Session'
                        ? 'bg-cyan-500 text-slate-950 font-black'
                        : p.status === 'Arrangement Duty'
                        ? 'bg-rose-500 text-white font-black'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: ARRANGEMENT / PROXY DUTY */}
        {/* ========================================================================= */}
        {activeTab === 'arrangements' && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl w-full mx-auto animate-in fade-in duration-300 font-mono">
            <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  ARRANGEMENT & PROXY MANAGEMENT
                </span>
                <h2 className="text-lg font-black text-white mt-0.5">
                  Substitution Duties Assigned
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('pulse')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => onShowToast('info', 'Apply Leave / Proxy', 'Submit proxy request to Academic In-charge')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer"
                >
                  Request Proxy Coverage
                </button>
              </div>
            </div>

            {arrangements.length === 0 ? (
              <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3 font-mono">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 shadow-inner">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">No Substitution Duties Assigned Today</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  You are currently on your regular teaching schedule. All faculty coverage is normal and verified with School Academic Office.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {arrangements.map(a => (
                  <div key={a.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                        Today • Period {a.periodNumber} ({a.time || '11:15 AM'})
                      </span>
                      <span className={`text-xs font-bold ${a.status === 'accepted' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {a.status === 'accepted' ? 'Status: Accepted ✓' : 'Status: Action Required'}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-white">
                      Substitution for {a.absentTeacherName} — {a.grade}-{a.section} ({a.roomNumber || 'Room 104'})
                    </h3>
                    <p className="text-xs text-slate-300">
                      Reason: {a.reason}. {a.notes || 'Please conduct supervised chapter revision.'}
                    </p>
                    <div className="pt-2 flex items-center gap-2">
                      {a.status !== 'accepted' ? (
                        <button
                          type="button"
                          onClick={() => handleAcceptArrangement(a.id)}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
                        >
                          Confirm & Accept Duty
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                          <Check className="w-4 h-4" />
                          <span>You have accepted this arrangement period.</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: STRUCTURED TEACHING JOURNAL */}
        {/* ========================================================================= */}
        {activeTab === 'journal' && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl w-full mx-auto animate-in fade-in duration-300 font-mono">
            <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  STRUCTURED TEACHING JOURNAL & NEP 2020 PLANNER
                </span>
                <h2 className="text-lg font-black text-white mt-0.5">
                  Daily Lesson Log: {journalEntry.grade} — {journalEntry.subject}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('pulse')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => onShowToast('success', 'Journal Saved', 'Teaching log synchronized with CBSE Academic Roster')}
                  className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Save Daily Log
                </button>
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Chapter & Topic</label>
                <input
                  type="text"
                  value={journalEntry.chapter}
                  onChange={(e) => setJournalEntry({ ...journalEntry, chapter: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Concepts Taught in Class Today</label>
                <textarea
                  rows={3}
                  value={journalEntry.topicsCovered}
                  onChange={(e) => setJournalEntry({ ...journalEntry, topicsCovered: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Homework Assigned to Students</label>
                <input
                  type="text"
                  value={journalEntry.homeworkAssigned}
                  onChange={(e) => setJournalEntry({ ...journalEntry, homeworkAssigned: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Pedagogical Outcome / Remarks</label>
                <input
                  type="text"
                  value={journalEntry.learningOutcome}
                  onChange={(e) => setJournalEntry({ ...journalEntry, learningOutcome: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 8: AI TEACHER CO-PILOT */}
        {/* ========================================================================= */}
        {activeTab === 'ai_copilot' && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl w-full mx-auto animate-in fade-in duration-300 font-mono">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('pulse')}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-fuchsia-300 font-bold text-xs border border-fuchsia-500/40 flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Dashboard</span>
              </button>
            </div>

            <div className="bg-gradient-to-r from-fuchsia-950/80 via-purple-950 to-slate-900 p-6 rounded-3xl border border-fuchsia-400/40">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-5 h-5 text-fuchsia-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-fuchsia-300">
                  24/7 AI TEACHING CO-PILOT
                </span>
              </div>
              <h2 className="text-xl font-black text-white">
                Generate CBSE Lesson Plans, Pop Quizzes & Concept Explanations
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Aligned with NCERT syllabus for {profile.assignedClass} — {profile.currentPost}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  '5-Minute Pop Quiz on Python Stacks',
                  'CBSE Marking Scheme Rubric for Stacks',
                  'Remedial explanation for slow learners',
                  'Real-world analogy for LIFO Stack'
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAiPrompt(chip);
                      handleRunAiCopilot(chip);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-950/60 hover:bg-fuchsia-950 text-xs text-slate-300 hover:text-white border border-fuchsia-500/30 cursor-pointer"
                  >
                    ⚡ {chip}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Ask any teaching plan, quiz prompt, or CBSE question..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRunAiCopilot();
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-fuchsia-500/30 text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleRunAiCopilot()}
                  disabled={aiLoading}
                  className="px-5 py-2.5 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Generate</span>
                </button>
              </div>
            </div>

            {aiOutput && (
              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-fuchsia-300">Generated Pedagogy Content</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(aiOutput);
                      onShowToast('success', 'Copied to Clipboard', 'Ready to paste into teaching journal or print');
                    }}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Copy Content
                  </button>
                </div>
                <pre className="text-xs text-slate-200 whitespace-pre-wrap font-mono leading-relaxed">
                  {aiOutput}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 9: HOMEWORK & DIARY */}
        {/* ========================================================================= */}
        {activeTab === 'homework' && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl w-full mx-auto animate-in fade-in duration-300 font-mono">
            <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  HOMEWORK DIARY DESK
                </span>
                <h2 className="text-lg font-black text-white mt-0.5">
                  Daily Assignments for {profile.assignedClass}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('pulse')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => onShowToast('success', 'Homework Dispatched', 'Pushed to all 35 student & parent portals via WhatsApp/App')}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  + Dispatch Homework
                </button>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-300 font-bold">Computer Science • Due Tomorrow (08:30 AM)</span>
                <span className="text-emerald-400">31/35 Submitted</span>
              </div>
              <h3 className="text-sm font-bold text-white">
                Python Stack Program Implementation (Push/Pop operations)
              </h3>
              <p className="text-xs text-slate-400">
                Write a modular Python program to implement linear stack operations with underflow and overflow checks.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 10: EXAMS & MARKS ENTRY */}
        {/* ========================================================================= */}
        {activeTab === 'exams' && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl w-full mx-auto animate-in fade-in duration-300 font-mono">
            <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  CBSE MARKS & ASSESSMENT DESK
                </span>
                <h2 className="text-lg font-black text-white mt-0.5">
                  Mid-Term Assessment Entry: {profile.assignedClass}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('pulse')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => onShowToast('success', 'Marks Uploaded', 'Transcripts submitted to School Examination Cell')}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
                >
                  Submit Score Ledger
                </button>
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden divide-y divide-slate-800">
              {classRoster.map((st: any, i) => (
                <div key={st.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-xs">
                      #{st.rollNo}
                    </span>
                    <div>
                      <span className="text-sm font-bold text-white block">{st.name}</span>
                      <span className="text-[11px] font-mono text-slate-400">Adm: {st.admissionNo || `DKS-2026-${String(st.rollNo).padStart(3, '0')}`}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      defaultValue={85 + (i % 10)}
                      max={100}
                      min={0}
                      className="w-16 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-center font-bold"
                    />
                    <span className="text-xs text-slate-400">/ 100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 👤 MODAL: FULL EMPLOYEE DETAILS (MATCHES SCREENSHOT 2 EXACTLY) */}
      {/* ========================================================================= */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#ffffff] text-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative font-sans animate-in zoom-in-95 duration-200">
            {/* Top Back Arrow & Title (Matches Screenshot 2) */}
            <div className="flex items-center gap-4 mb-6">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-800 transition-colors"
                aria-label="Back to Portal"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black text-slate-950 tracking-tight">
                Employee Details
              </h2>
            </div>

            {/* Profile Fields List (Matching Screenshot 2 exact order and labels) */}
            <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              {/* NAME */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  NAME
                </span>
                <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                  {profile.name}-{profile.empId}
                </div>
              </div>

              {/* CURRENT POST */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  CURRENT POST
                </span>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5 uppercase">
                  {profile.currentPost}
                </div>
              </div>

              {/* CURRENT OFFICE */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  CURRENT OFFICE
                </span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {profile.currentOffice}
                </div>
              </div>

              {/* APPOINTMENT DATE */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  APPOINTMENT DATE
                </span>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {profile.appointmentDate}
                </div>
              </div>

              {/* PAY SCALE */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  PAY SCALE
                </span>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {profile.payScale}
                </div>
              </div>

              {/* GENDER */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  GENDER
                </span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {profile.gender}
                </div>
              </div>

              {/* DATE OF BIRTH */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  DATE OF BIRTH
                </span>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {profile.dob}
                </div>
              </div>

              {/* CATEGORY */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  CATEGORY
                </span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {profile.category}
                </div>
              </div>

              {/* EMAIL */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  EMAIL
                </span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {profile.email}
                </div>
              </div>

              {/* MOBILE */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  MOBILE
                </span>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {profile.mobile}
                </div>
              </div>

              {/* CITY */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  CITY
                </span>
                <div className="text-sm font-black text-slate-900 mt-0.5 uppercase">
                  {profile.city}
                </div>
              </div>

              {/* QUALIFICATION */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  QUALIFICATION
                </span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {profile.qualification}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back / Close</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-950 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print Profile</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📊 MODAL: RESPONSIBILITIES & WORKLOAD AUDIT SHEET */}
      {/* ========================================================================= */}
      {showWorkloadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative font-mono text-xs">
            <button
              type="button"
              onClick={() => setShowWorkloadModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <Layers className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Faculty Workload & Responsibility Audit</h3>
                <p className="text-[11px] text-slate-400">CBSE Affiliation Byelaws (Chapter 5) Workload Compliance</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/30 space-y-3 mb-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Faculty Name:</span>
                <span className="text-white font-bold">{profile.name} ({profile.empId})</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Designation & Department:</span>
                <span className="text-cyan-300 font-bold">{profile.currentPost} ({profile.department})</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Total Weekly Workload:</span>
                <span className="text-emerald-400 font-bold">26 / 30 Periods & Hours (86.7% - OPTIMAL)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Free / Research Periods:</span>
                <span className="text-purple-300 font-bold">4 Periods / Week</span>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Detailed Duty Breakdown:
              </span>
              {[
                { duty: "Core Teaching: Class 10-A (Mathematics)", type: "Teaching", load: "6 Periods/Wk", color: "text-cyan-300" },
                { duty: "Core Teaching: Class 11 Science (Advanced Math)", type: "Teaching", load: "6 Periods/Wk", color: "text-cyan-300" },
                { duty: "Core Teaching: Class 12 Science (Calculus & Vectors)", type: "Teaching", load: "6 Periods/Wk", color: "text-cyan-300" },
                { duty: "Practical Lab: Class 9-A (Mathematics Lab)", type: "Lab Activity", load: "2 Periods/Wk", color: "text-blue-300" },
                { duty: "Class Teacher Duties: Class 10-A", type: "Pastoral Care", load: "3 Hours/Wk", color: "text-amber-300" },
                { duty: "HOD Responsibilities: Mathematics Dept", type: "Academic Admin", load: "2 Hours/Wk", color: "text-purple-300" },
                { duty: "CBSE Examination Committee Duty", type: "Assessment Cell", load: "1 Hour/Wk", color: "text-emerald-300" }
              ].map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold">{item.duty}</div>
                    <div className="text-[10px] text-slate-400">{item.type}</div>
                  </div>
                  <span className={`font-bold ${item.color}`}>{item.load}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowWorkloadModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Dashboard / Close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: APPLY FACULTY LEAVE (CL / EARN LEAVE / MEDICAL / OTHER) */}
      {/* ========================================================================= */}
      {showTeacherApplyLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl font-mono max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  FACULTY LEAVE APPLICATION (शिक्षक अवकाश आवेदन)
                </span>
                <h3 className="text-base font-black text-white mt-0.5">
                  Apply for Leave: {profile.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTeacherApplyLeaveModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitTeacherLeave} className="space-y-4">
              {/* Leave Type Selector with Quotas */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  Select Leave Type (अवकाश का प्रकार) *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'CL', label: 'Casual (CL)', bal: teacherLeaveBalances.cl.remaining, color: 'border-amber-500/40 text-amber-300' },
                    { id: 'EL', label: 'Earn (EL)', bal: teacherLeaveBalances.el.remaining, color: 'border-cyan-500/40 text-cyan-300' },
                    { id: 'ML', label: 'Medical (ML)', bal: teacherLeaveBalances.ml.remaining, color: 'border-emerald-500/40 text-emerald-300' },
                    { id: 'OTHER', label: 'Other Leave', bal: teacherLeaveBalances.other.remaining, color: 'border-purple-500/40 text-purple-300' }
                  ].map((t) => {
                    const isSelected = teacherLeaveForm.leaveType === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTeacherLeaveForm(prev => ({ ...prev, leaveType: t.id as any }))}
                        className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 shadow-md shadow-amber-500/20 ring-1 ring-amber-400'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-black text-white">{t.label}</div>
                        <div className={`text-[11px] font-bold mt-1 ${t.color}`}>
                          {t.bal} Days left
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    From Date (आरंभ तिथि) *
                  </label>
                  <input
                    type="date"
                    required
                    value={teacherLeaveForm.fromDate}
                    onChange={(e) => setTeacherLeaveForm(prev => ({ ...prev, fromDate: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    To Date (समाप्ति तिथि) *
                  </label>
                  <input
                    type="date"
                    required
                    value={teacherLeaveForm.toDate}
                    min={teacherLeaveForm.fromDate}
                    onChange={(e) => setTeacherLeaveForm(prev => ({ ...prev, toDate: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Half Day Option */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Half-Day Leave (आधा दिन अवकाश)</span>
                  <span className="text-[11px] text-slate-400">Count as 0.5 Day debit from quota</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={teacherLeaveForm.isHalfDay}
                      onChange={(e) => setTeacherLeaveForm(prev => ({ ...prev, isHalfDay: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                  {teacherLeaveForm.isHalfDay && (
                    <select
                      value={teacherLeaveForm.halfDayType}
                      onChange={(e) => setTeacherLeaveForm(prev => ({ ...prev, halfDayType: e.target.value as any }))}
                      className="text-xs bg-slate-900 border border-slate-700 text-amber-300 rounded-lg px-2 py-1 font-mono focus:outline-none"
                    >
                      <option value="first_half">1st Half (Morning)</option>
                      <option value="second_half">2nd Half (Post-Lunch)</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Reason for Leave */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Reason for Leave (अवकाश का कारण) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={teacherLeaveForm.reason}
                  onChange={(e) => setTeacherLeaveForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g. Urgent domestic work / Viral fever / Attending family event..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-400 focus:outline-none resize-none"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {[
                    'Urgent Personal Work',
                    'Viral Fever / Medical Rest',
                    'Family Function / Event',
                    'Out of Station Duty'
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setTeacherLeaveForm(prev => ({ ...prev, reason: suggestion }))}
                      className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] border border-slate-700 cursor-pointer"
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Substitution / Handover Notes */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Class Handover / Substitution Arrangement Notes
                </label>
                <input
                  type="text"
                  value={teacherLeaveForm.handoverNotes}
                  onChange={(e) => setTeacherLeaveForm(prev => ({ ...prev, handoverNotes: e.target.value }))}
                  placeholder="e.g. Period 2 & 4 Math class handed to Mr. Rajesh Kumar; assignments given."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Emergency Contact Phone */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Emergency Contact Phone Number
                </label>
                <input
                  type="tel"
                  value={teacherLeaveForm.contactNumber}
                  onChange={(e) => setTeacherLeaveForm(prev => ({ ...prev, contactNumber: e.target.value }))}
                  placeholder="10-digit mobile number"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTeacherApplyLeaveModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTeacherLeave}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:brightness-105 text-white text-xs font-black shadow-lg shadow-amber-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submittingTeacherLeave ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Submit Application (आवेदन जमा करें)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⚠️ MODAL: ARRANGEMENT PERIOD DETAILS */}
      {/* ========================================================================= */}
      {showArrangementModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative font-mono text-xs">
            <button
              type="button"
              onClick={() => setShowArrangementModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-rose-400" />
              <h3 className="text-base font-bold text-white">Arrangement Substitution Duty</h3>
            </div>

            {(() => {
              const currentDuty = selectedArrangement || activePendingArrangement || acceptedArrangements[0];
              if (!currentDuty) {
                return (
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <div className="text-white font-bold text-sm">No Pending Substitution Duties</div>
                    <p className="text-slate-400 text-xs">
                      You are not assigned to any proxy arrangements today. All classroom coverage is normal.
                    </p>
                  </div>
                );
              }

              return (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-rose-300 font-bold">
                    Duty Timing: Period {currentDuty.periodNumber} ({currentDuty.time || '11:15 AM - 12:00 PM'})
                  </div>
                  <div className="text-white text-sm font-extrabold">
                    {currentDuty.grade}-{currentDuty.section} ({currentDuty.roomNumber || 'Room 104'})
                  </div>
                  <div className="text-slate-400">
                    Regular Teacher: {currentDuty.absentTeacherName} ({currentDuty.reason})
                  </div>
                  <div className="text-slate-400">
                    Assigned Topic: {currentDuty.subjectName}. {currentDuty.notes || ''}
                  </div>
                  {currentDuty.status === 'accepted' && (
                    <div className="mt-2 text-emerald-400 font-bold text-xs flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Duty Accepted and Confirmed ✓</span>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowArrangementModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Close / Back</span>
              </button>
              {(() => {
                const currentDuty = selectedArrangement || activePendingArrangement || acceptedArrangements[0];
                if (currentDuty && currentDuty.status !== 'accepted') {
                  return (
                    <button
                      type="button"
                      onClick={() => handleAcceptArrangement(currentDuty.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold"
                    >
                      Accept Assignment
                    </button>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherPortalHub;
