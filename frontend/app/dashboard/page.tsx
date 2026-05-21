'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Stethoscope,
  Building2,
  CalendarDays,
  DollarSign,
  Activity,
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  STATUS_COLOR,
  cn,
  formatCurrency,
  formatDate,
} from '@/lib/utils';
import type { DashboardStats } from '@/lib/types';

const PIE_COLORS = ['#2f85ff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'patient') {
      setLoading(false);
      return;
    }
    api
      .get('/dashboard')
      .then((r) => setStats(r.data))
      .finally(() => setLoading(false));
  }, [user]);

  if (user?.role === 'patient') {
    return (
      <div>
        <PageHeader
          title={`Welcome, ${user.name}`}
          subtitle="Here's a quick view of your health summary."
        />
        <div className="card text-center">
          <Activity className="mx-auto mb-3 h-12 w-12 text-brand-500" />
          <h2 className="text-lg font-semibold">Patient Portal</h2>
          <p className="mt-1 text-sm text-slate-500">
            Use the sidebar to book appointments, view prescriptions, medical
            records, and invoices.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid h-[60vh] place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!stats) return null;

  const statusData = Object.entries(stats.appointmentsByStatus || {}).map(
    ([name, value]) => ({ name, value })
  );

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.name}. Here's what's happening today.`}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          title="Patients"
          value={stats.counts.patients}
          icon={Users}
          iconClassName="bg-brand-600"
        />
        <StatCard
          title="Doctors"
          value={stats.counts.doctors}
          icon={Stethoscope}
          iconClassName="bg-emerald-600"
        />
        <StatCard
          title="Departments"
          value={stats.counts.departments}
          icon={Building2}
          iconClassName="bg-violet-600"
        />
        <StatCard
          title="Today's Visits"
          value={stats.counts.appointmentsToday}
          icon={CalendarDays}
          iconClassName="bg-amber-500"
        />
        <StatCard
          title="Total Visits"
          value={stats.counts.totalAppointments}
          icon={Activity}
          iconClassName="bg-rose-500"
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(stats.counts.revenue)}
          icon={DollarSign}
          iconClassName="bg-cyan-600"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">
              Appointments — last 6 months
            </h3>
            <span className="text-xs text-slate-500">trend</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.apptTrend}>
                <defs>
                  <linearGradient id="apptGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2f85ff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2f85ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#2f85ff"
                  strokeWidth={2}
                  fill="url(#apptGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4 font-semibold text-slate-900">
            Appointment Status
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">
              Revenue — last 6 months
            </h3>
            <span className="text-xs text-slate-500">USD</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(v: any) => formatCurrency(v)}
                />
                <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-3 font-semibold text-slate-900">
            Recent Appointments
          </h3>
          <ul className="divide-y divide-slate-100">
            {stats.recentAppointments.map((a) => (
              <li key={a._id} className="flex items-center gap-3 py-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                  {(a.patient as any)?.user?.name?.[0] || 'P'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {(a.patient as any)?.user?.name || 'Patient'}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {(a.doctor as any)?.user?.name || 'Doctor'} •{' '}
                    {formatDate(a.date)} {a.timeSlot}
                  </p>
                </div>
                <Badge
                  className={cn(
                    STATUS_COLOR[a.status] || 'bg-slate-100 text-slate-700'
                  )}
                >
                  {a.status}
                </Badge>
              </li>
            ))}
            {stats.recentAppointments.length === 0 && (
              <li className="py-6 text-center text-sm text-slate-500">
                No appointments yet
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
