import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  Users,
  Calendar,
  Clock,
  BookOpen,
  Award,
  CreditCard,
  Bell,
  Bus,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Phone,
  Mail,
  MapPin,
  QrCode,
  Printer,
  ChevronRight,
  Download,
  Send,
  Sparkles,
  ShieldCheck,
  Check,
  X,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Search,
  Filter,
  Eye,
  FileCheck,
  Zap,
  Activity,
  HeartHandshake,
  AlertTriangle,
  Radio,
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  LogOut,
  ArrowLeft,
  Smartphone,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { LiveBusMap } from './LiveBusMap';
import { DriverGpsBroadcastModal } from './DriverGpsBroadcastModal';
import {
  ErpPortalWardStudent,
  ErpPortalStudentProfile,
  ErpPortalAttendanceSummary,
  ErpPortalLeaveApplication,
  ErpPortalHomeworkItem,
  ErpPortalReportCard,
  ErpPortalFeeSummary,
  ErpPortalTransport,
  ErpPortalEmergencyHelpline,
  ErpFeeDemand,
  ErpFeePayment
} from '../types';
import {
  fetchPortalWardStudents,
  fetchPortalStudentProfile,
  fetchPortalAttendance,
  submitPortalLeaveApplication,
  fetchPortalLeaveApplications,
  fetchPortalReportCards,
  fetchPortalFees,
  payPortalFee,
  fetchPortalHomework,
  submitPortalHomework,
  acknowledgePortalHomework,
  fetchPortalTimetable,
  fetchPortalTransport,
  fetchPortalNotices,
  sendErpAiPrompt
} from '../services/api';

import { SchoolBrandProfile, PRESET_SCHOOLS } from './SchoolBrandingModal';
import { LanguageSelector, useTranslation } from '../i18n';
import { WardPortalSidebar, WardPortalTab } from './WardPortalSidebar';
import { TeacherPortalHub } from './TeacherPortalHub';

interface ParentStudentPortalHubProps {
  currentUser?: any;
  onShowToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
  defaultStudentId?: string;
  defaultRole?: 'parent' | 'student';
  schoolBrand?: SchoolBrandProfile;
  onSwitchRole?: (role: string) => void;
  onSignOut?: () => void;
}

type PortalTab = WardPortalTab;

export const ParentStudentPortalHub: React.FC<ParentStudentPortalHubProps> = ({
  currentUser,
  onShowToast,
  defaultStudentId = 'std-101',
  defaultRole = 'parent',
  schoolBrand,
  onSwitchRole,
  onSignOut
}) => {
  const { t, isHindi, isBilingual } = useTranslation();

  // Dynamic School Brand Profile State (resolves dynamically to logged-in student's school)
  const [dynamicSchoolBrand, setDynamicSchoolBrand] = useState<Partial<SchoolBrandProfile>>(() => {
    if (schoolBrand) return schoolBrand;
    const userSchoolName = currentUser?.schoolName || currentUser?.school_name || currentUser?.school?.name;
    if (userSchoolName) {
      const lower = userSchoolName.toLowerCase();
      const matched = Object.values(PRESET_SCHOOLS).find(p =>
        lower.includes(p.shortName.toLowerCase()) ||
        p.schoolName.toLowerCase().includes(lower) ||
        lower.includes(p.schoolName.toLowerCase())
      );
      if (matched) return matched;
      return {
        schoolName: userSchoolName,
        board: currentUser?.board || 'CBSE',
        schoolCode: currentUser?.schoolCode || 'SCH-2026',
        affiliationNo: currentUser?.affiliationNo || 'CBSE-AFF',
        logoUrl: currentUser?.logoUrl || '/logo.svg'
      };
    }
    const savedTenant = typeof window !== 'undefined' ? localStorage.getItem('dakshora_tenant_school_name') : null;
    if (savedTenant) {
      const lower = savedTenant.toLowerCase();
      const matched = Object.values(PRESET_SCHOOLS).find(p =>
        lower.includes(p.shortName.toLowerCase()) ||
        p.schoolName.toLowerCase().includes(lower) ||
        lower.includes(p.schoolName.toLowerCase())
      );
      if (matched) return matched;
      return { schoolName: savedTenant };
    }
    return PRESET_SCHOOLS.dakshora || PRESET_SCHOOLS.newideal;
  });

  const activeSchoolName = dynamicSchoolBrand?.schoolName || schoolBrand?.schoolName || 'Dakshora Academy, New Delhi';
  const activeAffiliationNo = dynamicSchoolBrand?.affiliationNo || schoolBrand?.affiliationNo || 'CBSE-AFF-202601';
  const activeSchoolCode = dynamicSchoolBrand?.schoolCode || schoolBrand?.schoolCode || 'DKS-DEL-01';
  const activeBoard = dynamicSchoolBrand?.board || schoolBrand?.board || 'CBSE';
  const schoolLogo = dynamicSchoolBrand?.logoUrl || schoolBrand?.logoUrl || '/assets/dakshora-logo.png';

  // 👩‍🏫 Auto-route teachers to dedicated TeacherPortalHub (Avoid loading Ward Profile for Teachers)
  const userRole = (currentUser?.role || '').toLowerCase();
  const isTeacher = userRole === 'teacher' || ['teacher', 'faculty', 'lecturer'].includes(userRole);
  if (isTeacher) {
    return (
      <TeacherPortalHub
        currentUser={currentUser}
        onShowToast={onShowToast}
        onSignOut={onSignOut}
        schoolBrand={dynamicSchoolBrand as SchoolBrandProfile}
        onSwitchRole={onSwitchRole}
      />
    );
  }



  // Navigation & Personas
  const [activeTab, setActiveTab] = useState<PortalTab>('pulse');
  const [portalMode, setPortalMode] = useState<'parent' | 'student'>(defaultRole);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('dakshora_ward_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('dakshora_ward_sidebar_collapsed', String(isDesktopCollapsed));
    } catch {}
  }, [isDesktopCollapsed]);

  // Ward Switcher State (Vikram Sharma parent phone)
  const [wards, setWards] = useState<ErpPortalWardStudent[]>([]);
  const [activeWardId, setActiveWardId] = useState<string>(defaultStudentId);
  const [loadingWards, setLoadingWards] = useState(false);

  // Active Ward Data Aggregates
  const [profile, setProfile] = useState<ErpPortalStudentProfile | null>(null);
  const [attendance, setAttendance] = useState<ErpPortalAttendanceSummary | null>(null);
  const [homeworkList, setHomeworkList] = useState<ErpPortalHomeworkItem[]>([]);
  const [reportCards, setReportCards] = useState<ErpPortalReportCard[]>([]);
  const [feeSummary, setFeeSummary] = useState<ErpPortalFeeSummary | null>(null);
  const [invoices, setInvoices] = useState<ErpFeeDemand[]>([]);
  const [receipts, setReceipts] = useState<ErpFeePayment[]>([]);
  const [timetable, setTimetable] = useState<{
    grade: string;
    section: string;
    activePeriod: any;
    nextPeriod: any;
    weeklyRoutine: Record<string, any[]>;
    liveStatus?: string;
  } | null>(null);

  // Real-time IST Clock & Timetable Live Countdown (Updates every 1000ms)
  const [liveIstClock, setLiveIstClock] = useState<string>('');
  const [liveMinsLeft, setLiveMinsLeft] = useState<number>(0);
  const [liveSecsLeft, setLiveSecsLeft] = useState<number>(0);

  useEffect(() => {
    const tick = () => {
      const istDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const timeStr = istDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      setLiveIstClock(`${timeStr} (IST)`);

      if (timetable?.activePeriod?.endTime) {
        const [eh, em] = timetable.activePeriod.endTime.split(':').map(Number);
        if (!isNaN(eh) && !isNaN(em)) {
          const nowSecs = (istDate.getHours() * 3600) + (istDate.getMinutes() * 60) + istDate.getSeconds();
          const endSecs = (eh * 3600) + (em * 60);
          const diff = endSecs - nowSecs;
          if (diff > 0) {
            setLiveMinsLeft(Math.floor(diff / 60));
            setLiveSecsLeft(diff % 60);
          } else {
            setLiveMinsLeft(0);
            setLiveSecsLeft(0);
          }
        }
      } else if (timetable?.activePeriod?.minutesRemaining) {
        setLiveMinsLeft(timetable.activePeriod.minutesRemaining);
        setLiveSecsLeft(0);
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [timetable]);
  const [transport, setTransport] = useState<ErpPortalTransport | null>(null);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [notices, setNotices] = useState<any[]>([]);
  const [emergencyHelpline, setEmergencyHelpline] = useState<ErpPortalEmergencyHelpline[]>([]);
  const [leaveApplications, setLeaveApplications] = useState<ErpPortalLeaveApplication[]>([]);

  // Modals
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'sick',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: ''
  });
  const [submittingLeave, setSubmittingLeave] = useState(false);

  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState<ErpFeeDemand | null>(null);
  const [paymentMode, setPaymentMode] = useState<'upi' | 'card' | 'bank_transfer'>('upi');
  const [payingFee, setPayingFee] = useState(false);
  const [latestReceipt, setLatestReceipt] = useState<any | null>(null);

  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<ErpPortalHomeworkItem | null>(null);
  const [homeworkSubmissionText, setHomeworkSubmissionText] = useState('');
  const [submittingHomework, setSubmittingHomework] = useState(false);

  const [showReportCardModal, setShowReportCardModal] = useState(false);
  const [selectedReportCard, setSelectedReportCard] = useState<ErpPortalReportCard | null>(null);

  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const [showStudentDetailModal, setShowStudentDetailModal] = useState(false);

  // AI Doubt Solver State
  const [doubtSubject, setDoubtSubject] = useState('Mathematics');
  const [doubtInput, setDoubtInput] = useState('');
  const [giveHintOnly, setGiveHintOnly] = useState(false);
  const [doubtLoading, setDoubtLoading] = useState(false);
  const [doubtMessages, setDoubtMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; text: string; hintOnly?: boolean; timestamp: string }>>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      text: "👋 Namaste! I am your Dakshora AI Study Partner, aligned with your CBSE curriculum. Ask me any doubt in Mathematics, Science, English, or Social Science, or tap a quick question below!",
      timestamp: 'Just now'
    }
  ]);

  const handleSendDoubt = async (queryText?: string) => {
    const promptToSend = queryText || doubtInput;
    if (!promptToSend.trim()) return;

    const userMsg = {
      id: `msg-${Date.now()}`,
      role: 'user' as const,
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setDoubtMessages(prev => [...prev, userMsg]);
    setDoubtInput('');
    setDoubtLoading(true);

    try {
      const modeInstruction = giveHintOnly
        ? "IMPORTANT: The student requested a HINT ONLY. Do not give the complete answer or final formula. Instead, provide a guiding clue, conceptual reminder, and first step to help them think through it."
        : "Provide a clear, pedagogical, step-by-step explanation suitable for a CBSE Class 10 student. Include real-world analogies, formula breakdown, and a quick practice check.";

      const res = await sendErpAiPrompt({
        prompt: `[Subject: ${doubtSubject}] [Curriculum: CBSE Class 10] ${modeInstruction}\n\nStudent Doubt: ${promptToSend}`,
        module: 'student_tutor',
        role: 'student'
      });

      const replyText = res.data?.reply || (res.data as any)?.message || "Here is a step-by-step breakdown: First, identify the given values and formula. Apply the standard CBSE method and solve step-by-step.";
      
      setDoubtMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          text: replyText,
          hintOnly: giveHintOnly,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      setDoubtMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          text: "I ran into a temporary network delay, but here is a quick study tip: Review the core NCERT chapter summary and check the formula sheet.",
          timestamp: 'Just now'
        }
      ]);
    } finally {
      setDoubtLoading(false);
    }
  };

  // 1. Initial Load: Load Wards from live database
  const loadWards = useCallback(async () => {
    setLoadingWards(true);
    try {
      const parentPhone = currentUser?.phone || currentUser?.parentPhone || (typeof window !== 'undefined' ? localStorage.getItem('dakshora_user_phone') : null) || '';
      const parentEmail = currentUser?.email || currentUser?.parentEmail || '';
      const studentId = currentUser?.studentId || currentUser?.student_id || defaultStudentId || '';
      const res = await fetchPortalWardStudents({ parentPhone, parentEmail, studentId });
      if (res.data?.wards && res.data.wards.length > 0) {
        setWards(res.data.wards);
        if (!activeWardId || !res.data.wards.some((w: any) => w.id === activeWardId)) {
          setActiveWardId(res.data.wards[0].id);
        }
      }
      if (res.data?.school?.name) {
        const s = res.data.school;
        setDynamicSchoolBrand(prev => ({
          ...prev,
          schoolName: s.name || s.schoolName || prev?.schoolName,
          board: s.board || prev?.board || 'CBSE',
          logoUrl: s.logoUrl || prev?.logoUrl || '/assets/dakshora-logo.png',
          affiliationNo: s.affiliationNo || prev?.affiliationNo || 'CBSE-AFF-202601',
          schoolCode: s.schoolCode || prev?.schoolCode || 'DKS-DEL-01',
          address: s.address || prev?.address || 'Institutional Area, Vasant Kunj, New Delhi - 110070'
        }));
      }
    } catch {
      // Fallback local mock if backend offline
    } finally {
      setLoadingWards(false);
    }
  }, [activeWardId, currentUser, defaultStudentId]);

  useEffect(() => {
    loadWards();
  }, [loadWards]);

  // 2. Load Active Ward Details whenever activeWardId changes
  const loadActiveWardData = useCallback(async (studentId: string) => {
    if (!studentId) return;

    try {
      // Parallel fetches for fastest response
      const [
        profileRes,
        attendanceRes,
        hwRes,
        reportsRes,
        feesRes,
        ttRes,
        transRes,
        noticesRes,
        leaveRes
      ] = await Promise.all([
        fetchPortalStudentProfile(studentId),
        fetchPortalAttendance(studentId),
        fetchPortalHomework({ studentId }),
        fetchPortalReportCards(studentId),
        fetchPortalFees(studentId),
        fetchPortalTimetable(studentId),
        fetchPortalTransport(studentId),
        fetchPortalNotices(),
        fetchPortalLeaveApplications(studentId)
      ]);

      if (profileRes.data?.student) {
        const std = profileRes.data.student;
        setProfile(std);
        if (std.schoolAffiliation) {
          const aff = std.schoolAffiliation;
          const schName = aff.schoolName || std.schoolName;
          if (schName) {
            const lower = schName.toLowerCase();
            const matched = Object.values(PRESET_SCHOOLS).find(p =>
              lower.includes(p.shortName.toLowerCase()) ||
              p.schoolName.toLowerCase().includes(lower) ||
              lower.includes(p.schoolName.toLowerCase())
            );
            setDynamicSchoolBrand(prev => ({
              ...prev,
              schoolName: schName,
              affiliationNo: aff.affiliationNo || matched?.affiliationNo || prev?.affiliationNo || 'CBSE-AFF-2130894',
              schoolCode: aff.schoolCode || matched?.schoolCode || prev?.schoolCode || 'DPS-VK-894',
              board: aff.board || matched?.board || prev?.board || 'CBSE',
              logoUrl: aff.logoUrl || matched?.logoUrl || prev?.logoUrl || (schName.toLowerCase().includes('ideal') ? '/assets/schools/new-ideal-logo.svg' : '/logo.svg'),
              address: aff.address || matched?.address || prev?.address,
              principalName: aff.principalName || matched?.principalName || prev?.principalName,
              contactPhone: aff.phone || matched?.contactPhone || prev?.contactPhone,
              contactEmail: aff.email || matched?.contactEmail || prev?.contactEmail
            }));
          }
        }
      }
      if (attendanceRes.data) setAttendance((attendanceRes.data as any) || null);
      if (hwRes.data?.homework) setHomeworkList(hwRes.data.homework);
      if (reportsRes.data?.reportCards) setReportCards(reportsRes.data.reportCards);
      if (feesRes.data) {
        setFeeSummary((feesRes.data as any).summary || null);
        setInvoices(((feesRes.data as any).invoices as any) || []);
        setReceipts(((feesRes.data as any).receipts as any) || []);
      }
      if (ttRes.data) setTimetable((ttRes.data as any) || null);
      if (transRes.data) {
        if (transRes.data.hasTransport && transRes.data.transport) {
          setTransport(transRes.data.transport);
        } else {
          setTransport(null);
        }
      }
      if (noticesRes.data) {
        setNotices((noticesRes.data as any).notices || []);
        setEmergencyHelpline((noticesRes.data as any).emergencyHelpline || []);
      }
      if (leaveRes.data?.applications) setLeaveApplications(leaveRes.data.applications);
    } catch (err: any) {
      console.warn('Portal data fetch notice:', err.message);
    }
  }, []);

  useEffect(() => {
    if (activeWardId) {
      loadActiveWardData(activeWardId);
    }
  }, [activeWardId, loadActiveWardData]);

  // Active Ward Object
  const activeWard = wards.find(w => w.id === activeWardId) || (wards.length > 0 ? wards[0] : null);

  // Submit Leave Handler
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.reason.trim()) {
      onShowToast('warning', 'Missing Reason', 'Please explain the reason for the leave.');
      return;
    }

    setSubmittingLeave(true);
    try {
      const res = await submitPortalLeaveApplication({
        studentId: activeWardId,
        leaveType: leaveForm.leaveType,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        reason: leaveForm.reason
      });

      if (res.data?.success) {
        onShowToast('success', 'Leave Application Submitted! 📅', res.data.message);
        setShowLeaveModal(false);
        setLeaveForm({
          leaveType: 'sick',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          reason: ''
        });
        loadActiveWardData(activeWardId);
      } else {
        onShowToast('error', 'Submission Failed', res.data?.message || 'Could not submit leave');
      }
    } catch (err: any) {
      onShowToast('error', 'Error', err.message);
    } finally {
      setSubmittingLeave(false);
    }
  };

  // Submit Homework Solution
  const handleHomeworkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHomework) return;

    setSubmittingHomework(true);
    try {
      const res = await submitPortalHomework({
        homeworkId: selectedHomework.id,
        studentId: activeWardId,
        submissionText: homeworkSubmissionText,
        attachmentUrl: 'https://example.com/submissions/student_work.pdf'
      });

      if (res.data?.success) {
        onShowToast('success', 'Homework Submitted! 📚', 'Your submission has been sent to the teacher.');
        setShowHomeworkModal(false);
        setHomeworkSubmissionText('');
        loadActiveWardData(activeWardId);
      }
    } catch (err: any) {
      onShowToast('error', 'Error', err.message);
    } finally {
      setSubmittingHomework(false);
    }
  };

  // Parent Acknowledgment
  const handleParentAcknowledge = async (homeworkId: string) => {
    try {
      const res = await acknowledgePortalHomework({
        homeworkId,
        studentId: activeWardId,
        parentName: activeWard?.parentName || 'Parent'
      });

      if (res.data?.success) {
        onShowToast('success', 'Homework Verified ✅', 'Marked as reviewed and acknowledged by parent.');
        loadActiveWardData(activeWardId);
      }
    } catch (err: any) {
      onShowToast('error', 'Error', err.message);
    }
  };

  // Instant Fee Payment
  const handlePayFee = async () => {
    setPayingFee(true);
    try {
      const res = await payPortalFee({
        studentId: activeWardId,
        demandId: selectedInvoiceForPay?.id,
        amount: selectedInvoiceForPay?.balanceAmount || selectedInvoiceForPay?.netAmount,
        paymentMode
      });

      if (res.data?.success) {
        onShowToast('success', 'Fee Payment Successful! 💳', res.data.message);
        setLatestReceipt(res.data.receipt);
        setShowPayModal(false);
        loadActiveWardData(activeWardId);
      } else {
        onShowToast('error', 'Payment Failed', res.data?.message || 'Transaction could not be processed');
      }
    } catch (err: any) {
      onShowToast('error', 'Payment Error', err.message);
    } finally {
      setPayingFee(false);
    }
  };

  const navTabs = [
    { id: 'pulse', label: t('portal.pulse', 'Daily Pulse'), icon: Sparkles, badge: null },
    { id: 'attendance', label: t('portal.attendance', 'Attendance & Leaves'), icon: Calendar, badge: `${attendance?.attendancePercent || 95}%` },
    { id: 'homework', label: t('portal.homework', 'Homework Diary'), icon: BookOpen, badge: homeworkList.length },
    { id: 'report_cards', label: t('portal.report_cards', 'CBSE Report Cards'), icon: Award, badge: null },
    { id: 'skill_passport', label: t('portal.skill_passport', 'NEP 2020 Skill Passport'), icon: ShieldCheck, badge: 'HPC' },
    { id: 'ai_tutor', label: t('portal.ai_tutor', 'AI Doubt Solver'), icon: Bot, badge: '24/7' },
    { id: 'fees', label: t('portal.fees', 'Fees & Payments'), icon: CreditCard, badge: (feeSummary?.outstandingBalanceINR || 0) > 0 ? `₹${feeSummary?.outstandingBalanceINR?.toLocaleString('en-IN')}` : 'PAID' },
    { id: 'timetable', label: t('portal.timetable', 'Class Routine'), icon: Clock, badge: 'Live' },
    { id: 'bus_tracker', label: t('portal.bus_tracker', 'Bus Tracker'), icon: Bus, badge: transport?.currentStatus === 'on_route' ? 'En Route' : null },
    { id: 'notices', label: t('portal.notices', 'Notices & Helpline'), icon: Bell, badge: notices.length },
    { id: 'id_badge', label: t('portal.id_badge', 'Digital Student ID'), icon: QrCode, badge: null }
  ];

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col lg:flex-row antialiased">
      {/* ========================================================================= */}
      {/* 🧭 RESPONSIVE HAMBURGER MENU & COLLAPSIBLE SIDEBAR */}
      {/* ========================================================================= */}
      <WardPortalSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isDesktopCollapsed={isDesktopCollapsed}
        setIsDesktopCollapsed={setIsDesktopCollapsed}
        isMobileDrawerOpen={isMobileDrawerOpen}
        setIsMobileDrawerOpen={setIsMobileDrawerOpen}
        schoolName={activeSchoolName}
        affiliationNo={activeAffiliationNo}
        schoolCode={activeSchoolCode}
        board={activeBoard}
        schoolLogo={schoolLogo}
        wards={wards}
        activeWardId={activeWardId}
        onSelectWard={(wardId) => {
          setActiveWardId(wardId);
          onShowToast('success', 'Active Ward Switched', 'Loaded student records');
        }}
        portalMode={portalMode}
        setPortalMode={setPortalMode}
        counts={{
          homework: homeworkList.length,
          notices: notices.length,
          attendancePercent: attendance?.attendancePercent || 95.8,
          feeDue: (feeSummary?.outstandingBalanceINR || 0) > 0 ? feeSummary?.outstandingBalanceINR?.toLocaleString('en-IN') : undefined,
          busStatus: transport?.currentStatus === 'on_route' ? 'En Route' : 'Scheduled'
        }}
        onOpenGatePass={() => setShowIdCardModal(true)}
        onOpenStudentDetail={() => setShowStudentDetailModal(true)}
        onOpenSOS={() => {
          window.location.href = 'tel:+911126138999';
        }}
        onNavigateSurface={onSwitchRole}
        onLogout={onSignOut}
      />

      {/* ========================================================================= */}
      {/* 🖥️ MAIN PORTAL VIEWPORT */}
      {/* ========================================================================= */}
      <main className="flex-1 min-w-0 flex flex-col overflow-y-auto">
        {/* Persistent Desktop Top Action Bar */}
        <header className="hidden lg:flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              title={isDesktopCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              aria-label={isDesktopCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isDesktopCollapsed ? <PanelLeftOpen className="w-4 h-4 text-cyan-400" /> : <PanelLeftClose className="w-4 h-4 text-slate-400" />}
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">{t('portal.header_role', 'Ward Portal')}</span>
                <span className="text-slate-600">/</span>
                <h2 className="text-sm font-extrabold text-white capitalize">
                  {t(`portal.${activeTab}`, activeTab.replace('_', ' '))}
                </h2>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {activeSchoolName} • {activeBoard} {activeAffiliationNo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Active Ward Pill */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-800">
              <img
                src={activeWard?.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100'}
                alt={activeWard?.name || 'Student'}
                className="w-6 h-6 rounded-full object-cover ring-1 ring-cyan-400"
              />
              <div className="text-left font-mono">
                <span className="text-xs font-bold text-white block leading-tight">{activeWard?.name || wards[0]?.name || 'Advik Chaudhary'}</span>
                <span className="text-[10px] text-slate-400">{activeWard?.grade || wards[0]?.grade || 'Class 10'}-{activeWard?.section || wards[0]?.section || 'A'} • {t('portal.roll_no', 'Roll #')}{activeWard?.rollNo || wards[0]?.rollNo || 1}</span>
              </div>
            </div>

            {/* Persona Switcher */}
            <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => {
                  setPortalMode('parent');
                  onShowToast('info', 'Switched to Parent Perspective', 'Guardian authorizations enabled');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  portalMode === 'parent'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{isHindi ? '👨‍👩‍👧 अभिभावक' : isBilingual ? '👨‍👩‍👧 Parent / अभिभावक' : '👨‍👩‍👧 Parent'}</span>
              </button>
              <button
                onClick={() => {
                  setPortalMode('student');
                  onShowToast('info', 'Switched to Student Perspective', 'Learner homework and routine mode');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  portalMode === 'student'
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{isHindi ? '🎓 विद्यार्थी' : isBilingual ? '🎓 Student / विद्यार्थी' : '🎓 Student'}</span>
              </button>
            </div>

            {/* Emergency SOS */}
            <a
              href={`tel:${dynamicSchoolBrand.contactPhone || '+911126138999'}`}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="Emergency Helpline"
            >
              <Phone className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>{isHindi ? 'हेल्पलाइन' : isBilingual ? 'SOS / हेल्पलाइन' : 'SOS Helpline'}</span>
            </a>

            <LanguageSelector variant="header" />

            {/* 🚪 Top Bar Logout Button */}
            <button
              onClick={() => {
                if (onSignOut) {
                  onSignOut();
                } else {
                  try {
                    localStorage.removeItem('dakshora_auth_token');
                    localStorage.removeItem('dakshora_superadmin_user');
                    localStorage.removeItem('dakshora_active_surface');
                    localStorage.removeItem('dakshora_active_admin_tab');
                    sessionStorage.clear();
                    window.location.href = '/';
                  } catch {
                    window.location.reload();
                  }
                }
              }}
              className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer"
              title={isHindi ? 'लॉगआउट' : 'Logout / लॉगआउट'}
              aria-label="Logout / लॉगआउट"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Content Container */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* ========================================================================= */}
          {/* 🏠 TAB 1: DAILY PULSE (OVERVIEW) — MOBILE-FIRST RESPONSIVE GRADIENT CARDS */}
          {/* ========================================================================= */}
          {activeTab === 'pulse' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Urgent Notice Alert Banner (if notices exist) */}
              {notices.length > 0 && (
                <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/40 p-4 sm:p-5 rounded-3xl border border-amber-500/40 shadow-lg relative overflow-hidden">
                  <div className="flex items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                        <Bell className="w-5 h-5 animate-bounce" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/30 text-amber-200 uppercase font-mono tracking-wider">
                            {t('portal.important_notice', 'Important Notice')}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">{notices[0].postedAt || 'Today'}</span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-white mt-1">{notices[0].title}</h3>
                        <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">{notices[0].content}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('notices')}
                      className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-bold font-mono transition-all shrink-0 cursor-pointer"
                    >
                      <span>{t('portal.read_notice', 'Read Notice')}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Enrolled Multi-Child Sibling Switcher (if parent has multiple wards) */}
              {wards.length > 1 && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/30 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                      {t('portal.switch_ward', 'Switch Enrolled Child:')}
                    </span>
                    <span className="text-xs text-indigo-300 font-medium">
                      Active: <strong className="text-white">{activeWard?.name}</strong> ({activeWard?.grade}-{activeWard?.section})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {wards.map((w) => {
                      const isCur = activeWardId === w.id;
                      return (
                        <button
                          key={w.id}
                          onClick={() => {
                            setActiveWardId(w.id);
                            onShowToast('success', `Switched to ${w.name}`, `Loaded ${w.grade}-${w.section} records`);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all border cursor-pointer ${
                            isCur
                              ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white border-cyan-400 shadow-md'
                              : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
                          }`}
                        >
                          {w.name} ({w.grade}-{w.section})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Responsive Grid: 5 Core Live Operational Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* 1. ATTENDANCE & LEAVES CARD (Vibrant Emerald/Teal Gradient) */}
                <div className="bg-gradient-to-br from-emerald-950 via-teal-900/90 to-slate-950 rounded-3xl p-6 border border-emerald-400/40 shadow-xl relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 block">
                            {t('portal.card_attendance_title', 'DAILY ATTENDANCE')}
                          </span>
                          <h4 className="text-sm font-bold text-white">{t('portal.card_attendance_sub', 'Monthly Roll-Call')}</h4>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {t('portal.card_attendance_verified', 'Verified')}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-4xl font-black text-white font-mono tracking-tight">
                        {attendance?.attendancePercent || 95.8}%
                      </span>
                      <span className="text-xs text-emerald-400 font-mono font-bold">
                        {t('portal.card_attendance_trend', '↑ 1.2% this term')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-mono mt-1">
                      {attendance?.metrics?.presentDays || 14} {t('portal.card_attendance_days_present', 'Days Present')} • {attendance?.metrics?.leaveDays || 1} {t('portal.card_attendance_leave', 'Leave')} • {attendance?.metrics?.absentDays || 0} {t('portal.card_attendance_absent', 'Absent')}
                    </p>

                    {/* Real-time Roll-Call Pill */}
                    <div className="mt-3.5 p-2.5 rounded-xl bg-slate-950/70 border border-emerald-500/30 flex items-center gap-2 text-xs font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span className="text-emerald-300 font-bold truncate">
                        {(attendance as any)?.todayStatus?.status === 'present'
                          ? `Today: Verified Present at ${(attendance as any)?.todayStatus?.time || '08:45 AM'} (RFID)`
                          : (attendance as any)?.todayStatus?.status === 'absent'
                            ? 'Today: Marked Absent / Leave'
                            : t('portal.card_attendance_today_present', 'Today: Verified Present at 08:45 AM (RFID)')}
                      </span>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="mt-3 w-full bg-slate-950/80 rounded-full h-2 overflow-hidden border border-emerald-500/20">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${attendance?.attendancePercent || 95.8}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-emerald-500/20 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setShowLeaveModal(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                    >
                      {t('portal.apply_leave_btn', 'Apply Leave')}
                    </button>
                    <button
                      onClick={() => setActiveTab('attendance')}
                      className="text-xs text-emerald-300 hover:text-white font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>{t('portal.full_register_btn', 'Full Register')}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 2. FEES & RECEIPTS CARD (Vibrant Rose/Pink Gradient or Inactive if No Pending Fees) */}
                {(() => {
                  const pendingFeeAmount = feeSummary?.outstandingBalanceINR !== undefined 
                    ? Number(feeSummary.outstandingBalanceINR) 
                    : (activeWard?.duesINR !== undefined ? Number(activeWard.duesINR) : 0);
                  const hasPendingFee = pendingFeeAmount > 0;

                  if (hasPendingFee) {
                    return (
                      <div className="bg-gradient-to-br from-rose-950 via-pink-900/90 to-slate-950 rounded-3xl p-6 border border-rose-400/40 shadow-xl relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                <CreditCard className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 block">
                                  {t('portal.card_fees_title', 'FEES & RECEIPTS')}
                                </span>
                                <h4 className="text-sm font-bold text-white">{t('portal.card_fees_sub', 'Student Account')}</h4>
                              </div>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              {t('portal.card_fees_term_due', 'Term Due')}
                            </span>
                          </div>

                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-3xl font-black text-white font-mono tracking-tight">
                              ₹{pendingFeeAmount.toLocaleString('en-IN')}
                            </span>
                            <span className="text-xs text-rose-300 font-mono">{t('portal.card_fees_outstanding', 'Outstanding')}</span>
                          </div>

                          <p className="text-xs text-slate-300 font-mono mt-1">
                            {(invoices?.[0] as any)?.title || invoices?.[0]?.feeHead ? `${(invoices?.[0] as any)?.title || invoices[0].feeHead} • Due: ${(invoices?.[0] as any)?.dueDate || '31 Oct 2026'}` : t('portal.card_fees_due_date', 'Tuition & Lab Fee • Due by 31 Oct 2026')}
                          </p>

                          <div className="mt-3.5 p-2.5 rounded-xl bg-slate-950/70 border border-rose-500/30 text-xs font-mono space-y-1">
                            <div className="flex items-center justify-between text-slate-300">
                              <span>{t('portal.card_fees_payment_methods', 'Payment Methods:')}</span>
                              <span className="text-cyan-300 font-bold">UPI / RuPay / Cards</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span>{t('portal.card_fees_last_paid', 'Last Paid:')}</span>
                              <span className="text-emerald-400 font-semibold">
                                {receipts?.[0] ? `₹${(receipts[0].amountPaid || (receipts[0] as any)?.amount || 18500).toLocaleString('en-IN')} (${receipts[0].receiptNo || 'Rec #904'})` : '₹18,500 (Rec #904)'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-rose-500/20 flex items-center justify-between gap-2">
                          <button
                            onClick={() => {
                              setSelectedInvoiceForPay(invoices[0] || null);
                              setShowPayModal(true);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs transition-all shadow-md shadow-rose-500/20 cursor-pointer"
                          >
                            {t('portal.pay_now_btn', 'Pay Now')}
                          </button>
                          <button
                            onClick={() => setActiveTab('fees')}
                            className="text-xs text-rose-300 hover:text-white font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>{t('portal.receipts_btn', 'Receipts')}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // INACTIVE CARD STATE (When No Fee is Pending)
                  return (
                    <div className="bg-slate-900/50 rounded-3xl p-6 border border-slate-800 shadow-lg relative overflow-hidden flex flex-col justify-between opacity-80 transition-all hover:opacity-95">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-slate-800 text-slate-400 border border-slate-700">
                              <CreditCard className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                                {t('portal.card_fees_title', 'FEES & RECEIPTS')} (INACTIVE)
                              </span>
                              <h4 className="text-sm font-bold text-slate-200">{t('portal.card_fees_sub', 'Student Account')}</h4>
                            </div>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>{isHindi ? 'सभी देय राशि चुकता ✓' : 'All Dues Cleared ✓'}</span>
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-3xl font-black text-slate-300 font-mono tracking-tight">
                            ₹0
                          </span>
                          <span className="text-xs text-slate-400 font-mono">{isHindi ? 'कोई बकाया नहीं' : 'No Pending Dues'}</span>
                        </div>

                        <p className="text-xs text-slate-400 font-mono mt-1">
                          {isHindi ? 'चालू सत्र 2026-27 के सभी स्कूल शुल्क पूरी तरह चुकता हैं।' : 'All school term fees & laboratory invoices are paid up to date.'}
                        </p>

                        <div className="mt-3.5 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-xs font-mono space-y-1">
                          <div className="flex items-center justify-between text-slate-400">
                            <span>{isHindi ? 'खाता स्थिति:' : 'Account Status:'}</span>
                            <span className="text-emerald-400 font-bold">{isHindi ? 'सक्रिय एवं चुकता' : 'Zero Balance / Cleared'}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>{t('portal.card_fees_last_paid', 'Last Paid:')}</span>
                            <span className="text-slate-300 font-semibold">
                              {receipts?.[0] ? `₹${(receipts[0].amountPaid || (receipts[0] as any)?.amount || 18500).toLocaleString('en-IN')} (${receipts[0].receiptNo || 'Rec #904'})` : '₹18,500 (Rec #904)'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                        <button
                          disabled
                          className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 text-slate-500 font-bold text-xs cursor-not-allowed border border-slate-700/50"
                        >
                          {isHindi ? 'कोई देय राशि शेष नहीं (निष्क्रिय)' : 'No Dues Pending (Inactive)'}
                        </button>
                        <button
                          onClick={() => setActiveTab('fees')}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>{t('portal.receipts_btn', 'View Receipts')}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* 3. CLASS TIMETABLE & LIVE BELL CARD (Vibrant Cyan/Blue Gradient) */}
                <div className="bg-gradient-to-br from-cyan-950 via-blue-900/90 to-slate-950 rounded-3xl p-6 border border-cyan-400/40 shadow-xl relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 block">
                            {t('portal.card_timetable_title', 'TIMETABLE & ROUTINE')}
                          </span>
                          <h4 className="text-sm font-bold text-white">{t('portal.card_timetable_sub', 'Live Period Bell')}</h4>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span>
                          {timetable?.liveStatus === 'school_over'
                            ? 'Day Over'
                            : timetable?.liveStatus === 'before_school'
                            ? 'Starting Soon'
                            : timetable?.liveStatus === 'sunday'
                            ? 'Holiday'
                            : t('portal.card_timetable_in_session', 'In Session')}
                        </span>
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950/70 border border-cyan-500/30">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                          {timetable?.activePeriod?.periodNumber !== undefined ? (
                            timetable.activePeriod.isBreak
                              ? `${timetable.activePeriod.name} (Live)`
                              : `Period ${timetable.activePeriod.periodNumber} (Live)`
                          ) : 'Live Bell Pulse'}
                        </span>
                        <span className="text-xs font-mono text-slate-300">{timetable?.activePeriod?.roomNumber || 'Room 201'}</span>
                      </div>
                      <h5 className="text-base font-extrabold text-white mt-1">
                        {timetable?.activePeriod?.subjectName || 'Regular Academic Session'}
                      </h5>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        {t('portal.card_timetable_teacher', 'Teacher:')} {timetable?.activePeriod?.teacherName || 'Assigned Faculty'}
                      </p>
                      <div className="mt-2 text-xs font-mono text-cyan-300 font-bold flex flex-wrap items-center gap-1.5">
                        <Clock3 className="w-3.5 h-3.5" />
                        <span>
                          {liveMinsLeft > 0 || liveSecsLeft > 0
                            ? `${liveMinsLeft}m ${String(liveSecsLeft).padStart(2, '0')}s remaining`
                            : (timetable?.liveStatus === 'school_over'
                                ? 'School Day Concluded'
                                : (timetable?.activePeriod?.minutesRemaining
                                    ? `${timetable.activePeriod.minutesRemaining}m remaining`
                                    : 'In Session'))}
                        </span>
                        {liveIstClock && <span className="text-[10px] text-slate-400 font-normal ml-1">• {liveIstClock}</span>}
                      </div>
                    </div>

                    <div className="mt-2.5 px-3 py-2 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">{t('portal.card_timetable_next', 'Next Period:')}</span>
                      <span className="text-white font-bold">
                        {timetable?.nextPeriod?.subjectName ? `${timetable.nextPeriod.subjectName} • ${timetable.nextPeriod.startTime || 'Next'}` : (timetable?.liveStatus === 'school_over' ? 'Tomorrow 08:15 AM' : 'Routine in progress')}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-cyan-500/20 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setActiveTab('timetable')}
                      className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                    >
                      {t('portal.weekly_routine_btn', 'Weekly Routine')}
                    </button>
                    <button
                      onClick={() => setActiveTab('timetable')}
                      className="text-xs text-cyan-300 hover:text-white font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>{t('portal.full_schedule_btn', 'Full Schedule')}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 4. NOTICES & HELPLINE CARD (Vibrant Yellow/Amber Gradient) */}
                <div className="bg-gradient-to-br from-yellow-950 via-amber-900/90 to-slate-950 rounded-3xl p-6 border border-yellow-400/40 shadow-xl relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none" />

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-yellow-400 block">
                            {t('portal.card_notices_title', 'NOTICES & CIRCULARS')}
                          </span>
                          <h4 className="text-sm font-bold text-white">{t('portal.card_notices_sub', 'Official Bulletins')}</h4>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                        {t('portal.card_notices_latest', 'Latest')}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950/70 border border-yellow-500/30">
                      <div className="flex items-center justify-between text-[10px] font-mono text-yellow-300">
                        <span>{t('portal.card_notices_alert', 'Principal Office Alert')}</span>
                        <span>{notices[0]?.postedAt || 'Oct 2026'}</span>
                      </div>
                      <h5 className="text-sm font-extrabold text-white mt-1 line-clamp-1">
                        {notices[0]?.title || 'Annual Sports Day & CBSE Science Exhibition 2026'}
                      </h5>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                        {notices[0]?.content || 'Mandatory registration is now open for track & field events, science working models, and cultural performances.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-yellow-500/20 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setActiveTab('notices')}
                      className="px-3.5 py-1.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-yellow-500/20 cursor-pointer"
                    >
                      {t('portal.read_notice_btn', 'Read Notice')}
                    </button>
                    <a
                      href={`tel:${dynamicSchoolBrand.contactPhone || '+911126138999'}`}
                      className="text-xs text-yellow-300 hover:text-white font-mono font-bold flex items-center gap-1 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{t('portal.helpline_btn', 'Helpline')}</span>
                    </a>
                  </div>
                </div>

                {/* 5. LIVE BUS GPS TRACKER / ZERO-STATE CARD */}
                {transport && transport.routeNumber ? (
                  <div className="md:col-span-2 lg:col-span-2 bg-gradient-to-r from-teal-950 via-emerald-900 to-slate-950 rounded-3xl p-6 border border-teal-400/40 shadow-xl relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                            <Bus className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-400 block">
                              {t('portal.card_bus_title', 'BUS TRACKER')}
                            </span>
                            <h4 className="text-sm font-bold text-white">{t('portal.card_bus_sub', 'Live Transport GPS')}</h4>
                          </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>{t('portal.card_bus_active', 'GPS Active')}</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950/70 border border-teal-500/30 font-mono">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-white">{transport.routeNumber}</span>
                            <span className="text-xs font-bold text-emerald-400">{transport.liveGps?.speedKmH ? `${transport.liveGps.speedKmH} km/h` : '0 km/h'}</span>
                          </div>
                          <div className="text-xs text-slate-300 mt-1 truncate">
                            {transport.routeName || 'Campus Express Route'}
                          </div>
                          <div className="text-xs text-slate-300 mt-1">
                            {t('portal.card_bus_status', 'Status:')} <span className="text-emerald-300 font-bold">{transport.liveGps?.statusText || 'Scheduled / Active on Route'}</span>
                          </div>
                        </div>

                        <div className="border-t sm:border-t-0 sm:border-l border-slate-800 sm:pl-3 pt-2 sm:pt-0 flex flex-col justify-between">
                          <div className="text-[11px] text-slate-400">
                            {transport.pickupStop ? `Pickup: ${transport.pickupStop} (${transport.pickupTime || '07:15 AM'})` : 'Designated Route Stop'}
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-300 flex items-center justify-between">
                            <span>{t('portal.card_bus_driver', 'Driver:')} {transport.driverName || 'Bus Captain'}</span>
                            <a href={`tel:${transport.driverPhone || '+919811055443'}`} className="text-cyan-400 hover:underline">
                              {transport.driverPhone || '+91 98110 55443'}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-teal-500/20 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setActiveTab('bus_tracker')}
                        className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-teal-500/20 cursor-pointer"
                      >
                        {t('portal.live_map_btn', 'Live Map View')}
                      </button>
                      <a
                        href={`tel:${transport.driverPhone || dynamicSchoolBrand.contactPhone || '+911126138900'}`}
                        className="text-xs text-teal-300 hover:text-white font-mono font-bold flex items-center gap-1 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{t('portal.call_driver_btn', 'Call Driver')}</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="md:col-span-2 lg:col-span-2 bg-slate-900/80 rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-slate-800 text-slate-400 border border-slate-700">
                            <Bus className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                              SCHOOL TRANSPORT
                            </span>
                            <h4 className="text-sm font-bold text-white">No Transport Assigned (Self Commuter)</h4>
                          </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          Self / Private Drop
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 font-mono text-xs space-y-1">
                        <div className="text-slate-300 font-bold">
                          परिवहन सुविधा आवंटित नहीं (No Bus Facility Enrolled)
                        </div>
                        <div className="text-[11px] text-slate-400 font-sans">
                          This student commutes via private/parent arrangement. To enroll in school bus routes with live phone GPS tracking, submit a request.
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setActiveTab('bus_tracker')}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all cursor-pointer"
                      >
                        View Transport Details
                      </button>
                      <a
                        href={`tel:${dynamicSchoolBrand.contactPhone || '+911126138900'}`}
                        className="text-xs text-teal-400 hover:text-teal-300 font-mono font-bold flex items-center gap-1 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Transport Incharge</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

      {/* 🔙 UNIVERSAL STICKY SUB-NAV: BACK TO DAILY PULSE BUTTON */}
      {activeTab !== 'pulse' && (
        <div className="bg-slate-900/90 border border-slate-800 p-3 sm:p-4 rounded-2xl flex items-center justify-between gap-3 shadow-lg">
          <button
            type="button"
            onClick={() => setActiveTab('pulse')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs font-mono transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-cyan-500/20 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isHindi ? '← वापस डेली पल्स डैशबोर्ड' : '← Back to Daily Pulse'}</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="hidden sm:inline font-bold text-slate-300">{activeWard?.name}</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-cyan-400 font-bold uppercase">{activeTab.replace('_', ' ')}</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📅 TAB 2: ATTENDANCE & LEAVES */}
      {/* ========================================================================= */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Header & Apply Action */}
          <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-white">Live Attendance Register & Leave Desk</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Real-time verified daily roll-call records for Session 2026–27
              </p>
            </div>
            <button
              onClick={() => setShowLeaveModal(true)}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20 flex items-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Apply for Leave</span>
            </button>
          </div>

          {/* Month Heatmap Calendar */}
          <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  September 2026 Attendance Grid
                </h4>
                <div className="flex items-center gap-4 text-xs font-mono text-slate-400 mt-1">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Present</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500"></span> Absent</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500"></span> Late</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-purple-500"></span> Approved Leave</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-slate-700"></span> Holiday</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  {attendance?.attendancePercent || 94.5}%
                </div>
                <div className="text-[11px] text-slate-400 font-mono">Overall Session Rate</div>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center font-mono">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-xs font-bold text-slate-500 py-1">{d}</div>
              ))}

              {attendance?.monthlyCalendar?.map((day) => {
                let bgClass = 'bg-slate-950/60 border-slate-800 text-slate-400';
                if (day.status === 'present') bgClass = 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 font-bold';
                else if (day.status === 'absent') bgClass = 'bg-rose-950/60 border-rose-500/40 text-rose-300 font-bold';
                else if (day.status === 'late') bgClass = 'bg-amber-950/60 border-amber-500/40 text-amber-300 font-bold';
                else if (day.status === 'leave') bgClass = 'bg-purple-950/60 border-purple-500/40 text-purple-300 font-bold';
                else if (day.status === 'holiday') bgClass = 'bg-slate-900/40 border-slate-850 text-slate-600';

                return (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.status.toUpperCase()} ${day.remarks ? `(${day.remarks})` : ''}`}
                    className={`p-2.5 rounded-xl border text-xs transition-all flex flex-col items-center justify-center min-h-[50px] ${bgClass}`}
                  >
                    <span className="text-sm font-extrabold">{day.day}</span>
                    <span className="text-[9px] uppercase tracking-tighter opacity-80 mt-0.5 truncate max-w-full">
                      {day.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leave History Table */}
          <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-sm">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono mb-4">
              Leave Application History & Teacher Approvals
            </h4>

            {leaveApplications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-mono text-xs">
                No leave applications recorded for this session.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Type</th>
                      <th className="p-3">Dates</th>
                      <th className="p-3">Days</th>
                      <th className="p-3">Reason</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Teacher Review</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {leaveApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-850/40 transition-all">
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-cyan-300">
                            {app.leaveType}
                          </span>
                        </td>
                        <td className="p-3 text-slate-200">
                          {app.startDate} to {app.endDate}
                        </td>
                        <td className="p-3 font-bold text-white">{app.daysCount} Day(s)</td>
                        <td className="p-3 text-slate-300 max-w-xs truncate">{app.reason}</td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              app.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : app.status === 'rejected'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {app.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 text-[11px]">
                          {app.reviewedBy ? `${app.reviewedBy}: "${app.reviewNotes || 'Approved'}"` : 'Pending Review'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📖 TAB 3: HOMEWORK DIARY */}
      {/* ========================================================================= */}
      {activeTab === 'homework' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white">Daily Subject Homework Diary</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Track assignments, submit homework online, and parent verifications
              </p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-cyan-500/10 text-cyan-400 font-mono text-xs font-bold border border-cyan-500/30">
              {homeworkList.length} Active Tasks
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {homeworkList.map((hw) => (
              <div
                key={hw.id}
                className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 shadow-sm flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                      {hw.subject}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Due: {hw.dueDate}</span>
                  </div>
                  <h4 className="text-base font-bold text-white mt-3">{hw.title}</h4>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">{hw.description}</p>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>Teacher: {hw.assignedBy}</span>
                    <span>Assigned: {hw.assignedDate}</span>
                  </div>
                </div>

                {/* Submissions & Parent Ack Footer */}
                <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {hw.submission?.status === 'submitted' ? (
                      <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-mono">
                        <Check className="w-3.5 h-3.5" />
                        <span>Submitted</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedHomework(hw);
                          setShowHomeworkModal(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-sm cursor-pointer"
                      >
                        Submit Solution
                      </button>
                    )}

                    {hw.submission?.parentAcknowledged && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Parent Verified</span>
                      </span>
                    )}
                  </div>

                  {portalMode === 'parent' && !hw.submission?.parentAcknowledged && (
                    <button
                      onClick={() => handleParentAcknowledge(hw.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Parent Sign</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🏆 TAB 4: CBSE REPORT CARDS */}
      {/* ========================================================================= */}
      {activeTab === 'report_cards' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white">CBSE Examination Report Cards</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Official summative assessment evaluations, grading scale, and printable marksheets
              </p>
            </div>
          </div>

          {reportCards.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-mono text-xs bg-slate-900/60 rounded-3xl border border-slate-800">
              No examination report cards published yet for this student.
            </div>
          ) : (
            <div className="space-y-6">
              {reportCards.map((rc) => (
                <div
                  key={rc.examId}
                  className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-md space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                          {rc.term}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">Date: {rc.startDate} to {rc.endDate}</span>
                      </div>
                      <h4 className="text-base font-extrabold text-white mt-1">{rc.title}</h4>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right font-mono">
                        <div className="text-xl font-black text-emerald-400">{rc.summary.aggregatePercentage}%</div>
                        <div className="text-[10px] text-slate-400">CBSE Grade {rc.summary.overallGrade}</div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedReportCard(rc);
                          setShowReportCardModal(true);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Marksheet</span>
                      </button>
                    </div>
                  </div>

                  {/* Subject Scores Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                        <tr>
                          <th className="p-3">Subject</th>
                          <th className="p-3 text-center">Max Marks</th>
                          <th className="p-3 text-center">Marks Obtained</th>
                          <th className="p-3 text-center">Percentage</th>
                          <th className="p-3 text-center">CBSE Grade</th>
                          <th className="p-3 text-center">Grade Point</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {rc.subjects.map((sb, idx) => (
                          <tr key={idx} className="hover:bg-slate-850/40">
                            <td className="p-3 font-bold text-white">{sb.subject}</td>
                            <td className="p-3 text-center text-slate-400">{sb.maxMarks}</td>
                            <td className="p-3 text-center font-bold text-emerald-400">{sb.obtainedMarks}</td>
                            <td className="p-3 text-center text-slate-200">{sb.percentage}%</td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                {sb.cbseGrade}
                              </span>
                            </td>
                            <td className="p-3 text-center font-bold text-white">{sb.gradePoint}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-950/80 font-bold border-t border-slate-700">
                        <tr>
                          <td className="p-3 text-white">Grand Aggregate</td>
                          <td className="p-3 text-center text-slate-400">{rc.summary.totalMaxMarks}</td>
                          <td className="p-3 text-center text-emerald-400">{rc.summary.totalObtainedMarks}</td>
                          <td className="p-3 text-center text-white">{rc.summary.aggregatePercentage}%</td>
                          <td className="p-3 text-center text-cyan-300">{rc.summary.overallGrade}</td>
                          <td className="p-3 text-center text-white">{rc.summary.cumulativeGpa} GPA</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono text-slate-300 flex items-center justify-between">
                    <span>Teacher Remarks: <em>"{rc.summary.teacherRemarks}"</em></span>
                    <span className="text-emerald-400 font-bold">{rc.summary.resultStatus}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💳 TAB 5: FEES & ONLINE PAYMENTS */}
      {/* ========================================================================= */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white">School Fee Ledger & Online Settlement</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Instant UPI, NetBanking & Card payment gateway with digital receipts
              </p>
            </div>
            {(feeSummary?.outstandingBalanceINR || 0) > 0 && (
              <button
                onClick={() => {
                  setSelectedInvoiceForPay(invoices[0] || null);
                  setShowPayModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs transition-all shadow-md shadow-cyan-500/25 flex items-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Instant UPI Checkout</span>
              </button>
            )}
          </div>

          {/* Fee Demand Invoices */}
          <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-sm">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono mb-4">
              Demands & Invoices
            </h4>

            <div className="space-y-3">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-400">{inv.invoiceNo}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          inv.status === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                    <h5 className="text-sm font-bold text-white mt-1">{inv.feeHead}</h5>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">Due Date: {inv.dueDate}</div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right font-mono">
                      <div className="text-base font-black text-white">
                        ₹{(inv.netAmount || inv.baseAmount || 0).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {inv.status === 'paid' ? 'Paid in Full' : `Balance: ₹${(inv.balanceAmount || inv.netAmount || 0).toLocaleString('en-IN')}`}
                      </div>
                    </div>

                    {inv.status !== 'paid' && (
                      <button
                        onClick={() => {
                          setSelectedInvoiceForPay(inv);
                          setShowPayModal(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs transition-all shadow-sm cursor-pointer"
                      >
                        Pay ₹{inv.balanceAmount || inv.netAmount}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Paid Receipts Ledger */}
          <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-sm">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono mb-4">
              Payment Receipts History
            </h4>

            {receipts.length === 0 ? (
              <div className="p-6 text-center text-slate-500 font-mono text-xs">
                No past payment receipts recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Receipt #</th>
                      <th className="p-3">Fee Head</th>
                      <th className="p-3">Mode</th>
                      <th className="p-3">Amount Paid</th>
                      <th className="p-3">Date</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {receipts.map((rcp, idx) => (
                      <tr key={idx} className="hover:bg-slate-850/40">
                        <td className="p-3 font-bold text-cyan-400">{rcp.receiptNo}</td>
                        <td className="p-3 text-white">{rcp.feeHead}</td>
                        <td className="p-3 text-slate-300 uppercase">{rcp.paymentMode}</td>
                        <td className="p-3 font-bold text-emerald-400">
                          ₹{Number(rcp.amountPaid).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-slate-400">{rcp.paymentDate?.slice(0, 10)}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setLatestReceipt(rcp);
                              onShowToast('info', `Receipt: ${rcp.receiptNo}`, 'Ready for printing / download');
                            }}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-bold border border-slate-700"
                          >
                            Print Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⏰ TAB 6: TIMETABLE & BELL SCHEDULE */}
      {/* ========================================================================= */}
      {activeTab === 'timetable' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white">Class Timetable & Weekly Routine</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Weekly period timetable for {timetable?.grade || 'Class 10'}-{timetable?.section || 'A'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="hidden sm:inline-block px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                8 Periods Scheduled
              </span>

              <button
                type="button"
                onClick={() => {
                  try {
                    const wb = XLSX.utils.book_new();
                    const wsData: any[][] = [
                      [`CLASS TIMETABLE: ${(timetable?.grade || 'Class 10').toUpperCase()} - SECTION ${(timetable?.section || 'A').toUpperCase()}`],
                      [`Session: 2026-27 | Generated on: ${new Date().toLocaleDateString('en-IN')} (IST)`],
                      [],
                      ['Day', 'Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6', 'Period 7', 'Period 8']
                    ];
                    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].forEach(day => {
                      const dSlots = timetable?.weeklyRoutine?.[day] || [];
                      const row = [day];
                      for (let p = 1; p <= 8; p++) {
                        const s = dSlots.find((x: any) => x.periodNumber === p);
                        row.push(s ? `${s.subjectName} (${s.teacherName || 'Faculty'}, Rm ${s.roomNumber || '201'})` : 'Free');
                      }
                      wsData.push(row);
                    });
                    const ws = XLSX.utils.aoa_to_sheet(wsData);
                    XLSX.utils.book_append_sheet(wb, ws, 'Class_Routine');
                    XLSX.writeFile(wb, `Class_${(timetable?.grade || '10').replace(/\s+/g, '_')}_${timetable?.section || 'A'}_Routine.xlsx`);
                    onShowToast('success', 'Excel Exported! 📊', 'Class routine downloaded successfully.');
                  } catch (e: any) {
                    onShowToast('error', 'Export Failed', e.message);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                title="Download Class Routine as Excel Spreadsheet"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                title="Print Class Routine for Study Table / Fridge"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PDF</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => {
              const daySlots = timetable?.weeklyRoutine?.[day] || [];
              return (
                <div key={day} className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h4 className="text-sm font-extrabold text-white">{day}</h4>
                    <span className="text-[10px] font-mono text-cyan-400">{daySlots.length} Periods</span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {daySlots.length === 0 ? (
                      <div className="p-4 text-center text-slate-500 text-xs font-mono">
                        Routine will be posted by academic coordinator.
                      </div>
                    ) : (
                      daySlots.map((slot) => (
                        <div
                          key={slot.id}
                          className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="text-[10px] font-mono text-slate-500">Period {slot.periodNumber}</div>
                            <div className="font-bold text-white truncate max-w-[130px]">{slot.subjectName}</div>
                            <div className="text-[10px] text-slate-400">{slot.teacherName}</div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-300 border border-slate-800">
                            {slot.roomNumber || 'Room'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚌 TAB 7: LIVE BUS TRACKER & INTERACTIVE MAP */}
      {/* ========================================================================= */}
      {activeTab === 'bus_tracker' && (
        <div className="space-y-6">
          {transport && transport.routeNumber ? (
            <>
              {/* Header with Route info & Driver Console Button */}
              <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      LIVE ROUTE ACTIVE
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-mono text-cyan-400 font-bold">{transport.vehicleNumber || 'DL 1P C 4521'}</span>
                  </div>
                  <h3 className="text-lg font-black text-white mt-1">
                    {transport.routeNumber}: {transport.routeName}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Live OpenStreetMap Driver Telemetry • Updates Every 4 Seconds
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsDriverModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>📱 Driver Phone Console</span>
                  </button>

                  <a
                    href={`tel:${transport.driverPhone || '+919811055443'}`}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all border border-slate-700 flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span>Call Driver ({transport.driverName || 'Jagdish Chandra'})</span>
                  </a>
                </div>
              </div>

              {/* Interactive OpenStreetMap Leaflet Canvas Component */}
              <LiveBusMap 
                transport={transport} 
                studentPickupStop={transport.pickupStop} 
                onOpenDriverModal={() => setIsDriverModalOpen(true)}
              />

              {/* Route Stops Timeline & Crew Info */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Route Stops & Timetable (मार्ग स्टॉप एवं समय सारिणी)
                  </h4>
                  <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
                    {transport.stops?.map((stop, idx) => (
                      <div key={idx} className="relative flex items-center gap-4 pl-8">
                        <div className="absolute left-2 w-3.5 h-3.5 rounded-full bg-cyan-400 ring-4 ring-slate-900"></div>
                        <div className="flex-1 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                          <div>
                            <h5 className="text-xs font-bold text-white">{stop.stopName}</h5>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Pickup: {stop.pickupTime} • Drop: {stop.dropTime}
                            </div>
                          </div>
                          {idx === 0 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Your Designated Stop
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Transport Crew & Safety
                  </h4>
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Route Number:</span>
                      <span className="font-bold text-cyan-400">{transport.routeNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Vehicle Reg:</span>
                      <span className="font-bold text-white">{transport.vehicleNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bus Captain:</span>
                      <span className="font-bold text-white">{transport.driverName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Driver Phone:</span>
                      <span className="font-bold text-emerald-400">{transport.driverPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Emergency SOS:</span>
                      <span className="font-bold text-rose-400">{transport.emergencySosContact || '+91 11 2613 8900'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ZERO STATE: Clean & Authentic No Transport Assigned */
            <div className="space-y-6">
              <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white">School Bus & Transport Facility</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Status: No Institutional Transport Assigned (निजी आवागमन / Self Commuter)
                  </p>
                </div>
              </div>

              <div className="p-10 rounded-3xl bg-slate-900/60 border border-slate-800 text-center max-w-xl mx-auto space-y-5">
                <div className="w-16 h-16 rounded-3xl bg-slate-800 text-teal-400 flex items-center justify-center mx-auto border border-slate-700 shadow-xl">
                  <Bus className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">
                    No Institutional School Bus Assigned for {profile?.name || activeWard?.name || 'this Student'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed font-sans">
                    छात्र वर्तमान में स्व-परिवहन (Private / Parent Commute) मोड पर पंजीकृत है। यदि आप स्कूल बस रूट आवंटित कराना चाहते हैं या बस रूट की जानकारी चाहते हैं, तो स्कूल ट्रांसपोर्ट हेल्पडेस्क से संपर्क करें।
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  <a
                    href={`tel:${dynamicSchoolBrand.contactPhone || '+911126138900'}`}
                    className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-teal-500/20 flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Contact Bus Helpdesk</span>
                  </a>
                  <button
                    onClick={() => setIsDriverModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-cyan-500/30 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    <span>Driver Phone Simulator</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📢 TAB 8: NOTICES & HELPLINE */}
      {/* ========================================================================= */}
      {activeTab === 'notices' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white">School Circulars & Direct Contact Hotline</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Official institutional notifications and 24x7 helpdesk directory
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notices Feed */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                School Circulars ({notices.length})
              </h4>

              {notices.map((nt) => (
                <div
                  key={nt.id}
                  className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        nt.category === 'urgent'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : nt.category === 'exam'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {nt.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{nt.postedAt}</span>
                  </div>
                  <h5 className="text-sm font-bold text-white">{nt.title}</h5>
                  <p className="text-xs text-slate-300 leading-relaxed">{nt.content}</p>
                  <div className="text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800/80">
                    Broadcasted By: {nt.postedBy}
                  </div>
                </div>
              ))}
            </div>

            {/* Helpline Directory */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Official Campus Hotline Directory
              </h4>

              <div className="space-y-3">
                {emergencyHelpline.map((contact, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-white">{contact.department}</h5>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{contact.contactPerson}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{contact.hours}</div>
                    </div>
                    <a
                      href={`tel:${contact.phone}`}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{contact.phone}</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🪪 TAB 9: DIGITAL STUDENT ID BADGE */}
      {/* ========================================================================= */}
      {activeTab === 'id_badge' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white">Digital Student Identity Badge</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Official CBSE-verified gate pass identity card with turnstile QR scan code
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold transition-all border border-slate-700 flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Badge</span>
            </button>
          </div>

          <div className="flex justify-center">
            {/* Front of ID Card */}
            <div className="w-full max-w-md bg-gradient-to-tr from-slate-950 via-indigo-950 to-slate-900 rounded-3xl border-2 border-cyan-500/40 p-6 shadow-2xl relative overflow-hidden">
              <div className="text-center pb-4 border-b border-white/10">
                <h4 className="text-base font-black text-white uppercase tracking-wider">
                  {activeSchoolName}
                </h4>
                <p className="text-[10px] font-mono text-cyan-300 mt-0.5">
                  Affiliated to CBSE #{profile?.schoolAffiliation?.affiliationNo || 'CBSE-AFF-2130894'} • Code: {profile?.schoolAffiliation?.schoolCode || 'DPS-VK-894'}
                </p>
              </div>

              <div className="flex items-start sm:items-center gap-5 mt-6">
                <div
                  onClick={() => setShowStudentDetailModal(true)}
                  className="relative group cursor-pointer shrink-0"
                  title="Click student picture to view Full Student Details"
                >
                  <img
                    src={profile?.avatarUrl || activeWard?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                    alt={profile?.name || activeWard?.name}
                    className="w-24 h-32 rounded-2xl object-cover ring-2 ring-cyan-400 group-hover:ring-cyan-300 shadow-xl transition-all group-hover:scale-105"
                  />
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-950/80 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
                    <Eye className="w-2.5 h-2.5" />
                    <span>View</span>
                  </span>
                </div>

                <div className="space-y-1 text-xs font-mono min-w-0">
                  <div className="text-base font-black text-white">{profile?.name || activeWard?.name || 'Mira Pandey'}</div>
                  <div className="text-cyan-300 font-bold">
                    Class & Sec: {profile?.grade || activeWard?.grade || 'Class 10'} - {profile?.section || activeWard?.section || 'A'}
                  </div>
                  <div className="text-amber-300 font-bold">
                    PEN No: <span className="font-mono text-white">{profile?.penNo || activeWard?.penNo || (profile as any)?.pen_no || '20260711080'}</span>
                  </div>
                  <div className="text-slate-200">
                    Admission No: <span className="font-bold text-white">{profile?.admissionNo || activeWard?.admissionNo || (profile as any)?.admission_no || 'DKS-2026-080'}</span>
                  </div>
                  <div className="text-slate-300">
                    Roll No: <span className="font-bold text-white">#{profile?.rollNo || activeWard?.rollNo || 'R-02'}</span>
                  </div>
                  <div className="text-slate-300">
                    Blood Group: <span className="px-1.5 py-0.2 rounded font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">{profile?.bloodGroup || activeWard?.bloodGroup || (profile as any)?.blood_group || 'O+'}</span>
                  </div>
                  <div className="text-slate-300 text-[11px]">
                    DOB: <span className="font-bold text-slate-200">{profile?.dob || activeWard?.dob || (profile as any)?.date_of_birth || '2010-09-15'}</span>
                  </div>
                  <div className="text-emerald-400 text-[10px] pt-0.5">
                    Class Teacher: {profile?.classTeacher || activeWard?.classTeacher || 'Vikramaditya Singh (Class Teacher)'}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="space-y-0.5 text-[10px] font-mono text-slate-400">
                  <div>Parent: {profile?.parentName || 'Vikram Sharma'}</div>
                  <div>Emergency: {profile?.parentPhone || '+91 98765 43210'}</div>
                  <div>Valid for Session 2026–27</div>
                </div>

                <div className="w-16 h-16 bg-white p-1 rounded-xl flex items-center justify-center">
                  <QrCode className="w-14 h-14 text-slate-950" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ TAB 10: NEP 2020 SKILL PASSPORT & HOLISTIC PROGRESS CARD (HPC) */}
      {/* ========================================================================= */}
      {activeTab === 'skill_passport' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header Banner */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  NEP 2020 Aligned • 360° Assessment
                </span>
                <span className="text-xs text-slate-400 font-mono">Holistic Progress Card (HPC)</span>
              </div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-cyan-400" />
                <span>Digital Skill Passport & Learner Portfolio</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Multidimensional evaluation covering cognitive, socio-emotional, creative, and co-scholastic domains.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Download Official HPC (PDF)</span>
              </button>
            </div>
          </div>

          {/* 21st Century Skills & Holistic Radar */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-slate-900/40 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>21st Century Core Competencies & Co-Scholastic Domains</span>
              </h4>
              <span className="text-xs font-mono text-cyan-300 font-bold">Overall Index: 92.4% (Exemplary)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 font-mono text-xs">
              {[
                { name: 'Cognitive & Problem Solving', score: 94, color: 'from-cyan-500 to-blue-600', note: 'Advanced mathematical logic' },
                { name: 'Social-Emotional & Collaboration', score: 92, color: 'from-emerald-500 to-teal-600', note: 'Peer mentor & team player' },
                { name: 'Creativity & Design Thinking', score: 88, color: 'from-purple-500 to-pink-600', note: 'Innovative project ideas' },
                { name: 'Digital & AI Literacy', score: 96, color: 'from-amber-500 to-orange-600', note: 'Python & computational thinking' },
                { name: 'Physical Fitness & Sports', score: 90, color: 'from-rose-500 to-red-600', note: 'Football team captain' },
              ].map((skill, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px] truncate">{skill.name}</span>
                    <span className="text-white font-bold text-sm">{skill.score}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${skill.color}`}
                      style={{ width: `${skill.score}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">{skill.note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 360-Degree Tripartite Evaluation (NEP 2020) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
            {/* 1. Self-Evaluation & Reflection */}
            <div className="glass-panel p-5 rounded-3xl border border-slate-800 bg-slate-900/50 space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm border-b border-slate-800 pb-2">
                <Sparkles className="w-4 h-4" />
                <span>Self-Evaluation & Student Voice</span>
              </div>
              <div className="space-y-3 text-slate-300">
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-500 text-[11px] block mb-1">My Strengths:</span>
                  <p>"I enjoy solving complex quadratic equations and writing algorithms in Python. I feel confident presenting our science exhibition models."</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-500 text-[11px] block mb-1">Growth Areas I'm Working On:</span>
                  <p>"Managing exam time better for long descriptive answers in Physics and Social Science."</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-500 text-[11px] block mb-1">My Goals for Term 2:</span>
                  <p>"Participate in the CBSE Regional Science Exhibition and maintain 95%+ attendance."</p>
                </div>
              </div>
            </div>

            {/* 2. Peer Review & Teamwork Feedback */}
            <div className="glass-panel p-5 rounded-3xl border border-slate-800 bg-slate-900/50 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm border-b border-slate-800 pb-2">
                <Users className="w-4 h-4" />
                <span>Peer Review & Teamwork (4.9/5.0)</span>
              </div>
              <div className="space-y-3 text-slate-300">
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-500 text-[11px] block mb-1">Lab Group Partner Review:</span>
                  <p>"Aarav takes initiative in our Chemistry practicals and explains calculations very clearly to all group members."</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-500 text-[11px] block mb-1">Debate Team Teammate:</span>
                  <p>"Great team collaborator. Prepared reliable rebuttals and shared research notes generously."</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-500 text-[11px] block mb-1">Sports Squad Member:</span>
                  <p>"Encouraging captain on the field; always motivates players during tough second-half situations."</p>
                </div>
              </div>
            </div>

            {/* 3. Class Teacher & Faculty Remarks */}
            <div className="glass-panel p-5 rounded-3xl border border-slate-800 bg-slate-900/50 space-y-3">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm border-b border-slate-800 pb-2">
                <BookOpen className="w-4 h-4" />
                <span>Teacher Qualitative Remarks</span>
              </div>
              <div className="space-y-3 text-slate-300">
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-purple-300 text-[11px] font-bold block mb-1">Class Teacher (Rajeev Malhotra):</span>
                  <p>"Demonstrates exceptional intellectual curiosity and ethical leadership. Consistent in assignments and treats peers with utmost empathy."</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-cyan-300 text-[11px] font-bold block mb-1">Science Faculty (Dr. S. K. Verma):</span>
                  <p>"Outstanding aptitude in experimental sciences. Analytical thinking is well above standard grade level."</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-amber-300 text-[11px] font-bold block mb-1">Physical Education Incharge:</span>
                  <p>"Exemplary sportsmanship and discipline. Selected to lead the school under-16 football contingent."</p>
                </div>
              </div>
            </div>
          </div>

          {/* Micro-Credentials & Verified Digital Badges */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-slate-900/40 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-cyan-400" />
                <span>Verified Micro-Credentials & Digital Badges</span>
              </h4>
              <span className="text-xs font-mono text-slate-400">Cryptographically signed by School Trust</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
              {[
                { title: 'National Science Olympiad', level: 'Gold Medalist (AIR 14)', issuer: 'Science Olympiad Foundation', year: '2026', badge: '🥇' },
                { title: 'CBSE AI & Python Hackathon', level: 'Regional Finalist', issuer: 'CBSE Skill Education', year: '2026', badge: '💻' },
                { title: 'Inter-School MUN Debate', level: 'Best Delegate (UNEP)', issuer: 'DPS Society MUN', year: '2025', badge: '🗣️' },
                { title: 'Green Campus Eco-Warrior', level: 'Level 3 Distinction', issuer: 'School Sustainability Club', year: '2026', badge: '🌿' },
              ].map((badge, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/90 space-y-2 hover:border-cyan-500/40 transition-all">
                  <div className="text-3xl">{badge.badge}</div>
                  <h5 className="font-bold text-white text-xs">{badge.title}</h5>
                  <div className="text-cyan-300 font-medium text-[11px]">{badge.level}</div>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                    <div>{badge.issuer}</div>
                    <div>Year: {badge.year} • Verified ✅</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🤖 TAB 11: 24/7 DAKSHORA AI STUDENT DOUBT SOLVER & REVISION PARTNER */}
      {/* ========================================================================= */}
      {activeTab === 'ai_tutor' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header Banner */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  24/7 AI Study Partner
                </span>
                <span className="text-xs text-slate-400 font-mono">CBSE / NCERT Syllabus Aligned</span>
              </div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Bot className="w-6 h-6 text-purple-400" />
                <span>Dakshora AI Student Doubt Solver & Revision Co-Pilot</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Instant step-by-step doubt resolution, conceptual analogies, and guided hint mode.
              </p>
            </div>

            {/* Subject Selector */}
            <div className="flex items-center gap-3">
              <select
                value={doubtSubject}
                onChange={(e) => setDoubtSubject(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="Mathematics">Mathematics</option>
                <option value="Science">Science (Physics/Chem/Bio)</option>
                <option value="English">English</option>
                <option value="Social Science">Social Science</option>
                <option value="Computer Science">Computer Science</option>
              </select>

              {/* Hint Toggle */}
              <button
                type="button"
                onClick={() => setGiveHintOnly(!giveHintOnly)}
                className={`px-3 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                  giveHintOnly
                    ? 'bg-amber-950/70 border-amber-400 text-amber-300 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                }`}
                title="When ON, AI gives hints and guiding clues instead of direct answers"
              >
                <span>💡 Hint Mode</span>
                <span className={`w-2 h-2 rounded-full ${giveHintOnly ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
              </button>
            </div>
          </div>

          {/* Quick Concept Starters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-[11px] font-mono text-slate-400 shrink-0">Try asking:</span>
            {[
              "Explain Snell's Law with a practical ray diagram",
              "How to solve quadratic equations by splitting middle term?",
              "What is the function of stomata in desert plants?",
              "Summary of Non-Cooperation Movement for Class 10",
              "Difference between stack and queue in Python"
            ].map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendDoubt(prompt)}
                className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono shrink-0 transition-all cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Stream Window */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-800 bg-slate-950/60 min-h-[380px] max-h-[500px] overflow-y-auto space-y-4 font-mono text-xs">
            {doubtMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl p-4 rounded-2xl border ${
                    msg.role === 'user'
                      ? 'bg-purple-950/40 border-purple-500/40 text-purple-100'
                      : 'bg-slate-900/90 border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1 text-[10px] text-slate-400">
                    <span className="font-bold text-cyan-400">
                      {msg.role === 'user' ? 'You (Student)' : 'Dakshora AI Partner'}
                      {msg.hintOnly && ' • 💡 Hint Mode'}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-cyan-600 flex items-center justify-center text-white shrink-0 font-bold">
                    S
                  </div>
                )}
              </div>
            ))}

            {doubtLoading && (
              <div className="flex items-center gap-3 text-purple-400 text-xs font-mono">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Thinking through pedagogical steps...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendDoubt();
            }}
            className="flex items-center gap-2 p-2 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-xs"
          >
            <input
              type="text"
              placeholder={`Ask your ${doubtSubject} question or paste a problem...`}
              value={doubtInput}
              onChange={(e) => setDoubtInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-transparent text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={doubtLoading || !doubtInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-purple-500/20 disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask AI</span>
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📝 MODAL: APPLY FOR LEAVE */}
      {/* ========================================================================= */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowLeaveModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">{t('portal.modal_leave_title', 'Apply for Student Leave')}</h3>
            </div>

            <form onSubmit={handleLeaveSubmit} className="space-y-4 text-xs font-mono">
              {/* Automatic Verified Student Identity Card */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    {isHindi ? 'विद्यार्थी विवरण (स्वचालित रूप से भरा हुआ)' : 'Student Details (Auto-Populated)'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live ERP
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-mono">Student Name & Roll No:</span>
                    <span className="text-sm font-extrabold text-white block mt-0.5">
                      {activeWard?.name || profile?.name || 'Advik Chaudhary'}
                    </span>
                    <span className="text-xs text-purple-300 font-mono font-bold block mt-0.5">
                      Roll #{activeWard?.rollNo || profile?.rollNo || '01'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-mono">Class & Admission No:</span>
                    <span className="text-sm font-extrabold text-cyan-300 block mt-0.5">
                      {activeWard?.grade || profile?.grade || 'Class 10'}-{activeWard?.section || profile?.section || 'A'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono block mt-0.5">
                      Adm: {activeWard?.admissionNo || profile?.admissionNo || 'DKS-2026-079'}
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-300">Class Teacher (Reviewer):</span>
                  <span className="text-amber-300 font-bold">Vikramaditya Singh (Class 10-A)</span>
                </div>

                <div className="pt-1 text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{isHindi ? 'यह आवेदन सीधे कक्षा अध्यापक विक्रम आदित्य सिंह को समीक्षा व उपस्थिति स्वीकृति हेतु भेजा जाएगा।' : 'This application is routed directly to Class Teacher Vikramaditya Singh for attendance review & approval.'}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">{t('portal.modal_leave_type', 'Leave Category')}</label>
                <select
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                >
                  <option value="sick">{isHindi ? 'बीमारी / चिकित्सीय अवकाश' : 'Sick / Medical Leave'}</option>
                  <option value="casual">{isHindi ? 'आकस्मिक / पारिवारिक समारोह अवकाश' : 'Casual / Family Function Leave'}</option>
                  <option value="emergency">{isHindi ? 'पारिवारिक आपातकालीन अवकाश' : 'Family Emergency Leave'}</option>
                  <option value="planned">{isHindi ? 'नियोजित शहर से बाहर यात्रा' : 'Planned Outstation Travel'}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">{t('portal.modal_leave_start', 'Start Date')}</label>
                  <input
                    type="date"
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">{t('portal.modal_leave_end', 'End Date')}</label>
                  <input
                    type="date"
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">{t('portal.modal_leave_reason', 'Reason for Leave')} *</label>
                <textarea
                  rows={3}
                  required
                  placeholder={isHindi ? 'अवकाश का कारण स्पष्ट रूप से लिखें...' : 'Explain why the student is requesting leave...'}
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submittingLeave}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold flex items-center gap-1.5 shadow-md shadow-cyan-500/25"
                >
                  {submittingLeave ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>{t('portal.modal_leave_submit', 'Submit to Teacher')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💳 MODAL: INSTANT FEE PAY */}
      {/* ========================================================================= */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowPayModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">{t('portal.modal_pay_title', 'Instant School Fee Settlement')}</h3>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-slate-400">{isHindi ? 'चालान:' : 'Invoice:'} {selectedInvoiceForPay?.invoiceNo || 'INV-2026-ONLINE'}</div>
                <div className="text-sm font-bold text-white">{selectedInvoiceForPay?.feeHead || (isHindi ? 'मिश्रित शिक्षण शुल्क' : 'Composite Tuition Fee')}</div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  <span className="text-slate-400">{t('portal.modal_pay_amount', 'Payable Amount')}:</span>
                  <span className="text-lg font-black text-emerald-400">
                    ₹{(selectedInvoiceForPay?.balanceAmount || selectedInvoiceForPay?.netAmount || activeWard?.duesINR || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-2">{isHindi ? 'भुगतान माध्यम' : 'Payment Mode'}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'upi', label: '⚡ UPI / QR' },
                    { id: 'card', label: isHindi ? '💳 कार्ड' : '💳 Card' },
                    { id: 'bank_transfer', label: isHindi ? '🏦 नेटबैंकिंग' : '🏦 NetBanking' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMode(m.id as any)}
                      className={`py-2 rounded-xl border text-center font-bold text-xs transition-all ${
                        paymentMode === m.id
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="w-1/3 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer text-center"
                >
                  {isHindi ? 'रद्द करें / वापस जाएँ' : 'Cancel / Back'}
                </button>
                <button
                  onClick={handlePayFee}
                  disabled={payingFee}
                  className="w-2/3 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {payingFee ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  <span>{payingFee ? (isHindi ? 'भुगतान प्रक्रियाधीन...' : 'Processing Payment...') : (isHindi ? 'ऑनलाइन फीस जमा करें (Pay Online)' : 'Pay Online (Razorpay / Instant UPI)')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📚 MODAL: SUBMIT HOMEWORK */}
      {/* ========================================================================= */}
      {showHomeworkModal && selectedHomework && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowHomeworkModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">{isHindi ? 'गृहकार्य असाइनमेंट जमा करें' : 'Submit Homework Assignment'}</h3>
            </div>

            <form onSubmit={handleHomeworkSubmit} className="space-y-4 text-xs font-mono">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-cyan-400 font-bold">{selectedHomework.subject}</div>
                <div className="text-sm font-extrabold text-white mt-0.5">{selectedHomework.title}</div>
                <div className="text-slate-400 mt-1">{selectedHomework.description}</div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">{isHindi ? 'छात्र उत्तर / असाइनमेंट नोट्स' : 'Student Answer / Work Submission Notes'}</label>
                <textarea
                  rows={4}
                  required
                  placeholder={isHindi ? 'अपने नोट्स, समाधान का सारांश या लिंक यहाँ लिखें...' : 'Type your notes, solution summary, or links to digital notebook...'}
                  value={homeworkSubmissionText}
                  onChange={(e) => setHomeworkSubmissionText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowHomeworkModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  {isHindi ? 'रद्द करें / वापस जाएँ' : 'Cancel / Back'}
                </button>
                <button
                  type="submit"
                  disabled={submittingHomework}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold flex items-center gap-1.5 shadow-md shadow-cyan-500/25"
                >
                  {submittingHomework ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>{isHindi ? 'अध्यापक को जमा करें' : 'Submit to Teacher'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📜 MODAL: CBSE MARKSHEET & REPORT CARD POPUP */}
      {/* ========================================================================= */}
      {showReportCardModal && selectedReportCard && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl relative font-mono text-xs">
            <button
              onClick={() => setShowReportCardModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-4 border-b border-purple-500/30">
              <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider font-bold">
                CENTRAL BOARD OF SECONDARY EDUCATION
              </span>
              <h3 className="text-lg font-black text-white mt-1">
                {selectedReportCard.title || 'CBSE Term Assessment Report Card'}
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Session 2026–27 • {activeWard?.name} • Class {activeWard?.grade}-{activeWard?.section} (Roll #{activeWard?.rollNo})
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="text-slate-400 text-[10px]">CGPA</div>
                <div className="text-xl font-black text-white mt-0.5">{selectedReportCard.summary?.cumulativeGpa || 9.6} / 10</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="text-slate-400 text-[10px]">AGGREGATE</div>
                <div className="text-xl font-black text-emerald-400 mt-0.5">{selectedReportCard.summary?.aggregatePercentage || 92.2}%</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="text-slate-400 text-[10px]">CLASS RANK</div>
                <div className="text-xl font-black text-cyan-400 mt-0.5">#{selectedReportCard.summary?.classRank || 1}</div>
              </div>
            </div>

            <div className="overflow-x-auto my-4 max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Subject</th>
                    <th className="p-2.5 text-center">Max</th>
                    <th className="p-2.5 text-center">Marks</th>
                    <th className="p-2.5 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {(selectedReportCard.subjects || []).map((sb: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-bold text-white">{sb.subject}</td>
                      <td className="p-2.5 text-center text-slate-400">{sb.maxMarks}</td>
                      <td className="p-2.5 text-center font-bold text-emerald-400">{sb.obtainedMarks}</td>
                      <td className="p-2.5 text-center text-cyan-300 font-bold">{sb.cbseGrade || sb.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-purple-500/20">
              <button
                type="button"
                onClick={() => setShowReportCardModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                {isHindi ? 'वापस जाएँ' : 'Close / Back'}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-500/20"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Marksheet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🪪 MODAL: DIGITAL ID CARD POPUP */}
      {/* ========================================================================= */}
      {/* 👤 MODAL: FULL STUDENT RECORD & MASTER PROFILE */}
      {/* ========================================================================= */}
      {showStudentDetailModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/80 border-2 border-cyan-500/40 rounded-3xl max-w-4xl w-full p-5 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto font-mono scrollbar-thin">
            {/* Top Close Button */}
            <button
              onClick={() => setShowStudentDetailModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900/80 border border-slate-700/80 transition-all hover:scale-105 cursor-pointer z-10"
              aria-label="Close Profile Modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* School Header */}
            <div className="flex items-center gap-3.5 pb-5 border-b border-white/10">
              <div className="w-12 h-12 rounded-2xl bg-white p-1 border border-slate-700 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src={schoolLogo}
                  alt={activeSchoolName}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (!target.src.includes('new-ideal-logo.svg')) {
                      target.src = '/assets/schools/new-ideal-logo.svg';
                    }
                  }}
                />
              </div>
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">
                  CBSE INSTITUTIONAL RECORD • SESSION {profile?.academicSession || '2026–27'}
                </span>
                <h3 className="text-base sm:text-lg font-black text-white">{activeSchoolName}</h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Affiliation No: <strong className="text-slate-200">{profile?.schoolAffiliation?.affiliationNo || activeAffiliationNo}</strong> • School Code: <strong className="text-slate-200">{profile?.schoolAffiliation?.schoolCode || activeSchoolCode}</strong> • Board: <strong className="text-cyan-300">CBSE</strong>
                </p>
              </div>
            </div>

            {/* Student Top Identity Banner */}
            <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <img
                    src={profile?.avatarUrl || activeWard?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                    alt={profile?.name || activeWard?.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-2 ring-cyan-400 shadow-lg"
                  />
                  <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500 text-slate-950 ring-2 ring-slate-950">
                    Active ✓
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-2xl font-black text-white">
                      {profile?.name || activeWard?.name || 'Mira Pandey'}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      CBSE Verified
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 font-mono mt-1">
                    Class: <strong className="text-cyan-300">{profile?.grade || activeWard?.grade || 'Class 10'}-{profile?.section || activeWard?.section || 'A'}</strong> • Roll Number: <strong className="text-purple-300">#{profile?.rollNo || activeWard?.rollNo || 'R-02'}</strong>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Assigned Class Teacher: <strong className="text-amber-300">{profile?.classTeacher || activeWard?.classTeacher || 'Vikramaditya Singh (Class Teacher)'}</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Dossier</span>
                </button>
              </div>
            </div>

            {/* 4 Multi-Column Information Cards */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              {/* CARD 1: Official Academic & Enrollment Credentials */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Award className="w-4 h-4 text-cyan-400" />
                  <h4 className="font-bold text-white uppercase text-[11px] tracking-wide">
                    1. Academic & Enrollment Credentials
                  </h4>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Permanent Education No (PEN):</span>
                  <span className="font-bold text-cyan-300 text-sm bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                    {profile?.penNo || activeWard?.penNo || (profile as any)?.pen_no || '20260711080'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Admission Number:</span>
                  <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {profile?.admissionNo || activeWard?.admissionNo || (profile as any)?.admission_no || 'DKS-2026-080'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Admission Date:</span>
                  <span className="text-slate-200">{profile?.admissionDate || activeWard?.admissionDate || '2026-04-01'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Current Academic Session:</span>
                  <span className="text-slate-200">{profile?.academicSession || activeWard?.academicSession || '2026-27'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Curriculum / Board:</span>
                  <span className="text-emerald-400 font-bold">CBSE New Delhi (NCERT NEP-2020)</span>
                </div>
              </div>

              {/* CARD 2: Personal & Biometric Details */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Users className="w-4 h-4 text-purple-400" />
                  <h4 className="font-bold text-white uppercase text-[11px] tracking-wide">
                    2. Personal & Biometric Profile
                  </h4>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Date of Birth (DOB):</span>
                  <span className="font-bold text-white">
                    {profile?.dob || activeWard?.dob || (profile as any)?.date_of_birth || '2010-09-15'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Blood Group:</span>
                  <span className="font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
                    {profile?.bloodGroup || activeWard?.bloodGroup || (profile as any)?.blood_group || 'O+'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Gender:</span>
                  <span className="text-slate-200 capitalize">{profile?.gender || activeWard?.gender || 'Female'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Nationality & Medium:</span>
                  <span className="text-slate-200">Indian • English Medium</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Aadhaar Verification:</span>
                  <span className="text-emerald-400 font-bold">Verified ✓ (UIDAI Vault Linked)</span>
                </div>
              </div>

              {/* CARD 3: Parent & Family Contact Information */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Phone className="w-4 h-4 text-amber-400" />
                  <h4 className="font-bold text-white uppercase text-[11px] tracking-wide">
                    3. Parent & Emergency Contact
                  </h4>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Father / Primary Guardian:</span>
                  <span className="font-bold text-white">{profile?.parentName || activeWard?.parentName || 'Pandey Parent'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Relationship:</span>
                  <span className="text-slate-200">{profile?.parentRelation || 'Parent / Guardian'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Contact Number:</span>
                  <a href={`tel:${profile?.parentPhone || activeWard?.parentPhone || '981000080'}`} className="font-bold text-cyan-400 hover:underline">
                    {profile?.parentPhone || activeWard?.parentPhone || '+91 98100 00080'}
                  </a>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Registered Email:</span>
                  <a href={`mailto:${profile?.parentEmail || activeWard?.parentEmail || 'student.dks-2026-080@dakshoraacademy.edu.in'}`} className="text-slate-300 hover:text-white truncate max-w-[200px]">
                    {profile?.parentEmail || activeWard?.parentEmail || 'student.dks-2026-080@dakshoraacademy.edu.in'}
                  </a>
                </div>

                <div className="pt-1 text-[11px] text-slate-300">
                  <span className="text-slate-400 block">Residential Address:</span>
                  <span>{profile?.address || activeWard?.address || 'B-4 Vasant Kunj, New Delhi - 110070'}</span>
                </div>
              </div>

              {/* CARD 4: Institutional Logistics, Transport & Dues */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-bold text-white uppercase text-[11px] tracking-wide">
                    4. Institutional Services & Dues
                  </h4>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Attendance Percentage:</span>
                  <span className="font-bold text-emerald-400">{profile?.attendancePercent || activeWard?.attendancePercent || 94.5}% (Optimal)</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">School Fee Status:</span>
                  <span className="font-bold text-emerald-400">
                    {((profile?.duesINR ?? activeWard?.duesINR ?? 0) > 0) ? `₹${(profile?.duesINR ?? activeWard?.duesINR ?? 0).toLocaleString('en-IN')} Outstanding` : 'All Dues Cleared ✓'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Assigned Bus Route:</span>
                  <span className="text-cyan-300 font-bold">{profile?.transportRouteNumber || 'Self / Private Drop'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Route Description:</span>
                  <span className="text-slate-200 truncate max-w-[180px]">{profile?.transportRouteName || 'Self / Parent Commute'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Campus Emergency SOS:</span>
                  <span className="text-rose-400 font-bold">+91 11 2613 8999</span>
                </div>
              </div>
            </div>

            {/* Bottom Modal Actions */}
            <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white p-1 rounded-xl flex items-center justify-center shrink-0">
                  <QrCode className="w-10 h-10 text-slate-950" />
                </div>
                <div className="text-[10px] text-slate-400">
                  <div>Turnstile Gate QR Verified</div>
                  <div className="text-slate-500 truncate max-w-xs">{profile?.qrPayload || `DAKSHORA:STUDENT:${activeWard?.id || '2026-080'}`}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowStudentDetailModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
                >
                  {isHindi ? 'वापस जाएँ / बंद करें' : 'Close / Back'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowStudentDetailModal(false);
                    setShowIdCardModal(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/25 cursor-pointer transition-all hover:scale-105"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Open ID Badge</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

            {showIdCardModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gradient-to-tr from-slate-950 via-indigo-950 to-slate-900 border-2 border-cyan-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowIdCardModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-4 border-b border-white/10">
              <h4 className="text-base font-black text-white uppercase tracking-wider">
                {profile?.schoolAffiliation?.schoolName || dynamicSchoolBrand.schoolName || 'Dakshora Academy, New Delhi'}
              </h4>
              <p className="text-[10px] font-mono text-cyan-300 mt-0.5">
                Affiliation #{profile?.schoolAffiliation?.affiliationNo || dynamicSchoolBrand.affiliationNo || 'CBSE-AFF-202601'} • Code: {profile?.schoolAffiliation?.schoolCode || dynamicSchoolBrand.schoolCode || 'DKS-DEL-01'}
              </p>
            </div>

            <div className="flex items-start sm:items-center gap-5 mt-6">
              <div
                onClick={() => {
                  setShowIdCardModal(false);
                  setShowStudentDetailModal(true);
                }}
                className="relative group cursor-pointer shrink-0"
                title="Click student picture to view Full Student Details"
              >
                <img
                  src={profile?.avatarUrl || activeWard?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                  alt={profile?.name || activeWard?.name}
                  className="w-24 h-32 rounded-2xl object-cover ring-2 ring-cyan-400 group-hover:ring-cyan-300 shadow-xl transition-all group-hover:scale-105"
                />
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-950/80 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
                  <Eye className="w-2.5 h-2.5" />
                  <span>View</span>
                </span>
              </div>

              <div className="space-y-1 text-xs font-mono min-w-0">
                <div className="text-base font-black text-white">{profile?.name || activeWard?.name || 'Mira Pandey'}</div>
                <div className="text-cyan-300 font-bold">
                  {isHindi ? 'कक्षा:' : 'Class:'} {profile?.grade || activeWard?.grade || 'Class 10'} - {profile?.section || activeWard?.section || 'A'}
                </div>
                <div className="text-amber-300 font-bold">
                  PEN No: <span className="font-mono text-white">{profile?.penNo || activeWard?.penNo || (profile as any)?.pen_no || '20260711080'}</span>
                </div>
                <div className="text-slate-200">
                  {isHindi ? 'प्रवेश सं.:' : 'Adm No:'} <span className="font-bold text-white">{profile?.admissionNo || activeWard?.admissionNo || (profile as any)?.admission_no || 'DKS-2026-080'}</span>
                </div>
                <div className="text-slate-300">
                  {isHindi ? 'रोल नंबर:' : 'Roll No:'} <span className="font-bold text-white">#{profile?.rollNo || activeWard?.rollNo || 'R-02'}</span>
                </div>
                <div className="text-slate-300">
                  {isHindi ? 'रक्त समूह:' : 'Blood Group:'} <span className="px-1.5 py-0.2 rounded font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">{profile?.bloodGroup || activeWard?.bloodGroup || (profile as any)?.blood_group || 'O+'}</span>
                </div>
                <div className="text-slate-300 text-[11px]">
                  {isHindi ? 'जन्म तिथि:' : 'DOB:'} <span className="font-bold text-slate-200">{profile?.dob || activeWard?.dob || (profile as any)?.date_of_birth || '2010-09-15'}</span>
                </div>
                <div className="text-emerald-400 text-[10px] pt-0.5">
                  Class Teacher: {profile?.classTeacher || activeWard?.classTeacher || 'Vikramaditya Singh (Class Teacher)'}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
              <div className="space-y-0.5 text-[10px] font-mono text-slate-400">
                <div>{isHindi ? 'अभिभावक:' : 'Parent:'} {profile?.parentName || 'Pandey Parent'}</div>
                <div>{isHindi ? 'आपातकालीन:' : 'Emergency:'} {profile?.parentPhone || dynamicSchoolBrand.contactPhone || '+91 98100 00080'}</div>
                <div>{isHindi ? 'सत्र:' : 'Session:'} 2026–27</div>
              </div>

              <div className="w-16 h-16 bg-white p-1 rounded-xl flex items-center justify-center">
                <QrCode className="w-14 h-14 text-slate-950" />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowIdCardModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                {isHindi ? 'बंद करें / वापस जाएँ' : 'Close / Back'}
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/25 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{t('portal.modal_id_print', 'Print Card')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </main>
    </div>
  );
};

export default ParentStudentPortalHub;
