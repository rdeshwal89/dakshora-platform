import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Users,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  RefreshCw,
  Download,
  Filter,
  Shield,
  Sparkles,
  Zap,
  Check,
  ChevronRight,
  BookOpen,
  Laptop,
  Flame,
  Award,
  ArrowRight,
  Info,
  CalendarDays,
  UserCheck
} from 'lucide-react';
import {
  ErpRole,
  ErpBellPeriod,
  ErpRoomResource,
  ErpTimetableSlot,
  ErpTeacherSchedule,
  ErpSubstitutionRecommendation,
  ErpSubstitutionRecord,
  ErpStaffRecord
} from '../types';
import {
  fetchErpBellSchedule,
  fetchErpClassTimetable,
  createOrUpdateTimetableSlot,
  deleteTimetableSlot,
  validateTimetableSlot,
  fetchErpTeacherSchedule,
  fetchErpRoomsCatalogue,
  fetchErpSubstitutions,
  fetchSubstitutionRecommendations,
  assignTeacherSubstitution,
  updateSubstitutionStatus,
  fetchErpStaff
} from '../services/api';

interface TimetableManagementHubProps {
  activeSession: string;
  activeRole: ErpRole;
  onShowToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
  onNavigateToModule?: (moduleName: string) => void;
}

export const TimetableManagementHub: React.FC<TimetableManagementHubProps> = ({
  activeSession,
  activeRole,
  onShowToast,
  onNavigateToModule
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'matrix' | 'teacher' | 'substitution' | 'rooms' | 'bell'>('matrix');

  // Bell Schedule & Clock
  const [bellSchedule, setBellSchedule] = useState<ErpBellPeriod[]>([]);
  const [activePeriod, setActivePeriod] = useState<ErpBellPeriod | null>(null);
  const [minutesRemaining, setMinutesRemaining] = useState<number>(0);
  const [serverTime, setServerTime] = useState<string>('08:30');

  // Class Routine Grid State
  const [selectedGrade, setSelectedGrade] = useState<string>('Class 10');
  const [selectedSection, setSelectedSection] = useState<string>('A');
  const [slots, setSlots] = useState<ErpTimetableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  // Teacher Schedule State
  const [staffList, setStaffList] = useState<ErpStaffRecord[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('stf-02');
  const [teacherSchedule, setTeacherSchedule] = useState<ErpTeacherSchedule | null>(null);
  const [loadingTeacher, setLoadingTeacher] = useState<boolean>(false);

  // Substitution State
  const [subDate, setSubDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [substitutions, setSubstitutions] = useState<ErpSubstitutionRecord[]>([]);
  const [recommendations, setRecommendations] = useState<ErpSubstitutionRecommendation[]>([]);
  const [loadingSubstitutions, setLoadingSubstitutions] = useState<boolean>(false);
  const [absentTeachers, setAbsentTeachers] = useState<Array<{ id: string; name: string; designation: string }>>([]);

  // Facilities / Rooms State
  const [rooms, setRooms] = useState<ErpRoomResource[]>([]);
  const [roomFilterType, setRoomFilterType] = useState<string>('all');
  const [loadingRooms, setLoadingRooms] = useState<boolean>(false);

  // Add / Edit Slot Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [slotForm, setSlotForm] = useState<Partial<ErpTimetableSlot>>({
    grade: 'Class 10',
    section: 'A',
    dayOfWeek: 'Monday',
    periodNumber: 1,
    subjectName: 'Mathematics',
    subjectCode: 'MATH-10',
    teacherId: 'stf-02',
    teacherName: 'Rajeev Malhotra',
    roomNumber: '201',
    slotType: 'regular'
  });
  const [clashError, setClashError] = useState<string | null>(null);
  const [clashWarning, setClashWarning] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  // Load Bell Schedule & Initial Metadata
  useEffect(() => {
    loadBellSchedule();
    loadStaffMembers();
    loadRoomsCatalogue();
  }, [activeSession]);

  // Load Class Timetable Slots when grade/section changes
  useEffect(() => {
    loadClassTimetable();
  }, [selectedGrade, selectedSection, activeSession]);

  // Load Teacher Routine when selectedTeacher changes
  useEffect(() => {
    if (activeTab === 'teacher' && selectedTeacherId) {
      loadTeacherSchedule(selectedTeacherId);
    }
  }, [activeTab, selectedTeacherId, activeSession]);

  // Load Substitutions when tab or date changes
  useEffect(() => {
    if (activeTab === 'substitution') {
      loadSubstitutionsData();
    }
  }, [activeTab, subDate, activeSession]);

  // Load Rooms when tab changes
  useEffect(() => {
    if (activeTab === 'rooms') {
      loadRoomsCatalogue();
    }
  }, [activeTab, roomFilterType]);

  // Real-time slot pre-validation on modal form changes
  useEffect(() => {
    if (!showAddModal) return;
    const timer = setTimeout(() => {
      validateSlotLive();
    }, 300);
    return () => clearTimeout(timer);
  }, [slotForm.dayOfWeek, slotForm.periodNumber, slotForm.teacherId, slotForm.roomNumber, slotForm.grade, slotForm.section]);

  const loadBellSchedule = async () => {
    try {
      const res = await fetchErpBellSchedule();
      if (res.data?.success) {
        setBellSchedule(res.data.periods || []);
        setActivePeriod(res.data.activePeriod);
        setMinutesRemaining(res.data.minutesRemaining || 0);
        setServerTime(res.data.serverTime || '08:30');
      }
    } catch {
      // Fallback silently
    }
  };

  const loadStaffMembers = async () => {
    try {
      const res = await fetchErpStaff();
      if (res.data?.staff) {
        setStaffList(res.data.staff);
      }
    } catch {
      // Fallback
    }
  };

  const loadClassTimetable = async () => {
    setLoadingSlots(true);
    try {
      const res = await fetchErpClassTimetable({
        grade: selectedGrade,
        section: selectedSection,
        session: activeSession
      });
      if (res.data?.success) {
        setSlots(res.data.slots || []);
      }
    } catch {
      onShowToast('error', 'Timetable Error', 'Could not load class timetable slots.');
    } finally {
      setLoadingSlots(false);
    }
  };

  const loadTeacherSchedule = async (teacherId: string) => {
    setLoadingTeacher(true);
    try {
      const res = await fetchErpTeacherSchedule(teacherId, activeSession);
      if (res.data?.success) {
        setTeacherSchedule(res.data as unknown as ErpTeacherSchedule);
      }
    } catch {
      onShowToast('error', 'Faculty Schedule', 'Could not load teacher routine.');
    } finally {
      setLoadingTeacher(false);
    }
  };

  const loadSubstitutionsData = async () => {
    setLoadingSubstitutions(true);
    try {
      const [subRes, recRes] = await Promise.all([
        fetchErpSubstitutions(subDate),
        fetchSubstitutionRecommendations(subDate)
      ]);
      if (subRes.data?.success) {
        setSubstitutions(subRes.data.substitutions || []);
      }
      if (recRes.data?.success) {
        setRecommendations(recRes.data.recommendations || []);
        setAbsentTeachers(recRes.data.absentTeachers || []);
      }
    } catch {
      onShowToast('error', 'Substitution Desk', 'Could not load daily substitutions.');
    } finally {
      setLoadingSubstitutions(false);
    }
  };

  const loadRoomsCatalogue = async () => {
    setLoadingRooms(true);
    try {
      const res = await fetchErpRoomsCatalogue(roomFilterType, activeSession);
      if (res.data?.success) {
        setRooms(res.data.rooms || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingRooms(false);
    }
  };

  const validateSlotLive = async () => {
    if (!slotForm.grade || !slotForm.periodNumber) return;
    setIsValidating(true);
    try {
      const res = await validateTimetableSlot(slotForm, slotForm.id);
      if (res.data?.success) {
        if (!res.data.valid && res.data.conflicts.length > 0) {
          setClashError(res.data.conflicts[0].message);
        } else {
          setClashError(null);
        }

        if (res.data.warnings && res.data.warnings.length > 0) {
          setClashWarning(res.data.warnings[0].message);
        } else {
          setClashWarning(null);
        }
      }
    } catch {
      // Ignore
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clashError) {
      onShowToast('error', 'Clash Detected', clashError);
      return;
    }

    try {
      const payload: Partial<ErpTimetableSlot> = {
        ...slotForm,
        session: activeSession
      };
      const res = await createOrUpdateTimetableSlot(payload);
      if (res.data?.success) {
        onShowToast('success', 'Routine Updated', `Period ${slotForm.periodNumber} assigned successfully.`);
        setShowAddModal(false);
        setClashError(null);
        setClashWarning(null);
        loadClassTimetable();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Could not save timetable slot.';
      onShowToast('error', 'Scheduling Conflict', msg);
    }
  };

  const handleDeleteSlot = async (id: string, periodNum: number, subj: string) => {
    if (!confirm(`Are you sure you want to remove Period ${periodNum} (${subj}) from the routine?`)) return;
    try {
      const res = await deleteTimetableSlot(id);
      if (res.data?.success) {
        onShowToast('info', 'Slot Removed', `Period ${periodNum} removed from schedule.`);
        loadClassTimetable();
      }
    } catch {
      onShowToast('error', 'Error', 'Failed to remove slot.');
    }
  };

  const handleAssignSubstitute = async (rec: ErpSubstitutionRecommendation, candidate: any) => {
    try {
      const payload: Partial<ErpSubstitutionRecord> = {
        date: subDate,
        dayOfWeek: rec.dayOfWeek,
        periodNumber: rec.periodNumber,
        absentTeacherId: rec.absentTeacherId,
        absentTeacherName: rec.absentTeacherName,
        substituteTeacherId: candidate.teacherId,
        substituteTeacherName: candidate.teacherName,
        grade: rec.grade,
        section: rec.section,
        subjectName: rec.subjectName,
        roomNumber: rec.roomNumber,
        reason: 'casual_leave',
        notes: `Covering ${rec.subjectName} syllabus.`
      };

      const res = await assignTeacherSubstitution(payload);
      if (res.data?.success) {
        onShowToast('success', 'Substitute Assigned! ⚡', `${candidate.teacherName} assigned to Period ${rec.periodNumber} (${rec.grade}-${rec.section}).`);
        loadSubstitutionsData();
      }
    } catch (err: any) {
      onShowToast('error', 'Assignment Failed', err.response?.data?.message || 'Could not assign substitution.');
    }
  };

  const handleToggleSubstitutionStatus = async (sub: ErpSubstitutionRecord) => {
    const newStatus = sub.status === 'completed' ? 'assigned' : 'completed';
    try {
      const res = await updateSubstitutionStatus(sub.id, { status: newStatus });
      if (res.data?.success) {
        onShowToast('success', 'Status Updated', `Substitution marked as ${newStatus}.`);
        loadSubstitutionsData();
      }
    } catch {
      onShowToast('error', 'Error', 'Could not update status.');
    }
  };

  const handleExportCSV = () => {
    const url = `http://localhost:5000/api/erp/timetable/export?grade=${encodeURIComponent(selectedGrade)}&section=${encodeURIComponent(selectedSection)}&format=csv`;
    window.open(url, '_blank');
    onShowToast('success', 'Downloading CSV', `Routine export generated for ${selectedGrade}-${selectedSection}`);
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
  const regularPeriods = [1, 2, 3, 4, 5, 6, 7, 8];

  const getSlotForDayAndPeriod = (day: string, periodNum: number): ErpTimetableSlot | undefined => {
    return slots.find(s => s.dayOfWeek.toLowerCase() === day.toLowerCase() && s.periodNumber === periodNum);
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. HEADER & LIVE PERIOD BELL TICKER */}
      {/* ========================================================================= */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/20">
              <Clock className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Timetable & Period Scheduling Engine</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                  {activeSession}
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                Classroom routines, real-time teacher & room conflict detection, faculty workload quotas & auto-substitution desk.
              </p>
            </div>
          </div>
        </div>

        {/* Live Period Banner */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <div className="text-[10px] uppercase font-mono text-slate-400 font-semibold">Live Bell State</div>
              <div className="text-xs font-bold font-mono text-emerald-300">
                {activePeriod ? `${activePeriod.label} (${activePeriod.startTime} - ${activePeriod.endTime})` : `Academic Hours Active • ${serverTime}`}
              </div>
            </div>
            {minutesRemaining > 0 && (
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold font-mono border border-emerald-500/30">
                {minutesRemaining}m left
              </span>
            )}
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Routine</span>
          </button>

          {activeRole === 'admin' && (
            <button
              onClick={() => {
                setSlotForm({
                  grade: selectedGrade,
                  section: selectedSection,
                  dayOfWeek: 'Monday',
                  periodNumber: 1,
                  subjectName: 'Mathematics',
                  subjectCode: 'MATH-10',
                  teacherId: 'stf-02',
                  teacherName: 'Rajeev Malhotra',
                  roomNumber: '201',
                  slotType: 'regular'
                });
                setClashError(null);
                setClashWarning(null);
                setShowAddModal(true);
              }}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Period Slot</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. NAVIGATION WORKSPACE TABS */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'matrix'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Class Routine Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('teacher')}
          className={`px-4 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'teacher'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Faculty Workload & Free Periods</span>
        </button>

        <button
          onClick={() => setActiveTab('substitution')}
          className={`px-4 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all relative ${
            activeTab === 'substitution'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Smart Auto-Substitution Desk</span>
          {recommendations.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-bold">
              {recommendations.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('rooms')}
          className={`px-4 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'rooms'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Labs & Rooms Occupancy</span>
        </button>

        <button
          onClick={() => setActiveTab('bell')}
          className={`px-4 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'bell'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Daily Bell Timings</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. TAB 1: CLASS TIMETABLE MATRIX */}
      {/* ========================================================================= */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          {/* Grade & Section Filter Bar */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">Select Classroom:</span>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Class 9">Class 9</option>
                <option value="Class 10">Class 10</option>
                <option value="Class 11">Class 11 (Science)</option>
                <option value="Class 12">Class 12 (Science)</option>
              </select>

              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500">
                Total Allocated Periods: <strong className="text-white">{slots.length}</strong>
              </span>
              <button
                onClick={loadClassTimetable}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingSlots ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Interactive Weekly Matrix Grid */}
          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400">
                    <th className="p-3.5 min-w-[120px] font-bold uppercase tracking-wider border-r border-slate-800/80">
                      Day / Period
                    </th>
                    {regularPeriods.map((pNum) => {
                      const bell = bellSchedule.find(b => b.periodNumber === pNum);
                      return (
                        <th key={pNum} className="p-3 min-w-[150px] border-r border-slate-800/50">
                          <div className="font-bold text-white">Period {pNum}</div>
                          <div className="text-[10px] text-slate-500 font-normal">
                            {bell ? `${bell.startTime} - ${bell.endTime}` : ''}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {daysOfWeek.map((day) => (
                    <tr key={day} className="hover:bg-slate-900/30 transition-colors">
                      <td className="p-3.5 font-bold text-slate-300 bg-slate-950/60 border-r border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{day}</span>
                        </div>
                      </td>

                      {regularPeriods.map((pNum) => {
                        const slot = getSlotForDayAndPeriod(day, pNum);

                        return (
                          <td key={pNum} className="p-2 border-r border-slate-800/40 align-top">
                            {slot ? (
                              <div
                                className={`p-2.5 rounded-2xl border transition-all relative group ${
                                  slot.slotType === 'lab'
                                    ? 'bg-purple-950/40 border-purple-500/30 hover:border-purple-400'
                                    : slot.slotType === 'activity'
                                    ? 'bg-emerald-950/40 border-emerald-500/30 hover:border-emerald-400'
                                    : 'bg-slate-900/80 border-slate-800 hover:border-cyan-500/40'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <span className="font-bold text-white text-[11px] leading-tight line-clamp-1">
                                    {slot.subjectName}
                                  </span>
                                  {activeRole === 'admin' && (
                                    <button
                                      onClick={() => handleDeleteSlot(slot.id, slot.periodNumber, slot.subjectName)}
                                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity p-0.5"
                                      title="Delete Slot"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>

                                <div className="mt-1.5 space-y-1 text-[10px]">
                                  {slot.teacherName && (
                                    <div className="text-cyan-300 font-semibold flex items-center gap-1 truncate">
                                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                      <span className="truncate">{slot.teacherName}</span>
                                    </div>
                                  )}
                                  {slot.roomNumber && (
                                    <div className="text-slate-400 flex items-center justify-between text-[9px]">
                                      <span>Rm: <strong className="text-slate-200">{slot.roomNumber}</strong></span>
                                      {slot.slotType !== 'regular' && (
                                        <span className={`px-1 rounded uppercase font-bold text-[8px] ${
                                          slot.slotType === 'lab' ? 'bg-purple-900 text-purple-200' : 'bg-emerald-900 text-emerald-200'
                                        }`}>
                                          {slot.slotType}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={() => {
                                  if (activeRole !== 'admin') return;
                                  setSlotForm({
                                    grade: selectedGrade,
                                    section: selectedSection,
                                    dayOfWeek: day as any,
                                    periodNumber: pNum,
                                    subjectName: '',
                                    teacherId: '',
                                    roomNumber: selectedGrade.includes('10') ? '201' : '101',
                                    slotType: 'regular'
                                  });
                                  setClashError(null);
                                  setClashWarning(null);
                                  setShowAddModal(true);
                                }}
                                className={`h-20 rounded-2xl border border-dashed border-slate-800/80 flex items-center justify-center text-[10px] text-slate-600 transition-all ${
                                  activeRole === 'admin' ? 'cursor-pointer hover:border-cyan-500/40 hover:bg-cyan-500/5 hover:text-cyan-400' : ''
                                }`}
                              >
                                {activeRole === 'admin' ? '+ Assign' : 'Free'}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB 2: FACULTY WORKLOAD & FREE PERIODS */}
      {/* ========================================================================= */}
      {activeTab === 'teacher' && (
        <div className="space-y-6">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400 font-bold uppercase">Select Faculty Member:</span>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              >
                {staffList.filter(s => s.role === 'teacher' || s.staffType === 'Teacher' || s.id === 'stf-02').map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.designation})
                  </option>
                ))}
              </select>
            </div>

            {teacherSchedule && (
              <div className="flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-400">Weekly Scheduled: </span>
                  <span className="font-bold text-white">{teacherSchedule.weeklyPeriodsCount} / {teacherSchedule.maxWeeklyPeriods} Periods</span>
                </div>
                <div>
                  <span className="text-slate-400">Free Periods: </span>
                  <span className="font-bold text-emerald-400">{teacherSchedule.freePeriodsCount}</span>
                </div>
              </div>
            )}
          </div>

          {teacherSchedule && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Teacher Workload Card */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 font-mono text-xs">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center font-bold text-cyan-400 text-base border border-cyan-500/30">
                    {teacherSchedule.teacher.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{teacherSchedule.teacher.name}</h3>
                    <p className="text-slate-400 text-[10px]">{teacherSchedule.teacher.designation}</p>
                    <p className="text-cyan-400 text-[10px]">{teacherSchedule.teacher.department}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Workload Utilization</span>
                    <span className="font-bold text-white">{teacherSchedule.utilizationPercent}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        teacherSchedule.utilizationPercent > 80
                          ? 'bg-rose-500'
                          : teacherSchedule.utilizationPercent > 60
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${teacherSchedule.utilizationPercent}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px]">
                  <div className="font-bold text-slate-300">Daily Period Distribution:</div>
                  {Object.entries(teacherSchedule.periodsByDay).map(([d, count]) => (
                    <div key={d} className="flex items-center justify-between text-slate-400">
                      <span>{d}</span>
                      <span className="font-bold text-white">{count} periods</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly Assigned Periods */}
              <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span>Weekly Teaching Schedule ({teacherSchedule.routine.length} Assigned Periods)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                  {teacherSchedule.routine.map((slot) => (
                    <div
                      key={slot.id}
                      className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5 hover:border-cyan-500/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                          {slot.dayOfWeek} • Period {slot.periodNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">Room {slot.roomNumber}</span>
                      </div>
                      <div className="font-bold text-white text-sm">{slot.subjectName}</div>
                      <div className="text-[10px] text-slate-400">Class: <strong className="text-slate-200">{slot.grade}-{slot.section}</strong></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 3: SMART AUTO-SUBSTITUTION DESK */}
      {/* ========================================================================= */}
      {activeTab === 'substitution' && (
        <div className="space-y-6">
          {/* Top Banner & Control */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400 font-bold uppercase">Inspection Date:</span>
              <input
                type="date"
                value={subDate}
                onChange={(e) => setSubDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-slate-400">Absent Faculty Today: </span>
                <strong className="text-white">{absentTeachers.length}</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-slate-400">Uncovered Periods: </span>
                <strong className="text-amber-300">{recommendations.length}</strong>
              </div>
            </div>
          </div>

          {/* Absent Faculty Alert */}
          {absentTeachers.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span className="text-rose-200">
                  Absent / On-Leave Faculty: <strong>{absentTeachers.map(t => t.name).join(', ')}</strong>
                </span>
              </div>
              <span className="text-[10px] text-rose-400 uppercase font-bold">Automatic Substitution Active</span>
            </div>
          )}

          {/* AI Recommended Substitution Roster */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Recommended Substitutions for Uncovered Periods</span>
            </h3>

            {recommendations.length === 0 ? (
              <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center font-mono text-xs text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-white font-bold">All Periods Fully Covered!</p>
                <p>No faculty absences require substitution on this date.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono text-xs">
                {recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 shadow-xl"
                  >
                    <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/30">
                          Period {rec.periodNumber} • {rec.dayOfWeek}
                        </span>
                        <h4 className="text-white font-bold text-sm mt-1">{rec.subjectName}</h4>
                        <p className="text-slate-400 text-[10px]">
                          Class: <strong className="text-white">{rec.grade}-{rec.section}</strong> • Room: <strong className="text-white">{rec.roomNumber}</strong>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500">Scheduled Teacher:</span>
                        <div className="text-rose-400 font-bold">{rec.absentTeacherName}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                        <span>Ranked Available Substitutes ({rec.availableCandidatesCount} Free):</span>
                      </div>

                      {rec.candidates.slice(0, 3).map((cand) => (
                        <div
                          key={cand.teacherId}
                          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 hover:border-cyan-500/30 transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white">{cand.teacherName}</span>
                              {cand.isBestMatch && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                                  ★ Best Match
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {cand.department} • Load today: {cand.todayPeriodsCount} periods
                            </div>
                          </div>

                          <button
                            onClick={() => handleAssignSubstitute(rec, cand)}
                            className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-md shadow-cyan-500/20"
                          >
                            <Zap className="w-3 h-3" />
                            <span>Assign</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Active Substitutions Register */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Assigned Substitutions Log ({substitutions.length})</span>
            </h3>

            {substitutions.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono">No substitution assignments recorded yet for this date.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="p-2.5">Period</th>
                      <th className="p-2.5">Class</th>
                      <th className="p-2.5">Subject</th>
                      <th className="p-2.5">Absent Faculty</th>
                      <th className="p-2.5">Substitute Assigned</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {substitutions.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-900/30">
                        <td className="p-2.5 font-bold text-cyan-300">Period {s.periodNumber}</td>
                        <td className="p-2.5 text-white">{s.grade}-{s.section}</td>
                        <td className="p-2.5 text-slate-300">{s.subjectName}</td>
                        <td className="p-2.5 text-rose-400">{s.absentTeacherName}</td>
                        <td className="p-2.5 font-bold text-emerald-400">{s.substituteTeacherName}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            s.status === 'completed'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                              : 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-right">
                          <button
                            onClick={() => handleToggleSubstitutionStatus(s)}
                            className="text-[10px] text-slate-400 hover:text-white underline"
                          >
                            {s.status === 'completed' ? 'Mark Pending' : 'Mark Completed'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB 4: LABS & ROOMS OCCUPANCY */}
      {/* ========================================================================= */}
      {activeTab === 'rooms' && (
        <div className="space-y-6">
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400 font-bold uppercase">Filter Room Type:</span>
              <select
                value={roomFilterType}
                onChange={(e) => setRoomFilterType(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Rooms & Labs</option>
                <option value="classroom">Standard Classrooms</option>
                <option value="physics_lab">Physics Lab</option>
                <option value="chemistry_lab">Chemistry Lab</option>
                <option value="biology_lab">Biology Lab</option>
                <option value="computer_lab">Computer & AI Lab</option>
                <option value="robotics_lab">STEM Robotics Lab</option>
                <option value="sports_complex">Sports Complex</option>
              </select>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Total Facilities: <strong className="text-white">{rooms.length}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 font-mono text-xs">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 hover:border-cyan-500/30 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                      {room.roomNumber}
                    </span>
                    <h4 className="font-bold text-white text-sm mt-1">{room.name}</h4>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1">
                  <div>Wing: <span className="text-white">{room.buildingWing}</span></div>
                  <div>Capacity: <span className="text-white">{room.capacity} seats</span></div>
                  <div>Weekly Bookings: <span className="text-cyan-300 font-bold">{room.totalWeeklyBookings || 0} periods</span></div>
                  <div>Utilization: <span className="text-emerald-400 font-bold">{room.utilizationPercent || 0}%</span></div>
                </div>

                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full"
                    style={{ width: `${room.utilizationPercent || 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TAB 5: DAILY BELL TIMINGS */}
      {/* ========================================================================= */}
      {activeTab === 'bell' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 font-mono text-xs">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Standard Daily Bell Schedule (Periods & Breaks)</span>
            </h3>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Configured school timetable timing definitions for Monday through Saturday.
            </p>
          </div>

          <div className="space-y-2.5">
            {bellSchedule.map((bell) => (
              <div
                key={bell.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                  bell.isBreak
                    ? 'bg-amber-950/20 border-amber-500/30'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                    bell.isBreak ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-white'
                  }`}>
                    {bell.periodNumber === 0 ? '0' : bell.periodNumber === 99 ? '🍱' : bell.periodNumber}
                  </span>
                  <div>
                    <h4 className="font-bold text-white text-xs">{bell.label}</h4>
                    <p className="text-slate-400 text-[10px]">Type: {bell.periodType} • Duration: {bell.durationMinutes} minutes</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-cyan-300">{bell.startTime} - {bell.endTime}</span>
                  {bell.isBreak && <p className="text-[10px] text-amber-400 font-bold">School Break</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL: ADD / EDIT PERIOD SLOT WITH REAL-TIME CLASH DETECTOR */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0B0F19] border border-cyan-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-sm text-white font-mono flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Configure Timetable Period Slot</span>
              </span>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-xs font-mono text-slate-400 hover:text-white"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-4 font-mono text-xs">
              {/* Live Clash Alert Banner */}
              {clashError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-start gap-2 text-rose-300 text-[11px]">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Scheduling Clash Detected!</strong>
                    <span>{clashError}</span>
                  </div>
                </div>
              )}

              {clashWarning && !clashError && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/50 flex items-start gap-2 text-amber-300 text-[11px]">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Workload Warning</strong>
                    <span>{clashWarning}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Class</label>
                  <select
                    value={slotForm.grade}
                    onChange={(e) => setSlotForm({ ...slotForm, grade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  >
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11">Class 11 (Science)</option>
                    <option value="Class 12">Class 12 (Science)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Section</label>
                  <select
                    value={slotForm.section}
                    onChange={(e) => setSlotForm({ ...slotForm, section: e.target.value })}
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
                  <label className="block text-slate-400 mb-1">Day of Week</label>
                  <select
                    value={slotForm.dayOfWeek}
                    onChange={(e) => setSlotForm({ ...slotForm, dayOfWeek: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Period Number</label>
                  <select
                    value={slotForm.periodNumber}
                    onChange={(e) => setSlotForm({ ...slotForm, periodNumber: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  >
                    {regularPeriods.map(p => (
                      <option key={p} value={p}>Period {p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics, Physics, Chemistry Lab"
                  value={slotForm.subjectName}
                  onChange={(e) => setSlotForm({ ...slotForm, subjectName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Assigned Faculty</label>
                  <select
                    value={slotForm.teacherId || ''}
                    onChange={(e) => {
                      const staff = staffList.find(s => s.id === e.target.value);
                      setSlotForm({
                        ...slotForm,
                        teacherId: e.target.value,
                        teacherName: staff ? staff.name : ''
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  >
                    <option value="">-- No Teacher --</option>
                    {staffList.filter(s => s.role === 'teacher' || s.staffType === 'Teacher' || s.id === 'stf-02').map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Room / Lab Number</label>
                  <select
                    value={slotForm.roomNumber || ''}
                    onChange={(e) => setSlotForm({ ...slotForm, roomNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  >
                    {rooms.map(r => (
                      <option key={r.id} value={r.roomNumber}>{r.roomNumber} ({r.name})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Slot Category</label>
                  <select
                    value={slotForm.slotType}
                    onChange={(e) => setSlotForm({ ...slotForm, slotType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  >
                    <option value="regular">Regular Classroom</option>
                    <option value="lab">Science / Computer Lab</option>
                    <option value="activity">Sports / Club / Activity</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={Boolean(clashError)}
                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all mt-2 ${
                  clashError
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/20'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Save Timetable Slot</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
