import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Users,
  GraduationCap,
  CreditCard,
  BookOpen,
  Bus,
  Library,
  FileCheck,
  ChevronRight,
  Shield,
  Clock,
  Sparkles,
  Command
} from 'lucide-react';
import { searchErpGlobal } from '../services/api';
import { ErpGlobalSearchResultItem } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: string, entityId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    students?: ErpGlobalSearchResultItem[];
    staff?: ErpGlobalSearchResultItem[];
    admissions?: ErpGlobalSearchResultItem[];
    fees?: ErpGlobalSearchResultItem[];
    exams?: ErpGlobalSearchResultItem[];
    transport?: ErpGlobalSearchResultItem[];
    library?: ErpGlobalSearchResultItem[];
  }>({});
  const [totalMatches, setTotalMatches] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({});
      setTotalMatches(0);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults({});
      setTotalMatches(0);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchErpGlobal(query.trim());
        if (res.data?.success) {
          setResults(res.data.results || {});
          setTotalMatches(res.data.totalMatches || 0);
        }
      } catch (err) {
        console.warn('Global search query error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'student':
        return <GraduationCap className="w-4 h-4 text-cyan-400" />;
      case 'staff':
        return <Users className="w-4 h-4 text-emerald-400" />;
      case 'admission':
        return <Users className="w-4 h-4 text-indigo-400" />;
      case 'fee':
        return <CreditCard className="w-4 h-4 text-emerald-400" />;
      case 'exam':
        return <FileCheck className="w-4 h-4 text-amber-400" />;
      case 'transport':
        return <Bus className="w-4 h-4 text-orange-400" />;
      case 'library':
        return <Library className="w-4 h-4 text-purple-400" />;
      default:
        return <Search className="w-4 h-4 text-slate-400" />;
    }
  };

  const getModuleForType = (type: string): string => {
    switch (type) {
      case 'student':
        return 'students';
      case 'staff':
        return 'staff';
      case 'admission':
        return 'admissions';
      case 'fee':
        return 'fees';
      case 'exam':
        return 'exams';
      case 'transport':
        return 'transport';
      case 'library':
        return 'library';
      default:
        return 'dashboard';
    }
  };

  const hasAnyResults = totalMatches > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#0B0F19] border border-cyan-500/30 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border-t-2 border-t-cyan-400">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/60">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across students, staff, admissions, fees, exams, buses, library..."
            className="flex-1 bg-transparent border-none text-white placeholder:text-slate-500 text-sm focus:outline-none font-mono"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shrink-0" />
          )}
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
          >
            ESC
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!query.trim() && (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Command className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="text-white text-sm font-bold">Global School ERP Directory</div>
              <p className="text-xs text-slate-400 font-mono max-w-sm mx-auto">
                Quickly locate students by name, roll no, or admission no; educators by faculty ID; bus routes, exam schedules, and library books.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {['Aarav', 'Rajeev', 'Mid-Term', 'Route 04', 'Physics', 'DPS-2026'].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setQuery(chip)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300 hover:border-cyan-500/40"
                  >
                    "{chip}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {query.trim() && !loading && !hasAnyResults && (
            <div className="py-12 text-center space-y-2">
              <Search className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-slate-300 text-sm font-bold">No records found</div>
              <p className="text-xs text-slate-500 font-mono">
                No matching student, staff, fee, or academic record found for "{query}".
              </p>
            </div>
          )}

          {/* Categorized Result Groups */}
          {hasAnyResults && (
            <div className="space-y-4">
              {/* Students */}
              {results.students && results.students.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-2 font-mono flex items-center justify-between">
                    <span>Students ({results.students.length})</span>
                    <span className="text-[10px] text-slate-500">SIS Records</span>
                  </div>
                  <div className="space-y-1">
                    {results.students.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(getModuleForType(item.type), item.id);
                          onClose();
                        }}
                        className="w-full p-2.5 rounded-xl bg-slate-950/60 hover:bg-cyan-950/40 border border-slate-800/80 hover:border-cyan-500/40 text-left flex items-center justify-between group transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                            {getCategoryIcon(item.type)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white group-hover:text-cyan-300">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {item.subtitle}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Staff */}
              {results.staff && results.staff.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2 font-mono">
                    Staff & Faculty ({results.staff.length})
                  </div>
                  <div className="space-y-1">
                    {results.staff.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(getModuleForType(item.type), item.id);
                          onClose();
                        }}
                        className="w-full p-2.5 rounded-xl bg-slate-950/60 hover:bg-emerald-950/40 border border-slate-800/80 hover:border-emerald-500/40 text-left flex items-center justify-between group transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                            {getCategoryIcon(item.type)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {item.subtitle}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Fees */}
              {results.fees && results.fees.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2 font-mono">
                    Fee Demands & Invoices ({results.fees.length})
                  </div>
                  <div className="space-y-1">
                    {results.fees.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(getModuleForType(item.type), item.id);
                          onClose();
                        }}
                        className="w-full p-2.5 rounded-xl bg-slate-950/60 hover:bg-amber-950/40 border border-slate-800/80 hover:border-amber-500/40 text-left flex items-center justify-between group transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                            {getCategoryIcon(item.type)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white group-hover:text-amber-300">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {item.subtitle}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Admissions */}
              {results.admissions && results.admissions.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-2 font-mono">
                    Admissions Pipeline ({results.admissions.length})
                  </div>
                  <div className="space-y-1">
                    {results.admissions.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(getModuleForType(item.type), item.id);
                          onClose();
                        }}
                        className="w-full p-2.5 rounded-xl bg-slate-950/60 hover:bg-indigo-950/40 border border-slate-800/80 hover:border-indigo-500/40 text-left flex items-center justify-between group transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                            {getCategoryIcon(item.type)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white group-hover:text-indigo-300">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {item.subtitle}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Exams */}
              {results.exams && results.exams.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider mb-2 font-mono">
                    Examinations & Assessments ({results.exams.length})
                  </div>
                  <div className="space-y-1">
                    {results.exams.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(getModuleForType(item.type), item.id);
                          onClose();
                        }}
                        className="w-full p-2.5 rounded-xl bg-slate-950/60 hover:bg-sky-950/40 border border-slate-800/80 hover:border-sky-500/40 text-left flex items-center justify-between group transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                            {getCategoryIcon(item.type)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white group-hover:text-sky-300">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {item.subtitle}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-sky-400 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Transport */}
              {results.transport && results.transport.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-orange-400 uppercase tracking-wider mb-2 font-mono">
                    Transport & Fleet ({results.transport.length})
                  </div>
                  <div className="space-y-1">
                    {results.transport.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(getModuleForType(item.type), item.id);
                          onClose();
                        }}
                        className="w-full p-2.5 rounded-xl bg-slate-950/60 hover:bg-orange-950/40 border border-slate-800/80 hover:border-orange-500/40 text-left flex items-center justify-between group transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                            {getCategoryIcon(item.type)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white group-hover:text-orange-300">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {item.subtitle}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-orange-400 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Library */}
              {results.library && results.library.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider mb-2 font-mono">
                    Library Titles ({results.library.length})
                  </div>
                  <div className="space-y-1">
                    {results.library.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(getModuleForType(item.type), item.id);
                          onClose();
                        }}
                        className="w-full p-2.5 rounded-xl bg-slate-950/60 hover:bg-purple-950/40 border border-slate-800/80 hover:border-purple-500/40 text-left flex items-center justify-between group transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                            {getCategoryIcon(item.type)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white group-hover:text-purple-300">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {item.subtitle}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Role-filtered & Tenant-isolated Search</span>
          </div>
          <div>
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">ESC</kbd> to exit
          </div>
        </div>
      </div>
    </div>
  );
};
