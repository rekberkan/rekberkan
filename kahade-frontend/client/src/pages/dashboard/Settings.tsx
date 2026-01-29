/*
 * REKBERKAN SETTINGS PAGE - Enhanced Professional Version
 * Brand color: #000000
 * Features: Security settings, notifications, sessions, privacy, data export
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Bell, ShieldCheck, DeviceMobile, Eye, EyeSlash, Spinner, SignOut,
  Key, Globe, Moon, Sun, Trash, DownloadSimple, Warning, Check, X,
  Envelope, ChatCircle, Megaphone, Receipt, Info, CaretRight, Copy,
  QrCode, Desktop, DeviceTablet, Laptop, Clock, MapPin, Shield,
  WarningCircle, CheckCircle, ArrowRight
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { userApi, authApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Session {
  id: string;
  userAgent: string;
  ipAddress: string;
  location?: string;
  lastActiveAt: string;
  isCurrent: boolean;
  device?: string;
}

// Password strength checker
const checkPasswordStrength = (password: string): { score: number; feedback: string[]; passed: string[] } => {
  const feedback: string[] = [];
  const passed: string[] = [];
  let score = 0;

  if (password.length >= 8) { score += 1; passed.push('8+ characters'); } else { feedback.push('8+ characters'); }
  if (/[A-Z]/.test(password)) { score += 1; passed.push('Uppercase'); } else { feedback.push('Uppercase'); }
  if (/[a-z]/.test(password)) { score += 1; passed.push('Lowercase'); } else { feedback.push('Lowercase'); }
  if (/[0-9]/.test(password)) { score += 1; passed.push('Number'); } else { feedback.push('Number'); }
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) { score += 1; passed.push('Special char'); } else { feedback.push('Special char'); }

  return { score, feedback, passed };
};

export default function Settings() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('security');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    transaction: true,
    marketing: false,
  });
  
  const [twoFactor, setTwoFactor] = useState(false);
  const [securityScore, setSecurityScore] = useState(0);

  const passwordStrength = checkPasswordStrength(passwordForm.newPassword);

  useEffect(() => {
    fetchSessions();
    if (user?.mfaEnabled) {
      setTwoFactor(true);
    }
    calculateSecurityScore();
  }, [user]);

  const calculateSecurityScore = () => {
    let score = 40; // Base score for having an account
    if (user?.mfaEnabled) score += 30;
    if (user?.kycStatus === 'VERIFIED') score += 20;
    if (user?.phone) score += 10;
    setSecurityScore(Math.min(score, 100));
  };

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const response = await authApi.getSessions();
      const sessionsData = Array.isArray(response.data) 
        ? response.data 
        : (response.data.sessions || response.data.data || []);
      setSessions(sessionsData);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setSessions([{
        id: 'current',
        userAgent: navigator.userAgent,
        ipAddress: 'Current Device',
        lastActiveAt: new Date().toISOString(),
        isCurrent: true
      }]);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (passwordStrength.score < 5) {
      toast.error('Password does not meet requirements');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      await userApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      const response = await authApi.enable2FA();
      if (response.data.qrCode) {
        setQrCode(response.data.qrCode);
        setShow2FADialog(true);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to enable 2FA');
    }
  };

  const handleVerify2FA = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setIsEnabling2FA(true);
    try {
      await authApi.verify2FA(verificationCode);
      setTwoFactor(true);
      setShow2FADialog(false);
      setVerificationCode('');
      toast.success('Two-factor authentication enabled!');
      calculateSecurityScore();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid verification code');
    } finally {
      setIsEnabling2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    const password = prompt('Enter your password to disable 2FA:');
    const code = prompt('Enter 2FA code from authenticator:');
    
    if (!password || !code) {
      toast.error('Password and 2FA code are required');
      return;
    }
    
    try {
      await authApi.disable2FA({ password, code });
      setTwoFactor(false);
      toast.success('Two-factor authentication disabled');
      calculateSecurityScore();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to disable 2FA');
    }
  };

  const handleSaveNotifications = async () => {
    setIsSavingNotifications(true);
    try {
      await userApi.updateNotificationSettings(notifications);
      toast.success('Notification preferences saved');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await authApi.revokeSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
      toast.success('Session revoked successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to revoke session');
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      await authApi.revokeAllSessions();
      toast.success('All other sessions revoked');
      fetchSessions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to revoke sessions');
    }
  };

  const handleExportData = async () => {
    try {
      toast.info('Preparing your data export...', {
        description: 'You will receive an email with the download link.'
      });
      await userApi.requestDataExport();
      toast.success('Data export requested', {
        description: 'Check your email for the download link within 24 hours.'
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to request data export');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    try {
      await userApi.deleteAccount(deleteConfirmText);
      toast.success('Account deleted');
      logout();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return DeviceMobile;
    }
    if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      return DeviceTablet;
    }
    return Laptop;
  };

  const parseUserAgent = (ua: string) => {
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Browser';
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 5) return 'Active now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / 1440)}d ago`;
  };

  const getSecurityScoreColor = () => {
    if (securityScore >= 80) return 'text-emerald-600';
    if (securityScore >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getSecurityScoreLabel = () => {
    if (securityScore >= 80) return 'Excellent';
    if (securityScore >= 60) return 'Good';
    if (securityScore >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <DashboardLayout title="Settings" subtitle="Manage your account preferences and security">
      <div className="max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#F5F5F5] p-1 rounded-xl mb-6 w-full grid grid-cols-4">
            <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-white">
              <Shield className="w-4 h-4 mr-2" weight="duotone" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-white">
              <Bell className="w-4 h-4 mr-2" weight="duotone" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="sessions" className="rounded-lg data-[state=active]:bg-white">
              <DeviceMobile className="w-4 h-4 mr-2" weight="duotone" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="privacy" className="rounded-lg data-[state=active]:bg-white">
              <Lock className="w-4 h-4 mr-2" weight="duotone" />
              Privacy
            </TabsTrigger>
          </TabsList>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            {/* Security Score */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-[#E5E5E5] p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-black">Security Score</h3>
                  <p className="text-sm text-[#6B7280]">Your account security level</p>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${getSecurityScoreColor()}`}>{securityScore}%</div>
                  <div className={`text-sm ${getSecurityScoreColor()}`}>{getSecurityScoreLabel()}</div>
                </div>
              </div>
              <Progress value={securityScore} className="h-2 mb-4" />
              
              <div className="grid sm:grid-cols-3 gap-3">
                <div className={`p-3 rounded-lg flex items-center gap-3 ${twoFactor ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${twoFactor ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                    {twoFactor ? <Check className="w-4 h-4 text-emerald-600" weight="bold" /> : <Warning className="w-4 h-4 text-amber-600" weight="fill" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-black">2FA</div>
                    <div className={`text-xs ${twoFactor ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {twoFactor ? 'Enabled' : 'Not enabled'}
                    </div>
                  </div>
                </div>
                
                <div className={`p-3 rounded-lg flex items-center gap-3 ${user?.kycStatus === 'VERIFIED' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user?.kycStatus === 'VERIFIED' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                    {user?.kycStatus === 'VERIFIED' ? <Check className="w-4 h-4 text-emerald-600" weight="bold" /> : <Warning className="w-4 h-4 text-amber-600" weight="fill" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-black">KYC</div>
                    <div className={`text-xs ${user?.kycStatus === 'VERIFIED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {user?.kycStatus === 'VERIFIED' ? 'Verified' : 'Not verified'}
                    </div>
                  </div>
                </div>
                
                <div className={`p-3 rounded-lg flex items-center gap-3 ${user?.phone ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user?.phone ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                    {user?.phone ? <Check className="w-4 h-4 text-emerald-600" weight="bold" /> : <Info className="w-4 h-4 text-gray-400" weight="fill" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-black">Phone</div>
                    <div className={`text-xs ${user?.phone ? 'text-emerald-600' : 'text-gray-500'}`}>
                      {user?.phone ? 'Added' : 'Optional'}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Two-Factor Authentication */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl border border-[#E5E5E5] p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-emerald-600" weight="duotone" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-black">Two-Factor Authentication</h3>
                    <p className="text-sm text-[#6B7280]">
                      Add an extra layer of security with authenticator app
                    </p>
                  </div>
                </div>
                {twoFactor ? (
                  <Button variant="outline" onClick={handleDisable2FA} className="border-red-200 text-red-600 hover:bg-red-50">
                    Disable
                  </Button>
                ) : (
                  <Button onClick={handleEnable2FA} className="bg-black text-white hover:bg-black/90">
                    Enable
                  </Button>
                )}
              </div>
              
              {twoFactor && (
                <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle className="w-5 h-5" weight="fill" />
                    <span className="font-medium">Two-factor authentication is active</span>
                  </div>
                  <p className="text-sm text-emerald-700 mt-1">
                    Your account is protected with an authenticator app.
                  </p>
                </div>
              )}
            </motion.div>

            {/* Change Password */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl border border-[#E5E5E5] p-6"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#F5F5F5] flex items-center justify-center">
                  <Key className="w-6 h-6 text-black" weight="duotone" />
                </div>
                <div>
                  <h3 className="font-semibold text-black">Change Password</h3>
                  <p className="text-sm text-[#6B7280]">Update your account password regularly</p>
                </div>
              </div>
              
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-black">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="pr-10 border-[#E5E5E5]"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-black"
                    >
                      {showCurrentPassword ? <EyeSlash className="w-5 h-5" weight="regular" /> : <Eye className="w-5 h-5" weight="regular" />}
                    </button>
                  </div>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-black">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="pr-10 border-[#E5E5E5]"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-black"
                      >
                        {showNewPassword ? <EyeSlash className="w-5 h-5" weight="regular" /> : <Eye className="w-5 h-5" weight="regular" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-black">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="border-[#E5E5E5]"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                {/* Password strength */}
                {passwordForm.newPassword && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            level <= passwordStrength.score 
                              ? passwordStrength.score <= 2 ? 'bg-red-500' 
                                : passwordStrength.score <= 3 ? 'bg-amber-500' 
                                : passwordStrength.score <= 4 ? 'bg-blue-500' 
                                : 'bg-emerald-500'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['8+ characters', 'Uppercase', 'Lowercase', 'Number', 'Special char'].map((req) => {
                        const isPassed = passwordStrength.passed.includes(req);
                        return (
                          <span key={req} className={`text-xs px-2 py-1 rounded-full ${isPassed ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                            {isPassed ? <Check className="w-3 h-3 inline mr-1" weight="bold" /> : <X className="w-3 h-3 inline mr-1" weight="bold" />}
                            {req}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="bg-black text-white hover:bg-black/90" 
                  disabled={isChangingPassword || passwordStrength.score < 5}
                >
                  {isChangingPassword ? (
                    <>
                      <Spinner className="w-4 h-4 mr-2 animate-spin" weight="bold" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </form>
            </motion.div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-[#E5E5E5] p-6"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Envelope className="w-6 h-6 text-blue-600" weight="duotone" />
                </div>
                <div>
                  <h3 className="font-semibold text-black">Email Notifications</h3>
                  <p className="text-sm text-[#6B7280]">Choose what emails you receive</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#FAFAFA]">
                  <div className="flex items-center gap-3">
                    <Receipt className="w-5 h-5 text-[#6B7280]" weight="duotone" />
                    <div>
                      <div className="font-medium text-black">Transaction Updates</div>
                      <div className="text-sm text-[#6B7280]">Payment confirmations and status changes</div>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#FAFAFA]">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-[#6B7280]" weight="duotone" />
                    <div>
                      <div className="font-medium text-black">Security Alerts</div>
                      <div className="text-sm text-[#6B7280]">Login attempts and security changes</div>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.transaction}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, transaction: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#FAFAFA]">
                  <div className="flex items-center gap-3">
                    <Megaphone className="w-5 h-5 text-[#6B7280]" weight="duotone" />
                    <div>
                      <div className="font-medium text-black">Marketing & Promotions</div>
                      <div className="text-sm text-[#6B7280]">Special offers and product updates</div>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.marketing}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, marketing: checked })}
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl border border-[#E5E5E5] p-6"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-purple-600" weight="duotone" />
                </div>
                <div>
                  <h3 className="font-semibold text-black">Push Notifications</h3>
                  <p className="text-sm text-[#6B7280]">Real-time alerts on your device</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#FAFAFA]">
                  <div className="flex items-center gap-3">
                    <Receipt className="w-5 h-5 text-[#6B7280]" weight="duotone" />
                    <div>
                      <div className="font-medium text-black">Transaction Alerts</div>
                      <div className="text-sm text-[#6B7280]">Instant updates on your transactions</div>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#FAFAFA]">
                  <div className="flex items-center gap-3">
                    <ChatCircle className="w-5 h-5 text-[#6B7280]" weight="duotone" />
                    <div>
                      <div className="font-medium text-black">Messages</div>
                      <div className="text-sm text-[#6B7280]">New messages from other users</div>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#FAFAFA]">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-[#6B7280]" weight="duotone" />
                    <div>
                      <div className="font-medium text-black">Reminders</div>
                      <div className="text-sm text-[#6B7280]">Pending actions and deadlines</div>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                  />
                </div>
              </div>
            </motion.div>

            <Button 
              onClick={handleSaveNotifications}
              disabled={isSavingNotifications}
              className="bg-black text-white hover:bg-black/90"
            >
              {isSavingNotifications ? (
                <>
                  <Spinner className="w-4 h-4 mr-2 animate-spin" weight="bold" />
                  Saving...
                </>
              ) : (
                'Save Preferences'
              )}
            </Button>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-[#E5E5E5] p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#F5F5F5] flex items-center justify-center">
                    <DeviceMobile className="w-6 h-6 text-black" weight="duotone" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-black">Active Sessions</h3>
                    <p className="text-sm text-[#6B7280]">Manage devices logged into your account</p>
                  </div>
                </div>
                {sessions.length > 1 && (
                  <Button variant="outline" onClick={handleRevokeAllSessions} className="border-red-200 text-red-600 hover:bg-red-50">
                    <SignOut className="w-4 h-4 mr-2" weight="bold" />
                    Log out all others
                  </Button>
                )}
              </div>
              
              {isLoadingSessions ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner className="w-8 h-8 animate-spin text-black" weight="bold" />
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => {
                    const DeviceIcon = getDeviceIcon(session.userAgent);
                    return (
                      <div key={session.id} className="flex items-center justify-between p-4 rounded-xl bg-[#FAFAFA]">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                            <DeviceIcon className="w-5 h-5 text-[#6B7280]" weight="duotone" />
                          </div>
                          <div>
                            <div className="font-medium text-black flex items-center gap-2">
                              {parseUserAgent(session.userAgent)}
                              {session.isCurrent && (
                                <Badge className="bg-emerald-50 text-emerald-600 border-0 text-xs">
                                  Current
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-[#6B7280] flex items-center gap-2">
                              <MapPin className="w-3 h-3" weight="fill" />
                              {session.location || session.ipAddress}
                              <span>•</span>
                              <Clock className="w-3 h-3" weight="fill" />
                              {formatLastActive(session.lastActiveAt)}
                            </div>
                          </div>
                        </div>
                        {!session.isCurrent && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:bg-red-50"
                            onClick={() => handleRevokeSession(session.id)}
                          >
                            <SignOut className="w-4 h-4" weight="bold" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-[#E5E5E5] p-6"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <DownloadSimple className="w-6 h-6 text-blue-600" weight="duotone" />
                </div>
                <div>
                  <h3 className="font-semibold text-black">Export Your Data</h3>
                  <p className="text-sm text-[#6B7280]">Download a copy of all your data</p>
                </div>
              </div>
              
              <p className="text-[#6B7280] mb-4">
                Request a copy of your personal data including transactions, profile information, and activity logs. 
                The export will be sent to your email within 24 hours.
              </p>
              
              <Button variant="outline" onClick={handleExportData} className="border-[#E5E5E5]">
                <DownloadSimple className="w-4 h-4 mr-2" weight="bold" />
                Request Data Export
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl border border-red-200 p-6"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                  <Trash className="w-6 h-6 text-red-600" weight="duotone" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-600">Delete Account</h3>
                  <p className="text-sm text-[#6B7280]">Permanently delete your account and all data</p>
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 mb-4">
                <div className="flex items-start gap-3">
                  <WarningCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" weight="fill" />
                  <div>
                    <p className="text-sm text-red-800 font-medium">This action cannot be undone</p>
                    <p className="text-sm text-red-700 mt-1">
                      All your data including transactions, wallet balance, and account information will be permanently deleted.
                    </p>
                  </div>
                </div>
              </div>
              
              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                    <Trash className="w-4 h-4 mr-2" weight="bold" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4">
                    <Label htmlFor="deleteConfirm" className="text-sm">
                      Type <span className="font-bold">DELETE</span> to confirm
                    </Label>
                    <Input
                      id="deleteConfirm"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="mt-2 border-[#E5E5E5]"
                      placeholder="DELETE"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-[#E5E5E5]">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== 'DELETE'}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* 2FA Setup Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" weight="duotone" />
              Set Up Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-6">
            {qrCode && (
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-xl border border-[#E5E5E5]">
                  <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="verificationCode">Enter verification code</Label>
              <Input
                id="verificationCode"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="text-center text-2xl tracking-[0.5em] font-mono border-[#E5E5E5]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShow2FADialog(false)} className="border-[#E5E5E5]">
              Cancel
            </Button>
            <Button 
              onClick={handleVerify2FA} 
              disabled={isEnabling2FA || verificationCode.length !== 6}
              className="bg-black text-white hover:bg-black/90"
            >
              {isEnabling2FA ? (
                <>
                  <Spinner className="w-4 h-4 mr-2 animate-spin" weight="bold" />
                  Verifying...
                </>
              ) : (
                'Verify & Enable'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
