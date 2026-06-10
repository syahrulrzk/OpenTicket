import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import api from '../../lib/axios';
import type { Ticket, TicketComment } from '../../types';

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

function getSlaSummary(ticket: Ticket) {
  if (!ticket.dueAt) return null;
  const due = new Date(ticket.dueAt).getTime();
  const now = Date.now();
  if (ticket.slaBreached || due <= now) {
    return { label: 'SLA Breached', className: 'bg-accent-red/10 text-accent-red' };
  }
  const diffMinutes = Math.ceil((due - now) / 60000);
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  const label = hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`;
  return { label, className: 'bg-accent-yellow/10 text-accent-yellow' };
}

export function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();

  const { data: ticket, isLoading } = useQuery<Ticket>({
    queryKey: ['ticket', id],
    queryFn: async () => {
      const res = await api.get(`/tickets/${id}`);
      return res.data.data;
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      await api.post(`/tickets/${id}/comments`, { content });
    },
    onSuccess: () => {
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      await api.patch(`/tickets/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-background-tertiary rounded animate-pulse" />
        <div className="card h-96 animate-pulse" />
      </div>
    );
  }

  if (!ticket) {
    return <div className="text-center py-12 text-text-muted">Ticket not found</div>;
  }

  const slaSummary = getSlaSummary(ticket);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link to="/tickets" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Tickets
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-text-muted font-mono mb-1">{ticket.ticketNumber}</p>
                <h1 className="text-2xl font-bold text-text-primary">{ticket.title}</h1>
              </div>
              <div className="flex gap-2">
                <span className={`badge border ${statusColors[ticket.status]}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
                <span className={`badge ${priorityColors[ticket.priority]}`}>
                  {ticket.priority}
                </span>
                {slaSummary && (
                  <span className={`badge ${slaSummary.className}`}>
                    {slaSummary.label}
                  </span>
                )}
              </div>
            </div>
            <p className="text-text-secondary whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Comments */}
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" /> Comments
            </h2>
            <div className="space-y-4 mb-4">
              {(ticket as any).comments?.map((c: TicketComment) => (
                <div key={c.id} className={`p-4 rounded-lg ${c.isInternal ? 'bg-accent-yellow/5 border border-accent-yellow/20' : 'bg-background-tertiary'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-accent-purple flex items-center justify-center text-xs font-bold">
                      {c.author?.username?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-text-primary">{c.author?.username}</span>
                    <span className="text-xs text-text-muted">{new Date(c.createdAt).toLocaleString()}</span>
                    {c.isInternal && <span className="badge bg-accent-yellow/10 text-accent-yellow text-xs">Internal</span>}
                  </div>
                  <p className="text-sm text-text-secondary">{c.content}</p>
                </div>
              ))}
            </div>

            {/* Add comment */}
            <div className="flex gap-3">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="input-field flex-1 min-h-[80px]"
              />
              <button
                onClick={() => commentMutation.mutate(comment)}
                disabled={!comment.trim() || commentMutation.isPending}
                className="btn-primary self-end"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card space-y-4">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Details</h3>
            <div>
              <p className="text-xs text-text-muted mb-1">Requester</p>
              <p className="text-sm text-text-primary">{ticket.requester?.username}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Assignee</p>
              <p className="text-sm text-text-primary">{ticket.assignee?.username || 'Unassigned'}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Category</p>
              <p className="text-sm text-text-primary">{ticket.category?.name || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Created</p>
              <p className="text-sm text-text-primary">{new Date(ticket.createdAt).toLocaleString()}</p>
            </div>
            {ticket.dueAt && (
              <div>
                <p className="text-xs text-text-muted mb-1">SLA Deadline</p>
                <p className={`text-sm font-medium ${new Date(ticket.dueAt) < new Date() ? 'text-accent-red' : 'text-accent-green'}`}>
                  {new Date(ticket.dueAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Actions</h3>
            {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].filter(s => s !== ticket.status).map(s => (
              <button
                key={s}
                onClick={() => statusMutation.mutate(s)}
                className="btn-secondary w-full text-sm"
              >
                Mark as {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}