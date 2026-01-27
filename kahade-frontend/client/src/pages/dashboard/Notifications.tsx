/*
 * KAHADE NOTIFICATIONS PAGE
 * Icons: Phosphor Icons only
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bell, Warning, Info, Wallet, ArrowsLeftRight,
  Check, Trash, Spinner
} from '@phosphor-icons/react';
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
  TRANSACTION: { icon: ArrowsLeftRight, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  PAYMENT: { icon: Wallet, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  INFO: { icon: Info, color: 'text-accent', bgColor: 'bg-accent/10' },
  ALERT: { icon: Warning, color: 'text-red-500', bgColor: 'bg-red-500/10' },
  DISPUTE: { icon: Warning, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  SYSTEM: { icon: Info, color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours} hours ago`;
  if (days < 7) return `${days} days ago`;
  
  return new Intl.DateTimeFormat('en-US', {
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
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark notifications');
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationApi.markRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      toast.error('Failed to mark notification');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationApi.delete(id);
      setNotifications(notifications.filter(n => n.id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Notifications" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Spinner className="w-8 h-8 animate-spin text-accent" weight="bold" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Notifications" subtitle={`${unreadCount} unread notifications`}>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-accent" weight="duotone" />
              <span className="font-medium">{notifications.length} Notifications</span>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={filter === 'all' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button 
                variant={filter === 'unread' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Unread
              </Button>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
              <Check className="w-4 h-4 mr-2" weight="bold" />
              Mark All Read
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
                    <Icon className={`w-5 h-5 ${config.color}`} weight="duotone" />
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
                          <Check className="w-3 h-3 mr-1" weight="bold" />
                          Mark Read
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs text-muted-foreground hover:text-red-500"
                        onClick={() => handleDelete(notif.id)}
                      >
                        <Trash className="w-3 h-3 mr-1" weight="bold" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="glass-card p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-muted-foreground" weight="regular" />
              </div>
              <h3 className="font-semibold mb-2">No notifications</h3>
              <p className="text-sm text-muted-foreground">
                {filter === 'unread' 
                  ? 'All notifications have been read.'
                  : 'You will receive notifications about transactions and account activity here.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
