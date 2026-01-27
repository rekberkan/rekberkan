/*
 * KAHADE ADMIN DISPUTES PAGE
 * Icons: Phosphor Icons only
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MagnifyingGlass, DotsThreeVertical, Eye, Warning, CheckCircle,
  XCircle, Clock, ChatText, Scales, Spinner
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/api';

interface Dispute {
  id: string;
  status: string;
  reason: string;
  description?: string;
  openedAt: string;
  order: {
    id: string;
    orderNumber: string;
    title: string;
    amountMinor?: number;
    initiator: { id: string; username: string; email: string };
    counterparty?: { id: string; username: string; email: string };
  };
  openedBy: { id: string; username: string; email: string };
  evidences?: any[];
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  OPEN: { label: 'Open', color: 'text-red-500 bg-red-500/10', icon: Warning },
  UNDER_ARBITRATION: { label: 'In Review', color: 'text-amber-500 bg-amber-500/10', icon: Clock },
  RESOLVED: { label: 'Resolved', color: 'text-emerald-500 bg-emerald-500/10', icon: CheckCircle },
  CLOSED: { label: 'Closed', color: 'text-gray-500 bg-gray-500/10', icon: XCircle },
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

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [resolution, setResolution] = useState('');
  const [decision, setDecision] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchDisputes();
  }, [page, statusFilter]);

  const fetchDisputes = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (statusFilter !== 'all') params.status = statusFilter;
      
      const response = await adminApi.getDisputes(params);
      setDisputes(response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch disputes:', error);
      toast.error('Failed to load disputes');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDisputes = disputes.filter(d => {
    const matchesSearch = d.order?.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.order?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.reason?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleResolve = async () => {
    if (!selectedDispute || !decision || !resolution.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await adminApi.resolveDispute(selectedDispute.id, {
        decision: decision as any,
        resolutionNotes: resolution,
      });
      toast.success('Dispute resolved successfully');
      setIsResolveOpen(false);
      setSelectedDispute(null);
      setResolution('');
      setDecision('');
      fetchDisputes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resolve dispute');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartReview = async (disputeId: string) => {
    try {
      await adminApi.startReview(disputeId);
      toast.success('Dispute is now under review');
      fetchDisputes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to start review');
    }
  };

  if (isLoading && disputes.length === 0) {
    return (
      <AdminLayout title="Dispute Management" subtitle="Transaction conflict resolution">
        <div className="flex items-center justify-center h-64">
          <Spinner className="w-8 h-8 animate-spin text-accent" weight="bold" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dispute Management" subtitle="Transaction conflict resolution">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <div className="text-2xl font-bold text-red-500">
              {disputes.filter(d => d.status === 'OPEN').length}
            </div>
            <div className="text-sm text-muted-foreground">Open</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-bold text-amber-500">
              {disputes.filter(d => d.status === 'UNDER_ARBITRATION').length}
            </div>
            <div className="text-sm text-muted-foreground">In Review</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-bold text-emerald-500">
              {disputes.filter(d => d.status === 'RESOLVED').length}
            </div>
            <div className="text-sm text-muted-foreground">Resolved</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-bold">
              {disputes.length}
            </div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" weight="regular" />
            <Input
              placeholder="Search disputes..."
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
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="UNDER_ARBITRATION">In Review</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Disputes List */}
        <div className="space-y-4">
          {filteredDisputes.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Warning className="w-12 h-12 mx-auto text-muted-foreground mb-4" weight="regular" />
              <p className="text-muted-foreground">No disputes found</p>
            </div>
          ) : (
            filteredDisputes.map((dispute, index) => {
              const status = statusConfig[dispute.status] || statusConfig.OPEN;
              const amount = dispute.order?.amountMinor ? Number(dispute.order.amountMinor) / 100 : 0;
              
              return (
                <motion.div
                  key={dispute.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card p-5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm text-muted-foreground">
                          {dispute.order?.orderNumber || '-'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <h3 className="font-semibold mb-1">{dispute.order?.title || 'Untitled'}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{dispute.reason}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Opened by: {dispute.openedBy?.username || '-'}</span>
                        <span>•</span>
                        <span>{formatCurrency(amount)}</span>
                        <span>•</span>
                        <span>{formatDate(dispute.openedAt)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedDispute(dispute)}
                      >
                        <Eye className="w-4 h-4 mr-2" weight="regular" />
                        Details
                      </Button>
                      {dispute.status === 'OPEN' && (
                        <Button 
                          size="sm"
                          className="btn-accent"
                          onClick={() => handleStartReview(dispute.id)}
                        >
                          <Scales className="w-4 h-4 mr-2" weight="fill" />
                          Review
                        </Button>
                      )}
                      {dispute.status === 'UNDER_ARBITRATION' && (
                        <Button 
                          size="sm"
                          className="btn-accent"
                          onClick={() => {
                            setSelectedDispute(dispute);
                            setIsResolveOpen(true);
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" weight="fill" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
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
        
        {/* Dispute Detail Dialog */}
        <Dialog open={!!selectedDispute && !isResolveOpen} onOpenChange={() => setSelectedDispute(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Dispute Details</DialogTitle>
            </DialogHeader>
            {selectedDispute && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-secondary/50">
                  <div className="font-mono text-sm text-muted-foreground mb-1">
                    {selectedDispute.order?.orderNumber}
                  </div>
                  <div className="text-xl font-semibold">{selectedDispute.order?.title}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <div className="text-sm text-muted-foreground mb-1">Buyer</div>
                    <div className="font-medium">{selectedDispute.order?.initiator?.username || '-'}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <div className="text-sm text-muted-foreground mb-1">Seller</div>
                    <div className="font-medium">{selectedDispute.order?.counterparty?.username || '-'}</div>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="font-medium text-red-500 mb-2">Dispute Reason</div>
                  <p>{selectedDispute.reason}</p>
                  {selectedDispute.description && (
                    <p className="text-sm text-muted-foreground mt-2">{selectedDispute.description}</p>
                  )}
                </div>
                
                <div className="p-4 rounded-lg bg-accent/10">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Transaction Value</span>
                    <span className="text-2xl font-bold gradient-text">
                      {formatCurrency(selectedDispute.order?.amountMinor ? Number(selectedDispute.order.amountMinor) / 100 : 0)}
                    </span>
                  </div>
                </div>
                
                {selectedDispute.evidences && selectedDispute.evidences.length > 0 && (
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <div className="font-medium mb-2">Evidence ({selectedDispute.evidences.length})</div>
                    <div className="space-y-2">
                      {selectedDispute.evidences.map((e: any, i: number) => (
                        <div key={i} className="text-sm text-muted-foreground">
                          {e.fileUrl || e.description || `Evidence ${i + 1}`}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`text-sm px-3 py-1 rounded-full ${(statusConfig[selectedDispute.status] || statusConfig.OPEN).color}`}>
                    {(statusConfig[selectedDispute.status] || statusConfig.OPEN).label}
                  </span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Resolve Dialog */}
        <Dialog open={isResolveOpen} onOpenChange={setIsResolveOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Resolve Dispute</DialogTitle>
              <DialogDescription>
                Make a decision for this dispute
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <Label>Decision</Label>
                <RadioGroup value={decision} onValueChange={setDecision}>
                  <div className="flex items-center space-x-2 p-3 rounded-lg bg-secondary/50">
                    <RadioGroupItem value="REFUND_ALL_TO_BUYER" id="buyer" />
                    <Label htmlFor="buyer" className="flex-1 cursor-pointer">
                      Refund to Buyer
                      <p className="text-xs text-muted-foreground">Full refund to the buyer</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg bg-secondary/50">
                    <RadioGroupItem value="RELEASE_ALL_TO_SELLER" id="seller" />
                    <Label htmlFor="seller" className="flex-1 cursor-pointer">
                      Release to Seller
                      <p className="text-xs text-muted-foreground">Funds released to the seller</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg bg-secondary/50">
                    <RadioGroupItem value="SPLIT_SETTLEMENT" id="split" />
                    <Label htmlFor="split" className="flex-1 cursor-pointer">
                      Split Settlement
                      <p className="text-xs text-muted-foreground">Funds split between both parties</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg bg-secondary/50">
                    <RadioGroupItem value="CANCEL_VOID" id="cancel" />
                    <Label htmlFor="cancel" className="flex-1 cursor-pointer">
                      Cancel Transaction
                      <p className="text-xs text-muted-foreground">Transaction cancelled without penalty</p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label>Resolution Notes</Label>
                <Textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Explain the decision..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsResolveOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button className="btn-accent" onClick={handleResolve} disabled={isSubmitting}>
                {isSubmitting ? <Spinner className="w-4 h-4 animate-spin mr-2" weight="bold" /> : null}
                Resolve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
