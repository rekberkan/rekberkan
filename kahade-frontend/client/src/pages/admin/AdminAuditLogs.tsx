/*
 * KAHADE ADMIN AUDIT LOGS PAGE
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Filter, FileText, User, ArrowLeftRight, Shield,
  Wallet, Settings, Clock, ChevronDown, ChevronUp
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

// Mock data
const auditLogs = [
  { 
    id: '1', 
    action: 'USER_LOGIN', 
    actor: 'johndoe', 
    actorType: 'USER',
    target: 'Session',
    details: { ip: '192.168.1.1', device: 'Chrome/Windows' },
    timestamp: '2025-01-24T14:30:00Z' 
  },
  { 
    id: '2', 
    action: 'TRANSACTION_CREATED', 
    actor: 'janedoe', 
    actorType: 'USER',
    target: 'KHD-2025-0010',
    details: { amount: 5000000, category: 'SERVICES' },
    timestamp: '2025-01-24T14:15:00Z' 
  },
  { 
    id: '3', 
    action: 'KYC_APPROVED', 
    actor: 'admin', 
    actorType: 'ADMIN',
    target: 'bobsmith',
    details: { previousStatus: 'PENDING', newStatus: 'VERIFIED' },
    timestamp: '2025-01-24T13:45:00Z' 
  },
  { 
    id: '4', 
    action: 'WITHDRAWAL_PROCESSED', 
    actor: 'system', 
    actorType: 'SYSTEM',
    target: 'WD-2025-0005',
    details: { amount: 10000000, bank: 'BCA' },
    timestamp: '2025-01-24T13:00:00Z' 
  },
  { 
    id: '5', 
    action: 'USER_SUSPENDED', 
    actor: 'admin', 
    actorType: 'ADMIN',
    target: 'spammer123',
    details: { reason: 'Spam activity detected' },
    timestamp: '2025-01-24T12:30:00Z' 
  },
  { 
    id: '6', 
    action: 'DISPUTE_RESOLVED', 
    actor: 'admin', 
    actorType: 'ADMIN',
    target: 'KHD-2025-0008',
    details: { resolution: 'Refund 50% to buyer', winner: 'buyer' },
    timestamp: '2025-01-24T11:00:00Z' 
  },
  { 
    id: '7', 
    action: 'PAYMENT_RECEIVED', 
    actor: 'system', 
    actorType: 'SYSTEM',
    target: 'KHD-2025-0009',
    details: { amount: 18500000, method: 'Bank Transfer' },
    timestamp: '2025-01-24T10:30:00Z' 
  },
  { 
    id: '8', 
    action: 'SETTINGS_UPDATED', 
    actor: 'superadmin', 
    actorType: 'ADMIN',
    target: 'Platform Settings',
    details: { field: 'platform_fee', oldValue: '1%', newValue: '1.5%' },
    timestamp: '2025-01-24T09:00:00Z' 
  },
];

const actionConfig: Record<string, { label: string; icon: typeof User; color: string }> = {
  USER_LOGIN: { label: 'User Login', icon: User, color: 'text-blue-500 bg-blue-500/10' },
  USER_SUSPENDED: { label: 'User Suspended', icon: User, color: 'text-red-500 bg-red-500/10' },
  TRANSACTION_CREATED: { label: 'Transaksi Dibuat', icon: ArrowLeftRight, color: 'text-emerald-500 bg-emerald-500/10' },
  KYC_APPROVED: { label: 'KYC Disetujui', icon: Shield, color: 'text-emerald-500 bg-emerald-500/10' },
  WITHDRAWAL_PROCESSED: { label: 'Penarikan Diproses', icon: Wallet, color: 'text-amber-500 bg-amber-500/10' },
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
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [actorFilter, setActorFilter] = useState('all');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesActor = actorFilter === 'all' || log.actorType === actorFilter;
    return matchesSearch && matchesAction && matchesActor;
  });

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
          <Select value={actionFilter} onValueChange={setActionFilter}>
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
          <Select value={actorFilter} onValueChange={setActorFilter}>
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
        
        {/* Logs List */}
        <div className="space-y-3">
          {filteredLogs.map((log, index) => {
            const action = actionConfig[log.action] || { label: log.action, icon: FileText, color: 'text-gray-500 bg-gray-500/10' };
            const actorType = actorTypeConfig[log.actorType];
            const isExpanded = expandedLog === log.id;
            
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
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
        </div>
        
        {filteredLogs.length === 0 && (
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
