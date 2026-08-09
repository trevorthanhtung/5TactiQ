import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { capacitorStorage } from '../utils/capacitorStorage';
import type { FundTransaction } from '../types';

interface FundState {
  transactions: FundTransaction[];
  addTransaction: (transaction: Omit<FundTransaction, 'id'>) => void;
  updateTransaction: (id: string, updates: Partial<FundTransaction>) => void;
  deleteTransaction: (id: string) => void;
}

export const useFundStore = create<FundState>()(
  persist(
    (set) => ({
      transactions: [],
      addTransaction: (transaction) => set((state) => ({
        transactions: [{ ...transaction, id: Date.now().toString() }, ...state.transactions].sort((a, b) => b.date.localeCompare(a.date))
      })),
      updateTransaction: (id, updates) => set((state) => {
        const newTx = state.transactions.map(t => t.id === id ? { ...t, ...updates } : t);
        return { transactions: newTx.sort((a, b) => b.date.localeCompare(a.date)) };
      }),
      deleteTransaction: (id) => set((state) => ({
        transactions: state.transactions.filter(t => t.id !== id)
      }))
    }),
    {
      name: 'katfc-fund-storage',
      storage: createJSONStorage(() => capacitorStorage),
    }
  )
);
