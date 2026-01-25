import { create } from "zustand";
import toast from "react-hot-toast";
import { useDoctorAuthStore } from "../Doctor/useDoctorAuthStore.js";
import { axiosInstance } from "../../../../../web_frontend/src/lib/axios.js";

export const useDoctorChatStore = create((set, get) => ({
  messages: [],
  selectedUser: null, // Expecting { user: {...} }

  isMessagesLoading: false,

  getUsersForSidebar: async () => {
    try {
      const res = await axiosInstance.get("/api/doctor/messages/users");
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load users");
      return [];
    }
  },

  getMessages: async (userId) => {
    if (!userId) {
      toast.error("No user selected");
      return;
    }

    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/api/doctor/messages/${userId}`);
      set({ messages: res.data });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const userId = selectedUser?.user?._id;

    if (!userId) {
      toast.error("No user selected");
      return;
    }

    try {
      const res = await axiosInstance.post(
        `/api/doctor/messages/send/${userId}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message");
    }
  },

  setSelectedUser: (user) => {
    console.log("Setting selectedUser:", user);
    set({ selectedUser: user });
  },

  subscribeToMessages: () => {
    const socket = useDoctorAuthStore.getState().socket;
    const selectedUser = get().selectedUser;
    const userId = selectedUser?.user?._id;

    if (!socket || !userId) return;

    socket.on("newMessage", (newMessage) => {
      if (
        newMessage.senderId === userId ||
        newMessage.receiverId === userId
      ) {
        set({ messages: [...get().messages, newMessage] });
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useDoctorAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
  },
}));
