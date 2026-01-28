/*
 * KAHADE REFERRALS PAGE
 * View referral code, stats, and rewards
 * Icons: Phosphor Icons only
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Gift, Copy, CheckCircle, Spinner, Share,
  Trophy, CurrencyDollar, UserPlus, ArrowRight
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { referralApi } from '@/lib/api';

interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
}

interface Referral {
  id: string;
  referredUser: {
    username: string;
    createdAt: string;
  };
  status: 'PENDING' | 'COMPLETED' | 'EXPIRED';
  rewardAmount: number;
  createdAt: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export default function Referrals() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const [statsRes, referralsRes] = await Promise.all([
        referralApi.getStats(),
        referralApi.getList({ limit: 20 }),
      ]);
      setStats(statsRes.data);
      setReferrals(referralsRes.data.referrals || []);
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
      toast.error('Failed to load referral data');
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (stats?.referralCode) {
      navigator.clipboard.writeText(stats.referralCode);
      setCopied(true);
      toast.success('Referral code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyReferralLink = () => {
    if (stats?.referralCode) {
      const link = `${window.location.origin}/register?ref=${stats.referralCode}`;
      navigator.clipboard.writeText(link);
      toast.success('Referral link copied!');
    }
  };

  const shareReferral = async () => {
    if (stats?.referralCode && navigator.share) {
      try {
        await navigator.share({
          title: 'Join Kahade',
          text: `Use my referral code ${stats.referralCode} to get a bonus when you sign up!`,
          url: `${window.location.origin}/register?ref=${stats.referralCode}`,
        });
      } catch (error) {
        copyReferralLink();
      }
    } else {
      copyReferralLink();
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Referrals" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Spinner className="w-8 h-8 animate-spin text-black" weight="bold" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Referrals" subtitle="Invite friends and earn rewards">
      <div className="space-y-6">
        {/* Referral Code Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black rounded-2xl p-6 text-white"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Your Referral Code</h2>
              <p className="text-white/70 text-sm">Share this code with friends to earn rewards</p>
            </div>
            <Gift className="w-10 h-10 text-white/50" weight="duotone" />
          </div>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 bg-white/10 rounded-xl px-4 py-3">
              <span className="text-2xl font-mono font-bold tracking-wider">
                {stats?.referralCode || 'XXXXXX'}
              </span>
            </div>
            <Button
              variant="outline"
              className="bg-white text-black hover:bg-white/90 border-0"
              onClick={copyReferralCode}
            >
              {copied ? (
                <CheckCircle className="w-5 h-5" weight="fill" />
              ) : (
                <Copy className="w-5 h-5" weight="bold" />
              )}
            </Button>
            <Button
              variant="outline"
              className="bg-white text-black hover:bg-white/90 border-0"
              onClick={shareReferral}
            >
              <Share className="w-5 h-5" weight="bold" />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <UserPlus className="w-6 h-6 mx-auto mb-2 text-white/70" weight="duotone" />
              <div className="text-2xl font-bold">{stats?.totalReferrals || 0}</div>
              <div className="text-xs text-white/70">Total Referrals</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <CheckCircle className="w-6 h-6 mx-auto mb-2 text-emerald-400" weight="duotone" />
              <div className="text-2xl font-bold">{stats?.successfulReferrals || 0}</div>
              <div className="text-xs text-white/70">Successful</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <CurrencyDollar className="w-6 h-6 mx-auto mb-2 text-amber-400" weight="duotone" />
              <div className="text-2xl font-bold">{formatCurrency(stats?.totalEarnings || 0)}</div>
              <div className="text-xs text-white/70">Total Earned</div>
            </div>
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-[#E5E5E5] p-6"
        >
          <h3 className="text-lg font-semibold text-black mb-4">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold text-black mb-1">Share Your Code</h4>
                <p className="text-sm text-[#6B7280]">Share your unique referral code with friends</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold text-black mb-1">Friend Signs Up</h4>
                <p className="text-sm text-[#6B7280]">They register using your referral code</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold text-black mb-1">Both Get Rewarded</h4>
                <p className="text-sm text-[#6B7280]">You both receive bonus after first transaction</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Rewards Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#F5F5F5] rounded-xl p-6"
        >
          <div className="flex items-center gap-4">
            <Trophy className="w-12 h-12 text-amber-500" weight="duotone" />
            <div>
              <h3 className="font-semibold text-black">Earn Rp 25.000 per referral!</h3>
              <p className="text-sm text-[#6B7280]">
                Your friend also gets Rp 25.000 bonus. Rewards are credited after their first successful transaction.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Referral History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-[#E5E5E5] p-6"
        >
          <h3 className="text-lg font-semibold text-black mb-4">Referral History</h3>
          
          {referrals.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-[#9CA3AF]" weight="duotone" />
              <h4 className="text-lg font-semibold text-black mb-2">No Referrals Yet</h4>
              <p className="text-[#6B7280] mb-4">Start sharing your code to earn rewards!</p>
              <Button className="btn-primary" onClick={shareReferral}>
                <Share className="w-4 h-4 mr-2" weight="bold" />
                Share Now
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-[#FAFAFA] hover:bg-[#F5F5F5] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center">
                      <Users className="w-5 h-5 text-black" weight="duotone" />
                    </div>
                    <div>
                      <div className="font-medium text-black">{referral.referredUser.username}</div>
                      <div className="text-sm text-[#6B7280]">
                        Joined {new Date(referral.createdAt).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                      referral.status === 'COMPLETED' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : referral.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {referral.status === 'COMPLETED' && <CheckCircle className="w-3 h-3" weight="fill" />}
                      {referral.status}
                    </div>
                    {referral.status === 'COMPLETED' && (
                      <div className="text-sm font-semibold text-emerald-600 mt-1">
                        +{formatCurrency(referral.rewardAmount)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
