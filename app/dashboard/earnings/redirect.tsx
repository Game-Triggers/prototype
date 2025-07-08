'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EarningsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to unified wallet page
    router.replace('/dashboard/wallet');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <p>Redirecting to Wallet...</p>
      </div>
    </div>
  );
}
