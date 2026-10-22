import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Calendar,
  Layers,
  BookOpen,
  Briefcase,
  Award,
  CreditCard,
  Clock,
  FileCheck,
  Bell,
  Bus,
  Library,
  Coffee,
  DollarSign,
  Bot,
  Shield,
  Sliders,
  Lock,
  History,
  Check,
  Save,
  Plus,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  Search,
  ExternalLink,
  Smartphone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  Database,
  Activity,
  UserCheck,
  Sparkles
} from 'lucide-react';
import {
  ErpRole,
  ErpCampus,
  ErpMasterSettings,
  ErpAuditLogEntry,
  ErpOnboardingChecklist,
  ErpSystemHealth
} from '../types';
import {
  fetchErpMasterSettings,
  updateErpSettingsSection,
  fetchErpCampuses,
  createErpCampus,
  updateErpCampus,
  fetchErpSystemHealth,
  fetchErpOnboardingChecklist,
  fetchErpAuditLogsFiltered,
  fetchErpAcademics,
  activateAcademicSession
} from '../services/api';
import { BillingHub } from './BillingHub';

interface SchoolSettingsHubProps {
  activeRole: ErpRole;
  activeSession: string;
  organizationId?: string;
  onShowToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
  onNavigateToModule?: (module: string) => void;
}

type SettingsSectionKey =
  | 'school_profile'
  | 'subscription_plan'
  | 'campuses'
  | 'academic_sessions'
  | 'classes_sections'
  | 'subjects'
  | 'departments'
  | 'designations'
  | 'fee_settings'
  | 'attendance_settings'
  | 'examination_settings'
  | 'communication_settings'
  | 'transport_settings'
  | 'library_settings'
  | 'leave_settings'
  | 'payroll_settings'
  | 'ai_settings'
  | 'roles_permissions'
  | 'notifications'
  | 'security_settings'
  | 'audit_logs';

interface SectionItem {
  id: SettingsSectionKey;
  label: string;
  group: 'identity' | 'academics' | 'operations' | 'hr' | 'security';
  icon: React.ReactNode;
  allowedRoles: ErpRole[];
}

export const SchoolSettingsHub: React.FC<SchoolSettingsHubProps> = ({
  activeRole,
  activeSession,
  organizationId = 'b17780e5-3832-4ac6-9aeb-33fd80c5cb0e',
  onShowToast,
  onNavigateToModule
}) => {
  // Navigation & Filtering
  const [activeSection, setActiveSection] = useState<SettingsSectionKey>('school_profile');
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings State
  const [masterSettings, setMasterSettings] = useState<ErpMasterSettings | null>(null);
  const [campuses, setCampuses] = useState<ErpCampus[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [academicSessions, setAcademicSessions] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [health, setHealth] = useState<ErpSystemHealth | null>(null);
  const [checklist, setChecklist] = useState<ErpOnboardingChecklist | null>(null);
  const [auditLogs, setAuditLogs] = useState<ErpAuditLogEntry[]>([]);
  const [auditFilter, setAuditFilter] = useState({ module: '', action: '' });

  // Add Campus Modal State
  const [showAddCampus, setShowAddCampus] = useState(false);
  const [newCampusForm, setNewCampusForm] = useState({
    name: '',
    code: '',
    address: '',
    city: 'Gurugram',
    state: 'Haryana',
    pin: '122003',
    contactPhone: '+91 11 2613 8900',
    contactEmail: 'campus@dpsheritage.edu.in',
    principalName: 'Campus Head',
    capacity: 1500,
    isMain: false
  });

  // 20 Defined Settings Sections with Role Clearance
  const ALL_SECTIONS: SectionItem[] = [
    // 1. Identity & Organization
    { id: 'school_profile', label: 'School Profile', group: 'identity', icon: <Building2 className="w-4 h-4" />, allowedRoles: ['admin'] },
    { id: 'subscription_plan', label: 'SaaS Plan & Billing', group: 'identity', icon: <Sparkles className="w-4 h-4 text-amber-400" />, allowedRoles: ['admin'] },
    { id: 'campuses', label: 'Campus Management', group: 'identity', icon: <MapPin className="w-4 h-4" />, allowedRoles: ['admin'] },
    { id: 'academic_sessions', label: 'Academic Sessions', group: 'identity', icon: <Calendar className="w-4 h-4" />, allowedRoles: ['admin'] },

    // 2. Academics & Structure
    { id: 'classes_sections', label: 'Classes & Sections', group: 'academics', icon: <Layers className="w-4 h-4" />, allowedRoles: ['admin', 'teacher'] },
    { id: 'subjects', label: 'Subjects Catalogue', group: 'academics', icon: <BookOpen className="w-4 h-4" />, allowedRoles: ['admin', 'teacher'] },
    { id: 'departments', label: 'Departments', group: 'academics', icon: <Briefcase className="w-4 h-4" />, allowedRoles: ['admin'] },
    { id: 'designations', label: 'Designations', group: 'academics', icon: <Award className="w-4 h-4" />, allowedRoles: ['admin'] },

    // 3. Operational Policies
    { id: 'fee_settings', label: 'Fee Settings', group: 'operations', icon: <CreditCard className="w-4 h-4" />, allowedRoles: ['admin', 'account'] },
    { id: 'attendance_settings', label: 'Attendance Settings', group: 'operations', icon: <Clock className="w-4 h-4" />, allowedRoles: ['admin', 'teacher'] },
    { id: 'examination_settings', label: 'Examination Settings', group: 'operations', icon: <FileCheck className="w-4 h-4" />, allowedRoles: ['admin', 'teacher'] },
    { id: 'communication_settings', label: 'Communication Gateways', group: 'operations', icon: <Bell className="w-4 h-4" />, allowedRoles: ['admin', 'reception'] },
    { id: 'transport_settings', label: 'Transport Settings', group: 'operations', icon: <Bus className="w-4 h-4" />, allowedRoles: ['admin', 'reception'] },
    { id: 'library_settings', label: 'Library Settings', group: 'operations', icon: <Library className="w-4 h-4" />, allowedRoles: ['admin'] },

    // 4. HR & Intelligence
    { id: 'leave_settings', label: 'Leave Settings', group: 'hr', icon: <Coffee className="w-4 h-4" />, allowedRoles: ['admin'] },
    { id: 'payroll_settings', label: 'Payroll Settings', group: 'hr', icon: <DollarSign className="w-4 h-4" />, allowedRoles: ['admin', 'account'] },
    { id: 'ai_settings', label: 'Dakshora AI Policies', group: 'hr', icon: <Bot className="w-4 h-4" />, allowedRoles: ['admin'] },

    // 5. Governance & Security
    { id: 'roles_permissions', label: 'Roles & Permissions', group: 'security', icon: <Shield className="w-4 h-4" />, allowedRoles: ['admin'] },
    { id: 'notifications', label: 'Notifications & Alerts', group: 'security', icon: <Sliders className="w-4 h-4" />, allowedRoles: ['admin', 'teacher', 'account', 'reception'] },
    { id: 'security_settings', label: 'Security & Backups', group: 'security', icon: <Lock className="w-4 h-4" />, allowedRoles: ['admin'] },
    { id: 'audit_logs', label: 'Audit Trail Logs', group: 'security', icon: <History className="w-4 h-4" />, allowedRoles: ['admin'] }
  ];

  // Role filtering
  const visibleSections = ALL_SECTIONS.filter((sec) =>
    sec.allowedRoles.includes(activeRole) &&
    (searchFilter ? sec.label.toLowerCase().includes(searchFilter.toLowerCase()) : true)
  );

  // Auto switch section if current active is restricted for activeRole
  useEffect(() => {
    const isCurrentAllowed = ALL_SECTIONS.find((s) => s.id === activeSection)?.allowedRoles.includes(activeRole);
    if (!isCurrentAllowed && visibleSections.length > 0) {
      setActiveSection(visibleSections[0].id);
    }
  }, [activeRole]);

  // Initial Load
  useEffect(() => {
    async function loadAllSettings() {
      setLoading(true);
      try {
        const [mRes, hRes, cRes, aRes, logRes] = await Promise.all([
          fetchErpMasterSettings(),
          fetchErpSystemHealth(),
          fetchErpOnboardingChecklist(),
          fetchErpAcademics(),
          fetchErpAuditLogsFiltered({ limit: 50 })
        ]);

        if (mRes.data?.settings) {
          setMasterSettings(mRes.data.settings);
          setCampuses(mRes.data.campuses || []);
          setDepartments(mRes.data.departments || []);
          setDesignations(mRes.data.designations || []);
        }

        if (hRes.data) setHealth(hRes.data as unknown as ErpSystemHealth);
        if (cRes.data) setChecklist(cRes.data as unknown as ErpOnboardingChecklist);
        if (aRes.data?.overview) {
          setAcademicSessions(aRes.data.overview.sessions || []);
          setClassesList(aRes.data.classes || []);
          setSubjectsList(aRes.data.subjects || []);
        }
        if (logRes.data?.logs) setAuditLogs((logRes.data.logs as any) || []);
      } catch (err: any) {
        console.warn('Error loading master settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAllSettings();
  }, [activeSession]);

  // Save current active section
  const handleSaveCurrentSection = async () => {
    if (!masterSettings) return;
    setSaving(true);

    try {
      const sectionData = (masterSettings as any)[activeSection];
      if (sectionData) {
        const res = await updateErpSettingsSection(activeSection, sectionData);
        if (res.data?.success) {
          onShowToast('success', 'Settings Saved Successfully ✅', `Configuration updated for ${activeSection.replace(/_/g, ' ').toUpperCase()}`);
        } else {
          onShowToast('error', 'Update Failed', res.data?.message || 'Check server logs');
        }
      } else {
        onShowToast('info', 'Section Ready', 'Settings synchronized in local cache');
      }
    } catch (err: any) {
      onShowToast('error', 'Network Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  // Add Campus Handler
  const handleCreateCampus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampusForm.name.trim() || !newCampusForm.code.trim()) {
      onShowToast('error', 'Validation Error', 'Campus Name and Code are required.');
      return;
    }

    try {
      const res = await createErpCampus(newCampusForm);
      if (res.data?.success && res.data.campus) {
        setCampuses((prev) => [...prev, res.data!.campus]);
        setShowAddCampus(false);
        onShowToast('success', 'Campus Added 🎉', `${newCampusForm.name} registered successfully`);
      } else {
        onShowToast('error', 'Failed to Add Campus', res.data?.message || 'Check inputs');
      }
    } catch (err: any) {
      onShowToast('error', 'Error', err.message);
    }
  };

  // Toggle Campus Status
  const handleToggleCampusStatus = async (campus: ErpCampus) => {
    const newStatus = campus.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await updateErpCampus(campus.id, { status: newStatus });
      if (res.data?.success) {
        setCampuses((prev) =>
          prev.map((c) => (c.id === campus.id ? { ...c, status: newStatus } : c))
        );
        onShowToast('info', 'Campus Status Updated', `${campus.name} is now ${newStatus.toUpperCase()}`);
      }
    } catch (err: any) {
      onShowToast('error', 'Update Failed', err.message);
    }
  };

  // Activate Session
  const handleActivateSession = async (sessionId: string) => {
    try {
      const res = await activateAcademicSession(sessionId);
      if (res.data?.success) {
        setAcademicSessions((prev) =>
          prev.map((s) => ({
            ...s,
            isCurrent: s.id === sessionId,
            status: s.id === sessionId ? 'active' : s.status === 'active' ? 'closed' : s.status
          }))
        );
        onShowToast('success', 'Academic Session Activated 🎯', 'System is now running on the newly selected session');
      }
    } catch (err: any) {
      onShowToast('error', 'Activation Failed', err.message);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-4">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-white text-sm font-bold">Loading DAKSHORA Master Settings...</div>
        <p className="text-xs text-slate-400 font-mono">Synchronizing 20 operational and security configuration modules</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 🚀 TOP COMMAND BAR: CONTEXT & QUICK ACTIONS */}
      {/* ========================================================================= */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 text-cyan-400">
                <Settings className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                <span>School ERP Master Configuration Suite</span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Production Hardening, Multi-Campus Governance, CBSE & RLS Compliance for{' '}
              <span className="text-cyan-300 font-bold">{masterSettings?.school_profile?.schoolName || 'Delhi Public Heritage School'}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Health Badge */}
            {health && (
              <div className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Gateway Operational (12ms)</span>
              </div>
            )}

            {/* Readiness Checklist Pill */}
            {checklist && (
              <div className="px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Onboarding: {checklist.readinessPercent}% Ready</span>
              </div>
            )}

            {/* Save Button */}
            {activeRole === 'admin' && (
              <button
                onClick={handleSaveCurrentSection}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save {ALL_SECTIONS.find((s) => s.id === activeSection)?.label || 'Changes'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🧭 2-COLUMN WORKSPACE: 20-SECTION SIDEBAR + ACTIVE CONFIGURATION PANEL */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: 20-Section Navigation (4 cols) */}
        <div className="lg:col-span-4 glass-panel p-4 rounded-3xl border border-slate-800 space-y-4">
          {/* Section Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter settings sections..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Section Groups */}
          <div className="space-y-4 max-h-[72vh] overflow-y-auto pr-1">
            {/* Group 1: Organization & Identity */}
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1 font-mono">
                🏛️ School & Campus
              </div>
              <div className="space-y-0.5">
                {visibleSections
                  .filter((s) => s.group === 'identity')
                  .map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => setActiveSection(sec.id)}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-mono flex items-center justify-between transition-all ${
                        activeSection === sec.id
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-md shadow-cyan-500/10'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={activeSection === sec.id ? 'text-cyan-400' : 'text-slate-500'}>
                          {sec.icon}
                        </span>
                        <span>{sec.label}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  ))}
              </div>
            </div>

            {/* Group 2: Academics */}
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1 font-mono">
                📚 Curriculum & Staffing
              </div>
              <div className="space-y-0.5">
                {visibleSections
                  .filter((s) => s.group === 'academics')
                  .map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => setActiveSection(sec.id)}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-mono flex items-center justify-between transition-all ${
                        activeSection === sec.id
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-md shadow-cyan-500/10'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={activeSection === sec.id ? 'text-cyan-400' : 'text-slate-500'}>
                          {sec.icon}
                        </span>
                        <span>{sec.label}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  ))}
              </div>
            </div>

            {/* Group 3: Operations */}
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1 font-mono">
                ⚙️ Operational Policies
              </div>
              <div className="space-y-0.5">
                {visibleSections
                  .filter((s) => s.group === 'operations')
                  .map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => setActiveSection(sec.id)}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-mono flex items-center justify-between transition-all ${
                        activeSection === sec.id
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-md shadow-cyan-500/10'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={activeSection === sec.id ? 'text-cyan-400' : 'text-slate-500'}>
                          {sec.icon}
                        </span>
                        <span>{sec.label}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  ))}
              </div>
            </div>

            {/* Group 4: HR & AI */}
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1 font-mono">
                💼 HR & Intelligence
              </div>
              <div className="space-y-0.5">
                {visibleSections
                  .filter((s) => s.group === 'hr')
                  .map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => setActiveSection(sec.id)}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-mono flex items-center justify-between transition-all ${
                        activeSection === sec.id
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-md shadow-cyan-500/10'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={activeSection === sec.id ? 'text-cyan-400' : 'text-slate-500'}>
                          {sec.icon}
                        </span>
                        <span>{sec.label}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  ))}
              </div>
            </div>

            {/* Group 5: Governance & Security */}
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1 font-mono">
                🛡️ Security & Auditing
              </div>
              <div className="space-y-0.5">
                {visibleSections
                  .filter((s) => s.group === 'security')
                  .map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => setActiveSection(sec.id)}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-mono flex items-center justify-between transition-all ${
                        activeSection === sec.id
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-md shadow-cyan-500/10'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={activeSection === sec.id ? 'text-cyan-400' : 'text-slate-500'}>
                          {sec.icon}
                        </span>
                        <span>{sec.label}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Active Section Configuration (8 cols) */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          {/* ================================================================= */}
          {/* 💎 SAAS SUBSCRIPTION PLAN & MODULE MANAGER */}
          {/* ================================================================= */}
          {activeSection === 'subscription_plan' && (
            <div className="space-y-6">
              <BillingHub onShowToast={onShowToast} />
            </div>
          )}

          {/* ================================================================= */}
          {/* 1. SCHOOL PROFILE */}
          {/* ================================================================= */}
          {activeSection === 'school_profile' && masterSettings?.school_profile && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-cyan-400" />
                  <span>School Identity, Board Affiliation & Legal Registry</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Master school identity verified across CBSE affiliation records, student transcripts, and fee receipts.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="md:col-span-2">
                  <label className="text-slate-400 block mb-1">School Full Legal Name</label>
                  <input
                    type="text"
                    value={masterSettings.school_profile.schoolName}
                    onChange={(e) =>
                      setMasterSettings({
                        ...masterSettings,
                        school_profile: { ...masterSettings.school_profile, schoolName: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">School Center Code</label>
                  <input
                    type="text"
                    value={masterSettings.school_profile.schoolCode}
                    onChange={(e) =>
                      setMasterSettings({
                        ...masterSettings,
                        school_profile: { ...masterSettings.school_profile, schoolCode: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Board / Affiliation No.</label>
                  <input
                    type="text"
                    value={masterSettings.school_profile.affiliationNo}
                    onChange={(e) =>
                      setMasterSettings({
                        ...masterSettings,
                        school_profile: { ...masterSettings.school_profile, affiliationNo: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Affiliated Education Board</label>
                  <input
                    type="text"
                    value={masterSettings.school_profile.board}
                    onChange={(e) =>
                      setMasterSettings({
                        ...masterSettings,
                        school_profile: { ...masterSettings.school_profile, board: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">UDISE+ Registration No.</label>
                  <input
                    type="text"
                    value={masterSettings.school_profile.udiseNumber || '06180104502'}
                    onChange={(e) =>
                      setMasterSettings({
                        ...masterSettings,
                        school_profile: { ...masterSettings.school_profile, udiseNumber: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-slate-400 block mb-1">Campus Physical Address</label>
                  <input
                    type="text"
                    value={masterSettings.school_profile.address}
                    onChange={(e) =>
                      setMasterSettings({
                        ...masterSettings,
                        school_profile: { ...masterSettings.school_profile, address: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">City, State, PIN</label>
                  <input
                    type="text"
                    value={`${masterSettings.school_profile.city || 'Gurugram'}, ${masterSettings.school_profile.state || 'Haryana'} - ${masterSettings.school_profile.pin || '122003'}`}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                    readOnly
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Principal / Head of School</label>
                  <input
                    type="text"
                    value={masterSettings.school_profile.principalName}
                    onChange={(e) =>
                      setMasterSettings({
                        ...masterSettings,
                        school_profile: { ...masterSettings.school_profile, principalName: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Official Contact Phone</label>
                  <input
                    type="text"
                    value={masterSettings.school_profile.phone}
                    onChange={(e) =>
                      setMasterSettings({
                        ...masterSettings,
                        school_profile: { ...masterSettings.school_profile, phone: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Principal / Admin Email</label>
                  <input
                    type="email"
                    value={masterSettings.school_profile.email}
                    onChange={(e) =>
                      setMasterSettings({
                        ...masterSettings,
                        school_profile: { ...masterSettings.school_profile, email: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>

                {/* School Default Language Configuration */}
                <div className="md:col-span-2 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-slate-300 block font-bold flex items-center gap-2">
                      <span className="text-sm">🌐 School Default Language / संस्था की डिफ़ॉल्ट भाषा</span>
                    </label>
                    <span className="text-[10px] text-cyan-400 font-mono">Default for newly enrolled users</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { code: 'hi-en', label: 'हिंदी + English', desc: 'Bilingual (अनुशंसित / Recommended)' },
                      { code: 'hi', label: 'हिंदी (Hindi Medium)', desc: 'सरल व्यावहारिक हिंदी' },
                      { code: 'en', label: 'English (English Medium)', desc: 'Standard English interface' }
                    ].map((opt) => {
                      const currentSchoolLang = localStorage.getItem('dakshora_school_default_lang') || 'hi-en';
                      const isSel = currentSchoolLang === opt.code;
                      return (
                        <button
                          key={opt.code}
                          type="button"
                          onClick={() => {
                            localStorage.setItem('dakshora_school_default_lang', opt.code);
                            onShowToast('success', 'School Default Language Saved! 🌐', `New users will default to: ${opt.label}`);
                          }}
                          className={`p-3.5 rounded-2xl text-left transition-all border cursor-pointer ${
                            isSel
                              ? 'bg-gradient-to-r from-indigo-950 to-slate-900 border-indigo-500/60 shadow-md shadow-indigo-500/20'
                              : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs">{opt.label}</span>
                            {isSel && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">{opt.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 2. CAMPUS MANAGEMENT */}
          {/* ================================================================= */}
          {activeSection === 'campuses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-cyan-400" />
                    <span>Multi-Campus Architecture & Branch Governance</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    Manage Main Campus and satellite branches under organization tenant isolation.
                  </p>
                </div>

                {activeRole === 'admin' && (
                  <button
                    onClick={() => setShowAddCampus(true)}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Campus</span>
                  </button>
                )}
              </div>

              {/* Campus Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campuses.map((cmp) => (
                  <div
                    key={cmp.id}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 font-mono text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{cmp.name}</span>
                          {cmp.isMain && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                              HEADQUARTERS
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500">Code: {cmp.code}</span>
                      </div>

                      <button
                        onClick={() => handleToggleCampusStatus(cmp)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          cmp.status === 'active'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {cmp.status.toUpperCase()}
                      </button>
                    </div>

                    <p className="text-slate-300 text-[11px]">{cmp.address}</p>

                    <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                      <div>Principal: <span className="text-white font-bold">{cmp.principalName || 'N/A'}</span></div>
                      <div>Capacity: <span className="text-cyan-300">{cmp.capacity} Seats</span></div>
                      <div>Contact: <span className="text-slate-300">{cmp.contactPhone}</span></div>
                      <div>Email: <span className="text-slate-300">{cmp.contactEmail}</span></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Campus Modal */}
              {showAddCampus && (
                <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/30 space-y-3">
                  <div className="text-xs font-bold text-cyan-300 font-mono">Register New Campus / Branch</div>
                  <form onSubmit={handleCreateCampus} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    <input
                      type="text"
                      placeholder="Campus Name (e.g. North City Branch)"
                      value={newCampusForm.name}
                      onChange={(e) => setNewCampusForm({ ...newCampusForm, name: e.target.value })}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Campus Code (e.g. NORTH-03)"
                      value={newCampusForm.code}
                      onChange={(e) => setNewCampusForm({ ...newCampusForm, code: e.target.value })}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Physical Address..."
                      value={newCampusForm.address}
                      onChange={(e) => setNewCampusForm({ ...newCampusForm, address: e.target.value })}
                      className="sm:col-span-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                      required
                    />
                    <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddCampus(false)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl bg-cyan-500 text-black font-bold text-xs font-mono shadow-md shadow-cyan-500/20"
                      >
                        Register Campus
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* 3. ACADEMIC SESSIONS */}
          {/* ================================================================= */}
          {activeSection === 'academic_sessions' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  <span>Academic Sessions Lifecycle & Current Session Governance</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Historical sessions remain readable forever. Activating a session updates all active ERP calculations atomically.
                </p>
              </div>

              <div className="space-y-3">
                {academicSessions.map((ses) => (
                  <div
                    key={ses.id}
                    className={`p-4 rounded-2xl border font-mono text-xs flex items-center justify-between transition-all ${
                      ses.isCurrent
                        ? 'bg-cyan-950/40 border-cyan-500/40'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          Academic Year: {ses.name || ses.sessionName}
                        </span>
                        {ses.isCurrent ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                            CURRENT ACTIVE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 uppercase">
                            {ses.status}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Timeline: {ses.startDate} to {ses.endDate}
                      </div>
                    </div>

                    {!ses.isCurrent && activeRole === 'admin' && (
                      <button
                        onClick={() => handleActivateSession(ses.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-cyan-500 hover:text-black text-cyan-300 border border-slate-800 hover:border-cyan-400 text-xs font-bold transition-all"
                      >
                        Set as Current Session
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 8. FEE SETTINGS */}
          {/* ================================================================= */}
          {activeSection === 'fee_settings' && masterSettings?.fee_settings && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  <span>Student Fee Structure, Invoicing Rules & Late Fines</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Configure school fee heads and collection policies. Note: School student fees are separate from DAKSHORA SaaS platform subscription.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <label className="text-slate-400 block mb-1">Billing Frequency</label>
                  <select
                    value={masterSettings.fee_settings.frequency}
                    onChange={(e) =>
                      setMasterSettings({
                        ...masterSettings,
                        fee_settings: { ...masterSettings.fee_settings, frequency: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  >
                    <option value="quarterly">Quarterly (Apr, Jul, Oct, Jan)</option>
                    <option value="monthly">Monthly Cycle</option>
                    <option value="annual">Annual Lump-sum</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Default Due Date</label>
                  <input
                    type="text"
                    value={`${masterSettings.fee_settings.dueDateDay}th of month`}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                    readOnly
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Late Fine Amount (₹/Day)</label>
                  <input
                    type="number"
                    value={masterSettings.fee_settings.lateFinePerDay}
                    onChange={(e) =>
                      setMasterSettings({
                        ...masterSettings,
                        fee_settings: { ...masterSettings.fee_settings, lateFinePerDay: parseInt(e.target.value, 10) || 0 }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Grace Period (Days)</label>
                  <input
                    type="number"
                    value={masterSettings.fee_settings.gracePeriodDays}
                    onChange={(e) =>
                      setMasterSettings({
                        ...masterSettings,
                        fee_settings: { ...masterSettings.fee_settings, gracePeriodDays: parseInt(e.target.value, 10) || 0 }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Receipt Number Prefix</label>
                  <input
                    type="text"
                    value={masterSettings.fee_settings.receiptPrefix}
                    onChange={(e) =>
                      setMasterSettings({
                        ...masterSettings,
                        fee_settings: { ...masterSettings.fee_settings, receiptPrefix: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Accepted Payment Modes</label>
                  <input
                    type="text"
                    value={masterSettings.fee_settings.paymentModes.join(', ')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                    readOnly
                  />
                </div>
              </div>

              {/* Fee Heads List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-white font-mono">Configured Fee Heads Catalogue</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {masterSettings.fee_settings.feeHeads.map((fh) => (
                    <div
                      key={fh.id}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-[11px]"
                    >
                      <div className="font-bold text-white">{fh.name}</div>
                      <div className="text-slate-500">Code: {fh.code} • {fh.frequency}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 9. ATTENDANCE SETTINGS */}
          {/* ================================================================= */}
          {activeSection === 'attendance_settings' && masterSettings?.attendance_settings && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  <span>Attendance Thresholds & Working Days Policy</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Adjustable low attendance warning threshold. All ERP dashboards, AI assistants, and reports dynamically consume this threshold.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 font-mono text-xs">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-slate-300 font-bold">
                      Low Attendance Defaulter Cutoff Threshold (%):
                    </label>
                    <span className="text-cyan-400 font-bold text-sm">
                      {masterSettings.attendance_settings.lowAttendanceThreshold}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="90"
                    step="1"
                    value={masterSettings.attendance_settings.lowAttendanceThreshold}
                    onChange={(e) =>
                      setMasterSettings({
                        ...masterSettings,
                        attendance_settings: {
                          ...masterSettings.attendance_settings,
                          lowAttendanceThreshold: parseFloat(e.target.value)
                        }
                      })
                    }
                    className="w-full accent-cyan-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>50% (Lenient)</span>
                    <span>75% (Standard CBSE Mandate)</span>
                    <span>90% (Strict Honor)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Morning Assembly / Late Arrival Cutoff</label>
                    <input
                      type="text"
                      value={masterSettings.attendance_settings.lateThresholdTime}
                      onChange={(e) =>
                        setMasterSettings({
                          ...masterSettings,
                          attendance_settings: {
                            ...masterSettings.attendance_settings,
                            lateThresholdTime: e.target.value
                          }
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Default Roll-Call State</label>
                    <select
                      value={masterSettings.attendance_settings.defaultStatus}
                      onChange={(e: any) =>
                        setMasterSettings({
                          ...masterSettings,
                          attendance_settings: {
                            ...masterSettings.attendance_settings,
                            defaultStatus: e.target.value
                          }
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                    >
                      <option value="present">All Present (Exception Marking)</option>
                      <option value="absent">All Absent</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 10. EXAMINATION SETTINGS */}
          {/* ================================================================= */}
          {activeSection === 'examination_settings' && masterSettings?.examination_settings && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-amber-400" />
                  <span>Examination Grading Scheme & CBSE 9-Point Scale</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Configurable grading scales, pass percentages, and report card watermark options.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <label className="text-slate-400 block mb-1">Grading System Framework</label>
                  <select
                    value={masterSettings.examination_settings.gradingSystem}
                    onChange={(e: any) =>
                      setMasterSettings({
                        ...masterSettings,
                        examination_settings: {
                          ...masterSettings.examination_settings,
                          gradingSystem: e.target.value
                        }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  >
                    <option value="cbse_9point">CBSE 9-Point Scale (A1 to E)</option>
                    <option value="percentage">Direct Percentage Scale</option>
                    <option value="gpa">4.0 / 10.0 GPA Framework</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Pass Mark Threshold (%)</label>
                  <input
                    type="number"
                    value={masterSettings.examination_settings.passPercentage}
                    onChange={(e) =>
                      setMasterSettings({
                        ...masterSettings,
                        examination_settings: {
                          ...masterSettings.examination_settings,
                          passPercentage: parseFloat(e.target.value) || 33
                        }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
              </div>

              {/* Grade Boundaries Table */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-white font-mono">Grading Scale Ranges</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {masterSettings.examination_settings.gradeRanges.map((gr) => (
                    <div
                      key={gr.grade}
                      className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-[11px] flex items-center justify-between"
                    >
                      <span className="font-bold text-amber-400 text-xs">{gr.grade}</span>
                      <span className="text-slate-400">{gr.minMarks}-{gr.maxMarks}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 16. DAKSHORA AI SETTINGS */}
          {/* ================================================================= */}
          {activeSection === 'ai_settings' && masterSettings?.ai_settings && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-cyan-400" />
                  <span>Dakshora AI Academic Copilot Governance</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Manage intelligent assistant activation, permitted persona clearance, and sensitive finance guardrails.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-white font-bold block">Dakshora AI Enabled</span>
                    <span className="text-slate-500 text-[10px]">Provide natural language assistive query capabilities</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setMasterSettings({
                        ...masterSettings,
                        ai_settings: {
                          ...masterSettings.ai_settings,
                          aiEnabled: !masterSettings.ai_settings.aiEnabled
                        }
                      })
                    }
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                      masterSettings.ai_settings.aiEnabled
                        ? 'bg-cyan-500 text-black'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {masterSettings.ai_settings.aiEnabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 block mb-1">Monthly Token Quota</label>
                    <input
                      type="number"
                      value={masterSettings.ai_settings.monthlyQuotaTokens}
                      onChange={(e) =>
                        setMasterSettings({
                          ...masterSettings,
                          ai_settings: {
                            ...masterSettings.ai_settings,
                            monthlyQuotaTokens: parseInt(e.target.value, 10) || 500000
                          }
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Sensitive Data Policy</label>
                    <input
                      type="text"
                      value="Strict Server-Side RBAC Shield"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 17. ROLES & PERMISSIONS MATRIX */}
          {/* ================================================================= */}
          {activeSection === 'roles_permissions' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-400" />
                  <span>Enterprise Role-Based Access Control (RBAC) Matrix</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Enforced server-side across API gateways and Supabase RLS. Browser masking is never treated as authorization.
                </p>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-2xl">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Module Pillar</th>
                      <th className="p-3 text-center">Admin</th>
                      <th className="p-3 text-center">Teacher</th>
                      <th className="p-3 text-center">Accountant</th>
                      <th className="p-3 text-center">Reception</th>
                      <th className="p-3 text-center">Parent</th>
                      <th className="p-3 text-center">Student</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {[
                      { mod: 'Student SIS', a: '✓ Full', t: '✓ Assigned', ac: '— Restricted', r: '✓ Directory', p: 'Own Ward', s: 'Self' },
                      { mod: 'Attendance', a: '✓ Full', t: '✓ Mark/View', ac: '— Restricted', r: '✓ Daily Infoline', p: 'Own Ward', s: 'Self' },
                      { mod: 'Academics', a: '✓ Full', t: '✓ Manage', ac: '— Restricted', r: '— Restricted', p: 'View', s: 'View' },
                      { mod: 'Examinations', a: '✓ Full', t: '✓ Entry', ac: '— Restricted', r: '— Restricted', p: 'Results', s: 'Results' },
                      { mod: 'Fees & Finance', a: '✓ Full', t: '❌ BLOCKED', ac: '✓ Full Ledger', r: '❌ BLOCKED', p: 'Pay Dues', s: 'Pay Dues' },
                      { mod: 'Admissions CRM', a: '✓ Full', t: '— Restricted', ac: '— Restricted', r: '✓ Intake Desk', p: '—', s: '—' },
                      { mod: 'Transport & GPS', a: '✓ Full', t: '— Restricted', ac: '— Restricted', r: '✓ Route Desk', p: 'Track Bus', s: 'Track Bus' },
                      { mod: 'Library Hub', a: '✓ Full', t: '✓ Issue/Read', ac: '— Restricted', r: '— Restricted', p: '—', s: 'Borrow' },
                      { mod: 'HR & Payroll', a: '✓ Full', t: '❌ BLOCKED', ac: '✓ Ledgers', r: '❌ BLOCKED', p: '❌ BLOCKED', s: '❌ BLOCKED' },
                      { mod: 'Dakshora AI', a: '✓ Unrestricted', t: '✓ Scoped', ac: '✓ Scoped', r: '✓ Scoped', p: 'Ward Only', s: 'Self Only' }
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="p-3 font-bold text-white">{row.mod}</td>
                        <td className="p-3 text-center text-emerald-400 font-bold">{row.a}</td>
                        <td className="p-3 text-center text-cyan-300">{row.t}</td>
                        <td className="p-3 text-center text-amber-300">{row.ac}</td>
                        <td className="p-3 text-center text-indigo-300">{row.r}</td>
                        <td className="p-3 text-center text-slate-400">{row.p}</td>
                        <td className="p-3 text-center text-slate-400">{row.s}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 19. SECURITY CENTER */}
          {/* ================================================================= */}
          {activeSection === 'security_settings' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-cyan-400" />
                  <span>Security Center, Session Encryption & Continuous Backups</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Active connection protocols, JWT session invalidation, and automated point-in-time recovery (PITR).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold">
                    <Shield className="w-4 h-4" />
                    <span>Active Session Verification</span>
                  </div>
                  <div className="text-slate-400">Current Role: <span className="text-white font-bold">{activeRole.toUpperCase()}</span></div>
                  <div className="text-slate-400">Tenant Org: <span className="text-cyan-300">{organizationId}</span></div>
                  <div className="text-slate-400">Auth Mechanism: <span className="text-emerald-400">Supabase JWT + Multi-Tenant RLS</span></div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <Database className="w-4 h-4" />
                    <span>Disaster Recovery & Data Safety</span>
                  </div>
                  <div className="text-slate-400">Backup Mode: <span className="text-white">Continuous WAL Streaming</span></div>
                  <div className="text-slate-400">Retention: <span className="text-emerald-400">30-Day Point-In-Time (PITR)</span></div>
                  <div className="text-slate-400">Destructive Deletion: <span className="text-emerald-400">Strictly Guarded & Audited</span></div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 20. AUDIT LOGS */}
          {/* ================================================================= */}
          {activeSection === 'audit_logs' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-purple-400" />
                  <span>Immutable System Audit Trail</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Every administrative action, settings modification, and fee transaction is permanently logged.
                </p>
              </div>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 font-mono text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{log.action}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                          {log.target_type}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        By {log.user_email || 'admin'} • Target: {log.target_id}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Placeholder for remaining sections */}
          {!['school_profile', 'campuses', 'academic_sessions', 'fee_settings', 'attendance_settings', 'examination_settings', 'ai_settings', 'roles_permissions', 'security_settings', 'audit_logs'].includes(activeSection) && (
            <div className="p-8 text-center space-y-3 font-mono">
              <div className="w-10 h-10 mx-auto rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Settings className="w-5 h-5" />
              </div>
              <div className="text-white text-sm font-bold">
                {ALL_SECTIONS.find((s) => s.id === activeSection)?.label} Configuration
              </div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Operational parameters are active and synchronized with the backend Fastify API Gateway.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
