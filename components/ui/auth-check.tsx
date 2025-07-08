import { useState, useEffect } from 'react';

type AuthCheckProps = {
  onTokenReceived: (token: string | null) => void;
};

export function AuthCheck({ onTokenReceived }: AuthCheckProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  
  useEffect(() => {
    async function checkAuth() {
      try {
        // First, try to get the token from the browser's session
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();
        
        setTokenInfo(session);
        
        if (session && session.accessToken) {
          onTokenReceived(session.accessToken);
        } else {
          onTokenReceived(null);
          setError('No access token found in session');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check authentication');
        onTokenReceived(null);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAuth();
  }, [onTokenReceived]);
  
  return (
    <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-900 mb-4">
      <h3 className="font-medium mb-2">Authentication Status</h3>
      
      {isLoading ? (
        <p>Checking authentication status...</p>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="font-medium">Authenticated</span>
          </div>
          
          <div className="text-sm">
            <p><strong>User:</strong> {tokenInfo?.user?.name || 'Unknown'}</p>
            <p><strong>Email:</strong> {tokenInfo?.user?.email || 'Unknown'}</p>
            <p><strong>Role:</strong> {tokenInfo?.user?.role || 'Unknown'}</p>
            <p><strong>Token available:</strong> {tokenInfo?.accessToken ? 'Yes' : 'No'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
