/*
 * KAHADE ADMIN TRANSACTIONS PAGE
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Filter, MoreVertical, Eye, Clock, CheckCircle2,
  AlertCircle, XCircle, ArrowUpRight, ArrowDownRight
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';

// Mock data
const transactions = [
  { id: '1', orderNumber: 'KHD-2025-0001', title: 'iPhone 15 Pro', amount: 18500000, status: 'PAID', buyer: 'johndoe', seller: 'TechStore', category: 'ELECTRONICS', createdAt: '2025-01-24' },
  { id: '2', orderNumber: 'KHD-2025-0002', title: 'Jasa Desain Logo', amount: 2500000, status: 'PENDING_ACCEPT', buyer: 'StartupXYZ', seller: 'janedoe', category: 'SERVICES', createdAt: '2025-01-24' },
  { id: '3', orderNumber: 'KHD-2025-0003', title: 'Laptop Gaming', amount: 15000000, status: 'COMPLETED', buyer: 'bobsmith', seller: 'GamingGear', category: 'ELECTRONICS', createdAt: '2025-01-23' },
  { id: '4', orderNumber: 'KHD-2025-0004', title: 'Konsultasi IT', amount: 5000000, status: 'COMPLETED', buyer: 'PT ABC', seller: 'alicew', category: 'SERVICES', createdAt: '2025-01-22' },
  { id: '5', orderNumber: 'KHD-2025-0005', title: 'Kamera DSLR', amount: 12000000, status: 'DISPUTED', buyer: 'charlie', seller: 'CameraWorld', category: 'ELECTRONICS', createdAt: '2025-01-21' },
  { id: '6', orderNumber: 'KHD-2025-0006', title: 'Website Development', amount: 25000000, status: 'CANCELLED', buyer: 'startup123', seller: 'devagency', category: 'SERVICES', createdAt: '2025-01-20' },
];

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  PENDING_ACCEPT: { label: 'Menunggu', color: 'text-amber-500 bg-amber-500/10', icon: Clock },
  ACCEPTED: { label: 'Diterima', color: 'text-blue-500 bg-blue-500/10', icon: CheckCircle2 },
  PAID: { label: 'Dibayar', color: 'text-emerald-500 bg-emerald-500/10', icon: CheckCircle2 },
  COMPLETED: { label: 'Selesai', color: 'text-emerald-500 bg-emerald-500/10', icon: CheckCircle2 },
  DISPUTED: { label: 'Dispute', color: 'text-red-500 bg-red-500/10', icon: AlertCircle },
  CANCELLED: { label: 'Dibatalkan', color: 'text-gray-500 bg-gray-500/10', icon: XCircle },
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

export default function AdminTransactions() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedTx, setSelectedTx] = useState<typeof transactions[0] | null>(null);

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.buyer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.seller.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || tx.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleForceComplete = (txId: string) => {
    toast.success('Transaksi berhasil diselesaikan');
  };

  const handleForceCancel = (txId: string) => {
    toast.success('Transaksi berhasil dibatalkan');
  };

  return (
    <AdminLayout title="Manajemen Transaksi" subtitle="Kelola semua transaksi platform">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <div className="text-2xl font-display font-bold">{transactions.length}</div>
            <div className="text-sm text-muted-foreground">Total Transaksi</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-display font-bold text-emerald-500">
              {transactions.filter(t => t.status === 'COMPLETED').length}
            </div>
            <div className="text-sm text-muted-foreground">Selesai</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-display font-bold text-amber-500">
              {transactions.filter(t => ['PENDING_ACCEPT', 'ACCEPTED', 'PAID'].includes(t.status)).length}
            </div>
            <div className="text-sm text-muted-foreground">Aktif</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-display font-bold text-red-500">
              {transactions.filter(t => t.status === 'DISPUTED').length}
            </div>
            <div className="text-sm text-muted-foreground">Dispute</div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Cari order, judul, buyer, seller..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="PENDING_ACCEPT">Menunggu</SelectItem>
              <SelectItem value="PAID">Dibayar</SelectItem>
              <SelectItem value="COMPLETED">Selesai</SelectItem>
              <SelectItem value="DISPUTED">Dispute</SelectItem>
              <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              <SelectItem value="ELECTRONICS">Elektronik</SelectItem>
              <SelectItem value="SERVICES">Jasa</SelectItem>
              <SelectItem value="FASHION">Fashion</SelectItem>
              <SelectItem value="DIGITAL">Digital</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Transactions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 font-medium text-muted-foreground">Order</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Judul</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Pihak</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Jumlah</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Tanggal</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  const status = statusConfig[tx.status];
                  
                  return (
                    <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4">
                        <div className="font-mono text-sm">{tx.orderNumber}</div>
                        <div className="text-xs text-muted-foreground">{tx.category}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium max-w-[200px] truncate">{tx.title}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-sm">
                          <ArrowUpRight className="w-3 h-3 text-red-500" />
                          <span>{tx.buyer}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <ArrowDownRight className="w-3 h-3 text-emerald-500" />
                          <span>{tx.seller}</span>
                        </div>
                      </td>
                      <td className="p-4 font-semibold">{formatCurrency(tx.amount)}</td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{tx.createdAt}</td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedTx(tx)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Lihat Detail
                            </DropdownMenuItem>
                            {!['COMPLETED', 'CANCELLED'].includes(tx.status) && (
                              <>
                                <DropdownMenuItem onClick={() => handleForceComplete(tx.id)}>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Force Complete
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleForceCancel(tx.id)}
                                  className="text-red-500"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Force Cancel
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
        
        {/* Transaction Detail Dialog */}
        <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detail Transaksi</DialogTitle>
            </DialogHeader>
            {selectedTx && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-white/5">
                  <div className="font-mono text-sm text-muted-foreground mb-1">{selectedTx.orderNumber}</div>
                  <div className="text-xl font-semibold">{selectedTx.title}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="text-sm text-muted-foreground mb-1">Pembeli</div>
                    <div className="font-medium">{selectedTx.buyer}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="text-sm text-muted-foreground mb-1">Penjual</div>
                    <div className="font-medium">{selectedTx.seller}</div>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-accent/10">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Jumlah</span>
                    <span className="text-2xl font-display font-bold gradient-text">
                      {formatCurrency(selectedTx.amount)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`text-sm px-3 py-1 rounded-full ${statusConfig[selectedTx.status].color}`}>
                    {statusConfig[selectedTx.status].label}
                  </span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
