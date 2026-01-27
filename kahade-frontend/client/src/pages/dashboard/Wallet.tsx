/*
 * KAHADE WALLET PAGE
 * Icons: Phosphor Icons only
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet as WalletIcon, ArrowUpRight, ArrowDownRight, Plus, 
  CreditCard, Bank, DeviceMobile, ClockCounterClockwise, Spinner
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { walletApi } from '@/lib/api';

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
  description: string;
  status: string;
  createdAt: string;
  referenceId?: string;
}

interface BankInfo {
  code: string;
  name: string;
  logo?: string;
}

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
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function Wallet() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [banks, setBanks] = useState<BankInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpMethod, setTopUpMethod] = useState('bank_transfer');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!topUpAmount || parseInt(topUpAmount) < 10) {
      toast.error('Minimum top up is $10');
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
    if (!withdrawAmount || parseInt(withdrawAmount) < 50) {
      toast.error('Minimum withdrawal is $50');
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

  const quickAmounts = [100, 250, 500, 1000];

  const filterTransactions = (type?: string) => {
    if (!type || type === 'all') return transactions;
    return transactions.filter(tx => {
      if (type === 'credit') return tx.type === 'CREDIT' || tx.type === 'credit' || tx.amount > 0;
      if (type === 'debit') return tx.type === 'DEBIT' || tx.type === 'debit' || tx.amount < 0;
      return true;
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Wallet" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Spinner className="w-8 h-8 animate-spin text-accent" weight="bold" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Wallet" subtitle="Manage your balance and transactions">
      <div className="space-y-6">
        {/* Balance Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
                <p className="text-3xl font-bold gradient-text">
                  {formatCurrency(balance?.available || 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <WalletIcon className="w-6 h-6 text-accent" weight="duotone" />
              </div>
            </div>
            <div className="flex gap-3">
              <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-accent flex-1">
                    <Plus className="w-4 h-4 mr-2" weight="bold" />
                    Top Up
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Top Up Balance</DialogTitle>
                    <DialogDescription>
                      Choose amount and payment method
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        value={topUpAmount}
                        onChange={(e) => setTopUpAmount(e.target.value)}
                        placeholder="Enter amount"
                        min="10"
                      />
                      <div className="flex gap-2 flex-wrap">
                        {quickAmounts.map((amount) => (
                          <Button
                            key={amount}
                            variant="outline"
                            size="sm"
                            onClick={() => setTopUpAmount(amount.toString())}
                          >
                            {formatCurrency(amount)}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button 
                          variant={topUpMethod === 'bank_transfer' ? 'default' : 'outline'} 
                          className="h-auto py-3 flex-col gap-1"
                          onClick={() => setTopUpMethod('bank_transfer')}
                        >
                          <Bank className="w-5 h-5" weight="duotone" />
                          <span className="text-xs">Bank Transfer</span>
                        </Button>
                        <Button 
                          variant={topUpMethod === 'card' ? 'default' : 'outline'} 
                          className="h-auto py-3 flex-col gap-1"
                          onClick={() => setTopUpMethod('card')}
                        >
                          <CreditCard className="w-5 h-5" weight="duotone" />
                          <span className="text-xs">Card</span>
                        </Button>
                        <Button 
                          variant={topUpMethod === 'ewallet' ? 'default' : 'outline'} 
                          className="h-auto py-3 flex-col gap-1"
                          onClick={() => setTopUpMethod('ewallet')}
                        >
                          <DeviceMobile className="w-5 h-5" weight="duotone" />
                          <span className="text-xs">E-Wallet</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsTopUpOpen(false)} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button className="btn-accent" onClick={handleTopUp} disabled={isSubmitting}>
                      {isSubmitting ? <Spinner className="w-4 h-4 animate-spin mr-2" weight="bold" /> : null}
                      Continue
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1 bg-white">
                    <ArrowUpRight className="w-4 h-4 mr-2" weight="bold" />
                    Withdraw
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Withdraw Funds</DialogTitle>
                    <DialogDescription>
                      Withdraw balance to your bank account
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Withdrawal Amount</Label>
                      <Input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="Enter amount"
                        min="50"
                      />
                      <p className="text-xs text-muted-foreground">
                        Available balance: {formatCurrency(balance?.available || 0)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Destination Bank</Label>
                      <Select value={selectedBank} onValueChange={setSelectedBank}>
                        <SelectTrigger>
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
                    <div className="space-y-2">
                      <Label>Account Number</Label>
                      <Input 
                        placeholder="Enter account number"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Holder Name</Label>
                      <Input 
                        placeholder="Enter name as on account"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsWithdrawOpen(false)} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button className="btn-accent" onClick={handleWithdraw} disabled={isSubmitting}>
                      {isSubmitting ? <Spinner className="w-4 h-4 animate-spin mr-2" weight="bold" /> : null}
                      Withdraw
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Locked Balance</p>
                <p className="text-3xl font-bold text-amber-500">
                  {formatCurrency(balance?.locked || 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <ClockCounterClockwise className="w-6 h-6 text-amber-500" weight="duotone" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Funds from transactions in progress. Will be available after transaction completion.
            </p>
          </motion.div>
        </div>
        
        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
          
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="credit">Incoming</TabsTrigger>
              <TabsTrigger value="debit">Outgoing</TabsTrigger>
            </TabsList>
            
            {['all', 'credit', 'debit'].map((tabValue) => (
              <TabsContent key={tabValue} value={tabValue} className="space-y-3">
                {filterTransactions(tabValue).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No transactions yet
                  </div>
                ) : (
                  filterTransactions(tabValue).map((tx) => {
                    const isCredit = tx.type === 'CREDIT' || tx.type === 'credit' || tx.amount > 0;
                    const displayAmount = Math.abs(tx.amount);
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCredit ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {isCredit ? <ArrowDownRight className="w-5 h-5" weight="bold" /> : <ArrowUpRight className="w-5 h-5" weight="bold" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{tx.description}</div>
                          <div className="text-sm text-muted-foreground">{formatDate(tx.createdAt)}</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${isCredit ? 'text-emerald-500' : 'text-red-500'}`}>
                            {isCredit ? '+' : '-'}{formatCurrency(displayAmount)}
                          </div>
                          <div className={`text-xs ${tx.status === 'completed' || tx.status === 'COMPLETED' ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {tx.status === 'completed' || tx.status === 'COMPLETED' ? 'Completed' : 'Pending'}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
