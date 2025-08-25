"use client";

import { useState, useEffect } from "react";
import { formatCurrency as formatPlatformCurrency, getCurrencyCode } from '../../lib/currency-config';
import { useEurekaRole } from "@/lib/hooks/use-eureka-roles";
import { Portal } from "@/lib/eureka-roles";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface WalletBalance {
  balance: number;
  reservedBalance: number;
  withdrawableBalance: number;
  totalEarnings?: number;
  totalSpent?: number;
}

interface Transaction {
  _id: string;
  transactionType: string;
  amount: number;
  status: string;
  paymentMethod?: string;
  description: string;
  createdAt: string;
  campaignId?: string;
}

interface WalletDashboardProps {
  // Props are now optional since we'll get portal info from hooks
}

export function WalletDashboard({}: WalletDashboardProps) {
  const { portal } = useEurekaRole();
  const [walletBalance, setWalletBalance] = useState<WalletBalance>({
    balance: 0,
    reservedBalance: 0,
    withdrawableBalance: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [addFundsAmount, setAddFundsAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [balanceResponse, transactionsResponse] = await Promise.all([
        fetch('/api/wallet/balance'),
        fetch('/api/wallet/transactions?limit=10')
      ]);

      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        setWalletBalance(balanceData);
      }

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async () => {
    if (!addFundsAmount || parseFloat(addFundsAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Create payment intent
      const response = await fetch('/api/nest/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(addFundsAmount),
          paymentMethod,
          currency: 'inr',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // In a real implementation, you would redirect to payment gateway
        // For now, we'll simulate a successful payment
        toast.success('Payment initiated successfully');
        
        // Simulate payment processing
        setTimeout(() => {
          toast.success('Funds added to wallet successfully');
          setAddFundsAmount('');
          fetchWalletData();
        }, 2000);
      } else {
        throw new Error('Failed to create payment intent');
      }
    } catch (error) {
      console.error('Error adding funds:', error);
      toast.error('Failed to add funds');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parseFloat(withdrawAmount) > walletBalance.withdrawableBalance) {
      toast.error('Insufficient withdrawable balance');
      return;
    }

    try {
      setIsProcessing(true);
      
      const response = await fetch('/api/nest/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(withdrawAmount),
        }),
      });

      if (response.ok) {
        toast.success('Withdrawal request submitted successfully');
        setWithdrawAmount('');
        fetchWalletData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to request withdrawal');
      }
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to request withdrawal');
    } finally {
      setIsProcessing(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case 'earnings_credit':
        return <Plus className="h-4 w-4 text-blue-500" />;
      case 'campaign_charge':
        return <ArrowUpRight className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'on_hold':
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />On Hold</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return formatPlatformCurrency(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(walletBalance.balance)}</div>
            <p className="text-xs text-muted-foreground">
              Ready to use for campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {portal === Portal.BRAND ? 'Reserved Balance' : 'Withdrawable Balance'}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(portal === Portal.BRAND ? walletBalance.reservedBalance : walletBalance.withdrawableBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {portal === Portal.BRAND ? 'Allocated to campaigns' : 'Available for withdrawal'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {portal === Portal.BRAND ? 'Total Spent' : 'Total Earnings'}
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(portal === Portal.BRAND ? (walletBalance.totalSpent || 0) : (walletBalance.totalEarnings || 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {portal === Portal.BRAND ? 'All-time campaign spending' : 'All-time earnings'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          {portal === Portal.BRAND && <TabsTrigger value="add-funds">Add Funds</TabsTrigger>}
          {portal === Portal.PUBLISHER && <TabsTrigger value="withdraw">Withdraw</TabsTrigger>}
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Your latest wallet transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No transactions found
                  </p>
                ) : (
                  transactions.map((transaction) => (
                    <div
                      key={transaction._id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        {getTransactionIcon(transaction.transactionType)}
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {transaction.transactionType === 'deposit' || transaction.transactionType === 'earnings_credit' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </p>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {portal === Portal.BRAND && (
          <TabsContent value="add-funds" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add Funds to Wallet</CardTitle>
                <CardDescription>
                  Top up your wallet to fund campaigns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ({getCurrencyCode()})</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={addFundsAmount}
                    onChange={(e) => setAddFundsAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Credit/Debit Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="netbanking">Net Banking</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleAddFunds}
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? 'Processing...' : 'Add Funds'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {portal === Portal.PUBLISHER && (
          <TabsContent value="withdraw" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Withdraw Earnings</CardTitle>
                <CardDescription>
                  Transfer your earnings to your bank account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdraw-amount">Amount ({getCurrencyCode()})</Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    placeholder="Enter amount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    max={walletBalance.withdrawableBalance}
                  />
                  <p className="text-sm text-muted-foreground">
                    Available: {formatCurrency(walletBalance.withdrawableBalance)}
                  </p>
                </div>
                <Button
                  onClick={handleWithdraw}
                  disabled={isProcessing || walletBalance.withdrawableBalance <= 0}
                  className="w-full"
                >
                  {isProcessing ? 'Processing...' : 'Request Withdrawal'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Analytics</CardTitle>
              <CardDescription>
                Insights into your wallet usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {transactions.filter(t => t.transactionType === 'deposit').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Deposits</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {transactions.filter(t => t.status === 'completed').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Completed Transactions</p>
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(
                      transactions
                        .filter(t => t.status === 'completed')
                        .reduce((sum, t) => sum + t.amount, 0)
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Transaction Volume</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
