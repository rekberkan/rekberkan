/*
 * KAHADE ADMIN USERS PAGE
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Filter, MoreVertical, User, Mail, Phone,
  CheckCircle2, AlertCircle, Ban, Eye
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
const users = [
  { id: '1', username: 'johndoe', email: 'john@example.com', phone: '+62812345678', kycStatus: 'VERIFIED', status: 'ACTIVE', transactions: 25, createdAt: '2024-06-15' },
  { id: '2', username: 'janedoe', email: 'jane@example.com', phone: '+62812345679', kycStatus: 'PENDING', status: 'ACTIVE', transactions: 12, createdAt: '2024-08-20' },
  { id: '3', username: 'bobsmith', email: 'bob@example.com', phone: '+62812345680', kycStatus: 'NONE', status: 'ACTIVE', transactions: 5, createdAt: '2024-10-01' },
  { id: '4', username: 'alicew', email: 'alice@example.com', phone: '+62812345681', kycStatus: 'VERIFIED', status: 'SUSPENDED', transactions: 30, createdAt: '2024-05-10' },
  { id: '5', username: 'charlie', email: 'charlie@example.com', phone: '+62812345682', kycStatus: 'REJECTED', status: 'ACTIVE', transactions: 8, createdAt: '2024-09-15' },
];

const kycStatusConfig: Record<string, { label: string; color: string }> = {
  NONE: { label: 'Belum', color: 'text-gray-500 bg-gray-500/10' },
  PENDING: { label: 'Pending', color: 'text-amber-500 bg-amber-500/10' },
  VERIFIED: { label: 'Verified', color: 'text-emerald-500 bg-emerald-500/10' },
  REJECTED: { label: 'Ditolak', color: 'text-red-500 bg-red-500/10' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Aktif', color: 'text-emerald-500 bg-emerald-500/10' },
  SUSPENDED: { label: 'Suspended', color: 'text-red-500 bg-red-500/10' },
};

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [kycFilter, setKycFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKyc = kycFilter === 'all' || user.kycStatus === kycFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesKyc && matchesStatus;
  });

  const handleSuspend = (userId: string) => {
    toast.success('User berhasil di-suspend');
  };

  const handleActivate = (userId: string) => {
    toast.success('User berhasil diaktifkan');
  };

  const handleApproveKYC = (userId: string) => {
    toast.success('KYC berhasil disetujui');
  };

  return (
    <AdminLayout title="Manajemen Pengguna" subtitle="Kelola semua pengguna platform">
      <div className="space-y-6">
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
          <Select value={kycFilter} onValueChange={setKycFilter}>
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 bg-white/5 border-white/10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="ACTIVE">Aktif</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
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
                  <th className="text-left p-4 font-medium text-muted-foreground">Transaksi</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Bergabung</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const kyc = kycStatusConfig[user.kycStatus];
                  const status = statusConfig[user.status];
                  
                  return (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-semibold">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{user.username}</div>
                            <div className="text-xs text-muted-foreground">ID: {user.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">{user.email}</div>
                        <div className="text-xs text-muted-foreground">{user.phone}</div>
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
                      <td className="p-4 font-medium">{user.transactions}</td>
                      <td className="p-4 text-sm text-muted-foreground">{user.createdAt}</td>
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
                              <DropdownMenuItem onClick={() => handleApproveKYC(user.id)}>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Approve KYC
                              </DropdownMenuItem>
                            )}
                            {user.status === 'ACTIVE' ? (
                              <DropdownMenuItem 
                                onClick={() => handleSuspend(user.id)}
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
                    <span>{selectedUser.phone}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="text-sm text-muted-foreground">KYC Status</div>
                    <span className={`text-sm px-2 py-0.5 rounded-full ${kycStatusConfig[selectedUser.kycStatus].color}`}>
                      {kycStatusConfig[selectedUser.kycStatus].label}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="text-sm text-muted-foreground">Status</div>
                    <span className={`text-sm px-2 py-0.5 rounded-full ${statusConfig[selectedUser.status].color}`}>
                      {statusConfig[selectedUser.status].label}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
