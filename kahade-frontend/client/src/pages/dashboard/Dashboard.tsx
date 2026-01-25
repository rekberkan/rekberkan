/*
 * KAHADE USER DASHBOARD
 * Design: Overview with stats, recent transactions, quick actions
 */

import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import {
  Wallet, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2,
  AlertCircle, Plus, ArrowRight, TrendingUp, Shield, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { walletApi, transactionApi } from '@/lib/api';

interface WalletBalance {
  available: number;
  locked: number;
  total: number;
  currency: string;
}

interface Transaction {
  id: string;
  title: string;
  amount: number;
  status: string;
  initiatorRole: string;
  counterparty?: { username: string };
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  WAITING_COUNTERPARTY: { label: 'Menunggu', color: 'text-amber-500 bg-amber-500/10', icon: Clock },
  PENDING_ACCEPT: { label: 'Menunggu', color: 'text-amber-500 bg-amber-500/10', icon: Clock },
  ACCEPTED: { label: 'Diterima', color: 'text-blue-500 bg-blue-500/10', icon: CheckCircle2 },
  PAID: { label: 'Dibayar', color: 'text-emerald-500 bg-emerald-500/10', icon: CheckCircle2 },
  COMPLETED: { label: 'Selesai', color: 'text-emerald-500 bg-emerald-500/10', icon: CheckCircle2 },
  DISPUTED: { label: 'Dispute', color: 'text-red-500 bg-red-500/10', icon: AlertCircle },
  CANCELLED: { label: 'Dibatalkan', color: 'text-gray-500 bg-gray-500/10', icon: AlertCircle },
  REFUNDED: { label: 'Refund', color: 'text-orange-500 bg-orange-500/10', icon: ArrowDownRight },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return date.toLocaleDateString('id-ID');
}

export default function Dashboard() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completedThisMonth: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [balanceRes, transactionsRes] = await Promise.all([
          walletApi.getBalance(),
          transactionApi.list({ limit: 5 }),
        ]);

        setBalance(balanceRes.data);
        
        const txData = transactionsRes.data.data || transactionsRes.data.transactions || transactionsRes.data;
        setTransactions(Array.isArray(txData) ? txData : []);

        // Calculate stats from transactions
        const allTx = Array.isArray(txData) ? txData : [];
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        setStats({
          total: transactionsRes.data.total || allTx.length,
          inProgress: allTx.filter((t: Transaction) => 
            ['PENDING_ACCEPT', 'ACCEPTED', 'PAID', 'WAITING_COUNTERPARTY'].includes(t.status)
          ).length,
          completedThisMonth: allTx.filter((t: Transaction) => 
            t.status === 'COMPLETED' && new Date(t.createdAt) >= monthStart
          ).length,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const dashboardStats = [
    { 
      label: 'Saldo Wallet', 
      value: balance ? formatCurrency(balance.available) : '-', 
      icon: Wallet, 
      change: '', 
      color: 'text-accent' 
    },
    { 
      label: 'Total Transaksi', 
      value: stats.total.toString(), 
      icon: TrendingUp, 
      change: '', 
      color: 'text-emerald-500' 
    },
    { 
      label: 'Dalam Proses', 
      value: stats.inProgress.toString(), 
      icon: Clock, 
      change: '', 
      color: 'text-amber-500' 
    },
    { 
      label: 'Selesai Bulan Ini', 
      value: stats.completedThisMonth.toString(), 
      icon: CheckCircle2, 
      change: '', 
      color: 'text-emerald-500' 
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Memuat...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard" subtitle={`Selamat datang, ${user?.username || 'User'}!`}>
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboardStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                {stat.change && (
                  <span className="text-xs text-emerald-500 font-medium">{stat.change}</span>
                )}
              </div>
              <div className="text-2xl font-display font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
        
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h2 className="text-lg font-display font-semibold mb-4">Aksi Cepat</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/app/transactions/new">
              <Button className="w-full h-auto py-4 flex-col gap-2 btn-accent">
                <Plus className="w-5 h-5" />
                <span>Transaksi Baru</span>
              </Button>
            </Link>
            <Link href="/app/wallet">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 bg-white/5">
                <ArrowDownRight className="w-5 h-5" />
                <span>Top Up</span>
              </Button>
            </Link>
            <Link href="/app/wallet">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 bg-white/5">
                <ArrowUpRight className="w-5 h-5" />
                <span>Tarik Dana</span>
              </Button>
            </Link>
            <Link href="/app/profile">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 bg-white/5">
                <Shield className="w-5 h-5" />
                <span>Verifikasi KYC</span>
              </Button>
            </Link>
          </div>
        </motion.div>
        
        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-display font-semibold">Transaksi Terbaru</h2>
            <Link href="/app/transactions">
              <Button variant="ghost" size="sm" className="text-accent">
                Lihat Semua
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Belum ada transaksi</p>
              <Link href="/app/transactions/new">
                <Button className="mt-4 btn-accent">
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Transaksi Pertama
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => {
                const status = statusConfig[tx.status] || statusConfig.PENDING_ACCEPT;
                const isBuyer = tx.initiatorRole === 'BUYER';
                return (
                  <Link key={tx.id} href={`/app/transactions/${tx.id}`}>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isBuyer ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {isBuyer ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{tx.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {isBuyer ? 'Pembeli' : 'Penjual'} • {tx.counterparty?.username || 'Menunggu'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(tx.amount)}</div>
                        <div className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${status.color}`}>
                          <status.icon className="w-3 h-3" />
                          {status.label}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </motion.div>
        
        {/* KYC Reminder */}
        {user?.kycStatus !== 'VERIFIED' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card p-6 border-amber-500/20"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold mb-1">Verifikasi Identitas Anda</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Tingkatkan limit transaksi dan akses fitur premium dengan verifikasi KYC.
                </p>
                <Link href="/app/profile">
                  <Button className="btn-secondary">
                    Mulai Verifikasi
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
