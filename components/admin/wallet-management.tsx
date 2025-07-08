'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  DollarSign,
  Lock,
  Unlock,
  Eye,
  History,
} from 'lucide-react';

interface WalletUser {
  _id: string;
  username: string;
  email: string;
  role: string;
  wallet?: {
    balance: number;
    reservedBalance: number;
    status: 'active' | 'frozen' | 'suspended';
    totalEarned: number;
    totalSpent: number;
  };
}

interface Transaction {
  _id: string;
  transactionType: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export function WalletManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<WalletUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<WalletUser | null>(null);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  
  // Form states
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  const searchUsers = async () => {
    if (!searchTerm.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/wallets/search?query=${encodeURIComponent(searchTerm)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSearchResults(data.users || []);
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/wallets/${userId}/details`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSelectedUser(data.user);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserTransactions = async (userId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/wallets/${userId}/transactions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUserTransactions(data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch user transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdjustBalance = async () => {
    if (!selectedUser || !adjustmentAmount || !adjustmentReason.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/wallets/${selectedUser._id}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: parseFloat(adjustmentAmount) * (adjustmentType === 'subtract' ? -1 : 1),
          reason: adjustmentReason,
          type: 'manual_adjustment'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh user details
      await fetchUserDetails(selectedUser._id);
      setShowAdjustDialog(false);
      setAdjustmentAmount('');
      setAdjustmentReason('');
    } catch (error) {
      console.error('Failed to adjust balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFreezeWallet = async (userId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/wallets/${userId}/freeze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reason: 'Administrative action'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchUserDetails(userId);
    } catch (error) {
      console.error('Failed to freeze wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfreezeWallet = async (userId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/wallets/${userId}/unfreeze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reason: 'Administrative action'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchUserDetails(userId);
    } catch (error) {
      console.error('Failed to unfreeze wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'frozen':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Wallet Management
          </CardTitle>
          <CardDescription>Search and manage user wallets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search by username, email, or user ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
            />
            <Button onClick={searchUsers} disabled={isLoading}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Reserved</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.username}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {user.wallet ? formatCurrency(user.wallet.balance) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {user.wallet ? formatCurrency(user.wallet.reservedBalance) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {user.wallet && (
                          <Badge className={getStatusColor(user.wallet.status)}>
                            {user.wallet.status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchUserDetails(user._id)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>User Wallet Details: {selectedUser.username}</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowTransactionHistory(true);
                    fetchUserTransactions(selectedUser._id);
                  }}
                >
                  <History className="h-4 w-4 mr-1" />
                  History
                </Button>
                <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <DollarSign className="h-4 w-4 mr-1" />
                      Adjust Balance
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adjust Wallet Balance</DialogTitle>
                      <DialogDescription>
                        Make manual adjustments to {selectedUser.username}&apos;s wallet balance
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="adjustment-type">Adjustment Type</Label>
                        <Select value={adjustmentType} onValueChange={(value: 'add' | 'subtract') => setAdjustmentType(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="add">Add Funds</SelectItem>
                            <SelectItem value="subtract">Subtract Funds</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="adjustment-amount">Amount (₹)</Label>
                        <Input
                          id="adjustment-amount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={adjustmentAmount}
                          onChange={(e) => setAdjustmentAmount(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="adjustment-reason">Reason</Label>
                        <Textarea
                          id="adjustment-reason"
                          value={adjustmentReason}
                          onChange={(e) => setAdjustmentReason(e.target.value)}
                          placeholder="Describe the reason for this adjustment..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAdjustDialog(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleAdjustBalance} 
                        disabled={!adjustmentAmount || !adjustmentReason.trim() || isLoading}
                      >
                        Apply Adjustment
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {selectedUser.wallet?.status === 'active' ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleFreezeWallet(selectedUser._id)}
                    disabled={isLoading}
                  >
                    <Lock className="h-4 w-4 mr-1" />
                    Freeze
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnfreezeWallet(selectedUser._id)}
                    disabled={isLoading}
                  >
                    <Unlock className="h-4 w-4 mr-1" />
                    Unfreeze
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedUser.wallet ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-gray-500">Available Balance</Label>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(selectedUser.wallet.balance)}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-gray-500">Reserved Balance</Label>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(selectedUser.wallet.reservedBalance)}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-gray-500">Total Earned</Label>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(selectedUser.wallet.totalEarned)}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-gray-500">Total Spent</Label>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(selectedUser.wallet.totalSpent)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No wallet found for this user
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transaction History Dialog */}
      <Dialog open={showTransactionHistory} onOpenChange={setShowTransactionHistory}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Transaction History</DialogTitle>
            <DialogDescription>
              Recent transactions for {selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {userTransactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userTransactions.map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell>
                        <Badge variant="outline">{transaction.transactionType}</Badge>
                      </TableCell>
                      <TableCell className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(Math.abs(transaction.amount))}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            transaction.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : transaction.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{new Date(transaction.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No transactions found
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
