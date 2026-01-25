/*
 * KAHADE TRANSACTION DETAIL PAGE
 */

import { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Clock, CheckCircle2, AlertCircle, Calendar,
  Copy, Loader2, XCircle, Package, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { transactionApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Transaction {
  id: string;
  orderNumber: string;
  title: string;
  description: string;
  amount: number;
  platformFee: number;
  status: string;
  initiatorRole: string;
  initiatorId: string;
  counterpartyId?: string;
  category: string;
  terms?: string;
  feePayer: string;
  createdAt: string;
  acceptedAt?: string;
  paidAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  disputedAt?: string;
  initiator?: { id: string; username: string; reputationScore?: number };
  counterparty?: { id: string; username: string; reputationScore?: number };
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  WAITING_COUNTERPARTY: { label: 'Menunggu Pihak Lain', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  PENDING_ACCEPT: { label: 'Menunggu Persetujuan', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  ACCEPTED: { label: 'Diterima - Menunggu Pembayaran', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  PAID: { label: 'Dibayar - Menunggu Pengiriman', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  DELIVERED: { label: 'Dikirim - Menunggu Konfirmasi', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  COMPLETED: { label: 'Selesai', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  DISPUTED: { label: 'Dalam Dispute', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  CANCELLED: { label: 'Dibatalkan', color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
  REFUNDED: { label: 'Dana Dikembalikan', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString));
};

export default function TransactionDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchTransaction();
  }, [id]);

  const fetchTransaction = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const response = await transactionApi.get(id);
      setTransaction(response.data.transaction || response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memuat transaksi');
      setLocation('/app/transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyOrderNumber = () => {
    if (transaction) {
      navigator.clipboard.writeText(transaction.orderNumber);
      toast.success('Nomor order disalin');
    }
  };

  const handleAccept = async () => {
    if (!transaction) return;
    
    setIsActionLoading(true);
    try {
      await transactionApi.accept(transaction.id);
      toast.success('Transaksi diterima!');
      fetchTransaction();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menerima transaksi');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!transaction) return;
    
    setIsActionLoading(true);
    try {
      await transactionApi.reject(transaction.id, cancelReason);
      toast.success('Transaksi ditolak');
      setIsCancelOpen(false);
      fetchTransaction();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menolak transaksi');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePay = async () => {
    if (!transaction) return;
    
    setIsActionLoading(true);
    try {
      await transactionApi.pay(transaction.id);
      toast.success('Pembayaran berhasil!', {
        description: 'Dana telah ditahan di escrow.'
      });
      fetchTransaction();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal melakukan pembayaran');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!transaction) return;
    
    setIsActionLoading(true);
    try {
      await transactionApi.confirmDelivery(transaction.id);
      toast.success('Pengiriman dikonfirmasi!');
      fetchTransaction();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal konfirmasi pengiriman');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!transaction) return;
    
    setIsActionLoading(true);
    try {
      await transactionApi.confirmReceipt(transaction.id);
      toast.success('Transaksi selesai!', {
        description: 'Dana telah dilepaskan ke penjual.'
      });
      fetchTransaction();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal konfirmasi penerimaan');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!transaction) return;
    
    setIsActionLoading(true);
    try {
      await transactionApi.cancel(transaction.id, cancelReason);
      toast.success('Transaksi dibatalkan');
      setIsCancelOpen(false);
      fetchTransaction();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal membatalkan transaksi');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSubmitDispute = async () => {
    if (!transaction) return;
    
    if (!disputeReason.trim() || !disputeDescription.trim()) {
      toast.error('Mohon isi alasan dan deskripsi dispute');
      return;
    }

    setIsActionLoading(true);
    try {
      await transactionApi.dispute(transaction.id, {
        reason: disputeReason,
        description: disputeDescription,
      });
      toast.success('Dispute diajukan', {
        description: 'Tim kami akan meninjau dalam 1-3 hari kerja.'
      });
      setIsDisputeOpen(false);
      setDisputeReason('');
      setDisputeDescription('');
      fetchTransaction();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengajukan dispute');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!transaction) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Transaksi tidak ditemukan</p>
          <Link href="/app/transactions">
            <Button className="mt-4">Kembali ke Transaksi</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const status = statusConfig[transaction.status] || statusConfig.PENDING_ACCEPT;
  const isBuyer = (transaction.initiatorRole === 'BUYER' && transaction.initiatorId === user?.id) ||
                  (transaction.initiatorRole === 'SELLER' && transaction.counterpartyId === user?.id);
  const isSeller = !isBuyer;
  const isInitiator = transaction.initiatorId === user?.id;
  const buyer = isBuyer ? (isInitiator ? transaction.initiator : transaction.counterparty) : (isInitiator ? transaction.counterparty : transaction.initiator);
  const seller = isSeller ? (isInitiator ? transaction.initiator : transaction.counterparty) : (isInitiator ? transaction.counterparty : transaction.initiator);

  // Build timeline
  const timeline = [];
  timeline.push({ status: 'CREATED', timestamp: transaction.createdAt, description: 'Transaksi dibuat' });
  if (transaction.acceptedAt) {
    timeline.push({ status: 'ACCEPTED', timestamp: transaction.acceptedAt, description: 'Transaksi diterima' });
  }
  if (transaction.paidAt) {
    timeline.push({ status: 'PAID', timestamp: transaction.paidAt, description: 'Pembayaran diterima' });
  }
  if (transaction.deliveredAt) {
    timeline.push({ status: 'DELIVERED', timestamp: transaction.deliveredAt, description: 'Barang/jasa dikirim' });
  }
  if (transaction.completedAt) {
    timeline.push({ status: 'COMPLETED', timestamp: transaction.completedAt, description: 'Transaksi selesai' });
  }
  if (transaction.cancelledAt) {
    timeline.push({ status: 'CANCELLED', timestamp: transaction.cancelledAt, description: 'Transaksi dibatalkan' });
  }
  if (transaction.disputedAt) {
    timeline.push({ status: 'DISPUTED', timestamp: transaction.disputedAt, description: 'Dispute diajukan' });
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Link href="/app/transactions">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Transaksi
          </Button>
        </Link>
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <button 
                  onClick={handleCopyOrderNumber}
                  className="font-mono text-sm text-muted-foreground hover:text-accent flex items-center gap-1"
                >
                  {transaction.orderNumber}
                  <Copy className="w-3 h-3" />
                </button>
                <span className={`text-xs px-3 py-1 rounded-full ${status.color} ${status.bgColor}`}>
                  {status.label}
                </span>
              </div>
              <h1 className="text-2xl font-display font-bold mb-2">{transaction.title}</h1>
              <p className="text-muted-foreground">{transaction.description}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-display font-bold gradient-text">
                {formatCurrency(transaction.amount)}
              </div>
              <div className="text-sm text-muted-foreground">
                + Biaya platform {formatCurrency(transaction.platformFee)}
              </div>
            </div>
          </div>
        </motion.div>
        
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Parties */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6"
            >
              <h2 className="text-lg font-display font-semibold mb-4">Pihak Terkait</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-sm text-muted-foreground mb-2">Pembeli {isBuyer && '(Anda)'}</div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-semibold">
                      {buyer?.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="font-medium">{buyer?.username || 'Menunggu'}</div>
                      {buyer?.reputationScore && (
                        <div className="text-sm text-muted-foreground">⭐ {buyer.reputationScore}</div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-sm text-muted-foreground mb-2">Penjual {isSeller && '(Anda)'}</div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold">
                      {seller?.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="font-medium">{seller?.username || 'Menunggu'}</div>
                      {seller?.reputationScore && (
                        <div className="text-sm text-muted-foreground">⭐ {seller.reputationScore}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <h2 className="text-lg font-display font-semibold mb-4">Timeline</h2>
              <div className="space-y-4">
                {timeline.map((event, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                      </div>
                      {index < timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-accent/20 mt-2" />
                      )}
                    </div>
                    <div className="pb-4">
                      <div className="font-medium">{event.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(event.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            
            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6"
            >
              <h2 className="text-lg font-display font-semibold mb-4">Aksi</h2>
              <div className="flex flex-wrap gap-3">
                {/* Accept/Reject for counterparty on PENDING_ACCEPT */}
                {transaction.status === 'PENDING_ACCEPT' && !isInitiator && (
                  <>
                    <Button className="btn-accent" onClick={handleAccept} disabled={isActionLoading}>
                      {isActionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      Terima Transaksi
                    </Button>
                    <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="border-red-500/20 text-red-500 hover:bg-red-500/10">
                          <XCircle className="w-4 h-4 mr-2" />
                          Tolak
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Tolak Transaksi</DialogTitle>
                          <DialogDescription>Berikan alasan penolakan (opsional)</DialogDescription>
                        </DialogHeader>
                        <Textarea
                          placeholder="Alasan penolakan..."
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          rows={3}
                        />
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsCancelOpen(false)}>Batal</Button>
                          <Button className="bg-red-500 hover:bg-red-600" onClick={handleReject} disabled={isActionLoading}>
                            {isActionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Tolak Transaksi
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}

                {/* Pay for buyer on ACCEPTED */}
                {transaction.status === 'ACCEPTED' && isBuyer && (
                  <Button className="btn-accent" onClick={handlePay} disabled={isActionLoading}>
                    {isActionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                    Bayar Sekarang
                  </Button>
                )}

                {/* Confirm Delivery for seller on PAID */}
                {transaction.status === 'PAID' && isSeller && (
                  <Button className="btn-accent" onClick={handleConfirmDelivery} disabled={isActionLoading}>
                    {isActionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Package className="w-4 h-4 mr-2" />}
                    Konfirmasi Pengiriman
                  </Button>
                )}

                {/* Confirm Receipt for buyer on DELIVERED */}
                {transaction.status === 'DELIVERED' && isBuyer && (
                  <Button className="btn-accent" onClick={handleConfirmReceipt} disabled={isActionLoading}>
                    {isActionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Konfirmasi Diterima
                  </Button>
                )}

                {/* Dispute option for buyer on PAID or DELIVERED */}
                {(transaction.status === 'PAID' || transaction.status === 'DELIVERED') && isBuyer && (
                  <Dialog open={isDisputeOpen} onOpenChange={setIsDisputeOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="border-red-500/20 text-red-500 hover:bg-red-500/10">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Ajukan Dispute
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Ajukan Dispute</DialogTitle>
                        <DialogDescription>
                          Jelaskan alasan Anda mengajukan dispute untuk transaksi ini.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Alasan</Label>
                          <Input
                            placeholder="Contoh: Barang tidak sesuai deskripsi"
                            value={disputeReason}
                            onChange={(e) => setDisputeReason(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Deskripsi Detail</Label>
                          <Textarea
                            placeholder="Jelaskan masalah yang Anda alami secara detail..."
                            value={disputeDescription}
                            onChange={(e) => setDisputeDescription(e.target.value)}
                            rows={4}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDisputeOpen(false)}>Batal</Button>
                        <Button className="bg-red-500 hover:bg-red-600" onClick={handleSubmitDispute} disabled={isActionLoading}>
                          {isActionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                          Ajukan Dispute
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {/* Cancel option for initiator on WAITING_COUNTERPARTY or PENDING_ACCEPT */}
                {(transaction.status === 'WAITING_COUNTERPARTY' || transaction.status === 'PENDING_ACCEPT') && isInitiator && (
                  <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="border-red-500/20 text-red-500 hover:bg-red-500/10">
                        <XCircle className="w-4 h-4 mr-2" />
                        Batalkan
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Batalkan Transaksi</DialogTitle>
                        <DialogDescription>Berikan alasan pembatalan (opsional)</DialogDescription>
                      </DialogHeader>
                      <Textarea
                        placeholder="Alasan pembatalan..."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        rows={3}
                      />
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCancelOpen(false)}>Kembali</Button>
                        <Button className="bg-red-500 hover:bg-red-600" onClick={handleCancel} disabled={isActionLoading}>
                          {isActionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                          Batalkan Transaksi
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {/* No actions available */}
                {['COMPLETED', 'CANCELLED', 'REFUNDED', 'DISPUTED'].includes(transaction.status) && (
                  <p className="text-muted-foreground text-sm">Tidak ada aksi yang tersedia untuk transaksi ini.</p>
                )}
              </div>
            </motion.div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Transaction Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-card p-6"
            >
              <h2 className="text-lg font-display font-semibold mb-4">Info Transaksi</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Kategori</div>
                  <div className="font-medium">{transaction.category}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Peran Anda</div>
                  <div className="font-medium">{isBuyer ? 'Pembeli' : 'Penjual'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Biaya Ditanggung</div>
                  <div className="font-medium">
                    {transaction.feePayer === 'BUYER' ? 'Pembeli' : 
                     transaction.feePayer === 'SELLER' ? 'Penjual' : 'Bagi Rata'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Dibuat</div>
                  <div className="font-medium flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(transaction.createdAt)}
                  </div>
                </div>
                {transaction.terms && (
                  <div>
                    <div className="text-sm text-muted-foreground">Syarat & Ketentuan</div>
                    <div className="text-sm mt-1 p-3 rounded-lg bg-white/5">{transaction.terms}</div>
                  </div>
                )}
              </div>
            </motion.div>
            
            {/* Price Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <h2 className="text-lg font-display font-semibold mb-4">Rincian Harga</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Harga</span>
                  <span>{formatCurrency(transaction.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Biaya Platform</span>
                  <span>{formatCurrency(transaction.platformFee)}</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-accent">{formatCurrency(transaction.amount + transaction.platformFee)}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
