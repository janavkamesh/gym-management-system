import React from 'react';
import { Dumbbell, CheckCircle2 } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-50">
      {/* Left side / Mobile background */}
      <div className="relative w-full md:w-5/12 lg:w-1/2 h-full min-h-[100dvh] flex flex-col items-center justify-center p-4 sm:p-6 md:p-12 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center" 
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop")' }}
        />
        {/* Dark Overlay (80% opacity) */}
        <div className="absolute inset-0 z-10 bg-slate-900/80" />

        {/* Content over image */}
        <div className="relative z-20 w-full max-w-md text-white flex flex-col items-center md:items-start text-center md:text-left h-full justify-center md:justify-center pt-8 md:pt-0">
          <div className="flex items-center gap-3 mb-8 md:mb-12">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Dumbbell className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">GymDeskManager</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold leading-tight mb-8 hidden md:block">
            Grow your gym without the guesswork.
          </h1>

          <ul className="hidden md:flex flex-col gap-5 text-slate-300 text-sm lg:text-base mb-12">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
              <span>Track members, trainers, and revenue in one place.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
              <span>Real-time renewal alerts and 1-click WhatsApp messaging.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
              <span>Automated nightly backups to keep your data secure.</span>
            </li>
          </ul>

          {/* Mobile children injection (sits over the image) */}
          <div className="w-full mt-auto mb-auto md:hidden">
            {children}
          </div>
        </div>
      </div>

      {/* Right side (Desktop only) */}
      <div className="hidden md:flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
