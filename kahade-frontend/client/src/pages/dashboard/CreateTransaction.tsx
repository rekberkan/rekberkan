/*
 * KAHADE CREATE TRANSACTION PAGE
 */

import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, User, FileText, DollarSign, 
  CheckCircle2, Info, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { transactionApi } from '@/lib/api';

const categories = [
  { value: 'ELECTRONICS', label: 'Elektronik' },
  { value: 'FASHION', label: 'Fashion' },
  { value: 'SERVICES', label: 'Jasa' },
  { value: 'DIGITAL_GOODS', label: 'Produk Digital' },
  { value: 'PHYSICAL_GOODS', label: 'Barang Fisik' },
  { value: 'OTHER', label: 'Lainnya' },
];

const steps = [
  { id: 1, title: 'Peran', icon: User },
  { id: 2, title: 'Detail', icon: FileText },
  { id: 3, title: 'Harga', icon: DollarSign },
  { id: 4, title: 'Konfirmasi', icon: CheckCircle2 },
];

export default function CreateTransaction() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    role: 'buyer',
    counterpartyEmail: '',
    title: '',
    description: '',
    category: '',
    amount: '',
    feePaidBy: 'buyer',
    terms: '',
  });

  const platformFee = formData.amount ? Math.round(parseFloat(formData.amount) * 0.025) : 0;
  const totalAmount = formData.amount ? parseFloat(formData.amount) + (formData.feePaidBy === 'buyer' ? platformFee : 0) : 0;

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.counterpartyEmail) {
          toast.error('Email pihak lawan harus diisi');
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.counterpartyEmail)) {
          toast.error('Format email tidak valid');
          return false;
        }
        return true;
      case 2:
        if (!formData.title) {
          toast.error('Judul transaksi harus diisi');
          return false;
        }
        if (!formData.category) {
          toast.error('Kategori harus dipilih');
          return false;
        }
        if (!formData.description) {
          toast.error('Deskripsi harus diisi');
          return false;
        }
        return true;
      case 3:
        if (!formData.amount || parseFloat(formData.amount) < 10000) {
          toast.error('Minimal harga transaksi Rp 10.000');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const response = await transactionApi.create({
        counterpartyEmail: formData.counterpartyEmail,
        role: formData.role as 'buyer' | 'seller',
        title: formData.title,
        description: formData.description,
        category: formData.category,
        amount: parseFloat(formData.amount),
        feePaidBy: formData.feePaidBy as 'buyer' | 'seller' | 'split',
        terms: formData.terms || undefined,
      });

      toast.success('Transaksi berhasil dibuat!', {
        description: 'Undangan telah dikirim ke email pihak lawan.',
      });
      
      // Redirect to transaction detail
      const transactionId = response.data.id || response.data.transaction?.id;
      if (transactionId) {
        setLocation(`/app/transactions/${transactionId}`);
      } else {
        setLocation('/app/transactions');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal membuat transaksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  return (
    <DashboardLayout title="Buat Transaksi Baru" subtitle="Isi detail transaksi Anda">
      <div className="max-w-3xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center gap-2 ${currentStep >= step.id ? 'text-accent' : 'text-muted-foreground'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= step.id ? 'bg-accent/10 text-accent' : 'bg-white/5'}`}>
                    {currentStep > step.id ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="hidden sm:inline font-medium">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 sm:w-24 h-0.5 mx-2 ${currentStep > step.id ? 'bg-accent' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
        
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6 md:p-8"
        >
          {/* Step 1: Role Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-display font-bold mb-2">Pilih Peran Anda</h2>
                <p className="text-muted-foreground">Apakah Anda pembeli atau penjual dalam transaksi ini?</p>
              </div>
              
              <RadioGroup
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
                className="grid grid-cols-2 gap-4"
              >
                <Label
                  htmlFor="buyer"
                  className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 cursor-pointer transition-all ${formData.role === 'buyer' ? 'border-accent bg-accent/5' : 'border-white/10 hover:border-white/20'}`}
                >
                  <RadioGroupItem value="buyer" id="buyer" className="sr-only" />
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                    <User className="w-8 h-8 text-red-500" />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">Pembeli</div>
                    <div className="text-sm text-muted-foreground">Saya ingin membeli</div>
                  </div>
                </Label>
                
                <Label
                  htmlFor="seller"
                  className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 cursor-pointer transition-all ${formData.role === 'seller' ? 'border-accent bg-accent/5' : 'border-white/10 hover:border-white/20'}`}
                >
                  <RadioGroupItem value="seller" id="seller" className="sr-only" />
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <User className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">Penjual</div>
                    <div className="text-sm text-muted-foreground">Saya ingin menjual</div>
                  </div>
                </Label>
              </RadioGroup>
              
              <div className="space-y-2">
                <Label htmlFor="counterpartyEmail">Email {formData.role === 'buyer' ? 'Penjual' : 'Pembeli'}</Label>
                <Input
                  id="counterpartyEmail"
                  type="email"
                  value={formData.counterpartyEmail}
                  onChange={(e) => setFormData({ ...formData, counterpartyEmail: e.target.value })}
                  placeholder="email@example.com"
                  className="bg-white/5 border-white/10"
                />
                <p className="text-xs text-muted-foreground">
                  Undangan akan dikirim ke email ini
                </p>
              </div>
            </div>
          )}
          
          {/* Step 2: Transaction Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-display font-bold mb-2">Detail Transaksi</h2>
                <p className="text-muted-foreground">Jelaskan barang atau jasa yang ditransaksikan</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Judul Transaksi *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Pembelian iPhone 15 Pro"
                  className="bg-white/5 border-white/10"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Kategori *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Jelaskan detail barang/jasa, kondisi, spesifikasi, dll."
                  rows={4}
                  className="bg-white/5 border-white/10 resize-none"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="terms">Syarat & Ketentuan Khusus (Opsional)</Label>
                <Textarea
                  id="terms"
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="Contoh: Garansi 7 hari, pengiriman dalam 3 hari, dll."
                  rows={3}
                  className="bg-white/5 border-white/10 resize-none"
                />
              </div>
            </div>
          )}
          
          {/* Step 3: Pricing */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-display font-bold mb-2">Harga & Biaya</h2>
                <p className="text-muted-foreground">Tentukan harga dan pembagian biaya platform</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Harga Transaksi (IDR) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0"
                  min="10000"
                  className="bg-white/5 border-white/10 text-2xl font-semibold"
                />
                <p className="text-xs text-muted-foreground">Minimal Rp 10.000</p>
              </div>
              
              <div className="space-y-3">
                <Label>Biaya Platform Ditanggung Oleh</Label>
                <RadioGroup
                  value={formData.feePaidBy}
                  onValueChange={(value) => setFormData({ ...formData, feePaidBy: value })}
                  className="space-y-2"
                >
                  <Label
                    htmlFor="fee-buyer"
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer ${formData.feePaidBy === 'buyer' ? 'border-accent bg-accent/5' : 'border-white/10'}`}
                  >
                    <RadioGroupItem value="buyer" id="fee-buyer" />
                    <span>Pembeli</span>
                  </Label>
                  <Label
                    htmlFor="fee-seller"
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer ${formData.feePaidBy === 'seller' ? 'border-accent bg-accent/5' : 'border-white/10'}`}
                  >
                    <RadioGroupItem value="seller" id="fee-seller" />
                    <span>Penjual</span>
                  </Label>
                  <Label
                    htmlFor="fee-split"
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer ${formData.feePaidBy === 'split' ? 'border-accent bg-accent/5' : 'border-white/10'}`}
                  >
                    <RadioGroupItem value="split" id="fee-split" />
                    <span>Bagi Rata (50:50)</span>
                  </Label>
                </RadioGroup>
              </div>
              
              {formData.amount && (
                <div className="p-4 rounded-xl bg-white/5 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Harga Transaksi</span>
                    <span>{formatCurrency(formData.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Biaya Platform (2.5%)</span>
                    <span>{formatCurrency(platformFee)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-2 flex justify-between font-semibold">
                    <span>Total {formData.role === 'buyer' ? 'Pembayaran' : 'Diterima'}</span>
                    <span className="text-accent">
                      {formData.role === 'buyer' 
                        ? formatCurrency(totalAmount) 
                        : formatCurrency(parseFloat(formData.amount) - (formData.feePaidBy === 'seller' ? platformFee : 0))
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Step 4: Confirmation */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-display font-bold mb-2">Konfirmasi Transaksi</h2>
                <p className="text-muted-foreground">Periksa kembali detail transaksi Anda</p>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-sm text-muted-foreground mb-1">Peran Anda</div>
                  <div className="font-semibold">{formData.role === 'buyer' ? 'Pembeli' : 'Penjual'}</div>
                </div>
                
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-sm text-muted-foreground mb-1">Email {formData.role === 'buyer' ? 'Penjual' : 'Pembeli'}</div>
                  <div className="font-semibold">{formData.counterpartyEmail}</div>
                </div>
                
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-sm text-muted-foreground mb-1">Judul</div>
                  <div className="font-semibold">{formData.title}</div>
                </div>
                
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-sm text-muted-foreground mb-1">Deskripsi</div>
                  <div>{formData.description}</div>
                </div>
                
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-sm text-muted-foreground mb-1">Kategori</div>
                  <div className="font-semibold">
                    {categories.find(c => c.value === formData.category)?.label || '-'}
                  </div>
                </div>
                
                {formData.terms && (
                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="text-sm text-muted-foreground mb-1">Syarat & Ketentuan</div>
                    <div>{formData.terms}</div>
                  </div>
                )}
                
                <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Harga</span>
                    <span>{formatCurrency(formData.amount)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Biaya Platform (2.5%)</span>
                    <span>{formatCurrency(platformFee)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Ditanggung oleh</span>
                    <span>{formData.feePaidBy === 'buyer' ? 'Pembeli' : formData.feePaidBy === 'seller' ? 'Penjual' : 'Bagi Rata'}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t border-accent/20 pt-2">
                    <span>Total {formData.role === 'buyer' ? 'Pembayaran' : 'Diterima'}</span>
                    <span className="text-accent">
                      {formData.role === 'buyer' 
                        ? formatCurrency(totalAmount) 
                        : formatCurrency(parseFloat(formData.amount) - (formData.feePaidBy === 'seller' ? platformFee : 0))
                      }
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm">
                  Setelah dibuat, undangan akan dikirim ke{' '}
                  <strong>{formData.counterpartyEmail}</strong>. 
                  Transaksi akan aktif setelah pihak lawan menyetujui.
                </p>
              </div>
            </div>
          )}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
            {currentStep > 1 ? (
              <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
            ) : (
              <Link href="/app/transactions">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Batal
                </Button>
              </Link>
            )}
            
            {currentStep < 4 ? (
              <Button className="btn-accent" onClick={handleNext}>
                Lanjut
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                className="btn-accent" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Buat Transaksi
                  </>
                )}
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
