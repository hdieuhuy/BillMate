import re

with open('/Users/huy.huynh.dieu/Desktop/antigravity/BillMate/src/app/[groupId]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update calculation logic
calc_old = """  // Derived financial computations
  const balances = calculateBalances(expenses, members);
  const simplifiedDebts = simplifyDebts(balances);"""

calc_new = """  // Separate expenses
  const personalExpenses = expenses.filter(exp => exp.payer !== 'FUND');
  const fundExpenses = expenses.filter(exp => exp.payer === 'FUND');

  // Derived financial computations for Personal
  const personalBalances = calculateBalances(personalExpenses, members);
  const simplifiedDebts = simplifyDebts(personalBalances);

  // Fund computations
  const totalFund = isFundMode ? members.length * fundAmount : 0;
  const totalFundSpent = fundExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remainingFund = totalFund - totalFundSpent;
  
  // Calculate how much each member consumed from the fund
  const fundConsumption: Record<string, number> = {};
  members.forEach(m => fundConsumption[m] = 0);
  
  fundExpenses.forEach(exp => {
    if (exp.splitType === 'equal') {
      const share = exp.amount / (exp.participants.length || 1);
      exp.participants.forEach(p => {
        if (fundConsumption[p] !== undefined) fundConsumption[p] += share;
      });
    } else if (exp.splitType === 'exact') {
      if (exp.customAmounts) {
        exp.participants.forEach(p => {
          if (fundConsumption[p] !== undefined) fundConsumption[p] += exp.customAmounts![p] || 0;
        });
      } else {
        const share = exp.amount / (exp.participants.length || 1);
        exp.participants.forEach(p => {
          if (fundConsumption[p] !== undefined) fundConsumption[p] += share;
        });
      }
    }
  });

  const fundBalances: Record<string, number> = {}; // > 0 means Fund owes member, < 0 means member owes Fund
  members.forEach(m => {
    fundBalances[m] = (isFundMode ? fundAmount : 0) - fundConsumption[m];
  });"""

content = content.replace(calc_old, calc_new)

# 2. Add Fund Status Card in the Result Settle Tab
overview_section = """                  {/* 1. Group Stats overview */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 grid grid-cols-3 gap-2.5">"""

fund_status_card = """                  {isFundMode && (
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

"""
content = content.replace(overview_section, fund_status_card + overview_section)


# 3. Add Fund Collections and Refunds in the Settle Tab
repayments_section = """                  {/* 2. Repayments / Redesigned Settle list for long text */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 space-y-3">
                    <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Các giao dịch cần thực hiện
                    </h3>"""

fund_settlements = """                  {/* 2. Fund Settlements */}
                  {isFundMode && members.some(m => Math.abs(fundBalances[m]) >= 1) && (
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
                  
"""
content = content.replace(repayments_section, fund_settlements + repayments_section.replace("2. Repayments", "3. Personal Repayments").replace("Các giao dịch cần thực hiện", "Nợ cá nhân chéo"))

with open('/Users/huy.huynh.dieu/Desktop/antigravity/BillMate/src/app/[groupId]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
