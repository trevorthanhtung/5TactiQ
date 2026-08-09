import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TrainingSession } from '../types';

interface TrainingState {
  sessions: TrainingSession[];
  addSession: (session: Omit<TrainingSession, 'id' | 'attendance'>) => void;
  updateSession: (id: string, updates: Partial<TrainingSession>) => void;
  deleteSession: (id: string) => void;
  updateAttendance: (sessionId: string, playerId: string, status: 'present' | 'absent' | 'late' | 'excused' | 'pending') => void;
}

export const useTrainingStore = create<TrainingState>()(
  persist(
    (set) => ({
      sessions: [],
      addSession: (session) => set((state) => ({
        sessions: [...state.sessions, {
          ...session,
          id: Date.now().toString(),
          attendance: {}
        }]
      })),
      updateSession: (id, updates) => set((state) => ({
        sessions: state.sessions.map(s => s.id === id ? { ...s, ...updates } : s)
      })),
      deleteSession: (id) => set((state) => ({
        sessions: state.sessions.filter(s => s.id !== id)
      })),
      updateAttendance: (sessionId, playerId, status) => set((state) => ({
        sessions: state.sessions.map(s => {
          if (s.id === sessionId) {
            return {
              ...s,
              attendance: {
                ...s.attendance,
                [playerId]: status
              }
            };
          }
          return s;
        })
      })),
    }),
    {
      name: 'katfc-training-storage',
    }
  )
);
