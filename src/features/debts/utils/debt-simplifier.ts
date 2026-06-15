export interface Expense {
  id: string;
  description: string;
  amount: number;
  payer: string;
  participants: string[];
  splitType: 'equal' | 'exact';
  customAmounts?: Record<string, number>; // maps member name to amount they owe
  createdAt: number;
}

export interface Transaction {
  from: string;
  to: string;
  amount: number;
}

/**
 * Calculates net balances for all members based on expenses.
 * Positive balance: person should receive this amount.
 * Negative balance: person owes this amount.
 */
export function calculateBalances(expenses: Expense[], members: string[]): Record<string, number> {
  const balances: Record<string, number> = {};
  for (const m of members) {
    balances[m] = 0;
  }

  for (const exp of expenses) {
    const { amount, payer, participants, splitType, customAmounts } = exp;

    // Add paid amount to the payer's balance
    if (balances[payer] === undefined) {
      balances[payer] = 0;
    }
    balances[payer] += amount;

    // Subtract owed amounts from participants
    if (splitType === 'equal') {
      const share = amount / (participants.length || 1);
      for (const p of participants) {
        if (balances[p] === undefined) {
          balances[p] = 0;
        }
        balances[p] -= share;
      }
    } else if (splitType === 'exact') {
      if (customAmounts) {
        for (const p of participants) {
          const owed = customAmounts[p] || 0;
          if (balances[p] === undefined) {
            balances[p] = 0;
          }
          balances[p] -= owed;
        }
      } else {
        // Fallback to equal split if customAmounts is missing
        const share = amount / (participants.length || 1);
        for (const p of participants) {
          if (balances[p] === undefined) {
            balances[p] = 0;
          }
          balances[p] -= share;
        }
      }
    }
  }

  // Round balances to avoid floating point precision issues
  for (const key of Object.keys(balances)) {
    balances[key] = Math.round(balances[key]);
  }

  return balances;
}

/**
 * Simplifies debts to minimize the number of transactions required to settle up.
 * Uses a greedy approach matching the largest debtor with the largest creditor.
 */
export function simplifyDebts(balances: Record<string, number>): Transaction[] {
  // Convert balances to list and filter out negligible balances
  const activeBalances = Object.entries(balances)
    .map(([name, bal]) => ({ name, bal }))
    .filter(item => Math.abs(item.bal) > 1); // Ignore values less than 1 VND

  const debtors = activeBalances.filter(item => item.bal < 0).sort((a, b) => a.bal - b.bal); // most negative first
  const creditors = activeBalances.filter(item => item.bal > 0).sort((a, b) => b.bal - a.bal); // most positive first

  const transactions: Transaction[] = [];

  let dIndex = 0;
  let cIndex = 0;

  while (dIndex < debtors.length && cIndex < creditors.length) {
    const debtor = debtors[dIndex];
    const creditor = creditors[cIndex];

    const oweAmount = -debtor.bal;
    const creditAmount = creditor.bal;

    const settledAmount = Math.min(oweAmount, creditAmount);

    if (settledAmount >= 1) {
      transactions.push({
        from: debtor.name,
        to: creditor.name,
        amount: Math.round(settledAmount),
      });
    }

    debtor.bal += settledAmount;
    creditor.bal -= settledAmount;

    if (Math.abs(debtor.bal) < 1) {
      dIndex++;
    }
    if (Math.abs(creditor.bal) < 1) {
      cIndex++;
    }
  }

  return transactions;
}
