import { useCallback, useEffect, useState } from 'react';

const emptyResource = () => ({ type: 'video', title: '', description: '', duration: '', url: '' });
const emptyPhase = () => ({ title: '', duration: '', resources: [emptyResource()] });
const emptyCareer = () => ({ name: '', slug: '', description: '', category: 'Technology', tag: 'LEARNING PATH', icon: '✳', color: 'lilac', estimatedWeeks: 6, active: true, phases: [emptyPhase()] });

async function adminRequest(path, options = {}) {
  let savedUser;
  try { savedUser = JSON.parse(localStorage.getItem('portalUser') || 'null'); } catch { savedUser = null; }
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(savedUser?.token ? { Authorization: `Bearer ${savedUser.token}` } : {}), ...options.headers },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || 'The request could not be completed.');
  return body;
}

export default function AdminCareers({ user }) {
  const [careers, setCareers] = useState([]);
  const [form, setForm] = useState(emptyCareer);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadCareers = useCallback(async () => {
    setLoading(true);
    try { const data = await adminRequest('/api/admin/careers'); setCareers(data.careers); setError(''); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadCareers(); }, [loadCareers]);

  function startNew() { setEditingId(null); setForm(emptyCareer()); setError(''); setNotice(''); setFormOpen(true); }
  function startEdit(career) {
    setEditingId(career._id);
    setForm({ ...career, phases: career.phases.map((phase) => ({ ...phase, resources: phase.resources.map((resource) => ({ ...resource })) })) });
    setError(''); setNotice(''); setFormOpen(true);
  }
  function updatePhase(index, key, value) {
    setForm((current) => ({ ...current, phases: current.phases.map((phase, i) => i === index ? { ...phase, [key]: value } : phase) }));
  }
  function updateResource(phaseIndex, resourceIndex, key, value) {
    setForm((current) => ({ ...current, phases: current.phases.map((phase, i) => i === phaseIndex ? {
      ...phase, resources: phase.resources.map((resource, j) => j === resourceIndex ? { ...resource, [key]: value } : resource),
    } : phase) }));
  }
  async function saveCareer(event) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    const url = editingId ? `/api/admin/careers/${editingId}` : '/api/admin/careers';
    try {
      await adminRequest(url, { method: editingId ? 'PUT' : 'POST', body: JSON.stringify({ ...form, estimatedWeeks: Number(form.estimatedWeeks) }) });
      await loadCareers(); setNotice(editingId ? 'Learning path updated.' : 'Learning path created.'); setFormOpen(false);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }
  async function toggleActive(career) {
    setError(''); setNotice('');
    try {
      await adminRequest(`/api/admin/careers/${career._id}/status`, { method: 'PATCH', body: JSON.stringify({ active: !career.active }) });
      await loadCareers(); setNotice(`${career.name} is now ${career.active ? 'hidden' : 'live'}.`);
    } catch (err) { setError(err.message); }
  }
  async function deleteCareer(career) {
    if (!window.confirm(`Delete “${career.name}” and its roadmap? This cannot be undone.`)) return;
    setError(''); setNotice('');
    try {
      await adminRequest(`/api/admin/careers/${career._id}`, { method: 'DELETE' });
      await loadCareers(); setNotice('Learning path deleted.');
    } catch (err) { setError(err.message); }
  }

  return <main className="admin-page"><div className="admin-wrap">
    <div className="admin-breadcrumb"><span>ADMIN WORKSPACE</span><i>›</i><b>Learning paths</b></div>
    <div className="admin-heading"><div><span className="eyebrow">CONTENT MANAGEMENT</span><h1>Learning paths</h1><p>Shape the roadmaps students use to explore what’s next.</p></div><div className="admin-heading-actions"><a href="/admin/opportunities" className="small-outline">Projects & competitions ↗</a><a href="/admin/applicants" className="small-outline">Review enrollments ↗</a><a href="/admin/mentor-records" className="small-outline">Mentor records ↗</a><button className="button button-dark" onClick={startNew}>Add a learning path <span>＋</span></button></div></div>
    {notice && <div className="admin-notice" role="status">✳ &nbsp;{notice}</div>}
    {error && !formOpen && <div className="admin-error" role="alert">{error} <button onClick={loadCareers}>Try again</button></div>}
    {formOpen && <section className="admin-editor"><div className="editor-heading"><div><span className="eyebrow">{editingId ? 'EDIT CONTENT' : 'NEW CONTENT'}</span><h2>{editingId ? 'Update learning path' : 'Create a learning path'}</h2></div><button className="editor-close" type="button" onClick={() => { setFormOpen(false); setError(''); }} aria-label="Close editor">×</button></div>
      {error && <div className="admin-error" role="alert">{error}</div>}
      <form onSubmit={saveCareer}>
        <div className="editor-grid"><label>Path name<input required maxLength="100" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Full-stack development" /></label><label>URL slug<input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Generated from path name if blank" /></label><label>Category<input required maxLength="50" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Technology" /></label><label>Card label<input maxLength="32" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="MOST POPULAR" /></label><label>Estimated weeks<input type="number" min="1" max="104" required value={form.estimatedWeeks} onChange={(e) => setForm({ ...form, estimatedWeeks: e.target.value })} /></label><label>Card color<select value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}><option value="lilac">Lilac</option><option value="peach">Peach</option><option value="mint">Mint</option><option value="blue">Blue</option></select></label><label>Card symbol<input maxLength="8" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} /></label><label className="active-label"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Show this path to students</label><label className="editor-wide">Short description<textarea required maxLength="500" rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What will students explore in this path?" /></label></div>
        <div className="phase-editor-heading"><div><span className="eyebrow">THE ROADMAP</span><p>Add ordered phases and useful learning resources.</p></div><button type="button" className="small-outline" onClick={() => setForm((current) => ({ ...current, phases: [...current.phases, emptyPhase()] }))}>＋ Add phase</button></div>
        <div className="admin-phase-list">{form.phases.map((phase, phaseIndex) => <article className="admin-phase" key={phase._id || phaseIndex}><div className="admin-phase-top"><span className="phase-number">{String(phaseIndex + 1).padStart(2, '0')}</span><label>Phase name<input required value={phase.title} onChange={(e) => updatePhase(phaseIndex, 'title', e.target.value)} placeholder="e.g. Get comfortable with the web" /></label><label>Duration<input value={phase.duration} onChange={(e) => updatePhase(phaseIndex, 'duration', e.target.value)} placeholder="2 weeks" /></label><button type="button" className="remove-control" onClick={() => setForm((current) => ({ ...current, phases: current.phases.filter((_, i) => i !== phaseIndex) }))} aria-label={`Remove phase ${phaseIndex + 1}`}>Remove phase</button></div>
            <div className="admin-resource-list">{phase.resources.map((resource, resourceIndex) => <div className="admin-resource" key={resource._id || resourceIndex}><label>Type<select value={resource.type} onChange={(e) => updateResource(phaseIndex, resourceIndex, 'type', e.target.value)}><option value="video">Video</option><option value="guide">Notes / guide</option><option value="project">Code / project</option><option value="code">Code</option><option value="other">Other</option></select></label><label>Resource title<input required value={resource.title} onChange={(e) => updateResource(phaseIndex, resourceIndex, 'title', e.target.value)} placeholder="Lesson or resource name" /></label><label>Duration<input value={resource.duration} onChange={(e) => updateResource(phaseIndex, resourceIndex, 'duration', e.target.value)} placeholder="20 min" /></label><label className="resource-url">Link URL<input type="url" value={resource.url} onChange={(e) => updateResource(phaseIndex, resourceIndex, 'url', e.target.value)} placeholder="https://…" /></label><label className="resource-description">Short note<input value={resource.description} onChange={(e) => updateResource(phaseIndex, resourceIndex, 'description', e.target.value)} placeholder="What is this resource about?" /></label><button type="button" className="remove-control resource-remove" onClick={() => updatePhase(phaseIndex, 'resources', phase.resources.filter((_, i) => i !== resourceIndex))}>Remove</button></div>)}</div>
            <button type="button" className="add-resource" onClick={() => updatePhase(phaseIndex, 'resources', [...phase.resources, emptyResource()])}>＋ Add resource</button>
          </article>)}</div>
        <div className="editor-actions"><button type="button" className="small-outline" onClick={() => { setFormOpen(false); setError(''); }}>Cancel</button><button className="button button-dark" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Create learning path'} <span>↗</span></button></div>
      </form>
    </section>}
    <section className="admin-table-section"><div className="admin-table-heading"><div><h2>All learning paths</h2><p>{careers.length} {careers.length === 1 ? 'path' : 'paths'} in your library</p></div><span className="admin-table-status"><i /> {careers.filter((career) => career.active).length} live</span></div>
      {loading ? <div className="admin-empty">Loading learning paths…</div> : careers.length === 0 ? <div className="admin-empty"><span>✳</span><b>Your learning library is ready for its first path.</b><p>Create a path and add phases and resources for students.</p><button className="small-outline" onClick={startNew}>Create a learning path</button></div> : <div className="admin-career-list">{careers.map((career) => <article className={`admin-career-row ${career.active ? '' : 'is-inactive'}`} key={career._id}><span className={`admin-career-icon ${career.color}`}>{career.icon}</span><div className="admin-career-info"><div className="admin-career-title"><h3>{career.name}</h3><span className={`status-badge ${career.active ? 'live' : 'hidden'}`}>{career.active ? 'Live' : 'Hidden'}</span></div><p>{career.category} <i>·</i> {career.phases.length} phases <i>·</i> {career.phases.reduce((n, phase) => n + phase.resources.length, 0)} resources <i>·</i> {career.estimatedWeeks} weeks</p><small>/{career.slug}</small></div><div className="admin-row-actions"><button onClick={() => startEdit(career)}>Edit</button><button onClick={() => toggleActive(career)}>{career.active ? 'Hide' : 'Publish'}</button><button className="delete-action" onClick={() => deleteCareer(career)}>Delete</button></div></article>)}</div>}
    </section>
    <div className="admin-signed-in">Signed in as {user.name} <span>·</span> Admin</div>
  </div></main>;
}
