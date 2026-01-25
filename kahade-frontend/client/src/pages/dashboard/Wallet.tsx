/*
 * KAHADE WALLET PAGE
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet as WalletIcon, ArrowUpRight, ArrowDownRight, Plus, 
  CreditCard, Building2, Smartphone, History, Loader2
} from 'lucide-react';
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

interface Bank {
  code: string;
  name: string;
  logo?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
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
  const [banks, setBanks] = useState<Bank[]>([]);
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
      toast.error('Gagal memuat data wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopUp = async () => {
    if (!topUpAmount || parseInt(topUpAmount) < 10000) {
      toast.error('Minimal top up Rp 10.000');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await walletApi.topUp({
        amount: parseInt(topUpAmount),
        method: topUpMethod,
      });

      toast.success('Top up berhasil diproses!', {
        description: 'Silakan selesaikan pembayaran.',
      });

      // If there's a payment URL, redirect to it
      if (response.data.paymentUrl) {
        window.open(response.data.paymentUrl, '_blank');
      }

      setIsTopUpOpen(false);
      setTopUpAmount('');
      fetchWalletData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memproses top up');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseInt(withdrawAmount) < 50000) {
      toast.error('Minimal penarikan Rp 50.000');
      return;
    }

    if (!selectedBank || !accountNumber || !accountName) {
      toast.error('Lengkapi data rekening bank');
      return;
    }

    if (balance && parseInt(withdrawAmount) > balance.available) {
      toast.error('Saldo tidak mencukupi');
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

      toast.success('Penarikan diproses!', {
        description: 'Dana akan masuk dalam 1-3 hari kerja.',
      });

      setIsWithdrawOpen(false);
      setWithdrawAmount('');
      setSelectedBank('');
      setAccountNumber('');
      setAccountName('');
      fetchWalletData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memproses penarikan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickAmounts = [100000, 250000, 500000, 1000000];

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
      <DashboardLayout title="Wallet" subtitle="Memuat...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Wallet" subtitle="Kelola saldo dan transaksi keuangan Anda">
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
                <p className="text-sm text-muted-foreground mb-1">Saldo Tersedia</p>
                <p className="text-3xl font-display font-bold gradient-text">
                  {formatCurrency(balance?.available || 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <WalletIcon className="w-6 h-6 text-accent" />
              </div>
            </div>
            <div className="flex gap-3">
              <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-accent flex-1">
                    <Plus className="w-4 h-4 mr-2" />
                    Top Up
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Top Up Saldo</DialogTitle>
                    <DialogDescription>
                      Pilih nominal dan metode pembayaran
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nominal</Label>
                      <Input
                        type="number"
                        value={topUpAmount}
                        onChange={(e) => setTopUpAmount(e.target.value)}
                        placeholder="Masukkan nominal"
                        min="10000"
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
                      <Label>Metode Pembayaran</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button 
                          variant={topUpMethod === 'bank_transfer' ? 'default' : 'outline'} 
                          className="h-auto py-3 flex-col gap-1"
                          onClick={() => setTopUpMethod('bank_transfer')}
                        >
                          <Building2 className="w-5 h-5" />
                          <span className="text-xs">Transfer Bank</span>
                        </Button>
                        <Button 
                          variant={topUpMethod === 'card' ? 'default' : 'outline'} 
                          className="h-auto py-3 flex-col gap-1"
                          onClick={() => setTopUpMethod('card')}
                        >
                          <CreditCard className="w-5 h-5" />
                          <span className="text-xs">Kartu</span>
                        </Button>
                        <Button 
                          variant={topUpMethod === 'ewallet' ? 'default' : 'outline'} 
                          className="h-auto py-3 flex-col gap-1"
                          onClick={() => setTopUpMethod('ewallet')}
                        >
                          <Smartphone className="w-5 h-5" />
                          <span className="text-xs">E-Wallet</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsTopUpOpen(false)} disabled={isSubmitting}>
                      Batal
                    </Button>
                    <Button className="btn-accent" onClick={handleTopUp} disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Lanjutkan
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1 bg-white/5">
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    Tarik Dana
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tarik Dana</DialogTitle>
                    <DialogDescription>
                      Tarik saldo ke rekening bank Anda
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nominal Penarikan</Label>
                      <Input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="Masukkan nominal"
                        min="50000"
                      />
                      <p className="text-xs text-muted-foreground">
                        Saldo tersedia: {formatCurrency(balance?.available || 0)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Bank Tujuan</Label>
                      <Select value={selectedBank} onValueChange={setSelectedBank}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih bank" />
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
                      <Label>Nomor Rekening</Label>
                      <Input 
                        placeholder="Masukkan nomor rekening"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nama Pemilik Rekening</Label>
                      <Input 
                        placeholder="Masukkan nama sesuai rekening"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsWithdrawOpen(false)} disabled={isSubmitting}>
                      Batal
                    </Button>
                    <Button className="btn-accent" onClick={handleWithdraw} disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Tarik Dana
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
                <p className="text-sm text-muted-foreground mb-1">Saldo Terkunci</p>
                <p className="text-3xl font-display font-bold text-amber-500">
                  {formatCurrency(balance?.locked || 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <History className="w-6 h-6 text-amber-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Dana dari transaksi yang sedang dalam proses. Akan tersedia setelah transaksi selesai.
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
          <h2 className="text-lg font-display font-semibold mb-4">Riwayat Transaksi</h2>
          
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Semua</TabsTrigger>
              <TabsTrigger value="credit">Masuk</TabsTrigger>
              <TabsTrigger value="debit">Keluar</TabsTrigger>
            </TabsList>
            
            {['all', 'credit', 'debit'].map((tabValue) => (
              <TabsContent key={tabValue} value={tabValue} className="space-y-3">
                {filterTransactions(tabValue).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Belum ada transaksi
                  </div>
                ) : (
                  filterTransactions(tabValue).map((tx) => {
                    const isCredit = tx.type === 'CREDIT' || tx.type === 'credit' || tx.amount > 0;
                    const displayAmount = Math.abs(tx.amount);
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-white/5"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCredit ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {isCredit ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
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
                            {tx.status === 'completed' || tx.status === 'COMPLETED' ? 'Selesai' : 'Pending'}
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
