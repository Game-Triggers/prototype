'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft,
  AlertTriangle, 
  Save,
  AlertCircle,
  User as UserIcon
} from 'lucide-react';
import { UserRole } from '@/schemas/user.schema';

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  image?: string;
  isActive: boolean;
  description?: string;
}

export default function AdminEditUser() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  
  const [user, setUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState<Partial<UserData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
        setFormData({
          name: userData.name,
          email: userData.email,
          role: userData.role,
          isActive: userData.isActive !== false, // Default to true if undefined
          description: userData.description || '',
        });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate required fields
      if (!formData.name || !formData.email || !formData.role) {
        throw new Error('Please fill in all required fields.');
      }

      // Update user via admin API
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update user: ${response.statusText}`);
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      setSuccess('User has been updated successfully!');

      // Redirect to user detail page after a delay
      setTimeout(() => {
        router.push(`/dashboard/admin/users/${userId}`);
      }, 2000);

    } catch (err) {
      console.error('Error updating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof UserData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push(`/dashboard/admin/users/${userId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to User Details
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit User</h1>
          <p className="text-muted-foreground">
            {user ? `Editing ${user.name}` : 'Modify user information'}
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <Save className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-2 text-muted-foreground">Loading user details...</p>
        </div>
      )}

      {/* Form */}
      {user && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>
              Update the user&apos;s account details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter user's full name"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter user's email address"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">User Role *</Label>
                <Select
                  value={formData.role || ''}
                  onValueChange={(value) => handleInputChange('role', value as UserRole)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.STREAMER}>Streamer</SelectItem>
                    <SelectItem value={UserRole.BRAND}>Brand</SelectItem>
                    <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active Status */}
              <div className="space-y-2">
                <Label htmlFor="isActive">Account Status *</Label>
                <Select
                  value={formData.isActive ? 'true' : 'false'}
                  onValueChange={(value) => handleInputChange('isActive', value === 'true')}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="Enter user description"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                      Updating User...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Update User
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/admin/users/${userId}`)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* User not found */}
      {!user && !isLoading && !error && (
        <Card>
          <CardContent className="py-20 text-center">
            <UserIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">User Not Found</h3>
            <p className="text-muted-foreground">The requested user could not be found.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
