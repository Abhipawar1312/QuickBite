import React, { useEffect, useState, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatStore } from "@/store/useChatStore";
import { io } from "socket.io-client";
import { Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatPanelProps {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  orderId,
  open,
  onOpenChange,
  currentUserId,
}) => {
  const { messages, fetchMessages, sendMessage, addLocalMessage, loading } = useChatStore();
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch past messages when the panel opens
  useEffect(() => {
    if (open && orderId) {
      fetchMessages(orderId);
    }
  }, [open, orderId, fetchMessages]);

  // Real-time: Join order chat room and listen for incoming messages
  useEffect(() => {
    if (!open || !orderId) return;

    const socket = io("http://localhost:8000");
    socket.emit("join_order", orderId);

    socket.on("new_chat_message", (message: any) => {
      addLocalMessage(message);
    });

    return () => {
      socket.disconnect();
    };
  }, [open, orderId, addLocalMessage]);

  // Scroll to bottom when messages list changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !orderId) return;
    
    const textToSend = inputText.trim();
    setInputText("");
    await sendMessage(orderId, textToSend);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col h-full w-full sm:max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-0 z-[1001]">
        {/* Header */}
        <SheetHeader className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-1 shrink-0">
          <SheetTitle className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            💬 Live Delivery Chat
          </SheetTitle>
          <SheetDescription className="text-xs text-slate-500">
            Chat is active during your delivery run
          </SheetDescription>
        </SheetHeader>

        {/* Message Logs Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/20">
          {loading && messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-600 px-4">
              <span className="text-4xl mb-2">👋</span>
              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">Start the conversation</h4>
              <p className="text-xs mt-1">Send a message to coordinate the delivery location!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => {
                  const isMe = msg.sender?._id === currentUserId;
                  return (
                    <motion.div
                      key={msg._id || idx}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {!isMe && (
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                            {msg.sender?.fullname}
                          </span>
                        )}
                        <span className="text-[8px] text-slate-400 font-medium">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed ${
                          isMe
                            ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-tr-none shadow-md"
                            : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none shadow-sm"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Footer Area */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2 shrink-0 items-center">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-slate-50 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 rounded-xl py-3 text-sm h-11"
            required
          />
          <Button
            type="submit"
            size="icon"
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl w-11 h-11 shadow-md shrink-0 flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
};
