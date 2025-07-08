"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Eye,
  Settings,
  Filter
} from "lucide-react";

interface FinanceOverview {
  totalVolume: number;
  pendingWithdrawals: number;
  totalReserved: number;
  platformRevenue: number;
  activeUsers: number;
  flaggedTransactions: number;
}

interface Transaction {
  _id: string;
  userId: string;
  userName: string;
  userRole: string;
  transactionType: string;
  amount: number;
  status: string;
  description: string;
  campaignId?: string;
  campaignName?: string;
  createdAt: string;
  metadata?: any;
}

interface WithdrawalRequest {
  _id: string;
  userId: string;
  userName: string;
  amount: number;
  status: string;
  paymentMethod: string;
  bankDetails?: any;
  kycStatus: string;
  requestedAt: string;
  processedAt?: string;
  adminNotes?: string;
}

interface Dispute {
  _id: string;
  transactionId: string;
  userId: string;
  userName: string;
  campaignId?: string;
  campaignName?: string;
  amount: number;
  status: string;
  reason: string;
  description: string;
  evidenceUrls: string[];
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
}

export function AdminFinanceDashboard() {
  const { data: session } = useSession();
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [filters, setFilters] = useState({
    dateRange: "365d", // Changed from 7d to 365d to show all transactions
    status: "all",
    userRole: "all",
    transactionType: "all"
  });

  // Fetch finance overview data
  const fetchOverview = async () => {
    try {
      const response = await fetch('/api/admin/finance/overview', {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOverview(data);
      }
    } catch (error) {
      console.error('Failed to fetch finance overview:', error);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/admin/finance/transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  // Fetch withdrawal requests
  const fetchWithdrawals = async () => {
    try {
      const response = await fetch('/api/admin/finance/withdrawals', {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWithdrawals(data.withdrawals || []);
      }
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
    }
  };

  // Fetch disputes
  const fetchDisputes = async () => {
    try {
      const response = await fetch('/api/admin/finance/disputes', {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDisputes(data.disputes || []);
      }
    } catch (error) {
      console.error('Failed to fetch disputes:', error);
    }
  };

  // Process withdrawal request
  const processWithdrawal = async (
    withdrawalId: string, 
    action: 'approve' | 'reject', 
    notes?: string
  ) => {
    try {
      const response = await fetch(`/api/admin/finance/withdrawals/${withdrawalId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({ action, notes })
      });

      if (response.ok) {
        await fetchWithdrawals();
        setSelectedWithdrawal(null);
      }
    } catch (error) {
      console.error('Failed to process withdrawal:', error);
    }
  };

  // Resolve dispute
  const resolveDispute = async (
    disputeId: string,
    resolution: string,
    action: 'approve' | 'reject'
  ) => {
    try {
      const response = await fetch(`/api/admin/finance/disputes/${disputeId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({ resolution, action })
      });

      if (response.ok) {
        await fetchDisputes();
        setSelectedDispute(null);
      }
    } catch (error) {
      console.error('Failed to resolve dispute:', error);
    }
  };

  useEffect(() => {
    if (session?.accessToken) {
      setIsLoading(true);
      Promise.all([
        fetchOverview(),
        fetchTransactions(),
        fetchWithdrawals(),
        fetchDisputes()
      ]).finally(() => setIsLoading(false));
    }
  }, [session, filters]);

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
      disputed: "bg-purple-100 text-purple-800"
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Finance Dashboard</h1>
          <p className="text-muted-foreground">
            Manage payments, withdrawals, and disputes
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={async () => {
              try {
                const response = await fetch('/api/admin/finance/debug');
                const data = await response.json();
                console.log('Debug data:', data);
                alert('Debug data logged to console. Check browser dev tools.');
              } catch (error) {
                console.error('Debug fetch error:', error);
              }
            }}
          >
            Debug DB
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {overview && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{overview.totalVolume.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                    +12% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{overview.pendingWithdrawals.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {withdrawals.filter(w => w.status === 'pending').length} requests
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Reserved Funds</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{overview.totalReserved.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Campaign reserves
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{overview.platformRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    5% commission earned
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.activeUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    With wallet activity
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Flagged Transactions</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{overview.flaggedTransactions}</div>
                  <p className="text-xs text-muted-foreground">
                    Require review
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Select value={filters.userRole} onValueChange={(value) => setFilters({...filters, userRole: value})}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="brand">Brands</SelectItem>
                <SelectItem value="streamer">Streamers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Monitor all wallet transactions across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.userName}</div>
                          <div className="text-sm text-muted-foreground">{transaction.userRole}</div>
                        </div>
                      </TableCell>
                      <TableCell>{transaction.transactionType}</TableCell>
                      <TableCell>₹{transaction.amount.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell>{new Date(transaction.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTransaction(transaction)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Requests</CardTitle>
              <CardDescription>
                Review and process withdrawal requests from users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal._id}>
                      <TableCell>{withdrawal.userName}</TableCell>
                      <TableCell>₹{withdrawal.amount.toLocaleString()}</TableCell>
                      <TableCell>{withdrawal.paymentMethod}</TableCell>
                      <TableCell>{getStatusBadge(withdrawal.kycStatus)}</TableCell>
                      <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                      <TableCell>{new Date(withdrawal.requestedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedWithdrawal(withdrawal)}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disputes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Disputes</CardTitle>
              <CardDescription>
                Manage and resolve payment disputes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disputes.map((dispute) => (
                    <TableRow key={dispute._id}>
                      <TableCell>{dispute.userName}</TableCell>
                      <TableCell>{dispute.campaignName || 'N/A'}</TableCell>
                      <TableCell>₹{dispute.amount.toLocaleString()}</TableCell>
                      <TableCell>{dispute.reason}</TableCell>
                      <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                      <TableCell>{new Date(dispute.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedDispute(dispute)}
                        >
                          Resolve
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transaction Detail Modal */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>User</Label>
                  <div className="text-sm">{selectedTransaction.userName} ({selectedTransaction.userRole})</div>
                </div>
                <div>
                  <Label>Amount</Label>
                  <div className="text-sm">₹{selectedTransaction.amount.toLocaleString()}</div>
                </div>
                <div>
                  <Label>Type</Label>
                  <div className="text-sm">{selectedTransaction.transactionType}</div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="text-sm">{getStatusBadge(selectedTransaction.status)}</div>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <div className="text-sm">{selectedTransaction.description}</div>
              </div>
              {selectedTransaction.metadata && (
                <div>
                  <Label>Metadata</Label>
                  <pre className="text-xs bg-gray-100 p-2 rounded">
                    {JSON.stringify(selectedTransaction.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Withdrawal Review Modal */}
      <Dialog open={!!selectedWithdrawal} onOpenChange={() => setSelectedWithdrawal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Withdrawal Request</DialogTitle>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>User</Label>
                  <div className="text-sm">{selectedWithdrawal.userName}</div>
                </div>
                <div>
                  <Label>Amount</Label>
                  <div className="text-sm">₹{selectedWithdrawal.amount.toLocaleString()}</div>
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <div className="text-sm">{selectedWithdrawal.paymentMethod}</div>
                </div>
                <div>
                  <Label>KYC Status</Label>
                  <div className="text-sm">{getStatusBadge(selectedWithdrawal.kycStatus)}</div>
                </div>
              </div>
              
              {selectedWithdrawal.bankDetails && (
                <div>
                  <Label>Bank Details</Label>
                  <pre className="text-xs bg-gray-100 p-2 rounded">
                    {JSON.stringify(selectedWithdrawal.bankDetails, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex space-x-2">
                <Button 
                  className="flex-1"
                  onClick={() => processWithdrawal(selectedWithdrawal._id, 'approve')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={() => processWithdrawal(selectedWithdrawal._id, 'reject')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dispute Resolution Modal */}
      <Dialog open={!!selectedDispute} onOpenChange={() => setSelectedDispute(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
          </DialogHeader>
          {selectedDispute && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>User</Label>
                  <div className="text-sm">{selectedDispute.userName}</div>
                </div>
                <div>
                  <Label>Amount</Label>
                  <div className="text-sm">₹{selectedDispute.amount.toLocaleString()}</div>
                </div>
              </div>
              
              <div>
                <Label>Reason</Label>
                <div className="text-sm">{selectedDispute.reason}</div>
              </div>
              
              <div>
                <Label>Description</Label>
                <div className="text-sm">{selectedDispute.description}</div>
              </div>

              <div>
                <Label>Resolution</Label>
                <Textarea 
                  placeholder="Enter resolution details..."
                  className="mt-1"
                />
              </div>

              <div className="flex space-x-2">
                <Button 
                  className="flex-1"
                  onClick={() => resolveDispute(selectedDispute._id, 'Dispute resolved in favor of user', 'approve')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Claim
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={() => resolveDispute(selectedDispute._id, 'Dispute rejected', 'reject')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Claim
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
