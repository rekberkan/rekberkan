/*
 * KAHADE CONTACT PAGE - Modern Design
 * Brand color: #000000
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Envelope, Phone, MapPin, PaperPlaneTilt, ChatCircle, Clock, ArrowRight } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const contactInfo = [
  {
    icon: Envelope,
    title: 'Email',
    value: 'support@kahade.com',
    description: 'Response within 24 hours'
  },
  {
    icon: Phone,
    title: 'Phone',
    value: '+62 21 1234 5678',
    description: 'Mon - Fri, 9AM - 6PM WIB'
  },
  {
    icon: MapPin,
    title: 'Address',
    value: 'Jakarta, Indonesia',
    description: 'Jl. Sudirman No. 123'
  }
];

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('Message sent!', {
      description: 'Our team will contact you shortly.'
    });
    
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-black">
              Contact Us
            </h1>
            <p className="text-lg text-[#6B7280]">
              Have questions or need help? Our team is ready to assist you.
            </p>
          </motion.div>
        </div>
      </section>
      
      {/* Contact Info Cards */}
      <section className="pb-12">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-6">
            {contactInfo.map((info, index) => (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="feature-card text-center group"
              >
                <div className="w-12 h-12 rounded-xl bg-[#F5F5F5] flex items-center justify-center mx-auto mb-4 group-hover:bg-black group-hover:text-white transition-colors">
                  <info.icon className="w-6 h-6" weight="duotone" />
                </div>
                <h3 className="font-semibold mb-1 text-black">{info.title}</h3>
                <p className="text-black mb-1">{info.value}</p>
                <p className="text-sm text-[#6B7280]">{info.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Contact Form & Info */}
      <section className="py-12 bg-[#FAFAFA]">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl p-8 border border-[#E5E5E5]"
            >
              <h2 className="text-2xl font-bold mb-6 text-black">Send a Message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-black">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                      required
                      className="bg-white border-[#E5E5E5] focus:border-black focus:ring-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-black">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                      required
                      className="bg-white border-[#E5E5E5] focus:border-black focus:ring-black"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-black">Subject</Label>
                  <Select 
                    value={formData.subject} 
                    onValueChange={(value) => setFormData({ ...formData, subject: value })}
                  >
                    <SelectTrigger className="bg-white border-[#E5E5E5] focus:border-black focus:ring-black">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="support">Technical Support</SelectItem>
                      <SelectItem value="billing">Payment & Billing</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-black">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Write your message here..."
                    rows={5}
                    required
                    className="bg-white border-[#E5E5E5] focus:border-black focus:ring-black resize-none"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="btn-primary w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>Sending...</>
                  ) : (
                    <>
                      Send Message
                      <PaperPlaneTilt className="ml-2 w-4 h-4" weight="bold" />
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
            
            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl p-6 border border-[#E5E5E5]">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#F5F5F5] flex items-center justify-center shrink-0">
                    <ChatCircle className="w-5 h-5 text-black" weight="duotone" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-black">Live Chat</h3>
                    <p className="text-sm text-[#6B7280] mb-3">
                      Need quick help? Our support team is available via live chat.
                    </p>
                    <Button 
                      className="btn-secondary" 
                      onClick={() => window.open('https://wa.me/6221123456789', '_blank')}
                    >
                      Start Chat
                      <ArrowRight className="ml-2 w-4 h-4" weight="bold" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border border-[#E5E5E5]">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#F5F5F5] flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-black" weight="duotone" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-4 text-black">Business Hours</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">Monday - Friday</span>
                        <span className="font-medium text-black">9:00 AM - 6:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">Saturday</span>
                        <span className="font-medium text-black">9:00 AM - 3:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">Sunday</span>
                        <span className="text-[#6B7280]">Closed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-black rounded-2xl p-6 text-white">
                <h3 className="font-semibold mb-3">Looking for answers?</h3>
                <p className="text-sm text-white/70 mb-4">
                  Your question might already be answered in our FAQ section.
                </p>
                <Button 
                  className="bg-white text-black hover:bg-[#F5F5F5] w-full font-semibold"
                  asChild
                >
                  <a href="/how-it-works#faq">
                    View FAQ
                    <ArrowRight className="ml-2 w-4 h-4" weight="bold" />
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
