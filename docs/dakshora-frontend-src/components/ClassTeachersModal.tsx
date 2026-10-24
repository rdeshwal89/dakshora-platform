import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  Search,
  Users,
  GraduationCap,
  Phone,
  Building2,
  CheckCircle2,
  Filter,
  Copy,
  Check,
  ShieldCheck,
  Layers,
  Sparkles
} from 'lucide-react';
import { SchoolBrandProfile } from './SchoolBrandingModal';

export interface ClassTeacherEntry {
  id: string;
  stage: 'Foundational' | 'Preparatory' | 'Middle' | 'Secondary' | 'Senior Secondary';
  stageAge: string;
  grade: string;
  section: string;
  roomNumber: string;
  capacity: number;
  enrolledStudents: number;
  classTeacherName: string;
  empId: string;
  designation: string;
  phone: string;
  email: string;
  specialization: string;
}

export const MASTER_CLASS_TEACHERS: ClassTeacherEntry[] = [
  // 1. Foundational Stage (5 Years, Ages 3–8)
  {
    id: 'ct-nur-a',
    stage: 'Foundational',
    stageAge: 'Ages 3–4',
    grade: 'Nursery',
    section: 'A',
    roomNumber: 'Room 101',
    capacity: 30,
    enrolledStudents: 28,
    classTeacherName: 'Anita Sharma',
    empId: 'FAC-101',
    designation: 'NTT Early Childhood Lead',
    phone: '+91 98101 11001',
    email: 'anita.sharma@dakshora.edu.in',
    specialization: 'Montessori & Early Sensory Motor Skills'
  },
  {
    id: 'ct-lkg-a',
    stage: 'Foundational',
    stageAge: 'Ages 4–5',
    grade: 'LKG',
    section: 'A',
    roomNumber: 'Room 102',
    capacity: 30,
    enrolledStudents: 30,
    classTeacherName: 'Pooja Verma',
    empId: 'FAC-102',
    designation: 'NTT Early Literacy Faculty',
    phone: '+91 98101 11002',
    email: 'pooja.verma@dakshora.edu.in',
    specialization: 'Phonics & Numeracy Foundations'
  },
  {
    id: 'ct-ukg-a',
    stage: 'Foundational',
    stageAge: 'Ages 5–6',
    grade: 'UKG',
    section: 'A',
    roomNumber: 'Room 103',
    capacity: 30,
    enrolledStudents: 30,
    classTeacherName: 'Sunita Mehra',
    empId: 'FAC-103',
    designation: 'Senior Pre-Primary Mentor',
    phone: '+91 98101 11003',
    email: 'sunita.mehra@dakshora.edu.in',
    specialization: 'Pre-Primary Transition & Rhyme Pedagogies'
  },
  {
    id: 'ct-cls1-a',
    stage: 'Foundational',
    stageAge: 'Ages 6–7',
    grade: 'Class 1',
    section: 'A',
    roomNumber: 'Room 201',
    capacity: 40,
    enrolledStudents: 38,
    classTeacherName: 'Kavita Joshi',
    empId: 'FAC-104',
    designation: 'PRT Primary Educator',
    phone: '+91 98101 11004',
    email: 'kavita.joshi@dakshora.edu.in',
    specialization: 'English & Basic Environmental Studies'
  },
  {
    id: 'ct-cls2-a',
    stage: 'Foundational',
    stageAge: 'Ages 7–8',
    grade: 'Class 2',
    section: 'A',
    roomNumber: 'Room 202',
    capacity: 40,
    enrolledStudents: 39,
    classTeacherName: 'Deepak Bhatt',
    empId: 'FAC-105',
    designation: 'PRT Mathematics & Hindi',
    phone: '+91 98101 11005',
    email: 'deepak.bhatt@dakshora.edu.in',
    specialization: 'Foundational Numeracy & Storytelling'
  },

  // 2. Preparatory Stage (3 Years, Ages 8–11)
  {
    id: 'ct-cls3-a',
    stage: 'Preparatory',
    stageAge: 'Ages 8–9',
    grade: 'Class 3',
    section: 'A',
    roomNumber: 'Room 203',
    capacity: 40,
    enrolledStudents: 40,
    classTeacherName: 'Ritu Kapoor',
    empId: 'FAC-106',
    designation: 'PRT English & Social Studies',
    phone: '+91 98101 11006',
    email: 'ritu.kapoor@dakshora.edu.in',
    specialization: 'Language Comprehension & Creative Arts'
  },
  {
    id: 'ct-cls4-a',
    stage: 'Preparatory',
    stageAge: 'Ages 9–10',
    grade: 'Class 4',
    section: 'A',
    roomNumber: 'Room 204',
    capacity: 40,
    enrolledStudents: 39,
    classTeacherName: 'Sunita Chawla',
    empId: 'FAC-03',
    designation: 'TGT Science & STEM Coordinator',
    phone: '+91 98100 00333',
    email: 'sunita.science@dpsheritage.edu.in',
    specialization: 'Natural Sciences & ATAL Tinkering Lab'
  },
  {
    id: 'ct-cls5-a',
    stage: 'Preparatory',
    stageAge: 'Ages 10–11',
    grade: 'Class 5',
    section: 'A',
    roomNumber: 'Room 205',
    capacity: 40,
    enrolledStudents: 38,
    classTeacherName: 'Neha Tyagi',
    empId: 'FAC-107',
    designation: 'PRT Hindi & Sanskrit',
    phone: '+91 98101 11007',
    email: 'neha.tyagi@dakshora.edu.in',
    specialization: 'Vedic Grammar, Hindi & Moral Science'
  },

  // 3. Middle Stage (3 Years, Ages 11–14)
  {
    id: 'ct-cls6-a',
    stage: 'Middle',
    stageAge: 'Ages 11–12',
    grade: 'Class 6',
    section: 'A',
    roomNumber: 'Room 301',
    capacity: 40,
    enrolledStudents: 40,
    classTeacherName: 'Dr. Alok Nath',
    empId: 'FAC-108',
    designation: 'TGT Social Sciences & History',
    phone: '+91 98101 11008',
    email: 'alok.nath@dakshora.edu.in',
    specialization: 'Indian History, Civics & Geography'
  },
  {
    id: 'ct-cls7-a',
    stage: 'Middle',
    stageAge: 'Ages 12–13',
    grade: 'Class 7',
    section: 'A',
    roomNumber: 'Room 302',
    capacity: 40,
    enrolledStudents: 39,
    classTeacherName: 'Vandana Sen',
    empId: 'FAC-109',
    designation: 'TGT English Literature & Debate',
    phone: '+91 98101 11009',
    email: 'vandana.sen@dakshora.edu.in',
    specialization: 'Literary Arts, Grammar & Elocution'
  },
  {
    id: 'ct-cls8-a',
    stage: 'Middle',
    stageAge: 'Ages 13–14',
    grade: 'Class 8',
    section: 'A',
    roomNumber: 'Room 303',
    capacity: 40,
    enrolledStudents: 40,
    classTeacherName: 'Praveen Yadav',
    empId: 'FAC-110',
    designation: 'TGT Physical Sciences & Sports',
    phone: '+91 98101 11010',
    email: 'praveen.yadav@dakshora.edu.in',
    specialization: 'Integrated Sciences & Athletics'
  },

  // 4. Secondary Stage (Classes 9 & 10)
  {
    id: 'ct-cls9-a',
    stage: 'Secondary',
    stageAge: 'Ages 14–15',
    grade: 'Class 9',
    section: 'A',
    roomNumber: 'Room 401',
    capacity: 40,
    enrolledStudents: 40,
    classTeacherName: 'Rajeev Malhotra',
    empId: 'FAC-02',
    designation: 'Senior PGT Mathematics',
    phone: '+91 98100 00222',
    email: 'rajeev.math@dpsheritage.edu.in',
    specialization: 'Algebra, Geometry & Academic Dean'
  },
  {
    id: 'ct-cls9-b',
    stage: 'Secondary',
    stageAge: 'Ages 14–15',
    grade: 'Class 9',
    section: 'B',
    roomNumber: 'Room 402',
    capacity: 40,
    enrolledStudents: 38,
    classTeacherName: 'Geeta Mathur',
    empId: 'FAC-111',
    designation: 'TGT Hindi & Sanskrit HOD',
    phone: '+91 98101 11011',
    email: 'geeta.mathur@dakshora.edu.in',
    specialization: 'CBSE Secondary Hindi Curriculum'
  },
  {
    id: 'ct-cls10-a',
    stage: 'Secondary',
    stageAge: 'Ages 15–16',
    grade: 'Class 10',
    section: 'A',
    roomNumber: 'Room 403',
    capacity: 40,
    enrolledStudents: 40,
    classTeacherName: 'Suresh Menon',
    empId: 'FAC-112',
    designation: 'PGT Physics & Science Lead',
    phone: '+91 98101 11012',
    email: 'suresh.menon@dakshora.edu.in',
    specialization: 'Mechanics, Electromagnetism & Lab Head'
  },
  {
    id: 'ct-cls10-b',
    stage: 'Secondary',
    stageAge: 'Ages 15–16',
    grade: 'Class 10',
    section: 'B',
    roomNumber: 'Room 404',
    capacity: 40,
    enrolledStudents: 39,
    classTeacherName: 'Arun Singh',
    empId: 'FAC-113',
    designation: 'TGT Social Sciences & Economics',
    phone: '+91 98101 11013',
    email: 'arun.singh@dakshora.edu.in',
    specialization: 'CBSE Board Social Science Preparation'
  },

  // 5. Senior Secondary Stage (Classes 11 & 12 - Stream Combinations)
  {
    id: 'ct-cls11-sci',
    stage: 'Senior Secondary',
    stageAge: 'Ages 16–17',
    grade: 'Class 11 Science (PCM/B)',
    section: 'A',
    roomNumber: 'Senior Lab 1',
    capacity: 35,
    enrolledStudents: 34,
    classTeacherName: 'Dr. V. K. Rao',
    empId: 'FAC-114',
    designation: 'PGT Chemistry & Research Mentor',
    phone: '+91 98101 11014',
    email: 'vk.rao@dakshora.edu.in',
    specialization: 'Organic & Physical Chemistry, JEE Guidance'
  },
  {
    id: 'ct-cls11-com',
    stage: 'Senior Secondary',
    stageAge: 'Ages 16–17',
    grade: 'Class 11 Commerce',
    section: 'A',
    roomNumber: 'Room 501',
    capacity: 35,
    enrolledStudents: 32,
    classTeacherName: 'Anuradha Paul',
    empId: 'FAC-115',
    designation: 'PGT Accountancy & Financial Markets',
    phone: '+91 98101 11015',
    email: 'anuradha.paul@dakshora.edu.in',
    specialization: 'Double Entry Bookkeeping & Economics'
  },
  {
    id: 'ct-cls11-art',
    stage: 'Senior Secondary',
    stageAge: 'Ages 16–17',
    grade: 'Class 11 Humanities / Arts',
    section: 'A',
    roomNumber: 'Room 502',
    capacity: 35,
    enrolledStudents: 26,
    classTeacherName: 'Shalini Trivedi',
    empId: 'FAC-116',
    designation: 'PGT Political Science & Legal Studies',
    phone: '+91 98101 11016',
    email: 'shalini.trivedi@dakshora.edu.in',
    specialization: 'Indian Constitution, International Relations'
  },
  {
    id: 'ct-cls12-sci',
    stage: 'Senior Secondary',
    stageAge: 'Ages 17–18',
    grade: 'Class 12 Science (PCM/B)',
    section: 'A',
    roomNumber: 'Senior Lab 2',
    capacity: 35,
    enrolledStudents: 35,
    classTeacherName: 'Dr. R. K. Saxena',
    empId: 'FAC-117',
    designation: 'PGT Physics & Controller of Exams',
    phone: '+91 98101 11017',
    email: 'rk.saxena@dakshora.edu.in',
    specialization: 'Modern Physics, CBSE Board Evaluation'
  },
  {
    id: 'ct-cls12-com',
    stage: 'Senior Secondary',
    stageAge: 'Ages 17–18',
    grade: 'Class 12 Commerce',
    section: 'A',
    roomNumber: 'Room 503',
    capacity: 35,
    enrolledStudents: 31,
    classTeacherName: 'Harish Bajaj',
    empId: 'FAC-118',
    designation: 'PGT Business Studies & Marketing',
    phone: '+91 98101 11018',
    email: 'harish.bajaj@dakshora.edu.in',
    specialization: 'Principles of Management & Entrepreneurship'
  },
  {
    id: 'ct-cls12-art',
    stage: 'Senior Secondary',
    stageAge: 'Ages 17–18',
    grade: 'Class 12 Humanities / Arts',
    section: 'A',
    roomNumber: 'Room 504',
    capacity: 35,
    enrolledStudents: 25,
    classTeacherName: 'Meenakshi Rawat',
    empId: 'FAC-119',
    designation: 'PGT Psychology & Behavioral Sciences',
    phone: '+91 98101 11019',
    email: 'meenakshi.rawat@dakshora.edu.in',
    specialization: 'Clinical Psychology & Student Counselor'
  }
];

interface ClassTeachersModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolBrand: SchoolBrandProfile;
  activeSession?: string;
  onShowToast?: (type: 'success' | 'info', title: string, msg?: string) => void;
}

export const ClassTeachersModal: React.FC<ClassTeachersModalProps> = ({
  isOpen,
  onClose,
  schoolBrand,
  activeSession = '2026–27',
  onShowToast
}) => {
  const [selectedStage, setSelectedStage] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredTeachers = MASTER_CLASS_TEACHERS.filter((item) => {
    const matchesStage = selectedStage === 'All' || item.stage === selectedStage;
    const matchesSearch =
      item.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.classTeacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.phone.includes(searchQuery) ||
      item.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStage && matchesSearch;
  });

  const totalStudents = MASTER_CLASS_TEACHERS.reduce((acc, curr) => acc + curr.enrolledStudents, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyPhone = (id: string, phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    if (onShowToast) onShowToast('info', 'Phone Copied', phone);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    const headers = [
      'Grade',
      'Section',
      'Stage',
      'Room Number',
      'Class Teacher Name',
      'Employee ID',
      'Designation',
      'Phone Number',
      'Email',
      'Capacity',
      'Enrolled Students'
    ];
    const rows = MASTER_CLASS_TEACHERS.map((t) => [
      `"${t.grade}"`,
      `"${t.section}"`,
      `"${t.stage}"`,
      `"${t.roomNumber}"`,
      `"${t.classTeacherName}"`,
      `"${t.empId}"`,
      `"${t.designation}"`,
      `"${t.phone}"`,
      `"${t.email}"`,
      t.capacity,
      t.enrolledStudents
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Class_Teachers_Nursery_to_12_${activeSession.replace('–', '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onShowToast) onShowToast('success', 'CSV Exported', 'Master Class Teachers directory downloaded');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden ring-1 ring-white/10">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-600/30 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight truncate">
                  Master Class Teachers Directory
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shrink-0">
                  Nursery to 12th
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                {schoolBrand.schoolName} • Session {activeSession} • Real Academic Registry
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
              title="Print official PDF roster"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Print PDF</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
              title="Download CSV Spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-cyan-200" />
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
          {/* 3 Metric Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400">Total Sections</div>
                <div className="text-sm font-bold text-white font-mono">{MASTER_CLASS_TEACHERS.length} Classes</div>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400">Assignment Status</div>
                <div className="text-sm font-bold text-emerald-400 font-mono">100% Allocated</div>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400">Enrolled Students</div>
                <div className="text-sm font-bold text-cyan-300 font-mono">{totalStudents} Total</div>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400">Curricular Framework</div>
                <div className="text-sm font-bold text-purple-300 font-mono">NEP 2020 5+3+3+4</div>
              </div>
            </div>
          </div>

          {/* Search bar & Stage Filter Pills */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Class, Teacher Name, Emp ID, Room, or Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['All', 'Foundational', 'Preparatory', 'Middle', 'Secondary', 'Senior Secondary'].map((stg) => (
                <button
                  key={stg}
                  type="button"
                  onClick={() => setSelectedStage(stg)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer shrink-0 ${
                    selectedStage === stg
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {stg === 'Senior Secondary' ? 'Senior Sec (11-12)' : stg}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 print:p-0">
          {/* Printable Letterhead (Only visible in Print) */}
          <div className="hidden print:block mb-6 text-center border-b pb-4">
            <h1 className="text-2xl font-black text-black">{schoolBrand.schoolName}</h1>
            <p className="text-sm text-gray-600">
              {schoolBrand.board} • Affiliation No: {schoolBrand.affiliationNo || 'CBSE-2026'}
            </p>
            <p className="text-xs text-gray-500">Official Master Class Teachers Allocation • Academic Session {activeSession}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-inner">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Class & Section</th>
                    <th className="p-3">NEP Stage</th>
                    <th className="p-3">Room</th>
                    <th className="p-3">Class Teacher</th>
                    <th className="p-3">Emp ID</th>
                    <th className="p-3">Designation</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3 text-right">Students</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredTeachers.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-900/80 transition-colors group">
                      <td className="p-3 font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span>
                        <span>{row.grade}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            row.stage === 'Foundational'
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                              : row.stage === 'Preparatory'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : row.stage === 'Middle'
                              ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                              : row.stage === 'Secondary'
                              ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                              : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                          }`}
                        >
                          {row.stage}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300 font-semibold">{row.roomNumber}</td>
                      <td className="p-3">
                        <div className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {row.classTeacherName}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[180px]">{row.specialization}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] font-bold border border-slate-700">
                          {row.empId}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">{row.designation}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${row.phone.replace(/[^0-9+]/g, '')}`}
                            className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{row.phone}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopyPhone(row.id, row.phone)}
                            className="p-1 text-slate-500 hover:text-white transition-colors cursor-pointer"
                            title="Copy Phone Number"
                          >
                            {copiedId === row.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-400 font-mono">
                        {row.enrolledStudents} / {row.capacity}
                      </td>
                    </tr>
                  ))}

                  {filteredTeachers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        No class teachers found matching "{searchQuery}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Printable Signature Authority Block (Only in Print) */}
          <div className="hidden print:flex justify-between items-end mt-12 pt-6 border-t text-black">
            <div>
              <p className="text-xs font-bold">Generated via DAKSHORA 2.0 SaaS ERP</p>
              <p className="text-[10px] text-gray-500">Official Roster Date: {new Date().toLocaleDateString('en-IN')}</p>
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
            Showing <strong className="text-white">{filteredTeachers.length}</strong> of {MASTER_CLASS_TEACHERS.length} classes
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/30"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Class Teachers PDF</span>
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
    </div>
  );
};
