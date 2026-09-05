import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { capacitorStorage } from '../utils/capacitorStorage';
import type { FundTransaction, FineRecord } from '../types';

interface FundState {
  transactions: FundTransaction[];
  fines: FineRecord[];
  addTransaction: (transaction: Omit<FundTransaction, 'id'>) => void;
  updateTransaction: (id: string, updates: Partial<FundTransaction>) => void;
  deleteTransaction: (id: string) => void;
  
  // Fines
  addFine: (fine: Omit<FineRecord, 'id'>) => void;
  updateFine: (id: string, updates: Partial<FineRecord>) => void;
  deleteFine: (id: string) => void;
  payFine: (id: string) => void;
  unpayFine: (id: string) => void;
}

export const useFundStore = create<FundState>()(
  persist(
    (set, get) => ({
      transactions: [],
      fines: [],
      addTransaction: (transaction) => set((state) => ({
        transactions: [{ ...transaction, id: Date.now().toString() }, ...state.transactions].sort((a, b) => b.date.localeCompare(a.date))
      })),
      updateTransaction: (id, updates) => set((state) => {
        const newTx = state.transactions.map(t => t.id === id ? { ...t, ...updates } : t);
        return { transactions: newTx.sort((a, b) => b.date.localeCompare(a.date)) };
      }),
      deleteTransaction: (id) => set((state) => ({
        transactions: state.transactions.filter(t => t.id !== id)
      })),

      addFine: (fine) => set((state) => ({
        fines: [{ ...fine, id: 'fine_' + Date.now().toString() }, ...(state.fines || [])].sort((a, b) => b.date.localeCompare(a.date))
      })),
      updateFine: (id, updates) => set((state) => {
        const fine = (state.fines || []).find(f => f.id === id);
        let updatedTx = state.transactions;
        if (fine?.status === 'paid' && fine.transactionId) {
          updatedTx = state.transactions.map(t => {
            if (t.id === fine.transactionId) {
              return {
                ...t,
                ...(updates.amount !== undefined ? { amount: updates.amount } : {}),
                ...(updates.playerId !== undefined ? { playerId: updates.playerId } : {}),
                ...(updates.reason !== undefined ? { note: `Nộp phạt: ${updates.reason}` } : {})
              };
            }
            return t;
          });
        }
        return {
          transactions: updatedTx,
          fines: (state.fines || []).map(f => f.id === id ? { ...f, ...updates } : f)
        };
      }),
      deleteFine: (id) => set((state) => {
        const fine = (state.fines || []).find(f => f.id === id);
        let updatedTx = state.transactions;
        if (fine?.status === 'paid') {
          if (fine.transactionId) {
            updatedTx = state.transactions.filter(t => t.id !== fine.transactionId);
          } else {
            const matchIndex = state.transactions.findIndex(t => 
              t.type === 'Thu' && 
              t.category === 'Tiền phạt' && 
              t.amount === fine.amount && 
              t.playerId === fine.playerId
            );
            if (matchIndex !== -1) {
              updatedTx = state.transactions.filter((_, idx) => idx !== matchIndex);
            }
          }
        }
        return {
          transactions: updatedTx,
          fines: (state.fines || []).filter(f => f.id !== id)
        };
      }),
      payFine: (id) => {
        const fine = (get().fines || []).find(f => f.id === id);
        if (!fine) return;
        
        const now = new Date().toISOString();
        const dateStr = now.split('T')[0];
        const txId = 'tx_fine_' + Date.now().toString();

        // 1. Mark fine as paid and save transactionId
        set((state) => ({
          fines: (state.fines || []).map(f => f.id === id ? { ...f, status: 'paid', paidAt: now, transactionId: txId } : f),
          // 2. Automatically record a Thu transaction in Fund
          transactions: [{
            id: txId,
            date: dateStr,
            type: 'Thu' as const,
            category: 'Tiền phạt',
            amount: fine.amount,
            playerId: fine.playerId,
            note: `Nộp phạt: ${fine.reason}`
          }, ...state.transactions].sort((a, b) => b.date.localeCompare(a.date))
        }));
      },
      unpayFine: (id) => {
        const fine = (get().fines || []).find(f => f.id === id);
        if (!fine) return;

        set((state) => {
          let updatedTx = state.transactions;
          if (fine.transactionId) {
            updatedTx = state.transactions.filter(t => t.id !== fine.transactionId);
          } else {
            // Fallback for legacy paid fines without transactionId: remove matching 'Tiền phạt' transaction
            const matchIndex = state.transactions.findIndex(t => 
              t.type === 'Thu' && 
              t.category === 'Tiền phạt' && 
              t.amount === fine.amount && 
              t.playerId === fine.playerId
            );
            if (matchIndex !== -1) {
              updatedTx = state.transactions.filter((_, idx) => idx !== matchIndex);
            }
          }

          return {
            transactions: updatedTx,
            fines: (state.fines || []).map(f => f.id === id ? {
              ...f,
              status: 'unpaid',
              paidAt: undefined,
              transactionId: undefined
            } : f)
          };
        });
      }
    }),
    {
      name: 'katfc-fund-storage',
      storage: createJSONStorage(() => capacitorStorage),
    }
  )
);

