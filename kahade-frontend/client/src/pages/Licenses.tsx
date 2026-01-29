/*
 * KAHADE LICENSES PAGE - Modern Design
 * Brand color: #000000
 */

import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { 
  Certificate, Calendar, ArrowLeft, Printer, 
  Code, Package, FileText 
} from '@phosphor-icons/react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';

const licenses = [
  {
    category: 'Frontend Framework',
    items: [
      { name: 'React', version: '18.2.0', license: 'MIT', url: 'https://github.com/facebook/react' },
      { name: 'Vite', version: '5.0.0', license: 'MIT', url: 'https://github.com/vitejs/vite' },
      { name: 'TypeScript', version: '5.3.0', license: 'Apache-2.0', url: 'https://github.com/microsoft/TypeScript' },
    ]
  },
  {
    category: 'UI Components',
    items: [
      { name: 'Tailwind CSS', version: '3.4.0', license: 'MIT', url: 'https://github.com/tailwindlabs/tailwindcss' },
      { name: 'Radix UI', version: '1.0.0', license: 'MIT', url: 'https://github.com/radix-ui/primitives' },
      { name: 'Framer Motion', version: '10.16.0', license: 'MIT', url: 'https://github.com/framer/motion' },
      { name: 'Phosphor Icons', version: '2.0.0', license: 'MIT', url: 'https://github.com/phosphor-icons/react' },
    ]
  },
  {
    category: 'State Management & Routing',
    items: [
      { name: 'Wouter', version: '3.0.0', license: 'ISC', url: 'https://github.com/molefrog/wouter' },
      { name: 'React Query', version: '5.0.0', license: 'MIT', url: 'https://github.com/TanStack/query' },
      { name: 'Zustand', version: '4.4.0', license: 'MIT', url: 'https://github.com/pmndrs/zustand' },
    ]
  },
  {
    category: 'Form & Validation',
    items: [
      { name: 'React Hook Form', version: '7.48.0', license: 'MIT', url: 'https://github.com/react-hook-form/react-hook-form' },
      { name: 'Zod', version: '3.22.0', license: 'MIT', url: 'https://github.com/colinhacks/zod' },
    ]
  },
  {
    category: 'Backend & API',
    items: [
      { name: 'Node.js', version: '20.10.0', license: 'MIT', url: 'https://github.com/nodejs/node' },
      { name: 'Express', version: '4.18.0', license: 'MIT', url: 'https://github.com/expressjs/express' },
      { name: 'Prisma', version: '5.6.0', license: 'Apache-2.0', url: 'https://github.com/prisma/prisma' },
    ]
  },
  {
    category: 'Utilities',
    items: [
      { name: 'date-fns', version: '2.30.0', license: 'MIT', url: 'https://github.com/date-fns/date-fns' },
      { name: 'clsx', version: '2.0.0', license: 'MIT', url: 'https://github.com/lukeed/clsx' },
      { name: 'Axios', version: '1.6.0', license: 'MIT', url: 'https://github.com/axios/axios' },
    ]
  },
];

const licenseTexts = {
  MIT: `MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.`,
  'Apache-2.0': `Apache License, Version 2.0

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.`,
  ISC: `ISC License

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS.`
};

export default function Licenses() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-12">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <Link href="/">
              <Button variant="ghost" size="sm" className="mb-6 gap-2 text-[#6B7280] hover:text-black">
                <ArrowLeft className="w-4 h-4" weight="bold" />
                Back to Home
              </Button>
            </Link>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5F5F5] text-black text-sm font-medium mb-6">
              <Certificate className="w-4 h-4" weight="fill" />
              Legal
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-black">
              Open Source Licenses
            </h1>
            <p className="text-xl text-[#6B7280] mb-6">
              Rekberkan is built with the help of many open source projects. 
              We are grateful to the developers and communities behind these tools.
            </p>
            <div className="flex items-center gap-4 text-[#6B7280]">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" weight="regular" />
                Last updated: January 1, 2026
              </span>
              <Button variant="ghost" size="sm" className="gap-2 text-[#6B7280] hover:text-black" onClick={() => window.print()}>
                <Printer className="w-4 h-4" weight="regular" />
                Print
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* License Summary */}
      <section className="py-12 bg-[#FAFAFA]">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="feature-card text-center"
            >
              <Package className="w-10 h-10 mx-auto text-black mb-4" weight="fill" />
              <div className="text-3xl font-bold mb-1 text-black">
                {licenses.reduce((acc, cat) => acc + cat.items.length, 0)}
              </div>
              <div className="text-[#6B7280]">Open Source Packages</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="feature-card text-center"
            >
              <Code className="w-10 h-10 mx-auto text-black mb-4" weight="fill" />
              <div className="text-3xl font-bold mb-1 text-black">{licenses.length}</div>
              <div className="text-[#6B7280]">Categories</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="feature-card text-center"
            >
              <FileText className="w-10 h-10 mx-auto text-black mb-4" weight="fill" />
              <div className="text-3xl font-bold mb-1 text-black">3</div>
              <div className="text-[#6B7280]">License Types</div>
            </motion.div>
          </div>
          
          {/* Package List */}
          <div className="space-y-8">
            {licenses.map((category, catIndex) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: catIndex * 0.1 }}
              >
                <h2 className="text-xl font-bold mb-4 text-black">{category.category}</h2>
                <div className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-[#FAFAFA]">
                      <tr>
                        <th className="text-left p-4 font-medium text-black">Package</th>
                        <th className="text-left p-4 font-medium text-black hidden sm:table-cell">Version</th>
                        <th className="text-left p-4 font-medium text-black">License</th>
                        <th className="text-right p-4 font-medium text-black">Link</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E5]">
                      {category.items.map((item) => (
                        <tr key={item.name} className="hover:bg-[#FAFAFA] transition-colors">
                          <td className="p-4 font-medium text-black">{item.name}</td>
                          <td className="p-4 text-[#6B7280] hidden sm:table-cell">{item.version}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 rounded-full bg-[#F5F5F5] text-black text-xs font-medium">
                              {item.license}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <a 
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-black hover:underline text-sm font-medium"
                            >
                              View →
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* License Texts */}
      <section className="py-12 bg-white">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl font-bold mb-4 text-black">License Texts</h2>
            <p className="text-[#6B7280]">
              Full text of the open source licenses used in this project.
            </p>
          </motion.div>
          
          <div className="space-y-6 max-w-4xl mx-auto">
            {Object.entries(licenseTexts).map(([name, text], index) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl border border-[#E5E5E5] p-6"
              >
                <h3 className="font-semibold text-lg mb-4 text-black">{name} License</h3>
                <pre className="text-sm text-[#6B7280] whitespace-pre-wrap font-mono bg-[#FAFAFA] p-4 rounded-lg overflow-x-auto">
                  {text}
                </pre>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Acknowledgments */}
      <section className="py-12 bg-black">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-2xl font-bold mb-4 text-white">Acknowledgments</h2>
            <p className="text-white/70 mb-6">
              We extend our sincere gratitude to all the open source maintainers and contributors 
              whose work makes projects like Rekberkan possible. Your dedication to building and 
              sharing quality software benefits the entire developer community.
            </p>
            <p className="text-sm text-white/50">
              If you believe we have missed any attribution or have questions about our use of 
              open source software, please contact us at{' '}
              <a href="mailto:legal@rekberkan.com" className="text-white hover:underline">
                legal@rekberkan.com
              </a>
            </p>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
