import React, { useState, useEffect } from 'react';
import {
  Server,
  Database,
  Building2,
  Globe,
  Target,
  Bot,
  Activity,
  ShieldCheck,
  ArrowUpRight,
  RefreshCw,
  Zap,
  Terminal,
  Layers,
  Sparkles,
  Settings,
  AlertTriangle,
  RotateCcw,
  Check,
  ExternalLink
} from 'lucide-react';
import { HealthState, ApiLogEntry } from '../types';
import {
  getBackendBaseUrl,
  setBackendBaseUrl,
  resetBackendBaseUrl,
  LIVE_RENDER_BACKEND_URL,
  fetchOrganizations,
  fetchWebsites,
  fetchLeads
} from '../services/api';

interface DashboardStatusProps {
  health: HealthState;
  onTestBackend: () => void;
  onTestSupabase: () => void;
  onNavigateTab: (tab: any) => void;
  apiLogs: ApiLogEntry[];
  onClearLogs: () => void;
  isRefreshing: boolean;
}

export const DashboardStatus: React.FC<DashboardStatusProps> = ({
  health,
  onTestBackend,
  onTestSupabase,
  onNavigateTab,
  apiLogs,
  onClearLogs,
  isRefreshing,
}) => {
  const [counts, setCounts] = useState({ orgs: 0, sites: 0, leads: 0 });
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const isBackendOnline = health.backend.status === 'online';
  const isSupabaseOnline = health.supabase.status === 'connected';
  const baseUrl = getBackendBaseUrl();

  useEffect(() => {
    async function loadStats() {
      try {
        const [orgsRes, sitesRes, leadsRes] = await Promise.all([
          fetchOrganizations(),
          fetchWebsites(),
          fetchLeads()
        ]);
        setCounts({
          orgs: orgsRes.data.organizations?.length || 1,
          sites: sitesRes.data.websites?.length || 2,
          leads: leadsRes.data.leads?.length || 0
        });
      } catch {
        // silent
      }
    }
    if (isBackendOnline) loadStats();
  }, [isBackendOnline]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Architecture Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-[#11192e] to-slate-900 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono">
              <Zap className="w-3.5 h-3.5" />
              <span>DAKSHORA 2.0 Full Architecture Online</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Enterprise Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-mono">
              Clients (Website/Mobile/Admin) ➔ Fastify Gateway (Auth/CMS/Leads/AI) ➔ Supabase Cloud (Orgs/Sites/Data)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigateTab('ai')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
            >
              <Bot className="w-4 h-4" />
              <span>Launch DAKSHORA AI</span>
            </button>
            <button
              onClick={() => onNavigateTab('leads')}
              className="px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 font-semibold text-xs transition-all flex items-center gap-1.5"
            >
              <Target className="w-4 h-4" />
              <span>Leads CRM</span>
            </button>
          </div>
        </div>
      </div>

      {/* Module Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Orgs */}
        <div
          onClick={() => onNavigateTab('organizations')}
          className="bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/60 p-5 rounded-2xl border-2 border-indigo-200/90 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/10 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              Active Tenants
            </span>
          </div>
          <div className="text-3xl font-black text-slate-950 font-mono tracking-tight">{counts.orgs}</div>
          <div className="text-xs font-extrabold text-indigo-950 flex items-center justify-between">
            <span>Organizations Multi-Tenant</span>
            <ArrowUpRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* Websites */}
        <div
          onClick={() => onNavigateTab('websites')}
          className="bg-gradient-to-br from-teal-50/90 via-white to-emerald-50/60 p-5 rounded-2xl border-2 border-teal-200/90 hover:border-teal-400 hover:shadow-xl hover:shadow-teal-500/10 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-500/25 group-hover:scale-105 transition-transform">
              <Globe className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
              9-Layer Engine
            </span>
          </div>
          <div className="text-3xl font-black text-slate-950 font-mono tracking-tight">{counts.sites}</div>
          <div className="text-xs font-extrabold text-teal-950 flex items-center justify-between">
            <span>Connected CMS Websites</span>
            <ArrowUpRight className="w-4 h-4 text-teal-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* Leads */}
        <div
          onClick={() => onNavigateTab('leads')}
          className="bg-gradient-to-br from-amber-50/90 via-white to-orange-50/60 p-5 rounded-2xl border-2 border-amber-200/90 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-500/10 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/25 group-hover:scale-105 transition-transform">
              <Target className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
              CRM Enquiries
            </span>
          </div>
          <div className="text-3xl font-black text-slate-950 font-mono tracking-tight">{counts.leads}</div>
          <div className="text-xs font-extrabold text-amber-950 flex items-center justify-between">
            <span>Inquiries & Leads Captured</span>
            <ArrowUpRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* AI Engine */}
        <div
          onClick={() => onNavigateTab('ai')}
          className="bg-gradient-to-br from-fuchsia-50/90 via-white to-purple-50/60 p-5 rounded-2xl border-2 border-fuchsia-200/90 hover:border-fuchsia-400 hover:shadow-xl hover:shadow-fuchsia-500/10 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-600 text-white flex items-center justify-center shadow-md shadow-fuchsia-500/25 group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200">
              Co-Pilot Active
            </span>
          </div>
          <div className="text-3xl font-black text-slate-950 font-mono tracking-tight">5 Personas</div>
          <div className="text-xs font-extrabold text-fuchsia-950 flex items-center justify-between">
            <span>DAKSHORA AI Engine</span>
            <ArrowUpRight className="w-4 h-4 text-fuchsia-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Gateway & Supabase Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Backend Card */}
        <div className="p-6 rounded-3xl bg-white border-2 border-slate-200/90 shadow-xl shadow-slate-200/40 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl ${isBackendOnline ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25' : 'bg-rose-600 text-white shadow-md shadow-rose-500/25'}`}>
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-950">Fastify API Gateway</h3>
                <p className="text-xs text-slate-500 font-mono font-bold truncate max-w-[200px] sm:max-w-xs" title={baseUrl || 'Cloud Proxy (Next.js ➔ Render)'}>
                  {baseUrl || 'Cloud Proxy (Next.js ➔ Render)'}
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 text-[11px] font-mono rounded-full font-extrabold border ${
              isBackendOnline
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-rose-100 text-rose-800 border-rose-300'
            }`}>
              {isBackendOnline ? '● GATEWAY LIVE' : '● OFFLINE'}
            </span>
          </div>

          <p className="text-xs text-slate-700 font-mono font-semibold bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 leading-relaxed">
            {typeof health.backend.message === 'string'
              ? health.backend.message
              : typeof health.backend.message === 'object' && health.backend.message !== null
              ? ((health.backend.message as any).message || JSON.stringify(health.backend.message))
              : 'Connecting to Fastify gateway...'}
          </p>

          {/* Recovery and Fallback Controls if Offline */}
          {!isBackendOnline && (
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-xs font-mono space-y-2.5 text-amber-950">
              <div className="flex items-center gap-2 font-black text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Backend Connection Recovery</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed font-semibold">
                If <code className="text-cyan-800 font-bold">api.dakshora.co.in</code> does not have a DNS CNAME record yet, reset to Cloud Proxy or connect directly to Render.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    resetBackendBaseUrl();
                    onTestBackend();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Cloud Proxy</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBackendBaseUrl(LIVE_RENDER_BACKEND_URL);
                    onTestBackend();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>Use Render Direct</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomUrlInput(baseUrl || LIVE_RENDER_BACKEND_URL);
                    setShowUrlModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-bold border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Custom URL</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={onTestBackend}
              disabled={isRefreshing}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Ping Gateway Health (/)</span>
            </button>
            <button
              onClick={() => {
                setCustomUrlInput(baseUrl || LIVE_RENDER_BACKEND_URL);
                setShowUrlModal(true);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 transition-all cursor-pointer"
              title="Configure Gateway URL"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card 2: Supabase Connection */}
        <div className="p-6 rounded-3xl bg-white border-2 border-slate-200/90 shadow-xl shadow-slate-200/40 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl ${isSupabaseOnline ? 'bg-teal-600 text-white shadow-md shadow-teal-500/25' : 'bg-amber-600 text-white shadow-md shadow-amber-500/25'}`}>
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-950">Supabase Cloud DB</h3>
                <p className="text-xs text-slate-500 font-mono font-bold">12 Production Tables & RLS</p>
              </div>
            </div>
            <span className={`px-3 py-1 text-[11px] font-mono rounded-full font-extrabold border ${
              isSupabaseOnline
                ? 'bg-teal-100 text-teal-800 border-teal-300'
                : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}>
              {isSupabaseOnline ? '● DB CONNECTED' : '● DISCONNECTED'}
            </span>
          </div>

          <p className="text-xs text-slate-700 font-mono font-semibold bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 leading-relaxed">
            {typeof health.supabase.message === 'string'
              ? health.supabase.message
              : typeof health.supabase.message === 'object' && health.supabase.message !== null
              ? ((health.supabase.message as any).message || JSON.stringify(health.supabase.message))
              : 'Testing Supabase connection...'}
          </p>

          <button
            onClick={onTestSupabase}
            disabled={isRefreshing}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:brightness-110 text-xs font-bold text-white shadow-md shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Verify Supabase DB & Auth</span>
          </button>
        </div>
      </div>

      {/* Live Stream Logs */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Live API Gateway Stream</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {apiLogs.length} events
            </span>
          </div>

          {apiLogs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="text-xs text-slate-400 hover:text-rose-400 transition-colors font-mono"
            >
              Clear Stream
            </button>
          )}
        </div>

        {apiLogs.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs font-mono bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
            No API activity recorded yet. Click any button or test endpoints to inspect live traffic.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2.5 font-semibold">Time</th>
                  <th className="pb-2.5 font-semibold">Method</th>
                  <th className="pb-2.5 font-semibold">Endpoint</th>
                  <th className="pb-2.5 font-semibold">Status</th>
                  <th className="pb-2.5 font-semibold">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {apiLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-2.5 text-slate-500">{log.timestamp}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        log.method === 'GET'
                          ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/30'
                          : log.method === 'POST'
                          ? 'bg-purple-950 text-purple-400 border border-purple-500/30'
                          : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                      }`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="py-2.5 font-semibold text-slate-200">{log.endpoint}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        log.status >= 200 && log.status < 300
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                      }`}>
                        {log.status === 0 ? 'FAIL' : log.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-400">{log.durationMs}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Configure Custom Gateway Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">Configure Gateway Target</h3>
              </div>
              <button
                onClick={() => setShowUrlModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Fastify Gateway API URL
                </label>
                <input
                  type="text"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  placeholder="https://dakshora-api.onrender.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => setCustomUrlInput(LIVE_RENDER_BACKEND_URL)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/50 transition-all"
                >
                  Fill Render Direct
                </button>
                <button
                  type="button"
                  onClick={() => setCustomUrlInput('')}
                  className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/50 transition-all"
                >
                  Clear (Use Cloud Proxy)
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowUrlModal(false)}
                className="px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (customUrlInput.trim()) {
                    setBackendBaseUrl(customUrlInput.trim());
                  } else {
                    resetBackendBaseUrl();
                  }
                  setShowUrlModal(false);
                  onTestBackend();
                }}
                className="px-4 py-1.5 text-xs font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-xl shadow-md shadow-cyan-500/20 hover:brightness-110 transition-all flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save & Test</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
