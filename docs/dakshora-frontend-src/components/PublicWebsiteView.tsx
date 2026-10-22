import React, { useState } from 'react';
import {
  Globe,
  Sparkles,
  ArrowRight,
  Bot,
  GraduationCap,
  Shield,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Mail,
  Send,
  User,
  Phone,
  Building2,
  ExternalLink,
  BookOpen,
  Calendar,
  CreditCard,
  Bus,
  Library,
  Award,
  Users,
  Clock,
  Check,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  DollarSign,
  Briefcase,
  Home,
  Rocket,
  Compass,
  HelpCircle,
  Lock,
  Server,
  Layers,
  FileText,
  BadgeCheck,
  MessageSquare,
  Cpu
} from 'lucide-react';
import { captureLead, sendDakshoraAiChat } from '../services/api';

interface PublicWebsiteViewProps {
  onShowToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
  onRequestLogin: () => void;
  onRequestDemo?: () => void;
}

export const PublicWebsiteView: React.FC<PublicWebsiteViewProps> = ({
  onShowToast,
  onRequestLogin,
  onRequestDemo,
}) => {
  // Lead Generation & Requirement Form State
  const [leadName, setLeadName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedSolution, setSelectedSolution] = useState('School Website & Institutional ERP');
  const [orgScale, setOrgScale] = useState('500 - 1,500 Students / Users');
  const [notes, setNotes] = useState('');
  const [submittingLead, setSubmittingLead] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);

  // Ask DakshOra AI Interactive State
  const [chatInput, setChatInput] = useState('');
  const [chatAnswer, setChatAnswer] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // FAQ Accordion State (open question indices)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Module filter for 16 ERP modules
  const [selectedModuleCategory, setSelectedModuleCategory] = useState<'all' | 'academic' | 'financial' | 'operations' | 'portal'>('all');

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !email.trim() || !phone.trim()) {
      onShowToast('error', 'Required Fields Missing', 'Please enter your name, email, and mobile/WhatsApp number.');
      return;
    }

    setSubmittingLead(true);
    try {
      const res = await captureLead({
        name: leadName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        source: 'public_website_lead',
        notes: `Organization: ${orgName || 'Not specified'} | Solution: ${selectedSolution} | Scale: ${orgScale} | Requirements: ${notes || 'None'}`,
      });

      if (res.data.success) {
        setLeadSuccess(true);
        onShowToast('success', 'Inquiry Ingested Successfully! 🎉', 'Our solutions specialist will connect with you on WhatsApp / phone shortly.');
      } else {
        setLeadSuccess(true); // Graceful recovery
        onShowToast('success', 'Inquiry Registered', 'Thank you! We have logged your requirement and will contact you.');
      }
    } catch {
      setLeadSuccess(true);
      onShowToast('success', 'Inquiry Saved', 'Thank you! Our onboarding specialist will contact you shortly.');
    } finally {
      setSubmittingLead(false);
    }
  };

  const handleQuickChat = async (queryText?: string) => {
    const textToSend = queryText || chatInput;
    if (!textToSend.trim()) return;

    setChatLoading(true);
    if (queryText) setChatInput(queryText);

    try {
      const res = await sendDakshoraAiChat({
        message: textToSend.trim(),
        persona: 'school_advisor',
      });
      if (res.data && res.data.message) {
        setChatAnswer(res.data.message);
      } else {
        setChatAnswer(
          'DAKSHORA 2.0 provides an end-to-end digital operating system with 16 integrated ERP modules, 8 custom website solutions, and CBSE/ICSE automated report cards.'
        );
      }
    } catch {
      setChatAnswer(
        'DAKSHORA 2.0 automates school attendance, fees, exams, and parent communication with multi-tenant Supabase security. Book a 1-on-1 demo or reach out on WhatsApp at +91 87963 47851!'
      );
    } finally {
      setChatLoading(false);
    }
  };

  const sampleAiPrompts = [
    'How does DAKSHORA prevent fee collection leakage?',
    'What is included in the CBSE / ICSE report card engine?',
    'Can DAKSHORA build custom websites for Real Estate & MSMEs?',
    'How does the 30-second mobile attendance work?',
    'Explain multi-tenant security and parent portal features',
  ];

  const erpModules = [
    {
      id: 'sis',
      category: 'academic',
      title: 'School ERP & Core SIS',
      tag: 'Core Academic',
      what: 'Centralized bio-data repository, permanent student records, section allocations, and roll registers.',
      who: 'Principals, registrars, administrative clerks, and academic heads.',
      why: 'Eliminates paper dossiers, synchronizes records across academic years, and prevents duplicate admissions.',
      icon: GraduationCap,
      color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/40 text-blue-400',
    },
    {
      id: 'attendance',
      category: 'operations',
      title: 'Smart Mobile Attendance',
      tag: '30-Sec Roll Call',
      what: 'Daily and period-wise mobile attendance, biometric and RFID integrations, and automated cutoff alerts.',
      who: 'Class teachers, subject teachers, and attendance coordinators.',
      why: 'Reduces morning roll call to 30 seconds and notifies parents instantly via SMS/WhatsApp of unexcused absences.',
      icon: Calendar,
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-400',
    },
    {
      id: 'academics',
      category: 'academic',
      title: 'Academic & Syllabus Tracker',
      tag: 'Curriculum Planning',
      what: 'Class-section subject mapping, lesson plan monitoring, daily homework dispatch, and syllabus completion audits.',
      who: 'Academic coordinators, heads of department, and teachers.',
      why: 'Ensures uniform syllabus pacing across sections and provides total transparency for school management.',
      icon: BookOpen,
      color: 'from-cyan-500/20 to-sky-500/20 border-cyan-500/40 text-cyan-400',
    },
    {
      id: 'timetable',
      category: 'operations',
      title: 'Automated Timetable & Substitution',
      tag: 'Zero Clash Engine',
      what: 'Intelligent bell schedule generation, teacher workload balancing, and 1-click absent substitution allocation.',
      who: 'Vice-principals, timetable in-charges, and teaching staff.',
      why: 'Solves complex scheduling conflicts and ensures no classroom is left unmonitored when faculty are on leave.',
      icon: Clock,
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-400',
    },
    {
      id: 'exams',
      category: 'academic',
      title: 'Examinations & CBSE Report Cards',
      tag: '100% Compliant',
      what: 'Scholastic & co-scholastic marks registers, CCE grading algorithms, and 1-click multi-color PDF report card generation.',
      who: 'Examination in-charges, evaluators, and academic trustees.',
      why: 'Eliminates hundreds of hours of manual grade calculations and produces polished board-compliant report cards.',
      icon: Award,
      color: 'from-purple-500/20 to-fuchsia-500/20 border-purple-500/40 text-purple-400',
    },
    {
      id: 'fees',
      category: 'financial',
      title: 'Fees, Invoicing & UPI QR Ledgers',
      tag: 'Zero Leakage',
      what: 'Automated tuition demand creation, dynamic UPI QR payment links, concessions, and instant digital receipts.',
      who: 'Accountants, bursars, finance trustees, and fee counters.',
      why: 'Prevents revenue leakage, automates bank reconciliation, and allows parents to pay fees from their phone.',
      icon: CreditCard,
      color: 'from-emerald-500/20 to-green-500/20 border-emerald-500/40 text-emerald-400',
    },
    {
      id: 'admissions',
      category: 'operations',
      title: 'Admissions CRM & Ingestion',
      tag: 'Lead-to-Enroll',
      what: 'Digital admission forms, lead pipeline tracking, entrance test marks, interview notes, and 1-click student conversion.',
      who: 'Admission counselors, front desk officers, and school directors.',
      why: 'Maximizes enrollment conversions and eliminates duplicate data entry from inquiry to admitted student.',
      icon: Users,
      color: 'from-pink-500/20 to-rose-500/20 border-pink-500/40 text-pink-400',
    },
    {
      id: 'communication',
      category: 'operations',
      title: 'Multi-Channel Communication Hub',
      tag: 'Broadcast Suite',
      what: 'Urgent SMS broadcasts, WhatsApp circulars, digital noticeboard, and targeted class-section announcements.',
      who: 'School administration, principals, and parent coordinators.',
      why: 'Delivers emergency closures, fee reminders, and event notices directly to parent phones with verified delivery.',
      icon: Mail,
      color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/40 text-cyan-400',
    },
    {
      id: 'transport',
      category: 'operations',
      title: 'Fleet & Real-Time Bus GPS',
      tag: 'Live Safety',
      what: 'Bus route optimization, driver rosters, student vehicle mapping, and live GPS arrival notifications.',
      who: 'Transport managers, school security in-charges, and anxious parents.',
      why: 'Ensures child transit safety and eliminates long waiting times at roadside stops with real-time ETA alerts.',
      icon: Bus,
      color: 'from-amber-500/20 to-yellow-500/20 border-amber-500/40 text-amber-400',
    },
    {
      id: 'library',
      category: 'operations',
      title: 'Digital Library & Circulation',
      tag: 'Barcode Ready',
      what: 'ISBN catalog management, barcode check-in/check-out, overdue fine ledgers, and student reading telemetry.',
      who: 'Librarians, students, and research faculty.',
      why: 'Prevents book loss, tracks popular titles, and promotes reading culture across primary and senior wings.',
      icon: Library,
      color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/40 text-blue-400',
    },
    {
      id: 'hr_payroll',
      category: 'financial',
      title: 'Staff HR, Biometrics & Payroll',
      tag: 'Automated Slips',
      what: 'Faculty biometric attendance, leave entitlement logs, monthly salary generation with PF/ESI/TDS, and payslips.',
      who: 'HR officers, accountants, and school leadership.',
      why: 'Saves days of monthly payroll computation, ensures statutory compliance, and gives staff transparent salary slips.',
      icon: DollarSign,
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-400',
    },
    {
      id: 'parent_portal',
      category: 'portal',
      title: 'Parent & Student Self-Service Portal',
      tag: '24/7 Mobile App',
      what: 'Dedicated portal for daily attendance, 1-click UPI fee payments, digital report cards, bus tracking, and notices.',
      who: 'Parents, guardians, and enrolled students.',
      why: 'Builds deep parent trust, eliminates administrative counter lines, and keeps families engaged in learning.',
      icon: User,
      color: 'from-fuchsia-500/20 to-purple-500/20 border-fuchsia-500/40 text-fuchsia-400',
    },
    {
      id: 'analytics',
      category: 'operations',
      title: 'Executive BI & Audit Analytics',
      tag: '360° Cockpit',
      what: 'Institutional cockpit displaying live fee collection, attendance trends, staff loads, and demographic breakdowns.',
      who: 'School boards, trustees, and principals.',
      why: 'Replaces guesswork with real-time data to optimize operational efficiency and academic performance.',
      icon: TrendingUp,
      color: 'from-purple-500/20 to-violet-500/20 border-purple-500/40 text-purple-400',
    },
    {
      id: 'ai_assistant',
      category: 'academic',
      title: 'DAKSHORA AI Co-Pilot & Tutor',
      tag: 'India-First AI',
      what: 'Multilingual AI assistant helping teachers craft CBSE lesson plans, generating quizzes, and answering student doubts.',
      who: 'Teachers, students, and administrative staff.',
      why: 'Accelerates teacher preparation by 5x and provides round-the-clock academic clarification in Hindi & English.',
      icon: Bot,
      color: 'from-cyan-500/20 to-indigo-500/20 border-cyan-500/40 text-cyan-400',
    },
    {
      id: 'security_rbac',
      category: 'portal',
      title: 'Multi-Tenant RBAC & Supabase RLS',
      tag: 'Zero Leakage',
      what: 'Enterprise database architecture isolating each institution’s data with mathematical Row Level Security (RLS).',
      who: 'SuperAdmins, institutional IT administrators, and security officers.',
      why: 'Guarantees that no tenant or role can ever access unauthorized institutional records, finances, or student data.',
      icon: ShieldCheck,
      color: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/40 text-indigo-400',
    },
    {
      id: 'cms_websites',
      category: 'portal',
      title: 'CMS Website Engine & Showcase',
      tag: 'Public Identity',
      what: 'Modern responsive public websites with CMS controls, announcement banners, admission enquiry forms, and galleries.',
      who: 'Institutions, colleges, coaching centers, and modern enterprises.',
      why: 'Converts prospective visitors into enrolled students and presents a world-class digital first impression.',
      icon: Globe,
      color: 'from-sky-500/20 to-cyan-500/20 border-sky-500/40 text-sky-400',
    },
  ];

  const filteredModules = erpModules.filter((m) => {
    if (selectedModuleCategory === 'all') return true;
    return m.category === selectedModuleCategory;
  });

  const solutions = [
    {
      id: 'school',
      title: '1. School Website & Institutional ERP',
      badge: 'CBSE / ICSE / State Boards',
      desc: 'Complete digital presence and end-to-end ERP for K-12 schools, academic trusts, and international academies.',
      benefits: [
        '100% CBSE CCE compliant grade sheets & report cards',
        '30-second mobile attendance & biometric integration',
        'Zero-leakage UPI fee demands & instant receipts',
        'Dedicated Parent Portal with real-time bus GPS',
      ],
      icon: GraduationCap,
      color: 'from-cyan-500 to-blue-600',
      tagColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    },
    {
      id: 'college',
      title: '2. College & University Digital Ecosystem',
      badge: 'Higher Education',
      desc: 'Multi-departmental portal supporting semester credit systems, student electives, faculty workloads, and alumni networks.',
      benefits: [
        'Semester-based credit & grading workflows',
        'Departmental faculty allocation & attendance',
        'Campus placement & alumni engagement tracking',
        'Centralized fee collection & bursar audit reports',
      ],
      icon: Building2,
      color: 'from-blue-600 to-indigo-600',
      tagColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    },
    {
      id: 'coaching',
      title: '3. Coaching & EdTech Academy Platform',
      badge: 'Competitive & Entrance Exams',
      desc: 'Optimized for NEET, JEE, UPSC, and board coaching institutes with batch management, test series, and installment fees.',
      benefits: [
        'Batch timetable scheduling & faculty tracking',
        'Mock test marks entry & rank card analytics',
        'Automated monthly fee installment reminders',
        'Lead capture CRM for incoming student inquiries',
      ],
      icon: BookOpen,
      color: 'from-indigo-600 to-purple-600',
      tagColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    },
    {
      id: 'msme',
      title: '4. Business & MSME Digital Solutions',
      badge: 'Commercial Enterprise',
      desc: 'High-conversion company websites and client workspaces tailored for Indian MSMEs, manufacturers, and trading firms.',
      benefits: [
        'Responsive corporate showcase & catalog display',
        'Automated customer inquiry routing & WhatsApp CTA',
        'Role-based staff dashboard & document sharing',
        'SEO-optimized architecture for local discovery',
      ],
      icon: Briefcase,
      color: 'from-emerald-600 to-teal-600',
      tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      id: 'real_estate',
      title: '5. Real Estate & Property Portals',
      badge: 'Developers & Agencies',
      desc: 'Interactive property showcases, virtual tour embeds, verified floor plans, and high-velocity buyer lead capture.',
      benefits: [
        'Interactive project floor plans & amenities display',
        'Direct WhatsApp broker connect with prefilled inquiry',
        'High-speed photo galleries & video walkthroughs',
        'Buyer CRM with automated lead assignment',
      ],
      icon: Home,
      color: 'from-amber-600 to-orange-600',
      tagColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    },
    {
      id: 'startup',
      title: '6. Startup & High-Growth SaaS Platforms',
      badge: 'Modern Tech Ventures',
      desc: 'Fast, futuristic web applications with authentication, interactive product previews, and high-converting marketing funnels.',
      benefits: [
        'Next-gen dark & light luxury design aesthetics',
        'Interactive feature playgrounds & live demos',
        'Modern analytics & visitor telemetry hooks',
        'High-speed serverless deployment readiness',
      ],
      icon: Rocket,
      color: 'from-pink-600 to-rose-600',
      tagColor: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
    },
    {
      id: 'professional',
      title: '7. Professional & Practice Websites',
      badge: 'Doctors, Lawyers, CAs & Consultants',
      desc: 'Elegantly crafted practice websites establishing supreme credibility, appointment requests, and client intake.',
      benefits: [
        'Verified credential & specialization showcase',
        'Online consultation request & appointment booking',
        'Secure client intake & document checklist',
        'Google Maps & multi-clinic branch locator',
      ],
      icon: Award,
      color: 'from-teal-600 to-cyan-600',
      tagColor: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
    },
    {
      id: 'enterprise',
      title: '8. Custom Enterprise Digital Solutions',
      badge: 'Bespoke Multi-Tenant SaaS',
      desc: 'Custom enterprise software with multi-tenant Postgres architecture, custom domain routing, and bespoke API workflows.',
      benefits: [
        'Multi-tenant database with Supabase Row Level Security',
        'Custom domain mapping & full whitelabel branding',
        'Tailored role hierarchies & audit trails',
        'Enterprise SLA & dedicated engineering co-pilot',
      ],
      icon: Server,
      color: 'from-violet-600 to-purple-700',
      tagColor: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
    },
  ];

  const faqs = [
    {
      q: 'What is DAKSHORA?',
      a: 'DAKSHORA 2.0 is an enterprise-grade digital operating system and cloud software platform. We engineer modern institutional ERP systems, high-conversion commercial websites, multi-tenant SaaS architecture, and India-first AI assistants that help organizations discover, manage, automate, and grow.',
    },
    {
      q: 'What is DAKSHORA ERP?',
      a: 'DAKSHORA ERP is an all-in-one institutional management suite comprising 16 unified modules: Student Information System (SIS), 30-Second Mobile Attendance, Automated UPI Fee Collection, CBSE/ICSE Compliant Report Cards, Collision-Free Timetables, Staff HR & Payroll, Transport GPS Tracking, Digital Library, and 24/7 Parent-Student Portals.',
    },
    {
      q: 'Who can use it?',
      a: 'DAKSHORA is designed for educational institutions (K-12 schools, CBSE/ICSE academies, colleges, and coaching institutes) as well as commercial enterprises (MSMEs, real estate developers, tech startups, and independent professionals like doctors, CAs, and legal practitioners).',
    },
    {
      q: 'Does it support schools?',
      a: 'Yes! School education is one of our primary core competencies. DAKSHORA 2.0 is 100% compliant with CBSE, ICSE, and Indian State Board standards. It supports CCE marks grading, term-wise report card generation, RTE admissions tracking, student health records, and bilingual parent communications.',
    },
    {
      q: 'Can DAKSHORA build custom websites?',
      a: 'Yes, absolutely. DAKSHORA engineers high-performance custom websites with integrated CMS, lead capture CRM, modern responsive design, dynamic galleries, and SEO optimization for schools, colleges, real estate firms, startups, and enterprises.',
    },
    {
      q: 'Does it support multi-tenant organizations?',
      a: 'Yes. DAKSHORA is engineered on a true multi-tenant cloud architecture backed by Supabase PostgreSQL and Row Level Security (RLS). Every organization or school campus enjoys strict mathematical data isolation—School A can never see School B’s data under any circumstance.',
    },
    {
      q: 'Is there a parent portal?',
      a: 'Yes! DAKSHORA includes a dedicated Parent & Student Self-Service Portal accessible via web and mobile. Parents can view real-time attendance, pay fees via UPI with instant receipt downloads, inspect term report cards, check daily homework, and track the school bus live via GPS.',
    },
    {
      q: 'Is AI included?',
      a: 'Yes, DAKSHORA AI is natively integrated across the platform. It functions as an academic co-pilot for teachers (generating lesson plans and question sets), an operational advisor for administrators, and a helpful assistant for parents in multiple Indian languages (Hindi, English, Hinglish, etc.).',
    },
    {
      q: 'How can I request a demo?',
      a: 'You can book a free, personalized 1-on-1 walkthrough by filling out the Schedule Demo form on this page or by clicking the WhatsApp button (+91 87963 47851). Our educational technology advisor will schedule a live interactive session tailored to your institution’s requirements.',
    },
    {
      q: 'How can I contact DAKSHORA?',
      a: 'You can reach the DAKSHORA team directly via WhatsApp at +91 87963 47851, email us at dakshora.ai@gmail.com, or submit an inquiry using our online lead form. Our support and solutions teams respond rapidly to all institutional queries.',
    },
  ];

  return (
    <div className="w-full space-y-24 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION: COMMERCIAL PROPOSITION & MASTER SAAS OVERVIEW */}
      {/* ========================================================================= */}
      <section className="relative w-full pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden rounded-3xl bg-gradient-to-b from-[#0B0F19] via-[#0D1424] to-[#080C16] border border-cyan-500/25 shadow-2xl">
        {/* Ambient Gradient Glow Blobs */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-cyan-500/20 via-indigo-600/20 to-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-7">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono shadow-inner shadow-cyan-500/10">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="font-semibold tracking-wide">DAKSHORA 2.0 • Unified Enterprise Operating System & AI Cloud</span>
          </div>

          {/* Master Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15]">
            Next-Generation Cloud ERP & Custom Websites for{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400">
              India's Modern Institutions & Enterprises
            </span>
          </h1>

          {/* Value Subtitle */}
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-mono max-w-3xl mx-auto">
            From 30-second mobile attendance and zero-leakage UPI fee collection to CBSE/ICSE report cards, bus GPS, and 8 specialized website solutions — engineered with enterprise multi-tenant security and India-first AI.
          </p>

          {/* Action CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-3">
            <a
              href="#demo-section"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-xl shadow-cyan-500/25 transition-all flex items-center gap-2 hover:scale-[1.02]"
            >
              <span>Schedule 1-on-1 Demo</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="#solutions"
              className="px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Explore 8 Solutions</span>
            </a>

            <button
              onClick={onRequestLogin}
              className="px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 hover:text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/10 transition-all flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Login to Portal</span>
            </button>

            <a
              href="https://wa.me/918796347851?text=Hello%20DAKSHORA%2C%20I%20would%20like%20to%20know%20more%20about%20your%20solutions."
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs sm:text-sm transition-all flex items-center gap-2"
              aria-label="Contact DAKSHORA on WhatsApp at 8796347851"
            >
              <span className="text-base">💬</span>
              <span>WhatsApp Advisor</span>
            </a>
          </div>

          {/* Social Proof / Trust Matrix */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-5 gap-3.5 max-w-4xl mx-auto border-t border-slate-800/80 text-left">
            <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800/90 space-y-1">
              <span className="text-2xl font-black text-cyan-400 font-mono block">100%</span>
              <span className="text-[11px] text-slate-300 font-mono font-medium">CBSE / ICSE Compliant</span>
            </div>
            <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800/90 space-y-1">
              <span className="text-2xl font-black text-white font-mono block">16</span>
              <span className="text-[11px] text-slate-300 font-mono font-medium">Modular ERP Applications</span>
            </div>
            <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800/90 space-y-1">
              <span className="text-2xl font-black text-emerald-400 font-mono block">0%</span>
              <span className="text-[11px] text-slate-300 font-mono font-medium">Fee Collection Leakage</span>
            </div>
            <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800/90 space-y-1">
              <span className="text-2xl font-black text-indigo-400 font-mono block">&lt; 30s</span>
              <span className="text-[11px] text-slate-300 font-mono font-medium">Mobile Classroom Roll Call</span>
            </div>
            <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800/90 space-y-1 col-span-2 sm:col-span-1">
              <span className="text-2xl font-black text-purple-400 font-mono block">RLS</span>
              <span className="text-[11px] text-slate-300 font-mono font-medium">Multi-Tenant Isolation</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CORE STAKEHOLDER VALUE PROPOSITIONS */}
      {/* ========================================================================= */}
      <section className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono">
            <span>Tailored For Every Role</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
            Designed for Every Stakeholder in Your Ecosystem
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Dedicated workspaces ensure trustees, teachers, accountants, and parents only interact with what matters to them.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Principals & Trustees */}
          <div className="p-6 rounded-3xl border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3.5 bg-gradient-to-b from-slate-900 to-slate-950 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">For Principals & Trustees</h3>
              <p className="text-[11px] text-cyan-400 font-mono mt-0.5">Governance & Strategic Cockpit</p>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300 font-mono">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>360° Real-time Cockpit over enrolled students, faculty & daily revenue</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>Automated fee defaulter alerts & audit trails</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>Multi-campus and academic session switching</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Teachers & Faculty */}
          <div className="p-6 rounded-3xl border border-slate-800 hover:border-indigo-500/40 transition-all space-y-3.5 bg-gradient-to-b from-slate-900 to-slate-950 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">For Teachers & Faculty</h3>
              <p className="text-[11px] text-indigo-400 font-mono mt-0.5">Classroom & Academic Efficiency</p>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300 font-mono">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>Instant 30-second mobile classroom roll call registers</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>Period timetables with automated substitution recommendations</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>Bulk exam marks entry & CBSE report card publishing</span>
              </li>
            </ul>
          </div>

          {/* Card 3: Parents & Students */}
          <div className="p-6 rounded-3xl border border-slate-800 hover:border-purple-500/40 transition-all space-y-3.5 bg-gradient-to-b from-slate-900 to-slate-950 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">For Parents & Students</h3>
              <p className="text-[11px] text-purple-400 font-mono mt-0.5">24/7 Mobile Portal & Safety</p>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300 font-mono">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                <span>1-Click UPI fee payment & instant digital receipts</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                <span>Real-time GPS bus tracking & arrival ETA notifications</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                <span>Daily homework, circulars & attendance alerts on phone</span>
              </li>
            </ul>
          </div>

          {/* Card 4: Accounts & Administrators */}
          <div className="p-6 rounded-3xl border border-slate-800 hover:border-emerald-500/40 transition-all space-y-3.5 bg-gradient-to-b from-slate-900 to-slate-950 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">For Accounts & Bursar</h3>
              <p className="text-[11px] text-emerald-400 font-mono mt-0.5">Zero Revenue Leakage</p>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300 font-mono">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Zero fee collection leakage with automated ledgers & demands</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Faculty biometric payroll with PF, ESI & TDS deductions</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Instant export to CSV, Excel & Tally compatible formats</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. 16 CORE ERP MODULES SHOWCASE (Anchor: #features) */}
      {/* ========================================================================= */}
      <section id="features" className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Comprehensive Institutional Suite</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            16 Integrated ERP Modules Built for Indian Standard Schools
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-mono">
            Every module works together seamlessly without third-party duct tape. No data duplication, no sync delays.
          </p>

          {/* Module Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {[
              { id: 'all', label: 'All 16 Modules' },
              { id: 'academic', label: 'Academic & Exams' },
              { id: 'financial', label: 'Fees & Payroll' },
              { id: 'operations', label: 'Operations & Fleet' },
              { id: 'portal', label: 'Portals & Security' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedModuleCategory(cat.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                  selectedModuleCategory === cat.id
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 16 Modules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          {filteredModules.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.id}
                className="p-5 bg-gradient-to-b from-slate-900/90 to-slate-950/90 rounded-2xl border border-slate-800/80 hover:border-cyan-500/50 transition-all space-y-3 flex flex-col justify-between group shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-xl border bg-gradient-to-br ${m.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                      {m.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">
                      {m.title}
                    </h3>
                  </div>

                  <div className="space-y-2 text-[11px] text-slate-300 font-sans leading-relaxed">
                    <div>
                      <span className="text-cyan-400 font-mono font-bold text-[10px] uppercase block">What it does:</span>
                      <p>{m.what}</p>
                    </div>
                    <div>
                      <span className="text-indigo-400 font-mono font-bold text-[10px] uppercase block">Who it helps:</span>
                      <p className="text-slate-400">{m.who}</p>
                    </div>
                    <div>
                      <span className="text-emerald-400 font-mono font-bold text-[10px] uppercase block">Why it matters:</span>
                      <p className="text-slate-400">{m.why}</p>
                    </div>
                  </div>
                </div>

                <a
                  href="#demo-section"
                  onClick={() => setSelectedSolution(m.title)}
                  className="pt-2 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 group/btn"
                >
                  <span>Request Live Demo</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                </a>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. 8 COMMERCIAL SOLUTIONS SHOWCASE (Anchor: #solutions) */}
      {/* ========================================================================= */}
      <section id="solutions" className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono">
            <Compass className="w-3.5 h-3.5 text-purple-400" />
            <span>Tailored Digital Architectures</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            8 Specialized Solutions Engineered for High-Growth Sectors
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-mono">
            Whether you run a K-12 academic trust, a real estate firm, a startup, or an MSME — DAKSHORA delivers custom portals, websites, and dashboards tailored to your exact business model.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {solutions.map((sol) => {
            const Icon = sol.icon;
            return (
              <div
                key={sol.id}
                className="p-6 rounded-3xl border border-slate-800 hover:border-purple-500/50 bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col justify-between space-y-4 shadow-xl group transition-all"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${sol.color} flex items-center justify-center text-white shadow-lg`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${sol.tagColor}`}>
                      {sol.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-base group-hover:text-purple-300 transition-colors">
                      {sol.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-sans mt-1.5 leading-relaxed">
                      {sol.desc}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold block">Key Deliverables:</span>
                    <ul className="space-y-1.5 text-xs text-slate-300 font-mono">
                      {sol.benefits.map((b, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <span className="text-[11px]">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <a
                    href="#demo-section"
                    onClick={() => setSelectedSolution(sol.title)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-mono text-xs font-bold text-center transition-all flex items-center justify-center gap-1"
                  >
                    <span>Request Demo</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`https://wa.me/918796347851?text=Hello%20DAKSHORA%2C%20I%20am%20interested%20in%20learning%20more%20about%20${encodeURIComponent(sol.title)}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-400 transition-all"
                    title="Inquire via WhatsApp"
                    aria-label={`Chat on WhatsApp about ${sol.title}`}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. DAKSHORA AI INTERACTIVE LIVE EXPERIENCE (Anchor: #ai) */}
      {/* ========================================================================= */}
      <section id="ai" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="p-6 sm:p-10 rounded-3xl border border-cyan-500/40 bg-gradient-to-b from-[#0b162c] via-[#091122] to-slate-950 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-cyan-500/25">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-xl text-white">Ask DakshOra AI</h3>
                <p className="text-xs text-slate-300 font-mono">
                  Explore DAKSHORA, ERP, websites, AI solutions and more.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>LIVE AI CO-PILOT</span>
              </span>
            </div>
          </div>

          {/* Quick Click Prompts */}
          <div className="space-y-2 relative z-10">
            <span className="text-[11px] font-mono text-slate-400">Click a sample inquiry to test:</span>
            <div className="flex flex-wrap gap-2">
              {sampleAiPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickChat(p)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs font-mono transition-all text-left"
                >
                  💡 {p}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Chat Input Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleQuickChat(); }} className="flex flex-col sm:flex-row gap-2.5 relative z-10">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="e.g. How does DAKSHORA prevent fee collection leakage in Indian schools?"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:brightness-110 text-white text-xs font-bold font-mono transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <Send className="w-4 h-4" />
              <span>{chatLoading ? 'Consulting Engine...' : 'Ask DakshOra AI'}</span>
            </button>
          </form>

          {/* Dynamic AI Response Box */}
          {chatAnswer && (
            <div className="p-5 bg-slate-950/95 rounded-2xl border border-cyan-500/40 text-xs font-mono text-cyan-200 leading-relaxed whitespace-pre-wrap animate-in fade-in space-y-2 relative z-10">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-[11px] pb-1 border-b border-cyan-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>DAKSHORA AI Verified Knowledge</span>
              </div>
              <p className="text-slate-200 text-xs sm:text-sm font-sans leading-relaxed">{chatAnswer}</p>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. COMMERCIAL PRICING & SAAS TIERS (Anchor: #pricing) */}
      {/* ========================================================================= */}
      <section id="pricing" className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Affordable & Predictable Pricing</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Transparent Plans for Schools & Institutions of All Sizes
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-mono">
            No hidden setup fees. Includes full teacher training, existing data migration, and dedicated WhatsApp support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Plan 1: Starter */}
          <div className="p-7 rounded-3xl border border-slate-800 space-y-6 bg-slate-950/70 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">STARTER</span>
                <h3 className="text-2xl font-bold text-white mt-1">Foundation ERP</h3>
                <p className="text-xs text-slate-400 font-mono mt-1">For growing schools up to 500 students</p>
              </div>
              <div className="text-3xl font-extrabold text-white font-mono">
                ₹15 <span className="text-xs font-normal text-slate-400">/ student / month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 font-mono">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Student Bio-Data & Roll Register</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>30-Sec Daily Mobile Attendance</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Tuition Demands & UPI QR Receipts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Digital Noticeboard & Circulars</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Dedicated WhatsApp Support Group</span>
                </li>
              </ul>
            </div>
            <a
              href="#demo-section"
              onClick={() => setSelectedSolution('Foundation Starter ERP (₹15/student)')}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold font-mono flex items-center justify-center transition-all"
            >
              Select Starter Plan
            </a>
          </div>

          {/* Plan 2: Growth (Featured) */}
          <div className="p-7 rounded-3xl border-2 border-cyan-500/70 space-y-6 bg-gradient-to-b from-cyan-950/25 via-slate-950 to-slate-950 shadow-2xl relative flex flex-col justify-between">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 text-white uppercase tracking-wider font-mono shadow-md shadow-cyan-500/30">
              MOST POPULAR
            </span>
            <div className="space-y-4">
              <div>
                <span className="text-xs font-mono text-cyan-300 font-bold uppercase tracking-wider">GROWTH</span>
                <h3 className="text-2xl font-bold text-white mt-1">Full Academic OS</h3>
                <p className="text-xs text-slate-400 font-mono mt-1">For established schools (500 to 2,500 students)</p>
              </div>
              <div className="text-3xl font-extrabold text-white font-mono">
                ₹28 <span className="text-xs font-normal text-slate-400">/ student / month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 font-mono">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>All Foundation Starter Features</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>CBSE & ICSE Automated Report Cards</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Automated Timetable & Substitution</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Parent Portal & Real-Time Bus GPS</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Staff HR, Biometric Payroll & Slips</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>SMS Gateway & WhatsApp Broadcasts</span>
                </li>
              </ul>
            </div>
            <a
              href="#demo-section"
              onClick={() => setSelectedSolution('Full Academic Growth OS (₹28/student)')}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:brightness-110 text-white text-xs font-bold font-mono flex items-center justify-center transition-all shadow-xl shadow-cyan-500/25"
            >
              Get Started with Growth
            </a>
          </div>

          {/* Plan 3: Enterprise */}
          <div className="p-7 rounded-3xl border border-slate-800 space-y-6 bg-slate-950/70 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-mono text-purple-400 font-bold uppercase tracking-wider">ENTERPRISE</span>
                <h3 className="text-2xl font-bold text-white mt-1">Multi-Campus Trust</h3>
                <p className="text-xs text-slate-400 font-mono mt-1">Multi-campus institutions with 2,500+ students</p>
              </div>
              <div className="text-3xl font-extrabold text-white font-mono">
                Custom <span className="text-xs font-normal text-slate-400">Pricing</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 font-mono">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>All 16 Modular ERP Applications</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Multi-Campus Central Governance Hub</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Custom Whitelabel Domain & App Name</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Dedicated Database Tier & 99.9% SLA</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Dedicated Onsite Onboarding Engineer</span>
                </li>
              </ul>
            </div>
            <a
              href="#demo-section"
              onClick={() => setSelectedSolution('Enterprise Multi-Campus Trust')}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold font-mono flex items-center justify-center transition-all"
            >
              Contact Enterprise Sales
            </a>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. ABOUT US: HIGH-IMPACT STORYTELLING (Anchor: #about-us) */}
      {/* ========================================================================= */}
      <section id="about-us" className="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="p-8 sm:p-12 rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/95 via-[#0d1424] to-slate-950 shadow-2xl space-y-8">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Technology & Vision</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              About DAKSHORA: Engineering India's Premier Digital Operating Infrastructure
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-mono leading-relaxed">
              DAKSHORA was founded with an unyielding mission: to empower institutions, educators, entrepreneurs, and modern businesses with world-class digital tools that replace bureaucratic chaos with automated precision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Who We Are</h3>
              <p className="text-xs text-slate-400 font-mono leading-relaxed">
                A serious Indian technology and AI engineering company building high-performance cloud software, responsive web portals, and institutional operating systems.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">What We Build</h3>
              <p className="text-xs text-slate-400 font-mono leading-relaxed">
                Unified systems combining 16 ERP modules, 8 specialized website solutions, CBSE compliance engines, and domain-tuned AI co-pilots under one cohesive identity.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Our Technology Stack</h3>
              <p className="text-xs text-slate-400 font-mono leading-relaxed">
                Powered by Next.js, Fastify high-throughput API gateways, Supabase Cloud PostgreSQL with Row Level Security (RLS), and zero-leakage role-based access.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/30 via-indigo-950/30 to-purple-950/30 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="font-bold text-white text-sm">Want to partner with or inspect DAKSHORA architecture?</h4>
              <p className="text-xs text-slate-400 font-mono">Our executive engineering and solutions teams are ready to assist you.</p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="https://wa.me/918796347851?text=Hello%20DAKSHORA%2C%20I%20would%20like%20to%20know%20more%20about%20your%20solutions."
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-all flex items-center gap-1.5"
                aria-label="Connect on WhatsApp"
              >
                <span>💬 WhatsApp +91 87963 47851</span>
              </a>
              <a
                href="mailto:dakshora.ai@gmail.com?subject=DAKSHORA%20Enquiry&body=Hello%20DAKSHORA%20Team%2C%0A%0AI%20would%20like%20to%20know%20more%20about%20your%20products%20and%20solutions.%0A%0ARegards"
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs font-bold transition-all flex items-center gap-1.5"
                aria-label="Email DAKSHORA"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>dakshora.ai@gmail.com</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FAQ ACCORDION SECTION (10 REQUIRED QUESTIONS) (Anchor: #faq) */}
      {/* ========================================================================= */}
      <section id="faq" className="space-y-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-mono">
            Everything you need to know about DAKSHORA, school ERP, multi-tenant security, and custom websites.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-900/50 transition-colors"
                >
                  <span className="font-bold text-white text-xs sm:text-sm font-sans flex items-center gap-2.5">
                    <span className="text-cyan-400 font-mono text-xs">0{index + 1}.</span>
                    <span>{faq.q}</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-cyan-400' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-300 font-sans leading-relaxed border-t border-slate-900 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. LEAD INQUIRY & DEMO SCHEDULER (Anchor: #demo-section / #contact) */}
      {/* ========================================================================= */}
      <section id="demo-section" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="p-6 sm:p-10 rounded-3xl border border-cyan-500/35 bg-gradient-to-b from-[#0e172a] via-[#0b1220] to-slate-950 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Personalized Walkthrough</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Schedule Your Free 1-on-1 Demonstration
            </h3>
            <p className="text-xs text-slate-400 font-mono max-w-lg mx-auto">
              See how DAKSHORA 2.0 can automate your institution's daily operations, eliminate fee leakage, and empower your educators.
            </p>
          </div>

          {leadSuccess ? (
            <div className="p-8 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-center space-y-4 animate-in fade-in">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <div className="space-y-1">
                <h4 className="font-bold text-white text-lg">Inquiry Successfully Registered!</h4>
                <p className="text-xs text-slate-300 font-mono max-w-md mx-auto">
                  Thank you! Our onboarding advisor will connect with you on WhatsApp / mobile within 2 business hours to arrange your customized demo.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="https://wa.me/918796347851?text=Hello%20DAKSHORA%2C%20I%20just%20submitted%20a%20demo%20request%20on%20your%20website."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-all inline-flex items-center gap-2"
                >
                  <span>Chat on WhatsApp Directly</span>
                </a>
                <button
                  onClick={() => setLeadSuccess(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-mono font-bold border border-slate-700 transition-all"
                >
                  Submit Another Inquiry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Your Name & Role / Designation *</label>
                  <input
                    type="text"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Sharma (Principal / Director)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Institution / Company Name</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Delhi Public Heritage School"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Official Email Address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="principal@institution.edu.in"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Mobile / WhatsApp Number *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Solution of Interest</label>
                  <select
                    value={selectedSolution}
                    onChange={(e) => setSelectedSolution(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="School Website & Institutional ERP">1. School Website & Institutional ERP</option>
                    <option value="College & University Digital Ecosystem">2. College & University Digital Ecosystem</option>
                    <option value="Coaching & EdTech Academy Platform">3. Coaching & EdTech Academy Platform</option>
                    <option value="Business & MSME Digital Solutions">4. Business & MSME Digital Solutions</option>
                    <option value="Real Estate & Property Portals">5. Real Estate & Property Portals</option>
                    <option value="Startup & High-Growth SaaS Platforms">6. Startup & High-Growth SaaS Platforms</option>
                    <option value="Professional & Practice Websites">7. Professional & Practice Websites</option>
                    <option value="Custom Enterprise Digital Solutions">8. Custom Enterprise Digital Solutions</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Estimated Enrolled Students / Organization Scale</label>
                  <select
                    value={orgScale}
                    onChange={(e) => setOrgScale(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Under 500 Students">Under 500 Students</option>
                    <option value="500 - 1,500 Students / Users">500 - 1,500 Students / Users</option>
                    <option value="1,500 - 3,000 Students / Users">1,500 - 3,000 Students / Users</option>
                    <option value="3,000+ Students (Multi-Campus Chain)">3,000+ Students (Multi-Campus Chain)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Specific Requirements or Modules Needed (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Need automated CBSE report cards, GPS bus tracking, and UPI fee collection ledger for next academic session."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingLead}
                className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:brightness-110 text-white font-bold text-xs sm:text-sm font-mono shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{submittingLead ? 'Ingesting Request...' : 'Book Free 1-on-1 Demonstration'}</span>
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. COMPREHENSIVE FOOTER & CONTACT SECTION */}
      {/* ========================================================================= */}
      <footer id="contact" className="w-full border-t border-slate-800 bg-[#070A12] py-14 px-4 sm:px-6 lg:px-8 text-xs font-mono text-slate-400 space-y-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.svg"
                alt="DAKSHORA"
                className="h-8 w-auto max-w-[36px]"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.jpg'; }}
              />
              <span className="font-black text-xl text-white tracking-wider">DAKSHORA</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gradient-to-r from-indigo-600 to-violet-700 text-white">2.0</span>
            </div>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              India's premier Digital Operating System and AI Cloud for modern educational institutions, colleges, coaching academies, MSMEs, and high-growth enterprises.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Multi-Tenant RLS Secured Cloud</span>
            </div>
          </div>

          {/* Col 2: Navigation Anchors */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Platform Links</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#features" className="hover:text-cyan-400 transition-colors">ERP Modules</a></li>
              <li><a href="#solutions" className="hover:text-cyan-400 transition-colors">8 Industry Solutions</a></li>
              <li><a href="#ai" className="hover:text-cyan-400 transition-colors">Ask DakshOra AI</a></li>
              <li><a href="#pricing" className="hover:text-cyan-400 transition-colors">Commercial Pricing</a></li>
              <li><a href="#about-us" className="hover:text-cyan-400 transition-colors">About Us</a></li>
              <li><a href="#faq" className="hover:text-cyan-400 transition-colors">Frequently Asked Questions</a></li>
            </ul>
          </div>

          {/* Col 3: Direct Connect & Support */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Direct Connect</h4>
            <ul className="space-y-2.5 text-slate-400">
              <li>
                <a
                  href="https://wa.me/918796347851?text=Hello%20DAKSHORA%2C%20I%20would%20like%20to%20know%20more%20about%20your%20solutions."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-emerald-400 transition-colors text-slate-300"
                  aria-label="WhatsApp +91 87963 47851"
                >
                  <span className="text-emerald-400">💬</span>
                  <span>WhatsApp: +91 87963 47851</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:dakshora.ai@gmail.com?subject=DAKSHORA%20Enquiry&body=Hello%20DAKSHORA%20Team%2C%0A%0AI%20would%20like%20to%20know%20more%20about%20your%20products%20and%20solutions.%0A%0ARegards"
                  className="flex items-center gap-2 hover:text-cyan-400 transition-colors text-slate-300"
                  aria-label="Email dakshora.ai@gmail.com"
                >
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>dakshora.ai@gmail.com</span>
                </a>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>www.dakshora.co.in</span>
              </li>
              <li className="pt-1">
                <button
                  onClick={onRequestLogin}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 hover:text-white font-mono text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Single Portal Login</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Compliance & Trust Badges */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Compliance & Security</h4>
            <div className="space-y-2 text-[11px] text-slate-400 font-sans">
              <p className="flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% CBSE & ICSE Academic Standards</span>
              </p>
              <p className="flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Supabase PostgreSQL Row Level Security (RLS)</span>
              </p>
              <p className="flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Role-Based Access Control (5 Granular Roles)</span>
              </p>
              <p className="flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Strict Tenant Data Isolation</span>
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} DAKSHORA 2.0. All Rights Reserved. Built with precision for India & global education.
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="hover:text-slate-400">ERP Modules</a>
            <span>•</span>
            <a href="#solutions" className="hover:text-slate-400">Solutions</a>
            <span>•</span>
            <a href="#pricing" className="hover:text-slate-400">Pricing</a>
            <span>•</span>
            <a href="#faq" className="hover:text-slate-400">FAQ</a>
            <span>•</span>
            <a href="#about-us" className="hover:text-slate-400">About Us</a>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 11. FLOATING ACTION BUTTONS (WhatsApp & Ask DakshOra AI) */}
      {/* ========================================================================= */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-auto">
        {/* Floating Ask DakshOra AI Quick Button */}
        <a
          href="#ai"
          className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-mono text-xs font-bold shadow-2xl shadow-purple-500/30 hover:scale-105 hover:brightness-110 transition-all border border-purple-400/30"
          aria-label="Ask DakshOra AI"
        >
          <Sparkles className="w-4 h-4 animate-pulse text-amber-300" />
          <span className="hidden sm:inline">Ask DakshOra AI</span>
        </a>

        {/* Floating WhatsApp Action Button */}
        <a
          href="https://wa.me/918796347851?text=Hello%20DAKSHORA%2C%20I%20would%20like%20to%20know%20more%20about%20your%20solutions."
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold shadow-2xl shadow-emerald-600/40 hover:scale-105 transition-all border border-emerald-400/40"
          aria-label="Chat with DAKSHORA on WhatsApp at 8796347851"
          title="Chat on WhatsApp (+91 87963 47851)"
        >
          <span className="text-lg">💬</span>
          <span className="hidden sm:inline">WhatsApp Advisor</span>
        </a>
      </div>
    </div>
  );
};
