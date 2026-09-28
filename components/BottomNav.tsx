'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, UserPlus, Users2, IndianRupee } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Leads', href: '/leads', icon: UserPlus },
  { name: 'Trainers', href: '/trainers', icon: Users2 },
  { name: 'Financials', href: '/financials', icon: IndianRupee },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 box-content h-[var(--nav-h)] bg-white border-t border-slate-200 z-40 flex items-center px-0 pb-safe">
      {navigation.map((item) => {
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        const Icon = item.icon;
        
        return (
          <Link
            key={item.name}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center min-h-[48px] h-full space-y-1 transition-colors active:scale-95 duration-120 touch-manipulation ${
              isActive
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[11px] font-medium leading-none truncate max-w-full px-1">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
