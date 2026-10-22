import React, { useState, useEffect } from 'react';
import {
  Building2,
  Globe,
  Target,
  FileText,
  CreditCard,
  Plus,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Layers,
  Search,
  Eye,
  Key,
  Copy,
  Check,
  GraduationCap,
  Shield,
  Send,
  Calendar,
  Bot
} from 'lucide-react';
import { WebsiteRecord, LeadRecord } from '../types';
import { fetchWebsites, fetchLeads, captureLead, sendDakshoraAiChat } from '../services/api';

interface CustomerDashboardViewProps {
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const CustomerDashboardView: React.FC<CustomerDashboardViewProps> = ({
  onShowToast,
  onNavigateTab,
}) => {
  const [websites, setWebsites] = useState<WebsiteRecord[]>([]);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Selected site for live preview modal
  const [previewSite, setPreviewSite] = useState<WebsiteRecord | null>(null);

  // Preview site interactive lead form
  const [studentName, setStudentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);

  // Preview site AI demo
  const [aiPrompt, setAiPrompt] = useState('Lesson plan for Class 10 CBSE Math: Trigonometry (45 mins)');
  const [aiOutput, setAiOutput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);

  const loadTenantData = async () => {
    setLoading(true);
    try {
      const [sitesRes, leadsRes] = await Promise.all([fetchWebsites(), fetchLeads()]);
      if (sitesRes.data.websites) setWebsites(sitesRes.data.websites);
      if (leadsRes.data.leads) setLeads(leadsRes.data.leads);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenantData();
  }, []);

  const handlePreviewLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !parentEmail.trim() || !previewSite) return;

    setIsSubmittingLead(true);
    try {
      const res = await captureLead({
        name: studentName.trim(),
        email: parentEmail.trim(),
        source: 'website',
        notes: `Direct inquiry submitted from live portal: ${previewSite.name}`,
      });

      if (res.data.success) {
        setLeadSuccess(true);
        onShowToast('success', 'Lead Captured in CRM! 🎯', `Submitted from ${previewSite.name}`);
        loadTenantData();
      }
    } catch {
      onShowToast('error', 'Submission Failed', 'Please try again');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const handlePreviewAiChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setAiLoading(true);
    try {
      const res = await sendDakshoraAiChat({
        message: aiPrompt.trim(),
        persona: 'teachers',
      });
      if (res.data.success && res.data.message) {
        setAiOutput(res.data.message);
      }
    } catch {
      onShowToast('error', 'AI Unavailable', 'Could not fetch response');
    } finally {
      setAiLoading(false);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDomain(id);
    onShowToast('info', 'Copied to Clipboard', text);
    setTimeout(() => setCopiedDomain(null), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">Delhi Public Heritage Trust (School Client)</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                Enterprise School OS
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">Organization ID: b17780e5-3832-4ac6-9aeb-33fd80c5cb0e</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadTenantData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-300 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Sync Live</span>
          </button>

          <button
            onClick={() => onNavigateTab('school_erp')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/25 border border-emerald-400/30 transition-all hover:scale-[1.02]"
            title="Open School ERP Dashboard"
          >
            <GraduationCap className="w-4 h-4 text-emerald-100" />
            <span>[ Open School ERP ]</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950/80 text-emerald-300 font-mono">2026–27</span>
          </button>

          <button
            onClick={() => onNavigateTab('school_onboarding')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:brightness-110 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-pink-500/20 border border-pink-400/30 transition-all hover:scale-[1.02]"
            title="Launch 16-Step School ERP Setup & Configuration Wizard"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>Setup School ERP</span>
          </button>

          <button
            onClick={() => onNavigateTab('billing')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 border border-amber-400/30 transition-all hover:scale-[1.02]"
            title="Manage SaaS Plan, Subscriptions & Invoices"
          >
            <CreditCard className="w-4 h-4 text-slate-950" />
            <span>SaaS Billing</span>
          </button>

          <button
            onClick={() => onNavigateTab('websites')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-bold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Site</span>
          </button>
        </div>
      </div>

      {/* Tenant Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-teal-400">
            <span className="text-xs font-mono text-slate-400">Active Live Websites</span>
            <Globe className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{websites.length}</div>
          <p className="text-[10px] text-emerald-400 font-mono">All provisioned & active</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-xs font-mono text-slate-400">Admissions & Inquiries</span>
            <Target className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{leads.length}</div>
          <p className="text-[10px] text-purple-300 font-mono">Synced with CRM pipeline</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-mono text-slate-400">Subscription Status</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-lg font-bold text-white font-mono">₹3,999 / mo</div>
          <p className="text-[10px] text-slate-500 font-mono">Gold Smart School Plan</p>
        </div>
      </div>

      {/* Grid: My Provisioned Websites & Recent Inquiries */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: My Sites with "View Live" (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Active Client Websites & Portals</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">{websites.length} Sites</span>
          </div>

          <div className="space-y-3">
            {websites.map((site) => (
              <div
                key={site.id}
                className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{site.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                      {site.template || 'tpl-school-saas'}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                    <span className="text-cyan-300">https://{site.domain}</span>
                    <button
                      onClick={() => copyText(`https://${site.domain}`, site.id)}
                      className="text-slate-500 hover:text-white"
                      title="Copy URL"
                    >
                      {copiedDomain === site.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => {
                      setPreviewSite(site);
                      setLeadSuccess(false);
                      setAiOutput('');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 hover:brightness-110 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Live</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Real-time Inquiries (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-400" />
              <span>Incoming Admissions & Inquiries</span>
            </h3>
            <button
              onClick={() => onNavigateTab('leads')}
              className="text-xs text-purple-400 hover:underline font-mono"
            >
              Open CRM
            </button>
          </div>

          <div className="space-y-2.5">
            {leads.slice(0, 4).map((lead) => (
              <div
                key={lead.id}
                className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-mono space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{lead.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950/60 text-purple-300 border border-purple-500/30 uppercase">
                    {lead.status}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">{lead.email}</div>
                {lead.notes && <div className="text-[10px] text-slate-500 truncate">{lead.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🌐 HOW TO CONNECT CUSTOM DOMAIN / LAUNCH GUIDE FOR CLIENTS */}
      {/* ========================================================================= */}
      <div className="glass-panel p-6 rounded-3xl border border-blue-500/30 bg-gradient-to-r from-blue-950/20 via-slate-900 to-slate-900 space-y-4">
        <div className="flex items-center gap-2.5">
          <Globe className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-base text-white">How to Launch Real Custom Domain for School Client</h3>
        </div>
        <p className="text-xs text-slate-300 font-mono leading-relaxed">
          Jab aap client (School) ko website sell karte hain aur unki custom domain (jaise <code className="text-cyan-300">www.dpsheritage.com</code>) connect karni ho:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
            <div className="font-bold text-amber-300">Step 1: Domain DNS CNAME</div>
            <p className="text-slate-400 text-[11px]">
              Client ke GoDaddy / Hostinger DNS me <code className="text-white">CNAME</code> record banayein pointing to your server.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
            <div className="font-bold text-cyan-300">Step 2: Assign in Admin Hub</div>
            <p className="text-slate-400 text-[11px]">
              CMS & Sites tab me school name ke sath unki custom domain enter karein. SSL auto-provision ho jata hai.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
            <div className="font-bold text-emerald-300">Step 3: Handover Client Login</div>
            <p className="text-slate-400 text-[11px]">
              SuperAdmin Hub se Principal ka User ID & Password generate karke unhe Customer Portal access de dein!
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 👁️ INTERACTIVE LIVE REAL WORKING WEBSITE MODAL */}
      {/* ========================================================================= */}
      {previewSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0B0F19] border border-cyan-500/40 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{previewSite.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                      LIVE ON CLOUD
                    </span>
                  </div>
                  <p className="text-xs text-cyan-300 font-mono">https://{previewSite.domain}</p>
                </div>
              </div>

              <button
                onClick={() => setPreviewSite(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-mono text-xs"
              >
                ✕ Close Preview
              </button>
            </div>

            {/* School Real Content Body */}
            <div className="space-y-6">
              {/* Hero inside preview */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border border-blue-500/30 text-center space-y-3">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
                  🌟 Admissions Open 2026-27 | CBSE Affiliated
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Welcome to {previewSite.name}
                </h2>
                <p className="text-xs text-slate-300 font-mono max-w-xl mx-auto">
                  State-of-the-art smart campus with experiential learning, robotic science labs, sports academies, and DAKSHORA AI Teacher & Student Copilot.
                </p>
              </div>

              {/* Admission Lead Form Test */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-amber-300 font-mono flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Live Online Admission Form</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Submits directly to Fastify CRM</span>
                </div>

                {leadSuccess ? (
                  <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-center space-y-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                    <div className="font-bold text-xs text-white">Application Recorded! ✅</div>
                    <p className="text-xs text-slate-300 font-mono">
                      Lead has been captured in your Customer Leads CRM pipeline.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handlePreviewLeadSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs font-mono">
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="Student Full Name *"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <input
                        type="email"
                        value={parentEmail}
                        onChange={(e) => setParentEmail(e.target.value)}
                        placeholder="Parent Email *"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <button
                        type="submit"
                        disabled={isSubmittingLead}
                        className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSubmittingLead ? 'Submitting...' : 'Apply Online'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* AI Teacher Copilot inside preview */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-blue-500/30 space-y-3">
                <div className="flex items-center gap-2 text-blue-300 font-bold text-xs font-mono">
                  <Bot className="w-4 h-4" />
                  <span>DAKSHORA AI Teacher Copilot</span>
                </div>
                <form onSubmit={handlePreviewAiChat} className="flex gap-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Enter lesson topic or CBSE concept..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-400"
                  />
                  <button
                    type="submit"
                    disabled={aiLoading || !aiPrompt.trim()}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono flex items-center gap-1"
                  >
                    {aiLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Run AI</span>}
                  </button>
                </form>

                {aiOutput && (
                  <div className="p-4 bg-slate-900/90 rounded-xl border border-blue-500/30 text-xs font-mono text-blue-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {aiOutput}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
