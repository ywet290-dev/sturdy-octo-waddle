"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { Send, ArrowLeft, ShieldAlert, ChevronDown, ChevronUp } from "lucide-react";
import TopBar from "@/components/TopBar";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function MessagesContent() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [selectedPartnerName, setSelectedPartnerName] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [showBlocked, setShowBlocked] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize selectedPartner from URL if present
  useEffect(() => {
    const chatParam = searchParams.get("chat");
    const nameParam = searchParams.get("name");
    if (chatParam) {
      setSelectedPartner(chatParam);
      if (nameParam) setSelectedPartnerName(nameParam);
    }
  }, [searchParams]);

  const conversations = useQuery(
    api.messages.getConversations,
    user ? { userId: user.id } : "skip"
  );

  const currentChat = useQuery(
    api.messages.getConversation,
    user && selectedPartner
      ? { userId1: user.id, userId2: selectedPartner }
      : "skip"
  );

  const blockedUsers = useQuery(
    api.users.getBlockedUsers,
    user ? { clerkId: user.id } : "skip"
  );

  const sendMessage = useMutation(api.messages.sendMessage);
  const markAsRead = useMutation(api.messages.markAsRead);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (user && selectedPartner) {
      markAsRead({ senderId: selectedPartner, receiverId: user.id });
    }
  }, [user, selectedPartner, currentChat, markAsRead]);

  const handleSend = async () => {
    if (!messageText.trim() || !user || !selectedPartner) return;
    await sendMessage({
      senderId: user.id,
      receiverId: selectedPartner,
      text: messageText,
    });
    setMessageText("");
  };

  if (!user) return null;

  const selectedConvo = conversations?.find(
    (c) => c.partnerId === selectedPartner
  );

  const blockedUserIds = blockedUsers?.map(u => u.clerkId) || [];
  
  const normalConversations = conversations?.filter(c => !blockedUserIds.includes(c.partnerId)) || [];
  const blockedConversations = conversations?.filter(c => blockedUserIds.includes(c.partnerId)) || [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <TopBar />
      <div className="max-w-6xl mx-auto flex h-[calc(100vh-64px)]">
        {/* Conversations List */}
        <div
          className={`w-full md:w-80 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col ${selectedPartner ? "hidden md:flex" : "flex"}`}
        >
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-bold">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations?.length === 0 && (
              <p className="text-zinc-500 text-sm p-4">
                No conversations yet. Visit a profile to start chatting!
              </p>
            )}
            {normalConversations.map((convo) => (
              <button
                key={convo.partnerId}
                onClick={() => setSelectedPartner(convo.partnerId)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left ${selectedPartner === convo.partnerId ? "bg-zinc-100 dark:bg-zinc-800" : ""}`}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                    {convo.partnerImage ? (
                      <img
                        src={convo.partnerImage}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      convo.partnerName?.[0]?.toUpperCase() || "?"
                    )}
                  </div>
                  {convo.partnerOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-zinc-900" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm truncate">
                      {convo.partnerName || "Unknown User"}
                    </span>
                    {convo.unreadCount > 0 && (
                      <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                        {convo.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 truncate">
                    {convo.lastMessage}
                  </p>
                </div>
              </button>
            ))}

            {blockedConversations.length > 0 && (
              <div className="mt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={() => setShowBlocked(!showBlocked)}
                  className="w-full p-4 flex items-center justify-between text-sm font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <ShieldAlert size={16} /> Blocked Messages ({blockedConversations.length})
                  </span>
                  {showBlocked ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showBlocked && (
                  <div className="bg-zinc-50 dark:bg-zinc-900/50">
                    {blockedConversations.map((convo) => (
                      <button
                        key={convo.partnerId}
                        onClick={() => setSelectedPartner(convo.partnerId)}
                        className={`w-full p-4 flex items-center gap-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left opacity-75 ${selectedPartner === convo.partnerId ? "bg-zinc-200 dark:bg-zinc-800 opacity-100" : ""}`}
                      >
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-400 to-zinc-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden grayscale">
                            {convo.partnerImage ? (
                              <img
                                src={convo.partnerImage}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              convo.partnerName?.[0]?.toUpperCase() || "?"
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-sm truncate text-zinc-600 dark:text-zinc-400">
                              {convo.partnerName || "Unknown User"}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 truncate">
                            {convo.lastMessage}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div
          className={`flex-1 flex flex-col ${selectedPartner ? "flex" : "hidden md:flex"}`}
        >
          {selectedPartner ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-3">
                <button
                  onClick={() => setSelectedPartner(null)}
                  className="md:hidden p-1"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs overflow-hidden">
                    {selectedConvo?.partnerImage ? (
                      <img
                        src={selectedConvo.partnerImage}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      selectedConvo?.partnerName?.[0]?.toUpperCase() || "?"
                    )}
                  </div>
                  {selectedConvo?.partnerOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-zinc-900" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {selectedConvo?.partnerName || selectedPartnerName || "Unknown User"}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {selectedConvo?.partnerOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {currentChat?.map((msg: Doc<"messages">) => (
                  <div
                    key={msg._id}
                    className={`flex ${msg.senderId === user.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${msg.senderId === user.id ? "bg-blue-600 text-white rounded-br-md" : "bg-zinc-200 dark:bg-zinc-800 rounded-bl-md"}`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 bg-transparent outline-none focus:border-blue-500 transition-colors text-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!messageText.trim()}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-500">
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950"><TopBar /></div>}>
      <MessagesContent />
    </Suspense>
  );
}
