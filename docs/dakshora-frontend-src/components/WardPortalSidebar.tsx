import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  BookOpen,
  Award,
  CreditCard,
  Clock,
  Bus,
  Bell,
  QrCode,
  Bot,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Phone,
  GraduationCap,
  Users,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  LogOut
} from 'lucide-react';
import { useTranslation } from '../i18n';

export type WardPortalTab =
  | 'pulse'
  | 'attendance'
  | 'homework'
  | 'report_cards'
  | 'fees'
  | 'timetable'
  | 'bus_tracker'
  | 'notices'
  | 'id_badge'
  | 'skill_passport'
  | 'ai_tutor';

export interface WardNavModule {
  id: WardPortalTab;
  label: string;
  hindiLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string | number | null;
  badgeColor?: string;
  gradient: string;
}

export interface WardNavGroup {
  id: string;
  title: string;
  hindiTitle?: string;
  items: WardNavModule[];
}

interface WardPortalSidebarProps {
  activeTab: WardPortalTab;
  onSelectTab: (tab: WardPortalTab) => void;
  isDesktopCollapsed: boolean;
  setIsDesktopCollapsed: (collapsed: boolean) => void;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean) => void;
  schoolName: string;
  affiliationNo?: string;
  schoolCode?: string;
  board?: string;
  schoolLogo?: string;
  wards: any[];
  activeWardId: string;
  onSelectWard: (wardId: string) => void;
  portalMode: 'parent' | 'student';
  setPortalMode: (mode: 'parent' | 'student') => void;
  counts?: {
    homework?: number;
    notices?: number;
    attendancePercent?: number | string;
    feeDue?: number | string;
    busStatus?: string;
  };
  onOpenGatePass?: () => void;
  onOpenSOS?: () => void;
  onNavigateSurface?: (surface: string) => void;
  onLogout?: () => void;
  onOpenStudentDetail?: () => void;
}

export const WardPortalSidebar: React.FC<WardPortalSidebarProps> = ({
  activeTab,
  onSelectTab,
  isDesktopCollapsed,
  setIsDesktopCollapsed,
  isMobileDrawerOpen,
  setIsMobileDrawerOpen,
  schoolName,
  affiliationNo = 'CBSE-AFF-2130894',
  schoolCode = 'SCH-2026',
  board = 'CBSE',
  schoolLogo = '/assets/schools/new-ideal-logo.svg',
  wards = [],
  activeWardId,
  onSelectWard,
  portalMode,
  setPortalMode,
  counts,
  onOpenGatePass,
  onOpenSOS,
  onNavigateSurface,
  onLogout,
  onOpenStudentDetail
}) => {
  const { t, isHindi, isBilingual } = useTranslation();
  const [showWardDropdown, setShowWardDropdown] = useState(false);

  const getItemLabel = (item: WardNavModule) => {
    if (isHindi) return item.hindiLabel || t(`portal.${item.id}`, item.label);
    if (isBilingual) return item.hindiLabel ? `${item.label} (${item.hindiLabel})` : item.label;
    return item.label;
  };

  const getGroupTitle = (group: WardNavGroup) => {
    if (isHindi) return group.hindiTitle || group.title;
    if (isBilingual) return group.hindiTitle ? `${group.title} / ${group.hindiTitle}` : group.title;
    return group.title;
  };

  const handleLogoutClick = () => {
    if (isMobileDrawerOpen) {
      setIsMobileDrawerOpen(false);
    }
    if (onLogout) {
      onLogout();
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
  };

  // Active Ward info
  const activeWard = wards.find((w) => w.id === activeWardId) || wards[0] || {
    id: 'std-101',
    name: 'Aarav Sharma',
    grade: 'Class 10',
    section: 'A',
    rollNo: 14,
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120'
  };

  // Keyboard navigation: Escape key closes mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileDrawerOpen) {
        setIsMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileDrawerOpen, setIsMobileDrawerOpen]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileDrawerOpen]);

  // Menu Groups & Modules Definition
  const menuGroups: WardNavGroup[] = [
    {
      id: 'overview',
      title: 'Command Centre',
      hindiTitle: 'कमांड सेंटर',
      items: [
        {
          id: 'pulse',
          label: 'Daily Pulse',
          hindiLabel: 'दैनिक पल्स',
          icon: Sparkles,
          description: "Live student highlights & today's summary",
          badge: 'Live',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          gradient: 'from-cyan-500 to-blue-600'
        }
      ]
    },
    {
      id: 'academics',
      title: 'Academics & Daily Life',
      hindiTitle: 'शैक्षणिक व दैनिक जीवन',
      items: [
        {
          id: 'attendance',
          label: 'Attendance & Leaves',
          hindiLabel: 'उपस्थिति व अवकाश',
          icon: Calendar,
          description: 'Daily check-in, leave application & monthly %',
          badge: counts?.attendancePercent ? `${counts.attendancePercent}%` : '95.8%',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          gradient: 'from-emerald-500 to-teal-600'
        },
        {
          id: 'homework',
          label: 'Homework Diary',
          hindiLabel: 'गृहकार्य डायरी',
          icon: BookOpen,
          description: 'Daily assignments & teacher submissions',
          badge: counts?.homework !== undefined ? counts.homework : 3,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          gradient: 'from-amber-500 to-orange-600'
        },
        {
          id: 'report_cards',
          label: 'CBSE Report Cards',
          hindiLabel: 'सीबीएसई अंकतालिका',
          icon: Award,
          description: 'Term marksheet, GPA, ranks & official PDF',
          badge: 'Term 1',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          gradient: 'from-purple-500 to-indigo-600'
        },
        {
          id: 'timetable',
          label: 'Class Routine',
          hindiLabel: 'कक्षा समय-सारणी',
          icon: Clock,
          description: 'Daily periods, subjects, teachers & labs',
          badge: 'Period 2',
          badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          gradient: 'from-sky-500 to-blue-600'
        },
        {
          id: 'ai_tutor',
          label: 'AI Study Partner',
          hindiLabel: 'एआई अध्ययन साथी',
          icon: Bot,
          description: '24/7 CBSE doubt solver & formula guide',
          badge: '24/7 AI',
          badgeColor: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
          gradient: 'from-fuchsia-500 to-pink-600'
        },
        {
          id: 'skill_passport',
          label: 'Skill Passport (NEP)',
          hindiLabel: 'कौशल पासपोर्ट',
          icon: ShieldCheck,
          description: 'Holistic Progress Card & co-scholastic skills',
          badge: 'HPC',
          badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
          gradient: 'from-teal-500 to-emerald-600'
        }
      ]
    },
    {
      id: 'services',
      title: 'Campus & Safety Services',
      hindiTitle: 'परिसर सेवाएं एवं सुरक्षा',
      items: [
        {
          id: 'fees',
          label: 'Fees & Receipts',
          hindiLabel: 'फीस एवं रसीदें',
          icon: CreditCard,
          description: 'Online UPI payment, fee demand & receipts',
          badge: counts?.feeDue ? `₹${counts.feeDue}` : '₹4,500',
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          gradient: 'from-rose-500 to-pink-600'
        },
        {
          id: 'bus_tracker',
          label: 'Live Bus Tracker',
          hindiLabel: 'लाइव बस ट्रैकर',
          icon: Bus,
          description: 'GPS route tracking, stops & driver contact',
          badge: 'Live GPS',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse',
          gradient: 'from-emerald-500 to-cyan-600'
        },
        {
          id: 'notices',
          label: 'Notices & Circulars',
          hindiLabel: 'सूचनाएं व परिपत्र',
          icon: Bell,
          description: 'Official principal alerts & event updates',
          badge: counts?.notices !== undefined ? counts.notices : 2,
          badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
          gradient: 'from-amber-500 to-yellow-600'
        },
        {
          id: 'id_badge',
          label: 'Digital Student ID',
          hindiLabel: 'डिजिटल पहचान पत्र',
          icon: QrCode,
          description: 'RFID barcode, gate pass QR & health badge',
          badge: 'QR Active',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          gradient: 'from-indigo-500 to-blue-600'
        }
      ]
    }
  ];

  // Helper to handle navigation click
  const handleItemClick = (tabId: WardPortalTab) => {
    onSelectTab(tabId);
    if (isMobileDrawerOpen) {
      setIsMobileDrawerOpen(false);
    }
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. MOBILE TOP STICKY APPLICATION BAR */}
      {/* ========================================================================= */}
      <div className="lg:hidden sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer"
            aria-label="Open Ward Portal Menu"
          >
            <Menu className="w-5 h-5 text-cyan-400" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white p-1 border border-slate-700 shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src={schoolLogo}
                alt={schoolName}
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
              <h2 className="text-xs font-black text-white tracking-tight line-clamp-1">
                {schoolName}
              </h2>
              <div className="text-[10px] text-cyan-400 font-mono font-semibold flex items-center gap-1">
                <span>Ward Portal</span>
                <span>•</span>
                <span className="text-slate-400">{activeWard.name}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick SOS Helpline */}
          <button
            onClick={onOpenSOS}
            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
            title="Emergency SOS Helpline"
          >
            <Phone className="w-4 h-4 animate-pulse" />
          </button>

          {/* Ward Avatar button */}
          <button
            onClick={onOpenStudentDetail || (() => handleItemClick('id_badge'))}
            className="relative p-0.5 rounded-full ring-2 ring-cyan-500/40 cursor-pointer"
            title="Digital Student ID Card"
          >
            <img
              src={activeWard.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80'}
              alt={activeWard.name}
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950"></span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE NAVIGATION DRAWER (Slide-in from Left) */}
      {/* ========================================================================= */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-slate-950 border-r border-slate-800/90 shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-300">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white p-1 border border-slate-700 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src={schoolLogo}
                    alt={schoolName}
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
                  <h3 className="text-sm font-black text-white line-clamp-1">{schoolName}</h3>
                  <p className="text-[10px] text-cyan-400 font-mono font-bold">
                    {board} Affiliated • {affiliationNo}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                aria-label="Close Navigation Drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Active Ward Profile Card inside Drawer */}
            <div className="p-4 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-950 border-b border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  Active Ward Profile
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Class Roll #{activeWard.rollNo || 14}
                </span>
              </div>

              <div 
                onClick={onOpenStudentDetail || onOpenGatePass}
                className="flex items-center gap-3 cursor-pointer group"
                title="Click to view Full Student Details"
              >
                <div className="relative shrink-0">
                  <img
                    src={activeWard.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={activeWard.name}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-cyan-500/40 group-hover:ring-cyan-300 shadow-md transition-all group-hover:scale-105"
                  />
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-extrabold text-white group-hover:text-cyan-300 transition-colors truncate">{activeWard.name}</h4>
                    <span className="text-[9px] font-mono text-cyan-400">View ↗</span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">
                    {activeWard.grade || 'Class 10'}-{activeWard.section || 'A'} • Roll #{activeWard.rollNo || 'R-02'}
                  </p>
                </div>
              </div>

              {/* Sibling Switcher if multiple wards */}
              {wards.length > 1 && (
                <div className="mt-3 pt-3 border-t border-slate-800/80">
                  <div className="text-[10px] text-slate-400 font-mono mb-1.5">Switch Enrolled Ward:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {wards.map((w) => (
                      <button
                        key={w.id}
                        onClick={() => onSelectWard(w.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all ${
                          activeWardId === w.id
                            ? 'bg-cyan-500 text-slate-950 shadow-sm'
                            : 'bg-slate-900 text-slate-300 border border-slate-800'
                        }`}
                      >
                        {w.name.split(' ')[0]} ({w.grade})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Menu List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
              {menuGroups.map((group) => (
                <div key={group.id} className="space-y-1">
                  <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                    {getGroupTitle(group)}
                  </div>

                  {group.items.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        className={`w-full min-h-[44px] px-3 py-2.5 rounded-2xl text-left transition-all flex items-center justify-between cursor-pointer border ${
                          isActive
                            ? 'bg-gradient-to-r from-cyan-950/70 via-indigo-950/60 to-slate-900 border-cyan-500/50 shadow-md text-white'
                            : 'bg-transparent hover:bg-slate-900/80 border-transparent text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
                              isActive
                                ? `bg-gradient-to-br ${item.gradient} text-white shadow-md shadow-cyan-500/25`
                                : 'bg-slate-900 text-slate-400 border border-slate-800'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold leading-tight truncate">{getItemLabel(item)}</div>
                            <div className="text-[10px] text-slate-500 truncate mt-0.5">{item.description}</div>
                          </div>
                        </div>

                        {item.badge && (
                          <span
                            className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${
                              item.badgeColor || 'bg-slate-900 text-slate-300 border-slate-800'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-3 border-t border-slate-800/80 bg-slate-950 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPortalMode('parent')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    portalMode === 'parent'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  {isHindi ? '👨‍👩‍👧 अभिभावक' : isBilingual ? '👨‍👩‍👧 Parent / अभिभावक' : '👨‍👩‍👧 Parent'}
                </button>
                <button
                  onClick={() => setPortalMode('student')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    portalMode === 'student'
                      ? 'bg-teal-600 text-white border-teal-500 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  {isHindi ? '🎓 विद्यार्थी' : isBilingual ? '🎓 Student / विद्यार्थी' : '🎓 Student'}
                </button>
              </div>

              {onNavigateSurface && (
                <button
                  onClick={() => onNavigateSurface('public_website')}
                  className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isHindi ? 'स्कूल वेबसाइट' : isBilingual ? 'Website / वेबसाइट' : 'Public School Website'}</span>
                </button>
              )}

              {/* 🚪 LOGOUT BUTTON (AT THE VERY BOTTOM OF HAMBURGER MENU) */}
              <button
                onClick={handleLogoutClick}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-950/70 to-red-950/60 hover:from-rose-900/80 hover:to-red-900/70 border border-rose-500/40 hover:border-rose-500/70 text-rose-200 hover:text-white text-xs font-bold font-mono flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-950/40 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>{isHindi ? 'लॉगआउट' : isBilingual ? 'Logout / लॉगआउट' : 'Sign Out'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DESKTOP COLLAPSIBLE PERSISTENT SIDEBAR (>= 1024px) */}
      {/* ========================================================================= */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 border-r border-slate-800/80 bg-slate-950/95 backdrop-blur-xl transition-all duration-300 relative z-20 ${
          isDesktopCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        {/* Top School Brand Header */}
        <div className="h-20 px-4 border-b border-slate-800/80 flex items-center justify-between gap-2">
          {!isDesktopCollapsed ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-white p-1 border border-slate-700 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src={schoolLogo}
                  alt={schoolName}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (!target.src.includes('new-ideal-logo.svg')) {
                      target.src = '/assets/schools/new-ideal-logo.svg';
                    }
                  }}
                />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-black text-white tracking-tight truncate">{schoolName}</h2>
                <div className="text-[10px] text-cyan-400 font-mono font-bold flex items-center gap-1">
                  <span>Ward Portal</span>
                  <span>•</span>
                  <span className="text-slate-400 font-normal">{board}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 mx-auto rounded-2xl bg-white p-1 border border-slate-700 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src={schoolLogo}
                alt={schoolName}
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (!target.src.includes('new-ideal-logo.svg')) {
                    target.src = '/assets/schools/new-ideal-logo.svg';
                  }
                }}
              />
            </div>
          )}

          {/* Desktop Collapse / Expand Toggle Button */}
          <button
            onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer shrink-0"
            title={isDesktopCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={isDesktopCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isDesktopCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-cyan-400" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>

        {/* Active Ward Card in Sidebar */}
        {!isDesktopCollapsed ? (
          <div className="p-3 mx-3 mt-3 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-950 border border-slate-800/90 shadow-inner">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenStudentDetail || onOpenGatePass}
                className="relative rounded-xl ring-2 ring-cyan-500/40 hover:ring-cyan-300 hover:scale-105 transition-all cursor-pointer group shrink-0"
                title="Click student picture to view Full Student Details"
              >
                <img
                  src={activeWard.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={activeWard.name}
                  className="w-10 h-10 rounded-xl object-cover"
                />
                <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
              </button>
              <div 
                onClick={onOpenStudentDetail || onOpenGatePass}
                className="flex-1 min-w-0 cursor-pointer group select-none"
                title="Click to view Full Student Master Record & Details"
              >
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-black text-white group-hover:text-cyan-300 transition-colors truncate">
                    {activeWard.name}
                  </h4>
                  <span className="text-[9px] font-mono font-bold text-cyan-400 opacity-80 group-hover:opacity-100 transition-opacity">
                    View ↗
                  </span>
                </div>
                <div className="text-[10px] text-slate-300 font-mono mt-0.5">
                  {activeWard.grade || 'Class 10'}-{activeWard.section || 'A'} • Roll #{activeWard.rollNo || 'R-02'}
                </div>
              </div>
            </div>

            {/* Sibling Switcher if multiple wards exist */}
            {wards.length > 1 && (
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                <span className="text-slate-400 font-mono">Enrolled:</span>
                <div className="flex items-center gap-1">
                  {wards.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => onSelectWard(w.id)}
                      className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all ${
                        activeWardId === w.id
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {w.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-2 mx-auto mt-3">
            <button
              onClick={onOpenStudentDetail || (() => setIsDesktopCollapsed(false))}
              className="relative p-0.5 rounded-xl ring-2 ring-cyan-500/40 cursor-pointer block"
              title={`${activeWard.name} (${activeWard.grade}-${activeWard.section})`}
            >
              <img
                src={activeWard.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100'}
                alt={activeWard.name}
                className="w-10 h-10 rounded-xl object-cover"
              />
              <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
            </button>
          </div>
        )}

        {/* Scrollable Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 scrollbar-thin">
          {menuGroups.map((group) => (
            <div key={group.id} className="space-y-1">
              {!isDesktopCollapsed && (
                <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  {getGroupTitle(group)}
                </div>
              )}

              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;

                return (
                  <div key={item.id} className="relative group">
                    <button
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full min-h-[42px] rounded-2xl text-left transition-all flex items-center cursor-pointer border ${
                        isDesktopCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
                      } ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-950/70 via-indigo-950/60 to-slate-900 border-cyan-500/50 shadow-md text-white font-bold'
                          : 'bg-transparent hover:bg-slate-900/80 border-transparent text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                            isActive
                              ? `bg-gradient-to-br ${item.gradient} text-white shadow-md shadow-cyan-500/25`
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        {!isDesktopCollapsed && (
                          <div className="min-w-0">
                            <div className="text-xs font-bold leading-tight truncate">{getItemLabel(item)}</div>
                            <div className="text-[10px] text-slate-500 truncate mt-0.5">{item.description}</div>
                          </div>
                        )}
                      </div>

                      {!isDesktopCollapsed && item.badge && (
                        <span
                          className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${
                            item.badgeColor || 'bg-slate-900 text-slate-300 border-slate-800'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>

                    {/* Accessible Tooltip in Collapsed State */}
                    {isDesktopCollapsed && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-slate-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 flex items-center gap-2">
                        <span>{getItemLabel(item)}</span>
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-mono border ${
                              item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Desktop Sidebar Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950 space-y-2">
          {!isDesktopCollapsed ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPortalMode('parent')}
                  className={`py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    portalMode === 'parent'
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {isHindi ? '👨‍👩‍👧 अभिभावक' : isBilingual ? '👨‍👩‍👧 Parent / अभिभावक' : '👨‍👩‍👧 Parent'}
                </button>
                <button
                  onClick={() => setPortalMode('student')}
                  className={`py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    portalMode === 'student'
                      ? 'bg-teal-600 text-white border-teal-500 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {isHindi ? '🎓 विद्यार्थी' : isBilingual ? '🎓 Student / विद्यार्थी' : '🎓 Student'}
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
                <span>{isHindi ? 'सत्र 2026-27' : 'Session 2026-27'}</span>
                <button
                  onClick={onOpenSOS}
                  className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Phone className="w-3 h-3" />
                  <span>{isHindi ? 'हेल्पलाइन' : isBilingual ? 'SOS / हेल्पलाइन' : 'SOS Helpline'}</span>
                </button>
              </div>

              {/* 🚪 LOGOUT BUTTON (DESKTOP EXPANDED) */}
              <button
                onClick={handleLogoutClick}
                className="w-full mt-2 py-2 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 hover:border-rose-500/60 text-rose-300 hover:text-white text-xs font-bold font-mono flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>{isHindi ? 'लॉगआउट' : isBilingual ? 'Logout / लॉगआउट' : 'Sign Out'}</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={onOpenSOS}
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
                title={isHindi ? 'हेल्पलाइन' : 'SOS Emergency Helpline'}
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                onClick={handleLogoutClick}
                className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-400 hover:text-white transition-colors cursor-pointer"
                title={isHindi ? 'लॉगआउट' : 'Logout / लॉगआउट'}
                aria-label="Logout / लॉगआउट"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
