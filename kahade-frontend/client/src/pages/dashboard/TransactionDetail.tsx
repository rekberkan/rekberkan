/*
 * KAHADE TRANSACTION DETAIL PAGE
 * Icons: Phosphor Icons only
 */

import { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Clock, CheckCircle, Warning, Calendar,
  Copy, Spinner, XCircle, Package, CreditCard
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { transactionApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Transaction {
  id: string;
  orderNumber: string;
  title: string;
  description: string;
  amount: number;
  platformFee: number;
  status: string;
  initiatorRole: string;
  initiatorId: string;
  counterpartyId?: string;
  category: string;
  terms?: string;
  feePayer: string;
  createdAt: string;
  acceptedAt?: string;
  paidAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  disputedAt?: string;
  initiator?: { id: string; username: string; reputationScore?: number };
  counterparty?: { id: string; username: string; reputationScore?: number };
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  WAITING_COUNTERPARTY: { label: 'Waiting for Counterparty', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  PENDING_ACCEPT: { label: 'Pending Acceptance', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  ACCEPTED: { label: 'Accepted - Awaiting Payment', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  PAID: { label: 'Paid - Awaiting Delivery', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  DELIVERED: { label: 'Delivered - Awaiting Confirmation', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  COMPLETED: { label: 'Completed', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  DISPUTED: { label: 'In Dispute', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  CANCELLED: { label: 'Cancelled', color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
  REFUNDED: { label: 'Refunded', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString));
};

export default function TransactionDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchTransaction();
  }, [id]);

  const fetchTransaction = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const response = await transactionApi.get(id);
      setTransaction(response.data.transaction || response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load transaction');
      setLocation('/app/transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyOrderNumber = () => {
    if (transaction) {
      navigator.clipboard.writeText(transaction.orderNumber);
      toast.success('Order number copied');
    }
  };

  const handleAccept = async () => {
    if (!transaction) return;
    
    setIsActionLoading(true);
    try {
      await transactionApi.accept(transaction.id);
      toast.success('Transaction accepted!');
      fetchTransaction();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to accept transaction');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!transaction) return;
    
    setIsActionLoading(true);
    try {
      await transactionApi.reject(transaction.id, cancelReason);
      toast.success('Transaction rejected');
      setIsCancelOpen(false);
      fetchTransaction();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject transaction');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePay = async () => {
    if (!transaction) return;
    
    setIsActionLoading(true);
    try {
      await transactionApi.pay(transaction.id);
      toast.success('Payment successful!', {
        description: 'Funds are now held in escrow.'
      });
      fetchTransaction();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to process payment');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!transaction) return;
    
    setIsActionLoading(true);
    try {
      await transactionApi.confirmDelivery(transaction.id);
      toast.success('Delivery confirmed!');
      fetchTransaction();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to confirm delivery');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!transaction) return;
    
    setIsActionLoading(true);
    try {
      await transactionApi.confirmReceipt(transaction.id);
      toast.success('Transaction completed!', {
        description: 'Funds have been released to the seller.'
      });
      fetchTransaction();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to confirm receipt');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!transaction) return;
    
    setIsActionLoading(true);
    try {
      await transactionApi.cancel(transaction.id, cancelReason);
      toast.success('Transaction cancelled');
      setIsCancelOpen(false);
      fetchTransaction();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel transaction');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSubmitDispute = async () => {
    if (!transaction) return;
    
    if (!disputeReason.trim() || !disputeDescription.trim()) {
      toast.error('Please fill in the reason and description');
      return;
    }

    setIsActionLoading(true);
    try {
      await transactionApi.dispute(transaction.id, {
        reason: disputeReason,
        description: disputeDescription,
      });
      toast.success('Dispute submitted', {
        description: 'Our team will review within 1-3 business days.'
      });
      setIsDisputeOpen(false);
      setDisputeReason('');
      setDisputeDescription('');
      fetchTransaction();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit dispute');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner className="w-8 h-8 animate-spin text-accent" weight="bold" />
        </div>
      </DashboardLayout>
    );
  }

  if (!transaction) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Transaction not found</p>
          <Link href="/app/transactions">
            <Button className="mt-4">Back to Transactions</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const status = statusConfig[transaction.status] || statusConfig.PENDING_ACCEPT;
  const isBuyer = (transaction.initiatorRole === 'BUYER' && transaction.initiatorId === user?.id) ||
                  (transaction.initiatorRole === 'SELLER' && transaction.counterpartyId === user?.id);
  const isSeller = !isBuyer;
  const isInitiator = transaction.initiatorId === user?.id;
  const buyer = isBuyer ? (isInitiator ? transaction.initiator : transaction.counterparty) : (isInitiator ? transaction.counterparty : transaction.initiator);
  const seller = isSeller ? (isInitiator ? transaction.initiator : transaction.counterparty) : (isInitiator ? transaction.counterparty : transaction.initiator);

  // Build timeline
  const timeline = [];
  timeline.push({ status: 'CREATED', timestamp: transaction.createdAt, description: 'Transaction created' });
  if (transaction.acceptedAt) {
    timeline.push({ status: 'ACCEPTED', timestamp: transaction.acceptedAt, description: 'Transaction accepted' });
  }
  if (transaction.paidAt) {
    timeline.push({ status: 'PAID', timestamp: transaction.paidAt, description: 'Payment received' });
  }
  if (transaction.deliveredAt) {
    timeline.push({ status: 'DELIVERED', timestamp: transaction.deliveredAt, description: 'Item/service delivered' });
  }
  if (transaction.completedAt) {
    timeline.push({ status: 'COMPLETED', timestamp: transaction.completedAt, description: 'Transaction completed' });
  }
  if (transaction.cancelledAt) {
    timeline.push({ status: 'CANCELLED', timestamp: transaction.cancelledAt, description: 'Transaction cancelled' });
  }
  if (transaction.disputedAt) {
    timeline.push({ status: 'DISPUTED', timestamp: transaction.disputedAt, description: 'Dispute submitted' });
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Link href="/app/transactions">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" weight="bold" />
            Back to Transactions
          </Button>
        </Link>
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <button 
                  onClick={handleCopyOrderNumber}
                  className="font-mono text-sm text-muted-foreground hover:text-accent flex items-center gap-1"
                >
                  {transaction.orderNumber}
                  <Copy className="w-3 h-3" weight="bold" />
                </button>
                <span className={`text-xs px-3 py-1 rounded-full ${status.color} ${status.bgColor}`}>
                  {status.label}
                </span>
              </div>
              <h1 className="text-2xl font-bold mb-2">{transaction.title}</h1>
              <p className="text-muted-foreground">{transaction.description}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold gradient-text">
                {formatCurrency(transaction.amount)}
              </div>
              <div className="text-sm text-muted-foreground">
                + Platform fee {formatCurrency(transaction.platformFee)}
              </div>
            </div>
          </div>
        </motion.div>
        
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Parties */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6"
            >
              <h2 className="text-lg font-semibold mb-4">Parties Involved</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="text-sm text-muted-foreground mb-2">Buyer {isBuyer && '(You)'}</div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-semibold">
                      {buyer?.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="font-medium">{buyer?.username || 'Waiting'}</div>
                      {buyer?.reputationScore && (
                        <div className="text-sm text-muted-foreground">⭐ {buyer.reputationScore}</div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="text-sm text-muted-foreground mb-2">Seller {isSeller && '(You)'}</div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold">
                      {seller?.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="font-medium">{seller?.username || 'Waiting'}</div>
                      {seller?.reputationScore && (
                        <div className="text-sm text-muted-foreground">⭐ {seller.reputationScore}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <h2 className="text-lg font-semibold mb-4">Timeline</h2>
              <div className="space-y-4">
                {timeline.map((event, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-accent" weight="fill" />
                      </div>
                      {index < timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-accent/20 mt-2" />
                      )}
                    </div>
                    <div className="pb-4">
                      <div className="font-medium">{event.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(event.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            
            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6"
            >
              <h2 className="text-lg font-semibold mb-4">Actions</h2>
              <div className="flex flex-wrap gap-3">
                {/* Accept/Reject for counterparty on PENDING_ACCEPT */}
                {transaction.status === 'PENDING_ACCEPT' && !isInitiator && (
                  <>
                    <Button className="btn-accent" onClick={handleAccept} disabled={isActionLoading}>
                      {isActionLoading ? <Spinner className="w-4 h-4 mr-2 animate-spin" weight="bold" /> : <CheckCircle className="w-4 h-4 mr-2" weight="fill" />}
                      Accept Transaction
                    </Button>
                    <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="border-red-500/20 text-red-500 hover:bg-red-500/10">
                          <XCircle className="w-4 h-4 mr-2" weight="fill" />
                          Reject
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reject Transaction</DialogTitle>
                          <DialogDescription>Provide a reason for rejection (optional)</DialogDescription>
                        </DialogHeader>
                        <Textarea
                          placeholder="Reason for rejection..."
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          rows={3}
                        />
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsCancelOpen(false)}>Cancel</Button>
                          <Button className="bg-red-500 hover:bg-red-600" onClick={handleReject} disabled={isActionLoading}>
                            {isActionLoading ? <Spinner className="w-4 h-4 mr-2 animate-spin" weight="bold" /> : null}
                            Reject Transaction
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}

                {/* Pay for buyer on ACCEPTED */}
                {transaction.status === 'ACCEPTED' && isBuyer && (
                  <Button className="btn-accent" onClick={handlePay} disabled={isActionLoading}>
                    {isActionLoading ? <Spinner className="w-4 h-4 mr-2 animate-spin" weight="bold" /> : <CreditCard className="w-4 h-4 mr-2" weight="fill" />}
                    Pay Now
                  </Button>
                )}

                {/* Confirm Delivery for seller on PAID */}
                {transaction.status === 'PAID' && isSeller && (
                  <Button className="btn-accent" onClick={handleConfirmDelivery} disabled={isActionLoading}>
                    {isActionLoading ? <Spinner className="w-4 h-4 mr-2 animate-spin" weight="bold" /> : <Package className="w-4 h-4 mr-2" weight="fill" />}
                    Confirm Delivery
                  </Button>
                )}

                {/* Confirm Receipt for buyer on DELIVERED */}
                {transaction.status === 'DELIVERED' && isBuyer && (
                  <Button className="btn-accent" onClick={handleConfirmReceipt} disabled={isActionLoading}>
                    {isActionLoading ? <Spinner className="w-4 h-4 mr-2 animate-spin" weight="bold" /> : <CheckCircle className="w-4 h-4 mr-2" weight="fill" />}
                    Confirm Receipt
                  </Button>
                )}

                {/* Dispute option for buyer on PAID or DELIVERED */}
                {(transaction.status === 'PAID' || transaction.status === 'DELIVERED') && isBuyer && (
                  <Dialog open={isDisputeOpen} onOpenChange={setIsDisputeOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="border-red-500/20 text-red-500 hover:bg-red-500/10">
                        <Warning className="w-4 h-4 mr-2" weight="fill" />
                        Open Dispute
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Open Dispute</DialogTitle>
                        <DialogDescription>
                          Explain why you are opening a dispute for this transaction.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Reason</Label>
                          <Input
                            placeholder="Example: Item does not match description"
                            value={disputeReason}
                            onChange={(e) => setDisputeReason(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Detailed Description</Label>
                          <Textarea
                            placeholder="Describe the issue you experienced in detail..."
                            value={disputeDescription}
                            onChange={(e) => setDisputeDescription(e.target.value)}
                            rows={4}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDisputeOpen(false)}>Cancel</Button>
                        <Button className="bg-red-500 hover:bg-red-600" onClick={handleSubmitDispute} disabled={isActionLoading}>
                          {isActionLoading ? <Spinner className="w-4 h-4 mr-2 animate-spin" weight="bold" /> : null}
                          Submit Dispute
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {/* Cancel option for initiator on WAITING_COUNTERPARTY or PENDING_ACCEPT */}
                {(transaction.status === 'WAITING_COUNTERPARTY' || transaction.status === 'PENDING_ACCEPT') && isInitiator && (
                  <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="border-red-500/20 text-red-500 hover:bg-red-500/10">
                        <XCircle className="w-4 h-4 mr-2" weight="fill" />
                        Cancel
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cancel Transaction</DialogTitle>
                        <DialogDescription>Provide a reason for cancellation (optional)</DialogDescription>
                      </DialogHeader>
                      <Textarea
                        placeholder="Reason for cancellation..."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        rows={3}
                      />
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCancelOpen(false)}>Back</Button>
                        <Button className="bg-red-500 hover:bg-red-600" onClick={handleCancel} disabled={isActionLoading}>
                          {isActionLoading ? <Spinner className="w-4 h-4 mr-2 animate-spin" weight="bold" /> : null}
                          Cancel Transaction
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {/* No actions available */}
                {['COMPLETED', 'CANCELLED', 'REFUNDED', 'DISPUTED'].includes(transaction.status) && (
                  <p className="text-muted-foreground text-sm">No actions available for this transaction.</p>
                )}
              </div>
            </motion.div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Transaction Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-card p-6"
            >
              <h2 className="text-lg font-semibold mb-4">Transaction Info</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Category</div>
                  <div className="font-medium">{transaction.category}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Your Role</div>
                  <div className="font-medium">{isBuyer ? 'Buyer' : 'Seller'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Fee Paid By</div>
                  <div className="font-medium">
                    {transaction.feePayer === 'BUYER' ? 'Buyer' : 
                     transaction.feePayer === 'SELLER' ? 'Seller' : 'Split'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Created</div>
                  <div className="font-medium flex items-center gap-1">
                    <Calendar className="w-4 h-4" weight="regular" />
                    {formatDate(transaction.createdAt)}
                  </div>
                </div>
                {transaction.terms && (
                  <div>
                    <div className="text-sm text-muted-foreground">Terms & Conditions</div>
                    <div className="text-sm mt-1 p-3 rounded-lg bg-secondary/50">{transaction.terms}</div>
                  </div>
                )}
              </div>
            </motion.div>
            
            {/* Price Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <h2 className="text-lg font-semibold mb-4">Price Breakdown</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price</span>
                  <span>{formatCurrency(transaction.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform Fee</span>
                  <span>{formatCurrency(transaction.platformFee)}</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-accent">{formatCurrency(transaction.amount + transaction.platformFee)}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
