import { describe, it, expect } from 'vitest';
import { calculateBalances, simplifyDebts, Expense } from './debt-simplifier';

describe('debt-simplifier', () => {
  describe('calculateBalances', () => {
    it('should calculate correct balances for equal splits', () => {
      const members = ['An', 'Bình', 'Chi'];
      const expenses: Expense[] = [
        {
          id: '1',
          description: 'Ăn trưa',
          amount: 90000,
          payer: 'An',
          participants: ['An', 'Bình', 'Chi'],
          splitType: 'equal',
          createdAt: Date.now(),
        },
      ];

      const balances = calculateBalances(expenses, members);
      expect(balances['An']).toBe(60000); // 90000 - 30000
      expect(balances['Bình']).toBe(-30000);
      expect(balances['Chi']).toBe(-30000);
    });

    it('should calculate correct balances for exact custom splits', () => {
      const members = ['An', 'Bình', 'Chi'];
      const expenses: Expense[] = [
        {
          id: '1',
          description: 'Mua đồ',
          amount: 100000,
          payer: 'An',
          participants: ['An', 'Bình'],
          splitType: 'exact',
          customAmounts: {
            An: 40000,
            Bình: 60000,
          },
          createdAt: Date.now(),
        },
      ];

      const balances = calculateBalances(expenses, members);
      expect(balances['An']).toBe(60000); // 100000 - 40000
      expect(balances['Bình']).toBe(-60000);
      expect(balances['Chi']).toBe(0);
    });
  });

  describe('simplifyDebts', () => {
    it('should simplify simple linear debts', () => {
      // An owes Bình 30k, Bình owes Chi 30k
      // Net: An owes Chi 30k, Bình is 0
      const balances = {
        An: -30000,
        Bình: 0,
        Chi: 30000,
      };

      const transactions = simplifyDebts(balances);
      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toEqual({
        from: 'An',
        to: 'Chi',
        amount: 30000,
      });
    });

    it('should simplify complex cross debts', () => {
      // An owes Chi 50k, Bình owes Chi 100k, Chi owes An 20k, etc.
      // Net balances:
      // An: -30000 (owes 30k)
      // Bình: -70000 (owes 70k)
      // Chi: 100000 (gets 100k)
      const balances = {
        An: -30000,
        Bình: -70000,
        Chi: 100000,
      };

      const transactions = simplifyDebts(balances);
      expect(transactions).toHaveLength(2);
      
      const txAn = transactions.find(t => t.from === 'An');
      const txBình = transactions.find(t => t.from === 'Bình');

      expect(txAn).toEqual({ from: 'An', to: 'Chi', amount: 30000 });
      expect(txBình).toEqual({ from: 'Bình', to: 'Chi', amount: 70000 });
    });
  });
});
