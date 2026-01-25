import { create } from "zustand";
import { persist } from "zustand/middleware";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5050";

export const useDoctorAuthStore = create(
  persist(
    (set, get) => ({
      authDoctor: null,
      socket: null,
      onlineUsers: [],
      _hasHydrated: false, // ✅ NEW

      setAuthDoctor: (doctor) => set({ authDoctor: doctor }),

      connectSocket: () => {
        const doctor = get().authDoctor;
        if (!doctor || !doctor._id || get().socket) return;

        const socket = io(BASE_URL, {
          auth: { userId: doctor._id },
        });

        set({ socket });

        socket.on("getOnlineUsers", (users) => {
          set({ onlineUsers: users });
        });
      },

      disconnectSocket: () => {
        const socket = get().socket;
        if (socket) socket.disconnect();
        set({ socket: null });
      },
    }),
    {
      name: "doctor-auth-storage",
      partialize: (state) => ({ authDoctor: state.authDoctor }),
      onRehydrateStorage: () => (state) => {
        state._hasHydrated = true; // ✅ hydrate flag set here
      },
    }
  )
);
