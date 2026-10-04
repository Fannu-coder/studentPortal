import { useEffect, useMemo, useState } from 'react';

async function portalRequest(path, options = {}) {
  let user;
  try { user = JSON.parse(localStorage.getItem('portalUser') || 'null'); } catch { user = null; }
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}), ...options.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'The request could not be completed.');
  return data;
}

export default function Opportunities({ kind, user }) {
  const isProject = kind === 'project';
  const [items, setItems] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState(null);
  const [email, setEmail] = useState(user?.email || '');
  const [skills, setSkills] = useState('');
  const [motivation, setMotivation] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    const listingPath = isProject ? '/api/projects' : '/api/competitions';
    Promise.all([
      fetch(listingPath).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.message); return data; }),
      user?.role === 'student' ? portalRequest('/api/enrollments/mine').catch(() => ({ enrollments: [] })) : Promise.resolve({ enrollments: [] }),
    ]).then(([list, mine]) => {
      if (cancelled) return;
      setItems(isProject ? list.projects : list.competitions);
      setEnrollments(mine.enrollments.filter((item) => item.targetType === kind));
    }).catch((err) => { if (!cancelled) setError(err.message || 'Could not load opportunities.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isProject, kind, user?.role]);

  const categories = useMemo(() => ['All', ...new Set(items.map((item) => item.category).filter(Boolean))], [items]);
  const filtered = category === 'All' ? items : items.filter((item) => item.category === category);
  const existing = (item) => enrollments.find((enrollment) => enrollment.target === item._id);

  function openForm(item) {
    if (user?.role !== 'student') { setError('Sign in as a student to send an enrollment request.'); return; }
    setSelected(item); setEmail(user.email || ''); setSkills(''); setMotivation(''); setError(''); setNotice('');
  }
  async function submitEnrollment(event) {
    event.preventDefault(); if (!selected) return;
    setSubmitting(true); setError('');
    try {
      const data = await portalRequest('/api/enrollments', { method: 'POST', body: JSON.stringify({ targetType: kind, targetId: selected._id, contactEmail: email, skills, motivation }) });
      setEnrollments((current) => [data.enrollment, ...current]); setSelected(null); setNotice(`Your request for ${selected.title} has been sent for review.`);
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  }

  return <main className="opportunities-page"><div className="opportunities-wrap">
    <div className="opportunities-hero"><div><span className="eyebrow"><span className="eyebrow-spark">✳</span> {isProject ? 'MAKE SOMETHING REAL' : 'A CHANCE TO SHOW WHAT YOU CAN DO'}</span><h1>{isProject ? <>Build with a team.<br /><span>Learn by doing.</span></> : <>A little challenge.<br /><span>A lot of possibility.</span></>}</h1><p>{isProject ? 'Find a project that fits what you’re learning, and meet people to build it with.' : 'Explore friendly challenges designed for curious people at every stage.'}</p></div><div className={`opportunities-art ${isProject ? 'project-art' : 'competition-art'}`}><span>{isProject ? '◈' : '✳'}</span><i>✧</i><b>{isProject ? 'IDEAS GROW WHEN YOU BUILD' : 'GIVE YOUR CURIOSITY A GO'}</b></div></div>
    <div className="opportunities-heading"><div><span className="eyebrow">{isProject ? 'OPEN PROJECTS' : 'UPCOMING COMPETITIONS'}</span><h2>{isProject ? 'Find your kind of project.' : 'Find a challenge that excites you.'}</h2><p>{isProject ? 'Real practice, good people, and room to learn as you go.' : 'Read the details, then send an interest request to the team.'}</p></div>{isProject && categories.length > 1 && <label className="category-select">Browse by <select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((value) => <option key={value}>{value}</option>)}</select></label>}</div>
    {notice && <div className="opportunity-notice" role="status">✳ &nbsp;{notice}</div>}{error && !selected && <div className="opportunity-error" role="alert">{error}</div>}
    {loading ? <div className="opportunity-empty">Finding opportunities…</div> : filtered.length === 0 ? <div className="opportunity-empty"><span>✳</span><b>Nothing listed here just yet.</b><p>Check back soon for new opportunities.</p></div> : <div className="opportunity-grid">{filtered.map((item, index) => {
      const enrollment = existing(item);
      const deadlinePassed = !isProject && item.deadline && new Date(item.deadline) < new Date();
      return <article className="opportunity-card" key={item._id}><div className={`opportunity-card-art tone-${index % 4}`}><span className="opportunity-card-index">{String(index + 1).padStart(2, '0')}</span><span className="opportunity-card-glyph">{isProject ? ['◈', '⌘', '⬡', '✳'][index % 4] : ['✳', '◈'][index % 2]}</span><span className="opportunity-card-type">{isProject ? item.category : deadlinePassed ? 'CLOSED' : 'REGISTRATION OPEN'}</span></div><div className="opportunity-card-content"><h3>{item.title}</h3><p>{item.description}</p>{isProject && item.skills?.length > 0 && <div className="skill-tags">{item.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>}<div className="opportunity-details">{isProject ? <><div><small>LOOKING FOR</small><b>{item.opportunities || 'Contributors across a range of skills'}</b></div><div><small>SKILLS TO EXPLORE</small><b>{item.skills?.slice(0, 3).join(' · ') || 'All skill levels welcome'}</b></div></> : <><div><small>WHO CAN JOIN</small><b>{item.eligibility}</b></div><div><small>DEADLINE</small><b>{item.deadline ? new Date(item.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'To be announced'}</b></div></>}</div>{!isProject && item.registrationDetails && <p className="registration-note">{item.registrationDetails}</p>}{enrollment ? <div className={`enrollment-status status-${enrollment.status}`}>Request {enrollment.status}</div> : <button className="button button-dark opportunity-enroll" disabled={deadlinePassed} onClick={() => openForm(item)}>{deadlinePassed ? 'Registration closed' : isProject ? 'I’d like to contribute' : 'Register your interest'} <span>↗</span></button>}</div></article>;
    })}</div>}
  </div>
  {selected && <div className="enrollment-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><section className="enrollment-modal" role="dialog" aria-modal="true" aria-labelledby="enrollment-title"><button className="editor-close" aria-label="Close enrollment form" onClick={() => setSelected(null)}>×</button><span className="eyebrow">{isProject ? 'PROJECT ENROLLMENT' : 'COMPETITION REGISTRATION'}</span><h2 id="enrollment-title">Tell us what interests you.</h2><p className="enrollment-intro">Request to join <b>{selected.title}</b>. The team will review your details and follow up.</p><form onSubmit={submitEnrollment}><label>Contact email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Skills or experience <span>(optional)</span><input maxLength="500" value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="A few things you’ve tried or want to learn" /></label><label>Why would you like to join?<textarea required minLength="20" maxLength="1200" rows="4" value={motivation} onChange={(event) => setMotivation(event.target.value)} placeholder="Share what interests you and what you’d like to contribute…" /></label>{error && <div className="opportunity-error" role="alert">{error}</div>}<div className="enrollment-form-actions"><button type="button" className="small-outline" onClick={() => setSelected(null)}>Cancel</button><button className="button button-dark" disabled={submitting}>{submitting ? 'Sending…' : 'Send request'} <span>↗</span></button></div><small className="privacy-hint">Your request is shared with the portal admin for review.</small></form></section></div>}
  </main>;
}
