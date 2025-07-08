"use client";

import { useSession } from 'next-auth/react';
import { ConflictRulesManagement } from '@/components/admin/conflict-rules-management';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function ConflictRulesPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Please sign in to access this page.
        </AlertDescription>
      </Alert>
    );
  }

  if (session.user?.role !== 'admin') {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You do not have permission to access conflict rules management.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <ConflictRulesManagement />
    </div>
  );
}
