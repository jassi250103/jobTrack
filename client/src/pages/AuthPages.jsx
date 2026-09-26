import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../hooks/useAuth';
import { Button, Input } from '../components/ui';

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const OTP_LENGTH = 6;

function getPasswordChecks(password) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
  };
}

function PasswordStrength({ password }) {
  const checks = getPasswordChecks(password);
  const score = Object.values(checks).filter(Boolean).length;
  const width = `${(score / 4) * 100}%`;
  const color = score <= 2 ? '#d26d4d' : score === 3 ? '#d9a82e' : '#2f7d62';

  return (
    <div className="password-panel">
      <div className="password-meter">
        <span style={{ width, background: color }} />
      </div>
      <div className="password-rules">
        <span className={checks.length ? 'ok' : ''}>8+ chars</span>
        <span className={checks.uppercase ? 'ok' : ''}>Uppercase</span>
        <span className={checks.lowercase ? 'ok' : ''}>Lowercase</span>
        <span className={checks.number ? 'ok' : ''}>Number</span>
      </div>
    </div>
  );
}

function OtpInput({ value, onChange, disabled = false }) {
  const refs = useRef([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] ?? '');

  const updateValue = (next) => {
    onChange(next.slice(0, OTP_LENGTH));
  };

  const handleChange = (index, raw) => {
    const nextChar = (raw || '').replace(/\D/g, '').slice(0, 1);
    const next = digits.map((digit, idx) => (idx === index ? nextChar : digit)).join('');
    updateValue(next);
    if (nextChar && index < OTP_LENGTH - 1) refs.current[index + 1]?.focus();
  };

  const handleBackspace = (index, event) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = (event.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    updateValue(pasted);
    const targetIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    refs.current[targetIndex]?.focus();
  };

  return (
    <div className="otp-grid" onPaste={handlePaste}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => (refs.current[index] = node)}
          className="otp-input"
          inputMode="numeric"
          pattern="[0-9]"
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`OTP digit ${index + 1}`}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleBackspace(index, event)}
        />
      ))}
    </div>
  );
}

export function Landing() {
  return (
    <div className="landing">
      <nav>
        <div className="brand"><i>J</i>JobTrack</div>
        <div>
          <Link to="/login">Sign in</Link>
          <Link className="button button-primary" to="/register">Start tracking</Link>
        </div>
      </nav>
      <section className="hero">
        <p className="eyebrow">A calmer job search</p>
        <h1>Every opportunity,<br /><em>in one clear view.</em></h1>
        <p>JobTrack gives your applications, interviews, and next steps a focused home—so you can spend less time tracking and more time preparing.</p>
        <Link className="button button-primary button-large" to="/register">Create your free workspace <span>→</span></Link>
        <div className="hero-preview">
          <div><small>INTERVIEWS THIS WEEK</small><strong>3</strong><p>Keep the momentum going.</p></div>
          <div><small>APPLICATIONS</small><strong>24</strong><p>All your opportunities, organized.</p></div>
          <div className="preview-list"><small>RECENTLY UPDATED</small><p><b>Acme</b><span className="badge badge-interview">INTERVIEW</span></p><p><b>Northstar Labs</b><span className="badge badge-applied">APPLIED</span></p></div>
        </div>
      </section>
    </div>
  );
}

function AuthForm({ mode }) {
  const { user, login, register, verifyRegistration, resendRegistrationOtp, googleLogin, forgotPassword, verifyResetOtp, resetPassword, resendResetOtp } = useAuth();
  const navigate = useNavigate();
  const signup = mode === 'register';
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', otp: '', newPassword: '', confirmNewPassword: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [saving, setSaving] = useState(false);
  const [screen, setScreen] = useState(signup ? 'register' : 'login');
  const [countdown, setCountdown] = useState(0);
  const googleEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  useEffect(() => {
    setScreen(signup ? 'register' : 'login');
    setForm({ name: '', email: '', password: '', confirmPassword: '', otp: '', newPassword: '', confirmNewPassword: '' });
    setError('');
    setInfo('');
    setCountdown(0);
  }, [mode]);

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  if (user) return <Navigate to="/dashboard" replace />;

  const passwordChecks = getPasswordChecks(form.password);
  const validEmail = EMAIL_RE.test(form.email);

  const onField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!validEmail) return setError('Enter a valid email address.');
    if (!form.password.trim()) return setError('Enter your password.');
    setError('');
    setSaving(true);
    try {
      await login({ email: form.email, password: form.password });
      navigate('/dashboard');
    } catch (err) {
      if (err.message === 'Please verify your email before logging in.') {
        setScreen('verify-login');
        setInfo('Please verify your email before logging in.');
      } else {
        setError(err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    if (form.name.trim().length < 2) return setError('Please enter your full name.');
    if (!validEmail) return setError('Enter a valid email address.');
    if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/\d/.test(form.password)) return setError('Use 8+ characters with uppercase, lowercase, and a number.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    setError('');
    setSaving(true);
    try {
      const result = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      setScreen('verify-registration');
      setInfo(result?.message || 'We\'ve sent a 6-digit verification code to your email.');
      setCountdown(300);
      setForm((current) => ({ ...current, password: '', confirmPassword: '', otp: '' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyRegistration = async (event) => {
    event.preventDefault();
    if (form.otp.length !== OTP_LENGTH) return setError('Enter the 6-digit code.');
    setError('');
    setSaving(true);
    try {
      await verifyRegistration({ email: form.email, otp: form.otp });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResendRegistration = async () => {
    if (!validEmail) return setError('Enter a valid email address first.');
    setError('');
    setSaving(true);
    try {
      const response = await resendRegistrationOtp({ email: form.email });
      setInfo(response.message || 'A fresh code has been sent.');
      setCountdown(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleForgotPasswordRequest = async (event) => {
    event.preventDefault();
    if (!validEmail) return setError('Enter a valid email address.');
    setError('');
    setSaving(true);
    try {
      const response = await forgotPassword({ email: form.email });
      setScreen('forgot-otp');
      setInfo(response.message || 'If that account exists, a reset code has been sent.');
      setCountdown(300);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyResetOtp = async (event) => {
    event.preventDefault();
    if (form.otp.length !== OTP_LENGTH) return setError('Enter the 6-digit code.');
    setError('');
    setSaving(true);
    try {
      await verifyResetOtp({ email: form.email, otp: form.otp });
      setScreen('reset-password');
      setInfo('Code verified. Create a new password.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    if (!validEmail) return setError('Enter a valid email address.');
    if (form.newPassword.length < 8 || !/[A-Z]/.test(form.newPassword) || !/[a-z]/.test(form.newPassword) || !/\d/.test(form.newPassword)) return setError('Use 8+ characters with uppercase, lowercase, and a number.');
    if (form.newPassword !== form.confirmNewPassword) return setError('Passwords do not match.');
    setError('');
    setSaving(true);
    try {
      const response = await resetPassword({
        email: form.email,
        otp: form.otp,
        password: form.newPassword,
        confirmPassword: form.confirmNewPassword,
      });
      setInfo(response.message || 'Your password has been reset successfully.');
      setScreen('login');
      setForm({ name: '', email: '', password: '', confirmPassword: '', otp: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) return setError('Google sign-in failed. Please try again.');
    setError('');
    setSaving(true);
    try {
      await googleLogin({ credential: credentialResponse.credential });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const resendReset = async () => {
    if (!validEmail) return setError('Enter a valid email address first.');
    try {
      const response = await resendResetOtp({ email: form.email });
      setInfo(response.message || 'A new reset code has been sent.');
      setCountdown(60);
    } catch (err) {
      setError(err.message);
    }
  };

  const authPanelTitle = signup ? 'Create your account' : 'Welcome back';

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <aside className="auth-visual">
          <div className="brand"><i>J</i>JobTrack</div>
          <div className="auth-visual-copy">
            <p className="eyebrow">Your next opportunity</p>
            <h2>Track every application, interview, and next step in one calm system.</h2>
          </div>
          <div className="auth-metrics">
            <div><strong>24</strong><span>Open opportunities</span></div>
            <div><strong>3</strong><span>Interviews this week</span></div>
          </div>
        </aside>

        <section className="auth-card">
          <p className="eyebrow">{signup ? 'GET STARTED' : 'WELCOME BACK'}</p>
          <h1>{signup ? 'Build a better job search.' : 'Pick up where you left off.'}</h1>
          <p className="auth-subtitle">
            {screen === 'register' && 'Create your private JobTrack workspace.'}
            {screen === 'verify-registration' && 'Verify your email'}
            {screen === 'verify-login' && 'Please verify your email'}
            {screen === 'forgot-password' && 'Reset your password'}
            {screen === 'forgot-otp' && 'Enter verification code'}
            {screen === 'reset-password' && 'Create a new password'}
            {!signup && screen === 'login' && 'Sign in to your JobTrack workspace.'}
          </p>

          {(screen === 'login' || screen === 'register') && (
            <div style={{ display: 'grid', gap: '16px' }}>
              {googleEnabled ? (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-in failed. Please try again.')}
                  text={signup ? 'signup_with' : 'continue_with'}
                  shape="pill"
                  width="100%"
                />
              ) : (
                <Button type="button" variant="secondary" disabled style={{ opacity: 0.7 }}>Google sign-in unavailable</Button>
              )}
              <div className="auth-divider"><span>or</span></div>
            </div>
          )}

          {error && <div className="form-error">{error}</div>}
          {info && <div className="form-success">{info}</div>}

          {(screen === 'login' || screen === 'register') && (
            <form onSubmit={signup ? handleRegister : handleLogin}>
              {signup && <Input label="Your name" value={form.name} onChange={onField('name')} autoComplete="name" required />}
              <Input label="Email address" type="email" value={form.email} onChange={onField('email')} autoComplete="email" required />
              {!signup && (
                <>
                  <Input label="Password" type="password" value={form.password} onChange={onField('password')} autoComplete="current-password" required />
                  <div className="auth-inline-links">
                    <button type="button" className="link-button" onClick={() => { setScreen('forgot-password'); setError(''); setInfo(''); }}>Forgot password?</button>
                  </div>
                </>
              )}
              {signup && (
                <>
                  <Input label="Password" type="password" value={form.password} onChange={onField('password')} autoComplete="new-password" required />
                  <PasswordStrength password={form.password} />
                  <Input label="Confirm password" type="password" value={form.confirmPassword} onChange={onField('confirmPassword')} autoComplete="new-password" required />
                </>
              )}
              <Button className="auth-submit" loading={saving}>{signup ? 'Create account' : 'Sign in'}</Button>
            </form>
          )}

          {screen === 'verify-registration' && (
            <form onSubmit={handleVerifyRegistration}>
              <p className="auth-helper">We\'ve sent a 6-digit verification code to your email.</p>
              <Input label="Email address" type="email" value={form.email} onChange={onField('email')} autoComplete="email" required />
              <OtpInput value={form.otp} onChange={(value) => setForm((current) => ({ ...current, otp: value }))} />
              <Button className="auth-submit" loading={saving}>Verify Email</Button>
              <div className="otp-actions">
                <button type="button" className="link-button" onClick={handleResendRegistration} disabled={saving || countdown > 0}>
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                </button>
              </div>
              <p className="auth-tiny">Code expires in 5 minutes.</p>
            </form>
          )}

          {screen === 'verify-login' && (
            <form onSubmit={handleVerifyRegistration}>
              <p className="auth-helper">Your email still needs to be verified before you can access JobTrack.</p>
              <Input label="Email address" type="email" value={form.email} onChange={onField('email')} autoComplete="email" required />
              <OtpInput value={form.otp} onChange={(value) => setForm((current) => ({ ...current, otp: value }))} />
              <Button className="auth-submit" loading={saving}>Verify Email</Button>
              <div className="otp-actions">
                <button type="button" className="link-button" onClick={handleResendRegistration} disabled={saving || countdown > 0}>
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          )}

          {screen === 'forgot-password' && (
            <form onSubmit={handleForgotPasswordRequest}>
              <Input label="Email address" type="email" value={form.email} onChange={onField('email')} autoComplete="email" required />
              <Button className="auth-submit" loading={saving}>Send OTP</Button>
            </form>
          )}

          {screen === 'forgot-otp' && (
            <form onSubmit={handleVerifyResetOtp}>
              <p className="auth-helper">Enter the 6-digit code we sent to your email.</p>
              <OtpInput value={form.otp} onChange={(value) => setForm((current) => ({ ...current, otp: value }))} />
              <Button className="auth-submit" loading={saving}>Verify OTP</Button>
              <div className="otp-actions">
                <button type="button" className="link-button" onClick={resendReset} disabled={saving || countdown > 0}>
                  {countdown > 0 ? `Resend available in ${countdown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          )}

          {screen === 'reset-password' && (
            <form onSubmit={handleResetPassword}>
              <Input label="New password" type="password" value={form.newPassword} onChange={onField('newPassword')} autoComplete="new-password" required />
              <PasswordStrength password={form.newPassword} />
              <Input label="Confirm new password" type="password" value={form.confirmNewPassword} onChange={onField('confirmNewPassword')} autoComplete="new-password" required />
              <Button className="auth-submit" loading={saving}>Reset Password</Button>
            </form>
          )}

          {screen !== 'login' && screen !== 'register' && (
            <p className="auth-switch">
              <button type="button" className="link-button" onClick={() => { setScreen(signup ? 'register' : 'login'); setError(''); setInfo(''); setForm((current) => ({ ...current, otp: '', newPassword: '', confirmNewPassword: '' })); }}>Back</button>
            </p>
          )}

          {screen === 'login' && (
            <p className="auth-switch">Need an account? <Link to="/register">Create one</Link></p>
          )}
          {screen === 'register' && (
            <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
          )}
        </section>
      </div>
    </div>
  );
}

export const Login = () => <AuthForm mode="login" />;
export const Register = () => <AuthForm mode="register" />;
