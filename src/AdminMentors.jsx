import { useCallback, useEffect, useState } from 'react';

async function adminRequest(path, options = {}) {
  let user;
  try { user = JSON.parse(localStorage.getItem('portalUser') || 'null'); } catch { user = null; }
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}), ...options.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'The request could not be completed.');
  return data;
}

const emptyForm = () => ({ name: '', email: '' });

export default function AdminMentors({ user }) {
  const [mentors, setMentors] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [credential, setCredential] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadMentors = useCallback(async () => {
    setLoading(true); setError('');
    try { const data = await adminRequest('/api/admin/mentors'); setMentors(data.mentors); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadMentors(); }, [loadMentors]);

  function startNew() { setEditingId(null); setForm(emptyForm()); setError(''); setNotice(''); setFormOpen(true); }
  function startEdit(mentor) { setEditingId(mentor._id); setForm({ name: mentor.name, email: mentor.email }); setError(''); setNotice(''); setFormOpen(true); }
  async function save(event) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      const response = await adminRequest(`/api/admin/mentors${editingId ? `/${editingId}` : ''}`, { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(form) });
      await loadMentors(); setFormOpen(false);
      if (response.temporaryPassword) { setCredential(response); setNotice('Mentor account created. Copy the temporary password to share privately.'); }
      else setNotice('Mentor details updated.');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }
  async function toggle(mentor) {
    setError(''); setNotice('');
    try {
      await adminRequest(`/api/admin/mentors/${mentor._id}/status`, { method: 'PATCH', body: JSON.stringify({ active: !mentor.active }) });
      await loadMentors(); setNotice(`${mentor.name} is now ${mentor.active ? 'deactivated' : 'active'}.`);
    } catch (err) { setError(err.message); }
  }
  async function copyPassword() {
    try { await navigator.clipboard.writeText(credential.temporaryPassword); setNotice('Temporary password copied. Share it privately with the mentor.'); }
    catch { setNotice('Copy was unavailable. Select and copy the temporary password below.'); }
  }

  const activeCount = mentors.filter((mentor) => mentor.active).length;
  const closeEditor = () => { setFormOpen(false); setError(''); };
  return <main className="admin-page"><div className="admin-wrap">
    <div className="admin-breadcrumb"><span>ADMIN WORKSPACE</span><i>›</i><b>Mentors</b></div>
    <div className="admin-heading"><div><span className="eyebrow">TEAM MANAGEMENT</span><h1>Mentors</h1><p>Manage mentor accounts and see the students in each mentor’s roster.</p></div><div className="admin-heading-actions"><a href="/admin/opportunities" className="small-outline">Projects & competitions ↗</a><button className="button button-dark" onClick={startNew}>Add a mentor <span>＋</span></button></div></div>
    {notice && <div className="admin-notice" role="status">✳ &nbsp;{notice}</div>}{error && !formOpen && <div className="admin-error" role="alert">{error} <button onClick={loadMentors}>Try again</button></div>}
    {formOpen && <section className="admin-editor mentor-editor"><div className="editor-heading"><div><span className="eyebrow">{editingId ? 'ACCOUNT DETAILS' : 'NEW TEAM MEMBER'}</span><h2>{editingId ? 'Update mentor details' : 'Create a mentor account'}</h2></div><button className="editor-close" aria-label="Close form" onClick={closeEditor}>×</button></div>{error && <div className="admin-error" role="alert">{error}</div>}<form onSubmit={save}><div className="editor-grid mentor-edit-grid"><label>Name<input required minLength="2" maxLength="100" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Email address<input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label></div>{!editingId && <p className="mentor-temp-note">A random temporary password will be shown once after account creation. The mentor must choose a private password at first sign-in.</p>}<div className="editor-actions"><button type="button" className="small-outline" onClick={closeEditor}>Cancel</button><button className="button button-dark" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Create account'} <span>↗</span></button></div></form></section>}
    <section className="admin-table-section"><div className="admin-table-heading"><div><h2>Mentor accounts</h2><p>{mentors.length} total <i>·</i> {activeCount} active</p></div><span className="admin-table-status"><i /> Team directory</span></div>
      {loading ? <div className="admin-empty">Loading mentors…</div> : mentors.length === 0 ? <div className="admin-empty"><span>◎</span><b>No mentors have been added yet.</b><p>Create a mentor account to start building the team.</p><button className="small-outline" onClick={startNew}>Add a mentor</button></div> : <div className="admin-career-list">{mentors.map((mentor) => <article className={`admin-career-row ${mentor.active ? '' : 'is-inactive'}`} key={mentor._id}><span className="admin-career-icon mint">◎</span><div className="admin-career-info"><div className="admin-career-title"><h3>{mentor.name}</h3><span className={`status-badge ${mentor.active ? 'live' : 'hidden'}`}>{mentor.active ? 'Active' : 'Inactive'}</span></div><p><a href={`mailto:${mentor.email}`}>{mentor.email}</a> <i>·</i> {mentor.studentCount} {mentor.studentCount === 1 ? 'student' : 'students'} registered</p><small>Joined {new Date(mentor.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</small></div><div className="admin-row-actions"><button onClick={() => startEdit(mentor)}>Edit details</button><button className={mentor.active ? 'delete-action' : ''} onClick={() => toggle(mentor)}>{mentor.active ? 'Deactivate' : 'Activate'}</button></div></article>)}</div>}
    </section><div className="admin-signed-in">Signed in as {user.name} <span>·</span> Admin</div>
  </div>
  {credential && <div className="enrollment-overlay"><section className="enrollment-modal credential-modal" role="dialog" aria-modal="true" aria-labelledby="mentor-credential-heading"><span className="credential-symbol">✓</span><span className="eyebrow">MENTOR ACCOUNT CREATED</span><h2 id="mentor-credential-heading">Share the temporary password.</h2><p className="enrollment-intro">For {credential.mentor.name} · {credential.mentor.email}. This password is shown once. Share it privately.</p><label>Temporary password<code>{credential.temporaryPassword}</code></label><div className="enrollment-form-actions"><button className="small-outline" onClick={() => setCredential(null)}>Done</button><button className="button button-dark" onClick={copyPassword}>Copy password <span>▣</span></button></div></section></div>}
  </main>;
}
