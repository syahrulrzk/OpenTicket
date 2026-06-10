import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { User, Bell, Shield, Globe, Save, Eye, EyeOff, Check } from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../stores/authStore';

type Tab = 'profile' | 'notifications' | 'security' | 'preferences';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [savedNotice, setSavedNotice] = useState('');
  const user = useAuthStore((s) => s.user);

  const showSaved = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(''), 2500);
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Globe },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="sr-only">Settings</div>
        <p className="text-sm text-text-muted mt-1">Manage your account and preferences</p>
      </div>

      {/* Saved Notice */}
      {savedNotice && (
        <div className="card flex items-center gap-3 bg-accent-green/10 border-accent-green/30">
          <Check className="w-5 h-5 text-accent-green" />
          <p className="text-sm text-accent-green font-medium">{savedNotice}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="card p-2 h-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent-blue/10 text-accent-blue'
                  : 'text-text-secondary hover:bg-background-overlay'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-4">
          {activeTab === 'profile' && <ProfileSection user={user} onSaved={showSaved} />}
          {activeTab === 'notifications' && <NotificationsSection onSaved={showSaved} />}
          {activeTab === 'security' && <SecuritySection onSaved={showSaved} />}
          {activeTab === 'preferences' && <PreferencesSection onSaved={showSaved} />}
        </div>
      </div>
    </div>
  );
}

function ProfileSection({ user, onSaved }: { user: any; onSaved: (m: string) => void }) {
  const [form, setForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    department: user?.department || '',
    phone: user?.phone || '',
  });

  const updateProfile = useMutation({
    mutationFn: async (data: typeof form) => api.patch('/auth/me', {
      username: data.username,
      department: data.department,
      phone: data.phone,
    }),
    onSuccess: () => onSaved('Profile updated successfully'),
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to update profile'),
  });

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-text-primary mb-1">Profile Information</h2>
      <p className="text-sm text-text-muted mb-6">Update your personal details</p>

      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border-default">
        <div className="w-16 h-16 rounded-full bg-accent-purple flex items-center justify-center text-xl font-bold text-white">
          {user?.username?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div>
          <p className="font-semibold text-text-primary">{user?.username}</p>
          <p className="text-sm text-text-muted">{user?.role?.replace('_', ' ')}</p>
        </div>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); updateProfile.mutate(form); }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-field w-full"
            />
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
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input-field w-full"
            />
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button type="submit" disabled={updateProfile.isPending} className="btn-primary flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" /> {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

function NotificationsSection({ onSaved }: { onSaved: (m: string) => void }) {
  const [prefs, setPrefs] = useState({
    emailNewTicket: true,
    emailAssigned: true,
    emailStatusChange: true,
    emailSlaBreach: true,
    emailWeeklyDigest: false,
    pushNewComment: true,
    pushMention: true,
  });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    onSaved('Notification preferences saved');
  };

  const Toggle = ({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc: string }) => (
    <div className="flex items-start justify-between py-3 border-b border-border-default last:border-0">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-muted mt-0.5">{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-accent-blue' : 'bg-background-overlay'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );

  return (
    <form onSubmit={save} className="card space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Email Notifications</h2>
        <p className="text-sm text-text-muted mt-1">Choose what updates you receive via email</p>
        <div className="mt-4">
          <Toggle checked={prefs.emailNewTicket} onChange={(v) => setPrefs({ ...prefs, emailNewTicket: v })} label="New tickets" desc="When a new ticket is created" />
          <Toggle checked={prefs.emailAssigned} onChange={(v) => setPrefs({ ...prefs, emailAssigned: v })} label="Ticket assignments" desc="When a ticket is assigned to you" />
          <Toggle checked={prefs.emailStatusChange} onChange={(v) => setPrefs({ ...prefs, emailStatusChange: v })} label="Status changes" desc="When a ticket you follow changes status" />
          <Toggle checked={prefs.emailSlaBreach} onChange={(v) => setPrefs({ ...prefs, emailSlaBreach: v })} label="SLA breach alerts" desc="Critical alerts when SLA is at risk" />
          <Toggle checked={prefs.emailWeeklyDigest} onChange={(v) => setPrefs({ ...prefs, emailWeeklyDigest: v })} label="Weekly digest" desc="A summary of ticket activity every Monday" />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-text-primary">In-App Notifications</h2>
        <p className="text-sm text-text-muted mt-1">Push notifications inside the platform</p>
        <div className="mt-4">
          <Toggle checked={prefs.pushNewComment} onChange={(v) => setPrefs({ ...prefs, pushNewComment: v })} label="New comments" desc="When someone comments on your ticket" />
          <Toggle checked={prefs.pushMention} onChange={(v) => setPrefs({ ...prefs, pushMention: v })} label="Mentions" desc="When someone @mentions you" />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" /> Save Preferences
        </button>
      </div>
    </form>
  );
}

function SecuritySection({ onSaved }: { onSaved: (m: string) => void }) {
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [mfaEnabled, setMfaEnabled] = useState(false);

  const changePassword = useMutation({
    mutationFn: async (data: typeof form) => api.patch('/auth/me/password', {
      currentPassword: data.current,
      newPassword: data.next,
    }),
    onSuccess: () => {
      onSaved('Password changed successfully');
      setForm({ current: '', next: '', confirm: '' });
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to change password'),
  });

  const toggleMfa = useMutation({
    mutationFn: async () => {
      if (mfaEnabled) {
        const pwd = prompt('Enter your password to disable MFA:');
        if (!pwd) throw new Error('Cancelled');
        return api.post('/auth/mfa/disable', { password: pwd });
      }
      return api.post('/auth/mfa/setup');
    },
    onSuccess: () => {
      setMfaEnabled(!mfaEnabled);
      onSaved(mfaEnabled ? 'MFA disabled' : 'MFA setup started — check your authenticator app');
    },
    onError: (err: any) => {
      if (err.message !== 'Cancelled') {
        alert(err.response?.data?.message || 'Failed to toggle MFA');
      }
    },
  });

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => { e.preventDefault(); changePassword.mutate(form); }}
        className="card"
      >
        <h2 className="text-lg font-semibold text-text-primary mb-1">Change Password</h2>
        <p className="text-sm text-text-muted mb-4">Use a strong password with at least 8 characters</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Current password</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                required
                value={form.current}
                onChange={(e) => setForm({ ...form, current: e.target.value })}
                className="input-field w-full pr-10"
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-2.5 text-text-muted">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">New password</label>
            <input
              type={showPwd ? 'text' : 'password'}
              required
              minLength={8}
              value={form.next}
              onChange={(e) => setForm({ ...form, next: e.target.value })}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Confirm new password</label>
            <input
              type={showPwd ? 'text' : 'password'}
              required
              minLength={8}
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              className="input-field w-full"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t border-border-default">
          <button type="submit" disabled={changePassword.isPending} className="btn-primary disabled:opacity-50">
            {changePassword.isPending ? 'Changing...' : 'Update Password'}
          </button>
        </div>
      </form>

      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Two-Factor Authentication</h2>
            <p className="text-sm text-text-muted mt-1">Add an extra layer of security to your account</p>
          </div>
          <button onClick={() => toggleMfa.mutate()} className={`badge border ${
            mfaEnabled ? 'bg-accent-green/10 text-accent-green border-accent-green/30' : 'bg-background-overlay text-text-muted border-border-default'
          }`}>
            {mfaEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-text-primary mb-1">Active Sessions</h2>
        <p className="text-sm text-text-muted mb-4">Manage devices that are currently logged in</p>
        <div className="flex items-center justify-between py-3 border-t border-border-default">
          <div>
            <p className="text-sm font-medium text-text-primary">This browser</p>
            <p className="text-xs text-text-muted">Current session</p>
          </div>
          <span className="badge bg-accent-green/10 text-accent-green">Active</span>
        </div>
      </div>
    </div>
  );
}

function PreferencesSection({ onSaved }: { onSaved: (m: string) => void }) {
  const [prefs, setPrefs] = useState({
    language: 'en',
    timezone: 'Asia/Bangkok',
    dateFormat: 'DD/MM/YYYY',
    theme: 'dark',
    defaultPage: '/',
  });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    onSaved('Preferences saved');
  };

  return (
    <form onSubmit={save} className="card space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-1">Regional Settings</h2>
        <p className="text-sm text-text-muted">Customize language, timezone, and date format</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Language</label>
          <select value={prefs.language} onChange={(e) => setPrefs({ ...prefs, language: e.target.value })} className="input-field w-full">
            <option value="en">English</option>
            <option value="id">Bahasa Indonesia</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Timezone</label>
          <select value={prefs.timezone} onChange={(e) => setPrefs({ ...prefs, timezone: e.target.value })} className="input-field w-full">
            <option value="Asia/Bangkok">Asia/Bangkok (UTC+7)</option>
            <option value="Asia/Jakarta">Asia/Jakarta (UTC+7)</option>
            <option value="UTC">UTC (UTC+0)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Date format</label>
          <select value={prefs.dateFormat} onChange={(e) => setPrefs({ ...prefs, dateFormat: e.target.value })} className="input-field w-full">
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Default landing page</label>
          <select value={prefs.defaultPage} onChange={(e) => setPrefs({ ...prefs, defaultPage: e.target.value })} className="input-field w-full">
            <option value="/">Dashboard</option>
            <option value="/tickets">Tickets</option>
            <option value="/reports">Reports</option>
          </select>
        </div>
      </div>

      <div className="pt-4 border-t border-border-default">
        <h3 className="font-semibold text-text-primary mb-3">Appearance</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'dark', label: 'Dark', desc: 'Recommended for low light' },
            { value: 'light', label: 'Light', desc: 'Clean and minimal' },
          ].map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setPrefs({ ...prefs, theme: t.value })}
              className={`p-4 rounded-lg border text-left transition-colors ${
                prefs.theme === t.value
                  ? 'border-accent-blue bg-accent-blue/5'
                  : 'border-border-default hover:border-text-muted'
              }`}
            >
              <p className="font-medium text-text-primary">{t.label}</p>
              <p className="text-xs text-text-muted mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" /> Save Preferences
        </button>
      </div>
    </form>
  );
}
