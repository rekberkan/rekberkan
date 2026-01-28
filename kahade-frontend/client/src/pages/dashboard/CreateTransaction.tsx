/*
 * KAHADE CREATE TRANSACTION PAGE
 * Icons: Phosphor Icons only
 */

import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, User, FileText, CurrencyDollar, 
  CheckCircle, Info, Spinner
} from '@phosphor-icons/react';
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
  { value: 'ELECTRONICS', label: 'Electronics' },
  { value: 'FASHION', label: 'Fashion' },
  { value: 'SERVICES', label: 'Services' },
  { value: 'DIGITAL_GOODS', label: 'Digital Goods' },
  { value: 'PHYSICAL_GOODS', label: 'Physical Goods' },
  { value: 'OTHER', label: 'Other' },
];

const steps = [
  { id: 1, title: 'Role', icon: User },
  { id: 2, title: 'Details', icon: FileText },
  { id: 3, title: 'Price', icon: CurrencyDollar },
  { id: 4, title: 'Confirm', icon: CheckCircle },
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
          toast.error('Counterparty email is required');
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.counterpartyEmail)) {
          toast.error('Invalid email format');
          return false;
        }
        return true;
      case 2:
        if (!formData.title) {
          toast.error('Transaction title is required');
          return false;
        }
        if (!formData.category) {
          toast.error('Category must be selected');
          return false;
        }
        if (!formData.description) {
          toast.error('Description is required');
          return false;
        }
        return true;
      case 3:
        if (!formData.amount || parseFloat(formData.amount) < 10000) {
          toast.error('Minimum transaction price is Rp 10,000');
          return false;
        }
        if (parseFloat(formData.amount) > 1000000000) {
          toast.error('Maximum transaction price is Rp 1,000,000,000');
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

      toast.success('Transaction created successfully!', {
        description: 'Invitation has been sent to the counterparty.',
      });
      
      const transactionId = response.data.id || response.data.transaction?.id;
      if (transactionId) {
        setLocation(`/app/transactions/${transactionId}`);
      } else {
        setLocation('/app/transactions');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create transaction');
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <DashboardLayout title="Create New Transaction" subtitle="Fill in your transaction details">
      <div className="max-w-3xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center gap-2 ${currentStep >= step.id ? 'text-accent' : 'text-muted-foreground'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= step.id ? 'bg-accent/10 text-accent' : 'bg-secondary'}`}>
                    {currentStep > step.id ? (
                      <CheckCircle className="w-5 h-5" weight="fill" />
                    ) : (
                      <step.icon className="w-5 h-5" weight="duotone" />
                    )}
                  </div>
                  <span className="hidden sm:inline font-medium">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 sm:w-24 h-0.5 mx-2 ${currentStep > step.id ? 'bg-accent' : 'bg-border'}`} />
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
                <h2 className="text-xl font-bold mb-2">Select Your Role</h2>
                <p className="text-muted-foreground">Are you the buyer or seller in this transaction?</p>
              </div>
              
              <RadioGroup
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
                className="grid grid-cols-2 gap-4"
              >
                <Label
                  htmlFor="buyer"
                  className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 cursor-pointer transition-all ${formData.role === 'buyer' ? 'border-accent bg-accent/5' : 'border-border hover:border-muted-foreground'}`}
                >
                  <RadioGroupItem value="buyer" id="buyer" className="sr-only" />
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                    <User className="w-8 h-8 text-red-500" weight="duotone" />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">Buyer</div>
                    <div className="text-sm text-muted-foreground">I want to buy</div>
                  </div>
                </Label>
                
                <Label
                  htmlFor="seller"
                  className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 cursor-pointer transition-all ${formData.role === 'seller' ? 'border-accent bg-accent/5' : 'border-border hover:border-muted-foreground'}`}
                >
                  <RadioGroupItem value="seller" id="seller" className="sr-only" />
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <User className="w-8 h-8 text-emerald-500" weight="duotone" />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">Seller</div>
                    <div className="text-sm text-muted-foreground">I want to sell</div>
                  </div>
                </Label>
              </RadioGroup>
              
              <div className="space-y-2">
                <Label htmlFor="counterpartyEmail">{formData.role === 'buyer' ? 'Seller' : 'Buyer'} Email</Label>
                <Input
                  id="counterpartyEmail"
                  type="email"
                  value={formData.counterpartyEmail}
                  onChange={(e) => setFormData({ ...formData, counterpartyEmail: e.target.value })}
                  placeholder="email@example.com"
                  className="bg-white border-border"
                />
                <p className="text-xs text-muted-foreground">
                  An invitation will be sent to this email
                </p>
              </div>
            </div>
          )}
          
          {/* Step 2: Transaction Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-2">Transaction Details</h2>
                <p className="text-muted-foreground">Describe the goods or services being transacted</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Transaction Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Example: iPhone 15 Pro Purchase"
                  className="bg-white border-border"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="bg-white border-border">
                    <SelectValue placeholder="Select category" />
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
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the item/service details, condition, specifications, etc."
                  rows={4}
                  className="bg-white border-border resize-none"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="terms">Special Terms & Conditions (Optional)</Label>
                <Textarea
                  id="terms"
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="Example: 7-day warranty, delivery within 3 days, etc."
                  rows={3}
                  className="bg-white border-border resize-none"
                />
              </div>
            </div>
          )}
          
          {/* Step 3: Pricing */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-2">Price & Fees</h2>
                <p className="text-muted-foreground">Set the price and platform fee allocation</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Transaction Price (IDR) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0"
                  min="10"
                  className="bg-white border-border text-2xl font-semibold"
                />
                <p className="text-xs text-muted-foreground">Minimum $10</p>
              </div>
              
              <div className="space-y-3">
                <Label>Platform Fee Paid By</Label>
                <RadioGroup
                  value={formData.feePaidBy}
                  onValueChange={(value) => setFormData({ ...formData, feePaidBy: value })}
                  className="space-y-2"
                >
                  <Label
                    htmlFor="fee-buyer"
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer ${formData.feePaidBy === 'buyer' ? 'border-accent bg-accent/5' : 'border-border'}`}
                  >
                    <RadioGroupItem value="buyer" id="fee-buyer" />
                    <span>Buyer</span>
                  </Label>
                  <Label
                    htmlFor="fee-seller"
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer ${formData.feePaidBy === 'seller' ? 'border-accent bg-accent/5' : 'border-border'}`}
                  >
                    <RadioGroupItem value="seller" id="fee-seller" />
                    <span>Seller</span>
                  </Label>
                  <Label
                    htmlFor="fee-split"
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer ${formData.feePaidBy === 'split' ? 'border-accent bg-accent/5' : 'border-border'}`}
                  >
                    <RadioGroupItem value="split" id="fee-split" />
                    <span>Split (50:50)</span>
                  </Label>
                </RadioGroup>
              </div>
              
              {formData.amount && (
                <div className="p-4 rounded-xl bg-secondary/50 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Transaction Price</span>
                    <span>{formatCurrency(formData.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Platform Fee (2.5%)</span>
                    <span>{formatCurrency(platformFee)}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between font-semibold">
                    <span>Total {formData.role === 'buyer' ? 'Payment' : 'Received'}</span>
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
                <h2 className="text-xl font-bold mb-2">Confirm Transaction</h2>
                <p className="text-muted-foreground">Review your transaction details</p>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="text-sm text-muted-foreground mb-1">Your Role</div>
                  <div className="font-semibold">{formData.role === 'buyer' ? 'Buyer' : 'Seller'}</div>
                </div>
                
                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="text-sm text-muted-foreground mb-1">{formData.role === 'buyer' ? 'Seller' : 'Buyer'} Email</div>
                  <div className="font-semibold">{formData.counterpartyEmail}</div>
                </div>
                
                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="text-sm text-muted-foreground mb-1">Title</div>
                  <div className="font-semibold">{formData.title}</div>
                </div>
                
                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="text-sm text-muted-foreground mb-1">Description</div>
                  <div>{formData.description}</div>
                </div>
                
                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="text-sm text-muted-foreground mb-1">Category</div>
                  <div className="font-semibold">
                    {categories.find(c => c.value === formData.category)?.label || '-'}
                  </div>
                </div>
                
                {formData.terms && (
                  <div className="p-4 rounded-xl bg-secondary/50">
                    <div className="text-sm text-muted-foreground mb-1">Terms & Conditions</div>
                    <div>{formData.terms}</div>
                  </div>
                )}
                
                <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Price</span>
                    <span>{formatCurrency(formData.amount)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Platform Fee (2.5%)</span>
                    <span>{formatCurrency(platformFee)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Paid by</span>
                    <span>{formData.feePaidBy === 'buyer' ? 'Buyer' : formData.feePaidBy === 'seller' ? 'Seller' : 'Split'}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t border-accent/20 pt-2">
                    <span>Total {formData.role === 'buyer' ? 'Payment' : 'Received'}</span>
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
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" weight="fill" />
                <p className="text-sm">
                  After creation, an invitation will be sent to{' '}
                  <strong>{formData.counterpartyEmail}</strong>. 
                  The transaction will be active once the counterparty accepts.
                </p>
              </div>
            </div>
          )}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            {currentStep > 1 ? (
              <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                <ArrowLeft className="w-4 h-4 mr-2" weight="bold" />
                Back
              </Button>
            ) : (
              <Link href="/app/transactions">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" weight="bold" />
                  Cancel
                </Button>
              </Link>
            )}
            
            {currentStep < 4 ? (
              <Button className="btn-accent" onClick={handleNext}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" weight="bold" />
              </Button>
            ) : (
              <Button 
                className="btn-accent" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2 animate-spin" weight="bold" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" weight="fill" />
                    Create Transaction
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
