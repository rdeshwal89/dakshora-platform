import React, { useState, useEffect } from 'react';
import {
  Building2,
  GraduationCap,
  Plus,
  RefreshCw,
  Users,
  Shield,
  Layers,
  ArrowUpRight,
  Check,
  Search,
  Sparkles,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  UserCheck,
  XCircle,
  AlertCircle,
  Calendar,
  ExternalLink,
  Copy,
  Key,
  Lock,
  Power,
  PowerOff,
  Sliders,
  Settings,
  Edit3,
  ShieldAlert,
  Archive,
  Globe,
  FileText,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { OrganizationRecord } from '../types';
import {
  fetchOrganizations,
  createOrganization,
  onboardSchoolInstitution,
  updateOrganizationStatus,
  updateOrganizationDetails,
  archiveOrganization,
  resendSchoolAdminAccess
} from '../services/api';

export interface OnboardingApplicationRecord {
  id: string;
  refId: string;
  principalName: string;
  schoolName: string;
  email: string;
  phone: string;
  board: string;
  city: string;
  students: string;
  notes?: string;
  status: 'pending_verification' | 'contacted_interested' | 'onboarded' | 'rejected';
  submittedAt: string;
}

const DEFAULT_ONBOARDING_REQUESTS: OnboardingApplicationRecord[] = [
  {
    id: 'req-89478',
    refId: 'DK-REQ-89478',
    principalName: 'Dr. Rajesh Sharma',
    schoolName: 'Tagore Public Senior Secondary Academy',
    email: 'dakshora.ai@gmail.com',
    phone: '8947838668',
    board: 'CBSE / RBSE Rajasthan',
    city: 'Jaipur, Rajasthan',
    students: '500 - 1500 Students',
    notes: 'Requested Dakshora ERP with 30-Sec Attendance & CBSE 2026 Question Paper Generator.',
    status: 'pending_verification',
    submittedAt: 'Today, 11:15 AM'
  },
  {
    id: 'req-31209',
    refId: 'DK-REQ-31209',
    principalName: 'Sr. Maria D\'Souza',
    schoolName: 'St. Mary\'s Convent High School',
    email: 'principal@stmarys.edu.in',
    phone: '9820114522',
    board: 'ICSE Board',
    city: 'Pune, Maharashtra',
    students: '1500 - 3000 Students',
    notes: 'Interested in School Bus GPS tracking and online fee challan with UPI.',
    status: 'contacted_interested',
    submittedAt: 'Yesterday, 04:30 PM'
  }
];

interface OrganizationsHubProps {
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  onLaunchOnboarding?: (orgId: string) => void;
  onNavigateToErp?: (orgId?: string) => void;
}

export const OrganizationsHub: React.FC<OrganizationsHubProps> = ({ onShowToast, onLaunchOnboarding, onNavigateToErp }) => {
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [orgStatusFilter, setOrgStatusFilter] = useState<'all' | 'active' | 'suspended' | 'trial' | 'archived'>('all');

  // Tenant School Management State
  const [managingOrg, setManagingOrg] = useState<OrganizationRecord | null>(null);
  const [managingTab, setManagingTab] = useState<'overview' | 'profile' | 'security'>('overview');
  const [editForm, setEditForm] = useState({
    name: '',
    plan: 'growth',
    board: 'CBSE',
    contact_email: '',
    contact_phone: '',
    city: '',
    state: '',
    mrr_inr: 12500
  });
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [confirmDeactivateModal, setConfirmDeactivateModal] = useState<OrganizationRecord | null>(null);
  const [copiedTenantId, setCopiedTenantId] = useState(false);

  // Institutional Onboarding Requests State (SuperAdmin Approval)
  const [onboardingRequests, setOnboardingRequests] = useState<OnboardingApplicationRecord[]>([]);
  const [reqFilter, setReqFilter] = useState<'all' | 'pending_verification' | 'contacted_interested' | 'onboarded'>('all');

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [plan, setPlan] = useState('starter');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Onboarding Modal State
  const [onboardSuccessModal, setOnboardSuccessModal] = useState<any | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  // Resend / Grant Access Modal
  const [resendModal, setResendModal] = useState<{
    org: OrganizationRecord;
    email: string;
    principalName: string;
    phone: string;
  } | null>(null);
  const [resendForm, setResendForm] = useState({ email: '', principalName: '', phone: '', customPassword: '' });
  const [isResending, setIsResending] = useState(false);
  const [resendResult, setResendResult] = useState<any | null>(null);

  const handleOpenResendModal = (org: OrganizationRecord) => {
    setResendForm({
      email: (org as any).contact_email || (org as any).email || '',
      principalName: (org as any).principal_name || (org as any).principalName || '',
      phone: (org as any).contact_phone || (org as any).phone || '',
      customPassword: ''
    });
    setResendResult(null);
    setResendModal({
      org,
      email: (org as any).contact_email || (org as any).email || '',
      principalName: (org as any).principal_name || '',
      phone: (org as any).contact_phone || ''
    });
  };

  const handleResendAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendModal) return;
    if (!resendForm.email.trim()) {
      onShowToast('error', 'Email Required', 'Principal email is required to grant access.');
      return;
    }
    setIsResending(true);
    setResendResult(null);
    try {
      const res = await resendSchoolAdminAccess({
        organizationId: resendModal.org.id,
        email: resendForm.email.trim(),
        principalName: resendForm.principalName.trim() || 'Principal',
        phone: resendForm.phone.trim(),
        newPassword: resendForm.customPassword.trim() || undefined,
      });
      if (res.data?.success) {
        setResendResult(res.data);
        onShowToast('success', 'Access Granted & Credentials Sent ✅', res.data.message);
      } else {
        onShowToast('error', 'Failed', res.data?.message || 'Could not reset access.');
      }
    } catch (err: any) {
      onShowToast('error', 'Error', err.message);
    } finally {
      setIsResending(false);
    }
  };

  const handleOpenManageOrg = (org: OrganizationRecord) => {
    setManagingOrg(org);
    setManagingTab('overview');
    setEditForm({
      name: org.name || '',
      plan: org.plan || 'growth',
      board: (org as any).board || 'CBSE',
      contact_email: (org as any).contact_email || (org as any).email || '',
      contact_phone: (org as any).contact_phone || (org as any).phone || '',
      city: (org as any).city || 'Jaipur',
      state: (org as any).state || 'Rajasthan',
      mrr_inr: (org as any).mrr_inr !== undefined ? Number((org as any).mrr_inr) : (org.plan === 'enterprise' ? 24999 : org.plan === 'growth' ? 12500 : 4999)
    });
  };

  const handleToggleStatus = async (org: OrganizationRecord, targetStatus?: string) => {
    const current = (org.status || 'active').toLowerCase();
    const nextStatus = targetStatus || (current === 'active' ? 'suspended' : 'active');
    setIsUpdatingStatus(org.id);

    // Optimistic UI update: instantly update local react state so user gets immediate visual feedback
    setOrganizations((prev) =>
      prev.map((o) => (o.id === org.id ? { ...o, status: nextStatus } : o))
    );
    if (managingOrg && managingOrg.id === org.id) {
      setManagingOrg((prev) => (prev ? { ...prev, status: nextStatus } : null));
    }

    try {
      const res = await updateOrganizationStatus(org.id, nextStatus);
      if (res.data?.success) {
        onShowToast(
          nextStatus === 'active' ? 'success' : 'info',
          `School ${nextStatus === 'active' ? 'Activated ✅' : 'Deactivated / Suspended 🔒'}`,
          res.data.message || `Tenant '${org.name}' is now ${nextStatus.toUpperCase()}.`
        );
        await loadOrganizations();
      } else {
        // Rollback on failure
        setOrganizations((prev) =>
          prev.map((o) => (o.id === org.id ? { ...o, status: current } : o))
        );
        if (managingOrg && managingOrg.id === org.id) {
          setManagingOrg((prev) => (prev ? { ...prev, status: current } : null));
        }
        onShowToast('error', 'Status Update Failed', res.data?.message || 'Server error');
      }
    } catch (err: any) {
      // Rollback on error
      setOrganizations((prev) =>
        prev.map((o) => (o.id === org.id ? { ...o, status: current } : o))
      );
      if (managingOrg && managingOrg.id === org.id) {
        setManagingOrg((prev) => (prev ? { ...prev, status: current } : null));
      }
      onShowToast('error', 'Status Update Error', err.message);
    } finally {
      setIsUpdatingStatus(null);
      setConfirmDeactivateModal(null);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingOrg) return;
    setIsSavingDetails(true);
    try {
      const res = await updateOrganizationDetails(managingOrg.id, editForm);
      if (res.data?.success) {
        onShowToast('success', 'School Tenant Saved 💾', `Updated settings for '${editForm.name}'.`);
        await loadOrganizations();
        setManagingOrg((prev) => (prev ? { ...prev, ...editForm } : null));
      } else {
        onShowToast('error', 'Save Failed', res.data?.message);
      }
    } catch (err: any) {
      onShowToast('error', 'Save Error', err.message);
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleArchiveOrg = async (org: OrganizationRecord) => {
    if (!window.confirm(`Are you sure you want to archive '${org.name}'? The school will be deactivated.`)) return;
    try {
      const res = await archiveOrganization(org.id);
      if (res.data?.success) {
        onShowToast('info', 'School Archived 📦', `'${org.name}' has been archived.`);
        await loadOrganizations();
        setManagingOrg(null);
      }
    } catch (err: any) {
      onShowToast('error', 'Archive Error', err.message);
    }
  };

  // Load Onboarding Requests from LocalStorage + Defaults
  const loadOnboardingRequests = () => {
    try {
      const stored = localStorage.getItem('dakshora_onboarding_requests');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge avoiding duplicates by id/refId
          const existingIds = new Set(parsed.map((p: any) => p.id || p.refId));
          const merged = [...parsed];
          DEFAULT_ONBOARDING_REQUESTS.forEach((def) => {
            if (!existingIds.has(def.id) && !existingIds.has(def.refId)) {
              merged.push(def);
            }
          });
          setOnboardingRequests(merged);
          return;
        }
      }
    } catch {
      // fallback
    }
    setOnboardingRequests(DEFAULT_ONBOARDING_REQUESTS);
  };

  const loadOrganizations = async () => {
    setLoading(true);
    try {
      const res = await fetchOrganizations();
      if (res.data.success && Array.isArray(res.data.organizations)) {
        setOrganizations(res.data.organizations);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
    loadOnboardingRequests();
  }, []);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]/g, '-')) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]/g, '-'));
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      onShowToast('error', 'Validation Error', 'Organization Name and Slug are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createOrganization({ name: name.trim(), slug: slug.trim(), plan });
      if (res.data.success) {
        onShowToast('success', 'Organization Created! 🏢', `Tenant: ${name}`);
        setName('');
        setSlug('');
        loadOrganizations();
      } else {
        onShowToast('error', 'Creation Failed', res.data.message || 'Could not create organization');
      }
    } catch (err: any) {
      onShowToast('error', 'Network Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // SuperAdmin Onboarding Action 1: Mark Contacted
  const handleMarkContacted = (id: string) => {
    const updated = onboardingRequests.map((r) =>
      r.id === id || r.refId === id ? { ...r, status: 'contacted_interested' as const } : r
    );
    setOnboardingRequests(updated);
    localStorage.setItem('dakshora_onboarding_requests', JSON.stringify(updated));
    onShowToast('info', 'Principal Contacted 📞', 'Marked as Verified & Interested in Dakshora ERP.');
  };

  // SuperAdmin Onboarding Action 2: Onboard School (1-Click Provision)
  const handleApproveAndOnboard = async (req: OnboardingApplicationRecord) => {
    setIsSubmitting(true);
    try {
      const res = await onboardSchoolInstitution({
        schoolName: req.schoolName,
        principalName: req.principalName,
        email: req.email,
        phone: req.phone,
        board: req.board,
        city: req.city,
        plan: 'growth',
        notes: req.notes
      });

      if (res.data && res.data.success) {
        setOnboardSuccessModal(res.data);

        const updated = onboardingRequests.map((r) =>
          r.id === req.id || r.refId === req.refId ? { ...r, status: 'onboarded' as const } : r
        );
        setOnboardingRequests(updated);
        localStorage.setItem('dakshora_onboarding_requests', JSON.stringify(updated));

        // Immediately prepend the new organization into state for instantaneous reactivity
        const newOrgData = res.data.organization as OrganizationRecord | undefined;
        if (newOrgData) {
          setOrganizations((prev) => {
            const exists = prev.some((o) => o.id === newOrgData.id);
            return exists ? prev : [newOrgData, ...prev];
          });
        }

        // Refresh live organizations catalog from server
        await loadOrganizations();

        onShowToast(
          'success',
          'School Onboarded Successfully! 🏫🎉',
          `Official Tenant created for ${req.schoolName}. Principal credentials provisioned.`
        );
      } else {
        onShowToast('error', 'Onboarding Failed', res.data?.message || 'Could not complete onboarding.');
      }
    } catch (err: any) {
      onShowToast('error', 'Network Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // SuperAdmin Onboarding Action 3: Reject / Archive
  const handleRejectRequest = (id: string) => {
    const updated = onboardingRequests.map((r) =>
      r.id === id || r.refId === id ? { ...r, status: 'rejected' as const } : r
    );
    setOnboardingRequests(updated);
    localStorage.setItem('dakshora_onboarding_requests', JSON.stringify(updated));
    onShowToast('info', 'Application Archived', 'Request marked as rejected.');
  };

  const filteredOrgs = organizations.filter((o) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = o.name.toLowerCase().includes(term) || o.slug.toLowerCase().includes(term);
    if (!matchesSearch) return false;
    if (orgStatusFilter === 'all') return true;
    const orgStatus = (o.status || 'active').toLowerCase();
    if (orgStatusFilter === 'suspended') {
      return orgStatus === 'suspended' || orgStatus === 'deactivated';
    }
    return orgStatus === orgStatusFilter;
  });

  const filteredRequests = onboardingRequests.filter((r) => {
    if (reqFilter === 'all') return true;
    return r.status === reqFilter;
  });

  const pendingCount = onboardingRequests.filter((r) => r.status === 'pending_verification').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Organizations & Institutional Onboarding</h2>
          </div>
          <p className="text-xs text-slate-400">
            Verify prospective school applications, onboard verified institutions, and manage multi-tenant workspaces.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              loadOrganizations();
              loadOnboardingRequests();
            }}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh Workspace</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🏫 SECTION 1: INSTITUTIONAL ONBOARDING REQUESTS & SUPERADMIN APPROVAL */}
      {/* ========================================================================= */}
      <div className="glass-panel rounded-2xl p-6 border border-emerald-500/30 bg-slate-950/70 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Institutional Onboarding Requests & Approval (स्कूल ऑनबोर्डिंग आवेदन)
                </h3>
                {pendingCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                    {pendingCount} Awaiting Verification
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Principals / Trustees submit requests via the Onboarding window. SuperAdmin contacts, verifies affiliation, and onboards them.
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            {[
              { id: 'all', label: 'All Requests' },
              { id: 'pending_verification', label: `Pending (${pendingCount})` },
              { id: 'contacted_interested', label: 'Contacted' },
              { id: 'onboarded', label: 'Onboarded' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setReqFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  reqFilter === tab.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="py-8 text-center text-xs font-mono text-slate-500 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
            No onboarding applications in this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 sm:p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs font-mono"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-emerald-400 font-bold text-sm sm:text-base">
                      {req.schoolName}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-bold">
                      {req.board}
                    </span>
                    <span className="text-slate-500 text-[11px]">{req.refId}</span>

                    {/* Status Pill */}
                    {req.status === 'pending_verification' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        ⏳ Verification Pending
                      </span>
                    )}
                    {req.status === 'contacted_interested' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                        📞 Contacted & Interested
                      </span>
                    )}
                    {req.status === 'onboarded' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        ✅ Onboarded & Active
                      </span>
                    )}
                    {req.status === 'rejected' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        ❌ Declined
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-300 text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <span className="text-slate-500">Principal:</span>
                      <strong className="text-white">{req.principalName}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-emerald-400" />
                      <a href={`tel:+91${req.phone}`} className="text-emerald-400 font-bold hover:underline">
                        +91 {req.phone}
                      </a>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-cyan-400" />
                      <a href={`mailto:${req.email}`} className="text-cyan-300 hover:underline">
                        {req.email}
                      </a>
                    </span>
                    <span>•</span>
                    <span className="text-slate-400">City: {req.city}</span>
                    <span>•</span>
                    <span className="text-slate-400">Strength: {req.students}</span>
                    <span>•</span>
                    <span className="text-slate-500">{req.submittedAt}</span>
                  </div>

                  {req.notes && (
                    <p className="text-[11px] text-slate-400 italic bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                      "{req.notes}"
                    </p>
                  )}
                </div>

                {/* SuperAdmin Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {req.status === 'pending_verification' && (
                    <button
                      onClick={() => handleMarkContacted(req.id)}
                      className="px-3 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Mark that Dakshora team has called and verified the principal"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Contacted / Verified</span>
                    </button>
                  )}

                  {req.status !== 'onboarded' && (
                    <button
                      onClick={() => handleApproveAndOnboard(req)}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                      title="1-Click Provision Official School Tenant and Admin Account"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Onboard School 🏫</span>
                    </button>
                  )}

                  {req.status === 'onboarded' && (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Live Tenant Active</span>
                    </span>
                  )}

                  {req.status !== 'rejected' && req.status !== 'onboarded' && (
                    <button
                      onClick={() => handleRejectRequest(req.id)}
                      className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/30 text-slate-500 hover:text-rose-400 transition-all cursor-pointer"
                      title="Decline or Archive Request"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 🏢 SECTION 2: MANUAL ORGANIZATION CREATION & ACTIVE TENANCIES */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Create Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Create New Organization Directly</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">SuperAdmin Direct Provision</span>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Organization / School Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. DPS Heritage Global"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Tenant Slug URL <span className="text-rose-400">*</span>
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-slate-900 border border-r-0 border-slate-800 rounded-l-xl text-xs font-mono text-slate-500">
                    dakshora.app/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="dps-heritage"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-r-xl px-3 py-2.5 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Subscription Tier
                </label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="starter">Starter (Free Community)</option>
                  <option value="growth">Growth (Pro AI & CBSE Compliant)</option>
                  <option value="enterprise">Enterprise (Multi-Site Dedicated)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>{isSubmitting ? 'Creating Org...' : 'Register Tenant Organization'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Organizations List (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by school name or slug..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                {[
                  { id: 'all', label: `All (${organizations.length})` },
                  { id: 'active', label: `Active (${organizations.filter(o => !o.status || o.status === 'active').length})` },
                  { id: 'suspended', label: `Suspended (${organizations.filter(o => o.status === 'suspended' || o.status === 'deactivated').length})` },
                  { id: 'trial', label: `Trial (${organizations.filter(o => o.status === 'trial').length})` }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setOrgStatusFilter(tab.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                      orgStatusFilter === tab.id
                        ? tab.id === 'suspended'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : tab.id === 'active'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredOrgs.length === 0 ? (
              <div className="py-8 text-center text-xs font-mono text-slate-500 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                No organizations match this filter. Register a school or switch the filter tab.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrgs.map((org) => {
                  const currentStatus = (org.status || 'active').toLowerCase();
                  const isSuspended = currentStatus === 'suspended' || currentStatus === 'deactivated';
                  const isProcessing = isUpdatingStatus === org.id;

                  return (
                    <div
                      key={org.id}
                      className={`p-4 rounded-xl border transition-all space-y-3 text-xs font-mono ${
                        isSuspended
                          ? 'bg-rose-950/20 border-rose-900/40 hover:border-rose-500/50'
                          : 'bg-slate-950/80 border-slate-800/80 hover:border-indigo-500/30'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Building2 className={`w-4 h-4 ${isSuspended ? 'text-rose-400' : 'text-indigo-400'}`} />
                            <span className="font-bold text-white text-sm">{org.name}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-bold uppercase">
                              {org.plan || 'starter'}
                            </span>
                            {(org as any).board && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 text-slate-300 border border-slate-700">
                                {(org as any).board}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-slate-400 text-[11px]">
                            <span>Slug: <code className="text-indigo-300">/{org.slug}</code></span>
                            <span>•</span>
                            <span className="text-slate-500 font-mono text-[10px] truncate max-w-[140px]" title={org.id}>
                              ID: {org.id.slice(0, 8)}...
                            </span>
                            <span>•</span>
                            <span className="text-emerald-400 font-semibold">
                              ₹{((org as any).mrr_inr ? Number((org as any).mrr_inr).toLocaleString() : (org.plan === 'enterprise' ? '24,999' : org.plan === 'growth' ? '12,500' : '4,999'))}/mo
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="self-start sm:self-center">
                          {isSuspended ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-400 border border-rose-500/40 flex items-center gap-1.5 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                              <span>SUSPENDED / DEACTIVATED</span>
                            </span>
                          ) : currentStatus === 'trial' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                              <span>TRIAL PERIOD</span>
                            </span>
                          ) : currentStatus === 'archived' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900 text-slate-400 border border-slate-700 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              <span>ARCHIVED</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/70 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              <span>ACTIVE TENANCY</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tenant Action Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* 1-Click Deactivate / Reactivate Button */}
                          {isSuspended ? (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(org, 'active')}
                              disabled={isProcessing}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                              title="Reactivate full institutional access"
                            >
                              <Power className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                              <span>{isProcessing ? 'Activating...' : 'Reactivate School (सक्रिय करें)'}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeactivateModal(org)}
                              disabled={isProcessing}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                              title="Temporarily deactivate / suspend school login & portal access"
                            >
                              <PowerOff className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                              <span>{isProcessing ? 'Updating...' : 'Deactivate (सस्पेंड करें)'}</span>
                            </button>
                          )}

                          {/* Manage Tenant Drawer Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenManageOrg(org)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-200 hover:text-white font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Manage tenant plan, details, and security controls"
                          >
                            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Manage Tenant (प्रबंधन)</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* 🔑 Grant / Resend Access Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenResendModal(org)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 text-amber-300 font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                            title="Reset password and resend login credentials to principal"
                          >
                            <Key className="w-3.5 h-3.5 text-amber-400" />
                            <span>Grant / Resend Access</span>
                          </button>

                          {/* 16-Step Setup Wizard */}
                          {onLaunchOnboarding && (
                            <button
                              type="button"
                              onClick={() => onLaunchOnboarding(org.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-[11px] text-indigo-300 font-bold flex items-center gap-1 transition-all cursor-pointer"
                              title="Open 16-step Setup Wizard for this School"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Setup Wizard</span>
                            </button>
                          )}

                          {/* Open ERP */}
                          {onNavigateToErp && (
                            <button
                              type="button"
                              onClick={() => onNavigateToErp(org.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/30 text-[11px] text-emerald-300 font-bold flex items-center gap-1 transition-all cursor-pointer"
                              title="Open Active ERP Workspace"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Open ERP</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Onboarding Success & Credentials Provisioning Modal */}
      {onboardSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">School Onboarded & Activated! 🏫</h3>
                  <p className="text-xs text-slate-400 font-mono">Multi-Tenant Subsystem Initialized</p>
                </div>
              </div>
              <button
                onClick={() => setOnboardSuccessModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="text-slate-400 text-[11px]">School Institution</div>
                <div className="text-sm font-bold text-white">{onboardSuccessModal.organization?.name}</div>
                <div className="text-[11px] text-indigo-400 flex items-center gap-2">
                  <span>Tenant ID:</span>
                  <code className="text-slate-300">{onboardSuccessModal.tenantId}</code>
                </div>
              </div>

              {onboardSuccessModal.credentials && (
                <div className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-indigo-400" /> Principal Admin Credentials
                    </span>
                    <button
                      onClick={() => {
                        const credsText = `DAKSHORA ERP LOGIN\nSchool: ${onboardSuccessModal.organization?.name}\nEmail: ${onboardSuccessModal.credentials.email}\nPassword: ${onboardSuccessModal.credentials.initialPassword}\nPortal: https://dakshora.co.in`;
                        navigator.clipboard.writeText(credsText);
                        setCopiedCreds(true);
                        setTimeout(() => setCopiedCreds(false), 2000);
                      }}
                      className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                    >
                      {copiedCreds ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCreds ? 'Copied!' : 'Copy Credentials'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Login Email:</span>
                      <span className="text-white font-bold">{onboardSuccessModal.credentials.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Temporary Password:</span>
                      <span className="text-amber-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                        {onboardSuccessModal.credentials.initialPassword}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Assigned Role:</span>
                      <span className="text-emerald-400 font-bold">School Principal / Admin</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Web Subdomain:</span>
                      <span className="text-cyan-400 font-bold">/{onboardSuccessModal.organization?.slug}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="text-emerald-400 font-bold text-xs">17 Modules</div>
                  <div className="text-slate-400">Bootstrapped</div>
                </div>
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="text-indigo-400 font-bold text-xs">2026-27</div>
                  <div className="text-slate-400">Academic Session</div>
                </div>
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="text-cyan-400 font-bold text-xs">Live CMS</div>
                  <div className="text-slate-400">Template Bound</div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
              <button
                onClick={() => setOnboardSuccessModal(null)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-mono text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Done & Return to Catalog</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔑 MODAL: GRANT / RESEND PRINCIPAL ACCESS (Access Reset & Credential Re-Send) */}
      {/* ========================================================================= */}
      {resendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                  <Key className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Grant / Resend Principal Access</h3>
                  <p className="text-xs text-slate-400 font-mono">{resendModal.org.name}</p>
                </div>
              </div>
              <button
                onClick={() => { setResendModal(null); setResendResult(null); }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer text-lg leading-none"
              >✕</button>
            </div>

            {/* Info Banner */}
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/20 text-xs text-amber-200">
              <p className="font-bold mb-1">🔑 Principal Ka Access Reset Karein</p>
              <p className="text-amber-300/80">Yeh action principal ka password reset karega aur nayi credentials WhatsApp, SMS aur Email se bhejega. Purana password immediately invalid ho jaayega.</p>
            </div>

            {!resendResult ? (
              <form onSubmit={handleResendAccess} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Principal Email <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={resendForm.email}
                    onChange={e => setResendForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="principal@school.edu.in"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all"
                  />
                </div>

                {/* Principal Name */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Principal / Contact Name</label>
                  <input
                    type="text"
                    value={resendForm.principalName}
                    onChange={e => setResendForm(p => ({ ...p, principalName: e.target.value }))}
                    placeholder="Dr. Rajesh Sharma"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition-all"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Mobile (WhatsApp + SMS)</label>
                  <input
                    type="tel"
                    value={resendForm.phone}
                    onChange={e => setResendForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="9876543210"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition-all"
                  />
                </div>

                {/* Custom Password (optional) */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Custom Password <span className="text-slate-500">(optional — auto-generated if blank)</span>
                  </label>
                  <input
                    type="text"
                    value={resendForm.customPassword}
                    onChange={e => setResendForm(p => ({ ...p, customPassword: e.target.value }))}
                    placeholder="Leave blank for auto: Dakshora@XXXX!"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition-all font-mono"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setResendModal(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResending}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-amber-500/20 disabled:opacity-60"
                  >
                    {isResending ? (
                      <><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>Processing…</span></>
                    ) : (
                      <><Key className="w-3.5 h-3.5" /><span>Reset & Send Credentials</span></>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* SUCCESS RESULT VIEW */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Access Reset Successful! ✅</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center p-2 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400">Login Email:</span>
                      <span className="text-white font-bold font-mono">{resendResult.credentials?.email}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-900 rounded-xl border border-amber-500/30">
                      <span className="text-slate-400">New Password:</span>
                      <span className="text-amber-400 font-bold font-mono text-base tracking-wider">{resendResult.credentials?.newPassword}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400">Portal URL:</span>
                      <a href="https://dakshora.co.in" target="_blank" rel="noreferrer" className="text-cyan-400 font-bold underline">dakshora.co.in</a>
                    </div>
                  </div>

                  {/* Notification Status */}
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] pt-1">
                    {[
                      { label: 'WhatsApp', sent: resendResult.notifications?.whatsappSent, icon: '💬' },
                      { label: 'SMS', sent: resendResult.notifications?.smsSent, icon: '📱' },
                      { label: 'Email', sent: resendResult.notifications?.emailSent, icon: '📧' },
                    ].map(n => (
                      <div key={n.label} className={`p-2 rounded-lg border ${n.sent ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300' : 'bg-slate-950 border-slate-700 text-slate-500'}`}>
                        <div className="text-base">{n.icon}</div>
                        <div className="font-bold">{n.label}</div>
                        <div>{n.sent ? 'Sent ✓' : 'Unavailable'}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/20 text-xs text-blue-200">
                  <strong>Share with Principal:</strong> "DAKSHORA 2.0 portal par login karein — dakshora.co.in — Email: {resendResult.credentials?.email}, Password: {resendResult.credentials?.newPassword}"
                </div>

                <button
                  onClick={() => { setResendModal(null); setResendResult(null); }}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer transition-all"
                >
                  Done ✓
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🏢 MODAL: MANAGE TENANT SCHOOL (प्रबंधन एवं डीएक्टिवेशन कंट्रोल) */}
      {/* ========================================================================= */}
      {managingOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                    (managingOrg.status || 'active').toLowerCase() === 'suspended'
                      ? 'bg-rose-950/60 border-rose-500/40 text-rose-400'
                      : 'bg-indigo-950/60 border-indigo-500/40 text-indigo-400'
                  }`}
                >
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white font-mono">{managingOrg.name}</h3>
                    {(managingOrg.status || 'active').toLowerCase() === 'suspended' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-500/40">
                        SUSPENDED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    Multi-Tenant School ID: <code className="text-indigo-300">{managingOrg.id}</code>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setManagingOrg(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs inside Management Modal */}
            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setManagingTab('overview')}
                className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  managingTab === 'overview'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                Overview & Quick Launch
              </button>
              <button
                type="button"
                onClick={() => setManagingTab('profile')}
                className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  managingTab === 'profile'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                Edit School Details
              </button>
              <button
                type="button"
                onClick={() => setManagingTab('security')}
                className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  managingTab === 'security'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                Deactivate & Security
              </button>
            </div>

            {/* TAB 1: OVERVIEW & QUICK LAUNCH */}
            {managingTab === 'overview' && (
              <div className="space-y-4 font-mono text-xs">
                {/* Tenant ID Bar */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">
                      PostgreSQL tenant_id
                    </span>
                    <code className="text-indigo-300 font-bold text-xs">{managingOrg.id}</code>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(managingOrg.id);
                      setCopiedTenantId(true);
                      setTimeout(() => setCopiedTenantId(false), 2000);
                      onShowToast('info', 'Copied Tenant ID 📋', managingOrg.id);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedTenantId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedTenantId ? 'Copied' : 'Copy ID'}</span>
                  </button>
                </div>

                {/* Direct Launch Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {onNavigateToErp && (
                    <button
                      type="button"
                      onClick={() => {
                        setManagingOrg(null);
                        onNavigateToErp(managingOrg.id);
                      }}
                      className="p-3 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/40 text-left transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-indigo-400 mb-1">
                        <GraduationCap className="w-4 h-4" />
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                      <strong className="text-white text-xs block">School ERP</strong>
                      <span className="text-[10px] text-slate-400">Launch student & staff modules</span>
                    </button>
                  )}

                  {onLaunchOnboarding && (
                    <button
                      type="button"
                      onClick={() => {
                        setManagingOrg(null);
                        onLaunchOnboarding(managingOrg.id);
                      }}
                      className="p-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 text-left transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-purple-400 mb-1">
                        <Sparkles className="w-4 h-4" />
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                      <strong className="text-white text-xs block">Setup Wizard</strong>
                      <span className="text-[10px] text-slate-400">Review all 16 configuration steps</span>
                    </button>
                  )}

                  <a
                    href={`#/${managingOrg.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/40 text-left transition-all group block"
                  >
                    <div className="flex items-center justify-between text-cyan-400 mb-1">
                      <Globe className="w-4 h-4" />
                      <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                    <strong className="text-white text-xs block">Public Website</strong>
                    <span className="text-[10px] text-slate-400">/{managingOrg.slug} CMS Portal</span>
                  </a>
                </div>

                {/* Tenant Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Subscription Plan</span>
                    <strong className="text-indigo-400 uppercase text-xs">
                      {managingOrg.plan || 'growth'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Monthly MRR</span>
                    <strong className="text-emerald-400 text-xs">
                      ₹
                      {(managingOrg as any).mrr_inr
                        ? Number((managingOrg as any).mrr_inr).toLocaleString()
                        : '12,500'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Affiliation Board</span>
                    <strong className="text-white text-xs">{(managingOrg as any).board || 'CBSE'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Current Status</span>
                    <strong
                      className={`${
                        (managingOrg.status || 'active').toLowerCase() === 'suspended'
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      } uppercase text-xs`}
                    >
                      {managingOrg.status || 'active'}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: EDIT SCHOOL DETAILS */}
            {managingTab === 'profile' && (
              <form onSubmit={handleSaveDetails} className="space-y-4 font-mono text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      School / Organization Name
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Affiliation Board
                    </label>
                    <select
                      value={editForm.board}
                      onChange={(e) => setEditForm({ ...editForm, board: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="CBSE">CBSE (Central Board)</option>
                      <option value="ICSE">ICSE / CISCE</option>
                      <option value="RBSE">RBSE (Rajasthan Board)</option>
                      <option value="STATE">State Education Board</option>
                      <option value="CAMBRIDGE">Cambridge / IB International</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Subscription Plan
                    </label>
                    <select
                      value={editForm.plan}
                      onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="starter">Starter (₹4,999/mo)</option>
                      <option value="growth">Growth (₹12,500/mo)</option>
                      <option value="enterprise">Enterprise (₹24,999/mo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Monthly Recurring Revenue (₹ MRR)
                    </label>
                    <input
                      type="number"
                      value={editForm.mrr_inr}
                      onChange={(e) => setEditForm({ ...editForm, mrr_inr: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={editForm.contact_email}
                      onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={editForm.contact_phone}
                      onChange={(e) => setEditForm({ ...editForm, contact_phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="submit"
                    disabled={isSavingDetails}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSavingDetails ? 'Saving...' : 'Save School Details'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: DEACTIVATE & SECURITY CONTROL */}
            {managingTab === 'security' && (
              <div className="space-y-4 font-mono text-xs">
                {(managingOrg.status || 'active').toLowerCase() === 'suspended' ? (
                  <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 space-y-3">
                    <div className="flex items-center gap-2.5 text-emerald-400">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <strong className="text-sm">
                        Reactivate School Institution (स्कूल सक्रिय करें)
                      </strong>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      This school tenant is currently{' '}
                      <span className="text-rose-400 font-bold">SUSPENDED / DEACTIVATED</span>. School
                      Principal, faculty, and student logins are paused. Clicking reactivate will
                      immediately restore portal access for all school users.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(managingOrg, 'active')}
                      disabled={isUpdatingStatus === managingOrg.id}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                    >
                      <Power className="w-4 h-4" />
                      <span>RESTORE FULL SCHOOL ACCESS (REACTIVATE NOW)</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/40 space-y-3">
                    <div className="flex items-center gap-2.5 text-rose-400">
                      <ShieldAlert className="w-5 h-5 shrink-0" />
                      <strong className="text-sm">
                        Deactivate / Suspend School Tenant (स्कूल सस्पेंड करें)
                      </strong>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      Deactivating will immediately lock ERP access for this school's Principal,
                      teachers, parents, and students with an informative notification.
                    </p>
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[10px] space-y-1 text-slate-400">
                      <div>
                        ✓ All historical student records, attendance, and fee history remain{' '}
                        <strong className="text-emerald-400">100% safe & intact</strong> in PostgreSQL.
                      </div>
                      <div>✓ Multi-tenant Row Level Security (RLS) data isolation remains active.</div>
                      <div>✓ SuperAdmin can reactivate this school anytime with 1-click.</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(managingOrg, 'suspended')}
                      disabled={isUpdatingStatus === managingOrg.id}
                      className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                    >
                      <PowerOff className="w-4 h-4" />
                      <span>SUSPEND & DEACTIVATE SCHOOL ACCESS NOW</span>
                    </button>
                  </div>
                )}

                {/* Archive Option */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-200 block text-xs">Archive Tenant Organization</strong>
                    <span className="text-slate-500 text-[10px]">
                      Remove school from active operations catalog
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleArchiveOrg(managingOrg)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Archive School</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⚠️ MODAL: CONFIRM DEACTIVATION */}
      {/* ========================================================================= */}
      {confirmDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center">
                <PowerOff className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-mono">Confirm School Deactivation?</h3>
                <p className="text-xs text-slate-400 font-mono">Temporary Tenant Suspension</p>
              </div>
            </div>

            <p className="text-xs font-mono text-slate-300 leading-relaxed">
              Are you sure you want to deactivate{' '}
              <strong className="text-white font-bold">{confirmDeactivateModal.name}</strong>?
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
              <div>• Principal, Teacher & Student logins will be temporarily locked.</div>
              <div>• No student records or data will be deleted.</div>
              <div>• You can reactivate this school at any time with 1-click.</div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setConfirmDeactivateModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleToggleStatus(confirmDeactivateModal, 'suspended')}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <PowerOff className="w-3.5 h-3.5" />
                <span>Yes, Deactivate School</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
