'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Filter,
  Download,
  Eye,
  User,
} from 'lucide-react';

interface AuditEntry {
  _id: string;
  action: string;
  entityType: 'user' | 'campaign' | 'wallet' | 'transaction';
  entityId: string;
  entityName?: string;
  adminId: string;
  adminName: string;
  reason: string;
  metadata: Record<string, unknown>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

interface AuditFilters {
  dateFrom: string;
  dateTo: string;
  action: string;
  entityType: string;
  adminId: string;
}

export function AuditTrailViewer() {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showEntryDetails, setShowEntryDetails] = useState(false);
  
  const [filters, setFilters] = useState<AuditFilters>({
    dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    action: 'all',
    entityType: 'all',
    adminId: 'all'
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0
  });

  useEffect(() => {
    fetchAuditEntries();
  }, [fetchAuditEntries]);

  const fetchAuditEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value !== 'all' && value !== '')
        )
      });

      const response = await fetch(`/api/admin/reports/audit?${params}`, {
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
      setAuditEntries(data.entries || []);
      setPagination(prev => ({ ...prev, total: data.total || 0 }));
    } catch (error) {
      console.error('Failed to fetch audit entries:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  const handleExportAudit = async () => {
    try {
      const params = new URLSearchParams({
        format: 'csv',
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value !== 'all' && value !== '')
        )
      });

      const response = await fetch(`/api/admin/reports/audit/export?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-trail-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export audit trail:', error);
    }
  };

  const getActionColor = (action: string) => {
    const dangerousActions = ['force_cancel', 'force_complete', 'emergency_control', 'wallet_freeze', 'budget_override'];
    const warningActions = ['wallet_adjust', 'wallet_unfreeze', 'campaign_pause'];
    
    if (dangerousActions.some(a => action.includes(a))) {
      return 'bg-red-100 text-red-800';
    }
    if (warningActions.some(a => action.includes(a))) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-blue-100 text-blue-800';
  };

  const getEntityTypeColor = (entityType: string) => {
    switch (entityType) {
      case 'wallet':
        return 'bg-green-100 text-green-800';
      case 'campaign':
        return 'bg-purple-100 text-purple-800';
      case 'user':
        return 'bg-blue-100 text-blue-800';
      case 'transaction':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Admin Audit Trail
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportAudit}
                disabled={isLoading}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </CardTitle>
          <CardDescription>Track all administrative actions and changes</CardDescription>
        </CardHeader>
        
        {showFilters && (
          <CardContent className="border-t bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="date-from">From Date</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="date-to">To Date</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="action-filter">Action</Label>
                <Select value={filters.action} onValueChange={(value) => setFilters(prev => ({ ...prev, action: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="wallet_adjust">Wallet Adjust</SelectItem>
                    <SelectItem value="wallet_freeze">Wallet Freeze</SelectItem>
                    <SelectItem value="wallet_unfreeze">Wallet Unfreeze</SelectItem>
                    <SelectItem value="campaign_force_complete">Force Complete</SelectItem>
                    <SelectItem value="campaign_force_cancel">Force Cancel</SelectItem>
                    <SelectItem value="budget_override">Budget Override</SelectItem>
                    <SelectItem value="emergency_control">Emergency Control</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="entity-filter">Entity Type</Label>
                <Select value={filters.entityType} onValueChange={(value) => setFilters(prev => ({ ...prev, entityType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="wallet">Wallet</SelectItem>
                    <SelectItem value="campaign">Campaign</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="transaction">Transaction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={fetchAuditEntries} disabled={isLoading} className="w-full">
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        )}

        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Showing {auditEntries.length} of {pagination.total} entries
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page * pagination.limit >= pagination.total}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>

            {auditEntries.length > 0 ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditEntries.map((entry) => (
                      <TableRow key={entry._id}>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(entry.timestamp).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{entry.adminName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getActionColor(entry.action)}>
                            {entry.action.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getEntityTypeColor(entry.entityType)}>
                            {entry.entityType.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate">
                            {entry.entityName || entry.entityId}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate">
                            {entry.reason}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedEntry(entry);
                              setShowEntryDetails(true);
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {isLoading ? 'Loading audit entries...' : 'No audit entries found for the selected criteria'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Entry Details Dialog */}
      <Dialog open={showEntryDetails} onOpenChange={setShowEntryDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Entry Details</DialogTitle>
            <DialogDescription>
              Complete information about this administrative action
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Timestamp</Label>
                  <div>{new Date(selectedEntry.timestamp).toLocaleString()}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Admin</Label>
                  <div>{selectedEntry.adminName} ({selectedEntry.adminId})</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Action</Label>
                  <div>
                    <Badge className={getActionColor(selectedEntry.action)}>
                      {selectedEntry.action.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Entity Type</Label>
                  <div>
                    <Badge className={getEntityTypeColor(selectedEntry.entityType)}>
                      {selectedEntry.entityType.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Entity ID</Label>
                  <div className="font-mono text-sm">{selectedEntry.entityId}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Entity Name</Label>
                  <div>{selectedEntry.entityName || 'N/A'}</div>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Reason</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded border">
                  {selectedEntry.reason}
                </div>
              </div>

              {selectedEntry.metadata && Object.keys(selectedEntry.metadata).length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Metadata</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded border">
                    <pre className="text-sm whitespace-pre-wrap">
                      {JSON.stringify(selectedEntry.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedEntry.ipAddress && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">IP Address</Label>
                    <div className="font-mono text-sm">{selectedEntry.ipAddress}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">User Agent</Label>
                    <div className="text-sm truncate">{selectedEntry.userAgent || 'N/A'}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
