/*
 * KAHADE ADMIN PROMOS PAGE
 * Manage promotions and vouchers
 * Icons: Phosphor Icons only
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Tag, Plus, Pencil, Trash, CheckCircle, XCircle,
  Spinner, MagnifyingGlass, Calendar, Percent, CurrencyDollar
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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

interface Promo {
  id: string;
  code: string;
  name: string;
  description?: string;
  targetType: string;
  discountType: string;
  discountValue?: number;
  discountPercent?: number;
  maxDiscountMinor?: number;
  maxTotalUsages?: number;
  maxUsagePerUser?: number;
  currentUsages: number;
  minPurchaseMinor?: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  createdAt: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount / 100);
};

export default function AdminPromos() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    targetType: 'ALL',
    discountType: 'PERCENTAGE',
    discountValue: '',
    discountPercent: '',
    maxDiscountMinor: '',
    maxTotalUsages: '',
    maxUsagePerUser: '1',
    minPurchaseMinor: '',
    validFrom: '',
    validUntil: '',
  });

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    try {
      const response = await adminApi.getPromos({ limit: 100 });
      setPromos(response.data.promos || response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch promos:', error);
      toast.error('Failed to load promotions');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      targetType: 'ALL',
      discountType: 'PERCENTAGE',
      discountValue: '',
      discountPercent: '',
      maxDiscountMinor: '',
      maxTotalUsages: '',
      maxUsagePerUser: '1',
      minPurchaseMinor: '',
      validFrom: '',
      validUntil: '',
    });
  };

  const handleCreate = async () => {
    if (!formData.code || !formData.name || !formData.validFrom || !formData.validUntil) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const data: any = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description,
        targetType: formData.targetType,
        discountType: formData.discountType,
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: new Date(formData.validUntil).toISOString(),
      };

      if (formData.discountType === 'PERCENTAGE') {
        data.discountPercent = parseFloat(formData.discountPercent);
        if (formData.maxDiscountMinor) {
          data.maxDiscountMinor = parseInt(formData.maxDiscountMinor) * 100;
        }
      } else {
        data.discountValue = parseInt(formData.discountValue) * 100;
      }

      if (formData.maxTotalUsages) data.maxTotalUsages = parseInt(formData.maxTotalUsages);
      if (formData.maxUsagePerUser) data.maxUsagePerUser = parseInt(formData.maxUsagePerUser);
      if (formData.minPurchaseMinor) data.minPurchaseMinor = parseInt(formData.minPurchaseMinor) * 100;

      await adminApi.createPromo(data);
      toast.success('Promotion created successfully');
      setIsCreateOpen(false);
      resetForm();
      fetchPromos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create promotion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (promo: Promo) => {
    try {
      await adminApi.deactivatePromo(promo.id);
      toast.success('Promotion deactivated');
      fetchPromos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to deactivate promotion');
    }
  };

  const filteredPromos = promos.filter(p => 
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: promos.length,
    active: promos.filter(p => p.isActive).length,
    expired: promos.filter(p => new Date(p.validUntil) < new Date()).length,
    totalUsages: promos.reduce((sum, p) => sum + p.currentUsages, 0),
  };

  if (isLoading) {
    return (
      <AdminLayout title="Promotions" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Spinner className="w-8 h-8 animate-spin text-black" weight="bold" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Promotions" subtitle="Manage promotional codes and discounts">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-[#E5E5E5] p-4"
          >
            <div className="flex items-center gap-3">
              <Tag className="w-8 h-8 text-black" weight="duotone" />
              <div>
                <div className="text-2xl font-bold text-black">{stats.total}</div>
                <div className="text-sm text-[#6B7280]">Total Promos</div>
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
                <div className="text-2xl font-bold text-emerald-700">{stats.active}</div>
                <div className="text-sm text-emerald-600">Active</div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-50 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-gray-600" weight="duotone" />
              <div>
                <div className="text-2xl font-bold text-gray-700">{stats.expired}</div>
                <div className="text-sm text-gray-600">Expired</div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-blue-50 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <CurrencyDollar className="w-8 h-8 text-blue-600" weight="duotone" />
              <div>
                <div className="text-2xl font-bold text-blue-700">{stats.totalUsages}</div>
                <div className="text-sm text-blue-600">Total Usages</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" weight="regular" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code or name..."
              className="pl-10"
            />
          </div>
          <Button className="btn-primary" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" weight="bold" />
            Create Promo
          </Button>
        </div>

        {/* Promos Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden"
        >
          {filteredPromos.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="w-16 h-16 mx-auto mb-4 text-[#9CA3AF]" weight="duotone" />
              <h4 className="text-lg font-semibold text-black mb-2">No Promotions</h4>
              <p className="text-[#6B7280]">Create your first promotion to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F5F5F5]">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-black">Code</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-black">Name</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-black">Discount</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-black">Usage</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-black">Valid Period</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-black">Status</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-black">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5]">
                  {filteredPromos.map((promo) => {
                    const isExpired = new Date(promo.validUntil) < new Date();
                    const isNotStarted = new Date(promo.validFrom) > new Date();
                    
                    return (
                      <tr key={promo.id} className="hover:bg-[#FAFAFA]">
                        <td className="px-4 py-3">
                          <span className="font-mono font-semibold text-black bg-[#F5F5F5] px-2 py-1 rounded">
                            {promo.code}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-black">{promo.name}</div>
                          {promo.description && (
                            <div className="text-sm text-[#6B7280] truncate max-w-xs">{promo.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {promo.discountType === 'PERCENTAGE' ? (
                            <div className="flex items-center gap-1">
                              <Percent className="w-4 h-4 text-[#6B7280]" weight="bold" />
                              <span className="font-semibold text-black">{promo.discountPercent}%</span>
                              {promo.maxDiscountMinor && (
                                <span className="text-sm text-[#6B7280]">
                                  (max {formatCurrency(promo.maxDiscountMinor)})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="font-semibold text-black">
                              {formatCurrency(promo.discountValue || 0)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#6B7280]">
                          {promo.currentUsages} / {promo.maxTotalUsages || '∞'}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#6B7280]">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" weight="regular" />
                            {new Date(promo.validFrom).toLocaleDateString('id-ID')} - {new Date(promo.validUntil).toLocaleDateString('id-ID')}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {!promo.isActive ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                              Inactive
                            </span>
                          ) : isExpired ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-600">
                              Expired
                            </span>
                          ) : isNotStarted ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-600">
                              Scheduled
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {promo.isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:border-red-600"
                              onClick={() => handleDeactivate(promo)}
                            >
                              <Trash className="w-4 h-4" weight="bold" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Create Promo Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Promotion</DialogTitle>
              <DialogDescription>
                Create a new promotional code for your users
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Promo Code *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., SAVE20"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., New Year Sale"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the promotion..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value) => setFormData({ ...formData, discountType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                      <SelectItem value="FIXED">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{formData.discountType === 'PERCENTAGE' ? 'Discount %' : 'Discount Amount'}</Label>
                  <Input
                    type="number"
                    value={formData.discountType === 'PERCENTAGE' ? formData.discountPercent : formData.discountValue}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      [formData.discountType === 'PERCENTAGE' ? 'discountPercent' : 'discountValue']: e.target.value 
                    })}
                    placeholder={formData.discountType === 'PERCENTAGE' ? 'e.g., 20' : 'e.g., 50000'}
                  />
                </div>
              </div>

              {formData.discountType === 'PERCENTAGE' && (
                <div className="space-y-2">
                  <Label>Max Discount (Rp)</Label>
                  <Input
                    type="number"
                    value={formData.maxDiscountMinor}
                    onChange={(e) => setFormData({ ...formData, maxDiscountMinor: e.target.value })}
                    placeholder="e.g., 100000"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Total Usages</Label>
                  <Input
                    type="number"
                    value={formData.maxTotalUsages}
                    onChange={(e) => setFormData({ ...formData, maxTotalUsages: e.target.value })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Usage Per User</Label>
                  <Input
                    type="number"
                    value={formData.maxUsagePerUser}
                    onChange={(e) => setFormData({ ...formData, maxUsagePerUser: e.target.value })}
                    placeholder="e.g., 1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Min Purchase (Rp)</Label>
                <Input
                  type="number"
                  value={formData.minPurchaseMinor}
                  onChange={(e) => setFormData({ ...formData, minPurchaseMinor: e.target.value })}
                  placeholder="e.g., 100000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valid From *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valid Until *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button className="btn-primary" onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Promo'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
