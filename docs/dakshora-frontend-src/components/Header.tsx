import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Activity,
  Building2,
  Globe,
  Target,
  Bot,
  ShieldCheck,
  Settings,
  RefreshCw,
  BarChart3,
  CreditCard,
  ShieldAlert,
  Check,
  GraduationCap,
  Menu,
  X,
  MessageSquare,
  Mail,
  Compass,
  Layers,
  HelpCircle,
  Info
} from 'lucide-react';
import { HealthState, ClientSurface } from '../types';
import { getBackendBaseUrl, setBackendBaseUrl, fetchActiveSupportSession, endSupportSession } from '../services/api';
import { LanguageSelector, useTranslation } from '../i18n';

export type AdminTabType =
  | 'dashboard'
  | 'organizations'
  | 'websites'
  | 'leads'
  | 'analytics'
  | 'billing'
  | 'audit_logs'
  | 'ai'
  | 'superadmin';

interface HeaderProps {
  surface: ClientSurface;
  setSurface: (surface: ClientSurface) => void;
  adminTab: AdminTabType;
  setAdminTab: (tab: AdminTabType) => void;
  health: HealthState;
  onRefreshHealth: () => void;
  isRefreshing: boolean;
  onShowToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
  isAuthenticated?: boolean;
  currentUser?: any;
  onOpenLogin?: () => void;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  surface,
  setSurface,
  adminTab,
  setAdminTab,
  health,
  onRefreshHealth,
  isRefreshing,
  onShowToast,
  isAuthenticated = false,
  currentUser = null,
  onOpenLogin,
  onSignOut,
}) => {
  const { t } = useTranslation();
  const [showSettings, setShowSettings] = useState(false);
  const [tempUrl, setTempUrl] = useState(getBackendBaseUrl());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isPublicMode = surface === 'public_website' || !isAuthenticated;

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUrl.trim()) return;
    setBackendBaseUrl(tempUrl);
    setShowSettings(false);
    onShowToast('success', 'Fastify Gateway URL Saved', tempUrl);
    onRefreshHealth();
  };

  const isBackendOnline = health.backend.status === 'online';

  const adminNavItems: {
    id: AdminTabType;
    label: string;
    icon: any;
    tag: string;
    activeGradient: string;
    activeShadow: string;
    iconColor: string;
    badgeColor: string;
  }[] = [
    {
      id: 'superadmin',
      label: 'SuperAdmin Hub',
      icon: ShieldCheck,
      tag: 'Ops',
      activeGradient: 'from-amber-600 via-orange-600 to-amber-700',
      activeShadow: 'shadow-amber-500/25',
      iconColor: 'text-amber-600',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    },
    {
      id: 'organizations',
      label: 'Organizations',
      icon: Building2,
      tag: 'Multi-Tenant',
      activeGradient: 'from-purple-600 via-fuchsia-600 to-pink-500',
      activeShadow: 'shadow-purple-500/25',
      iconColor: 'text-purple-500',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    {
      id: 'websites',
      label: 'CMS & Sites',
      icon: Globe,
      tag: '9 Layers',
      activeGradient: 'from-emerald-600 via-teal-600 to-cyan-600',
      activeShadow: 'shadow-emerald-500/25',
      iconColor: 'text-emerald-500',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      id: 'leads',
      label: 'Leads CRM',
      icon: Target,
      tag: 'Leads',
      activeGradient: 'from-amber-500 via-orange-500 to-rose-500',
      activeShadow: 'shadow-amber-500/25',
      iconColor: 'text-amber-500',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      tag: 'Metrics',
      activeGradient: 'from-sky-600 via-blue-600 to-indigo-600',
      activeShadow: 'shadow-sky-500/25',
      iconColor: 'text-sky-500',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
    },
    {
      id: 'billing',
      label: 'Billing & MRR',
      icon: CreditCard,
      tag: 'MRR',
      activeGradient: 'from-rose-600 via-pink-600 to-purple-600',
      activeShadow: 'shadow-rose-500/25',
      iconColor: 'text-rose-500',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    },
    {
      id: 'audit_logs',
      label: 'Audit Logs',
      icon: ShieldAlert,
      tag: 'Security',
      activeGradient: 'from-slate-700 via-zinc-800 to-slate-900',
      activeShadow: 'shadow-slate-800/25',
      iconColor: 'text-slate-600',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 'ai',
      label: 'DAKSHORA AI',
      icon: Bot,
      tag: 'Co-Pilot',
      activeGradient: 'from-violet-600 via-purple-600 to-fuchsia-600',
      activeShadow: 'shadow-violet-500/25',
      iconColor: 'text-violet-500',
      badgeColor: 'bg-violet-100 text-violet-800 border-violet-200',
    },
  ];

  const [activeSupportSession, setActiveSupportSession] = useState<any>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchActiveSupportSession()
        .then((res) => {
          if (res.data?.success && res.data?.hasActiveSession) {
            setActiveSupportSession(res.data.activeSession);
          } else {
            setActiveSupportSession(null);
          }
        })
        .catch(() => {});
    }
  }, [surface, adminTab, isAuthenticated]);

  return (
    <>
      {/* Support Mode Notification Banner for Authenticated Sessions */}
      {activeSupportSession && isAuthenticated && (
        <div className="bg-amber-500 text-slate-950 font-bold px-4 py-2 text-xs flex items-center justify-between border-b border-amber-600 shadow-md">
          <div className="flex items-center gap-2">
            <span className="bg-slate-950 text-amber-300 px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider">
              SUPPORT MODE
            </span>
            <span>
              Support Access Active — Organization: <strong className="underline">{activeSupportSession.target_school_name}</strong>
            </span>
            <span className="hidden md:inline font-mono font-normal text-slate-900 text-[11px]">
              ({activeSupportSession.reason})
            </span>
          </div>
          <button
            onClick={async () => {
              await endSupportSession();
              setActiveSupportSession(null);
              onShowToast('info', 'Support Mode Exited', 'Platform restored to standard operational context.');
            }}
            className="px-3 py-1 bg-slate-950 text-amber-300 hover:text-white rounded-lg text-[11px] font-mono flex items-center gap-1 shadow transition-all cursor-pointer"
          >
            Exit Support Session
          </button>
        </div>
      )}

      {/* Main Sticky Header */}
      <header
        className={`sticky top-0 z-40 w-full transition-all backdrop-blur-xl ${
          isPublicMode
            ? 'bg-[#090D1A]/95 border-b border-slate-800/80 text-white shadow-xl'
            : 'bg-white/95 border-b border-slate-200/90 text-slate-900 shadow-xs'
        }`}
      >
        {/* Tier 1: Authenticated User Identity & Surface Switcher (Visible ONLY when logged in) */}
        {isAuthenticated && (
          <div className="bg-slate-50/95 border-b border-slate-200/80 px-4 py-1.5 text-slate-900">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-slate-800 font-bold">
                  {currentUser?.name || 'Staff User'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 text-[10px] uppercase font-bold">
                  {currentUser?.role || 'Admin'}
                </span>
              </div>

              <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
                <button
                  onClick={() => setSurface('public_website')}
                  className={`px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 font-bold cursor-pointer ${
                    surface === 'public_website'
                      ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Public Website</span>
                </button>

                {currentUser?.role !== 'parent' && currentUser?.role !== 'student' && (
                  <button
                    onClick={() => setSurface('school_erp')}
                    className={`px-3.5 py-1 rounded-xl transition-all flex items-center gap-1.5 font-extrabold cursor-pointer ${
                      surface === 'school_erp'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                        : 'text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>School ERP</span>
                  </button>
                )}

                {currentUser?.role !== 'parent' && currentUser?.role !== 'student' && (
                  <button
                    onClick={() => setSurface('school_app')}
                    className={`px-3.5 py-1 rounded-xl transition-all flex items-center gap-1.5 font-extrabold cursor-pointer ${
                      surface === 'school_app'
                        ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
                        : 'text-cyan-700 hover:text-cyan-900 hover:bg-cyan-50'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>School App</span>
                  </button>
                )}

                {(currentUser?.role === 'admin' || currentUser?.role === 'school-admin' || currentUser?.role === 'superadmin') && (
                  <button
                    onClick={() => setSurface('school_onboarding')}
                    className={`px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 font-bold cursor-pointer ${
                      surface === 'school_onboarding'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-sm'
                        : 'text-purple-700 hover:text-purple-900 hover:bg-purple-50'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Setup Wizard</span>
                  </button>
                )}

                {currentUser?.role === 'superadmin' && (
                  <button
                    onClick={() => {
                      setSurface('admin_panel');
                      setAdminTab('superadmin');
                    }}
                    className={`px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 font-bold cursor-pointer ${
                      surface === 'admin_panel'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                        : 'text-amber-700 hover:text-amber-900 hover:bg-amber-50'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>SuperAdmin Panel</span>
                  </button>
                )}

                <button
                  onClick={() => setSurface('parent_portal')}
                  className={`px-3.5 py-1 rounded-xl transition-all flex items-center gap-1.5 font-extrabold cursor-pointer ${
                    surface === 'parent_portal'
                      ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-sm'
                      : 'text-fuchsia-700 hover:text-fuchsia-900 hover:bg-fuchsia-50'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ward Portal</span>
                </button>

                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-mono font-bold transition-all ml-1 cursor-pointer"
                  >
                    {t('action.logout', 'Sign Out')}
                  </button>
                )}

                <div className="ml-1 border-l border-slate-200 pl-1">
                  <LanguageSelector variant="compact" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tier 2: Unified Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18 gap-4">
            {/* Brand Logo & Title */}
            <div
              className="flex items-center gap-3 cursor-pointer shrink-0"
              onClick={() => {
                if (isPublicMode) {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  setAdminTab('superadmin');
                }
              }}
            >
              <div className="flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 p-1.5">
                <img
                  src="/logo.svg"
                  alt="DAKSHORA"
                  className="h-full w-auto object-contain drop-shadow-sm hover:scale-105 transition-transform"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/logo.jpg';
                  }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-black text-xl sm:text-2xl tracking-wider font-['Plus_Jakarta_Sans',sans-serif] ${
                      isPublicMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    DAKSHORA
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 text-white shadow-sm">
                    2.0
                  </span>
                </div>
                <p className={`text-[10px] font-medium hidden sm:block ${isPublicMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isPublicMode
                    ? 'Cloud ERP & Enterprise AI Platform'
                    : surface === 'school_erp'
                    ? 'Enterprise School ERP • 5 Roles • 16 Modules'
                    : surface === 'school_app'
                    ? 'Dakshora School App • White-Label • Role-Based'
                    : surface === 'parent_portal'
                    ? 'Ward Self-Service Portal'
                    : (currentUser?.role === 'superadmin' || surface === 'admin_panel')
                    ? 'SuperAdmin Operations Hub'
                    : 'Institutional Management Workspace'}
                </p>
              </div>
            </div>

            {/* Desktop Navigation Links for Public Website */}
            {isPublicMode ? (
              <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
                <a
                  href="#features"
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 py-1"
                >
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ERP Modules</span>
                </a>
                <a
                  href="#solutions"
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 py-1"
                >
                  <Compass className="w-3.5 h-3.5 text-purple-400" />
                  <span>Solutions</span>
                </a>
                <a
                  href="#pricing"
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 py-1"
                >
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pricing</span>
                </a>
                <a
                  href="#faq"
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 py-1"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>FAQ</span>
                </a>
                <a
                  href="#about-us"
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 py-1"
                >
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                  <span>About Us</span>
                </a>
              </nav>
            ) : (
              /* Desktop Navigation for Authenticated SuperAdmin */
              surface === 'admin_panel' && (
                <nav className="hidden xl:flex items-center gap-1 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/90 shadow-xs">
                  {adminNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = adminTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setAdminTab(item.id as AdminTabType)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? `bg-gradient-to-r ${item.activeGradient} text-white shadow-md ${item.activeShadow} scale-[1.02]`
                            : 'text-slate-700 hover:text-slate-950 hover:bg-white/80'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : item.iconColor}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              )
            )}

            {/* Right Action Cluster */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Ask DakshOra AI Button */}
              {isPublicMode ? (
                <a
                  href="#ai"
                  className="px-3.5 py-2 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:brightness-110 text-white font-bold text-xs shadow-md shadow-purple-500/25 transition-all flex items-center gap-1.5 hover:scale-[1.02]"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-300" />
                  <span className="hidden sm:inline">Ask DakshOra AI</span>
                  <span className="sm:hidden">AI</span>
                </a>
              ) : (
                <button
                  onClick={() => {
                    setSurface('school_erp');
                    onShowToast('info', 'DAKSHORA AI Co-Pilot Active 🤖', 'Ask questions, generate CBSE lesson plans, or inspect student telemetry.');
                  }}
                  className="px-3.5 py-2 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 hover:brightness-110 text-white font-bold text-xs shadow-md shadow-purple-500/25 transition-all flex items-center gap-1.5 hover:scale-[1.02] cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>Ask DakshOra AI</span>
                </button>
              )}

              {/* Language Selector Dropdown */}
              <LanguageSelector variant={isPublicMode ? 'header' : 'compact'} />

              {/* Public Website CTAs: WhatsApp + ONE SINGLE Portal Login */}
              {isPublicMode ? (
                <>
                  {/* WhatsApp Direct CTA */}
                  <a
                    href="https://wa.me/918796347851?text=Hello%20DAKSHORA%2C%20I%20would%20like%20to%20know%20more%20about%20your%20solutions."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 sm:px-3 sm:py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 hover:text-emerald-300 font-mono text-xs font-bold transition-all flex items-center gap-1.5"
                    title="Chat on WhatsApp (+91 87963 47851)"
                    aria-label="Chat on WhatsApp at 8796347851"
                  >
                    <span className="text-sm">💬</span>
                    <span className="hidden md:inline">+91 87963 47851</span>
                  </a>

                  {/* ONE SINGLE PORTAL LOGIN BUTTON */}
                  <button
                    onClick={onOpenLogin}
                    className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:brightness-110 text-white font-bold text-xs font-mono shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 hover:scale-[1.02] cursor-pointer"
                    aria-label="Login to DAKSHORA Portal"
                  >
                    <ShieldCheck className="w-4 h-4 text-cyan-200" />
                    <span>{t('auth.login_title', 'Login to Portal')}</span>
                  </button>

                  {/* Mobile Hamburger Menu Toggle */}
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    aria-label="Toggle Navigation Menu"
                  >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                </>
              ) : (
                /* Authenticated View Gateway Status & Health Controls */
                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                      isBackendOnline
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isBackendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span className="hidden sm:inline">{isBackendOnline ? 'Fastify Gateway' : 'Offline'}</span>
                  </div>

                  <button
                    onClick={onRefreshHealth}
                    disabled={isRefreshing}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 transition-all cursor-pointer"
                    title="Ping Server"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-purple-600' : ''}`} />
                  </button>

                  {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && (
                    <button
                      onClick={() => setShowSettings(true)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-purple-600 transition-all cursor-pointer"
                      title="Configure Gateway URL"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SuperAdmin Panel Sub-Navigation on mobile/tablet */}
          {!isPublicMode && surface === 'admin_panel' && (
            <div className="flex xl:hidden overflow-x-auto py-2.5 gap-2 border-t border-slate-200/80 no-scrollbar">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = adminTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setAdminTab(item.id as AdminTabType)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                      isActive
                        ? `bg-gradient-to-r ${item.activeGradient} text-white shadow-md ${item.activeShadow}`
                        : 'text-slate-700 hover:text-slate-900 bg-white border border-slate-200/90 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : item.iconColor}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile Navigation Drawer for Public Website */}
        {isPublicMode && mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-[#080C16] px-4 py-5 space-y-4 animate-in slide-in-from-top-2">
            <nav className="flex flex-col space-y-2.5 text-xs font-mono">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-200 hover:text-cyan-400 flex items-center gap-2 border border-slate-800/80"
              >
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>ERP Modules</span>
              </a>
              <a
                href="#solutions"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-200 hover:text-purple-400 flex items-center gap-2 border border-slate-800/80"
              >
                <Compass className="w-4 h-4 text-purple-400" />
                <span>8 Industry Solutions</span>
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-200 hover:text-emerald-400 flex items-center gap-2 border border-slate-800/80"
              >
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Commercial Pricing</span>
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-200 hover:text-amber-400 flex items-center gap-2 border border-slate-800/80"
              >
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>Frequently Asked Questions</span>
              </a>
              <a
                href="#about-us"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-200 hover:text-indigo-400 flex items-center gap-2 border border-slate-800/80"
              >
                <Info className="w-4 h-4 text-indigo-400" />
                <span>About DAKSHORA</span>
              </a>
            </nav>

            <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
              {/* Language Selection Row for Mobile */}
              <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-xs font-mono text-slate-300 font-bold">🌐 भाषा / Language:</span>
                <LanguageSelector variant="compact" />
              </div>

              <a
                href="https://wa.me/918796347851?text=Hello%20DAKSHORA%2C%20I%20would%20like%20to%20know%20more%20about%20your%20solutions."
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold flex items-center justify-center gap-2"
              >
                <span>💬 WhatsApp +91 87963 47851</span>
              </a>

              <a
                href="mailto:dakshora.ai@gmail.com?subject=DAKSHORA%20Enquiry&body=Hello%20DAKSHORA%20Team%2C%0A%0AI%20would%20like%20to%20know%20more%20about%20your%20products%20and%20solutions.%0A%0ARegards"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4 text-cyan-400" />
                <span>dakshora.ai@gmail.com</span>
              </a>

              {/* Mobile Single Portal Login Button */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenLogin) onOpenLogin();
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:brightness-110 text-white font-bold text-xs font-mono flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-200" />
                <span>Login to Portal</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Gateway Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Settings className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Gateway Connection Settings</h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 mb-1.5">
                  Fastify Gateway API URL
                </label>
                <input
                  type="text"
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  placeholder="http://localhost:5000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl shadow-md shadow-purple-500/20 hover:brightness-105 transition-all flex items-center gap-1.5 font-bold cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save & Ping</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
