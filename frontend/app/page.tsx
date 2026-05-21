import Link from 'next/link';
import {
  Activity,
  Calendar,
  HeartPulse,
  Pill,
  Stethoscope,
  Users,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: Users,
      title: 'Patient Management',
      desc: 'Complete patient profiles, history, and demographics.',
    },
    {
      icon: Stethoscope,
      title: 'Doctor Directory',
      desc: 'Specialists, departments, schedules and consultation fees.',
    },
    {
      icon: Calendar,
      title: 'Smart Appointments',
      desc: 'Book, reschedule and track every visit in one place.',
    },
    {
      icon: HeartPulse,
      title: 'Medical Records',
      desc: 'Diagnosis, vitals and treatment history kept secure.',
    },
    {
      icon: Pill,
      title: 'Prescriptions',
      desc: 'Issue and track prescriptions with full medication detail.',
    },
    {
      icon: ShieldCheck,
      title: 'Billing & Invoices',
      desc: 'Auto-generated invoices, taxes and payment tracking.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white shadow-soft">
            <Activity className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            MediCare
          </span>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost">
            Login
          </Link>
          <Link href="/register" className="btn-primary">
            Get Started <ChevronRight className="h-4 w-4" />
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-7xl px-6 pt-12 pb-20 text-center">
        <span className="badge bg-brand-100 text-brand-700">
          Hospital Management System
        </span>
        <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight text-slate-900 sm:text-6xl">
          Modern healthcare,
          <br />
          <span className="bg-gradient-to-r from-brand-600 to-emerald-500 bg-clip-text text-transparent">
            beautifully managed.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
          A complete platform for hospitals to manage patients, doctors,
          appointments, medical records, prescriptions, and billing — all in
          one place.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/register" className="btn-primary px-6 py-3 text-base">
            Create an account
          </Link>
          <Link href="/login" className="btn-secondary px-6 py-3 text-base">
            Sign in
          </Link>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="card text-left transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                {f.title}
              </h3>
              <p className="mt-1 text-sm text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-500">
        Built with Next.js + Node.js. Demo credentials seeded for quick exploration.
      </footer>
    </div>
  );
}
