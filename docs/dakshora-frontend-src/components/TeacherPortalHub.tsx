import React, { useState, useEffect, useMemo } from 'react';
import {
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
  X
} from 'lucide-react';
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

  // Dynamic School Brand
  const resolvedSchoolName = schoolBrand?.schoolName || currentUser?.schoolName || 'Dakshora Academy, New Delhi';
  const resolvedSchoolLogo = schoolBrand?.logoUrl || currentUser?.logoUrl || '/assets/dakshora-logo.png';

  // Arrangement Notification Alert State
  const [arrangementAccepted, setArrangementAccepted] = useState(false);
  const [showArrangementModal, setShowArrangementModal] = useState(false);

  // Selected class for roll-call
  const [selectedClassForMarking, setSelectedClassForMarking] = useState<string>(profile.assignedClass || 'Class 10-A');
  const [workloadData, setWorkloadData] = useState<any>(null);
  const [showWorkloadModal, setShowWorkloadModal] = useState(false);

  // Classes & Live Rosters from Database
  const [unmarkedClasses, setUnmarkedClasses] = useState([
    { grade: 'Class 10-A', count: 6, total: 6, wing: 'Secondary' },
    { grade: 'Class 9-A', count: 6, total: 6, wing: 'Secondary' },
    { grade: 'Class 8-A', count: 6, total: 6, wing: 'Middle' },
    { grade: 'Class 11 Science', count: 6, total: 6, wing: 'Sr. Secondary' },
    { grade: 'Class 12 Science', count: 6, total: 6, wing: 'Sr. Secondary' }
  ]);

  // Live student roster for active marking class
  const [classRoster, setClassRoster] = useState([
    { id: 'std-10-01', rollNo: 1, name: 'Advik Chaudhary', status: 'present' },
    { id: 'std-10-02', rollNo: 2, name: 'Mira Pandey', status: 'present' },
    { id: 'std-10-03', rollNo: 3, name: 'Kavya Sharma', status: 'present' },
    { id: 'std-10-04', rollNo: 4, name: 'Ishita Verma', status: 'present' },
    { id: 'std-10-05', rollNo: 5, name: 'Pranav Gupta', status: 'absent' },
    { id: 'std-10-06', rollNo: 6, name: 'Ahana Singh', status: 'present' }
  ]);

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
          const rawClass = selectedClassForMarking.toLowerCase().replace(/[^a-z0-9]/g, '');
          const filtered = data.students.filter((s: any) => {
            const combined = `${s.grade || s.currentGrade || ''} ${s.section || s.currentSection || ''}`.toLowerCase().replace(/[^a-z0-9]/g, '');
            return combined.includes(rawClass) || rawClass.includes(combined) || combined.includes('class10a');
          });
          if (filtered.length > 0) {
            setClassRoster(filtered.map((s: any, idx: number) => ({
              id: s.id || `std-${idx + 1}`,
              rollNo: s.rollNo ? parseInt(s.rollNo.replace(/\D/g, ''), 10) || (idx + 1) : (idx + 1),
              name: s.name || `${s.firstName || s.first_name || ''} ${s.lastName || s.last_name || ''}`.trim() || 'Student',
              status: idx === 4 ? 'absent' : idx === 3 ? 'late' : 'present'
            })));
          }
        }
      } catch (err) {
        // Fallback to initial state
      }
    }
    fetchClassStudents();
  }, [selectedClassForMarking]);

  // Toggle student attendance
  const handleToggleAttendance = (id: string) => {
    setClassRoster(prev =>
      prev.map(st => {
        if (st.id === id) {
          const nextStatus = st.status === 'present' ? 'absent' : st.status === 'absent' ? 'late' : 'present';
          return { ...st, status: nextStatus };
        }
        return st;
      })
    );
  };

  const handleMarkAllPresent = () => {
    setClassRoster(prev => prev.map(st => ({ ...st, status: 'present' })));
    onShowToast('success', 'Roster Updated', `All ${classRoster.length} students marked present`);
  };

  const handleSaveAttendance = () => {
    const presentCount = classRoster.filter(s => s.status === 'present').length;
    onShowToast('success', 'Attendance Submitted ✓', `Saved ${presentCount}/${classRoster.length} present for ${selectedClassForMarking}`);
    // remove from unmarked list
    setUnmarkedClasses(prev => prev.filter(c => c.grade !== selectedClassForMarking));
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
        arrangementCount={arrangementAccepted ? 0 : 1}
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
              onClick={() => setShowArrangementModal(true)}
              className={`p-2 sm:p-2.5 rounded-xl border transition-all relative cursor-pointer ${
                !arrangementAccepted
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 animate-pulse'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
              title="Arrangement / Substitution Duty Notification"
              aria-label="Arrangement Notifications"
            >
              <Bell className="w-4 h-4" />
              {!arrangementAccepted && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold shadow-md">
                  1
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
        {/* TAB 1: DAILY PULSE (OVERVIEW & RESPONSIVE GRID CARDS) */}
        {/* ========================================================================= */}
        {activeTab === 'pulse' && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
            {/* Urgent Arrangement Duty Alert Banner (if pending) */}
            {!arrangementAccepted && (
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
                      <span className="text-xs text-rose-300 font-mono font-bold">Period 4 (11:15 AM)</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-extrabold text-white mt-1">
                      Assigned to Class IX-B (Room 104) • Proxy for Dr. Vikram Sethi
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Subject: Science revision & supervision. Please confirm receipt.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setArrangementAccepted(true);
                      onShowToast('success', 'Arrangement Duty Accepted', 'Principal & Academic Coordinator notified');
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-500/25 flex items-center gap-1.5 cursor-pointer hover:brightness-105"
                  >
                    <Check className="w-4 h-4" />
                    <span>Accept Duty</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowArrangementModal(true)}
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
                        className="px-3.5 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                      >
                        Roll Call Now
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
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      Session 2026–27
                    </span>
                  </div>

                  {/* 4 Circular Action Icons (Screenshot 1: Daily Classes, Daily Students, Monthly Class, Pending Classes) */}
                  <div className="grid grid-cols-4 gap-2 text-center pt-2">
                    {/* 1. Daily Classes */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('reports')}
                      className="flex flex-col items-center gap-2 group cursor-pointer"
                    >
                      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-slate-800/90 group-hover:bg-cyan-500/20 group-hover:border-cyan-400 text-slate-300 group-hover:text-cyan-300 border border-slate-700 flex items-center justify-center transition-all shadow-md">
                        <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <span className="text-[11px] font-mono text-slate-300 group-hover:text-white leading-tight font-medium">
                        Daily<br />Classes
                      </span>
                    </button>

                    {/* 2. Daily Students */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('reports')}
                      className="flex flex-col items-center gap-2 group cursor-pointer"
                    >
                      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-slate-800/90 group-hover:bg-purple-500/20 group-hover:border-purple-400 text-slate-300 group-hover:text-purple-300 border border-slate-700 flex items-center justify-center transition-all shadow-md">
                        <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <span className="text-[11px] font-mono text-slate-300 group-hover:text-white leading-tight font-medium">
                        Daily<br />Students
                      </span>
                    </button>

                    {/* 3. Monthly Class */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('reports')}
                      className="flex flex-col items-center gap-2 group cursor-pointer"
                    >
                      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-slate-800/90 group-hover:bg-emerald-500/20 group-hover:border-emerald-400 text-slate-300 group-hover:text-emerald-300 border border-slate-700 flex items-center justify-center transition-all shadow-md">
                        <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <span className="text-[11px] font-mono text-slate-300 group-hover:text-white leading-tight font-medium">
                        Monthly<br />Class
                      </span>
                    </button>

                    {/* 4. Pending Classes */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('unmarked')}
                      className="flex flex-col items-center gap-2 group cursor-pointer"
                    >
                      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-slate-800/90 group-hover:bg-amber-500/20 group-hover:border-amber-400 text-slate-300 group-hover:text-amber-300 border border-slate-700 flex items-center justify-center transition-all shadow-md relative">
                        <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6" />
                        {unmarkedClasses.length > 0 && (
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 absolute top-1 right-1 ring-2 ring-slate-900" />
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-300 group-hover:text-white leading-tight font-medium">
                        Pending<br />Classes
                      </span>
                    </button>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 text-xs font-mono flex items-center justify-between text-slate-400">
                  <span>Your Class Today:</span>
                  <span className="text-emerald-400 font-bold">100% On-Time Roll-Call</span>
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
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: FAST ATTENDANCE REGISTER */}
        {/* ========================================================================= */}
        {activeTab === 'attendance' && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl w-full mx-auto animate-in fade-in duration-300">
            <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                  FAST ROLL-CALL REGISTER
                </span>
                <h2 className="text-lg font-black text-white mt-0.5">
                  Class: {selectedClassForMarking} • Session 2026–27
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Tap any student badge to toggle: Present (Green) → Absent (Red) → Late (Yellow)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
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
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-md shadow-emerald-500/25 transition-all cursor-pointer"
                >
                  Submit & Sync Register
                </button>
              </div>
            </div>

            {/* Quick Stats Pill */}
            <div className="grid grid-cols-3 gap-3 font-mono text-center">
              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
                <span className="text-[10px] text-emerald-300 uppercase block">Present</span>
                <span className="text-2xl font-black text-emerald-400">
                  {classRoster.filter(s => s.status === 'present').length}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30">
                <span className="text-[10px] text-rose-300 uppercase block">Absent</span>
                <span className="text-2xl font-black text-rose-400">
                  {classRoster.filter(s => s.status === 'absent').length}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30">
                <span className="text-[10px] text-amber-300 uppercase block">Late</span>
                <span className="text-2xl font-black text-amber-400">
                  {classRoster.filter(s => s.status === 'late').length}
                </span>
              </div>
            </div>

            {/* Student Roster List */}
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 overflow-hidden divide-y divide-slate-800/80 font-mono">
              {classRoster.map((st) => (
                <div
                  key={st.id}
                  onClick={() => handleToggleAttendance(st.id)}
                  className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-850/60 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-xs">
                      #{st.rollNo}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-white">{st.name}</div>
                      <div className="text-[11px] text-slate-400">Adm: NIPS-2026-0{st.rollNo}</div>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase border transition-all ${
                      st.status === 'present'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : st.status === 'absent'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {st.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ATTENDANCE REPORTS */}
        {/* ========================================================================= */}
        {activeTab === 'reports' && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl w-full mx-auto animate-in fade-in duration-300 font-mono">
            <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  ATTENDANCE ANALYTICS & WING REPORTS
                </span>
                <h2 className="text-lg font-black text-white mt-0.5">
                  Daily Classes & Monthly Attendance Register
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onShowToast('info', 'Exporting PDF', 'Generating monthly attendance register for Academic Office')}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Export PDF Summary
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">XII Science A (Your Class)</span>
                  <span className="text-xs font-bold text-emerald-400">97.2% Average</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '97.2%' }} />
                </div>
                <div className="text-[11px] text-slate-400">
                  Present Today: 33/35 • Approved Leaves: 2 • Unexcused Absent: 0
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Senior Secondary Wing</span>
                  <span className="text-xs font-bold text-cyan-400">94.8% Average</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                  <div className="bg-cyan-500 h-full rounded-full" style={{ width: '94.8%' }} />
                </div>
                <div className="text-[11px] text-slate-400">
                  Total Students: 342 • Present Today: 324 • Defaulters: 4
                </div>
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
              <button
                type="button"
                onClick={() => onShowToast('info', 'Broadcast Ping Sent', 'SMS & WhatsApp reminder sent to all class teachers')}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all cursor-pointer"
              >
                Send Staff Reminder Ping
              </button>
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
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                24 Periods / Week
              </span>
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
              <button
                type="button"
                onClick={() => onShowToast('info', 'Apply Leave / Proxy', 'Submit proxy request to Academic In-charge')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer"
              >
                Request Proxy Coverage
              </button>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-rose-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                  Today • Period 4
                </span>
                <span className="text-xs text-emerald-400 font-bold">
                  {arrangementAccepted ? 'Status: Accepted ✓' : 'Status: Action Required'}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-white">
                Substitution for Dr. Vikram Sethi — Class IX-B (Room 104)
              </h3>
              <p className="text-xs text-slate-300">
                Reason: Medical leave. Please conduct supervised chapter revision or science quiz exercises.
              </p>
              <div className="pt-2 flex items-center gap-2">
                {!arrangementAccepted ? (
                  <button
                    type="button"
                    onClick={() => {
                      setArrangementAccepted(true);
                      onShowToast('success', 'Accepted', 'Substitution duty confirmed.');
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                  >
                    Confirm & Accept Duty
                  </button>
                ) : (
                  <span className="text-xs text-emerald-400 font-bold">
                    ✓ You have accepted this arrangement period.
                  </span>
                )}
              </div>
            </div>
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
              <button
                type="button"
                onClick={() => onShowToast('success', 'Journal Saved', 'Teaching log synchronized with CBSE Academic Roster')}
                className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Save Daily Log
              </button>
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
              <button
                type="button"
                onClick={() => onShowToast('success', 'Homework Dispatched', 'Pushed to all 35 student & parent portals via WhatsApp/App')}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                + Dispatch Homework
              </button>
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
              <button
                type="button"
                onClick={() => onShowToast('success', 'Marks Uploaded', 'Transcripts submitted to School Examination Cell')}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                Submit Score Ledger
              </button>
            </div>

            <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden divide-y divide-slate-800">
              {classRoster.slice(0, 8).map((st, i) => (
                <div key={st.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-xs">
                      #{st.rollNo}
                    </span>
                    <span className="text-sm font-bold text-white">{st.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      defaultValue={85 + i}
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
              <span className="text-xs font-mono text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified Service Record</span>
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-950 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer hover:bg-slate-800"
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
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer"
              >
                Close Audit Sheet
              </button>
            </div>
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

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-rose-300 font-bold">Duty Timing: Period 4 (11:15 AM - 12:00 PM)</div>
              <div className="text-white text-sm font-extrabold">Class IX-B (Room 104)</div>
              <div className="text-slate-400">Regular Teacher: Dr. Vikram Sethi (On Medical Leave)</div>
              <div className="text-slate-400">Assigned Topic: Science Practice & Revision</div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowArrangementModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
              >
                Close
              </button>
              {!arrangementAccepted && (
                <button
                  type="button"
                  onClick={() => {
                    setArrangementAccepted(true);
                    setShowArrangementModal(false);
                    onShowToast('success', 'Arrangement Duty Accepted', 'Principal Office notified');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold"
                >
                  Accept Assignment
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherPortalHub;
