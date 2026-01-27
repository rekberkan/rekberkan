/*
 * KAHADE ADMIN USERS PAGE
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Filter, MoreVertical, User, Mail, Phone,
  CheckCircle2, AlertCircle, Ban, Eye, Loader2, XCircle
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/api';

interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  kycStatus: string;
  isAdmin: boolean;
  suspendedAt: string | null;
  suspendedUntil: string | null;
  suspendReason: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

const kycStatusConfig: Record<string, { label: string; color: string }> = {
  NONE: { label: 'Belum', color: 'text-gray-500 bg-gray-500/10' },
  PENDING: { label: 'Pending', color: 'text-amber-500 bg-amber-500/10' },
  VERIFIED: { label: 'Verified', color: 'text-emerald-500 bg-emerald-500/10' },
  REJECTED: { label: 'Ditolak', color: 'text-red-500 bg-red-500/10' },
};

const getStatusConfig = (user: User) => {
  if (user.suspendedAt) {
    return { label: 'Suspended', color: 'text-red-500 bg-red-500/10' };
  }
  return { label: 'Aktif', color: 'text-emerald-500 bg-emerald-500/10' };
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [kycFilter, setKycFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Suspend dialog
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendUserId, setSuspendUserId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // KYC reject dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectUserId, setRejectUserId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [page, kycFilter, statusFilter]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (kycFilter !== 'all') params.kycStatus = kycFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      
      const response = await adminApi.getUsers(params);
      setUsers(response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Gagal memuat data pengguna');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleSuspend = async () => {
    if (!suspendUserId || !suspendReason.trim()) {
      toast.error('Alasan suspend diperlukan');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await adminApi.suspendUser(suspendUserId, suspendReason);
      toast.success('User berhasil di-suspend');
      setSuspendDialogOpen(false);
      setSuspendUserId(null);
      setSuspendReason('');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal suspend user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivate = async (userId: string) => {
    try {
      await adminApi.activateUser(userId);
      toast.success('User berhasil diaktifkan');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengaktifkan user');
    }
  };

  const handleApproveKYC = async (userId: string) => {
    try {
      await adminApi.approveKYC(userId);
      toast.success('KYC berhasil disetujui');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyetujui KYC');
    }
  };

  const handleRejectKYC = async () => {
    if (!rejectUserId || !rejectReason.trim()) {
      toast.error('Alasan penolakan diperlukan');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await adminApi.rejectKYC(rejectUserId, rejectReason);
      toast.success('KYC berhasil ditolak');
      setRejectDialogOpen(false);
      setRejectUserId(null);
      setRejectReason('');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menolak KYC');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading && users.length === 0) {
    return (
      <AdminLayout title="Manajemen Pengguna" subtitle="Kelola semua pengguna platform">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Manajemen Pengguna" subtitle="Kelola semua pengguna platform">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <div className="text-2xl font-display font-bold">{total}</div>
            <div className="text-sm text-muted-foreground">Total Pengguna</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-display font-bold text-emerald-500">
              {users.filter(u => u.kycStatus === 'VERIFIED').length}
            </div>
            <div className="text-sm text-muted-foreground">KYC Verified</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-display font-bold text-amber-500">
              {users.filter(u => u.kycStatus === 'PENDING').length}
            </div>
            <div className="text-sm text-muted-foreground">KYC Pending</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-display font-bold text-red-500">
              {users.filter(u => u.suspendedAt).length}
            </div>
            <div className="text-sm text-muted-foreground">Suspended</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Cari username atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10"
            />
          </div>
          <Select value={kycFilter} onValueChange={(v) => { setKycFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10">
              <SelectValue placeholder="KYC Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua KYC</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="NONE">Belum</SelectItem>
              <SelectItem value="REJECTED">Ditolak</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36 bg-white/5 border-white/10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Kontak</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">KYC</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Bergabung</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Login Terakhir</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const kyc = kycStatusConfig[user.kycStatus] || kycStatusConfig.NONE;
                  const status = getStatusConfig(user);
                  
                  return (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-semibold">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{user.username}</div>
                            <div className="text-xs text-muted-foreground">
                              {user.isAdmin && <span className="text-accent">Admin</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">{user.email}</div>
                        <div className="text-xs text-muted-foreground">{user.phone || '-'}</div>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${kyc.color}`}>
                          {kyc.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{formatDate(user.createdAt)}</td>
                      <td className="p-4 text-sm text-muted-foreground">{formatDate(user.lastLoginAt)}</td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Lihat Detail
                            </DropdownMenuItem>
                            {user.kycStatus === 'PENDING' && (
                              <>
                                <DropdownMenuItem onClick={() => handleApproveKYC(user.id)}>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Approve KYC
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => { setRejectUserId(user.id); setRejectDialogOpen(true); }}
                                  className="text-red-500"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject KYC
                                </DropdownMenuItem>
                              </>
                            )}
                            {!user.suspendedAt ? (
                              <DropdownMenuItem 
                                onClick={() => { setSuspendUserId(user.id); setSuspendDialogOpen(true); }}
                                className="text-red-500"
                              >
                                <Ban className="w-4 h-4 mr-2" />
                                Suspend
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleActivate(user.id)}>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Aktifkan
                              </DropdownMenuItem>
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
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-white/10">
              <div className="text-sm text-muted-foreground">
                Halaman {page} dari {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </motion.div>
        
        {/* User Detail Dialog */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Detail Pengguna</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white text-2xl font-bold">
                    {selectedUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xl font-semibold">{selectedUser.username}</div>
                    <div className="text-sm text-muted-foreground">ID: {selectedUser.id}</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <span>{selectedUser.email}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <span>{selectedUser.phone || '-'}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="text-sm text-muted-foreground">KYC Status</div>
                    <span className={`text-sm px-2 py-0.5 rounded-full ${(kycStatusConfig[selectedUser.kycStatus] || kycStatusConfig.NONE).color}`}>
                      {(kycStatusConfig[selectedUser.kycStatus] || kycStatusConfig.NONE).label}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="text-sm text-muted-foreground">Status</div>
                    <span className={`text-sm px-2 py-0.5 rounded-full ${getStatusConfig(selectedUser).color}`}>
                      {getStatusConfig(selectedUser).label}
                    </span>
                  </div>
                </div>
                
                {selectedUser.suspendedAt && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="text-sm text-red-500 font-medium">Alasan Suspend:</div>
                    <div className="text-sm">{selectedUser.suspendReason || '-'}</div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Suspend Dialog */}
        <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Suspend User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Alasan Suspend</Label>
                <Textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Masukkan alasan suspend..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSuspendDialogOpen(false)} disabled={isSubmitting}>
                Batal
              </Button>
              <Button variant="destructive" onClick={handleSuspend} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Suspend
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Reject KYC Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tolak KYC</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Alasan Penolakan</Label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Masukkan alasan penolakan KYC..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={isSubmitting}>
                Batal
              </Button>
              <Button variant="destructive" onClick={handleRejectKYC} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Tolak KYC
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
