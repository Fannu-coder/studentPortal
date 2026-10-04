import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import AdminCareers from './AdminCareers.jsx';
import AdminApplicants from './AdminApplicants.jsx';
import Opportunities from './Opportunities.jsx';
import MentorPortal from './MentorPortal.jsx';
import ChangePassword from './ChangePassword.jsx';
import AdminMentorRecords from './AdminMentorRecords.jsx';
import AdminOpportunities from './AdminOpportunities.jsx';
import AdminMentors from './AdminMentors.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import MyApplications from './MyApplications.jsx';
import StudentDashboard from './StudentDashboard.jsx';
import AdminStudents from './AdminStudents.jsx';
import Contact from './Contact.jsx';
import AdminContact from './AdminContact.jsx';

const fields = [
  { id: 'full-stack', name: 'Full-stack development', tag: 'MOST POPULAR', icon: '◈', color: 'lilac', lessons: '24 lessons', time: '8 weeks', description: 'Build complete web experiences, from your first component to a live product.' },
  { id: 'data-science', name: 'Data science', tag: 'IN DEMAND', icon: '⌘', color: 'peach', lessons: '18 lessons', time: '6 weeks', description: 'Make sense of data with Python, visualisation and practical machine learning.' },
  { id: 'cyber-security', name: 'Cyber security', tag: 'GROWING FAST', icon: '⬡', color: 'mint', lessons: '20 lessons', time: '7 weeks', description: 'Learn the principles and tools behind safer systems and networks.' },
  { id: 'product-design', name: 'Product design', tag: 'CREATIVE', icon: '✳', color: 'blue', lessons: '16 lessons', time: '5 weeks', description: 'Turn thoughtful research and clear ideas into useful digital products.' },
];

const roadmap = [
  { title: 'Get comfortable with the web', duration: '2 WEEKS', lessons: [
    { kind: 'WATCH', title: 'How the web works', meta: 'Video · 18 min' },
    { kind: 'READ', title: 'HTML & CSS foundations', meta: 'Guide · 25 min' },
    { kind: 'BUILD', title: 'Your first responsive page', meta: 'Hands-on project · 45 min' },
  ] },
  { title: 'Build with JavaScript', duration: '3 WEEKS', lessons: [
    { kind: 'WATCH', title: 'JavaScript fundamentals', meta: 'Video · 32 min' },
    { kind: 'READ', title: 'Working with the DOM', meta: 'Guide · 20 min' },
    { kind: 'BUILD', title: 'Create an interactive dashboard', meta: 'Hands-on project · 60 min' },
  ] },
  { title: 'Create full-stack apps', duration: '3 WEEKS', lessons: [
    { kind: 'WATCH', title: 'React, APIs & your first backend', meta: 'Video · 40 min' },
    { kind: 'READ', title: 'Databases made approachable', meta: 'Guide · 25 min' },
    { kind: 'BUILD', title: 'Ship a project to your portfolio', meta: 'Capstone · 2 hours' },
  ] },
];

const roles = [
  { id: 'student', label: 'Student', icon: '↗', detail: 'Explore learning paths and projects' },
  { id: 'mentor', label: 'Mentor', icon: '◎', detail: 'Support students on their journey' },
  { id: 'admin', label: 'Admin', icon: '⌘', detail: 'Manage the learning community' },
];

function Brand({ light = false }) {
  return <Link className={`brand${light ? ' brand-light' : ''}`} to="/"><span className="brand-mark"><i /></span><span>GRONIXE<span className="brand-dot">.</span></span></Link>;
}

function App() {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('portalUser')); } catch { return null; } });
  const [loginOpen, setLoginOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  function logout() { localStorage.removeItem('portalUser'); setUser(null); navigate('/'); }
  if (user?.mustChangePassword) return <div className="app-shell"><header className="topbar"><div className="topbar-inner"><Brand /><button className="profile-pill" onClick={logout}>Sign out</button></div></header><ChangePassword user={user} onComplete={(updated) => { localStorage.setItem('portalUser', JSON.stringify(updated)); setUser(updated); navigate('/'); }} /><footer className="footer"><div className="footer-inner"><Brand /><span>Small steps. Big futures.</span><span>© 2026 GRONIXE</span></div></footer></div>;
  return <div className="app-shell">
    <header className="topbar"><div className="topbar-inner"><Brand /><nav className="main-nav" aria-label="Main navigation"><Link to="/">Discover</Link>{user?.role === 'student' && <><Link to="/student">My learning</Link><Link to="/projects">Projects</Link><Link to="/competitions">Competitions</Link></>}{user?.role === 'mentor' && <Link to="/mentor">My students</Link>}{user?.role === 'admin' && <Link to="/admin">Overview</Link>}<Link to="/about">About</Link></nav><div className="nav-actions"><Link className="nav-contact" to="/contact">Contact</Link>{user?.role === 'admin' && <Link className="admin-nav-link" to="/admin">Admin overview</Link>}{user?.role === 'admin' && <Link className="admin-nav-link" to="/admin/opportunities">Listings</Link>}{user?.role === 'admin' && <Link className="admin-nav-link" to="/admin/mentors">Mentors</Link>}{user?.role === 'admin' && <Link className="admin-nav-link" to="/admin/students">Students</Link>}{user?.role === 'admin' && <Link className="admin-nav-link" to="/admin/contact">Inbox</Link>}{user?.role === 'mentor' && <Link className="admin-nav-link" to="/mentor">Mentor portal</Link>}{user ? <button className="profile-pill" onClick={logout}><span className="avatar">{user.name?.[0] || 'J'}</span><span>{user.name || 'Jamie'}</span><span className="chevron">⌄</span></button> : <div className="login-wrap"><button className="login-button" onClick={() => setLoginOpen(!loginOpen)}>Log in <span className="chevron">⌄</span></button>{loginOpen && <div className="login-menu">{roles.map((r) => <Link key={r.id} to={`/login/${r.id}`} onClick={() => setLoginOpen(false)}><span className="menu-icon">{r.icon}</span><span>{r.label}<small>{r.detail}</small></span><b>›</b></Link>)}</div>}</div>}{!user && <Link className="nav-cta" to="/login/student">Get started <span>↗</span></Link>}</div></div></header>
    <Routes><Route path="/" element={<Home user={user} />} /><Route path="/login/:role" element={<Login onLogin={(value) => { localStorage.setItem('portalUser', JSON.stringify(value)); setUser(value); navigate(value.mustChangePassword ? '/change-password' : value.role === 'admin' ? '/admin' : value.role === 'mentor' ? '/mentor' : value.role === 'student' ? location.state?.from || '/student' : '/'); }} />} /><Route path="/change-password" element={user ? <ChangePassword user={user} onComplete={(updated) => { localStorage.setItem('portalUser', JSON.stringify(updated)); setUser(updated); navigate('/'); }} /> : <Navigate to="/login/student" replace />} /><Route path="/mentor" element={user?.role === 'mentor' ? <MentorPortal user={user} /> : <Navigate to="/login/mentor" replace />} /><Route path="/student" element={user?.role === 'student' ? <StudentDashboard user={user} /> : <Navigate to="/login/student" replace />} /><Route path="/projects" element={user?.role === 'student' ? <Opportunities kind="project" user={user} /> : <Navigate to="/login/student" state={{ from: '/projects' }} replace />} /><Route path="/competitions" element={user?.role === 'student' ? <Opportunities kind="competition" user={user} /> : <Navigate to="/login/student" state={{ from: '/competitions' }} replace />} /><Route path="/my-applications" element={user?.role === 'student' ? <MyApplications user={user} /> : <Navigate to="/login/student" state={{ from: '/my-applications' }} replace />} /><Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard user={user} /> : <Navigate to="/login/admin" replace />} /><Route path="/admin/careers" element={user?.role === 'admin' ? <AdminCareers user={user} /> : <Navigate to="/login/admin" replace />} /><Route path="/admin/applicants" element={user?.role === 'admin' ? <AdminApplicants user={user} /> : <Navigate to="/login/admin" replace />} /><Route path="/admin/mentor-records" element={user?.role === 'admin' ? <AdminMentorRecords user={user} /> : <Navigate to="/login/admin" replace />} /><Route path="/admin/opportunities" element={user?.role === 'admin' ? <AdminOpportunities user={user} /> : <Navigate to="/login/admin" replace />} /><Route path="/admin/mentors" element={user?.role === 'admin' ? <AdminMentors user={user} /> : <Navigate to="/login/admin" replace />} /><Route path="/admin/students" element={user?.role === 'admin' ? <AdminStudents user={user} /> : <Navigate to="/login/admin" replace />} /><Route path="/roadmap/:id" element={<Roadmap user={user} />} /><Route path="/contact" element={<Contact user={user} />} /><Route path="/admin/contact" element={user?.role === 'admin' ? <AdminContact user={user} /> : <Navigate to="/login/admin" replace />} /><Route path="/about" element={<About />} /><Route path="*" element={<Home user={user} />} /></Routes>
    <footer className="footer"><div className="footer-inner"><Brand /><span>Small steps. Big futures.</span><span>© 2026 GRONIXE</span></div></footer>
  </div>;
}

function Home({ user }) {
  const [activeTab, setActiveTab] = useState('For you');
  const [careerFields, setCareerFields] = useState([]);
  const [careersLoading, setCareersLoading] = useState(true);
  const [careerError, setCareerError] = useState('');
  useEffect(() => {
    let cancelled = false;
    fetch('/api/careers').then((response) => {
      if (!response.ok) throw new Error('Unable to load learning paths.');
      return response.json();
    }).then((data) => {
      if (!Array.isArray(data.careers)) throw new Error('Invalid learning paths response.');
      if (!cancelled) setCareerFields(data.careers);
    }).catch(() => {
      if (!cancelled) setCareerError('Learning paths could not be loaded. Please try again shortly.');
    }).finally(() => {
      if (!cancelled) setCareersLoading(false);
    });
    return () => { cancelled = true; };
  }, []);
  const visibleFields = careerFields.filter((field) => activeTab === 'Creative' ? field.category === 'Creative' : activeTab === 'Technology' ? field.category === 'Technology' : true);
  const emptyMessage = careersLoading ? 'Loading learning paths…' : careerError || (visibleFields.length === 0 ? careerFields.length ? 'No paths are available in this category.' : 'No learning paths are currently available.' : '');
  return <main><section className="hero"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-spark">✳</span> YOUR NEXT CHAPTER STARTS HERE</div><h1>Find your way.<br /><span>Build your future.</span></h1><p className="hero-lede">The skills, projects, and people to help you turn what you’re curious about into what you do.</p><div className="hero-actions"><a className="button button-dark" href="#paths">Explore learning paths <span>↗</span></a><a className="text-link" href="#how">How it works <span>↓</span></a></div><div className="hero-proof"><div className="avatar-stack"><i>J</i><i>A</i><i>M</i><i>+</i></div><span>Finding their path,<br /><b>one step at a time.</b></span><span className="proof-sep" /><span className="rating">★★★★★<small>Loved by learners</small></span></div></div><div className="hero-art" aria-label="Illustration of a path through a landscape"><div className="art-sun" /><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-stars">✳<span>·</span>✧</div><div className="art-cloud cloud-one" /><div className="art-cloud cloud-two" /><div className="hill hill-back" /><div className="hill hill-mid" /><div className="hill hill-front" /><div className="art-path" /><div className="art-pin"><span>YOU ARE HERE</span><i>✳</i></div><div className="art-note note-top"><span className="note-icon">✦</span><span><b>Curiosity</b><small>is a great place to start</small></span></div><div className="art-note note-bottom"><span className="note-icon green">↗</span><span><b>Your pace, your path</b><small>Little steps add up</small></span></div><div className="art-label">GOOD THINGS TAKE PRACTICE <span>✳</span></div></div><div className="hero-bottom"><span>LEARNING, WITH A LITTLE MORE DIRECTION</span><span className="scroll-cue">SCROLL TO EXPLORE <b>↓</b></span></div></section>
    <section className="paths-section" id="paths"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-spark">✳</span> A GOOD PLACE TO BEGIN</div><h2>{user ? `Welcome back, ${user.name?.split(' ')[0] || 'Jamie'}.` : 'Follow what feels interesting.'}</h2><p>No perfect starting point needed. Pick something that sparks a little curiosity.</p></div><a className="all-link" href="#paths">See all paths <span>↗</span></a></div><div className="path-toolbar"><div className="tab-list" role="tablist">{['For you', 'Popular', 'Creative', 'Technology'].map((tab) => <button role="tab" aria-selected={activeTab === tab} key={tab} className={`filter-tab ${activeTab === tab ? 'selected' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div><button className="filter-button" onClick={() => setActiveTab(activeTab === 'Technology' ? 'For you' : 'Technology')}>☷ <span>Filter</span><b>⌄</b></button></div>{emptyMessage && <p className="paths-empty" role="status">{emptyMessage}</p>}<div className="path-grid">{visibleFields.map((f, i) => <Link className="path-card" to={`/roadmap/${f.slug || f.id}`} key={f.slug || f.id}><div className={`card-art ${f.color}`}><span className="card-index">0{i + 1}</span><span className="card-tag">{f.tag}</span><span className="field-glyph">{f.icon}</span><span className="card-art-caption">A PATH TO EXPLORE <span>↗</span></span></div><div className="card-body"><div className="card-title-row"><h3>{f.name}</h3><span className="card-arrow">↗</span></div><p>{f.description}</p><div className="card-meta"><span>▤ &nbsp;{f.lessonCount ? `${f.lessonCount} lessons` : f.lessons}</span><span>◷ &nbsp;{f.estimatedWeeks ? `${f.estimatedWeeks} weeks` : f.time}</span></div></div></Link>)}</div><div className="paths-foot"><span>Not sure where to begin?</span><Link to="/contact">That’s okay. We can help you figure it out <span>↗</span></Link></div></section>
    <section className="how-section" id="how"><div className="how-intro"><div className="eyebrow"><span className="eyebrow-spark">✳</span> NO PRESSURE, JUST PROGRESS</div><h2>You don’t need it<br />all figured out.</h2><p>Just a little curiosity is enough. We’ll help with the next step.</p></div><div className="how-steps"><div className="how-step"><span className="step-no">01</span><div className="step-symbol lilac-text">✳</div><h3>Pick what interests you</h3><p>Explore paths built around real skills, not just buzzwords.</p></div><div className="step-connector">·······↗</div><div className="how-step"><span className="step-no">02</span><div className="step-symbol peach-text">◈</div><h3>Learn by making</h3><p>Follow a clear roadmap and put what you learn to work.</p></div><div className="step-connector">·······↗</div><div className="how-step"><span className="step-no">03</span><div className="step-symbol green-text">✦</div><h3>Grow at your pace</h3><p>Keep going, get a little better, find your people.</p></div></div></section>
    <section className="bottom-cta" id="projects"><div className="cta-flower">✳</div><div><span className="eyebrow">YOUR NEXT CHAPTER IS YOURS</span><h2>Ready when you are.</h2><p>Pick a path. Take the first step. See where it leads.</p></div><Link className="button button-paper" to="/login/student">Find your starting point <span>↗</span></Link><span className="cta-spark">✧</span></section></main>;
}

function Login({ onLogin }) {
  const { role: roleParam = 'student' } = useParams();
  const role = roles.some((r) => r.id === roleParam) ? roleParam : 'student';
  const selectedRole = roles.find((r) => r.id === role);
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError(''); setLoading(true);
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, role }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Could not sign in.');
      onLogin({ ...body.user, token: body.token });
    } catch (err) { setError(err.message === 'Failed to fetch' ? 'The API is not running yet. Start the project with npm run dev.' : err.message); }
    finally { setLoading(false); }
  }
  return <main className="login-page"><div className="login-art"><Brand light /><div className="login-art-copy"><span className="eyebrow">A LITTLE CLOSER TO WHAT’S NEXT</span><h1>Good things<br />start with <i>curiosity.</i></h1><p>A place to learn, make things, and find your way forward.</p><span className="login-doodle">✳</span></div><div className="login-art-foot">LEARN SOMETHING. MAKE SOMETHING. REPEAT.</div></div><div className="login-panel"><Link to="/" className="back-link">← <span>Back home</span></Link><div className="login-form-wrap"><div className="login-symbol">{selectedRole.icon}</div><span className="eyebrow">WELCOME TO GRONIXE</span><h2>Sign in to your portal</h2><p className="login-subtitle">Choose your space and pick up where you left off.</p><div className="role-switch" aria-label="Choose your portal">{roles.map((r) => <Link key={r.id} className={role === r.id ? 'role-active' : ''} to={`/login/${r.id}`}>{r.label}</Link>)}</div><form onSubmit={submit}><label htmlFor="email">Email address</label><input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /><div className="password-label"><label htmlFor="password">Password</label><Link to="/contact?topic=technical">Forgot password?</Link></div><input id="password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-dark sign-in-button" disabled={loading}>{loading ? 'Signing in…' : `Continue as ${selectedRole.label.toLowerCase()}`} <span>↗</span></button></form><p className="login-help">Need a hand? <Link to="/contact">Talk to our team</Link></p></div><div className="login-panel-foot">A little progress still counts. <span>✳</span></div></div></main>;
}

function Roadmap({ user }) {
  const { id } = useParams();
  const fallbackField = useMemo(() => fields.find((entry) => entry.id === id) || fields[0], [id]);
  const [career, setCareer] = useState(null);
  const [expanded, setExpanded] = useState([0]); const [done, setDone] = useState([]); const [progressError, setProgressError] = useState('');
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/careers/${id}`).then((response) => {
      if (!response.ok) throw new Error('Unable to load roadmap.');
      return response.json();
    }).then((data) => { if (!cancelled) setCareer(data.career); }).catch(() => { if (!cancelled) setCareer(null); });
    return () => { cancelled = true; };
  }, [id]);
  useEffect(() => {
    let cancelled = false;
    if (user?.role !== 'student' || !user.token) { setDone([]); return undefined; }
    fetch(`/api/progress/${id}`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Could not load saved lesson progress.')))
      .then((data) => { if (!cancelled) setDone(data.completedResources || []); })
      .catch((error) => { if (!cancelled) setProgressError(error.message); });
    return () => { cancelled = true; };
  }, [id, user?.role, user?.token]);
  const field = career || fallbackField;
  const phases = career?.phases?.length ? [...career.phases].sort((a, b) => a.order - b.order).map((phase) => ({
    ...phase,
    lessons: phase.resources.map((resource) => ({
      ...resource,
      kind: ({ video: 'WATCH', guide: 'READ', project: 'BUILD', code: 'CODE' })[resource.type] || 'READ',
      meta: [resource.type === 'video' ? 'Video' : resource.type === 'project' ? 'Hands-on project' : 'Guide', resource.duration].filter(Boolean).join(' · '),
    })),
  })) : roadmap;
  const total = phases.reduce((sum, phase) => sum + phase.lessons.length, 0);
  async function toggleLesson(lesson) {
    const key = lesson._id || lesson.title;
    const completed = !done.includes(key);
    if (lesson._id && user?.role === 'student' && user.token) {
      try {
        const response = await fetch(`/api/progress/${id}/${lesson._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` }, body: JSON.stringify({ completed }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Could not save lesson progress.');
        setDone(data.completedResources || []);
        setProgressError('');
        return;
      } catch (error) { setProgressError(error.message); return; }
    }
    setDone((current) => completed ? [...current, key] : current.filter((item) => item !== key));
  }
  return <main className="roadmap-page"><div className="roadmap-wrap"><div className="breadcrumbs"><Link to="/">Discover</Link><span>›</span><a href="/#paths">Learning paths</a><span>›</span><b>{field.name}</b></div><section className="roadmap-hero"><div><span className="eyebrow"><span className="eyebrow-spark">✳</span> YOUR LEARNING PATH</span><h1>{field.name}<br /><span>one step at a time.</span></h1><p>{field.description} A practical path with room to learn, experiment, and grow.</p><div className="roadmap-chips"><span>◷ &nbsp;{field.estimatedWeeks ? `${field.estimatedWeeks} weeks` : field.time}</span><span>▤ &nbsp;{total} bite-sized lessons</span><span>✦ &nbsp;Beginner friendly</span></div></div><div className={`roadmap-illustration ${field.color}`}><span>{field.icon}</span><i>✳</i><b>MAKE SOMETHING<br />YOU’RE PROUD OF</b></div></section><div className="roadmap-content"><div className="roadmap-main"><div className="roadmap-title"><div><span className="eyebrow">YOUR ROADMAP</span><h2>A path you can follow.</h2></div><span className="progress-pill">{done.length} of {total} complete</span></div>{progressError && <p className="form-error" role="alert">{progressError}</p>}<div className="phase-list">{phases.map((phase, index) => <section className="phase-card" key={phase.title}><button className="phase-heading" aria-expanded={expanded.includes(index)} onClick={() => setExpanded((list) => list.includes(index) ? list.filter((n) => n !== index) : [...list, index])}><span className="phase-number">0{index + 1}</span><span className="phase-heading-copy"><b>{phase.title}</b><small>{phase.lessons.length} lessons <i>·</i> {phase.duration}</small></span><span className="phase-chevron">{expanded.includes(index) ? '−' : '+'}</span></button>{expanded.includes(index) && <div className="lesson-list">{phase.lessons.map((lesson) => { const key = lesson._id || lesson.title; return <button className={`lesson-row ${done.includes(key) ? 'lesson-done' : ''}`} key={key} onClick={() => { if (lesson.url) window.open(lesson.url, '_blank', 'noopener,noreferrer'); toggleLesson(lesson); }}><span className={`lesson-icon ${lesson.kind.toLowerCase()}`}>{lesson.kind === 'WATCH' ? '▶' : lesson.kind === 'READ' ? '▤' : '↗'}</span><span className="lesson-copy"><b>{lesson.title}</b><small>{lesson.meta || lesson.description}</small></span><span className="lesson-action">{done.includes(key) ? '✓' : lesson.url ? 'Open ↗' : 'Mark done'}</span></button>; })}</div>}</section>)}</div></div><aside className="roadmap-aside"><div className="aside-card"><span className="aside-stamp">✳</span><span className="eyebrow">A NOTE FOR THE ROAD</span><h3>You don’t have to know everything to begin.</h3><p>Start with one lesson. The rest will make more sense as you go.</p><div className="aside-bottom">YOUR PACE IS THE RIGHT PACE <span>↗</span></div></div><Link to="/contact" className="mentor-link"><span>◎</span><span><b>Want a little guidance?</b><small>Talk it through with a mentor</small></span><i>↗</i></Link></aside></div></div></main>;
}

function About() { return <main className="about-page"><span className="eyebrow"><span className="eyebrow-spark">✳</span> A DIFFERENT KIND OF LEARNING SPACE</span><h1>There isn’t just<br />one way <i>forward.</i></h1><p>GRONIXE helps students explore practical skills, build real things, and find a direction that feels like theirs. Start small. Stay curious. See where it takes you.</p><Link className="button button-dark" to="/">Explore learning paths <span>↗</span></Link></main>; }

export default App;
