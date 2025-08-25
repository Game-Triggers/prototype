'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEurekaRole, getPortalName } from '../../lib/hooks/use-eureka-roles';
import { Portal } from '../../lib/eureka-roles';

/**
 * Access Denied Page
 * 
 * Shows when users try to access routes they don't have permission for
 */
export default function AccessDenied() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { portal, eurekaRole } = useEurekaRole();

  const reason = searchParams.get('reason') || 'insufficient-permissions';
  const requiredPortal = searchParams.get('requiredPortal') as Portal;

  const getErrorMessage = () => {
    switch (reason) {
      case 'portal-mismatch':
        return {
          title: 'Portal Access Denied',
          message: `This section is only available for ${getPortalName(requiredPortal)} users. Your current role provides access to ${portal ? getPortalName(portal) : 'Unknown Portal'}.`,
        };
      case 'insufficient-permissions':
        return {
          title: 'Insufficient Permissions',
          message: 'You do not have the required permissions to access this resource.',
        };
      default:
        return {
          title: 'Access Denied',
          message: 'You are not authorized to access this resource.',
        };
    }
  };

  const handleGoToPortal = () => {
    switch (portal) {
      case Portal.BRAND:
        router.push('/dashboard/brand');
        break;
      case Portal.ADMIN:
        router.push('/dashboard/admin');
        break;
      case Portal.PUBLISHER:
        router.push('/dashboard/publisher');
        break;
      default:
        router.push('/dashboard');
    }
  };

  const { title, message } = getErrorMessage();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {/* Error Icon */}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            {/* Error Title */}
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {title}
            </h2>

            {/* Error Message */}
            <p className="mt-4 text-sm text-gray-600">
              {message}
            </p>

            {/* User Info */}
            {session?.user && (
              <div className="mt-6 p-4 bg-gray-50 rounded-md">
                <div className="text-sm text-gray-700">
                  <p><strong>User:</strong> {session.user.email}</p>
                  <p><strong>Role:</strong> {eurekaRole?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                  <p><strong>Portal:</strong> {portal ? getPortalName(portal) : 'Unknown Portal'}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col space-y-3">
              <button
                onClick={handleGoToPortal}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to My Portal
              </button>
              
              <button
                onClick={() => router.back()}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go Back
              </button>

              <button
                onClick={() => router.push('/')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Return to Home
              </button>
            </div>

            {/* Contact Support */}
            <div className="mt-8 p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">
                Need access to this resource? Contact your administrator or support team.
              </p>
              <button
                onClick={() => router.push('/support')}
                className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Contact Support →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
