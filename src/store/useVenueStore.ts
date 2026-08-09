import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Venue } from '../types';

interface VenueState {
  venues: Venue[];
  addVenue: (venue: Omit<Venue, 'id'>) => void;
  updateVenue: (id: string, updates: Partial<Omit<Venue, 'id'>>) => void;
  deleteVenue: (id: string) => void;
}

export const useVenueStore = create<VenueState>()(
  persist(
    (set) => ({
      venues: [],
      addVenue: (venue) => set((state) => ({
        venues: [
          ...state.venues,
          {
            ...venue,
            id: crypto.randomUUID(),
          },
        ],
      })),
      updateVenue: (id, updates) => set((state) => ({
        venues: state.venues.map((v) =>
          v.id === id ? { ...v, ...updates } : v
        ),
      })),
      deleteVenue: (id) => set((state) => ({
        venues: state.venues.filter((v) => v.id !== id),
      })),
    }),
    {
      name: 'katfc-venues-storage',
    }
  )
);
