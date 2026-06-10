import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Download, Plus, Search, X } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { useEffect, useRef, useState } from 'react';
import 'react-day-picker/style.css';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import type { Ticket, PaginationMeta, AssignableUser } from '../../types';

const statusColors: Record<string, string> = {
  OPEN: 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/30',
  IN_PROGRESS: 'bg-accent-blue/10 text-accent-blue border-accent-blue/30',
  PENDING: 'bg-accent-orange/10 text-accent-orange border-accent-orange/30',
  RESOLVED: 'bg-accent-green/10 text-accent-green border-accent-green/30',
  CLOSED: 'bg-background-overlay text-text-muted border-border-default',
  CANCELLED: 'bg-accent-red/10 text-accent-red border-accent-red/30',
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-accent-green/10 text-accent-green',
  MEDIUM: 'bg-accent-yellow/10 text-accent-yellow',
  HIGH: 'bg-accent-orange/10 text-accent-orange',
  CRITICAL: 'bg-accent-red/10 text-accent-red',
};

type SavedFilter = {
  name: string;
  search: string;
  status: string;
  priority: string;
};

function getSlaLabel(ticket: Ticket) {
  if (!ticket.dueAt) return { label: '-', className: 'text-text-muted' };
  const due = new Date(ticket.dueAt).getTime();
  const now = Date.now();
  if (ticket.slaBreached || due <= now) {
    return { label: 'Breached', className: 'text-accent-red' };
  }
  const diffMs = due - now;
  const totalMinutes = Math.ceil(diffMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [] as string[];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (!days && minutes) parts.push(`${minutes}m`);
  return { label: parts.join(' ') || 'Soon', className: 'text-accent-yellow' };
}

function getShortTicketNumber(ticket: Ticket) {
  const date = new Date(ticket.createdAt);
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const parts = ticket.ticketNumber.split('-');
  const suffix = parts[parts.length - 1] || '';
  const shortSeq = suffix.slice(-3).padStart(3, '0');
  return `OT${yy}${mm}${dd}${shortSeq}`;
}

export function TicketList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role && user.role !== 'USER';
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const fromRef = useRef<HTMLDivElement | null>(null);
  const toRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (fromRef.current && !fromRef.current.contains(target)) {
        setFromOpen(false);
      }
      if (toRef.current && !toRef.current.contains(target)) {
        setToOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const exportCsv = () => {
    const rows = data?.data || [];
    if (!rows.length) return;
    const headers = ['Ticket Number', 'Title', 'Status', 'Priority', 'Requester', 'Assignee', 'Created'];
    const csvRows = rows.map((ticket) => [
      ticket.ticketNumber,
      ticket.title,
      ticket.status,
      ticket.priority,
      ticket.requester?.username || '',
      ticket.assignee?.username || '',
      new Date(ticket.createdAt).toLocaleDateString(),
    ]);
    const escapeValue = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
    const csv = [headers, ...csvRows]
      .map((row) => row.map(escapeValue).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `tickets-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const { data, isLoading } = useQuery<{ data: Ticket[]; meta: PaginationMeta }>({
    queryKey: ['tickets', search, status, priority, dateFrom, dateTo, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (priority) params.set('priority', priority);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      params.set('page', String(page));
      params.set('limit', '10');
      const res = await api.get(`/tickets?${params}`);
      return res.data;
    },
  });

  const { data: assignees } = useQuery<AssignableUser[]>({
    queryKey: ['assignable-users'],
    queryFn: async () => {
      const res = await api.get('/tickets/assignees');
      return res.data.data;
    },
    enabled: Boolean(canManage),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, nextStatus }: { id: string; nextStatus: string }) => {
      await api.patch(`/tickets/${id}/status`, { status: nextStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const priorityMutation = useMutation({
    mutationFn: async ({ id, nextPriority }: { id: string; nextPriority: string }) => {
      await api.patch(`/tickets/${id}/priority`, { priority: nextPriority });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ id, assigneeId }: { id: string; assigneeId: string }) => {
      await api.patch(`/tickets/${id}/assign`, { assigneeId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="sr-only">Tickets</div>
        <div />
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by ticket or requester name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-10 h-9 text-sm"
            />
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="input-field w-28 h-9 text-sm"
          >
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="PENDING">Pending</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select
            value={priority}
            onChange={(e) => { setPriority(e.target.value); setPage(1); }}
            className="input-field w-28 h-9 text-sm"
          >
            <option value="">All Priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <div ref={fromRef} className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFromOpen((v) => !v);
                setToOpen(false);
              }}
              className={`input-field w-32 h-9 text-sm flex items-center justify-center gap-2 ${dateFrom ? 'text-text-primary' : 'text-text-muted'}`}
            >
              <Calendar className="w-4 h-4" />
              {dateFrom || 'From'}
            </button>
            {fromOpen && (
              <div className="absolute left-12 top-11 z-20 card p-2">
                <DayPicker
                  mode="single"
                  selected={dateFrom ? new Date(`${dateFrom}T00:00:00`) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setDateFrom(date.toISOString().slice(0, 10));
                      setPage(1);
                    }
                    setFromOpen(false);
                  }}
                />
              </div>
            )}
          </div>
          <div ref={toRef} className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setToOpen((v) => !v);
                setFromOpen(false);
              }}
              className={`input-field w-32 h-9 text-sm flex items-center justify-center gap-2 ${dateTo ? 'text-text-primary' : 'text-text-muted'}`}
            >
              <Calendar className="w-4 h-4" />
              {dateTo || 'To'}
            </button>
            {toOpen && (
              <div className="absolute left-10 top-11 z-20 card p-2">
                <DayPicker
                  mode="single"
                  selected={dateTo ? new Date(`${dateTo}T00:00:00`) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setDateTo(date.toISOString().slice(0, 10));
                      setPage(1);
                    }
                    setToOpen(false);
                  }}
                />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatus('');
              setPriority('');
              setDateFrom('');
              setDateTo('');
              setPage(1);
            }}
            className="btn-icon w-8 h-8"
            title="Clear filters"
            aria-label="Clear filters"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={exportCsv}
              disabled={!data?.data?.length}
              className="h-9 px-3 rounded-lg border border-accent-green/30 bg-accent-green/10 text-accent-green text-sm font-semibold flex items-center gap-2 hover:bg-accent-green/20 transition-colors disabled:opacity-50"
              title="Export CSV"
              aria-label="Export CSV"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full table-fixed">
          <thead className="bg-background-tertiary/50">
            <tr className="border-b border-border-default">
              <th className="text-center text-xs font-medium text-text-muted uppercase tracking-wider px-4 py-3 border-r border-border-default/60">No Ticket</th>
              <th className="text-center text-xs font-medium text-text-muted uppercase tracking-wider px-4 py-3 border-r border-border-default/60">Title</th>
              <th className="text-center text-xs font-medium text-text-muted uppercase tracking-wider px-4 py-3 border-r border-border-default/60">Status</th>
              <th className="text-center text-xs font-medium text-text-muted uppercase tracking-wider px-4 py-3 border-r border-border-default/60">Priority</th>
              <th className="text-center text-xs font-medium text-text-muted uppercase tracking-wider px-4 py-3 border-r border-border-default/60">Assignee</th>
              <th className="text-center text-xs font-medium text-text-muted uppercase tracking-wider px-4 py-3 border-r border-border-default/60">Created</th>
              {canManage && (
                <>
                  <th className="text-center text-xs font-medium text-text-muted uppercase tracking-wider px-4 py-3 border-r border-border-default/60">Set Status</th>
                  <th className="text-center text-xs font-medium text-text-muted uppercase tracking-wider px-4 py-3 border-r border-border-default/60">Set Priority</th>
                  <th className="text-center text-xs font-medium text-text-muted uppercase tracking-wider px-4 py-3">Assign</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={canManage ? 9 : 6} className="px-4 py-4">
                    <div className="h-6 bg-background-tertiary rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : data?.data.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 9 : 6} className="text-center py-12 text-text-muted">
                  No tickets found
                </td>
              </tr>
            ) : (
              data?.data.map((ticket) => {
                const sla = getSlaLabel(ticket);
                return (
                <tr
                  key={ticket.id}
                  className="hover:bg-background-overlay/50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-text-muted font-mono border-r border-border-default/60">
                    <button
                      type="button"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                      className="hover:text-text-primary transition-colors"
                      title={ticket.ticketNumber}
                    >
                      {getShortTicketNumber(ticket)}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-text-primary border-r border-border-default/60">
                    <div className="truncate" title={ticket.title}>{ticket.title}</div>
                  </td>
                  <td className="px-4 py-3 border-r border-border-default/60 text-center">
                    <span className={`badge border ${statusColors[ticket.status] || ''}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-r border-border-default/60 text-center">
                    <span className={`badge ${priorityColors[ticket.priority] || ''}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary border-r border-border-default/60">
                    <div
                      className="truncate"
                      title={`Requester: ${ticket.requester?.username || '-'} | SLA: ${sla.label}`}
                    >
                      {ticket.assignee?.username || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-muted border-r border-border-default/60 text-center">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </td>
                  {canManage && (
                    <>
                      <td className="px-4 py-3 text-center border-r border-border-default/60">
                        <select
                          value={ticket.status}
                          onChange={(e) => statusMutation.mutate({ id: ticket.id, nextStatus: e.target.value })}
                          className="input-field h-8 text-xs"
                        >
                          <option value="OPEN">Open</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="PENDING">Pending</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="CLOSED">Closed</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center border-r border-border-default/60">
                        <select
                          value={ticket.priority}
                          onChange={(e) => priorityMutation.mutate({ id: ticket.id, nextPriority: e.target.value })}
                          className="input-field h-8 text-xs"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="CRITICAL">Critical</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <select
                          value={ticket.assignee?.id || ''}
                          onChange={(e) => {
                            const nextId = e.target.value;
                            if (!nextId) return;
                            assignMutation.mutate({ id: ticket.id, assigneeId: nextId });
                          }}
                          className="input-field h-8 text-xs"
                        >
                          <option value="">Assign...</option>
                          {assignees?.map((u) => (
                            <option key={u.id} value={u.id}>{u.username}</option>
                          ))}
                        </select>
                      </td>
                    </>
                  )}
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted">
            Showing {(data.meta.page - 1) * data.meta.limit + 1}-{Math.min(data.meta.page * data.meta.limit, data.meta.total)} of {data.meta.total}
          </p>
          <div className="flex gap-2">
            {Array.from({ length: data.meta.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  p === page
                    ? 'bg-accent-blue text-white'
                    : 'bg-background-tertiary text-text-secondary hover:bg-background-overlay'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}