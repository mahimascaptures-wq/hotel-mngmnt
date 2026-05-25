'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, Pill, Eye, X, Paperclip, Languages } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { VoiceInput, VoiceInputCompact } from '@/components/ui/VoiceInput';
import { FileUploader, fileAbsoluteUrl, type UploadedAttachment } from '@/components/ui/FileUploader';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatDate } from '@/lib/utils';
import type { Doctor, Medication, Patient, Prescription, PrescriptionAttachment } from '@/lib/types';

const blankMed: Medication = {
  name: '',
  dosage: '',
  frequency: '',
  duration: '',
  instructions: '',
};

const emptyForm = {
  patient: '',
  doctor: '',
  advice: '',
  medications: [{ ...blankMed }] as Medication[],
};

export default function PrescriptionsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Prescription | null>(null);
  const [viewing, setViewing] = useState<Prescription | null>(null);
  const [form, setForm] = useState<any>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<Prescription | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<PrescriptionAttachment[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'en-IN' | 'hi-IN'>('en-IN');

  const canCreate = ['admin', 'doctor'].includes(user?.role || '');
  const canDelete = user?.role === 'admin';
  const needsDoctorSelect = user?.role === 'admin';

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/prescriptions');
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
    setForm({ ...emptyForm, medications: [{ ...blankMed }] });
    setPendingFiles([]);
    setExistingAttachments([]);
    setOpen(true);
  };

  const openEdit = (r: Prescription) => {
    setEditing(r);
    setForm({
      patient: (r.patient as any)?._id || '',
      doctor: (r.doctor as any)?._id || '',
      advice: r.advice || '',
      medications: r.medications.length ? r.medications : [{ ...blankMed }],
    });
    setPendingFiles([]);
    setExistingAttachments(r.attachments || []);
    setOpen(true);
  };

  const updateMed = (idx: number, k: keyof Medication, v: string) => {
    setForm((f: any) => {
      const meds = [...f.medications];
      meds[idx] = { ...meds[idx], [k]: v };
      return { ...f, medications: meds };
    });
  };

  const addMed = () =>
    setForm((f: any) => ({ ...f, medications: [...f.medications, { ...blankMed }] }));

  const removeMed = (idx: number) =>
    setForm((f: any) => ({
      ...f,
      medications: f.medications.filter((_: any, i: number) => i !== idx),
    }));

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
      const validMeds = form.medications.filter((m: Medication) => m.name?.trim());
      if (validMeds.length === 0) {
        toast.error('Please add at least one medication with a name');
        return;
      }
    }

    setSaving(true);
    try {
      const payload: any = {
        ...form,
        medications: form.medications.filter((m: Medication) => m.name?.trim()),
      };
      if (!payload.doctor) delete payload.doctor;

      let savedId: string;
      if (editing) {
        await api.put(`/prescriptions/${editing._id}`, payload);
        savedId = editing._id;
        toast.success('Prescription updated');
      } else {
        const res = await api.post('/prescriptions', payload);
        savedId = res.data._id;
        toast.success('Prescription created');
      }

      if (pendingFiles.length > 0) {
        await uploadPendingFiles(savedId, pendingFiles);
      }

      setOpen(false);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const uploadPendingFiles = async (prescriptionId: string, files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    try {
      await api.post(`/prescriptions/${prescriptionId}/attachments`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'File upload failed');
    }
  };

  const handleAttachmentsUpload = async (files: File[]) => {
    if (!editing) {
      setPendingFiles((prev) => [...prev, ...files]);
      toast.success(`${files.length} file(s) queued — saved on submit`);
      return;
    }
    setUploadingFiles(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      const res = await api.post(`/prescriptions/${editing._id}/attachments`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setExistingAttachments(res.data);
      toast.success('Files uploaded');
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleAttachmentRemove = async (a: UploadedAttachment) => {
    if (!editing || !a._id) {
      setPendingFiles((prev) => prev.filter((f) => f.name !== a.originalName));
      return;
    }
    try {
      await api.delete(`/prescriptions/${editing._id}/attachments/${a._id}`);
      setExistingAttachments((prev) => prev.filter((x) => x._id !== a._id));
      toast.success('Attachment removed');
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Remove failed');
    }
  };

  const onDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      await api.delete(`/prescriptions/${confirm._id}`);
      toast.success('Prescription deleted');
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
        title="Prescriptions"
        subtitle={`${items.length} prescription${items.length === 1 ? '' : 's'}`}
        actions={
          canCreate && (
            <button onClick={openNew} className="btn-primary">
              <Plus className="h-4 w-4" /> New Prescription
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
          <EmptyState title="No prescriptions" description="Prescriptions issued by doctors will appear here." />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((r) => (
            <div key={r._id} className="card">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-600">
                    <Pill className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {(r.patient as any)?.user?.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Dr. {(r.doctor as any)?.user?.name} • {formatDate(r.issuedDate)}
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
              <ul className="space-y-1.5 text-sm">
                {r.medications.slice(0, 3).map((m, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2">
                    <span className="font-medium text-slate-900">{m.name}</span>
                    <span className="text-xs text-slate-500">{m.dosage} • {m.frequency}</span>
                  </li>
                ))}
                {r.medications.length > 3 && (
                  <li className="text-xs text-slate-500">+{r.medications.length - 3} more</li>
                )}
              </ul>
              {r.attachments && r.attachments.length > 0 && (
                <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <Paperclip className="h-3.5 w-3.5" />
                  {r.attachments.length} file{r.attachments.length > 1 ? 's' : ''} attached
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit Prescription' : 'New Prescription'}
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className={needsDoctorSelect ? '' : 'sm:col-span-2'}>
                <label className="label">Patient</label>
                <select required className="input" value={form.patient} onChange={(e) => setForm((f: any) => ({ ...f, patient: e.target.value }))}>
                  <option value="">Select a patient</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>{p.user?.name}</option>
                  ))}
                </select>
              </div>
              {needsDoctorSelect && (
                <div>
                  <label className="label">Doctor</label>
                  <select required className="input" value={form.doctor} onChange={(e) => setForm((f: any) => ({ ...f, doctor: e.target.value }))}>
                    <option value="">Select a doctor</option>
                    {doctors.map((d) => (
                      <option key={d._id} value={d._id}>
                        Dr. {d.user?.name} — {d.specialization}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs">
            <Languages className="h-4 w-4 text-brand-600" />
            <span className="text-brand-700">Voice input language:</span>
            <button
              type="button"
              onClick={() => setVoiceLang('en-IN')}
              className={`rounded-md px-2 py-0.5 font-medium ${voiceLang === 'en-IN' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setVoiceLang('hi-IN')}
              className={`rounded-md px-2 py-0.5 font-medium ${voiceLang === 'hi-IN' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}
            >
              हिंदी
            </button>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="label !mb-0">Medications</p>
              <button type="button" onClick={addMed} className="btn-secondary !py-1 text-xs">
                <Plus className="h-3 w-3" /> Add medicine
              </button>
            </div>
            <div className="space-y-3">
              {form.medications.map((m: Medication, idx: number) => (
                <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500">Medicine #{idx + 1}</p>
                    {form.medications.length > 1 && (
                      <button type="button" onClick={() => removeMed(idx)} className="rounded p-1 text-rose-500 hover:bg-rose-100">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="flex gap-2">
                      <input className="input" placeholder="Name (e.g. Paracetamol)" value={m.name} onChange={(e) => updateMed(idx, 'name', e.target.value)} />
                      <VoiceInputCompact value={m.name} onChange={(v) => updateMed(idx, 'name', v)} lang={voiceLang} />
                    </div>
                    <div className="flex gap-2">
                      <input className="input" placeholder="Dosage (500mg)" value={m.dosage} onChange={(e) => updateMed(idx, 'dosage', e.target.value)} />
                      <VoiceInputCompact value={m.dosage} onChange={(v) => updateMed(idx, 'dosage', v)} lang={voiceLang} />
                    </div>
                    <div className="flex gap-2">
                      <input className="input" placeholder="Frequency (2x daily)" value={m.frequency} onChange={(e) => updateMed(idx, 'frequency', e.target.value)} />
                      <VoiceInputCompact value={m.frequency} onChange={(v) => updateMed(idx, 'frequency', v)} lang={voiceLang} />
                    </div>
                    <div className="flex gap-2">
                      <input className="input" placeholder="Duration (7 days)" value={m.duration} onChange={(e) => updateMed(idx, 'duration', e.target.value)} />
                      <VoiceInputCompact value={m.duration} onChange={(v) => updateMed(idx, 'duration', v)} lang={voiceLang} />
                    </div>
                    <div className="flex gap-2 sm:col-span-2">
                      <input className="input" placeholder="Instructions (after meals, with water)" value={m.instructions} onChange={(e) => updateMed(idx, 'instructions', e.target.value)} />
                      <VoiceInputCompact value={m.instructions || ''} onChange={(v) => updateMed(idx, 'instructions', v)} lang={voiceLang} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="label !mb-0">Advice / Notes</label>
              <VoiceInputCompact value={form.advice} onChange={(v) => setForm((f: any) => ({ ...f, advice: v }))} lang={voiceLang} />
            </div>
            <textarea rows={3} className="input" placeholder="e.g. Rest for 3 days, drink plenty of water" value={form.advice} onChange={(e) => setForm((f: any) => ({ ...f, advice: e.target.value }))} />
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-slate-500" />
              <p className="label !mb-0">Reports & Documents</p>
              <span className="text-xs text-slate-400">— upload X-rays, lab reports, scan PDFs</span>
            </div>
            <FileUploader
              attachments={[
                ...existingAttachments,
                ...pendingFiles.map<UploadedAttachment>((f) => ({
                  filename: f.name,
                  originalName: f.name,
                  url: '',
                  mimeType: f.type,
                  size: f.size,
                })),
              ]}
              onUpload={handleAttachmentsUpload}
              onRemove={handleAttachmentRemove}
              uploading={uploadingFiles}
              helperText={
                editing
                  ? 'Uploaded immediately. Images, PDF, DOC, TXT — max 10MB each.'
                  : 'Files will be uploaded after saving the prescription. Max 10MB each.'
              }
            />
          </div>
        </form>
      </Modal>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Prescription" size="lg">
        {viewing && (
          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <div>
                <p className="label">Patient</p>
                <p className="font-medium">{(viewing.patient as any)?.user?.name}</p>
              </div>
              <div className="text-right">
                <p className="label">Issued</p>
                <p className="font-medium">{formatDate(viewing.issuedDate)}</p>
              </div>
            </div>
            <div>
              <p className="label">Prescribed by</p>
              <p className="font-medium">Dr. {(viewing.doctor as any)?.user?.name}</p>
            </div>
            <div>
              <p className="label">Medications</p>
              <table className="table">
                <thead><tr><th>Name</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr></thead>
                <tbody>
                  {viewing.medications.map((m, i) => (
                    <tr key={i}>
                      <td className="font-medium">{m.name}</td>
                      <td>{m.dosage}</td>
                      <td>{m.frequency}</td>
                      <td>{m.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {viewing.advice && (
              <div className="rounded-lg bg-amber-50 p-3 text-amber-800">
                <p className="font-medium">Doctor's advice</p>
                <p className="mt-1">{viewing.advice}</p>
              </div>
            )}
            {viewing.attachments && viewing.attachments.length > 0 && (
              <div>
                <p className="label flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5" />
                  Attachments ({viewing.attachments.length})
                </p>
                <ul className="space-y-2">
                  {viewing.attachments.map((a, i) => {
                    const href = fileAbsoluteUrl(a.url);
                    const isImage = a.mimeType?.startsWith('image/');
                    return (
                      <li key={a._id || i} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                        {isImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={href} alt={a.originalName} className="h-12 w-12 rounded object-cover" />
                        ) : (
                          <div className="grid h-12 w-12 place-items-center rounded bg-slate-100 text-slate-500">
                            <Paperclip className="h-5 w-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800">{a.originalName || a.filename}</p>
                          <p className="text-xs text-slate-500">{a.mimeType}</p>
                        </div>
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary !py-1.5 text-xs"
                        >
                          Open
                        </a>
                      </li>
                    );
                  })}
                </ul>
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
        title="Delete prescription?"
        message="This prescription will be removed permanently."
        confirmText="Delete"
      />
    </div>
  );
}
