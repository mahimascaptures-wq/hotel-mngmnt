'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { STATUS_COLOR, cn, formatCurrency, formatDate } from '@/lib/utils';
import type { Appointment, Doctor, Patient, AppointmentStatus } from '@/lib/types';

const STATUSES: AppointmentStatus[] = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'];
const SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

const emptyForm = {
  patient: '',
  doctor: '',
  date: '',
  timeSlot: '09:00',
  reason: '',
  status: 'scheduled' as AppointmentStatus,
  fee: 0,
};

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<Appointment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canCreate = !!user;
  const canEdit = ['admin', 'receptionist', 'doctor'].includes(user?.role || '');
  const canDelete = ['admin', 'receptionist'].includes(user?.role || '');

  const load = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const [a, d] = await Promise.all([
        api.get('/appointments', { params }),
        api.get('/doctors'),
      ]);
      setItems(a.data);
      setDoctors(d.data);
      if (['admin', 'receptionist', 'doctor'].includes(user?.role || '')) {
        try {
          const p = await api.get('/patients');
          setPatients(p.data);
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, user?.role]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setOpen(true);
  };

  const openEdit = (a: Appointment) => {
    setEditing(a);
    setForm({
      patient: (a.patient as any)?._id || '',
      doctor: (a.doctor as any)?._id || '',
      date: a.date ? a.date.slice(0, 10) : '',
      timeSlot: a.timeSlot,
      reason: a.reason || '',
      status: a.status,
      fee: a.fee || 0,
    });
    setOpen(true);
  };

  const onChange = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const onDoctorChange = (id: string) => {
    const doc = doctors.find((d) => d._id === id);
    setForm((f) => ({ ...f, doctor: id, fee: doc?.consultationFee || f.fee }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        doctor: form.doctor,
        date: form.date,
        timeSlot: form.timeSlot,
        reason: form.reason,
        fee: form.fee,
      };
      if (user?.role !== 'patient') payload.patient = form.patient;
      if (editing) {
        payload.status = form.status;
        await api.put(`/appointments/${editing._id}`, payload);
        toast.success('Appointment updated');
      } else {
        await api.post('/appointments', payload);
        toast.success('Appointment booked');
      }
      setOpen(false);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      await api.delete(`/appointments/${confirm._id}`);
      toast.success('Appointment deleted');
      setConfirm(null);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Appointments"
        subtitle={`${items.length} appointment${items.length === 1 ? '' : 's'}`}
        actions={
          canCreate && (
            <button onClick={openNew} className="btn-primary">
              <Plus className="h-4 w-4" /> New Appointment
            </button>
          )
        }
      />

      <div className="card">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <button
            onClick={() => setStatusFilter('')}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium',
              statusFilter === '' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
            )}
          >
            All
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium capitalize',
                statusFilter === s ? 'bg-slate-900 text-white' : STATUS_COLOR[s] || 'bg-slate-100 text-slate-700'
              )}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid h-48 place-items-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState title="No appointments" description="Book a new appointment to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date & Time</th>
                  <th>Reason</th>
                  <th>Fee</th>
                  <th>Status</th>
                  {(canEdit || canDelete) && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <p className="font-medium text-slate-900">
                        {(a.patient as any)?.user?.name || '-'}
                      </p>
                      <p className="text-xs text-slate-500">{(a.patient as any)?.user?.email}</p>
                    </td>
                    <td>
                      <p className="font-medium text-slate-900">{(a.doctor as any)?.user?.name}</p>
                      <p className="text-xs text-slate-500">{(a.doctor as any)?.specialization}</p>
                    </td>
                    <td>
                      <p className="font-medium text-slate-900">{formatDate(a.date)}</p>
                      <p className="text-xs text-slate-500">{a.timeSlot}</p>
                    </td>
                    <td className="max-w-xs truncate text-slate-700">{a.reason || '-'}</td>
                    <td>{formatCurrency(a.fee)}</td>
                    <td>
                      <Badge className={cn(STATUS_COLOR[a.status] || 'bg-slate-100 text-slate-700', 'capitalize')}>
                        {a.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="text-right">
                        {canEdit && (
                          <button onClick={() => openEdit(a)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => setConfirm(a)} className="rounded-md p-2 text-rose-500 hover:bg-rose-50">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit Appointment' : 'Book Appointment'}
        size="lg"
        footer={
          <>
            <button onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={onSubmit as any} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editing ? 'Save changes' : 'Book'}
            </button>
          </>
        }
      >
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          {user?.role !== 'patient' && (
            <div className="sm:col-span-2">
              <label className="label">Patient</label>
              <select required className="input" value={form.patient} onChange={(e) => onChange('patient', e.target.value)}>
                <option value="">Select a patient</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.user?.name} ({p.user?.email})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="label">Doctor</label>
            <select required className="input" value={form.doctor} onChange={(e) => onDoctorChange(e.target.value)}>
              <option value="">Select a doctor</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.user?.name} — {d.specialization} ({formatCurrency(d.consultationFee)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input required type="date" className="input" value={form.date} onChange={(e) => onChange('date', e.target.value)} />
          </div>
          <div>
            <label className="label">Time Slot</label>
            <select required className="input" value={form.timeSlot} onChange={(e) => onChange('timeSlot', e.target.value)}>
              {SLOTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Reason for visit</label>
            <input className="input" value={form.reason} onChange={(e) => onChange('reason', e.target.value)} />
          </div>
          <div>
            <label className="label">Fee (USD)</label>
            <input type="number" min={0} className="input" value={form.fee} onChange={(e) => onChange('fee', Number(e.target.value))} />
          </div>
          {editing && (
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => onChange('status', e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={onDelete}
        loading={deleting}
        title="Delete appointment?"
        message="This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}
