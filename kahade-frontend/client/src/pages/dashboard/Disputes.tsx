/*
 * KAHADE DISPUTES PAGE
 * View and manage transaction disputes
 * Icons: Phosphor Icons only
 */

import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import {
  Warning, Clock, CheckCircle, Spinner, ArrowRight,
  ChatCircle, Scales, FileText, Plus, XCircle
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { disputeApi } from '@/lib/api';

interface Dispute {
  id: string;
  orderId: string;
  order: {
    title: string;
    amount: number;
  };
  reason: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof Warning }> = {
  OPEN: { label: 'Open', color: 'text-amber-600', bgColor: 'bg-amber-50', icon: Warning },
  UNDER_REVIEW: { label: 'Under Review', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Clock },
  RESOLVED: { label: 'Resolved', color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: CheckCircle },
  CLOSED: { label: 'Closed', color: 'text-gray-600', bgColor: 'bg-gray-50', icon: XCircle },
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function Disputes() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const response = await disputeApi.getList({ limit: 50 });
      setDisputes(response.data.disputes || response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch disputes:', error);
      toast.error('Failed to load disputes');
    } finally {
      setIsLoading(false);
    }
  };

  const filterDisputes = (status?: string) => {
    if (!status || status === 'all') return disputes;
    return disputes.filter(d => d.status === status);
  };

  const stats = {
    total: disputes.length,
    open: disputes.filter(d => d.status === 'OPEN').length,
    underReview: disputes.filter(d => d.status === 'UNDER_REVIEW').length,
    resolved: disputes.filter(d => d.status === 'RESOLVED' || d.status === 'CLOSED').length,
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Disputes" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Spinner className="w-8 h-8 animate-spin text-black" weight="bold" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Disputes" subtitle="View and manage your transaction disputes">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-[#E5E5E5] p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] flex items-center justify-center">
                <Scales className="w-5 h-5 text-black" weight="duotone" />
              </div>
              <div>
                <div className="text-2xl font-bold text-black">{stats.total}</div>
                <div className="text-sm text-[#6B7280]">Total</div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-[#E5E5E5] p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Warning className="w-5 h-5 text-amber-600" weight="duotone" />
              </div>
              <div>
                <div className="text-2xl font-bold text-black">{stats.open}</div>
                <div className="text-sm text-[#6B7280]">Open</div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-[#E5E5E5] p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" weight="duotone" />
              </div>
              <div>
                <div className="text-2xl font-bold text-black">{stats.underReview}</div>
                <div className="text-sm text-[#6B7280]">Under Review</div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl border border-[#E5E5E5] p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" weight="duotone" />
              </div>
              <div>
                <div className="text-2xl font-bold text-black">{stats.resolved}</div>
                <div className="text-sm text-[#6B7280]">Resolved</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Disputes List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-[#E5E5E5]"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-[#E5E5E5] px-4">
              <TabsList className="bg-transparent h-14">
                <TabsTrigger value="all" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none">
                  All ({stats.total})
                </TabsTrigger>
                <TabsTrigger value="OPEN" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none">
                  Open ({stats.open})
                </TabsTrigger>
                <TabsTrigger value="UNDER_REVIEW" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none">
                  Under Review ({stats.underReview})
                </TabsTrigger>
                <TabsTrigger value="resolved" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none">
                  Resolved ({stats.resolved})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="p-4 mt-0">
              {filterDisputes(activeTab === 'resolved' ? undefined : activeTab).length === 0 ? (
                <div className="text-center py-12">
                  <Scales className="w-16 h-16 mx-auto mb-4 text-[#9CA3AF]" weight="duotone" />
                  <h4 className="text-lg font-semibold text-black mb-2">No Disputes</h4>
                  <p className="text-[#6B7280]">
                    {activeTab === 'all' 
                      ? "You don't have any disputes yet" 
                      : `No ${activeTab.toLowerCase().replace('_', ' ')} disputes`}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filterDisputes(activeTab === 'resolved' ? undefined : activeTab)
                    .filter(d => activeTab !== 'resolved' || d.status === 'RESOLVED' || d.status === 'CLOSED')
                    .map((dispute) => {
                      const status = statusConfig[dispute.status];
                      return (
                        <Link key={dispute.id} href={`/app/disputes/${dispute.id}`}>
                          <div className="flex items-center justify-between p-4 rounded-xl bg-[#FAFAFA] hover:bg-[#F5F5F5] transition-colors cursor-pointer border border-transparent hover:border-[#E5E5E5]">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status.bgColor}`}>
                                <status.icon className={`w-5 h-5 ${status.color}`} weight="duotone" />
                              </div>
                              <div>
                                <div className="font-medium text-black">{dispute.order.title}</div>
                                <div className="text-sm text-[#6B7280]">
                                  {formatCurrency(dispute.order.amount)} • {formatDate(dispute.createdAt)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs px-2 py-1 rounded-full ${status.bgColor} ${status.color}`}>
                                {status.label}
                              </span>
                              <ArrowRight className="w-5 h-5 text-[#9CA3AF]" weight="bold" />
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#F5F5F5] rounded-xl p-6"
        >
          <div className="flex items-start gap-4">
            <ChatCircle className="w-8 h-8 text-black" weight="duotone" />
            <div>
              <h3 className="font-semibold text-black mb-1">Need Help with a Dispute?</h3>
              <p className="text-sm text-[#6B7280] mb-3">
                Our support team is available 24/7 to help resolve your disputes fairly and quickly.
              </p>
              <Link href="/app/help">
                <Button variant="outline" size="sm">
                  Contact Support
                  <ArrowRight className="w-4 h-4 ml-2" weight="bold" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
