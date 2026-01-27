/*
 * KAHADE SETTINGS PAGE
 * Icons: Phosphor Icons only
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Lock, Bell, ShieldCheck, DeviceMobile, Eye, EyeSlash, Spinner, SignOut
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { userApi, authApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Session {
  id: string;
  userAgent: string;
  ipAddress: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

export default function Settings() {
  const { user } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    transaction: true,
    marketing: false
  });
  
  const [twoFactor, setTwoFactor] = useState(false);

  useEffect(() => {
    fetchSessions();
    if (user?.mfaEnabled) {
      setTwoFactor(true);
    }
  }, [user]);

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
    
    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
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

  const handleToggle2FA = async () => {
    if (!twoFactor) {
      try {
        const response = await authApi.enable2FA();
        if (response.data.qrCode) {
          toast.info('Scan QR code with your authenticator app');
          setTwoFactor(true);
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to enable 2FA');
      }
    } else {
      const password = prompt('Enter your password:');
      const code = prompt('Enter 2FA code from authenticator:');
      
      if (!password || !code) {
        toast.error('Password and 2FA code are required');
        return;
      }
      
      try {
        await authApi.disable2FA({ password, code });
        setTwoFactor(false);
        toast.success('2FA disabled');
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to disable 2FA');
      }
    }
  };

  const handleSaveNotifications = async () => {
    setIsSavingNotifications(true);
    try {
      await userApi.updateNotificationSettings(notifications);
      toast.success('Notification settings saved');
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
    if (minutes < 60) return `${minutes} minutes ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} hours ago`;
    return `${Math.floor(minutes / 1440)} days ago`;
  };

  return (
    <DashboardLayout title="Settings" subtitle="Manage your account preferences">
      <div className="max-w-3xl space-y-6">
        {/* Change Password */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-accent" weight="duotone" />
            </div>
            <div>
              <h3 className="font-semibold">Change Password</h3>
              <p className="text-sm text-muted-foreground">Update your account password</p>
            </div>
          </div>
          
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="pr-10 bg-white border-border"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showCurrentPassword ? <EyeSlash className="w-5 h-5" weight="regular" /> : <Eye className="w-5 h-5" weight="regular" />}
                </button>
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="pr-10 bg-white border-border"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showNewPassword ? <EyeSlash className="w-5 h-5" weight="regular" /> : <Eye className="w-5 h-5" weight="regular" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="bg-white border-border"
                />
              </div>
            </div>
            
            <Button type="submit" className="btn-accent" disabled={isChangingPassword}>
              {isChangingPassword ? (
                <>
                  <Spinner className="w-4 h-4 mr-2 animate-spin" weight="bold" />
                  Saving...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </form>
        </motion.div>
        
        {/* Two-Factor Authentication */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-500" weight="duotone" />
              </div>
              <div>
                <h3 className="font-semibold">Two-Factor Authentication (2FA)</h3>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security with 2FA
                </p>
              </div>
            </div>
            <Switch checked={twoFactor} onCheckedChange={handleToggle2FA} />
          </div>
          
          {twoFactor && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 text-emerald-500 mb-2">
                <ShieldCheck className="w-4 h-4" weight="fill" />
                <span className="font-medium">2FA Active</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your account is protected with two-factor authentication.
              </p>
            </div>
          )}
        </motion.div>
        
        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-500" weight="duotone" />
            </div>
            <div>
              <h3 className="font-semibold">Notifications</h3>
              <p className="text-sm text-muted-foreground">Manage notification preferences</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-muted-foreground">Receive updates via email</div>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
              <div>
                <div className="font-medium">Push Notifications</div>
                <div className="text-sm text-muted-foreground">Browser notifications</div>
              </div>
              <Switch
                checked={notifications.push}
                onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
              <div>
                <div className="font-medium">Transaction Updates</div>
                <div className="text-sm text-muted-foreground">Transaction status notifications</div>
              </div>
              <Switch
                checked={notifications.transaction}
                onCheckedChange={(checked) => setNotifications({ ...notifications, transaction: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
              <div>
                <div className="font-medium">Marketing Emails</div>
                <div className="text-sm text-muted-foreground">Promos and special offers</div>
              </div>
              <Switch
                checked={notifications.marketing}
                onCheckedChange={(checked) => setNotifications({ ...notifications, marketing: checked })}
              />
            </div>
          </div>
          
          <Button 
            className="mt-4 btn-accent" 
            onClick={handleSaveNotifications}
            disabled={isSavingNotifications}
          >
            {isSavingNotifications ? (
              <>
                <Spinner className="w-4 h-4 mr-2 animate-spin" weight="bold" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </motion.div>
        
        {/* Connected Devices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <DeviceMobile className="w-5 h-5 text-purple-500" weight="duotone" />
              </div>
              <div>
                <h3 className="font-semibold">Connected Devices</h3>
                <p className="text-sm text-muted-foreground">Manage active login sessions</p>
              </div>
            </div>
            {sessions.length > 1 && (
              <Button variant="outline" size="sm" onClick={handleRevokeAllSessions}>
                <SignOut className="w-4 h-4 mr-2" weight="bold" />
                Logout All
              </Button>
            )}
          </div>
          
          {isLoadingSessions ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="w-6 h-6 animate-spin text-accent" weight="bold" />
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <DeviceMobile className="w-5 h-5 text-muted-foreground" weight="regular" />
                    <div>
                      <div className="font-medium">{parseUserAgent(session.userAgent)}</div>
                      <div className="text-sm text-muted-foreground">
                        {session.ipAddress} • {formatLastActive(session.lastActiveAt)}
                      </div>
                    </div>
                  </div>
                  {session.isCurrent ? (
                    <span className="text-xs text-emerald-500 px-2 py-1 bg-emerald-500/10 rounded-full">
                      This device
                    </span>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500 hover:bg-red-500/10"
                      onClick={() => handleRevokeSession(session.id)}
                    >
                      <SignOut className="w-4 h-4" weight="bold" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
        
        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 border-red-500/20"
        >
          <h3 className="font-semibold text-red-500 mb-4">Danger Zone</h3>
          <p className="text-sm text-muted-foreground mb-4">
            This action cannot be undone. Please be careful.
          </p>
          <Button 
            variant="outline" 
            className="border-red-500/20 text-red-500 hover:bg-red-500/10"
            onClick={() => toast.info('Please contact support to delete your account')}
          >
            Delete Account
          </Button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
