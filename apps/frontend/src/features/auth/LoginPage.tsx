import { useState } from 'react';
import { Ticket, Eye, EyeOff } from 'lucide-react';
import { useLogin } from '../../hooks/useAuth';

function getErrorMessage(err: any): string {
  const data = err?.response?.data;
  if (!data) {
    if (err?.code === 'ERR_NETWORK') return 'Cannot reach the server. Is the backend running on :3000?';
    return err?.message || 'Login failed';
  }
  const msg = data.message;
  if (Array.isArray(msg) && msg.length) return String(msg[0]);
  if (typeof msg === 'string' && msg) return msg;
  if (data.error) return String(data.error);
  return `Login failed (HTTP ${err?.response?.status ?? '?'})`;
}

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-accent-blue rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl text-text-primary">
            <span className="font-normal">Open</span>
            <span className="font-bold">TICKET</span>
          </h1>
          <p className="text-text-muted mt-1">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="admin@itsm.local"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="password123"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-text-muted hover:text-text-secondary"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {loginMutation.isError && (
            <div className="bg-accent-red/10 border border-accent-red/30 text-accent-red text-sm rounded-lg p-3 break-words">
              {getErrorMessage(loginMutation.error)}
            </div>
          )}

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loginMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>

          <div className="text-center">
            <a href="/forgot-password" className="text-sm text-accent-blue hover:underline">
              Forgot password?
            </a>
          </div>
        </form>

        <p className="text-center text-xs text-text-muted mt-6">
          Demo credentials: admin@itsm.local / password123
        </p>
      </div>
    </div>
  );
}
