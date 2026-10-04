import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export default function Contact({ user }) {
  const [searchParams] = useSearchParams();
  const requestedTopic = ['general', 'learning', 'opportunity', 'technical', 'other'].includes(searchParams.get('topic')) ? searchParams.get('topic') : 'general';
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', topic: requestedTopic, message: '', website: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  function update(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); }
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError(''); setSent(false);
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not send your message.');
      setSent(true);
      setForm((current) => ({ ...current, message: '', topic: 'general' }));
    } catch (err) { setError(err.message === 'Failed to fetch' ? 'The contact service is not available right now. Please try again later.' : err.message); }
    finally { setSaving(false); }
  }

  return <main className="contact-page"><div className="contact-wrap"><div className="breadcrumbs"><Link to="/">Discover</Link><span>›</span><b>Contact</b></div><section className="contact-layout"><div className="contact-intro"><span className="eyebrow"><span className="eyebrow-spark">✳</span> WE’RE HERE TO HELP</span><h1>Let’s talk about<br /><i>what’s next.</i></h1><p>Ask about a learning path, a project, or anything else on your mind. Send us a note and our team will follow up using the email you provide.</p><div className="contact-note"><span>✦</span><div><b>A real person will read this.</b><small>Your message goes to the GRONIXE contact inbox.</small></div></div></div><form className="contact-form" onSubmit={submit}><span className="eyebrow">SEND A MESSAGE</span><h2>How can we help?</h2><div className="contact-field-row"><label>Your name<input name="name" autoComplete="name" value={form.name} onChange={update} required minLength={2} maxLength={100} /></label><label>Email address<input type="email" name="email" autoComplete="email" value={form.email} onChange={update} required maxLength={254} /></label></div><label>What’s this about?<select name="topic" value={form.topic} onChange={update}><option value="general">A general question</option><option value="learning">Learning paths</option><option value="opportunity">Projects or competitions</option><option value="technical">Technical help</option><option value="other">Something else</option></select></label><label>Your message<textarea name="message" value={form.message} onChange={update} required minLength={10} maxLength={3000} rows={6} placeholder="Tell us a little about what you need…" /><small className="contact-char-count">{form.message.length}/3000</small></label><label className="contact-honeypot" aria-hidden="true" tabIndex="-1">Leave this field empty<input name="website" autoComplete="off" value={form.website} onChange={update} tabIndex="-1" /></label>{error && <p className="form-error" role="alert">{error}</p>}{sent && <p className="contact-success" role="status">Thanks for reaching out. Your message has been received.</p>}<button className="button button-dark" disabled={saving}>{saving ? 'Sending…' : 'Send message'} <span>↗</span></button><p className="contact-privacy">We’ll use your details only to respond to this message.</p></form></section></div></main>;
}
