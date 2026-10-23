import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  BookOpen,
  Award,
  Clock,
  Bell,
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Phone,
  GraduationCap,
  Users,
  CheckCircle2,
  AlertCircle,
  LogOut,
  FileText,
  BarChart3,
  UserCheck,
  ClipboardList,
  User,
  Shield,
  Layers,
  Search,
  BookMarked
} from 'lucide-react';
import { useTranslation } from '../i18n';

export type TeacherPortalTab =
  | 'pulse'
  | 'attendance'
  | 'leaves'
  | 'reports'
  | 'unmarked'
  | 'timetable'
  | 'arrangements'
  | 'journal'
  | 'ai_copilot'
  | 'homework'
  | 'exams'
  | 'profile';

export interface TeacherNavModule {
  id: TeacherPortalTab;
  label: string;
  hindiLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string | number | null;
  badgeColor?: string;
  gradient: string;
}

export interface TeacherNavGroup {
  id: string;
  title: string;
  hindiTitle?: string;
  items: TeacherNavModule[];
}

interface TeacherPortalSidebarProps {
  activeTab: TeacherPortalTab;
  onSelectTab: (tab: TeacherPortalTab) => void;
  teacherName?: string;
  empId?: string;
  designation?: string;
  assignedClass?: string;
  schoolName?: string;
  schoolLogo?: string;
  onOpenProfile: () => void;
  onSignOut?: () => void;
  isDesktopCollapsed: boolean;
  setIsDesktopCollapsed: (collapsed: boolean) => void;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean) => void;
  pendingAttendanceCount?: number;
  arrangementCount?: number;
  pendingLeavesCount?: number;
}

export const TeacherPortalSidebar: React.FC<TeacherPortalSidebarProps> = ({
  activeTab,
  onSelectTab,
  teacherName = 'Vikramaditya Singh',
  empId = 'DKS-FAC-03',
  designation = 'PGT Mathematics',
  assignedClass = 'Class 10-A',
  schoolName = 'Delhi Public Academy, New Delhi',
  schoolLogo = '/assets/schools/new-ideal-logo.svg',
  onOpenProfile,
  onSignOut,
  isDesktopCollapsed,
  setIsDesktopCollapsed,
  isMobileDrawerOpen,
  setIsMobileDrawerOpen,
  pendingAttendanceCount = 17,
  arrangementCount = 1,
  pendingLeavesCount = 0
}) => {
  const { t, isHindi, isBilingual } = useTranslation();

  // Search filter inside sidebar
  const [filterText, setFilterText] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileDrawerOpen) {
        setIsMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileDrawerOpen, setIsMobileDrawerOpen]);

  // Lock body scroll on mobile drawer open
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

  const navGroups: TeacherNavGroup[] = [
    {
      id: 'overview',
      title: 'COMMAND CENTRE',
      hindiTitle: 'कमांड सेंटर',
      items: [
        {
          id: 'pulse',
          label: 'Daily Pulse & Faculty Workplace',
          hindiLabel: 'दैनिक पल्स व कार्यस्थल',
          icon: Layers,
          description: 'Assigned class, today periods & live radar',
          gradient: 'from-purple-500 to-indigo-600'
        }
      ]
    },
    {
      id: 'classroom_attendance',
      title: 'ATTENDANCE & ROSTER',
      hindiTitle: 'उपस्थिति व कक्षा रजिस्टर',
      items: [
        {
          id: 'attendance',
          label: 'Fast Roll-Call Register',
          hindiLabel: 'कक्षा उपस्थिति रजिस्टर',
          icon: UserCheck,
          description: `Assigned: ${assignedClass} & all classes`,
          badge: 'Active',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          gradient: 'from-emerald-500 to-teal-600'
        },
        {
          id: 'leaves',
          label: 'Student Leave Approvals',
          hindiLabel: 'छात्र अवकाश प्रार्थना पत्र',
          icon: Calendar,
          description: 'Review & approve Class 10-A student leaves',
          badge: pendingLeavesCount > 0 ? `${pendingLeavesCount} Pending` : null,
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          gradient: 'from-pink-500 to-rose-600'
        },
        {
          id: 'reports',
          label: 'Attendance Reports Desk',
          hindiLabel: 'उपस्थिति रिपोर्ट्स व विश्लेषण',
          icon: BarChart3,
          description: 'Daily classes, students & monthly records',
          gradient: 'from-cyan-500 to-blue-600'
        },
        {
          id: 'unmarked',
          label: 'Unmarked Students Radar',
          hindiLabel: 'लंबित उपस्थिति अलर्ट',
          icon: AlertCircle,
          description: 'Immediate 1-tap class marks',
          badge: pendingAttendanceCount > 0 ? `${pendingAttendanceCount} Pending` : null,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          gradient: 'from-amber-500 to-orange-600'
        }
      ]
    },
    {
      id: 'routine_arrangements',
      title: 'ROUTINE & TIMETABLE',
      hindiTitle: 'समय सारणी व व्यवस्था',
      items: [
        {
          id: 'timetable',
          label: "Today's Periods & Routine",
          hindiLabel: 'आज के पीरियड्स व समय सारणी',
          icon: Clock,
          description: 'Room indicators & live period bells',
          gradient: 'from-blue-500 to-cyan-600'
        },
        {
          id: 'arrangements',
          label: 'Arrangement Period Duty',
          hindiLabel: 'सब्स्टीट्यूशन पीरियड ड्यूटी',
          icon: Bell,
          description: 'Emergency proxy substitution alerts',
          badge: arrangementCount > 0 ? `${arrangementCount} New Duty` : null,
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          gradient: 'from-rose-500 to-pink-600'
        }
      ]
    },
    {
      id: 'teaching_pedagogy',
      title: 'PEDAGOGY & LESSON PLANS',
      hindiTitle: 'शिक्षण व पाठ योजना',
      items: [
        {
          id: 'journal',
          label: 'Teaching Journal & Planner',
          hindiLabel: 'टीचिंग जर्नल व पाठ योजना',
          icon: BookOpen,
          description: 'Chapter coverage, homework & daily log',
          gradient: 'from-indigo-500 to-purple-600'
        },
        {
          id: 'ai_copilot',
          label: 'AI Teacher Co-Pilot',
          hindiLabel: 'एआई शिक्षक सहायक (24/7)',
          icon: Bot,
          description: 'NCERT syllabus lesson & quiz builder',
          badge: 'AI 2.0',
          badgeColor: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
          gradient: 'from-fuchsia-500 to-pink-600'
        },
        {
          id: 'homework',
          label: 'Homework & Diary Desk',
          hindiLabel: 'गृहकार्य व असाइनमेंट डायरी',
          icon: ClipboardList,
          description: 'Dispatch daily home assignments',
          gradient: 'from-amber-500 to-orange-600'
        },
        {
          id: 'exams',
          label: 'CBSE Marks & Assessments',
          hindiLabel: 'परीक्षा अंक प्रविष्टि',
          icon: Award,
          description: 'Terminal marks & gradebook registers',
          gradient: 'from-emerald-500 to-cyan-600'
        }
      ]
    },
    {
      id: 'faculty_identity',
      title: 'FACULTY PROFILE',
      hindiTitle: 'शिक्षक विवरण',
      items: [
        {
          id: 'profile',
          label: 'Employee Details & Profile',
          hindiLabel: 'कर्मचारी विवरण व सर्विस रिकॉर्ड',
          icon: User,
          description: 'Service book, pay scale & identity card',
          gradient: 'from-slate-500 to-slate-700'
        }
      ]
    }
  ];

  const getItemLabel = (item: TeacherNavModule) => {
    if (isHindi && item.hindiLabel) return item.hindiLabel;
    if (isBilingual && item.hindiLabel) return `${item.label} (${item.hindiLabel})`;
    return item.label;
  };

  const getGroupTitle = (group: TeacherNavGroup) => {
    if (isHindi && group.hindiTitle) return group.hindiTitle;
    if (isBilingual && group.hindiTitle) return `${group.title} / ${group.hindiTitle}`;
    return group.title;
  };

  const renderNavList = (isMobile: boolean = false) => {
    return (
      <div className="space-y-4 font-mono">
        {navGroups.map((group) => {
          const isCollapsed = !isMobile && isDesktopCollapsed ? false : collapsedGroups[group.id];
          const visibleItems = group.items.filter(item => {
            if (!filterText.trim()) return true;
            const q = filterText.toLowerCase();
            return (
              item.label.toLowerCase().includes(q) ||
              (item.hindiLabel && item.hindiLabel.toLowerCase().includes(q)) ||
              item.description.toLowerCase().includes(q)
            );
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.id} className="space-y-1">
              {/* Group Header (Hidden on collapsed desktop) */}
              {(!isDesktopCollapsed || isMobile) && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors cursor-pointer select-none"
                >
                  <span className="truncate">{getGroupTitle(group)}</span>
                  <ChevronDown
                    className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${
                      isCollapsed ? '-rotate-90' : ''
                    }`}
                  />
                </button>
              )}

              {/* Group Items */}
              {!isCollapsed && (
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const IconComp = item.icon;

                    if (!isMobile && isDesktopCollapsed) {
                      // Tooltip Icon in collapsed state
                      return (
                        <div key={item.id} className="relative group/tooltip flex justify-center py-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (item.id === 'profile') {
                                onOpenProfile();
                              } else {
                                onSelectTab(item.id);
                              }
                            }}
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                              isActive
                                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25 ring-2 ring-purple-400/50'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                            }`}
                            aria-label={getItemLabel(item)}
                          >
                            <IconComp className="w-5 h-5" />
                            {item.badge && (
                              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-slate-950 animate-pulse" />
                            )}
                          </button>

                          {/* Hover Tooltip Popup */}
                          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200">
                            <div className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-2xl text-xs whitespace-nowrap text-white font-sans flex items-center gap-2">
                              <span>{getItemLabel(item)}</span>
                              {item.badge && (
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${item.badgeColor || 'bg-purple-500/30 text-purple-200'}`}>
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Expanded List Button
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (item.id === 'profile') {
                            onOpenProfile();
                          } else {
                            onSelectTab(item.id);
                          }
                          if (isMobile) setIsMobileDrawerOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-left transition-all cursor-pointer group/btn ${
                          isActive
                            ? 'bg-gradient-to-r from-purple-950/80 via-indigo-900/60 to-slate-900 text-white border border-purple-500/40 shadow-md shadow-purple-500/10'
                            : 'text-slate-300 hover:text-white hover:bg-slate-850/60 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-2 rounded-xl shrink-0 transition-transform duration-200 group-hover/btn:scale-105 ${
                              isActive
                                ? 'bg-gradient-to-tr ' + item.gradient + ' text-white shadow-md'
                                : 'bg-slate-800 text-slate-400 group-hover/btn:text-white group-hover/btn:bg-slate-700'
                            }`}
                          >
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate flex items-center gap-1.5">
                              <span>{getItemLabel(item)}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">
                              {item.description}
                            </div>
                          </div>
                        </div>

                        {item.badge && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold shrink-0 border ml-2 ${
                              item.badgeColor || 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* ===================================================================== */}
      {/* 1. DESKTOP PERSISTENT SIDEBAR */}
      {/* ===================================================================== */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-slate-950 border-r border-slate-800/80 transition-all duration-300 relative z-30 select-none ${
          isDesktopCollapsed ? 'w-20' : 'w-72'
        }`}
        style={{ minHeight: '100vh' }}
        aria-label="Teacher Workspace Navigation"
      >
        {/* Top Header & Collapse Toggle */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between gap-2">
          {!isDesktopCollapsed ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-white p-1 border border-indigo-400/40 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
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
                <span className="text-[10px] font-mono font-extrabold uppercase text-purple-400 tracking-wider block truncate">
                  TEACHER WORKSPACE
                </span>
                <h3 className="text-sm font-black text-white truncate tracking-tight">
                  {schoolName}
                </h3>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <div className="w-10 h-10 rounded-2xl bg-white p-1 border border-indigo-400/40 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
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
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer"
            title={isDesktopCollapsed ? 'Expand Sidebar (Ctrl+\\)' : 'Collapse Sidebar (Ctrl+\\)'}
            aria-label="Toggle Sidebar"
          >
            {isDesktopCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-purple-400" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Search Input (Hidden when collapsed) */}
        {!isDesktopCollapsed && (
          <div className="px-4 pt-3 pb-1">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={isHindi ? 'मॉड्यूल खोजें...' : 'Filter modules...'}
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
              />
              {filterText && (
                <button
                  type="button"
                  onClick={() => setFilterText('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Faculty Active Pill Banner (Screenshot 1 alignment) */}
        {!isDesktopCollapsed && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-gradient-to-r from-purple-950/70 via-indigo-950/60 to-slate-900 border border-purple-500/30 text-xs font-mono">
            <div className="flex items-center justify-between text-[10px] text-purple-300 font-bold uppercase">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Faculty Active</span>
              </span>
              <span className="text-cyan-300 font-black">2026–27</span>
            </div>
            <div className="text-white font-black text-sm mt-1 truncate">
              {assignedClass}
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">
              Class Teacher & Attendance Desk
            </div>
          </div>
        )}

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto px-3 py-3 custom-scrollbar">
          {renderNavList(false)}
        </div>

        {/* Bottom Profile & Sign Out Strip */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/90">
          {!isDesktopCollapsed ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={onOpenProfile}
                className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all text-left cursor-pointer group"
                title="Click to view full Employee Profile"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-extrabold flex items-center justify-center shrink-0 shadow-md ring-2 ring-purple-400/40">
                  {teacherName ? teacherName.charAt(0) : 'T'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black text-white group-hover:text-purple-300 transition-colors truncate">
                    {teacherName}
                  </div>
                  <div className="text-[10px] font-mono text-purple-400 truncate">
                    {designation}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 truncate">
                    Emp ID: #{empId}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onSignOut) {
                    onSignOut();
                  } else {
                    localStorage.removeItem('dakshora_auth_token');
                    localStorage.removeItem('dakshora_superadmin_user');
                    localStorage.removeItem('dakshora_active_surface');
                    window.location.href = '/';
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/20 text-xs font-mono font-bold transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isHindi ? 'लॉगआउट करें' : 'Sign Out'}</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={onOpenProfile}
                className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-extrabold flex items-center justify-center shadow-md ring-2 ring-purple-400/40 hover:scale-105 transition-all cursor-pointer"
                title={`${teacherName} (${designation}) - Click for details`}
              >
                {teacherName ? teacherName.charAt(0) : 'T'}
              </button>
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
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-all cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ===================================================================== */}
      {/* 2. MOBILE SLIDE-OVER DRAWER & BACKDROP */}
      {/* ===================================================================== */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Overlay */}
          <div
            onClick={() => setIsMobileDrawerOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-sm bg-slate-950 border-r border-slate-800 flex flex-col h-full shadow-2xl z-10 animate-in slide-in-from-left duration-300 font-sans">
            {/* Drawer Top */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-white p-1 border border-indigo-400/40 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
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
                  <span className="text-[10px] font-mono font-extrabold uppercase text-purple-400 tracking-wider block">
                    TEACHER PORTAL
                  </span>
                  <h3 className="text-sm font-black text-white truncate">
                    {schoolName}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                aria-label="Close Navigation Drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Profile Summary in Mobile Drawer */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-900/50">
              <button
                type="button"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  onOpenProfile();
                }}
                className="w-full flex items-center gap-3 text-left cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-lg ring-2 ring-purple-400">
                  {teacherName ? teacherName.charAt(0) : 'T'}
                </div>
                <div className="min-w-0 flex-1 font-mono">
                  <div className="text-sm font-black text-white group-hover:text-purple-300 transition-colors truncate">
                    {teacherName}
                  </div>
                  <div className="text-xs text-purple-300 font-bold truncate">
                    {designation}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    Emp ID: #{empId} • Class: {assignedClass}
                  </div>
                </div>
                <span className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold">
                  Profile →
                </span>
              </button>
            </div>

            {/* Scrollable Nav List */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {renderNavList(true)}
            </div>

            {/* Bottom Logout */}
            <div className="p-4 border-t border-slate-800 bg-slate-950">
              <button
                type="button"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  if (onSignOut) {
                    onSignOut();
                  } else {
                    localStorage.removeItem('dakshora_auth_token');
                    window.location.href = '/';
                  }
                }}
                className="w-full py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{isHindi ? 'लॉगआउट करें' : 'Sign Out / लॉगआउट'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TeacherPortalSidebar;
