'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Medal, Wallet, Target } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Leads', href: '/leads', icon: Target },
  { name: 'Trainers', href: '/trainers', icon: Medal },
  { name: 'Financials', href: '/financials', icon: Wallet },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [lastIndex, setLastIndex] = useState(0);
  
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const effectivePathname = (isPending && pendingHref) ? pendingHref : pathname;

  const activeIndex = navigation.findIndex(item => 
    item.href === '/' ? effectivePathname === '/' : effectivePathname.startsWith(item.href)
  );

  const realActiveIndex = navigation.findIndex(item => 
    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (activeIndex !== -1) {
      setLastIndex(activeIndex);
    }
  }, [activeIndex]);

  return (
    <div 
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 flex items-center px-0 pb-safe shadow-up-sm"
      style={{
        borderTopLeftRadius: 'calc((var(--nav-h) + env(safe-area-inset-bottom, 0px)) * 0.2)',
        borderTopRightRadius: 'calc((var(--nav-h) + env(safe-area-inset-bottom, 0px)) * 0.2)'
      }}
    >
      <div 
        className="absolute top-0 bottom-[env(safe-area-inset-bottom,0px)] left-0 w-[20%] flex flex-col items-center justify-center py-2.5 pointer-events-none transition-all duration-180 ease-out motion-reduce:transition-none"
        style={{ 
          transform: `translateX(${(activeIndex !== -1 ? activeIndex : lastIndex) * 100}%)`, 
          opacity: activeIndex !== -1 ? (mounted ? 1 : 0) : 0 
        }}
      >
        <div className="w-14 h-8 bg-blue-600/10 rounded-full mb-1.5 shrink-0" />
        <span className="text-[13px] leading-none invisible px-1">X</span>
      </div>

      {navigation.map((item) => {
        const isActive = item.href === '/' ? effectivePathname === '/' : effectivePathname.startsWith(item.href);
        const isRealActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        const Icon = item.icon;
        
        return (
          <Link
            key={item.name}
            href={item.href}
            prefetch={true}
            aria-current={isRealActive ? 'page' : undefined}
            onClick={(e) => {
              if (pathname === item.href) return;
              e.preventDefault();
              setPendingHref(item.href);
              startTransition(() => {
                router.push(item.href);
              });
            }}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center min-h-[48px] py-2.5 transition-colors active:scale-95 duration-180 ease-out touch-manipulation ${
              isActive
                ? 'text-blue-600'
                : 'text-slate-500'
            }`}
          >
            <div className="relative flex items-center justify-center w-14 h-8 mb-1.5">
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className="relative z-10 transition-all duration-180 ease-out" />
            </div>
            <span className={`text-[13px] leading-none truncate max-w-full px-1 transition-colors duration-180 ease-out ${isActive ? 'font-semibold' : 'font-normal'}`}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
