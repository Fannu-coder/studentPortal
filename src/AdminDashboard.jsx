import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

async function adminRequest(path) {
  let user;
  try { user = JSON.parse(localStorage.getItem('portalUser') || 'null'); } catch { user = null; }
  const response = await fetch(path, { headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {} });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'The request could not be completed.');
  return data;
}

const metricCards = [
  { key: 'pendingEnrollments', label: 'Needs your review', icon: '◎', tone: 'peach', link: '/admin/applicants', action: 'Open inbox' },
  { key: 'mentors', label: 'Active mentors', icon: '◌', tone: 'mint', link: '/admin/mentors', action: 'Manage team' },
  { key: 'students', label: 'Active students', icon: '↗', tone: 'lilac', link: '/admin/mentors', action: 'View mentors' },
  { key: 'careers', label: 'Learning paths', icon: '✳', tone: 'blue', link: '/admin/careers', action: 'Edit paths' },
  { key: 'pendingContactMessages', label: 'Open contact messages', icon: '✉', tone: 'peach', link: '/admin/contact', action: 'Open contact inbox' },
];

const workspaces = [
  { icon: '◎', tone: 'peach', title: 'Enrollment requests', description: 'Review students applying to projects and competitions.', to: '/admin/applicants', action: 'Review applicants' },
  { icon: '◌', tone: 'mint', title: 'Mentor accounts', description: 'Add mentors and manage account access.', to: '/admin/mentors', action: 'Manage mentors' },
  { icon: '◈', tone: 'lilac', title: 'Projects and competitions', description: 'Keep opportunities and deadlines current.', to: '/admin/opportunities', action: 'Manage listings' },
  { icon: '✳', tone: 'blue', title: 'Career roadmaps', description: 'Organise career fields, phases, and learning resources.', to: '/admin/careers', action: 'Manage learning paths' },
  { icon: '▤', tone: 'peach', title: 'Mentor records', description: 'Review payment and subscription details entered by mentors.', to: '/admin/mentor-records', action: 'View records' },
  { icon: '✉', tone: 'lilac', title: 'Contact inbox', description: 'Review questions sent from the public contact form.', to: '/admin/contact', action: 'Review messages' },
];

export default function AdminDashboard({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData(await adminRequest('/api/admin/dashboard')); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  return <main className="admin-dashboard-page"><div className="admin-wrap">
    <div className="admin-breadcrumb"><span>ADMIN WORKSPACE</span><i>›</i><b>Overview</b></div>
    <section className="dashboard-welcome"><div><span className="eyebrow"><span className="eyebrow-spark">✳</span> A QUICK LOOK AROUND</span><h1>Good to see you, {user.name.split(' ')[0]}.</h1><p>Here’s what’s happening across your student community.</p></div><span className="dashboard-date">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span></section>
    {error && <div className="admin-error" role="alert">{error} <button onClick={load}>Try again</button></div>}
    <div className="dashboard-metrics">{metricCards.map((metric) => <Link to={metric.link} className="dashboard-metric" key={metric.key}><div className="dashboard-metric-top"><span className={`dashboard-icon ${metric.tone}`}>{metric.icon}</span><span>↗</span></div><b>{loading ? '—' : data?.stats?.[metric.key] ?? 0}</b><span className="metric-label">{metric.label}</span><small>{metric.action}</small></Link>)}</div>
    <div className="dashboard-columns"><section className="dashboard-workspaces"><div className="dashboard-section-heading"><div><span className="eyebrow">YOUR WORKSPACES</span><h2>Where would you like to go?</h2></div></div><div className="dashboard-workspace-grid">{workspaces.map((workspace) => <Link to={workspace.to} key={workspace.to} className="dashboard-workspace"><span className={`dashboard-icon ${workspace.tone}`}>{workspace.icon}</span><h3>{workspace.title}</h3><p>{workspace.description}</p><span className="dashboard-workspace-action">{workspace.action} <i>↗</i></span></Link>)}</div></section>
      <aside className="dashboard-inbox"><div className="dashboard-inbox-heading"><div><span className="eyebrow">IN YOUR INBOX</span><h2>Recent requests</h2></div><Link to="/admin/applicants">View all ↗</Link></div>{loading ? <div className="dashboard-inbox-empty">Loading requests…</div> : !data?.recentRequests?.length ? <div className="dashboard-inbox-empty"><span>✳</span><b>You’re all caught up.</b><p>New enrollment requests will appear here.</p></div> : <div className="recent-request-list">{data.recentRequests.map((request) => <article className="recent-request" key={request._id}><span className={`recent-type ${request.targetType}`}>{request.targetType === 'project' ? 'P' : 'C'}</span><div><b>{request.student?.name || 'Student'}</b><span>{request.targetTitle}</span><small>{new Date(request.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small></div></article>)}</div>}<Link className="dashboard-review-link" to="/admin/applicants">Review enrollment requests <span>↗</span></Link></aside>
    </div><div className="admin-signed-in">Signed in as {user.name} <span>·</span> Admin</div>
  </div></main>;
}
