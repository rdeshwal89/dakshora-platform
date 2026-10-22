import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  BookOpen,
  BookMarked,
  GraduationCap,
  Calendar,
  Clock,
  Award,
  Cpu,
  CreditCard,
  DollarSign,
  Bus,
  Library,
  Bell,
  Sparkles,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Building2,
  Shield,
  HelpCircle,
  ExternalLink,
  Search,
  CheckCircle2,
  Palette
} from 'lucide-react';
import { ErpRole, ErpModule } from '../types';
import { SchoolBrandProfile } from './SchoolBrandingModal';
import { useTranslation } from '../i18n';

export interface NavModuleDefinition {
  id: ErpModule;
  label: string;
  hindiLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  count?: number;
  badge?: string;
  badgeColor?: string;
}

export interface NavGroupDefinition {
  id: string;
  title: string;
  hindiTitle?: string;
  items: NavModuleDefinition[];
}

interface ResponsiveSidebarProps {
  activeModule: ErpModule;
  onSelectModule: (mod: ErpModule) => void;
  activeRole: ErpRole;
  allowedModules: ErpModule[];
  schoolBrand: SchoolBrandProfile;
  currentUser?: any;
  onShowBrandingModal?: () => void;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean) => void;
  isDesktopCollapsed: boolean;
  setIsDesktopCollapsed: (collapsed: boolean) => void;
  counts?: {
    students?: number;
    staff?: number;
    admissions?: number;
    notices?: number;
    feesDue?: number;
    library?: number;
  };
  activeSession?: string;
  onNavigateSurface?: (surface: string) => void;
}

export const ResponsiveSidebar: React.FC<ResponsiveSidebarProps> = ({
  activeModule,
  onSelectModule,
  activeRole,
  allowedModules,
  schoolBrand,
  currentUser,
  onShowBrandingModal,
  isMobileDrawerOpen,
  setIsMobileDrawerOpen,
  isDesktopCollapsed,
  setIsDesktopCollapsed,
  counts,
  activeSession = '2026-27',
  onNavigateSurface
}) => {
  const { t } = useTranslation();
  const [searchFilter, setSearchFilter] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('dakshora_sidebar_group_collapse');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Handle ESC key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileDrawerOpen) {
        setIsMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileDrawerOpen, setIsMobileDrawerOpen]);

  // Lock body scroll when mobile drawer is open
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

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      try {
        localStorage.setItem('dakshora_sidebar_group_collapse', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Modern Enterprise Menu Groups
  const rawGroups: NavGroupDefinition[] = useMemo(() => [
    {
      id: 'command_centre',
      title: 'Command Centre',
      hindiTitle: 'कमांड सेंटर',
      items: [
        {
          id: 'dashboard',
          label: t('nav.dashboard', 'Command Cockpit'),
          icon: LayoutDashboard,
          description: 'Live Institutional KPIs & Real-Time Operations'
        },
        {
          id: 'ai',
          label: t('nav.ai', 'DAKSHORA AI Co-Pilot'),
          icon: Sparkles,
          description: 'Autonomous Assistant & Question Paper Generator',
          badge: 'Gemini'
        }
      ]
    },
    {
      id: 'students_admissions',
      title: 'Students & Admissions',
      hindiTitle: 'छात्र व प्रवेश',
      items: [
        {
          id: 'students',
          label: t('nav.students', 'Student Information'),
          icon: Users,
          count: counts?.students,
          description: 'UDISE+ Registry, Student Bio-Data & ID Cards'
        },
        {
          id: 'admissions',
          label: t('nav.admissions', 'Admissions CRM'),
          icon: UserPlus,
          count: counts?.admissions,
          description: 'Inquiries, Online Forms & Transfer Certificates'
        },
        {
          id: 'journal',
          label: t('nav.journal', 'Teaching Journal'),
          icon: BookMarked,
          description: 'Faculty Daily Lesson Logs & Reflections'
        }
      ]
    },
    {
      id: 'faculty_staff',
      title: 'Faculty & Roster',
      hindiTitle: 'शिक्षक व कर्मचारी',
      items: [
        {
          id: 'staff',
          label: t('nav.staff', 'Staff & Faculty'),
          icon: GraduationCap,
          count: counts?.staff,
          description: 'Teacher Directory, Workload & Qualifications'
        },
        {
          id: 'attendance',
          label: t('nav.attendance', 'Attendance Hub'),
          icon: Calendar,
          description: 'Classroom Roll-Call, Staff Register & Absentee Alerts'
        },
        {
          id: 'timetable',
          label: t('nav.timetable', 'Class Timetable'),
          icon: Clock,
          description: 'Automated Bell Schedules & Room Allocations'
        }
      ]
    },
    {
      id: 'academics_exams',
      title: 'Academics & Exams',
      hindiTitle: 'शैक्षणिक व परीक्षा',
      items: [
        {
          id: 'academics',
          label: t('nav.academics', 'Curriculum & Classes'),
          icon: BookOpen,
          description: 'Classes, Sections & Syllabus Allotments'
        },
        {
          id: 'exams',
          label: t('nav.exams', 'Examinations & Results'),
          icon: Award,
          description: 'Exam Schedules, Marksheets & Report Cards'
        },
        {
          id: 'robotics',
          label: t('nav.robotics', 'Robotics & ATAL Lab'),
          icon: Cpu,
          badge: 'ATAL',
          description: 'STEM Curriculum, IoT Kits & Project Tracker'
        }
      ]
    },
    {
      id: 'finance_facilities',
      title: 'Finance & Facilities',
      hindiTitle: 'वित्त व सुविधाएं',
      items: [
        {
          id: 'fees',
          label: t('nav.fees', 'Fee Management'),
          icon: CreditCard,
          count: counts?.feesDue,
          description: 'Invoices, Instant UPI QR & Payment Ledgers'
        },
        {
          id: 'payroll',
          label: t('nav.payroll', 'Staff Payroll'),
          icon: DollarSign,
          description: 'Salary Calculation, PF Deductions & Pay Slips'
        },
        {
          id: 'transport',
          label: t('nav.transport', 'School Transport'),
          icon: Bus,
          description: 'Bus Routes, Driver Directory & Live GPS'
        },
        {
          id: 'library',
          label: t('nav.library', 'Digital Library'),
          icon: Library,
          count: counts?.library,
          description: 'Book Catalog, ISBN Search & Circulation'
        }
      ]
    },
    {
      id: 'communication_reports',
      title: 'Notices & Reports',
      hindiTitle: 'सूचना व रिपोर्ट',
      items: [
        {
          id: 'communication',
          label: t('nav.communication', 'Notice Board'),
          icon: Bell,
          count: counts?.notices,
          description: 'Multi-Channel Push, SMS & WhatsApp Alerts'
        },
        {
          id: 'reports',
          label: t('nav.reports', 'CBSE Analytics'),
          icon: BarChart3,
          description: 'Subject Trend Analysis & PDF Reports'
        },
        {
          id: 'portal',
          label: t('nav.portal', 'Parent & Ward Portal'),
          icon: Sparkles,
          description: 'Self-Service Student Bio-Data & Fee Payment'
        }
      ]
    },
    {
      id: 'administration',
      title: 'System Settings',
      hindiTitle: 'सिस्टम सेटिंग्स',
      items: [
        {
          id: 'settings',
          label: t('nav.settings', 'Master Settings'),
          icon: Settings,
          description: 'Institutional Profile, Cutoffs & Gateway Keys'
        }
      ]
    }
  ], [t, counts]);

  // Filter groups according to RBAC allowedModules and active search
  const visibleGroups = useMemo(() => {
    return rawGroups
      .map(group => {
        const filteredItems = group.items.filter(item => {
          const isAllowed = allowedModules.includes(item.id);
          if (!isAllowed) return false;
          if (!searchFilter.trim()) return true;
          const query = searchFilter.toLowerCase();
          return (
            item.label.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            item.id.toLowerCase().includes(query)
          );
        });
        return {
          ...group,
          items: filteredItems
        };
      })
      .filter(group => group.items.length > 0);
  }, [rawGroups, allowedModules, searchFilter]);

  const handleSelect = (modId: ErpModule) => {
    onSelectModule(modId);
    if (isMobileDrawerOpen) {
      setIsMobileDrawerOpen(false);
    }
  };

  const schoolLogo = schoolBrand.logoUrl || '/assets/schools/new-ideal-logo.svg';

  // Render Inner Navigation Content (Shared by Desktop Sidebar and Mobile Drawer)
  const renderSidebarContent = (isCollapsed: boolean, isMobileView: boolean) => (
    <div className="flex flex-col h-full select-none">
      {/* 1. Header: School Identity & Brand Crest */}
      <div className={`p-4 border-b border-slate-800/80 flex items-center justify-between gap-3 ${isCollapsed && !isMobileView ? 'px-2 flex-col justify-center' : ''}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white p-1 border border-slate-700 shadow-md flex items-center justify-center shrink-0 overflow-hidden group">
            <img
              src={schoolLogo}
              alt={schoolBrand.schoolName}
              className="w-full h-full object-contain transition-transform group-hover:scale-105"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if (!img.src.includes('new-ideal-logo.svg')) {
                  img.src = '/assets/schools/new-ideal-logo.svg';
                }
              }}
            />
          </div>
          {(!isCollapsed || isMobileView) && (
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-black text-white truncate tracking-tight" title={schoolBrand.schoolName}>
                {schoolBrand.schoolName}
              </h2>
              <p className="text-[11px] font-mono font-bold text-indigo-400 truncate flex items-center gap-1.5">
                <span>{schoolBrand.board.split(' ')[0]}</span>
                <span>•</span>
                <span>{(schoolBrand as any).city || schoolBrand.address?.split(',')[0] || 'Mathura'}</span>
              </p>
            </div>
          )}
        </div>

        {/* Toggle Button */}
        {isMobileView ? (
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(false)}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close navigation drawer"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              const next = !isDesktopCollapsed;
              setIsDesktopCollapsed(next);
              try {
                localStorage.setItem('dakshora_sidebar_collapsed', String(next));
              } catch {}
            }}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title={isDesktopCollapsed ? 'Expand Sidebar (Ctrl+\\)' : 'Collapse Sidebar'}
            aria-label={isDesktopCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isDesktopCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* 2. Quick Search & Filter (Expanded Only) */}
      {(!isCollapsed || isMobileView) && (
        <div className="p-3 border-b border-slate-800/60">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search modules..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Navigation Groups & Module Items (Scrollable) */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4 no-scrollbar">
        {visibleGroups.map((group) => {
          const isGroupCollapsed = Boolean(collapsedGroups[group.id]) && !isCollapsed;

          return (
            <div key={group.id} className="space-y-1">
              {/* Group Title (Expanded Only) */}
              {(!isCollapsed || isMobileView) ? (
                <button
                  type="button"
                  onClick={() => toggleGroupCollapse(group.id)}
                  className="w-full flex items-center justify-between px-2.5 py-1 text-[10px] uppercase tracking-wider font-mono font-bold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer group"
                >
                  <span>{group.title}</span>
                  <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${isGroupCollapsed ? '-rotate-90' : ''}`} />
                </button>
              ) : (
                <div className="w-full flex justify-center py-1">
                  <span className="w-6 h-[1px] bg-slate-800" />
                </div>
              )}

              {/* Items in Group */}
              {(!isGroupCollapsed || isCollapsed) && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = activeModule === item.id;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelect(item.id)}
                        title={isCollapsed && !isMobileView ? `${item.label} — ${item.description}` : undefined}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer text-left relative group ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-bold'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                        } ${isCollapsed && !isMobileView ? 'justify-center px-0 py-2.5' : ''}`}
                      >
                        {/* Active Left Indicator Bar */}
                        {isActive && !isCollapsed && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-cyan-400 rounded-r" />
                        )}

                        {/* Icon */}
                        <div className={`shrink-0 flex items-center justify-center ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>

                        {/* Label & Badges (Expanded View) */}
                        {(!isCollapsed || isMobileView) && (
                          <div className="flex-1 flex items-center justify-between gap-1.5 min-w-0">
                            <span className="truncate">{item.label}</span>

                            <div className="flex items-center gap-1 shrink-0">
                              {item.badge && (
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black ${
                                  isActive ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
                                }`}>
                                  {item.badge}
                                </span>
                              )}
                              {item.count !== undefined && item.count > 0 && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                  isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
                                }`}>
                                  {item.count}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Floating Tooltip (Desktop Collapsed View) */}
                        {isCollapsed && !isMobileView && (
                          <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-950 text-white text-xs font-mono rounded-xl shadow-2xl border border-slate-800 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 flex items-center gap-2">
                            <span>{item.label}</span>
                            {item.count !== undefined && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 font-bold">
                                {item.count}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* 4. Footer: User Profile, Active Session & Quick Actions */}
      <div className={`p-3 border-t border-slate-800/80 bg-slate-950/60 flex flex-col gap-2 ${isCollapsed && !isMobileView ? 'items-center px-1' : ''}`}>
        {/* User Card */}
        <div className={`flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800 ${isCollapsed && !isMobileView ? 'justify-center p-1.5' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
            {(currentUser?.name || 'Admin').charAt(0).toUpperCase()}
          </div>

          {(!isCollapsed || isMobileView) && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate leading-none">
                {currentUser?.name || 'School Administrator'}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {activeRole}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {activeSession}
                </span>
              </div>
            </div>
          )}

          {/* Quick Branding Trigger */}
          {onShowBrandingModal && (!isCollapsed || isMobileView) && (
            <button
              type="button"
              onClick={onShowBrandingModal}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
              title="Customize School Branding"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Surface Nav Links */}
        {(!isCollapsed || isMobileView) && onNavigateSurface && (
          <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => onNavigateSurface('school_app')}
              className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 border border-slate-800 text-center font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <Building2 className="w-3 h-3" />
              <span>School App</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateSurface('parent_portal')}
              className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-purple-300 hover:text-purple-200 border border-slate-800 text-center font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Ward Portal</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. DESKTOP PERSISTENT SIDEBAR (Visible on lg and above)
         ───────────────────────────────────────────────────────────── */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-slate-950 text-slate-200 border-r border-slate-800/90 shadow-xl transition-all duration-300 ease-in-out relative z-20 ${
          isDesktopCollapsed ? 'w-20' : 'w-64'
        }`}
        style={{ height: 'calc(100vh - 65px)', position: 'sticky', top: '65px' }}
      >
        {renderSidebarContent(isDesktopCollapsed, false)}
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          2. MOBILE SLIDE-OVER DRAWER (Visible on mobile/tablet)
         ───────────────────────────────────────────────────────────── */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-200">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <div
            className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-slate-950 text-slate-200 shadow-2xl border-r border-slate-800 flex flex-col z-50 transform transition-transform duration-300 ease-in-out translate-x-0"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation drawer"
          >
            {renderSidebarContent(false, true)}
          </div>
        </div>
      )}
    </>
  );
};
