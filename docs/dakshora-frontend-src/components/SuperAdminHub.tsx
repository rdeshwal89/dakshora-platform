import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Key,
  UserCheck,
  Lock,
  Mail,
  User,
  Plus,
  RefreshCw,
  LogOut,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Terminal,
  Shield,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  Building2,
  GraduationCap,
  FileCheck,
  BarChart3,
  CreditCard,
  LifeBuoy,
  Radio,
  Settings as SettingsIcon,
  Activity,
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Server,
  Layers,
  Database,
  Send,
  Sliders,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import {
  createSuperAdmin,
  loginSuperAdmin,
  changeSuperAdminPassword,
  fetchAuthAdmins,
  deleteAuthUser,
  createClientUser,
  fetchPlatformDashboard,
  fetchPlatformOrganizations,
  fetchPlatformOrganizationDetail,
  updatePlatformOrganizationStatus,
  fetchPlatformSchools,
  fetchPlatformUsers,
  updatePlatformUserRole,
  fetchPlatformSubscriptions,
  updatePlatformSubscription,
  fetchPlatformPlans,
  fetchPlatformUsage,
  fetchPlatformOnboarding,
  fetchPlatformTickets,
  createPlatformTicket,
  updatePlatformTicket,
  startSupportSession,
  endSupportSession,
  fetchActiveSupportSession,
  fetchPlatformHealth,
  fetchPlatformSettings,
  updatePlatformSettings,
  broadcastPlatformNotice,
  enrollMfa,
  verifyMfa,
  getMfaStatus,
  unenrollMfa
} from '../services/api';
import {
  PlatformDashboardData,
  PlatformSupportTicket,
  PlatformSupportSession,
  PlatformSettings,
  PlatformHealthStatus,
  PlatformUser,
  PlatformSchool,
  PlatformOnboardingSummary
} from '../types';

interface SuperAdminHubProps {
  onShowToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
  onNavigateToTab?: (tab: string) => void;
  onSwitchToSchool?: (school: any) => void;
  onNavigateToSurface?: (surface: any) => void;
}

type PlatformTab =
  | 'overview'
  | 'schools'
  | 'users'
  | 'telemetry'
  | 'health'
  | 'onboarding'
  | 'support'
  | 'broadcast'
  | 'settings'
  | 'client_setup'
  | 'subscriptions'
  | 'organizations';

export const SuperAdminHub: React.FC<SuperAdminHubProps> = ({
  onShowToast,
  onNavigateToTab,
  onSwitchToSchool,
  onNavigateToSurface
}) => {
  // Navigation
  const [activeTab, setActiveTab] = useState<PlatformTab>('overview');

  // Auth / Current Admin State
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('dakshora_superadmin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Support Session Banner State
  const [activeSession, setActiveSession] = useState<PlatformSupportSession | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [isExitingSession, setIsExitingSession] = useState(false);

  // Start Support Session Modal State
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportTargetOrgId, setSupportTargetOrgId] = useState('');
  const [supportReason, setSupportReason] = useState('');
  const [isStartingSupport, setIsStartingSupport] = useState(false);

  // Dashboard Data State
  const [dashboardData, setDashboardData] = useState<PlatformDashboardData | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  // Organizations Catalog State
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [orgSearch, setOrgSearch] = useState('');
  const [orgStatusFilter, setOrgStatusFilter] = useState('all');
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [selectedOrgDetail, setSelectedOrgDetail] = useState<any | null>(null);

  // Schools Directory State
  const [schools, setSchools] = useState<PlatformSchool[]>([]);
  const [schoolSearch, setSchoolSearch] = useState('');
  const [isLoadingSchools, setIsLoadingSchools] = useState(false);

  // Users State
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Subscriptions State
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoadingSubs, setIsLoadingSubs] = useState(false);

  // Telemetry State
  const [telemetry, setTelemetry] = useState<any | null>(null);
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState(false);

  // Onboarding Monitor State
  const [onboardingList, setOnboardingList] = useState<PlatformOnboardingSummary[]>([]);
  const [isLoadingOnboarding, setIsLoadingOnboarding] = useState(false);

  // Support Tickets State
  const [tickets, setTickets] = useState<PlatformSupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [newTicketOrgId, setNewTicketOrgId] = useState('');
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketDesc, setNewTicketDesc] = useState('');
  const [newTicketPriority, setNewTicketPriority] = useState('medium');
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  // Subsystem Health State
  const [healthStatus, setHealthStatus] = useState<PlatformHealthStatus | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Broadcast Notice State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastAudience, setBroadcastAudience] = useState('all_org_admins');
  const [broadcastPriority, setBroadcastPriority] = useState('normal');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // Client Provisioning (Legacy/Handover) State
  const [clientSchoolName, setClientSchoolName] = useState('Delhi Public Heritage School');
  const [clientPrincipalName, setClientPrincipalName] = useState('Dr. Rajesh Sharma');
  const [clientEmail, setClientEmail] = useState('principal@dpsheritage.in');
  const [clientPassword, setClientPassword] = useState('Heritage@2026!');
  const [clientRole, setClientRole] = useState('school-admin');
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [createdClientCard, setCreatedClientCard] = useState<any>(null);
  const [adminList, setAdminList] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // MFA / 2FA State
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [isLoadingMfa, setIsLoadingMfa] = useState(false);
  const [showMfaEnrollModal, setShowMfaEnrollModal] = useState(false);
  const [mfaEnrollData, setMfaEnrollData] = useState<{ factorId: string; secret: string; qrCode: string; uri: string } | null>(null);
  const [mfaVerifyCode, setMfaVerifyCode] = useState('');
  const [isVerifyingMfaSetup, setIsVerifyingMfaSetup] = useState(false);
  const [isUnenrollingMfa, setIsUnenrollingMfa] = useState(false);

  // SuperAdmin Password Change State
  const [newSuperAdminPwd, setNewSuperAdminPwd] = useState('');
  const [confirmSuperAdminPwd, setConfirmSuperAdminPwd] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);

  const handleChangeSuperAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuperAdminPwd || newSuperAdminPwd.length < 6) {
      onShowToast('error', 'Short Password', 'New password must be at least 6 characters long.');
      return;
    }
    if (newSuperAdminPwd !== confirmSuperAdminPwd) {
      onShowToast('error', 'Password Mismatch', 'New password and confirmation password do not match.');
      return;
    }

    setIsUpdatingPwd(true);
    try {
      const superAdminUser = JSON.parse(localStorage.getItem('dakshora_superadmin_user') || '{}');
      const email = superAdminUser.email || 'superadmin@dakshora.com';
      const res = await changeSuperAdminPassword({
        email,
        newPassword: newSuperAdminPwd.trim()
      });
      if (res.data?.success) {
        onShowToast('success', 'Password Updated! 🔑✨', 'SuperAdmin password updated. Use new password on next login.');
        setNewSuperAdminPwd('');
        setConfirmSuperAdminPwd('');
      } else {
        onShowToast('error', 'Update Failed', res.data?.message || 'Could not update password.');
      }
    } catch (err: any) {
      onShowToast('error', 'Error', err.message || 'Failed to update password.');
    } finally {
      setIsUpdatingPwd(false);
    }
  };

  const loadMfaStatus = async () => {
    setIsLoadingMfa(true);
    try {
      const res = await getMfaStatus();
      if (res.data.success) {
        setMfaEnabled(res.data.mfaEnabled);
      }
    } catch {
      // silent
    } finally {
      setIsLoadingMfa(false);
    }
  };

  const handleStartMfaEnroll = async () => {
    setIsLoadingMfa(true);
    try {
      const res = await enrollMfa();
      if (res.data.success && res.data.secret) {
        setMfaEnrollData({
          factorId: res.data.factorId,
          secret: res.data.secret,
          qrCode: res.data.qrCode,
          uri: res.data.uri
        });
        setShowMfaEnrollModal(true);
      } else {
        onShowToast('error', 'MFA Enrollment Failed', res.data.message || 'Could not generate 2FA secret');
      }
    } catch (err: any) {
      onShowToast('error', 'Error', err.message);
    } finally {
      setIsLoadingMfa(false);
    }
  };

  const handleConfirmMfaSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaEnrollData || !mfaVerifyCode.trim() || mfaVerifyCode.trim().length !== 6) {
      onShowToast('error', 'Validation Error', 'Please enter a valid 6-digit code from your authenticator app.');
      return;
    }
    setIsVerifyingMfaSetup(true);
    try {
      const res = await verifyMfa({
        factorId: mfaEnrollData.factorId,
        code: mfaVerifyCode.trim()
      });
      if (res.data.success) {
        setMfaEnabled(true);
        setShowMfaEnrollModal(false);
        setMfaEnrollData(null);
        setMfaVerifyCode('');
        onShowToast('success', 'Two-Factor Authentication Active! 🛡️', 'TOTP 2FA has been successfully activated on your account.');
      } else {
        onShowToast('error', 'Verification Failed', res.data.message || 'Invalid 6-digit code');
      }
    } catch (err: any) {
      onShowToast('error', 'Error', err.message);
    } finally {
      setIsVerifyingMfaSetup(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!confirm('Are you sure you want to disable Two-Factor Authentication? Your account will be protected by password only.')) return;
    setIsUnenrollingMfa(true);
    try {
      const res = await unenrollMfa();
      if (res.data.success) {
        setMfaEnabled(false);
        onShowToast('info', '2FA Disabled', 'Two-factor authentication has been disabled.');
      } else {
        onShowToast('error', 'Disable Failed', res.data.message);
      }
    } catch (err: any) {
      onShowToast('error', 'Error', err.message);
    } finally {
      setIsUnenrollingMfa(false);
    }
  };

  // 1. Initial Load & Session Check
  const checkActiveSupportSession = async () => {
    setIsCheckingSession(true);
    try {
      const res = await fetchActiveSupportSession();
      if (res.data.success && res.data.hasActiveSession) {
        setActiveSession(res.data.activeSession);
      } else {
        setActiveSession(null);
      }
    } catch {
      setActiveSession(null);
    } finally {
      setIsCheckingSession(false);
    }
  };

  const loadDashboard = async () => {
    setIsLoadingDashboard(true);
    try {
      const res = await fetchPlatformDashboard();
      if (res.data.success) {
        setDashboardData(res.data as any);
      }
    } catch (err: any) {
      onShowToast('error', 'Failed to load platform dashboard', err.message);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  const loadOrganizations = async () => {
    setIsLoadingOrgs(true);
    try {
      const res = await fetchPlatformOrganizations({
        q: orgSearch,
        status: orgStatusFilter !== 'all' ? orgStatusFilter : undefined
      });
      if (res.data.success && res.data.organizations) {
        setOrganizations(res.data.organizations);
        if (!supportTargetOrgId && res.data.organizations.length > 0) {
          setSupportTargetOrgId(res.data.organizations[0].id);
          setNewTicketOrgId(res.data.organizations[0].id);
        }
      }
    } catch (err: any) {
      onShowToast('error', 'Error loading organizations', err.message);
    } finally {
      setIsLoadingOrgs(false);
    }
  };

  const loadSchools = async () => {
    setIsLoadingSchools(true);
    try {
      const res = await fetchPlatformSchools({ q: schoolSearch });
      if (res.data.success && res.data.schools) {
        setSchools(res.data.schools);
      }
    } catch (err: any) {
      onShowToast('error', 'Error loading schools', err.message);
    } finally {
      setIsLoadingSchools(false);
    }
  };

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetchPlatformUsers();
      if (res.data.success && res.data.users) {
        setUsers(res.data.users);
      }
    } catch (err: any) {
      onShowToast('error', 'Error loading users', err.message);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadSubscriptions = async () => {
    setIsLoadingSubs(true);
    try {
      const [subRes, planRes] = await Promise.all([
        fetchPlatformSubscriptions(),
        fetchPlatformPlans()
      ]);
      if (subRes.data.success && subRes.data.subscriptions) setSubscriptions(subRes.data.subscriptions);
      if (planRes.data.success && planRes.data.plans) setPlans(planRes.data.plans);
    } catch (err: any) {
      onShowToast('error', 'Error loading billing data', err.message);
    } finally {
      setIsLoadingSubs(false);
    }
  };

  const loadTelemetry = async () => {
    setIsLoadingTelemetry(true);
    try {
      const res = await fetchPlatformUsage();
      if (res.data.success) setTelemetry(res.data.usage);
    } catch (err: any) {
      onShowToast('error', 'Error loading telemetry', err.message);
    } finally {
      setIsLoadingTelemetry(false);
    }
  };

  const loadOnboarding = async () => {
    setIsLoadingOnboarding(true);
    try {
      const res = await fetchPlatformOnboarding();
      if (res.data.success && res.data.onboarding) setOnboardingList(res.data.onboarding);
    } catch (err: any) {
      onShowToast('error', 'Error loading onboarding records', err.message);
    } finally {
      setIsLoadingOnboarding(false);
    }
  };

  const loadTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const res = await fetchPlatformTickets();
      if (res.data.success && res.data.tickets) setTickets(res.data.tickets);
    } catch (err: any) {
      onShowToast('error', 'Error loading support tickets', err.message);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const loadHealth = async () => {
    setIsLoadingHealth(true);
    try {
      const res = await fetchPlatformHealth();
      if (res.data.success) setHealthStatus(res.data as any);
    } catch (err: any) {
      onShowToast('error', 'Error loading platform health', err.message);
    } finally {
      setIsLoadingHealth(false);
    }
  };

  const loadSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const res = await fetchPlatformSettings();
      if (res.data.success && res.data.settings) setSettings(res.data.settings);
    } catch (err: any) {
      onShowToast('error', 'Error loading platform settings', err.message);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const loadLegacyAdmins = async () => {
    try {
      const res = await fetchAuthAdmins();
      if (res.data.success && Array.isArray(res.data.users)) {
        setAdminList(res.data.users);
      }
    } catch {
      // silent
    }
  };

  // 1-Click Launch School into ERP
  const handleLaunchSchool = (schoolOrOrg: any) => {
    const orgId = schoolOrOrg.organizationId || schoolOrOrg.organization_id || schoolOrOrg.id || 'b17780e5-3832-4ac6-9aeb-33fd80c5cb0e';
    const schoolName = schoolOrOrg.name || schoolOrOrg.schoolName || 'Dakshora Academy, New Delhi';
    const brand = {
      schoolName,
      shortName: schoolOrOrg.shortName || (schoolName.split(' ')[0] || 'DAKSHORA'),
      board: schoolOrOrg.board || 'CBSE (Central Board of Secondary Education)',
      affiliationNo: schoolOrOrg.affiliationNo || schoolOrOrg.affiliation_no || 'CBSE-AFF-202601',
      schoolCode: schoolOrOrg.schoolCode || schoolOrOrg.school_code || schoolOrOrg.code || 'DKS-DEL-01',
      motto: schoolOrOrg.motto || 'Excellence in Education',
      themeColor: schoolOrOrg.themeColor || 'indigo',
      principalName: schoolOrOrg.principalName || 'Principal',
      contactEmail: schoolOrOrg.contactEmail || schoolOrOrg.email || '',
      contactPhone: schoolOrOrg.contactPhone || schoolOrOrg.phone || '',
      address: schoolOrOrg.address || ''
    };
    try {
      localStorage.setItem('dakshora_school_brand', JSON.stringify(brand));
      const savedUser = localStorage.getItem('dakshora_superadmin_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        u.organizationId = orgId;
        u.organization_id = orgId;
        u.org_id = orgId;
        u.schoolName = schoolName;
        localStorage.setItem('dakshora_superadmin_user', JSON.stringify(u));
      }
    } catch {}

    if (onSwitchToSchool) {
      onSwitchToSchool(schoolOrOrg);
    } else if (onNavigateToSurface) {
      onNavigateToSurface('school_erp');
    }
  };

  // Trigger loads based on active tab
  useEffect(() => {
    checkActiveSupportSession();
    loadDashboard();
    loadOrganizations();
    loadSchools();
  }, []);

  useEffect(() => {
    if (activeTab === 'overview') loadDashboard();
    if (activeTab === 'organizations') loadOrganizations();
    if (activeTab === 'schools') loadSchools();
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'subscriptions') loadSubscriptions();
    if (activeTab === 'telemetry') loadTelemetry();
    if (activeTab === 'onboarding') loadOnboarding();
    if (activeTab === 'support') loadTickets();
    if (activeTab === 'health') loadHealth();
    if (activeTab === 'settings') {
      loadSettings();
      loadMfaStatus();
    }
    if (activeTab === 'client_setup') loadLegacyAdmins();
  }, [activeTab]);

  // Support Session Actions
  const handleStartSupportSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportTargetOrgId || !supportReason.trim()) {
      onShowToast('error', 'Validation Error', 'Target organization and legitimate reason are required.');
      return;
    }

    setIsStartingSupport(true);
    try {
      const res = await startSupportSession({
        target_organization_id: supportTargetOrgId,
        reason: supportReason.trim()
      });

      if (res.data.success && res.data.session) {
        setActiveSession(res.data.session);
        setShowSupportModal(false);
        setSupportReason('');
        onShowToast('success', 'Safe Support Mode Activated 🛡️', res.data.message);
        loadDashboard();
      } else {
        onShowToast('error', 'Failed to start support session', res.data.message);
      }
    } catch (err: any) {
      onShowToast('error', 'Error', err.message);
    } finally {
      setIsStartingSupport(false);
    }
  };

  const handleEndSupportSession = async () => {
    setIsExitingSession(true);
    try {
      const res = await endSupportSession();
      if (res.data.success) {
        setActiveSession(null);
        onShowToast('info', 'Support Mode Exited', 'Platform restored to standard operational context.');
        loadDashboard();
      }
    } catch (err: any) {
      onShowToast('error', 'Error exiting support session', err.message);
    } finally {
      setIsExitingSession(false);
    }
  };

  // Status & Settings Mutators
  const handleUpdateOrgStatus = async (orgId: string, newStatus: string) => {
    try {
      const res = await updatePlatformOrganizationStatus(orgId, newStatus);
      if (res.data.success) {
        onShowToast('success', 'Organization Status Updated', res.data.message);
        loadOrganizations();
        loadDashboard();
      }
    } catch (err: any) {
      onShowToast('error', 'Update Failed', err.message);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const res = await updatePlatformUserRole(userId, newRole);
      if (res.data.success) {
        onShowToast('success', 'User Role Updated', res.data.message);
        loadUsers();
      }
    } catch (err: any) {
      onShowToast('error', 'Role Update Failed', err.message);
    }
  };

  const handleToggleMaintenance = async () => {
    if (!settings) return;
    const nextMode = !settings.maintenance_mode;
    setIsSavingSettings(true);
    try {
      const res = await updatePlatformSettings({ maintenance_mode: nextMode });
      if (res.data.success && res.data.settings) {
        setSettings(res.data.settings);
        onShowToast(nextMode ? 'error' : 'success', 'Maintenance Mode Changed', `Maintenance mode is now ${nextMode ? 'ENABLED 🚨' : 'DISABLED ✅'}`);
        loadDashboard();
      }
    } catch (err: any) {
      onShowToast('error', 'Settings Update Failed', err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleToggleFeatureFlag = async (featureKey: string) => {
    if (!settings) return;
    const currentVal = settings.feature_flags[featureKey];
    const updatedFlags = { ...settings.feature_flags, [featureKey]: !currentVal };
    setIsSavingSettings(true);
    try {
      const res = await updatePlatformSettings({ feature_flags: updatedFlags });
      if (res.data.success && res.data.settings) {
        setSettings(res.data.settings);
        onShowToast('success', 'Feature Flag Updated', `${featureKey}: ${!currentVal ? 'ENABLED' : 'DISABLED'}`);
      }
    } catch (err: any) {
      onShowToast('error', 'Feature Flag Update Failed', err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      onShowToast('error', 'Validation Error', 'Title and message are required.');
      return;
    }
    setIsSendingBroadcast(true);
    try {
      const res = await broadcastPlatformNotice({
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        audience: broadcastAudience,
        priority: broadcastPriority
      });
      if (res.data.success) {
        onShowToast('success', 'Broadcast Dispatched 📢', res.data.message);
        setBroadcastTitle('');
        setBroadcastMessage('');
      }
    } catch (err: any) {
      onShowToast('error', 'Broadcast Failed', err.message);
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketDesc.trim()) {
      onShowToast('error', 'Validation Error', 'Subject and description are required.');
      return;
    }
    setIsCreatingTicket(true);
    try {
      const res = await createPlatformTicket({
        organization_id: newTicketOrgId,
        subject: newTicketSubject.trim(),
        description: newTicketDesc.trim(),
        priority: newTicketPriority
      });
      if (res.data.success) {
        onShowToast('success', 'Ticket Created', res.data.message);
        setNewTicketSubject('');
        setNewTicketDesc('');
        loadTickets();
        loadDashboard();
      }
    } catch (err: any) {
      onShowToast('error', 'Ticket Creation Failed', err.message);
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const res = await updatePlatformTicket(ticketId, { status });
      if (res.data.success) {
        onShowToast('success', 'Ticket Updated', res.data.message);
        loadTickets();
        loadDashboard();
      }
    } catch (err: any) {
      onShowToast('error', 'Update Failed', err.message);
    }
  };

  // Legacy client creation
  const handleCreateClientAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientEmail.trim() || !clientPassword.trim()) {
      onShowToast('error', 'Validation Error', 'Email and password are required');
      return;
    }

    setIsCreatingClient(true);
    try {
      const res = await createClientUser({
        email: clientEmail.trim(),
        password: clientPassword.trim(),
        name: clientPrincipalName.trim(),
        role: clientRole,
        organization_name: clientSchoolName.trim(),
      });

      if (res.data.success) {
        const handoverData = {
          schoolName: clientSchoolName.trim(),
          name: clientPrincipalName.trim(),
          email: clientEmail.trim(),
          password: clientPassword.trim(),
          role: clientRole === 'school-admin' ? 'School Principal (Full Admin)' : 'Teacher / Academic Staff',
          portalUrl: 'http://localhost:5173 (Customer Portal tab)',
          created_at: new Date().toLocaleTimeString(),
        };

        setCreatedClientCard(handoverData);
        onShowToast('success', 'Client Account Created! 🎓', `Login User ID: ${clientEmail}`);
        loadLegacyAdmins();
      } else {
        onShowToast('error', 'Creation Failed', res.data.message);
      }
    } catch (err: any) {
      onShowToast('error', 'Error', err.message);
    } finally {
      setIsCreatingClient(false);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onShowToast('info', 'Copied to Clipboard', text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'organizations', label: 'Organizations', icon: Building2 },
    { id: 'schools', label: 'Schools Directory', icon: GraduationCap },
    { id: 'users', label: 'User Governance', icon: Users },
    { id: 'subscriptions', label: 'Subscriptions & MRR', icon: CreditCard },
    { id: 'telemetry', label: 'Usage Telemetry', icon: Activity },
    { id: 'onboarding', label: 'Onboarding Monitor', icon: Layers },
    { id: 'support', label: 'Support & Impersonation', icon: LifeBuoy },
    { id: 'broadcast', label: 'Broadcast Notices', icon: Radio },
    { id: 'health', label: 'Subsystem Health', icon: Server },
    { id: 'settings', label: 'Platform Settings', icon: SettingsIcon },
    { id: 'client_setup', label: 'Direct Provisioning', icon: Plus }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. PERSISTENT SAFE SUPPORT MODE BANNER */}
      {activeSession && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 px-5 py-3 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-3 border-2 border-amber-300 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-950 text-amber-400 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs uppercase tracking-wider bg-slate-950 text-amber-300 px-2 py-0.5 rounded">
                  Safe Support Mode Active
                </span>
                <span className="text-xs font-mono font-bold text-slate-900">
                  Target Tenant: <strong className="underline">{activeSession.target_school_name}</strong>
                </span>
              </div>
              <p className="text-xs font-medium text-slate-950 mt-0.5">
                Authorized Reason: "{activeSession.reason}" • Token: <code className="bg-amber-400/40 px-1 py-0.2 rounded font-mono">{activeSession.session_token.slice(0, 18)}...</code> • Expires:{' '}
                {new Date(activeSession.expires_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEndSupportSession}
              disabled={isExitingSession}
              className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-amber-400 hover:text-white rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2 border border-slate-800"
            >
              {isExitingSession ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
              <span>Exit Support Session</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. PLATFORM CONTROL CENTER HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-white/95 border border-slate-200/90 shadow-xl shadow-slate-200/40">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-amber-500/25">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">DAKSHORA PLATFORM CONTROL CENTER</h1>
                <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300 rounded-full uppercase">
                  SuperAdmin / SaaS Ops
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Manage global multi-tenant schools, SaaS subscriptions, real-time telemetry, safe support impersonation, and system stability.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowSupportModal(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-mono font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            <span>Enter Safe Support Mode</span>
          </button>

          <button
            onClick={() => {
              loadDashboard();
              checkActiveSupportSession();
              onShowToast('info', 'Refreshing', 'Platform data synced from database.');
            }}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs transition-all shadow-xs cursor-pointer"
            title="Refresh Real-time Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingDashboard ? 'animate-spin text-amber-600' : ''}`} />
          </button>

          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{currentUser.email}</span>
          </div>
        </div>
      </div>

      {/* 3. TWO-ROW COLOURFUL TAB NAVIGATION (ZERO SCROLLING) */}
      {(() => {
        const row1Tabs = [
          { id: 'overview', label: 'Overview', icon: BarChart3, activeGradient: 'from-amber-500 via-orange-500 to-rose-500' },
          { id: 'schools', label: 'Schools Directory', icon: GraduationCap, activeGradient: 'from-purple-600 via-fuchsia-600 to-pink-600' },
          { id: 'organizations', label: 'Organizations', icon: Building2, activeGradient: 'from-sky-500 via-blue-600 to-indigo-600' },
          { id: 'users', label: 'User Governance', icon: Users, activeGradient: 'from-emerald-600 via-teal-600 to-cyan-600' },
          { id: 'subscriptions', label: 'Subscriptions & MRR', icon: CreditCard, activeGradient: 'from-amber-500 to-orange-600' },
          { id: 'telemetry', label: 'Usage Telemetry', icon: Activity, activeGradient: 'from-cyan-600 via-blue-600 to-indigo-600' }
        ];

        const row2Tabs = [
          { id: 'onboarding', label: 'Onboarding Monitor', icon: Layers, activeGradient: 'from-fuchsia-600 to-pink-600' },
          { id: 'support', label: 'Support & Impersonation', icon: LifeBuoy, activeGradient: 'from-rose-500 to-orange-500' },
          { id: 'broadcast', label: 'Broadcast Notices', icon: Radio, activeGradient: 'from-orange-500 to-amber-600' },
          { id: 'health', label: 'Subsystem Health', icon: Server, activeGradient: 'from-emerald-600 to-teal-600' },
          { id: 'settings', label: 'Platform Settings', icon: SettingsIcon, activeGradient: 'from-indigo-600 to-purple-600' },
          { id: 'client_setup', label: 'Direct Provisioning', icon: Plus, activeGradient: 'from-purple-600 to-pink-600' }
        ];

        const renderTab = (item: typeof row1Tabs[0]) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as PlatformTab)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border shadow-xs cursor-pointer ${
                isActive
                  ? `bg-gradient-to-r ${item.activeGradient} text-white border-transparent shadow-md shadow-orange-500/20 scale-[1.02]`
                  : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200/90 hover:border-amber-300'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-amber-600'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        };

        return (
          <div className="bg-white/95 p-3 rounded-3xl border border-slate-200/90 shadow-md space-y-2">
            {/* ROW 1: Infrastructure & Tenants */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {row1Tabs.map(renderTab)}
            </div>
            {/* ROW 2: Operations, Support & Diagnostics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-slate-100">
              {row2Tabs.map(renderTab)}
            </div>
          </div>
        );
      })()}

      {/* 4. TAB CONTENTS */}

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Organizations */}
            <div className="bg-gradient-to-br from-sky-50/90 via-white to-blue-50/90 p-5 rounded-3xl border border-sky-200/90 shadow-md hover:shadow-xl hover:border-sky-400 transition-all space-y-2.5 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-sky-950 uppercase tracking-wider">Customer Tenants</span>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/25 group-hover:scale-110 transition-transform">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">
                {dashboardData?.metrics.organizations.total || 0}
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono pt-2 border-t border-sky-100/80">
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {dashboardData?.metrics.organizations.active || 0} Active
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {dashboardData?.metrics.organizations.trial || 0} Trial
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  {dashboardData?.metrics.organizations.suspended || 0} Suspended
                </span>
              </div>
            </div>

            {/* Card 2: SaaS MRR */}
            <div className="bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/90 p-5 rounded-3xl border border-emerald-200/90 shadow-md hover:shadow-xl hover:border-emerald-400 transition-all space-y-2.5 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-950 uppercase tracking-wider">Monthly Recurring Revenue</span>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-700 font-mono tracking-tight">
                ₹{(dashboardData?.metrics.subscriptions.monthlyRecurringRevenueINR || 0).toLocaleString('en-IN')}
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-emerald-100/80 text-slate-600">
                <span className="font-bold text-emerald-800">{dashboardData?.metrics.subscriptions.activeCount || 0} Active Subscriptions</span>
                {onNavigateToTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateToTab('billing')}
                    className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer transition-colors"
                  >
                    Open Billing & MRR →
                  </button>
                )}
              </div>
            </div>

            {/* Card 3: Platform Roster */}
            <div className="bg-gradient-to-br from-purple-50/90 via-white to-indigo-50/90 p-5 rounded-3xl border border-purple-200/90 shadow-md hover:shadow-xl hover:border-purple-400 transition-all space-y-2.5 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-purple-950 uppercase tracking-wider">Cross-Tenant Roster</span>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">
                {(dashboardData?.metrics.platformRoster.totalStudentsAcrossPlatform || 0).toLocaleString()}
                <span className="text-sm font-normal text-purple-700 ml-1.5 font-sans font-bold">Students</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono pt-2 border-t border-purple-100/80 text-slate-600">
                <span className="font-bold text-purple-800">{dashboardData?.metrics.platformRoster.totalStaffAcrossPlatform || 0} Staff</span>
                <span className="text-slate-400">•</span>
                <span className="font-bold text-slate-700">{dashboardData?.metrics.schools.totalCampuses || 1} Campuses</span>
              </div>
            </div>

            {/* Card 4: Operations & Health */}
            <div className="bg-gradient-to-br from-amber-50/90 via-white to-orange-50/90 p-5 rounded-3xl border border-amber-200/90 shadow-md hover:shadow-xl hover:border-amber-400 transition-all space-y-2.5 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-amber-950 uppercase tracking-wider">Ops & Platform Health</span>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:scale-110 transition-transform">
                  <Server className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-lg font-bold text-slate-900">All Subsystems Operational</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono pt-2 border-t border-amber-100/80 text-slate-600">
                <span className="text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                  {dashboardData?.metrics.operations.openSupportTickets || 0} Open Tickets
                </span>
                <span className="text-slate-400">•</span>
                <span className="font-bold text-cyan-800">{dashboardData?.metrics.telemetry.totalAiRequests || 0} AI Queries</span>
              </div>
            </div>
          </div>

          {/* Managed Schools & Demo Campus Overview Section */}
          {(() => {
            const demoSchool = schools.find(s => s.organizationId === 'b17780e5-3832-4ac6-9aeb-33fd80c5cb0e' || s.name?.toLowerCase().includes('dakshora')) || {
              id: 'e078639d-f988-49bc-8dca-30ef652cf41f',
              name: 'Dakshora Academy, New Delhi',
              schoolCode: 'DKS-DEL-01',
              organizationId: 'b17780e5-3832-4ac6-9aeb-33fd80c5cb0e',
              organizationName: 'Dakshora Academy New Delhi',
              board: 'CBSE',
              city: 'New Delhi',
              studentCount: dashboardData?.metrics?.platformRoster?.totalStudentsAcrossPlatform || 120,
              staffCount: dashboardData?.metrics?.platformRoster?.totalStaffAcrossPlatform || 20,
              campusesCount: dashboardData?.metrics?.schools?.totalCampuses || 3,
              currentSession: '2026-27',
              status: 'active'
            };

            return (
              <div className="space-y-4">
                {/* 1. Flagship Live Demo School Banner Card */}
                <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white p-6 sm:p-7 rounded-3xl border border-indigo-500/30 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/15 via-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="relative z-10 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[11px] font-mono font-black tracking-wider uppercase shadow-md flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                          <span>Flagship Demo School</span>
                        </span>
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>PostgreSQL Database Active</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-indigo-300 bg-white/10 px-3 py-1 rounded-xl border border-white/10">
                          Affiliation: <strong>CBSE-AFF-202601</strong>
                        </span>
                        <span className="text-xs font-mono text-purple-300 bg-white/10 px-3 py-1 rounded-xl border border-white/10">
                          Code: <strong>{demoSchool.schoolCode || 'DKS-DEL-01'}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
                          <span>{demoSchool.name || 'Dakshora Academy, New Delhi'}</span>
                        </h2>
                        <p className="text-xs font-mono text-slate-300 mt-1 max-w-2xl leading-relaxed">
                          Primary multi-tenant demonstration institution loaded with authenticated class teacher attendance, 
                          real-time student fee ledger, automated receipt numbering, and unified Parent/Student portal access.
                        </p>
                      </div>

                      {/* Fast Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <button
                          onClick={() => handleLaunchSchool(demoSchool)}
                          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] cursor-pointer"
                        >
                          <GraduationCap className="w-4 h-4" />
                          <span>Launch School ERP 🚀</span>
                        </button>

                        {onNavigateToSurface && (
                          <button
                            onClick={() => onNavigateToSurface('parent_portal')}
                            className="px-4 py-3 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:brightness-110 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-lg shadow-fuchsia-600/25 transition-all hover:scale-[1.02] cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Ward Portal 👨‍👩‍👧</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSupportTargetOrgId(demoSchool.organizationId);
                            setShowSupportModal(true);
                          }}
                          className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold flex items-center gap-2 border border-white/20 transition-all cursor-pointer"
                          title="Authorized Support Mode"
                        >
                          <Shield className="w-4 h-4 text-amber-400" />
                          <span>Support Mode</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Metrics Bar inside Demo Card */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/10">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">Enrolled Students</div>
                        <div className="text-xl font-black font-mono text-emerald-400 mt-0.5">
                          {demoSchool.studentCount || 120} <span className="text-xs text-slate-400 font-normal">Active</span>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">Faculty & Staff</div>
                        <div className="text-xl font-black font-mono text-purple-300 mt-0.5">
                          {demoSchool.staffCount || 20} <span className="text-xs text-slate-400 font-normal">Staff</span>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">Campus & Infrastructure</div>
                        <div className="text-xl font-black font-mono text-sky-400 mt-0.5">
                          {demoSchool.campusesCount || 3} <span className="text-xs text-slate-400 font-normal">Wings</span>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">Fee Engine Mode</div>
                        <div className="text-xl font-black font-mono text-amber-300 mt-0.5">
                          Rule Engine <span className="text-xs text-slate-400 font-normal">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Multi-Tenant Campus Live Directory Table */}
                <div className="bg-white/95 p-6 rounded-3xl border border-slate-200/90 shadow-md space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-purple-600" />
                        <span>Registered Multi-Tenant Institutions & Demo Campuses ({schools.length})</span>
                      </h3>
                      <p className="text-xs font-mono text-slate-500 mt-0.5">
                        Direct 1-click launch into school ERP or support impersonation for any campus.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={loadSchools}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSchools ? 'animate-spin text-purple-600' : ''}`} />
                        <span>Refresh List</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('schools')}
                        className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-mono font-bold border border-purple-200 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <span>Full Directory →</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase text-[10px] font-bold">
                        <tr>
                          <th className="p-3">School Name</th>
                          <th className="p-3">School Code</th>
                          <th className="p-3">Board / City</th>
                          <th className="p-3">Session</th>
                          <th className="p-3">Students</th>
                          <th className="p-3">Staff</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Quick Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {schools.map((sch) => {
                          const isDemo = sch.organizationId === 'b17780e5-3832-4ac6-9aeb-33fd80c5cb0e' || sch.name?.toLowerCase().includes('dakshora');
                          return (
                            <tr key={sch.id} className="hover:bg-purple-50/40 transition-colors">
                              <td className="p-3 font-bold text-slate-900">
                                <div className="flex items-center gap-2">
                                  <GraduationCap className={`w-4 h-4 ${isDemo ? 'text-amber-500' : 'text-purple-600'}`} />
                                  <span>{sch.name}</span>
                                  {isDemo && (
                                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                                      Demo
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 text-slate-700 font-bold">{sch.schoolCode}</td>
                              <td className="p-3 text-slate-600">{(sch as any).board || 'CBSE'} • {(sch as any).city || 'Delhi'}</td>
                              <td className="p-3 text-slate-700">{sch.currentSession || '2026-27'}</td>
                              <td className="p-3 font-bold text-emerald-700">{sch.studentCount || (isDemo ? 120 : 0)}</td>
                              <td className="p-3 font-bold text-purple-700">{sch.staffCount || (isDemo ? 20 : 0)}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase border border-emerald-200">
                                  {sch.status || 'Active'}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleLaunchSchool(sch)}
                                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                                  >
                                    <GraduationCap className="w-3.5 h-3.5" />
                                    <span>Launch ERP</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSupportTargetOrgId(sch.organizationId);
                                      setShowSupportModal(true);
                                    }}
                                    className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-all cursor-pointer"
                                    title="Safe Support Impersonation"
                                  >
                                    <Shield className="w-3.5 h-3.5 text-amber-600" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Secondary Overview Row: Plan Distribution & Fast Operations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Plan Distribution */}
            <div className="bg-white/95 p-6 rounded-3xl border border-slate-200/90 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <span>SaaS Tier Distribution</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">Live Active Tiers</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-700 font-medium">Starter Plan</span>
                    <span className="text-cyan-700 font-bold">{dashboardData?.metrics.subscriptions.planDistribution?.starter || 0}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2.5 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-700 font-medium">Growth Plan</span>
                    <span className="text-emerald-700 font-bold">{dashboardData?.metrics.subscriptions.planDistribution?.growth || 0}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2.5 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-700 font-medium">Enterprise Plan</span>
                    <span className="text-purple-700 font-bold">{dashboardData?.metrics.subscriptions.planDistribution?.enterprise || 0}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-fuchsia-500 h-2.5 rounded-full" style={{ width: '20%' }}></div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs font-mono">
                <span className="text-slate-500">Maintenance Mode:</span>
                <span className={dashboardData?.metrics.operations.maintenanceMode ? 'text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200' : 'text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200'}>
                  {dashboardData?.metrics.operations.maintenanceMode ? 'ENABLED 🚨' : 'ONLINE & ACTIVE ✅'}
                </span>
              </div>
            </div>

            {/* Platform Audit Trail Snippet */}
            <div className="bg-white/95 p-6 rounded-3xl border border-slate-200/90 shadow-md space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Platform Administrative Audit Stream</span>
                </h3>
                <span className="text-[10px] font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">Live Telemetry</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {dashboardData?.recentAuditLogs && dashboardData.recentAuditLogs.length > 0 ? (
                  dashboardData.recentAuditLogs.map((log: any) => (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-50/90 border border-slate-200 rounded-2xl flex items-center justify-between text-xs font-mono hover:border-purple-200 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold">
                          {log.action}
                        </span>
                        <span className="text-slate-700 truncate max-w-xs font-medium">{log.entity_id || log.details || 'Action performed'}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-500 text-xs font-mono">
                    No recent platform audit entries recorded.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ORGANIZATIONS */}
      {activeTab === 'organizations' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/95 p-4 rounded-3xl border border-slate-200/90 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={orgSearch}
                onChange={(e) => setOrgSearch(e.target.value)}
                placeholder="Search organizations or slug..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={orgStatusFilter}
                onChange={(e) => setOrgStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspended</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <button
                onClick={loadOrganizations}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-mono font-bold text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOrgs ? 'animate-spin' : ''}`} />
                <span>Filter</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {organizations.map((org) => (
              <div
                key={org.id}
                className="bg-white/95 p-5 rounded-3xl border border-slate-200/90 hover:border-purple-300 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="font-bold text-sm text-slate-900">{org.name}</h3>
                    <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                      /{org.slug}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase ${
                        org.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : org.status === 'trial'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {org.status || 'active'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-600">
                    <span>Plan: <strong className="text-cyan-700 font-bold uppercase">{org.subscriptionPlan || org.plan || 'Starter'}</strong></span>
                    <span>•</span>
                    <span>Students: <strong className="text-slate-900">{org.studentCount || 0}</strong></span>
                    <span>•</span>
                    <span>Staff: <strong className="text-slate-900">{org.staffCount || 0}</strong></span>
                    <span>•</span>
                    <span>Campuses: <strong className="text-slate-900">{org.campusCount || 1}</strong></span>
                    <span>•</span>
                    <span>Onboarding: <strong className="text-emerald-700 font-bold">Step {org.onboardingStep || 16}/16 ({org.onboardingStatus || 'active'})</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-center">
                  <button
                    onClick={() => handleLaunchSchool(org)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                    title="Launch School ERP"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Launch ERP</span>
                  </button>

                  <button
                    onClick={() => {
                      setSupportTargetOrgId(org.id);
                      setShowSupportModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                    title="Launch Authorized Support Access"
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-600" />
                    <span>Safe Support Access</span>
                  </button>

                  <select
                    value={org.status || 'active'}
                    onChange={(e) => handleUpdateOrgStatus(org.id, e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono text-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="active">Set Active</option>
                    <option value="trial">Set Trial</option>
                    <option value="suspended">Set Suspended</option>
                    <option value="archived">Set Archived</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: SCHOOLS DIRECTORY */}
      {activeTab === 'schools' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between bg-white/95 p-4 rounded-3xl border border-slate-200/90 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={schoolSearch}
                onChange={(e) => setSchoolSearch(e.target.value)}
                placeholder="Search schools by name or code..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              onClick={loadSchools}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-mono font-bold text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSchools ? 'animate-spin' : ''}`} />
              <span>Refresh Directory</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schools.map((sch) => (
              <div key={sch.id} className="bg-white/95 p-5 rounded-3xl border border-slate-200/90 hover:border-purple-300 shadow-sm hover:shadow-md space-y-3 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{sch.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">Org: {sch.organizationName}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-mono text-xs font-bold border border-purple-200">
                    {sch.schoolCode}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 bg-purple-50/50 rounded-2xl border border-purple-100 text-center text-xs font-mono">
                  <div>
                    <div className="text-slate-500 text-[10px] font-bold">STUDENTS</div>
                    <div className="text-slate-900 font-black text-base">{sch.studentCount}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px] font-bold">STAFF</div>
                    <div className="text-slate-900 font-black text-base">{sch.staffCount}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px] font-bold">CAMPUSES</div>
                    <div className="text-slate-900 font-black text-base">{sch.campusesCount}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs font-mono pt-1 text-slate-600">
                  <span>Session: <strong className="text-slate-900">{sch.currentSession}</strong></span>
                  <span>Plan: <strong className="text-amber-700 font-bold uppercase">{sch.subscriptionPlan}</strong></span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleLaunchSchool(sch)}
                    className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-105 text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Launch School ERP</span>
                  </button>
                  <button
                    onClick={() => {
                      setSupportTargetOrgId(sch.organizationId);
                      setShowSupportModal(true);
                    }}
                    className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Safe Support Impersonation"
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-600" />
                    <span>Support</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* TAB: USER GOVERNANCE */}
      {activeTab === 'users' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between bg-white/95 p-4 rounded-3xl border border-slate-200/90 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Platform User Directory & Role Governance</h3>
              <p className="text-xs text-slate-500 font-mono">Enforce SuperAdmin vs School Admin security segregation.</p>
            </div>
            <button
              onClick={loadUsers}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-mono font-bold text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin' : ''}`} />
              <span>Refresh Users</span>
            </button>
          </div>

          <div className="bg-white/95 rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Assigned Role</th>
                  <th className="p-3.5">Tenant Organization</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isSuper = u.role === 'superadmin' || u.email === 'superadmin@dakshora.ai';
                  return (
                    <tr key={u.id} className="hover:bg-purple-50/50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                        {isSuper ? '👑' : '👤'} {u.name}
                      </td>
                      <td className="p-3.5 text-slate-600 font-medium">{u.email}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isSuper
                              ? 'bg-amber-100 text-amber-800 border border-amber-300 uppercase'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 font-medium">{u.organizationName || 'Global Platform'}</td>
                      <td className="p-3.5 text-right">
                        {!isSuper && (
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer"
                          >
                            <option value="school-admin">School Admin</option>
                            <option value="teacher">Teacher</option>
                            <option value="account">Accountant</option>
                            <option value="counselor">Counselor</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: SUBSCRIPTIONS & MRR (CENTRALIZED LINK) */}
      {activeTab === 'subscriptions' && (
        <div className="bg-white/95 p-8 rounded-3xl border border-slate-200/90 shadow-sm text-center space-y-4 max-w-xl mx-auto my-6 animate-in fade-in duration-200">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-xs">
            <CreditCard className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-900 font-mono">Subscriptions & MRR Master Hub</h3>
            <p className="text-xs text-slate-500 font-mono leading-relaxed">
              All multi-tenant school subscriptions, plan tier assignments, MRR analytics, and commercial quotation engines are centralized in the Master <strong>Billing & MRR Hub</strong>.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigateToTab ? onNavigateToTab('billing') : setActiveTab('overview')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 text-white font-bold text-xs font-mono shadow-lg shadow-rose-500/20 hover:brightness-110 cursor-pointer transition-all flex items-center gap-2 mx-auto"
            >
              <span>Open Master Billing & MRR Hub</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB: USAGE TELEMETRY */}
      {activeTab === 'telemetry' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-cyan-50/90 via-white to-blue-50/90 p-5 rounded-3xl border border-cyan-200/90 shadow-md space-y-1">
              <div className="text-xs font-mono text-cyan-950 font-bold uppercase tracking-wider mb-1">DAKSHORA AI INVOCATIONS</div>
              <div className="text-3xl font-black text-cyan-700 font-mono">{telemetry?.platformTotals?.aiRequests || 142}</div>
              <div className="text-[11px] font-mono text-slate-500 mt-1">Chat & CBSE Lesson Planning requests</div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/90 p-5 rounded-3xl border border-emerald-200/90 shadow-md space-y-1">
              <div className="text-xs font-mono text-emerald-950 font-bold uppercase tracking-wider mb-1">DISPATCHED COMMUNICATIONS</div>
              <div className="text-3xl font-black text-emerald-700 font-mono">{telemetry?.platformTotals?.communicationMessages || 18}</div>
              <div className="text-[11px] font-mono text-slate-500 mt-1">SMS, In-App & Circular notifications</div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/90 p-5 rounded-3xl border border-indigo-200/90 shadow-md space-y-1">
              <div className="text-xs font-mono text-indigo-950 font-bold uppercase tracking-wider mb-1">STORAGE UTILIZATION</div>
              <div className="text-3xl font-black text-indigo-700 font-mono">{telemetry?.platformTotals?.storageGB || 1.45} GB</div>
              <div className="text-[11px] font-mono text-slate-500 mt-1">Homework, receipts, student report cards</div>
            </div>
          </div>

          <div className="bg-white/95 p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Tenants Ranked by Student Volume</h3>
            <div className="space-y-2">
              {telemetry?.topTenantsByStudents?.map((item: any, idx: number) => (
                <div key={item.organizationId} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs font-mono hover:border-purple-200 transition-all">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 text-[10px] font-bold">
                      #{idx + 1}
                    </span>
                    <span className="text-slate-900 font-bold">{item.name}</span>
                    <span className="text-purple-700 text-[10px] font-bold uppercase bg-purple-50 px-2 py-0.5 rounded border border-purple-200">({item.plan})</span>
                  </div>
                  <div className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">{item.studentCount} Students</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: ONBOARDING MONITOR */}
      {activeTab === 'onboarding' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between bg-white/95 p-4 rounded-3xl border border-slate-200/90 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Multi-Tenant Onboarding Progress Tracker</h3>
              <p className="text-xs text-slate-500 font-mono">Monitor tenant onboarding checklist, step progress, and activations.</p>
            </div>
            <button
              onClick={loadOnboarding}
              className="px-3.5 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-xs font-mono font-bold text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOnboarding ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {onboardingList.map((onb) => (
              <div key={onb.organizationId} className="bg-white/95 p-5 rounded-3xl border border-slate-200/90 hover:border-fuchsia-300 shadow-sm hover:shadow-md space-y-3 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{onb.organizationName}</h3>
                    <p className="text-xs text-slate-500 font-mono">Onboarding ID: {onb.onboardingId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        onb.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {onb.status}
                    </span>
                    <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">{onb.progressPercentage}% Complete</span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-fuchsia-500 to-pink-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${onb.progressPercentage}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center text-xs font-mono text-slate-600">
                  <span>Current Step: <strong className="text-slate-900">Step {onb.currentStep} of 16</strong> ({onb.completedStepsCount} Completed)</span>
                  <span>Started: {new Date(onb.startedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: SUPPORT CENTER & IMPERSONATION */}
      {activeTab === 'support' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-amber-300 bg-gradient-to-r from-amber-50 via-white to-orange-50 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">Safe Support Access (Authorized Impersonation)</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                Operate securely inside a customer tenant with explicit operational justification. Every support session is audited, time-bounded to 60 minutes, and triggers a persistent top banner.
              </p>
            </div>

            <button
              onClick={() => setShowSupportModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-105 text-white font-bold text-xs shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
            >
              <Shield className="w-4 h-4" />
              <span>Launch Support Session</span>
            </button>
          </div>

          {/* Support Tickets Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <LifeBuoy className="w-4 h-4 text-cyan-600" />
                  <span>Cross-Tenant Support Tickets ({tickets.length})</span>
                </h3>
                <button
                  onClick={loadTickets}
                  className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs shadow-sm transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTickets ? 'animate-spin text-cyan-600' : ''}`} />
                </button>
              </div>

              <div className="space-y-3">
                {tickets.map((t) => (
                  <div key={t.id} className="bg-white/95 p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{t.subject}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            t.priority === 'urgent'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : t.priority === 'high'
                              ? 'bg-orange-50 text-orange-700 border border-orange-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          t.status === 'resolved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-sans">{t.description}</p>

                    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-500">
                      <span>Org: <strong className="text-slate-800">{t.organization_name}</strong> • By: {t.created_by}</span>
                      <div className="flex items-center gap-2 mt-1 sm:mt-0">
                        {t.status !== 'resolved' && (
                          <button
                            onClick={() => handleUpdateTicketStatus(t.id, 'resolved')}
                            className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-[10px] font-semibold transition-all"
                          >
                            Mark Resolved
                          </button>
                        )}
                        {t.status === 'open' && (
                          <button
                            onClick={() => handleUpdateTicketStatus(t.id, 'in_progress')}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[10px] font-semibold transition-all"
                          >
                            In Progress
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Create New Ticket */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white/95 p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>Log Support Incident</span>
                </h3>

                <form onSubmit={handleCreateTicket} className="space-y-3 text-xs font-mono">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Target Tenant</label>
                    <select
                      value={newTicketOrgId}
                      onChange={(e) => setNewTicketOrgId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                    >
                      {organizations.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Subject</label>
                    <input
                      type="text"
                      value={newTicketSubject}
                      onChange={(e) => setNewTicketSubject(e.target.value)}
                      placeholder="e.g. Report Card Grade Format issue"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Priority</label>
                    <select
                      value={newTicketPriority}
                      onChange={(e) => setNewTicketPriority(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Description</label>
                    <textarea
                      value={newTicketDesc}
                      onChange={(e) => setNewTicketDesc(e.target.value)}
                      placeholder="Details of client request..."
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isCreatingTicket}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-105 text-white font-bold shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isCreatingTicket ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>Record Support Ticket</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: BROADCAST NOTICES */}
      {activeTab === 'broadcast' && (
        <div className="space-y-5 max-w-2xl mx-auto">
          <div className="bg-white/95 p-6 rounded-2xl border border-indigo-100 shadow-md space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Platform Broadcast Communication</h3>
                <p className="text-xs text-slate-500">
                  Dispatch global platform notices, scheduled downtime alerts, or CBSE circular alerts to all school administrators.
                </p>
              </div>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">Announcement Title *</label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. Scheduled Maintenance Window Notice"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">Target Audience</label>
                  <select
                    value={broadcastAudience}
                    onChange={(e) => setBroadcastAudience(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  >
                    <option value="all_org_admins">All Organization Admins</option>
                    <option value="all_teachers">All Academic Staff</option>
                    <option value="all_users">All SaaS Platform Users</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">Urgency Level</label>
                  <select
                    value={broadcastPriority}
                    onChange={(e) => setBroadcastPriority(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  >
                    <option value="normal">Normal Information</option>
                    <option value="urgent">Urgent Announcement</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">Broadcast Message Content *</label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Enter full notice body..."
                  rows={5}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSendingBroadcast}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSendingBroadcast ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{isSendingBroadcast ? 'Dispatching...' : 'Dispatch Broadcast Notice'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB: SUBSYSTEM HEALTH */}
      {activeTab === 'health' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 via-white to-purple-50 p-4 rounded-2xl border border-indigo-100 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="text-sm font-bold text-slate-900">Platform Subsystem Latencies & Health</h3>
              </div>
              <p className="text-xs text-slate-600 font-mono">Live diagnostics across API gateway, multi-tenant Postgres, and AI engine.</p>
            </div>
            <button
              onClick={loadHealth}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-xs font-mono font-semibold text-slate-700 border border-slate-200 shadow-sm flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHealth ? 'animate-spin text-indigo-600' : ''}`} />
              <span>Ping Subsystems</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {healthStatus?.subsystems &&
              Object.entries(healthStatus.subsystems).map(([key, sub]) => (
                <div key={key} className="bg-white/95 p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-800 uppercase">{key}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                      {sub.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-mono">{sub.message}</p>
                  <div className="text-[10px] text-slate-500 font-mono font-semibold">Response Latency: <span className="text-indigo-600 font-bold">{sub.latencyMs} ms</span></div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB: PLATFORM SETTINGS & FEATURE FLAGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-3xl mx-auto">
          {/* Two-Factor Authentication (TOTP 2FA) Card */}
          <div className="bg-white/95 p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${
                  mfaEnabled
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : 'bg-amber-50 text-amber-600 border-amber-200'
                }`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">Two-Factor Authentication (TOTP 2FA)</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                      mfaEnabled
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {mfaEnabled ? 'Active (AAL2)' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-sans mt-0.5">
                    Requires a 6-digit TOTP code from Google Authenticator, Microsoft Authenticator, or 1Password on every sign-in.
                  </p>
                </div>
              </div>

              <div>
                {mfaEnabled ? (
                  <button
                    onClick={handleDisableMfa}
                    disabled={isUnenrollingMfa}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {isUnenrollingMfa ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    <span>Disable 2FA</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartMfaEnroll}
                    disabled={isLoadingMfa}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {isLoadingMfa ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                    <span>Enable 2FA (TOTP)</span>
                  </button>
                )}
              </div>
            </div>

            {mfaEnabled ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-mono text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>SuperAdmin account is cryptographically protected with RFC 6238 Time-based One-Time Passwords (AAL2).</span>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-mono text-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Two-Factor Authentication is currently recommended for all administrative accounts to protect against credential stuffing.</span>
              </div>
            )}
          </div>

          {/* SuperAdmin Password Management Card */}
          <div className="bg-white/95 p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Change SuperAdmin Password (पासवर्ड बदलें)</h3>
                  <p className="text-xs text-slate-500 font-sans mt-0.5">
                    Update the root cryptographic password for this SuperAdmin session.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
                🔒 Root Authority
              </span>
            </div>

            <form onSubmit={handleChangeSuperAdminPassword} className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-700 font-semibold mb-1">
                    New SuperAdmin Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      value={newSuperAdminPwd}
                      onChange={(e) => setNewSuperAdminPwd(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white pr-9"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-700 font-semibold mb-1">
                    Confirm New Password *
                  </label>
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    value={confirmSuperAdminPwd}
                    onChange={(e) => setConfirmSuperAdminPwd(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <span className="text-[11px] font-mono text-slate-500">
                  Must be at least 6 characters. SuperAdmin login still strictly requires 2-Step OTP.
                </span>
                <button
                  type="submit"
                  disabled={isUpdatingPwd || !newSuperAdminPwd}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:brightness-110 text-white shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingPwd ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                  <span>Save New Password 🔑</span>
                </button>
              </div>
            </form>
          </div>

          {/* Maintenance Mode Card */}
          <div className="bg-white/95 p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Global Maintenance Mode</h3>
                <p className="text-xs text-slate-500 font-sans">When active, restricts customer ERP operations for safe migrations.</p>
              </div>
              <button
                onClick={handleToggleMaintenance}
                disabled={isSavingSettings}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  settings?.maintenance_mode
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                {settings?.maintenance_mode ? '🚨 Maintenance Active (Turn Off)' : 'Enable Maintenance'}
              </button>
            </div>
            {settings?.maintenance_mode && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-mono text-rose-800">
                Notice: {settings.maintenance_message}
              </div>
            )}
          </div>

          {/* Feature Flags Grid */}
          <div className="bg-white/95 p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Global Feature Flags</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {settings?.feature_flags &&
                Object.entries(settings.feature_flags).map(([key, enabled]) => (
                  <div
                    key={key}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono text-xs font-bold text-slate-800 uppercase">{key}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Global module access</div>
                    </div>
                    <button
                      onClick={() => handleToggleFeatureFlag(key)}
                      disabled={isSavingSettings}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
                        enabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {enabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: DIRECT CLIENT SETUP (LEGACY / HANDOVER KIT) */}
      {activeTab === 'client_setup' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white/95 rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  <span>Onboard New School Client (User ID & Password)</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-500">POST /api/auth/create-client-user</span>
              </div>

              <form onSubmit={handleCreateClientAccount} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-700 font-semibold mb-1.5">School / Academy Name *</label>
                    <input
                      type="text"
                      value={clientSchoolName}
                      onChange={(e) => setClientSchoolName(e.target.value)}
                      placeholder="e.g. St. Xavier High School"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-700 font-semibold mb-1.5">Principal / Contact Name</label>
                    <input
                      type="text"
                      value={clientPrincipalName}
                      onChange={(e) => setClientPrincipalName(e.target.value)}
                      placeholder="Dr. Rajesh Sharma"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-700 font-semibold mb-1.5">Client User ID (Email) *</label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="principal@school.edu.in"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-cyan-700 font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-mono text-slate-700 font-semibold">Set Initial Password *</label>
                      <button
                        type="button"
                        onClick={() => setClientPassword(`School@${Math.floor(1000 + Math.random() * 9000)}!`)}
                        className="text-[10px] text-emerald-600 hover:underline font-mono font-semibold"
                      >
                        Auto-Generate
                      </button>
                    </div>
                    <input
                      type="text"
                      value={clientPassword}
                      onChange={(e) => setClientPassword(e.target.value)}
                      placeholder="School@2026!"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-amber-700 font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-700 font-semibold mb-1.5">Access Role & Permissions</label>
                  <select
                    value={clientRole}
                    onChange={(e) => setClientRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  >
                    <option value="school-admin">School Principal / Org Admin (Full Admissions, CRM & AI)</option>
                    <option value="teacher">Teacher / Academic Staff (AI Lesson Planner & Doubts Only)</option>
                    <option value="counselor">Admissions Counselor (Leads & Inquiries View Only)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isCreatingClient}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isCreatingClient ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>{isCreatingClient ? 'Registering...' : 'Create Client Account & Generate Handover Kit'}</span>
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            {createdClientCard && (
              <div className="bg-emerald-50/70 p-6 rounded-2xl border border-emerald-200 shadow-sm space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm font-mono">
                    <FileCheck className="w-4 h-4" />
                    <span>Client Handover Kit Ready!</span>
                  </div>
                  <button
                    onClick={() =>
                      copyText(
                        `🏫 School Client Handover Kit:\n• School Name: ${createdClientCard.schoolName}\n• Login Portal: ${createdClientCard.portalUrl}\n• User ID: ${createdClientCard.email}\n• Password: ${createdClientCard.password}\n• Role: ${createdClientCard.role}`,
                        'HANDOVER'
                      )
                    }
                    className="text-xs text-emerald-700 hover:underline flex items-center gap-1 font-mono font-semibold"
                  >
                    {copiedId === 'HANDOVER' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy Handover Text</span>
                  </button>
                </div>

                <div className="space-y-2 text-xs font-mono text-slate-700 bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                  <div><span className="text-slate-500">School Client:</span> <span className="text-slate-900 font-bold">{createdClientCard.schoolName}</span></div>
                  <div><span className="text-slate-500">User ID / Email:</span> <span className="text-cyan-700 font-bold">{createdClientCard.email}</span></div>
                  <div><span className="text-slate-500">Password:</span> <span className="text-amber-700 font-bold">{createdClientCard.password}</span></div>
                  <div><span className="text-slate-500">Assigned Role:</span> <span className="text-emerald-700 font-bold">{createdClientCard.role}</span></div>
                  <div><span className="text-slate-500">Login Surface:</span> <span className="text-indigo-700 font-semibold">Customer Portal</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. SAFE SUPPORT MODE ACTIVATION MODAL */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-6 rounded-3xl border border-amber-200 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Safe Support Impersonation Mode</h3>
                  <p className="text-[11px] text-slate-500 font-mono">Explicit Authorization & Time-Bounded Access</p>
                </div>
              </div>
              <button
                onClick={() => setShowSupportModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleStartSupportSession} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">Target School / Organization *</label>
                <select
                  value={supportTargetOrgId}
                  onChange={(e) => setSupportTargetOrgId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  required
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">Legitimate Operational Reason *</label>
                <textarea
                  value={supportReason}
                  onChange={(e) => setSupportReason(e.target.value)}
                  placeholder="e.g. Investigating reported fee structure discrepancy query #TICK-101 requested by school principal"
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  required
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed font-sans">
                🛡️ <strong>Safety Guarantee:</strong> A session token valid for 60 minutes will be generated and an immutable audit entry <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-900">SUPPORT_SESSION_STARTED</code> will be written. A high-visibility top banner will remain active across the platform.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSupportModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-mono text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isStartingSupport}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-105 text-white font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  {isStartingSupport ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                  <span>Activate Support Mode</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MFA ENROLLMENT SETUP MODAL */}
      {showMfaEnrollModal && mfaEnrollData && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 rounded-3xl border border-emerald-200 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Setup Two-Factor Authentication</h3>
                  <p className="text-[11px] text-slate-500 font-mono">Scan QR code in your Authenticator App</p>
                </div>
              </div>
              <button
                onClick={() => setShowMfaEnrollModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <div className="text-center space-y-3">
              {mfaEnrollData.qrCode ? (
                <div className="inline-block p-3 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm">
                  <img
                    src={mfaEnrollData.qrCode}
                    alt="2FA QR Code"
                    className="w-44 h-44 object-contain mx-auto"
                  />
                </div>
              ) : null}

              <div className="space-y-1">
                <p className="text-xs text-slate-600 font-mono">Or enter secret key manually:</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-mono text-slate-800 tracking-wider font-bold">
                    {mfaEnrollData.secret}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyText(mfaEnrollData.secret, 'MFA_SECRET')}
                    className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
                    title="Copy Secret"
                  >
                    {copiedId === 'MFA_SECRET' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleConfirmMfaSetup} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-700 font-semibold mb-1.5 text-center">
                  Enter 6-Digit Code from App to Confirm
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoFocus
                  value={mfaVerifyCode}
                  onChange={(e) => setMfaVerifyCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full bg-slate-50 border border-emerald-300 rounded-xl px-4 py-2.5 text-center text-lg font-mono tracking-widest text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowMfaEnrollModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-mono cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingMfaSetup || mfaVerifyCode.length !== 6}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-bold text-xs font-mono shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isVerifyingMfaSetup ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Confirm & Activate 2FA</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

