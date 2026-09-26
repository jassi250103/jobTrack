import { useEffect, useState } from 'react';
import { companiesApi } from '../api/services';
import { Button, Input, Select } from './ui';

const statuses = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'];
const initial = { company_id: '', position: '', location: '', salary: '', job_url: '', status: 'APPLIED', applied_date: new Date().toISOString().slice(0, 10), notes: '' };

const normalizeSalaryInput = (value) => String(value ?? '').replace(/[₹,\s]/g, '').replace(/[^\d.]/g, '');
const normalizeDateInput = (value) => {
  if (!value) return '';
  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const date = new Date(raw.includes('T') || raw.includes(' ') ? raw : `${raw}T00:00:00`);
    if (Number.isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return '';
};

export default function ApplicationForm({ value, onSubmit, saving, cancelLabel = 'Cancel', onCancel }) {
  const [form, setForm] = useState({ ...initial, ...value, company_id: value?.company_id ?? '' }); const [companies, setCompanies] = useState([]); const [error, setError] = useState('');
  useEffect(() => { companiesApi.list().then((r) => setCompanies(r.data)).catch((e) => setError(e.message)); }, []);
  useEffect(() => {
    if (!value) return;
    setForm({
      ...initial,
      ...value,
      company_id: value.company_id ?? value.company?.id ?? '',
      position: value.position ?? '',
      location: value.location ?? '',
      salary: value.salary != null ? String(value.salary) : '',
      job_url: value.job_url ?? '',
      status: value.status ?? 'APPLIED',
      applied_date: normalizeDateInput(value.applied_date) || new Date().toISOString().slice(0, 10),
      notes: value.notes ?? '',
    });
  }, [value]);
  const change = (e) => {
    const { name, value } = e.target;
    setForm((v) => ({ ...v, [name]: name === 'salary' ? normalizeSalaryInput(value) : value }));
  };
  const submit = async (e) => { e.preventDefault(); if (!form.position.trim()) return setError('Position is required.'); const salary = form.salary ? normalizeSalaryInput(form.salary) : ''; if (salary && !/^\d+(\.\d{1,2})?$/.test(salary)) return setError('Salary must be numeric.'); setError(''); await onSubmit({ ...form, company_id: form.company_id ? Number(form.company_id) : null, salary: salary || null, applied_date: form.applied_date || null, job_url: form.job_url || null }); };
  return <form className="form-grid" onSubmit={submit}>{error && <div className="form-error">{error}</div>}<Select label="Company" name="company_id" value={form.company_id} onChange={change}><option value="">No company selected</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select><Input label="Position *" name="position" value={form.position} onChange={change} placeholder="e.g. Frontend Engineer" required /><Input label="Location" name="location" value={form.location || ''} onChange={change} placeholder="Remote or city" /><Input label="Salary (₹)" name="salary" value={form.salary || ''} onChange={change} inputMode="decimal" placeholder="e.g. 85000" /><Input label="Job URL" name="job_url" value={form.job_url || ''} onChange={change} type="url" placeholder="https://…" /><Select label="Status" name="status" value={form.status} onChange={change}>{statuses.map((s) => <option key={s}>{s}</option>)}</Select><Input label="Applied date" name="applied_date" value={form.applied_date || ''} onChange={change} type="date" /><label className="field full"><span>Notes</span><textarea name="notes" value={form.notes || ''} onChange={change} rows="5" placeholder="Add anything worth remembering…" /></label><div className="form-actions full"><Button type="button" variant="secondary" onClick={onCancel}>{cancelLabel}</Button><Button type="submit" loading={saving}>{value ? 'Save changes' : 'Add application'}</Button></div></form>;
}

