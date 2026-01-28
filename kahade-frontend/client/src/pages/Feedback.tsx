/*
 * KAHADE FEEDBACK PAGE - Modern Design
 * Brand color: #000000
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChatCircleDots, Star, PaperPlaneTilt, Lightbulb,
  Bug, Sparkle, ThumbsUp, CheckCircle
} from '@phosphor-icons/react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const feedbackTypes = [
  { id: 'suggestion', icon: Lightbulb, label: 'Suggestion', description: 'Share ideas for improvement' },
  { id: 'bug', icon: Bug, label: 'Bug Report', description: 'Report an issue or problem' },
  { id: 'feature', icon: Sparkle, label: 'Feature Request', description: 'Request a new feature' },
  { id: 'praise', icon: ThumbsUp, label: 'Praise', description: 'Tell us what you love' },
];

export default function Feedback() {
  const [feedbackType, setFeedbackType] = useState('suggestion');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) {
      toast.error('Please enter your feedback');
      return;
    }
    
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success('Thank you for your feedback!');
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <section className="pt-32 pb-20">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg mx-auto text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-black flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-white" weight="fill" />
              </div>
              <h1 className="text-3xl font-bold mb-4 text-black">Thank You!</h1>
              <p className="text-[#6B7280] mb-8">
                Your feedback has been submitted successfully. We appreciate you taking the time to help us improve Kahade.
              </p>
              <Button onClick={() => setIsSubmitted(false)} className="btn-primary">
                Submit Another Feedback
              </Button>
            </motion.div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-12">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5F5F5] text-black text-sm font-medium mb-6">
              <ChatCircleDots className="w-4 h-4" weight="fill" />
              Feedback
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-black">
              We Value Your Feedback
            </h1>
            <p className="text-xl text-[#6B7280]">
              Help us improve Kahade by sharing your thoughts, ideas, and suggestions.
            </p>
          </motion.div>
        </div>
      </section>
      
      {/* Feedback Form */}
      <section className="py-12 bg-[#FAFAFA]">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl border border-[#E5E5E5] p-8 space-y-8"
            >
              {/* Feedback Type */}
              <div className="space-y-4">
                <Label className="text-base text-black">What type of feedback do you have?</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {feedbackTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFeedbackType(type.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${
                        feedbackType === type.id
                          ? 'border-black bg-[#F5F5F5]'
                          : 'border-[#E5E5E5] hover:border-black'
                      }`}
                    >
                      <type.icon 
                        className={`w-8 h-8 mx-auto mb-2 ${
                          feedbackType === type.id ? 'text-black' : 'text-[#9CA3AF]'
                        }`} 
                        weight={feedbackType === type.id ? 'fill' : 'regular'} 
                      />
                      <div className="font-medium text-sm text-black">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Rating */}
              <div className="space-y-4">
                <Label className="text-base text-black">How would you rate your experience?</Label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 ${
                          star <= (hoverRating || rating)
                            ? 'text-black'
                            : 'text-[#E5E5E5]'
                        }`}
                        weight={star <= (hoverRating || rating) ? 'fill' : 'regular'}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-4 text-[#6B7280]">
                      {rating === 1 && 'Poor'}
                      {rating === 2 && 'Fair'}
                      {rating === 3 && 'Good'}
                      {rating === 4 && 'Very Good'}
                      {rating === 5 && 'Excellent'}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-black">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-white border-[#E5E5E5] focus:border-black focus:ring-black h-12"
                />
                <p className="text-xs text-[#9CA3AF]">
                  Provide your email if you'd like us to follow up on your feedback.
                </p>
              </div>
              
              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-black">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Brief summary of your feedback"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="bg-white border-[#E5E5E5] focus:border-black focus:ring-black h-12"
                />
              </div>
              
              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message" className="text-black">Your Feedback *</Label>
                <Textarea
                  id="message"
                  placeholder="Tell us more about your experience, ideas, or issues..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="bg-white border-[#E5E5E5] focus:border-black focus:ring-black min-h-[150px] resize-none"
                  required
                />
              </div>
              
              {/* Submit */}
              <Button 
                type="submit" 
                className="w-full btn-primary h-12 gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  'Submitting...'
                ) : (
                  <>
                    <PaperPlaneTilt className="w-5 h-5" weight="fill" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </motion.form>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
