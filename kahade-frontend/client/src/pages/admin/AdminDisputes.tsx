/*
 * KAHADE ADMIN DISPUTES PAGE
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, MoreVertical, Eye, AlertTriangle, CheckCircle2,
  XCircle, Clock, MessageSquare, Scale
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';

// Mock data
const disputes = [
  { 
    id: '1', 
    orderNumber: 'KHD-2025-0005', 
    title: 'Kamera DSLR',
    reason: 'Barang tidak sesuai deskripsi', 
    description: 'Kamera yang diterima memiliki goresan di body padahal dijual sebagai kondisi baru.',
    status: 'OPEN', 
    priority: 'HIGH',
    buyer: 'charlie',
    seller: 'CameraWorld',
    amount: 12000000,
    createdAt: '2025-01-21',
    evidence: ['foto_barang.jpg', 'screenshot_chat.png']
  },
  { 
    id: '2', 
    orderNumber: 'KHD-2025-0006', 
    title: 'Website Development',
    reason: 'Pengiriman terlambat', 
    description: 'Proyek seharusnya selesai 2 minggu lalu tapi belum ada progress.',
    status: 'IN_REVIEW', 
    priority: 'MEDIUM',
    buyer: 'startup123',
    seller: 'devagency',
    amount: 25000000,
    createdAt: '2025-01-20',
    evidence: ['kontrak.pdf', 'timeline.pdf']
  },
  { 
    id: '3', 
    orderNumber: 'KHD-2025-0007', 
    title: 'Sepatu Nike Original',
    reason: 'Barang palsu/KW', 
    description: 'Sepatu yang dikirim bukan original, tidak ada tag dan box asli.',
    status: 'OPEN', 
    priority: 'HIGH',
    buyer: 'sneakerhead',
    seller: 'shoeseller',
    amount: 2500000,
    createdAt: '2025-01-19',
    evidence: ['foto_sepatu.jpg', 'perbandingan.jpg']
  },
  { 
    id: '4', 
    orderNumber: 'KHD-2025-0008', 
    title: 'Jasa Editing Video',
    reason: 'Kualitas tidak sesuai', 
    description: 'Hasil editing tidak sesuai dengan brief yang diberikan.',
    status: 'RESOLVED', 
    priority: 'LOW',
    buyer: 'contentcreator',
    seller: 'videoeditor',
    amount: 1500000,
    createdAt: '2025-01-18',
    evidence: ['brief.pdf', 'hasil_video.mp4'],
    resolution: 'Refund 50% ke pembeli'
  },
];

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  OPEN: { label: 'Open', color: 'text-red-500 bg-red-500/10', icon: AlertTriangle },
  IN_REVIEW: { label: 'In Review', color: 'text-amber-500 bg-amber-500/10', icon: Clock },
  RESOLVED: { label: 'Resolved', color: 'text-emerald-500 bg-emerald-500/10', icon: CheckCircle2 },
  CLOSED: { label: 'Closed', color: 'text-gray-500 bg-gray-500/10', icon: XCircle },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  HIGH: { label: 'Tinggi', color: 'text-red-500 bg-red-500/10' },
  MEDIUM: { label: 'Sedang', color: 'text-amber-500 bg-amber-500/10' },
  LOW: { label: 'Rendah', color: 'text-emerald-500 bg-emerald-500/10' },
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

export default function AdminDisputes() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDispute, setSelectedDispute] = useState<typeof disputes[0] | null>(null);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [resolution, setResolution] = useState('');
  const [winner, setWinner] = useState('');

  const filteredDisputes = disputes.filter(d => {
    const matchesSearch = d.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.reason.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleResolve = () => {
    if (!winner || !resolution) {
      toast.error('Mohon lengkapi semua field');
      return;
    }
    toast.success('Dispute berhasil diselesaikan');
    setIsResolveOpen(false);
    setSelectedDispute(null);
    setResolution('');
    setWinner('');
  };

  const handleStartReview = (disputeId: string) => {
    toast.success('Dispute sedang direview');
  };

  return (
    <AdminLayout title="Manajemen Dispute" subtitle="Resolusi konflik transaksi">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <div className="text-2xl font-display font-bold text-red-500">
              {disputes.filter(d => d.status === 'OPEN').length}
            </div>
            <div className="text-sm text-muted-foreground">Open</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-display font-bold text-amber-500">
              {disputes.filter(d => d.status === 'IN_REVIEW').length}
            </div>
            <div className="text-sm text-muted-foreground">In Review</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-display font-bold text-emerald-500">
              {disputes.filter(d => d.status === 'RESOLVED').length}
            </div>
            <div className="text-sm text-muted-foreground">Resolved</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-display font-bold">
              {disputes.filter(d => d.priority === 'HIGH').length}
            </div>
            <div className="text-sm text-muted-foreground">Prioritas Tinggi</div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Cari dispute..."
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
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_REVIEW">In Review</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Disputes List */}
        <div className="space-y-4">
          {filteredDisputes.map((dispute, index) => {
            const status = statusConfig[dispute.status];
            const priority = priorityConfig[dispute.priority];
            
            return (
              <motion.div
                key={dispute.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm text-muted-foreground">{dispute.orderNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${priority.color}`}>
                        {priority.label}
                      </span>
                    </div>
                    <h3 className="font-semibold mb-1">{dispute.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{dispute.reason}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Pembeli: {dispute.buyer}</span>
                      <span>•</span>
                      <span>Penjual: {dispute.seller}</span>
                      <span>•</span>
                      <span>{formatCurrency(dispute.amount)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedDispute(dispute)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Detail
                    </Button>
                    {dispute.status === 'OPEN' && (
                      <Button 
                        size="sm"
                        className="btn-accent"
                        onClick={() => handleStartReview(dispute.id)}
                      >
                        <Scale className="w-4 h-4 mr-2" />
                        Review
                      </Button>
                    )}
                    {dispute.status === 'IN_REVIEW' && (
                      <Button 
                        size="sm"
                        className="btn-accent"
                        onClick={() => {
                          setSelectedDispute(dispute);
                          setIsResolveOpen(true);
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* Dispute Detail Dialog */}
        <Dialog open={!!selectedDispute && !isResolveOpen} onOpenChange={() => setSelectedDispute(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detail Dispute</DialogTitle>
            </DialogHeader>
            {selectedDispute && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm text-muted-foreground">{selectedDispute.orderNumber}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusConfig[selectedDispute.status].color}`}>
                      {statusConfig[selectedDispute.status].label}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold">{selectedDispute.title}</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-white/5">
                    <div className="text-sm text-muted-foreground mb-1">Pembeli</div>
                    <div className="font-medium">{selectedDispute.buyer}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5">
                    <div className="text-sm text-muted-foreground mb-1">Penjual</div>
                    <div className="font-medium">{selectedDispute.seller}</div>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-white/5">
                  <div className="text-sm text-muted-foreground mb-1">Alasan Dispute</div>
                  <div className="font-medium">{selectedDispute.reason}</div>
                </div>
                
                <div className="p-4 rounded-lg bg-white/5">
                  <div className="text-sm text-muted-foreground mb-1">Deskripsi</div>
                  <p>{selectedDispute.description}</p>
                </div>
                
                <div className="p-4 rounded-lg bg-white/5">
                  <div className="text-sm text-muted-foreground mb-2">Bukti</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedDispute.evidence.map((file, i) => (
                      <span key={i} className="text-sm px-3 py-1 rounded-full bg-accent/10 text-accent">
                        {file}
                      </span>
                    ))}
                  </div>
                </div>
                
                {selectedDispute.resolution && (
                  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-sm text-emerald-500 mb-1">Resolusi</div>
                    <p>{selectedDispute.resolution}</p>
                  </div>
                )}
                
                <div className="p-4 rounded-lg bg-accent/10">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Nilai Transaksi</span>
                    <span className="text-2xl font-display font-bold gradient-text">
                      {formatCurrency(selectedDispute.amount)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Resolve Dialog */}
        <Dialog open={isResolveOpen} onOpenChange={setIsResolveOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resolusi Dispute</DialogTitle>
              <DialogDescription>
                Tentukan keputusan untuk dispute {selectedDispute?.orderNumber}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <Label>Pemenang</Label>
                <RadioGroup value={winner} onValueChange={setWinner}>
                  <div className="flex items-center space-x-2 p-3 rounded-lg bg-white/5">
                    <RadioGroupItem value="buyer" id="buyer" />
                    <Label htmlFor="buyer" className="flex-1 cursor-pointer">
                      Pembeli ({selectedDispute?.buyer})
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg bg-white/5">
                    <RadioGroupItem value="seller" id="seller" />
                    <Label htmlFor="seller" className="flex-1 cursor-pointer">
                      Penjual ({selectedDispute?.seller})
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg bg-white/5">
                    <RadioGroupItem value="split" id="split" />
                    <Label htmlFor="split" className="flex-1 cursor-pointer">
                      Bagi Rata (50:50)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="resolution">Keterangan Resolusi</Label>
                <Textarea
                  id="resolution"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Jelaskan keputusan dan alasannya..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsResolveOpen(false)}>
                Batal
              </Button>
              <Button className="btn-accent" onClick={handleResolve}>
                Selesaikan Dispute
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
