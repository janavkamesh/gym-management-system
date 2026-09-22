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
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 z-50 flex items-center justify-around px-2 pb-safe">
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors active:scale-95 duration-120 touch-manipulation ${
              isActive
                ? 'text-[#2563EB]'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium leading-none">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
