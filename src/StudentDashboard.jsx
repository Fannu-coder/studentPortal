import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function StudentDashboard({ user }) {
  const [paths, setPaths] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const headers = { Authorization: `Bearer ${user.token}` };
    Promise.all([
      fetch('/api/progress/mine', { headers }).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Could not load learning progress.'); return data.learningPaths || []; }),
      fetch('/api/enrollments/mine', { headers }).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Could not load applications.'); return data.enrollments || []; }),
    ]).then(([learningPaths, enrollments]) => { if (!cancelled) { setPaths(learningPaths); setApplications(enrollments); } })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user.token]);

  const totalCompleted = paths.reduce((total, path) => total + path.completedLessons, 0);
  const totalLessons = paths.reduce((total, path) => total + path.totalLessons, 0);
  const recentApplications = applications.slice(0, 3);

  return <main className="student-dashboard-page"><div className="student-dashboard-wrap">
    <div className="breadcrumbs"><Link to="/">Discover</Link><span>›</span><b>My learning</b></div>
    <section className="student-dashboard-welcome"><div><span className="eyebrow"><span className="eyebrow-spark">✳</span> YOUR SPACE</span><h1>Good to have you back, {user.name?.split(' ')[0] || 'learner'}.</h1><p>Pick up a lesson, explore a new path, or check on an application.</p></div><Link className="button button-dark" to="/#paths">Explore paths <span>↗</span></Link></section>
    {error && <div className="admin-error" role="alert">{error}</div>}
    <section className="student-dashboard-summary" aria-label="Your learning summary"><article><span>LESSONS COMPLETED</span><b>{loading ? '—' : totalCompleted}</b><small>{loading ? 'Loading your progress' : `Across ${paths.length} learning paths`}</small></article><article><span>LESSONS AVAILABLE</span><b>{loading ? '—' : totalLessons}</b><small>Keep moving at your own pace</small></article><article><span>APPLICATIONS SENT</span><b>{loading ? '—' : applications.length}</b><small><Link to="/my-applications">View application updates ↗</Link></small></article></section>
    <div className="student-dashboard-columns"><section className="student-learning-panel"><div className="student-panel-heading"><div><span className="eyebrow">KEEP GOING</span><h2>Your learning paths</h2></div><Link to="/#paths">Explore all ↗</Link></div>
      {loading ? <div className="student-dashboard-empty">Loading your learning paths…</div> : paths.length ? <div className="student-path-list">{paths.map((path) => { const percent = path.totalLessons ? Math.round(path.completedLessons / path.totalLessons * 100) : 0; return <article className="student-path-card" key={path.slug}><div className={`student-path-icon ${path.color}`}>✳</div><div className="student-path-info"><div className="student-path-heading"><div><h3>{path.name}</h3><p>{path.completedLessons} of {path.totalLessons} lessons complete</p></div><b>{percent}%</b></div><div className="student-progress-track"><span style={{ width: `${percent}%` }} /></div><Link to={`/roadmap/${path.slug}`}>{path.completedLessons ? 'Continue learning' : 'Start this path'} <span>↗</span></Link></div></article>; })}</div> : <div className="student-dashboard-empty">No active learning paths are available right now. Check back soon.</div>}
    </section><aside className="student-applications-panel"><div className="student-panel-heading"><div><span className="eyebrow">WHAT’S NEXT</span><h2>Applications</h2></div><Link to="/my-applications">All ↗</Link></div>
      {loading ? <div className="student-dashboard-empty">Loading updates…</div> : recentApplications.length ? <div className="student-recent-applications">{recentApplications.map((application) => <article key={application._id}><span className={`applicant-type ${application.targetType}`}>{application.targetType === 'project' ? 'PROJECT' : 'COMPETITION'}</span><h3>{application.targetTitle}</h3><span className={`status-badge ${application.status === 'selected' ? 'live' : application.status === 'pending' ? 'pending' : 'hidden'}`}>{application.status === 'declined' ? 'Not selected' : application.status === 'pending' ? 'In review' : 'Selected'}</span></article>)}</div> : <div className="student-dashboard-empty"><span>✳</span><b>No applications yet</b><p>Find a project or competition that interests you.</p><Link to="/projects">Explore opportunities ↗</Link></div>}
    </aside></div>
  </div></main>;
}
