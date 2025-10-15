import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const pad = (n) => n.toString().padStart(2, '0');

export default function EmailOtpVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = location.state?.email || '';
  const initialUserId = location.state?.userId || '';

  const [email, setEmail] = useState(initialEmail);
  const [userId] = useState(initialUserId);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const codeString = useMemo(() => code.join(''), [code]);

  useEffect(() => {
    if (!initialEmail && !initialUserId) {
      setError('Missing verification context. Please sign up again.');
    }
    // Auto-send OTP on first load
    // eslint-disable-next-line no-use-before-define
    sendCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let t;
    if (cooldown > 0) {
      t = setInterval(() => setCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    }
    return () => clearInterval(t);
  }, [cooldown]);

  const handleChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...code];
    next[idx] = val;
    setCode(next);
    setError('');
    setMessage('');
    // focus next
    if (val && idx < 5) {
      const el = document.getElementById(`otp-${idx + 1}`);
      if (el) el.focus();
    }
  };

  const sendCode = async () => {
    if (!email && !userId) return;
    setSending(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userId }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Failed to send code');
        return;
      }
      setMessage('Verification code sent to your email');
      if (data.data?.resendCooldownSec) setCooldown(data.data.resendCooldownSec);
    } catch (e) {
      setError('Network error while sending code');
    } finally {
      setSending(false);
    }
  };

  const verify = async () => {
    if (codeString.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    setVerifying(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userId, code: codeString }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Invalid code');
        return;
      }
      setMessage('Email verified successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (e) {
      setError('Network error while verifying code');
    } finally {
      setVerifying(false);
    }
  };

  const mmss = useMemo(() => `${pad(Math.floor(cooldown / 60))}:${pad(cooldown % 60)}`, [cooldown]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center px-6">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Verify your email</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            We sent a 6-digit code to {email || 'your email'}
          </p>
        </div>

        <div className="flex justify-center space-x-2">
          {code.map((v, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              inputMode="numeric"
              maxLength={1}
              value={v}
              onChange={(e) => handleChange(i, e.target.value)}
              className="w-12 h-12 text-center text-xl rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          ))}
        </div>

        {message && <p className="text-green-600 text-sm text-center">{message}</p>}
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}

        <button
          onClick={verify}
          disabled={verifying}
          className="w-full bg-black text-white dark:bg-white dark:text-black py-3 rounded disabled:opacity-50"
        >
          {verifying ? 'Verifying...' : 'Verify'}
        </button>

        <div className="text-center text-sm text-gray-600 dark:text-gray-300">
          Didn’t get the code?{' '}
          <button
            disabled={cooldown > 0 || sending}
            onClick={sendCode}
            className="underline disabled:no-underline disabled:opacity-50"
          >
            {cooldown > 0 ? `Resend in ${mmss}` : 'Resend code'}
          </button>
        </div>
      </div>
    </div>
  );
}
