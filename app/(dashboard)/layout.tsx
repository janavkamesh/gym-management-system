import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import MobileTopBar from "@/components/MobileTopBar";
import PushAutoRegister from "@/components/PushAutoRegister";
import TenantSetupClient from "@/components/TenantSetupClient";

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

  return (
    <>
      <TenantSetupClient />
      <PushAutoRegister />
      <Sidebar />
      <MobileTopBar />
      <main className="flex-1 flex flex-col min-h-screen overflow-auto pb-16 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
