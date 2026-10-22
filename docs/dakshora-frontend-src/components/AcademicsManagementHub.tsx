import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen,
  Layers,
  GraduationCap,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  Clock,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  FileText,
  ChevronRight,
  AlertCircle,
  Shield,
  Award,
  BookMarked,
  ClipboardCheck,
  X,
  DoorOpen,
  UserCheck,
  Building,
  Check,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import {
  ErpRole,
  AcademicSessionRecord,
  AcademicClassRecord,
  AcademicSectionRecord,
  AcademicSubjectRecord,
  SectionSubjectMappingRecord,
  AcademicHomeworkRecord,
  AcademicsOverviewSummary,
  ErpStudentRecord,
  ErpStaffRecord
} from '../types';
import {
  fetchAcademicsOverview,
  fetchAcademicSessions,
  createAcademicSession,
  activateAcademicSession,
  fetchAcademicClasses,
  createAcademicClass,
  fetchAcademicSections,
  createAcademicSection,
  assignClassTeacher,
  fetchAcademicSubjects,
  createAcademicSubject,
  fetchSectionSubjectMappings,
  assignSubjectToSection,
  removeSubjectFromSection,
  fetchAcademicHomework,
  createAcademicHomework,
  updateAcademicHomework,
  deleteAcademicHomework,
  fetchErpStudents,
  fetchErpStaff
} from '../services/api';

interface AcademicsManagementHubProps {
  activeRole: ErpRole;
  activeSession?: string;
  organizationId?: string;
  currentStaffId?: string;
  onShowToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

type TabType = 'overview' | 'classes_sections' | 'subjects' | 'allocations' | 'homework' | 'sessions';
type DossierTabType = 'overview' | 'students' | 'subjects' | 'homework' | 'attendance' | 'exams';

export const AcademicsManagementHub: React.FC<AcademicsManagementHubProps> = ({
  activeRole,
  activeSession = '2026-27',
  organizationId = 'b17780e5-3832-4ac6-9aeb-33fd80c5cb0e',
  currentStaffId,
  onShowToast
}) => {
  // Navigation & Active State
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Core Academics Data
  const [overview, setOverview] = useState<AcademicsOverviewSummary | null>(null);
  const [sessions, setSessions] = useState<AcademicSessionRecord[]>([]);
  const [classes, setClasses] = useState<AcademicClassRecord[]>([]);
  const [sections, setSections] = useState<AcademicSectionRecord[]>([]);
  const [subjects, setSubjects] = useState<AcademicSubjectRecord[]>([]);
  const [mappings, setMappings] = useState<SectionSubjectMappingRecord[]>([]);
  const [homeworkList, setHomeworkList] = useState<AcademicHomeworkRecord[]>([]);
  const [staffList, setStaffList] = useState<ErpStaffRecord[]>([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedHomeworkStatus, setSelectedHomeworkStatus] = useState<string>('all');

  // Dossier Modal State
  const [dossierSection, setDossierSection] = useState<AcademicSectionRecord | null>(null);
  const [dossierTab, setDossierTab] = useState<DossierTabType>('overview');
  const [dossierStudents, setDossierStudents] = useState<ErpStudentRecord[]>([]);
  const [dossierStudentsLoading, setDossierStudentsLoading] = useState<boolean>(false);

  // Action Modals
  const [showAddSessionModal, setShowAddSessionModal] = useState<boolean>(false);
  const [showAddClassModal, setShowAddClassModal] = useState<boolean>(false);
  const [showAddSectionModal, setShowAddSectionModal] = useState<boolean>(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState<boolean>(false);
  const [showMapSubjectModal, setShowMapSubjectModal] = useState<boolean>(false);
  const [showAddHomeworkModal, setShowAddHomeworkModal] = useState<boolean>(false);
  const [assignTeacherSection, setAssignTeacherSection] = useState<AcademicSectionRecord | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');

  // Form States
  const [sessionForm, setSessionForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    status: 'upcoming'
  });

  const [classForm, setClassForm] = useState({
    grade: '',
    wing: 'Secondary Wing',
    order: 10
  });

  const [sectionForm, setSectionForm] = useState({
    grade: 'Class 10',
    section: 'A',
    roomNumber: 'Room 301',
    capacity: 40,
    classTeacherId: ''
  });

  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    category: 'Core',
    maxMarks: 100,
    passMarks: 33
  });

  const [mapSubjectForm, setMapSubjectForm] = useState({
    grade: 'Class 10',
    section: 'A',
    subjectId: '',
    assignedTeacherId: ''
  });

  const [homeworkForm, setHomeworkForm] = useState({
    grade: 'Class 10',
    section: 'A',
    subject: 'Mathematics Standard',
    title: '',
    description: '',
    assignedDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  });

  const isTeacher = activeRole === 'teacher';
  const isAdmin = activeRole === 'admin' || (activeRole as string) === 'school-admin' || (activeRole as string) === 'superadmin';

  // Load all initial academic datasets
  const loadAcademicsData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    try {
      const [
        ovRes,
        sessRes,
        clsRes,
        secRes,
        subRes,
        mapRes,
        hwRes,
        stfRes
      ] = await Promise.all([
        fetchAcademicsOverview(organizationId),
        fetchAcademicSessions(organizationId),
        fetchAcademicClasses(organizationId),
        fetchAcademicSections(undefined, organizationId),
        fetchAcademicSubjects(),
        fetchSectionSubjectMappings({ session: activeSession }),
        fetchAcademicHomework({
          session: activeSession,
          role: activeRole,
          staffId: currentStaffId
        }),
        fetchErpStaff({ limit: 100 })
      ]);

      if (ovRes.data?.success && ovRes.data.overview) {
        setOverview(ovRes.data.overview);
      }
      if (sessRes.data?.sessions) {
        setSessions(sessRes.data.sessions);
      }
      if (clsRes.data?.classes) {
        setClasses(clsRes.data.classes);
      }
      if (secRes.data?.sections) {
        setSections(secRes.data.sections);
      }
      if (subRes.data?.subjects) {
        setSubjects(subRes.data.subjects);
      }
      if (mapRes.data?.mappings) {
        setMappings(mapRes.data.mappings);
      }
      if (hwRes.data?.homework) {
        setHomeworkList(hwRes.data.homework);
      }
      if (stfRes.data?.staff) {
        setStaffList(stfRes.data.staff);
      }
    } catch (err: any) {
      console.error('Failed to load Academics data:', err);
      onShowToast?.('error', 'Sync Failed', err.message || 'Could not load academics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [organizationId, activeSession, activeRole, currentStaffId, onShowToast]);

  useEffect(() => {
    loadAcademicsData();
  }, [loadAcademicsData]);

  // Load Dossier Students when a section is opened
  useEffect(() => {
    if (!dossierSection) {
      setDossierStudents([]);
      return;
    }

    const fetchSectionStudents = async () => {
      setDossierStudentsLoading(true);
      try {
        const res = await fetchErpStudents({
          grade: dossierSection.grade,
          section: dossierSection.section,
          session: activeSession,
          limit: 100
        });
        if (res.data?.students) {
          setDossierStudents(res.data.students);
        }
      } catch (err) {
        console.error('Failed to load section students:', err);
      } finally {
        setDossierStudentsLoading(false);
      }
    };

    fetchSectionStudents();
  }, [dossierSection, activeSession]);

  // Session Handlers
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionForm.name || !sessionForm.startDate || !sessionForm.endDate) {
      onShowToast?.('error', 'Validation Error', 'Please complete all required session fields');
      return;
    }
    if (sessionForm.startDate >= sessionForm.endDate) {
      onShowToast?.('error', 'Invalid Date Range', 'Session start date must be before end date');
      return;
    }

    try {
      const res = await createAcademicSession(sessionForm);
      if (res.data?.success) {
        onShowToast?.('success', 'Session Created', `Academic session '${sessionForm.name}' established`);
        setShowAddSessionModal(false);
        setSessionForm({ name: '', startDate: '', endDate: '', isCurrent: false, status: 'upcoming' });
        loadAcademicsData(true);
      } else {
        onShowToast?.('error', 'Creation Failed', res.data?.message || 'Could not create session');
      }
    } catch (err: any) {
      onShowToast?.('error', 'Request Failed', err.message || 'Failed to create academic session');
    }
  };

  const handleActivateSession = async (id: string, name: string) => {
    if (!window.confirm(`Activate academic session '${name}'? This will mark it as the current active session.`)) {
      return;
    }
    try {
      const res = await activateAcademicSession(id);
      if (res.data?.success) {
        onShowToast?.('success', 'Session Activated', `Session '${name}' is now current.`);
        loadAcademicsData(true);
      } else {
        onShowToast?.('error', 'Activation Failed', res.data?.message || 'Could not activate session');
      }
    } catch (err: any) {
      onShowToast?.('error', 'Action Error', err.message || 'Failed to activate session');
    }
  };

  // Class & Section Handlers
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.grade) {
      onShowToast?.('error', 'Validation Error', 'Grade name is required');
      return;
    }
    try {
      const res = await createAcademicClass(classForm);
      if (res.data?.success) {
        onShowToast?.('success', 'Class Created', `${classForm.grade} registered successfully`);
        setShowAddClassModal(false);
        setClassForm({ grade: '', wing: 'Secondary Wing', order: 10 });
        loadAcademicsData(true);
      } else {
        onShowToast?.('error', 'Creation Failed', res.data?.message || 'Could not create class');
      }
    } catch (err: any) {
      onShowToast?.('error', 'Request Error', err.message || 'Failed to create class');
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionForm.grade || !sectionForm.section) {
      onShowToast?.('error', 'Validation Error', 'Grade and section are required');
      return;
    }
    try {
      const res = await createAcademicSection(sectionForm);
      if (res.data?.success) {
        onShowToast?.('success', 'Section Created', `${sectionForm.grade} Section ${sectionForm.section} created`);
        setShowAddSectionModal(false);
        setSectionForm({ grade: 'Class 10', section: 'C', roomNumber: '', capacity: 40, classTeacherId: '' });
        loadAcademicsData(true);
      } else {
        onShowToast?.('error', 'Creation Failed', res.data?.message || 'Could not create section');
      }
    } catch (err: any) {
      onShowToast?.('error', 'Request Error', err.message || 'Failed to create section');
    }
  };

  const handleAssignClassTeacher = async () => {
    if (!assignTeacherSection) return;
    try {
      const res = await assignClassTeacher(assignTeacherSection.id, selectedTeacherId || null);
      if (res.data?.success) {
        onShowToast?.('success', 'Faculty Allocated', res.data.message || 'Faculty allocated successfully');
        setAssignTeacherSection(null);
        setSelectedTeacherId('');
        loadAcademicsData(true);
      } else {
        onShowToast?.('error', 'Allocation Failed', res.data?.message || 'Could not allocate faculty');
      }
    } catch (err: any) {
      onShowToast?.('error', 'Allocation Error', err.message || 'Failed to assign class teacher');
    }
  };

  // Subject Handlers
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.name || !subjectForm.code) {
      onShowToast?.('error', 'Validation Error', 'Subject name and code are required');
      return;
    }
    try {
      const res = await createAcademicSubject(subjectForm);
      if (res.data?.success) {
        onShowToast?.('success', 'Subject Added', `${subjectForm.name} (${subjectForm.code}) added to catalogue`);
        setShowAddSubjectModal(false);
        setSubjectForm({ name: '', code: '', category: 'Core', maxMarks: 100, passMarks: 33 });
        loadAcademicsData(true);
      } else {
        onShowToast?.('error', 'Add Failed', res.data?.message || 'Could not add subject');
      }
    } catch (err: any) {
      onShowToast?.('error', 'Request Error', err.message || 'Failed to add subject');
    }
  };

  // Section-Subject Mapping Handlers
  const handleMapSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSubjectForm.grade || !mapSubjectForm.section || !mapSubjectForm.subjectId) {
      onShowToast?.('error', 'Validation Error', 'Please select class, section, and subject');
      return;
    }
    try {
      const res = await assignSubjectToSection({
        ...mapSubjectForm,
        academicSession: activeSession
      });
      if (res.data?.success) {
        onShowToast?.('success', 'Subject Mapped', res.data.message || 'Subject mapped successfully');
        setShowMapSubjectModal(false);
        setMapSubjectForm({ grade: 'Class 10', section: 'A', subjectId: '', assignedTeacherId: '' });
        loadAcademicsData(true);
      } else {
        onShowToast?.('error', 'Mapping Failed', res.data?.message || 'Could not map subject');
      }
    } catch (err: any) {
      onShowToast?.('error', 'Mapping Error', err.message || 'Failed to map subject');
    }
  };

  const handleRemoveMapping = async (id: string, subName: string) => {
    if (!window.confirm(`Remove subject assignment '${subName}' from this section?`)) return;
    try {
      const res = await removeSubjectFromSection(id);
      if (res.data?.success) {
        onShowToast?.('success', 'Mapping Removed', `${subName} unassigned from section`);
        loadAcademicsData(true);
      }
    } catch (err: any) {
      onShowToast?.('error', 'Action Error', err.message || 'Failed to remove mapping');
    }
  };

  // Homework Handlers
  const handleCreateHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeworkForm.title || !homeworkForm.dueDate) {
      onShowToast?.('error', 'Validation Error', 'Homework title and due date are required');
      return;
    }
    if (homeworkForm.dueDate < homeworkForm.assignedDate) {
      onShowToast?.('error', 'Invalid Due Date', 'Due date cannot be earlier than assigned date');
      return;
    }

    try {
      const res = await createAcademicHomework({
        ...homeworkForm,
        academicSession: activeSession,
        teacherId: currentStaffId,
        role: activeRole,
        staffId: currentStaffId
      });
      if (res.data?.success) {
        onShowToast?.('success', 'Homework Assigned', `Homework "${homeworkForm.title}" published`);
        setShowAddHomeworkModal(false);
        setHomeworkForm({
          grade: 'Class 10',
          section: 'A',
          subject: 'Mathematics Standard',
          title: '',
          description: '',
          assignedDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
        });
        loadAcademicsData(true);
      } else {
        onShowToast?.('error', 'Assignment Failed', res.data?.message || 'Could not assign homework');
      }
    } catch (err: any) {
      onShowToast?.('error', 'Action Error', err.message || 'Failed to assign homework');
    }
  };

  const handleUpdateHomeworkStatus = async (id: string, newStatus: 'assigned' | 'submitted' | 'evaluated' | 'cancelled') => {
    try {
      const res = await updateAcademicHomework(id, { status: newStatus });
      if (res.data?.success) {
        onShowToast?.('success', 'Status Updated', `Homework marked as ${newStatus}`);
        loadAcademicsData(true);
      }
    } catch (err: any) {
      onShowToast?.('error', 'Update Error', err.message || 'Failed to update homework status');
    }
  };

  const handleDeleteHomework = async (id: string, title: string) => {
    if (!window.confirm(`Delete homework assignment "${title}"?`)) return;
    try {
      const res = await deleteAcademicHomework(id);
      if (res.data?.success) {
        onShowToast?.('success', 'Homework Removed', `Assignment deleted`);
        loadAcademicsData(true);
      }
    } catch (err: any) {
      onShowToast?.('error', 'Delete Error', err.message || 'Failed to delete homework');
    }
  };

  // Filtered Lists
  const filteredSections = useMemo(() => {
    return sections.filter((s) => {
      const matchGrade = selectedGradeFilter === 'all' || s.grade.toLowerCase() === selectedGradeFilter.toLowerCase();
      const matchSearch =
        !searchQuery ||
        s.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.classTeacherName && s.classTeacherName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.roomNumber && s.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchGrade && matchSearch;
    });
  }, [sections, selectedGradeFilter, searchQuery]);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((sub) => {
      const matchCat = selectedCategoryFilter === 'all' || sub.category.toLowerCase() === selectedCategoryFilter.toLowerCase();
      const matchSearch =
        !searchQuery ||
        sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [subjects, selectedCategoryFilter, searchQuery]);

  const filteredHomework = useMemo(() => {
    return homeworkList.filter((hw) => {
      const matchGrade = selectedGradeFilter === 'all' || hw.grade.toLowerCase() === selectedGradeFilter.toLowerCase();
      const matchStatus = selectedHomeworkStatus === 'all' || hw.status === selectedHomeworkStatus;
      const matchSearch =
        !searchQuery ||
        hw.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hw.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hw.teacherName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchGrade && matchStatus && matchSearch;
    });
  }, [homeworkList, selectedGradeFilter, selectedHomeworkStatus, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-sm font-mono text-slate-400">Loading Academic Repository & Rosters...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Module Top Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Academics Management Hub</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                  {overview?.activeSession || activeSession}
                </span>
                {isTeacher && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-950 text-purple-300 border border-purple-500/30">
                    Faculty View
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Curriculum structure, session governance, class-section allocations, and homework operations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={() => loadAcademicsData(true)}
            disabled={refreshing}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 text-xs font-mono flex items-center gap-2 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setShowAddClassModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Add Class</span>
              </button>
              <button
                onClick={() => setShowAddSectionModal(true)}
                className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-lg shadow-cyan-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Section</span>
              </button>
            </>
          )}

          <button
            onClick={() => setShowAddHomeworkModal(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-lg shadow-purple-600/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Assign Homework</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('classes_sections')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 ${
            activeTab === 'classes_sections'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Classes & Sections</span>
          <span className="px-1.5 py-0.2 rounded-md bg-slate-800 text-[10px] text-slate-300">
            {sections.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('subjects')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 ${
            activeTab === 'subjects'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <BookMarked className="w-3.5 h-3.5" />
          <span>Subjects Catalogue</span>
          <span className="px-1.5 py-0.2 rounded-md bg-slate-800 text-[10px] text-slate-300">
            {subjects.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('allocations')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 ${
            activeTab === 'allocations'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Teacher Allocations</span>
          <span className="px-1.5 py-0.2 rounded-md bg-slate-800 text-[10px] text-slate-300">
            {mappings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('homework')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 ${
            activeTab === 'homework'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <ClipboardCheck className="w-3.5 h-3.5" />
          <span>Homework Hub</span>
          <span className="px-1.5 py-0.2 rounded-md bg-purple-950 text-[10px] text-purple-300 border border-purple-500/30">
            {homeworkList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 ${
            activeTab === 'sessions'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Academic Sessions</span>
          <span className="px-1.5 py-0.2 rounded-md bg-slate-800 text-[10px] text-slate-300">
            {sessions.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & SECTION STRENGTH EXPLORER */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 6 Real Database KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 space-y-1">
              <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>Active Session</span>
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono">{overview?.activeSession || '2026-27'}</div>
              <div className="text-[10px] text-emerald-400 font-mono">Status: Active</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 space-y-1">
              <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>Total Classes</span>
                <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono">{overview?.totalClasses ?? classes.length}</div>
              <div className="text-[10px] text-slate-500 font-mono">Secondary & Senior</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 space-y-1">
              <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>Total Sections</span>
                <DoorOpen className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono">{overview?.totalSections ?? sections.length}</div>
              <div className="text-[10px] text-cyan-400 font-mono">Live Roster Active</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 space-y-1">
              <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>CBSE Subjects</span>
                <BookMarked className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono">{overview?.totalSubjects ?? subjects.length}</div>
              <div className="text-[10px] text-amber-400 font-mono">Catalogue Standard</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 space-y-1">
              <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>Enrolled Students</span>
                <Users className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-emerald-400 font-mono">
                {overview?.totalStudentsEnrolled ?? 0}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Live Database Count</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 space-y-1">
              <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>Homework Units</span>
                <ClipboardCheck className="w-3.5 h-3.5 text-pink-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono">{overview?.totalHomeworkAssigned ?? homeworkList.length}</div>
              <div className="text-[10px] text-purple-400 font-mono">Tracked & Audited</div>
            </div>
          </div>

          {/* Section Explorer & Strength Matrix */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <DoorOpen className="w-4 h-4 text-cyan-400" />
                  <span>Section Strength & Faculty Allocation Explorer</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Click any section card to open its complete Class Academic Dossier with real student roster.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-500">
                  Allocated: <strong className="text-emerald-400">{overview?.assignedClassTeachers ?? 0}</strong> | Vacant: <strong className="text-amber-400">{overview?.unassignedClassTeachers ?? 0}</strong>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sections.map((sec) => {
                const occupancyPct = Math.round(((sec.studentCount || 0) / (sec.capacity || 40)) * 100);
                return (
                  <div
                    key={sec.id}
                    onClick={() => {
                      setDossierSection(sec);
                      setDossierTab('overview');
                    }}
                    className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/40 cursor-pointer transition group relative space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-base group-hover:text-cyan-300 transition">
                            {sec.grade} - Section {sec.section}
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                            {sec.roomNumber || 'No Room'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-1">
                          <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                          <span>
                            Class Teacher: <strong className={sec.classTeacherName ? 'text-white' : 'text-amber-400 italic'}>
                              {sec.classTeacherName || 'Not Assigned'}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className="text-base font-bold text-cyan-400">
                          {sec.studentCount || 0}
                          <span className="text-xs text-slate-500">/{sec.capacity || 40}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">Students</div>
                      </div>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-500">
                        <span>Capacity Utilization</span>
                        <span>{occupancyPct}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            occupancyPct > 90 ? 'bg-amber-500' : 'bg-cyan-500'
                          }`}
                          style={{ width: `${Math.min(100, occupancyPct)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-850 text-xs font-mono">
                      <span className="text-slate-400 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-purple-400" />
                        <span>{sec.subjectsCount ?? 0} Mapped Subjects</span>
                      </span>

                      <span className="text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5 font-bold">
                        <span>Dossier</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CLASSES & SECTIONS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'classes_sections' && (
        <div className="space-y-6">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search class, section, teacher..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedGradeFilter}
                onChange={(e) => setSelectedGradeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Grades</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.grade}>{c.grade}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sections Table */}
          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Academic Sections Directory ({filteredSections.length})
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                Primary Class Teacher and Room Allocation
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3 pl-4">Grade & Section</th>
                    <th className="p-3">Room</th>
                    <th className="p-3">Class Teacher</th>
                    <th className="p-3 text-center">Live Students</th>
                    <th className="p-3 text-center">Capacity</th>
                    <th className="p-3">Subjects</th>
                    <th className="p-3 text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSections.map((sec) => (
                    <tr key={sec.id} className="hover:bg-slate-900/40 transition">
                      <td className="p-3 pl-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <span className="text-cyan-300">{sec.grade}</span>
                          <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/20 text-[11px]">
                            Sec {sec.section}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-300">
                        {sec.roomNumber ? (
                          <span className="text-slate-300">{sec.roomNumber}</span>
                        ) : (
                          <span className="text-slate-600 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="p-3">
                        {sec.classTeacherName ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 font-medium inline-flex items-center gap-1.5">
                            <UserCheck className="w-3 h-3 text-emerald-400" />
                            {sec.classTeacherName}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-500/20 text-[10px] inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Vacant
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center font-bold text-cyan-400">
                        {sec.studentCount || 0}
                      </td>
                      <td className="p-3 text-center text-slate-400">
                        {sec.capacity || 40}
                      </td>
                      <td className="p-3 text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                          {sec.subjectsCount || 0} Subjects
                        </span>
                      </td>
                      <td className="p-3 pr-4 text-right space-x-2">
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setAssignTeacherSection(sec);
                              setSelectedTeacherId(sec.classTeacherId || '');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-850 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-[11px] transition"
                          >
                            Assign Teacher
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setDossierSection(sec);
                            setDossierTab('overview');
                          }}
                          className="px-3 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold transition inline-flex items-center gap-1"
                        >
                          <span>Dossier</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredSections.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No sections match your filter or search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SUBJECTS CATALOGUE */}
      {/* ========================================================================= */}
      {activeTab === 'subjects' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subject code or name..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Categories</option>
                <option value="core">Core Subjects</option>
                <option value="language">Languages</option>
                <option value="skill/vocational">Skill & Vocational</option>
                <option value="activity">Activity & Physical</option>
              </select>

              {isAdmin && (
                <button
                  onClick={() => setShowAddSubjectModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subject</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubjects.map((sub) => (
              <div
                key={sub.id}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                      {sub.code}
                    </span>
                    <h4 className="font-bold text-white text-base mt-1">{sub.name}</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">
                    {sub.category}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-850 font-mono text-xs">
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800/60">
                    <span className="text-[10px] text-slate-500 block">Max Marks</span>
                    <span className="font-bold text-white text-sm">{sub.maxMarks}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800/60">
                    <span className="text-[10px] text-slate-500 block">Pass Threshold</span>
                    <span className="font-bold text-emerald-400 text-sm">{sub.passMarks} ({Math.round((sub.passMarks / sub.maxMarks) * 100)}%)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SECTION-SUBJECT TEACHER ALLOCATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'allocations' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                <span>Subject Educator Allocation Matrix</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Map certified faculty from Staff & Teacher Management to subject modules across classes.
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={() => setShowMapSubjectModal(true)}
                className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Map Subject to Section</span>
              </button>
            )}
          </div>

          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3 pl-4">Grade & Section</th>
                    <th className="p-3">Subject Code</th>
                    <th className="p-3">Subject Name</th>
                    <th className="p-3">Assigned Educator</th>
                    <th className="p-3">Academic Session</th>
                    <th className="p-3 text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {mappings.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-900/40 transition">
                      <td className="p-3 pl-4 font-bold text-white">
                        {m.grade} - Section {m.section}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/20">
                          {m.subjectCode}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-slate-200">{m.subjectName}</td>
                      <td className="p-3">
                        {m.assignedTeacherName ? (
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 font-medium inline-flex items-center gap-1.5">
                            <UserCheck className="w-3 h-3 text-indigo-400" />
                            {m.assignedTeacherName}
                          </span>
                        ) : (
                          <span className="text-amber-400 italic text-[11px]">Unassigned Faculty</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-400">{m.academicSession}</td>
                      <td className="p-3 pr-4 text-right">
                        {isAdmin && (
                          <button
                            onClick={() => handleRemoveMapping(m.id, m.subjectName)}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/50 hover:text-rose-300 transition"
                            title="Remove mapping"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {mappings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No subject assignments found for session {activeSession}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: HOMEWORK HUB */}
      {/* ========================================================================= */}
      {activeTab === 'homework' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search homework..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <select
                value={selectedHomeworkStatus}
                onChange={(e) => setSelectedHomeworkStatus(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Statuses</option>
                <option value="assigned">Assigned</option>
                <option value="submitted">Submitted</option>
                <option value="evaluated">Evaluated</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <button
              onClick={() => setShowAddHomeworkModal(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-lg shadow-purple-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign Homework</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHomework.map((hw) => {
              const isOverdue = hw.status === 'assigned' && new Date(hw.dueDate) < new Date(new Date().toISOString().split('T')[0]);
              return (
                <div
                  key={hw.id}
                  className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-purple-500/40 transition space-y-3 relative group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-500/30">
                          {hw.grade} - {hw.section}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-300">{hw.subject}</span>
                      </div>
                      <h4 className="font-bold text-white text-base mt-2 line-clamp-1">{hw.title}</h4>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold border ${
                        hw.status === 'evaluated'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                          : hw.status === 'submitted'
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-500/30'
                          : isOverdue
                          ? 'bg-rose-950 text-rose-300 border-rose-500/30'
                          : 'bg-purple-950 text-purple-300 border-purple-500/30'
                      }`}
                    >
                      {isOverdue ? 'Overdue' : hw.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 font-mono line-clamp-2">{hw.description}</p>

                  <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>Due: <strong className="text-white">{hw.dueDate}</strong></span>
                    </span>
                    <span>By: <strong className="text-slate-300">{hw.teacherName}</strong></span>
                  </div>

                  {/* Status Toggle buttons */}
                  <div className="pt-1 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {hw.status === 'assigned' && (
                        <button
                          onClick={() => handleUpdateHomeworkStatus(hw.id, 'submitted')}
                          className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-mono text-cyan-300 border border-slate-800"
                        >
                          Mark Submitted
                        </button>
                      )}
                      {hw.status === 'submitted' && (
                        <button
                          onClick={() => handleUpdateHomeworkStatus(hw.id, 'evaluated')}
                          className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-mono text-emerald-300 border border-slate-800"
                        >
                          Mark Evaluated
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteHomework(hw.id, hw.title)}
                      className="text-slate-600 hover:text-rose-400 transition p-1"
                      title="Delete assignment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredHomework.length === 0 && (
              <div className="col-span-full p-12 text-center text-slate-500 font-mono">
                No homework assignments matching current filters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: ACADEMIC SESSIONS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Institutional Academic Sessions</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Configure session lifecycles, start/end date constraints, and switch active school year.
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={() => setShowAddSessionModal(true)}
                className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Session</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sessions.map((sess) => {
              const isCurrent = sess.isCurrent || sess.status === 'active';
              return (
                <div
                  key={sess.id}
                  className={`p-5 rounded-3xl border transition space-y-4 ${
                    isCurrent
                      ? 'bg-cyan-950/20 border-cyan-500/40 shadow-lg shadow-cyan-950/50'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xl font-bold font-mono text-white">
                        {sess.name || sess.sessionName}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-1">
                        {sess.startDate} to {sess.endDate}
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold border ${
                        isCurrent
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                          : sess.status === 'upcoming'
                          ? 'bg-indigo-950 text-indigo-300 border-indigo-500/30'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {isCurrent ? 'Active / Current' : sess.status}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-850 flex items-center justify-between">
                    {isCurrent ? (
                      <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Operating Session</span>
                      </span>
                    ) : (
                      isAdmin && (
                        <button
                          onClick={() => handleActivateSession(sess.id, sess.name || sess.sessionName || '')}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-cyan-300 hover:text-white transition flex items-center gap-1.5"
                        >
                          <span>Activate Session</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CLASS ACADEMIC DOSSIER */}
      {/* ========================================================================= */}
      {dossierSection && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Dossier Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white font-mono">
                      {dossierSection.grade} — Section {dossierSection.section}
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      {dossierSection.roomNumber || 'Room 301'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    Class Teacher: <strong className="text-cyan-300">{dossierSection.classTeacherName || 'Vacant'}</strong> | Strength: <strong className="text-emerald-400">{dossierStudents.length} Students</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDossierSection(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dossier Subtabs */}
            <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-800/80 overflow-x-auto bg-slate-950">
              {(['overview', 'students', 'subjects', 'homework', 'exams'] as DossierTabType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setDossierTab(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition uppercase ${
                    dossierTab === t
                      ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Dossier Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {dossierTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 font-mono text-xs">
                      <span className="text-slate-500 block text-[10px]">Total Enrolled</span>
                      <span className="text-lg font-bold text-white">{dossierStudents.length} Students</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 font-mono text-xs">
                      <span className="text-slate-500 block text-[10px]">Room Capacity</span>
                      <span className="text-lg font-bold text-slate-300">{dossierSection.capacity || 40} Seats</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 font-mono text-xs">
                      <span className="text-slate-500 block text-[10px]">Mapped Subjects</span>
                      <span className="text-lg font-bold text-purple-400">
                        {mappings.filter((m) => m.grade === dossierSection.grade && m.section === dossierSection.section).length} Units
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 font-mono text-xs">
                      <span className="text-slate-500 block text-[10px]">Class Teacher</span>
                      <span className="text-sm font-bold text-emerald-400 truncate block">
                        {dossierSection.classTeacherName || 'Vacant'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-white font-mono uppercase">Curriculum Overview</h4>
                    <p className="text-xs text-slate-400 font-mono leading-relaxed">
                      This section is following the standard CBSE secondary/senior-secondary board curriculum. Faculty allocations are actively tracked and attendance registers are tied directly to this session roster.
                    </p>
                  </div>
                </div>
              )}

              {dossierTab === 'students' && (
                <div className="space-y-4">
                  {dossierStudentsLoading ? (
                    <div className="text-center p-8 text-slate-400 font-mono">Loading student roster...</div>
                  ) : dossierStudents.length === 0 ? (
                    <div className="text-center p-8 text-slate-500 font-mono">
                      No active students currently enrolled in {dossierSection.grade} Section {dossierSection.section}.
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-800 overflow-hidden">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="p-3 pl-4">Roll No</th>
                            <th className="p-3">Admission No</th>
                            <th className="p-3">Student Name</th>
                            <th className="p-3">Gender</th>
                            <th className="p-3">Parent Phone</th>
                            <th className="p-3 text-right pr-4">Attendance %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {dossierStudents.map((std) => (
                            <tr key={std.id} className="hover:bg-slate-900/40 transition">
                              <td className="p-3 pl-4 font-bold text-cyan-300">{std.rollNo || '-'}</td>
                              <td className="p-3 text-slate-400">{std.admissionNo}</td>
                              <td className="p-3 font-bold text-white">{std.name}</td>
                              <td className="p-3 text-slate-300">{std.gender}</td>
                              <td className="p-3 text-slate-400">{std.parentPhone || std.phone}</td>
                              <td className="p-3 pr-4 text-right">
                                <span className={`font-bold ${Number(std.attendancePercent) >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                  {std.attendancePercent ?? 100}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {dossierTab === 'subjects' && (
                <div className="space-y-3">
                  {mappings
                    .filter((m) => m.grade === dossierSection.grade && m.section === dossierSection.section)
                    .map((m) => (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between font-mono text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/20 text-[10px]">
                            {m.subjectCode}
                          </span>
                          <div>
                            <span className="font-bold text-white">{m.subjectName}</span>
                            <div className="text-[10px] text-slate-400">Assigned: {m.assignedTeacherName || 'Vacant'}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {dossierTab === 'homework' && (
                <div className="space-y-3">
                  {homeworkList
                    .filter((h) => h.grade === dossierSection.grade && h.section === dossierSection.section)
                    .map((hw) => (
                      <div
                        key={hw.id}
                        className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1 font-mono text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">{hw.title}</span>
                          <span className="text-cyan-400 font-bold">Due: {hw.dueDate}</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">{hw.description}</p>
                      </div>
                    ))}
                </div>
              )}

              {dossierTab === 'exams' && (
                <div className="p-8 rounded-3xl bg-slate-900/30 border border-dashed border-slate-800 text-center space-y-3">
                  <Award className="w-8 h-8 text-cyan-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white font-mono">Examination Module Integration</h4>
                  <p className="text-xs text-slate-400 font-mono max-w-md mx-auto">
                    Term assessments, marks entry, and CBSE report cards will be managed in the upcoming Examination Module.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ASSIGN CLASS TEACHER */}
      {/* ========================================================================= */}
      {assignTeacherSection && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono">
                Assign Class Teacher — {assignTeacherSection.grade} Sec {assignTeacherSection.section}
              </h3>
              <button
                onClick={() => setAssignTeacherSection(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-mono text-slate-400 block">Select Faculty Member:</label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value="">-- No Class Teacher (Vacant) --</option>
                {staffList.map((stf) => (
                  <option key={stf.id} value={stf.id}>
                    {stf.name} ({stf.empId || stf.designation || 'Faculty'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setAssignTeacherSection(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignClassTeacher}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold"
              >
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ASSIGN HOMEWORK */}
      {/* ========================================================================= */}
      {showAddHomeworkModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Assign New Homework</span>
              </h3>
              <button onClick={() => setShowAddHomeworkModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateHomework} className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Class / Grade</label>
                  <select
                    value={homeworkForm.grade}
                    onChange={(e) => setHomeworkForm({ ...homeworkForm, grade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.grade}>{c.grade}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Section</label>
                  <select
                    value={homeworkForm.section}
                    onChange={(e) => setHomeworkForm({ ...homeworkForm, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Subject</label>
                <select
                  value={homeworkForm.subject}
                  onChange={(e) => setHomeworkForm({ ...homeworkForm, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.name}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Homework Title</label>
                <input
                  type="text"
                  required
                  value={homeworkForm.title}
                  onChange={(e) => setHomeworkForm({ ...homeworkForm, title: e.target.value })}
                  placeholder="e.g. Chapter 4 Exercise 4.2 Factorisation"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Detailed Instructions</label>
                <textarea
                  rows={3}
                  value={homeworkForm.description}
                  onChange={(e) => setHomeworkForm({ ...homeworkForm, description: e.target.value })}
                  placeholder="Specific questions, reference pages, or formatting requirements..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Assigned Date</label>
                  <input
                    type="date"
                    value={homeworkForm.assignedDate}
                    onChange={(e) => setHomeworkForm({ ...homeworkForm, assignedDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={homeworkForm.dueDate}
                    onChange={(e) => setHomeworkForm({ ...homeworkForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddHomeworkModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  Assign Homework
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CREATE SESSION */}
      {/* ========================================================================= */}
      {showAddSessionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono">Create Academic Session</h3>
              <button onClick={() => setShowAddSessionModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Session Name (e.g. 2028-29)</label>
                <input
                  type="text"
                  required
                  value={sessionForm.name}
                  onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })}
                  placeholder="2028-29"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={sessionForm.startDate}
                    onChange={(e) => setSessionForm({ ...sessionForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={sessionForm.endDate}
                    onChange={(e) => setSessionForm({ ...sessionForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isCurrentSess"
                  checked={sessionForm.isCurrent}
                  onChange={(e) => setSessionForm({ ...sessionForm, isCurrent: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700"
                />
                <label htmlFor="isCurrentSess" className="text-slate-300">Set as Current Active Session immediately</label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSessionModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  Create Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ADD CLASS */}
      {/* ========================================================================= */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono">Add Academic Class</h3>
              <button onClick={() => setShowAddClassModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Class / Grade Name</label>
                <input
                  type="text"
                  required
                  value={classForm.grade}
                  onChange={(e) => setClassForm({ ...classForm, grade: e.target.value })}
                  placeholder="e.g. Class 8"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Institutional Wing</label>
                <select
                  value={classForm.wing}
                  onChange={(e) => setClassForm({ ...classForm, wing: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                >
                  <option value="Primary Wing">Primary Wing</option>
                  <option value="Middle Wing">Middle Wing</option>
                  <option value="Secondary Wing">Secondary Wing</option>
                  <option value="Senior Secondary Wing">Senior Secondary Wing</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: ADD SECTION */}
      {/* ========================================================================= */}
      {showAddSectionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono">Add Class Section</h3>
              <button onClick={() => setShowAddSectionModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSection} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Grade</label>
                <select
                  value={sectionForm.grade}
                  onChange={(e) => setSectionForm({ ...sectionForm, grade: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.grade}>{c.grade}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Section Identifier (A, B, C...)</label>
                <input
                  type="text"
                  required
                  value={sectionForm.section}
                  onChange={(e) => setSectionForm({ ...sectionForm, section: e.target.value.toUpperCase() })}
                  placeholder="C"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Room Number</label>
                <input
                  type="text"
                  value={sectionForm.roomNumber}
                  onChange={(e) => setSectionForm({ ...sectionForm, roomNumber: e.target.value })}
                  placeholder="Room 303"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSectionModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  Create Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: ADD SUBJECT */}
      {/* ========================================================================= */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono">Add Subject to Catalogue</h3>
              <button onClick={() => setShowAddSubjectModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  placeholder="e.g. Computer Science"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">CBSE Subject Code</label>
                <input
                  type="text"
                  required
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
                  placeholder="CS-083"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Category</label>
                <select
                  value={subjectForm.category}
                  onChange={(e) => setSubjectForm({ ...subjectForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                >
                  <option value="Core">Core</option>
                  <option value="Language">Language</option>
                  <option value="Skill/Vocational">Skill/Vocational</option>
                  <option value="Activity">Activity</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Max Marks</label>
                  <input
                    type="number"
                    value={subjectForm.maxMarks}
                    onChange={(e) => setSubjectForm({ ...subjectForm, maxMarks: parseInt(e.target.value, 10) || 100 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Pass Marks</label>
                  <input
                    type="number"
                    value={subjectForm.passMarks}
                    onChange={(e) => setSubjectForm({ ...subjectForm, passMarks: parseInt(e.target.value, 10) || 33 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: MAP SUBJECT TO SECTION */}
      {/* ========================================================================= */}
      {showMapSubjectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono">Map Subject to Section</h3>
              <button onClick={() => setShowMapSubjectModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleMapSubject} className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Grade</label>
                  <select
                    value={mapSubjectForm.grade}
                    onChange={(e) => setMapSubjectForm({ ...mapSubjectForm, grade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.grade}>{c.grade}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Section</label>
                  <select
                    value={mapSubjectForm.section}
                    onChange={(e) => setMapSubjectForm({ ...mapSubjectForm, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Subject</label>
                <select
                  required
                  value={mapSubjectForm.subjectId}
                  onChange={(e) => setMapSubjectForm({ ...mapSubjectForm, subjectId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Assigned Teacher (Optional)</label>
                <select
                  value={mapSubjectForm.assignedTeacherId}
                  onChange={(e) => setMapSubjectForm({ ...mapSubjectForm, assignedTeacherId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                >
                  <option value="">-- Assign Later --</option>
                  {staffList.map((stf) => (
                    <option key={stf.id} value={stf.id}>
                      {stf.name} ({stf.department || 'Faculty'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMapSubjectModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  Save Mapping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AcademicsManagementHub;
