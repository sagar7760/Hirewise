import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { buildApiUrl } from '../../utils/api';

const pad = (n) => n.toString().padStart(2, '0');

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: enter email, 2: enter OTP + new password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);

  const codeString = useMemo(() => code.join(''), [code]);

  useEffect(() => {
    let t;
    if (cooldown > 0) {
      t = setInterval(() => setCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    }
    return () => clearInterval(t);
  }, [cooldown]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email');
      return;
    }
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(buildApiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resend: true }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Failed to send reset code');
        return;
      }
      setMessage('Password reset code sent to your email');
      if (data.data?.resendCooldownSec) setCooldown(data.data.resendCooldownSec);
      setStep(2);
    } catch (e) {
      setError('Network error while sending reset code');
    } finally {
      setSending(false);
    }
  };

  const resendCode = async () => {
    setSending(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Failed to resend code');
        return;
      }
      setMessage('Password reset code resent');
      if (data.data?.resendCooldownSec) setCooldown(data.data.resendCooldownSec);
    } catch (e) {
      setError('Network error while resending code');
    } finally {
      setSending(false);
    }
  };

  const handleCodeChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...code];
    next[idx] = val;
    setCode(next);
    setError('');
    setMessage('');
    if (val && idx < 5) {
      const el = document.getElementById(`reset-otp-${idx + 1}`);
      if (el) el.focus();
    }
  };

  const handleCodeKeyDown = (idx, e) => {
    // Handle backspace to move to previous input
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      e.preventDefault();
      const prev = [...code];
      prev[idx - 1] = '';
      setCode(prev);
      const el = document.getElementById(`reset-otp-${idx - 1}`);
      if (el) el.focus();
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (codeString.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setResetting(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(buildApiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: codeString, newPassword }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Failed to reset password');
        return;
      }
      setMessage('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (e) {
      setError('Network error while resetting password');
    } finally {
      setResetting(false);
    }
  };

  const mmss = useMemo(() => `${pad(Math.floor(cooldown / 60))}:${pad(cooldown % 60)}`, [cooldown]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center px-6">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">
            {step === 1 ? 'Forgot Password?' : 'Reset Password'}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 font-['Roboto']">
            {step === 1
              ? "Enter your email and we'll send you a code to reset your password"
              : `Enter the code sent to ${email}`}
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-['Open_Sans']">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white"
                placeholder="you@example.com"
                required
              />
            </div>

            {message && <p className="text-green-600 text-sm text-center font-['Roboto']">{message}</p>}
            {error && <p className="text-red-600 text-sm text-center font-['Roboto']">{error}</p>}

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-black text-white dark:bg-white dark:text-black py-3 rounded-lg font-medium font-['Open_Sans'] hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send Reset Code'}
            </button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-['Roboto']"
              >
                Back to Login
              </Link>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-['Open_Sans']">
                Verification Code
              </label>
              <div className="flex justify-center space-x-2">
                {code.map((v, i) => (
                  <input
                    key={i}
                    id={`reset-otp-${i}`}
                    inputMode="numeric"
                    maxLength={1}
                    value={v}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    className="w-12 h-12 text-center text-xl rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-['Open_Sans']">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white"
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-['Open_Sans']">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white"
                placeholder="Confirm new password"
                required
              />
            </div>

            {message && <p className="text-green-600 text-sm text-center font-['Roboto']">{message}</p>}
            {error && <p className="text-red-600 text-sm text-center font-['Roboto']">{error}</p>}

            <button
              type="submit"
              disabled={resetting}
              className="w-full bg-black text-white dark:bg-white dark:text-black py-3 rounded-lg font-medium font-['Open_Sans'] hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {resetting ? 'Resetting...' : 'Reset Password'}
            </button>

            <div className="text-center text-sm text-gray-600 dark:text-gray-300 font-['Roboto']">
              Didn't receive the code?{' '}
              <button
                type="button"
                disabled={cooldown > 0 || sending}
                onClick={resendCode}
                className="underline disabled:no-underline disabled:opacity-50"
              >
                {cooldown > 0 ? `Resend in ${mmss}` : 'Resend code'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-['Roboto']"
              >
                Use a different email
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
