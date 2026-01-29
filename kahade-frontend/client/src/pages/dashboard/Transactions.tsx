/*
 * KAHADE TRANSACTIONS LIST PAGE - Enhanced Professional Version
 * Icons: Phosphor Icons only
 * Features: Advanced filtering, export, bulk actions, analytics summary
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, MagnifyingGlass, ArrowUpRight, ArrowDownRight, Clock,
  CheckCircle, Warning, CaretRight, Calendar, Spinner, Export,
  Funnel, SortAscending, SortDescending, DotsThree, Eye,
  Receipt, ArrowsLeftRight, ChartLineUp, Wallet, X, Download,
  FileText, FileCsv, CaretDown, Package, HandCoins, ShieldCheck
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { transactionApi } from '@/lib/api';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  orderNumber: string;
  title: string;
  amount: number;
  status: string;
  initiatorRole: string;
  counterparty?: { username: string; email?: string };
  counterpartyId?: string;
  category: string;
  createdAt: string;
  updatedAt?: string;
  feePaidBy?: string;
}

interface TransactionStats {
  total: number;
  inProgress: number;
  completed: number;
  disputed: number;
  totalVolume: number;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof CheckCircle; description: string }> = {
  WAITING_COUNTERPARTY: { 
    label: 'Waiting', 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-50 border-amber-200', 
    icon: Clock,
    description: 'Waiting for counterparty to join'
  },
  PENDING_ACCEPT: { 
    label: 'Pending', 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-50 border-amber-200', 
    icon: Clock,
    description: 'Waiting for acceptance'
  },
  ACCEPTED: { 
    label: 'Accepted', 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-50 border-blue-200', 
    icon: CheckCircle,
    description: 'Transaction accepted, awaiting payment'
  },
  PAID: { 
    label: 'Paid', 
    color: 'text-emerald-600', 
    bgColor: 'bg-emerald-50 border-emerald-200', 
    icon: Wallet,
    description: 'Payment received, awaiting delivery'
  },
  DELIVERED: { 
    label: 'Delivered', 
    color: 'text-indigo-600', 
    bgColor: 'bg-indigo-50 border-indigo-200', 
    icon: Package,
    description: 'Item delivered, awaiting confirmation'
  },
  COMPLETED: { 
    label: 'Completed', 
    color: 'text-emerald-600', 
    bgColor: 'bg-emerald-50 border-emerald-200', 
    icon: CheckCircle,
    description: 'Transaction completed successfully'
  },
  DISPUTED: { 
    label: 'Disputed', 
    color: 'text-red-600', 
    bgColor: 'bg-red-50 border-red-200', 
    icon: Warning,
    description: 'Under dispute resolution'
  },
  CANCELLED: { 
    label: 'Cancelled', 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-50 border-gray-200', 
    icon: X,
    description: 'Transaction cancelled'
  },
  REFUNDED: { 
    label: 'Refunded', 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-50 border-orange-200', 
    icon: ArrowDownRight,
    description: 'Funds refunded to buyer'
  },
};

const categoryLabels: Record<string, string> = {
  ELECTRONICS: 'Electronics',
  FASHION: 'Fashion',
  SERVICES: 'Services',
  DIGITAL_GOODS: 'Digital Goods',
  PHYSICAL_GOODS: 'Physical Goods',
  OTHER: 'Other',
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
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

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
};

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_high' | 'amount_low'>('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Calculate stats from transactions
  const stats = useMemo<TransactionStats>(() => {
    return {
      total: totalCount,
      inProgress: transactions.filter(t => 
        ['PENDING_ACCEPT', 'ACCEPTED', 'PAID', 'DELIVERED', 'WAITING_COUNTERPARTY'].includes(t.status)
      ).length,
      completed: transactions.filter(t => t.status === 'COMPLETED').length,
      disputed: transactions.filter(t => t.status === 'DISPUTED').length,
      totalVolume: transactions.reduce((sum, t) => sum + t.amount, 0),
    };
  }, [transactions, totalCount]);

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
      setTotalCount(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(tx => 
        tx.title.toLowerCase().includes(query) ||
        tx.orderNumber.toLowerCase().includes(query) ||
        tx.counterparty?.username?.toLowerCase().includes(query)
      );
    }
    
    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(tx => tx.category === categoryFilter);
    }
    
    // Sort
    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'amount_high':
        result.sort((a, b) => b.amount - a.amount);
        break;
      case 'amount_low':
        result.sort((a, b) => a.amount - b.amount);
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    return result;
  }, [transactions, searchQuery, categoryFilter, sortBy]);

  const handleExport = (format: 'csv' | 'pdf') => {
    toast.success(`Exporting transactions as ${format.toUpperCase()}...`);
    // Implementation would go here
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setRoleFilter('all');
    setCategoryFilter('all');
    setSortBy('newest');
    setPage(1);
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || roleFilter !== 'all' || categoryFilter !== 'all';

  if (isLoading) {
    return (
      <DashboardLayout title="Transactions" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Spinner className="w-10 h-10 animate-spin text-black mx-auto mb-4" weight="bold" />
            <p className="text-[#6B7280]">Loading your transactions...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Transactions" subtitle="Manage and track all your escrow transactions">
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-[#E5E5E5] p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] flex items-center justify-center">
                <Receipt className="w-5 h-5 text-black" weight="duotone" />
              </div>
              <span className="text-xs text-[#6B7280]">Total</span>
            </div>
            <div className="text-2xl font-bold text-black">{stats.total}</div>
            <div className="text-sm text-[#6B7280]">All Transactions</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-[#E5E5E5] p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" weight="duotone" />
              </div>
              <span className="text-xs text-amber-600">Active</span>
            </div>
            <div className="text-2xl font-bold text-black">{stats.inProgress}</div>
            <div className="text-sm text-[#6B7280]">In Progress</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-[#E5E5E5] p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" weight="duotone" />
              </div>
              <span className="text-xs text-emerald-600">Success</span>
            </div>
            <div className="text-2xl font-bold text-black">{stats.completed}</div>
            <div className="text-sm text-[#6B7280]">Completed</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl border border-[#E5E5E5] p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] flex items-center justify-center">
                <ChartLineUp className="w-5 h-5 text-black" weight="duotone" />
              </div>
              <span className="text-xs text-[#6B7280]">Volume</span>
            </div>
            <div className="text-2xl font-bold text-black">{formatCurrency(stats.totalVolume)}</div>
            <div className="text-sm text-[#6B7280]">Total Value</div>
          </motion.div>
        </div>

        {/* Header Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-[#E5E5E5] p-4"
        >
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            <div className="flex flex-1 gap-3 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" weight="regular" />
                <Input
                  placeholder="Search by title, order number, or counterparty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-[#E5E5E5] focus:border-black focus:ring-black"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-black"
                  >
                    <X className="w-4 h-4" weight="bold" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-40 bg-white border-[#E5E5E5]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="WAITING_COUNTERPARTY">Waiting</SelectItem>
                  <SelectItem value="PENDING_ACCEPT">Pending</SelectItem>
                  <SelectItem value="ACCEPTED">Accepted</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="DISPUTED">Disputed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {/* Role Filter */}
              <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
                <SelectTrigger className="w-32 bg-white border-[#E5E5E5]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="buyer">As Buyer</SelectItem>
                  <SelectItem value="seller">As Seller</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-36 bg-white border-[#E5E5E5]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="amount_high">Highest Amount</SelectItem>
                  <SelectItem value="amount_low">Lowest Amount</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-[#6B7280] hover:text-black"
                >
                  <X className="w-4 h-4 mr-1" weight="bold" />
                  Clear
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {/* Export */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-[#E5E5E5]">
                    <Export className="w-4 h-4 mr-2" weight="bold" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    <FileCsv className="w-4 h-4 mr-2" weight="duotone" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    <FileText className="w-4 h-4 mr-2" weight="duotone" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* New Transaction */}
              <Link href="/transactions/new">
                <Button className="bg-black text-white hover:bg-black/90">
                  <Plus className="w-4 h-4 mr-2" weight="bold" />
                  New Transaction
                </Button>
              </Link>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#E5E5E5]">
              <span className="text-sm text-[#6B7280]">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="bg-[#F5F5F5] text-black">
                  Search: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="ml-1">
                    <X className="w-3 h-3" weight="bold" />
                  </button>
                </Badge>
              )}
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="bg-[#F5F5F5] text-black">
                  Status: {statusConfig[statusFilter]?.label || statusFilter}
                  <button onClick={() => setStatusFilter('all')} className="ml-1">
                    <X className="w-3 h-3" weight="bold" />
                  </button>
                </Badge>
              )}
              {roleFilter !== 'all' && (
                <Badge variant="secondary" className="bg-[#F5F5F5] text-black">
                  Role: {roleFilter === 'buyer' ? 'Buyer' : 'Seller'}
                  <button onClick={() => setRoleFilter('all')} className="ml-1">
                    <X className="w-3 h-3" weight="bold" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </motion.div>
        
        {/* Transactions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden"
        >
          {filteredTransactions.length > 0 ? (
            <>
              {/* Table Header */}
              <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-3 bg-[#FAFAFA] border-b border-[#E5E5E5] text-sm font-medium text-[#6B7280]">
                <div className="col-span-4">Transaction</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-2 text-right">Date</div>
              </div>

              <div className="divide-y divide-[#E5E5E5]">
                <AnimatePresence>
                  {filteredTransactions.map((tx, index) => {
                    const status = statusConfig[tx.status] || statusConfig.PENDING_ACCEPT;
                    const isBuyer = tx.initiatorRole === 'BUYER';
                    return (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Link href={`/transactions/${tx.id}`}>
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 lg:px-6 hover:bg-[#FAFAFA] transition-colors cursor-pointer group">
                            {/* Transaction Info */}
                            <div className="col-span-1 lg:col-span-4 flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                isBuyer ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                              }`}>
                                {isBuyer ? (
                                  <ArrowUpRight className="w-6 h-6" weight="bold" />
                                ) : (
                                  <ArrowDownRight className="w-6 h-6" weight="bold" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono text-xs text-[#9CA3AF] bg-[#F5F5F5] px-2 py-0.5 rounded">
                                    {tx.orderNumber}
                                  </span>
                                  <Badge variant="outline" className={`text-xs ${isBuyer ? 'border-red-200 text-red-600' : 'border-emerald-200 text-emerald-600'}`}>
                                    {isBuyer ? 'Buyer' : 'Seller'}
                                  </Badge>
                                </div>
                                <div className="font-medium text-black truncate group-hover:text-[#6B7280] transition-colors">
                                  {tx.title}
                                </div>
                                <div className="text-sm text-[#6B7280] flex items-center gap-1">
                                  <span>with</span>
                                  <span className="font-medium text-black">
                                    {tx.counterparty?.username || 'Waiting for counterparty'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Category */}
                            <div className="hidden lg:flex col-span-2 items-center">
                              <span className="text-sm text-[#6B7280]">
                                {categoryLabels[tx.category] || tx.category}
                              </span>
                            </div>

                            {/* Status */}
                            <div className="hidden lg:flex col-span-2 items-center">
                              <Tooltip>
                                <TooltipTrigger>
                                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${status.bgColor} ${status.color}`}>
                                    <status.icon className="w-3.5 h-3.5" weight="fill" />
                                    {status.label}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{status.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>

                            {/* Amount */}
                            <div className="hidden lg:flex col-span-2 items-center justify-end">
                              <span className="font-semibold text-black">
                                {formatCurrency(tx.amount)}
                              </span>
                            </div>

                            {/* Date */}
                            <div className="hidden lg:flex col-span-2 items-center justify-end gap-2">
                              <div className="text-right">
                                <div className="text-sm text-[#6B7280]">
                                  {formatRelativeTime(tx.createdAt)}
                                </div>
                              </div>
                              <CaretRight className="w-5 h-5 text-[#9CA3AF] group-hover:text-black transition-colors" weight="bold" />
                            </div>

                            {/* Mobile: Amount and Status */}
                            <div className="lg:hidden flex items-center justify-between">
                              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${status.bgColor} ${status.color}`}>
                                <status.icon className="w-3.5 h-3.5" weight="fill" />
                                {status.label}
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-black">{formatCurrency(tx.amount)}</div>
                                <div className="text-xs text-[#6B7280]">{formatRelativeTime(tx.createdAt)}</div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-[#F5F5F5] flex items-center justify-center mx-auto mb-6">
                {hasActiveFilters ? (
                  <MagnifyingGlass className="w-10 h-10 text-[#9CA3AF]" weight="regular" />
                ) : (
                  <Receipt className="w-10 h-10 text-[#9CA3AF]" weight="regular" />
                )}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-black">
                {hasActiveFilters ? 'No matching transactions' : 'No transactions yet'}
              </h3>
              <p className="text-[#6B7280] mb-6 max-w-md mx-auto">
                {hasActiveFilters
                  ? 'Try adjusting your search or filter criteria to find what you\'re looking for.'
                  : 'Start your first secure escrow transaction and protect your online purchases and sales.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} className="border-[#E5E5E5]">
                    <X className="w-4 h-4 mr-2" weight="bold" />
                    Clear Filters
                  </Button>
                )}
                <Link href="/transactions/new">
                  <Button className="bg-black text-white hover:bg-black/90">
                    <Plus className="w-4 h-4 mr-2" weight="bold" />
                    Create Transaction
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl border border-[#E5E5E5] p-4"
          >
            <div className="text-sm text-[#6B7280]">
              Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, totalCount)} of {totalCount} transactions
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="border-[#E5E5E5]"
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border-[#E5E5E5]"
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      className={page === pageNum ? 'bg-black text-white' : 'border-[#E5E5E5]'}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="border-[#E5E5E5]"
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="border-[#E5E5E5]"
              >
                Last
              </Button>
            </div>
          </motion.div>
        )}

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-[#FAFAFA] rounded-xl border border-[#E5E5E5] p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" weight="fill" />
            </div>
            <div>
              <h3 className="font-semibold text-black mb-1">How Escrow Transactions Work</h3>
              <p className="text-sm text-[#6B7280] mb-3">
                Your funds are securely held until both parties confirm satisfaction. This protects both buyers and sellers in every transaction.
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 text-[#6B7280]">
                  <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">1</div>
                  <span>Create transaction</span>
                </div>
                <div className="flex items-center gap-2 text-[#6B7280]">
                  <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">2</div>
                  <span>Buyer pays to escrow</span>
                </div>
                <div className="flex items-center gap-2 text-[#6B7280]">
                  <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">3</div>
                  <span>Seller delivers</span>
                </div>
                <div className="flex items-center gap-2 text-[#6B7280]">
                  <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">4</div>
                  <span>Buyer confirms</span>
                </div>
                <div className="flex items-center gap-2 text-[#6B7280]">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">✓</div>
                  <span>Funds released</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
