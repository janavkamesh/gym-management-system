'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MailCheck } from 'lucide-react';

function SentContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'your email';

  return (
    <div className="bg-white p-8 rounded-lg shadow-2xl w-full text-center">
      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <MailCheck className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h2>
      <p className="text-slate-600 mb-8 leading-relaxed">
        We've sent a password reset link to <span className="font-medium text-slate-900">{email}</span>. 
        It might take a few minutes to arrive. Check your spam folder if you don't see it.
      </p>
      <Link 
        href="/auth/login" 
        className="block w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-medium py-2.5 rounded-lg active:scale-95 transition-transform"
      >
        Return to Login
      </Link>
    </div>
  );
}

export default function SentPage() {
  return (
    <Suspense fallback={
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse"></div>
        <div className="h-6 bg-slate-200 rounded w-1/2 mx-auto mb-4 animate-pulse"></div>
        <div className="h-4 bg-slate-100 rounded w-3/4 mx-auto mb-8 animate-pulse"></div>
      </div>
    }>
      <SentContent />
    </Suspense>
  );
}
