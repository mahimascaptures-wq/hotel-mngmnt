import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  iconClassName?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  iconClassName,
}: StatCardProps) {
  return (
    <div className="card flex items-center gap-4">
      <div
        className={cn(
          'grid h-12 w-12 place-items-center rounded-xl text-white',
          iconClassName || 'bg-brand-600'
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {title}
        </p>
        <p className="mt-0.5 text-2xl font-bold text-slate-900">{value}</p>
        {trend && <p className="mt-0.5 text-xs text-slate-500">{trend}</p>}
      </div>
    </div>
  );
}
