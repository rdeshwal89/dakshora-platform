import SolutionsConfigurator from "../components/SolutionsConfigurator";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-purple-500 selection:text-white">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white text-xs sm:text-sm font-medium py-2 px-4 text-center tracking-wide shadow-inner">
        🚀 DAKSHORA 2.0 • Unified School ERP, AI Ecosystem &amp; SaaS Cloud Platform Live
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-purple-500/20">
              D
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent">
                DAKSHORA
              </span>
              <span className="ml-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                2.0 Cloud
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <a href="#solutions" className="hover:text-purple-600 transition-colors">Solutions</a>
            <a href="#erp-features" className="hover:text-purple-600 transition-colors">School ERP</a>
            <a href="/portal/" className="text-purple-700 font-semibold hover:text-purple-900 transition-colors flex items-center gap-1">
              ERP Portal
              <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">LIVE</span>
            </a>
            <a href="#contact" className="hover:text-purple-600 transition-colors">Contact</a>
          </nav>

          <div className="flex items-center space-x-3">
            <a
              href="/portal/"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all shadow-sm"
            >
              School Portal
            </a>
            <a
              href="/portal/"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md shadow-purple-600/20"
            >
              Launch ERP
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.100),theme(colors.white))] opacity-70" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200 mb-6 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-purple-600"></span>
            Empowering Modern Educational Institutions &amp; MSMEs Across India
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            From Skills to Opportunities with{" "}
            <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
              DAKSHORA 2.0
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            The next-generation education operating system. Integrated School ERP, AI Academic Assistant, 
            Automated Admissions, Student &amp; Parent Portals, and Multi-Tenant SaaS Cloud.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#solutions"
              className="px-7 py-3.5 text-base font-semibold rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-600/30 hover:scale-[1.02]"
            >
              Explore Interactive Pricing &amp; Solutions
            </a>
            <a
              href="#erp-features"
              className="px-7 py-3.5 text-base font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-all shadow-sm hover:scale-[1.02]"
            >
              View School ERP Modules
            </a>
          </div>

          {/* Quick Metrics */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-white/80 border border-slate-200 shadow-sm backdrop-blur-sm">
              <div className="text-3xl font-black text-purple-600">17+</div>
              <div className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">ERP Modules Built</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/80 border border-slate-200 shadow-sm backdrop-blur-sm">
              <div className="text-3xl font-black text-indigo-600">100%</div>
              <div className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">Multi-Tenant Isolated</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/80 border border-slate-200 shadow-sm backdrop-blur-sm">
              <div className="text-3xl font-black text-blue-600">458/458</div>
              <div className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">Passed Test Suites</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/80 border border-slate-200 shadow-sm backdrop-blur-sm">
              <div className="text-3xl font-black text-emerald-600">99.9%</div>
              <div className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">Supabase SLA Target</div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Configurator */}
      <section id="solutions" className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SolutionsConfigurator />
        </div>
      </section>

      {/* School ERP Features Grid */}
      <section id="erp-features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-2">
              Full-Scale Operating System
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Complete School &amp; Campus Operations
            </h3>
            <p className="mt-4 text-slate-600 text-base sm:text-lg">
              Every critical department connected through a single unified data architecture with strict tenant isolation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-2xl mb-4">
                👨‍🏫
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">Staff &amp; Incharge Scope</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Granular teacher assignments, subject incharge scopes, timetable allocations, and automated substitution management.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl mb-4">
                📋
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">Academics &amp; Exams</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Class curricula, grading schemes, mark corrections, report card generation, and real-time GPA computations.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl mb-4">
                💳
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">Fee Management &amp; Receipts</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Automated demand generation, concessions, multi-mode collections, instant receipts, and reconciliation tracking.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mb-4">
                📱
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">Parent &amp; Student Portal</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Self-service mobile-friendly portal for grades, attendance, homework tracking, leave applications, and online payments.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl mb-4">
                📚
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">Library &amp; Transport</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Barcode cataloging, book issuance, reservations, fine calculation, route tracking, and vehicle maintenance logs.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-2xl mb-4">
                🤖
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">Dakshora AI Assistant</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Context-aware educational AI for lesson planning, student doubt clearing, automated communications, and performance analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                D
              </div>
              <span className="text-white font-bold text-lg">DAKSHORA 2.0</span>
            </div>
            <p className="text-sm text-center md:text-right">
              &copy; {new Date().getFullYear()} DAKSHORA Technologies. All rights reserved. Built for India with ❤️
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
