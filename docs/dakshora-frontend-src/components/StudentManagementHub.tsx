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
  MoreVertical,
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
  DollarSign,
  ArrowUpDown,
  CreditCard,
  Stamp,
  FolderLock,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  ErpStudentRecord,
  ErpStudentProfile,
  StudentSummaryKPIs,
  ErpRole
} from '../types';
import {
  fetchErpStudents,
  fetchErpStudentProfile,
  createErpStudent,
  updateErpStudent,
  deleteErpStudent,
  importErpStudents,
  getErpStudentExportUrl,
  StudentQueryParams
} from '../services/api';
import { BulkImportConsole } from './BulkImportConsole';
import { StudentIdCardModal } from './StudentIdCardModal';
import { TransferCertificateModal } from './TransferCertificateModal';
import { DocumentVaultModal } from './DocumentVaultModal';

interface StudentManagementHubProps {
  activeRole: ErpRole;
  activeSession: string;
  organizationId?: string;
  onSelectForIdCard: (student: ErpStudentRecord) => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  initialShowAdd?: boolean;
  onCloseInitialAdd?: () => void;
}

export const StudentManagementHub: React.FC<StudentManagementHubProps> = ({
  activeRole,
  activeSession,
  organizationId,
  onSelectForIdCard,
  onShowToast,
  initialShowAdd = false,
  onCloseInitialAdd
}) => {
  // Navigation & Modal states
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'add' | 'import'>('directory');
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<string | null>(null);
  const [studentProfileData, setStudentProfileData] = useState<ErpStudentProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileActiveTab, setProfileActiveTab] = useState<'overview' | 'academic' | 'attendance' | 'fees' | 'documents' | 'parents' | 'activity'>('overview');

  const [editingStudent, setEditingStudent] = useState<ErpStudentRecord | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Modals for ID Card, TC Generator, and Document Vault
  const [selectedStudentForIdCardModal, setSelectedStudentForIdCardModal] = useState<ErpStudentRecord | null>(null);
  const [selectedStudentForTcModal, setSelectedStudentForTcModal] = useState<ErpStudentRecord | null>(null);
  const [selectedStudentForVaultModal, setSelectedStudentForVaultModal] = useState<ErpStudentRecord | null>(null);
  const [showBatchClassIdCardModal, setShowBatchClassIdCardModal] = useState<boolean>(false);

  // Student list state
  const [students, setStudents] = useState<ErpStudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpiSummary, setKpiSummary] = useState<StudentSummaryKPIs>({
    total: 0,
    active: 0,
    newAdmissions: 0,
    male: 0,
    female: 0,
    totalDuesINR: 0
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSession, setFilterSession] = useState(activeSession || '2026-27');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Add Student Wizard State
  const [addFormSection, setAddFormSection] = useState<'basic' | 'admission' | 'contact' | 'parent' | 'docs'>('basic');
  const [addForm, setAddForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    admissionNo: '',
    penNo: '',
    rollNo: '',
    grade: 'Class 10',
    section: 'A',
    gender: 'Male',
    dob: '2011-05-15',
    bloodGroup: 'B+',
    admissionDate: new Date().toISOString().split('T')[0],
    academicSession: activeSession || '2026-27',
    status: 'active' as const,
    phone: '',
    email: '',
    address: '',
    city: 'Gurugram',
    state: 'Haryana',
    pinCode: '122001',
    parentName: '',
    parentRelation: 'Father',
    parentPhone: '',
    parentAltPhone: '',
    parentEmail: '',
    parentOccupation: '',
    parentAddress: '',
    hasAadhaar: true,
    hasBirthCert: true,
    hasTransferCert: false
  });
  const [addFormErrors, setAddFormErrors] = useState<Record<string, string>>({});
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // CSV Import State
  const [importCsvText, setImportCsvText] = useState('');
  const [importDryRunResult, setImportDryRunResult] = useState<any | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Check initialShowAdd prop from parent
  useEffect(() => {
    if (initialShowAdd) {
      setActiveSubTab('add');
    }
  }, [initialShowAdd]);

  // Sync session filter if parent session changes
  useEffect(() => {
    if (activeSession) {
      setFilterSession(activeSession);
      setAddForm(prev => ({ ...prev, academicSession: activeSession }));
    }
  }, [activeSession]);

  // Fetch Student List from backend
  const loadStudents = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    else setLoading(true);

    try {
      const params: StudentQueryParams = {
        search: searchQuery.trim(),
        grade: filterGrade,
        section: filterSection,
        gender: filterGender,
        status: filterStatus,
        session: filterSession,
        sortBy,
        sortOrder,
        page: currentPage,
        limit: pageSize,
        organization_id: organizationId
      };

      const res = await fetchErpStudents(params);
      if (res.data?.students) {
        setStudents(res.data.students);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalRecords(res.data.pagination.total || 0);
        }
        if (res.data.summary) {
          setKpiSummary(res.data.summary);
        }
      }
    } catch (err: any) {
      onShowToast('error', 'Failed to load students', err.message || 'Check server connection');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    searchQuery,
    filterGrade,
    filterSection,
    filterGender,
    filterStatus,
    filterSession,
    sortBy,
    sortOrder,
    currentPage,
    pageSize,
    organizationId,
    onShowToast
  ]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Load 360-degree Profile
  const handleOpenProfile = async (id: string) => {
    setSelectedStudentForProfile(id);
    setProfileLoading(true);
    setProfileActiveTab('overview');
    try {
      const res = await fetchErpStudentProfile(id);
      if (res.data?.success) {
        setStudentProfileData(res.data as unknown as ErpStudentProfile);
      }
    } catch (err: any) {
      onShowToast('error', 'Profile Load Error', err.message || 'Could not fetch student dossier');
    } finally {
      setProfileLoading(false);
    }
  };

  // Close Profile
  const handleCloseProfile = () => {
    setSelectedStudentForProfile(null);
    setStudentProfileData(null);
  };

  // Add Form Validation
  const validateAddForm = () => {
    const errors: Record<string, string> = {};
    if (!addForm.firstName.trim()) errors.firstName = 'First name is required';
    if (!addForm.lastName.trim()) errors.lastName = 'Last name is required';
    if (!addForm.dob) errors.dob = 'Date of birth is required';
    if (!addForm.parentName.trim()) errors.parentName = 'Parent / Guardian name is required';
    if (!addForm.parentPhone.trim()) {
      errors.parentPhone = 'Parent contact number is required';
    } else if (!/^[0-9+ -]{7,15}$/.test(addForm.parentPhone.trim())) {
      errors.parentPhone = 'Enter a valid phone number';
    }
    if (addForm.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.parentEmail.trim())) {
      errors.parentEmail = 'Enter a valid email address';
    }
    if (addForm.penNo && !/^[0-9A-Za-z]{8,15}$/.test(addForm.penNo.trim())) {
      errors.penNo = 'PEN must be 8-15 alphanumeric characters';
    }
    setAddFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Add Student Submit
  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAddForm()) {
      onShowToast('error', 'Validation Failed', 'Please fix the highlighted errors before submitting');
      return;
    }

    setSubmittingAdd(true);
    try {
      const docs = [];
      if (addForm.hasAadhaar) docs.push({ id: `doc-${Date.now()}-1`, name: 'Aadhaar Card', type: 'aadhaar', verified: true, uploadedAt: new Date().toISOString().split('T')[0] });
      if (addForm.hasBirthCert) docs.push({ id: `doc-${Date.now()}-2`, name: 'Birth Certificate', type: 'birth_certificate', verified: true, uploadedAt: new Date().toISOString().split('T')[0] });
      if (addForm.hasTransferCert) docs.push({ id: `doc-${Date.now()}-3`, name: 'Transfer Certificate', type: 'transfer_certificate', verified: false, uploadedAt: new Date().toISOString().split('T')[0] });

      const newStudentPayload = {
        firstName: addForm.firstName.trim(),
        middleName: addForm.middleName.trim(),
        lastName: addForm.lastName.trim(),
        name: `${addForm.firstName.trim()} ${addForm.middleName.trim()} ${addForm.lastName.trim()}`.replace(/\s+/g, ' ').trim(),
        admissionNo: addForm.admissionNo.trim() || undefined,
        penNo: addForm.penNo.trim() || undefined,
        rollNo: addForm.rollNo.trim() || undefined,
        grade: addForm.grade,
        section: addForm.section,
        gender: addForm.gender,
        dob: addForm.dob,
        bloodGroup: addForm.bloodGroup,
        admissionDate: addForm.admissionDate,
        academicSession: addForm.academicSession,
        status: addForm.status,
        phone: addForm.phone.trim() || addForm.parentPhone.trim(),
        email: addForm.email.trim() || undefined,
        address: addForm.address.trim() || `${addForm.city}, ${addForm.state}`,
        city: addForm.city.trim(),
        state: addForm.state.trim(),
        pinCode: addForm.pinCode.trim(),
        parentName: addForm.parentName.trim(),
        parentRelation: addForm.parentRelation,
        parentPhone: addForm.parentPhone.trim(),
        parentAltPhone: addForm.parentAltPhone.trim() || undefined,
        parentEmail: addForm.parentEmail.trim() || undefined,
        parentOccupation: addForm.parentOccupation.trim() || undefined,
        parentAddress: addForm.parentAddress.trim() || addForm.address.trim(),
        documents: docs,
        organization_id: organizationId
      };

      const res = await createErpStudent(newStudentPayload);
      if (res.data?.student) {
        onShowToast('success', 'Student Enrolled Successfully! 🎉', `${res.data.student.name} (Adm: ${res.data.student.admissionNo})`);
        // Reset form
        setAddForm({
          firstName: '',
          middleName: '',
          lastName: '',
          admissionNo: '',
          penNo: '',
          rollNo: '',
          grade: 'Class 10',
          section: 'A',
          gender: 'Male',
          dob: '2011-05-15',
          bloodGroup: 'B+',
          admissionDate: new Date().toISOString().split('T')[0],
          academicSession: activeSession || '2026-27',
          status: 'active',
          phone: '',
          email: '',
          address: '',
          city: 'Gurugram',
          state: 'Haryana',
          pinCode: '122001',
          parentName: '',
          parentRelation: 'Father',
          parentPhone: '',
          parentAltPhone: '',
          parentEmail: '',
          parentOccupation: '',
          parentAddress: '',
          hasAadhaar: true,
          hasBirthCert: true,
          hasTransferCert: false
        });
        setAddFormSection('basic');
        setActiveSubTab('directory');
        if (onCloseInitialAdd) onCloseInitialAdd();
        loadStudents(true);
      }
    } catch (err: any) {
      onShowToast('error', 'Enrollment Error', err.message || 'Failed to save student record');
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      const res = await updateErpStudent(editingStudent.id, editingStudent);
      if (res.data?.student) {
        onShowToast('success', 'Student Record Updated', `${editingStudent.name}'s profile was updated successfully.`);
        setEditingStudent(null);
        loadStudents(true);
      }
    } catch (err: any) {
      onShowToast('error', 'Update Failed', err.message || 'Could not update student');
    }
  };

  // Handle Soft Delete / Deactivation
  const handleDeactivateStudent = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to deactivate student ${name}? They will be marked as inactive.`)) {
      return;
    }

    setIsDeletingId(id);
    try {
      await deleteErpStudent(id, false);
      onShowToast('info', 'Student Deactivated', `${name} has been archived to inactive status.`);
      loadStudents(true);
    } catch (err: any) {
      onShowToast('error', 'Deactivation Failed', err.message);
    } finally {
      setIsDeletingId(null);
    }
  };

  // Parse CSV string to objects
  const parseCsvText = (text: string) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      // Handle comma within quotes
      const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
      const obj: any = {};
      headers.forEach((header, idx) => {
        obj[header] = values[idx] || '';
      });
      rows.push(obj);
    }
    return rows;
  };

  // CSV Dry Run Preview
  const handleCsvPreview = async () => {
    if (!importCsvText.trim()) {
      onShowToast('error', 'CSV Required', 'Please paste CSV content or upload a CSV file');
      return;
    }

    try {
      const parsedRows = parseCsvText(importCsvText);
      if (parsedRows.length === 0) {
        onShowToast('error', 'Empty CSV', 'No data rows found in CSV');
        return;
      }

      // Map common header variations
      const mapped = parsedRows.map(r => ({
        name: r['Full Name'] || r['Student Name'] || r['name'],
        admissionNo: r['Admission No'] || r['admission_no'] || r['admNo'],
        penNo: r['PEN No'] || r['pen_no'] || r['pen'],
        rollNo: r['Roll No'] || r['roll_no'],
        grade: r['Class'] || r['Grade'] || r['grade'] || 'Class 10',
        section: r['Section'] || r['section'] || 'A',
        gender: r['Gender'] || r['gender'] || 'Not specified',
        dob: r['Date of Birth'] || r['DOB'] || r['dob'] || '2011-01-01',
        parentName: r['Parent Name'] || r['parent_name'] || 'Parent',
        parentPhone: r['Parent Phone'] || r['parent_phone'] || '+91 98000 00000',
        parentEmail: r['Parent Email'] || r['parent_email'] || '',
        bloodGroup: r['Blood Group'] || r['blood_group'] || 'B+'
      }));

      const res = await importErpStudents(mapped, true);
      if (res.data) {
        setImportDryRunResult(res.data);
      }
    } catch (err: any) {
      onShowToast('error', 'Validation Error', err.message || 'CSV preview failed');
    }
  };

  // CSV Confirm Import
  const handleCsvImportConfirm = async () => {
    if (!importDryRunResult || importDryRunResult.validCount === 0) {
      onShowToast('error', 'No Valid Records', 'Cannot import without valid records');
      return;
    }

    setIsImporting(true);
    try {
      const parsedRows = parseCsvText(importCsvText);
      const mapped = parsedRows.map(r => ({
        name: r['Full Name'] || r['Student Name'] || r['name'],
        admissionNo: r['Admission No'] || r['admission_no'] || r['admNo'],
        penNo: r['PEN No'] || r['pen_no'] || r['pen'],
        rollNo: r['Roll No'] || r['roll_no'],
        grade: r['Class'] || r['Grade'] || r['grade'] || 'Class 10',
        section: r['Section'] || r['section'] || 'A',
        gender: r['Gender'] || r['gender'] || 'Not specified',
        dob: r['Date of Birth'] || r['DOB'] || r['dob'] || '2011-01-01',
        parentName: r['Parent Name'] || r['parent_name'] || 'Parent',
        parentPhone: r['Parent Phone'] || r['parent_phone'] || '+91 98000 00000',
        parentEmail: r['Parent Email'] || r['parent_email'] || '',
        bloodGroup: r['Blood Group'] || r['blood_group'] || 'B+'
      }));

      const res = await importErpStudents(mapped, false);
      if (res.data?.success) {
        onShowToast('success', 'Batch Import Completed! 🎉', `Imported ${res.data.importedCount} students successfully.`);
        setImportCsvText('');
        setImportDryRunResult(null);
        setActiveSubTab('directory');
        loadStudents(true);
      }
    } catch (err: any) {
      onShowToast('error', 'Import Failed', err.message);
    } finally {
      setIsImporting(false);
    }
  };

  // Download Sample CSV
  const handleDownloadSampleCsv = () => {
    const sampleCsv = `Admission No,PEN No,Roll No,Full Name,Gender,Date of Birth,Class,Section,Parent Name,Parent Phone,Parent Email,Blood Group\n` +
      `DPS-ADM-2026-201,20268940201,DPS-2026-201,Vihaan Malhotra,Male,2011-03-15,Class 10,A,Sameer Malhotra,+91 98765 43219,sameer.m@example.com,O+\n` +
      `DPS-ADM-2026-202,20268940202,DPS-2026-202,Diya Sengupta,Female,2011-07-22,Class 10,B,Arindam Sengupta,+91 98111 55667,arindam.s@example.com,A+`;

    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Dakshora_Student_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Filtered CSV
  const handleExportCsv = () => {
    const exportUrl = getErpStudentExportUrl({
      search: searchQuery,
      grade: filterGrade,
      section: filterSection,
      gender: filterGender,
      status: filterStatus,
      session: filterSession,
      organization_id: organizationId
    });
    window.open(exportUrl, '_blank');
    onShowToast('info', 'Export Started', 'Student dataset CSV is downloading.');
  };

  // Sorting Handler
  const handleSortToggle = (col: string) => {
    if (sortBy === col) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortOrder('asc');
    }
  };

  // Roles that can add / edit
  const canModifyStudents = ['admin', 'teacher', 'reception'].includes(activeRole);
  const canDeleteStudents = activeRole === 'admin';

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & KPI SUMMARY CARDS */}
      {/* ========================================================================= */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>Student Information System</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono font-medium">
                    Session {filterSession}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  UDISE+ & CBSE compliant student registry with live attendance tracking, fee statuses, and 360° dossiers.
                </p>
              </div>
            </div>
          </div>

          {/* Sub-nav buttons */}
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <button
              onClick={() => { setActiveSubTab('directory'); if (onCloseInitialAdd) onCloseInitialAdd(); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 border ${
                activeSubTab === 'directory'
                  ? 'bg-slate-800 text-white border-slate-700 shadow-md'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Student Roster</span>
            </button>

            {canModifyStudents && (
              <button
                onClick={() => setActiveSubTab('add')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 border ${
                  activeSubTab === 'add'
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white border-cyan-400/50 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4 text-cyan-300" />
                <span>Enroll Student</span>
              </button>
            )}

            {canModifyStudents && (
              <button
                onClick={() => setActiveSubTab('import')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 border ${
                  activeSubTab === 'import'
                    ? 'bg-indigo-600/80 text-white border-indigo-400/50 shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Upload className="w-4 h-4 text-indigo-400" />
                <span>Batch CSV Import</span>
              </button>
            )}

            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold font-mono flex items-center gap-2 transition-all"
              title="Download CSV of current filter view"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={() => loadStudents(true)}
              disabled={refreshing}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* 5 KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1">
            <div className="text-[11px] text-slate-400 font-mono font-medium">Total Enrollment</div>
            <div className="text-2xl font-black text-white">{kpiSummary.total}</div>
            <div className="text-[10px] text-cyan-400/80 font-mono">Enrolled across all classes</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1">
            <div className="text-[11px] text-emerald-400/80 font-mono font-medium">Active Students</div>
            <div className="text-2xl font-black text-emerald-400">{kpiSummary.active}</div>
            <div className="text-[10px] text-slate-500 font-mono">
              {kpiSummary.total ? Math.round((kpiSummary.active / kpiSummary.total) * 100) : 100}% Active rate
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1">
            <div className="text-[11px] text-indigo-400/80 font-mono font-medium">New Admissions</div>
            <div className="text-2xl font-black text-indigo-400">{kpiSummary.newAdmissions}</div>
            <div className="text-[10px] text-indigo-300/60 font-mono">Session {filterSession}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1">
            <div className="text-[11px] text-slate-400 font-mono font-medium">Gender Ratio</div>
            <div className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">{kpiSummary.male} Boys</span>
              <span className="text-slate-600">•</span>
              <span className="text-purple-400">{kpiSummary.female} Girls</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Co-ed parity tracking</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1 col-span-2 md:col-span-1">
            <div className="text-[11px] text-amber-400/80 font-mono font-medium">Outstanding Dues</div>
            <div className="text-xl font-black text-amber-400">
              ₹{kpiSummary.totalDuesINR.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Cumulative fee receivables</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUB-TAB: ALL STUDENTS (DIRECTORY VIEW) */}
      {/* ========================================================================= */}
      {activeSubTab === 'directory' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          {/* Search and Filters Bar */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Name, Admission No, PEN, Roll No, Parent, Phone..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Class Filter */}
            <select
              value={filterGrade}
              onChange={(e) => { setFilterGrade(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 text-xs font-mono focus:outline-none focus:border-cyan-500/50"
            >
              <option value="all">All Classes</option>
              <option value="Class 1">Class 1</option>
              <option value="Class 2">Class 2</option>
              <option value="Class 3">Class 3</option>
              <option value="Class 4">Class 4</option>
              <option value="Class 5">Class 5</option>
              <option value="Class 6">Class 6</option>
              <option value="Class 7">Class 7</option>
              <option value="Class 8">Class 8</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
              <option value="Class 11">Class 11</option>
              <option value="Class 12">Class 12</option>
            </select>

            {/* Section Filter */}
            <select
              value={filterSection}
              onChange={(e) => { setFilterSection(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 text-xs font-mono focus:outline-none focus:border-cyan-500/50"
            >
              <option value="all">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
            </select>

            {/* Gender Filter */}
            <select
              value={filterGender}
              onChange={(e) => { setFilterGender(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 text-xs font-mono focus:outline-none focus:border-cyan-500/50"
            >
              <option value="all">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 text-xs font-mono focus:outline-none focus:border-cyan-500/50"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="alumni">Alumni</option>
            </select>

            {/* Clear Filters */}
            {(searchQuery || filterGrade !== 'all' || filterSection !== 'all' || filterGender !== 'all' || filterStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterGrade('all');
                  setFilterSection('all');
                  setFilterGender('all');
                  setFilterStatus('all');
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-mono transition-colors"
              >
                Reset
              </button>
            )}
          </div>

          {/* Student Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/70 text-slate-400 select-none">
                  <th
                    onClick={() => handleSortToggle('admissionNo')}
                    className="p-3.5 cursor-pointer hover:text-cyan-300 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Admission / PEN</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSortToggle('name')}
                    className="p-3.5 cursor-pointer hover:text-cyan-300 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Student Details</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSortToggle('grade')}
                    className="p-3.5 cursor-pointer hover:text-cyan-300 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Class & Roll</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-3.5">Parent / Contact</th>
                  <th
                    onClick={() => handleSortToggle('attendancePercent')}
                    className="p-3.5 cursor-pointer hover:text-cyan-300 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Attendance</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSortToggle('duesINR')}
                    className="p-3.5 cursor-pointer hover:text-cyan-300 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Fee Balance</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                        <div className="text-xs">Loading student records...</div>
                      </div>
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Users className="w-8 h-8 text-slate-600" />
                        <div className="text-sm font-bold text-white">No students found</div>
                        <div className="text-xs text-slate-500 max-w-sm">
                          Try adjusting your search query or class filters, or enroll a new student to populate this roster.
                        </div>
                        {canModifyStudents && (
                          <button
                            onClick={() => setActiveSubTab('add')}
                            className="mt-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold hover:bg-cyan-500/20 transition-all"
                          >
                            + Enroll First Student
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  students.map((std) => (
                    <tr key={std.id} className="hover:bg-slate-900/50 transition-colors group">
                      {/* Admission & PEN */}
                      <td className="p-3.5">
                        <div className="font-bold text-cyan-300">{std.admissionNo || 'N/A'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">PEN: {std.penNo || 'Pending'}</div>
                      </td>

                      {/* Student Details */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-white text-xs">
                            {std.avatarUrl ? (
                              <img src={std.avatarUrl} alt={std.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{std.name.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <button
                              onClick={() => handleOpenProfile(std.id)}
                              className="font-bold text-white text-sm hover:text-cyan-300 text-left transition-colors flex items-center gap-1.5"
                            >
                              <span>{std.name}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-normal">
                                {std.gender}
                              </span>
                            </button>
                            <div className="text-[10px] text-slate-400">
                              DOB: {std.dob} • Blood: <span className="text-rose-400">{std.bloodGroup}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Class & Roll */}
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-bold">
                          {std.grade} ({std.section})
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1">Roll: {std.rollNo}</div>
                      </td>

                      {/* Parent & Contact */}
                      <td className="p-3.5">
                        <div className="text-white font-medium">{std.parentName}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-cyan-400/70" />
                          <span>{std.parentPhone || std.phone || 'No phone'}</span>
                        </div>
                      </td>

                      {/* Attendance */}
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[11px] inline-flex items-center gap-1 ${
                            std.attendancePercent >= 90
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                              : std.attendancePercent >= 75
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {std.attendancePercent}%
                        </span>
                      </td>

                      {/* Fee Dues */}
                      <td className="p-3.5">
                        {std.duesINR === 0 ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Paid</span>
                          </span>
                        ) : (
                          <span className="text-rose-400 font-bold">
                            ₹{std.duesINR.toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            std.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : std.status === 'suspended'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {std.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* 360 Profile */}
                          <button
                            onClick={() => handleOpenProfile(std.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-950/60 hover:text-cyan-300 text-slate-400 border border-slate-700 transition-colors"
                            title="Open 360° Profile Dossier"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Print ID Card (Smart Badge with Barcode & Logo) */}
                          <button
                            onClick={() => {
                              setSelectedStudentForIdCardModal(std);
                              onSelectForIdCard(std);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 border border-slate-700 transition-colors"
                            title="स्मार्ट आईडी कार्ड (Smart PVC ID Card with Barcode & Logo)"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>

                          {/* Transfer Certificate (TC) Generator */}
                          <button
                            onClick={() => setSelectedStudentForTcModal(std)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-950/60 text-amber-400 hover:text-amber-300 border border-slate-700 transition-colors"
                            title="स्थानांतरण प्रमाण पत्र (Official Board Transfer Certificate / TC)"
                          >
                            <Stamp className="w-3.5 h-3.5" />
                          </button>

                          {/* Document Vault (Aadhaar, Birth Cert, TC) */}
                          <button
                            onClick={() => setSelectedStudentForVaultModal(std)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-950/60 text-blue-400 hover:text-blue-300 border border-slate-700 transition-colors"
                            title="दस्तावेज़ तिजोरी (Document Vault - Aadhaar, Birth Certificate, TC Storage)"
                          >
                            <FolderLock className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Student */}
                          {canModifyStudents && (
                            <button
                              onClick={() => setEditingStudent(std)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-300 border border-slate-700 transition-colors"
                              title="Edit Student Information"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Deactivate Student */}
                          {canDeleteStudents && (
                            <button
                              onClick={() => handleDeactivateStudent(std.id, std.name)}
                              disabled={isDeletingId === std.id}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 border border-slate-700 transition-colors"
                              title="Deactivate Student"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
            <div>
              Showing{' '}
              <span className="text-white font-bold">
                {totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="text-white font-bold">
                {Math.min(currentPage * pageSize, totalRecords)}
              </span>{' '}
              of <span className="text-cyan-300 font-bold">{totalRecords}</span> students
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>per page</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-white font-bold">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUB-TAB: ENROLL NEW STUDENT (MULTI-SECTION WIZARD) */}
      {/* ========================================================================= */}
      {activeSubTab === 'add' && (
        <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-cyan-400" />
                <span>New Student Enrollment Wizard</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Official CBSE & UDISE+ compliant registration dossier.
              </p>
            </div>
            <button
              onClick={() => { setActiveSubTab('directory'); if (onCloseInitialAdd) onCloseInitialAdd(); }}
              className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              <span>Cancel & Back</span>
            </button>
          </div>

          {/* Form Step Nav */}
          <div className="flex flex-wrap gap-2 border-b border-slate-800/80 pb-3 font-mono text-xs">
            {[
              { id: 'basic', label: '1. Basic Details' },
              { id: 'admission', label: '2. Academic Info' },
              { id: 'contact', label: '3. Contact & Address' },
              { id: 'parent', label: '4. Parent / Guardian' },
              { id: 'docs', label: '5. Documents' }
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setAddFormSection(s.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                  addFormSection === s.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleAddStudentSubmit} className="space-y-6">
            {/* Step 1: Basic Information */}
            {addFormSection === 'basic' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    First Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.firstName}
                    onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })}
                    placeholder="e.g. Aarav"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                  />
                  {addFormErrors.firstName && (
                    <p className="text-[10px] text-rose-400 mt-1 font-mono">{addFormErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={addForm.middleName}
                    onChange={(e) => setAddForm({ ...addForm, middleName: e.target.value })}
                    placeholder="Optional"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Last Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.lastName}
                    onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })}
                    placeholder="e.g. Sharma"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                  />
                  {addFormErrors.lastName && (
                    <p className="text-[10px] text-rose-400 mt-1 font-mono">{addFormErrors.lastName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Gender <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={addForm.gender}
                    onChange={(e) => setAddForm({ ...addForm, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Date of Birth <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={addForm.dob}
                    onChange={(e) => setAddForm({ ...addForm, dob: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Blood Group</label>
                  <select
                    value={addForm.bloodGroup}
                    onChange={(e) => setAddForm({ ...addForm, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: Academic Info */}
            {addFormSection === 'admission' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Admission Number
                  </label>
                  <input
                    type="text"
                    value={addForm.admissionNo}
                    onChange={(e) => setAddForm({ ...addForm, admissionNo: e.target.value })}
                    placeholder="Leave blank for auto-generation"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">Format: DPS-ADM-2026-XXX</p>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Permanent Education Number (PEN)
                  </label>
                  <input
                    type="text"
                    value={addForm.penNo}
                    onChange={(e) => setAddForm({ ...addForm, penNo: e.target.value })}
                    placeholder="11-digit national UDISE+ PEN"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    value={addForm.rollNo}
                    onChange={(e) => setAddForm({ ...addForm, rollNo: e.target.value })}
                    placeholder="e.g. DPS-2026-108"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Class / Grade <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={addForm.grade}
                    onChange={(e) => setAddForm({ ...addForm, grade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={`Class ${i + 1}`}>Class {i + 1}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Section <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={addForm.section}
                    onChange={(e) => setAddForm({ ...addForm, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Academic Session
                  </label>
                  <input
                    type="text"
                    value={addForm.academicSession}
                    onChange={(e) => setAddForm({ ...addForm, academicSession: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Contact & Address */}
            {addFormSection === 'contact' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Student Phone</label>
                  <input
                    type="tel"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    placeholder="+91 98765 00000"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Student Email</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="student@school.edu.in"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-mono text-slate-300 mb-1">Residential Street Address</label>
                  <input
                    type="text"
                    value={addForm.address}
                    onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                    placeholder="House / Flat No, Sector, Landmark"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={addForm.city}
                    onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">State & PIN Code</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={addForm.state}
                      onChange={(e) => setAddForm({ ...addForm, state: e.target.value })}
                      placeholder="Haryana"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={addForm.pinCode}
                      onChange={(e) => setAddForm({ ...addForm, pinCode: e.target.value })}
                      placeholder="122001"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Parent / Guardian */}
            {addFormSection === 'parent' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Parent / Guardian Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.parentName}
                    onChange={(e) => setAddForm({ ...addForm, parentName: e.target.value })}
                    placeholder="e.g. Vikram Sharma"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                  />
                  {addFormErrors.parentName && (
                    <p className="text-[10px] text-rose-400 mt-1 font-mono">{addFormErrors.parentName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Relation</label>
                  <select
                    value={addForm.parentRelation}
                    onChange={(e) => setAddForm({ ...addForm, parentRelation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Legal Guardian</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Primary Mobile Phone <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={addForm.parentPhone}
                    onChange={(e) => setAddForm({ ...addForm, parentPhone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                  />
                  {addFormErrors.parentPhone && (
                    <p className="text-[10px] text-rose-400 mt-1 font-mono">{addFormErrors.parentPhone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Alternate Phone</label>
                  <input
                    type="tel"
                    value={addForm.parentAltPhone}
                    onChange={(e) => setAddForm({ ...addForm, parentAltPhone: e.target.value })}
                    placeholder="Emergency backup number"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Parent Email</label>
                  <input
                    type="email"
                    value={addForm.parentEmail}
                    onChange={(e) => setAddForm({ ...addForm, parentEmail: e.target.value })}
                    placeholder="parent@example.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Occupation</label>
                  <input
                    type="text"
                    value={addForm.parentOccupation}
                    onChange={(e) => setAddForm({ ...addForm, parentOccupation: e.target.value })}
                    placeholder="e.g. Software Engineer, Doctor, Business"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Step 5: Document Check */}
            {addFormSection === 'docs' && (
              <div className="space-y-3 animate-in fade-in">
                <p className="text-xs text-slate-400 font-mono">
                  Select documents verified and submitted during admission:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-cyan-500/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={addForm.hasAadhaar}
                      onChange={(e) => setAddForm({ ...addForm, hasAadhaar: e.target.checked })}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <div className="text-xs font-mono">
                      <div className="text-white font-bold">Aadhaar Card</div>
                      <div className="text-[10px] text-slate-500">Identity & Address proof</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-cyan-500/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={addForm.hasBirthCert}
                      onChange={(e) => setAddForm({ ...addForm, hasBirthCert: e.target.checked })}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <div className="text-xs font-mono">
                      <div className="text-white font-bold">Birth Certificate</div>
                      <div className="text-[10px] text-slate-500">Municipal age verification</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-cyan-500/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={addForm.hasTransferCert}
                      onChange={(e) => setAddForm({ ...addForm, hasTransferCert: e.target.checked })}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <div className="text-xs font-mono">
                      <div className="text-white font-bold">Transfer Certificate</div>
                      <div className="text-[10px] text-slate-500">From previous school</div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Form Nav & Submit Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <div className="flex gap-2">
                {addFormSection !== 'basic' && (
                  <button
                    type="button"
                    onClick={() => {
                      type FormSection = 'basic' | 'admission' | 'contact' | 'parent' | 'docs';
                      const steps: FormSection[] = ['basic', 'admission', 'contact', 'parent', 'docs'];
                      const cur = steps.indexOf(addFormSection as FormSection);
                      if (cur > 0) setAddFormSection(steps[cur - 1]);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono"
                  >
                    ← Previous
                  </button>
                )}
                {addFormSection !== 'docs' && (
                  <button
                    type="button"
                    onClick={() => {
                      type FormSection = 'basic' | 'admission' | 'contact' | 'parent' | 'docs';
                      const steps: FormSection[] = ['basic', 'admission', 'contact', 'parent', 'docs'];
                      const cur = steps.indexOf(addFormSection as FormSection);
                      if (cur < steps.length - 1) setAddFormSection(steps[cur + 1]);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono"
                  >
                    Next Step →
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={submittingAdd}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs font-mono flex items-center gap-2 shadow-lg shadow-cyan-500/20 hover:brightness-110 disabled:opacity-50 transition-all"
              >
                {submittingAdd ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Enrolling Student...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Complete Enrollment</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUB-TAB: BATCH EXCEL / CSV BULK IMPORT CONSOLE */}
      {/* ========================================================================= */}
      {activeSubTab === 'import' && (
        <BulkImportConsole
          entityType="student"
          title="Bulk Student Enrollment Console (Excel & CSV)"
          subtitle="Ingest student roster records via Excel (.xlsx, .xls) or CSV with automated duplicate detection, PEN verification & row-level error reporting."
          sampleFileName="Dakshora_Student_Roster_Template"
          fields={[
            { key: 'admissionNo', label: 'Admission Number', aliases: ['admission_no', 'adm_no', 'admno', 'admnumber', 'admissionnumber'], required: false, example: 'DPS-2026-301' },
            { key: 'name', label: 'Student Full Name', aliases: ['student_name', 'fullname', 'studentname', 'name'], required: true, example: 'Aarav Patel' },
            { key: 'penNo', label: 'PEN Number', aliases: ['pen_no', 'pen', 'pennumber'], example: '202606180101' },
            { key: 'rollNo', label: 'Roll Number', aliases: ['roll_no', 'rollno', 'roll'], example: 'DPS-2026-301' },
            { key: 'grade', label: 'Class / Grade', aliases: ['class', 'grade', 'standard'], required: true, example: 'Class 10' },
            { key: 'section', label: 'Section', aliases: ['sec', 'section'], example: 'A' },
            { key: 'gender', label: 'Gender', aliases: ['sex', 'gender'], example: 'Male' },
            { key: 'dob', label: 'Date of Birth', aliases: ['date_of_birth', 'birthdate', 'dob'], example: '2011-04-12' },
            { key: 'parentName', label: 'Father / Guardian Name', aliases: ['father_name', 'fathername', 'parent_name', 'guardian_name'], example: 'Manoj Patel' },
            { key: 'motherName', label: 'Mother Name', aliases: ['mother_name', 'mothername'], example: 'Sunita Patel' },
            { key: 'parentPhone', label: 'Parent Mobile', aliases: ['parent_phone', 'mobile', 'phone', 'contact'], example: '+91 98765 43210' },
            { key: 'parentEmail', label: 'Parent Email', aliases: ['parent_email', 'email'], example: 'parent@gmail.com' },
            { key: 'bloodGroup', label: 'Blood Group', aliases: ['blood_group', 'bloodgroup', 'blood'], example: 'B+' },
            { key: 'category', label: 'Category', aliases: ['caste', 'category'], example: 'General' },
            { key: 'address', label: 'Residential Address', aliases: ['address', 'residence'], example: 'Sector 45, Gurugram' }
          ]}
          existingUniqueKeys={{
            admissionNos: new Set(students.map(s => (s.admissionNo || '').toLowerCase())),
            penNos: new Set(students.map(s => s.penNo).filter(Boolean) as string[])
          }}
          onCommitImport={async (validList) => {
            const mapped = validList.map((r, i) => ({
              name: r.name,
              admissionNo: r.admissionNo || `DPS-ADM-2026-${1000 + i}`,
              penNo: r.penNo,
              rollNo: r.rollNo || `DPS-2026-${1000 + i}`,
              grade: r.grade,
              section: r.section || 'A',
              gender: r.gender || 'Not specified',
              dob: r.dob || '2011-01-01',
              parentName: r.parentName || 'Parent',
              motherName: r.motherName || '',
              parentPhone: r.parentPhone || '+91 98000 00000',
              parentEmail: r.parentEmail || '',
              bloodGroup: r.bloodGroup || 'B+',
              category: r.category || 'General',
              address: r.address || 'Local Residence'
            }));
            const res = await importErpStudents(mapped, false);
            if (res.data?.success) {
              loadStudents(true);
              return { success: true, importedCount: res.data.importedCount || validList.length };
            }
            return { success: false, importedCount: 0, message: res.data?.message || 'Import failed' };
          }}
          onShowToast={(t, title, msg) => onShowToast(t === 'warning' ? 'info' : t, title, msg)}
          onClose={() => setActiveSubTab('directory')}
        />
      )}

      {/* ========================================================================= */}
      {/* 5. 360-DEGREE STUDENT PROFILE MODAL / DOSSIER */}
      {/* ========================================================================= */}
      {selectedStudentForProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0B0F19] border border-cyan-500/40 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            {profileLoading || !studentProfileData ? (
              <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
                <div className="text-xs font-mono">Fetching 360° Student Dossier...</div>
              </div>
            ) : (
              <>
                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-cyan-400/80 overflow-hidden flex-shrink-0 flex items-center justify-center text-white text-xl font-black">
                      {studentProfileData.student.avatarUrl ? (
                        <img src={studentProfileData.student.avatarUrl} alt={studentProfileData.student.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{studentProfileData.student.name.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-white">{studentProfileData.student.name}</h3>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase">
                          {studentProfileData.student.status}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-cyan-300 flex flex-wrap gap-2 mt-0.5">
                        <span>Adm: {studentProfileData.student.admissionNo}</span>
                        <span>•</span>
                        <span>PEN: {studentProfileData.student.penNo || 'N/A'}</span>
                        <span>•</span>
                        <span>{studentProfileData.student.grade} ({studentProfileData.student.section})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedStudentForIdCardModal(studentProfileData.student);
                        onSelectForIdCard(studentProfileData.student);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                      title="Generate PVC Student ID Card"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>ID Card</span>
                    </button>
                    <button
                      onClick={() => setSelectedStudentForTcModal(studentProfileData.student)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                      title="Issue Official Transfer Certificate (TC)"
                    >
                      <Stamp className="w-3.5 h-3.5" />
                      <span>Issue TC</span>
                    </button>
                    <button
                      onClick={() => setSelectedStudentForVaultModal(studentProfileData.student)}
                      className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                      title="Open Document Vault"
                    >
                      <FolderLock className="w-3.5 h-3.5" />
                      <span>Vault</span>
                    </button>
                    <button
                      onClick={handleCloseProfile}
                      className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 7 Tab Bar */}
                <div className="flex overflow-x-auto gap-1 border-b border-slate-800 pb-2 text-xs font-mono">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'academic', label: 'Academic' },
                    { id: 'attendance', label: 'Attendance' },
                    { id: 'fees', label: 'Fees & Dues' },
                    { id: 'documents', label: 'Documents' },
                    { id: 'parents', label: 'Guardian' },
                    { id: 'activity', label: 'Audit Log' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setProfileActiveTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                        profileActiveTab === tab.id
                          ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Profile Tab Contents */}
                {/* 1. Overview */}
                {profileActiveTab === 'overview' && (
                  <div className="space-y-4 font-mono text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                        <div className="text-slate-500 text-[10px]">Attendance Rate</div>
                        <div className="text-base font-bold text-emerald-400">
                          {studentProfileData.attendance.overallPercent}%
                        </div>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                        <div className="text-slate-500 text-[10px]">Fee Balance</div>
                        <div className="text-base font-bold text-amber-400">
                          ₹{studentProfileData.fees.totalDue.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                        <div className="text-slate-500 text-[10px]">Date of Birth</div>
                        <div className="text-white font-bold">{studentProfileData.student.dob}</div>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                        <div className="text-slate-500 text-[10px]">Blood Group</div>
                        <div className="text-rose-400 font-bold">{studentProfileData.student.bloodGroup}</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="text-slate-400 font-bold text-[11px]">Primary Contact & Address</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                        <div>Parent: <span className="text-white font-bold">{studentProfileData.parents.name}</span> ({studentProfileData.parents.relation})</div>
                        <div>Phone: <span className="text-cyan-300 font-bold">{studentProfileData.parents.phone}</span></div>
                        <div>Email: <span className="text-slate-400">{studentProfileData.parents.email || 'None on file'}</span></div>
                        <div>Occupation: <span className="text-white">{studentProfileData.parents.occupation || 'N/A'}</span></div>
                        <div className="sm:col-span-2">Address: <span className="text-white">{studentProfileData.student.address}</span></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Academic */}
                {profileActiveTab === 'academic' && (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="text-slate-400 font-bold text-[11px]">Academic Affiliation</div>
                      <div className="grid grid-cols-2 gap-3 text-slate-300">
                        <div>Grade / Class: <span className="text-white font-bold">{studentProfileData.academic.grade}</span></div>
                        <div>Section: <span className="text-white font-bold">{studentProfileData.academic.section}</span></div>
                        <div>Roll Number: <span className="text-cyan-300 font-bold">{studentProfileData.academic.rollNo}</span></div>
                        <div>Academic Session: <span className="text-white">{studentProfileData.academic.session}</span></div>
                        <div>Admission Date: <span className="text-white">{studentProfileData.academic.admissionDate || '2026-04-01'}</span></div>
                        <div>Class Teacher: <span className="text-emerald-400 font-bold">{studentProfileData.academic.classTeacher}</span></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Attendance */}
                {profileActiveTab === 'attendance' && (
                  <div className="space-y-4 font-mono text-xs">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                        <div className="text-slate-500 text-[10px]">Total Working Days</div>
                        <div className="text-lg font-bold text-white">{studentProfileData.attendance.totalWorkingDays} Days</div>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                        <div className="text-slate-500 text-[10px]">Days Present</div>
                        <div className="text-lg font-bold text-emerald-400">{studentProfileData.attendance.presentDays} Days</div>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                        <div className="text-slate-500 text-[10px]">Days Absent / Leave</div>
                        <div className="text-lg font-bold text-rose-400">{studentProfileData.attendance.absentDays} Days</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="text-slate-400 font-bold text-[11px]">Attendance Percentage Progress</div>
                      <div className="w-full bg-slate-900 rounded-full h-3 border border-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            studentProfileData.attendance.overallPercent >= 90
                              ? 'bg-emerald-500'
                              : studentProfileData.attendance.overallPercent >= 75
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, studentProfileData.attendance.overallPercent)}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Minimum 75% attendance mandatory for CBSE Board examination eligibility.
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Fees */}
                {profileActiveTab === 'fees' && (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                      <div>
                        <div className="text-slate-500 text-[10px]">Total Outstanding Balance</div>
                        <div className="text-xl font-bold text-amber-400">
                          ₹{studentProfileData.fees.totalDue.toLocaleString()}
                        </div>
                      </div>
                      {studentProfileData.fees.totalDue === 0 && (
                        <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                          All Term Dues Cleared
                        </div>
                      )}
                    </div>

                    {studentProfileData.fees.invoices.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-slate-800">
                        <table className="w-full text-left text-[11px]">
                          <thead>
                            <tr className="border-b border-slate-800 bg-slate-950 text-slate-400">
                              <th className="p-2.5">Invoice #</th>
                              <th className="p-2.5">Type</th>
                              <th className="p-2.5">Amount</th>
                              <th className="p-2.5">Due Date</th>
                              <th className="p-2.5">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {studentProfileData.fees.invoices.map((inv) => (
                              <tr key={inv.id} className="bg-slate-950/40">
                                <td className="p-2.5 text-cyan-300 font-bold">{inv.invoiceNo}</td>
                                <td className="p-2.5 text-white">{inv.feeType}</td>
                                <td className="p-2.5 font-bold">₹{inv.amountINR.toLocaleString()}</td>
                                <td className="p-2.5 text-slate-400">{inv.dueDate}</td>
                                <td className="p-2.5">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      inv.status === 'paid'
                                        ? 'bg-emerald-500/10 text-emerald-400'
                                        : inv.status === 'overdue'
                                        ? 'bg-rose-500/10 text-rose-400'
                                        : 'bg-amber-500/10 text-amber-400'
                                    }`}
                                  >
                                    {inv.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
                        No outstanding invoices registered for this student.
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Documents */}
                {profileActiveTab === 'documents' && (
                  <div className="space-y-4 font-mono text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      <div>
                        <div className="text-white font-bold flex items-center gap-1.5">
                          <FolderLock className="w-4 h-4 text-cyan-400" />
                          <span>विद्यार्थी दस्तावेज़ तिजोरी (Document Vault Dossier)</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          आधार कार्ड, जन्म प्रमाण पत्र, पूर्व स्कूल टीसी एवं अंकतालिका
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedStudentForVaultModal(studentProfileData.student)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/20"
                      >
                        <FolderLock className="w-3.5 h-3.5" />
                        <span>तिजोरी खोलें / अपलोड करें (Manage Vault)</span>
                      </button>
                    </div>

                    {studentProfileData.documents.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {studentProfileData.documents.map((doc) => (
                          <div key={doc.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <FileText className="w-5 h-5 text-cyan-400" />
                              <div>
                                <div className="text-white font-bold">{doc.name}</div>
                                <div className="text-[10px] text-slate-500">Submitted: {doc.uploadedAt}</div>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Verified
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
                        <div>No digital documents attached to this student record.</div>
                        <button
                          onClick={() => setSelectedStudentForVaultModal(studentProfileData.student)}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 font-bold text-xs"
                        >
                          + प्रथम दस्तावेज़ अपलोड करें (Upload First Doc)
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. Parents */}
                {profileActiveTab === 'parents' && (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="text-slate-400 font-bold text-[11px]">Guardian Dossier</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-slate-300">
                        <div>Name: <span className="text-white font-bold">{studentProfileData.parents.name}</span></div>
                        <div>Relation: <span className="text-white font-bold">{studentProfileData.parents.relation}</span></div>
                        <div>Phone: <span className="text-cyan-300 font-bold">{studentProfileData.parents.phone}</span></div>
                        <div>Alt Phone: <span className="text-slate-400">{studentProfileData.parents.altPhone || 'None'}</span></div>
                        <div>Email: <span className="text-slate-300">{studentProfileData.parents.email || 'None'}</span></div>
                        <div>Occupation: <span className="text-white">{studentProfileData.parents.occupation || 'N/A'}</span></div>
                        <div className="sm:col-span-2">Address: <span className="text-white">{studentProfileData.parents.address}</span></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. Activity */}
                {profileActiveTab === 'activity' && (
                  <div className="space-y-2 font-mono text-xs">
                    {studentProfileData.activity.length > 0 ? (
                      studentProfileData.activity.map((act) => (
                        <div key={act.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="text-cyan-300 font-bold">{act.action}</span>
                            <div className="text-[10px] text-slate-500">By {act.user_email}</div>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(act.timestamp).toLocaleString()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
                        No audit events recorded for this student yet.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. EDIT STUDENT MODAL */}
      {/* ========================================================================= */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0B0F19] border border-amber-500/40 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-amber-400" />
                  <span>Edit Student Information</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">Admission No: {editingStudent.admissionNo}</p>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Class / Grade</label>
                  <select
                    value={editingStudent.grade}
                    onChange={(e) => setEditingStudent({ ...editingStudent, grade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-amber-400 focus:outline-none"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={`Class ${i + 1}`}>Class {i + 1}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Section</label>
                  <select
                    value={editingStudent.section}
                    onChange={(e) => setEditingStudent({ ...editingStudent, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Roll Number</label>
                  <input
                    type="text"
                    value={editingStudent.rollNo}
                    onChange={(e) => setEditingStudent({ ...editingStudent, rollNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Status</label>
                  <select
                    value={editingStudent.status}
                    onChange={(e) => setEditingStudent({ ...editingStudent, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                    <option value="alumni">Alumni</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Parent Name</label>
                  <input
                    type="text"
                    value={editingStudent.parentName}
                    onChange={(e) => setEditingStudent({ ...editingStudent, parentName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Parent Phone</label>
                  <input
                    type="tel"
                    value={editingStudent.parentPhone}
                    onChange={(e) => setEditingStudent({ ...editingStudent, parentPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={editingStudent.address}
                  onChange={(e) => setEditingStudent({ ...editingStudent, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🪪 SMART STUDENT ID CARD MODAL */}
      {selectedStudentForIdCardModal && (
        <StudentIdCardModal
          student={selectedStudentForIdCardModal}
          allStudents={students}
          onClose={() => setSelectedStudentForIdCardModal(null)}
          onShowToast={onShowToast}
        />
      )}

      {/* 📜 TRANSFER CERTIFICATE (TC) MODAL */}
      {selectedStudentForTcModal && (
        <TransferCertificateModal
          student={selectedStudentForTcModal}
          onClose={() => setSelectedStudentForTcModal(null)}
          onShowToast={onShowToast}
          onStudentUpdated={(updated) => {
            setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
            if (studentProfileData?.student.id === updated.id) {
              setStudentProfileData({ ...studentProfileData, student: updated });
            }
          }}
        />
      )}

      {/* 🗄️ DOCUMENT VAULT MODAL */}
      {selectedStudentForVaultModal && (
        <DocumentVaultModal
          student={selectedStudentForVaultModal}
          onClose={() => setSelectedStudentForVaultModal(null)}
          onShowToast={onShowToast}
          onStudentUpdated={(updated) => {
            setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
            if (studentProfileData?.student.id === updated.id) {
              setStudentProfileData({ ...studentProfileData, student: updated });
            }
          }}
        />
      )}
    </div>
  );
};
