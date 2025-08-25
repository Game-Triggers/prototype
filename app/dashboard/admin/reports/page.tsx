'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency as formatPlatformCurrency } from '../../../../lib/currency-config';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { 
  AlertTriangle, 
  Download,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Users,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { UserRole } from '@/schemas/user.schema';

// Sample data - in a real application, this would come from the API
const SAMPLE_REVENUE_DATA = [
  { month: 'Jan', revenue: 4500, costs: 1200, profit: 3300 },
  { month: 'Feb', revenue: 5200, costs: 1300, profit: 3900 },
  { month: 'Mar', revenue: 6100, costs: 1500, profit: 4600 },
  { month: 'Apr', revenue: 7800, costs: 1800, profit: 6000 },
  { month: 'May', revenue: 8700, costs: 2000, profit: 6700 },
  { month: 'Jun', revenue: 10500, costs: 2400, profit: 8100 },
];

const SAMPLE_PLATFORM_FEES = [
  { name: 'Subscription Fees', value: 35 },
  { name: 'Transaction Fees', value: 40 },
  { name: 'Revenue Share', value: 25 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface FinancialMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  totalProfit: number;
  revenueTrend: number;
  avgCampaignValue: number;
  totalPayoutsToStreamers: number;
  pendingPayouts: number;
  processingFees: number;
}

export default function FinancialReportsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalProfit: 0,
    revenueTrend: 0,
    avgCampaignValue: 0,
    totalPayoutsToStreamers: 0,
    pendingPayouts: 0,
    processingFees: 0,
  });
  
  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // In a real application, we would fetch data from the API
        // For now, we're using sample data
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Set mock financial metrics
        setMetrics({
          totalRevenue: 145000,
          monthlyRevenue: 10500,
          totalProfit: 98000,
          revenueTrend: 12.5,
          avgCampaignValue: 2400,
          totalPayoutsToStreamers: 78000,
          pendingPayouts: 12500,
          processingFees: 3200,
        });
        
      } catch (err) {
        console.error('Error fetching financial data:', err);
        setError('Failed to load financial data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch data if user is logged in and has admin role
    if (session?.user) {
      if (session.user.role === UserRole.ADMIN) {
        fetchFinancialData();
      } else {
        // Redirect non-admin users
        router.push('/dashboard');
      }
    }
  }, [session, router]);

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

  // Format currency
  const formatCurrency = (amount: number) => {
    return formatPlatformCurrency(amount);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Financial Reports</h1>
          <p className="text-muted-foreground">Platform revenue and financial metrics</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded animate-pulse mb-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Financial Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <ArrowUpRight className="w-4 h-4 mr-1 text-green-500" />
                  <span className="text-green-500 font-medium">{metrics.revenueTrend}%</span>
                  <span className="ml-1">vs. last year</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.monthlyRevenue)}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <ArrowUpRight className="w-4 h-4 mr-1 text-green-500" />
                  <span className="text-green-500 font-medium">8.2%</span>
                  <span className="ml-1">vs. last month</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg. Campaign Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.avgCampaignValue)}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <ArrowUpRight className="w-4 h-4 mr-1 text-green-500" />
                  <span className="text-green-500 font-medium">5.3%</span>
                  <span className="ml-1">vs. last month</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.totalProfit)}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <ArrowDownRight className="w-4 h-4 mr-1 text-red-500" />
                  <span className="text-red-500 font-medium">2.1%</span>
                  <span className="ml-1">vs. last month</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for Different Reports */}
          <Tabs defaultValue="revenue" className="w-full">
            <TabsList>
              <TabsTrigger value="revenue" className="flex items-center">
                <BarChart3 className="mr-2 h-4 w-4" />
                Revenue
              </TabsTrigger>
              <TabsTrigger value="payouts" className="flex items-center">
                <DollarSign className="mr-2 h-4 w-4" />
                Payouts
              </TabsTrigger>
              <TabsTrigger value="trends" className="flex items-center">
                <TrendingUp className="mr-2 h-4 w-4" />
                Trends
              </TabsTrigger>
            </TabsList>
            
            {/* Revenue Tab Content */}
            <TabsContent value="revenue">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Revenue Overview</CardTitle>
                    <CardDescription>Monthly revenue breakdown</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={SAMPLE_REVENUE_DATA} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => `$${value}`} />
                        <Tooltip formatter={(value) => [`$${value}`, '']} />
                        <Legend />
                        <Bar dataKey="revenue" name="Revenue" fill="#8884d8" />
                        <Bar dataKey="profit" name="Profit" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Sources</CardTitle>
                    <CardDescription>Platform fee breakdown</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={SAMPLE_PLATFORM_FEES}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {SAMPLE_PLATFORM_FEES.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}%`, '']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Top Performing Campaigns</CardTitle>
                  <CardDescription>Campaigns generating the most revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b transition-colors hover:bg-muted/50">
                          <th className="h-12 px-4 text-left align-middle font-medium">Campaign</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Brand</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Total Budget</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Platform Fees</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...Array(5)].map((_, i) => (
                          <tr key={i} className="border-b transition-colors hover:bg-muted/50">
                            <td className="p-4 align-middle">Summer Promotion {i + 1}</td>
                            <td className="p-4 align-middle">Brand {i + 1}</td>
                            <td className="p-4 align-middle">{formatCurrency(5000 + i * 1000)}</td>
                            <td className="p-4 align-middle">{formatCurrency(500 + i * 100)}</td>
                            <td className="p-4 align-middle font-medium">{formatCurrency(500 + i * 100)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Payouts Tab Content */}
            <TabsContent value="payouts">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Payout Summary</CardTitle>
                    <CardDescription>Streamer payout metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-4">
                      <div className="flex items-center justify-between">
                        <dt className="text-sm text-muted-foreground">Total Payouts</dt>
                        <dd className="text-lg font-medium">{formatCurrency(metrics.totalPayoutsToStreamers)}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-sm text-muted-foreground">Pending Payouts</dt>
                        <dd className="text-lg font-medium">{formatCurrency(metrics.pendingPayouts)}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-sm text-muted-foreground">Processing Fees</dt>
                        <dd className="text-lg font-medium">{formatCurrency(metrics.processingFees)}</dd>
                      </div>
                    </dl>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">View All Transactions</Button>
                  </CardFooter>
                </Card>
                
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Payout Trend</CardTitle>
                    <CardDescription>Monthly payout volume</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={SAMPLE_REVENUE_DATA} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip formatter={(value) => [formatCurrency(value as number), '']} />
                        <Line type="monotone" dataKey="profit" name="Payouts" stroke="#8884d8" activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Top Earning Streamers</CardTitle>
                  <CardDescription>Streamers who earned the most from campaigns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b transition-colors hover:bg-muted/50">
                          <th className="h-12 px-4 text-left align-middle font-medium">Streamer</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Campaigns</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Total Earned</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Platform Fees</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Net Payout</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...Array(5)].map((_, i) => (
                          <tr key={i} className="border-b transition-colors hover:bg-muted/50">
                            <td className="p-4 align-middle">Streamer {i + 1}</td>
                            <td className="p-4 align-middle">{5 - i}</td>
                            <td className="p-4 align-middle">{formatCurrency(4000 - i * 500)}</td>
                            <td className="p-4 align-middle">{formatCurrency((4000 - i * 500) * 0.1)}</td>
                            <td className="p-4 align-middle font-medium">{formatCurrency((4000 - i * 500) * 0.9)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Trends Tab Content */}
            <TabsContent value="trends">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Growth Metrics</CardTitle>
                    <CardDescription>Year-over-year platform growth</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        { month: 'Jan', users: 120, campaigns: 45 },
                        { month: 'Feb', users: 145, campaigns: 53 },
                        { month: 'Mar', users: 190, campaigns: 68 },
                        { month: 'Apr', users: 230, campaigns: 80 },
                        { month: 'May', users: 280, campaigns: 95 },
                        { month: 'Jun', users: 350, campaigns: 120 },
                      ]} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="users" name="New Users" stroke="#8884d8" activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="campaigns" name="New Campaigns" stroke="#82ca9d" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>User Acquisition Cost</CardTitle>
                    <CardDescription>Cost per new user over time</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        { month: 'Jan', cost: 12.5 },
                        { month: 'Feb', cost: 11.8 },
                        { month: 'Mar', cost: 10.5 },
                        { month: 'Apr', cost: 9.2 },
                        { month: 'May', cost: 8.7 },
                        { month: 'Jun', cost: 7.9 },
                      ]} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip formatter={(value) => [formatCurrency(value as number), 'CAC']} />
                        <Line type="monotone" dataKey="cost" name="Acquisition Cost" stroke="#ff7300" yAxisId={0} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Retention Metrics</CardTitle>
                  <CardDescription>User retention by cohort</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { month: 'Week 1', streamers: 100, brands: 100 },
                      { month: 'Week 2', streamers: 85, brands: 90 },
                      { month: 'Week 4', streamers: 70, brands: 75 },
                      { month: 'Week 8', streamers: 60, brands: 65 },
                      { month: 'Week 12', streamers: 55, brands: 60 },
                      { month: 'Week 24', streamers: 50, brands: 55 },
                    ]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `${value}%`} />
                      <Tooltip formatter={(value) => [`${value}%`, '']} />
                      <Legend />
                      <Bar dataKey="streamers" name="Streamer Retention" fill="#8884d8" />
                      <Bar dataKey="brands" name="Brand Retention" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}