/*
 * KAHADE CONTACT PAGE
 * Design: Contact form with company info
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from 'lucide-react';
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
    icon: Mail,
    title: 'Email',
    value: 'support@kahade.com',
    description: 'Respon dalam 24 jam'
  },
  {
    icon: Phone,
    title: 'Telepon',
    value: '+62 21 1234 5678',
    description: 'Senin - Jumat, 09:00 - 18:00'
  },
  {
    icon: MapPin,
    title: 'Alamat',
    value: 'Jakarta, Indonesia',
    description: 'Gedung Cyber 2, Lantai 15'
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
    
    toast.success('Pesan terkirim!', {
      description: 'Tim kami akan menghubungi Anda segera.'
    });
    
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Hubungi <span className="gradient-text">Kami</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Punya pertanyaan atau butuh bantuan? Tim kami siap membantu Anda.
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
                className="glass-card p-6 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <info.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-display font-semibold mb-1">{info.title}</h3>
                <p className="text-foreground mb-1">{info.value}</p>
                <p className="text-sm text-muted-foreground">{info.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Contact Form & Info */}
      <section className="py-12">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-8"
            >
              <h2 className="text-2xl font-display font-bold mb-6">Kirim Pesan</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                      required
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                      required
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">Subjek</Label>
                  <Select 
                    value={formData.subject} 
                    onValueChange={(value) => setFormData({ ...formData, subject: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="Pilih subjek" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Pertanyaan Umum</SelectItem>
                      <SelectItem value="support">Dukungan Teknis</SelectItem>
                      <SelectItem value="billing">Pembayaran & Billing</SelectItem>
                      <SelectItem value="partnership">Kerjasama</SelectItem>
                      <SelectItem value="other">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Pesan</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tulis pesan Anda di sini..."
                    rows={5}
                    required
                    className="bg-white/5 border-white/10 resize-none"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="btn-accent w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>Mengirim...</>
                  ) : (
                    <>
                      Kirim Pesan
                      <Send className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
            
            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="glass-card p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold mb-2">Live Chat</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Butuh bantuan cepat? Tim support kami tersedia via live chat.
                    </p>
                    <Button className="btn-secondary" onClick={() => window.open('https://wa.me/6281234567890', '_blank')}>
                      Mulai Chat
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="glass-card p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold mb-2">Jam Operasional</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Senin - Jumat</span>
                        <span>09:00 - 18:00 WIB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sabtu</span>
                        <span>09:00 - 15:00 WIB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Minggu</span>
                        <span className="text-muted-foreground">Tutup</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="glass-card p-6">
                <h3 className="font-display font-semibold mb-4">FAQ</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Mungkin pertanyaan Anda sudah terjawab di halaman FAQ kami.
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <a href="/how-it-works#faq">Lihat FAQ</a>
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
