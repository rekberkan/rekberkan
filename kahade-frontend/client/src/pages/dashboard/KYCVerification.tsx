/*
 * KAHADE KYC VERIFICATION PAGE
 * Upload identity documents for verification
 * Icons: Phosphor Icons only
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  IdentificationCard, Camera, Upload, CheckCircle, Warning,
  Spinner, ShieldCheck, X, Image, FileText, Info
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { kycApi } from '@/lib/api';

type KYCStatus = 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';

interface KYCData {
  status: KYCStatus;
  idType?: string;
  idNumber?: string;
  submittedAt?: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

const statusConfig: Record<KYCStatus, { label: string; color: string; bgColor: string; icon: typeof CheckCircle }> = {
  NONE: { label: 'Not Submitted', color: 'text-[#6B7280]', bgColor: 'bg-[#F5F5F5]', icon: Warning },
  PENDING: { label: 'Under Review', color: 'text-amber-600', bgColor: 'bg-amber-50', icon: Warning },
  VERIFIED: { label: 'Verified', color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'text-red-600', bgColor: 'bg-red-50', icon: Warning },
};

const idTypes = [
  { value: 'KTP', label: 'KTP (Indonesian ID)' },
  { value: 'SIM', label: 'SIM (Driver License)' },
  { value: 'PASSPORT', label: 'Passport' },
];

export default function KYCVerification() {
  const { user, refreshUser } = useAuth();
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    idType: '',
    idNumber: '',
    fullName: '',
    dateOfBirth: '',
    address: '',
  });
  
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchKYCStatus();
  }, []);

  const fetchKYCStatus = async () => {
    try {
      const response = await kycApi.getStatus();
      setKycData(response.data);
    } catch (error) {
      console.error('Failed to fetch KYC status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void,
    setPreview: (preview: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!formData.idType || !formData.idNumber || !formData.fullName) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!idFront || !selfie) {
      toast.error('Please upload ID front and selfie');
      return;
    }

    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('idType', formData.idType);
      formDataToSend.append('idNumber', formData.idNumber);
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('dateOfBirth', formData.dateOfBirth);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('idFront', idFront);
      if (idBack) formDataToSend.append('idBack', idBack);
      formDataToSend.append('selfie', selfie);

      await kycApi.submit(formDataToSend);
      toast.success('KYC submitted successfully!', {
        description: 'We will review your documents within 1-3 business days.'
      });
      fetchKYCStatus();
      refreshUser();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit KYC');
    } finally {
      setIsSubmitting(false);
    }
  };

  const status = statusConfig[kycData?.status || 'NONE'];

  if (isLoading) {
    return (
      <DashboardLayout title="KYC Verification" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Spinner className="w-8 h-8 animate-spin text-black" weight="bold" />
        </div>
      </DashboardLayout>
    );
  }

  // Already verified
  if (kycData?.status === 'VERIFIED') {
    return (
      <DashboardLayout title="KYC Verification" subtitle="Your identity has been verified">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-white rounded-xl border border-[#E5E5E5] p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" weight="fill" />
            </div>
            <h2 className="text-2xl font-bold text-black mb-2">Identity Verified</h2>
            <p className="text-[#6B7280] mb-6">
              Your identity has been successfully verified. You now have access to higher transaction limits.
            </p>
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div className="p-4 rounded-xl bg-[#F5F5F5]">
                <p className="text-sm text-[#6B7280]">Transaction Limit</p>
                <p className="text-xl font-bold text-black">Rp 100.000.000</p>
              </div>
              <div className="p-4 rounded-xl bg-[#F5F5F5]">
                <p className="text-sm text-[#6B7280]">Verified Since</p>
                <p className="text-xl font-bold text-black">
                  {kycData?.verifiedAt ? new Date(kycData.verifiedAt).toLocaleDateString('id-ID') : '-'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </DashboardLayout>
    );
  }

  // Pending review
  if (kycData?.status === 'PENDING') {
    return (
      <DashboardLayout title="KYC Verification" subtitle="Your documents are under review">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-white rounded-xl border border-[#E5E5E5] p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
              <Spinner className="w-10 h-10 text-amber-600 animate-spin" weight="bold" />
            </div>
            <h2 className="text-2xl font-bold text-black mb-2">Under Review</h2>
            <p className="text-[#6B7280] mb-6">
              Your documents are being reviewed. This usually takes 1-3 business days.
            </p>
            <div className="p-4 rounded-xl bg-[#F5F5F5] max-w-sm mx-auto">
              <p className="text-sm text-[#6B7280]">Submitted On</p>
              <p className="text-lg font-semibold text-black">
                {kycData?.submittedAt ? new Date(kycData.submittedAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                }) : '-'}
              </p>
            </div>
          </div>
        </motion.div>
      </DashboardLayout>
    );
  }

  // Rejected - show reason and allow resubmit
  if (kycData?.status === 'REJECTED') {
    return (
      <DashboardLayout title="KYC Verification" subtitle="Your verification was rejected">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto space-y-6"
        >
          <div className="bg-red-50 rounded-xl border border-red-200 p-6">
            <div className="flex items-start gap-4">
              <Warning className="w-6 h-6 text-red-600 mt-0.5" weight="fill" />
              <div>
                <h3 className="font-semibold text-red-800 mb-1">Verification Rejected</h3>
                <p className="text-red-700">{kycData?.rejectionReason || 'Please resubmit with valid documents.'}</p>
              </div>
            </div>
          </div>
          <Button className="btn-primary w-full" onClick={() => setKycData({ status: 'NONE' })}>
            Resubmit Documents
          </Button>
        </motion.div>
      </DashboardLayout>
    );
  }

  // Not submitted - show form
  return (
    <DashboardLayout title="KYC Verification" subtitle="Verify your identity to unlock higher limits">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#F5F5F5] rounded-xl p-6"
        >
          <div className="flex items-start gap-4">
            <ShieldCheck className="w-8 h-8 text-black" weight="duotone" />
            <div>
              <h3 className="font-semibold text-black mb-2">Why Verify?</h3>
              <ul className="space-y-2 text-sm text-[#6B7280]">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" weight="fill" />
                  Increase transaction limit to Rp 100.000.000
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" weight="fill" />
                  Get verified badge on your profile
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" weight="fill" />
                  Faster dispute resolution
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step >= s ? 'bg-black text-white' : 'bg-[#E5E5E5] text-[#6B7280]'
              }`}>
                {s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-black' : 'bg-[#E5E5E5]'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl border border-[#E5E5E5] p-6 space-y-4"
          >
            <h3 className="text-lg font-semibold text-black">Personal Information</h3>
            
            <div className="space-y-2">
              <Label>ID Type</Label>
              <Select
                value={formData.idType}
                onValueChange={(value) => setFormData({ ...formData, idType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ID type" />
                </SelectTrigger>
                <SelectContent>
                  {idTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>ID Number</Label>
              <Input
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                placeholder="Enter ID number"
              />
            </div>

            <div className="space-y-2">
              <Label>Full Name (as on ID)</Label>
              <Input
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Enter full name"
              />
            </div>

            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address as on ID"
              />
            </div>

            <Button 
              className="btn-primary w-full" 
              onClick={() => setStep(2)}
              disabled={!formData.idType || !formData.idNumber || !formData.fullName}
            >
              Continue
            </Button>
          </motion.div>
        )}

        {/* Step 2: Upload Documents */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl border border-[#E5E5E5] p-6 space-y-6"
          >
            <h3 className="text-lg font-semibold text-black">Upload Documents</h3>

            {/* ID Front */}
            <div className="space-y-2">
              <Label>ID Card (Front) *</Label>
              <div className="border-2 border-dashed border-[#E5E5E5] rounded-xl p-6 text-center hover:border-black transition-colors">
                {idFrontPreview ? (
                  <div className="relative">
                    <img src={idFrontPreview} alt="ID Front" className="max-h-48 mx-auto rounded-lg" />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => { setIdFront(null); setIdFrontPreview(null); }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <IdentificationCard className="w-12 h-12 mx-auto mb-2 text-[#9CA3AF]" weight="duotone" />
                    <p className="text-sm text-[#6B7280]">Click to upload front of ID</p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, setIdFront, setIdFrontPreview)}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* ID Back */}
            <div className="space-y-2">
              <Label>ID Card (Back) - Optional</Label>
              <div className="border-2 border-dashed border-[#E5E5E5] rounded-xl p-6 text-center hover:border-black transition-colors">
                {idBackPreview ? (
                  <div className="relative">
                    <img src={idBackPreview} alt="ID Back" className="max-h-48 mx-auto rounded-lg" />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => { setIdBack(null); setIdBackPreview(null); }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <IdentificationCard className="w-12 h-12 mx-auto mb-2 text-[#9CA3AF]" weight="duotone" />
                    <p className="text-sm text-[#6B7280]">Click to upload back of ID</p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, setIdBack, setIdBackPreview)}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button 
                className="btn-primary flex-1" 
                onClick={() => setStep(3)}
                disabled={!idFront}
              >
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Selfie */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl border border-[#E5E5E5] p-6 space-y-6"
          >
            <h3 className="text-lg font-semibold text-black">Take a Selfie</h3>
            
            <div className="bg-[#F5F5F5] rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-black mt-0.5" weight="fill" />
                <div className="text-sm text-[#6B7280]">
                  <p className="font-medium text-black mb-1">Tips for a good selfie:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Hold your ID next to your face</li>
                    <li>Make sure your face and ID are clearly visible</li>
                    <li>Use good lighting</li>
                    <li>Remove glasses and hats</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Selfie with ID *</Label>
              <div className="border-2 border-dashed border-[#E5E5E5] rounded-xl p-6 text-center hover:border-black transition-colors">
                {selfiePreview ? (
                  <div className="relative">
                    <img src={selfiePreview} alt="Selfie" className="max-h-64 mx-auto rounded-lg" />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => { setSelfie(null); setSelfiePreview(null); }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Camera className="w-12 h-12 mx-auto mb-2 text-[#9CA3AF]" weight="duotone" />
                    <p className="text-sm text-[#6B7280]">Click to upload selfie with ID</p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, setSelfie, setSelfiePreview)}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button 
                className="btn-primary flex-1" 
                onClick={handleSubmit}
                disabled={!selfie || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit for Review'
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
