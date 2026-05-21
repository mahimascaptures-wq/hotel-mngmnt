'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { initials } from '@/lib/utils';

export default function SettingsPage() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    password: '',
  });
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const payload: any = { name: form.name, phone: form.phone };
      if (form.password) payload.password = form.password;
      await api.put(`/users/${user._id}`, payload);
      await refresh();
      toast.success('Profile updated');
      setForm((f) => ({ ...f, password: '' }));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Update your profile and account preferences." />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xl font-bold text-white">
              {initials(user?.name)}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{user?.name}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <p className="mt-1 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium capitalize text-brand-700">
                {user?.role}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="card lg:col-span-2">
          <h3 className="mb-4 font-semibold text-slate-900">Profile</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" value={user?.email || ''} disabled />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">New password</label>
              <input type="password" className="input" placeholder="Leave empty to keep current" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
