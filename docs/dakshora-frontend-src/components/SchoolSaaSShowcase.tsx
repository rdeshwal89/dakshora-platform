import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Sparkles,
  School,
  BookOpen,
  Users,
  CheckCircle2,
  ArrowRight,
  Send,
  Building2,
  Calendar,
  Award,
  ShieldCheck,
  Zap,
  Phone,
  Mail,
  MapPin,
  Bot,
  Play,
  FileText,
  CreditCard,
  Plus,
  RefreshCw,
  Baby,
  BookMarked,
  Languages,
  Atom,
  Flame,
  Layout,
  Bell,
  Check,
  Search,
  UserCheck,
  TrendingUp,
  Cpu,
  Monitor,
  Trophy,
  Quote,
  Eye,
  Lock,
  Key,
  Copy,
  Compass,
  Bus,
  CheckSquare,
  XSquare,
  Library,
  FolderLock,
  ChevronRight,
  Activity
} from 'lucide-react';
import {
  captureLead,
  sendDakshoraAiChat,
  createWebsite,
  fetchSchoolStudents,
  enrollStudent,
  fetchSchoolNotices,
  broadcastSchoolNotice,
  createClientUser
} from '../services/api';

interface SchoolSaaSShowcaseProps {
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  onNavigateTab: (tab: string) => void;
}

// 7 Specialized Attractive School Templates
const SCHOOL_TEMPLATES = [
  {
    id: 'tpl-smart-campus',
    name: 'DAKSHORA International AI & STEM Super-Campus',
    category: 'Ultra-Modern AI & International School',
    tagline: 'Next-Gen K-12 with AI Labs, Robotics & Global Curriculum',
    badge: 'AI Smart Super-Campus',
    color: 'from-cyan-500 to-blue-600',
    accentColor: 'cyan',
    icon: Sparkles,
    heroTitle: 'Empowering Future Innovators with AI, Robotics & Global Standards',
    heroSubtitle: 'Next-generation smart campus with experiential learning, drone innovation labs, Olympiad training, Olympic sports arena, and 24/7 DAKSHORA AI Copilot.',
    stats: [
      { label: 'AI Classrooms', value: '100% Digital' },
      { label: 'Robotics Labs', value: '5 Modern Labs' },
      { label: 'Board Result', value: '100% Dist.' }
    ],
    curriculumTag: '🚀 AI-First CBSE & International K-12 Curriculum',
    admissionsHeadline: 'Super-Campus Admissions Open 2026-27',
    grades: ['Pre-Primary & Kindergarten', 'Class 1 to 5 (Primary)', 'Class 6 to 10 (CBSE Secondary)', 'Class 11 & 12 (Science/PCM/PCB)', 'Class 11 & 12 (Commerce & Arts)'],
    aiPromptPreset: 'Generate a 45-minute lesson plan for teaching Python Programming and Robotics basics to Class 8 students'
  },
  {
    id: 'tpl-cbse-secondary',
    name: 'Delhi Public Heritage High School (CBSE)',
    category: 'CBSE Secondary (Class 6-10)',
    tagline: 'Excellence in Board Academics, Smart Labs & Sports',
    badge: 'CBSE 10+2 Affiliated',
    color: 'from-blue-600 to-indigo-600',
    accentColor: 'blue',
    icon: School,
    heroTitle: 'Nurturing Leaders with Experiential CBSE Curriculum & Science Labs',
    heroSubtitle: 'Ranked #1 district smart campus with 100% board distinction, AI classrooms, Olympic-size sports arena, and national Olympiad mentoring.',
    stats: [
      { label: 'Board 90%+ Dist.', value: '62%' },
      { label: 'Teacher Ratio', value: '1:18' },
      { label: 'Smart Labs', value: '50+ Labs' }
    ],
    curriculumTag: '🏫 Central Board of Secondary Education (CBSE)',
    admissionsHeadline: 'CBSE Secondary Admissions Open 2026-27',
    grades: ['Class 6th', 'Class 7th', 'Class 8th', 'Class 9th (CBSE)', 'Class 10th (CBSE Board)'],
    aiPromptPreset: 'Lesson plan for Class 10 Physics: Light Reflection & Refraction (45 mins CBSE NCERT)'
  },
  {
    id: 'tpl-senior-secondary',
    name: 'Apex Senior Secondary 10+2 & Coaching Integrated Campus',
    category: 'Senior Secondary & Competitive Prep',
    tagline: 'Science, Commerce, Arts with Integrated JEE/NEET/CUET Prep',
    badge: '10+2 & JEE/NEET Prep',
    color: 'from-purple-600 to-violet-700',
    accentColor: 'purple',
    icon: Atom,
    heroTitle: 'Top Board Scores + Guaranteed Competitive Exam Rank Foundation',
    heroSubtitle: 'Integrated schooling with Kota/Delhi expert faculty for IIT-JEE, NEET, CA-Foundation & CUET with AC hostels and daily mock test series.',
    stats: [
      { label: 'NEET/JEE Selections', value: '140+' },
      { label: 'Daily Mock Tests', value: 'Online CBT' },
      { label: 'Hostel Facility', value: 'AC Rooms' }
    ],
    curriculumTag: '🎓 10+2 Science (PCM/PCB), Commerce & Arts',
    admissionsHeadline: 'Class 11th & 12th Integrated Batch 2026-27 Open',
    grades: ['Class 11 Science (IIT-JEE)', 'Class 11 Science (NEET)', 'Class 11 Commerce (CA-Foundation)', 'Class 12 Board + Target JEE/NEET'],
    aiPromptPreset: 'Generate 5 challenging JEE Main level multiple choice questions for Class 11 Rotational Dynamics with step-by-step solutions'
  },
  {
    id: 'tpl-rbse-hindi',
    name: 'सरस्वती विद्या मंदिर उच्च माध्यमिक विद्यालय (RBSE)',
    category: 'State Board / RBSE हिंदी माध्यम',
    tagline: 'संस्कारयुक्त आधुनिक शिक्षा • न्यूनतम शुल्क में सर्वश्रेष्ठ परीक्षा परिणाम',
    badge: 'RBSE हिंदी माध्यम (1 से 12)',
    color: 'from-amber-500 to-orange-600',
    accentColor: 'amber',
    icon: Languages,
    heroTitle: 'भारतीय संस्कृति और उच्चकोटि की हिंदी माध्यम शिक्षा का संगम',
    heroSubtitle: 'कक्षा 1 से 12वीं (विज्ञान, कला, वाणिज्य) तक राजस्थान बोर्ड के अनुभवी व्याख्याताओं द्वारा अध्यापन, आधुनिक कंप्यूटर लैब और छात्रवृत्ति सुविधा।',
    stats: [
      { label: 'बोर्ड परिणाम', value: '100% सफल' },
      { label: 'मेरिट छात्र', value: '45+ Top' },
      { label: 'छात्रवृत्ति', value: 'उपलब्ध' }
    ],
    curriculumTag: '📖 माध्यमिक शिक्षा बोर्ड राजस्थान (RBSE)',
    admissionsHeadline: 'प्रवेश प्रारंभ सत्र 2026-27 (सीमित सीटें)',
    grades: ['प्राथमिक (1 से 5)', 'उच्च प्राथमिक (6 से 8)', 'माध्यमिक (9 व 10)', '11वीं व 12वीं विज्ञान', '11वीं व 12वीं कला/वाणिज्य'],
    aiPromptPreset: 'कक्षा 10वीं हिंदी (RBSE) के लिए पाठ "सूरदास के पद" का 45 मिनट का शिक्षण योजना (Lesson Plan) तैयार करें'
  },
  {
    id: 'tpl-play-school',
    name: 'Little Angels Play School & Daycare',
    category: 'Play School & Kindergarten',
    tagline: 'Where Play Meets Foundational Joy & Safety',
    badge: 'Play School (Nursery/KG)',
    color: 'from-pink-500 to-rose-600',
    accentColor: 'rose',
    icon: Baby,
    heroTitle: 'Joyful Early Learning & Safe Daycare for Your Little Stars',
    heroSubtitle: 'Nurturing curiosity from age 1.5 to 5.5 with sensory play, nutritious meal plans, montessori toys, and live CCTV parent access.',
    stats: [
      { label: 'Child Ratio', value: '1:6' },
      { label: 'Safety Rating', value: '100% CCTV' },
      { label: 'Nutritious Meals', value: 'Daily Fresh' }
    ],
    curriculumTag: '🧸 Sensory Play, Phonics & Motor Skills',
    admissionsHeadline: 'Playgroup & Daycare Admissions Open 2026-27',
    grades: ['Pre-Nursery (1.5 - 2.5 yrs)', 'Nursery (2.5 - 3.5 yrs)', 'KG-1 / LKG', 'KG-2 / UKG', 'Full-Day Daycare'],
    aiPromptPreset: 'Design a fun 30-minute sensory play & color recognition activity for Nursery toddlers'
  },
  {
    id: 'tpl-primary-school',
    name: 'Navodaya Primary & Elementary Academy',
    category: 'Primary School (Class 1-5)',
    tagline: 'Foundational Literacy, Numeracy & Character Building',
    badge: 'Primary (Class 1 to 5)',
    color: 'from-emerald-500 to-teal-600',
    accentColor: 'emerald',
    icon: BookMarked,
    heroTitle: 'Strong Foundations for Lifelong Academic Excellence',
    heroSubtitle: 'Empowering children with joyful mathematics, English phonics, moral science, creative arts, and activity-based learning.',
    stats: [
      { label: 'Math Literacy', value: '98%' },
      { label: 'Class Strength', value: 'Max 25' },
      { label: 'Activity Clubs', value: '12+ Clubs' }
    ],
    curriculumTag: '🎒 NEP 2020 Foundational & Preparatory Stage',
    admissionsHeadline: 'Primary School Admissions 2026-27 (Class 1st to 5th)',
    grades: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'],
    aiPromptPreset: 'Create an interactive storytelling lesson plan for Class 3 English with 3 moral questions'
  },
  {
    id: 'tpl-coaching-institute',
    name: 'Gurukul Career & Foundation Coaching Academy',
    category: 'Coaching & Test Prep Academy',
    tagline: 'Target IIT-JEE, NEET, Olympiads & Board Foundation',
    badge: 'Coaching & Test Prep',
    color: 'from-rose-500 to-pink-600',
    accentColor: 'rose',
    icon: Flame,
    heroTitle: 'Crack Top Engineering & Medical Colleges with Gurukul Mentors',
    heroSubtitle: 'Proven test series, daily doubt clearing counters, printed module material, and up to 100% scholarship via Gurukul SAT entrance exam.',
    stats: [
      { label: 'Top Rank (AIR)', value: 'AIR 42' },
      { label: 'Scholarship Pool', value: '₹50 Lakhs' },
      { label: 'Doubt Faculty', value: '1-on-1' }
    ],
    curriculumTag: '🎯 Target IIT-JEE / NEET / Olympiads / NTSE',
    admissionsHeadline: 'Scholarship Admission Test (SAT) 2026 Registration Open',
    grades: ['Class 8-10 Foundation Batch', 'Class 11 Target JEE (Main+Adv)', 'Class 11 Target NEET', 'Class 12 Pass / Dropper Batch'],
    aiPromptPreset: 'Create a 30-day revision timetable for NEET Biology covering Genetics and Human Physiology'
  }
];

// High-Resolution Curated Educational Campus Facilities
const CAMPUS_FACILITIES = [
  {
    title: 'AI & Robotics Innovation Lab',
    category: 'STEM & Robotics',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    desc: 'Arduino, Raspberry Pi, 3D printing, and AI drone development stations for hands-on innovation.'
  },
  {
    title: 'Next-Gen Computer Science & Coding Lab',
    category: 'Computer Science',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
    desc: 'Equipped with dual-monitor high-speed workstations, Python, Cloud computing & Cyber security curriculum.'
  },
  {
    title: 'Digital Smart Library & Knowledge Hub',
    category: 'Library & Reading',
    image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&auto=format&fit=crop&q=80',
    desc: '15,000+ reference books, national journals, Kindle e-readers, and quiet study cubicles.'
  },
  {
    title: 'Olympic Sports Arena & Synthetic Turf',
    category: 'Sports & Fitness',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
    desc: 'FIFA-standard football turf, indoor badminton courts, swimming pool, and athletic track.'
  },
  {
    title: 'Advanced Chemistry & Physics Labs',
    category: 'Science Labs',
    image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80',
    desc: 'Fully compliant CBSE/ICSE practical test stations with digital sensors and highest safety standards.'
  },
  {
    title: 'Experiential Smart Classrooms with Digital Panels',
    category: 'Smart Campus',
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=80',
    desc: 'Interactive 4K touch displays, 3D concept visualizations, and acoustic-treated comfortable seating.'
  }
];

// Interactive Daily Thoughts Pool
const DAILY_THOUGHTS = [
  { thought: 'Education is the most powerful weapon which you can use to change the world.', author: 'Nelson Mandela' },
  { thought: 'विद्या ददाति विनयं, विनयाद् याति पात्रताम्। (Knowledge bestows humility, from humility comes worthiness.)', author: 'Hitopadesha' },
  { thought: 'The beautiful thing about learning is that no one can take it away from you.', author: 'B.B. King' },
  { thought: 'Arise, awake, and stop not till the goal is reached.', author: 'Swami Vivekananda' }
];

export const SchoolSaaSShowcase: React.FC<SchoolSaaSShowcaseProps> = ({
  onShowToast,
  onNavigateTab,
}) => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'preview' | 'role_portals' | 'handover' | 'pricing'>('preview');

  // Selected Template
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number>(0);
  const currentTemplate = SCHOOL_TEMPLATES[selectedTemplateIndex];

  // Daily Thought Index
  const [thoughtIndex, setThoughtIndex] = useState(0);

  // Role Portal Simulation State ('principal' | 'teacher' | 'parent' | 'student')
  const [simulatedRole, setSimulatedRole] = useState<'principal' | 'teacher' | 'parent' | 'student'>('principal');

  // Attendance Simulation State
  const [attendanceList, setAttendanceList] = useState([
    { id: '1', name: 'Aarav Sharma', roll: '101', present: true },
    { id: '2', name: 'Ananya Verma', roll: '102', present: true },
    { id: '3', name: 'Rohan Patel', roll: '103', present: false },
    { id: '4', name: 'Isha Mehra', roll: '104', present: true },
    { id: '5', name: 'Diya Sengupta', roll: '105', present: true }
  ]);

  // Admission Form State
  const [studentName, setStudentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [gradeApplying, setGradeApplying] = useState(currentTemplate.grades[0]);
  const [isSubmittingAdmission, setIsSubmittingAdmission] = useState(false);
  const [admissionSuccess, setAdmissionSuccess] = useState(false);

  // AI Tool State
  const [aiPrompt, setAiPrompt] = useState(currentTemplate.aiPromptPreset);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Client Purchase & Security Handover Generator State
  const [clientSchoolName, setClientSchoolName] = useState('Delhi Public Heritage Super-Campus');
  const [clientPrincipalName, setClientPrincipalName] = useState('Dr. Rajesh Sharma');
  const [clientEmail, setClientEmail] = useState('principal@dpsheritage.in');
  const [clientPassword, setClientPassword] = useState('Heritage@2026!');
  const [isGeneratingHandover, setIsGeneratingHandover] = useState(false);
  const [handoverKit, setHandoverKit] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    setGradeApplying(currentTemplate.grades[0]);
    setAiPrompt(currentTemplate.aiPromptPreset);
    setAiResult('');
    setAdmissionSuccess(false);
  }, [selectedTemplateIndex]);

  // Toggle Attendance
  const toggleAttendance = (id: string) => {
    setAttendanceList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, present: !item.present } : item))
    );
    onShowToast('info', 'Attendance Updated', 'Live sync to Parent Portal & SIS');
  };

  // Admission Submit
  const handleAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !parentEmail.trim()) return;

    setIsSubmittingAdmission(true);
    try {
      const res = await captureLead({
        name: `${studentName.trim()} (Parent: ${parentEmail})`,
        email: parentEmail.trim(),
        phone: parentPhone.trim() || '+91 98765 00000',
        source: 'website',
        notes: `Inquiry from [${currentTemplate.name}] for: ${gradeApplying}`,
      });

      if (res.data.success) {
        setAdmissionSuccess(true);
        onShowToast('success', 'Admission Lead Captured in CRM! 🎯', `Grade: ${gradeApplying}`);
      }
    } catch {
      onShowToast('error', 'Submission Failed', 'Please try again');
    } finally {
      setIsSubmittingAdmission(false);
    }
  };

  // Run AI Tool
  const handleRunAiTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setAiLoading(true);
    try {
      const res = await sendDakshoraAiChat({
        message: aiPrompt.trim(),
        persona: simulatedRole === 'student' ? 'students' : 'teachers',
      });

      if (res.data.success && res.data.message) {
        setAiResult(res.data.message);
      }
    } catch {
      onShowToast('error', 'AI Unavailable', 'Could not run assistant');
    } finally {
      setAiLoading(false);
    }
  };

  // Generate Handover & Security Kit
  const handleGenerateHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientEmail.trim() || !clientPassword.trim()) return;

    setIsGeneratingHandover(true);
    try {
      const res = await createClientUser({
        name: clientPrincipalName.trim(),
        email: clientEmail.trim(),
        password: clientPassword.trim(),
        role: 'school-admin',
        organization_name: clientSchoolName.trim()
      });

      if (res.data.success) {
        const kit = {
          schoolName: clientSchoolName.trim(),
          principalName: clientPrincipalName.trim(),
          domain: `${clientSchoolName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.dakshora.app`,
          principalLogin: {
            url: 'http://localhost:5173 (Customer Portal)',
            userId: clientEmail.trim(),
            password: clientPassword.trim(),
            role: 'School Principal (Full Master Access)'
          },
          teacherPortal: {
            url: 'http://localhost:5173/teacher-login',
            code: 'TCH-2026-HERITAGE',
            permissions: 'Attendance Marking, CBSE Lesson Planner, Marks Entry'
          },
          parentApp: {
            url: 'http://localhost:5173/parent-app',
            code: 'PAR-2026-HERITAGE',
            features: 'Live Attendance Alerts, Online Fee Pay, Bus GPS Tracker'
          },
          securitySpecs: {
            ssl: 'Active TLS 1.3 256-bit Encrypted',
            databaseIsolation: 'Supabase PostgreSQL Multi-Tenant RLS Enabled',
            backupFrequency: 'Daily Automated Cloud Backups'
          }
        };

        setHandoverKit(kit);
        onShowToast('success', 'Security & Access Kit Generated! 🔐', `Ready for handover to ${clientPrincipalName}`);
      } else {
        onShowToast('error', 'Generation Error', res.data.message);
      }
    } catch (err: any) {
      onShowToast('error', 'Network Error', err.message);
    } finally {
      setIsGeneratingHandover(false);
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onShowToast('info', 'Copied to Clipboard', text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 🌟 TOP HERO BANNER */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl p-6 sm:p-10 bg-gradient-to-r from-blue-950 via-[#0a1b38] to-slate-900 border border-blue-500/30 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-mono">
            <School className="w-4 h-4 text-cyan-400" />
            <span>Ultra-Premium School SaaS & Smart Campus Multi-Role Operating System</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Ultra-Premium Live School Portals,{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400">
              High-Tech Labs & Multi-Role Access
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-mono">
            Give your client an elite digital presence with high-res STEM/Robotics labs, Principal Vision, Daily Thoughts, and 4 dedicated role workspaces: Principal Dashboard, Teacher Workspace, Parent App, and Student Corner.
          </p>

          {/* Navigation Bar */}
          <div className="flex flex-wrap items-center gap-2.5 pt-4">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs font-mono transition-all flex items-center gap-2 ${
                activeTab === 'preview'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Layout className="w-4 h-4" />
              <span>1. Ultra-Premium School Website</span>
            </button>

            <button
              onClick={() => setActiveTab('role_portals')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs font-mono transition-all flex items-center gap-2 ${
                activeTab === 'role_portals'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>2. Multi-Role Portals (Principal • Teacher • Parent • Student)</span>
            </button>

            <button
              onClick={() => setActiveTab('handover')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs font-mono transition-all flex items-center gap-2 ${
                activeTab === 'handover'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20 ring-1 ring-purple-400'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>3. Client Purchase & Security Handover</span>
            </button>

            <button
              onClick={() => setActiveTab('pricing')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs font-mono transition-all flex items-center gap-2 ${
                activeTab === 'pricing'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-lg shadow-amber-500/20 ring-1 ring-amber-400'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>4. Subscription Packages</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 🌟 TAB 1: ULTRA-PREMIUM LIVE SCHOOL WEBSITE SHOWCASE */}
      {/* ========================================================================= */}
      {activeTab === 'preview' && (
        <div className="space-y-12 animate-in fade-in duration-200">
          {/* Daily Thought & Principal Vision Ticker */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2.5">
              <Quote className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-amber-400 font-bold">आज का सुविचार (Thought of the Day): </span>
                <span className="text-white italic">"{DAILY_THOUGHTS[thoughtIndex].thought}"</span>
                <span className="text-slate-400 text-[11px]"> — {DAILY_THOUGHTS[thoughtIndex].author}</span>
              </div>
            </div>

            <button
              onClick={() => setThoughtIndex((prev) => (prev + 1) % DAILY_THOUGHTS.length)}
              className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[11px] self-end sm:self-center font-bold"
            >
              Next Thought ↻
            </button>
          </div>

          {/* Template Switcher Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-xs text-slate-400 font-mono shrink-0">Switch Campus Style:</span>
            {SCHOOL_TEMPLATES.map((tpl, i) => (
              <button
                key={tpl.id}
                onClick={() => setSelectedTemplateIndex(i)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
                  selectedTemplateIndex === i
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {tpl.badge}
              </button>
            ))}
          </div>

          {/* ========================================================================= */}
          {/* 🖥️ MOCK BROWSER: ULTRA-PREMIUM LIVE SCHOOL WEBSITE */}
          {/* ========================================================================= */}
          <div className="rounded-3xl border border-slate-700 bg-slate-950 shadow-2xl overflow-hidden">
            {/* Top Navigation Bar */}
            <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              </div>
              <div className="px-4 py-1 rounded-lg bg-slate-950 text-slate-300 text-xs font-mono border border-slate-800 flex items-center gap-2">
                <span className="text-emerald-400">🔒 https://</span>
                <span className="text-cyan-300 font-bold">{currentTemplate.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.dakshora.app</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-500/30">
                SSL 256-BIT SECURED
              </span>
            </div>

            <div className="p-6 sm:p-10 space-y-16 bg-gradient-to-b from-[#09152C] via-[#0B0F19] to-slate-950 text-white">
              {/* School Brand Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${currentTemplate.color} flex items-center justify-center font-bold text-white shadow-xl`}>
                    <GraduationCap className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-lg sm:text-xl text-white tracking-wide">{currentTemplate.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        CBSE 10+2
                      </span>
                    </div>
                    <p className="text-xs text-cyan-300 font-mono">{currentTemplate.curriculumTag}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="hidden md:inline text-slate-300 hover:text-white cursor-pointer">About Campus</span>
                  <span className="hidden md:inline text-slate-300 hover:text-white cursor-pointer">Labs & Facilities</span>
                  <span className="hidden md:inline text-slate-300 hover:text-white cursor-pointer">Academics</span>
                  <a
                    href="#live-admissions-form"
                    className={`px-4 py-2 rounded-xl bg-gradient-to-r ${currentTemplate.color} text-white font-bold transition-all shadow-lg hover:brightness-110`}
                  >
                    Admissions 2026-27 Open
                  </a>
                </div>
              </div>

              {/* Hero Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-5">
                  <span className="px-3.5 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold">
                    🌟 {currentTemplate.tagline}
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-extrabold leading-tight text-white">
                    {currentTemplate.heroTitle}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 font-mono leading-relaxed">
                    {currentTemplate.heroSubtitle}
                  </p>

                  <div className="grid grid-cols-3 gap-3 pt-2">
                    {currentTemplate.stats.map((st, i) => (
                      <div key={i} className="p-3.5 bg-white/5 rounded-2xl border border-white/10 text-center">
                        <div className="text-xl sm:text-2xl font-bold text-cyan-400 font-mono">{st.value}</div>
                        <div className="text-[10px] sm:text-xs text-slate-400 font-mono">{st.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Admission Form */}
                <div id="live-admissions-form" className="lg:col-span-5 bg-slate-900/90 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h4 className="font-bold text-xs font-mono text-cyan-300 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>{currentTemplate.admissionsHeadline}</span>
                    </h4>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">Live CRM Sync</span>
                  </div>

                  {admissionSuccess ? (
                    <div className="p-5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-center space-y-2">
                      <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
                      <div className="font-bold text-sm text-white">Application Recorded Successfully!</div>
                      <p className="text-xs text-slate-300 font-mono">
                        Lead captured in CRM. School counselor will contact parent within 24 hours.
                      </p>
                      <button
                        onClick={() => setAdmissionSuccess(false)}
                        className="text-xs text-emerald-400 underline font-mono pt-2"
                      >
                        Fill another admission inquiry
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleAdmissionSubmit} className="space-y-3 text-xs font-mono">
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">Student Full Name *</label>
                        <input
                          type="text"
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          placeholder="e.g. Advait Sharma"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">Parent Email *</label>
                        <input
                          type="email"
                          value={parentEmail}
                          onChange={(e) => setParentEmail(e.target.value)}
                          placeholder="parent@example.com"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">Parent Phone</label>
                          <input
                            type="text"
                            value={parentPhone}
                            onChange={(e) => setParentPhone(e.target.value)}
                            placeholder="+91 98000 00000"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">Applying Grade</label>
                          <select
                            value={gradeApplying}
                            onChange={(e) => setGradeApplying(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                          >
                            {currentTemplate.grades.map((g, i) => (
                              <option key={i} value={g}>{g}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingAdmission}
                        className={`w-full py-2.5 px-4 rounded-xl bg-gradient-to-r ${currentTemplate.color} text-white font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-1.5`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSubmittingAdmission ? 'Recording...' : 'Submit Online Admission Form'}</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 📸 HIGH-DEFINITION CAMPUS LABS & INFRASTRUCTURE GALLERY */}
              {/* ========================================================================= */}
              <div className="space-y-6 pt-6 border-t border-white/10">
                <div className="text-center space-y-1.5">
                  <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-bold">World-Class Infrastructure</span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white">Smart Labs, Digital Library & Sports Complex</h3>
                  <p className="text-xs text-slate-400 font-mono max-w-xl mx-auto">
                    Designed to inspire scientific curiosity, athletics excellence, and holistic leadership.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {CAMPUS_FACILITIES.map((fac, idx) => (
                    <div
                      key={idx}
                      className="group overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 transition-all shadow-xl flex flex-col justify-between"
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={fac.image}
                          alt={fac.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/80 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold">
                          {fac.category}
                        </span>
                      </div>

                      <div className="p-5 space-y-2">
                        <h4 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">{fac.title}</h4>
                        <p className="text-xs text-slate-400 font-mono leading-relaxed">{fac.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 💡 PRINCIPAL'S DESK & VISION */}
              {/* ========================================================================= */}
              <div className="p-8 rounded-3xl bg-gradient-to-r from-blue-950/50 via-slate-900 to-indigo-950/40 border border-blue-500/30 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-4 text-center space-y-3">
                  <div className="w-24 h-24 rounded-full mx-auto overflow-hidden border-2 border-cyan-400 shadow-xl">
                    <img
                      src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80"
                      alt="Principal"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Dr. Rajesh Sharma</h4>
                    <p className="text-[11px] text-cyan-300 font-mono">Principal & Academic Director</p>
                    <p className="text-[10px] text-slate-400 font-mono">Ph.D. in Education (22+ Years Exp.)</p>
                  </div>
                </div>

                <div className="md:col-span-8 space-y-3 font-mono text-xs text-slate-300">
                  <div className="text-amber-300 font-bold flex items-center gap-1.5">
                    <Compass className="w-4 h-4" />
                    <span>Principal's Vision for Academic Excellence</span>
                  </div>
                  <p className="leading-relaxed text-slate-200 italic">
                    "Our mission is to empower each student not merely to pass examinations, but to think critically, innovate with AI & scientific tools, and uphold timeless Indian values of humility and service."
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2 text-[11px] text-cyan-400">
                    <span>✓ 100% CBSE Pass Record</span>
                    <span>•</span>
                    <span>✓ 1:18 Teacher-Student Ratio</span>
                    <span>•</span>
                    <span>✓ 24/7 AI Smart Learning</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 👥 TAB 2: MULTI-ROLE PORTALS (PRINCIPAL • TEACHER • PARENT • STUDENT) */}
      {/* ========================================================================= */}
      {activeTab === 'role_portals' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <span>Multi-Role School Management Workspaces</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Click a role below to simulate what each user experiences in the live SaaS portal.
              </p>
            </div>

            {/* Role Buttons */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button
                onClick={() => setSimulatedRole('principal')}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                  simulatedRole === 'principal' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                👑 Principal Dashboard
              </button>
              <button
                onClick={() => setSimulatedRole('teacher')}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                  simulatedRole === 'teacher' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                👩‍🏫 Teacher Workspace
              </button>
              <button
                onClick={() => setSimulatedRole('parent')}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                  simulatedRole === 'parent' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                👨‍👩‍👧 Parent Access
              </button>
              <button
                onClick={() => setSimulatedRole('student')}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                  simulatedRole === 'student' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                🎓 Student Corner
              </button>
            </div>
          </div>

          {/* Role 1: Principal Dashboard */}
          {simulatedRole === 'principal' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono">
                <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 space-y-1">
                  <div className="text-xs text-amber-400">Total Enrolled Students</div>
                  <div className="text-2xl font-bold text-white">1,480</div>
                  <div className="text-[10px] text-emerald-400">↑ 18% from last year</div>
                </div>
                <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 space-y-1">
                  <div className="text-xs text-emerald-400">Today's Overall Attendance</div>
                  <div className="text-2xl font-bold text-white">96.4%</div>
                  <div className="text-[10px] text-slate-400">1,427 / 1,480 Present</div>
                </div>
                <div className="glass-panel p-5 rounded-2xl border border-blue-500/30 space-y-1">
                  <div className="text-xs text-blue-400">Term Fee Collection</div>
                  <div className="text-2xl font-bold text-white">₹18.4 Lakhs</div>
                  <div className="text-[10px] text-slate-400">89% collected on time</div>
                </div>
                <div className="glass-panel p-5 rounded-2xl border border-purple-500/30 space-y-1">
                  <div className="text-xs text-purple-400">Admissions Pipeline</div>
                  <div className="text-2xl font-bold text-white">142 Inquiries</div>
                  <div className="text-[10px] text-purple-300">48 interviews scheduled</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="font-bold text-sm text-white font-mono flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-400" />
                    <span>Real-Time School Campus Overview</span>
                  </h3>
                  <div className="space-y-3 text-xs font-mono">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                      <div>
                        <div className="text-white font-bold">Class 10 CBSE Board Pre-Test #2</div>
                        <div className="text-slate-400 text-[11px]">Average Score: 84.5% | Science Lab Practicals Complete</div>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded text-[10px]">ON TRACK</span>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                      <div>
                        <div className="text-white font-bold">AI & Robotics Inter-School Exhibition</div>
                        <div className="text-slate-400 text-[11px]">8 projects shortlisted for state finals</div>
                      </div>
                      <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 rounded text-[10px]">UPCOMING</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="font-bold text-sm text-white font-mono flex items-center gap-2">
                    <Quote className="w-4 h-4 text-amber-400" />
                    <span>Update Daily Thought (सुविचार)</span>
                  </h3>
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-2 text-slate-300">
                    <div className="text-amber-300 font-bold">Current Live Broadcast:</div>
                    <p className="italic">"{DAILY_THOUGHTS[thoughtIndex].thought}"</p>
                    <div className="text-slate-500 text-[11px]">— {DAILY_THOUGHTS[thoughtIndex].author}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Role 2: Teacher Workspace */}
          {simulatedRole === 'teacher' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Online Attendance Marker */}
                <div className="lg:col-span-6 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-white font-mono flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                      <span>Class 10-A Daily Online Attendance</span>
                    </h3>
                    <span className="text-[10px] text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded font-mono">Live SMS Alert Sync</span>
                  </div>

                  <div className="space-y-2.5 text-xs font-mono">
                    {attendanceList.map((std) => (
                      <div
                        key={std.id}
                        onClick={() => toggleAttendance(std.id)}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                          std.present
                            ? 'bg-emerald-950/30 border-emerald-500/40 hover:bg-emerald-950/50'
                            : 'bg-rose-950/30 border-rose-500/40 hover:bg-rose-950/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400">Roll #{std.roll}</span>
                          <span className="text-white font-bold">{std.name}</span>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                            std.present ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                          }`}
                        >
                          {std.present ? '✓ PRESENT' : '✗ ABSENT'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono text-center">
                    💡 Click on any student above to toggle attendance. Absent students' parents receive instant SMS alert.
                  </p>
                </div>

                {/* AI CBSE Lesson Planner */}
                <div className="lg:col-span-6 glass-panel p-6 rounded-2xl border border-indigo-500/40 bg-indigo-950/10 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm font-mono">
                    <Bot className="w-4 h-4" />
                    <span>AI Teacher Copilot (CBSE / ICSE Lesson Planner)</span>
                  </div>

                  <form onSubmit={handleRunAiTool} className="space-y-3">
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Enter subject topic or exam quiz..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-400"
                    />
                    <button
                      type="submit"
                      disabled={aiLoading}
                      className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono flex items-center justify-center gap-2"
                    >
                      {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      <span>Generate 45-Min Structured Lesson Plan</span>
                    </button>
                  </form>

                  {aiResult && (
                    <div className="p-4 bg-slate-950/90 rounded-xl border border-indigo-500/30 text-xs font-mono text-indigo-200 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                      {aiResult}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Role 3: Parent Access */}
          {simulatedRole === 'parent' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 via-slate-900 to-slate-900 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-base">Aarav Sharma (Class 10-A)</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                          Roll #101
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono">Parent: Vikram Sharma | +91 98765 43210</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                      Term Fee: PAID (Receipt #2026-89)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-slate-400">Monthly Attendance</span>
                    <div className="text-2xl font-bold text-emerald-400">96.0%</div>
                    <p className="text-[10px] text-slate-500">24 / 25 Days Present</p>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-slate-400">Term-1 Academic Grade</span>
                    <div className="text-2xl font-bold text-cyan-400">A+ (92.4%)</div>
                    <p className="text-[10px] text-slate-500">Rank #3 in Class 10-A</p>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-slate-400">Live GPS Bus Tracker</span>
                    <div className="text-sm font-bold text-amber-300 flex items-center gap-1.5 pt-1">
                      <Bus className="w-4 h-4" />
                      <span>Bus Route #4 (On Time)</span>
                    </div>
                    <p className="text-[10px] text-slate-500">ETA to stop: 14 mins</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Role 4: Student Corner */}
          {simulatedRole === 'student' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/20 via-slate-900 to-slate-900 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2.5 text-cyan-300 font-bold text-base font-mono">
                    <Bot className="w-5 h-5" />
                    <span>24/7 DAKSHORA AI Student Doubt Solver</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">CBSE / ICSE / JEE Foundation</span>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 text-xs font-mono">
                    <button
                      onClick={() => setAiPrompt('Explain Pythagorean Theorem with a real-life triangle ladder example')}
                      className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-400 text-slate-300 hover:text-white"
                    >
                      📐 Math: Pythagorean Theorem
                    </button>
                    <button
                      onClick={() => setAiPrompt('What are Newton’s 3 Laws of Motion with simple classroom experiments?')}
                      className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-400 text-slate-300 hover:text-white"
                    >
                      🚀 Physics: Laws of Motion
                    </button>
                    <button
                      onClick={() => setAiPrompt('Explain Photosynthesis light and dark reaction with chemical equation')}
                      className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-400 text-slate-300 hover:text-white"
                    >
                      🌿 Biology: Photosynthesis
                    </button>
                  </div>

                  <form onSubmit={handleRunAiTool} className="flex gap-2">
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Ask any math question, science doubt, or exam formula..."
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="submit"
                      disabled={aiLoading}
                      className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-mono flex items-center gap-1.5"
                    >
                      {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>Solve</span>
                    </button>
                  </form>

                  {aiResult && (
                    <div className="p-5 bg-slate-950/90 rounded-2xl border border-cyan-500/30 text-xs font-mono text-cyan-200 whitespace-pre-wrap leading-relaxed">
                      {aiResult}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔐 TAB 3: CLIENT PURCHASE & SECURITY HANDOVER GENERATOR */}
      {/* ========================================================================= */}
      {activeTab === 'handover' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="border-b border-slate-800 pb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-400" />
              <span>School Client Onboarding & Security Handover</span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Generate isolated tenant credentials, SSL certificates, and role access codes for sold schools.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Generator Form (5 cols) */}
            <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="font-bold text-sm text-white font-mono flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" />
                <span>Issue New School Security Handover Pack</span>
              </h3>

              <form onSubmit={handleGenerateHandover} className="space-y-3.5 text-xs font-mono">
                <div>
                  <label className="block text-slate-300 mb-1">School / Trust Name *</label>
                  <input
                    type="text"
                    value={clientSchoolName}
                    onChange={(e) => setClientSchoolName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Principal / Director Name</label>
                  <input
                    type="text"
                    value={clientPrincipalName}
                    onChange={(e) => setClientPrincipalName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Principal Login Email *</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-cyan-300 focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-300">Set Initial Password *</label>
                    <button
                      type="button"
                      onClick={() => setClientPassword(`Heritage@${Math.floor(1000 + Math.random() * 9000)}!`)}
                      className="text-[10px] text-purple-400 hover:underline"
                    >
                      Auto-Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    value={clientPassword}
                    onChange={(e) => setClientPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-300 focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isGeneratingHandover}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {isGeneratingHandover ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FolderLock className="w-4 h-4" />}
                  <span>Generate Full Handover Pack</span>
                </button>
              </form>
            </div>

            {/* Handover Pack Card (7 cols) */}
            <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-white font-mono flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Security & Multi-Role Credentials Pack</span>
                </h3>

                {handoverKit && (
                  <button
                    onClick={() =>
                      copyText(
                        `🏫 ${handoverKit.schoolName} — Welcome & Security Handover Pack:\n` +
                        `• Portal Domain: https://${handoverKit.domain}\n` +
                        `• Principal Login URL: ${handoverKit.principalLogin.url}\n` +
                        `• Principal User ID: ${handoverKit.principalLogin.userId}\n` +
                        `• Principal Password: ${handoverKit.principalLogin.password}\n\n` +
                        `• Teacher Portal Access: ${handoverKit.teacherPortal.code}\n` +
                        `• Parent App Code: ${handoverKit.parentApp.code}\n` +
                        `• Security: ${handoverKit.securitySpecs.ssl} | PostgreSQL Multi-Tenant RLS`,
                        'FULL_PACK'
                      )
                    }
                    className="text-xs text-emerald-300 hover:underline flex items-center gap-1 font-mono"
                  >
                    {copiedKey === 'FULL_PACK' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy Full Pack</span>
                  </button>
                )}
              </div>

              {handoverKit ? (
                <div className="space-y-4 font-mono text-xs">
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <div className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5" />
                      <span>👑 Principal Master Login:</span>
                    </div>
                    <div className="text-slate-300">User ID: <span className="text-cyan-300 font-bold">{handoverKit.principalLogin.userId}</span></div>
                    <div className="text-slate-300">Password: <span className="text-amber-300 font-bold">{handoverKit.principalLogin.password}</span></div>
                    <div className="text-slate-400 text-[11px]">Role: {handoverKit.principalLogin.role}</div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                      <div className="text-indigo-300 font-bold">👩‍🏫 Teacher Access Code:</div>
                      <div className="text-white font-bold">{handoverKit.teacherPortal.code}</div>
                      <div className="text-slate-400 text-[10px]">Attendance & CBSE Lesson Planner</div>
                    </div>

                    <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                      <div className="text-emerald-300 font-bold">👨‍👩‍👧 Parent App Code:</div>
                      <div className="text-white font-bold">{handoverKit.parentApp.code}</div>
                      <div className="text-slate-400 text-[10px]">Attendance alerts & Online Fees</div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950 rounded-xl border border-emerald-500/30 text-[11px] text-emerald-300 space-y-1">
                    <div className="font-bold">🛡️ Enterprise Security Specs:</div>
                    <div className="text-slate-300">• {handoverKit.securitySpecs.ssl}</div>
                    <div className="text-slate-300">• {handoverKit.securitySpecs.databaseIsolation}</div>
                    <div className="text-slate-300">• {handoverKit.securitySpecs.backupFrequency}</div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 font-mono text-xs space-y-2">
                  <Lock className="w-8 h-8 mx-auto text-slate-600" />
                  <p>Fill the form on the left and click "Generate Full Handover Pack" to create credentials.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💳 TAB 4: SAAS MONETIZATION PACKAGES */}
      {/* ========================================================================= */}
      {activeTab === 'pricing' && (
        <section className="space-y-6 animate-in fade-in duration-200">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-bold">Monetization Ready</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">School SaaS Monthly Pricing Plans</h2>
            <p className="text-xs text-slate-400 font-mono max-w-xl mx-auto">
              Ready-to-bill monthly subscription tiers for private schools, play schools, and academies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="font-bold text-sm text-slate-200 font-mono">Silver Digital Campus</span>
                <div className="text-3xl font-extrabold text-white font-mono">₹1,499 <span className="text-xs text-slate-400">/ mo</span></div>
                <p className="text-xs text-slate-400 font-mono">For play schools & primary institutes.</p>
                <ul className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300 font-mono">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 1 School Website Template</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Online Admissions Form</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Digital Noticeboard</li>
                </ul>
              </div>
              <button
                onClick={() => onShowToast('info', 'Sales Pitch Plan', 'Silver Campus selected')}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white font-mono"
              >
                Pitch Silver Tier
              </button>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-cyan-500/50 bg-cyan-950/20 space-y-5 flex flex-col justify-between ring-1 ring-cyan-500/40 shadow-xl shadow-cyan-500/10">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-cyan-300 font-mono">Gold Smart School</span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold font-mono">HOT SELLER</span>
                </div>
                <div className="text-3xl font-extrabold text-white font-mono">₹3,999 <span className="text-xs text-slate-400">/ mo</span></div>
                <p className="text-xs text-slate-400 font-mono">For K-12 High Schools & CBSE Academies.</p>
                <ul className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300 font-mono">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Custom Domain (e.g. dpscampus.in)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> DAKSHORA AI Teacher Copilot</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Student SIS Management Roster</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Multi-Role Access (Principal, Teachers, Parents)</li>
                </ul>
              </div>
              <button
                onClick={() => onShowToast('success', 'Recommended Package! 🏆', 'Gold Smart School is the top recommended plan')}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white text-xs font-bold font-mono shadow-md shadow-cyan-500/20"
              >
                Pitch Gold Smart School
              </button>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="font-bold text-sm text-slate-200 font-mono">Platinum AI Super-Campus</span>
                <div className="text-3xl font-extrabold text-white font-mono">₹8,999 <span className="text-xs text-slate-400">/ mo</span></div>
                <p className="text-xs text-slate-400 font-mono">For large multi-branch school trusts.</p>
                <ul className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300 font-mono">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> Unlimited Branch Websites</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> Full School ERP & Student SIS</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> 24/7 AI Student Doubt Solving</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> White-Label Mobile App Support</li>
                </ul>
              </div>
              <button
                onClick={() => onShowToast('info', 'Enterprise Plan', 'Platinum AI Super-Campus selected')}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white font-mono"
              >
                Pitch Platinum Tier
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
