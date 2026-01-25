/*
 * KAHADE ADMIN DASHBOARD
 * Real data from API
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, ArrowLeftRight, Wallet, AlertTriangle, TrendingUp,
  TrendingDown, Loader2
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
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
}

interface Dispute {
  id: string;
  order?: { orderNumber: string };
  reason: string;
  status: string;
  priority?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    notation: 'compact'
  }).format(amount);
};

const statusColors: Record<string, string> = {
  PAID: 'text-emerald-500 bg-emerald-500/10',
  FUNDED: 'text-emerald-500 bg-emerald-500/10',
  PENDING: 'text-amber-500 bg-amber-500/10',
  PENDING_ACCEPT: 'text-amber-500 bg-amber-500/10',
  WAITING_COUNTERPARTY: 'text-amber-500 bg-amber-500/10',
  COMPLETED: 'text-emerald-500 bg-emerald-500/10',
  DISPUTED: 'text-red-500 bg-red-500/10',
  OPEN: 'text-red-500 bg-red-500/10',
  UNDER_ARBITRATION: 'text-amber-500 bg-amber-500/10',
  IN_REVIEW: 'text-amber-500 bg-amber-500/10',
};

const priorityColors: Record<string, string> = {
  HIGH: 'text-red-500',
  MEDIUM: 'text-amber-500',
  LOW: 'text-emerald-500',
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
          // Fallback mock data if API fails
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
        setError('Gagal memuat data dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <AdminLayout title="Dashboard" subtitle="Overview platform Kahade">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AdminLayout>
    );
  }

  const statsDisplay = [
    { 
      label: 'Total Pengguna', 
      value: stats?.totalUsers?.toLocaleString() || '0', 
      change: stats?.usersChange ? `${stats.usersChange > 0 ? '+' : ''}${stats.usersChange}%` : '+0%', 
      trend: (stats?.usersChange || 0) >= 0 ? 'up' : 'down', 
      icon: Users 
    },
    { 
      label: 'Transaksi Aktif', 
      value: stats?.activeTransactions?.toLocaleString() || '0', 
      change: stats?.transactionsChange ? `${stats.transactionsChange > 0 ? '+' : ''}${stats.transactionsChange}%` : '+0%', 
      trend: (stats?.transactionsChange || 0) >= 0 ? 'up' : 'down', 
      icon: ArrowLeftRight 
    },
    { 
      label: 'Volume Transaksi', 
      value: formatCurrency(stats?.transactionVolume || 0), 
      change: stats?.volumeChange ? `${stats.volumeChange > 0 ? '+' : ''}${stats.volumeChange}%` : '+0%', 
      trend: (stats?.volumeChange || 0) >= 0 ? 'up' : 'down', 
      icon: Wallet 
    },
    { 
      label: 'Dispute Aktif', 
      value: stats?.activeDisputes?.toLocaleString() || '0', 
      change: stats?.disputesChange ? `${stats.disputesChange > 0 ? '+' : ''}${stats.disputesChange}%` : '-0%', 
      trend: (stats?.disputesChange || 0) <= 0 ? 'down' : 'up', 
      icon: AlertTriangle 
    },
  ];

  return (
    <AdminLayout title="Dashboard" subtitle="Overview platform Kahade">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
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
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-accent" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${stat.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {stat.change}
                </div>
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Recent Transactions & Disputes */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-5"
          >
            <h3 className="text-lg font-semibold mb-4">Transaksi Terbaru</h3>
            <div className="space-y-3">
              {recentTransactions.length === 0 ? (
                <p className="text-muted-foreground text-sm">Belum ada transaksi</p>
              ) : (
                recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <div className="font-medium text-sm">{tx.orderNumber || tx.id}</div>
                      <div className="text-xs text-muted-foreground">
                        {tx.initiator?.username || 'Unknown'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">{formatCurrency(tx.amount || 0)}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[tx.status] || 'text-gray-500 bg-gray-500/10'}`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Recent Disputes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-5"
          >
            <h3 className="text-lg font-semibold mb-4">Dispute Terbaru</h3>
            <div className="space-y-3">
              {recentDisputes.length === 0 ? (
                <p className="text-muted-foreground text-sm">Tidak ada dispute aktif</p>
              ) : (
                recentDisputes.map((dispute) => (
                  <div key={dispute.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <div className="font-medium text-sm">{dispute.order?.orderNumber || dispute.id}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {dispute.reason || 'No reason provided'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[dispute.status] || 'text-gray-500 bg-gray-500/10'}`}>
                        {dispute.status}
                      </span>
                      {dispute.priority && (
                        <div className={`text-xs mt-1 ${priorityColors[dispute.priority] || ''}`}>
                          {dispute.priority}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}
