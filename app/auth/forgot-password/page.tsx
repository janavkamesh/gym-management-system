'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  
  const { showToast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setRateLimited(false);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'rate_limit_exceeded') {
          // It's a real expected limit (2 emails/hour), not a bug.
          setRateLimited(true);
        } else {
          showToast(data.message || 'Failed to send reset link', 'error');
        }
        return;
      }

      // Success
      router.push(`/auth/forgot-password/sent?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      showToast('Connection error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-lg shadow-2xl w-full relative">
      <Link href="/auth/login" className="absolute top-6 left-6 text-slate-400 hover:text-slate-600">
        <ArrowLeft className="w-5 h-5" />
      </Link>
      
      <div className="mt-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Reset your password</h2>
        <p className="text-slate-600 text-sm mb-6">
          Enter the email address associated with your account and we'll send you a link to reset your password.
        </p>

        {rateLimited && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm">
            <p className="font-medium mb-1">Check your inbox</p>
            <p>We recently sent a reset link to this email. For security, we can only send a few emails per hour. Please check your inbox or spam folder, or try again later.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900"
              placeholder="owner@gym.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg active:scale-95 transition-transform flex items-center justify-center gap-2 mt-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Please wait...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
}
