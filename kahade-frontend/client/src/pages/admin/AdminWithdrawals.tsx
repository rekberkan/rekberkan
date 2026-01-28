/*
 * KAHADE ADMIN WITHDRAWALS PAGE
 * Manage and approve/reject withdrawal requests
 * Icons: Phosphor Icons only
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDown, CheckCircle, XCircle, Clock, Spinner,
  User, Bank, MagnifyingGlass, Funnel, CurrencyDollar
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/api';

interface Withdrawal {
  id: string;
  userId: string;
  user: {
    username: string;
    email: string;
  };
  amount: number;
  fee: number;
  netAmount: number;
  bankAccount: {
    bankName: string;
    accountNumberLast4: string;
  };
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string;
  processedAt?: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'Pending', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  PROCESSING: { label: 'Processing', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  COMPLETED: { label: 'Completed', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  REJECTED: { label: 'Rejected', color: 'text-red-600', bgColor: 'bg-red-50' },
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchWithdrawals();
  }, [filter]);

  const fetchWithdrawals = async () => {
    setIsLoading(true);
    try {
      const params: any = { limit: 50 };
      if (filter !== 'all') params.status = filter;
      
      const response = await adminApi.getPendingWithdrawals(params);
      setWithdrawals(response.data.withdrawals || response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
      toast.error('Failed to load withdrawals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (withdrawal: Withdrawal) => {
    setIsSubmitting(true);
    try {
      await adminApi.approveWithdrawal(withdrawal.id);
      toast.success('Withdrawal approved successfully');
      fetchWithdrawals();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve withdrawal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await adminApi.rejectWithdrawal(selectedWithdrawal.id, rejectionReason);
      toast.success('Withdrawal rejected');
      setIsRejectOpen(false);
      setSelectedWithdrawal(null);
      setRejectionReason('');
      fetchWithdrawals();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject withdrawal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredWithdrawals = withdrawals.filter(w => 
    w.user.username.toLowerCase().includes(search.toLowerCase()) ||
    w.user.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    pending: withdrawals.filter(w => w.status === 'PENDING').length,
    pendingAmount: withdrawals.filter(w => w.status === 'PENDING').reduce((sum, w) => sum + w.amount, 0),
    completed: withdrawals.filter(w => w.status === 'COMPLETED').length,
    rejected: withdrawals.filter(w => w.status === 'REJECTED').length,
  };

  if (isLoading) {
    return (
      <AdminLayout title="Withdrawals" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Spinner className="w-8 h-8 animate-spin text-black" weight="bold" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Withdrawals" subtitle="Manage withdrawal requests">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-amber-600" weight="duotone" />
              <div>
                <div className="text-2xl font-bold text-amber-700">{stats.pending}</div>
                <div className="text-sm text-amber-600">Pending</div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-blue-50 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <CurrencyDollar className="w-8 h-8 text-blue-600" weight="duotone" />
              <div>
                <div className="text-lg font-bold text-blue-700">{formatCurrency(stats.pendingAmount)}</div>
                <div className="text-sm text-blue-600">Pending Amount</div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-emerald-50 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-emerald-600" weight="duotone" />
              <div>
                <div className="text-2xl font-bold text-emerald-700">{stats.completed}</div>
                <div className="text-sm text-emerald-600">Completed</div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-red-50 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-600" weight="duotone" />
              <div>
                <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
                <div className="text-sm text-red-600">Rejected</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" weight="regular" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username or email..."
              className="pl-10"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <Funnel className="w-4 h-4 mr-2" weight="regular" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Withdrawals Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden"
        >
          {filteredWithdrawals.length === 0 ? (
            <div className="text-center py-12">
              <ArrowDown className="w-16 h-16 mx-auto mb-4 text-[#9CA3AF]" weight="duotone" />
              <h4 className="text-lg font-semibold text-black mb-2">No Withdrawals</h4>
              <p className="text-[#6B7280]">No withdrawal requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F5F5F5]">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-black">User</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-black">Amount</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-black">Bank</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-black">Requested</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-black">Status</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-black">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5]">
                  {filteredWithdrawals.map((withdrawal) => {
                    const status = statusConfig[withdrawal.status];
                    return (
                      <tr key={withdrawal.id} className="hover:bg-[#FAFAFA]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center">
                              <User className="w-4 h-4 text-black" weight="regular" />
                            </div>
                            <div>
                              <div className="font-medium text-black">{withdrawal.user.username}</div>
                              <div className="text-sm text-[#6B7280]">{withdrawal.user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-black">{formatCurrency(withdrawal.amount)}</div>
                          <div className="text-sm text-[#6B7280]">Fee: {formatCurrency(withdrawal.fee)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Bank className="w-4 h-4 text-[#6B7280]" weight="regular" />
                            <div>
                              <div className="text-black">{withdrawal.bankAccount.bankName}</div>
                              <div className="text-sm text-[#6B7280]">****{withdrawal.bankAccount.accountNumberLast4}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#6B7280]">
                          {new Date(withdrawal.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${status.bgColor} ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {withdrawal.status === 'PENDING' && (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:border-red-600"
                                onClick={() => {
                                  setSelectedWithdrawal(withdrawal);
                                  setIsRejectOpen(true);
                                }}
                              >
                                <XCircle className="w-4 h-4" weight="bold" />
                              </Button>
                              <Button
                                size="sm"
                                className="btn-primary"
                                onClick={() => handleApprove(withdrawal)}
                                disabled={isSubmitting}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" weight="bold" />
                                Approve
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Reject Dialog */}
        <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Withdrawal</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejection. The funds will be returned to the user's wallet.
              </DialogDescription>
            </DialogHeader>
            {selectedWithdrawal && (
              <div className="py-4 space-y-4">
                <div className="p-4 rounded-xl bg-[#F5F5F5]">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[#6B7280]">User:</span>
                      <span className="ml-2 font-medium text-black">{selectedWithdrawal.user.username}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280]">Amount:</span>
                      <span className="ml-2 font-medium text-black">{formatCurrency(selectedWithdrawal.amount)}</span>
                    </div>
                  </div>
                </div>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  rows={4}
                />
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-red-500 hover:bg-red-600"
                onClick={handleReject}
                disabled={isSubmitting || !rejectionReason.trim()}
              >
                {isSubmitting ? 'Rejecting...' : 'Reject Withdrawal'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
