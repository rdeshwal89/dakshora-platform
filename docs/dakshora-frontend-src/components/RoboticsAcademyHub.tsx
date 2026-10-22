import React, { useState, useEffect } from 'react';
import {
  Bot,
  Cpu,
  Sparkles,
  Award,
  Layers,
  Calendar,
  Users,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Clock,
  MapPin,
  FileText,
  Star,
  ShieldCheck,
  Zap,
  Box,
  TrendingUp,
  ChevronRight,
  Filter
} from 'lucide-react';
import {
  RoboticsCourse,
  RoboticsInventoryItem,
  RoboticsProject,
  RoboticsCompetition
} from '../types';
import {
  fetchRoboticsCourses,
  fetchRoboticsInventory,
  fetchRoboticsProjects,
  createRoboticsProject,
  fetchRoboticsCompetitions
} from '../services/api';

interface RoboticsAcademyHubProps {
  onShowToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

export const RoboticsAcademyHub: React.FC<RoboticsAcademyHubProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'curriculum' | 'inventory' | 'projects' | 'competitions'>('curriculum');
  const [courses, setCourses] = useState<RoboticsCourse[]>([]);
  const [inventory, setInventory] = useState<RoboticsInventoryItem[]>([]);
  const [projects, setProjects] = useState<RoboticsProject[]>([]);
  const [competitions, setCompetitions] = useState<RoboticsCompetition[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Submit Project Modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [projectForm, setProjectForm] = useState({
    title: '',
    studentName: '',
    grade: 'Class 10-A',
    category: 'Robotics & IoT',
    summary: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [crsRes, invRes, prjRes, cmpRes] = await Promise.all([
        fetchRoboticsCourses(),
        fetchRoboticsInventory(),
        fetchRoboticsProjects(),
        fetchRoboticsCompetitions()
      ]);
      if (crsRes.data?.courses) setCourses(crsRes.data.courses);
      if (invRes.data?.inventory) setInventory(invRes.data.inventory);
      if (prjRes.data?.projects) setProjects(prjRes.data.projects);
      if (cmpRes.data?.competitions) setCompetitions(cmpRes.data.competitions);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.title.trim() || !projectForm.studentName.trim()) return;

    try {
      const res = await createRoboticsProject(projectForm);
      if (res.data?.success) {
        onShowToast('success', 'Project Submitted! 🚀', 'Added to Student Innovation Portfolio');
        setProjects(prev => [res.data.project, ...prev]);
        setShowSubmitModal(false);
        setProjectForm({
          title: '',
          studentName: '',
          grade: 'Class 10-A',
          category: 'Robotics & IoT',
          summary: ''
        });
      }
    } catch {
      onShowToast('error', 'Submission Failed');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-900/90 to-indigo-950/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-cyan-500/25">
              <Cpu className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-white tracking-wide">DAKSHORA Robotics & STEAM Academy</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Skill-to-Career Lab
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  NEP 2020 Aligned
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Atal Tinkering Lab Management • "Learn → Build → Prove → Solve → Earn" Innovation Lifecycle
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold text-xs font-mono flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit Project</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80 text-xs font-mono">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-slate-400 text-[11px]">STEAM Lab Tracks</div>
            <div className="text-lg font-bold text-white mt-0.5">{courses.length || 4} Grade Curricula</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-slate-400 text-[11px]">Tinkering Kits in Lab</div>
            <div className="text-lg font-bold text-cyan-400 mt-0.5">
              {inventory.reduce((acc, curr) => acc + curr.totalQty, 0) || 201} Units
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-slate-400 text-[11px]">Student Innovations</div>
            <div className="text-lg font-bold text-purple-400 mt-0.5">{projects.length || 3} Showcase Bots</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-slate-400 text-[11px]">National Competitions</div>
            <div className="text-lg font-bold text-amber-400 mt-0.5">{competitions.length || 3} Active Fests</div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('curriculum')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
            activeTab === 'curriculum'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>📚 STEAM Curriculum (Class 3-12)</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
            activeTab === 'inventory'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Box className="w-4 h-4" />
          <span>🔬 Tinkering Lab Kits & Hardware</span>
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
            activeTab === 'projects'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>🚀 Student Innovation Portfolio</span>
        </button>

        <button
          onClick={() => setActiveTab('competitions')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
            activeTab === 'competitions'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>🏆 Hackathons & Competitions</span>
        </button>
      </div>

      {/* 3. Tab Contents */}

      {/* TAB 1: CURRICULUM */}
      {activeTab === 'curriculum' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in">
          {courses.map((course) => (
            <div
              key={course.id}
              className="glass-panel p-6 rounded-3xl border border-slate-800 bg-slate-950/80 hover:border-cyan-500/40 transition-all space-y-4 shadow-xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    {course.gradeRange}
                  </span>
                  <h3 className="text-base font-bold text-white mt-2">{course.title}</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed font-sans">{course.description}</p>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono space-y-1.5">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500">Hardware & Toolchain:</span>
                  <span className="font-bold text-cyan-400">{course.platform}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500">Curriculum Scope:</span>
                  <span>{course.modulesCount} Hands-on Modules • {course.durationWeeks} Weeks</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500">Verified Badge:</span>
                  <span className="text-purple-300 font-bold">🎖️ {course.badgeAwarded}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 text-xs font-mono">
                <span className="text-emerald-400 font-bold">{course.enrolledStudents} Students Enrolled</span>
                <button
                  onClick={() => onShowToast('info', 'Course Syllabus', `Opening complete 24-week curriculum for ${course.title}`)}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold transition-colors"
                >
                  <span>View Lab Syllabus</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl animate-in fade-in">
          <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">Tinkering Lab Hardware & Robotics Kits</h3>
              <p className="text-xs text-slate-400 mt-0.5">Real-time stock ledger of microcontrollers, rapid prototyping tools, and sensors</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search kit or sensor..."
                className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                  <th className="py-3.5 px-4">Hardware Component / Kit</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Lab Location</th>
                  <th className="py-3.5 px-4">Availability</th>
                  <th className="py-3.5 px-4">Condition</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {inventory
                  .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.category.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((item) => {
                    const percentAvail = Math.round((item.availableQty / item.totalQty) * 100);
                    return (
                      <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                          <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>{item.name}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">{item.location}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{item.availableQty} / {item.totalQty}</span>
                            <span className={`text-[10px] ${percentAvail > 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                              ({percentAvail}%)
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            {item.condition}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => onShowToast('success', 'Kit Checked Out', `Issued 1 unit of ${item.name} to student team`)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[11px] font-bold transition-all"
                          >
                            Check Out
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PROJECTS */}
      {activeTab === 'projects' && (
        <div className="space-y-5 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {projects.map((prj) => (
              <div
                key={prj.id}
                className="glass-panel p-5 rounded-3xl border border-purple-500/30 bg-slate-950/80 space-y-3.5 shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {prj.category}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-amber-400 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{prj.rating}</span>
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white leading-snug">{prj.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed font-sans">{prj.summary}</p>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-800/80 text-[11px] font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Student Team:</span>
                    <span className="font-bold text-white">{prj.studentName} ({prj.grade})</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Faculty Mentor:</span>
                    <span className="text-slate-300">{prj.mentor}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-purple-950/30 border border-purple-500/20 text-purple-300 font-bold truncate">
                    🏆 {prj.award}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: COMPETITIONS */}
      {activeTab === 'competitions' && (
        <div className="space-y-5 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {competitions.map((comp) => (
              <div
                key={comp.id}
                className="glass-panel p-6 rounded-3xl border border-amber-500/30 bg-slate-950/80 space-y-4 shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {comp.category}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                      {comp.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug">{comp.name}</h3>

                  <div className="space-y-1.5 text-xs text-slate-400 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>{comp.dates}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{comp.venue}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>Roster: {comp.teamSize}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-2">
                  <div className="text-[11px] font-mono text-slate-400">
                    Deadline: <span className="text-rose-400 font-bold">{comp.registrationDeadline}</span>
                  </div>
                  <button
                    onClick={() => onShowToast('success', 'Roster Registered! 🏆', `DPS Heritage Team entered into ${comp.name}`)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 text-white font-bold text-xs font-mono shadow-lg shadow-amber-500/20 transition-all"
                  >
                    Register School Team
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Project Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 bg-slate-950 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Submit Student Innovation Project</h3>
              </div>
              <button onClick={() => setShowSubmitModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-slate-300">Project Title *</label>
                <input
                  type="text"
                  required
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  placeholder="e.g. Solar Powered Autonomous River Cleaner"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300">Student / Team Lead *</label>
                  <input
                    type="text"
                    required
                    value={projectForm.studentName}
                    onChange={(e) => setProjectForm({ ...projectForm, studentName: e.target.value })}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300">Class & Section *</label>
                  <input
                    type="text"
                    required
                    value={projectForm.grade}
                    onChange={(e) => setProjectForm({ ...projectForm, grade: e.target.value })}
                    placeholder="Class 10-A"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300">STEAM Domain *</label>
                <select
                  value={projectForm.category}
                  onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Smart Agriculture">Smart Agriculture</option>
                  <option value="Environmental IoT">Environmental IoT</option>
                  <option value="Assistive Healthcare">Assistive Healthcare</option>
                  <option value="Drone Avionics">Drone Avionics</option>
                  <option value="AI Edge Vision">AI Edge Vision</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300">Prototype Description & Hardware Used *</label>
                <textarea
                  rows={3}
                  required
                  value={projectForm.summary}
                  onChange={(e) => setProjectForm({ ...projectForm, summary: e.target.value })}
                  placeholder="Explain the problem solved, microcontroller and sensors used, and real-world impact..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold shadow-lg shadow-cyan-500/20"
                >
                  Submit to Portfolio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
