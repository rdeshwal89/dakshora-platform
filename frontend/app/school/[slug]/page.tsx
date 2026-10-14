"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface SchoolInfo {
  id: string;
  name: string;
  slug: string;
  board: string;
  city: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  logoUrl: string | null;
  affiliationNumber?: string;
}

export default function SchoolPublicPage() {
  const params = useParams();
  const slugParam = (params?.slug as string) || "new-ideal-public-school";

  const [activeSection, setActiveSection] = useState("home");
  const [lang, setLang] = useState<"en" | "hi">("en");
  const isHi = lang === "hi";

  const [school, setSchool] = useState<SchoolInfo>({
    id: "87be8580-89af-4d9c-952b-73a02a9eae82",
    name: "New Ideal Public School",
    slug: "new-ideal-public-school",
    board: "CBSE",
    city: "Mathura",
    address: "Shankar Gali Dauli Pyau, Mathura, Uttar Pradesh - 281001",
    contactPhone: "+91 8529575588",
    contactEmail: "info@dpsheritage.edu.in",
    logoUrl: null,
    affiliationNumber: "CBSE-AFF-2130894",
  });

  const [submittingAdm, setSubmittingAdm] = useState(false);
  const [admSubmitted, setAdmSubmitted] = useState(false);
  const [admError, setAdmError] = useState("");
  const [admForm, setAdmForm] = useState({
    studentName: "",
    grade: "Class 1",
    parentName: "",
    phone: "",
    email: "",
    city: "Mathura",
  });

  useEffect(() => {
    // Dynamic page title
    document.title = `${school.name} | Official School Website`;

    // Attempt to fetch fresh CMS data
    fetch(`/api/public/schools/${encodeURIComponent(slugParam)}/cms`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data.school) {
          setSchool((prev) => ({
            ...prev,
            ...data.school,
            address: data.school.address || prev.address,
            contactPhone: data.school.contactPhone || prev.contactPhone,
            affiliationNumber: data.school.affiliationNumber || prev.affiliationNumber || "CBSE-AFF-2130894",
          }));
          document.title = `${data.school.name} | Official School Website`;
        }
      })
      .catch(() => {});
  }, [slugParam, school.name]);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admForm.studentName.trim() || !admForm.phone.trim()) {
      setAdmError("Please provide student name and mobile number.");
      return;
    }
    setSubmittingAdm(true);
    setAdmError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: admForm.parentName || admForm.studentName,
          school_name: school.name,
          phone: admForm.phone,
          email: admForm.email || "admission@parent.in",
          city: admForm.city || school.city,
          role: "Parent",
          source: "school_dedicated_website_admission",
          message: `Admission Inquiry for ${admForm.studentName} (${admForm.grade}) at ${school.name}`,
        }),
      });
      if (res.ok) {
        setAdmSubmitted(true);
      } else {
        const d = await res.json().catch(() => null);
        setAdmError(d?.message || "Failed to submit admission inquiry. Please call us directly.");
      }
    } catch {
      setAdmError("Network error. Please call our admission desk directly at " + school.contactPhone);
    } finally {
      setSubmittingAdm(false);
    }
  };

  const apkUrl = "/assets/mobile/newidealpublicschool-parentapp-v2.0.0.apk";
  const erpPortalUrl = `/portal?school=${encodeURIComponent(school.slug)}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* 1. TOP ANNOUNCEMENT & CONTACT BAR */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white px-4 py-2.5 text-xs border-b border-indigo-800/50">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider animate-pulse">
              ADMISSIONS OPEN 2026-27
            </span>
            <span className="font-semibold text-indigo-100">
              {school.board} Affiliated ({school.affiliationNumber}) • {school.city} Campus
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-indigo-200">
            <a href={`tel:${school.contactPhone}`} className="hover:text-white transition-colors flex items-center gap-1">
              <span>📞</span>
              <span>{school.contactPhone}</span>
            </a>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">✉️ {school.contactEmail}</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER & NAVIGATION */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo & School Name */}
          <div
            onClick={() => scrollTo("home")}
            className="flex items-center gap-3.5 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-500/25 shrink-0 group-hover:scale-105 transition-transform">
              {school.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">
                {school.name}
              </h1>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                {school.board} Affiliated • {school.city} • Official Campus
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { id: "home", label: isHi ? "होम" : "Home" },
              { id: "about", label: isHi ? "परिचय" : "About Us" },
              { id: "academics", label: isHi ? "शिक्षा" : "Academics" },
              { id: "facilities", label: isHi ? "लैब्स व सुविधाएं" : "Smart Labs & Facilities" },
              { id: "notices", label: isHi ? "सूचना पट्ट" : "Notice Board" },
              { id: "admissions", label: isHi ? "प्रवेश 2026-27" : "Admissions 2026-27" },
              { id: "contact", label: isHi ? "संपर्क" : "Contact Us" },
            ].map((nav) => (
              <button
                key={nav.id}
                onClick={() => scrollTo(nav.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSection === nav.id
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {nav.label}
              </button>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setLang(isHi ? "en" : "hi")}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs cursor-pointer transition-colors"
            >
              {isHi ? "🇬🇧 EN" : "🇮🇳 हिंदी"}
            </button>
            <a
              href={apkUrl}
              download
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <span>📱</span>
              <span>Parent App</span>
            </a>
            <a
              href={erpPortalUrl}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
            >
              ERP Login →
            </a>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION */}
      <section
        id="home"
        className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-cyan-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{school.board} AFFILIATED INSTITUTION • {school.city.toUpperCase()}</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
              Welcome to {school.name}
            </h2>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              Fostering Academic Excellence, Smart Classrooms, Robotics, STEM Labs & Holistic Character Building in Mathura.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={() => scrollTo("admissions")}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:brightness-110 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition-all cursor-pointer"
              >
                🎓 Apply for Admission 2026-27
              </button>
              <a
                href={apkUrl}
                download
                className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 border border-emerald-400 text-white font-bold text-sm shadow-xl shadow-emerald-600/25 transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <span>📥</span>
                <span>Download Parent App (v2.0.0 APK)</span>
              </a>
              <a
                href={erpPortalUrl}
                className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold text-sm transition-all cursor-pointer"
              >
                🔐 Staff / Student ERP Login
              </a>
            </div>

            {/* Quick Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6">
              {[
                { val: "100%", lbl: "CBSE Board Result" },
                { val: "Smart", lbl: "Digital Classrooms" },
                { val: "GPS", lbl: "Safe School Buses" },
                { val: "24×7", lbl: "Parent Mobile App" },
              ].map((st, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
                >
                  <div className="text-xl font-black text-cyan-300">{st.val}</div>
                  <div className="text-xs text-slate-300 font-medium">{st.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-3xl overflow-hidden border-2 border-white/15 shadow-2xl bg-slate-900/80 p-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-3xl">
                🏫
              </div>
              <div className="space-y-2">
                <div className="text-xs font-mono uppercase text-cyan-400 font-bold">
                  Official Mathura Campus
                </div>
                <div className="text-xl font-black text-white">{school.name}</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  📍 {school.address}
                </p>
                <p className="text-xs font-mono text-indigo-300">
                  Affiliation No: <strong>{school.affiliationNumber}</strong>
                </p>
                <p className="text-xs font-mono text-indigo-300">
                  Helpline: <strong>{school.contactPhone}</strong>
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Nursery to Class XII</span>
                <span className="text-emerald-400 font-bold">● Admissions Open</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MOBILE APP DOWNLOAD SHOWCASE */}
      <section className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-950 text-white py-12 px-4 sm:px-6 lg:px-8 border-y border-emerald-800/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase font-mono">
              <span>📱</span> Official School Android Application
            </div>
            <h3 className="text-2xl sm:text-3xl font-black">
              Download {school.name} Parent App
            </h3>
            <p className="text-xs sm:text-sm text-emerald-200 max-w-xl">
              Track live daily attendance, homework assignments, fees receipts, circulars, report cards & school bus GPS tracking directly on your mobile.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <a
              href={apkUrl}
              download
              className="px-6 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/30 transition-all flex items-center gap-2.5 cursor-pointer"
            >
              <span className="text-lg">📥</span>
              <div className="text-left">
                <div className="text-xs uppercase tracking-wider font-extrabold">Direct Android Download</div>
                <div className="text-sm font-black">Download APK v2.0.0 (1.87 MB)</div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* 5. NOTICE BOARD & CIRCULARS */}
      <section id="notices" className="py-12 px-4 sm:px-6 lg:px-8 bg-indigo-50/70 border-b border-indigo-100">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-black uppercase">
                📢 Notice Board
              </span>
              <h3 className="text-xl font-black text-slate-900">
                Latest Circulars & Campus Announcements
              </h3>
            </div>
            <span className="text-xs font-mono text-indigo-700 font-bold">
              Academic Session 2026-27
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                id: 1,
                tag: "Admissions 2026-27",
                title: `Registration Open for Academic Session 2026-27`,
                body: "Registration and admission forms for Pre-Primary to Class XII are available online and at the school reception desk in Mathura.",
              },
              {
                id: 2,
                tag: "Digital Campus",
                title: "Launch of Official Parent Mobile App v2.0.0",
                body: `Parents can now download the official ${school.name} App to access daily attendance, homework, report cards, and fee receipts.`,
              },
              {
                id: 3,
                tag: "Curriculum & Labs",
                title: "STEM Robotics & Smart Science Lab Orientation",
                body: "Interactive hands-on robotics and coding sessions scheduled for students from Class VI onwards in our state-of-the-art campus lab.",
              },
            ].map((n) => (
              <div
                key={n.id}
                className="p-5 rounded-2xl bg-white border border-indigo-100 shadow-sm space-y-2 hover:shadow-md transition-shadow"
              >
                <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded">
                  {n.tag}
                </span>
                <h4 className="text-sm font-black text-slate-900">{n.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{n.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. ABOUT & PRINCIPAL DESK */}
      <section id="about" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-5">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase">
              About Our Institution & Leadership
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
              Principal's Desk — {school.name}
            </h3>
            <blockquote className="p-5 rounded-2xl bg-white border-l-4 border-indigo-600 shadow-sm text-slate-700 italic text-sm sm:text-base leading-relaxed">
              "Our mission is to empower every child with modern scientific inquiry, strong moral values, disciplined character, and CBSE-aligned academic excellence to lead the future."
            </blockquote>
            <p className="text-sm text-slate-600 leading-relaxed">
              Located in the heart of Mathura at Shankar Gali Dauli Pyau, {school.name} provides a nurturing environment where children discover their highest potential. With smart digital classrooms, robotics labs, sports grounds, and dedicated faculty, we bridge traditional values with 21st-century education.
            </p>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-3xl bg-indigo-900 text-white shadow-xl space-y-4">
              <div className="text-xs font-mono uppercase text-amber-300 font-bold">
                Institution Fast Facts
              </div>
              <ul className="space-y-3 text-xs">
                <li className="flex items-center justify-between border-b border-indigo-800 pb-2">
                  <span className="text-indigo-200">Affiliation:</span>
                  <span className="font-bold">{school.board} (CBSE-AFF-2130894)</span>
                </li>
                <li className="flex items-center justify-between border-b border-indigo-800 pb-2">
                  <span className="text-indigo-200">School Code:</span>
                  <span className="font-bold">2026100001</span>
                </li>
                <li className="flex items-center justify-between border-b border-indigo-800 pb-2">
                  <span className="text-indigo-200">Campus City:</span>
                  <span className="font-bold">{school.city}, Uttar Pradesh</span>
                </li>
                <li className="flex items-center justify-between border-b border-indigo-800 pb-2">
                  <span className="text-indigo-200">Medium of Instruction:</span>
                  <span className="font-bold">English & Hindi</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-indigo-200">Session:</span>
                  <span className="font-bold">2026 - 2027</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 7. ACADEMICS & SMART LABS */}
      <section id="academics" className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-100 border-t border-slate-200">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-black uppercase">
              Academic Excellence
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
              Curriculum & Modern Infrastructure
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Comprehensive holistic education aligned with CBSE guidelines and NEP 2020.
            </p>
          </div>

          <div id="facilities" className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "🤖",
                title: "AI & Robotics Innovation Lab",
                desc: "Hands-on robotics kits, sensors, STEM projects, and early programming logic for students from Class VI onwards.",
              },
              {
                icon: "💻",
                title: "Digital Coding & Computer Arena",
                desc: "High-speed networked computer lab equipped with coding workstations, internet access, and interactive learning tools.",
              },
              {
                icon: "🔬",
                title: "Integrated Science Laboratories",
                desc: "Equipped Physics, Chemistry, and Biology practical labs encouraging experiential learning and CBSE practical examinations.",
              },
              {
                icon: "📚",
                title: "Knowledge Resource Library",
                desc: "Rich collection of academic reference books, encyclopedia, periodicals, fiction, and competitive exam guidance material.",
              },
              {
                icon: "🚌",
                title: "Safe Transport & GPS Buses",
                desc: "Fleet of school buses covering all major neighborhoods across Mathura with verified drivers, conductors, and GPS tracking.",
              },
              {
                icon: "🎯",
                title: "Sports, Yoga & Cultural Arena",
                desc: "Comprehensive physical education including cricket, volleyball, badminton, yoga sessions, and annual cultural celebrations.",
              },
            ].map((fac, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="text-3xl">{fac.icon}</div>
                <h4 className="text-base font-black text-slate-900">{fac.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{fac.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. ADMISSION INQUIRY FORM */}
      <section id="admissions" className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white p-6 sm:p-8 text-center space-y-2">
            <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase">
              Academic Session 2026-27
            </span>
            <h3 className="text-2xl sm:text-3xl font-black">
              Online Admission Inquiry Form
            </h3>
            <p className="text-xs sm:text-sm text-indigo-100 max-w-lg mx-auto">
              Submit your inquiry below. Our admissions desk at {school.name} will contact you with admission details and fee structure.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {admSubmitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto">
                  ✓
                </div>
                <h4 className="text-xl font-black text-slate-900">
                  Admission Inquiry Submitted Successfully!
                </h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Thank you! The admission desk at {school.name} has received your details and will call you at <strong>{admForm.phone}</strong> shortly.
                </p>
                <button
                  onClick={() => {
                    setAdmSubmitted(false);
                    setAdmForm({
                      studentName: "",
                      grade: "Class 1",
                      parentName: "",
                      phone: "",
                      email: "",
                      city: "Mathura",
                    });
                  }}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
                >
                  Submit Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleAdmissionSubmit} className="space-y-4">
                {admError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    {admError}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Student Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={admForm.studentName}
                      onChange={(e) => setAdmForm({ ...admForm, studentName: e.target.value })}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Grade / Class Applying For *
                    </label>
                    <select
                      value={admForm.grade}
                      onChange={(e) => setAdmForm({ ...admForm, grade: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                    >
                      {[
                        "Nursery",
                        "LKG",
                        "UKG",
                        "Class 1",
                        "Class 2",
                        "Class 3",
                        "Class 4",
                        "Class 5",
                        "Class 6",
                        "Class 7",
                        "Class 8",
                        "Class 9",
                        "Class 10",
                        "Class 11 (Science)",
                        "Class 11 (Commerce)",
                        "Class 11 (Humanities)",
                        "Class 12",
                      ].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Parent / Guardian Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={admForm.parentName}
                      onChange={(e) => setAdmForm({ ...admForm, parentName: e.target.value })}
                      placeholder="e.g. Rajesh Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      10-Digit Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={admForm.phone}
                      onChange={(e) => setAdmForm({ ...admForm, phone: e.target.value })}
                      placeholder="9876543210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Parent Email Address
                    </label>
                    <input
                      type="email"
                      value={admForm.email}
                      onChange={(e) => setAdmForm({ ...admForm, email: e.target.value })}
                      placeholder="parent@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingAdm}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:brightness-110 text-white font-black text-xs shadow-lg shadow-indigo-500/20 cursor-pointer transition-all disabled:opacity-50"
                >
                  {submittingAdm ? "Submitting Inquiry..." : "Submit Online Admission Inquiry →"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 9. FOOTER & CONTACT */}
      <footer id="contact" className="bg-slate-950 text-slate-300 py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <div className="text-lg font-black text-white">{school.name}</div>
            <p className="text-xs text-slate-400">
              {school.board} Affiliated ({school.affiliationNumber}) • {school.city} Campus
            </p>
            <p className="text-xs text-slate-400">📍 {school.address}</p>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="font-bold text-white uppercase font-mono">Contact & Helpline</div>
            <div>📞 Phone: {school.contactPhone}</div>
            <div>✉️ Email: {school.contactEmail}</div>
            <div>🏫 School Code: 2026100001</div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="font-bold text-white uppercase font-mono">Quick Access</div>
            <div className="flex flex-wrap gap-2">
              <a
                href={erpPortalUrl}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold cursor-pointer"
              >
                School ERP Login
              </a>
              <a
                href={apkUrl}
                download
                className="px-3 py-1.5 rounded-lg bg-emerald-600/60 hover:bg-emerald-600 text-white font-semibold cursor-pointer"
              >
                Download App (.apk)
              </a>
              <button
                onClick={() => scrollTo("admissions")}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold cursor-pointer"
              >
                Apply Admission
              </button>
            </div>
            <p className="text-[11px] font-mono text-slate-500 pt-2">
              Official Institutional Campus Portal
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
