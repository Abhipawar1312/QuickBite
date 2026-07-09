import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChatPanel } from "../ChatPanel";
import { useChatStore } from "@/store/useChatStore";

const mockFetchMessages = jest.fn();
const mockSendMessage = jest.fn();
const mockAddLocalMessage = jest.fn();

jest.mock("@/store/useChatStore", () => ({
    useChatStore: jest.fn(() => ({
        messages: [],
        fetchMessages: mockFetchMessages,
        sendMessage: mockSendMessage,
        addLocalMessage: mockAddLocalMessage,
        loading: false,
    })),
}));

// Mock socket.io-client
const mockSocket = {
    emit: jest.fn(),
    on: jest.fn(),
    disconnect: jest.fn(),
};
jest.mock("socket.io-client", () => ({
    io: jest.fn(() => mockSocket),
}));

describe("ChatPanel Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("does not render when open is false", () => {
        const { container } = render(
            <ChatPanel
                orderId="order1"
                open={false}
                onOpenChange={jest.fn()}
                currentUserId="user1"
            />
        );
        expect(container.firstChild).toBeNull();
    });

    test("renders header and messages list correctly", () => {
        const mockMessages = [
            {
                _id: "msg1",
                text: "Hello, rider!",
                sender: { _id: "user1", fullname: "Customer" },
                createdAt: new Date().toISOString(),
            },
            {
                _id: "msg2",
                text: "On my way!",
                sender: { _id: "rider1", fullname: "Rider" },
                createdAt: new Date().toISOString(),
            },
        ];

        (useChatStore as unknown as jest.Mock).mockReturnValue({
            messages: mockMessages,
            fetchMessages: mockFetchMessages,
            sendMessage: mockSendMessage,
            addLocalMessage: mockAddLocalMessage,
            loading: false,
        });

        // Mock scrollIntoView
        window.HTMLElement.prototype.scrollIntoView = jest.fn();

        render(
            <ChatPanel
                orderId="order1"
                open={true}
                onOpenChange={jest.fn()}
                currentUserId="user1"
            />
        );

        expect(screen.getByText("💬 Live Delivery Chat")).toBeInTheDocument();
        expect(screen.getByText("Hello, rider!")).toBeInTheDocument();
        expect(screen.getByText("On my way!")).toBeInTheDocument();
        expect(screen.getByText("Rider")).toBeInTheDocument();
        expect(mockFetchMessages).toHaveBeenCalledWith("order1");
    });

    test("allows sending a message", async () => {
        (useChatStore as unknown as jest.Mock).mockReturnValue({
            messages: [],
            fetchMessages: mockFetchMessages,
            sendMessage: mockSendMessage,
            addLocalMessage: mockAddLocalMessage,
            loading: false,
        });

        // Mock scrollIntoView
        window.HTMLElement.prototype.scrollIntoView = jest.fn();

        const { container } = render(
            <ChatPanel
                orderId="order1"
                open={true}
                onOpenChange={jest.fn()}
                currentUserId="user1"
            />
        );

        const input = screen.getByPlaceholderText(/type a message/i);
        fireEvent.change(input, { target: { value: "Please hurry up!" } });

        const sendBtn = document.body.querySelector('button[type="submit"]');
        expect(sendBtn).not.toBeNull();
        fireEvent.click(sendBtn!);

        await waitFor(() => {
            expect(mockSendMessage).toHaveBeenCalledWith("order1", "Please hurry up!");
        });
    });
});
