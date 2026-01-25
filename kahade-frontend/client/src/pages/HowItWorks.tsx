/*
 * KAHADE HOW IT WORKS PAGE
 * Design: Step-by-step guide with visual illustrations
 */

import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { 
  UserPlus, FileText, Wallet, Send, CheckCircle2, 
  ArrowRight, Shield, Clock, HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const steps = [
  {
    icon: UserPlus,
    title: 'Daftar Akun',
    description: 'Buat akun gratis di Kahade. Proses pendaftaran cepat dan mudah, hanya butuh email dan password.',
    details: [
      'Verifikasi email untuk keamanan akun',
      'Lengkapi profil untuk meningkatkan kepercayaan',
      'Opsional: Verifikasi KYC untuk limit lebih tinggi'
    ]
  },
  {
    icon: FileText,
    title: 'Buat Transaksi',
    description: 'Pembeli atau penjual dapat membuat transaksi baru dengan detail lengkap tentang barang/jasa.',
    details: [
      'Tentukan judul dan deskripsi transaksi',
      'Masukkan nominal dan mata uang',
      'Pilih kategori dan syarat khusus jika ada',
      'Undang pihak lawan dengan link atau email'
    ]
  },
  {
    icon: Wallet,
    title: 'Pembeli Menyetor Dana',
    description: 'Pembeli menyetorkan dana ke escrow Kahade. Dana aman dan tidak dapat diakses oleh siapapun.',
    details: [
      'Pilih metode pembayaran (Transfer, E-Wallet, VA)',
      'Dana masuk ke rekening escrow Kahade',
      'Penjual mendapat notifikasi dana sudah masuk',
      'Status transaksi terupdate secara real-time'
    ]
  },
  {
    icon: Send,
    title: 'Penjual Mengirim Barang/Jasa',
    description: 'Penjual mengirim barang atau menyelesaikan jasa sesuai kesepakatan.',
    details: [
      'Upload bukti pengiriman atau penyelesaian',
      'Masukkan nomor resi jika ada',
      'Pembeli mendapat notifikasi',
      'Holding period dimulai'
    ]
  },
  {
    icon: CheckCircle2,
    title: 'Konfirmasi & Release Dana',
    description: 'Pembeli mengkonfirmasi penerimaan, dana dilepaskan ke penjual.',
    details: [
      'Pembeli cek dan konfirmasi barang/jasa',
      'Dana otomatis dilepaskan ke penjual',
      'Kedua pihak dapat memberikan rating',
      'Transaksi selesai dan tercatat'
    ]
  }
];

const faqs = [
  {
    question: 'Berapa biaya menggunakan Kahade?',
    answer: 'Kahade mengenakan biaya platform sebesar 1-3% dari nilai transaksi, tergantung pada kategori dan nominal. Biaya ini dapat ditanggung oleh pembeli, penjual, atau dibagi rata sesuai kesepakatan.'
  },
  {
    question: 'Bagaimana jika terjadi sengketa?',
    answer: 'Jika terjadi sengketa, kedua pihak dapat mengajukan dispute. Tim mediator Kahade akan meninjau bukti dari kedua belah pihak dan memberikan keputusan yang adil. Proses dispute biasanya selesai dalam 3-7 hari kerja.'
  },
  {
    question: 'Apakah dana saya aman?',
    answer: 'Ya, dana Anda sangat aman. Dana escrow disimpan di rekening terpisah yang diawasi dan tidak dapat diakses oleh siapapun kecuali melalui proses yang telah ditentukan. Semua transaksi tercatat untuk transparansi penuh.'
  },
  {
    question: 'Berapa lama proses pencairan dana?',
    answer: 'Setelah pembeli mengkonfirmasi, dana akan dicairkan ke penjual dalam 1-3 hari kerja tergantung metode pencairan yang dipilih. Transfer ke bank lokal biasanya lebih cepat.'
  },
  {
    question: 'Apakah perlu verifikasi KYC?',
    answer: 'Verifikasi KYC bersifat opsional untuk transaksi kecil. Namun, untuk transaksi di atas Rp 10 juta, verifikasi KYC diperlukan untuk keamanan dan kepatuhan regulasi.'
  },
  {
    question: 'Kategori transaksi apa saja yang didukung?',
    answer: 'Kahade mendukung berbagai kategori termasuk: Elektronik, Jasa Digital, Barang Fisik, Jasa Profesional, dan lainnya. Beberapa kategori terlarang seperti barang ilegal tidak diperbolehkan.'
  }
];

export default function HowItWorks() {
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
              Cara Kerja <span className="gradient-text">Kahade</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Proses sederhana dan aman untuk melindungi setiap transaksi Anda. 
              Ikuti langkah-langkah berikut untuk memulai.
            </p>
          </motion.div>
        </div>
      </section>
      
      {/* Steps Section */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative mb-12 last:mb-0"
              >
                {/* Connector */}
                {index < steps.length - 1 && (
                  <div className="absolute left-6 top-20 w-0.5 h-[calc(100%-2rem)] bg-gradient-to-b from-accent to-transparent" />
                )}
                
                <div className="flex gap-6">
                  {/* Step Number */}
                  <div className="shrink-0">
                    <div className="w-12 h-12 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center">
                      <step.icon className="w-5 h-5 text-accent" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="glass-card p-6 flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sm font-mono text-accent">Langkah {index + 1}</span>
                    </div>
                    <h3 className="text-xl font-display font-bold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground mb-4">{step.description}</p>
                    <ul className="space-y-2">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-foreground/80">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Security Features */}
      <section className="py-20 bg-white/[0.02]">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-display font-bold mb-4">
              Keamanan di Setiap Langkah
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Setiap tahap transaksi dilindungi dengan teknologi keamanan terdepan.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card p-6 text-center"
            >
              <Shield className="w-12 h-12 text-accent mx-auto mb-4" />
              <h3 className="text-lg font-display font-semibold mb-2">Escrow Terjamin</h3>
              <p className="text-sm text-muted-foreground">
                Dana disimpan di rekening escrow terpisah yang diawasi dan diasuransikan.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6 text-center"
            >
              <Clock className="w-12 h-12 text-accent mx-auto mb-4" />
              <h3 className="text-lg font-display font-semibold mb-2">Holding Period</h3>
              <p className="text-sm text-muted-foreground">
                Periode penahanan dana memberikan waktu untuk verifikasi sebelum release.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6 text-center"
            >
              <HelpCircle className="w-12 h-12 text-accent mx-auto mb-4" />
              <h3 className="text-lg font-display font-semibold mb-2">Resolusi Dispute</h3>
              <p className="text-sm text-muted-foreground">
                Tim mediator profesional siap membantu menyelesaikan sengketa dengan adil.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-20">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-display font-bold mb-4">
              Pertanyaan Umum
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Jawaban untuk pertanyaan yang sering diajukan.
            </p>
          </motion.div>
          
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="glass-card px-6 border-none"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-display font-semibold">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-white/[0.02]">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-display font-bold mb-4">
              Siap Memulai?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Daftar sekarang dan nikmati transaksi yang aman dengan Kahade.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button className="btn-accent group">
                  Daftar Gratis
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button className="btn-secondary">
                  Hubungi Kami
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
