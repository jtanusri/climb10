'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Check for URL error params
  const errorMessages: Record<string, string> = {
    invalid_or_expired: 'That login link has expired or already been used. Please request a new one.',
    missing_token: 'Invalid login link. Please request a new one.',
    server_error: 'Something went wrong. Please try again.',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage(data.message);
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong.');
      }
    } catch {
      setStatus('error');
      setMessage('Unable to connect. Please try again.');
    }
  };

  // Get error from URL on client side
  const urlError = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('error')
    : null;

  return (
    <div className="w-full max-w-md mx-4">
      <div className="bg-white rounded-2xl shadow-lg border border-silver-200 overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-10 pb-6 text-center">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="Climb10" width={56} height={56} />
          </div>
          <h1 className="text-2xl font-bold text-plum-800">Climb10</h1>
          <p className="text-sm text-silver-500 mt-1">Nature Advisory Platform</p>
        </div>

        {/* URL Error */}
        {urlError && errorMessages[urlError] && (
          <div className="mx-8 mb-4 flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{errorMessages[urlError]}</span>
          </div>
        )}

        {/* Form */}
        <div className="px-8 pb-10">
          {status === 'success' ? (
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-silver-900 mb-2">Check your email</h2>
              <p className="text-sm text-silver-600">
                We sent a login link to <strong>{email}</strong>. Click the link in your email to sign in.
              </p>
              <button
                onClick={() => { setStatus('idle'); setEmail(''); }}
                className="mt-6 text-sm text-ocean-600 hover:text-ocean-700 font-medium"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-silver-600 mb-6 text-center">
                Enter your email to receive a sign-in link.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-silver-700 mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-silver-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-silver-300 rounded-lg text-sm focus:ring-2 focus:ring-plum-500 focus:border-plum-500 outline-none"
                    />
                  </div>
                </div>

                {status === 'error' && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading' || !email.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-plum-800 text-white rounded-lg hover:bg-plum-700 text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending link...
                    </>
                  ) : (
                    'Send login link'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-silver-400 mt-6">
        Access is limited to authorized users only.
      </p>
    </div>
  );
}
