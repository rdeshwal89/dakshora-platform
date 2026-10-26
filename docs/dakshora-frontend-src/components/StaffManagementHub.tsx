import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  Upload,
  Printer,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  FileSpreadsheet,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Award,
  ShieldCheck,
  FileText,
  Clock,
  ArrowUpDown,
  BookOpen,
  Briefcase,
  GraduationCap,
  Power,
  Layers,
  Check,
  ShieldAlert,
  KeyRound,
  Lock,
  Coins
} from 'lucide-react';
import {
  ErpStaffRecord,
  ErpStaffProfile,
  StaffSummaryKPIs,
  TeacherAssignmentRecord,
  StaffImportResult,
  ErpRole,
  ResponsibilityTypeRecord,
  StaffResponsibilityRecord,
  ResponsibilityScopeType,
  InstitutionalDutyRecord
} from '../types';
import {
  fetchErpStaff,
  fetchErpStaffProfile,
  createErpStaff,
  updateErpStaff,
  deactivateErpStaff,
  deleteErpStaff,
  fetchTeacherAssignments,
  createTeacherAssignment,
  deleteTeacherAssignment,
  importErpStaff,
  getErpStaffExportUrl,
  StaffQueryParams,
  fetchResponsibilityTypes,
  createResponsibilityType,
  updateResponsibilityType,
  fetchStaffResponsibilities,
  assignStaffResponsibility,
  updateStaffResponsibility,
  removeStaffResponsibility,
  fetchInstitutionalDuties
} from '../services/api';
import { BulkImportConsole } from './BulkImportConsole';
import { PrincipalOtpAuthModal } from './PrincipalOtpAuthModal';

interface StaffManagementHubProps {
  activeRole: ErpRole;
  activeSession: string;
  organizationId?: string;
  onShowToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
  initialShowAdd?: boolean;
  onCloseInitialAdd?: () => void;
}

const DEPARTMENTS = [
  'All Departments',
  'Academics',
  'Administration',
  'Science & Math',
  'Languages & Humanities',
  'Sports & PE',
  'Transport',
  'Library',
  'Facilities & Support'
];

const STAFF_TYPES = [
  { value: 'all', label: 'All Staff Types' },
  { value: 'Teacher', label: 'Teaching Faculty' },
  { value: 'Non-Teaching', label: 'Non-Teaching Staff' },
  { value: 'Admin', label: 'Administration' },
  { value: 'Support', label: 'Support & Transport' }
];

const DESIGNATIONS = [
  'All Designations',
  'Principal',
  'Vice Principal',
  'PGT',
  'TGT',
  'PRT',
  'Accountant',
  'Librarian',
  'Lab Assistant',
  'Administrative Officer',
  'Transport Supervisor',
  'Bus Driver',
  'Support Staff'
];

const SUBJECTS_LIST = [
  'Mathematics',
  'Science',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'Hindi',
  'Sanskrit',
  'Social Science',
  'History',
  'Geography',
  'Economics',
  'Computer Science',
  'Physical Education',
  'Art & Craft',
  'Music'
];

const CLASSES_LIST = [
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12'
];

const SECTIONS_LIST = ['A', 'B', 'C', 'D'];

export const StaffManagementHub: React.FC<StaffManagementHubProps> = ({
  activeRole,
  activeSession,
  organizationId,
  onShowToast,
  initialShowAdd = false,
  onCloseInitialAdd
}) => {
  // Navigation & View states
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'teachers' | 'non_teaching' | 'responsibilities_master' | 'add' | 'import'>('directory');
  const [selectedStaffForProfile, setSelectedStaffForProfile] = useState<string | null>(null);
  const [staffProfileData, setStaffProfileData] = useState<ErpStaffProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileActiveTab, setProfileActiveTab] = useState<'overview' | 'assignments' | 'responsibilities' | 'attendance' | 'qualifications' | 'documents' | 'activity'>('overview');

  // Staff Responsibilities State (Migration 021)
  const [profileResponsibilities, setProfileResponsibilities] = useState<StaffResponsibilityRecord[]>([]);
  const [responsibilitiesLoading, setResponsibilitiesLoading] = useState<boolean>(false);
  const [responsibilityTypes, setResponsibilityTypes] = useState<ResponsibilityTypeRecord[]>([]);
  const [showAssignRespModal, setShowAssignRespModal] = useState<boolean>(false);
  const [assignRespForm, setAssignRespForm] = useState<{
    responsibility_type_id: string;
    scope_type: ResponsibilityScopeType;
    scope_id: string;
    scope_name: string;
    academic_session_id: string;
    is_primary: boolean;
    start_date: string;
    end_date: string;
    notes: string;
  }>({
    responsibility_type_id: '',
    scope_type: 'SECTION',
    scope_id: 'Class 9-A',
    scope_name: 'Grade 9 - Section A',
    academic_session_id: activeSession || '2026-27',
    is_primary: false,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    notes: ''
  });
  const [assignRespSubmitting, setAssignRespSubmitting] = useState<boolean>(false);

  // Responsibilities Master State (for top-level Incharge Master catalog)
  const [respMasterCategory, setRespMasterCategory] = useState<string>('all');
  const [respMasterSearch, setRespMasterSearch] = useState<string>('');
  const [showCreateRespTypeModal, setShowCreateRespTypeModal] = useState<boolean>(false);
  const [newRespTypeForm, setNewRespTypeForm] = useState<{
    code: string;
    name: string;
    description: string;
    category: string;
    default_scope_type: ResponsibilityScopeType;
  }>({
    code: '',
    name: '',
    description: '',
    category: 'academics',
    default_scope_type: 'SECTION'
  });
  const [createRespTypeSubmitting, setCreateRespTypeSubmitting] = useState<boolean>(false);

  // Teacher Assignment Modal state
  const [assignmentModalStaff, setAssignmentModalStaff] = useState<ErpStaffRecord | null>(null);
  const [currentAssignments, setCurrentAssignments] = useState<TeacherAssignmentRecord[]>([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    grade: 'Class 10',
    section: 'A',
    subject: 'Mathematics',
    academicSession: activeSession || '2026-27'
  });
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);

  // Edit Staff state
  const [editingStaff, setEditingStaff] = useState<ErpStaffRecord | null>(null);
  const [isDeactivatingId, setIsDeactivatingId] = useState<string | null>(null);

  // Principal Security Authorization Gate State
  const [showPrincipalOtpModal, setShowPrincipalOtpModal] = useState<boolean>(false);
  const [pendingProtectedAction, setPendingProtectedAction] = useState<{
    type: 'delete' | 'deactivate';
    member: ErpStaffRecord;
  } | null>(null);

  // Institutional Incharges & Teacher Charges State
  const [institutionalDuties, setInstitutionalDuties] = useState<InstitutionalDutyRecord[]>([]);
  const [dutiesLoading, setDutiesLoading] = useState<boolean>(false);
  const [dutySubTab, setDutySubTab] = useState<'duties_roster' | 'master_templates'>('duties_roster');
  const [showGlobalAssignDutyModal, setShowGlobalAssignDutyModal] = useState<boolean>(false);
  const [globalDutyForm, setGlobalDutyForm] = useState<{
    staffId: string;
    responsibility_type_id: string;
    scope_type: ResponsibilityScopeType;
    scope_id: string;
    scope_name: string;
    academic_session_id: string;
    is_primary: boolean;
    start_date: string;
    end_date: string;
    notes: string;
  }>({
    staffId: '',
    responsibility_type_id: '',
    scope_type: 'SCHOOL',
    scope_id: 'sch-main',
    scope_name: 'Institutional School Scope',
    academic_session_id: activeSession || '2026-27',
    is_primary: false,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    notes: ''
  });
  const [submittingGlobalDuty, setSubmittingGlobalDuty] = useState<boolean>(false);
  const [dutySearchTerm, setDutySearchTerm] = useState<string>('');

  // Staff list state
  const [staffList, setStaffList] = useState<ErpStaffRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpiSummary, setKpiSummary] = useState<StaffSummaryKPIs>({
    total: 0,
    active: 0,
    teachers: 0,
    nonTeaching: 0,
    onLeaveToday: 0
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStaffType, setFilterStaffType] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterDesignation, setFilterDesignation] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Add Staff Form State
  const [addFormSection, setAddFormSection] = useState<'personal' | 'employment' | 'contact' | 'specialization' | 'documents'>('personal');
  const [addForm, setAddForm] = useState({
    empId: '',
    firstName: '',
    lastName: '',
    gender: 'Female',
    dob: '1988-06-15',
    bloodGroup: 'O+',
    photoUrl: '',
    staffType: 'Teacher',
    designation: 'PGT Mathematics',
    department: 'Academics',
    employmentType: 'Full-time',
    joiningDate: new Date().toISOString().split('T')[0],
    qualification: 'M.Sc. Mathematics, B.Ed.',
    experienceYears: 6,
    subjectSpecialization: 'Mathematics & Statistics',
    phone: '',
    altPhone: '',
    email: '',
    address: '',
    city: 'Gurugram',
    state: 'Haryana',
    pinCode: '122001',
    salaryINR: 58000,
    status: 'active' as const,
    docAadhaar: true,
    docDegrees: true,
    docExperience: true,
    docPoliceClearance: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // CSV Import State
  const [importCsvText, setImportCsvText] = useState('');
  const [importDryRunResult, setImportDryRunResult] = useState<StaffImportResult | null>(null);
  const [isValidatingImport, setIsValidatingImport] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Permissions based on Role
  const canModifyStaff = activeRole === 'admin';

  // Handle Initial Show Add
  useEffect(() => {
    if (initialShowAdd) {
      setActiveSubTab('add');
    }
  }, [initialShowAdd]);

  // Load Staff Directory
  const loadStaff = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Determine effective staffType filter based on sub-tab or dropdown
      let effectiveType = filterStaffType;
      if (activeSubTab === 'teachers') effectiveType = 'Teacher';
      else if (activeSubTab === 'non_teaching') effectiveType = 'Non-Teaching';

      const params: StaffQueryParams = {
        query: searchQuery.trim() || undefined,
        staffType: effectiveType !== 'all' ? effectiveType : undefined,
        department: filterDepartment !== 'all' && filterDepartment !== 'All Departments' ? filterDepartment : undefined,
        designation: filterDesignation !== 'all' && filterDesignation !== 'All Designations' ? filterDesignation : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        sortBy,
        sortOrder,
        page: currentPage,
        limit: pageSize
      };

      const res = await fetchErpStaff(params);
      if (res.data) {
        setStaffList(res.data.staff || []);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalRecords(res.data.pagination.total || 0);
        }
        if (res.data.summary) {
          setKpiSummary(res.data.summary);
        }
      }
    } catch (err: any) {
      onShowToast('error', 'Error Loading Staff', err.message || 'Could not retrieve faculty roster');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeSubTab, searchQuery, filterStaffType, filterDepartment, filterDesignation, filterStatus, sortBy, sortOrder, currentPage, pageSize, onShowToast]);

  useEffect(() => {
    if (activeSubTab === 'directory' || activeSubTab === 'teachers' || activeSubTab === 'non_teaching') {
      loadStaff();
    }
  }, [loadStaff, activeSubTab]);

  // Handle Sub-tab change for fast view switching
  const handleSubTabChange = (tab: 'directory' | 'teachers' | 'non_teaching' | 'responsibilities_master' | 'add' | 'import') => {
    setActiveSubTab(tab);
    setCurrentPage(1);
    if (tab === 'teachers') {
      setFilterStaffType('Teacher');
    } else if (tab === 'non_teaching') {
      setFilterStaffType('Non-Teaching');
    } else if (tab === 'directory') {
      setFilterStaffType('all');
    } else if (tab === 'responsibilities_master') {
      loadResponsibilityTypes();
      loadInstitutionalDuties();
      if (staffList.length === 0) {
        loadStaff();
      }
    }
    if (onCloseInitialAdd && tab !== 'add') {
      onCloseInitialAdd();
    }
  };

  // Open 360° Profile Modal
  const handleOpenProfile = async (staffId: string) => {
    setSelectedStaffForProfile(staffId);
    setProfileLoading(true);
    setProfileActiveTab('overview');
    loadStaffResponsibilities(staffId);
    try {
      const res = await fetchErpStaffProfile(staffId);
      if (res.data && res.data.success) {
        setStaffProfileData(res.data as unknown as ErpStaffProfile);
      } else {
        onShowToast('error', 'Profile Not Found', 'Could not load staff dossier');
      }
    } catch (err: any) {
      onShowToast('error', 'Profile Error', err.message || 'Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  };

  // Load Staff Responsibilities
  const loadStaffResponsibilities = async (staffId: string) => {
    setResponsibilitiesLoading(true);
    try {
      const res = await fetchStaffResponsibilities(staffId);
      if (res.data && res.data.responsibilities) {
        setProfileResponsibilities(res.data.responsibilities);
      }
    } catch (err: any) {
      console.error('Error fetching responsibilities:', err);
    } finally {
      setResponsibilitiesLoading(false);
    }
  };

  // Load Responsibility Types Catalog
  const loadResponsibilityTypes = async () => {
    try {
      const res = await fetchResponsibilityTypes({ active: 'true' });
      const types = (res.data as any)?.responsibilityTypes || (res.data as any)?.responsibilities || [];
      if (types.length > 0) {
        setResponsibilityTypes(types);
        if (!assignRespForm.responsibility_type_id) {
          const first = types[0];
          setAssignRespForm(prev => ({
            ...prev,
            responsibility_type_id: first.id,
            scope_type: (first.default_scope_type || 'SECTION') as ResponsibilityScopeType
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load responsibility types:', err);
    }
  };

  // Load All Institutional Responsibilities (Across School)
  const loadInstitutionalDuties = useCallback(async () => {
    setDutiesLoading(true);
    try {
      const res = await fetchInstitutionalDuties({ session: activeSession || '2026-27' });
      if (res.data && res.data.responsibilities) {
        setInstitutionalDuties(res.data.responsibilities);
      }
    } catch (err: any) {
      console.warn('Failed to load institutional duties:', err.message);
    } finally {
      setDutiesLoading(false);
    }
  }, [activeSession]);

  // Handle Global Responsibility Assignment for any Teacher/Staff
  const handleAssignGlobalDuty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalDutyForm.staffId || !globalDutyForm.responsibility_type_id) {
      onShowToast('warning', 'Selection Required', 'Please choose both staff member and incharge role.');
      return;
    }
    setSubmittingGlobalDuty(true);
    try {
      const res = await assignStaffResponsibility(globalDutyForm.staffId, {
        responsibility_type_id: globalDutyForm.responsibility_type_id,
        scope_type: globalDutyForm.scope_type,
        scope_id: globalDutyForm.scope_id,
        scope_name: globalDutyForm.scope_name,
        academic_session_id: globalDutyForm.academic_session_id,
        is_primary: globalDutyForm.is_primary,
        start_date: globalDutyForm.start_date,
        end_date: globalDutyForm.end_date || null,
        notes: globalDutyForm.notes
      });

      if (res.data && res.data.success) {
        onShowToast('success', 'Institutional Duty Assigned', res.data.message || 'Staff responsibility recorded.');
        setShowGlobalAssignDutyModal(false);
        setGlobalDutyForm({
          staffId: '',
          responsibility_type_id: '',
          scope_type: 'SCHOOL',
          scope_id: 'sch-main',
          scope_name: 'Institutional School Scope',
          academic_session_id: activeSession || '2026-27',
          is_primary: false,
          start_date: new Date().toISOString().split('T')[0],
          end_date: '',
          notes: ''
        });
        loadInstitutionalDuties();
        loadResponsibilityTypes();
        loadStaff();
      } else {
        onShowToast('error', 'Assignment Failed', res.data?.message || 'Could not assign duty.');
      }
    } catch (err: any) {
      onShowToast('error', 'Assignment Error', err.message || 'Error recording incharge assignment.');
    } finally {
      setSubmittingGlobalDuty(false);
    }
  };

  // Export Institutional Duties CSV
  const handleExportDutiesCsv = () => {
    if (institutionalDuties.length === 0) {
      onShowToast('info', 'No Duties to Export', 'There are currently no assigned institutional duties.');
      return;
    }
    const headers = ['Staff Name', 'Employee Code', 'Designation', 'Department', 'Phone', 'Incharge Duty', 'Duty Code', 'Scope Type', 'Scope Target', 'Academic Session', 'Primary'];
    const rows = institutionalDuties.map(d => [
      `"${d.staff_name || ''}"`,
      `"${d.empId || ''}"`,
      `"${d.designation || ''}"`,
      `"${d.department || ''}"`,
      `"${d.phone || ''}"`,
      `"${d.responsibility_name || ''}"`,
      `"${d.responsibility_code || ''}"`,
      `"${d.scope_type || ''}"`,
      `"${d.scope_name || d.scope_id || ''}"`,
      `"${d.academic_session_id || ''}"`,
      `"${d.is_primary ? 'YES' : 'NO'}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `institutional_responsibilities_${activeSession || '2026-27'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Institutional Duty Roster
  const handlePrintDuties = () => {
    window.print();
  };

  // Assign Responsibility to Staff
  const handleAssignResponsibility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForProfile || !assignRespForm.responsibility_type_id) return;
    setAssignRespSubmitting(true);
    try {
      const res = await assignStaffResponsibility(selectedStaffForProfile, assignRespForm);
      if (res.data && res.data.success) {
        onShowToast('success', 'Responsibility Assigned', res.data.message || 'Responsibility successfully assigned to staff member.');
        setShowAssignRespModal(false);
        loadStaffResponsibilities(selectedStaffForProfile);
        loadResponsibilityTypes();
      } else {
        onShowToast('error', 'Assignment Failed', res.data?.message || 'Could not assign responsibility');
      }
    } catch (err: any) {
      onShowToast('error', 'Assignment Error', err.message || 'Failed to assign responsibility');
    } finally {
      setAssignRespSubmitting(false);
    }
  };

  // Toggle Primary Incharge Flag
  const handleTogglePrimaryResponsibility = async (respId: string, currentPrimary: boolean) => {
    if (!selectedStaffForProfile) return;
    try {
      const res = await updateStaffResponsibility(selectedStaffForProfile, respId, { is_primary: !currentPrimary });
      if (res.data && res.data.success) {
        onShowToast('success', 'Primary Responsibility Updated', res.data.message);
        loadStaffResponsibilities(selectedStaffForProfile);
      }
    } catch (err: any) {
      onShowToast('error', 'Update Error', err.message);
    }
  };

  // Toggle Incharge Active Status
  const handleToggleStatusResponsibility = async (respId: string, currentStatus: string) => {
    if (!selectedStaffForProfile) return;
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await updateStaffResponsibility(selectedStaffForProfile, respId, { status: nextStatus as any });
      if (res.data && res.data.success) {
        onShowToast('success', 'Status Updated', `Responsibility set to ${nextStatus}`);
        loadStaffResponsibilities(selectedStaffForProfile);
      }
    } catch (err: any) {
      onShowToast('error', 'Update Error', err.message);
    }
  };

  // Remove Incharge Duty
  const handleRemoveResponsibility = async (respId: string) => {
    if (!selectedStaffForProfile) return;
    if (!confirm('Are you sure you want to remove this incharge responsibility?')) return;
    try {
      const res = await removeStaffResponsibility(selectedStaffForProfile, respId);
      if (res.data && res.data.success) {
        onShowToast('success', 'Responsibility Removed', res.data.message);
        loadStaffResponsibilities(selectedStaffForProfile);
        loadResponsibilityTypes();
      }
    } catch (err: any) {
      onShowToast('error', 'Removal Error', err.message);
    }
  };

  // Create Custom Responsibility Type (School Admin)
  const handleCreateCustomRespType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRespTypeForm.code || !newRespTypeForm.name) {
      onShowToast('error', 'Missing Information', 'Code and Name are required');
      return;
    }
    setCreateRespTypeSubmitting(true);
    try {
      const res = await createResponsibilityType(newRespTypeForm);
      if (res.data && res.data.success) {
        onShowToast('success', 'Incharge Type Defined', res.data.message);
        setShowCreateRespTypeModal(false);
        setNewRespTypeForm({
          code: '',
          name: '',
          description: '',
          category: 'academics',
          default_scope_type: 'SECTION'
        });
        loadResponsibilityTypes();
      } else {
        onShowToast('error', 'Creation Failed', res.data?.message || 'Error creating type');
      }
    } catch (err: any) {
      onShowToast('error', 'Error', err.message);
    } finally {
      setCreateRespTypeSubmitting(false);
    }
  };


  // Open Teacher Assignment Modal
  const handleOpenAssignments = async (member: ErpStaffRecord) => {
    setAssignmentModalStaff(member);
    setAssignmentLoading(true);
    setNewAssignment({
      grade: 'Class 10',
      section: 'A',
      subject: member.subjectSpecialization ? member.subjectSpecialization.split('&')[0].trim() : 'Mathematics',
      academicSession: activeSession || '2026-27'
    });
    try {
      const res = await fetchTeacherAssignments(member.id);
      if (res.data && res.data.assignments) {
        setCurrentAssignments(res.data.assignments);
      }
    } catch (err: any) {
      onShowToast('error', 'Assignments Error', err.message || 'Failed to load teacher assignments');
    } finally {
      setAssignmentLoading(false);
    }
  };

  // Create Teacher Assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentModalStaff) return;

    // Check client-side for immediate duplicate
    const exists = currentAssignments.some(
      a => a.academicSession === newAssignment.academicSession &&
           a.grade === newAssignment.grade &&
           a.section === newAssignment.section &&
           a.subject.toLowerCase() === newAssignment.subject.toLowerCase()
    );

    if (exists) {
      onShowToast('warning', 'Duplicate Assignment', `${assignmentModalStaff.name} is already assigned to ${newAssignment.grade}-${newAssignment.section} for ${newAssignment.subject}.`);
      return;
    }

    setAssignmentSubmitting(true);
    try {
      const res = await createTeacherAssignment(assignmentModalStaff.id, newAssignment);
      if (res.data && res.data.assignment) {
        setCurrentAssignments(prev => [...prev, res.data.assignment]);
        onShowToast('success', 'Assignment Saved', `Assigned ${newAssignment.grade}-${newAssignment.section} (${newAssignment.subject}) to ${assignmentModalStaff.name}`);
        // If currently viewing profile of this staff, refresh profile
        if (selectedStaffForProfile === assignmentModalStaff.id) {
          handleOpenProfile(assignmentModalStaff.id);
        }
      }
    } catch (err: any) {
      onShowToast('error', 'Assignment Failed', err.message || 'Could not assign class to teacher');
    } finally {
      setAssignmentSubmitting(false);
    }
  };

  // Delete Teacher Assignment
  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!assignmentModalStaff) return;
    try {
      await deleteTeacherAssignment(assignmentModalStaff.id, assignmentId);
      setCurrentAssignments(prev => prev.filter(a => a.id !== assignmentId));
      onShowToast('info', 'Assignment Removed', 'Teacher has been unassigned from this section');
      if (selectedStaffForProfile === assignmentModalStaff.id) {
        handleOpenProfile(assignmentModalStaff.id);
      }
    } catch (err: any) {
      onShowToast('error', 'Delete Failed', err.message || 'Could not remove assignment');
    }
  };

  // Soft Deactivate / Toggle Status with Principal Authorization
  const handleToggleActive = async (member: ErpStaffRecord) => {
    if (!canModifyStaff) {
      onShowToast('error', 'Unauthorized', 'Only School Admins & Principal can alter staff operational status');
      return;
    }
    if (member.status === 'inactive' || member.isActive === false) {
      // Reactivate directly
      setIsDeactivatingId(member.id);
      try {
        const res = await updateErpStaff(member.id, { status: 'active', isActive: true });
        if (res.data) {
          onShowToast('success', 'Staff Member Reactivated', `${member.name} status is now active`);
          loadStaff();
        }
      } catch (err: any) {
        onShowToast('error', 'Reactivation Failed', err.message || 'Could not reactivate staff');
      } finally {
        setIsDeactivatingId(null);
      }
    } else {
      // Deactivating active faculty strictly requires Principal OTP Authorization
      handleInitiateStaffDeactivation(member);
    }
  };

  // Initiate Staff Deactivation via Principal Security Gate
  const handleInitiateStaffDeactivation = (member: ErpStaffRecord) => {
    if (!canModifyStaff) {
      onShowToast('error', 'Unauthorized', 'Only School Admins & Principal can alter faculty operational status');
      return;
    }
    setPendingProtectedAction({ type: 'deactivate', member });
    setShowPrincipalOtpModal(true);
  };

  // Initiate Staff Removal via Principal Security Gate
  const handleInitiateStaffRemoval = (member: ErpStaffRecord) => {
    if (!canModifyStaff) {
      onShowToast('error', 'Unauthorized', 'Only School Admins & Principal can remove faculty records');
      return;
    }
    setPendingProtectedAction({ type: 'delete', member });
    setShowPrincipalOtpModal(true);
  };

  // Callback once Principal OTP Authorization has succeeded
  const handlePrincipalAuthConfirmed = async (authData: { authToken: string; authorizedBy: string; reason: string }) => {
    if (!pendingProtectedAction) return;
    const { type, member } = pendingProtectedAction;

    try {
      if (type === 'delete') {
        await deleteErpStaff(member.id, false, {
          token: authData.authToken,
          reason: authData.reason
        });
        onShowToast('success', 'Faculty Removed with Principal Authorization', `${member.name} (${member.empId}) removed with authorization from Principal ${authData.authorizedBy}.`);
      } else {
        await deactivateErpStaff(member.id, {
          token: authData.authToken,
          reason: authData.reason
        });
        onShowToast('success', 'Faculty Deactivated with Principal Authorization', `${member.name} (${member.empId}) deactivated with authorization from Principal ${authData.authorizedBy}.`);
      }
      loadStaff(true);
    } catch (err: any) {
      onShowToast('error', 'Action Execution Failed', err.message || 'Could not complete faculty action');
    } finally {
      setPendingProtectedAction(null);
      setShowPrincipalOtpModal(false);
    }
  };

  // Submit Add Staff Form
  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!addForm.empId.trim()) {
      setFormError('Employee ID / Code is required (e.g. EMP-2026-009)');
      return;
    }
    if (!addForm.firstName.trim() || !addForm.lastName.trim()) {
      setFormError('First and Last names are mandatory');
      return;
    }
    if (!addForm.phone.trim()) {
      setFormError('Primary Contact Phone number is required');
      return;
    }
    if (!addForm.email.trim()) {
      setFormError('Email address is required for ERP portal access');
      return;
    }

    setIsSubmitting(true);
    try {
      const fullName = `${addForm.firstName.trim()} ${addForm.lastName.trim()}`;
      const payload: Partial<ErpStaffRecord> = {
        empId: addForm.empId.trim().toUpperCase(),
        firstName: addForm.firstName.trim(),
        lastName: addForm.lastName.trim(),
        name: fullName,
        gender: addForm.gender,
        dob: addForm.dob,
        bloodGroup: addForm.bloodGroup,
        photoUrl: addForm.photoUrl.trim() || undefined,
        role: addForm.staffType === 'Teacher' ? 'teacher' : (addForm.staffType === 'Admin' ? 'admin' : 'support'),
        staffType: addForm.staffType,
        designation: addForm.designation.trim(),
        department: addForm.department,
        employmentType: addForm.employmentType,
        joiningDate: addForm.joiningDate,
        qualification: addForm.qualification.trim(),
        experienceYears: Number(addForm.experienceYears) || 0,
        subjectSpecialization: addForm.subjectSpecialization.trim() || undefined,
        phone: addForm.phone.trim(),
        altPhone: addForm.altPhone.trim() || undefined,
        email: addForm.email.trim().toLowerCase(),
        address: addForm.address.trim(),
        city: addForm.city.trim(),
        state: addForm.state.trim(),
        pinCode: addForm.pinCode.trim(),
        salaryINR: Number(addForm.salaryINR) || 0,
        status: addForm.status,
        isActive: addForm.status === 'active',
        documents: [
          ...(addForm.docAadhaar ? [{ id: 'doc-1', name: 'Aadhaar / National ID', type: 'id_proof', verified: true, uploadedAt: new Date().toISOString().split('T')[0] }] : []),
          ...(addForm.docDegrees ? [{ id: 'doc-2', name: 'Degree & B.Ed. Certificates', type: 'degree', verified: true, uploadedAt: new Date().toISOString().split('T')[0] }] : []),
          ...(addForm.docExperience ? [{ id: 'doc-3', name: 'Relieving & Experience Letter', type: 'experience', verified: true, uploadedAt: new Date().toISOString().split('T')[0] }] : []),
          ...(addForm.docPoliceClearance ? [{ id: 'doc-4', name: 'Police Verification Certificate', type: 'police_verification', verified: true, uploadedAt: new Date().toISOString().split('T')[0] }] : [])
        ]
      };

      const res = await createErpStaff(payload);
      if (res.data && res.data.staff) {
        onShowToast('success', 'Staff Member Enrolled', `${fullName} (${payload.empId}) successfully added to ERP faculty roster.`);
        // Reset form
        setAddForm({
          empId: '',
          firstName: '',
          lastName: '',
          gender: 'Female',
          dob: '1988-06-15',
          bloodGroup: 'O+',
          photoUrl: '',
          staffType: 'Teacher',
          designation: 'PGT Mathematics',
          department: 'Academics',
          employmentType: 'Full-time',
          joiningDate: new Date().toISOString().split('T')[0],
          qualification: 'M.Sc. Mathematics, B.Ed.',
          experienceYears: 6,
          subjectSpecialization: 'Mathematics & Statistics',
          phone: '',
          altPhone: '',
          email: '',
          address: '',
          city: 'Gurugram',
          state: 'Haryana',
          pinCode: '122001',
          salaryINR: 58000,
          status: 'active',
          docAadhaar: true,
          docDegrees: true,
          docExperience: true,
          docPoliceClearance: false
        });
        setAddFormSection('personal');
        setActiveSubTab('directory');
        if (onCloseInitialAdd) onCloseInitialAdd();
        loadStaff();
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to enroll staff member. Check for duplicate employee code.');
      onShowToast('error', 'Enrollment Error', err.message || 'Check form inputs');
    } finally {
      setIsSubmitting(false);
    }
  };

  // CSV Dry Run Validation
  const handleValidateCsv = async () => {
    if (!importCsvText.trim()) {
      onShowToast('error', 'CSV Empty', 'Please provide or paste CSV content');
      return;
    }
    setIsValidatingImport(true);
    try {
      const lines = importCsvText.trim().split('\n');
      if (lines.length < 2) {
        onShowToast('error', 'Invalid CSV', 'CSV must contain at least a header row and one data row');
        return;
      }
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const parsedRows = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
        const rowObj: any = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });
        parsedRows.push({
          empId: rowObj['Employee Code'] || rowObj['empId'] || rowObj['Emp ID'] || rowObj['Code'],
          name: rowObj['Full Name'] || rowObj['Name'] || rowObj['Staff Name'] || rowObj['name'],
          staffType: rowObj['Staff Type'] || rowObj['staffType'] || 'Teacher',
          designation: rowObj['Designation'] || rowObj['designation'] || 'Teacher',
          department: rowObj['Department'] || rowObj['department'] || 'Academics',
          employmentType: rowObj['Employment Type'] || rowObj['employmentType'] || 'Full-time',
          email: rowObj['Email'] || rowObj['email'] || '',
          phone: rowObj['Phone'] || rowObj['phone'] || '',
          qualification: rowObj['Qualification'] || rowObj['qualification'] || '',
          experienceYears: Number(rowObj['Experience Years'] || rowObj['experienceYears']) || 0,
          salaryINR: Number(rowObj['Salary INR'] || rowObj['salaryINR']) || 40000,
          joiningDate: rowObj['Joining Date'] || rowObj['joiningDate'] || new Date().toISOString().split('T')[0],
          gender: rowObj['Gender'] || rowObj['gender'] || 'Other',
          subjectSpecialization: rowObj['Subject Specialization'] || rowObj['subjectSpecialization'] || ''
        });
      }

      const res = await importErpStaff(parsedRows, true);
      if (res.data) {
        setImportDryRunResult(res.data as unknown as StaffImportResult);
        if (res.data.validCount && res.data.validCount > 0) {
          onShowToast('info', 'Validation Complete', `${res.data.validCount} valid rows ready for import. ${res.data.invalidCount || 0} errors detected.`);
        } else {
          onShowToast('warning', 'Validation Warnings', 'No valid rows found. Review error table below.');
        }
      }
    } catch (err: any) {
      onShowToast('error', 'Validation Failed', err.message || 'Error executing CSV dry-run');
    } finally {
      setIsValidatingImport(false);
    }
  };

  // CSV Final Import
  const handleConfirmImport = async () => {
    if (!importDryRunResult || !importDryRunResult.validCount || importDryRunResult.validCount === 0) {
      onShowToast('error', 'No Valid Records', 'Cannot import without valid records');
      return;
    }
    setIsImporting(true);
    try {
      const lines = importCsvText.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const parsedRows = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
        const rowObj: any = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });
        parsedRows.push({
          empId: rowObj['Employee Code'] || rowObj['empId'] || rowObj['Emp ID'] || rowObj['Code'],
          name: rowObj['Full Name'] || rowObj['Name'] || rowObj['Staff Name'] || rowObj['name'],
          staffType: rowObj['Staff Type'] || rowObj['staffType'] || 'Teacher',
          designation: rowObj['Designation'] || rowObj['designation'] || 'Teacher',
          department: rowObj['Department'] || rowObj['department'] || 'Academics',
          employmentType: rowObj['Employment Type'] || rowObj['employmentType'] || 'Full-time',
          email: rowObj['Email'] || rowObj['email'] || '',
          phone: rowObj['Phone'] || rowObj['phone'] || '',
          qualification: rowObj['Qualification'] || rowObj['qualification'] || '',
          experienceYears: Number(rowObj['Experience Years'] || rowObj['experienceYears']) || 0,
          salaryINR: Number(rowObj['Salary INR'] || rowObj['salaryINR']) || 40000,
          joiningDate: rowObj['Joining Date'] || rowObj['joiningDate'] || new Date().toISOString().split('T')[0],
          gender: rowObj['Gender'] || rowObj['gender'] || 'Other',
          subjectSpecialization: rowObj['Subject Specialization'] || rowObj['subjectSpecialization'] || ''
        });
      }

      const res = await importErpStaff(parsedRows, false, organizationId);
      if (res.data) {
        onShowToast('success', 'Import Completed', `Successfully enrolled ${res.data.importedCount || 0} faculty members into ERP!`);
        setImportCsvText('');
        setImportDryRunResult(null);
        setActiveSubTab('directory');
        loadStaff();
      }
    } catch (err: any) {
      onShowToast('error', 'Import Failed', err.message || 'Failed to import staff records');
    } finally {
      setIsImporting(false);
    }
  };

  // Sample CSV Template Generator
  const handleDownloadSampleCsv = () => {
    const csvContent =
      'Employee Code,Full Name,Staff Type,Designation,Department,Employment Type,Email,Phone,Qualification,Experience Years,Salary INR,Joining Date,Gender,Subject Specialization\n' +
      'EMP-2026-101,Vandana Joshi,Teacher,PGT Chemistry,Science & Math,Full-time,vandana.joshi@school.edu,+91 98765 00001,M.Sc. Organic Chemistry B.Ed.,8,62000,2022-06-01,Female,Organic Chemistry\n' +
      'EMP-2026-102,Karan Singhania,Non-Teaching,Administrative Officer,Administration,Full-time,karan.singhania@school.edu,+91 98765 00002,MBA Operations,5,52000,2023-01-10,Male,School Logistics & ERP\n' +
      'EMP-2026-103,Sarita Choudhury,Teacher,TGT Social Science,Languages & Humanities,Full-time,sarita.c@school.edu,+91 98765 00003,M.A. History B.Ed.,4,48000,2024-04-01,Female,History & Civics';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'staff_import_sample_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export CSV of current view
  const handleExportCsv = () => {
    const url = getErpStaffExportUrl({
      staffType: filterStaffType !== 'all' ? filterStaffType : undefined,
      department: filterDepartment !== 'all' && filterDepartment !== 'All Departments' ? filterDepartment : undefined,
      designation: filterDesignation !== 'all' && filterDesignation !== 'All Designations' ? filterDesignation : undefined,
      status: filterStatus !== 'all' ? filterStatus : undefined,
      search: searchQuery.trim() || undefined
    }, 'csv');
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & 4 REAL TENANT KPI METRICS */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black tracking-tight text-slate-950">Staff & Teacher Management</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 font-mono font-bold">
                  Session {activeSession}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono uppercase tracking-wider font-bold">
                  UDISE+ / CBSE Compliant
                </span>
              </div>
              <p className="text-xs text-slate-600 font-mono mt-0.5 font-medium">
                Centralized faculty directory, statutory incharge duties, live attendance registers & Principal security authorization.
              </p>
            </div>
          </div>

          {/* Sub-navigation Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleSubTabChange('directory')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 border ${
                activeSubTab === 'directory'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100 hover:text-slate-950'
              }`}
            >
              <Users className="w-4 h-4 text-cyan-600" />
              <span>All Staff</span>
            </button>

            <button
              onClick={() => handleSubTabChange('teachers')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 border ${
                activeSubTab === 'teachers'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100 hover:text-slate-950'
              }`}
            >
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Teachers ({kpiSummary.teachers})</span>
            </button>

            <button
              onClick={() => handleSubTabChange('non_teaching')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 border ${
                activeSubTab === 'non_teaching'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100 hover:text-slate-950'
              }`}
            >
              <Briefcase className="w-4 h-4 text-purple-600" />
              <span>Non-Teaching ({kpiSummary.nonTeaching})</span>
            </button>

            <button
              onClick={() => {
                handleSubTabChange('responsibilities_master');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 border ${
                activeSubTab === 'responsibilities_master'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100 hover:text-slate-950'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Incharges & Roles ({institutionalDuties.length})</span>
            </button>

            {canModifyStaff && (
              <button
                onClick={() => handleSubTabChange('add')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 border ${
                  activeSubTab === 'add'
                    ? 'bg-indigo-700 text-white border-indigo-700 shadow-md'
                    : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <UserPlus className="w-4 h-4 text-indigo-600" />
                <span>Add Staff</span>
              </button>
            )}

            {canModifyStaff && (
              <button
                onClick={() => handleSubTabChange('import')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 border ${
                  activeSubTab === 'import'
                    ? 'bg-indigo-700 text-white border-indigo-700 shadow-md'
                    : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Batch CSV Import</span>
              </button>
            )}

            <button
              onClick={handleExportCsv}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold font-mono flex items-center gap-1.5 transition-all shadow-sm"
              title="Download CSV of current filter view"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={() => loadStaff(true)}
              disabled={refreshing}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-all shadow-sm"
              title="Refresh Faculty Roster"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* 4 Live KPI Summary Cards on Crisp White Background */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: All Staff on Payroll */}
          <div
            onClick={() => {
              setFilterStaffType('all');
              handleSubTabChange('directory');
            }}
            className="p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-slate-400 shadow-sm transition-all cursor-pointer group flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-700 font-mono font-black tracking-wide">ALL STAFF ON PAYROLL</div>
              <span className="p-2 rounded-xl bg-slate-100 group-hover:bg-slate-200 text-slate-800 transition-colors">
                <Users className="w-4 h-4 text-slate-900" />
              </span>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-950">{kpiSummary.total}</div>
              <div className="text-[11px] text-slate-600 font-mono mt-0.5 font-bold">Total Enrolled Faculty & Staff</div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-600">Active: <strong className="text-emerald-700 font-bold">{kpiSummary.payroll?.activeOnPayroll ?? kpiSummary.active}</strong></span>
              <span className="text-slate-600">Gross: <strong className="text-slate-900 font-bold">₹{(kpiSummary.payroll?.monthlyGrossINR ?? 0).toLocaleString('en-IN')}</strong></span>
            </div>
          </div>

          {/* Card 2: Teaching Faculty */}
          <div
            onClick={() => {
              handleSubTabChange('teachers');
            }}
            className="p-5 rounded-2xl bg-white border-2 border-indigo-200 hover:border-indigo-400 shadow-sm transition-all cursor-pointer group flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs text-indigo-950 font-mono font-black tracking-wide">TEACHING FACULTY</div>
              <span className="p-2 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 text-indigo-700 transition-colors">
                <GraduationCap className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-950">{kpiSummary.teachers}</span>
                <span className="text-[11px] text-indigo-900 font-mono font-bold">Educators</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-950 font-mono text-[10px] font-black">
                  PGT: {kpiSummary.teachingBreakdown?.pgt ?? 2}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-950 font-mono text-[10px] font-black">
                  TGT: {kpiSummary.teachingBreakdown?.tgt ?? 1}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-950 font-mono text-[10px] font-black">
                  PRT: {kpiSummary.teachingBreakdown?.prt ?? 2}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-indigo-100 flex items-center justify-between text-[11px] font-mono">
              <span className="text-emerald-700 font-bold">Present: {kpiSummary.teachingBreakdown?.present ?? 3}</span>
              <span className="text-blue-700 font-bold">On-Duty: {kpiSummary.teachingBreakdown?.onDuty ?? 1}</span>
              <span className="text-amber-700 font-bold">Leave: {kpiSummary.teachingBreakdown?.onLeave ?? 1}</span>
            </div>
          </div>

          {/* Card 3: Non-Teaching Staff */}
          <div
            onClick={() => {
              handleSubTabChange('non_teaching');
            }}
            className="p-5 rounded-2xl bg-white border-2 border-purple-200 hover:border-purple-400 shadow-sm transition-all cursor-pointer group flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs text-purple-950 font-mono font-black tracking-wide">NON-TEACHING STAFF</div>
              <span className="p-2 rounded-xl bg-purple-50 group-hover:bg-purple-100 text-purple-700 transition-colors">
                <Briefcase className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-950">{kpiSummary.nonTeaching}</span>
                <span className="text-[11px] text-purple-900 font-mono font-bold">Staff Members</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                <span className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-950 font-mono text-[10px] font-black">
                  Admin: {kpiSummary.nonTeachingBreakdown?.admin ?? 3}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-950 font-mono text-[10px] font-black">
                  Transport: {kpiSummary.nonTeachingBreakdown?.transport ?? 2}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-950 font-mono text-[10px] font-black">
                  Support: {kpiSummary.nonTeachingBreakdown?.support ?? 2}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-purple-100 flex items-center justify-between text-[11px] font-mono">
              <span className="text-emerald-700 font-bold">Present: {kpiSummary.nonTeachingBreakdown?.present ?? 4}</span>
              <span className="text-blue-700 font-bold">On-Duty: {kpiSummary.nonTeachingBreakdown?.onDuty ?? 1}</span>
              <span className="text-amber-700 font-bold">Leave: {kpiSummary.nonTeachingBreakdown?.onLeave ?? 2}</span>
            </div>
          </div>

          {/* Card 4: On Leave Today */}
          <div className="p-5 rounded-2xl bg-white border-2 border-amber-200 hover:border-amber-400 shadow-sm transition-all flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-amber-950 font-mono font-black tracking-wide">ON LEAVE TODAY</div>
              <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-700">{kpiSummary.onLeaveToday}</span>
                <span className="text-[11px] text-amber-900 font-mono font-bold">Approved Absences</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-950 font-mono text-[10px] font-black">
                  CL: {kpiSummary.leaveBreakdown?.cl ?? 1}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-950 font-mono text-[10px] font-black">
                  EL: {kpiSummary.leaveBreakdown?.el ?? 1}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-950 font-mono text-[10px] font-black">
                  Medical: {kpiSummary.leaveBreakdown?.medical ?? 1}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-950 font-mono text-[10px] font-black">
                  Other: {kpiSummary.leaveBreakdown?.other ?? 0}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-amber-100 flex items-center justify-between text-[11px] font-mono text-slate-600">
              <span>Daily Absences Register</span>
              <span className="text-amber-800 font-bold">Real Tenant Data</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2B. INCHARGES & INSTITUTIONAL RESPONSIBILITIES */}
      {/* ========================================================================= */}
      {activeSubTab === 'responsibilities_master' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-amber-600" />
                <h3 className="text-base font-black text-slate-950">Teachers Charges & Institutional Responsibilities</h3>
              </div>
              <p className="text-xs text-slate-600 font-mono mt-1">
                Statutory CBSE & State Board incharge duties, portfolio assignments, and data authorization scopes.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {canModifyStaff && (
                <button
                  onClick={() => setShowGlobalAssignDutyModal(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-bold font-mono flex items-center gap-2 shadow-sm transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>+ Assign Incharge / Duty</span>
                </button>
              )}
              <button
                onClick={handlePrintDuties}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold font-mono flex items-center gap-1.5 transition-all shadow-sm"
                title="Print Institutional Responsibility Duty Chart"
              >
                <Printer className="w-4 h-4 text-slate-700" />
                <span>Print Duties</span>
              </button>
              <button
                onClick={handleExportDutiesCsv}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold font-mono flex items-center gap-1.5 transition-all shadow-sm"
                title="Export Duties to CSV"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Subtab Toggle: Duties Roster vs Catalog */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setDutySubTab('duties_roster')}
              className={`px-4 py-2 rounded-xl text-xs font-black font-mono transition-all border ${
                dutySubTab === 'duties_roster'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Active Institutional Charges & Duties ({institutionalDuties.length})
            </button>
            <button
              onClick={() => setDutySubTab('master_templates')}
              className={`px-4 py-2 rounded-xl text-xs font-black font-mono transition-all border ${
                dutySubTab === 'master_templates'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Statutory Role Templates Catalog ({responsibilityTypes.length})
            </button>
          </div>

          {/* View 1: Active Duties Roster */}
          {dutySubTab === 'duties_roster' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by teacher name, emp code, incharge role or scope..."
                    value={dutySearchTerm}
                    onChange={(e) => setDutySearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-xs font-mono focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  {dutySearchTerm && (
                    <button
                      onClick={() => setDutySearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  Showing <strong>{institutionalDuties.filter(d => !dutySearchTerm || (d.staff_name || '').toLowerCase().includes(dutySearchTerm.toLowerCase()) || (d.responsibility_name || '').toLowerCase().includes(dutySearchTerm.toLowerCase()) || (d.empId || '').toLowerCase().includes(dutySearchTerm.toLowerCase())).length}</strong> statutory duties
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
                <table className="w-full text-left text-xs font-mono text-slate-900">
                  <thead className="bg-slate-100 text-slate-900 uppercase text-[10px] tracking-wider border-b border-slate-200 font-black">
                    <tr>
                      <th className="py-3 px-4">Staff / Teacher</th>
                      <th className="py-3 px-4">Incharge Portfolio</th>
                      <th className="py-3 px-4">Scope Target</th>
                      <th className="py-3 px-4">Session</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4 text-center">Designation Type</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dutiesLoading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
                            <span>Loading institutional duties roster...</span>
                          </div>
                        </td>
                      </tr>
                    ) : institutionalDuties.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <ShieldCheck className="w-8 h-8 text-slate-400" />
                            <span className="font-bold text-slate-700">No Incharge Duties Assigned</span>
                            <span className="text-[11px] text-slate-500">
                              Click "+ Assign Incharge / Duty" to allocate school responsibilities.
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      institutionalDuties
                        .filter(d => !dutySearchTerm || 
                          (d.staff_name || '').toLowerCase().includes(dutySearchTerm.toLowerCase()) || 
                          (d.responsibility_name || '').toLowerCase().includes(dutySearchTerm.toLowerCase()) || 
                          (d.empId || '').toLowerCase().includes(dutySearchTerm.toLowerCase()) ||
                          (d.scope_name || '').toLowerCase().includes(dutySearchTerm.toLowerCase())
                        )
                        .map((duty) => (
                          <tr key={duty.id} className="hover:bg-amber-50/30 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-indigo-700 text-xs shrink-0">
                                  {(duty.staff_name || 'T').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-950 text-xs">{duty.staff_name}</div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                    <span className="text-indigo-700 font-bold">{duty.empId || 'FAC'}</span>
                                    <span>•</span>
                                    <span>{duty.designation || 'Faculty'}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <span className="font-bold text-slate-900">{duty.responsibility_name}</span>
                                <div className="text-[10px] text-amber-700 font-bold">{duty.responsibility_code}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-bold text-[10px]">
                                  {duty.scope_type}: {duty.scope_name || duty.scope_id}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono text-slate-700">{duty.academic_session_id || '2026-27'}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-[11px] text-slate-700">
                                <div>{duty.phone || '—'}</div>
                                <div className="text-slate-500 text-[10px]">{duty.email || '—'}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {duty.is_primary ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px]">
                                  Primary Lead
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px]">
                                  Co-Incharge
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {canModifyStaff && (
                                <button
                                  onClick={() => handleRemoveResponsibility(duty.id)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                                  title="Unassign Incharge Duty"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* View 2: Master Templates Catalog */}
          {dutySubTab === 'master_templates' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['all', 'academics', 'examinations', 'student_welfare', 'special_programs', 'co_curricular', 'administration'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setRespMasterCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all border ${
                        respMasterCategory === cat
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {cat.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={respMasterSearch}
                    onChange={(e) => setRespMasterSearch(e.target.value)}
                    placeholder="Search templates or codes..."
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {responsibilityTypes
                  .filter(t => respMasterCategory === 'all' || (t.category || '').toLowerCase() === respMasterCategory)
                  .filter(t => !respMasterSearch || t.name.toLowerCase().includes(respMasterSearch.toLowerCase()) || t.code.toLowerCase().includes(respMasterSearch.toLowerCase()))
                  .map((type) => (
                    <div
                      key={type.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-400 shadow-sm transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-slate-950 text-xs">{type.name}</h4>
                            <span className="text-[10px] font-mono text-amber-700 font-bold">{type.code}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[9px] font-mono uppercase font-bold">
                            {type.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed font-sans">
                          {type.description}
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100 text-[10px] font-mono">
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Default Scope:</span>
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold">
                            {type.default_scope_type}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Active Holders:</span>
                          <span className="text-slate-950 font-bold">{type.activeHoldersCount || 0} staff</span>
                        </div>
                        {canModifyStaff && (
                          <div className="pt-2">
                            <button
                              onClick={() => {
                                setGlobalDutyForm(prev => ({
                                  ...prev,
                                  responsibility_type_id: type.id,
                                  scope_type: (type.default_scope_type || 'SCHOOL') as ResponsibilityScopeType
                                }));
                                setShowGlobalAssignDutyModal(true);
                              }}
                              className="w-full py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Assign Staff to this Role</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DIRECTORY VIEW (ALL / TEACHERS / NON-TEACHING) */}
      {/* ========================================================================= */}
      {(activeSubTab === 'directory' || activeSubTab === 'teachers' || activeSubTab === 'non_teaching') && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          {/* Filters and Search Bar */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff by Name, Employee Code, Subject, Phone, Email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-950 placeholder-slate-400 text-xs font-mono focus:outline-none focus:border-indigo-600 transition-colors shadow-sm font-semibold"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Department Filter */}
            <select
              value={filterDepartment}
              onChange={(e) => { setFilterDepartment(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-indigo-600 shadow-sm"
            >
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept === 'All Departments' ? 'all' : dept}>{dept}</option>
              ))}
            </select>

            {/* Designation Filter */}
            <select
              value={filterDesignation}
              onChange={(e) => { setFilterDesignation(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-indigo-600 shadow-sm"
            >
              {DESIGNATIONS.map(desig => (
                <option key={desig} value={desig === 'All Designations' ? 'all' : desig}>{desig}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-indigo-600 shadow-sm"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-indigo-600 shadow-sm"
            >
              <option value="name">Sort by Name</option>
              <option value="empId">Sort by Code</option>
              <option value="designation">Sort by Designation</option>
              <option value="department">Sort by Department</option>
              <option value="joiningDate">Sort by Joining</option>
            </select>

            {/* Sort Order Toggle */}
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 transition-all shadow-sm"
              title={`Sorting: ${sortOrder.toUpperCase()}`}
            >
              <ArrowUpDown className="w-4 h-4 text-indigo-600" />
            </button>
          </div>

          {/* Staff Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
            <table className="w-full text-left text-xs font-mono text-slate-900">
              <thead className="bg-slate-100 text-slate-900 uppercase text-[10px] tracking-wider border-b border-slate-200 font-black">
                <tr>
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4">Designation & Cadre</th>
                  <th className="py-3.5 px-4">Department & Subject</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Experience & Join</th>
                  <th className="py-3.5 px-4">Payroll Gross</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                        <span className="font-bold text-slate-700">Loading faculty roster...</span>
                      </div>
                    </td>
                  </tr>
                ) : staffList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 text-slate-400" />
                        <span className="text-slate-800 font-bold">No Staff Members Found</span>
                        <span className="text-[11px] text-slate-500">
                          Try adjusting search filters or enroll a new faculty member.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  staffList.map((member) => {
                    const isTeacher = member.staffType === 'Teacher' || member.role === 'teacher';
                    const isInactive = member.status === 'inactive' || member.isActive === false;
                    const isOnLeave = member.status === 'on_leave';

                    return (
                      <tr
                        key={member.id}
                        className="hover:bg-indigo-50/30 transition-colors group"
                      >
                        {/* Member Name + Emp ID + Avatar */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-indigo-700 text-xs shrink-0 shadow-sm">
                              {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <button
                                onClick={() => handleOpenProfile(member.id)}
                                className="font-black text-slate-950 hover:text-indigo-600 text-xs transition-colors text-left flex items-center gap-1.5"
                              >
                                <span>{member.name}</span>
                              </button>
                              <div className="flex items-center gap-2 text-[10px] text-slate-600 mt-0.5">
                                <span className="text-indigo-700 font-black bg-indigo-50 px-1 py-0.2 rounded border border-indigo-200">{member.empId}</span>
                                <span>•</span>
                                <span>{member.gender || 'Not specified'}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Designation & Staff Type */}
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-bold text-slate-900">{member.designation}</span>
                            <div className="mt-1">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                                isTeacher
                                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                  : 'bg-purple-50 text-purple-800 border-purple-200'
                              }`}>
                                {member.staffType || 'Staff'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Department & Specialization */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <div className="text-slate-900 font-bold">{member.department}</div>
                            {member.subjectSpecialization && (
                              <div className="text-[11px] text-slate-700 font-medium flex items-center gap-1 truncate max-w-[200px]">
                                <BookOpen className="w-3 h-3 text-indigo-600 shrink-0" />
                                <span className="truncate">{member.subjectSpecialization}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1 text-[11px]">
                            <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                              <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                              <span>{member.phone}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-600 truncate max-w-[180px]">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{member.email}</span>
                            </div>
                          </div>
                        </td>

                        {/* Experience & Qualification */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5 text-[11px]">
                            <div className="text-slate-900 font-bold">
                              {member.experienceYears ? `${member.experienceYears} yrs exp` : 'Fresher'}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              Joined {member.joiningDate || '—'}
                            </div>
                          </div>
                        </td>

                        {/* Payroll Gross */}
                        <td className="py-3.5 px-4">
                          <div className="font-black text-slate-950 text-xs">
                            ₹{(Number(member.salaryINR) || 50000).toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] text-emerald-700 font-bold">Enrolled on Payroll</div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4 text-center">
                          {isInactive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-300 shadow-sm">
                              <XCircle className="w-2.5 h-2.5 text-rose-600" />
                              Inactive
                            </span>
                          ) : isOnLeave ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-sm">
                              <Clock className="w-2.5 h-2.5 text-amber-600" />
                              On Leave
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-sm">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              Active
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* 360° Profile Dossier */}
                            <button
                              onClick={() => handleOpenProfile(member.id)}
                              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 hover:text-indigo-600 border border-slate-300 transition-colors shadow-sm"
                              title="View 360° Staff Profile"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Class/Subject Assignments (for Teachers) */}
                            {isTeacher && (
                              <button
                                onClick={() => handleOpenAssignments(member)}
                                className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors shadow-sm"
                                title="Manage Class & Subject Assignments"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Soft Deactivate / Reactivate with Principal OTP */}
                            {canModifyStaff && (
                              <button
                                onClick={() => handleToggleActive(member)}
                                disabled={isDeactivatingId === member.id}
                                className={`p-1.5 rounded-lg border transition-colors shadow-sm ${
                                  isInactive
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                                    : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300'
                                }`}
                                title={isInactive ? 'Reactivate Staff Member' : 'Deactivate Staff (Requires Principal OTP)'}
                              >
                                <Power className={`w-3.5 h-3.5 ${isDeactivatingId === member.id ? 'animate-spin' : ''}`} />
                              </button>
                            )}

                            {/* Delete (Soft) with Principal OTP */}
                            {canModifyStaff && (
                              <button
                                onClick={() => handleInitiateStaffRemoval(member)}
                                className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-300 hover:border-rose-300 transition-colors shadow-sm"
                                title="Remove Faculty Record (Requires Principal OTP)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="text-xs text-slate-400 font-mono">
              Showing <span className="text-white font-bold">{staffList.length ? (currentPage - 1) * pageSize + 1 : 0}</span> to{' '}
              <span className="text-white font-bold">{Math.min(currentPage * pageSize, totalRecords)}</span> of{' '}
              <span className="text-white font-bold">{totalRecords}</span> faculty members
            </div>

            <div className="flex items-center gap-3">
              {/* Rows Per Page */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Page Buttons */}
              <div className="flex items-center gap-1 font-mono text-xs">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage <= 1 || loading}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 font-bold">
                  {currentPage} / {totalPages || 1}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage >= totalPages || loading}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUB-TAB: ENROLL STAFF MEMBER (5-SECTION WIZARD) */}
      {/* ========================================================================= */}
      {activeSubTab === 'add' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-cyan-400" />
                <span>Enroll Faculty & Staff Member</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                UDISE+ and CBSE aligned employee record creation with automatic portal credentials.
              </p>
            </div>
            <button
              onClick={() => handleSubTabChange('directory')}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-mono border border-slate-800 transition-colors"
            >
              Cancel & Back to Roster
            </button>
          </div>

          {/* Wizard Section Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 border-b border-slate-800/60 pb-3 font-mono text-xs">
            <button
              onClick={() => setAddFormSection('personal')}
              className={`py-2 px-3 rounded-xl font-bold transition-all text-left flex items-center gap-2 ${
                addFormSection === 'personal'
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">1</span>
              <span>Personal</span>
            </button>

            <button
              onClick={() => setAddFormSection('employment')}
              className={`py-2 px-3 rounded-xl font-bold transition-all text-left flex items-center gap-2 ${
                addFormSection === 'employment'
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">2</span>
              <span>Employment</span>
            </button>

            <button
              onClick={() => setAddFormSection('contact')}
              className={`py-2 px-3 rounded-xl font-bold transition-all text-left flex items-center gap-2 ${
                addFormSection === 'contact'
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">3</span>
              <span>Contact & Address</span>
            </button>

            <button
              onClick={() => setAddFormSection('specialization')}
              className={`py-2 px-3 rounded-xl font-bold transition-all text-left flex items-center gap-2 ${
                addFormSection === 'specialization'
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">4</span>
              <span>Academics</span>
            </button>

            <button
              onClick={() => setAddFormSection('documents')}
              className={`py-2 px-3 rounded-xl font-bold transition-all text-left flex items-center gap-2 ${
                addFormSection === 'documents'
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">5</span>
              <span>Verification</span>
            </button>
          </div>

          {/* Form Error Alert */}
          {formError && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleAddStaffSubmit} className="space-y-6">
            {/* SECTION 1: PERSONAL */}
            {addFormSection === 'personal' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anita"
                    value={addForm.firstName}
                    onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-cyan-500/50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sharma"
                    value={addForm.lastName}
                    onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-cyan-500/50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Gender</label>
                  <select
                    value={addForm.gender}
                    onChange={(e) => setAddForm({ ...addForm, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-cyan-500/50 outline-none"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={addForm.dob}
                    onChange={(e) => setAddForm({ ...addForm, dob: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-cyan-500/50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Blood Group</label>
                  <select
                    value={addForm.bloodGroup}
                    onChange={(e) => setAddForm({ ...addForm, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-cyan-500/50 outline-none"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Photo URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={addForm.photoUrl}
                    onChange={(e) => setAddForm({ ...addForm, photoUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-cyan-500/50 outline-none"
                  />
                </div>

                <div className="col-span-1 md:col-span-3 flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setAddFormSection('employment')}
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all"
                  >
                    Next: Employment Details →
                  </button>
                </div>
              </div>
            )}

            {/* SECTION 2: EMPLOYMENT */}
            {addFormSection === 'employment' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Employee Code / ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EMP-2026-009"
                    value={addForm.empId}
                    onChange={(e) => setAddForm({ ...addForm, empId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-bold focus:border-cyan-500/50 outline-none uppercase"
                  />
                  <span className="text-[10px] text-slate-500">Must be unique within the institution</span>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Staff Type *</label>
                  <select
                    value={addForm.staffType}
                    onChange={(e) => setAddForm({ ...addForm, staffType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-cyan-500/50 outline-none"
                  >
                    <option value="Teacher">Teaching Faculty</option>
                    <option value="Non-Teaching">Non-Teaching Staff</option>
                    <option value="Admin">Administration</option>
                    <option value="Support">Transport & Facilities</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PGT Mathematics"
                    value={addForm.designation}
                    onChange={(e) => setAddForm({ ...addForm, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-cyan-500/50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Department *</label>
                  <select
                    value={addForm.department}
                    onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-cyan-500/50 outline-none"
                  >
                    <option value="Academics">Academics</option>
                    <option value="Administration">Administration</option>
                    <option value="Science & Math">Science & Math</option>
                    <option value="Languages & Humanities">Languages & Humanities</option>
                    <option value="Sports & PE">Sports & PE</option>
                    <option value="Transport">Transport</option>
                    <option value="Library">Library</option>
                    <option value="Facilities & Support">Facilities & Support</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Employment Type</label>
                  <select
                    value={addForm.employmentType}
                    onChange={(e) => setAddForm({ ...addForm, employmentType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-cyan-500/50 outline-none"
                  >
                    <option value="Full-time">Full-time (Permanent)</option>
                    <option value="Probation">Probationary</option>
                    <option value="Contract">Contractual</option>
                    <option value="Visiting">Visiting Faculty</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Date of Joining</label>
                  <input
                    type="date"
                    value={addForm.joiningDate}
                    onChange={(e) => setAddForm({ ...addForm, joiningDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-cyan-500/50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Highest Qualification</label>
                  <input
                    type="text"
                    placeholder="e.g. M.Sc. Mathematics, B.Ed."
                    value={addForm.qualification}
                    onChange={(e) => setAddForm({ ...addForm, qualification: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-cyan-500/50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Experience in Years</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={addForm.experienceYears}
                    onChange={(e) => setAddForm({ ...addForm, experienceYears: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-cyan-500/50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Monthly Gross Salary (INR)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={addForm.salaryINR}
                    onChange={(e) => setAddForm({ ...addForm, salaryINR: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-cyan-500/50 outline-none"
                  />
                </div>

                <div className="col-span-1 md:col-span-3 flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setAddFormSection('personal')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddFormSection('contact')}
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all"
                  >
                    Next: Contact & Address →
                  </button>
                </div>
              </div>
            )}

            {/* SECTION 3: CONTACT & ADDRESS */}
            {addFormSection === 'contact' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Official / Primary Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-cyan-500/50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Alternate / Emergency Contact</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 00000"
                    value={addForm.altPhone}
                    onChange={(e) => setAddForm({ ...addForm, altPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-cyan-500/50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Institutional Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@school.edu"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-cyan-500/50 outline-none"
                  />
                </div>

                <div className="col-span-1 md:col-span-3">
                  <label className="block text-slate-400 mb-1">Residential Street Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Flat 402, Oakwood Towers, Sector 45"
                    value={addForm.address}
                    onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-cyan-500/50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">City</label>
                  <input
                    type="text"
                    value={addForm.city}
                    onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-cyan-500/50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">State</label>
                  <input
                    type="text"
                    value={addForm.state}
                    onChange={(e) => setAddForm({ ...addForm, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-cyan-500/50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={addForm.pinCode}
                    onChange={(e) => setAddForm({ ...addForm, pinCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-cyan-500/50 outline-none"
                  />
                </div>

                <div className="col-span-1 md:col-span-3 flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setAddFormSection('employment')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddFormSection('specialization')}
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all"
                  >
                    Next: Academic Specialization →
                  </button>
                </div>
              </div>
            )}

            {/* SECTION 4: SPECIALIZATION */}
            {addFormSection === 'specialization' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-slate-400 mb-1">Subject Specialization / Domain Expertise</label>
                  <input
                    type="text"
                    placeholder="e.g. Mathematics, Statistics & Advanced Calculus"
                    value={addForm.subjectSpecialization}
                    onChange={(e) => setAddForm({ ...addForm, subjectSpecialization: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-cyan-500/50 outline-none"
                  />
                  <span className="text-[10px] text-slate-500">
                    Primary subject taught or functional competency area.
                  </span>
                </div>

                <div className="col-span-1 md:col-span-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="text-white font-bold flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <span>Academic Classroom Assignments</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    After enrolling this faculty member, you can allocate specific classes, sections, and subjects from the roster action menu or inside their 360° profile.
                  </p>
                </div>

                <div className="col-span-1 md:col-span-2 flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setAddFormSection('contact')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddFormSection('documents')}
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all"
                  >
                    Next: Document Verification →
                  </button>
                </div>
              </div>
            )}

            {/* SECTION 5: DOCUMENTS & VERIFICATION */}
            {addFormSection === 'documents' && (
              <div className="space-y-4 font-mono text-xs">
                <p className="text-slate-400 text-[11px]">
                  Confirm statutory documents submitted by the employee as per CBSE accreditation guidelines:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={addForm.docAadhaar}
                      onChange={(e) => setAddForm({ ...addForm, docAadhaar: e.target.checked })}
                      className="w-4 h-4 rounded text-cyan-500 focus:ring-0"
                    />
                    <div>
                      <div className="text-white font-bold">Aadhaar / National ID Proof</div>
                      <div className="text-slate-500 text-[10px]">Verified photocopy on record</div>
                    </div>
                  </label>

                  <label className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={addForm.docDegrees}
                      onChange={(e) => setAddForm({ ...addForm, docDegrees: e.target.checked })}
                      className="w-4 h-4 rounded text-cyan-500 focus:ring-0"
                    />
                    <div>
                      <div className="text-white font-bold">Academic Degree Certificates</div>
                      <div className="text-slate-500 text-[10px]">B.Ed., Master's, Marksheets verified</div>
                    </div>
                  </label>

                  <label className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={addForm.docExperience}
                      onChange={(e) => setAddForm({ ...addForm, docExperience: e.target.checked })}
                      className="w-4 h-4 rounded text-cyan-500 focus:ring-0"
                    />
                    <div>
                      <div className="text-white font-bold">Prior Experience Certificate</div>
                      <div className="text-slate-500 text-[10px]">Relieving letters & service certificate</div>
                    </div>
                  </label>

                  <label className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={addForm.docPoliceClearance}
                      onChange={(e) => setAddForm({ ...addForm, docPoliceClearance: e.target.checked })}
                      className="w-4 h-4 rounded text-cyan-500 focus:ring-0"
                    />
                    <div>
                      <div className="text-white font-bold">Police Background Verification</div>
                      <div className="text-slate-500 text-[10px]">POCSO & CBSE mandatory clearance</div>
                    </div>
                  </label>
                </div>

                <div className="flex justify-between pt-6 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setAddFormSection('specialization')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all"
                  >
                    ← Back
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Enrolling Staff Member...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Complete Staff Enrollment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUB-TAB: BATCH EXCEL / CSV BULK IMPORT CONSOLE */}
      {/* ========================================================================= */}
      {activeSubTab === 'import' && (
        <BulkImportConsole
          entityType="staff"
          title="Bulk Faculty & Staff Onboarding Console (Excel & CSV)"
          subtitle="Ingest teachers, administrators, and non-teaching personnel via Excel (.xlsx, .xls) or CSV with automatic employee ID duplicate detection & institutional role assignment."
          sampleFileName="Dakshora_Staff_Faculty_Roster_Template"
          fields={[
            { key: 'employeeId', label: 'Employee ID', aliases: ['employee_id', 'empid', 'emp_code', 'employeecode', 'code', 'emp_id', 'employee_code', 'staff_id', 'staffid', 'faculty_id', 'facultyid', 'id'], required: false, example: 'FAC-2026-201' },
            { key: 'name', label: 'Faculty Full Name', aliases: ['name', 'full_name', 'fullname', 'faculty_name', 'staff_name', 'teacher_name', 'teachername', 'staffname', 'facultyname', 'employee_name', 'employeename', 'teacher'], required: true, example: 'Dr. Rajiv Malhotra' },
            { key: 'email', label: 'Institutional Email', aliases: ['email', 'email_address', 'mail', 'emailid', 'official_email'], required: false, example: 'rajiv.malhotra@school.edu.in' },
            { key: 'mobile', label: 'Mobile Number', aliases: ['mobile', 'phone', 'contact', 'cell', 'mobileno', 'contactno', 'phonenumber', 'mobilenumber', 'whatsapp'], required: false, example: '+91 98765 00111' },
            { key: 'role', label: 'System Role', aliases: ['role', 'user_role', 'access_level'], example: 'teacher' },
            { key: 'department', label: 'Academic Department', aliases: ['department', 'dept', 'stream', 'faculty_department'], example: 'Mathematics' },
            { key: 'designation', label: 'Designation / Post', aliases: ['designation', 'post', 'title', 'role', 'position', 'job_title'], example: 'Senior PGT Faculty' },
            { key: 'subjectSpecialization', label: 'Subject Specialization', aliases: ['subject', 'subjects', 'subject_specialization', 'specialization', 'teaching_subject'], example: 'Advanced Mathematics, Calculus' },
            { key: 'gender', label: 'Gender', aliases: ['gender', 'sex'], example: 'Male' },
            { key: 'qualification', label: 'Highest Qualification', aliases: ['qualification', 'degree'], example: 'M.Sc, B.Ed' },
            { key: 'experienceYears', label: 'Experience (Years)', aliases: ['experience', 'experience_years'], example: '12' },
            { key: 'salaryINR', label: 'Basic Salary (INR)', aliases: ['salary', 'salary_inr', 'pay'], example: '75000' }
          ]}
          existingUniqueKeys={{
            employeeIds: new Set(staffList.map((s: any) => (s.empId || '').toLowerCase())),
            emails: new Set(staffList.map((s: any) => (s.email || '').toLowerCase()))
          }}
          onCommitImport={async (validList) => {
            const mapped = validList.map((r, i) => ({
              empId: r.employeeId || `FAC-2026-${1000 + i}`,
              name: r.name,
              email: r.email,
              phone: r.mobile,
              role: r.role || 'teacher',
              department: r.department || 'Academic Faculty',
              designation: r.designation || 'Faculty Member',
              subjectSpecialization: r.subjectSpecialization || 'General',
              gender: r.gender || 'Not specified',
              qualification: r.qualification || 'Post Graduate, B.Ed',
              experienceYears: Number(r.experienceYears) || 3,
              salaryINR: Number(r.salaryINR) || 45000,
              status: 'active'
            }));
            const res = await importErpStaff(mapped, false, organizationId);
            if (res.data?.success) {
              loadStaff(true);
              return { success: true, importedCount: res.data.importedCount || validList.length };
            }
            return { success: false, importedCount: 0, message: res.data?.message || 'Import failed' };
          }}
          onShowToast={(t, title, msg) => onShowToast(t === 'warning' ? 'info' : t, title, msg)}
          onClose={() => handleSubTabChange('directory')}
        />
      )}

      {/* ========================================================================= */}
      {/* 5. 360-DEGREE STAFF PROFILE DOSSIER (MODAL) */}
      {/* ========================================================================= */}
      {selectedStaffForProfile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800/80 flex items-start justify-between bg-slate-900/40">
              {profileLoading || !staffProfileData ? (
                <div className="flex items-center gap-3 py-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
                  <span className="text-sm font-mono text-slate-400">Loading staff profile dossier...</span>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/40 flex items-center justify-center font-black text-cyan-300 text-lg shadow-inner">
                    {staffProfileData.staff.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-white">{staffProfileData.staff.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-mono">
                        {staffProfileData.staff.empId}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        staffProfileData.staff.status === 'active'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                          : (staffProfileData.staff.status === 'on_leave'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-950 text-rose-300 border border-rose-500/30')
                      }`}>
                        {staffProfileData.staff.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      {staffProfileData.staff.designation} • {staffProfileData.staff.department}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                  title="Print Staff Dossier"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setSelectedStaffForProfile(null); setStaffProfileData(null); }}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Profile Tab Navigation */}
            {staffProfileData && (
              <div className="flex border-b border-slate-800/80 px-6 bg-slate-950 font-mono text-xs overflow-x-auto">
                <button
                  onClick={() => setProfileActiveTab('overview')}
                  className={`py-3 px-4 border-b-2 font-bold transition-all ${
                    profileActiveTab === 'overview'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  Overview & Details
                </button>

                <button
                  onClick={() => setProfileActiveTab('assignments')}
                  className={`py-3 px-4 border-b-2 font-bold transition-all flex items-center gap-1.5 ${
                    profileActiveTab === 'assignments'
                      ? 'border-indigo-400 text-indigo-300'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Academic Classes ({staffProfileData.assignments?.length || 0})</span>
                </button>

                <button
                  onClick={() => setProfileActiveTab('responsibilities')}
                  className={`py-3 px-4 border-b-2 font-bold transition-all flex items-center gap-1.5 ${
                    profileActiveTab === 'responsibilities'
                      ? 'border-amber-400 text-amber-300'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Incharges & Scope ({profileResponsibilities.length})</span>
                </button>

                <button
                  onClick={() => setProfileActiveTab('attendance')}
                  className={`py-3 px-4 border-b-2 font-bold transition-all flex items-center gap-1.5 ${
                    profileActiveTab === 'attendance'
                      ? 'border-emerald-400 text-emerald-300'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Attendance & Leaves</span>
                </button>

                <button
                  onClick={() => setProfileActiveTab('qualifications')}
                  className={`py-3 px-4 border-b-2 font-bold transition-all flex items-center gap-1.5 ${
                    profileActiveTab === 'qualifications'
                      ? 'border-purple-400 text-purple-300'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Qualifications</span>
                </button>

                <button
                  onClick={() => setProfileActiveTab('documents')}
                  className={`py-3 px-4 border-b-2 font-bold transition-all flex items-center gap-1.5 ${
                    profileActiveTab === 'documents'
                      ? 'border-amber-400 text-amber-300'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Documents ({staffProfileData.documents?.length || 0})</span>
                </button>

                <button
                  onClick={() => setProfileActiveTab('activity')}
                  className={`py-3 px-4 border-b-2 font-bold transition-all flex items-center gap-1.5 ${
                    profileActiveTab === 'activity'
                      ? 'border-rose-400 text-rose-300'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Audit Trail</span>
                </button>
              </div>
            )}

            {/* Profile Tab Content Area */}
            <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-slate-300">
              {staffProfileData && profileActiveTab === 'overview' && (
                <div className="space-y-6">
                  {/* Top Stats Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase">Role / Staff Type</span>
                      <div className="text-sm font-bold text-white mt-0.5">{staffProfileData.staff.staffType || 'Staff'}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase">Assigned Classes</span>
                      <div className="text-sm font-bold text-cyan-300 mt-0.5">{staffProfileData.assignments?.length || 0} Sections</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase">Monthly Attendance</span>
                      <div className="text-sm font-bold text-emerald-400 mt-0.5">{staffProfileData.attendance?.monthlyRate || 95}%</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase">Gross Salary</span>
                      <div className="text-sm font-bold text-amber-400 mt-0.5">₹{(staffProfileData.staff.salaryINR || 50000).toLocaleString()}/mo</div>
                    </div>
                  </div>

                  {/* 3 Detail Panels */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Employment Terms */}
                    <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
                      <h4 className="font-bold text-white text-xs flex items-center gap-1.5 border-b border-slate-800 pb-2">
                        <Briefcase className="w-4 h-4 text-cyan-400" />
                        <span>Employment & Service Terms</span>
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Designation:</span>
                          <span className="text-white font-medium">{staffProfileData.staff.designation}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Department:</span>
                          <span className="text-white font-medium">{staffProfileData.staff.department}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Employment Type:</span>
                          <span className="text-white font-medium">{staffProfileData.staff.employmentType || 'Full-time'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Date of Joining:</span>
                          <span className="text-white font-medium">{staffProfileData.staff.joiningDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Experience:</span>
                          <span className="text-white font-medium">{staffProfileData.staff.experienceYears || 0} Years</span>
                        </div>
                      </div>
                    </div>

                    {/* Contact & Residential */}
                    <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
                      <h4 className="font-bold text-white text-xs flex items-center gap-1.5 border-b border-slate-800 pb-2">
                        <Phone className="w-4 h-4 text-emerald-400" />
                        <span>Contact & Residential Address</span>
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Primary Phone:</span>
                          <span className="text-white font-medium">{staffProfileData.staff.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Institutional Email:</span>
                          <span className="text-cyan-300 font-medium">{staffProfileData.staff.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Emergency Phone:</span>
                          <span className="text-white font-medium">{staffProfileData.staff.altPhone || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Address:</span>
                          <span className="text-white font-medium text-right max-w-[200px] truncate">
                            {staffProfileData.staff.address ? `${staffProfileData.staff.address}, ${staffProfileData.staff.city}` : 'On record'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Assignments */}
              {staffProfileData && profileActiveTab === 'assignments' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-xs">Allocated Teaching Workload</h4>
                      <p className="text-[11px] text-slate-400">Classrooms, sections, and subjects assigned for Academic Session {activeSession}</p>
                    </div>
                    {canModifyStaff && (
                      <button
                        onClick={() => handleOpenAssignments(staffProfileData.staff)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 text-xs transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Manage Assignments</span>
                      </button>
                    )}
                  </div>

                  {staffProfileData.assignments && staffProfileData.assignments.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {staffProfileData.assignments.map((asg) => (
                        <div key={asg.id} className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                              {asg.grade} - {asg.section}
                            </span>
                            <span className="text-[10px] text-slate-500">{asg.academicSession}</span>
                          </div>
                          <div className="text-white font-bold text-sm">{asg.subject}</div>
                          <div className="text-[10px] text-cyan-400">5 Periods / Week Scheduled</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl bg-slate-900/30 border border-slate-800/80 text-center space-y-2">
                      <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-slate-400 font-bold">No Teaching Assignments Allocated</p>
                      <p className="text-slate-500 text-[11px]">Click 'Manage Assignments' to allocate classes to this teacher.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Attendance */}
              {staffProfileData && profileActiveTab === 'attendance' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                      <div className="text-slate-500 text-[10px]">Today's Status</div>
                      <div className="text-base font-bold text-emerald-400 mt-1 capitalize">
                        {staffProfileData.attendance?.statusToday || 'Present'}
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                      <div className="text-slate-500 text-[10px]">Total Working Days</div>
                      <div className="text-base font-bold text-white mt-1">
                        {staffProfileData.attendance?.totalWorkingDays || 24} Days
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                      <div className="text-slate-500 text-[10px]">Days Present</div>
                      <div className="text-base font-bold text-cyan-300 mt-1">
                        {staffProfileData.attendance?.presentDays || 23} Days
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                      <div className="text-slate-500 text-[10px]">Leave Taken</div>
                      <div className="text-base font-bold text-amber-400 mt-1">
                        {staffProfileData.attendance?.leaveDays || 1} Day
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-800 text-[11px] text-slate-400">
                    Staff biometric attendance records synchronize in real-time with the central Daily Attendance & Biometric Register.
                  </div>
                </div>
              )}

              {/* Tab 4: Qualifications */}
              {staffProfileData && profileActiveTab === 'qualifications' && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Academic Background</div>
                    <div className="text-white font-bold text-sm">{staffProfileData.staff.qualification || 'M.Sc., B.Ed.'}</div>
                    <div className="text-slate-400 text-[11px]">
                      Specialization Domain: <span className="text-cyan-300 font-bold">{staffProfileData.staff.subjectSpecialization || 'General'}</span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Years of Teaching / Operational Experience: <span className="text-white font-bold">{staffProfileData.staff.experienceYears || 5} Years</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Documents */}
              {staffProfileData && profileActiveTab === 'documents' && (
                <div className="space-y-4">
                  {staffProfileData.documents && staffProfileData.documents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {staffProfileData.documents.map((doc) => (
                        <div key={doc.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-cyan-400 shrink-0" />
                            <div>
                              <div className="text-white font-bold text-xs">{doc.name}</div>
                              <div className="text-slate-500 text-[10px]">Verified: {doc.uploadedAt}</div>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                            Verified
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-500">No documents on file.</div>
                  )}
                </div>
              )}

              {/* Tab 6: Activity */}
              {staffProfileData && profileActiveTab === 'activity' && (
                <div className="space-y-3">
                  {staffProfileData.activity && staffProfileData.activity.length > 0 ? (
                    staffProfileData.activity.map((act) => (
                      <div key={act.id} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between text-[11px]">
                        <div>
                          <div className="text-white font-bold">{act.action}</div>
                          <div className="text-slate-500 text-[10px]">By {act.user_email}</div>
                        </div>
                        <span className="text-slate-500 text-[10px]">{new Date(act.timestamp).toLocaleDateString()}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-500">No activity log records.</div>
                  )}
                </div>
              )}

              {/* Tab 7: Responsibilities & Incharges (Migration 021) */}
              {staffProfileData && profileActiveTab === 'responsibilities' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-xs">Assigned Responsibilities & Incharge Portfolios</h4>
                      <p className="text-[11px] text-slate-400">Institutional duties, program scopes, and supervisory roles.</p>
                    </div>
                    {canModifyStaff && (
                      <button
                        onClick={() => {
                          loadResponsibilityTypes();
                          setShowAssignRespModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold font-mono flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>+ Assign Incharge</span>
                      </button>
                    )}
                  </div>

                  {responsibilitiesLoading ? (
                    <div className="p-8 text-center text-slate-500">Loading responsibilities...</div>
                  ) : profileResponsibilities.length > 0 ? (
                    <div className="space-y-2.5">
                      {profileResponsibilities.map((resp) => (
                        <div
                          key={resp.id}
                          className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white text-xs">{resp.responsibility_name}</span>
                              <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[10px]">
                                {resp.responsibility_code}
                              </span>
                              {resp.is_primary && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                                  ★ Primary
                                </span>
                              )}
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                resp.status === 'active'
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                  : resp.status === 'expired'
                                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                                  : 'bg-slate-800 border-slate-700 text-slate-400'
                              }`}>
                                {resp.status.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                              <span className="flex items-center gap-1">
                                <span className="text-slate-500">Scope:</span>
                                <span className="text-cyan-400 font-bold">{resp.scope_type}</span> ({resp.scope_name || resp.scope_id})
                              </span>
                              <span>•</span>
                              <span className="text-slate-500">Session: {resp.academic_session_id}</span>
                              {resp.start_date && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-500">From: {resp.start_date}</span>
                                </>
                              )}
                            </div>
                            {resp.notes && (
                              <p className="text-[10px] text-slate-500 italic">Note: {resp.notes}</p>
                            )}
                          </div>

                          {canModifyStaff && (
                            <div className="flex items-center gap-1.5 self-end sm:self-center">
                              <button
                                onClick={() => handleTogglePrimaryResponsibility(resp.id, resp.is_primary)}
                                className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition-all ${
                                  resp.is_primary
                                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                                }`}
                                title="Toggle Primary Designation"
                              >
                                {resp.is_primary ? 'Demote Primary' : 'Make Primary'}
                              </button>
                              <button
                                onClick={() => handleToggleStatusResponsibility(resp.id, resp.status)}
                                className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-bold transition-all"
                              >
                                {resp.status === 'active' ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handleRemoveResponsibility(resp.id)}
                                className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all"
                                title="Remove Incharge"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 text-slate-400">
                      <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="font-bold text-slate-300">No Incharge Responsibilities Assigned</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Assign this staff member a class teacher role, examination duty, program leadership, or departmental coordination.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TEACHER ACADEMIC ASSIGNMENTS MODAL */}
      {/* ========================================================================= */}
      {assignmentModalStaff && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Classroom & Subject Assignments</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {assignmentModalStaff.name} ({assignmentModalStaff.empId}) • {assignmentModalStaff.designation}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssignmentModalStaff(null)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-6 font-mono text-xs">
              {/* Add New Assignment Form */}
              {canModifyStaff && (
                <form onSubmit={handleCreateAssignment} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="text-white font-bold flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <span>Assign Class & Subject</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">Grade / Class</label>
                      <select
                        value={newAssignment.grade}
                        onChange={(e) => setNewAssignment({ ...newAssignment, grade: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                      >
                        {CLASSES_LIST.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">Section</label>
                      <select
                        value={newAssignment.section}
                        onChange={(e) => setNewAssignment({ ...newAssignment, section: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                      >
                        {SECTIONS_LIST.map(s => (
                          <option key={s} value={s}>Section {s}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">Subject</label>
                      <select
                        value={newAssignment.subject}
                        onChange={(e) => setNewAssignment({ ...newAssignment, subject: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                      >
                        {SUBJECTS_LIST.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={assignmentSubmitting}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {assignmentSubmitting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Allocate Assignment</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Current Assignments List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">Current Workload ({currentAssignments.length})</span>
                  <span className="text-[10px] text-slate-400">Academic Session {activeSession}</span>
                </div>

                {assignmentLoading ? (
                  <div className="py-6 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-cyan-400 mb-2" />
                    <span>Loading assignments...</span>
                  </div>
                ) : currentAssignments.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                    No classroom sections currently allocated.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentAssignments.map((asg) => (
                      <div
                        key={asg.id}
                        className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                            {asg.grade} - {asg.section}
                          </span>
                          <div>
                            <div className="text-white font-bold">{asg.subject}</div>
                            <div className="text-slate-500 text-[10px]">Session: {asg.academicSession}</div>
                          </div>
                        </div>

                        {canModifyStaff && (
                          <button
                            onClick={() => handleDeleteAssignment(asg.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 transition-colors"
                            title="Unassign Class"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* 7. ASSIGN INCHARGE RESPONSIBILITY MODAL */}
      {/* ========================================================================= */}
      {showAssignRespModal && staffProfileData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Assign Responsibility / Incharge</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {staffProfileData.staff.name} ({staffProfileData.staff.empId})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAssignRespModal(false)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignResponsibility} className="p-6 overflow-y-auto space-y-4 font-mono text-xs">
              {/* Select Responsibility Template */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">Incharge Responsibility Type *</label>
                <select
                  value={assignRespForm.responsibility_type_id}
                  onChange={(e) => {
                    const selected = responsibilityTypes.find(t => t.id === e.target.value);
                    setAssignRespForm(prev => ({
                      ...prev,
                      responsibility_type_id: e.target.value,
                      scope_type: (selected?.default_scope_type || 'SECTION') as ResponsibilityScopeType,
                      scope_id: selected?.default_scope_type === 'SECTION' ? 'Class 9-A' : selected?.default_scope_type === 'DEPARTMENT' ? 'Science & Math' : selected?.default_scope_type === 'PROGRAM' ? 'NEEV' : selected?.default_scope_type === 'HOUSE' ? 'Blue House' : 'sch-main',
                      scope_name: selected?.default_scope_type === 'SECTION' ? 'Grade 9 - Section A' : selected?.default_scope_type === 'DEPARTMENT' ? 'Department of Science & Math' : selected?.default_scope_type === 'PROGRAM' ? 'NEEV Foundational Learning' : selected?.default_scope_type === 'HOUSE' ? 'Tagore House (Blue)' : 'Delhi Public Heritage School'
                    }));
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  required
                >
                  {responsibilityTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.code}) • {type.category.toUpperCase()}
                    </option>
                  ))}
                </select>
                {responsibilityTypes.find(t => t.id === assignRespForm.responsibility_type_id)?.description && (
                  <p className="text-[11px] text-slate-400 italic">
                    {responsibilityTypes.find(t => t.id === assignRespForm.responsibility_type_id)?.description}
                  </p>
                )}
              </div>

              {/* Scope Type Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">Scope Hierarchy Type</label>
                  <select
                    value={assignRespForm.scope_type}
                    onChange={(e) => setAssignRespForm(prev => ({ ...prev, scope_type: e.target.value as any }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="SECTION">SECTION (Class & Section)</option>
                    <option value="DEPARTMENT">DEPARTMENT (Academic Subject Dept)</option>
                    <option value="SCHOOL">SCHOOL (Institution-wide)</option>
                    <option value="CAMPUS">CAMPUS (Campus / Wing)</option>
                    <option value="PROGRAM">PROGRAM (NEEV, FLN, Special Project)</option>
                    <option value="HOUSE">HOUSE (House System)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">Academic Session</label>
                  <input
                    type="text"
                    value={assignRespForm.academic_session_id}
                    onChange={(e) => setAssignRespForm(prev => ({ ...prev, academic_session_id: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                    placeholder="2026-27"
                    required
                  />
                </div>
              </div>

              {/* Dynamic Scope Target */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">Scope Identifier / Entity Target *</label>
                {assignRespForm.scope_type === 'SECTION' ? (
                  <select
                    value={assignRespForm.scope_id}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAssignRespForm(prev => ({
                        ...prev,
                        scope_id: val,
                        scope_name: `Grade ${val.replace('Class ', '').replace('-', ' - Section ')}`
                      }));
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Class 9-A">Class 9-A (Grade 9 - Section A)</option>
                    <option value="Class 9-B">Class 9-B (Grade 9 - Section B)</option>
                    <option value="Class 9-C">Class 9-C (Grade 9 - Section C)</option>
                    <option value="Class 10-A">Class 10-A (Grade 10 - Section A)</option>
                    <option value="Class 10-B">Class 10-B (Grade 10 - Section B)</option>
                    <option value="Class 11-A">Class 11-A (Grade 11 - Section A)</option>
                    <option value="Class 12-A">Class 12-A (Grade 12 - Section A)</option>
                  </select>
                ) : assignRespForm.scope_type === 'DEPARTMENT' ? (
                  <select
                    value={assignRespForm.scope_id}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAssignRespForm(prev => ({
                        ...prev,
                        scope_id: val,
                        scope_name: `Department of ${val}`
                      }));
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Science & Math">Science & Math</option>
                    <option value="Languages & Humanities">Languages & Humanities</option>
                    <option value="Academics">Academics</option>
                    <option value="Sports & PE">Sports & PE</option>
                  </select>
                ) : assignRespForm.scope_type === 'HOUSE' ? (
                  <select
                    value={assignRespForm.scope_id}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAssignRespForm(prev => ({
                        ...prev,
                        scope_id: val,
                        scope_name: `${val} (Tagore / Shivaji / Raman / Ashoka)`
                      }));
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Blue House">Blue House (Tagore)</option>
                    <option value="Red House">Red House (Shivaji)</option>
                    <option value="Green House">Green House (Ashoka)</option>
                    <option value="Yellow House">Yellow House (Raman)</option>
                  </select>
                ) : assignRespForm.scope_type === 'PROGRAM' ? (
                  <input
                    type="text"
                    value={assignRespForm.scope_id}
                    onChange={(e) => setAssignRespForm(prev => ({ ...prev, scope_id: e.target.value, scope_name: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                    placeholder="e.g. NEEV, FLN, Mission Buniyaad, Olympiad"
                    required
                  />
                ) : (
                  <input
                    type="text"
                    value={assignRespForm.scope_name || assignRespForm.scope_id}
                    onChange={(e) => setAssignRespForm(prev => ({ ...prev, scope_id: e.target.value, scope_name: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                    placeholder="Institutional / Campus Scope"
                    required
                  />
                )}
              </div>

              {/* Start Date & Primary Incharge Flag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">Start Date</label>
                  <input
                    type="date"
                    value={assignRespForm.start_date}
                    onChange={(e) => setAssignRespForm(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                    <input
                      type="checkbox"
                      checked={assignRespForm.is_primary}
                      onChange={(e) => setAssignRespForm(prev => ({ ...prev, is_primary: e.target.checked }))}
                      className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
                    />
                    <span className="text-xs font-bold text-white">Set as Primary Responsibility</span>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">Official Appointment Notes</label>
                <textarea
                  rows={2}
                  value={assignRespForm.notes}
                  onChange={(e) => setAssignRespForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  placeholder="e.g. Appointed by School Academic Council for Term 1 & 2"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowAssignRespModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignRespSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
                >
                  {assignRespSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Confirm Assignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. CREATE CUSTOM INCHARGE TYPE MODAL */}
      {/* ========================================================================= */}
      {showCreateRespTypeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Define Custom Incharge Role</h3>
                  <p className="text-xs text-slate-400 font-mono">Create institutional duty template</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateRespTypeModal(false)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomRespType} className="p-6 overflow-y-auto space-y-4 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">Incharge Code (Uppercase Key) *</label>
                <input
                  type="text"
                  value={newRespTypeForm.code}
                  onChange={(e) => setNewRespTypeForm(prev => ({ ...prev, code: e.target.value.toUpperCase().replace(/\s+/g, '_') }))}
                  placeholder="e.g. ATL_INCHARGE, ROBOTICS_COORDINATOR"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">Display Name *</label>
                <input
                  type="text"
                  value={newRespTypeForm.name}
                  onChange={(e) => setNewRespTypeForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Atal Tinkering Lab Incharge"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">Category</label>
                  <select
                    value={newRespTypeForm.category}
                    onChange={(e) => setNewRespTypeForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="academics">Academics</option>
                    <option value="examinations">Examinations</option>
                    <option value="student_welfare">Student Welfare</option>
                    <option value="special_programs">Special Programs</option>
                    <option value="co_curricular">Co-Curricular</option>
                    <option value="administration">Administration</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">Default Scope</label>
                  <select
                    value={newRespTypeForm.default_scope_type}
                    onChange={(e) => setNewRespTypeForm(prev => ({ ...prev, default_scope_type: e.target.value as any }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="SECTION">SECTION</option>
                    <option value="DEPARTMENT">DEPARTMENT</option>
                    <option value="SCHOOL">SCHOOL</option>
                    <option value="CAMPUS">CAMPUS</option>
                    <option value="PROGRAM">PROGRAM</option>
                    <option value="HOUSE">HOUSE</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">Role Description</label>
                <textarea
                  rows={2}
                  value={newRespTypeForm.description}
                  onChange={(e) => setNewRespTypeForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Responsibilities, compliance duties and oversight expectations."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowCreateRespTypeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRespTypeSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
                >
                  {createRespTypeSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Save Role Definition</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. GLOBAL ASSIGN INCHARGE RESPONSIBILITY MODAL */}
      {/* ========================================================================= */}
      {showGlobalAssignDutyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] font-sans">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-600 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-inner">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base tracking-tight">Assign Institutional Responsibility / Incharge</h3>
                  <p className="text-xs text-amber-100 font-mono">
                    Allocate statutory school incharge duties to faculty & staff
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGlobalAssignDutyModal(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignGlobalDuty} className="p-6 overflow-y-auto space-y-4 font-mono text-xs">
              {/* Select Staff Member */}
              <div className="space-y-1.5">
                <label className="text-slate-900 font-black">Select Faculty / Staff Member *</label>
                <select
                  value={globalDutyForm.staffId}
                  onChange={(e) => setGlobalDutyForm(prev => ({ ...prev, staffId: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-amber-600 shadow-sm"
                  required
                >
                  <option value="">-- Choose Faculty Member --</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.empId}) • {s.designation} ({s.department})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Responsibility Template */}
              <div className="space-y-1.5">
                <label className="text-slate-900 font-black">Incharge Responsibility Role *</label>
                <select
                  value={globalDutyForm.responsibility_type_id}
                  onChange={(e) => {
                    const selected = responsibilityTypes.find(t => t.id === e.target.value);
                    setGlobalDutyForm(prev => ({
                      ...prev,
                      responsibility_type_id: e.target.value,
                      scope_type: (selected?.default_scope_type || 'SCHOOL') as ResponsibilityScopeType,
                      scope_id: selected?.default_scope_type === 'SECTION' ? 'Class 9-A' : selected?.default_scope_type === 'DEPARTMENT' ? 'Academics' : selected?.default_scope_type === 'HOUSE' ? 'Tagore House' : 'sch-main',
                      scope_name: selected?.default_scope_type === 'SECTION' ? 'Grade 9 - Section A' : selected?.default_scope_type === 'DEPARTMENT' ? 'Academic Department' : selected?.default_scope_type === 'HOUSE' ? 'Tagore House (Blue)' : 'Institution-wide'
                    }));
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-amber-600 shadow-sm"
                  required
                >
                  <option value="">-- Choose Statutory Incharge Portfolio --</option>
                  {responsibilityTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.code}) • {type.category.toUpperCase()}
                    </option>
                  ))}
                </select>
                {responsibilityTypes.find(t => t.id === globalDutyForm.responsibility_type_id)?.description && (
                  <p className="text-[11px] text-slate-600 italic">
                    {responsibilityTypes.find(t => t.id === globalDutyForm.responsibility_type_id)?.description}
                  </p>
                )}
              </div>

              {/* Scope Hierarchy Type & Target */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-900 font-black">Scope Hierarchy Type</label>
                  <select
                    value={globalDutyForm.scope_type}
                    onChange={(e) => setGlobalDutyForm(prev => ({ ...prev, scope_type: e.target.value as any }))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-amber-600 shadow-sm"
                  >
                    <option value="SCHOOL">SCHOOL (Institution-wide)</option>
                    <option value="SECTION">SECTION (Class & Section)</option>
                    <option value="DEPARTMENT">DEPARTMENT (Academic Subject Dept)</option>
                    <option value="CAMPUS">CAMPUS (Campus / Wing)</option>
                    <option value="PROGRAM">PROGRAM (Special Initiative / ATL / FLN)</option>
                    <option value="HOUSE">HOUSE (Student House)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-900 font-black">Academic Session</label>
                  <input
                    type="text"
                    value={globalDutyForm.academic_session_id}
                    onChange={(e) => setGlobalDutyForm(prev => ({ ...prev, academic_session_id: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-amber-600 shadow-sm"
                    required
                  />
                </div>
              </div>

              {/* Target Scope Name */}
              <div className="space-y-1.5">
                <label className="text-slate-900 font-black">Scope Target / Wing Name *</label>
                <input
                  type="text"
                  value={globalDutyForm.scope_name}
                  onChange={(e) => setGlobalDutyForm(prev => ({ ...prev, scope_name: e.target.value, scope_id: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-amber-600 shadow-sm"
                  placeholder="e.g. Senior Secondary Wing / Class 10-A / ATL Lab"
                  required
                />
              </div>

              {/* Start Date & Primary Incharge Checkbox */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-900 font-black">Effective Start Date</label>
                  <input
                    type="date"
                    value={globalDutyForm.start_date}
                    onChange={(e) => setGlobalDutyForm(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-amber-600 shadow-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900">
                    <input
                      type="checkbox"
                      checked={globalDutyForm.is_primary}
                      onChange={(e) => setGlobalDutyForm(prev => ({ ...prev, is_primary: e.target.checked }))}
                      className="rounded bg-white border-slate-300 text-amber-600 focus:ring-0"
                    />
                    <span className="text-xs font-black text-slate-950">Set as Primary Lead</span>
                  </label>
                </div>
              </div>

              {/* Official Appointment Notes */}
              <div className="space-y-1.5">
                <label className="text-slate-900 font-black">Official Appointment Notes / Circular Ref</label>
                <textarea
                  rows={2}
                  value={globalDutyForm.notes}
                  onChange={(e) => setGlobalDutyForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-amber-600 shadow-sm resize-none"
                  placeholder="e.g. Appointed per School Academic Council Circular #14 for Session 2026-27"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowGlobalAssignDutyModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingGlobalDuty}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold transition-all shadow-sm flex items-center gap-2"
                >
                  {submittingGlobalDuty ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Confirm Duty Assignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. PRINCIPAL OTP SECURITY AUTHORIZATION MODAL */}
      {/* ========================================================================= */}
      <PrincipalOtpAuthModal
        isOpen={showPrincipalOtpModal}
        onClose={() => {
          setShowPrincipalOtpModal(false);
          setPendingProtectedAction(null);
        }}
        actionTitle={
          pendingProtectedAction?.type === 'delete'
            ? 'Permanent Removal / Unlisting from Faculty Roster'
            : 'Faculty Soft Deactivation & Status Freeze'
        }
        actionDescription={
          pendingProtectedAction?.type === 'delete'
            ? 'This sensitive action requires Principal personal authorization. The employee will be unlisted from active teaching and payroll rosters.'
            : 'Deactivating a faculty member halts live assignments and suspends ERP login access while preserving service history.'
        }
        targetDetails={
          pendingProtectedAction?.member
            ? {
                empId: pendingProtectedAction.member.empId,
                name: pendingProtectedAction.member.name,
                designation: pendingProtectedAction.member.designation,
                department: pendingProtectedAction.member.department
              }
            : undefined
        }
        onSuccess={handlePrincipalAuthConfirmed}
        onShowToast={onShowToast}
      />

    </div>
  );
};
