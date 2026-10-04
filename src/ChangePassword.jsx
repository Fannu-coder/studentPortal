import { useState } from 'react';

export default function ChangePassword({ user, onComplete }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault(); setError('');
    if (newPassword !== confirmPassword) { setError('The new passwords do not match.'); return; }
    setSaving(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not change your password.');
      onComplete({ ...user, ...data.user, mustChangePassword: false });
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  return <main className="change-password-page"><section className="change-password-card"><span className="credential-symbol">✓</span><span className="eyebrow">ONE QUICK ACCOUNT STEP</span><h1>Choose a password of your own.</h1><p>Your mentor set up your account with a temporary password. Make a private password to continue.</p><form onSubmit={submit}><label>Temporary password<input type="password" required autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label><label>New password<input type="password" required minLength="12" maxLength="128" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /><small>Use at least 12 characters.</small></label><label>Confirm new password<input type="password" required minLength="12" maxLength="128" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>{error && <div className="opportunity-error" role="alert">{error}</div>}<button className="button button-dark" disabled={saving}>{saving ? 'Updating…' : 'Save password'} <span>↗</span></button></form><div className="change-password-user">Signed in as {user.email}</div></section></main>;
}
