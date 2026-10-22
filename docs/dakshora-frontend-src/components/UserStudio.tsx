import React, { useState } from 'react';
import {
  UserPlus,
  Mail,
  User,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Code2,
  Database,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { createTestUser } from '../services/api';
import { UserRecord } from '../types';

interface UserStudioProps {
  onUserCreated: (user: UserRecord) => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  onNavigateToDatabase: () => void;
}

export const UserStudio: React.FC<UserStudioProps> = ({
  onUserCreated,
  onShowToast,
  onNavigateToDatabase,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const samplePresets = [
    { name: 'Daksh Sharma', email: 'daksh.sharma@example.com' },
    { name: 'Aarav Patel', email: 'aarav.patel@dakshora.ai' },
    { name: 'Priya Verma', email: 'priya.v@company.org' },
    { name: 'Dev Tester', email: 'dev.tester@dakshora.dev' },
  ];

  const handleApplyPreset = (preset: { name: string; email: string }) => {
    setName(preset.name);
    setEmail(preset.email);
    onShowToast('info', 'Preset Loaded', `Applied preset: ${preset.name}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      onShowToast('error', 'Validation Error', 'Name and Email are required');
      return;
    }

    setLoading(true);
    setLastResponse(null);

    try {
      const { data, status, latencyMs } = await createTestUser({
        name: name.trim(),
        email: email.trim(),
      });

      setLastResponse({
        status,
        latencyMs,
        body: data,
      });

      if (data.success) {
        // Confetti celebration
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#38BDF8', '#818CF8', '#34D399', '#C084FC']
          });
        } catch {
          // ignore if canvas is unavailable
        }

        onShowToast('success', 'User Inserted Successfully! 🎉', data.message || 'Supabase record created');

        // Extract user record if provided by Supabase
        const insertedUser: UserRecord =
          Array.isArray(data.data) && data.data.length > 0
            ? data.data[0]
            : { name: name.trim(), email: email.trim(), created_at: new Date().toISOString() };

        onUserCreated(insertedUser);

        // Reset form
        setName('');
        setEmail('');
      } else {
        onShowToast(
          'error',
          'Database Insert Failed',
          data.error || data.message || 'Check Supabase table structure'
        );
      }
    } catch (err: any) {
      onShowToast('error', 'Network Failure', err.message || 'Could not reach backend');
      setLastResponse({
        status: 0,
        error: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResponse = () => {
    if (!lastResponse) return;
    navigator.clipboard.writeText(JSON.stringify(lastResponse, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentPayload = JSON.stringify(
    {
      name: name || '<name>',
      email: email || '<email>',
    },
    null,
    2
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <UserPlus className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">User Studio & Test Generator</h2>
          </div>
          <p className="text-xs text-slate-400">
            Submit user data via <code className="text-indigo-300 font-mono">POST /api/test-user</code> and insert directly into Supabase.
          </p>
        </div>

        <button
          onClick={onNavigateToDatabase}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-2"
        >
          <Database className="w-4 h-4 text-teal-400" />
          <span>View Supabase Records</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Presets (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Create User Record</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">POST /api/test-user</span>
            </div>

            {/* Quick Preset Selector */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-2">
                Quick Sample Presets
              </label>
              <div className="flex flex-wrap gap-2">
                {samplePresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-all font-mono"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Insertion Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Johnson"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex.johnson@example.com"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !name.trim() || !email.trim()}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:brightness-110 text-white font-semibold text-sm shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Insert User to Supabase</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Live Request & Response Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Request Payload Card */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span>JSON Payload to Send</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                application/json
              </span>
            </div>
            <pre className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 text-xs font-mono text-cyan-300 overflow-x-auto">
              {currentPayload}
            </pre>
          </div>

          {/* Last Response Inspector */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-400" />
                <span>Server & DB Response</span>
              </span>
              {lastResponse && (
                <button
                  onClick={handleCopyResponse}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            {lastResponse ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    lastResponse.status === 200
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                  }`}>
                    HTTP {lastResponse.status}
                  </span>
                  {lastResponse.latencyMs && (
                    <span className="text-[10px] font-mono text-slate-400">
                      {lastResponse.latencyMs}ms
                    </span>
                  )}
                </div>
                <pre className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto max-h-56">
                  {JSON.stringify(lastResponse.body || lastResponse, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs font-mono bg-slate-950/50 rounded-xl border border-dashed border-slate-800">
                Submit the form on the left to inspect the live Supabase response.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
