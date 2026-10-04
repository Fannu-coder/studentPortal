import { useCallback, useEffect, useState } from 'react';

async function request(path, token, options = {}) {
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'The request could not be completed.');
  return data;
}

const topicLabels = { general: 'General', learning: 'Learning paths', opportunity: 'Opportunities', technical: 'Technical help', other: 'Other' };

export default function AdminContact({ user }) {
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState('open');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ status: filter, page: String(page) });
      if (search) params.set('search', search);
      const data = await request(`/api/admin/contact?${params}`, user.token);
      setMessages(data.messages);
      setPagination(data.pagination);
    }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [filter, page, search, user.token]);
  useEffect(() => { load(); }, [load]);

  async function setStatus(message) {
    setBusyId(message._id); setError('');
    try { await request(`/api/admin/contact/${message._id}/status`, user.token, { method: 'PATCH', body: JSON.stringify({ status: message.status === 'open' ? 'resolved' : 'open' }) }); setPage(1); if (page === 1) await load(); }
    catch (err) { setError(err.message); }
    finally { setBusyId(''); }
  }

  const openCount = pagination?.openCount || 0;
  const resolvedCount = pagination?.resolvedCount || 0;
  return <main className="admin-page"><div className="admin-wrap"><div className="admin-breadcrumb"><a href="/admin">ADMIN WORKSPACE</a><i>›</i><b>Contact inbox</b></div><div className="admin-heading"><div><span className="eyebrow">COMMUNITY SUPPORT</span><h1>Contact inbox</h1><p>Read incoming questions and follow up with people who reached out.</p></div><span className="contact-open-count">{openCount} open {openCount === 1 ? 'message' : 'messages'}</span></div>
    {error && <div className="admin-error" role="alert">{error} <button onClick={load}>Try again</button></div>}
    <div className="contact-inbox-toolbar"><div className="tab-list" role="tablist" aria-label="Filter contact messages">{[['open', 'Open', openCount], ['resolved', 'Resolved', resolvedCount], ['all', 'All', pagination?.openCount + pagination?.resolvedCount || 0]].map(([value, label, count]) => <button role="tab" aria-selected={filter === value} key={value} className={`filter-tab ${filter === value ? 'selected' : ''}`} onClick={() => { setFilter(value); setPage(1); }}>{label} ({count})</button>)}</div><form className="contact-search" onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(searchInput.trim()); }}><input aria-label="Search contact messages" placeholder="Search name, email, or message" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} /><button className="small-outline">Search</button>{search && <button type="button" className="small-outline" onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}>Clear</button>}</form></div>
    {loading ? <div className="admin-empty">Loading contact messages…</div> : messages.length ? <><div className="contact-inbox-list">{messages.map((message) => <article className="contact-inbox-card" key={message._id}><div className="contact-message-heading"><div><h2>{message.name}</h2><a href={`mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent('Re: Your message to GRONIXE')}`}>{message.email} ↗</a></div><span className={`status-badge ${message.status === 'open' ? 'pending' : 'live'}`}>{message.status}</span></div><div className="contact-message-meta"><span>{topicLabels[message.topic] || 'General'}</span><i>·</i><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString()}</time></div><p className="contact-message-body">{message.message}</p><button className="small-outline" disabled={busyId === message._id} onClick={() => setStatus(message)}>{busyId === message._id ? 'Saving…' : message.status === 'open' ? 'Mark resolved' : 'Reopen message'}</button></article>)}</div><div className="contact-pagination"><span>Page {pagination?.page || 1} of {pagination?.totalPages || 1} · {pagination?.total || 0} messages</span><div><button className="small-outline" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button><button className="small-outline" disabled={page >= (pagination?.totalPages || 1) || loading} onClick={() => setPage((current) => current + 1)}>Next</button></div></div></> : <div className="admin-empty">{search ? 'No messages match that search.' : filter === 'open' ? 'No open contact messages. You’re all caught up.' : 'No messages in this view yet.'}</div>}
  </div></main>;
}
