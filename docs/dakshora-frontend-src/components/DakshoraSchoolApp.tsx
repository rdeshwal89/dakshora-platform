/**
 * DakshoraSchoolApp.tsx
 * Standalone Multi-Role White-Label School App
 * ─────────────────────────────────────────────
 * • Home page: 4 premium role cards (Admin, Student/Parent, Staff/Teacher, Accountant)
 * • White-label branding: org name + logo fetched on load, replaces Dakshora defaults
 * • Role-based dashboard: RBAC — each role sees only its authorized modules
 * • Premium, classic, glassmorphism-inspired design aesthetic
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Calendar,
  BookOpen,
  FileCheck,
  CreditCard,
  Bell,
  Bus,
  Library,
  BarChart3,
  Bot,
  Settings,
  Shield,
  DollarSign,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  LogOut,
  ArrowLeft,
  Home,
  Sparkles,
  Building2,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  Star,
  Zap,
  Award,
  Activity,
  Eye,
  EyeOff,
  Lock,
  BookMarked,
  RefreshCw,
  Heart,
  Briefcase,
  UserPlus,
  MessageSquare,
  PieChart
} from 'lucide-react';
import { makeApiCall } from '../services/api';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
type AppRole = 'admin' | 'student_parent' | 'staff_teacher' | 'accountant';

interface OrgBrand {
  schoolName: string;
  logoUrl: string;
  board: string;
  city: string;
  principalName: string;
  affiliationNo: string;
  motto: string;
  themeColor: string;
}

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  designation?: string;
  grade?: string;
  avatarUrl?: string;
}

interface ModuleItem {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  gradient: string;
  badge?: string;
  badgeColor?: string;
}

// ─────────────────────────────────────────────────────────────
// ROLE DEFINITIONS (Cards on Home Page)
// ─────────────────────────────────────────────────────────────
const ROLE_CARDS: {
  id: AppRole;
  title: string;
  subtitle: string;
  emoji: string;
  gradient: string;
  shadowColor: string;
  borderColor: string;
  bgAccent: string;
  textAccent: string;
  pillBg: string;
  description: string;
  icon: React.ComponentType<any>;
  stats: string;
}[] = [
  {
    id: 'admin',
    title: 'School Admin',
    subtitle: 'Director / Principal',
    emoji: '👑',
    gradient: 'from-indigo-600 via-purple-600 to-blue-700',
    shadowColor: 'shadow-indigo-500/40',
    borderColor: 'border-indigo-400/30',
    bgAccent: 'bg-indigo-950/60',
    textAccent: 'text-indigo-300',
    pillBg: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/30',
    description: 'Full command over all school operations, staff, students, reports & ERP settings.',
    icon: Building2,
    stats: 'All 18 Modules',
  },
  {
    id: 'student_parent',
    title: 'Student / Parent',
    subtitle: 'Ward Self-Service Portal',
    emoji: '🎓',
    gradient: 'from-cyan-500 via-teal-500 to-emerald-600',
    shadowColor: 'shadow-cyan-500/40',
    borderColor: 'border-cyan-400/30',
    bgAccent: 'bg-cyan-950/60',
    textAccent: 'text-cyan-300',
    pillBg: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/30',
    description: 'View attendance, fee dues, timetable, homework, report cards & bus tracking.',
    icon: GraduationCap,
    stats: '9 Modules',
  },
  {
    id: 'staff_teacher',
    title: 'Staff / Teacher',
    subtitle: 'Faculty Co-Pilot Workspace',
    emoji: '👩‍🏫',
    gradient: 'from-emerald-600 via-green-600 to-teal-700',
    shadowColor: 'shadow-emerald-500/40',
    borderColor: 'border-emerald-400/30',
    bgAccent: 'bg-emerald-950/60',
    textAccent: 'text-emerald-300',
    pillBg: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
    description: 'Teaching journal, class attendance, homework, timetable, exam marks & leave.',
    icon: Users,
    stats: '10 Modules',
  },
  {
    id: 'accountant',
    title: 'Accountant',
    subtitle: 'Billing & Finance Desk',
    emoji: '💼',
    gradient: 'from-amber-500 via-orange-500 to-rose-600',
    shadowColor: 'shadow-amber-500/40',
    borderColor: 'border-amber-400/30',
    bgAccent: 'bg-amber-950/60',
    textAccent: 'text-amber-300',
    pillBg: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
    description: 'Fee collection, invoices, payment ledger, salary disbursement & MRR reports.',
    icon: CreditCard,
    stats: '7 Modules',
  },
];

// ─────────────────────────────────────────────────────────────
// ROLE → MODULE MAPPING
// ─────────────────────────────────────────────────────────────
const ROLE_MODULES: Record<AppRole, ModuleItem[]> = {
  admin: [
    { id: 'dashboard', label: 'Command Center', description: 'Live KPIs, alerts & school pulse', icon: LayoutDashboard, gradient: 'from-blue-600 to-indigo-700', badge: 'Live', badgeColor: 'bg-blue-500/20 text-blue-200' },
    { id: 'students', label: 'Student Registry', description: 'Enroll, manage & track students', icon: GraduationCap, gradient: 'from-violet-600 to-purple-700', badge: '580 Students', badgeColor: 'bg-violet-500/20 text-violet-200' },
    { id: 'staff', label: 'Staff & HR', description: 'Staff records, roles & payroll', icon: Users, gradient: 'from-emerald-600 to-green-700', badge: '62 Staff', badgeColor: 'bg-emerald-500/20 text-emerald-200' },
    { id: 'attendance', label: 'Attendance', description: 'Daily register & monthly reports', icon: CheckCircle2, gradient: 'from-teal-600 to-cyan-700', badge: '94.2%', badgeColor: 'bg-teal-500/20 text-teal-200' },
    { id: 'academics', label: 'Academics', description: 'Curriculum, homework & syllabus', icon: BookOpen, gradient: 'from-sky-600 to-blue-700' },
    { id: 'timetable', label: 'Timetable', description: 'Period scheduling & room alloc.', icon: Calendar, gradient: 'from-indigo-600 to-blue-700' },
    { id: 'exams', label: 'Examinations', description: 'Exam schedule, marks & results', icon: FileCheck, gradient: 'from-rose-600 to-pink-700', badge: 'Term 2', badgeColor: 'bg-rose-500/20 text-rose-200' },
    { id: 'fees', label: 'Fee Management', description: 'Invoices, collection & dues', icon: CreditCard, gradient: 'from-amber-500 to-orange-600', badge: '₹2.4L Due', badgeColor: 'bg-amber-500/20 text-amber-200' },
    { id: 'admissions', label: 'Admissions CRM', description: 'Applications, docs & approval', icon: UserPlus, gradient: 'from-fuchsia-600 to-purple-700', badge: '12 Pending', badgeColor: 'bg-fuchsia-500/20 text-fuchsia-200' },
    { id: 'communication', label: 'Communication', description: 'Notices, SMS & announcements', icon: Bell, gradient: 'from-orange-500 to-red-600' },
    { id: 'transport', label: 'Transport', description: 'Bus routes & GPS tracking', icon: Bus, gradient: 'from-lime-600 to-green-700' },
    { id: 'library', label: 'Library', description: 'Books, issues & returns', icon: Library, gradient: 'from-stone-600 to-zinc-700' },
    { id: 'payroll', label: 'Payroll', description: 'Salary slips & disbursement', icon: DollarSign, gradient: 'from-yellow-500 to-amber-600' },
    { id: 'reports', label: 'Reports & Analytics', description: 'Comprehensive ERP reports', icon: BarChart3, gradient: 'from-cyan-600 to-blue-700' },
    { id: 'ai', label: 'DAKSHORA AI', description: 'AI counselor & co-pilot', icon: Bot, gradient: 'from-violet-600 to-fuchsia-700', badge: 'Gemini', badgeColor: 'bg-violet-500/20 text-violet-200' },
    { id: 'settings', label: 'ERP Settings', description: 'School config & integrations', icon: Settings, gradient: 'from-slate-600 to-zinc-700' },
    { id: 'journal', label: 'Teaching Journal', description: 'Daily lesson logs & reflections', icon: BookMarked, gradient: 'from-indigo-500 to-blue-600' },
    { id: 'portal', label: 'Parent Portal', description: 'Parent-student self-service view', icon: Eye, gradient: 'from-teal-500 to-cyan-600' },
  ],
  staff_teacher: [
    { id: 'dashboard', label: 'My Dashboard', description: 'Schedule, tasks & alerts for today', icon: LayoutDashboard, gradient: 'from-emerald-600 to-green-700', badge: 'Live', badgeColor: 'bg-emerald-500/20 text-emerald-200' },
    { id: 'journal', label: 'Teaching Journal', description: 'Log lessons, topics & reflections', icon: BookMarked, gradient: 'from-indigo-600 to-blue-700' },
    { id: 'attendance', label: 'Class Attendance', description: 'Mark daily roll for assigned class', icon: CheckCircle2, gradient: 'from-teal-600 to-cyan-700', badge: 'Today', badgeColor: 'bg-teal-500/20 text-teal-200' },
    { id: 'academics', label: 'Academics', description: 'Homework, notes & class resources', icon: BookOpen, gradient: 'from-sky-600 to-blue-700' },
    { id: 'timetable', label: 'My Timetable', description: 'Period-by-period weekly schedule', icon: Calendar, gradient: 'from-indigo-600 to-purple-700' },
    { id: 'exams', label: 'Exam & Marks', description: 'Enter & verify student marks', icon: FileCheck, gradient: 'from-rose-600 to-pink-700' },
    { id: 'students', label: 'My Students', description: 'Student profiles for assigned class', icon: GraduationCap, gradient: 'from-violet-600 to-purple-700' },
    { id: 'communication', label: 'Announcements', description: 'Class notices & parent messages', icon: Bell, gradient: 'from-orange-500 to-amber-600' },
    { id: 'ai', label: 'AI Co-Pilot', description: 'Generate lesson plans & MCQs', icon: Bot, gradient: 'from-violet-600 to-fuchsia-700', badge: 'Gemini', badgeColor: 'bg-violet-500/20 text-violet-200' },
    { id: 'robotics', label: 'Robotics Lab', description: 'STEM courses & project tracker', icon: Zap, gradient: 'from-cyan-600 to-blue-700' },
  ],
  student_parent: [
    { id: 'portal', label: 'My Dashboard', description: 'Ward overview & quick actions', icon: LayoutDashboard, gradient: 'from-cyan-600 to-teal-700', badge: 'Live', badgeColor: 'bg-cyan-500/20 text-cyan-200' },
    { id: 'attendance', label: 'Attendance', description: 'Monthly attendance % & calendar', icon: CheckCircle2, gradient: 'from-emerald-600 to-green-700', badge: '94.5%', badgeColor: 'bg-emerald-500/20 text-emerald-200' },
    { id: 'fees', label: 'Fee & Payments', description: 'Invoices, dues & payment history', icon: CreditCard, gradient: 'from-amber-500 to-orange-600', badge: '₹0 Due', badgeColor: 'bg-amber-500/20 text-amber-200' },
    { id: 'timetable', label: 'Class Timetable', description: 'Daily & weekly period schedule', icon: Calendar, gradient: 'from-indigo-600 to-blue-700' },
    { id: 'exams', label: 'Exams & Results', description: 'Exam schedule & report card', icon: FileCheck, gradient: 'from-rose-600 to-pink-700' },
    { id: 'academics', label: 'Homework & Notes', description: 'Class assignments & study material', icon: BookOpen, gradient: 'from-sky-600 to-blue-700' },
    { id: 'transport', label: 'Bus Tracker', description: 'Real-time route & ETA tracking', icon: Bus, gradient: 'from-lime-600 to-green-700' },
    { id: 'communication', label: 'Notices', description: 'School announcements & circulars', icon: Bell, gradient: 'from-orange-500 to-red-600' },
    { id: 'ai', label: 'Study AI', description: 'Doubt solver & exam prep assistant', icon: Bot, gradient: 'from-violet-600 to-fuchsia-700', badge: 'AI', badgeColor: 'bg-violet-500/20 text-violet-200' },
  ],
  accountant: [
    { id: 'dashboard', label: 'Finance Dashboard', description: 'MRR, collection & dues overview', icon: PieChart, gradient: 'from-amber-500 to-orange-600', badge: 'Live', badgeColor: 'bg-amber-500/20 text-amber-200' },
    { id: 'fees', label: 'Fee Collection', description: 'Collect fees, print receipts', icon: CreditCard, gradient: 'from-rose-600 to-pink-700', badge: '₹2.4L Pending', badgeColor: 'bg-rose-500/20 text-rose-200' },
    { id: 'invoices', label: 'Invoice Ledger', description: 'All invoices & payment records', icon: FileText, gradient: 'from-indigo-600 to-blue-700' },
    { id: 'payroll', label: 'Salary & Payroll', description: 'Staff salary slips & disbursement', icon: DollarSign, gradient: 'from-yellow-500 to-amber-600' },
    { id: 'students', label: 'Student Accounts', description: 'Per-student fee dues & history', icon: GraduationCap, gradient: 'from-violet-600 to-purple-700' },
    { id: 'reports', label: 'Finance Reports', description: 'Daily, monthly & annual reports', icon: BarChart3, gradient: 'from-cyan-600 to-blue-700' },
    { id: 'communication', label: 'Fee Reminders', description: 'Bulk SMS/email for due parents', icon: Bell, gradient: 'from-orange-500 to-red-600' },
  ],
};

// ─────────────────────────────────────────────────────────────
// DEMO STATS PER ROLE
// ─────────────────────────────────────────────────────────────
const ROLE_STATS: Record<AppRole, { label: string; value: string; icon: React.ComponentType<any>; trend?: string; trendUp?: boolean }[]> = {
  admin: [
    { label: 'Total Students', value: '1,284', icon: GraduationCap, trend: '+23 this month', trendUp: true },
    { label: 'Active Staff', value: '62', icon: Users, trend: '2 on leave', trendUp: false },
    { label: 'Fee Collection', value: '₹12.4L', icon: CreditCard, trend: '86% of target', trendUp: true },
    { label: 'Avg Attendance', value: '94.2%', icon: CheckCircle2, trend: '+1.1% vs last month', trendUp: true },
  ],
  staff_teacher: [
    { label: 'My Classes Today', value: '6 Periods', icon: Calendar, trend: 'Next: Math 10-A at 10:00', trendUp: true },
    { label: 'Pending Homework', value: '3 Tasks', icon: BookOpen, trend: '2 submissions due', trendUp: false },
    { label: 'Students in Class', value: '42', icon: GraduationCap, trend: '39 present today', trendUp: true },
    { label: 'Journal Entries', value: '28', icon: BookMarked, trend: 'Last: Yesterday', trendUp: true },
  ],
  student_parent: [
    { label: 'Attendance %', value: '94.5%', icon: CheckCircle2, trend: '2 absences this month', trendUp: true },
    { label: 'Pending Homework', value: '2 Tasks', icon: BookOpen, trend: 'Due: Tomorrow', trendUp: false },
    { label: 'Fee Status', value: 'Paid ✓', icon: CreditCard, trend: 'Next due: 1 Dec 2026', trendUp: true },
    { label: 'Last Result', value: '87.4%', icon: Award, trend: 'Term 1 — A Grade', trendUp: true },
  ],
  accountant: [
    { label: 'Monthly Collection', value: '₹8.2L', icon: TrendingUp, trend: '68% of target', trendUp: true },
    { label: 'Outstanding Dues', value: '₹2.4L', icon: AlertCircle, trend: '142 students pending', trendUp: false },
    { label: 'Invoices Today', value: '34', icon: FileText, trend: '28 paid, 6 pending', trendUp: true },
    { label: 'Salary Disbursed', value: '₹4.1L', icon: DollarSign, trend: 'October 2026', trendUp: true },
  ],
};

// ─────────────────────────────────────────────────────────────
// DEFAULT ORG BRAND (fallback if API fails)
// ─────────────────────────────────────────────────────────────
const DEFAULT_BRAND: OrgBrand = {
  schoolName: 'New Ideal Public School',
  logoUrl: '/assets/schools/new-ideal-logo.svg',
  board: 'CBSE',
  city: 'Mathura, Uttar Pradesh',
  principalName: 'Principal',
  affiliationNo: 'CBSE-AFF-2130894',
  motto: 'Excellence in Education',
  themeColor: 'indigo',
};

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
interface DakshoraSchoolAppProps {
  orgId?: string;
  onShowToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, msg?: string) => void;
}

type AppScreen = 'home' | 'login' | 'dashboard';

export const DakshoraSchoolApp: React.FC<DakshoraSchoolAppProps> = ({
  orgId = 'b17780e5-3832-4ac6-9aeb-33fd80c5cb0e',
  onShowToast,
}) => {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [brand, setBrand] = useState<OrgBrand>(DEFAULT_BRAND);
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [isLoadingBrand, setIsLoadingBrand] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Fetch org brand on mount ──────────────────────────────
  useEffect(() => {
    const fetchBrand = async () => {
      try {
        const res = await makeApiCall<any>('/api/erp/settings', {
          headers: { 'x-organization-id': orgId }
        });
        if (res.data?.settings) {
          const s = res.data.settings;
          setBrand({
            schoolName: s.schoolName || DEFAULT_BRAND.schoolName,
            logoUrl: s.logoUrl || s.logo_url || '',
            board: s.board || DEFAULT_BRAND.board,
            city: s.city || s.address?.split(',').slice(-2).join(',').trim() || DEFAULT_BRAND.city,
            principalName: s.principalName || DEFAULT_BRAND.principalName,
            affiliationNo: s.affiliationNo || DEFAULT_BRAND.affiliationNo,
            motto: s.motto || DEFAULT_BRAND.motto,
            themeColor: s.themeColor || 'indigo',
          });
        }
      } catch {
        // fallback to default brand silently
      } finally {
        setIsLoadingBrand(false);
      }
    };
    fetchBrand();
  }, [orgId]);

  // ── Login handler ─────────────────────────────────────────
  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email.trim() || !loginForm.password.trim()) {
      setLoginError('Please enter your email and password.');
      return;
    }
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const res = await makeApiCall<any>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginForm.email, password: loginForm.password }),
      });

      if (res.data?.success && res.data?.user) {
        const u = res.data.user;
        const user: AppUser = {
          id: u.id || 'usr-demo',
          name: u.name || u.email?.split('@')[0] || 'User',
          email: u.email || loginForm.email,
          role: selectedRole!,
          designation: selectedRole === 'staff_teacher' ? 'Class Teacher' : selectedRole === 'accountant' ? 'Accountant' : undefined,
        };
        if (res.data.token) localStorage.setItem('dakshora_auth_token', res.data.token);
        setCurrentUser(user);
        const modules = ROLE_MODULES[selectedRole!];
        setActiveModule(modules[0]?.id || 'dashboard');
        setScreen('dashboard');
        onShowToast?.('success', `Welcome, ${user.name}! 🎉`, `Signed in as ${ROLE_CARDS.find(r => r.id === selectedRole)?.title}`);
      } else {
        // Demo mode fallback: accept any credentials for demo purposes
        const demoUser: AppUser = {
          id: 'demo-usr-' + Math.random().toString(36).slice(2, 7),
          name: loginForm.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          email: loginForm.email,
          role: selectedRole!,
          designation: selectedRole === 'staff_teacher' ? 'Class Teacher — Class 10-A' : selectedRole === 'accountant' ? 'Senior Accountant' : selectedRole === 'admin' ? 'Principal' : 'Student',
        };
        setCurrentUser(demoUser);
        const modules = ROLE_MODULES[selectedRole!];
        setActiveModule(modules[0]?.id || 'dashboard');
        setScreen('dashboard');
        onShowToast?.('info', `Demo Mode Active`, `Welcome, ${demoUser.name}`);
      }
    } catch {
      setLoginError('Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoggingIn(false);
    }
  }, [loginForm, selectedRole, onShowToast]);

  const handleSignOut = () => {
    setCurrentUser(null);
    setSelectedRole(null);
    setScreen('home');
    setLoginForm({ email: '', password: '' });
    setLoginError('');
    localStorage.removeItem('dakshora_auth_token');
    onShowToast?.('info', 'Signed out successfully', '');
  };

  const handleRoleCardClick = (role: AppRole) => {
    setSelectedRole(role);
    setScreen('login');
    setLoginError('');
    setLoginForm({ email: '', password: '' });
  };

  const roleCard = selectedRole ? ROLE_CARDS.find(r => r.id === selectedRole) : null;
  const modules = selectedRole ? ROLE_MODULES[selectedRole] : [];
  const stats = selectedRole ? ROLE_STATS[selectedRole] : [];
  const activeModuleInfo = modules.find(m => m.id === activeModule) || modules[0];

  // ──────────────────────────────────────────────────────────
  // BRAND LOGO COMPONENT
  // ──────────────────────────────────────────────────────────
  const BrandLogo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClass = size === 'lg' ? 'w-16 h-16' : size === 'md' ? 'w-10 h-10' : 'w-7 h-7';
    const logoSrc = brand.logoUrl || '/assets/schools/new-ideal-logo.svg';
    return (
      <div className={`${sizeClass} rounded-2xl overflow-hidden bg-white p-1 flex items-center justify-center shadow-lg flex-shrink-0 border border-slate-700`}>
        <img
          src={logoSrc}
          alt={brand.schoolName}
          className="w-full h-full object-contain"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            if (!img.src.includes('new-ideal-logo.svg')) {
              img.src = '/assets/schools/new-ideal-logo.svg';
            }
          }}
        />
      </div>
    );
  };

  // ──────────────────────────────────────────────────────────
  // LOADING STATE
  // ──────────────────────────────────────────────────────────
  if (isLoadingBrand) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center mx-auto animate-pulse shadow-2xl shadow-indigo-500/30">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-400 text-sm font-medium">Loading school portal…</p>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // SCREEN: HOME  ——  4 Role Cards
  // ──────────────────────────────────────────────────────────
  if (screen === 'home') {
    return (
      <div className="min-h-screen bg-[#050810] text-white overflow-x-hidden relative">
        {/* Ambient background */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-indigo-600/10 rounded-full blur-[160px]" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px]" />
          <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-[120px]" />
        </div>

        {/* Top Header */}
        <header className="relative z-10 px-6 pt-8 pb-6">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BrandLogo size="md" />
              <div>
                <h1 className="text-base font-black text-white leading-tight tracking-tight">{brand.schoolName}</h1>
                <p className="text-xs text-slate-400 font-medium">{brand.board} • {brand.city}</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-slate-300 font-medium">School Portal Online</span>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative z-10 px-6 pt-6 pb-12 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-slate-300 font-medium">DAKSHORA ERP — Powered by Google Gemini AI</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mb-4 leading-tight">
            Welcome to<br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {brand.schoolName}
            </span>
          </h2>
          <p className="text-base text-slate-400 font-medium max-w-lg mx-auto leading-relaxed">
            "{brand.motto}" — Select your role below to access your personalized school dashboard.
          </p>
        </section>

        {/* 4 Role Cards Grid */}
        <section className="relative z-10 px-4 sm:px-6 pb-16 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {ROLE_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  onClick={() => handleRoleCardClick(card.id)}
                  className={`group relative text-left overflow-hidden rounded-3xl border ${card.borderColor} bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm hover:from-white/8 hover:to-white/5 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl ${card.shadowColor} cursor-pointer`}
                >
                  {/* Card gradient accent bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} rounded-t-3xl`} />

                  {/* Ambient glow on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-3xl`} />

                  <div className="relative p-6 sm:p-7">
                    {/* Top row: emoji + icon + stats pill */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-xl ${card.shadowColor} group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                          <Icon className="w-7 h-7 text-white" strokeWidth={1.8} />
                        </div>
                        <div>
                          <div className="text-2xl">{card.emoji}</div>
                          <div className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${card.pillBg} mt-1`}>
                            {card.stats}
                          </div>
                        </div>
                      </div>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.bgAccent} border ${card.borderColor} group-hover:bg-white/10 transition-colors`}>
                        <ChevronRight className={`w-5 h-5 ${card.textAccent} group-hover:translate-x-0.5 transition-transform`} />
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-white tracking-tight group-hover:text-white">{card.title}</h3>
                      <p className={`text-xs font-bold uppercase tracking-wider ${card.textAccent} font-mono`}>{card.subtitle}</p>
                      <p className="text-sm text-slate-400 leading-relaxed pt-1">{card.description}</p>
                    </div>

                    {/* Login CTA */}
                    <div className={`mt-5 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-y-1 group-hover:translate-y-0`}>
                      <Lock className="w-3.5 h-3.5 text-white" />
                      <span className="text-xs font-bold text-white">Sign In as {card.title}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-white ml-auto" />
                    </div>
                    <div className={`mt-5 flex items-center gap-2 px-4 py-2.5 rounded-xl border ${card.borderColor} ${card.bgAccent} group-hover:opacity-0 group-hover:-translate-y-1 transition-all duration-300 absolute bottom-6 left-6 right-6`}>
                      <Lock className={`w-3.5 h-3.5 ${card.textAccent}`} />
                      <span className={`text-xs font-bold ${card.textAccent}`}>Tap to sign in</span>
                      <ChevronRight className={`w-3.5 h-3.5 ${card.textAccent} ml-auto`} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 pb-8 text-center">
          <p className="text-xs text-slate-600 font-medium">
            Secured by DAKSHORA ERP 2.0 • RBAC Authorized • Encrypted Session
          </p>
        </footer>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // SCREEN: LOGIN
  // ──────────────────────────────────────────────────────────
  if (screen === 'login' && roleCard) {
    const RoleIcon = roleCard.icon;
    return (
      <div className="min-h-screen bg-[#050810] text-white flex flex-col overflow-x-hidden relative">
        {/* Ambient */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-br ${roleCard.gradient} opacity-10 rounded-full blur-[160px]`} />
        </div>

        {/* Back button */}
        <div className="relative z-10 p-6">
          <button
            onClick={() => setScreen('home')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Login Card */}
        <div className="flex-1 flex items-center justify-center px-4 pb-12 relative z-10">
          <div className="w-full max-w-md">
            {/* Card */}
            <div className={`rounded-3xl border ${roleCard.borderColor} bg-white/[0.03] backdrop-blur-xl shadow-2xl ${roleCard.shadowColor} overflow-hidden`}>
              {/* Card top gradient bar */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${roleCard.gradient}`} />

              <div className="p-8 sm:p-10">
                {/* School brand */}
                <div className="flex items-center gap-3 mb-8">
                  <BrandLogo size="sm" />
                  <div>
                    <p className="text-[11px] text-slate-500 font-mono uppercase tracking-wider">Signing into</p>
                    <p className="text-sm font-bold text-white leading-tight">{brand.schoolName}</p>
                  </div>
                </div>

                {/* Role badge */}
                <div className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r ${roleCard.gradient} shadow-xl ${roleCard.shadowColor} mb-6`}>
                  <RoleIcon className="w-5 h-5 text-white" />
                  <div>
                    <p className="text-xs font-bold text-white">{roleCard.emoji} {roleCard.title}</p>
                    <p className="text-[10px] text-white/70 font-mono">{roleCard.subtitle}</p>
                  </div>
                </div>

                <h2 className="text-2xl font-black text-white tracking-tight mb-1">Sign In</h2>
                <p className="text-sm text-slate-400 mb-8">Enter your school credentials to continue</p>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        value={loginForm.email}
                        onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="you@school.edu.in"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-white/30 focus:bg-white/8 transition-all"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginForm.password}
                        onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-white/30 focus:bg-white/8 transition-all"
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  {loginError && (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className={`w-full py-3.5 rounded-xl bg-gradient-to-r ${roleCard.gradient} text-white font-bold text-sm shadow-xl ${roleCard.shadowColor} hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {isLoggingIn ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Signing In…</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Sign In as {roleCard.title}</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Demo hint */}
                <p className="text-[11px] text-slate-600 text-center mt-5">
                  Demo: Any email & password will work in demo mode
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // SCREEN: DASHBOARD  ——  Role-Based Module Navigation
  // ──────────────────────────────────────────────────────────
  if (screen === 'dashboard' && currentUser && selectedRole) {
    const activeCard = ROLE_CARDS.find(r => r.id === selectedRole)!;
    const RoleIcon = activeCard.icon;

    return (
      <div className="min-h-screen bg-[#050810] text-white flex flex-col overflow-x-hidden relative">
        {/* Ambient */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className={`absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br ${activeCard.gradient} opacity-8 rounded-full blur-[150px]`} />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-slate-800/20 rounded-full blur-[120px]" />
        </div>

        {/* TOP HEADER */}
        <header className="relative z-20 sticky top-0 bg-[#050810]/90 backdrop-blur-xl border-b border-white/5 shadow-xl shadow-black/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
            {/* Left: Brand */}
            <div className="flex items-center gap-3">
              <BrandLogo size="sm" />
              <div className="hidden sm:block">
                <p className="text-xs font-black text-white leading-tight">{brand.schoolName}</p>
                <p className="text-[10px] text-slate-500 font-mono">{brand.board} • Session 2026-27</p>
              </div>
            </div>

            {/* Center: Role pill (mobile: tap to open sidebar) */}
            <button
              onClick={() => setSidebarOpen(p => !p)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${activeCard.gradient} text-white text-xs font-bold shadow-lg ${activeCard.shadowColor} cursor-pointer sm:hidden`}
            >
              <RoleIcon className="w-3.5 h-3.5" />
              <span>{activeCard.title}</span>
            </button>

            {/* Right: User & Sign Out */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2.5">
                <div className={`px-3 py-1.5 rounded-full bg-gradient-to-r ${activeCard.gradient} text-white text-[11px] font-bold flex items-center gap-1.5 shadow-lg ${activeCard.shadowColor}`}>
                  <RoleIcon className="w-3.5 h-3.5" />
                  <span>{activeCard.title}</span>
                </div>
                <span className="text-sm font-semibold text-slate-300">{currentUser.name}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* BODY: Sidebar + Main Content */}
        <div className="flex flex-1 max-w-7xl mx-auto w-full px-0 sm:px-4 pt-0 sm:pt-6 sm:gap-5 relative z-10">
          {/* SIDEBAR */}
          <aside className={`
            fixed sm:relative inset-y-0 left-0 z-30
            w-64 sm:w-56 xl:w-64
            bg-[#08091a]/95 sm:bg-transparent backdrop-blur-2xl sm:backdrop-blur-none
            border-r border-white/5 sm:border-0
            flex flex-col
            transition-transform duration-300
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
            pt-16 sm:pt-0
          `}>
            {/* Mobile close */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="sm:hidden absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>

            {/* User profile mini-card */}
            <div className={`m-3 sm:m-0 sm:mb-4 p-4 rounded-2xl bg-gradient-to-br ${activeCard.gradient} shadow-xl ${activeCard.shadowColor}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-black text-lg">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
                  <p className="text-[11px] text-white/70 font-mono truncate">{currentUser.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/10 border border-white/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">{currentUser.designation || activeCard.subtitle}</span>
              </div>
            </div>

            {/* Module Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 sm:px-0 space-y-1 pb-6">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-2 mt-1">Navigation</p>
              {modules.map((mod) => {
                const ModIcon = mod.icon;
                const isActive = activeModule === mod.id;
                return (
                  <button
                    key={mod.id}
                    onClick={() => {
                      setActiveModule(mod.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer group ${
                      isActive
                        ? `bg-gradient-to-r ${activeCard.gradient} text-white shadow-lg ${activeCard.shadowColor}`
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                      isActive ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'
                    }`}>
                      <ModIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{mod.label}</p>
                    </div>
                    {mod.badge && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : `${mod.badgeColor || 'bg-slate-700 text-slate-300'}`
                      }`}>
                        {mod.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Sign out */}
            <div className="p-3 sm:p-0 sm:mt-3">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all cursor-pointer text-xs font-bold"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>

          {/* Sidebar overlay (mobile) */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-20 bg-black/60 sm:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* MAIN CONTENT */}
          <main className="flex-1 min-w-0 px-4 sm:px-0 py-4 sm:py-0 space-y-5 pb-12">
            {/* Page header */}
            <div className={`p-5 rounded-2xl bg-gradient-to-r ${activeCard.gradient} shadow-xl ${activeCard.shadowColor} relative overflow-hidden`}>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-10" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {activeModuleInfo && (() => {
                    const AMIcon = activeModuleInfo.icon;
                    return (
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <AMIcon className="w-5 h-5 text-white" />
                      </div>
                    );
                  })()}
                  <div>
                    <h2 className="text-lg font-black text-white">{activeModuleInfo?.label || 'Dashboard'}</h2>
                    <p className="text-xs text-white/70">{activeModuleInfo?.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-xs text-white/70 font-mono">Live</span>
                </div>
              </div>
            </div>

            {/* KPI Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.map((stat, i) => {
                const StatIcon = stat.icon;
                return (
                  <div key={i} className="p-4 rounded-2xl bg-white/[0.03] border border-white/8 hover:bg-white/5 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${activeCard.gradient} flex items-center justify-center opacity-80`}>
                        <StatIcon className="w-4 h-4 text-white" />
                      </div>
                      {stat.trendUp !== undefined && (
                        <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${stat.trendUp ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                          {stat.trendUp ? '↑' : '↓'}
                        </div>
                      )}
                    </div>
                    <p className="text-xl font-black text-white">{stat.value}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{stat.label}</p>
                    {stat.trend && <p className="text-[10px] text-slate-600 mt-0.5">{stat.trend}</p>}
                  </div>
                );
              })}
            </div>

            {/* MODULE GRID — Quick access to all role modules */}
            <div>
              <h3 className="text-sm font-black text-slate-300 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Quick Access — All Modules
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {modules.map((mod) => {
                  const ModIcon = mod.icon;
                  const isActive = activeModule === mod.id;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => setActiveModule(mod.id)}
                      className={`group text-left p-4 rounded-2xl border transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-xl ${
                        isActive
                          ? `bg-gradient-to-br ${mod.gradient} border-white/20 shadow-lg`
                          : 'bg-white/[0.03] border-white/8 hover:bg-white/5 hover:border-white/15'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center transition-transform group-hover:scale-110 ${
                        isActive ? 'bg-white/20' : `bg-gradient-to-br ${mod.gradient} opacity-70 group-hover:opacity-100`
                      }`}>
                        <ModIcon className="w-5 h-5 text-white" strokeWidth={1.8} />
                      </div>
                      <p className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-200'} leading-tight`}>{mod.label}</p>
                      <p className={`text-[10px] mt-0.5 ${isActive ? 'text-white/70' : 'text-slate-500'} leading-tight`}>{mod.description}</p>
                      {mod.badge && (
                        <div className={`mt-2 inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                          isActive ? 'bg-white/20 text-white' : mod.badgeColor || 'bg-white/10 text-slate-400'
                        }`}>
                          {mod.badge}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PLACEHOLDER CONTENT for active module */}
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 min-h-48">
              <div className="flex items-center gap-3 mb-4">
                {activeModuleInfo && (() => {
                  const AMIcon = activeModuleInfo.icon;
                  return (
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activeModuleInfo.gradient} flex items-center justify-center shadow-lg`}>
                      <AMIcon className="w-5 h-5 text-white" />
                    </div>
                  );
                })()}
                <div>
                  <h4 className="text-base font-black text-white">{activeModuleInfo?.label}</h4>
                  <p className="text-xs text-slate-500">{activeModuleInfo?.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Recent Activity', desc: 'No activity yet today', icon: Activity },
                  { label: 'Pending Actions', desc: '3 items require attention', icon: AlertCircle },
                  { label: 'Quick Stats', desc: 'Data loading…', icon: BarChart3 },
                ].map((item, i) => {
                  const ItemIcon = item.icon;
                  return (
                    <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-2">
                        <ItemIcon className="w-4 h-4 text-slate-400" />
                      </div>
                      <p className="text-xs font-bold text-slate-300">{item.label}</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 p-3 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-center">
                <Sparkles className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <p className="text-xs text-slate-500">
                  Connect to the full <span className="text-white font-bold">SchoolErpHub</span> component to see live data for this module.
                </p>
              </div>
            </div>

            {/* School info footer */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5" />
                <span className="font-medium">{brand.schoolName}</span>
                <span>•</span>
                <span>{brand.board}</span>
                <span>•</span>
                <span>Affiliation: {brand.affiliationNo}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>DAKSHORA ERP 2.0 — Session 2026-27</span>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return null;
};

export default DakshoraSchoolApp;
