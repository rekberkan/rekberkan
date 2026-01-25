/*
 * KAHADE NOTIFICATIONS PAGE
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bell, AlertCircle, Info, Wallet, ArrowLeftRight,
  Check, Trash2, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { notificationApi } from '@/lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: any;
}

const typeConfig: Record<string, { icon: typeof Bell; color: string; bgColor: string }> = {
  TRANSACTION: { icon: ArrowLeftRight, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  PAYMENT: { icon: Wallet, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  INFO: { icon: Info, color: 'text-accent', bgColor: 'bg-accent/10' },
  ALERT: { icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-500/10' },
  DISPUTE: { icon: AlertCircle, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  SYSTEM: { icon: Info, color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (hours < 1) return 'Baru saja';
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 7) return `${days} hari lalu`;
  
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short'
  }).format(date);
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  
  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const params: any = { limit: 50 };
      if (filter === 'unread') params.read = false;
      
      const response = await notificationApi.list(params);
      setNotifications(response.data.data || response.data.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      toast.success('Semua notifikasi ditandai sudah dibaca');
    } catch (error) {
      toast.error('Gagal menandai notifikasi');
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationApi.markRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      toast.error('Gagal menandai notifikasi');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationApi.delete(id);
      setNotifications(notifications.filter(n => n.id !== id));
      toast.success('Notifikasi dihapus');
    } catch (error) {
      toast.error('Gagal menghapus notifikasi');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Notifikasi" subtitle="Memuat...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Notifikasi" subtitle={`${unreadCount} notifikasi belum dibaca`}>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-accent" />
              <span className="font-medium">{notifications.length} Notifikasi</span>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={filter === 'all' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setFilter('all')}
              >
                Semua
              </Button>
              <Button 
                variant={filter === 'unread' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Belum Dibaca
              </Button>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
              <Check className="w-4 h-4 mr-2" />
              Tandai Semua Dibaca
            </Button>
          )}
        </div>
        
        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.length > 0 ? (
            notifications.map((notif, index) => {
              const config = typeConfig[notif.type] || typeConfig.INFO;
              const Icon = config.icon;
              
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`glass-card p-4 flex gap-4 ${!notif.read ? 'border-l-2 border-l-accent' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.bgColor}`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className={`font-medium ${!notif.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notif.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDate(notif.createdAt)}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {!notif.read && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs"
                          onClick={() => handleMarkRead(notif.id)}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Tandai Dibaca
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs text-muted-foreground hover:text-red-500"
                        onClick={() => handleDelete(notif.id)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Hapus
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="glass-card p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-display font-semibold mb-2">Tidak ada notifikasi</h3>
              <p className="text-sm text-muted-foreground">
                {filter === 'unread' 
                  ? 'Semua notifikasi sudah dibaca.'
                  : 'Anda akan menerima notifikasi tentang transaksi dan aktivitas akun di sini.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
