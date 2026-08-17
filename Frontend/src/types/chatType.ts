export interface ChatUser {
    _id: string;
    fullname: string;
    email: string;
    profilePicture?: string;
}

export interface ChatMessage {
    _id: string;
    order: string;
    sender: ChatUser;
    text: string;
    createdAt: string;
    updatedAt: string;
}

export type ChatState = {
    loading: boolean;
    messages: ChatMessage[];
    activeChatOrderId: string | null;
    isChatOpen: boolean;
    openChat: (orderId: string) => void;
    closeChat: () => void;
    fetchMessages: (orderId: string) => Promise<void>;
    sendMessage: (orderId: string, text: string) => Promise<void>;
    addLocalMessage: (message: ChatMessage) => void;
};

