import { ChatState, ChatMessage } from "@/types/chatType";
import axios from "axios";
import { create } from "zustand";

// const API_END_POINT = "http://localhost:8000/api/v1/chat";
const API_END_POINT = "https://quickbite-ogw0.onrender.com/api/v1/chat";
axios.defaults.withCredentials = true;

export const useChatStore = create<ChatState>((set) => ({
    loading: false,
    messages: [],

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
