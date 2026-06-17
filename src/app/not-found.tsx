'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden font-sans select-none p-6">
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-100/40 dark:bg-emerald-900/20 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-teal-50/50 dark:bg-teal-900/20 blur-3xl" />
      </div>

      <motion.div 
        className="relative z-10 flex flex-col items-center text-center space-y-8 max-w-md w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Animated Icon / 404 Text */}
        <div className="relative">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-32 h-32 rounded-3xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-100 dark:border-slate-700 shadow-2xl flex items-center justify-center mx-auto mb-6 relative"
          >
            <div className="absolute inset-0 rounded-3xl bg-emerald-400/10 dark:bg-emerald-400/5 animate-pulse" />
            <SearchX size={64} className="text-emerald-500" strokeWidth={1.5} />
          </motion.div>
          
          <motion.h1 
            className="text-7xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600 mb-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            404
          </motion.h1>
        </div>

        {/* Text Content */}
        <div className="space-y-3">
          <motion.h2 
            className="text-2xl font-bold text-slate-900 dark:text-slate-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Ôi không! Lạc đường rồi
          </motion.h2>
          <motion.p 
            className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Trang bạn đang tìm kiếm không tồn tại, đã bị xóa hoặc URL không chính xác. Hãy kiểm tra lại đường dẫn nhé.
          </motion.p>
        </div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="pt-4 w-full"
        >
          <Link href="/" passHref className="w-full block">
            <Button className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 flex items-center justify-center gap-2 text-sm">
              <Home size={18} />
              Về trang chủ BillMate
            </Button>
          </Link>
        </motion.div>

        {/* Branding Footer */}
        <motion.div 
          className="pt-8 opacity-60 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.6 }}
        >
          <span>BillMate</span>
          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
          <span>Chi tiêu rõ ràng, tình bạn bền lâu</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
