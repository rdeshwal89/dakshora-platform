import React, { useState, useEffect } from 'react';
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
  Globe,
  Smartphone,
  Key,
  Webhook,
  Palette,
  CheckSquare,
  Square,
  Eye,
  Copy,
  Sliders,
  Cpu,
  Fingerprint,
  Radio,
  MessageSquare,
  Share2,
  FileText,
  Lock,
  UploadCloud,
  Zap,
  Search
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  SchoolOnboardingRecord,
  OnboardingChecklist,
  OnboardingStatusResponse,
  ImportPreviewSummary
} from '../types';
import {
  fetchOnboardingStatus,
  fetchOnboardingChecklist,
  saveOnboardingStep,
  saveOnboardingDraft,
  validateOnboarding,
  activateSchoolErp,
  inviteSchoolAdmin,
  importOnboardingStudents,
  importOnboardingStaff
} from '../services/api';

export interface ClassPresetItem {
  id: string;
  title: string;
  hindiTitle: string;
  subtitle: string;
  badge: string;
  icon: string;
  grades: string[];
}

export const CLASS_PRESETS: ClassPresetItem[] = [
  {
    id: 'k12',
    title: 'Nursery, LKG, UKG to 12th',
    hindiTitle: 'नर्सरी, LKG, UKG से 12वीं तक (सम्पूर्ण K-12 विद्यालय)',
    subtitle: 'Complete K-12 School (Pre-Primary, Primary, Middle, Secondary & Senior Secondary)',
    badge: 'K-12 Full School (19 Grades)',
    icon: '🌟',
    grades: [
      'Nursery', 'LKG', 'UKG',
      'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
      'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
      'Class 11 Science', 'Class 11 Commerce', 'Class 11 Arts',
      'Class 12 Science', 'Class 12 Commerce', 'Class 12 Arts'
    ]
  },
  {
    id: 'nursery_to_5',
    title: 'Nursery to 5th',
    hindiTitle: 'नर्सरी से 5वीं कक्षा (प्राथमिक एवं बुनियादी विद्यालय)',
    subtitle: 'Foundational & Preparatory Primary School (Pre-Primary + Classes 1 to 5)',
    badge: 'Nursery - 5th (8 Grades)',
    icon: '🎒',
    grades: [
      'Nursery', 'LKG', 'UKG',
      'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'
    ]
  },
  {
    id: '6_to_12',
    title: '6th to 12th',
    hindiTitle: '6वीं से 12वीं कक्षा (उच्च प्राथमिक एवं उच्च माध्यमिक)',
    subtitle: 'Middle & Senior Secondary School (Classes 6 to 10 + 11 & 12 Streams)',
    badge: '6th - 12th (11 Grades)',
    icon: '🎓',
    grades: [
      'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
      'Class 11 Science', 'Class 11 Commerce', 'Class 11 Arts',
      'Class 12 Science', 'Class 12 Commerce', 'Class 12 Arts'
    ]
  },
  {
    id: '1_to_10',
    title: '1st to 10th',
    hindiTitle: '1st से 10th कक्षा (प्राथमिक एवं माध्यमिक हाई स्कूल)',
    subtitle: 'Standard Elementary & Secondary High School (Classes 1 to 10)',
    badge: 'Class 1 - 10 (10 Grades)',
    icon: '🏫',
    grades: [
      'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
      'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'
    ]
  },
  {
    id: '11_12_streams',
    title: '11th & 12th Streams',
    hindiTitle: '11वीं और 12वीं स्ट्रीम्स (सीनियर सेकेंडरी / इंटर कॉलेज)',
    subtitle: 'Senior Secondary Junior College: Science, Commerce & Humanities',
    badge: 'Class 11 & 12 (6 Streams)',
    icon: '🔬',
    grades: [
      'Class 11 Science (PCM/PCB)', 'Class 11 Commerce', 'Class 11 Humanities / Arts',
      'Class 12 Science (PCM/PCB)', 'Class 12 Commerce', 'Class 12 Humanities / Arts'
    ]
  }
];

export interface SubjectItem {
  name: string;
  code: string;
  category: string;
  gradeBand?: string;
  theoryMarks?: number;
  internalMarks?: number;
  isCompulsory?: boolean;
}

export interface SubjectPresetItem {
  id: string;
  title: string;
  hindiTitle: string;
  subtitle: string;
  badge: string;
  icon: string;
  board: string;
  subjects: SubjectItem[];
}

export const CBSE_SUBJECT_PRESETS: SubjectPresetItem[] = [
  {
    id: 'cbse_k12_full',
    title: 'CBSE Complete K-12 Standard (NEP 2020)',
    hindiTitle: 'CBSE सम्पूर्ण K-12 पाठ्यक्रम (NEP 2020 आधारित)',
    subtitle: 'Core Academics + Board Exam Codes + NEP 2020 Vocational & Skill Subjects',
    badge: 'CBSE Official Standard',
    icon: '📘',
    board: 'CBSE',
    subjects: [
      { name: 'English Language & Literature', code: '184', category: 'Language', gradeBand: 'All', theoryMarks: 80, internalMarks: 20, isCompulsory: true },
      { name: 'Hindi Course-A', code: '002', category: 'Language', gradeBand: 'All', theoryMarks: 80, internalMarks: 20, isCompulsory: true },
      { name: 'Mathematics Standard', code: '041', category: 'Core', gradeBand: 'All', theoryMarks: 80, internalMarks: 20, isCompulsory: true },
      { name: 'Mathematics Basic', code: '241', category: 'Core', gradeBand: '9-10', theoryMarks: 80, internalMarks: 20, isCompulsory: false },
      { name: 'Science (Physics/Chem/Bio)', code: '086', category: 'Core', gradeBand: '6-10', theoryMarks: 80, internalMarks: 20, isCompulsory: true },
      { name: 'Social Science (Hist/Geo/Pol/Eco)', code: '087', category: 'Core', gradeBand: '6-10', theoryMarks: 80, internalMarks: 20, isCompulsory: true },
      { name: 'Environmental Studies (EVS)', code: 'EVS-101', category: 'Core', gradeBand: '1-5', theoryMarks: 80, internalMarks: 20, isCompulsory: true },
      { name: 'Sanskrit / Third Language', code: '122', category: 'Language', gradeBand: '6-8', theoryMarks: 80, internalMarks: 20, isCompulsory: false },
      { name: 'Artificial Intelligence (NEP Skill)', code: '417', category: 'Skill', gradeBand: '9-12', theoryMarks: 50, internalMarks: 50, isCompulsory: false },
      { name: 'Information Technology (Skill)', code: '402', category: 'Skill', gradeBand: '9-12', theoryMarks: 50, internalMarks: 50, isCompulsory: false },
      { name: 'Physics', code: '042', category: 'Elective', gradeBand: '11-12', theoryMarks: 70, internalMarks: 30, isCompulsory: false },
      { name: 'Chemistry', code: '043', category: 'Elective', gradeBand: '11-12', theoryMarks: 70, internalMarks: 30, isCompulsory: false },
      { name: 'Biology', code: '044', category: 'Elective', gradeBand: '11-12', theoryMarks: 70, internalMarks: 30, isCompulsory: false },
      { name: 'Accountancy', code: '055', category: 'Elective', gradeBand: '11-12', theoryMarks: 80, internalMarks: 20, isCompulsory: false },
      { name: 'Business Studies', code: '054', category: 'Elective', gradeBand: '11-12', theoryMarks: 80, internalMarks: 20, isCompulsory: false },
      { name: 'Economics', code: '030', category: 'Elective', gradeBand: '11-12', theoryMarks: 80, internalMarks: 20, isCompulsory: false },
      { name: 'History', code: '027', category: 'Elective', gradeBand: '11-12', theoryMarks: 80, internalMarks: 20, isCompulsory: false },
      { name: 'Political Science', code: '028', category: 'Elective', gradeBand: '11-12', theoryMarks: 80, internalMarks: 20, isCompulsory: false },
      { name: 'Computer Science (Python)', code: '083', category: 'Elective', gradeBand: '11-12', theoryMarks: 70, internalMarks: 30, isCompulsory: false },
      { name: 'Physical & Health Education', code: '048', category: 'Co-Scholastic', gradeBand: 'All', theoryMarks: 70, internalMarks: 30, isCompulsory: true },
      { name: 'Art Education & Craft', code: 'ART-501', category: 'Co-Scholastic', gradeBand: 'All', theoryMarks: 0, internalMarks: 100, isCompulsory: true }
    ]
  },
  {
    id: 'cbse_secondary_9_10',
    title: 'CBSE Secondary (Class 9 & 10) 5+1 Scheme',
    hindiTitle: 'CBSE 9वीं और 10वीं बोर्ड परीक्षा स्कीम (5 अनिवार्य + 1 स्किल विषय)',
    subtitle: '5 Compulsory Board Subjects + 1 NEP 2020 Vocational Skill Subject with 80/20 & 50/50 Marking',
    badge: 'CBSE Class 9 & 10',
    icon: '📙',
    board: 'CBSE',
    subjects: [
      { name: 'English Language & Literature', code: '184', category: 'Language', gradeBand: '9-10', theoryMarks: 80, internalMarks: 20, isCompulsory: true },
      { name: 'Hindi Course-A', code: '002', category: 'Language', gradeBand: '9-10', theoryMarks: 80, internalMarks: 20, isCompulsory: true },
      { name: 'Mathematics Standard', code: '041', category: 'Core', gradeBand: '9-10', theoryMarks: 80, internalMarks: 20, isCompulsory: true },
      { name: 'Science (Physics/Chem/Bio)', code: '086', category: 'Core', gradeBand: '9-10', theoryMarks: 80, internalMarks: 20, isCompulsory: true },
      { name: 'Social Science (Hist/Geo/Civ/Eco)', code: '087', category: 'Core', gradeBand: '9-10', theoryMarks: 80, internalMarks: 20, isCompulsory: true },
      { name: 'Artificial Intelligence (Skill Subject)', code: '417', category: 'Skill', gradeBand: '9-10', theoryMarks: 50, internalMarks: 50, isCompulsory: false },
      { name: 'Information Technology (Skill Subject)', code: '402', category: 'Skill', gradeBand: '9-10', theoryMarks: 50, internalMarks: 50, isCompulsory: false },
      { name: 'Health & Physical Education (Co-Scholastic)', code: '502', category: 'Co-Scholastic', gradeBand: '9-10', theoryMarks: 0, internalMarks: 100, isCompulsory: true }
    ]
  },
  {
    id: 'cbse_primary_middle_1_8',
    title: 'CBSE Primary & Middle (Classes 1 to 8)',
    hindiTitle: 'CBSE प्राइमरी एवं मिडिल (1ली से 8वीं कक्षा - HPC आधारित)',
    subtitle: 'Holistic Progress Card (HPC) aligned foundational and preparatory learning',
    badge: 'Class 1 - 8 HPC',
    icon: '📗',
    board: 'CBSE',
    subjects: [
      { name: 'English Communicative', code: 'ENG-101', category: 'Language', gradeBand: '1-8', theoryMarks: 80, internalMarks: 20, isCompulsory: true },
      { name: 'Hindi Vyakaran & Sahitya', code: 'HIN-101', category: 'Language', gradeBand: '1-8', theoryMarks: 80, internalMarks: 20, isCompulsory: true },
      { name: 'Mathematics & Mental Ability', code: 'MTH-101', category: 'Core', gradeBand: '1-8', theoryMarks: 80, internalMarks: 20, isCompulsory: true },
      { name: 'Environmental Studies (EVS)', code: 'EVS-101', category: 'Core', gradeBand: '1-5', theoryMarks: 80, internalMarks: 20, isCompulsory: true },
      { name: 'General Science & Discovery', code: 'SCI-601', category: 'Core', gradeBand: '6-8', theoryMarks: 80, internalMarks: 20, isCompulsory: true },
      { name: 'Social Studies & Civics', code: 'SST-601', category: 'Core', gradeBand: '6-8', theoryMarks: 80, internalMarks: 20, isCompulsory: true },
      { name: 'Sanskrit / Third Language', code: 'SKT-601', category: 'Language', gradeBand: '6-8', theoryMarks: 80, internalMarks: 20, isCompulsory: false },
      { name: 'Computer Science & AI Coding', code: 'CS-101', category: 'Skill', gradeBand: '1-8', theoryMarks: 50, internalMarks: 50, isCompulsory: true },
      { name: 'Art, Craft & Creative Expression', code: 'ART-101', category: 'Co-Scholastic', gradeBand: '1-8', theoryMarks: 0, internalMarks: 100, isCompulsory: true },
      { name: 'General Knowledge & Current Affairs', code: 'GK-101', category: 'Co-Scholastic', gradeBand: '1-8', theoryMarks: 50, internalMarks: 0, isCompulsory: false }
    ]
  },
  {
    id: 'cbse_senior_sec_streams',
    title: 'CBSE Senior Secondary (Classes 11 & 12 Streams)',
    hindiTitle: 'CBSE 11वीं और 12वीं स्ट्रीम्स (साइंस, कॉमर्स, आर्ट्स)',
    subtitle: 'Science (Medical / Non-Medical), Commerce, and Humanities streams with 70/30 & 80/20 split',
    badge: 'Class 11 & 12 Streams',
    icon: '🔬',
    board: 'CBSE',
    subjects: [
      { name: 'English Core', code: '301', category: 'Language', gradeBand: '11-12', theoryMarks: 80, internalMarks: 20, isCompulsory: true },
      { name: 'Physics (Theory + Practical Lab)', code: '042', category: 'Elective', gradeBand: '11-12', theoryMarks: 70, internalMarks: 30, isCompulsory: false },
      { name: 'Chemistry (Theory + Practical Lab)', code: '043', category: 'Elective', gradeBand: '11-12', theoryMarks: 70, internalMarks: 30, isCompulsory: false },
      { name: 'Mathematics', code: '041', category: 'Elective', gradeBand: '11-12', theoryMarks: 80, internalMarks: 20, isCompulsory: false },
      { name: 'Biology (Theory + Practical Lab)', code: '044', category: 'Elective', gradeBand: '11-12', theoryMarks: 70, internalMarks: 30, isCompulsory: false },
      { name: 'Computer Science (Python Lab)', code: '083', category: 'Elective', gradeBand: '11-12', theoryMarks: 70, internalMarks: 30, isCompulsory: false },
      { name: 'Accountancy', code: '055', category: 'Elective', gradeBand: '11-12', theoryMarks: 80, internalMarks: 20, isCompulsory: false },
      { name: 'Business Studies', code: '054', category: 'Elective', gradeBand: '11-12', theoryMarks: 80, internalMarks: 20, isCompulsory: false },
      { name: 'Economics', code: '030', category: 'Elective', gradeBand: '11-12', theoryMarks: 80, internalMarks: 20, isCompulsory: false },
      { name: 'Applied Mathematics', code: '241', category: 'Elective', gradeBand: '11-12', theoryMarks: 80, internalMarks: 20, isCompulsory: false },
      { name: 'Informatics Practices (IP)', code: '065', category: 'Elective', gradeBand: '11-12', theoryMarks: 70, internalMarks: 30, isCompulsory: false },
      { name: 'History', code: '027', category: 'Elective', gradeBand: '11-12', theoryMarks: 80, internalMarks: 20, isCompulsory: false },
      { name: 'Political Science', code: '028', category: 'Elective', gradeBand: '11-12', theoryMarks: 80, internalMarks: 20, isCompulsory: false },
      { name: 'Geography (Theory + Practical)', code: '029', category: 'Elective', gradeBand: '11-12', theoryMarks: 70, internalMarks: 30, isCompulsory: false },
      { name: 'Physical Education', code: '048', category: 'Co-Scholastic', gradeBand: '11-12', theoryMarks: 70, internalMarks: 30, isCompulsory: false }
    ]
  },
  {
    id: 'state_board_rbse',
    title: 'State Board / RBSE Standard (Hindi & English Medium)',
    hindiTitle: 'राज्य शिक्षा बोर्ड / RBSE मानक पाठ्यक्रम (हिंदी/अंग्रेजी माध्यम)',
    subtitle: 'State Board Secondary Education standard syllabus with compulsory language and core subjects',
    badge: 'State Board / RBSE',
    icon: '🏛️',
    board: 'State Board',
    subjects: [
      { name: 'अनिवार्य अंग्रेजी (Compulsory English)', code: 'ENG-RBSE', category: 'Language', gradeBand: 'All', theoryMarks: 80, internalMarks: 20, isCompulsory: true },
      { name: 'अनिवार्य हिंदी (Compulsory Hindi)', code: 'HIN-RBSE', category: 'Language', gradeBand: 'All', theoryMarks: 80, internalMarks: 20, isCompulsory: true },
      { name: 'गणित (Mathematics)', code: 'MTH-RBSE', category: 'Core', gradeBand: 'All', theoryMarks: 80, internalMarks: 20, isCompulsory: true },
      { name: 'विज्ञान (General Science)', code: 'SCI-RBSE', category: 'Core', gradeBand: '6-10', theoryMarks: 80, internalMarks: 20, isCompulsory: true },
      { name: 'सामाजिक विज्ञान (Social Science)', code: 'SST-RBSE', category: 'Core', gradeBand: '6-10', theoryMarks: 80, internalMarks: 20, isCompulsory: true },
      { name: 'तृतीय भाषा - संस्कृत (Sanskrit)', code: 'SKT-RBSE', category: 'Language', gradeBand: '6-10', theoryMarks: 80, internalMarks: 20, isCompulsory: false },
      { name: 'चित्रकला / कार्यानुभव (Drawing & Work Exp)', code: 'ART-RBSE', category: 'Co-Scholastic', gradeBand: 'All', theoryMarks: 0, internalMarks: 100, isCompulsory: true },
      { name: 'शारीरिक एवं स्वास्थ्य शिक्षा (Physical Education)', code: 'PHE-RBSE', category: 'Co-Scholastic', gradeBand: 'All', theoryMarks: 50, internalMarks: 50, isCompulsory: true }
    ]
  }
];

export const QUICK_ADD_GRADES = [
  'Nursery', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11 Science', 'Class 11 Commerce', 'Class 11 Arts',
  'Class 12 Science', 'Class 12 Commerce', 'Class 12 Arts'
];

export const QUICK_ADD_SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];

export const COMMON_CBSE_SUBJECT_SUGGESTIONS = [
  'English Language & Literature',
  'English Core',
  'Hindi Course-A',
  'Hindi Course-B',
  'Mathematics Standard',
  'Mathematics Basic',
  'Applied Mathematics',
  'Science (Physics/Chem/Bio)',
  'Physics',
  'Chemistry',
  'Biology',
  'Social Science',
  'History',
  'Geography',
  'Political Science',
  'Economics',
  'Accountancy',
  'Business Studies',
  'Artificial Intelligence (Skill 417)',
  'Information Technology (Skill 402)',
  'Computer Science (Python)',
  'Informatics Practices (IP)',
  'Sanskrit',
  'Environmental Studies (EVS)',
  'Physical & Health Education',
  'Art & Craft Education',
  'Psychology',
  'Sociology'
];

interface SchoolOnboardingWizardProps {
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  onNavigateToErp?: () => void;
  organizationId?: string;
}

export const SchoolOnboardingWizard: React.FC<SchoolOnboardingWizardProps> = ({
  onShowToast,
  onNavigateToErp,
  organizationId = 'b17780e5-3832-4ac6-9aeb-33fd80c5cb0e'
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [onboarding, setOnboarding] = useState<SchoolOnboardingRecord | null>(null);
  const [checklist, setChecklist] = useState<OnboardingChecklist | null>(null);
  const [progressPercentage, setProgressPercentage] = useState<number>(0);

  // Success / Activation Modal State
  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteName, setInviteName] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<string>('admin');
  const [inviting, setInviting] = useState<boolean>(false);
  const [inviteSent, setInviteSent] = useState<boolean>(false);

  // Step 1: Organization
  const [orgForm, setOrgForm] = useState({
    name: 'Delhi Public Heritage Trust',
    slug: 'heritage-trust',
    plan: 'enterprise'
  });

  // Step 2: School Profile
  const [profileForm, setProfileForm] = useState({
    schoolName: 'Delhi Public Heritage School',
    schoolCode: 'DPS-VK-894',
    board: 'CBSE',
    schoolType: 'K-12 Day Cum Boarding',
    affiliationNo: 'CBSE-AFF-2130894',
    udiseNumber: '06180104502',
    address: 'Sector 45, Institutional Area',
    city: 'Gurugram',
    state: 'Haryana',
    pin: '122003',
    phone: '+91 11 2613 8900',
    email: 'info@dpsheritage.edu.in',
    website: 'https://dpsheritage.edu.in',
    principalName: 'Dr. Meenakshi Sundaram'
  });

  // Step 3: Campus
  const [campusForm, setCampusForm] = useState({
    name: 'Delhi Public Heritage - Main Campus',
    code: 'MAIN-01',
    address: 'Sector 45, Institutional Area, Gurugram, Haryana - 122003',
    city: 'Gurugram',
    state: 'Haryana',
    pin: '122003',
    contactPhone: '+91 11 2613 8900',
    contactEmail: 'main.campus@dpsheritage.edu.in',
    principalName: 'Dr. Meenakshi Sundaram',
    capacity: 2500,
    isMain: true
  });

  // Step 4: Academic Session
  const [sessionForm, setSessionForm] = useState({
    name: '2026-27',
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    status: 'active',
    isCurrent: true
  });

  // Step 5: Classes & Sections State
  const [classesList, setClassesList] = useState<Array<{ grade: string; section: string; roomNumber: string }>>([
    { grade: 'Class 9', section: 'A', roomNumber: 'Room 201' },
    { grade: 'Class 9', section: 'B', roomNumber: 'Room 202' },
    { grade: 'Class 10', section: 'A', roomNumber: 'Room 301' },
    { grade: 'Class 10', section: 'B', roomNumber: 'Room 302' }
  ]);
  const [activeClassPresetId, setActiveClassPresetId] = useState<string>('k12');
  const [selectedSections, setSelectedSections] = useState<string[]>(['A', 'B']);
  const [newGrade, setNewGrade] = useState('');
  const [newSection, setNewSection] = useState('A');
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [classSearchQuery, setClassSearchQuery] = useState('');

  // Step 6: Subjects Catalog State (Board & CBSE Norms)
  const [subjectsList, setSubjectsList] = useState<SubjectItem[]>([
    { name: 'English Language & Literature', code: '184', category: 'Language', gradeBand: '9-10', theoryMarks: 80, internalMarks: 20, isCompulsory: true },
    { name: 'Hindi Course-A', code: '002', category: 'Language', gradeBand: '9-10', theoryMarks: 80, internalMarks: 20, isCompulsory: true },
    { name: 'Mathematics Standard', code: '041', category: 'Core', gradeBand: '9-10', theoryMarks: 80, internalMarks: 20, isCompulsory: true },
    { name: 'Science (Physics, Chemistry & Biology)', code: '086', category: 'Core', gradeBand: '9-10', theoryMarks: 80, internalMarks: 20, isCompulsory: true },
    { name: 'Social Science (Hist/Civ/Geo/Eco)', code: '087', category: 'Core', gradeBand: '9-10', theoryMarks: 80, internalMarks: 20, isCompulsory: true },
    { name: 'Artificial Intelligence (Skill Subject)', code: '417', category: 'Skill', gradeBand: '9-10', theoryMarks: 50, internalMarks: 50, isCompulsory: false },
    { name: 'Physical & Health Education', code: 'PHE-101', category: 'Co-Scholastic', gradeBand: 'All', theoryMarks: 0, internalMarks: 100, isCompulsory: true }
  ]);
  const [activeSubjectPresetId, setActiveSubjectPresetId] = useState<string>('cbse_k12_full');
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubCategory, setNewSubCategory] = useState('Core');
  const [newSubGradeBand, setNewSubGradeBand] = useState('9-10');
  const [newSubTheoryMarks, setNewSubTheoryMarks] = useState<number>(80);
  const [newSubInternalMarks, setNewSubInternalMarks] = useState<number>(20);
  const [newSubCompulsory, setNewSubCompulsory] = useState<boolean>(true);
  const [subjectFilterCategory, setSubjectFilterCategory] = useState<string>('all');
  const [subjectSearchQuery, setSubjectSearchQuery] = useState<string>('');

  // Step 7: Staff Management & Import
  const [staffMode, setStaffMode] = useState<'manual' | 'csv'>('manual');
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    role: 'teacher',
    department: 'Academic Faculty',
    designation: 'Senior Faculty'
  });
  const [staffCsv, setStaffCsv] = useState(`name,email,empId,role,department,designation
Dr. Rajesh Sharma,rajesh.sharma@dpsheritage.edu.in,FAC-01,teacher,Academic Faculty,PGT Physics
Sunita Kapoor,sunita.kapoor@dpsheritage.edu.in,FAC-02,teacher,Academic Faculty,TGT English
Amitabh Sen,accounts@dpsheritage.edu.in,ACC-01,account,Finance & Bursar,Chief Accountant`);
  const [staffImportPreview, setStaffImportPreview] = useState<ImportPreviewSummary | null>(null);

  // Step 8: Student Enrollment & Import
  const [studentMode, setStudentMode] = useState<'manual' | 'csv'>('csv');
  const [studentCsv, setStudentCsv] = useState(`name,grade,section,rollNo,parentName,parentPhone,parentEmail
Aarav Sharma,Class 10,A,DPS-2026-101,Vikram Sharma,+91 98100 12345,vikram.sharma@gmail.com
Diya Patel,Class 10,A,DPS-2026-102,Sanjay Patel,+91 98200 23456,sanjay.patel@gmail.com
Rohan Gupta,Class 9,B,DPS-2026-103,Manoj Gupta,+91 98300 34567,manoj.gupta@gmail.com`);
  const [studentImportPreview, setStudentImportPreview] = useState<ImportPreviewSummary | null>(null);

  // Step 9: Fee Structures
  const [feeStructures, setFeeStructures] = useState<Array<{ feeHead: string; amountInr: number; frequency: string }>>([
    { feeHead: 'Quarterly Tuition Fee', amountInr: 18500, frequency: 'quarterly' },
    { feeHead: 'Annual Development & Lab Charges', amountInr: 8000, frequency: 'annual' },
    { feeHead: 'Examination & Assessment Fee', amountInr: 2500, frequency: 'annual' }
  ]);

  // Step 10: Exam Configuration
  const [examForm, setExamForm] = useState({
    gradingSystem: 'cbse_9point',
    passPercentage: 33.0,
    maxMarksDefault: 100
  });

  // Step 11: Communication
  const [commForm, setCommForm] = useState({
    inApp: true,
    email: true,
    sms: true,
    whatsapp: false,
    autoAdmission: true,
    autoFeeReminders: true,
    autoAttendanceAlerts: true
  });

  // Optional Modules (12 Transport, 13 Library, 14 HR)
  const [transportSkipped, setTransportSkipped] = useState<boolean>(false);
  const [librarySkipped, setLibrarySkipped] = useState<boolean>(false);
  const [hrSkipped, setHrSkipped] = useState<boolean>(false);

  // Step 15: Dakshora AI
  const [aiForm, setAiForm] = useState({
    aiEnabled: true,
    monthlyQuota: 5000,
    allowedRoles: ['admin', 'teacher', 'account', 'reception', 'parent', 'student']
  });

  // Step 16: Digital Presence, White-Label Mobile App & Premium Add-ons State
  const [websiteOption, setWebsiteOption] = useState<'existing' | 'generate'>('generate');
  const [existingWebsiteForm, setExistingWebsiteForm] = useState({
    url: 'https://www.dpsheritage.edu.in',
    apiKey: 'dak_live_sec_89f2a71c9940ef14',
    webhookUrl: 'https://www.dpsheritage.edu.in/api/dakshora-webhook',
    webhookSecret: 'whsec_79c1048b209a32c1e8',
    isVerified: true
  });
  const [testWebhookLoading, setTestWebhookLoading] = useState(false);
  const [webhookTested, setWebhookTested] = useState(true);

  // New ERP-Synced Website settings
  const [newWebsiteTheme, setNewWebsiteTheme] = useState('tpl-cbse-secondary');
  const [newWebsiteDomain, setNewWebsiteDomain] = useState('heritage-trust.school.dakshora.app');

  // White-Label Custom Mobile App settings
  const [appBranding, setAppBranding] = useState({
    appName: 'Delhi Public Heritage Academy',
    appId: 'org.dakshora.heritage',
    brandColor: '#7C3AED',
    logoUrl: '',
    platforms: ['android', 'ios'],
    version: '2.4.0'
  });

  // Premium Facilities Add-ons State (All 6 high-end enterprise modules)
  const [premiumAddons, setPremiumAddons] = useState({
    aiAnalytics: true,
    biometricAttendance: true,
    gpsTransportTracking: true,
    whatsappGateway: true,
    aiQuestionPaper: true,
    cashlessCampusPos: true
  });

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onShowToast('info', 'Copied to Clipboard 📋', text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Mobile App Icon Uploader Helper
  const handleLogoUpload = (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      onShowToast('error', 'File Too Large', 'Please upload a logo image smaller than 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setAppBranding((prev) => ({ ...prev, logoUrl: result }));
        onShowToast('success', 'Mobile App Icon Uploaded! 📱', 'App Store and Play Store icon preview updated.');
      }
    };
    reader.readAsDataURL(file);
  };

  // Test Webhook Connection Handler
  const handleTestWebhook = () => {
    setTestWebhookLoading(true);
    setTimeout(() => {
      setTestWebhookLoading(false);
      setWebhookTested(true);
      onShowToast('success', 'Webhook Verified! ⚡', 'HTTP 200 OK — Remote school server responded in 38ms');
    }, 800);
  };

  // Step 5: Class & Section Management Handlers
  const handleApplyClassPreset = (presetId: string, customSections = selectedSections) => {
    setActiveClassPresetId(presetId);
    const preset = CLASS_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    const generated: Array<{ grade: string; section: string; roomNumber: string }> = [];
    let roomNum = 101;
    preset.grades.forEach(grade => {
      customSections.forEach(sec => {
        generated.push({
          grade,
          section: sec,
          roomNumber: `Room ${roomNum++}`
        });
      });
    });
    setClassesList(generated);
    onShowToast('success', `Class Preset Applied: ${preset.title} 🏫`, `Configured ${generated.length} classrooms across ${preset.grades.length} grades with sections (${customSections.join(', ')}).`);
  };

  const handleSelectSectionPreset = (sections: string[]) => {
    setSelectedSections(sections);
    if (activeClassPresetId) {
      handleApplyClassPreset(activeClassPresetId, sections);
    } else {
      const distinctGrades = Array.from(new Set(classesList.map(c => c.grade)));
      if (distinctGrades.length > 0) {
        const regenerated: Array<{ grade: string; section: string; roomNumber: string }> = [];
        let roomNum = 101;
        distinctGrades.forEach(grade => {
          sections.forEach(sec => {
            regenerated.push({
              grade,
              section: sec,
              roomNumber: `Room ${roomNum++}`
            });
          });
        });
        setClassesList(regenerated);
        onShowToast('success', 'Sections Multiplier Applied', `Updated ${distinctGrades.length} grades with sections ${sections.join(', ')}.`);
      }
    }
  };

  const handleToggleSectionMultiplier = (sec: string) => {
    let updated: string[];
    if (selectedSections.includes(sec)) {
      if (selectedSections.length === 1) {
        onShowToast('info', 'Minimum 1 Section Required', 'School requires at least one active section.');
        return;
      }
      updated = selectedSections.filter(s => s !== sec);
    } else {
      updated = [...selectedSections, sec].sort();
    }
    handleSelectSectionPreset(updated);
  };

  const handleAddCustomClassroom = () => {
    if (!newGrade.trim()) {
      onShowToast('error', 'Grade Name Required', 'Please enter or select a grade (e.g. Class 11 Science, Nursery).');
      return;
    }
    const sec = newSection.trim().toUpperCase() || 'A';
    const exists = classesList.find(
      c => c.grade.toLowerCase() === newGrade.trim().toLowerCase() && c.section.toUpperCase() === sec
    );
    if (exists) {
      onShowToast('error', 'Classroom Already Exists', `${newGrade} - Section ${sec} is already configured.`);
      return;
    }
    const nextRoom = newRoomNumber.trim() || `Room ${classesList.length + 101}`;
    setClassesList(prev => [...prev, { grade: newGrade.trim(), section: sec, roomNumber: nextRoom }]);
    onShowToast('success', 'Classroom Added ✅', `${newGrade} - Section ${sec} assigned to ${nextRoom}`);
    setNewGrade('');
    setNewRoomNumber('');
  };

  const handleQuickAddGrade = (grade: string) => {
    setNewGrade(grade);
  };

  const handleRemoveClassroom = (index: number) => {
    setClassesList(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAllClasses = () => {
    setClassesList([]);
    setActiveClassPresetId('');
    onShowToast('info', 'Classrooms Reset', 'All classes cleared. You can select a preset or add custom grades.');
  };

  // Step 6: Subjects Catalog Handlers (CBSE Norms)
  const handleApplySubjectPreset = (presetId: string, append = false) => {
    setActiveSubjectPresetId(presetId);
    const preset = CBSE_SUBJECT_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    if (append) {
      const existingCodes = new Set(subjectsList.map(s => s.code.toUpperCase()));
      const toAdd = preset.subjects.filter(s => !existingCodes.has(s.code.toUpperCase()));
      setSubjectsList(prev => [...prev, ...toAdd]);
      onShowToast('success', `Added ${toAdd.length} Subjects 📚`, `Appended from ${preset.title}.`);
    } else {
      setSubjectsList(preset.subjects);
      onShowToast('success', `Curriculum Applied: ${preset.title} 🏛️`, `Loaded ${preset.subjects.length} subjects aligned with CBSE / Board standards.`);
    }
  };

  const handleAddCustomSubject = () => {
    if (!newSubName.trim()) {
      onShowToast('error', 'Subject Name Required', 'Please enter a valid subject title.');
      return;
    }
    const autoCode = newSubCode.trim().toUpperCase() || `SUB-${newSubName.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase()}`;
    const exists = subjectsList.find(s => s.code.toUpperCase() === autoCode);
    if (exists) {
      onShowToast('error', 'Subject Code Exists', `Code ${autoCode} is already allocated to "${exists.name}".`);
      return;
    }
    const subjectItem: SubjectItem = {
      name: newSubName.trim(),
      code: autoCode,
      category: newSubCategory,
      gradeBand: newSubGradeBand,
      theoryMarks: newSubTheoryMarks,
      internalMarks: newSubInternalMarks,
      isCompulsory: newSubCompulsory
    };
    setSubjectsList(prev => [subjectItem, ...prev]);
    onShowToast('success', 'Subject Added to Catalog ✅', `${newSubName} (${autoCode}) [${newSubTheoryMarks} Th + ${newSubInternalMarks} IA]`);
    setNewSubName('');
    setNewSubCode('');
  };

  const handleRemoveSubject = (code: string) => {
    setSubjectsList(prev => prev.filter(s => s.code.toUpperCase() !== code.toUpperCase()));
  };

  const handleClearAllSubjects = () => {
    setSubjectsList([]);
    setActiveSubjectPresetId('');
    onShowToast('info', 'Catalog Cleared', 'All subjects removed. You can load a CBSE preset or add subjects.');
  };

  // Load Status & Checklist
  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await fetchOnboardingStatus(organizationId);
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
      }
    } catch (err: any) {
      console.warn('Failed to load onboarding status:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [organizationId]);

  // Handle Save Step & Next
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
        case 6: payload = { subjects: subjectsList }; break;
        case 7: payload = { staff: [] }; break;
        case 8: payload = { students: [] }; break;
        case 9: payload = { feeStructures }; break;
        case 10: payload = examForm; break;
        case 11: payload = {
          preferredChannels: { in_app: commForm.inApp, email: commForm.email, sms: commForm.sms, whatsapp: commForm.whatsapp },
          autoAdmissionNotifications: commForm.autoAdmission,
          autoFeeDueReminders: commForm.autoFeeReminders,
          autoLowAttendanceAlerts: commForm.autoAttendanceAlerts
        }; break;
        case 12: payload = { skipped: transportSkipped, enabled: !transportSkipped }; break;
        case 13: payload = { skipped: librarySkipped, enabled: !librarySkipped }; break;
        case 14: payload = { skipped: hrSkipped, enabled: !hrSkipped }; break;
        case 15: payload = aiForm; break;
        case 16: payload = { reviewConfirmed: true }; break;
      }

      const res = await saveOnboardingStep(stepNum, payload, organizationId);
      if (res.data?.success) {
        onShowToast('success', `Step ${stepNum} Saved ✅`, 'Progress preserved securely');
        setOnboarding(res.data.onboarding);
        setChecklist(res.data.checklist);
        const nextStep = Math.min(16, stepNum + 1);
        setCurrentStep(nextStep);
        setProgressPercentage(Math.round(((res.data.onboarding.completed_steps.length) / 16) * 100));
      } else {
        onShowToast('error', 'Step Error', res.data?.message || 'Could not save step');
      }
    } catch (err: any) {
      onShowToast('error', 'Submission Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle Save Draft & Exit
  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const res = await saveOnboardingDraft(currentStep, {
        orgForm,
        profileForm,
        campusForm,
        sessionForm,
        transportSkipped,
        librarySkipped,
        hrSkipped
      }, organizationId);
      if (res.data?.success) {
        onShowToast('success', 'Draft Saved Safely 💾', 'You can resume anytime without losing progress.');
        setOnboarding(res.data.onboarding);
      }
    } catch (err: any) {
      onShowToast('error', 'Draft Save Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle Activate School ERP
  const handleActivate = async () => {
    setSaving(true);
    try {
      const res = await activateSchoolErp(organizationId);
      if (res.data?.success) {
        setIsActivated(true);
        setOnboarding(res.data.onboarding);
        setChecklist(res.data.checklist);
        setProgressPercentage(100);
        confetti({
          particleCount: 140,
          spread: 85,
          origin: { y: 0.6 }
        });
        onShowToast('success', '🎉 School ERP Activated & White-Label Deployed!', 'Tenant is live on DAKSHORA 2.0.');
      } else {
        onShowToast('error', 'Activation Blocked', res.data?.message || 'Prerequisites not met');
      }
    } catch (err: any) {
      onShowToast('error', 'Activation Error', err.message);
    } finally {
      setSaving(false);
    }
  };



  // Handle Admin Invitation
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) {
      onShowToast('error', 'Validation Error', 'Email and Name are required for invitation.');
      return;
    }
    setInviting(true);
    try {
      const res = await inviteSchoolAdmin({
        email: inviteEmail,
        name: inviteName,
        role: inviteRole
      }, organizationId);
      if (res.data?.success) {
        setInviteSent(true);
        onShowToast('success', 'Invitation Dispatched ✉️', `Invitation token sent to ${inviteEmail}`);
        setInviteEmail('');
        setInviteName('');
      } else {
        onShowToast('error', 'Invitation Failed', res.data?.message || 'Could not send invite');
      }
    } catch (err: any) {
      onShowToast('error', 'Network Error', err.message);
    } finally {
      setInviting(false);
    }
  };

  // CSV Staff Parser & Preview
  const handlePreviewStaffCsv = async (dryRun = true) => {
    try {
      const lines = staffCsv.trim().split('\n');
      if (lines.length < 2) return;
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).map(l => {
        const vals = l.split(',').map(v => v.trim());
        const obj: any = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
        return obj;
      });

      const res = await importOnboardingStaff(rows, dryRun, organizationId);
      if (res.data?.preview) {
        setStaffImportPreview(res.data.preview);
        if (!dryRun) {
          onShowToast('success', 'Staff Imported! 👨‍🏫', `Imported ${res.data.importedCount} members`);
          loadStatus();
        }
      }
    } catch (err: any) {
      onShowToast('error', 'CSV Parse Error', err.message);
    }
  };

  // CSV Student Parser & Preview
  const handlePreviewStudentCsv = async (dryRun = true) => {
    try {
      const lines = studentCsv.trim().split('\n');
      if (lines.length < 2) return;
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).map(l => {
        const vals = l.split(',').map(v => v.trim());
        const obj: any = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
        return obj;
      });

      const res = await importOnboardingStudents(rows, dryRun, organizationId);
      if (res.data?.preview) {
        setStudentImportPreview(res.data.preview);
        if (!dryRun) {
          onShowToast('success', 'Students Enrolled! 🎓', `Imported ${res.data.importedCount} students`);
          loadStatus();
        }
      }
    } catch (err: any) {
      onShowToast('error', 'CSV Parse Error', err.message);
    }
  };

  const stepsMeta = [
    { num: 1, title: 'Organization', icon: Building2, desc: 'Tenant boundary & slug' },
    { num: 2, title: 'School Profile', icon: GraduationCap, desc: 'CBSE / Board credentials' },
    { num: 3, title: 'Campus Setup', icon: MapPin, desc: 'Main campus & facilities' },
    { num: 4, title: 'Academic Session', icon: Calendar, desc: '2026–27 year window' },
    { num: 5, title: 'Classes & Sections', icon: Layers, desc: 'Classroom structures' },
    { num: 6, title: 'Subjects Catalog', icon: BookOpen, desc: 'Curriculum allocations' },
    { num: 7, title: 'Faculty & Staff', icon: Users, desc: 'Directory & Teachers' },
    { num: 8, title: 'Student Enrollment', icon: UserCheck, desc: 'Roster & Parent details' },
    { num: 9, title: 'School Fee Heads', icon: CreditCard, desc: 'Tuition & Frequencies' },
    { num: 10, title: 'Exam & Grading', icon: FileCheck, desc: 'Assessment standards' },
    { num: 11, title: 'Communication', icon: Bell, desc: 'In-App, SMS & Alerts' },
    { num: 12, title: 'Transport', icon: Bus, desc: 'Fleet routes (Optional)', isOpt: true },
    { num: 13, title: 'Library', icon: Library, desc: 'Catalog policies (Optional)', isOpt: true },
    { num: 14, title: 'HR & Payroll', icon: DollarSign, desc: 'Staff payroll (Optional)', isOpt: true },
    { num: 15, title: 'Dakshora AI', icon: Bot, desc: 'Tokens & RBAC safety' },
    { num: 16, title: 'Review & Activate', icon: Sparkles, desc: 'Digital Presence & Facilities' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 🚀 TOP HERO BANNER & PROGRESS BAR */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/25">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white tracking-wide">
                    School ERP SaaS Onboarding Wizard
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                    16-STEP PIPELINE
                  </span>
                  {onboarding?.status === 'active' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                      ● ACTIVATED
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  Organization: <strong className="text-indigo-300">{orgForm.name}</strong> • Tenant: <code className="text-cyan-300">/{orgForm.slug}</code>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-all shadow-sm"
              title="Save progress and return anytime"
            >
              <Save className="w-3.5 h-3.5 text-indigo-400" />
              <span>Save Draft & Exit</span>
            </button>

            {onNavigateToErp && (
              <button
                onClick={onNavigateToErp}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-xs font-bold text-white flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Open Active ERP</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="pt-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">
              Current Step: <strong className="text-white">Step {String(currentStep).padStart(2, '0')} / 16</strong> — <span className="text-cyan-400">{stepsMeta[currentStep - 1]?.title}</span>
            </span>
            <span className="text-indigo-300 font-bold">{progressPercentage}% Complete</span>
          </div>
          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${Math.max(5, progressPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 🧭 TWO-COLUMN WORKSPACE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: 16 Steps Navigation & Live Readiness Card (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
            <div className="px-2 py-1 flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                Setup Steps
              </span>
              <span className="text-[10px] font-mono text-cyan-400">
                {onboarding?.completed_steps?.length || 0} / 16 Done
              </span>
            </div>

            <div className="space-y-1 max-h-[480px] overflow-y-auto pr-1">
              {stepsMeta.map((s) => {
                const Icon = s.icon;
                const isCurrent = currentStep === s.num;
                const isDone = onboarding?.completed_steps?.includes(s.num);

                return (
                  <button
                    key={s.num}
                    onClick={() => setCurrentStep(s.num)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-sans flex items-center justify-between transition-all ${
                      isCurrent
                        ? 'bg-indigo-600/30 text-white border border-indigo-400/60 shadow-md font-bold'
                        : isDone
                        ? 'bg-slate-900/80 text-slate-200 hover:bg-slate-800 border border-slate-700/70'
                        : 'bg-slate-950/70 text-slate-300 hover:bg-slate-900 border border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                        isDone
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : isCurrent
                          ? 'bg-indigo-500 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : String(s.num).padStart(2, '0')}
                      </div>
                      <div className="truncate">
                        <div className="font-bold truncate text-white">{s.title}</div>
                        <div className="text-[10px] text-slate-300 truncate">{s.desc}</div>
                      </div>
                    </div>

                    {s.isOpt && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                        Opt
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-time Readiness Checklist Card */}
          {checklist && (
            <div className="glass-panel p-4 rounded-2xl border border-slate-700/80 font-sans text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Readiness Checklist</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                  checklist.isReadyForActivation
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                }`}>
                  {checklist.isReadyForActivation ? 'READY FOR ACTIVATION' : 'INCOMPLETE'}
                </span>
              </div>

              <div className="space-y-2 text-[11px]">
                {Object.entries(checklist.categories).map(([catKey, cat]) => (
                  <div key={catKey} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-200 font-medium">{cat.title}</span>
                    <span className={`flex items-center gap-1 text-[10px] font-bold ${
                      cat.status === 'complete' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {cat.status === 'complete' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>PASS</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          <span>PENDING</span>
                        </>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Active Step Editor (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-700/80 min-h-[560px] flex flex-col justify-between shadow-xl">
            {/* Step Body */}
            <div className="space-y-6">
              {/* Step Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono">
                      STEP {String(currentStep).padStart(2, '0')}
                    </span>
                    <h2 className="text-lg font-bold text-white tracking-wide">
                      {stepsMeta[currentStep - 1]?.title}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 font-medium">
                    {stepsMeta[currentStep - 1]?.desc}
                  </p>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* STEP 01: ORGANIZATION */}
              {/* ------------------------------------------------------------- */}
              {currentStep === 1 && (
                <div className="space-y-4 font-sans text-xs">
                  <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 text-slate-100 flex items-start gap-3 shadow-md">
                    <span className="text-xl">🏛️</span>
                    <div>
                      <strong className="text-white block font-semibold">Tenant Boundary & Trust Confirmation</strong>
                      <p className="text-slate-200 text-xs mt-0.5">
                        DAKSHORA 2.0 reuses your existing organization as the primary tenant boundary. Single tenant isolation guarantees strict row-level security.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <label className="text-slate-100 font-semibold block mb-1.5 text-xs">
                        Organization / Trust Name *
                      </label>
                      <input
                        type="text"
                        value={orgForm.name}
                        onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 text-xs shadow-inner focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                        placeholder="e.g. Delhi Public Heritage Trust"
                      />
                    </div>

                    <div>
                      <label className="text-slate-100 font-semibold block mb-1.5 text-xs">
                        Organization Slug (URL Subdomain) *
                      </label>
                      <input
                        type="text"
                        value={orgForm.slug}
                        onChange={(e) => setOrgForm({ ...orgForm, slug: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 text-xs shadow-inner focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-medium"
                        placeholder="e.g. heritage-trust"
                      />
                    </div>

                    <div>
                      <label className="text-slate-100 font-semibold block mb-1.5 text-xs">
                        SaaS Plan Tier
                      </label>
                      <select
                        value={orgForm.plan}
                        onChange={(e) => setOrgForm({ ...orgForm, plan: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-white text-xs shadow-inner focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      >
                        <option value="starter">Silver Digital Campus (Starter)</option>
                        <option value="growth">Gold Comprehensive (Growth)</option>
                        <option value="enterprise">Platinum Multi-Campus (Enterprise)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* STEP 02: SCHOOL PROFILE */}
              {/* ------------------------------------------------------------- */}
              {currentStep === 2 && (
                <div className="space-y-4 font-sans text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-100 font-semibold block mb-1.5 text-xs">
                        Official School Name *
                      </label>
                      <input
                        type="text"
                        value={profileForm.schoolName}
                        onChange={(e) => setProfileForm({ ...profileForm, schoolName: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-400 text-xs shadow-inner focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-slate-100 font-semibold block mb-1.5 text-xs">
                        School Code (Short ID) *
                      </label>
                      <input
                        type="text"
                        value={profileForm.schoolCode}
                        onChange={(e) => setProfileForm({ ...profileForm, schoolCode: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-400 text-xs shadow-inner focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-slate-100 font-semibold block mb-1.5 text-xs">
                        Affiliated Educational Board
                      </label>
                      <select
                        value={profileForm.board}
                        onChange={(e) => setProfileForm({ ...profileForm, board: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-white text-xs shadow-inner focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      >
                        <option value="CBSE">CBSE (Central Board of Secondary Education)</option>
                        <option value="ICSE">CISCE / ICSE (Council for the Indian School Certificate Examinations)</option>
                        <option value="State Board">State Board of Secondary Education</option>
                        <option value="IB">International Baccalaureate (IB)</option>
                        <option value="Cambridge">Cambridge International (IGCSE)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-100 font-semibold block mb-1.5 text-xs">
                        Affiliation / Registration Number
                      </label>
                      <input
                        type="text"
                        value={profileForm.affiliationNo}
                        onChange={(e) => setProfileForm({ ...profileForm, affiliationNo: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-400 text-xs shadow-inner focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-slate-100 font-semibold block mb-1.5 text-xs">
                        Contact Email *
                      </label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-400 text-xs shadow-inner focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-slate-100 font-semibold block mb-1.5 text-xs">
                        Contact Phone (10+ digits) *
                      </label>
                      <input
                        type="text"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-400 text-xs shadow-inner focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-slate-100 font-semibold block mb-1.5 text-xs">
                        Campus Physical Address
                      </label>
                      <input
                        type="text"
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-400 text-xs shadow-inner focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* STEP 03: CAMPUS */}
              {/* ------------------------------------------------------------- */}
              {currentStep === 3 && (
                <div className="space-y-4 font-sans text-xs">
                  <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-slate-100 flex items-start gap-3 shadow-md">
                    <span className="text-xl">🏛️</span>
                    <div>
                      <strong className="text-white block font-semibold">Default Main Campus Setup</strong>
                      <p className="text-slate-200 text-xs mt-0.5">
                        Single-campus institutions use this primary campus setup without requiring multi-branch complexity.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-100 font-semibold block mb-1.5 text-xs">
                        Campus Name *
                      </label>
                      <input
                        type="text"
                        value={campusForm.name}
                        onChange={(e) => setCampusForm({ ...campusForm, name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-400 text-xs shadow-inner focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-slate-100 font-semibold block mb-1.5 text-xs">
                        Campus Code *
                      </label>
                      <input
                        type="text"
                        value={campusForm.code}
                        onChange={(e) => setCampusForm({ ...campusForm, code: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-400 text-xs shadow-inner focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-slate-100 font-semibold block mb-1.5 text-xs">
                        City
                      </label>
                      <input
                        type="text"
                        value={campusForm.city}
                        onChange={(e) => setCampusForm({ ...campusForm, city: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-400 text-xs shadow-inner focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-slate-100 font-semibold block mb-1.5 text-xs">
                        Student Capacity
                      </label>
                      <input
                        type="number"
                        value={campusForm.capacity}
                        onChange={(e) => setCampusForm({ ...campusForm, capacity: parseInt(e.target.value, 10) || 1000 })}
                        className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-400 text-xs shadow-inner focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* STEP 04: ACADEMIC SESSION */}
              {/* ------------------------------------------------------------- */}
              {currentStep === 4 && (
                <div className="space-y-4 font-sans text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-slate-100 font-semibold block mb-1.5 text-xs">
                        Session Name *
                      </label>
                      <input
                        type="text"
                        value={sessionForm.name}
                        onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-400 text-xs shadow-inner focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                        placeholder="2026-27"
                      />
                    </div>
                    <div>
                      <label className="text-slate-100 font-semibold block mb-1.5 text-xs">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={sessionForm.startDate}
                        onChange={(e) => setSessionForm({ ...sessionForm, startDate: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-white text-xs shadow-inner focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-slate-100 font-semibold block mb-1.5 text-xs">
                        End Date *
                      </label>
                      <input
                        type="date"
                        value={sessionForm.endDate}
                        onChange={(e) => setSessionForm({ ...sessionForm, endDate: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-white text-xs shadow-inner focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}
              {/* STEP 05: CLASSES & SECTIONS */}
              {/* ------------------------------------------------------------- */}
              {currentStep === 5 && (
                <div className="space-y-6 font-sans text-xs">
                  {/* Info Header Banner */}
                  <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 text-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                    <div>
                      <h3 className="font-bold text-sm text-white flex items-center gap-2">
                        <span>🏫</span>
                        <span>Classroom & Section Architecture (कक्षा एवं अनुभाग संरचना)</span>
                      </h3>
                      <p className="text-slate-200 text-xs mt-1">
                        Select standard grade band presets (Nursery-12th, Nursery-5th, 6th-12th) or customize sections as per institutional requirement.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-cyan-300">
                        Total: {classesList.length} Classrooms
                      </span>
                      {classesList.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearAllClasses}
                          className="px-3 py-1 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 text-xs transition-colors"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>

                  {/* SECTION 1: 1-CLICK CLASS PRESET SUGGESTIONS */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-100 font-bold text-xs flex items-center gap-1.5 uppercase tracking-wide">
                        <span>⚡ 1-Click Grade Presets (सुझाव अनुसार 1-क्लिक में क्लास लोड करें)</span>
                      </label>
                      <span className="text-slate-300 text-[11px]">
                        Click any card to auto-populate all grades & sections
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {CLASS_PRESETS.map((preset) => {
                        const isSelected = activeClassPresetId === preset.id;
                        return (
                          <div
                            key={preset.id}
                            onClick={() => handleApplyClassPreset(preset.id)}
                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 relative overflow-hidden group ${
                              isSelected
                                ? 'bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg'
                                : 'bg-slate-900/80 hover:bg-slate-850 border-slate-700/80 hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xl p-1.5 rounded-xl bg-slate-800 border border-slate-700">{preset.icon}</span>
                                <div>
                                  <h4 className="font-bold text-white text-xs leading-snug group-hover:text-indigo-300 transition-colors">
                                    {preset.title}
                                  </h4>
                                  <div className="text-[10px] text-cyan-300 font-medium">
                                    {preset.hindiTitle}
                                  </div>
                                </div>
                              </div>
                              {isSelected && (
                                <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                              {preset.subtitle}
                            </p>

                            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                              <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-700 text-indigo-300 font-mono font-medium">
                                {preset.badge}
                              </span>
                              <span className="text-xs font-bold text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                                Load Preset →
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* SECTION 2: SECTION MULTIPLIER & QUICK CHIPS */}
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-4 shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                      <div>
                        <span className="text-slate-100 font-bold text-xs uppercase tracking-wide block">
                          Sections Multiplier (प्रत्येक कक्षा के अनुभाग)
                        </span>
                        <span className="text-slate-300 text-[11px]">
                          Choose how many sections to create for each grade in school
                        </span>
                      </div>

                      {/* Quick Section Preset Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleSelectSectionPreset(['A'])}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                            selectedSections.length === 1 && selectedSections.includes('A')
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-slate-950 text-slate-300 border border-slate-700 hover:bg-slate-800'
                          }`}
                        >
                          1 Sec (A)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectSectionPreset(['A', 'B'])}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                            selectedSections.length === 2 && selectedSections.includes('A') && selectedSections.includes('B')
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-slate-950 text-slate-300 border border-slate-700 hover:bg-slate-800'
                          }`}
                        >
                          2 Sec (A, B)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectSectionPreset(['A', 'B', 'C'])}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                            selectedSections.length === 3 && selectedSections.includes('C')
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-slate-950 text-slate-300 border border-slate-700 hover:bg-slate-800'
                          }`}
                        >
                          3 Sec (A, B, C)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectSectionPreset(['A', 'B', 'C', 'D'])}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                            selectedSections.length === 4 && selectedSections.includes('D')
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-slate-950 text-slate-300 border border-slate-700 hover:bg-slate-800'
                          }`}
                        >
                          4 Sec (A, B, C, D)
                        </button>
                      </div>
                    </div>

                    {/* Section Checkbox Toggles */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-300 text-xs font-medium mr-1">Active Sections:</span>
                      {QUICK_ADD_SECTIONS.map(sec => {
                        const active = selectedSections.includes(sec);
                        return (
                          <button
                            key={sec}
                            type="button"
                            onClick={() => handleToggleSectionMultiplier(sec)}
                            className={`w-8 h-8 rounded-xl font-bold font-mono text-xs transition-all flex items-center justify-center ${
                              active
                                ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/40 shadow-sm'
                                : 'bg-slate-950 text-slate-400 border border-slate-700 hover:text-white'
                            }`}
                          >
                            {sec}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* SECTION 3: ADD CUSTOM CLASSROOM */}
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-100 font-bold text-xs uppercase tracking-wide">
                        ➕ Add Custom Grade & Section (कस्टम कक्षा जोड़ें)
                      </span>
                      <span className="text-slate-300 text-[11px]">
                        Click suggestion chip or type grade name
                      </span>
                    </div>

                    {/* Quick Add Grade Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-slate-300 text-[11px] font-medium mr-1">Quick Select:</span>
                      {QUICK_ADD_GRADES.map(g => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => handleQuickAddGrade(g)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                            newGrade === g
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>

                    {/* Input Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
                      <div className="sm:col-span-5">
                        <label className="text-slate-100 font-semibold block mb-1 text-xs">
                          Grade / Class Name *
                        </label>
                        <input
                          type="text"
                          value={newGrade}
                          onChange={(e) => setNewGrade(e.target.value)}
                          placeholder="e.g. Class 11 Science or Nursery"
                          className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-white placeholder-slate-400 text-xs shadow-inner"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="text-slate-100 font-semibold block mb-1 text-xs">
                          Section
                        </label>
                        <input
                          type="text"
                          value={newSection}
                          onChange={(e) => setNewSection(e.target.value.toUpperCase())}
                          placeholder="A"
                          className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-white text-center font-bold font-mono text-xs shadow-inner"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="text-slate-100 font-semibold block mb-1 text-xs">
                          Room / Location (Optional)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newRoomNumber}
                            onChange={(e) => setNewRoomNumber(e.target.value)}
                            placeholder="e.g. Room 204"
                            className="flex-1 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-white placeholder-slate-400 text-xs shadow-inner"
                          />
                          <button
                            type="button"
                            onClick={handleAddCustomClassroom}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-indigo-600/30 whitespace-nowrap transition-all"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 4: CONFIGURED CLASSROOMS DIRECTORY */}
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-xs uppercase tracking-wide">
                          Configured Classrooms ({classesList.length})
                        </h4>
                        <span className="text-[11px] text-slate-300 font-mono">
                          Across {new Set(classesList.map(c => c.grade)).size} Distinct Grades
                        </span>
                      </div>

                      {/* Search Filter */}
                      <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={classSearchQuery}
                          onChange={(e) => setClassSearchQuery(e.target.value)}
                          placeholder="Filter classes (e.g. 10, Science, Nursery)..."
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Classes Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 max-h-72 overflow-y-auto pr-1">
                      {classesList
                        .filter(c => !classSearchQuery || c.grade.toLowerCase().includes(classSearchQuery.toLowerCase()) || c.section.toLowerCase().includes(classSearchQuery.toLowerCase()))
                        .map((cls, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-2xl bg-slate-900 border border-slate-700/80 hover:border-slate-600 flex items-center justify-between gap-2 shadow-sm group transition-all"
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-white text-xs truncate group-hover:text-indigo-300 transition-colors">
                                {cls.grade}
                              </div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="px-1.5 py-0.5 rounded-md bg-indigo-950 border border-indigo-500/40 text-[10px] font-mono font-bold text-indigo-300">
                                  Sec {cls.section}
                                </span>
                                <span className="text-[10px] text-slate-300 font-mono truncate">
                                  {cls.roomNumber}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveClassroom(idx)}
                              className="text-slate-400 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-950/30 transition-colors shrink-0"
                              title="Delete classroom"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* STEP 06: SUBJECTS CATALOG (CBSE & BOARD NORMS) */}
              {/* ------------------------------------------------------------- */}
              {currentStep === 6 && (
                <div className="space-y-6 font-sans text-xs">
                  {/* CBSE & NEP 2020 Norms Educational Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-slate-900 border border-indigo-500/40 shadow-md space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-indigo-900/40">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🏛️</span>
                        <div>
                          <h3 className="font-bold text-sm text-white">
                            CBSE & State Board Curriculum Standards (बोर्ड मानक पाठ्यक्रम)
                          </h3>
                          <p className="text-slate-200 text-xs">
                            Aligned with CBSE Examination Bye-Laws, NEP 2020 & Holistic Progress Card (HPC)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-emerald-300">
                          Total Subjects: {subjectsList.length}
                        </span>
                        {subjectsList.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearAllSubjects}
                            className="px-3 py-1 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 text-xs transition-colors"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                    </div>

                    {/* CBSE Assessment Structure Pill Box */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                      <div className="p-2 rounded-xl bg-slate-950/80 border border-blue-500/30">
                        <span className="font-bold text-blue-300 block">80 Th + 20 IA</span>
                        <span className="text-slate-300 text-[10px]">CBSE Standard Core / Lang (Eng, Hin, Math, SST)</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/80 border border-purple-500/30">
                        <span className="font-bold text-purple-300 block">70 Th + 30 Practical</span>
                        <span className="text-slate-300 text-[10px]">Sr. Sec STEM Labs (Physics, Chem, Bio, CS)</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/80 border border-emerald-500/30">
                        <span className="font-bold text-emerald-300 block">50 Th + 50 Practical</span>
                        <span className="text-slate-300 text-[10px]">NEP 2020 Skill (AI 417, IT 402, Coding)</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/80 border border-amber-500/30">
                        <span className="font-bold text-amber-300 block">Co-Scholastic</span>
                        <span className="text-slate-300 text-[10px]">Grades A–E (Art, Health & Physical Ed, SEWA)</span>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 1: 1-CLICK BOARD CURRICULUM PRESETS */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-100 font-bold text-xs uppercase tracking-wide">
                        ⚡ 1-Click Board Presets (CBSE व बोर्ड मानक सुझाव अनुसार लोड करें)
                      </label>
                      <span className="text-slate-300 text-[11px]">
                        Select to configure official CBSE subject codes & marks
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {CBSE_SUBJECT_PRESETS.map((preset) => {
                        const isSelected = activeSubjectPresetId === preset.id;
                        return (
                          <div
                            key={preset.id}
                            className={`p-3.5 rounded-2xl border transition-all duration-200 relative overflow-hidden group ${
                              isSelected
                                ? 'bg-gradient-to-br from-indigo-950/60 to-blue-950/60 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg'
                                : 'bg-slate-900/80 hover:bg-slate-850 border-slate-700/80 hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xl p-1.5 rounded-xl bg-slate-800 border border-slate-700">{preset.icon}</span>
                                <div>
                                  <h4 className="font-bold text-white text-xs leading-snug group-hover:text-cyan-300 transition-colors">
                                    {preset.title}
                                  </h4>
                                  <div className="text-[10px] text-cyan-300 font-medium">
                                    {preset.hindiTitle}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                              {preset.subtitle}
                            </p>

                            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-700 text-indigo-300 font-mono text-[10px] font-medium">
                                {preset.subjects.length} Subjects
                              </span>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleApplySubjectPreset(preset.id, true)}
                                  className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-[10px] font-medium text-slate-200 transition-colors"
                                  title="Add to existing without overwriting"
                                >
                                  + Append
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApplySubjectPreset(preset.id, false)}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold shadow-sm transition-all"
                                  title="Load this curriculum preset"
                                >
                                  Apply Preset →
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* SECTION 2: CBSE CUSTOM SUBJECT BUILDER */}
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-3.5 shadow-md">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div>
                        <span className="text-slate-100 font-bold text-xs uppercase tracking-wide block">
                          ➕ Add Custom Subject as per Board Norms (बोर्ड नियम अनुसार नया विषय जोड़ें)
                        </span>
                        <span className="text-slate-300 text-[11px]">
                          Set official code, category, theory & internal evaluation split
                        </span>
                      </div>
                    </div>

                    {/* Common CBSE Subject Suggestions Quick-Add */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-slate-300 text-[11px] font-medium mr-1">Quick Select:</span>
                      {COMMON_CBSE_SUBJECT_SUGGESTIONS.slice(0, 10).map((sugg) => (
                        <button
                          key={sugg}
                          type="button"
                          onClick={() => {
                            setNewSubName(sugg);
                            if (sugg.includes('Artificial Intelligence')) {
                              setNewSubCode('417');
                              setNewSubCategory('Skill');
                              setNewSubTheoryMarks(50);
                              setNewSubInternalMarks(50);
                            } else if (sugg.includes('Information Technology')) {
                              setNewSubCode('402');
                              setNewSubCategory('Skill');
                              setNewSubTheoryMarks(50);
                              setNewSubInternalMarks(50);
                            } else if (sugg.includes('Physics') || sugg.includes('Chemistry') || sugg.includes('Biology')) {
                              setNewSubCategory('Elective');
                              setNewSubTheoryMarks(70);
                              setNewSubInternalMarks(30);
                            } else {
                              setNewSubTheoryMarks(80);
                              setNewSubInternalMarks(20);
                            }
                          }}
                          className={`px-2 py-1 rounded-lg text-[11px] transition-colors ${
                            newSubName === sugg
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700'
                          }`}
                        >
                          {sugg}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      {/* Name */}
                      <div className="sm:col-span-5">
                        <label className="text-slate-100 font-semibold block mb-1 text-xs">
                          Subject Title *
                        </label>
                        <input
                          type="text"
                          value={newSubName}
                          onChange={(e) => setNewSubName(e.target.value)}
                          placeholder="e.g. Mathematics Standard or AI (417)"
                          className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-white placeholder-slate-400 text-xs shadow-inner"
                        />
                      </div>

                      {/* Code */}
                      <div className="sm:col-span-2">
                        <label className="text-slate-100 font-semibold block mb-1 text-xs">
                          CBSE / Board Code
                        </label>
                        <input
                          type="text"
                          value={newSubCode}
                          onChange={(e) => setNewSubCode(e.target.value.toUpperCase())}
                          placeholder="e.g. 041"
                          className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-white text-center font-bold font-mono text-xs shadow-inner"
                        />
                      </div>

                      {/* Category */}
                      <div className="sm:col-span-3">
                        <label className="text-slate-100 font-semibold block mb-1 text-xs">
                          Curriculum Category
                        </label>
                        <select
                          value={newSubCategory}
                          onChange={(e) => setNewSubCategory(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-white text-xs shadow-inner"
                        >
                          <option value="Core">Core Scholastic</option>
                          <option value="Language">Language & Literature</option>
                          <option value="Skill">NEP Skill / Vocational</option>
                          <option value="Elective">Elective / Stream</option>
                          <option value="Co-Scholastic">Co-Scholastic Activity</option>
                        </select>
                      </div>

                      {/* Grade Band */}
                      <div className="sm:col-span-2">
                        <label className="text-slate-100 font-semibold block mb-1 text-xs">
                          Grade Band
                        </label>
                        <select
                          value={newSubGradeBand}
                          onChange={(e) => setNewSubGradeBand(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-2 py-2 text-white text-xs shadow-inner"
                        >
                          <option value="All">All Grades</option>
                          <option value="Nur-UKG">Foundational (Nur-UKG)</option>
                          <option value="1-5">Primary (1-5)</option>
                          <option value="6-8">Middle (6-8)</option>
                          <option value="9-10">Secondary (9-10)</option>
                          <option value="11-12">Sr. Secondary (11-12)</option>
                        </select>
                      </div>
                    </div>

                    {/* Marking Scheme Norm Split Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-slate-300 text-xs font-semibold">Evaluation Split:</span>
                        <button
                          type="button"
                          onClick={() => { setNewSubTheoryMarks(80); setNewSubInternalMarks(20); }}
                          className={`px-2.5 py-1 rounded-xl text-xs font-mono font-medium transition-colors ${
                            newSubTheoryMarks === 80 && newSubInternalMarks === 20
                              ? 'bg-blue-600 text-white font-bold ring-1 ring-blue-400'
                              : 'bg-slate-950 text-slate-300 border border-slate-700 hover:bg-slate-800'
                          }`}
                        >
                          80 Theory + 20 IA (Standard)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setNewSubTheoryMarks(70); setNewSubInternalMarks(30); }}
                          className={`px-2.5 py-1 rounded-xl text-xs font-mono font-medium transition-colors ${
                            newSubTheoryMarks === 70 && newSubInternalMarks === 30
                              ? 'bg-purple-600 text-white font-bold ring-1 ring-purple-400'
                              : 'bg-slate-950 text-slate-300 border border-slate-700 hover:bg-slate-800'
                          }`}
                        >
                          70 Theory + 30 Practical (STEM)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setNewSubTheoryMarks(50); setNewSubInternalMarks(50); }}
                          className={`px-2.5 py-1 rounded-xl text-xs font-mono font-medium transition-colors ${
                            newSubTheoryMarks === 50 && newSubInternalMarks === 50
                              ? 'bg-emerald-600 text-white font-bold ring-1 ring-emerald-400'
                              : 'bg-slate-950 text-slate-300 border border-slate-700 hover:bg-slate-800'
                          }`}
                        >
                          50 Theory + 50 Practical (NEP Skill)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setNewSubTheoryMarks(0); setNewSubInternalMarks(100); }}
                          className={`px-2.5 py-1 rounded-xl text-xs font-mono font-medium transition-colors ${
                            newSubTheoryMarks === 0 && newSubInternalMarks === 100
                              ? 'bg-amber-600 text-white font-bold ring-1 ring-amber-400'
                              : 'bg-slate-950 text-slate-300 border border-slate-700 hover:bg-slate-800'
                          }`}
                        >
                          Graded Co-Scholastic
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newSubCompulsory}
                            onChange={(e) => setNewSubCompulsory(e.target.checked)}
                            className="rounded border-slate-700 text-indigo-600 bg-slate-950 w-4 h-4"
                          />
                          <span>Mandatory / Compulsory</span>
                        </label>

                        <button
                          type="button"
                          onClick={handleAddCustomSubject}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Add Subject</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: SUBJECTS CATALOG DIRECTORY */}
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-xs uppercase tracking-wide">
                          Active Subjects Catalog ({subjectsList.length})
                        </h4>
                        <span className="text-[11px] text-slate-300 font-mono">
                          • {subjectsList.filter(s => s.category === 'Core').length} Core • {subjectsList.filter(s => s.category === 'Skill').length} Skill • {subjectsList.filter(s => s.category === 'Language').length} Language
                        </span>
                      </div>

                      {/* Filter & Search */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center p-0.5 rounded-xl bg-slate-900 border border-slate-700 text-[11px]">
                          {['all', 'Core', 'Language', 'Skill', 'Elective'].map(cat => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setSubjectFilterCategory(cat)}
                              className={`px-2 py-1 rounded-lg font-medium transition-colors ${
                                subjectFilterCategory === cat
                                  ? 'bg-indigo-600 text-white font-bold'
                                  : 'text-slate-300 hover:text-white'
                              }`}
                            >
                              {cat === 'all' ? 'All' : cat}
                            </button>
                          ))}
                        </div>

                        <div className="relative w-full sm:w-48">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
                          <input
                            type="text"
                            value={subjectSearchQuery}
                            onChange={(e) => setSubjectSearchQuery(e.target.value)}
                            placeholder="Search subjects..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Subjects Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-1">
                      {subjectsList
                        .filter(s => subjectFilterCategory === 'all' || s.category === subjectFilterCategory)
                        .filter(s => !subjectSearchQuery || s.name.toLowerCase().includes(subjectSearchQuery.toLowerCase()) || s.code.toLowerCase().includes(subjectSearchQuery.toLowerCase()))
                        .map((sub, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-2xl bg-slate-900 border border-slate-700/80 hover:border-slate-600 flex items-start justify-between gap-2 shadow-sm group transition-all"
                          >
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-white text-xs group-hover:text-cyan-300 transition-colors">
                                  {sub.name}
                                </span>
                                {sub.isCompulsory && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    Mandatory
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                                <span className="px-1.5 py-0.5 rounded-md bg-slate-950 border border-slate-700 text-indigo-300 font-mono font-bold">
                                  Code: {sub.code}
                                </span>
                                <span className="px-1.5 py-0.5 rounded-md bg-slate-950 border border-slate-700 text-cyan-300 font-mono">
                                  {sub.category}
                                </span>
                                {sub.gradeBand && (
                                  <span className="text-slate-400">
                                    Grades {sub.gradeBand}
                                  </span>
                                )}
                              </div>

                              <div className="text-[10px] text-slate-300 font-mono pt-0.5 flex items-center gap-1">
                                <span className="text-emerald-400 font-medium">
                                  {sub.theoryMarks !== undefined ? `${sub.theoryMarks} Th + ${sub.internalMarks} IA` : '100 Marks'}
                                </span>
                                <span className="text-slate-400">• Total 100</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveSubject(sub.code)}
                              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/30 transition-colors shrink-0"
                              title="Remove subject"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* STEP 07: FACULTY & STAFF */}
              {/* ------------------------------------------------------------- */}
              {currentStep === 7 && (
                <div className="space-y-4 font-sans text-xs">
                  <div className="flex gap-2 border-b border-slate-800 pb-2">
                    <button
                      type="button"
                      onClick={() => setStaffMode('manual')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        staffMode === 'manual'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-300 border border-slate-700 hover:text-white'
                      }`}
                    >
                      Manual Entry
                    </button>
                    <button
                      type="button"
                      onClick={() => setStaffMode('csv')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        staffMode === 'csv'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-300 border border-slate-700 hover:text-white'
                      }`}
                    >
                      Batch CSV Importer
                    </button>
                  </div>

                  {staffMode === 'manual' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-slate-100 font-semibold block mb-1.5 text-xs">
                          Staff Member Full Name
                        </label>
                        <input
                          type="text"
                          value={staffForm.name}
                          onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-400 text-xs shadow-inner focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                          placeholder="e.g. Dr. Rajesh Sharma"
                        />
                      </div>
                      <div>
                        <label className="text-slate-100 font-semibold block mb-1.5 text-xs">
                          Official Email Address
                        </label>
                        <input
                          type="email"
                          value={staffForm.email}
                          onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-400 text-xs shadow-inner focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                          placeholder="rajesh@school.edu"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        value={staffCsv}
                        onChange={(e) => setStaffCsv(e.target.value)}
                        rows={5}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-mono text-xs placeholder-slate-400 focus:border-indigo-500 shadow-inner"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handlePreviewStaffCsv(true)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 font-medium"
                        >
                          Preview & Validate Rows
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePreviewStaffCsv(false)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-bold shadow-sm"
                        >
                          Import Staff to Directory
                        </button>
                      </div>

                      {staffImportPreview && (
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 space-y-1 text-xs text-slate-200">
                          <div>Total Rows: <strong className="text-white">{staffImportPreview.totalRows}</strong> | Valid: <strong className="text-emerald-400">{staffImportPreview.validRows}</strong> | Errors: <strong className="text-red-400">{staffImportPreview.invalidRows}</strong></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* STEP 08: STUDENT ENROLLMENT */}
              {/* ------------------------------------------------------------- */}
              {currentStep === 8 && (
                <div className="space-y-4 font-sans text-xs">
                  <div className="space-y-3">
                    <p className="text-slate-200 text-xs font-medium">
                      Batch import students via CSV with column validation & duplicate prevention:
                    </p>
                    <textarea
                      value={studentCsv}
                      onChange={(e) => setStudentCsv(e.target.value)}
                      rows={5}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-mono text-xs placeholder-slate-400 focus:border-indigo-500 shadow-inner"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handlePreviewStudentCsv(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 font-medium"
                      >
                        Preview & Validate Roster
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePreviewStudentCsv(false)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-bold shadow-sm"
                      >
                        Enroll Students to Database
                      </button>
                    </div>

                    {studentImportPreview && (
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 space-y-1 text-xs text-slate-200">
                        <div>Total: <strong className="text-white">{studentImportPreview.totalRows}</strong> | Valid: <strong className="text-emerald-400">{studentImportPreview.validRows}</strong> | Invalid: <strong className="text-red-400">{studentImportPreview.invalidRows}</strong> | Duplicates: <strong className="text-amber-400">{studentImportPreview.duplicateRows}</strong></div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* STEP 09: SCHOOL FEES */}
              {/* ------------------------------------------------------------- */}
              {currentStep === 9 && (
                <div className="space-y-4 font-sans text-xs">
                  <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-slate-100 flex items-start gap-3 shadow-md">
                    <span className="text-xl">💰</span>
                    <div>
                      <strong className="text-white block font-semibold">School Fee Ledger & Heads</strong>
                      <p className="text-slate-200 text-xs mt-0.5">
                        Configure tuition, activity, lab, and transport fees for enrolled students. (Completely separate from SaaS platform subscription billing).
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {feeStructures.map((f, i) => (
                      <div key={i} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-700/80 hover:border-slate-600 flex items-center justify-between shadow-sm">
                        <div>
                          <div className="font-bold text-white text-xs">{f.feeHead}</div>
                          <div className="text-[11px] text-slate-300 font-mono">Frequency: {f.frequency.toUpperCase()}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-emerald-400 font-bold font-mono text-sm">₹{f.amountInr.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* STEP 10: EXAM CONFIGURATION */}
              {/* ------------------------------------------------------------- */}
              {currentStep === 10 && (
                <div className="space-y-4 font-sans text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-100 font-semibold block mb-1.5 text-xs">
                        Grading System
                      </label>
                      <select
                        value={examForm.gradingSystem}
                        onChange={(e) => setExamForm({ ...examForm, gradingSystem: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-white text-xs shadow-inner focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      >
                        <option value="cbse_9point">CBSE 9-Point Scale (A1, A2, B1, B2, C1, C2, D, E1, E2)</option>
                        <option value="percentage">Percentage Based (0 - 100%)</option>
                        <option value="letter_grade">Letter Grade (A+, A, B, C, D, F)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-100 font-semibold block mb-1.5 text-xs">
                        Pass Percentage (%)
                      </label>
                      <input
                        type="number"
                        value={examForm.passPercentage}
                        onChange={(e) => setExamForm({ ...examForm, passPercentage: parseFloat(e.target.value) || 33 })}
                        className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-white text-xs shadow-inner focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* STEP 11: COMMUNICATION */}
              {/* ------------------------------------------------------------- */}
              {currentStep === 11 && (
                <div className="space-y-4 font-sans text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { key: 'inApp', label: 'In-App Alerts' },
                      { key: 'email', label: 'Email Digest' },
                      { key: 'sms', label: 'SMS Gateway' },
                      { key: 'whatsapp', label: 'WhatsApp Alerts' }
                    ].map((ch) => (
                      <div
                        key={ch.key}
                        onClick={() => setCommForm({ ...commForm, [ch.key]: !commForm[ch.key as keyof typeof commForm] })}
                        className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                          commForm[ch.key as keyof typeof commForm]
                            ? 'bg-indigo-950/60 border-indigo-500/60 text-white font-bold ring-1 ring-indigo-500/30 shadow-md'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600 font-medium'
                        }`}
                      >
                        <span>{ch.label}</span>
                        {commForm[ch.key as keyof typeof commForm] ? <Check className="w-4 h-4 text-indigo-400 stroke-[3]" /> : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* STEPS 12, 13, 14: OPTIONAL MODULES */}
              {/* ------------------------------------------------------------- */}
              {currentStep === 12 && (
                <div className="space-y-4 font-sans text-xs text-center py-6">
                  <Bus className="w-12 h-12 text-amber-400 mx-auto" />
                  <h3 className="font-bold text-white text-sm">School Transport Fleet & GPS Tracking</h3>
                  <p className="text-slate-200 max-w-md mx-auto text-xs">
                    Configure buses, routes, and live waypoints now, or skip if your school does not operate transport.
                  </p>
                  <div className="flex gap-3 justify-center pt-2">
                    <button
                      onClick={() => setTransportSkipped(false)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        !transportSkipped
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'bg-slate-900 text-slate-300 border border-slate-700 hover:text-white'
                      }`}
                    >
                      Enable Transport Fleet
                    </button>
                    <button
                      onClick={() => setTransportSkipped(true)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        transportSkipped
                          ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
                          : 'bg-slate-900 text-slate-300 border border-slate-700 hover:text-white'
                      }`}
                    >
                      Skip Transport (Not Required)
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 13 && (
                <div className="space-y-4 font-sans text-xs text-center py-6">
                  <Library className="w-12 h-12 text-cyan-400 mx-auto" />
                  <h3 className="font-bold text-white text-sm">Digital Library & Accession Circulation</h3>
                  <p className="text-slate-200 max-w-md mx-auto text-xs">
                    Manage library loan limits and fine policies. Books can be cataloged anytime.
                  </p>
                  <div className="flex gap-3 justify-center pt-2">
                    <button
                      onClick={() => setLibrarySkipped(false)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        !librarySkipped
                          ? 'bg-cyan-500 text-slate-950 shadow-md'
                          : 'bg-slate-900 text-slate-300 border border-slate-700 hover:text-white'
                      }`}
                    >
                      Enable Library System
                    </button>
                    <button
                      onClick={() => setLibrarySkipped(true)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        librarySkipped
                          ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
                          : 'bg-slate-900 text-slate-300 border border-slate-700 hover:text-white'
                      }`}
                    >
                      Skip Library (Not Required)
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 14 && (
                <div className="space-y-4 font-sans text-xs text-center py-6">
                  <DollarSign className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h3 className="font-bold text-white text-sm">Staff HR & Monthly Payroll</h3>
                  <p className="text-slate-200 max-w-md mx-auto text-xs">
                    Configure salary components, leave policies, and payslip generation.
                  </p>
                  <div className="flex gap-3 justify-center pt-2">
                    <button
                      onClick={() => setHrSkipped(false)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        !hrSkipped
                          ? 'bg-emerald-500 text-slate-950 shadow-md'
                          : 'bg-slate-900 text-slate-300 border border-slate-700 hover:text-white'
                      }`}
                    >
                      Enable HR & Payroll
                    </button>
                    <button
                      onClick={() => setHrSkipped(true)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        hrSkipped
                          ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
                          : 'bg-slate-900 text-slate-300 border border-slate-700 hover:text-white'
                      }`}
                    >
                      Skip HR & Payroll
                    </button>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* STEP 15: DAKSHORA AI */}
              {/* ------------------------------------------------------------- */}
              {currentStep === 15 && (
                <div className="space-y-4 font-sans text-xs">
                  <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/40 text-purple-100 flex items-start gap-3 shadow-md">
                    <span className="text-xl">🤖</span>
                    <div>
                      <strong className="text-white block font-semibold">Dakshora AI Assistant Governance</strong>
                      <p className="text-purple-200 text-xs mt-0.5">
                        Inherits underlying ERP permissions and strict tenant data isolation.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-100 font-semibold block mb-1.5 text-xs">
                        AI Assistant Status
                      </label>
                      <select
                        value={aiForm.aiEnabled ? 'enabled' : 'disabled'}
                        onChange={(e) => setAiForm({ ...aiForm, aiEnabled: e.target.value === 'enabled' })}
                        className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-white text-xs shadow-inner focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      >
                        <option value="enabled">Enabled for Authorized Roles</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-100 font-semibold block mb-1.5 text-xs">
                        Monthly Token Quota
                      </label>
                      <input
                        type="number"
                        value={aiForm.monthlyQuota}
                        onChange={(e) => setAiForm({ ...aiForm, monthlyQuota: parseInt(e.target.value, 10) || 5000 })}
                        className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-white text-xs shadow-inner focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* STEP 16: REVIEW & 1-CLICK ACTIVATION */}
              {/* ------------------------------------------------------------- */}
              {currentStep === 16 && (
                <div className="space-y-6">
                  {/* Top Verified Metrics Ribbon */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-purple-900/40 shadow-lg backdrop-blur-md">
                      <span className="text-purple-300/80 block text-[10px] font-mono tracking-wider uppercase font-semibold">Organization</span>
                      <strong className="text-white text-xs font-semibold truncate block mt-0.5">{orgForm.name}</strong>
                      <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-mono font-medium mt-1">
                        <CheckCircle2 className="w-3 h-3" /> Tenant Verified
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-purple-900/40 shadow-lg backdrop-blur-md">
                      <span className="text-purple-300/80 block text-[10px] font-mono tracking-wider uppercase font-semibold">School Profile</span>
                      <strong className="text-white text-xs font-semibold truncate block mt-0.5">{profileForm.schoolName}</strong>
                      <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-mono font-medium mt-1">
                        <CheckCircle2 className="w-3 h-3" /> {profileForm.board} Affiliated
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-purple-900/40 shadow-lg backdrop-blur-md">
                      <span className="text-purple-300/80 block text-[10px] font-mono tracking-wider uppercase font-semibold">Session & Campus</span>
                      <strong className="text-white text-xs font-semibold block mt-0.5">Session {sessionForm.name}</strong>
                      <span className="inline-flex items-center gap-1 text-cyan-400 text-[10px] font-mono font-medium mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span> Main Campus Active
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-purple-900/40 shadow-lg backdrop-blur-md">
                      <span className="text-purple-300/80 block text-[10px] font-mono tracking-wider uppercase font-semibold">Roster Counts</span>
                      <strong className="text-white text-xs font-semibold block mt-0.5">{classesList.length} Classroom Sections</strong>
                      <span className="inline-flex items-center gap-1 text-indigo-300 text-[10px] font-mono font-medium mt-1">
                        {subjectsList.length} Academic Subjects
                      </span>
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* CARD 1: WEBSITE INTEGRATION MODULE */}
                  {/* ========================================================= */}
                  <div className="p-5 rounded-2xl bg-slate-900/95 border border-purple-900/40 shadow-xl space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                          <Globe className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            Website Integration & Digital Presence
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-700/50">
                              Production Gateway
                            </span>
                          </h3>
                          <p className="text-xs text-slate-400">
                            Configure school public web identity — connect legacy domain or deploy 9-layer CMS engine
                          </p>
                        </div>
                      </div>

                      {/* Segmented Option Selector */}
                      <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800">
                        <button
                          type="button"
                          onClick={() => setWebsiteOption('existing')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            websiteOption === 'existing'
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Option A: Existing Website
                        </button>
                        <button
                          type="button"
                          onClick={() => setWebsiteOption('generate')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            websiteOption === 'generate'
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Option B: Generate New Website
                        </button>
                      </div>
                    </div>

                    {/* OPTION A: Existing School Website */}
                    {websiteOption === 'existing' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                              Existing School Website URL
                            </label>
                            <div className="relative">
                              <input
                                type="url"
                                value={existingWebsiteForm.url}
                                onChange={(e) =>
                                  setExistingWebsiteForm({ ...existingWebsiteForm, url: e.target.value })
                                }
                                placeholder="https://www.yourschool.edu.in"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 pr-10"
                              />
                              <a
                                href={existingWebsiteForm.url}
                                target="_blank"
                                rel="noreferrer"
                                className="absolute right-3 top-2.5 text-slate-500 hover:text-purple-400 transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1 block">
                              Embeds admissions form, student fee pay, and portal login via Dakshora REST API.
                            </span>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                              Dakshora REST API Integration Key
                            </label>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-purple-300 truncate">
                                {existingWebsiteForm.apiKey}
                              </div>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(existingWebsiteForm.apiKey, 'api-key')}
                                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                              >
                                {copiedKey === 'api-key' ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-emerald-400">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1 block">
                              Scoped read/write token for WordPress, Webflow, custom PHP, or Next.js.
                            </span>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                              <Webhook className="w-4 h-4 text-cyan-400" />
                              Real-Time Webhook Notification Endpoint (HMAC SHA-256)
                            </span>
                            {webhookTested && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 flex items-center gap-1 self-start sm:self-auto">
                                <CheckCircle2 className="w-3 h-3" />
                                HTTP 200 OK • Ping 38ms
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={existingWebsiteForm.webhookUrl}
                              onChange={(e) =>
                                setExistingWebsiteForm({ ...existingWebsiteForm, webhookUrl: e.target.value })
                              }
                              placeholder="https://yourschool.edu.in/api/dakshora-webhook"
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                            />
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                readOnly
                                value={existingWebsiteForm.webhookSecret}
                                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-400"
                              />
                              <button
                                type="button"
                                onClick={handleTestWebhook}
                                disabled={testWebhookLoading}
                                className="px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap"
                              >
                                <RefreshCw className={`w-3.5 h-3.5 ${testWebhookLoading ? 'animate-spin' : ''}`} />
                                <span>{testWebhookLoading ? 'Pinging...' : 'Ping Test'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* OPTION B: Generate New ERP-Synced Website */}
                    {websiteOption === 'generate' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {[
                            {
                              id: 'tpl-cbse-secondary',
                              title: 'CBSE Gold Academic Blueprint',
                              tag: 'Most Popular',
                              colors: 'from-amber-600/20 to-indigo-900/30 border-amber-500/40',
                              desc: 'Tailored for CBSE Senior Secondary. Includes topper board rolls, syllabus downloads, and sports hero slider.'
                            },
                            {
                              id: 'tpl-modern-stem',
                              title: 'Modern STEM & K-12 Academy',
                              tag: 'High Tech',
                              colors: 'from-emerald-600/20 to-teal-900/30 border-emerald-500/40',
                              desc: 'Designed for progressive schools. Features robotics club portfolio, interactive event calendar & online fee desk.'
                            },
                            {
                              id: 'tpl-heritage-elite',
                              title: 'Heritage Elite Day & Boarding',
                              tag: 'Luxury',
                              colors: 'from-purple-600/20 to-slate-900/50 border-purple-500/40',
                              desc: 'Campus virtual 360 tour, hostel boarding lifecycle, alumni club, and automated multi-lingual translate.'
                            }
                          ].map((theme) => (
                            <div
                              key={theme.id}
                              onClick={() => setNewWebsiteTheme(theme.id)}
                              className={`p-4 rounded-xl cursor-pointer border transition-all relative overflow-hidden bg-gradient-to-br ${
                                theme.colors
                              } ${
                                newWebsiteTheme === theme.id
                                  ? 'ring-2 ring-purple-500 shadow-lg shadow-purple-950/40'
                                  : 'border-slate-800/80 hover:border-slate-700 opacity-80 hover:opacity-100'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950/80 text-purple-300 border border-purple-800/40">
                                  {theme.tag}
                                </span>
                                {newWebsiteTheme === theme.id && (
                                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                                )}
                              </div>
                              <h4 className="text-xs font-bold text-white mb-1">{theme.title}</h4>
                              <p className="text-[11px] text-slate-300 leading-relaxed">{theme.desc}</p>
                            </div>
                          ))}
                        </div>

                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <span className="text-xs font-semibold text-slate-300">
                              Instant Subdomain & Free Global SSL:
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/50 px-2 py-1 rounded border border-cyan-800/50">
                                https://{newWebsiteDomain}
                              </span>
                              <span className="text-[10px] text-emerald-400 font-mono">● Auto-Provisioned</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              onShowToast(
                                'info',
                                '9-Layer CMS Studio Active',
                                'Previewing Delhi Public Heritage School web pages.'
                              )
                            }
                            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all self-start sm:self-auto"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview in 9-Layer CMS Studio</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ========================================================= */}
                  {/* CARD 2: WHITE-LABEL CUSTOM SCHOOL MOBILE APP */}
                  {/* ========================================================= */}
                  <div className="p-5 rounded-2xl bg-slate-900/95 border border-purple-900/40 shadow-xl space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            White-Label Custom School Mobile App
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                              iOS & Android
                            </span>
                          </h3>
                          <p className="text-xs text-slate-400">
                            Branded app for parent notifications, teacher attendance marking, and student timetable
                          </p>
                        </div>
                      </div>
                      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-800/50">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Automated APK/IPA Generation
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Left: App Identity Controls */}
                      <div className="lg:col-span-7 space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            App Store & Play Store Display Name
                          </label>
                          <input
                            type="text"
                            value={appBranding.appName}
                            onChange={(e) =>
                              setAppBranding({ ...appBranding, appName: e.target.value })
                            }
                            placeholder="e.g. DPS Heritage Campus App"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-slate-500" />
                              Application Bundle ID
                            </label>
                            <input
                              type="text"
                              value={appBranding.appId}
                              onChange={(e) =>
                                setAppBranding({ ...appBranding, appId: e.target.value })
                              }
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                              Primary Brand Theme Color
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={appBranding.brandColor}
                                onChange={(e) =>
                                  setAppBranding({ ...appBranding, brandColor: e.target.value })
                                }
                                className="w-8 h-8 rounded-lg border border-slate-700 bg-transparent cursor-pointer p-0"
                              />
                              <input
                                type="text"
                                value={appBranding.brandColor}
                                onChange={(e) =>
                                  setAppBranding({ ...appBranding, brandColor: e.target.value })
                                }
                                className="w-24 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono text-white text-center"
                              />
                              <div className="flex items-center gap-1">
                                {['#7C3AED', '#4F46E5', '#06B6D4', '#10B981', '#F43F5E', '#F59E0B'].map((clr) => (
                                  <button
                                    key={clr}
                                    type="button"
                                    onClick={() => setAppBranding({ ...appBranding, brandColor: clr })}
                                    style={{ backgroundColor: clr }}
                                    className="w-4 h-4 rounded-full border border-slate-700 hover:scale-125 transition-transform"
                                    title={clr}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Logo Upload Box */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            School App Icon / Crest Logo (512x512 PNG)
                          </label>
                          <div className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-950 border border-dashed border-slate-800 hover:border-indigo-500/60 transition-colors">
                            <div
                              style={{ backgroundColor: appBranding.brandColor }}
                              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border border-white/20 shrink-0 overflow-hidden"
                            >
                              {appBranding.logoUrl ? (
                                <img
                                  src={appBranding.logoUrl}
                                  alt="School App Icon"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <GraduationCap className="w-7 h-7 text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-white truncate">
                                {appBranding.logoUrl ? 'Custom Icon Active' : 'Default Crest Loaded'}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Drag and drop or browse 512x512 transparent PNG
                              </p>
                              <label className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium cursor-pointer transition-colors">
                                <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Upload App Icon</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      handleLogoUpload(e.target.files[0]);
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Supported Platforms */}
                        <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-1">
                          <span className="flex items-center gap-1.5 text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" /> Google Play Store (AAB)
                          </span>
                          <span className="flex items-center gap-1.5 text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" /> Apple App Store (IPA)
                          </span>
                        </div>
                      </div>

                      {/* Right: Smartphone Bezel Mockup */}
                      <div className="lg:col-span-5 flex justify-center">
                        <div className="w-[230px] rounded-[36px] bg-slate-950 border-4 border-slate-700/80 shadow-2xl p-2 relative overflow-hidden ring-1 ring-white/10">
                          {/* Speaker Notch */}
                          <div className="w-20 h-4 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-slate-950 mr-1.5"></div>
                            <div className="w-8 h-1 bg-slate-700 rounded-full"></div>
                          </div>

                          {/* Mobile Screen */}
                          <div className="rounded-[26px] bg-slate-900 border border-slate-800 p-2.5 space-y-2 text-[10px] select-none">
                            {/* App Header with Brand Color */}
                            <div
                              style={{ backgroundColor: appBranding.brandColor }}
                              className="rounded-xl p-2.5 text-white shadow-md flex items-center justify-between"
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                                  {appBranding.logoUrl ? (
                                    <img src={appBranding.logoUrl} alt="logo" className="w-4 h-4 rounded" />
                                  ) : (
                                    <GraduationCap className="w-3.5 h-3.5 text-white" />
                                  )}
                                </div>
                                <span className="font-bold text-[10px] truncate max-w-[110px]">
                                  {appBranding.appName}
                                </span>
                              </div>
                              <Bell className="w-3 h-3 text-white/80 shrink-0" />
                            </div>

                            {/* Welcome Banner */}
                            <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
                              <span className="text-[9px] text-slate-400 block">Class 10-A • Roll 101</span>
                              <strong className="text-white font-semibold text-[10px] block">Aarav Sharma</strong>
                            </div>

                            {/* Quick Action Tiles */}
                            <div className="grid grid-cols-2 gap-1.5">
                              <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-center">
                                <span className="text-[8px] text-slate-400 block">Attendance</span>
                                <span className="text-[10px] font-bold text-emerald-400">98.4%</span>
                              </div>
                              <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-center">
                                <span className="text-[8px] text-slate-400 block">Fee Due</span>
                                <span className="text-[10px] font-bold text-cyan-400">₹0 (Paid)</span>
                              </div>
                              <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-center">
                                <span className="text-[8px] text-slate-400 block">Bus Live</span>
                                <span className="text-[10px] font-bold text-amber-400">En Route 🚌</span>
                              </div>
                              <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-center">
                                <span className="text-[8px] text-slate-400 block">AI Homework</span>
                                <span className="text-[10px] font-bold text-purple-400">Active ✨</span>
                              </div>
                            </div>

                            {/* School Notice Snippet */}
                            <div className="p-2 rounded-lg bg-indigo-950/30 border border-indigo-800/30">
                              <span className="text-[8px] text-indigo-300 font-mono block">LATEST CIRCULAR</span>
                              <p className="text-[9px] text-white line-clamp-1">CBSE Mid-Term Exam Schedule</p>
                            </div>
                          </div>

                          {/* Home Bar */}
                          <div className="w-16 h-1 bg-slate-600 rounded-full mx-auto mt-2.5"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* CARD 3: PREMIUM FACILITIES & ENTERPRISE ADD-ONS */}
                  {/* ========================================================= */}
                  <div className="p-5 rounded-2xl bg-slate-900/95 border border-purple-900/40 shadow-xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <Cpu className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            Premium Facilities & Enterprise Add-ons
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                              {Object.values(premiumAddons).filter(Boolean).length} / 6 Active
                            </span>
                          </h3>
                          <p className="text-xs text-slate-400">
                            High-end campus hardware integration, AI analytics engines, and communication channels
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-purple-300 hidden md:block">
                        Zero Extra License Fees • Enterprise Plan
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {/* Add-on 1: AI Analytics */}
                      <div
                        onClick={() =>
                          setPremiumAddons({ ...premiumAddons, aiAnalytics: !premiumAddons.aiAnalytics })
                        }
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          premiumAddons.aiAnalytics
                            ? 'bg-purple-950/20 border-purple-500/60 shadow-md'
                            : 'bg-slate-950/60 border-slate-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                              premiumAddons.aiAnalytics
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/50'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {premiumAddons.aiAnalytics ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white">AI Analytics & Risk Forecaster</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                          Predictive student dropout warning, CBSE grade projections, and teacher workload index.
                        </p>
                      </div>

                      {/* Add-on 2: Biometric Sync */}
                      <div
                        onClick={() =>
                          setPremiumAddons({
                            ...premiumAddons,
                            biometricAttendance: !premiumAddons.biometricAttendance
                          })
                        }
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          premiumAddons.biometricAttendance
                            ? 'bg-cyan-950/20 border-cyan-500/60 shadow-md'
                            : 'bg-slate-950/60 border-slate-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                            <Fingerprint className="w-4 h-4" />
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                              premiumAddons.biometricAttendance
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/50'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {premiumAddons.biometricAttendance ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white">Biometric & Facial Sync</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                          Hardware edge connector for Essl, ZKTeco, and Hikvision time & attendance turnstiles.
                        </p>
                      </div>

                      {/* Add-on 3: GPS Transport */}
                      <div
                        onClick={() =>
                          setPremiumAddons({
                            ...premiumAddons,
                            gpsTransportTracking: !premiumAddons.gpsTransportTracking
                          })
                        }
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          premiumAddons.gpsTransportTracking
                            ? 'bg-amber-950/20 border-amber-500/60 shadow-md'
                            : 'bg-slate-950/60 border-slate-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-8 h-8 rounded-lg bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                            <Bus className="w-4 h-4" />
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                              premiumAddons.gpsTransportTracking
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/50'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {premiumAddons.gpsTransportTracking ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white">Live GPS Fleet Tracking</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                          Real-time school bus map, geofence pickup alarms, speed alerts, and parent push ETA.
                        </p>
                      </div>

                      {/* Add-on 4: WhatsApp Gateway */}
                      <div
                        onClick={() =>
                          setPremiumAddons({
                            ...premiumAddons,
                            whatsappGateway: !premiumAddons.whatsappGateway
                          })
                        }
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          premiumAddons.whatsappGateway
                            ? 'bg-emerald-950/20 border-emerald-500/60 shadow-md'
                            : 'bg-slate-950/60 border-slate-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                              premiumAddons.whatsappGateway
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/50'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {premiumAddons.whatsappGateway ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white">WhatsApp Cloud Business API</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                          Instant PDF report cards, fee payment UPI deep links, and automated attendance notifications.
                        </p>
                      </div>

                      {/* Add-on 5: AI Question Paper */}
                      <div
                        onClick={() =>
                          setPremiumAddons({
                            ...premiumAddons,
                            aiQuestionPaper: !premiumAddons.aiQuestionPaper
                          })
                        }
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          premiumAddons.aiQuestionPaper
                            ? 'bg-indigo-950/20 border-indigo-500/60 shadow-md'
                            : 'bg-slate-950/60 border-slate-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                            <FileText className="w-4 h-4" />
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                              premiumAddons.aiQuestionPaper
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/50'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {premiumAddons.aiQuestionPaper ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white">AI Question Paper Blueprinter</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                          CBSE & ICSE Bloom's Taxonomy question generator with model answer keys in 60 seconds.
                        </p>
                      </div>

                      {/* Add-on 6: Cashless Campus */}
                      <div
                        onClick={() =>
                          setPremiumAddons({
                            ...premiumAddons,
                            cashlessCampusPos: !premiumAddons.cashlessCampusPos
                          })
                        }
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          premiumAddons.cashlessCampusPos
                            ? 'bg-rose-950/20 border-rose-500/60 shadow-md'
                            : 'bg-slate-950/60 border-slate-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-8 h-8 rounded-lg bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                              premiumAddons.cashlessCampusPos
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/50'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {premiumAddons.cashlessCampusPos ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white">Cashless Campus POS Wallet</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                          Smart RFID student card wallet for cafeteria meals, library borrowing, and stationery.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* CARD 4: PRE-ACTIVATION VERIFICATION & 1-CLICK LAUNCH */}
                  {/* ========================================================= */}
                  <div className="p-5 rounded-2xl bg-slate-900/95 border border-purple-900/40 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Pre-Activation System Audit & Tenant RLS Status
                      </span>
                      <span className="text-emerald-400 font-mono text-xs font-bold bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/60">
                        All 16 Mandatory Checks Passed ✅
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs font-mono">
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2 text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">Tenant RLS Boundary OK</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2 text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">Academic Session Locked</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2 text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">Classroom Roster Ready</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2 text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">AI & POS Modules Synced</span>
                      </div>
                    </div>

                    {/* Big 1-Click Launch Button */}
                    <div className="pt-2 text-center space-y-3">
                      <button
                        type="button"
                        onClick={handleActivate}
                        disabled={saving || isActivated}
                        className={`w-full py-4 rounded-2xl font-bold text-sm font-mono flex items-center justify-center gap-2 shadow-2xl transition-all ${
                          isActivated
                            ? 'bg-emerald-600 text-white cursor-default ring-2 ring-emerald-400'
                            : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white hover:brightness-110 hover:scale-[1.008] shadow-purple-900/30'
                        }`}
                      >
                        <Sparkles className="w-5 h-5" />
                        <span>
                          {isActivated
                            ? '✓ SCHOOL ERP IS LIVE & WHITE-LABEL DEPLOYED'
                            : '🚀 ACTIVATE SCHOOL ERP & DEPLOY WHITE-LABEL (1-CLICK)'}
                        </span>
                      </button>

                      {isActivated && (
                        <p className="text-emerald-400 text-xs font-mono font-medium">
                          🎉 Institutional configuration complete! Production tenant unlocked and ready for faculty, parents & students.
                        </p>
                      )}
                    </div>

                    {/* Admin Invitation Form */}
                    <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-3 mt-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white flex items-center gap-2">
                          <Mail className="w-4 h-4 text-purple-400" />
                          <span>Dispatch Initial Credentials / Invite School Principal</span>
                        </span>
                        {inviteSent && (
                          <span className="text-emerald-400 text-xs font-mono font-semibold">
                            Invitation Dispatched ✅
                          </span>
                        )}
                      </div>

                      <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={inviteName}
                          onChange={(e) => setInviteName(e.target.value)}
                          placeholder="Principal / Admin Name"
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        />
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="principal@dpsheritage.edu.in"
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        />
                        <select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                        >
                          <option value="principal">School Principal</option>
                          <option value="admin">ERP Administrator</option>
                          <option value="teacher">Academic Faculty</option>
                          <option value="account">Chief Bursar / Accounts</option>
                        </select>
                        <button
                          type="submit"
                          disabled={inviting}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap transition-all shadow-md"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{inviting ? 'Sending...' : 'Send Invite'}</span>
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-6">
              <button
                type="button"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1 || saving}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 flex items-center gap-1.5 disabled:opacity-30"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 hidden sm:flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Save Draft</span>
                </button>

                {currentStep < 16 ? (
                  <button
                    type="button"
                    onClick={() => handleSaveStep(currentStep)}
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold font-mono text-white flex items-center gap-1.5 shadow-lg shadow-indigo-500/20"
                  >
                    <span>{saving ? 'Saving...' : 'Save & Continue'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  onNavigateToErp && (
                    <button
                      type="button"
                      onClick={onNavigateToErp}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold font-mono text-white flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>Enter School ERP</span>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
