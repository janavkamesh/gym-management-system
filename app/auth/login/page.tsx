'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Specific error states
  const [unconfirmedEmail, setUnconfirmedEmail] = useState(false);
  const [invalidCredentials, setInvalidCredentials] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendRateLimited, setResendRateLimited] = useState(false);
  
  const { showToast } = useToast();
  const router = useRouter();

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('gym_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUnconfirmedEmail(false);
    setInvalidCredentials(false);

    try {
      const res = await fetch('/api/auth/owner-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'unconfirmed_email') {
          setUnconfirmedEmail(true);
        } else if (data.error === 'invalid_credentials') {
          setInvalidCredentials(true);
        } else if (data.error === 'rate_limit_exceeded') {
          showToast('Too many login attempts. Please try again later.', 'error');
        } else {
          showToast(data.message || 'Failed to log in', 'error');
        }
        return;
      }

      // Handle "Remember our details"
      if (rememberMe) {
        localStorage.setItem('gym_remembered_email', email);
      } else {
        localStorage.removeItem('gym_remembered_email');
      }

      // Success - Redirect to dashboard
      // Note: The dashboard layout calls owner-setup unconditionally to initialize new tenants.
      router.push('/');
    } catch (err: any) {
      showToast('Connection error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setResendRateLimited(false);

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'rate_limit_exceeded') {
          setUnconfirmedEmail(false);
          setResendRateLimited(true);
        } else if (data.error === 'already_verified') {
          setUnconfirmedEmail(false);
          showToast('Email is already verified. Please log in.', 'success');
        } else {
          showToast(data.message || 'Failed to resend email', 'error');
        }
        return;
      }

      showToast('Verification email resent successfully', 'success');
    } catch (err: any) {
      showToast('Connection error. Please try again.', 'error');
    } finally {
      setResending(false);
    }
  };

  const handleGoogleAuth = () => {
    window.location.href = `/api/auth/oauth?redirectTo=${encodeURIComponent(window.location.origin + '/auth/callback?next=/')}`;
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-lg shadow-2xl w-full">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome back</h2>
      <p className="text-slate-600 text-sm mb-6">Log in to manage your gym.</p>

      {unconfirmedEmail && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm flex flex-col gap-2">
          <p>Please verify your email address first. Check your inbox for the activation link.</p>
          <button 
            type="button" 
            onClick={handleResend}
            disabled={resending}
            className="text-left font-medium text-yellow-900 hover:text-yellow-700 underline w-fit disabled:opacity-50 disabled:no-underline"
          >
            {resending ? 'Sending...' : 'Resend verification email'}
          </button>
        </div>
      )}

      {resendRateLimited && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm">
          <p className="font-medium mb-1">Check your inbox</p>
          <p>We recently sent a verification link to this email. For security, we can only send a few emails per hour. Please check your inbox or spam folder, or try again later.</p>
        </div>
      )}

      {invalidCredentials && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
          Incorrect email or password.
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => { setEmail(e.target.value); setInvalidCredentials(false); setUnconfirmedEmail(false); }}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900 ${invalidCredentials ? 'border-red-500' : 'border-slate-200'}`}
            placeholder="owner@gym.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => { setPassword(e.target.value); setInvalidCredentials(false); }}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900 ${invalidCredentials ? 'border-red-500' : 'border-slate-200'}`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
            />
            <span className="text-sm text-slate-600 hover:text-slate-900">Remember our details</span>
          </label>
          <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg active:scale-95 transition-transform flex items-center justify-center gap-2 mt-4"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Please wait...' : 'Log In'}
        </button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-slate-500">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleAuth}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-lg active:scale-95 transition-transform"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </button>
      </div>

      <p className="mt-8 text-center text-sm text-slate-600">
        New to GymDeskManager?{' '}
        <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-medium">
          Create an account
        </Link>
      </p>
    </div>
  );
}
