import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BookOpen,
  Sparkles,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Copy,
  Printer,
  Trash2,
  Edit3,
  Bot,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  HelpCircle,
  Award,
  RefreshCw,
  Send
} from 'lucide-react';
import {
  ErpRole,
  TeachingJournalEntry,
  AiTeacherGenerateRequest
} from '../types';
import {
  fetchTeachingJournal,
  createTeachingJournal,
  updateTeachingJournal,
  deleteTeachingJournal,
  generateAiTeacherContent
} from '../services/api';

interface TeachingJournalHubProps {
  activeRole: ErpRole;
  activeSession?: string;
  organizationId?: string;
  currentStaffId?: string;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const TeachingJournalHub: React.FC<TeachingJournalHubProps> = ({
  activeRole,
  currentStaffId = 'stf-02',
  onShowToast,
}) => {
  const [entries, setEntries] = useState<TeachingJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TeachingJournalEntry | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<TeachingJournalEntry>>({
    date: new Date().toISOString().split('T')[0],
    grade: 'Class 10',
    section: 'A',
    subject: 'Mathematics',
    period: 2,
    period_time: '09:20 AM - 10:05 AM',
    topic: '',
    learning_objectives: '',
    what_taught: '',
    student_response: '',
    homework: '',
    doubts: '',
    topics_pending: '',
    next_lesson: '',
  });

  // AI Assistant state
  const [aiMode, setAiMode] = useState<AiTeacherGenerateRequest['mode']>('lesson_plan');
  const [aiGrade, setAiGrade] = useState('Class 10');
  const [aiSubject, setAiSubject] = useState('Mathematics');
  const [aiTopic, setAiTopic] = useState('Quadratic Equations');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ title: string; content: string } | null>(null);

  // Load journal entries
  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTeachingJournal({
        staffId: activeRole === 'teacher' ? currentStaffId : undefined,
        grade: selectedGrade !== 'all' ? selectedGrade : undefined,
        section: selectedSection !== 'all' ? selectedSection : undefined,
        subject: selectedSubject !== 'all' ? selectedSubject : undefined,
        date: selectedDate || undefined,
      });

      if (res.data && res.data.journalEntries) {
        setEntries(res.data.journalEntries);
      }
    } catch (err: any) {
      onShowToast('error', 'Failed to Load Journal', err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [activeRole, currentStaffId, selectedGrade, selectedSection, selectedSubject, selectedDate, onShowToast]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Filter entries based on search query
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(
      (e) =>
        e.topic.toLowerCase().includes(q) ||
        (e.learning_objectives && e.learning_objectives.toLowerCase().includes(q)) ||
        (e.what_taught && e.what_taught.toLowerCase().includes(q)) ||
        (e.homework && e.homework.toLowerCase().includes(q)) ||
        (e.subject && e.subject.toLowerCase().includes(q))
    );
  }, [entries, searchQuery]);

  // Metrics
  const metrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = entries.filter((e) => e.date === today);
    const withHomework = entries.filter((e) => e.homework && e.homework.trim().length > 0);
    const withPending = entries.filter((e) => e.topics_pending && e.topics_pending.trim().length > 0);

    return {
      total: entries.length,
      today: todayEntries.length,
      homeworkCount: withHomework.length,
      pendingCount: withPending.length,
    };
  }, [entries]);

  // Open modal for creating new entry
  const handleOpenCreateModal = () => {
    setEditingEntry(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      grade: 'Class 10',
      section: 'A',
      subject: 'Mathematics',
      period: 2,
      period_time: '09:20 AM - 10:05 AM',
      topic: '',
      learning_objectives: '',
      what_taught: '',
      student_response: '',
      homework: '',
      doubts: '',
      topics_pending: '',
      next_lesson: '',
    });
    setShowEntryModal(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (entry: TeachingJournalEntry) => {
    setEditingEntry(entry);
    setFormData({ ...entry });
    setShowEntryModal(true);
  };

  // Submit entry form
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic?.trim() || !formData.subject?.trim() || !formData.grade?.trim()) {
      onShowToast('error', 'Missing Information', 'Grade, Subject, and Topic are required.');
      return;
    }

    try {
      if (editingEntry) {
        const res = await updateTeachingJournal(editingEntry.id, formData);
        if (res.data?.success) {
          onShowToast('success', 'Journal Updated', 'Teaching journal entry updated successfully.');
          setShowEntryModal(false);
          loadEntries();
        } else {
          onShowToast('error', 'Update Failed', res.data?.message || 'Could not update journal.');
        }
      } else {
        const res = await createTeachingJournal({
          ...formData,
          staff_id: currentStaffId,
          staff_name: 'Rajeev Malhotra',
        });
        if (res.data?.success) {
          onShowToast('success', 'Journal Recorded', 'Teaching journal entry logged to permanent record.');
          setShowEntryModal(false);
          loadEntries();
        } else {
          onShowToast('error', 'Save Failed', res.data?.message || 'Could not create entry.');
        }
      }
    } catch (err: any) {
      onShowToast('error', 'Request Failed', err.message || 'Network error');
    }
  };

  // Delete entry
  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this teaching journal entry?')) return;
    try {
      const res = await deleteTeachingJournal(id);
      if (res.data?.success) {
        onShowToast('info', 'Journal Deleted', 'Entry removed.');
        loadEntries();
      } else {
        onShowToast('error', 'Delete Failed', res.data?.message || 'Could not delete entry.');
      }
    } catch (err: any) {
      onShowToast('error', 'Error', err.message || 'Failed to delete');
    }
  };

  // Generate AI Teacher Content
  const handleGenerateAi = async () => {
    if (!aiTopic.trim()) {
      onShowToast('error', 'Topic Required', 'Please enter a topic to generate content for.');
      return;
    }

    setAiLoading(true);
    try {
      const res = await generateAiTeacherContent({
        mode: aiMode,
        grade: aiGrade,
        subject: aiSubject,
        topic: aiTopic,
      });

      if (res.data && res.data.content) {
        setAiResult({
          title: res.data.title,
          content: res.data.content,
        });
        onShowToast('success', 'AI Content Generated', `Generated ${aiMode.replace('_', ' ')} successfully.`);
      } else {
        onShowToast('error', 'AI Generation Failed', res.data?.message || 'Could not generate content.');
      }
    } catch (err: any) {
      onShowToast('error', 'AI Service Error', err.message || 'Failed to communicate with AI model.');
    } finally {
      setAiLoading(false);
    }
  };

  // Pre-fill AI modal from a specific journal entry
  const handleAiFromEntry = (entry: TeachingJournalEntry, mode: AiTeacherGenerateRequest['mode']) => {
    setAiGrade(entry.grade);
    setAiSubject(entry.subject);
    setAiTopic(entry.topic);
    setAiMode(mode);
    setAiResult(null);
    setShowAiModal(true);
  };

  // Insert generated content into journal form
  const handleInsertAiIntoForm = () => {
    if (!aiResult) return;
    setFormData((prev) => ({
      ...prev,
      grade: aiGrade,
      subject: aiSubject,
      topic: aiTopic,
      learning_objectives:
        aiMode === 'lesson_plan'
          ? `Generated with Dakshora AI:\n${aiResult.content.slice(0, 300)}...`
          : prev.learning_objectives,
      what_taught:
        aiMode === 'lesson_plan'
          ? `Followed CBSE structured 45-min lesson plan for ${aiTopic}. Covered hook, concept modeling, and guided practice.`
          : prev.what_taught,
      homework:
        aiMode === 'mcqs'
          ? `Solve 20 CBSE MCQs for ${aiTopic} from Dakshora AI Worksheet.`
          : aiMode === 'worksheet'
          ? `Complete Sections A, B & C of ${aiTopic} practice worksheet.`
          : prev.homework,
    }));
    setShowAiModal(false);
    setShowEntryModal(true);
    onShowToast('info', 'AI Content Injected', 'Lesson plan details have been placed in your journal draft.');
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 🧭 HUB HEADER & COMMAND ACTIONS */}
      {/* ========================================================================= */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Phase 7 & 8 • Teacher App
            </span>
            <span className="text-xs text-slate-400 font-mono">CBSE / ICSE Aligned</span>
          </div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-400" />
            <span>Structured Teaching Journal & AI Co-Pilot</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Daily period-by-period teaching records, learning objectives, homework logs, and AI lesson preparation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={loadEntries}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:text-white transition-all text-xs flex items-center gap-1.5"
            title="Refresh Journal"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => {
              setAiResult(null);
              setShowAiModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>AI Teacher Assistant</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Log Daily Journal</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📊 SUMMARY METRICS CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>Total Logged</span>
            <BookOpen className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{metrics.total}</div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">Permanent journal logs</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>Taught Today</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-300 font-mono">{metrics.today}</div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">Periods completed today</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>Homework Given</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono">{metrics.homeworkCount}</div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">Synced with Parent Portal</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>Pending Topics</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">{metrics.pendingCount}</div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">Scheduled for next lessons</div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🔍 FILTER & SEARCH TOOLBAR */}
      {/* ========================================================================= */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search topic, objectives, or homework..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-xs font-mono focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Grade Filter */}
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:border-purple-500 focus:outline-none"
          >
            <option value="all">All Grades</option>
            <option value="Class 8">Class 8</option>
            <option value="Class 9">Class 9</option>
            <option value="Class 10">Class 10</option>
            <option value="Class 11">Class 11</option>
            <option value="Class 12">Class 12</option>
          </select>

          {/* Section Filter */}
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:border-purple-500 focus:outline-none"
          >
            <option value="all">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
          </select>

          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:border-purple-500 focus:outline-none"
          >
            <option value="all">All Subjects</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="English">English</option>
            <option value="Social Science">Social Science</option>
            <option value="Computer Science">Computer Science</option>
          </select>

          {/* Date Picker */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:border-purple-500 focus:outline-none"
          />

          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs"
              title="Clear date filter"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📖 JOURNAL ENTRIES LIST */}
      {/* ========================================================================= */}
      {loading ? (
        <div className="glass-panel p-12 text-center rounded-3xl border border-slate-800">
          <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" />
          <p className="text-xs font-mono text-slate-400">Loading teaching journal entries...</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl border border-slate-800 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Teaching Journal Entries Found</h3>
          <p className="text-xs text-slate-400 font-mono max-w-md mx-auto">
            {searchQuery || selectedGrade !== 'all' || selectedSubject !== 'all' || selectedDate
              ? 'No entries match your current search and filter criteria.'
              : 'Start by logging your first structured teaching journal entry or generate one with Dakshora AI.'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold font-mono inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Log Entry Now</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => {
            const isExpanded = expandedEntryId === entry.id;

            return (
              <div
                key={entry.id}
                className="glass-panel p-5 rounded-2xl border border-slate-800/90 hover:border-purple-500/30 transition-all bg-gradient-to-br from-slate-900/80 to-slate-950"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5 flex-wrap font-mono text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-purple-950/60 text-purple-300 border border-purple-500/30 font-bold">
                      {entry.grade} • {entry.section}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 font-bold">
                      {entry.subject}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Period {entry.period} ({entry.period_time || '45 min'})</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{entry.date}</span>
                    </span>
                    {entry.staff_name && (
                      <span className="text-[11px] text-slate-400">
                        By: <span className="text-white font-medium">{entry.staff_name}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAiFromEntry(entry, 'lesson_plan')}
                      className="px-2.5 py-1 rounded-lg bg-purple-900/40 hover:bg-purple-900/70 text-purple-300 border border-purple-500/30 text-xs font-mono flex items-center gap-1 transition-all"
                      title="Generate 45-Min Lesson Plan with AI"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>AI Plan</span>
                    </button>
                    <button
                      onClick={() => handleAiFromEntry(entry, 'mcqs')}
                      className="px-2.5 py-1 rounded-lg bg-indigo-900/40 hover:bg-indigo-900/70 text-indigo-300 border border-indigo-500/30 text-xs font-mono flex items-center gap-1 transition-all"
                      title="Generate 20 CBSE MCQs with AI"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-cyan-300" />
                      <span>20 MCQs</span>
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(entry)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                      title="Edit Entry"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-all"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Topic Title */}
                <div className="pt-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{entry.topic}</span>
                  </h3>

                  {entry.learning_objectives && (
                    <div className="mt-2 text-xs font-mono text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                      <span className="font-bold text-purple-300">🎯 Learning Objectives: </span>
                      {entry.learning_objectives}
                    </div>
                  )}
                </div>

                {/* Summary Row */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  {entry.what_taught && (
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300">
                      <div className="font-bold text-slate-400 mb-1">📝 What Was Taught:</div>
                      <p className="line-clamp-2">{entry.what_taught}</p>
                    </div>
                  )}

                  {entry.homework && (
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300">
                      <div className="font-bold text-emerald-400 mb-1 flex items-center justify-between">
                        <span>📚 Homework Assigned:</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(entry.homework || '');
                            onShowToast('success', 'Copied to Clipboard', 'Homework copied.');
                          }}
                          className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </button>
                      </div>
                      <p className="line-clamp-2 text-emerald-200">{entry.homework}</p>
                    </div>
                  )}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono animate-in fade-in">
                    {entry.student_response && (
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300">
                        <div className="font-bold text-cyan-400 mb-1">🙋 Student Response & Engagement:</div>
                        <p>{entry.student_response}</p>
                      </div>
                    )}

                    {entry.doubts && (
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300">
                        <div className="font-bold text-amber-400 mb-1">❓ Doubts & Clarifications:</div>
                        <p>{entry.doubts}</p>
                      </div>
                    )}

                    {entry.topics_pending && (
                      <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200">
                        <div className="font-bold text-amber-300 mb-1 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Pending Topics for Next Lesson:</span>
                        </div>
                        <p>{entry.topics_pending}</p>
                      </div>
                    )}

                    {entry.next_lesson && (
                      <div className="col-span-1 md:col-span-3 p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-indigo-200">
                        <div className="font-bold text-indigo-300 mb-1">🔜 Next Lesson Plan:</div>
                        <p>{entry.next_lesson}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ➕ MODAL: CREATE / EDIT TEACHING JOURNAL ENTRY */}
      {/* ========================================================================= */}
      {showEntryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0B0F19] border border-purple-500/40 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" />
                <span className="font-bold text-sm text-white">
                  {editingEntry ? 'Edit Teaching Journal Entry' : 'Log Structured Daily Teaching Journal'}
                </span>
              </div>
              <button
                onClick={() => setShowEntryModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-4">
              {/* Row 1: Grade, Section, Subject, Period */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Grade *</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  >
                    <option value="Class 8">Class 8</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Section</label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mathematics"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Period</label>
                  <select
                    value={formData.period}
                    onChange={(e) => {
                      const p = parseInt(e.target.value);
                      const times = [
                        '08:30 AM - 09:15 AM',
                        '09:20 AM - 10:05 AM',
                        '10:20 AM - 11:05 AM',
                        '11:10 AM - 11:55 AM',
                        '12:30 PM - 01:15 PM',
                        '01:20 PM - 02:05 PM',
                      ];
                      setFormData({
                        ...formData,
                        period: p,
                        period_time: times[p - 1] || '45 min',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  >
                    <option value={1}>Period 1</option>
                    <option value={2}>Period 2</option>
                    <option value={3}>Period 3</option>
                    <option value={4}>Period 4</option>
                    <option value={5}>Period 5</option>
                    <option value={6}>Period 6</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Date & Topic Title */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1">Topic / Chapter Taught *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Quadratic Equations — Factoring Method"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold"
                  />
                </div>
              </div>

              {/* Row 3: Learning Objectives */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400">Learning Objectives (Bloom's Taxonomy)</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!formData.topic) {
                        onShowToast('error', 'Topic Required', 'Enter topic title first.');
                        return;
                      }
                      setAiTopic(formData.topic);
                      setAiSubject(formData.subject || 'Mathematics');
                      setAiGrade(formData.grade || 'Class 10');
                      setAiMode('lesson_plan');
                      setShowEntryModal(false);
                      setShowAiModal(true);
                    }}
                    className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-bold"
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Generate with Dakshora AI</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  placeholder="e.g. Understand standard form ax^2 + bx + c = 0 and solve roots using splitting the middle term..."
                  value={formData.learning_objectives}
                  onChange={(e) => setFormData({ ...formData, learning_objectives: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              {/* Row 4: What Was Taught & Student Response */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">What Was Taught (Classroom Summary)</label>
                  <textarea
                    rows={2}
                    placeholder="Reviewed standard form, solved 4 textbook examples on splitting middle term..."
                    value={formData.what_taught}
                    onChange={(e) => setFormData({ ...formData, what_taught: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Student Response & Engagement</label>
                  <textarea
                    rows={2}
                    placeholder="High engagement; 32/38 students solved practice problems independently..."
                    value={formData.student_response}
                    onChange={(e) => setFormData({ ...formData, student_response: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
              </div>

              {/* Row 5: Homework & Doubts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-400 mb-1">Homework Assigned (Synced to Parents)</label>
                  <textarea
                    rows={2}
                    placeholder="NCERT Exercise 4.2: Q1 (i to v) in homework notebook..."
                    value={formData.homework}
                    onChange={(e) => setFormData({ ...formData, homework: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-amber-400 mb-1">Student Doubts / Misconceptions</label>
                  <textarea
                    rows={2}
                    placeholder="Confusion factoring when a * c is negative..."
                    value={formData.doubts}
                    onChange={(e) => setFormData({ ...formData, doubts: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
              </div>

              {/* Row 6: Topics Pending & Next Lesson */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-amber-300 mb-1">Topics Pending / Incomplete</label>
                  <input
                    type="text"
                    placeholder="Quadratic formula derivation..."
                    value={formData.topics_pending}
                    onChange={(e) => setFormData({ ...formData, topics_pending: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-indigo-300 mb-1">Next Lesson Plan</label>
                  <input
                    type="text"
                    placeholder="Nature of Roots & Derivation..."
                    value={formData.next_lesson}
                    onChange={(e) => setFormData({ ...formData, next_lesson: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEntryModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-purple-500/20"
                >
                  {editingEntry ? 'Update Journal Entry' : 'Save & Record to Journal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🤖 MODAL / DRAWER: DAKSHORA AI TEACHER ASSISTANT */}
      {/* ========================================================================= */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0B0F19] border border-purple-500/40 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Dakshora AI Teacher Co-Pilot</h3>
                  <p className="text-[11px] text-slate-400">CBSE & ICSE Differentiated Pedagogy Engine</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            {/* AI Mode Selector Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'lesson_plan', label: '📝 Lesson Plan', desc: '45-Min Structured' },
                { id: 'mcqs', label: '❓ 20 MCQs', desc: 'CBSE Balanced' },
                { id: 'worksheet', label: '📄 Worksheet', desc: 'A, B & HOTS' },
                { id: 'bilingual_hindi', label: '🇮🇳 सरल हिंदी', desc: 'Hinglish Concept' },
                { id: 'differentiated', label: '🎯 3 Tiers', desc: 'Weak, Avg, HOTS' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setAiMode(m.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    aiMode === m.id
                      ? 'bg-purple-950/70 border-purple-400/60 text-white shadow-lg shadow-purple-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold text-xs">{m.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>

            {/* Inputs: Grade, Subject, Topic */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <label className="block text-slate-400 mb-1">Target Grade</label>
                <select
                  value={aiGrade}
                  onChange={(e) => setAiGrade(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                >
                  <option value="Class 8">Class 8</option>
                  <option value="Class 9">Class 9</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 11">Class 11</option>
                  <option value="Class 12">Class 12</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Subject</label>
                <input
                  type="text"
                  value={aiSubject}
                  onChange={(e) => setAiSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Topic / Concept Name</label>
                <input
                  type="text"
                  placeholder="e.g. Quadratic Equations"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold"
                />
              </div>

              <div className="sm:col-span-3">
                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={handleGenerateAi}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-50"
                >
                  {aiLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating with Dakshora AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Generate Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI Generated Result Display */}
            {aiResult && (
              <div className="space-y-3 p-4 rounded-2xl bg-slate-950 border border-purple-500/30">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-bold text-sm text-purple-300">{aiResult.title}</h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(aiResult.content);
                        onShowToast('success', 'Copied to Clipboard', 'AI content ready to paste.');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1 text-[11px]"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={() => {
                        window.print();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1 text-[11px]"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Print</span>
                    </button>
                    <button
                      onClick={handleInsertAiIntoForm}
                      className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center gap-1 text-[11px]"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>Insert into Journal Draft</span>
                    </button>
                  </div>
                </div>

                <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
                  {aiResult.content}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
