/*
 * KAHADE ADMIN DASHBOARD
 */

import { motion } from 'framer-motion';
import {
  Users, ArrowLeftRight, Wallet, AlertTriangle, TrendingUp,
  TrendingDown, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import AdminLayout from '@/components/layout/AdminLayout';

// Mock data
const stats = [
  { label: 'Total Pengguna', value: '10,234', change: '+12%', trend: 'up', icon: Users },
  { label: 'Transaksi Aktif', value: '1,456', change: '+8%', trend: 'up', icon: ArrowLeftRight },
  { label: 'Volume Transaksi', value: 'Rp 2.5M', change: '+15%', trend: 'up', icon: Wallet },
  { label: 'Dispute Aktif', value: '23', change: '-5%', trend: 'down', icon: AlertTriangle },
];

const transactionData = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 500 },
  { name: 'Jun', value: 900 },
  { name: 'Jul', value: 700 },
];

const categoryData = [
  { name: 'Elektronik', value: 450 },
  { name: 'Jasa', value: 300 },
  { name: 'Fashion', value: 200 },
  { name: 'Digital', value: 150 },
  { name: 'Lainnya', value: 100 },
];

const recentTransactions = [
  { id: '1', orderNumber: 'KHD-2025-0001', amount: 18500000, status: 'PAID', user: 'johndoe' },
  { id: '2', orderNumber: 'KHD-2025-0002', amount: 2500000, status: 'PENDING', user: 'janedoe' },
  { id: '3', orderNumber: 'KHD-2025-0003', amount: 15000000, status: 'COMPLETED', user: 'bobsmith' },
  { id: '4', orderNumber: 'KHD-2025-0004', amount: 5000000, status: 'DISPUTED', user: 'alicew' },
];

const recentDisputes = [
  { id: '1', orderNumber: 'KHD-2025-0005', reason: 'Barang tidak sesuai', status: 'OPEN', priority: 'HIGH' },
  { id: '2', orderNumber: 'KHD-2025-0006', reason: 'Pengiriman terlambat', status: 'IN_REVIEW', priority: 'MEDIUM' },
  { id: '3', orderNumber: 'KHD-2025-0007', reason: 'Barang rusak', status: 'OPEN', priority: 'HIGH' },
];

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
  PENDING: 'text-amber-500 bg-amber-500/10',
  COMPLETED: 'text-emerald-500 bg-emerald-500/10',
  DISPUTED: 'text-red-500 bg-red-500/10',
  OPEN: 'text-red-500 bg-red-500/10',
  IN_REVIEW: 'text-amber-500 bg-amber-500/10',
};

const priorityColors: Record<string, string> = {
  HIGH: 'text-red-500',
  MEDIUM: 'text-amber-500',
  LOW: 'text-emerald-500',
};

export default function AdminDashboard() {
  return (
    <AdminLayout title="Dashboard" subtitle="Overview platform Kahade">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
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
              <div className="text-2xl font-display font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
        
        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Transaction Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-display font-semibold mb-4">Tren Transaksi</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={transactionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15,23,42,0.9)', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#22D3EE" 
                    strokeWidth={2}
                    dot={{ fill: '#22D3EE' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
          
          {/* Category Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-display font-semibold mb-4">Kategori Transaksi</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" stroke="rgba(255,255,255,0.5)" />
                  <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15,23,42,0.9)', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" fill="#4338CA" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
        
        {/* Tables Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-display font-semibold mb-4">Transaksi Terbaru</h3>
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div>
                    <div className="font-mono text-sm">{tx.orderNumber}</div>
                    <div className="text-xs text-muted-foreground">@{tx.user}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(tx.amount)}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[tx.status]}`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          
          {/* Active Disputes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-display font-semibold mb-4">Dispute Aktif</h3>
            <div className="space-y-3">
              {recentDisputes.map((dispute) => (
                <div key={dispute.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div>
                    <div className="font-mono text-sm">{dispute.orderNumber}</div>
                    <div className="text-xs text-muted-foreground">{dispute.reason}</div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-medium ${priorityColors[dispute.priority]}`}>
                      {dispute.priority}
                    </span>
                    <div className={`text-xs px-2 py-0.5 rounded-full mt-1 ${statusColors[dispute.status]}`}>
                      {dispute.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}
