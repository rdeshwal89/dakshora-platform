import React, { useState, useEffect, useCallback } from 'react';
import { Header, AdminTabType } from './components/Header';
import { PublicWebsiteView } from './components/PublicWebsiteView';
import { SchoolSaaSShowcase } from './components/SchoolSaaSShowcase';
import { CustomerDashboardView } from './components/CustomerDashboardView';
import { SchoolErpHub } from './components/SchoolErpHub';
import { SchoolOnboardingWizard } from './components/SchoolOnboardingWizard';
import { DashboardStatus } from './components/DashboardStatus';
import { OrganizationsHub } from './components/OrganizationsHub';
import { CmsWebsitesHub } from './components/CmsWebsitesHub';
import { LeadsCrmHub } from './components/LeadsCrmHub';
import { AnalyticsHub } from './components/AnalyticsHub';
import { BillingHub } from './components/BillingHub';
import { AuditLogsHub } from './components/AuditLogsHub';
import { DakshoraAiHub } from './components/DakshoraAiHub';
import { SuperAdminHub } from './components/SuperAdminHub';
import { ParentStudentPortalHub } from './components/ParentStudentPortalHub';
import { DakshoraSchoolApp } from './components/DakshoraSchoolApp';
import { ToastContainer } from './components/Toast';
import { AuthModal } from './components/AuthModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import {
  HealthState,
  ApiLogEntry,
  ToastNotification,
  ClientSurface
} from './types';
import {
  checkBackendHealth,
  checkSupabaseConnection,
  getBackendBaseUrl
} from './services/api';

export function App() {
  // Authentication State & Session Persistence
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('dakshora_superadmin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('dakshora_auth_token'));
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isAuthenticated = Boolean(currentUser && authToken);

  const [surface, setSurface] = useState<ClientSurface>(() => {
    try {
      const saved = localStorage.getItem('dakshora_superadmin_user');
      const user = saved ? JSON.parse(saved) : null;
      const token = localStorage.getItem('dakshora_auth_token');
      const isAuth = Boolean(user && token);
      const userRole = (user?.role || '').toLowerCase();
      const isWardPersona = userRole === 'parent' || userRole === 'student';
      const isTeacherPersona = userRole === 'teacher' || ['teacher', 'faculty', 'lecturer'].includes(userRole);
      const isSchoolAdmin = userRole === 'school-admin' || userRole === 'admin' || userRole === 'principal' || userRole === 'school_admin';

      const path = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';
      if (path.startsWith('/portal')) {
        if (isAuth && (isSchoolAdmin || isTeacherPersona)) return 'school_erp';
        if (isAuth && (user?.role === 'superadmin' || userRole === 'superadmin')) return 'admin_panel';
        if (isAuth && isWardPersona) return 'parent_portal';
        return isAuth ? 'school_erp' : 'parent_portal';
      }
      if (path.startsWith('/admin')) {
        if (isAuth && user?.role === 'superadmin') return 'admin_panel';
        if (isAuth && isWardPersona) return 'parent_portal';
        if (isAuth) return 'school_erp';
      }
      if (path.startsWith('/erp') && isAuth) {
        if (isWardPersona) return 'parent_portal';
        return 'school_erp';
      }
      const savedSurface = localStorage.getItem('dakshora_active_surface');
      if (savedSurface && isAuth) {
        if (isWardPersona && (savedSurface === 'school_erp' || savedSurface === 'admin_panel' || savedSurface === 'school_onboarding')) {
          return 'parent_portal';
        }
        if (isTeacherPersona && (savedSurface === 'parent_portal' || savedSurface === 'admin_panel')) {
          return 'school_erp';
        }
        return savedSurface as ClientSurface;
      }
      if (isAuth && isWardPersona) {
        return 'parent_portal';
      }
      if (isAuth && (isSchoolAdmin || isTeacherPersona)) {
        return 'school_erp';
      }
      if (isAuth && (user?.role === 'superadmin' || userRole === 'superadmin')) {
        return 'admin_panel';
      }
    } catch {}
    return 'public_website';
  });

  const [adminTab, setAdminTab] = useState<AdminTabType>(() => {
    try {
      const savedTab = localStorage.getItem('dakshora_active_admin_tab');
      if (savedTab && ['superadmin', 'organizations', 'websites', 'leads', 'analytics', 'billing', 'audit_logs', 'ai'].includes(savedTab)) {
        return savedTab as AdminTabType;
      }
    } catch {}
    return 'superadmin';
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [apiLogs, setApiLogs] = useState<ApiLogEntry[]>([]);

  const handleSetSurface = (newSurface: ClientSurface, userOverride?: any) => {
    const effectiveUser = userOverride || currentUser;
    const effectiveToken = authToken || (typeof window !== 'undefined' ? localStorage.getItem('dakshora_auth_token') : null);
    const effectiveIsAuth = Boolean(effectiveUser && effectiveToken);

    if (newSurface !== 'public_website' && !effectiveIsAuth) {
      setShowAuthModal(true);
      return;
    }
    if (newSurface === 'admin_panel' && effectiveUser?.role !== 'superadmin') {
      showToast('error', 'Access Denied', 'Platform Control Center requires verified SuperAdmin credentials.');
      setShowAuthModal(true);
      return;
    }
    const roleLower = (effectiveUser?.role || '').toLowerCase();
    const isWard = roleLower === 'parent' || roleLower === 'student';
    const isTeacher = roleLower === 'teacher' || ['teacher', 'faculty', 'lecturer'].includes(roleLower);

    // Strict isolation: Parent & Student accounts are locked exclusively to the Ward Portal
    if (isWard && (newSurface === 'school_erp' || newSurface === 'admin_panel' || newSurface === 'school_onboarding')) {
      showToast('info', 'Ward Portal Active', 'Access is dedicated to the Parent & Student Self-Service Ward Portal.');
      setSurface('parent_portal');
      try {
        localStorage.setItem('dakshora_active_surface', 'parent_portal');
      } catch {}
      return;
    }
    // Teacher Persona is locked to School ERP (which directly loads TeacherPortalHub)
    if (isTeacher && (newSurface === 'parent_portal' || newSurface === 'admin_panel')) {
      showToast('info', 'Teacher Portal Active', 'Opening Faculty Command Centre & Daily Pulse.');
      setSurface('school_erp');
      try {
        localStorage.setItem('dakshora_active_surface', 'school_erp');
      } catch {}
      return;
    }
    setSurface(newSurface);
    try {
      localStorage.setItem('dakshora_active_surface', newSurface);
    } catch {}
  };

  const handleSetAdminTab = (newTab: AdminTabType) => {
    setAdminTab(newTab);
    try {
      localStorage.setItem('dakshora_active_admin_tab', newTab);
    } catch {}
  };

  const handleLoginSuccess = (user: any, token: string, targetSurface?: ClientSurface) => {
    setCurrentUser(user);
    setAuthToken(token);
    setShowAuthModal(false);

    // Dynamic brand storage on successful authentication
    if (user?.school || user?.schoolName) {
      const s = user.school || {};
      const brand = {
        schoolName: s.name || s.schoolName || user.schoolName,
        shortName: s.shortName || (user.schoolName ? user.schoolName.split(' ')[0] : 'School'),
        board: s.board || user.board || 'CBSE (Central Board of Secondary Education)',
        affiliationNo: s.affiliationNo || s.affiliation_no || user.affiliationNo || '',
        schoolCode: s.code || s.schoolCode || s.school_code || user.schoolCode || '',
        motto: s.motto || 'Excellence in Education',
        themeColor: s.themeColor || 'indigo',
        principalName: s.principalName || user.name || 'Principal',
        contactEmail: s.contactEmail || user.email || '',
        contactPhone: s.contactPhone || user.phone || '',
        address: s.address || user.address || ''
      };
      try {
        localStorage.setItem('dakshora_school_brand', JSON.stringify(brand));
      } catch {}
    }

    const roleLower = (user?.role || '').toLowerCase();
    const isTeacher = roleLower === 'teacher' || ['teacher', 'faculty', 'lecturer'].includes(roleLower);

    if (roleLower === 'parent' || roleLower === 'student') {
      handleSetSurface('parent_portal', user);
    } else if (isTeacher) {
      handleSetSurface('school_erp', user);
    } else if (targetSurface) {
      handleSetSurface(targetSurface, user);
    } else if (user.role === 'superadmin') {
      handleSetSurface('admin_panel', user);
      handleSetAdminTab('superadmin');
    } else {
      handleSetSurface('school_erp', user);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('dakshora_auth_token');
    localStorage.removeItem('dakshora_superadmin_user');
    localStorage.removeItem('dakshora_school_brand');
    localStorage.removeItem('dakshora_active_surface');
    localStorage.removeItem('dakshora_active_admin_tab');
    setCurrentUser(null);
    setAuthToken(null);
    setSurface('public_website');
    setAdminTab('superadmin');
    showToast('info', 'Signed Out', 'You have been safely signed out.');
  };

  const [health, setHealth] = useState<HealthState>({
    backend: {
      status: 'checking',
      message: 'Connecting to Fastify Gateway...',
      latencyMs: null,
      lastChecked: null,
    },
    supabase: {
      status: 'checking',
      message: 'Checking Supabase integration...',
      lastChecked: null,
    },
  });

  const showToast = useCallback(
    (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const recordLog = useCallback((log: ApiLogEntry) => {
    setApiLogs((prev) => [log, ...prev.slice(0, 49)]);
  }, []);

  const checkHealth = useCallback(async (isSilent = false) => {
    setIsRefreshing(true);
    const now = new Date().toLocaleTimeString();

    try {
      const backendRes = await checkBackendHealth();
      const backendOnline = backendRes.status === 200 && (Boolean(backendRes.data.success) || (backendRes.data as any)?.status === 'healthy');

      let supabaseConnected = false;
      let supabaseMsg = 'Not checked';
      let supabaseError = '';

      if (backendOnline) {
        const supaRes = await checkSupabaseConnection();
        supabaseConnected = supaRes.status === 200 && supaRes.data.success;
        supabaseMsg = typeof supaRes.data?.message === 'string'
          ? supaRes.data.message
          : typeof supaRes.data?.message === 'object' && supaRes.data?.message !== null
          ? ((supaRes.data.message as any).message || JSON.stringify(supaRes.data.message))
          : (supabaseConnected ? 'Connected' : 'Connection Failed');
        supabaseError = typeof supaRes.data?.error === 'string'
          ? supaRes.data.error
          : typeof supaRes.data?.error === 'object' && supaRes.data?.error !== null
          ? ((supaRes.data.error as any).message || JSON.stringify(supaRes.data.error))
          : '';

        recordLog({
          id: Math.random().toString(36).substring(2, 9),
          timestamp: now,
          method: 'GET',
          endpoint: '/api/supabase-test',
          status: supaRes.status,
          durationMs: supaRes.latencyMs,
          response: supaRes.data,
          isError: !supabaseConnected,
        });
      }

      setHealth({
        backend: {
          status: backendOnline ? 'online' : 'offline',
          message: typeof backendRes.data?.message === 'string'
            ? backendRes.data.message
            : typeof backendRes.data?.message === 'object' && backendRes.data?.message !== null
            ? ((backendRes.data.message as any).message || JSON.stringify(backendRes.data.message))
            : (backendOnline ? 'Online' : 'Gateway unreachable'),
          latencyMs: backendRes.latencyMs,
          lastChecked: now,
        },
        supabase: {
          status: backendOnline ? (supabaseConnected ? 'connected' : 'error') : 'unknown',
          message: supabaseMsg,
          errorDetails: supabaseError,
          lastChecked: now,
        },
      });

      if (!isSilent && backendOnline) {
        showToast('success', 'Fastify Gateway Online 🚀', `${backendRes.latencyMs}ms latency`);
      }
    } catch (err: any) {
      const errMsg = typeof err === 'string'
        ? err
        : err?.message
        ? err.message
        : typeof err === 'object'
        ? JSON.stringify(err)
        : 'Connection refused';
      setHealth((prev) => ({
        ...prev,
        backend: {
          status: 'offline',
          message: errMsg,
          latencyMs: null,
          lastChecked: now,
        },
      }));
    } finally {
      setIsRefreshing(false);
    }
  }, [recordLog, showToast]);

  useEffect(() => {
    checkHealth(true);
  }, [checkHealth]);

  const isPublicWebsite = surface === 'public_website';
  const isWardPortalSurface = surface === 'parent_portal' || (isAuthenticated && (currentUser?.role === 'parent' || currentUser?.role === 'student'));
  const isTeacherPortalSurface = isAuthenticated && (currentUser?.role === 'teacher' || ['teacher', 'faculty', 'lecturer'].includes((currentUser?.role || '').toLowerCase()));
  const isStandalonePortal = isWardPortalSurface || isTeacherPortalSurface || surface === 'school_app';

  return (
    <div
      className={`min-h-screen flex flex-col relative overflow-x-hidden ${
        isPublicWebsite
          ? 'bg-[#070A12] text-slate-100 selection:bg-cyan-500 selection:text-white'
          : isWardPortalSurface
          ? 'bg-[#070B14] text-slate-100 selection:bg-cyan-500 selection:text-white'
          : 'bg-[#EDF2F7] text-slate-950 selection:bg-purple-600 selection:text-white'
      }`}
    >
      {/* Ambient Background Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {isPublicWebsite || isWardPortalSurface ? (
          <>
            <div className="absolute -top-40 -right-40 w-[650px] h-[650px] bg-indigo-600/15 rounded-full blur-[140px]" />
            <div className="absolute top-1/3 -left-40 w-[650px] h-[650px] bg-cyan-500/10 rounded-full blur-[140px]" />
            <div className="absolute -bottom-40 right-1/4 w-[650px] h-[650px] bg-purple-600/15 rounded-full blur-[140px]" />
          </>
        ) : (
          <>
            <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-rose-200/30 rounded-full blur-[120px]" />
            <div className="absolute top-1/3 -left-40 w-[600px] h-[600px] bg-purple-200/25 rounded-full blur-[120px]" />
            <div className="absolute -bottom-40 right-1/4 w-[600px] h-[600px] bg-amber-200/20 rounded-full blur-[120px]" />
          </>
        )}
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header with Top Surface Switcher (Strictly Hidden for Standalone Portals: Ward, Teacher, and App) */}
      {!isStandalonePortal && (
        <Header
          surface={surface}
          setSurface={handleSetSurface}
          adminTab={adminTab}
          setAdminTab={setAdminTab}
          health={health}
          onRefreshHealth={() => checkHealth(false)}
          isRefreshing={isRefreshing}
          onShowToast={showToast}
          isAuthenticated={isAuthenticated}
          currentUser={currentUser}
          onOpenLogin={() => setShowAuthModal(true)}
          onSignOut={handleSignOut}
        />
      )}

      {/* Auth Modal for Unauthenticated Access */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={handleLoginSuccess}
        onShowToast={showToast}
      />

      {/* Main Body per Active Surface */}
      <main
        className={
          isPublicWebsite
            ? 'flex-1 w-full relative z-10'
            : surface === 'school_erp' || isWardPortalSurface
            ? 'flex-1 w-full relative z-10 p-0'
            : 'flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10'
        }
      >
        {/* Surface 1: Public Website (Visible to everyone) */}
        {surface === 'public_website' && (
          <PublicWebsiteView
            onShowToast={showToast}
            onRequestLogin={() => setShowAuthModal(true)}
            onRequestDemo={() => {
              const el = document.getElementById('demo-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        )}

        {/* Protection barrier: If unauthenticated visitor attempts to access any internal surface */}
        {surface !== 'public_website' && !isAuthenticated ? (
          <div className="py-20 text-center space-y-6 max-w-md mx-auto animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center mx-auto text-purple-600 shadow-lg shadow-purple-500/10">
              <span className="text-2xl">🔒</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">School Portal Authentication Required</h3>
              <p className="text-xs text-slate-600 font-mono leading-relaxed">
                All internal Dakshora ERP & Management dashboards are restricted. Please sign in with your authorized school credentials to access your workspace.
              </p>
            </div>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 hover:brightness-105 text-white font-bold text-xs font-mono shadow-xl shadow-purple-500/25 transition-all inline-flex items-center gap-2 hover:scale-[1.02]"
            >
              <span>Sign In to School Portal</span>
            </button>
          </div>
        ) : (
          <>
            {/* Authenticated Surfaces */}
            {/* Surface 2: School SaaS Pitch & Template Showcase */}
            {surface === 'school_saas' && (
              <SchoolSaaSShowcase
                onShowToast={showToast}
                onNavigateTab={(tab) => {
                  setSurface('admin_panel');
                  setAdminTab(tab as AdminTabType);
                }}
              />
            )}

            {/* Surface 3: Customer Dashboard */}
            {surface === 'customer_dashboard' && (
              <CustomerDashboardView
                onShowToast={showToast}
                onNavigateTab={(tab) => {
                  if (tab === 'school_erp') {
                    setSurface('school_erp');
                  } else if (tab === 'school_onboarding') {
                    setSurface('school_onboarding');
                  } else {
                    setSurface('admin_panel');
                    setAdminTab(tab as AdminTabType);
                  }
                }}
              />
            )}

            {/* Surface 4: School ERP Engine (5 Roles & 13 Modules) */}
            {surface === 'school_erp' && (
              <SchoolErpHub currentUser={currentUser} onShowToast={showToast} />
            )}

            {/* Surface 5: Parent & Student Self-Service Portal Experience */}
            {surface === 'parent_portal' && (
              <ParentStudentPortalHub
                currentUser={currentUser}
                onShowToast={showToast}
                onSignOut={handleSignOut}
              />
            )}

            {/* Surface 7: School ERP Onboarding & Configuration Wizard (16 Steps) */}
            {surface === 'school_onboarding' && (
              <SchoolOnboardingWizard
                onShowToast={showToast}
                onNavigateToErp={() => setSurface('school_erp')}
              />
            )}

            {/* Surface 8: Dakshora School App — Standalone Multi-Role White-Label App */}
            {surface === 'school_app' && (
              <div className="fixed inset-0 z-50 bg-[#050810] overflow-y-auto">
                {/* Floating back-to-portal pill */}
                <div className="fixed top-4 right-4 z-[60]">
                  <button
                    onClick={() => setSurface(currentUser?.role === 'superadmin' ? 'admin_panel' : (currentUser?.role === 'parent' || currentUser?.role === 'student') ? 'parent_portal' : 'school_erp')}
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold hover:bg-white/20 transition-all shadow-xl cursor-pointer"
                  >
                    <span>← Portal</span>
                  </button>
                </div>
                <DakshoraSchoolApp
                  orgId={currentUser?.organization_id || currentUser?.org_id || "87be8580-89af-4d9c-952b-73a02a9eae82"}
                  onShowToast={showToast}
                />
              </div>
            )}

            {/* Surface 6: SuperAdmin Operations Hub (SuperAdmin Only) */}
            {surface === 'admin_panel' && (
              currentUser?.role === 'superadmin' ? (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Active Module Content View */}
                  {(adminTab === 'superadmin' || adminTab === 'dashboard') && (
                    <SuperAdminHub
                      onShowToast={showToast}
                      onNavigateToTab={(tab) => handleSetAdminTab(tab as any)}
                    />
                  )}
                  {adminTab === 'organizations' && (
                    <OrganizationsHub
                      onShowToast={showToast}
                      onLaunchOnboarding={() => handleSetSurface('school_onboarding')}
                      onNavigateToErp={() => handleSetSurface('school_erp')}
                    />
                  )}
                  {adminTab === 'websites' && <CmsWebsitesHub onShowToast={showToast} />}
                  {adminTab === 'leads' && <LeadsCrmHub onShowToast={showToast} />}
                  {adminTab === 'analytics' && <AnalyticsHub />}
                  {adminTab === 'billing' && <BillingHub onShowToast={showToast} />}
                  {adminTab === 'audit_logs' && <AuditLogsHub />}
                  {adminTab === 'ai' && <DakshoraAiHub onShowToast={showToast} />}
                </div>
              ) : (
                <div className="p-12 text-center bg-white border border-rose-200 rounded-3xl max-w-xl mx-auto my-12 space-y-4 shadow-xl shadow-rose-500/5">
                  <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                    <span className="text-3xl font-bold">🚫</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">403 — Access Denied</h3>
                  <p className="text-xs text-slate-600 font-mono leading-relaxed">
                    The Platform Control Center is strictly restricted to verified DAKSHORA SuperAdmin accounts. Standard school staff, student, or demo sessions cannot view platform controls.
                  </p>
                  <div className="pt-4 flex items-center justify-center gap-3">
                    <button
                      onClick={() => setSurface('public_website')}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-mono font-bold transition-all border border-slate-200"
                    >
                      Return to Website
                    </button>
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-105 text-white font-bold rounded-xl text-xs font-mono transition-all shadow-lg shadow-amber-500/20"
                    >
                      Sign In as SuperAdmin
                    </button>
                  </div>
                </div>
              )
            )}
          </>
        )}
      </main>

      {/* Footer for Internal / ERP Dashboard Surfaces (Hidden for Standalone Portals) */}
      {!isPublicWebsite && !isStandalonePortal && (
        <footer className="w-full border-t border-slate-200/90 bg-white/80 backdrop-blur-md py-6 mt-12 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-bold text-slate-700">DAKSHORA 2.0 Enterprise Ecosystem</span>
            </div>
            <div className="flex items-center gap-4 text-slate-500">
              <span>Fastify Gateway</span>
              <span>•</span>
              <span>RBAC Authorization</span>
              <span>•</span>
              <span>Supabase Cloud (12 Tables)</span>
            </div>
          </div>
        </footer>
      )}

      {/* PWA Offline Resiliency Indicator */}
      <OfflineIndicator />
    </div>
  );
}

export default App;
