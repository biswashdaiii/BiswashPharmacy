import { create } from "zustand";
import { io } from "socket.io-client";
import { persist } from "zustand/middleware";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://192.168.226.1:5050";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      authUser: null,
      socket: null,
      onlineUsers: [],

      setAuthUser: (user) => set({ authUser: user }),

      connectSocket: () => {
        const user = get().authUser;

        // ✅ Prevent connection if user or user._id is not defined
        if (!user || !user._id || get().socket) {
          console.warn("🔌 Skipping socket connection: user._id is missing or socket already connected.");
          return;
        }

        console.log("🔌 Connecting socket for userId:", user._id);

        const socket = io(BASE_URL, {
          query: { userId: user._id },
        });

        set({ socket });

        socket.on("getOnlineUsers", (users) => {
          set({ onlineUsers: users });
        });
      },

      disconnectSocket: () => {
        const socket = get().socket;
        if (socket) {
          socket.disconnect();
          console.log("🔌 Socket disconnected");
        }
        set({ socket: null });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ authUser: state.authUser }), // Persist only authUser
    }
  )
);
