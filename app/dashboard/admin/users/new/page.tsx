'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  UserPlus,
  AlertCircle
} from 'lucide-react';
import { UserRole } from '@/schemas/user.schema';

interface CreateUserData {
  name: string;
  email: string;
  role: UserRole;
  password?: string;
}

export default function AdminAddUser() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [formData, setFormData] = useState<CreateUserData>({
    name: '',
    email: '',
    role: UserRole.STREAMER,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

      // Create user via admin API (we'll need to implement this endpoint)
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          authProvider: 'email', // Default to email auth for admin-created users
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create user: ${response.statusText}`);
      }

      await response.json();
      setSuccess(`User "${formData.name}" has been created successfully!`);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        role: UserRole.STREAMER,
      });

      // Redirect to user list after a delay
      setTimeout(() => {
        router.push('/dashboard/admin/users');
      }, 2000);

    } catch (err) {
      console.error('Error creating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to create user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateUserData, value: string) => {
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
          onClick={() => router.push('/dashboard/admin/users')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add New User</h1>
          <p className="text-muted-foreground">Create a new user account</p>
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
          <UserPlus className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>
            Enter the details for the new user account
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
                value={formData.name}
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
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">User Role *</Label>
              <Select
                value={formData.role}
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

            {/* Password Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The user will need to set their password using the &quot;Forgot Password&quot; 
                feature on the login page, or you can provide them with a temporary password separately.
              </p>
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
                    Creating User...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create User
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/admin/users')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
