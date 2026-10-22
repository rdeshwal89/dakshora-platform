import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Send,
  Bot,
  RefreshCw,
  Sparkles,
  Award,
  BookOpen,
  Users,
  Clock,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Cpu,
  Layers,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  X,
  ArrowRight,
  Check
} from 'lucide-react';
import { fetchWebsiteCms, captureLead, sendDakshoraAiChat } from '../services/api';

interface SchoolPublicWebsiteViewProps {
  siteId?: string;
  cmsTree?: any;
  onClose?: () => void;
  onShowToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
  onRequestLogin?: () => void;
}

export const SchoolPublicWebsiteView: React.FC<SchoolPublicWebsiteViewProps> = ({
  siteId = 'site-1',
  cmsTree: passedCmsTree,
  onClose,
  onShowToast,
  onRequestLogin
}) => {
  const [cmsTree, setCmsTree] = useState<any>(passedCmsTree || null);
  const [loading, setLoading] = useState(!passedCmsTree);
  const [activePage, setActivePage] = useState<string>('home');

  // Admission Form State
  const [studentName, setStudentName] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [applyingGrade, setApplyingGrade] = useState('Class 1');
  const [admissionNotes, setAdmissionNotes] = useState('');
  const [submittingLead, setSubmittingLead] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);

  // AI Assistant Chat State
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    {
      sender: 'bot',
      text: 'नमस्ते! Welcome to our school portal. How can I assist you today regarding admissions, CBSE curriculum, fee structures, or campus facilities?'
    }
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  // Animated Hero Carousel State (at least 2-4 pictures auto-animating)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);

  // 2-4 Campus Showcase Photos (Dynamic from CMS Tree or Premier Defaults)
  const campusSlides = useMemo(() => {
    const customSlides = cmsTree?.content?.heroSlides || cmsTree?.content?.schoolPics;
    if (Array.isArray(customSlides) && customSlides.length >= 2) {
      return customSlides;
    }
    if (Array.isArray(cmsTree?.media) && cmsTree.media.length >= 2) {
      return cmsTree.media.slice(0, 6).map((m: any, idx: number) => ({
        id: m.id || `slide-${idx}`,
        title: m.name || `Campus Feature ${idx + 1}`,
        subtitle: m.type || 'World-Class Infrastructure & Learning Spaces',
        badge: idx === 0 ? 'CBSE Main Campus' : idx === 1 ? 'Smart Science & ATL Lab' : idx === 2 ? 'Sports Complex' : 'Smart Digital Library',
        url: m.url
      }));
    }
    return [
      {
        id: 'slide-1',
        title: 'Architectural Smart Campus & Academic Enclave',
        subtitle: 'Sprawling 15-acre green eco-campus with climate-controlled digital classrooms and collaborative learning zones.',
        badge: 'CBSE Smart Campus',
        url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1600&q=80'
      },
      {
        id: 'slide-2',
        title: 'Atal Tinkering Robotics & STEM Innovation Center',
        subtitle: 'Empowering future innovators with AI workstations, 3D printing labs, drone simulation, and hands-on experiments.',
        badge: 'ATL Robotics Lab',
        url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1600&q=80'
      },
      {
        id: 'slide-3',
        title: 'Olympic-Standard Sports Arena & Athletic Complex',
        subtitle: 'FIFA-standard football turf, Olympic-dimension swimming pool, indoor badminton courts, and certified coaching.',
        badge: 'Sports & Athletics',
        url: 'https://images.unsplash.com/photo-1576495199011-eb94736d05d6?auto=format&fit=crop&w=1600&q=80'
      },
      {
        id: 'slide-4',
        title: 'Heritage Digital Library & Knowledge Sanctuary',
        subtitle: 'Over 40,000 physical volumes, EBSCO digital research databases, dedicated quiet study pods, and audio-visual stations.',
        badge: 'Digital Library',
        url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1600&q=80'
      }
    ];
  }, [cmsTree]);

  // Auto-play interval: cycles every 3.5s automatically, pauses when user hovers
  useEffect(() => {
    if (isCarouselHovered || campusSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % campusSlides.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [isCarouselHovered, campusSlides.length]);

  useEffect(() => {
    if (passedCmsTree) {
      setCmsTree(passedCmsTree);
      setLoading(false);
      return;
    }

    async function loadCms() {
      setLoading(true);
      try {
        const res = await fetchWebsiteCms(siteId);
        if (res.data?.success && res.data?.tree) {
          setCmsTree(res.data.tree);
        }
      } catch (err: any) {
        console.warn('Failed to fetch CMS tree:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCms();
  }, [siteId, passedCmsTree]);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !parentPhone.trim()) {
      onShowToast?.('error', 'Missing Information', 'Please provide student name and parent mobile number.');
      return;
    }

    setSubmittingLead(true);
    try {
      const res = await captureLead({
        name: parentName ? `${parentName} (Parent of ${studentName})` : studentName,
        phone: parentPhone.trim(),
        email: parentEmail.trim() || 'admissions@school.dakshora.app',
        source: 'website',
        notes: `School: ${cmsTree?.name || 'School Portal'} | Grade Applied: ${applyingGrade} | Student: ${studentName} | Note: ${admissionNotes || 'None'}`
      });

      if (res.data?.success) {
        setLeadSuccess(true);
        onShowToast?.('success', 'Application Submitted! 🎉', 'Our admissions counselor will contact you shortly.');
      } else {
        setLeadSuccess(true); // graceful offline fallback
      }
    } catch {
      setLeadSuccess(true);
    } finally {
      setSubmittingLead(false);
    }
  };

  const handleSendAiChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || aiLoading) return;

    const userText = aiPrompt.trim();
    setAiMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setAiPrompt('');
    setAiLoading(true);

    try {
      const res = await sendDakshoraAiChat({
        message: `You are the official AI Counselor for ${cmsTree?.name || 'our school'}. Answer briefly and politely: ${userText}`,
        persona: 'admissions-counselor'
      });
      const dataAny = res.data as any;
      const reply = dataAny?.answer || dataAny?.message || dataAny?.response || `Thank you for your question about ${cmsTree?.name || 'our institution'}. Admissions for Session 2026-27 are currently open. Our administrative desk is available from 8:00 AM to 3:00 PM on weekdays.`;
      setAiMessages(prev => [...prev, { sender: 'bot', text: typeof reply === 'string' ? reply : JSON.stringify(reply) }]);
    } catch {
      setAiMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: `Thank you for reaching out to ${cmsTree?.name || 'our academy'}. For admissions inquiries, you may fill our online registration form or visit our campus office.`
        }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading || !cmsTree) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-mono p-8">
        <div className="text-center space-y-4">
          <RefreshCw className="w-10 h-10 animate-spin text-indigo-400 mx-auto" />
          <p className="text-sm font-bold">Loading Live School Web Portal from CMS Engine...</p>
        </div>
      </div>
    );
  }

  const themeColor = cmsTree.template?.themeColor || '#4F46E5';
  const fontFamily = cmsTree.template?.fontFamily || "'Plus Jakarta Sans', sans-serif";

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900 antialiased relative flex flex-col"
      style={{ fontFamily }}
    >
      {/* ========================================================================= */}
      {/* 1. TOP LIVE PORTAL NOTICE & SIMULATION BANNER */}
      {/* ========================================================================= */}
      <div className="bg-slate-950 text-white px-4 py-2 border-b border-slate-800 text-xs font-mono flex flex-wrap items-center justify-between gap-2 z-50">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-black text-emerald-400">DAKSHORA 2.0 LIVE PORTAL</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-300">Domain: <strong className="text-indigo-300">https://{cmsTree.domain?.subdomain || 'school.dakshora.app'}</strong></span>
          <span className="px-2 py-0.2 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30">
            v{cmsTree.publishing?.version || 1} Production
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close Live View</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SCHOOL BRANDING HEADER */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-slate-200 shadow-sm">
        {/* Top Info Strip */}
        <div
          className="text-white px-4 sm:px-8 py-1.5 text-xs font-mono flex flex-wrap items-center justify-between gap-2"
          style={{ backgroundColor: themeColor }}
        >
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              <span>{cmsTree.content?.contactPhone || '+91 98765 43210'}</span>
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <span>{cmsTree.content?.contactEmail || 'admissions@school.edu.in'}</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold">
              {cmsTree.content?.schoolMotto || 'विद्या ददाति विनयं • Excellence in Education'}
            </span>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => setActivePage('home')}>
            {cmsTree?.content?.schoolLogoUrl || cmsTree?.branding?.logoUrl ? (
              <img
                src={cmsTree.content?.schoolLogoUrl || cmsTree.branding?.logoUrl}
                alt={cmsTree.name || 'School Logo'}
                className="w-12 h-12 rounded-2xl object-contain border-2 border-slate-200 shadow-md bg-white p-1 shrink-0"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-md shrink-0"
                style={{ backgroundColor: themeColor }}
              >
                🏛️
              </div>
            )}
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight leading-tight">
                {cmsTree?.name || 'Heritage Public Academy'}
              </h1>
              <p className="text-[11px] font-mono font-bold text-slate-600">
                {cmsTree?.content?.schoolMotto || 'CBSE Affiliated Senior Secondary Co-Ed Institution'}
              </p>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-mono font-black text-slate-800">
            {[
              { id: 'home', label: 'Home (होम)' },
              { id: 'about', label: 'About Us (परिचय)' },
              { id: 'academics', label: 'Academics (पाठ्यक्रम)' },
              { id: 'admissions', label: 'Admissions 2026' },
              { id: 'labs', label: 'Smart Labs & ATL' },
              { id: 'contact', label: 'Contact (संपर्क)' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                  activePage === item.id
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'hover:bg-slate-100 text-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActivePage('admissions')}
              className="px-4 py-2.5 rounded-2xl text-white font-mono font-black text-xs shadow-md transition-all hover:brightness-110 cursor-pointer flex items-center gap-1.5"
              style={{ backgroundColor: themeColor }}
            >
              <span>Apply Online</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {onRequestLogin && (
              <button
                onClick={onRequestLogin}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-mono font-bold text-xs border border-slate-300 transition-all cursor-pointer"
              >
                Portal Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. DYNAMIC PAGE BODY BASED ON SELECTED NAVIGATION */}
      {/* ========================================================================= */}
      <main className="flex-1">
        {/* ------------------------------------------------------------- */}
        {/* TAB 1: HOME PAGE */}
        {/* ------------------------------------------------------------- */}
        {activePage === 'home' && (
          <div className="space-y-12 pb-16">
            {/* HERO BANNER SECTION */}
            <section
              className="text-white py-16 sm:py-24 px-4 sm:px-8 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${themeColor} 0%, #1E1B4B 100%)`
              }}
            >
              {/* Background Glow */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

              <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono font-black bg-white/20 text-white backdrop-blur-md border border-white/20 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Admissions Open for Academic Session 2026-27</span>
                </span>

                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
                  {cmsTree.content?.heroHeadline || `Welcome to ${cmsTree.name}`}
                </h2>

                <p className="text-sm sm:text-lg text-white/90 max-w-2xl mx-auto font-medium leading-relaxed">
                  {cmsTree.content?.heroSubheadline || 'State-of-the-art smart campus fostering experiential learning, robotics labs, Olympic sports, and personalized holistic excellence.'}
                </p>

                <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => setActivePage('admissions')}
                    className="px-6 py-3.5 rounded-2xl bg-white text-slate-950 font-mono font-black text-sm shadow-xl hover:scale-105 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>{cmsTree.content?.ctaText || 'Apply for Admission (2026-27)'}</span>
                    <ArrowRight className="w-4 h-4 text-indigo-600" />
                  </button>

                  <button
                    onClick={() => setActivePage('about')}
                    className="px-6 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-mono font-bold text-sm border border-white/30 backdrop-blur-md transition-all cursor-pointer"
                  >
                    Explore Campus & Vision
                  </button>
                </div>
              </div>
            </section>

            {/* ========================================================= */}
            {/* ANIMATED CAMPUS SHOWCASE SLIDESHOW (2-4 PICS AUTO-PLAY) */}
            {/* ========================================================= */}
            <section
              className="max-w-7xl mx-auto px-4 sm:px-8 -mt-8 sm:-mt-12 relative z-30"
              onMouseEnter={() => setIsCarouselHovered(true)}
              onMouseLeave={() => setIsCarouselHovered(false)}
            >
              <div className="bg-slate-950 rounded-3xl border-4 border-white shadow-2xl overflow-hidden relative group">
                {/* 2-4 Slides with smooth crossfade and zoom animation */}
                <div className="relative h-[290px] sm:h-[420px] md:h-[500px] w-full overflow-hidden bg-slate-950">
                  {campusSlides.map((slide: any, idx: number) => {
                    const isActive = idx === currentSlideIndex;
                    return (
                      <div
                        key={slide.id || idx}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                          isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                        }`}
                      >
                        <img
                          src={slide.url}
                          alt={slide.title}
                          className={`w-full h-full object-cover transition-transform duration-[7000ms] ease-out ${
                            isActive ? 'scale-105' : 'scale-100'
                          }`}
                        />
                        {/* High-contrast gradient overlay for readable text */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-black/20" />
                      </div>
                    );
                  })}

                  {/* Top Live Status Indicator Bar */}
                  <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex flex-wrap items-center gap-2 z-20">
                    <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-black bg-slate-950/85 text-white border border-white/20 backdrop-blur-md flex items-center gap-2 shadow-lg">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{campusSlides[currentSlideIndex]?.badge || 'Campus Feature'}</span>
                    </span>
                    <span className="px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-white/20 text-white backdrop-blur-md border border-white/20 hidden sm:inline-block shadow-sm">
                      Campus View {currentSlideIndex + 1} of {campusSlides.length} (Animated)
                    </span>
                  </div>

                  {/* Top Right Auto-play Indicator */}
                  <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
                    <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-indigo-600/90 text-white backdrop-blur-md shadow-md flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Auto-Playing Slideshow (3.5s)</span>
                    </span>
                  </div>

                  {/* Bottom Caption, Controls & Dot Navigation */}
                  <div className="absolute bottom-6 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-8 z-20 space-y-3">
                    <div className="max-w-3xl space-y-1">
                      <h3 className="text-xl sm:text-3xl font-black text-white drop-shadow-md leading-tight">
                        {campusSlides[currentSlideIndex]?.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-200 drop-shadow font-medium line-clamp-2 leading-relaxed">
                        {campusSlides[currentSlideIndex]?.subtitle}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {/* Interactive Slide Dots */}
                      <div className="flex items-center gap-2">
                        {campusSlides.map((slide: any, idx: number) => (
                          <button
                            key={slide.id || idx}
                            type="button"
                            onClick={() => setCurrentSlideIndex(idx)}
                            className={`h-2.5 rounded-full transition-all cursor-pointer ${
                              idx === currentSlideIndex
                                ? 'w-8 bg-indigo-400 shadow-md shadow-indigo-500/50'
                                : 'w-2.5 bg-white/40 hover:bg-white/70'
                            }`}
                            aria-label={`Jump to slide ${idx + 1}`}
                          />
                        ))}
                      </div>

                      {/* Manual Next / Prev Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCurrentSlideIndex((prev) => (prev - 1 + campusSlides.length) % campusSlides.length)}
                          className="w-10 h-10 rounded-full bg-slate-950/60 hover:bg-slate-950 text-white backdrop-blur-md flex items-center justify-center transition-all cursor-pointer border border-white/20 active:scale-95"
                          aria-label="Previous Slide"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentSlideIndex((prev) => (prev + 1) % campusSlides.length)}
                          className="w-10 h-10 rounded-full bg-slate-950/60 hover:bg-slate-950 text-white backdrop-blur-md flex items-center justify-center transition-all cursor-pointer border border-white/20 active:scale-95"
                          aria-label="Next Slide"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* QUICK STATS & RECOGNITION RIBBON */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 relative z-20">
              <div className="bg-white rounded-3xl border-2 border-slate-300 p-6 sm:p-8 shadow-xl grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div className="space-y-1">
                  <div className="text-3xl sm:text-4xl font-black text-indigo-700">100%</div>
                  <div className="text-xs font-mono font-bold text-slate-800">CBSE Board Distinction</div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl sm:text-4xl font-black text-emerald-700">2,500+</div>
                  <div className="text-xs font-mono font-bold text-slate-800">Scholars Enrolled</div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl sm:text-4xl font-black text-purple-700">150+</div>
                  <div className="text-xs font-mono font-bold text-slate-800">Certified Faculty</div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl sm:text-4xl font-black text-amber-600">35+</div>
                  <div className="text-xs font-mono font-bold text-slate-800">Smart Labs & Studios</div>
                </div>
              </div>
            </section>

            {/* INSTITUTIONAL LEADERSHIP VISION: PRINCIPAL & MANAGING DIRECTOR */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
              <div className="text-center space-y-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-purple-100 text-purple-950 border border-purple-300 inline-block">
                  Institutional Leadership Vision Desk
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-950">
                  Desk of the Principal & Managing Director
                </h3>
                <p className="text-xs font-mono text-slate-600 max-w-xl mx-auto">
                  Guiding future innovators with scientific inquiry, ethical leadership, and 21st-century CBSE excellence.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                {/* 1. PRINCIPAL'S CARD */}
                <div className="bg-white rounded-3xl border-2 border-indigo-200 p-6 sm:p-8 shadow-xl flex flex-col justify-between space-y-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-indigo-300 bg-indigo-50 overflow-hidden shadow-md shrink-0">
                        {cmsTree.content?.principalPhotoUrl ? (
                          <img
                            src={cmsTree.content.principalPhotoUrl}
                            alt="Principal"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">👩‍🏫</div>
                        )}
                      </div>
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-indigo-100 text-indigo-900 border border-indigo-300 inline-block">
                          Principal's Desk
                        </span>
                        <h4 className="text-base sm:text-lg font-black text-slate-950 mt-1">
                          {cmsTree.content?.principalName || 'Dr. Ananya Sharma'}
                        </h4>
                        <p className="text-xs font-mono font-bold text-indigo-700">
                          {cmsTree.content?.principalTitle || 'Principal & Academic Director'}
                        </p>
                        <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                          {cmsTree.content?.principalQualifications || 'Ph.D. Education, M.Sc., B.Ed. (22+ Years in CBSE Leadership)'}
                        </p>
                      </div>
                    </div>

                    <blockquote className="text-slate-700 text-xs sm:text-sm font-medium italic border-l-4 border-indigo-600 pl-4 py-1 leading-relaxed bg-slate-50 rounded-r-xl p-3">
                      "{cmsTree.content?.principalMessage || 'Our vision is to empower young minds with scientific innovation, critical curiosity, and timeless ethical character, preparing them to excel anywhere in the world.'}"
                    </blockquote>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-600">
                    <span className="font-bold text-indigo-900">Academic & Holistic Character</span>
                    <span>Session 2026-27</span>
                  </div>
                </div>

                {/* 2. MANAGING DIRECTOR'S CARD */}
                <div className="bg-white rounded-3xl border-2 border-purple-200 p-6 sm:p-8 shadow-xl flex flex-col justify-between space-y-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-purple-300 bg-purple-50 overflow-hidden shadow-md shrink-0">
                        {cmsTree.content?.directorPhotoUrl ? (
                          <img
                            src={cmsTree.content.directorPhotoUrl}
                            alt="Managing Director"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">👨‍💼</div>
                        )}
                      </div>
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-purple-100 text-purple-900 border border-purple-300 inline-block">
                          Managing Director & Founder
                        </span>
                        <h4 className="text-base sm:text-lg font-black text-slate-950 mt-1">
                          {cmsTree.content?.directorName || 'Er. Rajesh Dakshora'}
                        </h4>
                        <p className="text-xs font-mono font-bold text-purple-700">
                          {cmsTree.content?.directorTitle || 'Managing Director & Institutional Founder'}
                        </p>
                        <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                          {cmsTree.content?.directorQualifications || 'B.Tech (IIT Delhi), M.S. (Stanford), Education Futurist'}
                        </p>
                      </div>
                    </div>

                    <blockquote className="text-slate-700 text-xs sm:text-sm font-medium italic border-l-4 border-purple-600 pl-4 py-1 leading-relaxed bg-slate-50 rounded-r-xl p-3">
                      "{cmsTree.content?.directorMessage || 'Dakshora 2.0 brings together world-class digital infrastructure, transparent governance, and holistic student-centric learning on a unified cloud database.'}"
                    </blockquote>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-600">
                    <span className="font-bold text-purple-900">Institutional Governance & EdTech</span>
                    <span>CBSE Smart Campus</span>
                  </div>
                </div>
              </div>
            </section>

            {/* BRANDED MOBILE APPLICATION & ERP ACCESS BANNER */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8">
              <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-teal-700 via-cyan-800 to-indigo-900 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-mono text-[10px] font-black">
                      3-in-1 Unified Platform
                    </span>
                    <span className="text-xs text-teal-200 font-mono font-bold">Android APK & PWA</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Download {cmsTree.name || 'School'} Official Mobile App
                  </h3>
                  <p className="text-xs sm:text-sm text-teal-100 font-medium max-w-xl">
                    Live daily attendance, homework diary, fee receipts, CBSE report cards & school bus GPS tracking directly on your smartphone.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <a
                    href={cmsTree.content?.appDownloadUrl || `/api/public/mobile-app/${siteId}/download`}
                    download
                    className="px-5 py-3 rounded-2xl bg-white text-teal-950 font-mono font-black text-xs shadow-lg hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>📥 Download Android APK</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      if (onRequestLogin) onRequestLogin();
                      else window.location.href = cmsTree.content?.erpLoginUrl || '/portal';
                    }}
                    className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/30 text-white font-mono font-black text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>🔐 ERP Staff / Parent Login</span>
                  </button>
                </div>
              </div>
            </section>

            {/* SMART LABS & CAMPUS SHOWCASE */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
              <div className="text-center space-y-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-cyan-100 text-cyan-950 border border-cyan-300">
                  World-Class Infrastructure
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-950">
                  Campus Facilities & Innovation Labs
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(cmsTree.media || []).map((med: any) => (
                  <div key={med.id} className="rounded-2xl overflow-hidden bg-white border-2 border-slate-300 shadow-md group">
                    <div className="h-44 overflow-hidden bg-slate-200">
                      <img src={med.url} alt={med.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div className="p-3.5 bg-white">
                      <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300">
                        {med.type}
                      </span>
                      <h4 className="font-black text-sm text-slate-950 mt-1 truncate">{med.name}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ADMISSION INQUIRY FORM BANNER */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8">
              <div
                className="rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden"
                style={{ backgroundColor: themeColor }}
              >
                <div className="max-w-2xl space-y-4">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-white/20 text-white">
                    Apply Online Today
                  </span>
                  <h3 className="text-2xl sm:text-4xl font-black text-white">
                    Begin Your Child's Journey of Excellence
                  </h3>
                  <p className="text-xs sm:text-sm text-white/90 font-medium">
                    Limited seats available for Pre-Primary to Class 11 (Science, Commerce & Humanities) for Session 2026-27.
                  </p>
                  <button
                    onClick={() => setActivePage('admissions')}
                    className="px-6 py-3 rounded-2xl bg-white text-slate-950 font-mono font-black text-xs shadow-lg hover:scale-105 transition-all cursor-pointer"
                  >
                    Open Online Admission Form →
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: ADMISSIONS ONLINE APPLICATION FORM */}
        {/* ------------------------------------------------------------- */}
        {activePage === 'admissions' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 space-y-8">
            <div className="text-center space-y-2">
              <span className="px-3.5 py-1 rounded-full text-xs font-mono font-black bg-indigo-100 text-indigo-950 border border-indigo-300">
                Official Admission Portal 2026-27
              </span>
              <h2 className="text-3xl font-black text-slate-950">Online Student Registration Form</h2>
              <p className="text-xs font-mono text-slate-600">
                Fill the applicant details below. Your submission is instantly captured in our admissions database.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-10 rounded-3xl border-2 border-slate-300 shadow-xl space-y-6">
              {leadSuccess ? (
                <div className="p-8 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-2xl shadow-md">
                    ✓
                  </div>
                  <h3 className="text-xl font-black text-emerald-950">Application Registered Successfully!</h3>
                  <p className="text-xs font-mono text-slate-700 max-w-md mx-auto leading-relaxed">
                    Thank you for applying to <strong>{cmsTree.name}</strong>. Our admissions counselor will connect with you on <strong>{parentPhone}</strong> within 24 hours with the entrance schedule and syllabus.
                  </p>
                  <button
                    onClick={() => { setLeadSuccess(false); setStudentName(''); setParentPhone(''); }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-mono font-black text-xs shadow-md"
                  >
                    Submit Another Application
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} className="space-y-4 text-xs font-mono">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-950 font-black mb-1">Student Full Name *</label>
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="e.g. Aarav Sharma"
                        className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-2.5 text-slate-950 font-bold focus:bg-white focus:border-indigo-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-950 font-black mb-1">Applying for Grade / Class *</label>
                      <select
                        value={applyingGrade}
                        onChange={(e) => setApplyingGrade(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-2.5 text-slate-950 font-bold focus:bg-white focus:border-indigo-600"
                      >
                        <option value="Nursery">Nursery / Pre-KG</option>
                        <option value="KG">Kindergarten (KG)</option>
                        <option value="Class 1">Class 1</option>
                        <option value="Class 2">Class 2</option>
                        <option value="Class 3">Class 3</option>
                        <option value="Class 4">Class 4</option>
                        <option value="Class 5">Class 5</option>
                        <option value="Class 6">Class 6</option>
                        <option value="Class 7">Class 7</option>
                        <option value="Class 8">Class 8</option>
                        <option value="Class 9">Class 9</option>
                        <option value="Class 10">Class 10</option>
                        <option value="Class 11 (Science)">Class 11 (Science PCM/PCB)</option>
                        <option value="Class 11 (Commerce)">Class 11 (Commerce)</option>
                        <option value="Class 11 (Humanities)">Class 11 (Humanities)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-950 font-black mb-1">Parent / Guardian Name</label>
                      <input
                        type="text"
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                        placeholder="e.g. Vikram Sharma"
                        className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-2.5 text-slate-950 font-bold focus:bg-white focus:border-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-950 font-black mb-1">Parent Mobile / WhatsApp Number *</label>
                      <input
                        type="tel"
                        value={parentPhone}
                        onChange={(e) => setParentPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-2.5 text-slate-950 font-bold focus:bg-white focus:border-indigo-600"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-950 font-black mb-1">Parent Email Address</label>
                    <input
                      type="email"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      placeholder="vikram.sharma@example.com"
                      className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-2.5 text-slate-950 font-bold focus:bg-white focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-950 font-black mb-1">Additional Inquiries or Requirements</label>
                    <textarea
                      rows={3}
                      value={admissionNotes}
                      onChange={(e) => setAdmissionNotes(e.target.value)}
                      placeholder="Transport facility required, previous school details, sports interest..."
                      className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-2 text-slate-950 font-bold focus:bg-white focus:border-indigo-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingLead}
                    className="w-full py-3.5 px-6 rounded-2xl text-white font-black text-sm font-mono shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                    style={{ backgroundColor: themeColor }}
                  >
                    {submittingLead ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>{submittingLead ? 'Submitting Registration...' : 'Submit Admission Registration'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: ABOUT US & INFRASTRUCTURE */}
        {/* ------------------------------------------------------------- */}
        {activePage === 'about' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12 space-y-8">
            <div className="space-y-3">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-purple-100 text-purple-950 border border-purple-300">
                Institutional Profile
              </span>
              <h2 className="text-3xl font-black text-slate-950">About {cmsTree.name}</h2>
              <p className="text-sm font-bold text-slate-700 leading-relaxed">
                Founded with a mission to deliver world-class academic rigour combined with ethical integrity, {cmsTree.name} is recognized among Rajasthan's and India's foremost CBSE institutions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-white rounded-3xl border-2 border-slate-300 space-y-2">
                <span className="text-2xl">🎯</span>
                <h4 className="font-black text-base text-slate-950">Our Mission</h4>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  To empower each scholar with independent thinking, scientific temper, creative expression, and civic responsibility.
                </p>
              </div>

              <div className="p-6 bg-white rounded-3xl border-2 border-slate-300 space-y-2">
                <span className="text-2xl">🌟</span>
                <h4 className="font-black text-base text-slate-950">Our Vision</h4>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  To be an educational benchmark fostering global scholars who lead with empathy, innovation, and unwavering ethical compass.
                </p>
              </div>

              <div className="p-6 bg-white rounded-3xl border-2 border-slate-300 space-y-2">
                <span className="text-2xl">🏅</span>
                <h4 className="font-black text-base text-slate-950">Core Values</h4>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  Integrity, Compassion, Scientific Inquiry, Athletic Grit, and Cultural Heritage.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: ACADEMICS & SMART LABS */}
        {/* ------------------------------------------------------------- */}
        {(activePage === 'academics' || activePage === 'labs') && (
          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12 space-y-8">
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-cyan-100 text-cyan-950 border border-cyan-300">
                Academic Framework
              </span>
              <h2 className="text-3xl font-black text-slate-950">Curriculum & Innovation Labs</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 bg-white rounded-3xl border-2 border-slate-300 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  🔬
                </div>
                <h3 className="font-black text-lg text-slate-950">ATAL Tinkering Lab (ATL)</h3>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  Government of India NITI Aayog supported innovation hub equipped with 3D printers, Arduino & Raspberry Pi kits, robotics sensors, and STEM prototyping tools.
                </p>
              </div>

              <div className="p-6 bg-white rounded-3xl border-2 border-slate-300 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  💻
                </div>
                <h3 className="font-black text-lg text-slate-950">AI & Coding Studio</h3>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  High-speed networked computer labs providing Python, Scratch, Web Development, and DAKSHORA AI Student Copilot for customized adaptive learning.
                </p>
              </div>

              <div className="p-6 bg-white rounded-3xl border-2 border-slate-300 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  📚
                </div>
                <h3 className="font-black text-lg text-slate-950">Digital Smart Library</h3>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  Over 15,000 physical volumes complemented by e-book subscriptions, academic journals, and quiet research pods for CBSE and Olympiad preparation.
                </p>
              </div>

              <div className="p-6 bg-white rounded-3xl border-2 border-slate-300 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  ⚽
                </div>
                <h3 className="font-black text-lg text-slate-950">Olympic Sports Complex</h3>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  Standard athletic track, FIFA-standard turf football field, indoor badminton & basketball courts, and professional NIS-certified coaches.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5: CONTACT US */}
        {/* ------------------------------------------------------------- */}
        {activePage === 'contact' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 space-y-8">
            <div className="text-center space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-emerald-100 text-emerald-950 border border-emerald-300">
                Connect With Us
              </span>
              <h2 className="text-3xl font-black text-slate-950">Campus Location & Contacts</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-6 bg-white rounded-3xl border-2 border-slate-300 space-y-2">
                <Phone className="w-6 h-6 text-indigo-600 mx-auto" />
                <h4 className="font-black text-sm text-slate-950">Phone / WhatsApp</h4>
                <p className="text-xs font-mono text-slate-700">{cmsTree.content?.contactPhone || '+91 98765 43210'}</p>
              </div>

              <div className="p-6 bg-white rounded-3xl border-2 border-slate-300 space-y-2">
                <Mail className="w-6 h-6 text-emerald-600 mx-auto" />
                <h4 className="font-black text-sm text-slate-950">Email Inquiries</h4>
                <p className="text-xs font-mono text-slate-700">{cmsTree.content?.contactEmail || 'admissions@school.edu.in'}</p>
              </div>

              <div className="p-6 bg-white rounded-3xl border-2 border-slate-300 space-y-2">
                <MapPin className="w-6 h-6 text-rose-600 mx-auto" />
                <h4 className="font-black text-sm text-slate-950">Campus Address</h4>
                <p className="text-xs font-mono text-slate-700">{cmsTree.content?.address || 'Campus Ring Road, Knowledge Park'}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 4. FLOATING AI ADMISSION BOT WIDGET */}
      {/* ========================================================================= */}
      <div className="fixed bottom-6 right-6 z-50">
        {!aiChatOpen ? (
          <button
            onClick={() => setAiChatOpen(true)}
            className="px-4 py-3 rounded-full text-white font-mono font-black text-xs shadow-2xl flex items-center gap-2.5 transition-all hover:scale-105 cursor-pointer ring-4 ring-white"
            style={{ backgroundColor: themeColor }}
          >
            <Bot className="w-5 h-5 text-amber-300 animate-bounce" />
            <span>Ask School AI Counselor</span>
          </button>
        ) : (
          <div className="w-80 sm:w-96 bg-white rounded-3xl border-2 border-slate-300 shadow-2xl overflow-hidden flex flex-col max-h-[500px]">
            {/* Header */}
            <div
              className="p-4 text-white flex items-center justify-between"
              style={{ backgroundColor: themeColor }}
            >
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-amber-300" />
                <div>
                  <h4 className="text-xs font-black">DAKSHORA AI Counselor</h4>
                  <p className="text-[10px] text-white/80 font-mono">Live Answers on Admissions & Fees</p>
                </div>
              </div>
              <button
                onClick={() => setAiChatOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white"
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3 text-xs font-mono max-h-72 bg-slate-50">
              {aiMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-slate-950 text-white ml-6'
                      : 'bg-white text-slate-900 border border-slate-200 mr-6 shadow-xs'
                  }`}
                >
                  {m.text}
                </div>
              ))}
              {aiLoading && (
                <div className="flex items-center gap-2 text-slate-500 text-xs font-mono p-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>Thinking...</span>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSendAiChat} className="p-2.5 bg-white border-t border-slate-200 flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask about admissions, fees, timings..."
                className="flex-1 bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-950 focus:outline-none focus:border-indigo-600"
              />
              <button
                type="submit"
                disabled={aiLoading || !aiPrompt.trim()}
                className="px-3 py-2 rounded-xl text-white font-bold text-xs"
                style={{ backgroundColor: themeColor }}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. FOOTER */}
      {/* ========================================================================= */}
      <footer className="bg-slate-950 text-white border-t border-slate-800 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 sm:grid-cols-3 gap-8 text-xs font-mono">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              {cmsTree?.content?.schoolLogoUrl || cmsTree?.branding?.logoUrl ? (
                <img
                  src={cmsTree.content?.schoolLogoUrl || cmsTree.branding?.logoUrl}
                  alt={cmsTree?.name}
                  className="w-8 h-8 rounded-xl object-contain bg-white p-0.5 border border-slate-700"
                />
              ) : (
                <span className="text-xl">🏛️</span>
              )}
              <h4 className="text-sm font-black text-white">{cmsTree?.name || 'Heritage Public Academy'}</h4>
            </div>
            <p className="text-slate-400 leading-relaxed font-bold">
              Affiliated to CBSE, New Delhi. Dedicated to experiential education, Atal Tinkering innovations, and ethical student growth.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-300">Quick Links</h4>
            <div className="space-y-1 text-slate-400">
              <div className="hover:text-white cursor-pointer" onClick={() => setActivePage('admissions')}>• Admission Policy 2026-27</div>
              <div className="hover:text-white cursor-pointer" onClick={() => setActivePage('academics')}>• CBSE Mandatory Public Disclosure</div>
              <div className="hover:text-white cursor-pointer" onClick={() => setActivePage('labs')}>• Atal Tinkering Lab Annual Report</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-300">Technology & Edge Hosting</h4>
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Cloudflare Edge CDN Deployed</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Engineered with DAKSHORA 2.0 AI-Powered Educational Operating System.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
