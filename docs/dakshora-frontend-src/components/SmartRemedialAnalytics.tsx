import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Printer,
  Sparkles,
  Phone,
  Calendar,
  CheckCircle2,
  Users,
  Search,
  Filter,
  RefreshCw,
  Send,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  FileText,
  UserCheck,
  Award
} from 'lucide-react';

interface RemedialStudent {
  id: string;
  name: string;
  rollNo: string;
  grade: string;
  section: string;
  parentName: string;
  parentPhone: string;
  subject: string;
  examName: string;
  scoredMarks: number;
  totalMarks: number;
  percentage: number;
  severity: 'critical' | 'moderate' | 'borderline';
  weakTopics: string[];
  rootCause: string;
  recommendedIntervention: string;
  remedialTeacher: string;
  remedialSchedule: string;
  retestDate: string;
  targetMarks: number;
  parentAdvisory: string;
}

const SAMPLE_REMEDIAL_STUDENTS: RemedialStudent[] = [
  {
    id: 'rem-101',
    name: 'Aarav Sharma (आरव शर्मा)',
    rollNo: '10A-12',
    grade: 'Class 10',
    section: 'A',
    parentName: 'राजेश शर्मा (Rajesh Sharma)',
    parentPhone: '9829012345',
    subject: 'Mathematics (गणित)',
    examName: 'Periodic Assessment - 1',
    scoredMarks: 28,
    totalMarks: 80,
    percentage: 35.0,
    severity: 'critical',
    weakTopics: [
      'द्विघात समीकरण सूत्र (Quadratic Formula application)',
      'त्रिकोणमितीय सर्वसमिकाएं (Trigonometric Identities proof)',
      'समय प्रबंधन व गणना त्रुटि (Time management in section D)'
    ],
    rootCause: 'मूलभूत सूत्रों में संशय एवं अभ्यास की कमी (Conceptual confusion in formula derivation)',
    recommendedIntervention: 'दैनिक 45 मिनट जीरो-पीरियड डाउट क्लास (Zero-Period Doubt Session) + 50 चयनित प्रश्नों की फॉर्मूला बुकलेट',
    remedialTeacher: 'Er. Sandeep Joshi (PGT Math)',
    remedialSchedule: 'सोमवार व गुरुवार (3:30 PM - 4:15 PM, Room #204)',
    retestDate: '15 October 2026',
    targetMarks: 48,
    parentAdvisory: 'घर पर प्रतिदिन शाम 1 घंटा शांत वातावरण में गणित अभ्यास सुनिश्चित करें तथा मोबाइल उपयोग 30 मिनट तक सीमित रखें।'
  },
  {
    id: 'rem-102',
    name: 'Priya Verma (प्रिया वर्मा)',
    rollNo: '10A-18',
    grade: 'Class 10',
    section: 'A',
    parentName: 'विनोद वर्मा (Vinod Verma)',
    parentPhone: '9414088921',
    subject: 'Science (विज्ञान)',
    examName: 'Periodic Assessment - 1',
    scoredMarks: 31,
    totalMarks: 80,
    percentage: 38.75,
    severity: 'critical',
    weakTopics: [
      'किरण आरेख निर्माण (Ray Optics diagrams)',
      'रासायनिक अभिक्रियाओं का संतुलन (Chemical Equation Balancing)',
      'नेफ्रॉन व हृदय का नामांकित चित्र (Biology anatomical diagrams)'
    ],
    rootCause: 'आरेख अभ्यास एवं तकनीकी शब्दावली में कठिनाई (Lack of diagrammatic drawing practice)',
    recommendedIntervention: 'स्टेप-बाय-स्टेप डायग्राम वर्कबुक + प्रयोगशाला में व्यावहारिक मॉडल प्रदर्शन',
    remedialTeacher: 'Dr. Sunita Rao (Senior PGT Science)',
    remedialSchedule: 'मंगलवार व शुक्रवार (3:30 PM - 4:15 PM, Science Lab)',
    retestDate: '16 October 2026',
    targetMarks: 50,
    parentAdvisory: 'अभिभावक प्रतिदिन छात्र द्वारा बनाए गए नामांकित चित्रों का निरीक्षण करें तथा प्रोत्साहित करें।'
  },
  {
    id: 'rem-103',
    name: 'Rohan Meena (रोहन मीणा)',
    rollNo: '10B-09',
    grade: 'Class 10',
    section: 'B',
    parentName: 'महेश मीणा (Mahesh Meena)',
    parentPhone: '9782044190',
    subject: 'Social Science (सामाजिक विज्ञान)',
    examName: 'Periodic Assessment - 1',
    scoredMarks: 25,
    totalMarks: 80,
    percentage: 31.25,
    severity: 'critical',
    weakTopics: [
      'भारत में राष्ट्रवाद कालक्रम (Nationalism in India Timeline)',
      'भूगोल मानचित्र अंकन (Geography Map pointing)',
      'अर्थव्यवस्था के क्षेत्रक (Economic Sectors definitions)'
    ],
    rootCause: 'दीर्घ उत्तरीय प्रश्नों के संरचनात्मक लेखन में कमी (Poor answer structure in 5-mark questions)',
    recommendedIntervention: 'फ्लोचार्ट आधारित संक्षिप्त नोट्स + साप्ताहिक 2 मानचित्र अभ्यास पत्रक',
    remedialTeacher: 'Prof. Rajesh Mehra (PGT SST)',
    remedialSchedule: 'बुधवार व शनिवार (3:30 PM - 4:15 PM, Room #108)',
    retestDate: '17 October 2026',
    targetMarks: 45,
    parentAdvisory: 'घर पर पाठ्यपुस्तक के अध्यायों का सस्वर पाठन कराएं एवं मुख्य बिंदुओं को रेखांकित कराएं।'
  },
  {
    id: 'rem-104',
    name: 'Kavita Choudhary (कविता चौधरी)',
    rollNo: '10A-27',
    grade: 'Class 10',
    section: 'A',
    parentName: 'रामनिवास चौधरी (Ramniwas Choudhary)',
    parentPhone: '9602155890',
    subject: 'English (अंग्रेजी)',
    examName: 'Periodic Assessment - 1',
    scoredMarks: 34,
    totalMarks: 80,
    percentage: 42.5,
    severity: 'borderline',
    weakTopics: [
      'औपचारिक पत्र प्रारूप (Formal Letter Format)',
      'रिपोर्टेड स्पीच एवं काल (Reported Speech & Tenses grammar)',
      'अपठित गद्यांश से निष्कर्ष निकालना (Reading comprehension inference)'
    ],
    rootCause: 'व्याकरण नियमों में भ्रम एवं शब्दावली का सीमित ज्ञान (Grammar mechanics confusion)',
    recommendedIntervention: 'दैनिक 10 नए शब्दार्थ डायरी + पीयर लर्निंग बडी (Peer Learning Buddy)',
    remedialTeacher: 'Ms. Pooja Nair (PGT English)',
    remedialSchedule: 'प्रतिदिन प्रार्थना सभा के बाद 15 मिनट व्यक्तिगत सत्र',
    retestDate: '18 October 2026',
    targetMarks: 52,
    parentAdvisory: 'घर पर अंग्रेजी समाचार पत्र के बाल परिशिष्ट का 15 मिनट पठन कराएं।'
  }
];

export const SmartRemedialAnalytics: React.FC<{
  onShowToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}> = ({ onShowToast }) => {
  const [students, setStudents] = useState<RemedialStudent[]>(SAMPLE_REMEDIAL_STUDENTS);
  const [selectedStudent, setSelectedStudent] = useState<RemedialStudent>(SAMPLE_REMEDIAL_STUDENTS[0]);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [sendingSmsId, setSendingSmsId] = useState<string | null>(null);

  const filteredStudents = students.filter((s) => {
    if (filterSeverity !== 'all' && s.severity !== filterSeverity) return false;
    if (filterSubject !== 'all' && !s.subject.includes(filterSubject)) return false;
    return true;
  });

  const handleSendReminderSms = (std: RemedialStudent) => {
    setSendingSmsId(std.id);
    setTimeout(() => {
      setSendingSmsId(null);
      onShowToast?.(
        'success',
        'अभिभावक को सुधारात्मक परामर्श प्रेषित',
        `${std.parentName} को ${std.subject} की विशेष उपचारात्मक कक्षा (${std.remedialSchedule}) का SMS व WhatsApp संदेश सफलतापूर्वक भेजा गया।`
      );
    }, 700);
  };

  const handleTriggerPrint = () => {
    onShowToast?.('info', 'प्रिंट विंडो प्रारंभ', 'सुधारात्मक कार्ययोजना A4 रिपोर्ट प्रिंटर या PDF हेतु तैयार');
    setTimeout(() => {
      window.print();
    }, 250);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-rose-500/30 bg-gradient-to-r from-rose-950/30 via-slate-900/90 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">Smart Remedial Analytics & Action Report</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                AI Gap Diagnosis
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              कम मार्क्स वाले (Below 40%) विद्यार्थियों के लिए स्वतः अधिगम-अंतराल विश्लेषण एवं व्यक्तिगत सुधारात्मक कार्ययोजना।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSendReminderSms(selectedStudent)}
            disabled={sendingSmsId === selectedStudent.id}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-all"
          >
            {sendingSmsId === selectedStudent.id ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Phone className="w-3.5 h-3.5" />
            )}
            <span>SMS/WhatsApp Parent Alert</span>
          </button>
          <button
            onClick={handleTriggerPrint}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs font-mono flex items-center gap-1.5 shadow-lg shadow-rose-600/20"
          >
            <Printer className="w-4 h-4" />
            <span>Print Remedial Report (A4)</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
          <span className="text-slate-400 block text-[11px]">कुल चिन्हित विद्यार्थी (At-Risk):</span>
          <span className="text-xl font-black text-white mt-0.5 block">{students.length} छात्र</span>
          <span className="text-[10px] text-rose-400">स्कोर &lt; 40% या ग्रेड D/E</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
          <span className="text-slate-400 block text-[11px]">अति-संवेदनशील (Critical):</span>
          <span className="text-xl font-black text-rose-400 mt-0.5 block">
            {students.filter((s) => s.severity === 'critical').length} छात्र
          </span>
          <span className="text-[10px] text-slate-500">त्वरित हस्तक्षेप आवश्यक</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
          <span className="text-slate-400 block text-[11px]">उपचारात्मक कक्षाएं (Sessions):</span>
          <span className="text-xl font-black text-amber-400 mt-0.5 block">4 बैच/सप्ताह</span>
          <span className="text-[10px] text-slate-500">जीरो-पीरियड में संचालित</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
          <span className="text-slate-400 block text-[11px]">पुनः परीक्षा लक्ष्य (Target Score):</span>
          <span className="text-xl font-black text-emerald-400 mt-0.5 block">55%+ अंक</span>
          <span className="text-[10px] text-slate-500">सत्र परीक्षा से पूर्व</span>
        </div>
      </div>

      {/* Main Container: Left Student List + Right Individual Remedial Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Student Selector List (4 cols) */}
        <div className="lg:col-span-4 space-y-3 font-mono">
          <div className="glass-panel p-4 rounded-3xl border border-slate-800 bg-slate-950/70 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-rose-400" /> सुधारात्मक विद्यार्थी सूची
              </span>
              <span className="text-[10px] text-slate-400">Class 10 (2026-27)</span>
            </div>

            {/* Quick Filters */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 focus:outline-none"
              >
                <option value="all">सभी स्तर (All)</option>
                <option value="critical">अति-संवेदनशील (Critical)</option>
                <option value="borderline">सीमांत (Borderline)</option>
              </select>

              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 focus:outline-none"
              >
                <option value="all">सभी विषय</option>
                <option value="Math">गणित (Math)</option>
                <option value="Science">विज्ञान (Science)</option>
                <option value="Social">सामाजिक विज्ञान</option>
                <option value="English">अंग्रेजी</option>
              </select>
            </div>

            {/* Student Cards List */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredStudents.map((std) => {
                const isSelected = selectedStudent.id === std.id;
                return (
                  <div
                    key={std.id}
                    onClick={() => setSelectedStudent(std)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-950/50'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white leading-tight">{std.name}</h4>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {std.rollNo} • {std.subject}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                          std.severity === 'critical'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {std.percentage}%
                      </span>
                    </div>

                    <div className="mt-2 text-[10px] text-slate-400 line-clamp-1">
                      ⚠️ {std.weakTopics[0]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Detailed Remedial Action Dossier (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-white text-slate-900 shadow-2xl font-serif space-y-6">
            {/* Header */}
            <div className="text-center space-y-1 border-b-2 border-slate-900 pb-4 font-sans">
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
                DAKSHORA SENIOR SECONDARY SCHOOL, JAIPUR
              </div>
              <h2 className="text-xl font-black text-slate-950 tracking-wide uppercase pt-0.5">
                विद्यार्थी व्यक्तिगत सुधारात्मक कार्ययोजना (REMEDIAL ACTION PLAN)
              </h2>
              <div className="text-xs text-rose-950 font-bold font-mono">
                सत्र 2026-2027 • गोपनीय उपचारात्मक अधिगम रिपोर्ट (CONFIDENTIAL ACADEMIC INTERVENTION)
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold text-slate-800 pt-3 border-t border-slate-200">
                <div className="text-left">विद्यार्थी: <b className="text-slate-950">{selectedStudent.name}</b></div>
                <div className="text-left">रोल / कक्षा: <b className="text-slate-950">{selectedStudent.rollNo} ({selectedStudent.grade})</b></div>
                <div className="text-left">कमजोर विषय: <b className="text-rose-900">{selectedStudent.subject}</b></div>
                <div className="text-left">प्राप्तांक: <b className="text-rose-900">{selectedStudent.scoredMarks}/{selectedStudent.totalMarks} ({selectedStudent.percentage}%)</b></div>
              </div>
            </div>

            {/* Section 1: AI Learning Gap Diagnosis */}
            <div className="space-y-3 font-sans text-xs">
              <div className="bg-rose-50 border-l-4 border-rose-600 p-2.5 font-bold text-rose-950 uppercase tracking-wide">
                1. अधिगम अंतराल एवं कमजोर विषय-वस्तु (IDENTIFIED LEARNING GAPS)
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-slate-800">
                  <b>कठिनाई वाले प्रमुख टॉपिक्स (Weak Sub-topics):</b>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-slate-700 pl-2">
                    {selectedStudent.weakTopics.map((topic, idx) => (
                      <li key={idx}><span className="font-semibold">{topic}</span></li>
                    ))}
                  </ul>
                </div>
                <div className="text-slate-800 pt-1 border-t border-slate-200">
                  <b>मूलभूत कारण (Root Cause Analysis):</b>{' '}
                  <span className="text-slate-700">{selectedStudent.rootCause}</span>
                </div>
              </div>
            </div>

            {/* Section 2: Zero-Period Schedule & Teacher Intervention */}
            <div className="space-y-3 font-sans text-xs">
              <div className="bg-emerald-50 border-l-4 border-emerald-600 p-2.5 font-bold text-emerald-950 uppercase tracking-wide">
                2. उपचारात्मक शिक्षण रणनीति एवं समय-सारणी (INTERVENTION STRATEGY)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <b>मार्गदर्शक शिक्षक (Mentoring Faculty):</b>
                  <div className="text-slate-900 font-bold">{selectedStudent.remedialTeacher}</div>
                  <div className="text-[11px] text-slate-600 pt-1">
                    <b>कक्षा समय (Schedule):</b> {selectedStudent.remedialSchedule}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <b>सुधारात्मक विधि (Remedial Method):</b>
                  <div className="text-slate-700 text-[11px] leading-tight">
                    {selectedStudent.recommendedIntervention}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Parent Advisory & Home Support */}
            <div className="space-y-3 font-sans text-xs">
              <div className="bg-amber-50 border-l-4 border-amber-600 p-2.5 font-bold text-amber-950 uppercase tracking-wide">
                3. अभिभावक सहयोगात्मक परामर्श (PARENT COLLABORATIVE ADVISORY)
              </div>
              <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2 text-slate-800">
                <p className="leading-relaxed">
                  प्रिय अभिभावक श्री <b>{selectedStudent.parentName}</b>,<br />
                  छात्र की शैक्षणिक प्रगति के सतत उन्नयन हेतु विद्यालय द्वारा विशेष उपचारात्मक कक्षाएं प्रारंभ की जा रही हैं। कृपया निम्नलिखित बिंदुओं का पालन कराएं:
                </p>
                <div className="p-2.5 rounded-lg bg-white border border-amber-200 text-[11px] text-slate-700 font-medium">
                  📌 {selectedStudent.parentAdvisory}
                </div>
                <div className="text-[11px] text-slate-500">
                  अभिभावक संपर्क नंबर: <b>+91 {selectedStudent.parentPhone}</b> • उपस्थिति अनिवार्य है।
                </div>
              </div>
            </div>

            {/* Section 4: Retest & Milestones */}
            <div className="space-y-3 font-sans text-xs">
              <div className="bg-blue-50 border-l-4 border-blue-600 p-2.5 font-bold text-blue-950 uppercase tracking-wide">
                4. पुनः मूल्यांकन एवं लक्ष्य निर्धारण (RE-TEST & TARGET MILESTONE)
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap justify-between items-center gap-3">
                <div>
                  <span className="text-slate-500 block text-[11px]">पुनः परीक्षा तिथि (Re-test Date):</span>
                  <span className="font-bold text-slate-950 text-sm">{selectedStudent.retestDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">वर्तमान स्कोर (Current):</span>
                  <span className="font-bold text-rose-700 text-sm">
                    {selectedStudent.scoredMarks}/{selectedStudent.totalMarks} ({selectedStudent.percentage}%)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">अपेक्षित लक्ष्य (Target Milestone):</span>
                  <span className="font-bold text-emerald-800 text-sm">
                    {selectedStudent.targetMarks}/{selectedStudent.totalMarks} (60.0%+)
                  </span>
                </div>
              </div>
            </div>

            {/* Tri-Party Signatures */}
            <div className="pt-8 border-t-2 border-slate-900 font-sans">
              <div className="grid grid-cols-3 gap-4 items-end text-center">
                <div className="space-y-1">
                  <div className="h-8 flex items-center justify-center font-serif italic text-xs text-slate-700">
                    {selectedStudent.remedialTeacher}
                  </div>
                  <div className="border-t border-slate-800 pt-1 font-bold text-[11px] text-slate-950">
                    विषय अध्यापक हस्ताक्षर
                  </div>
                  <div className="text-[9px] text-slate-500">(Subject Specialist)</div>
                </div>

                <div className="space-y-1">
                  <div className="h-8 flex items-center justify-center font-serif italic text-xs text-slate-700">
                    Sunita Rao
                  </div>
                  <div className="border-t border-slate-800 pt-1 font-bold text-[11px] text-slate-950">
                    कक्षाध्यापक हस्ताक्षर
                  </div>
                  <div className="text-[9px] text-slate-500">(Class Teacher)</div>
                </div>

                <div className="space-y-1">
                  <div className="h-8 flex items-center justify-center font-serif italic font-bold text-xs text-slate-900">
                    Dr. R. K. Sharma
                  </div>
                  <div className="border-t border-slate-800 pt-1 font-bold text-[11px] text-slate-950">
                    प्रधानाचार्य हस्ताक्षर एवं मुहर
                  </div>
                  <div className="text-[9px] text-slate-500">(Principal & Stamp)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🖨️ PRINT ISOLATION CONTAINER FOR BROWSER PRINT DIALOGUE */}
      {/* ========================================================================= */}
      <div id="printable-remedial-report" className="hidden print:block">
        <div className="w-full bg-white text-slate-900 p-8 font-serif space-y-6 text-[12px] leading-relaxed">
          <div className="text-center space-y-1 border-b-2 border-slate-900 pb-4 font-sans">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
              DAKSHORA SENIOR SECONDARY SCHOOL, JAIPUR
            </div>
            <h2 className="text-xl font-black text-slate-950 tracking-wide uppercase pt-0.5">
              विद्यार्थी व्यक्तिगत सुधारात्मक कार्ययोजना (REMEDIAL ACTION PLAN)
            </h2>
            <div className="text-xs text-rose-950 font-bold font-mono">
              सत्र 2026-2027 • गोपनीय उपचारात्मक अधिगम रिपोर्ट (CONFIDENTIAL ACADEMIC INTERVENTION)
            </div>

            <div className="grid grid-cols-4 gap-2 text-xs font-bold text-slate-800 pt-3 border-t border-slate-200">
              <div>विद्यार्थी: <b>{selectedStudent.name}</b></div>
              <div>कक्षा: <b>{selectedStudent.rollNo} ({selectedStudent.grade})</b></div>
              <div>कमजोर विषय: <b>{selectedStudent.subject}</b></div>
              <div>प्राप्तांक: <b>{selectedStudent.scoredMarks}/{selectedStudent.totalMarks} ({selectedStudent.percentage}%)</b></div>
            </div>
          </div>

          <div className="space-y-3 font-sans text-xs">
            <div className="bg-slate-100 p-2 font-bold uppercase border-l-4 border-slate-900">
              1. अधिगम अंतराल एवं कमजोर विषय-वस्तु (IDENTIFIED LEARNING GAPS)
            </div>
            <div className="border p-3 space-y-1">
              <div><b>कठिनाई वाले टॉपिक्स:</b> {selectedStudent.weakTopics.join(', ')}</div>
              <div><b>मूलभूत कारण:</b> {selectedStudent.rootCause}</div>
            </div>
          </div>

          <div className="space-y-3 font-sans text-xs">
            <div className="bg-slate-100 p-2 font-bold uppercase border-l-4 border-slate-900">
              2. उपचारात्मक शिक्षण रणनीति एवं समय-सारणी (INTERVENTION STRATEGY)
            </div>
            <div className="border p-3 space-y-1">
              <div><b>मार्गदर्शक शिक्षक:</b> {selectedStudent.remedialTeacher} ({selectedStudent.remedialSchedule})</div>
              <div><b>सुधारात्मक विधि:</b> {selectedStudent.recommendedIntervention}</div>
            </div>
          </div>

          <div className="space-y-3 font-sans text-xs">
            <div className="bg-slate-100 p-2 font-bold uppercase border-l-4 border-slate-900">
              3. अभिभावक सहयोगात्मक परामर्श (PARENT COLLABORATIVE ADVISORY)
            </div>
            <div className="border p-3 space-y-1">
              <div><b>अभिभावक:</b> श्री {selectedStudent.parentName} (फोन: {selectedStudent.parentPhone})</div>
              <div><b>परामर्श:</b> {selectedStudent.parentAdvisory}</div>
            </div>
          </div>

          <div className="space-y-3 font-sans text-xs">
            <div className="bg-slate-100 p-2 font-bold uppercase border-l-4 border-slate-900">
              4. पुनः मूल्यांकन एवं लक्ष्य (RE-TEST & TARGET MILESTONE)
            </div>
            <div className="border p-3 flex justify-between">
              <div>पुनः परीक्षा तिथि: <b>{selectedStudent.retestDate}</b></div>
              <div>वर्तमान स्कोर: <b>{selectedStudent.scoredMarks}/{selectedStudent.totalMarks} ({selectedStudent.percentage}%)</b></div>
              <div>अपेक्षित लक्ष्य: <b>{selectedStudent.targetMarks}/{selectedStudent.totalMarks} (60%+)</b></div>
            </div>
          </div>

          <div className="pt-8 border-t-2 border-slate-900 font-sans">
            <div className="grid grid-cols-3 gap-4 text-center text-xs">
              <div>
                <div className="h-8">{selectedStudent.remedialTeacher}</div>
                <div className="border-t pt-1 font-bold">विषय अध्यापक हस्ताक्षर</div>
              </div>
              <div>
                <div className="h-8">Sunita Rao</div>
                <div className="border-t pt-1 font-bold">कक्षाध्यापक हस्ताक्षर</div>
              </div>
              <div>
                <div className="h-8">Dr. R. K. Sharma</div>
                <div className="border-t pt-1 font-bold">प्रधानाचार्य हस्ताक्षर एवं मुहर</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
