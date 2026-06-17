import { create } from 'zustand';
import { Expense } from '@/features/debts/utils/debt-simplifier';

export interface BankInfo {
  bankId: string;
  accountNo: string;
  accountName: string;
}

export interface GroupState {
  groupId: string;
  groupName: string;
  members: string[];
  expenses: Expense[];
  bankInfo: BankInfo;
  isFundMode: boolean;
  fundAmount: number;
}

interface GroupStoreActions {
  initGroup: (name: string, members: string[]) => void;
  loadGroup: (state: GroupState) => void;
  addMember: (name: string) => void;
  removeMember: (name: string) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => void;
  updateBankInfo: (bankInfo: Partial<BankInfo>) => void;
  setFundMode: (enabled: boolean) => void;
  setFundAmount: (amount: number) => void;
  resetGroup: () => void;
}

export type GroupStore = GroupState & GroupStoreActions;

const DEFAULT_STATE: GroupState = {
  groupId: '',
  groupName: '',
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

// UTF-8 safe base64 serialization
export function serializeState(state: GroupState): string {
  try {
    const data = {
      groupId: state.groupId,
      groupName: state.groupName,
      members: state.members,
      expenses: state.expenses,
      bankInfo: state.bankInfo,
      isFundMode: state.isFundMode,
      fundAmount: state.fundAmount,
    };
    const jsonStr = JSON.stringify(data);
    const utf8Str = encodeURIComponent(jsonStr);
    return btoa(utf8Str);
  } catch (e) {
    console.error('Failed to serialize state:', e);
    return '';
  }
}

// UTF-8 safe base64 deserialization
export function deserializeState(hash: string): GroupState | null {
  try {
    const utf8Str = atob(hash);
    const jsonStr = decodeURIComponent(utf8Str);
    return JSON.parse(jsonStr) as GroupState;
  } catch (e) {
    console.error('Failed to deserialize state:', e);
    return null;
  }
}

/**
 * Zustand store to manage active group state and sync with URL Hash & LocalStorage
 */
export const useGroupStore = create<GroupStore>((set, get) => ({
  ...DEFAULT_STATE,

  initGroup: (name, members) => {
    const cleanMembers = Array.from(new Set(members.map(m => m.trim()).filter(Boolean)));
    const groupId = 'group_' + Math.random().toString(36).substring(2, 11);
    const newState: GroupState = {
      groupId,
      groupName: name.trim(),
      members: cleanMembers,
      expenses: [],
      bankInfo: { bankId: '', accountNo: '', accountName: '' },
    };

    set(newState);
    saveAndSync(newState);
  },

  loadGroup: (state) => {
    set(state);
    saveAndSync(state);
  },

  addMember: (name) => {
    const cleanName = name.trim();
    if (!cleanName || get().members.includes(cleanName)) return;

    const updatedMembers = [...get().members, cleanName];
    set({ members: updatedMembers });
    saveAndSync({ ...get(), members: updatedMembers });
  },

  removeMember: (name) => {
    const updatedMembers = get().members.filter(m => m !== name);
    // Also remove user from expenses where they might be the payer or participant
    const updatedExpenses = get().expenses.map(exp => {
      let payer = exp.payer;
      if (payer === name) {
        // assign first member or leave as is (will need correction)
        payer = updatedMembers[0] || '';
      }
      const participants = exp.participants.filter(p => p !== name);
      return { ...exp, payer, participants };
    });

    set({ members: updatedMembers, expenses: updatedExpenses });
    saveAndSync({ ...get(), members: updatedMembers, expenses: updatedExpenses });
  },

  addExpense: (expenseData) => {
    const newExpense: Expense = {
      ...expenseData,
      id: 'exp_' + Math.random().toString(36).substring(2, 11),
      createdAt: Date.now(),
    };

    const updatedExpenses = [newExpense, ...get().expenses];
    set({ expenses: updatedExpenses });
    saveAndSync({ ...get(), expenses: updatedExpenses });
  },

  deleteExpense: (id) => {
    const updatedExpenses = get().expenses.filter(exp => exp.id !== id);
    set({ expenses: updatedExpenses });
    saveAndSync({ ...get(), expenses: updatedExpenses });
  },

  updateBankInfo: (info) => {
    const updatedBank = { ...get().bankInfo, ...info };
    set({ bankInfo: updatedBank });
    saveAndSync({ ...get(), bankInfo: updatedBank });
  },

  setFundMode: (enabled) => {
    set({ isFundMode: enabled });
    saveAndSync({ ...get(), isFundMode: enabled });
  },

  setFundAmount: (amount) => {
    set({ fundAmount: amount });
    saveAndSync({ ...get(), fundAmount: amount });
  },

  resetGroup: () => {
    set(DEFAULT_STATE);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('billmate_group');
      window.location.hash = '';
    }
  },
}));

function saveAndSync(state: GroupState) {
  if (typeof window === 'undefined') return;

  // Save to localStorage
  localStorage.setItem('billmate_group', JSON.stringify(state));

  // Sync to URL Hash (Base64)
  const serialized = serializeState(state);
  if (serialized) {
    // We update hash without reloading
    window.history.replaceState(null, '', `#state=${serialized}`);
  }
}
