import { useCallback, useEffect, useState } from 'react';

async function adminRequest(path, options = {}) {
  let user;
  try { user = JSON.parse(localStorage.getItem('portalUser') || 'null'); } catch { user = null; }
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}), ...options.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'The request could not be completed.');
  return data;
}

export default function AdminApplicants({ user }) {
  const [status, setStatus] = useState('pending');
  const [targetType, setTargetType] = useState('all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [updating, setUpdating] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    const query = new URLSearchParams();
    if (status !== 'all') query.set('status', status);
    if (targetType !== 'all') query.set('targetType', targetType);
    try { const data = await adminRequest(`/api/admin/enrollments?${query}`); setItems(data.enrollments); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [status, targetType]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(item, nextStatus) {
    setUpdating(item._id); setError(''); setMessage('');
    try {
      await adminRequest(`/api/admin/enrollments/${item._id}/status`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) });
      await load(); setMessage(`Request marked ${nextStatus}.`);
    } catch (err) { setError(err.message); }
    finally { setUpdating(''); }
  }

  return <main className="admin-page"><div className="admin-wrap">
    <div className="admin-breadcrumb"><span>ADMIN WORKSPACE</span><i>›</i><b>Enrollment requests</b></div>
    <div className="admin-heading"><div><span className="eyebrow">STUDENT OPPORTUNITIES</span><h1>Enrollment requests</h1><p>Review interest from students and follow up with selected applicants.</p></div><div className="admin-heading-actions"><a href="/admin/opportunities" className="small-outline">Manage listings ↗</a><a href="/admin/mentor-records" className="small-outline">Mentor records ↗</a><a href="/admin/careers" className="small-outline admin-secondary-link">Manage learning paths ↗</a></div></div>
    <section className="admin-table-section"><div className="applicant-toolbar"><div className="applicant-filter"><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="pending">Needs review</option><option value="selected">Selected</option><option value="declined">Declined</option><option value="all">All requests</option></select></label><label>Opportunity type<select value={targetType} onChange={(event) => setTargetType(event.target.value)}><option value="all">All types</option><option value="project">Projects</option><option value="competition">Competitions</option></select></label></div><span className="applicant-count">{items.length} {items.length === 1 ? 'request' : 'requests'}</span></div>
      {message && <div className="admin-notice" role="status">✳ &nbsp;{message}</div>}{error && <div className="admin-error" role="alert">{error} <button onClick={load}>Try again</button></div>}
      {loading ? <div className="admin-empty">Loading enrollment requests…</div> : items.length === 0 ? <div className="admin-empty"><span>✳</span><b>No requests in this view.</b><p>New student enrollment requests will appear here.</p></div> : <div className="applicant-list">{items.map((item) => <article className="applicant-card" key={item._id}><div className="applicant-card-head"><div><span className={`applicant-type ${item.targetType}`}>{item.targetType === 'project' ? 'PROJECT' : 'COMPETITION'}</span><h2>{item.targetTitle}</h2></div><span className={`status-badge ${item.status === 'selected' ? 'live' : item.status === 'pending' ? 'pending' : 'hidden'}`}>{item.status}</span></div><div className="applicant-person"><span className="avatar">{item.student?.name?.[0] || '?'}</span><span><b>{item.student?.name || 'Account unavailable'}</b><a href={`mailto:${item.contactEmail}`}>{item.contactEmail}</a></span><small>Submitted {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</small></div>{item.skills && <div className="applicant-answer"><small>SKILLS / EXPERIENCE</small><p>{item.skills}</p></div>}<div className="applicant-answer"><small>WHY THEY’RE INTERESTED</small><p>{item.motivation}</p></div><div className="applicant-actions">{item.reviewedBy?.name && <span>Reviewed by {item.reviewedBy.name}</span>}<div><button className="small-outline" disabled={updating === item._id || item.status === 'selected'} onClick={() => updateStatus(item, 'selected')}>{updating === item._id ? 'Updating…' : item.status === 'selected' ? 'Selected' : 'Select applicant'}</button><button className="small-outline decline-button" disabled={updating === item._id || item.status === 'declined'} onClick={() => updateStatus(item, 'declined')}>{item.status === 'declined' ? 'Declined' : 'Decline'}</button></div></div></article>)}</div>}
    </section><div className="admin-signed-in">Signed in as {user.name} <span>·</span> Admin</div>
  </div></main>;
}
