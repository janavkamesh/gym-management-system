'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

export default function SignUpPage() {
  const [gymName, setGymName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Specific error states for inline handling
  const [emailExists, setEmailExists] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  const { showToast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setEmailExists(false);
    setPasswordError('');

    try {
      const res = await fetch('/api/auth/owner-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, gymName })
      });
      
      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'email_exists') {
          setEmailExists(true);
        } else if (data.error === 'weak_password') {
          setPasswordError('Password should be at least 6 characters.');
        } else if (data.error === 'rate_limit_exceeded') {
          showToast('Too many sign up attempts. Please try again later.', 'error');
        } else {
          showToast(data.message || 'Failed to sign up', 'error');
        }
        return;
      }

      // Success
      setIsSuccess(true);
    } catch (err: any) {
      showToast('Connection error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    window.location.href = `/api/auth/oauth?redirectTo=${encodeURIComponent(window.location.origin + '/')}`;
  };

  if (isSuccess) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full text-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h2>
        <p className="text-slate-600 mb-6">
          We've sent a verification link to <span className="font-medium text-slate-900">{email}</span>. 
          Please click it to activate your account.
        </p>
        <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
          Return to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-lg shadow-2xl w-full">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Create your account</h2>
      <p className="text-slate-600 text-sm mb-6">Start managing your gym in minutes.</p>

      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Gym Name</label>
          <input
            type="text"
            required
            value={gymName}
            onChange={(e) => setGymName(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900"
            placeholder="e.g. Iron & Steel Fitness"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEmailExists(false); }}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900 ${emailExists ? 'border-red-500' : 'border-slate-200'}`}
            placeholder="owner@gym.com"
          />
          {emailExists && (
            <p className="mt-1 text-sm text-red-600">
              Email already registered.{' '}
              <Link href="/auth/login" className="font-medium underline hover:text-red-700">
                Log in instead?
              </Link>
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900 ${passwordError ? 'border-red-500' : 'border-slate-200'}`}
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
          {passwordError && (
            <p className="mt-1 text-sm text-red-600">{passwordError}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Please wait...' : 'Sign Up'}
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
        Already have an account?{' '}
        <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
          Log In
        </Link>
      </p>
    </div>
  );
}
