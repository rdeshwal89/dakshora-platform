import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Printer,
  Download,
  Search,
  Award,
  Shield,
  Briefcase,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  FileText,
  Clock,
  Layers,
  RefreshCw,
  UserPlus,
  UserCheck,
  Plus,
  AlertCircle
} from 'lucide-react';
import { SchoolBrandProfile } from './SchoolBrandingModal';
import {
  fetchInstitutionalDuties,
  fetchResponsibilityTypes,
  assignStaffResponsibility,
  fetchErpStaff
} from '../services/api';
import {
  ErpStaffRecord,
  ResponsibilityTypeRecord,
  ResponsibilityScopeType
} from '../types';

export interface PortfolioResponsibilityEntry {
  id: string;
  portfolioName: string;
  category: 'Academics & Exams' | 'Discipline & Safety' | 'STEM & Innovation' | 'Sports & Culture' | 'Operations & Administration';
  inchargeName: string;
  empId: string;
  designation: string;
  department: string;
  phone: string;
  email: string;
  keyResponsibilities: string[];
  meetingSchedule: string;
  tenure: string;
}

export const MASTER_TEACHER_PORTFOLIOS: PortfolioResponsibilityEntry[] = [
  {
    id: 'port-01',
    portfolioName: 'Controller of Examinations & CBSE Liaison Cell',
    category: 'Academics & Exams',
    inchargeName: 'Dr. R. K. Saxena',
    empId: 'FAC-117',
    designation: 'PGT Physics & Senior Academic Lead',
    department: 'Examination Cell & Sciences',
    phone: '+91 98101 11017',
    email: 'coe.cbse@dpsheritage.edu.in',
    keyResponsibilities: [
      'CBSE Board registration & List of Candidates (LOC) verification',
      'Term-1 & Term-2 Summative Assessment schedule formulation',
      'Confidential question paper moderation and secure printing',
      'Official report card & digital marksheet generation on Dakshora ERP'
    ],
    meetingSchedule: 'Fortnightly (Every 2nd & 4th Tuesday, 3:30 PM)',
    tenure: 'Academic Session 2026–27 (Annual Statutory Charge)'
  },
  {
    id: 'port-02',
    portfolioName: 'Academic Dean & Curriculum Planning Head',
    category: 'Academics & Exams',
    inchargeName: 'Rajeev Malhotra',
    empId: 'FAC-02',
    designation: 'Senior PGT Mathematics',
    department: 'Mathematics & Curriculum Wing',
    phone: '+91 98100 00222',
    email: 'dean.academics@dpsheritage.edu.in',
    keyResponsibilities: [
      'NEP 2020 pedagogical integration across Foundational to Senior wings',
      'Weekly teacher lesson plan & diary audits',
      'Quarterly academic progress reviews and learning gap analysis',
      'Peer-teaching observation and continuous teacher training workshops'
    ],
    meetingSchedule: 'Weekly (Every Friday, 2:30 PM)',
    tenure: 'Permanent Academic Charge'
  },
  {
    id: 'port-03',
    portfolioName: 'Campus Discipline, POCSO & Anti-Bullying Committee',
    category: 'Discipline & Safety',
    inchargeName: 'Suresh Menon',
    empId: 'FAC-112',
    designation: 'PGT Physics & Safety Officer',
    department: 'Discipline Council',
    phone: '+91 98101 11012',
    email: 'discipline.committee@dpsheritage.edu.in',
    keyResponsibilities: [
      'Enforcement of zero-tolerance anti-bullying and anti-ragging protocols',
      'CCTV campus surveillance coordination with administrative security',
      'POCSO statutory guidelines compliance and grievance redressing',
      'Conducting quarterly safe-touch, digital citizenship and cyber safety drives'
    ],
    meetingSchedule: 'Monthly (1st Monday of each Month, 4:00 PM)',
    tenure: 'Session 2026–27 Statutory Board'
  },
  {
    id: 'port-04',
    portfolioName: 'ATAL Tinkering Lab (ATL) & STEM Robotics Director',
    category: 'STEM & Innovation',
    inchargeName: 'Sunita Chawla',
    empId: 'FAC-03',
    designation: 'TGT Science & STEM Coordinator',
    department: 'Innovation & ATAL Lab',
    phone: '+91 98100 00333',
    email: 'atal.director@dpsheritage.edu.in',
    keyResponsibilities: [
      'NITI Aayog ATAL Innovation Mission (AIM) compliance and portal reporting',
      'Hands-on student mentoring in Arduino, Raspberry Pi, AI and 3D Printing',
      'Conducting intra-school Tinkering challenges and national hackathons',
      'Inventory calibration of robotic kits, sensor modules, and STEM apparatus'
    ],
    meetingSchedule: 'Weekly (Wednesdays, 3:00 PM)',
    tenure: 'Multi-Year Innovation Lead'
  },
  {
    id: 'port-05',
    portfolioName: 'Sports Directorate & Inter-House Master',
    category: 'Sports & Culture',
    inchargeName: 'Praveen Yadav',
    empId: 'FAC-110',
    designation: 'Senior Physical Education Faculty',
    department: 'Physical Education & Athletics',
    phone: '+91 98101 11010',
    email: 'sports.directorate@dpsheritage.edu.in',
    keyResponsibilities: [
      'Coordination of 4 School Houses (Agni, Prithvi, Vayu, Jal)',
      'Organization of the Annual Athletic Meet and CBSE cluster tournaments',
      'Daily morning physical fitness drills and zero-period coaching',
      'First-aid and student sports injury insurance protocols'
    ],
    meetingSchedule: 'Weekly (Mondays, 8:15 AM)',
    tenure: 'Session 2026–27'
  },
  {
    id: 'port-06',
    portfolioName: 'Cultural Affairs, Model UN & Annual Day In-Charge',
    category: 'Sports & Culture',
    inchargeName: 'Vandana Sen',
    empId: 'FAC-109',
    designation: 'TGT English Literature & Stage Director',
    department: 'Cultural Council & Humanities',
    phone: '+91 98101 11009',
    email: 'cultural.cell@dpsheritage.edu.in',
    keyResponsibilities: [
      'Direction and scripting of the Grand Annual Day production',
      'Delegation training for Inter-School Model United Nations (MUN)',
      'Inter-house debate, elocution, quiz, and musical choir competitions',
      'National festive celebration coordination (Independence Day, Republic Day)'
    ],
    meetingSchedule: 'Bi-weekly (Thursdays, 3:30 PM)',
    tenure: 'Session 2026–27'
  },
  {
    id: 'port-07',
    portfolioName: 'Transport Safety & Bus Route Fleet Monitoring In-Charge',
    category: 'Operations & Administration',
    inchargeName: 'Amitabh Sen',
    empId: 'FAC-04',
    designation: 'Chief Accounts & Bursar Officer',
    department: 'Administration & Transport',
    phone: '+91 98100 00444',
    email: 'transport.bursar@dpsheritage.edu.in',
    keyResponsibilities: [
      'GPS speed governor and vehicle live tracking verification',
      'Driver background verification and mandatory breathalyzer inspections',
      'Female bus attendant presence monitoring on all designated routes',
      'Parent emergency bus-breakdown notification broadcast via SMS'
    ],
    meetingSchedule: 'Monthly (Last Saturday of Month, 11:00 AM)',
    tenure: 'Administrative Statutory Portfolio'
  },
  {
    id: 'port-08',
    portfolioName: 'Library, Digital Knowledge Repository & Reading Circle Head',
    category: 'Operations & Administration',
    inchargeName: 'Anuradha Paul',
    empId: 'FAC-115',
    designation: 'Chief Librarian & Senior Faculty',
    department: 'Library Sciences',
    phone: '+91 98101 11015',
    email: 'library.head@dpsheritage.edu.in',
    keyResponsibilities: [
      'Digital OPAC RFID book tracking and automated overdue notices',
      'Procurement of latest CBSE reference works, encyclopedias & journals',
      'National Reading Month competitions and Author-in-Residence sessions',
      'E-library access provisioning for Class 9–12 research scholars'
    ],
    meetingSchedule: 'Fortnightly (Tuesdays, 2:00 PM)',
    tenure: 'Permanent Institutional Charge'
  },
  {
    id: 'port-09',
    portfolioName: 'Infirmary, Student Health & First-Aid Red Cross Officer',
    category: 'Discipline & Safety',
    inchargeName: 'Dr. Alok Nath',
    empId: 'FAC-108',
    designation: 'TGT Health Counselor & Medical Liaison',
    department: 'Medical & Wellness Cell',
    phone: '+91 98101 11008',
    email: 'health.counselor@dpsheritage.edu.in',
    keyResponsibilities: [
      'Bi-annual comprehensive student eye, dental, and general health checkups',
      'Maintaining digital student allergy and medical emergency index',
      'Zero-delay ambulance tie-up and hospital emergency SOP compliance',
      'Water filtration TDS and canteen food hygiene testing certification'
    ],
    meetingSchedule: 'Monthly (1st Wednesday, 12:30 PM)',
    tenure: 'Session 2026–27'
  },
  {
    id: 'port-10',
    portfolioName: 'Eco-Club & Swachh Vidyalaya Green Campus Coordinator',
    category: 'STEM & Innovation',
    inchargeName: 'Neha Tyagi',
    empId: 'FAC-107',
    designation: 'PRT Environmental Sciences',
    department: 'Eco-Club & Biology',
    phone: '+91 98101 11007',
    email: 'ecoclub.head@dpsheritage.edu.in',
    keyResponsibilities: [
      'Campus rainwater harvesting and rooftop solar array efficiency audit',
      'Wet and dry organic composting and botanical herb garden management',
      'Single-use plastic ban enforcement and e-waste collection drives',
      'World Environment Day tree plantation and green badge student council'
    ],
    meetingSchedule: 'Monthly (2nd Saturday, 10:00 AM)',
    tenure: 'Session 2026–27'
  },
  {
    id: 'port-11',
    portfolioName: 'Timetable Master & Daily Faculty Substitution In-Charge',
    category: 'Academics & Exams',
    inchargeName: 'Arun Singh',
    empId: 'FAC-113',
    designation: 'TGT Senior Faculty & Timetable Master',
    department: 'Academic Operations',
    phone: '+91 98101 11013',
    email: 'timetable.master@dpsheritage.edu.in',
    keyResponsibilities: [
      'Master bell schedule and zero-period periodization formulation',
      'Daily morning 7:45 AM teacher emergency leave substitution deployment',
      'Computer lab, physics lab, and auditorium room allocation management',
      'Workload balance tracking to ensure no faculty exceeds 32 periods/week'
    ],
    meetingSchedule: 'Daily Morning Dispatch (7:45 AM)',
    tenure: 'Session 2026–27'
  },
  {
    id: 'port-12',
    portfolioName: 'Career Guidance, CUET/JEE/NEET Cell & Alumni Relations',
    category: 'Academics & Exams',
    inchargeName: 'Dr. V. K. Rao',
    empId: 'FAC-114',
    designation: 'PGT Chemistry & Research Mentor',
    department: 'Career & College Placement',
    phone: '+91 98101 11014',
    email: 'career.guidance@dpsheritage.edu.in',
    keyResponsibilities: [
      'Strategic guidance for CUET, JEE Advanced, NEET, and CLAT aspirants',
      'Quarterly university fair hosting and guest lectures by IIT/IIM alumni',
      'Assisting Class 12 students in statement of purpose (SOP) formulation',
      'Maintaining active global alumni scholarship directory on ERP'
    ],
    meetingSchedule: 'Monthly (Last Friday, 3:30 PM)',
    tenure: 'Session 2026–27'
  }
];

function resolveCategory(duty: any): 'Academics & Exams' | 'Discipline & Safety' | 'STEM & Innovation' | 'Sports & Culture' | 'Operations & Administration' {
  const cat = (duty.category || '').toLowerCase();
  const code = (duty.responsibility_code || '').toUpperCase();
  const name = (duty.responsibility_name || '').toLowerCase();

  if (
    cat === 'examinations' ||
    cat === 'academics' ||
    code.includes('EXAM') ||
    code.includes('CLASS_TEACHER') ||
    code.includes('HOD') ||
    code.includes('CBSE') ||
    code.includes('TIMETABLE') ||
    name.includes('exam') ||
    name.includes('academic') ||
    name.includes('curriculum')
  ) {
    return 'Academics & Exams';
  }
  if (
    cat === 'student_welfare' ||
    code.includes('DISCIPLINE') ||
    code.includes('SAFETY') ||
    code.includes('POCSO') ||
    code.includes('HEALTH') ||
    name.includes('discipline') ||
    name.includes('safety') ||
    name.includes('counsel')
  ) {
    return 'Discipline & Safety';
  }
  if (
    cat === 'special_programs' ||
    code.includes('ATL') ||
    code.includes('ROBOTICS') ||
    code.includes('STEM') ||
    code.includes('ECO') ||
    code.includes('NEEV') ||
    name.includes('stem') ||
    name.includes('robotics') ||
    name.includes('eco') ||
    name.includes('tinkering')
  ) {
    return 'STEM & Innovation';
  }
  if (
    cat === 'co_curricular' ||
    code.includes('SPORTS') ||
    code.includes('CULTURE') ||
    code.includes('HOUSE') ||
    name.includes('sport') ||
    name.includes('culture') ||
    name.includes('annual day')
  ) {
    return 'Sports & Culture';
  }
  return 'Operations & Administration';
}

function resolveDutiesList(duty: any): string[] {
  if (duty.notes && duty.notes.trim()) {
    const splitNotes = duty.notes
      .split(/\n|;|\./)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 3);
    if (splitNotes.length > 0) return splitNotes;
  }
  const code = (duty.responsibility_code || '').toUpperCase();
  if (code.includes('EXAM')) {
    return [
      'Formulate Summative Assessment & Term Examination schedules',
      'Confidential question paper moderation & secure printing',
      'Report card & digital marksheet generation on Dakshora ERP',
      'Tabulation register archiving and student rank list verification'
    ];
  }
  if (code.includes('CLASS_TEACHER')) {
    return [
      'Daily morning student attendance & leave regularization',
      'Pastoral student care, behavior monitoring & mentoring',
      'Parent communication & quarterly PTM coordination',
      'Academic progress oversight and gradebook signoff'
    ];
  }
  if (code.includes('CBSE')) {
    return [
      'CBSE Board registration & List of Candidates (LOC) verification',
      'Affiliation bye-laws compliance & annual OASIS data updates',
      'Liaison with CBSE regional office & exam center superintendents'
    ];
  }
  if (code.includes('DISCIPLINE')) {
    return [
      'Enforcement of zero-tolerance anti-bullying and anti-ragging protocols',
      'CCTV campus surveillance coordination with administrative security',
      'POCSO statutory guidelines compliance and grievance redressing'
    ];
  }
  if (code.includes('SPORTS')) {
    return [
      'Coordination of inter-house sports competitions and annual athletic meet',
      'Daily morning physical fitness drills and zero-period training',
      'Sports equipment inventory, maintenance and first-aid protocols'
    ];
  }
  if (code.includes('HOD')) {
    return [
      'Pedagogical alignment with NEP 2020 and CBSE learning objectives',
      'Weekly teacher lesson plan & curriculum pacing audit',
      'Quarterly academic progress reviews and remedial class planning'
    ];
  }
  if (code.includes('ATL') || code.includes('ROBOTICS')) {
    return [
      'NITI Aayog ATAL Innovation Mission portal compliance & reporting',
      'Hands-on student mentoring in Arduino, Raspberry Pi, AI and 3D Printing',
      'Organizing tinkering challenges, hackathons and project exhibitions'
    ];
  }
  if (code.includes('LIBRARY')) {
    return [
      'Library cataloging, book issuance and digital OPAC maintenance',
      'Procurement of latest curriculum reference books and journals',
      'Reading circle activities and annual book fair coordination'
    ];
  }
  if (code.includes('ICT')) {
    return [
      'Computer lab hardware, network and software asset management',
      'Smart classroom interactive display operations & IT maintenance',
      'Digital safety protocols & cyber security awareness programs'
    ];
  }
  return [
    `Statutory institutional charge execution for Session ${duty.academic_session_id || '2026–27'}`,
    'Delegated administrative powers under Principal direction',
    'Periodic committee review meetings and compliance reporting'
  ];
}

function resolveMeetingSchedule(duty: any): string {
  const code = (duty.responsibility_code || '').toUpperCase();
  if (code.includes('EXAM')) return 'Fortnightly (Every 2nd & 4th Tuesday, 3:30 PM)';
  if (code.includes('CLASS_TEACHER')) return 'Daily Morning Dispatch (7:45 AM)';
  if (code.includes('DISCIPLINE')) return 'Monthly (1st Monday of Month, 4:00 PM)';
  if (code.includes('SPORTS')) return 'Weekly (Mondays, 8:15 AM)';
  if (code.includes('HOD')) return 'Weekly (Every Friday, 2:30 PM)';
  if (code.includes('ATL')) return 'Weekly (Wednesdays, 3:00 PM)';
  if (duty.scope_name) return `Scope: ${duty.scope_name}`;
  return 'Regular Institutional Cadence';
}

interface TeacherPortfoliosModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolBrand: SchoolBrandProfile;
  organizationId?: string;
  activeSession?: string;
  onShowToast?: (type: 'success' | 'info' | 'error' | 'warning', title: string, msg?: string) => void;
}

export const TeacherPortfoliosModal: React.FC<TeacherPortfoliosModalProps> = ({
  isOpen,
  onClose,
  schoolBrand,
  organizationId: propOrgId,
  activeSession = '2026–27',
  onShowToast
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [portfolios, setPortfolios] = useState<PortfolioResponsibilityEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [facultyList, setFacultyList] = useState<ErpStaffRecord[]>([]);
  const [responsibilityTypes, setResponsibilityTypes] = useState<ResponsibilityTypeRecord[]>([]);

  // Assign In-Charge Modal State
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [assignStaffId, setAssignStaffId] = useState<string>('');
  const [assignRespTypeId, setAssignRespTypeId] = useState<string>('');
  const [assignScopeType, setAssignScopeType] = useState<ResponsibilityScopeType>('SCHOOL');
  const [assignScopeName, setAssignScopeName] = useState<string>('Institutional Charge');
  const [assignNotes, setAssignNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const effectiveOrgId =
    propOrgId ||
    (() => {
      try {
        return (
          localStorage.getItem('dakshora_active_org_id') ||
          localStorage.getItem('dakshora_onboarding_org_id') ||
          JSON.parse(localStorage.getItem('dakshora_superadmin_user') || '{}')?.organizationId ||
          ''
        );
      } catch {
        return '';
      }
    })();

  const isDemoSchool = effectiveOrgId === 'b17780e5-3832-4ac6-9aeb-33fd80c5cb0e';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dutiesRes, typesRes, staffRes] = await Promise.all([
        fetchInstitutionalDuties({ session: activeSession || '2026-27' }),
        fetchResponsibilityTypes({ active: 'true' }),
        fetchErpStaff({ limit: 200 })
      ]);

      const staff = staffRes?.data?.staff || [];
      setFacultyList(staff);

      const types = (typesRes?.data as any)?.responsibilityTypes || (typesRes?.data as any)?.responsibilities || [];
      setResponsibilityTypes(types);

      const realDuties = dutiesRes?.data?.responsibilities || [];

      if (realDuties.length > 0) {
        const mapped: PortfolioResponsibilityEntry[] = realDuties.map((d: any) => {
          const category = resolveCategory(d);
          const keyResponsibilities = resolveDutiesList(d);
          const meetingSchedule = resolveMeetingSchedule(d);
          const tenure = d.academic_session_id
            ? `Session ${d.academic_session_id} Statutory Charge`
            : `Session ${activeSession} Statutory Charge`;

          return {
            id: d.id,
            portfolioName: d.responsibility_name || 'Institutional Charge',
            category,
            inchargeName: d.staff_name || 'Faculty Member',
            empId: d.empId || d.employee_code || '—',
            designation: d.designation || 'Staff In-Charge',
            department: d.department || (d.scope_name ? `Scope: ${d.scope_name}` : 'Academics'),
            phone: d.phone || '—',
            email: d.email || '—',
            keyResponsibilities,
            meetingSchedule,
            tenure
          };
        });
        setPortfolios(mapped);
      } else if (isDemoSchool) {
        setPortfolios(MASTER_TEACHER_PORTFOLIOS);
      } else {
        setPortfolios([]);
      }
    } catch (err: any) {
      console.warn('[TeacherPortfoliosModal] Error loading real duties:', err?.message);
      if (isDemoSchool) {
        setPortfolios(MASTER_TEACHER_PORTFOLIOS);
      }
    } finally {
      setLoading(false);
    }
  }, [activeSession, effectiveOrgId, isDemoSchool]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  if (!isOpen) return null;

  const handleOpenAssign = () => {
    if (facultyList.length > 0 && !assignStaffId) {
      setAssignStaffId(facultyList[0].id);
    }
    if (responsibilityTypes.length > 0 && !assignRespTypeId) {
      setAssignRespTypeId(responsibilityTypes[0].id);
      setAssignScopeType((responsibilityTypes[0].default_scope_type as ResponsibilityScopeType) || 'SCHOOL');
    }
    setShowAssignModal(true);
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignStaffId || !assignRespTypeId) {
      if (onShowToast) onShowToast('warning', 'Selection Required', 'Please select a faculty member and portfolio role.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await assignStaffResponsibility(assignStaffId, {
        responsibility_type_id: assignRespTypeId,
        scope_type: assignScopeType,
        scope_name: assignScopeName || 'Institutional Charge',
        academic_session_id: activeSession || '2026-27',
        is_primary: false,
        notes: assignNotes || undefined
      });

      if (res?.data && res.data.success) {
        if (onShowToast) {
          onShowToast('success', 'Charge Appointed', res.data.message || 'Staff institutional charge successfully registered.');
        }
        setShowAssignModal(false);
        setAssignNotes('');
        await loadData();
      } else {
        if (onShowToast) onShowToast('error', 'Appointment Failed', res?.data?.message || 'Could not assign portfolio.');
      }
    } catch (err: any) {
      if (onShowToast) onShowToast('error', 'Appointment Error', err?.message || 'Failed to register charge.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPortfolios = portfolios.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.portfolioName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.inchargeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      p.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopyPhone = (id: string, phone: string) => {
    if (!phone || phone === '—') return;
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    if (onShowToast) onShowToast('info', 'Phone Copied', phone);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    const headers = [
      'Portfolio Name',
      'Category',
      'In-Charge Teacher',
      'Employee ID',
      'Designation',
      'Department',
      'Phone',
      'Email',
      'Key Responsibilities',
      'Meeting Schedule',
      'Tenure'
    ];
    const rows = filteredPortfolios.map((p) => [
      `"${p.portfolioName}"`,
      `"${p.category}"`,
      `"${p.inchargeName}"`,
      `"${p.empId}"`,
      `"${p.designation}"`,
      `"${p.department}"`,
      `"${p.phone}"`,
      `"${p.email}"`,
      `"${p.keyResponsibilities.join('; ')}"`,
      `"${p.meetingSchedule}"`,
      `"${p.tenure}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Teacher_Charges_Responsibilities_${activeSession.replace('–', '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onShowToast) onShowToast('success', 'CSV Exported', 'Teacher Portfolio Allocation exported');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden ring-1 ring-white/10">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 text-white flex items-center justify-center font-bold shadow-lg shadow-purple-600/30 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight truncate">
                  Teachers Charges & Institutional Responsibilities
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 shrink-0">
                  Office Orders {activeSession}
                </span>
                {loading && (
                  <RefreshCw className="w-4 h-4 text-purple-400 animate-spin shrink-0" />
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                {schoolBrand.schoolName} • Statutory Committees & Portfolio Allocation Matrix
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenAssign}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
              title="Appoint a teacher to an institutional portfolio or committee"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Appoint Charge</span>
            </button>

            <button
              type="button"
              onClick={() => loadData()}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer shadow-xs"
              title="Refresh Roster from Database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
              title="Print official Office Order"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Print Order</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
              title="Download Portfolio CSV"
            >
              <Download className="w-3.5 h-3.5 text-purple-200" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick KPI Strip & Search Filters */}
        <div className="p-4 sm:p-5 bg-slate-900/90 border-b border-slate-800 space-y-3 shrink-0">
          {/* Metric Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400">Total Portfolios</div>
                <div className="text-sm font-bold text-white font-mono">{portfolios.length} Charges</div>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400">Institutional Status</div>
                <div className="text-sm font-bold text-emerald-400 font-mono">
                  {portfolios.length > 0 ? 'Active Directory' : 'Pending Allocation'}
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400">Cadence</div>
                <div className="text-sm font-bold text-cyan-300 font-mono">Weekly & Termly</div>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400">Authority Level</div>
                <div className="text-sm font-bold text-amber-300 font-mono">Delegated Powers</div>
              </div>
            </div>
          </div>

          {/* Search bar & Category Filter Pills */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Committee, Teacher Name, Emp ID, or Department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['All', 'Academics & Exams', 'Discipline & Safety', 'STEM & Innovation', 'Sports & Culture', 'Operations & Administration'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat === 'Operations & Administration' ? 'Operations' : cat === 'Academics & Exams' ? 'Academics' : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Portfolios Cards Grid (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 print:p-0">
          {/* Printable Letterhead (Only visible in Print) */}
          <div className="hidden print:block mb-6 text-center border-b pb-4">
            <h1 className="text-2xl font-black text-black">{schoolBrand.schoolName}</h1>
            <p className="text-sm text-gray-600">
              {schoolBrand.board} • Affiliation No: {schoolBrand.affiliationNo || 'CBSE-2026'}
            </p>
            <p className="text-xs text-gray-500">Official Office Order: Teacher Charges & Committee Portfolios • Session {activeSession}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPortfolios.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-purple-500/50 transition-all space-y-3.5 group shadow-sm hover:shadow-xl hover:shadow-purple-500/5"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${
                        item.category === 'Academics & Exams'
                          ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                          : item.category === 'Discipline & Safety'
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          : item.category === 'STEM & Innovation'
                          ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                          : item.category === 'Sports & Culture'
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                      }`}
                    >
                      {item.category}
                    </span>
                    <h3 className="text-sm font-extrabold text-white group-hover:text-purple-300 transition-colors leading-snug">
                      {item.portfolioName}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 font-bold shrink-0">
                    {item.empId}
                  </span>
                </div>

                {/* In-Charge Details */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>{item.inchargeName}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.designation}</div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.phone && item.phone !== '—' && (
                      <a
                        href={`tel:${item.phone.replace(/[^0-9+]/g, '')}`}
                        className="p-1.5 rounded-lg bg-slate-800 text-cyan-400 hover:text-white transition-colors"
                        title="Direct Line"
                      >
                        <Phone className="w-3 h-3" />
                      </a>
                    )}
                    {item.phone && item.phone !== '—' && (
                      <button
                        type="button"
                        onClick={() => handleCopyPhone(item.id, item.phone)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="Copy Phone"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Key Responsibilities */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <FileText className="w-3 h-3 text-purple-400" />
                    <span>Key Duties & Terms of Reference:</span>
                  </div>
                  <ul className="space-y-1">
                    {item.keyResponsibilities.map((duty, idx) => (
                      <li key={idx} className="text-xs text-slate-300 font-mono flex items-start gap-1.5 leading-relaxed">
                        <span className="text-purple-400 font-bold shrink-0">•</span>
                        <span>{duty}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer Schedule & Tenure */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <div className="flex items-center gap-1 truncate">
                    <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate">{item.meetingSchedule}</span>
                  </div>
                  <span className="text-purple-400 font-bold shrink-0">{item.tenure}</span>
                </div>
              </div>
            ))}

            {filteredPortfolios.length === 0 && !loading && (
              <div className="col-span-2 p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 space-y-3">
                <Award className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-300">No Committee or In-Charge Found</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {searchQuery
                    ? `No matching records found for "${searchQuery}". Try adjusting your search query.`
                    : 'No institutional charges or committees have been appointed yet for this session.'}
                </p>
                <button
                  type="button"
                  onClick={handleOpenAssign}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Appoint First In-Charge</span>
                </button>
              </div>
            )}
          </div>

          {/* Printable Signature Authority Block (Only in Print) */}
          <div className="hidden print:flex justify-between items-end mt-12 pt-6 border-t text-black">
            <div>
              <p className="text-xs font-bold">Generated via DAKSHORA 2.0 SaaS ERP</p>
              <p className="text-[10px] text-gray-500">Official Office Order Date: {new Date().toLocaleDateString('en-IN')}</p>
            </div>
            <div className="text-center">
              <div className="w-48 border-b border-black mb-1"></div>
              <p className="text-xs font-bold">{schoolBrand.principalName || 'Dr. Vikramaditya Singh'}</p>
              <p className="text-[10px] text-gray-600">Principal & Head of Institution</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs font-mono text-slate-400">
            Active Portfolios: <strong className="text-white">{filteredPortfolios.length}</strong> of {portfolios.length}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-purple-600/30"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Office Order</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* APPOINT IN-CHARGE SUB-MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-100 ring-1 ring-purple-500/20">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Appoint Institutional Charge</h3>
                  <p className="text-xs text-slate-400 font-mono">Assign statutory committee or administrative portfolio</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="space-y-4">
              {/* Select Faculty Member */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-300">
                  Select Faculty Member <span className="text-rose-400">*</span>
                </label>
                <select
                  value={assignStaffId}
                  onChange={(e) => setAssignStaffId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                  required
                >
                  <option value="">-- Choose Teacher / Staff Member --</option>
                  {facultyList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.empId || (f as any).employee_code || 'Staff'}) — {f.designation || 'Teacher'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Responsibility Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-300">
                  Select Portfolio / Role <span className="text-rose-400">*</span>
                </label>
                <select
                  value={assignRespTypeId}
                  onChange={(e) => {
                    setAssignRespTypeId(e.target.value);
                    const selected = responsibilityTypes.find((t) => t.id === e.target.value);
                    if (selected?.default_scope_type) {
                      setAssignScopeType(selected.default_scope_type as ResponsibilityScopeType);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                  required
                >
                  <option value="">-- Choose Responsibility / Committee --</option>
                  {responsibilityTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code}) — {t.category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scope Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-300">Scope Type</label>
                  <select
                    value={assignScopeType}
                    onChange={(e) => setAssignScopeType(e.target.value as ResponsibilityScopeType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="SCHOOL">School Wide (Institutional)</option>
                    <option value="WING">Wing Level</option>
                    <option value="DEPARTMENT">Department Level</option>
                    <option value="SECTION">Class / Section</option>
                    <option value="HOUSE">House Level</option>
                    <option value="PROGRAM">Special Program / Cell</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-300">Scope Name / Detail</label>
                  <input
                    type="text"
                    value={assignScopeName}
                    onChange={(e) => setAssignScopeName(e.target.value)}
                    placeholder="e.g. Main Campus / Senior Wing"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Notes / Terms of Reference */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-300">Notes / Circular Reference</label>
                <textarea
                  rows={2}
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="e.g. Appointed per School Academic Council Circular #14 for Session 2026-27"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Appoint In-Charge</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
