import { useCallback, useEffect, useState } from 'react';

async function adminRequest(path, options = {}) {
  let user;
  try { user = JSON.parse(localStorage.getItem('portalUser') || 'null'); } catch { user = null; }
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}), ...options.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'The request could not be completed.');
  return data;
}

const blankProject = () => ({ title: '', slug: '', category: '', description: '', skills: '', opportunities: '', active: true });
const blankCompetition = () => ({ title: '', slug: '', description: '', eligibility: '', registrationDetails: '', deadline: '', active: true });

export default function AdminOpportunities({ user }) {
  const [kind, setKind] = useState('projects');
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blankProject);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadItems = useCallback(async () => {
    setLoading(true); setError('');
    try { const data = await adminRequest(`/api/admin/opportunities/${kind}`); setItems(data.items); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [kind]);
  useEffect(() => { loadItems(); setFormOpen(false); setEditingId(null); setForm(kind === 'projects' ? blankProject() : blankCompetition()); }, [kind, loadItems]);

  function startNew() { setEditingId(null); setForm(kind === 'projects' ? blankProject() : blankCompetition()); setError(''); setNotice(''); setFormOpen(true); }
  function startEdit(item) {
    setEditingId(item._id);
    setForm(kind === 'projects' ? { ...item, skills: (item.skills || []).join(', ') } : { ...item, deadline: item.deadline ? new Date(item.deadline).toISOString().slice(0, 10) : '' });
    setError(''); setNotice(''); setFormOpen(true);
  }
  async function saveItem(event) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    const url = `/api/admin/opportunities/${kind}${editingId ? `/${editingId}` : ''}`;
    const body = kind === 'projects' ? { ...form, skills: form.skills.split(',').map((skill) => skill.trim()).filter(Boolean) } : form;
    try {
      await adminRequest(url, { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(body) });
      await loadItems(); setNotice(`${kind === 'projects' ? 'Project' : 'Competition'} ${editingId ? 'updated' : 'created'}.`); setFormOpen(false);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }
  async function toggleActive(item) {
    setError(''); setNotice('');
    try {
      await adminRequest(`/api/admin/opportunities/${kind}/${item._id}/status`, { method: 'PATCH', body: JSON.stringify({ active: !item.active }) });
      await loadItems(); setNotice(`${item.title} is now ${item.active ? 'hidden' : 'live'}.`);
    } catch (err) { setError(err.message); }
  }
  async function removeItem(item) {
    if (!window.confirm(`Delete “${item.title}”? Enrollment history will remain available to admins.`)) return;
    setError(''); setNotice('');
    try { await adminRequest(`/api/admin/opportunities/${kind}/${item._id}`, { method: 'DELETE' }); await loadItems(); setNotice('Listing deleted.'); }
    catch (err) { setError(err.message); }
  }

  const isProject = kind === 'projects';
  return <main className="admin-page"><div className="admin-wrap">
    <div className="admin-breadcrumb"><span>ADMIN WORKSPACE</span><i>›</i><b>Opportunities</b></div>
    <div className="admin-heading"><div><span className="eyebrow">STUDENT OPPORTUNITIES</span><h1>Projects and competitions</h1><p>Keep the opportunities students can discover and apply to up to date.</p></div><div className="admin-heading-actions"><a className="small-outline" href="/admin/applicants">Review enrollments ↗</a><button className="button button-dark" onClick={startNew}>Add {isProject ? 'project' : 'competition'} <span>＋</span></button></div></div>
    {notice && <div className="admin-notice" role="status">✳ &nbsp;{notice}</div>}{error && !formOpen && <div className="admin-error" role="alert">{error} <button onClick={loadItems}>Try again</button></div>}
    <section className="admin-table-section"><div className="record-tabs"><button className={isProject ? 'active' : ''} onClick={() => setKind('projects')}>Projects</button><button className={!isProject ? 'active' : ''} onClick={() => setKind('competitions')}>Competitions</button><span className="listing-tab-count">{items.length} listings</span></div>
      {formOpen && <div className="listing-editor"><div className="editor-heading"><div><span className="eyebrow">{editingId ? 'EDIT LISTING' : 'NEW LISTING'}</span><h2>{editingId ? 'Update listing' : `Create ${isProject ? 'a project' : 'a competition'}`}</h2></div><button className="editor-close" aria-label="Close editor" onClick={() => setFormOpen(false)}>×</button></div>{error && <div className="admin-error" role="alert">{error}</div>}
        <form onSubmit={saveItem}><div className="editor-grid listing-editor-grid"><label>Title<input required maxLength="120" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><label>URL slug<input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="Generated from title if blank" /></label>
          {isProject ? <><label>Category<input required maxLength="80" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Full-stack Web Development" /></label><label>Skills<input value={form.skills} onChange={(event) => setForm({ ...form, skills: event.target.value })} placeholder="React, Node.js, MongoDB" /><small>Separate up to 12 skills with commas.</small></label><label className="editor-wide">Project description<textarea required maxLength="1200" rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><label className="editor-wide">Contribution opportunities<input maxLength="240" value={form.opportunities} onChange={(event) => setForm({ ...form, opportunities: event.target.value })} placeholder="Frontend, backend, and design contributors" /></label></> : <><label>Registration deadline<input type="date" value={form.deadline || ''} onChange={(event) => setForm({ ...form, deadline: event.target.value })} /></label><label className="editor-wide">Competition description<textarea required maxLength="1200" rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><label className="editor-wide">Eligibility criteria<textarea required maxLength="300" rows="2" value={form.eligibility} onChange={(event) => setForm({ ...form, eligibility: event.target.value })} /></label><label className="editor-wide">Registration details<textarea maxLength="500" rows="2" value={form.registrationDetails} onChange={(event) => setForm({ ...form, registrationDetails: event.target.value })} /></label></>}
          <label className="active-label"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Show this listing to students</label></div><div className="editor-actions"><button type="button" className="small-outline" onClick={() => setFormOpen(false)}>Cancel</button><button className="button button-dark" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : `Create ${isProject ? 'project' : 'competition'}`} <span>↗</span></button></div></form>
      </div>}
      {loading ? <div className="admin-empty">Loading listings…</div> : items.length === 0 ? <div className="admin-empty"><span>✳</span><b>No {kind} are listed yet.</b><p>Create your first listing for students.</p><button className="small-outline" onClick={startNew}>Add {isProject ? 'project' : 'competition'}</button></div> : <div className="admin-career-list">{items.map((item) => <article className={`admin-career-row ${item.active ? '' : 'is-inactive'}`} key={item._id}><span className={`admin-career-icon ${isProject ? 'lilac' : 'peach'}`}>{isProject ? '◈' : '✳'}</span><div className="admin-career-info"><div className="admin-career-title"><h3>{item.title}</h3><span className={`status-badge ${item.active ? 'live' : 'hidden'}`}>{item.active ? 'Live' : 'Hidden'}</span></div><p>{isProject ? `${item.category} · ${item.skills?.length || 0} skills` : `${item.deadline ? `Deadline ${new Date(item.deadline).toLocaleDateString()}` : 'No deadline set'}`} · {item.enrollmentCount || 0} enrollment requests</p><small>/{item.slug}</small></div><div className="admin-row-actions"><button onClick={() => startEdit(item)}>Edit</button><button onClick={() => toggleActive(item)}>{item.active ? 'Hide' : 'Publish'}</button><button className="delete-action" onClick={() => removeItem(item)}>Delete</button></div></article>)}</div>}
    </section><div className="admin-signed-in">Signed in as {user.name} <span>·</span> Admin</div>
  </div></main>;
}
