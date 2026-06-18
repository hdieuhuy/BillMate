'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { 
  useGroupStore, 
  deserializeState, 
  serializeState,
  BankInfo 
} from '@/stores/group-store';
import { 
  calculateBalances, 
  simplifyDebts 
} from '@/features/debts/utils/debt-simplifier';
import { getVietQRUrl } from '@/features/debts/utils/vietqr';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  Wallet, 
  Trash2, 
  QrCode, 
  ArrowRight, 
  UserPlus, 
  Check, 
  AlertCircle,
  TrendingUp,
  Coins,
  Users,
  ChevronsUpDown,
  Search,
  Share2,
  Copy,
  Download,
  PenSquare,
  List,
  PieChart as PieChartIcon,
  Utensils,
  Car,
  Home,
  Bed,
  Coffee,
  ShoppingBag,
  Ticket,
  MoreHorizontal,
  PiggyBank
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  { id: 'food', label: 'Ăn uống', icon: Utensils, color: '#f97316' }, // orange-500
  { id: 'transport', label: 'Di chuyển', icon: Car, color: '#3b82f6' }, // blue-500
  { id: 'lodging', label: 'Khách sạn', icon: Bed, color: '#a855f7' }, // purple-500
  { id: 'shopping', label: 'Mua sắm', icon: ShoppingBag, color: '#ec4899' }, // pink-500
  { id: 'entertainment', label: 'Vui chơi', icon: Ticket, color: '#eab308' }, // yellow-500
  { id: 'other', label: 'Khác', icon: MoreHorizontal, color: '#94a3b8' }, // slate-400
];

const POPULAR_BANKS = [
  { id: 'vietcombank', name: 'Vietcombank' },
  { id: 'mbbank', name: 'MB Bank' },
  { id: 'techcombank', name: 'Techcombank' },
  { id: 'vietinbank', name: 'VietinBank' },
  { id: 'bidv', name: 'BIDV' },
  { id: 'acb', name: 'ACB' },
  { id: 'vpbank', name: 'VPBank' },
  { id: 'sacombank', name: 'Sacombank' },
  { id: 'tpbank', name: 'TPBank' },
  { id: 'vib', name: 'VIB' },
];

// Formatting helper: "150000" -> "150.000"
function formatVNCurrency(val: string): string {
  const raw = val.replace(/\D/g, '');
  if (!raw) return '';
  const num = parseInt(raw, 10);
  return num.toLocaleString('vi-VN');
}

// Parsing helper: "150.000" -> 150000
function parseVNCurrency(val: string): number {
  const raw = val.replace(/\D/g, '');
  return raw ? parseInt(raw, 10) : 0;
}

export default function GroupDashboard() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;

  if (groupId && !groupId.startsWith('bm-')) {
    notFound();
  }

  // Zustand stores
  const {
    groupName,
    members,
    expenses,
    bankInfo,
    isFundMode,
    fundAmount,
    loadGroup,
    initGroup,
    addMember,
    removeMember,
    addExpense,
    deleteExpense,
    updateBankInfo,
    setFundMode,
    setFundAmount,
  } = useGroupStore();

  // Local state
  const [loading, setLoading] = useState(true);
  const [newMemberName, setNewMemberName] = useState('');
  const [copiedText, setCopiedText] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [copiedShareText, setCopiedShareText] = useState(false);

  // Mobile Bottom Navigation Tab State
  const [mobileTab, setMobileTab] = useState<'input' | 'history' | 'results'>('input');

  // Tabs for Results Column (Settle vs Report)
  const [activeResultTab, setActiveResultTab] = useState<'settle' | 'report'>('settle');
  const [useFundToOffset, setUseFundToOffset] = useState(true);

  // Inline Form State
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState<string>('other');
  const [expPayer, setExpPayer] = useState('');
  const [expSplitType, setExpSplitType] = useState<'equal' | 'exact'>('equal');
  const [expParticipants, setExpParticipants] = useState<string[]>([]);
  const [expCustomAmounts, setExpCustomAmounts] = useState<Record<string, string>>({});
  const [validationError, setValidationError] = useState('');
  const prevMembersRef = React.useRef<string[]>([]);

  // Searchable payer dropdown state
  const [payerSearchOpen, setPayerSearchOpen] = useState(false);
  const [payerSearchQuery, setPayerSearchQuery] = useState('');

  // Dialog State for VietQR Settlement
  const [activeSettlement, setActiveSettlement] = useState<{
    from: string;
    to: string;
    amount: number;
  } | null>(null);
  const [tempBankId, setTempBankId] = useState(bankInfo.bankId || 'vietcombank');
  const [tempAccNo, setTempAccNo] = useState(bankInfo.accountNo || '');
  const [tempAccName, setTempAccName] = useState(bankInfo.accountName || '');

  // 1. Sync state on mount and hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#state=')) {
        const serialized = hash.substring(7);
        const state = deserializeState(serialized);
        if (state && state.groupId === groupId) {
          loadGroup(state);
        }
      }
    };

    const hash = window.location.hash;
    if (hash.startsWith('#state=')) {
      const serialized = hash.substring(7);
      const state = deserializeState(serialized);
      if (state && state.groupId === groupId) {
        loadGroup(state);
        setLoading(false);
        return;
      }
    }

    // Fallback: LocalStorage
    const local = localStorage.getItem('billmate_group');
    if (local) {
      try {
        const state = JSON.parse(local);
        if (state.groupId === groupId) {
          loadGroup(state);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Failed to parse local group', e);
      }
    }

    // Initialize blank group
    initGroup('Nhóm mới', []);
    setLoading(false);

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [groupId]);

  // Sync state bank details to local modal inputs
  useEffect(() => {
    if (bankInfo.bankId) setTempBankId(bankInfo.bankId);
    if (bankInfo.accountNo) setTempAccNo(bankInfo.accountNo);
    if (bankInfo.accountName) setTempAccName(bankInfo.accountName);
  }, [bankInfo]);

  // Set default form values when members load or change
  useEffect(() => {
    if (members.length > 0) {
      if (!expPayer || !members.includes(expPayer)) {
        setExpPayer(members[0]);
      }
      
      const prevMembers = prevMembersRef.current;
      const newlyAdded = members.filter(m => !prevMembers.includes(m));

      // Keep expParticipants in sync with members:
      // 1. Filter out members that were removed from the group
      // 2. Add members that are newly added to the group
      setExpParticipants(prev => {
        const active = prev.filter(p => members.includes(p));
        const toAdd = newlyAdded.filter(m => !active.includes(m));
        if (toAdd.length > 0 || active.length !== prev.length) {
          return [...active, ...toAdd];
        }
        return prev;
      });

      // Sync custom amounts map keys
      setExpCustomAmounts(prev => {
        const next = { ...prev };
        members.forEach(m => {
          if (next[m] === undefined) {
            next[m] = '';
          }
        });
        // Remove keys for members who are no longer in the group
        Object.keys(next).forEach(key => {
          if (!members.includes(key)) {
            delete next[key];
          }
        });
        return next;
      });

      prevMembersRef.current = members;
    } else {
      setExpPayer('');
      setExpParticipants([]);
      setExpCustomAmounts({});
      prevMembersRef.current = [];
    }
  }, [members]);

  // Separate expenses
  const personalExpenses = expenses.filter(exp => exp.payer !== 'FUND');
  const fundExpenses = expenses.filter(exp => exp.payer === 'FUND');

  // Derived financial computations for Personal
  const personalBalances = calculateBalances(personalExpenses, members);

  // Fund computations
  const totalFund = isFundMode ? members.length * fundAmount : 0;
  const totalFundSpent = fundExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remainingFund = totalFund - totalFundSpent;
  
  // Calculate how much each member consumed from the fund
  const fundConsumption: Record<string, number> = {};
  members.forEach(m => fundConsumption[m] = 0);
  
  fundExpenses.forEach(exp => {
    if (exp.splitType === 'equal') {
      const share = Math.round(exp.amount / (exp.participants.length || 1));
      exp.participants.forEach(p => {
        if (fundConsumption[p] !== undefined) fundConsumption[p] += share;
      });
    } else if (exp.splitType === 'exact') {
      if (exp.customAmounts) {
        exp.participants.forEach(p => {
          if (fundConsumption[p] !== undefined) fundConsumption[p] += exp.customAmounts![p] || 0;
        });
      } else {
        const share = Math.round(exp.amount / (exp.participants.length || 1));
        exp.participants.forEach(p => {
          if (fundConsumption[p] !== undefined) fundConsumption[p] += share;
        });
      }
    }
  });

  const fundBalances: Record<string, number> = {}; // > 0 means Fund owes member, < 0 means member owes Fund
  members.forEach(m => {
    fundBalances[m] = (isFundMode ? fundAmount : 0) - fundConsumption[m];
  });

  // Combine personal and fund balances for overall net balance display
  const balances: Record<string, number> = {};
  members.forEach(m => {
    balances[m] = (personalBalances[m] || 0) + (fundBalances[m] || 0);
  });

  const settlementBalances = { ...personalBalances };
  if (isFundMode && remainingFund > 0 && useFundToOffset) {
    Object.keys(balances).forEach(m => {
      settlementBalances[m] = balances[m];
    });
    settlementBalances['FUND'] = -remainingFund;
  }
  const simplifiedDebts = simplifyDebts(settlementBalances);

  // Total Spending & stats calculations
  const totalSpending = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const averageSpending = members.length > 0 ? totalSpending / members.length : 0;

  // Category statistics for Donut Chart
  const expensesByCategory = CATEGORY_OPTIONS.map(cat => {
    const total = expenses
      .filter(exp => (exp.categoryId || 'other') === cat.id)
      .reduce((sum, exp) => sum + exp.amount, 0);
    return { ...cat, total };
  }).filter(cat => cat.total > 0)
    .sort((a, b) => b.total - a.total);
  
  // Total paid by each member
  const totalPaidByMember: Record<string, number> = {};
  members.forEach(m => {
    totalPaidByMember[m] = 0;
  });
  expenses.forEach(exp => {
    if (totalPaidByMember[exp.payer] !== undefined) {
      totalPaidByMember[exp.payer] += exp.amount;
    }
  });

  const handleParticipantToggle = (name: string) => {
    if (expParticipants.includes(name)) {
      setExpParticipants(expParticipants.filter(p => p !== name));
      setExpCustomAmounts(prev => ({
        ...prev,
        [name]: '',
      }));
    } else {
      setExpParticipants([...expParticipants, name]);
    }
  };

  const handleCustomAmountChange = (name: string, value: string) => {
    const formatted = formatVNCurrency(value);
    setExpCustomAmounts(prev => ({
      ...prev,
      [name]: formatted,
    }));
  };

  // Submit expense (inline form handler)
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (members.length === 0) {
      setValidationError('Vui lòng thêm thành viên trước.');
      return;
    }

    const amount = parseVNCurrency(expAmount);
    if (amount <= 0) {
      setValidationError('Số tiền phải lớn hơn 0.');
      return;
    }

    if (!expPayer) {
      setValidationError('Vui lòng chọn người trả tiền.');
      return;
    }

    let finalParticipants = expParticipants;
    const payloadCustomAmounts: Record<string, number> = {};

    if (expSplitType === 'exact') {
      if (expParticipants.length === 0) {
        setValidationError('Vui lòng chọn ít nhất một người tham gia.');
        return;
      }

      let totalCustomSum = 0;
      for (const p of expParticipants) {
        const itemVal = parseVNCurrency(expCustomAmounts[p] || '0');
        if (itemVal < 0) {
          setValidationError(`Số tiền cho ${p} không hợp lệ.`);
          return;
        }
        payloadCustomAmounts[p] = itemVal;
        totalCustomSum += itemVal;
      }

      if (Math.abs(totalCustomSum - amount) > 10) {
        setValidationError(
          `Tổng số tiền chia (${totalCustomSum.toLocaleString('vi-VN')} ₫) phải bằng tổng số tiền hóa đơn (${amount.toLocaleString('vi-VN')} ₫).`
        );
        return;
      }
    } else {
      if (expParticipants.length === 0) {
        setValidationError('Vui lòng chọn ít nhất một người tham gia.');
        return;
      }
    }

    addExpense({
      description: expDesc.trim() || 'Chi tiêu không tên',
      amount,
      payer: expPayer,
      participants: finalParticipants,
      splitType: expSplitType,
      customAmounts: expSplitType === 'exact' ? payloadCustomAmounts : undefined,
      categoryId: expCategory,
    });

    // Reset inputs but keep context (payer, participants)
    setExpDesc('');
    setExpAmount('');
    setExpCategory('other');
    setExpSplitType('equal');
    setValidationError('');
    
    // Reset custom amounts inputs
    const clearedCustom: Record<string, string> = {};
    members.forEach(m => {
      clearedCustom[m] = '';
    });
    setExpCustomAmounts(clearedCustom);
  };

  // Record settlement payment
  const handleRecordSettlement = () => {
    if (!activeSettlement) return;

    updateBankInfo({
      bankId: tempBankId,
      accountNo: tempAccNo,
      accountName: tempAccName,
    });

    addExpense({
      description: `Thanh toán nợ: ${activeSettlement.from} ➔ ${activeSettlement.to}`,
      amount: activeSettlement.amount,
      payer: activeSettlement.from,
      participants: [activeSettlement.to],
      splitType: 'equal',
    });

    setActiveSettlement(null);
  };

  // Copy text summary to clipboard
  const handleCopySummary = () => {
    if (typeof window === 'undefined') return;

    let text = `📊 BẢNG TỔNG KẾT CHI TIÊU - ${groupName.toUpperCase()}\n`;
    text += `Tagline: Chi tiêu rõ ràng, tình bạn bền lâu.\n\n`;
    text += `💰 Tổng chi tiêu nhóm: ${totalSpending.toLocaleString('vi-VN')} ₫\n`;
    text += `👤 Trung bình mỗi người: ${Math.round(averageSpending).toLocaleString('vi-VN')} ₫\n\n`;

    text += `💵 Chi tiết chi tiêu từng người:\n`;
    members.forEach(m => {
      text += ` - ${m} đã chi: ${totalPaidByMember[m].toLocaleString('vi-VN')} ₫\n`;
    });

    text += `\n💰 Tình hình số dư:\n`;
    members.forEach(m => {
      const bal = balances[m] || 0;
      if (bal > 0) {
        text += ` - ${m}: nhận lại +${bal.toLocaleString('vi-VN')} ₫\n`;
      } else if (bal < 0) {
        text += ` - ${m}: cần trả ${Math.abs(bal).toLocaleString('vi-VN')} ₫\n`;
      } else {
        text += ` - ${m}: đã hòa gốc\n`;
      }
    });

    text += `\n🧮 Phương án thanh toán tối ưu:\n`;
    if (simplifiedDebts.length === 0) {
      text += ` - Mọi người đã hoàn thành thanh toán!\n`;
    } else {
      simplifiedDebts.forEach(d => {
        text += ` - ${d.from} chuyển cho ${d.to}: ${d.amount.toLocaleString('vi-VN')} ₫\n`;
      });
    }

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Download share card as PNG image
  const handleShareAsImage = async () => {
    const card = document.getElementById('share-card');
    if (!card) return;

    try {
      const htmlToImage = await import('html-to-image');
      const dataUrl = await htmlToImage.toPng(card, {
        pixelRatio: 3,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.download = `BillMate_${groupName.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to capture share card:', err);
      alert('Đã xảy ra lỗi khi tạo ảnh. Vui lòng thử lại sau.');
    }
  };

  // Copy share text to clipboard (used inside the share dialog)
  const handleCopyShareText = () => {
    if (typeof window === 'undefined') return;

    let text = `📊 ${groupName.toUpperCase()} — TỔNG KẾT CHI TIÊU\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 Tổng chi: ${totalSpending.toLocaleString('vi-VN')} ₫\n`;
    text += `👤 TB/người: ${Math.round(averageSpending).toLocaleString('vi-VN')} ₫\n`;
    text += `👥 ${members.length} thành viên\n\n`;

    text += `📋 SỐ DƯ TỪNG NGƯỜI:\n`;
    members.forEach(m => {
      const bal = balances[m] || 0;
      if (bal > 0) text += `  ✅ ${m}: +${bal.toLocaleString('vi-VN')} ₫\n`;
      else if (bal < 0) text += `  🔴 ${m}: ${bal.toLocaleString('vi-VN')} ₫\n`;
      else text += `  ⚖️ ${m}: 0 ₫\n`;
    });

    if (simplifiedDebts.length > 0) {
      text += `\n💸 CẦN THANH TOÁN:\n`;
      simplifiedDebts.forEach(d => {
        text += `  ${d.from} ➜ ${d.to}: ${d.amount.toLocaleString('vi-VN')} ₫\n`;
      });
    } else {
      text += `\n🎉 Tất cả đã cân bằng!\n`;
    }

    text += `\n— BillMate`;

    navigator.clipboard.writeText(text);
    setCopiedShareText(true);
    setTimeout(() => setCopiedShareText(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 dark:text-slate-500 font-sans">
        Đang tải dữ liệu nhóm...
      </div>
    );
  }

  // VietQR Image URL
  const qrUrl = activeSettlement
    ? getVietQRUrl(
        tempBankId,
        tempAccNo,
        activeSettlement.amount,
        `BillMate ${groupName.slice(0, 10)}`,
        tempAccName
      )
    : '';

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans">
      {/* 1. Header (Fixed) */}
      <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex-shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="BillMate Logo" 
            className="w-10 h-10 rounded-xl shadow-sm cursor-pointer object-cover" 
            onClick={() => router.push('/')}
          />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
              {groupName || 'BillMate'}
            </h1>
            <p suppressHydrationWarning className="text-xs text-slate-400 dark:text-slate-500">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            className="h-9 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer rounded-lg text-xs"
            onClick={handleCopySummary}
          >
            {copiedText ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            Copy
          </Button>
          <Button
            size="sm"
            className="h-9 bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1.5 cursor-pointer rounded-lg text-xs font-semibold shadow-sm"
            onClick={() => setShareDialogOpen(true)}
          >
            <Share2 size={14} />
            Chia sẻ
          </Button>
        </div>
      </header>

      {/* 2. Main SPA Layout (Strict 100vh with 3 Columns) */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden pb-[60px] lg:pb-0">
        
        {/* COLUMN 1: Members & Add Expense Form (Inline with fixed save button) */}
        <div className={`w-full lg:w-[32%] flex-col border-r border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden ${mobileTab === 'input' ? 'flex' : 'hidden lg:flex'}`}>
          {/* Member Section (Moved to Drawer) */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex-shrink-0 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50">
              Nhập thông tin chi tiêu
            </h2>
            <Sheet>
              <SheetTrigger className="h-8 px-3 border border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 text-xs flex items-center gap-1.5 rounded-lg cursor-pointer transition-colors bg-white dark:bg-slate-800 font-medium">
                <Users size={14} />
                Quản lý thành viên ({members.length})
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] sm:max-w-sm p-0 flex flex-col bg-white dark:bg-slate-900">
                <SheetHeader className="p-5 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
                  <SheetTitle className="text-left text-base font-bold text-slate-900 dark:text-slate-50">
                    Thành viên nhóm
                  </SheetTitle>
                </SheetHeader>
                <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4">
                  {/* Fund Configuration UI */}
                  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-bold text-slate-900 dark:text-slate-50 flex items-center gap-1.5">
                          <PiggyBank size={16} className="text-emerald-500" />
                          Chế độ Quỹ Chung
                        </label>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Đóng quỹ trước, chi tiêu sau</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setFundMode(!isFundMode)}
                        className={`w-10 h-5 flex items-center rounded-full transition-colors px-0.5 cursor-pointer flex-shrink-0 ${isFundMode ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isFundMode ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    {isFundMode && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Mức đóng quỹ / người (₫)
                        </label>
                        <input
                          type="text"
                          placeholder="2,000,000"
                          value={fundAmount ? fundAmount.toLocaleString('vi-VN') : ''}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            setFundAmount(raw ? parseInt(raw, 10) : 0);
                          }}
                          className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none text-slate-900 dark:text-slate-50"
                        />
                      </div>
                    )}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (newMemberName.trim()) {
                        addMember(newMemberName);
                        setNewMemberName('');
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <Input
                      placeholder="Nhập tên bạn bè..."
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="h-10 border-slate-200 dark:border-slate-600 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 rounded-lg text-sm"
                    />
                    <Button
                      type="submit"
                      className="h-10 bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1 cursor-pointer rounded-lg px-4"
                    >
                      <UserPlus size={16} />
                    </Button>
                  </form>

                  {/* Scrollable vertical list of members with delete buttons */}
                  {members.length > 0 ? (
                    <div className="border border-slate-100 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/20 dark:bg-slate-900/50">
                      {members.map(m => (
                        <div
                          key={m}
                          className="flex items-center justify-between p-3 text-sm hover:bg-slate-50/50 dark:bg-slate-900 transition-colors"
                        >
                          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate flex-1 min-w-0 pr-2">{m}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            className="h-8 w-8 text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-md cursor-pointer transition-colors flex-shrink-0"
                            onClick={() => removeMember(m)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">Chưa có thành viên nào.</p>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Form wrapper wrapping scroll area and bottom fixed button */}
          {members.length === 0 ? (
            <div className="p-6 bg-slate-50/50 dark:bg-slate-900 flex-1 text-center text-xs text-slate-400 dark:text-slate-500">
              Hãy thêm thành viên ở ô trên trước khi ghi nhận chi tiêu.
            </div>
          ) : (
            <form onSubmit={handleSaveExpense} className="flex-1 flex flex-col overflow-hidden min-h-0">
              {/* Form Input fields (Scrollable) */}
              <ScrollArea className="flex-1 min-h-0">
                <div className="p-4 space-y-4">

                  {/* Payer and Amount (Perfectly aligned labels & inputs with VN Currency Formatter) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                        Ai trả trước?
                      </label>
                      <Popover open={payerSearchOpen} onOpenChange={setPayerSearchOpen}>
                        <PopoverTrigger
                          render={
                            <button
                              type="button"
                              className="flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-2.5 text-xs text-slate-800 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden cursor-pointer"
                            >
                              <span className={`truncate ${!expPayer ? 'text-slate-400 dark:text-slate-500' : ''}`}>
                                {expPayer === 'FUND' ? '💰 Quỹ Chung' : (expPayer || 'Chọn người trả')}
                              </span>
                              <ChevronsUpDown size={12} className="text-slate-400 dark:text-slate-500 flex-shrink-0 ml-1" />
                            </button>
                          }
                        />
                        <PopoverContent
                          className="w-[var(--anchor-width)] p-0 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-lg rounded-lg overflow-hidden"
                          sideOffset={4}
                          align="start"
                        >
                          {/* Search input */}
                          <div className="flex items-center gap-2 px-2.5 py-2 border-b border-slate-100 dark:border-slate-700">
                            <Search size={12} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                            <input
                              type="text"
                              placeholder="Tìm thành viên..."
                              value={payerSearchQuery}
                              onChange={e => setPayerSearchQuery(e.target.value)}
                              className="flex-1 text-xs text-slate-800 dark:text-slate-200 bg-transparent outline-none placeholder:text-slate-400 dark:text-slate-500"
                              autoFocus
                            />
                          </div>
                          {/* Member list */}
                          <div className="max-h-44 overflow-y-auto py-1">
                            {[...(isFundMode ? ['FUND'] : []), ...members]
                              .filter(m => {
                                const searchStr = m === 'FUND' ? 'quy chung' : m.toLowerCase();
                                return searchStr.includes(payerSearchQuery.toLowerCase());
                              })
                              .map(m => (
                                <button
                                  key={m}
                                  type="button"
                                  className={`flex w-full items-center gap-2 px-2.5 py-2 text-xs transition-colors cursor-pointer hover:bg-emerald-50 dark:hover:bg-slate-700/50 ${
                                    expPayer === m ? 'bg-emerald-50/50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-slate-700 dark:text-slate-300'
                                  }`}
                                  onClick={() => {
                                    setExpPayer(m);
                                    setPayerSearchOpen(false);
                                    setPayerSearchQuery('');
                                  }}
                                >
                                  <div className={`w-4 h-4 rounded flex items-center justify-center border flex-shrink-0 ${
                                    expPayer === m ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 dark:border-slate-600'
                                  }`}>
                                    {expPayer === m && <Check size={10} strokeWidth={3} />}
                                  </div>
                                  <span className="truncate">{m === 'FUND' ? '💰 Quỹ Chung' : m}</span>
                                </button>
                              ))}
                            {[...(isFundMode ? ['FUND'] : []), ...members].filter(m => {
                                const searchStr = m === 'FUND' ? 'quy chung' : m.toLowerCase();
                                return searchStr.includes(payerSearchQuery.toLowerCase());
                              }).length === 0 && (
                              <p className="px-2.5 py-3 text-xs text-slate-400 dark:text-slate-500 text-center">Không tìm thấy</p>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                        Số tiền (₫)
                      </label>
                      <input
                        type="text"
                        placeholder="0"
                        value={expAmount}
                        onChange={e => {
                          const formatted = formatVNCurrency(e.target.value);
                          setExpAmount(formatted);
                        }}
                        className="flex h-9 w-full min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-2.5 py-1 text-slate-800 dark:text-slate-200 text-xs transition-colors outline-hidden placeholder:text-slate-400 dark:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white dark:bg-slate-900/50"
                        required
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                      Chi tiêu cho việc gì?
                    </label>
                    <Input
                      placeholder="Vé xe, ăn tối, uống cà phê..."
                      value={expDesc}
                      onChange={e => setExpDesc(e.target.value)}
                      className="h-9 border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 rounded-lg text-slate-800 dark:text-slate-200 text-xs bg-white dark:bg-slate-900/50"
                      required
                    />
                  </div>

                  {/* Category Picker */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">
                      Danh mục
                    </label>
                    <div className="grid grid-cols-6 gap-1.5">
                      {CATEGORY_OPTIONS.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = expCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setExpCategory(cat.id)}
                            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 shadow-sm'
                                : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'
                            }`}
                          >
                            <div className="p-1.5 rounded-full mb-1" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                              <Icon size={14} />
                            </div>
                            <span className={`text-[9px] text-center w-full truncate ${isSelected ? 'font-bold text-slate-800 dark:text-slate-200' : 'font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500'}`}>
                              {cat.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Segmented Control for Split Type */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1.5">
                      Phân chia chi phí
                    </label>
                    <div className="bg-slate-100 dark:bg-slate-900/50 p-0.5 rounded-lg flex text-xs border border-transparent dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setExpSplitType('equal')}
                        className={`flex-1 py-1.5 rounded-md text-center font-semibold transition-all cursor-pointer ${
                          expSplitType === 'equal'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                            : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        Chia đều
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpSplitType('exact')}
                        className={`flex-1 py-1.5 rounded-md text-center font-semibold transition-all cursor-pointer ${
                          expSplitType === 'exact'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                            : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        Chia tự chọn
                      </button>
                    </div>
                  </div>

                  {/* Clickable Checkboxes & Custom Split Inputs (Unified) */}
                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-700 pt-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">
                        Thành viên chịu tiền {expSplitType === 'exact' && '& Số tiền chịu'}
                      </label>
                      <div className="flex items-center gap-2 text-[10px] font-semibold text-emerald-600">
                        <button
                          type="button"
                          onClick={() => setExpParticipants([...members])}
                          className="hover:underline cursor-pointer"
                        >
                          Chọn tất cả
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={() => {
                            setExpParticipants([]);
                            setExpCustomAmounts(prev => {
                              const next = { ...prev };
                              Object.keys(next).forEach(k => {
                                next[k] = '';
                              });
                              return next;
                            });
                          }}
                          className="hover:underline cursor-pointer text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:text-slate-500"
                        >
                          Bỏ chọn tất cả
                        </button>
                      </div>
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto space-y-1.5">
                      {members.map(m => {
                        const isChecked = expParticipants.includes(m);
                        const showAmountInput = expSplitType === 'exact';
                        return (
                          <div
                            key={m}
                            className={`flex items-center justify-between gap-3 py-1.5 px-2 rounded-lg border text-xs transition-all ${
                              isChecked
                                ? 'border-emerald-500 bg-emerald-50/10 text-slate-800 dark:text-slate-200'
                                : 'border-slate-100 dark:border-slate-700 bg-slate-50/40 text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            {/* Checkbox and Name */}
                            <div 
                              className="flex items-center gap-2 cursor-pointer min-w-0 flex-1"
                              onClick={() => handleParticipantToggle(m)}
                            >
                              <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all flex-shrink-0 ${
                                isChecked 
                                  ? 'bg-emerald-500 border-emerald-500 text-white' 
                                  : 'border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-800'
                              }`}>
                                {isChecked && <Check size={10} strokeWidth={3} />}
                              </div>
                              <span className={`font-semibold truncate min-w-0 flex-1 ${isChecked ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                                {m}
                              </span>
                            </div>

                            {/* Amount Input (Only shown and enabled in custom split mode when checked) */}
                            {showAmountInput && (
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <input
                                  type="text"
                                  placeholder="0"
                                  value={isChecked ? (expCustomAmounts[m] || '') : ''}
                                  disabled={!isChecked}
                                  onChange={e => handleCustomAmountChange(m, e.target.value)}
                                  className="h-7.5 w-28 border border-slate-200 dark:border-slate-600 text-xs text-right pr-2 rounded-md bg-white dark:bg-slate-800 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-200 disabled:bg-slate-100 dark:bg-slate-700 disabled:text-slate-300 disabled:border-slate-100 dark:border-slate-700 transition-all font-medium"
                                />
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">₫</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* Fixed Bottom Save Button & Errors Container */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0 space-y-2.5">
                {validationError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs flex items-center gap-2">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full h-10 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors cursor-pointer text-xs"
                >
                  Ghi nhận khoản chi
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* COLUMN 2: Expense History (Feed) */}
        <div className={`w-full lg:w-[34%] flex-col border-r border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden ${mobileTab === 'history' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50">
              Lịch sử chi tiêu
            </h2>
          </div>

          <ScrollArea className="flex-1 min-h-0 bg-slate-50/20 dark:bg-slate-900/50">
            <div className="p-4 space-y-3">
              {expenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Chưa có khoản chi tiêu nào.
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    Điền biểu mẫu bên trái để thêm các khoản chi.
                  </p>
                </div>
              ) : (
                expenses.map(exp => {
                  const cat = CATEGORY_OPTIONS.find(c => c.id === (exp.categoryId || 'other')) || CATEGORY_OPTIONS[5];
                  const Icon = cat.icon;
                  return (
                    <div
                      key={exp.id}
                      className="p-3 bg-white dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-shadow flex items-start gap-3"
                    >
                      <div className="p-2 rounded-full flex-shrink-0" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs leading-snug truncate">
                          {exp.description}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 space-y-0.5">
                          <p>
                            Người trả:{' '}
                            <span className="font-semibold text-slate-600 dark:text-slate-400 dark:text-slate-500">{exp.payer}</span>
                          </p>
                          <p className="truncate">
                            Chia:{' '}
                            <span className="text-slate-600 dark:text-slate-400 dark:text-slate-500">
                              {exp.splitType === 'equal'
                                ? `Đều (${exp.participants.length} người)`
                                : `${exp.participants.join(', ')}`}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className="font-bold text-emerald-600 text-xs whitespace-nowrap">
                          {exp.amount.toLocaleString('vi-VN')} ₫
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                          onClick={() => deleteExpense(exp.id)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* COLUMN 3: Giao diện kết quả (Tabbed Navigation for long content) */}
        <div className={`w-full lg:w-[34%] flex-col bg-white dark:bg-slate-800 overflow-hidden ${mobileTab === 'results' ? 'flex' : 'hidden lg:flex'}`}>
          {/* Section Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50">
              Kết quả chia tiền
            </h2>
          </div>

          {/* Re-arranged: Tabs Selector at the top of results */}
          <div className="px-4 py-2 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
            <div className="bg-slate-100 dark:bg-slate-900/50 p-0.5 rounded-lg flex text-xs border border-transparent dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveResultTab('settle')}
                className={`flex-1 py-1.5 rounded-md text-center font-semibold transition-all cursor-pointer ${
                  activeResultTab === 'settle'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Đề xuất thanh toán
              </button>
              <button
                type="button"
                onClick={() => setActiveResultTab('report')}
                className={`flex-1 py-1.5 rounded-md text-center font-semibold transition-all cursor-pointer ${
                  activeResultTab === 'report'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Số dư & Báo cáo
              </button>
            </div>
          </div>

          {/* Localized Scrollable Content inside selected tab */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 space-y-4">
              
              <div className={activeResultTab === 'settle' ? 'block space-y-4' : 'hidden'}>
                  {isFundMode && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <PiggyBank size={12} className="text-emerald-500" />
                          Tình trạng Quỹ Chung
                        </h3>
                        <span className={`text-xs font-bold ${remainingFund < totalFund * 0.2 ? 'text-rose-500' : 'text-emerald-600'}`}>
                          Dư: {remainingFund.toLocaleString('vi-VN')} ₫
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${remainingFund < totalFund * 0.2 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, Math.max(0, (remainingFund / (totalFund || 1)) * 100))}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          <span>Đã tiêu: {totalFundSpent.toLocaleString('vi-VN')} ₫</span>
                          <span>Tổng quỹ: {totalFund.toLocaleString('vi-VN')} ₫</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 1. Group Stats overview */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 grid grid-cols-3 gap-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                        <Coins size={11} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                        Tổng chi
                      </div>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-slate-50 truncate">
                        {totalSpending.toLocaleString('vi-VN')} ₫
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                        <TrendingUp size={11} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                        T.bình
                      </div>
                      <p className="text-sm font-extrabold text-emerald-600 truncate">
                        {Math.round(averageSpending).toLocaleString('vi-VN')} ₫
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                        <Users size={11} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                        Thành viên
                      </div>
                      <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300 truncate">
                        {members.length} người
                      </p>
                    </div>
                  </div>

                  {/* 2. Fund Settlements */}
                  {isFundMode && (!useFundToOffset || remainingFund <= 0) && members.some(m => Math.abs(fundBalances[m]) >= 1) && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 space-y-4">
                      {/* Cần thu thêm */}
                      {members.filter(m => fundBalances[m] <= -1).length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                            Cần thu thêm vào Quỹ
                          </h3>
                          <div className="space-y-2">
                            {members.filter(m => fundBalances[m] <= -1).map(m => (
                              <div key={m} className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg flex items-center justify-between text-xs border border-rose-100 dark:border-rose-500/20">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{m}</span>
                                <span className="font-extrabold text-rose-600 dark:text-rose-400">{Math.abs(fundBalances[m]).toLocaleString('vi-VN')} ₫</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Hoàn trả từ quỹ */}
                      {members.filter(m => fundBalances[m] >= 1).length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                            Quỹ hoàn trả lại
                          </h3>
                          <div className="space-y-2">
                            {members.filter(m => fundBalances[m] >= 1).map(m => (
                              <div key={m} className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg flex items-center justify-between text-xs border border-emerald-100 dark:border-emerald-500/20">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{m}</span>
                                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{Math.abs(fundBalances[m]).toLocaleString('vi-VN')} ₫</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 3. Personal Repayments / Redesigned Settle list for long text */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {isFundMode && useFundToOffset && remainingFund > 0 ? 'Đề xuất thanh toán tổng hợp' : 'Nợ cá nhân chéo'}
                      </h3>
                      {isFundMode && remainingFund > 0 && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Dùng quỹ cấn nợ</span>
                          <button 
                            type="button"
                            onClick={() => setUseFundToOffset(!useFundToOffset)}
                            className={`w-7 h-4 flex items-center rounded-full transition-colors px-0.5 flex-shrink-0 ${useFundToOffset ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                          >
                            <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${useFundToOffset ? 'translate-x-3' : 'translate-x-0'}`} />
                          </button>
                        </label>
                      )}
                    </div>

                    {simplifiedDebts.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 py-2 text-center">
                        🎉 Tuyệt vời! Tất cả chi phí đã cân bằng.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {simplifiedDebts.map((debt, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex items-center justify-between gap-3 text-xs border border-slate-100 dark:border-slate-600 hover:border-slate-200 dark:hover:border-slate-500 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              {/* Payer & Receiver wrap nicely */}
                              <div className="text-[11px] text-slate-600 dark:text-slate-400 dark:text-slate-500 flex items-center gap-1 flex-wrap font-semibold">
                                <span className="font-bold text-slate-800 dark:text-slate-200 break-all">{debt.from === 'FUND' ? '💰 Quỹ Chung' : debt.from}</span>
                                <ArrowRight size={11} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                                <span className="font-bold text-slate-800 dark:text-slate-200 break-all">{debt.to === 'FUND' ? '💰 Quỹ Chung' : debt.to}</span>
                              </div>
                              {/* Amount display */}
                              <div className="font-extrabold text-slate-900 dark:text-slate-50 text-sm mt-1">
                                {debt.amount.toLocaleString('vi-VN')} ₫
                              </div>
                            </div>

                            {/* VietQR Trigger Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7.5 border-emerald-500/30 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 font-semibold rounded-md text-[10px] flex items-center gap-1 cursor-pointer flex-shrink-0"
                              onClick={() => {
                                setActiveSettlement(debt);
                                setTempBankId(bankInfo.bankId || 'vietcombank');
                                setTempAccNo(bankInfo.accountNo || '');
                                setTempAccName(bankInfo.accountName || '');
                              }}
                            >
                              <QrCode size={11} />
                              VietQR
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
              </div>
              <div className={activeResultTab === 'report' ? 'block space-y-4' : 'hidden'}>
                  {/* Category Donut Chart */}
                  {expensesByCategory.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 space-y-3">
                      <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Phân bổ chi tiêu
                      </h3>
                      <div className="h-48 w-full -ml-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={expensesByCategory}
                              dataKey="total"
                              nameKey="label"
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={80}
                              paddingAngle={3}
                              labelLine={false}
                              label={({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) => {
                                const RADIAN = Math.PI / 180;
                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                const percent = Math.round((value / totalSpending) * 100);
                                if (percent < 5) return null;
                                return (
                                  <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
                                    {`${percent}%`}
                                  </text>
                                );
                              }}
                            >
                              {expensesByCategory.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: any) => [`${Number(value).toLocaleString('vi-VN')} ₫`, 'Tổng']}
                              contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.1)' }}
                              itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-700">
                        {expensesByCategory.map(cat => {
                          const percent = Math.round((cat.total / totalSpending) * 100);
                          return (
                            <div key={cat.id} className="flex items-center gap-2 text-[11px]">
                              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                              <span className="text-slate-600 dark:text-slate-400 dark:text-slate-500 truncate flex-1">{cat.label}</span>
                              <span className="font-bold text-slate-900 dark:text-slate-50">{percent}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 1. Member balances list (Balances) */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 space-y-3">
                    <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Bảng số dư nợ/thu về
                    </h3>

                    {members.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 py-1 text-center">Chưa có thông tin thành viên.</p>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {members.map(m => {
                          const bal = balances[m] || 0;
                          const isPositive = bal > 0;
                          const isNegative = bal < 0;
                          return (
                            <div
                              key={m}
                              className="py-2.5 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {m}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-bold ${
                                    isPositive
                                      ? 'text-emerald-600'
                                      : isNegative
                                      ? 'text-rose-500'
                                      : 'text-slate-400 dark:text-slate-500'
                                  }`}
                                >
                                  {isPositive ? '+' : ''}
                                  {bal.toLocaleString('vi-VN')} ₫
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 2. Detailed individual spending report (Paid detailed) */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 space-y-3">
                    <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Chi tiết số tiền đã chi
                    </h3>

                    {members.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 py-1 text-center">Chưa có thông tin.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {members.map(m => {
                          const paid = totalPaidByMember[m] || 0;
                          return (
                            <div key={m} className="flex items-center justify-between text-xs">
                              <span className="text-slate-600 dark:text-slate-400 dark:text-slate-500 font-medium">{m}</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {paid.toLocaleString('vi-VN')} ₫
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
              </div>

            </div>
          </ScrollArea>
        </div>
      </main>

      {/* VietQR Settlement Dialog */}
      <Dialog 
        open={activeSettlement !== null} 
        onOpenChange={(open) => !open && setActiveSettlement(null)}
      >
        <DialogContent className="max-w-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-lg rounded-xl p-6 flex flex-col items-center">
          <DialogHeader className="w-full text-center">
            <DialogTitle className="text-md font-bold text-slate-900 dark:text-slate-50">
              Quét mã chuyển khoản
            </DialogTitle>
          </DialogHeader>

          {activeSettlement && (
            <div className="w-full space-y-4 pt-2 flex flex-col items-center">
              <div className="w-full space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                      Ngân hàng
                    </label>
                    <select
                      value={tempBankId}
                      onChange={e => setTempBankId(e.target.value)}
                      className="w-full h-8 px-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-200 text-[11px]"
                    >
                      {POPULAR_BANKS.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                      Số tài khoản
                    </label>
                    <Input
                      placeholder="Số tài khoản..."
                      value={tempAccNo}
                      onChange={e => setTempAccNo(e.target.value)}
                      className="h-8 border-slate-200 dark:border-slate-600 text-[11px] rounded-md"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                    Tên chủ tài khoản
                  </label>
                  <Input
                    placeholder="Tên chủ tài khoản (viết không dấu)..."
                    value={tempAccName}
                    onChange={e => setTempAccName(e.target.value)}
                    className="h-8 border-slate-200 dark:border-slate-600 text-[11px] rounded-md uppercase"
                  />
                </div>
              </div>

              {/* QR Image Frame */}
              <div className="w-52 h-52 border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 rounded-xl flex items-center justify-center overflow-hidden shadow-inner p-2 relative">
                {tempAccNo ? (
                  <img
                    src={qrUrl}
                    alt="VietQR code"
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-center p-3 text-[10px] text-slate-400 dark:text-slate-500">
                    <p className="font-semibold mb-1">Thiếu thông tin</p>
                    Vui lòng điền Số tài khoản để hiển thị mã QR.
                  </div>
                )}
              </div>

              {/* Text guidance */}
              <div className="text-center space-y-1">
                <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{activeSettlement.from}</span> chuyển cho{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{activeSettlement.to}</span>
                </p>
                <p className="text-sm font-bold text-emerald-600">
                  {activeSettlement.amount.toLocaleString('vi-VN')} ₫
                </p>
              </div>

              {/* Confirm settlement action */}
              <div className="w-full flex flex-col gap-2 pt-4 border-t border-slate-100 dark:border-slate-700 mt-2">
                <Button
                  variant="outline"
                  onClick={() => setActiveSettlement(null)}
                  className="w-full h-9 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer rounded-lg text-xs font-semibold"
                >
                  Đóng
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Share Results Drawer */}
      <Sheet
        open={shareDialogOpen}
        onOpenChange={(open) => !open && setShareDialogOpen(false)}
      >
        <SheetContent 
          side="right" 
          className="bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-700 shadow-xl p-0 flex flex-col"
          style={{ maxWidth: '800px', width: '95vw' }}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-0 flex-shrink-0 bg-white dark:bg-slate-900">
            <SheetHeader>
              <SheetTitle className="text-base font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <Share2 size={16} className="text-emerald-500" />
                Chia sẻ kết quả
              </SheetTitle>
            </SheetHeader>
          </div>

          {/* Share Card — captured as image */}
          <div className="px-5 py-4 overflow-auto flex-1 min-h-0 bg-slate-50/50 dark:bg-slate-900">
            <div
              id="share-card"
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col min-w-[500px] overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row flex-1">
                {/* Left Column: Summary & Balances */}
                <div className="flex-1 border-b sm:border-b-0 sm:border-r border-slate-100 dark:border-slate-700 flex flex-col">
                  {/* Gradient Header */}
                  <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 px-5 py-5 text-white">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet size={16} />
                      <span className="text-[10px] font-semibold uppercase tracking-widest opacity-80">BillMate</span>
                    </div>
                    <h3 className="text-lg font-extrabold tracking-tight leading-tight">
                      {groupName}
                    </h3>
                    <p className="text-[11px] text-emerald-100 mt-1">
                      {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <div className="px-4 py-3 text-center">
                      <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Tổng chi</p>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-slate-50 mt-0.5">{totalSpending.toLocaleString('vi-VN')} ₫</p>
                    </div>
                    <div className="px-4 py-3 text-center">
                      <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">TB/người</p>
                      <p className="text-sm font-extrabold text-emerald-600 mt-0.5">{Math.round(averageSpending).toLocaleString('vi-VN')} ₫</p>
                    </div>
                    <div className="px-4 py-3 text-center">
                      <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Thành viên</p>
                      <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300 mt-0.5">{members.length}</p>
                    </div>
                  </div>

                  {/* Balances */}
                  <div className="px-4 py-3 space-y-1.5 border-b sm:border-b-0 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex-1">
                    <h4 className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Số dư từng người</h4>
                    {members.map(m => {
                      const bal = balances[m] || 0;
                      const paid = totalPaidByMember[m] || 0;
                      return (
                        <div key={m} className="flex items-center justify-between text-xs py-1">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{m}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">chi {paid.toLocaleString('vi-VN')} ₫</span>
                          </div>
                          <span className={`font-bold flex-shrink-0 ${
                            bal > 0 ? 'text-emerald-600' : bal < 0 ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'
                          }`}>
                            {bal > 0 ? '+' : ''}{bal.toLocaleString('vi-VN')} ₫
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column: Chart & Settlements */}
                <div className="flex-1 flex flex-col bg-white dark:bg-slate-800">
                  {/* Donut Chart */}
                  {expensesByCategory.length > 0 && (
                    <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-700">
                      <h4 className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Phân bổ chi tiêu</h4>
                      <div className="h-48 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={expensesByCategory}
                              dataKey="total"
                              nameKey="label"
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={65}
                              paddingAngle={3}
                            >
                              {expensesByCategory.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mt-3">
                        {expensesByCategory.map(cat => {
                          const percent = Math.round((cat.total / totalSpending) * 100);
                          return (
                            <div key={cat.id} className="flex items-center gap-1.5 text-[10px]">
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                              <span className="text-slate-600 dark:text-slate-400 dark:text-slate-500 truncate flex-1">{cat.label}</span>
                              <span className="font-bold text-slate-900 dark:text-slate-50">{percent}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Settlements */}
                  <div className="px-4 py-4 flex-1">
                    <h4 className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Thanh toán</h4>
                    {simplifiedDebts.length === 0 ? (
                      <p className="text-xs text-emerald-600 font-semibold py-1">🎉 Đã cân bằng!</p>
                    ) : (
                      <div className="space-y-1.5">
                        {simplifiedDebts.map((d, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs py-1 px-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg">
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 dark:text-slate-500 font-medium min-w-0 flex-1">
                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{d.from}</span>
                              <ArrowRight size={10} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{d.to}</span>
                            </div>
                            <span className="font-extrabold text-slate-900 dark:text-slate-50 flex-shrink-0 ml-2">
                              {d.amount.toLocaleString('vi-VN')} ₫
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2 text-center border-t border-slate-100 dark:border-slate-700">
                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">BillMate — Chi tiêu rõ ràng, tình bạn bền lâu ✨</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-5 pb-5 pt-1 flex items-center gap-2 flex-shrink-0 border-t border-slate-100 dark:border-slate-700">
            <Button
              variant="outline"
              className="flex-1 h-10 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 cursor-pointer rounded-lg text-xs font-semibold"
              onClick={handleCopyShareText}
            >
              {copiedShareText ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {copiedShareText ? 'Đã copy!' : 'Copy văn bản'}
            </Button>
            <Button
              className="flex-1 h-10 bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 cursor-pointer rounded-lg text-xs font-semibold shadow-sm"
              onClick={handleShareAsImage}
            >
              <Download size={14} />
              Tải ảnh
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex items-center justify-around z-50 px-2 pb-safe shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <button 
          onClick={() => setMobileTab('input')} 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${mobileTab === 'input' ? 'text-emerald-600' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:text-slate-500'}`}
        >
          <PenSquare size={20} className={mobileTab === 'input' ? 'fill-emerald-50' : ''} />
          <span className="text-[10px] font-bold">Nhập liệu</span>
        </button>
        <button 
          onClick={() => setMobileTab('history')} 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${mobileTab === 'history' ? 'text-emerald-600' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:text-slate-500'}`}
        >
          <List size={20} className={mobileTab === 'history' ? 'fill-emerald-50' : ''} />
          <span className="text-[10px] font-bold">Lịch sử</span>
        </button>
        <button 
          onClick={() => setMobileTab('results')} 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${mobileTab === 'results' ? 'text-emerald-600' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:text-slate-500'}`}
        >
          <PieChartIcon size={20} className={mobileTab === 'results' ? 'fill-emerald-50' : ''} />
          <span className="text-[10px] font-bold">Kết quả</span>
        </button>
      </div>
    </div>
  );
}
