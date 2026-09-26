import { useEffect, useState } from 'react';
import { Button, Input, Select } from './ui';
const types = ['PHONE', 'VIDEO', 'ONSITE', 'OTHER']; const results = ['PENDING', 'PASSED', 'FAILED', 'CANCELLED'];
export default function InterviewForm({ applicationId, applications = [], value, onSubmit, saving, onCancel }) {
  const normalizeDateValue = (raw) => {
    if (!raw) return '';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return String(raw).slice(0, 10);
    return date.toISOString().slice(0, 10);
  };

  const [form, setForm] = useState({
    application_id: applicationId || '',
    round_name: '',
    interview_date: '',
    interview_time: '',
    type: 'VIDEO',
    meeting_link: '',
    notes: '',
    result: 'PENDING'
  });

  useEffect(() => {
    setForm({
      application_id: applicationId || value?.application_id || '',
      round_name: value?.round_name || '',
      interview_date: normalizeDateValue(value?.interview_date),
      interview_time: value?.interview_time || '',
      type: value?.type || 'VIDEO',
      meeting_link: value?.meeting_link || '',
      notes: value?.notes || '',
      result: value?.result || 'PENDING'
    });
  }, [applicationId, value]);

  const [error, setError] = useState('');
  const change = (e) => setForm((v) => ({ ...v, [e.target.name]: e.target.value }));
  const submit = (e) => { e.preventDefault(); if (!form.application_id || !form.round_name || !form.interview_date) return setError('Application, round name, and date are required.'); setError(''); onSubmit({ ...form, application_id: Number(form.application_id), interview_time: form.interview_time || null, meeting_link: form.meeting_link || null }); }; return <form className="form-grid" onSubmit={submit}>{error && <div className="form-error">{error}</div>}{!applicationId && <Select label="Application *" name="application_id" value={form.application_id} onChange={change}><option value="">Choose an application</option>{applications.map((a) => <option key={a.id} value={a.id}>{a.position} — {a.company?.name || 'No company'}</option>)}</Select>}<Input label="Round name *" name="round_name" value={form.round_name} onChange={change} placeholder="Technical interview" /><Input label="Date *" type="date" name="interview_date" value={form.interview_date} onChange={change} /><Input label="Time" type="time" name="interview_time" value={form.interview_time || ''} onChange={change} /><Select label="Interview type" name="type" value={form.type} onChange={change}>{types.map((x) => <option key={x}>{x}</option>)}</Select><Input label="Meeting link" type="url" name="meeting_link" value={form.meeting_link || ''} onChange={change} placeholder="https://…" /><Select label="Result" name="result" value={form.result || ''} onChange={change}>{results.map((x) => <option key={x}>{x}</option>)}</Select><label className="field full"><span>Notes</span><textarea name="notes" rows="4" value={form.notes || ''} onChange={change} /></label><div className="form-actions full"><Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button><Button loading={saving}>Save interview</Button></div></form>; }
