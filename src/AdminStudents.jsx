import { useCallback, useEffect, useState } from 'react';

async function adminRequest(path, options = {}, token) {
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'The request could not be completed.');
  return data;
}

export default function AdminStudents({ user }) {
  const [students, setStudents] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [credential, setCredential] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await adminRequest(`/api/admin/students${search ? `?search=${encodeURIComponent(search)}` : ''}`, {}, user.token);
      setStudents(data.students);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [search, user.token]);
  useEffect(() => { load(); }, [load]);

  async function toggle(student) {
    setBusyId(student._id); setError(''); setNotice('');
    try {
      await adminRequest(`/api/admin/students/${student._id}/status`, { method: 'PATCH', body: JSON.stringify({ active: !student.active }) }, user.token);
      setNotice(`${student.name}’s account is now ${student.active ? 'deactivated' : 'active'}.`);
      await load();
    } catch (err) { setError(err.message); }
    finally { setBusyId(''); }
  }

  async function resetPassword(student) {
    setBusyId(student._id); setError(''); setNotice(''); setCredential(null);
    try {
      const data = await adminRequest(`/api/admin/students/${student._id}/password-reset`, { method: 'POST' }, user.token);
      setCredential(data);
      setNotice(`Temporary password created for ${student.name}. Share it privately; it will only be shown here once.`);
    } catch (err) { setError(err.message); }
    finally { setBusyId(''); }
  }

  async function copyCredential() {
    try { await navigator.clipboard.writeText(credential.temporaryPassword); setNotice('Temporary password copied. Share it privately with the student.'); }
    catch { setNotice('Copy was unavailable. Select and copy the temporary password below.'); }
  }

  return <main className="admin-page"><div className="admin-wrap">
    <div className="admin-breadcrumb"><a href="/admin">ADMIN WORKSPACE</a><i>›</i><b>Students</b></div>
    <div className="admin-heading"><div><span className="eyebrow">ACCOUNT MANAGEMENT</span><h1>Students</h1><p>Find student accounts and manage their access to the portal.</p></div><a href="/admin/mentors" className="small-outline">Manage mentors ↗</a></div>
    {error && <div className="admin-error" role="alert">{error} <button onClick={load}>Try again</button></div>}
    {notice && <div className="admin-notice" role="status">{notice}</div>}
    <section className="admin-table-card"><div className="admin-table-heading"><div><span className="eyebrow">STUDENT ACCOUNTS</span><h2>{loading ? 'Loading students…' : `${students.length} ${students.length === 1 ? 'student' : 'students'}`}</h2></div><form className="student-search" onSubmit={(event) => { event.preventDefault(); setSearch(searchInput.trim()); }}><input aria-label="Search students" placeholder="Search name or email" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} /><button className="small-outline">Search</button>{search && <button type="button" className="small-outline" onClick={() => { setSearchInput(''); setSearch(''); }}>Clear</button>}</form></div>
      {loading ? <div className="admin-empty">Loading student accounts…</div> : students.length ? <div className="admin-student-list">{students.map((student) => <article className={`admin-student-row ${student.active ? '' : 'is-inactive'}`} key={student._id}><div className="admin-student-avatar">{student.name?.[0]?.toUpperCase() || 'S'}</div><div className="admin-student-info"><div className="admin-student-name"><b>{student.name}</b><span className={`status-badge ${student.active ? 'live' : 'hidden'}`}>{student.active ? 'Active' : 'Inactive'}</span></div><p>{student.email}</p><small>{student.createdBy ? `Added by ${student.createdBy.name} · ${student.createdBy.email}` : 'Account created by an administrator'} · Joined {new Date(student.createdAt).toLocaleDateString()}</small></div><div className="admin-student-actions"><button className="small-outline" disabled={busyId === student._id} onClick={() => resetPassword(student)}>{busyId === student._id ? 'Working…' : 'Reset password'}</button><button className="small-outline" disabled={busyId === student._id} onClick={() => toggle(student)}>{student.active ? 'Deactivate' : 'Activate'}</button></div></article>)}</div> : <div className="admin-empty">{search ? 'No student accounts match that search.' : 'No student accounts have been created yet. Mentors can register students from their portal.'}</div>}
      {credential && <div className="student-credential"><div><b>Temporary password for {credential.student.name}</b><p>Share it privately. The student must choose a new password when they sign in.</p></div><code>{credential.temporaryPassword}</code><button className="small-outline" onClick={copyCredential}>Copy password</button><button className="small-outline" onClick={() => setCredential(null)}>Dismiss</button></div>}
    </section><div className="admin-signed-in">Signed in as {user.name}<span>·</span>Admin</div>
  </div></main>;
}
