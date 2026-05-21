'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2, Loader2, Search, Shield, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { cn, initials } from '@/lib/utils';
import type { Role, User } from '@/lib/types';

const ROLE_COLOR: Record<Role, string> = {
  admin: 'bg-rose-100 text-rose-700',
  doctor: 'bg-emerald-100 text-emerald-700',
  receptionist: 'bg-amber-100 text-amber-700',
  patient: 'bg-blue-100 text-blue-700',
};

const emptyCreate = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'receptionist' as Role,
};

export default function UsersPage() {
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', role: 'patient' as Role, isActive: true, password: '' });
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ ...emptyCreate });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await api.get('/users', { params });
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter]);

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({
      name: u.name,
      phone: u.phone || '',
      role: u.role,
      isActive: u.isActive !== false,
      password: '',
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const payload: any = { ...form };
      if (!payload.password) delete payload.password;
      await api.put(`/users/${editing._id}`, payload);
      toast.success('User updated');
      setEditing(null);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/users', createForm);
      toast.success(`${createForm.role.charAt(0).toUpperCase() + createForm.role.slice(1)} created`);
      setCreateOpen(false);
      setCreateForm({ ...emptyCreate });
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  const onDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${confirm._id}`);
      toast.success('User deleted');
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
        title="Staff & Users"
        subtitle="Manage all system users and their roles."
        actions={
          <button onClick={() => setCreateOpen(true)} className="btn-primary">
            <Plus className="h-4 w-4" /> New User
          </button>
        }
      />

      <div className="card">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input max-w-xs" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="doctor">Doctor</option>
            <option value="receptionist">Receptionist</option>
            <option value="patient">Patient</option>
          </select>
        </div>

        {loading ? (
          <div className="grid h-48 place-items-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState title="No users found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>User</th><th>Phone</th><th>Role</th><th>Status</th><th className="text-right">Actions</th></tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-slate-500 to-slate-700 text-xs font-semibold text-white">
                          {initials(u.name)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>{u.phone || '-'}</td>
                    <td>
                      <Badge className={cn(ROLE_COLOR[u.role], 'capitalize')}>
                        <Shield className="mr-1 h-3 w-3" />
                        {u.role}
                      </Badge>
                    </td>
                    <td>
                      <Badge className={u.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                        {u.isActive !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <button onClick={() => openEdit(u)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setConfirm(u)} className="rounded-md p-2 text-rose-500 hover:bg-rose-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit User"
        footer={
          <>
            <button onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
            <button onClick={onSubmit as any} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      >
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}>
              <option value="admin">Admin</option>
              <option value="doctor">Doctor</option>
              <option value="receptionist">Receptionist</option>
              <option value="patient">Patient</option>
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.isActive ? 'true' : 'false'} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === 'true' }))}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div>
            <label className="label">Reset Password</label>
            <input type="password" className="input" placeholder="Leave empty to keep" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          </div>
        </form>
      </Modal>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create New User"
        description="Choose a role — receptionist, admin, doctor, or patient."
        size="lg"
        footer={
          <>
            <button onClick={() => setCreateOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={onCreate as any} disabled={creating} className="btn-primary">
              {creating ? 'Creating...' : 'Create User'}
            </button>
          </>
        }
      >
        <form onSubmit={onCreate} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Role</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(['admin', 'doctor', 'receptionist', 'patient'] as Role[]).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setCreateForm((f) => ({ ...f, role: r }))}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-sm font-medium capitalize transition',
                    createForm.role === r
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            {createForm.role === 'doctor' && (
              <p className="mt-2 text-xs text-amber-600">
                Tip: use the <strong>Doctors</strong> page to also set specialization,
                department, and consultation fee in one form.
              </p>
            )}
          </div>
          <div>
            <label className="label">Full Name</label>
            <input required className="input" value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Email</label>
            <input required type="email" className="input" value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={createForm.phone} onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <label className="label">Password</label>
            <input required minLength={6} type="password" className="input" placeholder="At least 6 characters" value={createForm.password} onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={onDelete}
        loading={deleting}
        title="Delete user?"
        message={`${confirm?.name} will be permanently removed.`}
        confirmText="Delete"
      />
    </div>
  );
}
