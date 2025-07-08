"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Shield, 
  Clock, 
  Users,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface ConflictRule {
  _id: string;
  name: string;
  description: string;
  type: 'category_exclusivity' | 'brand_exclusivity' | 'cooldown_period' | 'simultaneous_limit';
  severity: 'blocking' | 'warning' | 'advisory';
  config: {
    categories?: string[];
    excludedCategories?: string[];
    brands?: string[];
    excludedBrands?: string[];
    cooldownPeriodHours?: number;
    cooldownPeriodDays?: number;
    maxSimultaneousCampaigns?: number;
    maxCampaignsPerCategory?: number;
  };
  scope: {
    userRoles?: string[];
    streamerIds?: string[];
    brandIds?: string[];
  };
  isActive: boolean;
  priority: number;
  timesTriggered?: number;
  conflictsBlocked?: number;
  conflictsWarned?: number;
  createdAt: string;
}

interface ConflictViolation {
  _id: string;
  streamerId: string;
  campaignId: string;
  ruleId: string;
  conflictType: string;
  severity: string;
  message: string;
  conflictingCampaigns?: string[];
  conflictingCategories?: string[];
  conflictingBrands?: string[];
  status: 'pending' | 'resolved' | 'overridden' | 'expired';
  detectedAt: string;
  resolvedAt?: string;
  overrideReason?: string;
}

const conflictTypeLabels = {
  category_exclusivity: 'Category Exclusivity',
  brand_exclusivity: 'Brand Exclusivity',
  cooldown_period: 'Cooldown Period',
  simultaneous_limit: 'Simultaneous Limit',
};

const severityLabels = {
  blocking: 'Blocking',
  warning: 'Warning',
  advisory: 'Advisory',
};

const severityColors: Record<string, 'destructive' | 'outline' | 'secondary' | 'default'> = {
  blocking: 'destructive',
  warning: 'outline',
  advisory: 'secondary',
} as const;

export function ConflictRulesManagement() {
  const { data: session } = useSession();
  const [rules, setRules] = useState<ConflictRule[]>([]);
  const [violations, setViolations] = useState<ConflictViolation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New rule form state
  const [newRule, setNewRule] = useState<{
    name: string;
    description: string;
    type: 'category_exclusivity' | 'brand_exclusivity' | 'cooldown_period' | 'simultaneous_limit';
    severity: 'blocking' | 'warning' | 'advisory';
    config: {
      categories: string[];
      cooldownPeriodDays: number;
      maxSimultaneousCampaigns: number;
    };
    priority: number;
  }>({
    name: '',
    description: '',
    type: 'category_exclusivity',
    severity: 'warning',
    config: {
      categories: [],
      cooldownPeriodDays: 0,
      maxSimultaneousCampaigns: 0,
    },
    priority: 0,
  });

  const fetchRules = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/conflict-rules', {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setRules(data);
      } else {
        setError('Failed to fetch conflict rules');
      }
    } catch (err) {
      setError('Error fetching conflict rules');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  const fetchViolations = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/conflict-rules/violations', {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setViolations(data);
      } else {
        console.error('Failed to fetch violations');
      }
    } catch (err) {
      console.error('Error fetching violations:', err);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchRules();
      fetchViolations();
    }
  }, [session, fetchRules, fetchViolations]);

  const createRule = async () => {
    try {
      const response = await fetch('/api/admin/conflict-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(newRule),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewRule({
          name: '',
          description: '',
          type: 'category_exclusivity',
          severity: 'warning',
          config: {
            categories: [],
            cooldownPeriodDays: 0,
            maxSimultaneousCampaigns: 0,
          },
          priority: 0,
        });
        await fetchRules();
      } else {
        setError('Failed to create rule');
      }
    } catch (err) {
      setError('Error creating rule');
      console.error(err);
    }
  };

  const toggleRuleStatus = async (ruleId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/conflict-rules?id=${ruleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        await fetchRules();
      } else {
        setError('Failed to update rule');
      }
    } catch (err) {
      setError('Error updating rule');
      console.error(err);
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      const response = await fetch(`/api/admin/conflict-rules?id=${ruleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      });

      if (response.ok) {
        await fetchRules();
      } else {
        setError('Failed to delete rule');
      }
    } catch (err) {
      setError('Error deleting rule');
      console.error(err);
    }
  };

  const overrideViolation = async (violationId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/conflict-rules/violations?id=${violationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ 
          status: 'overridden',
          overrideReason: reason 
        }),
      });

      if (response.ok) {
        await fetchViolations();
      } else {
        setError('Failed to override violation');
      }
    } catch (err) {
      setError('Error overriding violation');
      console.error(err);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'blocking': return <XCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'advisory': return <Eye className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'category_exclusivity': return <Shield className="h-4 w-4" />;
      case 'brand_exclusivity': return <Shield className="h-4 w-4" />;
      case 'cooldown_period': return <Clock className="h-4 w-4" />;
      case 'simultaneous_limit': return <Users className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  if (session?.user?.role !== 'admin') {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You do not have permission to access conflict rules management.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Conflict Rules Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage campaign joining restrictions and conflict detection
          </p>
        </div>
        
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Conflict Rule</DialogTitle>
              <DialogDescription>
                Define a new rule to prevent campaign conflicts
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Rule Name</Label>
                <Input
                  id="name"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="e.g., Tech Brand Exclusivity"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  placeholder="Describe what this rule does..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Rule Type</Label>
                  <Select
                    value={newRule.type}
                    onValueChange={(value: typeof newRule.type) => 
                      setNewRule({ ...newRule, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="category_exclusivity">Category Exclusivity</SelectItem>
                      <SelectItem value="brand_exclusivity">Brand Exclusivity</SelectItem>
                      <SelectItem value="cooldown_period">Cooldown Period</SelectItem>
                      <SelectItem value="simultaneous_limit">Simultaneous Limit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="severity">Severity</Label>
                  <Select
                    value={newRule.severity}
                    onValueChange={(value: typeof newRule.severity) => 
                      setNewRule({ ...newRule, severity: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blocking">Blocking</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="advisory">Advisory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Rule-specific configuration */}
              {newRule.type === 'category_exclusivity' && (
                <div>
                  <Label>Categories</Label>
                  <Input
                    placeholder="Enter categories separated by commas"
                    onChange={(e) => 
                      setNewRule({
                        ...newRule,
                        config: {
                          ...newRule.config,
                          categories: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        }
                      })
                    }
                  />
                </div>
              )}
              
              {newRule.type === 'cooldown_period' && (
                <div>
                  <Label>Cooldown Period (Days)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={newRule.config.cooldownPeriodDays}
                    onChange={(e) => 
                      setNewRule({
                        ...newRule,
                        config: {
                          ...newRule.config,
                          cooldownPeriodDays: parseInt(e.target.value) || 0
                        }
                      })
                    }
                  />
                </div>
              )}
              
              {newRule.type === 'simultaneous_limit' && (
                <div>
                  <Label>Maximum Simultaneous Campaigns</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newRule.config.maxSimultaneousCampaigns}
                    onChange={(e) => 
                      setNewRule({
                        ...newRule,
                        config: {
                          ...newRule.config,
                          maxSimultaneousCampaigns: parseInt(e.target.value) || 0
                        }
                      })
                    }
                  />
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button onClick={createRule}>
                  Create Rule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Conflict Rules</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Active Conflict Rules</CardTitle>
              <CardDescription>
                {rules.length} rules configured
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Triggered</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {rule.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getTypeIcon(rule.type)}
                          <span className="ml-2">
                            {conflictTypeLabels[rule.type]}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={severityColors[rule.severity] || 'default'}>
                          {getSeverityIcon(rule.severity)}
                          <span className="ml-1">
                            {severityLabels[rule.severity]}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={rule.isActive}
                            onCheckedChange={(checked) => 
                              toggleRuleStatus(rule._id, checked)
                            }
                          />
                          <span className="text-sm">
                            {rule.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Total: {rule.timesTriggered || 0}</div>
                          <div className="text-muted-foreground">
                            Blocked: {rule.conflictsBlocked || 0}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteRule(rule._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="violations">
          <Card>
            <CardHeader>
              <CardTitle>Recent Violations</CardTitle>
              <CardDescription>
                Recent conflict rule violations detected
              </CardDescription>
            </CardHeader>
            <CardContent>
              {violations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                  <p>No recent violations detected</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Streamer</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Rule</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Detected</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {violations.map((violation) => (
                      <TableRow key={violation._id}>
                        <TableCell>{violation.streamerId}</TableCell>
                        <TableCell>{violation.campaignId}</TableCell>
                        <TableCell>{violation.message}</TableCell>
                        <TableCell>
                          <Badge variant={violation.status === 'pending' ? 'destructive' : 'default'}>
                            {violation.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(violation.detectedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {violation.status === 'pending' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => overrideViolation(violation._id, 'No longer applicable')}
                            >
                              Override
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{rules.length}</div>
                <div className="text-sm text-muted-foreground">
                  {rules.filter(r => r.isActive).length} active
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conflicts Blocked</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {rules.reduce((sum, rule) => sum + (rule.conflictsBlocked || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  This month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Warnings Issued</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {rules.reduce((sum, rule) => sum + (rule.conflictsWarned || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  This month
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
