'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, UserPlus, Users2, IndianRupee, ClipboardList, Receipt, Wallet } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Leads', href: '/leads', icon: UserPlus },
  { name: 'Trainers', href: '/trainers', icon: Users2 },
  { name: 'Financials', href: '/financials', icon: IndianRupee },
  { name: 'Transactions', href: '/transactions', icon: Receipt },
  { name: 'Expenses', href: '/expenses', icon: Wallet },
  { name: 'Activity Logs', href: '/activity-logs', icon: ClipboardList },
];

export default function Sidebar() {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ height: 0, top: 0, opacity: 0 });

  useEffect(() => {
    if (!navRef.current) return;
    
    const activeIndex = navigation.findIndex(item => pathname === item.href);
    if (activeIndex === -1) {
      setIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
      return;
    }

    const links = navRef.current.querySelectorAll('a');
    const activeLink = links[activeIndex];
    
    if (activeLink) {
      setIndicatorStyle({
        height: activeLink.offsetHeight,
        top: activeLink.offsetTop,
        opacity: 1
      });
    }
  }, [pathname]);

  return (
    <div className="w-64 bg-navy text-slate-300 h-screen sticky top-0 flex flex-col hidden md:flex shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-700/50">
        <span className="text-xl font-bold text-white tracking-tight">GymAdmin</span>
      </div>
      
      <div className="flex-1 px-4 py-6 space-y-2 relative" ref={navRef}>
        <div 
          className="absolute top-0 left-4 right-4 bg-blue-600 rounded-lg shadow-sm transition-[transform,opacity] duration-[180ms] ease-out pointer-events-none"
          style={{
            height: `${indicatorStyle.height}px`,
            transform: `translateY(${indicatorStyle.top}px)`,
            opacity: indicatorStyle.opacity
          }}
        />
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`relative z-10 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'text-white'
                  : 'hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white">
            A
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">Admin</span>
            <span className="text-xs text-slate-400">Gym Owner</span>
          </div>
        </div>
      </div>
    </div>
  );
}
