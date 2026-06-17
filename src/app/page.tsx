'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Wallet,
  ArrowRight,
  Sparkles,
  Zap,
  Share2,
  CheckCircle2,
  Users,
  ShieldCheck
} from 'lucide-react';
import { serializeState } from '@/stores/group-store';
import { motion } from 'framer-motion';

export default function Home() {
  const [groupName, setGroupName] = useState('');
  const router = useRouter();

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = groupName.trim();
    if (!cleanName) return;

    // Generate unique group ID
    const groupId = 'bm-' + Math.random().toString(36).substring(2, 11);

    // Initial group state
    const initialState = {
      groupId,
      groupName: cleanName,
      members: [],
      expenses: [],
      bankInfo: {
        bankId: '',
        accountNo: '',
        accountName: '',
      },
      isFundMode: false,
      fundAmount: 0,
    };

    // Serialize state to base64 hash and redirect
    const serialized = serializeState(initialState);
    if (serialized) {
      router.push(`/${groupId}#state=${serialized}`);
    }
  };

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex flex-col relative font-sans select-none">
      {/* Background Decor Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-300px] left-[-200px] w-[600px] h-[600px] rounded-full bg-emerald-100/40 blur-3xl" />
        <div className="absolute top-[20%] right-[-150px] w-[500px] h-[500px] rounded-full bg-teal-50/50 blur-3xl" />
        <div className="absolute bottom-[-100px] left-[10%] w-[700px] h-[700px] rounded-full bg-slate-100 dark:bg-slate-700 blur-3xl" />
      </div>

      {/* 1. Header */}
      <header className="w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="BillMate Logo"
            className="w-9 h-9 rounded-xl shadow-md shadow-emerald-500/20 object-cover"
          />
          <span className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-50">
            BillMate
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden md:inline text-xs text-slate-400 dark:text-slate-500 font-semibold tracking-wider uppercase">
            ⚡️ Phiên bản MVP miễn phí
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* 2. Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-8 lg:py-16 z-10 relative">
        {/* Left column: Headings and Features summary */}
        <motion.div
          className="lg:col-span-7 space-y-6 text-center lg:text-left"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold"
          >
            <Sparkles size={12} />
            <span>Tối giản hóa tài chính nhóm</span>
          </motion.div>

          <motion.h2
            variants={fadeInUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight leading-tight"
          >
            Chi tiêu rõ ràng, <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">
              tình bạn bền lâu
            </span>
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="text-slate-500 dark:text-slate-400 dark:text-slate-500 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed"
          >
            BillMate là cách nhanh nhất và đơn giản nhất để tính toán các khoản chi tiêu nhóm, đi du lịch, ăn uống hay sinh hoạt. Tự động bù trừ nợ chéo thông minh và tạo mã chuyển khoản VietQR trong tích tắc.
          </motion.p>

          {/* Quick Feature Bullet list */}
          <motion.div
            variants={fadeInUp}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0 pt-2 text-left"
          >
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 dark:text-slate-500">
              <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
              <span>Không cần tạo tài khoản</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 dark:text-slate-500">
              <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
              <span>Thuật toán tối giản nợ</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 dark:text-slate-500">
              <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
              <span>Quét mã VietQR chuyển tiền</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 dark:text-slate-500">
              <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
              <span>Đồng bộ qua liên kết URL</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Right column: Action Glassmorphic Card */}
        <motion.div
          className="lg:col-span-5 w-full max-w-md mx-auto"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        >
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xl p-8 relative overflow-hidden group">
            {/* Glowing card dot */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/10 rounded-full blur-xl group-hover:bg-emerald-400/20 transition-colors pointer-events-none" />

            <div className="space-y-6">
              <div className="space-y-1.5 text-center">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">Bắt đầu ngay lập tức</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Chỉ mất 10 giây để tạo phòng chia tiền</p>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="groupNameHero"
                    className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase"
                  >
                    Tên nhóm hoặc sự kiện
                  </label>
                  <Input
                    id="groupNameHero"
                    placeholder="Ví dụ: Du lịch Đà Lạt 3N2Đ..."
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="h-12 border-slate-200 dark:border-slate-600 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 rounded-xl text-slate-800 dark:text-slate-200 text-sm shadow-sm transition-all bg-white dark:bg-slate-800"
                    required
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  Tạo nhóm chia tiền
                  <ArrowRight size={16} />
                </Button>
              </form>

              <div className="border-t border-slate-50 dark:border-slate-700/50 pt-4 text-center">
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Bằng cách bấm Tạo nhóm, hệ thống sẽ tự động khởi tạo dữ liệu cục bộ an toàn trên thiết bị của bạn.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* 3. Features Detail Grid */}
      <section className="bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 py-16 lg:py-24 z-10 relative mt-16">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          {/* Section Heading */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h3 className="text-xs font-bold text-emerald-600 tracking-widest uppercase">Tính năng nổi bật</h3>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              Mọi thứ bạn cần để chia hóa đơn công bằng
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">
              Không còn nỗi lo ghi chép thủ công hay tính toán nợ chéo phức tạp. Hãy để BillMate lo hết.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-emerald-200/50 hover:bg-white dark:bg-slate-800 hover:shadow-md transition-all space-y-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Zap size={20} />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">Khởi tạo tức thì</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 leading-relaxed">
                Tạo nhóm ngay lập tức không cần cung cấp Email, Số điện thoại hay tạo mật khẩu phức tạp. Sử dụng ẩn danh an toàn.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-emerald-200/50 hover:bg-white dark:bg-slate-800 hover:shadow-md transition-all space-y-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Users size={20} />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">Tối giản hóa nợ chéo</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 leading-relaxed">
                Thuật toán bù trừ tài chính thông minh sẽ tổng hợp tất cả hóa đơn chéo và đề xuất các bước trả tiền tối ưu nhất.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-emerald-200/50 hover:bg-white dark:bg-slate-800 hover:shadow-md transition-all space-y-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Share2 size={20} />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">Chia sẻ đồng bộ nhanh</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 leading-relaxed">
                Copy link nhóm chứa trạng thái nợ gửi lên Zalo/Messenger. Bạn bè của bạn chỉ cần bấm vào là thấy bảng số dư realtime.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-emerald-200/50 hover:bg-white dark:bg-slate-800 hover:shadow-md transition-all space-y-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck size={20} />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">VietQR Bảo mật & Tiện lợi</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 leading-relaxed">
                Không thu thập thông tin tài khoản ngân hàng của bạn. VietQR sinh mã tự động trực tiếp trên thiết bị (Client-side) tuyệt đối an toàn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Footer */}
      <footer className="w-full bg-slate-900 text-slate-400 dark:text-slate-500 py-12 border-t border-slate-800 mt-auto z-10 relative">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500 text-white">
              <Wallet size={12} />
            </div>
            <span className="text-sm font-black text-white tracking-tight">
              BillMate
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">
            © 2026 BillMate. Thiết kế tối giản cho trải nghiệm tài chính nhóm mượt mà.
          </p>
        </div>
      </footer>
    </div>
  );
}
