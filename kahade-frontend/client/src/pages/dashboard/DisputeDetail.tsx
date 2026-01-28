/*
 * KAHADE DISPUTE DETAIL PAGE
 * View dispute details and communicate with support
 * Icons: Phosphor Icons only
 */

import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Warning, Clock, CheckCircle, Spinner,
  ChatCircle, PaperPlaneRight, Paperclip, Image, XCircle,
  User, ShieldCheck, FileText
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { disputeApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface DisputeMessage {
  id: string;
  senderId: string;
  senderType: 'USER' | 'ADMIN';
  senderName: string;
  content: string;
  attachments?: string[];
  createdAt: string;
}

interface DisputeDetail {
  id: string;
  orderId: string;
  order: {
    id: string;
    title: string;
    amount: number;
    status: string;
  };
  initiatorId: string;
  initiator: {
    username: string;
  };
  reason: string;
  description: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
  resolution?: string;
  resolutionNotes?: string;
  messages: DisputeMessage[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
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
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function DisputeDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [dispute, setDispute] = useState<DisputeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (id) fetchDispute();
  }, [id]);

  const fetchDispute = async () => {
    try {
      const response = await disputeApi.getDetail(id!);
      setDispute(response.data);
    } catch (error) {
      console.error('Failed to fetch dispute:', error);
      toast.error('Failed to load dispute details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setIsSending(true);
    try {
      await disputeApi.sendMessage(id!, { content: message });
      toast.success('Message sent');
      setMessage('');
      fetchDispute();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Dispute Details" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Spinner className="w-8 h-8 animate-spin text-black" weight="bold" />
        </div>
      </DashboardLayout>
    );
  }

  if (!dispute) {
    return (
      <DashboardLayout title="Dispute Details" subtitle="Not found">
        <div className="text-center py-12">
          <Warning className="w-16 h-16 mx-auto mb-4 text-[#9CA3AF]" weight="duotone" />
          <h4 className="text-lg font-semibold text-black mb-2">Dispute Not Found</h4>
          <p className="text-[#6B7280] mb-4">The dispute you're looking for doesn't exist</p>
          <Button variant="outline" onClick={() => setLocation('/app/disputes')}>
            <ArrowLeft className="w-4 h-4 mr-2" weight="bold" />
            Back to Disputes
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const status = statusConfig[dispute.status];

  return (
    <DashboardLayout title="Dispute Details" subtitle={`#${dispute.id.slice(0, 8)}`}>
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => setLocation('/app/disputes')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" weight="bold" />
          Back to Disputes
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dispute Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-[#E5E5E5] p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-black mb-1">{dispute.order.title}</h2>
                  <p className="text-[#6B7280]">{formatCurrency(dispute.order.amount)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full flex items-center gap-2 ${status.bgColor} ${status.color}`}>
                  <status.icon className="w-4 h-4" weight="fill" />
                  {status.label}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-[#6B7280] mb-1">Reason</h4>
                  <p className="text-black">{dispute.reason}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-[#6B7280] mb-1">Description</h4>
                  <p className="text-black">{dispute.description}</p>
                </div>
              </div>
            </motion.div>

            {/* Resolution (if resolved) */}
            {dispute.status === 'RESOLVED' && dispute.resolutionNotes && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-emerald-50 rounded-xl border border-emerald-200 p-6"
              >
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-emerald-600 mt-0.5" weight="fill" />
                  <div>
                    <h3 className="font-semibold text-emerald-800 mb-1">Resolution</h3>
                    <p className="text-emerald-700">{dispute.resolutionNotes}</p>
                    <p className="text-sm text-emerald-600 mt-2">
                      Resolved on {formatDate(dispute.resolvedAt!)}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Messages */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden"
            >
              <div className="p-4 border-b border-[#E5E5E5]">
                <h3 className="font-semibold text-black flex items-center gap-2">
                  <ChatCircle className="w-5 h-5" weight="duotone" />
                  Messages
                </h3>
              </div>

              <div className="h-96 overflow-y-auto p-4 space-y-4">
                {dispute.messages.length === 0 ? (
                  <div className="text-center py-8">
                    <ChatCircle className="w-12 h-12 mx-auto mb-2 text-[#9CA3AF]" weight="duotone" />
                    <p className="text-[#6B7280]">No messages yet</p>
                  </div>
                ) : (
                  dispute.messages.map((msg) => {
                    const isOwn = msg.senderId === user?.id;
                    const isAdmin = msg.senderType === 'ADMIN';
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] ${isOwn ? 'order-2' : 'order-1'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            {isAdmin ? (
                              <ShieldCheck className="w-4 h-4 text-blue-600" weight="fill" />
                            ) : (
                              <User className="w-4 h-4 text-[#6B7280]" weight="fill" />
                            )}
                            <span className={`text-sm font-medium ${isAdmin ? 'text-blue-600' : 'text-[#6B7280]'}`}>
                              {msg.senderName}
                            </span>
                            <span className="text-xs text-[#9CA3AF]">
                              {new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className={`rounded-xl px-4 py-2 ${
                            isOwn 
                              ? 'bg-black text-white' 
                              : isAdmin 
                              ? 'bg-blue-50 text-blue-900' 
                              : 'bg-[#F5F5F5] text-black'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input */}
              {(dispute.status === 'OPEN' || dispute.status === 'UNDER_REVIEW') && (
                <div className="p-4 border-t border-[#E5E5E5]">
                  <div className="flex gap-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message..."
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    />
                    <Button
                      className="btn-primary"
                      onClick={handleSendMessage}
                      disabled={!message.trim() || isSending}
                    >
                      {isSending ? (
                        <Spinner className="w-4 h-4 animate-spin" />
                      ) : (
                        <PaperPlaneRight className="w-4 h-4" weight="fill" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl border border-[#E5E5E5] p-6"
            >
              <h3 className="font-semibold text-black mb-4">Order Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-[#6B7280]">Order ID</span>
                  <p className="font-mono text-black">{dispute.orderId.slice(0, 8)}...</p>
                </div>
                <div>
                  <span className="text-sm text-[#6B7280]">Amount</span>
                  <p className="font-semibold text-black">{formatCurrency(dispute.order.amount)}</p>
                </div>
                <div>
                  <span className="text-sm text-[#6B7280]">Order Status</span>
                  <p className="text-black">{dispute.order.status}</p>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setLocation(`/app/transactions/${dispute.orderId}`)}>
                  <FileText className="w-4 h-4 mr-2" weight="regular" />
                  View Order
                </Button>
              </div>
            </motion.div>

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl border border-[#E5E5E5] p-6"
            >
              <h3 className="font-semibold text-black mb-4">Timeline</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-black mt-2" />
                  <div>
                    <p className="text-sm font-medium text-black">Dispute Opened</p>
                    <p className="text-xs text-[#6B7280]">{formatDate(dispute.createdAt)}</p>
                  </div>
                </div>
                {dispute.status === 'UNDER_REVIEW' && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                    <div>
                      <p className="text-sm font-medium text-black">Under Review</p>
                      <p className="text-xs text-[#6B7280]">Admin is reviewing</p>
                    </div>
                  </div>
                )}
                {dispute.resolvedAt && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
                    <div>
                      <p className="text-sm font-medium text-black">Resolved</p>
                      <p className="text-xs text-[#6B7280]">{formatDate(dispute.resolvedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Help */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-[#F5F5F5] rounded-xl p-4"
            >
              <p className="text-sm text-[#6B7280]">
                <strong className="text-black">Need help?</strong> Our support team typically responds within 24 hours. 
                Please provide as much detail as possible to help us resolve your dispute quickly.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
