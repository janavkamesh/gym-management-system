'use client';

import { useEffect } from 'react';

export default function TenantSetupClient() {
  useEffect(() => {
    // Unconditionally call the idempotent setup route on every dashboard load
    // to initialize new tenants (sets trial dates, seeds default plan).
    fetch('/api/auth/owner-setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(console.error); // Silent fail is fine, it's idempotent
  }, []);

  return null;
}
