import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import PushAutoRegister from "@/components/PushAutoRegister";
import TenantSetupClient from "@/components/TenantSetupClient";
import SwipeNavigation from "@/components/SwipeNavigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/login');
  }

  const gymName = user.user_metadata?.gym_name || 'My Gym';
  const ownerName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Admin';

  return (
    <>
      <TenantSetupClient />
      <PushAutoRegister />
      <SwipeNavigation />
      <Sidebar />
      <MobileShell gymName={gymName} ownerName={ownerName} />
      <main className="flex-1 flex flex-col min-h-dvh overflow-auto pt-header pb-nav lg:pt-0 lg:pb-0">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
