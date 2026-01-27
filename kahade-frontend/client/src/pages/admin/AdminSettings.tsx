/*
 * KAHADE ADMIN SETTINGS PAGE
 * Icons: Phosphor Icons only
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Gear, Percent, Clock, Shield, Bell, Database,
  FloppyDisk, ArrowsClockwise, Spinner
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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

interface PlatformSettings {
  platformFee: string;
  minTransaction: string;
  maxTransaction: string;
  escrowDuration: string;
  disputeWindow: string;
  autoReleaseDays: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  kycRequired: boolean;
  emailNotifications: boolean;
  slackNotifications: boolean;
}

const defaultSettings: PlatformSettings = {
  platformFee: '1',
  minTransaction: '100',
  maxTransaction: '100000',
  escrowDuration: '7',
  disputeWindow: '3',
  autoReleaseDays: '14',
  maintenanceMode: false,
  registrationEnabled: true,
  kycRequired: false,
  emailNotifications: true,
  slackNotifications: false,
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getSettings();
      if (response.data) {
        setSettings({
          ...defaultSettings,
          ...response.data,
          platformFee: String(response.data.platformFee || defaultSettings.platformFee),
          minTransaction: String(response.data.minTransaction || defaultSettings.minTransaction),
          maxTransaction: String(response.data.maxTransaction || defaultSettings.maxTransaction),
          escrowDuration: String(response.data.escrowDuration || defaultSettings.escrowDuration),
          disputeWindow: String(response.data.disputeWindow || defaultSettings.disputeWindow),
          autoReleaseDays: String(response.data.autoReleaseDays || defaultSettings.autoReleaseDays),
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      // Use default settings if API fails
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await adminApi.updateSettings({
        platformFee: parseFloat(settings.platformFee),
        minTransaction: parseInt(settings.minTransaction),
        maxTransaction: parseInt(settings.maxTransaction),
        escrowDuration: parseInt(settings.escrowDuration),
        disputeWindow: parseInt(settings.disputeWindow),
        autoReleaseDays: parseInt(settings.autoReleaseDays),
        maintenanceMode: settings.maintenanceMode,
        registrationEnabled: settings.registrationEnabled,
        kycRequired: settings.kycRequired,
        emailNotifications: settings.emailNotifications,
        slackNotifications: settings.slackNotifications,
      });
      toast.success('Settings saved successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    toast.info('Settings reset to default');
  };

  if (isLoading) {
    return (
      <AdminLayout title="Platform Settings" subtitle="Kahade system configuration">
        <div className="flex items-center justify-center h-64">
          <Spinner className="w-8 h-8 animate-spin text-accent" weight="bold" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Platform Settings" subtitle="Kahade system configuration">
      <div className="max-w-4xl space-y-6">
        {/* Transaction Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Percent className="w-5 h-5 text-accent" weight="fill" />
            </div>
            <div>
              <h3 className="font-semibold">Transaction Settings</h3>
              <p className="text-sm text-muted-foreground">Configure fees and transaction limits</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="platformFee">Platform Fee (%)</Label>
              <Input
                id="platformFee"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={settings.platformFee}
                onChange={(e) => setSettings({ ...settings, platformFee: e.target.value })}
                className="bg-white border-border"
              />
              <p className="text-xs text-muted-foreground">Fee percentage per transaction</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="minTransaction">Minimum Transaction (USD)</Label>
              <Input
                id="minTransaction"
                type="number"
                min="0"
                value={settings.minTransaction}
                onChange={(e) => setSettings({ ...settings, minTransaction: e.target.value })}
                className="bg-white border-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxTransaction">Maximum Transaction (USD)</Label>
              <Input
                id="maxTransaction"
                type="number"
                min="0"
                value={settings.maxTransaction}
                onChange={(e) => setSettings({ ...settings, maxTransaction: e.target.value })}
                className="bg-white border-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="escrowDuration">Default Escrow Duration (Days)</Label>
              <Select 
                value={settings.escrowDuration} 
                onValueChange={(value) => setSettings({ ...settings, escrowDuration: value })}
              >
                <SelectTrigger className="bg-white border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Days</SelectItem>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="14">14 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>
        
        {/* Dispute Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" weight="fill" />
            </div>
            <div>
              <h3 className="font-semibold">Dispute Settings</h3>
              <p className="text-sm text-muted-foreground">Configure dispute timing and process</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="disputeWindow">Dispute Window (Days)</Label>
              <Input
                id="disputeWindow"
                type="number"
                min="1"
                max="30"
                value={settings.disputeWindow}
                onChange={(e) => setSettings({ ...settings, disputeWindow: e.target.value })}
                className="bg-white border-border"
              />
              <p className="text-xs text-muted-foreground">Time to file dispute after delivery</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="autoReleaseDays">Auto-Release (Days)</Label>
              <Input
                id="autoReleaseDays"
                type="number"
                min="1"
                max="60"
                value={settings.autoReleaseDays}
                onChange={(e) => setSettings({ ...settings, autoReleaseDays: e.target.value })}
                className="bg-white border-border"
              />
              <p className="text-xs text-muted-foreground">Funds auto-released if no confirmation</p>
            </div>
          </div>
        </motion.div>
        
        {/* Security Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-500" weight="fill" />
            </div>
            <div>
              <h3 className="font-semibold">Security & Access</h3>
              <p className="text-sm text-muted-foreground">Platform security configuration</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
              <div>
                <div className="font-medium">Maintenance Mode</div>
                <div className="text-sm text-muted-foreground">Temporarily disable public access</div>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
              <div>
                <div className="font-medium">Open Registration</div>
                <div className="text-sm text-muted-foreground">Allow new users to register</div>
              </div>
              <Switch
                checked={settings.registrationEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, registrationEnabled: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
              <div>
                <div className="font-medium">KYC Required</div>
                <div className="text-sm text-muted-foreground">Require verification for transactions</div>
              </div>
              <Switch
                checked={settings.kycRequired}
                onCheckedChange={(checked) => setSettings({ ...settings, kycRequired: checked })}
              />
            </div>
          </div>
        </motion.div>
        
        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-500" weight="fill" />
            </div>
            <div>
              <h3 className="font-semibold">Admin Notifications</h3>
              <p className="text-sm text-muted-foreground">Configure admin notifications</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-muted-foreground">Receive notifications via email</div>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
              <div>
                <div className="font-medium">Slack Notifications</div>
                <div className="text-sm text-muted-foreground">Send notifications to Slack channel</div>
              </div>
              <Switch
                checked={settings.slackNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, slackNotifications: checked })}
              />
            </div>
          </div>
        </motion.div>
        
        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleReset} disabled={isSaving}>
            <ArrowsClockwise className="w-4 h-4 mr-2" weight="bold" />
            Reset to Default
          </Button>
          <Button className="btn-accent" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Spinner className="w-4 h-4 mr-2 animate-spin" weight="bold" />
                Saving...
              </>
            ) : (
              <>
                <FloppyDisk className="w-4 h-4 mr-2" weight="fill" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
