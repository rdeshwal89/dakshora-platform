import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  FileText,
  ExternalLink
} from 'lucide-react';
import { MediaRecord } from '../types';
import { fetchMedia, uploadMedia } from '../services/api';

interface MediaLibraryHubProps {
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const MediaLibraryHub: React.FC<MediaLibraryHubProps> = ({ onShowToast }) => {
  const [mediaList, setMediaList] = useState<MediaRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [filename, setFilename] = useState('');
  const [url, setUrl] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const res = await fetchMedia();
      if (res.data.media) setMediaList(res.data.media);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filename.trim() || !url.trim()) return;

    try {
      const res = await uploadMedia({ filename: filename.trim(), url: url.trim() });
      if (res.data.success) {
        onShowToast('success', 'Media Registered! 📸', filename);
        setFilename('');
        setUrl('');
        loadMedia();
      }
    } catch {
      onShowToast('error', 'Failed to upload asset', 'Please try again');
    }
  };

  const copyUrl = (assetUrl: string, id: string) => {
    navigator.clipboard.writeText(assetUrl);
    setCopiedId(id);
    onShowToast('info', 'Copied CDN URL', assetUrl);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Media Library & Supabase Storage</h2>
          </div>
          <p className="text-xs text-slate-400">
            Upload, store, and distribute images, logos, course videos, and PDFs across your websites.
          </p>
        </div>

        <button
          onClick={loadMedia}
          disabled={loading}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-pink-400' : ''}`} />
          <span>Refresh Assets</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Form */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-pink-400" />
            <span>Register New Asset</span>
          </h3>

          <form onSubmit={handleUpload} className="space-y-3">
            <div>
              <label className="block text-[11px] font-mono text-slate-300 mb-1">Asset Name</label>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="e.g. course-banner.png"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-pink-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-300 mb-1">Media CDN URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://...supabase.co/storage/v1/..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-pink-300 focus:outline-none focus:border-pink-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-pink-600/20 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Save Media Asset</span>
            </button>
          </form>
        </div>

        {/* Media Grid */}
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mediaList.map((item) => (
              <div
                key={item.id}
                className="glass-panel rounded-2xl border border-slate-800 overflow-hidden group hover:border-pink-500/40 transition-all flex flex-col justify-between"
              >
                <div className="h-36 bg-slate-950 flex items-center justify-center overflow-hidden relative">
                  {item.mime_type.includes('image') ? (
                    <img src={item.url} alt={item.filename} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <FileText className="w-12 h-12 text-slate-600" />
                  )}
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-slate-300 backdrop-blur-md">
                    {(item.size_bytes / 1024).toFixed(0)} KB
                  </span>
                </div>

                <div className="p-4 space-y-2">
                  <div className="font-bold text-xs text-white truncate">{item.filename}</div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-500 font-mono">{item.mime_type}</span>
                    <button
                      onClick={() => copyUrl(item.url, item.id)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 flex items-center gap-1"
                    >
                      {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy URL</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
