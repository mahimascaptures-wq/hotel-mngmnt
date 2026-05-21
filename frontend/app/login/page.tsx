'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, Loader2, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@hospital.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden bg-gradient-to-br from-brand-600 to-brand-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <Activity className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold">MediCare</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold leading-tight">
            Streamline your hospital operations.
          </h2>
          <p className="mt-4 max-w-md text-brand-100">
            A unified workspace for clinicians, receptionists, and patients —
            covering everything from appointments to billing.
          </p>
        </div>
        {/* <div className="rounded-2xl bg-white/10 p-4 text-sm text-brand-50 backdrop-blur">
          <p className="font-medium text-white">Demo accounts</p>
          <ul className="mt-1 space-y-0.5 text-xs">
            <li>admin@hospital.com / admin123</li>
            <li>aisha@hospital.com / doctor123</li>
            <li>reception@hospital.com / reception123</li>
            <li>john@example.com / patient123</li>
          </ul>
        </div> */}
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <form onSubmit={onSubmit} className="w-full max-w-md">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-slate-500 hover:text-slate-700"
          >
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white">
              <Activity className="h-4 w-4" />
            </div>
            <span className="font-semibold text-slate-900">MediCare</span>
          </Link>

          <h1 className="text-3xl font-bold text-slate-900">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter your credentials to access your dashboard.
          </p>

          <div className="mt-8 space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-9"
                  placeholder="you@hospital.com"
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-9"
                  placeholder="Your password"
                />
              </div>
            </div>
          </div>

          <button
            disabled={loading}
            className="btn-primary mt-6 w-full py-2.5"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Sign in'
            )}
          </button>

          <p className="mt-6 text-center text-sm text-slate-500">
            New patient?{' '}
            <Link href="/register" className="font-medium text-brand-600 hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
