/*
 * KAHADE ADMIN KYC PAGE
 * Review and manage KYC submissions
 * Icons: Phosphor Icons only
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  IdentificationCard, CheckCircle, XCircle, Clock, Spinner,
  Eye, User, Calendar, MagnifyingGlass, Funnel
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/api';

interface KYCSubmission {
  id: string;
  userId: string;
  user: {
    username: string;
    email: string;
  };
  idType: string;
  idNumber: string;
  fullName: string;
  dateOfBirth: string;
  address: string;
  idFrontUrl: string;
  idBackUrl?: string;
  selfieUrl: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'Pending Review', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  VERIFIED: { label: 'Verified', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  REJECTED: { label: 'Rejected', color: 'text-red-600', bgColor: 'bg-red-50' },
};

export default function AdminKYC() {
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [selectedKYC, setSelectedKYC] = useState<KYCSubmission | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const params: any = { limit: 50 };
      if (filter !== 'all') params.status = filter;
      
      const response = await adminApi.getKYCSubmissions(params);
      setSubmissions(response.data.submissions || response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch KYC submissions:', error);
      toast.error('Failed to load KYC submissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedKYC) return;
    
    setIsSubmitting(true);
    try {
      await adminApi.approveKYC(selectedKYC.userId);
      toast.success('KYC approved successfully');
      setIsReviewOpen(false);
      setSelectedKYC(null);
      fetchSubmissions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve KYC');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedKYC || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await adminApi.rejectKYC(selectedKYC.userId, rejectionReason);
      toast.success('KYC rejected');
      setIsRejectOpen(false);
      setIsReviewOpen(false);
      setSelectedKYC(null);
      setRejectionReason('');
      fetchSubmissions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject KYC');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSubmissions = submissions.filter(s => 
    s.user.username.toLowerCase().includes(search.toLowerCase()) ||
    s.user.email.toLowerCase().includes(search.toLowerCase()) ||
    s.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    pending: submissions.filter(s => s.status === 'PENDING').length,
    verified: submissions.filter(s => s.status === 'VERIFIED').length,
    rejected: submissions.filter(s => s.status === 'REJECTED').length,
  };

  if (isLoading) {
    return (
      <AdminLayout title="KYC Management" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Spinner className="w-8 h-8 animate-spin text-black" weight="bold" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="KYC Management" subtitle="Review and manage identity verification submissions">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-amber-600" weight="duotone" />
              <div>
                <div className="text-2xl font-bold text-amber-700">{stats.pending}</div>
                <div className="text-sm text-amber-600">Pending Review</div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-emerald-50 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-emerald-600" weight="duotone" />
              <div>
                <div className="text-2xl font-bold text-emerald-700">{stats.verified}</div>
                <div className="text-sm text-emerald-600">Verified</div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-red-50 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-600" weight="duotone" />
              <div>
                <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
                <div className="text-sm text-red-600">Rejected</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" weight="regular" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-10"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <Funnel className="w-4 h-4 mr-2" weight="regular" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Submissions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden"
        >
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <IdentificationCard className="w-16 h-16 mx-auto mb-4 text-[#9CA3AF]" weight="duotone" />
              <h4 className="text-lg font-semibold text-black mb-2">No Submissions</h4>
              <p className="text-[#6B7280]">No KYC submissions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F5F5F5]">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-black">User</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-black">ID Type</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-black">Full Name</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-black">Submitted</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-black">Status</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-black">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5]">
                  {filteredSubmissions.map((submission) => {
                    const status = statusConfig[submission.status];
                    return (
                      <tr key={submission.id} className="hover:bg-[#FAFAFA]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center">
                              <User className="w-4 h-4 text-black" weight="regular" />
                            </div>
                            <div>
                              <div className="font-medium text-black">{submission.user.username}</div>
                              <div className="text-sm text-[#6B7280]">{submission.user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#6B7280]">{submission.idType}</td>
                        <td className="px-4 py-3 text-black">{submission.fullName}</td>
                        <td className="px-4 py-3 text-[#6B7280]">
                          {new Date(submission.submittedAt).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${status.bgColor} ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedKYC(submission);
                              setIsReviewOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" weight="regular" />
                            Review
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Review Dialog */}
        <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review KYC Submission</DialogTitle>
              <DialogDescription>
                Review the submitted documents and verify the user's identity
              </DialogDescription>
            </DialogHeader>
            
            {selectedKYC && (
              <div className="space-y-6 py-4">
                {/* User Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[#6B7280]">Username</label>
                    <p className="text-black">{selectedKYC.user.username}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#6B7280]">Email</label>
                    <p className="text-black">{selectedKYC.user.email}</p>
                  </div>
                </div>

                {/* ID Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[#6B7280]">ID Type</label>
                    <p className="text-black">{selectedKYC.idType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#6B7280]">ID Number</label>
                    <p className="text-black font-mono">{selectedKYC.idNumber}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[#6B7280]">Full Name</label>
                    <p className="text-black">{selectedKYC.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#6B7280]">Date of Birth</label>
                    <p className="text-black">{selectedKYC.dateOfBirth}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-[#6B7280]">Address</label>
                  <p className="text-black">{selectedKYC.address}</p>
                </div>

                {/* Documents */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-black">Submitted Documents</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-[#6B7280] mb-2 block">ID Front</label>
                      <img 
                        src={selectedKYC.idFrontUrl} 
                        alt="ID Front" 
                        className="w-full rounded-lg border border-[#E5E5E5]"
                      />
                    </div>
                    {selectedKYC.idBackUrl && (
                      <div>
                        <label className="text-sm font-medium text-[#6B7280] mb-2 block">ID Back</label>
                        <img 
                          src={selectedKYC.idBackUrl} 
                          alt="ID Back" 
                          className="w-full rounded-lg border border-[#E5E5E5]"
                        />
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-[#6B7280] mb-2 block">Selfie with ID</label>
                      <img 
                        src={selectedKYC.selfieUrl} 
                        alt="Selfie" 
                        className="w-full rounded-lg border border-[#E5E5E5]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              {selectedKYC?.status === 'PENDING' && (
                <>
                  <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:border-red-600"
                    onClick={() => setIsRejectOpen(true)}
                  >
                    <XCircle className="w-4 h-4 mr-2" weight="bold" />
                    Reject
                  </Button>
                  <Button
                    className="btn-primary"
                    onClick={handleApprove}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Spinner className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" weight="bold" />
                    )}
                    Approve
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject KYC Submission</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejection. This will be shown to the user.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-red-500 hover:bg-red-600"
                onClick={handleReject}
                disabled={isSubmitting || !rejectionReason.trim()}
              >
                {isSubmitting ? 'Rejecting...' : 'Reject KYC'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
