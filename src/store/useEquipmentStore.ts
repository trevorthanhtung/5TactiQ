import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { capacitorStorage } from '../utils/capacitorStorage';
import type { EquipmentItem, JerseyAssignment } from '../types';

interface EquipmentState {
  items: EquipmentItem[];
  jerseys: JerseyAssignment[];

  // Items
  addItem: (item: Omit<EquipmentItem, 'id'>) => void;
  updateItem: (id: string, updates: Partial<EquipmentItem>) => void;
  deleteItem: (id: string) => void;
  assignItem: (id: string, playerId: string | null, notes?: string) => void;

  // Jerseys
  setJersey: (jerseyNumber: number, data: Partial<JerseyAssignment>) => void;
  unassignJersey: (jerseyNumber: number) => void;
}

// Purge dummy mock items from local storage if present
if (typeof window !== 'undefined') {
  try {
    const raw = window.localStorage.getItem('katfc-equipment-storage');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.items) {
        const dummyIds = ['item_1', 'item_2', 'item_3', 'item_4', 'item_5'];
        const filtered = parsed.state.items.filter((i: any) => !dummyIds.includes(i.id));
        if (filtered.length !== parsed.state.items.length) {
          parsed.state.items = filtered;
          window.localStorage.setItem('katfc-equipment-storage', JSON.stringify(parsed));
        }
      }
    }
  } catch {
    // Ignore storage parse errors
  }
}

export const useEquipmentStore = create<EquipmentState>()(
  persist(
    (set) => ({
      items: [],
      jerseys: [],

      addItem: (item) => set((state) => ({
        items: [{ ...item, id: 'eq_' + Date.now().toString() }, ...(state.items || [])],
      })),

      updateItem: (id, updates) => set((state) => ({
        items: (state.items || []).map((i) => (i.id === id ? { ...i, ...updates } : i)),
      })),

      deleteItem: (id) => set((state) => ({
        items: (state.items || []).filter((i) => i.id !== id),
      })),

      assignItem: (id, playerId, notes) => set((state) => ({
        items: (state.items || []).map((i) => {
          if (i.id !== id) return i;
          return {
            ...i,
            assignedPlayerId: playerId,
            assignedDate: playerId ? new Date().toISOString().split('T')[0] : undefined,
            notes: notes !== undefined ? notes : i.notes,
          };
        }),
      })),

      setJersey: (jerseyNumber, data) => set((state) => {
        const existing = (state.jerseys || []).find((j) => j.jerseyNumber === jerseyNumber);
        if (existing) {
          return {
            jerseys: state.jerseys.map((j) =>
              j.jerseyNumber === jerseyNumber ? { ...j, ...data } : j
            ),
          };
        }
        const newJersey: JerseyAssignment = {
          id: 'jersey_' + jerseyNumber,
          jerseyNumber,
          playerId: data.playerId || null,
          size: data.size || 'L',
          status: data.playerId ? 'assigned' : 'available',
          kitType: data.kitType || 'home',
          notes: data.notes || '',
          ...data,
        };
        return { jerseys: [...(state.jerseys || []), newJersey] };
      }),

      unassignJersey: (jerseyNumber) => set((state) => ({
        jerseys: (state.jerseys || []).map((j) =>
          j.jerseyNumber === jerseyNumber
            ? { ...j, playerId: null, status: 'available' }
            : j
        ),
      })),
    }),
    {
      name: 'katfc-equipment-storage',
      version: 1,
      storage: createJSONStorage(() => capacitorStorage),
      migrate: (persistedState: any) => {
        if (persistedState && Array.isArray(persistedState.items)) {
          const dummyIds = ['item_1', 'item_2', 'item_3', 'item_4', 'item_5'];
          persistedState.items = persistedState.items.filter(
            (i: any) => !dummyIds.includes(i.id)
          );
        }
        return persistedState;
      },
    }
  )
);
