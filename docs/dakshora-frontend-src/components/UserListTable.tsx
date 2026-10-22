import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Download,
  Copy,
  Check,
  Calendar,
  Mail,
  User,
  Plus,
  Trash2,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';
import { UserRecord } from '../types';

interface UserListTableProps {
  users: UserRecord[];
  onNavigateToStudio: () => void;
  onClearUsers: () => void;
  onFetchFromDb?: () => void;
  isFetchingDb?: boolean;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const UserListTable: React.FC<UserListTableProps> = ({
  users,
  onNavigateToStudio,
  onClearUsers,
  onFetchFromDb,
  isFetchingDb = false,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const q = searchTerm.toLowerCase();
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, searchTerm]);

  const handleCopyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    onShowToast('info', 'Copied to Clipboard', email);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportJson = () => {
    if (users.length === 0) return;
    const blob = new Blob([JSON.stringify(users, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dakshora-users-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('success', 'Exported JSON', `${users.length} user records saved`);
  };

  const handleExportCsv = () => {
    if (users.length === 0) return;
    const headers = ['id', 'name', 'email', 'created_at'];
    const rows = users.map((u, idx) => [
      u.id || idx + 1,
      `"${u.name.replace(/"/g, '""')}"`,
      `"${u.email.replace(/"/g, '""')}"`,
      u.created_at || new Date().toISOString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dakshora-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('success', 'Exported CSV', `${users.length} user records saved`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Table Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Supabase Records Explorer</h2>
          </div>
          <p className="text-xs text-slate-400">
            Real-time explorer and manager for inserted <code className="text-teal-300 font-mono">test_users</code> records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onFetchFromDb && (
            <button
              onClick={onFetchFromDb}
              disabled={isFetchingDb}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-teal-300 flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="Sync users from Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingDb ? 'animate-spin text-teal-400' : ''}`} />
              <span>{isFetchingDb ? 'Syncing...' : 'Sync Supabase'}</span>
            </button>
          )}

          <button
            onClick={onNavigateToStudio}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:brightness-110 text-white font-semibold text-xs transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New User</span>
          </button>

          {users.length > 0 && (
            <>
              <button
                onClick={handleExportJson}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-all"
                title="Export as JSON"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>JSON</span>
              </button>

              <button
                onClick={handleExportCsv}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-all"
                title="Export as CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>CSV</span>
              </button>

              <button
                onClick={onClearUsers}
                className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 text-xs transition-all"
                title="Clear local list"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-mono"
          />
        </div>
        <div className="text-xs font-mono text-slate-400 whitespace-nowrap">
          Showing <span className="text-teal-400 font-bold">{filteredUsers.length}</span> of {users.length}
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {users.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 mx-auto flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">No Users Created Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Head over to the User Studio to insert your first record to the Supabase database via the backend API.
              </p>
            </div>
            <button
              onClick={onNavigateToStudio}
              className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create First User</span>
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-slate-400">
            No users matched query &ldquo;{searchTerm}&rdquo;
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                  <th className="py-3 px-4 font-semibold">#</th>
                  <th className="py-3 px-4 font-semibold">Name</th>
                  <th className="py-3 px-4 font-semibold">Email</th>
                  <th className="py-3 px-4 font-semibold">Created At</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((user, idx) => {
                  const rowId = String(user.id || idx);
                  const isCopied = copiedId === rowId;
                  return (
                    <tr key={rowId} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4 text-slate-500">
                        {user.id ? String(user.id).slice(0, 8) : idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-200">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-teal-500 text-slate-950 flex items-center justify-center font-bold text-[10px]">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{user.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          <span>{user.email}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-600" />
                          <span>{user.created_at ? new Date(user.created_at).toLocaleString() : 'Recent'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleCopyEmail(user.email, rowId)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-[11px] inline-flex items-center gap-1"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{isCopied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
