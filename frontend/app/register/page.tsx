'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const onChange = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 lg:p-12 order-2 lg:order-1">
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

          <h1 className="text-3xl font-bold text-slate-900">Create account</h1>
          <p className="mt-1 text-sm text-slate-500">
            Register as a patient to book appointments and view records.
          </p>

          <div className="mt-8 space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => onChange('name', e.target.value)}
                className="input"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => onChange('email', e.target.value)}
                className="input"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => onChange('phone', e.target.value)}
                className="input"
                placeholder="+1 555 1234"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => onChange('password', e.target.value)}
                className="input"
                placeholder="At least 6 characters"
              />
            </div>
          </div>

          <button
            disabled={loading}
            className="btn-primary mt-6 w-full py-2.5"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create account'}
          </button>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-brand-600 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>

      <div className="relative hidden bg-gradient-to-br from-emerald-500 to-brand-700 p-12 text-white lg:flex lg:flex-col lg:justify-between order-1 lg:order-2">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <Activity className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold">MediCare</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold leading-tight">
            Your health,
            <br /> in your pocket.
          </h2>
          <p className="mt-4 max-w-md text-emerald-50">
            Book appointments with top specialists, manage prescriptions, and
            keep track of your medical records — all from one place.
          </p>
        </div>
        <div />
      </div>
    </div>
  );
}
