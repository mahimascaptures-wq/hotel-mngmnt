'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Loader2, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency, initials } from '@/lib/utils';
import type { Department, Doctor } from '@/lib/types';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  specialization: '',
  department: '',
  qualifications: '',
  experienceYears: 0,
  consultationFee: 0,
  bio: '',
};

export default function DoctorsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<Doctor | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [view, setView] = useState<'cards' | 'table'>('cards');

  const canManage = user?.role === 'admin';

  const load = async () => {
    setLoading(true);
    try {
      const [d, dp] = await Promise.all([
        api.get('/doctors', { params: { search } }),
        api.get('/departments'),
      ]);
      setItems(d.data);
      setDepartments(dp.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setOpen(true);
  };

  const openEdit = (d: Doctor) => {
    setEditing(d);
    setForm({
      name: d.user?.name || '',
      email: d.user?.email || '',
      phone: d.user?.phone || '',
      password: '',
      specialization: d.specialization || '',
      department: (d.department as any)?._id || '',
      qualifications: (d.qualifications || []).join(', '),
      experienceYears: d.experienceYears || 0,
      consultationFee: d.consultationFee || 0,
      bio: d.bio || '',
    });
    setOpen(true);
  };

  const onChange = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        qualifications: form.qualifications
          ? form.qualifications.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        department: form.department || undefined,
      };
      if (editing) {
        await api.put(`/doctors/${editing._id}`, payload);
        toast.success('Doctor updated');
      } else {
        await api.post('/doctors', payload);
        toast.success('Doctor created');
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
      await api.delete(`/doctors/${confirm._id}`);
      toast.success('Doctor deleted');
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
        title="Doctors"
        subtitle={`${items.length} doctor${items.length === 1 ? '' : 's'} on staff`}
        actions={
          <>
            <div className="rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
              <button
                className={`rounded px-3 py-1.5 ${view === 'cards' ? 'bg-brand-600 text-white' : 'text-slate-600'}`}
                onClick={() => setView('cards')}
              >
                Cards
              </button>
              <button
                className={`rounded px-3 py-1.5 ${view === 'table' ? 'bg-brand-600 text-white' : 'text-slate-600'}`}
                onClick={() => setView('table')}
              >
                Table
              </button>
            </div>
            {canManage && (
              <button onClick={openNew} className="btn-primary">
                <Plus className="h-4 w-4" /> Add Doctor
              </button>
            )}
          </>
        }
      />

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search by name, specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid h-48 place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState title="No doctors found" description="Add a doctor to get started." />
        </div>
      ) : view === 'cards' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((d) => (
            <div key={d._id} className="card flex flex-col">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-sm font-semibold text-white">
                    {initials(d.user?.name)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{d.user?.name}</p>
                    <p className="text-xs text-slate-500">{d.specialization}</p>
                  </div>
                </div>
                {canManage && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(d)}
                      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setConfirm(d)}
                      className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-slate-700">
                  <Stethoscope className="mr-1 inline h-3.5 w-3.5 text-slate-400" />
                  {(d.department as any)?.name || 'No department'}
                </p>
                <p className="text-slate-500">{d.user?.email}</p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <Badge className="bg-brand-50 text-brand-700">
                  {d.experienceYears || 0}+ yrs exp
                </Badge>
                <span className="font-semibold text-emerald-600">
                  {formatCurrency(d.consultationFee)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Specialization</th>
                <th>Department</th>
                <th>Experience</th>
                <th>Fee</th>
                {canManage && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-xs font-semibold text-white">
                        {initials(d.user?.name)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{d.user?.name}</p>
                        <p className="text-xs text-slate-500">{d.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>{d.specialization}</td>
                  <td>{(d.department as any)?.name || '-'}</td>
                  <td>{d.experienceYears || 0} yrs</td>
                  <td>{formatCurrency(d.consultationFee)}</td>
                  {canManage && (
                    <td className="text-right">
                      <button onClick={() => openEdit(d)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setConfirm(d)} className="rounded-md p-2 text-rose-500 hover:bg-rose-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit Doctor' : 'New Doctor'}
        size="lg"
        footer={
          <>
            <button onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={onSubmit as any} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      >
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Full Name</label>
            <input required className="input" value={form.name} onChange={(e) => onChange('name', e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input required type="email" className="input" value={form.email} onChange={(e) => onChange('email', e.target.value)} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => onChange('phone', e.target.value)} />
          </div>
          {!editing && (
            <div>
              <label className="label">Password (optional)</label>
              <input type="password" className="input" placeholder="default: doctor123" value={form.password} onChange={(e) => onChange('password', e.target.value)} />
            </div>
          )}
          <div>
            <label className="label">Specialization</label>
            <input required className="input" value={form.specialization} onChange={(e) => onChange('specialization', e.target.value)} />
          </div>
          <div>
            <label className="label">Department</label>
            <select className="input" value={form.department} onChange={(e) => onChange('department', e.target.value)}>
              <option value="">No department</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Experience (years)</label>
            <input type="number" min={0} className="input" value={form.experienceYears} onChange={(e) => onChange('experienceYears', Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Consultation Fee (USD)</label>
            <input type="number" min={0} className="input" value={form.consultationFee} onChange={(e) => onChange('consultationFee', Number(e.target.value))} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Qualifications (comma separated)</label>
            <input className="input" placeholder="MBBS, MD - Cardiology" value={form.qualifications} onChange={(e) => onChange('qualifications', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Bio</label>
            <textarea rows={3} className="input" value={form.bio} onChange={(e) => onChange('bio', e.target.value)} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={onDelete}
        loading={deleting}
        title="Delete doctor?"
        message={`Remove Dr. ${confirm?.user?.name} from the system?`}
        confirmText="Delete"
      />
    </div>
  );
}
