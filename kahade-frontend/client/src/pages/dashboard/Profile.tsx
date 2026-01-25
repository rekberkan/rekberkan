/*
 * KAHADE PROFILE PAGE
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, Phone, Star, Calendar, CheckCircle2,
  Upload, Camera, BadgeCheck, AlertCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { userApi } from '@/lib/api';

const kycStatusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  NONE: { label: 'Belum Verifikasi', color: 'text-gray-500 bg-gray-500/10', icon: AlertCircle },
  PENDING: { label: 'Menunggu Review', color: 'text-amber-500 bg-amber-500/10', icon: AlertCircle },
  VERIFIED: { label: 'Terverifikasi', color: 'text-emerald-500 bg-emerald-500/10', icon: CheckCircle2 },
  REJECTED: { label: 'Ditolak', color: 'text-red-500 bg-red-500/10', icon: AlertCircle },
};

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    completedTransactions: 0,
    disputeCount: 0,
  });
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await userApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const kycStatus = kycStatusConfig[user?.kycStatus || 'NONE'];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await userApi.updateProfile({
        username: formData.username,
        phone: formData.phone,
      });
      toast.success('Profil berhasil diperbarui');
      setIsEditing(false);
      refreshUser();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memperbarui profil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartKYC = () => {
    toast.info('Fitur KYC dalam pengembangan', {
      description: 'Verifikasi identitas akan segera tersedia.'
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      await userApi.uploadAvatar(formData);
      toast.success('Avatar berhasil diperbarui');
      refreshUser();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengupload avatar');
    }
  };

  return (
    <DashboardLayout title="Profil" subtitle="Kelola informasi akun Anda">
      <div className="max-w-4xl space-y-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user.username}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white text-3xl font-bold">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white hover:bg-accent/80 transition-colors cursor-pointer">
                <Camera className="w-4 h-4" />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleAvatarUpload}
                />
              </label>
            </div>
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-2xl font-display font-bold">{user?.username || 'User'}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <div className="flex items-center gap-4 mt-3 justify-center sm:justify-start">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-medium">{user?.reputationScore?.toFixed(1) || '0.0'}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {stats.totalTransactions} transaksi
                </div>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${kycStatus.color}`}>
              <kycStatus.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{kycStatus.label}</span>
            </div>
          </div>
        </motion.div>
        
        {/* KYC Section */}
        {user?.kycStatus !== 'VERIFIED' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 border-amber-500/20"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <BadgeCheck className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold mb-1">Verifikasi Identitas (KYC)</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Verifikasi identitas Anda untuk meningkatkan limit transaksi dan mendapatkan badge terverifikasi.
                </p>
                <div className="grid sm:grid-cols-3 gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="text-sm text-muted-foreground">Limit Saat Ini</div>
                    <div className="font-semibold">Rp 10.000.000</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="text-sm text-muted-foreground">Setelah Verifikasi</div>
                    <div className="font-semibold text-emerald-500">Rp 100.000.000</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="text-sm text-muted-foreground">Dokumen</div>
                    <div className="font-semibold">KTP + Selfie</div>
                  </div>
                </div>
                <Button className="btn-accent" onClick={handleStartKYC}>
                  <Upload className="w-4 h-4 mr-2" />
                  Mulai Verifikasi
                </Button>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Profile Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-display font-semibold">Informasi Pribadi</h3>
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit Profil
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} disabled={isSaving}>
                  Batal
                </Button>
                <Button size="sm" className="btn-accent" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan'
                  )}
                </Button>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    disabled={!isEditing}
                    className="pl-10 bg-white/5 border-white/10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="pl-10 bg-white/5 border-white/10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Email tidak dapat diubah</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Nomor Telepon</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  placeholder="+62 812 3456 7890"
                  className="pl-10 bg-white/5 border-white/10"
                />
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Account Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-display font-semibold mb-4">Statistik Akun</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white/5 text-center">
              <div className="text-2xl font-display font-bold gradient-text">
                {stats.totalTransactions}
              </div>
              <div className="text-sm text-muted-foreground">Total Transaksi</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 text-center">
              <div className="text-2xl font-display font-bold text-emerald-500">
                {stats.completedTransactions}
              </div>
              <div className="text-sm text-muted-foreground">Selesai</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 text-center">
              <div className="text-2xl font-display font-bold text-amber-500">
                {user?.reputationScore?.toFixed(1) || '0.0'}
              </div>
              <div className="text-sm text-muted-foreground">Rating</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : '-'}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">Bergabung</div>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
