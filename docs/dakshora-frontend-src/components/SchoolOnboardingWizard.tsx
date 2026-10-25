import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Building2,
  GraduationCap,
  MapPin,
  Calendar,
  Layers,
  BookOpen,
  Users,
  UserCheck,
  CreditCard,
  FileCheck,
  Bell,
  Bus,
  Library,
  DollarSign,
  Bot,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Save,
  Sparkles,
  Upload,
  Download,
  Plus,
  Trash2,
  RefreshCw,
  Check,
  ShieldCheck,
  Clock,
  ExternalLink,
  ChevronRight,
  Mail,
  Send,
  HelpCircle,
  Search,
  FileSpreadsheet,
  X,
  Eye,
  Phone,
  User,
  Award,
  Shield,
  CheckSquare,
  Square,
  Sliders,
  Cpu,
  Radio,
  Filter,
  FileText,
  Lock,
  Zap,
  Globe,
  UploadCloud
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  SchoolOnboardingRecord,
  OnboardingChecklist,
  ImportPreviewSummary,
  OrganizationRecord
} from '../types';
import {
  fetchOnboardingStatus,
  saveOnboardingStep,
  saveOnboardingDraft,
  activateSchoolErp,
  inviteSchoolAdmin,
  importOnboardingStudents,
  importOnboardingStaff,
  fetchOrganizations
} from '../services/api';

// ============================================================================
// 1. NEP 2020 5+3+3+4 PEDAGOGICAL STAGE DEFINITIONS & DATA STRUCTURES
// ============================================================================

export interface NepStage {
  id: string;
  name: string;
  hindiName: string;
  span: string;
  ageGroup: string;
  grades: string[];
  description: string;
  badge: string;
  icon: string;
}

export const NEP_PEDAGOGICAL_STAGES: NepStage[] = [
  {
    id: 'foundational',
    name: 'Foundational Stage',
    hindiName: 'बुनियादी चरण (5 वर्ष, आयु 3-8)',
    span: '5 Years',
    ageGroup: 'Ages 3–8',
    grades: ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2'],
    description: 'Pre-school playgroup, kindergarten (Balvatika), and foundational primary Grades 1 & 2. Focus on play, activity, numeracy, and linguistic discovery.',
    badge: 'Stage 1 • Ages 3-8',
    icon: '🧸'
  },
  {
    id: 'preparatory',
    name: 'Preparatory Stage',
    hindiName: 'प्रारंभिक चरण (3 वर्ष, आयु 8-11)',
    span: '3 Years',
    ageGroup: 'Ages 8–11',
    grades: ['Class 3', 'Class 4', 'Class 5'],
    description: 'Classes 3, 4, and 5. Introduction to structured textbooks, core literacy, numeracy, discovery of environmental science, and creative arts.',
    badge: 'Stage 2 • Ages 8-11',
    icon: '🎒'
  },
  {
    id: 'middle',
    name: 'Middle Stage',
    hindiName: 'मध्य चरण (3 वर्ष, आयु 11-14)',
    span: '3 Years',
    ageGroup: 'Ages 11–14',
    grades: ['Class 6', 'Class 7', 'Class 8'],
    description: 'Classes 6, 7, and 8. Experiential inquiry in sciences, mathematics, three-language formula, social sciences, humanities, and hands-on vocational skills.',
    badge: 'Stage 3 • Ages 11-14',
    icon: '🔬'
  },
  {
    id: 'secondary',
    name: 'Secondary Stage',
    hindiName: 'माध्यमिक चरण (4 वर्ष, आयु 14-18)',
    span: '4 Years',
    ageGroup: 'Ages 14–18',
    grades: ['Class 9', 'Class 10', 'Class 11', 'Class 12'],
    description: 'Classes 9 to 12. Multidisciplinary depth, critical thinking, board certifications (Classes 10 & 12), and flexible stream/subject combinations in Senior Secondary.',
    badge: 'Stage 4 • Ages 14-18',
    icon: '🎓'
  }
];

export interface ClassroomItem {
  grade: string;
  section: string;
  roomNumber: string;
  capacity?: number;
  classTeacher?: string;
}

export interface SubjectItem {
  name: string;
  code: string;
  category: 'Language' | 'Core' | 'Skill' | 'Elective' | 'Co-Scholastic';
  gradeBand: string; // 'Foundational' | 'Preparatory' | '6-8' | '9-10' | '11-12' | 'All'
  theoryMarks: number;
  internalMarks: number;
  isCompulsory: boolean;
  board?: string;
}

export interface StreamCombination {
  id: string;
  streamName: string;
  grade: string;
  section: string;
  compulsoryLanguage: string;
  coreSubjects: string[];
  electiveSubject: string;
  additionalSubject?: string;
}

export interface StaffItem {
  staffName: string;
  email: string;
  mobileNo: string;
  empId: string;
  role: string;
  department: string;
  designation: string;
}

export interface StudentItem {
  studentName: string;
  grade: string;
  section: string;
  rollNo: string;
  admissionNo: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
}

export interface FeeHeadItem {
  feeHead: string;
  amountInr: number;
  frequency: 'monthly' | 'quarterly' | 'half_yearly' | 'annual' | 'one_time';
  applicableClasses?: string;
  dueDay?: number;
}

// ============================================================================
// 2. CURATED BOARD CURRICULUM CATALOGS (CBSE, RBSE, ICSE)
// ============================================================================

export const BOARD_CURATED_SUBJECTS: Record<string, SubjectItem[]> = {
  CBSE: [
    // Middle Stage (6 to 8) - Three Language Formula + Core + Skill
    { name: 'English Communicative & Literature', code: 'ENG-601', category: 'Language', gradeBand: '6-8', theoryMarks: 80, internalMarks: 20, isCompulsory: true, board: 'CBSE' },
    { name: 'Hindi Vyakaran & Sahitya', code: 'HIN-601', category: 'Language', gradeBand: '6-8', theoryMarks: 80, internalMarks: 20, isCompulsory: true, board: 'CBSE' },
    { name: 'Sanskrit / Third Language (Urdu/Regional)', code: 'SKT-601', category: 'Language', gradeBand: '6-8', theoryMarks: 80, internalMarks: 20, isCompulsory: false, board: 'CBSE' },
    { name: 'Mathematics & Mental Reasoning', code: 'MTH-601', category: 'Core', gradeBand: '6-8', theoryMarks: 80, internalMarks: 20, isCompulsory: true, board: 'CBSE' },
    { name: 'General Science (Physics, Chemistry & Biology)', code: 'SCI-601', category: 'Core', gradeBand: '6-8', theoryMarks: 80, internalMarks: 20, isCompulsory: true, board: 'CBSE' },
    { name: 'Social Science (History, Civics & Geography)', code: 'SST-601', category: 'Core', gradeBand: '6-8', theoryMarks: 80, internalMarks: 20, isCompulsory: true, board: 'CBSE' },
    { name: 'Coding & AI Foundation (NEP Skill)', code: 'COD-601', category: 'Skill', gradeBand: '6-8', theoryMarks: 50, internalMarks: 50, isCompulsory: false, board: 'CBSE' },
    { name: 'Art Education & Craft', code: 'ART-601', category: 'Co-Scholastic', gradeBand: '6-8', theoryMarks: 0, internalMarks: 100, isCompulsory: true, board: 'CBSE' },
    // Secondary Stage (9 & 10) - Two Languages + Three Core + Vocational
    { name: 'English Language & Literature', code: '184', category: 'Language', gradeBand: '9-10', theoryMarks: 80, internalMarks: 20, isCompulsory: true, board: 'CBSE' },
    { name: 'Hindi Course-A', code: '002', category: 'Language', gradeBand: '9-10', theoryMarks: 80, internalMarks: 20, isCompulsory: true, board: 'CBSE' },
    { name: 'Mathematics Standard', code: '041', category: 'Core', gradeBand: '9-10', theoryMarks: 80, internalMarks: 20, isCompulsory: true, board: 'CBSE' },
    { name: 'Mathematics Basic', code: '241', category: 'Core', gradeBand: '9-10', theoryMarks: 80, internalMarks: 20, isCompulsory: false, board: 'CBSE' },
    { name: 'Science (Physics/Chem/Bio Lab)', code: '086', category: 'Core', gradeBand: '9-10', theoryMarks: 80, internalMarks: 20, isCompulsory: true, board: 'CBSE' },
    { name: 'Social Science (Hist/Geo/Pol/Eco)', code: '087', category: 'Core', gradeBand: '9-10', theoryMarks: 80, internalMarks: 20, isCompulsory: true, board: 'CBSE' },
    { name: 'Information Technology (Skill 402)', code: '402', category: 'Skill', gradeBand: '9-10', theoryMarks: 50, internalMarks: 50, isCompulsory: false, board: 'CBSE' },
    { name: 'Artificial Intelligence (Skill 417)', code: '417', category: 'Skill', gradeBand: '9-10', theoryMarks: 50, internalMarks: 50, isCompulsory: false, board: 'CBSE' },
    { name: 'Retail (Skill 401)', code: '401', category: 'Skill', gradeBand: '9-10', theoryMarks: 50, internalMarks: 50, isCompulsory: false, board: 'CBSE' },
    { name: 'Home Science (Skill 413)', code: '413', category: 'Skill', gradeBand: '9-10', theoryMarks: 70, internalMarks: 30, isCompulsory: false, board: 'CBSE' },
    // Senior Secondary Stage (11 & 12 Streams)
    { name: 'English Core', code: '301', category: 'Language', gradeBand: '11-12', theoryMarks: 80, internalMarks: 20, isCompulsory: true, board: 'CBSE' },
    { name: 'Physics (Theory + Practical Lab)', code: '042', category: 'Elective', gradeBand: '11-12', theoryMarks: 70, internalMarks: 30, isCompulsory: false, board: 'CBSE' },
    { name: 'Chemistry (Theory + Practical Lab)', code: '043', category: 'Elective', gradeBand: '11-12', theoryMarks: 70, internalMarks: 30, isCompulsory: false, board: 'CBSE' },
    { name: 'Mathematics (Advanced Core)', code: '041', category: 'Elective', gradeBand: '11-12', theoryMarks: 80, internalMarks: 20, isCompulsory: false, board: 'CBSE' },
    { name: 'Biology (Theory + Practical Lab)', code: '044', category: 'Elective', gradeBand: '11-12', theoryMarks: 70, internalMarks: 30, isCompulsory: false, board: 'CBSE' },
    { name: 'Computer Science (Python Lab)', code: '083', category: 'Elective', gradeBand: '11-12', theoryMarks: 70, internalMarks: 30, isCompulsory: false, board: 'CBSE' },
    { name: 'Accountancy', code: '055', category: 'Elective', gradeBand: '11-12', theoryMarks: 80, internalMarks: 20, isCompulsory: false, board: 'CBSE' },
    { name: 'Business Studies', code: '054', category: 'Elective', gradeBand: '11-12', theoryMarks: 80, internalMarks: 20, isCompulsory: false, board: 'CBSE' },
    { name: 'Economics', code: '030', category: 'Elective', gradeBand: '11-12', theoryMarks: 80, internalMarks: 20, isCompulsory: false, board: 'CBSE' },
    { name: 'Applied Mathematics', code: '241', category: 'Elective', gradeBand: '11-12', theoryMarks: 80, internalMarks: 20, isCompulsory: false, board: 'CBSE' },
    { name: 'Informatics Practices (IP)', code: '065', category: 'Elective', gradeBand: '11-12', theoryMarks: 70, internalMarks: 30, isCompulsory: false, board: 'CBSE' },
    { name: 'History', code: '027', category: 'Elective', gradeBand: '11-12', theoryMarks: 80, internalMarks: 20, isCompulsory: false, board: 'CBSE' },
    { name: 'Political Science', code: '028', category: 'Elective', gradeBand: '11-12', theoryMarks: 80, internalMarks: 20, isCompulsory: false, board: 'CBSE' },
    { name: 'Geography (Theory + Lab)', code: '029', category: 'Elective', gradeBand: '11-12', theoryMarks: 70, internalMarks: 30, isCompulsory: false, board: 'CBSE' },
    { name: 'Physical & Health Education', code: '048', category: 'Co-Scholastic', gradeBand: '11-12', theoryMarks: 70, internalMarks: 30, isCompulsory: true, board: 'CBSE' }
  ],
  RBSE: [
    // RBSE Middle (6-8)
    { name: 'अनिवार्य हिंदी (Compulsory Hindi)', code: 'HIN-R6', category: 'Language', gradeBand: '6-8', theoryMarks: 80, internalMarks: 20, isCompulsory: true, board: 'RBSE' },
    { name: 'अनिवार्य अंग्रेजी (Compulsory English)', code: 'ENG-R6', category: 'Language', gradeBand: '6-8', theoryMarks: 80, internalMarks: 20, isCompulsory: true, board: 'RBSE' },
    { name: 'तृतीय भाषा - संस्कृत / उर्दू (Sanskrit/Urdu)', code: 'SKT-R6', category: 'Language', gradeBand: '6-8', theoryMarks: 80, internalMarks: 20, isCompulsory: false, board: 'RBSE' },
    { name: 'गणित (Mathematics)', code: 'MTH-R6', category: 'Core', gradeBand: '6-8', theoryMarks: 80, internalMarks: 20, isCompulsory: true, board: 'RBSE' },
    { name: 'विज्ञान (General Science)', code: 'SCI-R6', category: 'Core', gradeBand: '6-8', theoryMarks: 80, internalMarks: 20, isCompulsory: true, board: 'RBSE' },
    { name: 'सामाजिक विज्ञान (Social Science)', code: 'SST-R6', category: 'Core', gradeBand: '6-8', theoryMarks: 80, internalMarks: 20, isCompulsory: true, board: 'RBSE' },
    { name: 'कार्यानुभव एवं कला (Work Experience)', code: 'WE-R6', category: 'Co-Scholastic', gradeBand: '6-8', theoryMarks: 0, internalMarks: 100, isCompulsory: true, board: 'RBSE' },
    // RBSE Secondary (9 & 10)
    { name: 'अनिवार्य हिंदी (01)', code: 'RBSE-01', category: 'Language', gradeBand: '9-10', theoryMarks: 80, internalMarks: 20, isCompulsory: true, board: 'RBSE' },
    { name: 'अनिवार्य अंग्रेजी (02)', code: 'RBSE-02', category: 'Language', gradeBand: '9-10', theoryMarks: 80, internalMarks: 20, isCompulsory: true, board: 'RBSE' },
    { name: 'गणित (09)', code: 'RBSE-09', category: 'Core', gradeBand: '9-10', theoryMarks: 80, internalMarks: 20, isCompulsory: true, board: 'RBSE' },
    { name: 'विज्ञान (07)', code: 'RBSE-07', category: 'Core', gradeBand: '9-10', theoryMarks: 80, internalMarks: 20, isCompulsory: true, board: 'RBSE' },
    { name: 'सामाजिक विज्ञान (08)', code: 'RBSE-08', category: 'Core', gradeBand: '9-10', theoryMarks: 80, internalMarks: 20, isCompulsory: true, board: 'RBSE' },
    { name: 'तृतीय भाषा संस्कृत (71) / उर्दू (72)', code: 'RBSE-71', category: 'Language', gradeBand: '9-10', theoryMarks: 80, internalMarks: 20, isCompulsory: false, board: 'RBSE' },
    { name: 'सूचना प्रौद्योगिकी (IT Vocational)', code: 'RBSE-IT', category: 'Skill', gradeBand: '9-10', theoryMarks: 50, internalMarks: 50, isCompulsory: false, board: 'RBSE' },
    // RBSE Senior Secondary (11 & 12)
    { name: 'अनिवार्य हिंदी (01)', code: 'RBSE-101', category: 'Language', gradeBand: '11-12', theoryMarks: 80, internalMarks: 20, isCompulsory: true, board: 'RBSE' },
    { name: 'अनिवार्य अंग्रेजी (02)', code: 'RBSE-102', category: 'Language', gradeBand: '11-12', theoryMarks: 80, internalMarks: 20, isCompulsory: true, board: 'RBSE' },
    { name: 'भौतिक विज्ञान (Physics 40)', code: 'RBSE-40', category: 'Elective', gradeBand: '11-12', theoryMarks: 56, internalMarks: 44, isCompulsory: false, board: 'RBSE' },
    { name: 'रसायन विज्ञान (Chemistry 41)', code: 'RBSE-41', category: 'Elective', gradeBand: '11-12', theoryMarks: 56, internalMarks: 44, isCompulsory: false, board: 'RBSE' },
    { name: 'जीव विज्ञान (Biology 42)', code: 'RBSE-42', category: 'Elective', gradeBand: '11-12', theoryMarks: 56, internalMarks: 44, isCompulsory: false, board: 'RBSE' },
    { name: 'गणित (Mathematics 15)', code: 'RBSE-15', category: 'Elective', gradeBand: '11-12', theoryMarks: 80, internalMarks: 20, isCompulsory: false, board: 'RBSE' },
    { name: 'लेखाशास्त्र (Accountancy 30)', code: 'RBSE-30', category: 'Elective', gradeBand: '11-12', theoryMarks: 80, internalMarks: 20, isCompulsory: false, board: 'RBSE' },
    { name: 'व्यवसाय अध्ययन (Business Studies 31)', code: 'RBSE-31', category: 'Elective', gradeBand: '11-12', theoryMarks: 80, internalMarks: 20, isCompulsory: false, board: 'RBSE' },
    { name: 'इतिहास (History 03)', code: 'RBSE-03', category: 'Elective', gradeBand: '11-12', theoryMarks: 80, internalMarks: 20, isCompulsory: false, board: 'RBSE' },
    { name: 'राजनीति विज्ञान (Political Science 04)', code: 'RBSE-04', category: 'Elective', gradeBand: '11-12', theoryMarks: 80, internalMarks: 20, isCompulsory: false, board: 'RBSE' }
  ],
  ICSE: [
    { name: 'English Language (Paper 1)', code: 'ICSE-ENG1', category: 'Language', gradeBand: 'All', theoryMarks: 80, internalMarks: 20, isCompulsory: true, board: 'ICSE' },
    { name: 'English Literature (Paper 2)', code: 'ICSE-ENG2', category: 'Language', gradeBand: 'All', theoryMarks: 80, internalMarks: 20, isCompulsory: true, board: 'ICSE' },
    { name: 'Second Language (Hindi / Regional)', code: 'ICSE-HIN', category: 'Language', gradeBand: 'All', theoryMarks: 80, internalMarks: 20, isCompulsory: true, board: 'ICSE' },
    { name: 'History, Civics & Geography', code: 'ICSE-HCG', category: 'Core', gradeBand: '9-10', theoryMarks: 80, internalMarks: 20, isCompulsory: true, board: 'ICSE' },
    { name: 'Mathematics', code: 'ICSE-MTH', category: 'Core', gradeBand: '9-10', theoryMarks: 80, internalMarks: 20, isCompulsory: true, board: 'ICSE' },
    { name: 'Science (Physics, Chemistry, Biology)', code: 'ICSE-SCI', category: 'Core', gradeBand: '9-10', theoryMarks: 80, internalMarks: 20, isCompulsory: true, board: 'ICSE' },
    { name: 'Computer Applications', code: 'ICSE-CA', category: 'Skill', gradeBand: '9-10', theoryMarks: 50, internalMarks: 50, isCompulsory: false, board: 'ICSE' },
    { name: 'Commercial Applications / Economics', code: 'ICSE-COMM', category: 'Skill', gradeBand: '9-10', theoryMarks: 80, internalMarks: 20, isCompulsory: false, board: 'ICSE' }
  ]
};

export const DEFAULT_SENIOR_COMBINATIONS: StreamCombination[] = [
  {
    id: 'comb-sci-pcm',
    streamName: 'Science (PCM & Computer Science)',
    grade: 'Class 11',
    section: 'A',
    compulsoryLanguage: 'English Core (301)',
    coreSubjects: ['Physics (042)', 'Chemistry (043)', 'Mathematics (041)'],
    electiveSubject: 'Computer Science (Python 083)',
    additionalSubject: 'Physical Education (048)'
  },
  {
    id: 'comb-sci-pcb',
    streamName: 'Science (PCB Medical & Health)',
    grade: 'Class 11',
    section: 'B',
    compulsoryLanguage: 'English Core (301)',
    coreSubjects: ['Physics (042)', 'Chemistry (043)', 'Biology (044)'],
    electiveSubject: 'Physical Education (048)',
    additionalSubject: 'Psychology (037)'
  },
  {
    id: 'comb-comm-math',
    streamName: 'Commerce (With Applied Mathematics)',
    grade: 'Class 11',
    section: 'C',
    compulsoryLanguage: 'English Core (301)',
    coreSubjects: ['Accountancy (055)', 'Business Studies (054)', 'Economics (030)'],
    electiveSubject: 'Applied Mathematics (241)',
    additionalSubject: 'Informatics Practices (065)'
  },
  {
    id: 'comb-arts-hum',
    streamName: 'Humanities & Social Sciences',
    grade: 'Class 11',
    section: 'D',
    compulsoryLanguage: 'English Core (301)',
    coreSubjects: ['History (027)', 'Political Science (028)', 'Geography (029)'],
    electiveSubject: 'Economics (030)',
    additionalSubject: 'Fine Arts (049)'
  }
];

// ============================================================================
// 3. MAIN UPGRADED COMPONENT IMPLEMENTATION
// ============================================================================

interface SchoolOnboardingWizardProps {
  onShowToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
  onNavigateToErp?: () => void;
  organizationId?: string;
}

export const SchoolOnboardingWizard: React.FC<SchoolOnboardingWizardProps> = ({
  onShowToast,
  onNavigateToErp,
  organizationId = 'b17780e5-3832-4ac6-9aeb-33fd80c5cb0e'
}) => {
  // Multi-Tenant School Selector State
  const [availableOrgs, setAvailableOrgs] = useState<OrganizationRecord[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string>(() => {
    try {
      return organizationId || localStorage.getItem('dakshora_onboarding_org_id') || 'b17780e5-3832-4ac6-9aeb-33fd80c5cb0e';
    } catch {
      return organizationId || 'b17780e5-3832-4ac6-9aeb-33fd80c5cb0e';
    }
  });

  // Navigation & Step Control
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [onboarding, setOnboarding] = useState<SchoolOnboardingRecord | null>(null);
  const [checklist, setChecklist] = useState<OnboardingChecklist | null>(null);
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [isActivated, setIsActivated] = useState<boolean>(false);

  // --------------------------------------------------------------------------
  // STEP 1, 2, 3: Pre-filled Institutional Identity (Loaded from live tenant)
  // --------------------------------------------------------------------------
  const [orgForm, setOrgForm] = useState({
    name: 'Dakshora Academy New Delhi',
    slug: 'dakshora-academy',
    plan: 'enterprise'
  });

  const [profileForm, setProfileForm] = useState({
    schoolName: 'Dakshora Academy, New Delhi',
    schoolCode: 'DKS-DEL-01',
    board: 'CBSE',
    schoolType: 'K-12 Day Cum Boarding',
    affiliationNo: 'CBSE-AFF-202601',
    udiseNumber: '06180104502',
    address: 'Institutional Area, Vasant Kunj',
    city: 'New Delhi',
    state: 'Delhi',
    pin: '110070',
    phone: '+91 11 2612 3456',
    email: 'principal@dakshoraacademy.edu.in',
    website: 'https://dakshoraacademy.edu.in',
    principalName: 'Dr. Rajesh Sharma'
  });

  const [campusForm, setCampusForm] = useState({
    name: 'Dakshora Academy - Main Campus',
    code: 'CAMPUS-01',
    address: 'Institutional Area, Vasant Kunj, New Delhi - 110070',
    city: 'New Delhi',
    state: 'Delhi',
    pin: '110070',
    contactPhone: '+91 11 2612 3456',
    contactEmail: 'main.campus@dakshoraacademy.edu.in',
    principalName: 'Dr. Rajesh Sharma',
    capacity: 2500,
    isMain: true
  });

  // --------------------------------------------------------------------------
  // STEP 4: Academic Session Window
  // --------------------------------------------------------------------------
  const [sessionForm, setSessionForm] = useState({
    name: '2026-27',
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    status: 'active',
    isCurrent: true
  });

  // --------------------------------------------------------------------------
  // STEP 5: Classes, Sections & Classrooms (NEP 5+3+3+4 + Custom + Excel Upload)
  // --------------------------------------------------------------------------
  const [classesList, setClassesList] = useState<ClassroomItem[]>([
    { grade: 'Nursery', section: 'A', roomNumber: 'Room 101', capacity: 30, classTeacher: 'Anita Sharma' },
    { grade: 'LKG', section: 'A', roomNumber: 'Room 102', capacity: 30, classTeacher: 'Pooja Verma' },
    { grade: 'UKG', section: 'A', roomNumber: 'Room 103', capacity: 30, classTeacher: 'Sunita Mehra' },
    { grade: 'Class 1', section: 'A', roomNumber: 'Room 201', capacity: 40, classTeacher: 'Kavita Joshi' },
    { grade: 'Class 2', section: 'A', roomNumber: 'Room 202', capacity: 40, classTeacher: 'Manju Rani' },
    { grade: 'Class 3', section: 'A', roomNumber: 'Room 203', capacity: 40, classTeacher: 'Deepak Kumar' },
    { grade: 'Class 4', section: 'A', roomNumber: 'Room 204', capacity: 40, classTeacher: 'Rekha Gupta' },
    { grade: 'Class 5', section: 'A', roomNumber: 'Room 205', capacity: 40, classTeacher: 'Neha Tyagi' },
    { grade: 'Class 6', section: 'A', roomNumber: 'Room 301', capacity: 40, classTeacher: 'Dr. Alok Nath' },
    { grade: 'Class 7', section: 'A', roomNumber: 'Room 302', capacity: 40, classTeacher: 'Vandana Sen' },
    { grade: 'Class 8', section: 'A', roomNumber: 'Room 303', capacity: 40, classTeacher: 'Praveen Yadav' },
    { grade: 'Class 9', section: 'A', roomNumber: 'Room 401', capacity: 40, classTeacher: 'Rajeev Malhotra' },
    { grade: 'Class 9', section: 'B', roomNumber: 'Room 402', capacity: 40, classTeacher: 'Geeta Mathur' },
    { grade: 'Class 10', section: 'A', roomNumber: 'Room 403', capacity: 40, classTeacher: 'Suresh Menon' },
    { grade: 'Class 10', section: 'B', roomNumber: 'Room 404', capacity: 40, classTeacher: 'Arun Singh' },
    { grade: 'Class 11 Science', section: 'A', roomNumber: 'Lab 1', capacity: 35, classTeacher: 'Dr. V. K. Rao' },
    { grade: 'Class 11 Commerce', section: 'A', roomNumber: 'Room 501', capacity: 35, classTeacher: 'Anuradha Paul' },
    { grade: 'Class 12 Science', section: 'A', roomNumber: 'Lab 2', capacity: 35, classTeacher: 'Dr. R. K. Saxena' },
    { grade: 'Class 12 Commerce', section: 'A', roomNumber: 'Room 502', capacity: 35, classTeacher: 'Harish Bajaj' }
  ]);
  const [selectedSections, setSelectedSections] = useState<string[]>(['A', 'B']);
  const [customGrade, setCustomGrade] = useState('');
  const [customSection, setCustomSection] = useState('A');
  const [customRoomNumber, setCustomRoomNumber] = useState('');
  const [customCapacity, setCustomCapacity] = useState<number>(40);
  const [customTeacher, setCustomTeacher] = useState('');
  const [classSearch, setClassSearch] = useState('');

  // --------------------------------------------------------------------------
  // STEP 6: Subjects Catalog & Stream Combinations (CBSE/RBSE/ICSE)
  // --------------------------------------------------------------------------
  const [selectedBoard, setSelectedBoard] = useState<string>('CBSE');
  const [subjectsList, setSubjectsList] = useState<SubjectItem[]>(BOARD_CURATED_SUBJECTS.CBSE);
  const [streamCombinations, setStreamCombinations] = useState<StreamCombination[]>(DEFAULT_SENIOR_COMBINATIONS);
  const [activeSubjectBand, setActiveSubjectBand] = useState<'All' | '6-8' | '9-10' | '11-12'>('All');
  
  // Custom Subject Adder State
  const [customSubName, setCustomSubName] = useState('');
  const [customSubCode, setCustomSubCode] = useState('');
  const [customSubCat, setCustomSubCat] = useState<'Language' | 'Core' | 'Skill' | 'Elective' | 'Co-Scholastic'>('Core');
  const [customSubBand, setCustomSubBand] = useState('9-10');
  const [customTheory, setCustomTheory] = useState<number>(80);
  const [customInternal, setCustomInternal] = useState<number>(20);
  const [customCompulsory, setCustomCompulsory] = useState<boolean>(true);

  // Custom Stream Combination Adder State
  const [newCombStreamName, setNewCombStreamName] = useState('11th Science - Non-Medical');
  const [newCombGrade, setNewCombGrade] = useState('Class 11');
  const [newCombSection, setNewCombSection] = useState('A');
  const [newCombLanguage, setNewCombLanguage] = useState('English Core (301)');
  const [newCombCore1, setNewCombCore1] = useState('Physics (042)');
  const [newCombCore2, setNewCombCore2] = useState('Chemistry (043)');
  const [newCombCore3, setNewCombCore3] = useState('Mathematics (041)');
  const [newCombElective, setNewCombElective] = useState('Computer Science (Python 083)');
  const [newCombAdditional, setNewCombAdditional] = useState('Physical Education (048)');

  // --------------------------------------------------------------------------
  // STEP 7: Faculty & Staff Directory (Bulk CSV / Excel Upload)
  // --------------------------------------------------------------------------
  const [staffList, setStaffList] = useState<StaffItem[]>([
    { staffName: 'Dr. Rajesh Sharma', email: 'rajesh.sharma@dakshoraacademy.edu.in', mobileNo: '+91 98100 12345', empId: 'FAC-001', role: 'Teacher', department: 'Science', designation: 'PGT Physics & Vice-Principal' },
    { staffName: 'Sunita Kapoor', email: 'sunita.kapoor@dakshoraacademy.edu.in', mobileNo: '+91 98200 23456', empId: 'FAC-002', role: 'Teacher', department: 'Languages', designation: 'TGT English' },
    { staffName: 'Dr. V. K. Rao', email: 'vk.rao@dakshoraacademy.edu.in', mobileNo: '+91 98300 34567', empId: 'FAC-003', role: 'Teacher', department: 'Mathematics', designation: 'PGT Mathematics' },
    { staffName: 'Amitabh Sen', email: 'accounts@dakshoraacademy.edu.in', mobileNo: '+91 98400 45678', empId: 'ACC-001', role: 'Cashier', department: 'Finance & Accounts', designation: 'Chief Bursar' },
    { staffName: 'Anita Sharma', email: 'anita.sharma@dakshoraacademy.edu.in', mobileNo: '+91 98500 56789', empId: 'FAC-004', role: 'Teacher', department: 'Foundational', designation: 'PRT Coordinator' }
  ]);
  const [newStaff, setNewStaff] = useState<StaffItem>({
    staffName: '',
    email: '',
    mobileNo: '',
    empId: '',
    role: 'Teacher',
    department: 'Academic Faculty',
    designation: 'Senior Faculty'
  });
  const [staffSearch, setStaffSearch] = useState('');

  // --------------------------------------------------------------------------
  // STEP 8: Student Enrollment & Roster (Bulk CSV / Excel Upload)
  // --------------------------------------------------------------------------
  const [studentsList, setStudentsList] = useState<StudentItem[]>([
    { studentName: 'Aarav Sharma', grade: 'Class 10', section: 'A', rollNo: '101', admissionNo: 'ADM-2026-001', parentName: 'Vikram Sharma', parentPhone: '+91 98111 22334', parentEmail: 'vikram.sharma@gmail.com' },
    { studentName: 'Diya Patel', grade: 'Class 10', section: 'A', rollNo: '102', admissionNo: 'ADM-2026-002', parentName: 'Sanjay Patel', parentPhone: '+91 98222 33445', parentEmail: 'sanjay.patel@gmail.com' },
    { studentName: 'Rohan Gupta', grade: 'Class 9', section: 'B', rollNo: '103', admissionNo: 'ADM-2026-003', parentName: 'Manoj Gupta', parentPhone: '+91 98333 44556', parentEmail: 'manoj.gupta@gmail.com' },
    { studentName: 'Ananya Verma', grade: 'Class 11 Science', section: 'A', rollNo: '104', admissionNo: 'ADM-2026-004', parentName: 'Alok Verma', parentPhone: '+91 98444 55667', parentEmail: 'alok.verma@gmail.com' },
    { studentName: 'Kabir Singh', grade: 'Class 6', section: 'A', rollNo: '105', admissionNo: 'ADM-2026-005', parentName: 'Devendra Singh', parentPhone: '+91 98555 66778', parentEmail: 'devendra.singh@gmail.com' }
  ]);
  const [newStudent, setNewStudent] = useState<StudentItem>({
    studentName: '',
    grade: 'Class 10',
    section: 'A',
    rollNo: '',
    admissionNo: '',
    parentName: '',
    parentPhone: '',
    parentEmail: ''
  });
  const [studentSearch, setStudentSearch] = useState('');

  // --------------------------------------------------------------------------
  // STEP 9: School Fee Heads (Fully Admin-Configurable)
  // --------------------------------------------------------------------------
  const [feeStructures, setFeeStructures] = useState<FeeHeadItem[]>([
    { feeHead: 'Quarterly Tuition Fee', amountInr: 18500, frequency: 'quarterly', applicableClasses: 'All Classes', dueDay: 10 },
    { feeHead: 'Annual Development & STEM Charges', amountInr: 8000, frequency: 'annual', applicableClasses: 'Class 1 to 12', dueDay: 15 },
    { feeHead: 'Examination & Assessment Fee', amountInr: 2500, frequency: 'annual', applicableClasses: 'Class 6 to 12', dueDay: 10 },
    { feeHead: 'Admission & Registration Charges', amountInr: 5000, frequency: 'one_time', applicableClasses: 'New Admissions', dueDay: 1 },
    { feeHead: 'Transport & Fleet Service Fee', amountInr: 3000, frequency: 'monthly', applicableClasses: 'Bus Commuters', dueDay: 10 },
    { feeHead: 'Sports, Yoga & Activity Fee', amountInr: 1500, frequency: 'annual', applicableClasses: 'All Classes', dueDay: 15 }
  ]);
  const [newFeeHead, setNewFeeHead] = useState<FeeHeadItem>({
    feeHead: '',
    amountInr: 2000,
    frequency: 'quarterly',
    applicableClasses: 'All Classes',
    dueDay: 10
  });

  // --------------------------------------------------------------------------
  // STEPS 10-15: Operational Policies & Advanced Modules
  // --------------------------------------------------------------------------
  const [examForm, setExamForm] = useState({
    gradingSystem: 'cbse_9point',
    passPercentage: 33.0,
    maxMarksDefault: 100,
    reportCardFormat: 'hpc_cbse'
  });

  const [commForm, setCommForm] = useState({
    inApp: true,
    email: true,
    sms: true,
    whatsapp: true,
    autoAdmission: true,
    autoFeeReminders: true,
    autoAttendanceAlerts: true
  });

  const [transportSkipped, setTransportSkipped] = useState<boolean>(false);
  const [librarySkipped, setLibrarySkipped] = useState<boolean>(false);
  const [hrSkipped, setHrSkipped] = useState<boolean>(false);

  const [aiForm, setAiForm] = useState({
    aiEnabled: true,
    monthlyQuota: 5000,
    allowedRoles: ['admin', 'teacher', 'account', 'reception', 'parent', 'student'],
    contentSafetyFilter: 'strict'
  });

  // ============================================================================
  // 4. AUTOMATIC INSTITUTIONAL DATA PRE-FILLING & ACTIVE SCHOOL SWITCHER
  // ============================================================================
  const populateWizardWithOrgData = (targetOrg: any, draftData?: any) => {
    if (!targetOrg && !draftData) return;
    const name = draftData?.schoolName || targetOrg?.name || 'Dakshora Academy New Delhi';
    const code = draftData?.instituteCode || targetOrg?.instituteCode || targetOrg?.institute_code || targetOrg?.schoolCode || targetOrg?.school_code || targetOrg?.tenant_code || draftData?.tenantCode || '10001';
    const slug = draftData?.slug || targetOrg?.slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const plan = draftData?.plan || targetOrg?.plan || 'growth';
    const board = draftData?.board || targetOrg?.board || 'CBSE';
    const affiliationNo = draftData?.affiliationNo || targetOrg?.affiliationNo || targetOrg?.affiliation_no || (code ? `CBSE-AFF-${code}` : 'CBSE-AFF-202601');
    const principalName = draftData?.principalName || targetOrg?.principal_name || targetOrg?.principalName || 'Dr. Rajesh Sharma';
    const email = draftData?.email || targetOrg?.contact_email || targetOrg?.email || '';
    const phone = draftData?.phone || targetOrg?.contact_phone || targetOrg?.phone || '';
    const city = draftData?.city || targetOrg?.city || 'New Delhi';
    const state = draftData?.state || targetOrg?.state || 'Delhi';
    const address = draftData?.address || targetOrg?.address || (city ? `${city}, ${state}` : 'Institutional Area, Vasant Kunj');

    setOrgForm({ name, slug, plan });
    setProfileForm(prev => ({
      ...prev,
      schoolName: name,
      schoolCode: code,
      board,
      affiliationNo,
      principalName,
      email,
      phone,
      city,
      state,
      address
    }));
    setCampusForm(prev => ({
      ...prev,
      name: `${name} - Main Campus`,
      code: `CAMPUS-${code}`,
      address,
      city,
      state,
      contactEmail: email,
      contactPhone: phone,
      principalName
    }));

    if (draftData?.classes && Array.isArray(draftData.classes) && draftData.classes.length > 0) {
      setClassesList(draftData.classes);
    }
    if (draftData?.subjects && Array.isArray(draftData.subjects) && draftData.subjects.length > 0) {
      setSubjectsList(draftData.subjects);
    }
    if (draftData?.streamCombinations && Array.isArray(draftData.streamCombinations)) {
      setStreamCombinations(draftData.streamCombinations);
    }
    if (draftData?.staff && Array.isArray(draftData.staff) && draftData.staff.length > 0) {
      setStaffList(draftData.staff);
    } else if (targetOrg?.id && targetOrg.id !== 'b17780e5-3832-4ac6-9aeb-33fd80c5cb0e') {
      setStaffList([]);
    }
    if (draftData?.students && Array.isArray(draftData.students) && draftData.students.length > 0) {
      setStudentsList(draftData.students);
    } else if (targetOrg?.id && targetOrg.id !== 'b17780e5-3832-4ac6-9aeb-33fd80c5cb0e') {
      setStudentsList([]);
    }
    if (draftData?.feeStructures && Array.isArray(draftData.feeStructures) && draftData.feeStructures.length > 0) {
      setFeeStructures(draftData.feeStructures);
    }
  };

  useEffect(() => {
    const initOrgsAndWizard = async () => {
      let orgsList: OrganizationRecord[] = [];
      try {
        const res = await fetchOrganizations();
        if (res.data?.success && Array.isArray(res.data.organizations)) {
          orgsList = res.data.organizations;
          setAvailableOrgs(orgsList);
        }
      } catch (err: any) {
        console.warn('Failed to load organizations for wizard:', err);
      }

      // Determine active target organization
      const targetId = organizationId || activeOrgId;
      let matchedOrg = orgsList.find(o => o.id === targetId);

      // Check stored selection or brand in localStorage
      if (!matchedOrg) {
        try {
          const storedSelected = localStorage.getItem('dakshora_selected_school_wizard');
          if (storedSelected) matchedOrg = JSON.parse(storedSelected);
          if (!matchedOrg) {
            const savedBrand = localStorage.getItem('dakshora_school_brand');
            if (savedBrand) matchedOrg = JSON.parse(savedBrand);
          }
        } catch {}
      }

      if (matchedOrg) {
        populateWizardWithOrgData(matchedOrg);
      }

      loadStatus(targetId, matchedOrg);
    };

    initOrgsAndWizard();
  }, [organizationId]);

  const loadStatus = async (targetOrgId?: string, matchedOrgFallback?: any) => {
    const idToFetch = targetOrgId || activeOrgId || organizationId;
    setLoading(true);
    try {
      const res = await fetchOnboardingStatus(idToFetch);
      if (res.data?.success) {
        setOnboarding(res.data.onboarding);
        setChecklist(res.data.checklist);
        setProgressPercentage(res.data.progressPercentage || 0);
        if (res.data.onboarding.current_step) {
          setCurrentStep(res.data.onboarding.current_step);
        }
        if (res.data.onboarding.status === 'active') {
          setIsActivated(true);
        }

        // Intelligently populate forms with draft data returned by backend
        const draft = res.data.onboarding.draft_data || res.data.onboarding.data;
        if (draft) {
          populateWizardWithOrgData(matchedOrgFallback, draft);
        }
      }
    } catch (err: any) {
      console.warn('Onboarding status fetch warning:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchSchool = (newOrgId: string) => {
    setActiveOrgId(newOrgId);
    try {
      localStorage.setItem('dakshora_onboarding_org_id', newOrgId);
      localStorage.setItem('dakshora_active_org_id', newOrgId);
    } catch {}

    const selected = availableOrgs.find(o => o.id === newOrgId);
    if (selected) {
      populateWizardWithOrgData(selected);
      try {
        localStorage.setItem('dakshora_selected_school_wizard', JSON.stringify(selected));
        localStorage.setItem('dakshora_school_brand', JSON.stringify({
          id: selected.id,
          organization_id: selected.id,
          schoolName: selected.name,
          shortName: (selected.name || '').split(' ')[0] || 'DAKSHORA',
          board: (selected as any).board || 'CBSE',
          schoolCode: (selected as any).instituteCode || (selected as any).schoolCode || (selected as any).tenant_code || '10001',
          principalName: (selected as any).principal_name || (selected as any).principalName || 'Principal',
          contactEmail: (selected as any).contact_email || (selected as any).email || '',
          contactPhone: (selected as any).contact_phone || (selected as any).phone || '',
          address: (selected as any).address || ''
        }));
      } catch {}
      loadStatus(newOrgId, selected);
      onShowToast(
        'info',
        'Loaded School Tenant Profile 🏫',
        `Setup Wizard basic organization pre-filled for '${selected.name}'.`
      );
    }
  };

  // ============================================================================
  // 5. EXCEL & CSV TEMPLATE GENERATOR & BULK PARSERS
  // ============================================================================

  const downloadExcelTemplate = (type: 'classes' | 'staff' | 'students' | 'subjects') => {
    let data: any[] = [];
    let filename = '';

    if (type === 'classes') {
      filename = 'Dakshora_Classes_Sections_Template.xlsx';
      data = [
        { Grade: 'Nursery', Section: 'A', RoomNumber: 'Room 101', Capacity: 30, ClassTeacher: 'Anita Sharma' },
        { Grade: 'Class 1', Section: 'A', RoomNumber: 'Room 201', Capacity: 40, ClassTeacher: 'Sunita Mehra' },
        { Grade: 'Class 6', Section: 'A', RoomNumber: 'Room 301', Capacity: 40, ClassTeacher: 'Dr. Alok Nath' },
        { Grade: 'Class 10', Section: 'A', RoomNumber: 'Room 401', Capacity: 40, ClassTeacher: 'Rajeev Malhotra' },
        { Grade: 'Class 11 Science', Section: 'A', RoomNumber: 'Lab 1', Capacity: 35, ClassTeacher: 'Dr. V. K. Rao' }
      ];
    } else if (type === 'staff') {
      filename = 'Dakshora_Staff_Faculty_Template.xlsx';
      data = [
        { staffName: 'Dr. Rajesh Sharma', email: 'rajesh.sharma@school.edu.in', mobileNo: '9810012345', empId: 'FAC-001', role: 'Teacher', department: 'Science', designation: 'PGT Physics' },
        { staffName: 'Sunita Kapoor', email: 'sunita.kapoor@school.edu.in', mobileNo: '9820023456', empId: 'FAC-002', role: 'Teacher', department: 'Languages', designation: 'TGT English' },
        { staffName: 'Amitabh Sen', email: 'accounts@school.edu.in', mobileNo: '9830034567', empId: 'ACC-001', role: 'Cashier', department: 'Finance & Accounts', designation: 'Chief Bursar' }
      ];
    } else if (type === 'students') {
      filename = 'Dakshora_Student_Enrollment_Template.xlsx';
      data = [
        { studentName: 'Aarav Sharma', grade: 'Class 10', section: 'A', rollNo: '101', admissionNo: 'ADM-2026-001', parentName: 'Vikram Sharma', parentPhone: '9811122334', parentEmail: 'vikram.sharma@gmail.com' },
        { studentName: 'Diya Patel', grade: 'Class 10', section: 'A', rollNo: '102', admissionNo: 'ADM-2026-002', parentName: 'Sanjay Patel', parentPhone: '9822233445', parentEmail: 'sanjay.patel@gmail.com' },
        { studentName: 'Rohan Gupta', grade: 'Class 9', section: 'B', rollNo: '103', admissionNo: 'ADM-2026-003', parentName: 'Manoj Gupta', parentPhone: '9833344556', parentEmail: 'manoj.gupta@gmail.com' }
      ];
    } else if (type === 'subjects') {
      filename = 'Dakshora_Subjects_Catalog_Template.xlsx';
      data = [
        { SubjectName: 'English Language & Literature', SubjectCode: '184', Category: 'Language', GradeBand: '9-10', TheoryMarks: 80, InternalMarks: 20, IsCompulsory: 'Yes' },
        { SubjectName: 'Mathematics Standard', SubjectCode: '041', Category: 'Core', GradeBand: '9-10', TheoryMarks: 80, InternalMarks: 20, IsCompulsory: 'Yes' },
        { SubjectName: 'Artificial Intelligence', SubjectCode: '417', Category: 'Skill', GradeBand: '9-10', TheoryMarks: 50, InternalMarks: 50, IsCompulsory: 'No' },
        { SubjectName: 'Physics', SubjectCode: '042', Category: 'Elective', GradeBand: '11-12', TheoryMarks: 70, InternalMarks: 30, IsCompulsory: 'No' }
      ];
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, filename);
    onShowToast('success', 'Excel Template Downloaded 📥', `${filename} saved to your device.`);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'classes' | 'staff' | 'students' | 'subjects') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!rows || rows.length === 0) {
          onShowToast('error', 'Empty File', 'Uploaded spreadsheet does not contain any data rows.');
          return;
        }

        const getRowVal = (r: any, ...keys: string[]): string => {
          for (const k of keys) {
            if (r[k] !== undefined && r[k] !== null && String(r[k]).trim() !== '') {
              return String(r[k]).trim();
            }
          }
          const rKeys = Object.keys(r);
          for (const k of keys) {
            const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            for (const rk of rKeys) {
              const cleanRk = rk.toLowerCase().replace(/[^a-z0-9]/g, '');
              if (cleanRk === cleanK) {
                if (r[rk] !== undefined && r[rk] !== null && String(r[rk]).trim() !== '') {
                  return String(r[rk]).trim();
                }
              }
            }
          }
          return '';
        };

        if (target === 'classes') {
          const parsed: ClassroomItem[] = rows.map((r, i) => ({
            grade: getRowVal(r, 'grade', 'class', 'standard', 'Grade', 'Class') || `Class ${i + 1}`,
            section: (getRowVal(r, 'section', 'sec', 'Section', 'Sec') || 'A').toUpperCase(),
            roomNumber: getRowVal(r, 'roomNumber', 'room', 'RoomNumber', 'Room') || `Room ${101 + i}`,
            capacity: Number(getRowVal(r, 'capacity', 'Capacity') || 40),
            classTeacher: getRowVal(r, 'classTeacher', 'teacher', 'ClassTeacher') || ''
          }));
          setClassesList(parsed);
          onShowToast('success', 'Classes Imported! 🏫', `Successfully loaded ${parsed.length} classrooms from spreadsheet.`);
        } else if (target === 'staff') {
          const parsed: StaffItem[] = rows.map((r, i) => {
            const staffName = getRowVal(r, 'staffName', 'name', 'staff_name', 'faculty_name', 'teacher_name', 'teacher', 'employee_name', 'Staff Name', 'Faculty Name', 'Teacher Name', 'Name') || `Staff Member ${i + 1}`;
            const email = getRowVal(r, 'email', 'email_address', 'mail', 'Email', 'Email Address', 'Official Email') || `${staffName.toLowerCase().replace(/[^a-z0-9]/g, '')}${i + 101}@school.edu.in`;
            const mobileNo = getRowVal(r, 'mobileNo', 'phone', 'mobile', 'contact', 'Mobile', 'Phone', 'Mobile No', 'Contact No', 'Phone Number', 'WhatsApp') || '';
            const empId = getRowVal(r, 'empId', 'employeeId', 'emp_code', 'employee_code', 'code', 'EMP ID', 'Employee ID', 'Emp Code', 'Code') || `EMP-${i + 101}`;
            const role = getRowVal(r, 'role', 'Role', 'user_role') || 'Teacher';
            const department = getRowVal(r, 'department', 'Department', 'dept') || 'Academic Faculty';
            const designation = getRowVal(r, 'designation', 'Designation', 'post', 'title') || 'Faculty';
            return {
              staffName,
              name: staffName,
              email,
              mobileNo,
              phone: mobileNo,
              empId,
              employeeId: empId,
              role,
              department,
              designation
            };
          });
          setStaffList(parsed);
          onShowToast('success', 'Staff Uploaded! 👨‍🏫', `Imported ${parsed.length} faculty and staff members.`);
        } else if (target === 'students') {
          const parsed: StudentItem[] = rows.map((r, i) => {
            const studentName = getRowVal(r, 'studentName', 'name', 'student_name', 'fullname', 'full_name', 'Student Name', 'Full Name', 'Name', 'Student', 'Candidate Name', 'Pupil Name') || `Student ${i + 1}`;
            const grade = getRowVal(r, 'grade', 'class', 'standard', 'std', 'Grade', 'Class', 'Standard') || 'Class 10';
            const section = (getRowVal(r, 'section', 'sec', 'division', 'Section', 'Sec') || 'A').toUpperCase();
            const rollNo = getRowVal(r, 'rollNo', 'roll_no', 'roll', 'Roll No', 'Roll Number', 'Roll') || `${101 + i}`;
            const admissionNo = getRowVal(r, 'admissionNo', 'admission_no', 'adm_no', 'admno', 'Admission No', 'Adm No', 'Admission Number', 'SR No', 'Reg No') || `ADM-2026-${i + 101}`;
            const parentName = getRowVal(r, 'parentName', 'father_name', 'parent_name', 'guardian_name', 'Parent Name', 'Father Name', 'Father\'s Name', 'Guardian') || 'Guardian';
            const parentPhone = getRowVal(r, 'parentPhone', 'phone', 'mobile', 'contact', 'Parent Phone', 'Mobile', 'Mobile No', 'Phone', 'Contact No', 'WhatsApp') || '';
            const parentEmail = getRowVal(r, 'parentEmail', 'email', 'Parent Email', 'Email') || '';
            return {
              studentName,
              name: studentName,
              grade,
              section,
              rollNo,
              admissionNo,
              parentName,
              parentPhone,
              phone: parentPhone,
              parentEmail
            };
          });
          setStudentsList(parsed);
          onShowToast('success', 'Students Roster Imported! 🎓', `Loaded ${parsed.length} enrolled students from spreadsheet.`);
        } else if (target === 'subjects') {
          const parsed: SubjectItem[] = rows.map((r, i) => ({
            name: r.SubjectName || r.name || `Subject ${i + 1}`,
            code: (r.SubjectCode || r.code || `SUB-${i + 101}`).toString(),
            category: (r.Category || r.category || 'Core') as any,
            gradeBand: (r.GradeBand || r.gradeBand || 'All').toString(),
            theoryMarks: Number(r.TheoryMarks || r.theoryMarks || 80),
            internalMarks: Number(r.InternalMarks || r.internalMarks || 20),
            isCompulsory: String(r.IsCompulsory || r.isCompulsory || 'Yes').toLowerCase() === 'yes',
            board: selectedBoard
          }));
          setSubjectsList(parsed);
          onShowToast('success', 'Subjects Catalog Updated! 📚', `Added ${parsed.length} subjects from spreadsheet.`);
        }
      } catch (err: any) {
        onShowToast('error', 'Spreadsheet Parse Error', err.message || 'Could not parse Excel/CSV file.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; // Reset input
  };

  // ============================================================================
  // 6. NEP STAGES SELECTION & SECTION MULTIPLIERS (STEP 5)
  // ============================================================================

  const handleApplyNepStage = (stageId: string) => {
    const stage = NEP_PEDAGOGICAL_STAGES.find(s => s.id === stageId);
    if (!stage) return;

    const generated: ClassroomItem[] = [];
    let roomNum = 101 + classesList.length;
    stage.grades.forEach(grade => {
      selectedSections.forEach(sec => {
        generated.push({
          grade,
          section: sec,
          roomNumber: `Room ${roomNum++}`,
          capacity: 40,
          classTeacher: ''
        });
      });
    });

    setClassesList(prev => [...prev, ...generated]);
    onShowToast('success', `NEP Stage Added: ${stage.name} 🎒`, `Added ${generated.length} classrooms (${stage.grades.join(', ')}) with sections (${selectedSections.join(', ')}).`);
  };

  const handleApplyFullK12AllStages = () => {
    const generated: ClassroomItem[] = [];
    let roomNum = 101;
    NEP_PEDAGOGICAL_STAGES.forEach(stage => {
      stage.grades.forEach(grade => {
        selectedSections.forEach(sec => {
          generated.push({
            grade,
            section: sec,
            roomNumber: `Room ${roomNum++}`,
            capacity: 40,
            classTeacher: ''
          });
        });
      });
    });
    setClassesList(generated);
    onShowToast('success', 'Full K-12 All 4 NEP Stages Applied! 🌟', `Constructed ${generated.length} classrooms covering Nursery to Class 12 with sections (${selectedSections.join(', ')}).`);
  };

  const handleToggleSection = (sec: string) => {
    if (selectedSections.includes(sec)) {
      if (selectedSections.length === 1) {
        onShowToast('info', 'Minimum 1 Section Required', 'School must have at least one active section.');
        return;
      }
      setSelectedSections(prev => prev.filter(s => s !== sec));
    } else {
      setSelectedSections(prev => [...prev, sec].sort());
    }
  };

  const handleAddCustomClassroom = () => {
    if (!customGrade.trim()) {
      onShowToast('error', 'Grade Required', 'Please enter or select a grade name (e.g. Class 11 Science, Playgroup).');
      return;
    }
    const sec = customSection.trim().toUpperCase() || 'A';
    const exists = classesList.some(
      c => c.grade.toLowerCase() === customGrade.trim().toLowerCase() && c.section.toUpperCase() === sec
    );
    if (exists) {
      onShowToast('error', 'Classroom Exists', `${customGrade} - Section ${sec} is already in directory.`);
      return;
    }
    const nextRoom = customRoomNumber.trim() || `Room ${classesList.length + 101}`;
    setClassesList(prev => [
      ...prev,
      {
        grade: customGrade.trim(),
        section: sec,
        roomNumber: nextRoom,
        capacity: customCapacity || 40,
        classTeacher: customTeacher.trim()
      }
    ]);
    onShowToast('success', 'Classroom Added ✅', `${customGrade} - Sec ${sec} (${nextRoom})`);
    setCustomGrade('');
    setCustomRoomNumber('');
    setCustomTeacher('');
  };

  // ============================================================================
  // 7. BOARD CURRICULUM & STREAM COMBINATIONS (STEP 6)
  // ============================================================================

  const handleBoardChange = (board: string) => {
    setSelectedBoard(board);
    if (BOARD_CURATED_SUBJECTS[board]) {
      setSubjectsList(BOARD_CURATED_SUBJECTS[board]);
      onShowToast('success', `${board} Board Standard Applied 🏛️`, `Loaded ${BOARD_CURATED_SUBJECTS[board].length} curriculum subjects aligned with ${board} norms.`);
    }
  };

  const handleAddCustomSubject = () => {
    if (!customSubName.trim()) {
      onShowToast('error', 'Subject Title Required', 'Please provide a valid subject name.');
      return;
    }
    const code = customSubCode.trim().toUpperCase() || `SUB-${customSubName.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase()}`;
    if (subjectsList.some(s => s.code.toUpperCase() === code)) {
      onShowToast('error', 'Duplicate Code', `Code ${code} is already registered.`);
      return;
    }
    const newSub: SubjectItem = {
      name: customSubName.trim(),
      code,
      category: customSubCat,
      gradeBand: customSubBand,
      theoryMarks: customTheory,
      internalMarks: customInternal,
      isCompulsory: customCompulsory,
      board: selectedBoard
    };
    setSubjectsList(prev => [newSub, ...prev]);
    onShowToast('success', 'Subject Added 📚', `${customSubName} (${code})`);
    setCustomSubName('');
    setCustomSubCode('');
  };

  const handleAddStreamCombination = () => {
    if (!newCombStreamName.trim()) {
      onShowToast('error', 'Stream Title Required', 'Please enter a stream name (e.g. 11th Science - Non Medical).');
      return;
    }
    const comb: StreamCombination = {
      id: `comb-${Date.now()}`,
      streamName: newCombStreamName.trim(),
      grade: newCombGrade,
      section: newCombSection,
      compulsoryLanguage: newCombLanguage,
      coreSubjects: [newCombCore1, newCombCore2, newCombCore3].filter(Boolean),
      electiveSubject: newCombElective,
      additionalSubject: newCombAdditional || undefined
    };
    setStreamCombinations(prev => [...prev, comb]);
    onShowToast('success', 'Stream Combination Saved 🔬', `${comb.streamName} configured for ${comb.grade} - Section ${comb.section}`);
  };

  // ============================================================================
  // 8. STEP SAVING & LIVE ACTIVATION
  // ============================================================================

  const handleSaveStep = async (stepNum: number) => {
    setSaving(true);
    try {
      let payload: any = {};
      switch (stepNum) {
        case 1: payload = orgForm; break;
        case 2: payload = profileForm; break;
        case 3: payload = campusForm; break;
        case 4: payload = sessionForm; break;
        case 5: payload = { classes: classesList }; break;
        case 6: payload = { subjects: subjectsList, streamCombinations }; break;
        case 7: payload = { staff: staffList }; break;
        case 8: payload = { students: studentsList }; break;
        case 9: payload = { feeStructures }; break;
        case 10: payload = examForm; break;
        case 11: payload = commForm; break;
        case 12: payload = { skipped: transportSkipped, enabled: !transportSkipped }; break;
        case 13: payload = { skipped: librarySkipped, enabled: !librarySkipped }; break;
        case 14: payload = { skipped: hrSkipped, enabled: !hrSkipped }; break;
        case 15: payload = aiForm; break;
        case 16: payload = { ready: true, activated: true }; break;
      }

      const targetOrg = activeOrgId || organizationId;
      const res = await saveOnboardingStep(stepNum, payload, targetOrg);
      if (res.data?.success) {
        onShowToast('success', `Step ${stepNum} Saved Successfully ✅`, 'Institutional configuration saved securely.');
        setOnboarding(res.data.onboarding);
        setChecklist(res.data.checklist);
        const nextStep = Math.min(16, stepNum + 1);
        setCurrentStep(nextStep);
        setProgressPercentage(Math.round(((res.data.onboarding.completed_steps.length) / 16) * 100));
      } else {
        onShowToast('error', 'Save Notice', res.data?.message || 'Could not save step');
      }
    } catch (err: any) {
      onShowToast('error', 'Network Notice', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const targetOrg = activeOrgId || organizationId;
      const res = await saveOnboardingDraft(currentStep, {
        orgForm,
        profileForm,
        campusForm,
        sessionForm,
        classesCount: classesList.length,
        subjectsCount: subjectsList.length,
        staffCount: staffList.length,
        studentsCount: studentsList.length
      }, targetOrg);
      if (res.data?.success) {
        onShowToast('success', 'Draft Saved Safely 💾', 'All setup progress preserved in database.');
      }
    } catch (err: any) {
      onShowToast('error', 'Draft Notice', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    setSaving(true);
    try {
      const targetOrg = activeOrgId || organizationId;
      const res = await activateSchoolErp(targetOrg);
      if (res.data?.success) {
        setIsActivated(true);
        setOnboarding(res.data.onboarding);
        setProgressPercentage(100);
        confetti({
          particleCount: 160,
          spread: 90,
          origin: { y: 0.6 }
        });
        onShowToast('success', '🎉 School ERP Activated Live!', `${profileForm.schoolName} is ready for production operations.`);
      } else {
        onShowToast('error', 'Activation Check', res.data?.message || 'Prerequisites not met');
      }
    } catch (err: any) {
      onShowToast('error', 'Activation Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // 9. 16 STEPS METADATA ROADMAP
  // ============================================================================

  const stepsMeta = [
    { num: 1, title: 'Organization Profile', icon: Building2, desc: 'Tenant legal name & multi-tenant boundary' },
    { num: 2, title: 'School Credentials', icon: GraduationCap, desc: 'CBSE / Board affiliation & UDISE' },
    { num: 3, title: 'Main Campus Setup', icon: MapPin, desc: 'Campus facilities & infrastructure' },
    { num: 4, title: 'Academic Session', icon: Calendar, desc: '2026-27 session & term structure' },
    { num: 5, title: 'Classes & Sections', icon: Layers, desc: 'NEP 5+3+3+4 stages & bulk upload' },
    { num: 6, title: 'Subjects Catalog', icon: BookOpen, desc: 'CBSE/RBSE/ICSE & Senior Streams' },
    { num: 7, title: 'Faculty & Staff', icon: Users, desc: 'Teachers directory & bulk upload' },
    { num: 8, title: 'Student Enrollment', icon: UserCheck, desc: 'Student roster & bulk upload' },
    { num: 9, title: 'School Fee Heads', icon: CreditCard, desc: 'Admin-configured fee ledger & heads' },
    { num: 10, title: 'Exam & Grading', icon: FileCheck, desc: 'CBSE 9-point & assessment scales' },
    { num: 11, title: 'Communication Gateways', icon: Bell, desc: 'In-App, SMS & WhatsApp notifications' },
    { num: 12, title: 'Transport Fleets', icon: Bus, desc: 'Bus routes & GPS tracking (Optional)', isOpt: true },
    { num: 13, title: 'Digital Library', icon: Library, desc: 'Books catalog & circulation (Optional)', isOpt: true },
    { num: 14, title: 'HR & Payroll', icon: DollarSign, desc: 'Staff leave & salary ledger (Optional)', isOpt: true },
    { num: 15, title: 'Dakshora AI Copilot', icon: Bot, desc: 'AI engine & student safety controls' },
    { num: 16, title: 'Verification & Go-Live', icon: Sparkles, desc: 'Production audit & 1-click launch' }
  ];

  // ============================================================================
  // 10. RENDER: MAIN ULTRA-CLEAN WHITE THEME DASHBOARD
  // ============================================================================

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* TOP HEADER CARD (CRISP WHITE BACKGROUND) */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-md relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  DAKSHORA 2.0 — SCHOOL ERP SAAS ONBOARDING WIZARD
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                  16-Step Enterprise Engine
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 font-medium">
                Complete multi-tenant setup: NEP 2020 Pedagogical Stages, Board Curriculums, Staff & Student Bulk Import, and Database-Backed Fee Ledger.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-indigo-600" />
              <span>Save Progress</span>
            </button>

            {onNavigateToErp && (
              <button
                type="button"
                onClick={onNavigateToErp}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Open School ERP →</span>
              </button>
            )}
          </div>
        </div>

        {/* ACTIVE ONBOARDED SCHOOL SELECTOR & AUTO-FILL STATUS BAR */}
        <div className="my-4 p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span className="text-slate-400 font-mono text-xs">Active Setup Tenant:</span>
            <span className="font-black text-white text-sm tracking-wide">
              {profileForm.schoolName}
            </span>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-black bg-amber-500 text-slate-950 shadow-xs flex items-center gap-1">
              <span>Code:</span>
              <span>{profileForm.schoolCode || '10001'}</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {profileForm.board}
            </span>
            <span className="text-emerald-400 font-mono text-[11px] font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Basic Org Data Auto-Filled</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-400 font-mono text-xs whitespace-nowrap">Switch School:</label>
            <select
              value={activeOrgId}
              onChange={(e) => handleSwitchSchool(e.target.value)}
              className="bg-slate-950 text-indigo-200 border border-indigo-500/40 rounded-xl px-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-indigo-400 cursor-pointer shadow-inner"
            >
              {availableOrgs.length > 0 ? (
                availableOrgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.instituteCode || (org as any).school_code || (org as any).tenant_code || '10001'})
                  </option>
                ))
              ) : (
                <option value={activeOrgId}>{profileForm.schoolName} ({profileForm.schoolCode || '10001'})</option>
              )}
            </select>
          </div>
        </div>

        {/* Progress Bar & Current Status */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-700">
            <span className="text-indigo-600 uppercase">Step {currentStep} of 16:</span>
            <span className="text-slate-900">{stepsMeta[currentStep - 1]?.title}</span>
          </div>

          <div className="flex items-center gap-3 min-w-[200px] sm:min-w-[280px]">
            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(6, progressPercentage)}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-indigo-700 shrink-0">
              {progressPercentage}% Completed
            </span>
          </div>
        </div>
      </div>

      {/* 🧭 TWO-COLUMN WORKSPACE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: 16 STEPS NAVIGATION ROADMAP (4 COLS) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm space-y-2">
            <div className="px-2 py-1 flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                Onboarding Steps
              </span>
              <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                {onboarding?.completed_steps?.length || 0} / 16 Done
              </span>
            </div>

            <div className="space-y-1.5 max-h-[620px] overflow-y-auto pr-1">
              {stepsMeta.map((s) => {
                const Icon = s.icon;
                const isCurrent = currentStep === s.num;
                const isDone = onboarding?.completed_steps?.includes(s.num);

                return (
                  <button
                    key={s.num}
                    onClick={() => setCurrentStep(s.num)}
                    className={`w-full text-left px-3 py-2.5 rounded-2xl text-xs font-sans flex items-center justify-between transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-md shadow-indigo-500/20 font-bold'
                        : isDone
                        ? 'bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200/80 font-medium'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isCurrent
                          ? 'bg-white/20 text-white'
                          : isDone
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.num}
                      </div>
                      <div className="truncate">
                        <div className="truncate text-xs">{s.title}</div>
                        <div className={`text-[10px] truncate ${isCurrent ? 'text-indigo-100' : 'text-slate-500'}`}>
                          {s.desc}
                        </div>
                      </div>
                    </div>
                    {isCurrent && <ChevronRight className="w-4 h-4 text-white shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Institutional Summary Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Live Campus Directory</span>
            </h4>
            <div className="space-y-2 text-xs font-mono text-slate-700 divide-y divide-slate-100">
              <div className="pt-1 flex justify-between">
                <span className="text-slate-500">School Name:</span>
                <span className="font-bold text-slate-900 text-right truncate max-w-[160px]">{profileForm.schoolName}</span>
              </div>
              <div className="pt-1 flex justify-between">
                <span className="text-slate-500">Board:</span>
                <span className="font-bold text-indigo-700">{profileForm.board}</span>
              </div>
              <div className="pt-1 flex justify-between">
                <span className="text-slate-500">Affiliation:</span>
                <span className="font-bold text-slate-800">{profileForm.affiliationNo}</span>
              </div>
              <div className="pt-1 flex justify-between">
                <span className="text-slate-500">Classrooms:</span>
                <span className="font-bold text-emerald-700">{classesList.length} Sections</span>
              </div>
              <div className="pt-1 flex justify-between">
                <span className="text-slate-500">Curriculum:</span>
                <span className="font-bold text-purple-700">{subjectsList.length} Subjects</span>
              </div>
              <div className="pt-1 flex justify-between">
                <span className="text-slate-500">Enrolled Students:</span>
                <span className="font-bold text-cyan-700">{studentsList.length} Students</span>
              </div>
              <div className="pt-1 flex justify-between">
                <span className="text-slate-500">Faculty & Staff:</span>
                <span className="font-bold text-amber-700">{staffList.length} Members</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE STEP DETAILS & FORMS (8 COLS, CRISP WHITE BACKGROUND) */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-md space-y-6">
          
          {/* STEP HEADER */}
          <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-mono font-bold text-indigo-700 uppercase tracking-wider">
                Step {currentStep} of 16
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {stepsMeta[currentStep - 1]?.title}
              </h2>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {stepsMeta[currentStep - 1]?.desc}
            </div>
          </div>

          {/* ================================================================== */}
          {/* STEP 1: ORGANIZATION BOUNDARY (PRE-FILLED) */}
          {/* ================================================================== */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-emerald-50 border border-indigo-200 text-xs text-indigo-950 leading-relaxed flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Tenant Organization Auto-Filled:</strong> Basic legal organization details for <strong>{orgForm.name}</strong> (Code: <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-indigo-300">{profileForm.schoolCode || '10001'}</code>) have been loaded automatically. No re-entry required!
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-mono font-bold border border-emerald-300 shrink-0">
                  ✓ Pre-filled
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Organization / Trust Name
                  </label>
                  <input
                    type="text"
                    value={orgForm.name}
                    onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Multi-Tenant URL Slug
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-2.5 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl text-xs font-mono text-slate-600">
                      dakshora.app/
                    </span>
                    <input
                      type="text"
                      value={orgForm.slug}
                      onChange={(e) => setOrgForm({ ...orgForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-r-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    SaaS Subscription Tier
                  </label>
                  <select
                    value={orgForm.plan}
                    onChange={(e) => setOrgForm({ ...orgForm, plan: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  >
                    <option value="enterprise">Enterprise (Unlimited Students, AI Copilot, All 13 Modules)</option>
                    <option value="growth">Growth (Up to 2,000 Students, Core ERP & Fees)</option>
                    <option value="starter">Starter (Up to 500 Students)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    PostgreSQL Database Schema
                  </label>
                  <div className="bg-slate-100 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 font-bold flex items-center justify-between">
                    <span>schema: tenant_{orgForm.slug.replace(/-/g, '_')}</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ● Partition Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* STEP 2: SCHOOL CREDENTIALS (PRE-FILLED) */}
          {/* ================================================================== */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200 text-xs text-emerald-950 leading-relaxed flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    <strong>School Profile Auto-Populated:</strong> School name, 5-digit code (<code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-300">{profileForm.schoolCode || '10001'}</code>), board affiliation, and principal contacts are populated from the active tenant record.
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-mono font-bold border border-emerald-300 shrink-0">
                  ✓ Verified
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Official School Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.schoolName}
                    onChange={(e) => setProfileForm({ ...profileForm, schoolName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    School Code / Branch Identifier
                  </label>
                  <input
                    type="text"
                    value={profileForm.schoolCode}
                    onChange={(e) => setProfileForm({ ...profileForm, schoolCode: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Education Board
                  </label>
                  <select
                    value={profileForm.board}
                    onChange={(e) => {
                      setProfileForm({ ...profileForm, board: e.target.value });
                      handleBoardChange(e.target.value);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  >
                    <option value="CBSE">CBSE (Central Board of Secondary Education)</option>
                    <option value="RBSE">RBSE (Rajasthan Board of Secondary Education)</option>
                    <option value="ICSE">ICSE / CISCE (Council for Indian School Certificate)</option>
                    <option value="State Board">State Secondary Education Board</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Board Affiliation Number
                  </label>
                  <input
                    type="text"
                    value={profileForm.affiliationNo}
                    onChange={(e) => setProfileForm({ ...profileForm, affiliationNo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-indigo-700 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    UDISE+ National Code
                  </label>
                  <input
                    type="text"
                    value={profileForm.udiseNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, udiseNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Principal / Head of Institution
                  </label>
                  <input
                    type="text"
                    value={profileForm.principalName}
                    onChange={(e) => setProfileForm({ ...profileForm, principalName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Institutional Email Address
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Primary Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Complete Campus Address (Street, City, State & PIN)
                  </label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* STEP 3: CAMPUS SETUP (PRE-FILLED) */}
          {/* ================================================================== */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Campus Facility Name
                  </label>
                  <input
                    type="text"
                    value={campusForm.name}
                    onChange={(e) => setCampusForm({ ...campusForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Campus Code
                  </label>
                  <input
                    type="text"
                    value={campusForm.code}
                    onChange={(e) => setCampusForm({ ...campusForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Student Capacity
                  </label>
                  <input
                    type="number"
                    value={campusForm.capacity}
                    onChange={(e) => setCampusForm({ ...campusForm, capacity: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-indigo-700 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Campus Principal In-Charge
                  </label>
                  <input
                    type="text"
                    value={campusForm.principalName}
                    onChange={(e) => setCampusForm({ ...campusForm, principalName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Campus Address
                  </label>
                  <input
                    type="text"
                    value={campusForm.address}
                    onChange={(e) => setCampusForm({ ...campusForm, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* STEP 4: ACADEMIC SESSION */}
          {/* ================================================================== */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Academic Session Title
                  </label>
                  <input
                    type="text"
                    value={sessionForm.name}
                    onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Current Status
                  </label>
                  <div className="bg-emerald-50 border border-emerald-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-emerald-800 flex items-center justify-between">
                    <span>ACTIVE PRODUCTION SESSION</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Session Start Date (Annual Academic Opening)
                  </label>
                  <input
                    type="date"
                    value={sessionForm.startDate}
                    onChange={(e) => setSessionForm({ ...sessionForm, startDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Session End Date (Academic Year Close)
                  </label>
                  <input
                    type="date"
                    value={sessionForm.endDate}
                    onChange={(e) => setSessionForm({ ...sessionForm, endDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* STEP 5: CLASSES & SECTIONS (NEP 5+3+3+4 + CUSTOM + EXCEL/CSV) */}
          {/* ================================================================== */}
          {currentStep === 5 && (
            <div className="space-y-6">
              {/* NEP 2020 Pedagogical Stages Quick Bundles */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>NEP 2020 Pedagogical Framework (5+3+3+4 Stages)</span>
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Select individual national curriculum stages or apply the complete K-12 bundle with active sections.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyFullK12AllStages}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-105 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Apply Complete K-12 (All 4 Stages)</span>
                  </button>
                </div>

                {/* Section Multiplier Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-700 font-mono">Multiply with Sections:</span>
                  {['A', 'B', 'C', 'D', 'E', 'F'].map(sec => {
                    const isSelected = selectedSections.includes(sec);
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => handleToggleSection(sec)}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                        }`}
                      >
                        Section {sec} {isSelected ? '✓' : '+'}
                      </button>
                    );
                  })}
                </div>

                {/* 4 NEP Stage Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {NEP_PEDAGOGICAL_STAGES.map(stage => (
                    <div
                      key={stage.id}
                      className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 shadow-xs transition-all space-y-2 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg">{stage.icon}</span>
                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold border border-indigo-200">
                            {stage.badge}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 mt-1">{stage.name}</h4>
                        <div className="text-[11px] font-mono text-indigo-700">{stage.hindiName}</div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{stage.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {stage.grades.map(g => (
                            <span key={g} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono font-semibold">
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplyNepStage(stage.id)}
                        className="w-full mt-2 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add {stage.name}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bulk Excel/CSV Upload & Custom Classroom Adder */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* A. Bulk Upload Card */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Excel / CSV Bulk Upload</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => downloadExcelTemplate('classes')}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer underline"
                    >
                      <Download className="w-3 h-3" /> Template
                    </button>
                  </div>
                  <p className="text-xs text-slate-600">
                    Upload an Excel (.xlsx, .xls) or CSV file with columns: <code>Grade, Section, RoomNumber, Capacity, ClassTeacher</code>.
                  </p>
                  <label className="p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors text-center">
                    <Upload className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800">Select Spreadsheet to Import</span>
                    <span className="text-[10px] text-slate-500">.xlsx, .xls, or .csv</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={(e) => handleExcelUpload(e, 'classes')}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* B. Custom Classroom Form */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <Plus className="w-4 h-4 text-indigo-600" />
                    <span>Add Custom Classroom</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Grade / Class</label>
                      <input
                        type="text"
                        value={customGrade}
                        onChange={(e) => setCustomGrade(e.target.value)}
                        placeholder="e.g. Class 11 Science"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Section</label>
                      <input
                        type="text"
                        value={customSection}
                        onChange={(e) => setCustomSection(e.target.value)}
                        placeholder="e.g. A"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Room No.</label>
                      <input
                        type="text"
                        value={customRoomNumber}
                        onChange={(e) => setCustomRoomNumber(e.target.value)}
                        placeholder="Room 101"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Capacity</label>
                      <input
                        type="number"
                        value={customCapacity}
                        onChange={(e) => setCustomCapacity(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomClassroom}
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Classroom Section
                  </button>
                </div>
              </div>

              {/* Active Classroom Directory Table */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
                      Configured Classrooms Directory ({classesList.length} Sections)
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                      <input
                        type="text"
                        value={classSearch}
                        onChange={(e) => setClassSearch(e.target.value)}
                        placeholder="Filter grade or room..."
                        className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setClassesList([])}
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-3">Grade / Class</th>
                        <th className="p-3">Section</th>
                        <th className="p-3">Room Allocated</th>
                        <th className="p-3">Capacity</th>
                        <th className="p-3">Class Teacher</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {classesList
                        .filter(c => !classSearch || c.grade.toLowerCase().includes(classSearch.toLowerCase()) || c.roomNumber.toLowerCase().includes(classSearch.toLowerCase()))
                        .map((c, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-900">{c.grade}</td>
                            <td className="p-3 font-bold text-indigo-700">Section {c.section}</td>
                            <td className="p-3 text-slate-700">{c.roomNumber}</td>
                            <td className="p-3 text-slate-600">{c.capacity || 40} Seats</td>
                            <td className="p-3 text-slate-600">{c.classTeacher || '—'}</td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => setClassesList(prev => prev.filter((_, idx) => idx !== i))}
                                className="text-rose-600 hover:text-rose-800 font-bold p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* STEP 6: SUBJECT CATALOG & STREAM COMBINATIONS (CBSE/RBSE/ICSE) */}
          {/* ================================================================== */}
          {currentStep === 6 && (
            <div className="space-y-6">
              {/* Board Selector Pills */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 font-mono uppercase">Curriculum Board:</span>
                  {['CBSE', 'RBSE', 'ICSE'].map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => handleBoardChange(b)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                        selectedBoard === b
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {b} Standards
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadExcelTemplate('subjects')}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3 h-3 text-indigo-600" />
                    <span>Download Excel Template</span>
                  </button>

                  <label className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs">
                    <Upload className="w-3 h-3" />
                    <span>Import Subjects</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={(e) => handleExcelUpload(e, 'subjects')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Band Specific Curriculums */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  {(['All', '6-8', '9-10', '11-12'] as const).map(band => (
                    <button
                      key={band}
                      type="button"
                      onClick={() => setActiveSubjectBand(band)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                        activeSubjectBand === band
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {band === 'All' ? 'All Subjects' : band === '6-8' ? 'Middle (Classes 6 to 8)' : band === '9-10' ? 'Secondary (Classes 9 & 10)' : 'Senior Secondary (11 & 12)'}
                    </button>
                  ))}
                </div>

                {/* Grade 11 & 12 Section-Wise Subject Combination Builder */}
                {activeSubjectBand === '11-12' && (
                  <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-purple-950 flex items-center gap-1.5">
                          <Sliders className="w-4 h-4 text-purple-700" />
                          <span>Senior Secondary Section-Wise Subject Combinations</span>
                        </h4>
                        <p className="text-xs text-purple-800 mt-0.5">
                          School Admin can configure custom streams per section (Language + 3 Core + Elective + Additional).
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Stream Name</label>
                        <input
                          type="text"
                          value={newCombStreamName}
                          onChange={(e) => setNewCombStreamName(e.target.value)}
                          placeholder="e.g. 11th Science - PCM"
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Grade</label>
                        <select
                          value={newCombGrade}
                          onChange={(e) => setNewCombGrade(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900"
                        >
                          <option value="Class 11">Class 11</option>
                          <option value="Class 12">Class 12</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Target Section</label>
                        <input
                          type="text"
                          value={newCombSection}
                          onChange={(e) => setNewCombSection(e.target.value.toUpperCase())}
                          placeholder="A"
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Compulsory Language</label>
                        <input
                          type="text"
                          value={newCombLanguage}
                          onChange={(e) => setNewCombLanguage(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Three Core Subjects</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          <input
                            type="text"
                            value={newCombCore1}
                            onChange={(e) => setNewCombCore1(e.target.value)}
                            className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900"
                            placeholder="Core 1"
                          />
                          <input
                            type="text"
                            value={newCombCore2}
                            onChange={(e) => setNewCombCore2(e.target.value)}
                            className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900"
                            placeholder="Core 2"
                          />
                          <input
                            type="text"
                            value={newCombCore3}
                            onChange={(e) => setNewCombCore3(e.target.value)}
                            className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900"
                            placeholder="Core 3"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">5th Elective Subject</label>
                        <input
                          type="text"
                          value={newCombElective}
                          onChange={(e) => setNewCombElective(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">6th Additional Subject</label>
                        <input
                          type="text"
                          value={newCombAdditional}
                          onChange={(e) => setNewCombAdditional(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={handleAddStreamCombination}
                          className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Save Section Combination
                        </button>
                      </div>
                    </div>

                    {/* Combinations List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {streamCombinations.map(comb => (
                        <div key={comb.id} className="p-3.5 rounded-xl bg-white border border-purple-200 shadow-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-purple-950">{comb.streamName}</span>
                            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold font-mono">
                              {comb.grade} - Sec {comb.section}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-700 space-y-0.5">
                            <div><strong className="text-slate-900">Language:</strong> {comb.compulsoryLanguage}</div>
                            <div><strong className="text-slate-900">3 Core:</strong> {comb.coreSubjects.join(', ')}</div>
                            <div><strong className="text-slate-900">Elective:</strong> {comb.electiveSubject} {comb.additionalSubject ? `• + ${comb.additionalSubject}` : ''}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subjects Table */}
                <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-3">Code</th>
                        <th className="p-3">Subject Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Grade Band</th>
                        <th className="p-3">Theory / IA</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {subjectsList
                        .filter(s => activeSubjectBand === 'All' || s.gradeBand === activeSubjectBand || s.gradeBand === 'All')
                        .map(s => (
                          <tr key={s.code} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-indigo-700">{s.code}</td>
                            <td className="p-3 font-bold text-slate-900">{s.name}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                s.category === 'Language'
                                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                  : s.category === 'Skill'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : s.category === 'Elective'
                                  ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                  : 'bg-slate-100 text-slate-800'
                              }`}>
                                {s.category}
                              </span>
                            </td>
                            <td className="p-3 text-slate-700">{s.gradeBand}</td>
                            <td className="p-3 text-slate-700 font-bold">{s.theoryMarks} Th + {s.internalMarks} IA</td>
                            <td className="p-3">
                              {s.isCompulsory ? (
                                <span className="text-emerald-700 font-bold text-[10px]">Compulsory</span>
                              ) : (
                                <span className="text-slate-500 text-[10px]">Elective/Skill</span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => setSubjectsList(prev => prev.filter(x => x.code !== s.code))}
                                className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* STEP 7: FACULTY & STAFF DIRECTORY (BULK EXCEL / CSV UPLOAD) */}
          {/* ================================================================== */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-1.5 font-mono">
                      <Users className="w-4 h-4 text-indigo-700" />
                      <span>Bulk Upload Faculty & Staff (Excel / CSV)</span>
                    </h3>
                    <p className="text-xs text-indigo-800 mt-0.5">
                      Required Columns: <code>staffName, email, mobileNo, empId, role, department, designation</code>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => downloadExcelTemplate('staff')}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Download Staff Template (.xlsx)</span>
                    </button>

                    <label className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-105 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Staff Excel/CSV</span>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => handleExcelUpload(e, 'staff')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Manual Staff Addition Accordion / Form */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1 font-mono">
                  <Plus className="w-3.5 h-3.5 text-indigo-600" /> Add Single Staff Member
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Staff Name</label>
                    <input
                      type="text"
                      value={newStaff.staffName}
                      onChange={(e) => setNewStaff({ ...newStaff, staffName: e.target.value })}
                      placeholder="e.g. Meenakshi Sundaram"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Email</label>
                    <input
                      type="email"
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                      placeholder="teacher@school.edu.in"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Mobile No.</label>
                    <input
                      type="tel"
                      value={newStaff.mobileNo}
                      onChange={(e) => setNewStaff({ ...newStaff, mobileNo: e.target.value })}
                      placeholder="+91 98100 12345"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Employee ID</label>
                    <input
                      type="text"
                      value={newStaff.empId}
                      onChange={(e) => setNewStaff({ ...newStaff, empId: e.target.value })}
                      placeholder="EMP-101"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Role</label>
                    <select
                      value={newStaff.role}
                      onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900"
                    >
                      <option value="Teacher">Teacher / Faculty</option>
                      <option value="Principal">Principal / Head</option>
                      <option value="Admin">Administrator</option>
                      <option value="Cashier">Cashier / Accountant</option>
                      <option value="Staff">Support Staff</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Department</label>
                    <input
                      type="text"
                      value={newStaff.department}
                      onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })}
                      placeholder="Science / Mathematics"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Designation</label>
                    <input
                      type="text"
                      value={newStaff.designation}
                      onChange={(e) => setNewStaff({ ...newStaff, designation: e.target.value })}
                      placeholder="PGT Physics"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (!newStaff.staffName.trim()) {
                          onShowToast('error', 'Name Required', 'Please enter staff name');
                          return;
                        }
                        setStaffList(prev => [...prev, { ...newStaff, empId: newStaff.empId || `EMP-${prev.length + 101}` }]);
                        setNewStaff({ staffName: '', email: '', mobileNo: '', empId: '', role: 'Teacher', department: 'Academic Faculty', designation: 'Faculty' });
                        onShowToast('success', 'Staff Added', `${newStaff.staffName}`);
                      }}
                      className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                    >
                      + Save Staff
                    </button>
                  </div>
                </div>
              </div>

              {/* Staff Directory Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
                    Staff Directory ({staffList.length} Members)
                  </h4>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                    <input
                      type="text"
                      value={staffSearch}
                      onChange={(e) => setStaffSearch(e.target.value)}
                      placeholder="Search staff..."
                      className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-3">Emp ID</th>
                        <th className="p-3">Staff Name</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Department</th>
                        <th className="p-3">Designation</th>
                        <th className="p-3">Contact</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {staffList
                        .filter(s => !staffSearch || s.staffName.toLowerCase().includes(staffSearch.toLowerCase()) || s.empId.toLowerCase().includes(staffSearch.toLowerCase()))
                        .map((s, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-indigo-700">{s.empId}</td>
                            <td className="p-3 font-bold text-slate-900">{s.staffName}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                {s.role}
                              </span>
                            </td>
                            <td className="p-3 text-slate-700">{s.department}</td>
                            <td className="p-3 text-slate-700">{s.designation}</td>
                            <td className="p-3 text-slate-600 text-[11px]">{s.mobileNo || s.email}</td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => setStaffList(prev => prev.filter((_, i) => i !== idx))}
                                className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* STEP 8: STUDENT ENROLLMENT & ROSTER (BULK EXCEL / CSV UPLOAD) */}
          {/* ================================================================== */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5 font-mono">
                      <UserCheck className="w-4 h-4 text-emerald-700" />
                      <span>Bulk Upload Enrolled Students (Excel / CSV)</span>
                    </h3>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Required Columns: <code>studentName, grade, section, rollNo, admissionNo, parentName, parentPhone, parentEmail</code>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => downloadExcelTemplate('students')}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Download Student Template (.xlsx)</span>
                    </button>

                    <label className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Student Excel/CSV</span>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => handleExcelUpload(e, 'students')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Single Student Manual Form */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1 font-mono">
                  <Plus className="w-3.5 h-3.5 text-emerald-600" /> Enroll Single Student
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Student Name</label>
                    <input
                      type="text"
                      value={newStudent.studentName}
                      onChange={(e) => setNewStudent({ ...newStudent, studentName: e.target.value })}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Grade / Class</label>
                    <input
                      type="text"
                      value={newStudent.grade}
                      onChange={(e) => setNewStudent({ ...newStudent, grade: e.target.value })}
                      placeholder="Class 10"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Section</label>
                    <input
                      type="text"
                      value={newStudent.section}
                      onChange={(e) => setNewStudent({ ...newStudent, section: e.target.value.toUpperCase() })}
                      placeholder="A"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Roll No.</label>
                    <input
                      type="text"
                      value={newStudent.rollNo}
                      onChange={(e) => setNewStudent({ ...newStudent, rollNo: e.target.value })}
                      placeholder="101"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Admission No.</label>
                    <input
                      type="text"
                      value={newStudent.admissionNo}
                      onChange={(e) => setNewStudent({ ...newStudent, admissionNo: e.target.value })}
                      placeholder="ADM-2026-101"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Parent Name</label>
                    <input
                      type="text"
                      value={newStudent.parentName}
                      onChange={(e) => setNewStudent({ ...newStudent, parentName: e.target.value })}
                      placeholder="Parent/Guardian"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Parent Mobile</label>
                    <input
                      type="tel"
                      value={newStudent.parentPhone}
                      onChange={(e) => setNewStudent({ ...newStudent, parentPhone: e.target.value })}
                      placeholder="+91 98111 22334"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (!newStudent.studentName.trim()) {
                          onShowToast('error', 'Student Name Required', 'Please enter student name.');
                          return;
                        }
                        setStudentsList(prev => [...prev, { ...newStudent, admissionNo: newStudent.admissionNo || `ADM-2026-${prev.length + 101}`, rollNo: newStudent.rollNo || `${prev.length + 101}` }]);
                        setNewStudent({ studentName: '', grade: 'Class 10', section: 'A', rollNo: '', admissionNo: '', parentName: '', parentPhone: '', parentEmail: '' });
                        onShowToast('success', 'Student Enrolled', `${newStudent.studentName}`);
                      }}
                      className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    >
                      + Enroll Student
                    </button>
                  </div>
                </div>
              </div>

              {/* Students Roster Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
                    Student Enrollment Roster ({studentsList.length} Students)
                  </h4>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Search student or adm no..."
                      className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-3">Adm No.</th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Class & Sec</th>
                        <th className="p-3">Roll No.</th>
                        <th className="p-3">Parent Name</th>
                        <th className="p-3">Parent Contact</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {studentsList
                        .filter(s => !studentSearch || s.studentName.toLowerCase().includes(studentSearch.toLowerCase()) || s.admissionNo.toLowerCase().includes(studentSearch.toLowerCase()))
                        .map((s, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-indigo-700">{s.admissionNo}</td>
                            <td className="p-3 font-bold text-slate-900">{s.studentName}</td>
                            <td className="p-3 text-slate-700">{s.grade} - {s.section}</td>
                            <td className="p-3 text-slate-600">{s.rollNo}</td>
                            <td className="p-3 text-slate-800 font-medium">{s.parentName}</td>
                            <td className="p-3 text-slate-600 text-[11px]">{s.parentPhone || s.parentEmail}</td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => setStudentsList(prev => prev.filter((_, i) => i !== idx))}
                                className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* STEP 9: SCHOOL FEE HEADS (ADMIN CONFIGURABLE) */}
          {/* ================================================================== */}
          {currentStep === 9 && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-indigo-600 shrink-0" />
                <span>
                  <strong>Configurable School Fee Engine:</strong> All fee heads, frequencies (Monthly, Quarterly, Annual, One-Time), amounts in INR, and due dates can be defined and customized by the School Admin.
                </span>
              </div>

              {/* Add Custom Fee Head Form */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1 font-mono">
                  <Plus className="w-3.5 h-3.5 text-indigo-600" /> Define New Fee Head
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Fee Head Name</label>
                    <input
                      type="text"
                      value={newFeeHead.feeHead}
                      onChange={(e) => setNewFeeHead({ ...newFeeHead, feeHead: e.target.value })}
                      placeholder="e.g. Science Lab & STEM Fee"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Amount (₹ INR)</label>
                    <input
                      type="number"
                      value={newFeeHead.amountInr}
                      onChange={(e) => setNewFeeHead({ ...newFeeHead, amountInr: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Frequency</label>
                    <select
                      value={newFeeHead.frequency}
                      onChange={(e) => setNewFeeHead({ ...newFeeHead, frequency: e.target.value as any })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-medium"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="half_yearly">Half-Yearly</option>
                      <option value="annual">Annual</option>
                      <option value="one_time">One-Time</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Applicable Grades</label>
                    <input
                      type="text"
                      value={newFeeHead.applicableClasses || 'All Classes'}
                      onChange={(e) => setNewFeeHead({ ...newFeeHead, applicableClasses: e.target.value })}
                      placeholder="All Classes"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Due Day of Month</label>
                    <input
                      type="number"
                      value={newFeeHead.dueDay || 10}
                      onChange={(e) => setNewFeeHead({ ...newFeeHead, dueDay: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (!newFeeHead.feeHead.trim()) {
                          onShowToast('error', 'Fee Head Required', 'Please enter fee head name.');
                          return;
                        }
                        setFeeStructures(prev => [...prev, newFeeHead]);
                        setNewFeeHead({ feeHead: '', amountInr: 2000, frequency: 'quarterly', applicableClasses: 'All Classes', dueDay: 10 });
                        onShowToast('success', 'Fee Head Saved', `${newFeeHead.feeHead}`);
                      }}
                      className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      + Add Fee Head to Ledger
                    </button>
                  </div>
                </div>
              </div>

              {/* Fee Heads Table */}
              <div className="space-y-2">
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-3">Fee Head Title</th>
                        <th className="p-3">Amount (INR)</th>
                        <th className="p-3">Frequency</th>
                        <th className="p-3">Applicable Grades</th>
                        <th className="p-3">Due Day</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {feeStructures.map((f, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900">{f.feeHead}</td>
                          <td className="p-3 font-bold text-emerald-700">₹{f.amountInr.toLocaleString('en-IN')}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {f.frequency}
                            </span>
                          </td>
                          <td className="p-3 text-slate-700">{f.applicableClasses || 'All Classes'}</td>
                          <td className="p-3 text-slate-600">{f.dueDay || 10}th of month</td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => setFeeStructures(prev => prev.filter((_, idx) => idx !== i))}
                              className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* STEP 10: EXAM & GRADING */}
          {/* ================================================================== */}
          {currentStep === 10 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Grading Scale System
                  </label>
                  <select
                    value={examForm.gradingSystem}
                    onChange={(e) => setExamForm({ ...examForm, gradingSystem: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900"
                  >
                    <option value="cbse_9point">CBSE 9-Point Scale (A1, A2, B1, B2, C1, C2, D, E1, E2)</option>
                    <option value="percentage">Direct Percentage Scale (1st Div 60%+, 2nd Div 48%+)</option>
                    <option value="gpa_10">10-Point GPA System</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Passing Threshold Percentage
                  </label>
                  <input
                    type="number"
                    value={examForm.passPercentage}
                    onChange={(e) => setExamForm({ ...examForm, passPercentage: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-indigo-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Default Max Marks per Subject
                  </label>
                  <input
                    type="number"
                    value={examForm.maxMarksDefault}
                    onChange={(e) => setExamForm({ ...examForm, maxMarksDefault: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Report Card Template
                  </label>
                  <div className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold">
                    Holistic Progress Card (HPC) Aligned with NEP 2020
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* STEP 11: COMMUNICATION GATEWAYS */}
          {/* ================================================================== */}
          {currentStep === 11 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'inApp', label: 'In-App Push Notifications', desc: 'Instant teacher, parent & student alerts' },
                  { key: 'email', label: 'Institutional Email Alerts', desc: 'Fee receipts, admit cards & circulars' },
                  { key: 'sms', label: 'SMS Gateway Dispatch', desc: 'Critical emergency and absence SMS' },
                  { key: 'whatsapp', label: 'WhatsApp Business API', desc: 'Automated fee due and holiday reminders' }
                ].map(item => (
                  <div key={item.key} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-900">{item.label}</div>
                      <div className="text-[11px] text-slate-500">{item.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={(commForm as any)[item.key]}
                      onChange={(e) => setCommForm({ ...commForm, [item.key]: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* STEP 12: TRANSPORT FLEETS (OPTIONAL) */}
          {/* ================================================================== */}
          {currentStep === 12 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Transport Fleet & GPS Live Tracking</h4>
                  <p className="text-xs text-slate-600">Enable school buses, driver mobile GPS broadcast, and student pick-up stops.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTransportSkipped(!transportSkipped)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                    transportSkipped ? 'bg-slate-200 text-slate-800' : 'bg-indigo-600 text-white'
                  }`}
                >
                  {transportSkipped ? 'Module Skipped' : 'Module Enabled'}
                </button>
              </div>
              {!transportSkipped && (
                <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 space-y-2">
                  <span className="font-bold text-slate-900">Configured Routes:</span> 6 Fleet Vehicles (Bus 01 to 06) with GPS live coordinate transmission ready.
                </div>
              )}
            </div>
          )}

          {/* ================================================================== */}
          {/* STEP 13: DIGITAL LIBRARY (OPTIONAL) */}
          {/* ================================================================== */}
          {currentStep === 13 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Digital Library & Book Cataloging</h4>
                  <p className="text-xs text-slate-600">Circulation rules, barcode scanners, and overdue book penalties.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setLibrarySkipped(!librarySkipped)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                    librarySkipped ? 'bg-slate-200 text-slate-800' : 'bg-indigo-600 text-white'
                  }`}
                >
                  {librarySkipped ? 'Module Skipped' : 'Module Enabled'}
                </button>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* STEP 14: HR & PAYROLL (OPTIONAL) */}
          {/* ================================================================== */}
          {currentStep === 14 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Staff HR, Leave Policy & Payroll Ledger</h4>
                  <p className="text-xs text-slate-600">CL, EL, ML leaves, salary slip generator, and biometric attendance.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setHrSkipped(!hrSkipped)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                    hrSkipped ? 'bg-slate-200 text-slate-800' : 'bg-indigo-600 text-white'
                  }`}
                >
                  {hrSkipped ? 'Module Skipped' : 'Module Enabled'}
                </button>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* STEP 15: DAKSHORA AI COPILOT */}
          {/* ================================================================== */}
          {currentStep === 15 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-indigo-950 flex items-center gap-2">
                    <Bot className="w-4 h-4 text-indigo-600" />
                    <span>Institutional Dakshora AI Copilot</span>
                  </h4>
                  <p className="text-xs text-indigo-800">Assists teachers in question paper generation, marks analytics, and parent queries.</p>
                </div>
                <input
                  type="checkbox"
                  checked={aiForm.aiEnabled}
                  onChange={(e) => setAiForm({ ...aiForm, aiEnabled: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* STEP 16: INSTITUTIONAL VERIFICATION & GO-LIVE (CARDS REMOVED AS REQUESTED) */}
          {/* ================================================================== */}
          {currentStep === 16 && (
            <div className="space-y-6">
              {/* Top Verified Metrics Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-mono tracking-wider uppercase font-bold">Organization</span>
                  <strong className="text-slate-900 text-xs font-bold truncate block mt-0.5">{orgForm.name}</strong>
                  <span className="inline-flex items-center gap-1 text-emerald-700 text-[10px] font-mono font-bold mt-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Tenant Verified
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-mono tracking-wider uppercase font-bold">School Credentials</span>
                  <strong className="text-slate-900 text-xs font-bold truncate block mt-0.5">{profileForm.schoolName}</strong>
                  <span className="inline-flex items-center gap-1 text-emerald-700 text-[10px] font-mono font-bold mt-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {profileForm.board} Affiliated
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-mono tracking-wider uppercase font-bold">Classes Directory</span>
                  <strong className="text-slate-900 text-xs font-bold block mt-0.5">{classesList.length} Classroom Sections</strong>
                  <span className="inline-flex items-center gap-1 text-indigo-700 text-[10px] font-mono font-bold mt-1">
                    {subjectsList.length} Subjects Loaded
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-mono tracking-wider uppercase font-bold">Live Rosters</span>
                  <strong className="text-slate-900 text-xs font-bold block mt-0.5">{studentsList.length} Enrolled Students</strong>
                  <span className="inline-flex items-center gap-1 text-purple-700 text-[10px] font-mono font-bold mt-1">
                    {staffList.length} Faculty Staff
                  </span>
                </div>
              </div>

              {/* Comprehensive Production Readiness Audit Card */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Institutional Subsystems Readiness Audit</h3>
                      <p className="text-xs text-slate-500">All 15 foundational operational modules configured and validated for production.</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 font-mono text-xs font-bold">
                    100% Ready
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs font-mono">
                  {[
                    { title: 'Tenant Boundary & DB Schema', status: 'Verified' },
                    { title: 'Board Affiliation & Legal Credentials', status: 'Active' },
                    { title: 'Campus Facility & Capacity', status: '2500 Capacity' },
                    { title: 'Academic Session Window', status: '2026-27 Active' },
                    { title: 'NEP 2020 Pedagogical Stages', status: `${classesList.length} Sections` },
                    { title: 'Board Curriculums & Senior Streams', status: `${subjectsList.length} Subjects` },
                    { title: 'Faculty & Teachers Directory', status: `${staffList.length} Staff` },
                    { title: 'Student Enrollment Ledger', status: `${studentsList.length} Students` },
                    { title: 'Admin Configured Fee Heads', status: `${feeStructures.length} Heads` },
                    { title: 'CBSE 9-Point Grading Policy', status: 'Configured' },
                    { title: 'Omnichannel Communication', status: 'Active' },
                    { title: 'Transport Fleets & GPS Tracking', status: transportSkipped ? 'Skipped' : 'Ready' },
                    { title: 'Digital Library & Circulation', status: librarySkipped ? 'Skipped' : 'Ready' },
                    { title: 'HR & Staff Leave Desks', status: hrSkipped ? 'Skipped' : 'Ready' },
                    { title: 'Dakshora AI Copilot Safety', status: aiForm.aiEnabled ? 'Enabled' : 'Disabled' }
                  ].map((chk, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <span className="text-slate-700 truncate pr-1">{chk.title}</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md shrink-0">
                        ✓ {chk.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 1-Click Live Activation Hero Card */}
              <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white shadow-xl space-y-4 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-mono font-bold tracking-wider uppercase backdrop-blur-md">
                      Final Production Step
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black mt-1">Activate School ERP SaaS Platform</h2>
                    <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mt-0.5 leading-relaxed">
                      Publish all verified classroom rosters, fee structures, and staff directories to live production database.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleActivate}
                    disabled={saving}
                    className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>{isActivated ? 'Re-Deploy & Update ERP 🚀' : 'Activate School ERP Live 🚀'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* BOTTOM STEP CONTROLS (CRISP HIGH-CONTRAST BUTTONS) */}
          {/* ================================================================== */}
          <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1 || saving}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous Step</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-indigo-600" />
                <span>Save Draft</span>
              </button>

              {currentStep < 16 ? (
                <button
                  type="button"
                  onClick={() => handleSaveStep(currentStep)}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:brightness-105 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                >
                  {saving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>Save & Proceed to Step {currentStep + 1}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onNavigateToErp}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Launch School ERP Dashboard →</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
export default SchoolOnboardingWizard;
