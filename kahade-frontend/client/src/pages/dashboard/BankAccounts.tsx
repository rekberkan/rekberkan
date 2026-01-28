/*
 * KAHADE BANK ACCOUNTS PAGE
 * Manage user bank accounts for withdrawals
 * Icons: Phosphor Icons only
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bank, Plus, Trash, CheckCircle, Warning, Spinner,
  Star, CreditCard, ShieldCheck, X
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { bankApi } from '@/lib/api';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountNumberLast4: string;
  isActive: boolean;
  isVerified: boolean;
  isDefault: boolean;
  createdAt: string;
}

interface BankInfo {
  code: string;
  name: string;
  logo?: string;
}

export default function BankAccounts() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [banks, setBanks] = useState<BankInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    bankCode: '',
    accountNumber: '',
    accountHolderName: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [accountsRes, banksRes] = await Promise.all([
        bankApi.getAccounts(),
        bankApi.getSupportedBanks(),
      ]);
      setAccounts(accountsRes.data.accounts || []);
      setBanks(banksRes.data.banks || []);
    } catch (error) {
      console.error('Failed to fetch bank data:', error);
      toast.error('Failed to load bank accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAccount = async () => {
    if (!formData.bankCode || !formData.accountNumber || !formData.accountHolderName) {
      toast.error('Please fill all fields');
      return;
    }

    if (!/^\d{10,16}$/.test(formData.accountNumber)) {
      toast.error('Account number must be 10-16 digits');
      return;
    }

    setIsSubmitting(true);
    try {
      await bankApi.addAccount(formData);
      toast.success('Bank account added successfully');
      setIsAddOpen(false);
      setFormData({ bankCode: '', accountNumber: '', accountHolderName: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add bank account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await bankApi.setDefault(id);
      toast.success('Default bank account updated');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to set default');
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;

    setIsSubmitting(true);
    try {
      await bankApi.deleteAccount(selectedAccount.id);
      toast.success('Bank account deleted');
      setIsDeleteOpen(false);
      setSelectedAccount(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete bank account');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Bank Accounts" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Spinner className="w-8 h-8 animate-spin text-black" weight="bold" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Bank Accounts" subtitle="Manage your bank accounts for withdrawals">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center">
              <Bank className="w-6 h-6 text-black" weight="duotone" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-black">Your Bank Accounts</h2>
              <p className="text-sm text-[#6B7280]">{accounts.length} of 5 accounts used</p>
            </div>
          </div>
          <Button 
            className="btn-primary" 
            onClick={() => setIsAddOpen(true)}
            disabled={accounts.length >= 5}
          >
            <Plus className="w-4 h-4 mr-2" weight="bold" />
            Add Account
          </Button>
        </div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#F5F5F5] rounded-xl p-4 flex items-start gap-3"
        >
          <ShieldCheck className="w-5 h-5 text-black mt-0.5" weight="duotone" />
          <div>
            <p className="text-sm font-medium text-black">Bank-Grade Security</p>
            <p className="text-sm text-[#6B7280]">
              Your bank account details are encrypted with AES-256-GCM encryption. 
              We only store the last 4 digits of your account number for display.
            </p>
          </div>
        </motion.div>

        {/* Bank Accounts List */}
        {accounts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-[#E5E5E5] p-12 text-center"
          >
            <Bank className="w-16 h-16 mx-auto mb-4 text-[#9CA3AF]" weight="duotone" />
            <h3 className="text-lg font-semibold text-black mb-2">No Bank Accounts</h3>
            <p className="text-[#6B7280] mb-6">Add a bank account to start withdrawing funds</p>
            <Button className="btn-primary" onClick={() => setIsAddOpen(true)}>
              <Plus className="w-4 h-4 mr-2" weight="bold" />
              Add Your First Account
            </Button>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {accounts.map((account, index) => (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white rounded-xl border p-5 ${
                    account.isDefault ? 'border-black' : 'border-[#E5E5E5]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#F5F5F5] flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-black" weight="duotone" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-black">{account.bankName}</h3>
                          {account.isDefault && (
                            <span className="px-2 py-0.5 rounded-full bg-black text-white text-xs font-medium">
                              Default
                            </span>
                          )}
                          {account.isVerified && (
                            <CheckCircle className="w-4 h-4 text-emerald-500" weight="fill" />
                          )}
                        </div>
                        <p className="text-[#6B7280]">****{account.accountNumberLast4}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!account.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(account.id)}
                        >
                          <Star className="w-4 h-4 mr-1" weight="regular" />
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:border-red-500"
                        onClick={() => {
                          setSelectedAccount(account);
                          setIsDeleteOpen(true);
                        }}
                      >
                        <Trash className="w-4 h-4" weight="regular" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Add Account Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Bank Account</DialogTitle>
              <DialogDescription>
                Add a new bank account for withdrawals
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Bank</Label>
                <Select
                  value={formData.bankCode}
                  onValueChange={(value) => setFormData({ ...formData, bankCode: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((bank) => (
                      <SelectItem key={bank.code} value={bank.code}>
                        {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.replace(/\D/g, '') })}
                  placeholder="Enter account number"
                  maxLength={16}
                />
              </div>
              <div className="space-y-2">
                <Label>Account Holder Name</Label>
                <Input
                  type="text"
                  value={formData.accountHolderName}
                  onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                  placeholder="Enter account holder name"
                />
                <p className="text-xs text-[#6B7280]">Must match the name on your bank account</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button className="btn-primary" onClick={handleAddAccount} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Account'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Bank Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this bank account? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-500 hover:bg-red-600"
                onClick={handleDeleteAccount}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
