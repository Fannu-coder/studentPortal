import { useCallback, useEffect, useState } from 'react';

async function mentorRequest(path, options = {}) {
  let user;
  try { user = JSON.parse(localStorage.getItem('portalUser') || 'null'); } catch { user = null; }
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}), ...options.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'The request could not be completed.');
  return data;
}

const today = () => new Date().toISOString().slice(0, 10);
const paymentBlank = () => ({ amount: '', currency: '', method: '', reference: '', paidAt: today(), notes: '' });
const renewalBlank = () => ({ planName: '', startDate: today(), endDate: '' });

export default function MentorPortal({ user }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [registerOpen, setRegisterOpen] = useState(false);
  const [studentForm, setStudentForm] = useState({ name: '', email: '' });
  const [credential, setCredential] = useState(null);
  const [recordTarget, setRecordTarget] = useState(null);
  const [paymentForm, setPaymentForm] = useState(paymentBlank);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [renewalTarget, setRenewalTarget] = useState(null);
  const [renewalForm, setRenewalForm] = useState(renewalBlank);

  const loadStudents = useCallback(async () => {
    setLoading(true); setError('');
    try { const data = await mentorRequest('/api/mentor/students'); setStudents(data.students); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  async function registerStudent(event) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const data = await mentorRequest('/api/mentor/students', { method: 'POST', body: JSON.stringify(studentForm) });
      await loadStudents(); setStudentForm({ name: '', email: '' }); setRegisterOpen(false); setCredential(data); setNotice('Student account created. Copy the temporary password now.');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  function editPayment(student, payment) {
    setRecordTarget(student); setEditingPaymentId(payment?._id || null);
    setPaymentForm(payment ? { amount: payment.amount, currency: payment.currency, method: payment.method, reference: payment.reference || '', paidAt: new Date(payment.paidAt).toISOString().slice(0, 10), notes: payment.notes || '' } : paymentBlank());
    setError('');
  }

  async function savePayment(event) {
    event.preventDefault(); setSaving(true); setError('');
    const url = editingPaymentId ? `/api/mentor/students/${recordTarget._id}/payments/${editingPaymentId}` : `/api/mentor/students/${recordTarget._id}/payments`;
    try {
      await mentorRequest(url, { method: editingPaymentId ? 'PUT' : 'POST', body: JSON.stringify({ ...paymentForm, amount: Number(paymentForm.amount) }) });
      setRecordTarget(null); setEditingPaymentId(null); setNotice(editingPaymentId ? 'Payment details updated.' : 'Payment details saved.'); await loadStudents();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function renewSubscription(event) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      await mentorRequest(`/api/mentor/students/${renewalTarget._id}/subscriptions/renew`, { method: 'POST', body: JSON.stringify(renewalForm) });
      setRenewalTarget(null); setRenewalForm(renewalBlank()); setNotice('Subscription dates recorded.'); await loadStudents();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function copyTemporaryPassword() {
    if (!credential?.temporaryPassword) return;
    try { await navigator.clipboard.writeText(credential.temporaryPassword); setNotice('Temporary password copied. Share it with the student privately.'); }
    catch { setNotice('Copy was unavailable. Select and copy the temporary password below.'); }
  }

  const closeModal = () => { setRecordTarget(null); setRenewalTarget(null); setRegisterOpen(false); setError(''); };

  return <main className="mentor-page"><div className="mentor-wrap">
    <div className="admin-breadcrumb"><span>MENTOR PORTAL</span><i>›</i><b>Student accounts</b></div>
    <div className="mentor-heading"><div><span className="eyebrow">YOUR STUDENT ROSTER</span><h1>A little help goes a long way.</h1><p>Support your students with account setup, payment records, and renewals.</p></div><button className="button button-dark" onClick={() => { setStudentForm({ name: '', email: '' }); setError(''); setRegisterOpen(true); }}>Register a student <span>＋</span></button></div>
    {notice && <div className="admin-notice" role="status">✳ &nbsp;{notice}</div>}{error && !recordTarget && !renewalTarget && !registerOpen && <div className="admin-error" role="alert">{error} <button onClick={loadStudents}>Try again</button></div>}
    <section className="mentor-roster"><div className="admin-table-heading"><div><h2>Students you registered</h2><p>{students.length} {students.length === 1 ? 'student' : 'students'} in your roster</p></div><span className="admin-table-status"><i /> Mentor workspace</span></div>
      {loading ? <div className="admin-empty">Loading student roster…</div> : students.length === 0 ? <div className="admin-empty"><span>◎</span><b>Your roster is ready.</b><p>Register a student to start keeping their details up to date.</p><button className="small-outline" onClick={() => setRegisterOpen(true)}>Register a student</button></div> : <div className="mentor-student-list">{students.map((student) => {
        const latestSub = student.subscriptions?.[0]; const latestPayment = student.payments?.[0];
        return <article className="mentor-student" key={student._id}><div className="mentor-student-heading"><span className="avatar">{student.name?.[0] || '?'}</span><div className="mentor-student-identity"><h3>{student.name}</h3><a href={`mailto:${student.email}`}>{student.email}</a><small>Added {new Date(student.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</small></div><div className="mentor-student-actions"><button className="small-outline" onClick={() => editPayment(student, null)}>Add payment</button><button className="small-outline" onClick={() => { setRenewalTarget(student); setRenewalForm(renewalBlank()); setError(''); }}>Renew subscription</button></div></div>
          <div className="mentor-record-grid"><div className="mentor-record-box"><div className="mentor-record-title"><span>SUBSCRIPTION</span><button onClick={() => { setRenewalTarget(student); setRenewalForm(renewalBlank()); setError(''); }}>+ Add renewal</button></div>{latestSub ? <><b>{latestSub.planName}</b><p>{new Date(latestSub.startDate).toLocaleDateString()} – {new Date(latestSub.endDate).toLocaleDateString()}</p><span className={`status-badge ${latestSub.status === 'active' ? 'live' : latestSub.status === 'scheduled' ? 'pending' : 'hidden'}`}>{latestSub.status}</span></> : <p className="no-record">No subscription dates recorded yet.</p>}</div>
            <div className="mentor-record-box"><div className="mentor-record-title"><span>LATEST PAYMENT</span><button onClick={() => editPayment(student, latestPayment || null)}>{latestPayment ? 'Edit details' : '+ Add payment'}</button></div>{latestPayment ? <><b>{latestPayment.currency} {Number(latestPayment.amount).toLocaleString()}</b><p>{latestPayment.method} · {new Date(latestPayment.paidAt).toLocaleDateString()}</p>{latestPayment.reference && <small>Reference: {latestPayment.reference}</small>}</> : <p className="no-record">No payment details recorded yet.</p>}</div></div>
          {student.payments?.length > 1 && <details className="payment-history"><summary>View {student.payments.length - 1} earlier payment {student.payments.length - 1 === 1 ? 'record' : 'records'}</summary>{student.payments.slice(1).map((payment) => <div className="payment-history-row" key={payment._id}><span>{payment.currency} {Number(payment.amount).toLocaleString()} · {payment.method} · {new Date(payment.paidAt).toLocaleDateString()}</span><button onClick={() => editPayment(student, payment)}>Edit</button></div>)}</details>}
        </article>;
      })}</div>}
    </section>
    <div className="mentor-footnote">Payment records are for tracking only. Do not enter card numbers, security codes, or online banking credentials.</div>
    <div className="admin-signed-in">Signed in as {user.name} <span>·</span> Mentor</div>
  </div>
  {(registerOpen || recordTarget || renewalTarget) && <div className="enrollment-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}><section className="enrollment-modal mentor-modal" role="dialog" aria-modal="true"><button className="editor-close" aria-label="Close form" onClick={closeModal}>×</button>
    {registerOpen && <><span className="eyebrow">NEW STUDENT</span><h2>Set up a student account.</h2><p className="enrollment-intro">A temporary password will be generated after the account is created. Share it with the student privately.</p><form onSubmit={registerStudent}><label>Student name<input required minLength="2" maxLength="100" value={studentForm.name} onChange={(event) => setStudentForm({ ...studentForm, name: event.target.value })} /></label><label>Student email<input required type="email" value={studentForm.email} onChange={(event) => setStudentForm({ ...studentForm, email: event.target.value })} /></label>{error && <div className="opportunity-error" role="alert">{error}</div>}<div className="enrollment-form-actions"><button type="button" className="small-outline" onClick={closeModal}>Cancel</button><button className="button button-dark" disabled={saving}>{saving ? 'Creating…' : 'Create account'} <span>↗</span></button></div></form></>}
    {recordTarget && <><span className="eyebrow">PAYMENT RECORD</span><h2>{editingPaymentId ? 'Update payment details.' : 'Record a payment.'}</h2><p className="enrollment-intro">For {recordTarget.name}. These details are for record keeping and do not process a payment.</p><form onSubmit={savePayment}><div className="mentor-form-grid"><label>Amount<input required type="number" min="0" step="0.01" value={paymentForm.amount} onChange={(event) => setPaymentForm({ ...paymentForm, amount: event.target.value })} /></label><label>Currency code<input required minLength="3" maxLength="3" placeholder="e.g. PKR" value={paymentForm.currency} onChange={(event) => setPaymentForm({ ...paymentForm, currency: event.target.value.toUpperCase() })} /></label><label>Payment method<input required maxLength="50" placeholder="Cash, transfer, wallet…" value={paymentForm.method} onChange={(event) => setPaymentForm({ ...paymentForm, method: event.target.value })} /></label><label>Date received<input required type="date" value={paymentForm.paidAt} onChange={(event) => setPaymentForm({ ...paymentForm, paidAt: event.target.value })} /></label><label className="mentor-form-wide">Reference (optional)<input maxLength="100" value={paymentForm.reference} onChange={(event) => setPaymentForm({ ...paymentForm, reference: event.target.value })} placeholder="Receipt or transaction reference" /></label><label className="mentor-form-wide">Notes (optional)<textarea rows="2" maxLength="500" value={paymentForm.notes} onChange={(event) => setPaymentForm({ ...paymentForm, notes: event.target.value })} /></label></div>{error && <div className="opportunity-error" role="alert">{error}</div>}<div className="enrollment-form-actions"><button type="button" className="small-outline" onClick={closeModal}>Cancel</button><button className="button button-dark" disabled={saving}>{saving ? 'Saving…' : 'Save payment'} <span>↗</span></button></div></form></>}
    {renewalTarget && <><span className="eyebrow">SUBSCRIPTION DATES</span><h2>Record a renewal.</h2><p className="enrollment-intro">For {renewalTarget.name}. Enter the plan and dates according to your programme’s subscription rules.</p><form onSubmit={renewSubscription}><label>Plan name<input required maxLength="80" value={renewalForm.planName} onChange={(event) => setRenewalForm({ ...renewalForm, planName: event.target.value })} placeholder="Plan or subscription label" /></label><div className="mentor-form-grid"><label>Start date<input required type="date" value={renewalForm.startDate} onChange={(event) => setRenewalForm({ ...renewalForm, startDate: event.target.value })} /></label><label>End date<input required type="date" value={renewalForm.endDate} onChange={(event) => setRenewalForm({ ...renewalForm, endDate: event.target.value })} /></label></div>{error && <div className="opportunity-error" role="alert">{error}</div>}<div className="enrollment-form-actions"><button type="button" className="small-outline" onClick={closeModal}>Cancel</button><button className="button button-dark" disabled={saving}>{saving ? 'Saving…' : 'Save renewal'} <span>↗</span></button></div></form></>}
  </section></div>}
  {credential && <div className="enrollment-overlay"><section className="enrollment-modal credential-modal" role="dialog" aria-modal="true" aria-labelledby="credential-heading"><span className="credential-symbol">✓</span><span className="eyebrow">ACCOUNT CREATED</span><h2 id="credential-heading">Share the temporary password.</h2><p className="enrollment-intro">For {credential.student.name} · {credential.student.email}. This password is shown once. Share it with the student privately.</p><label>Temporary password<code>{credential.temporaryPassword}</code></label><div className="enrollment-form-actions"><button className="small-outline" onClick={() => setCredential(null)}>Done</button><button className="button button-dark" onClick={copyTemporaryPassword}>Copy password <span>▣</span></button></div></section></div>}
  </main>;
}
