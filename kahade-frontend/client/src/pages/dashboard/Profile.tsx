/*
 * REKBERKAN PROFILE PAGE - Enhanced Professional Version
 * Brand color: #000000
 * Features: Profile management, KYC status, activity stats, security overview
 */

import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import {
  User, Envelope, Phone, Star, Calendar, CheckCircle,
  Upload, Camera, SealCheck, Warning, Spinner, Shield,
  MapPin, Globe, Clock, Trophy, ChartLineUp, ArrowRight,
  PencilSimple, X, Check, Copy, Eye, EyeSlash, CaretRight,
  IdentificationBadge, Medal, Lightning, Gift, Bank, Pulse
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { userApi } from '@/lib/api';

interface UserStats {
  totalTransactions: number;
  completedTransactions: number;
  disputeCount: number;
  totalVolume?: number;
  successRate?: number;
  avgResponseTime?: string;
  referralCount?: number;
}

const kycStatusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof CheckCircle; description: string }> = {
  NONE: { 
    label: 'Not Verified', 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-50 border-gray-200',
    icon: Warning,
    description: 'Complete identity verification to unlock all features'
  },
  NOT_SUBMITTED: { 
    label: 'Not Verified', 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-50 border-gray-200',
    icon: Warning,
    description: 'Complete identity verification to unlock all features'
  },
  PENDING: { 
    label: 'Under Review', 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-50 border-amber-200',
    icon: Clock,
    description: 'Your documents are being reviewed (1-2 business days)'
  },
  VERIFIED: { 
    label: 'Verified', 
    color: 'text-emerald-600', 
    bgColor: 'bg-emerald-50 border-emerald-200',
    icon: CheckCircle,
    description: 'Your identity has been verified'
  },
  REJECTED: { 
    label: 'Rejected', 
    color: 'text-red-600', 
    bgColor: 'bg-red-50 border-red-200',
    icon: Warning,
    description: 'Verification failed. Please resubmit with valid documents'
  },
};

const membershipTiers = [
  { name: 'Bronze', minTx: 0, maxTx: 5, color: 'text-amber-700', bgColor: 'bg-amber-100' },
  { name: 'Silver', minTx: 5, maxTx: 20, color: 'text-gray-500', bgColor: 'bg-gray-200' },
  { name: 'Gold', minTx: 20, maxTx: 50, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { name: 'Platinum', minTx: 50, maxTx: 100, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { name: 'Diamond', minTx: 100, maxTx: Infinity, color: 'text-purple-600', bgColor: 'bg-purple-100' },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getMembershipTier(txCount: number) {
  return membershipTiers.find(tier => txCount >= tier.minTx && txCount < tier.maxTx) || membershipTiers[0];
}

function getNextTier(txCount: number) {
  const currentIndex = membershipTiers.findIndex(tier => txCount >= tier.minTx && txCount < tier.maxTx);
  return currentIndex < membershipTiers.length - 1 ? membershipTiers[currentIndex + 1] : null;
}

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stats, setStats] = useState<UserStats>({
    totalTransactions: 0,
    completedTransactions: 0,
    disputeCount: 0,
    totalVolume: 0,
    successRate: 100,
    avgResponseTime: '< 1 hour',
    referralCount: 0,
  });
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: '',
    location: '',
    website: '',
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
      }));
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await userApi.getStats();
      setStats(prev => ({ ...prev, ...response.data }));
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const kycStatus = kycStatusConfig[user?.kycStatus || 'NONE'];
  const currentTier = getMembershipTier(stats.completedTransactions);
  const nextTier = getNextTier(stats.completedTransactions);
  const tierProgress = nextTier 
    ? ((stats.completedTransactions - currentTier.minTx) / (nextTier.minTx - currentTier.minTx)) * 100
    : 100;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await userApi.updateProfile({
        username: formData.username,
        phone: formData.phone,
      });
      toast.success('Profile updated successfully');
      setIsEditing(false);
      refreshUser();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File must be an image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Maximum file size is 5MB');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      await userApi.uploadAvatar(formData);
      toast.success('Avatar updated successfully');
      refreshUser();
      setShowAvatarDialog(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <DashboardLayout title="Profile" subtitle="Manage your account and view your activity">
      <div className="max-w-5xl space-y-6">
        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden"
        >
          {/* Cover/Banner */}
          <div className="h-32 bg-gradient-to-r from-black via-gray-800 to-black relative">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '24px 24px'
            }} />
          </div>

          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
              {/* Avatar */}
              <div className="relative">
                <button 
                  onClick={() => setShowAvatarDialog(true)}
                  className="group relative"
                >
                  {user?.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt={user.username}
                      className="w-28 h-28 rounded-2xl object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-2xl bg-black flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-lg">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-8 h-8 text-white" weight="fill" />
                  </div>
                </button>
                {user?.kycStatus === 'VERIFIED' && (
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-white">
                    <CheckCircle className="w-5 h-5 text-white" weight="fill" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 md:pb-2">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <h1 className="text-2xl font-bold text-black">{user?.username || 'User'}</h1>
                  <div className="flex items-center gap-2">
                    <Badge className={`${currentTier.bgColor} ${currentTier.color} border-0`}>
                      <Medal className="w-3 h-3 mr-1" weight="fill" />
                      {currentTier.name}
                    </Badge>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${kycStatus.bgColor} ${kycStatus.color}`}>
                      <kycStatus.icon className="w-3 h-3 inline mr-1" weight="fill" />
                      {kycStatus.label}
                    </div>
                  </div>
                </div>
                <p className="text-[#6B7280] mt-1">{user?.email}</p>
                {formData.bio && (
                  <p className="text-[#6B7280] text-sm mt-2 max-w-xl">{formData.bio}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-[#6B7280]">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400" weight="fill" />
                    <span className="font-medium text-black">{user?.reputationScore?.toFixed(1) || '5.0'}</span>
                    <span>rating</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Pulse className="w-4 h-4" weight="regular" />
                    <span>{stats.completedTransactions} completed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" weight="regular" />
                    <span>Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '-'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 md:pb-2">
                {!isEditing ? (
                  <Button 
                    onClick={() => setIsEditing(true)}
                    className="bg-black text-white hover:bg-black/90"
                  >
                    <PencilSimple className="w-4 h-4 mr-2" weight="bold" />
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(false)} 
                      disabled={isSaving}
                      className="border-[#E5E5E5]"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSave} 
                      disabled={isSaving}
                      className="bg-black text-white hover:bg-black/90"
                    >
                      {isSaving ? (
                        <>
                          <Spinner className="w-4 h-4 mr-2 animate-spin" weight="bold" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" weight="bold" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-[#E5E5E5] p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] flex items-center justify-center">
                <Pulse className="w-5 h-5 text-black" weight="duotone" />
              </div>
            </div>
            <div className="text-2xl font-bold text-black">{stats.totalTransactions}</div>
            <div className="text-sm text-[#6B7280]">Total Transactions</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-xl border border-[#E5E5E5] p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" weight="duotone" />
              </div>
            </div>
            <div className="text-2xl font-bold text-black">{stats.successRate || 100}%</div>
            <div className="text-sm text-[#6B7280]">Success Rate</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-[#E5E5E5] p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-600" weight="fill" />
              </div>
            </div>
            <div className="text-2xl font-bold text-black">{user?.reputationScore?.toFixed(1) || '5.0'}</div>
            <div className="text-sm text-[#6B7280]">Average Rating</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-xl border border-[#E5E5E5] p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" weight="duotone" />
              </div>
            </div>
            <div className="text-2xl font-bold text-black">{stats.avgResponseTime || '< 1h'}</div>
            <div className="text-sm text-[#6B7280]">Avg Response</div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl border border-[#E5E5E5] p-6"
            >
              <h3 className="text-lg font-semibold text-black mb-6">Personal Information</h3>
              
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" weight="regular" />
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        disabled={!isEditing}
                        className="pl-10 border-[#E5E5E5] disabled:bg-[#FAFAFA]"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Envelope className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" weight="regular" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        disabled
                        className="pl-10 border-[#E5E5E5] bg-[#FAFAFA]"
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            onClick={() => copyToClipboard(formData.email)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-black"
                          >
                            <Copy className="w-4 h-4" weight="regular" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Copy email</TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-xs text-[#6B7280]">Email cannot be changed for security reasons</p>
                  </div>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" weight="regular" />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={!isEditing}
                        placeholder="+62 812 3456 7890"
                        className="pl-10 border-[#E5E5E5] disabled:bg-[#FAFAFA]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" weight="regular" />
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Jakarta, Indonesia"
                        className="pl-10 border-[#E5E5E5] disabled:bg-[#FAFAFA]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Tell others about yourself..."
                    className="border-[#E5E5E5] disabled:bg-[#FAFAFA] min-h-[100px]"
                    maxLength={500}
                  />
                  <p className="text-xs text-[#6B7280] text-right">{formData.bio.length}/500</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" weight="regular" />
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      disabled={!isEditing}
                      placeholder="https://yourwebsite.com"
                      className="pl-10 border-[#E5E5E5] disabled:bg-[#FAFAFA]"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Membership Tier */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white rounded-xl border border-[#E5E5E5] p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl ${currentTier.bgColor} flex items-center justify-center`}>
                  <Trophy className={`w-6 h-6 ${currentTier.color}`} weight="fill" />
                </div>
                <div>
                  <div className="font-semibold text-black">{currentTier.name} Member</div>
                  <div className="text-sm text-[#6B7280]">{stats.completedTransactions} transactions</div>
                </div>
              </div>

              {nextTier && (
                <>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-[#6B7280]">Progress to {nextTier.name}</span>
                    <span className="font-medium text-black">{Math.round(tierProgress)}%</span>
                  </div>
                  <Progress value={tierProgress} className="h-2 mb-3" />
                  <p className="text-xs text-[#6B7280]">
                    {nextTier.minTx - stats.completedTransactions} more transactions to reach {nextTier.name}
                  </p>
                </>
              )}
            </motion.div>

            {/* KYC Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`rounded-xl border p-6 ${kycStatus.bgColor}`}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shrink-0">
                  <IdentificationBadge className={`w-6 h-6 ${kycStatus.color}`} weight="duotone" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-black mb-1">Identity Verification</h3>
                  <p className="text-sm text-[#6B7280] mb-3">{kycStatus.description}</p>
                  
                  {user?.kycStatus !== 'VERIFIED' && user?.kycStatus !== 'PENDING' && (
                    <Link href="/kyc">
                      <Button className="bg-black text-white hover:bg-black/90 w-full">
                        <Upload className="w-4 h-4 mr-2" weight="bold" />
                        Start Verification
                      </Button>
                    </Link>
                  )}
                  
                  {user?.kycStatus === 'PENDING' && (
                    <div className="text-sm text-amber-600 flex items-center gap-2">
                      <Spinner className="w-4 h-4 animate-spin" weight="bold" />
                      Review in progress...
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-white rounded-xl border border-[#E5E5E5] divide-y divide-[#E5E5E5]"
            >
              <Link href="/settings">
                <div className="flex items-center gap-3 p-4 hover:bg-[#FAFAFA] transition-colors cursor-pointer group">
                  <div className="w-10 h-10 rounded-lg bg-[#F5F5F5] flex items-center justify-center">
                    <Shield className="w-5 h-5 text-black" weight="duotone" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-black">Security Settings</div>
                    <div className="text-sm text-[#6B7280]">Password, 2FA, sessions</div>
                  </div>
                  <CaretRight className="w-5 h-5 text-[#9CA3AF] group-hover:text-black transition-colors" weight="bold" />
                </div>
              </Link>

              <Link href="/bank-accounts">
                <div className="flex items-center gap-3 p-4 hover:bg-[#FAFAFA] transition-colors cursor-pointer group">
                  <div className="w-10 h-10 rounded-lg bg-[#F5F5F5] flex items-center justify-center">
                    <Bank className="w-5 h-5 text-black" weight="duotone" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-black">Bank Accounts</div>
                    <div className="text-sm text-[#6B7280]">Manage withdrawal accounts</div>
                  </div>
                  <CaretRight className="w-5 h-5 text-[#9CA3AF] group-hover:text-black transition-colors" weight="bold" />
                </div>
              </Link>

              <Link href="/referrals">
                <div className="flex items-center gap-3 p-4 hover:bg-[#FAFAFA] transition-colors cursor-pointer group">
                  <div className="w-10 h-10 rounded-lg bg-[#F5F5F5] flex items-center justify-center">
                    <Gift className="w-5 h-5 text-black" weight="duotone" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-black">Referral Program</div>
                    <div className="text-sm text-[#6B7280]">Invite friends & earn rewards</div>
                  </div>
                  <CaretRight className="w-5 h-5 text-[#9CA3AF] group-hover:text-black transition-colors" weight="bold" />
                </div>
              </Link>

              <Link href="/activity">
                <div className="flex items-center gap-3 p-4 hover:bg-[#FAFAFA] transition-colors cursor-pointer group">
                  <div className="w-10 h-10 rounded-lg bg-[#F5F5F5] flex items-center justify-center">
                    <Pulse className="w-5 h-5 text-black" weight="duotone" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-black">Activity Log</div>
                    <div className="text-sm text-[#6B7280]">View account activity</div>
                  </div>
                  <CaretRight className="w-5 h-5 text-[#9CA3AF] group-hover:text-black transition-colors" weight="bold" />
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Avatar Upload Dialog */}
      <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Profile Photo</DialogTitle>
            <DialogDescription>
              Upload a new profile photo. Maximum file size is 5MB.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <div className="flex flex-col items-center gap-4">
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user.username}
                  className="w-32 h-32 rounded-2xl object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-black flex items-center justify-center text-white text-5xl font-bold">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-black text-white hover:bg-black/90"
              >
                {isUploading ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2 animate-spin" weight="bold" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" weight="bold" />
                    Choose Photo
                  </>
                )}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAvatarDialog(false)} className="border-[#E5E5E5]">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
