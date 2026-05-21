'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, Building2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Department, Doctor } from '@/lib/types';

const emptyForm = { name: '', description: '', location: '', head: '' };

export default function DepartmentsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canManage = user?.role === 'admin';

  const load = async () => {
    setLoading(true);
    try {
      const [d, doc] = await Promise.all([
        api.get('/departments'),
        api.get('/doctors'),
      ]);
      setItems(d.data);
      setDoctors(doc.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setOpen(true);
  };

  const openEdit = (d: Department) => {
    setEditing(d);
    setForm({
      name: d.name,
      description: d.description || '',
      location: d.location || '',
      head: (d.head as any)?._id || '',
    });
    setOpen(true);
  };

  const onChange = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, head: form.head || undefined };
      if (editing) {
        await api.put(`/departments/${editing._id}`, payload);
        toast.success('Department updated');
      } else {
        await api.post('/departments', payload);
        toast.success('Department created');
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
      await api.delete(`/departments/${confirm._id}`);
      toast.success('Department deleted');
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
        title="Departments"
        subtitle={`${items.length} department${items.length === 1 ? '' : 's'}`}
        actions={
          canManage && (
            <button onClick={openNew} className="btn-primary">
              <Plus className="h-4 w-4" /> Add Department
            </button>
          )
        }
      />

      {loading ? (
        <div className="grid h-48 place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState title="No departments" description="Create one to organize doctors." />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((d) => (
            <div key={d._id} className="card transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="mb-3 flex items-start justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-100 text-violet-600">
                  <Building2 className="h-5 w-5" />
                </div>
                {canManage && (
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(d)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setConfirm(d)} className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-slate-900">{d.name}</h3>
              {d.description && (
                <p className="mt-1 text-sm text-slate-500">{d.description}</p>
              )}
              <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-xs">
                {d.location && (
                  <p className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="h-3.5 w-3.5" /> {d.location}
                  </p>
                )}
                {d.head && (
                  <p className="text-slate-500">
                    Head: <span className="font-medium text-slate-700">{(d.head as any)?.user?.name || 'N/A'}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit Department' : 'New Department'}
        footer={
          <>
            <button onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={onSubmit as any} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input required className="input" value={form.name} onChange={(e) => onChange('name', e.target.value)} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea rows={3} className="input" value={form.description} onChange={(e) => onChange('description', e.target.value)} />
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" value={form.location} onChange={(e) => onChange('location', e.target.value)} placeholder="Block A, Floor 2" />
          </div>
          <div>
            <label className="label">Head Doctor (optional)</label>
            <select className="input" value={form.head} onChange={(e) => onChange('head', e.target.value)}>
              <option value="">No head assigned</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.user?.name} — {d.specialization}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={onDelete}
        loading={deleting}
        title="Delete department?"
        message={`Remove ${confirm?.name} from the system?`}
        confirmText="Delete"
      />
    </div>
  );
}
