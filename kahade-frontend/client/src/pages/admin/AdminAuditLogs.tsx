/*
 * KAHADE ADMIN AUDIT LOGS PAGE
 * Uses real API for audit logs
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Filter, FileText, User, ArrowLeftRight, Shield,
  Wallet, Settings, Clock, ChevronDown, ChevronUp, Loader2
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
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/api';

interface AuditLog {
  id: string;
  action: string;
  actor: string;
  actorType: string;
  target: string;
  details: Record<string, any>;
  timestamp: string;
  createdAt?: string;
}

const actionConfig: Record<string, { label: string; icon: typeof User; color: string }> = {
  USER_LOGIN: { label: 'User Login', icon: User, color: 'text-blue-500 bg-blue-500/10' },
  USER_LOGOUT: { label: 'User Logout', icon: User, color: 'text-gray-500 bg-gray-500/10' },
  USER_SUSPENDED: { label: 'User Suspended', icon: User, color: 'text-red-500 bg-red-500/10' },
  USER_ACTIVATED: { label: 'User Activated', icon: User, color: 'text-emerald-500 bg-emerald-500/10' },
  TRANSACTION_CREATED: { label: 'Transaksi Dibuat', icon: ArrowLeftRight, color: 'text-emerald-500 bg-emerald-500/10' },
  TRANSACTION_COMPLETED: { label: 'Transaksi Selesai', icon: ArrowLeftRight, color: 'text-emerald-500 bg-emerald-500/10' },
  TRANSACTION_CANCELLED: { label: 'Transaksi Dibatalkan', icon: ArrowLeftRight, color: 'text-red-500 bg-red-500/10' },
  KYC_SUBMITTED: { label: 'KYC Diajukan', icon: Shield, color: 'text-amber-500 bg-amber-500/10' },
  KYC_APPROVED: { label: 'KYC Disetujui', icon: Shield, color: 'text-emerald-500 bg-emerald-500/10' },
  KYC_REJECTED: { label: 'KYC Ditolak', icon: Shield, color: 'text-red-500 bg-red-500/10' },
  WITHDRAWAL_REQUESTED: { label: 'Penarikan Diajukan', icon: Wallet, color: 'text-amber-500 bg-amber-500/10' },
  WITHDRAWAL_PROCESSED: { label: 'Penarikan Diproses', icon: Wallet, color: 'text-emerald-500 bg-emerald-500/10' },
  WITHDRAWAL_REJECTED: { label: 'Penarikan Ditolak', icon: Wallet, color: 'text-red-500 bg-red-500/10' },
  DISPUTE_CREATED: { label: 'Dispute Dibuat', icon: Shield, color: 'text-amber-500 bg-amber-500/10' },
  DISPUTE_RESOLVED: { label: 'Dispute Diselesaikan', icon: Shield, color: 'text-purple-500 bg-purple-500/10' },
  PAYMENT_RECEIVED: { label: 'Pembayaran Diterima', icon: Wallet, color: 'text-emerald-500 bg-emerald-500/10' },
  SETTINGS_UPDATED: { label: 'Pengaturan Diubah', icon: Settings, color: 'text-amber-500 bg-amber-500/10' },
};

const actorTypeConfig: Record<string, { label: string; color: string }> = {
  USER: { label: 'User', color: 'text-blue-500' },
  ADMIN: { label: 'Admin', color: 'text-purple-500' },
  SYSTEM: { label: 'System', color: 'text-gray-500' },
};

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString));
};

export default function AdminAuditLogs() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [actorFilter, setActorFilter] = useState('all');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, [actionFilter, actorFilter, page]);

  const fetchAuditLogs = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = { page, limit: 20 };
      if (actionFilter !== 'all') params.action = actionFilter;
      if (actorFilter !== 'all') params.actorType = actorFilter;

      const response = await adminApi.getAuditLogs(params);
      const logs = response.data.data || response.data.logs || response.data || [];
      
      // Transform API response to match expected format
      const transformedLogs = logs.map((log: any) => ({
        id: log.id,
        action: log.action || log.type,
        actor: log.actor || log.actorId || log.user?.username || 'Unknown',
        actorType: log.actorType || 'SYSTEM',
        target: log.target || log.targetId || log.resourceId || '-',
        details: log.details || log.metadata || {},
        timestamp: log.timestamp || log.createdAt,
      }));

      if (page === 1) {
        setAuditLogs(transformedLogs);
      } else {
        setAuditLogs(prev => [...prev, ...transformedLogs]);
      }
      
      setHasMore(transformedLogs.length === 20);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      // Set empty array if API fails
      if (page === 1) setAuditLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = searchQuery === '' || 
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const loadMore = () => {
    if (hasMore && !isLoading) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <AdminLayout title="Audit Logs" subtitle="Riwayat aktivitas sistem">
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Cari actor atau target..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10"
            />
          </div>
          <Select value={actionFilter} onValueChange={(value) => { setActionFilter(value); setPage(1); }}>
            <SelectTrigger className="w-48 bg-white/5 border-white/10">
              <SelectValue placeholder="Tipe Aksi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Aksi</SelectItem>
              <SelectItem value="USER_LOGIN">User Login</SelectItem>
              <SelectItem value="TRANSACTION_CREATED">Transaksi Dibuat</SelectItem>
              <SelectItem value="KYC_APPROVED">KYC Disetujui</SelectItem>
              <SelectItem value="WITHDRAWAL_PROCESSED">Penarikan</SelectItem>
              <SelectItem value="DISPUTE_RESOLVED">Dispute Resolved</SelectItem>
              <SelectItem value="PAYMENT_RECEIVED">Pembayaran</SelectItem>
              <SelectItem value="SETTINGS_UPDATED">Settings Updated</SelectItem>
            </SelectContent>
          </Select>
          <Select value={actorFilter} onValueChange={(value) => { setActorFilter(value); setPage(1); }}>
            <SelectTrigger className="w-36 bg-white/5 border-white/10">
              <SelectValue placeholder="Actor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="SYSTEM">System</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {isLoading && page === 1 && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        )}
        
        {/* Logs List */}
        {(!isLoading || page > 1) && (
          <div className="space-y-3">
            {filteredLogs.map((log, index) => {
              const action = actionConfig[log.action] || { label: log.action, icon: FileText, color: 'text-gray-500 bg-gray-500/10' };
              const actorType = actorTypeConfig[log.actorType] || { label: log.actorType, color: 'text-gray-500' };
              const isExpanded = expandedLog === log.id;
              
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.03, 0.3) }}
                  className="glass-card overflow-hidden"
                >
                  <div 
                    className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5"
                    onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{action.label}</span>
                        <span className={`text-xs ${actorType.color}`}>• {actorType.label}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">{log.actor}</span>
                        <span className="mx-2">→</span>
                        <span>{log.target}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(log.timestamp)}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/10 p-4 bg-white/5"
                    >
                      <div className="text-sm text-muted-foreground mb-2">Detail:</div>
                      <pre className="text-sm font-mono bg-black/20 p-3 rounded-lg overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}

            {/* Load More Button */}
            {hasMore && filteredLogs.length > 0 && (
              <div className="flex justify-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={loadMore}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Memuat...
                    </>
                  ) : (
                    'Muat Lebih Banyak'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
        
        {!isLoading && filteredLogs.length === 0 && (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display font-semibold mb-2">Tidak ada log</h3>
            <p className="text-sm text-muted-foreground">
              Tidak ada audit log yang sesuai dengan filter.
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
