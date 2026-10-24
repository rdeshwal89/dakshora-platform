import React, { useState, useEffect, useMemo } from 'react';
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
  HelpCircle,
  GraduationCap
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
    desc: '8 Teaching periods (40-45m) + Morning Assembly (25m) + Lunch Recess (35m) + Activity/Club period',
    icon: Building2,
    periods: [
      { id: 'bell-0', periodNumber: 0, label: 'Morning Assembly & Homeroom', startTime: '07:50', endTime: '08:15', durationMinutes: 25, isBreak: true, periodType: 'assembly' },
      { id: 'bell-1', periodNumber: 1, label: 'Period 1', startTime: '08:15', endTime: '09:00', durationMinutes: 45, isBreak: false, periodType: 'regular' },
      { id: 'bell-2', periodNumber: 2, label: 'Period 2', startTime: '09:00', endTime: '09:45', durationMinutes: 45, isBreak: false, periodType: 'regular' },
      { id: 'bell-3', periodNumber: 3, label: 'Period 3', startTime: '09:45', endTime: '10:30', durationMinutes: 45, isBreak: false, periodType: 'regular' },
      { id: 'bell-4', periodNumber: 4, label: 'Period 4', startTime: '10:30', endTime: '11:10', durationMinutes: 40, isBreak: false, periodType: 'regular' },
      { id: 'bell-recess', periodNumber: 99, label: 'Lunch & Nutrition Recess Break', startTime: '11:10', endTime: '11:45', durationMinutes: 35, isBreak: true, periodType: 'recess' },
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
    desc: 'Dense fog & cold wave mitigation routine with late morning start and extended afternoon interval',
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
      { id: 'bell-win-8', periodNumber: 8, label: 'Period 8 (Doubt Clearing & Clubs)', startTime: '14:10', endTime: '14:45', durationMinutes: 35, isBreak: false, periodType: 'activity' }
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
  const [activeTab, setActiveTab] = useState<'matrix' | 'teacher' | 'bell' | 'substitution' | 'rooms'>(() => {
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
  const [selectedGrade, setSelectedGrade] = useState<string>(() => {
    return (currentUser?.grade && ALL_GRADES.includes(currentUser.grade)) ? currentUser.grade : 'Class 10';
  });
  const [selectedSection, setSelectedSection] = useState<string>(() => {
    return currentUser?.section || 'A';
  });
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
        setLivePeriodSubtext('Campus academic operations resume on Monday morning');
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
          setLivePeriodLabel(`📖 Period ${active.periodNumber}: ${active.label} (${active.startTime} – ${active.endTime})`);
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
          setLivePeriodLabel('🏫 Before School Hours');
          setLivePeriodSubtext(`First Bell (${firstB?.label || 'Assembly'}) begins at ${firstB?.startTime || '07:50 AM'}`);
          setActivePeriod(null);
          setNextPeriod(firstB || null);
        } else if (totalSecs >= lastSecs) {
          setLiveStatusType('school_over');
          setLiveSecondsRemaining(0);
          setLivePeriodLabel('🏁 School Hours Completed');
          setLivePeriodSubtext(`Academic bell concluded at ${lastB?.endTime || '02:35 PM'} • Have a productive evening!`);
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
      for (let i = 0; i < editingBellSchedule.length - 1; i++) {
        const cur = editingBellSchedule[i];
        if (cur.startTime >= cur.endTime) {
          onShowToast('error', 'Timing Error', `${cur.label}: End time must be after Start time.`);
          setSavingBellSchedule(false);
          return;
        }
      }

      await updateErpBellSchedule(editingBellSchedule, PRESET_BELL_SCHEDULES[activePresetKey]?.name || 'Custom');
      setBellSchedule(editingBellSchedule);
      setIsEditingBellMode(false);
      localStorage.setItem('dakshora_custom_bell_schedule', JSON.stringify(editingBellSchedule));

      onShowToast('success', 'Bell Schedule Updated! 🔔', `Successfully applied ${editingBellSchedule.length} periods. Live clock updated.`);
    } catch {
      setBellSchedule(editingBellSchedule);
      setIsEditingBellMode(false);
      localStorage.setItem('dakshora_custom_bell_schedule', JSON.stringify(editingBellSchedule));
      onShowToast('success', 'Bell Schedule Saved! 🔔', 'Active bell timings updated in institutional memory.');
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
  // 4. EXCEL EXPORT ENGINE (.xlsx)
  // =========================================================================
  const handleExportExcelClass = () => {
    try {
      const wb = XLSX.utils.book_new();
      const schoolTitle = schoolBrand?.schoolName || 'Dakshora Public Senior Secondary School';

      const wsData: any[][] = [
        [schoolTitle.toUpperCase()],
        [`MASTER CLASS TIMETABLE: ${selectedGrade.toUpperCase()} - SECTION ${selectedSection}`],
        [`Academic Session: ${activeSession} | Affiliation: ${schoolBrand?.affiliationNo || 'CBSE-AFF-202611'} | Board: ${schoolBrand?.board || 'CBSE'}`],
        [],
        ['Period', 'Timing', ...daysOfWeek]
      ];

      regularPeriods.forEach(pNum => {
        const bell = bellSchedule.find(b => b.periodNumber === pNum) || {
          startTime: `${String(8 + Math.floor(pNum * 0.75)).padStart(2, '0')}:00`,
          endTime: `${String(8 + Math.floor((pNum + 1) * 0.75)).padStart(2, '0')}:00`
        };

        if (pNum === 5) {
          wsData.push(['RECESS', '11:10 - 11:45', 'LUNCH & RECESS BREAK', 'LUNCH & RECESS BREAK', 'LUNCH & RECESS BREAK', 'LUNCH & RECESS BREAK', 'LUNCH & RECESS BREAK', 'LUNCH & RECESS BREAK']);
        }

        const row: any[] = [`Period ${pNum}`, `${bell.startTime} - ${bell.endTime}`];
        daysOfWeek.forEach(day => {
          const slot = slots.find(s => s.dayOfWeek === day && s.periodNumber === pNum);
          row.push(slot ? `${slot.subjectName} (${slot.teacherName} - Rm ${slot.roomNumber || '201'})` : 'Free');
        });
        wsData.push(row);
      });

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [{ wch: 12 }, { wch: 16 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, ws, `${selectedGrade}_Sec_${selectedSection}`);
      XLSX.writeFile(wb, `Timetable_${selectedGrade.replace(/\s+/g, '_')}_Sec_${selectedSection}_${activeSession}.xlsx`);

      onShowToast('success', 'Excel Export Complete', 'Class timetable downloaded as Microsoft Excel (.xlsx).');
    } catch {
      onShowToast('error', 'Export Failed', 'Could not generate Excel spreadsheet.');
    }
  };

  const handleExportExcelTeacher = () => {
    if (!teacherSchedule) {
      onShowToast('warning', 'No Teacher Data', 'Select a faculty member with assigned periods.');
      return;
    }
    try {
      const wb = XLSX.utils.book_new();
      const schoolTitle = schoolBrand?.schoolName || 'Dakshora Public Senior Secondary School';
      const teacherName = selectedTeacher?.name || 'Faculty Member';

      const wsData: any[][] = [
        [schoolTitle.toUpperCase()],
        [`FACULTY TEACHING DIARY ROUTINE: ${teacherName.toUpperCase()}`],
        [`Designation: ${selectedTeacher?.designation || 'Teacher'} | Dept: ${selectedTeacher?.department || 'Academics'} | Session: ${activeSession}`],
        [`Weekly Workload: ${teacherSchedule.weeklyPeriodsCount} / ${teacherSchedule.maxWeeklyPeriods} Periods (${teacherSchedule.utilizationPercent}% Capacity)`],
        [],
        ['Period', 'Timing', ...daysOfWeek]
      ];

      regularPeriods.forEach(pNum => {
        const bell = bellSchedule.find(b => b.periodNumber === pNum) || {
          startTime: `${String(8 + Math.floor(pNum * 0.75)).padStart(2, '0')}:00`,
          endTime: `${String(8 + Math.floor((pNum + 1) * 0.75)).padStart(2, '0')}:00`
        };

        if (pNum === 5) {
          wsData.push(['RECESS', '11:10 - 11:45', 'RECESS', 'RECESS', 'RECESS', 'RECESS', 'RECESS', 'RECESS']);
        }

        const row: any[] = [`Period ${pNum}`, `${bell.startTime} - ${bell.endTime}`];
        daysOfWeek.forEach(day => {
          const slot = (teacherSchedule.routine || []).find(s => s.dayOfWeek === day && s.periodNumber === pNum);
          row.push(slot ? `${slot.grade}-${slot.section}: ${slot.subjectName} (Rm ${slot.roomNumber || '201'})` : 'Free / Prep');
        });
        wsData.push(row);
      });

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [{ wch: 12 }, { wch: 16 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, ws, teacherName.slice(0, 25));
      XLSX.writeFile(wb, `Faculty_Routine_${teacherName.replace(/\s+/g, '_')}_${activeSession}.xlsx`);

      onShowToast('success', 'Excel Export Complete', 'Teacher routine downloaded as Microsoft Excel (.xlsx).');
    } catch {
      onShowToast('error', 'Export Failed', 'Could not generate teacher Excel file.');
    }
  };

  // =========================================================================
  // 5. PRINT & NOTICE BOARD ENGINE (PDF PREVIEW)
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
  // 6. SLOT MANAGEMENT & CLASH VALIDATION
  // =========================================================================
  const validateSlotLive = async () => {
    if (!slotForm.dayOfWeek || !slotForm.periodNumber) return;
    setIsValidating(true);
    setClashError(null);
    setClashWarning(null);

    try {
      const res = await validateTimetableSlot({
        id: slotForm.id,
        grade: slotForm.grade || selectedGrade,
        section: slotForm.section || selectedSection,
        dayOfWeek: slotForm.dayOfWeek,
        periodNumber: slotForm.periodNumber,
        teacherId: slotForm.teacherId || '',
        roomNumber: slotForm.roomNumber || ''
      });

      if (!res.data?.valid) {
        if (res.data?.clashes?.some((c: any) => c.type === 'teacher_clash')) {
          setClashError(res.data.clashes.find((c: any) => c.type === 'teacher_clash').message);
        } else if (res.data?.clashes?.some((c: any) => c.type === 'room_clash')) {
          setClashWarning(res.data.clashes.find((c: any) => c.type === 'room_clash').message);
        }
      }
    } catch {
      // Offline fallback validation against current slots
      const existingInClass = slots.find(s =>
        s.dayOfWeek === slotForm.dayOfWeek &&
        s.periodNumber === slotForm.periodNumber &&
        s.id !== slotForm.id
      );
      if (existingInClass) {
        setClashWarning(`Replaces existing ${existingInClass.subjectName} (${existingInClass.teacherName}) in this period.`);
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveSlot = async () => {
    if (!slotForm.subjectName || !slotForm.teacherId) {
      onShowToast('warning', 'Incomplete Form', 'Subject Name and Teacher assignment are required.');
      return;
    }

    try {
      const selectedT = staffList.find(s => s.id === slotForm.teacherId);
      const payload: Partial<ErpTimetableSlot> = {
        ...slotForm,
        grade: selectedGrade,
        section: selectedSection,
        teacherName: selectedT?.name || slotForm.teacherName || 'Faculty',
        academicSession: activeSession
      };

      const res = await createOrUpdateTimetableSlot(payload);
      if (res.data?.slot) {
        setSlots(prev => {
          const filtered = prev.filter(s => !(s.dayOfWeek === payload.dayOfWeek && s.periodNumber === payload.periodNumber));
          return [...filtered, res.data.slot];
        });
        setShowAddModal(false);
        onShowToast('success', 'Period Assigned', `${payload.subjectName} allocated to Period ${payload.periodNumber} (${payload.dayOfWeek}).`);
      }
    } catch {
      onShowToast('error', 'Save Failed', 'Could not allocate period slot.');
    }
  };

  const handleDeleteSlot = async (slotId: string, subjectName: string) => {
    if (!window.confirm(`Remove ${subjectName} period from ${selectedGrade} Section ${selectedSection}?`)) return;
    try {
      await deleteTimetableSlot(slotId);
      setSlots(prev => prev.filter(s => s.id !== slotId));
      onShowToast('info', 'Slot Removed', `${subjectName} removed from class schedule.`);
    } catch {
      onShowToast('error', 'Error', 'Could not delete slot.');
    }
  };

  const handleAssignSubstitute = async (rec: ErpSubstitutionRecommendation) => {
    try {
      await assignTeacherSubstitution({
        date: subDate,
        originalTeacherId: rec.absentTeacherId,
        substituteTeacherId: rec.recommendedSubstituteId,
        slotId: rec.slotId,
        dayOfWeek: rec.dayOfWeek,
        periodNumber: rec.periodNumber,
        grade: rec.grade,
        section: rec.section,
        subjectName: rec.subjectName,
        roomNumber: rec.roomNumber
      });

      onShowToast('success', 'Substitute Assigned! 🤝', `${rec.recommendedSubstituteName} assigned to Period ${rec.periodNumber} (${rec.grade}-${rec.section}).`);
      loadSubstitutionsData();
    } catch {
      onShowToast('error', 'Assignment Failed', 'Could not assign substitute teacher.');
    }
  };

  // Helper: Retrieve slot for a given day and period
  const getSlotForDayAndPeriod = (day: string, periodNumber: number) => {
    return slots.find(s => s.dayOfWeek === day && s.periodNumber === periodNumber);
  };

  const selectedTeacher = useMemo(() => {
    return staffList.find(s => s.id === selectedTeacherId) || staffList[0];
  }, [staffList, selectedTeacherId]);

  // Real-time Teacher Current Class check
  const teacherCurrentSlot = useMemo(() => {
    if (!teacherSchedule || !activePeriod || activePeriod.isBreak) return null;
    return (teacherSchedule.routine || []).find(s =>
      s.dayOfWeek === currentDayName && s.periodNumber === activePeriod.periodNumber
    );
  }, [teacherSchedule, activePeriod, currentDayName]);

  const teacherNextSlot = useMemo(() => {
    if (!teacherSchedule || !nextPeriod || nextPeriod.isBreak) return null;
    return (teacherSchedule.routine || []).find(s =>
      s.dayOfWeek === currentDayName && s.periodNumber === nextPeriod.periodNumber
    );
  }, [teacherSchedule, nextPeriod, currentDayName]);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. MASTER LIVE PERIOD TICKER & IST CLOCK BANNER (Real Time, White Card) */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-800 flex items-center justify-center shadow-xs">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-950 tracking-tight">
                  Timetable & Period Scheduling Engine
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-cyan-900 border border-cyan-200 font-mono">
                  {activeSession}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Real Indian Standard Time (IST) bell pulse, teacher routine matrix, conflict guard & notice-board printing.
              </p>
            </div>
          </div>
        </div>

        {/* Live IST Real-time Status Card */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Real IST Clock */}
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 font-mono text-xs shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <div className="text-[10px] uppercase text-slate-500 font-bold">IST Clock</div>
              <div className="text-xs font-black text-slate-950 tracking-wider">{currentIstTime || 'Connecting IST...'}</div>
            </div>
          </div>

          {/* Live Bell & Countdown Card */}
          <div className="px-4 py-2 rounded-xl bg-cyan-50/60 border border-cyan-200 flex items-center gap-3 font-mono text-xs shadow-xs flex-1 sm:flex-initial">
            <div className="p-1.5 rounded-lg bg-cyan-100 text-cyan-800">
              <BellRing className="w-4 h-4 text-cyan-700 animate-bounce" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-cyan-900 flex items-center gap-1.5">
                <span>{currentDayName} Bell Pulse</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-200 text-cyan-950 uppercase font-mono font-black">LIVE</span>
              </div>
              <div className="text-xs font-black text-slate-950 truncate max-w-[260px] sm:max-w-[320px]">
                {livePeriodLabel}
              </div>
              <div className="text-[10px] text-slate-600 truncate font-sans">
                {livePeriodSubtext}
              </div>
            </div>
            {liveSecondsRemaining > 0 && (
              <div className="text-right pl-3 border-l border-cyan-200">
                <div className="text-[9px] uppercase text-slate-500 font-bold">Remaining</div>
                <div className="text-xs font-black text-emerald-700 font-mono tracking-tight whitespace-nowrap">
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
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
              title="Add New Classroom Period Slot"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Add Period Slot</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. NAVIGATION WORKSPACE TABS */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'matrix'
              ? 'bg-cyan-600 text-white border border-cyan-700 shadow-xs'
              : 'bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Class Timetable Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('teacher')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'teacher'
              ? 'bg-cyan-600 text-white border border-cyan-700 shadow-xs'
              : 'bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{activeRole === 'teacher' ? 'My Teaching Routine 👨‍🏫' : 'Faculty Workload & Routine'}</span>
        </button>

        <button
          onClick={() => setActiveTab('bell')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'bell'
              ? 'bg-cyan-600 text-white border border-cyan-700 shadow-xs'
              : 'bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Bell Timing & Periods Engine 🔔</span>
        </button>

        <button
          onClick={() => setActiveTab('substitution')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'substitution'
              ? 'bg-cyan-600 text-white border border-cyan-700 shadow-xs'
              : 'bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Smart Substitutions Desk</span>
        </button>

        <button
          onClick={() => setActiveTab('rooms')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'rooms'
              ? 'bg-cyan-600 text-white border border-cyan-700 shadow-xs'
              : 'bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-50 border border-slate-200'
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
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Classroom:</span>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-950 focus:outline-none focus:border-cyan-600 cursor-pointer"
              >
                {ALL_GRADES.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>

              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-950 focus:outline-none focus:border-cyan-600 cursor-pointer"
              >
                {ALL_SECTIONS.map(s => (
                  <option key={s} value={s}>Section {s}</option>
                ))}
              </select>

              <span className="px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs font-mono font-bold">
                Allocated Periods: <strong className="text-cyan-900 font-black">{slots.length}</strong>
              </span>
            </div>

            {/* Excel & PDF Generation Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleExportExcelClass}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                title="Export Class Timetable to Microsoft Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Export Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={handlePrintClass}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                title="Print Class Timetable for Notice Board / PDF"
              >
                <Printer className="w-4 h-4 text-indigo-700" />
                <span>Print Timetable (PDF)</span>
              </button>

              <button
                type="button"
                onClick={loadClassTimetable}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                title="Refresh Slots"
              >
                <RefreshCw className={`w-4 h-4 ${loadingSlots ? 'animate-spin text-cyan-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Matrix Grid Table */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-800 font-bold">
                    <th className="p-3 border-r border-slate-200 w-32">Period & Time</th>
                    {daysOfWeek.map(d => (
                      <th
                        key={d}
                        className={`p-3 border-r border-slate-200 text-center ${
                          d === currentDayName ? 'bg-cyan-50/80 text-cyan-900 font-black' : ''
                        }`}
                      >
                        <div className="font-sans font-bold text-xs">{d}</div>
                        {d === currentDayName && (
                          <span className="text-[10px] text-cyan-800 uppercase font-mono font-bold">Today</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {/* Morning Assembly Row */}
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 text-xs font-bold">
                    <td className="p-3 border-r border-slate-200 font-mono">
                      <div className="font-black text-slate-900">Assembly</div>
                      <div className="text-[11px] text-slate-500 font-normal">07:50 – 08:15</div>
                    </td>
                    <td colSpan={6} className="p-3 text-center tracking-wider text-slate-700 font-semibold bg-slate-50">
                      🔔 Morning Assembly, Prayer & Daily Student Homeroom (School Grounds)
                    </td>
                  </tr>

                  {/* Regular Teaching Periods (1 to 4) */}
                  {[1, 2, 3, 4].map(pNum => {
                    const bell = bellSchedule.find(b => b.periodNumber === pNum) || {
                      startTime: `${String(8 + Math.floor(pNum * 0.75)).padStart(2, '0')}:00`,
                      endTime: `${String(8 + Math.floor((pNum + 1) * 0.75)).padStart(2, '0')}:00`
                    };
                    const isLivePeriod = activePeriod?.periodNumber === pNum;

                    return (
                      <tr
                        key={pNum}
                        className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${
                          isLivePeriod ? 'bg-cyan-50/40' : ''
                        }`}
                      >
                        <td className="p-3 border-r border-slate-200 font-mono bg-slate-50/40">
                          <div className="flex items-center gap-1.5 font-black text-slate-950">
                            {isLivePeriod && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                            <span>Period {pNum}</span>
                          </div>
                          <div className="text-[11px] text-slate-600 font-medium">
                            {bell.startTime} – {bell.endTime}
                          </div>
                        </td>

                        {daysOfWeek.map(d => {
                          const slot = getSlotForDayAndPeriod(d, pNum);
                          const isCurrentActive = isLivePeriod && d === currentDayName;

                          return (
                            <td
                              key={d}
                              className={`p-2.5 border-r border-slate-100 align-top transition-all ${
                                isCurrentActive ? 'bg-cyan-50 ring-1 ring-inset ring-cyan-400' : ''
                              }`}
                            >
                              {slot ? (
                                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-cyan-400 hover:shadow-xs transition-all relative group">
                                  <div className="font-bold text-slate-950 text-xs truncate">
                                    {slot.subjectName}
                                  </div>
                                  <div className="text-[11px] text-slate-600 truncate font-medium">
                                    {slot.teacherName}
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1 pt-1 border-t border-slate-200/60">
                                    <span>Rm {slot.roomNumber || '201'}</span>
                                    <span className="px-1 rounded bg-slate-200/80 text-slate-800 font-semibold uppercase text-[9px]">
                                      {slot.slotType || 'core'}
                                    </span>
                                  </div>

                                  {activeRole === 'admin' && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSlot(slot.id, slot.subjectName)}
                                      className="absolute top-1 right-1 p-1 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                      title="Remove Period Slot"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="h-14 flex items-center justify-center text-slate-400 text-xs font-mono italic">
                                  {activeRole === 'admin' ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSlotForm({
                                          grade: selectedGrade,
                                          section: selectedSection,
                                          dayOfWeek: d,
                                          periodNumber: pNum,
                                          subjectName: 'English',
                                          subjectCode: 'ENG-10',
                                          teacherId: staffList[0]?.id || 'stf-02',
                                          teacherName: staffList[0]?.name || 'Faculty',
                                          roomNumber: '201',
                                          slotType: 'regular'
                                        });
                                        setShowAddModal(true);
                                      }}
                                      className="w-full h-full rounded-xl border border-dashed border-slate-300 hover:border-cyan-500 hover:bg-cyan-50/50 flex items-center justify-center text-slate-400 hover:text-cyan-700 transition-colors text-xs font-bold"
                                    >
                                      <Plus className="w-3.5 h-3.5 mr-1" /> Assign
                                    </button>
                                  ) : (
                                    <span>Free</span>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}

                  {/* Lunch Recess Break */}
                  <tr className="bg-amber-50/70 border-b border-amber-200 text-amber-950 font-bold text-xs">
                    <td className="p-3 border-r border-slate-200 font-mono">
                      <div className="font-black text-amber-900">Recess</div>
                      <div className="text-[11px] text-amber-800 font-normal">11:10 – 11:45</div>
                    </td>
                    <td colSpan={6} className="p-3 text-center tracking-wider text-amber-950 font-black">
                      🍱 Mid-Day Nutrition & Lunch Recess Interval (Dining Hall & Campus Courtyard)
                    </td>
                  </tr>

                  {/* Regular Teaching Periods (5 to 8) */}
                  {[5, 6, 7, 8].map(pNum => {
                    const bell = bellSchedule.find(b => b.periodNumber === pNum) || {
                      startTime: `${String(11 + Math.floor(pNum * 0.75)).padStart(2, '0')}:00`,
                      endTime: `${String(11 + Math.floor((pNum + 1) * 0.75)).padStart(2, '0')}:00`
                    };
                    const isLivePeriod = activePeriod?.periodNumber === pNum;

                    return (
                      <tr
                        key={pNum}
                        className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${
                          isLivePeriod ? 'bg-cyan-50/40' : ''
                        }`}
                      >
                        <td className="p-3 border-r border-slate-200 font-mono bg-slate-50/40">
                          <div className="flex items-center gap-1.5 font-black text-slate-950">
                            {isLivePeriod && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                            <span>Period {pNum}</span>
                          </div>
                          <div className="text-[11px] text-slate-600 font-medium">
                            {bell.startTime} – {bell.endTime}
                          </div>
                        </td>

                        {daysOfWeek.map(d => {
                          const slot = getSlotForDayAndPeriod(d, pNum);
                          const isCurrentActive = isLivePeriod && d === currentDayName;

                          return (
                            <td
                              key={d}
                              className={`p-2.5 border-r border-slate-100 align-top transition-all ${
                                isCurrentActive ? 'bg-cyan-50 ring-1 ring-inset ring-cyan-400' : ''
                              }`}
                            >
                              {slot ? (
                                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-cyan-400 hover:shadow-xs transition-all relative group">
                                  <div className="font-bold text-slate-950 text-xs truncate">
                                    {slot.subjectName}
                                  </div>
                                  <div className="text-[11px] text-slate-600 truncate font-medium">
                                    {slot.teacherName}
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1 pt-1 border-t border-slate-200/60">
                                    <span>Rm {slot.roomNumber || '201'}</span>
                                    <span className="px-1 rounded bg-slate-200/80 text-slate-800 font-semibold uppercase text-[9px]">
                                      {slot.slotType || 'core'}
                                    </span>
                                  </div>

                                  {activeRole === 'admin' && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSlot(slot.id, slot.subjectName)}
                                      className="absolute top-1 right-1 p-1 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                      title="Remove Period Slot"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="h-14 flex items-center justify-center text-slate-400 text-xs font-mono italic">
                                  {activeRole === 'admin' ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSlotForm({
                                          grade: selectedGrade,
                                          section: selectedSection,
                                          dayOfWeek: d,
                                          periodNumber: pNum,
                                          subjectName: 'Science',
                                          subjectCode: 'SCI-10',
                                          teacherId: staffList[0]?.id || 'stf-02',
                                          teacherName: staffList[0]?.name || 'Faculty',
                                          roomNumber: '201',
                                          slotType: 'regular'
                                        });
                                        setShowAddModal(true);
                                      }}
                                      className="w-full h-full rounded-xl border border-dashed border-slate-300 hover:border-cyan-500 hover:bg-cyan-50/50 flex items-center justify-center text-slate-400 hover:text-cyan-700 transition-colors text-xs font-bold"
                                    >
                                      <Plus className="w-3.5 h-3.5 mr-1" /> Assign
                                    </button>
                                  ) : (
                                    <span>Free</span>
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
      {/* 4. TAB 2: FACULTY WORKLOAD & ROUTINE (EXCEL & PDF PRINT) */}
      {/* ========================================================================= */}
      {activeTab === 'teacher' && (
        <div className="space-y-6">
          {/* Faculty Selector & Action Toolbar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-700 uppercase">Select Faculty Member:</span>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                disabled={activeRole === 'teacher'}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-950 focus:outline-none focus:border-cyan-600 cursor-pointer disabled:opacity-80"
              >
                {staffList.filter(s => s.role === 'teacher' || s.designation?.toLowerCase().includes('teacher') || s.designation?.toLowerCase().includes('pgt') || s.designation?.toLowerCase().includes('tgt') || s.designation?.toLowerCase().includes('prt')).map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.designation || 'Teacher'} - {t.department || 'Academics'})</option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleExportExcelTeacher}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                title="Export Faculty Routine to Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Export Teacher Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={handlePrintTeacher}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                title="Print Teacher Teaching Diary"
              >
                <Printer className="w-4 h-4 text-indigo-700" />
                <span>Print Teacher Diary (PDF)</span>
              </button>
            </div>
          </div>

          {/* Teacher Real-time Status Card in IST */}
          {selectedTeacher && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 flex items-center justify-center font-black text-lg shadow-xs shrink-0">
                  {selectedTeacher.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-950 text-base">{selectedTeacher.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-indigo-50 text-indigo-900 border border-indigo-200 font-bold">
                      {(selectedTeacher as any).empId || 'FAC-01'}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs font-medium mt-0.5">
                    {selectedTeacher.designation} • {selectedTeacher.department}
                  </p>
                </div>
              </div>

              {/* Live Current Class in IST */}
              <div className="p-3.5 rounded-xl bg-cyan-50/70 border border-cyan-200 flex items-center gap-3 w-full md:w-auto font-mono text-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div>
                  <div className="text-[10px] text-cyan-900 uppercase font-black">
                    Right Now ({currentDayName} in IST):
                  </div>
                  <div className="text-xs font-black text-slate-950 mt-0.5">
                    {teacherCurrentSlot ? (
                      <span>Teaching {teacherCurrentSlot.grade}-{teacherCurrentSlot.section} • {teacherCurrentSlot.subjectName} (Rm {teacherCurrentSlot.roomNumber})</span>
                    ) : (
                      <span className="text-emerald-800 flex items-center gap-1.5 font-bold font-sans">
                        <Coffee className="w-4 h-4 text-emerald-600" /> Free / Lesson Planning Period (Staff Room)
                      </span>
                    )}
                  </div>
                  {teacherNextSlot && (
                    <div className="text-[10px] text-slate-600 mt-0.5 font-sans font-medium">
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
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 text-xs">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Weekly Workload Capacity</span>
                    <span className="font-black text-slate-950">{teacherSchedule.weeklyPeriodsCount} / {teacherSchedule.maxWeeklyPeriods} Periods ({teacherSchedule.utilizationPercent}%)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        teacherSchedule.utilizationPercent > 80
                          ? 'bg-rose-500'
                          : teacherSchedule.utilizationPercent > 60
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, teacherSchedule.utilizationPercent)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                  <div className="font-black text-slate-900">Daily Period Distribution:</div>
                  {Object.entries(teacherSchedule.periodsByDay).map(([d, count]) => (
                    <div key={d} className="flex items-center justify-between text-slate-600 font-medium">
                      <span>{d}</span>
                      <strong className="text-slate-950 font-bold">{count} periods</strong>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                  <span className="text-emerald-900 font-medium">Free Periods Available: </span>
                  <strong className="text-emerald-950 font-black">{teacherSchedule.freePeriodsCount} Periods / Week</strong>
                </div>
              </div>

              {/* Weekly Assigned Routine */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-950 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-cyan-600" />
                    <span>Weekly Teaching Roster ({teacherSchedule.routine.length} Assigned Periods)</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {teacherSchedule.routine.map((slot) => {
                    const bell = bellSchedule.find(b => b.periodNumber === slot.periodNumber);
                    return (
                      <div
                        key={slot.id}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-cyan-900 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 text-[11px]">
                            {slot.dayOfWeek} • Period {slot.periodNumber}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {bell ? `${bell.startTime} – ${bell.endTime}` : ''}
                          </span>
                        </div>
                        <div className="font-black text-slate-950 text-sm">
                          {slot.grade} - Section {slot.section}
                        </div>
                        <div className="flex items-center justify-between text-slate-600 text-xs font-medium">
                          <span>{slot.subjectName}</span>
                          <span className="font-mono text-slate-700 font-bold">Room {slot.roomNumber}</span>
                        </div>
                      </div>
                    );
                  })}
                  {teacherSchedule.routine.length === 0 && (
                    <div className="col-span-2 py-10 text-center text-slate-500 font-medium">
                      No teaching periods assigned to this faculty member yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 3: BELL TIMING & MASTER PERIOD ROSTER ENGINE (RESET CONFIGURATION) */}
      {/* ========================================================================= */}
      {activeTab === 'bell' && (
        <div className="space-y-6">
          {/* Bell Management Banner & Reset Options */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-600" />
                <h2 className="text-base font-black text-slate-950">
                  Bell Timing & Period Scheduling Configuration
                </h2>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Admin and Timetable Incharge can reset period start/end timings, configure recess and assembly breaks, and switch between seasonal routines.
              </p>
            </div>

            {/* Presets & Custom Edit Trigger */}
            <div className="flex flex-wrap items-center gap-2.5">
              {!isEditingBellMode ? (
                <>
                  {activeRole === 'admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBellSchedule(JSON.parse(JSON.stringify(bellSchedule)));
                        setIsEditingBellMode(true);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
                    >
                      <Settings2 className="w-4 h-4" />
                      <span>Re-set Bell Timings</span>
                    </button>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetBellScheduleToDefault}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Default</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingBellMode(false)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveBellSchedule}
                    disabled={savingBellSchedule}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{savingBellSchedule ? 'Saving...' : 'Save & Apply Bell'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Preset Buttons for Quick Switching */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(PRESET_BELL_SCHEDULES).map(([key, p]) => {
              const IconComp = p.icon;
              const isSelected = activePresetKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleApplyPreset(key)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-50/70 border-cyan-400 shadow-xs ring-1 ring-cyan-400'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-950 text-xs">{p.name}</h4>
                      <span className="text-[10px] text-slate-500 font-mono font-bold">{p.periods.length} Scheduled Intervals</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{p.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Period Roster Cards (View or Interactive Edit) */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-950 text-sm">
                  {isEditingBellMode ? 'Edit Active Bell Roster & Timings' : 'Active Institutional Bell Roster'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {isEditingBellMode ? 'Change start/end times or add periods. Durations recalculate automatically.' : 'Current active bell schedule synced with live IST clock.'}
                </p>
              </div>

              {isEditingBellMode && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddPeriodToBellSchedule(false)}
                    className="px-3 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Period</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPeriodToBellSchedule(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Break</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono text-xs">
              {(isEditingBellMode ? editingBellSchedule : bellSchedule).map((bell, idx) => {
                const isAssembly = bell.periodType === 'assembly';
                const isRecess = bell.periodType === 'recess' || bell.isBreak;

                return (
                  <div
                    key={bell.id || idx}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isRecess
                        ? 'bg-amber-50/70 border-amber-200'
                        : isAssembly
                        ? 'bg-indigo-50/70 border-indigo-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isRecess
                            ? 'bg-amber-200 text-amber-950'
                            : isAssembly
                            ? 'bg-indigo-200 text-indigo-950'
                            : 'bg-slate-200 text-slate-900'
                        }`}>
                          {bell.label}
                        </span>
                        {isEditingBellMode && (
                          <button
                            type="button"
                            onClick={() => handleDeletePeriodFromBellSchedule(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Period"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {isEditingBellMode ? (
                        <div className="space-y-1.5 pt-1">
                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <span className="text-[9px] text-slate-500 font-sans block">Start</span>
                              <input
                                type="time"
                                value={bell.startTime}
                                onChange={(e) => handleUpdateEditingPeriod(idx, 'startTime', e.target.value)}
                                className="w-full px-2 py-1 rounded bg-white border border-slate-300 text-slate-950 font-bold text-xs"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 font-sans block">End</span>
                              <input
                                type="time"
                                value={bell.endTime}
                                onChange={(e) => handleUpdateEditingPeriod(idx, 'endTime', e.target.value)}
                                className="w-full px-2 py-1 rounded bg-white border border-slate-300 text-slate-950 font-bold text-xs"
                              />
                            </div>
                          </div>
                          <div className="text-[10px] text-slate-600 font-medium">
                            Duration: {bell.durationMinutes} mins
                          </div>
                        </div>
                      ) : (
                        <div className="pt-1">
                          <span className="font-black text-slate-950 text-sm tracking-wide block">
                            {bell.startTime} – {bell.endTime}
                          </span>
                          <p className="text-[11px] text-slate-600 font-medium font-sans">
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
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 uppercase">Inspection Date:</span>
              <input
                type="date"
                value={subDate}
                onChange={(e) => setSubDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-950 focus:outline-none focus:border-cyan-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-600">Absent Faculty Today: </span>
                <strong className="text-slate-950">{absentTeachers.length}</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-600">Uncovered Periods: </span>
                <strong className="text-amber-800">{recommendations.length}</strong>
              </div>
            </div>
          </div>

          {absentTeachers.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span className="text-rose-900 font-medium">
                  Absent / Approved Leave Faculty: <strong className="font-black">{absentTeachers.map(t => t.name).join(', ')}</strong>
                </span>
              </div>
              <span className="text-[10px] text-rose-800 uppercase font-black bg-rose-100 px-2 py-0.5 rounded">Auto Substitution Active</span>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Recommended Substitutions for Uncovered Periods</span>
            </h3>

            {recommendations.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-600 space-y-2 shadow-sm">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-slate-950 font-black text-sm">All Periods Fully Covered!</p>
                <p className="font-medium">No faculty absences require substitute assignment on this date.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                {recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3.5 shadow-sm"
                  >
                    <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                          Period {rec.periodNumber} • {rec.dayOfWeek}
                        </span>
                        <h4 className="text-slate-950 font-black text-sm mt-1">{rec.subjectName}</h4>
                        <p className="text-slate-600 text-xs font-medium">Class: {rec.grade}-{rec.section} • Room {rec.roomNumber}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-rose-700 font-bold block">Absent Faculty:</span>
                        <span className="text-xs text-slate-900 font-black">{rec.absentTeacherName}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">Best Available Substitute:</span>
                        <strong className="text-slate-950 font-black">{rec.recommendedSubstituteName}</strong>
                        <p className="text-[10px] text-slate-600 font-medium mt-0.5">
                          {rec.rationale}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAssignSubstitute(rec)}
                        className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Assign</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TAB 5: ROOMS & LABS CATALOG */}
      {/* ========================================================================= */}
      {activeTab === 'rooms' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 uppercase">Filter Facility Type:</span>
              <select
                value={roomFilterType}
                onChange={(e) => setRoomFilterType(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-950 focus:outline-none focus:border-cyan-600 cursor-pointer"
              >
                <option value="all">All Facilities</option>
                <option value="classroom">Standard Classrooms</option>
                <option value="science_lab">Science Laboratories</option>
                <option value="computer_lab">Computer & AI Labs</option>
                <option value="library">Library & Reading Rooms</option>
                <option value="sports">Sports & Physical Edu</option>
              </select>
            </div>

            <span className="text-xs font-mono text-slate-600 font-bold">
              Available Rooms: <strong className="text-slate-950">{rooms.length}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {rooms.map(room => (
              <div
                key={room.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-sm hover:border-cyan-400 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-900 border border-cyan-200 uppercase font-mono">
                      {room.roomType.replace('_', ' ')}
                    </span>
                    <h4 className="font-black text-slate-950 text-sm mt-1">{room.roomNumber} - {room.name}</h4>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono font-bold">Floor {room.floor}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-600 font-medium">
                  <span>Student Capacity:</span>
                  <strong className="text-slate-950">{room.capacity} Desks</strong>
                </div>

                {room.facilities && room.facilities.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {room.facilities.slice(0, 3).map((f: string, i: number) => (
                      <span key={i} className="px-1.5 py-0.2 rounded bg-slate-100 text-[9px] text-slate-700 font-medium">
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL: NOTICE BOARD PRINT / SAVE PDF PREVIEW (CLEAN WHITE NOTICE BOARD) */}
      {/* ========================================================================= */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl my-8 overflow-hidden">
            {/* Modal Controls (Hidden on Print) */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Printer className="w-4 h-4 text-cyan-700" />
                <span>Notice Board Print & PDF Preview</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTriggerBrowserPrint}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Body (Clean White Notice Board View) */}
            <div className="p-8 space-y-6 font-sans text-slate-900 bg-white">
              {/* Institutional Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-950">
                  {schoolBrand?.schoolName || 'Dakshora Public Senior Secondary School'}
                </h2>
                <p className="text-xs font-mono text-slate-700 font-medium">
                  Affiliated to {schoolBrand?.board || 'CBSE, New Delhi'} • Affiliation No: #{schoolBrand?.affiliationNo || 'CBSE-AFF-202611'} • UDISE Code: {(schoolBrand as any)?.udiseCode || '08120300412'}
                </p>
                <p className="text-xs font-medium text-slate-600">
                  {schoolBrand?.address || 'Institutional Area, Knowledge Park, New Delhi - 110001'}
                </p>
                <div className="pt-2">
                  <span className="inline-block px-4 py-1 bg-slate-100 rounded-full text-xs font-black uppercase tracking-wider text-slate-950 border border-slate-300">
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
                      <th className="p-2.5 border-r border-slate-900 font-black w-28">Period</th>
                      <th className="p-2.5 border-r border-slate-900 font-black w-28">Timing</th>
                      {daysOfWeek.map(d => (
                        <th key={d} className="p-2.5 border-r border-slate-900 font-black text-center">
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
                          {pNum === 5 && (
                            <tr className="bg-slate-200 border-b border-slate-900 font-black text-center">
                              <td className="p-2 border-r border-slate-900">RECESS</td>
                              <td className="p-2 border-r border-slate-900">11:10 – 11:45</td>
                              <td colSpan={6} className="p-2 tracking-widest text-slate-900">
                                🍱 MID-DAY NUTRITION & RECESS BREAK
                              </td>
                            </tr>
                          )}

                          <tr className="border-b border-slate-900">
                            <td className="p-2 border-r border-slate-900 font-black bg-slate-50">
                              Period {pNum}
                            </td>
                            <td className="p-2 border-r border-slate-900 text-[11px] text-slate-700 font-semibold">
                              {bell.startTime} – {bell.endTime}
                            </td>

                            {daysOfWeek.map(d => {
                              if (printType === 'class') {
                                const slot = getSlotForDayAndPeriod(d, pNum);
                                return (
                                  <td key={d} className="p-2 border-r border-slate-900 align-top">
                                    {slot ? (
                                      <div>
                                        <div className="font-black text-slate-950 font-sans">{slot.subjectName}</div>
                                        <div className="text-[10px] text-slate-700 font-medium font-sans">{slot.teacherName} (Rm {slot.roomNumber || '201'})</div>
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
                                        <div className="font-black text-slate-950 font-sans">{slot.grade}-{slot.section}</div>
                                        <div className="text-[11px] font-semibold text-slate-800 font-sans">{slot.subjectName}</div>
                                        <div className="text-[10px] text-slate-600 font-sans">Room {slot.roomNumber}</div>
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

              {/* Signatures */}
              <div className="pt-8 flex items-end justify-between text-xs text-slate-800 font-bold border-t border-slate-300">
                <div className="text-center w-36 border-t-2 border-slate-900 pt-2">
                  Timetable Incharge
                </div>
                <div className="text-center w-36 border-t-2 border-slate-900 pt-2">
                  Vice Principal
                </div>
                <div className="text-center w-40 border-t-2 border-slate-900 pt-2">
                  Principal & School Stamp
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. MODAL: ADD / EDIT TIMETABLE SLOT */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-600" />
                <span>Allocate Period Slot ({selectedGrade} - Sec {selectedSection})</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Conflict Guard Warning */}
            {clashError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span><strong>Faculty Clash Conflict:</strong> {clashError}</span>
              </div>
            )}
            {clashWarning && !clashError && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-amber-600" />
                <span><strong>Notice:</strong> {clashWarning}</span>
              </div>
            )}

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Day of Week *</label>
                  <select
                    value={slotForm.dayOfWeek}
                    onChange={(e) => setSlotForm({ ...slotForm, dayOfWeek: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-cyan-600"
                  >
                    {daysOfWeek.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Period Number *</label>
                  <select
                    value={slotForm.periodNumber}
                    onChange={(e) => setSlotForm({ ...slotForm, periodNumber: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-cyan-600"
                  >
                    {regularPeriods.map(p => (
                      <option key={p} value={p}>Period {p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics, Physics, Social Science"
                  value={slotForm.subjectName}
                  onChange={(e) => setSlotForm({ ...slotForm, subjectName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Assigned Teacher *</label>
                  <select
                    value={slotForm.teacherId}
                    onChange={(e) => setSlotForm({ ...slotForm, teacherId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-cyan-600"
                  >
                    {staffList.filter(s => s.role === 'teacher' || s.designation?.toLowerCase().includes('teacher') || s.designation?.toLowerCase().includes('pgt') || s.designation?.toLowerCase().includes('tgt') || s.designation?.toLowerCase().includes('prt')).map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.department || 'Faculty'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Classroom / Lab Room</label>
                  <input
                    type="text"
                    placeholder="e.g. 201, Physics Lab"
                    value={slotForm.roomNumber}
                    onChange={(e) => setSlotForm({ ...slotForm, roomNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-950 font-bold focus:outline-none focus:border-cyan-600"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSlot}
                  disabled={Boolean(clashError)}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-black cursor-pointer shadow-xs"
                >
                  Allocate Slot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
