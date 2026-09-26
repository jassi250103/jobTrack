import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi, interviewsApi } from '../api/services';
import { useAuth } from '../hooks/useAuth';
import { ErrorState, Skeleton, StatusBadge } from '../components/ui';

const statusOrder = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED'];
const icons = ['▦', '◷', '✦', '↘'];
const parseDisplayDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const raw = String(value).trim();
  if (!raw) return null;
  const normalized = /[TtZz]|\s/.test(raw) ? raw : `${raw}T00:00:00`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};
export default function Dashboard() {
  const { user } = useAuth(); const [data, setData] = useState(null); const [recent, setRecent] = useState([]); const [interviews, setInterviews] = useState([]); const [error, setError] = useState('');
  const load = () => { setError(''); Promise.all([dashboardApi.stats(), dashboardApi.recent(), interviewsApi.list()]).then(([stats, latest, interviewList]) => { setData(stats.data); setRecent(latest.data); setInterviews(interviewList.data); }).catch((e) => setError(e.message)); };
  useEffect(load, []);
  const upcoming = useMemo(() => interviews.filter((item) => item.interview_date >= new Date().toISOString().slice(0, 10) && item.result !== 'CANCELLED').slice(0, 4), [interviews]);
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <div className="dashboard-skeleton"><Skeleton lines={2} /><div className="stat-grid">{[1, 2, 3, 4].map((x) => <Skeleton lines={3} key={x} />)}</div></div>;
  const cards = [['Total applications', data.total_applications, 'All opportunities in your pipeline'], ['Interviews', data.total_interviews, `${data.upcoming_interviews} upcoming`], ['Offers', data.offers, `${data.offer_rate}% conversion rate`], ['Rejected', data.rejections, 'Every response brings clarity']];
  return <><div className="page-heading"><div><p className="eyebrow">OVERVIEW</p><h1>Good morning, {user?.name?.split(' ')[0] || 'there'}.</h1><p>Here's an overview of your job search.</p></div><Link className="button button-primary" to="/applications/new">+ Add application</Link></div><section className="stat-grid">{cards.map(([label, value, note], index) => <article className="stat-card" key={label}><div className="stat-icon">{icons[index]}</div><div><small>{label.toUpperCase()}</small><strong>{value}</strong><span>{note}</span></div></article>)}</section><section className="dashboard-grid"><article className="panel status-panel"><div className="panel-heading"><div><p className="eyebrow">APPLICATION PIPELINE</p><h2>Momentum at a glance</h2><p>Applications grouped by their latest stage.</p></div></div><div className="pipeline">{statusOrder.map((status) => { const count = data.applications_by_status?.[status] || 0; const percent = data.total_applications ? count / data.total_applications * 100 : 0; return <div className="pipeline-item" key={status}><span><StatusBadge status={status} /><b>{count}</b></span><i><em style={{ width: `${percent}%` }} /></i><small>{Math.round(percent)}%</small></div>; })}</div></article><article className="panel"><div className="panel-heading"><div><p className="eyebrow">UPCOMING INTERVIEWS</p><h2>Prepare with purpose</h2></div><Link to="/interviews">View all</Link></div>{upcoming.length ? <div className="upcoming-list">{upcoming.map((item) => { const date = parseDisplayDate(item.interview_date); return <Link to="/interviews" key={item.id}><time><b>{date ? date.toLocaleDateString(undefined, { month: 'short' }) : '—'}</b><strong>{date ? date.getDate() : '—'}</strong></time><div><strong>{item.round_name}</strong><span>{item.interview_time?.slice(0, 5) || 'Time TBC'} · {item.type}</span></div></Link>; })}</div> : <div className="inline-empty"><b>◷</b><p>No upcoming interviews.<br />When one is scheduled, it will appear here.</p><Link to="/interviews">Add interview</Link></div>}</article></section><section className="panel recent-panel"><div className="panel-heading"><div><p className="eyebrow">RECENT APPLICATIONS</p><h2>Latest opportunities</h2><p>Keep a pulse on what you've added lately.</p></div><Link to="/applications">View all</Link></div>{recent.length ? <div className="recent-list">{recent.map((app) => <Link key={app.id} to={`/applications/${app.id}`}><div className="company-mark">{app.company?.name?.[0] || 'J'}</div><div><strong>{app.position}</strong><span>{app.company?.name || 'Independent application'} · {(() => { const date = parseDisplayDate(app.applied_date); return date ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Date TBC'; })()}</span></div><StatusBadge status={app.status} /></Link>)}</div> : <div className="inline-empty"><p>Your latest applications will appear here.</p><Link to="/applications/new">Add your first application</Link></div>}</section></>;
}
