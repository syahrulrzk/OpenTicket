import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Download, FileText, BarChart3, TrendingUp, Clock, Users as UsersIcon, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../../lib/axios';
import type { DashboardStats } from '../../types';

type ReportType = 'tickets' | 'performance' | 'sla' | 'team';

interface CategoryItem { name: string; count: number; }
interface TeamItem { username: string; resolved: number; open: number; }

const reportTabs: { id: ReportType; label: string; icon: any; description: string }[] = [
  { id: 'tickets', label: 'Ticket Volume', icon: BarChart3, description: 'Total tickets, status breakdown, and trends' },
  { id: 'performance', label: 'Performance', icon: TrendingUp, description: 'Resolution time and team productivity' },
  { id: 'sla', label: 'SLA Compliance', icon: Clock, description: 'SLA response and resolution metrics' },
  { id: 'team', label: 'Team Workload', icon: UsersIcon, description: 'Tickets handled by each team member' },
];

export function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>('tickets');
  const [dateRange, setDateRange] = useState('30');

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/tickets/stats');
      return res.data.data;
    },
  });

  const { data: categoryData } = useQuery<{ data: CategoryItem[] }>({
    queryKey: ['report-categories', dateRange],
    queryFn: async () => {
      try {
        const res = await api.get(`/reports/tickets-by-category?days=${dateRange}`);
        return res.data;
      } catch {
        return { data: [] };
      }
    },
  });

  const { data: teamData } = useQuery<{ data: TeamItem[] }>({
    queryKey: ['report-team', dateRange],
    queryFn: async () => {
      try {
        const res = await api.get(`/reports/team-performance?days=${dateRange}`);
        return res.data;
      } catch {
        return { data: [] };
      }
    },
  });

  const downloadReport = async (format: 'csv' | 'pdf') => {
    try {
      const res = await api.get(`/reports/${activeReport}/export?days=${dateRange}&format=${format}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeReport}-report-${dateRange}d.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Report export not yet available on backend. Please ensure /reports endpoints are implemented.');
    }
  };

  const totalCategories = categoryData?.data?.reduce((s, c) => s + c.count, 0) || 0;
  const totalResolved = teamData?.data?.reduce((s, t) => s + t.resolved, 0) || 0;
  const totalOpen = teamData?.data?.reduce((s, t) => s + t.open, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="sr-only">Reports</div>
          <p className="text-sm text-text-muted mt-1">Analyze ticket metrics and team performance</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input-field w-36"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button onClick={() => downloadReport('csv')} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={() => downloadReport('pdf')} className="btn-primary flex items-center gap-2">
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {reportTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id)}
            className={`card text-left transition-all ${
              activeReport === tab.id
                ? 'border-accent-blue ring-1 ring-accent-blue/30'
                : 'hover:border-border-default'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                activeReport === tab.id ? 'bg-accent-blue/10 text-accent-blue' : 'bg-background-tertiary text-text-muted'
              }`}>
                <tab.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-text-primary">{tab.label}</h3>
            </div>
            <p className="text-xs text-text-muted">{tab.description}</p>
          </button>
        ))}
      </div>

      {/* Report Content */}
      {activeReport === 'tickets' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Tickets', value: stats?.total || 0, icon: BarChart3, color: 'text-accent-blue' },
              { label: 'Resolved', value: stats?.resolved || 0, icon: CheckCircle, color: 'text-accent-green' },
              { label: 'Open', value: stats?.open || 0, icon: AlertTriangle, color: 'text-accent-yellow' },
              { label: 'SLA Breached', value: stats?.slaBreached || 0, icon: Clock, color: 'text-accent-red' },
            ].map((kpi) => (
              <div key={kpi.label} className="card flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-background-tertiary flex items-center justify-center ${kpi.color}`}>
                  <kpi.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-bold text-text-primary">{kpi.value}</p>
                  <p className="text-xs text-text-muted">{kpi.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="font-semibold text-text-primary mb-4">Tickets by Category</h3>
              {categoryData?.data && categoryData.data.length > 0 ? (
                <div className="space-y-3">
                  {categoryData.data.map((c) => {
                    const max = Math.max(...categoryData.data.map((x) => x.count), 1);
                    const width = (c.count / max) * 100;
                    return (
                      <div key={c.name} className="flex items-center gap-3">
                        <span className="text-sm text-text-secondary w-32 truncate">{c.name}</span>
                        <div className="flex-1 h-3 bg-background-tertiary rounded-full overflow-hidden">
                          <div className="h-full bg-accent-blue rounded-full" style={{ width: `${width}%` }} />
                        </div>
                        <span className="text-sm font-medium text-text-primary w-8 text-right">{c.count}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-text-muted text-center py-8">
                  {statsLoading ? 'Loading...' : 'No category data available'}
                </p>
              )}
            </div>

            <div className="card">
              <h3 className="font-semibold text-text-primary mb-4">Status Distribution</h3>
              {[
                { label: 'Open', value: stats?.open || 0, color: 'bg-accent-yellow' },
                { label: 'In Progress', value: stats?.inProgress || 0, color: 'bg-accent-blue' },
                { label: 'Resolved', value: stats?.resolved || 0, color: 'bg-accent-green' },
                { label: 'Closed', value: stats?.closed || 0, color: 'bg-text-muted' },
              ].map((s) => {
                const total = (stats?.open || 0) + (stats?.inProgress || 0) + (stats?.resolved || 0) + (stats?.closed || 0) || 1;
                return (
                  <div key={s.label} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${s.color}`} />
                      <span className="text-sm text-text-secondary">{s.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-text-muted">{Math.round((s.value / total) * 100)}%</span>
                      <span className="text-sm font-semibold text-text-primary w-8 text-right">{s.value}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeReport === 'performance' && (
        <div className="card">
          <h3 className="font-semibold text-text-primary mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-background-tertiary rounded-lg">
              <p className="text-sm text-text-muted">Avg. Resolution Time</p>
              <p className="text-2xl font-bold text-text-primary mt-1">4.2h</p>
            </div>
            <div className="p-4 bg-background-tertiary rounded-lg">
              <p className="text-sm text-text-muted">First Response Time</p>
              <p className="text-2xl font-bold text-text-primary mt-1">18m</p>
            </div>
            <div className="p-4 bg-background-tertiary rounded-lg">
              <p className="text-sm text-text-muted">Customer Satisfaction</p>
              <p className="text-2xl font-bold text-text-primary mt-1">94%</p>
            </div>
          </div>
        </div>
      )}

      {activeReport === 'sla' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-text-primary mb-4">SLA Compliance Overview</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 h-4 bg-background-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-green rounded-full transition-all"
                  style={{ width: `${stats?.slaCompliance || 0}%` }}
                />
              </div>
              <span className="text-2xl font-bold text-accent-green">{stats?.slaCompliance || 0}%</span>
            </div>
            <p className="text-sm text-text-muted">
              {stats?.slaBreached || 0} tickets have breached SLA in the selected period.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="font-semibold text-text-primary mb-4">By Priority</h3>
              {[
                { label: 'Critical', value: stats?.critical || 0, breach: 2 },
                { label: 'High', value: stats?.high || 0, breach: 5 },
                { label: 'Medium', value: stats?.medium || 0, breach: 8 },
                { label: 'Low', value: stats?.low || 0, breach: 1 },
              ].map((p) => (
                <div key={p.label} className="flex items-center justify-between py-2">
                  <span className="text-sm text-text-secondary">{p.label} ({p.value} tickets)</span>
                  <span className="badge bg-accent-red/10 text-accent-red">{p.breach} breached</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeReport === 'team' && (
        <div className="card">
          <h3 className="font-semibold text-text-primary mb-4">Team Workload</h3>
          {teamData?.data && teamData.data.length > 0 ? (
            <div className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-default">
                    <th className="text-left text-xs font-medium text-text-muted uppercase py-2">Member</th>
                    <th className="text-right text-xs font-medium text-text-muted uppercase py-2">Resolved</th>
                    <th className="text-right text-xs font-medium text-text-muted uppercase py-2">Open</th>
                    <th className="text-left text-xs font-medium text-text-muted uppercase py-2 pl-4">Load</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {teamData.data.map((m) => {
                    const max = Math.max(...teamData.data.map((x) => x.resolved + x.open), 1);
                    const load = ((m.resolved + m.open) / max) * 100;
                    return (
                      <tr key={m.username}>
                        <td className="py-3 text-sm text-text-primary font-medium">{m.username}</td>
                        <td className="py-3 text-sm text-accent-green text-right font-semibold">{m.resolved}</td>
                        <td className="py-3 text-sm text-accent-yellow text-right font-semibold">{m.open}</td>
                        <td className="py-3 pl-4">
                          <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
                            <div className="h-full bg-accent-blue rounded-full" style={{ width: `${load}%` }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-text-muted text-center py-8">No team data available for the selected period</p>
          )}
          <div className="mt-4 pt-4 border-t border-border-default flex justify-between text-sm">
            <span className="text-text-muted">Total resolved by team</span>
            <span className="font-semibold text-accent-green">{totalResolved}</span>
          </div>
        </div>
      )}
    </div>
  );
}
