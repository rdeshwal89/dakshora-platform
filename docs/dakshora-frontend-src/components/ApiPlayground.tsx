import React, { useState } from 'react';
import {
  Terminal,
  Send,
  Copy,
  Check,
  Code2,
  Clock,
  Sparkles,
  RefreshCw,
  Layers,
  ArrowRight
} from 'lucide-react';
import { getBackendBaseUrl, makeApiCall } from '../services/api';
import { ApiLogEntry } from '../types';

interface ApiPlaygroundProps {
  onRecordLog: (log: ApiLogEntry) => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const ApiPlayground: React.FC<ApiPlaygroundProps> = ({
  onRecordLog,
  onShowToast,
}) => {
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [endpoint, setEndpoint] = useState('/');
  const [requestBody, setRequestBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);

  const presets = [
    {
      label: '1. Root Health Check',
      method: 'GET' as const,
      endpoint: '/',
      body: '',
    },
    {
      label: '2. Supabase Connection Test',
      method: 'GET' as const,
      endpoint: '/api/supabase-test',
      body: '',
    },
    {
      label: '3. Insert Test User',
      method: 'POST' as const,
      endpoint: '/api/test-user',
      body: JSON.stringify({ name: 'Rohit Sharma', email: 'rohit@dakshora.ai' }, null, 2),
    },
  ];

  const handleSelectPreset = (p: typeof presets[0]) => {
    setMethod(p.method);
    setEndpoint(p.endpoint);
    setRequestBody(p.body);
    onShowToast('info', 'Preset Loaded', `${p.method} ${p.endpoint}`);
  };

  const handleSend = async () => {
    setLoading(true);
    setResponse(null);

    const baseUrl = getBackendBaseUrl();
    const options: RequestInit = {
      method,
    };

    if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody.trim()) {
      try {
        JSON.parse(requestBody); // validate JSON
        options.body = requestBody;
      } catch (err: any) {
        onShowToast('error', 'Invalid JSON Body', err.message);
        setLoading(false);
        return;
      }
    }

    try {
      const result = await makeApiCall(endpoint, options);
      setResponse(result);

      // Record to audit stream
      onRecordLog({
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        method,
        endpoint,
        status: result.status,
        durationMs: result.latencyMs,
        response: result.data,
        isError: result.status < 200 || result.status >= 300,
      });

      if (result.status >= 200 && result.status < 300) {
        onShowToast('success', `HTTP ${result.status} OK`, `${result.latencyMs}ms response time`);
      } else {
        onShowToast('error', `HTTP Error ${result.status}`, result.data.message || 'Request failed');
      }
    } catch (err: any) {
      onShowToast('error', 'Execution Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateCurl = (): string => {
    const baseUrl = getBackendBaseUrl();
    const fullUrl = `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    let curl = `curl -X ${method} "${fullUrl}" \\\n  -H "Content-Type: application/json"`;
    if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody.trim()) {
      curl += ` \\\n  -d '${requestBody.replace(/'/g, "'\\''")}'`;
    }
    return curl;
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(generateCurl());
    setCopiedCurl(true);
    onShowToast('info', 'cURL Snippet Copied', 'Paste into your terminal to test');
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleCopyResponse = () => {
    if (!response) return;
    navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Terminal className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Interactive API Playground</h2>
          </div>
          <p className="text-xs text-slate-400">
            Construct, dispatch, and inspect live HTTP calls directly against the Dakshora backend server.
          </p>
        </div>

        <button
          onClick={handleCopyCurl}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition-all"
        >
          {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedCurl ? 'Copied cURL' : 'Copy as cURL'}</span>
        </button>
      </div>

      {/* Preset Quick Actions */}
      <div>
        <span className="block text-xs font-mono text-slate-400 mb-2">Endpoint Quick Presets:</span>
        <div className="flex flex-wrap gap-2">
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPreset(p)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 transition-all flex items-center gap-2"
            >
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                p.method === 'GET' ? 'bg-cyan-950 text-cyan-400' : 'bg-purple-950 text-purple-400'
              }`}>
                {p.method}
              </span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Request Builder Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Method Select */}
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as any)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-cyan-400 focus:outline-none focus:border-cyan-500"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>

          {/* Base URL Prefix */}
          <span className="hidden sm:inline-flex items-center px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-400">
            {getBackendBaseUrl()}
          </span>

          {/* Endpoint Input */}
          <input
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="/api/test-user"
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{loading ? 'Sending...' : 'Send Request'}</span>
          </button>
        </div>

        {/* Body Editor if POST / PUT */}
        {['POST', 'PUT', 'PATCH'].includes(method) && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Request JSON Payload</span>
              <span className="text-[11px] text-slate-500">Must be valid JSON format</span>
            </div>
            <textarea
              rows={5}
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              placeholder="{\n  &quot;name&quot;: &quot;John Doe&quot;,\n  &quot;email&quot;: &quot;john@example.com&quot;\n}"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-relaxed"
            />
          </div>
        )}
      </div>

      {/* Response Display */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-sm text-white">Response Viewer</h3>
            {response && (
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  response.status >= 200 && response.status < 300
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                }`}>
                  HTTP {response.status === 0 ? 'FAIL' : response.status}
                </span>
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {response.latencyMs} ms
                </span>
              </div>
            )}
          </div>

          {response && (
            <button
              onClick={handleCopyResponse}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono"
            >
              {copiedResponse ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedResponse ? 'Copied' : 'Copy JSON'}</span>
            </button>
          )}
        </div>

        {response ? (
          <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 text-xs font-mono text-slate-200 overflow-x-auto max-h-96 leading-relaxed">
            {JSON.stringify(response.data, null, 2)}
          </pre>
        ) : (
          <div className="py-12 text-center text-slate-500 text-xs font-mono bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
            Click &quot;Send Request&quot; above to inspect the backend response payload and response status.
          </div>
        )}
      </div>
    </div>
  );
};
