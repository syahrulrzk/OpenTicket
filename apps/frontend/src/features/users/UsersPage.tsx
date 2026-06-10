import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserPlus, MoreVertical, Shield, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import api from '../../lib/axios';
import type { User, PaginationMeta } from '../../types';
import { useAuthStore } from '../../stores/authStore';

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-accent-red/10 text-accent-red',
  IT_MANAGER: 'bg-accent-purple/10 text-accent-purple',
  IT_SUPPORT: 'bg-accent-blue/10 text-accent-blue',
  USER: 'bg-background-overlay text-text-secondary',
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  IT_MANAGER: 'IT Manager',
  IT_SUPPORT: 'IT Support',
  USER: 'User',
};

export function UsersPage() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery<{ data: User[]; meta: PaginationMeta }>({
    queryKey: ['users', search, role, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (role) params.set('role', role);
      params.set('page', String(page));
      params.set('limit', '10');
      const res = await api.get(`/users?${params}`);
      return res.data;
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return api.patch(`/users/${id}`, { isActive: !isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const changeRole = useMutation({
    mutationFn: async ({ id, role: newRole }: { id: string; role: string }) => {
      return api.patch(`/users/${id}/role`, { role: newRole });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const canManage = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'IT_MANAGER';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="sr-only">Users</div>
          <p className="text-sm text-text-muted mt-1">Manage user accounts and roles</p>
        </div>
        {canManage && (
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> New User
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent-blue/10 flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-accent-blue" />
          </div>
          <div>
            <p className="text-xl font-bold text-text-primary">{data?.meta?.total || 0}</p>
            <p className="text-xs text-text-muted">Total Users</p>
          </div>
        </div>
        {['SUPER_ADMIN', 'IT_MANAGER', 'IT_SUPPORT'].map((r) => {
          const count = data?.data?.filter((u) => u.role === r).length || 0;
          return (
            <div key={r} className="card flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${roleColors[r]} flex items-center justify-center`}>
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-text-primary">{count}</p>
                <p className="text-xs text-text-muted">{roleLabels[r]}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-10"
          />
        </div>
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="input-field w-40"
        >
          <option value="">All Roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="IT_MANAGER">IT Manager</option>
          <option value="IT_SUPPORT">IT Support</option>
          <option value="USER">User</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-default bg-background-tertiary/50">
              <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-4 py-3">User</th>
              <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-4 py-3">Role</th>
              <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-4 py-3">Department</th>
              <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-4 py-3">Status</th>
              <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-4 py-3">MFA</th>
              <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-4 py-3">Last Login</th>
              {canManage && <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-4 py-4">
                    <div className="h-10 bg-background-tertiary rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : data?.data.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-text-muted">
                  No users found
                </td>
              </tr>
            ) : (
              data?.data.map((u) => (
                <tr key={u.id} className="hover:bg-background-overlay/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-accent-purple flex items-center justify-center text-xs font-bold text-white">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{u.username}</p>
                        <p className="text-xs text-text-muted">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {canManage && u.id !== currentUser?.id ? (
                      <select
                        value={u.role}
                        onChange={(e) => changeRole.mutate({ id: u.id, role: e.target.value })}
                        className={`badge border-0 cursor-pointer ${roleColors[u.role] || ''}`}
                      >
                        <option value="USER">User</option>
                        <option value="IT_SUPPORT">IT Support</option>
                        <option value="IT_MANAGER">IT Manager</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                      </select>
                    ) : (
                      <span className={`badge ${roleColors[u.role] || ''}`}>
                        {roleLabels[u.role] || u.role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{u.department || '-'}</td>
                  <td className="px-4 py-3">
                    {canManage && u.id !== currentUser?.id ? (
                      <button
                        onClick={() => toggleActive.mutate({ id: u.id, isActive: u.isActive })}
                        className={`badge border ${
                          u.isActive
                            ? 'bg-accent-green/10 text-accent-green border-accent-green/30'
                            : 'bg-background-overlay text-text-muted border-border-default'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </button>
                    ) : (
                      <span className={`badge border ${
                        u.isActive
                          ? 'bg-accent-green/10 text-accent-green border-accent-green/30'
                          : 'bg-background-overlay text-text-muted border-border-default'
                      }`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.isMfaEnabled ? 'bg-accent-cyan/10 text-accent-cyan' : 'bg-background-overlay text-text-muted'}`}>
                      {u.isMfaEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-muted">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <button className="p-1.5 hover:bg-background-overlay rounded text-text-muted hover:text-text-primary">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted">
            Page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} users)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-sm bg-background-tertiary text-text-secondary hover:bg-background-overlay disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
              disabled={page === data.meta.totalPages}
              className="px-3 py-1.5 rounded-lg text-sm bg-background-tertiary text-text-secondary hover:bg-background-overlay disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateUserModal onClose={() => setShowCreate(false)} onSuccess={() => {
          setShowCreate(false);
          queryClient.invalidateQueries({ queryKey: ['users'] });
        }} />
      )}
    </div>
  );
}

function CreateUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ email: '', username: '', password: '', role: 'USER', department: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/users', form);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card max-w-md w-full">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Create New User</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Username</label>
            <input
              type="text"
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="input-field w-full"
            >
              <option value="USER">User</option>
              <option value="IT_SUPPORT">IT Support</option>
              <option value="IT_MANAGER">IT Manager</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Department</label>
            <input
              type="text"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="input-field w-full"
            />
          </div>
          {error && <p className="text-sm text-accent-red">{error}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
