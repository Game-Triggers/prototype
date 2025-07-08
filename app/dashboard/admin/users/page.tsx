'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical, 
  User, 
  Search, 
  AlertTriangle, 
  UserPlus,
  Filter,
  Trash,
  Edit,
  Eye,
  Lock,
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
  isActive: boolean;
  platform?: 'twitch' | 'youtube' | 'email';
}

interface UserFilterOptions {
  role?: UserRole;
  search?: string;
  isActive?: boolean;
  page: number;
  limit: number;
}

export default function AdminUsers() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [filterOptions, setFilterOptions] = useState<UserFilterOptions>({
    page: 1,
    limit: 10,
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Build query string from filter options (excluding pagination as backend doesn't support it)
        const queryParams = new URLSearchParams();
        if (filterOptions.role) queryParams.append('role', filterOptions.role);
        if (filterOptions.search) queryParams.append('search', filterOptions.search);
        // Note: isActive is not supported by backend UserFilterDto, implement client-side filtering

        // Fetch users with applied filters via admin proxy
        const response = await fetch(`/api/admin/users?${queryParams.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Backend returns array of users directly, not wrapped in an object
        const allUsers = Array.isArray(data) ? data : [];
        
        // Apply client-side filtering for isActive (since backend doesn't support it)
        // Treat undefined isActive as true (active) for backward compatibility
        let filteredUsers = allUsers;
        if (filterOptions.isActive !== undefined) {
          filteredUsers = allUsers.filter(user => {
            const userIsActive = user.isActive !== false; // undefined or true = active
            return userIsActive === filterOptions.isActive;
          });
        }
        
        // Apply client-side pagination
        const startIndex = (filterOptions.page - 1) * filterOptions.limit;
        const endIndex = startIndex + filterOptions.limit;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
        
        setUsers(paginatedUsers);
        setTotalUsers(filteredUsers.length);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load user data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch data if user is logged in and has admin role
    if (session?.user) {
      if (session?.user?.role === UserRole.ADMIN) {
        fetchUsers();
      } else {
        // Redirect non-admin users
        router.push('/dashboard');
      }
    }
  }, [session, router, filterOptions, refreshTrigger]);

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

  // Handle user action
  const handleUserAction = async (action: string, userId: string) => {
    console.log(`Performing action: ${action} on user: ${userId}`);
    
    try {
      switch (action) {
        case 'view':
          // Navigate to user detail page (would need to be created)
          router.push(`/dashboard/admin/users/${userId}`);
          break;
          
        case 'edit':
          // Navigate to user edit page (would need to be created)
          router.push(`/dashboard/admin/users/${userId}/edit`);
          break;
          
        case 'disable':
          // Disable user account
          await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isActive: false }),
          });
          
          // Refresh user list
          setRefreshTrigger(prev => prev + 1);
          break;
          
        case 'enable':
          // Enable user account
          await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isActive: true }),
          });
          
          // Refresh user list
          setRefreshTrigger(prev => prev + 1);
          break;
          
        case 'delete':
          // Delete user (would require confirmation in a real application)
          if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            await fetch(`/api/admin/users/${userId}`, {
              method: 'DELETE',
            });
            
            // Refresh user list
            setRefreshTrigger(prev => prev + 1);
          }
          break;
          
        default:
          break;
      }
    } catch (error) {
      console.error(`Error performing ${action} on user ${userId}:`, error);
      setError(`Failed to ${action} user. Please try again.`);
    }
  };

  // Get total pages for pagination
  const totalPages = Math.ceil(totalUsers / filterOptions.limit);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage platform users and their permissions</p>
        </div>
        <Button 
          className="mt-4 md:mt-0"
          onClick={() => router.push('/dashboard/admin/users/new')}
        >
          <UserPlus className="mr-2 h-4 w-4" /> Add New User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Total of {totalUsers} users registered on the platform
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email..."
                  className="pl-8"
                  value={filterOptions.search || ''}
                  onChange={(e) => setFilterOptions({
                    ...filterOptions,
                    search: e.target.value,
                    page: 1, // Reset to first page on new search
                  })}
                />
              </div>              <Select
                value={filterOptions.role || 'all'}
                onValueChange={(value) => setFilterOptions({
                  ...filterOptions,
                  role: value === 'all' ? undefined : value as UserRole,
                  page: 1,
                })}
              >
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <span>{filterOptions.role || 'All Roles'}</span>
                  </div>
                </SelectTrigger>                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value={UserRole.STREAMER}>Streamers</SelectItem>
                  <SelectItem value={UserRole.BRAND}>Brands</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>Admins</SelectItem>
                </SelectContent>
              </Select>              <Select
                value={filterOptions.isActive !== undefined ? filterOptions.isActive.toString() : 'all'}
                onValueChange={(value) => setFilterOptions({
                  ...filterOptions,
                  isActive: value === 'all' ? undefined : value === 'true',
                  page: 1,
                })}
              >
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <span>
                      {filterOptions.isActive === undefined 
                        ? 'All Status' 
                        : filterOptions.isActive 
                          ? 'Active' 
                          : 'Inactive'}
                    </span>
                  </div>
                </SelectTrigger>                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="py-20 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-2 text-muted-foreground">Loading user data...</p>
            </div>
          ) : error ? (
            <div className="py-10">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mr-2 overflow-hidden">
                              {user.image ? (
                                <Image src={user.image} alt={user.name} width={32} height={32} className="h-full w-full object-cover" />
                              ) : (
                                <User className="h-4 w-4" />
                              )}
                            </div>
                            {user.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            user.role === UserRole.ADMIN ? 'destructive' :
                            user.role === UserRole.BRAND ? 'secondary' :
                            'default'
                          }>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.platform || 'Email'}
                        </TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={(user.isActive !== false) ? 'outline' : 'secondary'}>
                            {(user.isActive !== false) ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleUserAction('view', user._id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                <span>View Details</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUserAction('edit', user._id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit User</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {(user.isActive !== false) ? (
                                <DropdownMenuItem onClick={() => handleUserAction('disable', user._id)}>
                                  <Lock className="mr-2 h-4 w-4" />
                                  <span>Disable Account</span>
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleUserAction('enable', user._id)}>
                                  <Lock className="mr-2 h-4 w-4" />
                                  <span>Enable Account</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleUserAction('delete', user._id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                <span>Delete User</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No users found matching your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {!isLoading && !error && totalPages > 0 && (
          <CardFooter className="flex items-center justify-between border-t px-6 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {((filterOptions.page - 1) * filterOptions.limit) + 1}-
              {Math.min(filterOptions.page * filterOptions.limit, totalUsers)} of {totalUsers} users
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterOptions({
                  ...filterOptions,
                  page: Math.max(1, filterOptions.page - 1),
                })}
                disabled={filterOptions.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous Page</span>
              </Button>
              <div className="text-sm font-medium">
                Page {filterOptions.page} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterOptions({
                  ...filterOptions,
                  page: Math.min(totalPages, filterOptions.page + 1),
                })}
                disabled={filterOptions.page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next Page</span>
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}