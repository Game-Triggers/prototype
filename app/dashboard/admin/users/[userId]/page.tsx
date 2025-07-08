'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  MoreVertical, 
  User, 
  AlertTriangle, 
  Edit,
  Lock,
  Unlock,
  Trash,
  Mail,
  Calendar,
  Shield,
  AlertCircle
} from 'lucide-react';
import { UserRole } from '@/schemas/user.schema';

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  image?: string;
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
  platform?: 'twitch' | 'youtube' | 'email';
  description?: string;
  socialProfiles?: {
    twitch?: string;
    youtube?: string;
    twitter?: string;
  };
  settings?: {
    notifications?: boolean;
    privacy?: string;
  };
}

export default function AdminUserDetail() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch user details via admin proxy
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch user: ${response.statusText}`);
        }

        const userData = await response.json();
        setUser(userData);
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to load user data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch data if user is logged in and has admin role
    if (session?.user) {
      if (session?.user?.role === UserRole.ADMIN) {
        fetchUser();
      } else {
        // Redirect non-admin users
        router.push('/dashboard');
      }
    }
  }, [session, router, userId]);

  if (!session) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="text-center">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>Please sign in to access the admin dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (session?.user?.role !== UserRole.ADMIN) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You do not have permission to access this page. This page is only available to administrators.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Handle user actions
  const handleUserAction = async (action: string) => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      setError(null);
      
      switch (action) {
        case 'edit':
          // Navigate to user edit page (would need to be created)
          router.push(`/dashboard/admin/users/${userId}/edit`);
          break;
          
        case 'toggle-active':
          // Toggle user active status
          const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isActive: !user.isActive }),
          });
          
          if (!response.ok) {
            throw new Error(`Failed to update user: ${response.statusText}`);
          }
          
          const updatedUser = await response.json();
          setUser(updatedUser);
          break;
          
        case 'delete':
          // Delete user (with confirmation)
          if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            const deleteResponse = await fetch(`/api/admin/users/${userId}`, {
              method: 'DELETE',
            });
            
            if (!deleteResponse.ok) {
              throw new Error(`Failed to delete user: ${deleteResponse.statusText}`);
            }
            
            // Redirect back to users list
            router.push('/dashboard/admin/users');
          }
          break;
          
        default:
          break;
      }
    } catch (error) {
      console.error(`Error performing ${action} on user ${userId}:`, error);
      setError(`Failed to ${action} user. Please try again.`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/dashboard/admin/users')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
          <div>
            <h1 className="text-2xl font-bold">User Details</h1>
            <p className="text-muted-foreground">View and manage user information</p>
          </div>
        </div>
        
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isUpdating}>
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">User actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleUserAction('edit')}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit User</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleUserAction('toggle-active')}>
                {user.isActive ? (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    <span>Disable Account</span>
                  </>
                ) : (
                  <>
                    <Unlock className="mr-2 h-4 w-4" />
                    <span>Enable Account</span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleUserAction('delete')}
                className="text-red-600 focus:text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                <span>Delete User</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-2 text-muted-foreground">Loading user details...</p>
        </div>
      )}

      {/* User Details */}
      {user && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Core user profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* User Avatar and Name */}
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {user.image ? (
                    <Image src={user.image} alt={user.name} width={64} height={64} className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-8 w-8" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{user.name}</h3>
                  <div className="flex items-center space-x-2">
                    <Badge variant={
                      user.role === UserRole.ADMIN ? 'destructive' :
                      user.role === UserRole.BRAND ? 'secondary' :
                      'default'
                    }>
                      {user.role}
                    </Badge>
                    <Badge variant={user.isActive ? 'outline' : 'secondary'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user.email}</span>
                </div>
                {user.platform && (
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm capitalize">{user.platform}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {user.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                  <p className="text-sm">{user.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Account status and metadata</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">User ID</span>
                  <span className="text-sm text-muted-foreground font-mono">{user._id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Created</span>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {user.updatedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Last Updated</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(user.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Social Profiles */}
          {user.socialProfiles && Object.keys(user.socialProfiles).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Social Profiles</CardTitle>
                <CardDescription>Connected social media accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {user.socialProfiles.twitch && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Twitch</span>
                      <span className="text-sm text-muted-foreground">{user.socialProfiles.twitch}</span>
                    </div>
                  )}
                  {user.socialProfiles.youtube && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">YouTube</span>
                      <span className="text-sm text-muted-foreground">{user.socialProfiles.youtube}</span>
                    </div>
                  )}
                  {user.socialProfiles.twitter && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Twitter</span>
                      <span className="text-sm text-muted-foreground">{user.socialProfiles.twitter}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Settings */}
          {user.settings && (
            <Card>
              <CardHeader>
                <CardTitle>User Settings</CardTitle>
                <CardDescription>User preferences and configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {user.settings.notifications !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Notifications</span>
                      <Badge variant={user.settings.notifications ? 'outline' : 'secondary'}>
                        {user.settings.notifications ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  )}
                  {user.settings.privacy && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Privacy</span>
                      <span className="text-sm text-muted-foreground capitalize">{user.settings.privacy}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* User not found */}
      {!user && !isLoading && !error && (
        <Card>
          <CardContent className="py-20 text-center">
            <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">User Not Found</h3>
            <p className="text-muted-foreground">The requested user could not be found.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
