import { ChatState, ChatMessage } from "@/types/chatType";
import axios from "axios";
import { create } from "zustand";
import { API_END_POINTS } from "@/config/api";

const API_END_POINT = API_END_POINTS.CHAT;
axios.defaults.withCredentials = true;


export const useChatStore = create<ChatState>((set) => ({
    loading: false,
    messages: [],
    activeChatOrderId: null,
    isChatOpen: false,

    openChat: (orderId: string) => {
        set({ activeChatOrderId: orderId, isChatOpen: true });
    },

    closeChat: () => {
        set({ isChatOpen: false });
    },

    fetchMessages: async (orderId: string) => {

        try {
            set({ loading: true });
            const response = await axios.get(`${API_END_POINT}/${orderId}`);
            if (response.data.success) {
                set({ messages: response.data.messages, loading: false });
            } else {
                set({ loading: false });
            }
        } catch (error) {
            set({ loading: false });
        }
    },

    sendMessage: async (orderId: string, text: string) => {
        try {
            await axios.post(`${API_END_POINT}/${orderId}`, { text }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            // The response message will also be received via Socket.io broadcast to avoid duplicate entries.
        } catch (error) {
            console.error("sendMessage error:", error);
        }
    },

    addLocalMessage: (message: ChatMessage) => {
        set((state) => {
            // Avoid duplicates
            if (state.messages.some((msg) => msg._id === message._id)) {
                return state;
            }
            return { messages: [...state.messages, message] };
        });
    }
}));
