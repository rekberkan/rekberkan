/*
 * REKBERKAN USER DASHBOARD - Enhanced Professional Version
 * Brand color: #000000
 * Features: Advanced analytics, activity feed, quick actions, notifications
 */

import { useEffect, useState, useMemo } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import {
  Wallet, ArrowUpRight, ArrowDownRight, Clock, CheckCircle,
  Warning, Plus, ArrowRight, ShieldCheck, Spinner, TrendUp,
  CreditCard, Receipt, Lightning, Bell, Eye, EyeSlash,
  ChartLineUp, ChartLineDown, Users, Star, Calendar,
  CaretRight, Package, HandCoins, Scales, Pulse,
  ArrowsLeftRight, Bank, IdentificationBadge, Gift
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { walletApi, transactionApi, notificationApi, userApi } from '@/lib/api';

interface WalletBalance {
  available: number;
  locked: number;
  total: number;
  currency: string;
}

interface Transaction {
  id: string;
  orderNumber: string;
  title: string;
  amount: number;
  status: string;
  initiatorRole: string;
  counterparty?: { username: string };
  createdAt: string;
  category?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface UserStats {
  totalTransactions: number;
  completedTransactions: number;
  totalVolume: number;
  rating: number;
  ratingCount: number;
  kycStatus: string;
  memberSince: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof CheckCircle }> = {
  WAITING_COUNTERPARTY: { label: 'Waiting', color: 'text-amber-600', bgColor: 'bg-amber-50', icon: Clock },
  PENDING_ACCEPT: { label: 'Pending', color: 'text-amber-600', bgColor: 'bg-amber-50', icon: Clock },
  ACCEPTED: { label: 'Accepted', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: CheckCircle },
  PAID: { label: 'Paid', color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: CheckCircle },
  DELIVERED: { label: 'Delivered', color: 'text-indigo-600', bgColor: 'bg-indigo-50', icon: Package },
  COMPLETED: { label: 'Completed', color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: CheckCircle },
  DISPUTED: { label: 'Disputed', color: 'text-red-600', bgColor: 'bg-red-50', icon: Warning },
  CANCELLED: { label: 'Cancelled', color: 'text-gray-600', bgColor: 'bg-gray-50', icon: Warning },
  REFUNDED: { label: 'Refunded', color: 'text-orange-600', bgColor: 'bg-orange-50', icon: ArrowDownRight },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCompactCurrency(amount: number): string {
  if (amount >= 1000000000) {
    return `Rp ${(amount / 1000000000).toFixed(1)}B`;
  }
  if (amount >= 1000000) {
    return `Rp ${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `Rp ${(amount / 1000).toFixed(0)}K`;
  }
  return formatCurrency(amount);
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('id-ID');
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Calculate stats from transactions
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const thisMonthTx = transactions.filter(t => new Date(t.createdAt) >= monthStart);
    const lastMonthTx = transactions.filter(t => {
      const date = new Date(t.createdAt);
      return date >= lastMonthStart && date <= lastMonthEnd;
    });

    const inProgress = transactions.filter(t => 
      ['PENDING_ACCEPT', 'ACCEPTED', 'PAID', 'DELIVERED', 'WAITING_COUNTERPARTY'].includes(t.status)
    ).length;

    const completedThisMonth = thisMonthTx.filter(t => t.status === 'COMPLETED').length;
    const completedLastMonth = lastMonthTx.filter(t => t.status === 'COMPLETED').length;

    const volumeThisMonth = thisMonthTx.reduce((sum, t) => sum + t.amount, 0);
    const volumeLastMonth = lastMonthTx.reduce((sum, t) => sum + t.amount, 0);

    const volumeChange = volumeLastMonth > 0 
      ? ((volumeThisMonth - volumeLastMonth) / volumeLastMonth * 100).toFixed(0)
      : volumeThisMonth > 0 ? '+100' : '0';

    const txChange = completedLastMonth > 0
      ? ((completedThisMonth - completedLastMonth) / completedLastMonth * 100).toFixed(0)
      : completedThisMonth > 0 ? '+100' : '0';

    return {
      total: transactions.length,
      inProgress,
      completedThisMonth,
      volumeThisMonth,
      volumeChange: parseInt(volumeChange),
      txChange: parseInt(txChange),
    };
  }, [transactions]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [balanceRes, transactionsRes, notificationsRes, statsRes] = await Promise.all([
          walletApi.getBalance().catch(() => ({ data: null })),
          transactionApi.list({ limit: 10 }).catch(() => ({ data: { data: [] } })),
          notificationApi.list({ limit: 5 }).catch(() => ({ data: { data: [] } })),
          userApi.getStats().catch(() => ({ data: null })),
        ]);

        setBalance(balanceRes.data);
        
        const txData = transactionsRes.data.data || transactionsRes.data.transactions || transactionsRes.data;
        setTransactions(Array.isArray(txData) ? txData : []);

        const notifData = notificationsRes.data.data || notificationsRes.data.notifications || [];
        setNotifications(Array.isArray(notifData) ? notifData.slice(0, 5) : []);
        setUnreadCount(notifData.filter((n: Notification) => !n.read).length);

        if (statsRes.data) {
          setUserStats(statsRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Pending actions that need user attention
  const pendingActions = useMemo(() => {
    const actions = [];
    
    // KYC verification
    if (!userStats?.kycStatus || userStats.kycStatus === 'PENDING' || userStats.kycStatus === 'NOT_SUBMITTED') {
      actions.push({
        id: 'kyc',
        title: 'Complete KYC Verification',
        description: 'Verify your identity to unlock all features',
        icon: IdentificationBadge,
        link: '/kyc',
        priority: 'high',
      });
    }

    // Transactions needing action
    const needsAction = transactions.filter(t => 
      (t.initiatorRole === 'BUYER' && t.status === 'DELIVERED') ||
      (t.initiatorRole === 'SELLER' && t.status === 'PAID') ||
      t.status === 'PENDING_ACCEPT'
    );

    needsAction.forEach(tx => {
      if (tx.status === 'DELIVERED' && tx.initiatorRole === 'BUYER') {
        actions.push({
          id: `confirm-${tx.id}`,
          title: 'Confirm Receipt',
          description: `"${tx.title}" - Please confirm you received the item`,
          icon: Package,
          link: `/transactions/${tx.id}`,
          priority: 'medium',
        });
      } else if (tx.status === 'PAID' && tx.initiatorRole === 'SELLER') {
        actions.push({
          id: `deliver-${tx.id}`,
          title: 'Confirm Delivery',
          description: `"${tx.title}" - Mark as delivered after sending`,
          icon: HandCoins,
          link: `/transactions/${tx.id}`,
          priority: 'medium',
        });
      } else if (tx.status === 'PENDING_ACCEPT') {
        actions.push({
          id: `accept-${tx.id}`,
          title: 'Accept Transaction',
          description: `"${tx.title}" - Review and accept invitation`,
          icon: ArrowsLeftRight,
          link: `/transactions/${tx.id}`,
          priority: 'high',
        });
      }
    });

    return actions.slice(0, 3);
  }, [transactions, userStats]);

  const quickActions = [
    { 
      title: 'New Transaction', 
      description: 'Create a secure escrow deal',
      icon: Plus, 
      link: '/transactions/new',
      color: 'bg-black text-white hover:bg-black/90'
    },
    { 
      title: 'Top Up', 
      description: 'Add funds to wallet',
      icon: ArrowDownRight, 
      link: '/wallet',
      color: 'bg-white text-black border border-[#E5E5E5] hover:bg-[#F5F5F5]'
    },
    { 
      title: 'Withdraw', 
      description: 'Transfer to bank',
      icon: ArrowUpRight, 
      link: '/wallet',
      color: 'bg-white text-black border border-[#E5E5E5] hover:bg-[#F5F5F5]'
    },
    { 
      title: 'Referrals', 
      description: 'Invite & earn rewards',
      icon: Gift, 
      link: '/referrals',
      color: 'bg-white text-black border border-[#E5E5E5] hover:bg-[#F5F5F5]'
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Spinner className="w-10 h-10 animate-spin text-black mx-auto mb-4" weight="bold" />
            <p className="text-[#6B7280]">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Dashboard" 
      subtitle={`${getGreeting()}, ${user?.username || 'User'}!`}
    >
      <div className="space-y-6">
        {/* Welcome Banner with Balance */}
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-5 h-5 text-white/70" weight="duotone" />
                  <span className="text-white/70 text-sm">Available Balance</span>
                  <button 
                    onClick={() => setShowBalance(!showBalance)}
                    className="text-white/50 hover:text-white transition-colors"
                  >
                    {showBalance ? <Eye className="w-4 h-4" /> : <EyeSlash className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-4xl md:text-5xl font-bold mb-2">
                  {showBalance ? formatCurrency(balance?.available || 0) : '••••••••'}
                </div>
                {balance?.locked && balance.locked > 0 && (
                  <div className="text-white/60 text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" weight="fill" />
                    {formatCurrency(balance.locked)} locked in escrow
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/wallet">
                  <Button className="bg-white text-black hover:bg-white/90">
                    <ArrowDownRight className="w-4 h-4 mr-2" weight="bold" />
                    Top Up
                  </Button>
                </Link>
                <Link href="/wallet">
                  <Button className="bg-white/10 text-white hover:bg-white/20 border border-white/20">
                    <ArrowUpRight className="w-4 h-4 mr-2" weight="bold" />
                    Withdraw
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
              <div>
                <div className="text-white/60 text-sm mb-1">This Month</div>
                <div className="text-xl font-semibold">{stats.completedThisMonth} completed</div>
              </div>
              <div>
                <div className="text-white/60 text-sm mb-1">In Progress</div>
                <div className="text-xl font-semibold">{stats.inProgress} active</div>
              </div>
              <div>
                <div className="text-white/60 text-sm mb-1">Volume</div>
                <div className="text-xl font-semibold flex items-center gap-2">
                  {formatCompactCurrency(stats.volumeThisMonth)}
                  {stats.volumeChange !== 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${stats.volumeChange > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                      {stats.volumeChange > 0 ? '+' : ''}{stats.volumeChange}%
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-white/60 text-sm mb-1">Rating</div>
                <div className="text-xl font-semibold flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-400" weight="fill" />
                  {userStats?.rating?.toFixed(1) || '5.0'}
                  <span className="text-white/60 text-sm">({userStats?.ratingCount || 0})</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pending Actions */}
        {pendingActions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-amber-50 border border-amber-200 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Warning className="w-5 h-5 text-amber-600" weight="fill" />
              <h3 className="font-semibold text-amber-900">Actions Required</h3>
              <Badge className="bg-amber-200 text-amber-800">{pendingActions.length}</Badge>
            </div>
            <div className="space-y-2">
              {pendingActions.map((action) => (
                <Link key={action.id} href={action.link}>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-amber-200 hover:border-amber-400 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <action.icon className="w-5 h-5 text-amber-600" weight="duotone" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-black">{action.title}</div>
                      <div className="text-sm text-[#6B7280] truncate">{action.description}</div>
                    </div>
                    <CaretRight className="w-5 h-5 text-[#9CA3AF] group-hover:text-black transition-colors" weight="bold" />
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-[#E5E5E5] p-6"
        >
          <h2 className="text-lg font-semibold mb-4 text-black">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link key={action.title} href={action.link}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  className={`p-4 rounded-xl flex flex-col items-center text-center gap-2 transition-all cursor-pointer ${action.color}`}
                >
                  <action.icon className="w-6 h-6" weight="bold" />
                  <div>
                    <div className="font-medium text-sm">{action.title}</div>
                    <div className="text-xs opacity-70">{action.description}</div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-white rounded-xl border border-[#E5E5E5] p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-black">Recent Transactions</h2>
              <Link href="/transactions">
                <Button variant="ghost" size="sm" className="text-black hover:text-[#6B7280]">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" weight="bold" />
                </Button>
              </Link>
            </div>
            
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[#F5F5F5] flex items-center justify-center mx-auto mb-4">
                  <Receipt className="w-8 h-8 text-[#9CA3AF]" weight="regular" />
                </div>
                <h3 className="font-semibold mb-2 text-black">No transactions yet</h3>
                <p className="text-sm text-[#6B7280] mb-4">Start your first secure escrow transaction</p>
                <Link href="/transactions/new">
                  <Button className="bg-black text-white hover:bg-black/90">
                    <Plus className="w-4 h-4 mr-2" weight="bold" />
                    Create Transaction
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 5).map((tx, index) => {
                  const status = statusConfig[tx.status] || statusConfig.PENDING_ACCEPT;
                  const isBuyer = tx.initiatorRole === 'BUYER';
                  return (
                    <Link key={tx.id} href={`/transactions/${tx.id}`}>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                        className="flex items-center gap-4 p-4 rounded-xl bg-[#FAFAFA] hover:bg-[#F5F5F5] transition-colors cursor-pointer border border-transparent hover:border-[#E5E5E5] group"
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                          isBuyer ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {isBuyer ? (
                            <ArrowUpRight className="w-6 h-6" weight="bold" />
                          ) : (
                            <ArrowDownRight className="w-6 h-6" weight="bold" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-black truncate group-hover:text-[#6B7280] transition-colors">
                            {tx.title}
                          </div>
                          <div className="text-sm text-[#6B7280] flex items-center gap-2">
                            <span>{isBuyer ? 'Buying from' : 'Selling to'}</span>
                            <span className="font-medium text-black">
                              {tx.counterparty?.username || 'Waiting...'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-semibold text-black">{formatCurrency(tx.amount)}</div>
                          <div className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${status.bgColor} ${status.color}`}>
                            <status.icon className="w-3 h-3" weight="fill" />
                            {status.label}
                          </div>
                        </div>
                        <CaretRight className="w-5 h-5 text-[#9CA3AF] group-hover:text-black transition-colors shrink-0" weight="bold" />
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Notifications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl border border-[#E5E5E5] p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-black">Notifications</h2>
                  {unreadCount > 0 && (
                    <Badge className="bg-red-500 text-white">{unreadCount}</Badge>
                  )}
                </div>
                <Link href="/notifications">
                  <Button variant="ghost" size="sm" className="text-black hover:text-[#6B7280]">
                    <Bell className="w-4 h-4" weight="bold" />
                  </Button>
                </Link>
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-6">
                  <Bell className="w-10 h-10 text-[#9CA3AF] mx-auto mb-2" weight="regular" />
                  <p className="text-sm text-[#6B7280]">No new notifications</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 4).map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-lg ${notif.read ? 'bg-[#FAFAFA]' : 'bg-blue-50 border border-blue-100'}`}
                    >
                      <div className="font-medium text-sm text-black line-clamp-1">{notif.title}</div>
                      <div className="text-xs text-[#6B7280] line-clamp-2 mt-1">{notif.message}</div>
                      <div className="text-xs text-[#9CA3AF] mt-2">{formatTimeAgo(notif.createdAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Account Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl border border-[#E5E5E5] p-6"
            >
              <h2 className="text-lg font-semibold mb-4 text-black">Account Status</h2>
              
              <div className="space-y-4">
                {/* KYC Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      userStats?.kycStatus === 'VERIFIED' ? 'bg-emerald-50' : 'bg-amber-50'
                    }`}>
                      <IdentificationBadge className={`w-5 h-5 ${
                        userStats?.kycStatus === 'VERIFIED' ? 'text-emerald-600' : 'text-amber-600'
                      }`} weight="duotone" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-black">KYC Verification</div>
                      <div className="text-xs text-[#6B7280]">
                        {userStats?.kycStatus === 'VERIFIED' ? 'Verified' : 'Not verified'}
                      </div>
                    </div>
                  </div>
                  {userStats?.kycStatus !== 'VERIFIED' && (
                    <Link href="/kyc">
                      <Button size="sm" variant="outline" className="border-[#E5E5E5]">
                        Verify
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Security */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F5F5F5] flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-black" weight="duotone" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-black">Security</div>
                      <div className="text-xs text-[#6B7280]">2FA enabled</div>
                    </div>
                  </div>
                  <Link href="/settings">
                    <Button size="sm" variant="ghost" className="text-[#6B7280]">
                      Manage
                    </Button>
                  </Link>
                </div>

                {/* Bank Account */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F5F5F5] flex items-center justify-center">
                      <Bank className="w-5 h-5 text-black" weight="duotone" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-black">Bank Account</div>
                      <div className="text-xs text-[#6B7280]">For withdrawals</div>
                    </div>
                  </div>
                  <Link href="/bank-accounts">
                    <Button size="sm" variant="ghost" className="text-[#6B7280]">
                      Add
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Help Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-[#FAFAFA] rounded-xl border border-[#E5E5E5] p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center shrink-0">
                  <Lightning className="w-6 h-6 text-white" weight="fill" />
                </div>
                <div>
                  <h3 className="font-semibold text-black mb-1">Need Help?</h3>
                  <p className="text-sm text-[#6B7280] mb-3">
                    Our support team is available 24/7 to assist you with any questions.
                  </p>
                  <Link href="/help">
                    <Button size="sm" variant="outline" className="border-[#E5E5E5]">
                      Get Support
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
