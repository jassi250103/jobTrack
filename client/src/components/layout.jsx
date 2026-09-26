import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const links = [['▦', 'Dashboard', '/dashboard'], ['◫', 'Applications', '/applications'], ['◷', 'Interviews', '/interviews'], ['▣', 'Companies', '/companies'], ['◎', 'Profile', '/profile']];
export function AppLayout() {
  const { user, logout } = useAuth(); const [open, setOpen] = useState(false); const navigate = useNavigate();
  const signOut = () => { logout(); navigate('/login'); };
  return <div className="app-shell"><aside className={`sidebar ${open ? 'sidebar-open' : ''}`}><NavLink to="/dashboard" className="brand" onClick={() => setOpen(false)}><i>J</i><span>JobTrack</span></NavLink><nav>{links.map(([icon, label, to]) => <NavLink key={to} to={to} onClick={() => setOpen(false)}><b>{icon}</b>{label}</NavLink>)}</nav><div className="sidebar-user"><div className="avatar">{user?.name?.[0]?.toUpperCase()}</div><div><strong>{user?.name}</strong><small>{user?.email}</small></div><button onClick={signOut} title="Log out" aria-label="Log out">↪</button></div></aside>{open && <div className="nav-overlay" onClick={() => setOpen(false)} />}
    <main><header className="topbar"><button className="menu-button" onClick={() => setOpen(true)} aria-label="Open navigation">☰</button><div className="topbar-title">Your job search, organized.</div><button className="topbar-avatar" onClick={() => navigate('/profile')} aria-label="Profile">{user?.name?.[0]?.toUpperCase()}</button></header><div className="page-content"><Outlet /></div></main></div>;
}

