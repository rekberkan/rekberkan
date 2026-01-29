/*
 * REKBERKAN WALLET PAGE - Enhanced Professional Version
 * Brand color: #000000
 * Features: Balance overview, top-up, withdrawal, transaction history, analytics
 */

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet as WalletIcon, ArrowUpRight, ArrowDownRight, Clock, CheckCircle,
  Warning, Plus, ArrowRight, ShieldCheck, Spinner, Eye, EyeSlash,
  CreditCard, Receipt, Bank, Copy, Check, X, CaretRight,
  CurrencyCircleDollar, ChartLineUp, CalendarBlank, Funnel,
  DownloadSimple, QrCode, Info, Lightning, ArrowsLeftRight,
  DeviceMobile, ClockCounterClockwise
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { walletApi, bankApi } from '@/lib/api';
import { toast } from 'sonner';

interface WalletBalance {
  available: number;
  locked: number;
  total: number;
  currency: string;
}

interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  reference?: string;
  referenceId?: string;
  createdAt: string;
  metadata?: {
    transactionId?: string;
    bankName?: string;
    accountNumber?: string;
  };
}

interface BankAccount {
  id: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
  isVerified: boolean;
}

interface BankInfo {
  code: string;
  name: string;
  logo?: string;
}

const transactionTypeConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof ArrowUpRight }> = {
  TOPUP: { label: 'Top Up', color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: ArrowDownRight },
  CREDIT: { label: 'Credit', color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: ArrowDownRight },
  credit: { label: 'Credit', color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: ArrowDownRight },
  WITHDRAWAL: { label: 'Withdrawal', color: 'text-red-600', bgColor: 'bg-red-50', icon: ArrowUpRight },
  DEBIT: { label: 'Debit', color: 'text-red-600', bgColor: 'bg-red-50', icon: ArrowUpRight },
  debit: { label: 'Debit', color: 'text-red-600', bgColor: 'bg-red-50', icon: ArrowUpRight },
  ESCROW_LOCK: { label: 'Escrow Lock', color: 'text-amber-600', bgColor: 'bg-amber-50', icon: Clock },
  ESCROW_RELEASE: { label: 'Escrow Release', color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: CheckCircle },
  ESCROW_REFUND: { label: 'Refund', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: ArrowDownRight },
  FEE: { label: 'Fee', color: 'text-gray-600', bgColor: 'bg-gray-50', icon: Receipt },
  BONUS: { label: 'Bonus', color: 'text-purple-600', bgColor: 'bg-purple-50', icon: Lightning },
  REFERRAL: { label: 'Referral', color: 'text-indigo-600', bgColor: 'bg-indigo-50', icon: ArrowsLeftRight },
};

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'Pending', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  PROCESSING: { label: 'Processing', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  COMPLETED: { label: 'Completed', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  SUCCESS: { label: 'Success', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  FAILED: { label: 'Failed', color: 'text-red-600', bgColor: 'bg-red-50' },
  CANCELLED: { label: 'Cancelled', color: 'text-gray-600', bgColor: 'bg-gray-50' },
};

const topUpAmounts = [50000, 100000, 250000, 500000, 1000000, 2500000];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function formatRelativeTime(dateString: string): string {
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
}

export default function Wallet() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [banks, setBanks] = useState<BankInfo[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  
  // Top-up state
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpMethod, setTopUpMethod] = useState('bank_transfer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Withdrawal state
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  
  // Filter state
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Stats calculation
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const thisMonthTx = transactions.filter(t => new Date(t.createdAt) >= monthStart);
    
    const totalIn = thisMonthTx
      .filter(t => ['TOPUP', 'CREDIT', 'credit', 'ESCROW_RELEASE', 'ESCROW_REFUND', 'BONUS', 'REFERRAL'].includes(t.type))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const totalOut = thisMonthTx
      .filter(t => ['WITHDRAWAL', 'DEBIT', 'debit', 'ESCROW_LOCK', 'FEE'].includes(t.type))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const pendingWithdrawals = transactions
      .filter(t => t.type === 'WITHDRAWAL' && t.status === 'PENDING')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return { totalIn, totalOut, pendingWithdrawals };
  }, [transactions]);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const [balanceRes, transactionsRes, banksRes] = await Promise.all([
        walletApi.getBalance(),
        walletApi.getTransactions({ limit: 20 }),
        walletApi.getBanks(),
      ]);

      setBalance(balanceRes.data);
      setTransactions(transactionsRes.data.data || transactionsRes.data.transactions || []);
      setBanks(banksRes.data.banks || banksRes.data || []);
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopUp = async () => {
    const amount = parseInt(topUpAmount);
    if (!topUpAmount || amount < 10000) {
      toast.error('Minimum top up is Rp 10,000');
      return;
    }
    if (amount > 100000000) {
      toast.error('Maximum top up is Rp 100,000,000');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await walletApi.topUp({
        amount: parseInt(topUpAmount),
        method: topUpMethod,
      });

      toast.success('Top up processed!', {
        description: 'Please complete the payment.',
      });

      if (response.data.paymentUrl) {
        window.open(response.data.paymentUrl, '_blank');
      }

      setIsTopUpOpen(false);
      setTopUpAmount('');
      fetchWalletData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to process top up');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount);
    if (!withdrawAmount || amount < 50000) {
      toast.error('Minimum withdrawal is Rp 50,000');
      return;
    }
    if (amount > 50000000) {
      toast.error('Maximum withdrawal is Rp 50,000,000');
      return;
    }

    if (!selectedBank || !accountNumber || !accountName) {
      toast.error('Please complete bank account details');
      return;
    }

    if (balance && parseInt(withdrawAmount) > balance.available) {
      toast.error('Insufficient balance');
      return;
    }

    setIsSubmitting(true);
    try {
      await walletApi.withdraw({
        amount: parseInt(withdrawAmount),
        bankCode: selectedBank,
        accountNumber,
        accountName,
      });

      toast.success('Withdrawal processed!', {
        description: 'Funds will arrive in 1-3 business days.',
      });

      setIsWithdrawOpen(false);
      setWithdrawAmount('');
      setSelectedBank('');
      setAccountNumber('');
      setAccountName('');
      fetchWalletData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to process withdrawal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filterTransactions = (type?: string) => {
    if (!type || type === 'all') return transactions;
    return transactions.filter(tx => {
      if (type === 'credit') return ['TOPUP', 'CREDIT', 'credit', 'ESCROW_RELEASE', 'ESCROW_REFUND', 'BONUS', 'REFERRAL'].includes(tx.type) || tx.amount > 0;
      if (type === 'debit') return ['WITHDRAWAL', 'DEBIT', 'debit', 'ESCROW_LOCK', 'FEE'].includes(tx.type) || tx.amount < 0;
      return true;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Wallet" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Spinner className="w-10 h-10 animate-spin text-black mx-auto mb-4" weight="bold" />
            <p className="text-[#6B7280]">Loading your wallet...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Wallet" subtitle="Manage your funds and transactions">
      <div className="space-y-6">
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black rounded-2xl p-6 md:p-8 text-white relative overflow-hidden"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '32px 32px'
            }} />
          </div>

          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              {/* Balance Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <WalletIcon className="w-5 h-5 text-white/70" weight="duotone" />
                  <span className="text-white/70 text-sm">Total Balance</span>
                  <button 
                    onClick={() => setShowBalance(!showBalance)}
                    className="text-white/50 hover:text-white transition-colors"
                  >
                    {showBalance ? <Eye className="w-4 h-4" /> : <EyeSlash className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-4xl md:text-5xl font-bold mb-4">
                  {showBalance ? formatCurrency((balance?.available || 0) + (balance?.locked || 0)) : '••••••••'}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                      <CheckCircle className="w-4 h-4" weight="fill" />
                      Available
                    </div>
                    <div className="text-xl font-semibold">
                      {showBalance ? formatCurrency(balance?.available || 0) : '••••••'}
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                      <Clock className="w-4 h-4" weight="fill" />
                      In Escrow
                    </div>
                    <div className="text-xl font-semibold">
                      {showBalance ? formatCurrency(balance?.locked || 0) : '••••••'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 lg:min-w-[200px]">
                <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-white text-black hover:bg-white/90 w-full justify-center">
                      <ArrowDownRight className="w-5 h-5 mr-2" weight="bold" />
                      Top Up
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <ArrowDownRight className="w-5 h-5" weight="bold" />
                        Top Up Balance
                      </DialogTitle>
                      <DialogDescription>
                        Choose amount and payment method
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      {/* Amount Selection */}
                      <div className="space-y-3">
                        <Label>Select Amount</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {topUpAmounts.map((amount) => (
                            <Button
                              key={amount}
                              type="button"
                              variant={topUpAmount === amount.toString() ? 'default' : 'outline'}
                              className={topUpAmount === amount.toString() ? 'bg-black text-white' : 'border-[#E5E5E5]'}
                              onClick={() => setTopUpAmount(amount.toString())}
                            >
                              {formatCurrency(amount).replace('Rp', 'Rp ')}
                            </Button>
                          ))}
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]">Rp</span>
                          <Input
                            type="number"
                            placeholder="Or enter custom amount"
                            value={topUpAmount}
                            onChange={(e) => setTopUpAmount(e.target.value)}
                            className="pl-10 border-[#E5E5E5]"
                          />
                        </div>
                      </div>

                      {/* Payment Method */}
                      <div className="space-y-3">
                        <Label>Payment Method</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Button 
                            variant={topUpMethod === 'bank_transfer' ? 'default' : 'outline'} 
                            className={`h-auto py-3 flex-col gap-1 ${topUpMethod === 'bank_transfer' ? 'bg-black text-white' : 'border-[#E5E5E5]'}`}
                            onClick={() => setTopUpMethod('bank_transfer')}
                          >
                            <Bank className="w-5 h-5" weight="duotone" />
                            <span className="text-xs">Bank Transfer</span>
                          </Button>
                          <Button 
                            variant={topUpMethod === 'card' ? 'default' : 'outline'} 
                            className={`h-auto py-3 flex-col gap-1 ${topUpMethod === 'card' ? 'bg-black text-white' : 'border-[#E5E5E5]'}`}
                            onClick={() => setTopUpMethod('card')}
                          >
                            <CreditCard className="w-5 h-5" weight="duotone" />
                            <span className="text-xs">Card</span>
                          </Button>
                          <Button 
                            variant={topUpMethod === 'ewallet' ? 'default' : 'outline'} 
                            className={`h-auto py-3 flex-col gap-1 ${topUpMethod === 'ewallet' ? 'bg-black text-white' : 'border-[#E5E5E5]'}`}
                            onClick={() => setTopUpMethod('ewallet')}
                          >
                            <DeviceMobile className="w-5 h-5" weight="duotone" />
                            <span className="text-xs">E-Wallet</span>
                          </Button>
                        </div>
                      </div>

                      {/* Summary */}
                      {topUpAmount && parseInt(topUpAmount) >= 10000 && (
                        <div className="bg-[#F5F5F5] rounded-lg p-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-[#6B7280]">Amount</span>
                            <span className="font-medium">{formatCurrency(parseInt(topUpAmount))}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-[#6B7280]">Admin Fee</span>
                            <span className="font-medium">Rp 0</span>
                          </div>
                          <div className="border-t border-[#E5E5E5] pt-2 flex justify-between">
                            <span className="font-medium">Total</span>
                            <span className="font-bold">{formatCurrency(parseInt(topUpAmount))}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsTopUpOpen(false)} disabled={isSubmitting} className="border-[#E5E5E5]">
                        Cancel
                      </Button>
                      <Button onClick={handleTopUp} disabled={isSubmitting} className="bg-black text-white hover:bg-black/90">
                        {isSubmitting ? <Spinner className="w-4 h-4 animate-spin mr-2" weight="bold" /> : null}
                        Continue to Payment
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-white/10 text-white hover:bg-white/20 border border-white/20 w-full justify-center"
                      disabled={!balance?.available || balance.available < 50000}
                    >
                      <ArrowUpRight className="w-5 h-5 mr-2" weight="bold" />
                      Withdraw
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <ArrowUpRight className="w-5 h-5" weight="bold" />
                        Withdraw Funds
                      </DialogTitle>
                      <DialogDescription>
                        Withdraw balance to your bank account
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      {/* Available Balance */}
                      <div className="bg-[#F5F5F5] rounded-lg p-4">
                        <div className="text-sm text-[#6B7280] mb-1">Available Balance</div>
                        <div className="text-2xl font-bold">{formatCurrency(balance?.available || 0)}</div>
                      </div>

                      {/* Amount */}
                      <div className="space-y-2">
                        <Label>Withdrawal Amount</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]">Rp</span>
                          <Input
                            type="number"
                            placeholder="Enter amount (min. Rp 50,000)"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            className="pl-10 border-[#E5E5E5]"
                          />
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setWithdrawAmount((balance?.available || 0).toString())}
                          className="text-black"
                        >
                          Withdraw All
                        </Button>
                      </div>

                      {/* Bank Selection */}
                      <div className="space-y-2">
                        <Label>Destination Bank</Label>
                        <Select value={selectedBank} onValueChange={setSelectedBank}>
                          <SelectTrigger className="border-[#E5E5E5]">
                            <SelectValue placeholder="Select bank" />
                          </SelectTrigger>
                          <SelectContent>
                            {banks.map((bank) => (
                              <SelectItem key={bank.code} value={bank.code}>
                                {bank.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Account Number */}
                      <div className="space-y-2">
                        <Label>Account Number</Label>
                        <Input 
                          placeholder="Enter account number"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          className="border-[#E5E5E5]"
                        />
                      </div>

                      {/* Account Name */}
                      <div className="space-y-2">
                        <Label>Account Holder Name</Label>
                        <Input 
                          placeholder="Enter name as on account"
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                          className="border-[#E5E5E5]"
                        />
                      </div>

                      {/* Summary */}
                      {withdrawAmount && parseInt(withdrawAmount) >= 50000 && (
                        <div className="bg-[#F5F5F5] rounded-lg p-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-[#6B7280]">Withdrawal Amount</span>
                            <span className="font-medium">{formatCurrency(parseInt(withdrawAmount))}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-[#6B7280]">Admin Fee</span>
                            <span className="font-medium">Rp 5,000</span>
                          </div>
                          <div className="border-t border-[#E5E5E5] pt-2 flex justify-between">
                            <span className="font-medium">You'll Receive</span>
                            <span className="font-bold">{formatCurrency(parseInt(withdrawAmount) - 5000)}</span>
                          </div>
                        </div>
                      )}

                      {/* Notice */}
                      <div className="flex items-start gap-2 text-sm text-[#6B7280]">
                        <Info className="w-4 h-4 shrink-0 mt-0.5" weight="fill" />
                        <p>Withdrawals are processed within 1-3 business days. Minimum withdrawal is Rp 50,000.</p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsWithdrawOpen(false)} disabled={isSubmitting} className="border-[#E5E5E5]">
                        Cancel
                      </Button>
                      <Button onClick={handleWithdraw} disabled={isSubmitting} className="bg-black text-white hover:bg-black/90">
                        {isSubmitting ? <Spinner className="w-4 h-4 animate-spin mr-2" weight="bold" /> : null}
                        Request Withdrawal
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-[#E5E5E5] p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-emerald-600" weight="bold" />
              </div>
              <span className="text-xs text-[#6B7280]">This Month</span>
            </div>
            <div className="text-2xl font-bold text-black">{formatCurrency(stats.totalIn)}</div>
            <div className="text-sm text-[#6B7280]">Money In</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-[#E5E5E5] p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-red-600" weight="bold" />
              </div>
              <span className="text-xs text-[#6B7280]">This Month</span>
            </div>
            <div className="text-2xl font-bold text-black">{formatCurrency(stats.totalOut)}</div>
            <div className="text-sm text-[#6B7280]">Money Out</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl border border-[#E5E5E5] p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <ClockCounterClockwise className="w-5 h-5 text-amber-600" weight="bold" />
              </div>
              <span className="text-xs text-[#6B7280]">Processing</span>
            </div>
            <div className="text-2xl font-bold text-black">{formatCurrency(stats.pendingWithdrawals)}</div>
            <div className="text-sm text-[#6B7280]">Pending Withdrawals</div>
          </motion.div>
        </div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden"
        >
          <div className="p-6 border-b border-[#E5E5E5]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-black">Transaction History</h2>
              <Button variant="outline" className="border-[#E5E5E5]">
                <DownloadSimple className="w-4 h-4 mr-2" weight="bold" />
                Export
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6 pt-4">
              <TabsList className="bg-[#F5F5F5] p-1 rounded-lg">
                <TabsTrigger value="all" className="rounded-md data-[state=active]:bg-white">All</TabsTrigger>
                <TabsTrigger value="credit" className="rounded-md data-[state=active]:bg-white">Incoming</TabsTrigger>
                <TabsTrigger value="debit" className="rounded-md data-[state=active]:bg-white">Outgoing</TabsTrigger>
              </TabsList>
            </div>

            {['all', 'credit', 'debit'].map((tabValue) => (
              <TabsContent key={tabValue} value={tabValue} className="mt-0">
                {filterTransactions(tabValue).length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#F5F5F5] flex items-center justify-center mx-auto mb-4">
                      <Receipt className="w-8 h-8 text-[#9CA3AF]" weight="regular" />
                    </div>
                    <h3 className="font-semibold mb-2 text-black">No transactions yet</h3>
                    <p className="text-sm text-[#6B7280] mb-4">
                      Your wallet transaction history will appear here
                    </p>
                    <Button onClick={() => setIsTopUpOpen(true)} className="bg-black text-white hover:bg-black/90">
                      <ArrowDownRight className="w-4 h-4 mr-2" weight="bold" />
                      Top Up Now
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-[#E5E5E5]">
                    {filterTransactions(tabValue).map((tx, index) => {
                      const typeConf = transactionTypeConfig[tx.type] || transactionTypeConfig.FEE;
                      const statusConf = statusConfig[tx.status] || statusConfig.PENDING;
                      const isCredit = ['TOPUP', 'CREDIT', 'credit', 'ESCROW_RELEASE', 'ESCROW_REFUND', 'BONUS', 'REFERRAL'].includes(tx.type) || tx.amount > 0;
                      
                      return (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="flex items-center gap-4 p-4 hover:bg-[#FAFAFA] transition-colors"
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeConf.bgColor}`}>
                            <typeConf.icon className={`w-5 h-5 ${typeConf.color}`} weight="bold" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-black">{typeConf.label}</div>
                            <div className="text-sm text-[#6B7280] truncate">{tx.description}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className={`font-semibold ${isCredit ? 'text-emerald-600' : 'text-red-600'}`}>
                              {isCredit ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                            </div>
                            <div className="text-xs text-[#6B7280]">{formatRelativeTime(tx.createdAt)}</div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#FAFAFA] rounded-xl border border-[#E5E5E5] p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" weight="fill" />
            </div>
            <div>
              <h3 className="font-semibold text-black mb-1">Your Funds Are Protected</h3>
              <p className="text-sm text-[#6B7280]">
                All funds are held in segregated accounts with bank-level security. 
                Escrow funds are released only when both parties confirm the transaction is complete.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
