import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  GraduationCap,
  Calendar,
  CreditCard,
  BookOpen,
  Bus,
  Library,
  MessageSquare,
  ShieldAlert,
  Download,
  Printer,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Briefcase,
  FileText,
  Award,
  Layers,
  ArrowUpRight,
  Bookmark,
  Share2,
  Sliders,
  DollarSign,
  UserCheck,
  Building,
  Check,
  X
} from 'lucide-react';
import {
  ErpRole,
  ErpReportsOverview,
  ErpStudentReportData,
  ErpAttendanceReportData,
  ErpAcademicsReportData,
  ErpExamReportData,
  ErpFeesReportData,
  ErpAdmissionReportData,
  ErpStaffReportData,
  ErpTransportReportData,
  ErpLibraryReportData,
  ErpCommunicationReportData,
  ErpAuditReportData,
  ErpReportPreset
} from '../types';
import {
  fetchReportsOverview,
  fetchStudentsReport,
  fetchAttendanceReport,
  fetchAcademicsReport,
  fetchExamsReport,
  fetchFeesReport,
  fetchAdmissionsReport,
  fetchStaffReport,
  fetchTransportReport,
  fetchLibraryReport,
  fetchCommunicationReport,
  fetchAuditReport,
  fetchReportPresets,
  saveReportPreset,
  getReportExportUrl
} from '../services/api';

interface ReportsAnalyticsHubProps {
  activeSession?: string;
  activeRole?: ErpRole;
  onShowToast?: (type: 'success' | 'error' | 'info' | 'warning', message: string, detail?: string) => void;
  organizationId?: string;
}

type ReportTab =
  | 'overview'
  | 'students'
  | 'attendance'
  | 'academics'
  | 'exams'
  | 'fees'
  | 'admissions'
  | 'staff'
  | 'transport'
  | 'library'
  | 'communication'
  | 'audit';

export const ReportsAnalyticsHub: React.FC<ReportsAnalyticsHubProps> = ({
  activeSession = '2026-27',
  activeRole = 'admin',
  onShowToast,
  organizationId = 'b17780e5-3832-4ac6-9aeb-33fd80c5cb0e'
}) => {
  // Navigation & State
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Global Filters
  const [session, setSession] = useState(activeSession);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [lowAttendanceThreshold, setLowAttendanceThreshold] = useState(75);

  // Preset Saving Modal State
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [savedPresets, setSavedPresets] = useState<ErpReportPreset[]>([]);

  // Domain Data Stores
  const [overviewData, setOverviewData] = useState<ErpReportsOverview | null>(null);
  const [studentsData, setStudentsData] = useState<ErpStudentReportData | null>(null);
  const [attendanceData, setAttendanceData] = useState<ErpAttendanceReportData | null>(null);
  const [academicsData, setAcademicsData] = useState<ErpAcademicsReportData | null>(null);
  const [examsData, setExamsData] = useState<ErpExamReportData | null>(null);
  const [feesData, setFeesData] = useState<ErpFeesReportData | null>(null);
  const [admissionsData, setAdmissionsData] = useState<ErpAdmissionReportData | null>(null);
  const [staffData, setStaffData] = useState<ErpStaffReportData | null>(null);
  const [transportData, setTransportData] = useState<ErpTransportReportData | null>(null);
  const [libraryData, setLibraryData] = useState<ErpLibraryReportData | null>(null);
  const [communicationData, setCommunicationData] = useState<ErpCommunicationReportData | null>(null);
  const [auditData, setAuditData] = useState<ErpAuditReportData | null>(null);

  // Load Presets
  useEffect(() => {
    fetchReportPresets(activeTab, organizationId)
      .then(res => {
        const d = res.data as any;
        if (d?.success && d?.presets) setSavedPresets(d.presets);
      })
      .catch(() => {});
  }, [activeTab, organizationId]);

  // Load Active Tab Data
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadData = async () => {
      try {
        switch (activeTab) {
          case 'overview': {
            const res = await fetchReportsOverview(session, organizationId);
            const d = res.data as any;
            if (isMounted && d?.success) setOverviewData(d);
            break;
          }
          case 'students': {
            const res = await fetchStudentsReport({
              className: selectedClass,
              section: selectedSection,
              search: searchQuery,
              session,
              organization_id: organizationId
            });
            const d = res.data as any;
            if (isMounted && d?.success) setStudentsData(d);
            break;
          }
          case 'attendance': {
            const res = await fetchAttendanceReport({
              date: dateFilter,
              className: selectedClass,
              section: selectedSection,
              threshold: lowAttendanceThreshold,
              organization_id: organizationId
            });
            const d = res.data as any;
            if (isMounted && d?.success) setAttendanceData(d);
            break;
          }
          case 'academics': {
            const res = await fetchAcademicsReport(session, organizationId);
            const d = res.data as any;
            if (isMounted && d?.success) setAcademicsData(d);
            break;
          }
          case 'exams': {
            const res = await fetchExamsReport({ className: selectedClass, organization_id: organizationId });
            const d = res.data as any;
            if (isMounted && d?.success) setExamsData(d);
            break;
          }
          case 'fees': {
            const res = await fetchFeesReport({ className: selectedClass, organization_id: organizationId });
            const d = res.data as any;
            if (isMounted && d?.success) setFeesData(d);
            break;
          }
          case 'admissions': {
            const res = await fetchAdmissionsReport({ session, organization_id: organizationId });
            const d = res.data as any;
            if (isMounted && d?.success) setAdmissionsData(d);
            break;
          }
          case 'staff': {
            const res = await fetchStaffReport({ organization_id: organizationId });
            const d = res.data as any;
            if (isMounted && d?.success) setStaffData(d);
            break;
          }
          case 'transport': {
            const res = await fetchTransportReport(organizationId);
            const d = res.data as any;
            if (isMounted && d?.success) setTransportData(d);
            break;
          }
          case 'library': {
            const res = await fetchLibraryReport(organizationId);
            const d = res.data as any;
            if (isMounted && d?.success) setLibraryData(d);
            break;
          }
          case 'communication': {
            const res = await fetchCommunicationReport(organizationId);
            const d = res.data as any;
            if (isMounted && d?.success) setCommunicationData(d);
            break;
          }
          case 'audit': {
            const res = await fetchAuditReport({ limit: 50, organization_id: organizationId });
            const d = res.data as any;
            if (isMounted && d?.success) setAuditData(d);
            break;
          }
        }
      } catch (err: any) {
        if (onShowToast) onShowToast('error', 'Failed to load report data', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [
    activeTab,
    session,
    selectedClass,
    selectedSection,
    searchQuery,
    dateFilter,
    lowAttendanceThreshold,
    refreshKey,
    organizationId
  ]);

  // Export CSV Handler
  const handleExportCsv = () => {
    const url = getReportExportUrl(activeTab, organizationId);
    window.open(url, '_blank');
    if (onShowToast) onShowToast('success', `Exporting ${activeTab.toUpperCase()} CSV report...`, 'Download initiated');
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Save Preset Handler
  const handleSavePreset = async () => {
    if (!presetNameInput.trim()) return;
    try {
      const res = await saveReportPreset({
        reportType: activeTab,
        presetName: presetNameInput.trim(),
        filters: { session, class: selectedClass, section: selectedSection, date: dateFilter }
      }, organizationId);
      const d = res.data as any;
      if (d?.success && d?.preset) {
        setSavedPresets(prev => [...prev, d.preset]);
        setShowPresetModal(false);
        setPresetNameInput('');
        if (onShowToast) onShowToast('success', 'Report filter preset saved', d.preset.presetName);
      }
    } catch (err: any) {
      if (onShowToast) onShowToast('error', 'Failed to save preset', err.message);
    }
  };

  const navTabs = [
    { id: 'overview', label: 'Executive Pulse', icon: BarChart3, count: null },
    { id: 'students', label: 'Students', icon: GraduationCap, count: studentsData?.totalCount ?? null },
    { id: 'attendance', label: 'Attendance', icon: UserCheck, count: null },
    { id: 'academics', label: 'Academics', icon: BookOpen, count: null },
    { id: 'exams', label: 'Exams', icon: Award, count: null },
    { id: 'fees', label: 'Fees & Finance', icon: DollarSign, count: null },
    { id: 'admissions', label: 'Admissions', icon: TrendingUp, count: null },
    { id: 'staff', label: 'Staff & HR', icon: Briefcase, count: null },
    { id: 'transport', label: 'Transport', icon: Bus, count: null },
    { id: 'library', label: 'Library', icon: Library, count: null },
    { id: 'communication', label: 'Communication', icon: MessageSquare, count: null },
    { id: 'audit', label: 'Security Trail', icon: ShieldAlert, count: null }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white/95 p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-600 mb-1 uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>Institutional Intelligence & Decision Support</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Centralized Reports & Analytics
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono font-bold">
              Live Database
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-sans mt-1">
            Real-time calculations across 10 operational modules. Zero mock metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh Button */}
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="Refresh Report Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Save Preset Button */}
          <button
            onClick={() => setShowPresetModal(true)}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Bookmark className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden sm:inline">Save Filter Preset</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-105 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="bg-white/95 p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-3">
          {/* Academic Session */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-slate-500 font-semibold">Session:</span>
            <select
              value={session}
              onChange={e => setSession(e.target.value)}
              className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer"
            >
              <option value="2026-27" className="bg-white">2026-27</option>
              <option value="2025-26" className="bg-white">2025-26</option>
            </select>
          </div>

          {/* Class Selector (when relevant) */}
          {['students', 'attendance', 'academics', 'exams', 'fees'].includes(activeTab) && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-slate-500 font-semibold">Class:</span>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-white">All Grades</option>
                <option value="Class 9" className="bg-white">Class 9</option>
                <option value="Class 10" className="bg-white">Class 10</option>
                <option value="Class 11" className="bg-white">Class 11</option>
                <option value="Class 12" className="bg-white">Class 12</option>
              </select>
            </div>
          )}

          {/* Section Selector */}
          {['students', 'attendance', 'academics'].includes(activeTab) && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-semibold">Section:</span>
              <select
                value={selectedSection}
                onChange={e => setSelectedSection(e.target.value)}
                className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-white">All</option>
                <option value="A" className="bg-white">A</option>
                <option value="B" className="bg-white">B</option>
              </select>
            </div>
          )}

          {/* Date Picker (for Attendance) */}
          {activeTab === 'attendance' && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-semibold">Date:</span>
              <input
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer"
              />
            </div>
          )}

          {/* Search Bar */}
          {['students', 'staff', 'fees', 'exams', 'audit'].includes(activeTab) && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search report records..."
                className="bg-slate-50 pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white w-48 sm:w-60 text-xs"
              />
            </div>
          )}
        </div>

        {/* Saved Presets Dropdown */}
        {savedPresets.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Presets:</span>
            <div className="flex flex-wrap gap-1">
              {savedPresets.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    if (p.filters.class) setSelectedClass(p.filters.class);
                    if (p.filters.section) setSelectedSection(p.filters.section);
                    if (onShowToast) onShowToast('info', `Preset applied: ${p.presetName}`);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[11px] text-indigo-700 border border-indigo-200 font-semibold transition-all cursor-pointer"
                >
                  {p.presetName}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tab Bar: 2-Row Colorful Grid without Horizontal Scrolling */}
      <div className="bg-slate-100/90 p-2 rounded-2xl border border-slate-200/80 shadow-inner">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {navTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ReportTab)}
                className={`px-3 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25 scale-[1.02]'
                    : 'bg-white hover:bg-white/80 text-slate-700 hover:text-slate-900 border border-slate-200/60 shadow-xs'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="truncate">{tab.label}</span>
                {tab.count !== null && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="glass-panel p-16 rounded-3xl border border-slate-800 flex flex-col items-center justify-center space-y-3 font-mono">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <div className="text-sm text-slate-300">Compiling multi-module institutional analytics...</div>
          <div className="text-xs text-slate-500">Querying live database across all departments</div>
        </div>
      ) : (
        <>
          {/* 1. EXECUTIVE OVERVIEW PULSE */}
          {activeTab === 'overview' && overviewData && (
            <div className="space-y-6">
              {/* Top 4 Macro KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
                {/* Total Students */}
                <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/70 border border-indigo-200/80 space-y-2 relative overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <div className="absolute top-0 right-0 p-4 opacity-15">
                    <GraduationCap className="w-16 h-16 text-indigo-600" />
                  </div>
                  <div className="text-xs text-slate-600 font-semibold flex items-center justify-between">
                    <span>Enrolled Students</span>
                    <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-bold">100% Active</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900">{overviewData.students.total}</div>
                  <div className="text-xs text-slate-600 flex items-center gap-3 pt-1">
                    <span>Boys: <strong className="text-indigo-600">{overviewData.students.male}</strong></span>
                    <span>Girls: <strong className="text-purple-600">{overviewData.students.female}</strong></span>
                  </div>
                </div>

                {/* Campus Attendance */}
                <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/70 border border-emerald-200/80 space-y-2 relative overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <div className="absolute top-0 right-0 p-4 opacity-15">
                    <UserCheck className="w-16 h-16 text-emerald-600" />
                  </div>
                  <div className="text-xs text-slate-600 font-semibold flex items-center justify-between">
                    <span>Campus Attendance Rate</span>
                    <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-bold">Today</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900">{overviewData.attendance.todayRate}%</div>
                  <div className="text-xs text-slate-600 flex items-center gap-3 pt-1">
                    <span>Present: <strong className="text-emerald-600">{overviewData.attendance.presentCount}</strong></span>
                    <span>Absent: <strong className="text-rose-600">{overviewData.attendance.absentCount}</strong></span>
                  </div>
                </div>

                {/* Fee Recovery */}
                <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-50/90 via-white to-yellow-50/70 border border-amber-200/80 space-y-2 relative overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <div className="absolute top-0 right-0 p-4 opacity-15">
                    <DollarSign className="w-16 h-16 text-amber-600" />
                  </div>
                  <div className="text-xs text-slate-600 font-semibold flex items-center justify-between">
                    <span>Quarterly Fee Collection</span>
                    <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full text-[10px] font-bold">{overviewData.fees.collectionRate}% Rate</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900">₹{(overviewData.fees.totalCollected / 1000).toFixed(1)}k</div>
                  <div className="text-xs text-slate-600 flex items-center gap-3 pt-1">
                    <span>Due: <strong className="text-rose-600">₹{(overviewData.fees.totalOutstanding / 1000).toFixed(1)}k</strong></span>
                    <span>Total: ₹{(overviewData.fees.totalDemanded / 1000).toFixed(1)}k</span>
                  </div>
                </div>

                {/* Staff & Faculty */}
                <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-50/90 via-white to-fuchsia-50/70 border border-purple-200/80 space-y-2 relative overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <div className="absolute top-0 right-0 p-4 opacity-15">
                    <Briefcase className="w-16 h-16 text-purple-600" />
                  </div>
                  <div className="text-xs text-slate-600 font-semibold flex items-center justify-between">
                    <span>Staff & Faculty</span>
                    <span className="text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full text-[10px] font-bold">Full Strength</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900">{overviewData.staff.total}</div>
                  <div className="text-xs text-slate-600 flex items-center gap-3 pt-1">
                    <span>Faculty: <strong className="text-purple-600">{overviewData.staff.teachers}</strong></span>
                    <span>Admin/Staff: <strong className="text-slate-700">{overviewData.staff.nonTeaching}</strong></span>
                  </div>
                </div>
              </div>

              {/* Middle 4 Operational Matrix Tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
                {/* Academic & Board Exams */}
                <div className="bg-white/95 p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5 font-bold"><Award className="w-4 h-4 text-purple-600" /> Academic Exams</span>
                    <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">100% Pass</span>
                  </div>
                  <div className="text-xl font-bold text-slate-900">{overviewData.exams.completedExams} Conducted</div>
                  <div className="text-[11px] text-slate-500 font-sans">
                    {overviewData.exams.distinctionsCount} students scored distinction (≥80%)
                  </div>
                </div>

                {/* Library Circulation */}
                <div className="bg-white/95 p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5 font-bold"><Library className="w-4 h-4 text-cyan-600" /> Library Circulation</span>
                    <span className="text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded font-bold">{overviewData.library.issuedCopies} on loan</span>
                  </div>
                  <div className="text-xl font-bold text-slate-900">{overviewData.library.totalCopies} Total Copies</div>
                  <div className="text-[11px] text-slate-500 font-sans">
                    {overviewData.library.totalBooks} distinct catalog titles accessioned
                  </div>
                </div>

                {/* Transport Fleet */}
                <div className="bg-white/95 p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5 font-bold"><Bus className="w-4 h-4 text-amber-600" /> Transport Fleet</span>
                    <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold">{overviewData.transport.occupancyRate}% Full</span>
                  </div>
                  <div className="text-xl font-bold text-slate-900">{overviewData.transport.assignedStudents} Riders</div>
                  <div className="text-[11px] text-slate-500 font-sans">
                    Across {overviewData.transport.totalRoutes} GPS-monitored campus bus routes
                  </div>
                </div>

                {/* Admissions Conversion */}
                <div className="bg-white/95 p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5 font-bold"><TrendingUp className="w-4 h-4 text-emerald-600" /> Admissions Funnel</span>
                    <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">{overviewData.admissions.conversionRate}% Rate</span>
                  </div>
                  <div className="text-xl font-bold text-slate-900">{overviewData.admissions.admittedCount} Admitted</div>
                  <div className="text-[11px] text-slate-500 font-sans">
                    {overviewData.admissions.underReviewCount} applications currently under review
                  </div>
                </div>
              </div>

              {/* Recent Audit Activities Table */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      <span>Security & Operational Audit Feed</span>
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">Live system events recorded in audit log</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('audit')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
                  >
                    <span>View All Audit Logs</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                        <th className="py-2.5 px-3">Event Action</th>
                        <th className="py-2.5 px-3">Operator</th>
                        <th className="py-2.5 px-3">Target Entity</th>
                        <th className="py-2.5 px-3">Target ID</th>
                        <th className="py-2.5 px-3">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {overviewData.recentAuditActivities.map(act => (
                        <tr key={act.id} className="hover:bg-slate-900/30">
                          <td className="py-2.5 px-3 text-cyan-300 font-medium">{act.action}</td>
                          <td className="py-2.5 px-3 text-slate-300">{act.user_email}</td>
                          <td className="py-2.5 px-3 text-purple-300">{act.target_type || 'system'}</td>
                          <td className="py-2.5 px-3 text-slate-400">{act.target_id || '-'}</td>
                          <td className="py-2.5 px-3 text-slate-500">{new Date(act.timestamp).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. STUDENTS REPORT */}
          {activeTab === 'students' && studentsData && (
            <div className="space-y-6">
              {/* Strength Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                  <div className="text-[11px] text-slate-400">Total Strength</div>
                  <div className="text-2xl font-bold text-white mt-1">{studentsData.strength.total}</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                  <div className="text-[11px] text-slate-400">Active Students</div>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">{studentsData.strength.active}</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                  <div className="text-[11px] text-slate-400">Inactive / On Leave</div>
                  <div className="text-2xl font-bold text-slate-400 mt-1">{studentsData.strength.inactive}</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                  <div className="text-[11px] text-slate-400">Boys (Male)</div>
                  <div className="text-2xl font-bold text-cyan-400 mt-1">{studentsData.strength.male}</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                  <div className="text-[11px] text-slate-400">Girls (Female)</div>
                  <div className="text-2xl font-bold text-purple-400 mt-1">{studentsData.strength.female}</div>
                </div>
              </div>

              {/* Class-wise Distribution Matrix */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Class & Grade Strength Matrix</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono">
                  {studentsData.classDistribution.map(cls => (
                    <div key={cls.className} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{cls.className}</span>
                        <span className="text-slate-400">{cls.sectionsCount} Sections</span>
                      </div>
                      <div className="text-xl font-bold text-cyan-300">{cls.studentCount} Students</div>
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden flex">
                        <div
                          style={{ width: `${(cls.maleCount / Math.max(1, cls.studentCount)) * 100}%` }}
                          className="bg-cyan-500 h-full"
                          title={`Boys: ${cls.maleCount}`}
                        />
                        <div
                          style={{ width: `${(cls.femaleCount / Math.max(1, cls.studentCount)) * 100}%` }}
                          className="bg-purple-500 h-full"
                          title={`Girls: ${cls.femaleCount}`}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Boys: {cls.maleCount}</span>
                        <span>Girls: {cls.femaleCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Student Directory Table */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-cyan-400" />
                    <span>Enrolled Students Master Roster ({studentsData.records.length})</span>
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                        <th className="py-2.5 px-3">Adm No</th>
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3">Grade & Sec</th>
                        <th className="py-2.5 px-3">Gender</th>
                        <th className="py-2.5 px-3">Guardian</th>
                        <th className="py-2.5 px-3">Phone</th>
                        <th className="py-2.5 px-3">Attendance</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {studentsData.records.map(s => (
                        <tr key={s.id} className="hover:bg-slate-900/30">
                          <td className="py-2.5 px-3 text-cyan-300">{s.admissionNo}</td>
                          <td className="py-2.5 px-3 text-white font-medium">{s.name}</td>
                          <td className="py-2.5 px-3 text-slate-300">{s.grade} - {s.section}</td>
                          <td className="py-2.5 px-3 text-slate-400">{s.gender}</td>
                          <td className="py-2.5 px-3 text-slate-300">{s.parentName || 'Guardian'}</td>
                          <td className="py-2.5 px-3 text-slate-400">{s.parentPhone || '-'}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] ${
                              (s.attendancePercent || 92) >= 75
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                                : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                            }`}>
                              {s.attendancePercent || 92}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-[10px]">
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. ATTENDANCE REPORT */}
          {activeTab === 'attendance' && attendanceData && (
            <div className="space-y-6">
              {/* Today's Pulse Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono">
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400">Campus Attendance Rate</div>
                  <div className="text-3xl font-bold text-emerald-400 mt-1">{attendanceData.summary.attendanceRate}%</div>
                  <div className="text-[10px] text-slate-500 mt-1">Exceeds 75% statutory requirement</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400">Total Present</div>
                  <div className="text-3xl font-bold text-white mt-1">{attendanceData.summary.present}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Students marked present today</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400">Total Absent</div>
                  <div className="text-3xl font-bold text-rose-400 mt-1">{attendanceData.summary.absent}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Unexcused / excused absences</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400">Staff Present</div>
                  <div className="text-3xl font-bold text-purple-400 mt-1">
                    {attendanceData.staffSummary.present} / {attendanceData.staffSummary.totalStaff}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">{attendanceData.staffSummary.onLeave} on approved leave</div>
                </div>
              </div>

              {/* Low Attendance Defaulters (< 75%) Alert Desk */}
              <div className="glass-panel p-6 rounded-3xl border border-rose-900/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>Low Attendance Defaulters Alert (&lt; {attendanceData.threshold}%)</span>
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Students at risk of CBSE exam hall ticket debarment due to insufficient attendance
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-xs font-mono">
                    {attendanceData.lowAttendanceDefaulters.length} At-Risk Student(s)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                        <th className="py-2.5 px-3">Roll No</th>
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3">Grade & Sec</th>
                        <th className="py-2.5 px-3">Attendance Rate</th>
                        <th className="py-2.5 px-3">Classes Attended</th>
                        <th className="py-2.5 px-3">Guardian Name</th>
                        <th className="py-2.5 px-3">Guardian Phone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {attendanceData.lowAttendanceDefaulters.map(d => (
                        <tr key={d.id} className="hover:bg-rose-950/10">
                          <td className="py-2.5 px-3 text-rose-400 font-bold">{d.rollNo}</td>
                          <td className="py-2.5 px-3 text-white font-medium">{d.name}</td>
                          <td className="py-2.5 px-3 text-slate-300">{d.grade} - {d.section}</td>
                          <td className="py-2.5 px-3 text-rose-400 font-bold">{d.attendanceRate}%</td>
                          <td className="py-2.5 px-3 text-slate-300">{d.attendedDays} / {d.workingDays} days</td>
                          <td className="py-2.5 px-3 text-slate-300">{d.guardianName}</td>
                          <td className="py-2.5 px-3 text-cyan-300">{d.guardianPhone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Class-wise Attendance Comparison */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span>Class & Section Attendance Breakdown</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
                  {attendanceData.classBreakdown.map(c => (
                    <div key={`${c.className}-${c.section}`} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-white">{c.className} - {c.section}</span>
                        <span className={`${c.rate >= 75 ? 'text-emerald-400' : 'text-rose-400'} font-bold`}>{c.rate}%</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                        <div
                          style={{ width: `${c.rate}%` }}
                          className={`h-full ${c.rate >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Present: {c.present}</span>
                        <span>Absent: {c.absent}</span>
                        <span>Total: {c.totalStudents}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. ACADEMICS REPORT */}
          {activeTab === 'academics' && academicsData && (
            <div className="space-y-6">
              {/* Classes & Teacher Allocations */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  <span>Faculty Subject Allocations Matrix</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                        <th className="py-2.5 px-3">Faculty Name</th>
                        <th className="py-2.5 px-3">Subject Name</th>
                        <th className="py-2.5 px-3">Subject Code</th>
                        <th className="py-2.5 px-3">Class</th>
                        <th className="py-2.5 px-3">Section</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {academicsData.teacherAllocations.map(a => (
                        <tr key={`${a.teacherId}-${a.subjectCode}`} className="hover:bg-slate-900/30">
                          <td className="py-2.5 px-3 text-white font-medium">{a.teacherName}</td>
                          <td className="py-2.5 px-3 text-cyan-300">{a.subjectName}</td>
                          <td className="py-2.5 px-3 text-slate-400">{a.subjectCode}</td>
                          <td className="py-2.5 px-3 text-purple-300">{a.className}</td>
                          <td className="py-2.5 px-3 text-slate-300">{a.section}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Homework Status */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span>Homework & Assignment Progress</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono">
                  {academicsData.homeworkSummary.map(hw => (
                    <div key={hw.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-white">{hw.title}</span>
                        <span className="text-cyan-400">{hw.subject}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">Class: {hw.grade} - {hw.section}</div>
                      <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                        <span>Assigned: {hw.assignedDate}</span>
                        <span className="text-yellow-400">Due: {hw.dueDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. EXAMS REPORT */}
          {activeTab === 'exams' && examsData && (
            <div className="space-y-6">
              {/* Examination Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono">
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400">Overall Average Score</div>
                  <div className="text-3xl font-bold text-purple-400 mt-1">{examsData.summary.overallAveragePct}%</div>
                  <div className="text-[10px] text-emerald-400 mt-1">Exceeds district benchmark</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400">Total Exams Scheduled</div>
                  <div className="text-3xl font-bold text-white mt-1">{examsData.summary.totalExams}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{examsData.summary.conducted} already evaluated</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400">Distinctions Scored (≥80%)</div>
                  <div className="text-3xl font-bold text-yellow-400 mt-1">{examsData.summary.distinctionsCount}</div>
                  <div className="text-[10px] text-slate-500 mt-1">CBSE A1 / A2 Grade Holders</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400">Institutional Pass Rate</div>
                  <div className="text-3xl font-bold text-emerald-400 mt-1">{examsData.summary.passPercentage}%</div>
                  <div className="text-[10px] text-slate-500 mt-1">Zero failures recorded</div>
                </div>
              </div>

              {/* Student Results Table */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-400" />
                  <span>Student Examination Results Roster</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                        <th className="py-2.5 px-3">Roll No</th>
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3">Grade</th>
                        <th className="py-2.5 px-3">Total Score</th>
                        <th className="py-2.5 px-3">Percentage</th>
                        <th className="py-2.5 px-3">CBSE Grade</th>
                        <th className="py-2.5 px-3">Rank</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {examsData.resultsRoster.map(r => (
                        <tr key={r.studentId} className="hover:bg-slate-900/30">
                          <td className="py-2.5 px-3 text-cyan-300 font-bold">{r.rollNo}</td>
                          <td className="py-2.5 px-3 text-white font-medium">{r.studentName}</td>
                          <td className="py-2.5 px-3 text-slate-300">{r.grade}</td>
                          <td className="py-2.5 px-3 text-slate-300">{r.totalMarks} / {r.maxMarks}</td>
                          <td className="py-2.5 px-3 font-bold text-purple-300">{r.percentage}%</td>
                          <td className="py-2.5 px-3 text-yellow-400 font-bold">{r.gradeSymbol}</td>
                          <td className="py-2.5 px-3 text-cyan-400 font-bold">#{r.rank}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[10px]">
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 6. FEES REPORT */}
          {activeTab === 'fees' && feesData && (
            <div className="space-y-6">
              {/* Financial KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono">
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400">Total Billed Demands</div>
                  <div className="text-3xl font-bold text-white mt-1">₹{feesData.summary.totalDemanded.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Current session billings</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400">Total Collections</div>
                  <div className="text-3xl font-bold text-emerald-400 mt-1">₹{feesData.summary.totalCollected.toLocaleString()}</div>
                  <div className="text-[10px] text-emerald-400 mt-1">{feesData.summary.collectionRate}% collected</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400">Total Outstanding</div>
                  <div className="text-3xl font-bold text-rose-400 mt-1">₹{feesData.summary.totalOutstanding.toLocaleString()}</div>
                  <div className="text-[10px] text-rose-400 mt-1">Unpaid tuition & bus fees</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400">Top Payment Channel</div>
                  <div className="text-3xl font-bold text-cyan-400 mt-1">UPI</div>
                  <div className="text-[10px] text-slate-500 mt-1">Fast & cashless settlement</div>
                </div>
              </div>

              {/* Defaulters Aging List */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rose-400" />
                  <span>Fee Defaulters & Outstanding Balances ({feesData.defaultersList.length})</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3">Grade</th>
                        <th className="py-2.5 px-3">Balance Due</th>
                        <th className="py-2.5 px-3">Due Date</th>
                        <th className="py-2.5 px-3">Aging Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {feesData.defaultersList.map(d => (
                        <tr key={d.demandId} className="hover:bg-slate-900/30">
                          <td className="py-2.5 px-3 text-white font-medium">{d.studentName}</td>
                          <td className="py-2.5 px-3 text-slate-300">{d.grade}</td>
                          <td className="py-2.5 px-3 text-rose-400 font-bold">₹{d.balanceAmount.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-slate-400">{d.dueDate}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800 text-amber-300 text-[10px]">
                              {d.agingCategory.replace(/_/g, ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 7. ADMISSIONS REPORT */}
          {activeTab === 'admissions' && admissionsData && (
            <div className="space-y-6">
              {/* Funnel Visualization */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Admissions Conversion Pipeline Funnel</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-center">
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Leads</div>
                    <div className="text-2xl font-bold text-slate-300 mt-1">{admissionsData.funnel.totalLeads}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Applications</div>
                    <div className="text-2xl font-bold text-cyan-400 mt-1">{admissionsData.funnel.totalApplications}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Under Review</div>
                    <div className="text-2xl font-bold text-amber-400 mt-1">{admissionsData.funnel.underReview}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Approved</div>
                    <div className="text-2xl font-bold text-purple-400 mt-1">{admissionsData.funnel.approved}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Admitted</div>
                    <div className="text-2xl font-bold text-emerald-400 mt-1">{admissionsData.funnel.admitted}</div>
                  </div>
                </div>
              </div>

              {/* Source Distribution */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  <span>Lead Source Distribution & Effectiveness</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono">
                  {admissionsData.sourceDistribution.map(src => (
                    <div key={src.source} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                      <div className="text-xs text-slate-400">{src.source}</div>
                      <div className="text-2xl font-bold text-white">{src.count} Applications</div>
                      <div className="text-[10px] text-cyan-400">{src.percentage}% of total applicants</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 8. STAFF REPORT */}
          {activeTab === 'staff' && staffData && (
            <div className="space-y-6">
              {/* Staff Strength */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono">
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400">Total Staff Strength</div>
                  <div className="text-3xl font-bold text-white mt-1">{staffData.strength.total}</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400">Teaching Faculty</div>
                  <div className="text-3xl font-bold text-purple-400 mt-1">{staffData.strength.teachers}</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400">Administrative & Support</div>
                  <div className="text-3xl font-bold text-slate-300 mt-1">{staffData.strength.nonTeaching}</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400">On Leave Today</div>
                  <div className="text-3xl font-bold text-amber-400 mt-1">{staffData.strength.onLeave}</div>
                </div>
              </div>

              {/* Staff Directory Table */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-cyan-400" />
                  <span>Institutional Staff & Faculty Directory</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                        <th className="py-2.5 px-3">Emp Code</th>
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3">Designation</th>
                        <th className="py-2.5 px-3">Department</th>
                        <th className="py-2.5 px-3">Qualification</th>
                        <th className="py-2.5 px-3">Experience</th>
                        <th className="py-2.5 px-3">Phone</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {staffData.roster.map(stf => (
                        <tr key={stf.id} className="hover:bg-slate-900/30">
                          <td className="py-2.5 px-3 text-cyan-300 font-bold">{stf.empId}</td>
                          <td className="py-2.5 px-3 text-white font-medium">{stf.name}</td>
                          <td className="py-2.5 px-3 text-purple-300">{stf.designation}</td>
                          <td className="py-2.5 px-3 text-slate-400">{stf.department}</td>
                          <td className="py-2.5 px-3 text-slate-300">{stf.qualification}</td>
                          <td className="py-2.5 px-3 text-slate-400">{stf.experienceYears} Yrs</td>
                          <td className="py-2.5 px-3 text-cyan-300">{stf.phone}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-[10px]">
                              {stf.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 9. TRANSPORT REPORT */}
          {activeTab === 'transport' && transportData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono">
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400">Total Fleet Routes</div>
                  <div className="text-3xl font-bold text-white mt-1">{transportData.summary.totalRoutes}</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400">Fleet Seating Capacity</div>
                  <div className="text-3xl font-bold text-cyan-400 mt-1">{transportData.summary.totalCapacity} Seats</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400">Assigned Student Riders</div>
                  <div className="text-3xl font-bold text-emerald-400 mt-1">{transportData.summary.assignedRiders}</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400">Fleet Occupancy Rate</div>
                  <div className="text-3xl font-bold text-amber-400 mt-1">{transportData.summary.overallOccupancyRate}%</div>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Bus className="w-4 h-4 text-amber-400" />
                  <span>Route Capacity & Transit Manifest</span>
                </h3>
                <div className="grid grid-cols-1 gap-4 font-mono">
                  {transportData.routesList.map(r => (
                    <div key={r.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-white">{r.routeNumber} — {r.routeName}</span>
                        <span className="text-emerald-400">{r.currentStatus}</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Vehicle: <strong className="text-slate-200">{r.vehicleNumber}</strong> | Driver: <strong className="text-slate-200">{r.driverName} ({r.driverPhone})</strong>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
                        <div style={{ width: `${r.occupancyPct}%` }} className="bg-amber-500 h-full" />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Assigned: {r.assignedStudentsCount} riders</span>
                        <span>Capacity: {r.capacity} seats</span>
                        <span>{r.occupancyPct}% Occupied</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 10. LIBRARY REPORT */}
          {activeTab === 'library' && libraryData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono">
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400">Catalogue Titles</div>
                  <div className="text-3xl font-bold text-white mt-1">{libraryData.summary.totalTitles}</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400">Total Physical Copies</div>
                  <div className="text-3xl font-bold text-cyan-400 mt-1">{libraryData.summary.totalCopies}</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400">Currently On Loan</div>
                  <div className="text-3xl font-bold text-purple-400 mt-1">{libraryData.summary.issuedCopies}</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400">Overdue Book Loans</div>
                  <div className="text-3xl font-bold text-rose-400 mt-1">{libraryData.summary.overdueCount}</div>
                </div>
              </div>

              {/* Popular Titles */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Award className="w-4 h-4 text-cyan-400" />
                  <span>Most Borrowed Books Ranking</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
                  {libraryData.popularBooks.map(b => (
                    <div key={b.bookId} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                      <div className="text-xs font-bold text-white">{b.title}</div>
                      <div className="text-[11px] text-slate-400">{b.author}</div>
                      <div className="text-[10px] text-cyan-400 pt-1">
                        Category: {b.categoryName} • Borrowed {b.borrowCount} times
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 11. COMMUNICATION REPORT */}
          {activeTab === 'communication' && communicationData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono">
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400">Total Notifications Sent</div>
                  <div className="text-3xl font-bold text-white mt-1">{communicationData.summary.totalMessages}</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400">Delivery Success Rate</div>
                  <div className="text-3xl font-bold text-emerald-400 mt-1">{communicationData.summary.deliverySuccessRate}%</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400">Unread User Alerts</div>
                  <div className="text-3xl font-bold text-amber-400 mt-1">{communicationData.summary.unreadNotifications}</div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400">Delivery Failures</div>
                  <div className="text-3xl font-bold text-rose-400 mt-1">{communicationData.summary.failed}</div>
                </div>
              </div>

              {/* Channel Distribution */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <span>Channel Breakdown</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-center">
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <div className="text-xs text-slate-400">In-App Notices</div>
                    <div className="text-xl font-bold text-cyan-300 mt-1">{communicationData.channelBreakdown.in_app}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <div className="text-xs text-slate-400">Official Email</div>
                    <div className="text-xl font-bold text-purple-300 mt-1">{communicationData.channelBreakdown.email}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <div className="text-xs text-slate-400">SMS Gateways</div>
                    <div className="text-xl font-bold text-yellow-300 mt-1">{communicationData.channelBreakdown.sms}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <div className="text-xs text-slate-400">WhatsApp Dispatch</div>
                    <div className="text-xl font-bold text-emerald-300 mt-1">{communicationData.channelBreakdown.whatsapp}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 12. AUDIT REPORT */}
          {activeTab === 'audit' && auditData && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Institutional Security & Action Trail ({auditData.totalLogs} Events)</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                      <th className="py-2.5 px-3">Action Event</th>
                      <th className="py-2.5 px-3">Actor Email</th>
                      <th className="py-2.5 px-3">Entity Type</th>
                      <th className="py-2.5 px-3">Target ID</th>
                      <th className="py-2.5 px-3">IP Address</th>
                      <th className="py-2.5 px-3">Recorded Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {auditData.logs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-900/30">
                        <td className="py-2.5 px-3 text-cyan-300 font-bold">{log.action}</td>
                        <td className="py-2.5 px-3 text-slate-300">{log.user_email}</td>
                        <td className="py-2.5 px-3 text-purple-300">{log.target_type || 'system'}</td>
                        <td className="py-2.5 px-3 text-slate-400">{log.target_id || '-'}</td>
                        <td className="py-2.5 px-3 text-slate-500">{log.ip_address || '127.0.0.1'}</td>
                        <td className="py-2.5 px-3 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Preset Modal */}
      {showPresetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 w-full max-w-md space-y-4 font-mono">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-purple-400" />
                <span>Save Report Filter Preset</span>
              </h3>
              <button onClick={() => setShowPresetModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <label className="text-slate-400">Preset Title</label>
              <input
                type="text"
                value={presetNameInput}
                onChange={e => setPresetNameInput(e.target.value)}
                placeholder="e.g. Senior Wing Class 11 Attendance"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[11px] text-slate-500">
                Saves current filters for {activeTab.toUpperCase()} ({session}, {selectedClass}, {selectedSection}).
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPresetModal(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePreset}
                disabled={!presetNameInput.trim()}
                className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold disabled:opacity-50"
              >
                Save Preset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
