'use client';

import { useState, useCallback } from 'react';
import MobileHeader from './MobileHeader';
import MobileDrawer from './MobileDrawer';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface MobileShellProps {
  gymName: string;
  ownerName: string;
}

export default function MobileShell({ gymName, ownerName }: MobileShellProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const router = useRouter();

  const handleClose = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const handleOpen = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <>
      <MobileHeader 
        gymName={gymName} 
        ownerName={ownerName} 
        onOpenDrawer={handleOpen} 
      />
      <MobileDrawer 
        isOpen={isDrawerOpen} 
        onClose={handleClose} 
        gymName={gymName} 
        ownerName={ownerName} 
        onSignOut={handleSignOut} 
      />
    </>
  );
}
