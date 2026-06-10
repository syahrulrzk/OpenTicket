import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';
import type { TicketCategory, AssignableUser, KnowledgeArticleSuggestion } from '../../types';

export function CreateTicket() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [categoryId, setCategoryId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [suggestQuery, setSuggestQuery] = useState('');
  const user = useAuthStore((s) => s.user);
  const canAssign = user?.role && user.role !== 'USER';

  const { data: categories } = useQuery<TicketCategory[]>({
    queryKey: ['ticket-categories'],
    queryFn: async () => {
      const res = await api.get('/tickets/categories');
      return res.data.data;
    },
  });

  const { data: assignees } = useQuery<AssignableUser[]>({
    queryKey: ['assignable-users'],
    queryFn: async () => {
      const res = await api.get('/tickets/assignees');
      return res.data.data;
    },
    enabled: Boolean(canAssign),
  });

  useEffect(() => {
    const handler = window.setTimeout(() => {
      const nextQuery = `${title} ${description}`.trim();
      setSuggestQuery(nextQuery);
    }, 400);
    return () => window.clearTimeout(handler);
  }, [title, description]);

  const { data: suggestions, isFetching: isSuggesting } = useQuery<KnowledgeArticleSuggestion[]>({
    queryKey: ['knowledge-suggest', suggestQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('q', suggestQuery);
      const res = await api.get(`/knowledge/suggest?${params}`);
      return res.data.data;
    },
    enabled: suggestQuery.length >= 3,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/tickets', data);
      return res.data.data;
    },
    onSuccess: (ticket) => {
      navigate(`/tickets/${ticket.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title,
      description,
      priority,
      categoryId: categoryId || undefined,
      assigneeId: assigneeId || undefined,
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/tickets" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Tickets
        </Link>
        <span className="text-xs uppercase tracking-[0.2em] text-text-muted">New Request</span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="sr-only">Create Ticket</div>
          <p className="text-sm text-text-muted mt-1">Describe the issue and route it to the right person.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <form onSubmit={handleSubmit} className="card space-y-6">
          <div className="rounded-2xl p-5 bg-gradient-to-br from-background-tertiary to-background-secondary border border-border-default/70">
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Ticket Core</p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field"
                  placeholder="Brief description of the issue"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field min-h-[180px]"
                  placeholder="Add context, impact, and any error messages..."
                  required
                />
              </div>
            </div>
          </div>

          <div className={`grid gap-4 ${canAssign ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input-field">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Category</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-field">
                <option value="">Select category</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            {canAssign && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Assign To</label>
                <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="input-field">
                  <option value="">Unassigned</option>
                  {assignees?.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username} ({u.role.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {createMutation.isError && (
            <div className="bg-accent-red/10 border border-accent-red/30 text-accent-red text-sm rounded-lg p-3">
              Failed to create ticket
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-between items-center">
            <span className="text-xs text-text-muted">Fields marked * are required.</span>
            <div className="flex gap-3">
              <Link to="/tickets" className="btn-secondary">Cancel</Link>
              <button
                type="submit"
                disabled={createMutation.isPending || !title || !description}
                className="btn-primary"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Ticket'}
              </button>
            </div>
          </div>
        </form>

        <aside className="space-y-6">
          <div className="card bg-background-secondary/60 border border-border-default/70">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-text-primary">Suggested Articles</p>
              {isSuggesting && <span className="text-xs text-text-muted">Searching...</span>}
            </div>
            {suggestions && suggestions.length > 0 ? (
              <div className="space-y-3">
                {suggestions.map((article) => (
                  <div key={article.id} className="p-4 rounded-xl bg-background-tertiary border border-border-default/60">
                    <p className="text-sm font-medium text-text-primary">{article.title}</p>
                    {article.summary && (
                      <p className="text-xs text-text-muted mt-2">{article.summary}</p>
                    )}
                    {article.category && (
                      <p className="text-xs text-text-secondary mt-3">Category: {article.category.name}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-border-default/60 text-xs text-text-muted">
                Type a bit more to get suggestions.
              </div>
            )}
          </div>

          <div className="card bg-gradient-to-br from-background-tertiary to-background-secondary border border-border-default/70">
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Tips</p>
            <ul className="mt-4 text-sm text-text-secondary space-y-3">
              <li>Include impact, affected system, and when it started.</li>
              <li>Add screenshots or error codes in the description.</li>
              <li>Set priority based on business impact, not urgency.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}