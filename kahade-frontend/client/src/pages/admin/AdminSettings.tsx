/*
 * KAHADE ADMIN SETTINGS PAGE
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, Percent, Clock, Shield, Bell, Database,
  Save, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    platformFee: '1',
    minTransaction: '100000',
    maxTransaction: '100000000',
    escrowDuration: '7',
    disputeWindow: '3',
    autoReleaseDays: '14',
    maintenanceMode: false,
    registrationEnabled: true,
    kycRequired: false,
    emailNotifications: true,
    slackNotifications: false,
  });

  const handleSave = () => {
    toast.success('Pengaturan berhasil disimpan');
  };

  const handleReset = () => {
    toast.info('Pengaturan direset ke default');
  };

  return (
    <AdminLayout title="Pengaturan Platform" subtitle="Konfigurasi sistem Kahade">
      <div className="max-w-4xl space-y-6">
        {/* Transaction Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Percent className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-display font-semibold">Pengaturan Transaksi</h3>
              <p className="text-sm text-muted-foreground">Konfigurasi biaya dan limit transaksi</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="platformFee">Biaya Platform (%)</Label>
              <Input
                id="platformFee"
                type="number"
                value={settings.platformFee}
                onChange={(e) => setSettings({ ...settings, platformFee: e.target.value })}
                className="bg-white/5 border-white/10"
              />
              <p className="text-xs text-muted-foreground">Persentase biaya per transaksi</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="minTransaction">Minimum Transaksi (IDR)</Label>
              <Input
                id="minTransaction"
                type="number"
                value={settings.minTransaction}
                onChange={(e) => setSettings({ ...settings, minTransaction: e.target.value })}
                className="bg-white/5 border-white/10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxTransaction">Maximum Transaksi (IDR)</Label>
              <Input
                id="maxTransaction"
                type="number"
                value={settings.maxTransaction}
                onChange={(e) => setSettings({ ...settings, maxTransaction: e.target.value })}
                className="bg-white/5 border-white/10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="escrowDuration">Durasi Escrow Default (Hari)</Label>
              <Select 
                value={settings.escrowDuration} 
                onValueChange={(value) => setSettings({ ...settings, escrowDuration: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Hari</SelectItem>
                  <SelectItem value="7">7 Hari</SelectItem>
                  <SelectItem value="14">14 Hari</SelectItem>
                  <SelectItem value="30">30 Hari</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>
        
        {/* Dispute Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-display font-semibold">Pengaturan Dispute</h3>
              <p className="text-sm text-muted-foreground">Konfigurasi waktu dan proses dispute</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="disputeWindow">Jendela Dispute (Hari)</Label>
              <Input
                id="disputeWindow"
                type="number"
                value={settings.disputeWindow}
                onChange={(e) => setSettings({ ...settings, disputeWindow: e.target.value })}
                className="bg-white/5 border-white/10"
              />
              <p className="text-xs text-muted-foreground">Waktu untuk mengajukan dispute setelah pengiriman</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="autoReleaseDays">Auto-Release (Hari)</Label>
              <Input
                id="autoReleaseDays"
                type="number"
                value={settings.autoReleaseDays}
                onChange={(e) => setSettings({ ...settings, autoReleaseDays: e.target.value })}
                className="bg-white/5 border-white/10"
              />
              <p className="text-xs text-muted-foreground">Dana otomatis dilepas jika tidak ada konfirmasi</p>
            </div>
          </div>
        </motion.div>
        
        {/* Security Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-display font-semibold">Keamanan & Akses</h3>
              <p className="text-sm text-muted-foreground">Konfigurasi keamanan platform</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div>
                <div className="font-medium">Mode Maintenance</div>
                <div className="text-sm text-muted-foreground">Nonaktifkan akses publik sementara</div>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div>
                <div className="font-medium">Registrasi Terbuka</div>
                <div className="text-sm text-muted-foreground">Izinkan pengguna baru mendaftar</div>
              </div>
              <Switch
                checked={settings.registrationEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, registrationEnabled: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div>
                <div className="font-medium">KYC Wajib</div>
                <div className="text-sm text-muted-foreground">Wajibkan verifikasi untuk transaksi</div>
              </div>
              <Switch
                checked={settings.kycRequired}
                onCheckedChange={(checked) => setSettings({ ...settings, kycRequired: checked })}
              />
            </div>
          </div>
        </motion.div>
        
        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-display font-semibold">Notifikasi Admin</h3>
              <p className="text-sm text-muted-foreground">Konfigurasi notifikasi untuk admin</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-muted-foreground">Terima notifikasi via email</div>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div>
                <div className="font-medium">Slack Notifications</div>
                <div className="text-sm text-muted-foreground">Kirim notifikasi ke Slack channel</div>
              </div>
              <Switch
                checked={settings.slackNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, slackNotifications: checked })}
              />
            </div>
          </div>
        </motion.div>
        
        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset ke Default
          </Button>
          <Button className="btn-accent" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Simpan Perubahan
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
