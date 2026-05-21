'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatDate, initials } from '@/lib/utils';
import type { Patient } from '@/lib/types';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  dateOfBirth: '',
  gender: 'other',
  bloodGroup: 'Unknown',
  address: '',
  allergies: '',
  chronicConditions: '',
};

export default function PatientsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canManage = user?.role === 'admin' || user?.role === 'receptionist';

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/patients', { params: { search } });
      setItems(res.data);
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

  const openEdit = (p: Patient) => {
    setEditing(p);
    setForm({
      name: p.user?.name || '',
      email: p.user?.email || '',
      phone: p.user?.phone || '',
      password: '',
      dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : '',
      gender: p.gender || 'other',
      bloodGroup: p.bloodGroup || 'Unknown',
      address: p.address || '',
      allergies: (p.allergies || []).join(', '),
      chronicConditions: (p.chronicConditions || []).join(', '),
    });
    setOpen(true);
  };

  const onChange = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        allergies: form.allergies ? form.allergies.split(',').map((s) => s.trim()).filter(Boolean) : [],
        chronicConditions: form.chronicConditions ? form.chronicConditions.split(',').map((s) => s.trim()).filter(Boolean) : [],
      };
      if (editing) {
        await api.put(`/patients/${editing._id}`, payload);
        toast.success('Patient updated');
      } else {
        await api.post('/patients', payload);
        toast.success('Patient created');
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
      await api.delete(`/patients/${confirm._id}`);
      toast.success('Patient deleted');
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
        title="Patients"
        subtitle={`${items.length} patient${items.length === 1 ? '' : 's'} registered`}
        actions={
          canManage && (
            <button onClick={openNew} className="btn-primary">
              <Plus className="h-4 w-4" /> Add Patient
            </button>
          )
        }
      />

      <div className="card">
        <div className="mb-4 flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search by name, email, phone..."
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
          <EmptyState title="No patients found" description="Add the first patient to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Contact</th>
                  <th>Gender</th>
                  <th>Blood Group</th>
                  <th>DOB</th>
                  <th>Joined</th>
                  {canManage && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-semibold text-white">
                          {initials(p.user?.name)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{p.user?.name}</p>
                          <p className="text-xs text-slate-500">{p.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-slate-700">{p.user?.phone || '-'}</td>
                    <td className="capitalize text-slate-700">{p.gender || '-'}</td>
                    <td>
                      <Badge className="bg-rose-50 text-rose-700">
                        {p.bloodGroup || 'Unknown'}
                      </Badge>
                    </td>
                    <td className="text-slate-700">{formatDate(p.dateOfBirth)}</td>
                    <td className="text-slate-500">{formatDate(p.user?.createdAt)}</td>
                    {canManage && (
                      <td className="text-right">
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => openEdit(p)}
                            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          {user?.role === 'admin' && (
                            <button
                              onClick={() => setConfirm(p)}
                              className="rounded-md p-2 text-rose-500 hover:bg-rose-50"
                              aria-label="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
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
        title={editing ? 'Edit Patient' : 'New Patient'}
        size="lg"
        footer={
          <>
            <button onClick={() => setOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={onSubmit as any}
              disabled={saving}
              className="btn-primary"
            >
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
              <input className="input" type="password" placeholder="default: patient123" value={form.password} onChange={(e) => onChange('password', e.target.value)} />
            </div>
          )}
          <div>
            <label className="label">Date of Birth</label>
            <input type="date" className="input" value={form.dateOfBirth} onChange={(e) => onChange('dateOfBirth', e.target.value)} />
          </div>
          <div>
            <label className="label">Gender</label>
            <select className="input" value={form.gender} onChange={(e) => onChange('gender', e.target.value)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Blood Group</label>
            <select className="input" value={form.bloodGroup} onChange={(e) => onChange('bloodGroup', e.target.value)}>
              {['Unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Address</label>
            <input className="input" value={form.address} onChange={(e) => onChange('address', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Allergies (comma separated)</label>
            <input className="input" value={form.allergies} onChange={(e) => onChange('allergies', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Chronic Conditions (comma separated)</label>
            <input className="input" value={form.chronicConditions} onChange={(e) => onChange('chronicConditions', e.target.value)} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={onDelete}
        loading={deleting}
        title="Delete patient?"
        message={`Are you sure you want to delete ${confirm?.user?.name}? This will also remove their account.`}
        confirmText="Delete"
      />
    </div>
  );
}
