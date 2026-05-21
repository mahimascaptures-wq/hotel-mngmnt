'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  LayoutDashboard,
  Users,
  Stethoscope,
  Building2,
  CalendarDays,
  FileText,
  Pill,
  Receipt,
  Settings,
  UserCog,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'doctor', 'receptionist', 'patient'] },
  { href: '/dashboard/patients', label: 'Patients', icon: Users, roles: ['admin', 'doctor', 'receptionist'] },
  { href: '/dashboard/doctors', label: 'Doctors', icon: Stethoscope, roles: ['admin', 'doctor', 'receptionist', 'patient'] },
  { href: '/dashboard/departments', label: 'Departments', icon: Building2, roles: ['admin', 'doctor', 'receptionist', 'patient'] },
  { href: '/dashboard/appointments', label: 'Appointments', icon: CalendarDays, roles: ['admin', 'doctor', 'receptionist', 'patient'] },
  { href: '/dashboard/chat', label: 'Messages', icon: MessageSquare, roles: ['admin', 'doctor', 'receptionist', 'patient'] },
  { href: '/dashboard/records', label: 'Medical Records', icon: FileText, roles: ['admin', 'doctor', 'receptionist', 'patient'] },
  { href: '/dashboard/prescriptions', label: 'Prescriptions', icon: Pill, roles: ['admin', 'doctor', 'receptionist', 'patient'] },
  { href: '/dashboard/invoices', label: 'Invoices', icon: Receipt, roles: ['admin', 'receptionist', 'patient'] },
  { href: '/dashboard/users', label: 'Staff & Users', icon: UserCog, roles: ['admin'] },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, roles: ['admin', 'doctor', 'receptionist', 'patient'] },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const visible = navItems.filter((i) => !user || i.roles.includes(user.role));

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-6">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white shadow-soft">
          <Activity className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <p className="font-bold text-slate-900">MediCare</p>
          <p className="text-xs text-slate-500">Hospital System</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {visible.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon className={cn('h-4 w-4', active && 'text-brand-600')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 p-4 text-white">
          <p className="text-sm font-semibold">Need help?</p>
          <p className="mt-1 text-xs text-brand-100">
            Contact support for assistance with your account.
          </p>
        </div>
      </div>
    </aside>
  );
}
