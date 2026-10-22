import React, { useState, useEffect, useMemo } from 'react';
import {
  Target,
  Search,
  Download,
  Filter,
  Plus,
  RefreshCw,
  Mail,
  Phone,
  Smartphone,
  Globe,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { LeadRecord } from '../types';
import { fetchLeads, captureLead, updateLeadStatus } from '../services/api';

interface LeadsCrmHubProps {
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const LeadsCrmHub: React.FC<LeadsCrmHubProps> = ({ onShowToast }) => {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Simulation Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState<'website' | 'mobile_app' | 'direct'>('website');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const res = await fetchLeads();
      if (res.data.success && Array.isArray(res.data.leads)) {
        setLeads(res.data.leads);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleCaptureLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      onShowToast('error', 'Validation Error', 'Name and Email are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await captureLead({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        source,
        notes: notes.trim() || undefined,
      });

      if (res.data.success) {
        onShowToast('success', 'Lead Captured in CRM! 🎯', `Source: ${source.toUpperCase()}`);
        setName('');
        setEmail('');
        setPhone('');
        setNotes('');
        loadLeads();
      } else {
        onShowToast('error', 'Failed to capture lead', res.data.message);
      }
    } catch (err: any) {
      onShowToast('error', 'Network Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      await updateLeadStatus(leadId, { status: newStatus });
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus as any } : l))
      );
      onShowToast('info', 'Status Updated', `Lead moved to: ${newStatus.toUpperCase()}`);
    } catch {
      onShowToast('error', 'Update Failed', 'Could not update status');
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const matchesSearch =
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.phone && l.phone.includes(searchTerm));
      const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, searchTerm, statusFilter]);

  const handleExportCsv = () => {
    if (leads.length === 0) return;
    const headers = ['id', 'name', 'email', 'phone', 'source', 'status', 'notes', 'created_at'];
    const rows = leads.map((l) => [
      l.id,
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.email.replace(/"/g, '""')}"`,
      `"${l.phone || ''}"`,
      l.source,
      l.status,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      l.created_at || new Date().toISOString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dakshora-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('success', 'Exported Leads CSV', `${leads.length} leads saved`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Target className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Leads & Inquiries CRM</h2>
          </div>
          <p className="text-xs text-slate-400">
            Real-time lead capture stream from Website and Mobile App channels with status pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {leads.length > 0 && (
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          )}

          <button
            onClick={loadLeads}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            <span>Sync Leads</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Lead Capture Simulator (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-xs font-mono text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" />
                <span>Simulate Channel Submission</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">POST /api/leads</span>
            </div>

            <form onSubmit={handleCaptureLead} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ramesh@example.in"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-300 mb-1">Inquiry Source</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSource('website')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-mono flex items-center justify-center gap-1.5 border transition-all ${
                      source === 'website'
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Website</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSource('mobile_app')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-mono flex items-center justify-center gap-1.5 border transition-all ${
                      source === 'mobile_app'
                        ? 'bg-purple-950 border-purple-500 text-purple-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Mobile App</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-300 mb-1">Customer Note</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Inquiry about DAKSHORA AI courses"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>Capture In CRM</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right: Leads Pipeline Table (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search leads by name, email, or phone..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Statuses</option>
              <option value="new">New Leads</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="converted">Converted</option>
            </select>
          </div>

          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            {filteredLeads.length === 0 ? (
              <div className="py-12 text-center text-xs font-mono text-slate-500 bg-slate-950/40">
                No leads found matching filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                      <th className="py-3 px-4 font-semibold">Customer</th>
                      <th className="py-3 px-4 font-semibold">Contact</th>
                      <th className="py-3 px-4 font-semibold">Channel</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{lead.name}</div>
                          {lead.notes && (
                            <div className="text-[11px] text-slate-400 truncate max-w-xs">{lead.notes}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          <div>{lead.email}</div>
                          {lead.phone && <div className="text-slate-500 text-[11px]">{lead.phone}</div>}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                              lead.source === 'website'
                                ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/30'
                                : 'bg-purple-950 text-purple-400 border border-purple-500/30'
                            }`}
                          >
                            {lead.source === 'website' ? <Globe className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                            <span>{lead.source}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={lead.status || 'new'}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-purple-500"
                          >
                            <option value="new">🟢 NEW</option>
                            <option value="contacted">🟡 CONTACTED</option>
                            <option value="qualified">🔵 QUALIFIED</option>
                            <option value="converted">🟣 CONVERTED</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
