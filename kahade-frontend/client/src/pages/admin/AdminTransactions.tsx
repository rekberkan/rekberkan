/*
 * KAHADE ADMIN TRANSACTIONS PAGE
 * Icons: Phosphor Icons only
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MagnifyingGlass, DotsThreeVertical, Eye, Clock, CheckCircle,
  Warning, XCircle, ArrowUpRight, ArrowDownRight, Spinner
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/api';

interface Transaction {
  id: string;
  orderNumber: string;
  title: string;
  description?: string;
  amount: number;
  status: string;
  initiator: { id: string; username: string; email: string };
  counterparty?: { id: string; username: string; email: string };
  createdAt: string;
  paidAt?: string;
  completedAt?: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  PENDING_ACCEPT: { label: 'Pending', color: 'text-amber-500 bg-amber-500/10', icon: Clock },
  ACCEPTED: { label: 'Accepted', color: 'text-blue-500 bg-blue-500/10', icon: CheckCircle },
  PAID: { label: 'Paid', color: 'text-emerald-500 bg-emerald-500/10', icon: CheckCircle },
  DELIVERED: { label: 'Delivered', color: 'text-blue-500 bg-blue-500/10', icon: CheckCircle },
  COMPLETED: { label: 'Completed', color: 'text-emerald-500 bg-emerald-500/10', icon: CheckCircle },
  DISPUTED: { label: 'Dispute', color: 'text-red-500 bg-red-500/10', icon: Warning },
  CANCELLED: { label: 'Cancelled', color: 'text-gray-500 bg-gray-500/10', icon: XCircle },
  REJECTED: { label: 'Rejected', color: 'text-gray-500 bg-gray-500/10', icon: XCircle },
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Force action dialogs
  const [forceCompleteOpen, setForceCompleteOpen] = useState(false);
  const [forceCancelOpen, setForceCancelOpen] = useState(false);
  const [actionTxId, setActionTxId] = useState<string | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [page, statusFilter]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (statusFilter !== 'all') params.status = statusFilter;
      
      const response = await adminApi.getTransactions(params);
      setTransactions(response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.initiator?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.counterparty?.username?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleForceComplete = async () => {
    if (!actionTxId || !actionReason.trim()) {
      toast.error('Reason is required');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await adminApi.forceCompleteTransaction(actionTxId, actionReason);
      toast.success('Transaction completed successfully');
      setForceCompleteOpen(false);
      setActionTxId(null);
      setActionReason('');
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForceCancel = async () => {
    if (!actionTxId || !actionReason.trim()) {
      toast.error('Reason is required');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await adminApi.forceCancelTransaction(actionTxId, actionReason);
      toast.success('Transaction cancelled successfully');
      setForceCancelOpen(false);
      setActionTxId(null);
      setActionReason('');
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && transactions.length === 0) {
    return (
      <AdminLayout title="Transaction Management" subtitle="Manage all platform transactions">
        <div className="flex items-center justify-center h-64">
          <Spinner className="w-8 h-8 animate-spin text-accent" weight="bold" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Transaction Management" subtitle="Manage all platform transactions">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-sm text-muted-foreground">Total Transactions</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-bold text-emerald-500">
              {transactions.filter(t => t.status === 'COMPLETED').length}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-bold text-amber-500">
              {transactions.filter(t => ['PENDING_ACCEPT', 'ACCEPTED', 'PAID', 'DELIVERED'].includes(t.status)).length}
            </div>
            <div className="text-sm text-muted-foreground">Active</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-bold text-red-500">
              {transactions.filter(t => t.status === 'DISPUTED').length}
            </div>
            <div className="text-sm text-muted-foreground">Disputes</div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" weight="regular" />
            <Input
              placeholder="Search order, title, buyer, seller..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-border"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40 bg-white border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING_ACCEPT">Pending</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="DISPUTED">Dispute</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Transactions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-muted-foreground">Order</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Title</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Parties</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  const status = statusConfig[tx.status] || statusConfig.PENDING_ACCEPT;
                  
                  return (
                    <tr key={tx.id} className="border-b border-border/50 hover:bg-secondary/30">
                      <td className="p-4">
                        <div className="font-mono text-sm">{tx.orderNumber}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium max-w-[200px] truncate">{tx.title}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-sm">
                          <ArrowUpRight className="w-3 h-3 text-red-500" weight="bold" />
                          <span>{tx.initiator?.username || '-'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <ArrowDownRight className="w-3 h-3 text-emerald-500" weight="bold" />
                          <span>{tx.counterparty?.username || '-'}</span>
                        </div>
                      </td>
                      <td className="p-4 font-semibold">{formatCurrency(tx.amount)}</td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{formatDate(tx.createdAt)}</td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <DotsThreeVertical className="w-4 h-4" weight="bold" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedTx(tx)}>
                              <Eye className="w-4 h-4 mr-2" weight="regular" />
                              View Details
                            </DropdownMenuItem>
                            {!['COMPLETED', 'CANCELLED', 'REJECTED'].includes(tx.status) && (
                              <>
                                <DropdownMenuItem onClick={() => { setActionTxId(tx.id); setForceCompleteOpen(true); }}>
                                  <CheckCircle className="w-4 h-4 mr-2" weight="fill" />
                                  Force Complete
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => { setActionTxId(tx.id); setForceCancelOpen(true); }}
                                  className="text-red-500"
                                >
                                  <XCircle className="w-4 h-4 mr-2" weight="fill" />
                                  Force Cancel
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </motion.div>
        
        {/* Transaction Detail Dialog */}
        <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
            </DialogHeader>
            {selectedTx && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-secondary/50">
                  <div className="font-mono text-sm text-muted-foreground mb-1">{selectedTx.orderNumber}</div>
                  <div className="text-xl font-semibold">{selectedTx.title}</div>
                  {selectedTx.description && (
                    <div className="text-sm text-muted-foreground mt-2">{selectedTx.description}</div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <div className="text-sm text-muted-foreground mb-1">Initiator</div>
                    <div className="font-medium">{selectedTx.initiator?.username}</div>
                    <div className="text-xs text-muted-foreground">{selectedTx.initiator?.email}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <div className="text-sm text-muted-foreground mb-1">Counterparty</div>
                    <div className="font-medium">{selectedTx.counterparty?.username || '-'}</div>
                    <div className="text-xs text-muted-foreground">{selectedTx.counterparty?.email || '-'}</div>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-accent/10">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="text-2xl font-bold gradient-text">
                      {formatCurrency(selectedTx.amount)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`text-sm px-3 py-1 rounded-full ${(statusConfig[selectedTx.status] || statusConfig.PENDING_ACCEPT).color}`}>
                    {(statusConfig[selectedTx.status] || statusConfig.PENDING_ACCEPT).label}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <span className="ml-2">{formatDate(selectedTx.createdAt)}</span>
                  </div>
                  {selectedTx.paidAt && (
                    <div>
                      <span className="text-muted-foreground">Paid:</span>
                      <span className="ml-2">{formatDate(selectedTx.paidAt)}</span>
                    </div>
                  )}
                  {selectedTx.completedAt && (
                    <div>
                      <span className="text-muted-foreground">Completed:</span>
                      <span className="ml-2">{formatDate(selectedTx.completedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Force Complete Dialog */}
        <Dialog open={forceCompleteOpen} onOpenChange={setForceCompleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Force Complete Transaction</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter reason for force complete..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setForceCompleteOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button className="btn-accent" onClick={handleForceComplete} disabled={isSubmitting}>
                {isSubmitting ? <Spinner className="w-4 h-4 animate-spin mr-2" weight="bold" /> : null}
                Force Complete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Force Cancel Dialog */}
        <Dialog open={forceCancelOpen} onOpenChange={setForceCancelOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Force Cancel Transaction</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter reason for force cancel..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setForceCancelOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleForceCancel} disabled={isSubmitting}>
                {isSubmitting ? <Spinner className="w-4 h-4 animate-spin mr-2" weight="bold" /> : null}
                Force Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
