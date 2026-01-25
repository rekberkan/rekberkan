/*
 * KAHADE TRANSACTIONS LIST PAGE
 */

import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import {
  Plus, Search, ArrowUpRight, ArrowDownRight, Clock,
  CheckCircle2, AlertCircle, ChevronRight, Calendar, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { transactionApi } from '@/lib/api';

interface Transaction {
  id: string;
  orderNumber: string;
  title: string;
  amount: number;
  status: string;
  initiatorRole: string;
  counterparty?: { username: string };
  counterpartyId?: string;
  category: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  WAITING_COUNTERPARTY: { label: 'Menunggu Pihak Lain', color: 'text-amber-500 bg-amber-500/10', icon: Clock },
  PENDING_ACCEPT: { label: 'Menunggu', color: 'text-amber-500 bg-amber-500/10', icon: Clock },
  ACCEPTED: { label: 'Diterima', color: 'text-blue-500 bg-blue-500/10', icon: CheckCircle2 },
  PAID: { label: 'Dibayar', color: 'text-emerald-500 bg-emerald-500/10', icon: CheckCircle2 },
  DELIVERED: { label: 'Dikirim', color: 'text-blue-500 bg-blue-500/10', icon: CheckCircle2 },
  COMPLETED: { label: 'Selesai', color: 'text-emerald-500 bg-emerald-500/10', icon: CheckCircle2 },
  DISPUTED: { label: 'Dispute', color: 'text-red-500 bg-red-500/10', icon: AlertCircle },
  CANCELLED: { label: 'Dibatalkan', color: 'text-gray-500 bg-gray-500/10', icon: AlertCircle },
  REFUNDED: { label: 'Refund', color: 'text-orange-500 bg-orange-500/10', icon: ArrowDownRight },
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return tx.title.toLowerCase().includes(query) ||
      tx.orderNumber.toLowerCase().includes(query);
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Transaksi" subtitle="Memuat...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Transaksi" subtitle="Kelola semua transaksi Anda">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Cari transaksi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-40 bg-white/5 border-white/10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="WAITING_COUNTERPARTY">Menunggu</SelectItem>
                <SelectItem value="PENDING_ACCEPT">Pending</SelectItem>
                <SelectItem value="ACCEPTED">Diterima</SelectItem>
                <SelectItem value="PAID">Dibayar</SelectItem>
                <SelectItem value="COMPLETED">Selesai</SelectItem>
                <SelectItem value="DISPUTED">Dispute</SelectItem>
                <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
              <SelectTrigger className="w-36 bg-white/5 border-white/10">
                <SelectValue placeholder="Peran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="buyer">Pembeli</SelectItem>
                <SelectItem value="seller">Penjual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Link href="/app/transactions/new">
            <Button className="btn-accent">
              <Plus className="w-4 h-4 mr-2" />
              Transaksi Baru
            </Button>
          </Link>
        </div>
        
        {/* Transactions List */}
        <div className="glass-card overflow-hidden">
          {filteredTransactions.length > 0 ? (
            <div className="divide-y divide-white/10">
              {filteredTransactions.map((tx, index) => {
                const status = statusConfig[tx.status] || statusConfig.PENDING_ACCEPT;
                const isBuyer = tx.initiatorRole === 'BUYER';
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/app/transactions/${tx.id}`}>
                      <div className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors cursor-pointer">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isBuyer ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          {isBuyer ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-muted-foreground">{tx.orderNumber}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                          <div className="font-medium truncate">{tx.title}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <span>{isBuyer ? 'Pembeli' : 'Penjual'}</span>
                            <span>•</span>
                            <span>{tx.counterparty?.username || 'Menunggu pihak lain'}</span>
                          </div>
                        </div>
                        
                        <div className="text-right hidden sm:block">
                          <div className="font-semibold">{formatCurrency(tx.amount)}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                            <Calendar className="w-3 h-3" />
                            {formatDate(tx.createdAt)}
                          </div>
                        </div>
                        
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-display font-semibold mb-2">Tidak ada transaksi</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'all' || roleFilter !== 'all'
                  ? 'Tidak ada transaksi yang sesuai dengan filter.'
                  : 'Anda belum memiliki transaksi.'}
              </p>
              <Link href="/app/transactions/new">
                <Button className="btn-accent">
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Transaksi Pertama
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Sebelumnya
            </Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">
              Halaman {page} dari {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Selanjutnya
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
