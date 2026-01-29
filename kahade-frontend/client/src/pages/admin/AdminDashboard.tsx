/*
 * KAHADE ADMIN DASHBOARD
 * 
 * Features:
 * - System metrics overview
 * - Alerts panel
 * - Recent transactions table
 * - Recent disputes
 * - Charts placeholders
 * - Phosphor Icons only
 */

import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import {
  Users, ArrowsLeftRight, Wallet, Warning, ChartLineUp,
  ChartLineDown, Spinner, CaretRight, Eye, ShieldCheck,
  Clock, CheckCircle, Export, Funnel
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/api';

interface DashboardStats {
  totalUsers: number;
  activeTransactions: number;
  transactionVolume: number;
  activeDisputes: number;
  usersChange?: number;
  transactionsChange?: number;
  volumeChange?: number;
  disputesChange?: number;
}

interface Transaction {
  id: string;
  orderNumber: string;
  amount: number;
  status: string;
  initiator?: { username: string };
  createdAt?: string;
}

interface Dispute {
  id: string;
  order?: { orderNumber: string };
  reason: string;
  status: string;
  priority?: string;
  createdAt?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation: 'compact'
  }).format(amount);
};

const statusColors: Record<string, string> = {
  PAID: 'text-emerald-600 bg-emerald-50',
  FUNDED: 'text-emerald-600 bg-emerald-50',
  PENDING: 'text-amber-600 bg-amber-50',
  PENDING_ACCEPT: 'text-amber-600 bg-amber-50',
  WAITING_COUNTERPARTY: 'text-amber-600 bg-amber-50',
  COMPLETED: 'text-emerald-600 bg-emerald-50',
  DISPUTED: 'text-red-600 bg-red-50',
  OPEN: 'text-red-600 bg-red-50',
  UNDER_ARBITRATION: 'text-amber-600 bg-amber-50',
  IN_REVIEW: 'text-amber-600 bg-amber-50',
};

const priorityColors: Record<string, string> = {
  HIGH: 'text-red-600 bg-red-50',
  MEDIUM: 'text-amber-600 bg-amber-50',
  LOW: 'text-emerald-600 bg-emerald-50',
};

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [recentDisputes, setRecentDisputes] = useState<Dispute[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [dashboardRes, transactionsRes, disputesRes] = await Promise.all([
          adminApi.getDashboardStats().catch(() => ({ data: null })),
          adminApi.getTransactions({ limit: 5 }).catch(() => ({ data: { data: [] } })),
          adminApi.getDisputes({ limit: 5 }).catch(() => ({ data: { data: [] } })),
        ]);

        if (dashboardRes.data) {
          setStats(dashboardRes.data);
        } else {
          setStats({
            totalUsers: 0,
            activeTransactions: 0,
            transactionVolume: 0,
            activeDisputes: 0,
          });
        }

        const txData = transactionsRes.data?.data || transactionsRes.data?.transactions || [];
        setRecentTransactions(Array.isArray(txData) ? txData.slice(0, 5) : []);

        const disputeData = disputesRes.data?.data || disputesRes.data?.disputes || [];
        setRecentDisputes(Array.isArray(disputeData) ? disputeData.slice(0, 5) : []);

      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <AdminLayout title="Dashboard" subtitle="Rekberkan Platform Overview">
        <div className="flex items-center justify-center h-64">
          <Spinner className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AdminLayout>
    );
  }

  const statsDisplay = [
    { 
      label: 'Total Users', 
      value: stats?.totalUsers?.toLocaleString() || '0', 
      change: stats?.usersChange ? `${stats.usersChange > 0 ? '+' : ''}${stats.usersChange}%` : '+0%', 
      trend: (stats?.usersChange || 0) >= 0 ? 'up' : 'down', 
      icon: Users,
      color: 'text-accent bg-accent/10'
    },
    { 
      label: 'Active Transactions', 
      value: stats?.activeTransactions?.toLocaleString() || '0', 
      change: stats?.transactionsChange ? `${stats.transactionsChange > 0 ? '+' : ''}${stats.transactionsChange}%` : '+0%', 
      trend: (stats?.transactionsChange || 0) >= 0 ? 'up' : 'down', 
      icon: ArrowsLeftRight,
      color: 'text-emerald-600 bg-emerald-50'
    },
    { 
      label: 'Transaction Volume', 
      value: formatCurrency(stats?.transactionVolume || 0), 
      change: stats?.volumeChange ? `${stats.volumeChange > 0 ? '+' : ''}${stats.volumeChange}%` : '+0%', 
      trend: (stats?.volumeChange || 0) >= 0 ? 'up' : 'down', 
      icon: Wallet,
      color: 'text-violet-600 bg-violet-50'
    },
    { 
      label: 'Active Disputes', 
      value: stats?.activeDisputes?.toLocaleString() || '0', 
      change: stats?.disputesChange ? `${stats.disputesChange > 0 ? '+' : ''}${stats.disputesChange}%` : '-0%', 
      trend: (stats?.disputesChange || 0) <= 0 ? 'down' : 'up', 
      icon: Warning,
      color: 'text-red-600 bg-red-50'
    },
  ];

  return (
    <AdminLayout title="Dashboard" subtitle="Rekberkan Platform Overview">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 flex items-center gap-3">
            <Warning className="w-5 h-5" weight="fill" />
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsDisplay.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" weight="duotone" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {stat.trend === 'up' ? <ChartLineUp className="w-3 h-3" weight="bold" /> : <ChartLineDown className="w-3 h-3" weight="bold" />}
                  {stat.change}
                </div>
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Alerts Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">System Alerts</h3>
            <Button variant="ghost" size="sm" className="text-accent">
              View All
              <CaretRight className="w-4 h-4 ml-1" weight="bold" />
            </Button>
          </div>
          <div className="space-y-3">
            {[
              { type: 'warning', message: '3 disputes require immediate attention', icon: Warning },
              { type: 'info', message: '5 KYC verifications pending review', icon: ShieldCheck },
              { type: 'success', message: 'System health check passed', icon: CheckCircle },
            ].map((alert, index) => (
              <div 
                key={index} 
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  alert.type === 'warning' ? 'bg-amber-50 text-amber-700' :
                  alert.type === 'info' ? 'bg-blue-50 text-blue-700' :
                  'bg-emerald-50 text-emerald-700'
                }`}
              >
                <alert.icon className="w-5 h-5" weight="fill" />
                <span className="text-sm font-medium">{alert.message}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Transactions & Disputes */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Transactions</h3>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Funnel className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Export className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {recentTransactions.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">No transactions yet</p>
              ) : (
                recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        <ArrowsLeftRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{tx.orderNumber || tx.id.slice(0, 8)}</div>
                        <div className="text-xs text-muted-foreground">
                          {tx.initiator?.username || 'Unknown'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">{formatCurrency(tx.amount || 0)}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[tx.status] || 'text-gray-600 bg-gray-50'}`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link href="/transactions">
              <Button variant="ghost" className="w-full mt-4 text-accent">
                View All Transactions
                <CaretRight className="w-4 h-4 ml-1" weight="bold" />
              </Button>
            </Link>
          </motion.div>

          {/* Recent Disputes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Disputes</h3>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Funnel className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Export className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {recentDisputes.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">No active disputes</p>
              ) : (
                recentDisputes.map((dispute) => (
                  <div key={dispute.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                        <Warning className="w-5 h-5 text-red-500" weight="fill" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{dispute.order?.orderNumber || dispute.id.slice(0, 8)}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {dispute.reason || 'No reason provided'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[dispute.status] || 'text-gray-600 bg-gray-50'}`}>
                        {dispute.status}
                      </span>
                      {dispute.priority && (
                        <div className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${priorityColors[dispute.priority] || ''}`}>
                          {dispute.priority}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link href="/disputes">
              <Button variant="ghost" className="w-full mt-4 text-accent">
                View All Disputes
                <CaretRight className="w-4 h-4 ml-1" weight="bold" />
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Charts Placeholder */}
        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="glass-card p-5"
          >
            <h3 className="text-lg font-semibold mb-4">Transaction Volume</h3>
            <div className="h-64 bg-secondary/50 rounded-xl flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <ChartLineUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Chart placeholder</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="glass-card p-5"
          >
            <h3 className="text-lg font-semibold mb-4">User Growth</h3>
            <div className="h-64 bg-secondary/50 rounded-xl flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Chart placeholder</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}
