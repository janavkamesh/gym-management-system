'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

let globalAppLoaded = false;

export default function FirstLoadSuspense({ 
  fallback, 
  children 
}: { 
  fallback: React.ReactNode;
  children: React.ReactNode; 
}) {
  const [isFirstLoad] = useState(!globalAppLoaded);
  const [isMounted, setIsMounted] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    globalAppLoaded = true;
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    if (isFirstLoad) {
      return <Suspense fallback={fallback}>{children}</Suspense>;
    }
    return <>{children}</>;
  }

  return <Suspense key={searchParams.toString()} fallback={fallback}>{children}</Suspense>;
}
