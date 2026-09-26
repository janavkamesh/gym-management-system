'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { showToast } = useToast();
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'unauthorized') {
          showToast('Invalid or expired reset link. Please request a new one.', 'error');
        } else {
          showToast(data.message || 'Failed to reset password', 'error');
        }
        return;
      }

      // Success
      setIsSuccess(true);
      showToast('Password updated successfully', 'success');
      
      // Delay slightly for UX before redirecting
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err: any) {
      showToast('Connection error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Password Updated</h2>
        <p className="text-slate-600 mb-8">
          Your password has been successfully reset. You will be redirected to the login page momentarily.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-lg shadow-2xl w-full">
      <div className="mt-2">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Set new password</h2>
        <p className="text-slate-600 text-sm mb-6">
          Please enter your new password below.
        </p>

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900 ${error ? 'border-red-500' : 'border-slate-200'}`}
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900 ${error ? 'border-red-500' : 'border-slate-200'}`}
              placeholder="••••••••"
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg active:scale-95 transition-transform flex items-center justify-center gap-2 mt-4"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Please wait...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
