import { useQuery } from '@tanstack/react-query';
import { Ticket, AlertCircle, CheckCircle, TrendingUp, User } from 'lucide-react';
import api from '../../lib/axios';
import type { DashboardStats } from '../../types';

export function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/tickets/stats');
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="sr-only">Dashboard</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse h-28" />
          ))}
        </div>
      </div>
    );
  }

  const kpiCards = [
    { label: 'Total Tickets', value: stats?.total || 0, icon: Ticket, color: 'text-accent-blue', bg: 'bg-accent-blue/10' },
    { label: 'Open', value: stats?.open || 0, icon: AlertCircle, color: 'text-accent-yellow', bg: 'bg-accent-yellow/10' },
    { label: 'Resolved Today', value: stats?.resolvedToday || 0, icon: CheckCircle, color: 'text-accent-green', bg: 'bg-accent-green/10' },
    { label: 'SLA Compliance', value: `${stats?.slaCompliance || 0}%`, icon: TrendingUp, color: 'text-accent-cyan', bg: 'bg-accent-cyan/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="sr-only">Dashboard</div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div key={card.label} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{card.value}</p>
              <p className="text-sm text-text-muted">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent-purple/10 flex items-center justify-center">
            <User className="w-6 h-6 text-accent-purple" />
          </div>
          <div>
            <p className="text-sm text-text-muted">Top Assignee</p>
            <p className="text-lg font-semibold text-text-primary">
              {stats?.topAssignee?.username || 'No assignee yet'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-muted">Assigned Tickets</p>
          <p className="text-2xl font-bold text-text-primary">{stats?.topAssignee?.count || 0}</p>
        </div>
      </div>

      {/* Priority Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Tickets by Priority</h2>
          <div className="space-y-3">
            {[
              { label: 'Critical', value: stats?.critical || 0, color: 'bg-accent-red' },
              { label: 'High', value: stats?.high || 0, color: 'bg-accent-orange' },
              { label: 'Medium', value: stats?.medium || 0, color: 'bg-accent-yellow' },
              { label: 'Low', value: stats?.low || 0, color: 'bg-accent-green' },
            ].map((item) => {
              const max = Math.max(stats?.critical || 0, stats?.high || 0, stats?.medium || 0, stats?.low || 0, 1);
              const width = (item.value / max) * 100;
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-sm text-text-secondary w-20">{item.label}</span>
                  <div className="flex-1 h-3 bg-background-tertiary rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${width}%` }} />
                  </div>
                  <span className="text-sm font-medium text-text-primary w-8 text-right">{item.value}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Ticket Status</h2>
          <div className="space-y-3">
            {[
              { label: 'Open', value: stats?.open || 0, color: 'text-accent-yellow' },
              { label: 'In Progress', value: stats?.inProgress || 0, color: 'text-accent-blue' },
              { label: 'Resolved', value: stats?.resolved || 0, color: 'text-accent-green' },
              { label: 'Closed', value: stats?.closed || 0, color: 'text-text-muted' },
              { label: 'SLA Breached', value: stats?.slaBreached || 0, color: 'text-accent-red' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2">
                <span className="text-sm text-text-secondary">{item.label}</span>
                <span className={`text-sm font-semibold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}