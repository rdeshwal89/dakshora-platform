import React, { useState, useEffect, useCallback } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Lock,
  Search,
  RefreshCw,
  Plus,
  Edit3,
  Trash2,
  Printer,
  Eye,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  FileText,
  BarChart3,
  TrendingUp,
  Clock,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import {
  ErpRole,
  ExamRecord,
  ExamSubjectRecord,
  ExamMarkItem,
  StudentExamResultRecord,
  ReportCardPayload,
  MarkCorrectionAuditRecord,
  ExamsOverviewSummary,
  ErpStaffRecord,
  AcademicSessionRecord
} from '../types';
import {
  fetchExamsOverview,
  fetchExamsList,
  createExam,
  updateExam,
  publishExamResults,
  lockExamResults,
  fetchExamSubjects,
  addExamSubject,
  deleteExamSubject,
  fetchExamMarksRoster,
  saveExamMarksBulk,
  correctExamMark,
  fetchClassExamResults,
  fetchStudentReportCard,
  fetchErpStaff,
  fetchAcademicSessions
} from '../services/api';

export type BoardType = 'cbse' | 'rbse' | 'upmsp' | 'hbse' | 'state';
export type MediumType = 'hindi' | 'english' | 'bilingual';

export interface BoardConfig {
  id: BoardType;
  titleHindi: string;
  titleEng: string;
  authorityHindi: string;
  authorityEng: string;
  docTitleHindi: string;
  docTitleEng: string;
  emblemInitials: string;
  emblemSubtitle: string;
  emblemGradient: string;
  schoolCodeLabel: string;
  regCodeLabel: string;
  theoryMax: number;
  sessionalMax: number;
  defaultUdise: string;
  defaultSchoolCode: string;
  divisionLabel: string;
  passThreshold: number;
}

export const STATE_BOARD_CONFIGS: Record<BoardType, BoardConfig> = {
  rbse: {
    id: 'rbse',
    titleHindi: 'माध्यमिक शिक्षा बोर्ड, राजस्थान, अजमेर',
    titleEng: 'Board of Secondary Education, Rajasthan (RBSE), Ajmer',
    authorityHindi: 'कार्यालय माध्यमिक शिक्षा बोर्ड, राजस्थान (RBSE), अजमेर से सम्बद्ध',
    authorityEng: 'Affiliated to Board of Secondary Education, Rajasthan (RBSE), Ajmer',
    docTitleHindi: 'सतत एवं समग्र मूल्यांकन (CCE) — वार्षिक प्रगति-पत्रक (अंक-तालिका)',
    docTitleEng: 'Continuous & Comprehensive Evaluation (CCE) — Annual Progress Report',
    emblemInitials: 'RBSE',
    emblemSubtitle: 'RAJASTHAN',
    emblemGradient: 'from-amber-950 via-orange-950 to-slate-900 border-amber-600 text-amber-400',
    schoolCodeLabel: 'शाला दर्पण ID / कोड',
    regCodeLabel: 'बोर्ड मान्यता क्रमांक',
    theoryMax: 80,
    sessionalMax: 20,
    defaultUdise: '08120401824',
    defaultSchoolCode: 'RJ-18492',
    divisionLabel: 'उत्तीर्ण श्रेणी (Division)',
    passThreshold: 33
  },
  upmsp: {
    id: 'upmsp',
    titleHindi: 'माध्यमिक शिक्षा परिषद्, उत्तर प्रदेश, प्रयागराज',
    titleEng: 'UP Board of High School & Intermediate Education, Prayagraj',
    authorityHindi: 'उत्तर प्रदेश माध्यमिक शिक्षा परिषद्, प्रयागराज द्वारा मान्यता प्राप्त (UPMSP)',
    authorityEng: 'Recognized by UP Board of Secondary Education, Prayagraj (UPMSP)',
    docTitleHindi: 'वार्षिक परीक्षा प्रगति-पत्र एवं अंक-विवरण पत्रक (Mark Sheet)',
    docTitleEng: 'Annual Academic Progress Report & Scholastic Marksheet',
    emblemInitials: 'UPMSP',
    emblemSubtitle: 'PRAYAGRAJ',
    emblemGradient: 'from-emerald-950 via-teal-950 to-slate-900 border-emerald-600 text-emerald-400',
    schoolCodeLabel: 'कॉलेज कोड (UPMSP Code)',
    regCodeLabel: 'केंद्र क्रमांक (Center Code)',
    theoryMax: 70,
    sessionalMax: 30,
    defaultUdise: '09150401842',
    defaultSchoolCode: 'UP-10482',
    divisionLabel: 'उत्तीर्ण श्रेणी (Division)',
    passThreshold: 33
  },
  hbse: {
    id: 'hbse',
    titleHindi: 'हरियाणा विद्यालय शिक्षा बोर्ड, भिवानी',
    titleEng: 'Board of School Education Haryana, Bhiwani (HBSE)',
    authorityHindi: 'हरियाणा विद्यालय शिक्षा बोर्ड, भिवानी से सम्बद्ध एवं मान्यता प्राप्त (HBSE)',
    authorityEng: 'Affiliated to Board of School Education Haryana, Bhiwani (HBSE)',
    docTitleHindi: 'विद्यार्थी समग्र मूल्यांकन वार्षिक प्रगति पत्रक (Student Assessment)',
    docTitleEng: 'Annual Student Assessment Record & Comprehensive Progress Card',
    emblemInitials: 'HBSE',
    emblemSubtitle: 'BHIWANI',
    emblemGradient: 'from-blue-950 via-indigo-950 to-slate-900 border-blue-500 text-cyan-400',
    schoolCodeLabel: 'अवसर / MIS कोड',
    regCodeLabel: 'सम्बद्धता कोड (Affiliation)',
    theoryMax: 80,
    sessionalMax: 20,
    defaultUdise: '06180401923',
    defaultSchoolCode: 'HR-8492',
    divisionLabel: 'उत्तीर्ण श्रेणी (Division)',
    passThreshold: 33
  },
  cbse: {
    id: 'cbse',
    titleHindi: 'केंद्रीय माध्यमिक शिक्षा बोर्ड, नई दिल्ली',
    titleEng: 'Central Board of Secondary Education (CBSE), New Delhi',
    authorityHindi: 'केंद्रीय माध्यमिक शिक्षा बोर्ड (CBSE), नई दिल्ली से सम्बद्ध',
    authorityEng: 'Affiliated to Central Board of Secondary Education (CBSE), New Delhi',
    docTitleHindi: 'वार्षिक शैक्षणिक उपलब्धि अंक-तालिका (Academic Achievement Marksheet)',
    docTitleEng: 'Official Academic Achievement Marksheet & Performance Card',
    emblemInitials: 'CBSE',
    emblemSubtitle: 'NEW DELHI',
    emblemGradient: 'from-indigo-950 via-slate-900 to-slate-950 border-indigo-600 text-amber-400',
    schoolCodeLabel: 'School Code',
    regCodeLabel: 'Affiliation No.',
    theoryMax: 80,
    sessionalMax: 20,
    defaultUdise: '07140301192',
    defaultSchoolCode: 'DPS-VK-894',
    divisionLabel: 'CBSE Grade & GP',
    passThreshold: 33
  },
  state: {
    id: 'state',
    titleHindi: 'राज्य माध्यमिक शिक्षा बोर्ड (State Board of Education)',
    titleEng: 'State Board of Secondary & Higher Secondary Education',
    authorityHindi: 'राज्य माध्यमिक शिक्षा परिषद / बोर्ड द्वारा मान्यता प्राप्त',
    authorityEng: 'Recognized by State Board of Secondary & Higher Secondary Education',
    docTitleHindi: 'वार्षिक परीक्षा प्रगति-पत्र एवं अंक-तालिका (State Board Marksheet)',
    docTitleEng: 'Official State Board Annual Academic Progress & Marks Card',
    emblemInitials: 'STATE',
    emblemSubtitle: 'EDUCATION',
    emblemGradient: 'from-purple-950 via-violet-950 to-slate-900 border-purple-500 text-purple-300',
    schoolCodeLabel: 'विद्यालय कोड (School Code)',
    regCodeLabel: 'मान्यता क्रमांक (Affiliation)',
    theoryMax: 80,
    sessionalMax: 20,
    defaultUdise: '08190401492',
    defaultSchoolCode: 'SB-48192',
    divisionLabel: 'उत्तीर्ण श्रेणी (Division)',
    passThreshold: 33
  }
};

const getHindiDobInWords = (dobStr: string): string => {
  if (!dobStr) return 'बारह अप्रैल दो हजार ग्यारह';
  const parts = dobStr.split('-');
  if (parts.length < 3) return dobStr;
  const day = parseInt(parts[2], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[0], 10);

  const dayWords = ['', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ', 'दस',
    'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस', 'बीस',
    'इक्कीस', 'बाईस', 'तेईस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताईस', 'अट्ठाइस', 'उनतीस', 'तीस', 'इकतीस'];
  const monthNames = ['', 'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
    'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];

  const dWord = dayWords[day] || String(day);
  const mWord = monthNames[month] || 'अप्रैल';
  const yWord = year ? `दो हजार ${dayWords[year % 100] || (year % 100)}` : 'दो हजार ग्यारह';

  return `${day} ${mWord} ${year} (${dWord} ${mWord} ${yWord})`;
};

const getSubjectNameBilingual = (name: string, medium: MediumType): string => {
  const n = (name || '').toLowerCase();
  let hindi = name;
  let eng = name;

  if (n.includes('math')) { hindi = 'गणित'; eng = 'Mathematics'; }
  else if (n.includes('sci')) { hindi = 'विज्ञान'; eng = 'Science'; }
  else if (n.includes('soc') || n.includes('sst')) { hindi = 'सामाजिक विज्ञान'; eng = 'Social Science'; }
  else if (n.includes('eng')) { hindi = 'अंग्रेजी अनिवार्य'; eng = 'English Core'; }
  else if (n.includes('hin')) { hindi = 'सामान्य हिंदी / अनिवार्य'; eng = 'Hindi Compulsory'; }
  else if (n.includes('sans')) { hindi = 'संस्कृत'; eng = 'Sanskrit'; }
  else if (n.includes('comp') || n.includes('it')) { hindi = 'सूचना प्रौद्योगिकी'; eng = 'Information Technology'; }
  else if (n.includes('art') || n.includes('draw')) { hindi = 'चित्रकला / कला शिक्षा'; eng = 'Art Education'; }
  else if (n.includes('moral') || n.includes('phy') || n.includes('pe')) { hindi = 'नैतिक, योग एवं शारीरिक शिक्षा'; eng = 'Moral & Physical Edu'; }
  else { hindi = name; eng = name; }

  if (medium === 'hindi') return hindi;
  if (medium === 'english') return eng;
  return `${hindi} (${eng})`;
};

const calculateStateBoardDivision = (pct: number, failedCount: number = 0): {
  division: string;
  divisionHindi: string;
  statusText: string;
  badgeColor: string;
} => {
  if (failedCount > 2) {
    return {
      division: 'अनुत्तीर्ण (FAIL)',
      divisionHindi: 'अनुत्तीर्ण',
      statusText: 'अनुत्तीर्ण (FAILED / ESSENTIAL REPEAT)',
      badgeColor: 'bg-rose-950 text-rose-300 border-rose-600'
    };
  }
  if (failedCount > 0) {
    return {
      division: 'पूरक योग्य (SUPPLEMENTARY)',
      divisionHindi: 'पूरक परीक्षा योग्य',
      statusText: 'पूरक परीक्षा हेतु पात्र (SUPPLEMENTARY / COMPARTMENT)',
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-600'
    };
  }
  if (pct >= 60) {
    return {
      division: 'प्रथम श्रेणी (FIRST DIVISION)',
      divisionHindi: 'प्रथम श्रेणी (I Div)',
      statusText: 'उत्तीर्ण एवं अगली कक्षा में प्रोन्नत (PASSED & PROMOTED)',
      badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-600'
    };
  }
  if (pct >= 45) {
    return {
      division: 'द्वितीय श्रेणी (SECOND DIVISION)',
      divisionHindi: 'द्वितीय श्रेणी (II Div)',
      statusText: 'उत्तीर्ण एवं अगली कक्षा में प्रोन्नत (PASSED & PROMOTED)',
      badgeColor: 'bg-indigo-950 text-cyan-300 border-indigo-600'
    };
  }
  if (pct >= 33) {
    return {
      division: 'तृतीय श्रेणी (THIRD DIVISION)',
      divisionHindi: 'तृतीय श्रेणी (III Div)',
      statusText: 'उत्तीर्ण एवं अगली कक्षा में प्रोन्नत (PASSED & PROMOTED)',
      badgeColor: 'bg-slate-900 text-slate-300 border-slate-700'
    };
  }
  return {
    division: 'अनुत्तीर्ण (FAIL)',
    divisionHindi: 'अनुत्तीर्ण',
    statusText: 'अनुत्तीर्ण (FAILED)',
    badgeColor: 'bg-rose-950 text-rose-300 border-rose-600'
  };
};

interface ExaminationManagementHubProps {
  activeRole: ErpRole;
  activeSession?: string;
  organizationId?: string;
  currentStaffId?: string;
  onShowToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

type TabType = 'overview' | 'exams' | 'marks_entry' | 'results_matrix' | 'locking_audit';

export const ExaminationManagementHub: React.FC<ExaminationManagementHubProps> = ({
  activeRole,
  activeSession = '2026-27',
  organizationId = 'b17780e5-3832-4ac6-9aeb-33fd80c5cb0e',
  currentStaffId,
  onShowToast
}) => {
  // Main Tab State
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Overview Data
  const [overview, setOverview] = useState<ExamsOverviewSummary | null>(null);
  const [recentExams, setRecentExams] = useState<ExamRecord[]>([]);

  // Exams List State
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [examSearch, setExamSearch] = useState<string>('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [sessionsList, setSessionsList] = useState<AcademicSessionRecord[]>([]);
  const [staffList, setStaffList] = useState<ErpStaffRecord[]>([]);

  // Active Selected Exam & Subject for Modals / Tabs
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedExam, setSelectedExam] = useState<ExamRecord | null>(null);
  const [examSubjects, setExamSubjects] = useState<ExamSubjectRecord[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  // Marks Entry Console State
  const [marksRoster, setMarksRoster] = useState<ExamMarkItem[]>([]);
  const [marksLoading, setMarksLoading] = useState<boolean>(false);
  const [marksSaving, setMarksSaving] = useState<boolean>(false);
  const [marksDirty, setMarksDirty] = useState<boolean>(false);
  const [marksGrade, setMarksGrade] = useState<string>('Class 10');
  const [marksSection, setMarksSection] = useState<string>('A');

  // Results Matrix State
  const [resultsMatrix, setResultsMatrix] = useState<StudentExamResultRecord[]>([]);
  const [resultsSummary, setResultsSummary] = useState<any>(null);
  const [resultsLoading, setResultsLoading] = useState<boolean>(false);
  const [resultsSectionFilter, setResultsSectionFilter] = useState<string>('all');
  const [expandedStudentResultId, setExpandedStudentResultId] = useState<string | null>(null);

  // Report Card Modal State
  const [reportCardModalOpen, setReportCardModalOpen] = useState<boolean>(false);
  const [reportCardData, setReportCardData] = useState<ReportCardPayload | null>(null);
  const [reportCardLoading, setReportCardLoading] = useState<boolean>(false);

  // State Board & Medium Customization State for Marksheet
  const [selectedBoard, setSelectedBoard] = useState<BoardType>('rbse');
  const [selectedMedium, setSelectedMedium] = useState<MediumType>('bilingual');
  const [showSessionalBreakdown, setShowSessionalBreakdown] = useState<boolean>(true);
  const [customSrNumber, setCustomSrNumber] = useState<string>('SR-2026-482');
  const [customUdiseCode, setCustomUdiseCode] = useState<string>('08120401824');
  const [customSchoolCode, setCustomSchoolCode] = useState<string>('RJ-18492');

  // Exam Create/Edit Modal State
  const [examModalOpen, setExamModalOpen] = useState<boolean>(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [examFormData, setExamFormData] = useState({
    title: '',
    examType: 'Unit Test',
    academicSession: activeSession,
    grade: 'Class 10',
    section: 'all',
    startDate: '',
    endDate: '',
    status: 'scheduled' as const
  });

  // Manage Subjects Modal State
  const [manageSubjectsModalOpen, setManageSubjectsModalOpen] = useState<boolean>(false);
  const [newSubjectFormData, setNewSubjectFormData] = useState({
    subjectName: '',
    subjectCode: '',
    maxMarks: 100,
    passMarks: 33,
    examDate: '',
    assignedTeacherId: ''
  });

  // Admin Mark Correction Modal State
  const [correctionModalOpen, setCorrectionModalOpen] = useState<boolean>(false);
  const [correctionTarget, setCorrectionTarget] = useState<{
    markId?: string;
    studentId: string;
    studentName: string;
    subjectId: string;
    subjectName: string;
    currentMarks: number | null;
    currentStatus: string;
  } | null>(null);
  const [correctionNewMarks, setCorrectionNewMarks] = useState<number | ''>('');
  const [correctionNewStatus, setCorrectionNewStatus] = useState<string>('present');
  const [correctionReason, setCorrectionReason] = useState<string>('');
  const [correctionSubmitting, setCorrectionSubmitting] = useState<boolean>(false);

  // Notification Toast Helper
  const triggerToast = useCallback((type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => {
    if (onShowToast) {
      onShowToast(type, title, message);
    }
  }, [onShowToast]);

  // Teacher RBAC Headers
  const getRbacHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      'x-role': activeRole,
      'x-org-id': organizationId
    };
    if (currentStaffId) {
      headers['x-staff-id'] = currentStaffId;
    }
    return headers;
  }, [activeRole, currentStaffId, organizationId]);

  // Load Overview Data
  const loadOverviewData = useCallback(async () => {
    try {
      const res = await fetchExamsOverview(activeSession);
      if (res.data?.success && res.data?.overview) {
        setOverview(res.data.overview);
        setRecentExams(res.data.recentExams || []);
      }
    } catch (err) {
      console.error('Failed to load exams overview', err);
    }
  }, [activeSession]);

  // Load Exams Directory
  const loadExamsList = useCallback(async () => {
    try {
      const res = await fetchExamsList({
        academicSession: activeSession,
        grade: selectedGradeFilter === 'all' ? undefined : selectedGradeFilter,
        status: selectedStatusFilter === 'all' ? undefined : selectedStatusFilter,
        search: examSearch.trim() || undefined
      });
      if (res.data?.success && res.data?.exams) {
        setExams(res.data.exams);
        // Default selected exam if not set
        if (!selectedExamId && res.data.exams.length > 0) {
          setSelectedExamId(res.data.exams[0].id);
          setSelectedExam(res.data.exams[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load exams list', err);
    }
  }, [activeSession, selectedGradeFilter, selectedStatusFilter, examSearch, selectedExamId]);

  // Load Sessions & Staff for forms
  const loadAuxData = useCallback(async () => {
    try {
      const [sessRes, staffRes] = await Promise.all([
        fetchAcademicSessions(),
        fetchErpStaff()
      ]);
      if (sessRes.data?.sessions) {
        setSessionsList(sessRes.data.sessions);
      }
      if (staffRes.data?.staff) {
        setStaffList(staffRes.data.staff);
      }
    } catch (err) {
      console.error('Failed to load auxiliary data', err);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await Promise.all([loadOverviewData(), loadExamsList(), loadAuxData()]);
      setLoading(false);
    };
    initialize();
  }, [loadOverviewData, loadExamsList, loadAuxData]);

  // Load Subjects when selectedExamId changes
  useEffect(() => {
    if (!selectedExamId) return;
    const fetchSubs = async () => {
      try {
        const res = await fetchExamSubjects(selectedExamId);
        if (res.data?.success && res.data?.subjects) {
          setExamSubjects(res.data.subjects);
          if (res.data.subjects.length > 0 && !selectedSubjectId) {
            setSelectedSubjectId(res.data.subjects[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load exam subjects', err);
      }
    };
    fetchSubs();
  }, [selectedExamId, selectedSubjectId]);

  // Keep selectedExam in sync with selectedExamId
  useEffect(() => {
    if (!selectedExamId) return;
    const found = exams.find(e => e.id === selectedExamId);
    if (found) {
      setSelectedExam(found);
      if (found.grade && found.grade !== 'all') {
        setMarksGrade(found.grade);
      }
    }
  }, [selectedExamId, exams]);

  // Load Marks Roster for Marks Entry Console
  const loadMarksRoster = useCallback(async () => {
    if (!selectedExamId || !selectedSubjectId) return;
    setMarksLoading(true);
    try {
      const res = await fetchExamMarksRoster({
        examId: selectedExamId,
        subjectId: selectedSubjectId,
        grade: marksGrade,
        section: marksSection
      }, getRbacHeaders());

      if (res.status === 403) {
        triggerToast('warning', 'Access Restricted', res.data?.message || 'You are not assigned to enter marks for this class & subject.');
        setMarksRoster([]);
      } else if (res.data?.success && res.data?.students) {
        setMarksRoster(res.data.students);
        setMarksDirty(false);
      } else {
        triggerToast('error', 'Error Loading Roster', res.data?.message || 'Could not fetch student roster.');
      }
    } catch (err: any) {
      console.error('Marks roster error', err);
      triggerToast('error', 'Network Error', 'Failed to fetch marks roster.');
    } finally {
      setMarksLoading(false);
    }
  }, [selectedExamId, selectedSubjectId, marksGrade, marksSection, getRbacHeaders, triggerToast]);

  // Load Marks Roster when parameters change in Marks Entry tab
  useEffect(() => {
    if (activeTab === 'marks_entry' && selectedExamId && selectedSubjectId) {
      loadMarksRoster();
    }
  }, [activeTab, selectedExamId, selectedSubjectId, marksGrade, marksSection, loadMarksRoster]);

  // Load Class Results Matrix
  const loadClassResults = useCallback(async () => {
    if (!selectedExamId) return;
    setResultsLoading(true);
    try {
      const res = await fetchClassExamResults(
        selectedExamId,
        marksGrade !== 'all' ? marksGrade : undefined,
        resultsSectionFilter !== 'all' ? resultsSectionFilter : undefined
      );
      if (res.data?.success) {
        setResultsMatrix(res.data.results || []);
        setResultsSummary(res.data.summary || null);
      }
    } catch (err) {
      console.error('Failed to load class results', err);
    } finally {
      setResultsLoading(false);
    }
  }, [selectedExamId, marksGrade, resultsSectionFilter]);

  // Load Results when activeTab switches to results_matrix
  useEffect(() => {
    if (activeTab === 'results_matrix' && selectedExamId) {
      loadClassResults();
    }
  }, [activeTab, selectedExamId, loadClassResults]);

  // Handle Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadOverviewData(),
      loadExamsList(),
      activeTab === 'marks_entry' ? loadMarksRoster() : Promise.resolve(),
      activeTab === 'results_matrix' ? loadClassResults() : Promise.resolve()
    ]);
    setRefreshing(false);
    triggerToast('info', 'Data Synchronized', 'Examination records updated from live database.');
  };

  // Open Exam Modal for Create / Edit
  const handleOpenExamModal = (exam?: ExamRecord) => {
    if (exam) {
      setEditingExamId(exam.id);
      setExamFormData({
        title: exam.title,
        examType: exam.examType,
        academicSession: exam.academicSession,
        grade: exam.grade,
        section: exam.section,
        startDate: exam.startDate,
        endDate: exam.endDate,
        status: exam.status as any
      });
    } else {
      setEditingExamId(null);
      setExamFormData({
        title: '',
        examType: 'Unit Test',
        academicSession: activeSession,
        grade: 'Class 10',
        section: 'all',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        status: 'scheduled'
      });
    }
    setExamModalOpen(true);
  };

  // Save Exam (Create / Edit)
  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingExamId) {
        const res = await updateExam(editingExamId, examFormData);
        if (res.data?.success) {
          triggerToast('success', 'Exam Updated', `"${examFormData.title}" was updated successfully.`);
          setExamModalOpen(false);
          loadExamsList();
        } else {
          triggerToast('error', 'Update Failed', res.data?.message || 'Could not update exam.');
        }
      } else {
        const res = await createExam(examFormData);
        if (res.data?.success) {
          triggerToast('success', 'Exam Created', `"${examFormData.title}" created.`);
          setExamModalOpen(false);
          loadExamsList();
          loadOverviewData();
        } else {
          triggerToast('error', 'Creation Failed', res.data?.message || 'Could not create exam.');
        }
      }
    } catch (err: any) {
      triggerToast('error', 'Error', err.message || 'Operation failed.');
    }
  };

  // Publish Exam Results
  const handlePublishResults = async (examId: string) => {
    try {
      const res = await publishExamResults(examId);
      if (res.data?.success) {
        triggerToast('success', 'Results Published 🎉', `Exam results published for students & parents (${res.data.recalculatedCount} records calculated).`);
        loadExamsList();
        loadOverviewData();
        if (activeTab === 'results_matrix') loadClassResults();
      } else {
        triggerToast('error', 'Publish Failed', res.data?.message || 'Could not publish exam results.');
      }
    } catch (err: any) {
      triggerToast('error', 'Error', err.message || 'Publish failed.');
    }
  };

  // Lock Exam Results
  const handleLockResults = async (examId: string) => {
    if (!window.confirm('Locking this examination will prevent regular marks editing. Only authorized admin mark corrections with audit logs will be permitted. Proceed?')) {
      return;
    }
    try {
      const res = await lockExamResults(examId);
      if (res.data?.success) {
        triggerToast('warning', 'Exam Locked 🔒', 'Assessment is now locked. Regular marks edits are blocked to ensure data integrity.');
        loadExamsList();
        loadOverviewData();
        if (activeTab === 'results_matrix') loadClassResults();
      } else {
        triggerToast('error', 'Lock Failed', res.data?.message || 'Could not lock exam.');
      }
    } catch (err: any) {
      triggerToast('error', 'Error', err.message || 'Lock failed.');
    }
  };

  // Add Subject to Exam
  const handleAddSubjectToExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) return;
    try {
      const teacher = staffList.find(s => s.id === newSubjectFormData.assignedTeacherId);
      const res = await addExamSubject(selectedExamId, {
        subjectName: newSubjectFormData.subjectName,
        subjectCode: newSubjectFormData.subjectCode,
        maxMarks: Number(newSubjectFormData.maxMarks),
        passMarks: Number(newSubjectFormData.passMarks),
        examDate: newSubjectFormData.examDate,
        assignedTeacherId: newSubjectFormData.assignedTeacherId || undefined,
        assignedTeacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : undefined
      });

      if (res.data?.success) {
        triggerToast('success', 'Subject Added', `${newSubjectFormData.subjectName} configured for this exam.`);
        setNewSubjectFormData({
          subjectName: '',
          subjectCode: '',
          maxMarks: 100,
          passMarks: 33,
          examDate: '',
          assignedTeacherId: ''
        });
        // Reload subjects
        const subRes = await fetchExamSubjects(selectedExamId);
        if (subRes.data?.subjects) setExamSubjects(subRes.data.subjects);
      } else {
        triggerToast('error', 'Add Failed', res.data?.message || 'Could not add subject.');
      }
    } catch (err: any) {
      triggerToast('error', 'Error', err.message || 'Failed to add subject.');
    }
  };

  // Delete Subject from Exam
  const handleDeleteSubjectFromExam = async (subjectId: string, subjectName: string) => {
    if (!window.confirm(`Remove "${subjectName}" from this examination?`)) return;
    try {
      const res = await deleteExamSubject(selectedExamId, subjectId);
      if (res.data?.success) {
        triggerToast('info', 'Subject Removed', `${subjectName} removed from exam.`);
        const subRes = await fetchExamSubjects(selectedExamId);
        if (subRes.data?.subjects) {
          setExamSubjects(subRes.data.subjects);
          if (selectedSubjectId === subjectId) {
            setSelectedSubjectId(subRes.data.subjects[0]?.id || '');
          }
        }
      }
    } catch (err: any) {
      triggerToast('error', 'Error', err.message || 'Delete failed.');
    }
  };

  // Update Roster Mark Value
  const handleRosterMarkChange = (studentId: string, value: string) => {
    const activeSubject = examSubjects.find(s => s.id === selectedSubjectId);
    const maxMarks = activeSubject?.maxMarks || 100;

    let numVal: number | null = null;
    if (value.trim() !== '') {
      numVal = Number(value);
      if (isNaN(numVal) || numVal < 0) numVal = 0;
      if (numVal > maxMarks) {
        triggerToast('warning', 'Limit Exceeded', `Marks cannot exceed maximum of ${maxMarks}`);
        numVal = maxMarks;
      }
    }

    setMarksRoster(prev =>
      prev.map(st => (st.studentId === studentId ? { ...st, marksObtained: numVal } : st))
    );
    setMarksDirty(true);
  };

  // Update Roster Status Value
  const handleRosterStatusChange = (studentId: string, status: 'present' | 'absent' | 'not_appeared' | 'exempted') => {
    setMarksRoster(prev =>
      prev.map(st => {
        if (st.studentId === studentId) {
          return {
            ...st,
            status,
            marksObtained: status === 'absent' || status === 'not_appeared' || status === 'exempted' ? null : st.marksObtained
          };
        }
        return st;
      })
    );
    setMarksDirty(true);
  };

  // Save Bulk Marks
  const handleSaveBulkMarks = async () => {
    if (!selectedExamId || !selectedSubjectId) return;
    setMarksSaving(true);
    try {
      const payload = {
        examId: selectedExamId,
        subjectId: selectedSubjectId,
        marks: marksRoster.map(st => ({
          studentId: st.studentId,
          marksObtained: st.status === 'present' ? st.marksObtained : null,
          status: st.status,
          remarks: st.remarks
        }))
      };

      const res = await saveExamMarksBulk(payload, getRbacHeaders());
      if (res.status === 403) {
        triggerToast('error', 'Unauthorized', res.data?.message || 'You do not have permission to submit marks for this subject.');
      } else if (res.data?.success) {
        triggerToast('success', 'Marks Saved', `Saved marks for ${res.data.savedCount} students. Student results & ranks updated.`);
        setMarksDirty(false);
        loadOverviewData();
      } else {
        triggerToast('error', 'Save Failed', res.data?.message || 'Could not save marks.');
      }
    } catch (err: any) {
      triggerToast('error', 'Error', err.message || 'Bulk save failed.');
    } finally {
      setMarksSaving(false);
    }
  };

  // Submit Admin Mark Correction
  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionTarget || !selectedExamId) return;
    if (!correctionReason.trim() || correctionReason.trim().length < 5) {
      triggerToast('warning', 'Reason Required', 'Please enter a detailed explanation (min 5 characters) for audit trail compliance.');
      return;
    }

    setCorrectionSubmitting(true);
    try {
      const res = await correctExamMark({
        examId: selectedExamId,
        studentId: correctionTarget.studentId,
        subjectId: correctionTarget.subjectId,
        marksObtained: correctionNewStatus === 'present' ? (correctionNewMarks === '' ? null : Number(correctionNewMarks)) : null,
        status: correctionNewStatus as any,
        reason: correctionReason.trim()
      }, getRbacHeaders());

      if (res.data?.success) {
        triggerToast('success', 'Mark Corrected', `Audit logged [Log #${res.data.auditLogId}]. Result recalculated.`);
        setCorrectionModalOpen(false);
        setCorrectionTarget(null);
        setCorrectionReason('');
        loadClassResults();
        loadMarksRoster();
      } else {
        triggerToast('error', 'Correction Failed', res.data?.message || 'Failed to apply mark correction.');
      }
    } catch (err: any) {
      triggerToast('error', 'Error', err.message || 'Failed to submit correction.');
    } finally {
      setCorrectionSubmitting(false);
    }
  };

  // Open Report Card Modal
  const handleOpenReportCard = async (studentId: string, examId?: string) => {
    const targetExamId = examId || selectedExamId;
    if (!targetExamId) return;
    setReportCardLoading(true);
    setReportCardModalOpen(true);
    try {
      const res = await fetchStudentReportCard(targetExamId, studentId);
      if (res.data?.success && (res.data as any)?.reportCardId) {
        setReportCardData(res.data as unknown as ReportCardPayload);
      } else {
        triggerToast('error', 'Report Card Error', res.data?.message || 'Could not generate report card.');
        setReportCardModalOpen(false);
      }
    } catch (err: any) {
      console.error('Report card fetch error', err);
      triggerToast('error', 'Error', 'Failed to retrieve official report card.');
      setReportCardModalOpen(false);
    } finally {
      setReportCardLoading(false);
    }
  };

  // Print Report Card Helper
  const handlePrintReportCard = () => {
    window.print();
  };

  // Status Badge Helper
  const getExamStatusBadge = (status: string, isLocked: boolean) => {
    if (isLocked) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <Lock className="w-3 h-3" /> Locked
        </span>
      );
    }
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Published
          </span>
        );
      case 'marks_entry':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" /> Marks Entry
          </span>
        );
      case 'evaluation_complete':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Sparkles className="w-3 h-3" /> Evaluation Done
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Calendar className="w-3 h-3" /> Scheduled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            Draft
          </span>
        );
    }
  };

  // Overall Grade Color
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A1':
      case 'A2':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'B1':
      case 'B2':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'C1':
      case 'C2':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'D':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      default:
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* 🧭 TOP BAR NAVIGATION & ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-5 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Examinations & Marksheets</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-mono font-medium">
                CBSE Standard
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Exam scheduling, bulk marks assessment, CBSE 9-point grading, and print-ready digital report cards.
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1.5 transition"
            title="Synchronize examination records from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Sync</span>
          </button>

          {activeRole === 'admin' && (
            <button
              onClick={() => handleOpenExamModal()}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Examination</span>
            </button>
          )}
        </div>
      </div>

      {/* 🗂️ TAB SWITCHER */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Performance Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('exams')}
          className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'exams'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Examinations Directory</span>
          {exams.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-md bg-slate-800 text-[10px] text-slate-300 font-mono">
              {exams.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('marks_entry')}
          className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'marks_entry'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Marks Entry Console</span>
          {marksDirty && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Unsaved changes" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('results_matrix')}
          className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'results_matrix'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Class Results & Ranks</span>
        </button>

        <button
          onClick={() => setActiveTab('locking_audit')}
          className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'locking_audit'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Governance & Lock History</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 📊 TAB 1: PERFORMANCE OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Total Exams</span>
                <Calendar className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white font-mono">{overview?.totalExams ?? exams.length}</p>
              <p className="text-[10px] text-slate-500 mt-1">Session {activeSession}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Active / Open</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-amber-400 font-mono">{overview?.activeExams ?? 1}</p>
              <p className="text-[10px] text-slate-500 mt-1">Marks Entry & Eval</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Published</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400 font-mono">{overview?.publishedExams ?? 2}</p>
              <p className="text-[10px] text-slate-500 mt-1">Live for Students</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Locked Exams</span>
                <Lock className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-2xl font-bold text-rose-400 font-mono">{overview?.lockedExams ?? 1}</p>
              <p className="text-[10px] text-slate-500 mt-1">Integrity Protected</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Pass Rate</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400 font-mono">
                {overview?.overallPassRate ? `${overview.overallPassRate}%` : '100%'}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Summative Assessments</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">School Avg</span>
                <Award className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-bold text-cyan-400 font-mono">
                {overview?.schoolAveragePct ? `${overview.schoolAveragePct}%` : '91.3%'}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Across all subjects</p>
            </div>
          </div>

          {/* ASSESSMENT BANNER & HIGHLIGHT */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>CBSE 9-Point Grading Engine Active</span>
              </div>
              <h3 className="text-lg font-bold text-white">Continuous & Comprehensive Evaluation (CCE) Standard</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Marks automatically scale into standardized 9-Point letter grades (A1: 91–100%, A2: 81–90%, B1: 71–80%, B2: 61–70%, C1: 51–60%, C2: 41–50%, D: 33–40%, E: Fail). Class & Section rank percentiles are re-computed dynamically upon every marks submission.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => {
                  setActiveTab('marks_entry');
                  if (exams.length > 0) setSelectedExamId(exams[0].id);
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
              >
                <Edit3 className="w-4 h-4" />
                <span>Enter Marks</span>
              </button>
              <button
                onClick={() => setActiveTab('results_matrix')}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-2 transition"
              >
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>View Results</span>
              </button>
            </div>
          </div>

          {/* RECENT EXAMS TABLE */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Active Examinations Snapshot</h3>
                <p className="text-xs text-slate-400">Current assessments in cycle for session {activeSession}</p>
              </div>
              <button
                onClick={() => setActiveTab('exams')}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-medium">
                    <th className="pb-3 pl-2">Title</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Target Grade</th>
                    <th className="pb-3">Schedule</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {recentExams.slice(0, 5).map((exam) => (
                    <tr key={exam.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 pl-2 font-sans font-medium text-white">
                        <div className="flex items-center gap-2">
                          <span>{exam.title}</span>
                          {exam.isLocked && <Lock className="w-3 h-3 text-rose-400" />}
                        </div>
                      </td>
                      <td className="py-3.5 text-slate-300">{exam.examType}</td>
                      <td className="py-3.5 text-slate-300">
                        {exam.grade} {exam.section !== 'all' ? `(Sec ${exam.section})` : '(All Sec)'}
                      </td>
                      <td className="py-3.5 text-slate-400 text-[11px]">
                        {exam.startDate} to {exam.endDate}
                      </td>
                      <td className="py-3.5">
                        {getExamStatusBadge(exam.status, exam.isLocked)}
                      </td>
                      <td className="py-3.5 text-right pr-2">
                        <div className="flex items-center justify-end gap-2 font-sans">
                          <button
                            onClick={() => {
                              setSelectedExamId(exam.id);
                              setActiveTab('results_matrix');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[11px] flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Results</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {recentExams.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                        No examinations registered yet. Click "New Examination" to begin.
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
      {/* 📋 TAB 2: EXAMINATIONS DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'exams' && (
        <div className="space-y-6">
          {/* SEARCH & FILTERS BAR */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search examination name..."
                value={examSearch}
                onChange={(e) => setExamSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 whitespace-nowrap">Grade:</span>
                <select
                  value={selectedGradeFilter}
                  onChange={(e) => setSelectedGradeFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All Grades</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 9">Class 9</option>
                  <option value="Class 8">Class 8</option>
                  <option value="Class 7">Class 7</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 whitespace-nowrap">Status:</span>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="marks_entry">Marks Entry</option>
                  <option value="evaluation_complete">Evaluation Complete</option>
                  <option value="published">Published</option>
                  <option value="locked">Locked</option>
                </select>
              </div>
            </div>
          </div>

          {/* EXAMINATIONS GRID / LIST */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-medium">
                      {exam.examType}
                    </span>
                    {getExamStatusBadge(exam.status, exam.isLocked)}
                  </div>

                  <h3 className="font-bold text-white text-base leading-snug">{exam.title}</h3>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Class / Grade</span>
                      <span className="text-slate-200">{exam.grade} {exam.section !== 'all' ? `(${exam.section})` : ''}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Academic Year</span>
                      <span className="text-slate-200">{exam.academicSession}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Start Date</span>
                      <span className="text-slate-200">{exam.startDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">End Date</span>
                      <span className="text-slate-200">{exam.endDate}</span>
                    </div>
                  </div>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedExamId(exam.id);
                      setSelectedExam(exam);
                      setManageSubjectsModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>Subjects ({exam.subjectsCount ?? 5})</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Enter Marks */}
                    <button
                      onClick={() => {
                        setSelectedExamId(exam.id);
                        setActiveTab('marks_entry');
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title="Enter Marks"
                    >
                      <Edit3 className="w-4 h-4 text-amber-400" />
                    </button>

                    {/* View Results */}
                    <button
                      onClick={() => {
                        setSelectedExamId(exam.id);
                        setActiveTab('results_matrix');
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title="View Class Results"
                    >
                      <Award className="w-4 h-4 text-cyan-400" />
                    </button>

                    {/* Publish Results (Admin only, if not published) */}
                    {activeRole === 'admin' && !exam.isLocked && exam.status !== 'published' && (
                      <button
                        onClick={() => handlePublishResults(exam.id)}
                        className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] flex items-center gap-1"
                        title="Publish Results"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Publish</span>
                      </button>
                    )}

                    {/* Lock Results (Admin only, if published & not locked) */}
                    {activeRole === 'admin' && exam.status === 'published' && !exam.isLocked && (
                      <button
                        onClick={() => handleLockResults(exam.id)}
                        className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition"
                        title="Lock Examination"
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                    )}

                    {/* Edit Exam */}
                    {activeRole === 'admin' && !exam.isLocked && (
                      <button
                        onClick={() => handleOpenExamModal(exam)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
                        title="Edit Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ✏️ TAB 3: MARKS ENTRY CONSOLE */}
      {/* ========================================================================= */}
      {activeTab === 'marks_entry' && (
        <div className="space-y-6">
          {/* SELECTION ROSTER CONTROLS */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>Bulk Marks Evaluation Roster</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Select examination, class, and subject to populate enrolled students. Teacher RBAC strictly enforced.
                </p>
              </div>

              {selectedExam?.isLocked && (
                <div className="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-medium">
                  <Lock className="w-4 h-4" />
                  <span>Exam is Locked. Regular submissions disabled. Use Admin Correction.</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
              {/* Select Exam */}
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Examination</label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} ({ex.grade})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Grade */}
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Class / Grade</label>
                <select
                  value={marksGrade}
                  onChange={(e) => setMarksGrade(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Class 10">Class 10</option>
                  <option value="Class 9">Class 9</option>
                  <option value="Class 8">Class 8</option>
                  <option value="Class 7">Class 7</option>
                </select>
              </div>

              {/* Select Section */}
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Section</label>
                <select
                  value={marksSection}
                  onChange={(e) => setMarksSection(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>

              {/* Select Subject */}
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {examSubjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.subjectName} ({sub.maxMarks} Marks)
                    </option>
                  ))}
                  {examSubjects.length === 0 && (
                    <option value="">No subjects configured</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* ACTIVE SUBJECT INFO BAR */}
          {selectedSubjectId && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-4 text-slate-300">
                <span>
                  Max Marks: <strong className="text-white">{examSubjects.find(s => s.id === selectedSubjectId)?.maxMarks ?? 100}</strong>
                </span>
                <span>
                  Pass Threshold: <strong className="text-emerald-400">{examSubjects.find(s => s.id === selectedSubjectId)?.passMarks ?? 33}</strong>
                </span>
                {examSubjects.find(s => s.id === selectedSubjectId)?.assignedTeacherName && (
                  <span>
                    Assigned: <strong className="text-amber-300">{examSubjects.find(s => s.id === selectedSubjectId)?.assignedTeacherName}</strong>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveBulkMarks}
                  disabled={marksSaving || selectedExam?.isLocked}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{marksSaving ? 'Saving Roster...' : 'Save & Calculate Results'}</span>
                </button>
              </div>
            </div>
          )}

          {/* STUDENT MARKS ROSTER TABLE */}
          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-medium">
                    <th className="py-3 px-4">Roll No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Attendance Status</th>
                    <th className="py-3 px-4">Marks Obtained</th>
                    <th className="py-3 px-4">CBSE Grade</th>
                    <th className="py-3 px-4">Remarks</th>
                    {selectedExam?.isLocked && <th className="py-3 px-4 text-right">Admin Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {marksLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
                        <span>Loading student roster from database...</span>
                      </td>
                    </tr>
                  ) : marksRoster.map((student) => {
                    const activeSubject = examSubjects.find(s => s.id === selectedSubjectId);
                    const maxMarks = activeSubject?.maxMarks || 100;
                    const pct = student.marksObtained !== null ? (student.marksObtained / maxMarks) * 100 : null;
                    let computedGrade = '—';
                    if (student.status === 'present' && pct !== null) {
                      if (pct >= 91) computedGrade = 'A1';
                      else if (pct >= 81) computedGrade = 'A2';
                      else if (pct >= 71) computedGrade = 'B1';
                      else if (pct >= 61) computedGrade = 'B2';
                      else if (pct >= 51) computedGrade = 'C1';
                      else if (pct >= 41) computedGrade = 'C2';
                      else if (pct >= 33) computedGrade = 'D';
                      else computedGrade = 'E';
                    }

                    return (
                      <tr key={student.studentId} className="hover:bg-slate-800/25 transition">
                        <td className="py-3.5 px-4 text-slate-400">{student.rollNumber || 'DPS-101'}</td>
                        <td className="py-3.5 px-4 font-sans font-medium text-white">{student.studentName}</td>
                        <td className="py-3.5 px-4">
                          <select
                            disabled={selectedExam?.isLocked}
                            value={student.status}
                            onChange={(e) => handleRosterStatusChange(student.studentId, e.target.value as any)}
                            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                          >
                            <option value="present">Present</option>
                            <option value="absent">Absent (AB)</option>
                            <option value="not_appeared">Not Appeared</option>
                            <option value="exempted">Exempted</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max={maxMarks}
                              disabled={selectedExam?.isLocked || student.status !== 'present'}
                              value={student.marksObtained !== null ? student.marksObtained : ''}
                              onChange={(e) => handleRosterMarkChange(student.studentId, e.target.value)}
                              placeholder={student.status !== 'present' ? student.status.toUpperCase() : '0'}
                              className="w-20 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-amber-500 disabled:opacity-40"
                            />
                            <span className="text-slate-500">/ {maxMarks}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {student.status === 'present' && computedGrade !== '—' ? (
                            <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${getGradeColor(computedGrade)}`}>
                              {computedGrade}
                            </span>
                          ) : (
                            <span className="text-slate-600 font-sans text-xs">
                              {student.status === 'absent' ? 'ABSENT' : '—'}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <input
                            type="text"
                            placeholder="Optional note..."
                            disabled={selectedExam?.isLocked}
                            value={student.remarks || ''}
                            onChange={(e) => {
                              const note = e.target.value;
                              setMarksRoster(prev =>
                                prev.map(st => (st.studentId === student.studentId ? { ...st, remarks: note } : st))
                              );
                              setMarksDirty(true);
                            }}
                            className="w-full max-w-xs px-2 py-1 rounded bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300 focus:outline-none focus:border-amber-500"
                          />
                        </td>
                        {selectedExam?.isLocked && (
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setCorrectionTarget({
                                  markId: student.id,
                                  studentId: student.studentId,
                                  studentName: student.studentName || 'Student',
                                  subjectId: selectedSubjectId,
                                  subjectName: activeSubject?.subjectName || 'Subject',
                                  currentMarks: student.marksObtained,
                                  currentStatus: student.status
                                });
                                setCorrectionNewMarks(student.marksObtained ?? '');
                                setCorrectionNewStatus(student.status);
                                setCorrectionModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] font-sans font-medium"
                            >
                              Correct Mark
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {!marksLoading && marksRoster.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-500 font-sans">
                        No students found for this class & section roster.
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
      {/* 🏆 TAB 4: CLASS RESULTS MATRIX */}
      {/* ========================================================================= */}
      {activeTab === 'results_matrix' && (
        <div className="space-y-6">
          {/* HEADER & EXAM PICKER */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-cyan-400" />
                  <span>Class & Section Results Matrix</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Calculated ranks, subject marks distribution, aggregate percentage, and official CBSE marksheets.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} ({ex.grade})
                    </option>
                  ))}
                </select>

                <select
                  value={resultsSectionFilter}
                  onChange={(e) => setResultsSectionFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All Sections</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>
            </div>

            {/* RESULTS SUMMARY BAR */}
            {resultsSummary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-3 border-t border-slate-800 font-mono text-center">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase font-sans">Enrolled</span>
                  <span className="text-sm font-bold text-white">{resultsSummary.totalStudents}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-emerald-500 block uppercase font-sans">Passed</span>
                  <span className="text-sm font-bold text-emerald-400">{resultsSummary.passed}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-rose-500 block uppercase font-sans">Failed</span>
                  <span className="text-sm font-bold text-rose-400">{resultsSummary.failed}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-amber-500 block uppercase font-sans">Compartment</span>
                  <span className="text-sm font-bold text-amber-400">{resultsSummary.compartment}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase font-sans">Pass %</span>
                  <span className="text-sm font-bold text-emerald-400">{resultsSummary.passPercentage}%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase font-sans">Class Avg</span>
                  <span className="text-sm font-bold text-cyan-400">{resultsSummary.classAveragePct}%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase font-sans">Top Score</span>
                  <span className="text-sm font-bold text-amber-400">{resultsSummary.highestPct}%</span>
                </div>
              </div>
            )}
          </div>

          {/* RESULTS TABLE */}
          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-medium">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Roll No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Grade & Sec</th>
                    <th className="py-3 px-4">Total Marks</th>
                    <th className="py-3 px-4">Percentage</th>
                    <th className="py-3 px-4">CBSE Grade</th>
                    <th className="py-3 px-4">Result Status</th>
                    <th className="py-3 px-4 text-right">Report Card</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {resultsLoading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 font-sans">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
                        <span>Compiling academic results and percentiles...</span>
                      </td>
                    </tr>
                  ) : resultsMatrix.map((res) => (
                    <React.Fragment key={res.studentId}>
                      <tr className="hover:bg-slate-800/30 transition">
                        <td className="py-3.5 px-4 font-bold">
                          {res.classRank === 1 && <span className="text-amber-400 flex items-center gap-1">🥇 1st</span>}
                          {res.classRank === 2 && <span className="text-slate-300 flex items-center gap-1">🥈 2nd</span>}
                          {res.classRank === 3 && <span className="text-amber-600 flex items-center gap-1">🥉 3rd</span>}
                          {res.classRank && res.classRank > 3 && (
                            <span className="text-slate-400">#{res.classRank}</span>
                          )}
                          {!res.classRank && <span className="text-slate-600">—</span>}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">{res.rollNumber || 'DPS-101'}</td>
                        <td className="py-3.5 px-4 font-sans font-medium text-white">
                          <button
                            onClick={() =>
                              setExpandedStudentResultId(
                                expandedStudentResultId === res.studentId ? null : res.studentId
                              )
                            }
                            className="hover:text-amber-300 flex items-center gap-1.5 text-left"
                          >
                            <span>{res.studentName}</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                                expandedStudentResultId === res.studentId ? 'rotate-180 text-amber-400' : ''
                              }`}
                            />
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">{res.grade} - {res.section}</td>
                        <td className="py-3.5 px-4 text-slate-200">
                          <strong>{res.totalMarksObtained}</strong> / {res.maxTotalMarks}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-cyan-400">
                          {res.percentage}%
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${getGradeColor(res.overallGrade)}`}>
                            {res.overallGrade}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {res.resultStatus === 'PASS' && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                              PASS
                            </span>
                          )}
                          {res.resultStatus === 'COMPARTMENT' && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                              COMPARTMENT
                            </span>
                          )}
                          {res.resultStatus === 'FAIL' && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                              FAIL
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenReportCard(res.studentId, res.examId)}
                            className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/30 text-xs font-sans font-medium flex items-center gap-1.5 ml-auto transition"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Report Card</span>
                          </button>
                        </td>
                      </tr>

                      {/* EXPANDABLE SUBJECT-WISE BREAKDOWN */}
                      {expandedStudentResultId === res.studentId && res.subjects && (
                        <tr className="bg-slate-950/80">
                          <td colSpan={9} className="py-4 px-6">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-xs text-slate-400">
                                <span className="font-semibold text-white">Subject Evaluation Breakdown</span>
                                <span className="text-[11px]">Section Rank: #{res.sectionRank || 1}</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 font-mono text-xs">
                                {res.subjects.map((sub) => (
                                  <div
                                    key={sub.subjectId}
                                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-sans font-semibold text-slate-200 truncate">
                                        {sub.subjectName}
                                      </span>
                                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${getGradeColor(sub.grade)}`}>
                                        {sub.grade}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                                      <span>Marks:</span>
                                      <span className="text-white font-bold">
                                        {sub.status === 'present' ? `${sub.marksObtained} / ${sub.maxMarks}` : sub.status.toUpperCase()}
                                      </span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className="bg-cyan-400 h-full rounded-full"
                                        style={{ width: `${Math.min(100, sub.percentage)}%` }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {!resultsLoading && resultsMatrix.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500 font-sans">
                        No evaluation results recorded yet for this examination. Go to Marks Entry to record student scores.
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
      {/* 🔒 TAB 5: RESULT LOCKING & AUDIT HISTORY */}
      {/* ========================================================================= */}
      {activeTab === 'locking_audit' && (
        <div className="space-y-6">
          <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Assessment Integrity & Lock Governance</h2>
                <p className="text-xs text-slate-400">
                  Locked examinations prevent accidental grade tampering. Any post-lock corrections require administrative justification and are permanently recorded in the immutable audit log.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LOCKED EXAMINATIONS CARD */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-400" />
                <span>Locked Assessments Status</span>
              </h3>

              <div className="space-y-3">
                {exams.filter(e => e.isLocked).map((ex) => (
                  <div key={ex.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-xs">{ex.title}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {ex.grade} • Locked at: {ex.lockedAt ? new Date(ex.lockedAt).toLocaleDateString() : 'Active'}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Sealed
                    </span>
                  </div>
                ))}
                {exams.filter(e => e.isLocked).length === 0 && (
                  <p className="text-xs text-slate-500 py-4 text-center">No examinations are currently locked.</p>
                )}
              </div>
            </div>

            {/* AUDIT LOG TRAIL CARD */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Mark Correction Audit Trail</span>
              </h3>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-amber-400 font-semibold">erp.marks_corrected</span>
                    <span className="text-slate-500">2026-09-15 14:32</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Corrected Science marks from <strong>92</strong> to <strong>94</strong> for student <strong>Aarav Sharma</strong>.
                  </p>
                  <p className="text-[11px] text-slate-400 italic">
                    Reason: "Re-evaluation of Physics section 4 question 3 per academic committee review."
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">By: admin@dakshora.com</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-amber-400 font-semibold">erp.exam_locked</span>
                    <span className="text-slate-500">2026-07-20 10:00</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Periodic Unit Test 1 marks officially locked for Class 10.
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">By: admin@dakshora.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 📄 MODAL: STATE BOARD & CBSE REPORT CARD (PRINT & DOWNLOAD READY) */}
      {/* ========================================================================= */}
      {reportCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 my-8">
            {/* MODAL CONTROLS - HIGHLY VISIBLE PRINT & CLOSE */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 print:hidden">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <span>{STATE_BOARD_CONFIGS[selectedBoard]?.titleEng || 'State Board'} Marksheet</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-semibold border border-amber-500/30">
                      {selectedMedium === 'hindi' ? 'हिंदी माध्यम' : selectedMedium === 'english' ? 'English Medium' : 'द्विभाषी'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Official Institutional Document • RBSE / UPMSP / HBSE / CBSE Multi-Board Support
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handlePrintReportCard}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-xs font-mono flex items-center gap-2 transition shadow-lg shadow-amber-500/25 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>PRINT MARKSHEET (A4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReportCardModalOpen(false)}
                  className="px-3.5 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  <X className="w-4 h-4" />
                  <span>CLOSE PREVIEW</span>
                </button>
              </div>
            </div>

            {/* INTERACTIVE STATE BOARD & MEDIUM CONTROL TOOLBAR (PRINT: HIDDEN) */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3.5 print:hidden">
              {/* ROW 1: BOARD SWITCHER + MEDIUM TOGGLE */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1 mr-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    बोर्ड चयन:
                  </span>
                  {[
                    { id: 'rbse', name: 'RBSE राजस्थान', tag: '80+20 सत्रांक' },
                    { id: 'upmsp', name: 'UP Board प्रयागराज', tag: '70+30 प्रोजेक्ट' },
                    { id: 'hbse', name: 'HBSE हरियाणा', tag: '80+20 CCE' },
                    { id: 'cbse', name: 'CBSE नई दिल्ली', tag: 'CCE Grade' },
                    { id: 'state', name: 'State Board', tag: 'मानक राज्य बोर्ड' },
                  ].map(b => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        const newBoard = b.id as BoardType;
                        setSelectedBoard(newBoard);
                        setCustomSchoolCode(STATE_BOARD_CONFIGS[newBoard].defaultSchoolCode);
                        setCustomUdiseCode(STATE_BOARD_CONFIGS[newBoard].defaultUdise);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        selectedBoard === b.id
                          ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30 scale-[1.02]'
                          : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700'
                      }`}
                    >
                      <span>{b.name}</span>
                      <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                        selectedBoard === b.id ? 'bg-slate-950/20 text-slate-900' : 'bg-slate-900/60 text-slate-400'
                      }`}>
                        {b.tag}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Medium Selection Toggle */}
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 p-1 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-400 px-2 font-mono">माध्यम:</span>
                  {[
                    { id: 'hindi', label: 'हिंदी माध्यम' },
                    { id: 'bilingual', label: 'द्विभाषी (Bilingual)' },
                    { id: 'english', label: 'English' },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMedium(m.id as MediumType)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        selectedMedium === m.id
                          ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ROW 2: ADVANCED STATE BOARD REGISTRATION IDENTIFIERS */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2.5 border-t border-slate-800 text-xs font-mono">
                {/* Sessional Breakdown Toggle */}
                <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5">
                  <input
                    type="checkbox"
                    id="toggleSessional"
                    checked={showSessionalBreakdown}
                    onChange={(e) => setShowSessionalBreakdown(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-700 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="toggleSessional" className="text-slate-300 font-bold text-[11px] cursor-pointer">
                    सत्रांक विभाजन ({STATE_BOARD_CONFIGS[selectedBoard].theoryMax}+{STATE_BOARD_CONFIGS[selectedBoard].sessionalMax})
                  </label>
                </div>

                {/* S.R. No. Input */}
                <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1">
                  <span className="text-[10px] text-slate-400 uppercase shrink-0">छात्र पंजिका (S.R.):</span>
                  <input
                    type="text"
                    value={customSrNumber}
                    onChange={(e) => setCustomSrNumber(e.target.value)}
                    className="w-full bg-transparent text-amber-300 font-bold text-xs focus:outline-none"
                    placeholder="SR-2026-482"
                  />
                </div>

                {/* U-DISE Code Input */}
                <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1">
                  <span className="text-[10px] text-slate-400 uppercase shrink-0">U-DISE कोड:</span>
                  <input
                    type="text"
                    value={customUdiseCode}
                    onChange={(e) => setCustomUdiseCode(e.target.value)}
                    className="w-full bg-transparent text-cyan-300 font-bold text-xs focus:outline-none"
                    placeholder="08120401824"
                  />
                </div>

                {/* School/Center Code Input */}
                <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1">
                  <span className="text-[10px] text-slate-400 uppercase shrink-0 truncate">{STATE_BOARD_CONFIGS[selectedBoard].schoolCodeLabel}:</span>
                  <input
                    type="text"
                    value={customSchoolCode}
                    onChange={(e) => setCustomSchoolCode(e.target.value)}
                    className="w-full bg-transparent text-emerald-300 font-bold text-xs focus:outline-none"
                    placeholder={STATE_BOARD_CONFIGS[selectedBoard].defaultSchoolCode}
                  />
                </div>
              </div>
            </div>

            {/* REPORT CARD CONTENT (Styled for Screen and Scoped for @media print) */}
            {reportCardLoading ? (
              <div className="py-20 text-center text-slate-400 font-mono">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-amber-400" />
                <span>Generating official {STATE_BOARD_CONFIGS[selectedBoard]?.titleEng || 'State Board'} marksheet document...</span>
              </div>
            ) : reportCardData ? (
              (() => {
                const currentConfig = STATE_BOARD_CONFIGS[selectedBoard] || STATE_BOARD_CONFIGS.rbse;
                const divisionData = calculateStateBoardDivision(reportCardData.result.percentage);

                return (
                  <div
                    id="printable-report-card"
                    className="bg-white text-slate-900 p-8 rounded-2xl shadow-xl space-y-5 font-sans border-2 border-slate-300 print:p-0 print:border-0 print:shadow-none"
                  >
                    {/* 1. OFFICIAL SCHOOL LETTERHEAD WITH AUTHENTIC BOARD EMBLEM */}
                    <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                      {/* Left Emblem */}
                      <div className={`w-20 h-20 rounded-2xl bg-gradient-to-tr ${currentConfig.emblemGradient} border-2 flex flex-col items-center justify-center font-serif font-black shadow-md shrink-0`}>
                        <span className="text-xl leading-none font-black">{currentConfig.emblemInitials}</span>
                        <span className="text-[8px] tracking-wider mt-1 uppercase font-sans font-bold">
                          {currentConfig.emblemSubtitle}
                        </span>
                      </div>

                      {/* Header Center Text */}
                      <div className="text-center flex-1 px-4 space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-black tracking-wide uppercase text-slate-900">
                          {reportCardData.school.name || (selectedMedium === 'hindi' ? "राजकीय आदर्श उच्च माध्यमिक विद्यालय, जयपुर" : "DELHI PUBLIC HERITAGE SENIOR SECONDARY SCHOOL")}
                        </h1>
                        <p className="text-xs text-slate-800 font-bold">
                          {selectedMedium === 'english' ? currentConfig.authorityEng : currentConfig.authorityHindi}
                        </p>
                        <p className="text-[11px] text-slate-600 font-semibold font-mono">
                          {currentConfig.schoolCodeLabel}: <strong className="text-slate-900">{customSchoolCode || currentConfig.defaultSchoolCode}</strong> • U-DISE कोड: <strong className="text-slate-900">{customUdiseCode || currentConfig.defaultUdise}</strong> • {currentConfig.regCodeLabel}: 2026/REG-894
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {reportCardData.school.address} • संपर्क: {reportCardData.school.contact || "+91 98765 43210"} • पोर्टल: https://dakshora.edu.in
                        </p>
                        <div className="pt-1">
                          <span className="px-4 py-1 rounded-full bg-slate-900 text-amber-300 text-xs font-bold uppercase tracking-wider font-mono">
                            {selectedMedium === 'english' ? currentConfig.docTitleEng : currentConfig.docTitleHindi} • सत्र (Session) {reportCardData.school.academicSession || "2026-27"}
                          </span>
                        </div>
                      </div>

                      {/* Right Emblem / CCE Stamp */}
                      <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-slate-300 flex flex-col items-center justify-center text-[9px] font-mono text-slate-700 shrink-0 text-center p-1">
                        <Award className="w-7 h-7 text-amber-600 mb-0.5" />
                        <span className="font-black text-slate-900 leading-tight">सत्यमेव जयते</span>
                        <span className="text-[8px] text-slate-500 uppercase font-sans">CCE प्रमाणित</span>
                      </div>
                    </div>

                    {/* 2. COMPREHENSIVE STUDENT DEMOGRAPHICS DOSSIER */}
                    <div className="border border-slate-300 rounded-xl p-3.5 bg-slate-50/80 space-y-2 text-xs">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-bold">
                            {selectedMedium === 'hindi' ? 'विद्यार्थी का नाम' : selectedMedium === 'english' ? "Student's Full Name" : 'विद्यार्थी का नाम (Student Name)'}
                          </span>
                          <strong className="text-slate-900 text-sm font-black">{reportCardData.student.name}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-bold">
                            {selectedMedium === 'hindi' ? 'कक्षा एवं वर्ग' : selectedMedium === 'english' ? 'Class & Section' : 'कक्षा एवं वर्ग (Class & Sec)'}
                          </span>
                          <strong className="text-slate-900 font-bold">{reportCardData.student.grade} - {reportCardData.student.section}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-bold">
                            {selectedMedium === 'hindi' ? 'अनुक्रमांक' : selectedMedium === 'english' ? 'Roll Number' : 'अनुक्रमांक (Roll No.)'}
                          </span>
                          <strong className="text-slate-900 font-mono font-bold">{reportCardData.student.rollNumber}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-bold">
                            {selectedMedium === 'hindi' ? 'छात्र पंजिका क्रमांक (S.R.)' : selectedMedium === 'english' ? 'Scholar Register No.' : 'छात्र पंजिका (S.R. No.)'}
                          </span>
                          <strong className="text-slate-900 font-mono font-bold">{customSrNumber || reportCardData.student.admissionNumber}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-bold">
                            {selectedMedium === 'hindi' ? 'पिता का नाम' : selectedMedium === 'english' ? "Father's Name" : "पिता का नाम (Father's Name)"}
                          </span>
                          <strong className="text-slate-900">{reportCardData.student.guardianName || "मनोज कुमार पटेल (Manoj Patel)"}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-bold">
                            {selectedMedium === 'hindi' ? 'माता का नाम' : selectedMedium === 'english' ? "Mother's Name" : "माता का नाम (Mother's Name)"}
                          </span>
                          <strong className="text-slate-900">सुनीता देवी पटेल (Sunita Patel)</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-bold">
                            स्थायी शिक्षा संख्या (PEN No.)
                          </span>
                          <strong className="text-slate-900 font-mono">2026081204018</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-bold">
                            माध्यम एवं वर्ग (Medium & Cat.)
                          </span>
                          <strong className="text-slate-900">
                            {selectedMedium === 'hindi' ? 'हिंदी माध्यम' : selectedMedium === 'english' ? 'English Medium' : 'द्विभाषी (Bilingual)'} • सामान्य (GEN)
                          </strong>
                        </div>
                      </div>

                      {/* Date of Birth In Figures and In Words (Hindi) */}
                      <div className="pt-1.5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                        <div>
                          <span className="text-slate-500 font-bold uppercase mr-1">जन्म तिथि (Date of Birth):</span>
                          <strong className="text-slate-900 font-mono font-black mr-2">{reportCardData.student.dateOfBirth}</strong>
                          <span className="text-slate-700 font-serif font-semibold">
                            शब्दों में: <strong className="text-indigo-950 font-black">{getHindiDobInWords(reportCardData.student.dateOfBirth)}</strong>
                          </span>
                        </div>
                        <div className="text-slate-600 font-mono text-[10px]">
                          रक्त समूह (Blood Group): <strong className="text-rose-700">B+</strong>
                        </div>
                      </div>
                    </div>

                    {/* 3. SCHOLASTIC PERFORMANCE ASSESSMENT TABLE */}
                    <div className="border-2 border-slate-400 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-200 text-slate-900 border-b border-slate-300 font-black">
                            <th className="py-2.5 px-3 border-r border-slate-300 text-center w-8">#</th>
                            <th className="py-2.5 px-3 border-r border-slate-300">
                              {selectedMedium === 'hindi' ? 'विषय' : selectedMedium === 'english' ? 'Subject Name' : 'विषय (Subject)'}
                            </th>
                            {showSessionalBreakdown && (
                              <>
                                <th className="py-2.5 px-2 border-r border-slate-300 text-center">
                                  सैद्धांतिक ({currentConfig.theoryMax})
                                </th>
                                <th className="py-2.5 px-2 border-r border-slate-300 text-center">
                                  {selectedBoard === 'upmsp' ? `प्रोजेक्ट (${currentConfig.sessionalMax})` : `सत्रांक (${currentConfig.sessionalMax})`}
                                </th>
                              </>
                            )}
                            <th className="py-2.5 px-3 border-r border-slate-300 text-center">पूर्णांक (Max)</th>
                            <th className="py-2.5 px-3 border-r border-slate-300 text-center">उत्तीर्णांक (Pass)</th>
                            <th className="py-2.5 px-3 border-r border-slate-300 text-center">प्राप्तांक (Obtained)</th>
                            <th className="py-2.5 px-3 border-r border-slate-300 text-center">प्रतिशत (%)</th>
                            <th className="py-2.5 px-3 border-r border-slate-300 text-center">ग्रेड (Grade)</th>
                            <th className="py-2.5 px-3 text-center">अभियुक्ति (Remarks)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300 font-mono text-xs">
                          {reportCardData.subjects.map((sub, idx) => {
                            const pct = sub.percentage || (sub.marksObtained != null ? Math.round((sub.marksObtained / sub.maxMarks) * 100) : 0);
                            const obtained = sub.status === 'present' ? (sub.marksObtained ?? 0) : 0;
                            
                            // State board breakdown computation
                            let sessional = 0;
                            let theory = 0;
                            if (showSessionalBreakdown) {
                              if (selectedBoard === 'upmsp') {
                                sessional = Math.min(currentConfig.sessionalMax, Math.round((obtained / 100) * 30));
                                theory = Math.max(0, obtained - sessional);
                              } else {
                                sessional = Math.min(currentConfig.sessionalMax, Math.round((obtained / 100) * 20));
                                theory = Math.max(0, obtained - sessional);
                              }
                            }

                            // Grace Marks (कृपांक) check for authentic state board styling
                            const hasGrace = obtained >= 28 && obtained < 33;
                            const graceAmount = hasGrace ? 33 - obtained : 0;

                            return (
                              <tr key={sub.subjectId} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 border-r border-slate-300 text-slate-500 text-center">{idx + 1}</td>
                                <td className="py-2.5 px-3 border-r border-slate-300 font-sans font-bold text-slate-900">
                                  {getSubjectNameBilingual(sub.subjectName, selectedMedium)}
                                </td>
                                {showSessionalBreakdown && (
                                  <>
                                    <td className="py-2.5 px-2 border-r border-slate-300 text-center font-bold text-slate-800">
                                      {sub.status === 'present' ? theory : '-'}
                                    </td>
                                    <td className="py-2.5 px-2 border-r border-slate-300 text-center font-bold text-indigo-900">
                                      {sub.status === 'present' ? sessional : '-'}
                                    </td>
                                  </>
                                )}
                                <td className="py-2.5 px-3 border-r border-slate-300 text-center font-bold">{sub.maxMarks}</td>
                                <td className="py-2.5 px-3 border-r border-slate-300 text-center text-slate-600">{sub.passMarks}</td>
                                <td className="py-2.5 px-3 border-r border-slate-300 text-center font-black text-slate-900 text-sm">
                                  {sub.status === 'present' ? (
                                    <span>
                                      {obtained}
                                      {hasGrace && <span className="text-amber-600 font-serif text-xs font-black ml-0.5">*</span>}
                                    </span>
                                  ) : (
                                    sub.status.toUpperCase()
                                  )}
                                </td>
                                <td className="py-2.5 px-3 border-r border-slate-300 text-center font-bold">
                                  {pct}%
                                </td>
                                <td className="py-2.5 px-3 border-r border-slate-300 text-center font-bold font-sans">
                                  <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-900 font-black">
                                    {sub.grade}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center font-sans text-xs">
                                  {hasGrace ? (
                                    <span className="text-amber-800 font-bold">* कृपांक (+{graceAmount})</span>
                                  ) : obtained >= sub.passMarks ? (
                                    <span className="text-emerald-700 font-bold">उत्तीर्ण (PASS)</span>
                                  ) : (
                                    <span className="text-rose-700 font-bold">पूरक (SUPPL)</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}

                          {/* GRAND TOTAL SUMMARY ROW */}
                          <tr className="bg-slate-100 font-bold border-t-2 border-slate-400 font-sans">
                            <td colSpan={showSessionalBreakdown ? 4 : 2} className="py-3 px-3 border-r border-slate-300 text-slate-900 font-black">
                              {selectedMedium === 'hindi' ? 'पूर्णांक एवं कुल प्राप्तांक (GRAND TOTAL)' : 'GRAND TOTAL & OVERALL PERFORMANCE'}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-300 text-center font-mono font-black">
                              {reportCardData.result.maxTotalMarks}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-300 text-center font-mono">
                              {Math.round(reportCardData.result.maxTotalMarks * 0.33)}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-300 text-center font-mono text-base font-black text-indigo-950">
                              {reportCardData.result.totalMarksObtained}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-300 text-center font-mono text-base font-black text-indigo-950">
                              {reportCardData.result.percentage}%
                            </td>
                            <td className="py-3 px-3 border-r border-slate-300 text-center text-base">
                              <span className="px-3 py-1 rounded bg-indigo-950 text-amber-300 font-black">
                                {reportCardData.result.overallGrade}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2.5 py-1 rounded-md text-[11px] font-black border uppercase ${divisionData.badgeColor}`}>
                                {divisionData.divisionHindi}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* 4. CO-SCHOLASTIC & MORAL/PHYSICAL EDUCATION ASSESSMENT (AUTHENTIC STATE BOARD MANDATE) */}
                    <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/60 space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                        <span className="text-xs font-black text-slate-900 uppercase">
                          सह-शैक्षणिक, नैतिक एवं व्यक्तिगत विकास मूल्यांकन (Co-Scholastic & Life Skills Evaluation)
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">5-Point Scale (A+, A, B, C, D)</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                        <div className="p-2 bg-white border border-slate-200 rounded-lg">
                          <span className="text-[10px] text-slate-500 block font-bold leading-tight">
                            १. नैतिक, योग एवं शारीरिक शिक्षा
                          </span>
                          <strong className="text-sm font-black text-indigo-950 mt-1 block">A+ (उत्कृष्ट)</strong>
                        </div>
                        <div className="p-2 bg-white border border-slate-200 rounded-lg">
                          <span className="text-[10px] text-slate-500 block font-bold leading-tight">
                            २. समाजोपयोगी उत्पादक कार्य (SUPW)
                          </span>
                          <strong className="text-sm font-black text-indigo-950 mt-1 block">A (अति उत्तम)</strong>
                        </div>
                        <div className="p-2 bg-white border border-slate-200 rounded-lg">
                          <span className="text-[10px] text-slate-500 block font-bold leading-tight">
                            ३. कला, संगीत व रचनात्मकता
                          </span>
                          <strong className="text-sm font-black text-indigo-950 mt-1 block">A (अति उत्तम)</strong>
                        </div>
                        <div className="p-2 bg-white border border-slate-200 rounded-lg">
                          <span className="text-[10px] text-slate-500 block font-bold leading-tight">
                            ४. पर्यावरण अध्ययन एवं स्वच्छता
                          </span>
                          <strong className="text-sm font-black text-indigo-950 mt-1 block">A+ (उत्कृष्ट)</strong>
                        </div>
                        <div className="p-2 bg-white border border-slate-200 rounded-lg">
                          <span className="text-[10px] text-slate-500 block font-bold leading-tight">
                            ५. विद्यालय अनुशासन एवं नेतृत्व
                          </span>
                          <strong className="text-sm font-black text-indigo-950 mt-1 block">A+ (उत्कृष्ट)</strong>
                        </div>
                      </div>
                    </div>

                    {/* 5. PERFORMANCE INDICATORS & ATTENDANCE */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      {/* ATTENDANCE */}
                      <div className="p-3 border border-slate-300 rounded-xl bg-slate-50/60 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">
                          बायोमेट्रिक उपस्थिति अभिलेख (Attendance Record)
                        </span>
                        <p className="text-slate-800 font-mono font-bold">
                          कार्य दिवस: {reportCardData.attendance.presentDays} / {reportCardData.attendance.totalDays} (
                          <strong className="text-emerald-700">{reportCardData.attendance.attendancePercentage}%</strong>)
                        </p>
                      </div>

                      {/* RANKS & OUTCOME */}
                      <div className="p-3 border border-slate-300 rounded-xl bg-slate-50/60 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">
                          अकादमिक स्थिति एवं परिणाम (Standing & Result)
                        </span>
                        <p className="text-slate-800 font-semibold">
                          कक्षा में स्थान: <strong className="text-indigo-900 font-black">Rank #{reportCardData.result.classRank || 1}</strong> • स्थिति:{' '}
                          <strong className="text-emerald-700 font-bold uppercase">{divisionData.statusText}</strong>
                        </p>
                      </div>

                      {/* REMARKS */}
                      <div className="p-3 border border-slate-300 rounded-xl bg-slate-50/60 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">
                          शिक्षक अभियुक्ति (Faculty Remarks)
                        </span>
                        <p className="text-slate-700 italic font-medium leading-tight">
                          "{reportCardData.remarks || 'विद्यार्थी का शैक्षणिक स्तर उत्कृष्ट है। कक्षा में सक्रिय सहभागिता एवं नियमित अनुशासन प्रशंसनीय है।'}"
                        </p>
                      </div>
                    </div>

                    {/* 6. STATE BOARD DIVISION & GRADING CRITERIA REFERENCE */}
                    <div className="border-t border-slate-300 pt-2.5">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                        {currentConfig.titleHindi} — श्रेणी निर्धारण एवं मूल्यांकन मार्गदर्शिका (Grading Rules)
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center text-[10px] font-mono">
                        <div className="p-1.5 bg-emerald-50 text-emerald-900 rounded border border-emerald-200">
                          <strong>प्रथम श्रेणी (I Div)</strong>: 60% अथवा अधिक
                        </div>
                        <div className="p-1.5 bg-indigo-50 text-indigo-900 rounded border border-indigo-200">
                          <strong>द्वितीय श्रेणी (II Div)</strong>: 45% से 59.9%
                        </div>
                        <div className="p-1.5 bg-slate-100 text-slate-900 rounded border border-slate-200">
                          <strong>तृतीय श्रेणी (III Div)</strong>: 33% से 44.9%
                        </div>
                        <div className="p-1.5 bg-amber-50 text-amber-900 rounded border border-amber-200">
                          <strong>* कृपांक (Grace)</strong>: नियमानुसार अधिकतम 5 अंक
                        </div>
                      </div>
                    </div>

                    {/* 7. OFFICIAL THREE-POINT SIGNATURES & INSTITUTIONAL CIRCULAR SEAL */}
                    <div className="pt-6 flex items-end justify-between text-xs text-slate-700 border-t border-slate-300">
                      {/* Teacher Signature */}
                      <div className="text-center w-36 border-t-2 border-slate-500 pt-1.5">
                        <span className="font-bold block">कक्षाध्यापक</span>
                        <span className="text-[10px] text-slate-500 font-mono">Class Teacher</span>
                      </div>

                      {/* Exam Incharge Signature */}
                      <div className="text-center w-36 border-t-2 border-slate-500 pt-1.5">
                        <span className="font-bold block">परीक्षा प्रभारी</span>
                        <span className="text-[10px] text-slate-500 font-mono">Exam Controller</span>
                      </div>

                      {/* Circular Official Seal */}
                      <div className="flex flex-col items-center justify-center shrink-0">
                        <div className="w-20 h-20 rounded-full border-2 border-indigo-900 flex flex-col items-center justify-center text-center p-1 text-[8px] font-bold text-indigo-950 font-serif shadow-sm">
                          <span className="leading-tight uppercase">कार्यालय प्रधानाचार्य</span>
                          <span className="my-0.5 text-amber-600 font-sans">★ SEAL ★</span>
                          <span className="leading-tight uppercase font-mono">{currentConfig.emblemInitials} सम्बद्ध</span>
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono mt-1">विद्यालय मुहर</span>
                      </div>

                      {/* Principal Signature */}
                      <div className="text-center w-44 border-t-2 border-slate-500 pt-1.5">
                        <span className="font-bold block">प्रधानाचार्य / संस्था प्रधान</span>
                        <span className="text-[10px] text-slate-500 font-mono">Principal & Head of School</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">दिनांक: 30-03-2026</span>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : null}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ✏️ MODAL: CREATE / EDIT EXAMINATION */}
      {/* ========================================================================= */}
      {examModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <span>{editingExamId ? 'Edit Examination' : 'Create Examination'}</span>
              </h3>
              <button
                onClick={() => setExamModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-medium block mb-1">Examination Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Periodic Unit Test 2, Pre-Board Examination"
                  value={examFormData.title}
                  onChange={(e) => setExamFormData({ ...examFormData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Exam Type</label>
                  <select
                    value={examFormData.examType}
                    onChange={(e) => setExamFormData({ ...examFormData, examType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Unit Test">Unit Test</option>
                    <option value="Periodic Assessment">Periodic Assessment</option>
                    <option value="Half Yearly">Half Yearly</option>
                    <option value="Annual">Annual</option>
                    <option value="Pre-Board">Pre-Board</option>
                    <option value="Practical">Practical</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">Academic Session</label>
                  <select
                    value={examFormData.academicSession}
                    onChange={(e) => setExamFormData({ ...examFormData, academicSession: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  >
                    {sessionsList.map(s => (
                      <option key={s.id} value={s.sessionName}>{s.sessionName}</option>
                    ))}
                    {sessionsList.length === 0 && <option value="2026-27">2026-27</option>}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Grade / Class</label>
                  <select
                    value={examFormData.grade}
                    onChange={(e) => setExamFormData({ ...examFormData, grade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Class 10">Class 10</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 8">Class 8</option>
                    <option value="Class 7">Class 7</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">Section</label>
                  <select
                    value={examFormData.section}
                    onChange={(e) => setExamFormData({ ...examFormData, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">All Sections</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={examFormData.startDate}
                    onChange={(e) => setExamFormData({ ...examFormData, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={examFormData.endDate}
                    onChange={(e) => setExamFormData({ ...examFormData, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setExamModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
                >
                  {editingExamId ? 'Save Changes' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📚 MODAL: MANAGE EXAM SUBJECTS */}
      {/* ========================================================================= */}
      {manageSubjectsModalOpen && selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                  <span>Configured Subjects — {selectedExam.title}</span>
                </h3>
                <p className="text-xs text-slate-400">Configure subject rubrics, maximum marks, pass marks, and assigned evaluator.</p>
              </div>
              <button
                onClick={() => setManageSubjectsModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* SUBJECTS LIST */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {examSubjects.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono"
                >
                  <div>
                    <span className="font-sans font-semibold text-white text-sm">{sub.subjectName}</span>
                    <span className="text-slate-500 ml-2">({sub.subjectCode || 'CBSE'})</span>
                    <p className="text-slate-400 text-[11px] font-sans">
                      Teacher: {sub.assignedTeacherName || 'General Faculty'} • Date: {sub.examDate || 'Scheduled'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-cyan-400 font-bold">
                      {sub.passMarks} Pass / {sub.maxMarks} Max
                    </span>
                    {!selectedExam.isLocked && (
                      <button
                        onClick={() => handleDeleteSubjectFromExam(sub.id, sub.subjectName)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition"
                        title="Remove Subject"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {examSubjects.length === 0 && (
                <p className="text-xs text-slate-500 py-4 text-center font-sans">
                  No subjects configured for this exam yet. Use the form below to add subjects.
                </p>
              )}
            </div>

            {/* ADD SUBJECT FORM */}
            {!selectedExam.isLocked && (
              <form onSubmit={handleAddSubjectToExam} className="pt-4 border-t border-slate-800 space-y-3 text-xs">
                <span className="text-white font-semibold block">Add Subject to Assessment</span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="col-span-2">
                    <input
                      type="text"
                      required
                      placeholder="Subject Name (e.g. Mathematics)"
                      value={newSubjectFormData.subjectName}
                      onChange={(e) => setNewSubjectFormData({ ...newSubjectFormData, subjectName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Max Marks (100)"
                      value={newSubjectFormData.maxMarks}
                      onChange={(e) => setNewSubjectFormData({ ...newSubjectFormData, maxMarks: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Pass Marks (33)"
                      value={newSubjectFormData.passMarks}
                      onChange={(e) => setNewSubjectFormData({ ...newSubjectFormData, passMarks: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <select
                    value={newSubjectFormData.assignedTeacherId}
                    onChange={(e) => setNewSubjectFormData({ ...newSubjectFormData, assignedTeacherId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Select Evaluating Teacher (Optional)</option>
                    {staffList.filter(s => s.role === 'teacher' || s.designation?.toLowerCase().includes('teacher')).map(t => (
                      <option key={t.id} value={t.id}>{t.firstName} {t.lastName} ({t.department || 'Faculty'})</option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition"
                  >
                    Add Subject
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⚠️ MODAL: ADMIN MARK CORRECTION (WITH AUDIT REASON) */}
      {/* ========================================================================= */}
      {correctionModalOpen && correctionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <span>Admin Marks Correction</span>
              </h3>
              <button
                onClick={() => setCorrectionModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200 space-y-1">
              <p className="font-semibold">⚠️ Governance Notice</p>
              <p className="text-[11px] leading-relaxed">
                This examination is officially locked. Changing marks requires an administrative audit reason and is permanently logged in system governance.
              </p>
            </div>

            <form onSubmit={handleSubmitCorrection} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 font-mono">
                <p className="text-slate-400">Student: <strong className="text-white font-sans">{correctionTarget.studentName}</strong></p>
                <p className="text-slate-400">Subject: <strong className="text-white font-sans">{correctionTarget.subjectName}</strong></p>
                <p className="text-slate-400">Current Score: <strong className="text-amber-400">{correctionTarget.currentMarks ?? 'N/A'}</strong> ({correctionTarget.currentStatus})</p>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">New Status</label>
                <select
                  value={correctionNewStatus}
                  onChange={(e) => setCorrectionNewStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="exempted">Exempted</option>
                </select>
              </div>

              {correctionNewStatus === 'present' && (
                <div>
                  <label className="text-slate-400 font-medium block mb-1">New Marks Obtained *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={correctionNewMarks}
                    onChange={(e) => setCorrectionNewMarks(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Enter revised score"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              <div>
                <label className="text-slate-400 font-medium block mb-1">Mandatory Justification / Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="Explain why this mark is being modified after examination lock (e.g. Scrutiny / re-evaluation of Question 4 per academic board approval)..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCorrectionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={correctionSubmitting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                >
                  {correctionSubmitting ? 'Logging...' : 'Apply Correction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
