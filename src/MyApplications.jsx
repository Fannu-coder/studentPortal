import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

async function studentRequest(path) {
  let user;
  try { user = JSON.parse(localStorage.getItem('portalUser') || 'null'); } catch { user = null; }
  const response = await fetch(path, { headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {} });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'The request could not be completed.');
  return data;
}

const statusCopy = {
  pending: 'Your request has been sent. The team will review it and follow up.',
  selected: 'You’ve been selected. Check your email for next steps from the team.',
  declined: 'This request was not selected. Keep exploring other opportunities.',
};

export default function MyApplications({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const data = await studentRequest('/api/enrollments/mine'); setItems(data.enrollments); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const filtered = filter === 'all' ? items : items.filter((item) => item.status === filter);
  const pending = items.filter((item) => item.status === 'pending').length;
  const selected = items.filter((item) => item.status === 'selected').length;

  return <main className="applications-page"><div className="applications-wrap"><div className="breadcrumbs"><Link to="/">Discover</Link><span>›</span><b>My applications</b></div>
    <section className="applications-hero"><div><span className="eyebrow"><span className="eyebrow-spark">✳</span> YOUR NEXT STEPS</span><h1>My applications<span>.</span></h1><p>See where your project and competition requests stand.</p></div><div className="applications-summary"><div><b>{items.length}</b><span>sent</span></div><i /><div><b>{pending}</b><span>in review</span></div><i /><div><b>{selected}</b><span>selected</span></div></div></section>
    <div className="applications-toolbar"><div><h2>Your requests</h2><p>We’ll update these as the team reviews each application.</p></div><label>Show<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All requests</option><option value="pending">In review</option><option value="selected">Selected</option><option value="declined">Not selected</option></select></label></div>
    {error && <div className="admin-error" role="alert">{error} <button onClick={load}>Try again</button></div>}
    {loading ? <div className="applications-empty">Loading your applications…</div> : filtered.length === 0 ? <div className="applications-empty"><span>✳</span><b>{items.length ? 'No requests match this filter.' : 'Your next opportunity is out there.'}</b><p>{items.length ? 'Choose another status to see your requests.' : 'Explore a project or competition and send an interest request.'}</p>{items.length === 0 && <div><Link className="small-outline" to="/projects">Explore projects</Link><Link className="small-outline" to="/competitions">See competitions</Link></div>}</div> : <div className="application-list">{filtered.map((item) => <article className="application-card" key={item._id}><div className="application-card-main"><span className={`applicant-type ${item.targetType}`}>{item.targetType === 'project' ? 'PROJECT' : 'COMPETITION'}</span><h3>{item.targetTitle}</h3><p>{statusCopy[item.status]}</p><small>Sent {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</small></div><div className="application-status-wrap"><span className={`status-badge ${item.status === 'selected' ? 'live' : item.status === 'pending' ? 'pending' : 'hidden'}`}>{item.status === 'declined' ? 'Not selected' : item.status === 'pending' ? 'In review' : 'Selected'}</span><Link to={item.targetType === 'project' ? '/projects' : '/competitions'}>Explore more <span>↗</span></Link></div></article>)}</div>}
    <div className="applications-note">Questions about an application? <Link to="/contact?topic=opportunity">Get in touch with the team <span>↗</span></Link></div>
    <div className="applications-student">Signed in as {user.name}</div>
  </div></main>;
}
