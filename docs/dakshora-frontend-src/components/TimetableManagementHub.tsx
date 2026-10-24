import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  UserCheck,
  Printer,
  FileSpreadsheet,
  Settings2,
  Edit2,
  RotateCcw,
  Sun,
  Snowflake,
  X,
  ExternalLink,
  Coffee,
  BellRing,
  HelpCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
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
  updateErpBellSchedule,
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
import { SchoolBrandProfile } from './SchoolBrandingModal';

// Comprehensive Grade options for NEP 2020 5+3+3+4 framework
const ALL_GRADES = [
  'Nursery',
  'LKG',
  'UKG',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11 (Science)',
  'Class 11 (Commerce)',
  'Class 11 (Humanities)',
  'Class 12 (Science)',
  'Class 12 (Commerce)',
  'Class 12 (Humanities)'
];

const ALL_SECTIONS = ['A', 'B', 'C', 'D'];

// Presets for School Bell Timings
const PRESET_BELL_SCHEDULES: Record<string, { name: string; desc: string; icon: any; periods: ErpBellPeriod[] }> = {
  cbse_standard: {
    name: 'Standard CBSE Schedule (07:50 AM – 02:35 PM)',
    desc: '8 Teaching periods (40-45m) + Morning Assembly (25m) + Lunch Recess (35m) + Remedial/Club period',
    icon: Building2,
    periods: [
      { id: 'bell-0', periodNumber: 0, label: 'Morning Assembly & Homeroom', startTime: '07:50', endTime: '08:15', durationMinutes: 25, isBreak: true, periodType: 'assembly' },
      { id: 'bell-1', periodNumber: 1, label: 'Period 1', startTime: '08:15', endTime: '09:00', durationMinutes: 45, isBreak: false, periodType: 'regular' },
      { id: 'bell-2', periodNumber: 2, label: 'Period 2', startTime: '09:00', endTime: '09:45', durationMinutes: 45, isBreak: false, periodType: 'regular' },
      { id: 'bell-3', periodNumber: 3, label: 'Period 3', startTime: '09:45', endTime: '10:30', durationMinutes: 45, isBreak: false, periodType: 'regular' },
      { id: 'bell-4', periodNumber: 4, label: 'Period 4', startTime: '10:30', endTime: '11:10', durationMinutes: 40, isBreak: false, periodType: 'regular' },
      { id: 'bell-recess', periodNumber: 99, label: 'Lunch & Recess Break', startTime: '11:10', endTime: '11:45', durationMinutes: 35, isBreak: true, periodType: 'recess' },
      { id: 'bell-5', periodNumber: 5, label: 'Period 5', startTime: '11:45', endTime: '12:30', durationMinutes: 45, isBreak: false, periodType: 'regular' },
      { id: 'bell-6', periodNumber: 6, label: 'Period 6', startTime: '12:30', endTime: '13:15', durationMinutes: 45, isBreak: false, periodType: 'regular' },
      { id: 'bell-7', periodNumber: 7, label: 'Period 7', startTime: '13:15', endTime: '13:55', durationMinutes: 40, isBreak: false, periodType: 'regular' },
      { id: 'bell-8', periodNumber: 8, label: 'Period 8 (Clubs & Remedial)', startTime: '13:55', endTime: '14:35', durationMinutes: 40, isBreak: false, periodType: 'activity' }
    ]
  },
  summer: {
    name: 'Summer School Schedule (07:30 AM – 01:30 PM)',
    desc: 'Early morning start for summer heat mitigation with 40-minute periods and early noon dispersal',
    icon: Sun,
    periods: [
      { id: 'bell-sum-0', periodNumber: 0, label: 'Morning Assembly & Meditation', startTime: '07:30', endTime: '07:50', durationMinutes: 20, isBreak: true, periodType: 'assembly' },
      { id: 'bell-sum-1', periodNumber: 1, label: 'Period 1', startTime: '07:50', endTime: '08:30', durationMinutes: 40, isBreak: false, periodType: 'regular' },
      { id: 'bell-sum-2', periodNumber: 2, label: 'Period 2', startTime: '08:30', endTime: '09:10', durationMinutes: 40, isBreak: false, periodType: 'regular' },
      { id: 'bell-sum-3', periodNumber: 3, label: 'Period 3', startTime: '09:10', endTime: '09:50', durationMinutes: 40, isBreak: false, periodType: 'regular' },
      { id: 'bell-sum-rec', periodNumber: 99, label: 'Breakfast & Refreshment Recess', startTime: '09:50', endTime: '10:20', durationMinutes: 30, isBreak: true, periodType: 'recess' },
      { id: 'bell-sum-4', periodNumber: 4, label: 'Period 4', startTime: '10:20', endTime: '11:00', durationMinutes: 40, isBreak: false, periodType: 'regular' },
      { id: 'bell-sum-5', periodNumber: 5, label: 'Period 5', startTime: '11:00', endTime: '11:40', durationMinutes: 40, isBreak: false, periodType: 'regular' },
      { id: 'bell-sum-6', periodNumber: 6, label: 'Period 6', startTime: '11:40', endTime: '12:20', durationMinutes: 40, isBreak: false, periodType: 'regular' },
      { id: 'bell-sum-7', periodNumber: 7, label: 'Period 7', startTime: '12:20', endTime: '12:55', durationMinutes: 35, isBreak: false, periodType: 'regular' },
      { id: 'bell-sum-8', periodNumber: 8, label: 'Period 8 (Dispersal & Clubs)', startTime: '12:55', endTime: '13:30', durationMinutes: 35, isBreak: false, periodType: 'activity' }
    ]
  },
  winter: {
    name: 'Winter School Schedule (08:30 AM – 02:45 PM)',
    desc: 'Dense fog & cold wave mitigation routine with late morning start and extended afternoon sun interval',
    icon: Snowflake,
    periods: [
      { id: 'bell-win-0', periodNumber: 0, label: 'Indoor Assembly & Roll Call', startTime: '08:30', endTime: '08:55', durationMinutes: 25, isBreak: true, periodType: 'assembly' },
      { id: 'bell-win-1', periodNumber: 1, label: 'Period 1', startTime: '08:55', endTime: '09:35', durationMinutes: 40, isBreak: false, periodType: 'regular' },
      { id: 'bell-win-2', periodNumber: 2, label: 'Period 2', startTime: '09:35', endTime: '10:15', durationMinutes: 40, isBreak: false, periodType: 'regular' },
      { id: 'bell-win-3', periodNumber: 3, label: 'Period 3', startTime: '10:15', endTime: '10:55', durationMinutes: 40, isBreak: false, periodType: 'regular' },
      { id: 'bell-win-4', periodNumber: 4, label: 'Period 4', startTime: '10:55', endTime: '11:35', durationMinutes: 40, isBreak: false, periodType: 'regular' },
      { id: 'bell-win-rec', periodNumber: 99, label: 'Mid-Day Lunch & Sun Break', startTime: '11:35', endTime: '12:10', durationMinutes: 35, isBreak: true, periodType: 'recess' },
      { id: 'bell-win-5', periodNumber: 5, label: 'Period 5', startTime: '12:10', endTime: '12:50', durationMinutes: 40, isBreak: false, periodType: 'regular' },
      { id: 'bell-win-6', periodNumber: 6, label: 'Period 6', startTime: '12:50', endTime: '13:30', durationMinutes: 40, isBreak: false, periodType: 'regular' },
      { id: 'bell-win-7', periodNumber: 7, label: 'Period 7', startTime: '13:30', endTime: '14:10', durationMinutes: 40, isBreak: false, periodType: 'regular' },
      { id: 'bell-win-8', periodNumber: 8, label: 'Period 8 (Doubt Clearing)', startTime: '14:10', endTime: '14:45', durationMinutes: 35, isBreak: false, periodType: 'activity' }
    ]
  }
};

interface TimetableManagementHubProps {
  activeSession: string;
  activeRole: ErpRole;
  currentUser?: any;
  schoolBrand?: SchoolBrandProfile;
  onShowToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
  onNavigateToModule?: (moduleName: string) => void;
}

export const TimetableManagementHub: React.FC<TimetableManagementHubProps> = ({
  activeSession,
  activeRole,
  currentUser,
  schoolBrand,
  onShowToast,
  onNavigateToModule
}) => {
  // Navigation tabs (defaults to 'teacher' if teacher logged in)
  const [activeTab, setActiveTab] = useState<'matrix' | 'teacher' | 'substitution' | 'rooms' | 'bell'>(() => {
    return activeRole === 'teacher' ? 'teacher' : 'matrix';
  });

  // Bell Schedule & Clock State
  const [bellSchedule, setBellSchedule] = useState<ErpBellPeriod[]>(PRESET_BELL_SCHEDULES.cbse_standard.periods);
  const [editingBellSchedule, setEditingBellSchedule] = useState<ErpBellPeriod[]>(PRESET_BELL_SCHEDULES.cbse_standard.periods);
  const [isEditingBellMode, setIsEditingBellMode] = useState<boolean>(false);
  const [activePresetKey, setActivePresetKey] = useState<string>('cbse_standard');
  const [savingBellSchedule, setSavingBellSchedule] = useState<boolean>(false);

  // Real-time IST Live Clock & Countdown (Updates every 1000ms)
  const [currentIstTime, setCurrentIstTime] = useState<string>('');
  const [currentDayName, setCurrentDayName] = useState<string>('Monday');
  const [activePeriod, setActivePeriod] = useState<ErpBellPeriod | null>(null);
  const [nextPeriod, setNextPeriod] = useState<ErpBellPeriod | null>(null);
  const [liveSecondsRemaining, setLiveSecondsRemaining] = useState<number>(0);
  const [livePeriodLabel, setLivePeriodLabel] = useState<string>('Academic Hours Active');
  const [livePeriodSubtext, setLivePeriodSubtext] = useState<string>('');
  const [liveStatusType, setLiveStatusType] = useState<'in_period' | 'assembly' | 'recess' | 'before_school' | 'school_over' | 'sunday'>('in_period');

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
  const [subDate, setSubDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
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

  // Print Preview Modal State
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [printType, setPrintType] = useState<'class' | 'teacher'>('class');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
  const regularPeriods = [1, 2, 3, 4, 5, 6, 7, 8];

  // =========================================================================
  // 1. REAL INDIAN STANDARD TIME (IST) TICKER (Ticks every 1 second)
  // =========================================================================
  useEffect(() => {
    const updateIstTicker = () => {
      // Precise Indian Standard Time (UTC+05:30)
      const istStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
      const istDate = new Date(istStr);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = days[istDate.getDay()];
      setCurrentDayName(dayName);

      const hours = istDate.getHours();
      const minutes = istDate.getMinutes();
      const seconds = istDate.getSeconds();
      const totalSecs = (hours * 3600) + (minutes * 60) + seconds;

      const formattedTime = istDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setCurrentIstTime(`${formattedTime} (IST)`);

      if (dayName === 'Sunday') {
        setLiveStatusType('sunday');
        setLivePeriodLabel('Sunday Institutional Holiday');
        setLivePeriodSubtext('Campus academic operations resume on Monday at 07:50 AM');
        setLiveSecondsRemaining(0);
        setActivePeriod(null);
        setNextPeriod(null);
        return;
      }

      // Check against current active bell schedule
      let active: ErpBellPeriod | null = null;
      let next: ErpBellPeriod | null = null;
      let remainingSecs = 0;

      for (let i = 0; i < bellSchedule.length; i++) {
        const b = bellSchedule[i];
        const [sh, sm] = (b.startTime || '00:00').split(':').map(Number);
        const [eh, em] = (b.endTime || '00:00').split(':').map(Number);
        const startSecs = (sh * 3600) + (sm * 60);
        const endSecs = (eh * 3600) + (em * 60);

        if (totalSecs >= startSecs && totalSecs < endSecs) {
          active = b;
          remainingSecs = endSecs - totalSecs;
          if (i + 1 < bellSchedule.length) {
            next = bellSchedule[i + 1];
          }
          break;
        } else if (totalSecs < startSecs && !next) {
          next = b;
        }
      }

      if (active) {
        setActivePeriod(active);
        setNextPeriod(next);
        setLiveSecondsRemaining(remainingSecs);

        if (active.periodType === 'assembly') {
          setLiveStatusType('assembly');
          setLivePeriodLabel(`🔔 ${active.label} (${active.startTime} – ${active.endTime})`);
          setLivePeriodSubtext(next ? `Next: ${next.label} begins at ${next.startTime}` : 'Regular routine follows');
        } else if (active.periodType === 'recess' || active.isBreak) {
          setLiveStatusType('recess');
          setLivePeriodLabel(`🍱 ${active.label} (${active.startTime} – ${active.endTime})`);
          setLivePeriodSubtext(next ? `Next: ${next.label} starts promptly at ${next.startTime}` : 'Classes resume shortly');
        } else {
          setLiveStatusType('in_period');
          setLivePeriodLabel(`🟢 Period ${active.periodNumber}: ${active.label} (${active.startTime} – ${active.endTime})`);
          setLivePeriodSubtext(next ? `Next: ${next.label} at ${next.startTime}` : 'Final institutional period');
        }
      } else {
        const firstB = bellSchedule[0];
        const lastB = bellSchedule[bellSchedule.length - 1];
        const [fH, fM] = (firstB?.startTime || '07:50').split(':').map(Number);
        const [lH, lM] = (lastB?.endTime || '14:35').split(':').map(Number);
        const firstSecs = (fH * 3600) + (fM * 60);
        const lastSecs = (lH * 3600) + (lM * 60);

        if (totalSecs < firstSecs) {
          setLiveStatusType('before_school');
          setLiveSecondsRemaining(firstSecs - totalSecs);
          setLivePeriodLabel('⏳ Before School Hours');
          setLivePeriodSubtext(`First Bell (${firstB?.label || 'Assembly'}) begins at ${firstB?.startTime || '07:50 AM'}`);
          setActivePeriod(null);
          setNextPeriod(firstB || null);
        } else if (totalSecs >= lastSecs) {
          setLiveStatusType('school_over');
          setLiveSecondsRemaining(0);
          setLivePeriodLabel('🌙 School Hours Completed');
          setLivePeriodSubtext(`Academic bell concluded at ${lastB?.endTime || '02:35 PM'} • See you tomorrow!`);
          setActivePeriod(null);
          setNextPeriod(null);
        }
      }
    };

    updateIstTicker();
    const interval = setInterval(updateIstTicker, 1000);
    return () => clearInterval(interval);
  }, [bellSchedule]);

  // Format live seconds remaining as mm:ss
  const formatTimeRemaining = (totalSecs: number) => {
    if (totalSecs <= 0) return '00m 00s';
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  };

  // =========================================================================
  // 2. DATA LOADERS & INITIALIZATION
  // =========================================================================
  useEffect(() => {
    loadBellSchedule();
    loadStaffMembers();
    loadRoomsCatalogue();
  }, [activeSession]);

  useEffect(() => {
    loadClassTimetable();
  }, [selectedGrade, selectedSection, activeSession]);

  useEffect(() => {
    if (activeTab === 'teacher' && selectedTeacherId) {
      loadTeacherSchedule(selectedTeacherId);
    }
  }, [activeTab, selectedTeacherId, activeSession]);

  useEffect(() => {
    if (activeTab === 'substitution') {
      loadSubstitutionsData();
    }
  }, [activeTab, subDate, activeSession]);

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

  // Automatically select logged-in teacher if role is teacher
  useEffect(() => {
    if (activeRole === 'teacher' && staffList.length > 0) {
      const match = staffList.find(s =>
        (currentUser?.id && s.id === currentUser.id) ||
        (currentUser?.empId && s.empId === currentUser.empId) ||
        (currentUser?.email && s.email?.toLowerCase() === currentUser.email?.toLowerCase()) ||
        (currentUser?.name && s.name?.toLowerCase().includes(currentUser.name.toLowerCase()))
      ) || staffList[1] || staffList[0];

      if (match) {
        setSelectedTeacherId(match.id);
        setActiveTab('teacher');
      }
    }
  }, [activeRole, staffList, currentUser]);

  const loadBellSchedule = async () => {
    try {
      // Check localStorage first for persisted custom bell schedule
      const savedCustom = localStorage.getItem('dakshora_custom_bell_schedule');
      if (savedCustom) {
        try {
          const parsed = JSON.parse(savedCustom);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setBellSchedule(parsed);
            setEditingBellSchedule(parsed);
          }
        } catch {}
      }

      const res = await fetchErpBellSchedule();
      if (res.data?.success && res.data.periods?.length) {
        setBellSchedule(res.data.periods);
        setEditingBellSchedule(res.data.periods);
      }
    } catch {
      // Fallback to CBSE standard
    }
  };

  const loadStaffMembers = async () => {
    try {
      const res = await fetchErpStaff();
      if (res.data?.staff) {
        setStaffList(res.data.staff);
      }
    } catch {}
  };

  const loadClassTimetable = async () => {
    setLoadingSlots(true);
    try {
      const res = await fetchErpClassTimetable({
        grade: selectedGrade,
        section: selectedSection,
        session: activeSession
      });
      if (res.data?.slots) {
        setSlots(res.data.slots);
      }
    } catch {
      onShowToast('error', 'Timetable Error', 'Could not load class timetable slots.');
    } finally {
      setLoadingSlots(false);
    }
  };

  const loadTeacherSchedule = async (tId: string) => {
    setLoadingTeacher(true);
    try {
      const res = await fetchErpTeacherSchedule(tId, activeSession);
      if (res.data) {
        setTeacherSchedule(res.data as unknown as ErpTeacherSchedule);
      }
    } catch {
      onShowToast('error', 'Faculty Schedule', 'Could not retrieve teacher weekly routine.');
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
      if (subRes.data?.substitutions) {
        setSubstitutions(subRes.data.substitutions);
      }
      if (recRes.data?.recommendations) {
        setRecommendations(recRes.data.recommendations);
        setAbsentTeachers(recRes.data.absentTeachers || []);
      }
    } catch {} finally {
      setLoadingSubstitutions(false);
    }
  };

  const loadRoomsCatalogue = async () => {
    setLoadingRooms(true);
    try {
      const res = await fetchErpRoomsCatalogue(roomFilterType === 'all' ? undefined : roomFilterType);
      if (res.data?.rooms) {
        setRooms(res.data.rooms);
      }
    } catch {} finally {
      setLoadingRooms(false);
    }
  };

  // =========================================================================
  // 3. BELL SCHEDULE CONFIGURATION & RE-SET ENGINE
  // =========================================================================
  const handleApplyPreset = (presetKey: string) => {
    const preset = PRESET_BELL_SCHEDULES[presetKey];
    if (!preset) return;
    setActivePresetKey(presetKey);
    setEditingBellSchedule(JSON.parse(JSON.stringify(preset.periods)));
    onShowToast('info', `Preset Selected: ${preset.name}`, 'Review and click Save Bell Schedule to apply.');
  };

  const handleUpdateEditingPeriod = (index: number, field: keyof ErpBellPeriod, value: any) => {
    setEditingBellSchedule(prev => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };

      // Auto-recalculate duration if startTime and endTime change
      if (field === 'startTime' || field === 'endTime') {
        const [sh, sm] = (field === 'startTime' ? value : target.startTime || '00:00').split(':').map(Number);
        const [eh, em] = (field === 'endTime' ? value : target.endTime || '00:00').split(':').map(Number);
        if (!isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em)) {
          const diff = (eh * 60 + em) - (sh * 60 + sm);
          target.durationMinutes = diff > 0 ? diff : target.durationMinutes;
        }
      }
      updated[index] = target;
      return updated;
    });
  };

  const handleAddPeriodToBellSchedule = (isBreak: boolean) => {
    setEditingBellSchedule(prev => {
      const last = prev[prev.length - 1];
      let nextStart = '14:35';
      let nextEnd = '15:15';
      if (last && last.endTime) {
        nextStart = last.endTime;
        const [lh, lm] = nextStart.split(':').map(Number);
        const endTotal = lh * 60 + lm + (isBreak ? 20 : 40);
        const eh = Math.floor(endTotal / 60) % 24;
        const em = endTotal % 60;
        nextEnd = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
      }

      const newP: ErpBellPeriod = {
        id: `bell-custom-${Date.now()}`,
        periodNumber: isBreak ? 99 : (prev.filter(p => !p.isBreak).length + 1),
        label: isBreak ? 'Short Break / Dispersal' : `Period ${prev.filter(p => !p.isBreak).length + 1}`,
        startTime: nextStart,
        endTime: nextEnd,
        durationMinutes: isBreak ? 20 : 40,
        isBreak,
        periodType: isBreak ? 'recess' : 'regular'
      };
      return [...prev, newP];
    });
  };

  const handleDeletePeriodFromBellSchedule = (index: number) => {
    if (editingBellSchedule.length <= 3) {
      onShowToast('warning', 'Minimum Periods Reached', 'School bell schedule must have at least 3 periods.');
      return;
    }
    setEditingBellSchedule(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveBellSchedule = async () => {
    setSavingBellSchedule(true);
    try {
      // Validate chronological order
      for (let i = 0; i < editingBellSchedule.length - 1; i++) {
        const cur = editingBellSchedule[i];
        const nxt = editingBellSchedule[i + 1];
        if (cur.startTime >= cur.endTime) {
          onShowToast('error', 'Timing Error', `${cur.label}: End time must be after Start time.`);
          setSavingBellSchedule(false);
          return;
        }
      }

      const res = await updateErpBellSchedule(editingBellSchedule, PRESET_BELL_SCHEDULES[activePresetKey]?.name || 'Custom');
      setBellSchedule(editingBellSchedule);
      setIsEditingBellMode(false);
      localStorage.setItem('dakshora_custom_bell_schedule', JSON.stringify(editingBellSchedule));

      onShowToast('success', 'Bell Schedule Updated! 🔔', `Successfully applied ${editingBellSchedule.length} periods. Live clock updated.`);
    } catch (err: any) {
      // Local fallback
      setBellSchedule(editingBellSchedule);
      setIsEditingBellMode(false);
      localStorage.setItem('dakshora_custom_bell_schedule', JSON.stringify(editingBellSchedule));
      onShowToast('success', 'Bell Schedule Saved Locally 🔔', 'Active bell timings updated in institutional memory.');
    } finally {
      setSavingBellSchedule(false);
    }
  };

  const handleResetBellScheduleToDefault = () => {
    const standard = PRESET_BELL_SCHEDULES.cbse_standard.periods;
    setEditingBellSchedule(JSON.parse(JSON.stringify(standard)));
    setActivePresetKey('cbse_standard');
    onShowToast('info', 'Reset to CBSE Standard', 'Click Save & Apply to enforce changes.');
  };

  // =========================================================================
  // 4. EXCEL EXPORT ENGINE (.xlsx via XLSX library)
  // =========================================================================
  const handleExportExcelClass = () => {
    try {
      const wb = XLSX.utils.book_new();
      const schoolTitle = schoolBrand?.schoolName || 'Dakshora Public Senior Secondary School';

      const wsData: any[][] = [
        [schoolTitle.toUpperCase()],
        [`MASTER CLASS TIMETABLE: ${selectedGrade.toUpperCase()} - SECTION ${selectedSection}`],
        [`Academic Session: ${activeSession} | Affiliation: ${schoolBrand?.affiliationNo || 'CBSE-AFF-202611'} | Board: ${schoolBrand?.board || 'CBSE'}`],
        [`Generated on: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} (IST)`],
        [],
        ['Period', 'Bell Timings', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      ];

      regularPeriods.forEach(pNum => {
        const bell = bellSchedule.find(b => b.periodNumber === pNum) || {
          startTime: `${String(8 + Math.floor(pNum * 0.75)).padStart(2, '0')}:00`,
          endTime: `${String(8 + Math.floor((pNum + 1) * 0.75)).padStart(2, '0')}:00`,
          label: `Period ${pNum}`
        };

        const row = [
          `Period ${pNum}`,
          `${bell.startTime} - ${bell.endTime}`,
          ...daysOfWeek.map(day => {
            const slot = getSlotForDayAndPeriod(day, pNum);
            if (!slot) return 'FREE';
            return `${slot.subjectName}\n(${slot.teacherName || 'Faculty'}, Rm ${slot.roomNumber || '201'})`;
          })
        ];
        wsData.push(row);
      });

      // Recess break row
      const recess = bellSchedule.find(b => b.isBreak && b.periodType === 'recess');
      if (recess) {
        wsData.splice(10, 0, [
          'RECESS',
          `${recess.startTime} - ${recess.endTime}`,
          'LUNCH & RECESS BREAK',
          'LUNCH & RECESS BREAK',
          'LUNCH & RECESS BREAK',
          'LUNCH & RECESS BREAK',
          'LUNCH & RECESS BREAK',
          'LUNCH & RECESS BREAK'
        ]);
      }

      wsData.push([]);
      wsData.push(['Prepared By: Timetable Incharge', '', 'Verified By: Academic Coordinator', '', '', 'Approved By: Principal']);

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, `${selectedGrade}-${selectedSection}`);

      const filename = `${schoolTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Class_${selectedGrade.replace(/\s+/g, '_')}_Sec_${selectedSection}_Timetable.xlsx`;
      XLSX.writeFile(wb, filename);

      onShowToast('success', 'Excel Generated! 📊', `Class ${selectedGrade}-${selectedSection} timetable exported to ${filename}`);
    } catch (err: any) {
      console.error('Excel Export Error:', err);
      onShowToast('error', 'Export Failed', err.message || 'Could not generate Excel sheet');
    }
  };

  const handleExportExcelTeacher = () => {
    const selectedTeacher = staffList.find(s => s.id === selectedTeacherId) || teacherSchedule?.teacher;
    if (!teacherSchedule || !selectedTeacher) {
      onShowToast('warning', 'No Teacher Selected', 'Please select a faculty member first.');
      return;
    }
    try {
      const wb = XLSX.utils.book_new();
      const schoolTitle = schoolBrand?.schoolName || 'Dakshora Public Senior Secondary School';

      const wsData: any[][] = [
        [schoolTitle.toUpperCase()],
        [`FACULTY TEACHING ROUTINE: ${selectedTeacher.name.toUpperCase()} (${(selectedTeacher as any).empId || 'FAC-01'})`],
        [`Designation: ${selectedTeacher.designation} | Department: ${selectedTeacher.department} | Specialization: ${(selectedTeacher as any).subjectSpecialization || 'Core Subjects'}`],
        [`Total Weekly Periods: ${teacherSchedule.weeklyPeriodsCount} / ${teacherSchedule.maxWeeklyPeriods} (${teacherSchedule.utilizationPercent}% Load) | Free Periods: ${teacherSchedule.freePeriodsCount}`],
        [`Generated on: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} (IST)`],
        [],
        ['Period', 'Bell Timings', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      ];

      regularPeriods.forEach(pNum => {
        const bell = bellSchedule.find(b => b.periodNumber === pNum) || {
          startTime: `${String(8 + Math.floor(pNum * 0.75)).padStart(2, '0')}:00`,
          endTime: `${String(8 + Math.floor((pNum + 1) * 0.75)).padStart(2, '0')}:00`
        };

        const row = [
          `Period ${pNum}`,
          `${bell.startTime} - ${bell.endTime}`,
          ...daysOfWeek.map(day => {
            const slot = (teacherSchedule.routine || []).find(s => s.dayOfWeek === day && s.periodNumber === pNum);
            if (!slot) return 'FREE / PLANNING';
            return `${slot.grade}-${slot.section}: ${slot.subjectName}\n(Rm ${slot.roomNumber || '201'})`;
          })
        ];
        wsData.push(row);
      });

      wsData.push([]);
      wsData.push(['Teacher Signature', '', 'Academic Coordinator', '', '', 'Principal Signature']);

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, `Teacher_Routine`);

      const filename = `${selectedTeacher.name.replace(/[^a-zA-Z0-9]/g, '_')}_Weekly_Timetable.xlsx`;
      XLSX.writeFile(wb, filename);

      onShowToast('success', 'Excel Generated! 📊', `Faculty schedule for ${selectedTeacher.name} exported to ${filename}`);
    } catch (err: any) {
      console.error('Excel Export Error:', err);
      onShowToast('error', 'Export Failed', err.message || 'Could not generate Excel sheet');
    }
  };

  // =========================================================================
  // 5. PRINT / PDF ENGINE
  // =========================================================================
  const handlePrintClass = () => {
    setPrintType('class');
    setShowPrintModal(true);
  };

  const handlePrintTeacher = () => {
    setPrintType('teacher');
    setShowPrintModal(true);
  };

  const handleTriggerBrowserPrint = () => {
    window.print();
  };

  // =========================================================================
  // 6. SLOT CREATION & CONFLICT VALIDATION
  // =========================================================================
  const validateSlotLive = async () => {
    if (!slotForm.grade || !slotForm.dayOfWeek || !slotForm.periodNumber) return;
    setIsValidating(true);
    try {
      const res = await validateTimetableSlot(slotForm, slotForm.id);
      if (res.data) {
        if (!res.data.valid && res.data.conflicts.length > 0) {
          const hardClash = res.data.conflicts.find((c: any) => c.type === 'teacher_clash' || c.type === 'room_clash');
          if (hardClash) {
            setClashError(hardClash.message);
          } else {
            setClashError(null);
          }
          const warn = res.data.conflicts.find((c: any) => c.type === 'overload_warning');
          setClashWarning(warn ? warn.message : null);
        } else {
          setClashError(null);
          setClashWarning(null);
        }
      }
    } catch {
      // Fallback
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
        onShowToast('success', 'Slot Saved! 📅', `Period ${slotForm.periodNumber} (${slotForm.subjectName}) updated.`);
        setShowAddModal(false);
        loadClassTimetable();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Could not save timetable slot.';
      onShowToast('error', 'Save Failed', msg);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm('Are you sure you want to remove this timetable period slot?')) return;
    try {
      const res = await deleteTimetableSlot(id);
      if (res.data?.success) {
        onShowToast('success', 'Slot Removed', 'Timetable slot deleted successfully.');
        loadClassTimetable();
      }
    } catch {
      onShowToast('error', 'Delete Failed', 'Could not delete slot.');
    }
  };

  const getSlotForDayAndPeriod = (day: string, periodNum: number): ErpTimetableSlot | undefined => {
    return slots.find(s => s.dayOfWeek.toLowerCase() === day.toLowerCase() && s.periodNumber === periodNum);
  };

  const selectedTeacher = staffList.find(s => s.id === selectedTeacherId) || teacherSchedule?.teacher;

  // Find logged-in teacher's current teaching slot
  const teacherCurrentSlot = useMemo(() => {
    if (!activePeriod || !teacherSchedule?.routine) return null;
    return teacherSchedule.routine.find(s => s.dayOfWeek === currentDayName && s.periodNumber === activePeriod.periodNumber);
  }, [activePeriod, teacherSchedule, currentDayName]);

  const teacherNextSlot = useMemo(() => {
    if (!nextPeriod || !teacherSchedule?.routine) return null;
    return teacherSchedule.routine.find(s => s.dayOfWeek === currentDayName && s.periodNumber === nextPeriod.periodNumber);
  }, [nextPeriod, teacherSchedule, currentDayName]);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. MASTER LIVE PERIOD TICKER & IST CLOCK BANNER (Real Time, Demo Nahi) */}
      {/* ========================================================================= */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-800 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-cyan-500/20">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Timetable & Period Scheduling Engine
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                  {activeSession}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Real Indian Standard Time (IST) bell synchronization, teacher routine matrix, conflict guard & notice-board printing.
              </p>
            </div>
          </div>
        </div>

        {/* Live IST Real-time Status Card */}
        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
          {/* Real IST Clock */}
          <div className="px-3.5 py-2 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center gap-2 font-mono text-xs shadow-inner">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <div className="text-[10px] uppercase text-slate-400 font-bold">IST Clock</div>
              <div className="text-xs font-bold text-white tracking-wider">{currentIstTime || 'Connecting IST...'}</div>
            </div>
          </div>

          {/* Live Bell & Countdown Card */}
          <div className="px-4 py-2 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-cyan-500/40 flex items-center gap-3 font-mono text-xs shadow-lg shadow-cyan-950/40 flex-1 sm:flex-initial">
            <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-300">
              <BellRing className="w-4 h-4 text-cyan-400 animate-bounce" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1.5">
                <span>{currentDayName} Bell Pulse</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-900/60 text-cyan-200 uppercase font-mono">LIVE</span>
              </div>
              <div className="text-xs font-bold text-white truncate max-w-[260px] sm:max-w-[320px]">
                {livePeriodLabel}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {livePeriodSubtext}
              </div>
            </div>
            {liveSecondsRemaining > 0 && (
              <div className="text-right pl-2 border-l border-slate-800">
                <div className="text-[9px] uppercase text-slate-400">Remaining</div>
                <div className="text-xs font-black text-emerald-400 font-mono tracking-tight whitespace-nowrap">
                  {formatTimeRemaining(liveSecondsRemaining)}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions for Admin */}
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
                  teacherId: staffList[0]?.id || 'stf-02',
                  teacherName: staffList[0]?.name || 'Faculty',
                  roomNumber: '201',
                  slotType: 'regular'
                });
                setClashError(null);
                setClashWarning(null);
                setShowAddModal(true);
              }}
              className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
              title="Add New Classroom Period Slot"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Slot</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. NAVIGATION WORKSPACE TABS */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2.5 rounded-2xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'matrix'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Class Timetable Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('teacher')}
          className={`px-4 py-2.5 rounded-2xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'teacher'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{activeRole === 'teacher' ? 'My Teaching Routine 👨‍🏫' : 'Faculty Workload & Diary'}</span>
        </button>

        <button
          onClick={() => setActiveTab('bell')}
          className={`px-4 py-2.5 rounded-2xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'bell'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Bell Timing & Periods Engine 🔔</span>
        </button>

        <button
          onClick={() => setActiveTab('substitution')}
          className={`px-4 py-2.5 rounded-2xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'substitution'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Smart Substitutions Desk</span>
        </button>

        <button
          onClick={() => setActiveTab('rooms')}
          className={`px-4 py-2.5 rounded-2xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'rooms'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Rooms & Labs Catalog</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. TAB 1: CLASS TIMETABLE MATRIX (WITH EXCEL & PDF EXPORT) */}
      {/* ========================================================================= */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          {/* Filter Bar with Excel & PDF Print Action Buttons */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">Classroom:</span>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {ALL_GRADES.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>

              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {ALL_SECTIONS.map(s => (
                  <option key={s} value={s}>Section {s}</option>
                ))}
              </select>

              <span className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs font-mono">
                Allocated Periods: <strong className="text-white">{slots.length}</strong>
              </span>
            </div>

            {/* Excel & PDF Generation Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportExcelClass}
                className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                title="Export Class Timetable to Microsoft Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={handlePrintClass}
                className="px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                title="Print Class Timetable for Notice Board / PDF"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-400" />
                <span>Print Timetable (PDF)</span>
              </button>

              <button
                type="button"
                onClick={loadClassTimetable}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                title="Refresh Slots"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingSlots ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Interactive Weekly Matrix Grid */}
          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400">
                    <th className="p-3.5 min-w-[130px] font-bold uppercase tracking-wider border-r border-slate-800/80">
                      Day / Bell
                    </th>
                    {regularPeriods.map((pNum) => {
                      const bell = bellSchedule.find(b => b.periodNumber === pNum) || {
                        startTime: `${String(8 + Math.floor(pNum * 0.75)).padStart(2, '0')}:00`,
                        endTime: `${String(8 + Math.floor((pNum + 1) * 0.75)).padStart(2, '0')}:00`
                      };
                      const isCurrentPeriod = activePeriod?.periodNumber === pNum;
                      return (
                        <th
                          key={pNum}
                          className={`p-3 min-w-[155px] font-bold border-r border-slate-800/80 transition-colors ${
                            isCurrentPeriod ? 'bg-cyan-950/40 text-cyan-300 border-b-2 border-b-cyan-400' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>Period {pNum}</span>
                            {isCurrentPeriod && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
                          </div>
                          <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                            {bell.startTime} - {bell.endTime}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody>
                  {daysOfWeek.map((day) => {
                    const isToday = currentDayName.toLowerCase() === day.toLowerCase();
                    return (
                      <tr
                        key={day}
                        className={`border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors ${
                          isToday ? 'bg-indigo-950/10' : ''
                        }`}
                      >
                        <td className="p-3.5 font-bold text-white border-r border-slate-800/80 bg-slate-950/70">
                          <div className="flex items-center gap-1.5">
                            <span>{day}</span>
                            {isToday && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                                TODAY
                              </span>
                            )}
                          </div>
                        </td>

                        {regularPeriods.map((pNum) => {
                          const slot = getSlotForDayAndPeriod(day, pNum);
                          const isLiveSlot = isToday && activePeriod?.periodNumber === pNum;
                          return (
                            <td
                              key={pNum}
                              className={`p-2 border-r border-slate-800/60 align-top transition-colors ${
                                isLiveSlot ? 'bg-cyan-950/30 ring-1 ring-inset ring-cyan-500/40' : ''
                              }`}
                            >
                              {slot ? (
                                <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1 relative group hover:border-cyan-500/50 transition-all shadow-sm">
                                  <div className="flex items-center justify-between">
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30 truncate max-w-[90px]">
                                      {slot.subjectCode || 'CBSE'}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      Rm {slot.roomNumber || '201'}
                                    </span>
                                  </div>

                                  <div className="font-bold text-white text-xs truncate" title={slot.subjectName}>
                                    {slot.subjectName}
                                  </div>

                                  <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                                    <Users className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                                    <span>{slot.teacherName || 'Faculty'}</span>
                                  </div>

                                  {activeRole === 'admin' && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSlot(slot.id)}
                                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity cursor-pointer"
                                      title="Remove Slot"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="h-full min-h-[64px] border border-dashed border-slate-800/80 rounded-2xl flex items-center justify-center text-slate-700 hover:border-slate-700 hover:text-slate-500 transition-colors">
                                  {activeRole === 'admin' ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSlotForm({
                                          grade: selectedGrade,
                                          section: selectedSection,
                                          dayOfWeek: day,
                                          periodNumber: pNum,
                                          subjectName: '',
                                          subjectCode: '',
                                          teacherId: staffList[0]?.id || 'stf-02',
                                          teacherName: staffList[0]?.name || 'Faculty',
                                          roomNumber: '201',
                                          slotType: 'regular'
                                        });
                                        setShowAddModal(true);
                                      }}
                                      className="w-full h-full p-2 flex items-center justify-center text-[10px] font-mono text-slate-600 hover:text-cyan-400 cursor-pointer"
                                    >
                                      + Slot
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-slate-700">Free</span>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB 2: FACULTY WORKLOAD & DIARY (WITH TEACHER LOGIN AUTO-SELECT) */}
      {/* ========================================================================= */}
      {activeTab === 'teacher' && (
        <div className="space-y-6">
          {/* Faculty Header Bar */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-mono text-slate-400 font-bold uppercase">
                {activeRole === 'teacher' ? 'Your Profile:' : 'Select Faculty Member:'}
              </span>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                disabled={activeRole === 'teacher' && staffList.length <= 1}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {staffList.filter(s => s.role === 'teacher' || s.staffType === 'Teacher' || s.id === 'stf-02' || s.id === selectedTeacherId).map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.designation})
                  </option>
                ))}
              </select>
            </div>

            {/* Excel & PDF Print Action Buttons for Teacher Routine */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportExcelTeacher}
                className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                title="Export Faculty Schedule to Microsoft Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Teacher Excel</span>
              </button>

              <button
                type="button"
                onClick={handlePrintTeacher}
                className="px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                title="Print Teacher Diary & Routine Sheet (PDF)"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-400" />
                <span>Print Teacher Diary</span>
              </button>

              <button
                type="button"
                onClick={() => loadTeacherSchedule(selectedTeacherId)}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                title="Refresh Schedule"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingTeacher ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Teacher Real-time Status Card (Demo Nahi) */}
          {selectedTeacher && (
            <div className="p-4 rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950/60 to-slate-900 border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-lg shadow-md shrink-0">
                  {selectedTeacher.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base">{selectedTeacher.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                      {(selectedTeacher as any).empId || 'FAC-01'}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs font-mono">
                    {selectedTeacher.designation} • {selectedTeacher.department}
                  </p>
                </div>
              </div>

              {/* Right: Live Current Class in IST */}
              <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center gap-3 w-full md:w-auto font-mono text-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                <div>
                  <div className="text-[10px] text-cyan-400 uppercase font-bold">
                    Right Now ({currentDayName} in IST):
                  </div>
                  <div className="text-xs font-bold text-white">
                    {teacherCurrentSlot ? (
                      <span>Teaching {teacherCurrentSlot.grade}-{teacherCurrentSlot.section} • {teacherCurrentSlot.subjectName} (Rm {teacherCurrentSlot.roomNumber})</span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Coffee className="w-3.5 h-3.5" /> Free / Lesson Planning Period (Staff Room)
                      </span>
                    )}
                  </div>
                  {teacherNextSlot && (
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Next: Period {teacherNextSlot.periodNumber} ({teacherNextSlot.grade}-{teacherNextSlot.section}, {teacherNextSlot.subjectName})
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {teacherSchedule && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Workload Stats Card */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 font-mono text-xs">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Weekly Workload Capacity</span>
                    <span className="font-bold text-white">{teacherSchedule.weeklyPeriodsCount} / {teacherSchedule.maxWeeklyPeriods} Periods ({teacherSchedule.utilizationPercent}%)</span>
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
                      style={{ width: `${Math.min(100, teacherSchedule.utilizationPercent)}%` }}
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

                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-[11px]">
                  <span className="text-slate-400">Total Free Periods Available: </span>
                  <strong className="text-emerald-400 font-bold">{teacherSchedule.freePeriodsCount} Periods / Week</strong>
                </div>
              </div>

              {/* Weekly Assigned Routine */}
              <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    <span>Weekly Teaching Roster ({teacherSchedule.routine.length} Assigned Periods)</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                  {teacherSchedule.routine.map((slot) => {
                    const isSlotToday = currentDayName.toLowerCase() === slot.dayOfWeek.toLowerCase();
                    return (
                      <div
                        key={slot.id}
                        className={`p-3.5 rounded-2xl border space-y-1.5 transition-all shadow-sm ${
                          isSlotToday
                            ? 'bg-indigo-950/30 border-indigo-500/40'
                            : 'bg-slate-950/80 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                            {slot.dayOfWeek} • Period {slot.periodNumber}
                          </span>
                          <span className="text-[10px] text-slate-400">Rm {slot.roomNumber || '201'}</span>
                        </div>
                        <div className="font-bold text-white text-sm">{slot.subjectName}</div>
                        <div className="text-[10px] text-slate-400">
                          Class: <strong className="text-slate-200">{slot.grade}-{slot.section}</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 3: BELL TIMING & PERIOD DURATION RE-SET ENGINE */}
      {/* ========================================================================= */}
      {activeTab === 'bell' && (
        <div className="space-y-6">
          {/* Header Card with Quick Presets */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 font-mono text-xs">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  <span>Daily Bell Schedule & Period Timing Engine</span>
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  Dictates school bell rings, assembly timings, class duration, recess intervals, and real-time live tickers across all student and teacher portals.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {activeRole === 'admin' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditingBellMode(!isEditingBellMode)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                        isEditingBellMode
                          ? 'bg-slate-800 text-slate-300 border border-slate-700'
                          : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-cyan-500/20'
                      }`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{isEditingBellMode ? 'Preview Mode' : 'Edit Bell Timings ✏️'}</span>
                    </button>

                    {isEditingBellMode && (
                      <button
                        type="button"
                        onClick={handleSaveBellSchedule}
                        disabled={savingBellSchedule}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>{savingBellSchedule ? 'Saving...' : 'Save & Apply Bell Schedule 💾'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleResetBellScheduleToDefault}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
                      title="Reset to Factory CBSE Schedule"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                      <span>Reset</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Presets Row */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Official Institutional Timing Presets (1-Click Re-set):
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Object.entries(PRESET_BELL_SCHEDULES).map(([key, preset]) => {
                  const Icon = preset.icon;
                  const isSelected = activePresetKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleApplyPreset(key)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500/60 shadow-md shadow-cyan-500/10'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                        <h4 className={`font-bold text-xs ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {preset.name}
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                        {preset.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bell Schedule Interactive Periods Table */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 font-mono text-xs shadow-xl">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Configured Daily Bell Slots ({isEditingBellMode ? editingBellSchedule.length : bellSchedule.length} Slots)</span>
                {isEditingBellMode && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    EDIT MODE ACTIVE
                  </span>
                )}
              </h4>

              {isEditingBellMode && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddPeriodToBellSchedule(false)}
                    className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Period
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPeriodToBellSchedule(true)}
                    className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Coffee className="w-3 h-3" /> Add Break
                  </button>
                </div>
              )}
            </div>

            {/* List of Periods */}
            <div className="space-y-2.5">
              {(isEditingBellMode ? editingBellSchedule : bellSchedule).map((bell, idx) => {
                const isCurrentActive = activePeriod?.periodNumber === bell.periodNumber;
                return (
                  <div
                    key={bell.id || idx}
                    className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                      bell.isBreak
                        ? 'bg-amber-950/20 border-amber-500/30'
                        : isCurrentActive
                        ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400/50'
                        : 'bg-slate-950/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                        bell.isBreak ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-white'
                      }`}>
                        {bell.periodNumber === 0 ? '0' : bell.periodNumber === 99 ? '🍱' : bell.periodNumber}
                      </span>

                      {isEditingBellMode ? (
                        <div className="flex flex-wrap items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={bell.label}
                            onChange={(e) => handleUpdateEditingPeriod(idx, 'label', e.target.value)}
                            placeholder="Period Label"
                            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono font-bold w-48"
                          />
                          <select
                            value={bell.periodType}
                            onChange={(e) => handleUpdateEditingPeriod(idx, 'periodType', e.target.value)}
                            className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-[11px] font-mono cursor-pointer"
                          >
                            <option value="regular">Regular Teaching</option>
                            <option value="assembly">Assembly</option>
                            <option value="recess">Recess / Break</option>
                            <option value="lab">Laboratory</option>
                            <option value="activity">Club / Activity</option>
                            <option value="zero_period">Zero Period</option>
                          </select>
                          <label className="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={bell.isBreak}
                              onChange={(e) => handleUpdateEditingPeriod(idx, 'isBreak', e.target.checked)}
                              className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                            />
                            <span>Is Break</span>
                          </label>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-xs">{bell.label}</h4>
                            {isCurrentActive && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
                                LIVE ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="text-slate-400 text-[10px]">
                            Type: {bell.periodType} • Duration: {bell.durationMinutes} minutes
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                      {isEditingBellMode ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={bell.startTime}
                            onChange={(e) => handleUpdateEditingPeriod(idx, 'startTime', e.target.value)}
                            className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 text-xs font-mono font-bold cursor-pointer"
                          />
                          <span className="text-slate-500">–</span>
                          <input
                            type="time"
                            value={bell.endTime}
                            onChange={(e) => handleUpdateEditingPeriod(idx, 'endTime', e.target.value)}
                            className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 text-xs font-mono font-bold cursor-pointer"
                          />
                          <span className="text-[10px] text-slate-400 w-12 text-center">
                            {bell.durationMinutes}m
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeletePeriodFromBellSchedule(idx)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete Period"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-right">
                          <span className="font-bold text-cyan-300 text-xs tracking-wider">
                            {bell.startTime} – {bell.endTime}
                          </span>
                          <p className="text-[10px] text-slate-400">
                            {bell.durationMinutes} mins {bell.isBreak && '• School Break'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB 4: SMART AUTO-SUBSTITUTION DESK */}
      {/* ========================================================================= */}
      {activeTab === 'substitution' && (
        <div className="space-y-6">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400 font-bold uppercase">Inspection Date:</span>
              <input
                type="date"
                value={subDate}
                onChange={(e) => setSubDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
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

          {absentTeachers.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span className="text-rose-200">
                  Absent / On-Leave Faculty: <strong>{absentTeachers.map(t => t.name).join(', ')}</strong>
                </span>
              </div>
              <span className="text-[10px] text-rose-400 uppercase font-bold">Auto Substitution Active</span>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Recommended Substitutions for Uncovered Periods</span>
            </h3>

            {recommendations.length === 0 ? (
              <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center font-mono text-xs text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-white font-bold">All Periods Fully Covered!</p>
                <p>No faculty absences require substitute assignment on this date.</p>
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
                        <p className="text-slate-400 text-[10px]">Class: {rec.grade}-{rec.section}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-rose-400 font-bold block">Absent Faculty:</span>
                        <span className="text-xs text-slate-200 font-bold">{rec.absentTeacherName}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[10px] uppercase font-bold text-cyan-400">Available Free Faculty Candidates:</div>
                      {(rec.candidates || []).map((cand: any) => (
                        <div key={cand.teacherId || cand.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
                          <div>
                            <span className="font-bold text-white">{cand.teacherName || cand.name}</span>
                            <span className="text-slate-400 text-[10px] ml-2">({cand.subjectSpecialization || 'Core'})</span>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const res = await assignTeacherSubstitution({
                                  date: subDate,
                                  dayOfWeek: rec.dayOfWeek,
                                  periodNumber: rec.periodNumber,
                                  absentTeacherId: rec.absentTeacherId,
                                  absentTeacherName: rec.absentTeacherName,
                                  substituteTeacherId: cand.teacherId || cand.id,
                                  substituteTeacherName: cand.teacherName || cand.name,
                                  grade: rec.grade,
                                  section: rec.section,
                                  subjectName: rec.subjectName,
                                  reason: 'casual_leave'
                                });
                                if (res.data?.success) {
                                  onShowToast('success', 'Substitution Assigned! 📋', `${cand.teacherName || cand.name} assigned for Period ${rec.periodNumber}`);
                                  loadSubstitutionsData();
                                }
                              } catch {
                                onShowToast('error', 'Assignment Failed', 'Could not assign substitution');
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] cursor-pointer"
                          >
                            Assign Slot
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TAB 5: ROOMS & LABS OCCUPANCY CATALOG */}
      {/* ========================================================================= */}
      {activeTab === 'rooms' && (
        <div className="space-y-6">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-bold uppercase">Filter Resource:</span>
              <select
                value={roomFilterType}
                onChange={(e) => setRoomFilterType(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
              >
                <option value="all">All Facilities</option>
                <option value="classroom">Standard Classrooms</option>
                <option value="physics_lab">Physics Labs</option>
                <option value="chemistry_lab">Chemistry Labs</option>
                <option value="biology_lab">Biology Labs</option>
                <option value="computer_lab">Computer & AI Labs</option>
                <option value="robotics_lab">ATAL Robotics Labs</option>
                <option value="library">Library Complex</option>
              </select>
            </div>
            <div className="text-slate-400">Total Tracked Rooms: <strong className="text-white">{rooms.length}</strong></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
            {rooms.map(room => (
              <div key={room.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    Room {room.roomNumber}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">Active</span>
                </div>
                <h4 className="font-bold text-white text-sm">{room.name}</h4>
                <p className="text-slate-400 text-[10px]">Capacity: {room.capacity} Students • {room.buildingWing}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL: PRINT PREVIEW & PDF NOTICE BOARD GENERATOR */}
      {/* ========================================================================= */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-4xl bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Controls Bar */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 font-mono text-xs">
                <Printer className="w-4 h-4 text-cyan-400" />
                <span className="font-bold">Institutional Document Print Preview</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTriggerBrowserPrint}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 text-white font-bold text-xs font-mono flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Body (Clean White Notice Board View) */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 font-sans text-slate-900">
              {/* Institutional Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950">
                  {schoolBrand?.schoolName || 'Dakshora Public Senior Secondary School'}
                </h2>
                <p className="text-xs font-mono text-slate-700">
                  Affiliated to {schoolBrand?.board || 'CBSE, New Delhi'} • Affiliation No: #{schoolBrand?.affiliationNo || 'CBSE-AFF-202611'} • UDISE Code: {(schoolBrand as any)?.udiseCode || '08120300412'}
                </p>
                <p className="text-xs font-semibold text-slate-600">
                  {schoolBrand?.address || 'Institutional Area, Knowledge Park, New Delhi - 110001'}
                </p>
                <div className="pt-2">
                  <span className="inline-block px-3 py-1 bg-slate-100 rounded-full text-xs font-black uppercase tracking-wider text-slate-900 border border-slate-300">
                    {printType === 'class'
                      ? `MASTER CLASS TIMETABLE — ${selectedGrade.toUpperCase()} (SECTION ${selectedSection})`
                      : `FACULTY TEACHING DIARY ROUTINE — ${(selectedTeacher?.name || 'FACULTY').toUpperCase()}`}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-500 pt-1">
                  Academic Session: {activeSession} • Printed on: {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {currentIstTime}
                </div>
              </div>

              {/* Printable Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-900 font-mono text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-900">
                      <th className="p-2 border-r border-slate-900 font-bold w-24">Period</th>
                      <th className="p-2 border-r border-slate-900 font-bold w-28">Timing</th>
                      {daysOfWeek.map(d => (
                        <th key={d} className="p-2 border-r border-slate-900 font-bold text-center">
                          {d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {regularPeriods.map(pNum => {
                      const bell = bellSchedule.find(b => b.periodNumber === pNum) || {
                        startTime: `${String(8 + Math.floor(pNum * 0.75)).padStart(2, '0')}:00`,
                        endTime: `${String(8 + Math.floor((pNum + 1) * 0.75)).padStart(2, '0')}:00`
                      };

                      return (
                        <React.Fragment key={pNum}>
                          {/* Recess Break insertion before period 5 */}
                          {pNum === 5 && (
                            <tr className="bg-slate-200 border-b border-slate-900 font-bold text-center">
                              <td className="p-2 border-r border-slate-900">RECESS</td>
                              <td className="p-2 border-r border-slate-900">11:10 – 11:45</td>
                              <td colSpan={6} className="p-2 tracking-widest text-slate-800">
                                🍱 MID-DAY NUTRITION & RECESS BREAK
                              </td>
                            </tr>
                          )}

                          <tr className="border-b border-slate-900">
                            <td className="p-2 border-r border-slate-900 font-bold bg-slate-50">
                              Period {pNum}
                            </td>
                            <td className="p-2 border-r border-slate-900 text-[11px] text-slate-700">
                              {bell.startTime} – {bell.endTime}
                            </td>

                            {daysOfWeek.map(d => {
                              if (printType === 'class') {
                                const slot = getSlotForDayAndPeriod(d, pNum);
                                return (
                                  <td key={d} className="p-2 border-r border-slate-900 align-top">
                                    {slot ? (
                                      <div>
                                        <div className="font-bold text-slate-950">{slot.subjectName}</div>
                                        <div className="text-[10px] text-slate-600">{slot.teacherName} (Rm {slot.roomNumber || '201'})</div>
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 text-[10px] italic">Free</span>
                                    )}
                                  </td>
                                );
                              } else {
                                const slot = (teacherSchedule?.routine || []).find(s => s.dayOfWeek === d && s.periodNumber === pNum);
                                return (
                                  <td key={d} className="p-2 border-r border-slate-900 align-top">
                                    {slot ? (
                                      <div>
                                        <div className="font-bold text-slate-950">{slot.grade}-{slot.section}</div>
                                        <div className="text-[11px] font-semibold text-slate-800">{slot.subjectName}</div>
                                        <div className="text-[10px] text-slate-600">Room {slot.roomNumber}</div>
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 text-[10px] italic">Free / Prep</span>
                                    )}
                                  </td>
                                );
                              }
                            })}
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Statutory Signatures Footer */}
              <div className="grid grid-cols-3 gap-6 pt-12 text-center text-xs font-mono font-bold border-t border-slate-300">
                <div>
                  <div className="w-36 border-t-2 border-slate-900 mx-auto mb-1"></div>
                  <span>Timetable Incharge</span>
                </div>
                <div>
                  <div className="w-36 border-t-2 border-slate-900 mx-auto mb-1"></div>
                  <span>Academic Coordinator</span>
                </div>
                <div>
                  <div className="w-36 border-t-2 border-slate-900 mx-auto mb-1"></div>
                  <span>Principal & Head of School</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. MODAL: ADD / EDIT PERIOD SLOT WITH REAL-TIME CLASH DETECTOR */}
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
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-xs font-mono text-slate-400 hover:text-white cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-4 font-mono text-xs">
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white cursor-pointer"
                  >
                    {ALL_GRADES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Section</label>
                  <select
                    value={slotForm.section}
                    onChange={(e) => setSlotForm({ ...slotForm, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white cursor-pointer"
                  >
                    {ALL_SECTIONS.map(s => (
                      <option key={s} value={s}>Section {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Day of Week</label>
                  <select
                    value={slotForm.dayOfWeek}
                    onChange={(e) => setSlotForm({ ...slotForm, dayOfWeek: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white cursor-pointer"
                  >
                    {daysOfWeek.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Period Number</label>
                  <select
                    value={slotForm.periodNumber}
                    onChange={(e) => setSlotForm({ ...slotForm, periodNumber: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white cursor-pointer"
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
                  placeholder="e.g. Mathematics, Physics, Chemistry Lab, Computer AI"
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white cursor-pointer"
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white cursor-pointer"
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white cursor-pointer"
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
                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all mt-2 cursor-pointer ${
                  clashError
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/20 active:scale-95'
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
