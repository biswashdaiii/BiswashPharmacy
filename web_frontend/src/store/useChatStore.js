import { create } from "zustand";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";
import {axiosInstance} from "../lib/axios";


export const useChatStore = create((set, get) => ({
  messages: [],
  selectedDoctor: null,
  isMessagesLoading: false,

  getMessages: async (doctorId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${doctorId}`);
      set({ messages: res.data });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedDoctor, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedDoctor._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message");
    }
  },

  setSelectedDoctor: (doctor) => set({ selectedDoctor: doctor }),

  subscribeToMessages: () => {
  const socket = useAuthStore.getState().socket;
  const selectedDoctor = get().selectedDoctor;
  const authUser = useAuthStore.getState().authUser;

  if (!socket || !selectedDoctor || !authUser) return;

  socket.off("newMessage"); // Remove previous listeners to prevent duplicates

  socket.on("newMessage", (newMessage) => {
    const isRelevant =
      (newMessage.senderId === authUser._id && newMessage.receiverId === selectedDoctor._id) ||
      (newMessage.receiverId === authUser._id && newMessage.senderId === selectedDoctor._id);

    if (isRelevant) {
      set((state) => ({ messages: [...state.messages, newMessage] }));
    }
  });
},



  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
  },
}));
