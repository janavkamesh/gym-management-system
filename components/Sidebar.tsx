'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, UserPlus, Users2, IndianRupee, ClipboardList, Receipt, Wallet, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ModalTransition } from './ui/ModalTransition';
import { ModalHeader } from './ui/ModalHeader';

const navigationGroups = [
  {
    label: 'OVERVIEW',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    ]
  },
  {
    label: 'PEOPLE',
    items: [
      { name: 'Members', href: '/members', icon: Users },
      { name: 'Trainers', href: '/trainers', icon: Users2 },
      { name: 'Leads', href: '/leads', icon: UserPlus },
    ]
  },
  {
    label: 'FINANCE',
    items: [
      { name: 'Financials', href: '/financials', icon: IndianRupee },
      { name: 'Transactions', href: '/transactions', icon: Receipt },
      { name: 'Expenses', href: '/expenses', icon: Wallet },
    ]
  },
  {
    label: 'SYSTEM',
    items: [
      { name: 'Activity Logs', href: '/activity-logs', icon: ClipboardList },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ height: 0, top: 0, opacity: 0 });
  const [userData, setUserData] = useState<{ gymName: string, userName: string } | null>(null);
  const [showSignOutMenu, setShowSignOutMenu] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const gymName = user.user_metadata?.gym_name || 'My Gym';
        const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Admin';
        setUserData({ gymName, userName });
      } else {
        setUserData({ gymName: 'My Gym', userName: 'Admin' });
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowSignOutMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!navRef.current) return;
    
    const flatNavigation = navigationGroups.flatMap(g => g.items);
    const activeIndex = flatNavigation.findIndex(item => pathname === item.href);
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

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <div className="w-64 bg-navy text-slate-300 h-screen sticky top-0 flex flex-col hidden lg:flex shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-700/50">
        {!userData ? (
          <div className="h-6 w-32 bg-slate-700 animate-pulse rounded-md"></div>
        ) : (
          <span className="text-xl font-bold text-white tracking-tight truncate" title={userData.gymName}>{userData.gymName}</span>
        )}
      </div>
      
      <div className="flex-1 px-4 py-6 overflow-y-auto relative hide-scrollbar" ref={navRef}>
        <div 
          className="absolute top-0 left-4 right-4 bg-blue-600 rounded-lg shadow-sm transition-[transform,opacity] duration-[180ms] ease-out pointer-events-none"
          style={{
            height: `${indicatorStyle.height}px`,
            transform: `translateY(${indicatorStyle.top}px)`,
            opacity: indicatorStyle.opacity
          }}
        />
        <div className="flex flex-col gap-6">
          {navigationGroups.map((group) => (
            <div key={group.label} className="flex flex-col gap-1">
              <div className="px-3 mb-1 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                {group.label}
              </div>
              {group.items.map((item) => {
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
          ))}
        </div>
      </div>
      
      <div className="p-4 border-t border-slate-700/50 flex flex-col gap-3">
        <div className="px-3">
          <button
            onClick={() => setShowSignOutModal(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
        
        <div className="px-3">
          <div className="w-full flex items-center gap-3 py-2 rounded-lg bg-slate-800/50">
            {!userData ? (
            <>
              <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse shrink-0"></div>
              <div className="flex flex-col gap-1 w-full overflow-hidden">
                <div className="h-4 w-20 bg-slate-700 animate-pulse rounded"></div>
                <div className="h-3 w-16 bg-slate-700 animate-pulse rounded"></div>
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white shrink-0 uppercase">
                {userData.userName.charAt(0)}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium text-white truncate">{userData.userName}</span>
                <span className="text-xs text-slate-400">Gym Owner</span>
              </div>
            </>
          )}
          </div>
        </div>
      </div>

      {typeof document !== 'undefined' && createPortal(
        <ModalTransition 
          isOpen={showSignOutModal}
          onClose={() => setShowSignOutModal(false)}
          containerClassName="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          <ModalHeader title="Sign Out" onClose={() => setShowSignOutModal(false)} />
          <div className="p-6">
            <p className="text-slate-500 mb-6">
              Are you sure you want to sign out of your account?
            </p>
            <div className="flex gap-3 pb-safe">
              <button
                onClick={() => setShowSignOutModal(false)}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors active:scale-95 flex justify-center items-center"
              >
                Sign Out
              </button>
            </div>
          </div>
        </ModalTransition>,
        document.body
      )}
    </div>
  );
}
