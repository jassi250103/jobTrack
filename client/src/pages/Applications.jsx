import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { applicationsApi, companiesApi } from '../api/services';
import { useToast } from '../hooks/useToast';
import { EmptyState, ErrorState, LoadingState, Pagination, StatusBadge } from '../components/ui';
import ApplicationForm from '../components/ApplicationForm';

const statuses = ['', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'];
const blankFilters = { page: 1, limit: 10, search: '', status: '', sort: 'applied_date', order: 'desc', companyId: '', location: '', fromDate: '', toDate: '' };
const parseDisplayDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const raw = String(value).trim();
  if (!raw) return null;
  const normalized = /[TtZz]|\s/.test(raw) ? raw : `${raw}T00:00:00`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};
const formatDisplayDate = (value) => {
  const date = parseDisplayDate(value);
  if (!date) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const formatDisplaySalary = (value) => {
  if (!value && value !== 0) return '—';
  return `₹${Number(value).toLocaleString('en-IN')}`;
};
export default function Applications() {
  const [result, setResult] = useState(null); const [companies, setCompanies] = useState([]); const [filters, setFilters] = useState(blankFilters); const [query, setQuery] = useState(''); const [error, setError] = useState('');
  const activeFilters = useMemo(() => Object.entries(filters).some(([key, value]) => !['page', 'limit', 'sort', 'order'].includes(key) && value), [filters]);
  const load = () => { setError(''); applicationsApi.list(filters).then(setResult).catch((e) => setError(e.message)); };
  useEffect(() => { companiesApi.list().then((r) => setCompanies(r.data)).catch(() => {}); }, []);
  useEffect(load, [filters]);
  useEffect(() => { const timer = setTimeout(() => setFilters((old) => ({ ...old, page: 1, search: query })), 350); return () => clearTimeout(timer); }, [query]);
  const setFilter = (key, value) => setFilters((old) => ({ ...old, page: 1, [key]: value }));
  if (error) return <ErrorState message={error} onRetry={load} />;
  return <><div className="page-heading"><div><p className="eyebrow">APPLICATIONS</p><h1>Track every opportunity.</h1><p>Keep your momentum visible and your next steps clear.</p></div><Link className="button button-primary" to="/applications/new">+ Add application</Link></div><section className="toolbar toolbar-filters"><label className="search"><span aria-hidden="true">⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search role, company, or location" aria-label="Search applications" /></label><select aria-label="Filter by status" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>{statuses.map((status) => <option key={status} value={status}>{status || 'All statuses'}</option>)}</select><select aria-label="Filter by company" value={filters.companyId} onChange={(e) => setFilter('companyId', e.target.value)}><option value="">All companies</option>{companies.map((company) => <option value={company.id} key={company.id}>{company.name}</option>)}</select><input aria-label="Filter by location" value={filters.location} onChange={(e) => setFilter('location', e.target.value)} placeholder="Location" /><input aria-label="Applications from date" type="date" value={filters.fromDate} onChange={(e) => setFilter('fromDate', e.target.value)} /><input aria-label="Applications to date" type="date" value={filters.toDate} onChange={(e) => setFilter('toDate', e.target.value)} /><select aria-label="Sort applications" value={`${filters.sort}:${filters.order}`} onChange={(e) => { const [sort, order] = e.target.value.split(':'); setFilters((old) => ({ ...old, sort, order })); }}><option value="applied_date:desc">Newest applied</option><option value="applied_date:asc">Oldest applied</option><option value="created_at:desc">Recently added</option><option value="position:asc">Position A–Z</option></select>{activeFilters && <button className="clear-filters" onClick={() => { setQuery(''); setFilters(blankFilters); }}>Clear filters</button>}</section>{!result ? <LoadingState /> : result.data.length === 0 ? <EmptyState title="No applications found" text={activeFilters ? 'Try clearing a filter or changing your search.' : 'Start tracking your job search by adding your first application.'} action="Add application" to="/applications/new" /> : <><div className="table-wrap"><table className="application-table"><thead><tr><th>Company & position</th><th>Location</th><th>Status</th><th>Applied</th><th>Salary</th><th /></tr></thead><tbody>{result.data.map((app) => <tr key={app.id}><td><Link to={`/applications/${app.id}`} className="app-primary"><i>{app.company?.name?.[0] || '—'}</i><span><strong>{app.position}</strong><small>{app.company?.name || 'No company'}</small></span></Link></td><td>{app.location || '—'}</td><td><StatusBadge status={app.status} /></td><td>{formatDisplayDate(app.applied_date)}</td><td>{app.salary ? formatDisplaySalary(app.salary) : '—'}</td><td><Link className="row-action" to={`/applications/${app.id}`}>View →</Link></td></tr>)}</tbody></table></div><Pagination pagination={result.pagination} onPage={(page) => setFilters((old) => ({ ...old, page }))} /></>}</>;
}
export function ApplicationEditor({ edit = false }) { const navigate = useNavigate(); const { id } = useParams(); const { notify } = useToast(); const [app, setApp] = useState(null); const [saving, setSaving] = useState(false); const [error, setError] = useState(''); useEffect(() => { if (edit) applicationsApi.get(id).then((r) => setApp(r.data)).catch((e) => setError(e.message)); }, [edit, id]); const save = async (values) => { setSaving(true); setError(''); try { const result = edit ? await applicationsApi.update(id, values) : await applicationsApi.create(values); notify(edit ? 'Application updated.' : 'Application added.'); navigate(`/applications/${result.data.id}`); } catch (e) { setError(e.message); notify(e.message, 'error'); } finally { setSaving(false); } }; if (error) return <ErrorState message={error} />; if (edit && !app) return <LoadingState />; return <><div className="page-heading compact"><div><p className="eyebrow">{edit ? 'EDIT APPLICATION' : 'NEW APPLICATION'}</p><h1>{edit ? 'Keep it up to date.' : 'Add an opportunity.'}</h1><p>Capture the details that make every next step easier.</p></div></div><section className="panel form-panel"><ApplicationForm value={app} saving={saving} onSubmit={save} onCancel={() => navigate(edit ? `/applications/${id}` : '/applications')} />{error && <div className="form-error">{error}</div>}</section></>; }
