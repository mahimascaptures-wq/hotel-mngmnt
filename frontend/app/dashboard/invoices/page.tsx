'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, Receipt, Eye, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { STATUS_COLOR, cn, formatCurrency, formatDate } from '@/lib/utils';
import type { Invoice, InvoiceItem, Patient } from '@/lib/types';

const blankItem: InvoiceItem = { description: '', quantity: 1, unitPrice: 0, amount: 0 };

const emptyForm = {
  patient: '',
  items: [{ ...blankItem }] as InvoiceItem[],
  tax: 0,
  discount: 0,
  paymentMethod: 'cash',
  notes: '',
};

export default function InvoicesPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [viewing, setViewing] = useState<Invoice | null>(null);
  const [form, setForm] = useState<any>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canManage = ['admin', 'receptionist'].includes(user?.role || '');
  const canDelete = user?.role === 'admin';

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/invoices');
      setItems(res.data);
      if (canManage) {
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
  }, []);

  const subtotal = useMemo(
    () =>
      form.items.reduce(
        (s: number, i: InvoiceItem) =>
          s + Number(i.unitPrice || 0) * Number(i.quantity || 1),
        0
      ),
    [form.items]
  );
  const total = useMemo(
    () => subtotal + Number(form.tax || 0) - Number(form.discount || 0),
    [subtotal, form.tax, form.discount]
  );

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, items: [{ ...blankItem }] });
    setOpen(true);
  };

  const openEdit = (i: Invoice) => {
    setEditing(i);
    setForm({
      patient: (i.patient as any)?._id || '',
      items: i.items.length ? i.items : [{ ...blankItem }],
      tax: i.tax,
      discount: i.discount,
      paymentMethod: i.paymentMethod || 'cash',
      notes: i.notes || '',
    });
    setOpen(true);
  };

  const updateItem = (idx: number, k: keyof InvoiceItem, v: any) => {
    setForm((f: any) => {
      const arr = [...f.items];
      arr[idx] = { ...arr[idx], [k]: k === 'description' ? v : Number(v) };
      arr[idx].amount = Number(arr[idx].unitPrice || 0) * Number(arr[idx].quantity || 1);
      return { ...f, items: arr };
    });
  };

  const addItem = () => setForm((f: any) => ({ ...f, items: [...f.items, { ...blankItem }] }));
  const removeItem = (idx: number) =>
    setForm((f: any) => ({ ...f, items: f.items.filter((_: any, i: number) => i !== idx) }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        items: form.items.filter((i: InvoiceItem) => i.description),
      };
      if (editing) {
        await api.put(`/invoices/${editing._id}`, payload);
        toast.success('Invoice updated');
      } else {
        await api.post('/invoices', payload);
        toast.success('Invoice created');
      }
      setOpen(false);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (inv: Invoice) => {
    try {
      await api.put(`/invoices/${inv._id}`, { status: 'paid' });
      toast.success('Marked as paid');
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed');
    }
  };

  const onDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      await api.delete(`/invoices/${confirm._id}`);
      toast.success('Invoice deleted');
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
        title="Invoices"
        subtitle={`${items.length} invoice${items.length === 1 ? '' : 's'}`}
        actions={
          canManage && (
            <button onClick={openNew} className="btn-primary">
              <Plus className="h-4 w-4" /> New Invoice
            </button>
          )
        }
      />

      <div className="card">
        {loading ? (
          <div className="grid h-48 place-items-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState title="No invoices" description="Generate invoices for completed visits." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Method</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i._id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
                          <Receipt className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-slate-900">{i.invoiceNumber}</span>
                      </div>
                    </td>
                    <td>{(i.patient as any)?.user?.name || '-'}</td>
                    <td>{formatDate(i.createdAt)}</td>
                    <td className="font-semibold">{formatCurrency(i.total)}</td>
                    <td>
                      <Badge className={cn(STATUS_COLOR[i.status] || 'bg-slate-100 text-slate-700', 'capitalize')}>
                        {i.status}
                      </Badge>
                    </td>
                    <td className="capitalize text-slate-700">{i.paymentMethod || '-'}</td>
                    <td className="text-right">
                      <button onClick={() => setViewing(i)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
                        <Eye className="h-4 w-4" />
                      </button>
                      {canManage && i.status !== 'paid' && (
                        <button onClick={() => markPaid(i)} className="rounded-md p-2 text-emerald-600 hover:bg-emerald-50" title="Mark paid">
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      {canManage && (
                        <button onClick={() => openEdit(i)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => setConfirm(i)} className="rounded-md p-2 text-rose-500 hover:bg-rose-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
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
        title={editing ? 'Edit Invoice' : 'New Invoice'}
        size="xl"
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
          {!editing && (
            <div>
              <label className="label">Patient</label>
              <select required className="input" value={form.patient} onChange={(e) => setForm((f: any) => ({ ...f, patient: e.target.value }))}>
                <option value="">Select a patient</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>{p.user?.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="label !mb-0">Items</p>
              <button type="button" onClick={addItem} className="btn-secondary !py-1 text-xs">
                <Plus className="h-3 w-3" /> Add item
              </button>
            </div>
            <table className="table">
              <thead>
                <tr><th>Description</th><th className="w-20">Qty</th><th className="w-32">Unit Price</th><th className="w-32 text-right">Amount</th><th className="w-10" /></tr>
              </thead>
              <tbody>
                {form.items.map((i: InvoiceItem, idx: number) => (
                  <tr key={idx}>
                    <td><input className="input" value={i.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} /></td>
                    <td><input type="number" min={1} className="input" value={i.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} /></td>
                    <td><input type="number" min={0} className="input" value={i.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)} /></td>
                    <td className="text-right font-medium">{formatCurrency(Number(i.unitPrice || 0) * Number(i.quantity || 1))}</td>
                    <td>{form.items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} className="rounded p-1 text-rose-500 hover:bg-rose-50">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Tax (USD)</label>
              <input type="number" min={0} className="input" value={form.tax} onChange={(e) => setForm((f: any) => ({ ...f, tax: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Discount (USD)</label>
              <input type="number" min={0} className="input" value={form.discount} onChange={(e) => setForm((f: any) => ({ ...f, discount: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Payment Method</label>
              <select className="input" value={form.paymentMethod} onChange={(e) => setForm((f: any) => ({ ...f, paymentMethod: e.target.value }))}>
                {['cash', 'card', 'upi', 'insurance', 'other'].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 p-4">
            <div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between text-sm text-slate-600"><span>Tax</span><span>{formatCurrency(form.tax)}</span></div>
            <div className="flex justify-between text-sm text-slate-600"><span>Discount</span><span>-{formatCurrency(form.discount)}</span></div>
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900"><span>Total</span><span>{formatCurrency(total)}</span></div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea rows={2} className="input" value={form.notes} onChange={(e) => setForm((f: any) => ({ ...f, notes: e.target.value }))} />
          </div>
        </form>
      </Modal>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.invoiceNumber} size="lg">
        {viewing && (
          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <div>
                <p className="label">Billed To</p>
                <p className="font-medium">{(viewing.patient as any)?.user?.name}</p>
                <p className="text-slate-500">{(viewing.patient as any)?.user?.email}</p>
              </div>
              <div className="text-right">
                <Badge className={cn(STATUS_COLOR[viewing.status] || 'bg-slate-100 text-slate-700', 'capitalize')}>
                  {viewing.status}
                </Badge>
                <p className="mt-1 text-xs text-slate-500">{formatDate(viewing.createdAt)}</p>
              </div>
            </div>
            <table className="table">
              <thead><tr><th>Description</th><th>Qty</th><th>Price</th><th className="text-right">Amount</th></tr></thead>
              <tbody>
                {viewing.items.map((it, i) => (
                  <tr key={i}>
                    <td className="font-medium">{it.description}</td>
                    <td>{it.quantity}</td>
                    <td>{formatCurrency(it.unitPrice)}</td>
                    <td className="text-right">{formatCurrency(it.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="ml-auto max-w-xs space-y-1 text-sm">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatCurrency(viewing.subtotal)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Tax</span><span>{formatCurrency(viewing.tax)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Discount</span><span>-{formatCurrency(viewing.discount)}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-900"><span>Total</span><span>{formatCurrency(viewing.total)}</span></div>
            </div>
            {viewing.notes && (
              <p className="rounded-lg bg-slate-50 p-3 text-slate-600">{viewing.notes}</p>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={onDelete}
        loading={deleting}
        title="Delete invoice?"
        message="This invoice will be removed permanently."
        confirmText="Delete"
      />
    </div>
  );
}
