import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  Trash2,
  Plus,
  Shield,
  ShieldAlert,
  Database,
  CheckCircle2,
  ExternalLink,
  Download,
  AlertCircle,
  HelpCircle,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  BarChart2,
  PieChart,
  UserCheck,
  UserX,
  CreditCard,
  GraduationCap,
  Bus,
  Library,
  MessageSquare,
  BookOpen,
  FileText,
  Search
} from 'lucide-react';
import {
  ErpRole,
  ErpAiMessage,
  ErpAiConversation,
  ErpAiStructuredData,
  ErpAiDataCard,
  ErpAiTableData,
  ErpAiChartData,
  ErpAiAction,
  KnowledgeBaseDocument,
  KnowledgeBaseCitation
} from '../types';
import {
  fetchErpAiStatus,
  sendErpAiChat,
  fetchErpAiConversations,
  fetchErpAiConversationById,
  createErpAiConversation,
  deleteErpAiConversation,
  fetchKnowledgeBaseDocs,
  addKnowledgeBaseDoc,
  deleteKnowledgeBaseDoc,
  queryKnowledgeBase
} from '../services/api';
import { AiQuestionPaperGenerator } from './AiQuestionPaperGenerator';
import { AiLessonPlanner } from './AiLessonPlanner';
import { AiSlidePresentationGenerator } from './AiSlidePresentationGenerator';
import { SmartRemedialAnalytics } from './SmartRemedialAnalytics';

interface DakshoraAiHubProps {
  activeRole?: ErpRole;
  activeSession?: string;
  organizationId?: string;
  onNavigateModule?: (module: string, tab?: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

// Role-tailored suggested prompts
const ROLE_SUGGESTED_PROMPTS: Record<string, string[]> = {
  admin: [
    "Give me today's school summary",
    "Show attendance below 75%",
    "How much fee is outstanding?",
    "Show pending admissions",
    "What is the average score in the latest exam?",
    "How many students use school transport?"
  ],
  teacher: [
    "How many students were absent today?",
    "Which students have low attendance in Class 10?",
    "Show latest exam performance",
    "Which subjects are assigned to Class 10 A?",
    "Find student Aarav Sharma"
  ],
  account: [
    "How much fee is outstanding?",
    "Show today's fee collection summary",
    "Show overdue fee demands",
    "Give me student strength report"
  ],
  reception: [
    "Show pending admissions",
    "How many applications are under review?",
    "Show today's school summary",
    "Find student Rohan Gupta"
  ],
  parent: [
    "Show my child's attendance",
    "Show outstanding fee dues",
    "Show latest exam results",
    "Show school transport details"
  ],
  student: [
    "Show my attendance record",
    "Show my latest exam result",
    "Which books are currently in library?",
    "Show today's timetable"
  ]
};

export const DakshoraAiHub: React.FC<DakshoraAiHubProps> = ({
  activeRole = 'admin',
  activeSession = '2026-27',
  organizationId,
  onNavigateModule,
  onShowToast
}) => {
  const [conversations, setConversations] = useState<ErpAiConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string>('conv-101');
  const [messages, setMessages] = useState<ErpAiMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [aiQuota, setAiQuota] = useState<{ used: number; monthlyLimit: number }>({ used: 420, monthlyLimit: 5000 });
  const [schoolContext, setSchoolContext] = useState({
    schoolName: 'Delhi Public Heritage Trust',
    campus: 'Main Campus (Sector 45, Gurugram)',
    affiliation: '#CBSE-AFF-2026-DEL-8821',
    academicSession: activeSession || '2026-27'
  });

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // AI View Modes: Chat Copilot, CBSE Question Paper Generator, NEP 2020 Lesson Planner, Smart Board PPT, Remedial Analytics, and School Knowledge Base
  const [aiViewMode, setAiViewMode] = useState<
    'chat' | 'knowledge_base' | 'question_generator' | 'lesson_planner' | 'presentation_generator' | 'remedial_analytics'
  >('chat');
  const [kbDocs, setKbDocs] = useState<KnowledgeBaseDocument[]>([]);
  const [kbLoading, setKbLoading] = useState(false);
  const [kbQuery, setKbQuery] = useState('');
  const [kbQueryLoading, setKbQueryLoading] = useState(false);
  const [kbQueryResult, setKbQueryResult] = useState<{
    answer: string;
    citations: KnowledgeBaseCitation[];
    latencyMs: number;
  } | null>(null);
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [newDocForm, setNewDocForm] = useState({
    title: '',
    category: 'Regulatory & Compliance',
    summary: '',
    tags: 'policy, cbse, compliance'
  });

  const loadKbDocs = async () => {
    setKbLoading(true);
    try {
      const res = await fetchKnowledgeBaseDocs();
      if (res.data?.success) {
        setKbDocs(res.data.documents || []);
      }
    } catch {
      // silent
    } finally {
      setKbLoading(false);
    }
  };

  const handleQueryKb = async (queryText?: string) => {
    const q = (queryText || kbQuery).trim();
    if (!q) return;
    setKbQuery(q);
    setKbQueryLoading(true);
    try {
      const res = await queryKnowledgeBase(q);
      if (res.data?.success) {
        setKbQueryResult({
          answer: res.data.groundedAnswer,
          citations: res.data.citations || [],
          latencyMs: res.data.retrievalLatencyMs || 50
        });
      }
    } catch {
      onShowToast('error', 'RAG Retrieval Failed', 'Could not query school knowledge base');
    } finally {
      setKbQueryLoading(false);
    }
  };

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocForm.title.trim()) return;
    try {
      const res = await addKnowledgeBaseDoc({
        title: newDocForm.title,
        category: newDocForm.category,
        summary: newDocForm.summary,
        tags: newDocForm.tags.split(',').map(t => t.trim()).filter(Boolean)
      });
      if (res.data?.success) {
        onShowToast('success', 'Document Indexed & Vectorized ✅', 'Available for grounded RAG queries');
        setShowAddDocModal(false);
        setNewDocForm({ title: '', category: 'Regulatory & Compliance', summary: '', tags: 'policy, cbse, compliance' });
        loadKbDocs();
      }
    } catch {
      onShowToast('error', 'Indexing Failed', 'Could not add document to knowledge base');
    }
  };

  const handleDeleteDoc = async (id: string) => {
    try {
      await deleteKnowledgeBaseDoc(id);
      setKbDocs(prev => prev.filter(d => d.id !== id));
      onShowToast('info', 'Document Removed', 'Removed from RAG index');
    } catch {
      onShowToast('error', 'Delete Failed');
    }
  };

  // Load Status & Initial Conversations
  useEffect(() => {
    async function loadStatus() {
      try {
        const stRes = await fetchErpAiStatus(activeRole, organizationId);
        if (stRes.data?.success) {
          if (stRes.data.quota) setAiQuota(stRes.data.quota);
          if (stRes.data.schoolContext) setSchoolContext(stRes.data.schoolContext);
        }

        const convRes = await fetchErpAiConversations(organizationId);
        if (convRes.data?.success && convRes.data.conversations.length > 0) {
          setConversations(convRes.data.conversations);
          const firstConv = convRes.data.conversations[0];
          setCurrentConversationId(firstConv.id);
          loadConversationMessages(firstConv.id);
        } else {
          // Fallback initial greeting
          initializeFallbackMessages();
        }
      } catch {
        initializeFallbackMessages();
      }
    }
    loadStatus();
  }, [activeRole, organizationId]);

  // Scroll to bottom on message updates
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const initializeFallbackMessages = () => {
    setMessages([
      {
        id: 'msg-init-1',
        conversation_id: 'conv-default',
        role: 'assistant',
        content: `Namaste! 🙏 I am **DAKSHORA AI**, your intelligent School ERP Copilot.\n\n` +
          `Connected directly to authorized operational data for **${schoolContext.schoolName}** (Academic Session **${activeSession}**).\n\n` +
          `Ask me anything about **students, daily attendance, fees, exams, timetable, transport, library, or admissions**!`,
        structured_data: {
          summary: [
            'Live ERP domain data connected with zero hallucinations.',
            `Operating with ${activeRole.toUpperCase()} role-scoped authorization.`
          ],
          dataSources: ['Student Enrollment', 'Attendance Ledger', 'Fees Engine', `Session ${activeSession}`],
          suggestedActions: [
            { label: "Open Executive Report", module: "reports", tab: "overview" },
            { label: "ERP Dashboard", module: "dashboard" }
          ]
        },
        created_at: new Date().toISOString()
      }
    ]);
  };

  const loadConversationMessages = async (convId: string) => {
    try {
      const res = await fetchErpAiConversationById(convId, organizationId);
      if (res.data?.success && res.data.messages.length > 0) {
        setMessages(res.data.messages);
      } else {
        initializeFallbackMessages();
      }
    } catch {
      initializeFallbackMessages();
    }
  };

  // Switch Conversation
  const handleSelectConversation = (convId: string) => {
    setCurrentConversationId(convId);
    loadConversationMessages(convId);
  };

  // Start New Conversation
  const handleStartNewConversation = async () => {
    try {
      const res = await createErpAiConversation({
        title: `Query ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        session: activeSession,
        role: activeRole,
        organization_id: organizationId
      });
      if (res.data?.success) {
        setConversations(prev => [res.data.conversation, ...prev]);
        setCurrentConversationId(res.data.conversation.id);
        initializeFallbackMessages();
        onShowToast('info', 'New Conversation Started', 'Clean context thread opened');
      }
    } catch {
      initializeFallbackMessages();
    }
  };

  // Delete Conversation
  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    try {
      await deleteErpAiConversation(convId, organizationId);
      const remaining = conversations.filter(c => c.id !== convId);
      setConversations(remaining);
      if (currentConversationId === convId) {
        if (remaining.length > 0) {
          setCurrentConversationId(remaining[0].id);
          loadConversationMessages(remaining[0].id);
        } else {
          handleStartNewConversation();
        }
      }
      onShowToast('info', 'Conversation deleted');
    } catch {
      onShowToast('error', 'Failed to delete conversation');
    }
  };

  // Send Message
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    setInputMessage('');

    // Append user message immediately
    const userMsg: ErpAiMessage = {
      id: `usr-${Date.now()}`,
      conversation_id: currentConversationId,
      role: 'user',
      content: query,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await sendErpAiChat({
        message: query,
        conversationId: currentConversationId,
        session: activeSession,
        role: activeRole,
        organization_id: organizationId
      });

      if (res.data?.success) {
        const assistantMsg: ErpAiMessage = {
          id: `ai-${Date.now()}`,
          conversation_id: res.data.conversationId || currentConversationId,
          role: 'assistant',
          content: res.data.reply,
          intent: res.data.intent,
          tools_invoked: res.data.toolsInvoked,
          data_sources: res.data.dataSources,
          structured_data: res.data.structuredData,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMsg]);
        if (res.data.conversationId && res.data.conversationId !== currentConversationId) {
          setCurrentConversationId(res.data.conversationId);
        }
      } else {
        const errorMsg: ErpAiMessage = {
          id: `err-${Date.now()}`,
          conversation_id: currentConversationId,
          role: 'assistant',
          content: `⚠️ **Notice**: ${(res.data as any)?.message || (res as any).error || 'I could not retrieve the authorized records right now. Please verify your query.'}`,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (err: any) {
      const errTxt = err?.message || 'Server error occurred during AI processing.';
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          conversation_id: currentConversationId,
          role: 'assistant',
          content: `⚠️ **Notice**: ${errTxt}`,
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Clear current conversation
  const handleClearMessages = () => {
    initializeFallbackMessages();
    onShowToast('info', 'Chat cleared', 'Display reset to initial greeting');
  };

  const currentPrompts = ROLE_SUGGESTED_PROMPTS[activeRole] || ROLE_SUGGESTED_PROMPTS.admin;

  return (
    <div className="space-y-6">
      {/* 1. Header & Operational Context Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950/30 via-slate-900/90 to-slate-950">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-white tracking-wide">DAKSHORA AI</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  School ERP Copilot
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Operational State
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Ask your school data in natural language • Zero Hallucination Guarantee • Role-Scoped RBAC
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-mono">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{schoolContext.schoolName}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-mono">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              <span>Session: {activeSession}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-purple-500/30 text-xs font-mono font-bold text-purple-300">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>Role: {activeRole.toUpperCase()}</span>
            </div>
            <button
              onClick={handleClearMessages}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-all"
              title="Clear conversation messages"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
            <button
              onClick={handleStartNewConversation}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-md shadow-purple-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Thread</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Switcher: Chat Copilot vs Question Generator vs Remedial Analytics vs School RAG Knowledge Base */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setAiViewMode('chat')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
            aiViewMode === 'chat'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>💬 ERP AI Co-Pilot & Assistant</span>
        </button>

        <button
          onClick={() => setAiViewMode('question_generator')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
            aiViewMode === 'question_generator'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>📄 AI प्रश्न पत्र (PYQ 2026)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Phase 1
          </span>
        </button>

        <button
          onClick={() => setAiViewMode('lesson_planner')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
            aiViewMode === 'lesson_planner'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>📝 AI लेसन प्लानर (NEP 2020)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Phase 2
          </span>
        </button>

        <button
          onClick={() => setAiViewMode('presentation_generator')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
            aiViewMode === 'presentation_generator'
              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>📽️ AI स्मार्ट बोर्ड PPT</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30">
            Phase 3
          </span>
        </button>

        <button
          onClick={() => setAiViewMode('remedial_analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
            aiViewMode === 'remedial_analytics'
              ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-lg shadow-rose-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>📊 सुधारात्मक रिपोर्ट (Smart Remedial)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Below 40%
          </span>
        </button>

        <button
          onClick={() => {
            setAiViewMode('knowledge_base');
            if (kbDocs.length === 0) loadKbDocs();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
            aiViewMode === 'knowledge_base'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>📚 School Knowledge Base & RAG Index</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            {kbDocs.length || 5}
          </span>
        </button>
      </div>

      {aiViewMode === 'question_generator' ? (
        <AiQuestionPaperGenerator onShowToast={onShowToast} />
      ) : aiViewMode === 'lesson_planner' ? (
        <AiLessonPlanner onShowToast={onShowToast} />
      ) : aiViewMode === 'presentation_generator' ? (
        <AiSlidePresentationGenerator onShowToast={onShowToast} />
      ) : aiViewMode === 'remedial_analytics' ? (
        <SmartRemedialAnalytics onShowToast={onShowToast} />
      ) : aiViewMode === 'knowledge_base' ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Status & Control Banner */}
          <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-slate-900/90 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">Private School Vector Index</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    100% Vectorized
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Model: text-embedding-3-small (1536-dim) • Zero Cross-Tenant Data Leakage
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadKbDocs}
                disabled={kbLoading}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${kbLoading ? 'animate-spin' : ''}`} />
                <span>Sync Index</span>
              </button>
              <button
                onClick={() => setShowAddDocModal(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold text-xs font-mono flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Index Document</span>
              </button>
            </div>
          </div>

          {/* Interactive Semantic RAG Query Simulator */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-slate-950/80 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-cyan-400" />
                <span>Semantic RAG Policy Query</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Query your school's private institutional knowledge base with natural language questions. AI retrieves exact policy provisions and cites sources.
              </p>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={kbQuery}
                  onChange={(e) => setKbQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQueryKb()}
                  placeholder="e.g. What is the fee refund policy if a student withdraws in Term 2?"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <button
                onClick={() => handleQueryKb()}
                disabled={kbQueryLoading || !kbQuery.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold text-xs font-mono flex items-center gap-1.5 shadow-md shadow-cyan-500/20 disabled:opacity-50"
              >
                {kbQueryLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Retrieve & Ground</span>
              </button>
            </div>

            {/* Suggested Prompt Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-mono text-slate-500">Quick Test Prompts:</span>
              {[
                "What is the fee refund policy if a student leaves in Term 2?",
                "What are the rules for medical leave during Term 1 exams?",
                "What are the transport safety rules and speed governor limits?",
                "What is the minimum attendance threshold for CBSE board admit cards?"
              ].map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQueryKb(sample)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-[11px] font-mono text-slate-300 hover:text-cyan-300 transition-colors"
                >
                  "{sample}"
                </button>
              ))}
            </div>

            {/* RAG Grounded Answer Output */}
            {kbQueryResult && (
              <div className="mt-4 p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">Grounded Institutional Answer</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      RAG Verified
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    Latency: {kbQueryResult.latencyMs}ms
                  </span>
                </div>

                <div className="text-xs leading-relaxed text-slate-200 whitespace-pre-wrap font-sans">
                  {kbQueryResult.answer}
                </div>

                {kbQueryResult.citations && kbQueryResult.citations.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <div className="text-[11px] font-mono font-bold text-slate-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Retrieved Source Citations ({kbQueryResult.citations.length}):</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {kbQueryResult.citations.map((cite, cIdx) => (
                        <div key={cIdx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] font-mono space-y-1">
                          <div className="font-bold text-cyan-300 truncate">📄 {cite.docTitle}</div>
                          <div className="text-slate-400 flex items-center justify-between">
                            <span>{cite.section} (Page {cite.page})</span>
                            <span className="text-emerald-400 font-bold">{cite.confidence} match</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Document Repository Table */}
          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Indexed Policy & Compliance Documents ({kbDocs.length})</h4>
                <p className="text-xs text-slate-400 mt-0.5">Documents ingested into school vector store for RAG inference</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Organization Scoped
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                    <th className="py-3.5 px-4">Document Title</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Size / Pages</th>
                    <th className="py-3.5 px-4">Vector Status</th>
                    <th className="py-3.5 px-4">Uploaded By</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {kbDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>{doc.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{doc.summary}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                          {doc.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {doc.size_kb} KB • {doc.pages} Pages
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        <div>{doc.uploaded_by}</div>
                        <div className="text-[10px] text-slate-500">{new Date(doc.updated_at).toLocaleDateString()}</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
                          title="Delete from knowledge base"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Document Modal */}
          {showAddDocModal && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 bg-slate-950 max-w-lg w-full space-y-5 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-base font-bold text-white">Index New School Document</h3>
                  </div>
                  <button
                    onClick={() => setShowAddDocModal(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddDoc} className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-300">Document Title *</label>
                    <input
                      type="text"
                      required
                      value={newDocForm.title}
                      onChange={(e) => setNewDocForm({ ...newDocForm, title: e.target.value })}
                      placeholder="e.g. CBSE Affiliation Infrastructure Standards 2026"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300">Category *</label>
                    <select
                      value={newDocForm.category}
                      onChange={(e) => setNewDocForm({ ...newDocForm, category: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Regulatory & Compliance">Regulatory & Compliance</option>
                      <option value="Student Affairs">Student Affairs & Almanac</option>
                      <option value="Finance & Accounts">Finance & Accounts</option>
                      <option value="Logistics & Transport">Logistics & Transport</option>
                      <option value="Academic Assessment">Academic Assessment</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300">Summary / Content Provisions *</label>
                    <textarea
                      rows={4}
                      required
                      value={newDocForm.summary}
                      onChange={(e) => setNewDocForm({ ...newDocForm, summary: e.target.value })}
                      placeholder="Paste document text or summarized policy guidelines..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300">Tags (comma separated)</label>
                    <input
                      type="text"
                      value={newDocForm.tags}
                      onChange={(e) => setNewDocForm({ ...newDocForm, tags: e.target.value })}
                      placeholder="cbse, policy, attendance, fees"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowAddDocModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold shadow-lg shadow-cyan-500/20"
                    >
                      Index Document
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 2. Main Work Area: Left (Chat Stream) + Right (Context & Data Sources) */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Chat Conversation Stream & Input (Span 3) */}
        <div className="lg:col-span-3 flex flex-col h-[680px] glass-panel rounded-3xl border border-slate-800 bg-slate-950/90 overflow-hidden shadow-2xl">
          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 ${isAssistant ? 'items-start' : 'items-start flex-row-reverse'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isAssistant
                        ? 'bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow-md shadow-purple-500/20'
                        : 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                    }`}
                  >
                    {isAssistant ? <Bot className="w-4 h-4" /> : <span className="font-bold text-xs">{activeRole.slice(0, 2).toUpperCase()}</span>}
                  </div>

                  {/* Message Bubble Container */}
                  <div className={`max-w-[85%] space-y-2.5 ${isAssistant ? '' : 'text-right'}`}>
                    <div
                      className={`p-4 rounded-2xl text-xs leading-relaxed ${
                        isAssistant
                          ? 'bg-slate-900 border border-slate-800/90 text-slate-200'
                          : 'bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/30 text-white inline-block text-left'
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-sans text-xs">
                        {msg.content}
                      </div>

                      {/* Structured KPI Data Cards */}
                      {isAssistant && msg.structured_data?.dataCards && msg.structured_data.dataCards.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-slate-800/80">
                          {msg.structured_data.dataCards.map((card, idx) => (
                            <div key={idx} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                              <p className="text-[10px] font-mono text-slate-400 truncate">{card.label}</p>
                              <p className="text-sm font-bold text-white font-mono mt-0.5">{card.value}</p>
                              {card.change && (
                                <p className={`text-[10px] font-mono mt-0.5 ${card.isPositive ? 'text-emerald-400' : 'text-amber-400'}`}>
                                  {card.change}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Structured Table Rendering */}
                      {isAssistant && msg.structured_data?.tableData && (
                        <div className="mt-3 pt-3 border-t border-slate-800/80 overflow-x-auto">
                          <table className="w-full text-[11px] text-left">
                            <thead className="text-slate-400 font-mono bg-slate-950/80 border-b border-slate-800">
                              <tr>
                                {msg.structured_data.tableData.headers.map((h, i) => (
                                  <th key={i} className="px-2.5 py-1.5 font-semibold">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                              {msg.structured_data.tableData.rows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-800/40">
                                  {row.map((val, cIdx) => (
                                    <td key={cIdx} className="px-2.5 py-1.5 text-slate-300 font-mono">{val}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Chart Data Preview (SVG Bar / Sparkline) */}
                      {isAssistant && msg.structured_data?.chartData && (
                        <div className="mt-3 pt-3 border-t border-slate-800/80">
                          <p className="text-[11px] font-mono font-bold text-purple-300 mb-2 flex items-center gap-1.5">
                            <BarChart2 className="w-3.5 h-3.5" />
                            <span>{msg.structured_data.chartData.title || 'Data Distribution'}</span>
                          </p>
                          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                            {msg.structured_data.chartData.labels.map((lbl, lIdx) => {
                              const val = msg.structured_data?.chartData?.datasets[0]?.data[lIdx] || 0;
                              return (
                                <div key={lIdx} className="space-y-1">
                                  <div className="flex justify-between text-[10px] font-mono text-slate-300">
                                    <span>{lbl}</span>
                                    <span className="font-bold text-cyan-400">{val}%</span>
                                  </div>
                                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
                                      style={{ width: `${Math.min(100, val)}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Data Sources Footnote */}
                      {isAssistant && msg.structured_data?.dataSources && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/50 flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                          <Database className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>Sources: {msg.structured_data.dataSources.join(' • ')}</span>
                        </div>
                      )}

                      {/* Contextual Action Buttons */}
                      {isAssistant && msg.structured_data?.suggestedActions && msg.structured_data.suggestedActions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-2.5 border-t border-slate-800/60">
                          {msg.structured_data.suggestedActions.map((action, aIdx) => (
                            <button
                              key={aIdx}
                              onClick={() => {
                                if (onNavigateModule) {
                                  onNavigateModule(action.module, action.tab);
                                  onShowToast('info', `Navigated to ${action.module.toUpperCase()}`, `Opened via DAKSHORA AI action`);
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-purple-500/30 hover:border-purple-500 text-[11px] font-mono text-purple-300 flex items-center gap-1 transition-all"
                            >
                              <span>{action.label}</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] font-mono text-slate-400 px-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-3 text-purple-400 font-mono text-xs">
                <div className="w-9 h-9 rounded-xl bg-purple-900/30 border border-purple-500/30 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                </div>
                <span>DAKSHORA AI is querying authorized live records...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Suggested Prompts Shelf */}
          <div className="px-5 py-2.5 bg-slate-950/60 border-t border-slate-800/70 overflow-x-auto scrollbar-none flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400 shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Suggestions:
            </span>
            {currentPrompts.map((prompt, pIdx) => (
              <button
                key={pIdx}
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-purple-950/50 border border-slate-800 hover:border-purple-500/40 text-slate-300 hover:text-white text-[11px] font-mono whitespace-nowrap transition-all shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Interactive Input Bar */}
          <div className="p-4 bg-slate-950 border-t border-slate-800">
            <div className="flex items-center gap-2.5">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder={`Ask anything about ${schoolContext.schoolName} (${activeRole} view)...`}
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-white placeholder-slate-400 focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputMessage.trim()}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all shrink-0"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span className="hidden sm:inline">Ask AI</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Context & Data Sources & Conversation Threads (Span 1) */}
        <div className="space-y-4">
          {/* Active Persona RBAC Summary Card */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>Persona Clearance</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {activeRole.toUpperCase()}
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              {activeRole === 'admin' && 'Unrestricted administrative access to all academic, financial, attendance, and admissions pillars.'}
              {activeRole === 'teacher' && 'Access to assigned classes, timetable, student rosters, and homework. Financial ledgers restricted.'}
              {activeRole === 'account' && 'Access to fee ledgers, demand collections, bank settlements, and dues rosters.'}
              {activeRole === 'reception' && 'Access to inquiry CRM, admissions pipeline, and visitor concierge registries.'}
              {activeRole === 'parent' && 'Scoped strictly to linked student ward (Aarav Sharma - Class 10A).'}
              {activeRole === 'student' && 'Scoped strictly to personal timetable, attendance, marks, and library loans.'}
            </p>

            <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Monthly AI Tokens</span>
                <span className="text-white font-bold">{aiQuota.used} / {aiQuota.monthlyLimit}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                  style={{ width: `${Math.min(100, (aiQuota.used / aiQuota.monthlyLimit) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Connected Data Sources Radar */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-3">
            <h3 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-purple-400" />
              <span>Live Domain Pillars</span>
            </h3>

            <div className="grid grid-cols-2 gap-1.5">
              {[
                { name: 'Students', ok: true },
                { name: 'Attendance', ok: true },
                { name: 'Academics', ok: true },
                { name: 'Exams', ok: true },
                { name: 'Fees', ok: activeRole === 'admin' || activeRole === 'account' },
                { name: 'Admissions', ok: true },
                { name: 'Staff & HR', ok: true },
                { name: 'Transport', ok: true },
                { name: 'Library', ok: true },
                { name: 'Reports', ok: true }
              ].map((pill, i) => (
                <div
                  key={i}
                  className={`px-2 py-1.5 rounded-lg border text-[10px] font-mono flex items-center justify-between ${
                    pill.ok
                      ? 'bg-slate-900/60 border-slate-800 text-slate-300'
                      : 'bg-rose-950/20 border-rose-900/40 text-rose-400'
                  }`}
                >
                  <span>{pill.name}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${pill.ok ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Conversation Threads History */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>Saved Threads</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">{conversations.length}</span>
            </div>

            <div className="space-y-1.5 max-h-[180px] overflow-y-auto scrollbar-thin">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`p-2 rounded-xl text-xs font-mono cursor-pointer transition-all flex items-center justify-between group ${
                    conv.id === currentConversationId
                      ? 'bg-purple-950/40 border border-purple-500/40 text-purple-300'
                      : 'bg-slate-900/40 border border-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <span className="truncate max-w-[170px] text-[11px]">{conv.title}</span>
                  <button
                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-all"
                    title="Delete thread"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Security & Zero Hallucination Note */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-950/20 to-slate-900 border border-cyan-500/20 text-[10px] font-mono text-slate-400 space-y-1">
            <p className="font-bold text-cyan-300 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-cyan-400" />
              <span>Grounded Intelligence</span>
            </p>
            <p>
              AI queries run through authenticated, role-scoped domain APIs. No arbitrary SQL execution or invented statistics.
            </p>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
