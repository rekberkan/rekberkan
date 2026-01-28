/*
 * KAHADE ACTIVITY LOG PAGE
 * View all account activities and security events
 * Icons: Phosphor Icons only
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ClockCounterClockwise, SignIn, SignOut, Key, ShieldCheck,
  Wallet, CreditCard, User, Spinner, Warning, CheckCircle,
  DeviceMobile, Globe, MapPin
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { activityApi } from '@/lib/api';

interface Activity {
  id: string;
  type: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

const activityConfig: Record<string, { icon: typeof SignIn; color: string; bgColor: string }> = {
  LOGIN: { icon: SignIn, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  LOGOUT: { icon: SignOut, color: 'text-gray-600', bgColor: 'bg-gray-50' },
  PASSWORD_CHANGE: { icon: Key, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  PASSWORD_RESET: { icon: Key, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  MFA_ENABLED: { icon: ShieldCheck, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  MFA_DISABLED: { icon: ShieldCheck, color: 'text-red-600', bgColor: 'bg-red-50' },
  PROFILE_UPDATE: { icon: User, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  KYC_SUBMITTED: { icon: ShieldCheck, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  KYC_VERIFIED: { icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  KYC_REJECTED: { icon: Warning, color: 'text-red-600', bgColor: 'bg-red-50' },
  WALLET_TOPUP: { icon: Wallet, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  WALLET_WITHDRAW: { icon: Wallet, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  BANK_ADDED: { icon: CreditCard, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  BANK_REMOVED: { icon: CreditCard, color: 'text-red-600', bgColor: 'bg-red-50' },
  ORDER_CREATED: { icon: ClockCounterClockwise, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  ORDER_COMPLETED: { icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  DISPUTE_OPENED: { icon: Warning, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  DISPUTE_RESOLVED: { icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const parseUserAgent = (ua?: string) => {
  if (!ua) return { device: 'Unknown', browser: 'Unknown' };
  
  let device = 'Desktop';
  if (ua.includes('Mobile') || ua.includes('Android')) device = 'Mobile';
  if (ua.includes('iPad') || ua.includes('Tablet')) device = 'Tablet';
  
  let browser = 'Unknown';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  
  return { device, browser };
};

export default function ActivityLog() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [filter]);

  const fetchActivities = async (loadMore = false) => {
    try {
      const currentPage = loadMore ? page + 1 : 1;
      const params: any = { page: currentPage, limit: 20 };
      if (filter !== 'all') params.type = filter;

      const response = await activityApi.getList(params);
      const newActivities = response.data.activities || response.data.data || [];
      
      if (loadMore) {
        setActivities([...activities, ...newActivities]);
        setPage(currentPage);
      } else {
        setActivities(newActivities);
        setPage(1);
      }
      
      setHasMore(newActivities.length === 20);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      toast.error('Failed to load activity log');
    } finally {
      setIsLoading(false);
    }
  };

  const activityTypes = [
    { value: 'all', label: 'All Activities' },
    { value: 'LOGIN', label: 'Login' },
    { value: 'LOGOUT', label: 'Logout' },
    { value: 'PASSWORD_CHANGE', label: 'Password Change' },
    { value: 'PROFILE_UPDATE', label: 'Profile Update' },
    { value: 'KYC_SUBMITTED', label: 'KYC Submission' },
    { value: 'WALLET_TOPUP', label: 'Wallet Top Up' },
    { value: 'WALLET_WITHDRAW', label: 'Wallet Withdrawal' },
    { value: 'ORDER_CREATED', label: 'Order Created' },
    { value: 'DISPUTE_OPENED', label: 'Dispute Opened' },
  ];

  if (isLoading) {
    return (
      <DashboardLayout title="Activity Log" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Spinner className="w-8 h-8 animate-spin text-black" weight="bold" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Activity Log" subtitle="View your account activity and security events">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center">
              <ClockCounterClockwise className="w-6 h-6 text-black" weight="duotone" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-black">Recent Activity</h2>
              <p className="text-sm text-[#6B7280]">Your account activity for the last 90 days</p>
            </div>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              {activityTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#F5F5F5] rounded-xl p-4 flex items-start gap-3"
        >
          <ShieldCheck className="w-5 h-5 text-black mt-0.5" weight="duotone" />
          <div>
            <p className="text-sm font-medium text-black">Security Monitoring</p>
            <p className="text-sm text-[#6B7280]">
              We track all account activities to help keep your account secure. 
              If you notice any suspicious activity, please contact support immediately.
            </p>
          </div>
        </motion.div>

        {/* Activity List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-[#E5E5E5]"
        >
          {activities.length === 0 ? (
            <div className="text-center py-12">
              <ClockCounterClockwise className="w-16 h-16 mx-auto mb-4 text-[#9CA3AF]" weight="duotone" />
              <h4 className="text-lg font-semibold text-black mb-2">No Activity</h4>
              <p className="text-[#6B7280]">No activities found for the selected filter</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E5E5]">
              {activities.map((activity, index) => {
                const config = activityConfig[activity.type] || {
                  icon: ClockCounterClockwise,
                  color: 'text-gray-600',
                  bgColor: 'bg-gray-50'
                };
                const { device, browser } = parseUserAgent(activity.userAgent);
                
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 hover:bg-[#FAFAFA] transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.bgColor}`}>
                        <config.icon className={`w-5 h-5 ${config.color}`} weight="duotone" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-black">{activity.description}</p>
                            <div className="flex items-center gap-3 mt-1 text-sm text-[#6B7280]">
                              <span className="flex items-center gap-1">
                                {device === 'Mobile' ? (
                                  <DeviceMobile className="w-4 h-4" weight="regular" />
                                ) : (
                                  <Globe className="w-4 h-4" weight="regular" />
                                )}
                                {device} • {browser}
                              </span>
                              {activity.ipAddress && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" weight="regular" />
                                  {activity.ipAddress}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-sm text-[#6B7280] whitespace-nowrap">
                            {formatDate(activity.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
          
          {hasMore && activities.length > 0 && (
            <div className="p-4 border-t border-[#E5E5E5]">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fetchActivities(true)}
              >
                Load More
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
