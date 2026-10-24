import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  ShieldAlert,
  Download,
  Users,
  GraduationCap
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
  fetchBatchReportCards,
  fetchErpStaff,
  fetchAcademicSessions,
  fetchErpSettings
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
    titleHindi: 'माध्यमिक शिक्षा बोर्ड राजस्थान, अजमेर',
    titleEng: 'Board of Secondary Education, Rajasthan (RBSE), Ajmer',
    authorityHindi: 'माध्यमिक शिक्षा बोर्ड राजस्थान, अजमेर से संबद्ध',
    authorityEng: 'Affiliated to Board of Secondary Education, Rajasthan (RBSE), Ajmer',
    docTitleHindi: 'सतत एवं व्यापक मूल्यांकन (CCE) — वार्षिक प्रगति प्रतिवेदन (अंक-तालिका)',
    docTitleEng: 'Continuous & Comprehensive Evaluation (CCE) — Annual Progress Report',
    emblemInitials: 'RBSE',
    emblemSubtitle: 'RAJASTHAN',
    emblemGradient: 'from-amber-600 via-orange-600 to-amber-700 border-amber-500 text-white',
    schoolCodeLabel: 'शाला दर्पण ID / कोड',
    regCodeLabel: 'पंजीकरण क्रमांक',
    theoryMax: 80,
    sessionalMax: 20,
    defaultUdise: '08120401824',
    defaultSchoolCode: 'RJ-18492',
    divisionLabel: 'श्रेणी (Division)',
    passThreshold: 33
  },
  upmsp: {
    id: 'upmsp',
    titleHindi: 'माध्यमिक शिक्षा परिषद्, उत्तर प्रदेश, प्रयागराज',
    titleEng: 'UP Board of High School & Intermediate Education, Prayagraj',
    authorityHindi: 'उत्तर प्रदेश माध्यमिक शिक्षा परिषद्, प्रयागराज द्वारा मान्यता प्राप्त (UPMSP)',
    authorityEng: 'Recognized by UP Board of Secondary Education, Prayagraj (UPMSP)',
    docTitleHindi: 'वार्षिक शैक्षिक प्रगति प्रतिवेदन एवं अंक-पत्र (Mark Sheet)',
    docTitleEng: 'Annual Academic Progress Report & Scholastic Marksheet',
    emblemInitials: 'UPMSP',
    emblemSubtitle: 'PRAYAGRAJ',
    emblemGradient: 'from-emerald-600 via-teal-600 to-emerald-700 border-emerald-500 text-white',
    schoolCodeLabel: 'विद्यालय कोड (UPMSP Code)',
    regCodeLabel: 'केंद्र क्रमांक (Center Code)',
    theoryMax: 70,
    sessionalMax: 30,
    defaultUdise: '09150401842',
    defaultSchoolCode: 'UP-10482',
    divisionLabel: 'श्रेणी (Division)',
    passThreshold: 33
  },
  hbse: {
    id: 'hbse',
    titleHindi: 'हरियाणा विद्यालय शिक्षा बोर्ड, भिवानी',
    titleEng: 'Board of School Education Haryana, Bhiwani (HBSE)',
    authorityHindi: 'हरियाणा विद्यालय शिक्षा बोर्ड, भिवानी संबद्ध एवं मान्यता प्राप्त (HBSE)',
    authorityEng: 'Affiliated to Board of School Education Haryana, Bhiwani (HBSE)',
    docTitleHindi: 'विद्यार्थी सतत मूल्यांकन एवं प्रगति पत्रक (Student Assessment)',
    docTitleEng: 'Annual Student Assessment Record & Comprehensive Progress Card',
    emblemInitials: 'HBSE',
    emblemSubtitle: 'BHIWANI',
    emblemGradient: 'from-blue-600 via-indigo-600 to-blue-700 border-blue-500 text-white',
    schoolCodeLabel: 'स्कूल / MIS कोड',
    regCodeLabel: 'संबद्धता क्रमांक (Affiliation)',
    theoryMax: 80,
    sessionalMax: 20,
    defaultUdise: '06180401923',
    defaultSchoolCode: 'HR-8492',
    divisionLabel: 'श्रेणी (Division)',
    passThreshold: 33
  },
  cbse: {
    id: 'cbse',
    titleHindi: 'केंद्रीय माध्यमिक शिक्षा बोर्ड, नई दिल्ली',
    titleEng: 'Central Board of Secondary Education (CBSE), New Delhi',
    authorityHindi: 'केंद्रीय माध्यमिक शिक्षा बोर्ड (CBSE), नई दिल्ली से संबद्ध',
    authorityEng: 'Affiliated to Central Board of Secondary Education (CBSE), New Delhi',
    docTitleHindi: 'वार्षिक शैक्षिक उपलब्धि प्रमाण-पत्र (Academic Achievement Marksheet)',
    docTitleEng: 'Official Academic Achievement Marksheet & Performance Card',
    emblemInitials: 'CBSE',
    emblemSubtitle: 'NEW DELHI',
    emblemGradient: 'from-indigo-600 via-blue-700 to-indigo-800 border-indigo-500 text-white',
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
    authorityHindi: 'राज्य माध्यमिक शिक्षा परिषद / बोर्ड से मान्यता प्राप्त',
    authorityEng: 'Recognized by State Department of Secondary Education',
    docTitleHindi: 'वार्षिक परीक्षा प्रगति प्रतिवेदन एवं अंक-तालिका (Progress Report)',
    docTitleEng: 'Annual Examination Cumulative Scholastic Progress Report',
    emblemInitials: 'STATE',
    emblemSubtitle: 'BOARD',
    emblemGradient: 'from-purple-600 via-indigo-600 to-purple-700 border-purple-500 text-white',
    schoolCodeLabel: 'Govt School Code',
    regCodeLabel: 'Board Recognition No.',
    theoryMax: 80,
    sessionalMax: 20,
    defaultUdise: '08120401899',
    defaultSchoolCode: 'SB-94021',
    divisionLabel: 'श्रेणी (Division)',
    passThreshold: 33
  }
};

const getHindiDobInWords = (dob: string): string => {
  if (!dob) return 'उपलब्ध नहीं';
  const parts = dob.split('-');
  if (parts.length < 3) return dob;
  const day = parseInt(parts[2], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[0], 10);

  const dayWords: Record<number, string> = {
    1: 'एक', 2: 'दो', 3: 'तीन', 4: 'चार', 5: 'पांच', 6: 'छह', 7: 'सात', 8: 'आठ', 9: 'नौ', 10: 'दस',
    11: 'ग्यारह', 12: 'बारह', 13: 'तेरह', 14: 'चौदह', 15: 'पंद्रह', 16: 'सोलह', 17: 'सत्रह', 18: 'अठारह', 19: 'उन्नीस', 20: 'बीस',
    21: 'इक्कीस', 22: 'बाईस', 23: 'तेईस', 24: 'चौबीस', 25: 'पच्चीस', 26: 'छब्बीस', 27: 'सत्ताईस', 28: 'अट्ठाईस', 29: 'उनतीस', 30: 'तीस', 31: 'इकतीस'
  };

  const monthNames: Record<number, string> = {
    1: 'जनवरी', 2: 'फ़रवरी', 3: 'मार्च', 4: 'अप्रैल', 5: 'मई', 6: 'जून',
    7: 'जुलाई', 8: 'अगस्त', 9: 'सितंबर', 10: 'अक्टूबर', 11: 'नवंबर', 12: 'दिसंबर'
  };

  const dWord = dayWords[day] || String(day);
  const mWord = monthNames[month] || 'माह';
  const yWord = year ? `वर्ष दो हज़ार ${dayWords[year % 100] || (year % 100)}` : 'वर्ष दो हज़ार ग्यारह';

  return `${day} ${mWord} ${year} (${dWord} ${mWord} ${yWord})`;
};

const getSubjectNameBilingual = (name: string, medium: MediumType): string => {
  const n = (name || '').toLowerCase();
  let hindi = name;
  let eng = name;

  if (n.includes('math')) { hindi = 'गणित'; eng = 'Mathematics'; }
  else if (n.includes('sci')) { hindi = 'विज्ञान'; eng = 'Science'; }
  else if (n.includes('soc') || n.includes('sst')) { hindi = 'सामाजिक विज्ञान'; eng = 'Social Science'; }
  else if (n.includes('eng')) { hindi = 'अंग्रेजी (English Core)'; eng = 'English Core'; }
  else if (n.includes('hin')) { hindi = 'हिन्दी अनिवार्य'; eng = 'Hindi Compulsory'; }
  else if (n.includes('sans')) { hindi = 'संस्कृत'; eng = 'Sanskrit'; }
  else if (n.includes('comp') || n.includes('it') || n.includes('ai')) { hindi = 'सूचना प्रौद्योगिकी व कम्प्यूटर'; eng = 'Information Technology & AI'; }
  else if (n.includes('art') || n.includes('draw')) { hindi = 'कला शिक्षा'; eng = 'Art Education'; }
  else if (n.includes('moral') || n.includes('phy') || n.includes('pe')) { hindi = 'शारीरिक एवं स्वास्थ्य शिक्षा'; eng = 'Physical & Health Education'; }
  else { hindi = name; eng = name; }

  if (medium === 'hindi') return hindi;
  if (medium === 'english') return eng;
  return `${hindi} / ${eng}`;
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
      badgeColor: 'bg-rose-50 text-rose-800 border-rose-300'
    };
  }
  if (failedCount > 0) {
    return {
      division: 'पूरक परीक्षा (SUPPLEMENTARY)',
      divisionHindi: 'पूरक परीक्षा योग्य',
      statusText: 'पूरक परीक्षा हेतु पात्र (SUPPLEMENTARY / COMPARTMENT)',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-300'
    };
  }
  if (pct >= 60) {
    return {
      division: 'प्रथम श्रेणी (FIRST DIVISION)',
      divisionHindi: 'प्रथम श्रेणी (I Div)',
      statusText: 'उत्तीर्ण एवं अगली कक्षा में प्रोन्नत (PASSED & PROMOTED)',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300'
    };
  }
  if (pct >= 45) {
    return {
      division: 'द्वितीय श्रेणी (SECOND DIVISION)',
      divisionHindi: 'द्वितीय श्रेणी (II Div)',
      statusText: 'उत्तीर्ण एवं अगली कक्षा में प्रोन्नत (PASSED & PROMOTED)',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-300'
    };
  }
  if (pct >= 33) {
    return {
      division: 'तृतीय श्रेणी (THIRD DIVISION)',
      divisionHindi: 'तृतीय श्रेणी (III Div)',
      statusText: 'उत्तीर्ण एवं अगली कक्षा में प्रोन्नत (PASSED & PROMOTED)',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300'
    };
  }
  return {
    division: 'अनुत्तीर्ण (FAIL)',
    divisionHindi: 'अनुत्तीर्ण',
    statusText: 'अनुत्तीर्ण (FAILED)',
    badgeColor: 'bg-rose-50 text-rose-800 border-rose-300'
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
  const [, setRecentExams] = useState<ExamRecord[]>([]);

  // Exams List State
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [examSearch, setExamSearch] = useState<string>('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [, setSessionsList] = useState<AcademicSessionRecord[]>([]);
  const [staffList, setStaffList] = useState<ErpStaffRecord[]>([]);

  // Active Selected Exam & Subject
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
  const [resultsSearchQuery, setResultsSearchQuery] = useState<string>('');
  const [expandedStudentResultId, setExpandedStudentResultId] = useState<string | null>(null);

  // Single Report Card Modal State
  const [reportCardModalOpen, setReportCardModalOpen] = useState<boolean>(false);
  const [reportCardData, setReportCardData] = useState<ReportCardPayload | null>(null);
  const [reportCardLoading, setReportCardLoading] = useState<boolean>(false);

  // Batch Report Cards Modal State
  const [batchModalOpen, setBatchModalOpen] = useState<boolean>(false);
  const [batchReportCards, setBatchReportCards] = useState<ReportCardPayload[]>([]);
  const [batchLoading, setBatchLoading] = useState<boolean>(false);

  // State Board & Medium Customization State for Marksheet
  const [selectedBoard, setSelectedBoard] = useState<BoardType>('cbse');
  const [selectedMedium, setSelectedMedium] = useState<MediumType>('bilingual');
  const [showSessionalBreakdown, setShowSessionalBreakdown] = useState<boolean>(true);
  const [customSrNumber, setCustomSrNumber] = useState<string>('SR-2026-482');
  const [customUdiseCode, setCustomUdiseCode] = useState<string>('08120401824');
  const [customSchoolCode, setCustomSchoolCode] = useState<string>('RJ-18492');
  const [schoolSettings, setSchoolSettings] = useState<any>(null);

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
    status: 'scheduled' as ExamRecord['status']
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

  // Dynamic School Settings & Default Board Resolution
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetchErpSettings(organizationId);
        if (res.data?.settings) {
          const s = res.data.settings;
          setSchoolSettings(s);
          const boardStr = (s.board || '').toLowerCase();
          if (boardStr.includes('rbse')) setSelectedBoard('rbse');
          else if (boardStr.includes('up')) setSelectedBoard('upmsp');
          else if (boardStr.includes('hbse') || boardStr.includes('haryana')) setSelectedBoard('hbse');
          else if (boardStr.includes('cbse')) setSelectedBoard('cbse');
          else setSelectedBoard('cbse');

          if (s.schoolCode) setCustomSchoolCode(s.schoolCode);
          if (s.udiseCode) setCustomUdiseCode(s.udiseCode);
        }
      } catch (err) {
        console.warn('Could not load school settings for exam hub', err);
      }
    };
    loadSettings();
  }, [organizationId]);

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

  // Load Marks Entry Roster when exam, subject, grade, or section changes
  const loadMarksRoster = useCallback(async () => {
    if (!selectedExamId) return;
    setMarksLoading(true);
    try {
      const res = await fetchExamMarksRoster(
        {
          examId: selectedExamId,
          subjectId: selectedSubjectId || '',
          grade: marksGrade,
          section: marksSection
        },
        getRbacHeaders()
      );
      if (res.data?.success && res.data?.students) {
        const mapped = res.data.students.map((st: any) => ({
          studentId: st.studentId,
          studentId8Digit: st.studentId8Digit || (st.admissionNo && st.admissionNo.startsWith('2026') ? st.admissionNo : `2026${(st.admissionNo || st.rollNo || st.studentId || '0001').replace(/\D/g, '').slice(-4).padStart(4, '0')}`),
          penNo: st.penNo || `20260${(st.admissionNo || '101').replace(/\D/g, '').padStart(6, '0')}`,
          studentName: st.studentName,
          rollNumber: st.rollNo || 'ROLL',
          rollNo: st.rollNo || 'ROLL',
          admissionNo: st.admissionNo || 'ADM',
          grade: st.grade,
          section: st.section,
          markId: st.markId,
          marksObtained: st.marksObtained,
          maxMarks: res.data?.examSubject?.maxMarks || 100,
          passMarks: res.data?.examSubject?.passMarks || 33,
          status: st.status || 'present',
          remarks: st.remarks || '',
          isLocked: st.isLocked || res.data?.isExamLocked || false
        }));
        setMarksRoster(mapped);
        setMarksDirty(false);
      }
    } catch (err: any) {
      console.error('Failed to load marks roster', err);
      triggerToast('error', 'Marks Roster Failed', err.response?.data?.message || 'Unauthorized or unable to load marks roster.');
    } finally {
      setMarksLoading(false);
    }
  }, [selectedExamId, selectedSubjectId, marksGrade, marksSection, getRbacHeaders, triggerToast]);

  useEffect(() => {
    if (activeTab === 'marks_entry' && selectedExamId) {
      loadMarksRoster();
    }
  }, [activeTab, selectedExamId, selectedSubjectId, marksGrade, marksSection, loadMarksRoster]);

  // Load Results Matrix
  const loadResultsMatrix = useCallback(async () => {
    if (!selectedExamId) return;
    setResultsLoading(true);
    try {
      const res = await fetchClassExamResults(
        selectedExamId,
        selectedExam?.grade || undefined,
        resultsSectionFilter === 'all' ? undefined : resultsSectionFilter
      );
      if (res.data?.success && res.data?.results) {
        setResultsMatrix(res.data.results);
        setResultsSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Failed to load results matrix', err);
    } finally {
      setResultsLoading(false);
    }
  }, [selectedExamId, selectedExam, resultsSectionFilter]);

  useEffect(() => {
    if (activeTab === 'results_matrix' && selectedExamId) {
      loadResultsMatrix();
    }
  }, [activeTab, selectedExamId, resultsSectionFilter, loadResultsMatrix]);

  // Filtered Results for Search
  const filteredResultsMatrix = useMemo(() => {
    if (!resultsSearchQuery.trim()) return resultsMatrix;
    const q = resultsSearchQuery.toLowerCase();
    return resultsMatrix.filter(r =>
      r.studentName.toLowerCase().includes(q) ||
      (r.rollNumber || r.rollNo || '').toLowerCase().includes(q) ||
      (r.studentId8Digit || '').toLowerCase().includes(q) ||
      (r.admissionNo || '').toLowerCase().includes(q)
    );
  }, [resultsMatrix, resultsSearchQuery]);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadOverviewData(), loadExamsList()]);
    if (activeTab === 'marks_entry') await loadMarksRoster();
    if (activeTab === 'results_matrix') await loadResultsMatrix();
    setRefreshing(false);
    triggerToast('success', 'Synchronized', 'Examination & Marksheet database refreshed.');
  };

  // Open Single Report Card
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
        triggerToast('error', 'Report Card Error', (res.data as any)?.message || 'Could not generate report card.');
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

  // Open Batch Report Cards (Multi-student A4 Print View)
  const handleOpenBatchPrint = async () => {
    if (!selectedExamId) return;
    setBatchLoading(true);
    setBatchModalOpen(true);
    try {
      const res = await fetchBatchReportCards(
        selectedExamId,
        selectedExam?.grade || undefined,
        resultsSectionFilter === 'all' ? undefined : resultsSectionFilter
      );
      if (res.data?.success && res.data?.reportCards) {
        setBatchReportCards(res.data.reportCards);
        triggerToast('info', 'Batch Marksheets Ready', `Loaded ${res.data.count} official marksheets for printing.`);
      } else {
        triggerToast('error', 'Batch Error', 'Failed to load batch report cards.');
        setBatchModalOpen(false);
      }
    } catch (err: any) {
      console.error('Batch report card error', err);
      triggerToast('error', 'Error', 'Could not load batch report cards.');
      setBatchModalOpen(false);
    } finally {
      setBatchLoading(false);
    }
  };

  // Export Tabulation Sheet as CSV
  const handleExportTabulationCSV = () => {
    if (resultsMatrix.length === 0) {
      triggerToast('warning', 'No Results', 'No results available to export.');
      return;
    }
    const headers = ['Rank', 'Student_ID', 'Admission_No', 'Roll_No', 'Student_Name', 'Grade', 'Section', 'Total_Obtained', 'Max_Marks', 'Percentage', 'CBSE_Grade', 'Result_Status'];
    const rows = resultsMatrix.map(r => [
      r.classRank || r.sectionRank || 1,
      r.studentId8Digit || `2026${(r.admissionNo || r.rollNo || r.studentId || '0001').replace(/\D/g, '').slice(-4).padStart(4, '0')}`,
      r.admissionNo || 'ADM',
      r.rollNumber || r.rollNo || 'ROLL',
      `"${r.studentName}"`,
      r.grade,
      r.section,
      r.totalMarksObtained,
      r.maxTotalMarks,
      `${r.percentage}%`,
      r.overallGrade,
      r.resultStatus
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Tabulation_Register_${selectedExam?.title || 'Exam'}_${marksGrade}_Sec_${resultsSectionFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('success', 'Export Complete', 'Class tabulation register downloaded as CSV.');
  };

  // Bulk Save Marks
  const handleSaveBulkMarks = async () => {
    if (!selectedExamId || !selectedSubjectId) return;
    setMarksSaving(true);
    try {
      const payload = {
        examId: selectedExamId,
        subjectId: selectedSubjectId,
        examSubjectId: selectedSubjectId,
        grade: marksGrade,
        section: marksSection,
        marks: marksRoster.map(m => ({
          studentId: m.studentId,
          studentName: m.studentName,
          rollNo: m.rollNo || m.rollNumber,
          admissionNo: m.admissionNo,
          marksObtained: m.marksObtained,
          status: m.status,
          remarks: m.remarks
        }))
      };

      const res = await saveExamMarksBulk(payload, getRbacHeaders());
      if (res.data?.success) {
        triggerToast('success', 'Marks Saved', `Evaluated & calculated results for ${marksRoster.length} students.`);
        setMarksDirty(false);
        loadMarksRoster();
        loadOverviewData();
      } else {
        triggerToast('error', 'Save Failed', res.data?.message || 'Could not save marks roster.');
      }
    } catch (err: any) {
      console.error('Failed to save bulk marks', err);
      triggerToast('error', 'Error', err.response?.data?.message || 'Failed to save marks.');
    } finally {
      setMarksSaving(false);
    }
  };

  // Open Exam Modal
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
        status: exam.status
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
          triggerToast('success', 'Exam Updated', 'Examination schedule has been modified.');
          setExamModalOpen(false);
          loadExamsList();
        }
      } else {
        const res = await createExam(examFormData);
        if (res.data?.success) {
          triggerToast('success', 'Exam Created', 'New examination configured successfully.');
          setExamModalOpen(false);
          loadExamsList();
          loadOverviewData();
        }
      }
    } catch (err: any) {
      triggerToast('error', 'Save Failed', err.message || 'Could not save exam record.');
    }
  };

  // Publish Results
  const handlePublishResults = async (examId: string) => {
    if (!window.confirm('Are you sure you want to officially publish results for this examination? Students and parents will be able to view their marks.')) return;
    try {
      const res = await publishExamResults(examId);
      if (res.data?.success) {
        triggerToast('success', 'Results Published', 'Scores are now visible to students and guardians.');
        loadExamsList();
        loadOverviewData();
      }
    } catch (err: any) {
      triggerToast('error', 'Publish Failed', err.message || 'Could not publish exam results.');
    }
  };

  // Lock Exam
  const handleLockExam = async (examId: string) => {
    if (!window.confirm('Locking this examination seals marks entry and enforces CBSE compliance audit logs for any subsequent modifications. Continue?')) return;
    try {
      const res = await lockExamResults(examId);
      if (res.data?.success) {
        triggerToast('warning', 'Exam Locked', 'Marks roster is permanently sealed. Modifications require admin audit justification.');
        loadExamsList();
        loadOverviewData();
      }
    } catch (err: any) {
      triggerToast('error', 'Lock Failed', err.message || 'Could not lock exam record.');
    }
  };

  // Add Subject to Exam
  const handleAddSubjectToExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) return;
    try {
      const res = await addExamSubject(selectedExamId, newSubjectFormData);
      if (res.data?.success && res.data?.subject) {
        setExamSubjects([...examSubjects, res.data.subject]);
        setNewSubjectFormData({
          subjectName: '',
          subjectCode: '',
          maxMarks: 100,
          passMarks: 33,
          examDate: '',
          assignedTeacherId: ''
        });
        triggerToast('success', 'Subject Added', `${res.data.subject.subjectName} added to examination curriculum.`);
      }
    } catch (err: any) {
      triggerToast('error', 'Add Failed', err.message || 'Failed to add subject.');
    }
  };

  // Delete Subject from Exam
  const handleDeleteSubjectFromExam = async (subjectId: string, subjectName: string) => {
    if (!selectedExamId) return;
    if (!window.confirm(`Are you sure you want to remove ${subjectName} from this assessment? Associated marks will be detached.`)) return;
    try {
      const res = await deleteExamSubject(selectedExamId, subjectId);
      if (res.data?.success) {
        setExamSubjects(examSubjects.filter(s => s.id !== subjectId));
        triggerToast('info', 'Subject Removed', `${subjectName} removed from exam.`);
      }
    } catch (err: any) {
      triggerToast('error', 'Delete Failed', err.message || 'Failed to remove subject.');
    }
  };

  // Open Mark Correction Modal
  const handleOpenCorrectionModal = (item: ExamMarkItem, subject: ExamSubjectRecord) => {
    setCorrectionTarget({
      markId: item.id,
      studentId: item.studentId,
      studentName: item.studentName || 'Student',
      subjectId: subject.id,
      subjectName: subject.subjectName,
      currentMarks: item.marksObtained,
      currentStatus: item.status
    });
    setCorrectionNewMarks(item.marksObtained ?? '');
    setCorrectionNewStatus(item.status);
    setCorrectionReason('');
    setCorrectionModalOpen(true);
  };

  // Submit Administrative Mark Correction
  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionTarget || !selectedExamId) return;
    setCorrectionSubmitting(true);
    try {
      const res = await correctExamMark({
        examId: selectedExamId,
        studentId: correctionTarget.studentId,
        subjectId: correctionTarget.subjectId,
        marksObtained: correctionNewStatus === 'present' ? Number(correctionNewMarks) : null,
        status: correctionNewStatus as any,
        reason: correctionReason
      }, getRbacHeaders());

      if (res.data?.success) {
        triggerToast('success', 'Mark Corrected & Logged', 'Administrative modification recorded in audit trail.');
        setCorrectionModalOpen(false);
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

  // Status Badge Helper
  const getExamStatusBadge = (status: string, isLocked: boolean) => {
    if (isLocked) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300">
          <Lock className="w-3 h-3" /> Sealed / Locked
        </span>
      );
    }
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3" /> Published
          </span>
        );
      case 'evaluation_complete':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-300">
            <Award className="w-3 h-3" /> Eval Complete
          </span>
        );
      case 'marks_entry':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
            <Edit3 className="w-3 h-3" /> Marks Entry Open
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <Calendar className="w-3 h-3" /> Scheduled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER - HIGH CONTRAST CLEAN WHITE WITH DARK ACCENTS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-700 shadow-sm">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-950 tracking-tight">Examinations & Marksheet Engine</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold uppercase tracking-wider">
                {STATE_BOARD_CONFIGS[selectedBoard]?.emblemInitials || 'CBSE'} CCE Compliant
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-1">
              Multi-Board Academic Assessment, Sessional & Theory Split, 8-Digit Student ID Integration, and A4 Print Marksheets.
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-300 text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
            title="Synchronize records with live tenant database"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-600' : 'text-slate-700'}`} />
            <span>Sync Live DB</span>
          </button>

          {activeRole === 'admin' && (
            <button
              onClick={() => handleOpenExamModal()}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create Examination</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. HIGH-CONTRAST TAB NAVIGATION */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-amber-500 text-slate-950 border border-amber-600 shadow-sm'
              : 'bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Performance Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('exams')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'exams'
              ? 'bg-amber-500 text-slate-950 border border-amber-600 shadow-sm'
              : 'bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Examinations Directory</span>
          {exams.length > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] text-slate-900 font-mono font-bold">
              {exams.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('marks_entry')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'marks_entry'
              ? 'bg-amber-500 text-slate-950 border border-amber-600 shadow-sm'
              : 'bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Marks Entry Console</span>
          {marksDirty && (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" title="Unsaved changes pending" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('results_matrix')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'results_matrix'
              ? 'bg-amber-500 text-slate-950 border border-amber-600 shadow-sm'
              : 'bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Class Results & Tabulation</span>
        </button>

        <button
          onClick={() => setActiveTab('locking_audit')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'locking_audit'
              ? 'bg-amber-500 text-slate-950 border border-amber-600 shadow-sm'
              : 'bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Locking & Audit Trail</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PERFORMANCE OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI METRICS (WHITE CARDS, HIGH-CONTRAST DARK TEXT) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-600 mb-2 font-bold text-xs">
                <span>Total Exams</span>
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-950 font-mono">{overview?.totalExams ?? exams.length}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Session {activeSession}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-600 mb-2 font-bold text-xs">
                <span>Active / Open</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-amber-700 font-mono">{overview?.activeExams ?? 1}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Marks Entry & Eval</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-600 mb-2 font-bold text-xs">
                <span>Published</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-700 font-mono">{overview?.publishedExams ?? 2}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Live for Students</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-600 mb-2 font-bold text-xs">
                <span>Locked Exams</span>
                <Lock className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-2xl font-black text-rose-700 font-mono">{overview?.lockedExams ?? 1}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Integrity Protected</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-600 mb-2 font-bold text-xs">
                <span>Pass Rate</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-700 font-mono">
                {overview?.overallPassRate ? `${overview.overallPassRate}%` : '100%'}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Evaluated Cohorts</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-600 mb-2 font-bold text-xs">
                <span>School Average</span>
                <Award className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-2xl font-black text-indigo-900 font-mono">
                {overview?.schoolAveragePct ? `${overview.schoolAveragePct}%` : '89.4%'}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Across all subjects</p>
            </div>
          </div>

          {/* ASSESSMENT BANNER */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50/30 border border-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-amber-800 text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Multi-Board & CCE Grading Standard Active</span>
              </div>
              <h3 className="text-lg font-black text-slate-950">
                Continuous & Comprehensive Evaluation (CCE) & Sessional Split
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                Theory (80/70) and Sessional/Practical (20/30) scores are automatically combined with CBSE 9-point scale (A1, A2, B1, B2, C1, C2, D, E) or State Board Divisions (प्रथम, द्वितीय, तृतीय श्रेणी). Student 8-digit IDs are permanently linked to examination records and printed marksheets.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => {
                  setActiveTab('marks_entry');
                  if (exams.length > 0) setSelectedExamId(exams[0].id);
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Enter Marks Roster</span>
              </button>
              <button
                onClick={() => setActiveTab('results_matrix')}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
              >
                <Eye className="w-4 h-4 text-indigo-600" />
                <span>View Results & Ranks</span>
              </button>
            </div>
          </div>

          {/* ACTIVE EXAMS SNAPSHOT */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-950">Active Examinations Snapshot</h3>
                <p className="text-xs text-slate-500 font-medium">Assessments currently underway for Academic Session {activeSession}</p>
              </div>
              <button
                onClick={() => setActiveTab('exams')}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({exams.length})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Exam Title</th>
                    <th className="py-3 px-4">Class / Grade</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Dates</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {exams.slice(0, 5).map((ex) => (
                    <tr key={ex.id} className="hover:bg-slate-50 text-slate-900 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-950">
                        {ex.title}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {ex.grade} {ex.section !== 'all' ? `(${ex.section})` : ''}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[11px]">
                          {ex.examType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        {ex.startDate} to {ex.endDate}
                      </td>
                      <td className="py-3.5 px-4">
                        {getExamStatusBadge(ex.status, ex.isLocked)}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedExamId(ex.id);
                            setActiveTab('marks_entry');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Marks</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedExamId(ex.id);
                            setActiveTab('results_matrix');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Award className="w-3 h-3" />
                          <span>Results</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {exams.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No examinations created yet. Click "Create Examination" to schedule your first assessment.
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
      {/* TAB 2: EXAMINATIONS DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'exams' && (
        <div className="space-y-6">
          {/* SEARCH & FILTERS BAR */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={examSearch}
                onChange={(e) => setExamSearch(e.target.value)}
                placeholder="Search examination title or code..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 font-bold">Class:</span>
                <select
                  value={selectedGradeFilter}
                  onChange={(e) => setSelectedGradeFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All Classes</option>
                  <option value="Class 12">Class 12</option>
                  <option value="Class 11">Class 11</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 9">Class 9</option>
                  <option value="Class 8">Class 8</option>
                  <option value="Class 7">Class 7</option>
                  <option value="Class 6">Class 6</option>
                  <option value="Class 5">Class 5</option>
                  <option value="Class 4">Class 4</option>
                  <option value="Class 3">Class 3</option>
                  <option value="Class 2">Class 2</option>
                  <option value="Class 1">Class 1</option>
                  <option value="UKG">UKG</option>
                  <option value="LKG">LKG</option>
                  <option value="Nursery">Nursery</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 font-bold">Status:</span>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="marks_entry">Marks Entry Open</option>
                  <option value="evaluation_complete">Evaluation Complete</option>
                  <option value="published">Published</option>
                  <option value="locked">Locked</option>
                </select>
              </div>
            </div>
          </div>

          {/* EXAMINATIONS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 transition flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 text-[11px] font-bold">
                      {exam.examType}
                    </span>
                    {getExamStatusBadge(exam.status, exam.isLocked)}
                  </div>

                  <h3 className="font-black text-slate-950 text-base leading-snug">{exam.title}</h3>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Class / Grade</span>
                      <strong className="text-slate-900 font-bold">{exam.grade} {exam.section !== 'all' ? `(${exam.section})` : ''}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Session</span>
                      <span className="text-slate-800 font-bold">{exam.academicSession}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Start Date</span>
                      <span className="text-slate-800">{exam.startDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">End Date</span>
                      <span className="text-slate-800">{exam.endDate}</span>
                    </div>
                  </div>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedExamId(exam.id);
                      setSelectedExam(exam);
                      setManageSubjectsModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                    <span>Subjects ({exam.subjectsCount ?? 5})</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setSelectedExamId(exam.id);
                        setActiveTab('marks_entry');
                      }}
                      className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition cursor-pointer"
                      title="Enter Marks"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setSelectedExamId(exam.id);
                        setActiveTab('results_matrix');
                      }}
                      className="p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 transition cursor-pointer"
                      title="View Class Results"
                    >
                      <Award className="w-4 h-4" />
                    </button>

                    {activeRole === 'admin' && !exam.isLocked && exam.status !== 'published' && (
                      <button
                        onClick={() => handlePublishResults(exam.id)}
                        className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition cursor-pointer"
                        title="Publish Results to Parents/Students"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}

                    {activeRole === 'admin' && !exam.isLocked && (
                      <button
                        onClick={() => handleLockExam(exam.id)}
                        className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 transition cursor-pointer"
                        title="Lock Examination"
                      >
                        <Lock className="w-4 h-4" />
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
      {/* TAB 3: MARKS ENTRY CONSOLE */}
      {/* ========================================================================= */}
      {activeTab === 'marks_entry' && (
        <div className="space-y-6">
          {/* SELECTOR BAR (WHITE CARD, DARK LABELS & INPUTS) */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-slate-950 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-600" />
                  <span>Marks Assessment & Entry Console</span>
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  Enter student scores with real-time validation (0 to Max Marks), CCE grades auto-calculation, and collision-resistant 8-Digit Student ID display.
                </p>
              </div>

              {selectedExam?.isLocked && (
                <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-rose-600" />
                  <span>Exam Locked: Modifications require admin justification</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {/* Select Exam */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Select Examination *</label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
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
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Class / Grade *</label>
                <select
                  value={marksGrade}
                  onChange={(e) => setMarksGrade(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                >
                  <option value="Class 12">Class 12</option>
                  <option value="Class 11">Class 11</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 9">Class 9</option>
                  <option value="Class 8">Class 8</option>
                  <option value="Class 7">Class 7</option>
                  <option value="Class 6">Class 6</option>
                  <option value="Class 5">Class 5</option>
                  <option value="Class 4">Class 4</option>
                  <option value="Class 3">Class 3</option>
                  <option value="Class 2">Class 2</option>
                  <option value="Class 1">Class 1</option>
                </select>
              </div>

              {/* Select Section */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Section *</label>
                <select
                  value={marksSection}
                  onChange={(e) => setMarksSection(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>

              {/* Select Subject */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Subject *</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs font-mono gap-3 shadow-sm">
              <div className="flex items-center flex-wrap gap-4 text-slate-900">
                <span>
                  Max Marks: <strong className="text-slate-950 font-black">{examSubjects.find(s => s.id === selectedSubjectId)?.maxMarks ?? 100}</strong>
                </span>
                <span>
                  Pass Threshold: <strong className="text-emerald-700 font-black">{examSubjects.find(s => s.id === selectedSubjectId)?.passMarks ?? 33}</strong>
                </span>
                {examSubjects.find(s => s.id === selectedSubjectId)?.assignedTeacherName && (
                  <span>
                    Faculty: <strong className="text-amber-900 font-black">{examSubjects.find(s => s.id === selectedSubjectId)?.assignedTeacherName}</strong>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveBulkMarks}
                  disabled={marksSaving || selectedExam?.isLocked}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-2 shadow-sm transition cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{marksSaving ? 'Saving Roster...' : 'Save & Calculate Results'}</span>
                </button>
              </div>
            </div>
          )}

          {/* STUDENT MARKS ROSTER TABLE */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Roll No</th>
                    <th className="py-3 px-4">Student ID (8-Digit)</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Attendance Status</th>
                    <th className="py-3 px-4">Marks Obtained</th>
                    <th className="py-3 px-4">CCE Grade</th>
                    <th className="py-3 px-4">Remarks</th>
                    {selectedExam?.isLocked && <th className="py-3 px-4 text-right">Admin Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  {marksLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500 font-sans font-medium">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-600" />
                        <span>Loading student marks roster from tenant database...</span>
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
                      <tr key={student.studentId} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">{student.rollNo || student.rollNumber}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-300 text-amber-900 font-bold font-mono">
                            {student.studentId8Digit || `2026${(student.admissionNo || student.rollNo || student.studentId).replace(/\D/g, '').slice(-4).padStart(4, '0')}`}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-sans font-bold text-slate-950">{student.studentName}</td>
                        <td className="py-3 px-4 font-sans">
                          <select
                            value={student.status}
                            disabled={selectedExam?.isLocked}
                            onChange={(e) => {
                              const newStatus = e.target.value as any;
                              setMarksRoster(marksRoster.map(s =>
                                s.studentId === student.studentId ? { ...s, status: newStatus, marksObtained: newStatus !== 'present' ? null : s.marksObtained } : s
                              ));
                              setMarksDirty(true);
                            }}
                            className={`px-2 py-1 rounded-lg border text-xs font-bold ${
                              student.status === 'present'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : student.status === 'absent'
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="not_appeared">Not Appeared</option>
                            <option value="exempted">Exempted</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          {student.status === 'present' ? (
                            <input
                              type="number"
                              min="0"
                              max={maxMarks}
                              disabled={selectedExam?.isLocked}
                              value={student.marksObtained !== null ? student.marksObtained : ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? null : Number(e.target.value);
                                setMarksRoster(marksRoster.map(s =>
                                  s.studentId === student.studentId ? { ...s, marksObtained: val } : s
                                ));
                                setMarksDirty(true);
                              }}
                              className="w-20 px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-amber-500"
                            />
                          ) : (
                            <span className="text-slate-400 font-sans italic">{student.status.toUpperCase()}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-black font-sans ${
                            computedGrade === 'A1' || computedGrade === 'A2'
                              ? 'bg-emerald-100 text-emerald-800'
                              : computedGrade === 'B1' || computedGrade === 'B2'
                              ? 'bg-blue-100 text-blue-800'
                              : computedGrade === 'E'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {computedGrade}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <input
                            type="text"
                            placeholder="Optional remark..."
                            disabled={selectedExam?.isLocked}
                            value={student.remarks || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMarksRoster(marksRoster.map(s =>
                                s.studentId === student.studentId ? { ...s, remarks: val } : s
                              ));
                              setMarksDirty(true);
                            }}
                            className="w-full px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-amber-500"
                          />
                        </td>
                        {selectedExam?.isLocked && (
                          <td className="py-3 px-4 text-right">
                            {activeSubject && (
                              <button
                                onClick={() => handleOpenCorrectionModal(student, activeSubject)}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Correct</span>
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {!marksLoading && marksRoster.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500 font-sans">
                        No students enrolled in {marksGrade} Section {marksSection}. Please verify enrollment in Student Directory.
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
      {/* TAB 4: CLASS RESULTS & TABULATION REGISTER */}
      {/* ========================================================================= */}
      {activeTab === 'results_matrix' && (
        <div className="space-y-6">
          {/* HEADER & EXAM PICKER & BATCH ACTION BUTTONS */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-slate-950 flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  <span>Class Results & Tabulation Register</span>
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  Class rankings, aggregate percentages, CCE divisions, 8-Digit Student ID registry, and batch printable report cards.
                </p>
              </div>

              <div className="flex items-center flex-wrap gap-2.5">
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
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
                  className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All Sections</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>

                {/* BATCH PRINT ALL MARKSHEETS BUTTON */}
                <button
                  type="button"
                  onClick={handleOpenBatchPrint}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print All Marksheets (Batch A4)</span>
                </button>

                {/* EXPORT TABULATION CSV */}
                <button
                  type="button"
                  onClick={handleExportTabulationCSV}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 border border-slate-300 transition cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* SEARCH IN RESULTS */}
            <div className="relative max-w-md pt-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={resultsSearchQuery}
                onChange={(e) => setResultsSearchQuery(e.target.value)}
                placeholder="Search student by name, 8-digit ID, or roll number..."
                className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
              />
            </div>

            {/* RESULTS SUMMARY BAR */}
            {resultsSummary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-3 border-t border-slate-100 font-mono text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Enrolled</span>
                  <span className="text-base font-black text-slate-950">{resultsSummary.totalStudents}</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 block uppercase font-sans font-bold">Passed</span>
                  <span className="text-base font-black text-emerald-800">{resultsSummary.passed}</span>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                  <span className="text-[10px] text-rose-800 block uppercase font-sans font-bold">Failed</span>
                  <span className="text-base font-black text-rose-800">{resultsSummary.failed}</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-[10px] text-amber-800 block uppercase font-sans font-bold">Compartment</span>
                  <span className="text-base font-black text-amber-800">{resultsSummary.compartment}</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 block uppercase font-sans font-bold">Pass Rate</span>
                  <span className="text-base font-black text-emerald-800">{resultsSummary.passPercentage}%</span>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <span className="text-[10px] text-blue-800 block uppercase font-sans font-bold">Class Average</span>
                  <span className="text-base font-black text-blue-900">{resultsSummary.classAveragePct}%</span>
                </div>
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                  <span className="text-[10px] text-purple-800 block uppercase font-sans font-bold">Top Score</span>
                  <span className="text-base font-black text-purple-900">{resultsSummary.highestPct}%</span>
                </div>
              </div>
            )}
          </div>

          {/* RESULTS TABLE */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Student ID (8-Digit)</th>
                    <th className="py-3 px-4">Roll No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Class & Sec</th>
                    <th className="py-3 px-4">Total Marks</th>
                    <th className="py-3 px-4">Percentage</th>
                    <th className="py-3 px-4">Grade</th>
                    <th className="py-3 px-4">Result Status</th>
                    <th className="py-3 px-4 text-right">Report Card</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  {resultsLoading ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-500 font-sans font-medium">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                        <span>Computing student results and tabulation matrix...</span>
                      </td>
                    </tr>
                  ) : filteredResultsMatrix.map((result) => {
                    const isExpanded = expandedStudentResultId === result.id;
                    const studentId8Digit = result.studentId8Digit || `2026${(result.admissionNo || result.rollNo || result.studentId || '0001').replace(/\D/g, '').slice(-4).padStart(4, '0')}`;

                    return (
                      <React.Fragment key={result.id}>
                        <tr className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 font-black text-slate-900">
                              #{result.classRank || result.sectionRank || 1}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-300 text-amber-900 font-bold font-mono">
                              {studentId8Digit}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">{result.rollNumber || result.rollNo}</td>
                          <td className="py-3 px-4 font-sans font-bold text-slate-950">{result.studentName}</td>
                          <td className="py-3 px-4 text-slate-700 font-bold">{result.grade} - {result.section}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {result.totalMarksObtained} / {result.maxTotalMarks}
                          </td>
                          <td className="py-3 px-4 font-black text-indigo-900 text-sm">
                            {result.percentage}%
                          </td>
                          <td className="py-3 px-4 font-sans">
                            <span className="px-2.5 py-0.5 rounded font-black text-xs bg-slate-100 text-slate-900 border border-slate-300">
                              {result.overallGrade}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-sans">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              result.resultStatus === 'PASS'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                : result.resultStatus === 'COMPARTMENT'
                                ? 'bg-amber-50 text-amber-800 border border-amber-300'
                                : 'bg-rose-50 text-rose-800 border border-rose-300'
                            }`}>
                              {result.resultStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenReportCard(result.studentId)}
                              className="px-3 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black inline-flex items-center gap-1 transition cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Report Card</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setExpandedStudentResultId(isExpanded ? null : result.id)}
                              className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                              title="Toggle Subject Breakdown"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>

                        {/* ACCORDION SUBJECT BREAKDOWN */}
                        {isExpanded && result.subjects && (
                          <tr className="bg-slate-50/70">
                            <td colSpan={10} className="p-4 border-y border-slate-200">
                              <div className="space-y-2">
                                <span className="text-[11px] font-bold text-slate-600 uppercase font-sans">
                                  Subject Evaluation Breakdown for {result.studentName}
                                </span>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                  {result.subjects.map((sub: any) => (
                                    <div key={sub.subjectId} className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                                      <span className="text-[10px] text-slate-500 font-sans block truncate font-bold">
                                        {sub.subjectName}
                                      </span>
                                      <div className="flex items-center justify-between text-xs font-mono my-1">
                                        <strong className="text-slate-950 font-black">
                                          {sub.status === 'present' ? `${sub.marksObtained}/${sub.maxMarks}` : sub.status.toUpperCase()}
                                        </strong>
                                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] font-black text-slate-800">
                                          {sub.grade}
                                        </span>
                                      </div>
                                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <div
                                          className="bg-indigo-600 h-full rounded-full"
                                          style={{ width: `${Math.min(100, sub.percentage || 0)}%` }}
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
                    );
                  })}
                  {!resultsLoading && filteredResultsMatrix.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-500 font-sans">
                        No evaluation results found. Enter marks in the Marks Entry tab and click "Save & Calculate Results".
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
      {/* TAB 5: RESULT LOCKING & AUDIT TRAIL */}
      {/* ========================================================================= */}
      {activeTab === 'locking_audit' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-950">Assessment Integrity & CBSE Locking Governance</h2>
                <p className="text-xs text-slate-600 font-medium">
                  Sealed examinations protect against grade tampering. Any post-lock modifications require administrative audit justification and are permanently recorded in the system audit log.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LOCKED EXAMINATIONS */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-950 flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-600" />
                <span>Locked Assessments Status</span>
              </h3>

              <div className="space-y-3">
                {exams.filter(e => e.isLocked).map((ex) => (
                  <div key={ex.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-950 text-xs">{ex.title}</h4>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {ex.grade} • Locked at: {ex.lockedAt ? new Date(ex.lockedAt).toLocaleDateString() : 'Active Session'}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-mono font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Sealed
                    </span>
                  </div>
                ))}
                {exams.filter(e => e.isLocked).length === 0 && (
                  <p className="text-xs text-slate-500 py-6 text-center font-medium">No examinations are currently locked.</p>
                )}
              </div>
            </div>

            {/* AUDIT LOG TRAIL */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-950 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Mark Correction Audit Trail</span>
              </h3>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-amber-800 font-bold">erp.marks_corrected</span>
                    <span className="text-slate-500">2026-09-15 14:32</span>
                  </div>
                  <p className="text-xs text-slate-900 font-medium">
                    Corrected Science marks from <strong>92</strong> to <strong>94</strong> for student <strong>Aarav Sharma</strong>.
                  </p>
                  <p className="text-[11px] text-slate-600 italic">
                    Reason: "Re-evaluation of Section B Question 4 per institutional academic scrutiny."
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">By: admin@dakshora.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: SINGLE OFFICIAL A4 MARKSHEET (PRINT & DOWNLOAD READY) */}
      {/* ========================================================================= */}
      {reportCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-5 my-8">
            {/* CONTROLS BAR (PRINT: HIDDEN) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 print:hidden">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-950 text-base flex items-center gap-2">
                    <span>{STATE_BOARD_CONFIGS[selectedBoard]?.titleEng || 'Official Marksheet'}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono font-bold border border-amber-300">
                      {selectedMedium === 'hindi' ? 'हिन्दी माध्यम' : selectedMedium === 'english' ? 'English Medium' : 'द्विभाषी (Bilingual)'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    RBSE / UPMSP / HBSE / CBSE Multi-Board Marksheet Engine • High Resolution A4 Ready
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 transition shadow-sm cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>PRINT MARKSHEET (A4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReportCardModalOpen(false)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  <X className="w-4 h-4" />
                  <span>CLOSE</span>
                </button>
              </div>
            </div>

            {/* BOARD & MEDIUM TOOLBAR (PRINT: HIDDEN) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 print:hidden">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1 mr-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    बोर्ड चुनें:
                  </span>
                  {[
                    { id: 'cbse', name: 'CBSE नई दिल्ली', tag: 'CCE Grade' },
                    { id: 'rbse', name: 'RBSE राजस्थान', tag: '80+20 सत्रांक' },
                    { id: 'upmsp', name: 'UP Board प्रयागराज', tag: '70+30 प्रायोगिक' },
                    { id: 'hbse', name: 'HBSE हरियाणा', tag: '80+20 CCE' },
                    { id: 'state', name: 'State Board', tag: 'राज्य शिक्षा बोर्ड' },
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
                          ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                      }`}
                    >
                      <span>{b.name}</span>
                      <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                        selectedBoard === b.id ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {b.tag}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Medium Selection Toggle */}
                <div className="flex items-center gap-1 bg-white border border-slate-300 p-1 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-500 px-2">माध्यम:</span>
                  {[
                    { id: 'hindi', label: 'हिन्दी माध्यम' },
                    { id: 'bilingual', label: 'द्विभाषी (Bilingual)' },
                    { id: 'english', label: 'English' },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMedium(m.id as MediumType)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        selectedMedium === m.id
                          ? 'bg-indigo-600 text-white font-black shadow-xs'
                          : 'text-slate-700 hover:text-slate-950'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* IDENTIFIERS ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200 text-xs font-mono">
                <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-3 py-1.5">
                  <input
                    type="checkbox"
                    id="toggleSessional"
                    checked={showSessionalBreakdown}
                    onChange={(e) => setShowSessionalBreakdown(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 border-slate-300 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="toggleSessional" className="text-slate-800 font-bold text-[11px] cursor-pointer">
                    सत्रांक विभाजन ({STATE_BOARD_CONFIGS[selectedBoard].theoryMax}+{STATE_BOARD_CONFIGS[selectedBoard].sessionalMax})
                  </label>
                </div>

                <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1">
                  <span className="text-[10px] text-slate-500 uppercase shrink-0 font-sans font-bold">S.R. No:</span>
                  <input
                    type="text"
                    value={customSrNumber}
                    onChange={(e) => setCustomSrNumber(e.target.value)}
                    className="w-full bg-transparent text-slate-950 font-black text-xs focus:outline-none"
                    placeholder="SR-2026-482"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1">
                  <span className="text-[10px] text-slate-500 uppercase shrink-0 font-sans font-bold">U-DISE:</span>
                  <input
                    type="text"
                    value={customUdiseCode}
                    onChange={(e) => setCustomUdiseCode(e.target.value)}
                    className="w-full bg-transparent text-slate-950 font-black text-xs focus:outline-none"
                    placeholder="08120401824"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1">
                  <span className="text-[10px] text-slate-500 uppercase shrink-0 truncate font-sans font-bold">{STATE_BOARD_CONFIGS[selectedBoard].schoolCodeLabel}:</span>
                  <input
                    type="text"
                    value={customSchoolCode}
                    onChange={(e) => setCustomSchoolCode(e.target.value)}
                    className="w-full bg-transparent text-slate-950 font-black text-xs focus:outline-none"
                    placeholder={STATE_BOARD_CONFIGS[selectedBoard].defaultSchoolCode}
                  />
                </div>
              </div>
            </div>

            {/* MARKSHEET CONTENT (A4 READY) */}
            {reportCardLoading ? (
              <div className="py-20 text-center text-slate-500 font-medium">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-amber-600" />
                <span>Generating official {STATE_BOARD_CONFIGS[selectedBoard]?.titleEng || 'Board'} marksheet...</span>
              </div>
            ) : reportCardData ? (
              (() => {
                const currentConfig = STATE_BOARD_CONFIGS[selectedBoard] || STATE_BOARD_CONFIGS.cbse;
                const divisionData = calculateStateBoardDivision(reportCardData.result.percentage);
                const studentId8Digit = reportCardData.student.studentId || reportCardData.student.studentId8Digit || `2026${(reportCardData.student.admissionNumber || reportCardData.student.rollNumber || reportCardData.student.id).replace(/\D/g, '').slice(-4).padStart(4, '0')}`;

                return (
                  <div
                    id="printable-report-card"
                    className="bg-white text-slate-950 p-8 rounded-2xl shadow-sm space-y-5 font-sans border-2 border-slate-300 print:p-0 print:border-0 print:shadow-none"
                  >
                    {/* 1. LETTERHEAD */}
                    <div className="text-center border-b-2 border-slate-400 pb-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className={`w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center font-black ${currentConfig.emblemGradient} shadow-xs`}>
                          <span className="text-sm tracking-tight">{currentConfig.emblemInitials}</span>
                          <span className="text-[8px] tracking-wider opacity-90">{currentConfig.emblemSubtitle}</span>
                        </div>

                        <div className="flex-1 px-4">
                          <h2 className="text-sm font-bold text-slate-700 tracking-wide font-serif">
                            {currentConfig.titleHindi}
                          </h2>
                          <p className="text-[11px] text-slate-600 font-medium">
                            {currentConfig.titleEng}
                          </p>
                          <h1 className="text-2xl font-black text-slate-950 uppercase tracking-tight mt-1">
                            {reportCardData.school.name}
                          </h1>
                          <p className="text-xs text-slate-600 font-medium">
                            {currentConfig.authorityHindi} • {currentConfig.schoolCodeLabel}: <strong>{customSchoolCode || reportCardData.school.schoolCode || 'SCH-01'}</strong> • U-DISE: <strong>{customUdiseCode || '08120401824'}</strong>
                          </p>
                        </div>

                        <div className="w-16 h-16 rounded-xl border border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-1 text-[8px] font-bold text-slate-700 font-mono text-center">
                          <span>सत्र / Session</span>
                          <strong className="text-xs text-slate-950">{reportCardData.school.academicSession || activeSession}</strong>
                        </div>
                      </div>

                      {/* DOCUMENT TITLE BADGE */}
                      <div className="pt-2">
                        <span className="inline-block px-6 py-1 rounded-full bg-slate-100 text-slate-950 border border-slate-300 text-xs font-black uppercase tracking-wider shadow-xs">
                          {selectedMedium === 'hindi' ? currentConfig.docTitleHindi : selectedMedium === 'english' ? currentConfig.docTitleEng : `${currentConfig.docTitleHindi} • ${currentConfig.docTitleEng}`}
                        </span>
                      </div>
                    </div>

                    {/* 2. STUDENT COMPREHENSIVE DOSSIER */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-3 text-xs">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-bold">
                            {selectedMedium === 'hindi' ? 'विद्यार्थी का नाम' : selectedMedium === 'english' ? "Student's Name" : "विद्यार्थी का नाम (Student's Name)"}
                          </span>
                          <strong className="text-slate-950 text-sm font-black">{reportCardData.student.name}</strong>
                        </div>

                        {/* 8-DIGIT STUDENT ID */}
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-bold">
                            {selectedMedium === 'hindi' ? 'छात्र पहचान संख्या (8-अंक)' : 'Student ID (8-Digit)'}
                          </span>
                          <strong className="text-amber-900 font-mono font-black text-sm bg-amber-50 px-2 py-0.5 rounded border border-amber-300 inline-block">
                            {studentId8Digit}
                          </strong>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-bold">
                            {selectedMedium === 'hindi' ? 'कक्षा एवं वर्ग' : selectedMedium === 'english' ? 'Class & Section' : 'कक्षा एवं वर्ग (Class & Sec)'}
                          </span>
                          <strong className="text-slate-950 font-bold">{reportCardData.student.grade} - {reportCardData.student.section}</strong>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-bold">
                            {selectedMedium === 'hindi' ? 'अनुक्रमांक' : selectedMedium === 'english' ? 'Roll Number' : 'अनुक्रमांक (Roll No.)'}
                          </span>
                          <strong className="text-slate-950 font-mono font-bold">{reportCardData.student.rollNumber || reportCardData.student.rollNo}</strong>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-bold">
                            {selectedMedium === 'hindi' ? 'स्कॉलर रजिस्टर क्रमांक (S.R.)' : selectedMedium === 'english' ? 'Admission / S.R. No.' : 'प्रवेश क्रमांक (Admission No.)'}
                          </span>
                          <strong className="text-slate-950 font-mono font-bold">{customSrNumber || reportCardData.student.admissionNumber || reportCardData.student.admissionNo}</strong>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-bold">
                            {selectedMedium === 'hindi' ? 'पिता का नाम' : selectedMedium === 'english' ? "Father's Name" : "पिता का नाम (Father's Name)"}
                          </span>
                          <strong className="text-slate-950 font-bold">{reportCardData.student.guardianName || reportCardData.student.parentName || "राजेश शर्मा (Rajesh Sharma)"}</strong>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-bold">
                            {selectedMedium === 'hindi' ? 'माता का नाम' : selectedMedium === 'english' ? "Mother's Name" : "माता का नाम (Mother's Name)"}
                          </span>
                          <strong className="text-slate-950 font-bold">{reportCardData.student.motherName || "सुनीता शर्मा (Sunita Sharma)"}</strong>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-bold">
                            स्थायी शिक्षा संख्या (PEN No.)
                          </span>
                          <strong className="text-slate-950 font-mono font-bold">{reportCardData.student.penNo || '2026081204018'}</strong>
                        </div>
                      </div>

                      {/* DOB ROW */}
                      <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                        <div>
                          <span className="text-slate-500 font-bold uppercase mr-1">जन्म तिथि (Date of Birth):</span>
                          <strong className="text-slate-950 font-mono font-black mr-2">{reportCardData.student.dateOfBirth || reportCardData.student.dob}</strong>
                          <span className="text-slate-700 font-medium">
                            शब्दों में: <strong className="text-indigo-950 font-bold">{getHindiDobInWords(reportCardData.student.dateOfBirth || reportCardData.student.dob || '')}</strong>
                          </span>
                        </div>
                        <div className="text-slate-600 font-mono text-[11px]">
                          रक्त समूह (Blood Group): <strong className="text-rose-700 font-bold">{reportCardData.student.bloodGroup || 'B+'}</strong>
                        </div>
                      </div>
                    </div>

                    {/* 3. SCHOLASTIC ASSESSMENT TABLE */}
                    <div className="border-2 border-slate-400 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-950 border-b border-slate-300 font-black">
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
                                  {selectedBoard === 'upmsp' ? `प्रायोगिक (${currentConfig.sessionalMax})` : `सत्रांक (${currentConfig.sessionalMax})`}
                                </th>
                              </>
                            )}
                            <th className="py-2.5 px-3 border-r border-slate-300 text-center">पूर्णांक (Max)</th>
                            <th className="py-2.5 px-3 border-r border-slate-300 text-center">उत्तीर्णांक (Pass)</th>
                            <th className="py-2.5 px-3 border-r border-slate-300 text-center">प्राप्तांक (Obtained)</th>
                            <th className="py-2.5 px-3 border-r border-slate-300 text-center">प्रतिशत (%)</th>
                            <th className="py-2.5 px-3 border-r border-slate-300 text-center">ग्रेड (Grade)</th>
                            <th className="py-2.5 px-3 text-center">अभ्युक्ति (Remarks)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300 font-mono text-xs">
                          {reportCardData.subjects.map((sub, idx) => {
                            const pct = sub.percentage || (sub.marksObtained != null ? Math.round((sub.marksObtained / sub.maxMarks) * 100) : 0);
                            const obtained = sub.status === 'present' ? (sub.marksObtained ?? 0) : 0;

                            // Sessional & Theory Split
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

                            const hasGrace = obtained >= 28 && obtained < 33;
                            const graceAmount = hasGrace ? 33 - obtained : 0;

                            return (
                              <tr key={sub.subjectId} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 border-r border-slate-300 text-slate-500 text-center">{idx + 1}</td>
                                <td className="py-2.5 px-3 border-r border-slate-300 font-sans font-bold text-slate-950">
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
                                <td className="py-2.5 px-3 border-r border-slate-300 text-center font-black text-slate-950 text-sm">
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
                                  <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-950 font-black">
                                    {sub.grade}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center font-sans text-xs">
                                  {hasGrace ? (
                                    <span className="text-amber-800 font-bold">* अनुग्रह (+{graceAmount})</span>
                                  ) : obtained >= sub.passMarks ? (
                                    <span className="text-emerald-700 font-bold">उत्तीर्ण (PASS)</span>
                                  ) : (
                                    <span className="text-rose-700 font-bold">पूरक (SUPPL)</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}

                          {/* TOTAL SUMMARY ROW */}
                          <tr className="bg-slate-100 font-bold border-t-2 border-slate-400 font-sans">
                            <td colSpan={showSessionalBreakdown ? 4 : 2} className="py-3 px-3 border-r border-slate-300 text-slate-950 font-black">
                              {selectedMedium === 'hindi' ? 'कुल प्राप्तांक एवं समग्र मूल्यांकन (GRAND TOTAL)' : 'GRAND TOTAL & OVERALL PERFORMANCE'}
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
                              <span className="px-3 py-1 rounded bg-slate-950 text-amber-300 font-black">
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

                    {/* 4. CO-SCHOLASTIC ASSESSMENT */}
                    <div className="border border-slate-300 rounded-xl p-3 bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                        <span className="text-xs font-black text-slate-900 uppercase">
                          सह-शैक्षिक एवं जीवन कौशल मूल्यांकन (Co-Scholastic & Life Skills Evaluation)
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">5-Point Scale (A+, A, B, C, D)</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                        <div className="p-2 bg-white border border-slate-200 rounded-lg">
                          <span className="text-[10px] text-slate-500 block font-bold leading-tight">
                            कार्य शिक्षा (Work Education)
                          </span>
                          <strong className="text-indigo-900 font-black text-sm">A+</strong>
                        </div>
                        <div className="p-2 bg-white border border-slate-200 rounded-lg">
                          <span className="text-[10px] text-slate-500 block font-bold leading-tight">
                            कला शिक्षा (Art Education)
                          </span>
                          <strong className="text-indigo-900 font-black text-sm">A</strong>
                        </div>
                        <div className="p-2 bg-white border border-slate-200 rounded-lg">
                          <span className="text-[10px] text-slate-500 block font-bold leading-tight">
                            स्वास्थ्य एवं शारीरिक शिक्षा
                          </span>
                          <strong className="text-indigo-900 font-black text-sm">A+</strong>
                        </div>
                        <div className="p-2 bg-white border border-slate-200 rounded-lg">
                          <span className="text-[10px] text-slate-500 block font-bold leading-tight">
                            अनुशासन एवं आचरण (Discipline)
                          </span>
                          <strong className="text-emerald-700 font-black text-sm">A+</strong>
                        </div>
                        <div className="p-2 bg-white border border-slate-200 rounded-lg">
                          <span className="text-[10px] text-slate-500 block font-bold leading-tight">
                            उपस्थिति (Attendance)
                          </span>
                          <strong className="text-slate-950 font-black text-sm">
                            {reportCardData.attendance?.attendancePercentage ?? 95}%
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* 5. RESULT STATUS & REMARKS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 border border-slate-300 rounded-xl bg-slate-50 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">
                          परीक्षा परिणाम घोषणा (Final Result Status)
                        </span>
                        <p className="text-slate-900 font-medium">
                          {currentConfig.divisionLabel}: <strong className="text-indigo-950 font-black">{divisionData.division}</strong>
                        </p>
                        <p className="text-slate-700 text-[11px] font-medium mt-0.5">
                          परिणाम विवरण:{' '}
                          <strong className="text-emerald-700 font-bold uppercase">{divisionData.statusText}</strong>
                        </p>
                      </div>

                      <div className="p-3 border border-slate-300 rounded-xl bg-slate-50 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">
                          शिक्षक अभ्युक्ति (Faculty Remarks)
                        </span>
                        <p className="text-slate-800 italic font-medium leading-tight">
                          "{reportCardData.remarks || 'विद्यार्थी का शैक्षिक प्रदर्शन अत्यंत सराहनीय है। निरंतर अभ्यास से और अधिक सफलता संभव है।'}"
                        </p>
                      </div>
                    </div>

                    {/* 6. SIGNATURES & OFFICIAL SEAL */}
                    <div className="pt-6 flex items-end justify-between text-xs text-slate-800 border-t border-slate-300">
                      <div className="text-center w-36 border-t-2 border-slate-500 pt-1.5">
                        <span className="font-bold block">कक्षाध्यापक</span>
                        <span className="text-[10px] text-slate-500 font-mono">Class Teacher</span>
                      </div>

                      <div className="text-center w-36 border-t-2 border-slate-500 pt-1.5">
                        <span className="font-bold block">परीक्षा प्रभारी</span>
                        <span className="text-[10px] text-slate-500 font-mono">Exam Controller</span>
                      </div>

                      <div className="flex flex-col items-center justify-center shrink-0">
                        <div className="w-20 h-20 rounded-full border-2 border-indigo-900 flex flex-col items-center justify-center text-center p-1 text-[8px] font-bold text-indigo-950 font-serif shadow-xs">
                          <span className="leading-tight uppercase">{reportCardData.school.name.slice(0, 15)}</span>
                          <span className="my-0.5 text-amber-600 font-sans font-bold">★ SEAL ★</span>
                          <span className="leading-tight uppercase font-mono">{currentConfig.emblemInitials}</span>
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono mt-1">विद्यालय मुहर</span>
                      </div>

                      <div className="text-center w-44 border-t-2 border-slate-500 pt-1.5">
                        <span className="font-bold block">प्रधानाचार्य / संस्था प्रधान</span>
                        <span className="text-[10px] text-slate-500 font-mono">Principal & Head of School</span>
                        <span className="text-[9px] text-slate-500 block mt-0.5 font-mono">दिनांक: {new Date().toLocaleDateString('en-GB')}</span>
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
      {/* MODAL 2: BATCH MARKSHEET GENERATOR (MULTI-STUDENT A4 PRINT) */}
      {/* ========================================================================= */}
      {batchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 print:hidden">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800">
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-950 text-base">
                    Batch Marksheet Printing Engine ({batchReportCards.length} Students)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {selectedExam?.title} • {marksGrade} (Sec: {resultsSectionFilter}) • Ready for A4 Bulk Printing
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center gap-2 transition shadow-sm cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>PRINT ALL MARKSHEETS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBatchModalOpen(false)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  <X className="w-4 h-4" />
                  <span>CLOSE</span>
                </button>
              </div>
            </div>

            {batchLoading ? (
              <div className="py-20 text-center text-slate-500 font-medium">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
                <span>Loading all student marksheets in section...</span>
              </div>
            ) : (
              <div className="space-y-12">
                {batchReportCards.map((rc, rIdx) => {
                  const currentConfig = STATE_BOARD_CONFIGS[selectedBoard] || STATE_BOARD_CONFIGS.cbse;
                  const divisionData = calculateStateBoardDivision(rc.result.percentage);
                  const studentId8Digit = rc.student.studentId || rc.student.studentId8Digit || `2026${(rc.student.admissionNumber || rc.student.rollNumber || rc.student.id).replace(/\D/g, '').slice(-4).padStart(4, '0')}`;

                  return (
                    <div
                      key={rc.student.id || rIdx}
                      style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
                      className="bg-white text-slate-950 p-8 rounded-2xl shadow-sm space-y-5 font-sans border-2 border-slate-300 print:p-0 print:border-0 print:shadow-none"
                    >
                      {/* HEADER */}
                      <div className="text-center border-b-2 border-slate-400 pb-3">
                        <div className="flex items-center justify-between">
                          <div className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center font-black ${currentConfig.emblemGradient}`}>
                            <span className="text-xs">{currentConfig.emblemInitials}</span>
                          </div>
                          <div className="flex-1 px-4">
                            <h2 className="text-xs font-bold text-slate-700 font-serif">{currentConfig.titleHindi}</h2>
                            <h1 className="text-xl font-black text-slate-950 uppercase">{rc.school.name}</h1>
                            <p className="text-[11px] text-slate-600">
                              {currentConfig.authorityHindi} • Code: {customSchoolCode || rc.school.schoolCode || 'SCH-01'} • U-DISE: {customUdiseCode || '08120401824'}
                            </p>
                          </div>
                          <div className="text-right font-mono text-[10px] text-slate-500">
                            <span>सत्र {rc.school.academicSession || activeSession}</span>
                          </div>
                        </div>
                      </div>

                      {/* DOSSIER */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block font-bold">विद्यार्थी का नाम</span>
                          <strong className="text-slate-950 font-black">{rc.student.name}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block font-bold">छात्र पहचान (8-अंक ID)</span>
                          <strong className="text-amber-900 font-mono font-black">{studentId8Digit}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block font-bold">कक्षा एवं वर्ग</span>
                          <strong className="text-slate-950 font-bold">{rc.student.grade} - {rc.student.section}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block font-bold">अनुक्रमांक (Roll No.)</span>
                          <strong className="text-slate-950 font-mono font-bold">{rc.student.rollNumber || rc.student.rollNo}</strong>
                        </div>
                      </div>

                      {/* MARKS TABLE */}
                      <table className="w-full text-left text-xs border-collapse border border-slate-300">
                        <thead>
                          <tr className="bg-slate-100 text-slate-950 font-black">
                            <th className="py-2 px-3 border border-slate-300 text-center w-8">#</th>
                            <th className="py-2 px-3 border border-slate-300">विषय (Subject)</th>
                            <th className="py-2 px-3 border border-slate-300 text-center">पूर्णांक (Max)</th>
                            <th className="py-2 px-3 border border-slate-300 text-center">उत्तीर्णांक</th>
                            <th className="py-2 px-3 border border-slate-300 text-center">प्राप्तांक</th>
                            <th className="py-2 px-3 border border-slate-300 text-center">प्रतिशत</th>
                            <th className="py-2 px-3 border border-slate-300 text-center">ग्रेड</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300 font-mono">
                          {rc.subjects.map((sub, sIdx) => (
                            <tr key={sub.subjectId || sIdx}>
                              <td className="py-2 px-3 border border-slate-300 text-center text-slate-500">{sIdx + 1}</td>
                              <td className="py-2 px-3 border border-slate-300 font-sans font-bold text-slate-950">{sub.subjectName}</td>
                              <td className="py-2 px-3 border border-slate-300 text-center">{sub.maxMarks}</td>
                              <td className="py-2 px-3 border border-slate-300 text-center">{sub.passMarks}</td>
                              <td className="py-2 px-3 border border-slate-300 text-center font-bold text-slate-950">
                                {sub.status === 'present' ? sub.marksObtained : sub.status.toUpperCase()}
                              </td>
                              <td className="py-2 px-3 border border-slate-300 text-center">{sub.percentage || 0}%</td>
                              <td className="py-2 px-3 border border-slate-300 text-center font-bold font-sans">{sub.grade}</td>
                            </tr>
                          ))}
                          <tr className="bg-slate-100 font-black font-sans">
                            <td colSpan={2} className="py-2.5 px-3 border border-slate-300">GRAND TOTAL & PERCENTAGE</td>
                            <td className="py-2.5 px-3 border border-slate-300 text-center font-mono">{rc.result.maxTotalMarks}</td>
                            <td className="py-2.5 px-3 border border-slate-300 text-center font-mono">{Math.round(rc.result.maxTotalMarks * 0.33)}</td>
                            <td className="py-2.5 px-3 border border-slate-300 text-center font-mono text-indigo-950 font-black">{rc.result.totalMarksObtained}</td>
                            <td className="py-2.5 px-3 border border-slate-300 text-center font-mono text-indigo-950 font-black">{rc.result.percentage}%</td>
                            <td className="py-2.5 px-3 border border-slate-300 text-center font-black">{rc.result.overallGrade}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* SUMMARY & SIGNATURES */}
                      <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-300">
                        <div>
                          <span className="text-slate-500 font-bold block">परिणाम (Status):</span>
                          <strong className="text-emerald-700 font-black uppercase">{divisionData.statusText}</strong>
                        </div>
                        <div className="text-center w-32 border-t border-slate-400 pt-1 font-bold">Class Teacher</div>
                        <div className="text-center w-36 border-t border-slate-400 pt-1 font-bold">Principal & Seal</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CREATE / EDIT EXAMINATION */}
      {/* ========================================================================= */}
      {examModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-600" />
                <span>{editingExamId ? 'Edit Examination' : 'Create Examination'}</span>
              </h3>
              <button
                onClick={() => setExamModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-950 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Examination Title *</label>
                <input
                  type="text"
                  required
                  value={examFormData.title}
                  onChange={(e) => setExamFormData({ ...examFormData, title: e.target.value })}
                  placeholder="e.g. Periodic Test 1 (PT-1) 2026-27"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Assessment Type</label>
                  <select
                    value={examFormData.examType}
                    onChange={(e) => setExamFormData({ ...examFormData, examType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="Unit Test">Unit Test / Periodic Test</option>
                    <option value="Mid Term">Mid Term / Half Yearly</option>
                    <option value="Pre-Board">Pre-Board Examination</option>
                    <option value="Final Board">Annual / Final Board</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Academic Session</label>
                  <input
                    type="text"
                    value={examFormData.academicSession}
                    onChange={(e) => setExamFormData({ ...examFormData, academicSession: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Target Grade</label>
                  <select
                    value={examFormData.grade}
                    onChange={(e) => setExamFormData({ ...examFormData, grade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="Class 12">Class 12</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 8">Class 8</option>
                    <option value="Class 7">Class 7</option>
                    <option value="Class 6">Class 6</option>
                    <option value="Class 5">Class 5</option>
                    <option value="Class 4">Class 4</option>
                    <option value="Class 3">Class 3</option>
                    <option value="Class 2">Class 2</option>
                    <option value="Class 1">Class 1</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Section</label>
                  <select
                    value={examFormData.section}
                    onChange={(e) => setExamFormData({ ...examFormData, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-amber-500"
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
                  <label className="text-slate-700 font-bold block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={examFormData.startDate}
                    onChange={(e) => setExamFormData({ ...examFormData, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={examFormData.endDate}
                    onChange={(e) => setExamFormData({ ...examFormData, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setExamModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black cursor-pointer shadow-sm"
                >
                  {editingExamId ? 'Update Exam' : 'Schedule Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: MANAGE SUBJECTS */}
      {/* ========================================================================= */}
      {manageSubjectsModalOpen && selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-600" />
                  <span>Curriculum Subjects ({selectedExam.title})</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">Add, remove, and configure assessment maximum and passing thresholds.</p>
              </div>
              <button
                onClick={() => setManageSubjectsModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
              {examSubjects.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono"
                >
                  <div>
                    <span className="font-sans font-black text-slate-950 text-sm">{sub.subjectName}</span>
                    <span className="text-slate-500 ml-2">({sub.subjectCode || 'CBSE'})</span>
                    <p className="text-slate-600 text-[11px] font-sans font-medium">
                      Faculty: {sub.assignedTeacherName || 'General Faculty'} • Date: {sub.examDate || 'Scheduled'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-indigo-900 font-black">
                      {sub.passMarks} Pass / {sub.maxMarks} Max
                    </span>
                    {!selectedExam.isLocked && (
                      <button
                        onClick={() => handleDeleteSubjectFromExam(sub.id, sub.subjectName)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Remove Subject"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {examSubjects.length === 0 && (
                <p className="text-xs text-slate-500 py-6 text-center font-medium">
                  No subjects configured for this assessment yet. Use the form below to add subjects.
                </p>
              )}
            </div>

            {!selectedExam.isLocked && (
              <form onSubmit={handleAddSubjectToExam} className="pt-4 border-t border-slate-200 space-y-3 text-xs">
                <span className="text-slate-900 font-black block">Add Subject to Assessment</span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="col-span-2">
                    <input
                      type="text"
                      required
                      placeholder="Subject Name (e.g. Mathematics)"
                      value={newSubjectFormData.subjectName}
                      onChange={(e) => setNewSubjectFormData({ ...newSubjectFormData, subjectName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Max Marks (100)"
                      value={newSubjectFormData.maxMarks}
                      onChange={(e) => setNewSubjectFormData({ ...newSubjectFormData, maxMarks: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Pass Marks (33)"
                      value={newSubjectFormData.passMarks}
                      onChange={(e) => setNewSubjectFormData({ ...newSubjectFormData, passMarks: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <select
                    value={newSubjectFormData.assignedTeacherId}
                    onChange={(e) => setNewSubjectFormData({ ...newSubjectFormData, assignedTeacherId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Select Faculty (Optional)</option>
                    {staffList.filter(s => s.role === 'teacher' || s.designation?.toLowerCase().includes('teacher')).map(t => (
                      <option key={t.id} value={t.id}>{t.firstName} {t.lastName} ({t.department || 'Faculty'})</option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs cursor-pointer shadow-sm"
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
      {/* MODAL 5: ADMIN MARK CORRECTION (AUDIT TRAIL) */}
      {/* ========================================================================= */}
      {correctionModalOpen && correctionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-rose-300 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span>Administrative Mark Correction</span>
              </h3>
              <button
                onClick={() => setCorrectionModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
              <p className="font-bold">CBSE Governance Notice</p>
              <p className="text-[11px] leading-relaxed">
                This examination is sealed. Modifying scores requires administrative justification and is permanently logged in the tenant audit log.
              </p>
            </div>

            <form onSubmit={handleSubmitCorrection} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 font-mono">
                <p className="text-slate-600 font-sans">Student: <strong className="text-slate-950">{correctionTarget.studentName}</strong></p>
                <p className="text-slate-600 font-sans">Subject: <strong className="text-slate-950">{correctionTarget.subjectName}</strong></p>
                <p className="text-slate-600 font-sans">Current Score: <strong className="text-amber-800">{correctionTarget.currentMarks ?? 'N/A'}</strong> ({correctionTarget.currentStatus})</p>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">New Attendance Status</label>
                <select
                  value={correctionNewStatus}
                  onChange={(e) => setCorrectionNewStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="exempted">Exempted</option>
                </select>
              </div>

              {correctionNewStatus === 'present' && (
                <div>
                  <label className="text-slate-700 font-bold block mb-1">New Marks Obtained *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={correctionNewMarks}
                    onChange={(e) => setCorrectionNewMarks(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Enter revised score"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              <div>
                <label className="text-slate-700 font-bold block mb-1">Mandatory Audit Justification / Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="Explain why this mark is modified after lock (e.g. Scrutiny / re-evaluation of Question 4 per academic committee approval)..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-950 font-medium focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCorrectionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={correctionSubmitting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black cursor-pointer shadow-sm"
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
