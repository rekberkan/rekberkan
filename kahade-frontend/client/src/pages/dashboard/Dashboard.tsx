/*
 * KAHADE USER DASHBOARD - Modern Design
 * Brand color: #000000
 */

import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import {
  Wallet, ArrowUpRight, ArrowDownRight, Clock, CheckCircle,
  Warning, Plus, ArrowRight, ShieldCheck, Spinner,
  CreditCard, Receipt, Lightning
} from '@phosphor-icons/react';
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

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  WAITING_COUNTERPARTY: { label: 'Waiting', color: 'text-[#6B7280] bg-[#F5F5F5]', icon: Clock },
  PENDING_ACCEPT: { label: 'Pending', color: 'text-[#6B7280] bg-[#F5F5F5]', icon: Clock },
  ACCEPTED: { label: 'Accepted', color: 'text-black bg-[#F5F5F5]', icon: CheckCircle },
  PAID: { label: 'Paid', color: 'text-black bg-[#F5F5F5]', icon: CheckCircle },
  COMPLETED: { label: 'Completed', color: 'text-white bg-black', icon: CheckCircle },
  DISPUTED: { label: 'Disputed', color: 'text-red-600 bg-red-50', icon: Warning },
  CANCELLED: { label: 'Cancelled', color: 'text-[#9CA3AF] bg-[#F5F5F5]', icon: Warning },
  REFUNDED: { label: 'Refunded', color: 'text-[#6B7280] bg-[#F5F5F5]', icon: ArrowDownRight },
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

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
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
      label: 'Wallet Balance', 
      value: balance ? formatCurrency(balance.available) : '-', 
      icon: Wallet, 
      color: 'text-black bg-[#F5F5F5]' 
    },
    { 
      label: 'Total Transactions', 
      value: stats.total.toString(), 
      icon: Receipt, 
      color: 'text-black bg-[#F5F5F5]' 
    },
    { 
      label: 'In Progress', 
      value: stats.inProgress.toString(), 
      icon: Clock, 
      color: 'text-black bg-[#F5F5F5]' 
    },
    { 
      label: 'Completed This Month', 
      value: stats.completedThisMonth.toString(), 
      icon: CheckCircle, 
      color: 'text-black bg-[#F5F5F5]' 
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Spinner className="w-8 h-8 animate-spin text-black" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard" subtitle={`Welcome back, ${user?.username || 'User'}!`}>
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboardStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl border border-[#E5E5E5] p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" weight="duotone" />
                </div>
              </div>
              <div className="text-2xl font-bold mb-1 text-black">{stat.value}</div>
              <div className="text-sm text-[#6B7280]">{stat.label}</div>
            </motion.div>
          ))}
        </div>
        
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-[#E5E5E5] p-6"
        >
          <h2 className="text-lg font-semibold mb-4 text-black">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/app/transactions/new">
              <Button className="w-full h-auto py-4 flex-col gap-2 btn-primary">
                <Plus className="w-5 h-5" weight="bold" />
                <span>New Transaction</span>
              </Button>
            </Link>
            <Link href="/app/wallet">
              <Button className="w-full h-auto py-4 flex-col gap-2 btn-secondary">
                <ArrowDownRight className="w-5 h-5" weight="bold" />
                <span>Top Up</span>
              </Button>
            </Link>
            <Link href="/app/wallet">
              <Button className="w-full h-auto py-4 flex-col gap-2 btn-secondary">
                <ArrowUpRight className="w-5 h-5" weight="bold" />
                <span>Withdraw</span>
              </Button>
            </Link>
            <Link href="/app/profile">
              <Button className="w-full h-auto py-4 flex-col gap-2 btn-secondary">
                <ShieldCheck className="w-5 h-5" weight="bold" />
                <span>Verify KYC</span>
              </Button>
            </Link>
          </div>
        </motion.div>
        
        {/* Lightning Feed & Recent Transactions */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl border border-[#E5E5E5] p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-black">Recent Transactions</h2>
              <Link href="/app/transactions">
                <Button variant="ghost" size="sm" className="text-black hover:text-[#6B7280]">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" weight="bold" />
                </Button>
              </Link>
            </div>
            
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-[#6B7280]">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No transactions yet</p>
                <Link href="/app/transactions/new">
                  <Button className="mt-4 btn-primary">
                    <Plus className="w-4 h-4 mr-2" weight="bold" />
                    Create First Transaction
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => {
                  const status = statusConfig[tx.status] || statusConfig.PENDING_ACCEPT;
                  const isBuyer = tx.initiatorRole === 'BUYER';
                  return (
                    <Link key={tx.id} href={`/app/transactions/${tx.id}`}>
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-[#FAFAFA] hover:bg-[#F5F5F5] transition-colors cursor-pointer border border-transparent hover:border-[#E5E5E5]">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isBuyer ? 'bg-[#F5F5F5] text-black' : 'bg-black text-white'}`}>
                          {isBuyer ? <ArrowUpRight className="w-5 h-5" weight="bold" /> : <ArrowDownRight className="w-5 h-5" weight="bold" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate text-black">{tx.title}</div>
                          <div className="text-sm text-[#6B7280]">
                            {isBuyer ? 'Buyer' : 'Seller'} • {tx.counterparty?.username || 'Waiting'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-black">{formatCurrency(tx.amount)}</div>
                          <div className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${status.color}`}>
                            <status.icon className="w-3 h-3" weight="fill" />
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
          
          {/* Lightning Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl border border-[#E5E5E5] p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-black">Lightning Feed</h2>
              <Lightning className="w-5 h-5 text-[#9CA3AF]" />
            </div>
            
            <div className="space-y-4">
              {[
                { icon: CheckCircle, text: 'Transaction #1234 completed', time: '2h ago', color: 'text-black' },
                { icon: CreditCard, text: 'Wallet topped up Rp 500.000', time: '5h ago', color: 'text-black' },
                { icon: ShieldCheck, text: 'KYC verification approved', time: '1d ago', color: 'text-black' },
                { icon: Plus, text: 'New transaction created', time: '2d ago', color: 'text-black' },
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-[#F5F5F5] flex items-center justify-center ${activity.color}`}>
                    <activity.icon className="w-4 h-4" weight="fill" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-black">{activity.text}</p>
                    <p className="text-xs text-[#9CA3AF]">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
        
        {/* KYC Reminder */}
        {user?.kycStatus !== 'VERIFIED' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-[#FAFAFA] rounded-xl border border-[#E5E5E5] p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-white" weight="duotone" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1 text-black">Verify Your Identity</h3>
                <p className="text-sm text-[#6B7280] mb-4">
                  Increase your transaction limits and access premium features with KYC verification.
                </p>
                <Link href="/app/profile">
                  <Button className="btn-primary">
                    Start Verification
                    <ArrowRight className="w-4 h-4 ml-2" weight="bold" />
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
