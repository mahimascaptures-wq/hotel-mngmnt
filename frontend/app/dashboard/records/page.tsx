'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, FileText, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatDate } from '@/lib/utils';
import type { Doctor, MedicalRecord, Patient } from '@/lib/types';

const emptyForm = {
  patient: '',
  doctor: '',
  diagnosis: '',
  symptoms: '',
  treatment: '',
  notes: '',
  vitals: {
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    weight: '',
    height: '',
  },
  visitDate: new Date().toISOString().slice(0, 10),
};

export default function RecordsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<MedicalRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MedicalRecord | null>(null);
  const [viewing, setViewing] = useState<MedicalRecord | null>(null);
  const [form, setForm] = useState<any>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<MedicalRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canCreate = ['admin', 'doctor'].includes(user?.role || '');
  const canDelete = user?.role === 'admin';
  const needsDoctorSelect = user?.role === 'admin';

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/records');
      setItems(res.data);
      if (canCreate) {
        try {
          const [p, d] = await Promise.all([
            api.get('/patients'),
            api.get('/doctors'),
          ]);
          setPatients(p.data);
          setDoctors(d.data);
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

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setOpen(true);
  };

  const openEdit = (r: MedicalRecord) => {
    setEditing(r);
    setForm({
      patient: (r.patient as any)?._id || '',
      doctor: (r.doctor as any)?._id || '',
      diagnosis: r.diagnosis || '',
      symptoms: (r.symptoms || []).join(', '),
      treatment: r.treatment || '',
      notes: r.notes || '',
      vitals: {
        bloodPressure: r.vitals?.bloodPressure || '',
        heartRate: r.vitals?.heartRate || '',
        temperature: r.vitals?.temperature || '',
        weight: r.vitals?.weight || '',
        height: r.vitals?.height || '',
      },
      visitDate: r.visitDate ? r.visitDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    });
    setOpen(true);
  };

  const onChange = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const onVital = (k: string, v: any) =>
    setForm((f: any) => ({ ...f, vitals: { ...f.vitals, [k]: v } }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editing) {
      if (!form.patient) {
        toast.error('Please select a patient');
        return;
      }
      if (needsDoctorSelect && !form.doctor) {
        toast.error('Please select a doctor');
        return;
      }
      if (!form.diagnosis?.trim()) {
        toast.error('Please enter a diagnosis');
        return;
      }
    }

    setSaving(true);
    try {
      const payload: any = {
        ...form,
        symptoms: form.symptoms
          ? form.symptoms.split(',').map((s: string) => s.trim()).filter(Boolean)
          : [],
        vitals: {
          bloodPressure: form.vitals.bloodPressure || undefined,
          heartRate: form.vitals.heartRate ? Number(form.vitals.heartRate) : undefined,
          temperature: form.vitals.temperature ? Number(form.vitals.temperature) : undefined,
          weight: form.vitals.weight ? Number(form.vitals.weight) : undefined,
          height: form.vitals.height ? Number(form.vitals.height) : undefined,
        },
      };
      if (!payload.doctor) delete payload.doctor;
      if (editing) {
        await api.put(`/records/${editing._id}`, payload);
        toast.success('Record updated');
      } else {
        await api.post('/records', payload);
        toast.success('Record created');
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
      await api.delete(`/records/${confirm._id}`);
      toast.success('Record deleted');
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
        title="Medical Records"
        subtitle={`${items.length} record${items.length === 1 ? '' : 's'}`}
        actions={
          canCreate && (
            <button onClick={openNew} className="btn-primary">
              <Plus className="h-4 w-4" /> New Record
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
          <EmptyState title="No medical records" description="Records will appear here after consultations." />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((r) => (
            <div key={r._id} className="card">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-100 text-rose-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{r.diagnosis}</p>
                    <p className="text-xs text-slate-500">
                      {(r.patient as any)?.user?.name} • {formatDate(r.visitDate)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setViewing(r)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100">
                    <Eye className="h-4 w-4" />
                  </button>
                  {canCreate && (
                    <button onClick={() => openEdit(r)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100">
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => setConfirm(r)} className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-600">
                Dr. {(r.doctor as any)?.user?.name}
              </p>
              {r.symptoms && r.symptoms.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {r.symptoms.map((s, i) => (
                    <span key={i} className="badge bg-amber-50 text-amber-700">{s}</span>
                  ))}
                </div>
              )}
              {r.treatment && (
                <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                  <span className="font-medium">Treatment:</span> {r.treatment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit Medical Record' : 'New Medical Record'}
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
          {!editing && (
            <>
              <div className={needsDoctorSelect ? '' : 'sm:col-span-2'}>
                <label className="label">Patient</label>
                <select required className="input" value={form.patient} onChange={(e) => onChange('patient', e.target.value)}>
                  <option value="">Select a patient</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>{p.user?.name}</option>
                  ))}
                </select>
              </div>
              {needsDoctorSelect && (
                <div>
                  <label className="label">Doctor</label>
                  <select required className="input" value={form.doctor} onChange={(e) => onChange('doctor', e.target.value)}>
                    <option value="">Select a doctor</option>
                    {doctors.map((d) => (
                      <option key={d._id} value={d._id}>
                        Dr. {d.user?.name} — {d.specialization}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
          <div className="sm:col-span-2">
            <label className="label">Diagnosis</label>
            <input required className="input" value={form.diagnosis} onChange={(e) => onChange('diagnosis', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Symptoms (comma separated)</label>
            <input className="input" value={form.symptoms} onChange={(e) => onChange('symptoms', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Treatment</label>
            <textarea rows={2} className="input" value={form.treatment} onChange={(e) => onChange('treatment', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Notes</label>
            <textarea rows={2} className="input" value={form.notes} onChange={(e) => onChange('notes', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <p className="label">Vitals</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <input className="input" placeholder="BP (120/80)" value={form.vitals.bloodPressure} onChange={(e) => onVital('bloodPressure', e.target.value)} />
              <input className="input" placeholder="HR" value={form.vitals.heartRate} onChange={(e) => onVital('heartRate', e.target.value)} />
              <input className="input" placeholder="Temp °F" value={form.vitals.temperature} onChange={(e) => onVital('temperature', e.target.value)} />
              <input className="input" placeholder="Weight kg" value={form.vitals.weight} onChange={(e) => onVital('weight', e.target.value)} />
              <input className="input" placeholder="Height cm" value={form.vitals.height} onChange={(e) => onVital('height', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Visit Date</label>
            <input type="date" className="input" value={form.visitDate} onChange={(e) => onChange('visitDate', e.target.value)} />
          </div>
        </form>
      </Modal>

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="Medical Record"
        size="lg"
      >
        {viewing && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="label">Patient</p>
                <p className="font-medium text-slate-900">{(viewing.patient as any)?.user?.name}</p>
              </div>
              <div>
                <p className="label">Doctor</p>
                <p className="font-medium text-slate-900">Dr. {(viewing.doctor as any)?.user?.name}</p>
              </div>
              <div>
                <p className="label">Visit Date</p>
                <p className="font-medium text-slate-900">{formatDate(viewing.visitDate)}</p>
              </div>
            </div>
            <div>
              <p className="label">Diagnosis</p>
              <p className="text-slate-700">{viewing.diagnosis}</p>
            </div>
            {viewing.symptoms?.length ? (
              <div>
                <p className="label">Symptoms</p>
                <div className="flex flex-wrap gap-1">
                  {viewing.symptoms.map((s, i) => (
                    <span key={i} className="badge bg-amber-50 text-amber-700">{s}</span>
                  ))}
                </div>
              </div>
            ) : null}
            {viewing.treatment && (
              <div>
                <p className="label">Treatment</p>
                <p className="text-slate-700">{viewing.treatment}</p>
              </div>
            )}
            {viewing.notes && (
              <div>
                <p className="label">Notes</p>
                <p className="text-slate-700">{viewing.notes}</p>
              </div>
            )}
            {viewing.vitals && (
              <div>
                <p className="label">Vitals</p>
                <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-5">
                  <div><p className="text-xs text-slate-500">BP</p><p className="font-medium">{viewing.vitals.bloodPressure || '-'}</p></div>
                  <div><p className="text-xs text-slate-500">HR</p><p className="font-medium">{viewing.vitals.heartRate || '-'}</p></div>
                  <div><p className="text-xs text-slate-500">Temp</p><p className="font-medium">{viewing.vitals.temperature || '-'}</p></div>
                  <div><p className="text-xs text-slate-500">Weight</p><p className="font-medium">{viewing.vitals.weight || '-'}</p></div>
                  <div><p className="text-xs text-slate-500">Height</p><p className="font-medium">{viewing.vitals.height || '-'}</p></div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={onDelete}
        loading={deleting}
        title="Delete record?"
        message="This medical record will be removed permanently."
        confirmText="Delete"
      />
    </div>
  );
}
