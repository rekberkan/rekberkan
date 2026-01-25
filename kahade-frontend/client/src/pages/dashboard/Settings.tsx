/*
 * KAHADE SETTINGS PAGE
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Lock, Bell, Shield, Smartphone, Eye, EyeOff, Loader2, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { userApi, authApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Session {
  id: string;
  userAgent: string;
  ipAddress: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

export default function Settings() {
  const { user } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    transaction: true,
    marketing: false
  });
  
  const [twoFactor, setTwoFactor] = useState(false);

  useEffect(() => {
    fetchSessions();
    if (user?.mfaEnabled) {
      setTwoFactor(true);
    }
  }, [user]);

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const response = await authApi.getSessions();
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      // Set default current session
      setSessions([{
        id: 'current',
        userAgent: navigator.userAgent,
        ipAddress: 'Current Device',
        lastActiveAt: new Date().toISOString(),
        isCurrent: true
      }]);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error('Mohon isi semua field');
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password baru minimal 8 karakter');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Password baru tidak cocok');
      return;
    }

    setIsChangingPassword(true);
    try {
      await userApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success('Password berhasil diubah');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengubah password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleToggle2FA = async () => {
    if (!twoFactor) {
      // Enable 2FA
      try {
        const response = await authApi.enable2FA();
        if (response.data.qrCode) {
          // Show QR code to user (simplified - in production would show modal with QR)
          toast.info('Scan QR code dengan aplikasi authenticator Anda');
          setTwoFactor(true);
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Gagal mengaktifkan 2FA');
      }
    } else {
      // Disable 2FA
      try {
        await authApi.disable2FA();
        setTwoFactor(false);
        toast.success('2FA dinonaktifkan');
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Gagal menonaktifkan 2FA');
      }
    }
  };

  const handleSaveNotifications = async () => {
    setIsSavingNotifications(true);
    try {
      await userApi.updateNotificationSettings(notifications);
      toast.success('Pengaturan notifikasi disimpan');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan pengaturan');
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await authApi.revokeSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
      toast.success('Sesi berhasil dihapus');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menghapus sesi');
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      await authApi.revokeAllSessions();
      toast.success('Semua sesi lain berhasil dihapus');
      fetchSessions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menghapus sesi');
    }
  };

  const parseUserAgent = (ua: string) => {
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Browser';
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 5) return 'Aktif sekarang';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} jam lalu`;
    return `${Math.floor(minutes / 1440)} hari lalu`;
  };

  return (
    <DashboardLayout title="Pengaturan" subtitle="Kelola preferensi akun Anda">
      <div className="max-w-3xl space-y-6">
        {/* Change Password */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-display font-semibold">Ubah Password</h3>
              <p className="text-sm text-muted-foreground">Perbarui password akun Anda</p>
            </div>
          </div>
          
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Password Saat Ini</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="pr-10 bg-white/5 border-white/10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Password Baru</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="pr-10 bg-white/5 border-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>
            
            <Button type="submit" className="btn-accent" disabled={isChangingPassword}>
              {isChangingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Ubah Password'
              )}
            </Button>
          </form>
        </motion.div>
        
        {/* Two-Factor Authentication */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-display font-semibold">Autentikasi Dua Faktor (2FA)</h3>
                <p className="text-sm text-muted-foreground">
                  Tambahkan lapisan keamanan ekstra dengan 2FA
                </p>
              </div>
            </div>
            <Switch checked={twoFactor} onCheckedChange={handleToggle2FA} />
          </div>
          
          {twoFactor && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 text-emerald-500 mb-2">
                <Shield className="w-4 h-4" />
                <span className="font-medium">2FA Aktif</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Akun Anda dilindungi dengan autentikasi dua faktor.
              </p>
            </div>
          )}
        </motion.div>
        
        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-display font-semibold">Notifikasi</h3>
              <p className="text-sm text-muted-foreground">Kelola preferensi notifikasi</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div>
                <div className="font-medium">Notifikasi Email</div>
                <div className="text-sm text-muted-foreground">Terima update via email</div>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div>
                <div className="font-medium">Push Notification</div>
                <div className="text-sm text-muted-foreground">Notifikasi browser</div>
              </div>
              <Switch
                checked={notifications.push}
                onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div>
                <div className="font-medium">Update Transaksi</div>
                <div className="text-sm text-muted-foreground">Notifikasi status transaksi</div>
              </div>
              <Switch
                checked={notifications.transaction}
                onCheckedChange={(checked) => setNotifications({ ...notifications, transaction: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div>
                <div className="font-medium">Email Marketing</div>
                <div className="text-sm text-muted-foreground">Promo dan penawaran khusus</div>
              </div>
              <Switch
                checked={notifications.marketing}
                onCheckedChange={(checked) => setNotifications({ ...notifications, marketing: checked })}
              />
            </div>
          </div>
          
          <Button 
            className="mt-4 btn-accent" 
            onClick={handleSaveNotifications}
            disabled={isSavingNotifications}
          >
            {isSavingNotifications ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Simpan Pengaturan'
            )}
          </Button>
        </motion.div>
        
        {/* Connected Devices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h3 className="font-display font-semibold">Perangkat Terhubung</h3>
                <p className="text-sm text-muted-foreground">Kelola sesi login aktif</p>
              </div>
            </div>
            {sessions.length > 1 && (
              <Button variant="outline" size="sm" onClick={handleRevokeAllSessions}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout Semua
              </Button>
            )}
          </div>
          
          {isLoadingSessions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{parseUserAgent(session.userAgent)}</div>
                      <div className="text-sm text-muted-foreground">
                        {session.ipAddress} • {formatLastActive(session.lastActiveAt)}
                      </div>
                    </div>
                  </div>
                  {session.isCurrent ? (
                    <span className="text-xs text-emerald-500 px-2 py-1 bg-emerald-500/10 rounded-full">
                      Perangkat ini
                    </span>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500 hover:bg-red-500/10"
                      onClick={() => handleRevokeSession(session.id)}
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
        
        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 border-red-500/20"
        >
          <h3 className="font-display font-semibold text-red-500 mb-4">Zona Berbahaya</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Tindakan ini tidak dapat dibatalkan. Harap berhati-hati.
          </p>
          <Button 
            variant="outline" 
            className="border-red-500/20 text-red-500 hover:bg-red-500/10"
            onClick={() => toast.info('Silakan hubungi support untuk menghapus akun')}
          >
            Hapus Akun
          </Button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
