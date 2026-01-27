/*
 * KAHADE TRANSACTIONS LIST PAGE
 * Icons: Phosphor Icons only
 */

import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import {
  Plus, MagnifyingGlass, ArrowUpRight, ArrowDownRight, Clock,
  CheckCircle, Warning, CaretRight, Calendar, Spinner
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { transactionApi } from '@/lib/api';

interface Transaction {
  id: string;
  orderNumber: string;
  title: string;
  amount: number;
  status: string;
  initiatorRole: string;
  counterparty?: { username: string };
  counterpartyId?: string;
  category: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  WAITING_COUNTERPARTY: { label: 'Waiting', color: 'text-amber-500 bg-amber-500/10', icon: Clock },
  PENDING_ACCEPT: { label: 'Pending', color: 'text-amber-500 bg-amber-500/10', icon: Clock },
  ACCEPTED: { label: 'Accepted', color: 'text-blue-500 bg-blue-500/10', icon: CheckCircle },
  PAID: { label: 'Paid', color: 'text-emerald-500 bg-emerald-500/10', icon: CheckCircle },
  DELIVERED: { label: 'Delivered', color: 'text-blue-500 bg-blue-500/10', icon: CheckCircle },
  COMPLETED: { label: 'Completed', color: 'text-emerald-500 bg-emerald-500/10', icon: CheckCircle },
  DISPUTED: { label: 'Disputed', color: 'text-red-500 bg-red-500/10', icon: Warning },
  CANCELLED: { label: 'Cancelled', color: 'text-gray-500 bg-gray-500/10', icon: Warning },
  REFUNDED: { label: 'Refunded', color: 'text-orange-500 bg-orange-500/10', icon: ArrowDownRight },
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter, roleFilter, page]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (roleFilter !== 'all') params.role = roleFilter.toUpperCase();

      const response = await transactionApi.list(params);
      const data = response.data;
      
      setTransactions(data.data || data.transactions || []);
      setTotalPages(Math.ceil((data.total || 0) / 20) || 1);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return tx.title.toLowerCase().includes(query) ||
      tx.orderNumber.toLowerCase().includes(query);
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Transactions" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Spinner className="w-8 h-8 animate-spin text-accent" weight="bold" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Transactions" subtitle="Manage all your transactions">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" weight="regular" />
              <Input
                placeholder="Search transactions..."
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
                <SelectItem value="WAITING_COUNTERPARTY">Waiting</SelectItem>
                <SelectItem value="PENDING_ACCEPT">Pending</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="DISPUTED">Disputed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
              <SelectTrigger className="w-36 bg-white border-border">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="buyer">Buyer</SelectItem>
                <SelectItem value="seller">Seller</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Link href="/app/transactions/new">
            <Button className="btn-accent">
              <Plus className="w-4 h-4 mr-2" weight="bold" />
              New Transaction
            </Button>
          </Link>
        </div>
        
        {/* Transactions List */}
        <div className="glass-card overflow-hidden">
          {filteredTransactions.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredTransactions.map((tx, index) => {
                const status = statusConfig[tx.status] || statusConfig.PENDING_ACCEPT;
                const isBuyer = tx.initiatorRole === 'BUYER';
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/app/transactions/${tx.id}`}>
                      <div className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors cursor-pointer">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isBuyer ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          {isBuyer ? <ArrowUpRight className="w-6 h-6" weight="bold" /> : <ArrowDownRight className="w-6 h-6" weight="bold" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-muted-foreground">{tx.orderNumber}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                          <div className="font-medium truncate">{tx.title}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <span>{isBuyer ? 'Buyer' : 'Seller'}</span>
                            <span>•</span>
                            <span>{tx.counterparty?.username || 'Waiting for counterparty'}</span>
                          </div>
                        </div>
                        
                        <div className="text-right hidden sm:block">
                          <div className="font-semibold">{formatCurrency(tx.amount)}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                            <Calendar className="w-3 h-3" weight="regular" />
                            {formatDate(tx.createdAt)}
                          </div>
                        </div>
                        
                        <CaretRight className="w-5 h-5 text-muted-foreground" weight="bold" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <MagnifyingGlass className="w-8 h-8 text-muted-foreground" weight="regular" />
              </div>
              <h3 className="font-semibold mb-2">No transactions</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'all' || roleFilter !== 'all'
                  ? 'No transactions match your filters.'
                  : 'You don\'t have any transactions yet.'}
              </p>
              <Link href="/app/transactions/new">
                <Button className="btn-accent">
                  <Plus className="w-4 h-4 mr-2" weight="bold" />
                  Create First Transaction
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
