import { useCallback, useEffect, useState } from 'react';

async function adminRequest(path) {
  let user;
  try { user = JSON.parse(localStorage.getItem('portalUser') || 'null'); } catch { user = null; }
  const response = await fetch(path, { headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {} });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'The request could not be completed.');
  return data;
}

export default function AdminMentorRecords({ user }) {
  const [records, setRecords] = useState({ payments: [], subscriptions: [] });
  const [view, setView] = useState('payments');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setRecords(await adminRequest('/api/admin/mentor-records')); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const list = view === 'payments' ? records.payments : records.subscriptions;

  return <main className="admin-page"><div className="admin-wrap">
    <div className="admin-breadcrumb"><span>ADMIN WORKSPACE</span><i>›</i><b>Mentor records</b></div>
    <div className="admin-heading"><div><span className="eyebrow">MENTOR SUBMISSIONS</span><h1>Payment and subscription records</h1><p>Review records entered by mentors for the students they support.</p></div><div className="admin-heading-actions"><a href="/admin/opportunities" className="small-outline">Manage listings ↗</a><a href="/admin/applicants" className="small-outline">Enrollment requests ↗</a></div></div>
    <section className="admin-table-section"><div className="record-tabs"><button className={view === 'payments' ? 'active' : ''} onClick={() => setView('payments')}>Payments <span>{records.payments.length}</span></button><button className={view === 'subscriptions' ? 'active' : ''} onClick={() => setView('subscriptions')}>Subscriptions <span>{records.subscriptions.length}</span></button></div>
      {error && <div className="admin-error" role="alert">{error} <button onClick={load}>Try again</button></div>}
      {loading ? <div className="admin-empty">Loading mentor records…</div> : list.length === 0 ? <div className="admin-empty"><span>◎</span><b>No {view} have been recorded yet.</b><p>Records submitted through the mentor portal will appear here.</p></div> : view === 'payments' ? <div className="mentor-admin-records">{list.map((record) => <article className="mentor-admin-record" key={record._id}><div className="admin-record-main"><span className="admin-record-label">PAYMENT</span><h2>{record.student?.name || 'Student unavailable'}</h2><a href={`mailto:${record.student?.email || ''}`}>{record.student?.email || 'No email'}</a></div><div><small>AMOUNT</small><b>{record.currency} {Number(record.amount).toLocaleString()}</b></div><div><small>METHOD</small><b>{record.method}</b><span>{new Date(record.paidAt).toLocaleDateString()}</span></div><div><small>RECORDED BY</small><b>{record.enteredBy?.name || 'Mentor unavailable'}</b>{record.reference && <span>Ref: {record.reference}</span>}</div>{record.notes && <p className="admin-record-notes">{record.notes}</p>}</article>)}</div> : <div className="mentor-admin-records">{list.map((record) => <article className="mentor-admin-record" key={record._id}><div className="admin-record-main"><span className="admin-record-label subscription-label">SUBSCRIPTION</span><h2>{record.student?.name || 'Student unavailable'}</h2><a href={`mailto:${record.student?.email || ''}`}>{record.student?.email || 'No email'}</a></div><div><small>PLAN</small><b>{record.planName}</b></div><div><small>SUBSCRIPTION PERIOD</small><b>{new Date(record.startDate).toLocaleDateString()} – {new Date(record.endDate).toLocaleDateString()}</b></div><div><small>STATUS</small><span className={`status-badge ${record.status === 'active' ? 'live' : record.status === 'scheduled' ? 'pending' : 'hidden'}`}>{record.status}</span></div><div><small>RECORDED BY</small><b>{record.enteredBy?.name || 'Mentor unavailable'}</b></div></article>)}</div>}
    </section><div className="admin-signed-in">Signed in as {user.name} <span>·</span> Admin</div>
  </div></main>;
}
