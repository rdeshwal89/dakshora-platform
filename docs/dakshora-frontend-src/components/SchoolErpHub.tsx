import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  Calendar,
  BookOpen,
  FileCheck,
  CreditCard,
  UserPlus,
  Bell,
  Bus,
  Library,
  DollarSign,
  BarChart3,
  Bot,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Send,
  Download,
  Filter,
  Eye,
  Check,
  Phone,
  Mail,
  MapPin,
  Clock,
  Shield,
  Printer,
  Sparkles,
  RefreshCw,
  Award,
  ChevronRight,
  TrendingUp,
  FileText,
  LayoutDashboard,
  Settings,
  Building2,
  QrCode,
  Activity,
  Briefcase,
  BookMarked,
  Lock,
  Cpu,
  Code2,
  Rocket,
  Globe,
  ArrowLeft,
  MessageSquare,
  Grid,
  X,
  Layers,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut
} from 'lucide-react';
import {
  ErpRole,
  ErpModule,
  SaasEntitlements,
  ErpStudentRecord,
  ErpStaffRecord,
  ErpAttendanceRecord,
  ErpClassRecord,
  ErpExamRecord,
  ErpFeeInvoiceRecord,
  ErpAdmissionRecord,
  ErpNoticeRecord,
  ErpTransportRoute,
  ErpLibraryBook,
  ErpPayrollRecord,
  ErpSchoolSettings
} from '../types';
import {
  fetchErpStudents,
  createErpStudent,
  fetchErpStaff,
  createErpStaff,
  fetchErpAttendance,
  markErpAttendance,
  fetchErpAcademics,
  fetchErpExams,
  submitExamMarks,
  fetchErpFees,
  collectFeePayment,
  fetchErpAdmissions,
  updateAdmissionStatus,
  createErpAdmission,
  fetchErpCommunication,
  broadcastErpNotice,
  fetchErpTransport,
  fetchErpLibrary,
  issueLibraryBook,
  returnLibraryBook,
  fetchErpPayroll,
  processSalaryPayment,
  fetchErpReports,
  sendErpAiPrompt,
  fetchErpSettings,
  updateErpSettings,
  fetchEntitlements
} from '../services/api';
import { StudentManagementHub } from './StudentManagementHub';
import { StudentIdCardModal } from './StudentIdCardModal';
import { StaffManagementHub } from './StaffManagementHub';
import { AttendanceManagementHub } from './AttendanceManagementHub';
import { LiveDashboardHub } from './LiveDashboardHub';
import { AcademicsManagementHub } from './AcademicsManagementHub';
import { ExaminationManagementHub } from './ExaminationManagementHub';
import { FeesManagementHub } from './FeesManagementHub';
import { AdmissionsManagementHub } from './AdmissionsManagementHub';
import { LibraryManagementHub } from './LibraryManagementHub';
import { ReportsAnalyticsHub } from './ReportsAnalyticsHub';
import { DakshoraAiHub } from './DakshoraAiHub';
import { SchoolSettingsHub } from './SchoolSettingsHub';
import { TimetableManagementHub } from './TimetableManagementHub';
import { ParentStudentPortalHub } from './ParentStudentPortalHub';
import { TeacherPortalHub } from './TeacherPortalHub';
import { TeachingJournalHub } from './TeachingJournalHub';
import { RoboticsAcademyHub } from './RoboticsAcademyHub';
import { GlobalSearchModal } from './GlobalSearchModal';
import { SchoolBrandProfile, PRESET_SCHOOLS } from './SchoolBrandingModal';
import { LanguageSelector, useTranslation } from '../i18n';
import { ResponsiveSidebar } from './ResponsiveSidebar';
import { SchoolInfoModal } from './SchoolInfoModal';
import { PrincipalProfileModal } from './PrincipalProfileModal';

interface SchoolErpHubProps {
  currentUser?: any;
  onShowToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
  onSignOut?: () => void;
  onNavigateSurface?: (surface: any) => void;
}

// =========================================================================
// DEFAULT SEED DATA (High Quality, CBSE / ICSE Indian Standard)
// =========================================================================

const DEFAULT_STUDENTS: ErpStudentRecord[] = [
  {
    id: 'std-101',
    rollNo: 'DPS-2026-101',
    name: 'Aarav Sharma',
    grade: 'Class 10',
    section: 'A',
    gender: 'Male',
    dob: '2011-04-12',
    parentName: 'Vikram Sharma',
    parentPhone: '+91 98765 43210',
    parentEmail: 'vikram.sharma@gmail.com',
    address: 'Sector 45, Gurugram, Haryana',
    bloodGroup: 'B+',
    status: 'active',
    attendancePercent: 94.5,
    duesINR: 0,
  },
  {
    id: 'std-102',
    rollNo: 'DPS-2026-102',
    name: 'Ananya Verma',
    grade: 'Class 10',
    section: 'A',
    gender: 'Female',
    dob: '2011-08-25',
    parentName: 'Rajesh Verma',
    parentPhone: '+91 98111 22334',
    parentEmail: 'r.verma@techmail.in',
    address: 'DLF Phase 2, Gurugram, Haryana',
    bloodGroup: 'O+',
    status: 'active',
    attendancePercent: 98.2,
    duesINR: 4500,
  },
  {
    id: 'std-103',
    rollNo: 'DPS-2026-103',
    name: 'Rohan Gupta',
    grade: 'Class 9',
    section: 'B',
    gender: 'Male',
    dob: '2012-02-14',
    parentName: 'Sanjay Gupta',
    parentPhone: '+91 99887 76655',
    parentEmail: 'sanjay.gupta@biz.org',
    address: 'South City 1, Gurugram',
    bloodGroup: 'A+',
    status: 'active',
    attendancePercent: 88.0,
    duesINR: 12000,
  },
  {
    id: 'std-104',
    rollNo: 'DPS-2026-104',
    name: 'Isha Nair',
    grade: 'Class 12 (Science)',
    section: 'A',
    gender: 'Female',
    dob: '2009-11-03',
    parentName: 'Dr. K. Nair',
    parentPhone: '+91 94555 12345',
    parentEmail: 'k.nair@hospital.org',
    address: 'Golf Course Road, Gurugram',
    bloodGroup: 'AB+',
    status: 'active',
    attendancePercent: 96.0,
    duesINR: 0,
  },
  {
    id: 'std-105',
    rollNo: 'DPS-2026-105',
    name: 'Kabir Mehta',
    grade: 'Class 8',
    section: 'C',
    gender: 'Male',
    dob: '2013-06-18',
    parentName: 'Alok Mehta',
    parentPhone: '+91 97777 88990',
    parentEmail: 'alok.mehta@yahoo.com',
    address: 'Sushant Lok 1, Gurugram',
    bloodGroup: 'O-',
    status: 'active',
    attendancePercent: 91.5,
    duesINR: 8000,
  }
];

const DEFAULT_STAFF: ErpStaffRecord[] = [
  {
    id: 'stf-01',
    empId: 'FAC-01',
    name: 'Dr. Meenakshi Sundaram',
    role: 'admin',
    designation: 'Principal & Academic Director',
    department: 'Administration & Sciences',
    subjectSpecialization: 'Physics & Educational Leadership',
    email: 'principal@dpsheritage.edu.in',
    phone: '+91 98100 00111',
    salaryINR: 125000,
    joiningDate: '2018-06-01',
    status: 'active'
  },
  {
    id: 'stf-02',
    empId: 'FAC-02',
    name: 'Rajeev Malhotra',
    role: 'teacher',
    designation: 'Senior PGT Mathematics',
    department: 'Mathematics',
    subjectSpecialization: 'Calculus, Algebra, CBSE Senior Wing',
    email: 'rajeev.math@dpsheritage.edu.in',
    phone: '+91 98100 00222',
    salaryINR: 75000,
    joiningDate: '2020-04-15',
    status: 'active'
  },
  {
    id: 'stf-03',
    empId: 'FAC-03',
    name: 'Sunita Chawla',
    role: 'teacher',
    designation: 'TGT Science & STEM Coordinator',
    department: 'Sciences',
    subjectSpecialization: 'Robotics & Natural Sciences',
    email: 'sunita.science@dpsheritage.edu.in',
    phone: '+91 98100 00333',
    salaryINR: 65000,
    joiningDate: '2021-07-10',
    status: 'active'
  },
  {
    id: 'stf-04',
    empId: 'FAC-04',
    name: 'Amitabh Sen',
    role: 'accountant',
    designation: 'Chief Accounts & Bursar Officer',
    department: 'Accounts & Finance',
    subjectSpecialization: 'Fee Audits, Tally, Payroll & Taxes',
    email: 'accounts@dpsheritage.edu.in',
    phone: '+91 98100 00444',
    salaryINR: 68000,
    joiningDate: '2019-02-01',
    status: 'active'
  },
  {
    id: 'stf-05',
    empId: 'FAC-05',
    name: 'Ramesh Yadav',
    role: 'driver',
    designation: 'Senior Transport Captain',
    department: 'Transport',
    subjectSpecialization: 'Bus Route 04 (DLF & Golf Course)',
    email: 'transport@dpsheritage.edu.in',
    phone: '+91 98100 00555',
    salaryINR: 28000,
    joiningDate: '2022-01-10',
    status: 'active'
  },
  {
    id: 'stf-06',
    empId: 'FAC-06',
    name: 'Kavita Saxena',
    role: 'receptionist',
    designation: 'Front Desk Executive & Visitor Registrar',
    department: 'Front Desk / Reception',
    subjectSpecialization: 'Visitor Protocols, Admission Inquiries, Parent Concierge',
    email: 'reception@dpsheritage.edu.in',
    phone: '+91 98100 00666',
    salaryINR: 42000,
    joiningDate: '2021-08-10',
    status: 'active'
  }
];

const DEFAULT_CLASSES: ErpClassRecord[] = [
  {
    id: 'cls-10a',
    grade: 'Class 10',
    section: 'A',
    classTeacher: 'Rajeev Malhotra',
    roomNumber: 'Room 302',
    totalStudents: 38,
    subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'AI & Coding', 'Hindi'],
    timetable: [
      {
        day: 'Monday',
        periods: [
          { periodNumber: 1, timeSlot: '08:30 - 09:15 AM', subject: 'Mathematics', teacher: 'Rajeev Malhotra', room: '302' },
          { periodNumber: 2, timeSlot: '09:15 - 10:00 AM', subject: 'Physics', teacher: 'Dr. Meenakshi', room: 'Lab 1' },
          { periodNumber: 3, timeSlot: '10:15 - 11:00 AM', subject: 'English Lit.', teacher: 'Pooja Bhatia', room: '302' },
          { periodNumber: 4, timeSlot: '11:00 - 11:45 AM', subject: 'Social Science', teacher: 'Harish Roy', room: '302' },
          { periodNumber: 5, timeSlot: '12:15 - 01:00 PM', subject: 'AI & Robotics Lab', teacher: 'Sunita Chawla', room: 'AI Lab' },
          { periodNumber: 6, timeSlot: '01:00 - 01:45 PM', subject: 'Physical Ed / Sports', teacher: 'Coach R. Gill', room: 'Ground' },
        ]
      },
      {
        day: 'Tuesday',
        periods: [
          { periodNumber: 1, timeSlot: '08:30 - 09:15 AM', subject: 'Chemistry', teacher: 'Sunita Chawla', room: 'Chem Lab' },
          { periodNumber: 2, timeSlot: '09:15 - 10:00 AM', subject: 'Mathematics', teacher: 'Rajeev Malhotra', room: '302' },
          { periodNumber: 3, timeSlot: '10:15 - 11:00 AM', subject: 'Hindi Lit.', teacher: 'Kavita Joshi', room: '302' },
          { periodNumber: 4, timeSlot: '11:00 - 11:45 AM', subject: 'Biology', teacher: 'Dr. A. Sen', room: 'Bio Lab' },
          { periodNumber: 5, timeSlot: '12:15 - 01:00 PM', subject: 'Computer Sci', teacher: 'R. Saxena', room: 'IT Lab 2' },
          { periodNumber: 6, timeSlot: '01:00 - 01:45 PM', subject: 'Library & Research', teacher: 'P. Nair', room: 'Central Lib' },
        ]
      }
    ]
  }
];

const DEFAULT_EXAMS: ErpExamRecord[] = [
  {
    id: 'ex-2026-term1',
    title: 'Mid-Term Summative Assessment (Term 1)',
    grade: 'Class 10',
    term: 'Term 1',
    startDate: '2026-09-20',
    endDate: '2026-09-30',
    status: 'scheduled',
    marks: [
      {
        studentId: 'std-101',
        studentName: 'Aarav Sharma',
        subjects: [
          { subject: 'Mathematics', maxMarks: 100, obtainedMarks: 94 },
          { subject: 'Science', maxMarks: 100, obtainedMarks: 91 },
          { subject: 'English', maxMarks: 100, obtainedMarks: 88 },
          { subject: 'Social Science', maxMarks: 100, obtainedMarks: 90 },
          { subject: 'AI & Coding', maxMarks: 100, obtainedMarks: 98 }
        ],
        percentage: 92.2,
        gradeResult: 'A1 (Outstanding)'
      },
      {
        studentId: 'std-102',
        studentName: 'Ananya Verma',
        subjects: [
          { subject: 'Mathematics', maxMarks: 100, obtainedMarks: 98 },
          { subject: 'Science', maxMarks: 100, obtainedMarks: 96 },
          { subject: 'English', maxMarks: 100, obtainedMarks: 94 },
          { subject: 'Social Science', maxMarks: 100, obtainedMarks: 95 },
          { subject: 'AI & Coding', maxMarks: 100, obtainedMarks: 99 }
        ],
        percentage: 96.4,
        gradeResult: 'A1 (School Rank 1)'
      }
    ]
  }
];

const DEFAULT_FEES: ErpFeeInvoiceRecord[] = [
  {
    id: 'inv-101',
    invoiceNo: 'FEES-2026-Q2-01',
    studentId: 'std-101',
    studentName: 'Aarav Sharma',
    grade: 'Class 10-A',
    feeType: 'Tuition Fee',
    amountINR: 18500,
    dueDate: '2026-10-10',
    status: 'paid',
    paidAt: '2026-09-05',
    paymentMethod: 'UPI',
    receiptNo: 'RCP-982311'
  },
  {
    id: 'inv-102',
    invoiceNo: 'FEES-2026-Q2-02',
    studentId: 'std-102',
    studentName: 'Ananya Verma',
    grade: 'Class 10-A',
    feeType: 'Transport Fee',
    amountINR: 4500,
    dueDate: '2026-09-25',
    status: 'pending'
  },
  {
    id: 'inv-103',
    invoiceNo: 'FEES-2026-Q2-03',
    studentId: 'std-103',
    studentName: 'Rohan Gupta',
    grade: 'Class 9-B',
    feeType: 'Tuition Fee',
    amountINR: 12000,
    dueDate: '2026-09-01',
    status: 'overdue'
  }
];

const DEFAULT_ADMISSIONS: ErpAdmissionRecord[] = [
  {
    id: 'adm-01',
    inquiryNo: 'INQ-2026-781',
    studentName: 'Devansh Singhania',
    parentName: 'Vikrant Singhania',
    parentEmail: 'v.singhania@corp.com',
    phone: '+91 98999 11223',
    appliedGrade: 'Class 11 (Science PCM)',
    previousSchool: 'St. Xavier High School',
    status: 'entrance_tested',
    applicationDate: '2026-09-10',
    notes: 'Scored 94% in Aptitude & STEM test. Interview scheduled.'
  },
  {
    id: 'adm-02',
    inquiryNo: 'INQ-2026-782',
    studentName: 'Sanya Kapoor',
    parentName: 'Meera Kapoor',
    parentEmail: 'meera.k@gmail.com',
    phone: '+91 97111 44556',
    appliedGrade: 'Class 6',
    previousSchool: 'Lotus Valley Public',
    status: 'approved',
    applicationDate: '2026-09-12',
    notes: 'Fee payment pending for final admission seat confirmation.'
  }
];

const DEFAULT_NOTICES: ErpNoticeRecord[] = [
  {
    id: 'not-01',
    title: '🔔 CBSE Class 10 & 12 Pre-Board Date Sheet Announcement',
    content: 'The official datesheet for the upcoming Pre-Board examinations has been finalized. Morning shift begins 09:00 AM sharp.',
    category: 'exam',
    targetAudience: 'all',
    isUrgent: true,
    postedBy: 'Office of the Principal',
    postedAt: '15 Sep 2026, 10:00 AM',
    smsBroadcastSent: true
  },
  {
    id: 'not-02',
    title: '🚌 Revised Bus Timings for Route 04 (DLF & Golf Course)',
    content: 'Due to road maintenance on Cyber City corridor, morning pickup will be 10 minutes earlier starting this Thursday.',
    category: 'urgent',
    targetAudience: 'parents',
    isUrgent: true,
    postedBy: 'Transport Dept.',
    postedAt: '14 Sep 2026, 04:30 PM',
    smsBroadcastSent: true
  }
];

const DEFAULT_TRANSPORT: ErpTransportRoute[] = [
  {
    id: 'tr-01',
    routeNumber: 'BUS-04',
    routeName: 'Golf Course Road to Campus Super Express',
    vehicleNumber: 'HR 26 DQ 8890',
    driverName: 'Ramesh Yadav',
    driverPhone: '+91 98100 00555',
    capacity: 45,
    assignedStudentsCount: 41,
    currentStatus: 'on_route',
    stops: [
      { stopName: 'The Camellias, DLF 5', pickupTime: '07:20 AM', dropTime: '02:40 PM' },
      { stopName: 'Magnolias Gate 2', pickupTime: '07:30 AM', dropTime: '02:50 PM' },
      { stopName: 'Sector 54 Rapid Metro Station', pickupTime: '07:42 AM', dropTime: '03:05 PM' },
      { stopName: 'School Main Campus Hub', pickupTime: '08:05 AM', dropTime: '02:15 PM' }
    ]
  },
  {
    id: 'tr-02',
    routeNumber: 'BUS-08',
    routeName: 'Sohna Road - Subhash Chowk Connector',
    vehicleNumber: 'HR 26 EK 4412',
    driverName: 'Balwan Singh',
    driverPhone: '+91 98111 88991',
    capacity: 40,
    assignedStudentsCount: 36,
    currentStatus: 'idle',
    stops: [
      { stopName: 'Vipul Greens Gate 1', pickupTime: '07:25 AM', dropTime: '02:45 PM' },
      { stopName: 'Vatika City Market', pickupTime: '07:35 AM', dropTime: '02:55 PM' },
      { stopName: 'School Main Campus Hub', pickupTime: '08:10 AM', dropTime: '02:15 PM' }
    ]
  }
];

const DEFAULT_LIBRARY: ErpLibraryBook[] = [
  {
    id: 'bk-01',
    isbn: '978-0134685991',
    title: 'Effective Java (3rd Edition)',
    author: 'Joshua Bloch',
    category: 'Computer Science & AI',
    totalCopies: 8,
    availableCopies: 5,
    shelfLocation: 'Rack B-4 (CS/IT)',
    borrowedHistory: [
      { borrowerName: 'Aarav Sharma', borrowerRole: 'student', borrowedAt: '2026-09-08', dueDate: '2026-09-22', isReturned: false }
    ]
  },
  {
    id: 'bk-02',
    isbn: '978-0199147571',
    title: 'Complete Physics for Cambridge IGCSE',
    author: 'Stephen Pople',
    category: 'Sciences',
    totalCopies: 12,
    availableCopies: 9,
    shelfLocation: 'Rack A-2 (Physics)',
    borrowedHistory: []
  },
  {
    id: 'bk-03',
    isbn: '978-8174508126',
    title: 'Mathematics Class 10 (NCERT Official)',
    author: 'NCERT Council',
    category: 'Academics',
    totalCopies: 25,
    availableCopies: 18,
    shelfLocation: 'Rack C-1 (CBSE)',
    borrowedHistory: []
  }
];

const DEFAULT_PAYROLL: ErpPayrollRecord[] = [
  {
    id: 'pay-01',
    empId: 'FAC-01',
    staffName: 'Dr. Meenakshi Sundaram (Principal)',
    monthYear: 'August 2026',
    basicSalaryINR: 80000,
    hraINR: 24000,
    daINR: 16000,
    allowanceINR: 15000,
    pfDeductionINR: 4800,
    taxDeductionINR: 5200,
    netPayoutINR: 125000,
    paymentStatus: 'processed',
    disbursedDate: '2026-08-31'
  },
  {
    id: 'pay-02',
    empId: 'FAC-02',
    staffName: 'Rajeev Malhotra (PGT Math)',
    monthYear: 'August 2026',
    basicSalaryINR: 48000,
    hraINR: 14400,
    daINR: 9600,
    allowanceINR: 8000,
    pfDeductionINR: 2880,
    taxDeductionINR: 2120,
    netPayoutINR: 75000,
    paymentStatus: 'processed',
    disbursedDate: '2026-08-31'
  },
  {
    id: 'pay-03',
    empId: 'FAC-04',
    staffName: 'Amitabh Sen (Chief Accountant)',
    monthYear: 'September 2026',
    basicSalaryINR: 42000,
    hraINR: 12600,
    daINR: 8400,
    allowanceINR: 9800,
    pfDeductionINR: 2520,
    taxDeductionINR: 2280,
    netPayoutINR: 68000,
    paymentStatus: 'pending'
  }
];

export const SchoolErpHub: React.FC<SchoolErpHubProps> = ({ currentUser, onShowToast, onSignOut, onNavigateSurface }) => {
  const { t } = useTranslation();
  // Step 3: 6 Active Persona Roles (including Reception) - Initialized from authenticated role
  const [activeRole, setActiveRole] = useState<ErpRole>(() => {
    if (!currentUser) return 'admin';
    const r = (currentUser.role || '').toLowerCase();
    if (r === 'teacher' || r === 'faculty' || r === 'lecturer' || r === 'academic') return 'teacher';
    if (r === 'account' || r === 'accounts' || r === 'bursar') return 'account';
    if (r === 'reception' || r === 'frontdesk') return 'reception';
    if (r === 'parent') return 'parent';
    if (r === 'student') return 'student';
    return 'admin';
  });

  const isRoleLocked = Boolean(
    currentUser &&
    (currentUser.role === 'parent' || currentUser.role === 'student' || (!currentUser.isDemo && currentUser.role !== 'superadmin' && currentUser.role !== 'school-admin' && currentUser.role !== 'admin'))
  );

  // Step 2: 15-Item Layout - Defaults to Portal for Ward Persona, Dashboard for Admin/Staff
  const [activeModule, setActiveModule] = useState<ErpModule>(() => {
    const r = (currentUser?.role || '').toLowerCase();
    if (r === 'parent' || r === 'student') return 'portal';
    return 'dashboard';
  });
  const [entitlements, setEntitlements] = useState<SaasEntitlements | null>(null);

  useEffect(() => {
    async function loadEntitlements() {
      try {
        const res = await fetchEntitlements();
        if (res.data?.entitlements) {
          setEntitlements(res.data.entitlements);
        }
      } catch {}
    }
    loadEntitlements();
  }, []);

  // Step 4: Dynamic School Brand Morphing & 2026–27 Session
  const effectiveOrgId = currentUser?.organization_id || currentUser?.organizationId || currentUser?.org_id || "b17780e5-3832-4ac6-9aeb-33fd80c5cb0e";
  const [activeSession, setActiveSession] = useState<string>('2026-27');
  const [schoolBrand, setSchoolBrand] = useState<SchoolBrandProfile>(() => {
    try {
      const saved = localStorage.getItem('dakshora_school_brand');
      if (saved) return JSON.parse(saved);
      if (currentUser?.schoolName) {
        const match = Object.values(PRESET_SCHOOLS).find(p => p.schoolName.toLowerCase().includes(currentUser.schoolName.toLowerCase()));
        if (match) return match;
        return {
          schoolName: currentUser.schoolName,
          shortName: currentUser.schoolName.split(' ')[0],
          board: 'CBSE (Central Board of Secondary Education)',
          affiliationNo: '',
          schoolCode: '',
          motto: 'Excellence in Education',
          themeColor: 'indigo',
          principalName: currentUser.name || 'Principal',
          contactEmail: currentUser.email || '',
          contactPhone: '',
          address: ''
        };
      }
      return PRESET_SCHOOLS.dakshora || PRESET_SCHOOLS.newideal;
    } catch {
      return PRESET_SCHOOLS.dakshora || PRESET_SCHOOLS.newideal;
    }
  });

  useEffect(() => {
    if (currentUser?.schoolName) {
      const match = Object.values(PRESET_SCHOOLS).find(p => p.schoolName.toLowerCase().includes(currentUser.schoolName.toLowerCase()));
      if (match) {
        setSchoolBrand(match);
      } else {
        setSchoolBrand(prev => ({
          ...prev,
          schoolName: currentUser.schoolName,
          shortName: currentUser.schoolName.split(' ')[0],
          principalName: currentUser.name || prev.principalName,
          contactEmail: currentUser.email || prev.contactEmail
        }));
      }
    }
  }, [currentUser]);

  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('dakshora_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [navCategory, setNavCategory] = useState<'all' | 'academics' | 'finance' | 'facilities' | 'innovation'>('all');
  const [showMobileAllModules, setShowMobileAllModules] = useState<boolean>(false);
  const [desktopViewMode, setDesktopViewMode] = useState<'cards' | 'compact'>('cards');

  const [settings, setSettings] = useState<ErpSchoolSettings>({
    schoolName: schoolBrand.schoolName || 'School Dashboard',
    affiliationNo: schoolBrand.affiliationNo || '',
    schoolCode: schoolBrand.schoolCode || '',
    board: schoolBrand.board || 'CBSE (Central Board of Secondary Education)',
    activeSession: '2026-27',
    sessionStartDate: '2026-04-01',
    sessionEndDate: '2027-03-31',
    principalName: schoolBrand.principalName || 'Principal',
    contactEmail: schoolBrand.contactEmail || '',
    contactPhone: schoolBrand.contactPhone || '',
    address: schoolBrand.address || '',
    smsGatewayEnabled: true,
    upiQrVpa: ''
  });

  // Local state initialized with rich defaults and synced with Fastify API
  const [students, setStudents] = useState<ErpStudentRecord[]>(DEFAULT_STUDENTS);
  const [staff, setStaff] = useState<ErpStaffRecord[]>(DEFAULT_STAFF);
  const [classes] = useState<ErpClassRecord[]>(DEFAULT_CLASSES);
  const [exams, setExams] = useState<ErpExamRecord[]>(DEFAULT_EXAMS);
  const [fees, setFees] = useState<ErpFeeInvoiceRecord[]>(DEFAULT_FEES);
  const [admissions, setAdmissions] = useState<ErpAdmissionRecord[]>(DEFAULT_ADMISSIONS);
  const [notices, setNotices] = useState<ErpNoticeRecord[]>(DEFAULT_NOTICES);
  const [transport] = useState<ErpTransportRoute[]>(DEFAULT_TRANSPORT);
  const [library, setLibrary] = useState<ErpLibraryBook[]>(DEFAULT_LIBRARY);
  const [payroll, setPayroll] = useState<ErpPayrollRecord[]>(DEFAULT_PAYROLL);

  // Daily Attendance Interactive Register
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceGrade, setAttendanceGrade] = useState('Class 10');
  const [attendanceSheet, setAttendanceSheet] = useState<Record<string, 'present' | 'absent' | 'late'>>({
    'std-101': 'present',
    'std-102': 'present',
    'std-103': 'absent',
    'std-104': 'present',
    'std-105': 'late'
  });

  // Modals & Forms
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({
    name: '',
    grade: 'Class 10',
    section: 'A',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    address: ''
  });

  const [selectedStudentForIdCard, setSelectedStudentForIdCard] = useState<ErpStudentRecord | null>(null);

  // Notice broadcast form
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    category: 'urgent' as 'urgent' | 'general' | 'academic' | 'exam',
    targetAudience: 'all' as 'all' | 'teachers' | 'parents' | 'students'
  });

  // Global Search Modal State
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  // School Full Info Flash Modal & Principal Executive Profile State
  const [showSchoolInfoModal, setShowSchoolInfoModal] = useState(false);
  const [showPrincipalProfileModal, setShowPrincipalProfileModal] = useState(false);

  // Ctrl+K / Cmd+K Global Search Keyboard Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowGlobalSearch((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ⌨️ Global Escape key listener: Pressing Esc returns from any feature back to Dashboard
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeModule !== 'dashboard') {
        if (!showGlobalSearch && !showAddStudent && !selectedStudentForIdCard) {
          setActiveModule('dashboard');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeModule, showGlobalSearch, showAddStudent, selectedStudentForIdCard]);

  // Ctrl+\ or Cmd+\ Sidebar Collapse Keyboard Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        setIsDesktopCollapsed((prev) => {
          const next = !prev;
          try {
            localStorage.setItem('dakshora_sidebar_collapsed', String(next));
          } catch {}
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync with backend on mount
  useEffect(() => {
    async function loadBackendData() {
      try {
        const [stRes, sfRes, feeRes, notRes, setRes] = await Promise.all([
          fetchErpStudents({ session: activeSession, organization_id: effectiveOrgId }),
          fetchErpStaff(effectiveOrgId),
          fetchErpFees(),
          fetchErpCommunication(),
          fetchErpSettings(effectiveOrgId)
        ]);
        if (stRes.data?.students && stRes.data.students.length > 0) setStudents(stRes.data.students as any);
        if (sfRes.data?.staff && sfRes.data.staff.length > 0) setStaff(sfRes.data.staff as any);
        if (feeRes.data?.invoices && feeRes.data.invoices.length > 0) setFees(feeRes.data.invoices as any);
        if (notRes.data?.notices && notRes.data.notices.length > 0) setNotices(notRes.data.notices as any);
        if (setRes.data?.settings) {
          const s = setRes.data.settings;
          setSettings(s as any);
          setSchoolBrand((prev) => ({
            ...prev,
            schoolName: s.schoolName || prev.schoolName,
            shortName: s.shortName || prev.shortName,
            board: s.board || prev.board,
            affiliationNo: s.affiliationNo || prev.affiliationNo,
            schoolCode: s.schoolCode || prev.schoolCode,
            principalName: s.principalName || prev.principalName,
            contactEmail: s.contactEmail || prev.contactEmail,
            contactPhone: s.contactPhone || prev.contactPhone,
            address: s.address || prev.address,
            themeColor: (s.themeColor as any) || prev.themeColor,
            logoUrl: s.logoUrl || s.logo_url || '/assets/schools/new-ideal-logo.svg'
          }));
        }
      } catch {
        // Fallback to default state silently
      }
    }
    loadBackendData();
  }, [activeSession]);

  // Filter modules based on role (Step 3 RBAC)
  const getModulesForRole = (role: ErpRole): ErpModule[] => {
    switch (role) {
      case 'teacher':
        return ['dashboard', 'journal', 'attendance', 'academics', 'timetable', 'exams', 'robotics', 'students', 'communication', 'ai'];
      case 'account':
        return ['dashboard', 'fees', 'payroll', 'reports', 'students', 'communication', 'ai'];
      case 'reception':
        return ['dashboard', 'admissions', 'students', 'staff', 'communication', 'attendance', 'ai'];
      case 'parent':
        return ['portal', 'attendance', 'fees', 'timetable', 'exams', 'transport', 'communication', 'ai'];
      case 'student':
        return ['portal', 'academics', 'timetable', 'exams', 'robotics', 'library', 'transport', 'communication', 'ai'];
      case 'admin':
      default:
        return [
          'dashboard',
          'journal',
          'portal',
          'students',
          'staff',
          'attendance',
          'academics',
          'timetable',
          'exams',
          'fees',
          'admissions',
          'robotics',
          'communication',
          'transport',
          'library',
          'payroll',
          'reports',
          'ai',
          'settings'
        ];
    }
  };

  const allowedModules = getModulesForRole(activeRole);

  // Auto switch module if current is not in allowed list for new role
  const handleRoleChange = (newRole: ErpRole) => {
    if ((currentUser?.role === 'parent' || currentUser?.role === 'student') && newRole !== 'parent' && newRole !== 'student') {
      onShowToast('error', 'Access Restricted', 'Parent and Student accounts cannot switch to administrative personas.');
      return;
    }
    setActiveRole(newRole);
    if (newRole === 'parent' || newRole === 'student') {
      setActiveModule('portal');
    } else {
      const newAllowed = getModulesForRole(newRole);
      if (!newAllowed.includes(activeModule)) {
        setActiveModule(newAllowed[0]);
      }
    }
    onShowToast('info', `Switched Persona to: ${newRole.toUpperCase()}`, `Tailored UI & Permissions applied`);
  };

  // Handle adding new student
  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentForm.name.trim()) return;

    const newStd: ErpStudentRecord = {
      id: `std-${Date.now().toString().slice(-4)}`,
      rollNo: `DPS-2026-${Math.floor(100 + Math.random() * 900)}`,
      name: newStudentForm.name.trim(),
      grade: newStudentForm.grade,
      section: newStudentForm.section,
      gender: 'Other',
      dob: '2011-01-01',
      parentName: newStudentForm.parentName.trim() || 'Parent/Guardian',
      parentPhone: newStudentForm.parentPhone.trim() || '+91 98000 00000',
      parentEmail: newStudentForm.parentEmail.trim() || 'parent@example.com',
      address: newStudentForm.address.trim() || 'Campus City',
      bloodGroup: 'B+',
      status: 'active',
      attendancePercent: 100,
      duesINR: 15000,
      academicSession: activeSession,
      organization_id: effectiveOrgId,
    };

    setStudents((prev) => [newStd, ...prev]);
    setShowAddStudent(false);
    onShowToast('success', 'Student Enrolled Successfully! 🎉', `${newStd.name} assigned Roll No: ${newStd.rollNo} for Session ${activeSession}`);

    try {
      await createErpStudent(newStd);
    } catch {
      // local state already updated
    }
  };

  // Handle Attendance Save
  const handleSaveAttendance = async () => {
    const records = Object.entries(attendanceSheet).map(([stdId, status]) => ({
      studentId: stdId,
      studentName: students.find((s) => s.id === stdId)?.name || 'Student',
      grade: attendanceGrade,
      date: attendanceDate,
      status,
      academicSession: activeSession,
      organization_id: effectiveOrgId
    }));

    onShowToast('success', 'Attendance Register Saved! 📅', `Marked ${records.length} students for ${attendanceGrade} (${activeSession})`);
    try {
      await markErpAttendance(records);
    } catch {
      // local sync
    }
  };

  // Handle Fee Payment
  const handlePayFee = async (invoiceId: string) => {
    setFees((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              status: 'paid',
              paidAt: new Date().toISOString().split('T')[0],
              paymentMethod: 'UPI',
              receiptNo: `RCP-${Math.floor(100000 + Math.random() * 900000)}`
            }
          : inv
      )
    );
    onShowToast('success', 'Payment Received & Verified! 💳', 'Digital Receipt issued with instant tax compliance.');
    try {
      await collectFeePayment(invoiceId, 'UPI');
    } catch {
      // local sync
    }
  };

  // Handle Notice Broadcast
  const handleBroadcastNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeForm.title.trim()) return;

    const newNot: ErpNoticeRecord = {
      id: `not-${Date.now().toString().slice(-4)}`,
      title: noticeForm.title.trim(),
      content: noticeForm.content.trim(),
      category: noticeForm.category,
      targetAudience: noticeForm.targetAudience,
      isUrgent: noticeForm.category === 'urgent',
      postedBy: `Authorized by ${activeRole.toUpperCase()}`,
      postedAt: 'Just now',
      smsBroadcastSent: true
    };

    setNotices((prev) => [newNot, ...prev]);
    setNoticeForm({ title: '', content: '', category: 'urgent', targetAudience: 'all' });
    onShowToast('success', 'Circular Broadcasted! 📢', `Pushed to SMS Gateway and Parent Portal`);

    try {
      await broadcastErpNotice(newNot);
    } catch {
      // local sync
    }
  };

  // Handle Library Book Borrow / Return
  const handleBorrowReturnBook = async (bookId: string, isReturning: boolean) => {
    setLibrary((prev) =>
      prev.map((bk) => {
        if (bk.id === bookId) {
          const newAvail = isReturning ? Math.min(bk.totalCopies, bk.availableCopies + 1) : Math.max(0, bk.availableCopies - 1);
          return {
            ...bk,
            availableCopies: newAvail
          };
        }
        return bk;
      })
    );

    if (isReturning) {
      onShowToast('success', 'Book Returned to Library 📖', 'Inventory catalog updated');
      try {
        await returnLibraryBook(bookId, 'Current User');
      } catch {}
    } else {
      onShowToast('info', 'Book Issued Successfully 📚', 'Return period: 14 Days');
      try {
        await issueLibraryBook(bookId, 'Aarav Sharma', 'student');
      } catch {}
    }
  };

  // 👩‍🏫 Dedicated Teacher Portal & Faculty Workspace (Responsive Hamburger & Collapsible Sidebar)
  const isTeacherSession = (role: string): boolean => {
    const r = (role || '').toLowerCase();
    return r === 'teacher' || r === 'faculty' || r === 'lecturer' || r === 'academic';
  };
  const isTeacherUser = Boolean(
    currentUser?.role &&
    ['teacher', 'faculty', 'lecturer', 'academic'].includes(String(currentUser.role).toLowerCase())
  );
  if (isTeacherSession(activeRole) || isTeacherUser) {
    return (
      <TeacherPortalHub
        currentUser={currentUser}
        onShowToast={onShowToast}
        onSignOut={() => {
          localStorage.removeItem('dakshora_auth_token');
          localStorage.removeItem('dakshora_superadmin_user');
          localStorage.removeItem('dakshora_active_surface');
          window.location.href = '/';
        }}
        schoolBrand={schoolBrand}
        onSwitchRole={(role) => handleRoleChange(role as ErpRole)}
      />
    );
  }



  return (
    <div className="flex min-h-[calc(100vh-65px)] w-full bg-slate-950 text-slate-100">
      {/* ─────────────────────────────────────────────────────────────
          1. PERSISTENT RESPONSIVE ENTERPRISE SIDEBAR & MOBILE DRAWER
         ───────────────────────────────────────────────────────────── */}
      {activeRole !== 'parent' && activeRole !== 'student' && (
        <ResponsiveSidebar
          activeModule={activeModule}
          onSelectModule={(mod) => {
            setActiveModule(mod);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          activeRole={activeRole}
          allowedModules={getModulesForRole(activeRole)}
          schoolBrand={schoolBrand}
          currentUser={currentUser}
          isMobileDrawerOpen={isMobileDrawerOpen}
          setIsMobileDrawerOpen={setIsMobileDrawerOpen}
          isDesktopCollapsed={isDesktopCollapsed}
          setIsDesktopCollapsed={setIsDesktopCollapsed}
          counts={{
            students: students.length,
            staff: staff.length,
            admissions: admissions.length,
            notices: notices.length,
            feesDue: fees.filter(f => f.status === 'pending' || f.status === 'overdue' || f.status === 'partially_paid').length,
            library: library.length
          }}
          activeSession={activeSession}
          onShowSchoolInfo={() => setShowSchoolInfoModal(true)}
          onShowPrincipalProfile={() => setShowPrincipalProfileModal(true)}
          onSignOut={onSignOut}
          onNavigateSurface={(surf) => {
            if (onNavigateSurface) {
              onNavigateSurface(surf);
            } else if (surf === 'school_app') {
              window.location.hash = '#school_app';
            }
          }}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN WORKSPACE / DASHBOARD CONTENT AREA
         ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
        {/* Sleek Top Application Navigation Bar with Hamburger & Breadcrumbs */}
        {activeRole !== 'parent' && activeRole !== 'student' && (
          <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            {/* Left: Mobile Hamburger & Desktop Toggle & Breadcrumbs */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile Hamburger Trigger */}
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Open navigation drawer"
                title="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Desktop Collapse Toggle */}
              <button
                type="button"
                onClick={() => {
                  const next = !isDesktopCollapsed;
                  setIsDesktopCollapsed(next);
                  try {
                    localStorage.setItem('dakshora_sidebar_collapsed', String(next));
                  } catch {}
                }}
                className="hidden lg:flex items-center gap-1.5 p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-mono"
                title={isDesktopCollapsed ? "Expand Sidebar (Ctrl+\\)" : "Collapse Sidebar (Ctrl+\\)"}
                aria-label={isDesktopCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isDesktopCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4 text-cyan-400" />
                ) : (
                  <PanelLeftClose className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-xs font-mono truncate">
                <button
                  type="button"
                  onClick={() => setShowSchoolInfoModal(true)}
                  className="text-slate-300 hover:text-white font-medium hover:underline truncate max-w-[120px] sm:max-w-[200px] cursor-pointer flex items-center gap-1.5 transition-colors group text-left"
                  title="Click to view full School Information card"
                >
                  <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="truncate">{schoolBrand.schoolName}</span>
                </button>
                <span className="text-slate-600">/</span>
                {activeModule === 'dashboard' ? (
                  <span className="text-white font-bold capitalize flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-pulse"></span>
                    Dashboard
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5 truncate">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModule('dashboard');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline cursor-pointer flex items-center gap-1 transition-colors"
                      title="Return to Dashboard (Esc)"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Dashboard</span>
                    </button>
                    <span className="text-slate-600">/</span>
                    <span className="text-white font-bold capitalize flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                      {activeModule.replace('_', ' ')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* ⬅️ Instant Back to Dashboard Button when in any feature */}
              {activeModule !== 'dashboard' && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveModule('dashboard');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]"
                  title="Back to Dashboard (Esc)"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-cyan-300" />
                  <span className="hidden sm:inline">Back to Dashboard</span>
                  <span className="sm:hidden">Dashboard</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowGlobalSearch(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all text-xs font-mono cursor-pointer"
                title="Search Students, Staff, Fees (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Search</span>
                <kbd className="hidden sm:inline px-1 py-0.2 rounded bg-black/40 text-[10px] text-cyan-300 font-bold border border-slate-700">Ctrl+K</kbd>
              </button>

              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <select
                  value={activeSession}
                  onChange={(e) => {
                    setActiveSession(e.target.value);
                    onShowToast('info', `Active Session: ${e.target.value}`, `Roster refreshed`);
                  }}
                  className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
                >
                  <option value="2026-27" className="bg-slate-900 text-white">2026–27</option>
                  <option value="2025-26" className="bg-slate-900 text-white">2025–26</option>
                </select>
              </div>

              {/* Prominent Admin Logout Action */}
              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-100 border border-rose-500/30 transition-all text-xs font-semibold cursor-pointer shadow-xs active:scale-95"
                  title="Sign out of School ERP"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              )}

              <LanguageSelector variant="header" />
            </div>
          </div>
        )}

        {/* Workspace Inner View Container */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto pb-24 md:pb-8 flex-1">
          {/* ========================================================================= */}
          {/* ⬅️ ACTIVE MODULE RETURN & CLOSE BAR (INSTANT DASHBOARD NAVIGATION) */}
          {/* ========================================================================= */}
          {activeModule !== 'dashboard' && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm animate-in fade-in duration-150">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveModule('dashboard');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
                  title="Return to Dashboard (Esc)"
                >
                  <ArrowLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-1 transition-transform" />
                  <span>← Back to Dashboard</span>
                </button>

                <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>

                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 capitalize">
                    {activeModule.replace('_', ' ')}
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 font-semibold uppercase">
                    Active Module
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-500 hidden md:inline">
                  Academic Session: <strong className="text-slate-800 font-bold">{activeSession}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModule('dashboard');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-mono transition-all cursor-pointer font-bold"
                  title="Close this module and return to dashboard (Esc)"
                >
                  <X className="w-3.5 h-3.5 text-slate-500" />
                  <span>Close</span>
                  <kbd className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-slate-100 text-[10px] text-slate-500 border border-slate-200 font-mono ml-1">Esc</kbd>
                </button>
              </div>
            </div>
          )}

          {/* 👩‍🏫 FACULTY CO-PILOT WORKSPACE STRIP (WHEN TEACHER PERSONA IS ACTIVE ON DASHBOARD) */}
          {activeRole === 'teacher' && activeModule === 'dashboard' && (
            <div className="bg-emerald-950/70 rounded-2xl p-4 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-300 font-mono uppercase tracking-wider">
                    Faculty Workspace Active • Assigned: Class 10-A
                  </p>
                  <p className="text-[11px] text-slate-300">
                    Quick Co-Pilot: Mark attendance in 30 seconds or generate CBSE/State Board question papers with AI.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModule('attendance')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <span>⏱️ Fast Attendance</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModule('exams')}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <span>🤖 AI Question Paper</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModule('journal')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
                >
                  <span>📝 Teaching Journal</span>
                </button>
              </div>
            </div>
          )}


      {/* SaaS Entitlement Plan Lock Banner */}
      {entitlements && !entitlements.modules.includes(activeModule) && (
        <div className="p-8 rounded-3xl border border-amber-300 bg-gradient-to-br from-amber-50 via-white to-orange-50 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto font-mono">
            <h3 className="text-lg font-bold text-slate-900">Module Locked by SaaS Subscription Tier</h3>
            <p className="text-xs text-slate-600">
              Your school trust is currently on the <strong className="text-amber-700">{entitlements.planName}</strong> plan.
              The <strong>{activeModule.toUpperCase()}</strong> module requires an upgrade to Growth or Enterprise.
            </p>
          </div>
          <button
            onClick={() => onShowToast('info', 'Upgrade in Billing Hub', 'Navigate to the Billing tab in the Admin or Customer Portal to activate this module.')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-105 text-white font-bold text-xs font-mono inline-flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Upgrade Subscription Plan</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎓 MODULE 0: PARENT & STUDENT SELF-SERVICE PORTAL */}
      {/* ========================================================================= */}
      {(activeModule === 'portal' || activeRole === 'parent' || activeRole === 'student') && (
        <ParentStudentPortalHub
          currentUser={currentUser}
          onShowToast={onShowToast}
          defaultRole={activeRole === 'student' ? 'student' : 'parent'}
          schoolBrand={schoolBrand}
          onSwitchRole={(role) => handleRoleChange(role as ErpRole)}
        />
      )}

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 🚀 MODULE 1: LIVE SCHOOL ERP DASHBOARD (Restricted to School Admin & Teachers) */}
      {/* ========================================================================= */}
      {activeModule === 'dashboard' && activeRole !== 'parent' && activeRole !== 'student' && currentUser?.role !== 'parent' && currentUser?.role !== 'student' && (
        <div className="space-y-6">
          <LiveDashboardHub
            activeRole={activeRole}
            activeSession={activeSession}
            organizationId={effectiveOrgId}
            currentStaffId={activeRole === 'teacher' ? 'stf-05' : undefined}
            onNavigateModule={(mod, extra) => {
              setActiveModule(mod);
              if (extra?.showAddStudent) setShowAddStudent(true);
            }}
            onShowToast={onShowToast}
            onShowPrincipalProfile={() => setShowPrincipalProfileModal(true)}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📖 MODULE: STRUCTURED TEACHING JOURNAL & DAKSHORA AI TEACHER */}
      {/* ========================================================================= */}
      {activeModule === 'journal' && (
        <TeachingJournalHub
          activeRole={activeRole}
          activeSession={activeSession}
          organizationId={effectiveOrgId}
          currentStaffId={activeRole === 'teacher' ? 'stf-02' : undefined}
          onShowToast={(type, title, msg) => onShowToast(type, title, msg)}
        />
      )}

      {/* ========================================================================= */}
      {/* 🚀 MODULE 2: STUDENTS DIRECTORY */}
      {/* ========================================================================= */}
      {activeModule === 'students' && (
        <StudentManagementHub
          activeRole={activeRole}
          activeSession={activeSession}
          organizationId={effectiveOrgId}
          onSelectForIdCard={(std) => setSelectedStudentForIdCard(std)}
          onShowToast={onShowToast}
          initialShowAdd={showAddStudent}
          onCloseInitialAdd={() => setShowAddStudent(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* 👥 MODULE 2: STAFF & TEACHER MANAGEMENT */}
      {/* ========================================================================= */}
      {activeModule === 'staff' && (
        <StaffManagementHub
          activeRole={activeRole}
          activeSession={activeSession}
          organizationId={effectiveOrgId}
          onShowToast={onShowToast}
        />
      )}

      {/* ========================================================================= */}
      {/* 📅 MODULE 3: ATTENDANCE MANAGEMENT */}
      {/* ========================================================================= */}
      {activeModule === 'attendance' && (
        <AttendanceManagementHub
          activeRole={activeRole}
          activeSession={activeSession}
          organizationId={effectiveOrgId}
          currentStaffId={activeRole === 'teacher' ? 'stf-05' : undefined}
          onShowToast={onShowToast}
        />
      )}

      {/* ========================================================================= */}
      {/* 📚 MODULE 4: ACADEMICS MANAGEMENT (PRODUCTION SAAS GRADE) */}
      {/* ========================================================================= */}
      {activeModule === 'academics' && (
        <AcademicsManagementHub
          activeRole={activeRole}
          activeSession={activeSession}
          organizationId={effectiveOrgId}
          currentStaffId={activeRole === 'teacher' ? 'stf-05' : undefined}
          onShowToast={onShowToast}
        />
      )}

      {/* ========================================================================= */}
      {/* 📝 MODULE 5: EXAMS & REPORT CARDS */}
      {/* ========================================================================= */}
      {activeModule === 'exams' && (
        <ExaminationManagementHub
          activeRole={activeRole}
          activeSession={activeSession}
          organizationId={effectiveOrgId}
          currentStaffId={activeRole === 'teacher' ? 'stf-05' : undefined}
          onShowToast={onShowToast}
        />
      )}

      {/* ========================================================================= */}
      {/* 💳 MODULE 6: FEES & BILLING */}
      {/* ========================================================================= */}
      {activeModule === 'fees' && (
        <FeesManagementHub
          activeRole={activeRole}
          activeSession={activeSession}
          organizationId={effectiveOrgId}
          onShowToast={(type, msg) => onShowToast(type, 'Fees & Finance', msg)}
        />
      )}

      {/* ========================================================================= */}
      {/* 📥 MODULE 7: ADMISSIONS PIPELINE */}
      {/* ========================================================================= */}
      {activeModule === 'admissions' && (
        <AdmissionsManagementHub
          activeRole={activeRole}
          activeSession={activeSession}
          organizationId={effectiveOrgId}
          onShowToast={(type, title, msg) => onShowToast(type, title, msg)}
          onNavigateToModule={(mod) => setActiveModule(mod as any)}
        />
      )}

      {/* ========================================================================= */}
      {/* 📢 MODULE 8: COMMUNICATION & NOTICE BOARD */}
      {/* ========================================================================= */}
      {activeModule === 'communication' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                <span>Circulars, Announcements & SMS Broadcast</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Broadcast official circulars, emergency holiday notices, and push notifications.
              </p>
            </div>
          </div>

          {/* Broadcast Composer */}
          {['admin', 'teacher'].includes(activeRole) && (
            <form onSubmit={handleBroadcastNotice} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-cyan-300 font-mono">Broadcast New Circular to Campus</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Circular Title..."
                  value={noticeForm.title}
                  onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                  className="sm:col-span-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-white"
                />
                <select
                  value={noticeForm.category}
                  onChange={(e: any) => setNoticeForm({ ...noticeForm, category: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-white"
                >
                  <option value="urgent">🚨 Urgent Announcement</option>
                  <option value="academic">📚 Academic Circular</option>
                  <option value="exam">📝 Exam Schedule</option>
                  <option value="general">🔔 General Information</option>
                </select>
              </div>
              <textarea
                rows={2}
                placeholder="Message body / instructions for parents and students..."
                value={noticeForm.content}
                onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <Send className="w-4 h-4" />
                <span>Broadcast via SMS & Push</span>
              </button>
            </form>
          )}

          {/* Notice Feed */}
          <div className="space-y-3">
            {notices.map((not) => (
              <div
                key={not.id}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 font-mono text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{not.title}</span>
                  <span className="text-slate-500 text-[10px]">{not.postedAt}</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">{not.content}</p>
                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Author: {not.postedBy}</span>
                  <span className="text-emerald-400">✅ SMS Broadcasted to Registered Parents</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚌 MODULE 9: TRANSPORT FLEET & GPS */}
      {/* ========================================================================= */}
      {activeModule === 'transport' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Bus className="w-5 h-5 text-amber-400" />
                <span>School Transport Fleet & Live GPS Route Tracking</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Real-time route mapping, driver contact, pickup/drop scheduled timings and vehicle capacity.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {transport.map((rt) => (
              <div
                key={rt.id}
                className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 font-mono text-xs space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {rt.routeNumber}
                    </span>
                    <h3 className="font-bold text-white text-sm mt-1">{rt.routeName}</h3>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                      ● LIVE ON ROUTE
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">{rt.vehicleNumber}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div>Driver: <span className="text-white font-bold">{rt.driverName}</span></div>
                  <div>Phone: <span className="text-cyan-300">{rt.driverPhone}</span></div>
                  <div>Capacity: <span className="text-white font-bold">{rt.assignedStudentsCount} / {rt.capacity} Seats</span></div>
                  <div>Speed: <span className="text-emerald-400 font-bold">38 km/h</span></div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="text-[11px] font-bold text-slate-300">Route Waypoints & Timings:</div>
                  {rt.stops.map((stp, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        <span>{stp.stopName}</span>
                      </div>
                      <span className="text-slate-500">Pick: {stp.pickupTime} • Drop: {stp.dropTime}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📖 MODULE 10: LIBRARY MANAGEMENT */}
      {/* ========================================================================= */}
      {activeModule === 'library' && (
        <LibraryManagementHub
          activeSession={activeSession}
          activeRole={activeRole}
          onShowToast={(type, msg) => onShowToast(type, 'Library Management', msg)}
        />
      )}

      {/* ========================================================================= */}
      {/* 💰 MODULE 11: HR & PAYROLL */}
      {/* ========================================================================= */}
      {activeModule === 'payroll' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <span>Staff HR, Salary Structures & Monthly Payroll</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Basic pay, HRA, DA, PF/TDS deductions, automated net salary generation and disbursement.
              </p>
            </div>
            <div className="text-right font-mono text-xs">
              <span className="text-slate-400">Total Monthly Payroll: </span>
              <span className="font-bold text-emerald-400 text-base">₹2,68,000</span>
            </div>
          </div>

          <div className="space-y-4">
            {payroll.map((pay) => (
              <div
                key={pay.id}
                className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 font-mono text-xs space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-white text-sm">{pay.staffName}</h3>
                    <p className="text-slate-500 text-[10px]">Employee ID: {pay.empId} • Period: {pay.monthYear}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-emerald-400">₹{pay.netPayoutINR.toLocaleString()}</span>
                    <p className="text-[10px] text-slate-500">Net Monthly Salary</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div>Basic Pay: <strong className="text-white">₹{pay.basicSalaryINR.toLocaleString()}</strong></div>
                  <div>HRA (30%): <strong className="text-white">₹{pay.hraINR.toLocaleString()}</strong></div>
                  <div>DA: <strong className="text-white">₹{pay.daINR.toLocaleString()}</strong></div>
                  <div>PF Deduction: <strong className="text-rose-400">-₹{pay.pfDeductionINR.toLocaleString()}</strong></div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    pay.paymentStatus === 'processed'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                  }`}>
                    {pay.paymentStatus} {pay.disbursedDate ? `on ${pay.disbursedDate}` : ''}
                  </span>

                  {pay.paymentStatus === 'pending' && (
                    <button
                      onClick={() => {
                        setPayroll(prev => prev.map(p => p.id === pay.id ? { ...p, paymentStatus: 'processed', disbursedDate: 'Today' } : p));
                        onShowToast('success', 'Salary Disbursed! 💸', `Direct Bank Transfer initiated for ${pay.staffName}`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                    >
                      Disburse Net Salary
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📊 MODULE 12: ANALYTICS & REPORTS */}
      {/* ========================================================================= */}
      {activeModule === 'reports' && (
        <ReportsAnalyticsHub
          activeSession={activeSession}
          activeRole={activeRole}
          onShowToast={(type, msg, detail) => onShowToast(type, msg, detail)}
        />
      )}

      {/* ========================================================================= */}
      {/* 🤖 MODULE 14: DAKSHORA AI ASSISTANT (ASSISTIVE INTELLIGENCE LAYER) */}
      {/* ========================================================================= */}
      {activeModule === 'ai' && (
        <DakshoraAiHub
          activeRole={activeRole}
          activeSession={activeSession}
          onNavigateModule={(mod) => {
            if (mod) setActiveModule(mod as ErpModule);
          }}
          onShowToast={onShowToast}
        />
      )}

      {/* ========================================================================= */}
      {/* 🚀 MODULE 15: SETTINGS & SCHOOL MASTER CONFIGURATION */}
      {/* ========================================================================= */}
      {activeModule === 'settings' && (
        <SchoolSettingsHub
          activeRole={activeRole}
          activeSession={activeSession}
          organizationId={effectiveOrgId}
          onShowToast={onShowToast}
          onNavigateToModule={(mod) => setActiveModule(mod as ErpModule)}
        />
      )}

      {/* ========================================================================= */}
      {/* ⏰ MODULE 16: TIMETABLE & PERIOD SCHEDULING ENGINE */}
      {/* ========================================================================= */}
      {activeModule === 'timetable' && (
        <TimetableManagementHub
          activeSession={activeSession}
          activeRole={activeRole}
          onShowToast={onShowToast}
          onNavigateToModule={(mod) => setActiveModule(mod as ErpModule)}
        />
      )}

      {/* ========================================================================= */}
      {/* 🤖 MODULE 17: ROBOTICS & STEAM ACADEMY (ATAL TINKERING LAB) */}
      {/* ========================================================================= */}
      {activeModule === 'robotics' && (
        <RoboticsAcademyHub onShowToast={onShowToast} />
      )}

      {/* ========================================================================= */}
      {/* 🪪 DIGITAL STUDENT ID CARD MODAL */}
      {/* ========================================================================= */}
      {selectedStudentForIdCard && (
        <StudentIdCardModal
          student={selectedStudentForIdCard}
          allStudents={students}
          onClose={() => setSelectedStudentForIdCard(null)}
          onShowToast={(type, title, msg) => onShowToast(type, title, msg || '')}
        />
      )}

      {/* ========================================================================= */}
      {/* ➕ ENROLL NEW STUDENT MODAL */}
      {/* ========================================================================= */}
      {showAddStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0B0F19] border border-cyan-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-sm text-white">Enroll New Student in SIS</span>
              <button
                onClick={() => setShowAddStudent(false)}
                className="text-xs font-mono text-slate-400 hover:text-white"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleAddStudentSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Student Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aaradhya Sen"
                  value={newStudentForm.name}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Grade</label>
                  <select
                    value={newStudentForm.grade}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, grade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  >
                    <option value="Class 8">Class 8</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Section</label>
                  <select
                    value={newStudentForm.section}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Parent Name</label>
                  <input
                    type="text"
                    placeholder="Father / Mother"
                    value={newStudentForm.parentName}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, parentName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Parent Mobile</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 00000"
                    value={newStudentForm.parentPhone}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, parentPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Parent Email</label>
                <input
                  type="email"
                  placeholder="parent@example.com"
                  value={newStudentForm.parentEmail}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, parentEmail: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 mt-2"
              >
                Confirm Admission & Generate Student File
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🔍 GLOBAL SEARCH DIRECTORY MODAL (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
        onNavigate={(mod) => setActiveModule(mod as ErpModule)}
      />

      {/* 🏫 FULL SCHOOL INFORMATION DISPLAY FLASH CARD MODAL */}
      <SchoolInfoModal
        isOpen={showSchoolInfoModal}
        onClose={() => setShowSchoolInfoModal(false)}
        schoolBrand={schoolBrand}
        totalStudents={students.length}
        totalStaff={staff.length}
        onShowToast={(type, title, msg) => onShowToast(type, title, msg)}
      />

      {/* 👨‍💼 PRINCIPAL EXECUTIVE PROFILE MODAL */}
      <PrincipalProfileModal
        isOpen={showPrincipalProfileModal}
        onClose={() => setShowPrincipalProfileModal(false)}
        schoolBrand={schoolBrand}
        currentUser={currentUser}
        onShowToast={(type, title, msg) => onShowToast(type, title, msg)}
      />

      {/* ========================================================================= */}
      {/* 📱 MOBILE STICKY FLOATING APP BAR DOCK (NATIVE APP EXPERIENCE) */}
      {/* ========================================================================= */}
      {activeRole !== 'parent' && activeRole !== 'student' && (
        <div className="fixed bottom-3 inset-x-3 z-40 md:hidden bg-slate-950/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-1.5 flex items-center justify-around ring-1 ring-black/40">
          <button
            type="button"
            onClick={() => setActiveModule('dashboard')}
            className={`flex-1 py-1.5 px-2 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              activeModule === 'dashboard'
                ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/40 scale-105'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-[10px] font-bold mt-0.5">Cockpit</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModule('attendance')}
            className={`flex-1 py-1.5 px-2 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              activeModule === 'attendance'
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/40 scale-105'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="text-[10px] font-bold mt-0.5">Roll Call</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModule('students')}
            className={`flex-1 py-1.5 px-2 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              activeModule === 'students'
                ? 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/40 scale-105'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-[10px] font-bold mt-0.5">Students</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModule('fees')}
            className={`flex-1 py-1.5 px-2 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              activeModule === 'fees'
                ? 'bg-gradient-to-tr from-emerald-600 to-green-600 text-white shadow-md shadow-emerald-600/40 scale-105'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span className="text-[10px] font-bold mt-0.5">Fees</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="flex-1 py-1.5 px-2 rounded-2xl flex flex-col items-center justify-center text-cyan-300 hover:text-white transition-all bg-white/10 hover:bg-white/20 border border-white/10 cursor-pointer shadow-xs"
          >
            <Menu className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-bold mt-0.5">Menu</span>
          </button>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};
