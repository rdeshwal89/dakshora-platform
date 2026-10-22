import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Users,
  UserCheck,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  TrendingUp,
  Send,
  ShieldCheck,
  Globe,
  Phone,
  Mail,
  RotateCcw,
  DollarSign,
  MessageSquare,
  Check,
  X,
  UserPlus,
  Sparkles,
  Award,
  Layers,
  MessageCircle
} from 'lucide-react';
import {
  ErpAdmissionApplication,
  ErpAdmissionDocument,
  ErpAdmissionNote,
  ErpAdmissionTimelineEvent,
  ErpAdmissionOverview,
  ErpDuplicateStudentMatch
} from '../types';
import {
  fetchErpAdmissionsOverview,
  fetchErpAdmissions,
  fetchErpAdmissionById,
  createErpAdmission,
  updateAdmissionStatus,
  verifyErpAdmissionDocument,
  addErpAdmissionNote,
  checkErpAdmissionDuplicate,
  convertLeadToAdmission,
  confirmErpAdmission,
  captureLead,
  fetchLeads
} from '../services/api';

interface AdmissionsManagementHubProps {
  activeRole: string;
  activeSession: string;
  organizationId: string;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  onNavigateToModule?: (module: string) => void;
}

type TabType = 'overview' | 'pipeline' | 'entrance_test' | 'seat_matrix' | 'inquiries';
type PipelineViewMode = 'kanban' | 'table';

export const AdmissionsManagementHub: React.FC<AdmissionsManagementHubProps> = ({
  activeRole,
  activeSession,
  organizationId = 'b17780e5-3832-4ac6-9aeb-33fd80c5cb0e',
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('pipeline');
  const [pipelineView, setPipelineView] = useState<PipelineViewMode>('kanban');
  const [loading, setLoading] = useState<boolean>(true);

  // Data States
  const [overview, setOverview] = useState<ErpAdmissionOverview | null>(null);
  const [applications, setApplications] = useState<ErpAdmissionApplication[]>([]);
  const [crmLeads, setCrmLeads] = useState<any[]>([]);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSource, setFilterSource] = useState('all');

  // Drawer / Detail State
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [selectedAppDetail, setSelectedAppDetail] = useState<{
    admission: ErpAdmissionApplication;
    documents: ErpAdmissionDocument[];
    notes: ErpAdmissionNote[];
    timeline: ErpAdmissionTimelineEvent[];
    lead?: any;
    student?: any;
    feeDemand?: any;
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  // Modals
  const [showNewAppModal, setShowNewAppModal] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [appToConfirm, setAppToConfirm] = useState<ErpAdmissionApplication | null>(null);
  const [confirmGrade, setConfirmGrade] = useState<string>('Class 10');
  const [confirmSection, setConfirmSection] = useState<string>('A');
  const [duplicateMatches, setDuplicateMatches] = useState<ErpDuplicateStudentMatch[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState<boolean>(false);
  const [confirmingAdmission, setConfirmingAdmission] = useState<boolean>(false);

  // Document Reject Modal
  const [rejectDocTarget, setRejectDocTarget] = useState<ErpAdmissionDocument | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('');

  // Internal Note Input
  const [newNoteContent, setNewNoteContent] = useState<string>('');
  const [newInterviewScore, setNewInterviewScore] = useState<string>('');
  const [isAddingNote, setIsAddingNote] = useState<boolean>(false);

  // Website Lead Simulator Form
  const [simStudentName, setSimStudentName] = useState('');
  const [simParentEmail, setSimParentEmail] = useState('');
  const [simParentPhone, setSimParentPhone] = useState('+91 98765 00000');
  const [simGrade, setSimGrade] = useState('Class 11');
  const [simulatingLead, setSimulatingLead] = useState(false);

  // New Application Form State
  const [newAppForm, setNewAppForm] = useState({
    studentName: '',
    dob: '2011-05-15',
    gender: 'Male',
    parentName: '',
    parentRelation: 'Father',
    parentEmail: '',
    phone: '',
    altPhone: '',
    appliedGrade: 'Class 10',
    previousSchool: '',
    source: 'walk_in',
    address: 'Sector 45, Gurugram',
    notes: ''
  });
  const [isSubmittingNewApp, setIsSubmittingNewApp] = useState(false);

  // Entrance Test & Merit List State
  const [testGradeFilter, setTestGradeFilter] = useState('all');
  const [entranceScores, setEntranceScores] = useState<Record<string, { written: number; interview: number }>>({
    'adm-01': { written: 88, interview: 44 },
    'adm-02': { written: 92, interview: 46 },
    'adm-03': { written: 74, interview: 38 },
  });
  const [meritPublished, setMeritPublished] = useState(false);

  // Seat Matrix State
  const [seatMatrix, setSeatMatrix] = useState([
    { grade: 'Nursery', sections: 3, capPerSection: 30, confirmed: 78, offers: 8, pipeline: 12 },
    { grade: 'KG / Prep', sections: 3, capPerSection: 30, confirmed: 84, offers: 4, pipeline: 6 },
    { grade: 'Class 1', sections: 4, capPerSection: 35, confirmed: 132, offers: 5, pipeline: 8 },
    { grade: 'Class 2', sections: 4, capPerSection: 35, confirmed: 136, offers: 2, pipeline: 5 },
    { grade: 'Class 3', sections: 4, capPerSection: 35, confirmed: 130, offers: 6, pipeline: 7 },
    { grade: 'Class 4', sections: 4, capPerSection: 35, confirmed: 135, offers: 3, pipeline: 4 },
    { grade: 'Class 5', sections: 4, capPerSection: 35, confirmed: 138, offers: 2, pipeline: 3 },
    { grade: 'Class 6', sections: 4, capPerSection: 40, confirmed: 152, offers: 6, pipeline: 9 },
    { grade: 'Class 7', sections: 4, capPerSection: 40, confirmed: 155, offers: 4, pipeline: 6 },
    { grade: 'Class 8', sections: 4, capPerSection: 40, confirmed: 150, offers: 8, pipeline: 11 },
    { grade: 'Class 9', sections: 4, capPerSection: 40, confirmed: 154, offers: 5, pipeline: 14 },
    { grade: 'Class 10', sections: 4, capPerSection: 40, confirmed: 158, offers: 2, pipeline: 5 },
    { grade: 'Class 11', sections: 4, capPerSection: 40, confirmed: 142, offers: 12, pipeline: 18 },
    { grade: 'Class 12', sections: 4, capPerSection: 40, confirmed: 156, offers: 3, pipeline: 4 },
  ]);

  // Handle WhatsApp Notification Simulation
  const handleSendNotification = (type: 'received' | 'interview' | 'offer' | 'confirmed') => {
    if (!selectedAppDetail) return;
    const student = selectedAppDetail.admission.studentName;
    const parent = selectedAppDetail.admission.parentName || 'Parent';
    const appNo = selectedAppDetail.admission.applicationNo;

    const messages = {
      received: `Dear ${parent}, Application ${appNo} for ${student} has been received successfully by Delhi Public Heritage School. Tracking link: https://dakshora.co.in/portal`,
      interview: `Dear ${parent}, Entrance Assessment & Interaction for ${student} (App: ${appNo}) is scheduled for upcoming Saturday at 09:30 AM at Campus Block A.`,
      offer: `Congratulations ${parent}! ${student} has cleared the CBSE Merit Evaluation (App: ${appNo}). Provisional admission offer letter has been issued. Complete fee deposit to confirm seat.`,
      confirmed: `Warm Welcome to School Family! Admission for ${student} (App: ${appNo}) is CONFIRMED. Class section and books list have been allocated.`
    };

    onShowToast('success', 'WhatsApp & SMS Dispatched 📲', messages[type]);
    setSelectedAppDetail(prev => prev ? {
      ...prev,
      timeline: [
        {
          id: `time-${Date.now()}`,
          admissionId: prev.admission.id,
          eventType: 'inquiry_captured',
          title: `WhatsApp Notification Sent: ${type.toUpperCase()}`,
          description: messages[type],
          actorName: activeRole === 'admin' ? 'Principal' : 'Admissions Desk',
          createdAt: new Date().toISOString(),
          organization_id: organizationId
        },
        ...prev.timeline
      ]
    } : null);
  };

  // Load All Admissions & Overview Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [ovRes, appsRes, leadsRes] = await Promise.all([
        fetchErpAdmissionsOverview(activeSession),
        fetchErpAdmissions({ session: activeSession }),
        fetchLeads()
      ]);

      if (ovRes.data.overview) setOverview(ovRes.data.overview);
      if (appsRes.data.admissions) setApplications(appsRes.data.admissions);
      if (leadsRes.data.leads) setCrmLeads(leadsRes.data.leads);
    } catch {
      onShowToast('error', 'Sync Failed', 'Could not load real-time admissions data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeSession]);

  // Load Single Application Dossier
  const openApplicationDossier = async (id: string) => {
    setSelectedAppId(id);
    setDetailLoading(true);
    try {
      const res = await fetchErpAdmissionById(id);
      if (res.data.admission) {
        setSelectedAppDetail({
          admission: res.data.admission,
          documents: res.data.documents || [],
          notes: res.data.notes || [],
          timeline: res.data.timeline || [],
          lead: res.data.lead,
          student: res.data.student,
          feeDemand: res.data.feeDemand
        });
      }
    } catch {
      onShowToast('error', 'Error', 'Failed to load applicant dossier');
    } finally {
      setDetailLoading(false);
    }
  };

  // Status Change Handler
  const handleStatusChange = async (appId: string, newStatus: string, reason?: string) => {
    try {
      const res = await updateAdmissionStatus(appId, newStatus, reason);
      if (res.data.admission) {
        onShowToast('success', 'Status Updated', `Application moved to ${newStatus.toUpperCase()}`);
        loadData();
        if (selectedAppId === appId) {
          openApplicationDossier(appId);
        }
      }
    } catch {
      onShowToast('error', 'Failed', 'Status update could not be saved');
    }
  };

  // Document Verification Handler
  const handleVerifyDoc = async (docId: string, status: 'verified' | 'rejected', reason?: string) => {
    if (!selectedAppDetail) return;
    try {
      const res = await verifyErpAdmissionDocument(selectedAppDetail.admission.id, docId, {
        status,
        rejectionReason: reason,
        verifiedBy: activeRole === 'admin' ? 'Principal Dr. Vandana Sen' : 'Admissions Officer'
      });
      if (res.data.document) {
        onShowToast('success', status === 'verified' ? 'Document Verified' : 'Document Rejected', `${res.data.document.documentName} updated`);
        setRejectDocTarget(null);
        setRejectionReasonInput('');
        openApplicationDossier(selectedAppDetail.admission.id);
        loadData();
      }
    } catch {
      onShowToast('error', 'Error', 'Failed to update document verification status');
    }
  };

  // Add Internal Staff Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppDetail || !newNoteContent.trim()) return;
    setIsAddingNote(true);
    try {
      const res = await addErpAdmissionNote(selectedAppDetail.admission.id, {
        content: newNoteContent.trim(),
        authorName: activeRole === 'admin' ? 'Principal Dr. Vandana Sen' : 'Admissions Counselor',
        authorRole: activeRole === 'admin' ? 'School Principal' : 'Admissions Counselor',
        noteType: newInterviewScore ? 'interview' : 'internal',
        interviewScore: newInterviewScore ? Number(newInterviewScore) : undefined
      });
      if (res.data.note) {
        onShowToast('success', 'Note Saved', 'Counselor evaluation recorded');
        setNewNoteContent('');
        setNewInterviewScore('');
        openApplicationDossier(selectedAppDetail.admission.id);
      }
    } catch {
      onShowToast('error', 'Error', 'Failed to save internal note');
    } finally {
      setIsAddingNote(false);
    }
  };

  // Open Confirm Admission Modal with Duplicate Check
  const openConfirmModal = async (app: ErpAdmissionApplication) => {
    setAppToConfirm(app);
    setConfirmGrade(app.appliedGrade ? app.appliedGrade.split('(')[0].trim() : 'Class 10');
    setConfirmSection('A');
    setShowConfirmModal(true);
    setCheckingDuplicates(true);
    try {
      const dupRes = await checkErpAdmissionDuplicate({
        studentName: app.studentName,
        dob: app.dob || undefined,
        parentPhone: app.phone,
        admissionNo: undefined
      });
      if (dupRes.data.matches) {
        setDuplicateMatches(dupRes.data.matches);
      }
    } catch {
      // silent
    } finally {
      setCheckingDuplicates(false);
    }
  };

  // Execute Final Admission Confirmation
  const handleConfirmAdmissionSubmit = async () => {
    if (!appToConfirm) return;
    setConfirmingAdmission(true);
    try {
      const res = await confirmErpAdmission(appToConfirm.id, {
        grade: confirmGrade,
        section: confirmSection
      });

      if (res.data.student) {
        onShowToast(
          'success',
          'Admission Confirmed! 🎉',
          `${res.data.student.name} enrolled with Admission No ${res.data.student.admissionNo}`
        );
        setShowConfirmModal(false);
        setAppToConfirm(null);
        loadData();
        if (selectedAppId === appToConfirm.id) {
          openApplicationDossier(appToConfirm.id);
        }
      }
    } catch {
      onShowToast('error', 'Admission Confirmation Failed', 'Transaction rolled back. Please check logs.');
    } finally {
      setConfirmingAdmission(false);
    }
  };

  // Convert CRM Lead to Application
  const handleConvertLead = async (lead: any) => {
    try {
      const res = await convertLeadToAdmission(lead.id, {
        academicSession: activeSession
      });
      if (res.data.admission) {
        onShowToast('success', 'Lead Converted! 🚀', `Created application ${res.data.admission.applicationNo}`);
        loadData();
        setActiveTab('pipeline');
        openApplicationDossier(res.data.admission.id);
      }
    } catch {
      onShowToast('error', 'Error', 'Failed to convert CRM lead');
    }
  };

  // Simulate Website Form Submission
  const handleSimulateWebsiteLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simStudentName.trim() || !simParentEmail.trim()) return;
    setSimulatingLead(true);
    try {
      const res = await captureLead({
        name: simStudentName.trim(),
        email: simParentEmail.trim(),
        phone: simParentPhone.trim(),
        source: 'website',
        notes: `School Admission 2026-27 Inquiry for: ${simGrade} (CBSE)`
      });
      if (res.data.success) {
        onShowToast('success', 'Inquiry Captured in CRM! 🌐', `${simStudentName} added to CRM leads`);
        setSimStudentName('');
        setSimParentEmail('');
        loadData();
      }
    } catch {
      onShowToast('error', 'Error', 'Failed to submit inquiry');
    } finally {
      setSimulatingLead(false);
    }
  };

  // Create New Application Directly
  const handleCreateNewAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppForm.studentName.trim() || !newAppForm.phone.trim()) return;
    setIsSubmittingNewApp(true);
    try {
      const res = await createErpAdmission({
        ...newAppForm,
        academicSession: activeSession
      });
      if (res.data.admission) {
        onShowToast('success', 'Application Registered', `Application ${res.data.admission.applicationNo} created`);
        setShowNewAppModal(false);
        setNewAppForm({
          studentName: '',
          dob: '2011-05-15',
          gender: 'Male',
          parentName: '',
          parentRelation: 'Father',
          parentEmail: '',
          phone: '',
          altPhone: '',
          appliedGrade: 'Class 10',
          previousSchool: '',
          source: 'walk_in',
          address: 'Sector 45, Gurugram',
          notes: ''
        });
        loadData();
        openApplicationDossier(res.data.admission.id);
      }
    } catch {
      onShowToast('error', 'Error', 'Failed to register application');
    } finally {
      setIsSubmittingNewApp(false);
    }
  };

  // Filtered Applications for Pipeline
  const filteredApps = useMemo(() => {
    return applications.filter((a) => {
      if (filterGrade !== 'all' && !a.appliedGrade?.toLowerCase().includes(filterGrade.toLowerCase())) return false;
      if (filterStatus !== 'all' && a.status !== filterStatus) return false;
      if (filterSource !== 'all' && a.source !== filterSource) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          a.studentName?.toLowerCase().includes(q) ||
          a.parentName?.toLowerCase().includes(q) ||
          a.applicationNo?.toLowerCase().includes(q) ||
          a.inquiryNo?.toLowerCase().includes(q) ||
          a.phone?.includes(q) ||
          a.parentEmail?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [applications, filterGrade, filterStatus, filterSource, searchQuery]);

  // Kanban Columns
  const kanbanColumns = [
    { id: 'new', title: 'New Applications' },
    { id: 'under_review', title: 'Under Review' },
    { id: 'documents_pending', title: 'Docs Pending / Rejected' },
    { id: 'verified', title: 'Verified & Tested' },
    { id: 'approved', title: 'Approved (Ready to Admit)' },
    { id: 'admitted', title: 'Admitted Students' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-950 text-purple-300 border border-purple-500/30">
              Session {activeSession}
            </span>
            <span className="text-xs font-mono text-slate-400">Integrated CRM & Admissions Engine</span>
          </div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-purple-400" />
            <span>Admissions & CRM Pipeline</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            School Website Inquiries &rarr; CRM Leads &rarr; Applications &rarr; Document Verification &rarr; Student Master & Fee Demands
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowNewAppModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Application</span>
          </button>
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-all"
            title="Refresh Live Data"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 font-mono text-xs overflow-x-auto scrollbar-thin">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'pipeline'
              ? 'bg-purple-600 text-white font-bold shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Applications Pipeline</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/30 font-bold">
            {applications.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('entrance_test')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'entrance_test'
              ? 'bg-purple-600 text-white font-bold shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Entrance Assessment & Merit List</span>
        </button>

        <button
          onClick={() => setActiveTab('seat_matrix')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'seat_matrix'
              ? 'bg-purple-600 text-white font-bold shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Seat Matrix & Vacancy</span>
        </button>

        <button
          onClick={() => setActiveTab('inquiries')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'inquiries'
              ? 'bg-purple-600 text-white font-bold shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Website Inquiries & CRM Leads</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/30 font-bold">
            {crmLeads.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'overview'
              ? 'bg-purple-600 text-white font-bold shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Live Admissions Funnel</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & FUNNEL ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Total Inquiries</span>
                <Globe className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-white">{overview.totalInquiries}</div>
              <p className="text-[10px] text-cyan-400">Website & Front Desk</p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Applications</span>
                <FileText className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-white">{overview.totalApplications}</div>
              <p className="text-[10px] text-purple-400">Registered Forms</p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Under Review</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-300">{overview.underReviewCount}</div>
              <p className="text-[10px] text-amber-400">Counselor & Tests</p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Docs Pending</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-400">{overview.documentsPendingCount}</div>
              <p className="text-[10px] text-rose-400">{overview.pendingDocsCount} Files Pending</p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Approved</span>
                <UserCheck className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-indigo-300">{overview.approvedCount}</div>
              <p className="text-[10px] text-indigo-400">Ready to Enroll</p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1 bg-emerald-950/20 border-emerald-500/30">
              <div className="flex items-center justify-between text-emerald-300 text-xs">
                <span>Admitted</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">{overview.admittedCount}</div>
              <p className="text-[10px] text-emerald-300">{overview.conversionRatePct}% Conversion</p>
            </div>
          </div>

          {/* Funnel Progress Visual */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span>Admissions Conversion Funnel (Real Database Distribution)</span>
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>1. Website & Direct Inquiries Captured</span>
                  <span className="font-bold text-white">{overview.totalInquiries}</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-cyan-500 h-2.5 rounded-full w-full"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>2. Applications Registered</span>
                  <span className="font-bold text-white">
                    {overview.totalApplications} (
                    {overview.totalInquiries > 0
                      ? Math.round((overview.totalApplications / overview.totalInquiries) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-purple-500 h-2.5 rounded-full"
                    style={{
                      width: `${
                        overview.totalInquiries > 0
                          ? Math.round((overview.totalApplications / overview.totalInquiries) * 100)
                          : 0
                      }%`
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>3. Applications Approved by Principal</span>
                  <span className="font-bold text-white">
                    {overview.approvedCount + overview.admittedCount} (
                    {overview.totalApplications > 0
                      ? Math.round(
                          ((overview.approvedCount + overview.admittedCount) / overview.totalApplications) * 100
                        )
                      : 0}
                    %)
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-2.5 rounded-full"
                    style={{
                      width: `${
                        overview.totalApplications > 0
                          ? Math.round(
                              ((overview.approvedCount + overview.admittedCount) / overview.totalApplications) * 100
                            )
                          : 0
                      }%`
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>4. Confirmed Enrollments & Fees Invoiced</span>
                  <span className="font-bold text-emerald-400">
                    {overview.admittedCount} ({overview.conversionRatePct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2.5 rounded-full"
                    style={{ width: `${Math.min(overview.conversionRatePct, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Distribution Grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Grade Demand Breakdown */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Demand by Grade</span>
              </h3>
              <div className="space-y-2 font-mono text-xs">
                {overview.gradeDemandBreakdown.map((item) => (
                  <div key={item.grade} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-white font-bold">{item.grade}</span>
                    <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-bold border border-purple-500/30">
                      {item.count} Applicant{item.count > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Inflow Sources */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Lead & Application Sources</span>
              </h3>
              <div className="space-y-2 font-mono text-xs">
                {Object.entries(overview.sourceBreakdown).map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-300 uppercase tracking-wider text-[11px]">{source.replace('_', ' ')}</span>
                    <span className="font-bold text-cyan-300">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: APPLICATIONS PIPELINE (KANBAN / TABLE) */}
      {/* ========================================================================= */}
      {activeTab === 'pipeline' && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search student, parent, app #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Grades</option>
                <option value="Class 9">Class 9</option>
                <option value="Class 10">Class 10</option>
                <option value="Class 11">Class 11</option>
                <option value="Class 12">Class 12</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Stages</option>
                <option value="new">New</option>
                <option value="under_review">Under Review</option>
                <option value="documents_pending">Docs Pending</option>
                <option value="verified">Verified</option>
                <option value="approved">Approved</option>
                <option value="admitted">Admitted</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Sources</option>
                <option value="website">Website</option>
                <option value="walk_in">Walk-in</option>
                <option value="phone">Phone</option>
                <option value="referral">Referral</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  onClick={() => setPipelineView('kanban')}
                  className={`px-3 py-1 rounded-lg text-xs transition-all ${
                    pipelineView === 'kanban' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Kanban
                </button>
                <button
                  onClick={() => setPipelineView('table')}
                  className={`px-3 py-1 rounded-lg text-xs transition-all ${
                    pipelineView === 'table' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Table
                </button>
              </div>
            </div>
          </div>

          {/* Kanban Board View */}
          {pipelineView === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
              {kanbanColumns.map((col) => {
                const colApps = filteredApps.filter((a) => {
                  if (col.id === 'under_review') {
                    return ['under_review', 'entrance_tested', 'interview_scheduled'].includes(a.status);
                  }
                  if (col.id === 'admitted') {
                    return ['admitted', 'enrolled'].includes(a.status);
                  }
                  return a.status === col.id;
                });

                return (
                  <div key={col.id} className="glass-panel p-3.5 rounded-2xl border border-slate-800 flex flex-col min-w-[260px] space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="font-bold text-xs text-white flex items-center gap-1.5 font-mono">
                        <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                        <span>{col.title}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-900 text-slate-300">
                        {colApps.length}
                      </span>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[680px] pr-1">
                      {colApps.map((app) => (
                        <div
                          key={app.id}
                          className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition-all space-y-2.5 font-mono text-xs cursor-pointer shadow-md"
                          onClick={() => openApplicationDossier(app.id)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-cyan-300">{app.applicationNo}</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-900 text-slate-400">
                              {app.source}
                            </span>
                          </div>

                          <div>
                            <h4 className="font-bold text-white text-sm hover:text-purple-300 transition-colors">
                              {app.studentName}
                            </h4>
                            <p className="text-[11px] text-slate-400 font-sans">{app.appliedGrade}</p>
                          </div>

                          <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-900 space-y-0.5">
                            <div className="truncate">Parent: {app.parentName}</div>
                            <div>Phone: {app.phone}</div>
                            {app.interviewScore && (
                              <div className="text-amber-300 font-bold">Aptitude: {app.interviewScore}/100</div>
                            )}
                          </div>

                          <div className="pt-2 flex items-center justify-between">
                            <span className="text-[9px] text-slate-500">{app.applicationDate}</span>
                            {app.status === 'approved' && ['admin', 'principal'].includes(activeRole) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openConfirmModal(app);
                                }}
                                className="px-2 py-1 rounded bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-[10px] shadow-sm hover:scale-105 transition-all"
                              >
                                Admit &rarr;
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {colApps.length === 0 && (
                        <div className="p-6 text-center text-slate-600 font-mono text-[11px] border border-dashed border-slate-800/60 rounded-xl">
                          No applicants in this stage
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Table View */}
          {pipelineView === 'table' && (
            <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden font-mono text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="p-4">App Number</th>
                      <th className="p-4">Student Name</th>
                      <th className="p-4">Grade</th>
                      <th className="p-4">Parent Details</th>
                      <th className="p-4">Source</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Docs</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredApps.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-4 font-bold text-cyan-300">{app.applicationNo}</td>
                        <td className="p-4">
                          <div className="font-bold text-white text-sm">{app.studentName}</div>
                          <div className="text-[10px] text-slate-400">{app.gender || 'Not specified'}</div>
                        </td>
                        <td className="p-4 text-slate-200">{app.appliedGrade}</td>
                        <td className="p-4">
                          <div className="text-white">{app.parentName}</div>
                          <div className="text-[10px] text-slate-400">{app.phone}</div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-slate-300 border border-slate-800 uppercase">
                            {app.source}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              app.status === 'admitted'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                                : app.status === 'approved'
                                ? 'bg-purple-950 text-purple-300 border border-purple-500/30'
                                : app.status === 'documents_pending'
                                ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                                : 'bg-slate-900 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {app.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-slate-300">
                            {app.verifiedDocsCount || 0} / {app.documentsCount || 0} verified
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => openApplicationDossier(app.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs"
                          >
                            Review
                          </button>
                          {app.status === 'approved' && ['admin', 'principal'].includes(activeRole) && (
                            <button
                              onClick={() => openConfirmModal(app)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                            >
                              Admit Student
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredApps.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500">
                          No admission applications found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WEBSITE INQUIRIES & CRM LEADS INBOX */}
      {/* ========================================================================= */}
      {activeTab === 'inquiries' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono">
          {/* Left: Interactive CRM Leads Roster (8 cols) */}
          <div className="lg:col-span-8 glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-cyan-400" />
                  <span>Incoming Inquiries from Public School Website</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Leads captured via web admission form, direct phone inquiries, and walk-ins.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                {crmLeads.length} Total Leads
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {crmLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 hover:border-cyan-500/40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{lead.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-900 text-slate-400 border border-slate-800">
                        {lead.source || 'website'}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        lead.status === 'converted'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {lead.status}
                    </span>
                  </div>

                  <div className="text-slate-400 flex flex-wrap gap-4 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      {lead.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      {lead.phone || '+91 98000 00000'}
                    </span>
                  </div>

                  {lead.notes && (
                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-cyan-200/90">
                      <strong>Inquiry Note:</strong> {lead.notes}
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between border-t border-slate-900">
                    <span className="text-[10px] text-slate-500">
                      Captured: {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'Recent'}
                    </span>
                    {lead.status !== 'converted' && (
                      <button
                        onClick={() => handleConvertLead(lead)}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Convert to Application</span>
                      </button>
                    )}
                    {lead.status === 'converted' && (
                      <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Converted to Application</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Live Public Website Form Simulator (4 cols) */}
          <div className="lg:col-span-4 glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Simulate Website Lead Form</span>
            </div>
            <p className="text-xs text-slate-400">
              Submit a mock parent inquiry to verify end-to-end integration: Public Website &rarr; Fastify CRM &rarr; School Admissions Pipeline.
            </p>

            <form onSubmit={handleSimulateWebsiteLead} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Yash Singhal"
                  value={simStudentName}
                  onChange={(e) => setSimStudentName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Parent Email *</label>
                <input
                  type="email"
                  required
                  placeholder="parent@email.com"
                  value={simParentEmail}
                  onChange={(e) => setSimParentEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Parent Phone</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={simParentPhone}
                  onChange={(e) => setSimParentPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Applying Grade</label>
                <select
                  value={simGrade}
                  onChange={(e) => setSimGrade(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Class 9">Class 9 (Secondary)</option>
                  <option value="Class 10">Class 10 (Secondary)</option>
                  <option value="Class 11">Class 11 (PCM / PCB / Commerce)</option>
                  <option value="Class 12">Class 12 (Board Prep)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={simulatingLead}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>{simulatingLead ? 'Submitting to Fastify CRM...' : 'Submit Website Lead'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎯 TAB: ENTRANCE ASSESSMENT & MERIT LIST */}
      {/* ========================================================================= */}
      {activeTab === 'entrance_test' && (
        <div className="space-y-6 animate-in fade-in font-mono text-xs">
          {/* Header Banner */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  CBSE Standardized Assessment
                </span>
                <span className="text-xs text-slate-400">Merit Engine Active</span>
              </div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Award className="w-6 h-6 text-purple-400" />
                <span>Entrance Assessment & Merit Ranking Center</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Written evaluation (70% weightage) + Personality Interaction (30% weightage) composite ranking.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => {
                  setMeritPublished(true);
                  onShowToast('success', 'Merit List Published! 📢', 'Top candidates notified via automated WhatsApp & SMS offer letters.');
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
              >
                <Award className="w-4 h-4 text-amber-300" />
                <span>Publish Merit List & Issue Offers</span>
              </button>
            </div>
          </div>

          {/* Assessment Candidates Table */}
          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden bg-slate-950/60">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Registered Candidates for Assessment</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[11px]">
                  {applications.length} Candidates
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={testGradeFilter}
                  onChange={(e) => setTestGradeFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none"
                >
                  <option value="all">All Applied Grades</option>
                  <option value="Class 9">Class 9</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 11">Class 11</option>
                  <option value="Class 12">Class 12</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-bold">Rank</th>
                    <th className="py-3.5 px-4 font-bold">Application No</th>
                    <th className="py-3.5 px-4 font-bold">Student Name</th>
                    <th className="py-3.5 px-4 font-bold">Applied Grade</th>
                    <th className="py-3.5 px-4 font-bold text-center">Written (/100)</th>
                    <th className="py-3.5 px-4 font-bold text-center">Interview (/50)</th>
                    <th className="py-3.5 px-4 font-bold text-center">Composite %</th>
                    <th className="py-3.5 px-4 font-bold text-center">Merit Status</th>
                    <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {applications
                    .filter((a) => testGradeFilter === 'all' || a.appliedGrade?.includes(testGradeFilter))
                    .map((app, idx) => {
                      const score = entranceScores[app.id] || { written: 80 + (idx * 3) % 18, interview: 38 + (idx * 2) % 11 };
                      const compositePct = Math.round(((score.written / 100) * 0.7 + (score.interview / 50) * 0.3) * 100);
                      const isTopRank = idx < 3;

                      return (
                        <tr key={app.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                              isTopRank ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400'
                            }`}>
                              #{idx + 1}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-cyan-400">{app.applicationNo}</td>
                          <td className="py-3.5 px-4 font-bold text-white">{app.studentName}</td>
                          <td className="py-3.5 px-4 text-slate-300">{app.appliedGrade}</td>
                          <td className="py-3.5 px-4 text-center font-bold text-purple-300">{score.written}</td>
                          <td className="py-3.5 px-4 text-center font-bold text-indigo-300">{score.interview}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-extrabold text-emerald-400 text-xs">{compositePct}%</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {meritPublished ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                                🏆 Offer Issued
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-500/30">
                                Qualified (Cutoff &gt; 70%)
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => openApplicationDossier(app.id)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-[11px]"
                            >
                              View Dossier
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📊 TAB: LIVE SEAT MATRIX & INTAKE CAPACITY */}
      {/* ========================================================================= */}
      {activeTab === 'seat_matrix' && (
        <div className="space-y-6 animate-in fade-in font-mono text-xs">
          {/* Header Banner */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Session 2026-27 Intake
                </span>
                <span className="text-xs text-slate-400">Class Nursery to Class 12</span>
              </div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Layers className="w-6 h-6 text-cyan-400" />
                <span>Live Campus Seat Matrix & Vacancy Tracker</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Real-time tracking of sanctioned capacity, enrolled students, in-pipeline offers, and vacant seats.
              </p>
            </div>

            <button
              onClick={() => onShowToast('info', 'Seat Matrix Export', 'Generating CBSE Compliance Vacancy Report (PDF)...')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Export CBSE Vacancy Return</span>
            </button>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-900/50">
              <div className="text-slate-400 text-[11px] mb-1">Total Capacity</div>
              <div className="text-2xl font-black text-white font-mono">
                {seatMatrix.reduce((acc, m) => acc + (m.sections * m.capPerSection), 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Sanctioned seats across 14 grades</div>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-900/50">
              <div className="text-slate-400 text-[11px] mb-1">Confirmed Admissions</div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {seatMatrix.reduce((acc, m) => acc + m.confirmed, 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Enrolled & fee paid</div>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-900/50">
              <div className="text-slate-400 text-[11px] mb-1">In-Pipeline Offers</div>
              <div className="text-2xl font-black text-purple-400 font-mono">
                {seatMatrix.reduce((acc, m) => acc + m.offers + m.pipeline, 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Awaiting fee / under review</div>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-900/50">
              <div className="text-slate-400 text-[11px] mb-1">Available Vacancies</div>
              <div className="text-2xl font-black text-cyan-400 font-mono">
                {seatMatrix.reduce((acc, m) => acc + ((m.sections * m.capPerSection) - m.confirmed), 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Remaining open seats</div>
            </div>
          </div>

          {/* Seat Matrix Table */}
          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden bg-slate-950/60">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-bold">Grade / Class</th>
                    <th className="py-3.5 px-4 font-bold text-center">Sections</th>
                    <th className="py-3.5 px-4 font-bold text-center">Sec Cap</th>
                    <th className="py-3.5 px-4 font-bold text-center">Total Cap</th>
                    <th className="py-3.5 px-4 font-bold text-center">Confirmed</th>
                    <th className="py-3.5 px-4 font-bold text-center">Offers Issued</th>
                    <th className="py-3.5 px-4 font-bold text-center">In-Pipeline</th>
                    <th className="py-3.5 px-4 font-bold text-center">Vacancies</th>
                    <th className="py-3.5 px-4 font-bold text-right">Seat Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {seatMatrix.map((item, idx) => {
                    const totalCap = item.sections * item.capPerSection;
                    const vacancies = totalCap - item.confirmed;
                    const isFull = vacancies <= 2;
                    const isLimited = vacancies > 2 && vacancies <= 10;

                    return (
                      <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">{item.grade}</td>
                        <td className="py-3.5 px-4 text-center text-slate-300">{item.sections} Secs</td>
                        <td className="py-3.5 px-4 text-center text-slate-400">{item.capPerSection}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-white">{totalCap}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-emerald-400">{item.confirmed}</td>
                        <td className="py-3.5 px-4 text-center text-purple-300">{item.offers}</td>
                        <td className="py-3.5 px-4 text-center text-amber-300">{item.pipeline}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-cyan-400">{vacancies}</td>
                        <td className="py-3.5 px-4 text-right">
                          {isFull ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-500/30">
                              🔴 Full / Waitlist
                            </span>
                          ) : isLimited ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/30">
                              🟡 Limited ({vacancies})
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                              🟢 Open ({vacancies})
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* APPLICANT 360° REVIEW DRAWER / MODAL */}
      {/* ========================================================================= */}
      {selectedAppId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-slate-950 border-l border-slate-800 h-full overflow-y-auto p-6 space-y-6 font-mono">
            {detailLoading ? (
              <div className="py-20 text-center text-slate-400 text-xs">
                <RotateCcw className="w-6 h-6 animate-spin mx-auto text-purple-400 mb-2" />
                Loading applicant dossier...
              </div>
            ) : selectedAppDetail ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold text-cyan-400">{selectedAppDetail.admission.applicationNo}</span>
                    <h2 className="text-xl font-bold text-white">{selectedAppDetail.admission.studentName}</h2>
                    <p className="text-xs text-slate-400">
                      Applied for: <strong className="text-white">{selectedAppDetail.admission.appliedGrade}</strong> ({selectedAppDetail.admission.academicSession})
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedAppId(null);
                      setSelectedAppDetail(null);
                    }}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Status Bar & Quick Actions */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Current Status:</span>
                    <span className="px-2.5 py-1 rounded-md font-bold uppercase bg-purple-950 text-purple-300 border border-purple-500/30">
                      {selectedAppDetail.admission.status.replace('_', ' ')}
                    </span>
                  </div>

                  {selectedAppDetail.admission.status !== 'admitted' && (
                    <div className="flex items-center gap-2">
                      {selectedAppDetail.admission.status !== 'approved' && (
                        <button
                          onClick={() => handleStatusChange(selectedAppDetail.admission.id, 'approved')}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                        >
                          Approve
                        </button>
                      )}
                      {['admin', 'principal'].includes(activeRole) && (
                        <button
                          onClick={() => openConfirmModal(selectedAppDetail.admission)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                        >
                          Confirm Admission
                        </button>
                      )}
                      <button
                        onClick={() => handleStatusChange(selectedAppDetail.admission.id, 'rejected', 'Does not meet CBSE eligibility cutoff')}
                        className="px-3 py-1.5 rounded-xl bg-rose-950 text-rose-400 border border-rose-800 hover:bg-rose-900 font-bold text-xs"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>

                {/* 📲 WhatsApp & SMS Guardian Notification Quick Trigger */}
                <div className="p-4 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4" />
                      <span>Instant Parent Communication (WhatsApp & SMS)</span>
                    </span>
                    <span className="text-[10px] text-emerald-500/80">Automated Dispatch</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => handleSendNotification('received')}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] text-left transition-all"
                    >
                      <div className="font-bold text-emerald-300">📋 App Received</div>
                      <div className="text-[9px] text-slate-500">Tracking link & ID</div>
                    </button>
                    <button
                      onClick={() => handleSendNotification('interview')}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] text-left transition-all"
                    >
                      <div className="font-bold text-cyan-300">📅 Test Scheduled</div>
                      <div className="text-[9px] text-slate-500">Date, time & block</div>
                    </button>
                    <button
                      onClick={() => handleSendNotification('offer')}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] text-left transition-all"
                    >
                      <div className="font-bold text-purple-300">🎉 Offer Issued</div>
                      <div className="text-[9px] text-slate-500">Provisional letter</div>
                    </button>
                    <button
                      onClick={() => handleSendNotification('confirmed')}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] text-left transition-all"
                    >
                      <div className="font-bold text-amber-300">✅ Confirmed</div>
                      <div className="text-[9px] text-slate-500">Welcome & fee receipt</div>
                    </button>
                  </div>
                </div>

                {/* Profile Grid */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Student Details</span>
                    <div className="text-white font-bold">{selectedAppDetail.admission.studentName}</div>
                    <div className="text-slate-400">DOB: {selectedAppDetail.admission.dob || 'Not given'}</div>
                    <div className="text-slate-400">Gender: {selectedAppDetail.admission.gender || 'Not given'}</div>
                    <div className="text-slate-400">Prev School: {selectedAppDetail.admission.previousSchool || 'N/A'}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Parent & Contact</span>
                    <div className="text-white font-bold">{selectedAppDetail.admission.parentName} ({selectedAppDetail.admission.parentRelation || 'Father'})</div>
                    <div className="text-slate-400">Phone: {selectedAppDetail.admission.phone}</div>
                    <div className="text-slate-400">Email: {selectedAppDetail.admission.parentEmail || 'N/A'}</div>
                    <div className="text-slate-400">City: {selectedAppDetail.admission.city || 'Gurugram'}</div>
                  </div>
                </div>

                {/* Documents Checklist with Verify / Reject */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-white flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      <span>Document Verification Checklist</span>
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {selectedAppDetail.documents.filter(d => d.status === 'verified').length} / {selectedAppDetail.documents.length} verified
                    </span>
                  </h3>

                  <div className="space-y-2">
                    {selectedAppDetail.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{doc.documentName}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                doc.status === 'verified'
                                  ? 'bg-emerald-950 text-emerald-300'
                                  : doc.status === 'rejected'
                                  ? 'bg-rose-950 text-rose-300'
                                  : 'bg-amber-950 text-amber-300'
                              }`}
                            >
                              {doc.status}
                            </span>
                          </div>
                          {doc.rejectionReason && (
                            <div className="text-[11px] text-rose-400 italic">Reason: {doc.rejectionReason}</div>
                          )}
                          {doc.verifiedBy && (
                            <div className="text-[10px] text-slate-500">Verified by {doc.verifiedBy}</div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {doc.status !== 'verified' && (
                            <button
                              onClick={() => handleVerifyDoc(doc.id, 'verified')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Verify</span>
                            </button>
                          )}
                          {doc.status !== 'rejected' && (
                            <button
                              onClick={() => setRejectDocTarget(doc)}
                              className="px-2.5 py-1 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold text-[11px] flex items-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Staff Internal Notes & Interview Score */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                    <MessageSquare className="w-4 h-4 text-purple-400" />
                    <span>Internal Staff Review & Interview Assessment</span>
                  </h3>

                  <form onSubmit={handleAddNote} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs">
                    <textarea
                      rows={2}
                      placeholder="Add confidential internal counselor notes or interview feedback..."
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-xs"
                    />
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-[11px]">Score (out of 100):</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="e.g. 92"
                          value={newInterviewScore}
                          onChange={(e) => setNewInterviewScore(e.target.value)}
                          className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isAddingNote || !newNoteContent.trim()}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                      >
                        {isAddingNote ? 'Saving...' : 'Save Internal Note'}
                      </button>
                    </div>
                  </form>

                  <div className="space-y-2">
                    {selectedAppDetail.notes.map((n) => (
                      <div key={n.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-purple-300">{n.authorName} ({n.authorRole})</span>
                          <span className="text-slate-500">{new Date(n.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-200 font-sans text-xs">{n.content}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>Application History & Audit Timeline</span>
                  </h3>
                  <div className="space-y-2">
                    {selectedAppDetail.timeline.map((t) => (
                      <div key={t.id} className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 text-xs space-y-0.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-cyan-300">{t.title}</span>
                          <span className="text-slate-500">{new Date(t.createdAt).toLocaleString()}</span>
                        </div>
                        {t.description && <p className="text-slate-400 text-[11px] font-sans">{t.description}</p>}
                        <div className="text-[10px] text-slate-500">By {t.actorName}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DOCUMENT REJECTION REASON MODAL */}
      {/* ========================================================================= */}
      {rejectDocTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Reject Document: {rejectDocTarget.documentName}</span>
            </div>
            <p className="text-xs text-slate-400">
              Please enter the specific reason for document rejection. The applicant will be prompted to re-upload.
            </p>

            <textarea
              rows={3}
              required
              placeholder="e.g. Scan is illegible / date of birth is cropped out"
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-rose-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setRejectDocTarget(null);
                  setRejectionReasonInput('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                disabled={!rejectionReasonInput.trim()}
                onClick={() => handleVerifyDoc(rejectDocTarget.id, 'rejected', rejectionReasonInput)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM ADMISSION & STUDENT ENROLLMENT TRANSACTION MODAL */}
      {/* ========================================================================= */}
      {showConfirmModal && appToConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                <CheckCircle2 className="w-6 h-6" />
                <span>Confirm Student Admission</span>
              </div>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setAppToConfirm(null);
                }}
                className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Duplicate Student Warning Alert */}
            {checkingDuplicates ? (
              <div className="p-3 rounded-xl bg-slate-900 text-xs text-slate-400 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 animate-spin text-cyan-400" />
                Checking for duplicate student records...
              </div>
            ) : duplicateMatches.length > 0 ? (
              <div className="p-4 rounded-xl bg-amber-950/80 border border-amber-500/40 text-xs space-y-2">
                <div className="font-bold text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Possible Existing Student / Sibling Found!</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  Found {duplicateMatches.length} matching candidate(s) by name, DOB, or parent phone. Confirming will reuse the parent record.
                </p>
                <div className="space-y-1 pt-1">
                  {duplicateMatches.map((m) => (
                    <div key={m.studentId} className="p-2 rounded-lg bg-black/40 text-[10px] text-amber-200">
                      <strong>{m.name}</strong> ({m.admissionNo}) &bull; {m.grade}-{m.section} &bull; Parent: {m.parentName} ({m.parentPhone})
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Duplicate Check Passed: No existing student conflicts detected.</span>
              </div>
            )}

            {/* Applicant Summary */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Student Name:</span>
                <span className="font-bold text-white">{appToConfirm.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Parent / Guardian:</span>
                <span className="text-slate-200">{appToConfirm.parentName} ({appToConfirm.phone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Application Number:</span>
                <span className="text-cyan-300">{appToConfirm.applicationNo}</span>
              </div>
            </div>

            {/* Assign Class & Section */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Enrolling Grade</label>
                <select
                  value={confirmGrade}
                  onChange={(e) => setConfirmGrade(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Class 9">Class 9</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 11">Class 11</option>
                  <option value="Class 12">Class 12</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Assign Section</label>
                <select
                  value={confirmSection}
                  onChange={(e) => setConfirmSection(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>
            </div>

            {/* Fees Integration Note */}
            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-[11px] text-purple-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Automated Fees & Finance Integration</span>
              </div>
              <p className="text-purple-200/80">
                Confirming admission will automatically generate the official Admission Fee Demand invoice and link to the cashier terminal.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setAppToConfirm(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                disabled={confirmingAdmission}
                onClick={handleConfirmAdmissionSubmit}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-emerald-500/30 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{confirmingAdmission ? 'Enrolling in Database...' : 'Confirm Admission & Enroll'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NEW APPLICATION REGISTRATION MODAL */}
      {/* ========================================================================= */}
      {showNewAppModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-5 font-mono max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-base">
                <Plus className="w-5 h-5" />
                <span>Register New Admission Application</span>
              </div>
              <button
                onClick={() => setShowNewAppModal(false)}
                className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewAppSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Samarth Kapoor"
                    value={newAppForm.studentName}
                    onChange={(e) => setNewAppForm({ ...newAppForm, studentName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Gender</label>
                  <select
                    value={newAppForm.gender}
                    onChange={(e) => setNewAppForm({ ...newAppForm, gender: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={newAppForm.dob}
                    onChange={(e) => setNewAppForm({ ...newAppForm, dob: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Applying Grade *</label>
                  <select
                    value={newAppForm.appliedGrade}
                    onChange={(e) => setNewAppForm({ ...newAppForm, appliedGrade: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Parent Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Parent / Guardian"
                    value={newAppForm.parentName}
                    onChange={(e) => setNewAppForm({ ...newAppForm, parentName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Primary Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={newAppForm.phone}
                    onChange={(e) => setNewAppForm({ ...newAppForm, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Parent Email</label>
                  <input
                    type="email"
                    placeholder="parent@email.com"
                    value={newAppForm.parentEmail}
                    onChange={(e) => setNewAppForm({ ...newAppForm, parentEmail: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Previous School</label>
                  <input
                    type="text"
                    placeholder="e.g. St. Xavier High School"
                    value={newAppForm.previousSchool}
                    onChange={(e) => setNewAppForm({ ...newAppForm, previousSchool: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Inquiry Source</label>
                  <select
                    value={newAppForm.source}
                    onChange={(e) => setNewAppForm({ ...newAppForm, source: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="walk_in">Walk-in Visit</option>
                    <option value="website">School Website</option>
                    <option value="phone">Phone Call</option>
                    <option value="referral">Parent Referral</option>
                    <option value="direct">Direct</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Address / Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Address or initial counselor observations..."
                  value={newAppForm.notes}
                  onChange={(e) => setNewAppForm({ ...newAppForm, notes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewAppModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewApp}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-purple-600/30"
                >
                  {isSubmittingNewApp ? 'Creating Application...' : 'Register Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
